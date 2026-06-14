//! Admin · O-S1 Official Accounts M7

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_OFFICIAL_PUBLISH, PERM_OFFICIAL_READ, PERM_OFFICIAL_WRITE};
use super::write_admin_audit_log_best_effort;

fn official_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn official_err(code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::CONFLICT,
        Json(json!({ "status": "error", "error": code })),
    )
}

fn official_not_found() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "status": "error", "error": "not_found" })),
    )
}

#[derive(Debug, Deserialize)]
pub struct AdminOfficialAccountsQuery {
    pub account_kind: Option<String>,
    pub is_active: Option<bool>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateOfficialAccountBody {
    pub email: String,
    pub password: String,
    pub account_kind: String,
    pub display_label: String,
    pub nickname: Option<String>,
    pub data_origin: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminBatchCreateOfficialAccountsBody {
    pub items: Vec<AdminCreateOfficialAccountBody>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchOfficialAccountBody {
    pub display_label: Option<String>,
    pub showcase_eligible: Option<bool>,
    pub data_origin: Option<String>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminLinkGuideBody {
    pub guide_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct AdminLinkProviderBody {
    pub provider_app_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct AdminBindKolReferralBody {
    pub code: Option<String>,
    pub label: Option<String>,
    pub region_iso: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminOfficialPublishBody {
    pub reason: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/official/accounts",
            get(get_admin_official_accounts).post(post_admin_official_account),
        )
        .route(
            "/api/v1/admin/official/accounts/batch-create",
            post(post_admin_official_accounts_batch),
        )
        .route(
            "/api/v1/admin/official/accounts/:id",
            get(get_admin_official_account).patch(patch_admin_official_account),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/submit-review",
            post(post_admin_official_account_submit_review),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/request-publish",
            post(post_admin_official_account_request_publish),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/publish",
            post(post_admin_official_account_publish),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/archive",
            post(post_admin_official_account_archive),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/link-guide",
            post(post_admin_official_account_link_guide),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/link-provider",
            post(post_admin_official_account_link_provider),
        )
        .route(
            "/api/v1/admin/official/accounts/:id/bind-referral-code",
            post(post_admin_official_account_bind_referral),
        )
}

pub async fn get_admin_official_accounts(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOfficialAccountsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::list_official_accounts_admin(
        pool,
        q.account_kind.as_deref().filter(|s| !s.is_empty()),
        q.is_active,
        q.limit.unwrap_or(50),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("official_accounts_list_failed", e),
    }
}

pub async fn get_admin_official_account(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::get_official_account_admin(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => official_not_found().into_response(),
        Err(e) => db_err("official_account_get_failed", e),
    }
}

async fn hash_password(password: &str) -> Result<String, ()> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST).map_err(|_| ())
}

pub async fn post_admin_official_account(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateOfficialAccountBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let password_hash = match hash_password(body.password.trim()).await {
        Ok(h) => h,
        Err(()) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "password_hash_failed" })),
            )
                .into_response();
        }
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::create_official_account_admin(
        pool,
        actor_id,
        db::CreateOfficialAccountInput {
            email: body.email,
            password_hash,
            account_kind: body.account_kind,
            display_label: body.display_label,
            nickname: body.nickname,
            data_origin: body.data_origin,
            metadata: None,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_create_failed", e),
    }
}

pub async fn post_admin_official_accounts_batch(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminBatchCreateOfficialAccountsBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    let mut batch_items = Vec::new();
    for item in body.items {
        let password_hash = match hash_password(item.password.trim()).await {
            Ok(h) => h,
            Err(()) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "status": "error", "error": "password_hash_failed" })),
                )
                    .into_response();
            }
        };
        batch_items.push(db::BatchCreateOfficialAccountItem {
            email: item.email,
            password_hash,
            account_kind: item.account_kind,
            display_label: item.display_label,
            nickname: item.nickname,
        });
    }
    match db::batch_create_official_accounts_admin(pool, actor_id, batch_items, req_id).await {
        Ok(results) => {
            let items: Vec<Value> = results
                .into_iter()
                .map(|r| match r {
                    Ok(row) => json!({ "status": "ok", "item": row }),
                    Err(code) => json!({ "status": "error", "error": code }),
                })
                .collect();
            Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response()
        }
        Err(e) => db_err("official_accounts_batch_failed", e),
    }
}

pub async fn patch_admin_official_account(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchOfficialAccountBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::patch_official_account_admin(
        pool,
        id,
        actor_id,
        db::PatchOfficialAccountInput {
            display_label: body.display_label,
            showcase_eligible: body.showcase_eligible,
            data_origin: body.data_origin,
            metadata: body.metadata,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_patch_failed", e),
    }
}

pub async fn post_admin_official_account_submit_review(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::submit_official_account_review(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_submit_review_failed", e),
    }
}

pub async fn post_admin_official_account_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminOfficialPublishBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::request_official_account_publish(pool, id, actor_id, body.reason.as_deref(), req_id).await {
        Ok(Ok(approval_id)) => Json(json!({
            "status": "ok",
            "approval_request_id": approval_id,
            "action": "ops.official.account.publish",
        }))
        .into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_request_publish_failed", e),
    }
}

pub async fn post_admin_official_account_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::publish_official_account_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                req_id,
                "ops.official.account.publish.direct",
                Some("ops_official_account"),
                Some(id.to_string().as_str()),
                json!({ "account_id": id }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_publish_failed", e),
    }
}

pub async fn post_admin_official_account_archive(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::archive_official_account_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_archive_failed", e),
    }
}

pub async fn post_admin_official_account_link_guide(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminLinkGuideBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::link_official_account_guide(pool, id, body.guide_id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_link_guide_failed", e),
    }
}

pub async fn post_admin_official_account_link_provider(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminLinkProviderBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::link_official_account_provider(pool, id, body.provider_app_id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_link_provider_failed", e),
    }
}

pub async fn post_admin_official_account_bind_referral(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminBindKolReferralBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::bind_official_account_kol_referral(
        pool,
        id,
        actor_id,
        body.code,
        body.label,
        body.region_iso,
        req_id,
    )
    .await
    {
        Ok(Ok((item, code))) => Json(json!({ "status": "ok", "item": item, "referral_code": code })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_account_bind_referral_failed", e),
    }
}

fn service_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "status": "error", "error": "official_db_unavailable" })),
    )
        .into_response()
}

fn db_err(code: &str, e: sqlx::Error) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "status": "error", "error": code, "message": e.to_string() })),
    )
        .into_response()
}
