//! `guide_exit_requests` 表读写（① 本地 · 向导退出申请）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct GuideExitRequestRow {
    pub id: Uuid,
    pub guide_id: Uuid,
    pub user_id: Uuid,
    pub status: String,
    pub reason: Option<String>,
    pub requested_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn insert_guide_exit_request(
    pool: &PgPool,
    id: Uuid,
    guide_id: Uuid,
    user_id: Uuid,
    reason: Option<&str>,
    requested_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO guide_exit_requests (id, guide_id, user_id, status, reason, requested_at, updated_at)
        VALUES ($1, $2, $3, 'pending', $4, $5, $6)
        "#,
    )
    .bind(id)
    .bind(guide_id)
    .bind(user_id)
    .bind(reason)
    .bind(requested_at)
    .bind(updated_at)
    .execute(pool)
    .await?;
    Ok(())
}

/// 启动 hydrate：加载全部退出申请（按 guide_id 取最新一条写入内存）
pub async fn list_guide_exit_requests(pool: &PgPool) -> Result<Vec<GuideExitRequestRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, GuideExitRequestRow>(
        r#"
        SELECT id, guide_id, user_id, status, reason, requested_at, updated_at
        FROM guide_exit_requests
        ORDER BY requested_at ASC
        "#,
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn fetch_latest_guide_exit_request(
    pool: &PgPool,
    guide_id: Uuid,
) -> Result<Option<GuideExitRequestRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, GuideExitRequestRow>(
        r#"
        SELECT id, guide_id, user_id, status, reason, requested_at, updated_at
        FROM guide_exit_requests
        WHERE guide_id = $1
        ORDER BY requested_at DESC
        LIMIT 1
        "#,
    )
    .bind(guide_id)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}
