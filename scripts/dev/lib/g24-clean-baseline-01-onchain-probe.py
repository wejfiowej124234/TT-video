#!/usr/bin/env python3
"""G24-CLEAN-BASELINE-01 · on-chain root-cause probe."""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

ROOT = Path(os.environ.get("G24_CB_ROOT", ".")).resolve()
EVID = Path(os.environ["G24_CB_EVID"])
EVID.mkdir(parents=True, exist_ok=True)

RPC = os.environ.get("CHAIN_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")
TL = os.environ.get("TIMELOCK_ADDRESS", os.environ.get("GOV_FREEZE_V1_TIMELOCK_ADDRESS", ""))
GOV = os.environ.get("GOVERNOR_ADDRESS", os.environ.get("GOV_FREEZE_V1_GOVERNOR_ADDRESS", ""))
PM = os.environ.get("PRIMARY_MARKET_ADDRESS", "")
TR = os.environ.get("TREASURY_P4_CAP_ADDRESS", "")
SEAT = os.environ.get("SEAT_REGISTRY_ADDRESS", "")
POOL = os.environ.get(
    "REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS",
    os.environ.get("REGION_STEWARD_STAKE_POOL_ADDRESS", ""),
)
DE_LEDGER = os.environ.get("COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS", "")
TTG = os.environ.get("GOVERNANCE_TOKEN_ADDRESS", "")
PROBE = "0x0000000000000000000000000000000000000001"

JURIS = {
    "CN": 400, "US": 400, "FR": 450, "ES": 450, "JP": 250,
    "TH": 250, "SG": 200, "KR": 200, "AU": 150, "AE": 150,
}


def cast_call(addr: str, sig: str, *args: str) -> str | None:
    if not addr:
        return None
    cmd = ["cast", "call", addr, sig, *args, "--rpc-url", RPC]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None
    return r.stdout.strip().split()[0] if r.stdout.strip() else None


def j_hex(j: str) -> str:
    return "0x" + j.encode("ascii").hex()


def proxy_row(label: str, proxy: str) -> dict:
    admin = cast_call(proxy, "admin()(address)") or ""
    impl = cast_call(proxy, "implementation()(address)") or ""
    ok = admin.lower() == TL.lower() and impl not in ("", "0x" + "0" * 40)
    return {
        "label": label,
        "proxy": proxy,
        "admin": admin,
        "implementation": impl,
        "admin_is_timelock": admin.lower() == TL.lower() if admin and TL else False,
        "status": "PASS" if ok else "FAIL",
    }


def allowed_target(addr: str) -> bool | None:
    if not TL or not addr:
        return None
    raw = cast_call(TL, "allowedExecutionTarget(address)(bool)", addr)
    if raw is None:
        return None
    return raw.lower() == "true"


def pending_configure_op(j: str, bps: int) -> dict:
    jh = j_hex(j)
    enc = subprocess.run(
        ["cast", "abi-encode", "f(string,bytes2,uint256)", "TTG-STAKE-POOL-JURIS", jh, str(bps)],
        capture_output=True, text=True,
    )
    salt = subprocess.run(["cast", "keccak", enc.stdout.strip()], capture_output=True, text=True).stdout.strip()
    data = subprocess.run(
        ["cast", "calldata", "configureJurisdiction(bytes2,uint256)", jh, str(bps)],
        capture_output=True, text=True,
    ).stdout.strip()
    op_id = cast_call(TL, "hashOperation(address,uint256,bytes,bytes32)(bytes32)", POOL, "0", data, salt) or ""
    ready, done = "0", False
    if op_id:
        raw = subprocess.run(
            ["cast", "call", TL, "operations(bytes32)(uint256,bool,address,uint256,bytes)", op_id, "--rpc-url", RPC],
            capture_output=True, text=True,
        )
        if raw.returncode == 0:
            parts = raw.stdout.replace("\n", " ").split()
            if parts:
                ready = parts[0]
                done = parts[1].lower() == "true" if len(parts) > 1 else False
    return {
        "jurisdiction": j,
        "operation_id": op_id,
        "ready_at_unix": int(ready) if ready.isdigit() else 0,
        "done": done,
        "patch_pending": int(ready) > 0 and not done,
    }


findings: list[dict] = []
proxies = [
    proxy_row("Governor", GOV),
    proxy_row("TreasuryP4Cap", TR),
    proxy_row("PrimaryMarket", PM),
    proxy_row("SeatRegistry", SEAT),
    proxy_row("StakePool", POOL),
]
for p in proxies:
    if p["status"] == "FAIL":
        findings.append({"id": "CB-01", "severity": "P0", "title": f"{p['label']} proxy admin/impl", "detail": p})

allowed = {
    "governor": allowed_target(GOV),
    "primary_market": allowed_target(PM),
    "treasury_p4_cap": allowed_target(TR),
    "seat_registry": allowed_target(SEAT),
    "stake_pool": allowed_target(POOL),
}
required_allowed = ["governor", "primary_market", "treasury_p4_cap", "seat_registry", "stake_pool"]
for k in required_allowed:
    if allowed.get(k) is not True:
        findings.append({
            "id": "CB-02",
            "severity": "P0",
            "title": f"allowedExecutionTarget({k})",
            "detail": {"expected": True, "actual": allowed.get(k)},
        })

juris_rows = []
juris_fail = 0
for j, exp_bps in JURIS.items():
    bps = int(cast_call(POOL, "stewardStakeBps(bytes2)(uint256)", j_hex(j)) or 0)
    min_stake = int(cast_call(POOL, "minStakeAmount(bytes2)(uint256)", j_hex(j)) or 0)
    ok = bps == exp_bps and min_stake > 0
    if not ok:
        juris_fail += 1
    juris_rows.append({
        "jurisdiction": j,
        "expected_bps": exp_bps,
        "on_chain_bps": bps,
        "min_stake_wei": str(min_stake),
        "status": "PASS" if ok else "FAIL",
    })

