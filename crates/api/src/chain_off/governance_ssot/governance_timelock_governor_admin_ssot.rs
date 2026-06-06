//! **`GovernanceTimelock.governor()` / `admin()`** 地址链上只读 SSOT（**TT-B110-SEQ9**）：**`GET /meta` `governance`**、**admin overview**、**indexer-reconcile** 并列巡检。
//!
//! **可变地址观测语义**：链上 **`admin` / `governor`** 可被治理交易改写；**`reconcile_probe`** 表示在 **`eth_call` → `latest`** 语义下**两次独立**双 getter 调用与第一次 resolution **字符串对拍**。**不**承诺与部署文档/环境变量快照长期恒等。

use serde_json::{json, Value as JsonValue};

use crate::chain::ChainConfig;
use crate::chain_off::ChainOffConfig;

#[derive(Debug, Clone)]
pub(crate) struct TimelockGovernorAdminResolution {
    pub source: &'static str,
    pub governance_timelock_governor_admin_chain_ssot: bool,
    pub timelock_governor_address: Option<String>,
    pub timelock_admin_address: Option<String>,
}

fn resolution_from_probe(
    cfg: &ChainOffConfig,
    probe: &crate::chain::timelock::TimelockGovernorAdminProbe,
) -> TimelockGovernorAdminResolution {
    if !cfg.governance_timelock_governor_admin_chain_ssot {
        return TimelockGovernorAdminResolution {
            source: "governance_timelock_governor_admin_ssot_disabled",
            governance_timelock_governor_admin_chain_ssot: false,
            timelock_governor_address: None,
            timelock_admin_address: None,
        };
    };    match probe.probe_leg {
        "eth_call_all_ok" => TimelockGovernorAdminResolution {
            source: "governance_ssot_chain_timelock_governor_admin",
            governance_timelock_governor_admin_chain_ssot: true,
            timelock_governor_address: probe.governor_address.clone(),
            timelock_admin_address: probe.admin_address.clone(),
        },
        _ => TimelockGovernorAdminResolution {
            source: "governance_ssot_chain_unavailable",
            governance_timelock_governor_admin_chain_ssot: true,
            timelock_governor_address: None,
            timelock_admin_address: None,
        },
    }
}

pub(crate) async fn timelock_governor_admin_resolution_for_meta(
    cfg: &ChainOffConfig,
    chain_config: Option<&ChainConfig>,
) -> TimelockGovernorAdminResolution {
    if !cfg.governance_timelock_governor_admin_chain_ssot {
        return TimelockGovernorAdminResolution {
            source: "governance_timelock_governor_admin_ssot_disabled",
            governance_timelock_governor_admin_chain_ssot: false,
            timelock_governor_address: None,
            timelock_admin_address: None,
        };
    };    let probe = crate::chain::timelock::probe_timelock_governor_admin_chain(chain_config).await;
    resolution_from_probe(cfg, &probe)
}

pub(crate) fn timelock_governor_admin_observability_value(
    res: &TimelockGovernorAdminResolution,
    chain_off_mounted: bool,
) -> JsonValue {
    json!({
        "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
        "chain_off_mounted": chain_off_mounted,
        "governance_timelock_governor_admin_chain_ssot": res.governance_timelock_governor_admin_chain_ssot,
        "source": res.source,
        "timelock_governor_address": res.timelock_governor_address,
        "timelock_admin_address": res.timelock_admin_address,
        "getter_note": "Solidity public governor / admin state variables → governor() / admin(); addresses may change on-chain",
        "rule": "Observability only; dual eth_call when GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT; reconcile_probe checks two-pass read consistency at latest; does not change GET /api/v1/orders*",
    })
}

pub(crate) fn timelock_governor_admin_reconcile_pass(
    cfg: &ChainOffConfig,
    resolution: &TimelockGovernorAdminResolution,
    probe: &crate::chain::timelock::TimelockGovernorAdminProbe,
) -> bool {
    if !cfg.governance_timelock_governor_admin_chain_ssot {
        return resolution.source == "governance_timelock_governor_admin_ssot_disabled";
    };    match probe.probe_leg {
        "eth_call_all_ok" => {
            resolution.source == "governance_ssot_chain_timelock_governor_admin"
                && resolution.timelock_governor_address == probe.governor_address
                && resolution.timelock_admin_address == probe.admin_address
        }
        "skipped_no_chain_config"
        | "skipped_rpc_unconfigured"
        | "skipped_no_timelock"
        | "eth_call_failed"
        | "eth_call_partial" => resolution.source == "governance_ssot_chain_unavailable",
        _ => false,
    }
}

