//! /api/v1/admin/* 最小收口（70：管理员系统；04 §3.5）

use axum::extract::Path;
use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::response::Response;
use axum::routing::get;
use axum::routing::patch;
use axum::routing::post;
use axum::Json;
use axum::Router;
use chrono::{DateTime, Utc};
use ed25519_dalek::Signer;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::middleware;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

mod trust_growth_obs;

fn parse_optional_penalty_expires_at(s: &Option<String>) -> Result<Option<DateTime<Utc>>, ()> {
    match s {
        None => Ok(None),
        Some(x) => {
            let t = x.trim();
            if t.is_empty() {
                Ok(None)
            } else {
                DateTime::parse_from_rfc3339(t)
                    .map(|d| Some(d.with_timezone(&Utc)))
                    .map_err(|_| ())
            }
        }
    }
}

fn admin_reviews_json_from_memory(
    store: &chain_off::ChainOffStore,
    q: &AdminReviewsQuery,
    limit: i64,
) -> Vec<serde_json::Value> {
    let mut items: Vec<_> = store
        .reviews
        .iter()
        .filter(|r| {
            if let Some(mx) = q.max_score {
                if r.score > mx {
                    return false;
                }
            }
            if let Some(mn) = q.min_score {
                if r.score < mn {
                    return false;
                }
            }
            true
        })
        .map(|r| {
            let order = store.orders.get(&r.order_id);
            let (tourist_id, traveler_id) = chain_off::dispute_party_mirror(order);
            json!({
                "id": r.id.to_string(),
                "order_id": r.order_id.to_string(),
                "tourist_id": tourist_id,
                "traveler_id": traveler_id,
                "reviewer_id": r.reviewer_id.to_string(),
                "reviewee_id": r.reviewee_id.to_string(),
                "score": r.score,
                "weight": r.weight,
                "comment": r.comment,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    items.sort_by(|a, b| {
        let ta = a
            .get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default();
        let tb = b
            .get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default();
        tb.cmp(ta)
    });
    items.truncate(limit as usize);
    items
}

fn db_review_to_chain_row(r: db::DbReviewRow) -> chain_off::ReviewRow {
    chain_off::ReviewRow {
        id: r.id,
        order_id: r.order_id,
        reviewer_id: r.reviewer_id,
        reviewee_id: r.reviewee_id,
        score: r.score,
        weight: r.weight,
        comment: r.comment,
        created_at: r.created_at,
    }
}

/// Merges `meta.build` (same payload as `GET /meta.build`) into admin JSON success bodies.
fn admin_attach_meta_build(body: &mut Value) {
    let Some(root) = body.as_object_mut() else {
        return;
    };
    let build = crate::routes::meta_build_value();
    match root.get_mut("meta") {
        Some(Value::Object(meta_obj)) => {
            meta_obj.insert("build".to_string(), build);
        }
        _ => {
            root.insert("meta".to_string(), json!({ "build": build }));
        }
    }
}

struct AdminFinanceSummaryComputed {
    meta: Value,
    summary: Value,
    audit_detail: Value,
}

fn finance_summary_value_cell(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => s.clone(),
        Value::Array(_) | Value::Object(_) => {
            serde_json::to_string(v).unwrap_or_else(|_| "{}".to_string())
        }
    }
}

fn csv_escape_cell(s: &str) -> String {
    if s.contains(['"', ',', '\n', '\r']) {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

/// P5-2-A 最小列集（**`id`** 置末）；**仅** **`region_vault_forwarded_events`** 行。
fn region_vault_forwarded_export_csv(rows: &[db::RegionVaultForwardedEventRow]) -> String {
    use std::fmt::Write;
    let mut buf = String::from(
        "chain_id,block_number,log_index,block_hash,tx_hash,vault_address,token_address,to_address,amount_u256_hex,inserted_at,id\n",
    );
    for r in rows {
        let _ = writeln!(
            buf,
            "{},{},{},{},{},{},{},{},{},{},{}",
            r.chain_id,
            r.block_number,
            r.log_index,
            csv_escape_cell(&r.block_hash),
            csv_escape_cell(&r.tx_hash),
            csv_escape_cell(&r.vault_address),
            csv_escape_cell(&r.token_address),
            csv_escape_cell(&r.to_address),
            csv_escape_cell(&r.amount_u256_hex),
            csv_escape_cell(&r.inserted_at.to_rfc3339()),
            csv_escape_cell(&r.id.to_string()),
        );
    }
    buf
}

fn push_finance_csv_row(buf: &mut String, group: &str, metric: &str, value: &str) {
    use std::fmt::Write;
    let _ = writeln!(
        buf,
        "{},{},{}",
        csv_escape_cell(group),
        csv_escape_cell(metric),
        csv_escape_cell(value)
    );
}

fn finance_summary_to_csv(meta: &Value, summary: &Value) -> String {
    let mut buf = String::new();
    push_finance_csv_row(&mut buf, "export", "kind", "finance_summary_v2");

    if let Some(mo) = meta.as_object() {
        for (k, v) in mo {
            match (k.as_str(), v) {
                ("fee_router_stats" | "region_vault_stats", Value::Object(m)) => {
                    let group = format!("meta.{k}");
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            group.as_str(),
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("last_stored_orders_projection_reconcile", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "meta.last_stored_orders_projection_reconcile",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                _ => {
                    push_finance_csv_row(
                        &mut buf,
                        "meta",
                        k.as_str(),
                        &finance_summary_value_cell(v),
                    );
                }
            }
        }
    }

    if let Some(b) = crate::routes::meta_build_value().as_object() {
        for (k, v) in b {
            push_finance_csv_row(
                &mut buf,
                "meta.build",
                k.as_str(),
                &finance_summary_value_cell(v),
            );
        }
    }

    if let Some(so) = summary.as_object() {
        for (k, v) in so {
            match (k.as_str(), v) {
                ("state_counts", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.state_counts",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("total_amount_by_currency", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.total_amount_by_currency",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("escrowed_amount_by_currency", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.escrowed_amount_by_currency",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                ("dispute_status_counts", Value::Object(m)) => {
                    for (sk, sv) in m {
                        push_finance_csv_row(
                            &mut buf,
                            "summary.dispute_status_counts",
                            sk.as_str(),
                            &finance_summary_value_cell(sv),
                        );
                    }
                }
                _ => push_finance_csv_row(
                    &mut buf,
                    "summary",
                    k.as_str(),
                    &finance_summary_value_cell(v),
                ),
            }
        }
    }
    buf
}

async fn compute_admin_finance_summary(
    state: &ApiMetaState,
    co: &chain_off::ChainOffState,
) -> AdminFinanceSummaryComputed {
    let store = co.store.read().await;

    let mut state_counts: HashMap<String, i64> = HashMap::new();
    let mut total_by_currency: HashMap<String, f64> = HashMap::new();
    let mut escrowed_by_currency: HashMap<String, f64> = HashMap::new();
    let mut orders_with_escrow_address: i64 = 0;
    let mut orders_amount_parse_error_count: i64 = 0;

    for order in store.orders.values() {
        let order_state = chain_off::order_state_to_str(order.state).to_string();
        *state_counts.entry(order_state.clone()).or_insert(0) += 1;

        if order
            .escrow_address
            .as_ref()
            .is_some_and(|s| !s.trim().is_empty())
        {
            orders_with_escrow_address += 1;
        }

        match order.amount.parse::<f64>() {
            Ok(v) => {
                let ccy = order.currency.clone();
                *total_by_currency.entry(ccy.clone()).or_insert(0.0) += v;
                if matches!(order_state.as_str(), "Escrowed" | "Completed") {
                    *escrowed_by_currency.entry(ccy).or_insert(0.0) += v;
                }
            }
            Err(_) => {
                orders_amount_parse_error_count += 1;
            }
        }
    }

    let mut dispute_status_counts: HashMap<String, i64> = HashMap::new();
    for d in store.disputes.values() {
        *dispute_status_counts.entry(d.status.clone()).or_insert(0) += 1;
    }

    let (
        db_order_count,
        db_orders_with_escrow_count,
        fee_router_stats,
        region_vault_stats,
        last_stored_orders_projection_reconcile,
        orders_projection_reconcile_report_count,
        reconciliation_reports_total_count,
        reconciliation_reports_with_open_issues_count,
        reconciliation_reports_projection_unclean_count,
        reconciliation_reports_projection_clean_count,
    ) = if let Some(pool) = co.db_pool.as_ref() {
        let fee_router_stats = match db::fee_router_routed_stats(pool, None).await {
            Ok(s) => json!({
                "total": s.total,
                "max_block_number": s.max_block_number,
                "min_block_number": s.min_block_number,
                "latest_inserted_at": s.latest_inserted_at.map(|t| t.to_rfc3339()),
            }),
            Err(_) => Value::Null,
        };
        let region_vault_stats = match db::region_vault_forwarded_stats(pool, None).await {
            Ok(s) => json!({
                "total": s.total,
                "max_block_number": s.max_block_number,
                "min_block_number": s.min_block_number,
                "latest_inserted_at": s.latest_inserted_at.map(|t| t.to_rfc3339()),
            }),
            Err(_) => Value::Null,
        };
        let last_stored_orders_projection_reconcile =
            match db::admin_last_stored_orders_projection_reconcile(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => Value::Null,
                Err(_) => Value::Null,
            };
        let orders_projection_reconcile_report_count = db::count_reconciliation_reports(
            pool,
            Some(db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS),
            None,
            None,
            None,
        )
        .await
        .ok();
        let reconciliation_reports_total_count =
            db::count_reconciliation_reports(pool, None, None, None, None)
                .await
                .ok();
        let reconciliation_reports_with_open_issues_count =
            db::count_reconciliation_reports(pool, None, None, None, Some(1))
                .await
                .ok();
        let reconciliation_reports_projection_unclean_count =
            db::count_reconciliation_reports(pool, None, None, Some(false), None)
                .await
                .ok();
        let reconciliation_reports_projection_clean_count =
            db::count_reconciliation_reports(pool, None, None, Some(true), None)
                .await
                .ok();
        (
            db::count_orders(pool).await.ok(),
            db::count_orders_with_escrow_address(pool).await.ok(),
            fee_router_stats,
            region_vault_stats,
            last_stored_orders_projection_reconcile,
            orders_projection_reconcile_report_count,
            reconciliation_reports_total_count,
            reconciliation_reports_with_open_issues_count,
            reconciliation_reports_projection_unclean_count,
            reconciliation_reports_projection_clean_count,
        )
    } else {
        (
            None,
            None,
            Value::Null,
            Value::Null,
            Value::Null,
            None,
            None,
            None,
            None,
            None,
        )
    };

    let fee_router_address_meta = state
        .chain_config
        .as_ref()
        .and_then(|c| c.fee_router_address.as_ref())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(std::string::ToString::to_string);

    let region_vault_address_meta = state
        .chain_config
        .as_ref()
        .and_then(|c| c.region_vault_address.as_ref())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(std::string::ToString::to_string);

    let meta = json!({
        "generated_at": Utc::now().to_rfc3339(),
        "source": "chain_off",
        "db_order_count": db_order_count,
        "db_orders_with_escrow_count": db_orders_with_escrow_count,
        "orders_projection_reconcile_report_count": orders_projection_reconcile_report_count,
        "reconciliation_reports_total_count": reconciliation_reports_total_count,
        "reconciliation_reports_with_open_issues_count": reconciliation_reports_with_open_issues_count,
        "reconciliation_reports_projection_unclean_count": reconciliation_reports_projection_unclean_count,
        "reconciliation_reports_projection_clean_count": reconciliation_reports_projection_clean_count,
        "fee_router_address": fee_router_address_meta,
        "fee_router_stats": fee_router_stats,
        "region_vault_address": region_vault_address_meta,
        "region_vault_stats": region_vault_stats,
        "last_stored_orders_projection_reconcile": last_stored_orders_projection_reconcile,
    });

    let summary = json!({
        "order_count": store.orders.len(),
        "state_counts": state_counts,
        "total_amount_by_currency": total_by_currency,
        "escrowed_amount_by_currency": escrowed_by_currency,
        "dispute_count": store.disputes.len(),
        "dispute_status_counts": dispute_status_counts,
        "orders_with_escrow_address_count": orders_with_escrow_address,
        "orders_amount_parse_error_count": orders_amount_parse_error_count,
    });

    let audit_detail = json!({
        "order_count": store.orders.len(),
        "dispute_count": store.disputes.len(),
        "state_count_keys": state_counts.len(),
        "currency_count_keys": total_by_currency.len(),
        "orders_with_escrow_address": orders_with_escrow_address,
        "orders_amount_parse_error_count": orders_amount_parse_error_count,
        "db_order_count": db_order_count,
        "db_orders_with_escrow_count": db_orders_with_escrow_count,
        "orders_projection_reconcile_report_count": orders_projection_reconcile_report_count,
        "reconciliation_reports_total_count": reconciliation_reports_total_count,
        "reconciliation_reports_with_open_issues_count": reconciliation_reports_with_open_issues_count,
        "reconciliation_reports_projection_unclean_count": reconciliation_reports_projection_unclean_count,
        "reconciliation_reports_projection_clean_count": reconciliation_reports_projection_clean_count,
        "fee_router_total": fee_router_stats.get("total").and_then(|x| x.as_i64()),
        "region_vault_total": region_vault_stats.get("total").and_then(|x| x.as_i64()),
        "projection_reconcile_clean": last_stored_orders_projection_reconcile
            .get("projection_reconcile_clean")
            .and_then(|v| v.as_bool()),
    });

    AdminFinanceSummaryComputed {
        meta,
        summary,
        audit_detail,
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/admin/users", get(get_admin_users))
        .route(
            "/api/v1/admin/users/:id/role-change-request",
            post(post_admin_user_role_change_request),
        )
        .route("/api/v1/admin/users/:id", get(get_admin_user_by_id))
        .route(
            "/api/v1/admin/guides/:id",
            get(get_admin_guide_by_id).patch(patch_admin_guide_registration),
        )
        .route("/api/v1/admin/guides", get(get_admin_guides))
        .route("/api/v1/admin/orders", get(get_admin_orders))
        .route("/api/v1/admin/orders/:id", get(get_admin_order_by_id))
        .route(
            "/api/v1/admin/finance/summary",
            get(get_admin_finance_summary),
        )
        .route(
            "/api/v1/admin/finance/summary/export",
            get(get_admin_finance_summary_export),
        )
        .route(
            "/api/v1/admin/fee-router/routed-events",
            get(get_admin_fee_router_routed_events),
        )
        .route(
            "/api/v1/admin/region-vault/forwarded-events",
            get(get_admin_region_vault_forwarded_events),
        )
        .route(
            "/api/v1/admin/region-vault/forwarded-events/export",
            get(get_admin_region_vault_forwarded_events_export),
        )
        .route(
            "/api/v1/admin/schema/migrations",
            get(get_admin_schema_migrations),
        )
        .route("/api/v1/admin/disputes", get(get_admin_disputes))
        .route("/api/v1/admin/disputes/:id", get(get_admin_dispute_by_id))
        .route("/api/v1/admin/reviews", get(get_admin_reviews))
        .route("/api/v1/admin/reviews/:id", get(get_admin_review_by_id))
        .route(
            "/api/v1/admin/observability/overview",
            get(get_admin_observability_overview),
        )
        .route(
            "/api/v1/admin/observability/alert-rules",
            get(get_admin_observability_alert_rules),
        )
        .route(
            "/api/v1/admin/alerts/incidents/:id",
            get(get_admin_alert_incident_by_id),
        )
        .route(
            "/api/v1/admin/audit/operations",
            get(get_admin_audit_operations),
        )
        .route(
            "/api/v1/admin/indexer/health",
            get(get_admin_indexer_health),
        )
        .route(
            "/api/v1/admin/indexer/reconcile-report/:id",
            get(get_admin_indexer_reconcile_report),
        )
        .route(
            "/api/v1/admin/indexer/reconcile-reports",
            get(get_admin_indexer_reconcile_reports),
        )
        .route(
            "/api/v1/admin/indexer/reconcile-reports/export",
            get(get_admin_indexer_reconcile_reports_export),
        )
        .route(
            "/api/v1/admin/audit-logs/:id",
            get(get_admin_audit_log_by_id),
        )
        .route("/api/v1/admin/audit-logs", get(get_admin_audit_logs))
        .route("/api/v1/admin/approvals", get(get_admin_approvals))
        .route("/api/v1/admin/approvals/:id", get(get_admin_approval_by_id))
        .route(
            "/api/v1/admin/approvals/:id/approve",
            post(post_admin_approval_approve),
        )
        .route("/api/v1/admin/flags", get(get_admin_flags))
        .route(
            "/api/v1/admin/flags/:id/publish",
            post(post_admin_flag_publish),
        )
        .route(
            "/api/v1/admin/secrets/metadata",
            get(get_admin_secrets_metadata),
        )
        .route(
            "/api/v1/admin/config/releases",
            get(get_admin_config_releases),
        )
        .route(
            "/api/v1/admin/config/releases/:id",
            get(get_admin_config_release_by_id),
        )
        .route("/api/v1/admin/jobs", get(get_admin_jobs))
        .route(
            "/api/v1/admin/scheduler/jobs",
            get(get_admin_scheduler_jobs),
        )
        .route(
            "/api/v1/admin/scheduler/jobs/:job_code/rerun",
            post(post_admin_scheduler_job_rerun),
        )
        .route("/api/v1/admin/api-versions", get(get_admin_api_versions))
        .route(
            "/api/v1/admin/lifecycle/state-machines",
            get(get_admin_lifecycle_state_machines),
        )
        .route("/api/v1/admin/policies", get(get_admin_policies))
        .route(
            "/api/v1/admin/policies/:id/publish",
            post(post_admin_policy_publish),
        )
        .route("/api/v1/admin/tenants/scopes", get(get_admin_tenant_scopes))
        .route(
            "/api/v1/admin/tenants/scopes/:id/publish",
            post(post_admin_tenant_scope_publish),
        )
        .route(
            "/api/v1/admin/compliance/data-requests/:request_id/events",
            get(get_admin_compliance_data_request_events),
        )
        .route(
            "/api/v1/admin/compliance/data-requests/:request_id/update",
            post(post_admin_compliance_data_request_update),
        )
        .route(
            "/api/v1/admin/compliance/data-requests",
            get(get_admin_compliance_data_requests),
        )
        .route(
            "/api/v1/admin/internal-tools/audits",
            get(get_admin_internal_tool_audits),
        )
        .route(
            "/api/v1/admin/media/access-logs",
            get(get_admin_media_access_logs),
        )
        .route(
            "/api/v1/admin/media/signed-url-tokens",
            get(get_admin_media_signed_url_tokens),
        )
        .route(
            "/api/v1/admin/community/reports",
            get(get_admin_community_reports),
        )
        .route(
            "/api/v1/admin/community/appeals",
            get(get_admin_community_appeals),
        )
        .route(
            "/api/v1/admin/community/moderation/:id",
            patch(patch_admin_community_moderation),
        )
        .route(
            "/api/v1/admin/community/appeals/:id/review",
            post(post_admin_community_appeal_review),
        )
        .route(
            "/api/v1/admin/community/ranking/snapshots",
            get(get_admin_community_ranking_snapshots),
        )
        .route(
            "/api/v1/admin/community/penalties",
            get(get_admin_community_penalties).post(post_admin_community_penalty),
        )
        .route(
            "/api/v1/admin/community/moderation/cases",
            get(get_admin_community_moderation_cases),
        )
        .route(
            "/api/v1/admin/community/comments/:id",
            patch(patch_admin_community_comment),
        )
        .route(
            "/api/v1/admin/community/risk-signals",
            get(get_admin_community_risk_signals),
        )
        .route(
            "/api/v1/admin/community/policy-change-logs",
            get(get_admin_community_policy_change_logs),
        )
        .route(
            "/api/v1/admin/community/abuse-policy",
            patch(patch_admin_community_abuse_policy),
        )
        .route(
            "/api/v1/admin/cross-check",
            get(get_admin_cross_check),
        )
        .route(
            "/api/v1/admin/drift-summary",
            get(get_admin_drift_summary),
        )
        .merge(trust_growth_obs::router())
}

#[derive(Debug, Deserialize)]
pub struct AdminAuditQuery {
    pub limit: Option<i64>,
    pub actor_id: Option<String>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminApprovalQuery {
    pub status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminSchemaMigrationsQuery {
    pub limit: Option<i64>,
}

/// FeeRouter `PlatformFeeRouted` 投影：汇总 + 分页（110、70、04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminFeeRouterRoutedQuery {
    pub limit: Option<u32>,
    pub cursor: Option<String>,
    pub chain_id: Option<i64>,
}

/// RegionVault `RegionVaultForwarded` 投影：query 形与 FeeRouter 管理端一致（110、70、04 §3.5）
pub type AdminRegionVaultForwardedQuery = AdminFeeRouterRoutedQuery;

/// **`GET …/region-vault/forwarded-events/export`**：只读快照导出（**`region_vault_forwarded_events`**；P5-2-B）。
#[derive(Debug, Deserialize)]
pub struct AdminRegionVaultForwardedExportQuery {
    #[serde(default = "default_region_vault_forwarded_export_format")]
    pub format: String,
    pub chain_id: Option<i64>,
    pub limit: Option<u32>,
}

fn default_region_vault_forwarded_export_format() -> String {
    "csv".to_string()
}

/// **`GET …/finance/summary/export`**：`format` 缺省 **`csv`**（200 §3.6 审计导出最小能力）。
#[derive(Debug, Deserialize)]
pub struct AdminFinanceSummaryExportQuery {
    #[serde(default = "default_finance_summary_export_format")]
    pub format: String,
}

fn default_finance_summary_export_format() -> String {
    "csv".to_string()
}

/// Phase 5 / 07：运营低分评价抽样；max_score=2 即 1～2 星。
#[derive(Debug, Deserialize)]
pub struct AdminReviewsQuery {
    pub limit: Option<i64>,
    pub min_score: Option<i16>,
    pub max_score: Option<i16>,
}

/// Admin 订单列表：可选 **`limit`**（1～500，缺省 100）、**`state`**（与 **`order_state_to_str`** 同形，如 **`draft`**）。
#[derive(Debug, Deserialize)]
pub struct AdminOrdersListQuery {
    pub limit: Option<i64>,
    pub state: Option<String>,
}

/// Admin 争议列表：可选 **`limit`**（1～500，缺省 100）、**`status`**（与列表行 **`status`** 精确匹配）。
#[derive(Debug, Deserialize)]
pub struct AdminDisputesListQuery {
    pub limit: Option<i64>,
    pub status: Option<String>,
}

/// Admin 用户列表：可选 **`limit`**（1～500，缺省 100）、**`role`** / **`kyc_status`**（与行内字段精确匹配）。
#[derive(Debug, Deserialize)]
pub struct AdminUsersListQuery {
    pub limit: Option<i64>,
    pub role: Option<String>,
    pub kyc_status: Option<String>,
}

/// Admin 向导台账：可选 **`limit`**（1～500，缺省 100）、**`status`**（与向导 **`status`** 精确匹配）。
#[derive(Debug, Deserialize)]
pub struct AdminGuidesListQuery {
    pub limit: Option<i64>,
    pub status: Option<String>,
}

/// **`PATCH /api/v1/admin/guides/:id`**：向导资质审核状态与拒绝信息（B-080）
#[derive(Debug, Deserialize)]
pub struct AdminPatchGuideRegistrationBody {
    pub status: String,
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    #[serde(default)]
    pub rejection_message: Option<String>,
}

fn is_allowed_guide_registration_status(s: &str) -> bool {
    matches!(
        s,
        "pending" | "active" | "rejected" | "suspended" | "pending_review"
    )
}

/// **`GET …/admin/audit/operations`**：可选 **`limit`**（1～200，缺省 50）；**`operations`** 为与本文件 **`write_admin_audit_log_best_effort`** 已用 **`action`** 对齐的静态目录（**`applied_filters.source`**=`action_catalog_v1`）；**`limit`** 截断返回条数；全量审计事件导出仍以 120/200 流水线为准。
#[derive(Debug, Default, Deserialize)]
pub struct AdminAuditOperationsQuery {
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminRoleChangeRequestBody {
    pub target_role: String,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminApprovalActionBody {
    pub reason: Option<String>,
}

/// POST /api/v1/admin/flags/:id/publish（240、04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminFlagPublishBody {
    pub enabled: bool,
    #[serde(default)]
    pub rollout_percent: Option<i32>,
    /// `null` in JSON clears region; omitted keeps previous value.
    #[serde(default)]
    pub region: Option<Option<String>>,
    pub expected_version: i64,
}

/// POST /api/v1/admin/policies/:id/publish（04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminPolicyPublishBody {
    /// `draft` | `active` | `deprecated`
    pub status: String,
    pub expected_version: i32,
}

/// POST /api/v1/admin/tenants/scopes/:id/publish（04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminTenantScopePublishBody {
    /// `draft` | `active` | `sunset`
    pub status: String,
    pub expected_version: i32,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminComplianceDataRequestEventsQuery {
    pub limit: Option<i64>,
    /// **`event_type` 子串**（trim；空或 **>128** 忽略；**ILIKE**，`%`/`_` 已服务端转义）
    #[serde(default)]
    pub event_type: Option<String>,
}

/// POST /api/v1/admin/compliance/data-requests/:request_id/update（500、04 §3.5）
#[derive(Debug, Deserialize)]
pub struct AdminComplianceDataRequestUpdateBody {
    pub expected_version: i32,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    pub event_type: String,
    #[serde(default)]
    pub event_detail: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminJobsQuery {
    pub limit: Option<i64>,
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminSchedulerJobsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub job_code: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminFlagsQuery {
    pub limit: Option<i64>,
    /// **`flag_code` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub flag_code: Option<String>,
    /// **`true`/`false`/`1`/`0`/`yes`/`no`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub enabled: Option<String>,
    /// 精确匹配 **`scope`**（trim；**1～64** **`[a-zA-Z0-9._-]`**；空忽略；非法 **400**）
    #[serde(default)]
    pub scope: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminConfigReleasesQuery {
    pub limit: Option<i64>,
    /// 精确匹配 **`config_releases.release_key`**（trim；空或 **>256** 字符忽略）
    #[serde(default)]
    pub release_key: Option<String>,
    /// **`draft`** / **`published`** / **`rolled_back`**（trim；空忽略；非法值 **400**）
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminSecretsMetadataQuery {
    pub limit: Option<i64>,
    /// **`key_alias` 子串**（trim；空或 **>256** 字符忽略；**ILIKE**，`%`/`_` 已服务端转义）
    #[serde(default)]
    pub key_alias: Option<String>,
    /// **`active`** / **`deprecated`** / **`revoked`** / **`pending`** / **`suspended`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub status: Option<String>,
    /// 精确匹配 **`env_scope`**（trim；**1～64** 字符 **`[a-zA-Z0-9._-]`**；空忽略；非法 **400**）
    #[serde(default)]
    pub env_scope: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminApiVersionsQuery {
    pub limit: Option<i64>,
    /// **`api_version` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub api_version: Option<String>,
    /// **`planned`** / **`active`** / **`deprecated`** / **`sunset`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminLifecycleStateMachinesQuery {
    pub limit: Option<i64>,
    /// **`machine_code` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub machine_code: Option<String>,
    /// **`domain` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub domain: Option<String>,
    /// **`entity_type` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub entity_type: Option<String>,
    /// **`version` 子串**（trim；空或 **>32** 忽略；**ILIKE**）
    #[serde(default)]
    pub version: Option<String>,
    /// **`source_of_truth` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub source_of_truth: Option<String>,
    /// **`true`/`false`/`1`/`0`/`yes`/`no`**（trim；空忽略；非法 **400**）
    #[serde(default)]
    pub anomaly_flag: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminPoliciesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub policy_code: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub scope_type: Option<String>,
    #[serde(default)]
    pub binding_role: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminTenantScopesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub tenant_key: Option<String>,
    #[serde(default)]
    pub region_code: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub scope_class: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityReportsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub status: Option<String>,
    /// 精确 **`reporter_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_community_reports_reporter_id_filter`**）
    #[serde(default)]
    pub reporter_id: Option<String>,
    /// **`target_type` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub target_type: Option<String>,
    /// **`reason_code` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub reason_code: Option<String>,
    /// 精确 **`target_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_community_reports_target_id_filter`**）
    #[serde(default)]
    pub target_id: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityAppealsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub report_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityModerationPenaltyInline {
    pub action: String,
    #[serde(default)]
    pub subject_user_id: Option<String>,
    #[serde(default)]
    pub reason: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityModerationBody {
    pub expected_version: i32,
    pub status: String,
    #[serde(default)]
    pub admin_notes: Option<String>,
    #[serde(default)]
    pub disposition: Option<String>,
    /// 与 `status: resolved` 同事务写入 `community_penalties`（可选）。
    #[serde(default)]
    pub record_penalty: Option<AdminCommunityModerationPenaltyInline>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityPenaltiesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub subject_user_id: Option<String>,
    #[serde(default)]
    pub report_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityModerationCasesQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub report_id: Option<String>,
    /// 精确 **`actor_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_moderation_cases_query_actor_id_filter`**）
    #[serde(default)]
    pub actor_id: Option<String>,
    /// **`status_before` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub status_before: Option<String>,
    /// **`status_after` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub status_after: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityRiskSignalsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub subject_user_id: Option<String>,
    /// **`signal_type` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub signal_type: Option<String>,
    /// **`rule_id` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub rule_id: Option<String>,
    /// **`severity` 子串**（trim；空或 **>64** 忽略；**ILIKE**）
    #[serde(default)]
    pub severity: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityPolicyChangeLogsQuery {
    pub limit: Option<i64>,
    /// **`scope` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub scope: Option<String>,
    /// **`summary` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub summary: Option<String>,
    /// **`source` 子串**（trim；空或 **>128** 忽略；**ILIKE**，**NULL** 行按空串参与匹配）
    #[serde(default)]
    pub source: Option<String>,
    /// 精确 **`actor_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_community_policy_change_logs_actor_id_filter`**）
    #[serde(default)]
    pub actor_id: Option<String>,
}

fn community_abuse_policy_patch_is_empty(p: &db::CommunityAbusePolicyPatch) -> bool {
    p.comment_rate_window_sec.is_none()
        && p.comment_max_per_window.is_none()
        && p.comment_min_interval_sec.is_none()
        && p.comment_duplicate_lookback_sec.is_none()
        && p.post_rate_window_sec.is_none()
        && p.post_max_per_window.is_none()
        && p.post_min_interval_sec.is_none()
        && p.post_duplicate_lookback_sec.is_none()
        && p.report_rate_window_sec.is_none()
        && p.report_max_per_window.is_none()
        && p.report_min_interval_sec.is_none()
        && p.report_duplicate_target_lookback_sec.is_none()
}

/// PATCH /api/v1/admin/community/comments/:id（160、04 §3.4：评论可见性）
#[derive(Debug, Deserialize)]
pub struct AdminCommunityCommentVisibilityBody {
    pub visibility_status: String,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityPenaltyCreateBody {
    pub subject_user_id: String,
    pub action: String,
    #[serde(default)]
    pub report_id: Option<String>,
    #[serde(default)]
    pub reason: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
    #[serde(default)]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCommunityAppealReviewBody {
    pub expected_version: i32,
    /// `accepted` | `rejected`
    pub decision: String,
    #[serde(default)]
    pub reviewer_note: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminCommunityRankingSnapshotsQuery {
    pub limit: Option<i64>,
    /// **`feed_mode` 子串**（trim；空或 **>128** 忽略；**ILIKE**）
    #[serde(default)]
    pub feed_mode: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminComplianceDataRequestsQuery {
    pub limit: Option<i64>,
    /// **`request_ref` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub request_ref: Option<String>,
    /// **`subject_id` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub subject_id: Option<String>,
    /// **`export`** / **`erasure`**（trim；空忽略；非法 **`400 invalid_compliance_request_type_filter`**）
    #[serde(default)]
    pub request_type: Option<String>,
    /// **`open`** / **`in_progress`** / **`completed`** / **`rejected`** / **`cancelled`**（trim；空忽略；非法 **`400 invalid_compliance_request_status_filter`**）
    #[serde(default)]
    pub status: Option<String>,
    /// **`jurisdiction` 子串**（trim；空或 **>128** 忽略；**ILIKE**，对 NULL 行按空串参与匹配）
    #[serde(default)]
    pub jurisdiction: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminInternalToolAuditsQuery {
    pub limit: Option<i64>,
    #[serde(default)]
    pub tool_id: Option<String>,
    #[serde(default)]
    pub action_code: Option<String>,
    #[serde(default)]
    pub actor_id: Option<String>,
    #[serde(default)]
    pub approval_request_id: Option<String>,
}

/// GET /api/v1/admin/media/signed-url-tokens（270、70、04 §3.5）
#[derive(Debug, Default, Deserialize)]
pub struct AdminMediaSignedUrlTokensQuery {
    pub limit: Option<i64>,
    /// **`object_id` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub object_id: Option<String>,
    /// **`read` | `download`**；trim；空忽略；非法 **400** **`invalid_media_signed_url_tokens_scope_filter`**（先于 DB）
    #[serde(default)]
    pub url_scope: Option<String>,
    /// 精确 **`issued_to`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_media_signed_url_tokens_issued_to_filter`**）
    #[serde(default)]
    pub issued_to: Option<String>,
    /// 精确 **令牌行 `id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_media_signed_url_tokens_token_id_filter`**）
    #[serde(default)]
    pub token_id: Option<String>,
}

/// GET /api/v1/admin/media/access-logs（270、70、04 §3.5）
#[derive(Debug, Default, Deserialize)]
pub struct AdminMediaAccessLogsQuery {
    pub limit: Option<i64>,
    /// 精确匹配 **`action`**：`[A-Za-z0-9_]{1,64}`；trim；空忽略；非法 **400** **`invalid_media_access_logs_action`**
    #[serde(default)]
    pub action: Option<String>,
    /// **`object_id` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub object_id: Option<String>,
    /// **`actor_or_ip` 子串**（trim；空或 **>256** 忽略；**ILIKE**）
    #[serde(default)]
    pub actor_or_ip: Option<String>,
    /// 精确匹配 **`token_id`**（trim；空忽略；非空须 **UUID**；非法 **400** **`invalid_media_access_logs_token_id_filter`**）
    #[serde(default)]
    pub token_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminSchedulerRerunBody {
    pub reason: Option<String>,
}

fn request_id_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

async fn write_admin_audit_log_best_effort(
    state: &ApiMetaState,
    actor_id: Uuid,
    request_id: Option<&str>,
    action: &str,
    resource_type: Option<&str>,
    resource_id: Option<&str>,
    payload: serde_json::Value,
) {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        let _ = db::insert_admin_audit_log(
            pool,
            actor_id,
            request_id,
            action,
            resource_type,
            resource_id,
            &payload,
        )
        .await;
    }
}

async fn require_admin_actor(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Result<(Uuid, String), Response> {
    let uid = match extract_user_with_session_check(state, headers).await {
        Some(u) => u,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response())
        }
    };

    let Some(ref co) = state.chain_off else {
        return Err(not_impl_json("GET /api/v1/admin/*").into_response());
    };

    let store = co.store.read().await;
    let Some(caller) = store.users.get(&uid) else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key("user_not_found")),
        )
            .into_response());
    };

    // 70 当前阶段最小收口：仅 admin/super_admin 可访问。
    if caller.role != "admin" && caller.role != "super_admin" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("admin_required")),
        )
            .into_response());
    }

    Ok((uid, caller.role.clone()))
}

async fn require_super_admin_uid(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Result<Uuid, Response> {
    let (uid, role) = require_admin_actor(state, headers).await?;
    if role != "super_admin" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("super_admin_required")),
        )
            .into_response());
    }
    Ok(uid)
}

fn admin_db_pool_required(state: &ApiMetaState) -> Result<&sqlx::PgPool, Response> {
    state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
        .ok_or_else(|| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key("admin_db_required")),
            )
                .into_response()
        })
}

fn is_supported_target_role(role: &str) -> bool {
    matches!(
        role,
        "tourist"
            | "traveler"
            | "guide"
            | "arbitrator"
            | "admin"
            | "super_admin"
            | "provider"
            | "region_steward"
    )
}

/// `action` 精确过滤：`[A-Za-z0-9_]{1,64}`，否则返回 Err（400）。
fn parse_media_access_logs_action_filter(raw: &Option<String>) -> Result<Option<&str>, ()> {
    let Some(s) = raw.as_ref() else {
        return Ok(None);
    };
    let t = s.trim();
    if t.is_empty() {
        return Ok(None);
    }
    if t.len() > 64 {
        return Err(());
    }
    if !t.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err(());
    }
    Ok(Some(t))
}

/// `url_scope` 精确过滤：`read` | `download`，否则 Err（400）。
fn parse_media_signed_url_tokens_scope_filter(
    raw: &Option<String>,
) -> Result<Option<&'static str>, ()> {
    let Some(s) = raw.as_ref() else {
        return Ok(None);
    };
    let t = s.trim();
    if t.is_empty() {
        return Ok(None);
    }
    let tl = t.to_ascii_lowercase();
    match tl.as_str() {
        "read" => Ok(Some("read")),
        "download" => Ok(Some("download")),
        _ => Err(()),
    }
}

pub async fn get_admin_users(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminUsersListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/users").into_response();
    };

    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let mut limit = q.limit.unwrap_or(100);
    if limit < 1 {
        limit = 1;
    }
    if limit > 500 {
        limit = 500;
    }
    let role_filter = q.role.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let kyc_filter = q
        .kyc_status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let store = co.store.read().await;

    let mut items: Vec<_> = store
        .users
        .values()
        .filter(|u| {
            role_filter.map_or(true, |r| u.role == r)
                && kyc_filter.map_or(true, |k| u.kyc_status == k)
        })
        .map(|u| {
            json!({
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "kyc_status": u.kyc_status,
                "created_at": u.created_at,
                "updated_at": u.updated_at,
            })
        })
        .collect();
    items.sort_by(|a, b| {
        b.get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .cmp(
                a.get("created_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default(),
            )
    });
    let total_after_filter = items.len();
    items.truncate(limit as usize);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.users.read",
        Some("users"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "role": role_filter,
            "kyc_status": kyc_filter,
            "matched_before_limit": total_after_filter,
            "source": "memory",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "role": role_filter,
            "kyc_status": kyc_filter,
            "source": "memory",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_user_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/users/:id").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let user_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_user_id", "message": "invalid_user_id"})),
            )
                .into_response()
        }
    };

    let request_id = request_id_from_headers(&headers);

    let store = co.store.read().await;
    let Some(u) = store.users.get(&user_uuid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "user_not_found", "message": "user_not_found"})),
        )
            .into_response();
    };

    let mut body = chain_off::user_admin_detail_envelope(u);
    admin_attach_meta_build(&mut body);

    let resource_id = user_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.users.detail.read",
        Some("users"),
        Some(resource_id.as_str()),
        json!({ "user_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

/// 70 向导域最小只读：链下 `guides` 台账（不含护照哈希；材料 URL 供运营核对）
pub async fn get_admin_guides(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminGuidesListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/guides").into_response();
    };

    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let mut limit = q.limit.unwrap_or(100);
    if limit < 1 {
        limit = 1;
    }
    if limit > 500 {
        limit = 500;
    }
    let status_filter = q.status.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let store = co.store.read().await;

    let mut items: Vec<_> = store
        .guides
        .values()
        .filter(|g| status_filter.map_or(true, |sf| g.status == sf))
        .map(|g| chain_off::guide_admin_row_json(g))
        .collect();
    items.sort_by(|a, b| {
        b.get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .cmp(
                a.get("created_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default(),
            )
    });
    let total_after_filter = items.len();
    items.truncate(limit as usize);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.guides.read",
        Some("guides"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "status": status_filter,
            "matched_before_limit": total_after_filter,
            "source": "memory",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "status": status_filter,
            "source": "memory",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// 70：向导监管详情；与 `GET /api/v1/admin/guides` 列表行同形；不含护照哈希。
pub async fn get_admin_guide_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/guides/:id").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let guide_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_guide_id", "message": "invalid_guide_id"})),
            )
                .into_response()
        }
    };

    let request_id = request_id_from_headers(&headers);

    let store = co.store.read().await;
    let Some(g) = store.guides.get(&guide_uuid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "guide_not_found", "message": "guide_not_found"})),
        )
            .into_response();
    };

    let mut body = chain_off::guide_admin_detail_envelope(g);
    admin_attach_meta_build(&mut body);

    let resource_id = guide_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.guides.detail.read",
        Some("guides"),
        Some(resource_id.as_str()),
        json!({ "guide_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn patch_admin_guide_registration(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchGuideRegistrationBody>,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("PATCH /api/v1/admin/guides/:id").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let guide_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_guide_id", "message": "invalid_guide_id"})),
            )
                .into_response()
        }
    };

    let st_norm = body.status.trim().to_ascii_lowercase();
    if st_norm.is_empty() || !is_allowed_guide_registration_status(&st_norm) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_guide_status")),
        )
            .into_response();
    }

    let codes_raw: Vec<String> = body
        .rejection_codes
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .take(32)
        .collect();
    for c in &codes_raw {
        if c.len() > 120 {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("rejection_code_too_long")),
            )
                .into_response();
        }
    }

    let msg_trim = body
        .rejection_message
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    if msg_trim.as_ref().is_some_and(|s| s.len() > 4000) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("rejection_message_too_long")),
        )
            .into_response();
    }

    let (store_codes, store_msg) = if st_norm == "rejected" {
        if codes_raw.is_empty() && msg_trim.is_none() {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "rejection_detail_required",
                    "rejected status requires non-empty rejection_codes and/or rejection_message",
                )),
            )
                .into_response();
        }
        (codes_raw, msg_trim)
    } else {
        (Vec::new(), None)
    };

    let request_id = request_id_from_headers(&headers);
    let now = Utc::now();
    {
        let mut store = co.store.write().await;
        let Some(g) = store.guides.get_mut(&guide_uuid) else {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "guide_not_found", "message": "guide_not_found"})),
            )
                .into_response();
        };
        g.status = st_norm.clone();
        g.rejection_codes = store_codes.clone();
        g.rejection_message = store_msg.clone();
        g.updated_at = now;
    }

    if let Some(ref pool) = co.db_pool {
        if let Err(e) = db::update_guide_registration_review(
            pool,
            guide_uuid,
            &st_norm,
            &store_codes,
            store_msg.as_deref(),
            now,
        )
        .await
        {
            eprintln!(
                "[audit] db update_guide_registration_review failed guide_id={} error={}",
                guide_uuid, e
            );
        }
    }

    let store = co.store.read().await;
    let Some(g) = store.guides.get(&guide_uuid) else {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("guide_not_found_after_update")),
        )
            .into_response();
    };
    let mut out = chain_off::guide_admin_detail_envelope(g);
    admin_attach_meta_build(&mut out);

    let resource_id = guide_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.guides.registration.patch",
        Some("guides"),
        Some(resource_id.as_str()),
        json!({
            "guide_id": resource_id,
            "status": st_norm,
            "rejection_codes": store_codes,
            "has_rejection_message": store_msg.is_some(),
        }),
    )
    .await;

    Json(out).into_response()
}

