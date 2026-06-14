//! F-007 · `POST /api/v1/me/profile-avatar`（本机 Base64）与 presign/commit（对象存储）。

use axum::extract::{Path, State};
use axum::http::{
    header::{CACHE_CONTROL, CONTENT_TYPE},
    HeaderMap, HeaderValue, StatusCode,
};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use base64::Engine;
use serde::Deserialize;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use crate::chain_off::ensure_durable_writes_available;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};
use crate::storage::profile_avatar_presign::{
    allow_ephemeral_local_profile_avatar_upload, avatar_object_storage_configured,
    presign_profile_avatar_put, validate_object_storage_avatar_url_for_commit,
};

use super::not_impl_json;

const MAX_AVATAR_BYTES: usize = 512 * 1024;

#[derive(Debug, Deserialize)]
pub(crate) struct ProfileAvatarBody {
    content_base64: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ProfileAvatarPresignBody {
    content_type: String,
    content_length: u64,
}

#[derive(Debug, Deserialize)]
pub(crate) struct ProfileAvatarCommitBody {
    avatar_url: String,
}

fn chain_off_unavailable(path: &'static str) -> impl IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "chain_off_unavailable",
            "message": "chain_off_unavailable",
            "path": path,
        })),
    )
}

fn login_required() -> impl IntoResponse {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "login_required", "message": "login_required"})),
    )
}

fn profile_avatar_filename_allowed(name: &str) -> bool {
    if name.contains("..") {
        return false;
    }
    let lower = name.to_ascii_lowercase();
    let ok_ext = lower.ends_with(".jpg")
        || lower.ends_with(".jpeg")
        || lower.ends_with(".png")
        || lower.ends_with(".webp");
    if !ok_ext {
        return false;
    }
    let stem = name.rsplit_once('.').map(|(s, _)| s).unwrap_or(name);
    Uuid::parse_str(stem).is_ok()
}

fn parse_avatar_payload(raw: &str) -> Result<(Vec<u8>, &'static str), &'static str> {
    let data = raw.trim();
    let (ext, b64) = if data.starts_with("data:") {
        let rest = data.strip_prefix("data:").unwrap_or(data);
        let mime_end = rest.find(';').unwrap_or(0);
        let ext = match rest.get(..mime_end) {
            Some("image/jpeg") | Some("image/jpg") => ".jpg",
            Some("image/png") => ".png",
            Some("image/webp") => ".webp",
            _ => return Err("invalid_file_type"),
        };
        let b64 = if let Some(i) = rest.find(',') {
            rest.get(i + 1..).unwrap_or(rest)
        } else {
            rest
        };
        (ext, b64)
    } else {
        (".jpg", data)
    };
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64.as_bytes())
        .map_err(|_| "invalid_base64")?;
    if bytes.is_empty() {
        return Err("empty_body");
    }
    if bytes.len() > MAX_AVATAR_BYTES {
        return Err("file_too_large");
    }
    let ok = match ext {
        ".jpg" => bytes.len() >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
        ".png" => {
            bytes.len() >= 8 && bytes[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        }
        ".webp" => {
            bytes.len() >= 12
                && bytes[0..4] == [0x52, 0x49, 0x46, 0x46]
                && bytes[8..12] == [0x57, 0x45, 0x42, 0x50]
        }
        _ => false,
    };
    if !ok {
        return Err("invalid_file_type");
    }
    Ok((bytes, ext))
}

async fn persist_avatar_url(
    state: &ApiMetaState,
    user_id: Uuid,
    avatar_url: &str,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let Some(ref co) = state.chain_off else {
        return Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "chain_off_unavailable", "message": "chain_off_unavailable"})),
        ));
    };
    {
        let mut store = co.store.write().await;
        let user = store.users.get_mut(&user_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ))?;
        user.avatar_url = Some(avatar_url.to_string());
        user.updated_at = chrono::Utc::now();
    }
    if let Some(ref pool) = co.db_pool {
        db::update_user_avatar_url(pool, user_id, avatar_url)
            .await
            .map_err(|e| {
                eprintln!("WARN: update_user_avatar_url: {e}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": "db_error", "message": "db_error"})),
                )
            })?;
        let _ = db::delete_profile_avatar_presign_pending_for_url(pool, user_id, avatar_url).await;
    }
    Ok(())
}

