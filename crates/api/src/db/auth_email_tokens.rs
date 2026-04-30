//! `auth_email_tokens`：邮箱验证 / 密码重置单次令牌（仅存 HMAC-SHA256 hex）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

pub const PURPOSE_EMAIL_VERIFY: &str = "email_verify";
pub const PURPOSE_PASSWORD_RESET: &str = "password_reset";

pub async fn insert_token(
    pool: &PgPool,
    user_id: Uuid,
    purpose: &str,
    token_hash: &str,
    expires_at: DateTime<Utc>,
) -> Result<Uuid, sqlx::Error> {
    let row: (Uuid,) = sqlx::query_as(
        r#"
        INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(purpose)
    .bind(token_hash)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

/// 删除单行令牌（**Resend 等出站失败回滚**：令牌不得留在库内却未投递）。
pub async fn delete_auth_email_token_by_id(pool: &PgPool, id: Uuid) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(r#"DELETE FROM auth_email_tokens WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(r.rows_affected())
}

/// 将同一用户同用途下尚未消费的行标记为已消费（再发新令牌前调用）。
pub async fn consume_unfinished_for_user_purpose(
    pool: &PgPool,
    user_id: Uuid,
    purpose: &str,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        UPDATE auth_email_tokens
        SET consumed_at = now()
        WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
        "#,
    )
    .bind(user_id)
    .bind(purpose)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

#[derive(Debug, Clone)]
pub struct AuthEmailTokenRow {
    pub id: Uuid,
    pub user_id: Uuid,
}

pub async fn find_valid_token(
    pool: &PgPool,
    token_hash: &str,
    purpose: &str,
) -> Result<Option<AuthEmailTokenRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (Uuid, Uuid)>(
        r#"
        SELECT id, user_id FROM auth_email_tokens
        WHERE token_hash = $1 AND purpose = $2
          AND consumed_at IS NULL
          AND expires_at > now()
        LIMIT 1
        "#,
    )
    .bind(token_hash)
    .bind(purpose)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|(id, user_id)| AuthEmailTokenRow { id, user_id }))
}

pub async fn mark_consumed(pool: &PgPool, id: Uuid) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        UPDATE auth_email_tokens SET consumed_at = now()
        WHERE id = $1 AND consumed_at IS NULL
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

/// 消费邮箱验证令牌并写入 `users.email_verified_at`（单事务；令牌 UPDATE 须 **恰好 `1`** 行，**`0`** 行 → **`Ok(false)`**，**`>1`** 行 → **`Err(Protocol)`**（回滚）；**`users`** UPDATE 非 **`1`** 行则回滚并 **`Ok(false)`**，避免「令牌已消费、邮箱未写入」）。
pub async fn consume_email_verify_token_and_mark_user_verified(
    pool: &PgPool,
    token_row_id: Uuid,
    user_id: Uuid,
    verified_at: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let r1 = sqlx::query(
        r#"
        UPDATE auth_email_tokens SET consumed_at = now()
        WHERE id = $1 AND user_id = $2 AND purpose = $3
          AND consumed_at IS NULL AND expires_at > now()
        "#,
    )
    .bind(token_row_id)
    .bind(user_id)
    .bind(PURPOSE_EMAIL_VERIFY)
    .execute(&mut *tx)
    .await?;
    let token_rows = r1.rows_affected();
    if token_rows == 0 {
        tx.rollback().await?;
        return Ok(false);
    }
    if token_rows != 1 {
        tx.rollback().await?;
        return Err(sqlx::Error::Protocol(
            format!(
                "auth_email_tokens: email_verify token row update expected exactly 1 row, got {token_rows}"
            )
            .into(),
        ));
    }
    let n =
        sqlx::query(r#"UPDATE users SET email_verified_at = $1, updated_at = now() WHERE id = $2"#)
            .bind(verified_at)
            .bind(user_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();
    if n != 1 {
        tx.rollback().await?;
        return Ok(false);
    }
    tx.commit().await?;
    Ok(true)
}

/// 消费密码重置令牌、更新密码哈希并吊销该用户全部会话（单事务；令牌 UPDATE 须 **恰好 `1`** 行，**`0`** → **`Ok(false)`**，**`>1`** → **`Err(Protocol)`**（回滚）；**`users`** 密码 UPDATE 非 **`1`** 行则回滚并 **`Ok(false)`**）。
pub async fn consume_password_reset_token_and_rotate_password(
    pool: &PgPool,
    token_row_id: Uuid,
    user_id: Uuid,
    new_password_hash: &str,
) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let r1 = sqlx::query(
        r#"
        UPDATE auth_email_tokens SET consumed_at = now()
        WHERE id = $1 AND user_id = $2 AND purpose = $3
          AND consumed_at IS NULL AND expires_at > now()
        "#,
    )
    .bind(token_row_id)
    .bind(user_id)
    .bind(PURPOSE_PASSWORD_RESET)
    .execute(&mut *tx)
    .await?;
    let token_rows = r1.rows_affected();
    if token_rows == 0 {
        tx.rollback().await?;
        return Ok(false);
    }
    if token_rows != 1 {
        tx.rollback().await?;
        return Err(sqlx::Error::Protocol(
            format!(
                "auth_email_tokens: password_reset token row update expected exactly 1 row, got {token_rows}"
            )
            .into(),
        ));
    }
    let n = sqlx::query(r#"UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2"#)
        .bind(new_password_hash)
        .bind(user_id)
        .execute(&mut *tx)
        .await?
        .rows_affected();
    if n != 1 {
        tx.rollback().await?;
        return Ok(false);
    }
    crate::db::revoke_all_sessions_for_user(&mut *tx, user_id, "password_reset").await?;
    tx.commit().await?;
    Ok(true)
}

/// Delete old consumed/expired auth email tokens for table size control.
/// Returns deleted rows.
pub async fn delete_stale_auth_email_tokens(
    pool: &PgPool,
    retain_days: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        DELETE FROM auth_email_tokens
        WHERE
            (consumed_at IS NOT NULL AND consumed_at < now() - ($1::bigint * interval '1 day'))
            OR
            (expires_at < now() - ($1::bigint * interval '1 day'))
        "#,
    )
    .bind(retain_days)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