pub async fn get_admin_orders(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOrdersListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/orders").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let mut limit = q.limit.unwrap_or(100);
    if limit < 1 {
        limit = 1;
    }
    if limit > 500 {
        limit = 500;
    }
    let state_filter = q.state.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let store = co.store.read().await;
    let mut items: Vec<_> = store
        .orders
        .values()
        .filter(|o| state_filter.map_or(true, |sf| chain_off::order_state_to_str(o.state) == sf))
        .map(|o| {
            json!({
                "id": o.id,
                "tourist_id": o.tourist_id,
                "traveler_id": o.tourist_id,
                "guide_id": o.guide_id,
                "amount": o.amount,
                "currency": o.currency,
                "state": chain_off::order_state_to_str(o.state),
                "created_at": o.created_at,
                "updated_at": o.updated_at,
                "escrow_address": o.escrow_address,
            })
        })
        .collect();
    items.sort_by(|a, b| {
        b.get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .cmp(
                a.get("created_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default(),
            )
    });
    let total_after_filter = items.len();
    items.truncate(limit as usize);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.orders.read",
        Some("orders"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "state": state_filter,
            "matched_before_limit": total_after_filter,
            "source": "memory",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "state": state_filter,
            "source": "memory",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_order_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/orders/:id").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let order_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_order_id", "message": "invalid_order_id"})),
            )
                .into_response()
        }
    };

    let request_id = request_id_from_headers(&headers);

    let store = co.store.read().await;
    let Some(o) = store.orders.get(&order_uuid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        )
            .into_response();
    };

    let deadline_as_of_utc = state.order_deadline_clock.now_utc();
    let rating_resolution = chain_off::rating_review_window_resolution_for_orders_api(
        &co.config,
        state.chain_config.as_ref(),
    )
    .await;
    let mut body = chain_off::order_detail_envelope(
        &store,
        o,
        &rating_resolution,
        state.chain_config.as_ref(),
        deadline_as_of_utc,
    );
    admin_attach_meta_build(&mut body);

    let resource_id = order_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.orders.detail.read",
        Some("orders"),
        Some(resource_id.as_str()),
        json!({ "order_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_reviews(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminReviewsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/reviews").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let mut limit = q.limit.unwrap_or(100);
    if limit < 1 {
        limit = 1;
    }
    if limit > 500 {
        limit = 500;
    }

    let (items, source) = if let Some(pool) = co.db_pool.as_ref() {
        match db::list_reviews_admin(pool, limit, q.min_score, q.max_score).await {
            Ok(rows) => (
                rows.into_iter()
                    .map(|ar| {
                        let r = ar.row;
                        let (tourist_id, traveler_id) =
                            chain_off::dispute_party_mirror_ids(ar.order_tourist_id);
                        json!({
                            "id": r.id.to_string(),
                            "order_id": r.order_id.to_string(),
                            "tourist_id": tourist_id,
                            "traveler_id": traveler_id,
                            "reviewer_id": r.reviewer_id.to_string(),
                            "reviewee_id": r.reviewee_id.to_string(),
                            "score": r.score,
                            "weight": r.weight,
                            "comment": r.comment,
                            "created_at": r.created_at.to_rfc3339(),
                        })
                    })
                    .collect::<Vec<_>>(),
                "database",
            ),
            Err(e) => {
                eprintln!(
                    "[audit] list_reviews_admin db query failed; falling back to memory: {}",
                    e
                );
                let store = co.store.read().await;
                (
                    admin_reviews_json_from_memory(&store, &q, limit),
                    "memory_fallback",
                )
            }
        }
    } else {
        let store = co.store.read().await;
        (admin_reviews_json_from_memory(&store, &q, limit), "memory")
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.reviews.read",
        Some("reviews"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "min_score": q.min_score,
            "max_score": q.max_score,
            "source": source,
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "min_score": q.min_score,
            "max_score": q.max_score,
            "source": source,
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_review_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/reviews/:id").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let review_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_review_id", "message": "invalid_review_id"})),
            )
                .into_response()
        }
    };

    let request_id = request_id_from_headers(&headers);

    // `Some(join)`: DB path — join = LEFT JOIN orders.tourist_id; `None`: memory path — resolve below.
    let (r, source, order_tourist_id_from_join): (
        chain_off::ReviewRow,
        &'static str,
        Option<Option<Uuid>>,
    ) = if let Some(pool) = co.db_pool.as_ref() {
        match db::fetch_review_by_id(pool, review_uuid).await {
            Ok(Some(ar)) => {
                let row = db_review_to_chain_row(ar.row);
                (row, "database", Some(ar.order_tourist_id))
            }
            Ok(None) => {
                let store = co.store.read().await;
                let m = store.reviews.iter().find(|r| r.id == review_uuid).cloned();
                let Some(row) = m else {
                    return (
                        StatusCode::NOT_FOUND,
                        Json(json!({"error": "review_not_found", "message": "review_not_found"})),
                    )
                        .into_response();
                };
                (row, "memory", None)
            }
            Err(e) => {
                eprintln!(
                    "[audit] fetch_review_by_id failed; falling back to memory: {}",
                    e
                );
                let store = co.store.read().await;
                let m = store.reviews.iter().find(|r| r.id == review_uuid).cloned();
                let Some(row) = m else {
                    return (
                        StatusCode::NOT_FOUND,
                        Json(json!({"error": "review_not_found", "message": "review_not_found"})),
                    )
                        .into_response();
                };
                (row, "memory_fallback", None)
            }
        }
    } else {
        let store = co.store.read().await;
        let m = store.reviews.iter().find(|r| r.id == review_uuid).cloned();
        let Some(row) = m else {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "review_not_found", "message": "review_not_found"})),
            )
                .into_response();
        };
        (row, "memory", None)
    };

    let order_tourist_id = if let Some(tid) = order_tourist_id_from_join {
        tid
    } else {
        let store = co.store.read().await;
        if let Some(o) = store.orders.get(&r.order_id) {
            Some(o.tourist_id)
        } else {
            drop(store);
            if let Some(pool) = co.db_pool.as_ref() {
                match db::get_order_by_id(pool, r.order_id).await {
                    Ok(Some(o)) => Some(o.tourist_id),
                    Ok(None) | Err(_) => None,
                }
            } else {
                None
            }
        }
    };

    let mut body = chain_off::review_admin_detail_envelope(&r, source, order_tourist_id);
    admin_attach_meta_build(&mut body);

    let resource_id = review_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.reviews.detail.read",
        Some("reviews"),
        Some(resource_id.as_str()),
        json!({ "review_id": resource_id, "source": source }),
    )
    .await;

    Json(body).into_response()
}

