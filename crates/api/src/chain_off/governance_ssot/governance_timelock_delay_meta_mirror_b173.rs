//! **TT-B173**：**`GovernanceTimelock.delay()`**（**`getMinDelay()`** 口径映射）与 **`GET /meta` → `governance.timelock_delay_observability`** **同源机读壳** 之 **只读镜像**（**非** **B-177** **807 字段表收口**；**非** **compound** **扩权**）。

use chrono::Utc;
use serde_json::{json, Value};

use crate::chain::ChainConfig;

use super::governance_timelock_delay_ssot::{
    merge_timelock_delay_reconcile_probe_into_observability, timelock_delay_observability_value,
    timelock_delay_reconcile_pass, timelock_delay_resolution_for_meta,
};
use crate::chain_off::ChainOffState;

/// **B-173** 观测壳：**不**参与 **`indexer_reconcile_compound_gate`**；**不**替代 **`timelock_delay_ssot_ops_check`** / **SEQ6** 门闸语义。
pub async fn timelock_delay_meta_mirror_observability_b173(
    chain_off: Option<&ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> Value {
    let observed_at = Utc::now().to_rfc3339();

    let Some(co) = chain_off else {
        return json!({
            "anchor": "173-GOVERNANCE-TIMELOCK-DELAY-META-MIRROR-OBS-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "observation_note": "chain_off_unmounted",
            "boundary_vs_b169_b176": "B-169～B-176 cover indexer reorg/finality/matrix/tick-buckets/governor tail / chainId probes; B-173 is Timelock delay meta mirror only.",
            "boundary_vs_seq6_ops": "SEQ6 timelock_delay_ssot_ops_check remains the compound-eligible SSOT branch; B-173 mirrors meta shape read-only.",
            "boundary_vs_b177": "B-177 is GET /meta governance.* / pool 807 alignment; B-173 only re-exports the existing timelock_delay_observability builder for reconcile.",
        });
    };
    let res = timelock_delay_resolution_for_meta(&co.config, chain_config).await;
    let probe = crate::chain::timelock::probe_timelock_delay_chain(chain_config).await;
    let base = timelock_delay_observability_value(&res, true);
    let meta_equivalent = merge_timelock_delay_reconcile_probe_into_observability(
        base,
        &co.config,
        &res,
        probe.clone(),
    );

    let reconcile_pass_read_only = timelock_delay_reconcile_pass(&co.config, &res, &probe);
    let read_only_delays_equal = match (res.delay_seconds.as_ref(), probe.delay_seconds.as_ref()) {
        (Some(a), Some(b)) => Some(a == b),
        _ => None,
    };

    json!({
        "anchor": "173-GOVERNANCE-TIMELOCK-DELAY-META-MIRROR-OBS-V1",
        "schema_version": 1,
        "observed_at": observed_at,
        "getter_note": "Solidity delay() (getMinDelay wording maps here); timelock_delay_observability_as_meta uses the same resolution + merge path as GET /meta governance.timelock_delay_observability.",
        "boundary_vs_b169_b176": "B-169～B-176 cover indexer reorg/finality/matrix/tick-buckets/governor tail / chainId probes; B-173 is Timelock delay meta mirror only.",
        "boundary_vs_seq6_ops": "SEQ6 timelock_delay_ssot_ops_check remains the compound-eligible SSOT branch; B-173 mirrors meta shape read-only.",
        "boundary_vs_b177": "B-177 is GET /meta governance.* / pool 807 alignment; B-173 only re-exports the existing timelock_delay_observability builder for reconcile.",
        "governance_timelock_delay_chain_ssot": res.governance_timelock_delay_chain_ssot,
        "resolution_source": res.source,
        "read_only_resolution_delay_seconds": res.delay_seconds,
        "read_only_timelock_delay_probe": serde_json::to_value(&probe).unwrap_or_else(|_| json!({})),
        "read_only_probe_delay_eq_resolution_delay": read_only_delays_equal,
        "read_only_timelock_delay_reconcile_pass": reconcile_pass_read_only,
        "timelock_delay_observability_as_meta": meta_equivalent,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn b173_obs_anchor_when_chain_off_unmounted() {
        let v = timelock_delay_meta_mirror_observability_b173(None, None).await;
        assert_eq!(
            v["anchor"],
            json!("173-GOVERNANCE-TIMELOCK-DELAY-META-MIRROR-OBS-V1")
        );
        assert_eq!(v["observation_note"], json!("chain_off_unmounted"));
    }
}
