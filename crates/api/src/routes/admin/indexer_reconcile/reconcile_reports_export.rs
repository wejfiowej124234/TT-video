//! **`GET …/admin/indexer/reconcile-reports/export`** CSV/JSON 导出。
use axum::body::Body;
use axum::extract::{Query, State};
use axum::http::header::{HeaderValue, CONTENT_DISPOSITION, CONTENT_TYPE};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::Utc;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::super::reconcile_export_headers::{
    reconcile_export_ed25519_hex, reconcile_export_response_sha256_hex,
    ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS, RECONCILE_EXPORT_BODY_SHA256_HEADER,
    RECONCILE_EXPORT_ED25519_HEADER, RECONCILE_EXPORT_TRUNCATED_HEADER,
};
use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};
use super::reconcile_reports_support::{
    admin_reconciliation_report_payload, list_reconciliation_reports_for_export,
    parse_admin_reconcile_reports_query, parse_reconcile_export_list_mode,
    reconcile_reports_list_to_csv, AdminReconcileReportsExportQuery, ReconcileExportListMode,
};

pub async fn get_admin_indexer_reconcile_reports_export(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminReconcileReportsExportQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
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
    };    let list_mode = match parse_reconcile_export_list_mode(q.export_scope.as_ref()) {
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
        };        let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
            return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
        }
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
        };        if let Some(ref eh) = ed25519_hex {
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
        };        let Some(r) = row else {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "reconciliation_reports_export_failed",
                    "listed report row missing on full fetch",
                )),
            )
                .into_response();
        }
        reports.push(admin_reconciliation_report_payload(r));
    };    let mut body = json!({
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
    };    let body_sha = reconcile_export_response_sha256_hex(&bytes);
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
    };    let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
    }
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
    };    if let Some(ref eh) = ed25519_hex {
        if let Ok(hv) = HeaderValue::from_str(eh) {
            rb = rb.header(RECONCILE_EXPORT_ED25519_HEADER, hv);
        }
    };    match rb.body(Body::from(bytes)) {
        Ok(r) => r.into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "body build failed").into_response(),
    }
}
