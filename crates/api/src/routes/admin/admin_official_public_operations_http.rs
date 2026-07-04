//! Admin · Public Operations — Statistics + display ops + history (SSOT-PUB-OPS O1–O7)

use axum::extract::{Path, Query, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::runtime_identity::RuntimeIdentity;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_OFFICIAL_PUBLISH, PERM_OFFICIAL_READ, PERM_OFFICIAL_WRITE};

#[derive(Debug, Deserialize)]
struct PublishQueueQuery {
    entity_type: Option<String>,
    display_status: Option<String>,
    featured_only: Option<bool>,
    limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct FeaturedBody {
    featured: bool,
}

#[derive(Debug, Deserialize)]
struct PriorityBody {
    display_priority: i32,
}

#[derive(Debug, Deserialize)]
struct SurfacesBody {
    display_surfaces: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct ScheduleBody {
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
struct PreviewQuery {
    surface: Option<String>,
    as_of: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
struct PolicyPatchBody {
    show_test_data: Option<bool>,
    blocked_origins: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct HistoryQuery {
    entity_type: Option<String>,
    entity_id: Option<Uuid>,
    action: Option<String>,
    limit: Option<i64>,
}

async fn append_public_ops_history(
    pool: &sqlx::PgPool,
    actor_id: Uuid,
    action: &str,
    display_source: &str,
    before: Option<&db::PublicOpsDisplayRow>,
    after: &db::PublicOpsDisplayRow,
) {
    if let Err(e) = db::insert_public_ops_display_history(
        pool,
        db::PublicOpsHistoryInsert {
            entity_type: after.entity_type.clone(),
            entity_id: after.id,
            action: action.to_string(),
            actor_id: Some(actor_id),
            display_source: Some(display_source.to_string()),
            before_state: before.map(db::public_ops_display_snapshot),
            after_state: db::public_ops_display_snapshot(after),
        },
    )
    .await
    {
        eprintln!("WARN: public_ops_display_history_insert_failed: {e}");
    }
}

fn official_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn service_unavailable() -> axum::response::Response {
    (
        axum::http::StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "status": "error", "error": "database_required" })),
    )
        .into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/official/public-operations/stats",
            get(get_admin_public_operations_stats),
        )
        .route(
            "/api/v1/admin/official/public-operations/publish-queue",
            get(get_admin_public_operations_publish_queue),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/publish",
            post(post_admin_public_operations_publish),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/unpublish",
            post(post_admin_public_operations_unpublish),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/featured",
            patch(patch_admin_public_operations_featured),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/priority",
            patch(patch_admin_public_operations_priority),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/surfaces",
            patch(patch_admin_public_operations_surfaces),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/schedule",
            patch(patch_admin_public_operations_schedule),
        )
        .route(
            "/api/v1/admin/official/public-operations/entities/:entity_type/:id/preview",
            get(get_admin_public_operations_preview),
        )
        .route(
            "/api/v1/admin/official/public-operations/history",
            get(get_admin_public_operations_history),
        )
        .route(
            "/api/v1/admin/official/public-operations/policy",
            get(get_admin_public_operations_policy).patch(patch_admin_public_operations_policy),
        )
}

pub async fn get_admin_public_operations_stats(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::public_catalog_surface_stats(pool).await {
        Ok(counts) => {
            let policy = db::get_public_ops_policy(pool).await;
            Json(json!({
                "status": "ok",
                "filter_enabled": chain_off::public_catalog_surface_filter_enabled(),
                "data_origin_counts": counts,
                "policy": policy,
            }))
            .into_response()
        }
        Err(e) => {
            eprintln!("WARN: admin_public_operations_stats_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_stats_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn get_admin_public_operations_publish_queue(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<PublishQueueQuery>,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let entity_type = q.entity_type.as_deref().unwrap_or("guides");
    if !db::is_supported_public_ops_entity(entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let filters = db::PublicOpsListFilters {
        display_status: q.display_status.clone(),
        featured_only: q.featured_only,
    };
    match db::list_public_ops_display_entities(pool, entity_type, filters, q.limit.unwrap_or(50)).await
    {
        Ok(items) => Json(json!({
            "status": "ok",
            "entity_type": entity_type,
            "items": items,
        }))
        .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_publish_queue_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_publish_queue_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn post_admin_public_operations_publish(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
) -> impl IntoResponse {
    patch_display_status(&state, &headers, &entity_type, id, "published").await
}

pub async fn post_admin_public_operations_unpublish(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
) -> impl IntoResponse {
    patch_display_status(&state, &headers, &entity_type, id, "hidden").await
}

pub async fn patch_admin_public_operations_featured(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
    Json(body): Json<FeaturedBody>,
) -> impl IntoResponse {
    let (admin_user_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    if !db::is_supported_public_ops_entity(&entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let display_source = format!("admin:{admin_user_id}");
    let before = db::fetch_public_ops_display_entity(pool, &entity_type, id)
        .await
        .ok()
        .flatten();
    match db::set_public_ops_featured(pool, &entity_type, id, body.featured, &display_source).await {
        Ok(Ok(Some(item))) => {
            append_public_ops_history(
                pool,
                admin_user_id,
                "featured",
                &display_source,
                before.as_ref(),
                &item,
            )
            .await;
            sync_chain_off_surface(&state, &entity_type, id, body.featured, item.display_priority)
                .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Ok(None)) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "entity_not_found" })),
        )
            .into_response(),
        Ok(Err("featured_requires_published")) => (
            axum::http::StatusCode::CONFLICT,
            Json(json!({ "status": "error", "error": "featured_requires_published" })),
        )
            .into_response(),
        Ok(Err(_)) => (
            axum::http::StatusCode::CONFLICT,
            Json(json!({ "status": "error", "error": "invalid_featured_transition" })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_featured_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_featured_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn patch_admin_public_operations_priority(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
    Json(body): Json<PriorityBody>,
) -> impl IntoResponse {
    let (admin_user_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    if !db::is_supported_public_ops_entity(&entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let display_source = format!("admin:{admin_user_id}");
    let before = db::fetch_public_ops_display_entity(pool, &entity_type, id)
        .await
        .ok()
        .flatten();
    match db::set_public_ops_display_priority(
        pool,
        &entity_type,
        id,
        body.display_priority,
        &display_source,
    )
    .await
    {
        Ok(Some(item)) => {
            append_public_ops_history(
                pool,
                admin_user_id,
                "priority",
                &display_source,
                before.as_ref(),
                &item,
            )
            .await;
            sync_chain_off_surface(&state, &entity_type, id, item.featured, item.display_priority)
                .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(None) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "entity_not_found" })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_priority_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_priority_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn patch_admin_public_operations_surfaces(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
    Json(body): Json<SurfacesBody>,
) -> impl IntoResponse {
    let (admin_user_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    if !db::is_supported_public_ops_entity(&entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let display_source = format!("admin:{admin_user_id}");
    let before = db::fetch_public_ops_display_entity(pool, &entity_type, id)
        .await
        .ok()
        .flatten();
    match db::set_public_ops_display_surfaces(
        pool,
        &entity_type,
        id,
        body.display_surfaces,
        &display_source,
    )
    .await
    {
        Ok(Some(item)) => {
            append_public_ops_history(
                pool,
                admin_user_id,
                "surfaces",
                &display_source,
                before.as_ref(),
                &item,
            )
            .await;
            sync_chain_off_display_surfaces(&state, &entity_type, id, &item.display_surfaces).await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(None) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "entity_not_found" })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_surfaces_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_surfaces_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn patch_admin_public_operations_schedule(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
    Json(body): Json<ScheduleBody>,
) -> impl IntoResponse {
    let (admin_user_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    if !db::is_supported_public_ops_entity(&entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let display_source = format!("admin:{admin_user_id}");
    let before = db::fetch_public_ops_display_entity(pool, &entity_type, id)
        .await
        .ok()
        .flatten();
    match db::set_public_ops_display_schedule(
        pool,
        &entity_type,
        id,
        body.display_start_at,
        body.display_end_at,
        &display_source,
    )
    .await
    {
        Ok(Ok(Some(item))) => {
            append_public_ops_history(
                pool,
                admin_user_id,
                "schedule",
                &display_source,
                before.as_ref(),
                &item,
            )
            .await;
            sync_chain_off_display_schedule(
                &state,
                &entity_type,
                id,
                item.display_start_at,
                item.display_end_at,
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Ok(None)) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "entity_not_found" })),
        )
            .into_response(),
        Ok(Err("invalid_schedule_range")) => (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "invalid_schedule_range" })),
        )
            .into_response(),
        Ok(Err(_)) => (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "public_operations_schedule_invalid" })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_schedule_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_schedule_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn get_admin_public_operations_preview(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((entity_type, id)): Path<(String, Uuid)>,
    Query(q): Query<PreviewQuery>,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    if !db::is_supported_public_ops_entity(&entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let _runtime = RuntimeIdentity::current();
    let surface = q.surface.as_deref().unwrap_or("market_feed");
    let as_of = q.as_of.unwrap_or_else(Utc::now);
    match db::fetch_public_ops_display_entity(pool, &entity_type, id).await {
        Ok(Some(row)) => {
            let policy = db::get_public_ops_policy(pool).await;
            let preview = db::evaluate_public_ops_preview(row, surface, as_of, Some(&policy));
            let mut public_card = json!(null);
            if let Some(co) = state.chain_off.as_ref() {
                let store = co.store.read().await;
                match entity_type.as_str() {
                    "guides" => {
                        if let Some(g) = store.guides.get(&id) {
                            public_card = chain_off::guide_list_card_json_for_preview(&store, g);
                        }
                    }
                    "orders" => {
                        if let Some(o) = store.orders.get(&id) {
                            if let Some(bundle) = store.itineraries.get(&id) {
                                public_card = chain_off::discover_card_json_for_preview(o, bundle);
                            }
                        }
                    }
                    _ => {}
                }
            }
            Json(json!({
                "status": "ok",
                "preview": preview,
                "public_card": public_card,
            }))
            .into_response()
        }
        Ok(None) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "entity_not_found" })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_preview_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_preview_failed" })),
            )
                .into_response()
        }
    }
}

async fn patch_display_status(
    state: &ApiMetaState,
    headers: &HeaderMap,
    entity_type: &str,
    entity_id: Uuid,
    display_status: &str,
) -> axum::response::Response {
    let (admin_user_id, _) =
        match admin_rbac::require_admin_permission(state, headers, PERM_OFFICIAL_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    if !db::is_supported_public_ops_entity(entity_type) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(state) else {
        return service_unavailable();
    };
    let display_source = format!("admin:{admin_user_id}");
    let before = db::fetch_public_ops_display_entity(pool, entity_type, entity_id)
        .await
        .ok()
        .flatten();
    match db::set_public_ops_display_status(
        pool,
        entity_type,
        entity_id,
        display_status,
        &display_source,
    )
    .await
    {
        Ok(Some(item)) => {
            let action = if display_status == "published" {
                "publish"
            } else {
                "unpublish"
            };
            append_public_ops_history(
                pool,
                admin_user_id,
                action,
                &display_source,
                before.as_ref(),
                &item,
            )
            .await;
            sync_chain_off_display_status(state, entity_type, entity_id, display_status).await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(None) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "entity_not_found" })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_display_patch_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "public_operations_display_patch_failed",
                })),
            )
                .into_response()
        }
    }
}

pub async fn get_admin_public_operations_policy(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let policy = db::get_public_ops_policy(pool).await;
    Json(json!({ "status": "ok", "policy": policy })).into_response()
}

pub async fn patch_admin_public_operations_policy(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<PolicyPatchBody>,
) -> impl IntoResponse {
    let (admin_user_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    if body.show_test_data.is_none() && body.blocked_origins.is_none() {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "empty_policy_patch" })),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let before = db::get_public_ops_policy(pool).await;
    let patch = db::PublicOpsPolicyPatch {
        show_test_data: body.show_test_data,
        blocked_origins: body.blocked_origins,
    };
    let after = db::apply_public_ops_policy_patch(before.clone(), &patch);
    if let Err(err_key) = db::validate_public_ops_policy_row(&after) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": err_key })),
        )
            .into_response();
    }
    match db::save_public_ops_policy(pool, admin_user_id, &after).await {
        Ok(saved) => {
            let display_source = format!("admin:{admin_user_id}");
            let before_json = serde_json::to_value(&before).unwrap_or_else(|_| json!({}));
            let after_json = serde_json::to_value(&saved).unwrap_or_else(|_| json!({}));
            if let Err(e) = db::insert_public_ops_display_history(
                pool,
                db::PublicOpsHistoryInsert {
                    entity_type: "policy".into(),
                    entity_id: db::PUBLIC_OPS_POLICY_HISTORY_ENTITY_ID,
                    action: "test_policy".into(),
                    actor_id: Some(admin_user_id),
                    display_source: Some(display_source),
                    before_state: Some(before_json),
                    after_state: after_json,
                },
            )
            .await
            {
                eprintln!("WARN: public_ops_policy_history_insert_failed: {e}");
            }
            if let Some(co) = state.chain_off.as_ref() {
                let mut store = co.store.write().await;
                store.public_ops_policy = saved.clone();
            }
            Json(json!({ "status": "ok", "policy": saved })).into_response()
        }
        Err(e) => {
            eprintln!("WARN: admin_public_operations_policy_patch_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_policy_patch_failed" })),
            )
                .into_response()
        }
    }
}

