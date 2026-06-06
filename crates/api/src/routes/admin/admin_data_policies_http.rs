//! Admin **`admin_data_policies`** 读/发布（**70/530**、**04 §3.5**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    require_super_admin_uid, write_admin_audit_log_best_effort, AdminPoliciesQuery,
    AdminPolicyPublishBody,
};

fn is_allowed_policy_publish_status(s: &str) -> bool {
    matches!(s, "draft" | "active" | "deprecated")
}

/// GET /api/v1/admin/policies（04 §3.5、70）
pub async fn get_admin_policies(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminPoliciesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let code_sub = query.policy_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let policy_code_pattern: Option<String> =
        code_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_policy_publish_status(t) {
                Some(t.to_string())
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_admin_policy_status_filter",
                        "status must be draft|active|deprecated or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };
    let stype_sub = query.scope_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let scope_type_pattern: Option<String> =
        stype_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let role_sub = query.binding_role.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let binding_role_pattern: Option<String> =
        role_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_admin_data_policies(
        pool,
        policy_code_pattern.as_deref(),
        status_filter.as_deref(),
        scope_type_pattern.as_deref(),
        binding_role_pattern.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_policies_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.policies.read",
        Some("admin_data_policies"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "policy_code": code_sub,
            "status": status_filter.as_deref(),
            "scope_type": stype_sub,
            "binding_role": role_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "policy": {
                    "code": r.policy_code,
                    "version": r.version,
                    "status": r.status,
                },
                "scope": {
                    "type": r.scope_type,
                    "expr": r.scope_expr,
                },
                "binding": {
                    "role": r.binding_role,
                    "resources": r.binding_resources,
                },
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "policy_code": code_sub,
            "status": status_filter.as_deref(),
            "scope_type": stype_sub,
            "binding_role": role_sub,
        },
        "meta": {
            "source": "db",
            "note": "policy/scope/binding ledger; enforcement wiring remains product/70",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/policies/:id/publish（04 §3.5、70）
pub async fn post_admin_policy_publish(
    State(state): State<ApiMetaState>,
    Path(policy_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminPolicyPublishBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(policy_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_policy_id")),
            )
                .into_response()
        }
    };    let status_trim = body.status.trim();
    if !is_allowed_policy_publish_status(status_trim) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_policy_status")),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_admin_data_policy_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_policy_query_failed")),
            )
                .into_response()
        }
    };    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("admin_policy_not_found")),
        )
            .into_response();
    };    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "admin_policy_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    };    let updated =
        match db::publish_admin_data_policy(pool, id, body.expected_version, status_trim).await {
            Ok(v) => v,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("admin_policy_publish_failed")),
                )
                    .into_response()
            }
        };    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("admin_policy_publish_race")),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.policies.publish",
        Some("admin_data_policies"),
        Some(&id.to_string()),
        json!({
            "policy_code": updated.policy_code,
            "status_before": cur.status,
            "status_after": updated.status,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "policy": {
                "code": updated.policy_code,
                "version": updated.version,
                "status": updated.status,
            },
            "scope": {
                "type": updated.scope_type,
                "expr": updated.scope_expr,
            },
            "binding": {
                "role": updated.binding_role,
                "resources": updated.binding_resources,
            },
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
