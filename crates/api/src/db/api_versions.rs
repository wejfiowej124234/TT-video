//! API 版本登记（340、04 §3.5）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ApiVersionRow {
    pub api_version: String,
    pub status: String,
    pub released_at: Option<DateTime<Utc>>,
    pub deprecated_at: Option<DateTime<Utc>>,
    pub sunset_at: Option<DateTime<Utc>>,
    pub compat_window_days: i32,
    pub active_client_ratio_7d: Option<f64>,
    pub request_count_7d: i64,
    pub last_change_at: DateTime<Utc>,
    pub last_change_by: Option<String>,
}

/// `api_version_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**；`status_eq`：精确匹配 **`status`**，或 **`None`**。
pub async fn list_api_versions(
    pool: &PgPool,
    api_version_pattern: Option<&str>,
    status_eq: Option<&str>,
    limit: i64,
) -> Result<Vec<ApiVersionRow>, sqlx::Error> {
    sqlx::query_as::<_, ApiVersionRow>(
        r#"
        SELECT
            api_version,
            status,
            released_at,
            deprecated_at,
            sunset_at,
            compat_window_days,
            active_client_ratio_7d,
            request_count_7d,
            last_change_at,
            last_change_by
        FROM api_versions
        WHERE ($1::text IS NULL OR api_version ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR status = $2)
        ORDER BY api_version ASC
        LIMIT $3
        "#,
    )
    .bind(api_version_pattern)
    .bind(status_eq)
    .bind(limit)
    .fetch_all(pool)
    .await
}
