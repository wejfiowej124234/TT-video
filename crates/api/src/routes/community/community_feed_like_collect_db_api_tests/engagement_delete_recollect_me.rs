use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** → **`DELETE …/like`** → 再 **`POST …/like`** **`created:true`**（**`router::app`**；**`DELETE …/like`** 主栈正路径）。
#[tokio::test]
async fn matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003b app_stack like delete body").await;

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
        .expect("like post app_stack");
    assert_eq!(like1.status(), StatusCode::OK);
    let j1 = response_json(like1).await;
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

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
        .expect("like post after delete app_stack");
    assert_eq!(like2.status(), StatusCode::OK);
    let j2 = response_json(like2).await;
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** → **`DELETE …/collect`** → 再 **`POST …/collect`** **`created:true`**（**`router::app`**；**`DELETE …/collect`** 主栈正路径）。
#[tokio::test]
async fn matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008b app_stack collect delete body").await;

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
        .expect("collect post app_stack");
    assert_eq!(c1.status(), StatusCode::OK);
    let j1 = response_json(c1).await;
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

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
        .expect("collect post after delete app_stack");
    assert_eq!(c2.status(), StatusCode::OK);
    let j2 = response_json(c2).await;
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/collects`** → **§8.2 · F-019**：收藏后 **`GET /api/v1/community/me/collects`** 列表含 **`post_id`**（**`router::app`**；与 **`matrix_93_d_com_009_get_me_posts_lists_own_post`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_009b_f019_get_me_collects_includes_post_after_collect_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009b_f019_get_me_collects_includes_post_after_collect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009b app_stack me collects body").await;

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
        .expect("collect for me_collects app_stack");
    assert_eq!(c.status(), StatusCode::OK);
    let cj = response_json(c).await;
    assert_eq!(cj["status"], "ok");
    assert_eq!(cj["created"], true);

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/collects?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me collects app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let collects = lj["collects"].as_array().expect("collects");
    assert!(collects
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}
