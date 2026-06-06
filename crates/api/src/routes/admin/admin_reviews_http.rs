//! Admin **reviews** 只读（**04 §3.5**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::admin_handler_common::{
    admin_attach_meta_build, admin_reviews_json_from_memory, db_review_to_chain_row,
    request_id_from_headers, require_admin_actor, write_admin_audit_log_best_effort,
};
use super::AdminReviewsQuery;

pub async fn get_admin_reviews(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminReviewsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/reviews").into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(100).clamp(1, 500);

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
        return chain_off_unavailable_json("GET /api/v1/admin/reviews/:id").into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
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
                }
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
                }
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
        }
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
