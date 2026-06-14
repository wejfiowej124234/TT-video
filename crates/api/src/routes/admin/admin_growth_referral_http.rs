//! Admin · G-S1 Referral Code CRUD

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_GROWTH_READ, PERM_GROWTH_WRITE};
use super::write_admin_audit_log_best_effort;

#[derive(Debug, Deserialize)]
pub struct AdminReferralCodesQuery {
    pub is_active: Option<bool>,
    pub code_type: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateReferralCodeBody {
    pub code: Option<String>,
    pub code_type: String,
    pub owner_user_id: Option<Uuid>,
    pub region_iso: Option<String>,
    pub label: Option<String>,
    pub max_uses: Option<i32>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchReferralCodeBody {
    pub is_active: Option<bool>,
    pub label: Option<String>,
    pub max_uses: Option<i32>,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

const ALLOWED_CODE_TYPES: &[&str] = &["user", "kol", "guide", "merchant", "region_operator"];

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/growth/referral-codes",
            get(get_admin_referral_codes).post(post_admin_referral_code),
        )
        .route(
            "/api/v1/admin/growth/referral-codes/:id",
            patch(patch_admin_referral_code),
        )
}

pub async fn get_admin_referral_codes(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminReferralCodesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "growth_db_unavailable",
            })),
        )
            .into_response();
    };
    let code_type = q
        .code_type
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::list_referral_codes_admin(pool, q.is_active, code_type, q.limit.unwrap_or(100)).await {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "growth_referral_list_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}

pub async fn post_admin_referral_code(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateReferralCodeBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "growth_db_unavailable",
            })),
        )
            .into_response();
    };
    let code_type = body.code_type.trim();
    if !ALLOWED_CODE_TYPES.contains(&code_type) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_referral_code_type")),
        )
            .into_response();
    }
    if body.owner_user_id.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("owner_user_id_required")),
        )
            .into_response();
    }
    let input = db::CreateReferralCodeInput {
        code: body.code,
        code_type: code_type.to_string(),
        owner_user_id: body.owner_user_id,
        region_iso: body.region_iso,
        label: body.label,
        max_uses: body.max_uses,
        created_by: Some(actor_id),
    };
    match db::create_referral_code_admin(pool, input).await {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.referral_code.create",
                Some("referral_codes"),
                Some(row.id.to_string().as_str()),
                json!({ "code": row.code, "code_type": row.code_type }),
            )
            .await;
            (StatusCode::CREATED, Json(json!({ "status": "ok", "item": row }))).into_response()
        }
        Err(e) => {
            let msg = e.to_string();
            let key = if msg.contains("referral_code_invalid") {
                "referral_code_invalid"
            } else if msg.contains("duplicate") || msg.contains("unique") {
                "referral_code_duplicate"
            } else {
                "growth_referral_create_failed"
            };
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "status": "error", "error": key, "message": msg })),
            )
                .into_response()
        }
    }
}

pub async fn patch_admin_referral_code(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchReferralCodeBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let id = match Uuid::parse_str(id_raw.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_referral_code_id")),
            )
                .into_response();
        }
    };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "growth_db_unavailable",
            })),
        )
            .into_response();
    };
    let input = db::PatchReferralCodeInput {
        is_active: body.is_active,
        label: body.label,
        max_uses: body.max_uses,
    };
    match db::patch_referral_code_admin(pool, id, input).await {
        Ok(Some(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.referral_code.patch",
                Some("referral_codes"),
                Some(id.to_string().as_str()),
                json!({
                    "is_active": row.is_active,
                    "label": row.label,
                    "max_uses": row.max_uses,
                }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("referral_code_not_found")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "growth_referral_patch_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}
