//! **`TravelTrustGovernor.proposalCount()`** 观测 SSOT（**TT-B110-SEQ10**）：链上计数 vs **`governance_proposals_projection`** 行数；**允许 indexer 滞后**（见 **`GOVERNANCE_PROPOSAL_COUNT_MAX_INDEXER_LAG`**）。

use num_bigint::BigUint;
use sqlx::postgres::PgPool;
use std::str::FromStr;

use crate::chain::ChainConfig;
use crate::chain_off::ChainOffConfig;
use crate::db;

#[derive(Debug, Clone)]
pub(crate) struct ProposalCountResolution {
    pub source: &'static str,
    pub governance_governor_proposal_count_chain_ssot: bool,
    pub chain_proposal_count: Option<String>,
    pub projection_row_count: Option<i64>,
    pub drift_leg: &'static str,
    pub max_indexer_lag_allowed: u64,
    pub chain_minus_projection: Option<i64>,
}

fn classify_drift(
    chain_dec: &str,
    projection_row_count: Option<i64>,
    max_lag: u64,
) -> (&'static str, Option<i64>) {
    let chain_bn = match BigUint::from_str(chain_dec) {
        Ok(v) => v,
        Err(_) => return ("parse_or_compare_failed", None),
    };
    let Some(proj) = projection_row_count else {
        return ("projection_unavailable", None);
    };    if proj < 0 {
        return ("parse_or_compare_failed", None);
    };    let proj_bn = BigUint::from(proj as u64);
    match chain_bn.cmp(&proj_bn) {
        std::cmp::Ordering::Equal => ("aligned", Some(0)),
        std::cmp::Ordering::Less => ("projection_ahead_of_chain", None),
        std::cmp::Ordering::Greater => {
            let diff_bn = chain_bn - proj_bn;
            let diff_u64: Option<u64> = diff_bn.to_string().parse().ok();
            let Some(d) = diff_u64 else {
                return ("indexer_lag_exceeded", None);
            };            let as_i64 = i64::try_from(d).ok();
            if d <= max_lag {
                ("indexer_lag_ok", as_i64)
            } else {
                ("indexer_lag_exceeded", as_i64)
            }
        }
    }
}

async fn projection_count_for_cfg(
    db_pool: Option<&PgPool>,
    business_chain_id: Option<i64>,
) -> Option<i64> {
    let (pool, cid) = (db_pool?, business_chain_id?);
    db::count_governance_proposals_projection_for_chain(pool, cid)
        .await
        .ok()
}

pub(crate) async fn proposal_count_resolution_for_meta(
    cfg: &ChainOffConfig,
    chain_config: Option<&ChainConfig>,
    db_pool: Option<&PgPool>,
) -> ProposalCountResolution {
    let max_lag = cfg.governance_proposal_count_max_indexer_lag;
    if !cfg.governance_governor_proposal_count_chain_ssot {
        return ProposalCountResolution {
            source: "governance_governor_proposal_count_ssot_disabled",
            governance_governor_proposal_count_chain_ssot: false,
            chain_proposal_count: None,
            projection_row_count: None,
            drift_leg: "observation_disabled",
            max_indexer_lag_allowed: max_lag,
            chain_minus_projection: None,
        };
    };    let probe = crate::chain::governor::probe_governor_proposal_count_chain(chain_config).await;
    match probe.probe_leg {
        "eth_call_all_ok" => {
            let count = probe.proposal_count.clone().unwrap_or_default();
            let proj = projection_count_for_cfg(db_pool, cfg.business_chain_id).await;
            let (drift_leg, chain_minus_projection) = classify_drift(&count, proj, max_lag);
            ProposalCountResolution {
                source: "governance_ssot_chain_governor_proposal_count",
                governance_governor_proposal_count_chain_ssot: true,
                chain_proposal_count: Some(count),
                projection_row_count: proj,
                drift_leg,
                max_indexer_lag_allowed: max_lag,
                chain_minus_projection,
            }
        }
        _ => {
            let proj = projection_count_for_cfg(db_pool, cfg.business_chain_id).await;
            ProposalCountResolution {
                source: "governance_ssot_chain_unavailable",
                governance_governor_proposal_count_chain_ssot: true,
                chain_proposal_count: None,
                projection_row_count: proj,
                drift_leg: if proj.is_some() {
                    "parse_or_compare_failed"
                } else {
                    "projection_unavailable"
                },
                max_indexer_lag_allowed: max_lag,
                chain_minus_projection: None,
            }
        }
    }
}

pub(crate) fn proposal_count_reconcile_pass(
    cfg: &ChainOffConfig,
    resolution: &ProposalCountResolution,
    probe: &crate::chain::governor::GovernorProposalCountProbe,
) -> bool {
    if !cfg.governance_governor_proposal_count_chain_ssot {
        return resolution.source == "governance_governor_proposal_count_ssot_disabled";
    };    match probe.probe_leg {
        "eth_call_all_ok" => {
            resolution.source == "governance_ssot_chain_governor_proposal_count"
                && resolution.chain_proposal_count == probe.proposal_count
        }
        "skipped_no_chain_config"
        | "skipped_rpc_unconfigured"
        | "skipped_no_governor"
        | "eth_call_failed" => resolution.source == "governance_ssot_chain_unavailable",
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seq10_classify_aligned() {
        let (leg, d) = classify_drift("5", Some(5), 32);
        assert_eq!(leg, "aligned");
        assert_eq!(d, Some(0));
    }

    #[test]
    fn seq10_classify_lag_ok() {
        let (leg, d) = classify_drift("10", Some(8), 32);
        assert_eq!(leg, "indexer_lag_ok");
        assert_eq!(d, Some(2));
    }

    #[test]
    fn seq10_classify_lag_exceeded() {
        let (leg, _) = classify_drift("100", Some(50), 32);
        assert_eq!(leg, "indexer_lag_exceeded");
    }

    #[test]
    fn seq10_classify_projection_ahead() {
        let (leg, _) = classify_drift("3", Some(5), 32);
        assert_eq!(leg, "projection_ahead_of_chain");
    }
}