/// **Task C-1**：多源对拍只读 JSON（**`fee-pool-aggregates`** 投影、**`governance/pool`**、**`protocol-reference`** 镜像）；**不**改写各源 handler。
pub async fn get_admin_cross_check(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let mut body = match super::admin_cross_check::build_admin_cross_check_value(&state).await {
        Ok(v) => v,
        Err(detail) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "status": "error",
                    "error": "cross_check_upstream_failed",
                    "message": "cross_check_upstream_failed",
                    "detail": detail,
                })),
            )
                .into_response();
        }
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.cross_check.read",
        Some("governance"),
        None,
        json!({}),
    )
    .await;

    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// **只读**：**`fee-pool-aggregates.cross_check`** 与 **`protocol-reference`** 重算切片对拍（见 **`drift_summary`** 与 **`admin_cross_check::summarize_fee_pool_protocol_drift`**）。
pub async fn get_admin_drift_summary(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let cross = match super::admin_cross_check::build_admin_cross_check_value(&state).await {
        Ok(v) => v,
        Err(detail) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "status": "error",
                    "error": "cross_check_upstream_failed",
                    "message": "cross_check_upstream_failed",
                    "detail": detail,
                })),
            )
                .into_response();
        }
    };

    let drift = cross
        .get("drift_summary")
        .cloned()
        .unwrap_or(json!({
            "drift_detected": true,
            "delta": [json!({"field": "drift_summary", "expected": "object", "actual": null})],
        }));

    let mut body = json!({
        "status": "ok",
        "drift_detected": drift["drift_detected"],
        "delta": drift["delta"],
    });

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.drift_summary.read",
        Some("governance"),
        None,
        json!({
            "drift_detected": drift["drift_detected"],
            "delta_len": drift["delta"].as_array().map(Vec::len).unwrap_or(0),
        }),
    )
    .await;

    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_finance_summary(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/finance/summary").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);
    let computed = compute_admin_finance_summary(&state, co).await;

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.finance.summary.read",
        Some("orders"),
        None,
        computed.audit_detail.clone(),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "meta": computed.meta,
        "summary": computed.summary,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_finance_summary_export(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFinanceSummaryExportQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    use axum::body::Body;
    use axum::http::header::{HeaderValue, CONTENT_DISPOSITION, CONTENT_TYPE};

    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/finance/summary/export").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let fmt = q.format.trim().to_ascii_lowercase();
    if fmt != "csv" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "bad_request",
                "message": "format must be csv",
            })),
        )
            .into_response();
    }

    let request_id = request_id_from_headers(&headers);
    let computed = compute_admin_finance_summary(&state, co).await;
    let csv = finance_summary_to_csv(&computed.meta, &computed.summary);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.finance.summary.export",
        Some("orders"),
        None,
        json!({
            "format": "csv",
            "detail": computed.audit_detail,
        }),
    )
    .await;

    let filename = format!(
        "finance-summary-{}.csv",
        Utc::now().format("%Y%m%dT%H%M%SZ")
    );
    let disp = format!("attachment; filename=\"{filename}\"");
    let Ok(disp_val) = HeaderValue::from_str(&disp) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid filename").into_response();
    };

    match Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, "text/csv; charset=utf-8")
        .header(CONTENT_DISPOSITION, disp_val)
        .body(Body::from(csv))
    {
        Ok(r) => r.into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "body build failed").into_response(),
    }
}

pub async fn get_admin_fee_router_routed_events(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFeeRouterRoutedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref _co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/fee-router/routed-events").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let limit = match db::parse_admin_fee_router_limit(q.limit) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    e,
                    format!(
                        "limit must be 1..={} or omit for default 50",
                        db::ADMIN_FEE_ROUTER_MAX_LIMIT
                    ),
                )),
            )
                .into_response();
        }
    };

    let (after_block, after_log) = match q.cursor.as_deref() {
        None | Some("") => (None, None),
        Some(s) => match db::parse_fee_routes_cursor(s) {
            Ok((b, l)) => (Some(b), Some(l)),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        e,
                        "cursor must be block_number:log_index from page.next_cursor",
                    )),
                )
                    .into_response();
            }
        },
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let stats = match db::fee_router_routed_stats(pool, q.chain_id).await {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "fee_router_stats_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let (rows, has_more) =
        match db::list_fee_router_routed_events(pool, q.chain_id, after_block, after_log, limit)
            .await
        {
            Ok(x) => x,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "fee_router_list_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        };

    let items: Vec<_> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "chain_id": r.chain_id,
                "block_number": r.block_number,
                "log_index": r.log_index,
                "block_hash": r.block_hash,
                "tx_hash": r.tx_hash,
                "router_address": r.router_address,
                "token_address": r.token_address,
                "amount_u256_hex": r.amount_u256_hex,
                "to_country_u256_hex": r.to_country_u256_hex,
                "to_stakers_u256_hex": r.to_stakers_u256_hex,
                "to_reserve_u256_hex": r.to_reserve_u256_hex,
                "to_ops_u256_hex": r.to_ops_u256_hex,
                "inserted_at": r.inserted_at.to_rfc3339()
            })
        })
        .collect();

    let next_cursor = rows
        .last()
        .map(|r| db::encode_fee_routes_cursor(r.block_number, r.log_index));

    let cursor_applied = match q.cursor.as_deref() {
        None | Some("") => json!(null),
        Some(s) => json!(s),
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.fee_router_routed.read",
        Some("fee_router_routed_events"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "chain_id_filter": q.chain_id,
            "stats_total": stats.total,
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "summary": {
            "total": stats.total,
            "max_block_number": stats.max_block_number,
            "min_block_number": stats.min_block_number,
            "latest_inserted_at": stats.latest_inserted_at.map(|t| t.to_rfc3339()),
            "chain_id_filter": q.chain_id,
        },
        "items": items,
        "page": {
            "has_more": has_more,
            "next_cursor": next_cursor,
        },
        "applied_filters": {
            "limit": limit,
            "cursor": cursor_applied,
            "chain_id": q.chain_id,
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_region_vault_forwarded_events(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRegionVaultForwardedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref _co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/region-vault/forwarded-events").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let limit = match db::parse_admin_fee_router_limit(q.limit) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    e,
                    format!(
                        "limit must be 1..={} or omit for default 50",
                        db::ADMIN_FEE_ROUTER_MAX_LIMIT
                    ),
                )),
            )
                .into_response();
        }
    };

    let (after_block, after_log) = match q.cursor.as_deref() {
        None | Some("") => (None, None),
        Some(s) => match db::parse_fee_routes_cursor(s) {
            Ok((b, l)) => (Some(b), Some(l)),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        e,
                        "cursor must be block_number:log_index from page.next_cursor",
                    )),
                )
                    .into_response();
            }
        },
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let stats = match db::region_vault_forwarded_stats(pool, q.chain_id).await {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "region_vault_stats_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let (rows, has_more) = match db::list_region_vault_forwarded_events(
        pool,
        q.chain_id,
        after_block,
        after_log,
        limit,
    )
    .await
    {
        Ok(x) => x,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "region_vault_list_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let items: Vec<_> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "chain_id": r.chain_id,
                "block_number": r.block_number,
                "log_index": r.log_index,
                "block_hash": r.block_hash,
                "tx_hash": r.tx_hash,
                "vault_address": r.vault_address,
                "token_address": r.token_address,
                "to_address": r.to_address,
                "amount_u256_hex": r.amount_u256_hex,
                "inserted_at": r.inserted_at.to_rfc3339()
            })
        })
        .collect();

    let next_cursor = rows
        .last()
        .map(|r| db::encode_fee_routes_cursor(r.block_number, r.log_index));

    let cursor_applied = match q.cursor.as_deref() {
        None | Some("") => json!(null),
        Some(s) => json!(s),
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.region_vault_forwarded.read",
        Some("region_vault_forwarded_events"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "chain_id_filter": q.chain_id,
            "stats_total": stats.total,
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "summary": {
            "total": stats.total,
            "max_block_number": stats.max_block_number,
            "min_block_number": stats.min_block_number,
            "latest_inserted_at": stats.latest_inserted_at.map(|t| t.to_rfc3339()),
            "chain_id_filter": q.chain_id,
        },
        "items": items,
        "page": {
            "has_more": has_more,
            "next_cursor": next_cursor,
        },
        "applied_filters": {
            "limit": limit,
            "cursor": cursor_applied,
            "chain_id": q.chain_id,
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_region_vault_forwarded_events_export(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRegionVaultForwardedExportQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    use axum::body::Body;
    use axum::http::header::{HeaderValue, CONTENT_DISPOSITION, CONTENT_TYPE};

    let Some(ref _co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/region-vault/forwarded-events/export")
            .into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let limit = match db::parse_admin_region_vault_export_limit(q.limit) {
        Ok(n) => n,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_limit",
                    format!(
                        "limit must be 1..={} or omit for default {}",
                        db::ADMIN_REGION_VAULT_EXPORT_MAX_ROWS,
                        db::ADMIN_REGION_VAULT_EXPORT_MAX_ROWS
                    ),
                )),
            )
                .into_response();
        }
    };

    let fmt = q.format.trim().to_ascii_lowercase();
    if fmt != "csv" && fmt != "json" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "bad_request",
                "format must be csv or json",
            )),
        )
            .into_response();
    }

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let (rows, truncated) = match db::list_region_vault_forwarded_events_export(
        pool, q.chain_id, limit,
    )
    .await
    {
        Ok(x) => x,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "region_vault_export_list_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let export_detail = json!({
        "format": fmt,
        "limit": limit,
        "chain_id_filter": q.chain_id,
        "returned": rows.len(),
        "truncated": truncated,
    });
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.region_vault_forwarded.export",
        Some("region_vault_forwarded_events"),
        None,
        export_detail,
    )
    .await;

    if fmt == "csv" {
        let csv = region_vault_forwarded_export_csv(&rows);
        let csv_bytes = csv.into_bytes();
        let body_sha = reconcile_export_response_sha256_hex(&csv_bytes);
        let ed25519_hex =
            reconcile_export_ed25519_hex(state.reconcile_export_ed25519_key.as_deref(), &csv_bytes);
        let filename = format!(
            "region-vault-forwarded-events-{}.csv",
            Utc::now().format("%Y%m%dT%H%M%SZ")
        );
        let disp = format!("attachment; filename=\"{filename}\"");
        let Ok(disp_val) = HeaderValue::from_str(&disp) else {
            return (StatusCode::INTERNAL_SERVER_ERROR, "invalid filename").into_response();
        };
        let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
            return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
        };
        let mut rb = Response::builder()
            .status(StatusCode::OK)
            .header(CONTENT_TYPE, "text/csv; charset=utf-8")
            .header(CONTENT_DISPOSITION, disp_val)
            .header(RECONCILE_EXPORT_BODY_SHA256_HEADER, sha_hdr);
        if truncated {
            rb = rb.header(
                RECONCILE_EXPORT_TRUNCATED_HEADER,
                HeaderValue::from_static("1"),
            );
        }
        if let Some(ref eh) = ed25519_hex {
            if let Ok(hv) = HeaderValue::from_str(eh) {
                rb = rb.header(RECONCILE_EXPORT_ED25519_HEADER, hv);
            }
        }
        return match rb.body(Body::from(csv_bytes)) {
            Ok(r) => r.into_response(),
            Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "body build failed").into_response(),
        };
    }

    let row_vals: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "chain_id": r.chain_id,
                "block_number": r.block_number,
                "log_index": r.log_index,
                "block_hash": r.block_hash,
                "tx_hash": r.tx_hash,
                "vault_address": r.vault_address,
                "token_address": r.token_address,
                "to_address": r.to_address,
                "amount_u256_hex": r.amount_u256_hex,
                "inserted_at": r.inserted_at.to_rfc3339(),
                "id": r.id.to_string(),
            })
        })
        .collect();
    let mut body = json!({
        "rows": row_vals,
        "exported_at": Utc::now().to_rfc3339(),
        "filter_applied": {
            "chain_id": q.chain_id,
            "limit": limit,
        },
        "truncated": truncated,
    });
    admin_attach_meta_build(&mut body);
    let bytes = match serde_json::to_vec(&body) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("region_vault_export_json_encode_failed")),
            )
                .into_response();
        }
    };
    let body_sha = reconcile_export_response_sha256_hex(&bytes);
    let ed25519_hex =
        reconcile_export_ed25519_hex(state.reconcile_export_ed25519_key.as_deref(), &bytes);
    let filename = format!(
        "region-vault-forwarded-events-{}.json",
        Utc::now().format("%Y%m%dT%H%M%SZ")
    );
    let disp = format!("attachment; filename=\"{filename}\"");
    let Ok(disp_val) = HeaderValue::from_str(&disp) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid filename").into_response();
    };
    let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
    };
    let mut rb = Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, "application/json; charset=utf-8")
        .header(CONTENT_DISPOSITION, disp_val)
        .header(RECONCILE_EXPORT_BODY_SHA256_HEADER, sha_hdr);
    if truncated {
        rb = rb.header(
            RECONCILE_EXPORT_TRUNCATED_HEADER,
            HeaderValue::from_static("1"),
        );
    }
    if let Some(ref eh) = ed25519_hex {
        if let Ok(hv) = HeaderValue::from_str(eh) {
            rb = rb.header(RECONCILE_EXPORT_ED25519_HEADER, hv);
        }
    }
    match rb.body(Body::from(bytes)) {
        Ok(r) => r.into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "body build failed").into_response(),
    }
}

