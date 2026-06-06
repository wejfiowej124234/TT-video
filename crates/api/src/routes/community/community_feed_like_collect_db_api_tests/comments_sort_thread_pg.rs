//! **`GET …/comments`** **`sort`** / 二级线程 / 游标闸（A2 · ① PG·IT）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::{Duration, Utc};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::*;

async fn cleanup_user_posts_comments(pool: &sqlx::PgPool, user_id: Uuid) {
    let _ = sqlx::query(
        "DELETE FROM community_comments WHERE post_id IN (SELECT id FROM community_posts WHERE user_id = $1)",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    cleanup_user_and_posts(pool, user_id).await;
}

async fn insert_comment_at(
    pool: &sqlx::PgPool,
    post_id: Uuid,
    user_id: Uuid,
    parent_id: Option<Uuid>,
    body: &str,
    created_at: chrono::DateTime<Utc>,
) -> Uuid {
    let id = Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO community_comments (id, post_id, user_id, parent_id, body, created_at, visibility_status, risk_level)
           VALUES ($1, $2, $3, $4, $5, $6, 'visible', 0)"#,
    )
    .bind(id)
    .bind(post_id)
    .bind(user_id)
    .bind(parent_id)
    .bind(body)
    .bind(created_at)
    .execute(pool)
    .await
    .expect("insert community_comments");
    id
}

async fn get_comments_json(
    app: &axum::Router,
    post_id: Uuid,
    query: &str,
) -> (StatusCode, serde_json::Value) {
    let uri = if query.is_empty() {
        format!("/api/v1/community/posts/{post_id}/comments")
    } else {
        format!("/api/v1/community/posts/{post_id}/comments?{query}")
    };
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get comments");
    let st = res.status();
    (st, response_json(res).await)
}

async fn post_comment_http(
    app: &axum::Router,
    token: &str,
    post_id: Uuid,
    body: &str,
    parent_id: Option<Uuid>,
) -> Uuid {
    let payload = json!({ "body": body, "parent_id": parent_id.map(|u| u.to_string()) });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/comments"))
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(payload.to_string()))
                .unwrap(),
        )
        .await
        .expect("post comment");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    v["id"].as_str().unwrap().parse().expect("comment id")
}

fn root_ids_in_order(comments: &[serde_json::Value]) -> Vec<String> {
    comments
        .iter()
        .filter(|c| c.get("parent_id").map_or(true, |p| p.is_null()))
        .map(|c| c["id"].as_str().unwrap().to_string())
        .collect()
}

#[tokio::test]
async fn matrix_93_d_com_comments_sort_latest_roots_newest_first_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: comments sort latest (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_user_one_post(&pool, "comments sort latest probe").await;
    let t0 = Utc::now() - Duration::minutes(10);
    let r_old = insert_comment_at(&pool, post_id, uid, None, "old root", t0).await;
    let r_mid = insert_comment_at(
        &pool,
        post_id,
        uid,
        None,
        "mid root",
        t0 + Duration::minutes(5),
    )
    .await;
    let r_new = insert_comment_at(
        &pool,
        post_id,
        uid,
        None,
        "new root",
        t0 + Duration::minutes(9),
    )
    .await;

    let (st, j) = get_comments_json(&app, post_id, "sort=latest").await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    assert_eq!(j["status"], "ok");
    let roots = root_ids_in_order(j["comments"].as_array().expect("comments"));
    assert_eq!(roots, vec![r_new.to_string(), r_mid.to_string(), r_old.to_string()]);

    cleanup_user_posts_comments(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_comments_sort_hot_more_replies_first_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: comments sort hot (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_user_one_post(&pool, "comments sort hot probe").await;
    let t0 = Utc::now() - Duration::minutes(5);
    let root_hot = insert_comment_at(&pool, post_id, uid, None, "hot root", t0).await;
    let root_cold = insert_comment_at(
        &pool,
        post_id,
        uid,
        None,
        "cold root",
        t0 + Duration::minutes(1),
    )
    .await;
    insert_comment_at(
        &pool,
        post_id,
        uid,
        Some(root_hot),
        "reply 1",
        t0 + Duration::seconds(30),
    )
    .await;
    insert_comment_at(
        &pool,
        post_id,
        uid,
        Some(root_hot),
        "reply 2",
        t0 + Duration::seconds(40),
    )
    .await;

    let (st, j) = get_comments_json(&app, post_id, "sort=hot").await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    let roots = root_ids_in_order(j["comments"].as_array().expect("comments"));
    assert_eq!(roots[0], root_hot.to_string());
    assert_eq!(roots[1], root_cold.to_string());

    cleanup_user_posts_comments(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_comments_level2_reply_via_post_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: comments level2 (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_user_one_post(&pool, "comments level2 probe").await;
    let root_id = post_comment_http(&app, &token, post_id, "root via http", None).await;
    // 同用户连发评论会命中 `comment_too_fast`（与 04 反刷一致）；等待策略窗后再发回复。
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    let reply_id = post_comment_http(
        &app,
        &token,
        post_id,
        "reply via http",
        Some(root_id),
    )
    .await;

    let (st, j) = get_comments_json(&app, post_id, "").await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    let comments = j["comments"].as_array().expect("comments");
    assert_eq!(comments.len(), 2);
    assert_eq!(comments[0]["id"].as_str(), Some(root_id.to_string().as_str()));
    assert_eq!(
        comments[1]["parent_id"].as_str(),
        Some(root_id.to_string().as_str())
    );
    assert_eq!(comments[1]["id"].as_str(), Some(reply_id.to_string().as_str()));

    cleanup_user_posts_comments(&pool, uid).await;
}

#[tokio::test]
async fn matrix_93_d_com_comments_cursor_requires_chronological_sort_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: comments cursor sort gate (DATABASE_URL unset)");
        return;
    };    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_user_one_post(&pool, "comments cursor gate probe").await;

    let (st, j) = get_comments_json(&app, post_id, "sort=latest&cursor=C|2026-01-01T00:00:00Z|00000000-0000-0000-0000-000000000001").await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    assert_eq!(j["status"], "error");
    assert_eq!(
        j["error"].as_str(),
        Some("comments_cursor_requires_chronological_sort")
    );

    cleanup_user_posts_comments(&pool, uid).await;
}
