//! **`TravelTrustGovernor.token()` / `timelock()`** 只读链上 SSOT（**TT-B110-SEQ11**）：**`immutable`** 引用地址；**`GET /meta` `governance`**、**admin overview**、**indexer-reconcile** 并列巡检。

use serde_json::{json, Value as JsonValue};

use super::ChainOffConfig;
use crate::chain::ChainConfig;

#[derive(Debug, Clone)]
pub(crate) struct GovernorTokenTimelockResolution {
    pub source: &'static str,
    pub governance_governor_token_timelock_chain_ssot: bool,
    pub token: Option<String>,
    pub timelock: Option<String>,
}

fn resolution_from_probe(
    cfg: &ChainOffConfig,
    probe: &crate::chain::governor::GovernorTokenTimelockProbe,
) -> GovernorTokenTimelockResolution {
    if !cfg.governance_governor_token_timelock_chain_ssot {
        return GovernorTokenTimelockResolution {
            source: "governance_governor_token_timelock_ssot_disabled",
            governance_governor_token_timelock_chain_ssot: false,
            token: None,
            timelock: None,
        };
    }
    match probe.probe_leg {
        "eth_call_all_ok" => GovernorTokenTimelockResolution {
            source: "governance_ssot_chain_governor_token_timelock",
            governance_governor_token_timelock_chain_ssot: true,
            token: probe.token.clone(),
            timelock: probe.timelock.clone(),
        },
        _ => GovernorTokenTimelockResolution {
            source: "governance_ssot_chain_unavailable",
            governance_governor_token_timelock_chain_ssot: true,
            token: None,
            timelock: None,
        },
    }
}

pub(crate) async fn governor_token_timelock_resolution_for_meta(
    cfg: &ChainOffConfig,
    chain_config: Option<&ChainConfig>,
) -> GovernorTokenTimelockResolution {
    let probe = crate::chain::governor::probe_governor_token_timelock_chain(chain_config).await;
    resolution_from_probe(cfg, &probe)
}

pub(crate) fn governor_token_timelock_observability_value(
    res: &GovernorTokenTimelockResolution,
    chain_off_mounted: bool,
) -> JsonValue {
    json!({
        "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
        "chain_off_mounted": chain_off_mounted,
        "governance_governor_token_timelock_chain_ssot": res.governance_governor_token_timelock_chain_ssot,
        "source": res.source,
        "token": res.token,
        "timelock": res.timelock,
        "getter_note": "Solidity immutable token/timelock → token() / timelock()",
        "rule": "Observability only; eth_call token()+timelock() when GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT; does not change GET /api/v1/orders*",
    })
}

pub(crate) fn governor_token_timelock_reconcile_pass(
    cfg: &ChainOffConfig,
    resolution: &GovernorTokenTimelockResolution,
    probe: &crate::chain::governor::GovernorTokenTimelockProbe,
) -> bool {
    if !cfg.governance_governor_token_timelock_chain_ssot {
        return resolution.source == "governance_governor_token_timelock_ssot_disabled";
    }
    match probe.probe_leg {
        "eth_call_all_ok" => {
            resolution.source == "governance_ssot_chain_governor_token_timelock"
                && resolution.token == probe.token
                && resolution.timelock == probe.timelock
        }
        "skipped_no_chain_config"
        | "skipped_rpc_unconfigured"
        | "skipped_no_governor"
        | "eth_call_partial" => resolution.source == "governance_ssot_chain_unavailable",
        _ => false,
    }
}

pub(crate) fn merge_governor_token_timelock_reconcile_probe_into_observability(
    mut obs: JsonValue,
    cfg: &ChainOffConfig,
    resolution: &GovernorTokenTimelockResolution,
    probe: crate::chain::governor::GovernorTokenTimelockProbe,
) -> JsonValue {
    let pass = governor_token_timelock_reconcile_pass(cfg, resolution, &probe);
    let p_probe = serde_json::to_value(&probe).unwrap_or_else(|_| json!({}));
    let reconcile = json!({
        "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
        "pass": pass,
        "governor_probe": p_probe,
        "resolution_source": resolution.source,
        "rule": "Independent second eth_call token()+timelock() vs first leg resolution; pass per GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT and probe_leg."
    });
    if let Some(o) = obs.as_object_mut() {
        o.insert("reconcile_probe".to_string(), reconcile);
    }
    obs
}

