//! ①.5 Phase A：**旧表主写入 → 新身份三表** 双写一致性（**PG·IT**；须 **`DATABASE_URL`** + 已迁移）。
//! **不**切换读路径；仅断言 **`role_applications` / `role_documents` / `staking_positions`** 随写路径更新。

use std::sync::OnceLock;

use chrono::Utc;
use serde_json::json;
use sqlx::PgPool;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::onboarding::{
    apply_payment_webhook, insert_or_get_pending_entitlement, InsertPendingEntitlementOutcome,
    WebhookApplyOutcome,
};
use super::role_identity::dual_write_after_guide_stake;
use super::{insert_guide, insert_user, update_guide_registration_review};

static ROLE_IDENTITY_DUAL_WRITE_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn it_lock() -> &'static Mutex<()> {
    ROLE_IDENTITY_DUAL_WRITE_IT_LOCK.get_or_init(|| Mutex::new(()))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

async fn cleanup_user(pool: &PgPool, user_id: Uuid) {
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
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

#[derive(Debug, sqlx::FromRow)]
struct ApplicationRow {
    id: Uuid,
    kind: String,
    status: String,
    legacy_guides_id: Option<String>,
    legacy_entitlement_id: Option<String>,
}

async fn load_guide_application(
    pool: &PgPool,
    user_id: Uuid,
    guides_id: Uuid,
) -> Option<ApplicationRow> {
    sqlx::query_as::<_, ApplicationRow>(
        r#"
        SELECT id, kind, status,
               legacy_ref->>'guides_id' AS legacy_guides_id,
               legacy_ref->>'entitlement_id' AS legacy_entitlement_id
        FROM role_applications
        WHERE user_id = $1 AND kind = 'guide' AND legacy_ref->>'guides_id' = $2
        "#,
    )
    .bind(user_id)
    .bind(guides_id.to_string())
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
}

async fn load_onboarding_application(
    pool: &PgPool,
    user_id: Uuid,
    entitlement_id: Uuid,
    kind: &str,
) -> Option<ApplicationRow> {
    sqlx::query_as::<_, ApplicationRow>(
        r#"
        SELECT id, kind, status,
               legacy_ref->>'guides_id' AS legacy_guides_id,
               legacy_ref->>'entitlement_id' AS legacy_entitlement_id
        FROM role_applications
        WHERE user_id = $1 AND kind = $2 AND legacy_ref->>'entitlement_id' = $3
        "#,
    )
    .bind(user_id)
    .bind(kind)
    .bind(entitlement_id.to_string())
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
}

async fn count_documents(pool: &PgPool, application_id: Uuid) -> i64 {
    sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM role_documents WHERE application_id = $1",
    )
    .bind(application_id)
    .fetch_one(pool)
    .await
    .unwrap_or(0)
}

#[derive(Debug, sqlx::FromRow)]
struct StakingRow {
    kind: String,
    amount: String,
    status: String,
}

async fn load_staking(
    pool: &PgPool,
    application_id: Uuid,
    kind: &str,
) -> Option<StakingRow> {
    sqlx::query_as::<_, StakingRow>(
        r#"
        SELECT kind, amount, status FROM staking_positions
        WHERE application_id = $1 AND kind = $2
        "#,
    )
    .bind(application_id)
    .bind(kind)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
}

async fn insert_test_user(pool: &PgPool, user_id: Uuid, role: &str) {
    let now = Utc::now();
    let email = format!("role-id-dw-{user_id}@traveltrust.test");
    insert_user(
        pool,
        user_id,
        &email,
        None,
        role,
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user");
}

/// **`insert_guide`** → **`role_applications`(submitted)** + **`role_documents`**。
#[tokio::test]
async fn role_identity_dual_write_guide_insert_application_and_documents_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_guide_insert_application_and_documents_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    insert_guide(
        &pool,
        guide_id,
        user_id,
        "Shanghai",
        "CN",
        &["zh".to_string()],
        &["walking".to_string()],
        Some("bio"),
        Some("0xguide_wallet"),
        Some("Guide Name"),
        Some("abc123hash"),
        Some("https://cdn.example/id.jpg"),
        Some("https://cdn.example/cert.jpg"),
        None,
        "0",
        "pending",
        now,
        now,
    )
    .await
    .expect("insert_guide");

    let app = load_guide_application(&pool, user_id, guide_id)
        .await
        .expect("role_applications row");
    assert_eq!(app.kind, "guide");
    assert_eq!(app.status, "submitted");
    assert_eq!(app.legacy_guides_id.as_deref(), Some(guide_id.to_string().as_str()));

    let doc_count = count_documents(&pool, app.id).await;
    assert!(
        doc_count >= 2,
        "expected role_documents for id_photo + language_cert, got {doc_count}"
    );

    cleanup_user(&pool, user_id).await;
}

