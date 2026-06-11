//! Phase ② · **C4** 视频播放链 PG·IT（媒体资产 · Feed/Profile 读路径 · HLS 预留边界）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

async fn cleanup_user_posts_and_media(pool: &sqlx::PgPool, user_id: uuid::Uuid) {
    let _ = sqlx::query("DELETE FROM community_media_assets WHERE owner_user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    cleanup_user_and_posts(pool, user_id).await;
}

async fn seed_user_example_com(pool: &sqlx::PgPool) -> (uuid::Uuid, String) {
    let uid = uuid::Uuid::new_v4();
    let token = format!("tts_c4_video_{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now();
    let email = format!("c4-video-{uid}@example.com");
    crate::db::insert_user(
        pool,
        uid,
        &email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
    crate::db::insert_session(pool, &token, uid)
        .await
        .expect("insert_session");
    (uid, token)
}

async fn seed_ready_media_asset(pool: &sqlx::PgPool, owner_user_id: uuid::Uuid) -> uuid::Uuid {
    let id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO community_media_assets (
            id, owner_user_id, object_key, content_type, byte_length, part_size_bytes, part_count,
            state, playback_url, playback_manifest_json
        ) VALUES ($1, $2, $3, 'video/mp4', 2246, 8388608, 1, 'ready', $4, NULL)"#,
    )
    .bind(id)
    .bind(owner_user_id)
    .bind(format!("community/media/{id}.mp4"))
    .bind(format!("https://cdn-staging.example.test/playback/{id}.mp4"))
    .execute(pool)
    .await
    .expect("insert community_media_assets");
    id
}

async fn seed_pending_media_asset(pool: &sqlx::PgPool, owner_user_id: uuid::Uuid) -> uuid::Uuid {
    let id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO community_media_assets (
            id, owner_user_id, object_key, content_type, byte_length, part_size_bytes, part_count,
            state, s3_multipart_upload_id
        ) VALUES ($1, $2, $3, 'video/mp4', 2246, 8388608, 1, 'pending_upload', 'upload-test-id')"#,
    )
    .bind(id)
    .bind(owner_user_id)
    .bind(format!("community/media/{id}.mp4"))
    .execute(pool)
    .await
    .expect("insert pending community_media_assets");
    id
}

async fn create_video_post_with_asset(
    app: &axum::Router,
    token: &str,
    asset_id: uuid::Uuid,
    body: &str,
) -> uuid::Uuid {
    let body_json = serde_json::json!({
        "body": body,
        "post_type": "video",
        "media_asset_id": asset_id.to_string(),
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_json.to_string()))
                .unwrap(),
        )
        .await
        .expect("create video post");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    v["id"].as_str().unwrap().parse().expect("post id uuid")
}

fn find_post_row<'a>(posts: &'a serde_json::Value, post_id: &str) -> &'a serde_json::Value {
    posts
        .as_array()
        .expect("posts array")
        .iter()
        .find(|p| p["id"].as_str() == Some(post_id))
        .expect("post row in list")
}

#[tokio::test]
async fn matrix_93_d_com_c4_video_post_feed_profile_playback_url_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c4 video feed/profile (DATABASE_URL unset)");
        return;
    };
    let _env = crate::test_env_serial::lock();
    let _serial = db_it_lock().lock().await;
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (uid, token) = seed_user_example_com(&pool).await;
    let asset_id = seed_ready_media_asset(&pool, uid).await;
    let playback = format!("https://cdn-staging.example.test/playback/{asset_id}.mp4");
    let app = app_with_pool(pool.clone());
    let marker = format!("c4-video-playback-probe-{asset_id}");
    let post_id = create_video_post_with_asset(&app, &token, asset_id, &marker).await;

    let feed = app
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
    let fj = response_json(feed).await;
    assert_eq!(fj["status"].as_str(), Some("ok"));
    let feed_row = find_post_row(&fj["posts"], &post_id.to_string());
    assert_eq!(feed_row["post_type"].as_str(), Some("video"));
    assert_eq!(
        feed_row["primary_media_asset_id"].as_str(),
        Some(asset_id.to_string().as_str())
    );
    let media_urls = feed_row["media_urls"].as_array().expect("media_urls");
    assert!(
        media_urls
            .iter()
            .any(|u| u.as_str() == Some(playback.as_str())),
        "feed media_urls must include playback_url: {media_urls:?}"
    );

    let me = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/posts?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("me/posts");
    let mj = response_json(me).await;
    let me_row = find_post_row(&mj["posts"], &post_id.to_string());
    assert_eq!(me_row["post_type"].as_str(), Some("video"));
    assert_eq!(
        me_row["primary_media_asset_id"].as_str(),
        Some(asset_id.to_string().as_str())
    );

    let profile = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/users/{uid}/posts?limit=20"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("users/posts");
    let pj = response_json(profile).await;
    let profile_row = find_post_row(&pj["posts"], &post_id.to_string());
    assert_eq!(profile_row["post_type"].as_str(), Some("video"));
    assert!(
        profile_row["media_urls"]
            .as_array()
            .map(|a| !a.is_empty())
            .unwrap_or(false),
        "profile media_urls must be non-empty"
    );

    cleanup_user_posts_and_media(&pool, uid).await;
    if let Some(v) = prev {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v);
    } else {
        std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE");
    }
}

#[tokio::test]
async fn matrix_93_d_com_c4_media_asset_not_ready_rejects_post_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c4 not_ready gate (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_example_com(&pool).await;
    let asset_id = seed_pending_media_asset(&pool, uid).await;
    let app = app_with_pool(pool.clone());

    let body_json = serde_json::json!({
        "body": "c4 pending asset probe",
        "post_type": "video",
        "media_asset_id": asset_id.to_string(),
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_json.to_string()))
                .unwrap(),
        )
        .await
        .expect("post with pending asset");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    assert_eq!(v["status"].as_str(), Some("error"));
    assert_eq!(v["error"].as_str(), Some("media_asset_not_ready"));

    cleanup_user_posts_and_media(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c4_asset_status_hls_manifest_null_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c4 hls manifest null (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_example_com(&pool).await;
    let asset_id = seed_ready_media_asset(&pool, uid).await;
    let app = app_with_pool(pool.clone());

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/media-assets/{asset_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("asset status");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    assert_eq!(v["asset"]["state"].as_str(), Some("ready"));
    assert!(v["asset"]["playback_manifest_json"].is_null());
    assert!(
        v["asset"]["playback_url"]
            .as_str()
            .map(|s| !s.is_empty())
            .unwrap_or(false),
        "ready asset must expose playback_url"
    );

    cleanup_user_posts_and_media(&pool, uid).await;
}
