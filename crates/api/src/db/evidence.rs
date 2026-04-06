//! evidence_receipts 表：列表、插入（01 §6、04 需落库实体；50-EV1）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 单条证据回执行（用于 hydrate）
#[derive(Debug)]
pub struct DbEvidenceReceiptRow {
    pub order_id: Uuid,
    pub uploader_id: Uuid,
    pub content_hash: String,
    pub schema_version: Option<String>,
    pub prompt_version: Option<String>,
    pub snapshot_hash: Option<String>,
    pub quote_hash: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// 按订单列出证据回执（启动 hydrate 用）
pub async fn list_evidence_receipts_by_order(
    pool: &PgPool,
    order_id: Uuid,
) -> Result<Vec<DbEvidenceReceiptRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, String, Option<String>, Option<String>, Option<String>, Option<String>, DateTime<Utc>)>(
        "SELECT order_id, uploader_id, content_hash, schema_version, prompt_version, snapshot_hash, quote_hash, created_at FROM evidence_receipts WHERE order_id = $1 ORDER BY created_at",
    )
    .bind(order_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                order_id,
                uploader_id,
                content_hash,
                schema_version,
                prompt_version,
                snapshot_hash,
                quote_hash,
                created_at,
            )| DbEvidenceReceiptRow {
                order_id,
                uploader_id,
                content_hash,
                schema_version,
                prompt_version,
                snapshot_hash,
                quote_hash,
                created_at,
            },
        )
        .collect())
}

/// 加载所有证据回执（按 order_id 分组，供 hydrate 填充 store.evidence_receipts）
pub async fn list_all_evidence_receipts(
    pool: &PgPool,
) -> Result<Vec<DbEvidenceReceiptRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, String, Option<String>, Option<String>, Option<String>, Option<String>, DateTime<Utc>)>(
        "SELECT order_id, uploader_id, content_hash, schema_version, prompt_version, snapshot_hash, quote_hash, created_at FROM evidence_receipts ORDER BY order_id, created_at",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                order_id,
                uploader_id,
                content_hash,
                schema_version,
                prompt_version,
                snapshot_hash,
                quote_hash,
                created_at,
            )| DbEvidenceReceiptRow {
                order_id,
                uploader_id,
                content_hash,
                schema_version,
                prompt_version,
                snapshot_hash,
                quote_hash,
                created_at,
            },
        )
        .collect())
}

/// 插入证据回执（POST 证据时双写）
pub async fn insert_evidence_receipt(
    pool: &PgPool,
    order_id: Uuid,
    uploader_id: Uuid,
    content_hash: &str,
    schema_version: Option<&str>,
    prompt_version: Option<&str>,
    snapshot_hash: Option<&str>,
    quote_hash: Option<&str>,
    created_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO evidence_receipts (order_id, uploader_id, content_hash, schema_version, prompt_version, snapshot_hash, quote_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(order_id)
    .bind(uploader_id)
    .bind(content_hash)
    .bind(schema_version)
    .bind(prompt_version)
    .bind(snapshot_hash)
    .bind(quote_hash)
    .bind(created_at)
    .execute(pool)
    .await?;
    Ok(())
}

/// 将 content_hash 追加到该订单关联的争议 evidence_hashes（与 chain_off 内存一致）
pub async fn append_evidence_hash_to_dispute(
    pool: &PgPool,
    order_id: Uuid,
    content_hash: &str,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "UPDATE disputes SET evidence_hashes = evidence_hashes || jsonb_build_array($1::text), updated_at = now() WHERE order_id = $2",
    )
    .bind(content_hash)
    .bind(order_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
