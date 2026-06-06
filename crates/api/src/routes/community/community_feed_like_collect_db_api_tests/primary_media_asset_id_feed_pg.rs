//! **`primary_media_asset_id`** on **Feed / detail** read paths (A1 · ① PG·IT).

use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

async fn cleanup_user_posts_and_media(pool: &sqlx::PgPool, user_id: uuid::Uuid) {
    let _ = sqlx::query("DELETE FROM community_media_assets WHERE owner_user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    cleanup_user_and_posts(pool, user_id).await;
}

async fn seed_ready_media_asset(pool: &sqlx::PgPool, owner_user_id: uuid::Uuid) -> uuid::Uuid {
    let id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO community_media_assets (
            id, owner_user_id, object_key, content_type, byte_length, part_size_bytes, part_count,
            state, playback_url
        ) VALUES ($1, $2, $3, 'video/mp4', 1024, 5242880, 1, 'ready', $4)"#,
    )
    .bind(id)
    .bind(owner_user_id)
    .bind(format!("community/media/{id}.mp4"))
    .bind(format!("https://cdn.example.test/playback/{id}.mp4"))
    .execute(pool)
    .await
    .expect("insert community_media_assets");
    id
}

async fn insert_video_post_with_primary_asset(
    pool: &sqlx::PgPool,
    user_id: uuid::Uuid,
    asset_id: uuid::Uuid,
    playback_url: &str,
    body: &str,
) -> uuid::Uuid {
    let post_id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO community_posts (
            id, user_id, body, post_type, tags, media_urls, primary_media_asset_id, visibility_status
        ) VALUES ($1, $2, $3, 'video', '{}', $4, $5, 'public')"#,
    )
    .bind(post_id)
    .bind(user_id)
    .bind(body)
    .bind(vec![playback_url.to_string()])
    .bind(asset_id)
    .execute(pool)
    .await
    .expect("insert community_posts video");
    post_id
}

#[tokio::test]
async fn matrix_93_d_com_primary_media_asset_id_null_on_text_post_feed_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: primary_media_asset_id null feed (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_user_one_post(&pool, "primary_media_asset_id null probe").await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    let row = fj["posts"]
        .as_array()
        .expect("posts")
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("feed row");
    assert!(row.get("primary_media_asset_id").is_some());
    assert!(row["primary_media_asset_id"].is_null());

    cleanup_user_posts_and_media(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_primary_media_asset_id_on_video_post_feed_and_detail_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: primary_media_asset_id video feed (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid, _token) = seed_user_with_session(&pool).await;
    let asset_id = seed_ready_media_asset(&pool, uid).await;
    let playback = format!("https://cdn.example.test/playback/{asset_id}.mp4");
    let post_id = insert_video_post_with_primary_asset(
        &pool,
        uid,
        asset_id,
        &playback,
        "video post primary_media_asset_id probe",
    )
    .await;
    let app = app_with_pool(pool.clone());

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
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    let feed_row = fj["posts"]
        .as_array()
        .expect("posts")
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("feed row");
    assert_eq!(
        feed_row["primary_media_asset_id"].as_str(),
        Some(asset_id.to_string().as_str())
    );

    let detail = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("detail");
    let detail_st = detail.status();
    let dj = response_json(detail).await;
    assert_eq!(detail_st, StatusCode::OK, "{:?}", dj);
    assert_eq!(
        dj["post"]["primary_media_asset_id"].as_str(),
        Some(asset_id.to_string().as_str())
    );

    cleanup_user_posts_and_media(&pool, uid).await;
}
