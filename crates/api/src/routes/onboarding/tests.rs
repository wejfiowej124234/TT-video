use super::compliance::{onboarding_compliance_audit_payload, OnboardingComplianceBlockKind};
use super::router;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::state::test_support::api_meta_state;
use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use std::sync::{Arc, Mutex, OnceLock};
use tokio::sync::RwLock;
use tower::util::ServiceExt;
use uuid::Uuid;

static ONBOARDING_RL_TEST_MUTEX: OnceLock<Mutex<()>> = OnceLock::new();

fn lock_onboarding_rl_tests() -> std::sync::MutexGuard<'static, ()> {
    ONBOARDING_RL_TEST_MUTEX
        .get_or_init(|| Mutex::new(()))
        .lock()
        .expect("onboarding rl test mutex poisoned")
}

fn chain_off_minimal() -> ChainOffState {
    ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    }
}

/// **93 · B-ONB-QUOTE / F-034** ↔ **`matrix_93_b_onb_001a_f034_*`**（**`onboarding::router`**；**无** **`chain_off`** → **503** **`chain_off_unavailable`**）。
#[tokio::test]
async fn matrix_93_b_onb_001a_f034_get_onboarding_quote_chain_off_unavailable_503_subrouter() {
    let app = router().with_state(api_meta_state(None));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=provider")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["error"], "chain_off_unavailable");
}

/// **93 · B-ONB-QUOTE / F-034** ↔ **`matrix_93_b_onb_001b_f034_*`**（**无效** **`role`** → **400** **`invalid_onboarding_role`**）。
#[tokio::test]
async fn matrix_93_b_onb_001b_f034_get_onboarding_quote_invalid_role_400_subrouter() {
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=tourist")
                .header("x-forwarded-for", "203.0.113.11")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["error"], "invalid_onboarding_role");
}

/// **93 · B-ONB-QUOTE / F-034** ↔ **`fee_schedule_v1`** 默认计价。
#[tokio::test]
async fn matrix_93_b_onb_001c_f034_get_onboarding_quote_provider_fee_schedule_v1_200_subrouter() {
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=provider&jurisdictions=US")
                .header("x-forwarded-for", "203.0.113.12")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["fee_schedule_version"], "fee_schedule_v1");
    assert_eq!(v["meta"]["implementation_status"], "onboarding_quote_fee_schedule_v1");
}

/// **93 · B-ONB-QUOTE / F-034** ↔ **`onboarding_quote_rate_limited`**（**429** + **`Retry-After`** / **`retry_after_*`**）。
#[tokio::test]
async fn matrix_93_b_onb_001e_f034_get_onboarding_quote_rate_limited_429_subrouter() {
    let _g = lock_onboarding_rl_tests();
    let prev = std::env::var("ONBOARDING_QUOTE_RATE_LIMIT_PER_MINUTE").ok();
    std::env::set_var("ONBOARDING_QUOTE_RATE_LIMIT_PER_MINUTE", "2");
    let client = format!("203.0.113.{}", Uuid::new_v4());
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    for _ in 0..2 {
        let res = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/onboarding/quote?role=provider")
                    .header("x-forwarded-for", &client)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
    };    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=provider")
                .header("x-forwarded-for", &client)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(
        res.headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("60")
    );
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["error"], "onboarding_quote_rate_limited");
    assert_eq!(v["retry_after_sec"], 60);
    assert_eq!(v["retry_after_seconds"], 60);
    match prev {
        Some(ref s) => std::env::set_var("ONBOARDING_QUOTE_RATE_LIMIT_PER_MINUTE", s),
        None => std::env::remove_var("ONBOARDING_QUOTE_RATE_LIMIT_PER_MINUTE"),
    }
}

/// **93 · B-ONB-PAY / F-035** ↔ **`onboarding_user_write_rate_limited`**（**uid** 写桶 **429**）。
#[tokio::test]
async fn matrix_93_b_onb_002d_f035_post_onboarding_payment_intents_user_write_rl_429_subrouter() {
    let _g = lock_onboarding_rl_tests();
    let prev = std::env::var("ONBOARDING_USER_WRITE_RATE_LIMIT_PER_MINUTE").ok();
    std::env::set_var("ONBOARDING_USER_WRITE_RATE_LIMIT_PER_MINUTE", "1");
    let uid = Uuid::new_v4();
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let req_body = r#"{"role":"provider"}"#;
    let res1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/onboarding/payment-intents")
                .header("X-User-Id", uid.to_string())
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(req_body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res1.status(), StatusCode::SERVICE_UNAVAILABLE);
    let res2 = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/onboarding/payment-intents")
                .header("X-User-Id", uid.to_string())
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(req_body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res2.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(
        res2.headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("60")
    );
    let body = res2.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["error"], "onboarding_user_write_rate_limited");
    assert_eq!(v["retry_after_sec"], 60);
    assert_eq!(v["retry_after_seconds"], 60);
    match prev {
        Some(ref s) => std::env::set_var("ONBOARDING_USER_WRITE_RATE_LIMIT_PER_MINUTE", s),
        None => std::env::remove_var("ONBOARDING_USER_WRITE_RATE_LIMIT_PER_MINUTE"),
    }
}

