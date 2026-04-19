//! 对账报告只追加表 `reconciliation_reports`（04 附录、110）
//!
//! **B-155**：**`orders_chain_health_trend_snapshot`**（锚 **`155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1`**）在 **`persist:true`** 时写入 **`summary`**，由 **`merge_orders_chain_health_trend_snapshot`** 自上一份报告滚动 **`by_batch`/`by_day`**。

use chrono::{DateTime, Datelike, Utc};
use serde_json::{json, Value};
use sqlx::postgres::PgPool;
use sqlx::types::Json;
use uuid::Uuid;

/// **B-155** 时间序列壳（与 **`153-ORDERS-CHAIN-HEALTH-OBS-V1`** 标量同源，**仅** persist 滚动）。
pub const ORDERS_CHAIN_HEALTH_TREND_SNAPSHOT_ANCHOR: &str =
    "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1";
const ORDERS_CHAIN_HEALTH_TREND_MAX_BATCH: usize = 90;
const ORDERS_CHAIN_HEALTH_TREND_MAX_DAY: usize = 90;

/// internal **indexer-reconcile** 持久化摘要所用 `report_type`
pub const REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS: &str = "orders_projection_vs_orders";

pub async fn insert_reconciliation_report(
    pool: &PgPool,
    report_type: &str,
    chain_id: Option<i64>,
    summary: &Value,
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        INSERT INTO reconciliation_reports (report_type, chain_id, summary)
        VALUES ($1, $2, $3)
        RETURNING id
        "#,
    )
    .bind(report_type)
    .bind(chain_id)
    .bind(Json(summary))
    .fetch_one(pool)
    .await
}

/// 与 [`insert_reconciliation_report`] 相同，但 **主键 `id` 预分配**（供 **B-155** 批次点写入 **`report_id`** 与 **`summary`** 同条 INSERT）。
pub async fn insert_reconciliation_report_with_id(
    pool: &PgPool,
    id: Uuid,
    report_type: &str,
    chain_id: Option<i64>,
    summary: &Value,
) -> Result<Uuid, sqlx::Error> {
    let row_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO reconciliation_reports (id, report_type, chain_id, summary)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        "#,
    )
    .bind(id)
    .bind(report_type)
    .bind(chain_id)
    .bind(Json(summary))
    .fetch_one(pool)
    .await?;
    debug_assert_eq!(row_id, id);
    Ok(row_id)
}

fn orders_chain_health_observability_usable_for_trend(health: &Value) -> bool {
    health.get("observation_note").is_none()
        && health
            .get("orders_total")
            .and_then(|v| v.as_i64())
            .is_some()
}

fn trend_point_from_health(health: &Value, report_id: Uuid, captured_at: DateTime<Utc>) -> Value {
    json!({
        "report_id": report_id.to_string(),
        "captured_at": captured_at.to_rfc3339(),
        "expected_chain_id": health.get("expected_chain_id"),
        "orders_total": health.get("orders_total"),
        "orders_null_chain_id_total": health.get("orders_null_chain_id_total"),
        "orders_chain_id_mismatch_total": health.get("orders_chain_id_mismatch_total"),
        "orders_aligned_expected_total": health.get("orders_aligned_expected_total"),
        "null_ratio": health.get("null_ratio"),
        "mismatch_ratio": health.get("mismatch_ratio"),
    })
}

