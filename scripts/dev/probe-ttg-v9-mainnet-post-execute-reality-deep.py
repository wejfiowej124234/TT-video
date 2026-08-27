#!/usr/bin/env python3
"""Read-only deep post_execute Reality rows (no broadcast, no Solidity change)."""
from __future__ import annotations

import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_ttg_v9_periphery_governance_upgrade"
OUT = EV / "mainnet_final_cutover_prep/POST_EXECUTE_REALITY_DEEP_ROWS.json"

NEW = "0xF61880fe9943BBc624F487782E2fB35d8Ae50E3A"
OLD = "0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f"
VAULT = "0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C"
PM = "0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b"
FR = "0x2F3F4120d9d10b52f7FF762aC7E8f563454A9704"
POOL = "0x65714bbF2f3B8bB7E4c71F5D51C0bbe6869dAB68"
STAKE = "0xa9839Ef49e1Cc6095b41764DCf81346250A469F8"
GOV = "0xD4b6162CB344af2C44689717edDFEe21e9082205"
TTG = "0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9"
SR = "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372"
EF = "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6"
V8FR = "0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72"
NORM = "0xe1e732EfBf9B010a9204054467256d3d93f3CdD4"
MAX = 25_000_000_000_000 * 10**18
RPCs = (
    "https://ethereum.publicnode.com",
    "https://ethereum-rpc.publicnode.com",
    "https://cloudflare-eth.com",
)

rows: list[dict] = []
fails: list[str] = []


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def rec(gate: str, name: str, ok: bool, detail: str) -> None:
    status = "PASS" if ok else "FAIL"
    rows.append({"gate": gate, "name": name, "status": status, "detail": detail})
    if not ok:
        fails.append(name)


