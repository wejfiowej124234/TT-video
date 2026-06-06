//! Admin 70 控制台角色落库（`admin_console_roles` · `admin_security_policies`）。

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
pub struct AdminConsoleRoleRow {
    pub user_id: Uuid,
    pub console_role: String,
    pub assigned_by: Option<Uuid>,
    pub assignment_reason: Option<String>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_admin_console_role(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT console_role FROM admin_console_roles WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| r.0))
}

pub async fn upsert_admin_console_role(
    pool: &PgPool,
    user_id: Uuid,
    console_role: &str,
    assigned_by: Option<Uuid>,
    assignment_reason: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO admin_console_roles (user_id, console_role, assigned_by, assignment_reason, updated_at)
        VALUES ($1, $2, $3, $4, now())
        ON CONFLICT (user_id) DO UPDATE SET
            console_role = EXCLUDED.console_role,
            assigned_by = EXCLUDED.assigned_by,
            assignment_reason = EXCLUDED.assignment_reason,
            updated_at = now()
        "#,
    )
    .bind(user_id)
    .bind(console_role)
    .bind(assigned_by)
    .bind(assignment_reason)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_admin_console_role(pool: &PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM admin_console_roles WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn admin_console_roles_table_exists(pool: &PgPool) -> bool {
    sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'admin_console_roles'
        )
        "#,
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}

pub async fn get_admin_2fa_policy(pool: &PgPool) -> Result<Value, sqlx::Error> {
    let row: Option<(Value,)> = sqlx::query_as(
        "SELECT policy_value FROM admin_security_policies WHERE policy_key = 'admin_2fa_policy'",
    )
    .fetch_optional(pool)
    .await?;
    Ok(row
        .map(|r| r.0)
        .unwrap_or_else(|| {
            serde_json::json!({
                "enforced": false,
                "required_console_roles": ["SuperAdmin", "Ops"],
                "implementation_note": "default_when_table_missing"
            })
        }))
}

pub async fn patch_admin_2fa_policy_enforced(
    pool: &PgPool,
    enforced: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO admin_security_policies (policy_key, policy_value, updated_at)
        VALUES (
            'admin_2fa_policy',
            '{"enforced": false, "required_console_roles": ["SuperAdmin", "Ops"]}'::jsonb,
            now()
        )
        ON CONFLICT (policy_key) DO UPDATE SET
            policy_value = admin_security_policies.policy_value || jsonb_build_object('enforced', $1::boolean),
            updated_at = now()
        "#,
    )
    .bind(enforced)
    .execute(pool)
    .await?;
    Ok(())
}
