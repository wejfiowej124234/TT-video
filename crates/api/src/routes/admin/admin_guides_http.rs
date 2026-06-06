//! Admin **guides** 列表/详情与资质 **PATCH**（**04 §3.5**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::admin_handler_common::{
    admin_attach_meta_build, is_allowed_guide_registration_status, request_id_from_headers,
    require_admin_actor, write_admin_audit_log_best_effort,
};
use super::admin_rbac::{self, PERM_USERS_WRITE};
use super::{AdminGuidesListQuery, AdminPatchGuideRegistrationBody};

pub async fn get_admin_guides(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminGuidesListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/guides").into_response();
    }
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(100).clamp(1, 500);
    let status_filter = q.status.as_deref().map(str::trim).filter(|s| !s.is_empty());

    let store = co.store.read().await;

    let mut items: Vec<_> = store
        .guides
        .values()
        .filter(|g| status_filter.is_none_or(|sf| g.status == sf))
        .map(chain_off::guide_admin_row_json)
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

pub async fn get_admin_guide_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/guides/:id").into_response();
    };    let actor_id = match require_admin_actor(&state, &headers).await {
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
    }
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
        return chain_off_unavailable_json("PATCH /api/v1/admin/guides/:id").into_response();
    };
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_USERS_WRITE).await {
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
    };    let codes_raw: Vec<String> = body
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
    };    let msg_trim = body
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
    };    let (store_codes, store_msg) = if st_norm == "rejected" {
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
        }
        g.status = st_norm.clone();
        g.rejection_codes = store_codes.clone();
        g.rejection_message = store_msg.clone();
        g.updated_at = now;
    };
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
    };    let store = co.store.read().await;
    let Some(g) = store.guides.get(&guide_uuid) else {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("guide_not_found_after_update")),
        )
            .into_response();
    };    let mut out = chain_off::guide_admin_detail_envelope(g);
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
