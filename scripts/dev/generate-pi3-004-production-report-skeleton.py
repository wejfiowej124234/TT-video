#!/usr/bin/env python3
"""Generate PI3-004 production report.json skeleton (154 · R-003 prod wrapper)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

CASES = [
    ("D1-DISCOVER-MKT", "discover", True),
    ("D2-GUIDE-ESCROW", "guide", True),
    ("D3-ORDERS-MSG", "orders", True),
    ("D4-GOV-STAKE", "governance", True),
    ("D5-ME-PROFILE", "me", True),
    ("D6-COMMUNITY-UGC", "community", True),
    ("OPS-CMS-145-FREEZE", "admin", False),
    ("OPS-OFFICIAL-145-FREEZE", "admin", False),
    ("OPS-GROWTH-133-FREEZE", "admin", False),
    ("OPS-CATALOG-120-FREEZE", "catalog", False),
    ("OPS-CATALOG-146-OPTIN", "catalog", False),
    ("OPS-COLDSTART-150-CONSUMER", "official", False),
    ("R003-A-ENV-001", "auth", True),
    ("R003-B-MKT-001", "market", True),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--prod-api-base", default="https://api.example.com")
    ap.add_argument("--prod-web-base", default="https://app.example.com")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    run_id = datetime.now(timezone.utc).strftime("PI3_004_R003_PRODUCTION_%Y%m%dT%H%M%SZ")
    cases = [
        {
            "id": cid,
            "category": cat,
            "status": "NOT_RUN",
            "blocker": blocker,
            "notes": f"{cid} · PI3-004 Owner run on production env",
        }
        for cid, cat, blocker in CASES
    ]
    report = {
        "schema_version": "1",
        "run_id": run_id,
        "title": "PI3-004 R-003 Production full-site regression (Sepolia scope skeleton)",
        "executor": "pi3-004-execution@traveltrust.local",
        "reviewer": "",
        "started_at": now,
        "finished_at": now,
        "environment": {
            "name": "production",
            "database": "enabled",
            "chain_mode": "testnet",
            "auth_mode": "cookie",
            "production_scope": "PRODUCTION_SCOPE_SEPOLIA",
            "chain_id": 11155111,
            "prod_api_base": args.prod_api_base.rstrip("/"),
            "prod_web_base": args.prod_web_base.rstrip("/"),
        },
        "release_gate": "NO_GO",
        "release_gate_reason": (
            "PI3-004 skeleton — Owner must execute R-003 production A+B + "
            "six-domain UAT; then update case statuses per 93 §7.1"
        ),
        "cases": cases,
        "summary": {"PASS": 0, "FAIL": 0, "BLOCKED": 0, "N_A": 0, "NOT_RUN": len(cases)},
        "pi3_004": {
            "kind": "traveltrust.pi3_004_production_report_skeleton.v1",
            "production_scope": "PRODUCTION_SCOPE_SEPOLIA",
            "not_production_go": True,
        },
    }
    (out / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"generate-pi3-004: OK {out / 'report.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
