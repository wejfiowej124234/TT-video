use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::{
    login_bearer_token, response_json, router_with_pg, trust_gate_seed_it_lock, RestoreEnvVar,
    ORDER_EVIDENCE_RATE_ID, TG_CLEAN_EMAIL, TG_PASSWORD,
};

#[tokio::test]
async fn matrix_93_b_tg_003_post_seed_then_post_evidence_persists_pg_receipt_and_dispute_hashes() {
    let _g = trust_gate_seed_it_lock().lock().await;

    let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!("skip: matrix_93_b_tg_003_post_seed_then_post_evidence_persists_pg_receipt_and_dispute_hashes (DATABASE_URL unset)");
        return;
    }
    let _seed_env = RestoreEnvVar::set("SEED_TEST_ACCOUNTS", "1");
    let _evidence_rl = RestoreEnvVar::set("EVIDENCE_MAX_REQUESTS_PER_MINUTE", "0");

    let app = router_with_pg(pool.clone());
    let seed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/seed-trust-gate-e2e")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(seed.status(), StatusCode::OK);

    let order_id = Uuid::parse_str(ORDER_EVIDENCE_RATE_ID).expect("order uuid");
    let content_hash = format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple());
    assert_eq!(content_hash.len(), 64);

    let token = login_bearer_token(app.clone(), TG_CLEAN_EMAIL, TG_PASSWORD).await;

    let post = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/evidence"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::from(
                    json!({ "content_hash": &content_hash }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        post.status(),
        StatusCode::OK,
        "{:?}",
        response_json(post).await
    );

    let rc: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM evidence_receipts WHERE order_id = $1 AND content_hash = $2",
    )
    .bind(order_id)
    .bind(&content_hash)
    .fetch_one(&pool)
    .await
    .expect("count evidence_receipts");
    assert_eq!(rc.0, 1);

    let dh: (bool,) = sqlx::query_as(
        "SELECT COALESCE((SELECT evidence_hashes @> jsonb_build_array($2::text) FROM disputes WHERE order_id = $1), false)",
    )
    .bind(order_id)
    .bind(&content_hash)
    .fetch_one(&pool)
    .await
    .expect("dispute evidence_hashes contains hash");
    assert!(
        dh.0,
        "append_evidence_hash_to_dispute should update PG disputes row"
    );
}
