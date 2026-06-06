use axum::extract::{Path, State};
use axum::http::{
    header::{CACHE_CONTROL, CONTENT_TYPE},
    HeaderMap, HeaderValue, StatusCode,
};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::limits::{max_decoded_bytes, CommunityPostMediaUploadBody};
use super::payload::{community_post_media_upload_filename_allowed, parse_upload_payload};

/// **`POST /api/v1/community/posts/upload-media`** — 须登录；**200** `{ "status":"ok", "url":"/api/v1/uploads/community-posts/<uuid>.<ext>" }`
pub async fn post_community_post_media_upload(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<CommunityPostMediaUploadBody>,
) -> impl IntoResponse {
    let _uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"status":"error","error":"unauthorized","message":"unauthorized"})),
            )
                .into_response();
        }
    };
    let (bytes, ext) = match parse_upload_payload(&body.content_base64) {
        Ok(v) => v,
        Err(code) => {
            let msg = match code {
                "file_too_large" => "file_too_large",
                "unsupported_mime" => "unsupported_mime",
                "mime_body_mismatch" => "mime_body_mismatch",
                "invalid_file_type" => "invalid_file_type",
                "missing_base64_payload" => "missing_base64_payload",
                "invalid_base64" => "invalid_base64",
                "empty_body" => "empty_body",
                _ => "invalid_payload",
            };
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": msg,
                    "message": msg,
                    "max_bytes": max_decoded_bytes()
                })),
            )
                .into_response();
        }
    };
    if ext == ".mp4" || ext == ".webm" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "community_video_requires_object_storage_multipart",
                "message": "community_video_requires_object_storage_multipart",
            })),
        )
            .into_response();
    };    let name = format!("{}{}", Uuid::new_v4(), ext);
    let dir = PathBuf::from("data").join("community_post_media");
    if let Err(e) = fs::create_dir_all(&dir) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "mkdir_failed",
                "message": "mkdir_failed",
                "detail": e.to_string()
            })),
        )
            .into_response();
    };    let path = dir.join(&name);
    if let Err(e) = fs::write(&path, &bytes) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "write_failed",
                "message": "write_failed",
                "detail": e.to_string()
            })),
        )
            .into_response();
    };    let url = format!("/api/v1/uploads/community-posts/{}", name);
    (StatusCode::OK, Json(json!({ "status": "ok", "url": url }))).into_response()
}

/// **`GET /api/v1/uploads/community-posts/:name`** — 匿名可读（**UUID** 文件名）；**404** 未落盘。
pub async fn get_serve_community_post_media(Path(name): Path<String>) -> impl IntoResponse {
    if !community_post_media_upload_filename_allowed(&name) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error":"invalid_filename","message":"invalid_filename"})),
        )
            .into_response();
    };    let path = PathBuf::from("data")
        .join("community_post_media")
        .join(&name);
    let bytes = match fs::read(&path) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error":"not_found","message":"not_found"})),
            )
                .into_response();
        }
    };    let ct = if name.ends_with(".png") {
        "image/png"
    } else if name.ends_with(".webp") {
        "image/webp"
    } else if name.ends_with(".mp4") {
        "video/mp4"
    } else if name.ends_with(".webm") {
        "video/webm"
    } else {
        "image/jpeg"
    };    let mut res = (StatusCode::OK, bytes).into_response();
    if let Ok(v) = ct.parse() {
        res.headers_mut().insert(CONTENT_TYPE, v);
    }
    // UUID 文件名不可变；匿名取流与 CDN/浏览器缓存对齐（①②③ 同响应形）。
    res.headers_mut().insert(
        CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=86400, immutable"),
    );
    res
}
