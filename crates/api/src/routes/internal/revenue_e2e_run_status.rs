//! **B-404 / B-405**：**`GET …/internal/revenue-e2e-run-status`** — 按 **`run_id`** **只读** **聚合** **L0** **留证** **（** **`b403-run-manifest.jsonl`** **/** **`b405-run-manifest.jsonl`** **）** **与** **DB** **快照** **（** **orders** **计数** **、** **最新** **`reconciliation_reports.summary`** **中** **B-383/B-386** **键** **；** **L2** **`orders_row_excerpt`** **）** **。
//!
//! **不** **把** **`run_id`** **写入** **`orders`** **；** **DB** **段** **显式** **标注** **与** **`run_id`** **无** **FK** **关联** **。

use axum::extract::{Query, State};
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::db::DbOrderRow;
use crate::db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS;
use crate::state::ApiMetaState;

pub const REVENUE_E2E_RUN_STATUS_ANCHOR: &str = "404-REVENUE-E2E-RUN-STATUS-V1";

const KEY_383: &str = "fee_router_platform_fee_routed_log_count_chain_vs_db_observability";
const KEY_386: &str = "revenue_pipeline_log_count_chain_vs_db_bundle_observability";
const MANIFEST_MAX: usize = 10 * 1024 * 1024;

#[derive(Debug, Deserialize)]
pub struct RevenueE2eRunStatusQuery {
    /// **L0** **`b403_round.run_id`** / **`b405_round.run_id`**（**UUID**）
    pub run_id: String,
}

fn default_b403_manifest_path() -> std::path::PathBuf {
    if let Ok(p) = std::env::var("TRAVELTRUST_B403_MANIFEST_PATH") {
        return std::path::PathBuf::from(p.trim());
    }
    if let Ok(root) = std::env::var("TRAVELTRUST_REPO_ROOT") {
        return std::path::PathBuf::from(root.trim())
            .join("evidence/b403_revenue_e2e_runs/b403-run-manifest.jsonl");
    }
    std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("evidence/b403_revenue_e2e_runs/b403-run-manifest.jsonl")
}

fn default_b405_manifest_path() -> std::path::PathBuf {
    if let Ok(p) = std::env::var("TRAVELTRUST_B405_MANIFEST_PATH") {
        return std::path::PathBuf::from(p.trim());
    }
    if let Ok(root) = std::env::var("TRAVELTRUST_REPO_ROOT") {
        return std::path::PathBuf::from(root.trim())
            .join("evidence/b405_revenue_e2e_runs/b405-run-manifest.jsonl");
    }
    std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("evidence/b405_revenue_e2e_runs/b405-run-manifest.jsonl")
}

/// **L0** **留证** **文件** **：** **优先** **连续** **JSON** **值** **流** **（** **兼容** **被** **工具** **格式化** **的** **多行** **块** **）** **；** **否则** **回退** **单行** **NDJSON** **。**
fn parse_b403_manifest_json_values(raw: &str) -> Vec<Value> {
    let mut stream = serde_json::Deserializer::from_str(raw).into_iter::<Value>();
    let mut out: Vec<Value> = Vec::new();
    for item in &mut stream {
        if let Ok(v) = item {
            out.push(v);
        } else {
            break;
        }
    }
    if !out.is_empty() {
        return out;
    }
    let mut lines_out: Vec<Value> = Vec::new();
    for line in raw.lines() {
        let t = line.trim();
        if t.is_empty() {
            continue;
        }
        if let Ok(v) = serde_json::from_str::<Value>(t) {
            lines_out.push(v);
        }
    }
    lines_out
}

fn parse_b402_rollup_marker(b402_last_line: &str) -> Option<String> {
    let key = "rollup.marker=";
    let i = b402_last_line.find(key)?;
    let rest = &b402_last_line[i + key.len()..];
    Some(rest.trim_end_matches(')').trim().to_string())
}

fn find_b403_round(parsed: &[Value], run_id_s: &str) -> Option<Value> {
    parsed.iter().find(|v| {
        v.get("kind").and_then(|k| k.as_str()) == Some("b403_round")
            && v.get("run_id").and_then(|x| x.as_str()) == Some(run_id_s)
    }).cloned()
}

fn find_b405_round(parsed: &[Value], run_id_s: &str) -> Option<Value> {
    parsed.iter().find(|v| {
        v.get("kind").and_then(|k| k.as_str()) == Some("b405_round")
            && v.get("run_id").and_then(|x| x.as_str()) == Some(run_id_s)
    }).cloned()
}

