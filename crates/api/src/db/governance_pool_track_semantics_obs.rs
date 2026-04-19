//! **`balance_lines_v1`** 与 **`event_log.track_type`**、经济投影表 **二次校验**（reconcile；**非**数值恒等证明）。

use crate::balance_lines_v1;
use crate::db::event_log::{
    event_log_chain_scope_rollback_dry_run, event_log_track_type_counts_for_chain,
};
use crate::db::governance::get_governance_pool;
use crate::u256_hex::parse_u256_word_hex;
use serde_json::{json, Value};
use sqlx::postgres::PgPool;

pub const GOVERNANCE_POOL_TRACK_SEMANTICS_VS_EVENT_LOG_ANCHOR: &str =
    "402-GOVERNANCE-POOL-TRACK-SEMANTICS-VS-EVENT-LOG-OBS-V1";

fn line_balance_nonempty(line: &Value) -> bool {
    let Some(raw) = line.get("balance").and_then(|v| v.as_str()) else {
        return false;
    };
    let s = raw.trim();
    if s.is_empty() {
        return false;
    }
    if let Some(w) = parse_u256_word_hex(s).or_else(|| parse_u256_word_hex(&format!("0x{s}"))) {
        return w.iter().any(|b| *b != 0);
    }
    true
}

/// DB 最小快照：**`governance_pool`** 一行 + 环境 **`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**（与 handler 同源）；**不含**链上 merge 的 country/treasury 根字段。  
/// **P1**：并列 **`fee_router_routed_events` / `region_vault_forwarded_events` / `p5_country_ledger_lines`** 行数；**Track A** 在 **`event_log.track_type`** 缺 **`A`** 时，若经济投影腿已有数据则**不**标 **`suspect`**（ indexer 分轨标签滞后场景）。
pub async fn governance_pool_track_semantics_vs_event_log_observability(
    pool: &PgPool,
    chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let row = get_governance_pool(pool).await?;
    let treasury_erc20_currency = std::env::var("GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let lines = balance_lines_v1::balance_lines_v1_from_parts(
        row.as_ref().and_then(|r| r.balance.clone()),
        row.as_ref().and_then(|r| r.currency.clone()),
        None,
        None,
        None,
        treasury_erc20_currency,
    );

    let event_counts = event_log_track_type_counts_for_chain(pool, chain_id).await?;
    let dry = event_log_chain_scope_rollback_dry_run(pool, chain_id).await?;
    let p5_rows: i64 =
        sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM p5_country_ledger_lines WHERE chain_id = $1"#)
            .bind(chain_id)
            .fetch_one(pool)
            .await?;

    let event_a = event_counts
        .get("A")
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    let _event_b = event_counts
        .get("B")
        .and_then(|v| v.as_i64())
        .unwrap_or(0);

    let track_a_signal = dry.fee_router_routed_events_rows > 0
        || dry.region_vault_forwarded_events_rows > 0
        || p5_rows > 0
        || event_a > 0;

    let mut suspect_nonempty_balance_missing_events = Vec::new();
    for line in &lines {
        if !line_balance_nonempty(line) {
            continue;
        }
        let tt = line
            .get("track_type")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let c = event_counts
            .get(tt)
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        if tt == "A" && c == 0 && track_a_signal {
            continue;
        }
        if c == 0 {
            suspect_nonempty_balance_missing_events.push(json!({
                "track_type": tt,
                "source": line.get("source"),
                "reason": "balance_lines_v1_nonempty_but_no_event_log_rows_for_track",
            }));
        }
    }

    let marker = if suspect_nonempty_balance_missing_events.is_empty() {
        "aligned"
    } else {
        "suspect"
    };

    Ok(json!({
        "anchor": GOVERNANCE_POOL_TRACK_SEMANTICS_VS_EVENT_LOG_ANCHOR,
        "schema_version": 2,
        "chain_id": chain_id,
        "rule": "04 §3.4 / 91: juxtapose balance_lines_v1 (DB-minimum snapshot) with event_log track_type histogram and economic projection row counts (fee_router_routed_events, region_vault_forwarded_events, p5_country_ledger_lines). Track A: if projection footprint or event_log A>0, missing A-tag on lines alone does not mark suspect. Not a numeric proof.",
        "balance_lines_v1_db_minimum": lines,
        "event_log_track_type_counts": event_counts,
        "projection_footprint_v1": {
            "fee_router_routed_events_rows": dry.fee_router_routed_events_rows,
            "region_vault_forwarded_events_rows": dry.region_vault_forwarded_events_rows,
            "p5_country_ledger_lines_rows": p5_rows,
            "event_log_rows_chain_total": dry.event_log_rows
        },
        "checks": {
            "nonempty_balance_lines_without_matching_track_events": suspect_nonempty_balance_missing_events
        },
        "marker": marker,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn line_balance_nonempty_respects_zero_word() {
        let z = json!({"balance": "0x0000000000000000000000000000000000000000000000000000000000000000", "track_type": "A"});
        assert!(!line_balance_nonempty(&z));
        let nz = json!({"balance": "0x0000000000000000000000000000000000000000000000000000000000000001", "track_type": "A"});
        assert!(line_balance_nonempty(&nz));
    }
}
