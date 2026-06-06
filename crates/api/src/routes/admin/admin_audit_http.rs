//! Admin audit operations catalog and audit log list/detail handlers.

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminAuditOperationsQuery, AdminAuditQuery,
    AdminAuthAuditEventsQuery,
};

/// Lexicographic catalog of `action` strings passed to [`write_admin_audit_log_best_effort`] in `routes::admin`.
/// When adding audited admin routes, append here (keep sorted).
pub(crate) const ADMIN_AUDIT_ACTION_CODES: &[&str] = &[
    "admin.alert.incident.read",
    "admin.api_versions.read",
    "admin.approvals.detail.read",
    "admin.approvals.read",
    "admin.audit.operations.read",
    "admin.auth_audit_events.read",
    "admin.audit_logs.detail.read",
    "admin.audit_logs.read",
    "admin.community.abuse_policy.patch",
    "admin.community.appeals.read",
    "admin.community.appeals.review",
    "admin.community.comments.visibility",
    "admin.community.moderation.update",
    "admin.community.moderation_cases.read",
    "admin.community.penalties.create",
    "admin.community.penalties.read",
    "admin.community.policy_change_logs.read",
    "admin.community.ranking_snapshots.read",
    "admin.community.reports.read",
    "admin.community.risk_signals.read",
    "admin.compliance.data_request_events.read",
    "admin.compliance.data_requests.read",
    "admin.compliance.data_requests.update",
    "admin.config.release.read",
    "admin.config.releases.read",
    "admin.disputes.detail.read",
    "admin.disputes.read",
    "admin.fee_router_routed.read",
    "admin.finance.summary.export",
    "admin.finance.summary.read",
    "admin.flags.publish",
    "admin.flags.read",
    "admin.guides.detail.read",
    "admin.guides.read",
    "admin.indexer.health.read",
    "admin.indexer.reconcile_report.read",
    "admin.indexer.reconcile_reports.export",
    "admin.indexer.reconcile_reports.list",
    "admin.internal_tools.audits.read",
    "admin.jobs.read",
    "admin.lifecycle.state_machines.read",
    "admin.media.access_logs.read",
    "admin.media.signed_url_tokens.read",
    "admin.metrics.home_overview.read",
    "admin.observability.alert_rules.read",
    "admin.observability.overview.read",
    "admin.orders.detail.read",
    "admin.orders.read",
    "admin.policies.publish",
    "admin.policies.read",
    "admin.region_vault_forwarded.read",
    "admin.reviews.detail.read",
    "admin.reviews.read",
    "admin.scheduler.jobs.read",
    "admin.scheduler.jobs.rerun",
    "admin.schema.migrations.read",
    "admin.secrets.metadata.read",
    "admin.tenants.scopes.publish",
    "admin.tenants.scopes.read",
    "admin.user.role.change",
    "admin.users.detail.read",
    "admin.users.read",
];

pub async fn get_admin_audit_operations(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminAuditOperationsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(50).clamp(1, 200);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.audit.operations.read",
        Some("audit_operations"),
        None,
        json!({ "ok": true, "limit": limit }),
    )
    .await;

    let catalog_total = ADMIN_AUDIT_ACTION_CODES.len();
    let take = (limit as usize).min(catalog_total);
    let operations: Vec<Value> = ADMIN_AUDIT_ACTION_CODES[..take]
        .iter()
        .map(|code| {
            let mutating = !code.ends_with(".read");
            json!({ "code": code, "mutating": mutating })
        })
        .collect();

    let mut body = json!({
        "status": "ok",
        "operations": operations,
        "catalog_total": catalog_total,
        "returned": take,
        "note": "static action catalog aligned with write_admin_audit_log_best_effort in routes/admin; not a DB-backed event stream; export pipeline pending stage 120/200",
        "applied_filters": {
            "limit": limit,
            "source": "action_catalog_v1"
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_audit_logs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminAuditQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        let mut body = json!({
            "status": "ok",
            "items": [],
            "note": "admin_audit_log_no_db",
            "meta": {
                "note": "admin_audit_log_no_db",
            }
        });
        admin_attach_meta_build(&mut body);
        return Json(body).into_response();
    }
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let actor_filter = match query
        .actor_id
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(v) => Some(v),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_actor_id")),
                )
                    .into_response()
            }
        },
        None => None,
    };
    let action_filter = query
        .action
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());
    let resource_type_filter = query
        .resource_type
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());

    let rows = match db::list_admin_audit_logs(
        pool,
        actor_filter,
        action_filter,
        resource_type_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_audit_query_failed")),
            )
                .into_response()
        }
    };
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "action": r.action,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "actor_id": r.actor_id,
                "request_id": r.request_id,
                "payload": r.payload,
                "created_at": r.created_at,
            })
        })
        .collect();

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.audit_logs.read",
        Some("admin_audit_logs"),
        None,
        json!({
            "filters": {
                "actor_id": query.actor_id,
                "action": query.action,
                "resource_type": query.resource_type,
                "limit": limit,
            },
            "result_count": items.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "actor_id": actor_filter,
            "action": action_filter,
            "resource_type": resource_type_filter,
            "limit": limit
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// 单条管理审计日志；与列表项同形；**须 PostgreSQL**（无 DB 时 **503** `admin_db_required`）。
pub async fn get_admin_audit_log_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let log_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_audit_log_id", "message": "invalid_audit_log_id"})),
            )
                .into_response()
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let row = match db::fetch_admin_audit_log_by_id(pool, log_uuid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_audit_query_failed")),
            )
                .into_response()
        }
    };
    let Some(r) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "audit_log_not_found", "message": "audit_log_not_found"})),
        )
            .into_response();
    }
    let mut body = json!({
        "status": "ok",
        "audit_log": {
            "id": r.id,
            "action": r.action,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "actor_id": r.actor_id,
            "request_id": r.request_id,
            "payload": r.payload,
            "created_at": r.created_at,
        }
    });
    admin_attach_meta_build(&mut body);

    let resource_id = log_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.audit_logs.detail.read",
        Some("admin_audit_logs"),
        Some(resource_id.as_str()),
        json!({ "audit_log_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_auth_audit_events(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminAuthAuditEventsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let event_type_filter = query
        .event_type
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());
    let reason_filter = query
        .reason
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());
    let user_id_filter = match query
        .user_id
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(v) => Some(v),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_user_id")),
                )
                    .into_response()
            }
        },
        None => None,
    };
    let client_ip_filter = query
        .client_ip
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());

    let rows = match db::list_auth_audit_events_with_reason_filter(
        pool,
        event_type_filter,
        reason_filter,
        user_id_filter,
        client_ip_filter,
        None,
        None,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("auth_audit_query_failed")),
            )
                .into_response()
        }
    };
    let items: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "event_type": r.event_type,
                "user_id": r.user_id,
                "request_id": r.request_id,
                "client_ip": r.client_ip,
                "user_agent": r.user_agent,
                "reason": r.reason,
                "payload": r.payload,
                "created_at": r.created_at,
            })
        })
        .collect();

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.auth_audit_events.read",
        Some("auth_audit_events"),
        None,
        json!({
            "filters": {
                "event_type": event_type_filter,
                "reason": reason_filter,
                "user_id": user_id_filter,
                "client_ip": client_ip_filter,
                "limit": limit,
            },
            "result_count": items.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "event_type": event_type_filter,
            "reason": reason_filter,
            "user_id": user_id_filter,
            "client_ip": client_ip_filter,
            "limit": limit
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
