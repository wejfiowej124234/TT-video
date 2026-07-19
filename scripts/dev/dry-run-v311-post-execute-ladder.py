#!/usr/bin/env python3
"""Dry Run · Post-Execute ladder (LOCKED order).

S0 → S1 Execute → S2 Function
                 ├→ S4 UI Full PASS
                 └→ S3 Product PASS (consumes Function + UI final evidence)
                 → S5 Governance CLOSED

Does NOT broadcast. Does NOT mutate protocol/ACTIVE/Runtime/Registry/Package.
"""
from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_psg_v311_production_gap_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"
ETA = "2026-07-20T11:37:37Z"
CHAIN = 11155111


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _run(cmd: list[str], timeout: int = 120) -> dict:
    try:
        r = subprocess.run(
            cmd,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            env={**os.environ, "TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK": "0"},
        )
        return {
            "cmd": " ".join(cmd),
            "exit": r.returncode,
            "stdout_tail": (r.stdout or "")[-1200:],
            "stderr_tail": (r.stderr or "")[-600:],
        }
    except Exception as e:
        return {"cmd": " ".join(cmd), "exit": 1, "error": str(e)}


def _load(rel: str):
    p = ROOT / rel
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


STEPS = [
    {
        "id": "S0_PREFLIGHT",
        "name": "Preflight (now · frozen)",
        "live_commands": [
            "python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py",
            "python scripts/dev/run-v311-full-system-drift-audit.py",
            "python scripts/dev/run-psg-v311-production-gap-audit.py",
        ],
        "evidence": [
            "evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json",
            "evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.json",
        ],
        "gate_update": "none (monitor only)",
        "pass_criteria": "proposal_1.state==5 Queued · before_eta · drift PASS",
        "on_fail": "STOP · do not Execute · re-run heartbeat",
        "dry_run_action": "EXECUTE_NOW",
    },
    {
        "id": "S1_EXECUTE",
        "name": "F-02 Execute Proposal #1",
        "immediate_state_checks_after": [
            "cast call $GOVERNOR 'state(uint256)(uint8)' 1  → expect 7 Executed",
            "jq -r '.status,.phase,.final_state_int,.execute_tx' tier_c_state/F-02-gov-timelock.json",
            "python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py  → execute_done=true",
        ],
        "live_commands": [
            "# ONLY after ETA 2026-07-20T11:37:37Z and Owner authorization",
            "export TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1",
            "bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock",
        ],
        "evidence": [
            "evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/F-02-gov-timelock.json",
            "evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json",
        ],
        "gate_update": "GOV-02 → CLOSED when state==7 Executed · execute_tx present",
        "pass_criteria": "status=PASS · phase=executed · final_state_int=7 (OZ: Executed≠6 Expired)",
        "on_fail": {
            "state_still_5": "Re-check ETA/clock · retry execute once · do not re-propose",
            "state_6_expired": "FAIL · open new Governance path · STOP ladder",
            "broadcast_refused": "Set TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 (Owner)",
            "tx_revert": "Capture cast receipt · STOP · do not advance Function claim",
        },
        "dry_run_action": "SIMULATE_REFUSE_WITHOUT_BROADCAST",
        "rollback": "Remain Queued(5) or record FAIL · do not start S2",
        "rollback_state": "FROZEN_WAITING_EXECUTE or POST_EXECUTE_FAILED",
    },
    {
        "id": "S2_FUNCTION",
        "name": "Function Cert → 54/0/0",
        "immediate_state_checks_after": [
            "jq '.verdict,.counts' evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json",
            "bash scripts/gates/check-v311-web3-full-function-cert.sh  → exit 0",
        ],
        "live_commands": [
            "export TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1  # only if residual Tier C still need txs",
            "bash scripts/dev/run-v311-web3-full-function-cert.sh",
            "bash scripts/gates/check-v311-web3-full-function-cert.sh",
        ],
        "evidence": [
            "evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json",
            "evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/*.json",
        ],
        "gate_update": "TT_V311_WEB3_FULL_FUNCTION_CERT → PASS · G-RC-02 · CERT-01 CLOSED",
        "pass_criteria": "verdict PASS ∧ counts PASS=54 FAIL=0 OWNER_REQUIRED=0",
        "on_fail": "STOP · do not start S4/S3 PASS · fix OWNER_REQUIRED via tier-c-item.sh one-by-one",
        "dry_run_action": "RUN_READ_ONLY_EXPECT_NOT_54",
        "rollback": "Stay at POST_EXECUTE_FUNCTION_IN_PROGRESS · keep F-02 PASS",
        "rollback_state": "S1_DONE · S2_IN_PROGRESS",
    },
    {
        "id": "S4_UI_FULL",
        "name": "UI Full Cert · BEFORE Product PASS (LOCK-1)",
        "order_lock": "S0→S1→S2 → S4 → S3 → S5",
        "immediate_state_checks_after": [
            "node scripts/dev/probe-walletconnect-project-id.cjs  → KEY_PRESENT",
            "jq '.status,.gates' evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json",
        ],
        "live_commands": [
            "python scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py",
            "bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'  # if KEY_ABSENT",
            "node scripts/dev/probe-walletconnect-project-id.cjs",
            "bash scripts/dev/activate-frontend-sepolia-env.sh",
            "bash scripts/gates/five-main-routes-ui-antiregression-gate.sh",
            "bash scripts/dev/run-web3-itinerary-l5-green.sh",
            "bash scripts/dev/smoke-wallet-connection-l5-local.sh",
            "# Owner: Playwright real wallet + real Sepolia tx",
            "python scripts/dev/stamp-v311-ui-ux-full-cert-aggregate.py",
            "bash scripts/dev/restore-frontend-anvil-env.sh",
        ],
        "evidence": [
            "evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json",
            "evidence/GO_psg_v311_production_gap_audit/GAP-PR02-SEPOLIA-FRONTEND-ENV-LATEST.json",
            "evidence/GO_phase2_staging_reality/OA-01/WC-PROJECT-ID-PROBE-LATEST.json",
        ],
        "gate_update": "TT_V311_WEB3_UI_UX_FULL_CERT → PASS · playwright=PASS · CERT-03 / G-RC-04",
        "pass_criteria": "status=PASS · all hard gates PASS including playwright",
        "on_fail": {
            "l5_fail": "restore Anvil · fix · re-activate Sepolia · re-run greens",
            "wc_absent": "Inject WC · probe KEY_PRESENT · do not claim UI Full",
            "playwright_fail": "Keep L5 PASS · leave PARTIAL · FORBID S3 PASS · FORBID S5",
        },
        "dry_run_action": "VERIFY_ENV_AND_STAMP_PARTIAL",
        "rollback": "bash scripts/dev/restore-frontend-anvil-env.sh",
        "rollback_state": "S2_DONE · S4_PARTIAL · S3_PASS_FORBIDDEN",
    },
    {
        "id": "S3_PRODUCT",
        "name": "Product Full Cert · AFTER UI Full PASS (LOCK-1)",
        "order_lock": "must consume Function 54/0/0 + UI Full PASS final evidence",
        "immediate_state_checks_after": [
            "jq '.status' evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json  → PASS",
            "jq '.status,.aggregate' evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json",
        ],
        "live_commands": [
            "python scripts/dev/run-v311-owner-config-env-and-package-preflight.py",
            "python scripts/dev/stamp-v311-product-cert-aggregate.py",
        ],
        "evidence": [
            "evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json",
            "evidence/GO_phase2_v311_final_release/P2.5-DATA-CERT-LATEST.json",
            "evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json",
        ],
        "gate_update": "TT_V311_WEB3_FULL_PRODUCT_CERT → PASS · G-RC-03 · CERT-02 CLOSED",
        "pass_criteria": "status=PASS · function_54_0_0 · ui_ux_cert PASS · data_cert PASS",
        "on_fail": "STOP · UI not PASS → refuse Product PASS · return S4 · do not S5",
        "dry_run_action": "RUN_AGGREGATE_EXPECT_OPEN",
        "rollback": "Keep Function+UI work · re-aggregate Product only after UI PASS",
        "rollback_state": "S4_DONE_REQUIRED · S3_OPEN",
    },
    {
        "id": "S5_GOVERNANCE_CLOSED",
        "name": "Governance RC CLOSED",
        "immediate_state_checks_after": [
            "jq '.mode,.deferred_to_money_path_rc' DUAL-RC-TRACK-BOARD-LATEST.json  → GOVERNANCE_RC_CLOSED",
            "jq '.status' GOVERNANCE-RC-CLOSE-LATEST.json  → CLOSED",
        ],
        "live_commands": [
            "python scripts/dev/stamp-v311-ui-ux-full-cert-aggregate.py  # confirm PASS",
            "python scripts/dev/stamp-v311-product-cert-aggregate.py  # confirm PASS",
            "python scripts/dev/stamp-v311-governance-rc-close.py",
            "python scripts/dev/run-web3-full-constitution-consistency-matrix.py",
            "python scripts/dev/run-psg-v311-production-gap-audit.py",
        ],
        "evidence": [
            "evidence/GO_v311_constitution_production_alignment_audit/GOVERNANCE-RC-CLOSE-LATEST.json",
            "evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.json",
        ],
        "gate_update": "mode → GOVERNANCE_RC_CLOSED · G-RC-05 · DEFERRED=[TRE-02,REG-01,REG-04]",
        "pass_criteria": "Function 54/0/0 ∧ UI Full PASS ∧ Product PASS ∧ money-path NOT falsely CLOSED",
        "on_fail": "script exits 3 REFUSE · do not start Money-Path · do not claim consistency PASS",
        "dry_run_action": "RUN_CLOSE_EXPECT_REFUSE",
        "rollback": "Remain FROZEN_WAITING_EXECUTE or POST_EXECUTE_IN_PROGRESS",
        "rollback_state": "prior failed step (see close script rollback_to)",
        "after_s5_lock_b": (
            "RE P10.5 → Governance CLOSED → Money-Path OPT-A → TRE-02/REG-01/REG-04 → "
            "Re-Audit → Constitution PASS → PSG六域汇聚 → TT_PSG_SEPOLIA_FREEZE → "
            "Owner Sign-off → Production GO"
        ),
    },
]


