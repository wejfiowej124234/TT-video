#!/usr/bin/env python3
"""Post-Settlement-finalize capture validator (Project A).

Run ONLY after finalize has written money-path/finalize-*/ evidence.
Does NOT broadcast / does NOT flip gates.

  python scripts/dev/check-psg-settlement-final-capture.py
  python scripts/dev/check-psg-settlement-final-capture.py --finalize-dir PATH
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAND = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
OPS = CAND / "money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json"
OUT = CONSOL / "SETTLEMENT-FINAL-CAPTURE-READY-LATEST.json"
SEPOLIA = 11155111


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_rpc():
    for k in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
        if os.environ.get(k):
            return os.environ[k]
    envf = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    if not envf.exists():
        return None
    for line in envf.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.split("#", 1)[0].strip()
        if "=" in line:
            k, v = line.split("=", 1)
            if k.strip() in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
                return v.strip().strip('"').strip("'")
    return None


def cast(*args, rpc=None):
    cmd = ["cast", *args]
    if rpc:
        cmd += ["--rpc-url", rpc]
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=90).strip()
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--finalize-dir", default="")
    args = ap.parse_args()
    recorded = utc_now()
    issues = []
    finalize_dir = Path(args.finalize_dir) if args.finalize_dir else None
    if not finalize_dir:
        cands = sorted((CAND / "money-path").glob("finalize-*"))
        finalize_dir = cands[-1] if cands else None

    ops = json.loads(OPS.read_text(encoding="utf-8")) if OPS.exists() else {}
    checks = {
        "finalize_dir_present": bool(finalize_dir and finalize_dir.is_dir()),
        "ops_standby_present": OPS.is_file(),
        "chain_id_ok": None,
        "receipts": [],
    }
    if not checks["finalize_dir_present"]:
        issues.append("no finalize-* directory yet — run after settlement finalize")

    rpc = load_rpc()
    if rpc:
        cid = cast("chain-id", rpc=rpc)
        try:
            checks["chain_id_ok"] = int(str(cid).strip()) == SEPOLIA
        except Exception:
            checks["chain_id_ok"] = False
            issues.append("chain_id probe failed")
    else:
        issues.append("RPC not configured")

    # Scan finalize dir for tx hashes / json
    if finalize_dir and finalize_dir.is_dir():
        for p in sorted(finalize_dir.rglob("*")):
            if p.suffix.lower() in (".json", ".log", ".txt"):
                text = p.read_text(encoding="utf-8", errors="replace")
                checks["receipts"].append(
                    {
                        "path": p.relative_to(ROOT).as_posix(),
                        "bytes": p.stat().st_size,
                        "mentions_tx": ("0x" in text and len(text) > 20),
                    }
                )
        if not checks["receipts"]:
            issues.append("finalize dir empty of json/log/txt")

    # Expected ops ids present in standby (precondition knowledge)
    ops_ok = bool(ops.get("ops") and ops.get("settlement_eta_unix"))
    if not ops_ok:
        issues.append("ops standby incomplete")

    ready = checks["finalize_dir_present"] and not issues
    # If no finalize yet, status is PREP_ARMED not READY
    if not checks["finalize_dir_present"]:
        status = "PREP_ARMED_WAIT_FINALIZE"
        ready = False
    elif issues:
        status = "BLOCKED"
    else:
        status = "READY"

    out = {
        "schema": "traveltrust.psg_settlement_final_capture_ready.v1",
        "recorded_utc": recorded,
        "status": status,
        "ready": ready,
        "equals_l5_pass": False,
        "executed_finalize": False,
        "finalize_dir": finalize_dir.relative_to(ROOT).as_posix() if finalize_dir and finalize_dir.exists() else None,
        "checks": checks,
        "issues": issues,
        "expected_post_finalize_fields": [
            "tx_hash_ready",
            "tx_hash_distable",
            "tx_hash_distribute",
            "block",
            "receipt_status",
            "events",
            "escrow_state",
            "settlement_state",
            "fee_route",
            "db_or_indexer_cite",
        ],
        "note": "Validator prep/runtime — does not broadcast",
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": status, "ready": ready, "issues": issues}, indent=2))
    print("TT_PSG_SETTLEMENT_FINAL_CAPTURE: " + status)
    return 0 if status in ("READY", "PREP_ARMED_WAIT_FINALIZE") else 2


if __name__ == "__main__":
    raise SystemExit(main())