pub async fn get_admin_disputes(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminDisputesListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/disputes").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let mut limit = q.limit.unwrap_or(100);
    if limit < 1 {
        limit = 1;
    }
    if limit > 500 {
        limit = 500;
    }
    let status_filter = q.status.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let store = co.store.read().await;
    let mut items: Vec<_> = store
        .disputes
        .values()
        .filter(|d| status_filter.map_or(true, |sf| d.status == sf))
        .map(|d| {
            let order = store.orders.get(&d.order_id);
            let (tourist_id, traveler_id) = chain_off::dispute_party_mirror(order);
            json!({
                "id": d.id,
                "order_id": d.order_id,
                "tourist_id": tourist_id,
                "traveler_id": traveler_id,
                "status": d.status,
                "arbitrator_id": d.arbitrator_id,
                "refund_ratio": d.refund_ratio,
                "slash_guide": d.slash_guide,
                "created_at": d.created_at,
                "updated_at": d.updated_at,
            })
        })
        .collect();
    items.sort_by(|a, b| {
        b.get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .cmp(
                a.get("created_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default(),
            )
    });
    let total_after_filter = items.len();
    items.truncate(limit as usize);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.disputes.read",
        Some("disputes"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "status": status_filter,
            "matched_before_limit": total_after_filter,
            "source": "memory",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "status": status_filter,
            "source": "memory",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_dispute_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/admin/disputes/:id").into_response();
    };
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let dispute_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_dispute_id", "message": "invalid_dispute_id"})),
            )
                .into_response()
        }
    };

    let request_id = request_id_from_headers(&headers);

    let store = co.store.read().await;
    let Some(d) = store.disputes.get(&dispute_uuid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "dispute_not_found", "message": "dispute_not_found"})),
        )
            .into_response();
    };

    let order = store.orders.get(&d.order_id);
    let mut body = chain_off::dispute_detail_envelope(d, order);
    admin_attach_meta_build(&mut body);

    let resource_id = dispute_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.disputes.detail.read",
        Some("disputes"),
        Some(resource_id.as_str()),
        json!({ "dispute_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_schema_migrations(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminSchemaMigrationsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let schema_versions = match db::list_schema_versions(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("schema_versions_query_failed")),
            )
                .into_response()
        }
    };
    let migration_histories = match db::list_migration_histories(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("migration_histories_query_failed")),
            )
                .into_response()
        }
    };
    let migration_rollbacks = match db::list_migration_rollbacks(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("migration_rollbacks_query_failed")),
            )
                .into_response()
        }
    };
    let backfill_jobs = match db::list_backfill_jobs(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("backfill_jobs_query_failed")),
            )
                .into_response()
        }
    };
    let dual_write_checks = match db::list_dual_write_checks(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("dual_write_checks_query_failed")),
            )
                .into_response()
        }
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.schema.migrations.read",
        Some("schema_migrations"),
        None,
        json!({
            "limit": limit,
            "schema_versions_count": schema_versions.len(),
            "migration_histories_count": migration_histories.len(),
            "migration_rollbacks_count": migration_rollbacks.len(),
            "backfill_jobs_count": backfill_jobs.len(),
            "dual_write_checks_count": dual_write_checks.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "applied_filters": {
            "limit": limit,
        },
        "items": {
            "schema_versions": schema_versions.into_iter().map(|r| json!({
                "version_no": r.version_no,
                "status": r.status,
                "released_at": r.released_at,
                "updated_at": r.updated_at
            })).collect::<Vec<_>>(),
            "migration_histories": migration_histories.into_iter().map(|r| json!({
                "migration_id": r.migration_id,
                "from_version": r.from_version,
                "to_version": r.to_version,
                "result": r.result,
                "created_at": r.created_at
            })).collect::<Vec<_>>(),
            "migration_rollbacks": migration_rollbacks.into_iter().map(|r| json!({
                "rollback_id": r.rollback_id,
                "target_version": r.target_version,
                "trigger_reason": r.trigger_reason,
                "result": r.result,
                "created_at": r.created_at
            })).collect::<Vec<_>>(),
            "backfill_jobs": backfill_jobs.into_iter().map(|r| json!({
                "job_id": r.job_id,
                "scope": r.scope,
                "progress": r.progress,
                "error_count": r.error_count,
                "status": r.status,
                "updated_at": r.updated_at
            })).collect::<Vec<_>>(),
            "dual_write_checks": dual_write_checks.into_iter().map(|r| json!({
                "check_id": r.check_id,
                "old_digest": r.old_digest,
                "new_digest": r.new_digest,
                "diff_count": r.diff_count,
                "status": r.status,
                "checked_at": r.checked_at
            })).collect::<Vec<_>>()
        },
        "meta": {
            "note": "minimal schema evolution center read endpoint",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_indexer_health(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let runtime = if let Some(ref idx) = state.indexer_state {
        let g = idx.read().await;
        json!({
            "last_block": g.last_block,
            "last_log_index": g.last_log_index,
            "last_block_hash": g.last_block_hash,
            "events_cached": g.events.len(),
        })
    } else {
        json!({"status": "unavailable"})
    };

    let mut health = json!({
        "finality_n": state.finality_n,
        "checkpoint": {
            "block_number": state.indexer_checkpoint.block_number,
            "log_index": state.indexer_checkpoint.log_index,
        },
        "last_seen_finality_n": state.indexer_last_seen_finality_n,
        "replay_required": state.indexer_replay_required,
        "lag_blocks": state.indexer_lag_blocks,
        "lag_max_blocks": state.indexer_lag_max_blocks,
        "reorg_detected": state.reorg_detected,
        "runtime": runtime,
    });

    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        if let Ok(Some(v)) = db::admin_last_stored_orders_projection_reconcile(pool).await {
            health["last_stored_reconciliation"] = v;
        }
    }

    let mut body = json!({
        "status": "ok",
        "health": health,
    });
    admin_attach_meta_build(&mut body);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.indexer.health.read",
        Some("indexer"),
        None,
        json!({"ok": true}),
    )
    .await;

    Json(body).into_response()
}

#[derive(Debug, Deserialize)]
pub struct AdminReconcileReportsQuery {
    #[serde(default = "default_admin_reconcile_reports_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
    #[serde(default)]
    pub report_type: Option<String>,
    /// 精确匹配 **`reconciliation_reports.chain_id`**（与 **`internal/indexer-reconcile`** 持久化一致）
    #[serde(default)]
    pub chain_id: Option<i64>,
    /// 精确匹配 **`summary.stats.projection_reconcile_clean`**（与持久化 JSON 一致）
    #[serde(default)]
    pub projection_reconcile_clean: Option<bool>,
    /// 最小 **`summary.stats.issues_total`**（**`issues_total`** 缺失或非数字时按 **`-1`** 参与比较，故 **`issues_min` > 0** 时不会命中）
    #[serde(default)]
    pub issues_min: Option<i64>,
}

fn default_admin_reconcile_reports_limit() -> i64 {
    30
}

/// 与 **`GET …/indexer/reconcile-reports`**、**`…/export`** 共用筛选与分页上界。
fn parse_admin_reconcile_reports_query(
    q: &AdminReconcileReportsQuery,
) -> (
    i64,
    i64,
    Option<String>,
    Option<i64>,
    Option<bool>,
    Option<i64>,
) {
    let limit = q.limit.clamp(1, 100);
    let offset = q.offset.max(0);
    let rt_filter = q.report_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 200 {
            None
        } else {
            Some(t.to_string())
        }
    });
    let chain_id_filter = q.chain_id;
    let projection_clean_filter = q.projection_reconcile_clean;
    let issues_min_filter = q
        .issues_min
        .filter(|&n| n > 0)
        .map(|n| n.min(1_000_000_000));
    (
        limit,
        offset,
        rt_filter,
        chain_id_filter,
        projection_clean_filter,
        issues_min_filter,
    )
}

fn reconcile_reports_list_to_csv(items: &[db::ReconciliationReportListItem]) -> String {
    use std::fmt::Write;
    let mut buf = String::from(
        "id,report_type,chain_id,created_at,issues_total,projection_reconcile_clean,orders_with_escrow,projection_rows_chain,matched,missing_projection,status_mismatch,escrow_mismatch,orphan_projections,malformed_projection_order_id_bytes,fee_router_routed_events_rows,region_vault_forwarded_events_rows,fee_router_routed_events_max_block_number,fee_router_routed_events_min_block_number,fee_router_routed_events_latest_inserted_at,region_vault_forwarded_events_max_block_number,region_vault_forwarded_events_min_block_number,region_vault_forwarded_events_latest_inserted_at,event_log_escrow_class_rows,event_log_escrow_created_rows,event_log_distinct_escrow_from_created\n",
    );
    for r in items {
        let chain = r.chain_id.map(|c| c.to_string()).unwrap_or_default();
        let issues = r.issues_total.map(|n| n.to_string()).unwrap_or_default();
        let prc = r
            .projection_reconcile_clean
            .map(|b| b.to_string())
            .unwrap_or_default();
        let _ = writeln!(
            buf,
            "{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}",
            csv_escape_cell(&r.id.to_string()),
            csv_escape_cell(&r.report_type),
            csv_escape_cell(&chain),
            csv_escape_cell(&r.created_at.to_rfc3339()),
            csv_escape_cell(&issues),
            csv_escape_cell(&prc),
            csv_escape_cell(
                &r.orders_with_escrow
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(
                &r.projection_rows_chain
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(&r.matched.map(|n| n.to_string()).unwrap_or_default()),
            csv_escape_cell(
                &r.missing_projection
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(&r.status_mismatch.map(|n| n.to_string()).unwrap_or_default()),
            csv_escape_cell(&r.escrow_mismatch.map(|n| n.to_string()).unwrap_or_default()),
            csv_escape_cell(
                &r.orphan_projections
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(
                &r.malformed_projection_order_id_bytes
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.fee_router_routed_events_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.region_vault_forwarded_events_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.fee_router_routed_events_max_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.fee_router_routed_events_min_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                r.fee_router_routed_events_latest_inserted_at
                    .as_deref()
                    .unwrap_or(""),
            ),
            csv_escape_cell(
                &r.region_vault_forwarded_events_max_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.region_vault_forwarded_events_min_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                r.region_vault_forwarded_events_latest_inserted_at
                    .as_deref()
                    .unwrap_or(""),
            ),
            csv_escape_cell(
                &r.event_log_escrow_class_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.event_log_escrow_created_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.event_log_distinct_escrow_from_created
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
        );
    }
    buf
}

/// 对账报告 **CSV/JSON** 导出响应体完整性：**SHA-256** 头恒有；**Ed25519** 头 **`x-traveltrust-reconcile-export-ed25519`** 仅当配置 **`RECONCILE_EXPORT_ED25519_SEED_HEX`**（公钥见 **`GET /meta.admin_exports`**）。
const RECONCILE_EXPORT_BODY_SHA256_HEADER: &str = "x-traveltrust-reconcile-export-sha256";
/// **`export_scope=all`** 时单次导出**最多**行数（与当前筛选一致；**200** 跨页聚合硬上限）。
const ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS: i64 = 2000;
const RECONCILE_EXPORT_TRUNCATED_HEADER: &str = "x-traveltrust-reconcile-export-truncated";
const RECONCILE_EXPORT_ED25519_HEADER: &str = "x-traveltrust-reconcile-export-ed25519";

fn reconcile_export_ed25519_hex(
    key: Option<&ed25519_dalek::SigningKey>,
    body: &[u8],
) -> Option<String> {
    let k = key?;
    Some(hex::encode(k.sign(body).to_bytes()))
}

fn reconcile_export_response_sha256_hex(body: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    hex::encode(Sha256::digest(body))
}

/// **`GET …/indexer/reconcile-reports/export`**：`format` 缺省 **`csv`**；**`json`** 为**完整**报告（与 **`…/reconcile-report/:id`** 单条 **`report`** 对象同形，含 **`summary`**），外加 **`page`** 与 **`meta.build`**。
#[derive(Debug, Deserialize)]
pub struct AdminReconcileReportsExportQuery {
    #[serde(flatten)]
    pub filters: AdminReconcileReportsQuery,
    #[serde(default = "default_reconcile_reports_export_format")]
    pub format: String,
    /// **`page`**（缺省）：**`limit`/`offset`** 与列表一致；**`all`** / **`filtered_all`**：忽略 **`offset`**，按 **`limit`** 为页宽拉取**全部**匹配行直至耗尽或达 **`ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS`**。
    #[serde(default)]
    pub export_scope: Option<String>,
}

fn default_reconcile_reports_export_format() -> String {
    "csv".to_string()
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum ReconcileExportListMode {
    Page,
    AllFiltered,
}

fn parse_reconcile_export_list_mode(
    scope_raw: Option<&String>,
) -> Result<ReconcileExportListMode, &'static str> {
    match scope_raw.map(|s| s.trim().to_ascii_lowercase()).as_deref() {
        None | Some("") | Some("page") => Ok(ReconcileExportListMode::Page),
        Some("all") | Some("filtered_all") => Ok(ReconcileExportListMode::AllFiltered),
        Some(_) => Err("export_scope must be page or all"),
    }
}

async fn list_reconciliation_reports_for_export(
    pool: &sqlx::PgPool,
    report_type: Option<&str>,
    chain_id: Option<i64>,
    projection_reconcile_clean: Option<bool>,
    issues_min: Option<i64>,
    page_limit: i64,
    page_offset: i64,
    mode: ReconcileExportListMode,
) -> Result<Vec<db::ReconciliationReportListItem>, sqlx::Error> {
    match mode {
        ReconcileExportListMode::Page => {
            db::list_reconciliation_reports(
                pool,
                report_type,
                chain_id,
                projection_reconcile_clean,
                issues_min,
                page_limit,
                page_offset,
            )
            .await
        }
        ReconcileExportListMode::AllFiltered => {
            let mut all = Vec::new();
            let mut off = 0i64;
            loop {
                let room = ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS.saturating_sub(all.len() as i64);
                if room == 0 {
                    break;
                }
                let chunk = page_limit.min(room);
                let batch = db::list_reconciliation_reports(
                    pool,
                    report_type,
                    chain_id,
                    projection_reconcile_clean,
                    issues_min,
                    chunk,
                    off,
                )
                .await?;
                if batch.is_empty() {
                    break;
                }
                let n = batch.len() as i64;
                all.extend(batch);
                if n < chunk {
                    break;
                }
                off += n;
            }
            Ok(all)
        }
    }
}

fn reconcile_report_list_stats_breakdown(
    r: &db::ReconciliationReportListItem,
) -> serde_json::Value {
    json!({
        "orders_with_escrow": r.orders_with_escrow,
        "projection_rows_chain": r.projection_rows_chain,
        "matched": r.matched,
        "missing_projection": r.missing_projection,
        "status_mismatch": r.status_mismatch,
        "escrow_mismatch": r.escrow_mismatch,
        "orphan_projections": r.orphan_projections,
        "malformed_projection_order_id_bytes": r.malformed_projection_order_id_bytes,
    })
}

/// GET /api/v1/admin/indexer/reconcile-reports：`reconciliation_reports` 分页列表（不含大 **`summary`**；**`items`** 含 **`summary.stats`** 的门禁字段、**`stats_breakdown`** 分项计数（无 **`samples`**）；有 **`summary.economic_projection_row_counts`** 任一已存子字段时另含同名 **`economic_projection_row_counts`**（**`fee_router_routed_events`/`region_vault_forwarded_events`** 之 **`rows_total`**、**`max_block_number`**、**`min_block_number`**、**`latest_inserted_at`**，与 **`POST …/internal/indexer-reconcile`** **`persist`** 同路径；旧报告全缺时**省略**该键）；有 **`summary.event_log_escrow_coverage`** 之 **`escrow_class_event_rows`/`escrow_created_rows`/`distinct_escrow_address_from_escrow_created`** 任一已存时另含 **`event_log_escrow_coverage`**（与 **`include_event_log_escrow_coverage` + `persist`** 同路径；全缺时**省略**）；可选 **`projection_reconcile_clean`** / **`issues_min`** 只读筛选；详情见 **`…/reconcile-report/:id`**）。
pub async fn get_admin_indexer_reconcile_reports(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminReconcileReportsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let (limit, offset, rt_filter, chain_id_filter, projection_clean_filter, issues_min_filter) =
        parse_admin_reconcile_reports_query(&q);

    let total = match db::count_reconciliation_reports(
        pool,
        rt_filter.as_deref(),
        chain_id_filter,
        projection_clean_filter,
        issues_min_filter,
    )
    .await
    {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "reconciliation_reports_list_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let items = match db::list_reconciliation_reports(
        pool,
        rt_filter.as_deref(),
        chain_id_filter,
        projection_clean_filter,
        issues_min_filter,
        limit,
        offset,
    )
    .await
    {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "reconciliation_reports_list_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.indexer.reconcile_reports.list",
        Some("reconciliation_reports"),
        None,
        json!({
            "limit": limit,
            "offset": offset,
            "report_type": rt_filter,
            "chain_id": chain_id_filter,
            "projection_reconcile_clean": projection_clean_filter,
            "issues_min": issues_min_filter,
            "returned": items.len(),
            "total": total,
        }),
    )
    .await;

    let rows: Vec<serde_json::Value> = items
        .into_iter()
        .map(|r| {
            let mut row = json!({
                "id": r.id.to_string(),
                "report_type": r.report_type,
                "chain_id": r.chain_id,
                "created_at": r.created_at.to_rfc3339(),
                "issues_total": r.issues_total,
                "projection_reconcile_clean": r.projection_reconcile_clean,
                "stats_breakdown": reconcile_report_list_stats_breakdown(&r),
            });
            if let Some(eco) = db::economic_projection_row_counts_from_list_item(&r) {
                row["economic_projection_row_counts"] = eco;
            }
            if let Some(ev) = db::event_log_escrow_coverage_from_list_item(&r) {
                row["event_log_escrow_coverage"] = ev;
            }
            row
        })
        .collect();

    let mut body = json!({
        "status": "ok",
        "page": {
            "limit": limit,
            "offset": offset,
            "total": total,
            "report_type": rt_filter,
            "chain_id": chain_id_filter,
            "projection_reconcile_clean": projection_clean_filter,
            "issues_min": issues_min_filter,
        },
        "applied_filters": {
            "limit": limit,
            "offset": offset,
            "report_type": rt_filter,
            "chain_id": chain_id_filter,
            "projection_reconcile_clean": projection_clean_filter,
            "issues_min": issues_min_filter,
        },
        "items": rows,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_indexer_reconcile_reports_export(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminReconcileReportsExportQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    use axum::body::Body;
    use axum::http::header::{HeaderValue, CONTENT_DISPOSITION, CONTENT_TYPE};

    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let fmt = q.format.trim().to_ascii_lowercase();
    if fmt != "csv" && fmt != "json" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "bad_request",
                "message": "format must be csv or json",
            })),
        )
            .into_response();
    }

    let list_mode = match parse_reconcile_export_list_mode(q.export_scope.as_ref()) {
        Ok(m) => m,
        Err(msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "bad_request",
                    "message": msg,
                })),
            )
                .into_response();
        }
    };

    let request_id = request_id_from_headers(&headers);

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let (limit, offset, rt_filter, chain_id_filter, projection_clean_filter, issues_min_filter) =
        parse_admin_reconcile_reports_query(&q.filters);

    let total = match db::count_reconciliation_reports(
        pool,
        rt_filter.as_deref(),
        chain_id_filter,
        projection_clean_filter,
        issues_min_filter,
    )
    .await
    {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "reconciliation_reports_export_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let items = match list_reconciliation_reports_for_export(
        pool,
        rt_filter.as_deref(),
        chain_id_filter,
        projection_clean_filter,
        issues_min_filter,
        limit,
        offset,
        list_mode,
    )
    .await
    {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "reconciliation_reports_export_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let truncated = list_mode == ReconcileExportListMode::AllFiltered && total > items.len() as i64;
    let page_offset_echo = match list_mode {
        ReconcileExportListMode::Page => offset,
        ReconcileExportListMode::AllFiltered => 0,
    };
    let export_scope_echo = match list_mode {
        ReconcileExportListMode::Page => "page",
        ReconcileExportListMode::AllFiltered => "all",
    };

    if fmt == "csv" {
        let csv = reconcile_reports_list_to_csv(&items);
        let csv_bytes = csv.into_bytes();
        let body_sha = reconcile_export_response_sha256_hex(&csv_bytes);
        let ed25519_hex =
            reconcile_export_ed25519_hex(state.reconcile_export_ed25519_key.as_deref(), &csv_bytes);
        let mut export_detail = json!({
                "format": "csv",
                "limit": limit,
                "offset": page_offset_echo,
                "export_scope": export_scope_echo,
                "truncated": truncated,
                "max_matching_export_rows": ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS,
                "report_type": rt_filter,
                "chain_id": chain_id_filter,
                "projection_reconcile_clean": projection_clean_filter,
                "issues_min": issues_min_filter,
                "returned": items.len(),
                "total": total,
                "export_body_sha256": body_sha,
        });
        if let Some(ref eh) = ed25519_hex {
            export_detail["export_body_ed25519"] = json!(eh);
        }
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            request_id.as_deref(),
            "admin.indexer.reconcile_reports.export",
            Some("reconciliation_reports"),
            None,
            export_detail,
        )
        .await;
        let filename = format!(
            "reconcile-reports-{}.csv",
            Utc::now().format("%Y%m%dT%H%M%SZ")
        );
        let disp = format!("attachment; filename=\"{filename}\"");
        let Ok(disp_val) = HeaderValue::from_str(&disp) else {
            return (StatusCode::INTERNAL_SERVER_ERROR, "invalid filename").into_response();
        };
        let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
            return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
        };

        let mut rb = Response::builder()
            .status(StatusCode::OK)
            .header(CONTENT_TYPE, "text/csv; charset=utf-8")
            .header(CONTENT_DISPOSITION, disp_val)
            .header(RECONCILE_EXPORT_BODY_SHA256_HEADER, sha_hdr);
        if truncated {
            rb = rb.header(
                RECONCILE_EXPORT_TRUNCATED_HEADER,
                HeaderValue::from_static("1"),
            );
        }
        if let Some(ref eh) = ed25519_hex {
            if let Ok(hv) = HeaderValue::from_str(eh) {
                rb = rb.header(RECONCILE_EXPORT_ED25519_HEADER, hv);
            }
        }
        return match rb.body(Body::from(csv_bytes)) {
            Ok(r) => r.into_response(),
            Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "body build failed").into_response(),
        };
    }

    // format == "json"
    let mut reports: Vec<serde_json::Value> = Vec::with_capacity(items.len());
    for it in &items {
        let row = match db::get_reconciliation_report_by_id(pool, it.id).await {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "reconciliation_reports_export_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        };
        let Some(r) = row else {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "reconciliation_reports_export_failed",
                    "listed report row missing on full fetch",
                )),
            )
                .into_response();
        };
        reports.push(admin_reconciliation_report_payload(r));
    }

    let mut body = json!({
        "status": "ok",
        "exported_at": Utc::now().to_rfc3339(),
        "page": {
            "limit": limit,
            "offset": page_offset_echo,
            "export_scope": export_scope_echo,
            "truncated": truncated,
            "max_matching_export_rows": ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS,
            "total": total,
            "report_type": rt_filter,
            "chain_id": chain_id_filter,
            "projection_reconcile_clean": projection_clean_filter,
            "issues_min": issues_min_filter,
        },
        "reports": reports,
    });
    admin_attach_meta_build(&mut body);

    let bytes = match serde_json::to_vec(&body) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "reconciliation_reports_export_failed",
                )),
            )
                .into_response();
        }
    };
    let body_sha = reconcile_export_response_sha256_hex(&bytes);
    let ed25519_hex =
        reconcile_export_ed25519_hex(state.reconcile_export_ed25519_key.as_deref(), &bytes);
    let mut export_detail = json!({
            "format": "json",
            "limit": limit,
            "offset": page_offset_echo,
            "export_scope": export_scope_echo,
            "truncated": truncated,
            "max_matching_export_rows": ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS,
            "report_type": rt_filter,
            "chain_id": chain_id_filter,
            "projection_reconcile_clean": projection_clean_filter,
            "issues_min": issues_min_filter,
            "returned": items.len(),
            "total": total,
            "export_body_sha256": body_sha,
    });
    if let Some(ref eh) = ed25519_hex {
        export_detail["export_body_ed25519"] = json!(eh);
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.indexer.reconcile_reports.export",
        Some("reconciliation_reports"),
        None,
        export_detail,
    )
    .await;

    let filename = format!(
        "reconcile-reports-{}.json",
        Utc::now().format("%Y%m%dT%H%M%SZ")
    );
    let disp = format!("attachment; filename=\"{filename}\"");
    let Ok(disp_val) = HeaderValue::from_str(&disp) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid filename").into_response();
    };
    let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
    };

    let mut rb = Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, "application/json; charset=utf-8")
        .header(CONTENT_DISPOSITION, disp_val)
        .header(RECONCILE_EXPORT_BODY_SHA256_HEADER, sha_hdr);
    if truncated {
        rb = rb.header(
            RECONCILE_EXPORT_TRUNCATED_HEADER,
            HeaderValue::from_static("1"),
        );
    }
    if let Some(ref eh) = ed25519_hex {
        if let Ok(hv) = HeaderValue::from_str(eh) {
            rb = rb.header(RECONCILE_EXPORT_ED25519_HEADER, hv);
        }
    }
    match rb.body(Body::from(bytes)) {
        Ok(r) => r.into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "body build failed").into_response(),
    }
}

