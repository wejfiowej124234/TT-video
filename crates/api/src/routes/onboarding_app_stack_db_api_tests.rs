//! **96-18 F-034～F-038 · API·IT（`router::app` + PostgreSQL + `Router::oneshot`）**
//!
//! - **与** **`onboarding::tests`** **`matrix_93_b_onb_*` 子路由** **互补**：本文件断言 **`merge` 序**、**中间件链**（**`idempotency_key_layer`** / **`auth_placeholder_layer`**）下 **`/api/v1/onboarding/*`** 与 **`POST …/internal/onboarding/payments/webhook`** 行为。
//! - **93**：**`matrix_93_b_onb_001d_f034_*`** / **`matrix_93_b_onb_002c_f035_*`**（**PG** **persisted 200**）/ **`matrix_93_b_onb_002e_f035_*`**（**幂等键过长** **400**）/ **`matrix_93_b_onb_005_f035_*`**（**409** **`onboarding_idempotency_conflict`**）/ **`matrix_93_b_onb_006_f035_*`** / **`matrix_93_b_onb_006b_f038_*`**（**403** **`onboarding_forbidden_sanctions`** **+** **`onboarding_compliance_audit_events`** **payment-intents** / **role-confirm**）/ **`matrix_93_b_onb_006c_f035_*`**（**`ONBOARDING_COMPLIANCE_SCREENING_MODE=off`** **跳过** **denylist**）/ **`matrix_93_b_onb_006d_f035_*`**（**`stub_reject_all`** **403** **+** **审计**）/ **`matrix_93_b_onb_006e_f035_*`** / **`006f_*`** / **`006g_*`** / **`006j_*`** / **`006l_*`** / **`006n_*`**（**`list_file`** + **`ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE`**；**`payment-intents`** **403/200/503** **路径缺失/超字节/超行/非法 UTF-8**）/ **`006h_f038_*`** / **`006i_*`** / **`006k_*`** / **`006m_*`** / **`006o_*`**（**`role-confirm`** **`list_file`** **403/503**）/ **`matrix_93_b_onb_007_f035_*`**（**503** **`onboarding_payment_intents_disabled`**）/ **`matrix_93_b_onb_003c_f037_*`**（**`onboarding_entitlements_db`**）/ **`matrix_93_b_onb_004b_f038_*`** / **`matrix_93_d_onb_002_f036_*`**（**未知** **`idempotency_key`** **→** **400**）/ **`matrix_93_d_onb_004_f036_*`**（**webhook** **JSON** **`idempotency_key`** **>256** **字节** **→** **400** **`invalid_onboarding_idempotency_key`**）/ **`matrix_93_d_onb_003_f036_*`**（**pay → internal webhook → role** **E2E**）/ **`matrix_93_d_onb_008_f036_*`**（**96-09** **`ONBOARDING_WEBHOOK_ASYNC_QUEUE`** **内联 drain** **+** **`onboarding_webhook_jobs`**）/ **`matrix_93_d_onb_008b_f036_*`**（**250** **阶段 1** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR`** **`async_jobs`** **镜像** **`payload_ref`=`onboarding_webhook_jobs.id`**）/ **`matrix_93_d_onb_009_*`**（**96-09** **`claim_next_pending_onboarding_webhook_job`** **+** **`apply_onboarding_webhook_job_payload`** **独立 worker 路径**；**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** **`async_jobs`** **`pending`→`running`→`completed`**）/ **`matrix_93_d_onb_010_*`**（**96-09** **`requeue_stale_onboarding_webhook_jobs_processing`** **`processing`→`pending`**；**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** **段** **`async_jobs`** **对拍**）/ **`matrix_93_d_onb_011_*`**（**120 / 96-09** **`GET /metrics`** **`traveltrust_onboarding_webhook_*`** **gauge** **+** **`traveltrust_onboarding_*_requests_total`** **+** **`traveltrust_onboarding_http_responses_total`** **四路由** **`2xx`/`4xx`（401 等）**、**`quote`·`5xx`（503）** **单调**）/ **`matrix_93_d_onb_012_*`**（**96-09** **`requeue_onboarding_webhook_dlq_to_pending_jobs`** **DLQ** **`replayed_at`**；**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** **`async_jobs`** **`pending`**）/ **`matrix_93_d_onb_013_*`**（**Stripe** **`charge.refunded`** **全额** **`paid`→`refunded`** **幂等**）/ **`matrix_93_d_onb_014_*`**（**Stripe** **`charge.dispute.funds_withdrawn`** **`paid`→`revoked`** **`latest_charge`** **+** **幂等**）/ **`matrix_93_d_onb_015_*`**（**Stripe** **`charge.refunded`** **终态** **`refunded`/`revoked`** **下** **审计** **幂等**）/ **`matrix_93_d_onb_016_*`**（**Stripe** **`charge.dispute.funds_withdrawn`** **终态** **审计** **幂等**）/ **`matrix_93_d_onb_017_*`**（**Stripe** **`charge.refunded`** **部分** **`stripe_charge_refund_partial`** **审计** **+** **全额** **闭**）/ **`matrix_93_admin_onb_010_*`**（**70** **`GET …/admin/users/:id/onboarding-entitlements`** **PG**）/ **`matrix_93_admin_onb_011_*`**（**70** **`super_admin`** **`GET …/admin/onboarding/entitlements`** **与** **`admin`** **同权**）/ **`matrix_93_admin_onb_012_*`**（**70** **`GET …/admin/onboarding/webhook-{jobs,dlq}`** **`user_id`** **过滤**）/ **`matrix_93_admin_onb_013_*`**（**70** **`GET …/admin/onboarding/entitlements`** **全局列表** **`user_id`/`status`/`role_target`**）/ **`matrix_93_admin_onb_014_*`**（**70** **`GET …/admin/onboarding/entitlements/:id`** **单笔** **`metadata`**）/ **`matrix_93_admin_onb_015_*`**（**70** **`GET …/entitlements/:id/payment-events`** **+** **全局** **`GET …/onboarding/payment-events`** **`webhook`** **行**）/ **`matrix_93_admin_onb_016_*`**（**70** **`PATCH …/entitlements/:id`** **`metadata.admin`**）/ **`matrix_93_admin_onb_017_*`**（**70** **`POST …/revoke`** **`pending`→`revoked`** + **`admin_revoke`** **事件** **+** **全局** **`payment-events`** **`event_type=admin_revoke`**）/ **`matrix_93_admin_onb_018_*`**（**70** **`POST …/revoke`** **400** **`invalid_onboarding_entitlement_id`** / **`revoke_reason_required`**）/ **`matrix_93_admin_onb_019_*`**（**70** **`GET/PATCH …/entitlements/:id`**、**`GET …/payment-events`**、**`POST …/revoke`** **负例**：**400/404** **`invalid_*`**、**`admin_metadata_*`**、**`not_found`**）/ **`matrix_93_admin_onb_020_*`**（**70** **`GET …/admin/users/:id/onboarding-entitlements`** **`invalid_user_id`/`user_not_found`**；**全局** **`GET …/onboarding/payment-events`** **`event_type`** **空白忽略**、**`limit`** **钳位**、**`event_type`** **≤64**）/ **`matrix_93_admin_onb_021_*`**（**70** **`GET …/onboarding/entitlements`** **列表** **`user_id`/`status`/`role_target`/`limit`**；**96-09** **`webhook-jobs`/`webhook-dlq`**；**`compliance-audit-events`** **同源 query**）/ **`matrix_93_admin_onb_022_*`**（**70** **`limit`** **默认** **100**、**`≤0`/负** **→** **1**：**全局列表**、**全局/按单** **`payment-events`**、**`webhook-jobs`/`webhook-dlq`**、**`compliance-audit-events`**）/ **`matrix_93_admin_onb_023_*`**（**70** **`require_admin_actor`**：**会话用户** **未** 在 **`ChainOffStore`** **→** **401**；**非** **admin** **→** **403**；**全局** **`payment-events`** **`entitlement_id`** **仅空白** **→** **忽略**）/ **`matrix_93_admin_onb_024_*`**（**70** **`PATCH`** **`admin:null`** **→** **`admin_metadata_must_object`**；**全局** **`entitlements`** **`status`/`role_target`** **仅空白** **→** **`applied_filters`** **null**）/ **`matrix_93_admin_onb_025_*`**（**70** **`PATCH`/`POST revoke`** **JSON** **缺** **`admin`/`reason`** **→** **客户端错误** **400/422**）/ **`matrix_93_admin_onb_026_*`**（**70** **`super_admin`** **`webhook-jobs`/`webhook-dlq`/`compliance-audit-events`**；**`POST …/revoke`** **`reason`** **>4000** **字符** **→** **`metadata.admin.revoke_reason`** **截断** **4000**）/ **`matrix_93_admin_onb_027_*`**（**70** **`super_admin`** **`PATCH …/metadata.admin`** **+** **`POST …/revoke`** **写路径**）/ **`matrix_93_admin_onb_028_*`**（**70** **`GET …/admin/onboarding/compliance-audit-events`**：**`payment-intents`** **+** **`role-confirm`** **denylist** **403** **各** **1** **行**）/ **`matrix_93_admin_onb_029_*`** / **`030_*`**（**70** **`POST …/financial-reversal`** **`paid`→`refunded`**、**`admin_refund_recorded`** / **`admin_chargeback_recorded`**、**校验**）/ **`matrix_93_admin_onb_031_*`**（**70** **`GET …/admin/jobs`** **`queue_name=onboarding_webhook`** **+** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR`** **`async_jobs`**）/ **`matrix_93_d_onb_005_f036_ext_*`**（**`POST …/hooks/stripe/onboarding`** **`Stripe-Signature`** **`payment_intent.succeeded` → `paid`**，**合成** **`whsec_`**，**非** Stripe 真网）↔ **§8.2-EXT** **F-034～F-038**（**`spec/93-全站功能验证矩阵-域别回归清单.md`** **§8.4**）。
//!
//! **跳过条件**：**`it_db_pool::connect_migrated_pg_it_pool`** 失败（未设置 **`DATABASE_URL`** 或库未迁移）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::{DateTime, Utc};
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use std::io::Write;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
use crate::db::{
    apply_onboarding_webhook_job_payload, claim_next_pending_onboarding_webhook_job,
    claim_next_pending_onboarding_webhook_job_from_async_jobs,
    insert_onboarding_webhook_dlq, insert_onboarding_webhook_job, insert_session, insert_user,
    requeue_onboarding_webhook_dlq_to_pending_jobs, requeue_stale_onboarding_webhook_jobs_processing,
};
use crate::middleware::IdempotencyCache;
use crate::onboarding_counters::{HTTP_RESP_CLASS_NAMES, HTTP_RESP_ROUTE_NAMES};
use crate::router::app;
use crate::state::test_support::api_meta_state;

static ONBOARDING_APP_STACK_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    ONBOARDING_APP_STACK_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn app_stack_router(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

fn app_stack_router_seeded(pool: PgPool, store: ChainOffStore) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

/// **`ApiMetaState`** **无** **`chain_off`**（**`api_meta_state(None)`**）：**`GET …/onboarding/quote`** **→** **503** **`chain_off_unavailable`**；**`GET /metrics`** **仍** 用 **`app_stack_router`** **（有池）** **scrape**。
fn app_stack_router_chain_off_absent(pool: PgPool) -> Router {
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(None), idem, Some(pool))
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

async fn cleanup_onboarding_it_user(pool: &PgPool, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM onboarding_compliance_audit_events WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query(
        r#"
        DELETE FROM onboarding_webhook_dlq
        WHERE idempotency_key IN (
            SELECT idempotency_key FROM onboarding_entitlements
            WHERE user_id = $1 AND idempotency_key IS NOT NULL
        )
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        r#"
        DELETE FROM async_jobs
        WHERE queue_name = 'onboarding_webhook'
          AND job_type = 'onboarding_webhook_apply'
          AND idempotency_key IN (
            SELECT 'onboarding_webhook_job:' || j.id::text
            FROM onboarding_webhook_jobs j
            WHERE j.payload->>'idempotency_key' IN (
                SELECT idempotency_key FROM onboarding_entitlements
                WHERE user_id = $1 AND idempotency_key IS NOT NULL
            )
          )
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        r#"
        DELETE FROM onboarding_webhook_jobs
        WHERE payload->>'idempotency_key' IN (
            SELECT idempotency_key FROM onboarding_entitlements
            WHERE user_id = $1 AND idempotency_key IS NOT NULL
        )
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await;
    // `onboarding_*` FK → `users`; CASCADE 清理依赖删除顺序时，显式删事件更稳。
    let _ = sqlx::query(
        r#"
        DELETE FROM onboarding_payment_events
        WHERE entitlement_id IN (SELECT id FROM onboarding_entitlements WHERE user_id = $1)
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM onboarding_entitlements WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

/// **93 · B-ONB-QUOTE / F-034** → **§8.2-EXT**：**`GET /api/v1/onboarding/quote`** **`router::app`** **200** **stub**。
#[tokio::test]
async fn matrix_93_b_onb_001d_f034_get_onboarding_quote_provider_stub_200_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_001d_f034_get_onboarding_quote_provider_stub_200_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let app = app_stack_router(pool);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/quote?role=provider")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["meta"]["implementation_status"], "onboarding_quote_stub");
}

/// **93 · B-ONB-PAY / F-035** → **§8.2-EXT**：**`POST …/payment-intents`** **Bearer + PG + `Idempotency-Key`** → **200** **`onboarding_payment_intent_persisted`**（**PSP 字段仍为 null**，不冒充外网收单）。
#[tokio::test]
async fn matrix_93_b_onb_002c_f035_post_onboarding_payment_intents_bearer_persisted_200_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_002c_f035_post_onboarding_payment_intents_bearer_persisted_200_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_pay_{}", Uuid::new_v4());
    let idem = format!("idem_onb_pay_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-pay-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid).await;
    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(
        v["meta"]["implementation_status"],
        "onboarding_payment_intent_persisted"
    );
    assert!(v["entitlement_id"].as_str().is_some() || !v["entitlement_id"].is_null());
    assert_eq!(v["idempotency_key"], idem);
    assert!(v["psp"]["client_secret"].is_null());
    assert!(v["psp"]["checkout_url"].is_null());
}

/// **93 · B-ONB-PAY / F-035** → **§8.2-EXT**：**`Idempotency-Key`** 过长 → **400** **`invalid_onboarding_idempotency_key`**（**不**写库）。
#[tokio::test]
async fn matrix_93_b_onb_002e_f035_post_onboarding_payment_intents_idempotency_key_too_long_400_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_002e_f035_post_onboarding_payment_intents_idempotency_key_too_long_400_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_idem_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-idem-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let long_idem = "x".repeat(300);
    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &long_idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid).await;
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = response_json(res).await;
    assert_eq!(v["error"], "invalid_onboarding_idempotency_key");
}

/// **93 · B-ONB-ENT / F-037** → **§8.2-EXT**：**`GET …/entitlements/me`** **Bearer** → **200** **空** **`entitlements`**。
#[tokio::test]
async fn matrix_93_b_onb_003c_f037_get_onboarding_entitlements_me_bearer_empty_ok_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_003c_f037_get_onboarding_entitlements_me_bearer_empty_ok_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_ent_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-ent-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid).await;
    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert!(v["entitlements"].as_array().unwrap().is_empty());
    assert_eq!(v["meta"]["implementation_status"], "onboarding_entitlements_db");
}

/// **93 · B-ONB-ROLE / F-038** → **§8.2-EXT**：**`POST …/role-confirm`** **Bearer** → **400** **`onboarding_entitlement_required`**。
#[tokio::test]
async fn matrix_93_b_onb_004b_f038_post_onboarding_role_confirm_entitlement_required_400_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_004b_f038_post_onboarding_role_confirm_entitlement_required_400_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_role_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-role-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid).await;
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = response_json(res).await;
    assert_eq!(v["error"], "onboarding_entitlement_required");
}

/// **93 · D-ONB-WEB / F-036** → **§8.2-EXT**：**`chain_off.db_pool` 已挂** 时 **合法 JSON**、**未知** **`idempotency_key`** → **400** **`onboarding_webhook_unknown_idempotency_key`**（**不**与无池 stub 混为一谈）。
#[tokio::test]
async fn matrix_93_d_onb_002_f036_post_internal_onboarding_webhook_unknown_idempotency_400_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_002_f036_post_internal_onboarding_webhook_unknown_idempotency_400_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let app = app_stack_router(pool);
    let body = json!({
        "schema_version": 1u32,
        "idempotency_key": format!("unknown_idem_{}", Uuid::new_v4()),
        "provider_event_id": "evt_it_unknown",
        "outcome": "succeeded"
    });
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = response_json(res).await;
    assert_eq!(
        v["error"],
        "onboarding_webhook_unknown_idempotency_key"
    );
}

/// **93 · D-ONB-WEB / F-036** → **§8.2-EXT**：**webhook** JSON **`idempotency_key`** **>256** UTF-8 **字节** → **400** **`invalid_onboarding_idempotency_key`**（**不**写库；与 **payment-intents** 头上限对齐）。
#[tokio::test]
async fn matrix_93_d_onb_004_f036_post_internal_onboarding_webhook_idempotency_key_too_long_400_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_004_f036_post_internal_onboarding_webhook_idempotency_key_too_long_400_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let app = app_stack_router(pool);
    let long_idem = "a".repeat(257);
    let body = json!({
        "schema_version": 1u32,
        "idempotency_key": long_idem,
        "provider_event_id": "evt_it_len",
        "outcome": "succeeded"
    });
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = response_json(res).await;
    assert_eq!(v["error"], "invalid_onboarding_idempotency_key");
}

/// **93 · B-ONB-PAY / F-035** → **§8.2-EXT**：**`Idempotency-Key`** 已被 **用户 A** 占用时 **用户 B** **同键** → **409** **`onboarding_idempotency_conflict`**。
#[tokio::test]
async fn matrix_93_b_onb_005_f035_post_onboarding_payment_intents_idempotency_conflict_409_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_005_f035_post_onboarding_payment_intents_idempotency_conflict_409_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let shared_idem = format!("idem_conflict_{}", Uuid::new_v4());
    let uid_a = Uuid::new_v4();
    let uid_b = Uuid::new_v4();
    let tok_a = format!("tts_cf_a_{}", Uuid::new_v4());
    let tok_b = format!("tts_cf_b_{}", Uuid::new_v4());
    let now = Utc::now();
    let em_a = format!("cf-a-{uid_a}@traveltrust.test");
    let em_b = format!("cf-b-{uid_b}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid_a).await;
    cleanup_onboarding_it_user(&pool, uid_b).await;
    insert_user(
        &pool, uid_a, &em_a, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_user(
        &pool, uid_b, &em_b, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &tok_a, uid_a).await.expect("insert_session");
    insert_session(&pool, &tok_b, uid_b).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res_a = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&tok_a))
                .header("Idempotency-Key", &shared_idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_a.status(), StatusCode::OK);

    let res_b = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&tok_b))
                .header("Idempotency-Key", &shared_idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid_a).await;
    cleanup_onboarding_it_user(&pool, uid_b).await;
    assert_eq!(res_b.status(), StatusCode::CONFLICT);
    let v = response_json(res_b).await;
    assert_eq!(v["error"], "onboarding_idempotency_conflict");
}

