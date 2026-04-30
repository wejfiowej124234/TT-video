#!/usr/bin/env python3
"""
Emit **report.json** (R-001 schema) for **96-18 / G15** onboarding automation slice.

Default directory: **`evidence/GO_YYYYMMDD_r002_onboarding_96_18_prereport/`**
(or **`{TRAVELTRUST_R002_REPORT_PARENT}/r002_onboarding_96_18_prereport/`** when parent is set,
same contract as **`gen-r002-iss007-prereport.py`**).

Cases:
  - **G15-ONB-CARGO**: **`cargo test -p traveltrust-api onboarding`** (PG matrix + stub subrouter).
  - **G15-ONB-E2E-SHELL**: **`PLAYWRIGHT_ONBOARDING_G15_OUTCOME`** (**PASS** / **FAIL** / **SKIP** / **N_A**);
    if unset, falls back to **`PLAYWRIGHT_E2E_STEP_OUTCOME`** (**GitHub Actions** **`steps.*.outcome`**:
    **success→PASS**, **failure→FAIL**, **cancelled/skipped→N_A**); else **NOT_RUN** with notes pointing to
    **`frontend/e2e/me-onboarding-96-18-shell.spec.ts`**.

**release_gate** is always **PARTIAL_GO** — **不**冒充全站 **R-002** **GO** / **ISS-007** 闭 (**96-18** 文档 **G15** **Target** 口径一致).

Validate:
  python scripts/validate-regression-report.py evidence/GO_YYYYMMDD_r002_onboarding_96_18_prereport/report.json
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

CARGO_FILTER = "onboarding"
PLAYWRIGHT_SPEC = "frontend/e2e/me-onboarding-96-18-shell.spec.ts"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def run_cargo_onboarding() -> tuple[int, str]:
    env = os.environ.copy()
    env.setdefault("P3_CHAIN_OFF", "1")
    cmd = [
        "cargo",
        "test",
        "-p",
        "traveltrust-api",
        CARGO_FILTER,
        "--",
        "--nocapture",
    ]
    p = subprocess.run(
        cmd,
        cwd=repo_root(),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=900,
    )
    out = (p.stdout or "") + "\n" + (p.stderr or "")
    return p.returncode, out


def parse_cargo_onboarding_ok(out: str) -> bool:
    return bool(re.search(r"test result:\s*ok\.\s+\d+\s+passed;\s+0\s+failed", out, re.I))


def e2e_status_from_env() -> tuple[str, str]:
    raw = os.environ.get("PLAYWRIGHT_ONBOARDING_G15_OUTCOME", "").strip().upper()
    if raw == "PASS":
        return "PASS", "PLAYWRIGHT_ONBOARDING_G15_OUTCOME=PASS (CI or local set after Playwright)."
    if raw == "FAIL":
        return "FAIL", "PLAYWRIGHT_ONBOARDING_G15_OUTCOME=FAIL — inspect Playwright artifacts."
    if raw in ("SKIP", "SKIPPED", "N_A", "NA"):
        return "N_A", f"PLAYWRIGHT_ONBOARDING_G15_OUTCOME={raw} — shell E2E not claimed for this run."

    pw = os.environ.get("PLAYWRIGHT_E2E_STEP_OUTCOME", "").strip().lower()
    if pw == "success":
        return (
            "PASS",
            "PLAYWRIGHT_E2E_STEP_OUTCOME=success (chromium e2e job; G15 shell in suite when not skipped).",
        )
    if pw == "failure":
        return "FAIL", "PLAYWRIGHT_E2E_STEP_OUTCOME=failure."
    if pw in ("cancelled", "skipped"):
        return "N_A", f"PLAYWRIGHT_E2E_STEP_OUTCOME={pw}."

    return (
        "NOT_RUN",
        "Set PLAYWRIGHT_ONBOARDING_G15_OUTCOME=PASS|FAIL or run after Playwright with "
        f"PLAYWRIGHT_E2E_STEP_OUTCOME (CI). Spec: `{PLAYWRIGHT_SPEC}`.",
    )


def main() -> int:
    ap_repo = repo_root()
    parent_rel = os.environ.get("TRAVELTRUST_R002_REPORT_PARENT", "").strip()
    if parent_rel:
        parent_path = (ap_repo / parent_rel).resolve()
        evidence_root = (ap_repo / "evidence").resolve()
        try:
            parent_path.relative_to(evidence_root)
        except ValueError:
            print(
                "ERROR: TRAVELTRUST_R002_REPORT_PARENT must be under evidence/",
                file=sys.stderr,
            )
            return 1
        ev_dir = parent_path / "r002_onboarding_96_18_prereport"
        slug = parent_path.name
        ev_name = f"{slug}_r002_onboarding_96_18_prereport"
    else:
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        ev_name = f"GO_{today}_r002_onboarding_96_18_prereport"
        ev_dir = ap_repo / "evidence" / ev_name

    ev_dir.mkdir(parents=True, exist_ok=True)
    db = os.environ.get("DATABASE_URL", "").strip()
    has_db = bool(db)
    gh_run = os.environ.get("GITHUB_RUN_ID", "").strip()
    gh_sha = os.environ.get("GITHUB_SHA", "").strip()

    sub_cargo = ev_dir / "G15-ONB-CARGO"
    sub_cargo.mkdir(parents=True, exist_ok=True)
    notes_cargo = sub_cargo / "notes.md"
    code, out = run_cargo_onboarding()
    notes_cargo.write_text(
        f"# G15-ONB-CARGO\n\n`cargo test -p traveltrust-api {CARGO_FILTER}` exit={code}\n\n"
        f"```\n{out[-16000:]}\n```\n",
        encoding="utf-8",
    )
    if code != 0 or not parse_cargo_onboarding_ok(out):
        cargo_status = "FAIL"
        cargo_blocker = True
    else:
        cargo_status = "PASS"
        cargo_blocker = False

    sub_e2e = ev_dir / "G15-ONB-E2E-SHELL"
    sub_e2e.mkdir(parents=True, exist_ok=True)
    e2e_status, e2e_note = e2e_status_from_env()
    notes_e2e = sub_e2e / "notes.md"
    notes_e2e.write_text(
        f"# G15-ONB-E2E-SHELL\n\n{e2e_note}\n\nSpec: `{PLAYWRIGHT_SPEC}`\n",
        encoding="utf-8",
    )

    pass_n = sum(1 for s in (cargo_status, e2e_status) if s == "PASS")
    fail_n = sum(1 for s in (cargo_status, e2e_status) if s == "FAIL")
    not_run = sum(1 for s in (cargo_status, e2e_status) if s == "NOT_RUN")
    blocked = 0
    na = sum(1 for s in (cargo_status, e2e_status) if s == "N_A")

    if fail_n:
        rg = "NO_GO"
        reason = (
            "96-18 G15 prereport: at least one case FAIL (see notes under "
            f"{ev_name}/). Not a full-site R-002 close."
        )
    else:
        rg = "PARTIAL_GO"
        reason = (
            "96-18 / G15 narrow slice: cargo `onboarding` pack + optional Playwright shell; "
            "does not claim staging full-matrix report.json GO (R-002 / ISS-007 remain broader)."
        )
        if not_run and e2e_status == "NOT_RUN":
            reason += " Playwright G15 shell NOT_RUN unless PLAYWRIGHT_ONBOARDING_G15_OUTCOME set."

    cases: list[dict] = [
        {
            "id": "G15-ONB-CARGO",
            "status": cargo_status,
            "evidence_path": sub_cargo.relative_to(ap_repo).as_posix(),
            "blocker": cargo_blocker,
            "notes": notes_cargo.relative_to(ap_repo).as_posix()
            + (f" | database={'enabled' if has_db else 'disabled'}" + (f" | github.run_id={gh_run}" if gh_run else "")),
            "matrix_93_cargo_filter": CARGO_FILTER,
        },
        {
            "id": "G15-ONB-E2E-SHELL",
            "status": e2e_status,
            "evidence_path": sub_e2e.relative_to(ap_repo).as_posix(),
            "blocker": False,
            "notes": notes_e2e.relative_to(ap_repo).as_posix(),
            "playwright_spec": PLAYWRIGHT_SPEC,
        },
    ]

    report = {
        "schema_version": "1",
        "run_id": ev_name,
        "title": "R-002 prereport · 96-18 G15 (onboarding API pack + optional Playwright shell)",
        "executor": "scripts/gen-r002-onboarding-96-18-prereport.py",
        "started_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "finished_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "environment": {
            "name": "local",
            "database": "enabled" if has_db else "disabled",
            "chain_mode": "chain_off",
            "auth_mode": "bearer",
        },
        "release_gate": rg,
        "release_gate_reason": reason,
        "onboarding_96_18_narrow_slice": {
            "scope_note": (
                "Admission-fee domain only (96-18 §12 / G15). "
                "Does not substitute ISS-007 or full 93 matrix R-002 GO."
            ),
            "cargo_command": f"cargo test -p traveltrust-api {CARGO_FILTER}",
            "playwright_spec": PLAYWRIGHT_SPEC,
        },
        "cases": cases,
        "summary": {
            "PASS": pass_n,
            "FAIL": fail_n,
            "BLOCKED": blocked,
            "N_A": na,
            "NOT_RUN": not_run,
        },
    }
    if gh_run:
        report["github_run_id"] = gh_run
    if gh_sha:
        report["commit_sha"] = gh_sha

    out_json = ev_dir / "report.json"
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out_json}")
    return 0 if fail_n == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
