use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;
use uuid::Uuid;

use reqwest::Url;

use super::helpers::*;

#[tokio::test]
async fn f014_get_community_feed_lists_text_post_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f014_get_community_feed_lists_text_post_db_api (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) = setup_app_user_one_post(&pool, "f014 feed probe body").await;

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
        .expect("oneshot feed");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts array");
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(&post_id.to_string())),
        "feed should include created post id={post_id}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn f016_post_community_like_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f016_post_community_like_db_api (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, "f016 like probe").await;

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
        .expect("oneshot like");
    let like_st = like.status();
    let lj = response_json(like).await;
    assert_eq!(like_st, StatusCode::OK, "{:?}", lj);
    assert_eq!(lj["status"], "ok");
    assert_eq!(lj["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn f017_post_community_collect_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f017_post_community_collect_db_api (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, "f017 collect probe").await;

    let col = app
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
        .expect("oneshot collect");
    let col_st = col.status();
    let cj = response_json(col).await;
    assert_eq!(col_st, StatusCode::OK, "{:?}", cj);
    assert_eq!(cj["status"], "ok");
    assert_eq!(cj["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`GET /api/v1/community/feed`** **200**；列表含已发帖。
#[tokio::test]
async fn matrix_93_d_com_001_get_feed_includes_seeded_text_post() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001_get_feed_includes_seeded_text_post (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_user_one_post(&pool, "93 d-com-001 feed body").await;

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
        .expect("oneshot feed");
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

/// **93 · D-COM-001**（**cursor 分页**）→ **§8.2 · F-014**：**`GET …/community/feed?limit=1`** 取 **`next_cursor`** → 第二页 **`200`** 且含更旧帖。
#[tokio::test]
async fn matrix_93_d_com_001_f014_feed_cursor_second_page_includes_older_post_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001_f014_feed_cursor_second_page_includes_older_post_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid_a, token_a) = seed_user_with_session(&pool).await;
    let (uid_b, token_b) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());
    let tag = format!("m93cur{}", Uuid::new_v4().simple());
    let _post_older =
        create_text_post_tagged(&app, &token_a, "93 d-com-001 cursor older", Some(&tag)).await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    let post_newer =
        create_text_post_tagged(&app, &token_b, "93 d-com-001 cursor newer", Some(&tag)).await;

    let mut u1 = Url::parse("http://tt.internal").expect("static base url");
    u1.set_path("/api/v1/community/feed");
    u1.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag);
    let uri1 = format!("{}?{}", u1.path(), u1.query().expect("q1"));

    let page1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri1)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page1");
    let p1_st = page1.status();
    let p1j = response_json(page1).await;
    assert_eq!(p1_st, StatusCode::OK, "{:?}", p1j);
    assert_eq!(p1j["status"], "ok");
    let posts1 = p1j["posts"].as_array().expect("posts page1");
    assert_eq!(posts1.len(), 1);
    let newer_s = post_newer.to_string();
    assert_eq!(posts1[0]["id"].as_str(), Some(newer_s.as_str()));
    let Some(next_c) = p1j["next_cursor"].as_str() else {
        panic!("expected next_cursor when limit=1 and at least two public posts exist");
    };
    let mut u = Url::parse("http://tt.internal").expect("static base url");
    u.set_path("/api/v1/community/feed");
    u.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag)
        .append_pair("cursor", next_c);
    let path_q = format!("{}?{}", u.path(), u.query().expect("query built"));

    let page2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(path_q)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page2");
    let p2_st = page2.status();
    let p2j = response_json(page2).await;
    assert_eq!(p2_st, StatusCode::OK, "{:?}", p2j);
    assert_eq!(p2j["status"], "ok");
    let posts2 = p2j["posts"].as_array().expect("posts page2");
    assert!(
        !posts2.is_empty(),
        "second page should include older public post(s)"
    );
    assert!(
        posts2
            .iter()
            .all(|p| p["id"].as_str() != Some(newer_s.as_str())),
        "cursor page must not repeat newest id"
    );

    cleanup_user_and_posts(&pool, uid_a).await;
    cleanup_user_and_posts(&pool, uid_b).await;
}

/// **93 · D-COM-001**（**cursor 分页**）→ **§8.2 · F-014**：同 **`matrix_93_d_com_001_f014_feed_cursor_second_page_includes_older_post_pg`**，**`router::app`**（**`IdempotencyCache` + merge 序**）。
#[tokio::test]
async fn matrix_93_d_com_001b_f014_feed_cursor_second_page_includes_older_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001b_f014_feed_cursor_second_page_includes_older_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };    let _serial = db_it_lock().lock().await;
    let (uid_a, token_a) = seed_user_with_session(&pool).await;
    let (uid_b, token_b) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let tag = format!("m93curb{}", Uuid::new_v4().simple());
    let _post_older =
        create_text_post_tagged(&app, &token_a, "93 d-com-001b cursor older", Some(&tag)).await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    let post_newer =
        create_text_post_tagged(&app, &token_b, "93 d-com-001b cursor newer", Some(&tag)).await;

    let mut u1 = Url::parse("http://tt.internal").expect("static base url");
    u1.set_path("/api/v1/community/feed");
    u1.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag);
    let uri1 = format!("{}?{}", u1.path(), u1.query().expect("q1"));

    let page1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri1)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page1 app_stack");
    let p1_st = page1.status();
    let p1j = response_json(page1).await;
    assert_eq!(p1_st, StatusCode::OK, "{:?}", p1j);
    assert_eq!(p1j["status"], "ok");
    let posts1 = p1j["posts"].as_array().expect("posts page1");
    assert_eq!(posts1.len(), 1);
    let newer_s = post_newer.to_string();
    assert_eq!(posts1[0]["id"].as_str(), Some(newer_s.as_str()));
    let Some(next_c) = p1j["next_cursor"].as_str() else {
        panic!("expected next_cursor when limit=1 and at least two public posts exist");
    };
    let mut u = Url::parse("http://tt.internal").expect("static base url");
    u.set_path("/api/v1/community/feed");
    u.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag)
        .append_pair("cursor", next_c);
    let path_q = format!("{}?{}", u.path(), u.query().expect("query built"));

    let page2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(path_q)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page2 app_stack");
    let p2_st = page2.status();
    let p2j = response_json(page2).await;
    assert_eq!(p2_st, StatusCode::OK, "{:?}", p2j);
    assert_eq!(p2j["status"], "ok");
    let posts2 = p2j["posts"].as_array().expect("posts page2");
    assert!(
        !posts2.is_empty(),
        "second page should include older public post(s)"
    );
    assert!(
        posts2
            .iter()
            .all(|p| p["id"].as_str() != Some(newer_s.as_str())),
        "cursor page must not repeat newest id"
    );

    cleanup_user_and_posts(&pool, uid_a).await;
    cleanup_user_and_posts(&pool, uid_b).await;
}
