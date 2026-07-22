#!/usr/bin/env python3
"""ETA / full-window execution auto-gate (read-only).

WAITING_WINDOW | READY_TO_EXECUTE | BLOCKED_*

Does NOT finalize / Bridge / S7.

  python scripts/dev/check-psg-eta-execution-gate.py
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/dev/lib"))
from tt_refuse_historical_baseline import fg15_b_elapsed  # noqa: E402

PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
ETA_SETTLEMENT = "2026-07-21T18:10:48Z"
ETA_ELAPSED = "2026-07-21T18:06:48Z"

CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
FG15 = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json"
OPS = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json"
DEPLOY = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
MATRIX = ROOT / "registry/web3-active-execution-matrix.v1.yaml"
GATE = CONSOL / "S7-CANDIDATE-BASELINE-GATE-LATEST.json"
IMPACT = CONSOL / "S7-BRIDGE-IMPACT-ANALYSIS-LATEST.json"
SOURCE = CONSOL / "S7-INPUT-SOURCE-CHECK-LATEST.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> dict | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def parse_utc(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def git_head() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=str(ROOT), text=True
        ).strip()
    except Exception:  # noqa: BLE001
        return "UNKNOWN"


def run_gate(recorded: str | None = None) -> dict[str, Any]:
    recorded = recorded or utc_now()
    now = datetime.now(timezone.utc)
    fg = load_json(FG15) or {}
    ops = load_json(OPS) or {}
    gate = load_json(GATE) or {}
    impact = load_json(IMPACT) or {}
    src = load_json(SOURCE) or {}

    deploy_text = DEPLOY.read_text(encoding="utf-8", errors="replace") if DEPLOY.is_file() else ""
    matrix_text = MATRIX.read_text(encoding="utf-8", errors="replace") if MATRIX.is_file() else ""
    m = re.search(r"active_deploy_baseline:\s*([^\s#]+)", deploy_text)
    active_baseline = m.group(1).strip() if m else None

    elapsed_flag, _fg_elapsed = fg15_b_elapsed(FG15)
    # Prefer artifact; helper also treats wall clock past earliest_elapsed_utc as elapsed
    if fg.get("elapsed_pass") is True:
        elapsed_flag = True
    wall_elapsed = now >= parse_utc(ETA_ELAPSED)
    wall_settle = now >= parse_utc(ETA_SETTLEMENT)
    prefer = (impact.get("recommendation") or {}).get("prefer")
    baseline_ready = gate.get("status") == "READY"
    source_ready = src.get("status") == "READY"
    # FINAL RELEASE: deploy identity = active registry pin+tip + matrix cite + PCD baseline
    tip = "97289a7185610ef0ad8822f0af04bfa533e42986"
    act_pin = ""
    act_sha = ""
    try:
        import yaml  # type: ignore

        ver = yaml.safe_load(
            (ROOT / "registry/psg-release-version-LATEST.yaml").read_text(encoding="utf-8")
        ) or {}
        act = ver.get("active") or {}
        act_pin = str(act.get("psg_release_version") or "")
        act_sha = str(act.get("git_sha") or "")
    except Exception:  # noqa: BLE001
        pass
    identity_ok = (
        active_baseline == BASELINE
        and act_pin == PIN
        and act_sha == tip
        and PIN in matrix_text
    )
    bridge_prereq = prefer == "OPTION_A" and impact.get("executed_bridge") is not True

    checks = [
        {
            "id": "FG15_ELAPSED",
            "ok": elapsed_flag,
            "actual": {
                "elapsed_pass": fg.get("elapsed_pass"),
                "status": fg.get("status"),
                "wall_clock_past": wall_elapsed,
                "eta": ETA_ELAPSED,
            },
        },
        {
            "id": "SETTLEMENT_ETA_REACHED",
            "ok": wall_settle,
            "actual": {
                "eta": ETA_SETTLEMENT,
                "eta_unix": ops.get("settlement_eta_unix"),
                "wall_clock_past": wall_settle,
                "remaining_s": (fg.get("settlement_finalize") or {}).get("remaining_s")
                if isinstance(fg.get("settlement_finalize"), dict)
                else None,
            },
        },
        {
            "id": "DEPLOY_IDENTITY",
            "ok": identity_ok,
            "actual": {
                "active_deploy_baseline": active_baseline,
                "expected": BASELINE,
                "pin": PIN,
                "workspace_HEAD": git_head(),
            },
        },
        {
            "id": "BRIDGE_PREREQUISITE",
            "ok": bridge_prereq,
            "actual": {
                "prefer": prefer,
                "option_a": (impact.get("OPTION_A") or {}).get("verdict"),
                "note": "Prefer OPTION_A analyzed; execute only after finalize",
            },
        },
        {
            "id": "S7_BASELINE_FOR_EXECUTE_LADDER",
            "ok": True,  # during window, BLOCKED is expected; READY only after Bridge
            "actual": {
                "baseline_gate": gate.get("status"),
                "source_check": src.get("status"),
                "expect_pre_bridge": "BLOCKED_WRONG_BASELINE",
                "expect_pre_s7": "READY",
                "baseline_ready_now": baseline_ready,
                "source_ready_now": source_ready,
            },
            "note": "Does not block WAITING→READY_TO_EXECUTE for ladder start; blocks S7 step",
        },
    ]

    time_ok = elapsed_flag and wall_settle
    # READY_TO_EXECUTE = wall+artifact elapsed + settlement ETA + identity + bridge plan A
    # Baseline READY is NOT required to *start* ladder (finalize first), only for S7
    ready_ladder = (
        time_ok
        and identity_ok
        and bridge_prereq
    )
    waiting = not wall_settle or not elapsed_flag

    if ready_ladder:
        status = "READY_TO_EXECUTE"
        block_reasons: list[str] = []
    elif waiting:
        status = "WAITING_WINDOW"
        block_reasons = []
        if not elapsed_flag:
            block_reasons.append("WAIT_FG15_B_ELAPSED")
        if not wall_settle:
            block_reasons.append("WAIT_SETTLEMENT_ETA")
        if not identity_ok:
            block_reasons.append("DEPLOY_IDENTITY_MISMATCH")
        if not bridge_prereq:
            block_reasons.append("BRIDGE_PREREQ_MISSING")
    else:
        status = "BLOCKED"
        block_reasons = [c["id"] for c in checks if not c["ok"] and c["id"] != "S7_BASELINE_FOR_EXECUTE_LADDER"]
        if not identity_ok:
            block_reasons.append("DEPLOY_IDENTITY_MISMATCH")
        if not bridge_prereq:
            block_reasons.append("BRIDGE_PREREQ_MISSING")

    out = {
        "schema": "traveltrust.psg_eta_execution_gate.v1",
        "id": "ETA_EXECUTION_GATE",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "status": status,
        "READY_TO_EXECUTE": status == "READY_TO_EXECUTE",
        "WAITING_WINDOW": status == "WAITING_WINDOW",
        "BLOCKED_REASON": block_reasons,
        "checks": checks,
        "s7_step_requires": {
            "baseline_gate": "READY",
            "source_check": "READY",
            "current_baseline_gate": gate.get("status"),
            "current_source_check": src.get("status"),
            "s7_allowed_now": baseline_ready and source_ready,
        },
        "correct_order": [
            "settlement_finalize",
            "candidate_evidence_bridge_OPTION_A",
            "s7_baseline_gate_READY",
            "l5_final",
            "s7_recalculate",
            "formal_baseline",
        ],
        "forbid": ["finalize_then_direct_s7"],
        "executed_finalize": False,
        "executed_bridge": False,
        "executed_s7": False,
        "equals_psg_complete": False,
    }
    write_json(CONSOL / "ETA-EXECUTION-GATE-LATEST.json", out)
    return out


def main() -> int:
    out = run_gate()
    print(
        json.dumps(
            {
                "status": out["status"],
                "BLOCKED_REASON": out["BLOCKED_REASON"],
                "s7_allowed_now": out["s7_step_requires"]["s7_allowed_now"],
            },
            indent=2,
        )
    )
    print(f"TT_PSG_ETA_EXECUTION_GATE: {out['status']}")
    if out["status"] == "READY_TO_EXECUTE":
        return 0
    if out["status"] == "WAITING_WINDOW":
        return 0  # healthy wait — not a failure
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
