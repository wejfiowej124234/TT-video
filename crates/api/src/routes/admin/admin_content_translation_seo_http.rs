//! Admin · C-S7/C-S8 Translation + SEO

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

use super::admin_content_http::AdminVersionActionBody;
use super::admin_rbac::{self, PERM_CONTENT_PUBLISH, PERM_CONTENT_READ, PERM_CONTENT_WRITE};
use super::write_admin_audit_log_best_effort;

const TRANSLATION_TABLE: &str = "catalog_translation_entries";
const TRANSLATION_ENTITY: &str = "catalog_translation_entries";
const SEO_TABLE: &str = "catalog_seo_metadata";
const SEO_ENTITY: &str = "catalog_seo_metadata";

fn catalog_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn catalog_err(code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::CONFLICT,
        Json(json!({ "status": "error", "error": code })),
    )
}

fn catalog_not_found() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "status": "error", "error": "not_found" })),
    )
}

fn db_err(msg: &str, e: sqlx::Error) -> axum::response::Response {
    eprintln!("WARN: {msg}: {e}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "status": "error", "error": msg })),
    )
        .into_response()
}

#[derive(Debug, Deserialize)]
pub struct AdminI18nListQuery {
    pub entity_type: Option<String>,
    pub entity_id: Option<Uuid>,
    pub locale: Option<String>,
    pub publish_status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateTranslationBody {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub locale: String,
    pub field_key: String,
    pub value: String,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchTranslationBody {
    pub version: i32,
    pub value: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateSeoBody {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub locale: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub keywords: Option<String>,
    pub canonical_url: Option<String>,
    pub og_image_url: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchSeoBody {
    pub version: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub keywords: Option<String>,
    pub canonical_url: Option<String>,
    pub og_image_url: Option<String>,
}

async fn i18n_workflow(
    state: &ApiMetaState,
    headers: &HeaderMap,
    table: &str,
    entity_type: &str,
    id: Uuid,
    body: AdminVersionActionBody,
    perm_publish: bool,
    op: &str,
    audit_prefix: &str,
) -> axum::response::Response {
    let perm = if perm_publish {
        PERM_CONTENT_PUBLISH
    } else {
        PERM_CONTENT_WRITE
    };
    let (actor_id, _) = match admin_rbac::require_admin_permission(state, headers, perm).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::i18n_entity_workflow(pool, table, entity_type, id, body.version, op, Some(actor_id), req_id).await {
        Ok(Ok(version)) => {
            write_admin_audit_log_best_effort(
                state,
                actor_id,
                req_id,
                &format!("{audit_prefix}.{op}"),
                Some(entity_type),
                Some(id.to_string().as_str()),
                json!({ "version": version }),
            )
            .await;
            Json(json!({ "status": "ok", "entity_id": id, "version": version })).into_response()
        }
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("i18n_workflow_failed", e),
    }
}

macro_rules! translation_workflow {
    ($fn:ident, $op:expr, $publish:expr) => {
        pub async fn $fn(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            i18n_workflow(
                &state,
                &headers,
                TRANSLATION_TABLE,
                TRANSLATION_ENTITY,
                id,
                body,
                $publish,
                $op,
                "admin.content.translation",
            )
            .await
        }
    };
}

macro_rules! seo_workflow {
    ($fn:ident, $op:expr, $publish:expr) => {
        pub async fn $fn(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            i18n_workflow(
                &state,
                &headers,
                SEO_TABLE,
                SEO_ENTITY,
                id,
                body,
                $publish,
                $op,
                "admin.content.seo",
            )
            .await
        }
    };
}

translation_workflow!(post_admin_translation_submit, "submit", false);
translation_workflow!(post_admin_translation_publish, "publish", true);
translation_workflow!(post_admin_translation_archive, "archive", false);
seo_workflow!(post_admin_seo_submit, "submit", false);
seo_workflow!(post_admin_seo_publish, "publish", true);
seo_workflow!(post_admin_seo_archive, "archive", false);

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/content/translations",
            get(get_admin_translations).post(post_admin_translation),
        )
        .route(
            "/api/v1/admin/content/translations/:id",
            get(get_admin_translation).patch(patch_admin_translation),
        )
        .route(
            "/api/v1/admin/content/translations/:id/submit-review",
            post(post_admin_translation_submit),
        )
        .route(
            "/api/v1/admin/content/translations/:id/publish",
            post(post_admin_translation_publish),
        )
        .route(
            "/api/v1/admin/content/translations/:id/archive",
            post(post_admin_translation_archive),
        )
        .route("/api/v1/admin/content/seo", get(get_admin_seo).post(post_admin_seo))
        .route(
            "/api/v1/admin/content/seo/:id",
            get(get_admin_seo_one).patch(patch_admin_seo),
        )
        .route(
            "/api/v1/admin/content/seo/:id/submit-review",
            post(post_admin_seo_submit),
        )
        .route("/api/v1/admin/content/seo/:id/publish", post(post_admin_seo_publish))
        .route("/api/v1/admin/content/seo/:id/archive", post(post_admin_seo_archive))
}

pub async fn get_admin_translations(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminI18nListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::list_admin_catalog_translations(
        pool,
        q.entity_type.as_deref(),
        q.entity_id,
        q.locale.as_deref(),
        q.publish_status.as_deref(),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "items": items })).into_response(),
        Err(e) => db_err("translations_list_failed", e),
    }
}

pub async fn get_admin_translation(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::get_admin_catalog_translation(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("translation_get_failed", e),
    }
}

pub async fn post_admin_translation(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateTranslationBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::create_admin_catalog_translation(
        pool,
        body.entity_type.trim(),
        body.entity_id,
        body.locale.trim(),
        body.field_key.trim(),
        body.value.trim(),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.translation.create",
                Some(TRANSLATION_ENTITY),
                Some(item.id.to_string().as_str()),
                json!({ "locale": item.locale, "field_key": item.field_key }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("translation_create_failed", e),
    }
}

pub async fn patch_admin_translation(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchTranslationBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::patch_admin_catalog_translation(
        pool,
        id,
        body.version,
        body.value.as_deref(),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("translation_patch_failed", e),
    }
}

pub async fn get_admin_seo(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminI18nListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::list_admin_catalog_seo(
        pool,
        q.entity_type.as_deref(),
        q.entity_id,
        q.locale.as_deref(),
        q.publish_status.as_deref(),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "items": items })).into_response(),
        Err(e) => db_err("seo_list_failed", e),
    }
}

pub async fn get_admin_seo_one(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::get_admin_catalog_seo(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("seo_get_failed", e),
    }
}

pub async fn post_admin_seo(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateSeoBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let locale = body.locale.as_deref().unwrap_or("*").trim();
    match db::create_admin_catalog_seo(
        pool,
        body.entity_type.trim(),
        body.entity_id,
        locale,
        body.title.as_deref(),
        body.description.as_deref(),
        body.keywords.as_deref(),
        body.canonical_url.as_deref(),
        body.og_image_url.as_deref(),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.seo.create",
                Some(SEO_ENTITY),
                Some(item.id.to_string().as_str()),
                json!({ "locale": item.locale }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("seo_create_failed", e),
    }
}

pub async fn patch_admin_seo(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchSeoBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::patch_admin_catalog_seo(
        pool,
        id,
        body.version,
        body.title.as_deref(),
        body.description.as_deref(),
        body.keywords.as_deref(),
        body.canonical_url.as_deref(),
        body.og_image_url.as_deref(),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("seo_patch_failed", e),
    }
}
