use serde_json::{json, Value as JsonValue};

use crate::chain::ChainConfig;
use crate::chain_off::{ChainOffConfig, ChainOffState};

use super::core::{
    proposal_count_reconcile_pass, proposal_count_resolution_for_meta, ProposalCountResolution,
};

pub(crate) fn proposal_count_observability_value(
    res: &ProposalCountResolution,
    chain_off_mounted: bool,
) -> JsonValue {
    json!({
        "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
        "chain_off_mounted": chain_off_mounted,
        "governance_governor_proposal_count_chain_ssot": res.governance_governor_proposal_count_chain_ssot,
        "source": res.source,
        "chain_proposal_count": res.chain_proposal_count,
        "projection_row_count": res.projection_row_count,
        "drift_leg": res.drift_leg,
        "max_indexer_lag_allowed": res.max_indexer_lag_allowed,
        "chain_minus_projection": res.chain_minus_projection,
        "getter_note": "Solidity public uint256 proposalCount → proposalCount(); mutable on-chain counter",
        "drift_rule": "chain_count >= projection_row_count expected under indexer lag; projection_ahead_of_chain or indexer_lag_exceeded fails ops when SSOT on; projection_unavailable omits compare",
        "rule": "Observability only; meta/admin/internal; does not change GET /api/v1/orders* or public governance proposals APIs",
    })
}

pub(crate) fn merge_proposal_count_reconcile_probe_into_observability(
    mut obs: JsonValue,
    cfg: &ChainOffConfig,
    resolution: &ProposalCountResolution,
    probe: crate::chain::governor::GovernorProposalCountProbe,
) -> JsonValue {
    let pass = proposal_count_reconcile_pass(cfg, resolution, &probe);
    let p_probe = serde_json::to_value(&probe).unwrap_or_else(|_| json!({}));
    let mutable_note = if !pass
        && probe.probe_leg == "eth_call_all_ok"
        && resolution.chain_proposal_count.is_some()
        && probe.proposal_count.is_some()
        && resolution.chain_proposal_count != probe.proposal_count
    {
        Some("mutable_counter_moved_between_passes")
    } else {
        None
    };    let reconcile = json!({
        "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
        "pass": pass,
        "governor_probe": p_probe,
        "resolution_source": resolution.source,
        "mutable_counter_note": mutable_note,
        "rule": "Second eth_call proposalCount() must match first resolution; inequality => pass false (tip moved between passes)."
    });
    if let Some(o) = obs.as_object_mut() {
        o.insert("reconcile_probe".to_string(), reconcile);
    }
    obs
}

