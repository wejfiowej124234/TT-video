//! `GET …/admin/api-versions`

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
    write_admin_audit_log_best_effort, AdminApiVersionsQuery,
};

use super::helpers::is_allowed_api_version_status;

pub async fn get_admin_api_versions(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminApiVersionsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let ver_sub = query.api_version.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let api_version_pattern: Option<String> =
        ver_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let status_filter: Option<String> = match query.status.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                let tl = t.to_ascii_lowercase();
                if is_allowed_api_version_status(tl.as_str()) {
                    Some(tl)
                } else {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_admin_api_version_status_filter",
                            "status must be planned|active|deprecated|sunset or omitted",
                        )),
                    )
                        .into_response();
                }
            }
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_api_versions(
        pool,
        api_version_pattern.as_deref(),
        status_filter.as_deref(),
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("api_versions_query_failed")),
            )
                .into_response()
        }
    };    let generated_at = Utc::now();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.api_versions.read",
        Some("api_versions"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "api_version": ver_sub,
            "status": status_filter.as_deref(),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "api_version": r.api_version,
                "status": r.status,
                "released_at": r.released_at.map(|t| t.to_rfc3339()),
                "deprecated_at": r.deprecated_at.map(|t| t.to_rfc3339()),
                "sunset_at": r.sunset_at.map(|t| t.to_rfc3339()),
                "compat_window_days": r.compat_window_days,
                "active_client_ratio_7d": r.active_client_ratio_7d,
                "request_count_7d": r.request_count_7d,
                "last_change_at": r.last_change_at.to_rfc3339(),
                "last_change_by": r.last_change_by,
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "api_version": ver_sub,
            "status": status_filter.as_deref(),
        },
        "meta": {
            "generated_at": generated_at.to_rfc3339(),
            "source": "db",
            "note": "340 baseline; usage ratios are ledger placeholders until telemetry wired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
