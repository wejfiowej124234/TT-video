//! Admin **RegionVault** 转发事件只读 + 导出（**04 §3.5**）。

use axum::body::Body;
use axum::extract::{Query, State};
use axum::http::header::{HeaderValue, CONTENT_DISPOSITION, CONTENT_TYPE};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::Utc;
use serde_json::{json, Value};

use crate::db;
use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::finance_summary::region_vault_forwarded_export_csv;
use super::reconcile_export_headers::{
    reconcile_export_ed25519_hex, reconcile_export_response_sha256_hex,
    RECONCILE_EXPORT_BODY_SHA256_HEADER, RECONCILE_EXPORT_ED25519_HEADER,
    RECONCILE_EXPORT_TRUNCATED_HEADER,
};
use super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminRegionVaultForwardedExportQuery,
    AdminRegionVaultForwardedQuery,
};

pub async fn get_admin_region_vault_forwarded_events(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRegionVaultForwardedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref _co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/region-vault/forwarded-events")
            .into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
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
    let Some(ref _co) = state.chain_off else {
        return chain_off_unavailable_json(
            "GET /api/v1/admin/region-vault/forwarded-events/export",
        )
        .into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
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
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let (rows, truncated) =
        match db::list_region_vault_forwarded_events_export(pool, q.chain_id, limit).await {
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
        };        let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
            return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
        };        let mut rb = Response::builder()
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
    };    let row_vals: Vec<Value> = rows
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
                Json(crate::api_json::err_key(
                    "region_vault_export_json_encode_failed",
                )),
            )
                .into_response();
        }
    };    let body_sha = reconcile_export_response_sha256_hex(&bytes);
    let ed25519_hex =
        reconcile_export_ed25519_hex(state.reconcile_export_ed25519_key.as_deref(), &bytes);
    let filename = format!(
        "region-vault-forwarded-events-{}.json",
        Utc::now().format("%Y%m%dT%H%M%SZ")
    );
    let disp = format!("attachment; filename=\"{filename}\"");
    let Ok(disp_val) = HeaderValue::from_str(&disp) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid filename").into_response();
    };    let Ok(sha_hdr) = HeaderValue::from_str(&body_sha) else {
        return (StatusCode::INTERNAL_SERVER_ERROR, "invalid sha256 header").into_response();
    };    let mut rb = Response::builder()
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
