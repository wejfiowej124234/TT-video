use chrono::{DateTime, Utc};
use uuid::Uuid;

use super::helpers::{router_with_pg, seed_trust_gate_ok, trust_gate_seed_it_lock, RestoreEnvVar};

/// **`resolve_open`** 夹具：旧 E2E 在 PG 留下 **`resolved`** 后，再次 seed 须 **DO UPDATE** 回 **`open`**，否则 **`GET /disputes/:id`** 长期读 PG 与陈 **`chain_off`** 分叉（Playwright **`trust-gate-dispute-resolve`** 只读断言超时）。
#[tokio::test]
async fn matrix_93_b_tg_005_post_seed_resyncs_stale_resolved_dispute_row_to_open() {
    let _g = trust_gate_seed_it_lock().lock().await;

    let Some(pool) = crate::it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!("skip: matrix_93_b_tg_005_post_seed_resyncs_stale_resolved_dispute_row_to_open (DATABASE_URL unset)");
        return;
    }
    let _seed_env = RestoreEnvVar::set("SEED_TEST_ACCOUNTS", "1");
    let app = router_with_pg(pool.clone());
    let dispute_id =
        Uuid::parse_str("f0e0d301-0001-4001-8001-000000000006").expect("resolve_open fixture");

    seed_trust_gate_ok(&app).await;

    // 勿写入随机 **arbitrator_id**：表上有 **`disputes_arbitrator_id_fkey`** → **`users`**。
    sqlx::query(
        r#"UPDATE disputes SET status = 'resolved', resolved_at = NOW(), updated_at = NOW() WHERE id = $1"#,
    )
    .bind(dispute_id)
    .execute(&pool)
    .await
    .expect("simulate stale resolved PG row");

    let stale: (String,) = sqlx::query_as("SELECT status FROM disputes WHERE id = $1")
        .bind(dispute_id)
        .fetch_one(&pool)
        .await
        .expect("select stale status");
    assert_eq!(stale.0, "resolved");

    seed_trust_gate_ok(&app).await;

    let fresh: (String, Option<DateTime<Utc>>) =
        sqlx::query_as("SELECT status, resolved_at FROM disputes WHERE id = $1")
            .bind(dispute_id)
            .fetch_one(&pool)
            .await
            .expect("select after re-seed");
    assert_eq!(
        fresh.0, "open",
        "re-seed must upsert PG dispute to chain_off open"
    );
    assert!(
        fresh.1.is_none(),
        "re-seed must clear resolved_at for resolve_open fixture"
    );
}