/// **93 · B-ONB-PAY / F-035** ↔ **`matrix_93_b_onb_002a_f035_*`**（**无** 鉴权头 → **401**）。
#[tokio::test]
async fn matrix_93_b_onb_002a_f035_post_onboarding_payment_intents_unauthorized_401_subrouter() {
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

/// **93 · B-ONB-PAY / F-035** ↔ **`matrix_93_b_onb_002b_f035_*`**（**`X-User-Id`** **链下** → **503** **`onboarding_payment_not_configured`** **stub**）。
#[tokio::test]
async fn matrix_93_b_onb_002b_f035_post_onboarding_payment_intents_stub_not_configured_503_subrouter(
) {
    let uid = Uuid::new_v4();
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/onboarding/payment-intents")
                .header("X-User-Id", uid.to_string())
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["error"], "onboarding_payment_not_configured");
}

/// **93 · B-ONB-ENT / F-037** ↔ **`matrix_93_b_onb_003a_f037_*`**（**策略 B** **资格** **端点**；**无** 鉴权 → **401**）。
#[tokio::test]
async fn matrix_93_b_onb_003a_f037_get_onboarding_entitlements_me_unauthorized_401_subrouter() {
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/entitlements/me")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

/// **93 · B-ONB-ENT / F-037** ↔ **`matrix_93_b_onb_003b_f037_*`**（**stub** **空** **`entitlements`**）。
#[tokio::test]
async fn matrix_93_b_onb_003b_f037_get_onboarding_entitlements_me_empty_ok_200_subrouter() {
    let uid = Uuid::new_v4();
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/entitlements/me")
                .header("X-User-Id", uid.to_string())
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(v["entitlements"].as_array().unwrap().is_empty());
    assert_eq!(
        v["meta"]["implementation_status"],
        "onboarding_entitlements_stub"
    );
}

/// **93 · B-ONB-ROLE / F-038** ↔ **`matrix_93_b_onb_004a_f038_*`**（**无** 资格 **→** **400** **`onboarding_entitlement_required`**）。
#[tokio::test]
async fn matrix_93_b_onb_004a_f038_post_onboarding_role_confirm_entitlement_required_400_subrouter()
{
    let uid = Uuid::new_v4();
    let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/onboarding/role-confirm")
                .header("X-User-Id", uid.to_string())
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["error"], "onboarding_entitlement_required");
}

/// **96-18 R3**：拒服审计 JSON 键稳定（**无** email 字段）。
#[test]
fn onboarding_compliance_audit_payload_has_stable_keys() {
    let uid = Uuid::nil();
    let v = onboarding_compliance_audit_payload(
        "POST /api/v1/onboarding/payment-intents",
        Some("rid-x"),
        uid,
        OnboardingComplianceBlockKind::EmailDenylistHit,
    );
    assert_eq!(v["audit_schema"], "traveltrust.onboarding_compliance.v1");
    assert_eq!(v["decision"], "email_denylist_hit");
    assert_eq!(v["screening_tier"], "env_substring_only");
    assert_eq!(v["request_id"], "rid-x");
    assert_eq!(
        v["user_id"].as_str().unwrap(),
        "00000000-0000-0000-0000-000000000000"
    );
    assert!(v.get("email").is_none());
}

#[test]
fn onboarding_compliance_audit_payload_stub_reject_keys() {
    let uid = Uuid::nil();
    let v = onboarding_compliance_audit_payload(
        "POST /api/v1/onboarding/payment-intents",
        None,
        uid,
        OnboardingComplianceBlockKind::StubProviderReject,
    );
    assert_eq!(v["decision"], "stub_provider_reject");
    assert_eq!(v["screening_tier"], "stub_provider_only");
    assert_eq!(v["request_id"], "-");
}

#[test]
fn onboarding_compliance_audit_payload_list_file_hit_keys() {
    let uid = Uuid::nil();
    let v = onboarding_compliance_audit_payload(
        "POST /api/v1/onboarding/role-confirm",
        Some("rid-lf"),
        uid,
        OnboardingComplianceBlockKind::ListFileHit,
    );
    assert_eq!(v["decision"], "list_file_hit");
    assert_eq!(v["screening_tier"], "static_file_exact_match");
    assert_eq!(v["request_id"], "rid-lf");
    assert!(v.get("email").is_none());
}
