#!/usr/bin/env python3
"""Merge ADM-U02 smoke + Playwright into report.json (Phase ②)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: merge-adm-u02-staging-report.py <evidence_dir>", file=sys.stderr)
        return 2

    evid = Path(sys.argv[1])
    smoke_log = evid / "smoke-run.log"
    pw_exit = evid / "playwright-exit.txt"
    report_path = evid / "report.json"

    smoke_pass = False
    if smoke_log.is_file():
        text = smoke_log.read_text(encoding="utf-8", errors="replace")
        smoke_pass = "TT_ADM_U02_STAGING: PASS" in text

    playwright_pass = False
    if pw_exit.is_file():
        m = re.search(r"playwright_exit=(\d+)", pw_exit.read_text(encoding="utf-8", errors="replace"))
        playwright_pass = bool(m and m.group(1) == "0")
    elif (evid / "playwright-run.log").is_file():
        pw_text = (evid / "playwright-run.log").read_text(encoding="utf-8", errors="replace")
        playwright_pass = "passed" in pw_text and "failed" not in pw_text.split("passed")[-1][:80]

    release_gate = "GO" if smoke_pass and playwright_pass else "NO_GO"

    report: dict = {}
    if report_path.is_file():
        try:
            report = json.loads(report_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            report = {}

    report.update(
        {
            "artifact": "ADM-U02",
            "phase": "②",
            "deployment_kind": "persistent_staging",
            "release_gate": release_gate,
            "summary": {
                "smoke_pass": smoke_pass,
                "playwright_pass": playwright_pass,
            },
            "evidence_files": [
                f
                for f in ("smoke-run.log", "playwright-run.log", "playwright-exit.txt", "STATUS.txt")
                if (evid / f).is_file()
            ],
            "staging_api_base": report.get("staging_api_base")
            or __import__("os").environ.get("STAGING_API_BASE", "https://tt-api-staging.fly.dev"),
        }
    )

    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"merge-adm-u02: OK release_gate={release_gate} "
        f"smoke={smoke_pass} playwright={playwright_pass}"
    )
    return 0 if release_gate == "GO" else 1


if __name__ == "__main__":
    raise SystemExit(main())
