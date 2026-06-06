use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::{
    response_json, router_with_pg, trust_gate_seed_it_lock, RestoreEnvVar, EVIDENCE_TRUST_ORDER_ID,
};

#[tokio::test]
async fn matrix_93_b_tg_002_post_seed_trust_gate_e2e_upserts_evidence_fixture_order_pg() {
    let _g = trust_gate_seed_it_lock().lock().await;

    let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!(
            "skip: matrix_93_b_tg_002_post_seed_trust_gate_e2e_upserts_evidence_fixture_order_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _seed_env = RestoreEnvVar::set("SEED_TEST_ACCOUNTS", "1");

    let r = router_with_pg(pool.clone());
    let res = r
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/seed-trust-gate-e2e")
                .header("content-type", "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v.get("status").and_then(|s| s.as_str()), Some("ok"));

    let oid = Uuid::parse_str(EVIDENCE_TRUST_ORDER_ID).expect("fixture uuid");
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&pool)
        .await
        .expect("count orders by trust-gate evidence fixture id");
    assert_eq!(
        row.0, 1,
        "POST /auth/seed-trust-gate-e2e should upsert evidence_trust_order row for evidence_receipts FK (TT-96-20 §3.1)"
    );

    let dcnt: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM disputes WHERE order_id = $1")
        .bind(oid)
        .fetch_one(&pool)
        .await
        .expect("count disputes by trust-gate evidence fixture order");
    assert_eq!(
        dcnt.0, 1,
        "POST /auth/seed-trust-gate-e2e should upsert_dispute_chain_off_fixture for evidence_trust_order (trust_gate_e2e_seed PG disputes)"
    );
}
