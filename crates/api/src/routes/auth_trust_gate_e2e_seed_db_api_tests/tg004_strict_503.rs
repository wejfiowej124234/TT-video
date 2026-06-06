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
async fn matrix_93_b_tg_004_post_evidence_strict_db_write_503_when_order_row_missing_pg() {
    let _g = trust_gate_seed_it_lock().lock().await;

    let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!("skip: matrix_93_b_tg_004_post_evidence_strict_db_write_503_when_order_row_missing_pg (DATABASE_URL unset)");
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
    let _ = sqlx::query("DELETE FROM evidence_receipts WHERE order_id = $1")
        .bind(order_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM disputes WHERE order_id = $1")
        .bind(order_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_id)
        .execute(&pool)
        .await;

    let _strict = RestoreEnvVar::set("TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE", "1");
    let content_hash = format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple());

    let token = login_bearer_token(app.clone(), TG_CLEAN_EMAIL, TG_PASSWORD).await;

    let post = app
        .clone()
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
    assert_eq!(post.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(post).await;
    assert_eq!(v["error"], "evidence_db_persist_failed");

    drop(_strict);

    let reseed = app
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
    assert_eq!(reseed.status(), StatusCode::OK);

    let row: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .expect("count orders after re-seed");
    assert_eq!(
        row.0, 1,
        "re-seed should restore trust-gate fixture order in PG"
    );
}