/// **B-155**：自上一份 **`summary.orders_chain_health_trend_snapshot`** 与当前 **`orders_chain_health_observability`** 合并（**`by_batch`** 每 persist 一点；**`by_day`** 按 **UTC 日历日**保留当日最后一点）。
///
/// **`health`** 非成功体（含 **`observation_note`** 或缺 **`orders_total`**）时：**不**追加点，返回 **上一份** 趋势克隆（若无则空壳）。
pub fn merge_orders_chain_health_trend_snapshot(
    prev: Option<&Value>,
    health: &Value,
    report_id: Uuid,
    captured_at: DateTime<Utc>,
) -> Value {
    if !orders_chain_health_observability_usable_for_trend(health) {
        if let Some(p) = prev {
            if p.get("anchor").and_then(|a| a.as_str())
                == Some(ORDERS_CHAIN_HEALTH_TREND_SNAPSHOT_ANCHOR)
            {
                return p.clone();
            }
        }
        return json!({
            "anchor": ORDERS_CHAIN_HEALTH_TREND_SNAPSHOT_ANCHOR,
            "schema_version": 1_i64,
            "max_batch_points_kept": ORDERS_CHAIN_HEALTH_TREND_MAX_BATCH as i64,
            "max_day_points_kept": ORDERS_CHAIN_HEALTH_TREND_MAX_DAY as i64,
            "merge_note": "health_snapshot_not_advanced",
            "by_batch": [],
            "by_day": [],
            "getter_note": "Appends on POST …/internal/indexer-reconcile persist:true when orders_chain_health_observability is query-ok; else carries forward prior series if anchor matches.",
        });
    }

    let new_expected = health.get("expected_chain_id").and_then(|v| v.as_i64());

    let (mut by_batch, mut by_day) = if let Some(p) = prev {
        if p.get("anchor").and_then(|a| a.as_str()) == Some(ORDERS_CHAIN_HEALTH_TREND_SNAPSHOT_ANCHOR)
        {
            let batch = p
                .get("by_batch")
                .and_then(|v| v.as_array())
                .cloned()
                .unwrap_or_default();
            let day = p
                .get("by_day")
                .and_then(|v| v.as_array())
                .cloned()
                .unwrap_or_default();
            let reset = batch.last().and_then(|last| {
                let last_ec = last.get("expected_chain_id").and_then(|v| v.as_i64());
                match (last_ec, new_expected) {
                    (Some(a), Some(b)) if a != b => Some(()),
                    _ => None,
                }
            });
            if reset.is_some() {
                (Vec::new(), Vec::new())
            } else {
                (batch, day)
            }
        } else {
            (Vec::new(), Vec::new())
        }
    } else {
        (Vec::new(), Vec::new())
    };

    let point = trend_point_from_health(health, report_id, captured_at);
    by_batch.push(point.clone());
    while by_batch.len() > ORDERS_CHAIN_HEALTH_TREND_MAX_BATCH {
        by_batch.remove(0);
    }

    let day_utc = format!(
        "{:04}-{:02}-{:02}",
        captured_at.year(),
        captured_at.month(),
        captured_at.day()
    );
    let day_entry = json!({
        "day_utc": day_utc,
        "last_captured_at": captured_at.to_rfc3339(),
        "last_report_id": report_id.to_string(),
        "expected_chain_id": health.get("expected_chain_id"),
        "orders_total": health.get("orders_total"),
        "orders_null_chain_id_total": health.get("orders_null_chain_id_total"),
        "orders_chain_id_mismatch_total": health.get("orders_chain_id_mismatch_total"),
        "orders_aligned_expected_total": health.get("orders_aligned_expected_total"),
        "null_ratio": health.get("null_ratio"),
        "mismatch_ratio": health.get("mismatch_ratio"),
    });
    let mut day_hit = false;
    for d in by_day.iter_mut() {
        if d.get("day_utc").and_then(|v| v.as_str()) == Some(day_utc.as_str()) {
            *d = day_entry.clone();
            day_hit = true;
            break;
        }
    }
    if !day_hit {
        by_day.push(day_entry);
    }
    by_day.sort_by(|a, b| {
        let da = a.get("day_utc").and_then(|v| v.as_str()).unwrap_or("");
        let db = b.get("day_utc").and_then(|v| v.as_str()).unwrap_or("");
        da.cmp(db)
    });
    while by_day.len() > ORDERS_CHAIN_HEALTH_TREND_MAX_DAY {
        by_day.remove(0);
    }

    json!({
        "anchor": ORDERS_CHAIN_HEALTH_TREND_SNAPSHOT_ANCHOR,
        "schema_version": 1_i64,
        "max_batch_points_kept": ORDERS_CHAIN_HEALTH_TREND_MAX_BATCH as i64,
        "max_day_points_kept": ORDERS_CHAIN_HEALTH_TREND_MAX_DAY as i64,
        "expected_chain_id": health.get("expected_chain_id"),
        "by_batch": Value::Array(by_batch),
        "by_day": Value::Array(by_day),
        "getter_note": "by_batch: one point per persist:true indexer-reconcile (capped); by_day: last snapshot per UTC calendar day (capped). Scalar fields mirror orders_chain_health_observability (153).",
    })
}

