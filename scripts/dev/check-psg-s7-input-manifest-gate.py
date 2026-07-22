#!/usr/bin/env python3
"""S7 Input Manifest hash gate.

Modes:
  snapshot-before  — forensic BEFORE (current PENDING; may be OLD_FCG)
  lock-after-bridge — write AFTER manifest once Bridge A materialized Candidate inputs
  verify-pre-s7     — require AFTER manifest exists and matches current PENDING hashes + pin

Does NOT rewrite PENDING / Reader / run S7.

  python scripts/dev/check-psg-s7-input-manifest-gate.py snapshot-before
  python scripts/dev/check-psg-s7-input-manifest-gate.py verify-pre-s7
  python scripts/dev/check-psg-s7-input-manifest-gate.py lock-after-bridge
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"

S7_PENDING = [
    "L1-PRODUCT-VALIDATION-LATEST.json",
    "L2-DATA-VALIDATION-HARDENED-LATEST.json",
    "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
    "L4-OPERATIONS-VALIDATION-LATEST.json",
    "L5-FG-WEB3-EMPIRICAL-LATEST.json",
]

CANDIDATE_POINTERS = [
    "evidence/PSG-L1-product/L1-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-L2-data/L2-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-L3-security/L3-S7-FINAL-INPUT-LATEST.json",
    "evidence/PSG-L4-operations/L4-S7-FINAL-INPUT-LATEST.json",
    "evidence/GO_fg15_observation_48h_candidate_v2/L5-S7-FINAL-INPUT-LATEST.json",
]

BEFORE = CONSOL / "S7-INPUT-MANIFEST-BEFORE-LATEST.json"
AFTER = CONSOL / "S7-INPUT-MANIFEST-AFTER-LATEST.json"
GATE_OUT = CONSOL / "S7-INPUT-MANIFEST-GATE-LATEST.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def rel_posix(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def extract_meta(path: Path) -> dict[str, Any]:
    meta: dict[str, Any] = {
        "path": rel_posix(path),
        "exists": path.is_file(),
        "sha256": sha256_file(path),
        "psg_release_version": None,
        "deploy_baseline": None,
    }
    if not path.is_file():
        return meta
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        meta["error"] = str(e)
        return meta
    meta["psg_release_version"] = doc.get("psg_release_version")
    meta["deploy_baseline"] = (
        doc.get("active_deploy_baseline")
        or doc.get("deploy_baseline")
        or doc.get("baseline_under_test")
    )
    return meta


def build_manifest(kind: str, recorded: str) -> dict[str, Any]:
    files = []
    for name in S7_PENDING:
        row = extract_meta(PENDING / name)
        row["role"] = "s7_pending_input"
        row["pending_file"] = name
        files.append(row)
    pointers = []
    for rel in CANDIDATE_POINTERS:
        row = extract_meta(ROOT / rel)
        row["role"] = "candidate_pointer_pack"
        pointers.append(row)

    all_candidate = all(
        f.get("psg_release_version") == PIN and f.get("deploy_baseline") == BASELINE
        for f in files
        if f.get("exists")
    )
    return {
        "schema": "traveltrust.psg_s7_input_manifest.v1",
        "kind": kind,
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "candidate_pin": PIN,
        "timestamp": recorded,
        "files": files,
        "candidate_pointers": pointers,
        "all_pending_match_candidate_pin": all_candidate,
        "honesty": (
            "BEFORE may be OLD_FCG forensic snapshot. "
            "AFTER must be locked only after Bridge A materialization. "
            "verify-pre-s7 compares current PENDING to AFTER."
        ),
        "equals_psg_complete": False,
    }


def snapshot_before() -> dict[str, Any]:
    recorded = utc_now()
    man = build_manifest("BEFORE", recorded)
    write_json(BEFORE, man)
    # also timestamped immutable copy
    stamp = recorded.replace(":", "").replace("-", "")
    write_json(CONSOL / f"S7-INPUT-MANIFEST-BEFORE-{stamp}.json", man)
    return man


def lock_after_bridge() -> dict[str, Any]:
    recorded = utc_now()
    man = build_manifest("AFTER", recorded)
    if not man["all_pending_match_candidate_pin"]:
        man["lock_refused"] = True
        man["reason"] = "PENDING not exclusively Candidate v2 — refuse AFTER lock"
        write_json(CONSOL / "S7-INPUT-MANIFEST-AFTER-REFUSED-LATEST.json", man)
        return man
    write_json(AFTER, man)
    stamp = recorded.replace(":", "").replace("-", "")
    write_json(CONSOL / f"S7-INPUT-MANIFEST-AFTER-{stamp}.json", man)
    return man


def verify_pre_s7() -> dict[str, Any]:
    recorded = utc_now()
    after = None
    if AFTER.is_file():
        after = json.loads(AFTER.read_text(encoding="utf-8"))
    current = build_manifest("CURRENT", recorded)

    mismatches = []
    if after is None:
        status = "BLOCKED_NO_AFTER_MANIFEST"
        message = "Bridge A not locked — run lock-after-bridge after materializing Candidate PENDING"
    else:
        by_name = {f["pending_file"]: f for f in after.get("files", []) if f.get("pending_file")}
        for f in current["files"]:
            name = f["pending_file"]
            exp = by_name.get(name)
            if not exp:
                mismatches.append({"file": name, "issue": "missing_in_after"})
                continue
            if f.get("sha256") != exp.get("sha256"):
                mismatches.append(
                    {
                        "file": name,
                        "issue": "HASH_DRIFT",
                        "expected": exp.get("sha256"),
                        "actual": f.get("sha256"),
                    }
                )
            if f.get("psg_release_version") != PIN or f.get("deploy_baseline") != BASELINE:
                mismatches.append(
                    {
                        "file": name,
                        "issue": "WRONG_BASELINE",
                        "psg_release_version": f.get("psg_release_version"),
                        "deploy_baseline": f.get("deploy_baseline"),
                    }
                )
        if mismatches:
            status = "BLOCKED_MANIFEST_MISMATCH"
            message = "manifest == current FAILED — refuse S7"
        else:
            status = "READY"
            message = "manifest == current AND Candidate pin OK — S7 input hash gate PASS"

    out = {
        "schema": "traveltrust.psg_s7_input_manifest_gate.v1",
        "recorded_utc": recorded,
        "status": status,
        "message": message,
        "mismatches": mismatches,
        "after_manifest": "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-INPUT-MANIFEST-AFTER-LATEST.json"
        if AFTER.is_file()
        else None,
        "before_manifest": "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-INPUT-MANIFEST-BEFORE-LATEST.json"
        if BEFORE.is_file()
        else None,
        "current_pending_match_candidate": current["all_pending_match_candidate_pin"],
        "executed_s7": False,
        "equals_psg_complete": False,
    }
    write_json(GATE_OUT, out)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "mode",
        choices=["snapshot-before", "lock-after-bridge", "verify-pre-s7"],
        nargs="?",
        default="snapshot-before",
    )
    args = ap.parse_args()
    if args.mode == "snapshot-before":
        man = snapshot_before()
        # also emit gate status showing AFTER missing (expected pre-ETA)
        gate = verify_pre_s7()
        print(
            json.dumps(
                {
                    "mode": "snapshot-before",
                    "before_files": len(man["files"]),
                    "all_pending_match_candidate_pin": man["all_pending_match_candidate_pin"],
                    "verify_status": gate["status"],
                },
                indent=2,
            )
        )
        print("TT_PSG_S7_INPUT_MANIFEST: BEFORE_RECORDED")
        return 0
    if args.mode == "lock-after-bridge":
        man = lock_after_bridge()
        print(
            json.dumps(
                {
                    "mode": "lock-after-bridge",
                    "locked": not man.get("lock_refused"),
                    "all_pending_match_candidate_pin": man.get("all_pending_match_candidate_pin"),
                },
                indent=2,
            )
        )
        print(
            "TT_PSG_S7_INPUT_MANIFEST: "
            + ("AFTER_LOCKED" if not man.get("lock_refused") else "AFTER_REFUSED")
        )
        return 0 if not man.get("lock_refused") else 2
    gate = verify_pre_s7()
    print(json.dumps({"mode": "verify-pre-s7", "status": gate["status"], "mismatches": gate["mismatches"]}, indent=2))
    print(f"TT_PSG_S7_INPUT_MANIFEST_GATE: {gate['status']}")
    return 0 if gate["status"] == "READY" else 2


if __name__ == "__main__":
    raise SystemExit(main())
