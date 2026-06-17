#!/usr/bin/env python3
"""Snapshot / verify CP NetProfit cutover + drill fund flow (chain four-layer)."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def cast_call(addr: str, sig: str, *args: str) -> str | None:
    if not addr:
        return None
    rpc = os.environ.get("CHAIN_RPC_URL", "https://sepolia.drpc.org")
    cmd = ["cast", "call", addr, sig, *args, "--rpc-url", rpc]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None
    line = r.stdout.strip().split("\n")[0].strip()
    return line.split()[0] if line else None


def to_int(raw: str | None) -> int | None:
    if not raw:
        return None
    raw = raw.split()[0]
    if raw.startswith("0x"):
        return int(raw, 16)
    if raw.lstrip("-").isdigit():
        return int(raw)
    return None


def erc20_balance(token: str, holder: str) -> int:
    return to_int(cast_call(token, "balanceOf(address)(uint256)", holder)) or 0


def snapshot(epoch: int | None = None) -> dict:
    ledger = os.environ.get("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS", "")
    steward_v = os.environ.get("COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS", "")
    unalloc_v = os.environ.get("COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS", "")
    token = os.environ.get(
        "COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS",
        os.environ.get("FUND_STACK_TOKEN_ADDRESS", ""),
    )
    v2_tl = os.environ.get(
        "GOV_FREEZE_V2_TIMELOCK_ADDRESS",
        os.environ.get("TIMELOCK_ADDRESS", ""),
    )
    body: dict = {
        "ledger": ledger,
        "global_treasury": cast_call(ledger, "globalTreasury()(address)"),
        "govfreeze_v2_timelock": v2_tl,
        "global_treasury_v2_match": (cast_call(ledger, "globalTreasury()(address)") or "").lower()
        == (v2_tl or "").lower(),
        "funding_source": cast_call(ledger, "fundingSource()(address)"),
        "latest_epoch_id": to_int(cast_call(ledger, "latestEpochId()(uint256)")),
        "bps_steward": to_int(cast_call(ledger, "bpsStewardPath()(uint16)")),
        "bps_global": to_int(cast_call(ledger, "bpsGlobalTreasury()(uint16)")),
        "balances": {
            "steward_vault": erc20_balance(token, steward_v),
            "unallocated_vault": erc20_balance(token, unalloc_v),
            "global_treasury": erc20_balance(token, v2_tl or ""),
            "ledger": erc20_balance(token, ledger),
        },
    }
    if epoch and body["latest_epoch_id"] and epoch <= (body["latest_epoch_id"] or 0):
        eid = str(epoch)
        body["epoch"] = {
            "id": epoch,
            "status": to_int(cast_call(ledger, "epochStatus(uint256)(uint8)", eid)),
            "net_profit_prime": to_int(cast_call(ledger, "epochNetProfitPrime(uint256)(int256)", eid)),
        }
        raw = subprocess.run(
            [
                "cast",
                "call",
                ledger,
                "epochSplitAmounts(uint256)(uint256,uint256,uint256)",
                eid,
                "--rpc-url",
                os.environ.get("CHAIN_RPC_URL", "https://sepolia.drpc.org"),
            ],
            capture_output=True,
            text=True,
        )
        if raw.returncode == 0:
            nums = [to_int(p.split()[0]) for p in raw.stdout.strip().split("\n") if p.strip()]
            if len(nums) >= 3:
                body["epoch"]["split"] = {
                    "steward": nums[0],
                    "unallocated": nums[1],
                    "global": nums[2],
                }
    return body


def verify(pre: dict, post: dict) -> dict:
    epoch = post.get("epoch") or {}
    split = epoch.get("split") or {}
    npp = epoch.get("net_profit_prime") or 0
    steward = split.get("steward", 0)
    unalloc = split.get("unallocated", 0)
    global_amt = split.get("global", 0)
    expect_steward_leg = (npp * 4500) // 10000 if npp > 0 else 0
    expect_global = (npp * 5500) // 10000 if npp > 0 else 0
    math_ok = npp > 0 and steward + unalloc + global_amt == npp
    if npp > 0:
        math_ok = (
            math_ok
            and abs((steward + unalloc) - expect_steward_leg) <= 1
            and abs(global_amt - expect_global) <= 1
        )
    blockers = []
    if not post.get("global_treasury_v2_match"):
        blockers.append("globalTreasury != GovFreeze V2 Timelock")
    if epoch.get("status") != 4:
        blockers.append(f"epoch status={epoch.get('status')} expected SPLIT_COMPLETED(4)")
    if not math_ok:
        blockers.append("45/55 split math or conservation failed")
    if post["balances"]["global_treasury"] <= (pre.get("balances", {}).get("global_treasury", 0)):
        blockers.append("global treasury balance did not increase after split")
    return {
        "cutover_ok": post.get("global_treasury_v2_match"),
        "split_completed": epoch.get("status") == 4,
        "math_ok": math_ok,
        "fund_flow": {
            "net_profit_prime": npp,
            "split": split,
            "treasury_delta": post["balances"]["global_treasury"]
            - pre.get("balances", {}).get("global_treasury", 0),
            "unallocated_vault_balance": post["balances"]["unallocated_vault"],
        },
        "blockers": blockers,
        "verdict": "PASS" if not blockers else "FAIL",
    }


def load_env_file() -> None:
    root = Path(__file__).resolve().parents[3]
    env_file = os.environ.get(
        "PHASE2_CHAIN_DEPLOY_ENV",
        str(root / "scripts/dev/.env.phase2-chain-deploy.local"),
    )
    if not Path(env_file).is_file():
        return
    for line in Path(env_file).read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--epoch", type=int, default=0)
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--pre")
    ap.add_argument("--post")
    args = ap.parse_args()
    load_env_file()

    if args.verify:
        pre = json.loads(Path(args.pre).read_text(encoding="utf-8"))
        post = json.loads(Path(args.post).read_text(encoding="utf-8"))
        verdict = verify(pre, post)
        Path(args.out).write_text(json.dumps(verdict, indent=2), encoding="utf-8")
        print(f"TT_CP_CUTOVER_DRILL_VERIFY: {verdict['verdict']}")
        return 0 if verdict["verdict"] == "PASS" else 1

    body = snapshot(args.epoch or None)
    Path(args.out).write_text(json.dumps(body, indent=2), encoding="utf-8")
    print(f"TT_CP_CUTOVER_DRILL_SNAPSHOT: OK -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
