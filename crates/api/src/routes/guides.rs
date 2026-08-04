//! /api/v1/guides（48 §2.2 routes/guides）

use axum::extract::{Path, Query, State};
use axum::http::header::CONTENT_TYPE;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::chain_off;
use crate::middleware;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

#[derive(Debug, Deserialize)]
pub(crate) struct GuidesQuery {
    city: Option<String>,
    language: Option<String>,
    service_type: Option<String>,
    country_code: Option<String>,
    limit: Option<u32>,
    cursor: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct UploadGuideDocBody {
    pub content_base64: String,
    #[serde(default)]
    #[allow(dead_code)]
    pub filename: Option<String>,
}

pub async fn guides_list(
    State(state): State<ApiMetaState>,
    Query(q): Query<GuidesQuery>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let page = match chain_off::parse_order_list_page(q.limit, q.cursor) {
            Ok(p) => p,
            Err(key) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": key, "message": key})),
                )
                    .into_response();
            }
        };
        return match chain_off::guides_list_impl(
            co.clone(),
            q.city,
            q.language,
            q.service_type,
            q.country_code,
            page,
        )
        .await
        {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    Json(json!({ "status": "ok", "items": [] })).into_response()
}

pub async fn guide_availability(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let Ok(uid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::guide_availability_impl(co.clone(), uid).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    Json(json!({
        "status": "ok",
        "guide_id": id,
        "occupied_ranges": json!([]),
        "note": "chain_off unavailable"
    }))
    .into_response()
}

pub async fn guide_get(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let Ok(uid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::guide_get_impl(co.clone(), uid).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json(&format!("/api/v1/guides/{}", id)).into_response()
}

pub async fn guide_create(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::CreateGuideBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response();
            }
        };
        return match chain_off::guide_create_impl(co.clone(), uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/guides").into_response()
}

pub async fn guide_stake(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(body): Json<chain_off::StakeBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response();
            }
        };
        let Ok(gid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::guide_stake_impl(co.clone(), uid, gid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/guides/:id/stake").into_response()
}

pub async fn upload_guide_doc(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<UploadGuideDocBody>,
) -> impl IntoResponse {
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
    };
    {
        let now = Instant::now();
        let mut guard = state.guide_upload_rate.write().await;
        let window = Duration::from_secs(middleware::GUIDE_UPLOAD_RATE_WINDOW_SECS);
        guard
            .entry(uid)
            .or_default()
            .retain(|t| now.saturating_duration_since(*t) < window);
        let count = guard.get(&uid).map_or(0, |v| v.len());
        if count >= middleware::GUIDE_UPLOAD_RATE_LIMIT {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                Json(json!({"error": "rate_limit_exceeded", "message": "rate_limit_exceeded"})),
            )
                .into_response();
        }
        guard.entry(uid).or_default().push(now);
    }
    let data = body.content_base64.trim();
    let (ext, b64) = if data.starts_with("data:") {
        let rest = data.strip_prefix("data:").unwrap_or(data);
        let mime_end = rest.find(';').unwrap_or(0);
        let ext = match rest.get(..mime_end) {
            Some("image/jpeg") | Some("image/jpg") => ".jpg",
            Some("image/png") => ".png",
            Some("image/webp") => ".webp",
            Some("application/pdf") => ".pdf",
            _ => ".bin",
        };
        let b64 = if let Some(i) = rest.find(',') {
            rest.get(i + 1..).unwrap_or(rest)
        } else {
            rest
        };
        (ext, b64)
    } else {
        (".bin", data)
    };
    use base64::Engine;
    let bytes = match base64::engine::general_purpose::STANDARD.decode(b64.as_bytes()) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_base64", "message": "invalid_base64"})),
            )
                .into_response();
        }
    };
    const MAX_GUIDE_UPLOAD_BYTES: usize = 800 * 1024;
    if bytes.len() > MAX_GUIDE_UPLOAD_BYTES {
        return (StatusCode::PAYLOAD_TOO_LARGE, Json(json!({"error": "file_too_large", "message": "file_too_large", "max_bytes": MAX_GUIDE_UPLOAD_BYTES }))).into_response();
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
        ".pdf" => bytes.len() >= 4 && bytes[0..4] == [0x25, 0x50, 0x44, 0x46],
        _ => true,
    };
    if !ok {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_file_type", "message": "invalid_file_type"})),
        )
            .into_response();
    }
    let name = format!("{}{}", Uuid::new_v4(), ext);
    let dir = PathBuf::from("data").join("guide_uploads");
    let _ = fs::create_dir_all(&dir);
    let path = dir.join(&name);
    if let Err(e) = fs::write(&path, &bytes) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "write_failed", "message": "write_failed", "detail": e.to_string()})),
        )
            .into_response();
    }
    let url = format!("/api/v1/uploads/guides/{}", name);
    (StatusCode::OK, Json(json!({ "status": "ok", "url": url }))).into_response()
}

/// True when a stored upload URL ends with this filename segment (guide ∪ provider KYB).
fn payload_contains_upload_name(v: &Value, name: &str) -> bool {
    match v {
        Value::String(s) => s.ends_with(name),
        Value::Array(arr) => arr.iter().any(|x| payload_contains_upload_name(x, name)),
        Value::Object(map) => map
            .values()
            .any(|x| payload_contains_upload_name(x, name)),
        _ => false,
    }
}

fn owner_provider(
    store: &chain_off::ChainOffStore,
    uid: Uuid,
    name: &str,
) -> bool {
    store
        .provider_applications_by_user
        .values()
        .any(|app| app.user_id == uid && payload_contains_upload_name(&app.payload, name))
}

pub async fn serve_guide_upload(
    State(state): State<ApiMetaState>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if name.contains("..")
        || !name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-')
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_filename", "message": "invalid_filename"})),
        )
            .into_response();
    }
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
    };
    if let Some(ref co) = state.chain_off {
        let store = co.store.read().await;
        let is_staff = store
            .users
            .get(&uid)
            .map(|u| u.role == "admin" || u.role == "super_admin")
            .unwrap_or(false);
        let url_ends = |u: &str| u.ends_with(&name);
        let owner_doc = store.guides.values().any(|g| {
            g.user_id == uid
                && (g.id_photo_url.as_deref().map_or(false, url_ends)
                    || g.language_cert_url.as_deref().map_or(false, url_ends)
                    || g.guide_license_url.as_deref().map_or(false, url_ends))
        });
        let owner_provider = owner_provider(&store, uid, &name);
        if !is_staff && !owner_doc && !owner_provider {
            return (
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            )
                .into_response();
        }
    } else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "not_found", "message": "not_found"})),
        )
            .into_response();
    }
    let path = PathBuf::from("data").join("guide_uploads").join(&name);
    match fs::read(&path) {
        Ok(bytes) => {
            let ct = if name.ends_with(".pdf") {
                "application/pdf"
            } else if name.ends_with(".png") {
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
            res
        }
        Err(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "not_found", "message": "not_found"})),
        )
            .into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/guides", get(guides_list).post(guide_create))
        .route("/api/v1/guides/upload-doc", post(upload_guide_doc))
        .route("/api/v1/guides/:id/availability", get(guide_availability))
        .route("/api/v1/guides/:id", get(guide_get))
        .route("/api/v1/guides/:id/stake", post(guide_stake))
        .route("/api/v1/uploads/guides/:name", get(serve_guide_upload))
}