/// **`update_guide_registration_review`** → **`approved`**（active + 无 rejection）。
#[tokio::test]
async fn role_identity_dual_write_guide_admin_review_maps_approved_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_guide_admin_review_maps_approved_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "guide").await;

    insert_guide(
        &pool,
        guide_id,
        user_id,
        "Tokyo",
        "JP",
        &[],
        &[],
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "pending",
        now,
        now,
    )
    .await
    .expect("insert_guide");

    let updated = now + chrono::Duration::seconds(1);
    let n = update_guide_registration_review(&pool, guide_id, "active", &[], None, updated)
        .await
        .expect("update_guide_registration_review");
    assert_eq!(n, 1);

    let app = load_guide_application(&pool, user_id, guide_id)
        .await
        .expect("application");
    assert_eq!(app.status, "approved");

    cleanup_user(&pool, user_id).await;
}

/// **`update_guide_stake`** → **`staking_positions`**（identity_pool_guide · locked）。
#[tokio::test]
async fn role_identity_dual_write_guide_stake_position_locked_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_guide_stake_position_locked_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    insert_guide(
        &pool,
        guide_id,
        user_id,
        "Paris",
        "FR",
        &[],
        &[],
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "pending",
        now,
        now,
    )
    .await
    .expect("insert_guide");

    let stake_at = now + chrono::Duration::seconds(2);
    sqlx::query(
        "UPDATE guides SET stake_amount = $2, status = $3, updated_at = $4 WHERE id = $1",
    )
    .bind(guide_id)
    .bind("100")
    .bind("active")
    .bind(stake_at)
    .execute(&pool)
    .await
    .expect("update guides stake");
    dual_write_after_guide_stake(&pool, guide_id, user_id, "100", "active", stake_at).await;

    let app = load_guide_application(&pool, user_id, guide_id)
        .await
        .expect("application");
    let stake = load_staking(&pool, app.id, "identity_pool_guide")
        .await
        .expect("staking_positions row");
    assert_eq!(stake.amount, "100");
    assert_eq!(stake.status, "locked");

    let (db_amount, db_status): (String, String) = sqlx::query_as(
        "SELECT stake_amount, status FROM guides WHERE id = $1",
    )
    .bind(guide_id)
    .fetch_one(&pool)
    .await
    .expect("guides row");
    assert_eq!(db_amount, "100");
    assert_eq!(db_status, "active");

    cleanup_user(&pool, user_id).await;
}

/// **`insert_or_get_pending_entitlement`** → **`provider_onboarding` · submitted** + **onboarding_fee · pending**。
#[tokio::test]
async fn role_identity_dual_write_onboarding_pending_entitlement_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_onboarding_pending_entitlement_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("idem_role_dw_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    let outcome = insert_or_get_pending_entitlement(
        &pool,
        user_id,
        "provider",
        "default",
        "stub-v0",
        &idem,
        None,
        &json!({}),
    )
    .await
    .expect("insert_or_get_pending_entitlement");
    let InsertPendingEntitlementOutcome::Ok(ent) = outcome else {
        panic!("expected Ok entitlement, got {outcome:?}");
    };
    let app = load_onboarding_application(&pool, user_id, ent.id, "provider_onboarding")
        .await
        .expect("role_applications");
    assert_eq!(app.status, "submitted");
    assert_eq!(
        app.legacy_entitlement_id.as_deref(),
        Some(ent.id.to_string().as_str())
    );

    let stake = load_staking(&pool, app.id, "onboarding_fee")
        .await
        .expect("onboarding_fee staking");
    assert_eq!(stake.status, "pending");

    cleanup_user(&pool, user_id).await;
}

/// **`region_steward`** 准入 **`pending`** 同步 **`region_steward_onboarding`**。
#[tokio::test]
async fn role_identity_dual_write_onboarding_region_steward_kind_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_onboarding_region_steward_kind_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("idem_steward_dw_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    let outcome = insert_or_get_pending_entitlement(
        &pool,
        user_id,
        "region_steward",
        "default",
        "stub-v0",
        &idem,
        None,
        &json!({}),
    )
    .await
    .expect("insert entitlement");
    let InsertPendingEntitlementOutcome::Ok(ent) = outcome else {
        panic!("expected Ok");
    };
    let app = load_onboarding_application(&pool, user_id, ent.id, "region_steward_onboarding")
        .await
        .expect("application");
    assert_eq!(app.kind, "region_steward_onboarding");
    assert_eq!(app.status, "submitted");

    cleanup_user(&pool, user_id).await;
}

