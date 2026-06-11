//! **PHASE1_5 §6 · S1–S4** 专用 **cargo·IT** 矩阵（**① 本地 · PG**）。
//!
//! | 故事 | 本文件测试 | 互补 |
//! |------|------------|------|
//! | **S1** | `phase15_identity_s1_default_wallet_users_pg` | 烟测 `smoke-phase15-identity-demo-local.sh` |
//! | **S2** | `phase15_identity_s2_guide_dual_write_pg` | `role_identity_dual_write_guide_*` |
//! | **S3** | `phase15_identity_s3_provider_onboarding_pg` | `role_identity_dual_write_onboarding_*` (provider) |
//! | **S4** | `phase15_identity_s4_region_steward_onboarding_pg` | `role_identity_dual_write_onboarding_region_steward_*` |
//!
//! **跳过**：未设置 **`DATABASE_URL`**（须已迁移）。

use chrono::Utc;
use serde_json::json;
use sqlx::PgPool;
use std::sync::OnceLock;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::onboarding::{
    insert_or_get_pending_entitlement, InsertPendingEntitlementOutcome,
};
use super::{insert_guide, insert_user, list_wallets_for_user, sync_primary_wallet_dual_write};

static PHASE15_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn it_lock() -> &'static Mutex<()> {
    PHASE15_IT_LOCK.get_or_init(|| Mutex::new(()))
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
    let _ = sqlx::query("DELETE FROM role_applications WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM wallets WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

async fn insert_test_user(pool: &PgPool, user_id: Uuid) {
    let now = Utc::now();
    let email = format!("phase15-{user_id}@traveltrust.test");
    insert_user(
        pool,
        user_id,
        &email,
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
    .expect("insert_user");
}

/// **S1** · 注册侧用户行 + **`default_wallet_address`**（**①** · 与 `PUT /api/v1/me` 落库列同源）。
#[tokio::test]
async fn phase15_identity_s1_default_wallet_users_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: phase15_identity_s1_default_wallet_users_pg (DATABASE_URL unset)");
        return;
    };
    let user_id = Uuid::new_v4();
    let wallet = "0x4a62316623ad457F02cDC5D997deD67a383EC569";
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id).await;

    sqlx::query("UPDATE users SET default_wallet_address = $2, updated_at = $3 WHERE id = $1")
        .bind(user_id)
        .bind(wallet)
        .bind(Utc::now())
        .execute(&pool)
        .await
        .expect("update wallet");

    let stored: Option<String> = sqlx::query_scalar(
        "SELECT default_wallet_address FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .expect("select wallet");
    assert_eq!(
        stored.as_deref(),
        Some(wallet),
        "S1: users.default_wallet_address"
    );

    cleanup_user(&pool, user_id).await;
}

/// **S1b** · **`sync_primary_wallet_dual_write`** + **`list_wallets_for_user`**（**PD-004** · `PUT /me` 同源）。
#[tokio::test]
async fn phase15_identity_s1b_primary_wallet_wallets_table_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: phase15_identity_s1b_primary_wallet_wallets_table_pg (DATABASE_URL unset)");
        return;
    };
    let user_id = Uuid::new_v4();
    let wallet = "0x1111111111111111111111111111111111111111";
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id).await;

    sync_primary_wallet_dual_write(&pool, user_id, wallet, now)
        .await
        .expect("sync_primary_wallet_dual_write");

    let listed = list_wallets_for_user(&pool, user_id)
        .await
        .expect("list_wallets_for_user");
    assert_eq!(listed.len(), 1, "S1b: one primary wallet row");
    assert_eq!(
        listed[0].get("address").and_then(|v| v.as_str()),
        Some(wallet)
    );
    assert_eq!(
        listed[0].get("is_primary").and_then(|v| v.as_bool()),
        Some(true)
    );

    cleanup_user(&pool, user_id).await;
}

/// **S2** · 向导申请双写 **`role_applications` + `role_documents`**。
#[tokio::test]
async fn phase15_identity_s2_guide_dual_write_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: phase15_identity_s2_guide_dual_write_pg (DATABASE_URL unset)");
        return;
    };
    let user_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id).await;

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
        Some("Phase15 Guide"),
        Some("hash"),
        Some("https://cdn.example/id.jpg"),
        Some("https://cdn.example/cert.jpg"),
        None,
        "0",
        None,
        None,
        "pending",
        now,
        now,
    )
    .await
    .expect("insert_guide");

    let app_kind: Option<String> = sqlx::query_scalar(
        r#"
        SELECT kind FROM role_applications
        WHERE user_id = $1 AND legacy_ref->>'guides_id' = $2
        "#,
    )
    .bind(user_id)
    .bind(guide_id.to_string())
    .fetch_optional(&pool)
    .await
    .expect("role_applications");
    assert_eq!(app_kind.as_deref(), Some("guide"));

    cleanup_user(&pool, user_id).await;
}

/// **S3** · 商家准入 **`provider_onboarding`** + **`onboarding_fee`** 质押行。
#[tokio::test]
async fn phase15_identity_s3_provider_onboarding_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: phase15_identity_s3_provider_onboarding_pg (DATABASE_URL unset)");
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("phase15_s3_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id).await;

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
    .expect("insert entitlement");
    let InsertPendingEntitlementOutcome::Ok(ent) = outcome else {
        panic!("expected Ok entitlement, got {outcome:?}");
    };

    let kind: Option<String> = sqlx::query_scalar(
        r#"
        SELECT kind FROM role_applications
        WHERE user_id = $1 AND legacy_ref->>'entitlement_id' = $2
        "#,
    )
    .bind(user_id)
    .bind(ent.id.to_string())
    .fetch_optional(&pool)
    .await
    .expect("application kind");
    assert_eq!(kind.as_deref(), Some("provider_onboarding"));

    cleanup_user(&pool, user_id).await;
}

/// **S4** · 主理人 **`region_steward_onboarding`**。
#[tokio::test]
async fn phase15_identity_s4_region_steward_onboarding_pg() {
    let _g = it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: phase15_identity_s4_region_steward_onboarding_pg (DATABASE_URL unset)");
        return;
    };
    let user_id = Uuid::new_v4();
    let idem = format!("phase15_s4_{}", Uuid::new_v4());
    cleanup_user(&pool, user_id).await;
    insert_test_user(&pool, user_id).await;

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

    let kind: Option<String> = sqlx::query_scalar(
        r#"
        SELECT kind FROM role_applications
        WHERE user_id = $1 AND legacy_ref->>'entitlement_id' = $2
        "#,
    )
    .bind(user_id)
    .bind(ent.id.to_string())
    .fetch_optional(&pool)
    .await
    .expect("application kind");
    assert_eq!(kind.as_deref(), Some("region_steward_onboarding"));

    cleanup_user(&pool, user_id).await;
}
