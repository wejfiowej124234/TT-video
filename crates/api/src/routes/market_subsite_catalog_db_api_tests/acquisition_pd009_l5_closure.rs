//! **PD-009 · L5** 闭环 IT：L4 评价/信用、Escrow 勾选、频控、信用免押、订单元数据落库。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_guide, insert_session, insert_user, ACQUISITION_PUBLISH_DAILY_MAX, ACQUISITION_TRUST_WAIVE_BOND_THRESHOLD};

use super::helpers::*;

const REVIEW_PAYLOAD: &str = r#"{"score":5,"comment":"pd009-l5-closure"}"#;

/// **L5 · L4 闭环**：escrowed → **confirm-completion** → 双向 **reviews** → **`acquisition_trust_score`** 上升 + **`orders.order_kind`** 落库。
#[tokio::test]
async fn matrix_pd009_l5_full_closure_reviews_trust_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_l5_full_closure_reviews_trust_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let carrier_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_l5_own_{}", Uuid::new_v4());
    let carrier_token = format!("tts_pd009_l5_car_{}", Uuid::new_v4());
    let owner_email = format!("pd009-l5-own-{owner_id}@example.com");
    let carrier_email = format!("pd009-l5-car-{carrier_id}@example.com");

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
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    insert_session(&pool, &owner_token, owner_id)
        .await
        .expect("owner session");
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
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    let score_before_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(score_before_res.status(), StatusCode::OK);
    let score_before_j = response_json(score_before_res).await;
    let trust_before = score_before_j["trust"]["acquisition_trust_score"]
        .as_i64()
        .unwrap_or(500);

    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 l5 closure listing",
        "bountyMinUsdc": 120,
        "bountyMaxUsdc": 350
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
    assert_eq!(post_res.status(), StatusCode::OK, "publish listing");
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
    let order_uuid = Uuid::parse_str(order_id).unwrap();

    let db_kind: Option<String> = sqlx::query_scalar(
        "SELECT order_kind FROM orders WHERE id = $1",
    )
    .bind(order_uuid)
    .fetch_optional(&pool)
    .await
    .expect("order_kind query")
    .flatten();
    assert_eq!(db_kind.as_deref(), Some("acquisition_listing"));

    for (token, label) in [(&carrier_token, "accept"), (&owner_token, "mock-pay")] {
        let uri = if label == "accept" {
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
        assert_eq!(res.status(), StatusCode::OK, "{label}");
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
    assert_eq!(complete_res.status(), StatusCode::OK, "confirm-completion");
    let complete_j = response_json(complete_res).await;
    assert_eq!(complete_j["order"]["status"], "completed");

    for token in [&owner_token, &carrier_token] {
        let review_res = router
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!("/api/v1/orders/{order_id}/reviews"))
                    .header(header::AUTHORIZATION, auth_bearer(token))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(REVIEW_PAYLOAD))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(review_res.status(), StatusCode::OK, "post review");
    };
    let trust_after_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(trust_after_res.status(), StatusCode::OK);
    let trust_after_j = response_json(trust_after_res).await;
    let trust_after = trust_after_j["trust"]["acquisition_trust_score"]
        .as_i64()
        .expect("acquisition_trust_score");
    assert!(
        trust_after > trust_before,
        "trust should increase after bilateral reviews: before={trust_before} after={trust_after}"
    );

    let carrier_before_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(carrier_before_res.status(), StatusCode::OK);
    let carrier_before_j = response_json(carrier_before_res).await;
    let carrier_trust = carrier_before_j["trust"]["acquisition_trust_score"]
        .as_i64()
        .unwrap_or(500);
    assert!(
        carrier_trust > 500,
        "carrier trust should include owner review via guides.id reviewee (pool SSOT): {carrier_trust}"
    );

    let listing_uuid = Uuid::parse_str(listing_id).unwrap();
    let _ = sqlx::query("DELETE FROM reviews WHERE order_id = $1")
        .bind(order_uuid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_uuid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_uuid, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;
}

/// **L5 · AQ-002**：缺 **`agree_escrow_copy`** → **400** **`acquisition_escrow_ack_required`**。
#[tokio::test]
async fn matrix_pd009_l5_escrow_ack_required_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_l5_escrow_ack_required_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_l5_ack_{}", Uuid::new_v4());
    let owner_email = format!("pd009-l5-ack-{owner_id}@example.com");

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    insert_session(&pool, &owner_token, owner_id)
        .await
        .expect("owner session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;
    let post_body = json!({
        "payload": {
            "kind": "acquisition_carry_studio_v1",
            "title": "pd009 escrow ack gate"
        }
    });
    let post_res = router
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
    assert_eq!(post_res.status(), StatusCode::BAD_REQUEST);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["error"], "acquisition_escrow_ack_required");

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
}

