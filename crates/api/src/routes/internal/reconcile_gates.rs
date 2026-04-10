//! Reconcile / compound gate JSON helpers (`indexer-reconcile` SSOT).
use serde_json::{json, Value};

use crate::db;

/// **`POST …/internal/indexer-reconcile`**：机读 **`pass`/`breakdown`** + **`human_summary`**（探针/`jq` 门禁）；**仅**写入 **`persist` `summary`**（**B-117**：**`200`** 根级 **`orders_projection_reconcile_gate`** 须自该 **`summary`** 子树取出，**禁止**平行再组）。
pub(crate) fn orders_projection_reconcile_gate(
    stats: &db::OrdersProjectionReconcileStats,
) -> Value {
    let pass = stats.projection_reconcile_clean;
    let human = format!(
        "issues_total={} projection_reconcile_clean={}; missing_projection={} status_mismatch={} escrow_mismatch={} orphan_projections={} malformed_projection_order_id_bytes={}; matched={} orders_with_escrow={} projection_rows_chain={}",
        stats.issues_total,
        pass,
        stats.missing_projection,
        stats.status_mismatch,
        stats.escrow_mismatch,
        stats.orphan_projections,
        stats.malformed_projection_order_id_bytes,
        stats.matched,
        stats.orders_with_escrow,
        stats.projection_rows_chain,
    );
    json!({
        "anchor": "110-ORDERS-PROJECTION-RECONCILE-GATE",
        "pass": pass,
        "issues_total": stats.issues_total,
        "projection_reconcile_clean": pass,
        "breakdown": {
            "missing_projection": stats.missing_projection,
            "status_mismatch": stats.status_mismatch,
            "escrow_mismatch": stats.escrow_mismatch,
            "orphan_projections": stats.orphan_projections,
            "malformed_projection_order_id_bytes": stats.malformed_projection_order_id_bytes,
            "matched": stats.matched,
            "orders_with_escrow": stats.orders_with_escrow,
            "projection_rows_chain": stats.projection_rows_chain,
        },
        "human_summary": human,
    })
}

/// **B-117 / TT-B117**：**`persist:true`** 落库的 **`reconciliation_reports.summary`** 与 **`200`** 根级 **`orders_projection_reconcile_gate`** **同一份** JSON；成功体该键**仅**允许自本函数从已组装完毕的 **`summary`** 读取（**无**第二套 **`orders_projection_reconcile_gate(...)`** 调用）。
pub(crate) fn indexer_reconcile_orders_projection_gate_from_persist_summary(
    summary: &Value,
) -> Value {
    summary
        .get("orders_projection_reconcile_gate")
        .expect("indexer-reconcile persist summary must include orders_projection_reconcile_gate")
        .clone()
}

/// **B-110 · SSOT-04**：对 **`ssot_parallel_chain_snapshot`** 体（与 **`GET …/governance/pool`** **`chain_alignment_hint`** 内 **同形**）做 **可读性**观测。
/// **`pass`** = 三腿均 **`read_status":"ok"`**；**不**写入 **`reconcile_compound_pass`**，**不**表示订单/池业务真值。
/// **`region_vault_erc20_balance_read_ok`** 仅表示 **B110-SSOT-03 并行观测腿**可读，**非** **`GET …/governance/pool`** 根级 **`country_pool`** 主读（后者由 **`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`** + 根字段 **`country_pool_*`** 表达；**TT-SSOT-SWITCH-APPLY-001**）。
/// **`governance_treasury_native_balance_read_ok`** 仅表示 **B110-SSOT-03 并行观测腿**可读，**非** 根级 **`treasury_pool*`** 主读（后者由 **`GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT`** + 根字段 **`treasury_pool_*`** 表达；**TT-SSOT-SWITCH-APPLY-002**）。
pub(crate) fn ssot_parallel_chain_snapshot_gate(snapshot: &Value) -> Value {
    let leg_ok = |key: &str| -> bool {
        snapshot
            .get(key)
            .and_then(|v| v.as_object())
            .and_then(|o| o.get("read_status"))
            .and_then(|x| x.as_str())
            == Some("ok")
    };
    let fr = leg_ok("fee_router_erc20_balance_read");
    // 并行快照 GovernanceTreasury 原生 Wei 腿；与根级 `treasury_pool*` SSOT（governance/pool 体）门禁无关。
    let tr = leg_ok("governance_treasury_native_balance_read");
    // 并行快照 RegionVault 腿；与根级 `country_pool` SSOT（governance/pool 体）门禁无关。
    let rv = leg_ok("region_vault_erc20_balance_read");
    let readable = [fr, tr, rv].iter().filter(|x| **x).count();
    let pattern = match readable {
        3 => "all_readable",
        0 => "none_readable",
        _ => "partial_readable",
    };
    let pass = readable == 3;
    let human = format!(
        "ssot_parallel_chain_snapshot_gate legs_ok={}/3 pattern={} fee_router_erc20={} treasury_native={} region_vault_erc20={}; B110-SSOT-04 observability only; not compound_gate",
        readable, pattern, fr, tr, rv
    );
    json!({
        "anchor": "B110-SSOT-04-PARALLEL-CHAIN-SNAPSHOT-GATE",
        "pass": pass,
        "pattern": pattern,
        "readable_legs": readable,
        "legs": {
            "fee_router_erc20_balance_read_ok": fr,
            "governance_treasury_native_balance_read_ok": tr,
            "region_vault_erc20_balance_read_ok": rv
        },
        "human_summary": human,
        "note": "Does not affect indexer_reconcile_compound_pass; not governance pool main SSOT"
    })
}

