//! DSAR 请求台账与内部工具审计（500/450、04 §3.5）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ComplianceDataRequestRow {
    pub id: Uuid,
    pub request_ref: String,
    pub subject_id: String,
    pub request_type: String,
    pub status: String,
    pub due_at: Option<DateTime<Utc>>,
    pub sla_hours: Option<i32>,
    pub jurisdiction: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: i32,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct InternalToolAuditEventRow {
    pub id: Uuid,
    pub tool_id: String,
    pub tool_name: Option<String>,
    pub action_code: String,
    pub actor_id: Option<String>,
    pub approval_request_id: Option<Uuid>,
    pub resource_ref: Option<String>,
    pub input_digest: Option<String>,
    pub result_digest: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ComplianceDataRequestEventRow {
    pub id: Uuid,
    pub request_id: Uuid,
    pub event_type: String,
    pub event_detail: Option<String>,
    pub occurred_at: DateTime<Utc>,
}

pub async fn get_compliance_data_request_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<ComplianceDataRequestRow>, sqlx::Error> {
    sqlx::query_as::<_, ComplianceDataRequestRow>(
        r#"
        SELECT
            id,
            request_ref,
            subject_id,
            request_type,
            status,
            due_at,
            sla_hours,
            jurisdiction,
            notes,
            created_at,
            updated_at,
            version
        FROM compliance_data_requests
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// `request_ref_pattern` / `subject_id_pattern` / `jurisdiction_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**；`request_type_eq` / `status_eq`：精确匹配，或 **`None`**。
pub async fn list_compliance_data_requests(
    pool: &PgPool,
    request_ref_pattern: Option<&str>,
    subject_id_pattern: Option<&str>,
    request_type_eq: Option<&str>,
    status_eq: Option<&str>,
    jurisdiction_pattern: Option<&str>,
    limit: i64,
) -> Result<Vec<ComplianceDataRequestRow>, sqlx::Error> {
    sqlx::query_as::<_, ComplianceDataRequestRow>(
        r#"
        SELECT
            id,
            request_ref,
            subject_id,
            request_type,
            status,
            due_at,
            sla_hours,
            jurisdiction,
            notes,
            created_at,
            updated_at,
            version
        FROM compliance_data_requests
        WHERE ($1::text IS NULL OR request_ref ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR subject_id ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR request_type = $3)
          AND ($4::text IS NULL OR status = $4)
          AND ($5::text IS NULL OR COALESCE(jurisdiction, '') ILIKE $5 ESCAPE '\')
        ORDER BY due_at ASC NULLS LAST, created_at DESC
        LIMIT $6
        "#,
    )
    .bind(request_ref_pattern)
    .bind(subject_id_pattern)
    .bind(request_type_eq)
    .bind(status_eq)
    .bind(jurisdiction_pattern)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// Admin 更新 DSAR 行（可选改 `status`/`notes`）并追加一条事件；`expected_version` 乐观锁。
pub async fn admin_update_compliance_data_request(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    new_status: Option<&str>,
    new_notes: Option<&str>,
    event_type: &str,
    event_detail: Option<&str>,
) -> Result<Option<ComplianceDataRequestRow>, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let updated = sqlx::query_as::<_, ComplianceDataRequestRow>(
        r#"
        UPDATE compliance_data_requests SET
            status = COALESCE($1, status),
            notes = COALESCE($2, notes),
            version = version + 1,
            updated_at = now()
        WHERE id = $3 AND version = $4
        RETURNING
            id,
            request_ref,
            subject_id,
            request_type,
            status,
            due_at,
            sla_hours,
            jurisdiction,
            notes,
            created_at,
            updated_at,
            version
        "#,
    )
    .bind(new_status)
    .bind(new_notes)
    .bind(id)
    .bind(expected_version)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(row) = updated else {
        tx.rollback().await?;
        return Ok(None);
    };

    sqlx::query(
        r#"
        INSERT INTO compliance_data_request_events (request_id, event_type, event_detail)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(id)
    .bind(event_type)
    .bind(event_detail)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(row))
}

/// `event_type_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_compliance_data_request_events(
    pool: &PgPool,
    request_id: Uuid,
    event_type_pattern: Option<&str>,
    limit: i64,
) -> Result<Vec<ComplianceDataRequestEventRow>, sqlx::Error> {
    sqlx::query_as::<_, ComplianceDataRequestEventRow>(
        r#"
        SELECT
            id,
            request_id,
            event_type,
            event_detail,
            occurred_at
        FROM compliance_data_request_events
        WHERE request_id = $1
          AND ($2::text IS NULL OR event_type ILIKE $2 ESCAPE '\')
        ORDER BY occurred_at DESC
        LIMIT $3
        "#,
    )
    .bind(request_id)
    .bind(event_type_pattern)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// `tool_id_pattern` / `action_code_pattern` / `actor_id_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_internal_tool_audit_events(
    pool: &PgPool,
    tool_id_pattern: Option<&str>,
    action_code_pattern: Option<&str>,
    actor_id_pattern: Option<&str>,
    approval_request_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<InternalToolAuditEventRow>, sqlx::Error> {
    sqlx::query_as::<_, InternalToolAuditEventRow>(
        r#"
        SELECT
            id,
            tool_id,
            tool_name,
            action_code,
            actor_id,
            approval_request_id,
            resource_ref,
            input_digest,
            result_digest,
            created_at
        FROM internal_tool_audit_events
        WHERE ($1::text IS NULL OR tool_id ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR action_code ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR actor_id ILIKE $3 ESCAPE '\')
          AND ($4::uuid IS NULL OR approval_request_id = $4)
        ORDER BY created_at DESC
        LIMIT $5
        "#,
    )
    .bind(tool_id_pattern)
    .bind(action_code_pattern)
    .bind(actor_id_pattern)
    .bind(approval_request_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}