def cast(args: list[str], *, expect_fail: bool = False, timeout: int = 45) -> tuple[str, bool]:
    last = ""
    for rpc in RPCs:
        for _ in range(2):
            proc = subprocess.run(
                ["cast", *args, "--rpc-url", rpc],
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
            if expect_fail:
                if proc.returncode != 0:
                    return ((proc.stderr or proc.stdout or "reverted").strip()[:300], True)
            elif proc.returncode == 0:
                return (proc.stdout.strip(), True)
            last = ((proc.stderr or proc.stdout or "")[:300])
            time.sleep(0.3)
    return (last, False)


def u(text: str, line: int = 0) -> int:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    tok = lines[line].split()[0]
    if tok.startswith("0x") and len(tok) > 2:
        return int(tok, 16)
    return int(tok)


def addr(text: str) -> str:
    return text.split()[0]


def boolish(text: str) -> bool:
    return text.split()[0].lower() in ("true", "1")


def main() -> int:
    out, ok = cast(["chain-id"])
    rec("R0", "mainnet", ok and out.strip() == "1", out)
    if not (ok and out.strip() == "1"):
        return 2

    d, ok = cast(["call", NEW, "delay()(uint256)"])
    rec("R1", "new_tl_delay_43200", ok and u(d) == 43200, d if ok else d)
    adm, ok = cast(["call", NEW, "admin()(address)"])
    rec("R1", "new_tl_admin_norm", ok and addr(adm).lower() == NORM.lower(), adm if ok else adm)
    gv, ok = cast(["call", NEW, "governor()(address)"])
    rec(
        "R1",
        "new_tl_governor_unset",
        ok and addr(gv).lower() == "0x0000000000000000000000000000000000000000",
        gv if ok else gv,
    )

    va, ok = cast(["call", VAULT, "admin()(address)"])
    rec("R2", "vault_admin_new", ok and addr(va).lower() == NEW.lower(), va if ok else va)
    vm, ok = cast(["call", VAULT, "market()(address)"])
    rec("R2", "vault_market_pm", ok and addr(vm).lower() == PM.lower(), vm if ok else vm)
    pt, ok = cast(["call", PM, "timelock()(address)"])
    rec("R2", "pm_timelock_new", ok and addr(pt).lower() == NEW.lower(), pt if ok else pt)
    sc, ok = cast(["call", PM, "seededBatchCount()(uint256)"])
    rec("R2", "seeded_5", ok and u(sc) == 5, sc if ok else sc)
    ver, okv = cast(["call", PM, "version()(string)"])
    rec(
        "R2",
        "pm_version_sw5",
        okv and "ttg_batch_primary_market_v9_short_window_five_round" in ver.replace('"', ""),
        ver if okv else ver,
    )

    # V9_SHORT_WINDOW_FIVE_ROUND — TtgV9Constants.sol (post Timelock execute)
    expected = {
        1: (1792054800, 1792659600, 1_250_000_000 * 10**18, 1),
        2: (1794474000, 1795683600, 6_250_000_000 * 10**18, 3),
        3: (1799744400, 1801558800, 31_250_000_000 * 10**18, 5),
        4: (1804582800, 1807174800, 312_500_000_000 * 10**18, 7),
        5: (1809594000, 1813482000, 625_000_000_000 * 10**18, 9),
    }
    for i, exp in expected.items():
        raw, ok = cast(
            [
                "call",
                PM,
                "batches(uint256)(uint64,uint64,uint256,uint32,uint256,uint256,bool,bool,bool)",
                str(i),
            ]
        )
        if not ok:
            rec("R2", f"batch_{i}_cap_price_window", False, raw)
            continue
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        start = int(lines[0].split()[0])
        end = int(lines[1].split()[0])
        cap = int(lines[2].split()[0])
        price = int(lines[3].split()[0])
        sold = int(lines[4].split()[0])
        alloc = int(lines[5].split()[0])
        armed = lines[6].split()[0].lower() == "true"
        match = (
            start == exp[0]
            and end == exp[1]
            and cap == exp[2]
            and price == exp[3]
            and sold == 0
            and alloc == 0
            and not armed
        )
        rec("R2", f"batch_{i}_cap_price_window", match, f"{start}/{end}/{price}")

    fo, ok = cast(["call", FR, "owner()(address)"])
    rec("R3", "fr_owner_new", ok and addr(fo).lower() == NEW.lower(), fo if ok else fo)
    pp, ok = cast(["call", FR, "projectPool()(address)"])
    rec("R3", "fr_project_pool", ok and addr(pp).lower() == POOL.lower(), pp if ok else pp)
    sb, ok1 = cast(["call", FR, "stewardShareBps()(uint256)"])
    pb, ok2 = cast(["call", FR, "projectShareBps()(uint256)"])
    rec(
        "R3",
        "active_split_45_55",
        ok1 and ok2 and u(sb) == 4500 and u(pb) == 5500,
        f"{sb}/{pb}",
    )
    pf, ok = cast(["call", FR, "platformFeeBps()(uint256)"])
    rec("R3", "platform_fee_500", ok and u(pf) == 500, pf if ok else pf)
    dp, ok = cast(["call", FR, "distributePaused()(bool)"])
    rec("R3", "distribute_not_paused", ok and not boolish(dp), dp if ok else dp)
    csr, ok = cast(["call", FR, "feeRouterCaller(address)(bool)", SR])
    rec("R3", "caller_sr", ok and boolish(csr), csr if ok else csr)
    cef, ok = cast(["call", FR, "feeRouterCaller(address)(bool)", EF])
    rec("R3", "caller_ef", ok and boolish(cef), cef if ok else cef)
    extras = [
        VAULT,
        PM,
        NEW,
        OLD,
        NORM,
        POOL,
        STAKE,
        GOV,
        V8FR,
        "0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970",
    ]
    extra_true = []
    for a in extras:
        v, ok = cast(["call", FR, "feeRouterCaller(address)(bool)", a])
        if ok and boolish(v):
            extra_true.append(a)
    rec("R3", "caller_acl_no_extras", extra_true == [], str(extra_true))

    for code, label in (("0x4a50", "JP"), ("0x5553", "US"), ("0x434e", "CN")):
        sp, ok = cast(["call", FR, "stewardPayout(bytes2)(address)", code])
        rec(
            "R3",
            f"no_steward_{label}_payout_unset",
            ok and addr(sp).lower() == "0x0000000000000000000000000000000000000000",
            sp if ok else sp,
        )

    inv, did = cast(
        ["call", FR, "setFeeSplit(uint256,uint256)", "4000", "4000", "--from", NEW],
        expect_fail=True,
    )
    rec("R4", "invalid_split_sum_reverts", did, inv)
    unauth, did = cast(
        ["call", FR, "setFeeSplit(uint256,uint256)", "4500", "5500", "--from", NORM],
        expect_fail=True,
    )
    rec("R4", "setFeeSplit_non_owner_reverts", did, unauth)

    po, ok = cast(["call", POOL, "owner()(address)"])
    rec("R4", "pool_owner_new", ok and addr(po).lower() == NEW.lower(), po if ok else po)
    cb, ok = cast(["call", POOL, "capBps()(uint256)"])
    rec("R4", "p4_cap_bps_3000", ok and u(cb) == 3000, cb if ok else cb)
    ps, ok = cast(["call", POOL, "periodSeconds()(uint256)"])
    rec("R4", "p4_period_90d", ok and u(ps) == 90 * 24 * 3600, ps if ok else ps)
    cap_hi, did = cast(["call", POOL, "setCapBps(uint256)", "10001", "--from", NEW], expect_fail=True)
    rec("R4", "setCapBps_over_10000_reverts", did, cap_hi)
    st, ok = cast(["call", STAKE, "owner()(address)"])
    rec("R4", "stake_owner_new", ok and addr(st).lower() == NEW.lower(), st if ok else st)

    gt, ok = cast(["call", GOV, "token()(address)"])
    rec("R5", "gov_token_ttg", ok and addr(gt).lower() == TTG.lower(), gt if ok else gt)
    gtl, ok = cast(["call", GOV, "timelock()(address)"])
    rec("R5", "gov_timelock_new", ok and addr(gtl).lower() == NEW.lower(), gtl if ok else gtl)

    ts, ok = cast(["call", TTG, "totalSupply()(uint256)"])
    rec("R5", "ttg_supply_25t", ok and u(ts) == MAX, ts if ok else ts)
    ms, okm = cast(["call", TTG, "MAX_SUPPLY()(uint256)"])
    rec("R5", "ttg_max_supply_25t", okm and u(ms) == MAX, ms if okm else ms)
    rec("R5", "supply_lte_max", ok and okm and u(ts) <= u(ms), f"{ts}/{ms}")
    pv, ok = cast(["call", TTG, "publicSaleVault()(address)"])
    rec("R5", "ttg_vault_keep", ok and addr(pv).lower() == VAULT.lower(), pv if ok else pv)
    dt, ok = cast(["call", TTG, "daoTimelock()(address)"])
    rec("R5", "ttg_daoTimelock_recorded", ok, dt if ok else dt)
    burn_eoa, did = cast(["call", TTG, "protocolBurn(uint256)", "1", "--from", NORM], expect_fail=True)
    rec("R5", "protocolBurn_non_burner_reverts", did, burn_eoa)
    mint_sel, did = cast(["call", TTG, "mint(address,uint256)", NORM, "1"], expect_fail=True)
    rec("R5", "no_mint_selector", did, mint_sel)

    srf, ok = cast(["call", SR, "feeRouter()(address)"])
    rec(
        "R6",
        "sr_feeRouter_still_v8_not_cutover",
        ok and addr(srf).lower() == V8FR.lower(),
        srf if ok else srf,
    )
    code, ok = cast(["code", EF])
    rec("R6", "escrow_factory_code", ok and code not in ("0x", ""), f"len={len(code) if ok else 0}")
    code2, ok = cast(["code", SR])
    rec("R6", "settlement_router_code", ok and code2 not in ("0x", ""), f"len={len(code2) if ok else 0}")

    ids = {
        "idBind": "0x8b96ff20e9b91aabc9e53c20d4555e311cc0813e26e84a123b6ef5ff8176d358",
        "idSeed": "0x4da49a34030eba44cb5112bb65cd2a3040179589500a00c347741097b38dfaa0",
        "idCallerSr": "0x54c2602223f7f0d26480918b2206f178c1d5fac887696c5e6e12bd0ada7badd3",
        "idCallerEf": "0x632cd34adeb57a4e4705e0a2268fe4bdcf8ffa4213e879bd4845347e675a67b0",
    }
    for k, oid in ids.items():
        raw, ok = cast(["call", NEW, "operations(bytes32)(uint256,bool)", oid])
        if not ok:
            rec("R7", f"{k}_done", False, raw)
            continue
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        rec("R7", f"{k}_done", lines[1].split()[0].lower() == "true", lines[1])

    for name, a in (("vault", VAULT), ("pm", PM), ("fr", FR), ("pool", POOL), ("stake", STAKE)):
        al, ok = cast(["call", NEW, "allowedExecutionTarget(address)(bool)", a])
        rec("R7", f"new_tl_allow_{name}", ok and boolish(al), al if ok else al)

    payload = {
        "stamp": "POST_EXECUTE_REALITY_DEEP_ROWS",
        "recorded_at_utc": utc_now(),
        "fail_count": len(fails),
        "fails": fails,
        "rows": rows,
        "TT_PRODUCTION_GO": "NO_GO",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"DEEP_REALITY fail={len(fails)} rows={len(rows)}")
    for n in fails:
        print(f"  FAIL {n}")
    return 2 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
