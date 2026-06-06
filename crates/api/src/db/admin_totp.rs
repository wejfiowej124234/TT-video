//! Admin 控制台 TOTP 登记（① 预备；② 与 `admin_2fa_policy.enforced` 联闸）。

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct AdminTotpEnrollmentRow {
    pub user_id: Uuid,
    pub secret_base32: String,
    pub verified_at: Option<DateTime<Utc>>,
}

pub async fn get_admin_totp_enrollment(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<AdminTotpEnrollmentRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminTotpEnrollmentRow>(
        r#"
        SELECT user_id, secret_base32, verified_at
        FROM admin_totp_enrollments
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn upsert_admin_totp_enrollment_pending(
    pool: &PgPool,
    user_id: Uuid,
    secret_base32: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO admin_totp_enrollments (user_id, secret_base32, verified_at, updated_at)
        VALUES ($1, $2, NULL, now())
        ON CONFLICT (user_id) DO UPDATE SET
            secret_base32 = EXCLUDED.secret_base32,
            verified_at = NULL,
            updated_at = now()
        "#,
    )
    .bind(user_id)
    .bind(secret_base32)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn mark_admin_totp_verified(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE admin_totp_enrollments
        SET verified_at = now(), updated_at = now()
        WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn admin_totp_table_exists(pool: &PgPool) -> bool {
    sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'admin_totp_enrollments'
        )
        "#,
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}
