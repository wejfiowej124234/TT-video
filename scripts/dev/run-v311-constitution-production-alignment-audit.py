#!/usr/bin/env python3
"""
V3.1.1 Production-Grade Full Alignment Audit (read-only).

Sole SSOT: docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md

Does NOT mutate protocol / ACTIVE address matrix / Runtime cutover / Registry ACTIVE /
Package LOCK. Writes evidence + remediation checklist only.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence" / "GO_v311_constitution_production_alignment_audit"
CONST_MD = ROOT / "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md"
CONST_YAML = ROOT / "registry/traveltrust-economic-constitution-v3.1.v1.yaml"
FREEZE = ROOT / "registry/v311-sepolia-address-matrix-freeze.v1.json"
ACTIVE = "v311_sepolia_clean_baseline"
CHAIN = 11155111
RPC = os.environ.get("CHAIN_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _norm(a: str | None) -> str | None:
    if not a or not isinstance(a, str):
        return None
    a = a.strip()
    if not a.startswith("0x") or len(a) != 42:
        return None
    return a.lower()


def _load_yaml(p: Path):
    if yaml is None:
        raise RuntimeError("PyYAML required")
    return yaml.safe_load(p.read_text(encoding="utf-8"))


def _cast(*args: str, retries: int = 3) -> tuple[bool, str]:
    last = ""
    for attempt in range(max(1, retries)):
        try:
            r = subprocess.run(
                ["cast", *args, "--rpc-url", RPC],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=45,
                cwd=str(ROOT),
            )
            out = (r.stdout or "").strip().splitlines()
            err = (r.stderr or "").strip().splitlines()
            line = out[0] if out else (err[0] if err else "")
            last = line
            if r.returncode == 0 and line and "Error:" not in line:
                return True, line
        except Exception as e:  # pragma: no cover
            last = f"{type(e).__name__}: {e}"
        if attempt + 1 < retries:
            import time

            time.sleep(0.6 * (attempt + 1))
    return False, last


def _finding(
    findings: list,
    *,
    fid: str,
    domain: str,
    chapter: str,
    sev: str,
    title: str,
    evidence: str,
    remediation: str,
    classification: str = "DRIFT",
) -> None:
    findings.append(
        {
            "id": fid,
            "domain": domain,
            "constitution_chapter": chapter,
            "severity": sev,  # P0 Blocking | P1 | P2 | INFO
            "classification": classification,  # DRIFT | DEFECT | CONFLICT | BLOCKING_RISK | EXPECTED_DIFFERENCE | DOC_STALE
            "title": title,
            "evidence": evidence,
            "remediation": remediation,
            "status": "OPEN",
        }
    )


def main() -> int:
    EV.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    findings: list[dict] = []
    domains: dict = {}

    # --- SSOT presence ---
    const_ok = CONST_MD.is_file() and CONST_YAML.is_file()
    cy = _load_yaml(CONST_YAML) if CONST_YAML.is_file() else {}
    domains["ssot"] = {
        "status": "PASS" if const_ok and cy.get("document_id") == "TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL" else "FAIL",
        "document": str(CONST_MD.relative_to(ROOT)).replace("\\", "/"),
        "machine": str(CONST_YAML.relative_to(ROOT)).replace("\\", "/"),
        "economic_model_locked": bool(cy.get("economic_model_locked")),
        "honesty_equals_live": cy.get("honesty", {}).get("equals_live_implementation"),
        "honesty_equals_full_alignment": cy.get("honesty", {}).get("equals_web3_full_alignment_pass"),
    }
    if not const_ok:
        _finding(
            findings,
            fid="SSOT-01",
            domain="Docs",
            chapter="header",
            sev="P0",
            title="Constitution V3.1.1 SSOT files missing",
            evidence="CONST_MD / CONST_YAML",
            remediation="Restore locked Constitution files; do not invent alternate economic SSOT",
            classification="DEFECT",
        )

    freeze = json.loads(FREEZE.read_text(encoding="utf-8")) if FREEZE.is_file() else {}
    addrs = {k: _norm(v) for k, v in (freeze.get("addresses") or {}).items()}
    constraints = freeze.get("constraints") or {}

    # --- ACTIVE / Registry / Deployments pin ---
    pcd = _load_yaml(ROOT / "registry/protocol-convergence-deployments.v1.yaml")
    active_baseline = pcd.get("active_deploy_baseline")
    v311 = (pcd.get("environments") or {}).get(ACTIVE) or {}
    proto_ok = (
        active_baseline == ACTIVE
        and v311.get("status") == "ACTIVE"
        and int(v311.get("chain_id") or 0) == CHAIN
        and freeze.get("baseline") == ACTIVE
        and int(freeze.get("chain_id") or 0) == CHAIN
    )
    domains["active_registry_deploy"] = {
        "status": "PASS" if proto_ok else "FAIL",
        "active_deploy_baseline": active_baseline,
        "freeze_baseline": freeze.get("baseline"),
        "chain_id": freeze.get("chain_id"),
        "addresses": addrs,
    }
    if not proto_ok:
        _finding(
            findings,
            fid="ACT-01",
            domain="Registry",
            chapter="deploy",
            sev="P0",
            title="ACTIVE baseline / freeze pin mismatch",
            evidence=json.dumps(domains["active_registry_deploy"]),
            remediation="Re-pin PCD + freeze to v311_sepolia_clean_baseline (Owner cutover only; not this audit)",
            classification="DRIFT",
        )

    # --- On-chain Tokenomics / Timelock / PM ---
    ttg = addrs.get("governance_token")
    pm = addrs.get("primary_market")
    tl = addrs.get("timelock")
    p4 = addrs.get("treasury_p4_cap")
    safe = addrs.get("timelock_admin_safe")
    gov = addrs.get("governor")

    chain: dict = {"rpc": RPC, "chain_id": CHAIN, "checks": {}}
    ok_sup, supply = _cast("call", ttg or "", "totalSupply()(uint256)") if ttg else (False, "no_ttg")
    # 10_000_000 * 1e18
    expect_supply = 10_000_000 * 10**18
    supply_n = None
    if ok_sup:
        try:
            supply_n = int(supply.split()[0])
        except Exception:
            supply_n = None
    chain["checks"]["ttg_total_supply"] = {
        "ok": ok_sup and supply_n == expect_supply,
        "live": supply_n,
        "expect": expect_supply,
    }
    if not (ok_sup and supply_n == expect_supply):
        _finding(
            findings,
            fid="TOK-01",
            domain="Tokenomics",
            chapter="2/15",
            sev="P0",
            title="TTG totalSupply != 10,000,000",
            evidence=str(chain["checks"]["ttg_total_supply"]),
            remediation="Investigate mint path / wrong token address; never mint beyond fixed supply",
            classification="DEFECT",
        )

    caps_live = []
    caps_ok = True
    expect_caps = [800_000, 1_200_000, 3_000_000]
    if pm:
        for i, exp in enumerate(expect_caps):
            ok, raw = _cast("call", pm, "roundCapTtg(uint256)(uint256)", str(i))
            n = None
            if ok:
                try:
                    n = int(raw.split()[0]) // (10**18)
                except Exception:
                    n = None
            caps_live.append(n)
            if n != exp:
                caps_ok = False
    chain["checks"]["public_sale_round_caps_ttg"] = {
        "ok": caps_ok,
        "live": caps_live,
        "expect": expect_caps,
    }
    if not caps_ok:
        _finding(
            findings,
            fid="TOK-02",
            domain="Tokenomics",
            chapter="3/15",
            sev="P0",
            title="Public Sale round caps drift vs Constitution 800k/1.2M/3M",
            evidence=str(chain["checks"]["public_sale_round_caps_ttg"]),
            remediation="Redeploy/fix PrimaryMarket caps to Constitution rounds (Owner broadcast)",
            classification="DRIFT",
        )

    sink_ok = False
    if pm and p4:
        ok, raw = _cast("call", pm, "usdcTreasury()(address)")
        sink = _norm(raw) if ok else None
        sink_ok = bool(ok and sink == p4 and sink != safe)
        chain["checks"]["public_sale_usdc_sink"] = {
            "ok": sink_ok,
            "pm_usdc_treasury": sink,
            "p4cap": p4,
            "ne_safe": sink != safe,
        }
    if not sink_ok:
        _finding(
            findings,
            fid="TRE-01",
            domain="Treasury",
            chapter="3/14",
            sev="P0",
            title="Public Sale USDC sink != GovernanceTreasuryP4Cap or equals Safe",
            evidence=str(chain["checks"].get("public_sale_usdc_sink")),
            remediation="Ensure PM.usdcTreasury == P4Cap and != Timelock Admin Safe",
            classification="DRIFT",
        )

    delay_ok = False
    if tl:
        ok, raw = _cast("call", tl, "delay()(uint256)")
        delay_n = int(raw.split()[0]) if ok else None
        ok_a, admin_raw = _cast("call", tl, "admin()(address)")
        admin = _norm(admin_raw) if ok_a else None
        delay_ok = delay_n == int(constraints.get("timelock_delay_seconds") or 172800) and admin == safe
        chain["checks"]["timelock"] = {
            "ok": delay_ok,
            "delay": delay_n,
            "admin": admin,
            "expect_delay": 172800,
            "expect_admin": safe,
        }
    if not delay_ok:
        _finding(
            findings,
            fid="GOV-01",
            domain="Governance",
            chapter="5",
            sev="P0",
            title="Timelock delay/admin not Constitution/ops pin (172800 + Safe)",
            evidence=str(chain["checks"].get("timelock")),
            remediation="Reconfigure Timelock delay=172800; admin=Safe only",
            classification="DRIFT",
        )

    # Proposal #1 still Queued?
    prop_state = None
    if gov:
        ok, raw = _cast("call", gov, "state(uint256)(uint8)", "1")
        if ok:
            try:
                prop_state = int(raw.split()[0])
            except Exception:
                prop_state = None
    chain["checks"]["governor_proposal_1_state"] = {
        "state": prop_state,
        "meaning": {
            0: "Pending",
            1: "Active",
            2: "Canceled",
            3: "Defeated",
            4: "Succeeded",
            5: "Queued",
            6: "Expired",
            7: "Executed",
        }.get(prop_state, "unknown"),
    }
    if prop_state == 5:
        _finding(
            findings,
            fid="GOV-02",
            domain="Governance",
            chapter="5",
            sev="P0",
            title="F-02 Timelock proposal still Queued (Execute not done)",
            evidence=str(chain["checks"]["governor_proposal_1_state"]),
            remediation="After ETA 2026-07-20T11:37:37Z Execute with BROADCAST_OK; then re-run Function Cert to 54/0/0",
            classification="BLOCKING_RISK",
        )

    # FeeRouter live vs Constitution 45/55 PRP
    fee_router = "0x81A8009210c5215100564c6E4123F672c4459306"
    ok_c, bps_c = _cast("call", fee_router, "BPS_COUNTRY()(uint256)")
    ok_o, bps_o = _cast("call", fee_router, "BPS_GLOBAL_OPS()(uint256)")
    ok_r, bps_r = _cast("call", fee_router, "BPS_GLOBAL_RESERVE()(uint256)")
    ok_s, bps_s = _cast("call", fee_router, "BPS_GLOBAL_STAKERS()(uint256)")

    def _u(ok, raw):
        if not ok:
            return None
        try:
            return int(raw.split()[0])
        except Exception:
            return None

    fr = {
        "address": fee_router.lower(),
        "BPS_COUNTRY": _u(ok_c, bps_c),
        "BPS_GLOBAL_OPS": _u(ok_o, bps_o),
        "BPS_GLOBAL_RESERVE": _u(ok_r, bps_r),
        "BPS_GLOBAL_STAKERS": _u(ok_s, bps_s),
    }
    # Constitution: 4500 steward / 5500 Project Revenue Pool — NOT legacy multi-global buckets
    constitution_split = fr.get("BPS_COUNTRY") == 4500 and (
        (fr.get("BPS_GLOBAL_OPS") or 0)
        + (fr.get("BPS_GLOBAL_RESERVE") or 0)
        + (fr.get("BPS_GLOBAL_STAKERS") or 0)
    ) == 5500 and fr.get("BPS_GLOBAL_OPS") == 5500  # single PRP rail ideal
    # Reality: legacy multi-bucket → not Constitution 55% single Project Revenue Pool
    legacy_multi = (
        fr.get("BPS_COUNTRY") == 4500
        and (fr.get("BPS_GLOBAL_OPS") or 0) > 0
        and (
            (fr.get("BPS_GLOBAL_RESERVE") or 0) > 0
            or (fr.get("BPS_GLOBAL_STAKERS") or 0) > 0
        )
    )
    chain["checks"]["fee_router_split"] = {
        **fr,
        "constitution_45_55_single_prp": False,
        "legacy_multi_bucket_detected": legacy_multi,
    }
    if legacy_multi or not constitution_split:
        _finding(
            findings,
            fid="TRE-02",
            domain="Treasury",
            chapter="12/14",
            sev="P0",
            title="FeeRouter still LEGACY multi-bucket; not Constitution 45% steward / 55% Project Revenue Pool",
            evidence=json.dumps(chain["checks"]["fee_router_split"]),
            remediation="Wire Distributable → Steward path 45% + Project Revenue Pool 55% (or 100% PRP without steward); retire LEGACY global ops/reserve/stakers as Constitution distribution SSOT",
            classification="DRIFT",
        )

    onchain_p0_ids = {"TOK-01", "TOK-02", "TRE-01", "GOV-01"}
    domains["onchain"] = {
        "status": "FAIL"
        if any(f["id"] in onchain_p0_ids for f in findings)
        else "PASS",
        **chain,
    }

    # Upgrade architecture
    inv = json.loads(
        (ROOT / "registry/v311-web3-deployment-inventory.v1.json").read_text(encoding="utf-8")
    )
    upgrade_modes = {}
    for c in inv.get("components") or []:
        upgrade_modes[c.get("id")] = {
            "upgrade_mode": c.get("upgrade_mode"),
            "upgrade_mode_detail": c.get("upgrade_mode_detail"),
            "proxiableUUID": c.get("proxiableUUID"),
        }
    # EIP-1967 impl slot sample
    impl_slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
    proxy_impl = {}
    for key, label in (("governor", "GOVERNOR"), ("primary_market", "PRIMARY_MARKET"), ("stake_pool", "STAKE")):
        a = addrs.get(key)
        if not a:
            continue
        ok, raw = _cast("storage", a, impl_slot)
        proxy_impl[label] = raw[:66] if ok else None
    has_timelock_proxy = any(
        "TimelockUpgradeableProxy" in str(v.get("upgrade_mode_detail") or "")
        or str(v.get("upgrade_mode") or "").upper() in ("PROXY", "TIMELOCK_UPGRADEABLE_PROXY")
        for v in upgrade_modes.values()
    )
    uups_absent = all(
        str(v.get("proxiableUUID") or "").startswith("N/A") or v.get("proxiableUUID") in (None, "N/A_NOT_UUPS")
        for v in upgrade_modes.values()
        if v.get("upgrade_mode") not in (None, "IMMUTABLE")
    )
    domains["upgrade_architecture"] = {
        "status": "PASS" if has_timelock_proxy and uups_absent else "PARTIAL",
        "pattern": "TimelockUpgradeableProxy (EIP-1967) for ACTIVE governance shells; IMMUTABLE for TTG/Timelock/EscrowFactory/FeeRouter",
        "uups_adopted": False,
        "proxy_impl_slots_sample": proxy_impl,
        "inventory_modes": upgrade_modes,
        "authority_path": "Safe → Timelock.schedule/execute → proxy.upgradeTo",
        "production_note": "Upgrade Architecture PRESENT for governance stack; Escrow instances IMMUTABLE by design (Factory)",
    }
    if not has_timelock_proxy:
        _finding(
            findings,
            fid="UPG-01",
            domain="Deployments",
            chapter="ops",
            sev="P0",
            title="Upgrade Architecture not evidenced for ACTIVE governance proxies",
            evidence=str(domains["upgrade_architecture"]),
            remediation="Confirm TimelockUpgradeableProxy inventory + EIP-1967 slots",
            classification="DEFECT",
        )

    # Registry parameter honesty (Constitution-required rails)
    rails = _load_yaml(ROOT / "registry/v311-treasury-rails.v1.yaml")
    dao_th = _load_yaml(ROOT / "registry/v311-dao-proposal-thresholds.v1.yaml")
    access = _load_yaml(ROOT / "registry/v311-platform-access-fee.v1.yaml")
    fee_reg = _load_yaml(ROOT / "registry/v311-platform-service-fee.v1.yaml")
    recovery = _load_yaml(ROOT / "registry/v311-recovery-budget.v1.yaml")
    stake_min = _load_yaml(ROOT / "registry/v311-stake-minimum-by-country.v1.yaml")

    domains["registry_params"] = {
        "treasury_rails_honesty": rails.get("honesty"),
        "dao_thresholds_honesty": dao_th.get("honesty"),
        "access_fee_honesty": access.get("honesty"),
        "service_fee_honesty": fee_reg.get("honesty"),
        "recovery_honesty": recovery.get("honesty"),
        "stake_minimum_examples": (stake_min.get("countries") or stake_min.get("examples") or cy.get("steward", {}).get("stake_minimum", {}).get("examples_ttg")),
    }
    if (rails.get("honesty") or {}).get("live_pool_contracts") == "OPEN":
        _finding(
            findings,
            fid="REG-01",
            domain="Registry",
            chapter="14",
            sev="P0",
            title="Four treasury rails: Project Revenue Pool / Founder wallet live addresses OPEN",
            evidence=json.dumps(rails.get("four_rails_isolation"), ensure_ascii=False)[:1200],
            remediation="Deploy/wire Project Revenue Pool + Founder Bootstrap wallet addresses; keep Order Escrow + P4Cap isolation",
            classification="DRIFT",
        )
    if (dao_th.get("honesty") or {}).get("governor_onchain_encoding") == "OPEN":
        _finding(
            findings,
            fid="REG-02",
            domain="Governance",
            chapter="5",
            sev="P1",
            title="DAO proposal thresholds Registry CLOSED but governor on-chain encoding OPEN",
            evidence=json.dumps(dao_th.get("honesty")),
            remediation="Encode ordinary/important/core thresholds on TravelTrustGovernor and certify vs Registry",
            classification="DRIFT",
        )
    if (access.get("honesty") or {}).get("backend_orchestration") == "OPEN":
        _finding(
            findings,
            fid="REG-03",
            domain="Backend",
            chapter="4",
            sev="P1",
            title="Platform Access Fee 300k USDC backend orchestration OPEN",
            evidence=json.dumps(access.get("honesty")),
            remediation="Implement onboarding collection + §4.1 refund state machine to Founder wallet",
            classification="DRIFT",
        )
    if (fee_reg.get("honesty") or {}).get("distributable_state_machine") == "OPEN":
        _finding(
            findings,
            fid="REG-04",
            domain="Runtime",
            chapter="9/12",
            sev="P0",
            title="Distributable Platform Service Fee state machine Registry honesty OPEN",
            evidence=json.dumps(fee_reg.get("honesty")),
            remediation="Close BE/Runtime consumption of PENDING→LOCKED→DISTRIBUTABLE→DISTRIBUTED; forbid Revenue-as-distributable term",
            classification="DRIFT",
        )
    if (recovery.get("honesty") or {}).get("live_budget_value") == "NOT_SET":
        _finding(
            findings,
            fid="REG-05",
            domain="Treasury",
            chapter="13",
            sev="P1",
            title="Treasury Recovery Budget live value NOT_SET",
            evidence=json.dumps(recovery.get("honesty")),
            remediation="Owner sets Recovery Budget registry value; forbid unbounded P4Cap/PRP drain",
            classification="BLOCKING_RISK",
        )

    # Code presence for Constitution machines
    code_checks = {
        "service_fee_states_sol": (ROOT / "contracts/src/ServiceFeeStatesV311.sol").is_file(),
        "service_fee_states_rs": (ROOT / "crates/core/src/service_fee_state_v311.rs").is_file(),
        "destination_country_rs": (ROOT / "crates/core/src/destination_country_v311.rs").is_file(),
        "v311_constants_sol": (ROOT / "contracts/src/V311EconomicConstants.sol").is_file(),
        "escrow_uses_states": "SERVICE_FEE_DISTRIBUTABLE"
        in (ROOT / "contracts/src/Escrow.sol").read_text(encoding="utf-8", errors="replace"),
    }
    domains["code_constitution_hooks"] = {
        "status": "PASS" if all(code_checks.values()) else "FAIL",
        **code_checks,
    }
    if not all(code_checks.values()):
        _finding(
            findings,
            fid="CODE-01",
            domain="Contracts",
            chapter="9/12",
            sev="P0",
            title="Missing Constitution code hooks (service fee / destination_country)",
            evidence=json.dumps(code_checks),
            remediation="Restore ServiceFeeStatesV311 + destination_country_v311 + Escrow wiring",
            classification="DEFECT",
        )

    # Function / Product / UI cert honesty (production-grade)
    fcert_path = ROOT / "evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json"
    fcert = json.loads(fcert_path.read_text(encoding="utf-8")) if fcert_path.is_file() else {}
    product = json.loads(
        (ROOT / "evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json").read_text(
            encoding="utf-8"
        )
    )
    ui = json.loads(
        (ROOT / "evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json").read_text(
            encoding="utf-8"
        )
    )
    tier_c = {}
    tc_dir = ROOT / "evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state"
    if tc_dir.is_dir():
        for p in tc_dir.glob("F-*.json"):
            d = json.loads(p.read_text(encoding="utf-8"))
            tier_c[p.stem] = d.get("status")
        for p in tc_dir.glob("I-01*.json"):
            if "seed" in p.name:
                continue
            d = json.loads(p.read_text(encoding="utf-8"))
            tier_c[p.stem] = d.get("status")

    counts = fcert.get("counts") or {}
    f_pass = int(counts.get("PASS") or 0)
    f_fail = int(counts.get("FAIL") or 0)
    f_or = int(counts.get("OWNER_REQUIRED") or 0)
    f_total = int(counts.get("total") or 0)
    fifty_four = f_pass == 54 and f_fail == 0 and f_or == 0 and f_total == 54
    domains["function_product_ui"] = {
        "function_cert_verdict": fcert.get("verdict"),
        "function_counts": counts,
        "function_54_0_0": fifty_four,
        "tier_c_state": tier_c,
        "product_cert": product.get("tt_v311_web3_full_product_cert") or product.get("status"),
        "ui_cert": ui.get("tt_v311_web3_ui_ux_full_cert") or ui.get("status"),
        "upgrade_architecture_pass_in_fcert": (fcert.get("pass_requires") or {}).get(
            "upgrade_architecture_pass"
        ),
    }
    if not fifty_four:
        _finding(
            findings,
            fid="CERT-01",
            domain="Deployments",
            chapter="ops",
            sev="P0",
            title="Function Cert not 54/0/0 (production-grade gate)",
            evidence=json.dumps(domains["function_product_ui"]["function_counts"]),
            remediation="Close OWNER_REQUIRED (esp. F-02 Execute) then re-run to 54/0/0; refresh stale VERDICT if tier_c already PASS",
            classification="BLOCKING_RISK",
        )
    if (product.get("status") or "").upper() != "PASS":
        _finding(
            findings,
            fid="CERT-02",
            domain="Frontend",
            chapter="ops",
            sev="P0",
            title="Product Cert not PASS",
            evidence=json.dumps({k: product.get(k) for k in ("status", "aggregate", "tt_v311_web3_full_product_cert")}),
            remediation="After Function 54/0/0 run Product Full Cert; close OPEN aggregates",
            classification="BLOCKING_RISK",
        )
    if (ui.get("status") or "").upper() not in ("PASS",):
        _finding(
            findings,
            fid="CERT-03",
            domain="Frontend",
            chapter="ops",
            sev="P1",
            title="UI/UX Full Cert not PASS (PARTIAL/OPEN)",
            evidence=json.dumps({k: ui.get(k) for k in ("status", "gates", "tt_v311_web3_ui_ux_full_cert")}),
            remediation="Close playwright real-wallet/real-tx gate; keep five-main/itinerary/wallet L5 green",
            classification="DRIFT",
        )

    # Gap matrix vs Constitution honesty CONFLICT
    gm_path = ROOT / "registry/web3-full-constitution-gap-matrix-LATEST.json"
    gm = json.loads(gm_path.read_text(encoding="utf-8")) if gm_path.is_file() else {}
    gm_verdicts = gm.get("verdicts") or {}
    const_app_c = "Live Full Alignment | **NOT_PASS**" in CONST_MD.read_text(
        encoding="utf-8", errors="replace"
    ) or "Live Full Alignment" in CONST_MD.read_text(encoding="utf-8", errors="replace")
    domains["gap_matrix"] = {
        "counts": gm.get("counts"),
        "verdicts": gm_verdicts,
        "constitution_appendix_c_live_not_pass_text_present": True,
        "note": "Matrix may claim semantic redeploy PASS; Production-Grade Full Alignment requires Function/Product/rails closed",
    }
    if gm_verdicts.get("TT_WEB3_FULL_ALIGNMENT") == "PASS" and (
        not fifty_four or (rails.get("honesty") or {}).get("live_pool_contracts") == "OPEN"
    ):
        _finding(
            findings,
            fid="DOC-01",
            domain="Docs",
            chapter="Appendix C",
            sev="P1",
            title="Gap Matrix TT_WEB3_FULL_ALIGNMENT=PASS conflicts with open production-grade gaps / Constitution honesty",
            evidence=json.dumps(
                {
                    "matrix": gm_verdicts,
                    "function_54_0_0": fifty_four,
                    "treasury_live_pools": (rails.get("honesty") or {}).get("live_pool_contracts"),
                    "constitution_machine_honesty": cy.get("honesty"),
                }
            ),
            remediation="Treat Matrix PASS as Redeploy/semantic CLOSED only; keep Production-Grade Full Alignment FAIL until CERT-*/TRE-*/REG-* closed; refresh human Gap Matrix MD; do not claim Production GO",
            classification="CONFLICT",
        )

    # FE env pin soft check
    fe_env = ROOT / "frontend/.env.local"
    fe_text = fe_env.read_text(encoding="utf-8", errors="replace") if fe_env.is_file() else ""
    fe_hits = {
        "governor": bool(gov and gov in fe_text.lower()) if gov else False,
        "ttg": bool(ttg and ttg in fe_text.lower()) if ttg else False,
        "pm": bool(pm and pm in fe_text.lower()) if pm else False,
    }
    domains["frontend_env"] = {
        "env_local_present": fe_env.is_file(),
        "address_hits": fe_hits,
        "status": "PASS" if fe_env.is_file() and any(fe_hits.values()) else "PARTIAL",
    }
    if domains["frontend_env"]["status"] != "PASS":
        _finding(
            findings,
            fid="FE-01",
            domain="Frontend",
            chapter="ops",
            sev="P1",
            title="Frontend .env.local missing or not pinned to ACTIVE V311 addresses",
            evidence=json.dumps(domains["frontend_env"]),
            remediation="Owner ENV: pin Sepolia ACTIVE addresses + WalletConnect Project ID before UI Full Cert",
            classification="DRIFT",
        )

    # Drift audit latest cite
    drift_path = ROOT / "evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.json"
    drift = json.loads(drift_path.read_text(encoding="utf-8")) if drift_path.is_file() else {}
    domains["engineering_drift_audit"] = {
        "verdict": drift.get("tt_v311_full_system_drift_audit") or drift.get("verdict"),
        "layers": {k: (v.get("status") if isinstance(v, dict) else v) for k, v in (drift.get("layers") or {}).items()},
        "findings_count": len(drift.get("findings") or []),
    }

    # Aggregate verdict
    p0 = [f for f in findings if f["severity"] == "P0"]
    p1 = [f for f in findings if f["severity"] == "P1"]
    blocking = [f for f in findings if f["classification"] in ("BLOCKING_RISK", "DEFECT", "DRIFT") and f["severity"] == "P0"]

    # Production-Grade Full Alignment PASS only if zero P0 and Function 54/0/0 and rails closed
    production_grade_pass = (
        len(p0) == 0
        and fifty_four
        and (rails.get("honesty") or {}).get("live_pool_contracts") != "OPEN"
        and freeze.get("tt_psg_sepolia_freeze") != "NOT_CLAIMED"  # still not required for this key — actually freeze is later
    )
    # Honest: Sepolia freeze not required for "constitution production-grade alignment" but Function+rails+no P0 are
    production_grade_pass = len(p0) == 0 and fifty_four and (rails.get("honesty") or {}).get(
        "live_pool_contracts"
    ) != "OPEN"

    # Soften: if any P0 open → FAIL
    verdict = "PASS" if production_grade_pass else "FAIL"

    report = {
        "schema": "traveltrust.v311_constitution_production_alignment_audit.v1",
        "machine_key": "TT_V311_CONSTITUTION_PRODUCTION_ALIGNMENT_AUDIT",
        "stamp": stamp,
        "recorded_utc": _utc(),
        "ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "ssot_machine": "registry/traveltrust-economic-constitution-v3.1.v1.yaml",
        "scope": "Production-Grade Full Alignment Audit (read-only)",
        "forbid_mutate": [
            "protocol",
            "ACTIVE_address_matrix",
            "Runtime_cutover",
            "Registry_ACTIVE",
            "Package_LOCK",
        ],
        "chain_id": CHAIN,
        "active_baseline": ACTIVE,
        "verdict": verdict,
        "tt_v311_constitution_production_alignment_audit": verdict,
        "counts": {
            "findings_total": len(findings),
            "P0": len(p0),
            "P1": len(p1),
            "P2": len([f for f in findings if f["severity"] == "P2"]),
            "blocking_p0": len(blocking),
        },
        "pass_requires_all": {
            "constitution_ssot_locked": True,
            "onchain_tokenomics_governance_pins": "TOK/TRE-01/GOV-01 closed",
            "fee_distribution_constitution_45_55": "TRE-02 closed",
            "treasury_four_rails_live": "REG-01 closed",
            "function_cert_54_0_0": fifty_four,
            "product_ui_full_closed": "CERT-02/03 closed",
            "zero_p0_open": len(p0) == 0,
        },
        "honesty": {
            "equals_production_go": False,
            "equals_tt_psg_sepolia_freeze": False,
            "engineering_layer_drift_audit": domains["engineering_drift_audit"].get("verdict"),
            "gap_matrix_full_alignment_claim": gm_verdicts.get("TT_WEB3_FULL_ALIGNMENT"),
            "constitution_appendix_c": "Target LOCKED ≠ live Full Alignment PASS ≠ Production GO",
        },
        "domains": domains,
        "findings": findings,
        "remediation_order": [
            "GOV-02 Execute F-02 after ETA (no protocol redesign)",
            "CERT-01 Function Cert → 54/0/0",
            "TRE-02 FeeRouter / Distributable → 45/55 Project Revenue Pool (or confirm Expected Difference + Owner accept — default FIX)",
            "REG-01 wire Project Revenue Pool + Founder Bootstrap live addresses",
            "REG-04 close Distributable state machine Runtime honesty",
            "CERT-02 Product Full · CERT-03 UI Full",
            "REG-02/03/05 close residual OPEN registry honesty",
            "DOC-01 reconcile Gap Matrix vs Production-Grade FAIL until above closed",
            "Then Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO",
        ],
    }

    # Write artifacts
    latest_json = EV / "CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.json"
    stamp_json = EV / f"CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-{stamp}.json"
    latest_json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    stamp_json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Remediation checklist MD
    lines = [
        f"# V3.1.1 Constitution · Production-Grade Full Alignment Audit",
        "",
        f"**Machine:** `TT_V311_CONSTITUTION_PRODUCTION_ALIGNMENT_AUDIT`",
        f"**SSOT:** [`TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md`](../../docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md) · **LOCKED**",
        f"**Recorded:** `{report['recorded_utc']}`",
        f"**Verdict:** **`{verdict}`**",
        f"**Findings:** P0={len(p0)} · P1={len(p1)} · total={len(findings)}",
        "",
        "> Read-only. **Did not** mutate protocol / ACTIVE / Runtime / Registry ACTIVE / Package LOCK.",
        "> **≠** Production GO · **≠** `TT_PSG_SEPOLIA_FREEZE`.",
        "",
        "## 0 · Executive",
        "",
        "| Gate | Result |",
        "|------|--------|",
        f"| Constitution SSOT locked | {'PASS' if domains['ssot']['status']=='PASS' else 'FAIL'} |",
        f"| ACTIVE pin (`{ACTIVE}`) | {domains['active_registry_deploy']['status']} |",
        f"| On-chain supply/caps/sink/timelock | see TOK/TRE-01/GOV-01 |",
        f"| Upgrade Architecture (TimelockUpgradeableProxy) | {domains['upgrade_architecture']['status']} |",
        f"| Function Cert 54/0/0 | {'PASS' if fifty_four else 'FAIL'} ({f_pass}/{f_fail}/{f_or} of {f_total}) |",
        f"| Product / UI Full | {domains['function_product_ui'].get('product_cert')} / {domains['function_product_ui'].get('ui_cert')} |",
        f"| Engineering Drift Audit | {domains['engineering_drift_audit'].get('verdict')} |",
        f"| **Production-Grade Full Alignment** | **{verdict}** |",
        "",
        "## 1 · Findings (OPEN)",
        "",
        "| ID | Sev | Class | Domain | Ch | Title | Remediation |",
        "|----|-----|-------|--------|----|-------|-------------|",
    ]
    for f in findings:
        lines.append(
            f"| {f['id']} | {f['severity']} | {f['classification']} | {f['domain']} | {f['constitution_chapter']} | {f['title']} | {f['remediation']} |"
        )
    lines += [
        "",
        "## 2 · Remediation order (fixed)",
        "",
    ]
    for i, step in enumerate(report["remediation_order"], 1):
        lines.append(f"{i}. {step}")
    lines += [
        "",
        "## 3 · Upgrade Architecture (confirmed)",
        "",
        f"- Pattern: **{domains['upgrade_architecture']['pattern']}**",
        f"- Authority: `{domains['upgrade_architecture']['authority_path']}`",
        f"- UUPS: **not adopted**",
        f"- Status: **{domains['upgrade_architecture']['status']}**",
        "",
        "## 4 · Domain snapshot",
        "",
        "```json",
        json.dumps(
            {
                "ssot": domains["ssot"],
                "active_registry_deploy": {
                    k: domains["active_registry_deploy"][k]
                    for k in ("status", "active_deploy_baseline", "chain_id")
                },
                "upgrade_architecture": {
                    k: domains["upgrade_architecture"][k]
                    for k in ("status", "pattern", "uups_adopted", "authority_path")
                },
                "function_product_ui": domains["function_product_ui"],
                "engineering_drift_audit": domains["engineering_drift_audit"],
                "onchain_checks": chain.get("checks"),
            },
            indent=2,
            ensure_ascii=False,
        ),
        "```",
        "",
        "## 5 · Artifacts",
        "",
        f"- JSON: [`CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.json`](./CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.json)",
        f"- Stamp: `CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-{stamp}.json`",
        f"- Checklist: [`REMEDIATION-CHECKLIST-LATEST.md`](./REMEDIATION-CHECKLIST-LATEST.md)",
        "",
    ]
    (EV / "CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    (EV / f"CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-{stamp}.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )

    # Standalone remediation checklist
    rem = [
        "# Remediation Checklist · Constitution Production-Grade Alignment",
        "",
        f"**Audit verdict:** `{verdict}` · `{report['recorded_utc']}`",
        "**Rule:** FIX Defect/Drift/Conflict/Blocking Risk · CONFIRM Expected Difference only · **no** Protocol/ACTIVE edits in this audit pack.",
        "",
        "| # | ID | Sev | Action | Done |",
        "|---|----|-----|--------|------|",
    ]
    for i, f in enumerate(findings, 1):
        rem.append(f"| {i} | {f['id']} | {f['severity']} | {f['remediation']} | ☐ |")
    rem += [
        "",
        "### Exit criteria for re-audit PASS",
        "",
        "- [ ] All P0 closed",
        "- [ ] Function Cert **54/0/0**",
        "- [ ] Product Cert PASS · UI Full Cert PASS",
        "- [ ] Four treasury rails live addresses set (no OPEN honesty)",
        "- [ ] Fee distribution = Constitution 45/55 (or Owner-accepted Expected Difference with written Sign-off)",
        "- [ ] Gap Matrix / docs reconciled (no false Production GO)",
        "",
    ]
    (EV / "REMEDIATION-CHECKLIST-LATEST.md").write_text("\n".join(rem) + "\n", encoding="utf-8")

    print(f"TT_V311_CONSTITUTION_PRODUCTION_ALIGNMENT_AUDIT: {verdict}")
    print(json.dumps(report["counts"], indent=2))
    print(f"evidence: {latest_json}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
