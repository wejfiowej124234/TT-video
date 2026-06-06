//! **`GET /api/v1/internal/revenue-e2e-run-status`** handler（**B-404 / B-405**）。
use axum::extract::{Query, State};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS;
use crate::state::ApiMetaState;

use super::db_excerpt::db_order_row_excerpt;
use super::manifest::{
    default_b403_manifest_path, default_b405_manifest_path, find_b403_round, find_b405_round,
    order_phase_from_round, parse_b402_rollup_marker, parse_b403_manifest_json_values,
};
use super::types::{
    RevenueE2eRunStatusQuery, KEY_383, KEY_386, MANIFEST_MAX, REVENUE_E2E_RUN_STATUS_ANCHOR,
};

/// **`GET /api/v1/internal/revenue-e2e-run-status?run_id=<uuid>`**
pub async fn get_revenue_e2e_run_status(
    State(state): State<ApiMetaState>,
    Query(q): Query<RevenueE2eRunStatusQuery>,
) -> impl IntoResponse {
    let run_id = match Uuid::parse_str(q.run_id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                axum::http::StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_run_id",
                    "run_id must be a UUID (L0 b403_round.run_id)",
                )),
            )
                .into_response();
        }
    };    let run_id_s = run_id.to_string();

    let path403 = default_b403_manifest_path();
    let path405 = default_b405_manifest_path();

    let (raw403, raw405) = tokio::join!(
        tokio::fs::read_to_string(&path403),
        tokio::fs::read_to_string(&path405),
    );

    if raw403.is_err() && raw405.is_err() {
        let e403 = raw403.err().map(|e| e.to_string()).unwrap_or_default();
        let e405 = raw405.err().map(|e| e.to_string()).unwrap_or_default();
        return (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({
                "error": "b403_manifest_not_readable",
                "message": "b403_manifest_not_readable",
                "detail": format!(
                    "b403_path={}; err={}; b405_path={}; err={}",
                    path403.display(),
                    e403,
                    path405.display(),
                    e405
                ),
                "anchor": REVENUE_E2E_RUN_STATUS_ANCHOR,
            })),
        )
            .into_response();
    };    let mut resolved: Option<(
        std::path::PathBuf,
        &'static str,
        &'static str,
        Value,
        Vec<Value>,
    )> = None;

    if let Ok(ref s) = raw403 {
        if s.len() > MANIFEST_MAX {
            return (
                axum::http::StatusCode::PAYLOAD_TOO_LARGE,
                Json(crate::api_json::err_key_detail(
                    "b403_manifest_too_large",
                    "manifest exceeds 10MiB guard",
                )),
            )
                .into_response();
        };        let parsed = parse_b403_manifest_json_values(s);
        if let Some(round) = find_b403_round(&parsed, &run_id_s) {
            resolved = Some((path403.clone(), "b403", "b403_round", round, parsed));
        }
    };
    if resolved.is_none() {
        if let Ok(ref s) = raw405 {
            if s.len() > MANIFEST_MAX {
                return (
                    axum::http::StatusCode::PAYLOAD_TOO_LARGE,
                    Json(crate::api_json::err_key_detail(
                        "b403_manifest_too_large",
                        "manifest exceeds 10MiB guard",
                    )),
                )
                    .into_response();
            };            let parsed = parse_b403_manifest_json_values(s);
            if let Some(round) = find_b405_round(&parsed, &run_id_s) {
                resolved = Some((path405.clone(), "b405", "b405_round", round, parsed));
            }
        }
    };    let Some((manifest_path, manifest_source, manifest_kind, round, parsed)) = resolved else {
        return (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({
                "error": "revenue_e2e_run_not_found",
                "message": "revenue_e2e_run_not_found",
                "detail": format!(
                    "no b403_round/b405_round line for run_id={} (searched b403_path={} b405_path={})",
                    run_id_s,
                    path403.display(),
                    path405.display()
                ),
                "anchor": REVENUE_E2E_RUN_STATUS_ANCHOR,
                "manifest_path_b403": path403.display().to_string(),
                "manifest_path_b405": path405.display().to_string(),
            })),
        )
            .into_response();
    }
    let session_matched = round
        .get("session_id")
        .and_then(|x| x.as_str())
        .and_then(|sid| {
            let start_kind = if manifest_kind == "b405_round" {
                "b405_session_start"
            } else {
                "b403_session_start"
            }
            parsed.iter().find(|v| {
                v.get("kind").and_then(|k| k.as_str()) == Some(start_kind)
                    && v.get("session_id").and_then(|x| x.as_str()) == Some(sid)
            })
        })
        .cloned();

    let b402_last = round
        .get("b402_last_line")
        .and_then(|x| x.as_str())
        .unwrap_or("");
    let rollup_from_stdout = parse_b402_rollup_marker(b402_last);

    let order_id_json: Value = if manifest_kind == "b405_round" {
        round.get("order_id").cloned().unwrap_or(Value::Null)
    } else {
        Value::Null
    };
    let order_phase_json: Value = order_phase_from_round(&round)
        .map(|s| json!(s))
        .unwrap_or(Value::Null);

    let mut body = json!({
        "anchor": REVENUE_E2E_RUN_STATUS_ANCHOR,
        "run_id": run_id_s,
        "manifest_path": manifest_path.display().to_string(),
        "manifest_source": manifest_source,
        "manifest_kind": manifest_kind,
        "order_id": order_id_json,
        "order_phase": order_phase_json,
        "manifest_round": round,
        "manifest_session": session_matched,
        "observability_from_b402_stdout": {
            "rollup_marker_parsed": rollup_from_stdout,
            "source": "b402_last_line_regex",
        },
        "correlation_note": "DB aggregates below are not foreign-keyed to run_id; manifest_round is the per-run truth for L0/L2.",
    });

    if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
        if manifest_kind == "b405_round" {
            match round.get("order_id").and_then(|x| x.as_str()) {
                Some(oid_s) => match Uuid::parse_str(oid_s) {
                    Ok(oid) => match db::get_order_by_id(pool, oid).await {
                        Ok(Some(row)) => {
                            body["orders_row_excerpt"] = db_order_row_excerpt(&row);
                            body["orders_row_excerpt_note"] = Value::Null;
                        }
                        Ok(None) => {
                            body["orders_row_excerpt"] = Value::Null;
                            body["orders_row_excerpt_note"] = json!("order_not_found");
                        }
                        Err(_) => {
                            body["orders_row_excerpt"] = Value::Null;
                            body["orders_row_excerpt_note"] = json!("order_lookup_failed");
                        }
                    },
                    Err(_) => {
                        body["orders_row_excerpt"] = Value::Null;
                        body["orders_row_excerpt_note"] = json!("invalid_order_id");
                    }
                },
                None => {
                    body["orders_row_excerpt"] = Value::Null;
                    body["orders_row_excerpt_note"] = Value::Null;
                }
            }
        } else {
            body["orders_row_excerpt"] = Value::Null;
            body["orders_row_excerpt_note"] = Value::Null;
        };        let orders_total = db::count_orders(pool).await.ok();
        let orders_escrow = db::count_orders_with_escrow_address(pool).await.ok();
        let latest = db::get_latest_reconciliation_report_by_type(
            pool,
            REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
        )
        .await
        .ok()
        .flatten();

        let mut b383_b386 = json!({});
        if let Some(ref row) = latest {
            let s = &row.summary.0;
            if let Some(x) = s.get(KEY_383) {
                b383_b386[KEY_383] = x.clone();
            };            if let Some(x) = s.get(KEY_386) {
                b383_b386[KEY_386] = x.clone();
            }
            body["db_latest_reconciliation_report"] = json!({
                "id": row.id,
                "report_type": row.report_type,
                "chain_id": row.chain_id,
                "created_at": row.created_at,
                "summary_keys_include_b383_b386": s.get(KEY_383).is_some() && s.get(KEY_386).is_some(),
            });
        } else {
            body["db_latest_reconciliation_report"] = Value::Null;
        }

        body["orders_readonly"] = json!({
            "orders_total": orders_total,
            "orders_with_escrow_address_total": orders_escrow,
            "note": "global counts; not filtered by run_id",
        });
        body["db_reconcile_observability_excerpt"] = json!({
            "keys": [KEY_383, KEY_386],
            "values": b383_b386,
            "note": "from latest orders_projection_vs_orders report summary; not correlated to run_id",
        });
    } else {
        body["orders_row_excerpt"] = Value::Null;
        body["orders_row_excerpt_note"] = Value::Null;
        body["orders_readonly"] = Value::Null;
        body["db_latest_reconciliation_report"] = Value::Null;
        body["db_reconcile_observability_excerpt"] = Value::Null;
    }

    Json(body).into_response()
}
