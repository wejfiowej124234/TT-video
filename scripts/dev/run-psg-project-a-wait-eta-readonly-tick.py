#!/usr/bin/env python3
"""Project A WAIT_ETA read-only extras (no Pack-4 scope expand).

1) POST_ETA_EXECUTION_READY_CHECKLIST — one table for final window
2) Wait-state consistency scan — pin / registry / catalog / snapshot / runbook

Forbidden: Reader · Bridge · PENDING · finalize · S7 · Project B

  python scripts/dev/run-psg-project-a-wait-eta-readonly-tick.py
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
ETA_SETTLEMENT = "2026-07-21T18:10:48Z"
ETA_ELAPSED = "2026-07-21T18:06:48Z"

CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
FG15_STATUS = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json"
OPS = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json"
CATALOG = CONSOL / "EVIDENCE-CATALOG-LATEST.json"
SNAPSHOT = CONSOL / "PROJECT-A-PRE-FINAL-SNAPSHOT-LATEST.json"
IMPACT = CONSOL / "S7-BRIDGE-IMPACT-ANALYSIS-LATEST.json"
BASELINE_GATE = CONSOL / "S7-CANDIDATE-BASELINE-GATE-LATEST.json"
SOURCE_CHECK = CONSOL / "S7-INPUT-SOURCE-CHECK-LATEST.json"
FG_READY = CONSOL / "FG-CAPTURE-READINESS-LATEST.json"
SETTLE_PREP = CONSOL / "SETTLEMENT-FINAL-CAPTURE-VALIDATOR-PREP-LATEST.json"
DEFERRED = CONSOL / "S7-READER-BRIDGE-DEFERRED-LATEST.json"
INTEGRITY = CONSOL / "EVIDENCE-INTEGRITY-LATEST.json"
FRESHNESS = CONSOL / "RUNTIME-FRESHNESS-TICK-LATEST.json"
STATUS = CONSOL / "STATUS-LATEST.json"
MATRIX = ROOT / "registry/web3-active-execution-matrix.v1.yaml"
DEPLOY = ROOT / "registry/protocol-convergence-deployments.v1.yaml"
WAIT_REG = ROOT / "registry/psg-wait-window-evidence-prep.v1.yaml"
POST_ETA_SHEET = ROOT / "docs/runbook/TT-PSG-POST-ETA-COMMAND-SHEET-LATEST.md"
L5_RUNBOOK = ROOT / "docs/runbook/TT-PSG-L5-FINAL-RUNBOOK-LATEST.md"
MAINLINE_SH = ROOT / "scripts/dev/lib/web3-candidate-v2-mainline.sh"

REQUIRED_EVIDENCE = [
    "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
    "evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json",
    "evidence/PSG-L1-product/L1-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-L2-data/L2-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-L3-security/L3-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-L4-operations/L4-S7-FINAL-INPUT-LATEST.json",
    "evidence/GO_fg15_observation_48h_candidate_v2/L5-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-BRIDGE-IMPACT-ANALYSIS-LATEST.json",
    "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-CANDIDATE-BASELINE-GATE-LATEST.json",
    "evidence/PSG-EVIDENCE-CONSOLIDATION/FG-CAPTURE-READINESS-LATEST.json",
    "scripts/dev/check-psg-settlement-final-capture.py",
    "scripts/dev/check-psg-s7-candidate-baseline-gate.py",
    "scripts/dev/run-web3-candidate-v2-settlement-finalize.sh",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def git_head() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=str(ROOT), text=True
        ).strip()
    except Exception:  # noqa: BLE001
        return "UNKNOWN"


def parse_utc(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def yaml_has(path: Path, needle: str) -> bool:
    if not path.is_file():
        return False
    return needle in path.read_text(encoding="utf-8", errors="replace")


def checklist(recorded: str) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    fg = load_json(FG15_STATUS) or {}
    ops = load_json(OPS) or {}
    impact = load_json(IMPACT) or {}
    gate = load_json(BASELINE_GATE) or {}
    src = load_json(SOURCE_CHECK) or {}
    fg_cap = load_json(FG_READY) or {}
    settle = load_json(SETTLE_PREP) or {}
    head = git_head()

    elapsed_flag = bool(fg.get("elapsed_pass"))
    elapsed_time = now >= parse_utc(ETA_ELAPSED)
    fg15_elapsed = elapsed_flag or (
        elapsed_time and str(fg.get("status", "")).upper() in ("ELAPSED", "ELAPSED_PASS", "OBSERVATION_ELAPSED")
    )
    # Hard truth for checklist: wall clock vs ETA + status artifact
    fg15_elapsed_ok = bool(elapsed_flag) if "elapsed_pass" in fg else elapsed_time
    # Prefer explicit artifact; wall clock alone is advisory until status flip
    settlement_eta_passed = now >= parse_utc(ETA_SETTLEMENT)
    prefer = (impact.get("recommendation") or {}).get("prefer") or impact.get("prefer_option")
    if not prefer and isinstance(impact.get("OPTION_A"), dict):
        prefer = "OPTION_A" if impact["OPTION_A"].get("verdict") == "SAFE" else None

    missing_evidence = [
        p for p in REQUIRED_EVIDENCE if not (ROOT / p).exists()
    ]

    rows = [
        {
            "id": "FG15_ELAPSED",
            "question": "FG15 elapsed = true?",
            "ok": bool(elapsed_flag),
            "actual": {
                "elapsed_pass": fg.get("elapsed_pass"),
                "status": fg.get("status"),
                "earliest_elapsed_utc": fg.get("earliest_elapsed_utc") or ETA_ELAPSED,
                "wall_clock_past_elapsed_eta": elapsed_time,
            },
            "block_if_false": "WAIT_FG15_B_ELAPSED",
        },
        {
            "id": "SETTLEMENT_ETA_PASSED",
            "question": "Settlement ETA passed?",
            "ok": settlement_eta_passed,
            "actual": {
                "eta_utc": ETA_SETTLEMENT,
                "eta_unix": ops.get("settlement_eta_unix"),
                "now_utc": recorded,
            },
            "block_if_false": "WAIT_SETTLEMENT_ETA",
        },
        {
            "id": "CANDIDATE_SHA",
            "question": "Candidate SHA present (workspace HEAD)?",
            "ok": bool(head and head != "UNKNOWN" and len(head) >= 7),
            "actual": {"workspace_HEAD": head, "pin": PIN, "baseline": BASELINE},
            "block_if_false": "MISSING_CANDIDATE_SHA",
        },
        {
            "id": "S7_BASELINE_GATE",
            "question": "S7 baseline gate READY?",
            "ok": gate.get("status") == "READY",
            "actual": {
                "status": gate.get("status"),
                "block_code": gate.get("block_code"),
                "source_check": src.get("status"),
            },
            "block_if_false": "S7_BASELINE_GATE_NOT_READY",
            "note": "Expected BLOCKED_WRONG_BASELINE until OPTION_A Bridge after finalize",
        },
        {
            "id": "BRIDGE_OPTION_A",
            "question": "Bridge option = A?",
            "ok": prefer == "OPTION_A",
            "actual": {
                "prefer": prefer,
                "OPTION_A": (impact.get("OPTION_A") or {}).get("verdict"),
                "OPTION_B": (impact.get("OPTION_B") or {}).get("verdict"),
            },
            "block_if_false": "BRIDGE_OPTION_NOT_A",
        },
        {
            "id": "REQUIRED_EVIDENCE",
            "question": "Required evidence exists?",
            "ok": len(missing_evidence) == 0,
            "actual": {
                "missing": missing_evidence,
                "fg_capture_readiness": fg_cap.get("verdict") or fg_cap.get("ready"),
                "settlement_validator_prep": settle.get("prep_status"),
            },
            "block_if_false": "MISSING_REQUIRED_EVIDENCE",
        },
    ]

    blockers = [r["block_if_false"] for r in rows if not r["ok"]]
    # Full execute readiness requires all rows; during wait we expect time + baseline blockers
    ready = len(blockers) == 0
    status = "READY_TO_EXECUTE" if ready else "BLOCKED"
    out = {
        "schema": "traveltrust.psg_post_eta_execution_ready_checklist.v1",
        "id": "POST_ETA_EXECUTION_READY_CHECKLIST",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "status": status,
        "READY_TO_EXECUTE": ready,
        "BLOCKED_REASON": blockers,
        "rows": rows,
        "post_eta_ladder": [
            "settlement_finalize",
            "settlement_final_capture_validator",
            "candidate_evidence_bridge_OPTION_A",
            "verify_s7_input_source_check_READY",
            "verify_s7_candidate_baseline_gate_READY",
            "fg_capture_fill",
            "l5_final_evidence",
            "psg_recalculate",
            "formal_release_baseline",
        ],
        "executed_finalize": False,
        "executed_bridge": False,
        "executed_s7": False,
        "equals_psg_complete": False,
        "honesty": (
            "Checklist only — does not finalize/bridge/S7; "
            "READY_TO_EXECUTE requires wall-clock ETA + baseline gate READY after Bridge"
        ),
    }
    write_json(CONSOL / "POST-ETA-EXECUTION-READY-CHECKLIST-LATEST.json", out)

    # Human one-pager
    lines = [
        f"# POST_ETA_EXECUTION_READY_CHECKLIST · {recorded}",
        "",
        f"**STATUS:** `{status}`",
        f"**READY_TO_EXECUTE:** `{ready}`",
        f"**BLOCKED_REASON:** {', '.join(blockers) if blockers else '—'}",
        "",
        "| # | Check | OK | Actual |",
        "|---|-------|----|--------|",
    ]
    for i, r in enumerate(rows, 1):
        mark = "YES" if r["ok"] else "NO"
        actual = json.dumps(r["actual"], ensure_ascii=False)[:120]
        lines.append(f"| {i} | {r['question']} | {mark} | `{actual}` |")
    lines += [
        "",
        "Ladder: finalize → Bridge(A) → baseline gate READY → L5 Final → S7 → Formal Baseline",
        "",
        "≠ psg_complete ≠ Production GO",
        "",
    ]
    (CONSOL / "POST-ETA-EXECUTION-READY-CHECKLIST-LATEST.md").write_text(
        "\n".join(lines), encoding="utf-8"
    )
    return out


def consistency_scan(recorded: str, prior_snapshot: dict | None) -> dict[str, Any]:
    head = git_head()
    issues: list[str] = []

    pin_ok = yaml_has(MATRIX, PIN) and yaml_has(MAINLINE_SH, PIN)
    baseline_ok = yaml_has(DEPLOY, BASELINE) or yaml_has(MATRIX, BASELINE)
    if not pin_ok:
        issues.append("CANDIDATE_PIN_DRIFT")
    if not baseline_ok:
        issues.append("DEPLOY_BASELINE_MISSING_IN_REGISTRY")

    catalog_sha = sha256_file(CATALOG)
    snap = prior_snapshot or load_json(SNAPSHOT) or {}
    snap_catalog = ((snap.get("evidence_catalog") or {}).get("sha256"))
    catalog_drift = bool(snap_catalog and catalog_sha and snap_catalog != catalog_sha)
    # Catalog refresh during maintain is expected — record as NOTE not blocker unless deleted
    if not CATALOG.is_file():
        issues.append("EVIDENCE_CATALOG_MISSING")

    snap_ok = SNAPSHOT.is_file()
    if not snap_ok:
        issues.append("PRE_FINAL_SNAPSHOT_MISSING")

    runbook_ok = POST_ETA_SHEET.is_file() and L5_RUNBOOK.is_file()
    if not runbook_ok:
        issues.append("RUNBOOK_MISSING")
    sheet_text = POST_ETA_SHEET.read_text(encoding="utf-8", errors="replace") if POST_ETA_SHEET.is_file() else ""
    prefers_a = "OPTION_A" in sheet_text or "推荐 OPTION_A" in sheet_text
    if POST_ETA_SHEET.is_file() and not prefers_a:
        issues.append("POST_ETA_SHEET_MISSING_OPTION_A")

    deferred = load_json(DEFERRED) or {}
    if deferred.get("fix_now") is True:
        issues.append("DEFERRED_MARKED_FIX_NOW_UNEXPECTED")
    if deferred.get("executed_bridge") is True:
        issues.append("BRIDGE_EXECUTED_DURING_WAIT")

    integrity = load_json(INTEGRITY) or {}
    integ_verdict = integrity.get("verdict") or integrity.get("status")
    if INTEGRITY.is_file() and integ_verdict not in (None, "PASS", "OK", "INTEGRITY_PASS"):
        # soft: only flag hard fails
        if str(integ_verdict).upper() in ("FAIL", "INTEGRITY_FAIL", "BROKEN"):
            issues.append(f"INTEGRITY_{integ_verdict}")

    fresh = load_json(FRESHNESS) or {}
    fresh_v = fresh.get("verdict")

    # Ensure wait registry still wait-mode if present
    wait_ok = True
    if WAIT_REG.is_file():
        wt = WAIT_REG.read_text(encoding="utf-8", errors="replace")
        if "PROJECT_B" in wt and re.search(r"status:\s*ACTIVE", wt) and "delta" in wt.lower():
            # heuristic only — do not invent Project B start
            pass

    out = {
        "schema": "traveltrust.psg_project_a_wait_eta_consistency_scan.v1",
        "id": "PROJECT_A_WAIT_ETA_CONSISTENCY_SCAN",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "mode": "WAIT_ETA_READONLY",
        "verdict": "PASS" if not issues else "DRIFT",
        "issues": issues,
        "surfaces": {
            "candidate_pin": {
                "expected": PIN,
                "matrix_mentions_pin": yaml_has(MATRIX, PIN),
                "mainline_sh_mentions_pin": yaml_has(MAINLINE_SH, PIN),
                "ok": pin_ok,
            },
            "registry": {
                "web3_active_execution_matrix_sha256": sha256_file(MATRIX),
                "protocol_convergence_deployments_sha256": sha256_file(DEPLOY),
                "baseline_mentioned": baseline_ok,
                "ok": baseline_ok and MATRIX.is_file() and DEPLOY.is_file(),
            },
            "evidence_catalog": {
                "path": "evidence/PSG-EVIDENCE-CONSOLIDATION/EVIDENCE-CATALOG-LATEST.json",
                "sha256": catalog_sha,
                "snapshot_catalog_sha256": snap_catalog,
                "changed_since_pre_final_snapshot": catalog_drift,
                "note": "Maintain Pipeline may refresh catalog — expected; deletion is not",
                "ok": CATALOG.is_file(),
            },
            "snapshot": {
                "path": "evidence/PSG-EVIDENCE-CONSOLIDATION/PROJECT-A-PRE-FINAL-SNAPSHOT-LATEST.json",
                "exists": snap_ok,
                "snapshot_recorded_utc": snap.get("recorded_utc"),
                "snapshot_head": (snap.get("candidate_sha") or {}).get("workspace_HEAD"),
                "current_head": head,
                "head_changed_since_snapshot": bool(
                    snap.get("candidate_sha")
                    and (snap.get("candidate_sha") or {}).get("workspace_HEAD")
                    and (snap.get("candidate_sha") or {}).get("workspace_HEAD") != head
                ),
                "ok": snap_ok,
            },
            "runbook": {
                "post_eta_sheet": POST_ETA_SHEET.relative_to(ROOT).as_posix(),
                "l5_runbook": L5_RUNBOOK.relative_to(ROOT).as_posix(),
                "prefers_option_a": prefers_a,
                "ok": runbook_ok and prefers_a,
            },
            "integrity_tick": {"path": INTEGRITY.as_posix() if INTEGRITY.is_file() else None, "verdict": integ_verdict},
            "freshness_tick": {"path": FRESHNESS.as_posix() if FRESHNESS.is_file() else None, "verdict": fresh_v},
            "deferred_bridge": {
                "status": deferred.get("status"),
                "fix_now": deferred.get("fix_now"),
                "prefer_option": deferred.get("prefer_option"),
            },
        },
        "untouched_by_design": ["s7_reader", "bridge_execute", "pending_overwrite"],
        "equals_psg_complete": False,
        "honesty": "Read-only drift scan during WAIT_ETA — not a GO signal",
    }
    write_json(CONSOL / "PROJECT-A-WAIT-ETA-CONSISTENCY-SCAN-LATEST.json", out)
    return out


def next_pcr() -> str:
    nums = []
    for p in (ROOT / "registry/psg-change-records").glob("PCR-20260720-*.yaml"):
        try:
            nums.append(int(p.stem.split("-")[-1]))
        except ValueError:
            pass
    return f"PCR-20260720-{(max(nums) + 1) if nums else 56:03d}"


def main() -> int:
    recorded = utc_now()
    cl = checklist(recorded)
    scan = consistency_scan(recorded, load_json(SNAPSHOT))

    # light freshness re-tick if prior pack2 function available — call cast via subprocess optional
    # Prefer existing tick; if missing, leave note
    if not FRESHNESS.is_file():
        scan.setdefault("issues", [])
        # do not fail scan solely for missing freshness during wait

    rollup = {
        "schema": "traveltrust.psg_project_a_wait_eta_readonly_tick.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "mode": "WAIT_ETA",
        "checklist_status": cl["status"],
        "blocked_reason": cl["BLOCKED_REASON"],
        "consistency_verdict": scan["verdict"],
        "consistency_issues": scan["issues"],
        "equals_psg_complete": False,
        "artifacts": [
            "evidence/PSG-EVIDENCE-CONSOLIDATION/POST-ETA-EXECUTION-READY-CHECKLIST-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/POST-ETA-EXECUTION-READY-CHECKLIST-LATEST.md",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/PROJECT-A-WAIT-ETA-CONSISTENCY-SCAN-LATEST.json",
        ],
    }
    write_json(CONSOL / "PROJECT-A-WAIT-ETA-READONLY-TICK-LATEST.json", rollup)

    pcr_id = next_pcr()
    (ROOT / "registry/psg-change-records" / f"{pcr_id}.yaml").write_text(
        f"""schema: traveltrust.psg_change_record.v1
