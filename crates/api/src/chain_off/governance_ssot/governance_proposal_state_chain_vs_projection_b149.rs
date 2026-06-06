//! **TT-B149**：**`TravelTrustGovernor.state(uint256)`** vs **`governance_proposals_projection.chain_state`**
//! 只读对拍（**非** **B-172** **`proposalCount()`** 尾部轴）。

use chrono::Utc;
use serde_json::{json, Value};

use crate::chain::governor::{eth_call_governor_state, governor_state_label};
use crate::chain::ChainConfig;
use crate::db;

use crate::chain_off::ChainOffState;

/// 默认最多抽样 **`eth_call`** 次数（降序 **`proposal_id`**），避免 reconcile 风暴。
const DEFAULT_SAMPLE_CAP: i64 = 12;

/// 投影 **`chain_state`**（事件驱动粗粒度）与链上 **`state()`** 语义对拍。
///
/// - **`pending`**：投影未收到 **Queued/Executed/Canceled** 前保持 **`pending`**；链上可为 **`pending`/`active`/`defeated`/`succeeded`** → **粗对齐**。
/// - **`queued`/`executed`/`canceled`**：须与链上同名终态一致（**`queued`** 链上仍可能 **`executed`** 若投影滞后 → 记 **drift**）。
pub fn classify_projection_chain_state_vs_governor_label(
    projection_chain_state: Option<&str>,
    chain_label: &str,
) -> &'static str {
    let p_norm = projection_chain_state
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_lowercase());

    match p_norm.as_deref() {
        None => "projection_chain_state_null_or_empty",
        Some("pending") => {
            if matches!(chain_label, "pending" | "active" | "defeated" | "succeeded") {
                "aligned_coarse_pending_bucket"
            } else if matches!(chain_label, "queued" | "executed" | "canceled") {
                "drift_projection_pending_chain_post_vote_or_terminal"
            } else {
                "unknown_chain_state"
            }
        }
        Some("queued") => {
            if chain_label == "queued" {
                "aligned"
            } else if chain_label == "executed" {
                "drift_projection_queued_chain_executed"
            } else {
                "drift"
            }
        }
        Some("executed") => {
            if chain_label == "executed" {
                "aligned"
            } else {
                "drift"
            }
        }
        Some("canceled") => {
            if chain_label == "canceled" {
                "aligned"
            } else {
                "drift"
            }
        }
        Some(other) => {
            if other == chain_label {
                "aligned_exact"
            } else {
                "drift_unknown_projection_label"
            }
        }
    }
}

fn comparison_is_drift(comparison: &str) -> bool {
    comparison.starts_with("drift")
}

