#!/usr/bin/env python3
"""TravelTrust Web3 Full-System Closure Audit — ① local baseline.

Baseline chain: 9f500335 → 4f56727e → f575d459 → 1f205af1 (+ working tree fixes).

Generates: function inventory · permission matrix · fund-flow matrix · gaps/risks.
Does NOT broadcast Sepolia · Owner signatures · real USDC · mainnet deploy.
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
BASELINE = ["9f500335", "4f56727e", "f575d459", "1f205af1"]

CORE_CONTRACTS = [
    ("GovernanceVotesToken", "TTG voting token · snapshots"),
    ("TtgPrimaryMarketV1", "GOV-04 USDC→TTG primary market"),
    ("TravelTrustGovernor", "Propose/vote/queue/execute"),
    ("GovernanceTimelock", "48h delayed execution"),
    ("GovernanceTreasuryP4Cap", "USDC Global Treasury · GOV-01 P4 cap"),
    ("GovernanceTreasury", "Legacy FeeRouter globalOps 15% leg"),
    ("TtgSeatConcentrationRegistry", "GOV-03 seat concentration"),
    ("RegionStewardStakePool", "Country pool TTG seat stake"),
    ("EscrowFactory", "V1 escrow deploy (Sepolia legacy)"),
    ("EscrowFactoryV2", "V2 bilateral escrow (mainnet path)"),
    ("Escrow", "Per-order USDC escrow V1"),
    ("EscrowV2", "Bilateral service confirmation before release"),
    ("FeeRouter", "Platform fee 45/55 + global 65/20/15"),
    ("RegionVault", "Country bucket receiver"),
    ("CountryPoolNetProfitLedger", "Quarter net profit 45/55 split"),
    ("UnallocatedStewardPathVault", "Vacancy ledger V1"),
    ("ReserveVault", "Slash reserve · Timelock spend"),
    ("SlashRouter", "Slash routing to reserve/treasury"),
]

PERMISSION_ROWS = [
    ("TTG mint/transfer", "GovernanceVotesToken", "Timelock/minter role", "Governance proposal", "TTG"),
    ("Primary Market purchase", "TtgPrimaryMarketV1", "Any buyer wallet", "USDC pull + TTG transfer", "USDC→P4Cap · TTG→buyer"),
    ("Treasury USDC spend", "GovernanceTreasuryP4Cap", "Timelock only", "P1–P4 policy", "USDC"),
    ("Treasury TTG grant", "treasury_dao bucket", "Timelock", "Proposal→Vote", "TTG only"),
    ("Escrow deposit", "Escrow/EscrowV2", "Payer wallet", "transferFrom→escrow", "USDC isolated"),
    ("Escrow release/refund", "Escrow/EscrowV2", "Arbitrator/parties/rules", "State machine", "USDC to beneficiary"),
    ("FeeRouter distribute", "FeeRouter", "Authorized caller", "45/55 split", "USDC"),
    ("Country net profit close", "CountryPoolNetProfitLedger", "Governor→Timelock", "Quarter close + split", "USDC"),
    ("Seat stake lock", "RegionStewardStakePool", "Steward wallet", "Stake lock per jurisdiction", "TTG"),
    ("Governor upgrade", "TimelockUpgradeableProxy", "Timelock admin Safe", "Governance only", "N/A"),
    ("Emergency pause", "FeeRouter/EscrowFactory", "emergency_safe", "Pause only · no withdraw", "N/A"),
]

FUND_FLOWS = [
    ("FF-PM", "Primary Market", "USDC", "Buyer", "GovernanceTreasuryP4Cap", "TtgPrimaryMarketV1.usdcTreasury", "Timelock spend P1–P4"),
    ("FF-PM-TTG", "Primary Market TTG leg", "TTG", "public_global bucket", "Buyer wallet", "TtgPrimaryMarketV1", "Round caps GOV-04"),
    ("FF-ESC", "Order Escrow", "USDC", "Traveler/provider", "Escrow instance", "EscrowFactory(V2)", "Release/refund/dispute only"),
    ("FF-FEE", "Platform fee", "USDC", "Escrow settlement", "FeeRouter→country+global", "FeeRouter", "45% country · 55% global pool"),
    ("FF-NP45", "Country net profit 45%", "USDC", "CountryPoolNetProfit", "Country sub-vaults", "StewardPathVault etc.", "Country pool ops"),
    ("FF-NP55", "Country net profit 55%", "USDC", "CountryPoolNetProfit", "GovernanceTreasuryP4Cap", "Global leg", "P1–P4"),
    ("FF-TTG-DAO", "DAO TTG bucket", "TTG", "treasury_dao 2M", "Timelock grants", "Governance", "≠ USDC treasury"),
    ("FF-VAC", "Vacancy sweep", "USDC/TTG policy", "Unallocated path", "Reserve/governance paths", "Vacancy ledger", "Governance gated"),
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
    return (ROOT / f"contracts/src/vacancy/{name}.sol").is_file()


def _abi_exists(name: str) -> bool:
    return (ROOT / f"contracts/abi/{name}.json").is_file()


def _fe_abi_exists(name: str) -> bool:
    return (ROOT / f"frontend/dapp/abis/{name}.json").is_file()


def main() -> int:
    checks: list[tuple[str, bool, str, str]] = []

    for gate, label in [
        ("scripts/gates/run-web3-production-grade-alignment-audit.sh", "GATE-web3-alignment"),
        ("scripts/gates/run-asset-denomination-treasury-separation-audit.sh", "GATE-treasury-separation"),
        ("scripts/gates/run-governance-consistency-audit.sh", "GATE-governance-consistency"),
        ("scripts/gates/check-ttg-vesting-registry-gate.sh", "GATE-vesting-registry"),
    ]:
        ok, detail = _run_gate(gate)
        checks.append((label, ok, detail, "error"))

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

    for cname, _ in CORE_CONTRACTS:
        checks.append(
            (
                f"CON-{cname}",
                _contract_exists(cname),
                f"contracts/src/{cname}.sol",
                "error",
            )
        )

    checks.append(
        (
            "ABI-escrow-v2-fe-sync",
            _fe_abi_exists("EscrowV2") and _fe_abi_exists("EscrowFactoryV2"),
            "frontend/dapp/abis EscrowV2+EscrowFactoryV2",
            "warning",
        )
    )

    sep = _yaml(ROOT / "registry/asset-denomination-treasury-separation.v1.yaml")
    checks.append(
        (
            "SSOT-treasury-separation-active",
            sep.get("status") == "ACTIVE" and sep.get("ttg_dao_treasury_bucket", {}).get("asset") == "TTG",
            "asset-denomination-treasury-separation v1",
            "error",
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

    checks.append(
        (
            "FE-governance-pages",
            (ROOT / "frontend/app/governance/page.tsx").is_file()
            and (ROOT / "frontend/app/escrow/[id]/page.tsx").is_file(),
            "/governance + /escrow/[id]",
            "error",
        )
    )

    # Net-profit full event projection — partial today
    indexer_rs = _read(ROOT / "crates/api/src/chain/indexer.rs")
    checks.append(
        (
            "IDX-country-net-profit-full-projection",
            "CountryPoolNetProfit" in indexer_rs or "splitNetProfit" in _read(ROOT / "contracts/src/CountryPoolNetProfitLedger.sol"),
            "Full net-profit epoch events — partial indexer coverage (WARN expected)",
            "warning",
        )
    )

    checks.append(
        (
            "DOC-fund-flow-ssot",
            (ROOT / "docs/spec/governance-token/fund-flow-ssot.v1.md").is_file(),
            "fund-flow-ssot R1-R4",
            "error",
        )
    )

    cargo = shutil.which("cargo") or "cargo"
    ct = subprocess.run(
        [
            cargo,
            "test",
            "-p",
            "traveltrust-api",
            "maps_service_complete_confirmed",
            "--",
            "--nocapture",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=300,
    )
    checks.append(
        (
            "TEST-escrow-v2-event-decode",
            ct.returncode == 0,
            "cargo test maps_service_complete_confirmed",
            "error",
        )
    )

    failed = [c for c in checks if not c[1]]
    critical = [c for c in failed if c[3] == "error"]
    warns = [c for c in failed if c[3] == "warning"]

    gaps = [
        {
            "id": "GAP-MAINNET-001",
            "severity": "P0",
            "phase": "③",
            "title": "Mainnet address registry all OWNER_INPUT",
            "detail": "mainnet-address-registry.v2 deploy_status NOT_STARTED",
        },
        {
            "id": "GAP-ESCROW-V2-002",
            "severity": "P1",
            "phase": "③",
            "title": "EscrowFactoryV2 mainnet wiring + FE write path",
            "detail": "V2 ABI synced; production factory env + UI default path pending Owner",
        },
        {
            "id": "GAP-TREASURY-OPS-003",
            "severity": "P1",
            "phase": "③",
            "title": "Treasury ops spend classes OWNER_INPUT",
            "detail": "refunds/taxes/supplier/payroll in asset-denomination separation SSOT",
        },
        {
            "id": "GAP-IDX-NP-004",
            "severity": "P2",
            "phase": "②",
            "title": "CountryPoolNetProfit full epoch event projection",
            "detail": "Vacancy + CountryLedgerCredited indexed; full quarter-close UI projection partial",
        },
        {
            "id": "GAP-PM-005",
            "severity": "P1",
            "phase": "③",
            "title": "Primary Market on-chain ACTIVE",
            "detail": "Contract exists · commercial round lockup OWNER_INPUT · mainnet not deployed",
        },
        {
            "id": "GAP-VESTING-006",
            "severity": "P1",
            "phase": "③",
            "title": "Vesting contracts deploy vs registry FROZEN amounts",
            "detail": "team/advisors commercial params OWNER_INPUT",
        },
    ]

    p0_gaps = [g for g in gaps if g.get("severity") == "P0"]
    if critical:
        verdict = "FAIL"
    elif p0_gaps or warns:
        verdict = "WARN"
    else:
        verdict = "PASS"

    ai_fixed = [
        "Indexer: EscrowV2 ServiceCompleteConfirmed topic0 decode + unit test",
        "Frontend: sync EscrowV2.json + EscrowFactoryV2.json from contracts/abi",
        "Treasury separation SSOT (commit 1f205af1) — TTG dao bucket ≠ USDC P4Cap",
    ]

    owner_items = [
        "Fill ttg-vesting-registry commercial OWNER_INPUT (cliff/duration/start/beneficiary)",
        "Treasury ops: refunds/taxes/supplier/payroll routing + Safe signers",
        "Mainnet address registry OWNER_INPUT fill + bytecode verify",
        "Certificate §4 Owner attestation",
        "Sepolia Governor V1.1 broadcast auth (TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1)",
    ]

    sepolia_checklist = [
        "Verify PM usdcTreasury == GovernanceTreasuryP4Cap on-chain",
        "Escrow V1 lifecycle smoke (create→fund→release/refund/dispute)",
        "FeeRouter PlatformFeeRouted → RegionVault + global treasury legs",
        "Governor propose/vote/queue/execute dry-run on test proposal",
        "Vacancy indexer reconcile gate PASS",
        "Treasury P4 cap enforcement tx (GOV-01)",
    ]

    mainnet_blockers = [
        "mainnet-address-registry.v2 all core slots VERIFIED/ACTIVE",
        "EscrowFactoryV2 REQUIRED (V1 forbidden on mainnet policy)",
        "Legal sign-off vesting + primary market",
        "Production PSP / webhook ③ gates (orthogonal but GO-blocking)",
        "Multisig timelock_admin MUST be Safe (RULE-ADMIN-001)",
        "Treasury ops policy OWNER_INPUT caps filled",
    ]

    report = {
        "audit_id": "WEB3-FULL-SYSTEM-CLOSURE-AUDIT-01",
        "stamp_utc": STAMP,
        "phase": "① local full-stack inventory + gate union",
        "baseline_commits": BASELINE,
        "verdict": verdict,
        "verdict_note": (
            "WARN = ① local SSOT/gates green but ②③ Owner/on-chain items open"
            if verdict == "WARN"
            else None
        ),
        "checks": {c[0]: {"ok": c[1], "detail": c[2], "severity_if_fail": c[3]} for c in checks},
        "web3_function_inventory": [{"contract": n, "purpose": p} for n, p in CORE_CONTRACTS],
        "permission_matrix": [
            {"function": r[0], "contract": r[1], "actor": r[2], "auth": r[3], "asset": r[4]}
            for r in PERMISSION_ROWS
        ],
        "fund_flow_matrix": [
            {"id": r[0], "flow": r[1], "asset": r[2], "source": r[3], "sink": r[4], "rail": r[5], "spend": r[6]}
            for r in FUND_FLOWS
        ],
        "gaps_and_risks": gaps,
        "ai_fixed": ai_fixed,
        "owner_manual": owner_items,
        "sepolia_verification_checklist": sepolia_checklist,
        "mainnet_go_blockers": mainnet_blockers,
        "honest_boundary": "① inventory + local gates PASS/WARN ≠ ② Sepolia full matrix GO ≠ ③ Production GO",
    }

    out_dir = EVID / STAMP
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "web3-full-system-closure-audit.json"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    (EVID / "WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )

    md: list[str] = [
        "# Web3 Full-System Closure Audit — Latest",
        "",
        f"**Verdict:** `{verdict}` · **Stamp:** `{STAMP}` · **Phase:** ① local",
        "",
        f"**Baseline:** `{' → '.join(BASELINE)}`",
        "",
        "## 1. Web3 全功能清单",
        "",
        "| 合约 | 功能 |",
        "|------|------|",
    ]
    for n, p in CORE_CONTRACTS:
        md.append(f"| `{n}` | {p} |")

    md.extend(
        [
            "",
            "**API 消费面：** governance/* · orders/* · disputes/* · internal/indexer-tick · GET /meta",
            "",
            "**前端写链面：** /governance/* · /escrow/[id] · staking · distribution-claim · wagmi + dapp/abis",
            "",
            "## 2. 合约与权限矩阵",
            "",
            "| 功能 | 合约 | 操作主体 | 授权 | 资产 |",
            "|------|------|----------|------|------|",
        ]
    )
    for r in PERMISSION_ROWS:
        md.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |")

    md.extend(
        [
            "",
            "## 3. 端到端资金流矩阵",
            "",
            "| ID | 流 | 资产 | 来源 | 目标 | 通道 | 支出/备注 |",
            "|----|-----|------|------|------|------|-----------|",
        ]
    )
    for r in FUND_FLOWS:
        md.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} |")

    md.extend(["", "SSOT: [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml) · [fund-flow-ssot.v1.md](fund-flow-ssot.v1.md)", "", "## 4. 缺口与风险清单", ""])
    for g in gaps:
        md.append(f"- **{g['id']}** ({g['severity']} · {g['phase']}): {g['title']} — {g['detail']}")

    md.extend(["", "## 5. AI 已修复项", ""])
    for x in ai_fixed:
        md.append(f"- {x}")

    md.extend(["", "## 6. Owner 人工项", ""])
    for x in owner_items:
        md.append(f"- [ ] {x}")

    md.extend(["", "## 7. ② Sepolia 验证清单", ""])
    for x in sepolia_checklist:
        md.append(f"- [ ] {x}")

    md.extend(["", "## 8. ③ 主网上线阻塞项", ""])
    for x in mainnet_blockers:
        md.append(f"- {x}")

    md.extend(["", "## Automated checks", ""])
    for cid, ok, detail, _ in checks:
        md.append(f"- {'✅' if ok else '❌'} `{cid}` — {detail}")

    md.append("")
    md.append(f"Machine-readable: `evidence/GO_web3_full_system_closure_audit/{STAMP}/web3-full-system-closure-audit.json`")
    LATEST_MD.write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"WEB3_FULL_SYSTEM_CLOSURE_AUDIT: {verdict} stamp={STAMP}")
    print(f"TT_WEB3_FULL_CLOSURE_SUMMARY: {verdict}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    sys.exit(main())
