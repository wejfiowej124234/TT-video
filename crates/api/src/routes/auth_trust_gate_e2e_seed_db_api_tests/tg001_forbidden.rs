use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use tower::ServiceExt;

use super::helpers::{
    response_json, router_chain_off_only, trust_gate_seed_it_lock, RestoreEnvVar,
};

#[tokio::test]
async fn matrix_93_b_tg_001_post_seed_trust_gate_e2e_forbidden_without_seed_env() {
    let _g = trust_gate_seed_it_lock().lock().await;
    let _seed_env = RestoreEnvVar::unset("SEED_TEST_ACCOUNTS");

    let r = router_chain_off_only();
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

    assert_eq!(res.status(), StatusCode::FORBIDDEN);
    let v = response_json(res).await;
    assert_eq!(v["error"], "seed_test_accounts_disabled");
}
