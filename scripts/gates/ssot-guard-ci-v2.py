#!/usr/bin/env python3
"""
SSOT Guard CI v2 orchestrator: static guards (B-097, B-110) + response snapshot contract tests.

On any failure, writes target/ssot-guard-ci-v2-report.json (machine-readable) and prints
human hints (see scripts/gates/templates/SSOT_GUARD_FAILURE_REPORT.md).

Run from repo root: python3 scripts/gates/ssot-guard-ci-v2.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from ssot_guard_v2_constants import GATE_ID, REPORT_SCHEMA_VERSION

ROOT = Path(__file__).resolve().parents[2]
REPORT_PATH = ROOT / "target" / "ssot-guard-ci-v2-report.json"


def _child_python() -> str:
    """Windows Git Bash: `sys.executable` may point at WindowsApps `python3.exe` stub (child exit 49). Prefer real `python`."""
    import shutil

    for key in ("SSOT_GUARD_PYTHON", "PYTHON"):
        raw = (os.environ.get(key) or "").strip()
        if raw:
            p = raw if os.path.isfile(raw) else shutil.which(raw)
            if p and "windowsapps" not in p.lower():
                return p
    exe = (sys.executable or "").strip()
    if exe and "windowsapps" not in exe.lower():
        return exe
    w = shutil.which("python") or shutil.which("py")
    return w or exe or "python"


REMEDIATION = [
    "Review scripts/gates/templates/SSOT_GUARD_FAILURE_REPORT.md for report field meanings.",
    "New root-level chain SSOT on another HTTP surface: follow scripts/SSOT_GUARD_NEW_ENDPOINT.md (TT + allowlist).",
    "Overview: evidence/GO_20260407_SSOT_GUARDS.md; scripts README §二 CI Gate v2.",
]


def run_script(rel: str) -> tuple[int, str]:
    path = ROOT / rel
    p = subprocess.run(
        [_child_python(), str(path)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = (p.stderr or "") + (p.stdout or "")
    return p.returncode, out.strip()


def write_report(*, passed: bool, stages: list[dict]) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    body = {
        "schema_version": REPORT_SCHEMA_VERSION,
        "gate_id": GATE_ID,
        "passed": passed,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "stages": stages,
        "remediation_links": REMEDIATION,
    }
    REPORT_PATH.write_text(json.dumps(body, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def tail(s: str, max_chars: int = 4000) -> str:
    s = s.strip()
    if len(s) <= max_chars:
        return s
    return "…\n" + s[-max_chars:]


def main() -> int:
    stages: list[dict] = []

    for script_id, relpath in (
        ("static_b097_escrow", "scripts/gates/ssot-guard-escrow-orders-detail.py"),
        ("static_b110_pool", "scripts/gates/ssot-guard-b110-pool-ssot.py"),
        ("response_contract_snapshots", "scripts/gates/ssot-guard-response-contract.py"),
    ):
        code, out = run_script(relpath)
        ok = code == 0
        stages.append(
            {
                "stage_id": script_id,
                "script": relpath,
                "exit_code": code,
                "passed": ok,
                "output_tail": tail(out) if out else "",
            }
        )
        if not ok:
            write_report(passed=False, stages=stages)
            print(
                f"ERROR [ssot-guard-ci-v2]: stage {script_id} failed (exit {code}).\n"
                f"Report: {REPORT_PATH.relative_to(ROOT)}\n"
                f"---\n{tail(out, 2000)}",
                file=sys.stderr,
            )
            return 1

    write_report(passed=True, stages=stages)
    if os.environ.get("SSOT_GUARD_V2_VERBOSE") == "1":
        print(f"OK: ssot-guard-ci-v2 passed; report {REPORT_PATH.relative_to(ROOT)}")
    else:
        print("OK: ssot-guard-ci-v2 passed (static B-097 + B-110 + response contract)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
