//! `PATCH …/compliance/data-requests/:id` (super-admin)

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers,
    require_super_admin_uid, write_admin_audit_log_best_effort,
    AdminComplianceDataRequestUpdateBody,
};

use super::helpers::is_allowed_compliance_request_status;

pub async fn post_admin_compliance_data_request_update(
    State(state): State<ApiMetaState>,
    Path(request_id): Path<String>,
    headers: HeaderMap,
    Json(req): Json<AdminComplianceDataRequestUpdateBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let rid = match Uuid::parse_str(request_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_compliance_request_id")),
            )
                .into_response()
        }
    };    let event_type = req.event_type.trim();
    if event_type.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_compliance_event_type")),
        )
            .into_response();
    };    let new_status: Option<String> = req
        .status
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if let Some(ref s) = new_status {
        if !is_allowed_compliance_request_status(s) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_compliance_request_status",
                )),
            )
                .into_response();
        }
    };    let new_notes: Option<String> = req
        .notes
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let event_detail: Option<String> = req
        .event_detail
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let export_signature: Option<String> = req
        .export_signature
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let record_hash: Option<String> = req
        .record_hash_fingerprint
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);

    let cur = match db::get_compliance_data_request_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_lookup_failed",
                )),
            )
                .into_response()
        }
    };    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key(
                "compliance_data_request_not_found",
            )),
        )
            .into_response();
    };    if cur.version != req.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "compliance_data_request_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    };    let updated = match db::admin_update_compliance_data_request(
        pool,
        rid,
        req.expected_version,
        new_status.as_deref(),
        new_notes.as_deref(),
        export_signature.as_deref(),
        record_hash.as_deref(),
        event_type,
        event_detail.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_update_failed",
                )),
            )
                .into_response()
        }
    };    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key(
                "compliance_data_request_update_race",
            )),
        )
            .into_response();
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.compliance.data_requests.update",
        Some("compliance_data_requests"),
        Some(&rid.to_string()),
        json!({
            "event_type": event_type,
            "status_after": updated.status,
            "version_after": updated.version,
        }),
    )
    .await;

    let now = Utc::now();
    let sla = updated.due_at.map(|d| {
        let secs = (d - now).num_seconds();
        json!({
            "due_at": d.to_rfc3339(),
            "seconds_until_due": secs,
            "overdue": secs < 0
                && updated.status != "completed"
                && updated.status != "rejected"
                && updated.status != "cancelled"
        })
    });
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "request_ref": updated.request_ref,
            "subject_id": updated.subject_id,
            "request_type": updated.request_type,
            "status": updated.status,
            "due_at": updated.due_at.map(|t| t.to_rfc3339()),
            "sla_hours": updated.sla_hours,
            "sla": sla,
            "jurisdiction": updated.jurisdiction,
            "notes": updated.notes,
            "version": updated.version,
            "created_at": updated.created_at.to_rfc3339(),
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