pub(crate) fn proposal_count_ssot_ops_check_value(
    chain_off_mounted: bool,
    cfg: &ChainOffConfig,
    resolution: &ProposalCountResolution,
    probe: &crate::chain::governor::GovernorProposalCountProbe,
) -> JsonValue {
    if !chain_off_mounted {
        return json!({
            "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
            "overall": "fail",
            "exit_code_hint": 1,
            "degraded": false,
            "checks": {
                "chain_off_mounted": { "status": "fail", "detail": "chain_off not mounted" },
                "governance_chain_read": { "status": "skipped", "detail": "chain_off_unmounted" },
                "projection_drift": { "status": "skipped", "detail": "chain_off_unmounted" },
                "fallback_path": { "status": "skipped", "detail": "chain_off_unmounted" },
                "reconcile_probe": { "status": "skipped", "detail": "chain_off_unmounted" }
            },
            "rule": "Ops gate: fail when chain_off unmounted."
        });
    };    let reconcile_pass = proposal_count_reconcile_pass(cfg, resolution, probe);
    let known_probe_leg = matches!(
        probe.probe_leg,
        "eth_call_all_ok"
            | "eth_call_failed"
            | "skipped_no_governor"
            | "skipped_rpc_unconfigured"
            | "skipped_no_chain_config"
    );

    let governance_chain_read = if !cfg.governance_governor_proposal_count_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT false"
        })
    } else if !known_probe_leg {
        json!({
            "status": "fail",
            "detail": format!("unknown probe_leg={}", probe.probe_leg)
        })
    } else if probe.probe_leg == "eth_call_all_ok" {
        if reconcile_pass {
            json!({
                "status": "ok",
                "detail": "proposalCount() eth_call_all_ok; resolution matches second probe"
            })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_all_ok but resolution/probe mismatch (mutable counter moved or resolution bug; see reconcile_probe.mutable_counter_note)"
            })
        }
    } else if reconcile_pass {
        json!({
            "status": "degraded",
            "detail": format!(
                "probe_leg={}; chain unavailable while reconcile still passes (unavailable path)",
                probe.probe_leg
            )
        })
    } else {
        json!({
            "status": "fail",
            "detail": format!(
                "probe_leg={}; resolution/probe mismatch (see reconcile_probe)",
                probe.probe_leg
            )
        })
    };

    let projection_drift = if !cfg.governance_governor_proposal_count_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT false"
        })
    } else if resolution.source == "governance_ssot_chain_unavailable" {
        json!({
            "status": "skipped",
            "detail": "chain read unavailable; drift vs projection not evaluated"
        })
    } else {
        match resolution.drift_leg {
            "projection_unavailable" => json!({
                "status": "skipped",
                "detail": "no PgPool or business_chain_id or COUNT failed; drift leg projection_unavailable"
            }),
            "aligned" => json!({
                "status": "ok",
                "detail": "chain proposalCount matches projection row count"
            }),
            "indexer_lag_ok" => json!({
                "status": "degraded",
                "detail": format!(
                    "indexer lag within max (chain_minus_projection={:?}, max={})",
                    resolution.chain_minus_projection,
                    cfg.governance_proposal_count_max_indexer_lag
                )
            }),
            "indexer_lag_exceeded" | "projection_ahead_of_chain" | "parse_or_compare_failed" => {
                json!({
                    "status": "fail",
                    "detail": format!("drift_leg={}", resolution.drift_leg)
                })
            }
            "observation_disabled" => json!({
                "status": "skipped",
                "detail": "SSOT disabled"
            }),
            _ => json!({
                "status": "fail",
                "detail": format!("unknown drift_leg={}", resolution.drift_leg)
            }),
        }
    };
    let fallback_path = if !cfg.governance_governor_proposal_count_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT false"
        })
    } else if probe.probe_leg == "eth_call_all_ok" {
        let ok = resolution.source == "governance_ssot_chain_governor_proposal_count"
            && resolution.chain_proposal_count == probe.proposal_count;
        if ok {
            json!({ "status": "ok", "detail": "chain read ok; governance_ssot_chain_governor_proposal_count active" })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_all_ok but resolution path does not match probe values"
            })
        }
    } else if resolution.source == "governance_ssot_chain_unavailable" {
        json!({
            "status": "ok",
            "detail": "governance_ssot_chain_unavailable matches failed/skipped chain read"
        })
    } else {
        json!({
            "status": "fail",
            "detail": "expected governance_ssot_chain_unavailable when chain read did not yield all_ok"
        })
    };

    let reconcile_probe = if reconcile_pass {
        json!({ "status": "ok", "detail": "proposal_count_reconcile_pass true" })
    } else {
        json!({ "status": "fail", "detail": "proposal_count_reconcile_pass false" })
    };

    let chain_ok = chain_off_mounted;
    let degraded = cfg.governance_governor_proposal_count_chain_ssot
        && (projection_drift["status"] == json!("degraded")
            || (probe.probe_leg != "eth_call_all_ok" && known_probe_leg && reconcile_pass));

    let any_fail = !chain_ok
        || !reconcile_pass
        || governance_chain_read["status"] == json!("fail")
        || fallback_path["status"] == json!("fail")
        || projection_drift["status"] == json!("fail");

    let overall = if any_fail { "fail" } else { "ok" };
    let exit_code_hint = if overall == "ok" { 0 } else { 1 };

    let checks_obj = json!({
        "chain_off_mounted": {
            "status": if chain_ok { "ok" } else { "fail" },
            "detail": "chain_off mounted for governor proposal count SSOT"
        },
        "governance_chain_read": governance_chain_read,
        "projection_drift": projection_drift,
        "fallback_path": fallback_path,
        "reconcile_probe": reconcile_probe
    });

    json!({
        "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
        "overall": overall,
        "exit_code_hint": exit_code_hint,
        "degraded": degraded,
        "checks": checks_obj,
        "rule": "Unified ops gate: chain_off + governance_chain_read + projection_drift + fallback_path + reconcile_probe; indexer_lag_ok is degraded only, not fail."
    })
}

pub(crate) async fn proposal_count_ssot_admin_overview_bundle(
    chain_off: Option<&ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> (JsonValue, JsonValue) {
    let Some(co) = chain_off else {
        let hint = json!({
            "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governor proposal count SSOT admin hint unavailable"
        });
        let dummy_cfg = ChainOffConfig::default();
        let dummy_res = ProposalCountResolution {
            source: "governance_governor_proposal_count_ssot_disabled",
            governance_governor_proposal_count_chain_ssot: false,
            chain_proposal_count: None,
            projection_row_count: None,
            drift_leg: "observation_disabled",
            max_indexer_lag_allowed: 32,
            chain_minus_projection: None,
        };
        let dummy_probe = crate::chain::governor::GovernorProposalCountProbe {
            probe_leg: "skipped_no_chain_config",
            proposal_count: None,
            detail: None,
        };
        let ops = proposal_count_ssot_ops_check_value(false, &dummy_cfg, &dummy_res, &dummy_probe);
        return (hint, ops);
    }
    let db_pool = co.db_pool.as_ref();
    let res = proposal_count_resolution_for_meta(&co.config, chain_config, db_pool).await;
    let probe = crate::chain::governor::probe_governor_proposal_count_chain(chain_config).await;
    let reconcile_pass = proposal_count_reconcile_pass(&co.config, &res, &probe);
    let hint = json!({
        "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
        "chain_off_mounted": true,
        "source": res.source,
        "governance_governor_proposal_count_chain_ssot": res.governance_governor_proposal_count_chain_ssot,
        "chain_proposal_count": res.chain_proposal_count,
        "projection_row_count": res.projection_row_count,
        "drift_leg": res.drift_leg,
        "max_indexer_lag_allowed": res.max_indexer_lag_allowed,
        "chain_minus_projection": res.chain_minus_projection,
        "reconcile_probe_pass": reconcile_pass,
        "reconcile_probe_leg": probe.probe_leg,
        "rule": "Admin read-only; same SSOT paths as GET /meta governance.governor_proposal_count_observability + reconcile_probe."
    });
    let ops = proposal_count_ssot_ops_check_value(true, &co.config, &res, &probe);
    (hint, ops)
}
