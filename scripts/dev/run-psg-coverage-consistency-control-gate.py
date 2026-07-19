#!/usr/bin/env python3
"""Evaluate PSG Coverage Consistency Control (Alignment Loop)."""
from __future__ import annotations

import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / "registry" / "psg-coverage-consistency-control.v1.yaml"
HUMAN = ROOT / "docs" / "runbook" / "TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md"
EV_DIR = ROOT / "evidence" / "GO_pre_eta_production_prep" / "coverage-gap-non-web3-20260719"
RUN_JSON = EV_DIR / "COVERAGE-RUN-LATEST.json"
REPORT_JSON = EV_DIR / "CONSISTENCY-CONTROL-GATE-LATEST.json"

COV_PATHS = [
    "registry/psg-coverage-consistency-control.v1.yaml",
    "docs/runbook/TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md",
    "registry/psg-coverage-measurement-final.v1.yaml",
    "docs/runbook/TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md",
    "crates/api/src/chain_off/auth.rs",
    "crates/api/src/routes/auth.rs",
    "scripts/dev/gen-psg-coverage-measurement-final.py",
    "scripts/dev/smoke-coverage-measurement-phase3-local.sh",
    "scripts/dev/stamp-psg-coverage-run.py",
    "scripts/dev/run-psg-coverage-consistency-control-gate.py",
    "scripts/gates/check-psg-coverage-consistency-control.sh",
]


def sh(*args: str) -> str:
    return subprocess.check_output(args, cwd=ROOT, text=True).strip()


def yaml_scalar(text: str, key: str) -> str | None:
    m = re.search(rf"^{re.escape(key)}:\s*(.+)$", text, re.M)
    if not m:
        return None
    v = m.group(1).strip()
    if v in ("null", "~", '""', "''"):
        return None
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    return v


def main() -> int:
    require_aligned = os.environ.get("TT_CC_REQUIRE_ALIGNED", "0") == "1"
    if not REG.is_file() or not HUMAN.is_file():
        print("TT_PSG_COVERAGE_CONSISTENCY_CONTROL: FAIL — missing registry/human SSOT")
        return 1

    reg_text = REG.read_text(encoding="utf-8")
    pinned = yaml_scalar(reg_text, "pinned_sha")
    verdict_reg = yaml_scalar(reg_text, "current_verdict") or "UNKNOWN"

    head = sh("git", "rev-parse", "HEAD")
    dirty = bool(sh("git", "status", "--porcelain"))
    cov_dirty = bool(
        subprocess.run(
            ["git", "status", "--porcelain", "--", *COV_PATHS],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        ).stdout.strip()
    )

    run: dict = {}
    if RUN_JSON.is_file():
        raw = json.loads(RUN_JSON.read_text(encoding="utf-8"))
        run = raw.get("coverage_run") or raw

    run_sha = run.get("git_sha") or ""
    run_env = run.get("environment") or ""
    run_verdict = run.get("consistency_verdict") or ""
    staging_meta = run.get("staging_meta_git_sha") or ""

    l1 = (
        "PASS"
        if (ROOT / "registry/psg-coverage-measurement-final.v1.yaml").is_file()
        and (ROOT / "docs/runbook/TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md").is_file()
        else "FAIL"
    )

    def is_ancestor(anc: str, desc: str) -> bool:
        r = subprocess.run(
            ["git", "merge-base", "--is-ancestor", anc, desc],
            cwd=ROOT,
            check=False,
        )
        return r.returncode == 0

    api_sha = str(run.get("api_sha") or "")
    web_sha = str(run.get("web_sha") or "")
    migration_state = str(run.get("migration_state") or "")

    l2 = "FAIL"
    # Git integrity: clean coverage paths; pinned_sha set; HEAD is pinned or descendant;
    # coverage_run.git_sha equals HEAD (deployed/tested tip).
    if (
        not cov_dirty
        and pinned
        and run_sha
        and run_sha == head
        and (pinned == head or is_ancestor(pinned, head))
    ):
        l2 = "PASS"
    if not pinned or cov_dirty:
        l2 = "FAIL"

    l3 = "FAIL"
    if (
        run_sha == head
        and run_env == "staging"
        and staging_meta == head
        and api_sha == head
        and (not web_sha or web_sha == head)
    ):
        l3 = "PASS"

    l4 = "FAIL"
    if (
        l3 == "PASS"
        and run_verdict == "ALIGNED_PASS"
        and migration_state == "matched"
    ):
        l4 = "PASS"

    l5 = "FAIL"
    if (
        verdict_reg in ("ALIGNED", "ALIGNED_PASS")
        and l2 == "PASS"
        and l3 == "PASS"
        and l4 == "PASS"
    ):
        l5 = "PASS"
    overall = (
        "ALIGNED_PASS"
        if all(x == "PASS" for x in (l1, l2, l3, l4, l5))
        else "NOT_ALIGNED"
    )

    report = {
        "schema": "traveltrust.psg_coverage_consistency_control_gate.v1",
        "machine_key": "TT_PSG_COVERAGE_CONSISTENCY_CONTROL",
        "recorded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "head_sha": head,
        "pinned_sha": pinned,
        "registry_current_verdict": verdict_reg,
        "working_tree_dirty": dirty,
        "coverage_paths_dirty": cov_dirty,
        "coverage_run_path": str(RUN_JSON.relative_to(ROOT)).replace("\\", "/")
        if RUN_JSON.is_file()
        else None,
        "checks": {
            "L1_LOCAL": l1,
            "L2_GIT": l2,
            "L3_STAGING_DEPLOY": l3,
            "L4_STAGING_EVIDENCE": l4,
            "L5_RECALCULATE": l5,
        },
        "overall_verdict": overall,
        "release_gate_stamp": {
            "psg": "CONDITIONAL_GO",
            "fix_required": 8,
            "consistency_control": overall,
        },
        "notes": [
            "LOCAL_PASS must not count as Coverage PASS until ALIGNED_PASS",
            "Phase3 local Metric FINAL remains local-only until this gate is ALIGNED_PASS",
        ],
    }

    EV_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"overall_verdict": overall, "checks": report["checks"]}, indent=2))
    print(f"TT_PSG_COVERAGE_CONSISTENCY_CONTROL: {overall}")
    print(
        f"  L1={l1} L2={l2} L3={l3} L4={l4} L5={l5} "
        f"HEAD={head[:12]} pinned={pinned or 'null'} dirty={int(dirty)} cov_dirty={int(cov_dirty)}"
    )
    print(f"  report={REPORT_JSON.relative_to(ROOT).as_posix()}")

    if require_aligned and overall != "ALIGNED_PASS":
        print(
            "TT_PSG_COVERAGE_CONSISTENCY_CONTROL: FAIL - Alignment Loop incomplete",
            flush=True,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
