#!/usr/bin/env python3
"""P2FC · Freeze Candidate manifest（STRAT-F · GATE-P1-01 基线 · 不重复跑 gate）

  python scripts/dev/gen-p2fc-freeze-candidate-manifest.py
  python scripts/dev/gen-p2fc-freeze-candidate-manifest.py --build-log evidence/.../build.log

末行：TT_P2FC_FREEZE_CANDIDATE_MANIFEST: CANDIDATE|BLOCKED out=...
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROG_DIR = ROOT / "evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak"
OUT = PROG_DIR / "freeze-candidate.latest.json"
SITE10_LOG = ROOT / "frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
LEDGER_STATUS = ROOT / "evidence/COMPLEXITY_CONVERGENCE/ledger-status.latest.json"
GAP = PROG_DIR / "gap-inventory.latest.json"
GATE_P1_EVID = ROOT / "evidence/COMPLEXITY_CONVERGENCE/GATE-P1-01/phase1.closed.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def git_head() -> str:
    return subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()


def site10_baseline() -> dict[str, Any]:
    out: dict[str, Any] = {"log": SITE10_LOG.as_posix(), "pass": 0, "fail": 0, "ok": False}
    if not SITE10_LOG.is_file():
        return out
    text = SITE10_LOG.read_text(encoding="utf-8", errors="replace")
    out["pass"] = text.count("RECHECK_PASS:")
    out["fail"] = text.count("RECHECK_FAIL:")
    for line in text.splitlines():
        if "summary pass=" in line and "fail=0" in line:
            out["summary_line"] = line.strip()
            out["ok"] = "pass=25" in line or "pass=25 fail=0" in line
            break
    if not out.get("summary_line") and out["pass"] >= 25 and out["fail"] == 0:
        out["ok"] = True
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--build-log", default="")
    ap.add_argument("--parity-log", default="")
    ap.add_argument("--alignment-report", default="")
    args = ap.parse_args()

    PROG_DIR.mkdir(parents=True, exist_ok=True)

    ledger = load_json(LEDGER_STATUS) or {}
    gap = load_json(GAP) or {}
    gate_p1 = load_json(GATE_P1_EVID)
    baseline = site10_baseline()

    checks: list[dict[str, Any]] = []
    blocked: list[str] = []
    hard_block: list[str] = []

    def add_check(name: str, ok: bool, detail: str = "", *, hard: bool = False) -> None:
        checks.append({"name": name, "status": "PASS" if ok else "FAIL", "detail": detail})
        if not ok:
            blocked.append(name)
            if hard:
                hard_block.append(name)

    add_check("GATE-P1-01_baseline_25_25", baseline.get("ok", False), baseline.get("summary_line", ""), hard=True)
    add_check("GATE-P1-01_phase1_evidence", gate_p1 is not None, hard=True)
    add_check("ledger_ready_for_staging_live", bool(ledger.get("ready_for_staging_live")))
    add_check("ledger_no_drift", not (ledger.get("drift") or []), hard=True)

    if args.build_log:
        bl = Path(args.build_log)
        if bl.is_file():
            bt = bl.read_text(encoding="utf-8", errors="replace")
            add_check(
                "phase12_consistency_bundle",
                "TT_P2FC_PHASE12_CONSISTENCY: PASS" in bt
                or "TT_P2FC_PHASE12_CONSISTENCY: PARTIAL" in bt,
            )
            add_check(
                "minimal_smoke_parity",
                "TT_P2FC_MINIMAL_SMOKE_PARITY: PASS" in bt
                or "TT_P2FC_MINIMAL_SMOKE_PARITY: PARTIAL" in bt,
            )
        else:
            add_check("build_log_present", False, str(bl))

    freeze_active = (ROOT / "evidence/TESTNET_STAGING_FREEZE/ACTIVE.json").is_file()
    deploy_complete = (PROG_DIR / "deploy-complete.json").is_file()

    verdict = "CANDIDATE"
    if hard_block:
        verdict = "BLOCKED"
    elif not deploy_complete:
        verdict = "CANDIDATE"  # ① closed · ② staging-live pending

    payload: dict[str, Any] = {
        "schema": "traveltrust.p2fc_freeze_candidate_manifest.v1",
        "generated_at_utc": utc_now(),
        "strategy": "STRAT-F_FINAL_CANDIDATE_PRE_SOAK",
        "phase": "②",
        "verdict": verdict,
        "git_sha": git_head(),
        "baseline": {
            "gate_p1_01": baseline,
            "gate_p1_01_closed_at": (gate_p1 or {}).get("closed_at_utc"),
            "site10_log": SITE10_LOG.as_posix(),
            "policy": "no_gate_rerun — use existing 25/25 log",
        },
        "ledger": {
            "path": "registry/complexity-convergence-fix-ledger.v1.yaml",
            "status_path": LEDGER_STATUS.as_posix(),
            "counts": ledger.get("counts"),
            "ready_for_staging_live": ledger.get("ready_for_staging_live"),
            "ready_for_freeze_candidate": ledger.get("ready_for_freeze_candidate"),
            "drift": ledger.get("drift"),
        },
        "gap_inventory": {
            "path": GAP.as_posix(),
            "open_count": gap.get("open_count"),
            "fix_before_soak_open": gap.get("fix_before_soak_open"),
        },
        "checks": checks,
        "blocked": blocked,
        "staging": {
            "testnet_staging_freeze_active": freeze_active,
            "deploy_complete": deploy_complete,
        },
        "soak_prep": {
            "ready_to_launch": False,
            "requires_before_launch": [
                "bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --phase-staging-live",
                "TT_P2FC_FINAL_CANDIDATE_PHASE_STAGING_LIVE: PASS",
                "bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --engage-freeze",
                "P2FC_SOAK_SUPERSEDE=1 bash scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh --launch-soak",
            ],
            "launch_command": "P2FC_SOAK_SUPERSEDE=1 bash scripts/ops/p2fc-launch-staging-soak-72h.sh",
            "soak_dir": "evidence/P2FC_SOAK_72H_STAGING",
            "duration_hours": 72,
        },
        "ssot": [
            "docs/handbook/engineering/181-Complexity-Audit-Final-Candidate-Before-Soak.md",
            "registry/complexity-convergence-fix-ledger.v1.yaml",
            "scripts/ops/p2fc-pivot-final-candidate-pre-soak.sh",
        ],
    }
    if args.parity_log:
        payload["parity_log"] = args.parity_log
    if args.alignment_report:
        payload["alignment_report"] = args.alignment_report

    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"TT_P2FC_FREEZE_CANDIDATE_MANIFEST: {verdict} out={OUT.as_posix()} sha={payload['git_sha'][:12]}")
    return 0 if verdict != "BLOCKED" else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