pub(crate) fn merge_timelock_governor_admin_reconcile_probe_into_observability(
    mut obs: JsonValue,
    cfg: &ChainOffConfig,
    resolution: &TimelockGovernorAdminResolution,
    probe: crate::chain::timelock::TimelockGovernorAdminProbe,
) -> JsonValue {
    let pass = timelock_governor_admin_reconcile_pass(cfg, resolution, &probe);
    let tl_probe = serde_json::to_value(&probe).unwrap_or_else(|_| json!({}));
    let reconcile = json!({
        "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
        "pass": pass,
        "timelock_governor_admin_probe": tl_probe,
        "resolution_source": resolution.source,
        "rule": "Independent second eth_call governor()+admin() vs first leg resolution; on-chain roles are mutable — pass means read consistency between passes, not immutability vs off-chain config."
    });
    if let Some(o) = obs.as_object_mut() {
        o.insert("reconcile_probe".to_string(), reconcile);
    }
    obs
}

pub(crate) fn timelock_governor_admin_ssot_ops_check_value(
    chain_off_mounted: bool,
    cfg: &ChainOffConfig,
    resolution: &TimelockGovernorAdminResolution,
    probe: &crate::chain::timelock::TimelockGovernorAdminProbe,
) -> JsonValue {
    if !chain_off_mounted {
        return json!({
            "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
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
    };    let reconcile_pass = timelock_governor_admin_reconcile_pass(cfg, resolution, probe);
    let known_probe_leg = matches!(
        probe.probe_leg,
        "eth_call_all_ok"
            | "eth_call_failed"
            | "eth_call_partial"
            | "skipped_no_timelock"
            | "skipped_rpc_unconfigured"
            | "skipped_no_chain_config"
    );

    let governance_chain_read = if !cfg.governance_timelock_governor_admin_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT false"
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
                "detail": "governor()+admin() eth_call_all_ok; resolution matches second probe"
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

    let fallback_path = if !cfg.governance_timelock_governor_admin_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT false"
        })
    } else if probe.probe_leg == "eth_call_all_ok" {
        let ok = resolution.source == "governance_ssot_chain_timelock_governor_admin"
            && resolution.timelock_governor_address == probe.governor_address
            && resolution.timelock_admin_address == probe.admin_address;
        if ok {
            json!({ "status": "ok", "detail": "chain read ok; governance_ssot_chain_timelock_governor_admin active" })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_all_ok but resolution path does not match probe values"
            })
        }
    } else if resolution.source == "governance_ssot_chain_unavailable" {
        json!({
            "status": "ok",
            "detail": "governance_ssot_chain_unavailable matches failed/skipped/partial chain read"
        })
    } else {
        json!({
            "status": "fail",
            "detail": "expected governance_ssot_chain_unavailable when chain read did not yield all_ok"
        })
    };

    let reconcile_probe = if reconcile_pass {
        json!({ "status": "ok", "detail": "timelock_governor_admin_reconcile_pass true" })
    } else {
        json!({ "status": "fail", "detail": "timelock_governor_admin_reconcile_pass false" })
    };

    let chain_ok = chain_off_mounted;
    let degraded = cfg.governance_timelock_governor_admin_chain_ssot
        && probe.probe_leg != "eth_call_all_ok"
        && known_probe_leg
        && reconcile_pass;

    let checks_obj = json!({
        "chain_off_mounted": {
            "status": if chain_ok { "ok" } else { "fail" },
            "detail": "chain_off mounted for timelock governor/admin SSOT"
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
        "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
        "overall": overall,
        "exit_code_hint": exit_code_hint,
        "degraded": degraded,
        "checks": checks_obj,
        "rule": "Unified ops gate: chain_off + governance_chain_read + fallback_path + reconcile_probe; exit_code_hint 1 => investigate."
    })
}

