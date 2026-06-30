//! **PD-009 · ①** PG ↔ **chain_off** 内存 **`acquisition_trust_score`** 对拍。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};

use super::helpers::*;

async fn parity_for_users(pool: &sqlx::PgPool, user_ids: &[Uuid]) {
    let mut store = crate::chain_off::ChainOffStore::default();
    crate::startup::hydrate_from_db(pool, &mut store)
        .await
        .expect("hydrate_from_db for trust parity");
    for user_id in user_ids {
        crate::chain_off::check_acquisition_trust_pg_memory_parity(pool, &store, *user_id)
        .await
        .unwrap_or_else(|e| panic!("trust parity failed for {user_id}: {e}"));
    }
}

/// 自包含：API 全链路后 **hydrate** → **PG == memory + listing_bonus**（owner + carrier）。
#[tokio::test]
async fn matrix_pd009_trust_pg_memory_parity_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_trust_pg_memory_parity_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let carrier_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_par_own_{}", Uuid::new_v4());
    let carrier_token = format!("tts_pd009_par_car_{}", Uuid::new_v4());
    let owner_email = format!("pd009-par-own-{owner_id}@example.com");
    let carrier_email = format!("pd009-par-car-{carrier_id}@example.com");

    for uid in [owner_id, carrier_id] {
        let _ = sqlx::query("DELETE FROM reviews WHERE order_id IN (SELECT id FROM orders WHERE tourist_id = $1 OR guide_id IN (SELECT id FROM guides WHERE user_id = $1))")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1 OR guide_id IN (SELECT id FROM guides WHERE user_id = $1)")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(uid)
            .execute(&pool)
            .await;
    }

    insert_user(
        &pool,
        owner_id,
        &owner_email,
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
    .expect("insert owner");
    insert_session(&pool, &owner_token, owner_id)
        .await
        .expect("owner session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    insert_user(
        &pool,
        carrier_id,
        &carrier_email,
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
    .expect("insert carrier");
    insert_session(&pool, &carrier_token, carrier_id)
        .await
        .expect("carrier session");

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 trust parity listing",
        "bountyMinUsdc": 120,
        "bountyMaxUsdc": 400
    }));
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    let listing_id = post_j["listing_id"].as_str().expect("listing_id");

    let order_uri = format!("/api/v1/market/acquisition/listings/{listing_id}/orders");
    let order_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&order_uri)
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(order_res.status(), StatusCode::OK);
    let order_j = response_json(order_res).await;
    let order_id = order_j["order"]["id"].as_str().expect("order.id");

    for (token, path_suffix) in [
        (&carrier_token, "accept"),
        (&owner_token, "mock-pay"),
    ] {
        let uri = if path_suffix == "accept" {
            format!("/api/v1/orders/{order_id}/accept")
        } else {
            format!("/api/v1/orders/{order_id}/mock-pay")
        };
        let res = router
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(&uri)
                    .header(header::AUTHORIZATION, auth_bearer(token))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from("{}"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK, "{path_suffix}");
    };
    let complete_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-completion"))
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(complete_res.status(), StatusCode::OK);

    let review_payload = r#"{"score":5,"comment":"pd009-trust-parity"}"#;
    for token in [&owner_token, &carrier_token] {
        let res = router
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!("/api/v1/orders/{order_id}/reviews"))
                    .header(header::AUTHORIZATION, auth_bearer(token))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(review_payload))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
    }

    parity_for_users(&pool, &[owner_id, carrier_id]).await;

    let listing_uuid = uuid::Uuid::parse_str(listing_id).unwrap();
    let order_uuid = uuid::Uuid::parse_str(order_id).unwrap();
    cleanup_listing_and_user(&pool, listing_uuid, owner_id).await;
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_uuid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
}

/// **`smoke-acquisition-pd009-local.sh`** 收尾：读 env **`SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS`**（逗号分隔 UUID）。
#[tokio::test]
async fn matrix_pd009_trust_pg_memory_parity_from_env_smoke() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_trust_pg_memory_parity_from_env_smoke (DATABASE_URL unset)");
        return;
    };
    let Some(ids_raw) = std::env::var("SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS")
        .ok()
        .filter(|s| !s.trim().is_empty())
    else {
        eprintln!(
            "skip: matrix_pd009_trust_pg_memory_parity_from_env_smoke (SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS unset)"
        );
        return;
    };
    let user_ids: Vec<Uuid> = ids_raw
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| Uuid::parse_str(s).unwrap_or_else(|_| panic!("invalid user uuid in env: {s}")))
        .collect();
    assert!(!user_ids.is_empty(), "SMOKE_ACQUISITION_TRUST_PARITY_USER_IDS empty");

    parity_for_users(&pool, &user_ids).await;

    if let Ok(me_score_raw) = std::env::var("SMOKE_ACQUISITION_TRUST_ME_SCORE") {
        let me_score: i32 = me_score_raw
            .trim()
            .parse()
            .unwrap_or_else(|_| panic!("invalid SMOKE_ACQUISITION_TRUST_ME_SCORE: {me_score_raw}"));
        let owner_id = user_ids[0];
        let pg = crate::db::compute_acquisition_trust_score(&pool, owner_id)
            .await
            .expect("pg score for smoke owner");
        assert_eq!(
            me_score, pg,
            "GET /api/v1/me trust.acquisition_trust_score should match PG snapshot"
        );
    }
}
