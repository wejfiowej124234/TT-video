//! Admin **schema/migrations** 只读（**04 §3.5**）。

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_handler_common::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};
use super::AdminSchemaMigrationsQuery;

pub async fn get_admin_schema_migrations(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminSchemaMigrationsQuery>,
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

    let schema_versions = match db::list_schema_versions(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("schema_versions_query_failed")),
            )
                .into_response()
        }
    };    let migration_histories = match db::list_migration_histories(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("migration_histories_query_failed")),
            )
                .into_response()
        }
    };    let migration_rollbacks = match db::list_migration_rollbacks(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("migration_rollbacks_query_failed")),
            )
                .into_response()
        }
    };    let backfill_jobs = match db::list_backfill_jobs(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("backfill_jobs_query_failed")),
            )
                .into_response()
        }
    };    let dual_write_checks = match db::list_dual_write_checks(pool, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("dual_write_checks_query_failed")),
            )
                .into_response()
        }
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.schema.migrations.read",
        Some("schema_migrations"),
        None,
        json!({
            "limit": limit,
            "schema_versions_count": schema_versions.len(),
            "migration_histories_count": migration_histories.len(),
            "migration_rollbacks_count": migration_rollbacks.len(),
            "backfill_jobs_count": backfill_jobs.len(),
            "dual_write_checks_count": dual_write_checks.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "applied_filters": {
            "limit": limit,
        },
        "items": {
            "schema_versions": schema_versions.into_iter().map(|r| json!({
                "version_no": r.version_no,
                "status": r.status,
                "released_at": r.released_at,
                "updated_at": r.updated_at
            })).collect::<Vec<_>>(),
            "migration_histories": migration_histories.into_iter().map(|r| json!({
                "migration_id": r.migration_id,
                "from_version": r.from_version,
                "to_version": r.to_version,
                "result": r.result,
                "created_at": r.created_at
            })).collect::<Vec<_>>(),
            "migration_rollbacks": migration_rollbacks.into_iter().map(|r| json!({
                "rollback_id": r.rollback_id,
                "target_version": r.target_version,
                "trigger_reason": r.trigger_reason,
                "result": r.result,
                "created_at": r.created_at
            })).collect::<Vec<_>>(),
            "backfill_jobs": backfill_jobs.into_iter().map(|r| json!({
                "job_id": r.job_id,
                "scope": r.scope,
                "progress": r.progress,
                "error_count": r.error_count,
                "status": r.status,
                "updated_at": r.updated_at
            })).collect::<Vec<_>>(),
            "dual_write_checks": dual_write_checks.into_iter().map(|r| json!({
                "check_id": r.check_id,
                "old_digest": r.old_digest,
                "new_digest": r.new_digest,
                "diff_count": r.diff_count,
                "status": r.status,
                "checked_at": r.checked_at
            })).collect::<Vec<_>>()
        },
        "meta": {
            "note": "minimal schema evolution center read endpoint",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