pub(crate) fn governor_token_timelock_ssot_ops_check_value(
    chain_off_mounted: bool,
    cfg: &ChainOffConfig,
    resolution: &GovernorTokenTimelockResolution,
    probe: &crate::chain::governor::GovernorTokenTimelockProbe,
) -> JsonValue {
    if !chain_off_mounted {
        return json!({
            "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
            "overall": "fail",
            "exit_code_hint": 1,
            "degraded": false,
            "checks": {
                "chain_off_mounted": { "status": "fail", "detail": "chain_off not mounted" },
                "governance_chain_read": { "status": "skipped", "detail": "chain_off_unmounted" },
                "fallback_path": { "status": "skipped", "detail": "chain_off_unmounted" },
                "reconcile_probe": { "status": "skipped", "detail": "chain_off_unmounted" }
            },
            "rule": "Ops gate: fail when chain_off unmounted."
        });
    }

    let reconcile_pass = governor_token_timelock_reconcile_pass(cfg, resolution, probe);
    let known_probe_leg = matches!(
        probe.probe_leg,
        "eth_call_all_ok" | "eth_call_partial"
            | "skipped_no_governor"
            | "skipped_rpc_unconfigured"
            | "skipped_no_chain_config"
    );

    let governance_chain_read = if !cfg.governance_governor_token_timelock_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT false"
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
                "detail": "token()+timelock() eth_call_all_ok; resolution matches second probe"
            })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_all_ok but resolution/probe mismatch (see reconcile_probe)"
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

    let fallback_path = if !cfg.governance_governor_token_timelock_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT false"
        })
    } else if probe.probe_leg == "eth_call_all_ok" {
        let ok = resolution.source == "governance_ssot_chain_governor_token_timelock"
            && resolution.token == probe.token
            && resolution.timelock == probe.timelock;
        if ok {
            json!({ "status": "ok", "detail": "chain read ok; governance_ssot_chain_governor_token_timelock active" })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_all_ok but resolution path does not match probe values"
            })
        }
    } else if resolution.source == "governance_ssot_chain_unavailable" {
        json!({
            "status": "ok",
            "detail": "expected governance_ssot_chain_unavailable when chain read did not yield all_ok"
        })
    } else {
        json!({
            "status": "fail",
            "detail": "unexpected resolution vs probe_leg"
        })
    };

    let reconcile_probe = if reconcile_pass {
        json!({ "status": "ok", "detail": "governor_token_timelock_reconcile_pass true" })
    } else {
        json!({ "status": "fail", "detail": "governor_token_timelock_reconcile_pass false" })
    };

    let chain_ok = chain_off_mounted;
    let degraded = cfg.governance_governor_token_timelock_chain_ssot
        && probe.probe_leg != "eth_call_all_ok"
        && known_probe_leg
        && reconcile_pass;

    let checks_obj = json!({
        "chain_off_mounted": {
            "status": if chain_ok { "ok" } else { "fail" },
            "detail": "chain_off mounted for governor token/timelock SSOT"
        },
        "governance_chain_read": governance_chain_read,
        "fallback_path": fallback_path,
        "reconcile_probe": reconcile_probe
    });

    let any_fail = !chain_ok
        || !reconcile_pass
        || governance_chain_read["status"] == json!("fail")
        || fallback_path["status"] == json!("fail");

    let overall = if any_fail { "fail" } else { "ok" };
    let exit_code_hint = if overall == "ok" { 0 } else { 1 };

    json!({
        "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
        "overall": overall,
        "exit_code_hint": exit_code_hint,
        "degraded": degraded,
        "checks": checks_obj,
        "rule": "Unified ops gate: chain_off + governance_chain_read + fallback_path + reconcile_probe; exit_code_hint 1 => investigate."
    })
}

