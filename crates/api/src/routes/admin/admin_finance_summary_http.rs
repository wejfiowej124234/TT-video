//! Admin **finance/summary** 与 **CSV 导出**（**04 §3.5**）。

use axum::body::Body;
use axum::extract::{Query, State};
use axum::http::header::{HeaderValue, CONTENT_DISPOSITION, CONTENT_TYPE};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::Utc;
use serde_json::json;

use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::finance_summary::compute_admin_finance_summary;
use super::{
    admin_attach_meta_build, finance_summary_to_csv, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminFinanceSummaryExportQuery,
};

pub async fn get_admin_finance_summary(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/finance/summary").into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
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
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/finance/summary/export")
            .into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
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
    };    let request_id = request_id_from_headers(&headers);
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
    }
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
