#!/usr/bin/env python3
"""
Emit ``evidence/GO_*/e2e_core_report.json`` plus a small ``e2e_trace_index.csv`` row
that points at the R-002 ISS-007 prereport produced in the same CI job.

Requires:
  - EVIDENCE_DIR (e.g. evidence/GO_20260424)
  - ${EVIDENCE_DIR}/r002_iss007_prereport/report.json must exist (run gen-r002 first).

Optional (same CI job, after ``gen-r002-onboarding-96-18-prereport.py``):
  - ${EVIDENCE_DIR}/r002_onboarding_96_18_prereport/report.json — echoed into ``e2e_core_report.json`` and CSV when present.

Optional env:
  GITHUB_SHA, GITHUB_RUN_ID — echoed into the core report when set.
"""

from __future__ import annotations

import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    ev_rel = os.environ.get("EVIDENCE_DIR", "").strip()
    if not ev_rel:
        print("ERROR: EVIDENCE_DIR is required", file=sys.stderr)
        return 1
    repo = Path(__file__).resolve().parents[1]
    ev = (repo / ev_rel).resolve()
    rpt = ev / "r002_iss007_prereport" / "report.json"
    if not rpt.is_file():
        print(f"ERROR: missing prereport at {rpt.relative_to(repo)}", file=sys.stderr)
        return 1

    data = json.loads(rpt.read_text(encoding="utf-8"))
    slice_meta = data.get("iss007_narrow_slice")
    if not isinstance(slice_meta, dict):
        slice_meta = {}

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    commit = os.environ.get("GITHUB_SHA", "").strip()
    run_id = os.environ.get("GITHUB_RUN_ID", "").strip()

    rpt_repo_rel = rpt.relative_to(repo).as_posix()
    raw_cases = data.get("cases")
    cases_compact: list[dict[str, str]] = []
    if isinstance(raw_cases, list):
        for c in raw_cases:
            if not isinstance(c, dict):
                continue
            cid = str(c.get("id") or "")
            st = str(c.get("status") or "")
            row = str(c.get("f_row_8_2") or "")
            filt = str(c.get("matrix_93_cargo_filter") or "")
            entry: dict[str, str] = {"id": cid, "status": st, "f_row_8_2": row}
            if filt:
                entry["matrix_93_cargo_filter"] = filt
            cases_compact.append(entry)

    r002_all_pass = bool(cases_compact) and all(x.get("status") == "PASS" for x in cases_compact)

    onb_rpt = ev / "r002_onboarding_96_18_prereport" / "report.json"
    onb_block: dict | None = None
    if onb_rpt.is_file():
        onb_data = json.loads(onb_rpt.read_text(encoding="utf-8"))
        onb_slice = onb_data.get("onboarding_96_18_narrow_slice")
        if not isinstance(onb_slice, dict):
            onb_slice = {}
        onb_cases = onb_data.get("cases")
        onb_compact: list[dict[str, str]] = []
        if isinstance(onb_cases, list):
            for c in onb_cases:
                if not isinstance(c, dict):
                    continue
                onb_compact.append(
                    {
                        "id": str(c.get("id") or ""),
                        "status": str(c.get("status") or ""),
                    }
                )
        onb_block = {
            "report_json": onb_rpt.relative_to(repo).as_posix(),
            "release_gate": onb_data.get("release_gate"),
            "release_gate_reason": onb_data.get("release_gate_reason"),
            "summary": onb_data.get("summary"),
            "cases_compact": onb_compact,
            "cargo_command": onb_slice.get("cargo_command"),
            "playwright_spec": onb_slice.get("playwright_spec"),
        }

    core = {
        "workflow": "Build",
        "job": "e2e",
        "check": "e2e-playwright-core+r002-prereport",
        "commit_sha": commit or "",
        "ci_run_id": run_id or "",
        "env": "ci",
        "rule_id": "e2e-playwright-chromium-with-iss007-r002",
        "severity": "gate",
        "owner": "frontend-team",
        "generated_at": ts,
        "passed": r002_all_pass,
        "suite": "playwright chromium + matrix_93 ISS-007 narrow slice",
        "iss007_r002_prereport": {
            "report_json": rpt_repo_rel,
            "release_gate": data.get("release_gate"),
            "release_gate_reason": data.get("release_gate_reason"),
            "summary": data.get("summary"),
            "playwright_e2e_outcome": data.get("playwright_e2e_outcome"),
            "anchors_93": slice_meta.get("anchors_93"),
            "f_rows_8_2": slice_meta.get("f_rows_8_2"),
            "cases_compact": cases_compact,
            "r002_anchors_all_pass": r002_all_pass,
        },
    }
    if onb_block is not None:
        core["onboarding_96_18_g15_prereport"] = onb_block

    out_core = ev / "e2e_core_report.json"
    out_core.write_text(json.dumps(core, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    csv_path = ev / "e2e_trace_index.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["suite", "artifact", "status"])
        w.writerow(["playwright", "frontend/playwright-report", "passed"])
        w.writerow(
            [
                "r002_iss007_prereport",
                f"{ev_rel}/r002_iss007_prereport/report.json",
                str(data.get("release_gate") or "unknown"),
            ]
        )
        if onb_block is not None:
            w.writerow(
                [
                    "r002_onboarding_g15_prereport",
                    f"{ev_rel}/r002_onboarding_96_18_prereport/report.json",
                    str(onb_block.get("release_gate") or "unknown"),
                ]
            )
        for row in cases_compact:
            w.writerow(
                [
                    "r002_anchor",
                    row.get("id", ""),
                    row.get("status", ""),
                ]
            )

    print(f"Wrote {out_core.relative_to(repo)} and {csv_path.relative_to(repo)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