pub async fn post_me_profile_avatar(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<ProfileAvatarBody>,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/me/profile-avatar").into_response();
    };
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => return login_required().into_response(),
    };
    if let Err((code, j)) = ensure_durable_writes_available(co) {
        return (code, j).into_response();
    }
    if avatar_object_storage_configured() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "profile_avatar_use_presign_when_object_storage_configured",
                "message": "profile_avatar_use_presign_when_object_storage_configured",
            })),
        )
            .into_response();
    }
    if !allow_ephemeral_local_profile_avatar_upload() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "avatar_ephemeral_upload_url_forbidden",
                "message": "avatar_ephemeral_upload_url_forbidden",
            })),
        )
            .into_response();
    }
    let (bytes, ext) = match parse_avatar_payload(&body.content_base64) {
        Ok(v) => v,
        Err(code) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": code,
                    "message": code,
                    "max_bytes": MAX_AVATAR_BYTES,
                })),
            )
                .into_response();
        }
    };
    let name = format!("{}{}", uid, ext);
    let dir = PathBuf::from("data").join("profile_avatars");
    if let Err(e) = fs::create_dir_all(&dir) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "mkdir_failed", "message": "mkdir_failed", "detail": e.to_string()})),
        )
            .into_response();
    }
    let path = dir.join(&name);
    if let Err(e) = fs::write(&path, &bytes) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "write_failed", "message": "write_failed", "detail": e.to_string()})),
        )
            .into_response();
    }
    let avatar_url = format!("/api/v1/uploads/profile-avatars/{}", name);
    if let Err((code, j)) = persist_avatar_url(&state, uid, &avatar_url).await {
        return (code, j).into_response();
    }
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "avatar_url": avatar_url,
        })),
    )
        .into_response()
}

pub async fn post_me_profile_avatar_presign(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<ProfileAvatarPresignBody>,
) -> impl IntoResponse {
    const PATH: &str = "POST /api/v1/me/profile-avatar/presign";
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable(PATH).into_response();
    };
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => return login_required().into_response(),
    };
    if let Err((code, j)) = ensure_durable_writes_available(co) {
        return (code, j).into_response();
    }
    if !avatar_object_storage_configured() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "avatar_object_storage_not_configured",
                "message": "avatar_object_storage_not_configured",
            })),
        )
            .into_response();
    }
    let out = match presign_profile_avatar_put(uid, &body.content_type, body.content_length).await {
        Ok(o) => o,
        Err(e) => {
            let code = if e == "not_configured" {
                "avatar_object_storage_not_configured"
            } else if e == "invalid_content_type" {
                "invalid_content_type"
            } else if e == "invalid_content_length" {
                "invalid_content_length"
            } else {
                "presign_failed"
            };
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": code, "message": code})),
            )
                .into_response();
        }
    };
    if let Some(ref pool) = co.db_pool {
        if let Err(e) = db::upsert_profile_avatar_presign_pending(
            pool,
            uid,
            &out.avatar_url,
            &out.object_key,
        )
        .await
        {
            eprintln!("WARN: upsert_profile_avatar_presign_pending: {e}");
        }
    }
    let headers_obj: serde_json::Map<String, serde_json::Value> = out
        .headers
        .into_iter()
        .map(|(k, v)| (k, json!(v)))
        .collect();
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "upload_url": out.upload_url,
            "avatar_url": out.avatar_url,
            "headers": headers_obj,
            "expires_in_seconds": out.expires_in_seconds,
        })),
    )
        .into_response()
}

pub async fn post_me_profile_avatar_commit(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<ProfileAvatarCommitBody>,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable("POST /api/v1/me/profile-avatar/commit").into_response();
    };
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => return login_required().into_response(),
    };
    if let Err((code, j)) = ensure_durable_writes_available(co) {
        return (code, j).into_response();
    }
    if !avatar_object_storage_configured() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "avatar_object_storage_not_configured",
                "message": "avatar_object_storage_not_configured",
            })),
        )
            .into_response();
    }
    if let Err(code) =
        validate_object_storage_avatar_url_for_commit(body.avatar_url.trim(), uid)
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": code, "message": code})),
        )
            .into_response();
    }
    let avatar_url = body.avatar_url.trim().to_string();
    if let Err((code, j)) = persist_avatar_url(&state, uid, &avatar_url).await {
        return (code, j).into_response();
    }
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "avatar_url": avatar_url,
        })),
    )
        .into_response()
}

pub async fn serve_profile_avatar_upload(Path(name): Path<String>) -> impl IntoResponse {
    if !profile_avatar_filename_allowed(&name) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_filename", "message": "invalid_filename"})),
        )
            .into_response();
    }
    let path = PathBuf::from("data").join("profile_avatars").join(&name);
    let bytes = match fs::read(&path) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "not_found", "message": "not_found"})),
            )
                .into_response();
        }
    };
    let ct = if name.ends_with(".png") {
        "image/png"
    } else if name.ends_with(".webp") {
        "image/webp"
    } else {
        "image/jpeg"
    };
    let mut res = (StatusCode::OK, bytes).into_response();
    if let Ok(v) = ct.parse() {
        res.headers_mut().insert(CONTENT_TYPE, v);
    }
    res.headers_mut().insert(
        CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=86400, immutable"),
    );
    res
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/me/profile-avatar", post(post_me_profile_avatar))
        .route(
            "/api/v1/me/profile-avatar/presign",
            post(post_me_profile_avatar_presign),
        )
        .route(
            "/api/v1/me/profile-avatar/commit",
            post(post_me_profile_avatar_commit),
        )
        .route(
            "/api/v1/uploads/profile-avatars/:name",
            get(serve_profile_avatar_upload),
        )
}
