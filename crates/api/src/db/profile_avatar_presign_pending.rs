//! 对象存储头像预签名审计行（`profile_avatar_presign_pending`）：对账未 commit 的 PUT 对象。

use sqlx::{Executor, PgPool, Postgres};
use uuid::Uuid;

/// 预签名成功后写入；同一 `avatar_url` 重复插入时刷新 `created_at`（幂等重试）。
pub async fn upsert_profile_avatar_presign_pending(
    pool: &PgPool,
    user_id: Uuid,
    avatar_url: &str,
    object_key: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO profile_avatar_presign_pending (user_id, avatar_url, object_key)
        VALUES ($1, $2, $3)
        ON CONFLICT (avatar_url) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            object_key = EXCLUDED.object_key,
            created_at = now()
        "#,
    )
    .bind(user_id)
    .bind(avatar_url)
    .bind(object_key)
    .execute(pool)
    .await?;
    Ok(())
}

/// 与 [`delete_profile_avatar_presign_pending_for_url`] 同源；**`executor`** 可为 **`&PgPool`**、**`&mut Transaction<Postgres>`**，供 **`users`** 更新 **同事务** 复用（AUD-ME-PUT-PRESIGN-001）。
pub async fn delete_profile_avatar_presign_pending_for_url_executor<'e, E>(
    executor: E,
    user_id: Uuid,
    avatar_url: &str,
) -> Result<u64, sqlx::Error>
where
    E: Executor<'e, Database = Postgres>,
{
    let r = sqlx::query(
        "DELETE FROM profile_avatar_presign_pending WHERE user_id = $1 AND avatar_url = $2",
    )
    .bind(user_id)
    .bind(avatar_url)
    .execute(executor)
    .await?;
    Ok(r.rows_affected())
}

/// `users.avatar_url` 已成功持久化后移除待对账行（`PUT /me` / commit / 本机路径同源）。
pub async fn delete_profile_avatar_presign_pending_for_url(
    pool: &PgPool,
    user_id: Uuid,
    avatar_url: &str,
) -> Result<u64, sqlx::Error> {
    delete_profile_avatar_presign_pending_for_url_executor(pool, user_id, avatar_url).await
}
