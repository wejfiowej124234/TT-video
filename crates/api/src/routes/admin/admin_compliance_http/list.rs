//! `GET …/compliance/data-requests`

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminComplianceDataRequestsQuery,
};

use super::helpers::{is_allowed_compliance_request_status, is_allowed_compliance_request_type};

pub async fn get_admin_compliance_data_requests(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminComplianceDataRequestsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let type_filter: Option<String> = match query.request_type.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                let tl = t.to_ascii_lowercase();
                if is_allowed_compliance_request_type(tl.as_str()) {
                    Some(tl)
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_compliance_request_type_filter",
                            "request_type must be export|erasure or omitted",
                        )),
                    )
                        .into_response();
                }
            }
        }
    };
    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                let tl = t.to_ascii_lowercase();
                if is_allowed_compliance_request_status(tl.as_str()) {
                    Some(tl)
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_compliance_request_status_filter",
                            "status must be open|in_progress|completed|rejected|cancelled or omitted",
                        )),
                    )
                        .into_response();
                }
            }
        }
    };
    let ref_sub = query.request_ref.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let request_ref_pattern: Option<String> =
        ref_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let subj_sub = query.subject_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let subject_id_pattern: Option<String> =
        subj_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let jur_sub = query.jurisdiction.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let jurisdiction_pattern: Option<String> =
        jur_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_compliance_data_requests(
        pool,
        request_ref_pattern.as_deref(),
        subject_id_pattern.as_deref(),
        type_filter.as_deref(),
        status_filter.as_deref(),
        jurisdiction_pattern.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_requests_query_failed",
                )),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.compliance.data_requests.read",
        Some("compliance_data_requests"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "request_ref": ref_sub,
            "subject_id": subj_sub,
            "request_type": type_filter.as_deref(),
            "status": status_filter.as_deref(),
            "jurisdiction": jur_sub,
        }),
    )
    .await;
    let now = Utc::now();
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            let sla = r.due_at.map(|d| {
                let secs = (d - now).num_seconds();
                json!({
                    "due_at": d.to_rfc3339(),
                    "seconds_until_due": secs,
                    "overdue": secs < 0 && r.status != "completed" && r.status != "rejected" && r.status != "cancelled"
                })
            });
            json!({
                "id": r.id,
                "request_ref": r.request_ref,
                "subject_id": r.subject_id,
                "request_type": r.request_type,
                "status": r.status,
                "due_at": r.due_at.map(|t| t.to_rfc3339()),
                "sla_hours": r.sla_hours,
                "sla": sla,
                "jurisdiction": r.jurisdiction,
                "notes": r.notes,
                "version": r.version,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "request_ref": ref_sub,
            "subject_id": subj_sub,
            "request_type": type_filter.as_deref(),
            "status": status_filter.as_deref(),
            "jurisdiction": jur_sub,
        },
        "meta": {
            "source": "db",
            "generated_at": now.to_rfc3339(),
            "note": "DSAR ledger; events/export_signature/approval_no still 500 phase",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
