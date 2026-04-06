//! Admin 审计 / 审批 / 可观测清单行类型

use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug)]
pub struct AdminAuditLogRow {
    pub id: Uuid,
    pub action: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub actor_id: Uuid,
    pub request_id: Option<String>,
    pub payload: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct AdminApprovalRequestRow {
    pub id: Uuid,
    pub action: String,
    pub resource_type: String,
    pub resource_id: String,
    pub requested_by: Uuid,
    pub approved_by: Option<Uuid>,
    pub status: String,
    pub reason: Option<String>,
    pub approve_reason: Option<String>,
    pub before_payload: Value,
    pub after_payload: Value,
    pub created_at: DateTime<Utc>,
    pub approved_at: Option<DateTime<Utc>>,
}

#[derive(Debug)]
pub struct AdminRoleChangeApprovalResult {
    pub approval_id: Uuid,
    pub target_user_id: Uuid,
    pub from_role: Option<String>,
    pub to_role: String,
}

#[derive(Debug)]
pub struct SchemaVersionRow {
    pub version_no: String,
    pub status: String,
    pub released_at: Option<DateTime<Utc>>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct MigrationHistoryRow {
    pub migration_id: String,
    pub from_version: Option<String>,
    pub to_version: Option<String>,
    pub result: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct MigrationRollbackRow {
    pub rollback_id: String,
    pub target_version: String,
    pub trigger_reason: Option<String>,
    pub result: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct BackfillJobRow {
    pub job_id: String,
    pub scope: String,
    pub progress: f64,
    pub error_count: i64,
    pub status: String,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct DualWriteCheckRow {
    pub check_id: String,
    pub old_digest: Option<String>,
    pub new_digest: Option<String>,
    pub diff_count: i64,
    pub status: String,
    pub checked_at: Option<DateTime<Utc>>,
}
