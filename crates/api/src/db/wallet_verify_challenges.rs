use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct WalletVerifyChallengeRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub wallet_address: String,
    pub message: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct WalletVerifyLatestStatusRow {
    pub wallet_address: String,
    pub verified_at: DateTime<Utc>,
}

pub async fn insert_wallet_verify_challenge(
    pool: &PgPool,
    user_id: Uuid,
    wallet_address: &str,
    nonce: &str,
    message: &str,
    expires_at: DateTime<Utc>,
) -> Result<Uuid, sqlx::Error> {
    let row: (Uuid,) = sqlx::query_as(
        r#"
        INSERT INTO wallet_verify_challenges (user_id, wallet_address, nonce, message, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(wallet_address)
    .bind(nonce)
    .bind(message)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn find_valid_wallet_verify_challenge(
    pool: &PgPool,
    challenge_id: Uuid,
    user_id: Uuid,
) -> Result<Option<WalletVerifyChallengeRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (Uuid, Uuid, String, String, DateTime<Utc>)>(
        r#"
        SELECT id, user_id, wallet_address, message, expires_at
        FROM wallet_verify_challenges
        WHERE id = $1
          AND user_id = $2
          AND consumed_at IS NULL
          AND verified_at IS NULL
          AND expires_at > now()
        LIMIT 1
        "#,
    )
    .bind(challenge_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(
        |(id, uid, wallet_address, message, expires_at)| WalletVerifyChallengeRow {
            id,
            user_id: uid,
            wallet_address,
            message,
            expires_at,
        },
    ))
}

pub async fn consume_wallet_verify_challenge_success(
    pool: &PgPool,
    challenge_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        UPDATE wallet_verify_challenges
        SET consumed_at = now(), verified_at = now()
        WHERE id = $1
          AND consumed_at IS NULL
          AND verified_at IS NULL
          AND expires_at > now()
        "#,
    )
    .bind(challenge_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

pub async fn has_recent_verified_wallet_challenge(
    pool: &PgPool,
    user_id: Uuid,
    wallet_address: &str,
    max_age_secs: i64,
) -> Result<bool, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint
        FROM wallet_verify_challenges
        WHERE user_id = $1
          AND lower(wallet_address) = lower($2)
          AND verified_at IS NOT NULL
          AND verified_at >= now() - ($3::bigint * interval '1 second')
        "#,
    )
    .bind(user_id)
    .bind(wallet_address)
    .bind(max_age_secs)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}

pub async fn get_latest_verified_wallet_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<WalletVerifyLatestStatusRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (String, DateTime<Utc>)>(
        r#"
        SELECT wallet_address, verified_at
        FROM wallet_verify_challenges
        WHERE user_id = $1
          AND verified_at IS NOT NULL
        ORDER BY verified_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(
        |(wallet_address, verified_at)| WalletVerifyLatestStatusRow {
            wallet_address,
            verified_at,
        },
    ))
}

/// Delete stale wallet verification challenges for table size control.
/// Returns deleted rows.
pub async fn delete_stale_wallet_verify_challenges(
    pool: &PgPool,
    retain_days: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        DELETE FROM wallet_verify_challenges
        WHERE
            (verified_at IS NOT NULL AND verified_at < now() - ($1::bigint * interval '1 day'))
            OR
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
