//! **`GET …/admin/indexer/reconcile-report/:id`**（含 **`latest`**）。
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::super::{
    admin_attach_meta_build, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};
use super::reconcile_reports_support::admin_reconciliation_report_payload;

pub async fn get_admin_indexer_reconcile_report(
    State(state): State<ApiMetaState>,
    Path(report_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let rid_trim = report_id.trim();
    let pool_opt = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());

    if rid_trim.eq_ignore_ascii_case("latest") {
        let Some(pool) = pool_opt else {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key("admin_db_required")),
            )
                .into_response();
        };        let row = match db::get_latest_reconciliation_report_by_type(
            pool,
            db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
        )
        .await
        {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "reconciliation_report_read_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        }
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            request_id.as_deref(),
            "admin.indexer.reconcile_report.read",
            Some("reconcile_report"),
            Some("latest"),
            json!({"ok": true, "hit": row.is_some()}),
        )
        .await;
        return match row {
            Some(r) => {
                let mut body = json!({
                    "status": "ok",
                    "report": admin_reconciliation_report_payload(r),
                });
                admin_attach_meta_build(&mut body);
                Json(body).into_response()
            }
            None => {
                let mut body = json!({
                    "status": "ok",
                    "report": serde_json::Value::Null,
                    "note": "no_stored_reconciliation_reports",
                });
                admin_attach_meta_build(&mut body);
                Json(body).into_response()
            }
        }
    };
    if let Ok(uid) = Uuid::parse_str(rid_trim) {
        let Some(pool) = pool_opt else {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key("admin_db_required")),
            )
                .into_response();
        };        let row = match db::get_reconciliation_report_by_id(pool, uid).await {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "reconciliation_report_read_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        }
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            request_id.as_deref(),
            "admin.indexer.reconcile_report.read",
            Some("reconcile_report"),
            Some(rid_trim),
            json!({"ok": true, "hit": row.is_some()}),
        )
        .await;
        return match row {
            Some(r) => {
                let mut body = json!({
                    "status": "ok",
                    "report": admin_reconciliation_report_payload(r),
                });
                admin_attach_meta_build(&mut body);
                Json(body).into_response()
            }
            None => (
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("reconciliation_report_not_found")),
            )
                .into_response(),
        };
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.indexer.reconcile_report.read",
        Some("reconcile_report"),
        Some(report_id.as_str()),
        json!({"status": "target"}),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "report": {
            "id": report_id,
            "state": "target",
            "summary": {
                "diff_count": null,
                "closed": false
            }
        },
        "note": "minimal contract response for non-UUID report ids; use a stored UUID or path id `latest` (see 04 §3.4)"
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