fn admin_reconciliation_report_payload(row: db::ReconciliationReportRow) -> serde_json::Value {
    json!({
        "id": row.id.to_string(),
        "report_type": row.report_type,
        "chain_id": row.chain_id,
        "period_start": row.period_start.map(|t| t.to_rfc3339()),
        "period_end": row.period_end.map(|t| t.to_rfc3339()),
        "summary": row.summary.0,
        "details_path": row.details_path,
        "created_at": row.created_at.to_rfc3339(),
        "state": "stored",
    })
}

pub async fn get_admin_indexer_reconcile_report(
    State(state): State<ApiMetaState>,
    Path(report_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let rid_trim = report_id.trim();
    let pool_opt = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());

    if rid_trim.eq_ignore_ascii_case("latest") {
        let Some(pool) = pool_opt else {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key("admin_db_required")),
            )
                .into_response();
        };
        let row = match db::get_latest_reconciliation_report_by_type(
            pool,
            db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
        )
        .await
        {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "reconciliation_report_read_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        };
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            request_id.as_deref(),
            "admin.indexer.reconcile_report.read",
            Some("reconcile_report"),
            Some("latest"),
            json!({"ok": true, "hit": row.is_some()}),
        )
        .await;
        return match row {
            Some(r) => {
                let mut body = json!({
                    "status": "ok",
                    "report": admin_reconciliation_report_payload(r),
                });
                admin_attach_meta_build(&mut body);
                Json(body).into_response()
            }
            None => {
                let mut body = json!({
                    "status": "ok",
                    "report": serde_json::Value::Null,
                    "note": "no_stored_reconciliation_reports",
                });
                admin_attach_meta_build(&mut body);
                Json(body).into_response()
            }
        };
    }

    if let Ok(uid) = Uuid::parse_str(rid_trim) {
        let Some(pool) = pool_opt else {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key("admin_db_required")),
            )
                .into_response();
        };
        let row = match db::get_reconciliation_report_by_id(pool, uid).await {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "reconciliation_report_read_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        };
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            request_id.as_deref(),
            "admin.indexer.reconcile_report.read",
            Some("reconcile_report"),
            Some(rid_trim),
            json!({"ok": true, "hit": row.is_some()}),
        )
        .await;
        return match row {
            Some(r) => {
                let mut body = json!({
                    "status": "ok",
                    "report": admin_reconciliation_report_payload(r),
                });
                admin_attach_meta_build(&mut body);
                Json(body).into_response()
            }
            None => (
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("reconciliation_report_not_found")),
            )
                .into_response(),
        };
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.indexer.reconcile_report.read",
        Some("reconcile_report"),
        Some(report_id.as_str()),
        json!({"status": "target"}),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "report": {
            "id": report_id,
            "state": "target",
            "summary": {
                "diff_count": null,
                "closed": false
            }
        },
        "note": "minimal contract response for non-UUID report ids; use a stored UUID or path id `latest` (see 04 §3.4)"
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// **04 §3.5 · Alerting v3**：与 **`GET …/observability/overview`** 内 **`observability_alerting_v1.rules_config`** 同源装配（**ENV** 基线 + 进程 **`ApiMetaState`** 快照；**DB** **`observability_threshold_alert_config`** 未迁时 **`database_overlay`** 为 **`null`** 或 **`observation_note`** 占位）。
fn admin_observability_alert_rules_config(state: &ApiMetaState) -> Value {
    let chain_id = std::env::var("CHAIN_ID").unwrap_or_else(|_| "137".to_string());
    let lag_max_env = std::env::var("INDEXER_LAG_MAX_BLOCKS").unwrap_or_default();
    let mut h = DefaultHasher::new();
    chain_id.hash(&mut h);
    state.indexer_lag_max_blocks.hash(&mut h);
    state.indexer_lag_blocks.hash(&mut h);
    lag_max_env.hash(&mut h);
    let fingerprint = format!("{:016x}", h.finish());

    let pool_present = state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
        .is_some();
    let database_overlay = if pool_present {
        json!({
            "observation_note": "observability_threshold_alert_config_row_optional",
            "config_version": Value::Null,
            "updated_at": Value::Null,
        })
    } else {
        Value::Null
    };

    json!({
        "schema_version": 1,
        "anchor": "OBSERVABILITY-THRESHOLD-ALERT-RULES-CONFIG-V1",
        "config_source": "env",
        "config_fingerprint": fingerprint,
        "effective_thresholds": {
            "INDEXER_LAG_MAX_BLOCKS_effective": state.indexer_lag_max_blocks,
            "INDEXER_LAG_BLOCKS_snapshot": state.indexer_lag_blocks,
            "degraded_mode": state.degraded_mode,
            "reorg_detected": state.reorg_detected,
            "indexer_replay_required": state.indexer_replay_required
        },
        "rules_catalog": [
            {
                "rule_id": "indexer_lag_vs_max_blocks",
                "severity": "P1",
                "description": "Indexer lag vs max blocks (process snapshot; see INDEXER_LAG_* env and GET /meta metrics helpers)."
            }
        ],
        "threshold_env_keys": ["CHAIN_ID", "INDEXER_LAG_MAX_BLOCKS", "INDEXER_LAG_BLOCKS"],
        "threshold_db_json_keys": [],
        "database_overlay": database_overlay
    })
}

fn admin_observability_alerting_v1_bundle(state: &ApiMetaState) -> Value {
    let rules_config = admin_observability_alert_rules_config(state);
    let alert_summary = json!({
        "active": 0,
        "sev1": 0,
        "sev2": 0,
    });
    json!({
        "anchor": "OBSERVABILITY-THRESHOLD-ALERTS-V3",
        "schema_version": 3,
        "rules_config": rules_config,
        "alert_summary": alert_summary,
        "last_fired": [],
        "dedup_policy": {
            "mode": "best_effort_memory",
            "anchor": "OBSERVABILITY-THRESHOLD-ALERTS-V3"
        },
        "persist": {
            "storage": "memory_only",
            "note": "DB-backed alert state optional; see 04 §3.5 and migration 20260427000056 when enabled."
        },
        "recent_events": []
    })
}

