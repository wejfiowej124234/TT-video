//! **96-09**：子命令 **`traveltrust-api onboarding-webhook-worker`** — 独立进程认领 **`onboarding_webhook_jobs`**（**`FOR UPDATE SKIP LOCKED`**）并 **`apply_payment_webhook`**。
//!
//! 与 **`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`**（关 **`tokio::spawn`**）同读 **TT-9618**。
//! 每轮循环前置 **`requeue_stale_onboarding_webhook_jobs_processing`**（**`ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS`**，默认 **600**；**0** = 关闭）；可选 **`ONBOARDING_WEBHOOK_DLQ_AUTO_REPLAY`** → **`requeue_onboarding_webhook_dlq_to_pending_jobs`**（**TT-9618 §3.6.2**）。**可选** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`**：**`requeue_*`** **与** **域表先行** **`claim_next_pending_onboarding_webhook_job`** **路径** **与** **`db::onboarding`** **同源** **`async_jobs`** **双写**（**stderr-only** **失败**）。**可选** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1`**（**须** **`MIRROR=1`**）：**`claim_next_pending_onboarding_webhook_job_from_async_jobs`** — **`async_jobs`** **先行** **`SKIP LOCKED`** **与** **域表** **同句** **`pending`→`processing`/`running`**（**250** **阶段 2**；**勿**与 **API** **`tokio::spawn`** **内联** **抢** **同一** **`pending`**）。

use std::time::Duration;

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::db::{
    apply_api_migrations, apply_onboarding_webhook_job_payload, claim_next_pending_onboarding_webhook_job,
    claim_next_pending_onboarding_webhook_job_from_async_jobs,
    requeue_onboarding_webhook_dlq_to_pending_jobs, requeue_stale_onboarding_webhook_jobs_processing,
};

fn env_truthy_onboarding(k: &str) -> bool {
    std::env::var(k)
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes"
        })
        .unwrap_or(false)
}

pub async fn run_cli() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let url = std::env::var("DATABASE_URL").map_err(|_| "DATABASE_URL must be set")?;
    let url = url.trim();
    if url.is_empty() {
        return Err("DATABASE_URL is empty".into());
    }
    let max_conn: u32 = std::env::var("ONBOARDING_WEBHOOK_WORKER_DB_MAX_CONNECTIONS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(2)
        .max(1);

    let pool: PgPool = PgPoolOptions::new()
        .max_connections(max_conn)
        .connect(url)
        .await?;
    apply_api_migrations(&pool).await?;

    if env_truthy_onboarding("ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM") {
        if !env_truthy_onboarding("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR") {
            return Err(
                "ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1 requires ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1"
                    .into(),
            );
        }
    }

    let mode = std::env::var("ONBOARDING_WEBHOOK_WORKER_MODE")
        .map(|s| s.trim().to_ascii_lowercase())
        .unwrap_or_else(|_| "drain".to_string());
    let poll_ms: u64 = std::env::var("ONBOARDING_WEBHOOK_WORKER_POLL_MS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(500);
    let stale_requeue_secs: i64 = std::env::var("ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(600);

    loop {
        if stale_requeue_secs > 0 {
            let rq = requeue_stale_onboarding_webhook_jobs_processing(&pool, stale_requeue_secs).await?;
            if rq > 0 {
                eprintln!(
                    "[onboarding_webhook_worker] requeued {rq} stale processing job(s) (threshold {stale_requeue_secs}s)"
                );
            }
        }
        if env_truthy_onboarding("ONBOARDING_WEBHOOK_DLQ_AUTO_REPLAY") {
            let min_age: i64 = std::env::var("ONBOARDING_WEBHOOK_DLQ_REPLAY_MIN_AGE_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(120)
                .max(0);
            let max_per: i64 = std::env::var("ONBOARDING_WEBHOOK_DLQ_REPLAY_MAX_PER_TICK")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(3)
                .max(1)
                .min(100);
            let dr = requeue_onboarding_webhook_dlq_to_pending_jobs(&pool, min_age, max_per).await?;
            if dr > 0 {
                eprintln!(
                    "[onboarding_webhook_worker] requeued {dr} onboarding_webhook_dlq row(s) → jobs (pending); min_age_sec={min_age} max_per_tick={max_per}"
                );
            }
        }
        let mut n = 0u64;
        let claim_from_async = env_truthy_onboarding("ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM");
        while let Some((job_id, payload)) = if claim_from_async {
            claim_next_pending_onboarding_webhook_job_from_async_jobs(&pool).await?
        } else {
            claim_next_pending_onboarding_webhook_job(&pool).await?
        } {
            apply_onboarding_webhook_job_payload(&pool, job_id, &payload).await?;
            n += 1;
        }
        if mode == "drain" {
            eprintln!("[onboarding_webhook_worker] mode=drain: processed {n} job(s), exiting.");
            return Ok(());
        }
        if mode != "daemon" {
            return Err(format!(
                "ONBOARDING_WEBHOOK_WORKER_MODE must be 'drain' or 'daemon', got {mode:?}"
            )
            .into());
        }
        if n == 0 {
            tokio::time::sleep(Duration::from_millis(poll_ms)).await;
        }
    }
}