#[derive(Debug, sqlx::FromRow)]
pub struct ReconciliationReportRow {
    pub id: Uuid,
    pub report_type: String,
    pub chain_id: Option<i64>,
    pub period_start: Option<DateTime<Utc>>,
    pub period_end: Option<DateTime<Utc>>,
    pub summary: Json<Value>,
    pub details_path: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_reconciliation_report_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<ReconciliationReportRow>, sqlx::Error> {
    sqlx::query_as::<_, ReconciliationReportRow>(
        r#"
        SELECT id, report_type, chain_id, period_start, period_end, summary, details_path, created_at
        FROM reconciliation_reports
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_latest_reconciliation_report_by_type(
    pool: &PgPool,
    report_type: &str,
) -> Result<Option<ReconciliationReportRow>, sqlx::Error> {
    sqlx::query_as::<_, ReconciliationReportRow>(
        r#"
        SELECT id, report_type, chain_id, period_start, period_end, summary, details_path, created_at
        FROM reconciliation_reports
        WHERE report_type = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(report_type)
    .fetch_optional(pool)
    .await
}

/// Admin **`indexer/health`** 与 **`observability/overview`** 共用：最新 `orders_projection_vs_orders` 小摘要（无整份 **`summary`**）。
pub async fn admin_last_stored_orders_projection_reconcile(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    let Some(row) =
        get_latest_reconciliation_report_by_type(pool, REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS)
            .await?
    else {
        return Ok(None);
    };
    let stats = row.summary.0.get("stats");
    let projection_reconcile_clean = stats
        .and_then(|s| s.get("projection_reconcile_clean"))
        .and_then(|v| v.as_bool());
    let issues_total = stats
        .and_then(|s| s.get("issues_total"))
        .and_then(Value::as_u64);
    Ok(Some(json!({
        "report_id": row.id.to_string(),
        "report_type": row.report_type,
        "created_at": row.created_at.to_rfc3339(),
        "chain_id": row.chain_id,
        "projection_reconcile_clean": projection_reconcile_clean,
        "issues_total": issues_total,
    })))
}

/// **B-154**：自最新 **`orders_projection_vs_orders`** 报告 **`summary`** 读取 **`indexer_reconcile_duration_batch_stats_observability`**（与 **`POST …/internal/indexer-reconcile`** **`persist:true`** 同键）。
pub async fn admin_last_indexer_reconcile_duration_batch_stats_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    let Some(row) =
        get_latest_reconciliation_report_by_type(pool, REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS)
            .await?
    else {
        return Ok(None);
    };
    Ok(row
        .summary
        .0
        .get("indexer_reconcile_duration_batch_stats_observability")
        .cloned())
}

/// **B-155**：自最新 **`orders_projection_vs_orders`** 报告 **`summary`** 读取 **`orders_chain_health_trend_snapshot`**。
pub async fn admin_last_orders_chain_health_trend_snapshot(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    let Some(row) =
        get_latest_reconciliation_report_by_type(pool, REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS)
            .await?
    else {
        return Ok(None);
    };
    Ok(row
        .summary
        .0
        .get("orders_chain_health_trend_snapshot")
        .cloned())
}

// --- Admin observability：自最新 `orders_projection_vs_orders` 报告 `summary` 读取（与 indexer-reconcile persist 同键）---

pub const GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR: &str =
    "152-GOVERNANCE-PROPOSALS-PROJECTION-NULL-FIELDS-OBS-V1";
pub const RPC_ESCROW_SAMPLE_META_ANCHOR: &str = "110-RPC-ESCROW-SAMPLE-META";
pub const CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR: &str = "160-CORRECTION-EXECUTOR-ROWS-OBS-V1";
pub const ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR: &str =
    "155-ORDERS-AMOUNT-CHAIN-VS-ESCROW-DRIFT-OBS-V1";
pub const ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR: &str =
    "168-ESCROW-STATUS-CHAIN-VS-ORDERS-DRIFT-OBS-V1";
pub const FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR: &str =
    "164-FEE-ROUTER-FEE-ROUTES-VS-ROUTED-EVENTS-DRIFT-OBS-V1";
pub const VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR: &str =
    "165-VAULT-FORWARDS-VS-FORWARDED-EVENTS-DRIFT-OBS-V1";

async fn admin_last_orders_projection_summary_field(
    pool: &PgPool,
    key: &str,
) -> Result<Option<Value>, sqlx::Error> {
    let Some(row) =
        get_latest_reconciliation_report_by_type(pool, REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS)
            .await?
    else {
        return Ok(None);
    };
    Ok(row.summary.0.get(key).cloned())
}

pub async fn admin_last_governance_proposals_projection_null_fields_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "governance_proposals_projection_null_fields_observability",
    )
    .await
}

pub async fn admin_last_rpc_escrow_sample_meta(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(pool, "rpc_escrow_sample_meta").await
}

pub async fn admin_last_correction_executor_rows_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(pool, "correction_executor_rows_observability").await
}