/// **L5 · AQ-004**：超 **`acquisition_publish_daily_max`** → **429** **`acquisition_publish_rate_limited`**。
#[tokio::test]
async fn matrix_pd009_l5_publish_rate_limited_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_l5_publish_rate_limited_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_l5_rl_{}", Uuid::new_v4());
    let owner_email = format!("pd009-l5-rl-{owner_id}@example.com");

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    insert_session(&pool, &owner_token, owner_id)
        .await
        .expect("owner session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    for i in 0..ACQUISITION_PUBLISH_DAILY_MAX {
        let post_body = acquisition_listing_post_json(json!({
            "kind": "acquisition_carry_studio_v1",
            "title": format!("pd009 rate limit {i}")
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
        assert_eq!(post_res.status(), StatusCode::OK, "publish #{i}");
    };
    let overflow_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 rate limit overflow"
    }));
    let overflow_res = router
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(overflow_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(overflow_res.status(), StatusCode::TOO_MANY_REQUESTS);
    let overflow_j = response_json(overflow_res).await;
    assert_eq!(overflow_j["error"], "acquisition_publish_rate_limited");

    let _ = sqlx::query(
        "DELETE FROM market_listings WHERE owner_user_id = $1 AND variant = 'acquisition'",
    )
    .bind(owner_id)
    .execute(&pool)
    .await;
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
}

/// **L5 · AQ-005**：信用 ≥ 免押阈 → 无发布保证金仍可 **`POST …/listings`**。
#[tokio::test]
async fn matrix_pd009_l5_trust_waive_publish_without_bond_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_l5_trust_waive_publish_without_bond_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_l5_wv_{}", Uuid::new_v4());
    let owner_email = format!("pd009-l5-wv-{owner_id}@example.com");
    let wallet = "0xacquisitionpd009waiveaaaaaaaaaaaaaaaaaaaa";

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    insert_session(&pool, &owner_token, owner_id)
        .await
        .expect("owner session");
    sqlx::query("UPDATE users SET default_wallet_address = $2, updated_at = now() WHERE id = $1")
        .bind(owner_id)
        .bind(wallet)
        .execute(&pool)
        .await
        .expect("wallet");

    let reviewer_id = Uuid::new_v4();
    let reviewer_email = format!("pd009-l5-rev-{reviewer_id}@example.com");
    insert_user(
        &pool,
        reviewer_id,
        &reviewer_email,
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
    .expect("reviewer");

    let guide_id = Uuid::new_v4();
    insert_guide(
        &pool,
        guide_id,
        owner_id,
        "Global",
        "XX",
        &["en".to_string()],
        &["acquisition_fulfillment".to_string()],
        Some("l5 waive it"),
        Some(wallet),
        None,
        None,
        None,
        None,
        None,
        "0",
        None,
        None,
        "active",
        now,
        now,
    )
    .await
    .expect("guide");

    let reviews_needed = ((ACQUISITION_TRUST_WAIVE_BOND_THRESHOLD - 500) / 25).max(1) as i64;
    for i in 0..reviews_needed {
        let review_id = Uuid::new_v4();
        let oid = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO orders (
                id, tourist_id, guide_id, amount, currency, status, order_kind,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, '50', 'USDC', 'completed', 'acquisition_listing', now(), now()
            )
            "#,
        )
        .bind(oid)
        .bind(reviewer_id)
        .bind(guide_id)
        .execute(&pool)
        .await
        .expect("seed order");
        sqlx::query(
            r#"
            INSERT INTO reviews (id, order_id, reviewer_id, reviewee_id, score, weight, comment, created_at)
            VALUES ($1, $2, $3, $4, 5, 1, $5, now())
            "#,
        )
        .bind(review_id)
        .bind(oid)
        .bind(reviewer_id)
        .bind(owner_id)
        .bind(format!("waive seed {i}"))
        .execute(&pool)
        .await
        .expect("seed review");
    };
    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    let me_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_res.status(), StatusCode::OK);
    let me_j = response_json(me_res).await;
    assert_eq!(me_j["trust"]["acquisition_publish_bond_waived"], true);
    assert!(
        me_j["trust"]["acquisition_trust_score"]
            .as_i64()
            .unwrap_or(0)
            >= i64::from(ACQUISITION_TRUST_WAIVE_BOND_THRESHOLD),
        "trust score should reach waive threshold"
    );

    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 trust waive publish"
    }));
    let post_res = router
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
    assert_eq!(post_res.status(), StatusCode::OK, "waive publish without bond");

    let _ = sqlx::query("DELETE FROM reviews WHERE reviewee_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(reviewer_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listings WHERE owner_user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE id = $1")
        .bind(guide_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(reviewer_id)
        .execute(&pool)
        .await;
}

