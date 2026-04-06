//! Feature flags + secret key metadata（220、230、240、04 §3.5、14）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct FeatureFlagRow {
    pub id: Uuid,
    pub flag_code: String,
    pub description: Option<String>,
    pub scope: String,
    pub enabled: bool,
    pub rollout_percent: i32,
    pub region: Option<String>,
    pub version: i64,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct SecretMetadataRow {
    pub id: Uuid,
    pub key_alias: String,
    pub env_scope: String,
    pub last_rotated_at: Option<DateTime<Utc>>,
    pub next_rotation_due: Option<DateTime<Utc>>,
    pub status: String,
    pub notes: Option<String>,
    pub updated_at: DateTime<Utc>,
}

/// `flag_code_pattern`：已含 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`** 不按 code 筛选。
pub async fn list_feature_flags(
    pool: &PgPool,
    flag_code_pattern: Option<&str>,
    enabled: Option<bool>,
    scope: Option<&str>,
    limit: i64,
) -> Result<Vec<FeatureFlagRow>, sqlx::Error> {
    sqlx::query_as::<_, FeatureFlagRow>(
        r#"
        SELECT id, flag_code, description, scope, enabled, rollout_percent, region, version, updated_at
        FROM feature_flags
        WHERE ($1::text IS NULL OR flag_code ILIKE $1 ESCAPE '\')
          AND ($2::bool IS NULL OR enabled = $2)
          AND ($3::text IS NULL OR scope = $3)
        ORDER BY flag_code ASC
        LIMIT $4
        "#,
    )
    .bind(flag_code_pattern)
    .bind(enabled)
    .bind(scope)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// 供 `ILIKE … ESCAPE '\'` 使用：转义 `\`、`%`、`_`。
pub fn escape_sql_like_pattern(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 4);
    for ch in s.chars() {
        match ch {
            '\\' => {
                out.push('\\');
                out.push('\\');
            }
            '%' => {
                out.push('\\');
                out.push('%');
            }
            '_' => {
                out.push('\\');
                out.push('_');
            }
            c => out.push(c),
        }
    }
    out
}

/// 只读列表；`key_alias_pattern` 为已包 `%` 且已转义子串的 **ILIKE** 模式，或 **`None`** 表示不按别名筛选。
pub async fn list_secret_key_metadata(
    pool: &PgPool,
    key_alias_pattern: Option<&str>,
    status: Option<&str>,
    env_scope: Option<&str>,
    limit: i64,
) -> Result<Vec<SecretMetadataRow>, sqlx::Error> {
    sqlx::query_as::<_, SecretMetadataRow>(
        r#"
        SELECT id, key_alias, env_scope, last_rotated_at, next_rotation_due, status, notes, updated_at
        FROM secret_key_metadata
        WHERE ($1::text IS NULL OR key_alias ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR env_scope = $3)
        ORDER BY key_alias ASC
        LIMIT $4
        "#,
    )
    .bind(key_alias_pattern)
    .bind(status)
    .bind(env_scope)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_feature_flag_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<FeatureFlagRow>, sqlx::Error> {
    sqlx::query_as::<_, FeatureFlagRow>(
        r#"
        SELECT id, flag_code, description, scope, enabled, rollout_percent, region, version, updated_at
        FROM feature_flags
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// 乐观锁发布：`expected_version` 须与当前 `version` 一致；成功则 `version += 1`。
pub async fn publish_feature_flag(
    pool: &PgPool,
    id: Uuid,
    expected_version: i64,
    enabled: bool,
    rollout_percent: i32,
    region: Option<String>,
) -> Result<Option<FeatureFlagRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, FeatureFlagRow>(
        r#"
        UPDATE feature_flags SET
            enabled = $1,
            rollout_percent = $2,
            region = $3,
            version = version + 1,
            updated_at = now()
        WHERE id = $4 AND version = $5
        RETURNING id, flag_code, description, scope, enabled, rollout_percent, region, version, updated_at
        "#,
    )
    .bind(enabled)
    .bind(rollout_percent)
    .bind(region)
    .bind(id)
    .bind(expected_version)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}
