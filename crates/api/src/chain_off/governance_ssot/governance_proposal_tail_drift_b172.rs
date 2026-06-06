//! **TT-B172**：**`proposalCount()`** vs **`governance_proposals_projection`** **尾部 `MAX(proposal_id)`** 只读对拍（**非** **B-149** 逐提案 **`chain_state`**）。

use chrono::Utc;
use num_bigint::BigUint;
use serde_json::{json, Value};
use std::str::FromStr;

use crate::chain::ChainConfig;
use crate::db;

use crate::chain_off::ChainOffState;

/// **B-172** 观测壳：**不**参与 compound gate；**不**依赖 **`GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT`** 开关（仍须 **`business_chain_id` + DB**）。
pub async fn governor_proposal_tail_drift_observability_b172(
    chain_off: Option<&ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> Value {
    let observed_at = Utc::now().to_rfc3339();

    let Some(co) = chain_off else {
        return json!({
            "anchor": "172-GOVERNOR-PROPOSAL-TAIL-DRIFT-OBS-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "observation_note": "chain_off_unmounted",
            "boundary_vs_b149": "B-149 covers per-proposal state / lifecycle SSOT; B-172 is numeric tail vs proposalCount only.",
            "boundary_vs_b171": "B-171 is multi_table_chain_observability matrix; B-172 is governor projection tail only.",
        });
    };    let Some(business_chain_id) = co.config.business_chain_id else {
        return json!({
            "anchor": "172-GOVERNOR-PROPOSAL-TAIL-DRIFT-OBS-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "observation_note": "business_chain_id_unset",
            "boundary_vs_b149": "B-149 covers per-proposal state / lifecycle SSOT; B-172 is numeric tail vs proposalCount only.",
            "boundary_vs_b171": "B-171 is multi_table_chain_observability matrix; B-172 is governor projection tail only.",
        });
    };    let Some(pool) = co.db_pool.as_ref() else {
        return json!({
            "anchor": "172-GOVERNOR-PROPOSAL-TAIL-DRIFT-OBS-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "governance_business_chain_id": business_chain_id,
            "observation_note": "database_pool_unavailable",
            "boundary_vs_b149": "B-149 covers per-proposal state / lifecycle SSOT; B-172 is numeric tail vs proposalCount only.",
            "boundary_vs_b171": "B-171 is multi_table_chain_observability matrix; B-172 is governor projection tail only.",
        });
    };
    let probe = crate::chain::governor::probe_governor_proposal_count_chain(chain_config).await;
    let probe_json = serde_json::to_value(&probe).unwrap_or_else(|_| json!({}));

    let row_count = db::count_governance_proposals_projection_for_chain(pool, business_chain_id)
        .await
        .ok();
    let max_pid = db::max_proposal_id_decimal_string_governance_proposals_projection_for_chain(
        pool,
        business_chain_id,
    )
    .await
    .ok()
    .flatten();

    let chain_dec = (probe.probe_leg == "eth_call_all_ok")
        .then_some(probe.proposal_count.clone())
        .flatten();

    let chain_bn = chain_dec
        .as_ref()
        .and_then(|s| BigUint::from_str(s.trim()).ok());
    let max_bn = max_pid
        .as_ref()
        .and_then(|s| BigUint::from_str(s.trim()).ok());

    let read_only_max_proposal_id_plus_one_eq_chain_count = match (&chain_bn, &max_bn) {
        (Some(c), Some(m)) => {
            let one = BigUint::from(1u32);
            Some(m + &one == *c)
        }
        (Some(c), None) => Some(BigUint::from(0u32) == *c),
        _ => None,
    };

    let read_only_row_count_eq_chain_count = match (&chain_bn, row_count) {
        (Some(c), Some(rc)) if rc >= 0 => BigUint::from_str(&rc.to_string())
            .ok()
            .map(|rc_bn| rc_bn == *c),
        _ => None,
    };

    json!({
        "anchor": "172-GOVERNOR-PROPOSAL-TAIL-DRIFT-OBS-V1",
        "schema_version": 1,
        "observed_at": observed_at,
        "governance_business_chain_id": business_chain_id,
        "getter_note": "proposalCount() uint256 vs projection COUNT(*) and MAX(proposal_id); contiguous-id Governor: max_id+1 == chain_count and rows == chain_count when fully synced",
        "boundary_vs_b149": "B-149 covers per-proposal state / lifecycle SSOT; B-172 is numeric tail vs proposalCount only.",
        "boundary_vs_b171": "B-171 is multi_table_chain_observability matrix; B-172 is governor projection tail only.",
        "governor_proposal_count_probe": probe_json,
        "chain_proposal_count_decimal": chain_dec,
        "projection_row_count": row_count,
        "projection_max_proposal_id_decimal": max_pid,
        "read_only_max_proposal_id_plus_one_eq_chain_count": read_only_max_proposal_id_plus_one_eq_chain_count,
        "read_only_row_count_eq_chain_count": read_only_row_count_eq_chain_count,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn b172_tail_plus_one_matches_oz_style_counter() {
        let c = BigUint::from(3u32);
        let m = BigUint::from(2u32);
        let one = BigUint::from(1u32);
        assert_eq!(m + one, c);
    }

    #[tokio::test]
    async fn b172_obs_anchor_when_chain_off_unmounted() {
        let v = governor_proposal_tail_drift_observability_b172(None, None).await;
        assert_eq!(
            v["anchor"],
            json!("172-GOVERNOR-PROPOSAL-TAIL-DRIFT-OBS-V1")
        );
        assert_eq!(v["observation_note"], json!("chain_off_unmounted"));
    }
}
