//! **120 / 96-09**：**`/metrics`** 用 webhook 队列快照。

use sqlx::PgPool;

/// **120 / 96-09**：**`GET /metrics`** 用 **`onboarding_webhook_jobs`**（按 **`status`**）、**`onboarding_webhook_dlq`** 总行数、以及 **`replayed_at IS NULL`** 的 **DLQ** 行数（**未回灌 / 待值班**）做**单次聚合**快照。表不存在或查询失败时由调用方回落 **`-1`**（与 **`traveltrust_active_sessions_missing_token_hash`** 同源语义）。
pub async fn snapshot_onboarding_webhook_queue_counts_for_metrics(
    pool: &PgPool,
) -> Result<(i64, i64, i64, i64, i64, i64), sqlx::Error> {
    sqlx::query_as::<_, (i64, i64, i64, i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*) FILTER (WHERE status = 'pending')::bigint,
            COUNT(*) FILTER (WHERE status = 'processing')::bigint,
            COUNT(*) FILTER (WHERE status = 'done')::bigint,
            COUNT(*) FILTER (WHERE status = 'dead')::bigint,
            (SELECT COUNT(*)::bigint FROM onboarding_webhook_dlq),
            (SELECT COUNT(*)::bigint FROM onboarding_webhook_dlq WHERE replayed_at IS NULL)
        FROM onboarding_webhook_jobs
        "#,
    )
    .fetch_one(pool)
    .await
}
