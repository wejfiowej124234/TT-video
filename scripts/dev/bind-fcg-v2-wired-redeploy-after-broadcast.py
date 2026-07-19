#!/usr/bin/env python3
"""Bind Sepolia wired EscrowFactory redeploy addresses to L5-A Release SHA."""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
BJ = (
    ROOT
    / "contracts/broadcast/DeployFcgV2WiredEscrowFactorySepolia.s.sol/11155111/run-latest.json"
)


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    pin = json.loads((PENDING / "CDR-19-L5A-RELEASE-SHA-PIN-LATEST.json").read_text(encoding="utf-8"))
    release_sha = pin["Release_SHA"]
    evid_dirs = sorted(
        (ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/broadcast-wired").glob("*")
    )
    evid = evid_dirs[-1] if evid_dirs else PENDING
    if not BJ.is_file():
        raise SystemExit(f"missing {BJ}")

    bj = json.loads(BJ.read_text(encoding="utf-8"))
    shutil.copy2(BJ, PENDING / "FCG-V2-WIRED-BROADCAST-RUN-LATEST.json")

    addrs: dict[str, str] = {}
    txs = []
    for t in bj.get("transactions") or []:
        name = (t.get("contractName") or "").lower()
        ca = t.get("contractAddress")
        txs.append({"hash": t.get("hash"), "contractAddress": ca, "contractName": t.get("contractName")})
        if not ca:
            continue
        if "settlement" in name:
            addrs["settlementRouter"] = ca
        elif "projectrevenue" in name:
            addrs["projectRevenuePool"] = ca
        elif "founder" in name:
            addrs["founderBootstrap"] = ca
        elif "feerouter" in name:
            addrs["feeRouter"] = ca
        elif "escrowfactory" in name:
            addrs["escrowFactory"] = ca

    # log fallback
    for log_name in ("forge-broadcast.log",):
        lp = evid / log_name
        if not lp.exists():
            continue
        text = lp.read_text(encoding="utf-8", errors="replace")
        for label, key in [
            ("settlementRouter", "settlementRouter"),
            ("projectRevenuePool", "projectRevenuePool"),
            ("founderBootstrap", "founderBootstrap"),
            ("feeRouter", "feeRouter"),
            ("escrowFactory", "escrowFactory"),
        ]:
            if key in addrs:
                continue
            m = re.search(rf"{label}\s+(0x[a-fA-F0-9]{{40}})", text)
            if m:
                addrs[key] = m.group(1)

    receipts = bj.get("receipts") or []
    tx_hashes = [r.get("transactionHash") for r in receipts if r.get("transactionHash")]
    if not tx_hashes:
        tx_hashes = [t["hash"] for t in txs if t.get("hash")]

    bind = {
        "schema": "traveltrust.fcg_v2_wired_redeploy_onchain_bind.v1",
        "recorded_utc": stamp,
        "baseline": "fcg_full_capability_v2_sepolia_wired_escrow_factory",
        "Release_SHA": release_sha,
        "chain_id": 11155111,
        "addresses": addrs,
        "tx_hashes": tx_hashes,
        "transactions": txs,
        "broadcast_json": "contracts/broadcast/DeployFcgV2WiredEscrowFactorySepolia.s.sol/11155111/run-latest.json",
        "ACTIVE_FLIP": "FORBIDDEN",
        "l5_pass": False,
        "l3_security": "PREP_ONLY",
        "verdict": "WIRED_REDEPLOY_BOUND_ENTER_FIVE_LAYER_REBIND",
    }
    (PENDING / "FCG-V2-WIRED-ONCHAIN-BIND-LATEST.json").write_text(
        json.dumps(bind, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (evid / "ONCHAIN-BIND.json").write_text(
        json.dumps(bind, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # env rebind template (no secrets) — ACTIVE not flipped
    env_lines = [
        f"# FCG v2 wired rebind · Release_SHA={release_sha}",
        "# ACTIVE registry MUST remain v311_sepolia_clean_baseline until Owner cutover",
        f"SETTLEMENT_ROUTER_ADDRESS={addrs.get('settlementRouter', '')}",
        f"FEE_ROUTER_ADDRESS={addrs.get('feeRouter', '')}",
        f"ESCROW_FACTORY_ADDRESS={addrs.get('escrowFactory', '')}",
        f"PROJECT_REVENUE_POOL_ADDRESS={addrs.get('projectRevenuePool', '')}",
        f"FOUNDER_BOOTSTRAP_WALLET_ADDRESS={addrs.get('founderBootstrap', '')}",
        "FCG_V2_WIRED_REBIND=1",
        "TT_ACTIVE_FLIP=FORBIDDEN",
    ]
    (PENDING / "FCG-V2-WIRED-REBIND.env.example").write_text("\n".join(env_lines) + "\n", encoding="utf-8")

    print(json.dumps({"verdict": bind["verdict"], "addresses": addrs, "tx_count": len(tx_hashes)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
