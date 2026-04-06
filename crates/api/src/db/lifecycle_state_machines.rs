//! 生命周期状态机登记快照（350、04 §3.5）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct LifecycleStateMachineRow {
    pub machine_code: String,
    pub domain: String,
    pub version: String,
    pub entity_type: String,
    pub current_state: String,
    pub expected_state: Option<String>,
    pub anomaly_flag: bool,
    pub anomaly_type: Option<String>,
    pub last_transition_at: Option<DateTime<Utc>>,
    pub source_of_truth: String,
    pub repairable: bool,
    pub updated_at: DateTime<Utc>,
}

/// 各 `*_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**；`anomaly_flag`：**`Some(true|false)`** 精确匹配，或 **`None`** 不限定。
pub async fn list_lifecycle_state_machines(
    pool: &PgPool,
    machine_code_pattern: Option<&str>,
    domain_pattern: Option<&str>,
    entity_type_pattern: Option<&str>,
    version_pattern: Option<&str>,
    source_of_truth_pattern: Option<&str>,
    anomaly_flag: Option<bool>,
    limit: i64,
) -> Result<Vec<LifecycleStateMachineRow>, sqlx::Error> {
    sqlx::query_as::<_, LifecycleStateMachineRow>(
        r#"
        SELECT
            machine_code,
            domain,
            version,
            entity_type,
            current_state,
            expected_state,
            anomaly_flag,
            anomaly_type,
            last_transition_at,
            source_of_truth,
            repairable,
            updated_at
        FROM lifecycle_state_machines
        WHERE ($1::text IS NULL OR machine_code ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR domain ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR entity_type ILIKE $3 ESCAPE '\')
          AND ($4::text IS NULL OR version ILIKE $4 ESCAPE '\')
          AND ($5::text IS NULL OR source_of_truth ILIKE $5 ESCAPE '\')
          AND ($6::bool IS NULL OR anomaly_flag = $6)
        ORDER BY domain ASC, machine_code ASC
        LIMIT $7
        "#,
    )
    .bind(machine_code_pattern)
    .bind(domain_pattern)
    .bind(entity_type_pattern)
    .bind(version_pattern)
    .bind(source_of_truth_pattern)
    .bind(anomaly_flag)
    .bind(limit)
    .fetch_all(pool)
    .await
}
