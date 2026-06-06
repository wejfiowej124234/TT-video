//! **C3 · 举报→审核→下架 · PG·IT**（Admin 队列 · content_remove · Feed/Profile 隐藏）

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::*;

async fn cleanup_moderation_flow(
    pool: &sqlx::PgPool,
    user_ids: &[Uuid],
    post_ids: &[Uuid],
    report_ids: &[Uuid],
) {
    if !report_ids.is_empty() {
        let _ = sqlx::query("DELETE FROM community_moderation_cases WHERE report_id = ANY($1)")
            .bind(report_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_penalties WHERE report_id = ANY($1)")
            .bind(report_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_reports WHERE id = ANY($1)")
            .bind(report_ids)
            .execute(pool)
            .await;
    }
    if !post_ids.is_empty() {
        let _ = sqlx::query("DELETE FROM community_likes WHERE post_id = ANY($1)")
            .bind(post_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_posts WHERE id = ANY($1)")
            .bind(post_ids)
            .execute(pool)
            .await;
    }
    for uid in user_ids {
        cleanup_user_and_posts(pool, *uid).await;
    }
}

async fn seed_admin_session(pool: &sqlx::PgPool) -> (Uuid, String) {
    use chrono::Utc;
    use crate::db::{insert_session, insert_user};
    let uid = Uuid::new_v4();
    let token = format!("tts_c3_admin_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("c3-admin-{uid}@traveltrust.test");
    insert_user(
        pool, uid, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert admin");
    insert_session(pool, &token, uid)
        .await
        .expect("admin session");
    (uid, token)
}

async fn seed_production_post(pool: &sqlx::PgPool, author_id: Uuid, body: &str) -> Uuid {
    use crate::db::insert_post;
    insert_post(
        pool,
        author_id,
        body,
        "text",
        None,
        &[],
        &[],
        None,
        None,
        "production",
    )
    .await
    .expect("insert production post")
}

async fn post_report(app: &axum::Router, token: &str, post_id: Uuid) -> (Uuid, i32) {
    let body = json!({
        "target_type": "post",
        "target_id": post_id.to_string(),
        "reason_code": "spam",
        "details": "c3 moderation it",
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/reports")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("post report");
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    let rid = Uuid::parse_str(j["id"].as_str().expect("report id")).expect("uuid");
    (rid, 1)
}

async fn admin_list_reports(app: &axum::Router, admin_token: &str, report_id: Uuid) {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/community/reports?status=open&limit=50")
                .header(header::AUTHORIZATION, auth_bearer(admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("admin list reports");
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    let items = j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|r| r["id"].as_str() == Some(report_id.to_string().as_str())),
        "report not in admin queue: {j:?}"
    );
}

async fn admin_content_remove(
    app: &axum::Router,
    admin_token: &str,
    report_id: Uuid,
    expected_version: i32,
) {
    let body = json!({
        "expected_version": expected_version,
        "status": "resolved",
        "admin_notes": "c3 content_remove",
        "disposition": "content_removed",
        "record_penalty": { "action": "content_remove" },
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/admin/community/moderation/{report_id}"))
                .header(header::AUTHORIZATION, auth_bearer(admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("admin patch moderation");
    assert_eq!(res.status(), StatusCode::OK, "{:?}", response_json(res).await);
}

async fn feed_contains_post(app: &axum::Router, post_id: Uuid) -> bool {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("feed");
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    j["posts"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .any(|p| p["id"].as_str() == Some(post_id.to_string().as_str()))
}

async fn public_profile_contains_post(app: &axum::Router, author_id: Uuid, post_id: Uuid) -> bool {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/community/users/{author_id}/posts?limit=20"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("user posts");
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    j["posts"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .any(|p| p["id"].as_str() == Some(post_id.to_string().as_str()))
}

async fn anon_post_detail_visible(app: &axum::Router, post_id: Uuid) -> bool {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("post detail");
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    j.get("post").and_then(|p| p.as_object()).is_some()
}

#[tokio::test]
async fn matrix_93_d_com_c3_report_admin_queue_lists_open_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c3 admin queue (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (admin_id, admin_token) = seed_admin_session(&pool).await;
    let (author_id, _author_token) = seed_user_with_session(&pool).await;
    let (reporter_id, reporter_token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let marker = format!("c3-queue-{}", Uuid::new_v4());
    let post_id = seed_production_post(&pool, author_id, &marker).await;
    let (report_id, _ver) = post_report(&app, &reporter_token, post_id).await;
    admin_list_reports(&app, &admin_token, report_id).await;
    cleanup_moderation_flow(
        &pool,
        &[admin_id, author_id, reporter_id],
        &[post_id],
        &[report_id],
    )
    .await;
}

#[tokio::test]
async fn matrix_93_d_com_c3_content_remove_hides_from_public_surfaces_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: c3 content_remove (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (admin_id, admin_token) = seed_admin_session(&pool).await;
    let (author_id, author_token) = seed_user_with_session(&pool).await;
    let (reporter_id, reporter_token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let marker = format!("c3-takedown-{}", Uuid::new_v4());
    let post_id = seed_production_post(&pool, author_id, &marker).await;

    assert!(feed_contains_post(&app, post_id).await);
    assert!(public_profile_contains_post(&app, author_id, post_id).await);
    assert!(anon_post_detail_visible(&app, post_id).await);

    let (report_id, ver) = post_report(&app, &reporter_token, post_id).await;
    admin_content_remove(&app, &admin_token, report_id, ver).await;

    assert!(
        !feed_contains_post(&app, post_id).await,
        "post still in feed after content_remove"
    );
    assert!(
        !public_profile_contains_post(&app, author_id, post_id).await,
        "post still on public profile"
    );
    assert!(
        !anon_post_detail_visible(&app, post_id).await,
        "anon post detail still visible"
    );

    let vis: String =
        sqlx::query_scalar("SELECT visibility_status FROM community_posts WHERE id = $1")
            .bind(post_id)
            .fetch_one(&pool)
            .await
            .expect("visibility");
    assert_eq!(vis, "archived");

    let me_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/posts?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&author_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("me posts");
    assert_eq!(me_res.status(), StatusCode::OK);
    let me_j = response_json(me_res).await;
    assert!(
        me_j["posts"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .any(|p| p["id"].as_str() == Some(post_id.to_string().as_str())),
        "author should still see archived post in me/posts"
    );

    if let Some(v) = prev {
        std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v);
    } else {
        std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE");
    }
    cleanup_moderation_flow(
        &pool,
        &[admin_id, author_id, reporter_id],
        &[post_id],
        &[report_id],
    )
    .await;
}
