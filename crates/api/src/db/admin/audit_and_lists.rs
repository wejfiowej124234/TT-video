//! 审计写入与 Admin 可观测列表（schema / migration / backfill / dual_write）

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::types::{
    AdminAuditLogRow, BackfillJobRow, DualWriteCheckRow, MigrationHistoryRow, MigrationRollbackRow,
    SchemaVersionRow,
};

pub async fn insert_admin_audit_log(
    pool: &PgPool,
    actor_id: Uuid,
    request_id: Option<&str>,
    action: &str,
    resource_type: Option<&str>,
    resource_id: Option<&str>,
    payload: &Value,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(action)
    .bind(resource_type)
    .bind(resource_id)
    .bind(actor_id)
    .bind(request_id)
    .bind(payload)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_admin_audit_logs(
    pool: &PgPool,
    actor_id: Option<Uuid>,
    action: Option<&str>,
    resource_type: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminAuditLogRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<String>,
            Option<String>,
            Uuid,
            Option<String>,
            Value,
            DateTime<Utc>,
        ),
    >(
        "SELECT id, action, resource_type, resource_id, actor_id, request_id, payload, created_at
         FROM admin_audit_logs
         WHERE ($1::uuid IS NULL OR actor_id = $1)
           AND ($2::text IS NULL OR action = $2)
           AND ($3::text IS NULL OR resource_type = $3)
         ORDER BY created_at DESC
         LIMIT $4",
    )
    .bind(actor_id)
    .bind(action)
    .bind(resource_type)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                action,
                resource_type,
                resource_id,
                actor_id,
                request_id,
                payload,
                created_at,
            )| {
                AdminAuditLogRow {
                    id,
                    action,
                    resource_type,
                    resource_id,
                    actor_id,
                    request_id,
                    payload,
                    created_at,
                }
            },
        )
        .collect())
}

pub async fn fetch_admin_audit_log_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminAuditLogRow>, sqlx::Error> {
    let row = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<String>,
            Option<String>,
            Uuid,
            Option<String>,
            Value,
            DateTime<Utc>,
        ),
    >(
        "SELECT id, action, resource_type, resource_id, actor_id, request_id, payload, created_at
         FROM admin_audit_logs
         WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(
        |(id, action, resource_type, resource_id, actor_id, request_id, payload, created_at)| {
            AdminAuditLogRow {
                id,
                action,
                resource_type,
                resource_id,
                actor_id,
                request_id,
                payload,
                created_at,
            }
        },
    ))
}

pub async fn list_schema_versions(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<SchemaVersionRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, String, Option<DateTime<Utc>>, DateTime<Utc>)>(
        "SELECT version_no, status, released_at, updated_at
         FROM schema_versions
         ORDER BY updated_at DESC
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(version_no, status, released_at, updated_at)| SchemaVersionRow {
                version_no,
                status,
                released_at,
                updated_at,
            },
        )
        .collect())
}

pub async fn list_migration_histories(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<MigrationHistoryRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            String,
            Option<String>,
            Option<String>,
            String,
            DateTime<Utc>,
        ),
    >(
        "SELECT migration_id, from_version, to_version, result, created_at
         FROM migration_histories
         ORDER BY created_at DESC
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(migration_id, from_version, to_version, result, created_at)| MigrationHistoryRow {
                migration_id,
                from_version,
                to_version,
                result,
                created_at,
            },
        )
        .collect())
}

pub async fn list_migration_rollbacks(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<MigrationRollbackRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, String, Option<String>, String, DateTime<Utc>)>(
        "SELECT rollback_id, target_version, trigger_reason, result, created_at
         FROM migration_rollbacks
         ORDER BY created_at DESC
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(rollback_id, target_version, trigger_reason, result, created_at)| {
                MigrationRollbackRow {
                    rollback_id,
                    target_version,
                    trigger_reason,
                    result,
                    created_at,
                }
            },
        )
        .collect())
}

pub async fn list_backfill_jobs(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<BackfillJobRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, String, f64, i64, String, DateTime<Utc>)>(
        "SELECT job_id, scope, progress, error_count, status, updated_at
         FROM backfill_jobs
         ORDER BY updated_at DESC
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(job_id, scope, progress, error_count, status, updated_at)| BackfillJobRow {
                job_id,
                scope,
                progress,
                error_count,
                status,
                updated_at,
            },
        )
        .collect())
}

pub async fn list_dual_write_checks(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<DualWriteCheckRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            String,
            Option<String>,
            Option<String>,
            i64,
            String,
            Option<DateTime<Utc>>,
        ),
    >(
        "SELECT check_id, old_digest, new_digest, diff_count, status, checked_at
         FROM dual_write_checks
         ORDER BY checked_at DESC NULLS LAST, created_at DESC
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(check_id, old_digest, new_digest, diff_count, status, checked_at)| {
                DualWriteCheckRow {
                    check_id,
                    old_digest,
                    new_digest,
                    diff_count,
                    status,
                    checked_at,
                }
            },
        )
        .collect())
}
