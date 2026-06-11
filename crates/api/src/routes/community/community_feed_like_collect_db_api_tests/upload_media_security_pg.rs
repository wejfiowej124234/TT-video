//! **C2 · 社区上传安全 · PG·IT**（MIME 白名单 · 魔数 · 体限 · 路径 · Feed 隔离）

use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use base64::Engine;
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::*;
use super::upload_media_pg::{get_upload_file, minimal_mp4_data_url, post_upload, try_remove_uploaded_file, TINY_PNG_DATA_URL};

const TINY_JPEG_DATA_URL: &str =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

fn fake_png_jpeg_magic_data_url() -> String {
    let bytes = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    format!("data:image/png;base64,{b64}")
}

async fn get_public_feed_bodies(app: &axum::Router) -> Vec<String> {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed");
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    j["posts"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|p| p.get("body").and_then(|b| b.as_str()).map(String::from))
        .collect()
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_png_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 upload png (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), TINY_PNG_DATA_URL).await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    let url = j["url"].as_str().expect("url");
    assert!(url.starts_with("/api/v1/uploads/community-posts/"));
    let name = url.rsplit('/').next().expect("filename");
    assert!(name.ends_with(".png"));
    assert!(Uuid::parse_str(name.trim_end_matches(".png")).is_ok());
    assert_eq!(get_upload_file(&app, name).await, StatusCode::OK);
    try_remove_uploaded_file(url);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_jpeg_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 upload jpeg (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), TINY_JPEG_DATA_URL).await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    let url = j["url"].as_str().expect("url");
    let name = url.rsplit('/').next().expect("filename");
    assert!(name.ends_with(".jpg"));
    try_remove_uploaded_file(url);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_fake_mime_mismatch_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 fake mime (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), &fake_png_jpeg_magic_data_url()).await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("mime_body_mismatch"));

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_unsupported_mime_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 unsupported mime (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(
        &app,
        Some(&token),
        "data:application/pdf;base64,JVBERi0xLjQK",
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("unsupported_mime"));

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_oversized_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 oversized (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let prev = std::env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES").ok();
    std::env::set_var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES", "32");
    let (st, j) = post_upload(&app, Some(&token), TINY_PNG_DATA_URL).await;
    if let Some(v) = prev {
        std::env::set_var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES", v);
    } else {
        std::env::remove_var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES");
    }
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("file_too_large"));

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_empty_body_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 empty body (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), "  ").await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("empty_body"));

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_invalid_magic_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 invalid magic (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), "data:image/png;base64,QUJDREVGRw==").await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("invalid_file_type"));

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c2_upload_mp4_requires_multipart_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 mp4 gate (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
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
async fn matrix_93_d_com_c2_serve_path_traversal_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 path traversal (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let app = app_with_pool(pool);

    assert_eq!(
        get_upload_file(&app, "../etc/passwd").await,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        get_upload_file(&app, "..%2Fetc%2Fpasswd.png").await,
        StatusCode::BAD_REQUEST
    );
}

#[tokio::test]
async fn matrix_93_d_com_c2_serve_malicious_filename_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 malicious filename (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let app = app_with_pool(pool);

    for bad in ["a/b.png", "a\\b.png", "a b.png", "bad-chars!.png"] {
        assert_eq!(
            get_upload_file(&app, bad).await,
            StatusCode::BAD_REQUEST,
            "expected invalid_filename for {bad}"
        );
    }
}

#[tokio::test]
async fn matrix_93_d_com_c2_test_origin_post_excluded_from_public_feed_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c2 feed isolation (DATABASE_URL unset)");
        return;
    };
    let _env = crate::test_env_serial::lock();
    let _serial = db_it_lock().lock().await;
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let marker = format!("pi1-fe-c2-feed-isolation-{}", Uuid::new_v4());
    let _post_id = create_text_post(&app, &token, &marker).await;

    let bodies = get_public_feed_bodies(&app).await;
    assert!(
        !bodies.iter().any(|b| b.contains(&marker)),
        "test-origin post leaked to public feed: {bodies:?}"
    );

    if let Some(v) = prev {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v);
    } else {
        std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE");
    }
    cleanup_user_and_posts(&pool, uid).await;
}
