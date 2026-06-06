//! **`GET …/admin/indexer/reconcile-reports`** 分页列表。
use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};
use super::reconcile_reports_support::{
    parse_admin_reconcile_reports_query, reconcile_report_list_stats_breakdown,
    AdminReconcileReportsQuery,
};

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
    }

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
            };            if let Some(ev) = db::event_log_escrow_coverage_from_list_item(&r) {
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
