#!/usr/bin/env python3
"""Stamp UI/UX Full Cert from gate evidence (honest · no fake PASS).

Does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
playwright_real_wallet_real_tx remains OPEN until Owner session records PASS.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_phase2_v311_final_release"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load(rel: str):
    p = ROOT / rel
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    prev = _load("evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json")
    pr02 = _load(
        "evidence/GO_psg_v311_production_gap_audit/GAP-PR02-SEPOLIA-FRONTEND-ENV-LATEST.json"
    )
    wc = _load("evidence/GO_phase2_staging_reality/OA-01/WC-PROJECT-ID-PROBE-LATEST.json")

    gates = dict(prev.get("gates") or {})
    # Preserve known L5 greens if already PASS; do not invent playwright PASS
    gates.setdefault("five_main_routes_ui", "UNKNOWN")
    gates.setdefault("web3_itinerary_l5_green", "UNKNOWN")
    gates.setdefault("wallet_l5_smoke", "UNKNOWN")
    gates.setdefault("playwright_real_wallet_real_tx", "OPEN")

    env_ready = str(pr02.get("status") or "").startswith("PREPARED")
    wc_ok = (wc.get("verdict") or "") == "KEY_PRESENT"

    blocking = [k for k, v in gates.items() if v not in ("PASS", "NON_BLOCKING_MISSING_maybe-run-cinematic-script") and not str(v).startswith("NON_BLOCKING")]
    # cinematic warn is non-blocking
    hard = [
        k
        for k, v in gates.items()
        if k != "wallet_l5_cinematic_warn" and str(v).upper() not in ("PASS",)
    ]
    if not hard:
        status = "PASS"
    elif gates.get("playwright_real_wallet_real_tx") != "PASS" and all(
        gates.get(k) == "PASS"
        for k in ("five_main_routes_ui", "web3_itinerary_l5_green", "wallet_l5_smoke")
    ):
        status = "PARTIAL"
    else:
        status = "PARTIAL" if any(gates.get(k) == "PASS" for k in gates) else "OPEN"

    out = {
        "schema": "traveltrust.v311_web3_ui_ux_full_cert.v1",
        "machine_key": "TT_V311_WEB3_UI_UX_FULL_CERT",
        "recorded_utc": _utc(),
        "status": status,
        "tt_v311_web3_ui_ux_full_cert": status,
        "gates": gates,
        "prerequisites": {
            "gap_pr02": pr02.get("status"),
            "sepolia_overlay_prepared": env_ready,
            "walletconnect": wc.get("verdict"),
            "activate": "bash scripts/dev/activate-frontend-sepolia-env.sh",
            "restore": "bash scripts/dev/restore-frontend-anvil-env.sh",
        },
        "pass_requires_all": [
            "five_main_routes_ui_PASS",
            "web3_itinerary_l5_green_PASS",
            "wallet_l5_smoke_PASS",
            "playwright_real_wallet_real_tx_PASS",
        ],
        "gate": "G-RC-04 / CERT-03",
        "on_fail_rollback_to": "S4_UI_FULL",
        "how_to_start": [
            "python scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py",
            "bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'  # if KEY_ABSENT",
            "node scripts/dev/probe-walletconnect-project-id.cjs",
            "bash scripts/dev/activate-frontend-sepolia-env.sh",
            "bash scripts/gates/five-main-routes-ui-antiregression-gate.sh",
            "bash scripts/dev/run-web3-itinerary-l5-green.sh",
            "bash scripts/dev/smoke-wallet-connection-l5-local.sh",
            "# Owner Playwright real wallet + real Sepolia tx → then re-stamp this file with playwright=PASS",
            "bash scripts/dev/restore-frontend-anvil-env.sh",
        ],
    }
    EV.mkdir(parents=True, exist_ok=True)
    (EV / "P5-UI-UX-CERT-LATEST.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (EV / "P5-UI-UX-CERT-LATEST.md").write_text(
        f"""# P5 · UI/UX Full Cert

**Machine:** `TT_V311_WEB3_UI_UX_FULL_CERT`  
**Status:** `{status}`  
**Recorded:** `{out['recorded_utc']}`

| Gate | Status |
|------|--------|
"""
        + "\n".join(f"| {k} | {v} |" for k, v in gates.items())
        + f"""

**GAP-PR-02:** `{pr02.get('status')}` · **WC:** `{wc.get('verdict')}`  
**Rollback:** S4_UI_FULL · restore Anvil after session
""",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "TT_V311_WEB3_UI_UX_FULL_CERT": status,
                "wc": wc.get("verdict"),
                "pr02": pr02.get("status"),
                "playwright": gates.get("playwright_real_wallet_real_tx"),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
