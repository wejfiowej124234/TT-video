use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 后 **`GET …/posts/:id`** **`post.liked_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003d_f016_get_post_detail_liked_by_me_true_after_like_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003d_f016_get_post_detail_liked_by_me_true_after_like_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003d app_stack liked_by_me body").await;

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
        .expect("like for detail app_stack");
    assert_eq!(like.status(), StatusCode::OK);

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
        .expect("get post detail app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["liked_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 后 **`GET …/posts/:id`** **`post.collected_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008c_f017_get_post_detail_collected_by_me_true_after_collect_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008c_f017_get_post_detail_collected_by_me_true_after_collect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008c app_stack collected_by_me body").await;

    let c = app
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
        .expect("collect for detail app_stack");
    assert_eq!(c.status(), StatusCode::OK);

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
        .expect("get post detail collect app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["collected_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/likes`** → **§8.2 · F-019**：点赞后 **`GET /api/v1/community/me/likes`** 列表含 **`post_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009c_f019_get_me_likes_includes_post_after_like_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009c_f019_get_me_likes_includes_post_after_like_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009c app_stack me likes body").await;

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
        .expect("like for me_likes app_stack");
    assert_eq!(like.status(), StatusCode::OK);
    let lj0 = response_json(like).await;
    assert_eq!(lj0["status"], "ok");
    assert_eq!(lj0["created"], true);

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/likes?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me likes app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let likes = lj["likes"].as_array().expect("likes");
    assert!(likes
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}