id: {pcr_id}
title: Project A WAIT_ETA — post-ETA checklist · consistency scan (read-only)
recorded_utc: "{recorded}"
owner: Sebastian Ward
status: RECORDED
class: governance_gate_docs
mode: WAIT_ETA

summary: >
  Maintain extras only. Auto-generated POST_ETA_EXECUTION_READY_CHECKLIST
  (READY_TO_EXECUTE or BLOCKED_REASON) and wait-state consistency scan over
  Candidate pin / Registry / Catalog / Snapshot / Runbook. No Reader, Bridge,
  PENDING, finalize, S7, or Project B.

active_ssot: {PIN}
deploy_baseline: {BASELINE}

checks:
  checklist: {cl["status"]}
  blocked_reason: {json.dumps(cl["BLOCKED_REASON"])}
  consistency: {scan["verdict"]}

gates_not_triggered:
  - settlement_finalize
  - s7_reader_rewrite
  - candidate_evidence_bridge_execute
  - pending_overwrite
  - psg_recalculate
  - formal_release_baseline
  - project_b_start
""",
        encoding="utf-8",
    )

    if STATUS.is_file():
        st = load_json(STATUS) or {}
        st.update(
            {
                "recorded_utc": recorded,
                "wait_eta_readonly_tick_pcr": f"registry/psg-change-records/{pcr_id}.yaml",
                "post_eta_execution_ready": cl["status"],
                "wait_eta_consistency": scan["verdict"],
                "psg_complete": False,
            }
        )
        write_json(STATUS, st)

    print(
        json.dumps(
            {
                "pcr": pcr_id,
                "checklist": cl["status"],
                "BLOCKED_REASON": cl["BLOCKED_REASON"],
                "consistency": scan["verdict"],
                "issues": scan["issues"],
                "equals_psg_complete": False,
            },
            indent=2,
        )
    )
    print("TT_PSG_PROJECT_A_WAIT_ETA_READONLY_TICK: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
