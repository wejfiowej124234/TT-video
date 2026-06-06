use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

/// **93 · D-COM-002** → **§8.2 · F-015**：**`POST …/posts`** + **`GET …/posts/:id`** **200**；正文一致。
#[tokio::test]
async fn matrix_93_d_com_002_post_then_get_post_detail_matches() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_002_post_then_get_post_detail_matches (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-002 detail body";
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, body).await;

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get post");
    let get_st = get.status();
    let gj = response_json(get).await;
    assert_eq!(get_st, StatusCode::OK, "{:?}", gj);
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"].as_str(), Some(body));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 首次 **`created: true`**；二次 **`created: false`**（幂等）。
#[tokio::test]
async fn matrix_93_d_com_003_post_like_twice_idempotent() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_003_post_like_twice_idempotent (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, "93 d-com-003 like body").await;

    let like1 = app
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
        .expect("like1");
    let st1 = like1.status();
    let j1 = response_json(like1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let like2 = app
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
        .expect("like2");
    let st2 = like2.status();
    let j2 = response_json(like2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 首次 **`created: true`**；二次 **`created: false`**。
#[tokio::test]
async fn matrix_93_d_com_008_post_collect_twice_idempotent() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_008_post_collect_twice_idempotent (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_user_one_post(&pool, "93 d-com-008 collect body").await;

    let c1 = app
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
        .expect("collect1");
    let st1 = c1.status();
    let j1 = response_json(c1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let c2 = app
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
        .expect("collect2");
    let st2 = c2.status();
    let j2 = response_json(c2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 幂等（**`router::app`**；与 **`matrix_93_d_com_008_post_collect_twice_idempotent`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008 app_stack collect body").await;

    let c1 = app
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
        .expect("collect1 app_stack");
    let st1 = c1.status();
    let j1 = response_json(c1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let c2 = app
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
        .expect("collect2 app_stack");
    let st2 = c2.status();
    let j2 = response_json(c2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`GET …/community/feed`**（**`router::app`**；与 **`community::router()`** **`matrix_93_d_com_001_get_feed_includes_seeded_text_post`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001_f014_get_feed_includes_seeded_text_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001_f014_get_feed_includes_seeded_text_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-001 app_stack feed body").await;

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
        .expect("oneshot feed app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(posts
        .iter()
        .any(|p| p["id"].as_str() == Some(&post_id.to_string())));

    cleanup_user_and_posts(&pool, uid).await;
}
