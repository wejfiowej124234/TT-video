#!/usr/bin/env python3
"""Read-only Sepolia Timelock operation status for V9 Periphery Governance Reality.

States:
  WAITING_ETA  — chain now < operations(idSeed).readyAt
  EXECUTABLE   — readyAt <= now and done == false
  EXECUTED     — done == true

Does not broadcast. Does not modify Candidate Solidity.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_ttg_v9_periphery_governance_upgrade"
ADDR_ENV = EV / "sepolia-reality.addresses.env"
AUDIT_1_CANDIDATE_SHA = "b19b85810c22677d243a82d06ebec8ebcb4d4b47"
READY_AT_FROZEN = 1787408352
SEPOLIA_CHAIN_ID = 11155111
RPC_CANDIDATES = (
    "https://sepolia.gateway.tenderly.co",
    "https://ethereum-sepolia-rpc.publicnode.com",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def pick_rpc() -> str:
    for rpc in RPC_CANDIDATES:
        try:
            proc = subprocess.run(
                ["cast", "chain-id", "--rpc-url", rpc],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=20,
                check=False,
            )
            if proc.stdout.strip() == str(SEPOLIA_CHAIN_ID):
                return rpc
        except (OSError, subprocess.TimeoutExpired):
            continue
    raise RuntimeError("no working Sepolia RPC")


def cast_call(rpc: str, to: str, sig: str, *args: str) -> str:
    proc = subprocess.run(
        ["cast", "call", to, sig, *args, "--rpc-url", rpc],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout or "cast call failed").strip())
    return proc.stdout.strip()


def parse_u256_line(text: str, line: int = 0) -> int:
    rows = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not rows:
        return 0
    token = rows[line].split()[0]
    if token.startswith("0x"):
        return int(token, 16)
    return int(float(token))


def parse_bool_line(text: str, line: int = 1) -> bool:
    rows = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(rows) <= line:
        return False
    token = rows[line].split()[0].lower()
    return token in ("true", "1")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--out", default=str(EV / "SEPOLIA_TIMELOCK_REALITY_STATUS_LATEST.json"))
    args = p.parse_args()

    env = load_env(ADDR_ENV)
    timelock = env.get("TIMELOCK", "")
    id_seed = env.get("ID_SEED", "")
    if not timelock or not id_seed:
        print("PROBE_TIMELOCK: missing TIMELOCK/ID_SEED in sepolia-reality.addresses.env", file=sys.stderr)
        return 2

    rpc = pick_rpc()
    chain_now = parse_u256_line(
        subprocess.check_output(["cast", "block", "-f", "timestamp", "--rpc-url", rpc], text=True)
    )
    delay = parse_u256_line(cast_call(rpc, timelock, "delay()(uint256)"))
    op_raw = cast_call(rpc, timelock, "operations(bytes32)(uint256,bool,address,uint256,bytes)", id_seed)
    ready_at = parse_u256_line(op_raw, 0)
    done = parse_bool_line(op_raw, 1)

    if done:
        state = "EXECUTED"
    elif chain_now >= ready_at:
        state = "EXECUTABLE"
    else:
        state = "WAITING_ETA"

    remain = max(0, ready_at - chain_now)
    ready_match = ready_at == READY_AT_FROZEN

    out = {
        "schema": "traveltrust.ttg_v9_sepolia_timelock_reality_status.v1",
        "recorded_utc": utc_now(),
        "track": "V9_PERIPHERY_GOVERNANCE_SEPOLIA_REALITY",
        "audit_1_candidate_sha": AUDIT_1_CANDIDATE_SHA,
        "chain_id": SEPOLIA_CHAIN_ID,
        "rpc": rpc,
        "timelock": timelock,
        "operation_id_seed": id_seed,
        "timelock_delay_seconds": delay,
        "chain_now_unix": chain_now,
        "operation_ready_at_unix": ready_at,
        "ready_at_frozen": READY_AT_FROZEN,
        "ready_at_matches_frozen": ready_match,
        "operation_done": done,
        "remain_seconds": remain,
        "timelock_operation_state": state,
        "SEPOLIA_REALITY": "IN_PROGRESS",
        "resume_runner": "scripts/dev/run-ttg-v9-periphery-governance-sepolia-reality.sh resume",
        "next_after_pass_stop": "AUDIT_2_ONLY",
        "exact_match": "NOT_ISSUED",
        "mainnet_broadcast": "NOT_AUTHORIZED",
        "tt_production_go": "NO_GO",
        "candidate_solidity_change": "STOP_VOID_AUDIT1",
        "official_www_web3_update": "FORBIDDEN_UNTIL_MAINNET_REALITY",
    }
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(
        f"PROBE_TIMELOCK: state={state} ready_at={ready_at} now={chain_now} "
        f"remain={remain}s done={done} out={out_path.name}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