/// **B-149** 观测壳：**不**参与 compound gate；**不**混用 **B-172** 尾部计数。
pub async fn governor_proposal_state_chain_vs_projection_observability_b149(
    chain_off: Option<&ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> Value {
    let observed_at = Utc::now().to_rfc3339();

    let Some(co) = chain_off else {
        return json!({
            "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "observation_note": "chain_off_unmounted",
            "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        });
    };    let Some(business_chain_id) = co.config.business_chain_id else {
        return json!({
            "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "observation_note": "business_chain_id_unset",
            "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        });
    };    let Some(pool) = co.db_pool.as_ref() else {
        return json!({
            "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "governance_business_chain_id": business_chain_id,
            "observation_note": "database_pool_unavailable",
            "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        });
    };
    let Some(c) = chain_config else {
        return json!({
            "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "governance_business_chain_id": business_chain_id,
            "observation_note": "chain_config_unmounted",
            "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        });
    };    if !c.is_configured() {
        return json!({
            "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "governance_business_chain_id": business_chain_id,
            "observation_note": "rpc_unconfigured",
            "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        });
    };    let Some(gov) = c
        .governor_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    else {
        return json!({
            "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
            "schema_version": 1,
            "observed_at": observed_at,
            "governance_business_chain_id": business_chain_id,
            "observation_note": "governor_address_unset",
            "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        });
    };
    let rows = match db::list_governance_proposals_for_chain(
        pool,
        business_chain_id,
        DEFAULT_SAMPLE_CAP,
    )
    .await
    {
        Ok(r) => r,
        Err(e) => {
            return json!({
                "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
                "schema_version": 1,
                "observed_at": observed_at,
                "governance_business_chain_id": business_chain_id,
                "observation_note": "list_governance_proposals_failed",
                "error": e.to_string(),
                "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
            });
        }
    };
    let rpc = c.rpc_url.trim();
    let mut items: Vec<Value> = Vec::new();
    let mut drift_rows = 0_i64;
    let mut eth_call_failures = 0_i64;

    for row in rows {
        let pid = row.proposal_id.clone();
        match eth_call_governor_state(rpc, gov, pid.as_str()).await {
            Ok(u) => {
                let label = governor_state_label(u);
                let cmp = classify_projection_chain_state_vs_governor_label(
                    row.chain_state.as_deref(),
                    label,
                );
                if comparison_is_drift(cmp) {
                    drift_rows += 1;
                }
                items.push(json!({
                    "proposal_id": pid,
                    "projection_chain_state": row.chain_state,
                    "chain_state_uint8": u,
                    "chain_state_label": label,
                    "comparison": cmp,
                    "eth_call_error": Value::Null,
                }));
            }
            Err(e) => {
                eth_call_failures += 1;
                items.push(json!({
                    "proposal_id": pid,
                    "projection_chain_state": row.chain_state,
                    "chain_state_uint8": Value::Null,
                    "chain_state_label": Value::Null,
                    "comparison": "eth_call_skipped",
                    "eth_call_error": e,
                }));
            }
        }
    }

    json!({
        "anchor": "149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1",
        "schema_version": 1,
        "observed_at": observed_at,
        "governance_business_chain_id": business_chain_id,
        "getter_note": "TravelTrustGovernor.state(uint256) vs governance_proposals_projection.chain_state; pending projection aligns coarsely with pre-queue on-chain states",
        "boundary_vs_b172": "B-149 is per-proposal state(uint256) vs projection.chain_state; B-172 is proposalCount vs projection tail only.",
        "sample_limit_applied": DEFAULT_SAMPLE_CAP,
        "rows_sampled": items.len() as i64,
        "read_only_drift_rows": drift_rows,
        "eth_call_failures": eth_call_failures,
        "items": items,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b149_pending_covers_active_and_defeated() {
        assert_eq!(
            classify_projection_chain_state_vs_governor_label(Some("pending"), "active"),
            "aligned_coarse_pending_bucket"
        );
        assert_eq!(
            classify_projection_chain_state_vs_governor_label(Some("pending"), "queued"),
            "drift_projection_pending_chain_post_vote_or_terminal"
        );
    }

    #[test]
    fn b149_queued_vs_executed_is_drift() {
        assert_eq!(
            classify_projection_chain_state_vs_governor_label(Some("queued"), "executed"),
            "drift_projection_queued_chain_executed"
        );
    }

    #[test]
    fn b149_executed_must_match() {
        assert_eq!(
            classify_projection_chain_state_vs_governor_label(Some("executed"), "executed"),
            "aligned"
        );
        assert_eq!(
            classify_projection_chain_state_vs_governor_label(Some("executed"), "queued"),
            "drift"
        );
    }

    #[tokio::test]
    async fn b149_obs_anchor_when_chain_off_unmounted() {
        let v = governor_proposal_state_chain_vs_projection_observability_b149(None, None).await;
        assert_eq!(
            v["anchor"],
            json!("149-GOVERNOR-PROPOSAL-STATE-VS-PROJECTION-V1")
        );
        assert_eq!(v["observation_note"], json!("chain_off_unmounted"));
    }
}