pub async fn get_admin_public_operations_history(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<HistoryQuery>,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    if let Some(ref et) = q.entity_type {
        if et != "policy" && !db::is_supported_public_ops_entity(et) {
            return (
                axum::http::StatusCode::BAD_REQUEST,
                Json(json!({ "status": "error", "error": "unsupported_entity_type" })),
            )
                .into_response();
        }
    }
    match db::list_public_ops_display_history(
        pool,
        db::PublicOpsHistoryFilters {
            entity_type: q.entity_type.clone(),
            entity_id: q.entity_id,
            action: q.action.clone(),
        },
        q.limit.unwrap_or(50),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "items": items })).into_response(),
        Err(e) => {
            eprintln!("WARN: admin_public_operations_history_failed: {e}");
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "status": "error", "error": "public_operations_history_failed" })),
            )
                .into_response()
        }
    }
}

async fn sync_chain_off_display_status(
    state: &ApiMetaState,
    entity_type: &str,
    entity_id: Uuid,
    display_status: &str,
) {
    let Some(co) = state.chain_off.as_ref() else {
        return;
    };
    let mut store = co.store.write().await;
    match entity_type {
        "guides" => {
            if let Some(g) = store.guides.get_mut(&entity_id) {
                g.display_status = display_status.to_string();
            }
        }
        "orders" => {
            if let Some(o) = store.orders.get_mut(&entity_id) {
                o.display_status = display_status.to_string();
            }
        }
        _ => {}
    }
}

