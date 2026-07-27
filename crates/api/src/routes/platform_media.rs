//! Platform Media API (B-MEDIA-001 eng) — unified Image/Video asset metadata.
//!
//! Bytes → Object Storage → CDN (CDN Acceptance remains Owner-gated).
//! Does **not** claim live R2+CDN cutover PASS.

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};
use crate::storage::media_service::{
    build_object_key, resolve_media_storage_backend, MediaStorageBackend,
};

const ALLOWED_DOMAINS: &[&str] = &[
    "itinerary",
    "poi",
    "community",
    "merchant",
    "guide",
    "cms",
    "acquisition",
    "profile",
    "other",
];

const ALLOWED_KINDS: &[&str] = &["image", "video", "other"];

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/platform-media/assets",
            post(post_platform_media_asset_draft),
        )
        .route(
            "/api/v1/platform-media/assets/:asset_id",
            get(get_platform_media_asset),
        )
        .route(
            "/api/v1/platform-media/assets/:asset_id/transition",
            post(post_platform_media_asset_transition),
        )
}

#[derive(Debug, Deserialize)]
struct CreateDraftBody {
    domain: String,
    kind: String,
    mime_type: String,
    #[serde(default)]
    filename: Option<String>,
    #[serde(default)]
    byte_size: Option<i64>,
    #[serde(default)]
    visibility: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TransitionBody {
    to_status: String,
    #[serde(default)]
    last_error: Option<String>,
}

fn err_json(code: &str, status: StatusCode) -> axum::response::Response {
    (
        status,
        Json(json!({
            "status": "error",
            "error": code,
            "message": code,
        })),
    )
        .into_response()
}

fn pool_from_state(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state
        .chain_off
        .as_ref()
        .and_then(|co| co.db_pool.as_ref())
}

/// POST /api/v1/platform-media/assets — create draft metadata row + object_key.
async fn post_platform_media_asset_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<CreateDraftBody>,
) -> impl IntoResponse {
    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return err_json("unauthorized", StatusCode::UNAUTHORIZED);
    };
    let Some(pool) = pool_from_state(&state) else {
        return err_json("database_unavailable", StatusCode::SERVICE_UNAVAILABLE);
    };

    let domain = body.domain.trim().to_ascii_lowercase();
    if !ALLOWED_DOMAINS.contains(&domain.as_str()) {
        return err_json("invalid_domain", StatusCode::BAD_REQUEST);
    }
    let kind = body.kind.trim().to_ascii_lowercase();
    if !ALLOWED_KINDS.contains(&kind.as_str()) {
        return err_json("invalid_kind", StatusCode::BAD_REQUEST);
    }
    let mime = body.mime_type.trim();
    if mime.is_empty() || mime.len() > 128 {
        return err_json("invalid_mime_type", StatusCode::BAD_REQUEST);
    }
    let visibility = body
        .visibility
        .as_deref()
        .unwrap_or("private")
        .trim()
        .to_ascii_lowercase();
    if !matches!(
        visibility.as_str(),
        "private" | "owner" | "authenticated" | "public"
    ) {
        return err_json("invalid_visibility", StatusCode::BAD_REQUEST);
    }
    let byte_size = body.byte_size.unwrap_or(0).max(0);
    let asset_id = Uuid::new_v4();
    let filename = body
        .filename
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(if kind == "video" {
            "video.bin"
        } else {
            "image.bin"
        });
    let object_key = build_object_key(&domain, uid, asset_id, filename);
    let backend = resolve_media_storage_backend();

    if let Err(e) = db::insert_platform_media_asset_draft(
        pool,
        asset_id,
        uid,
        &object_key,
        mime,
        byte_size,
        &domain,
        &kind,
        &visibility,
    )
    .await
    {
        eprintln!("platform_media insert draft failed: {e}");
        return err_json("persist_failed", StatusCode::INTERNAL_SERVER_ERROR);
    }

    (
        StatusCode::CREATED,
        Json(json!({
            "status": "ok",
            "asset_id": asset_id.to_string(),
            "object_key": object_key,
            "asset_status": "draft",
            "storage_backend": backend.to_string(),
            "cdn_acceptance": "OWNER_GATED",
            "upload_hint": match backend {
                MediaStorageBackend::CloudflareR2 => "use multipart upload against R2 (Owner CF secrets)",
                MediaStorageBackend::LocalDev => "local_dev: metadata only until R2 env present",
            },
            "next_statuses": ["uploading", "failed"],
        })),
    )
        .into_response()
}

/// GET /api/v1/platform-media/assets/:asset_id — owner read.
async fn get_platform_media_asset(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(asset_id): Path<Uuid>,
) -> impl IntoResponse {
    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return err_json("unauthorized", StatusCode::UNAUTHORIZED);
    };
    let Some(pool) = pool_from_state(&state) else {
        return err_json("database_unavailable", StatusCode::SERVICE_UNAVAILABLE);
    };
    let row = match db::get_platform_media_asset_owned(pool, asset_id, uid).await {
        Ok(r) => r,
        Err(e) => {
            eprintln!("platform_media get failed: {e}");
            return err_json("lookup_failed", StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    let Some(row) = row else {
        return err_json("not_found", StatusCode::NOT_FOUND);
    };
    Json(json!({
        "status": "ok",
        "asset_id": row.id.to_string(),
        "owner_id": row.owner_id.to_string(),
        "object_key": row.object_key,
        "mime_type": row.mime_type,
        "byte_size": row.byte_size,
        "asset_status": row.status,
        "visibility": row.visibility,
        "domain": row.domain,
        "kind": row.kind,
        "cdn_url": row.cdn_url,
        "playback_url": row.playback_url,
        "last_error": row.last_error,
        "created_at": row.created_at.to_rfc3339(),
        "updated_at": row.updated_at.to_rfc3339(),
        "cdn_acceptance": "OWNER_GATED",
    }))
    .into_response()
}

/// POST /api/v1/platform-media/assets/:asset_id/transition — status machine step.
async fn post_platform_media_asset_transition(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(asset_id): Path<Uuid>,
    Json(body): Json<TransitionBody>,
) -> impl IntoResponse {
    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return err_json("unauthorized", StatusCode::UNAUTHORIZED);
    };
    let Some(pool) = pool_from_state(&state) else {
        return err_json("database_unavailable", StatusCode::SERVICE_UNAVAILABLE);
    };
    let row = match db::get_platform_media_asset_owned(pool, asset_id, uid).await {
        Ok(r) => r,
        Err(e) => {
            eprintln!("platform_media get failed: {e}");
            return err_json("lookup_failed", StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    let Some(row) = row else {
        return err_json("not_found", StatusCode::NOT_FOUND);
    };
    let to = body.to_status.trim().to_ascii_lowercase();
    if !db::platform_media_transition_allowed(&row.status, &to) {
        return err_json("invalid_transition", StatusCode::CONFLICT);
    }
    match db::transition_platform_media_asset(
        pool,
        asset_id,
        uid,
        &row.status,
        &to,
        body.last_error.as_deref(),
    )
    .await
    {
        Ok(0) => return err_json("transition_race", StatusCode::CONFLICT),
        Ok(_) => {}
        Err(e) => {
            eprintln!("platform_media transition failed: {e}");
            return err_json("persist_failed", StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
    Json(json!({
        "status": "ok",
        "asset_id": asset_id.to_string(),
        "from_status": row.status,
        "to_status": to,
        "cdn_acceptance": "OWNER_GATED",
    }))
    .into_response()
}