pub async fn admin_last_orders_amount_chain_vs_escrow_drift_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "orders_amount_chain_vs_escrow_drift_observability",
    )
    .await
}

pub async fn admin_last_escrow_status_chain_vs_orders_drift_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "escrow_status_chain_vs_orders_drift_observability",
    )
    .await
}

pub async fn admin_last_fee_router_fee_routes_vs_routed_events_drift_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "fee_router_fee_routes_vs_routed_events_drift_observability",
    )
    .await
}

pub async fn admin_last_vault_forwards_vs_forwarded_events_drift_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "vault_forwards_vs_forwarded_events_drift_observability",
    )
    .await
}

pub async fn admin_last_stake_lock_projection_block_lag_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "stake_lock_projection_block_lag_observability",
    )
    .await
}

pub async fn admin_last_indexer_head_vs_db_latest_block_drift_observability(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    admin_last_orders_projection_summary_field(
        pool,
        "indexer_head_vs_db_latest_block_drift_observability",
    )
    .await
}

/// Admin 列表用（不含整份 **`summary`**；从 **`summary.stats`** 抽取门禁字段与分项计数，**不含** **`samples`**）
#[derive(Debug, sqlx::FromRow)]
pub struct ReconciliationReportListItem {
    pub id: Uuid,
    pub report_type: String,
    pub chain_id: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub issues_total: Option<i64>,
    pub projection_reconcile_clean: Option<bool>,
    pub orders_with_escrow: Option<i64>,
    pub projection_rows_chain: Option<i64>,
    pub matched: Option<i64>,
    pub missing_projection: Option<i64>,
    pub status_mismatch: Option<i64>,
    pub escrow_mismatch: Option<i64>,
    pub orphan_projections: Option<i64>,
    pub malformed_projection_order_id_bytes: Option<i64>,
    /// `summary.economic_projection_row_counts.fee_router_routed_events.rows_total`（旧报告无键则为 **NULL**）
    pub fee_router_routed_events_rows: Option<i64>,
    /// `summary.economic_projection_row_counts.region_vault_forwarded_events.rows_total`
    pub region_vault_forwarded_events_rows: Option<i64>,
    pub fee_router_routed_events_max_block_number: Option<i64>,
    pub fee_router_routed_events_min_block_number: Option<i64>,
    pub fee_router_routed_events_latest_inserted_at: Option<String>,
    pub region_vault_forwarded_events_max_block_number: Option<i64>,
    pub region_vault_forwarded_events_min_block_number: Option<i64>,
    pub region_vault_forwarded_events_latest_inserted_at: Option<String>,
    /// `summary.event_log_escrow_coverage.escrow_class_event_rows`（**`include_event_log_escrow_coverage`** 且 **`persist`** 的旧报告无键则为 **NULL**）
    pub event_log_escrow_class_rows: Option<i64>,
    /// `summary.event_log_escrow_coverage.escrow_created_rows`
    pub event_log_escrow_created_rows: Option<i64>,
    /// `summary.event_log_escrow_coverage.distinct_escrow_address_from_escrow_created`
    pub event_log_distinct_escrow_from_created: Option<i64>,
}