async fn sync_chain_off_surface(
    state: &ApiMetaState,
    entity_type: &str,
    entity_id: Uuid,
    featured: bool,
    display_priority: i32,
) {
    let Some(co) = state.chain_off.as_ref() else {
        return;
    };
    let mut store = co.store.write().await;
    match entity_type {
        "guides" => {
            if let Some(g) = store.guides.get_mut(&entity_id) {
                g.featured = featured;
                g.display_priority = display_priority;
            }
        }
        "orders" => {
            if let Some(o) = store.orders.get_mut(&entity_id) {
                o.featured = featured;
                o.display_priority = display_priority;
            }
        }
        _ => {}
    }
}

async fn sync_chain_off_display_surfaces(
    state: &ApiMetaState,
    entity_type: &str,
    entity_id: Uuid,
    display_surfaces: &[String],
) {
    let Some(co) = state.chain_off.as_ref() else {
        return;
    };
    let mut store = co.store.write().await;
    match entity_type {
        "guides" => {
            if let Some(g) = store.guides.get_mut(&entity_id) {
                g.display_surfaces = display_surfaces.to_vec();
            }
        }
        "orders" => {
            if let Some(o) = store.orders.get_mut(&entity_id) {
                o.display_surfaces = display_surfaces.to_vec();
            }
        }
        _ => {}
    }
}

async fn sync_chain_off_display_schedule(
    state: &ApiMetaState,
    entity_type: &str,
    entity_id: Uuid,
    display_start_at: Option<DateTime<Utc>>,
    display_end_at: Option<DateTime<Utc>>,
) {
    let Some(co) = state.chain_off.as_ref() else {
        return;
    };
    let mut store = co.store.write().await;
    match entity_type {
        "guides" => {
            if let Some(g) = store.guides.get_mut(&entity_id) {
                g.display_start_at = display_start_at;
                g.display_end_at = display_end_at;
            }
        }
        "orders" => {
            if let Some(o) = store.orders.get_mut(&entity_id) {
                o.display_start_at = display_start_at;
                o.display_end_at = display_end_at;
            }
        }
        _ => {}
    }
}
