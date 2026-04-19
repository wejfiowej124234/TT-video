//! **B-386** / **TT-B386**：**FeeRouter** **`PlatformFeeRouted`** + **RegionVault** **`RegionVaultForwarded`** + **CountryPoolLedger** **`CountryLedgerCredited`** — **汇总级** **`eth_getLogs`** 条数 vs 三投影表 **同块窗** 对拍 **bundle**（**不**替代 **B-383/B-384/B-385** 子观测；**不**入 **`compound_gate`**）。

use serde_json::{json, Value};

/// **TT-B386** / **母表 B-386**：机读锚（**`revenue_pipeline_log_count_chain_vs_db_bundle_observability`**）。
pub const REVENUE_PIPELINE_LOG_COUNT_CHAIN_VS_DB_BUNDLE_OBS_ANCHOR: &str =
    "386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-V1";

fn marker_str(v: &Value) -> &'static str {
    match v.get("marker").and_then(|m| m.as_str()) {
        Some("aligned") => "aligned",
        Some("drift") => "drift",
        Some("unavailable") => "unavailable",
        Some("incomparable") => "incomparable",
        Some(_) | None => "incomparable",
    }
}

fn rollup_marker(m1: &str, m2: &str, m3: &str) -> &'static str {
    let ms = [m1, m2, m3];
    if ms.iter().any(|m| *m == "drift") {
        return "drift";
    }
    if ms.iter().any(|m| *m == "unavailable") {
        return "unavailable";
    }
    if ms.iter().any(|m| *m == "incomparable") {
        return "incomparable";
    }
    if ms.iter().all(|m| *m == "aligned") {
        return "aligned";
    }
    "incomparable"
}

/// 由 **B-383/B-384/B-385** 三子观测 **JSON**（已成功算得）组装 **bundle**；**纯内存**、**无** DB/RPC。
pub fn revenue_pipeline_log_count_chain_vs_db_bundle_observability_from_components(
    fee_router_platform_fee_routed_log_count_chain_vs_db_observability: Value,
    region_vault_forwarded_log_count_chain_vs_db_observability: Value,
    p5_country_ledger_credited_log_count_chain_vs_db_observability: Value,
    expected_chain_id: i64,
) -> Value {
    let m_fr = marker_str(&fee_router_platform_fee_routed_log_count_chain_vs_db_observability);
    let m_rv = marker_str(&region_vault_forwarded_log_count_chain_vs_db_observability);
    let m_p5 = marker_str(&p5_country_ledger_credited_log_count_chain_vs_db_observability);
    let roll = rollup_marker(m_fr, m_rv, m_p5);
    json!({
        "anchor": REVENUE_PIPELINE_LOG_COUNT_CHAIN_VS_DB_BUNDLE_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Roll-up of TT-B383 (FeeRouter PlatformFeeRouted vs fee_router_routed_events), TT-B384 (RegionVaultForwarded vs region_vault_forwarded_events), TT-B385 (CountryLedgerCredited vs p5_country_ledger_lines); same per-stream block-window semantics as each child. rollup.marker is worst-of: drift > unavailable > incomparable > aligned.",
        "components": {
            "fee_router_platform_fee_routed_log_count_chain_vs_db_observability": fee_router_platform_fee_routed_log_count_chain_vs_db_observability,
            "region_vault_forwarded_log_count_chain_vs_db_observability": region_vault_forwarded_log_count_chain_vs_db_observability,
            "p5_country_ledger_credited_log_count_chain_vs_db_observability": p5_country_ledger_credited_log_count_chain_vs_db_observability,
        },
        "rollup": {
            "marker": roll,
            "markers": {
                "fee_router_platform_fee_routed_log_count_chain_vs_db_observability": m_fr,
                "region_vault_forwarded_log_count_chain_vs_db_observability": m_rv,
                "p5_country_ledger_credited_log_count_chain_vs_db_observability": m_p5,
            },
            "rule": "worst-of child markers: drift > unavailable > incomparable > aligned",
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b386_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_LOG_COUNT_CHAIN_VS_DB_BUNDLE_OBS_ANCHOR,
            "386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-V1"
        );
    }

    #[test]
    fn b386_rollup_drift_wins() {
        let b = revenue_pipeline_log_count_chain_vs_db_bundle_observability_from_components(
            json!({"marker": "aligned"}),
            json!({"marker": "drift"}),
            json!({"marker": "incomparable"}),
            137,
        );
        assert_eq!(b["rollup"]["marker"], "drift");
    }

    #[test]
    fn b386_rollup_all_aligned() {
        let b = revenue_pipeline_log_count_chain_vs_db_bundle_observability_from_components(
            json!({"marker": "aligned"}),
            json!({"marker": "aligned"}),
            json!({"marker": "aligned"}),
            137,
        );
        assert_eq!(b["rollup"]["marker"], "aligned");
    }

    #[test]
    fn b386_rollup_unavailable_after_aligned() {
        let b = revenue_pipeline_log_count_chain_vs_db_bundle_observability_from_components(
            json!({"marker": "aligned"}),
            json!({"marker": "unavailable"}),
            json!({"marker": "aligned"}),
            137,
        );
        assert_eq!(b["rollup"]["marker"], "unavailable");
    }
}