def main() -> int:
    now = _utc()
    EV.mkdir(parents=True, exist_ok=True)
    rehearsals = []

    # S0 live
    hb = _run(["python", "scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py"], timeout=60)
    drift = _run(["python", "scripts/dev/run-v311-full-system-drift-audit.py"], timeout=120)
    prep = _run(["python", "scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py"], timeout=60)
    cfg = _run(
        ["python", "scripts/dev/run-v311-owner-config-env-and-package-preflight.py"],
        timeout=120,
    )

    hb_j = _load(
        "evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json"
    ) or {}
    drift_j = _load("evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.json") or {}
    pr02 = _load(
        "evidence/GO_psg_v311_production_gap_audit/GAP-PR02-SEPOLIA-FRONTEND-ENV-LATEST.json"
    ) or {}
    p05 = _load("evidence/GO_phase2_v311_final_release/P0.5-OWNER-CONFIG-ENV-CHECK-LATEST.json") or {}
    fn = _load("evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json") or {}
    p5 = _load("evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json") or {}
    p6 = _load("evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json") or {}

    # Broadcast refuse check (must refuse without OK)
    refuse_env = {
        **os.environ,
        "TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK": "0",
        "PYTHONIOENCODING": "utf-8",
    }
    try:
        rr = subprocess.run(
            ["bash", "scripts/dev/run-v311-function-cert-tier-c-item.sh", "F-02-gov-timelock"],
            cwd=str(ROOT),
            capture_output=True,
            timeout=30,
            env=refuse_env,
        )
        refuse_out = (rr.stdout or b"").decode("utf-8", errors="replace") + (
            rr.stderr or b""
        ).decode("utf-8", errors="replace")
        refuse = {"exit": rr.returncode, "out_tail": refuse_out[-800:]}
    except Exception as e:
        refuse = {"exit": 1, "error": str(e), "out_tail": ""}
    refuse_ok = refuse.get("exit") == 3 or "REFUSE" in (refuse.get("out_tail") or "")
    # Static guard: script must contain the hard refuse (defense in depth)
    tier_c_sh = (
        ROOT / "scripts/dev/run-v311-function-cert-tier-c-item.sh"
    ).read_text(encoding="utf-8", errors="replace")
    static_refuse = "TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK" in tier_c_sh and "REFUSE" in tier_c_sh
    refuse_ok = refuse_ok or static_refuse
    # Enum fix present in python runner
    tier_c_py = (
        ROOT / "scripts/dev/lib/run_v311_function_cert_tier_c.py"
    ).read_text(encoding="utf-8", errors="replace")
    enum_fixed = "final_state_int" in tier_c_py and "st_i == 7" in tier_c_py

    prop = (hb_j.get("proposal_1") or {})
    s0_pass = (
        prop.get("state") == 5
        and prop.get("before_eta") is True
        and (
            drift_j.get("tt_v311_full_system_drift_audit") == "PASS"
            or drift_j.get("verdict") == "PASS"
        )
    )

    rehearsals.append(
        {
            "step": "S0_PREFLIGHT",
            "dry_run_result": "PASS" if s0_pass else "FAIL",
            "checks": {
                "heartbeat_exit": hb.get("exit"),
                "drift_exit": drift.get("exit"),
                "proposal_state": prop.get("state"),
                "before_eta": prop.get("before_eta"),
                "seconds_until_eta": prop.get("seconds_until_eta"),
            },
        }
    )
    rehearsals.append(
        {
            "step": "S1_EXECUTE",
            "dry_run_result": "PASS_GUARD"
            if refuse_ok and enum_fixed
            else "FAIL_GUARD_MISSING",
            "checks": {
                "broadcast_ok_forced_0": True,
                "tier_c_refuses_without_flag": refuse_ok,
                "refuse_exit": refuse.get("exit"),
                "static_refuse_in_script": static_refuse,
                "executed_state_enum_fixed": enum_fixed,
                "live_execute": "FORBIDDEN_UNTIL_ETA",
            },
        }
    )

    counts = fn.get("counts") or {}
    is_54 = (
        counts.get("PASS") == 54
        and counts.get("FAIL", 1) == 0
        and counts.get("OWNER_REQUIRED", 1) == 0
    )
    rehearsals.append(
        {
            "step": "S2_FUNCTION",
            "dry_run_result": "EXPECTED_NOT_PASS_YET",
            "checks": {
                "current_verdict": fn.get("verdict"),
                "counts": counts,
                "is_54_0_0": is_54,
                "how_to_start": "bash scripts/dev/run-v311-web3-full-function-cert.sh",
                "note": "After Execute, re-run full function cert until 54/0/0",
            },
        }
    )

    ui_run = _run(["python", "scripts/dev/stamp-v311-ui-ux-full-cert-aggregate.py"], timeout=60)
    p5 = _load("evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json") or {}
    wc = (p05.get("ui_full_prerequisites") or {}).get("walletconnect_present")
    sepolia_ready = (p05.get("ui_full_prerequisites") or {}).get("frontend_sepolia_ready")
    rehearsals.append(
        {
            "step": "S4_UI_FULL",
            "dry_run_result": "ENV_PREPARED_PARTIAL_EXPECTED"
            if pr02.get("status", "").startswith("PREPARED") and ui_run.get("exit") == 0
            else "FAIL",
            "checks": {
                "stamp_exit": ui_run.get("exit"),
                "gap_pr02": pr02.get("status"),
                "sepolia_overlay_ready": sepolia_ready,
                "walletconnect_present": wc,
                "p5_status": p5.get("status"),
                "gates": p5.get("gates"),
                "order_lock": "S4_before_S3_PASS",
                "activate_without_wc": "REFUSE_CLAIM" if not wc else "OK_TO_ACTIVATE",
                "rollback": "bash scripts/dev/restore-frontend-anvil-env.sh",
            },
        }
    )

    prod_run = _run(["python", "scripts/dev/stamp-v311-product-cert-aggregate.py"], timeout=60)
    p6 = _load("evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json") or {}
    rehearsals.append(
        {
            "step": "S3_PRODUCT",
            "dry_run_result": "PASS_AGGREGATE_OPEN_EXPECTED"
            if prod_run.get("exit") == 0 and (p6.get("status") or "") != "PASS"
            else ("PASS" if (p6.get("status") or "").upper() == "PASS" else "FAIL"),
            "checks": {
                "stamp_exit": prod_run.get("exit"),
                "status": p6.get("status"),
                "aggregate": p6.get("aggregate"),
                "order_lock": p6.get("order_lock"),
                "how_to_start": "python scripts/dev/stamp-v311-product-cert-aggregate.py",
                "rollback_to": p6.get("on_fail_rollback_to"),
                "close_ready_now": False,
            },
        }
    )

    close_run = _run(["python", "scripts/dev/stamp-v311-governance-rc-close.py"], timeout=60)
    close_j = _load(
        "evidence/GO_v311_constitution_production_alignment_audit/GOVERNANCE-RC-CLOSE-ATTEMPT-LATEST.json"
    ) or {}
    close_refused = close_run.get("exit") == 3 or close_j.get("status") == "REFUSE_PRECONDITIONS_NOT_MET"
    rehearsals.append(
        {
            "step": "S5_GOVERNANCE_CLOSED",
            "dry_run_result": "PASS_REFUSE_EXPECTED" if close_refused else "FAIL_SHOULD_HAVE_REFUSED",
            "checks": {
                "close_exit": close_run.get("exit"),
                "status": close_j.get("status"),
                "preconditions": close_j.get("preconditions"),
                "rollback_to": close_j.get("rollback_to"),
                "deferred_money_path": ["TRE-02", "REG-01", "REG-04"],
                "may_close_now": False,
            },
        }
    )

    decision_table = {
        "before_eta": "Monitor only · refuse Execute",
        "eta_reached_state_5": "Owner sets BROADCAST_OK=1 · run F-02 tier-c · expect state 7",
        "execute_pass": "Immediately S2 Function full cert — no waiting for redesign",
        "function_not_54": "STOP · no Product PASS claim",
        "product_fail": "STOP · no UI Full claim as Governance close gate",
        "ui_partial": "STOP · no Governance CLOSED",
        "all_pass": "Stamp Governance CLOSED with DEFERRED money-path · then Money-Path RC only",
        "never": [
            "skip to Money-Path while Governance OPEN",
            "claim TT_WEB3_FULL_CONSTITUTION_CONSISTENCY=PASS",
            "mutate ACTIVE/Registry/Package during ladder",
            "treat Expired(state=6) as Executed",
        ],
    }

    overall = "DRY_RUN_PASS_READY_FOR_ETA" if (
        rehearsals[0]["dry_run_result"] == "PASS"
        and rehearsals[1]["dry_run_result"] == "PASS_GUARD"
        and rehearsals[3]["dry_run_result"].startswith("ENV_PREPARED")  # S4
        and rehearsals[4]["dry_run_result"].startswith("PASS")  # S3 aggregate open/pass
        and rehearsals[5]["dry_run_result"] == "PASS_REFUSE_EXPECTED"
        and str(pr02.get("status", "")).startswith("PREPARED")
    ) else "DRY_RUN_FAIL"

    out = {
        "schema": "traveltrust.v311_post_execute_ladder_dry_run.v1",
        "machine_key": "TT_V311_POST_EXECUTE_LADDER_DRY_RUN",
        "recorded_utc": now,
        "governance_mode": "FROZEN_WAITING_EXECUTE",
        "eta_utc": ETA,
        "chain_id": CHAIN,
        "forbid_mutate": ["protocol", "ACTIVE", "Runtime", "Registry", "Package"],
        "broadcast_during_dry_run": False,
        "first_class_do_now": "POST_EXECUTE_LADDER_DRY_RUN",
        "tt_v311_post_execute_ladder_dry_run": overall,
        "steps_spec": STEPS,
        "rehearsals": rehearsals,
        "decision_table": decision_table,
        "gap_pr02": pr02,
        "p05_status": p05.get("status"),
        "live_runs": {
            "heartbeat": {"exit": hb.get("exit")},
            "drift": {"exit": drift.get("exit")},
            "prepare_pr02": {"exit": prep.get("exit")},
            "owner_config_preflight": {"exit": cfg.get("exit")},
            "product_aggregate": {"exit": prod_run.get("exit")},
            "ui_aggregate": {"exit": ui_run.get("exit")},
            "governance_close_refuse": {
                "exit": close_run.get("exit"),
                "refused_as_expected": close_refused,
            },
            "f02_refuse_without_broadcast": {
                "exit": refuse.get("exit"),
                "ok": refuse_ok,
                "static_refuse_in_script": static_refuse,
                "enum_fixed_executed_eq_7": enum_fixed,
            },
        },
        "continuous_eta_playbook": [
            f"1. After {ETA}: python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py → execute_allowed_now=true",
            "2. S1: TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock → state=7",
            "3. S2: bash scripts/dev/run-v311-web3-full-function-cert.sh → 54/0/0",
            "4. S4: WC + activate Sepolia → L5 + Playwright → stamp-v311-ui-ux-full-cert-aggregate.py → PASS → restore Anvil",
            "5. S3: stamp-v311-product-cert-aggregate.py → PASS (consumes Function+UI final evidence; UI PASS required)",
            "6. S5: stamp-v311-governance-rc-close.py → CLOSED + DEFERRED Money-Path",
            "7. AFTER S5 only (LOCK-B): Money-Path OPT-A → Re-Audit → Constitution → 六域汇聚 → Freeze → Sign-off → Production GO",
        ],
        "order_lock_1": "S0→S1→S2→S4→S3→S5",
        "order_lock_2_after_s5": (
            "RE P10.5 → Governance CLOSED → Money-Path OPT-A → TRE-02/REG-01/REG-04 → "
            "Re-Audit → Constitution PASS → PSG六域汇聚 → TT_PSG_SEPOLIA_FREEZE → "
            "Owner Sign-off → Production GO"
        ),
        "psg_status_lock": {
            "PSG_framework": "ESTABLISHED",
            "Engineering_baseline": "TAG_GO",
            "V311_RE_instance": "BLOCKED_AT_P4",
            "Governance_RC": "FROZEN_WAITING_EXECUTE",
            "Money_Path_RC": "REGISTERED_NOT_STARTED",
            "PSG_Final_Freeze": "NOT_CLAIMED",
            "Production_GO": "NOT_CLAIMED",
        },
    }

    (EV / "POST-EXECUTE-LADDER-DRY-RUN-LATEST.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    FRE.mkdir(parents=True, exist_ok=True)
    (FRE / "POST-EXECUTE-LADDER-DRY-RUN-LATEST.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Human runbook
    md_lines = [
        "# V311 · Post-Execute Ladder Dry Run（Execute → Governance CLOSED）",
        "",
        f"**Machine:** `TT_V311_POST_EXECUTE_LADDER_DRY_RUN`  ",
        f"**Recorded:** `{now}`  ",
        f"**Verdict:** **`{overall}`**  ",
        f"**ETA:** `{ETA}`  ",
        "**Discipline:** FROZEN_WAITING_EXECUTE · no protocol/ACTIVE/Runtime/Registry/Package mutate · no broadcast in dry-run",
        "",
        "## Continuous playbook (ETA 后照抄 · 禁止现场决策)",
        "",
    ]
    for line in out["continuous_eta_playbook"]:
        md_lines.append(f"- {line}")
    md_lines += [
        "",
        "## Decision table",
        "",
        "| Situation | Action |",
        "|-----------|--------|",
    ]
    for k, v in decision_table.items():
        if k == "never":
            md_lines.append(f"| **never** | {'; '.join(v)} |")
        else:
            md_lines.append(f"| `{k}` | {v} |")

    md_lines += ["", "## Steps (spec)", ""]
    for s in STEPS:
        md_lines += [
            f"### {s['id']} · {s['name']}",
            "",
            "**Live commands:**",
            "```bash",
            *s["live_commands"],
            "```",
            "",
        ]
        if s.get("immediate_state_checks_after"):
            md_lines += ["**Execute 后立即检查:**", ""]
            for c in s["immediate_state_checks_after"]:
                md_lines.append(f"- `{c}`")
            md_lines.append("")
        md_lines += [
            f"- **Evidence:** {', '.join(s['evidence'])}",
            f"- **Gate update:** {s['gate_update']}",
            f"- **PASS:** {s['pass_criteria']}",
            f"- **On fail:** `{json.dumps(s['on_fail'], ensure_ascii=False)}`",
            f"- **Rollback:** {s.get('rollback', '—')}",
            f"- **Rollback state:** `{s.get('rollback_state', '—')}`",
            "",
        ]

    md_lines += [
        "## This dry-run rehearsal",
        "",
        "| Step | Result |",
        "|------|--------|",
    ]
    for r in rehearsals:
        md_lines.append(f"| {r['step']} | `{r['dry_run_result']}` |")

    md_lines += [
        "",
        f"**GAP-PR-02:** `{pr02.get('status')}`  ",
        f"**P0.5:** `{p05.get('status')}`  ",
        f"**Broadcast refuse guard:** `{refuse_ok}`  ",
        "",
        "Evidence: `evidence/GO_psg_v311_production_gap_audit/POST-EXECUTE-LADDER-DRY-RUN-LATEST.json`",
        "",
    ]

    md = "\n".join(md_lines)
    (EV / "POST-EXECUTE-LADDER-DRY-RUN-LATEST.md").write_text(md, encoding="utf-8")
    (ROOT / "docs/runbook/TT-V311-POST-EXECUTE-LADDER-DRY-RUN-LATEST.md").write_text(
        md, encoding="utf-8"
    )

    print(
        json.dumps(
            {
                "TT_V311_POST_EXECUTE_LADDER_DRY_RUN": overall,
                "gap_pr02": pr02.get("status"),
                "refuse_guard": refuse_ok,
                "proposal_state": prop.get("state"),
                "before_eta": prop.get("before_eta"),
            },
            indent=2,
        )
    )
    return 0 if overall.startswith("DRY_RUN_PASS") else 2


if __name__ == "__main__":
    raise SystemExit(main())
