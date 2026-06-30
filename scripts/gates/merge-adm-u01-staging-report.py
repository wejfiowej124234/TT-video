#!/usr/bin/env python3
"""Merge ADM-U01 API matrix + Playwright shell into report.json (Phase ②)."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: merge-adm-u01-staging-report.py <evidence_dir>", file=sys.stderr)
        return 2

    evid = Path(sys.argv[1])
    api_report_path = evid / "report.json"
    pw_path = evid / "playwright-shell-matrix.json"

    if not api_report_path.is_file():
        print(f"merge-adm-u01: FAIL missing {api_report_path}", file=sys.stderr)
        return 1

    report = json.loads(api_report_path.read_text(encoding="utf-8"))
    api_gate = report.get("release_gate", "NO_GO")

    pw_summary = None
    pw_gate = "GO"
    if pw_path.is_file():
        pw = json.loads(pw_path.read_text(encoding="utf-8"))
        pw_summary = pw.get("summary") or {}
        if int(pw_summary.get("fail") or 0) > 0:
            pw_gate = "NO_GO"
        rows = pw.get("rows") or []
        if rows and int(pw_summary.get("total") or 0) == 0:
            pw_gate = "NO_GO"

    merged_gate = "GO" if api_gate == "GO" and pw_gate == "GO" else "NO_GO"
    report["release_gate"] = merged_gate
    report["api_matrix_summary"] = report.get("summary")
    if pw_summary is not None:
        report["playwright_shell_summary"] = pw_summary
        files = list(report.get("evidence_files") or [])
        if "playwright-shell-matrix.json" not in files:
            files.append("playwright-shell-matrix.json")
        report["evidence_files"] = files

    api_report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"merge-adm-u01: OK release_gate={merged_gate} api={api_gate} playwright={pw_gate}")
    return 0 if merged_gate == "GO" else 1


if __name__ == "__main__":
    raise SystemExit(main())