pub(crate) async fn timelock_governor_admin_ssot_admin_overview_bundle(
    chain_off: Option<&crate::chain_off::ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> (JsonValue, JsonValue) {
    let Some(co) = chain_off else {
        let hint = json!({
            "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; timelock governor/admin SSOT admin hint unavailable"
        });
        let dummy_cfg = ChainOffConfig::default();
        let dummy_res = TimelockGovernorAdminResolution {
            source: "governance_timelock_governor_admin_ssot_disabled",
            governance_timelock_governor_admin_chain_ssot: false,
            timelock_governor_address: None,
            timelock_admin_address: None,
        };
        let dummy_probe = crate::chain::timelock::TimelockGovernorAdminProbe {
            probe_leg: "skipped_no_chain_config",
            governor_address: None,
            admin_address: None,
            detail: None,
        };
        let ops = timelock_governor_admin_ssot_ops_check_value(
            false,
            &dummy_cfg,
            &dummy_res,
            &dummy_probe,
        );
        return (hint, ops);
    }
    let res = timelock_governor_admin_resolution_for_meta(&co.config, chain_config).await;
    let probe = crate::chain::timelock::probe_timelock_governor_admin_chain(chain_config).await;
    let reconcile_pass = timelock_governor_admin_reconcile_pass(&co.config, &res, &probe);
    let hint = json!({
        "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
        "chain_off_mounted": true,
        "source": res.source,
        "governance_timelock_governor_admin_chain_ssot": res.governance_timelock_governor_admin_chain_ssot,
        "timelock_governor_address": res.timelock_governor_address,
        "timelock_admin_address": res.timelock_admin_address,
        "reconcile_probe_pass": reconcile_pass,
        "reconcile_probe_leg": probe.probe_leg,
        "rule": "Admin read-only; same SSOT paths as GET /meta governance.timelock_governor_admin_observability + reconcile_probe."
    });
    let ops = timelock_governor_admin_ssot_ops_check_value(true, &co.config, &res, &probe);
    (hint, ops)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seq9_reconcile_disabled_always_passes() {
        let cfg = ChainOffConfig {
            governance_timelock_governor_admin_chain_ssot: false,
            ..ChainOffConfig::default()
        };
        let res = TimelockGovernorAdminResolution {
            source: "governance_timelock_governor_admin_ssot_disabled",
            governance_timelock_governor_admin_chain_ssot: false,
            timelock_governor_address: None,
            timelock_admin_address: None,
        };
        let probe = crate::chain::timelock::TimelockGovernorAdminProbe {
            probe_leg: "eth_call_all_ok",
            governor_address: Some("0x1111111111111111111111111111111111111111".into()),
            admin_address: Some("0x2222222222222222222222222222222222222222".into()),
            detail: None,
        };
        assert!(timelock_governor_admin_reconcile_pass(&cfg, &res, &probe));
    }

    #[test]
    fn seq9_reconcile_ssot_ok_match() {
        let cfg = ChainOffConfig {
            governance_timelock_governor_admin_chain_ssot: true,
            ..ChainOffConfig::default()
        };
        let res = TimelockGovernorAdminResolution {
            source: "governance_ssot_chain_timelock_governor_admin",
            governance_timelock_governor_admin_chain_ssot: true,
            timelock_governor_address: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into()),
            timelock_admin_address: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
        };
        let probe = crate::chain::timelock::TimelockGovernorAdminProbe {
            probe_leg: "eth_call_all_ok",
            governor_address: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into()),
            admin_address: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
            detail: None,
        };
        assert!(timelock_governor_admin_reconcile_pass(&cfg, &res, &probe));
    }

    #[test]
    fn seq9_reconcile_ssot_mismatch_fails() {
        let cfg = ChainOffConfig {
            governance_timelock_governor_admin_chain_ssot: true,
            ..ChainOffConfig::default()
        };
        let res = TimelockGovernorAdminResolution {
            source: "governance_ssot_chain_timelock_governor_admin",
            governance_timelock_governor_admin_chain_ssot: true,
            timelock_governor_address: Some("0x1111111111111111111111111111111111111111".into()),
            timelock_admin_address: Some("0x2222222222222222222222222222222222222222".into()),
        };
        let probe = crate::chain::timelock::TimelockGovernorAdminProbe {
            probe_leg: "eth_call_all_ok",
            governor_address: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into()),
            admin_address: Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into()),
            detail: None,
        };
        assert!(!timelock_governor_admin_reconcile_pass(&cfg, &res, &probe));
    }
}
