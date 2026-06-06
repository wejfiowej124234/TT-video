use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;

/// **93 · D-COM-001 + D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 后 **`GET …/feed`**（**Bearer**）对应帖 **`collected_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008e_f017_get_feed_post_collected_by_me_true_after_collect_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008e_f017_get_feed_post_collected_by_me_true_after_collect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008e app_stack feed collected_by_me body")
            .await;

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
        .expect("collect before feed app_stack");
    assert_eq!(c.status(), StatusCode::OK);

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
        .expect("get feed after collect app_stack");
    assert_eq!(feed.status(), StatusCode::OK);
    let fj = response_json(feed).await;
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    let row = posts
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("post in feed");
    assert_eq!(row["collected_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**Bearer** **`POST …/collect`** 后 **无身份头** **`GET …/posts/:id`**：**`collect_count`≥1** 且 **无** **`collected_by_me`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008f_f017_collect_then_get_detail_unauthenticated_collect_count_ok_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008f_f017_collect_then_get_detail_unauthenticated_collect_count_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_stack_user_one_post(
        &pool,
        "93 d-com-008f app_stack collect_count anon detail body",
    )
    .await;

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
        .expect("collect before anon detail app_stack");
    assert_eq!(c.status(), StatusCode::OK);

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
        .expect("get post unauthenticated after collect app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["post"]["id"], post_id.to_string());
    let cc = gj["post"]["collect_count"].as_i64().unwrap_or(0);
    assert!(cc >= 1, "collect_count should reflect collect; got {cc}");
    assert!(
        gj["post"].get("collected_by_me").is_none(),
        "anonymous viewer must not receive collected_by_me"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/collects`** → **§8.2 · F-019**：**`POST …/collect`** → **`DELETE …/collect`** → **`GET …/me/collects`** **不含** **`post_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009e_f019_get_me_collects_excludes_post_after_uncollect_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009e_f019_get_me_collects_excludes_post_after_uncollect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_stack_user_one_post(
        &pool,
        "93 d-com-009e app_stack me collects after uncollect body",
    )
    .await;

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
        .expect("collect before uncollect me_collects app_stack");
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
        .expect("delete collect me_collects app_stack");
    assert_eq!(del.status(), StatusCode::OK);

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
        .expect("get me collects after uncollect app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let collects = lj["collects"].as_array().expect("collects");
    assert!(!collects
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/likes`** → **§8.2 · F-019**：**Bearer** **从未点赞** **`GET …/me/likes`** **`likes`=[]**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009g_f019_get_me_likes_empty_list_ok_bearer_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009g_f019_get_me_likes_empty_list_ok_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, _post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009g empty me likes body").await;

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
        .expect("get me likes empty app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let likes = lj["likes"].as_array().expect("likes");
    assert!(
        likes.is_empty(),
        "expected empty likes list before any like; got {likes:?}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}
