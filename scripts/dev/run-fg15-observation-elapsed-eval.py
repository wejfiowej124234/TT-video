#!/usr/bin/env python3
"""
FG-15 ELAPSED PASS evaluator.

PASS only when:
  - now >= window_ends_utc (wall-clock 48h)
  - freeze intact (Release_SHA + addresses)
  - no open anomalies in ledger (or anomaly_count == 0 across samples)
  - at least N successful samples

REFUSES early. Never flips ACTIVE / Production GO.
On PASS: stamps ELAPSED, regenerates Owner Sign-off package eligibility, optional recalculate.
"""

# --- FINAL RELEASE pollution guard ---
import os as _tt_os, sys as _tt_sys
if _tt_os.environ.get('TRAVELTRUST_ALLOW_HISTORICAL_BASELINE') != '1':
    _tt_sys.stderr.write(
        'DEPRECATED: FG-15 historical script refused.
'
        'Active = Candidate v2 / FINAL RELEASE. Forensic: TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1
'
    )
    raise SystemExit(2)
# --- end guard ---


from __future__ import annotations


# Baseline Migration v2 — FG-15-A / Hardened forensic tooling (default refuse)
import sys as _tt_sys
from pathlib import Path as _tt_Path
_tt_lib = _tt_Path(__file__).resolve().parent / "lib"
if str(_tt_lib) not in _tt_sys.path:
    _tt_sys.path.insert(0, str(_tt_lib))
from tt_refuse_historical_baseline import refuse_unless_historical_allowed as _tt_refuse_hist
_tt_refuse_hist(__file__)
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3"
ARCH = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/audit_trail"
EXPECTED_SHA = "09c72b934b62f848e60b38bcc7ff0e6cac44f923"
MIN_SAMPLES = int(__import__("os").environ.get("FG15_MIN_SAMPLES", "3"))


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_utc(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def load(name: str) -> dict:
    p = PENDING / name
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    stamp = utc_now()
    start = load("OBSERVATION-48H-START-LATEST.json")
    freeze = load("OBSERVATION-48H-WINDOW-FREEZE-LATEST.json")
    if not start or not freeze:
        raise SystemExit("missing START or FREEZE artifacts")

    ends = parse_utc(start["window_ends_utc"])
    started = parse_utc(start["window_started_utc"])
    release_sha = freeze.get("Release_SHA") or start.get("Release_SHA")

    reasons = []
    if release_sha != EXPECTED_SHA:
        reasons.append(f"Release_SHA mismatch {release_sha}")
    if stamp < ends:
        remaining = ends - stamp
        reasons.append(
            f"wall_clock_not_elapsed remaining_seconds={int(remaining.total_seconds())} ends={start['window_ends_utc']}"
        )

    # Sample stats
    samples_dir = ARCH / "fg15_observation_48h" / "samples"
    samples = sorted(samples_dir.glob("sample-*.json")) if samples_dir.is_dir() else []
    ok_n = 0
    fail_n = 0
    for sp in samples:
        d = json.loads(sp.read_text(encoding="utf-8"))
        if d.get("sample_ok"):
            ok_n += 1
        else:
            fail_n += 1
    if ok_n < MIN_SAMPLES:
        reasons.append(f"insufficient_ok_samples ok={ok_n} min={MIN_SAMPLES}")
    if fail_n > 0:
        reasons.append(f"anomaly_samples={fail_n}")

    anom_ledger = ARCH / "fg15_observation_48h" / "OBSERVATION-48H-ANOMALY-LEDGER.jsonl"
    anom_lines = 0
    if anom_ledger.is_file():
        anom_lines = sum(1 for _ in anom_ledger.open(encoding="utf-8") if _.strip())
    if anom_lines > 0:
        reasons.append(f"anomaly_ledger_entries={anom_lines}")

    if reasons:
        refused = {
            "schema": "traveltrust.observation_48h_elapsed_eval.v1",
            "recorded_utc": stamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "elapsed_pass": False,
            "status": "REFUSED_NOT_ELAPSED_OR_UNSTABLE",
            "window_started_utc": start.get("window_started_utc"),
            "window_ends_utc": start.get("window_ends_utc"),
            "Release_SHA": release_sha,
            "samples_ok": ok_n,
            "samples_fail": fail_n,
            "refuse_reasons": reasons,
            "ACTIVE_FLIP": "FORBIDDEN",
            "production_go": False,
            "verdict": "FG15_ELAPSED_PASS_REFUSED",
            "honesty": "Do not claim FG-15 PASS before wall-clock end + clean samples",
        }
        text = json.dumps(refused, indent=2, ensure_ascii=False) + "\n"
        (PENDING / "OBSERVATION-48H-ELAPSED-EVAL-LATEST.json").write_text(text, encoding="utf-8")
        (FG / "OBSERVATION-48H-ELAPSED-EVAL-LATEST.json").write_text(text, encoding="utf-8")
        print(json.dumps({"elapsed_pass": False, "reasons": reasons}, indent=2))
        return 2

    # PASS
    pack = {
        "schema": "traveltrust.observation_48h_elapsed_pass.v1",
        "fgcase": "FGCASE-FG-15",
        "recorded_utc": stamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "elapsed_pass": True,
        "status": "ELAPSED_PASS",
        "window_started_utc": start.get("window_started_utc"),
        "window_ends_utc": start.get("window_ends_utc"),
        "actual_elapsed_hours": (stamp - started).total_seconds() / 3600.0,
        "Release_SHA": release_sha,
        "samples_ok": ok_n,
        "samples_fail": fail_n,
        "planes": ["Chain", "Indexer", "API", "DB", "Error", "Security_Events"],
        "ACTIVE_FLIP": "FORBIDDEN",
        "production_go": False,
        "verdict": "FG15_48H_OBSERVATION_ELAPSED_PASS",
        "next": [
            "run-owner-completion-signoff-package.py",
            "Owner_human_signature",
            "run-psg-completion-matrix-recalculate.py",
        ],
    }
    text = json.dumps(pack, indent=2, ensure_ascii=False) + "\n"
    (PENDING / "OBSERVATION-48H-ELAPSED-PASS-LATEST.json").write_text(text, encoding="utf-8")
    (FG / "OBSERVATION-48H-ELAPSED-PASS-LATEST.json").write_text(text, encoding="utf-8")
    (PENDING / "OBSERVATION-48H-ELAPSED-EVAL-LATEST.json").write_text(text, encoding="utf-8")

    rem = ARCH / "fg15_observation_48h"
    rem.mkdir(parents=True, exist_ok=True)
    (rem / "OBSERVATION-48H-ELAPSED-PASS-LATEST.json").write_text(text, encoding="utf-8")

    # Mark start closed
    start2 = dict(start)
    start2["status"] = "ELAPSED_PASS"
    start2["elapsed_pass"] = True
    start2["elapsed_pass_utc"] = pack["recorded_utc"]
    start2["verdict"] = "FG15_48H_OBSERVATION_ELAPSED_PASS"
    (PENDING / "OBSERVATION-48H-START-LATEST.json").write_text(
        json.dumps(start2, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(json.dumps({"elapsed_pass": True, "verdict": pack["verdict"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