/// **L5 · AQ-008**：收购池争议 **`refund_ratio ≥ 0.75`** → 发布方 **`acquisition_publish_bond`** **slashed**（PG）。
#[tokio::test]
async fn matrix_pd009_l5_dispute_resolve_slashes_publish_bond_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_l5_dispute_resolve_slashes_publish_bond_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let carrier_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_l5_dsp_own_{}", Uuid::new_v4());
    let carrier_token = format!("tts_pd009_l5_dsp_car_{}", Uuid::new_v4());
    let owner_email = format!("pd009-l5-dsp-own-{owner_id}@example.com");
    let carrier_email = format!("pd009-l5-dsp-car-{carrier_id}@example.com");
    let arb_email = format!("pd009-l5-dsp-arb-{owner_id}@example.com");

    for uid in [owner_id, carrier_id] {
        let _ = sqlx::query("DELETE FROM disputes WHERE order_id IN (SELECT id FROM orders WHERE tourist_id = $1)")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1 OR guide_id IN (SELECT id FROM guides WHERE user_id = $1)")
            .bind(uid)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1").bind(uid).execute(&pool).await;
        let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1").bind(uid).execute(&pool).await;
        let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1").bind(uid).execute(&pool).await;
        let _ = sqlx::query("DELETE FROM users WHERE id = $1").bind(uid).execute(&pool).await;
    };
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE lower(email) = lower($1))")
        .bind(&arb_email)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(&arb_email)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("owner");
    insert_session(&pool, &owner_token, owner_id).await.expect("owner session");
    insert_user(
        &pool, carrier_id, &carrier_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("carrier");
    insert_session(&pool, &carrier_token, carrier_id).await.expect("carrier session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 dispute slash",
        "bountyMinUsdc": 100,
        "bountyMaxUsdc": 200
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
    let listing_id = response_json(post_res).await["listing_id"]
        .as_str()
        .expect("listing_id")
        .to_string();

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
    let order_id = response_json(order_res).await["order"]["id"]
        .as_str()
        .expect("order.id")
        .to_string();
    let order_uuid = Uuid::parse_str(&order_id).unwrap();

    for (token, path) in [
        (&carrier_token, format!("/api/v1/orders/{order_id}/accept")),
        (&owner_token, format!("/api/v1/orders/{order_id}/mock-pay")),
    ] {
        let res = router
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(&path)
                    .header(header::AUTHORIZATION, auth_bearer(token))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from("{}"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK, "{path}");
    };
    let open_dispute = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "reason": "pd009 l5 slash test" }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(open_dispute.status(), StatusCode::OK, "open dispute");
    let dispute_id = response_json(open_dispute).await["dispute"]["id"]
        .as_str()
        .expect("dispute.id")
        .to_string();

    let prev_seed = std::env::var("P3_SEED_ARBITRATOR_EMAIL").ok();
    std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", &arb_email);
    let reg_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &arb_email,
                        "password": "TestPass12!",
                        "nickname": "pd009 arb"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg_res.status(), StatusCode::OK);
    let reg_j = response_json(reg_res).await;
    assert_eq!(reg_j["role"], "arbitrator");
    let arb_token = reg_j["token"].as_str().expect("arb token").to_string();
    if let Some(prev) = prev_seed {
        std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", prev);
    } else {
        std::env::remove_var("P3_SEED_ARBITRATOR_EMAIL");
    };
    let bond_before: String = sqlx::query_scalar(
        "SELECT status FROM staking_positions WHERE user_id = $1 AND kind = 'acquisition_publish_bond' LIMIT 1",
    )
    .bind(owner_id)
    .fetch_one(&pool)
    .await
    .expect("bond before");
    assert_eq!(bond_before, "locked");

    let resolve_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/disputes/{dispute_id}/resolve"))
                .header(header::AUTHORIZATION, auth_bearer(&arb_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refund_ratio": 0.75, "slash_guide": false }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resolve_res.status(), StatusCode::OK, "resolve dispute");
    assert_eq!(response_json(resolve_res).await["dispute"]["status"], "resolved");

    let bond_after: String = sqlx::query_scalar(
        "SELECT status FROM staking_positions WHERE user_id = $1 AND kind = 'acquisition_publish_bond' LIMIT 1",
    )
    .bind(owner_id)
    .fetch_one(&pool)
    .await
    .expect("bond after");
    assert_eq!(bond_after, "slashed");

    let listing_uuid = Uuid::parse_str(&listing_id).unwrap();
    let _ = sqlx::query("DELETE FROM disputes WHERE order_id = $1")
        .bind(order_uuid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_uuid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_uuid, owner_id).await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(&arb_email)
        .execute(&pool)
        .await;
}
