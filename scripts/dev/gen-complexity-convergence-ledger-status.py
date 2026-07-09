#!/usr/bin/env python3
"""复杂度收敛台账 · 状态汇总 + ①② 漂移审计 + Gap Inventory 对拍

  python scripts/dev/gen-complexity-convergence-ledger-status.py
  python scripts/dev/gen-complexity-convergence-ledger-status.py --strict

末行：TT_COMPLEXITY_CONVERGENCE_LEDGER: open=P0=… P1=… drift=… gap_open=…
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("FAIL: PyYAML required", file=sys.stderr)
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "registry/complexity-convergence-fix-ledger.v1.yaml"
GAP = ROOT / "evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/gap-inventory.latest.json"
OUT = ROOT / "evidence/COMPLEXITY_CONVERGENCE/ledger-status.latest.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_yaml(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="drift or gap mismatch → exit 1")
    args = ap.parse_args()

    if not LEDGER.is_file():
        print(f"FAIL: missing {LEDGER}", file=sys.stderr)
        return 2

    ledger = load_yaml(LEDGER)
    items: list[dict[str, Any]] = ledger.get("items") or []
    gap = load_json(GAP)

    by_priority: dict[str, list[dict[str, Any]]] = {"P0": [], "P1": [], "P2": []}
    for it in items:
        p = it.get("priority", "P2")
        by_priority.setdefault(p, []).append(it)

    open_p0 = [
        i for i in by_priority.get("P0", [])
        if i.get("status") in ("open", "in_progress", "phase1_closed")
    ]
    open_p1 = [
        i for i in by_priority.get("P1", [])
        if i.get("status") in ("open", "in_progress", "phase1_closed")
    ]
    in_prog = [i for i in items if i.get("status") == "in_progress"]
    closed = [i for i in items if i.get("status") == "closed"]

    drift: list[str] = []
    gap_open_ids: set[str] = set()
    if gap:
        for gi in gap.get("items") or []:
            if gi.get("status") == "open":
                gap_open_ids.add(str(gi.get("id", "")))

    ledger_gap_refs: set[str] = set()
    for it in items:
        for ref in it.get("gap_refs") or []:
            ledger_gap_refs.add(ref)
        if it.get("status") == "closed" and (it.get("gap_refs") or []):
            for ref in it.get("gap_refs") or []:
                if ref in gap_open_ids:
                    drift.append(f"closed_ledger_open_gap:{it['id']}:{ref}")

    unmapped_gap = sorted(gap_open_ids - ledger_gap_refs - {""})
    if unmapped_gap and gap:
        drift.append(f"gap_items_not_in_ledger:{','.join(unmapped_gap[:8])}")

    for it in items:
        if it.get("status") != "closed":
            continue
        p1 = (it.get("phase1") or {}).get("evidence", "")
        ev = ROOT / p1 if p1 else None
        if ev and not (ev / "phase1.closed.json").is_file():
            drift.append(f"missing_phase1_evidence:{it['id']}")

    payload = {
        "schema": "traveltrust.complexity_convergence_ledger_status.v1",
        "generated_at_utc": utc_now(),
        "ledger_path": LEDGER.as_posix(),
        "gap_inventory_path": GAP.as_posix(),
        "counts": {
            "total": len(items),
            "open_p0": len(open_p0),
            "open_p1": len(open_p1),
            "in_progress": len(in_prog),
            "closed": len(closed),
            "gap_open": len(gap_open_ids),
        },
        "open_p0_ids": [i["id"] for i in open_p0],
        "open_p1_ids": [i["id"] for i in open_p1],
        "drift": drift,
        "ready_for_staging_live": len(open_p0) == 0 and len(in_prog) == 0,
        "ready_for_freeze_candidate": False,
    }
    payload["ready_for_freeze_candidate"] = (
        payload["ready_for_staging_live"]
        and len(open_p1) == 0
        and not drift
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"TT_COMPLEXITY_CONVERGENCE_LEDGER: "
        f"open_P0={len(open_p0)} open_P1={len(open_p1)} "
        f"in_progress={len(in_prog)} closed={len(closed)} "
        f"drift={len(drift)} gap_open={len(gap_open_ids)} "
        f"out={OUT.as_posix()}"
    )
    if drift:
        for d in drift:
            print(f"  DRIFT: {d}", file=sys.stderr)
    if args.strict and (drift or open_p0):
        return 1
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
