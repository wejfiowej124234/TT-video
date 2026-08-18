#!/usr/bin/env python3
"""Final Closure Batch gate (file-only).

Does not recast L7, bake www, flip TT_PRODUCTION_GO, or rewrite STOP counts.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STOP = ROOT / "docs" / "runbook" / "TT-PRODUCTION-GO-REASSESSMENT-LATEST.json"
BATCH = ROOT / "docs" / "runbook" / "TT-PRODUCTION-GO-FINAL-CLOSURE-BATCH-LATEST.json"
LATEST = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-LATEST.json"

ORDER = [
    "AXIS-09",
    "FTB_STAMP_LAG_CLUSTER",
    "TT_PSG_PRODUCTION_CERT",
    "AXIS-08",
    "AXIS-11",
    "AXIS-12",
    "GAP-E2E-JOURNEY",
    "AXIS-14",
]
ITEM_STATUS = {
    "OPEN",
    "CLOSED",
    "STOP_AND_REPORT",
    "BLOCKED_UNTIL_PRIOR",
}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    failed: list[str] = []
    for path in (STOP, BATCH, LATEST):
        if not path.is_file():
            failed.append(f"missing {path.relative_to(ROOT)}")
    if failed:
        for f in failed:
            print(f"FAIL: {f}", file=sys.stderr)
        print("TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH: FAIL", file=sys.stderr)
        return 1

    stop = load(STOP)
    batch = load(BATCH)
    latest = load(LATEST)

    if stop.get("status") != "TT_PRODUCTION_GO_REASSESSMENT_STOP":
        failed.append(f"STOP pack status={stop.get('status')}")
    if int(stop.get("required_before_go") or -1) != 8:
        failed.append("STOP required_before_go must stay 8")
    if stop.get("read_only") is not True:
        failed.append("STOP pack must stay read_only")
    if stop.get("tt_production_go") != "NO_GO":
        failed.append("STOP pack must stay NO_GO")

    if batch.get("machine_key") != "TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH":
        failed.append("batch machine_key")
    if batch.get("tt_production_go") != "NO_GO":
        failed.append("batch must not flip TT_PRODUCTION_GO")
    if batch.get("owner_production_go_verdict") != "NOT_THIS_TURN":
        failed.append("Owner GO verdict must remain NOT_THIS_TURN")
    if batch.get("frontend_product_baseline") != "FROZEN_LATEST_PRODUCT_BASELINE":
        failed.append("FE baseline lock missing")
    lock = batch.get("frontend_lock") or {}
    if lock.get("if_task_requires_frontend_change_or_reship") != "STOP_AND_REPORT":
        failed.append("FE STOP_AND_REPORT missing")
    if batch.get("order") != ORDER:
        failed.append(f"batch order drifted: {batch.get('order')}")
    cite = batch.get("cite_stop_pack") or {}
    if int(cite.get("required_before_go") or -1) != 8:
        failed.append("batch cite of STOP required_before_go must stay 8")
    if cite.get("do_not_rewrite_stop_counts") is not True:
        failed.append("batch must not rewrite STOP counts")

    items = batch.get("items") or []
    ids = [row.get("id") for row in items]
    if ids != ORDER:
        failed.append(f"batch items order drifted: {ids}")
    by_id = {row.get("id"): row for row in items}
    for rid in ORDER:
        row = by_id.get(rid) or {}
        st = row.get("status")
        if st not in ITEM_STATUS:
            failed.append(f"{rid} status={st}")

    gap = by_id.get("GAP-E2E-JOURNEY") or {}
    axis14 = by_id.get("AXIS-14") or {}
    if gap.get("status") != "CLOSED" and axis14.get("status") == "CLOSED":
        failed.append("AXIS-14 must not close before GAP-E2E-JOURNEY")

    if latest.get("tt_production_go") != "NO_GO":
        failed.append("living FTB must remain NO_GO")
    go_cite = latest.get("production_go_reassessment") or {}
    if int(go_cite.get("required_before_go") or -1) != 8:
        failed.append("living FTB must still cite STOP required_before_go=8")
    if latest.get("phase_now") != "FTB_V8_CYCLE_ACTIVE_PRODUCTION_GO_REASSESSMENT_STOP_REQUIRED_BEFORE_GO_OPEN":
        failed.append(f"living phase_now={latest.get('phase_now')}")

    forbidden = set(batch.get("forbidden") or [])
    for item in (
        "claim_production_go",
        "rewrite_stop_required_before_go",
        "repeat_1_usdc_real_money",
        "www_bake",
        "frontend_ui_ux_change",
        "accept_blocking_risk_via_axis08_path_b",
    ):
        if item not in forbidden:
            failed.append(f"batch forbidden missing {item}")

    if failed:
        for f in failed:
            print(f"FAIL: {f}", file=sys.stderr)
        print("TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH: FAIL", file=sys.stderr)
        return 1

    print("PASS: STOP pack frozen required_before_go=8 · batch NO_GO")
    print("PASS: FE FROZEN_LATEST_PRODUCT_BASELINE · eight-item order")
    print("PASS: living FTB still STOP phase · no auto GO flip")
    st = batch.get("status")
    print(f"TT_PRODUCTION_GO_FINAL_CLOSURE_BATCH: {st}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
