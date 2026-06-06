//! Admin **disputes** 只读（**04 §3.5**）。

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
use super::AdminDisputesListQuery;

pub async fn get_admin_disputes(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminDisputesListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/disputes").into_response();
    };
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_ORDERS_READ).await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(100).clamp(1, 500);
    let status_filter = q.status.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let store = co.store.read().await;
    let mut items: Vec<_> = store
        .disputes
        .values()
        .filter(|d| status_filter.is_none_or(|sf| d.status == sf))
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
        return chain_off_unavailable_json("GET /api/v1/admin/disputes/:id").into_response();
    };
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_ORDERS_READ).await
    {
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
    }
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
