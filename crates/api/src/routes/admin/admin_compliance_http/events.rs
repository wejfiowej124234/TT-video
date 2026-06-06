//! `GET …/compliance/data-requests/:id/events`

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminComplianceDataRequestEventsQuery,
};

pub async fn get_admin_compliance_data_request_events(
    State(state): State<ApiMetaState>,
    Path(request_id): Path<String>,
    Query(query): Query<AdminComplianceDataRequestEventsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
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
    };    let hdr_request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let event_sub = query.event_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let event_type_pattern: Option<String> =
        event_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let parent = match db::get_compliance_data_request_by_id(pool, rid).await {
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
    };    if parent.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key(
                "compliance_data_request_not_found",
            )),
        )
            .into_response();
    };    let rows = match db::list_compliance_data_request_events(
        pool,
        rid,
        event_type_pattern.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "compliance_data_request_events_query_failed",
                )),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.compliance.data_request_events.read",
        Some("compliance_data_request_events"),
        Some(&rid.to_string()),
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "event_type": event_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "request_id": r.request_id,
                "event_type": r.event_type,
                "event_detail": r.event_detail,
                "occurred_at": r.occurred_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "request_id": rid.to_string(),
            "event_type": event_sub,
        },
        "meta": {
            "source": "db",
            "note": "event timeline baseline; workflow emits still 500 phase",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
