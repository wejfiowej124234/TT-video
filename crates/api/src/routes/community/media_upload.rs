//! **社区发帖媒体**：`POST /api/v1/community/posts/upload-media` 写 **`data/community_post_media/`**；
//! **`GET /api/v1/uploads/community-posts/:name`** 匿名可读（文件名含 **UUID**，与 **guides** `upload-doc` 同形）。
//!
//! **体限**：与全局 **`REQUEST_BODY_LIMIT_BYTES`**（**1MiB**）对齐；解码后默认 **≤512KiB**，可由 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES`** 调至 **≤980000**（为 JSON 包装留余量）；**JPG/PNG/WebP/MP4/WebM** 魔数校验。

use axum::extract::{Path, State};
use axum::http::{header::CONTENT_TYPE, HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use crate::state::{extract_user_with_session_check, ApiMetaState};

#[derive(Debug, Deserialize)]
pub struct CommunityPostMediaUploadBody {
    pub content_base64: String,
}

/// 默认解码上限；可调但须低于全站 JSON 体 **`REQUEST_BODY_LIMIT_BYTES`**（**1MiB**）留出 **`content_base64` 包装**。
const DEFAULT_MAX_DECODED_BYTES: usize = 512 * 1024;
/// 环境变量上调时的硬顶（字节），避免误配突破 Axum 全局体限。
const ENV_MAX_DECODED_CAP: usize = 980_000;

fn max_decoded_bytes() -> usize {
    std::env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES")
        .ok()
        .and_then(|s| s.trim().parse::<usize>().ok())
        .map(|n| n.clamp(1024, ENV_MAX_DECODED_CAP))
        .unwrap_or(DEFAULT_MAX_DECODED_BYTES)
}

fn sniff_ext_and_validate(bytes: &[u8], declared: &str) -> Result<&'static str, &'static str> {
    let ext = if bytes.len() >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF {
        ".jpg"
    } else if bytes.len() >= 8 && bytes[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] {
        ".png"
    } else if bytes.len() >= 12
        && bytes[0..4] == [0x52, 0x49, 0x46, 0x46]
        && bytes[8..12] == [0x57, 0x45, 0x42, 0x50]
    {
        ".webp"
    } else if bytes.len() >= 12 && &bytes[4..8] == b"ftyp" {
        ".mp4"
    } else if bytes.len() >= 4 && bytes[0..4] == [0x1A, 0x45, 0xDF, 0xA3] {
        ".webm"
    } else {
        return Err("invalid_file_type");
    };
    if declared != ".bin" && declared != ext {
        return Err("mime_body_mismatch");
    }
    Ok(ext)
}

fn parse_upload_payload(raw: &str) -> Result<(Vec<u8>, &'static str), &'static str> {
    let t = raw.trim();
    if t.is_empty() {
        return Err("empty_body");
    }
    let (ext_hint, b64) = if t.starts_with("data:") {
        let rest = t.strip_prefix("data:").unwrap_or(t);
        let mime_end = rest.find(';').unwrap_or(0);
        let mime = rest.get(..mime_end).unwrap_or("");
        let ext_decl: &'static str = match mime {
            "image/jpeg" | "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "video/mp4" => ".mp4",
            "video/webm" => ".webm",
            _ => return Err("unsupported_mime"),
        };
        let b64 = if let Some(i) = rest.find(',') {
            rest.get(i + 1..).unwrap_or(rest)
        } else {
            return Err("missing_base64_payload");
        };
        (ext_decl, b64)
    } else {
        (".bin", t)
    };
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64.as_bytes())
        .map_err(|_| "invalid_base64")?;
    if bytes.len() > max_decoded_bytes() {
        return Err("file_too_large");
    }
    let ext = sniff_ext_and_validate(&bytes, ext_hint)?;
    Ok((bytes, ext))
}

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

    let name = format!("{}{}", Uuid::new_v4(), ext);
    let dir = PathBuf::from("data").join("community_post_media");
    if let Err(e) = fs::create_dir_all(&dir) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"status":"error","error":"mkdir_failed","message": e.to_string()})),
        )
            .into_response();
    }
    let path = dir.join(&name);
    if let Err(e) = fs::write(&path, &bytes) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"status":"error","error":"write_failed","message": e.to_string()})),
        )
            .into_response();
    }

    let url = format!("/api/v1/uploads/community-posts/{}", name);
    (
        StatusCode::OK,
        Json(json!({ "status": "ok", "url": url })),
    )
        .into_response()
}

/// **`GET /api/v1/uploads/community-posts/:name`** — 匿名可读（**UUID** 文件名）；**404** 未落盘。
pub async fn get_serve_community_post_media(Path(name): Path<String>) -> impl IntoResponse {
    if name.contains("..")
        || !name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-')
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error":"invalid_filename","message":"invalid_filename"})),
        )
            .into_response();
    }
    let path = PathBuf::from("data").join("community_post_media").join(&name);
    let bytes = match fs::read(&path) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error":"not_found","message":"not_found"})),
            )
                .into_response();
        }
    };
    let ct = if name.ends_with(".png") {
        "image/png"
    } else if name.ends_with(".webp") {
        "image/webp"
    } else if name.ends_with(".mp4") {
        "video/mp4"
    } else if name.ends_with(".webm") {
        "video/webm"
    } else {
        "image/jpeg"
    };
    let mut res = (StatusCode::OK, bytes).into_response();
    if let Ok(v) = ct.parse() {
        res.headers_mut().insert(CONTENT_TYPE, v);
    }
    res
}

#[cfg(test)]
mod media_upload_parse_tests {
    use super::*;

    #[test]
    fn rejects_claimed_webm_without_ebml_magic() {
        assert_eq!(
            parse_upload_payload("data:video/webm;base64,AAAA").err(),
            Some("invalid_file_type")
        );
    }

    #[test]
    fn accepts_minimal_ebml_prefix_as_webm() {
        use base64::Engine;
        let bytes = vec![0x1A, 0x45, 0xDF, 0xA3];
        let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        let payload = format!("data:video/webm;base64,{}", b64);
        let got = parse_upload_payload(&payload).expect("ok");
        assert_eq!(got.1, ".webm");
        assert_eq!(got.0, bytes);
    }
}
