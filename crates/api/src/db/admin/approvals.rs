//! 用户角色变更审批（创建 / 列表 / 批准 + 审计事务）

use chrono::{DateTime, Duration, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::types::{
    AdminApprovalRequestRow, AdminConsoleRoleChangeApprovalResult, AdminRoleChangeApprovalResult,
};

/// 创建“用户角色变更”审批请求，并在同一事务写入审计日志（强制）。
pub async fn create_admin_user_role_change_request_with_audit(
    pool: &PgPool,
    requested_by: Uuid,
    target_user_id: Uuid,
    before_role: &str,
    target_role: &str,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let approval_flow_id = Uuid::new_v4();
    let expires_at = Utc::now() + Duration::hours(24);

    let before_payload = serde_json::json!({
        "role": before_role,
    });
    let after_payload = serde_json::json!({
        "role": target_role,
        "approval_flow_id": approval_flow_id,
        "step_total": 1,
        "current_step": 1,
        "expires_at": expires_at,
    });

    let approval_id: Uuid =
        sqlx::query_scalar(
            "INSERT INTO admin_approval_requests (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
             VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
             RETURNING id",
        )
        .bind("admin.user.role.change")
        .bind("users")
        .bind(target_user_id.to_string())
        .bind(requested_by)
        .bind(reason)
        .bind(&before_payload)
        .bind(&after_payload)
        .bind(Utc::now())
        .fetch_one(&mut *tx)
        .await?;

    sqlx::query(
        "INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind("admin.user.role.change.requested")
    .bind(Some("users"))
    .bind(Some(target_user_id.to_string()))
    .bind(requested_by)
    .bind(request_id)
    .bind(serde_json::json!({
        "approval_id": approval_id,
        "approval_flow_id": approval_flow_id,
        "from_role": before_role,
        "to_role": target_role,
        "step_total": 1,
        "current_step": 1,
        "expires_at": expires_at,
        "reason": reason,
    }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(approval_id)
}

pub async fn list_admin_approval_requests(
    pool: &PgPool,
    status: Option<&str>,
    limit: i64,
) -> Result<Vec<AdminApprovalRequestRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (
        Uuid,
        String,
        String,
        String,
        Uuid,
        Option<Uuid>,
        String,
        Option<String>,
        Option<String>,
        Value,
        Value,
        DateTime<Utc>,
        Option<DateTime<Utc>>,
    )>(
        "SELECT id, action, resource_type, resource_id, requested_by, approved_by, status, reason, approve_reason, before_payload, after_payload, created_at, approved_at
         FROM admin_approval_requests
         WHERE ($1::text IS NULL OR status = $1)
         ORDER BY created_at DESC
         LIMIT $2",
    )
    .bind(status)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                action,
                resource_type,
                resource_id,
                requested_by,
                approved_by,
                status,
                reason,
                approve_reason,
                before_payload,
                after_payload,
                created_at,
                approved_at,
            )| AdminApprovalRequestRow {
                id,
                action,
                resource_type,
                resource_id,
                requested_by,
                approved_by,
                status,
                reason,
                approve_reason,
                before_payload,
                after_payload,
                created_at,
                approved_at,
            },
        )
        .collect())
}

pub async fn get_admin_approval_request_by_id(
    pool: &PgPool,
    approval_id: Uuid,
) -> Result<Option<AdminApprovalRequestRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, (
        Uuid,
        String,
        String,
        String,
        Uuid,
        Option<Uuid>,
        String,
        Option<String>,
        Option<String>,
        Value,
        Value,
        DateTime<Utc>,
        Option<DateTime<Utc>>,
    )>(
        "SELECT id, action, resource_type, resource_id, requested_by, approved_by, status, reason, approve_reason, before_payload, after_payload, created_at, approved_at
         FROM admin_approval_requests
         WHERE id = $1",
    )
    .bind(approval_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(
        |(
            id,
            action,
            resource_type,
            resource_id,
            requested_by,
            approved_by,
            status,
            reason,
            approve_reason,
            before_payload,
            after_payload,
            created_at,
            approved_at,
        )| AdminApprovalRequestRow {
            id,
            action,
            resource_type,
            resource_id,
            requested_by,
            approved_by,
            status,
            reason,
            approve_reason,
            before_payload,
            after_payload,
            created_at,
            approved_at,
        },
    ))
}

