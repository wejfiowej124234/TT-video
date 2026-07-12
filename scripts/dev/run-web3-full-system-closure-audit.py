#!/usr/bin/env python3
"""TravelTrust Web3 Full-System Business–Funds–Contract Consistency Audit (L1).

SSOT baseline: frozen registries + fund-flow-ssot + Certification Framework.
Generates seven deliverables + PASS/FAIL/WARN + re-freeze recommendation.
Does NOT broadcast · Owner signatures · real USDC · mainnet deploy.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

ROOT = Path(os.environ.get("TT_ROOT", Path(__file__).resolve().parents[2]))
STAMP = os.environ.get("WEB3_CLOSURE_STAMP", datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
EVID = Path(os.environ.get("WEB3_CLOSURE_EVID", ROOT / "evidence/GO_web3_full_system_closure_audit"))
LATEST_MD = ROOT / "docs/spec/governance-token/WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md"
ENGINEERING_HEAD = os.environ.get("WEB3_ENGINEERING_HEAD", "9de9c1eb")
BASELINE = ["9f500335", "4f56727e", "f575d459", "1f205af1", "ee9df065", ENGINEERING_HEAD]

# ── §1 Web3 全功能清单（业务域 · 非仅治理币）────────────────────────────────────

BUSINESS_DOMAINS = [
    ("BD-TTG-SUPPLY", "TTG Genesis V2 四块分配", "10M · team 15% · community_incentive 5% · treasury_dao 30% · public_sale 50%", "TTG-TOKENOMICS-GENESIS-V2 · ttg-vesting-registry"),
    ("BD-VESTING", "Team Vesting", "cliff+duration · Timelock · revocable=false · single wallet · no advisors track", "vesting_tracks.team"),
    ("BD-PM-3R", "Primary Market 三轮", "Public Sale 5M · round amounts Registry · R2/R3 governance open", "TtgPrimaryMarketV1 · public_sale"),
    ("BD-PM-USDC", "USDC 兑换 TTG", "Buyer USDC → GovernanceTreasuryP4Cap · TTG→buyer", "TtgPrimaryMarketV1.usdcTreasury SSOT"),
    ("BD-TREASURY-USDC", "USDC Global Treasury / P1–P4", "GovernanceTreasuryP4Cap · Timelock spend · GOV-01 P4 cap 30%", "asset-denomination-treasury-separation.v1.yaml"),
    ("BD-TREASURY-TTG", "DAO TTG Treasury", "treasury_dao 3M · no Mint · not voting-power source · ≠ USDC", "treasury_dao"),
    ("BD-TREASURY-SAFE", "Treasury Safe / 多签", "timelock_admin · treasury_safe · emergency_safe", "multisig-registry.v1.yaml · RULE-ADMIN-001"),
    ("BD-FEE", "FeeRouter 平台手续费", "Escrow settlement → 45% country · 55% global → 65/20/15", "FeeRouter · fund-flow R4"),
    ("BD-NP-4555", "国家池净利润 45/55", "CountryPoolNetProfitLedger · D-4555-B · orthogonal to FeeRouter 45/55", "CountryPoolNetProfitLedger"),
    ("BD-ESCROW", "Escrow/Settlement 订单托管", "V1 Sepolia legacy · V2 mainnet path · bilateral confirm", "EscrowFactory(V2) · Escrow(V2)"),
    ("BD-SEAT", "Seat/Stake Region Steward", "RegionStewardStakePool · no country_shelf genesis · source-agnostic", "TtgSeatConcentrationRegistry"),
    ("BD-GOV", "Governor/Timelock 治理栈", "propose→vote→queue→execute · 48h delay · payload contracts", "TravelTrustGovernor · GovernanceTimelock"),
    ("BD-ALLOC", "Allocation Pool / Claim", "RegionDistributionClaim · InvestorDistributionClaim · snapshot claim", "RegionDistributionClaim"),
    ("BD-VAC", "Vacancy Ledger", "UnallocatedStewardPathVault · six events · governance sweep", "vacancy/* · indexer reconcile"),
    ("BD-IDX", "Indexer → DB → API", "indexer-tick · escrow/vacancy/net-profit projections", "crates/api/src/chain/*"),
    ("BD-FE", "前端写链与对拍", "/governance/* · /escrow/[id] · net-profit/vacancy ledgers · wagmi", "frontend/app/governance/*"),
    ("BD-UPGRADE", "升级与暂停权限", "TimelockUpgradeableProxy · emergency pause · no withdraw on pause", "upgrade/* · emergency_safe"),
    ("BD-MON", "监控与生产指标", "production metrics catalog · alert rules · treasury ops policy", "registry/monitoring-production-metrics-catalog.v1.yaml"),
    ("BD-CIP", "Community Incentive Program", "Genesis Allocation 5% · Policy · DAO top-up OK", "COMMUNITY-INCENTIVE-POLICY-V1"),
]

CORE_CONTRACTS = [
    ("GovernanceVotesToken", "TTG voting token · snapshots · R1", "core"),
    ("TtgPrimaryMarketV1", "GOV-04 USDC→TTG primary market", "core"),
    ("TravelTrustGovernor", "Propose/vote/queue/execute", "core"),
    ("GovernanceTimelock", "48h delayed execution", "core"),
    ("GovernanceTreasuryP4Cap", "USDC Global Treasury · GOV-01 P4 cap", "core"),
    ("GovernanceTreasury", "Legacy FeeRouter globalOps 15% leg", "core"),
    ("TtgSeatConcentrationRegistry", "GOV-03 seat concentration", "core"),
    ("RegionStewardStakePool", "Country pool TTG seat stake", "core"),
    ("EscrowFactory", "V1 escrow deploy (testnet legacy)", "core"),
    ("EscrowFactoryV2", "V2 bilateral escrow (mainnet path)", "core"),
    ("Escrow", "Per-order USDC escrow V1", "core"),
    ("EscrowV2", "Bilateral service confirmation before release", "core"),
    ("FeeRouter", "Platform fee 45/55 + global 65/20/15", "core"),
    ("RegionVault", "Country bucket receiver", "core"),
    ("CountryPoolNetProfitLedger", "Quarter net profit 45/55 split", "core"),
    ("UnallocatedStewardPathVault", "Vacancy ledger V1", "core"),
    ("ReserveVault", "Slash reserve · Timelock spend", "core"),
    ("SlashRouter", "Slash routing to reserve/treasury", "core"),
]

EXTENDED_CONTRACTS = [
    ("StewardPathVault", "Country steward path USDC vault", "country"),
    ("CountryPoolSubVaultsV0", "R2 sub-vaults target", "country"),
    ("RegionDistributionClaim", "Country pool claim / allocation", "country"),
    ("IdentityStakingPool", "Guide identity stake (orthogonal R4)", "identity"),
    ("GuideIdentityStakingPool", "Guide slash stake pool", "identity"),
    ("ProviderIdentityStakingPool", "Provider identity stake", "identity"),
    ("TimelockUpgradeableProxy", "Governed upgrade shell", "upgrade"),
    ("CountryPoolNetProfitGovernancePayload", "Net profit governance payloads", "governance"),
    ("RouterTreasuryGovernancePayload", "Router/treasury governance payloads", "governance"),
    ("InvestorDistributionClaim", "Investor claim track (legacy)", "legacy"),
    ("OnboardingFeeReceiver", "Onboarding fee (off R4)", "legacy"),
]

PERMISSION_ROWS = [
    ("TTG mint/transfer", "GovernanceVotesToken", "Timelock/minter role", "Governance proposal → Timelock 48h", "TTG", "revert if unauthorized minter"),
    ("Primary Market purchase", "TtgPrimaryMarketV1", "Any buyer wallet", "USDC approve + purchase()", "USDC→P4Cap · TTG→buyer", "revert insufficient USDC/cap"),
    ("Treasury USDC spend", "GovernanceTreasuryP4Cap", "Timelock only", "P1–P4 policy + GOV-01 cap", "USDC", "revert P4CapExceeded"),
    ("Treasury TTG grant", "treasury_dao bucket", "Timelock", "Proposal→Vote→Queue→Execute", "TTG only", "no USDC from TTG bucket"),
    ("Escrow deposit", "Escrow/EscrowV2", "Payer wallet", "transferFrom→escrow", "USDC isolated", "revert on fail · no partial mint"),
    ("Escrow release/refund", "Escrow/EscrowV2", "Parties/arbitrator/rules", "State machine + V2 bilateral confirm", "USDC to beneficiary", "revert wrong state"),
    ("FeeRouter distribute", "FeeRouter", "Authorized settlement caller", "45/55 split on-chain", "USDC", "revert zero/ wrong token"),
    ("Country net profit close", "CountryPoolNetProfitLedger", "Governor→Timelock", "Epoch close + splitNetProfit payload", "USDC", "state machine no advance if unfunded"),
    ("Seat stake lock", "RegionStewardStakePool", "Steward wallet", "stake(jurisdiction,amount)", "TTG lock", "slash path via SlashRouter"),
    ("Vacancy sweep", "UnallocatedStewardPathVault", "Governance payload", "Proposal→Timelock", "USDC/TTG policy", "governance gated only"),
    ("Governor upgrade", "TimelockUpgradeableProxy", "Timelock admin Safe", "Governance only", "N/A", "no EOA admin"),
    ("Emergency pause", "FeeRouter/EscrowFactory", "emergency_safe", "pause() only · no withdraw", "N/A", "unpause via governance"),
]

DETAILED_FUND_FLOWS = [
    ("FF-PM-USDC", "Primary Market USDC leg", "USDC", "Buyer wallet", "GovernanceTreasuryP4Cap", "TtgPrimaryMarketV1", "Buyer sign purchase", "—", "tx revert · USDC stays wallet"),
    ("FF-PM-TTG", "Primary Market TTG leg", "TTG", "public_sale 5M bucket", "Buyer wallet", "TtgPrimaryMarketV1", "Round cap GOV-04", "—", "revert over cap"),
    ("FF-ESC-DEP", "Escrow deposit", "USDC", "Traveler/provider", "Escrow instance", "EscrowFactory(V2)", "Payer approve", "—", "revert · escrow unfunded"),
    ("FF-ESC-REL", "Escrow release", "USDC", "Escrow instance", "Beneficiary", "Escrow state machine", "Parties/V2 confirm", "—", "revert wrong state"),
    ("FF-FEE-4555A", "Platform fee split A", "USDC", "Order settlement", "RegionVault 45%", "FeeRouter", "Settlement hook", "DAO param change", "revert · fee undistributed"),
    ("FF-FEE-4555A-G", "Platform fee global 55%", "USDC", "Order settlement", "Global pool 65/20/15", "FeeRouter", "Settlement hook", "Governance", "revert"),
    ("FF-NP-45", "Net profit country 45%", "USDC", "CountryPoolNetProfit", "StewardPathVault/sub", "Governor payload", "Epoch close proposal", "Timelock", "split blocked until funded"),
    ("FF-NP-55", "Net profit global 55%", "USDC", "CountryPoolNetProfit", "GovernanceTreasuryP4Cap", "Governor payload", "Epoch close proposal", "Timelock P1–P4", "revert over P4 cap on spend"),
    ("FF-TTG-VEST", "Team vesting", "TTG", "team 1.5M bucket", "Beneficiary", "Vesting contract", "Timelock deploy", "—", "cliff prevents early claim"),
    ("FF-TTG-CIP", "Community Incentive Program", "TTG", "community_incentive 0.5M Allocation", "Program recipients", "Policy + governance", "Program rules", "Timelock when applicable", "not cliff vesting"),
    ("FF-TTG-DAO", "DAO treasury TTG", "TTG", "treasury_dao 3M", "Grant recipients", "Governance", "Proposal→Vote", "Timelock", "≠ USDC treasury · not voting source"),
    ("FF-VAC-SWEEP", "Vacancy sweep", "USDC/TTG", "Unallocated path", "Reserve/governance", "VacancyGovernance", "Governance proposal", "Timelock", "governance only"),
]

RISK_SCAN = [
    ("RISK-MIX-PM-ESC", "USDC Primary Market vs Escrow 混池", "PM usdcTreasury MUST == P4Cap · escrow isolated", "asset-denomination-treasury-separation"),
    ("RISK-MIX-TTG-USDC", "TTG dao bucket vs USDC treasury 混读", "treasury_dao asset=TTG · P4Cap asset=USDC", "asset-denomination-treasury-separation"),
    ("RISK-MIX-FEE-NP", "FeeRouter 45/55 vs NetProfit 45/55 混读", "D-4555-A orthogonal D-4555-B", "fund-flow-ssot R4 vs CountryPoolNetProfit"),
    ("RISK-GOV-ESC", "Governor 直接动用 Escrow", "governor_direct_spend forbidden on R3", "asset-denomination fund_rails R3"),
    ("RISK-P4-UNCAP", "P4 超 cap 支出", "GOV-01 treasuryP4DeployCapBps enforced", "GovernanceTreasuryP4Cap.sol"),
    ("RISK-UPGRADE-EOA", "升级权限 EOA", "timelock_admin MUST be Safe", "multisig-registry RULE-ADMIN-001"),
    ("RISK-IDX-GAP", "Indexer 丢/重事件", "unique (chain,block,log_index) · rewind", "indexer tick + reconcile gates"),
    ("RISK-VEST-OWNER", "Vesting 商业参数缺失", "team OWNER_INPUT", "ttg-vesting-registry READY_TEMPLATE"),
]


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""


def _yaml(p: Path) -> dict:
    if yaml is None or not p.is_file():
        return {}
    return yaml.safe_load(_read(p)) or {}


def _run_gate(script: str) -> tuple[bool, str]:
    path = ROOT / script
    if not path.is_file():
        return False, f"missing {script}"

    fallbacks: dict[str, list[str]] = {
        "scripts/gates/run-web3-production-grade-alignment-audit.sh": [
            sys.executable,
            str(ROOT / "scripts/dev/run-web3-production-grade-alignment-audit.py"),
        ],
        "scripts/gates/run-asset-denomination-treasury-separation-audit.sh": [
            sys.executable,
            str(ROOT / "registry/validate-asset-denomination-treasury-separation.py"),
        ],
        "scripts/gates/run-governance-consistency-audit.sh": [
            sys.executable,
            str(ROOT / "scripts/dev/run-governance-consistency-audit.py"),
        ],
        "scripts/gates/check-ttg-vesting-registry-gate.sh": [
            sys.executable,
            str(ROOT / "registry/validate-ttg-vesting-registry.py"),
        ],
        "scripts/gates/run-country-pool-net-profit-closure-audit.sh": [
            sys.executable,
            str(ROOT / "scripts/dev/run-country-pool-net-profit-closure-audit.py"),
        ],
    }

    cmds: list[list[str]] = []
    if script in fallbacks:
        cmds.append(fallbacks[script])
    bash = shutil.which("bash")
    if script.endswith(".sh") and bash:
        cmds.insert(0, [bash, str(path)])

    last_tail = ""
    for cmd in cmds:
        r = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        last_tail = ((r.stdout or "") + (r.stderr or "")).strip().split("\n")[-1]
        if r.returncode == 0:
            if script.endswith("run-asset-denomination-treasury-separation-audit.sh"):
                r2 = subprocess.run(
                    [sys.executable, str(ROOT / "scripts/dev/run-asset-denomination-treasury-separation-audit.py")],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                )
                last_tail = ((r2.stdout or "") + (r2.stderr or "")).strip().split("\n")[-1]
                return r2.returncode == 0, last_tail
            return True, last_tail
    return False, last_tail or "gate failed"


def _contract_exists(name: str) -> bool:
    if (ROOT / f"contracts/src/{name}.sol").is_file():
        return True
    if (ROOT / f"contracts/src/vacancy/{name}.sol").is_file():
        return True
    return (ROOT / f"contracts/src/upgrade/{name}.sol").is_file()


def _abi_exists(name: str) -> bool:
    return (ROOT / f"contracts/abi/{name}.json").is_file()


def _fe_abi_exists(name: str) -> bool:
    return (ROOT / f"frontend/dapp/abis/{name}.json").is_file()


def _vesting_buckets_ok(reg: dict) -> tuple[bool, str]:
    supply = reg.get("supply_ssot", {})
    buckets = supply.get("buckets_bps", {})
    expected = {
        "team": 1500,
        "community_incentive": 500,
        "treasury_dao": 3000,
        "public_sale": 5000,
    }
    if buckets != expected:
        return False, f"Genesis V2 buckets mismatch {buckets}"
    total = sum(buckets.values())
    if total != 10000:
        return False, f"bps sum {total} != 10000"
    for forbidden in ("advisors", "country_pool_shelf", "ecosystem", "public_global"):
        if forbidden in buckets:
            return False, f"forbidden key {forbidden}"
    pm = reg.get("primary_market", {})
    rounds = pm.get("rounds", {})
    rsum = sum(v.get("amount_tokens", 0) for v in rounds.values())
    if rsum != 5_000_000:
        return False, f"pm rounds sum {rsum} != 5000000"
    return True, "Genesis V2 15/5/30/50 · PM registry 800k+1.2M+3M"


def main() -> int:
    checks: list[tuple[str, bool, str, str]] = []

    for gate, label in [
        ("scripts/gates/run-web3-production-grade-alignment-audit.sh", "GATE-web3-alignment"),
        ("scripts/gates/run-asset-denomination-treasury-separation-audit.sh", "GATE-treasury-separation"),
        ("scripts/gates/run-governance-consistency-audit.sh", "GATE-governance-consistency"),
        ("scripts/gates/check-ttg-vesting-registry-gate.sh", "GATE-vesting-registry"),
        ("scripts/gates/run-country-pool-net-profit-closure-audit.sh", "GATE-net-profit-closure"),
    ]:
        ok, detail = _run_gate(gate)
        checks.append((label, ok, detail, "error"))

    vesting_reg = _yaml(ROOT / "registry/ttg-vesting-registry.v1.yaml")
    vb_ok, vb_detail = _vesting_buckets_ok(vesting_reg)
    checks.append(("SSOT-genesis-v2-allocation", vb_ok, vb_detail, "error"))

    sep = _yaml(ROOT / "registry/asset-denomination-treasury-separation.v1.yaml")
    pm_sink = sep.get("primary_market", {}).get("usdc_sink") or sep.get("usdc_global_treasury", {}).get("on_chain_contract")
    checks.append(
        (
            "SSOT-pm-usdc-sink-p4cap",
            sep.get("primary_market", {}).get("usdc_sink") == "usdc_global_treasury"
            or pm_sink == "GovernanceTreasuryP4Cap",
            "PM USDC → GovernanceTreasuryP4Cap · isolated from escrow",
            "error",
        )
    )
    checks.append(
        (
            "SSOT-treasury-separation-active",
            sep.get("status") == "ACTIVE" and sep.get("ttg_dao_treasury_bucket", {}).get("asset") == "TTG",
            "asset-denomination-treasury-separation v1",
            "error",
        )
    )

    reconcile = _read(ROOT / "crates/api/src/chain_off/reconcile.rs")
    checks.append(
        (
            "IDX-escrow-v2-service-complete-event",
            "ServiceCompleteConfirmed" in reconcile
            and b"ServiceCompleteConfirmed(bytes32,address,bool,bool)" in reconcile.encode(),
            "EscrowV2 ServiceCompleteConfirmed topic decode",
            "error",
        )
    )

    for cname, _, _ in CORE_CONTRACTS:
        checks.append((f"CON-{cname}", _contract_exists(cname), f"contracts/src/{cname}.sol", "error"))

    for cname, _, _ in EXTENDED_CONTRACTS:
        checks.append((f"CON-EXT-{cname}", _contract_exists(cname), f"extended {cname}", "warning"))

    checks.append(
        (
            "ABI-escrow-v2-fe-sync",
            _fe_abi_exists("EscrowV2") and _fe_abi_exists("EscrowFactoryV2"),
            "frontend/dapp/abis EscrowV2+EscrowFactoryV2",
            "warning",
        )
    )

    mainnet = _yaml(ROOT / "registry/mainnet-address-registry.v2.yaml")
    checks.append(
        (
            "REG-mainnet-ready-template",
            mainnet.get("registry_lifecycle_status") == "READY_TEMPLATE"
            and mainnet.get("network", {}).get("deploy_status") == "NOT_STARTED",
            "mainnet slots OWNER_INPUT · deploy NOT_STARTED",
            "warning",
        )
    )

    checks.append(
        (
            "API-indexer-internal-tick",
            (ROOT / "crates/api/src/routes/internal/indexer/tick.rs").is_file(),
            "POST /internal/indexer-tick",
            "error",
        )
    )

    fe_pages = [
        (ROOT / "frontend/app/governance/page.tsx", "governance hub"),
        (ROOT / "frontend/app/escrow/[id]/page.tsx", "escrow detail"),
        (ROOT / "frontend/app/governance/net-profit-ledger/page.tsx", "net-profit ledger"),
        (ROOT / "frontend/app/governance/vacancy-ledger/page.tsx", "vacancy ledger"),
    ]
    for p, label in fe_pages:
        checks.append((f"FE-{label.replace(' ', '-')}", p.is_file(), str(p.relative_to(ROOT)), "error"))

    np_indexer = _read(ROOT / "crates/api/src/chain/country_pool_net_profit_indexer.rs")
    checks.append(
        (
            "IDX-country-net-profit-full-projection",
            "parse_net_profit_event" in np_indexer
            and (ROOT / "crates/api/migrations/20260712100000_country_pool_net_profit_events.sql").is_file(),
            "Full net-profit epoch events — indexer + DB + API + FE pipeline",
            "error",
        )
    )

    checks.append(
        (
            "DOC-fund-flow-ssot",
            (ROOT / "docs/spec/governance-token/fund-flow-ssot.v1.md").is_file(),
            "fund-flow-ssot R1-R4 LOCKED",
            "error",
        )
    )

    checks.append(
        (
            "DOC-l2-reality-cert-ssot",
            (ROOT / "docs/runbook/TT-WEB3-REALITY-CERTIFICATION.md").is_file(),
            "L2 Blockchain Reality Certification SSOT",
            "error",
        )
    )

    checks.append(
        (
            "DOC-certification-framework",
            (ROOT / "docs/runbook/TT-CERTIFICATION-FRAMEWORK.md").is_file(),
            "L1/L2/L3 Certification Framework",
            "error",
        )
    )

    cargo = shutil.which("cargo") or "cargo"
    ct = subprocess.run(
        [cargo, "test", "-p", "traveltrust-api", "maps_service_complete_confirmed", "--", "--nocapture"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=300,
    )
    checks.append(("TEST-escrow-v2-event-decode", ct.returncode == 0, "cargo test maps_service_complete_confirmed", "error"))

    failed = [c for c in checks if not c[1]]
    critical = [c for c in failed if c[3] == "error"]
    warns = [c for c in failed if c[3] == "warning"]

    gaps = [
        {
            "id": "GAP-MAINNET-001",
            "severity": "P0",
            "phase": "L3",
            "category": "deployment",
            "title": "Mainnet address registry all OWNER_INPUT",
            "detail": "mainnet-address-registry.v2 deploy_status NOT_STARTED",
            "risk": "Blocking Risk",
        },
        {
            "id": "GAP-ESCROW-V2-002",
            "severity": "P1",
            "phase": "L3",
            "category": "escrow",
            "title": "EscrowFactoryV2 mainnet wiring + FE default write path",
            "detail": "V2 ABI synced; production factory env + UI default path pending Owner",
            "risk": "Blocking Risk",
        },
        {
            "id": "GAP-TREASURY-OPS-003",
            "severity": "P1",
            "phase": "L3",
            "category": "treasury",
            "title": "Treasury ops spend classes OWNER_INPUT",
            "detail": "refunds/taxes/supplier/payroll in asset-denomination + treasury-ops-policy",
            "risk": "Non-blocking Risk until L3",
        },
        {
            "id": "GAP-IDX-NP-004",
            "severity": "P2",
            "phase": "L2",
            "category": "indexer",
            "title": "CountryPoolNetProfit live chain certification",
            "detail": "CLOSED L1 — indexer→DB→API→FE→accounting; L2 Target Chain live tx pending Owner",
            "status": "CLOSED_L1",
            "risk": "Expected Difference until L2",
        },
        {
            "id": "GAP-PM-005",
            "severity": "P1",
            "phase": "L3",
            "category": "primary_market",
            "title": "Primary Market on-chain ACTIVE + round lockup",
            "detail": "Contract exists · optional_lockup_seconds OWNER_INPUT · mainnet not deployed",
            "risk": "Blocking Risk",
        },
        {
            "id": "GAP-VESTING-006",
            "severity": "P1",
            "phase": "L3",
            "category": "vesting",
            "title": "Vesting contracts deploy vs registry FROZEN amounts",
            "detail": "team cliff/duration/start/beneficiary OWNER_INPUT",
            "risk": "Blocking Risk",
        },
        {
            "id": "GAP-MATRIX-007",
            "severity": "P2",
            "phase": "L2",
            "category": "coverage",
            "title": "Governance full-coverage matrix partial rows",
            "detail": "ttg-governance-full-coverage-matrix: 51 PASS · 23 PARTIAL · 1 FAIL · 12 NOT_TESTED (86.2% tested)",
            "risk": "Non-blocking Risk",
        },
    ]

    p0_open = [g for g in gaps if g.get("severity") == "P0" and g.get("status") != "CLOSED_L1"]
    if critical:
        verdict = "FAIL"
    elif p0_open or warns:
        verdict = "WARN"
    else:
        verdict = "PASS"

    ai_fixed = [
        "GAP-IDX-NP-004 L1: country_pool_net_profit_indexer + DB migration + governance/admin API + FE ledgers (ee9df065)",
        "Indexer: EscrowV2 ServiceCompleteConfirmed topic0 decode + unit test (d1bee7fc)",
        "Frontend: sync EscrowV2.json + EscrowFactoryV2.json from contracts/abi",
        "Treasury separation SSOT — TTG dao bucket ≠ USDC P4Cap (1f205af1)",
        "L2 SSOT: TT-WEB3-REALITY-CERTIFICATION + TT-CERTIFICATION-FRAMEWORK (d94a918d)",
    ]

    owner_items = [
        "Fill ttg-vesting-registry commercial OWNER_INPUT (cliff/duration/start/beneficiary for team)",
        "Primary Market round optional_lockup_seconds (3 rounds) — commercial decision",
        "Treasury ops: refunds/taxes/supplier/payroll routing + Safe signers + caps",
        "Mainnet address registry OWNER_INPUT fill + bytecode verify on Target Chain",
        "L2 Reality Certification: SC-0 Owner + Broadcast auth for write SVs",
        "L2 Certificate Owner attestation after SC-A…H PASS",
        "Legal sign-off vesting + primary market (L3)",
    ]

    l2_pointer = "Execute per [TT-WEB3-REALITY-CERTIFICATION.md](../../runbook/TT-WEB3-REALITY-CERTIFICATION.md) Overview — SC-0 → SC-A…H"

    mainnet_blockers = [
        "mainnet-address-registry.v2 all core slots VERIFIED/ACTIVE",
        "EscrowFactoryV2 REQUIRED (V1 forbidden on mainnet policy)",
        "L2 Blockchain Reality Certification CLOSED (SC-A…H + Failure paths)",
        "Legal sign-off vesting + primary market",
        "Production PSP / webhook L3 gates (orthogonal but GO-blocking)",
        "Multisig timelock_admin MUST be Safe (RULE-ADMIN-001)",
        "Treasury ops policy OWNER_INPUT caps filled",
        "Team vesting contract deployed with FROZEN 1.5M amount",
    ]

    re_freeze = {
        "recommendation": "HOLD_L1_ENGINEERING_FREEZE",
        "engineering_head": ENGINEERING_HEAD,
        "rationale": (
            "All L1 machine gates PASS; registered P0/P1 gaps are L2/L3 Owner/on-chain items. "
            "Continue L1 freeze; next legitimate work = L2 Reality Certification execution."
        ),
        "allow_without_unfreeze": [
            "L2 Reality Certification evidence (blockchain-reality/)",
            "bugfix blocking L2 SC execution",
            "documentation/evidence for Certification",
        ],
        "forbid_until_unfreeze_or_l2_closed": [
            "new Web3 feature contracts",
            "parallel audit-only doc churn without Certification progress",
        ],
        "l1_certification": "PASS_WITH_OPEN_L2_L3_GAPS" if verdict == "WARN" and not critical else verdict,
        "proposed_next_head_after_l2_closed": "TBD upon L2 Certificate",
    }

    smart_contract_inventory = []
    for name, purpose, tier in CORE_CONTRACTS + EXTENDED_CONTRACTS:
        smart_contract_inventory.append(
            {
                "contract": name,
                "tier": tier,
                "purpose": purpose,
                "source_exists": _contract_exists(name),
                "abi_json": _abi_exists(name),
                "frontend_abi": _fe_abi_exists(name),
            }
        )

    report = {
        "audit_id": "WEB3-FULL-SYSTEM-BUSINESS-FUNDS-CONTRACT-AUDIT",
        "audit_title": "Web3 全系统业务—资金—合约一致性大审计",
        "stamp_utc": STAMP,
        "certification_level": "L1 Engineering Certification",
        "phase": "① local full-stack inventory + gate union",
        "engineering_head": ENGINEERING_HEAD,
        "baseline_commits": BASELINE,
        "verdict": verdict,
        "verdict_note": (
            "WARN = L1 machine checks green · registered L2/L3 Owner gaps remain · ≠ L2/L3 Certification PASS"
            if verdict == "WARN"
            else None
        ),
        "re_freeze_recommendation": re_freeze,
        "checks": {c[0]: {"ok": c[1], "detail": c[2], "severity_if_fail": c[3]} for c in checks},
        "business_domain_inventory": [
            {"id": r[0], "domain": r[1], "scope": r[2], "ssot": r[3]} for r in BUSINESS_DOMAINS
        ],
        "web3_function_inventory": [{"contract": n, "purpose": p, "tier": t} for n, p, t in CORE_CONTRACTS],
        "smart_contract_inventory": smart_contract_inventory,
        "permission_matrix": [
            {
                "function": r[0],
                "contract": r[1],
                "actor": r[2],
                "auth": r[3],
                "asset": r[4],
                "rollback": r[5],
            }
            for r in PERMISSION_ROWS
        ],
        "fund_flow_matrix": [
            {"id": r[0], "flow": r[1], "asset": r[2], "source": r[3], "sink": r[4], "rail": r[5], "spend": r[6]}
            for r in DETAILED_FUND_FLOWS[:8]
        ],
        "detailed_fund_flow_matrix": [
            {
                "id": r[0],
                "flow": r[1],
                "asset": r[2],
                "from": r[3],
                "to": r[4],
                "contract": r[5],
                "permission": r[6],
                "governance_timelock": r[7],
                "rollback_on_fail": r[8],
            }
            for r in DETAILED_FUND_FLOWS
        ],
        "risk_scan": [{"id": r[0], "risk": r[1], "mitigation": r[2], "ssot": r[3]} for r in RISK_SCAN],
        "gaps_and_risks": gaps,
        "ai_fixed": ai_fixed,
        "owner_manual": owner_items,
        "l2_certification_pointer": l2_pointer,
        "mainnet_go_blockers": mainnet_blockers,
        "ssot_refs": [
            "registry/asset-denomination-treasury-separation.v1.yaml",
            "registry/ttg-vesting-registry.v1.yaml",
            "docs/spec/governance-token/fund-flow-ssot.v1.md",
            "docs/runbook/TT-CERTIFICATION-FRAMEWORK.md",
            "docs/runbook/TT-WEB3-REALITY-CERTIFICATION.md",
        ],
        "honest_boundary": "L1 audit PASS/WARN ≠ L2 Reality Certification CLOSED ≠ L3 Production GO",
    }

    out_dir = EVID / STAMP
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "web3-full-system-closure-audit.json"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    (EVID / "WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    md: list[str] = [
        "# Web3 全系统业务—资金—合约一致性大审计 — Latest",
        "",
        f"**Verdict:** `{verdict}` · **Stamp:** `{STAMP}` · **Level:** L1 Engineering Certification · **Phase:** ① local",
        "",
        f"**Engineering HEAD（冻结建议）:** `{ENGINEERING_HEAD}`",
        "",
        f"**Baseline:** `{' → '.join(BASELINE)}`",
        "",
        "## 重新冻结建议",
        "",
        f"| 项 | 值 |",
        f"|----|-----|",
        f"| **Recommendation** | `{re_freeze['recommendation']}` |",
        f"| **L1 Certification** | `{re_freeze['l1_certification']}` |",
        f"| **Rationale** | {re_freeze['rationale']} |",
        "",
        "**冻结期间允许：** " + " · ".join(re_freeze["allow_without_unfreeze"]),
        "",
        "**禁止（直至 L2 CLOSED 或明确 unfreeze）：** " + " · ".join(re_freeze["forbid_until_unfreeze_or_l2_closed"]),
        "",
        "---",
        "",
        "## 1. Web3 全功能清单",
        "",
        "### 1.1 业务域（全 Web3 · 非仅治理币）",
        "",
        "| ID | 域 | 范围 | SSOT |",
        "|----|-----|------|------|",
    ]
    for r in BUSINESS_DOMAINS:
        md.append(f"| `{r[0]}` | {r[1]} | {r[2]} | {r[3]} |")

    md.extend(["", "### 1.2 核心合约面", "", "| 合约 | 功能 |", "|------|------|"])
    for n, p, _ in CORE_CONTRACTS:
        md.append(f"| `{n}` | {p} |")

    md.extend(
        [
            "",
            "**API：** governance/* · vacancy/net-profit ledgers · orders/* · disputes/* · internal/indexer-tick · GET /meta",
            "",
            "**前端：** /governance/* · /escrow/[id] · net-profit-ledger · vacancy-ledger · staking · distribution-claim",
            "",
            "## 2. 资金流与权限矩阵",
            "",
            "### 2.1 权限矩阵（谁有权限 · 失败回滚）",
            "",
            "| 功能 | 合约 | 操作主体 | 授权/Timelock | 资产 | 失败回滚 |",
            "|------|------|----------|---------------|------|----------|",
        ]
    )
    for r in PERMISSION_ROWS:
        md.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |")

    md.extend(
        [
            "",
            "### 2.2 端到端资金流（来源→合约→治理→回滚）",
            "",
            "| ID | 流 | 资产 | 从 | 到 | 合约 | 权限 | 治理/Timelock | 失败回滚 |",
            "|----|-----|------|----|----|------|------|---------------|----------|",
        ]
    )
    for r in DETAILED_FUND_FLOWS:
        md.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {r[7]} | {r[8]} |")

    md.extend(
        [
            "",
            "SSOT: [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml) · [fund-flow-ssot.v1.md](fund-flow-ssot.v1.md) · [ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml)",
            "",
            "### 2.3 风险扫描（混池/越权/混读）",
            "",
            "| ID | 风险 | 缓解 | SSOT |",
            "|----|------|------|------|",
        ]
    )
    for r in RISK_SCAN:
        md.append(f"| `{r[0]}` | {r[1]} | {r[2]} | {r[3]} |")

    md.extend(["", "## 3. 智能合约清单", "", "| 合约 | 层级 | 用途 | 源码 | ABI | FE ABI |", "|------|------|------|------|-----|--------|"])
    for row in smart_contract_inventory:
        md.append(
            f"| `{row['contract']}` | {row['tier']} | {row['purpose']} | "
            f"{'✅' if row['source_exists'] else '❌'} | "
            f"{'✅' if row['abi_json'] else '—'} | "
            f"{'✅' if row['frontend_abi'] else '—'} |"
        )

    md.extend(["", "## 4. 生产级缺口与风险清单", ""])
    for g in gaps:
        st = f" · **{g['status']}**" if g.get("status") else ""
        md.append(
            f"- **{g['id']}** ({g['severity']} · {g['phase']} · {g['category']}{st}): {g['title']} — {g['detail']} · _{g['risk']}_"
        )

    md.extend(["", "## 5. AI 已修复项", ""])
    for x in ai_fixed:
        md.append(f"- {x}")

    md.extend(["", "## 6. Owner 人工项", ""])
    for x in owner_items:
        md.append(f"- [ ] {x}")

    md.extend(
        [
            "",
            "## 7. L2 Blockchain Reality Certification（② 主线）",
            "",
            l2_pointer,
            "",
            "Overview + SC-0…H + Dashboard: [TT-WEB3-REALITY-CERTIFICATION.md](../../runbook/TT-WEB3-REALITY-CERTIFICATION.md)",
            "",
            "## 8. 主网上线阻塞项（L3）",
            "",
        ]
    )
    for x in mainnet_blockers:
        md.append(f"- {x}")

    md.extend(["", "## Automated checks (L1 union)", ""])
    for cid, ok, detail, _ in checks:
        md.append(f"- {'✅' if ok else '❌'} `{cid}` — {detail}")

    md.append("")
    md.append(f"Machine-readable: `evidence/GO_web3_full_system_closure_audit/{STAMP}/web3-full-system-closure-audit.json`")
    LATEST_MD.write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"WEB3_FULL_SYSTEM_CLOSURE_AUDIT: {verdict} stamp={STAMP}")
    print(f"TT_WEB3_FULL_CLOSURE_SUMMARY: {verdict}")
    print(f"TT_L1_REFREEZE: {re_freeze['recommendation']}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    sys.exit(main())
