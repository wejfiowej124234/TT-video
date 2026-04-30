//! **`POST /api/v1/community/posts`** + **`commerce_market_listing_id`**：**PostgreSQL** 下属主与 **`published`** 状态契约（跳过条件：`DATABASE_URL` 未设置）。
//!
//! 与 **`db::insert_post`**（**COMMERCE-LISTING-ATOMIC-001**）、**`create_post`** 同源；**Bearer** 走 **`get_user_id_by_token`**（**`db_pool`** 路径）。

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_session, insert_user};
use crate::state::test_support::api_meta_state;

use super::router;

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

async fn cleanup_all(pool: &PgPool, uids: &[Uuid], listing_ids: &[Uuid]) {
    if !uids.is_empty() {
        let _ = sqlx::query("DELETE FROM community_posts WHERE user_id = ANY($1)")
            .bind(uids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM sessions WHERE user_id = ANY($1)")
            .bind(uids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM users WHERE id = ANY($1)")
            .bind(uids)
            .execute(pool)
            .await;
    }
    if !listing_ids.is_empty() {
        let _ = sqlx::query("DELETE FROM market_listings WHERE id = ANY($1)")
            .bind(listing_ids)
            .execute(pool)
            .await;
    }
}

async fn insert_market_listing(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
    owner_user_id: Uuid,
    status: &str,
    now: chrono::DateTime<Utc>,
) {
    sqlx::query(
        r#"INSERT INTO market_listings (id, variant, owner_user_id, payload, status, created_at, updated_at)
           VALUES ($1, $2, $3, '{}'::jsonb, $4, $5, $5)"#,
    )
    .bind(id)
    .bind(variant)
    .bind(owner_user_id)
    .bind(status)
    .bind(now)
    .execute(pool)
    .await
    .expect("insert market_listings");
}

#[tokio::test]
async fn post_community_create_post_binds_owned_published_listing() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_community_create_post_binds_owned_published_listing (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let token = format!("tts_commerce_ok_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("commerce-ok-{uid}@traveltrust.test");

    cleanup_all(&pool, &[uid], &[listing_id]).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "provider", uid, "published", now).await;

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = router().with_state(api_meta_state(Some(co)));

    let body = json!({
        "body": "listing-bound smoke",
        "post_type": "text",
        "commerce_showcase_kind": "general_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["status"], "ok", "body={}", v);
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let row: (Option<String>, Option<Uuid>) = sqlx::query_as(
        "SELECT commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_one(&pool)
    .await
    .expect("select post commerce columns");
    assert_eq!(row.0.as_deref(), Some("general_led"));
    assert_eq!(row.1, Some(listing_id));

    cleanup_all(&pool, &[uid], &[listing_id]).await;
}

#[tokio::test]
async fn post_community_create_post_rejects_other_users_published_listing() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_community_create_post_rejects_other_users_published_listing (DATABASE_URL unset)"
        );
        return;
    };

    let uid_a = Uuid::new_v4();
    let uid_b = Uuid::new_v4();
    let listing_b = Uuid::new_v4();
    let token_a = format!("tts_commerce_denied_{}", Uuid::new_v4());
    let now = Utc::now();
    let email_a = format!("commerce-a-{uid_a}@traveltrust.test");
    let email_b = format!("commerce-b-{uid_b}@traveltrust.test");

    cleanup_all(&pool, &[uid_a, uid_b], &[listing_b]).await;

    insert_user(
        &pool, uid_a, &email_a, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user a");
    insert_user(
        &pool, uid_b, &email_b, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user b");
    insert_session(&pool, &token_a, uid_a)
        .await
        .expect("insert_session a");
    insert_market_listing(&pool, listing_b, "acquisition", uid_b, "published", now).await;

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = router().with_state(api_meta_state(Some(co)));

    let body = json!({
        "body": "must not bind others listing",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_b.to_string(),
    });
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(&token_a))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::FORBIDDEN);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["status"], "error");
    assert_eq!(v["error"], "commerce_listing_not_owned_or_unpublished");

    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM community_posts WHERE user_id = $1 AND body = $2",
    )
    .bind(uid_a)
    .bind("must not bind others listing")
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(n, 0, "post must not persist when listing not owned");

    cleanup_all(&pool, &[uid_a, uid_b], &[listing_b]).await;
}

#[tokio::test]
async fn post_community_create_post_rejects_owned_non_published_listing() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_community_create_post_rejects_owned_non_published_listing (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let token = format!("tts_commerce_arch_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("commerce-arch-{uid}@traveltrust.test");

    cleanup_all(&pool, &[uid], &[listing_id]).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "provider", uid, "archived", now).await;

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = router().with_state(api_meta_state(Some(co)));

    let body = json!({
        "body": "archived listing must not bind",
        "post_type": "text",
        "commerce_showcase_kind": "general_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::FORBIDDEN);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["status"], "error");
    assert_eq!(v["error"], "commerce_listing_not_owned_or_unpublished");

    cleanup_all(&pool, &[uid], &[listing_id]).await;
}
