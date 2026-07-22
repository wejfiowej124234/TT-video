#!/usr/bin/env python3
"""S7 Candidate baseline anti-misread gate (read-only).

Future S7 must satisfy:
  S7_INPUT_VERSION == CURRENT_CANDIDATE_VERSION
else:
  BLOCKED_WRONG_BASELINE

Does NOT rewrite Reader, Bridge, PENDING, or run Recalculate.

  python scripts/dev/check-psg-s7-candidate-baseline-gate.py
"""
from __future__ import annotations

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
SOURCE_CHECK = CONSOL / "S7-INPUT-SOURCE-CHECK-LATEST.json"

S7_PENDING = [
    "L1-PRODUCT-VALIDATION-LATEST.json",
    "L2-DATA-VALIDATION-HARDENED-LATEST.json",
    "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
    "L4-OPERATIONS-VALIDATION-LATEST.json",
    "L5-FG-WEB3-EMPIRICAL-LATEST.json",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def file_sha(path: Path) -> str | None:
    if not path.is_file():
        return None
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def extract_version(doc: dict) -> dict[str, str | None]:
    return {
        "psg_release_version": doc.get("psg_release_version")
        or doc.get("psg_release")
        or None,
        "active_deploy_baseline": doc.get("active_deploy_baseline")
        or doc.get("deploy_baseline")
        or doc.get("baseline_under_test")
        or None,
    }


def classify_row(name: str) -> dict[str, Any]:
    p = PENDING / name
    row: dict[str, Any] = {
        "pending_file": name,
        "exists": p.is_file(),
        "sha256": file_sha(p),
        "s7_input_version": None,
        "deploy_baseline": None,
        "match_current_candidate": False,
        "class": "MISSING",
    }
    if not p.is_file():
        return row
    try:
        doc = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        row["class"] = "INVALID_JSON"
        row["error"] = str(e)
        return row
    ver = extract_version(doc)
    row["s7_input_version"] = ver["psg_release_version"]
    row["deploy_baseline"] = ver["active_deploy_baseline"]
    pin_ok = ver["psg_release_version"] == PIN
    base_ok = ver["active_deploy_baseline"] == BASELINE
    if pin_ok and base_ok:
        row["class"] = "CANDIDATE_V2"
        row["match_current_candidate"] = True
    elif base_ok and not pin_ok:
        row["class"] = "BASELINE_OK_PIN_MISMATCH"
        row["match_current_candidate"] = False
    elif ver["active_deploy_baseline"] in (
        "v311_sepolia_clean_baseline",
        "v311_sepolia_clean",
    ) or (
        ver["active_deploy_baseline"]
        and BASELINE not in str(ver["active_deploy_baseline"])
        and "candidate" not in str(ver["active_deploy_baseline"]).lower()
    ):
        row["class"] = "OLD_FCG"
        row["match_current_candidate"] = False
    else:
        row["class"] = "WRONG_OR_UNKNOWN_BASELINE"
        row["match_current_candidate"] = False
    return row


def run_gate(recorded: str | None = None) -> dict[str, Any]:
    recorded = recorded or utc_now()
    rows = [classify_row(n) for n in S7_PENDING]
    all_match = all(r.get("match_current_candidate") for r in rows)
    classes = sorted({r["class"] for r in rows})

    # Prefer prior source-check if present (same window)
    source_status = None
    if SOURCE_CHECK.is_file():
        try:
            source_status = json.loads(SOURCE_CHECK.read_text(encoding="utf-8")).get("status")
        except Exception:  # noqa: BLE001
            source_status = None

    if all_match:
        status = "READY"
        block_code = None
        message = "S7_INPUT_VERSION == CURRENT_CANDIDATE_VERSION for all pending pillars"
    else:
        status = "BLOCKED_WRONG_BASELINE"
        block_code = "BLOCKED_WRONG_BASELINE"
        message = (
            "PENDING inputs are not exclusively Candidate v2 — "
            "refuse Recalculate to prevent green-on-wrong-baseline"
        )

    out = {
        "schema": "traveltrust.psg_s7_candidate_baseline_gate.v1",
        "recorded_utc": recorded,
        "gate_id": "S7-CANDIDATE-BASELINE-ANTI-MISREAD",
        "current_candidate_version": PIN,
        "current_candidate_baseline": BASELINE,
        "expected": {"S7_INPUT_VERSION": PIN, "deploy_baseline": BASELINE},
        "status": status,
        "block_code": block_code,
        "message": message,
        "classes_seen": classes,
        "prior_s7_input_source_check": source_status,
        "pending_rows": rows,
        "s7_reader_path": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/",
        "executed_s7": False,
        "reader_modified": False,
        "bridge_executed": False,
        "equals_psg_complete": False,
        "pre_s7_required": True,
        "honesty": (
            "Quality protection only — does not change flow; "
            "call before run-psg-completion-matrix-recalculate.sh"
        ),
    }
    write_json(CONSOL / "S7-CANDIDATE-BASELINE-GATE-LATEST.json", out)
    return out


def main() -> int:
    out = run_gate()
    print(
        json.dumps(
            {
                "status": out["status"],
                "block_code": out["block_code"],
                "classes_seen": out["classes_seen"],
                "current_candidate_version": PIN,
            },
            indent=2,
        )
    )
    print(f"TT_PSG_S7_CANDIDATE_BASELINE_GATE: {out['status']}")
    # Non-zero when blocked so shell wrappers can refuse S7
    return 0 if out["status"] == "READY" else 2


if __name__ == "__main__":
    raise SystemExit(main())
