//! Phase ② · **C5** 图片媒体交付 PG·IT（upload · Cache-Control · 多图读路径 · Explore/Feed）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::*;
use super::upload_media_pg::{post_upload, try_remove_uploaded_file, TINY_PNG_DATA_URL};

async fn get_upload_response(app: &axum::Router, name: &str) -> axum::response::Response {
    app.clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/uploads/community-posts/{name}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get upload")
}

async fn seed_user_example_com(pool: &sqlx::PgPool) -> (uuid::Uuid, String) {
    let uid = uuid::Uuid::new_v4();
    let token = format!("tts_c5_image_{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now();
    let email = format!("c5-image-{uid}@example.com");
    crate::db::insert_user(
        pool,
        uid,
        &email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
    crate::db::insert_session(pool, &token, uid)
        .await
        .expect("insert_session");
    (uid, token)
}

async fn create_photo_post(
    app: &axum::Router,
    token: &str,
    urls: &[String],
    cover: Option<&str>,
    body: &str,
) -> uuid::Uuid {
    let mut body_json = serde_json::json!({
        "body": body,
        "post_type": "photo",
        "media_urls": urls,
    });
    if let Some(c) = cover {
        body_json["cover_url"] = serde_json::json!(c);
    }
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_json.to_string()))
                .unwrap(),
        )
        .await
        .expect("create photo post");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    v["id"].as_str().unwrap().parse().expect("post id uuid")
}

fn find_post_row<'a>(posts: &'a serde_json::Value, post_id: &str) -> &'a serde_json::Value {
    posts
        .as_array()
        .expect("posts array")
        .iter()
        .find(|p| p["id"].as_str() == Some(post_id))
        .expect("post row in list")
}

#[tokio::test]
async fn matrix_93_d_com_c5_serve_upload_cache_control_immutable_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c5 cache-control (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st, j) = post_upload(&app, Some(&token), TINY_PNG_DATA_URL).await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    let url = j["url"].as_str().expect("url");
    let name = url.rsplit('/').next().expect("filename");
    let res = get_upload_response(&app, name).await;
    assert_eq!(res.status(), StatusCode::OK);
    let cc = res
        .headers()
        .get(header::CACHE_CONTROL)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    assert!(
        cc.contains("immutable") && cc.contains("max-age=86400"),
        "expected staging cache policy, got {cc:?}"
    );
    let ct = res
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    assert!(ct.starts_with("image/"), "expected image content-type, got {ct:?}");

    try_remove_uploaded_file(url);
    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_c5_multi_image_feed_profile_explore_read_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c5 multi-image surfaces (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (uid, token) = seed_user_example_com(&pool).await;
    let app = app_with_pool(pool.clone());

    let (st_a, ja) = post_upload(&app, Some(&token), TINY_PNG_DATA_URL).await;
    assert_eq!(st_a, StatusCode::OK, "{:?}", ja);
    let url_a = ja["url"].as_str().expect("url_a").to_string();
    let (st_b, jb) = post_upload(&app, Some(&token), TINY_PNG_DATA_URL).await;
    assert_eq!(st_b, StatusCode::OK, "{:?}", jb);
    let url_b = jb["url"].as_str().expect("url_b").to_string();

    let marker = format!("c5-multi-image-probe-{}", uuid::Uuid::new_v4());
    let post_id = create_photo_post(
        &app,
        &token,
        &[url_a.clone(), url_b.clone()],
        Some(&url_a),
        &marker,
    )
    .await;

    for surface in [
        "/api/v1/community/feed?limit=50",
        "/api/v1/community/feed?limit=50&mode=recommend",
    ] {
        let feed = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::GET)
                    .uri(surface)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("feed");
        let fj = response_json(feed).await;
        let row = find_post_row(&fj["posts"], &post_id.to_string());
        assert_eq!(row["post_type"].as_str(), Some("photo"));
        let urls = row["media_urls"].as_array().expect("media_urls");
        assert_eq!(urls.len(), 2);
        assert_eq!(row["cover_url"].as_str(), Some(url_a.as_str()));
    }

    let me = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/posts?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("me/posts");
    let mj = response_json(me).await;
    let me_row = find_post_row(&mj["posts"], &post_id.to_string());
    assert!(me_row["media_urls"].as_array().map(|a| a.len()).unwrap_or(0) >= 2);

    let profile = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/users/{uid}/posts?limit=20"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("users/posts");
    let pj = response_json(profile).await;
    let profile_row = find_post_row(&pj["posts"], &post_id.to_string());
    assert_eq!(profile_row["cover_url"].as_str(), Some(url_a.as_str()));

    let detail = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("detail");
    let dj = response_json(detail).await;
    assert_eq!(
        dj["post"]["media_urls"].as_array().map(|a| a.len()),
        Some(2)
    );

    try_remove_uploaded_file(&url_a);
    try_remove_uploaded_file(&url_b);
    cleanup_user_and_posts(&pool, uid).await;
    if let Some(v) = prev {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v);
    } else {
        std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE");
    }
}

#[tokio::test]
async fn matrix_93_d_com_c5_c2_fake_mime_still_blocked_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c5 c2 gate (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());

    let fake = "data:image/png;base64,/9j/4AAQSkZJRg==";
    let (st, j) = post_upload(&app, Some(&token), fake).await;
    assert_eq!(st, StatusCode::BAD_REQUEST, "{:?}", j);
    assert_eq!(j["error"].as_str(), Some("mime_body_mismatch"));

    cleanup_user_and_posts(&pool, uid).await;
}
