//! **`commerce_showcase_kind` / `commerce_market_listing_id`** on **Feed / detail** read paths (A1 · ① PG·IT).

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::*;

async fn cleanup_posts_and_listing(pool: &sqlx::PgPool, uid: Uuid, listing_id: Uuid) {
    let _ = sqlx::query("DELETE FROM community_posts WHERE user_id = $1")
        .bind(uid)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listings WHERE id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
}

async fn insert_market_listing(
    pool: &sqlx::PgPool,
    id: Uuid,
    owner_user_id: Uuid,
    now: chrono::DateTime<Utc>,
) {
    sqlx::query(
        r#"INSERT INTO market_listings (id, variant, owner_user_id, payload, status, created_at, updated_at)
           VALUES ($1, 'provider', $2, '{}'::jsonb, 'published', $3, $3)"#,
    )
    .bind(id)
    .bind(owner_user_id)
    .bind(now)
    .execute(pool)
    .await
    .expect("insert market_listings");
}

#[tokio::test]
async fn matrix_93_d_com_commerce_fields_on_feed_and_detail_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: commerce feed/detail read (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let (uid, token) = seed_user_with_session(&pool).await;
    cleanup_posts_and_listing(&pool, uid, listing_id).await;
    insert_market_listing(&pool, listing_id, uid, now).await;

    let app = app_with_pool(pool.clone());
    let body = serde_json::json!({
        "body": "commerce read path probe",
        "post_type": "text",
        "commerce_showcase_kind": "general_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("create post");
    assert_eq!(res.status(), StatusCode::OK);
    let created = response_json(res).await;
    assert_eq!(created["status"], "ok");
    assert_eq!(created["commerce_showcase_kind"], "general_led");
    assert_eq!(
        created["commerce_market_listing_id"].as_str(),
        Some(listing_id.to_string().as_str())
    );
    let post_id: Uuid = created["id"].as_str().unwrap().parse().unwrap();

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
    assert_eq!(fj["status"], "ok");
    let feed_row = fj["posts"]
        .as_array()
        .expect("posts")
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("feed row");
    assert_eq!(feed_row["commerce_showcase_kind"], "general_led");
    assert_eq!(
        feed_row["commerce_market_listing_id"].as_str(),
        Some(listing_id.to_string().as_str())
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
    let dj = response_json(detail).await;
    assert_eq!(dj["status"], "ok");
    assert_eq!(dj["post"]["commerce_showcase_kind"], "general_led");
    assert_eq!(
        dj["post"]["commerce_market_listing_id"].as_str(),
        Some(listing_id.to_string().as_str())
    );

    cleanup_posts_and_listing(&pool, uid, listing_id).await;
    cleanup_user_and_posts(&pool, uid).await;
}
