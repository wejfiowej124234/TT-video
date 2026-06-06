//! Shared helpers for `routes/admin` HTTP handlers (authz, audit, `meta.build`, reviews memory path).

use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::routes::chain_off_unavailable_json;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use crate::routes::admin::query_types::AdminReviewsQuery;

pub(crate) fn is_allowed_guide_registration_status(s: &str) -> bool {
    matches!(
        s,
        "pending" | "active" | "rejected" | "suspended" | "pending_review"
    )
}

pub(crate) fn request_id_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

pub(crate) async fn write_admin_audit_log_best_effort(
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

pub(crate) async fn require_admin_actor(
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
        return Err(chain_off_unavailable_json("GET /api/v1/admin/*").into_response());
    }
    let store = co.store.read().await;
    let Some(caller) = store.users.get(&uid) else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key("user_not_found")),
        )
            .into_response());
    }
    if caller.role != "admin" && caller.role != "super_admin" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("admin_required")),
        )
            .into_response());
    }

    Ok((uid, caller.role.clone()))
}

pub(crate) async fn require_super_admin_uid(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Result<Uuid, Response> {
    use super::admin_rbac;
    match admin_rbac::require_super_admin_permission(state, headers).await {
        Ok(uid) => Ok(uid),
        Err(_) => Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("super_admin_required")),
        )
            .into_response()),
    }
}

pub(crate) fn admin_db_pool_required(state: &ApiMetaState) -> Result<&sqlx::PgPool, Response> {
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

/// Used by `admin/tests.rs` via `super::is_supported_target_role`.
pub fn is_supported_target_role(role: &str) -> bool {
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

pub(crate) fn admin_reviews_json_from_memory(
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
            };            if let Some(mn) = q.min_score {
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

pub(crate) fn db_review_to_chain_row(r: db::DbReviewRow) -> chain_off::ReviewRow {
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

pub(crate) fn admin_attach_meta_build(body: &mut Value) {
    let Some(root) = body.as_object_mut() else {
        return;
    };    let build = crate::routes::meta_build_value();
    match root.get_mut("meta") {
        Some(Value::Object(meta_obj)) => {
            meta_obj.insert("build".to_string(), build);
        }
        _ => {
            root.insert("meta".to_string(), json!({ "build": build }));
        }
    }
}

pub(crate) fn parse_feature_flag_enabled_filter(raw: &Option<String>) -> Result<Option<bool>, ()> {
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
