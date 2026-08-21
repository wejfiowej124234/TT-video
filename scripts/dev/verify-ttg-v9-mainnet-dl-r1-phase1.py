#!/usr/bin/env python3
"""Phase-1 Mainnet Design Lock verify (post-broadcast, pre-48h execute).

Exact Match rule for contracts with immutables:
  - Compare CREATE tx input prefix to pinned/local creation bytecode (not raw runtime code).
  - Runtime keccak differs after immutable embedding; length may still match.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


def _rpcs() -> list[str]:
    primary = os.environ["CHAIN_RPC_URL"]
    alts = [
        primary,
        "https://ethereum.publicnode.com",
        "https://ethereum-rpc.publicnode.com",
        "https://rpc.ankr.com/eth",
        "https://1rpc.io/eth",
    ]
    out: list[str] = []
    for r in alts:
        if r and r not in out:
            out.append(r)
    return out


def cast(*args: str) -> str:
    last: Exception | None = None
    for rpc in _rpcs():
        for _ in range(3):
            try:
                out = subprocess.check_output(
                    ["cast", *args, "--rpc-url", rpc], text=True, stderr=subprocess.STDOUT
                ).strip()
                os.environ["CHAIN_RPC_URL"] = rpc
                return out.split()[0] if out else ""
            except subprocess.CalledProcessError as e:
                last = e
    assert last is not None
    raise last


def eth_units(whole: int) -> str:
    return str(whole) + ("0" * 18)


def load_local_creation(root: Path, name: str) -> str | None:
    for c in (root / "contracts/out-ttg-v9").rglob(f"{name}.json"):
        j = json.loads(c.read_text(encoding="utf-8"))
        b = j.get("bytecode")
        if not b:
            continue
        obj = b["object"] if isinstance(b, dict) else b
        if not obj or obj == "0x":
            continue
        return obj if obj.startswith("0x") else "0x" + obj
    return None


def sha256_hex(hx: str) -> str:
    if hx.startswith("0x"):
        hx = hx[2:]
    return "sha256:" + hashlib.sha256(bytes.fromhex(hx)).hexdigest()


def main() -> int:
    root = Path(os.environ.get("ROOT") or Path(__file__).resolve().parents[2])
    ev = Path(os.environ["EVIDENCE"])
    audit = Path(os.environ["AUDIT_EV"])
    pin = json.loads(Path(os.environ["PIN"]).read_text(encoding="utf-8"))
    broadcast = root / "contracts/broadcast/TtgV9DesignLockMainnet.s.sol/1/run-latest.json"
    run = json.loads(broadcast.read_text(encoding="utf-8"))

    addrs: dict[str, str] = {}
    for line in (ev / "addresses.env").read_text(encoding="utf-8").splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            addrs[k] = v.strip()

    norm_m = os.environ["NORM_MARKETING"]
    norm_t = os.environ["NORM_TEAM"]
    norm_tr = os.environ["NORM_TREASURY"]
    legacy_safe = os.environ["LEGACY_SAFE"]
    legacy_p4 = os.environ["LEGACY_P4CAP"]
    keep_sr = os.environ["KEEP_SR"]
    total_25t = os.environ["TOTAL_25T"]

    checks: list[dict] = []

    def chk(name: str, ok: bool, detail: str = "") -> None:
        checks.append({"name": name, "pass": bool(ok), "detail": str(detail)})
        print(("PASS" if ok else "FAIL"), name, detail)

    chk("broadcast_chain_id_1", run.get("chain") == 1, str(run.get("chain")))

    admin = cast("call", addrs["TIMELOCK"], "admin()(address)")
    chk("timelock_admin_norm_marketing", admin.lower() == norm_m.lower(), admin)
    chk("timelock_admin_not_safe", admin.lower() != legacy_safe.lower(), admin)
    delay = cast("call", addrs["TIMELOCK"], "delay()(uint256)")
    chk("timelock_delay_48h", delay == "172800", delay)
    usdc_t = cast("call", addrs["MARKET"], "usdcTreasury()(address)")
    chk("market_usdcTreasury_is_new_pool", usdc_t.lower() == addrs["POOL"].lower(), usdc_t)
    chk("market_usdcTreasury_not_legacy_p4cap", usdc_t.lower() != legacy_p4.lower(), usdc_t)
    guardian = cast("call", addrs["MARKET"], "guardian()(address)")
    chk("guardian_norm_treasury", guardian.lower() == norm_tr.lower(), guardian)
    gov = cast("call", addrs["TIMELOCK"], "governor()(address)")
    chk("timelock_governor_set", gov.lower() == addrs["GOVERNOR"].lower(), gov)

    ts = cast("call", addrs["TTG"], "totalSupply()(uint256)")
    chk("genesis_totalSupply_25T", ts == total_25t, ts)
    vault_bal = cast("call", addrs["TTG"], "balanceOf(address)(uint256)", addrs["VAULT"])
    tl_bal = cast("call", addrs["TTG"], "balanceOf(address)(uint256)", addrs["TIMELOCK"])
    team_bal = cast("call", addrs["TTG"], "balanceOf(address)(uint256)", norm_t)
    mkt_bal = cast("call", addrs["TTG"], "balanceOf(address)(uint256)", norm_m)
    tre_bal = cast("call", addrs["TTG"], "balanceOf(address)(uint256)", norm_tr)
    chk("genesis_public_50pct_vault", vault_bal == eth_units(12_500_000_000_000), vault_bal)
    chk("genesis_dao_35pct_timelock", tl_bal == eth_units(8_750_000_000_000), tl_bal)
    chk("genesis_team_3pct", team_bal == eth_units(750_000_000_000), team_bal)
    chk("genesis_marketing_5pct", mkt_bal == eth_units(1_250_000_000_000), mkt_bal)
    chk("genesis_treasury_7pct", tre_bal == eth_units(1_750_000_000_000), tre_bal)

    # Creation Exact Match (immutable-safe)
    for t in run.get("transactions", []):
        if t.get("transactionType") != "CREATE":
            continue
        name = t.get("contractName") or ""
        inp = (t.get("transaction") or {}).get("input") or ""
        local_c = load_local_creation(root, name)
        if not local_c or not inp:
            continue
        prefix_ok = inp.lower().startswith(local_c.lower())
        art = pin["bytecode_artifacts"].get(name)
        pin_ok = True
        if art:
            pin_ok = sha256_hex(local_c) == art["creation_sha256"]
        chk(f"creation_exact_{name}", prefix_ok and pin_ok, t.get("contractAddress"))
        # nested AtomicDeployer creates
        for ac in t.get("additionalContracts") or []:
            an = ac.get("contractName") or ""
            init = ac.get("initCode") or ""
            lc = load_local_creation(root, an)
            if not lc or not init:
                continue
            a_art = pin["bytecode_artifacts"].get(an)
            a_pin_ok = True if not a_art else sha256_hex(lc) == a_art["creation_sha256"]
            chk(
                f"creation_exact_nested_{an}",
                init.lower().startswith(lc.lower()) and a_pin_ok,
                ac.get("address"),
            )

    # AtomicDeployer constructor Norm pins
    atomic_tx = next(
        (
            t
            for t in run["transactions"]
            if t.get("contractName") == "TtgV9AtomicDeployerMainnet"
        ),
        None,
    )
    if atomic_tx:
        args = atomic_tx.get("arguments") or []
        chk("atomic_usdc_circle", args[0].lower() == "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", args[0])
        chk("atomic_usdcTreasury_new_pool", args[1].lower() == addrs["POOL"].lower(), args[1])
        chk("atomic_timelock_new_solo", args[2].lower() == addrs["TIMELOCK"].lower(), args[2])
        chk("atomic_guardian_treasury", args[3].lower() == norm_tr.lower(), args[3])
        chk("atomic_team", args[4].lower() == norm_t.lower(), args[4])
        chk("atomic_marketing", args[5].lower() == norm_m.lower(), args[5])
        chk("atomic_treasury", args[6].lower() == norm_tr.lower(), args[6])
        chk("atomic_voting_delay_floor", str(args[7]) == "7200", str(args[7]))
        chk("atomic_voting_period_floor", str(args[8]) == "50400", str(args[8]))

    caller_sr = cast("call", addrs["FEE_ROUTER"], "feeRouterCaller(address)(bool)", keep_sr)
    chk("fee_caller_sr_false_until_48h_execute", caller_sr.lower() in ("false", "0"), caller_sr)
    chk(
        "fee_ingress_zero",
        addrs.get("FEE_INGRESS", "").lower().endswith("0" * 40),
        addrs.get("FEE_INGRESS"),
    )
    sr_fr = cast("call", keep_sr, "feeRouter()(address)")
    chk("sr_feeRouter_not_yet_new", sr_fr.lower() != addrs["FEE_ROUTER"].lower(), sr_fr)

    hard_fail = [c for c in checks if not c["pass"]]
    out = {
        "stamp": "V9_MAINNET_BROADCAST_PHASE1_DEPLOYED_SCHEDULED",
        "chain_id": 1,
        "candidate": "V9_AUDIT_CANDIDATE_DESIGN_LOCK",
        "remediation_wave": "DL_R1",
        "addresses": addrs,
        "broadcast_run": str(broadcast).replace("\\", "/"),
        "exact_match_method": "creation_bytecode_prefix_plus_norm_constructor_args",
        "runtime_hash_note": "immutable-bearing contracts differ from forge deployedBytecode pin by design",
        "checks": checks,
        "hard_fail_count": len(hard_fail),
        "execute_eta_note": "SoloTimelock delay 172800s — execute idBind/idSeed/idCallerSr/idCallerEf after eta",
        "keep_sr_setFeeRouter_note": "SettlementRouter.owner=KEEP Timelock; Safe->KEEP Timelock required",
        "verified_stop_ready": False,
        "tt_production_go": "UNCHANGED_NOT_AUTHORIZED",
    }
    payload = json.dumps(out, indent=2) + "\n"
    (ev / "post_deploy_verify.json").write_text(payload, encoding="utf-8")
    (audit / "V9_MAINNET_BROADCAST_PHASE1_DEPLOYED_SCHEDULED.json").write_text(payload, encoding="utf-8")
    if hard_fail:
        for c in hard_fail:
            print("HARD_FAIL", c)
        return 2
    print("PHASE1_VERIFY_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
