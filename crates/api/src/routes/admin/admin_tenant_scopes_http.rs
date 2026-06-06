//! Admin **`admin_tenant_scopes`** 读/发布（**70/320**、**04 §3.5**）。

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
    require_super_admin_uid, write_admin_audit_log_best_effort, AdminTenantScopePublishBody,
    AdminTenantScopesQuery,
};

fn is_allowed_tenant_scope_publish_status(s: &str) -> bool {
    matches!(s, "draft" | "active" | "sunset")
}

fn is_allowed_tenant_scope_class(s: &str) -> bool {
    matches!(s, "data_residency" | "ops" | "feature" | "network")
}

/// GET /api/v1/admin/tenants/scopes（04 §3.5、70）
pub async fn get_admin_tenant_scopes(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminTenantScopesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let tk_sub = query.tenant_key.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let tenant_key_pattern: Option<String> =
        tk_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let rg_sub = query.region_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let region_pattern: Option<String> =
        rg_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_tenant_scope_publish_status(t) {
                Some(t.to_string())
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_tenant_scope_status_filter",
                        "status must be draft|active|sunset or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };
    let scope_class_filter: Option<String> = match query.scope_class.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_tenant_scope_class(t) {
                Some(t.to_string())
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_tenant_scope_class_filter",
                        "scope_class must be data_residency|ops|feature|network or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_admin_tenant_scopes(
        pool,
        tenant_key_pattern.as_deref(),
        region_pattern.as_deref(),
        status_filter.as_deref(),
        scope_class_filter.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_tenant_scopes_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.tenants.scopes.read",
        Some("admin_tenant_scopes"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "tenant_key": tk_sub,
            "region_code": rg_sub,
            "status": status_filter.as_deref(),
            "scope_class": scope_class_filter.as_deref(),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "tenant_key": r.tenant_key,
                "region_code": r.region_code,
                "scope_class": r.scope_class,
                "status": r.status,
                "notes": r.notes,
                "version": r.version,
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "tenant_key": tk_sub,
            "region_code": rg_sub,
            "status": status_filter.as_deref(),
            "scope_class": scope_class_filter.as_deref(),
        },
        "meta": {
            "source": "db",
            "note": "tenant/region scope ledger; multi-tenant routing still phased",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/tenants/scopes/:id/publish（04 §3.5、70、320）
pub async fn post_admin_tenant_scope_publish(
    State(state): State<ApiMetaState>,
    Path(scope_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminTenantScopePublishBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(scope_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_tenant_scope_id")),
            )
                .into_response()
        }
    };    let status_trim = body.status.trim();
    if !is_allowed_tenant_scope_publish_status(status_trim) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_tenant_scope_status")),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_admin_tenant_scope_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_tenant_scope_query_failed")),
            )
                .into_response()
        }
    };    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("admin_tenant_scope_not_found")),
        )
            .into_response();
    };    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "admin_tenant_scope_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    };    let updated =
        match db::publish_admin_tenant_scope(pool, id, body.expected_version, status_trim).await {
            Ok(v) => v,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_tenant_scope_publish_failed",
                    )),
                )
                    .into_response()
            }
        };    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("admin_tenant_scope_publish_race")),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.tenants.scopes.publish",
        Some("admin_tenant_scopes"),
        Some(&id.to_string()),
        json!({
            "tenant_key": updated.tenant_key,
            "region_code": updated.region_code,
            "scope_class": updated.scope_class,
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
            "tenant_key": updated.tenant_key,
            "region_code": updated.region_code,
            "scope_class": updated.scope_class,
            "status": updated.status,
            "notes": updated.notes,
            "version": updated.version,
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
