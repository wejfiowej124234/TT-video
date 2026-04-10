//! **TT-B177**：**`ApiMetaState.chain_config`**（**`GET /meta` `chain`** 同源）与 **`GET …/governance/pool` `chain_alignment_hint`** **只读对读**；**不**改 **`GET /meta`** 响应形状；**不**进 **`compound_gate`**。

use chrono::Utc;
use serde_json::{json, Value};

use crate::state::ApiMetaState;

use super::pool_chain::pool_chain_alignment_hint;

/// **B-177** 观测壳：**可选** 挂 **`indexer-reconcile`**；**不**重复 **B-173** Timelock 镜像；**不**覆盖 **B-167** **`indexer.*`**。
pub async fn governance_pool_meta_chain_alignment_observability_b177(state: &ApiMetaState) -> Value {
    let observed_at = Utc::now().to_rfc3339();
    let hint = pool_chain_alignment_hint(state).await;

    let meta_chain_id = state
        .chain_config
        .as_ref()
        .map(|c| json!(c.chain_id))
        .unwrap_or(json!(null));
    let meta_fee_router = state
        .chain_config
        .as_ref()
        .and_then(|c| {
            c.fee_router_address
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .map(|s| json!(s))
        })
        .unwrap_or(json!(null));

    let pool_chain_id = hint.get("chain_id").cloned().unwrap_or(json!(null));
    let pool_fee_router = hint.get("fee_router_address").cloned().unwrap_or(json!(null));

    let read_only_chain_id_equal = meta_chain_id == pool_chain_id;
    let read_only_fee_router_equal = meta_fee_router == pool_fee_router;

    json!({
        "anchor": "177-GOVERNANCE-POOL-META-CHAIN-ALIGNMENT-OBS-V1",
        "schema_version": 1,
        "observed_at": observed_at,
        "getter_note": "meta_* legs from ApiMetaState.chain_config (same source as GET /meta chain); pool_* legs from pool_chain_alignment_hint (same builder as GET …/governance/pool).",
        "boundary_vs_b169_b176": "B-169～B-176 are indexer/matrix/governor-tail/Timelock-mirror shells; B-177 is governance pool vs meta chain identity alignment only.",
        "boundary_vs_b167": "B-167 covers GET /meta indexer.* 110/04 alignment; B-177 does not assert indexer subtree.",
        "boundary_vs_b173": "B-173 mirrors timelock_delay on reconcile; B-177 aligns pool chain_alignment_hint with meta chain_config only.",
        "meta_chain_id": meta_chain_id,
        "pool_chain_alignment_hint_chain_id": pool_chain_id,
        "read_only_chain_id_equal": read_only_chain_id_equal,
        "meta_fee_router_address": meta_fee_router,
        "pool_chain_alignment_hint_fee_router_address": pool_fee_router,
        "read_only_fee_router_address_equal": read_only_fee_router_equal,
        "chain_alignment_hint_chain_config_source": hint.get("chain_config_source").cloned().unwrap_or(json!(null)),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use serde_json::json;

    #[tokio::test]
    async fn b177_obs_anchor_and_chain_id_equal_without_config() {
        let st = api_meta_state(None);
        let v = governance_pool_meta_chain_alignment_observability_b177(&st).await;
        assert_eq!(
            v["anchor"],
            json!("177-GOVERNANCE-POOL-META-CHAIN-ALIGNMENT-OBS-V1")
        );
        assert_eq!(v["read_only_chain_id_equal"], json!(true));
        assert_eq!(v["read_only_fee_router_address_equal"], json!(true));
    }
}
