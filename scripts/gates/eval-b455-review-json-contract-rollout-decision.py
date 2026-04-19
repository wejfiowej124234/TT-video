#!/usr/bin/env python3
"""B-455: evaluate rollout verdict from B-454 `replay_summary.json` + `config/b455_*_thresholds.json`.

Exit codes: 0 = GREEN, 1 = YELLOW, 2 = RED (for CI / release controller wiring).
Stdout: single JSON object (machine-readable decision record).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

DEGRADES = ("missing_meta", "malformed_meta", "unknown_future_schema")


def _load_json(p: Path) -> dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))


def evaluate(
    summary: dict[str, Any],
    thresholds: dict[str, Any],
) -> tuple[str, list[str], dict[str, Any]]:
    reasons: list[str] = []
    if summary.get("evidence_schema") and "b454" not in str(summary.get("evidence_schema", "")).lower():
        reasons.append("summary.evidence_schema not recognized as B-454 replay output")

    cd = summary.get("count_by_degrade") or {}
    counts = {k: int(cd.get(k, 0) if isinstance(cd.get(k, 0), (int, float)) else 0) for k in DEGRADES}
    total = int(summary.get("total_events", sum(counts.values())))
    if total != sum(counts.values()) and sum(counts.values()) > 0:
        reasons.append("total_events vs sum(count_by_degrade) mismatch (non-fatal; using sum)")

    limits = thresholds.get("limits") or {}
    # 1) Catastrophic absolute thresholds (any sample size)
    for k in DEGRADES:
        lim = limits.get(k) or {}
        ra = lim.get("red_abs")
        if isinstance(ra, int) and counts[k] >= ra:
            return "RED", [f"{k}>={ra} (red_abs)"], {"counts": counts, "total_events": total}

    # 2) Zero degrade events → best case
    if total == 0:
        return "GREEN", [], {"counts": counts, "total_events": total}

    min_rate = int(thresholds.get("min_total_events_eval_rate") or 0)
    ins_verdict = str(thresholds.get("insufficient_sample_verdict") or "YELLOW").upper()
    if total < min_rate:
        return (
            ins_verdict,
            [f"total_events={total} < min_total_events_eval_rate={min_rate}"],
            {"counts": counts, "total_events": total},
        )

    # 3) Yellow absolute thresholds
    for k in DEGRADES:
        lim = limits.get(k) or {}
        ya = lim.get("yellow_abs")
        if isinstance(ya, int) and counts[k] >= ya:
            reasons.append(f"{k}>={ya} (yellow_abs)")

    if reasons:
        return "YELLOW", reasons, {"counts": counts, "total_events": total}

    return "GREEN", [], {"counts": counts, "total_events": total}


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    ap = argparse.ArgumentParser(description="B-455 rollout verdict from B-454 replay_summary.json")
    ap.add_argument(
        "summary",
        type=Path,
        help="Path to replay_summary.json (from replay-b454-*.py)",
    )
    ap.add_argument(
        "--thresholds",
        type=Path,
        default=root / "config" / "b455_review_json_contract_rollout_thresholds.json",
        help="Machine-readable thresholds JSON",
    )
    args = ap.parse_args()

    try:
        summary = _load_json(args.summary)
        thresholds = _load_json(args.thresholds)
    except (OSError, json.JSONDecodeError) as e:
        print(f"eval-b455: {e}", file=sys.stderr)
        return 3

    if thresholds.get("threshold_schema") != "b455_review_json_contract_rollout_v1":
        print("eval-b455: thresholds.threshold_schema must be b455_review_json_contract_rollout_v1", file=sys.stderr)
        return 3

    verdict, reasons, detail = evaluate(summary, thresholds)
    out = {
        "decision_schema": "b455_rollout_decision_v1",
        "verdict": verdict,
        "reasons": reasons,
        "threshold_schema": thresholds.get("threshold_schema"),
        "detail": detail,
    }
    print(json.dumps(out, ensure_ascii=False, indent=2, sort_keys=True))
    return {"GREEN": 0, "YELLOW": 1, "RED": 2}.get(verdict, 3)


if __name__ == "__main__":
    raise SystemExit(main())
