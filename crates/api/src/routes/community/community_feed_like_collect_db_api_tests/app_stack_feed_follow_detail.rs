use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::insert_follow;

use super::helpers::*;

/// **93 · D-COM-001** → **§8.2 · F-014**：**`GET …/community/feed?tag=`** **200** 且 **`posts`** **含** **带** **`tags[]`** **的帖**（**`router::app`**；与 **`001`/`001b`** **无** **`tag` 单列过滤** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let tag = format!("m93f014{}", Uuid::new_v4().simple());
    let body = "93 d-com-001c app_stack feed tag filter body";
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let post_id = create_text_post_tagged(&app, &token, body, Some(&tag)).await;

    let feed_uri = format!("/api/v1/community/feed?limit=50&tag={tag}");

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&feed_uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed tag filter app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(&post_id.to_string())),
        "feed tag={tag} should include post id={post_id}: {posts:?}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**匿名** **`GET …/community/feed?mode=hot&limit=50`** **200** **`posts`** **含** **Bearer** **发帖** **种子** **`id`**（**`router::app`**；与 **`recommend` 默认** **`001_f014_*`** **互补**）。**`tag=`** 隔离共享 PG 下高互动历史帖，避免 **`limit=50`** 热榜不含 **0 互动** 新帖的偶发失败。
#[tokio::test]
async fn matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let tag = format!("m93hot{}", Uuid::new_v4().simple());
    let body = "93 d-com-001e app_stack feed mode=hot body";
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let post_id = create_text_post_tagged(&app, &token, body, Some(&tag)).await;

    let feed_uri = format!("/api/v1/community/feed?mode=hot&limit=50&tag={tag}");

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&feed_uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed hot app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(&post_id.to_string())),
        "hot feed tag={tag} should include seeded post id={post_id}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**Bearer** **`GET …/community/feed?mode=follow&limit=20`** **200** **`status=ok`** **`posts`** **为数组**（**`router::app`**；与 **匿名** **`001e_*` `mode=hot`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001f_f014_bearer_get_feed_follow_mode_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001f_f014_bearer_get_feed_follow_mode_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-001f app_stack follow feed body";
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let _post_id = create_text_post(&app, &token, body).await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?mode=follow&limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follow app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let _posts = fj["posts"].as_array().expect("posts array");

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`insert_follow(follower→author)`** **后** **关注者 Bearer** **`GET …/community/feed?mode=follow`** **`posts`** **含** **作者** **`POST …/posts`** **新帖** **`id`**（**`router::app`**；与 **`001f_*` 仅形状** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001g_f014_bearer_follow_feed_includes_followed_author_post_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001g_f014_bearer_follow_feed_includes_followed_author_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;

    let (follower_id, follower_token) = seed_user_with_session(&pool).await;
    let (author_id, author_token) = seed_user_with_session(&pool).await;
    insert_follow(&pool, follower_id, author_id)
        .await
        .expect("insert_follow follower->author");

    let app = app_stack_feed_pool(pool.clone());
    let body = "93 d-com-001g follow feed includes author post";
    let post_id = create_text_post(&app, &author_token, body).await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?mode=follow&limit=30")
                .header(header::AUTHORIZATION, auth_bearer(&follower_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follow 001g");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "follow feed should include followed author's post id={want} posts={posts:?}"
    );

    cleanup_user_and_posts(&pool, author_id).await;
    cleanup_user_and_posts(&pool, follower_id).await;
}

/// **93 · D-COM-002** → **§8.2 · F-015**：**`POST …/posts`→`GET …/posts/:id`**（**`router::app`**；与 **`matrix_93_d_com_002_post_then_get_post_detail_matches`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-002 app_stack detail body";
    let (app, uid, post_id, token) = setup_app_stack_user_one_post(&pool, body).await;

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
        .expect("oneshot get post app_stack");
    let get_st = get.status();
    let gj = response_json(get).await;
    assert_eq!(get_st, StatusCode::OK, "{:?}", gj);
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"].as_str(), Some(body));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-002** → **§8.2 · F-015**：**Bearer** **发帖** 后 **无** **`Authorization`** **`GET …/posts/:id`** **公开帖** **200**（**`router::app`**；**`liked_by_me`** **缺省** **≠** **403**）。
#[tokio::test]
async fn matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-002b app_stack anon detail body";
    let (app, uid, post_id, _token) = setup_app_stack_user_one_post(&pool, body).await;

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
        .expect("oneshot get post unauthenticated app_stack");
    let get_st = get.status();
    let gj = response_json(get).await;
    assert_eq!(get_st, StatusCode::OK, "{:?}", gj);
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"].as_str(), Some(body));
    assert!(
        gj["post"].get("liked_by_me").is_none(),
        "anonymous detail must omit liked_by_me"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 幂等（**`router::app`**；与 **`matrix_93_d_com_003_post_like_twice_idempotent`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003 app_stack like body").await;

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
        .expect("like1 app_stack");
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
        .expect("like2 app_stack");
    let st2 = like2.status();
    let j2 = response_json(like2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}