fn has_any_economic_projection_list_field(r: &ReconciliationReportListItem) -> bool {
    r.fee_router_routed_events_rows.is_some()
        || r.region_vault_forwarded_events_rows.is_some()
        || r.fee_router_routed_events_max_block_number.is_some()
        || r.fee_router_routed_events_min_block_number.is_some()
        || r.fee_router_routed_events_latest_inserted_at.is_some()
        || r.region_vault_forwarded_events_max_block_number.is_some()
        || r.region_vault_forwarded_events_min_block_number.is_some()
        || r.region_vault_forwarded_events_latest_inserted_at.is_some()
}

/// Admin 列表/CSV 用：自 **`summary`** 抽取的 **`economic_projection_row_counts`**（与 **`POST …/internal/indexer-reconcile`** **`persist`** 同路径；全无则 **`None`**）。
pub fn economic_projection_row_counts_from_list_item(
    r: &ReconciliationReportListItem,
) -> Option<Value> {
    if !has_any_economic_projection_list_field(r) {
        return None;
    }
    Some(json!({
        "fee_router_routed_events": {
            "rows_total": r.fee_router_routed_events_rows,
            "max_block_number": r.fee_router_routed_events_max_block_number,
            "min_block_number": r.fee_router_routed_events_min_block_number,
            "latest_inserted_at": r.fee_router_routed_events_latest_inserted_at,
        },
        "region_vault_forwarded_events": {
            "rows_total": r.region_vault_forwarded_events_rows,
            "max_block_number": r.region_vault_forwarded_events_max_block_number,
            "min_block_number": r.region_vault_forwarded_events_min_block_number,
            "latest_inserted_at": r.region_vault_forwarded_events_latest_inserted_at,
        },
    }))
}

fn has_any_event_log_escrow_coverage_list_field(r: &ReconciliationReportListItem) -> bool {
    r.event_log_escrow_class_rows.is_some()
        || r.event_log_escrow_created_rows.is_some()
        || r.event_log_distinct_escrow_from_created.is_some()
}

/// Admin 列表/CSV 用：自 **`summary`** 抽取的 **`event_log_escrow_coverage`**（与 **`POST …/internal/indexer-reconcile`** **`include_event_log_escrow_coverage` + `persist`** 同路径；全无则 **`None`**）。
pub fn event_log_escrow_coverage_from_list_item(r: &ReconciliationReportListItem) -> Option<Value> {
    if !has_any_event_log_escrow_coverage_list_field(r) {
        return None;
    }
    Some(json!({
        "escrow_class_event_rows": r.event_log_escrow_class_rows,
        "escrow_created_rows": r.event_log_escrow_created_rows,
        "distinct_escrow_address_from_escrow_created": r.event_log_distinct_escrow_from_created,
    }))
}