pub async fn get_admin_observability_overview(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, actor_role) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let observability_alerting_v1 = admin_observability_alerting_v1_bundle(&state);
    let alert_summary = observability_alerting_v1
        .get("alert_summary")
        .cloned()
        .unwrap_or_else(|| json!({ "active": 0, "sev1": 0, "sev2": 0 }));

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.observability.overview.read",
        Some("observability"),
        None,
        json!({"ok": true}),
    )
    .await;

    let chain_id = std::env::var("CHAIN_ID").unwrap_or_else(|_| "137".to_string());
    let expected_chain_id_for_orders_consistency = state
        .chain_config
        .as_ref()
        .map(|c| (c.chain_id.min(i64::MAX as u64)) as i64)
        .or_else(|| chain_id.trim().parse::<i64>().ok());

    let mut indexer_ov = json!({
        "finality_n": state.finality_n,
        "checkpoint": {
            "block_number": state.indexer_checkpoint.block_number,
            "log_index": state.indexer_checkpoint.log_index,
        },
        "last_seen_finality_n": state.indexer_last_seen_finality_n,
        "lag_blocks": state.indexer_lag_blocks,
        "lag_max_blocks": state.indexer_lag_max_blocks,
        "replay_required": state.indexer_replay_required,
        "reorg_detected": state.reorg_detected
    });
    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        if let Ok(Some(v)) = db::admin_last_stored_orders_projection_reconcile(pool).await {
            indexer_ov["last_stored_reconciliation"] = v;
        }
    }

    let overview_build = crate::routes::meta_build_value();
    let (orders_deadline_ssot, orders_deadline_ssot_ops_check) =
        crate::chain_off::orders_deadline_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_view_params_ssot, governor_view_params_ssot_ops_check) =
        crate::chain_off::governor_view_params_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_token_timelock_ssot, governor_token_timelock_ssot_ops_check) =
        crate::chain_off::governor_token_timelock_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (timelock_delay_ssot, timelock_delay_ssot_ops_check) =
        crate::chain_off::timelock_delay_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_proposal_threshold_ssot, governor_proposal_threshold_ssot_ops_check) =
        crate::chain_off::proposal_threshold_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (timelock_governor_admin_ssot, timelock_governor_admin_ssot_ops_check) =
        crate::chain_off::timelock_governor_admin_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_proposal_count_ssot, governor_proposal_count_ssot_ops_check) =
        crate::chain_off::proposal_count_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let governor_proposal_state_chain_vs_projection_observability =
        crate::chain_off::governor_proposal_state_chain_vs_projection_observability_b149(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let governance_proposals_projection_null_fields_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_governance_proposals_projection_null_fields_observability(pool)
                    .await
                {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let orders_chain_health_observability = match (
        state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()),
        expected_chain_id_for_orders_consistency,
    ) {
        (Some(pool), Some(ecid)) => match db::orders_chain_health_observability(pool, ecid).await {
            Ok(v) => v,
            Err(e) => json!({
                "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        (Some(_), None) => json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "observation_note": "expected_chain_id_unavailable",
        }),
        (None, _) => json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "observation_note": "database_pool_unavailable",
        }),
    };
    let indexer_head_vs_db_latest_block_drift_observability = crate::routes::internal::indexer_head_vs_db_latest_block_drift_observability_v1(
        state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()),
        state.chain_config.as_ref().map(|c| c.rpc_url.as_str()),
        expected_chain_id_for_orders_consistency,
    )
    .await;
    let indexer_reconcile_duration_batch_stats_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_indexer_reconcile_duration_batch_stats_observability(pool).await
                {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
                "observation_note": "database_pool_unavailable",
            }),
        };
    let rpc_escrow_sample_meta = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(pool) => match db::admin_last_rpc_escrow_sample_meta(pool).await {
            Ok(Some(v)) => v,
            Ok(None) => json!({
                "anchor": db::RPC_ESCROW_SAMPLE_META_ANCHOR,
                "observation_note": "no_stored_snapshot",
                "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with rpc_escrow_samples>0 and persist:true to populate.",
            }),
            Err(e) => json!({
                "anchor": db::RPC_ESCROW_SAMPLE_META_ANCHOR,
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        None => json!({
            "anchor": db::RPC_ESCROW_SAMPLE_META_ANCHOR,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let correction_executor_rows_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_correction_executor_rows_observability(pool).await {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let orders_chain_health_trend_snapshot = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => match db::admin_last_orders_chain_health_trend_snapshot(pool).await {
            Ok(Some(v)) => v,
            Ok(None) => json!({
                "anchor": "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1",
                "observation_note": "no_stored_snapshot",
                "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to advance by_batch/by_day.",
            }),
            Err(e) => json!({
                "anchor": "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1",
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        None => json!({
            "anchor": "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1",
            "observation_note": "database_pool_unavailable",
        }),
    };
    let orders_amount_chain_vs_escrow_drift_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_orders_amount_chain_vs_escrow_drift_observability(pool).await {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let escrow_status_chain_vs_orders_drift_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_escrow_status_chain_vs_orders_drift_observability(pool).await {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let fee_router_fee_routes_vs_routed_events_drift_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_fee_router_fee_routes_vs_routed_events_drift_observability(pool)
                    .await
                {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let vault_forwards_vs_forwarded_events_drift_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_vault_forwards_vs_forwarded_events_drift_observability(pool).await
                {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let stake_lock_projection_block_lag_observability =
        match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
            Some(pool) => {
                match db::admin_last_stake_lock_projection_block_lag_observability(pool).await {
                    Ok(Some(v)) => v,
                    Ok(None) => json!({
                        "anchor": db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "no_stored_snapshot",
                        "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                    }),
                    Err(e) => json!({
                        "anchor": db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
                        "schema_version": 1,
                        "observation_note": "query_failed",
                        "error": e.to_string(),
                    }),
                }
            }
            None => json!({
                "anchor": db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
                "schema_version": 1,
                "observation_note": "database_pool_unavailable",
            }),
        };
    let mut body = json!({
        "status": "ok",
        "overview": {
            "chain_id": chain_id,
            "build": overview_build,
            "indexer": indexer_ov,
            "rate_limits": middleware::meta_rate_limits_snapshot(),
            "alerts": alert_summary,
            "observability_alerting_v1": observability_alerting_v1,
            "audit": {
                "mode": "best_effort_read_path"
            },
            "orders_deadline_ssot": orders_deadline_ssot,
            "orders_deadline_ssot_ops_check": orders_deadline_ssot_ops_check,
            "governor_view_params_ssot": governor_view_params_ssot,
            "governor_view_params_ssot_ops_check": governor_view_params_ssot_ops_check,
            "governor_token_timelock_ssot": governor_token_timelock_ssot,
            "governor_token_timelock_ssot_ops_check": governor_token_timelock_ssot_ops_check,
            "timelock_delay_ssot": timelock_delay_ssot,
            "timelock_delay_ssot_ops_check": timelock_delay_ssot_ops_check,
            "governor_proposal_threshold_ssot": governor_proposal_threshold_ssot,
            "governor_proposal_threshold_ssot_ops_check": governor_proposal_threshold_ssot_ops_check,
            "timelock_governor_admin_ssot": timelock_governor_admin_ssot,
            "timelock_governor_admin_ssot_ops_check": timelock_governor_admin_ssot_ops_check,
            "governor_proposal_count_ssot": governor_proposal_count_ssot,
            "governor_proposal_count_ssot_ops_check": governor_proposal_count_ssot_ops_check,
            "governor_proposal_state_chain_vs_projection_observability": governor_proposal_state_chain_vs_projection_observability,
            "governance_proposals_projection_null_fields_observability": governance_proposals_projection_null_fields_observability,
            "orders_chain_health_observability": orders_chain_health_observability,
            "indexer_head_vs_db_latest_block_drift_observability": indexer_head_vs_db_latest_block_drift_observability,
            "indexer_reconcile_duration_batch_stats_observability": indexer_reconcile_duration_batch_stats_observability,
            "rpc_escrow_sample_meta": rpc_escrow_sample_meta,
            "correction_executor_rows_observability": correction_executor_rows_observability,
            "orders_chain_health_trend_snapshot": orders_chain_health_trend_snapshot,
            "orders_amount_chain_vs_escrow_drift_observability": orders_amount_chain_vs_escrow_drift_observability,
            "escrow_status_chain_vs_orders_drift_observability": escrow_status_chain_vs_orders_drift_observability,
            "fee_router_fee_routes_vs_routed_events_drift_observability": fee_router_fee_routes_vs_routed_events_drift_observability,
            "vault_forwards_vs_forwarded_events_drift_observability": vault_forwards_vs_forwarded_events_drift_observability,
            "stake_lock_projection_block_lag_observability": stake_lock_projection_block_lag_observability
        },
        "actor": {
            "id": actor_id,
            "role": actor_role
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_observability_alert_rules(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.observability.alert_rules.read",
        Some("observability"),
        None,
        json!({"ok": true}),
    )
    .await;

    let rules_view = admin_observability_alert_rules_config(&state);
    let mut body = json!({
        "status": "ok",
        "rules_view": rules_view
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_alert_incident_by_id(
    State(state): State<ApiMetaState>,
    Path(incident_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.alert.incident.read",
        Some("incident"),
        Some(incident_id.as_str()),
        json!({"ok": true}),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "incident": {
            "id": incident_id,
            "state": "opened",
            "severity": "P2",
            "owner_group": "ops",
            "timeline": []
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// Lexicographic catalog of `action` strings passed to [`write_admin_audit_log_best_effort`] in this module.
/// When adding audited admin routes, append here (keep sorted).
const ADMIN_AUDIT_ACTION_CODES: &[&str] = &[
    "admin.alert.incident.read",
    "admin.api_versions.read",
    "admin.approvals.detail.read",
    "admin.approvals.read",
    "admin.audit.operations.read",
    "admin.audit_logs.detail.read",
    "admin.audit_logs.read",
    "admin.community.abuse_policy.patch",
    "admin.community.appeals.read",
    "admin.community.appeals.review",
    "admin.community.comments.visibility",
    "admin.community.moderation.update",
    "admin.community.moderation_cases.read",
    "admin.community.penalties.create",
    "admin.community.penalties.read",
    "admin.community.policy_change_logs.read",
    "admin.community.ranking_snapshots.read",
    "admin.community.reports.read",
    "admin.community.risk_signals.read",
    "admin.compliance.data_request_events.read",
    "admin.compliance.data_requests.read",
    "admin.compliance.data_requests.update",
    "admin.config.release.read",
    "admin.config.releases.read",
    "admin.disputes.detail.read",
    "admin.disputes.read",
    "admin.fee_router_routed.read",
    "admin.finance.summary.export",
    "admin.finance.summary.read",
    "admin.flags.publish",
    "admin.flags.read",
    "admin.guides.detail.read",
    "admin.guides.read",
    "admin.indexer.health.read",
    "admin.indexer.reconcile_report.read",
    "admin.indexer.reconcile_reports.export",
    "admin.indexer.reconcile_reports.list",
    "admin.internal_tools.audits.read",
    "admin.jobs.read",
    "admin.lifecycle.state_machines.read",
    "admin.media.access_logs.read",
    "admin.media.signed_url_tokens.read",
    "admin.observability.alert_rules.read",
    "admin.observability.overview.read",
    "admin.orders.detail.read",
    "admin.orders.read",
    "admin.policies.publish",
    "admin.policies.read",
    "admin.region_vault_forwarded.read",
    "admin.reviews.detail.read",
    "admin.reviews.read",
    "admin.scheduler.jobs.read",
    "admin.scheduler.jobs.rerun",
    "admin.schema.migrations.read",
    "admin.secrets.metadata.read",
    "admin.tenants.scopes.publish",
    "admin.tenants.scopes.read",
    "admin.user.role.change",
    "admin.users.detail.read",
    "admin.users.read",
];

pub async fn get_admin_audit_operations(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminAuditOperationsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(50).clamp(1, 200);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.audit.operations.read",
        Some("audit_operations"),
        None,
        json!({ "ok": true, "limit": limit }),
    )
    .await;

    let catalog_total = ADMIN_AUDIT_ACTION_CODES.len();
    let take = (limit as usize).min(catalog_total);
    let operations: Vec<Value> = ADMIN_AUDIT_ACTION_CODES[..take]
        .iter()
        .map(|code| {
            let mutating = !code.ends_with(".read");
            json!({ "code": code, "mutating": mutating })
        })
        .collect();

    let mut body = json!({
        "status": "ok",
        "operations": operations,
        "catalog_total": catalog_total,
        "returned": take,
        "note": "static action catalog aligned with write_admin_audit_log_best_effort in routes/admin/mod.rs; not a DB-backed event stream; export pipeline pending stage 120/200",
        "applied_filters": {
            "limit": limit,
            "source": "action_catalog_v1"
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_audit_logs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminAuditQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        let mut body = json!({
            "status": "ok",
            "items": [],
            "note": "admin_audit_log_no_db",
            "meta": {
                "note": "admin_audit_log_no_db",
            }
        });
        admin_attach_meta_build(&mut body);
        return Json(body).into_response();
    };

    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let actor_filter = match query
        .actor_id
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(v) => Some(v),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_actor_id")),
                )
                    .into_response()
            }
        },
        None => None,
    };
    let action_filter = query
        .action
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());
    let resource_type_filter = query
        .resource_type
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());

    let rows = match db::list_admin_audit_logs(
        pool,
        actor_filter,
        action_filter,
        resource_type_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_audit_query_failed")),
            )
                .into_response()
        }
    };

    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "action": r.action,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "actor_id": r.actor_id,
                "request_id": r.request_id,
                "payload": r.payload,
                "created_at": r.created_at,
            })
        })
        .collect();

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.audit_logs.read",
        Some("admin_audit_logs"),
        None,
        json!({
            "filters": {
                "actor_id": query.actor_id,
                "action": query.action,
                "resource_type": query.resource_type,
                "limit": limit,
            },
            "result_count": items.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "actor_id": actor_filter,
            "action": action_filter,
            "resource_type": resource_type_filter,
            "limit": limit
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// 单条管理审计日志；与列表项同形；**须 PostgreSQL**（无 DB 时 **503** `admin_db_required`）。
pub async fn get_admin_audit_log_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let log_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_audit_log_id", "message": "invalid_audit_log_id"})),
            )
                .into_response()
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let row = match db::fetch_admin_audit_log_by_id(pool, log_uuid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_audit_query_failed")),
            )
                .into_response()
        }
    };

    let Some(r) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "audit_log_not_found", "message": "audit_log_not_found"})),
        )
            .into_response();
    };

    let mut body = json!({
        "status": "ok",
        "audit_log": {
            "id": r.id,
            "action": r.action,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "actor_id": r.actor_id,
            "request_id": r.request_id,
            "payload": r.payload,
            "created_at": r.created_at,
        }
    });
    admin_attach_meta_build(&mut body);

    let resource_id = log_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.audit_logs.detail.read",
        Some("admin_audit_logs"),
        Some(resource_id.as_str()),
        json!({ "audit_log_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn post_admin_user_role_change_request(
    State(state): State<ApiMetaState>,
    Path(target_user_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminRoleChangeRequestBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let target_uid = match Uuid::parse_str(target_user_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response()
        }
    };

    let next_role = body.target_role.trim();
    if !is_supported_target_role(next_role) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("unsupported_target_role")),
        )
            .into_response();
    }

    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/admin/users/:id/role-change-request").into_response();
    };
    let store = co.store.read().await;
    let Some(user) = store.users.get(&target_uid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("target_user_not_found")),
        )
            .into_response();
    };
    let before_role = user.role.clone();
    if before_role == next_role {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("role_unchanged")),
        )
            .into_response();
    }

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let approval_id = match db::create_admin_user_role_change_request_with_audit(
        pool,
        actor_id,
        target_uid,
        &before_role,
        next_role,
        body.reason.as_deref(),
        request_id.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_role_change_request_failed")),
            )
                .into_response()
        }
    };

    let mut body = json!({
        "status": "ok",
        "approval_request_id": approval_id,
        "approval_status": "pending",
        "target_user_id": target_uid,
        "from_role": before_role,
        "to_role": next_role,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

fn admin_approval_request_row_json(r: &db::AdminApprovalRequestRow) -> serde_json::Value {
    json!({
        "id": r.id,
        "action": r.action,
        "resource_type": r.resource_type,
        "resource_id": r.resource_id,
        "requested_by": r.requested_by,
        "approved_by": r.approved_by,
        "status": r.status,
        "reason": r.reason,
        "approve_reason": r.approve_reason,
        "before_payload": r.before_payload,
        "after_payload": r.after_payload,
        "created_at": r.created_at,
        "approved_at": r.approved_at,
    })
}

pub async fn get_admin_approvals(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminApprovalQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            let mut body = json!({
                "status": "ok",
                "items": [],
                "note": "admin_approvals_no_db",
                "meta": {
                    "note": "admin_approvals_no_db",
                }
            });
            admin_attach_meta_build(&mut body);
            return Json(body).into_response();
        }
    };

    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_filter = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());

    let rows = match db::list_admin_approval_requests(pool, status_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_query_failed")),
            )
                .into_response()
        }
    };

    let items: Vec<_> = rows
        .into_iter()
        .map(|r| admin_approval_request_row_json(&r))
        .collect();

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.approvals.read",
        Some("admin_approval_requests"),
        None,
        json!({
            "filters": {
                "status": status_filter,
                "limit": limit,
            },
            "result_count": items.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "status": status_filter,
            "limit": limit,
        },
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// 单条审批单只读；与列表项同形；**须 PostgreSQL**（无 DB 时 **503** `admin_db_required`）。
pub async fn get_admin_approval_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let approval_uuid = match Uuid::parse_str(id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_approval_id")),
            )
                .into_response()
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let row = match db::get_admin_approval_request_by_id(pool, approval_uuid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_query_failed")),
            )
                .into_response()
        }
    };

    let Some(r) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("approval_request_not_found")),
        )
            .into_response();
    };

    let mut body = json!({
        "status": "ok",
        "approval_request": admin_approval_request_row_json(&r),
    });
    admin_attach_meta_build(&mut body);

    let resource_id = approval_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.approvals.detail.read",
        Some("admin_approval_requests"),
        Some(resource_id.as_str()),
        json!({ "approval_request_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn post_admin_approval_approve(
    State(state): State<ApiMetaState>,
    Path(approval_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminApprovalActionBody>,
) -> impl IntoResponse {
    let approver_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let approval_uuid = match Uuid::parse_str(approval_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_approval_id")),
            )
                .into_response()
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let existing = match db::get_admin_approval_request_by_id(pool, approval_uuid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_query_failed")),
            )
                .into_response()
        }
    };
    let Some(existing) = existing else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("approval_request_not_found")),
        )
            .into_response();
    };
    if existing.status != "pending" {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("approval_request_not_pending")),
        )
            .into_response();
    }
    if existing.requested_by == approver_id {
        return (
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("self_approval_not_allowed")),
        )
            .into_response();
    }
    if existing.action != "admin.user.role.change" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("unsupported_approval_action")),
        )
            .into_response();
    }

    let result = match db::approve_admin_user_role_change_request_with_audit(
        pool,
        approval_uuid,
        approver_id,
        body.reason.as_deref(),
        request_id.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_apply_failed")),
            )
                .into_response()
        }
    };

    let Some(result) = result else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("approval_request_apply_conflict")),
        )
            .into_response();
    };

    if let Some(ref co) = state.chain_off {
        let mut store = co.store.write().await;
        if let Some(target_user) = store.users.get_mut(&result.target_user_id) {
            target_user.role = result.to_role.clone();
            target_user.updated_at = Utc::now();
        }
    }

    let mut body = json!({
        "status": "ok",
        "approval_request_id": result.approval_id,
        "target_user_id": result.target_user_id,
        "from_role": result.from_role,
        "to_role": result.to_role,
        "approved_by": approver_id,
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_flags(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminFlagsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(200).clamp(1, 200);
    let code_sub = query.flag_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let flag_code_pattern: Option<String> =
        code_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let enabled_filter = match parse_feature_flag_enabled_filter(&query.enabled) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_feature_flag_enabled_filter",
                    "enabled must be true|false|1|0|yes|no or omitted",
                )),
            )
                .into_response();
        }
    };
    let scope_filter: Option<&str> = match query.scope.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match parse_admin_scope_token(s) {
                    Some(tok) => Some(tok),
                    None => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key_detail(
                                "invalid_feature_flag_scope_filter",
                                "scope must be 1–64 chars [a-zA-Z0-9._-] or omitted",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_feature_flags(
        pool,
        flag_code_pattern.as_deref(),
        enabled_filter,
        scope_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("feature_flags_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.flags.read",
        Some("feature_flags"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "flag_code": code_sub,
            "enabled": enabled_filter,
            "scope": scope_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "flag_code": r.flag_code,
                "description": r.description,
                "scope": r.scope,
                "enabled": r.enabled,
                "rollout_percent": r.rollout_percent,
                "region": r.region,
                "version": r.version,
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "flag_code": code_sub,
            "enabled": enabled_filter,
            "scope": scope_filter,
        },
        "meta": {
            "source": "db",
            "note": "220/240 baseline; consumers may still read env until wired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_secrets_metadata(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminSecretsMetadataQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(200).clamp(1, 200);
    let key_sub = query.key_alias.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let key_alias_pattern: Option<String> =
        key_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let st_filter: Option<&str> = match query.status.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_secret_metadata_status(t) {
                Some(t)
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_secret_metadata_status",
                        "status must be active, deprecated, revoked, pending, suspended, or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };
    let env_filter: Option<&str> = match query.env_scope.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match parse_admin_scope_token(s) {
                    Some(tok) => Some(tok),
                    None => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key_detail(
                                "invalid_secret_metadata_env_scope",
                                "env_scope must be 1–64 chars [a-zA-Z0-9._-] or omitted",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_secret_key_metadata(
        pool,
        key_alias_pattern.as_deref(),
        st_filter,
        env_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("secret_metadata_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.secrets.metadata.read",
        Some("secret_key_metadata"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "key_alias_substring": key_sub,
            "status": st_filter,
            "env_scope": env_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "key_alias": r.key_alias,
                "env_scope": r.env_scope,
                "last_rotated_at": r.last_rotated_at.map(|t| t.to_rfc3339()),
                "next_rotation_due": r.next_rotation_due.map(|t| t.to_rfc3339()),
                "status": r.status,
                "notes": r.notes,
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "key_alias": key_sub,
            "status": st_filter,
            "env_scope": env_filter,
        },
        "meta": {
            "source": "db",
            "policy": "no_secret_values",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn post_admin_flag_publish(
    State(state): State<ApiMetaState>,
    Path(flag_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminFlagPublishBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(flag_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_flag_id")),
            )
                .into_response()
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let cur = match db::get_feature_flag_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("feature_flag_query_failed")),
            )
                .into_response()
        }
    };
    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("feature_flag_not_found")),
        )
            .into_response();
    };
    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "feature_flag_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    }
    let rollout = match body.rollout_percent {
        Some(p) if (0..=100).contains(&p) => p,
        Some(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_rollout_percent")),
            )
                .into_response()
        }
        None => cur.rollout_percent,
    };
    let region = match body.region {
        None => cur.region.clone(),
        Some(inner) => inner,
    };

    let updated = match db::publish_feature_flag(
        pool,
        id,
        body.expected_version,
        body.enabled,
        rollout,
        region.clone(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("feature_flag_publish_failed")),
            )
                .into_response()
        }
    };
    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("feature_flag_publish_race")),
        )
            .into_response();
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.flags.publish",
        Some("feature_flags"),
        Some(&id.to_string()),
        json!({
            "flag_code": updated.flag_code,
            "enabled": updated.enabled,
            "rollout_percent": updated.rollout_percent,
            "region": updated.region,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "flag_code": updated.flag_code,
            "description": updated.description,
            "scope": updated.scope,
            "enabled": updated.enabled,
            "rollout_percent": updated.rollout_percent,
            "region": updated.region,
            "version": updated.version,
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

fn is_allowed_async_job_status(s: &str) -> bool {
    matches!(
        s,
        "pending" | "running" | "completed" | "failed" | "dead_letter" | "cancelled"
    )
}

fn is_plausible_job_code(s: &str) -> bool {
    let s = s.trim();
    if s.is_empty() || s.len() > 160 {
        return false;
    }
    s.chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
}

fn is_allowed_policy_publish_status(s: &str) -> bool {
    matches!(s, "draft" | "active" | "deprecated")
}

fn is_allowed_tenant_scope_publish_status(s: &str) -> bool {
    matches!(s, "draft" | "active" | "sunset")
}

fn is_allowed_tenant_scope_class(s: &str) -> bool {
    matches!(s, "data_residency" | "ops" | "feature" | "network")
}

fn is_allowed_community_report_status(s: &str) -> bool {
    matches!(s, "open" | "in_review" | "resolved" | "dismissed")
}

fn is_allowed_community_penalty_status_filter(s: &str) -> bool {
    matches!(s, "active" | "lifted" | "superseded")
}

fn is_allowed_community_appeal_decision(s: &str) -> bool {
    matches!(s, "accepted" | "rejected")
}

fn is_allowed_community_appeal_status_filter(s: &str) -> bool {
    matches!(s, "pending" | "accepted" | "rejected")
}

fn is_allowed_compliance_request_status(s: &str) -> bool {
    matches!(
        s,
        "open" | "in_progress" | "completed" | "rejected" | "cancelled"
    )
}

fn is_allowed_compliance_request_type(s: &str) -> bool {
    matches!(s, "export" | "erasure")
}

fn is_allowed_secret_metadata_status(s: &str) -> bool {
    matches!(
        s,
        "active" | "deprecated" | "revoked" | "pending" | "suspended"
    )
}

/// 与 Secret **`env_scope`**、Feature Flag **`scope`** 筛选共用（精确匹配 token）。
fn parse_admin_scope_token(s: &str) -> Option<&str> {
    let t = s.trim();
    if t.is_empty() {
        return None;
    }
    if t.len() > 64 {
        return None;
    }
    if !t
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
    {
        return None;
    }
    Some(t)
}

fn parse_feature_flag_enabled_filter(raw: &Option<String>) -> Result<Option<bool>, ()> {
    match raw {
        None => Ok(None),
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                Ok(None)
            } else {
                match t.to_ascii_lowercase().as_str() {
                    "true" | "1" | "yes" => Ok(Some(true)),
                    "false" | "0" | "no" => Ok(Some(false)),
                    _ => Err(()),
                }
            }
        }
    }
}

fn is_allowed_api_version_status(s: &str) -> bool {
    matches!(s, "planned" | "active" | "deprecated" | "sunset")
}

pub async fn get_admin_config_releases(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminConfigReleasesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let rk_filter = query.release_key.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let st_filter: Option<&str> = match query.status.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if matches!(t, "draft" | "published" | "rolled_back") {
                Some(t)
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_config_release_status",
                        "status must be draft, published, rolled_back, or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_config_releases(pool, rk_filter, st_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("config_releases_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.config.releases.read",
        Some("config_releases"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "release_key": rk_filter,
            "status": st_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "release_key": r.release_key,
                "version_label": r.version_label,
                "status": r.status,
                "effective_from": r.effective_from.map(|t| t.to_rfc3339()),
                "rolled_back_at": r.rolled_back_at.map(|t| t.to_rfc3339()),
                "notes": r.notes,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "release_key": rk_filter,
            "status": st_filter,
        },
        "meta": {
            "source": "db",
            "note": "220 baseline ledger; not all runtime config yet",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/config/releases/:id：单条 **`config_releases`** 只读（220、04 §3.5）
pub async fn get_admin_config_release_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let id_trim = id.trim();
    let rid = match Uuid::parse_str(id_trim) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_config_release_id")),
            )
                .into_response();
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let row = match db::get_config_release_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("config_release_query_failed")),
            )
                .into_response();
        }
    };
    let Some(r) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("config_release_not_found")),
        )
            .into_response();
    };
    let resource_id = r.id.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.config.release.read",
        Some("config_releases"),
        Some(resource_id.as_str()),
        json!({ "release_key": r.release_key, "version_label": r.version_label }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "release": {
            "id": r.id.to_string(),
            "release_key": r.release_key,
            "version_label": r.version_label,
            "status": r.status,
            "effective_from": r.effective_from.map(|t| t.to_rfc3339()),
            "rolled_back_at": r.rolled_back_at.map(|t| t.to_rfc3339()),
            "notes": r.notes,
            "created_at": r.created_at.to_rfc3339(),
            "updated_at": r.updated_at.to_rfc3339(),
        },
        "meta": {
            "source": "db",
            "note": "220 baseline ledger row",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/api-versions（340、04 §3.5）
pub async fn get_admin_api_versions(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminApiVersionsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let ver_sub = query.api_version.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let api_version_pattern: Option<String> =
        ver_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                let tl = t.to_ascii_lowercase();
                if is_allowed_api_version_status(tl.as_str()) {
                    Some(tl)
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_admin_api_version_status_filter",
                            "status must be planned|active|deprecated|sunset or omitted",
                        )),
                    )
                        .into_response();
                }
            }
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_api_versions(
        pool,
        api_version_pattern.as_deref(),
        status_filter.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("api_versions_query_failed")),
            )
                .into_response()
        }
    };
    let generated_at = Utc::now();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.api_versions.read",
        Some("api_versions"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "api_version": ver_sub,
            "status": status_filter.as_deref(),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "api_version": r.api_version,
                "status": r.status,
                "released_at": r.released_at.map(|t| t.to_rfc3339()),
                "deprecated_at": r.deprecated_at.map(|t| t.to_rfc3339()),
                "sunset_at": r.sunset_at.map(|t| t.to_rfc3339()),
                "compat_window_days": r.compat_window_days,
                "active_client_ratio_7d": r.active_client_ratio_7d,
                "request_count_7d": r.request_count_7d,
                "last_change_at": r.last_change_at.to_rfc3339(),
                "last_change_by": r.last_change_by,
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "api_version": ver_sub,
            "status": status_filter.as_deref(),
        },
        "meta": {
            "generated_at": generated_at.to_rfc3339(),
            "source": "db",
            "note": "340 baseline; usage ratios are ledger placeholders until telemetry wired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/lifecycle/state-machines（350、04 §3.5）
pub async fn get_admin_lifecycle_state_machines(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminLifecycleStateMachinesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let mcode_sub = query.machine_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let machine_code_pattern: Option<String> =
        mcode_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let domain_sub = query.domain.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let domain_pattern: Option<String> =
        domain_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let entity_sub = query.entity_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let entity_type_pattern: Option<String> =
        entity_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let version_sub = query.version.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 32 {
            None
        } else {
            Some(t)
        }
    });
    let version_pattern: Option<String> =
        version_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let sot_sub = query.source_of_truth.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let source_of_truth_pattern: Option<String> =
        sot_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let anomaly_filter = match parse_feature_flag_enabled_filter(&query.anomaly_flag) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_lifecycle_anomaly_flag_filter",
                    "anomaly_flag must be true|false|1|0|yes|no or omitted",
                )),
            )
                .into_response();
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_lifecycle_state_machines(
        pool,
        machine_code_pattern.as_deref(),
        domain_pattern.as_deref(),
        entity_type_pattern.as_deref(),
        version_pattern.as_deref(),
        source_of_truth_pattern.as_deref(),
        anomaly_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "lifecycle_state_machines_query_failed",
                )),
            )
                .into_response()
        }
    };
    let generated_at = Utc::now();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.lifecycle.state_machines.read",
        Some("lifecycle_state_machines"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "machine_code": mcode_sub,
            "domain": domain_sub,
            "entity_type": entity_sub,
            "version": version_sub,
            "source_of_truth": sot_sub,
            "anomaly_flag": anomaly_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "machine_code": r.machine_code,
                "domain": r.domain,
                "version": r.version,
                "entity_type": r.entity_type,
                "current_state": r.current_state,
                "expected_state": r.expected_state,
                "anomaly_flag": r.anomaly_flag,
                "anomaly_type": r.anomaly_type,
                "last_transition_at": r.last_transition_at.map(|t| t.to_rfc3339()),
                "source_of_truth": r.source_of_truth,
                "repairable": r.repairable,
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "machine_code": mcode_sub,
            "domain": domain_sub,
            "entity_type": entity_sub,
            "version": version_sub,
            "source_of_truth": sot_sub,
            "anomaly_flag": anomaly_filter,
        },
        "meta": {
            "generated_at": generated_at.to_rfc3339(),
            "source": "db",
            "checkpoint": {
                "block_number": state.indexer_checkpoint.block_number,
                "log_index": state.indexer_checkpoint.log_index
            },
            "note": "350 baseline ledger; states are placeholders until validator projection wired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/policies（04 §3.5、70）
pub async fn get_admin_policies(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminPoliciesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let code_sub = query.policy_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let policy_code_pattern: Option<String> =
        code_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_policy_publish_status(t) {
                Some(t.to_string())
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_admin_policy_status_filter",
                        "status must be draft|active|deprecated or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };

    let stype_sub = query.scope_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let scope_type_pattern: Option<String> =
        stype_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let role_sub = query.binding_role.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let binding_role_pattern: Option<String> =
        role_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_admin_data_policies(
        pool,
        policy_code_pattern.as_deref(),
        status_filter.as_deref(),
        scope_type_pattern.as_deref(),
        binding_role_pattern.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_policies_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.policies.read",
        Some("admin_data_policies"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "policy_code": code_sub,
            "status": status_filter.as_deref(),
            "scope_type": stype_sub,
            "binding_role": role_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "policy": {
                    "code": r.policy_code,
                    "version": r.version,
                    "status": r.status,
                },
                "scope": {
                    "type": r.scope_type,
                    "expr": r.scope_expr,
                },
                "binding": {
                    "role": r.binding_role,
                    "resources": r.binding_resources,
                },
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "policy_code": code_sub,
            "status": status_filter.as_deref(),
            "scope_type": stype_sub,
            "binding_role": role_sub,
        },
        "meta": {
            "source": "db",
            "note": "policy/scope/binding ledger; enforcement wiring remains product/70",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/policies/:id/publish（04 §3.5、70）
pub async fn post_admin_policy_publish(
    State(state): State<ApiMetaState>,
    Path(policy_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminPolicyPublishBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(policy_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_policy_id")),
            )
                .into_response()
        }
    };
    let status_trim = body.status.trim();
    if !is_allowed_policy_publish_status(status_trim) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_policy_status")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_admin_data_policy_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_policy_query_failed")),
            )
                .into_response()
        }
    };
    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("admin_policy_not_found")),
        )
            .into_response();
    };
    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "admin_policy_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    }
    let updated =
        match db::publish_admin_data_policy(pool, id, body.expected_version, status_trim).await {
            Ok(v) => v,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("admin_policy_publish_failed")),
                )
                    .into_response()
            }
        };
    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("admin_policy_publish_race")),
        )
            .into_response();
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.policies.publish",
        Some("admin_data_policies"),
        Some(&id.to_string()),
        json!({
            "policy_code": updated.policy_code,
            "status_before": cur.status,
            "status_after": updated.status,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "policy": {
                "code": updated.policy_code,
                "version": updated.version,
                "status": updated.status,
            },
            "scope": {
                "type": updated.scope_type,
                "expr": updated.scope_expr,
            },
            "binding": {
                "role": updated.binding_role,
                "resources": updated.binding_resources,
            },
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/tenants/scopes（04 §3.5、70）
pub async fn get_admin_tenant_scopes(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminTenantScopesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let tk_sub = query.tenant_key.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let tenant_key_pattern: Option<String> =
        tk_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let rg_sub = query.region_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let region_pattern: Option<String> =
        rg_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_tenant_scope_publish_status(t) {
                Some(t.to_string())
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_tenant_scope_status_filter",
                        "status must be draft|active|sunset or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };

    let scope_class_filter: Option<String> = match query.scope_class.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_tenant_scope_class(t) {
                Some(t.to_string())
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_tenant_scope_class_filter",
                        "scope_class must be data_residency|ops|feature|network or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_admin_tenant_scopes(
        pool,
        tenant_key_pattern.as_deref(),
        region_pattern.as_deref(),
        status_filter.as_deref(),
        scope_class_filter.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_tenant_scopes_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.tenants.scopes.read",
        Some("admin_tenant_scopes"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "tenant_key": tk_sub,
            "region_code": rg_sub,
            "status": status_filter.as_deref(),
            "scope_class": scope_class_filter.as_deref(),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "tenant_key": r.tenant_key,
                "region_code": r.region_code,
                "scope_class": r.scope_class,
                "status": r.status,
                "notes": r.notes,
                "version": r.version,
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "tenant_key": tk_sub,
            "region_code": rg_sub,
            "status": status_filter.as_deref(),
            "scope_class": scope_class_filter.as_deref(),
        },
        "meta": {
            "source": "db",
            "note": "tenant/region scope ledger; multi-tenant routing still phased",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/tenants/scopes/:id/publish（04 §3.5、70、320）
pub async fn post_admin_tenant_scope_publish(
    State(state): State<ApiMetaState>,
    Path(scope_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminTenantScopePublishBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(scope_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_tenant_scope_id")),
            )
                .into_response()
        }
    };
    let status_trim = body.status.trim();
    if !is_allowed_tenant_scope_publish_status(status_trim) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_tenant_scope_status")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_admin_tenant_scope_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_tenant_scope_query_failed")),
            )
                .into_response()
        }
    };
    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("admin_tenant_scope_not_found")),
        )
            .into_response();
    };
    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "admin_tenant_scope_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    }
    let updated =
        match db::publish_admin_tenant_scope(pool, id, body.expected_version, status_trim).await {
            Ok(v) => v,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_tenant_scope_publish_failed",
                    )),
                )
                    .into_response()
            }
        };
    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("admin_tenant_scope_publish_race")),
        )
            .into_response();
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.tenants.scopes.publish",
        Some("admin_tenant_scopes"),
        Some(&id.to_string()),
        json!({
            "tenant_key": updated.tenant_key,
            "region_code": updated.region_code,
            "scope_class": updated.scope_class,
            "status_before": cur.status,
            "status_after": updated.status,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "tenant_key": updated.tenant_key,
            "region_code": updated.region_code,
            "scope_class": updated.scope_class,
            "status": updated.status,
            "notes": updated.notes,
            "version": updated.version,
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/reports（160、04 §3.4、70）
pub async fn get_admin_community_reports(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityReportsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    if let Some(ref st) = query.status {
        let t = st.trim();
        if !t.is_empty() && !is_allowed_community_report_status(t) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_community_report_status_filter",
                )),
            )
                .into_response();
        }
    }
    let reporter_uuid: Option<Uuid> = match query.reporter_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_community_reports_reporter_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let target_uuid: Option<Uuid> = match query.target_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_community_reports_target_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_f = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let tt_sub = query.target_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let target_type_pattern: Option<String> =
        tt_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let rc_sub = query.reason_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let reason_code_pattern: Option<String> =
        rc_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_community_reports_admin(
        pool,
        limit,
        status_f,
        reporter_uuid,
        target_type_pattern.as_deref(),
        reason_code_pattern.as_deref(),
        target_uuid,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_reports_query_failed",
                )),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.reports.read",
        Some("community_reports"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "status": query.status,
            "reporter_id": reporter_uuid.map(|u| u.to_string()),
            "target_type": tt_sub,
            "reason_code": rc_sub,
            "target_id": target_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "reporter_id": r.reporter_id.to_string(),
                "target_type": r.target_type,
                "target_id": r.target_id.to_string(),
                "reason_code": r.reason_code,
                "details": r.details,
                "evidence_ref": r.evidence_ref,
                "status": r.status,
                "version": r.version,
                "admin_notes": r.admin_notes,
                "disposition": r.disposition,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "status": query.status,
            "reporter_id": reporter_uuid.map(|u| u.to_string()),
            "target_type": tt_sub,
            "reason_code": rc_sub,
            "target_id": target_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "note": "160 minimal ledger; appeals ledger: GET …/admin/community/appeals",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/appeals（160、04 §3.4；`community_report_appeals` 台账）
pub async fn get_admin_community_appeals(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityAppealsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    if let Some(ref st) = query.status {
        let t = st.trim();
        if !t.is_empty() && !is_allowed_community_appeal_status_filter(t) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_community_appeal_status_filter",
                )),
            )
                .into_response();
        }
    }
    let report_uuid = match query
        .report_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_community_appeal_report_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_f = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let rows =
        match db::list_community_report_appeals_admin(pool, limit, report_uuid, status_f).await {
            Ok(v) => v,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_appeals_query_failed",
                    )),
                )
                    .into_response();
            }
        };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.appeals.read",
        Some("community_report_appeals"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "report_id": query.report_id,
            "status": query.status,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "report_id": r.report_id.to_string(),
                "appellant_id": r.appellant_id.to_string(),
                "body": r.body,
                "status": r.status,
                "reviewer_note": r.reviewer_note,
                "version": r.version,
                "created_at": r.created_at.to_rfc3339(),
                "reviewed_at": r.reviewed_at.map(|t| t.to_rfc3339()),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "report_id": query.report_id,
            "status": query.status,
        },
        "meta": {
            "note": "160 appeals ledger; super_admin POST …/appeals/:id/review to decide",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// PATCH /api/v1/admin/community/moderation/:id（160、04 §3.4；id = report id）
pub async fn patch_admin_community_moderation(
    State(state): State<ApiMetaState>,
    Path(raw_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityModerationBody>,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(raw_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_community_report_id")),
            )
                .into_response();
        }
    };
    let st = body.status.trim();
    if !is_allowed_community_report_status(st) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_community_report_status")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_community_report_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_report_query_failed",
                )),
            )
                .into_response();
        }
    };
    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("community_report_not_found")),
        )
            .into_response();
    };
    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "community_report_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    }
    let notes = body.admin_notes.as_deref();
    let disp = body.disposition.as_deref();

    let (updated, penalty_id): (db::CommunityReportRow, Option<Uuid>) =
        if let Some(ref pin) = body.record_penalty {
            if st != "resolved" {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "community_penalty_only_when_resolved",
                    )),
                )
                    .into_response();
            }
            let act = pin.action.trim();
            if act.is_empty() || !db::is_allowed_community_penalty_action(act) {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_community_penalty_action")),
                )
                    .into_response();
            }
            let subject: Option<Uuid> = if let Some(ref sid) = pin.subject_user_id {
                if sid.trim().is_empty() {
                    match db::community_report_default_penalty_subject(pool, &cur).await {
                        Ok(v) => v,
                        Err(_) => {
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key(
                                    "admin_community_penalty_subject_query_failed",
                                )),
                            )
                                .into_response();
                        }
                    }
                } else {
                    match Uuid::parse_str(sid.trim()) {
                        Ok(u) => Some(u),
                        Err(_) => {
                            return (
                                StatusCode::BAD_REQUEST,
                                Json(crate::api_json::err_key("invalid_penalty_subject_user_id")),
                            )
                                .into_response();
                        }
                    }
                }
            } else {
                match db::community_report_default_penalty_subject(pool, &cur).await {
                    Ok(v) => v,
                    Err(_) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key(
                                "admin_community_penalty_subject_query_failed",
                            )),
                        )
                            .into_response();
                    }
                }
            };
            let Some(subject) = subject else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("penalty_subject_required")),
                )
                    .into_response();
            };
            let expires_at = match parse_optional_penalty_expires_at(&pin.expires_at) {
                Ok(v) => v,
                Err(_) => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key("invalid_penalty_expires_at")),
                    )
                        .into_response();
                }
            };
            let reason = pin
                .reason
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .or(notes)
                .or(disp);

            let mut tx = match pool.begin().await {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_tx_failed",
                        )),
                    )
                        .into_response();
                }
            };
            let updated = match db::update_community_report_moderation_conn(
                &mut *tx,
                id,
                body.expected_version,
                st,
                notes,
                disp,
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_update_failed",
                        )),
                    )
                        .into_response();
                }
            };
            let Some(updated) = updated else {
                let _ = tx.rollback().await;
                return (
                    StatusCode::CONFLICT,
                    Json(crate::api_json::err_key("admin_community_moderation_race")),
                )
                    .into_response();
            };
            let pid = match db::insert_community_penalty_conn(
                &mut *tx,
                Some(id),
                subject,
                act,
                reason,
                actor_id,
                expires_at,
                None,
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_penalty_insert_failed",
                        )),
                    )
                        .into_response();
                }
            };
            if db::insert_community_moderation_case_conn(
                &mut *tx,
                id,
                actor_id,
                &cur.status,
                &updated.status,
                updated.admin_notes.as_deref(),
                updated.disposition.as_deref(),
                Some(pid),
            )
            .await
            .is_err()
            {
                let _ = tx.rollback().await;
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_case_insert_failed",
                    )),
                )
                    .into_response();
            }
            if let Err(_) = tx.commit().await {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_tx_commit_failed",
                    )),
                )
                    .into_response();
            }
            (updated, Some(pid))
        } else {
            let mut tx = match pool.begin().await {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_tx_failed",
                        )),
                    )
                        .into_response();
                }
            };
            let updated = match db::update_community_report_moderation_conn(
                &mut *tx,
                id,
                body.expected_version,
                st,
                notes,
                disp,
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_update_failed",
                        )),
                    )
                        .into_response();
                }
            };
            let Some(updated) = updated else {
                let _ = tx.rollback().await;
                return (
                    StatusCode::CONFLICT,
                    Json(crate::api_json::err_key("admin_community_moderation_race")),
                )
                    .into_response();
            };
            if db::insert_community_moderation_case_conn(
                &mut *tx,
                id,
                actor_id,
                &cur.status,
                &updated.status,
                updated.admin_notes.as_deref(),
                updated.disposition.as_deref(),
                None,
            )
            .await
            .is_err()
            {
                let _ = tx.rollback().await;
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_case_insert_failed",
                    )),
                )
                    .into_response();
            }
            if let Err(_) = tx.commit().await {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_tx_commit_failed",
                    )),
                )
                    .into_response();
            }
            (updated, None)
        };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.moderation.update",
        Some("community_reports"),
        Some(&id.to_string()),
        json!({
            "status_before": cur.status,
            "status_after": updated.status,
            "version_before": body.expected_version,
            "version_after": updated.version,
            "penalty_id": penalty_id.map(|p| p.to_string()),
        }),
    )
    .await;

    if let Some(pid) = penalty_id {
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            hdr_request_id.as_deref(),
            "admin.community.penalties.create",
            Some("community_penalties"),
            Some(&pid.to_string()),
            json!({ "report_id": id.to_string(), "source": "moderation_patch" }),
        )
        .await;
    }

    let mut item = json!({
        "id": updated.id.to_string(),
        "reporter_id": updated.reporter_id.to_string(),
        "target_type": updated.target_type,
        "target_id": updated.target_id.to_string(),
        "reason_code": updated.reason_code,
        "details": updated.details,
        "evidence_ref": updated.evidence_ref,
        "status": updated.status,
        "version": updated.version,
        "admin_notes": updated.admin_notes,
        "disposition": updated.disposition,
        "created_at": updated.created_at.to_rfc3339(),
        "updated_at": updated.updated_at.to_rfc3339(),
    });
    if let Some(pid) = penalty_id {
        item["penalty_id"] = json!(pid.to_string());
    }

    let mut body = json!({
        "status": "ok",
        "item": item,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/community/appeals/:id/review（160、04 §3.4）
pub async fn post_admin_community_appeal_review(
    State(state): State<ApiMetaState>,
    Path(raw_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityAppealReviewBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(raw_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_community_appeal_id")),
            )
                .into_response();
        }
    };
    let dec = body.decision.trim();
    if !is_allowed_community_appeal_decision(dec) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "invalid_community_appeal_decision",
            )),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_community_report_appeal_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_appeal_query_failed",
                )),
            )
                .into_response();
        }
    };
    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("community_appeal_not_found")),
        )
            .into_response();
    };
    if cur.status != "pending" {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("community_appeal_not_pending")),
        )
            .into_response();
    }
    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "community_appeal_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    }
    let note = body.reviewer_note.as_deref();
    let updated = match db::review_community_report_appeal(
        pool,
        id,
        body.expected_version,
        dec,
        note,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_appeal_review_failed",
                )),
            )
                .into_response();
        }
    };
    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key(
                "admin_community_appeal_review_race",
            )),
        )
            .into_response();
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.appeals.review",
        Some("community_report_appeals"),
        Some(&id.to_string()),
        json!({
            "report_id": updated.report_id.to_string(),
            "decision": dec,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id.to_string(),
            "report_id": updated.report_id.to_string(),
            "appellant_id": updated.appellant_id.to_string(),
            "body": updated.body,
            "status": updated.status,
            "reviewer_note": updated.reviewer_note,
            "version": updated.version,
            "created_at": updated.created_at.to_rfc3339(),
            "reviewed_at": updated.reviewed_at.map(|t| t.to_rfc3339()),
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/ranking/snapshots（160、04 §3.4）
pub async fn get_admin_community_ranking_snapshots(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityRankingSnapshotsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let fm_sub = query.feed_mode.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let feed_mode_pattern: Option<String> =
        fm_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_community_ranking_snapshots(pool, feed_mode_pattern.as_deref(), limit)
        .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_ranking_snapshots_query_failed",
                )),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.ranking_snapshots.read",
        Some("community_ranking_snapshots"),
        None,
        json!({ "result_count": rows.len(), "limit": limit, "feed_mode": fm_sub }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "feed_mode": r.feed_mode,
                "item_count": r.item_count,
                "top_post_ids": r.top_post_ids.iter().map(|u| u.to_string()).collect::<Vec<_>>(),
                "notes": r.notes,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": { "limit": limit, "feed_mode": fm_sub },
        "meta": {
            "note": "feed 排序快照审计占位；写入 pipeline 仍待 421/观测接入",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/penalties（160、04 §3.4）
pub async fn get_admin_community_penalties(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityPenaltiesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    if let Some(ref st) = query.status {
        let t = st.trim();
        if !t.is_empty() && !is_allowed_community_penalty_status_filter(t) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_community_penalty_status_filter",
                )),
            )
                .into_response();
        }
    }
    let subject = match query
        .subject_user_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_penalty_query_subject_user_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let report_id = match query
        .report_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_penalty_query_report_id")),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let st_f = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let rows = match db::list_community_penalties_admin(pool, limit, subject, report_id, st_f).await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_penalties_query_failed",
                )),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.penalties.read",
        Some("community_penalties"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "subject_user_id": subject.map(|u| u.to_string()),
            "report_id": report_id.map(|u| u.to_string()),
            "status": st_f,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "report_id": r.report_id.map(|u| u.to_string()),
                "subject_user_id": r.subject_user_id.to_string(),
                "action": r.action,
                "status": r.status,
                "reason": r.reason,
                "created_by": r.created_by.to_string(),
                "expires_at": r.expires_at.map(|t| t.to_rfc3339()),
                "metadata": r.metadata.0,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "subject_user_id": query.subject_user_id,
            "report_id": query.report_id,
            "status": query.status,
        },
        "meta": {
            "note": "community_penalties 处罚落账",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/moderation/cases（160、04 §3.4；审核工单审计行）
pub async fn get_admin_community_moderation_cases(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityModerationCasesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let report_id = match query
        .report_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_moderation_cases_query_report_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let filter_actor = match query
        .actor_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_moderation_cases_query_actor_id_filter",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let sb_sub = query.status_before.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let sa_sub = query.status_after.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let sb_pat = sb_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let sa_pat = sa_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let rows = match db::list_community_moderation_cases_admin(
        pool,
        limit,
        report_id,
        filter_actor,
        sb_pat.as_deref(),
        sa_pat.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_moderation_cases_query_failed",
                )),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.moderation_cases.read",
        Some("community_moderation_cases"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "report_id": report_id.map(|u| u.to_string()),
            "actor_id": filter_actor.map(|u| u.to_string()),
            "status_before": sb_sub,
            "status_after": sa_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "report_id": r.report_id.to_string(),
                "actor_id": r.actor_id.to_string(),
                "status_before": r.status_before,
                "status_after": r.status_after,
                "admin_notes_snapshot": r.admin_notes_snapshot,
                "disposition_snapshot": r.disposition_snapshot,
                "penalty_id": r.penalty_id.map(|u| u.to_string()),
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "report_id": query.report_id,
            "actor_id": filter_actor.map(|u| u.to_string()),
            "status_before": sb_sub,
            "status_after": sa_sub,
        },
        "meta": {
            "note": "community_moderation_cases 与 PATCH moderation 同事务写入",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/risk-signals（160 §5、`community_risk_signals`）
pub async fn get_admin_community_risk_signals(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityRiskSignalsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let subject = match query
        .subject_user_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_risk_signals_subject_user_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let st_sub = query.signal_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let rid_sub = query.rule_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let sev_sub = query.severity.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let st_pat = st_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let rid_pat = rid_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let sev_pat = sev_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let rows = match db::list_community_risk_signals_admin(
        pool,
        limit,
        subject,
        st_pat.as_deref(),
        rid_pat.as_deref(),
        sev_pat.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_risk_signals_query_failed",
                )),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.risk_signals.read",
        Some("community_risk_signals"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "subject_user_id": subject.map(|u| u.to_string()),
            "signal_type": st_sub,
            "rule_id": rid_sub,
            "severity": sev_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "subject_user_id": r.subject_user_id.to_string(),
                "signal_type": r.signal_type,
                "rule_id": r.rule_id,
                "severity": r.severity,
                "context": r.context.0,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "subject_user_id": subject.as_ref().map(|u| u.to_string()),
            "signal_type": st_sub,
            "rule_id": rid_sub,
            "severity": sev_sub,
        },
        "meta": {
            "note": "community_risk_signals 滥用/风控命中投影",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/policy-change-logs（160 §5、`community_policy_change_logs`）
pub async fn get_admin_community_policy_change_logs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityPolicyChangeLogsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let actor_uuid: Option<Uuid> = match query.actor_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_community_policy_change_logs_actor_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let scope_sub = query.scope.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let scope_pattern: Option<String> =
        scope_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let summary_sub = query.summary.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let summary_pattern: Option<String> =
        summary_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let source_sub = query.source.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let source_pattern: Option<String> =
        source_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_community_policy_change_logs_admin(
        pool,
        scope_pattern.as_deref(),
        summary_pattern.as_deref(),
        source_pattern.as_deref(),
        actor_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_policy_change_logs_query_failed",
                )),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.policy_change_logs.read",
        Some("community_policy_change_logs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "scope": scope_sub,
            "summary": summary_sub,
            "source": source_sub,
            "actor_id": actor_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "actor_id": r.actor_id.map(|u| u.to_string()),
                "scope": r.scope,
                "summary": r.summary,
                "before_snapshot": r.before_snapshot.0,
                "after_snapshot": r.after_snapshot.0,
                "source": r.source,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "scope": scope_sub,
            "summary": summary_sub,
            "source": source_sub,
            "actor_id": actor_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "note": "community_abuse_policy 等策略变更审计",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// PATCH /api/v1/admin/community/abuse-policy（160 §5；**super_admin**；同事务写 `community_policy_change_logs`）
pub async fn patch_admin_community_abuse_policy(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(patch): Json<db::CommunityAbusePolicyPatch>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(uid) => uid,
        Err(resp) => return resp,
    };
    if community_abuse_policy_patch_is_empty(&patch) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("abuse_policy_patch_empty")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let before = db::get_community_abuse_policy(pool).await;
    let after = db::apply_community_abuse_policy_patch(before.clone(), &patch);
    if before == after {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("abuse_policy_no_effective_change")),
        )
            .into_response();
    }
    if let Err(err_key) = db::validate_community_abuse_policy_row(&after) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(err_key)),
        )
            .into_response();
    }
    if let Err(_) =
        db::save_community_abuse_policy_and_audit_log(pool, actor_id, &after, &before).await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key(
                "admin_community_abuse_policy_update_failed",
            )),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.abuse_policy.patch",
        Some("community_abuse_policy"),
        None,
        json!({ "patch": patch }),
    )
    .await;
    let policy_json = serde_json::to_value(&after).unwrap_or_else(|_| json!({}));
    let mut body = json!({
        "status": "ok",
        "policy": policy_json,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// PATCH /api/v1/admin/community/comments/:id（160、04 §3.4）
pub async fn patch_admin_community_comment(
    State(state): State<ApiMetaState>,
    Path(raw_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityCommentVisibilityBody>,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(raw_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_comment_id")),
            )
                .into_response();
        }
    };
    let vis = body.visibility_status.trim();
    if !db::is_allowed_comment_visibility_status(vis) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "invalid_comment_visibility_status",
            )),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let updated = match db::update_comment_visibility_status(pool, id, vis).await {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_comment_update_failed",
                )),
            )
                .into_response();
        }
    };
    if !updated {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("community_comment_not_found")),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.comments.visibility",
        Some("community_comments"),
        Some(&id.to_string()),
        json!({ "visibility_status": vis }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "id": id.to_string(),
        "visibility_status": vis,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/community/penalties（160、04 §3.4）
pub async fn post_admin_community_penalty(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityPenaltyCreateBody>,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let subject_user_id = match Uuid::parse_str(body.subject_user_id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_penalty_subject_user_id")),
            )
                .into_response();
        }
    };
    let act = body.action.trim();
    if act.is_empty() || !db::is_allowed_community_penalty_action(act) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_community_penalty_action")),
        )
            .into_response();
    }
    let report_id = match body
        .report_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => {
                let exists = match db::get_community_report_by_id(pool, u).await {
                    Ok(v) => v.is_some(),
                    Err(_) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key(
                                "admin_community_penalty_report_query_failed",
                            )),
                        )
                            .into_response();
                    }
                };
                if !exists {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key(
                            "community_report_not_found_for_penalty",
                        )),
                    )
                        .into_response();
                }
                Some(u)
            }
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_penalty_report_id")),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let expires_at = match parse_optional_penalty_expires_at(&body.expires_at) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_penalty_expires_at")),
            )
                .into_response();
        }
    };
    let reason = body
        .reason
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let pid = match db::insert_community_penalty(
        pool,
        report_id,
        subject_user_id,
        act,
        reason,
        actor_id,
        expires_at,
        body.metadata.clone(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_penalty_insert_failed",
                )),
            )
                .into_response();
        }
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.penalties.create",
        Some("community_penalties"),
        Some(&pid.to_string()),
        json!({
            "report_id": report_id.map(|u| u.to_string()),
            "subject_user_id": subject_user_id.to_string(),
            "source": "admin_post",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "id": pid.to_string(),
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/compliance/data-requests（500、04 §3.5、70）
pub async fn get_admin_compliance_data_requests(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminComplianceDataRequestsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let type_filter: Option<String> = match query.request_type.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                let tl = t.to_ascii_lowercase();
                if is_allowed_compliance_request_type(tl.as_str()) {
                    Some(tl)
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_compliance_request_type_filter",
                            "request_type must be export|erasure or omitted",
                        )),
                    )
                        .into_response();
                }
            }
        }
    };

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                let tl = t.to_ascii_lowercase();
                if is_allowed_compliance_request_status(tl.as_str()) {
                    Some(tl)
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_compliance_request_status_filter",
                            "status must be open|in_progress|completed|rejected|cancelled or omitted",
                        )),
                    )
                        .into_response();
                }
            }
        }
    };

    let ref_sub = query.request_ref.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let request_ref_pattern: Option<String> =
        ref_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let subj_sub = query.subject_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let subject_id_pattern: Option<String> =
        subj_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let jur_sub = query.jurisdiction.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let jurisdiction_pattern: Option<String> =
        jur_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_compliance_data_requests(
        pool,
        request_ref_pattern.as_deref(),
        subject_id_pattern.as_deref(),
        type_filter.as_deref(),
        status_filter.as_deref(),
        jurisdiction_pattern.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_requests_query_failed",
                )),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.compliance.data_requests.read",
        Some("compliance_data_requests"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "request_ref": ref_sub,
            "subject_id": subj_sub,
            "request_type": type_filter.as_deref(),
            "status": status_filter.as_deref(),
            "jurisdiction": jur_sub,
        }),
    )
    .await;
    let now = Utc::now();
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            let sla = r.due_at.map(|d| {
                let secs = (d - now).num_seconds();
                json!({
                    "due_at": d.to_rfc3339(),
                    "seconds_until_due": secs,
                    "overdue": secs < 0 && r.status != "completed" && r.status != "rejected" && r.status != "cancelled"
                })
            });
            json!({
                "id": r.id,
                "request_ref": r.request_ref,
                "subject_id": r.subject_id,
                "request_type": r.request_type,
                "status": r.status,
                "due_at": r.due_at.map(|t| t.to_rfc3339()),
                "sla_hours": r.sla_hours,
                "sla": sla,
                "jurisdiction": r.jurisdiction,
                "notes": r.notes,
                "version": r.version,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "request_ref": ref_sub,
            "subject_id": subj_sub,
            "request_type": type_filter.as_deref(),
            "status": status_filter.as_deref(),
            "jurisdiction": jur_sub,
        },
        "meta": {
            "source": "db",
            "generated_at": now.to_rfc3339(),
            "note": "DSAR ledger; events/export_signature/approval_no still 500 phase",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/compliance/data-requests/:request_id/update（500、04 §3.5）
pub async fn post_admin_compliance_data_request_update(
    State(state): State<ApiMetaState>,
    Path(request_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminComplianceDataRequestUpdateBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let rid = match Uuid::parse_str(request_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_compliance_request_id")),
            )
                .into_response()
        }
    };
    let event_type = body.event_type.trim();
    if event_type.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_compliance_event_type")),
        )
            .into_response();
    }
    let new_status: Option<String> = body
        .status
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if let Some(ref s) = new_status {
        if !is_allowed_compliance_request_status(s) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_compliance_request_status",
                )),
            )
                .into_response();
        }
    }
    let new_notes: Option<String> = body
        .notes
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let event_detail: Option<String> = body
        .event_detail
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);

    let cur = match db::get_compliance_data_request_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_lookup_failed",
                )),
            )
                .into_response()
        }
    };
    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key(
                "compliance_data_request_not_found",
            )),
        )
            .into_response();
    };
    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "compliance_data_request_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    }

    let updated = match db::admin_update_compliance_data_request(
        pool,
        rid,
        body.expected_version,
        new_status.as_deref(),
        new_notes.as_deref(),
        event_type,
        event_detail.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_update_failed",
                )),
            )
                .into_response()
        }
    };
    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key(
                "compliance_data_request_update_race",
            )),
        )
            .into_response();
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.compliance.data_requests.update",
        Some("compliance_data_requests"),
        Some(&rid.to_string()),
        json!({
            "event_type": event_type,
            "status_after": updated.status,
            "version_after": updated.version,
        }),
    )
    .await;

    let now = Utc::now();
    let sla = updated.due_at.map(|d| {
        let secs = (d - now).num_seconds();
        json!({
            "due_at": d.to_rfc3339(),
            "seconds_until_due": secs,
            "overdue": secs < 0
                && updated.status != "completed"
                && updated.status != "rejected"
                && updated.status != "cancelled"
        })
    });
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "request_ref": updated.request_ref,
            "subject_id": updated.subject_id,
            "request_type": updated.request_type,
            "status": updated.status,
            "due_at": updated.due_at.map(|t| t.to_rfc3339()),
            "sla_hours": updated.sla_hours,
            "sla": sla,
            "jurisdiction": updated.jurisdiction,
            "notes": updated.notes,
            "version": updated.version,
            "created_at": updated.created_at.to_rfc3339(),
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/compliance/data-requests/:request_id/events（500、04 §3.5）
pub async fn get_admin_compliance_data_request_events(
    State(state): State<ApiMetaState>,
    Path(request_id): Path<String>,
    Query(query): Query<AdminComplianceDataRequestEventsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let rid = match Uuid::parse_str(request_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_compliance_request_id")),
            )
                .into_response()
        }
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let event_sub = query.event_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let event_type_pattern: Option<String> =
        event_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let parent = match db::get_compliance_data_request_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_lookup_failed",
                )),
            )
                .into_response()
        }
    };
    if parent.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key(
                "compliance_data_request_not_found",
            )),
        )
            .into_response();
    }
    let rows = match db::list_compliance_data_request_events(
        pool,
        rid,
        event_type_pattern.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_events_query_failed",
                )),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.compliance.data_request_events.read",
        Some("compliance_data_request_events"),
        Some(&rid.to_string()),
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "event_type": event_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "request_id": r.request_id,
                "event_type": r.event_type,
                "event_detail": r.event_detail,
                "occurred_at": r.occurred_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "request_id": rid.to_string(),
            "event_type": event_sub,
        },
        "meta": {
            "source": "db",
            "note": "event timeline baseline; workflow emits still 500 phase",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/internal-tools/audits（450、04 §3.5、170）
pub async fn get_admin_internal_tool_audits(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminInternalToolAuditsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let tid_sub = query.tool_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let tool_id_pattern: Option<String> =
        tid_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let action_sub = query.action_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let action_pattern: Option<String> =
        action_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let actor_sub = query.actor_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let actor_pattern: Option<String> =
        actor_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let approval_uuid: Option<Uuid> = match query.approval_request_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key_detail(
                                "invalid_internal_tool_audit_approval_request_id_filter",
                                "approval_request_id must be a UUID or omitted",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_internal_tool_audit_events(
        pool,
        tool_id_pattern.as_deref(),
        action_pattern.as_deref(),
        actor_pattern.as_deref(),
        approval_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "internal_tool_audits_query_failed",
                )),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.internal_tools.audits.read",
        Some("internal_tool_audit_events"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "tool_id": tid_sub,
            "action_code": action_sub,
            "actor_id": actor_sub,
            "approval_request_id": approval_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "tool_id": r.tool_id,
                "tool_name": r.tool_name,
                "action_code": r.action_code,
                "actor_id": r.actor_id,
                "approval_request_id": r.approval_request_id,
                "resource_ref": r.resource_ref,
                "input_digest": r.input_digest,
                "result_digest": r.result_digest,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "tool_id": tid_sub,
            "action_code": action_sub,
            "actor_id": actor_sub,
            "approval_request_id": approval_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "source": "db",
            "note": "tool_audit_events ledger; high-risk tools still require 450 RBAC/approval",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/media/access-logs（270 证据签名链审计、70、04 §3.5）
pub async fn get_admin_media_access_logs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminMediaAccessLogsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let action_filter = match parse_media_access_logs_action_filter(&query.action) {
        Ok(a) => a,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_media_access_logs_action")),
            )
                .into_response();
        }
    };

    let token_uuid: Option<Uuid> = match query.token_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_media_access_logs_token_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };

    let obj_sub = query.object_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let object_id_pattern: Option<String> =
        obj_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let actor_sub = query.actor_or_ip.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let actor_pattern: Option<String> =
        actor_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_media_access_logs(
        pool,
        action_filter,
        object_id_pattern.as_deref(),
        actor_pattern.as_deref(),
        token_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("media_access_logs_query_failed")),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.media.access_logs.read",
        Some("media_access_logs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "action": action_filter,
            "object_id": obj_sub,
            "actor_or_ip": actor_sub,
            "token_id": token_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "token_id": r.token_id.map(|u| u.to_string()),
                "object_id": r.object_id,
                "actor_or_ip": r.actor_or_ip,
                "action": r.action,
                "occurred_at": r.occurred_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "action": action_filter,
            "object_id": obj_sub,
            "actor_or_ip": actor_sub,
            "token_id": token_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "source": "db",
            "note": "270 signed-url issue + anonymous redeem audit; actions issue_ok|read_ok|read_expired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/media/signed-url-tokens（270、70、04 §3.5）
pub async fn get_admin_media_signed_url_tokens(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminMediaSignedUrlTokensQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let scope_filter = match parse_media_signed_url_tokens_scope_filter(&query.url_scope) {
        Ok(s) => s,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_media_signed_url_tokens_scope_filter",
                    "url_scope must be read|download or omitted",
                )),
            )
                .into_response();
        }
    };

    let issued_uuid: Option<Uuid> = match query.issued_to.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_media_signed_url_tokens_issued_to_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };

    let token_uuid: Option<Uuid> = match query.token_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_media_signed_url_tokens_token_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };

    let obj_sub = query.object_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let object_id_pattern: Option<String> =
        obj_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_signed_url_tokens(
        pool,
        object_id_pattern.as_deref(),
        scope_filter,
        issued_uuid,
        token_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("signed_url_tokens_query_failed")),
            )
                .into_response();
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.media.signed_url_tokens.read",
        Some("signed_url_tokens"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "object_id": obj_sub,
            "url_scope": scope_filter,
            "issued_to": issued_uuid.map(|u| u.to_string()),
            "token_id": token_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "object_id": r.object_id,
                "url_scope": r.url_scope,
                "expires_at": r.expires_at.to_rfc3339(),
                "issued_to": r.issued_to.to_string(),
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "object_id": obj_sub,
            "url_scope": scope_filter,
            "issued_to": issued_uuid.map(|u| u.to_string()),
            "token_id": token_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "source": "db",
            "note": "270 POST /media/signed-urls issuance ledger; no object storage bytes in MVP",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_jobs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminJobsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_filter = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(s) = status_filter {
        if !is_allowed_async_job_status(s) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_job_status_filter")),
            )
                .into_response();
        }
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let counts_map = match db::async_jobs_status_counts(pool).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("async_jobs_summary_failed")),
            )
                .into_response()
        }
    };
    let summary = json!({
        "pending": counts_map.get("pending").copied().unwrap_or(0),
        "running": counts_map.get("running").copied().unwrap_or(0),
        "completed": counts_map.get("completed").copied().unwrap_or(0),
        "failed": counts_map.get("failed").copied().unwrap_or(0),
        "dead_letter": counts_map.get("dead_letter").copied().unwrap_or(0),
        "cancelled": counts_map.get("cancelled").copied().unwrap_or(0),
    });
    let rows = match db::list_async_jobs(pool, status_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("async_jobs_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.jobs.read",
        Some("async_jobs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "status_filter": status_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "queue_name": r.queue_name,
                "job_type": r.job_type,
                "status": r.status,
                "attempt_count": r.attempt_count,
                "max_attempts": r.max_attempts,
                "last_error": r.last_error,
                "payload_ref": r.payload_ref,
                "idempotency_key": r.idempotency_key,
                "scheduled_for": r.scheduled_for.map(|t| t.to_rfc3339()),
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "summary": summary,
        "items": items,
        "applied_filters": {
            "limit": limit,
            "status": status_filter,
        },
        "meta": {
            "source": "db",
            "note": "250 baseline; worker/NATS wiring pending",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_scheduler_jobs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminSchedulerJobsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let job_code_filter = query
        .job_code
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(code) = job_code_filter {
        if !is_plausible_job_code(code) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_job_code",
                    "job_code must match [a-zA-Z0-9._-] and length 1–160 or be omitted",
                )),
            )
                .into_response();
        }
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_scheduler_job_runs(pool, job_code_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("scheduler_job_runs_query_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.scheduler.jobs.read",
        Some("scheduler_job_runs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "job_code_filter": job_code_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "job_code": r.job_code,
                "status": r.status,
                "trigger_source": r.trigger_source,
                "started_at": r.started_at.map(|t| t.to_rfc3339()),
                "finished_at": r.finished_at.map(|t| t.to_rfc3339()),
                "error_summary": r.error_summary,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "job_code": job_code_filter,
        },
        "meta": {
            "source": "db",
            "note": "260 baseline; cron executor may enqueue rows later",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn post_admin_scheduler_job_rerun(
    State(state): State<ApiMetaState>,
    Path(job_code): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminSchedulerRerunBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let code = job_code.trim();
    if !is_plausible_job_code(code) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_job_code")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let row = match db::insert_scheduler_manual_rerun(pool, code).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("scheduler_rerun_enqueue_failed")),
            )
                .into_response()
        }
    };
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.scheduler.jobs.rerun",
        Some("scheduler_job_runs"),
        Some(&row.id.to_string()),
        json!({
            "job_code": code,
            "run_id": row.id,
            "reason": body.reason,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": row.id,
            "job_code": row.job_code,
            "status": row.status,
            "trigger_source": row.trigger_source,
            "started_at": row.started_at.map(|t| t.to_rfc3339()),
            "finished_at": row.finished_at.map(|t| t.to_rfc3339()),
            "created_at": row.created_at.to_rfc3339(),
        },
        "meta": {
            "note": "queued row recorded; worker must consume 250/260 pipeline when enabled",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

#[cfg(test)]
mod tests;