pub(crate) async fn governor_token_timelock_ssot_admin_overview_bundle(
    chain_off: Option<&super::ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> (JsonValue, JsonValue) {
    let Some(co) = chain_off else {
        let hint = json!({
            "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governor token/timelock SSOT admin hint unavailable"
        });
        let dummy_cfg = ChainOffConfig::default();
        let dummy_res = GovernorTokenTimelockResolution {
            source: "governance_governor_token_timelock_ssot_disabled",
            governance_governor_token_timelock_chain_ssot: false,
            token: None,
            timelock: None,
        };
        let dummy_probe = crate::chain::governor::GovernorTokenTimelockProbe {
            probe_leg: "skipped_no_chain_config",
            token: None,
            timelock: None,
            detail: None,
        };
        let ops = governor_token_timelock_ssot_ops_check_value(false, &dummy_cfg, &dummy_res, &dummy_probe);
        return (hint, ops);
    };

    let res = governor_token_timelock_resolution_for_meta(&co.config, chain_config).await;
    let probe = crate::chain::governor::probe_governor_token_timelock_chain(chain_config).await;
    let reconcile_pass = governor_token_timelock_reconcile_pass(&co.config, &res, &probe);
    let hint = json!({
        "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
        "chain_off_mounted": true,
        "source": res.source,
        "governance_governor_token_timelock_chain_ssot": res.governance_governor_token_timelock_chain_ssot,
        "token": res.token,
        "timelock": res.timelock,
        "reconcile_probe_pass": reconcile_pass,
        "reconcile_probe_leg": probe.probe_leg,
        "rule": "Admin read-only; same SSOT paths as GET /meta governance.governor_token_timelock_observability + reconcile_probe."
    });
    let ops = governor_token_timelock_ssot_ops_check_value(true, &co.config, &res, &probe);
    (hint, ops)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seq11_reconcile_disabled_always_passes() {
        let cfg = ChainOffConfig {
            governance_governor_token_timelock_chain_ssot: false,
            ..ChainOffConfig::default()
        };
        let res = GovernorTokenTimelockResolution {
            source: "governance_governor_token_timelock_ssot_disabled",
            governance_governor_token_timelock_chain_ssot: false,
            token: None,
            timelock: None,
        };
        let probe = crate::chain::governor::GovernorTokenTimelockProbe {
            probe_leg: "eth_call_all_ok",
            token: Some("0x1".into()),
            timelock: Some("0x2".into()),
            detail: None,
        };
        assert!(governor_token_timelock_reconcile_pass(&cfg, &res, &probe));
    }

    #[test]
    fn seq11_reconcile_ssot_ok_match() {
        let cfg = ChainOffConfig {
            governance_governor_token_timelock_chain_ssot: true,
            ..ChainOffConfig::default()
        };
        let res = GovernorTokenTimelockResolution {
            source: "governance_ssot_chain_governor_token_timelock",
            governance_governor_token_timelock_chain_ssot: true,
            token: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into()),
            timelock: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
        };
        let probe = crate::chain::governor::GovernorTokenTimelockProbe {
            probe_leg: "eth_call_all_ok",
            token: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into()),
            timelock: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
            detail: None,
        };
        assert!(governor_token_timelock_reconcile_pass(&cfg, &res, &probe));
    }

    #[test]
    fn seq11_reconcile_ssot_mismatch_fails() {
        let cfg = ChainOffConfig {
            governance_governor_token_timelock_chain_ssot: true,
            ..ChainOffConfig::default()
        };
        let res = GovernorTokenTimelockResolution {
            source: "governance_ssot_chain_governor_token_timelock",
            governance_governor_token_timelock_chain_ssot: true,
            token: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into()),
            timelock: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
        };
        let probe = crate::chain::governor::GovernorTokenTimelockProbe {
            probe_leg: "eth_call_all_ok",
            token: Some("0xcccccccccccccccccccccccccccccccccccccccc".into()),
            timelock: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
            detail: None,
        };
        assert!(!governor_token_timelock_reconcile_pass(&cfg, &res, &probe));
    }
}