/// **`apply_payment_webhook`(succeeded)** → **`approved`** + **onboarding_fee · locked**。
#[tokio::test]
async fn role_identity_dual_write_onboarding_webhook_paid_maps_approved_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_onboarding_webhook_paid_maps_approved_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("idem_webhook_dw_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    let InsertPendingEntitlementOutcome::Ok(ent) =
        insert_or_get_pending_entitlement(
            &pool,
            user_id,
            "provider",
            "default",
            "stub-v0",
            &idem,
            None,
            &json!({}),
        )
        .await
        .expect("insert entitlement")
    else {
        panic!("expected Ok");
    };
    let wh = apply_payment_webhook(
        &pool,
        &idem,
        "evt_role_identity_dw_001",
        "succeeded",
        Some("pi_test_001"),
    )
    .await
    .expect("webhook");
    assert_eq!(wh, WebhookApplyOutcome::Accepted);

    let app = load_onboarding_application(&pool, user_id, ent.id, "provider_onboarding")
        .await
        .expect("application");
    assert_eq!(app.status, "approved");

    let stake = load_staking(&pool, app.id, "onboarding_fee")
        .await
        .expect("staking");
    assert_eq!(stake.status, "locked");

    let ent_status: String =
        sqlx::query_scalar("SELECT status::text FROM onboarding_entitlements WHERE id = $1")
            .bind(ent.id)
            .fetch_one(&pool)
            .await
            .expect("entitlement status");
    assert_eq!(ent_status, "paid");

    cleanup_user(&pool, user_id).await;
}

/// 幂等 **webhook** 重放后三表状态仍稳定。
#[tokio::test]
async fn role_identity_dual_write_onboarding_webhook_duplicate_stable_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_onboarding_webhook_duplicate_stable_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("idem_dup_dw_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    let InsertPendingEntitlementOutcome::Ok(ent) =
        insert_or_get_pending_entitlement(
            &pool,
            user_id,
            "provider",
            "default",
            "stub-v0",
            &idem,
            None,
            &json!({}),
        )
        .await
        .expect("insert")
    else {
        panic!("expected Ok");
    };
    assert_eq!(
        apply_payment_webhook(&pool, &idem, "evt_dup_1", "succeeded", None)
            .await
            .expect("wh1"),
        WebhookApplyOutcome::Accepted
    );
    assert_eq!(
        apply_payment_webhook(&pool, &idem, "evt_dup_1", "succeeded", None)
            .await
            .expect("wh2"),
        WebhookApplyOutcome::DuplicateEvent
    );

    let app = load_onboarding_application(&pool, user_id, ent.id, "provider_onboarding")
        .await
        .expect("application");
    assert_eq!(app.status, "approved");

    let app_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM role_applications
        WHERE user_id = $1 AND kind = 'provider_onboarding' AND legacy_ref->>'entitlement_id' = $2
        "#,
    )
    .bind(user_id)
    .bind(ent.id.to_string())
    .fetch_one(&pool)
    .await
    .expect("count applications");
    assert_eq!(app_count, 1, "duplicate webhook must not fork applications");

    cleanup_user(&pool, user_id).await;
}

/// **`insert_or_get` 幂等** 不重复 fork **`role_applications`**。
#[tokio::test]
async fn role_identity_dual_write_onboarding_idempotent_insert_single_application_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: role_identity_dual_write_onboarding_idempotent_insert_single_application_pg (DATABASE_URL unset)"
        );
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("idem_same_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id, "tourist").await;

    let o1 = insert_or_get_pending_entitlement(
        &pool,
        user_id,
        "provider",
        "default",
        "stub-v0",
        &idem,
        None,
        &json!({}),
    )
    .await
    .expect("first");
    let o2 = insert_or_get_pending_entitlement(
        &pool,
        user_id,
        "provider",
        "default",
        "stub-v0",
        &idem,
        None,
        &json!({}),
    )
    .await
    .expect("second");
    let InsertPendingEntitlementOutcome::Ok(e1) = o1 else {
        panic!("first insert");
    };    let InsertPendingEntitlementOutcome::Ok(e2) = o2 else {
        panic!("second insert");
    };    assert_eq!(e1.id, e2.id);

    let app_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM role_applications
        WHERE user_id = $1 AND kind = 'provider_onboarding'
        "#,
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .expect("count");
    assert_eq!(app_count, 1);

    cleanup_user(&pool, user_id).await;
}