/// **B-101 / TT-B101-INDEXER-RECONCILE-COMPOUND-PASS-FROM-BREAKDOWN-001**：根级 **`indexer_reconcile_compound_gate.pass`** 与 **`reconcile_compound_pass`** 的**唯一**语义 — **`breakdown`** 内凡 **`participates: true`** 的子对象，其 **`pass`** 须**全部为 true**（AND）；**`participates: false`** 或缺省为不参战（对 AND 为中性真）。
///
/// 与 **`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.3.1** 一致；**禁止**在 handler 内另写平行布尔式。
pub(crate) fn indexer_reconcile_compound_pass_from_breakdown(
    breakdown: &serde_json::Map<String, Value>,
) -> bool {
    breakdown.values().all(|branch| {
        let participates = branch
            .get("participates")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        if !participates {
            return true;
        }
        branch.get("pass").and_then(|v| v.as_bool()).unwrap_or(false)
    })
}

/// **B-101 / TT-121**：在 **`orders_projection_reconcile_gate`** 之上，将本次请求**实际产生**的可判定对账信号 **AND** 为单一根级门禁（**`pass`**）。
///
/// 返回 **`(reconcile_compound_pass, gate_json)`**：**`reconcile_compound_pass`** 与 **`gate_json["pass"]`** 恒等于 **`indexer_reconcile_compound_pass_from_breakdown(&breakdown)`**（单点算出，**无** `parts` 平行向量）。
///
/// 语义钉死见 **`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.3.1** 与 **04 §3.4** **`indexer-reconcile`** 行。
///
/// **`orders_deadline_ssot_reconcile_branch`**（**TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001**）：**`None`** 时写入 **`breakdown.orders_deadline_ssot_reconcile`** **`participates:false`**（单测/缺省）；**`handler`** 传入 **预组装** 子对象（须含 **`participates`** / **`pass`** / **`anchor_child`**=`B110-SEQ3-ORDERS-DEADLINE-SSOT-RECONCILE`）。
///
/// **`governor_view_params_ssot_reconcile_branch`**（**TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001**）：**`None`** 时 **`breakdown.governor_view_params_ssot_reconcile`** **`participates:false`**；**`handler`** 传入 **`anchor_child`**=`B110-SEQ5-GOVERNOR-VIEW-PARAMS-SSOT-RECONCILE`。
///
/// **`timelock_delay_ssot_reconcile_branch`**（**TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001**）：**`None`** 时 **`breakdown.timelock_delay_ssot_reconcile`** **`participates:false`**；**`handler`** 传入 **`anchor_child`**=`B110-SEQ6-TIMELOCK-DELAY-SSOT-RECONCILE`。
///
/// **`governor_proposal_threshold_ssot_reconcile_branch`**（**TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001**）：**`None`** 时 **`breakdown.governor_proposal_threshold_ssot_reconcile`** **`participates:false`**；**`handler`** 传入 **`anchor_child`**=`B110-SEQ8-GOVERNOR-PROPOSAL-THRESHOLD-SSOT-RECONCILE`。
///
/// **`timelock_governor_admin_ssot_reconcile_branch`**（**TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001**）：**`None`** 时 **`breakdown.timelock_governor_admin_ssot_reconcile`** **`participates:false`**；**`handler`** 传入 **`anchor_child`**=`B110-SEQ9-TIMELOCK-GOVERNOR-ADMIN-SSOT-RECONCILE`。
///
/// **`governor_proposal_count_ssot_reconcile_branch`**（**TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001**）：**`None`** 时 **`breakdown.governor_proposal_count_ssot_reconcile`** **`participates:false`**；**`handler`** 传入 **`anchor_child`**=`B110-SEQ10-GOVERNOR-PROPOSAL-COUNT-SSOT-RECONCILE`。
///
/// **`governor_token_timelock_ssot_reconcile_branch`**（**TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001**）：**`None`** 时 **`breakdown.governor_token_timelock_ssot_reconcile`** **`participates:false`**；**`handler`** 传入 **`anchor_child`**=`B110-SEQ11-GOVERNOR-TOKEN-TIMELOCK-SSOT-RECONCILE`。
pub(crate) fn indexer_reconcile_compound_gate(
    orders_gate: &Value,
    rpc_requested: bool,
    rpc_skip_reason: Option<&str>,
    rpc_samples: Option<&[Value]>,
    event_log_coverage_requested: bool,
    event_log_coverage: Option<&Value>,
    fee_router_verify: Option<&Value>,
    region_vault_verify: Option<&Value>,
    chain_observation: Option<&Value>,
    orders_deadline_ssot_reconcile_branch: Option<Value>,
    governor_view_params_ssot_reconcile_branch: Option<Value>,
    governor_token_timelock_ssot_reconcile_branch: Option<Value>,
    timelock_delay_ssot_reconcile_branch: Option<Value>,
    governor_proposal_threshold_ssot_reconcile_branch: Option<Value>,
    timelock_governor_admin_ssot_reconcile_branch: Option<Value>,
    governor_proposal_count_ssot_reconcile_branch: Option<Value>,
) -> (bool, Value) {
    let orders_pass = orders_gate
        .get("pass")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let mut breakdown = serde_json::Map::new();

    breakdown.insert(
        "orders_projection".to_string(),
        json!({
            "participates": true,
            "pass": orders_pass,
            "anchor_child": "110-ORDERS-PROJECTION-RECONCILE-GATE",
        }),
    );

    // rpc_escrow_samples：仅在实际拉样（未 skipped）时参与 AND
    let rpc_branch = if !rpc_requested {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_requested",
        })
    } else if rpc_skip_reason.is_some() {
        json!({
            "participates": false,
            "pass": true,
            "state": "skipped_not_configured",
            "reason": rpc_skip_reason,
        })
    } else if let Some(samples) = rpc_samples {
        let all_aligned = samples.iter().all(|s| {
            s.get("coarse_terminal_aligned")
                .and_then(|v| v.as_bool())
                .unwrap_or(false)
        });
        json!({
            "participates": true,
            "pass": all_aligned,
            "state": "rpc_samples_evaluated",
            "samples_count": samples.len(),
        })
    } else {
        json!({
            "participates": false,
            "pass": true,
            "state": "no_samples_branch",
        })
    };
    breakdown.insert("rpc_escrow_samples".to_string(), rpc_branch);

    // event_log_escrow_coverage：请求且成功返回体时参与，当前仅为观测计数（不引入阈值），**pass 恒 true**
    let ev_branch = if !event_log_coverage_requested {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_requested",
        })
    } else if event_log_coverage.is_some() {
        json!({
            "participates": true,
            "pass": true,
            "state": "observational_counts",
            "rule": "B101_EVENT_LOG_COVERAGE_NO_THRESHOLD",
            "anchor_child": "110-EVENT-LOG-ESCROW-COVERAGE",
        })
    } else {
        json!({
            "participates": false,
            "pass": true,
            "state": "absent",
        })
    };
    breakdown.insert("event_log_escrow_coverage".to_string(), ev_branch);

    fn log_verify_compound_branch(anchor_child: &str, v: &Value) -> Value {
        if v.get("skipped").is_some() {
            return json!({
                "participates": false,
                "pass": true,
                "state": "skipped_not_configured",
                "anchor_child": anchor_child,
            });
        }
        if v.get("no_fee_router_rows").and_then(|x| x.as_bool()) == Some(true)
            || v.get("no_region_vault_rows").and_then(|x| x.as_bool()) == Some(true)
        {
            return json!({
                "participates": false,
                "pass": true,
                "state": "no_projection_rows",
                "anchor_child": anchor_child,
            });
        }
        let clean = v.get("log_verify_clean").and_then(|x| x.as_bool());
        match clean {
            Some(true) => json!({
                "participates": true,
                "pass": true,
                "state": "log_verify_clean",
                "anchor_child": anchor_child,
            }),
            Some(false) => json!({
                "participates": true,
                "pass": false,
                "state": "log_verify_failed",
                "anchor_child": anchor_child,
            }),
            None => json!({
                "participates": false,
                "pass": true,
                "state": "clean_unset",
                "anchor_child": anchor_child,
            }),
        }
    }

    let fr_branch = match fee_router_verify {
        None => json!({
            "participates": false,
            "pass": true,
            "state": "not_requested",
        }),
        Some(v) => log_verify_compound_branch("B-081-FEE-ROUTER-LOG-VERIFY", v),
    };
    breakdown.insert("fee_router_log_verify".to_string(), fr_branch);

    let rv_branch = match region_vault_verify {
        None => json!({
            "participates": false,
            "pass": true,
            "state": "not_requested",
        }),
        Some(v) => log_verify_compound_branch("B-082-REGION-VAULT-LOG-VERIFY", v),
    };
    breakdown.insert("region_vault_log_verify".to_string(), rv_branch);

    let chain_branch = match chain_observation {
        None => json!({
            "participates": false,
            "pass": true,
            "state": "not_requested",
        }),
        Some(v) => {
            let ok = v.get("ok").and_then(|x| x.as_bool()).unwrap_or(false);
            json!({
                "participates": true,
                "pass": ok,
                "state": if ok { "rpc_tip_ok" } else { "rpc_tip_failed" },
                "anchor_child": "110-RECONCILE-CHAIN-TIP",
            })
        }
    };
    breakdown.insert("chain_observation".to_string(), chain_branch);

    let od_branch = orders_deadline_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ3-ORDERS-DEADLINE-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without deadline branch (unit tests)"
        })
    });
    breakdown.insert("orders_deadline_ssot_reconcile".to_string(), od_branch);

    let gv_branch = governor_view_params_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ5-GOVERNOR-VIEW-PARAMS-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without governor_view_params branch (unit tests)"
        })
    });
    breakdown.insert("governor_view_params_ssot_reconcile".to_string(), gv_branch);

    let gtt_branch = governor_token_timelock_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ11-GOVERNOR-TOKEN-TIMELOCK-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without governor_token_timelock branch (unit tests)"
        })
    });
    breakdown.insert(
        "governor_token_timelock_ssot_reconcile".to_string(),
        gtt_branch,
    );

    let tl_branch = timelock_delay_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ6-TIMELOCK-DELAY-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without timelock_delay branch (unit tests)"
        })
    });
    breakdown.insert("timelock_delay_ssot_reconcile".to_string(), tl_branch);

    let pt_branch = governor_proposal_threshold_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ8-GOVERNOR-PROPOSAL-THRESHOLD-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without governor_proposal_threshold branch (unit tests)"
        })
    });
    breakdown.insert(
        "governor_proposal_threshold_ssot_reconcile".to_string(),
        pt_branch,
    );

    let tga_branch = timelock_governor_admin_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ9-TIMELOCK-GOVERNOR-ADMIN-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without timelock_governor_admin branch (unit tests)"
        })
    });
    breakdown.insert(
        "timelock_governor_admin_ssot_reconcile".to_string(),
        tga_branch,
    );

    let gpc_branch = governor_proposal_count_ssot_reconcile_branch.unwrap_or_else(|| {
        json!({
            "participates": false,
            "pass": true,
            "state": "not_evaluated",
            "anchor_child": "B110-SEQ10-GOVERNOR-PROPOSAL-COUNT-SSOT-RECONCILE",
            "rule": "indexer_reconcile_compound_gate called without governor_proposal_count branch (unit tests)"
        })
    });
    breakdown.insert(
        "governor_proposal_count_ssot_reconcile".to_string(),
        gpc_branch,
    );

    let compound_pass = indexer_reconcile_compound_pass_from_breakdown(&breakdown);
    let contributing = breakdown
        .values()
        .filter(|v| {
            v.get("participates")
                .and_then(|x| x.as_bool())
                .unwrap_or(false)
        })
        .count();
    let od_participates = breakdown
        .get("orders_deadline_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let od_pass = breakdown
        .get("orders_deadline_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let gv_participates = breakdown
        .get("governor_view_params_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let gv_pass = breakdown
        .get("governor_view_params_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let gtt_participates = breakdown
        .get("governor_token_timelock_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let gtt_pass = breakdown
        .get("governor_token_timelock_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let tl_participates = breakdown
        .get("timelock_delay_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let tl_pass = breakdown
        .get("timelock_delay_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let pt_participates = breakdown
        .get("governor_proposal_threshold_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let pt_pass = breakdown
        .get("governor_proposal_threshold_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let tga_participates = breakdown
        .get("timelock_governor_admin_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let tga_pass = breakdown
        .get("timelock_governor_admin_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let gpc_participates = breakdown
        .get("governor_proposal_count_ssot_reconcile")
        .and_then(|v| v.get("participates"))
        .and_then(|x| x.as_bool())
        .unwrap_or(false);
    let gpc_pass = breakdown
        .get("governor_proposal_count_ssot_reconcile")
        .and_then(|v| v.get("pass"))
        .and_then(|x| x.as_bool())
        .unwrap_or(true);
    let human = format!(
        "compound_pass={} orders_projection={} contributing_parts={} orders_deadline_ssot_reconcile participates={} pass={} governor_view_params_ssot_reconcile participates={} pass={} governor_token_timelock_ssot_reconcile participates={} pass={} timelock_delay_ssot_reconcile participates={} pass={} governor_proposal_threshold_ssot_reconcile participates={} pass={} timelock_governor_admin_ssot_reconcile participates={} pass={} governor_proposal_count_ssot_reconcile participates={} pass={}",
        compound_pass, orders_pass, contributing, od_participates, od_pass, gv_participates, gv_pass, gtt_participates, gtt_pass, tl_participates, tl_pass, pt_participates, pt_pass, tga_participates, tga_pass, gpc_participates, gpc_pass
    );

    (
        compound_pass,
        json!({
            "anchor": "B101-INDEXER-RECONCILE-COMPOUND-GATE",
            "pass": compound_pass,
            "orders_projection_reconcile_gate_pass": orders_pass,
            "breakdown": Value::Object(breakdown),
            "human_summary": human,
        }),
    )
}

/// **B-121 / TT-B121-INDEXER-RECONCILE-SUMMARY-COMPOUND-SSOT-001**：**`persist` `summary`** 与 **`200`** 体共用 **`reconcile_compound_pass` + `indexer_reconcile_compound_gate`** 时，根级布尔须与 **`gate["pass"]`**、**`breakdown` AND** 三元一致（与 **`indexer_reconcile_compound_gate`** 返回值**同源**，**禁止**手写第二套 compound 布尔）。
#[cfg(test)]
pub(crate) fn indexer_reconcile_assert_summary_compound_ssot_b121(summary: &Value) {
    let root = summary
        .get("reconcile_compound_pass")
        .and_then(|v| v.as_bool())
        .expect("summary must contain reconcile_compound_pass bool");
    let gate = summary
        .get("indexer_reconcile_compound_gate")
        .expect("summary must contain indexer_reconcile_compound_gate");
    let gate_pass = gate
        .get("pass")
        .and_then(|v| v.as_bool())
        .expect("compound gate pass");
    let bd = gate
        .get("breakdown")
        .and_then(|v| v.as_object())
        .expect("compound gate breakdown");
    let from_bd = indexer_reconcile_compound_pass_from_breakdown(bd);
    assert_eq!(root, gate_pass, "B121 root reconcile_compound_pass vs gate.pass");
    assert_eq!(root, from_bd, "B121 root vs breakdown AND");
}
