//! 异步任务、调度运行、配置发布登记（250、260、220；04 §3.5）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct AsyncJobRow {
    pub id: Uuid,
    pub queue_name: String,
    pub job_type: String,
    pub status: String,
    pub attempt_count: i32,
    pub max_attempts: i32,
    pub last_error: Option<String>,
    pub payload_ref: Option<String>,
    pub idempotency_key: Option<String>,
    pub scheduled_for: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct SchedulerJobRunRow {
    pub id: Uuid,
    pub job_code: String,
    pub status: String,
    pub trigger_source: String,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub error_summary: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ConfigReleaseRow {
    pub id: Uuid,
    pub release_key: String,
    pub version_label: String,
    pub status: String,
    pub effective_from: Option<DateTime<Utc>>,
    pub rolled_back_at: Option<DateTime<Utc>>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn async_jobs_status_counts(pool: &PgPool) -> Result<HashMap<String, i64>, sqlx::Error> {
    let rows: Vec<(String, i64)> =
        sqlx::query_as(r#"SELECT status, COUNT(*)::bigint FROM async_jobs GROUP BY status"#)
            .fetch_all(pool)
            .await?;
    Ok(rows.into_iter().collect())
}

pub async fn list_async_jobs(
    pool: &PgPool,
    status_filter: Option<&str>,
    limit: i64,
) -> Result<Vec<AsyncJobRow>, sqlx::Error> {
    sqlx::query_as::<_, AsyncJobRow>(
        r#"
        SELECT id, queue_name, job_type, status, attempt_count, max_attempts, last_error,
               payload_ref, idempotency_key, scheduled_for, created_at, updated_at
        FROM async_jobs
        WHERE ($1::text IS NULL OR status = $1)
        ORDER BY updated_at DESC
        LIMIT $2
        "#,
    )
    .bind(status_filter)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn list_scheduler_job_runs(
    pool: &PgPool,
    job_code_filter: Option<&str>,
    limit: i64,
) -> Result<Vec<SchedulerJobRunRow>, sqlx::Error> {
    sqlx::query_as::<_, SchedulerJobRunRow>(
        r#"
        SELECT id, job_code, status, trigger_source, started_at, finished_at, error_summary, created_at
        FROM scheduler_job_runs
        WHERE ($1::text IS NULL OR job_code = $1)
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(job_code_filter)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn insert_scheduler_manual_rerun(
    pool: &PgPool,
    job_code: &str,
) -> Result<SchedulerJobRunRow, sqlx::Error> {
    insert_scheduler_job_queued(pool, job_code, "manual_rerun").await
}

/// 入队一条待执行调度（cron / system / 与 manual_rerun 同表）
pub async fn insert_scheduler_job_queued(
    pool: &PgPool,
    job_code: &str,
    trigger_source: &str,
) -> Result<SchedulerJobRunRow, sqlx::Error> {
    sqlx::query_as::<_, SchedulerJobRunRow>(
        r#"
        INSERT INTO scheduler_job_runs (job_code, status, trigger_source, started_at, finished_at)
        VALUES ($1, 'queued', $2, NULL, NULL)
        RETURNING id, job_code, status, trigger_source, started_at, finished_at, error_summary, created_at
        "#,
    )
    .bind(job_code)
    .bind(trigger_source)
    .fetch_one(pool)
    .await
}

/// 领取最早一条 `queued` 并置为 `running`（SKIP LOCKED）
pub async fn claim_next_queued_scheduler_job_run(
    pool: &PgPool,
) -> Result<Option<SchedulerJobRunRow>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let row = sqlx::query_as::<_, SchedulerJobRunRow>(
        r#"
        WITH c AS (
            SELECT id FROM scheduler_job_runs
            WHERE status = 'queued'
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE scheduler_job_runs AS j
        SET status = 'running', started_at = now()
        FROM c
        WHERE j.id = c.id
        RETURNING j.id, j.job_code, j.status, j.trigger_source, j.started_at, j.finished_at, j.error_summary, j.created_at
        "#,
    )
    .fetch_optional(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(row)
}

pub async fn complete_scheduler_job_run(
    pool: &PgPool,
    id: Uuid,
    success: bool,
    error_summary: Option<&str>,
) -> Result<(), sqlx::Error> {
    let status = if success { "success" } else { "failed" };
    sqlx::query(
        r#"
        UPDATE scheduler_job_runs
        SET status = $2, finished_at = now(), error_summary = $3
        WHERE id = $1
        "#,
    )
    .bind(id)
    .bind(status)
    .bind(error_summary)
    .execute(pool)
    .await?;
    Ok(())
}

/// `release_key` / `status` 为 **`None`** 时不筛选；**`status`** 须在调用前校验为 **`draft`/`published`/`rolled_back`**
pub async fn list_config_releases(
    pool: &PgPool,
    release_key: Option<&str>,
    status: Option<&str>,
    limit: i64,
) -> Result<Vec<ConfigReleaseRow>, sqlx::Error> {
    sqlx::query_as::<_, ConfigReleaseRow>(
        r#"
        SELECT id, release_key, version_label, status, effective_from, rolled_back_at, notes, created_at, updated_at
        FROM config_releases
        WHERE ($1::text IS NULL OR release_key = $1)
          AND ($2::text IS NULL OR status = $2)
        ORDER BY updated_at DESC, created_at DESC
        LIMIT $3
        "#,
    )
    .bind(release_key)
    .bind(status)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_config_release_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<ConfigReleaseRow>, sqlx::Error> {
    sqlx::query_as::<_, ConfigReleaseRow>(
        r#"
        SELECT id, release_key, version_label, status, effective_from, rolled_back_at, notes, created_at, updated_at
        FROM config_releases
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}
