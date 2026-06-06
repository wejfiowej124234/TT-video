use axum::body::Body;
use axum::http::{header, HeaderValue, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_follow, insert_session, insert_user};

use super::helpers::{
    app_with_pool, cleanup_admin_session_user, cleanup_community_user_listing,
    insert_market_listing, pool_or_skip, response_json, triple_lock,
};

/// **93 · D-COM-011** → **§8.2 · F-031**：**Bearer** **`POST …/community/posts`**（**`acquisition_led`**）→**`SELECT commerce_showcase_kind`/`commerce_market_listing_id`** **PG 行**→**匿名** **`GET …/community/feed?mode=hot`** **`posts[].id`**（**`router::app`**；与 **`011c_*`** **`recommend` 默认 Feed** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011d_f031_bearer_post_select_commerce_then_hot_feed_includes_post_app_stack_ok_pg(
) {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011d_f031_bearer_post_select_commerce_then_hot_feed_includes_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-011d-hot-{uid}@traveltrust.test");
    let session_token = format!("f031_011d_sess_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
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
        "body": "f031 011d commerce hot feed app stack",
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
        .expect("oneshot post bearer 011d");

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
    .expect("select commerce columns 011d");
    assert_eq!(row.0.as_deref(), Some("acquisition_led"));
    assert_eq!(row.1, Some(listing_id));

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?mode=hot&limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed hot anon");
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
        "hot feed should include acquisition_led post id {want}"
    );

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**Bearer** **`POST …/community/posts`**（**`acquisition_led`**）后 **同 Bearer** **`GET …/community/feed?mode=follow&limit=50`** **200** **`status=ok`** **`posts`** **数组**（**`router::app`**；无 **`community_follows`** 时 **可空**；与 **`011d_*` `mode=hot` 匿名** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011e_f031_bearer_post_then_bearer_follow_feed_ok_shape_app_stack_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011e_f031_bearer_post_then_bearer_follow_feed_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-011e-follow-{uid}@traveltrust.test");
    let session_token = format!("f031_011e_sess_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
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
        "body": "f031 011e bearer follow feed app stack",
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
        .expect("oneshot post bearer 011e");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?mode=follow&limit=50")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follow bearer");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let _posts = feed_j["posts"].as_array().expect("posts array");

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**`insert_follow(follower→author)`** **后** **作者 Bearer** **`POST …/community/posts`**（**`acquisition_led`**）→**关注者 Bearer** **`GET …/community/feed?mode=follow`** **`posts`** **含** **该帖** **`id`**（**`router::app`**；与 **`011e_*` 同用户形状** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011f_f031_follower_get_follow_feed_includes_author_acquisition_post_app_stack_ok_pg(
) {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011f_f031_follower_get_follow_feed_includes_author_acquisition_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let follower_id = Uuid::new_v4();
    let author_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let follower_email = format!("f031-011f-flw-{follower_id}@traveltrust.test");
    let follower_sess = format!("f031_011f_flw_{}", Uuid::new_v4());
    let author_email = format!("f031-011f-auth-{author_id}@traveltrust.test");
    let author_sess = format!("f031_011f_auth_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, author_id, listing_id).await;
    cleanup_admin_session_user(&pool, follower_id).await;

    insert_user(
        &pool,
        author_id,
        &author_email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user author 011f");
    insert_session(&pool, &author_sess, author_id)
        .await
        .expect("insert_session author");
    insert_market_listing(
        &pool,
        listing_id,
        "acquisition",
        author_id,
        "published",
        now,
    )
    .await;

    insert_user(
        &pool,
        follower_id,
        &follower_email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user follower 011f");
    insert_session(&pool, &follower_sess, follower_id)
        .await
        .expect("insert_session follower");

    insert_follow(&pool, follower_id, author_id)
        .await
        .expect("insert_follow 011f");

    let router = app_with_pool(pool.clone());
    let auth_author = format!("Bearer {}", author_sess);
    let body = json!({
        "body": "f031 011f acquisition post for follow feed",
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
                    HeaderValue::from_str(&auth_author).expect("auth author"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post author 011f");
    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let auth_follower = format!("Bearer {}", follower_sess);
    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?mode=follow&limit=50")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth_follower).expect("auth follower"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follower 011f");
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
        "follower follow feed should include author acquisition post id={want}"
    );

    cleanup_community_user_listing(&pool, author_id, listing_id).await;
    cleanup_admin_session_user(&pool, follower_id).await;
}
