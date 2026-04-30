use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

pub async fn insert_auth_audit_event(
    pool: &PgPool,
    event_type: &str,
    user_id: Option<Uuid>,
    request_id: Option<&str>,
    client_ip: Option<&str>,
    user_agent: Option<&str>,
    reason: Option<&str>,
    payload: &Value,
) -> Result<(), sqlx::Error> {
    #[cfg(test)]
    if std::env::var("TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL").as_deref() == Ok("1") {
        return Err(sqlx::Error::Protocol(
            "forced auth audit insert failure in test".into(),
        ));
    }
    sqlx::query(
        r#"
        INSERT INTO auth_audit_events (event_type, user_id, request_id, client_ip, user_agent, reason, payload, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
    )
    .bind(event_type)
    .bind(user_id)
    .bind(request_id)
    .bind(client_ip)
    .bind(user_agent)
    .bind(reason)
    .bind(payload)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    Ok(())
}

#[derive(Debug, Clone)]
pub struct AuthAuditEventRow {
    pub id: Uuid,
    pub event_type: String,
    pub user_id: Option<Uuid>,
    pub request_id: Option<String>,
    pub client_ip: Option<String>,
    pub user_agent: Option<String>,
    pub reason: Option<String>,
    pub payload: Value,
    pub created_at: DateTime<Utc>,
}

pub async fn list_auth_audit_events(
    pool: &PgPool,
    event_type: Option<&str>,
    user_id: Option<Uuid>,
    client_ip: Option<&str>,
    created_at_from: Option<DateTime<Utc>>,
    created_at_to: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<AuthAuditEventRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<Uuid>,
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
            Value,
            DateTime<Utc>,
        ),
    >(
        r#"
        SELECT id, event_type, user_id, request_id, client_ip, user_agent, reason, payload, created_at
        FROM auth_audit_events
        WHERE ($1::text IS NULL OR event_type = $1)
          AND ($2::uuid IS NULL OR user_id = $2)
          AND ($3::text IS NULL OR client_ip = $3)
          AND ($4::timestamptz IS NULL OR created_at >= $4)
          AND ($5::timestamptz IS NULL OR created_at <= $5)
        ORDER BY created_at DESC
        LIMIT $6
        "#,
    )
    .bind(event_type)
    .bind(user_id)
    .bind(client_ip)
    .bind(created_at_from)
    .bind(created_at_to)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                event_type,
                user_id,
                request_id,
                client_ip,
                user_agent,
                reason,
                payload,
                created_at,
            )| AuthAuditEventRow {
                id,
                event_type,
                user_id,
                request_id,
                client_ip,
                user_agent,
                reason,
                payload,
                created_at,
            },
        )
        .collect())
}

pub async fn list_auth_audit_events_by_reason(
    pool: &PgPool,
    event_type: Option<&str>,
    reason: Option<&str>,
    user_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<AuthAuditEventRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<Uuid>,
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
            Value,
            DateTime<Utc>,
        ),
    >(
        r#"
        SELECT id, event_type, user_id, request_id, client_ip, user_agent, reason, payload, created_at
        FROM auth_audit_events
        WHERE ($1::text IS NULL OR event_type = $1)
          AND ($2::text IS NULL OR reason = $2)
          AND ($3::uuid IS NULL OR user_id = $3)
        ORDER BY created_at DESC
        LIMIT $4
        "#,
    )
    .bind(event_type)
    .bind(reason)
    .bind(user_id)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                event_type,
                user_id,
                request_id,
                client_ip,
                user_agent,
                reason,
                payload,
                created_at,
            )| AuthAuditEventRow {
                id,
                event_type,
                user_id,
                request_id,
                client_ip,
                user_agent,
                reason,
                payload,
                created_at,
            },
        )
        .collect())
}

pub async fn list_auth_audit_events_with_reason_filter(
    pool: &PgPool,
    event_type: Option<&str>,
    reason: Option<&str>,
    user_id: Option<Uuid>,
    client_ip: Option<&str>,
    created_at_from: Option<DateTime<Utc>>,
    created_at_to: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<AuthAuditEventRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<Uuid>,
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
            Value,
            DateTime<Utc>,
        ),
    >(
        r#"
        SELECT id, event_type, user_id, request_id, client_ip, user_agent, reason, payload, created_at
        FROM auth_audit_events
        WHERE ($1::text IS NULL OR event_type = $1)
          AND ($2::text IS NULL OR reason = $2)
          AND ($3::uuid IS NULL OR user_id = $3)
          AND ($4::text IS NULL OR client_ip = $4)
          AND ($5::timestamptz IS NULL OR created_at >= $5)
          AND ($6::timestamptz IS NULL OR created_at <= $6)
        ORDER BY created_at DESC
        LIMIT $7
        "#,
    )
    .bind(event_type)
    .bind(reason)
    .bind(user_id)
    .bind(client_ip)
    .bind(created_at_from)
    .bind(created_at_to)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                event_type,
                user_id,
                request_id,
                client_ip,
                user_agent,
                reason,
                payload,
                created_at,
            )| AuthAuditEventRow {
                id,
                event_type,
                user_id,
                request_id,
                client_ip,
                user_agent,
                reason,
                payload,
                created_at,
            },
        )
        .collect())
}

pub async fn count_auth_audit_events_before(
    pool: &PgPool,
    cutoff: DateTime<Utc>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)::bigint
        FROM auth_audit_events
        WHERE created_at < $1
        "#,
    )
    .bind(cutoff)
    .fetch_one(pool)
    .await
}

pub async fn delete_auth_audit_events_before(
    pool: &PgPool,
    cutoff: DateTime<Utc>,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        DELETE FROM auth_audit_events
        WHERE created_at < $1
        "#,
    )
    .bind(cutoff)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