pub async fn count_reconciliation_reports(
    pool: &PgPool,
    report_type: Option<&str>,
    chain_id: Option<i64>,
    projection_reconcile_clean: Option<bool>,
    issues_min: Option<i64>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)::bigint FROM reconciliation_reports
        WHERE ($1::text IS NULL OR report_type = $1)
          AND ($2::bigint IS NULL OR chain_id = $2)
          AND ($3::boolean IS NULL OR (summary #>> '{stats,projection_reconcile_clean}')::boolean = $3)
          AND (
              $4::bigint IS NULL
              OR COALESCE(NULLIF(TRIM(summary #>> '{stats,issues_total}'), '')::bigint, -1) >= $4
          )
        "#,
    )
    .bind(report_type)
    .bind(chain_id)
    .bind(projection_reconcile_clean)
    .bind(issues_min)
    .fetch_one(pool)
    .await
}

pub async fn list_reconciliation_reports(
    pool: &PgPool,
    report_type: Option<&str>,
    chain_id: Option<i64>,
    projection_reconcile_clean: Option<bool>,
    issues_min: Option<i64>,
    limit: i64,
    offset: i64,
) -> Result<Vec<ReconciliationReportListItem>, sqlx::Error> {
    sqlx::query_as::<_, ReconciliationReportListItem>(
        r#"
        SELECT
            id,
            report_type,
            chain_id,
            created_at,
            NULLIF(TRIM(summary #>> '{stats,issues_total}'), '')::bigint AS issues_total,
            (summary #>> '{stats,projection_reconcile_clean}')::boolean AS projection_reconcile_clean,
            NULLIF(TRIM(summary #>> '{stats,orders_with_escrow}'), '')::bigint AS orders_with_escrow,
            NULLIF(TRIM(summary #>> '{stats,projection_rows_chain}'), '')::bigint AS projection_rows_chain,
            NULLIF(TRIM(summary #>> '{stats,matched}'), '')::bigint AS matched,
            NULLIF(TRIM(summary #>> '{stats,missing_projection}'), '')::bigint AS missing_projection,
            NULLIF(TRIM(summary #>> '{stats,status_mismatch}'), '')::bigint AS status_mismatch,
            NULLIF(TRIM(summary #>> '{stats,escrow_mismatch}'), '')::bigint AS escrow_mismatch,
            NULLIF(TRIM(summary #>> '{stats,orphan_projections}'), '')::bigint AS orphan_projections,
            NULLIF(TRIM(summary #>> '{stats,malformed_projection_order_id_bytes}'), '')::bigint AS malformed_projection_order_id_bytes,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,rows_total}'), '')::bigint AS fee_router_routed_events_rows,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,rows_total}'), '')::bigint AS region_vault_forwarded_events_rows,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,max_block_number}'), '')::bigint AS fee_router_routed_events_max_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,min_block_number}'), '')::bigint AS fee_router_routed_events_min_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,latest_inserted_at}'), '') AS fee_router_routed_events_latest_inserted_at,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,max_block_number}'), '')::bigint AS region_vault_forwarded_events_max_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,min_block_number}'), '')::bigint AS region_vault_forwarded_events_min_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,latest_inserted_at}'), '') AS region_vault_forwarded_events_latest_inserted_at,
            NULLIF(TRIM(summary #>> '{event_log_escrow_coverage,escrow_class_event_rows}'), '')::bigint AS event_log_escrow_class_rows,
            NULLIF(TRIM(summary #>> '{event_log_escrow_coverage,escrow_created_rows}'), '')::bigint AS event_log_escrow_created_rows,
            NULLIF(TRIM(summary #>> '{event_log_escrow_coverage,distinct_escrow_address_from_escrow_created}'), '')::bigint AS event_log_distinct_escrow_from_created
        FROM reconciliation_reports
        WHERE ($1::text IS NULL OR report_type = $1)
          AND ($2::bigint IS NULL OR chain_id = $2)
          AND ($3::boolean IS NULL OR (summary #>> '{stats,projection_reconcile_clean}')::boolean = $3)
          AND (
              $4::bigint IS NULL
              OR COALESCE(NULLIF(TRIM(summary #>> '{stats,issues_total}'), '')::bigint, -1) >= $4
          )
        ORDER BY created_at DESC, id DESC
        LIMIT $5 OFFSET $6
        "#,
    )
    .bind(report_type)
    .bind(chain_id)
    .bind(projection_reconcile_clean)
    .bind(issues_min)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    fn empty_list_item() -> ReconciliationReportListItem {
        ReconciliationReportListItem {
            id: Uuid::nil(),
            report_type: String::new(),
            chain_id: None,
            created_at: Utc::now(),
            issues_total: None,
            projection_reconcile_clean: None,
            orders_with_escrow: None,
            projection_rows_chain: None,
            matched: None,
            missing_projection: None,
            status_mismatch: None,
            escrow_mismatch: None,
            orphan_projections: None,
            malformed_projection_order_id_bytes: None,
            fee_router_routed_events_rows: None,
            region_vault_forwarded_events_rows: None,
            fee_router_routed_events_max_block_number: None,
            fee_router_routed_events_min_block_number: None,
            fee_router_routed_events_latest_inserted_at: None,
            region_vault_forwarded_events_max_block_number: None,
            region_vault_forwarded_events_min_block_number: None,
            region_vault_forwarded_events_latest_inserted_at: None,
            event_log_escrow_class_rows: None,
            event_log_escrow_created_rows: None,
            event_log_distinct_escrow_from_created: None,
        }
    }

    #[test]
    fn economic_projection_row_counts_from_list_item_none_when_all_missing() {
        assert!(economic_projection_row_counts_from_list_item(&empty_list_item()).is_none());
    }

    #[test]
    fn economic_projection_row_counts_from_list_item_includes_partial_rows() {
        let mut r = empty_list_item();
        r.fee_router_routed_events_rows = Some(7);
        let v = economic_projection_row_counts_from_list_item(&r).expect("some");
        assert_eq!(v["fee_router_routed_events"]["rows_total"], 7);
        assert!(v["region_vault_forwarded_events"]["rows_total"].is_null());
    }

    #[test]
    fn economic_projection_row_counts_from_list_item_block_only_still_emits() {
        let mut r = empty_list_item();
        r.fee_router_routed_events_max_block_number = Some(99);
        let v = economic_projection_row_counts_from_list_item(&r).expect("some");
        assert_eq!(v["fee_router_routed_events"]["max_block_number"], 99);
        assert!(v["fee_router_routed_events"]["rows_total"].is_null());
    }

    #[test]
    fn event_log_escrow_coverage_from_list_item_none_when_all_missing() {
        assert!(event_log_escrow_coverage_from_list_item(&empty_list_item()).is_none());
    }

    #[test]
    fn event_log_escrow_coverage_from_list_item_partial() {
        let mut r = empty_list_item();
        r.event_log_escrow_created_rows = Some(42);
        let v = event_log_escrow_coverage_from_list_item(&r).expect("some");
        assert_eq!(v["escrow_created_rows"], 42);
        assert!(v["escrow_class_event_rows"].is_null());
    }

    fn health_sample(ecid: i64, total: i64, null_t: i64, mismatch_t: i64) -> Value {
        json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "expected_chain_id": ecid,
            "orders_total": total,
            "orders_null_chain_id_total": null_t,
            "orders_chain_id_mismatch_total": mismatch_t,
            "orders_aligned_expected_total": total - null_t - mismatch_t,
            "null_ratio": 0.1,
            "mismatch_ratio": 0.05,
        })
    }

    #[test]
    fn merge_orders_chain_health_trend_first_point() {
        let id = Uuid::new_v4();
        let t = Utc::now();
        let h = health_sample(7, 100, 2, 1);
        let v = merge_orders_chain_health_trend_snapshot(None, &h, id, t);
        assert_eq!(
            v["anchor"].as_str().unwrap(),
            ORDERS_CHAIN_HEALTH_TREND_SNAPSHOT_ANCHOR
        );
        let batch = v["by_batch"].as_array().unwrap();
        assert_eq!(batch.len(), 1);
        assert_eq!(batch[0]["report_id"].as_str().unwrap(), id.to_string());
        assert_eq!(batch[0]["orders_total"], 100);
        let day = v["by_day"].as_array().unwrap();
        assert_eq!(day.len(), 1);
        assert_eq!(day[0]["last_report_id"].as_str().unwrap(), id.to_string());
    }

    #[test]
    fn merge_orders_chain_health_trend_appends_batch_updates_same_day() {
        let id1 = Uuid::new_v4();
        let id2 = Uuid::new_v4();
        let t1 = Utc::now();
        let t2 = t1 + chrono::Duration::seconds(5);
        let h1 = health_sample(7, 100, 2, 1);
        let h2 = health_sample(7, 101, 3, 1);
        let first = merge_orders_chain_health_trend_snapshot(None, &h1, id1, t1);
        let second = merge_orders_chain_health_trend_snapshot(Some(&first), &h2, id2, t2);
        let batch = second["by_batch"].as_array().unwrap();
        assert_eq!(batch.len(), 2);
        assert_eq!(batch[1]["orders_total"], 101);
        let day = second["by_day"].as_array().unwrap();
        assert_eq!(day.len(), 1);
        assert_eq!(day[0]["orders_total"], 101);
    }

    #[test]
    fn merge_orders_chain_health_trend_skips_unhealthy_health() {
        let id = Uuid::new_v4();
        let bad = json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "observation_note": "query_failed",
        });
        let prev = merge_orders_chain_health_trend_snapshot(None, &health_sample(7, 1, 0, 0), id, Utc::now());
        let id2 = Uuid::new_v4();
        let out = merge_orders_chain_health_trend_snapshot(Some(&prev), &bad, id2, Utc::now());
        assert_eq!(out["by_batch"].as_array().unwrap().len(), 1);
    }
}
