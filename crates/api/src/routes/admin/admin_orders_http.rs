//! Admin **orders** 只读（**04 §3.5**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::admin_handler_common::{
    admin_attach_meta_build, request_id_from_headers, write_admin_audit_log_best_effort,
};
use super::admin_rbac::{self, PERM_ORDERS_READ};
use super::AdminOrdersListQuery;

pub async fn get_admin_orders(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOrdersListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/orders").into_response();
    };
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_ORDERS_READ).await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(100).clamp(1, 500);
    let state_filter = q.state.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let store = co.store.read().await;
    let mut items: Vec<_> = store
        .orders
        .values()
        .filter(|o| state_filter.is_none_or(|sf| chain_off::order_state_to_str(o.state) == sf))
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
        return chain_off_unavailable_json("GET /api/v1/admin/orders/:id").into_response();
    };
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_ORDERS_READ).await
    {
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
    }
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
