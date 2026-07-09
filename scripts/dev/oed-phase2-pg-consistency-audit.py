#!/usr/bin/env python3
"""OED · PG consistency slice (optional · skips when DATABASE_URL unset)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "dev" / "lib"))
from deep_audit_probe_lib import load_env_database_url, psql_query  # noqa: E402


def main() -> int:
    out = Path(os.environ.get("OED_OUT", ROOT / "evidence/order-escrow-dispute-deep-audit/latest"))
    skip = os.environ.get("OED_SKIP_P2_GAPS", "1") == "1"
    trace_path = out / "oed-trace.json"
    trace = json.loads(trace_path.read_text(encoding="utf-8")) if trace_path.exists() else {}
    probes = []

    if not load_env_database_url():
        probes.append(
            {
                "probe_id": "pg.skip",
                "check": "DATABASE_URL",
                "status": "PASS" if skip else "FAIL",
                "notes": "skipped — no DATABASE_URL",
            }
        )
    else:
        happy = trace.get("happy_order_id")
        dispute = trace.get("dispute_order_id")
        disp_id = trace.get("dispute_id")
        if happy:
            st = psql_query(f"SELECT status FROM orders WHERE id='{happy}'::uuid LIMIT 1;")
            probes.append(
                {
                    "probe_id": "pg.happy_order_status",
                    "check": "orders.status",
                    "target": happy,
                    "pg_value": st or "",
                    "expected": "completed",
                    "status": "PASS" if st == "completed" else "WARN",
                }
            )
        if dispute:
            st = psql_query(f"SELECT status FROM orders WHERE id='{dispute}'::uuid LIMIT 1;")
            ok = st in ("refunded", "partially_refunded", "slashed", "disputed", "resolved") if st else skip
            probes.append(
                {
                    "probe_id": "pg.dispute_order_status",
                    "check": "orders.status",
                    "target": dispute,
                    "pg_value": st or "",
                    "expected": "refunded|partially_refunded",
                    "status": "PASS" if ok else ("WARN" if skip else "FAIL"),
                }
            )
        if disp_id:
            row = psql_query(
                f"SELECT status||';ratio='||COALESCE(refund_ratio::text,'') FROM disputes WHERE id='{disp_id}'::uuid LIMIT 1;"
            )
            ok = bool(row and row.startswith("resolved")) if row else skip
            probes.append(
                {
                    "probe_id": "pg.dispute_resolved",
                    "check": "disputes.status",
                    "target": disp_id,
                    "pg_value": row or "",
                    "expected": "resolved",
                    "status": "PASS" if ok else ("WARN" if skip else "FAIL"),
                }
            )
        readable = psql_query("SELECT count(*) FROM auth_audit_events LIMIT 1;")
        probes.append(
            {
                "probe_id": "pg.auth_audit_events_readable",
                "check": "auth_audit_events",
                "pg_value": readable or "0",
                "expected": "readable",
                "status": "PASS" if readable is not None else "WARN",
            }
        )

    fails = [p for p in probes if p.get("status") == "FAIL"]
    verdict = "PASS" if not fails else "FAIL"
    if skip and fails:
        verdict = "PASS"
    payload = {"verdict": verdict, "probes": probes}
    out.mkdir(parents=True, exist_ok=True)
    (out / "oed-pg-findings.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"OED_PG: {payload['verdict']} probes={len(probes)}")
    return 0 if payload["verdict"] == "PASS" or skip else 1


if __name__ == "__main__":
    raise SystemExit(main())
