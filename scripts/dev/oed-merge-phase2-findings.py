#!/usr/bin/env python3
"""OED · merge API + PG + Playwright into oed-findings.json."""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


def load_json(path: Path, default: dict) -> dict:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    out = Path(os.environ.get("OED_OUT", root / "evidence/order-escrow-dispute-deep-audit/latest"))
    partial = load_json(out / "oed-findings-partial.json", {"verdict": "FAIL", "probes": [], "summary": {}})
    pg = load_json(out / "oed-pg-findings.json", {"verdict": "PASS", "probes": []})
    pw = load_json(out / "oed-playwright-findings.json", {"verdict": "PASS", "ui_probes": []})

    probes = list(partial.get("probes", []))
    for p in pg.get("probes", []):
        probes.append({**p, "section": "pg_consistency"})
    for p in pw.get("ui_probes", []):
        probes.append({**p, "section": "ui_corridor"})

    fails = [p for p in probes if p.get("status") not in ("PASS", "WARN")]
    verdict = "PASS" if not fails and partial.get("verdict") == "PASS" and pg.get("verdict") == "PASS" and pw.get("verdict") == "PASS" else "FAIL"
    if partial.get("verdict") == "FAIL":
        verdict = "FAIL"

    try:
        git_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    except Exception:
        git_sha = partial.get("git_sha", "unknown")

    merged = {
        **partial,
        "verdict": verdict,
        "git_sha": git_sha,
        "pg_consistency": pg,
        "ui_corridor": pw,
        "probes": probes,
        "summary": {
            "total": len(probes),
            "pass": sum(1 for p in probes if p.get("status") == "PASS"),
            "fail": sum(1 for p in probes if p.get("status") == "FAIL"),
            "warn": sum(1 for p in probes if p.get("status") == "WARN"),
        },
        "p0": sum(1 for p in fails if p.get("section") != "pg_consistency"),
        "p1": 0,
        "p2": sum(1 for p in pg.get("probes", []) if p.get("status") == "WARN"),
    }
    (out / "oed-findings.json").write_text(json.dumps(merged, indent=2), encoding="utf-8")
    print(f"OED_MERGE: {verdict}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
