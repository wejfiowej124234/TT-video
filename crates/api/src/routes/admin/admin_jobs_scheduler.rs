//! Admin async jobs (**250**) + scheduler runs / manual rerun (**260**).

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    require_super_admin_uid, write_admin_audit_log_best_effort, AdminJobsQuery,
    AdminSchedulerJobsQuery, AdminSchedulerRerunBody,
};

fn is_allowed_async_job_status(s: &str) -> bool {
    matches!(
        s,
        "pending" | "running" | "completed" | "failed" | "dead_letter" | "cancelled"
    )
}

fn is_plausible_job_code(s: &str) -> bool {
    let s = s.trim();
    if s.is_empty() || s.len() > 160 {
        return false;
    }
    s.chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
}

pub async fn get_admin_jobs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminJobsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_filter = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(s) = status_filter {
        if !is_allowed_async_job_status(s) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_job_status_filter")),
            )
                .into_response();
        }
    };    let queue_name_filter = query
        .queue_name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(qn) = queue_name_filter {
        let len = qn.len();
        if len > 160
            || !qn
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
        {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_queue_name_filter")),
            )
                .into_response();
        }
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let counts_map = match db::async_jobs_status_counts(pool).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("async_jobs_summary_failed")),
            )
                .into_response()
        }
    };    let summary = json!({
        "pending": counts_map.get("pending").copied().unwrap_or(0),
        "running": counts_map.get("running").copied().unwrap_or(0),
        "completed": counts_map.get("completed").copied().unwrap_or(0),
        "failed": counts_map.get("failed").copied().unwrap_or(0),
        "dead_letter": counts_map.get("dead_letter").copied().unwrap_or(0),
        "cancelled": counts_map.get("cancelled").copied().unwrap_or(0),
    });
    let rows = match db::list_async_jobs(pool, status_filter, queue_name_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("async_jobs_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.jobs.read",
        Some("async_jobs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "status_filter": status_filter,
            "queue_name": queue_name_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "queue_name": r.queue_name,
                "job_type": r.job_type,
                "status": r.status,
                "attempt_count": r.attempt_count,
                "max_attempts": r.max_attempts,
                "last_error": r.last_error,
                "payload_ref": r.payload_ref,
                "idempotency_key": r.idempotency_key,
                "scheduled_for": r.scheduled_for.map(|t| t.to_rfc3339()),
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "summary": summary,
        "items": items,
        "applied_filters": {
            "limit": limit,
            "status": status_filter,
            "queue_name": queue_name_filter,
        },
        "meta": {
            "source": "db",
            "note": "250 baseline; worker/NATS wiring pending",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_scheduler_jobs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminSchedulerJobsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let job_code_filter = query
        .job_code
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(code) = job_code_filter {
        if !is_plausible_job_code(code) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_job_code",
                    "job_code must match [a-zA-Z0-9._-] and length 1–160 or be omitted",
                )),
            )
                .into_response();
        }
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_scheduler_job_runs(pool, job_code_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("scheduler_job_runs_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.scheduler.jobs.read",
        Some("scheduler_job_runs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "job_code_filter": job_code_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "job_code": r.job_code,
                "status": r.status,
                "trigger_source": r.trigger_source,
                "started_at": r.started_at.map(|t| t.to_rfc3339()),
                "finished_at": r.finished_at.map(|t| t.to_rfc3339()),
                "error_summary": r.error_summary,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "job_code": job_code_filter,
        },
        "meta": {
            "source": "db",
            "note": "260 baseline; cron executor may enqueue rows later",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn post_admin_scheduler_job_rerun(
    State(state): State<ApiMetaState>,
    Path(job_code): Path<String>,
    headers: HeaderMap,
    Json(req): Json<AdminSchedulerRerunBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let code = job_code.trim();
    if !is_plausible_job_code(code) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_job_code")),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let row = match db::insert_scheduler_manual_rerun(pool, code).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("scheduler_rerun_enqueue_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.scheduler.jobs.rerun",
        Some("scheduler_job_runs"),
        Some(&row.id.to_string()),
        json!({
            "job_code": code,
            "run_id": row.id,
            "reason": req.reason,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": row.id,
            "job_code": row.job_code,
            "status": row.status,
            "trigger_source": row.trigger_source,
            "started_at": row.started_at.map(|t| t.to_rfc3339()),
            "finished_at": row.finished_at.map(|t| t.to_rfc3339()),
            "created_at": row.created_at.to_rfc3339(),
        },
        "meta": {
            "note": "queued row recorded; worker must consume 250/260 pipeline when enabled",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
