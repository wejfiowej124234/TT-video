use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_dispute, insert_guide, insert_session, insert_user, upsert_order};
use crate::state::test_support::api_meta_state;

use crate::routes::disputes;

use super::helpers::{
    auth_bearer, cleanup_dispute_bundle, db_it_lock, pool_or_skip, response_json,
};

#[tokio::test]
async fn matrix_93_b_dsp_002_f025_dispute_detail_links_order() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_dsp_002_f025_dispute_detail_links_order (DATABASE_URL unset)");
        return;
    }
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let dispute_id = Uuid::new_v4();
    let now = Utc::now();

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;

    insert_user(
        &pool,
        tourist_id,
        &format!("dsp-t-{tourist_id}@traveltrust.test"),
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
    .expect("tourist");
    insert_user(
        &pool,
        guide_user_id,
        &format!("dsp-g-{guide_user_id}@traveltrust.test"),
        None,
        "guide",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("guide user");

    insert_guide(
        &pool,
        guide_row_id,
        guide_user_id,
        "HZ",
        "CN",
        &["zh".to_string()],
        &["walking".to_string()],
        Some("dispute seed guide"),
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "active",
        now,
        now,
    )
    .await
    .expect("insert_guide");

    upsert_order(
        &pool,
        order_id,
        tourist_id,
        Some(guide_row_id),
        "100",
        "USD",
        "escrowed",
        None,
        now,
        now,
        Some(now),
        Some(now),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    .await
    .expect("upsert_order");

    insert_dispute(
        &pool,
        dispute_id,
        order_id,
        "open",
        &json!([]),
        None,
        None,
        None,
        None,
        now,
        now,
        None,
        1,
    )
    .await
    .expect("insert_dispute");

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = disputes::router().with_state(api_meta_state(Some(co)));

    let list_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/disputes?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    assert_eq!(list_json["page"]["source"], "postgres");
    let items = list_json["items"].as_array().unwrap();
    let id_s = dispute_id.to_string();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(id_s.as_str()));
    assert!(found, "list should include seeded dispute");

    let detail_res = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/disputes/{id_s}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_res.status(), StatusCode::OK);
    let detail_json = response_json(detail_res).await;
    assert_eq!(detail_json["status"], "ok");
    assert_eq!(detail_json["dispute"]["id"], id_s);
    assert_eq!(
        detail_json["dispute"]["order_id"].as_str().unwrap(),
        order_id.to_string()
    );

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;
}
#[tokio::test]
async fn matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let dispute_id = Uuid::new_v4();
    let now = Utc::now();

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;

    insert_user(
        &pool,
        tourist_id,
        &format!("dsp-tb-{tourist_id}@traveltrust.test"),
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
    .expect("tourist");
    insert_user(
        &pool,
        guide_user_id,
        &format!("dsp-gb-{guide_user_id}@traveltrust.test"),
        None,
        "guide",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("guide user");

    let dsp_token = format!("tts_dsp002b_{}", Uuid::new_v4());
    insert_session(&pool, &dsp_token, tourist_id)
        .await
        .expect("insert_session tourist");

    insert_guide(
        &pool,
        guide_row_id,
        guide_user_id,
        "HZ",
        "CN",
        &["zh".to_string()],
        &["walking".to_string()],
        Some("dispute seed guide app_stack"),
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "active",
        now,
        now,
    )
    .await
    .expect("insert_guide");

    upsert_order(
        &pool,
        order_id,
        tourist_id,
        Some(guide_row_id),
        "100",
        "USD",
        "escrowed",
        None,
        now,
        now,
        Some(now),
        Some(now),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    .await
    .expect("upsert_order");

    insert_dispute(
        &pool,
        dispute_id,
        order_id,
        "open",
        &json!([]),
        None,
        None,
        None,
        None,
        now,
        now,
        None,
        1,
    )
    .await
    .expect("insert_dispute");

    let app = super::helpers::app_stack_f023(pool.clone());

    let list_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/disputes?limit=50")
                .header(header::AUTHORIZATION, auth_bearer(&dsp_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    assert_eq!(list_json["page"]["source"], "postgres");
    let items = list_json["items"].as_array().unwrap();
    let id_s = dispute_id.to_string();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(id_s.as_str()));
    assert!(found, "list should include seeded dispute (router::app)");

    let detail_res = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/disputes/{id_s}"))
                .header(header::AUTHORIZATION, auth_bearer(&dsp_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_res.status(), StatusCode::OK);
    let detail_json = response_json(detail_res).await;
    assert_eq!(detail_json["status"], "ok");
    assert_eq!(detail_json["dispute"]["id"], id_s);
    assert_eq!(
        detail_json["dispute"]["order_id"].as_str().unwrap(),
        order_id.to_string()
    );

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;
}