fn order_phase_from_round(round: &Value) -> Option<String> {
    let after = round
        .get("order_phase_after_b402")
        .and_then(|x| x.as_str())
        .map(std::string::ToString::to_string);
    if let Some(s) = after.filter(|s| !s.is_empty()) {
        return Some(s);
    }
    round
        .get("order_phase_before_tick")
        .and_then(|x| x.as_str())
        .filter(|s| !s.is_empty())
        .map(std::string::ToString::to_string)
}

fn db_order_row_excerpt(row: &DbOrderRow) -> Value {
    json!({
        "id": row.id.to_string(),
        "status": row.status,
        "escrow_address": row.escrow_address,
        "chain_id": row.chain_id,
        "amount": row.amount,
        "currency": row.currency,
        "created_at": row.created_at.to_rfc3339(),
        "updated_at": row.updated_at.to_rfc3339(),
    })
}

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
    };
    let run_id_s = run_id.to_string();

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
    }

    let mut resolved: Option<(std::path::PathBuf, &'static str, &'static str, Value, Vec<Value>)> =
        None;

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
        }
        let parsed = parse_b403_manifest_json_values(s);
        if let Some(round) = find_b403_round(&parsed, &run_id_s) {
            resolved = Some((path403.clone(), "b403", "b403_round", round, parsed));
        }
    }

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
            }
            let parsed = parse_b403_manifest_json_values(s);
            if let Some(round) = find_b405_round(&parsed, &run_id_s) {
                resolved = Some((path405.clone(), "b405", "b405_round", round, parsed));
            }
        }
    }

    let Some((manifest_path, manifest_source, manifest_kind, round, parsed)) = resolved else {
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
    };

    let session_matched = round
        .get("session_id")
        .and_then(|x| x.as_str())
        .and_then(|sid| {
            let start_kind = if manifest_kind == "b405_round" {
                "b405_session_start"
            } else {
                "b403_session_start"
            };
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
        round
            .get("order_id")
            .cloned()
            .unwrap_or(Value::Null)
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
        }

        let orders_total = db::count_orders(pool).await.ok();
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
            }
            if let Some(x) = s.get(KEY_386) {
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

#[cfg(test)]
mod tests {
    use super::parse_b402_rollup_marker;
    use super::parse_b403_manifest_json_values;
    use super::{find_b403_round, find_b405_round, order_phase_from_round};
    use serde_json::json;

    #[test]
    fn parse_rollup_marker_from_b402_tail() {
        let s = "b402: ok (B-383+B-386 reconcile == admin overview; bundle rollup.marker=incomparable)";
        assert_eq!(
            parse_b402_rollup_marker(s).as_deref(),
            Some("incomparable")
        );
    }

    #[test]
    fn parse_rollup_marker_missing_returns_none() {
        assert!(parse_b402_rollup_marker("no marker here").is_none());
    }

    #[test]
    fn parse_manifest_accepts_pretty_multiline_concatenated_json() {
        let raw = r#"{
  "kind": "b403_session_start",
  "session_id": "s"
}
{
  "kind": "b403_round",
  "run_id": "r1"
}"#;
        let v = parse_b403_manifest_json_values(raw);
        assert_eq!(v.len(), 2);
        assert_eq!(
            v[1].get("run_id").and_then(|x| x.as_str()),
            Some("r1")
        );
    }

    #[test]
    fn parse_manifest_ndjson_one_line_per_record() {
        let raw = "{\"kind\":\"a\"}\n{\"kind\":\"b\",\"run_id\":\"u\"}\n";
        let v = parse_b403_manifest_json_values(raw);
        assert_eq!(v.len(), 2);
    }

    #[test]
    fn find_b405_round_hits_before_b403_same_file_not_used() {
        let rid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        let parsed = vec![
            json!({"kind":"b405_session_start","session_id":"s1"}),
            json!({"kind":"b405_round","run_id":rid,"order_id":"11111111-2222-3333-4444-555555555555"}),
        ];
        let r = find_b405_round(&parsed, rid).expect("b405");
        assert_eq!(r.get("order_id").and_then(|x| x.as_str()).unwrap().len(), 36);
        assert!(find_b403_round(&parsed, rid).is_none());
    }

    #[test]
    fn order_phase_prefers_after_b402() {
        let v = json!({
            "order_phase_after_b402": "post_b402",
            "order_phase_before_tick": "post_tick_pre_b402"
        });
        assert_eq!(
            order_phase_from_round(&v).as_deref(),
            Some("post_b402")
        );
    }
}