/// **93 · B-ONB-PAY / F-035** → **§8.2-EXT**：**`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** 子串命中 → **403** **`onboarding_forbidden_sanctions`**。
#[tokio::test]
async fn matrix_93_b_onb_006_f035_post_onboarding_payment_intents_compliance_denylist_403_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006_f035_post_onboarding_payment_intents_compliance_denylist_403_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_DENYLIST",
        "__tt_onb_compliance_marker__",
    );
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_den_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("u__tt_onb_compliance_marker__-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let req_id = format!("req-onb-deny-{}", Uuid::new_v4());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("x-request-id", &req_id)
                .header("Idempotency-Key", format!("idem_den_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    match prev {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(v["error"], "onboarding_forbidden_sanctions");
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM onboarding_compliance_audit_events WHERE user_id = $1 AND request_id = $2 AND route = $3",
    )
    .bind(uid)
    .bind(&req_id)
    .bind("POST /api/v1/onboarding/payment-intents")
    .fetch_one(&pool)
    .await
    .expect("count compliance audit");
    assert_eq!(n, 1, "expected one onboarding_compliance_audit_events row");
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-ROLE / F-038** → **§8.2-EXT**：**`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** 子串命中 **`POST …/role-confirm`** → **403** **`onboarding_forbidden_sanctions`** + **`onboarding_compliance_audit_events`**（**`route`** **=** **`POST /api/v1/onboarding/role-confirm`**）。
#[tokio::test]
async fn matrix_93_b_onb_006b_f038_post_onboarding_role_confirm_compliance_denylist_403_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006b_f038_post_onboarding_role_confirm_compliance_denylist_403_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_DENYLIST",
        "__tt_onb_compliance_marker__",
    );
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_den_rc_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("u__tt_onb_compliance_marker__-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let req_id = format!("req-onb-deny-rc-{}", Uuid::new_v4());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("x-request-id", &req_id)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    match prev {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(v["error"], "onboarding_forbidden_sanctions");
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM onboarding_compliance_audit_events WHERE user_id = $1 AND request_id = $2 AND route = $3",
    )
    .bind(uid)
    .bind(&req_id)
    .bind("POST /api/v1/onboarding/role-confirm")
    .fetch_one(&pool)
    .await
    .expect("count compliance audit role-confirm");
    assert_eq!(n, 1, "expected one onboarding_compliance_audit_events row for role-confirm");
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **批次 B**：**`ONBOARDING_COMPLIANCE_SCREENING_MODE=off`** 时 **跳过** **`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** → **200**（**非** OFAC）。
#[tokio::test]
async fn matrix_93_b_onb_006c_f035_screening_off_skips_denylist_200_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006c_f035_screening_off_skips_denylist_200_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_DENYLIST",
        "__tt_onb_compliance_marker__",
    );
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "off");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_off_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("u__tt_onb_compliance_marker__-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_off_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    assert_eq!(status, StatusCode::OK);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **批次 B**：**`ONBOARDING_COMPLIANCE_SCREENING_MODE=stub_reject_all`** → **403** **+** **`onboarding_compliance_audit_events`**（**无意** **denylist**）。
#[tokio::test]
async fn matrix_93_b_onb_006d_f035_stub_reject_all_403_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006d_f035_stub_reject_all_403_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "stub_reject_all");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stub_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-clean-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let req_id = format!("req-onb-stub-{}", Uuid::new_v4());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("x-request-id", &req_id)
                .header("Idempotency-Key", format!("idem_stub_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(v["error"], "onboarding_forbidden_sanctions");
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM onboarding_compliance_audit_events WHERE user_id = $1 AND request_id = $2 AND route = $3",
    )
    .bind(uid)
    .bind(&req_id)
    .bind("POST /api/v1/onboarding/payment-intents")
    .fetch_one(&pool)
    .await
    .expect("count compliance audit stub");
    assert_eq!(n, 1, "expected one onboarding_compliance_audit_events row (stub)");
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **`list_file`**：**名单文件** **整邮命中** → **403** **`onboarding_forbidden_sanctions`** **+** **审计**。
#[tokio::test]
async fn matrix_93_b_onb_006e_f035_list_file_hit_403_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006e_f035_list_file_hit_403_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-blocked-{uid}@traveltrust.test");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list_{uid}.txt"));
    std::fs::write(&list_path, format!("{email}\n# comment\n")).expect("write list file");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let req_id = format!("req-onb-lf-{}", Uuid::new_v4());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("x-request-id", &req_id)
                .header("Idempotency-Key", format!("idem_lf_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(v["error"], "onboarding_forbidden_sanctions");
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM onboarding_compliance_audit_events WHERE user_id = $1 AND request_id = $2 AND route = $3",
    )
    .bind(uid)
    .bind(&req_id)
    .bind("POST /api/v1/onboarding/payment-intents")
    .fetch_one(&pool)
    .await
    .expect("count compliance audit list_file");
    assert_eq!(n, 1, "expected one onboarding_compliance_audit_events row (list_file)");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **`list_file`**：**未命中** → **200**。
#[tokio::test]
async fn matrix_93_b_onb_006f_f035_list_file_miss_200_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006f_f035_list_file_miss_200_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf2_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-clean-{uid}@traveltrust.test");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list2_{uid}.txt"));
    std::fs::write(&list_path, "other-person@blocked.example\n").expect("write list file");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_lf2_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    assert_eq!(status, StatusCode::OK);
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **`list_file`**：**名单路径缺失** → **503** **`onboarding_compliance_screening_unavailable`**。
#[tokio::test]
async fn matrix_93_b_onb_006g_f035_list_file_missing_path_503_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006g_f035_list_file_missing_path_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let ghost = std::env::temp_dir().join(format!("tt_onb_list_missing_{}.txt", Uuid::new_v4()));
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        ghost.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf3_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-ghost-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_lf3_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **`list_file`**：**名单文件超字节上限（>512KiB）** → **503** **`onboarding_compliance_screening_unavailable`**（与 **`routes/onboarding/mod.rs`** **`ONBOARDING_COMPLIANCE_LIST_FILE_MAX_BYTES`** **对拍**）。
#[tokio::test]
async fn matrix_93_b_onb_006j_f035_list_file_oversized_bytes_503_app_stack_ok_pg() {
    const LIST_MAX_BYTES: usize = 512 * 1024;
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006j_f035_list_file_oversized_bytes_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list_oversz_{}.txt", Uuid::new_v4()));
    let blob = vec![b'0'; LIST_MAX_BYTES + 1];
    std::fs::write(&list_path, blob).expect("write oversized list file");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_j_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-oversz-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_lf_j_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **`list_file`**：**名单行数 >100k** → **503** **`onboarding_compliance_screening_unavailable`**（与 **`routes/onboarding/mod.rs`** **`ONBOARDING_COMPLIANCE_LIST_FILE_MAX_LINES`** **对拍**）。
#[tokio::test]
async fn matrix_93_b_onb_006l_f035_list_file_too_many_lines_503_app_stack_ok_pg() {
    const LIST_MAX_LINES: usize = 100_000;
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006l_f035_list_file_too_many_lines_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list_manyln_{}.txt", Uuid::new_v4()));
    {
        let f = std::fs::File::create(&list_path).expect("create list file");
        let mut w = std::io::BufWriter::with_capacity(256 * 1024, f);
        for _ in 0..LIST_MAX_LINES + 1 {
            writeln!(w, "a").expect("write list line");
        }
        w.flush().expect("flush list file");
    }
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_l_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-manyln-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_lf_l_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **`list_file`**：**名单文件非合法 UTF-8** → **503** **`onboarding_compliance_screening_unavailable`**（**`read_to_string`** **失败**）。
#[tokio::test]
async fn matrix_93_b_onb_006n_f035_list_file_invalid_utf8_503_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006n_f035_list_file_invalid_utf8_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list_badutf8_{}.txt", Uuid::new_v4()));
    std::fs::write(&list_path, [0xffu8, 0xfeu8, 0xfdu8]).expect("write invalid utf-8 list file");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_n_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-badutf8-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_lf_n_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-ROLE / F-038** → **`list_file`**：**`POST …/role-confirm`** **整邮命中** → **403** **+** **`onboarding_compliance_audit_events`**（**`route`** **=** **`role-confirm`**）。
#[tokio::test]
async fn matrix_93_b_onb_006h_f038_post_onboarding_role_confirm_list_file_hit_403_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006h_f038_post_onboarding_role_confirm_list_file_hit_403_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_rc_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-rc-blocked-{uid}@traveltrust.test");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list_rc_{uid}.txt"));
    std::fs::write(&list_path, format!("{email}\n")).expect("write list file");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let req_id = format!("req-onb-lf-rc-{}", Uuid::new_v4());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("x-request-id", &req_id)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(v["error"], "onboarding_forbidden_sanctions");
    let n: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM onboarding_compliance_audit_events WHERE user_id = $1 AND request_id = $2 AND route = $3",
    )
    .bind(uid)
    .bind(&req_id)
    .bind("POST /api/v1/onboarding/role-confirm")
    .fetch_one(&pool)
    .await
    .expect("count compliance audit role-confirm list_file");
    assert_eq!(n, 1, "expected one onboarding_compliance_audit_events row (role-confirm list_file)");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-ROLE / F-038** → **`list_file`**：**名单路径缺失** → **503** **`onboarding_compliance_screening_unavailable`**（**`POST …/role-confirm`**，**不**写 **`onboarding_compliance_audit_events`**）。
