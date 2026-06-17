#!/usr/bin/env python3
"""TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT · chain probe + four-ledger reconcile."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def cast_call(addr: str, sig: str, *args: str) -> str | None:
    if not addr:
        return None
    rpc = os.environ.get("CHAIN_RPC_URL", "")
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


def erc20_balance(token: str, holder: str) -> int | None:
    return to_int(cast_call(token, "balanceOf(address)(uint256)", holder))


def main() -> int:
    evid = Path(os.environ["CP_REVENUE_EVID"])
    rpc = os.environ.get("CHAIN_RPC_URL", "")
    ledger = os.environ.get("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS", "")
    steward_v = os.environ.get("COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS", "")
    unalloc_v = os.environ.get("COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS", "")
    token = os.environ.get(
        "COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS",
        os.environ.get("FUND_STACK_TOKEN_ADDRESS", ""),
    )
    api_ledger = os.environ.get("COUNTRY_POOL_LEDGER_ADDRESS", "")
    net_ledger = ledger
    timelock = os.environ.get("TIMELOCK_ADDRESS", "")

    steps: dict[str, dict] = {}

    # step-01 / 02 · ledger config
    bps_steward = to_int(cast_call(ledger, "bpsStewardPath()(uint16)"))
    bps_global = to_int(cast_call(ledger, "bpsGlobalTreasury()(uint16)"))
    jurisdiction_raw = cast_call(ledger, "jurisdiction()(bytes2)")
    latest_epoch = to_int(cast_call(ledger, "latestEpochId()(uint256)")) or 0
    owner = cast_call(ledger, "owner()(address)")
    global_treasury = cast_call(ledger, "globalTreasury()(address)")
    funding = cast_call(ledger, "fundingSource()(address)")

    steps["step-01-profit-accrual"] = {
        "latest_epoch_id": latest_epoch,
        "funding_source": funding,
        "owner": owner,
        "rpc": rpc,
    }
    if latest_epoch > 0:
        for eid in range(1, latest_epoch + 1):
            status = to_int(cast_call(ledger, "epochStatus(uint256)(uint8)", str(eid)))
            npp = to_int(cast_call(ledger, "epochNetProfitPrime(uint256)(int256)", str(eid)))
            steps["step-01-profit-accrual"][f"epoch_{eid}"] = {
                "status": status,
                "net_profit_prime": npp,
            }

    steps["step-02-netprofit-ledger"] = {
        "ledger": ledger,
        "jurisdiction": jurisdiction_raw,
        "settlement_token": token,
        "bps_steward_path": bps_steward,
        "bps_global_treasury": bps_global,
        "bps_sum_ok": (bps_steward or 0) + (bps_global or 0) == 10000,
        "steward_path_vault": steward_v,
        "unallocated_vault": unalloc_v,
        "global_treasury": global_treasury,
        "contract_version": cast_call(ledger, "version()(string)"),
    }

    # step-03 split
    split_step = {"epochs_split_completed": [], "math_ok": True}
    if latest_epoch > 0:
        for eid in range(1, latest_epoch + 1):
            status = to_int(cast_call(ledger, "epochStatus(uint256)(uint8)", str(eid)))
            if status != 4:  # SPLIT_COMPLETED
                continue
            npp = to_int(cast_call(ledger, "epochNetProfitPrime(uint256)(int256)", str(eid))) or 0
            if npp <= 0:
                continue
            raw = subprocess.run(
                [
                    "cast", "call", ledger,
                    "epochSplitAmounts(uint256)(uint256,uint256,uint256)",
                    str(eid),
                    "--rpc-url", rpc,
                ],
                capture_output=True, text=True,
            )
            parts = raw.stdout.strip().split("\n") if raw.returncode == 0 else []
            nums = [to_int(p.split()[0]) for p in parts if p.strip()]
            if len(nums) >= 3:
                steward_amt, unalloc_amt, global_amt = nums[0], nums[1], nums[2]
                expect_steward_leg = (npp * (bps_steward or 0)) // 10000
                expect_global = (npp * (bps_global or 0)) // 10000
                math_ok = (
                    steward_amt + unalloc_amt + global_amt == npp
                    and abs((steward_amt + unalloc_amt) - expect_steward_leg) <= 1
                    and abs(global_amt - expect_global) <= 1
                )
                split_step["epochs_split_completed"].append(
                    {
                        "epoch_id": eid,
                        "net_profit_prime": npp,
                        "steward_amount": steward_amt,
                        "unallocated_amount": unalloc_amt,
                        "global_amount": global_amt,
                        "math_ok": math_ok,
                    }
                )
                if not math_ok:
                    split_step["math_ok"] = False
    steps["step-03-split-4555"] = split_step

    steps["step-04-steward-path-vault"] = {
        "vault": steward_v,
        "token_balance": erc20_balance(token, steward_v),
        "ledger_wired": (cast_call(ledger, "stewardPathVault()(address)" ) or "").lower()
        == (steward_v or "").lower(),
    }
    steps["step-05-global-treasury"] = {
        "global_treasury": global_treasury,
        "timelock_match": (global_treasury or "").lower() == (timelock or "").lower(),
        "token_balance": erc20_balance(token, global_treasury or ""),
    }

    # API alignment probe (written by bash curl too; chain-side here)
    api_env_mismatch = bool(
        api_ledger and net_ledger and api_ledger.lower() != net_ledger.lower()
    )
    steps["step-06-api-chain-alignment"] = {
        "COUNTRY_POOL_LEDGER_ADDRESS": api_ledger,
        "COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS": net_ledger,
        "api_points_to_net_profit_ledger": not api_env_mismatch,
        "blocker_if_mismatch": api_env_mismatch,
    }

    # Frontend SSOT constants
    steps["step-08-frontend-constants"] = {
        "GOVERNANCE_NET_PROFIT_STEWARD_BPS": 4500,
        "GOVERNANCE_NET_PROFIT_GLOBAL_POOL_BPS": 5500,
        "matches_chain_bps": bps_steward == 4500 and bps_global == 5500,
    }

    steps["step-09-claim-path-boundary"] = {
        "steward_path": "StewardPathVault.depositFromLedger · Active Seat eligibility at split",
        "investor_claim": "InvestorDistributionClaim · governance-registered distribution_id only",
        "not_auto_p4_dividend": True,
        "note": "claim page orthogonal to 45% steward leg; P4 requires Governor+Timelock",
    }

    # Four-ledger verdict
    blockers = []
    if api_env_mismatch:
        blockers.append("API COUNTRY_POOL_LEDGER_ADDRESS != NET_PROFIT ledger")
    if bps_steward != 4500 or bps_global != 5500:
        blockers.append("chain bps != SSOT 4500/5500")
    if not split_step.get("epochs_split_completed"):
        blockers.append("no SPLIT_COMPLETED epoch on Sepolia DE pilot (split pipeline not exercised)")
    if split_step.get("epochs_split_completed") and not split_step.get("math_ok"):
        blockers.append("split amount math mismatch")
    if (global_treasury or "").lower() != (timelock or "").lower():
        blockers.append(
            f"ledger globalTreasury {global_treasury} != GovFreeze V2 TIMELOCK {timelock}"
        )

    four_ledger = {
        "chain": ledger,
        "api_ledger_env": api_ledger,
        "global_treasury": global_treasury,
        "govfreeze_v2_timelock": timelock,
        "global_treasury_timelock_match": (global_treasury or "").lower()
        == (timelock or "").lower(),
        "page_bps_ok": bps_steward == 4500 and bps_global == 5500,
        "split_observed": bool(split_step.get("epochs_split_completed")),
        "blockers": blockers,
        "verdict": "PASS" if not blockers else "FAIL",
    }

    for step_id, body in steps.items():
        out = evid / step_id / "chain-read.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(body, indent=2), encoding="utf-8")

    (evid / "four-ledger-reconcile.json").write_text(
        json.dumps(four_ledger, indent=2), encoding="utf-8"
    )

    overall = four_ledger["verdict"]
    report = {
        "audit_id": "TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT",
        "stamp_utc": os.environ.get("CP_REVENUE_STAMP", ""),
        "jurisdiction_pilot": "DE",
        "steps": list(steps.keys()),
        "four_ledger": four_ledger,
        "overall_verdict": overall,
        "phase_b_unblock_requires": [
            "four_ledger PASS",
            "run-enterprise-hat-l9-recheck PASS",
            "HAT_R1_PHASE_B_PAUSED=0",
        ],
    }
    (evid / "cp-revenue-hat-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"TT_CP_REVENUE_HAT: {overall} evidence={evid}")
    print(f"TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT_SUMMARY: {overall}")
    if blockers:
        print("BLOCKERS:", "; ".join(blockers))
    return 0 if overall == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
