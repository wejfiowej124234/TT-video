//! OnboardingFeeReceiver `OnboardingFeePaid` 投影表（96-18、110）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OnboardingFeePaidEventRow {
    pub id: Uuid,
    pub chain_id: i64,
    pub block_number: i64,
    pub log_index: i32,
    pub block_hash: String,
    pub tx_hash: String,
    pub receiver_address: String,
    pub idempotency_key_hex: String,
    pub payer_address: String,
    pub role_target: i16,
    pub token_address: String,
    pub amount_u256_hex: String,
    pub fee_schedule_version_hex: String,
    pub inserted_at: DateTime<Utc>,
}

pub async fn insert_onboarding_fee_paid_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    receiver_address: &str,
    idempotency_key_hex: &str,
    payer_address: &str,
    role_target: i16,
    token_address: &str,
    amount_u256_hex: &str,
    fee_schedule_version_hex: &str,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        INSERT INTO onboarding_fee_paid_events (
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            receiver_address, idempotency_key_hex, payer_address, role_target,
            token_address, amount_u256_hex, fee_schedule_version_hex
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(receiver_address)
    .bind(idempotency_key_hex)
    .bind(payer_address)
    .bind(role_target)
    .bind(token_address)
    .bind(amount_u256_hex)
    .bind(fee_schedule_version_hex)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn delete_onboarding_fee_paid_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    from_block_inclusive: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM onboarding_fee_paid_events WHERE chain_id = $1 AND block_number >= $2",
    )
    .bind(chain_id)
    .bind(from_block_inclusive)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
