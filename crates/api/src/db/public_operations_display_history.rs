//! Public Operations · display field change history (SSOT-PUB-OPS O7).

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::PublicOpsDisplayRow;

pub const PUBLIC_OPS_HISTORY_ACTIONS: &[&str] = &[
    "publish",
    "unpublish",
    "featured",
    "priority",
    "surfaces",
    "schedule",
    "test_policy",
];

#[derive(Debug, Clone)]
pub struct PublicOpsHistoryInsert {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub actor_id: Option<Uuid>,
    pub display_source: Option<String>,
    pub before_state: Option<Value>,
    pub after_state: Value,
}

#[derive(Debug, Clone, serde::Serialize, sqlx::FromRow)]
pub struct PublicOpsHistoryRow {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub actor_id: Option<Uuid>,
    pub display_source: Option<String>,
    pub before_state: Option<Value>,
    pub after_state: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Default)]
pub struct PublicOpsHistoryFilters {
    pub entity_type: Option<String>,
    pub entity_id: Option<Uuid>,
    pub action: Option<String>,
}

pub fn public_ops_display_snapshot(row: &PublicOpsDisplayRow) -> Value {
    serde_json::to_value(row).unwrap_or_else(|_| serde_json::json!({}))
}

pub async fn insert_public_ops_display_history(
    pool: &PgPool,
    input: PublicOpsHistoryInsert,
) -> Result<PublicOpsHistoryRow, sqlx::Error> {
    sqlx::query_as::<_, PublicOpsHistoryRow>(
        r#"INSERT INTO ops_public_operations_display_history
           (entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at"#,
    )
    .bind(&input.entity_type)
    .bind(input.entity_id)
    .bind(&input.action)
    .bind(input.actor_id)
    .bind(&input.display_source)
    .bind(input.before_state)
    .bind(input.after_state)
    .fetch_one(pool)
    .await
}

pub async fn list_public_ops_display_history(
    pool: &PgPool,
    filters: PublicOpsHistoryFilters,
    limit: i64,
) -> Result<Vec<PublicOpsHistoryRow>, sqlx::Error> {
    let lim = limit.clamp(1, 200);
    match (
        filters.entity_type.as_deref(),
        filters.entity_id,
        filters.action.as_deref(),
    ) {
        (Some(et), Some(eid), Some(action)) => {
            sqlx::query_as::<_, PublicOpsHistoryRow>(
                r#"SELECT id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at
                   FROM ops_public_operations_display_history
                   WHERE entity_type = $1 AND entity_id = $2 AND action = $3
                   ORDER BY created_at DESC LIMIT $4"#,
            )
            .bind(et)
            .bind(eid)
            .bind(action)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (Some(et), Some(eid), None) => {
            sqlx::query_as::<_, PublicOpsHistoryRow>(
                r#"SELECT id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at
                   FROM ops_public_operations_display_history
                   WHERE entity_type = $1 AND entity_id = $2
                   ORDER BY created_at DESC LIMIT $3"#,
            )
            .bind(et)
            .bind(eid)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (Some(et), None, Some(action)) => {
            sqlx::query_as::<_, PublicOpsHistoryRow>(
                r#"SELECT id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at
                   FROM ops_public_operations_display_history
                   WHERE entity_type = $1 AND action = $2
                   ORDER BY created_at DESC LIMIT $3"#,
            )
            .bind(et)
            .bind(action)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (Some(et), None, None) => {
            sqlx::query_as::<_, PublicOpsHistoryRow>(
                r#"SELECT id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at
                   FROM ops_public_operations_display_history
                   WHERE entity_type = $1
                   ORDER BY created_at DESC LIMIT $2"#,
            )
            .bind(et)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (None, _, Some(action)) => {
            sqlx::query_as::<_, PublicOpsHistoryRow>(
                r#"SELECT id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at
                   FROM ops_public_operations_display_history
                   WHERE action = $1
                   ORDER BY created_at DESC LIMIT $2"#,
            )
            .bind(action)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (None, _, None) => {
            sqlx::query_as::<_, PublicOpsHistoryRow>(
                r#"SELECT id, entity_type, entity_id, action, actor_id, display_source, before_state, after_state, created_at
                   FROM ops_public_operations_display_history
                   ORDER BY created_at DESC LIMIT $1"#,
            )
            .bind(lim)
            .fetch_all(pool)
            .await
        }
    }
}
