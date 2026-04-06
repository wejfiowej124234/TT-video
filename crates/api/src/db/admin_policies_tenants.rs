//! 数据策略与租户/区域作用域台账（04 §3.5、70）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct AdminDataPolicyRow {
    pub id: Uuid,
    pub policy_code: String,
    pub scope_type: String,
    pub scope_expr: Option<String>,
    pub binding_role: String,
    pub binding_resources: Option<String>,
    pub status: String,
    pub version: i32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct AdminTenantScopeRow {
    pub id: Uuid,
    pub tenant_key: String,
    pub region_code: String,
    pub scope_class: String,
    pub status: String,
    pub notes: Option<String>,
    pub version: i32,
    pub updated_at: DateTime<Utc>,
}

/// `policy_code_pattern` / `scope_type_pattern` / `binding_role_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`**。
pub async fn list_admin_data_policies(
    pool: &PgPool,
    policy_code_pattern: Option<&str>,
    status_eq: Option<&str>,
    scope_type_pattern: Option<&str>,
    binding_role_pattern: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminDataPolicyRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminDataPolicyRow>(
        r#"
        SELECT
            id,
            policy_code,
            scope_type,
            scope_expr,
            binding_role,
            binding_resources,
            status,
            version,
            updated_at
        FROM admin_data_policies
        WHERE ($1::text IS NULL OR policy_code ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR scope_type ILIKE $3 ESCAPE '\')
          AND ($4::text IS NULL OR binding_role ILIKE $4 ESCAPE '\')
        ORDER BY policy_code ASC
        LIMIT $5
        "#,
    )
    .bind(policy_code_pattern)
    .bind(status_eq)
    .bind(scope_type_pattern)
    .bind(binding_role_pattern)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_data_policy_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminDataPolicyRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminDataPolicyRow>(
        r#"
        SELECT
            id,
            policy_code,
            scope_type,
            scope_expr,
            binding_role,
            binding_resources,
            status,
            version,
            updated_at
        FROM admin_data_policies
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// 乐观锁：`expected_version` 须与当前 `version` 一致；成功则 `version += 1`。
pub async fn publish_admin_data_policy(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    new_status: &str,
) -> Result<Option<AdminDataPolicyRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminDataPolicyRow>(
        r#"
        UPDATE admin_data_policies SET
            status = $1,
            version = version + 1,
            updated_at = now()
        WHERE id = $2 AND version = $3
        RETURNING
            id,
            policy_code,
            scope_type,
            scope_expr,
            binding_role,
            binding_resources,
            status,
            version,
            updated_at
        "#,
    )
    .bind(new_status)
    .bind(id)
    .bind(expected_version)
    .fetch_optional(pool)
    .await
}

/// `tenant_key_pattern` / `region_code_pattern`：已包 `%` 且子串已转义的 **ILIKE** 模式，或 **`None`** 不按该列筛选。
pub async fn list_admin_tenant_scopes(
    pool: &PgPool,
    tenant_key_pattern: Option<&str>,
    region_code_pattern: Option<&str>,
    status_eq: Option<&str>,
    scope_class_eq: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminTenantScopeRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminTenantScopeRow>(
        r#"
        SELECT
            id,
            tenant_key,
            region_code,
            scope_class,
            status,
            notes,
            version,
            updated_at
        FROM admin_tenant_scopes
        WHERE ($1::text IS NULL OR tenant_key ILIKE $1 ESCAPE '\')
          AND ($2::text IS NULL OR region_code ILIKE $2 ESCAPE '\')
          AND ($3::text IS NULL OR status = $3)
          AND ($4::text IS NULL OR scope_class = $4)
        ORDER BY tenant_key ASC, region_code ASC, scope_class ASC
        LIMIT $5
        "#,
    )
    .bind(tenant_key_pattern)
    .bind(region_code_pattern)
    .bind(status_eq)
    .bind(scope_class_eq)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_admin_tenant_scope_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<AdminTenantScopeRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminTenantScopeRow>(
        r#"
        SELECT
            id,
            tenant_key,
            region_code,
            scope_class,
            status,
            notes,
            version,
            updated_at
        FROM admin_tenant_scopes
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// 乐观锁：`expected_version` 须与当前 `version` 一致；成功则 `version += 1`。
pub async fn publish_admin_tenant_scope(
    pool: &PgPool,
    id: Uuid,
    expected_version: i32,
    new_status: &str,
) -> Result<Option<AdminTenantScopeRow>, sqlx::Error> {
    sqlx::query_as::<_, AdminTenantScopeRow>(
        r#"
        UPDATE admin_tenant_scopes SET
            status = $1,
            version = version + 1,
            updated_at = now()
        WHERE id = $2 AND version = $3
        RETURNING
            id,
            tenant_key,
            region_code,
            scope_class,
            status,
            notes,
            version,
            updated_at
        "#,
    )
    .bind(new_status)
    .bind(id)
    .bind(expected_version)
    .fetch_optional(pool)
    .await
}
