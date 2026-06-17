#!/usr/bin/env python3
"""Assert MTM · Final Closure · Repo Align stats triple-sync; optional freeze artifact."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MTM = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md"
CLOSURE = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md"

sys.path.insert(0, str(ROOT / "scripts/release"))
from win_bash import bash_exe  # noqa: E402


def parse_mtm_key(text: str) -> dict[str, int]:
    m = re.search(r"TTG_GOV_MTM: ROWS=146 DEV=(\d+) TN=(\d+) HUMAN=(\d+) OPS=(\d+) DR=(\d+)", text)
    if not m:
        raise SystemExit("assert: missing TTG_GOV_MTM key in MTM")
    return {
        "DEV": int(m.group(1)),
        "TN": int(m.group(2)),
        "HUMAN": int(m.group(3)),
        "OPS": int(m.group(4)),
        "DR": int(m.group(5)),
    }


def parse_closure_key(text: str) -> dict:
    m = re.search(
        r"TTG_GOV_FINAL_CLOSURE: MODE=CERT_ONLY DEV=\d+ TN=(\d+) HUMAN=(\d+) OPS=(\d+) DR=(\d+) ENT=(\d+) CERT_QUEUE=(\d+/\d+)",
        text,
    )
    if not m:
        raise SystemExit("assert: missing TTG_GOV_FINAL_CLOSURE key")
    return {
        "TN": int(m.group(1)),
        "HUMAN": int(m.group(2)),
        "OPS": int(m.group(3)),
        "DR": int(m.group(4)),
        "ENT": int(m.group(5)),
        "CERT_QUEUE": m.group(6),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-freeze", default="")
    ap.add_argument("--stamp", default="")
    args = ap.parse_args()

    subprocess.run(
        [sys.executable, str(ROOT / "scripts/dev/apply-ttg-cert-tier-upgrades.py")],
        check=True,
        cwd=ROOT,
    )
    repo = subprocess.run(
        [bash_exe(), str(ROOT / "scripts/dev/run-tt-repository-alignment-cleanup-scan.sh")],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=ROOT,
    )
    if repo.returncode != 0:
        raise SystemExit(f"assert: repo align scan failed rc={repo.returncode}: {repo.stderr[:500]}")
    repo_line = ""
    for line in (repo.stdout + repo.stderr).splitlines():
        if line.startswith("TT_REPO_ALIGN:") and "ACTIVE=" in line:
            repo_line = line.strip()

    mtm_text = MTM.read_text(encoding="utf-8")
    closure_text = CLOSURE.read_text(encoding="utf-8")
    mtm_doc = parse_mtm_key(mtm_text)
    closure_doc = parse_closure_key(closure_text)

    errors: list[str] = []
    for k in ("TN", "HUMAN", "OPS", "DR"):
        if mtm_doc[k] != closure_doc[k]:
            errors.append(f"MTM vs Closure {k}: mtm={mtm_doc[k]} closure={closure_doc[k]}")
    if "DELETE_CANDIDATE=0" not in repo_line:
        errors.append(f"Repo align not clean: {repo_line}")
    if "P0_ROUTE_DRIFT=0" not in repo_line:
        errors.append(f"Repo P0 route drift open: {repo_line}")

    if errors:
        print("TTG_STATS_TRIPLE_SYNC: FAIL")
        for e in errors:
            print(" ", e)
        sys.exit(3)

    stamp = args.stamp or __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    mtm_key_m = re.search(r"`(TTG_GOV_MTM: [^`]+)`", mtm_text)
    closure_key_m = re.search(r"`(TTG_GOV_FINAL_CLOSURE: [^`]+)`", closure_text)
    payload = {
        "schema": "traveltrust.ttg-stats-triple-sync-freeze.v1",
        "stamp_utc": stamp,
        "frozen": True,
        "phase": "②",
        "mode": "CERT_ONLY",
        "mtm_key": mtm_key_m.group(1) if mtm_key_m else "",
        "closure_key": closure_key_m.group(1) if closure_key_m else "",
        "repo_align": repo_line,
        "tier_counts": mtm_doc,
        "cert_queue": closure_doc["CERT_QUEUE"],
        "enterprise_ent": closure_doc["ENT"],
        "follow_on": "Cert #2 Multi Identity only",
    }
    print(f"TTG_STATS_TRIPLE_SYNC: OK {json.dumps(mtm_doc, separators=(',', ':'))}")

    if args.write_freeze:
        out = ROOT / args.write_freeze
        out.mkdir(parents=True, exist_ok=True)
        (out / "TRIPLE-SYNC-FREEZE.v1.json").write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        (out / "FREEZE-RUN-SUMMARY.txt").write_text(
            f"TTG_STATS_TRIPLE_SYNC_FREEZE: OK frozen=1 cert_queue={closure_doc['CERT_QUEUE']}\n",
            encoding="utf-8",
        )
        latest = ROOT / "evidence/GO_ttg_stats_triple_sync_freeze/latest-stamp.txt"
        latest.parent.mkdir(parents=True, exist_ok=True)
        latest.write_text(stamp + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
