//! Admin · Platform backup observability (B-475 baseline read-only)

use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde_json::{json, Value};
use std::path::PathBuf;

use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_PLATFORM_READ};
use super::write_admin_audit_log_best_effort;

fn baseline_record_path() -> PathBuf {
    if let Ok(p) = std::env::var("TRAVELTRUST_B475_BASELINE_PATH") {
        let t = p.trim();
        if !t.is_empty() {
            return PathBuf::from(t);
        }
    }
    if let Ok(root) = std::env::var("TRAVELTRUST_REPO_ROOT") {
        return PathBuf::from(root.trim())
            .join("evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json");
    }
    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json")
}

fn default_baseline_record() -> Value {
    json!({
        "schema": "traveltrust_pg_backup_pitr_baseline.v1",
        "status": "PLANNED",
        "implementation_note": "baseline_record_missing_use_ops_runbook"
    })
}

fn read_baseline_record() -> (Value, bool) {
    let path = baseline_record_path();
    match std::fs::read_to_string(&path) {
        Ok(raw) => match serde_json::from_str::<Value>(&raw) {
            Ok(v) => (v, true),
            Err(_) => (default_baseline_record(), false),
        },
        Err(_) => (default_baseline_record(), false),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/admin/platform/backup-status",
        get(get_admin_platform_backup_status),
    )
}

pub async fn get_admin_platform_backup_status(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_PLATFORM_READ).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let (record, file_found) = read_baseline_record();
    let path = baseline_record_path();
    let status = record
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("PLANNED");
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
        "admin.platform.backup_status.read",
        Some("b475_pg_backup_pitr_baseline"),
        None,
        json!({ "status": status, "file_found": file_found }),
    )
    .await;
    Json(json!({
        "status": "ok",
        "baseline": record,
        "baseline_file_found": file_found,
        "baseline_path_hint": path.to_string_lossy(),
        "runbooks": [
            { "id": "TT-B475", "path": "docs/runbook/TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md" },
            { "id": "PI3-001", "path": "docs/handbook/engineering/122-PI3-001-Production-Database-Backup-Readiness-Report.md" },
            { "id": "RPO-RTO", "path": "docs/runbook/PRODUCTION-DB-BACKUP-RPO-RTO-MATRIX-SEPOLIA-SCOPE.md" },
        ],
        "note": "read-only ops observability; backup enable/restore remain CLI/scripts",
    }))
    .into_response()
}
