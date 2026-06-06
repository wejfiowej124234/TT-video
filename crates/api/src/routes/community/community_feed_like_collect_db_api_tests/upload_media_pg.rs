//! **`upload-media`** / **匿名取流** 主栈 HTTP 证据（**A4**）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use base64::Engine;
use std::path::PathBuf;
use tower::ServiceExt;

use super::helpers::*;

pub(super) const TINY_PNG_DATA_URL: &str = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

pub(super) fn minimal_mp4_data_url() -> String {
    let bytes = vec![0u8, 0, 0, 0, b'f', b't', b'y', b'p', 0, 0, 0, 0];
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    format!("data:video/mp4;base64,{b64}")
}

pub(super) async fn post_upload(
    app: &axum::Router,
    token: Option<&str>,
    content_base64: &str,
) -> (StatusCode, serde_json::Value) {
    let mut req = Request::builder()
        .method(Method::POST)
        .uri("/api/v1/community/posts/upload-media")
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(t) = token {
        req = req.header(header::AUTHORIZATION, auth_bearer(t));
    };    let res = app
        .clone()
        .oneshot(
            req.body(Body::from(
                serde_json::json!({ "content_base64": content_base64 }).to_string(),
            ))
            .unwrap(),
        )
        .await
        .expect("upload-media");
    (res.status(), response_json(res).await)
}

pub(super) async fn get_upload_file(app: &axum::Router, name: &str) -> StatusCode {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/uploads/community-posts/{name}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get upload");
    res.status()
}

pub(super) fn try_remove_uploaded_file(url: &str) {
    let name = url.trim().rsplit('/').next().unwrap_or("");
    if name.is_empty() {
        return;
    };    let path = PathBuf::from("data").join("community_post_media").join(name);
    let _ = std::fs::remove_file(path);
}

#[tokio::test]
async fn matrix_93_d_com_upload_media_png_then_get_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: upload-media png (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), TINY_PNG_DATA_URL).await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    assert_eq!(j["status"], "ok");
    let url = j["url"].as_str().expect("url");
    assert!(url.starts_with("/api/v1/uploads/community-posts/"));
    let name = url.rsplit('/').next().expect("filename");
    assert_eq!(get_upload_file(&app, name).await, StatusCode::OK);
    try_remove_uploaded_file(url);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_upload_media_unauthorized_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: upload-media unauthorized (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let app = app_with_pool(pool);

    let (st, j) = post_upload(&app, None, TINY_PNG_DATA_URL).await;
    assert_eq!(st, StatusCode::UNAUTHORIZED, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("unauthorized"));
}

#[tokio::test]
async fn matrix_93_d_com_upload_media_empty_body_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: upload-media empty_body (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), "   ").await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("empty_body"));

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_upload_media_mp4_requires_multipart_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: upload-media mp4 gate (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), &minimal_mp4_data_url()).await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(
        j["error"].as_str(),
        Some("community_video_requires_object_storage_multipart")
    );

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_serve_upload_invalid_filename_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: serve upload invalid_filename (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let app = app_with_pool(pool);

    assert_eq!(
        get_upload_file(&app, "bad-chars!.png").await,
        StatusCode::BAD_REQUEST
    );
}

#[tokio::test]
async fn matrix_93_d_com_serve_upload_not_found_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: serve upload not_found (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let app = app_with_pool(pool);
    let missing = format!("{}.png", uuid::Uuid::new_v4());

    assert_eq!(
        get_upload_file(&app, &missing).await,
        StatusCode::NOT_FOUND
    );
}