if juris_fail > 0:
    findings.append({
        "id": "CB-03",
        "severity": "P0",
        "title": "Stake Pool 10国一次初始化不完整",
        "detail": {"failures": juris_fail, "note": "minStake=0 / bps=0 — 非 deploy-time bootstrap"},
    })

boot_raw = cast_call(POOL, "jurisdictionsBootstrapped()(bool)")
pool_owner = cast_call(POOL, "owner()(address)") or ""
seat_pool = cast_call(SEAT, "stakePool()(address)") or ""
if pool_owner.lower() != TL.lower():
    findings.append({"id": "CB-04", "severity": "P0", "title": "StakePool.owner != Timelock", "detail": pool_owner})
if seat_pool.lower() != POOL.lower():
    findings.append({"id": "CB-05", "severity": "P0", "title": "SeatRegistry.stakePool mismatch", "detail": seat_pool})

patch_ops = [pending_configure_op(j, bps) for j, bps in JURIS.items()]
patch_pending = sum(1 for o in patch_ops if o["patch_pending"])
if patch_pending > 0:
    findings.append({
        "id": "CB-06",
        "severity": "P0",
        "title": "补丁式 Timelock schedule 待 execute（非干净基线）",
        "detail": {"pending_ops": patch_pending, "path": "10x configureJurisdiction"},
    })

de_bps = {}
if DE_LEDGER:
    sp = cast_call(DE_LEDGER, "bpsStewardPath()(uint16)")
    gt = cast_call(DE_LEDGER, "bpsGlobalTreasury()(uint16)")
    de_bps = {"steward": int(sp or 0), "global": int(gt or 0)}
    if de_bps.get("steward") != 4500 or de_bps.get("global") != 5500:
        findings.append({"id": "CB-07", "severity": "P1", "title": "DE Country Pool NetProfit bps", "detail": de_bps})

country_pool_config = ROOT / "config/jurisdiction_country_pool_net_profit.sepolia.json"
cp_entries = []
if country_pool_config.is_file():
    cfg = json.loads(country_pool_config.read_text(encoding="utf-8"))
    cp_entries = cfg.get("entries", [])
if len(cp_entries) < 10:
    findings.append({
        "id": "CB-08",
        "severity": "P1",
        "title": "Country Pool NetProfit 配置仅 pilot（非 10 国 ledger）",
        "detail": {"configured_jurisdictions": [e.get("jurisdiction") for e in cp_entries], "expected_note": "Gate-2.4 pilot DE OK · 与 10 国 Stake SSOT 分层"},
    })

old_pilot = os.environ.get("COUNTRY_POOL_LEDGER_PILOT_ADDRESS", "")
if old_pilot and old_pilot != DE_LEDGER:
    findings.append({
        "id": "CB-09",
        "severity": "P1",
        "title": "旧 CountryPoolLedgerV0 pilot 与 D-4555-B ledger 并存",
        "detail": {"pilot": old_pilot, "d4555b_de": DE_LEDGER},
    })

ttg_erc20 = {"approve_ok": None, "allowance_ok": None, "stake_pool_ttg_match": None}
if TTG and POOL:
    stake_pool_ttg = cast_call(POOL, "ttg()(address)") or ""
    ttg_erc20["stake_pool_ttg_match"] = stake_pool_ttg.lower() == TTG.lower()
    if not ttg_erc20["stake_pool_ttg_match"]:
        findings.append({
            "id": "CB-10",
            "severity": "P0",
            "title": "StakePool.ttg != GOVERNANCE_TOKEN_ADDRESS",
            "detail": {"pool_ttg": stake_pool_ttg, "env_ttg": TTG},
        })
    approve_ok = subprocess.run(
        ["cast", "call", TTG, "approve(address,uint256)(bool)", POOL, "1", "--from", PROBE, "--rpc-url", RPC],
        capture_output=True, text=True,
    )
    ttg_erc20["approve_ok"] = approve_ok.returncode == 0
    allowance_ok = subprocess.run(
        ["cast", "call", TTG, "allowance(address,address)(uint256)", PROBE, POOL, "--rpc-url", RPC],
        capture_output=True, text=True,
    )
    ttg_erc20["allowance_ok"] = allowance_ok.returncode == 0
    if not ttg_erc20["approve_ok"] or not ttg_erc20["allowance_ok"]:
        findings.append({
            "id": "CB-11",
            "severity": "P0",
            "title": "TTG 缺 approve/allowance（Stake transferFrom 不可达）",
            "detail": ttg_erc20,
        })

report = {
    "probe_id": "G24-CLEAN-BASELINE-01-ONCHAIN",
    "chain_id": 11155111,
    "addresses": {
        "timelock": TL,
        "governor": GOV,
        "primary_market": PM,
        "treasury_p4_cap": TR,
        "seat_registry": SEAT,
        "stake_pool_proxy": POOL,
        "country_pool_net_profit_de": DE_LEDGER,
        "governance_token": TTG,
    },
    "ttg_erc20": ttg_erc20,
    "proxies": proxies,
    "allowed_execution_target": allowed,
    "stake_pool_jurisdictions": juris_rows,
    "jurisdictions_bootstrapped_call": boot_raw,
    "stake_pool_owner": pool_owner,
    "seat_registry_stake_pool": seat_pool,
    "patch_timelock_ops": patch_ops,
    "patch_pending_count": patch_pending,
    "de_country_pool_bps": de_bps,
    "findings": findings,
    "finding_count": len(findings),
}
out = EVID / "onchain-root-cause-probe.json"
out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"wrote": str(out), "findings": len(findings)}, indent=2))
