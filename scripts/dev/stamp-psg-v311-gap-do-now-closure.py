#!/usr/bin/env python3
"""Close PSG Gap Audit DO_NOW hygiene items (docs/discipline only).

Does NOT mutate protocol / ACTIVE / Runtime / Registry pins / Package.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_psg_v311_production_gap_audit"


def main() -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    audit_path = EV / "PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.json"
    audit = json.loads(audit_path.read_text(encoding="utf-8")) if audit_path.is_file() else {}

    closed = [
        {
            "id": "GAP-EV-03",
            "alias": ["DOC-01"],
            "status": "CLOSED_HYGIENE",
            "how": (
                "Supersession banner on docs/runbook/TT-WEB3-FULL-CONSTITUTION-GAP-MATRIX-LATEST.md "
                "— historical TT_WEB3_FULL_ALIGNMENT=PASS ≠ V311 production-grade / consistency PASS"
            ),
            "registry_pins_mutated": False,
        },
        {
            "id": "GAP-PSG-03",
            "status": "CLOSED_HYGIENE",
            "how": "Attested: frozen archive v1.1.0-psg-go.20260717 IMMUTABLE; no gate refresh",
        },
        {
            "id": "GAP-OPS-02",
            "status": "CLOSED_HYGIENE",
            "how": "Ops Cert cite re-attested PASS (P6.5) under Sepolia RC scope",
        },
        {
            "id": "GAP-EV-04",
            "status": "CLOSED_HYGIENE_ONGOING",
            "how": "F-02 heartbeat MONITORING; continue until ETA",
        },
    ]

    remaining_do_now = [
        {
            "id": "GAP-PR-02",
            "status": "OPEN_OWNER",
            "text": "Owner FE Sepolia + WalletConnect Project ID",
        },
        {
            "id": "GAP-FN-04",
            "status": "OPEN_OWNER_THEN_POST_EXECUTE",
            "text": "UI Full playwright real-wallet/real-tx",
        },
    ]

    stamp = {
        "schema": "traveltrust.psg_v311_gap_do_now_closure.v1",
        "machine_key": "TT_PSG_V311_GAP_DO_NOW_CLOSURE",
        "recorded_utc": now,
        "parent_audit": "TT_PSG_V311_PRODUCTION_GAP_AUDIT",
        "governance_mode": "FROZEN_WAITING_EXECUTE",
        "forbid_mutate": ["protocol", "ACTIVE", "Runtime", "Registry", "Package"],
        "closed_hygiene": closed,
        "remaining_do_now": remaining_do_now,
        "tt_psg_v311_gap_do_now_closure": "PARTIAL_HYGIENE_CLOSED",
        "note": "Owner ENV + UI Full remain; Wait-ETA / Money-Path untouched",
    }

    EV.mkdir(parents=True, exist_ok=True)
    (EV / "PSG-V311-GAP-DO-NOW-CLOSURE-LATEST.json").write_text(
        json.dumps(stamp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    md = f"""# PSG Gap · DO_NOW Hygiene Closure

**Machine:** `TT_PSG_V311_GAP_DO_NOW_CLOSURE`  
**Recorded:** `{now}` · mode `FROZEN_WAITING_EXECUTE`

## Closed (hygiene)

| ID | Status | How |
|----|--------|-----|
""" + "\n".join(
        f"| {c['id']} | {c['status']} | {c['how']} |" for c in closed
    ) + f"""

## Still open (Owner / post-Execute)

| ID | Status | Text |
|----|--------|------|
| GAP-PR-02 | OPEN_OWNER | Owner FE Sepolia + WalletConnect |
| GAP-FN-04 | OPEN_OWNER_THEN_POST_EXECUTE | UI Full real-wallet/real-tx |

Parent audit: `PSG-V311-PRODUCTION-GAP-AUDIT-LATEST.md`
"""
    (EV / "PSG-V311-GAP-DO-NOW-CLOSURE-LATEST.md").write_text(md, encoding="utf-8")

    # Patch parent audit backlog statuses for closed hygiene
    if audit:
        for b in audit.get("backlog") or []:
            for c in closed:
                if b.get("id") == c["id"]:
                    b["closure_status"] = c["status"]
                    b["closed_utc"] = now
        audit["do_now_closure_cite"] = "PSG-V311-GAP-DO-NOW-CLOSURE-LATEST.json"
        audit["recorded_utc_closure_patch"] = now
        audit_path.write_text(
            json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    print(json.dumps({"TT_PSG_V311_GAP_DO_NOW_CLOSURE": "PARTIAL_HYGIENE_CLOSED", "closed": len(closed)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
