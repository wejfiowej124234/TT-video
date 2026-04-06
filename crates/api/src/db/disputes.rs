//! disputes 表：DbDisputeRow、insert_dispute、update_dispute_resolved、list_disputes（48 §6.8）

use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 插入争议（open dispute 时双写）
pub async fn insert_dispute(
    pool: &PgPool,
    id: Uuid,
    order_id: Uuid,
    status: &str,
    evidence_hashes: &JsonValue,
    arbitrator_id: Option<Uuid>,
    refund_ratio: Option<f64>,
    slash_guide: Option<bool>,
    resolved_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    arb_fee_paid: Option<&str>,
    dispute_sequence: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO disputes (id, order_id, status, evidence_hashes, arbitrator_id, refund_ratio, slash_guide, resolved_at, created_at, updated_at, arb_fee_paid, dispute_sequence)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
        "#,
    )
    .bind(id)
    .bind(order_id)
    .bind(status)
    .bind(evidence_hashes)
    .bind(arbitrator_id)
    .bind(refund_ratio)
    .bind(slash_guide)
    .bind(resolved_at)
    .bind(created_at)
    .bind(updated_at)
    .bind(arb_fee_paid)
    .bind(dispute_sequence)
    .execute(pool)
    .await?;
    Ok(())
}

/// 更新争议（resolve 时）
pub async fn update_dispute_resolved(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    arbitrator_id: Uuid,
    refund_ratio: f64,
    slash_guide: bool,
    resolved_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE disputes SET status = $1, arbitrator_id = $2, refund_ratio = $3, slash_guide = $4, resolved_at = $5, updated_at = $6 WHERE id = $7",
    )
    .bind(status)
    .bind(arbitrator_id)
    .bind(refund_ratio)
    .bind(slash_guide)
    .bind(resolved_at)
    .bind(updated_at)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

/// 争议行（用于 hydrate）
#[derive(Debug)]
pub struct DbDisputeRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub status: String,
    pub evidence_hashes: JsonValue,
    pub arbitrator_id: Option<Uuid>,
    pub refund_ratio: Option<f64>,
    pub slash_guide: Option<bool>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub arb_fee_paid: Option<String>,
    pub dispute_sequence: i32,
}

/// 加载所有争议（启动 hydrate）
pub async fn list_disputes(pool: &PgPool) -> Result<Vec<DbDisputeRow>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        order_id: Uuid,
        status: String,
        evidence_hashes: JsonValue,
        arbitrator_id: Option<Uuid>,
        refund_ratio: Option<f64>,
        slash_guide: Option<bool>,
        resolved_at: Option<DateTime<Utc>>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
        arb_fee_paid: Option<String>,
        dispute_sequence: i32,
    }
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, order_id, status, evidence_hashes, arbitrator_id, refund_ratio, slash_guide, resolved_at, created_at, updated_at, arb_fee_paid, dispute_sequence FROM disputes",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| DbDisputeRow {
            id: r.id,
            order_id: r.order_id,
            status: r.status,
            evidence_hashes: r.evidence_hashes,
            arbitrator_id: r.arbitrator_id,
            refund_ratio: r.refund_ratio,
            slash_guide: r.slash_guide,
            resolved_at: r.resolved_at,
            created_at: r.created_at,
            updated_at: r.updated_at,
            arb_fee_paid: r.arb_fee_paid,
            dispute_sequence: r.dispute_sequence,
        })
        .collect())
}
