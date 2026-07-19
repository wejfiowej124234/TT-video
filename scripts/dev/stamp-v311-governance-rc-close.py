#!/usr/bin/env python3
"""Stamp Governance RC CLOSED — only when Function + UI Full + Product PASS.

LOCK-1 order: S2 Function → S4 UI Full → S3 Product → S5 CLOSED.
Dry-run / pre-ETA: exits with REFUSE (does not close).
Does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
Money-Path TRE-02/REG-01/REG-04 remain DEFERRED.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ALIGN = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load(rel: str):
    p = ROOT / rel
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    force = "--force-close" in sys.argv  # still requires preconditions
    fn = _load("evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json")
    p6 = _load("evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json")
    p5 = _load("evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json")
    hb = _load(
        "evidence/GO_v311_constitution_production_alignment_audit/F02-EXECUTE-MONITOR-HEARTBEAT-LATEST.json"
    )
    counts = fn.get("counts") or {}
    function_54 = (
        counts.get("PASS") == 54
        and counts.get("FAIL", 1) == 0
        and counts.get("OWNER_REQUIRED", 1) == 0
        and (fn.get("verdict") or "").upper() == "PASS"
    )
    product_ok = (p6.get("status") or "").upper() == "PASS"
    ui_ok = (p5.get("status") or "").upper() == "PASS"
    prop = (hb.get("proposal_1") or {})
    executed = prop.get("state") == 7 or prop.get("execute_done") is True

    preconditions = {
        "proposal_executed_state_7": executed,
        "function_54_0_0": function_54,
        "product_pass": product_ok,
        "ui_full_pass": ui_ok,
    }
    ready = all(preconditions.values())

    if not ready:
        out = {
            "schema": "traveltrust.v311_governance_rc_close.v1",
            "machine_key": "TT_V311_GOVERNANCE_RC_CLOSE",
            "recorded_utc": _utc(),
            "status": "REFUSE_PRECONDITIONS_NOT_MET",
            "tt_v311_governance_rc_close": "REFUSE",
            "preconditions": preconditions,
            "rollback_to": (
                "S1_EXECUTE"
                if not executed
                else (
                    "S2_FUNCTION"
                    if not function_54
                    else ("S4_UI_FULL" if not ui_ok else ("S3_PRODUCT" if not product_ok else "S5"))
                )
            ),
            "order_lock": "S0→S1→S2→S4→S3→S5",
            "deferred_money_path": ["TRE-02", "REG-01", "REG-04"],
            "note": "Correct dry-run / pre-ETA outcome — do not close",
        }
        ALIGN.mkdir(parents=True, exist_ok=True)
        (ALIGN / "GOVERNANCE-RC-CLOSE-ATTEMPT-LATEST.json").write_text(
            json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return 3

    # Close path (only when ready)
    dual_path = ALIGN / "DUAL-RC-TRACK-BOARD-LATEST.json"
    dual = json.loads(dual_path.read_text(encoding="utf-8")) if dual_path.is_file() else {}
    dual["mode"] = "GOVERNANCE_RC_CLOSED"
    dual["governance_rc_closed_utc"] = _utc()
    dual["deferred_to_money_path_rc"] = ["TRE-02", "REG-01", "REG-04"]
    dual["tracks"] = dual.get("tracks") or {}
    if "A_GOVERNANCE_RC" in dual["tracks"]:
        dual["tracks"]["A_GOVERNANCE_RC"]["status"] = "CLOSED"
    dual_path.write_text(json.dumps(dual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (FRE / "DUAL-RC-TRACK-BOARD-LATEST.json").write_text(
        dual_path.read_text(encoding="utf-8"), encoding="utf-8"
    )

    closed = {
        "schema": "traveltrust.v311_governance_rc_close.v1",
        "machine_key": "TT_V311_GOVERNANCE_RC_CLOSE",
        "recorded_utc": _utc(),
        "status": "CLOSED",
        "tt_v311_governance_rc_close": "CLOSED",
        "preconditions": preconditions,
        "deferred_money_path": ["TRE-02", "REG-01", "REG-04"],
        "next": "Start Money-Path OPT-A (TRE-02→REG-01→REG-04) — separate RC",
        "forbid_claim": ["TT_WEB3_FULL_CONSTITUTION_CONSISTENCY_PASS_until_money_path"],
    }
    (ALIGN / "GOVERNANCE-RC-CLOSE-LATEST.json").write_text(
        json.dumps(closed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps(closed, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
