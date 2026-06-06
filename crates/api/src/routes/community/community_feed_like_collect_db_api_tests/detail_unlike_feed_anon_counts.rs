use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** → **`DELETE …/like`** → **`GET …/posts/:id`** **`post.liked_by_me`** **`false`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003e_f016_get_post_detail_liked_by_me_false_after_unlike_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003e_f016_get_post_detail_liked_by_me_false_after_unlike_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003e app_stack unlike detail body").await;

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
        .expect("like before unlike app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete like app_stack");
    assert_eq!(del.status(), StatusCode::OK);
    let dj = response_json(del).await;
    assert_eq!(dj["status"], "ok");

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
        .expect("get post detail after unlike app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["liked_by_me"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** → **`DELETE …/collect`** → **`GET …/posts/:id`** **`post.collected_by_me`** **`false`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008d_f017_get_post_detail_collected_by_me_false_after_uncollect_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008d_f017_get_post_detail_collected_by_me_false_after_uncollect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008d app_stack uncollect detail body").await;

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
        .expect("collect before uncollect app_stack");
    assert_eq!(c.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete collect app_stack");
    assert_eq!(del.status(), StatusCode::OK);
    let dj = response_json(del).await;
    assert_eq!(dj["status"], "ok");

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
        .expect("get post detail after uncollect app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["collected_by_me"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/likes`** → **§8.2 · F-019**：**`POST …/like`** → **`DELETE …/like`** → **`GET …/me/likes`** **不含** **`post_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009d_f019_get_me_likes_excludes_post_after_unlike_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009d_f019_get_me_likes_excludes_post_after_unlike_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009d app_stack me likes after unlike body")
            .await;

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
        .expect("like before unlike me_likes app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete like me_likes app_stack");
    assert_eq!(del.status(), StatusCode::OK);

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
        .expect("get me likes after unlike app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let likes = lj["likes"].as_array().expect("likes");
    assert!(!likes
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001 + D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 后 **`GET …/feed`**（**Bearer**）对应帖 **`liked_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003f_f016_get_feed_post_liked_by_me_true_after_like_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003f_f016_get_feed_post_liked_by_me_true_after_like_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003f app_stack feed liked_by_me body").await;

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
        .expect("like before feed app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get feed after like app_stack");
    assert_eq!(feed.status(), StatusCode::OK);
    let fj = response_json(feed).await;
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    let row = posts
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("post in feed");
    assert_eq!(row["liked_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**Bearer** **`POST …/like`** 后 **无身份头** **`GET …/posts/:id`**：**`like_count`≥1** 且 **无** **`liked_by_me`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003g_f016_like_then_get_detail_unauthenticated_like_count_ok_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003g_f016_like_then_get_detail_unauthenticated_like_count_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003g anon like_count body").await;

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
        .expect("like before anon detail app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post unauthenticated after like app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["post"]["id"], post_id.to_string());
    let lc = gj["post"]["like_count"].as_i64().unwrap_or(0);
    assert!(lc >= 1, "like_count should reflect like; got {lc}");
    assert!(
        gj["post"].get("liked_by_me").is_none(),
        "anonymous viewer must not receive liked_by_me"
    );

    cleanup_user_and_posts(&pool, uid).await;
}
