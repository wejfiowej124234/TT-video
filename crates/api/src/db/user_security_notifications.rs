use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

pub async fn insert_user_security_notification(
    pool: &PgPool,
    user_id: Uuid,
    event_type: &str,
    template_key: &str,
    payload: &Value,
) -> Result<(), sqlx::Error> {
    insert_user_security_notification_with_status(
        pool,
        user_id,
        event_type,
        template_key,
        payload,
        "pending",
    )
    .await
}

pub async fn insert_user_security_notification_with_status(
    pool: &PgPool,
    user_id: Uuid,
    event_type: &str,
    template_key: &str,
    payload: &Value,
    delivery_status: &str,
) -> Result<(), sqlx::Error> {
    let sent_at = if delivery_status == "sent" {
        Some(Utc::now())
    } else {
        None
    };
    sqlx::query(
        r#"
        INSERT INTO user_security_notifications (user_id, event_type, template_key, payload, delivery_status, attempts, last_error, sent_at, created_at)
        VALUES ($1, $2, $3, $4, $5, 0, NULL, $6, $7)
        "#,
    )
    .bind(user_id)
    .bind(event_type)
    .bind(template_key)
    .bind(payload)
    .bind(delivery_status)
    .bind(sent_at)
    .bind(Utc::now())
    .execute(pool)
    .await?;
    Ok(())
}

#[derive(Debug, Clone)]
pub struct UserSecurityNotificationRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub event_type: String,
    pub template_key: String,
    pub payload: Value,
    pub delivery_status: String,
    pub attempts: i32,
    pub last_error: Option<String>,
    pub sent_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_user_security_notifications(
    pool: &PgPool,
    user_id: Uuid,
    delivery_status: Option<&str>,
    event_type: Option<&str>,
    limit: i64,
) -> Result<Vec<UserSecurityNotificationRow>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            Uuid,
            String,
            String,
            Value,
            String,
            i32,
            Option<String>,
            Option<DateTime<Utc>>,
            DateTime<Utc>,
        ),
    >(
        r#"
        SELECT id, user_id, event_type, template_key, payload, delivery_status, attempts, last_error, sent_at, created_at
        FROM user_security_notifications
        WHERE user_id = $1
          AND ($2::text IS NULL OR delivery_status = $2)
          AND ($3::text IS NULL OR event_type = $3)
        ORDER BY created_at DESC
        LIMIT $4
        "#,
    )
    .bind(user_id)
    .bind(delivery_status)
    .bind(event_type)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                user_id,
                event_type,
                template_key,
                payload,
                delivery_status,
                attempts,
                last_error,
                sent_at,
                created_at,
            )| {
                UserSecurityNotificationRow {
                    id,
                    user_id,
                    event_type,
                    template_key,
                    payload,
                    delivery_status,
                    attempts,
                    last_error,
                    sent_at,
                    created_at,
                }
            },
        )
        .collect())
}