#[tokio::test]
async fn matrix_93_b_onb_006i_f038_post_onboarding_role_confirm_list_file_missing_path_503_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006i_f038_post_onboarding_role_confirm_list_file_missing_path_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let ghost = std::env::temp_dir().join(format!("tt_onb_list_rc_missing_{}.txt", Uuid::new_v4()));
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        ghost.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_rc3_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-rc-ghost-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-ROLE / F-038** → **`list_file`**：**名单文件超字节上限（>512KiB）** → **503** **`onboarding_compliance_screening_unavailable`**（**`POST …/role-confirm`**）。
#[tokio::test]
async fn matrix_93_b_onb_006k_f038_post_onboarding_role_confirm_list_file_oversized_bytes_503_app_stack_ok_pg(
) {
    const LIST_MAX_BYTES: usize = 512 * 1024;
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006k_f038_post_onboarding_role_confirm_list_file_oversized_bytes_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let list_path = std::env::temp_dir().join(format!("tt_onb_list_rc_oversz_{}.txt", Uuid::new_v4()));
    let blob = vec![b'1'; LIST_MAX_BYTES + 1];
    std::fs::write(&list_path, blob).expect("write oversized list file");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_k_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-rc-oversz-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-ROLE / F-038** → **`list_file`**：**名单行数 >100k** → **503** **`onboarding_compliance_screening_unavailable`**（**`POST …/role-confirm`**）。
#[tokio::test]
async fn matrix_93_b_onb_006m_f038_post_onboarding_role_confirm_list_file_too_many_lines_503_app_stack_ok_pg(
) {
    const LIST_MAX_LINES: usize = 100_000;
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006m_f038_post_onboarding_role_confirm_list_file_too_many_lines_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let list_path =
        std::env::temp_dir().join(format!("tt_onb_list_rc_manyln_{}.txt", Uuid::new_v4()));
    {
        let f = std::fs::File::create(&list_path).expect("create list file");
        let mut w = std::io::BufWriter::with_capacity(256 * 1024, f);
        for _ in 0..LIST_MAX_LINES + 1 {
            writeln!(w, "b").expect("write list line");
        }
        w.flush().expect("flush list file");
    }
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_m_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-rc-manyln-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-ROLE / F-038** → **`list_file`**：**名单文件非合法 UTF-8** → **503** **`onboarding_compliance_screening_unavailable`**（**`POST …/role-confirm`**）。
#[tokio::test]
async fn matrix_93_b_onb_006o_f038_post_onboarding_role_confirm_list_file_invalid_utf8_503_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_006o_f038_post_onboarding_role_confirm_list_file_invalid_utf8_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_deny = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    let prev_mode = std::env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE").ok();
    let prev_list = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE").ok();
    let _ = std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST");
    std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", "list_file");
    let list_path =
        std::env::temp_dir().join(format!("tt_onb_list_rc_badutf8_{}.txt", Uuid::new_v4()));
    std::fs::write(&list_path, [0xc3u8, 0x28u8]).expect("write invalid utf-8 list file (lone trail)");
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE",
        list_path.to_string_lossy().as_ref(),
    );

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_lf_o_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("lf-rc-badutf8-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let status = res.status();
    let v = response_json(res).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_compliance_screening_unavailable");
    match prev_deny {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    match prev_mode {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_SCREENING_MODE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_SCREENING_MODE", p),
    }
    match prev_list {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE", p),
    }
    let _ = std::fs::remove_file(&list_path);
    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · B-ONB-PAY / F-035** → **§8.2-EXT**：**`ONBOARDING_PAYMENT_INTENTS_DISABLED=1`** → **503** **`onboarding_payment_intents_disabled`**。
#[tokio::test]
async fn matrix_93_b_onb_007_f035_post_onboarding_payment_intents_kill_switch_503_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_onb_007_f035_post_onboarding_payment_intents_kill_switch_503_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev = std::env::var("ONBOARDING_PAYMENT_INTENTS_DISABLED").ok();
    std::env::set_var("ONBOARDING_PAYMENT_INTENTS_DISABLED", "1");
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_kill_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-kill-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", format!("idem_kill_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid).await;
    let status = res.status();
    let v = response_json(res).await;
    match prev {
        None => std::env::remove_var("ONBOARDING_PAYMENT_INTENTS_DISABLED"),
        Some(p) => std::env::set_var("ONBOARDING_PAYMENT_INTENTS_DISABLED", p),
    }
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(v["error"], "onboarding_payment_intents_disabled");
}

/// **93 · D-ONB-WEB / F-036** → **§8.2-EXT**：**payment-intents** → **internal webhook** → **role-confirm** 最小闭环（**PG**；**仍无** 外网 PSP）。
#[tokio::test]
async fn matrix_93_d_onb_003_f036_onboarding_pay_webhook_role_e2e_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_003_f036_onboarding_pay_webhook_role_e2e_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let token = format!("tts_onb_e2e_{}", Uuid::new_v4());
    let idem = format!("idem_onb_e2e_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-e2e-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let pay = response_json(res).await;
    let entitlement_id = pay["entitlement_id"].as_str().expect("entitlement_id");

    let hook = json!({
        "schema_version": 1u32,
        "idempotency_key": idem,
        "provider_event_id": "evt_e2e_1",
        "outcome": "succeeded"
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(hook.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let wh = response_json(res).await;
    assert_eq!(wh.get("accepted"), Some(&serde_json::Value::Bool(true)));

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(hook.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let wh2 = response_json(res).await;
    assert_eq!(wh2.get("accepted"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(wh2.get("duplicate"), Some(&serde_json::Value::Bool(true)));

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let ent = response_json(res).await;
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| {
            e["id"].as_str() == Some(entitlement_id) && e["status"] == "paid"
        }),
        "expected paid entitlement in list: {:?}",
        ent
    );

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    cleanup_onboarding_it_user(&pool, uid).await;
    assert_eq!(res.status(), StatusCode::OK);
    let role = response_json(res).await;
    assert_eq!(role["role"], "provider");
    assert_eq!(role.get("updated"), Some(&serde_json::Value::Bool(true)));
    assert_eq!(
        role["meta"]["implementation_status"],
        "onboarding_role_confirm_db"
    );
}

/// **93 · D-ONB-WEB / F-036** → **96-09**：**`ONBOARDING_WEBHOOK_ASYNC_QUEUE=1`** 且默认 **内联 drain** → HTTP **200** 与无队列一致；**`onboarding_webhook_jobs`** 终态 **`done`/`accepted`**。
#[tokio::test]
async fn matrix_93_d_onb_008_f036_onboarding_webhook_async_inline_queue_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_008_f036_onboarding_webhook_async_inline_queue_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_async = std::env::var("ONBOARDING_WEBHOOK_ASYNC_QUEUE").ok();
    let prev_inline = std::env::var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE", "1");
    let _ = std::env::remove_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_q_{}", Uuid::new_v4());
    let idem = format!("idem_onb_queue_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-queue-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let hook = json!({
        "schema_version": 1u32,
        "idempotency_key": idem,
        "provider_event_id": "evt_queue_inline_1",
        "outcome": "succeeded"
    });
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(hook.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    let status = res.status();
    let wh = response_json(res).await;

    let row: Option<(String, String)> = sqlx::query_as(
        r#"
        SELECT status::text, COALESCE(resolution, '')::text
        FROM onboarding_webhook_jobs
        WHERE payload->>'idempotency_key' = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(&idem)
    .fetch_optional(&pool)
    .await
    .expect("query job");

    cleanup_onboarding_it_user(&pool, uid).await;

    match prev_async {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE", p),
    }
    match prev_inline {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN", p),
    }

    assert_eq!(status, StatusCode::OK);
    assert_eq!(wh.get("accepted"), Some(&serde_json::Value::Bool(true)));
    let Some((st, resol)) = row else {
        panic!("expected onboarding_webhook_jobs row for idem={idem}");
    };
    assert_eq!(st, "done");
    assert_eq!(resol, "accepted");
}

/// **93 · D-ONB-WEB / F-036** → **250 / `ONBOARDING_WEBHOOK_ASYNC_JOBS_MIGRATION_NOTES` 阶段 1**：**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 时 **`async_jobs`** 行与 **`onboarding_webhook_jobs.id`** 对拍。
#[tokio::test]
async fn matrix_93_d_onb_008b_f036_onboarding_webhook_async_jobs_mirror_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_008b_f036_onboarding_webhook_async_jobs_mirror_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };
    let prev_async = std::env::var("ONBOARDING_WEBHOOK_ASYNC_QUEUE").ok();
    let prev_inline = std::env::var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN").ok();
    let prev_mirror = std::env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE", "1");
    let _ = std::env::remove_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN");
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", "1");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_qm_{}", Uuid::new_v4());
    let idem = format!("idem_onb_mirror_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-mirror-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let hook = json!({
        "schema_version": 1u32,
        "idempotency_key": idem,
        "provider_event_id": "evt_queue_mirror_1",
        "outcome": "succeeded"
    });
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(hook.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    let status = res.status();
    let wh = response_json(res).await;

    let job_id: Uuid = sqlx::query_scalar(
        r#"
        SELECT id FROM onboarding_webhook_jobs
        WHERE payload->>'idempotency_key' = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(&idem)
    .fetch_one(&pool)
    .await
    .expect("job id");

    let mirror: Option<(String, String, String, String)> = sqlx::query_as(
        r#"
        SELECT queue_name::text, job_type::text, status::text, payload_ref
        FROM async_jobs
        WHERE idempotency_key = $1
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .fetch_optional(&pool)
    .await
    .expect("async_jobs mirror");

    cleanup_onboarding_it_user(&pool, uid).await;

    match prev_async {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE", p),
    }
    match prev_inline {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN", p),
    }
    match prev_mirror {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", p),
    }

    assert_eq!(status, StatusCode::OK);
    assert_eq!(wh.get("accepted"), Some(&serde_json::Value::Bool(true)));
    let Some((qn, jt, st, pref)) = mirror else {
        panic!("expected async_jobs mirror row for job_id={job_id}");
    };
    assert_eq!(qn, "onboarding_webhook");
    assert_eq!(jt, "onboarding_webhook_apply");
    assert_eq!(st, "completed");
    assert_eq!(pref, job_id.to_string());
}

/// **93 · D-ONB-WEB / F-036** → **96-09**：**`claim_next_pending_onboarding_webhook_job`** + **`apply_onboarding_webhook_job_payload`**（**`traveltrust-api onboarding-webhook-worker`** 同源；**`FOR UPDATE SKIP LOCKED`**）。
#[tokio::test]
async fn matrix_93_d_onb_009_standalone_webhook_worker_claim_apply_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_009_standalone_webhook_worker_claim_apply_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_mirror = std::env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", "1");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_worker_{}", Uuid::new_v4());
    let idem = format!("idem_onb_worker_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-worker-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let payload = json!({
        "schema_version": 1u32,
        "idempotency_key": &idem,
        "provider_event_id": "evt_standalone_worker_1",
        "outcome": "succeeded"
    });
    let job_id = insert_onboarding_webhook_job(&pool, &payload)
        .await
        .expect("insert_onboarding_webhook_job");

    let st0: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .bind(job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs after insert");
    assert_eq!(st0, "pending");

    let claimed = claim_next_pending_onboarding_webhook_job(&pool)
        .await
        .expect("claim_next_pending_onboarding_webhook_job");
    let Some((cid, pay)) = claimed else {
        panic!("expected a pending job row for idem={idem}");
    };
    assert_eq!(cid, job_id);

    let st1: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .bind(job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs after claim");
    assert_eq!(st1, "running");

    apply_onboarding_webhook_job_payload(&pool, cid, &pay)
        .await
        .expect("apply_onboarding_webhook_job_payload");

    let st2: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .bind(job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs after apply");
    assert_eq!(st2, "completed");

    let row: (String, String) = sqlx::query_as(
        r#"
        SELECT status::text, COALESCE(resolution, '')::text
        FROM onboarding_webhook_jobs
        WHERE id = $1
        "#,
    )
    .bind(job_id)
    .fetch_one(&pool)
    .await
    .expect("query job");
    assert_eq!(row.0, "done");
    assert_eq!(row.1, "accepted");

    let none_left = claim_next_pending_onboarding_webhook_job(&pool)
        .await
        .expect("claim tail");
    assert!(none_left.is_none());

    match prev_mirror {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", p),
    }

    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · D-ONB-WEB / F-036** → **250 阶段 2**：**`claim_next_pending_onboarding_webhook_job_from_async_jobs`** — **`async_jobs`** **先行** **`SKIP LOCKED`** **与** **域表** **`pending`→`processing`/`running`**（**`traveltrust-api onboarding-webhook-worker`** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1`** **同源**）。
#[tokio::test]
async fn matrix_93_d_onb_009b_async_jobs_primary_claim_apply_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_009b_async_jobs_primary_claim_apply_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_mirror = std::env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", "1");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_primary_{}", Uuid::new_v4());
    let idem = format!("idem_onb_primary_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-primary-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let payload = json!({
        "schema_version": 1u32,
        "idempotency_key": &idem,
        "provider_event_id": "evt_async_primary_1",
        "outcome": "succeeded"
    });
    let job_id = insert_onboarding_webhook_job(&pool, &payload)
        .await
        .expect("insert_onboarding_webhook_job");

    let st0: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .bind(job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs after insert");
    assert_eq!(st0, "pending");

    let claimed = claim_next_pending_onboarding_webhook_job_from_async_jobs(&pool)
        .await
        .expect("claim_next_pending_onboarding_webhook_job_from_async_jobs");
    let Some((cid, pay)) = claimed else {
        panic!("expected async_jobs-primary claim for idem={idem}");
    };
    assert_eq!(cid, job_id);

    let st1: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .bind(job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs after primary claim");
    assert_eq!(st1, "running");

    apply_onboarding_webhook_job_payload(&pool, cid, &pay)
        .await
        .expect("apply_onboarding_webhook_job_payload");

    let st2: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .bind(job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs after apply");
    assert_eq!(st2, "completed");

    let row: (String, String) = sqlx::query_as(
        r#"
        SELECT status::text, COALESCE(resolution, '')::text
        FROM onboarding_webhook_jobs
        WHERE id = $1
        "#,
    )
    .bind(job_id)
    .fetch_one(&pool)
    .await
    .expect("query job");
    assert_eq!(row.0, "done");
    assert_eq!(row.1, "accepted");

    let none_left = claim_next_pending_onboarding_webhook_job_from_async_jobs(&pool)
        .await
        .expect("claim tail from async");
    assert!(none_left.is_none());

    match prev_mirror {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", p),
    }

    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · D-ONB-WEB / F-036** → **96-09**：**`requeue_stale_onboarding_webhook_jobs_processing`** — **`processing`** 过久 → **`pending`**（**`onboarding-webhook-worker`** 每轮前置；**`ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS`**）。
#[tokio::test]
async fn matrix_93_d_onb_010_stale_processing_requeue_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_010_stale_processing_requeue_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_mirror = std::env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", "1");

    let payload = json!({
        "schema_version": 1u32,
        "idempotency_key": format!("idem_stale_{}", Uuid::new_v4()),
        "provider_event_id": "evt_stale_1",
        "outcome": "succeeded"
    });
    let job_id = insert_onboarding_webhook_job(&pool, &payload)
        .await
        .expect("insert_onboarding_webhook_job stale");
    sqlx::query(
        "UPDATE onboarding_webhook_jobs SET status = 'processing', updated_at = now() - interval '45 minutes' WHERE id = $1",
    )
    .bind(job_id)
    .execute(&pool)
    .await
    .expect("mark stale processing");

    let n = requeue_stale_onboarding_webhook_jobs_processing(&pool, 120)
        .await
        .expect("requeue stale");
    assert_eq!(n, 1u64);

    let st: String = sqlx::query_scalar("SELECT status::text FROM onboarding_webhook_jobs WHERE id = $1")
        .bind(job_id)
        .fetch_one(&pool)
        .await
        .expect("select status after requeue");
    assert_eq!(st, "pending");

    let aj: (String, String) = sqlx::query_as(
        r#"
        SELECT status::text, COALESCE(last_error, '')::text
        FROM async_jobs
        WHERE idempotency_key = $1
        "#,
    )
    .bind(format!("onboarding_webhook_job:{job_id}"))
    .fetch_one(&pool)
    .await
    .expect("async_jobs after stale requeue");
    assert_eq!(aj.0, "pending");
    assert_eq!(aj.1, "stale_processing_requeued");

    match prev_mirror {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", p),
    }

    let payload2 = json!({
        "schema_version": 1u32,
        "idempotency_key": format!("idem_fresh_{}", Uuid::new_v4()),
        "provider_event_id": "evt_fresh_1",
        "outcome": "succeeded"
    });
    let job2 = insert_onboarding_webhook_job(&pool, &payload2)
        .await
        .expect("insert fresh job");
    sqlx::query("UPDATE onboarding_webhook_jobs SET status = 'processing', updated_at = now() WHERE id = $1")
        .bind(job2)
        .execute(&pool)
        .await
        .expect("mark fresh processing");

    let n2 = requeue_stale_onboarding_webhook_jobs_processing(&pool, 3600)
        .await
        .expect("requeue should skip fresh");
    assert_eq!(n2, 0u64);
    let st2: String = sqlx::query_scalar("SELECT status::text FROM onboarding_webhook_jobs WHERE id = $1")
        .bind(job2)
        .fetch_one(&pool)
        .await
        .expect("select fresh status");
    assert_eq!(st2, "processing");

    for jid in [job_id, job2] {
        let _ = sqlx::query("DELETE FROM async_jobs WHERE idempotency_key = $1")
            .bind(format!("onboarding_webhook_job:{jid}"))
            .execute(&pool)
            .await;
    }
    let _ = sqlx::query("DELETE FROM onboarding_webhook_jobs WHERE id = $1")
        .bind(job_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM onboarding_webhook_jobs WHERE id = $1")
        .bind(job2)
        .execute(&pool)
        .await;
}

/// **93 · D-ONB-WEB / F-036** → **96-09**：**`requeue_onboarding_webhook_dlq_to_pending_jobs`** — **DLQ** **`raw_body` → `onboarding_webhook_jobs`**（**`pending`**）+ **`replayed_at`**；与 **`ONBOARDING_WEBHOOK_DLQ_AUTO_REPLAY`** **worker** 同源。
#[tokio::test]
async fn matrix_93_d_onb_012_dlq_requeue_to_pending_jobs_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_012_dlq_requeue_to_pending_jobs_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_mirror = std::env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", "1");

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_dlq_replay_{}", Uuid::new_v4());
    let idem = format!("idem_dlq_replay_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-dlq-replay-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let raw_body = json!({
        "schema_version": 1u32,
        "idempotency_key": &idem,
        "provider_event_id": "evt_dlq_replay_1",
        "outcome": "succeeded"
    });
    insert_onboarding_webhook_dlq(
        &pool,
        idem.trim(),
        "evt_dlq_replay_1",
        "succeeded",
        &raw_body,
        "simulated_db_failure_for_dlq_replay_it",
    )
    .await
    .expect("insert_onboarding_webhook_dlq");

    sqlx::query(
        r#"
        UPDATE onboarding_webhook_dlq
        SET created_at = now() - interval '20 minutes'
        WHERE idempotency_key = $1 AND replayed_at IS NULL
        "#,
    )
    .bind(&idem)
    .execute(&pool)
    .await
    .expect("age dlq row");

    let n = requeue_onboarding_webhook_dlq_to_pending_jobs(&pool, 120, 10)
        .await
        .expect("requeue dlq");
    assert_eq!(n, 1u64);

    let replay_job_id: Uuid = sqlx::query_scalar(
        r#"
        SELECT id FROM onboarding_webhook_jobs
        WHERE payload->>'idempotency_key' = $1 AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(&idem)
    .fetch_one(&pool)
    .await
    .expect("replay pending job id");
    let mirror_st: String = sqlx::query_scalar(
        r#"
        SELECT status::text FROM async_jobs
        WHERE idempotency_key = $1 AND payload_ref = $2
        "#,
    )
    .bind(format!("onboarding_webhook_job:{replay_job_id}"))
    .bind(replay_job_id.to_string())
    .fetch_one(&pool)
    .await
    .expect("async_jobs mirror after dlq replay");
    assert_eq!(mirror_st, "pending");

    let replayed: Option<DateTime<Utc>> = sqlx::query_scalar(
        "SELECT replayed_at FROM onboarding_webhook_dlq WHERE idempotency_key = $1",
    )
    .bind(&idem)
    .fetch_one(&pool)
    .await
    .expect("select replayed_at");
    assert!(replayed.is_some(), "expected replayed_at set");

    let n2 = requeue_onboarding_webhook_dlq_to_pending_jobs(&pool, 120, 10)
        .await
        .expect("requeue dlq second call");
    assert_eq!(n2, 0u64, "already replayed row must not re-enqueue");

    let claimed = claim_next_pending_onboarding_webhook_job(&pool)
        .await
        .expect("claim after dlq replay");
    let Some((job_id, pay)) = claimed else {
        panic!("expected pending job from dlq replay");
    };
    apply_onboarding_webhook_job_payload(&pool, job_id, &pay)
        .await
        .expect("apply replayed job");

    let st_ent: String = sqlx::query_scalar(
        "SELECT status::text FROM onboarding_entitlements WHERE idempotency_key = $1",
    )
    .bind(&idem)
    .fetch_one(&pool)
    .await
    .expect("ent status");
    assert_eq!(st_ent, "paid");

    match prev_mirror {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", p),
    }

    cleanup_onboarding_it_user(&pool, uid).await;
}

/// **93 · 120 / F-036** → **96-09**：**`GET /metrics`** 暴露 **`traveltrust_onboarding_webhook_jobs_{pending,processing,done,dead}`**、**`traveltrust_onboarding_webhook_dlq_total`**、**`traveltrust_onboarding_webhook_dlq_unreplayed`**（**`replayed_at IS NULL`**；**PG** 池挂载时 **≥0**）；**96-18** **`traveltrust_onboarding_*_requests_total`**、**`traveltrust_onboarding_http_responses_total{{route,status_class}}`** 与 **四路由** **2xx/4xx**（**401** **等**）**+** **`quote`·`5xx`**（**`chain_off` 未挂载** **→503** **`chain_off_unavailable`**）**单调**。
#[tokio::test]
async fn matrix_93_d_onb_011_metrics_onboarding_webhook_queue_gauges_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_011_metrics_onboarding_webhook_queue_gauges_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let parse_i = |text: &str, prefix: &str| -> i64 {
        text.lines()
            .find(|l| l.starts_with(prefix))
            .unwrap_or_else(|| panic!("metrics line missing: {prefix}"))
            .split_whitespace()
            .last()
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(|| panic!("metrics parse: {prefix}"))
    };
    let parse_u = |text: &str, prefix: &str| -> u64 {
        text.lines()
            .find(|l| l.starts_with(prefix))
            .unwrap_or_else(|| panic!("metrics line missing: {prefix}"))
            .split_whitespace()
            .last()
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(|| panic!("metrics parse: {prefix}"))
    };

    let text = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };

    for prefix in [
        "traveltrust_onboarding_webhook_jobs_pending ",
        "traveltrust_onboarding_webhook_jobs_processing ",
        "traveltrust_onboarding_webhook_jobs_done ",
        "traveltrust_onboarding_webhook_jobs_dead ",
        "traveltrust_onboarding_webhook_dlq_total ",
        "traveltrust_onboarding_webhook_dlq_unreplayed ",
    ] {
        let v = parse_i(&text, prefix);
        assert!(v >= 0, "{prefix}: expected non-negative gauge, got {v}");
    }
    for prefix in [
        "traveltrust_onboarding_quote_get_requests_total ",
        "traveltrust_onboarding_payment_intents_post_requests_total ",
        "traveltrust_onboarding_entitlements_me_get_requests_total ",
        "traveltrust_onboarding_role_confirm_post_requests_total ",
    ] {
        let _ = parse_u(&text, prefix);
    }
    for ri in 0..HTTP_RESP_ROUTE_NAMES.len() {
        for ci in 0..HTTP_RESP_CLASS_NAMES.len() {
            let prefix = format!(
                "traveltrust_onboarding_http_responses_total{{route=\"{}\",status_class=\"{}\"}} ",
                HTTP_RESP_ROUTE_NAMES[ri],
                HTTP_RESP_CLASS_NAMES[ci],
            );
            let _ = parse_u(&text, &prefix);
        }
    }

    let quote_2xx_prefix = r#"traveltrust_onboarding_http_responses_total{route="quote",status_class="2xx"} "#;
    let h2xx_before = parse_u(&text, quote_2xx_prefix);
    let q_before = parse_u(&text, "traveltrust_onboarding_quote_get_requests_total ");
    let rq = app_stack_router(pool.clone())
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=provider")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("quote");
    assert_eq!(rq.status(), StatusCode::OK);
    let text_after = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics after quote");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };
    let q_after = parse_u(
        &text_after,
        "traveltrust_onboarding_quote_get_requests_total ",
    );
    assert!(
        q_after >= q_before.saturating_add(1),
        "quote counter should increment: before={q_before} after={q_after}"
    );
    let h2xx_after = parse_u(&text_after, quote_2xx_prefix);
    assert!(
        h2xx_after >= h2xx_before.saturating_add(1),
        "quote 2xx response bucket should increment: before={h2xx_before} after={h2xx_after}"
    );

    let quote_4xx_prefix = r#"traveltrust_onboarding_http_responses_total{route="quote",status_class="4xx"} "#;
    let h4xx_before = parse_u(&text_after, quote_4xx_prefix);
    let q_mid = parse_u(
        &text_after,
        "traveltrust_onboarding_quote_get_requests_total ",
    );
    let bad = app_stack_router(pool.clone())
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=tourist")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("quote invalid role");
    assert_eq!(bad.status(), StatusCode::BAD_REQUEST);
    let text_bad = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics after invalid quote");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };
    let q_bad = parse_u(
        &text_bad,
        "traveltrust_onboarding_quote_get_requests_total ",
    );
    assert!(
        q_bad >= q_mid.saturating_add(1),
        "quote requests counter should increment on 400: mid={q_mid} after={q_bad}"
    );
    let h4xx_after = parse_u(&text_bad, quote_4xx_prefix);
    assert!(
        h4xx_after >= h4xx_before.saturating_add(1),
        "quote 4xx response bucket should increment on invalid role: before={h4xx_before} after={h4xx_after}"
    );

    let pi_4xx_prefix =
        r#"traveltrust_onboarding_http_responses_total{route="payment_intents",status_class="4xx"} "#;
    let pi4_before = parse_u(&text_bad, pi_4xx_prefix);
    let pi_req_mid = parse_u(
        &text_bad,
        "traveltrust_onboarding_payment_intents_post_requests_total ",
    );
    let no_auth = app_stack_router(pool.clone())
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("payment-intents without bearer");
    assert_eq!(no_auth.status(), StatusCode::UNAUTHORIZED);
    let text_pi = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics after payment-intents 401");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };
    let pi_req_after = parse_u(
        &text_pi,
        "traveltrust_onboarding_payment_intents_post_requests_total ",
    );
    assert!(
        pi_req_after >= pi_req_mid.saturating_add(1),
        "payment_intents requests counter should increment on 401: mid={pi_req_mid} after={pi_req_after}"
    );
    let pi4_after = parse_u(&text_pi, pi_4xx_prefix);
    assert!(
        pi4_after >= pi4_before.saturating_add(1),
        "payment_intents 4xx response bucket should increment on login_required: before={pi4_before} after={pi4_after}"
    );

    let ent_4xx_prefix =
        r#"traveltrust_onboarding_http_responses_total{route="entitlements_me",status_class="4xx"} "#;
    let ent4_before = parse_u(&text_pi, ent_4xx_prefix);
    let ent_req_mid = parse_u(
        &text_pi,
        "traveltrust_onboarding_entitlements_me_get_requests_total ",
    );
    let ent_no_auth = app_stack_router(pool.clone())
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/entitlements/me")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements/me without bearer");
    assert_eq!(ent_no_auth.status(), StatusCode::UNAUTHORIZED);
    let text_ent = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics after entitlements/me 401");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };
    let ent_req_after = parse_u(
        &text_ent,
        "traveltrust_onboarding_entitlements_me_get_requests_total ",
    );
    assert!(
        ent_req_after >= ent_req_mid.saturating_add(1),
        "entitlements_me requests counter should increment on 401: mid={ent_req_mid} after={ent_req_after}"
    );
    let ent4_after = parse_u(&text_ent, ent_4xx_prefix);
    assert!(
        ent4_after >= ent4_before.saturating_add(1),
        "entitlements_me 4xx response bucket should increment on login_required: before={ent4_before} after={ent4_after}"
    );

    let rc_4xx_prefix =
        r#"traveltrust_onboarding_http_responses_total{route="role_confirm",status_class="4xx"} "#;
    let rc4_before = parse_u(&text_ent, rc_4xx_prefix);
    let rc_req_mid = parse_u(
        &text_ent,
        "traveltrust_onboarding_role_confirm_post_requests_total ",
    );
    let rc_no_auth = app_stack_router(pool.clone())
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("role-confirm without bearer");
    assert_eq!(rc_no_auth.status(), StatusCode::UNAUTHORIZED);
    let text_rc = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics after role-confirm 401");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };
    let rc_req_after = parse_u(
        &text_rc,
        "traveltrust_onboarding_role_confirm_post_requests_total ",
    );
    assert!(
        rc_req_after >= rc_req_mid.saturating_add(1),
        "role_confirm requests counter should increment on 401: mid={rc_req_mid} after={rc_req_after}"
    );
    let rc4_after = parse_u(&text_rc, rc_4xx_prefix);
    assert!(
        rc4_after >= rc4_before.saturating_add(1),
        "role_confirm 4xx response bucket should increment on login_required: before={rc4_before} after={rc4_after}"
    );

    let quote_5xx_prefix = r#"traveltrust_onboarding_http_responses_total{route="quote",status_class="5xx"} "#;
    let q5_before = parse_u(&text_rc, quote_5xx_prefix);
    let q_get_before_503 = parse_u(
        &text_rc,
        "traveltrust_onboarding_quote_get_requests_total ",
    );
    let q503 = app_stack_router_chain_off_absent(pool.clone())
        .oneshot(
            Request::builder()
                .uri("/api/v1/onboarding/quote?role=provider")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("quote chain_off absent");
    assert_eq!(q503.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v503 = response_json(q503).await;
    assert_eq!(v503["error"], "chain_off_unavailable");
    let text_5xx = {
        let r = app_stack_router(pool.clone());
        let res = r
            .oneshot(
                Request::builder()
                    .uri("/metrics")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .expect("metrics after quote 503");
        assert_eq!(res.status(), StatusCode::OK);
        String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap()
    };
    let q_get_after_503 = parse_u(
        &text_5xx,
        "traveltrust_onboarding_quote_get_requests_total ",
    );
    assert!(
        q_get_after_503 >= q_get_before_503.saturating_add(1),
        "quote requests counter should increment on 503: before={q_get_before_503} after={q_get_after_503}"
    );
    let q5_after = parse_u(&text_5xx, quote_5xx_prefix);
    assert!(
        q5_after >= q5_before.saturating_add(1),
        "quote 5xx response bucket should increment on chain_off_unavailable: before={q5_before} after={q5_after}"
    );
}

/// **70 / 96-18** → **`GET /api/v1/admin/users/:id/onboarding-entitlements`**：**admin** 会话读目标用户 **`onboarding_entitlements`**（**PG**；**`ChainOffStore`** 须物化 **admin** 与 **target** 以过 **`require_admin_actor`** / **404**）。
#[tokio::test]
async fn matrix_93_admin_onb_010_get_admin_user_onboarding_entitlements_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_010_get_admin_user_onboarding_entitlements_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin_read_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let uri = format!("/api/v1/admin/users/{target_id}/onboarding-entitlements");
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    let status = res.status();
    let body = response_json(res).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["status"], "ok");
    assert_eq!(body["user_id"].as_str(), Some(target_id.to_string().as_str()));
    let arr = body["entitlements"].as_array().expect("entitlements");
    assert!(
        !arr.is_empty(),
        "expected at least one onboarding_entitlements row for target_id={target_id}, body={body:?}"
    );
    assert!(
        arr.iter().any(|e| {
            e.get("role_target").and_then(|v| v.as_str()) == Some("provider")
                && e.get("status").and_then(|v| v.as_str()) == Some("pending")
        }),
        "expected pending provider entitlement after payment-intents: {:?}",
        arr
    );
}

/// **70 / 96-18** → **`super_admin`** 会话 **`GET …/admin/onboarding/entitlements`**：**`require_admin_actor`** **允许** **`admin`/`super_admin`**，**与** **`admin`** **同权** **200**。
#[tokio::test]
async fn matrix_93_admin_onb_011_super_admin_get_onboarding_entitlements_list_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_011_super_admin_get_onboarding_entitlements_list_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let sa_id = Uuid::new_v4();
    let now = Utc::now();
    let sa_email = format!("onb-sa11-{sa_id}@traveltrust.test");
    let sa_token = format!("tts_onb_sa11_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, sa_id).await;

    insert_user(
        &pool,
        sa_id,
        &sa_email,
        None,
        "super_admin",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user super_admin");
    insert_session(&pool, &sa_token, sa_id)
        .await
        .expect("insert_session super_admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        sa_id,
        UserRow {
            id: sa_id,
            email: sa_email.clone(),
            password_hash: None,
            role: "super_admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?limit=5")
                .header(header::AUTHORIZATION, auth_bearer(&sa_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("super_admin list entitlements");

    let st = res.status();
    let body = response_json(res).await;
    cleanup_onboarding_it_user(&pool, sa_id).await;

    assert_eq!(st, StatusCode::OK);
    assert_eq!(body["status"], "ok");
    assert_eq!(
        body["meta"]["implementation_status"],
        "onboarding_entitlements_admin_list_db"
    );
    assert!(body["items"].is_array());
}

/// **70 / 96-18** → **`GET /api/v1/admin/onboarding/compliance-audit-events`**：**env denylist** 下 **`payment-intents`** 与 **`role-confirm`** 各 **403** 落库后，**admin** 按 **`user_id`** 列出 **两行**（**PG**）。
#[tokio::test]
async fn matrix_93_admin_onb_028_get_admin_onboarding_compliance_audit_events_filtered_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_028_get_admin_onboarding_compliance_audit_events_filtered_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev = std::env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST").ok();
    std::env::set_var(
        "ONBOARDING_COMPLIANCE_EMAIL_DENYLIST",
        "__tt_onb_compliance_marker__",
    );

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let target_token = format!("tts_onb_tgt28_{}", Uuid::new_v4());
    let admin_token = format!("tts_onb_adm28_{}", Uuid::new_v4());
    let target_email = format!("u__tt_onb_compliance_marker__-{target_id}@traveltrust.test");
    let admin_email = format!("onb-adm28-{admin_id}@traveltrust.test");

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let app = app_stack_router(pool.clone());
    let req_id_pi = format!("req-onb-adm28-pi-{}", Uuid::new_v4());
    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("x-request-id", &req_id_pi)
                .header("Idempotency-Key", format!("idem_28_{}", Uuid::new_v4()))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot deny payment-intents");
    let req_id_rc = format!("req-onb-adm28-rc-{}", Uuid::new_v4());
    let res_rc = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/role-confirm")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("x-request-id", &req_id_rc)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot deny role-confirm");
    match prev {
        None => std::env::remove_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST"),
        Some(p) => std::env::set_var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST", p),
    }
    assert_eq!(res_pi.status(), StatusCode::FORBIDDEN);
    assert_eq!(res_rc.status(), StatusCode::FORBIDDEN);

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app2 = app_stack_router_seeded(pool.clone(), store);
    let uri = format!(
        "/api/v1/admin/onboarding/compliance-audit-events?user_id={}&limit=10",
        target_id
    );
    let res2 = app2
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("admin compliance list");

    let st2 = res2.status();
    let body = response_json(res2).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

    assert_eq!(st2, StatusCode::OK);
    assert_eq!(body["status"], "ok");
    assert_eq!(
        body["meta"]["implementation_status"],
        "onboarding_compliance_audit_events_admin_list_db"
    );
    let items = body["items"].as_array().expect("items array");
    assert_eq!(items.len(), 2, "expected two compliance audit rows");
    let mut routes: Vec<&str> = items
        .iter()
        .map(|it| it["route"].as_str().expect("route str"))
        .collect();
    routes.sort_unstable();
    assert_eq!(
        routes,
        vec![
            "POST /api/v1/onboarding/payment-intents",
            "POST /api/v1/onboarding/role-confirm"
        ]
    );
    let mut req_ids: Vec<&str> = items
        .iter()
        .map(|it| it["request_id"].as_str().expect("request_id str"))
        .collect();
    req_ids.sort_unstable();
    assert_eq!(req_ids, vec![req_id_pi.as_str(), req_id_rc.as_str()]);
    for it in items {
        assert_eq!(it["user_id"].as_str().unwrap(), target_id.to_string());
    }
}

/// **70 / 96-09** → **`GET /api/v1/admin/onboarding/webhook-jobs`** 与 **`…/webhook-dlq`**：**`user_id`** 与 **`onboarding_entitlements.idempotency_key`** 对齐过滤（**PG**；**`insert_*`** 各写一行后 **admin** 列表命中）。
#[tokio::test]
async fn matrix_93_admin_onb_012_get_admin_onboarding_webhook_jobs_dlq_filtered_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_012_get_admin_onboarding_webhook_jobs_dlq_filtered_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm12-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt12-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin12_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt12_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin12_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let job_payload = json!({
        "schema_version": 1u32,
        "idempotency_key": idem,
        "provider_event_id": "evt_admin012_job",
        "outcome": "succeeded"
    });
    insert_onboarding_webhook_job(&pool, &job_payload)
        .await
        .expect("insert_onboarding_webhook_job");
    insert_onboarding_webhook_dlq(
        &pool,
        &idem,
        "evt_admin012_dlq",
        "failed",
        &json!({ "synthetic": true }),
        "matrix_93_admin_onb_012 synthetic dlq",
    )
    .await
    .expect("insert_onboarding_webhook_dlq");

    let uri_jobs = format!(
        "/api/v1/admin/onboarding/webhook-jobs?user_id={}&limit=50",
        target_id
    );
    let res_jobs = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_jobs)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot jobs");

    let uri_dlq = format!(
        "/api/v1/admin/onboarding/webhook-dlq?user_id={}&limit=50",
        target_id
    );
    let res_dlq = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_dlq)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot dlq");

    let uri_jobs_admin_only = format!(
        "/api/v1/admin/onboarding/webhook-jobs?user_id={}&limit=50",
        admin_id
    );
    let res_jobs_wrong_user = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_jobs_admin_only)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot jobs wrong user");

    let st_jobs = res_jobs.status();
    let body_jobs = response_json(res_jobs).await;
    let st_dlq = res_dlq.status();
    let body_dlq = response_json(res_dlq).await;
    let st_wrong = res_jobs_wrong_user.status();
    let body_wrong = response_json(res_jobs_wrong_user).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_jobs, StatusCode::OK);
    assert_eq!(body_jobs["status"], "ok");
    let items_j = body_jobs["items"].as_array().expect("items jobs");
    assert!(
        items_j.iter().any(|row| {
            row["payload"]["idempotency_key"].as_str() == Some(idem.as_str())
        }),
        "expected job row for idem in admin list: {:?}",
        body_jobs
    );

    assert_eq!(st_dlq, StatusCode::OK);
    assert_eq!(body_dlq["status"], "ok");
    let items_d = body_dlq["items"].as_array().expect("items dlq");
    assert!(
        items_d
            .iter()
            .any(|row| row["idempotency_key"].as_str() == Some(idem.as_str())),
        "expected dlq row for idem: {:?}",
        body_dlq
    );

    assert_eq!(st_wrong, StatusCode::OK);
    let items_w = body_wrong["items"].as_array().expect("items wrong filter");
    assert!(
        !items_w.iter().any(|row| {
            row["payload"]["idempotency_key"].as_str() == Some(idem.as_str())
        }),
        "admin user_id filter must not return target idem rows: {:?}",
        body_wrong
    );
}

/// **70 / 250** → **`GET /api/v1/admin/jobs?queue_name=onboarding_webhook`**：**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 时 **`async_jobs`** 行出现在 **Admin** 统一队列只读（**`summary`/`items`** **同队列** **收窄**）。
#[tokio::test]
async fn matrix_93_admin_onb_031_admin_jobs_queue_name_onboarding_webhook_mirror_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_031_admin_jobs_queue_name_onboarding_webhook_mirror_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_async = std::env::var("ONBOARDING_WEBHOOK_ASYNC_QUEUE").ok();
    let prev_inline = std::env::var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN").ok();
    let prev_mirror = std::env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR").ok();
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE", "1");
    let _ = std::env::remove_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN");
    std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", "1");

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm31-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt31-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin31_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt31_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin31_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot pi");
    assert_eq!(res.status(), StatusCode::OK);

    let hook = json!({
        "schema_version": 1u32,
        "idempotency_key": idem,
        "provider_event_id": "evt_admin31_mirror_1",
        "outcome": "succeeded"
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(hook.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot webhook");
    assert_eq!(res.status(), StatusCode::OK);

    let job_id: Uuid = sqlx::query_scalar(
        r#"
        SELECT id FROM onboarding_webhook_jobs
        WHERE payload->>'idempotency_key' = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(&idem)
    .fetch_one(&pool)
    .await
    .expect("job id");

    let res_jobs = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/jobs?queue_name=onboarding_webhook&limit=50")
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("admin jobs");
    assert_eq!(res_jobs.status(), StatusCode::OK);
    let body = response_json(res_jobs).await;
    assert_eq!(body["status"], "ok");
    let applied = body["applied_filters"].as_object().expect("applied_filters");
    assert_eq!(applied.get("queue_name").and_then(|v| v.as_str()), Some("onboarding_webhook"));
    let items = body["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| {
            row["queue_name"].as_str() == Some("onboarding_webhook")
                && row["job_type"].as_str() == Some("onboarding_webhook_apply")
                && row["payload_ref"].as_str() == Some(&job_id.to_string())
                && row["status"].as_str() == Some("completed")
        }),
        "expected async_jobs mirror row in admin jobs list: {:?}",
        body
    );
    let summary = body["summary"].as_object().expect("summary");
    let completed = summary
        .get("completed")
        .and_then(|v| v.as_i64())
        .expect("summary.completed");
    assert!(completed >= 1, "expected queue-scoped summary.completed >= 1, got {completed}");

    match prev_async {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_QUEUE", p),
    }
    match prev_inline {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN", p),
    }
    match prev_mirror {
        None => std::env::remove_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR"),
        Some(p) => std::env::set_var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR", p),
    }

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;
}

/// **70 / 96-18** → **`GET /api/v1/admin/onboarding/entitlements`**：**`user_id` + `status` + `role_target`** 精确过滤命中 **`pending`** 行；**`status=paid`** 下 **不** 含本 **`idem`**。
#[tokio::test]
async fn matrix_93_admin_onb_013_get_admin_onboarding_entitlements_list_filtered_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_013_get_admin_onboarding_entitlements_list_filtered_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm13-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt13-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin13_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt13_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin13_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let uri_ok = format!(
        "/api/v1/admin/onboarding/entitlements?user_id={}&status=pending&role_target=provider&limit=50",
        target_id
    );
    let res_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_ok)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot list pending");

    let uri_paid = format!(
        "/api/v1/admin/onboarding/entitlements?user_id={}&status=paid&limit=50",
        target_id
    );
    let res_paid = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_paid)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot list paid");

    let st_ok = res_ok.status();
    let body_ok = response_json(res_ok).await;
    let st_paid = res_paid.status();
    let body_paid = response_json(res_paid).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_ok, StatusCode::OK);
    assert_eq!(body_ok["status"], "ok");
    let items = body_ok["items"].as_array().expect("items");
    let target_id_str = target_id.to_string();
    assert!(
        items.iter().any(|row| {
            row["idempotency_key"].as_str() == Some(idem.as_str())
                && row["user_id"].as_str() == Some(target_id_str.as_str())
        }),
        "expected pending provider entitlement for target: {:?}",
        body_ok
    );

    assert_eq!(st_paid, StatusCode::OK);
    let paid_items = body_paid["items"].as_array().expect("paid items");
    assert!(
        !paid_items.iter().any(|row| {
            row["idempotency_key"].as_str() == Some(idem.as_str())
        }),
        "pending idem must not appear under status=paid: {:?}",
        body_paid
    );
}

/// **70 / 96-18** → **`GET /api/v1/admin/onboarding/entitlements/:id`**：**`payment-intents`** 返回 **`entitlement_id`** → **admin** **200** + **`metadata`/`updated_at`**；随机 **`id`** → **404**。
#[tokio::test]
async fn matrix_93_admin_onb_014_get_admin_onboarding_entitlement_by_id_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_014_get_admin_onboarding_entitlement_by_id_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm14-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt14-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin14_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt14_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin14_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let uri_detail = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}");
    let res_detail = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_detail)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot detail");

    let missing_id = Uuid::new_v4();
    let uri_missing = format!("/api/v1/admin/onboarding/entitlements/{missing_id}");
    let res_missing = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_missing)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot missing");

    let st_d = res_detail.status();
    let body_d = response_json(res_detail).await;
    let st_m = res_missing.status();
    let body_m = response_json(res_missing).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_d, StatusCode::OK);
    assert_eq!(body_d["status"], "ok");
    let ent = &body_d["entitlement"];
    assert_eq!(ent["id"].as_str(), Some(ent_id_str));
    let target_id_str = target_id.to_string();
    assert_eq!(ent["user_id"].as_str(), Some(target_id_str.as_str()));
    assert_eq!(ent["idempotency_key"].as_str(), Some(idem.as_str()));
    assert!(ent.get("metadata").is_some(), "metadata: {:?}", body_d);
    assert!(
        ent.get("updated_at").and_then(|v| v.as_str()).is_some(),
        "updated_at: {:?}",
        body_d
    );
    assert_eq!(
        body_d["meta"]["implementation_status"],
        "onboarding_entitlements_admin_detail_db"
    );

    assert_eq!(st_m, StatusCode::NOT_FOUND);
    assert_eq!(body_m["error"], "onboarding_entitlement_not_found");
}

/// **70 / 96-18** → **`PATCH …/admin/onboarding/entitlements/:id`**：**`metadata.admin`** **浅合并**（**`dispute_flag`/`case_ref`**）；**`GET …/:id`** 可见。
#[tokio::test]
async fn matrix_93_admin_onb_016_patch_admin_onboarding_entitlement_admin_metadata_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_016_patch_admin_onboarding_entitlement_admin_metadata_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm16-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt16-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin16_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt16_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin16_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let patch_body = json!({
        "admin": {
            "dispute_flag": true,
            "case_ref": "OPS-016"
        }
    })
    .to_string();
    let uri = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}");
    let res_patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(patch_body))
                .unwrap(),
        )
        .await
        .expect("oneshot patch");

    let res_get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get after patch");

    let st_p = res_patch.status();
    let body_p = response_json(res_patch).await;
    let st_g = res_get.status();
    let body_g = response_json(res_get).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_p, StatusCode::OK);
    assert_eq!(
        body_p["meta"]["implementation_status"],
        "onboarding_entitlements_admin_metadata_patch_db"
    );
    let adm = &body_p["entitlement"]["metadata"]["admin"];
    assert_eq!(adm["dispute_flag"], true);
    assert_eq!(adm["case_ref"], "OPS-016");

    assert_eq!(st_g, StatusCode::OK);
    assert_eq!(
        body_g["entitlement"]["metadata"]["admin"]["case_ref"],
        "OPS-016"
    );
}

/// **70 / 96-18** → **`POST …/entitlements/:id/revoke`**：**`pending` → `revoked`** + **`onboarding_payment_events`** **`admin_revoke`**（**按 id** **`GET …/payment-events`** **与** **全局** **`GET …/onboarding/payment-events?event_type=admin_revoke`**）；**二次** → **409**（**不**动 **`users.role`**）。
#[tokio::test]
async fn matrix_93_admin_onb_017_post_admin_onboarding_entitlement_revoke_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_017_post_admin_onboarding_entitlement_revoke_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm17-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt17-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin17_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt17_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin17_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let uri_revoke = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}/revoke");
    let revoke_json = json!({ "reason": "matrix_93_admin_onb_017 fraud hold" }).to_string();
    let res_r1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_revoke)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(revoke_json.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot revoke 1");

    let uri_pe = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/payment-events?limit=20"
    );
    let res_pe = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot payment-events after revoke");

    let uri_global = format!(
        "/api/v1/admin/onboarding/payment-events?entitlement_id={ent_id_str}&event_type=admin_revoke&limit=20"
    );
    let res_global = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_global)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot global payment-events admin_revoke");

    let res_r2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_revoke)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(revoke_json))
                .unwrap(),
        )
        .await
        .expect("oneshot revoke 2");

    let st1 = res_r1.status();
    let body1 = response_json(res_r1).await;
    let st_pe = res_pe.status();
    let body_pe = response_json(res_pe).await;
    let st_global = res_global.status();
    let body_global = response_json(res_global).await;
    let st2 = res_r2.status();
    let body2 = response_json(res_r2).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st1, StatusCode::OK);
    assert_eq!(
        body1["meta"]["implementation_status"],
        "onboarding_entitlements_admin_revoke_db"
    );
    assert_eq!(body1["entitlement"]["status"], "revoked");
    let adm = &body1["entitlement"]["metadata"]["admin"];
    assert_eq!(adm["revoke_reason"], "matrix_93_admin_onb_017 fraud hold");
    assert!(adm.get("revoked_at").is_some());
    assert!(adm.get("revoked_by").is_some());

    assert_eq!(st_pe, StatusCode::OK);
    let pe_items = body_pe["items"].as_array().expect("payment-events items");
    assert!(
        pe_items.iter().any(|row| {
            row["event_type"].as_str() == Some("admin_revoke")
                && row["payload_ref"]
                    .as_str()
                    .is_some_and(|p| p.starts_with("admin_revoke:"))
        }),
        "expected admin_revoke onboarding_payment_events row: {:?}",
        body_pe
    );

    assert_eq!(st_global, StatusCode::OK);
    assert_eq!(
        body_global["meta"]["implementation_status"],
        "onboarding_payment_events_admin_list_db"
    );
    let g_items = body_global["items"]
        .as_array()
        .expect("global payment-events items");
    assert!(
        g_items.iter().any(|row| {
            row["event_type"].as_str() == Some("admin_revoke")
                && row["entitlement_id"].as_str() == Some(ent_id_str)
                && row["payload_ref"]
                    .as_str()
                    .is_some_and(|p| p.starts_with("admin_revoke:"))
        }),
        "expected global list entitlement_id+admin_revoke filter: {:?}",
        body_global
    );

    assert_eq!(st2, StatusCode::CONFLICT);
    assert_eq!(body2["error"], "onboarding_entitlement_not_revokable");
}

/// **70 / 96-18** → **`POST …/entitlements/:id/revoke`**：**非法** **`:id`** → **400** **`invalid_onboarding_entitlement_id`**；**空** **`reason`** → **400** **`revoke_reason_required`**。
#[tokio::test]
async fn matrix_93_admin_onb_018_post_admin_onboarding_entitlement_revoke_validation_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_018_post_admin_onboarding_entitlement_revoke_validation_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm18-{admin_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin18_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_bad_id = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/admin/onboarding/entitlements/not-a-uuid/revoke")
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "reason": "matrix_93_admin_onb_018 bad path" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot bad entitlement id");

    let random_ent = Uuid::new_v4();
    let uri_empty_reason = format!(
        "/api/v1/admin/onboarding/entitlements/{random_ent}/revoke"
    );
    let res_empty_reason = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_empty_reason)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "reason": "  \t  " }).to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot empty reason");

    let st_bad = res_bad_id.status();
    let body_bad = response_json(res_bad_id).await;
    let st_empty = res_empty_reason.status();
    let body_empty = response_json(res_empty_reason).await;

    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_bad, StatusCode::BAD_REQUEST);
    assert_eq!(
        body_bad["error"].as_str(),
        Some("invalid_onboarding_entitlement_id")
    );

    assert_eq!(st_empty, StatusCode::BAD_REQUEST);
    assert_eq!(
        body_empty["error"].as_str(),
        Some("revoke_reason_required")
    );
}

/// **70 / 96-18 / 96-08** → **`POST …/entitlements/:id/financial-reversal`**：**`paid` → `refunded`** + **`admin_refund_recorded`**；**二次** → **409** **`onboarding_entitlement_already_refunded`**。
#[tokio::test]
async fn matrix_93_admin_onb_029_post_admin_onboarding_entitlement_financial_reversal_refund_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_029_post_admin_onboarding_entitlement_financial_reversal_refund_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm29-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt29-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin29_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt29_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin29_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");
    let ent_uuid = Uuid::parse_str(ent_id_str).expect("ent uuid");

    sqlx::query(
        "UPDATE onboarding_entitlements SET status = 'paid', paid_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(ent_uuid)
    .execute(&pool)
    .await
    .expect("mark entitlement paid for reversal test");

    let uri_fr = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/financial-reversal"
    );
    let body_fr = json!({
        "reason": "matrix_93_admin_onb_029 PSP refund confirmed (ledger only)",
        "reversal_kind": "refund"
    })
    .to_string();

    let res_fr1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_fr.clone()))
                .unwrap(),
        )
        .await
        .expect("financial-reversal 1");

    let uri_pe = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/payment-events?limit=20"
    );
    let res_pe = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("payment-events after reversal");

    let res_fr2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_fr))
                .unwrap(),
        )
        .await
        .expect("financial-reversal 2");

    let st1 = res_fr1.status();
    let b1 = response_json(res_fr1).await;
    let st_pe = res_pe.status();
    let b_pe = response_json(res_pe).await;
    let st2 = res_fr2.status();
    let b2 = response_json(res_fr2).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st1, StatusCode::OK);
    assert_eq!(
        b1["meta"]["implementation_status"],
        "onboarding_entitlements_admin_financial_reversal_db"
    );
    assert_eq!(b1["meta"]["psp_refund"]["attempted"], false);
    assert_eq!(b1["entitlement"]["status"], "refunded");
    let adm = &b1["entitlement"]["metadata"]["admin"];
    assert_eq!(adm["reversal_kind"], "refund");
    assert!(
        adm["reversal_reason"]
            .as_str()
            .unwrap()
            .contains("matrix_93_admin_onb_029")
    );

    assert_eq!(st_pe, StatusCode::OK);
    let pe_items = b_pe["items"].as_array().expect("payment-events items");
    assert!(
        pe_items.iter().any(|row| {
            row["event_type"].as_str() == Some("admin_refund_recorded")
                && row["payload_ref"]
                    .as_str()
                    .is_some_and(|p| p.starts_with("admin_refund_recorded:"))
        }),
        "expected admin_refund_recorded: {:?}",
        b_pe
    );

    assert_eq!(st2, StatusCode::CONFLICT);
    assert_eq!(
        b2["error"].as_str(),
        Some("onboarding_entitlement_already_refunded")
    );
}

/// **70 / 96-18** → **`POST …/financial-reversal`**：**`reversal_kind`** **非法** **→** **400**；**`pending`** **→** **409** **`requires_paid`**；**`chargeback`** **→** **`revoked`** **+** **`admin_chargeback_recorded`**；**二次** **→** **409** **`onboarding_entitlement_already_refunded`**。
#[tokio::test]
async fn matrix_93_admin_onb_030_post_admin_onboarding_entitlement_financial_reversal_validation_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_030_post_admin_onboarding_entitlement_financial_reversal_validation_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm30-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt30-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin30_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt30_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin30_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");
    let ent_uuid = Uuid::parse_str(ent_id_str).expect("ent uuid");

    let uri_fr = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/financial-reversal"
    );

    let res_bad_kind = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(
                    json!({
                        "reason": "matrix_93_admin_onb_030 bad kind",
                        "reversal_kind": "dispute"
                    })
                    .to_string(),
                )
                .unwrap(),
        )
        .await
        .expect("bad kind");

    let res_empty_reason = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(
                    json!({
                        "reason": "  \t  ",
                        "reversal_kind": "refund"
                    })
                    .to_string(),
                )
                .unwrap(),
        )
        .await
        .expect("empty reason");

    let res_pending = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(
                    json!({
                        "reason": "matrix_93_admin_onb_030 pending path",
                        "reversal_kind": "refund"
                    })
                    .to_string(),
                )
                .unwrap(),
        )
        .await
        .expect("pending reversal");

    sqlx::query(
        "UPDATE onboarding_entitlements SET status = 'paid', paid_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(ent_uuid)
    .execute(&pool)
    .await
    .expect("mark paid for chargeback leg");

    let res_cb = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(
                    json!({
                        "reason": "matrix_93_admin_onb_030 chargeback bank decision",
                        "reversal_kind": "CHARGEBACK"
                    })
                    .to_string(),
                )
                .unwrap(),
        )
        .await
        .expect("chargeback reversal");

    let res_cb_dup = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_fr)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(
                    json!({
                        "reason": "matrix_93_admin_onb_030 duplicate chargeback",
                        "reversal_kind": "chargeback"
                    })
                    .to_string(),
                )
                .unwrap(),
        )
        .await
        .expect("chargeback duplicate");

    let uri_pe = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/payment-events?limit=10"
    );
    let res_pe = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("pe after chargeback");

    let st_bad = res_bad_kind.status();
    let b_bad = response_json(res_bad_kind).await;
    let st_empty = res_empty_reason.status();
    let b_empty = response_json(res_empty_reason).await;
    let st_pend = res_pending.status();
    let b_pend = response_json(res_pending).await;
    let st_cb = res_cb.status();
    let b_cb = response_json(res_cb).await;
    let st_cb_dup = res_cb_dup.status();
    let b_cb_dup = response_json(res_cb_dup).await;
    let st_pe = res_pe.status();
    let b_pe = response_json(res_pe).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_bad, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_bad["error"].as_str(),
        Some("onboarding_financial_reversal_kind_invalid")
    );

    assert_eq!(st_empty, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_empty["error"].as_str(),
        Some("onboarding_financial_reversal_reason_required")
    );

    assert_eq!(st_pend, StatusCode::CONFLICT);
    assert_eq!(
        b_pend["error"].as_str(),
        Some("onboarding_entitlement_financial_reversal_requires_paid")
    );

    assert_eq!(st_cb, StatusCode::OK);
    assert!(b_cb["meta"]["psp_refund"].is_null());
    assert_eq!(b_cb["entitlement"]["status"], "revoked");
    assert_eq!(b_cb["entitlement"]["metadata"]["admin"]["reversal_kind"], "chargeback");

    assert_eq!(st_cb_dup, StatusCode::CONFLICT);
    assert_eq!(
        b_cb_dup["error"].as_str(),
        Some("onboarding_entitlement_already_refunded")
    );

    assert_eq!(st_pe, StatusCode::OK);
    let pe_items = b_pe["items"].as_array().expect("items");
    assert!(
        pe_items.iter().any(|row| row["event_type"].as_str() == Some("admin_chargeback_recorded")),
        "expected chargeback event: {:?}",
        b_pe
    );
}

/// **70 / 96-18** → **`GET …/entitlements/:id`**、**`GET …/payment-events`**、**`PATCH …/entitlements/:id`**、**`POST …/revoke`**（**合法 UUID + reason** **但无行**）：**非法** **`:id`** **→** **400** **`invalid_onboarding_entitlement_id`**；**不存在** **→** **404** **`onboarding_entitlement_not_found`**；**`PATCH`** **`admin`** **空对象 / 非 object / 超字节** **→** **`admin_metadata_*`**；**合法** **`admin`** **但无行** **→** **404**。
#[tokio::test]
async fn matrix_93_admin_onb_019_admin_onboarding_entitlement_get_patch_pe_validation_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_019_admin_onboarding_entitlement_get_patch_pe_validation_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm19-{admin_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin19_{}", Uuid::new_v4());
    let missing_ent = Uuid::new_v4();
    let bulk = "x".repeat(20_000);

    cleanup_onboarding_it_user(&pool, admin_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth = auth_bearer(&admin_token);

    let res_g_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements/not-a-uuid")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get detail bad id");

    let uri_g_miss = format!("/api/v1/admin/onboarding/entitlements/{missing_ent}");
    let res_g_miss = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_g_miss)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get detail missing");

    let res_pe_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements/not-a-uuid/payment-events?limit=10")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get pe bad id");

    let uri_pe_miss = format!(
        "/api/v1/admin/onboarding/entitlements/{missing_ent}/payment-events?limit=10"
    );
    let res_pe_miss = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe_miss)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get pe missing");

    let res_p_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri("/api/v1/admin/onboarding/entitlements/not-a-uuid")
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "admin": { "note": "019" } }).to_string()))
                .unwrap(),
        )
        .await
        .expect("patch bad id");

    let uri_p = format!("/api/v1/admin/onboarding/entitlements/{missing_ent}");
    let res_p_empty = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_p)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "admin": {} }).to_string()))
                .unwrap(),
        )
        .await
        .expect("patch empty admin");

    let res_p_not_obj = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_p)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "admin": [] }).to_string()))
                .unwrap(),
        )
        .await
        .expect("patch admin not object");

    let res_p_large = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_p)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "admin": { "bulk": bulk } }).to_string()))
                .unwrap(),
        )
        .await
        .expect("patch admin too large");

    let res_p_nf = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_p)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "admin": { "note": "019 missing row" } }).to_string()))
                .unwrap(),
        )
        .await
        .expect("patch missing entitlement");

    let uri_rev_nf = format!("/api/v1/admin/onboarding/entitlements/{missing_ent}/revoke");
    let res_rev_nf = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_rev_nf)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "reason": "matrix_93_admin_onb_019 no such entitlement" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("revoke missing entitlement");

    let st_g_bad = res_g_bad.status();
    let b_g_bad = response_json(res_g_bad).await;
    let st_g_miss = res_g_miss.status();
    let b_g_miss = response_json(res_g_miss).await;
    let st_pe_bad = res_pe_bad.status();
    let b_pe_bad = response_json(res_pe_bad).await;
    let st_pe_miss = res_pe_miss.status();
    let b_pe_miss = response_json(res_pe_miss).await;
    let st_p_bad = res_p_bad.status();
    let b_p_bad = response_json(res_p_bad).await;
    let st_p_empty = res_p_empty.status();
    let b_p_empty = response_json(res_p_empty).await;
    let st_p_not_obj = res_p_not_obj.status();
    let b_p_not_obj = response_json(res_p_not_obj).await;
    let st_p_large = res_p_large.status();
    let b_p_large = response_json(res_p_large).await;
    let st_p_nf = res_p_nf.status();
    let b_p_nf = response_json(res_p_nf).await;
    let st_rev_nf = res_rev_nf.status();
    let b_rev_nf = response_json(res_rev_nf).await;

    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_g_bad, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_g_bad["error"].as_str(),
        Some("invalid_onboarding_entitlement_id")
    );

    assert_eq!(st_g_miss, StatusCode::NOT_FOUND);
    assert_eq!(
        b_g_miss["error"].as_str(),
        Some("onboarding_entitlement_not_found")
    );

    assert_eq!(st_pe_bad, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_pe_bad["error"].as_str(),
        Some("invalid_onboarding_entitlement_id")
    );

    assert_eq!(st_pe_miss, StatusCode::NOT_FOUND);
    assert_eq!(
        b_pe_miss["error"].as_str(),
        Some("onboarding_entitlement_not_found")
    );

    assert_eq!(st_p_bad, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_p_bad["error"].as_str(),
        Some("invalid_onboarding_entitlement_id")
    );

    assert_eq!(st_p_empty, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_p_empty["error"].as_str(),
        Some("admin_metadata_empty")
    );

    assert_eq!(st_p_not_obj, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_p_not_obj["error"].as_str(),
        Some("admin_metadata_must_object")
    );

    assert_eq!(st_p_large, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_p_large["error"].as_str(),
        Some("admin_metadata_patch_too_large")
    );

    assert_eq!(st_p_nf, StatusCode::NOT_FOUND);
    assert_eq!(
        b_p_nf["error"].as_str(),
        Some("onboarding_entitlement_not_found")
    );

    assert_eq!(st_rev_nf, StatusCode::NOT_FOUND);
    assert_eq!(
        b_rev_nf["error"].as_str(),
        Some("onboarding_entitlement_not_found")
    );
}

/// **70 / 96-18** → **`GET …/admin/users/:id/onboarding-entitlements`**：**非法** **`user_id`** **→** **400** **`invalid_user_id`**；**DB 有用户** 但 **未** 在 **`ChainOffStore`** **物化** **→** **404** **`user_not_found`**。**全局** **`GET …/onboarding/payment-events`**：**仅空白** **`event_type`** **→** **不** 参与过滤；**`limit>500`** **→** **钳位** **500**；**`event_type`** **超长** **→** **截断** **64** 字节写入 **`applied_filters`**。
#[tokio::test]
async fn matrix_93_admin_onb_020_admin_user_onboarding_entitlements_and_global_payment_events_query_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_020_admin_user_onboarding_entitlements_and_global_payment_events_query_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm20-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt20-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin20_{}", Uuid::new_v4());
    let et_long = "z".repeat(70);
    let et_trunc_64 = "z".repeat(64);

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth = auth_bearer(&admin_token);

    let res_u_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/users/not-a-uuid/onboarding-entitlements")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("user onb bad id");

    let uri_u_miss = format!("/api/v1/admin/users/{target_id}/onboarding-entitlements");
    let res_u_miss = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_u_miss)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("user onb not in chainoff");

    let res_pe_ws = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/payment-events?limit=10&event_type=%20%09")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("global pe whitespace event_type");

    let res_pe_limit = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/payment-events?limit=9999")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("global pe limit clamp");

    let mut pe_long_q = url::form_urlencoded::Serializer::new(String::new());
    pe_long_q.append_pair("limit", "5");
    pe_long_q.append_pair("event_type", &et_long);
    let uri_pe_long = format!(
        "/api/v1/admin/onboarding/payment-events?{}",
        pe_long_q.finish()
    );
    let res_pe_long = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe_long)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("global pe long event_type");

    let st_u_bad = res_u_bad.status();
    let b_u_bad = response_json(res_u_bad).await;
    let st_u_miss = res_u_miss.status();
    let b_u_miss = response_json(res_u_miss).await;
    let st_pe_ws = res_pe_ws.status();
    let b_pe_ws = response_json(res_pe_ws).await;
    let st_pe_limit = res_pe_limit.status();
    let b_pe_limit = response_json(res_pe_limit).await;
    let st_pe_long = res_pe_long.status();
    let b_pe_long = response_json(res_pe_long).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_u_bad, StatusCode::BAD_REQUEST);
    assert_eq!(b_u_bad["error"].as_str(), Some("invalid_user_id"));

    assert_eq!(st_u_miss, StatusCode::NOT_FOUND);
    assert_eq!(b_u_miss["error"].as_str(), Some("user_not_found"));

    assert_eq!(st_pe_ws, StatusCode::OK);
    assert_eq!(
        b_pe_ws["meta"]["implementation_status"],
        "onboarding_payment_events_admin_list_db"
    );
    assert!(
        b_pe_ws["applied_filters"]["event_type"].is_null(),
        "whitespace-only event_type should be ignored: {:?}",
        b_pe_ws["applied_filters"]
    );

    assert_eq!(st_pe_limit, StatusCode::OK);
    assert_eq!(
        b_pe_limit["applied_filters"]["limit"].as_i64(),
        Some(500),
        "limit should clamp to 500: {:?}",
        b_pe_limit["applied_filters"]
    );

    assert_eq!(st_pe_long, StatusCode::OK);
    assert_eq!(
        b_pe_long["applied_filters"]["event_type"].as_str(),
        Some(et_trunc_64.as_str()),
        "event_type should truncate to 64 chars: {:?}",
        b_pe_long["applied_filters"]
    );
}

/// **70 / 96-18** → **`GET …/onboarding/entitlements`**：**非法** **`user_id`** **→** **400** **`invalid_user_id`**；**`limit>500`** **→** **钳位** **500**；**仅空白** **`user_id`** **→** **忽略**；**`status`/`role_target`** **超长** **→** **`applied_filters`** **截断** **128**。**96-09** → **`webhook-jobs`/`webhook-dlq`**：**非法** **`user_id`** **→** **400**；**`limit`** **钳位**；**空白** **`user_id`** **忽略**。**`compliance-audit-events`**：**同** **`webhook-jobs`** **query** **语义**。
#[tokio::test]
async fn matrix_93_admin_onb_021_admin_onboarding_entitlements_list_and_webhook_ingests_query_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_021_admin_onboarding_entitlements_list_and_webhook_ingests_query_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm21-{admin_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin21_{}", Uuid::new_v4());
    let status_long = "s".repeat(200);
    let status_128 = "s".repeat(128);
    let role_long = "r".repeat(200);
    let role_128 = "r".repeat(128);

    cleanup_onboarding_it_user(&pool, admin_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth = auth_bearer(&admin_token);

    let res_ent_bad_uid = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?user_id=not-a-uuid&limit=10")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements list bad user_id");

    let res_ent_limit = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?limit=10000")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements list limit clamp");

    let res_ent_ws_uid = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?user_id=%20%09&limit=10")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements list whitespace user_id");

    let mut ent_long_q = url::form_urlencoded::Serializer::new(String::new());
    ent_long_q.append_pair("limit", "5");
    ent_long_q.append_pair("status", &status_long);
    ent_long_q.append_pair("role_target", &role_long);
    let uri_ent_long = format!(
        "/api/v1/admin/onboarding/entitlements?{}",
        ent_long_q.finish()
    );
    let res_ent_long = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_ent_long)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements list long status/role_target");

    let res_jobs_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-jobs?user_id=bad-uuid&limit=10")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-jobs bad user_id");

    let res_jobs_limit = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-jobs?limit=99999")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-jobs limit clamp");

    let res_jobs_ws = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-jobs?user_id=%20&limit=5")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-jobs whitespace user_id");

    let res_dlq_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-dlq?user_id=not-uuid")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-dlq bad user_id");

    let res_cmp_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/compliance-audit-events?user_id=bad-uuid&limit=10")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("compliance-audit-events bad user_id");

    let res_cmp_limit = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/compliance-audit-events?limit=99999")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("compliance-audit-events limit clamp");

    let res_cmp_ws = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/compliance-audit-events?user_id=%20&limit=5")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("compliance-audit-events whitespace user_id");

    let res_dlq_ws = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-dlq?user_id=%09%20&limit=8888")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-dlq whitespace user_id limit");

    let st_ent_bad = res_ent_bad_uid.status();
    let b_ent_bad = response_json(res_ent_bad_uid).await;
    let st_ent_limit = res_ent_limit.status();
    let b_ent_limit = response_json(res_ent_limit).await;
    let st_ent_ws = res_ent_ws_uid.status();
    let b_ent_ws = response_json(res_ent_ws_uid).await;
    let st_ent_long = res_ent_long.status();
    let b_ent_long = response_json(res_ent_long).await;
    let st_jobs_bad = res_jobs_bad.status();
    let b_jobs_bad = response_json(res_jobs_bad).await;
    let st_jobs_limit = res_jobs_limit.status();
    let b_jobs_limit = response_json(res_jobs_limit).await;
    let st_jobs_ws = res_jobs_ws.status();
    let b_jobs_ws = response_json(res_jobs_ws).await;
    let st_dlq_bad = res_dlq_bad.status();
    let b_dlq_bad = response_json(res_dlq_bad).await;
    let st_cmp_bad = res_cmp_bad.status();
    let b_cmp_bad = response_json(res_cmp_bad).await;
    let st_cmp_limit = res_cmp_limit.status();
    let b_cmp_limit = response_json(res_cmp_limit).await;
    let st_cmp_ws = res_cmp_ws.status();
    let b_cmp_ws = response_json(res_cmp_ws).await;
    let st_dlq_ws = res_dlq_ws.status();
    let b_dlq_ws = response_json(res_dlq_ws).await;

    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_ent_bad, StatusCode::BAD_REQUEST);
    assert_eq!(b_ent_bad["error"].as_str(), Some("invalid_user_id"));

    assert_eq!(st_ent_limit, StatusCode::OK);
    assert_eq!(
        b_ent_limit["applied_filters"]["limit"].as_i64(),
        Some(500)
    );

    assert_eq!(st_ent_ws, StatusCode::OK);
    assert!(
        b_ent_ws["applied_filters"]["user_id"].is_null(),
        "whitespace user_id ignored: {:?}",
        b_ent_ws["applied_filters"]
    );

    assert_eq!(st_ent_long, StatusCode::OK);
    assert_eq!(
        b_ent_long["applied_filters"]["status"].as_str(),
        Some(status_128.as_str())
    );
    assert_eq!(
        b_ent_long["applied_filters"]["role_target"].as_str(),
        Some(role_128.as_str())
    );

    assert_eq!(st_jobs_bad, StatusCode::BAD_REQUEST);
    assert_eq!(b_jobs_bad["error"].as_str(), Some("invalid_user_id"));

    assert_eq!(st_jobs_limit, StatusCode::OK);
    assert_eq!(
        b_jobs_limit["applied_filters"]["limit"].as_i64(),
        Some(500)
    );

    assert_eq!(st_jobs_ws, StatusCode::OK);
    assert!(b_jobs_ws["applied_filters"]["user_id"].is_null());

    assert_eq!(st_dlq_bad, StatusCode::BAD_REQUEST);
    assert_eq!(b_dlq_bad["error"].as_str(), Some("invalid_user_id"));

    assert_eq!(st_dlq_ws, StatusCode::OK);
    assert_eq!(
        b_dlq_ws["applied_filters"]["limit"].as_i64(),
        Some(500)
    );
    assert!(b_dlq_ws["applied_filters"]["user_id"].is_null());

    assert_eq!(st_cmp_bad, StatusCode::BAD_REQUEST);
    assert_eq!(b_cmp_bad["error"].as_str(), Some("invalid_user_id"));

    assert_eq!(st_cmp_limit, StatusCode::OK);
    assert_eq!(
        b_cmp_limit["applied_filters"]["limit"].as_i64(),
        Some(500)
    );

    assert_eq!(st_cmp_ws, StatusCode::OK);
    assert!(b_cmp_ws["applied_filters"]["user_id"].is_null());
}

/// **70 / 96-18 + 96-09** → **`limit`** **省略** **→** **`applied_filters.limit`** **100**；**`limit=0`** **或负** **→** **钳位** **1**（**`GET …/onboarding/entitlements`**、**`GET …/onboarding/payment-events`**、**`GET …/entitlements/:id/payment-events`**、**`webhook-jobs`/`webhook-dlq`**、**`compliance-audit-events`**）。
#[tokio::test]
async fn matrix_93_admin_onb_022_admin_onboarding_list_limit_default_and_floor_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_022_admin_onboarding_list_limit_default_and_floor_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm22-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt22-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin22_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt22_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin22_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth = auth_bearer(&admin_token);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("payment-intents");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let res_ent_def = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements default limit");

    let res_ent_l0 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?limit=0")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("entitlements limit 0");

    let res_pe_g_def = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/payment-events")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("global payment-events default");

    let res_pe_g_lneg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/payment-events?limit=-40")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("global payment-events negative limit");

    let uri_pe_ent_def = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/payment-events"
    );
    let res_pe_ent_def = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe_ent_def)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("per-entitlement payment-events default");

    let uri_pe_ent_l0 =
        format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}/payment-events?limit=0");
    let res_pe_ent_l0 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_pe_ent_l0)
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("per-entitlement payment-events limit 0");

    let res_jobs_def = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-jobs")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-jobs default");

    let res_jobs_l0 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-jobs?limit=0")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-jobs limit 0");

    let res_dlq_def = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-dlq")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-dlq default");

    let res_cmp_def = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/compliance-audit-events")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("compliance-audit-events default limit");

    let res_cmp_l0 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/compliance-audit-events?limit=0")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("compliance-audit-events limit 0");

    let res_dlq_lneg = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-dlq?limit=-1")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("webhook-dlq negative limit");

    let st_ent_def = res_ent_def.status();
    let st_ent_l0 = res_ent_l0.status();
    let st_pe_g_def = res_pe_g_def.status();
    let st_pe_g_lneg = res_pe_g_lneg.status();
    let st_pe_ent_def = res_pe_ent_def.status();
    let st_pe_ent_l0 = res_pe_ent_l0.status();
    let st_jobs_def = res_jobs_def.status();
    let st_jobs_l0 = res_jobs_l0.status();
    let st_dlq_def = res_dlq_def.status();
    let st_cmp_def = res_cmp_def.status();
    let st_cmp_l0 = res_cmp_l0.status();
    let st_dlq_lneg = res_dlq_lneg.status();

    let b_ent_def = response_json(res_ent_def).await;
    let b_ent_l0 = response_json(res_ent_l0).await;
    let b_pe_g_def = response_json(res_pe_g_def).await;
    let b_pe_g_lneg = response_json(res_pe_g_lneg).await;
    let b_pe_ent_def = response_json(res_pe_ent_def).await;
    let b_pe_ent_l0 = response_json(res_pe_ent_l0).await;
    let b_jobs_def = response_json(res_jobs_def).await;
    let b_jobs_l0 = response_json(res_jobs_l0).await;
    let b_dlq_def = response_json(res_dlq_def).await;
    let b_cmp_def = response_json(res_cmp_def).await;
    let b_cmp_l0 = response_json(res_cmp_l0).await;
    let b_dlq_lneg = response_json(res_dlq_lneg).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_ent_def, StatusCode::OK);
    assert_eq!(
        b_ent_def["applied_filters"]["limit"].as_i64(),
        Some(100)
    );

    assert_eq!(st_ent_l0, StatusCode::OK);
    assert_eq!(b_ent_l0["applied_filters"]["limit"].as_i64(), Some(1));

    assert_eq!(st_pe_g_def, StatusCode::OK);
    assert_eq!(
        b_pe_g_def["applied_filters"]["limit"].as_i64(),
        Some(100)
    );

    assert_eq!(st_pe_g_lneg, StatusCode::OK);
    assert_eq!(b_pe_g_lneg["applied_filters"]["limit"].as_i64(), Some(1));

    assert_eq!(st_pe_ent_def, StatusCode::OK);
    assert_eq!(
        b_pe_ent_def["applied_filters"]["limit"].as_i64(),
        Some(100)
    );

    assert_eq!(st_pe_ent_l0, StatusCode::OK);
    assert_eq!(b_pe_ent_l0["applied_filters"]["limit"].as_i64(), Some(1));

    assert_eq!(st_jobs_def, StatusCode::OK);
    assert_eq!(
        b_jobs_def["applied_filters"]["limit"].as_i64(),
        Some(100)
    );

    assert_eq!(st_jobs_l0, StatusCode::OK);
    assert_eq!(b_jobs_l0["applied_filters"]["limit"].as_i64(), Some(1));

    assert_eq!(st_dlq_def, StatusCode::OK);
    assert_eq!(
        b_dlq_def["applied_filters"]["limit"].as_i64(),
        Some(100)
    );

    assert_eq!(st_dlq_lneg, StatusCode::OK);
    assert_eq!(b_dlq_lneg["applied_filters"]["limit"].as_i64(), Some(1));

    assert_eq!(st_cmp_def, StatusCode::OK);
    assert_eq!(
        b_cmp_def["applied_filters"]["limit"].as_i64(),
        Some(100)
    );

    assert_eq!(st_cmp_l0, StatusCode::OK);
    assert_eq!(b_cmp_l0["applied_filters"]["limit"].as_i64(), Some(1));
}

/// **70 / 96-18** → **`require_admin_actor`**：**DB 有会话** 但 **`ChainOffStore`** **无该用户** **→** **401** **`user_not_found`**；**`tourist`** **→** **403** **`admin_required`**。**全局** **`GET …/onboarding/payment-events?entitlement_id=%20%09`**：**忽略** **→** **`applied_filters.entitlement_id`** **null**。
#[tokio::test]
async fn matrix_93_admin_onb_023_admin_onboarding_authz_and_global_pe_entitlement_id_whitespace_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_023_admin_onboarding_authz_and_global_pe_entitlement_id_whitespace_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let now = Utc::now();

    // --- 401：admin 会话存在，但 ChainOff 未物化该用户 ---
    let admin_only_db = Uuid::new_v4();
    let admin_only_email = format!("onb-adm23a-{admin_only_db}@traveltrust.test");
    let admin_only_token = format!("tts_onb_admin23a_{}", Uuid::new_v4());
    cleanup_onboarding_it_user(&pool, admin_only_db).await;
    insert_user(
        &pool,
        admin_only_db,
        &admin_only_email,
        None,
        "admin",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin_only_db");
    insert_session(&pool, &admin_only_token, admin_only_db)
        .await
        .expect("insert_session admin_only_db");

    let app_empty_store = app_stack_router_seeded(pool.clone(), ChainOffStore::default());
    let res_401 = app_empty_store
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?limit=5")
                .header(
                    header::AUTHORIZATION,
                    auth_bearer(&admin_only_token),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("admin entitlements chainoff miss");
    let st_401 = res_401.status();
    let b_401 = response_json(res_401).await;
    cleanup_onboarding_it_user(&pool, admin_only_db).await;

    assert_eq!(st_401, StatusCode::UNAUTHORIZED);
    assert_eq!(b_401["error"].as_str(), Some("user_not_found"));

    // --- 403：tourist 已物化，但非 admin ---
    let tourist_id = Uuid::new_v4();
    let tourist_email = format!("onb-tgt23b-{tourist_id}@traveltrust.test");
    let tourist_token = format!("tts_onb_tourist23b_{}", Uuid::new_v4());
    cleanup_onboarding_it_user(&pool, tourist_id).await;
    insert_user(
        &pool,
        tourist_id,
        &tourist_email,
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
    .expect("insert_user tourist");
    insert_session(&pool, &tourist_token, tourist_id)
        .await
        .expect("insert_session tourist");

    let mut store_t = ChainOffStore::default();
    store_t.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: tourist_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    let app_tourist = app_stack_router_seeded(pool.clone(), store_t);
    let res_403 = app_tourist
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?limit=5")
                .header(header::AUTHORIZATION, auth_bearer(&tourist_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("tourist hits admin entitlements");
    let st_403 = res_403.status();
    let b_403 = response_json(res_403).await;
    cleanup_onboarding_it_user(&pool, tourist_id).await;

    assert_eq!(st_403, StatusCode::FORBIDDEN);
    assert_eq!(b_403["error"].as_str(), Some("admin_required"));

    // --- 全局 payment-events：entitlement_id 仅空白 → 不作为 UUID 过滤 ---
    let admin_ok = Uuid::new_v4();
    let admin_ok_email = format!("onb-adm23c-{admin_ok}@traveltrust.test");
    let admin_ok_token = format!("tts_onb_admin23c_{}", Uuid::new_v4());
    cleanup_onboarding_it_user(&pool, admin_ok).await;
    insert_user(
        &pool,
        admin_ok,
        &admin_ok_email,
        None,
        "admin",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin_ok");
    insert_session(&pool, &admin_ok_token, admin_ok)
        .await
        .expect("insert_session admin_ok");

    let mut store_ok = ChainOffStore::default();
    store_ok.users.insert(
        admin_ok,
        UserRow {
            id: admin_ok,
            email: admin_ok_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    let app_admin = app_stack_router_seeded(pool.clone(), store_ok);
    let res_pe_ws_ent = app_admin
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/payment-events?entitlement_id=%20%09&limit=5")
                .header(header::AUTHORIZATION, auth_bearer(&admin_ok_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("global pe whitespace entitlement_id");
    let st_pe = res_pe_ws_ent.status();
    let b_pe = response_json(res_pe_ws_ent).await;
    cleanup_onboarding_it_user(&pool, admin_ok).await;

    assert_eq!(st_pe, StatusCode::OK);
    assert_eq!(
        b_pe["meta"]["implementation_status"],
        "onboarding_payment_events_admin_list_db"
    );
    assert!(
        b_pe["applied_filters"]["entitlement_id"].is_null(),
        "whitespace-only entitlement_id ignored: {:?}",
        b_pe["applied_filters"]
    );
}

/// **70 / 96-18** → **`PATCH …/entitlements/:id`**：**`"admin": null`** **→** **400** **`admin_metadata_must_object`**。**`GET …/onboarding/entitlements`**：**`status`/`role_target`** **query** **仅空白** **→** **`applied_filters`** **对应** **null**（**不** 参与 SQL 精确过滤）。
#[tokio::test]
async fn matrix_93_admin_onb_024_patch_admin_null_and_list_filter_whitespace_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_024_patch_admin_null_and_list_filter_whitespace_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm24-{admin_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin24_{}", Uuid::new_v4());
    let ent = Uuid::new_v4();

    cleanup_onboarding_it_user(&pool, admin_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth = auth_bearer(&admin_token);

    let uri_patch = format!("/api/v1/admin/onboarding/entitlements/{ent}");
    let res_patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_patch)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"admin":null}"#.to_string()))
                .unwrap(),
        )
        .await
        .expect("patch admin null");

    let res_list_ws = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/entitlements?status=%20%09&role_target=%09%20&limit=10")
                .header(header::AUTHORIZATION, &auth)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("list whitespace status/role_target");

    let st_patch = res_patch.status();
    let b_patch = response_json(res_patch).await;
    let st_list = res_list_ws.status();
    let b_list = response_json(res_list_ws).await;

    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_patch, StatusCode::BAD_REQUEST);
    assert_eq!(
        b_patch["error"].as_str(),
        Some("admin_metadata_must_object")
    );

    assert_eq!(st_list, StatusCode::OK);
    assert_eq!(
        b_list["meta"]["implementation_status"],
        "onboarding_entitlements_admin_list_db"
    );
    assert!(
        b_list["applied_filters"]["status"].is_null(),
        "whitespace status ignored: {:?}",
        b_list["applied_filters"]
    );
    assert!(
        b_list["applied_filters"]["role_target"].is_null(),
        "whitespace role_target ignored: {:?}",
        b_list["applied_filters"]
    );
}

/// **70 / 96-18** → **`PATCH`/`POST …/revoke`**：**JSON** **体** **缺** **`admin`** / **`reason`** **字段** → **Axum `Json`** **反序列化失败**（**`400`/`422`**，**不** 进入业务 **`err_key`**）。
#[tokio::test]
async fn matrix_93_admin_onb_025_post_patch_onboarding_entitlement_missing_json_fields_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_025_post_patch_onboarding_entitlement_missing_json_fields_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm25-{admin_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin25_{}", Uuid::new_v4());
    let ent = Uuid::new_v4();

    cleanup_onboarding_it_user(&pool, admin_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth = auth_bearer(&admin_token);

    let uri_patch = format!("/api/v1/admin/onboarding/entitlements/{ent}");
    let res_patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_patch)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{}"#.to_string()))
                .unwrap(),
        )
        .await
        .expect("patch missing admin");

    let uri_rev = format!("/api/v1/admin/onboarding/entitlements/{ent}/revoke");
    let res_rev = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_rev)
                .header(header::AUTHORIZATION, &auth)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{}"#.to_string()))
                .unwrap(),
        )
        .await
        .expect("revoke missing reason");

    let st_patch = res_patch.status();
    let b_patch = response_json(res_patch).await;
    let st_rev = res_rev.status();
    let b_rev = response_json(res_rev).await;

    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert!(
        matches!(
            st_patch,
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "patch missing admin: unexpected {st_patch:?} body={b_patch:?}"
    );
    assert!(
        matches!(
            st_rev,
            StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY
        ),
        "revoke missing reason: unexpected {st_rev:?} body={b_rev:?}"
    );
}

/// **70 / 96-09** → **`super_admin`**：**`GET …/webhook-jobs`** / **`GET …/webhook-dlq`** / **`GET …/compliance-audit-events`** **200**（**与** **`admin`** **同权**）。**70 / 96-18** → **`POST …/revoke`**：**`reason`** **4001** **ASCII** **字符** **→** **`metadata.admin.revoke_reason`** **保留** **4000**（**`chars().take(4000)`**）。
#[tokio::test]
async fn matrix_93_admin_onb_026_super_admin_webhook_reads_and_revoke_reason_truncation_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_026_super_admin_webhook_reads_and_revoke_reason_truncation_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let now = Utc::now();

    // --- A: super_admin 可读 webhook 队列 ---
    let sa_id = Uuid::new_v4();
    let sa_email = format!("onb-sa26-{sa_id}@traveltrust.test");
    let sa_token = format!("tts_onb_sa26_{}", Uuid::new_v4());
    cleanup_onboarding_it_user(&pool, sa_id).await;
    insert_user(
        &pool,
        sa_id,
        &sa_email,
        None,
        "super_admin",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user super_admin 26");
    insert_session(&pool, &sa_token, sa_id)
        .await
        .expect("insert_session super_admin 26");

    let mut store_sa = ChainOffStore::default();
    store_sa.users.insert(
        sa_id,
        UserRow {
            id: sa_id,
            email: sa_email.clone(),
            password_hash: None,
            role: "super_admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    let app_sa = app_stack_router_seeded(pool.clone(), store_sa);
    let auth_sa = auth_bearer(&sa_token);

    let res_jobs = app_sa
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-jobs?limit=1")
                .header(header::AUTHORIZATION, &auth_sa)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("super_admin webhook-jobs");
    let res_cmp = app_sa
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/compliance-audit-events?limit=1")
                .header(header::AUTHORIZATION, &auth_sa)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("super_admin compliance-audit-events");
    let res_dlq = app_sa
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/webhook-dlq?limit=1")
                .header(header::AUTHORIZATION, &auth_sa)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("super_admin webhook-dlq");

    let st_jobs = res_jobs.status();
    let b_jobs = response_json(res_jobs).await;
    let st_cmp = res_cmp.status();
    let b_cmp = response_json(res_cmp).await;
    let st_dlq = res_dlq.status();
    let b_dlq = response_json(res_dlq).await;
    cleanup_onboarding_it_user(&pool, sa_id).await;

    assert_eq!(st_jobs, StatusCode::OK);
    assert_eq!(
        b_jobs["meta"]["implementation_status"],
        "onboarding_webhook_jobs_admin_db"
    );
    assert_eq!(st_cmp, StatusCode::OK);
    assert_eq!(
        b_cmp["meta"]["implementation_status"],
        "onboarding_compliance_audit_events_admin_list_db"
    );
    assert_eq!(st_dlq, StatusCode::OK);
    assert_eq!(
        b_dlq["meta"]["implementation_status"],
        "onboarding_webhook_dlq_admin_db"
    );

    // --- B: revoke reason 超长截断 ---
    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let admin_email = format!("onb-adm26-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt26-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin26_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt26_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin26_{}", Uuid::new_v4());
    let long_reason = "R".repeat(4001);

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin 26");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin 26");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target 26");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target 26");

    let mut store_adm = ChainOffStore::default();
    store_adm.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store_adm.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store_adm);
    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("payment-intents 26");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let uri_rev = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}/revoke");
    let revoke_body = json!({ "reason": long_reason }).to_string();
    let res_r = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_rev)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(revoke_body))
                .unwrap(),
        )
        .await
        .expect("revoke long reason");

    let uri_get = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}");
    let res_g = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_get)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get entitlement after revoke");

    let st_r = res_r.status();
    let b_r = response_json(res_r).await;
    let st_g = res_g.status();
    let b_g = response_json(res_g).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_r, StatusCode::OK);
    assert_eq!(
        b_r["meta"]["implementation_status"],
        "onboarding_entitlements_admin_revoke_db"
    );

    assert_eq!(st_g, StatusCode::OK);
    let rr = b_g["entitlement"]["metadata"]["admin"]["revoke_reason"]
        .as_str()
        .expect("revoke_reason str");
    assert_eq!(
        rr.chars().count(),
        4000,
        "revoke_reason should truncate to 4000 chars, got {}",
        rr.chars().count()
    );
    assert_eq!(rr, "R".repeat(4000));
}

/// **70 / 96-18** → **`super_admin`**：**`PATCH …/entitlements/:id`** **`metadata.admin`** **浅合并** **200**；随后 **`POST …/revoke`** **`pending`→`revoked`** **200**（**`require_admin_actor`** **与** **`admin`** **同权**）。
#[tokio::test]
async fn matrix_93_admin_onb_027_super_admin_patch_and_revoke_onboarding_entitlement_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_027_super_admin_patch_and_revoke_onboarding_entitlement_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let super_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let super_email = format!("onb-sa27-{super_id}@traveltrust.test");
    let target_email = format!("onb-tgt27-{target_id}@traveltrust.test");
    let super_token = format!("tts_onb_sa27_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt27_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin27_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, super_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

    insert_user(
        &pool,
        super_id,
        &super_email,
        None,
        "super_admin",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user super_admin 27");
    insert_session(&pool, &super_token, super_id)
        .await
        .expect("insert_session super_admin 27");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target 27");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target 27");

    let mut store = ChainOffStore::default();
    store.users.insert(
        super_id,
        UserRow {
            id: super_id,
            email: super_email.clone(),
            password_hash: None,
            role: "super_admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);
    let auth_sa = auth_bearer(&super_token);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("payment-intents 27");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let uri_patch = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}");
    let res_p = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(&uri_patch)
                .header(header::AUTHORIZATION, &auth_sa)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "admin": { "ops_note": "matrix_93_admin_onb_027 super_admin patch" } })
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("super_admin patch metadata");

    let uri_rev = format!("/api/v1/admin/onboarding/entitlements/{ent_id_str}/revoke");
    let res_r = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri_rev)
                .header(header::AUTHORIZATION, &auth_sa)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "reason": "matrix_93_admin_onb_027 super_admin revoke" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("super_admin revoke");

    let st_p = res_p.status();
    let b_p = response_json(res_p).await;
    let st_r = res_r.status();
    let b_r = response_json(res_r).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, super_id).await;

    assert_eq!(st_p, StatusCode::OK);
    assert_eq!(
        b_p["meta"]["implementation_status"],
        "onboarding_entitlements_admin_metadata_patch_db"
    );
    assert_eq!(
        b_p["entitlement"]["metadata"]["admin"]["ops_note"]
            .as_str()
            .expect("ops_note"),
        "matrix_93_admin_onb_027 super_admin patch"
    );

    assert_eq!(st_r, StatusCode::OK);
    assert_eq!(
        b_r["meta"]["implementation_status"],
        "onboarding_entitlements_admin_revoke_db"
    );
    assert_eq!(b_r["entitlement"]["status"], "revoked");
}

/// **70 / 96-18** → **`GET …/entitlements/:id/payment-events`** 与 **全局** **`GET …/onboarding/payment-events`**：**内网 webhook** **`succeeded`** 后 **`webhook`** 行可筛；**不存在** entitlement → **404**；**非法** **`entitlement_id`** query → **400**。
#[tokio::test]
async fn matrix_93_admin_onb_015_get_admin_onboarding_entitlement_payment_events_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_admin_onb_015_get_admin_onboarding_entitlement_payment_events_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let target_id = Uuid::new_v4();
    let now = Utc::now();
    let admin_email = format!("onb-adm15-{admin_id}@traveltrust.test");
    let target_email = format!("onb-tgt15-{target_id}@traveltrust.test");
    let admin_token = format!("tts_onb_admin15_{}", Uuid::new_v4());
    let target_token = format!("tts_onb_tgt15_{}", Uuid::new_v4());
    let idem = format!("idem_onb_admin15_{}", Uuid::new_v4());
    let evt_ref = format!("evt_admin015_{}", Uuid::new_v4());

    cleanup_onboarding_it_user(&pool, admin_id).await;
    cleanup_onboarding_it_user(&pool, target_id).await;

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
        None,
        now,
        now,
    )
    .await
    .expect("insert_user admin");
    insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert_session admin");

    insert_user(
        &pool,
        target_id,
        &target_email,
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
    .expect("insert_user target");
    insert_session(&pool, &target_token, target_id)
        .await
        .expect("insert_session target");

    let mut store = ChainOffStore::default();
    store.users.insert(
        admin_id,
        UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        target_id,
        UserRow {
            id: target_id,
            email: target_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );

    let app = app_stack_router_seeded(pool.clone(), store);

    let res_pi = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&target_token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res_pi.status(), StatusCode::OK);
    let pay = response_json(res_pi).await;
    let ent_id_str = pay["entitlement_id"]
        .as_str()
        .expect("entitlement_id str");

    let hook = json!({
        "schema_version": 1u32,
        "idempotency_key": idem,
        "provider_event_id": evt_ref,
        "outcome": "succeeded"
    });
    let res_wh = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/onboarding/payments/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(hook.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot webhook");
    assert_eq!(res_wh.status(), StatusCode::OK);

    let uri_ev = format!(
        "/api/v1/admin/onboarding/entitlements/{ent_id_str}/payment-events?limit=50"
    );
    let res_ev = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_ev)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot payment-events");

    let bogus_ent = Uuid::new_v4();
    let uri_bogus = format!(
        "/api/v1/admin/onboarding/entitlements/{bogus_ent}/payment-events?limit=10"
    );
    let res_bogus = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_bogus)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot bogus entitlement");

    let uri_global = format!(
        "/api/v1/admin/onboarding/payment-events?entitlement_id={}&event_type=webhook&limit=50",
        ent_id_str
    );
    let res_global = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri_global)
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot global payment-events");

    let res_bad_q = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/onboarding/payment-events?entitlement_id=not-a-uuid&limit=10")
                .header(header::AUTHORIZATION, auth_bearer(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot invalid entitlement_id query");

    let st_ev = res_ev.status();
    let body_ev = response_json(res_ev).await;
    let st_bogus = res_bogus.status();
    let body_bogus = response_json(res_bogus).await;
    let st_global = res_global.status();
    let body_global = response_json(res_global).await;
    let st_bad_q = res_bad_q.status();
    let body_bad_q = response_json(res_bad_q).await;

    cleanup_onboarding_it_user(&pool, target_id).await;
    cleanup_onboarding_it_user(&pool, admin_id).await;

    assert_eq!(st_ev, StatusCode::OK);
    assert_eq!(body_ev["status"], "ok");
    assert_eq!(
        body_ev["meta"]["implementation_status"],
        "onboarding_payment_events_admin_db"
    );
    let items = body_ev["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| {
            row["event_type"].as_str() == Some("webhook")
                && row["payload_ref"].as_str() == Some(evt_ref.as_str())
        }),
        "expected webhook payment_event: {:?}",
        body_ev
    );

    assert_eq!(st_bogus, StatusCode::NOT_FOUND);
    assert_eq!(body_bogus["error"], "onboarding_entitlement_not_found");

    assert_eq!(st_global, StatusCode::OK);
    assert_eq!(
        body_global["meta"]["implementation_status"],
        "onboarding_payment_events_admin_list_db"
    );
    let gitems = body_global["items"].as_array().expect("global items");
    assert!(
        gitems.iter().any(|row| {
            row["event_type"].as_str() == Some("webhook")
                && row["payload_ref"].as_str() == Some(evt_ref.as_str())
        }),
        "expected global list to include webhook row: {:?}",
        body_global
    );

    assert_eq!(st_bad_q, StatusCode::BAD_REQUEST);
    assert_eq!(body_bad_q["error"], "invalid_entitlement_id");
}

/// **93 · D-ONB-WEB / F-036-EXT** → **`POST /api/v1/hooks/stripe/onboarding`**：**`Stripe-Signature`** 验 **`payment_intent.succeeded`** → **`paid`**（**PG**；**合成** **`whsec_…`**，**不** 调 Stripe API；**不** 冒充浏览器 **Playwright** 全链）。
#[tokio::test]
async fn matrix_93_d_onb_005_f036_ext_stripe_payment_intent_succeeded_webhook_paid_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_005_f036_ext_stripe_payment_intent_succeeded_webhook_paid_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_whsec = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET").ok();
    let key32 = [0xA7u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", &whsec_val);

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stripe_{}", Uuid::new_v4());
    let idem = format!("idem_onb_stripe_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-stripe-wh-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    let restore_whsec = || match &prev_whsec {
        None => std::env::remove_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET"),
        Some(p) => std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", p),
    };

    if res.status() != StatusCode::OK {
        let st = res.status();
        let v = response_json(res).await;
        cleanup_onboarding_it_user(&pool, uid).await;
        restore_whsec();
        panic!("payment-intents unexpected status {st:?}: {v:?}");
    }
    let pay = response_json(res).await;
    let entitlement_id = pay["entitlement_id"].as_str().expect("entitlement_id");

    let evt_id = format!("evt_stripe_matrix_{}", Uuid::new_v4().simple());
    let pi_id = "pi_test_matrix_stripe_01";
    let stripe_event = json!({
        "id": evt_id,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "metadata": { "traveltrust_idempotency_key": idem }
            }
        }
    });
    let body = serde_json::to_vec(&stripe_event).expect("stripe event json");
    let sig = crate::stripe_onboarding::build_stripe_webhook_signature_header(&body, &whsec_val)
        .expect("stripe sig");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig)
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let stripe_status = res.status();
    let stripe_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ent_status = res.status();
    let ent = response_json(res).await;

    cleanup_onboarding_it_user(&pool, uid).await;
    restore_whsec();

    assert_eq!(stripe_status, StatusCode::OK);
    assert_eq!(
        stripe_body.get("applied"),
        Some(&serde_json::Value::Bool(true))
    );
    assert_eq!(ent_status, StatusCode::OK);
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| {
            e["id"].as_str() == Some(entitlement_id) && e["status"] == "paid"
        }),
        "expected paid after stripe webhook: {:?}",
        ent
    );
}

/// **93 · D-ONB-WEB** → **`charge.refunded`**（**全额**）→ **`paid` → `refunded`**；**幂等** **`stripe_evt:{event_id}`**。
#[tokio::test]
async fn matrix_93_d_onb_013_stripe_charge_refunded_webhook_refunded_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_013_stripe_charge_refunded_webhook_refunded_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_whsec = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET").ok();
    let key32 = [0xB3u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", &whsec_val);

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stripe_ref_{}", Uuid::new_v4());
    let idem = format!("idem_onb_stripe_ref_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-stripe-ref-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let restore_whsec = || match &prev_whsec {
        None => std::env::remove_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET"),
        Some(p) => std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", p),
    };

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    if res.status() != StatusCode::OK {
        let st = res.status();
        let v = response_json(res).await;
        cleanup_onboarding_it_user(&pool, uid).await;
        restore_whsec();
        panic!("payment-intents unexpected status {st:?}: {v:?}");
    }
    let pay = response_json(res).await;
    let entitlement_id = pay["entitlement_id"].as_str().expect("entitlement_id");

    let pi_id = "pi_test_matrix_stripe_ref_01";
    let evt_pi_ok = format!("evt_stripe_pi_ok_{}", Uuid::new_v4().simple());
    let stripe_pi_ok = json!({
        "id": evt_pi_ok,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "metadata": { "traveltrust_idempotency_key": idem }
            }
        }
    });
    let body_pi = serde_json::to_vec(&stripe_pi_ok).expect("json");
    let sig_pi =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_pi, &whsec_val)
            .expect("sig");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_pi)
                .body(Body::from(body_pi))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let pi_ok_body = response_json(res).await;
    assert_eq!(pi_ok_body.get("applied"), Some(&serde_json::Value::Bool(true)));

    let amt: i64 = 50_000;
    let evt_ref = format!("evt_stripe_charge_ref_{}", Uuid::new_v4().simple());
    let charge_refunded = json!({
        "id": evt_ref,
        "type": "charge.refunded",
        "data": {
            "object": {
                "id": "ch_test_matrix_ref_01",
                "payment_intent": pi_id,
                "amount": amt,
                "amount_refunded": amt
            }
        }
    });
    let body_ref = serde_json::to_vec(&charge_refunded).expect("json");
    let sig_ref =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_ref, &whsec_val)
            .expect("sig ref");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_ref)
                .body(Body::from(body_ref.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ref_st = res.status();
    let ref_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    "Stripe-Signature",
                    crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_ref, &whsec_val)
                        .expect("sig ref dup"),
                )
                .body(Body::from(body_ref))
                .unwrap(),
        )
        .await
        .expect("oneshot dup");
    let dup_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ent = response_json(res).await;

    cleanup_onboarding_it_user(&pool, uid).await;
    restore_whsec();

    assert_eq!(ref_st, StatusCode::OK);
    assert_eq!(
        ref_body.get("applied"),
        Some(&serde_json::Value::Bool(true))
    );
    assert_eq!(ref_body.get("source").and_then(|v| v.as_str()), Some("charge.refunded"));
    assert_eq!(
        dup_body.get("duplicate"),
        Some(&serde_json::Value::Bool(true))
    );
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| {
            e["id"].as_str() == Some(entitlement_id) && e["status"] == "refunded"
        }),
        "expected refunded after charge.refunded: {:?}",
        ent
    );
}

/// **93 · D-ONB-WEB** → **`payment_intent.succeeded`**（**`latest_charge`**）+ **`charge.dispute.funds_withdrawn`** → **`revoked`**。
#[tokio::test]
async fn matrix_93_d_onb_014_stripe_dispute_funds_withdrawn_revoked_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_014_stripe_dispute_funds_withdrawn_revoked_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_whsec = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET").ok();
    let key32 = [0xC1u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", &whsec_val);

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stripe_dsp_{}", Uuid::new_v4());
    let idem = format!("idem_onb_stripe_dsp_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-stripe-dsp-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let restore_whsec = || match &prev_whsec {
        None => std::env::remove_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET"),
        Some(p) => std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", p),
    };

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    if res.status() != StatusCode::OK {
        let st = res.status();
        let v = response_json(res).await;
        cleanup_onboarding_it_user(&pool, uid).await;
        restore_whsec();
        panic!("payment-intents unexpected status {st:?}: {v:?}");
    }
    let pay = response_json(res).await;
    let entitlement_id = pay["entitlement_id"].as_str().expect("entitlement_id");

    let pi_id = "pi_test_matrix_dispute_01";
    let ch_id = "ch_test_matrix_dispute_01";
    let evt_pi_ok = format!("evt_stripe_pi_dsp_{}", Uuid::new_v4().simple());
    let stripe_pi_ok = json!({
        "id": evt_pi_ok,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "latest_charge": ch_id,
                "metadata": { "traveltrust_idempotency_key": idem }
            }
        }
    });
    let body_pi = serde_json::to_vec(&stripe_pi_ok).expect("json");
    let sig_pi =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_pi, &whsec_val)
            .expect("sig");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_pi)
                .body(Body::from(body_pi))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let evt_du = format!("evt_stripe_dispute_{}", Uuid::new_v4().simple());
    let dispute_ev = json!({
        "id": evt_du,
        "type": "charge.dispute.funds_withdrawn",
        "data": {
            "object": {
                "id": "du_test_matrix_01",
                "object": "dispute",
                "charge": ch_id,
                "payment_intent": pi_id
            }
        }
    });
    let body_du = serde_json::to_vec(&dispute_ev).expect("json");
    let sig_du =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_du, &whsec_val)
            .expect("sig du");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_du)
                .body(Body::from(body_du.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let du_st = res.status();
    let du_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    "Stripe-Signature",
                    crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_du, &whsec_val)
                        .expect("sig du dup"),
                )
                .body(Body::from(body_du))
                .unwrap(),
        )
        .await
        .expect("oneshot dup");
    let du_dup = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ent = response_json(res).await;

    cleanup_onboarding_it_user(&pool, uid).await;
    restore_whsec();

    assert_eq!(du_st, StatusCode::OK);
    assert_eq!(du_body.get("applied"), Some(&serde_json::Value::Bool(true)));
    assert_eq!(
        du_body.get("source").and_then(|v| v.as_str()),
        Some("charge.dispute.funds_withdrawn")
    );
    assert_eq!(
        du_dup.get("duplicate"),
        Some(&serde_json::Value::Bool(true))
    );
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| {
            e["id"].as_str() == Some(entitlement_id) && e["status"] == "revoked"
        }),
        "expected revoked after dispute funds_withdrawn: {:?}",
        ent
    );
}

/// **93 · D-ONB-WEB** → **`charge.refunded`** 在 **`refunded`** 后 **新** **`event_id`**：**审计** **`onboarding_payment_events`**，**不**改 **`status`**；**重放** → **`duplicate`**。
#[tokio::test]
async fn matrix_93_d_onb_015_stripe_charge_refunded_terminal_audit_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_015_stripe_charge_refunded_terminal_audit_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_whsec = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET").ok();
    let key32 = [0xD2u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", &whsec_val);

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stripe_ref_term_{}", Uuid::new_v4());
    let idem = format!("idem_onb_stripe_ref_term_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-stripe-ref-term-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let restore_whsec = || match &prev_whsec {
        None => std::env::remove_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET"),
        Some(p) => std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", p),
    };

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    if res.status() != StatusCode::OK {
        let st = res.status();
        let v = response_json(res).await;
        cleanup_onboarding_it_user(&pool, uid).await;
        restore_whsec();
        panic!("payment-intents unexpected status {st:?}: {v:?}");
    }

    let pi_id = "pi_test_matrix_stripe_ref_terminal_015";
    let evt_pi_ok = format!("evt_stripe_pi_term_{}", Uuid::new_v4().simple());
    let stripe_pi_ok = json!({
        "id": evt_pi_ok,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "metadata": { "traveltrust_idempotency_key": idem }
            }
        }
    });
    let body_pi = serde_json::to_vec(&stripe_pi_ok).expect("json");
    let sig_pi =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_pi, &whsec_val)
            .expect("sig");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_pi)
                .body(Body::from(body_pi))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let amt: i64 = 50_000;
    let evt_ref1 = format!("evt_stripe_charge_ref_term1_{}", Uuid::new_v4().simple());
    let charge_ref1 = json!({
        "id": evt_ref1,
        "type": "charge.refunded",
        "data": {
            "object": {
                "id": "ch_test_matrix_ref_term_015",
                "payment_intent": pi_id,
                "amount": amt,
                "amount_refunded": amt
            }
        }
    });
    let body_ref1 = serde_json::to_vec(&charge_ref1).expect("json");
    let sig_ref1 =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_ref1, &whsec_val)
            .expect("sig ref1");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_ref1)
                .body(Body::from(body_ref1.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);
    let ref1_body = response_json(res).await;
    assert_eq!(ref1_body.get("applied"), Some(&serde_json::Value::Bool(true)));

    let evt_ref2 = format!("evt_stripe_charge_ref_term2_{}", Uuid::new_v4().simple());
    let charge_ref2 = json!({
        "id": evt_ref2,
        "type": "charge.refunded",
        "data": {
            "object": {
                "id": "ch_test_matrix_ref_term_015b",
                "payment_intent": pi_id,
                "amount": amt,
                "amount_refunded": amt
            }
        }
    });
    let body_ref2 = serde_json::to_vec(&charge_ref2).expect("json");
    let sig_ref2 =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_ref2, &whsec_val)
            .expect("sig ref2");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_ref2)
                .body(Body::from(body_ref2.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot term audit");
    assert_eq!(res.status(), StatusCode::OK);
    let ref2_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    "Stripe-Signature",
                    crate::stripe_onboarding::build_stripe_webhook_signature_header(
                        &body_ref2, &whsec_val,
                    )
                    .expect("sig ref2 dup"),
                )
                .body(Body::from(body_ref2))
                .unwrap(),
        )
        .await
        .expect("oneshot term dup");
    let ref2_dup = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ent = response_json(res).await;

    cleanup_onboarding_it_user(&pool, uid).await;
    restore_whsec();

    assert_eq!(ref2_body.get("applied"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(
        ref2_body
            .get("detail")
            .and_then(|v| v.as_str()),
        Some("stripe_charge_refunded_entitlement_already_terminal_audit_recorded")
    );
    assert_eq!(
        ref2_dup.get("duplicate"),
        Some(&serde_json::Value::Bool(true))
    );
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| e["status"] == "refunded"),
        "expected still refunded: {:?}",
        ent
    );
}

/// **93 · D-ONB-WEB** → **`charge.dispute.funds_withdrawn`** 在 **`revoked`** 后 **新** **`event_id`**：**审计** **幂等**。
#[tokio::test]
async fn matrix_93_d_onb_016_stripe_dispute_funds_withdrawn_terminal_audit_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_016_stripe_dispute_funds_withdrawn_terminal_audit_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_whsec = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET").ok();
    let key32 = [0xD3u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", &whsec_val);

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stripe_dsp_term_{}", Uuid::new_v4());
    let idem = format!("idem_onb_stripe_dsp_term_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-stripe-dsp-term-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let restore_whsec = || match &prev_whsec {
        None => std::env::remove_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET"),
        Some(p) => std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", p),
    };

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    if res.status() != StatusCode::OK {
        let st = res.status();
        let v = response_json(res).await;
        cleanup_onboarding_it_user(&pool, uid).await;
        restore_whsec();
        panic!("payment-intents unexpected status {st:?}: {v:?}");
    }

    let pi_id = "pi_test_matrix_dispute_terminal_016";
    let ch_id = "ch_test_matrix_dispute_terminal_016";
    let evt_pi_ok = format!("evt_stripe_pi_dsp_term_{}", Uuid::new_v4().simple());
    let stripe_pi_ok = json!({
        "id": evt_pi_ok,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "latest_charge": ch_id,
                "metadata": { "traveltrust_idempotency_key": idem }
            }
        }
    });
    let body_pi = serde_json::to_vec(&stripe_pi_ok).expect("json");
    let sig_pi =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_pi, &whsec_val)
            .expect("sig");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_pi)
                .body(Body::from(body_pi))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let evt_du1 = format!("evt_stripe_dispute_term1_{}", Uuid::new_v4().simple());
    let dispute1 = json!({
        "id": evt_du1,
        "type": "charge.dispute.funds_withdrawn",
        "data": {
            "object": {
                "id": "du_test_matrix_term_01",
                "object": "dispute",
                "charge": ch_id,
                "payment_intent": pi_id
            }
        }
    });
    let body_du1 = serde_json::to_vec(&dispute1).expect("json");
    let sig_du1 =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_du1, &whsec_val)
            .expect("sig du1");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_du1)
                .body(Body::from(body_du1.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot du1");
    assert_eq!(res.status(), StatusCode::OK);
    let du1_body = response_json(res).await;
    assert_eq!(du1_body.get("applied"), Some(&serde_json::Value::Bool(true)));

    let evt_du2 = format!("evt_stripe_dispute_term2_{}", Uuid::new_v4().simple());
    let dispute2 = json!({
        "id": evt_du2,
        "type": "charge.dispute.funds_withdrawn",
        "data": {
            "object": {
                "id": "du_test_matrix_term_02",
                "object": "dispute",
                "charge": ch_id,
                "payment_intent": pi_id
            }
        }
    });
    let body_du2 = serde_json::to_vec(&dispute2).expect("json");
    let sig_du2 =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_du2, &whsec_val)
            .expect("sig du2");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_du2)
                .body(Body::from(body_du2.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot du2");
    let du2_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    "Stripe-Signature",
                    crate::stripe_onboarding::build_stripe_webhook_signature_header(
                        &body_du2, &whsec_val,
                    )
                    .expect("sig du2 dup"),
                )
                .body(Body::from(body_du2))
                .unwrap(),
        )
        .await
        .expect("oneshot du2 dup");
    let du2_dup = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ent = response_json(res).await;

    cleanup_onboarding_it_user(&pool, uid).await;
    restore_whsec();

    assert_eq!(du2_body.get("applied"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(
        du2_body
            .get("detail")
            .and_then(|v| v.as_str()),
        Some("stripe_dispute_funds_withdrawn_entitlement_already_terminal_audit_recorded")
    );
    assert_eq!(
        du2_dup.get("duplicate"),
        Some(&serde_json::Value::Bool(true))
    );
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| e["status"] == "revoked"),
        "expected still revoked: {:?}",
        ent
    );
}

/// **93 · D-ONB-WEB** → **`charge.refunded`** **部分** **审计**（**`paid`** **保持**）→ **全额** **`refunded`**。
#[tokio::test]
async fn matrix_93_d_onb_017_stripe_charge_refunded_partial_then_full_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_onb_017_stripe_charge_refunded_partial_then_full_app_stack_ok_pg (no migrated DATABASE_URL)"
        );
        return;
    };

    let prev_whsec = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET").ok();
    let key32 = [0xD4u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", &whsec_val);

    let uid = Uuid::new_v4();
    let token = format!("tts_onb_stripe_partial_{}", Uuid::new_v4());
    let idem = format!("idem_onb_stripe_partial_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("onb-stripe-partial-{uid}@traveltrust.test");
    cleanup_onboarding_it_user(&pool, uid).await;
    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, uid).await.expect("insert_session");

    let app = app_stack_router(pool.clone());

    let restore_whsec = || match &prev_whsec {
        None => std::env::remove_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET"),
        Some(p) => std::env::set_var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET", p),
    };

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/onboarding/payment-intents")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header("Idempotency-Key", &idem)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"role":"provider"}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    if res.status() != StatusCode::OK {
        let st = res.status();
        let v = response_json(res).await;
        cleanup_onboarding_it_user(&pool, uid).await;
        restore_whsec();
        panic!("payment-intents unexpected status {st:?}: {v:?}");
    }

    let pi_id = "pi_test_matrix_partial_then_full_017";
    let evt_pi_ok = format!("evt_stripe_pi_partial_{}", Uuid::new_v4().simple());
    let stripe_pi_ok = json!({
        "id": evt_pi_ok,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": pi_id,
                "metadata": { "traveltrust_idempotency_key": idem }
            }
        }
    });
    let body_pi = serde_json::to_vec(&stripe_pi_ok).expect("json");
    let sig_pi =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_pi, &whsec_val)
            .expect("sig");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_pi)
                .body(Body::from(body_pi))
                .unwrap(),
        )
        .await
        .expect("oneshot");
    assert_eq!(res.status(), StatusCode::OK);

    let amt: i64 = 50_000;
    let evt_partial = format!("evt_stripe_partial_{}", Uuid::new_v4().simple());
    let charge_partial = json!({
        "id": evt_partial,
        "type": "charge.refunded",
        "data": {
            "object": {
                "id": "ch_test_matrix_partial_017",
                "payment_intent": pi_id,
                "amount": amt,
                "amount_refunded": amt / 2
            }
        }
    });
    let body_partial = serde_json::to_vec(&charge_partial).expect("json");
    let sig_partial =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_partial, &whsec_val)
            .expect("sig partial");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_partial)
                .body(Body::from(body_partial.clone()))
                .unwrap(),
        )
        .await
        .expect("oneshot partial");
    let partial_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    "Stripe-Signature",
                    crate::stripe_onboarding::build_stripe_webhook_signature_header(
                        &body_partial, &whsec_val,
                    )
                    .expect("sig partial dup"),
                )
                .body(Body::from(body_partial))
                .unwrap(),
        )
        .await
        .expect("oneshot partial dup");
    let partial_dup = response_json(res).await;

    let evt_full = format!("evt_stripe_full_after_partial_{}", Uuid::new_v4().simple());
    let charge_full = json!({
        "id": evt_full,
        "type": "charge.refunded",
        "data": {
            "object": {
                "id": "ch_test_matrix_partial_017b",
                "payment_intent": pi_id,
                "amount": amt,
                "amount_refunded": amt
            }
        }
    });
    let body_full = serde_json::to_vec(&charge_full).expect("json");
    let sig_full =
        crate::stripe_onboarding::build_stripe_webhook_signature_header(&body_full, &whsec_val)
            .expect("sig full");

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/hooks/stripe/onboarding")
                .header(header::CONTENT_TYPE, "application/json")
                .header("Stripe-Signature", sig_full)
                .body(Body::from(body_full))
                .unwrap(),
        )
        .await
        .expect("oneshot full");
    let full_body = response_json(res).await;

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/onboarding/entitlements/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");
    let ent = response_json(res).await;

    cleanup_onboarding_it_user(&pool, uid).await;
    restore_whsec();

    assert_eq!(
        partial_body.get("detail").and_then(|v| v.as_str()),
        Some("partial_refund_audit_recorded")
    );
    assert_eq!(partial_body.get("applied"), Some(&serde_json::Value::Bool(true)));
    assert_eq!(
        partial_dup.get("duplicate"),
        Some(&serde_json::Value::Bool(true))
    );
    assert_eq!(full_body.get("applied"), Some(&serde_json::Value::Bool(true)));
    let arr = ent["entitlements"].as_array().expect("entitlements");
    assert!(
        arr.iter().any(|e| e["status"] == "refunded"),
        "expected refunded after full charge.refunded: {:?}",
        ent
    );
}
