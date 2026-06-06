//! **A3 · ①**：点赞/收藏后 **Feed 与详情** **`like_count`/`collect_count`**、**`liked_by_me`/`collected_by_me`** 同源（**04**）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

async fn feed_row_for_post(
    app: &axum::Router,
    token: &str,
    post_id: uuid::Uuid,
) -> serde_json::Value {
    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=50")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed");
    assert_eq!(feed.status(), StatusCode::OK);
    let fj = response_json(feed).await;
    fj["posts"]
        .as_array()
        .expect("posts")
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .cloned()
        .expect("post in feed")
}

async fn detail_post_json(
    app: &axum::Router,
    token: &str,
    post_id: uuid::Uuid,
) -> serde_json::Value {
    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("detail");
    assert_eq!(get.status(), StatusCode::OK);
    let dj = response_json(get).await;
    assert_eq!(dj["status"], "ok");
    dj["post"].clone()
}

#[tokio::test]
async fn matrix_93_d_com_engagement_like_feed_detail_counts_aligned_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: engagement like feed/detail aligned (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "engagement like feed detail aligned").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like");
    assert_eq!(like.status(), StatusCode::OK);

    let feed_row = feed_row_for_post(&app, &token, post_id).await;
    let detail = detail_post_json(&app, &token, post_id).await;

    assert_eq!(feed_row["liked_by_me"], true);
    assert_eq!(detail["liked_by_me"], true);
    let feed_lc = feed_row["like_count"].as_i64().expect("feed like_count");
    let detail_lc = detail["like_count"].as_i64().expect("detail like_count");
    assert_eq!(feed_lc, detail_lc);
    assert!(feed_lc >= 1);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_engagement_collect_feed_detail_counts_aligned_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: engagement collect feed/detail aligned (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "engagement collect feed detail aligned").await;

    let collect = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect");
    assert_eq!(collect.status(), StatusCode::OK);

    let feed_row = feed_row_for_post(&app, &token, post_id).await;
    let detail = detail_post_json(&app, &token, post_id).await;

    assert_eq!(feed_row["collected_by_me"], true);
    assert_eq!(detail["collected_by_me"], true);
    let feed_cc = feed_row["collect_count"].as_i64().expect("feed collect_count");
    let detail_cc = detail["collect_count"].as_i64().expect("detail collect_count");
    assert_eq!(feed_cc, detail_cc);
    assert!(feed_cc >= 1);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_engagement_double_like_idempotent_feed_detail_counts_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: engagement double like idempotent (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "engagement double like idempotent").await;

    for _ in 0..2 {
        let like = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!("/api/v1/community/posts/{post_id}/like"))
                    .header(header::AUTHORIZATION, auth_bearer(&token))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("like");
        assert_eq!(like.status(), StatusCode::OK);
    };    let feed_row = feed_row_for_post(&app, &token, post_id).await;
    let detail = detail_post_json(&app, &token, post_id).await;
    let feed_lc = feed_row["like_count"].as_i64().expect("feed like_count");
    let detail_lc = detail["like_count"].as_i64().expect("detail like_count");
    assert_eq!(feed_lc, detail_lc);
    assert_eq!(feed_lc, 1, "idempotent like must not double-count");

    cleanup_user_and_posts(&pool, uid).await;
}
