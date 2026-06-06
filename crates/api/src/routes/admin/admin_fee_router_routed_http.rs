//! Admin **FeeRouter** 路由事件只读（**04 §3.5**）。

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminFeeRouterRoutedQuery,
};

pub async fn get_admin_fee_router_routed_events(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFeeRouterRoutedQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref _co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/fee-router/routed-events")
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
