use axum::body::Body;
use axum::http::{header, HeaderValue, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};

use super::helpers::{
    app_with_pool, cleanup_community_user_listing, insert_market_listing, pool_or_skip,
    response_json, triple_lock,
};

/// **F-031**：**`POST /api/v1/community/posts`** + **`commerce_showcase_kind`=`acquisition_led`** + **`commerce_market_listing_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-app-{uid}@traveltrust.test");

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let body = json!({
        "body": "f031 acquisition_led app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let row: (Option<String>, Option<Uuid>) = sqlx::query_as(
        "SELECT commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_one(&pool)
    .await
    .expect("select commerce columns");
    assert_eq!(row.0.as_deref(), Some("acquisition_led"));
    assert_eq!(row.1, Some(listing_id));

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**`POST …/community/posts`**（**`acquisition_led`**；**`Authorization: Bearer`** + **`sessions`**；**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_011b_f031_post_community_post_acquisition_led_listing_bearer_app_stack_ok_pg(
) {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011b_f031_post_community_post_acquisition_led_listing_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-bearer-{uid}@traveltrust.test");
    let session_token = format!("f031_bearer_sess_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "body": "f031 acquisition_led bearer app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let row: (Option<String>, Option<Uuid>) = sqlx::query_as(
        "SELECT commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_one(&pool)
    .await
    .expect("select commerce columns");
    assert_eq!(row.0.as_deref(), Some("acquisition_led"));
    assert_eq!(row.1, Some(listing_id));

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**`POST …/community/posts`**（**acquisition_led**）后 **`GET /api/v1/community/feed`** **200** 且 **`posts`** 含该帖 **`id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_011_f031_get_community_feed_includes_acquisition_led_post_after_create_pg()
{
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011_f031_get_community_feed_includes_acquisition_led_post_after_create_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-feed-{uid}@traveltrust.test");

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let body = json!({
        "body": "f031 feed readback app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let posts = feed_j["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "feed should include acquisition_led post id {want}"
    );

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**Bearer** **`POST …/community/posts`**（**`acquisition_led`**）后 **无身份头** **`GET …/community/feed`** **`posts[].id`** **含新帖**（**`router::app`**；与 **`x-user-id`** **`011_f031_*`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011c_f031_bearer_post_then_anon_feed_includes_post_app_stack_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011c_f031_bearer_post_then_anon_feed_includes_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-feed-bearer-{uid}@traveltrust.test");
    let session_token = format!("f031_feed_bearer_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "body": "f031 011c bearer then anon feed app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post bearer");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed anon");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let posts = feed_j["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "anon feed should include acquisition_led post id {want}"
    );

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}