/// 批准“用户角色变更”审批请求，并在同一事务内完成：更新 users.role + 更新审批单 + 写入审计日志。
pub async fn approve_admin_user_role_change_request_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approved_by: Uuid,
    approve_reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<AdminRoleChangeApprovalResult>, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let row = sqlx::query_as::<_, (String, String, Value, Value, Uuid)>(
        "SELECT resource_id, status, before_payload, after_payload, requested_by
         FROM admin_approval_requests
         WHERE id = $1 AND action = 'admin.user.role.change'
         FOR UPDATE",
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;

    let Some((resource_id, status, before_payload, after_payload, requested_by)) = row else {
        tx.rollback().await?;
        return Ok(None);
    };

    if status != "pending" || requested_by == approved_by {
        tx.rollback().await?;
        return Ok(None);
    }

    let target_user_id = match Uuid::parse_str(&resource_id) {
        Ok(v) => v,
        Err(_) => {
            tx.rollback().await?;
            return Ok(None);
        }
    };

    let to_role = after_payload
        .get("role")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    if to_role.is_empty() {
        tx.rollback().await?;
        return Ok(None);
    }
    let from_role = before_payload
        .get("role")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let step_total = after_payload
        .get("step_total")
        .and_then(|v| v.as_i64())
        .unwrap_or(1);
    let current_step = after_payload
        .get("current_step")
        .and_then(|v| v.as_i64())
        .unwrap_or(1);
    if step_total < 1 || current_step != step_total {
        tx.rollback().await?;
        return Ok(None);
    }

    if let Some(expires_at_s) = after_payload.get("expires_at").and_then(|v| v.as_str()) {
        if let Ok(expires_at) = DateTime::parse_from_rfc3339(expires_at_s) {
            if Utc::now() > expires_at.with_timezone(&Utc) {
                tx.rollback().await?;
                return Ok(None);
            }
        }
    }

    let affected = sqlx::query("UPDATE users SET role = $1, updated_at = now() WHERE id = $2")
        .bind(&to_role)
        .bind(target_user_id)
        .execute(&mut *tx)
        .await?
        .rows_affected();
    if affected == 0 {
        tx.rollback().await?;
        return Ok(None);
    }

    let updated = sqlx::query(
        "UPDATE admin_approval_requests
         SET status = 'approved', approved_by = $1, approve_reason = $2, approved_at = $3
         WHERE id = $4 AND status = 'pending'",
    )
    .bind(approved_by)
    .bind(approve_reason)
    .bind(Utc::now())
    .bind(approval_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();
    if updated == 0 {
        tx.rollback().await?;
        return Ok(None);
    }

    sqlx::query(
        "INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind("admin.user.role.change.approved")
    .bind(Some("users"))
    .bind(Some(resource_id))
    .bind(approved_by)
    .bind(request_id)
    .bind(serde_json::json!({
        "approval_id": approval_id,
        "approval_flow_id": after_payload.get("approval_flow_id").cloned(),
        "from_role": from_role,
        "to_role": to_role,
        "step_total": step_total,
        "current_step": current_step,
        "expires_at": after_payload.get("expires_at").cloned(),
        "approve_reason": approve_reason,
    }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(AdminRoleChangeApprovalResult {
        approval_id,
        target_user_id,
        from_role,
        to_role,
    }))
}

/// 创建「70 控制台角色变更」审批请求，并在同一事务写入审计日志。
pub async fn create_admin_console_role_change_request_with_audit(
    pool: &PgPool,
    requested_by: Uuid,
    target_user_id: Uuid,
    before_console_role: Option<&str>,
    target_console_role: &str,
    reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let approval_flow_id = Uuid::new_v4();
    let expires_at = Utc::now() + Duration::hours(24);

    let before_payload = serde_json::json!({
        "console_role_70": before_console_role,
    });
    let after_payload = serde_json::json!({
        "console_role_70": target_console_role,
        "approval_flow_id": approval_flow_id,
        "step_total": 1,
        "current_step": 1,
        "expires_at": expires_at,
    });

    let approval_id: Uuid = sqlx::query_scalar(
        "INSERT INTO admin_approval_requests (action, resource_type, resource_id, requested_by, status, reason, before_payload, after_payload, created_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
         RETURNING id",
    )
    .bind("admin.console_role.change")
    .bind("admin_console_roles")
    .bind(target_user_id.to_string())
    .bind(requested_by)
    .bind(reason)
    .bind(&before_payload)
    .bind(&after_payload)
    .bind(Utc::now())
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query(
        "INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind("admin.console_role.change.requested")
    .bind(Some("admin_console_roles"))
    .bind(Some(target_user_id.to_string()))
    .bind(requested_by)
    .bind(request_id)
    .bind(serde_json::json!({
        "approval_id": approval_id,
        "approval_flow_id": approval_flow_id,
        "from_console_role_70": before_console_role,
        "to_console_role_70": target_console_role,
        "step_total": 1,
        "current_step": 1,
        "expires_at": expires_at,
        "reason": reason,
    }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(approval_id)
}

/// 批准「70 控制台角色变更」：落库 `admin_console_roles` + 审批单 + 审计（同事务）。
pub async fn approve_admin_console_role_change_request_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    approved_by: Uuid,
    approve_reason: Option<&str>,
    request_id: Option<&str>,
) -> Result<Option<AdminConsoleRoleChangeApprovalResult>, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let row = sqlx::query_as::<_, (String, String, Value, Value, Uuid)>(
        "SELECT resource_id, status, before_payload, after_payload, requested_by
         FROM admin_approval_requests
         WHERE id = $1 AND action = 'admin.console_role.change'
         FOR UPDATE",
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;

    let Some((resource_id, status, before_payload, after_payload, requested_by)) = row else {
        tx.rollback().await?;
        return Ok(None);
    };

    if status != "pending" || requested_by == approved_by {
        tx.rollback().await?;
        return Ok(None);
    }

    let target_user_id = match Uuid::parse_str(&resource_id) {
        Ok(v) => v,
        Err(_) => {
            tx.rollback().await?;
            return Ok(None);
        }
    };

    let to_role = after_payload
        .get("console_role_70")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    if to_role.is_empty() {
        tx.rollback().await?;
        return Ok(None);
    }
    let from_role = before_payload
        .get("console_role_70")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let step_total = after_payload
        .get("step_total")
        .and_then(|v| v.as_i64())
        .unwrap_or(1);
    let current_step = after_payload
        .get("current_step")
        .and_then(|v| v.as_i64())
        .unwrap_or(1);
    if step_total < 1 || current_step != step_total {
        tx.rollback().await?;
        return Ok(None);
    }

    if let Some(expires_at_s) = after_payload.get("expires_at").and_then(|v| v.as_str()) {
        if let Ok(expires_at) = DateTime::parse_from_rfc3339(expires_at_s) {
            if Utc::now() > expires_at.with_timezone(&Utc) {
                tx.rollback().await?;
                return Ok(None);
            }
        }
    }

    sqlx::query(
        "INSERT INTO admin_console_roles (user_id, console_role, assigned_by, assignment_reason, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           console_role = EXCLUDED.console_role,
           assigned_by = EXCLUDED.assigned_by,
           assignment_reason = EXCLUDED.assignment_reason,
           updated_at = EXCLUDED.updated_at",
    )
    .bind(target_user_id)
    .bind(&to_role)
    .bind(approved_by)
    .bind(approve_reason)
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    let updated = sqlx::query(
        "UPDATE admin_approval_requests
         SET status = 'approved', approved_by = $1, approve_reason = $2, approved_at = $3
         WHERE id = $4 AND status = 'pending'",
    )
    .bind(approved_by)
    .bind(approve_reason)
    .bind(Utc::now())
    .bind(approval_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();
    if updated == 0 {
        tx.rollback().await?;
        return Ok(None);
    }

    sqlx::query(
        "INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind("admin.console_role.change.approved")
    .bind(Some("admin_console_roles"))
    .bind(Some(resource_id))
    .bind(approved_by)
    .bind(request_id)
    .bind(serde_json::json!({
        "approval_id": approval_id,
        "approval_flow_id": after_payload.get("approval_flow_id").cloned(),
        "from_console_role_70": from_role,
        "to_console_role_70": to_role,
        "step_total": step_total,
        "current_step": current_step,
        "expires_at": after_payload.get("expires_at").cloned(),
        "approve_reason": approve_reason,
    }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Some(AdminConsoleRoleChangeApprovalResult {
        approval_id,
        target_user_id,
        from_console_role: from_role,
        to_console_role: to_role,
    }))
}

fn audit_action_for_approval_reject(action: &str) -> Option<&'static str> {
    match action {
        "admin.user.role.change" => Some("admin.user.role.change.rejected"),
        "admin.console_role.change" => Some("admin.console_role.change.rejected"),
        _ => None,
    }
}

/// 驳回审批单：仅更新 `admin_approval_requests` 状态并写审计（不应用角色变更）。
pub async fn reject_admin_approval_request_with_audit(
    pool: &PgPool,
    approval_id: Uuid,
    rejected_by: Uuid,
    reject_reason: &str,
    request_id: Option<&str>,
) -> Result<bool, sqlx::Error> {
    let mut tx = pool.begin().await?;

    let row = sqlx::query_as::<_, (String, String, String, String, Uuid, Value, Value)>(
        "SELECT action, resource_type, resource_id, status, requested_by, before_payload, after_payload
         FROM admin_approval_requests
         WHERE id = $1
         FOR UPDATE",
    )
    .bind(approval_id)
    .fetch_optional(&mut *tx)
    .await?;

    let Some((action, resource_type, resource_id, status, requested_by, before_payload, after_payload)) =
        row
    else {
        tx.rollback().await?;
        return Ok(false);
    };

    if status != "pending" || requested_by == rejected_by {
        tx.rollback().await?;
        return Ok(false);
    }

    let audit_action = match audit_action_for_approval_reject(action.as_str()) {
        Some(v) => v,
        None => {
            tx.rollback().await?;
            return Ok(false);
        }
    };

    let updated = sqlx::query(
        "UPDATE admin_approval_requests
         SET status = 'rejected', approved_by = $1, approve_reason = $2, approved_at = $3
         WHERE id = $4 AND status = 'pending'",
    )
    .bind(rejected_by)
    .bind(reject_reason)
    .bind(Utc::now())
    .bind(approval_id)
    .execute(&mut *tx)
    .await?
    .rows_affected();
    if updated == 0 {
        tx.rollback().await?;
        return Ok(false);
    }

    sqlx::query(
        "INSERT INTO admin_audit_logs (action, resource_type, resource_id, actor_id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(audit_action)
    .bind(Some(resource_type.as_str()))
    .bind(Some(resource_id.as_str()))
    .bind(rejected_by)
    .bind(request_id)
    .bind(serde_json::json!({
        "approval_id": approval_id,
        "approval_flow_id": after_payload.get("approval_flow_id").cloned(),
        "reject_reason": reject_reason,
        "before_payload": before_payload,
        "after_payload": after_payload,
    }))
    .bind(Utc::now())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(true)
}
