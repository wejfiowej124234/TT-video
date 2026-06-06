//! `GET …/admin/lifecycle/state-machines`

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, parse_feature_flag_enabled_filter,
    request_id_from_headers, require_admin_actor, write_admin_audit_log_best_effort,
    AdminLifecycleStateMachinesQuery,
};

pub async fn get_admin_lifecycle_state_machines(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminLifecycleStateMachinesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let mcode_sub = query.machine_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let machine_code_pattern: Option<String> =
        mcode_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let domain_sub = query.domain.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let domain_pattern: Option<String> =
        domain_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let entity_sub = query.entity_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let entity_type_pattern: Option<String> =
        entity_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let version_sub = query.version.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 32 {
            None
        } else {
            Some(t)
        }
    });
    let version_pattern: Option<String> =
        version_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let sot_sub = query.source_of_truth.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let source_of_truth_pattern: Option<String> =
        sot_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let anomaly_filter = match parse_feature_flag_enabled_filter(&query.anomaly_flag) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_lifecycle_anomaly_flag_filter",
                    "anomaly_flag must be true|false|1|0|yes|no or omitted",
                )),
            )
                .into_response();
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_lifecycle_state_machines(
        pool,
        machine_code_pattern.as_deref(),
        domain_pattern.as_deref(),
        entity_type_pattern.as_deref(),
        version_pattern.as_deref(),
        source_of_truth_pattern.as_deref(),
        anomaly_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "lifecycle_state_machines_query_failed",
                )),
            )
                .into_response()
        }
    };    let generated_at = Utc::now();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.lifecycle.state_machines.read",
        Some("lifecycle_state_machines"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "machine_code": mcode_sub,
            "domain": domain_sub,
            "entity_type": entity_sub,
            "version": version_sub,
            "source_of_truth": sot_sub,
            "anomaly_flag": anomaly_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "machine_code": r.machine_code,
                "domain": r.domain,
                "version": r.version,
                "entity_type": r.entity_type,
                "current_state": r.current_state,
                "expected_state": r.expected_state,
                "anomaly_flag": r.anomaly_flag,
                "anomaly_type": r.anomaly_type,
                "last_transition_at": r.last_transition_at.map(|t| t.to_rfc3339()),
                "source_of_truth": r.source_of_truth,
                "repairable": r.repairable,
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "machine_code": mcode_sub,
            "domain": domain_sub,
            "entity_type": entity_sub,
            "version": version_sub,
            "source_of_truth": sot_sub,
            "anomaly_flag": anomaly_filter,
        },
        "meta": {
            "generated_at": generated_at.to_rfc3339(),
            "source": "db",
            "checkpoint": {
                "block_number": state.indexer_checkpoint.block_number,
                "log_index": state.indexer_checkpoint.log_index
            },
            "note": "350 baseline ledger; states are placeholders until validator projection wired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
