//! **PD-009** 门闸 IT：Admin 暂停发布、履约保证金接单。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::{Duration, Utc};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_market_listing, insert_session, insert_user};

use super::helpers::*;

/// Admin **`PATCH …/acquisition-publish-suspend`** → 发布 **403** **`acquisition_publish_suspended`**。
#[tokio::test]
async fn matrix_pd009_admin_suspend_blocks_acquisition_publish_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_pd009_admin_suspend_blocks_acquisition_publish_pg (DATABASE_URL unset)");
        return;
    };
    let admin_id = Uuid::new_v4();
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_token = format!("tts_pd009_adm_{}", Uuid::new_v4());
    let owner_token = format!("tts_pd009_own_{}", Uuid::new_v4());
    let admin_email = format!("pd009-adm-{admin_id}@example.com");
    let owner_email = format!("pd009-own-{owner_id}@example.com");
    let suspend_until = (Utc::now() + Duration::hours(24)).to_rfc3339();

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(admin_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(admin_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool,
        admin_id,
        &admin_email,
        None,
        "admin",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert admin session");

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
        .expect("insert owner session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let owner_row: Option<Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE id = $1")
        .bind(owner_id)
        .fetch_optional(&pool)
        .await
        .expect("owner pg probe");
    assert!(
        owner_row.is_some(),
        "owner must exist in PG before admin suspend IT (suite isolation / dirty PG)"
    );

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    let patch_uri = format!("/api/v1/admin/users/{owner_id}/acquisition-publish-suspend");
    let patch_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&patch_uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "suspended_until": suspend_until }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(patch_res.status(), StatusCode::OK, "admin suspend patch");
    let patch_j = response_json(patch_res).await;
    assert_eq!(patch_j["status"], "ok");
    assert_eq!(patch_j["acquisition_publish_suspended"], true);

    let get_detail_uri = format!("/api/v1/admin/users/{owner_id}");
    let detail_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&get_detail_uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_res.status(), StatusCode::OK, "admin user detail after suspend");
    let detail_j = response_json(detail_res).await;
    assert_eq!(
        detail_j["user"]["acquisition_publish_suspended"], true,
        "detail should reflect suspend"
    );
    assert!(
        detail_j["user"]["acquisition_publish_suspended_until"].is_string(),
        "detail until: {:?}",
        detail_j["user"]["acquisition_publish_suspended_until"]
    );

    let list_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/users?limit=500")
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK, "admin users list after suspend");
    let list_j = response_json(list_res).await;
    let owner_row = list_j["items"]
        .as_array()
        .expect("items")
        .iter()
        .find(|row| row["id"].as_str() == Some(owner_id.to_string().as_str()))
        .expect("owner in admin users list");
    assert_eq!(owner_row["acquisition_publish_suspended"], true);

    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 suspend gate test"
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
    assert_eq!(
        post_res.status(),
        StatusCode::FORBIDDEN,
        "publish while suspended"
    );
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["error"], "acquisition_publish_suspended");

    let clear_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&patch_uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "suspended_until": null }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(clear_res.status(), StatusCode::OK, "admin clear suspend");
    let clear_j = response_json(clear_res).await;
    assert_eq!(clear_j["acquisition_publish_suspended"], false);

    let detail_clear = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&get_detail_uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_clear.status(), StatusCode::OK);
    let detail_clear_j = response_json(detail_clear).await;
    assert_eq!(detail_clear_j["user"]["acquisition_publish_suspended"], false);

    let post_ok = router
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
    assert_eq!(post_ok.status(), StatusCode::OK, "publish after clear suspend");
    let ok_j = response_json(post_ok).await;
    let listing_id = Uuid::parse_str(ok_j["listing_id"].as_str().expect("listing_id")).unwrap();
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(admin_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(admin_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
}

/// **`bountyMaxUsdc` ≥ 1000** 接单须 **`acquisition_fulfillment_bond`**。
#[tokio::test]
async fn matrix_pd009_fulfillment_bond_required_for_high_bounty_order_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_pd009_fulfillment_bond_required_for_high_bounty_order_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let carrier_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let carrier_token = format!("tts_pd009_car_{}", Uuid::new_v4());
    let owner_email = format!("pd009-own2-{owner_id}@example.com");
    let carrier_email = format!("pd009-car2-{carrier_id}@example.com");

    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    let payload = json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 high bounty listing",
        "bountyMinUsdc": 200,
        "bountyMaxUsdc": 1500
    });
    insert_market_listing(&pool, listing_id, "acquisition", owner_id, &payload, now, "test")
        .await
        .expect("insert listing");

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
        .expect("insert carrier session");

    let router = app_stack_mkt_catalog(pool.clone());
    let uri = format!("/api/v1/market/acquisition/listings/{listing_id}/orders");
    let denied = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(denied.status(), StatusCode::BAD_REQUEST);
    let denied_j = response_json(denied).await;
    assert_eq!(denied_j["error"], "acquisition_fulfillment_bond_required");

    crate::db::upsert_acquisition_fulfillment_bond(&pool, carrier_id, "100")
        .await
        .expect("fulfillment bond");

    let ok = router
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::OK, "order after fulfillment bond");
    let ok_j = response_json(ok).await;
    let order_id = ok_j["order"]["id"].as_str().expect("order.id");

    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(Uuid::parse_str(order_id).unwrap())
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
}
