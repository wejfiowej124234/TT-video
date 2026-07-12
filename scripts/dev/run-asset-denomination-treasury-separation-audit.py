#!/usr/bin/env python3
"""Web3 Asset-Denomination & Treasury Separation Audit — ① local.

Separates TTG DAO Treasury bucket (2M TTG) from USDC Global Treasury (P1→P4).
Does NOT simulate Owner wallets, broadcast, or commercial budget execution.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

ROOT = Path(os.environ.get("TT_ROOT", Path(__file__).resolve().parents[2]))
EVID = Path(
    os.environ.get(
        "ASSET_TREASURY_EVID",
        ROOT / "evidence/GO_asset_denomination_treasury_separation_audit",
    )
)
STAMP = os.environ.get(
    "ASSET_TREASURY_STAMP",
    datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
)
LATEST_MD = ROOT / "docs/spec/governance-token/ASSET-DENOMINATION-TREASURY-SEPARATION-AUDIT-LATEST.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _run_validator() -> tuple[bool, str]:
    cmd = [sys.executable, str(ROOT / "registry/validate-asset-denomination-treasury-separation.py")]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
    detail = (proc.stdout or proc.stderr or "").strip().split("\n")[-1]
    return proc.returncode == 0, detail


def _yaml(path: Path) -> dict:
    if yaml is None or not path.is_file():
        return {}
    return yaml.safe_load(_read(path)) or {}


def _fund_flow_inventory() -> list[dict]:
    sep = _yaml(ROOT / "registry/asset-denomination-treasury-separation.v1.yaml")
    inv: list[dict] = []

    ttg = sep.get("ttg_dao_treasury_bucket") or {}
    inv.append(
        {
            "id": "FF-01",
            "name": "TTG DAO Treasury bucket (supply allocation)",
            "asset": "TTG",
            "amount": "2,000,000 TTG (treasury_dao 20%)",
            "source": "Genesis mint / allocation bucket",
            "destination": "GovernanceTimelock · treasury Safe (custody)",
            "authorization": "GOV-02 Proposal → Vote → Timelock 48h",
            "spend_path": "TTG transfer only (grants · incentives · ecosystem TTG)",
            "forbidden": "USDC spend · P4 deploy · PM USDC ingress",
            "vote_policy": "G-VOTE-03",
            "refund_accounting": "N/A (TTG grants — no order escrow)",
        }
    )

    usdc = sep.get("usdc_global_treasury") or {}
    for ingress in usdc.get("ingress_sources") or []:
        inv.append(
            {
                "id": f"FF-USDC-IN-{ingress.get('id', '?')}",
                "name": f"USDC Global Treasury ingress: {ingress.get('id')}",
                "asset": "USDC",
                "source": ingress.get("from", ""),
                "destination": "GovernanceTreasuryP4Cap (usdcTreasury slot)",
                "isolated_from": ingress.get("isolated_from") or ingress.get("note", ""),
                "authorization": "Contract routing · spend via Timelock",
                "spend_path": "P1→P4 per country-revenue-model §2.1",
            }
        )

    stages = (usdc.get("spend_policy") or {}).get("stages") or {}
    for stage_id, stage in stages.items():
        inv.append(
            {
                "id": f"FF-USDC-SPEND-{stage_id}",
                "name": f"USDC Global Treasury spend stage {stage_id}",
                "asset": "USDC",
                "label": stage.get("label"),
                "authorization": stage.get("authorization"),
                "governance_proposal_required": stage.get("governance_proposal_required"),
                "timelock_required": stage.get("timelock_required"),
                "gov_rule": stage.get("goV_rule"),
            }
        )

    for rid, rail in (sep.get("fund_rails") or {}).items():
        inv.append(
            {
                "id": f"FF-RAIL-{rid}",
                "name": rail.get("ref") or rid,
                "asset": rail.get("asset"),
                "contracts": rail.get("contracts") or rail.get("contract"),
                "isolated_from": rail.get("isolated_from"),
                "authorization": rail.get("authorization") or rail.get("custody"),
            }
        )

    pm = sep.get("primary_market") or {}
    inv.append(
        {
            "id": "FF-PM",
            "name": "Primary Market purchase",
            "asset": "TTG + USDC",
            "ttg_leg": f"public_global bucket → buyer ({pm.get('rounds_frozen')})",
            "usdc_leg": f"TtgPrimaryMarketV1.{pm.get('usdc_field')} → GovernanceTreasuryP4Cap",
            "isolated_from": "Escrow order USDC",
        }
    )

    owner = usdc.get("spend_classes_owner_input") or {}
    for cls, val in owner.items():
        inv.append(
            {
                "id": f"FF-OWNER-{cls}",
                "name": f"Spend class: {cls}",
                "asset": "USDC",
                "policy": val,
                "note": "Owner-defined ops policy — not simulated in ① audit",
            }
        )

    return inv


def main() -> int:
    checks: list[tuple[str, bool, str, str]] = []  # id, ok, detail, severity_if_fail

    val_ok, val_detail = _run_validator()
    checks.append(("SEP-validator", val_ok, val_detail, "error"))

    vest = _yaml(ROOT / "registry/ttg-vesting-registry.v1.yaml")
    td = (vest.get("allocation_bucket_paths") or {}).get("treasury_dao") or {}
    td_policy = {k: v for k, v in td.items() if k not in ("forbidden", "refs", "usdc_cash_policy_ref")}
    td_yaml = yaml.dump(td_policy) if yaml else str(td_policy)
    checks.append(
        (
            "SEP-treasury-dao-ttg-only",
            td.get("asset") == "TTG"
            and "usdc_spend" in (td.get("forbidden") or [])
            and "p4_deploy_cap" in (td.get("forbidden") or [])
            and "GOV-01" not in td_yaml
            and "P1→P4" not in td_yaml,
            f"asset={td.get('asset')} forbidden={td.get('forbidden')}",
            "error",
        )
    )

    pm = vest.get("primary_market") or {}
    checks.append(
        (
            "SEP-primary-market-usdc-sink",
            pm.get("usdc_sink_contract") == "GovernanceTreasuryP4Cap"
            and all(
                (r.get("usdc_sink_ref") == "usdc_global_treasury")
                for r in (pm.get("rounds") or {}).values()
            ),
            f"sink={pm.get('usdc_sink_contract')}",
            "error",
        )
    )

    pm_sol = _read(ROOT / "contracts/src/TtgPrimaryMarketV1.sol")
    checks.append(
        (
            "SEP-contract-pm-usdc-to-treasury-slot",
            "transferFrom(msg.sender, usdcTreasury" in pm_sol,
            "TtgPrimaryMarketV1 → usdcTreasury immutable",
            "error",
        )
    )

    escrow_sol = _read(ROOT / "contracts/src/Escrow.sol")
    checks.append(
        (
            "SEP-contract-escrow-holds-usdc-per-order",
            "transferFrom(msg.sender, address(this)" in escrow_sol,
            "Escrow USDC custody per order instance",
            "error",
        )
    )

    genesis = _read(ROOT / "docs/spec/governance-token/GENESIS-GOVERNANCE-PHASE.md")
    checks.append(
        (
            "SEP-genesis-split-gvote-03-04",
            "G-VOTE-03" in genesis
            and "G-VOTE-04" in genesis
            and "GovernanceTreasuryP4Cap" in genesis
            and "treasury_dao" in genesis,
            "GENESIS §7.2 TTG bucket vs USDC Global Treasury",
            "error",
        )
    )
    checks.append(
        (
            "SEP-genesis-no-treasury-dao-p4-conflation",
            "P4 Reserve" not in genesis or "treasury_dao 20% · P4" not in genesis,
            "treasury_dao row must not read as P4 Reserve",
            "error",
        )
    )

    runbook = _read(ROOT / "docs/runbook/TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md")
    checks.append(
        (
            "SEP-runbook-treasury-dao-ttg-path",
            "TTG transfer only" in runbook and "GovernanceTreasuryP4Cap" in runbook,
            "runbook splits TTG dao bucket vs USDC treasury",
            "error",
        )
    )

    mainnet = _yaml(ROOT / "registry/mainnet-address-registry.v2.yaml")
    treasury = (mainnet.get("contracts") or {}).get("treasury") or {}
    checks.append(
        (
            "SEP-mainnet-treasury-slot-usdc-p4cap",
            treasury.get("contract") == "GovernanceTreasuryP4Cap",
            f"mainnet.treasury={treasury.get('contract')}",
            "error",
        )
    )

    sep_path = ROOT / "registry/asset-denomination-treasury-separation.v1.yaml"
    sep = _yaml(sep_path)
    cross = (vest.get("cross_refs") or {}).get("asset_treasury_separation")
    checks.append(
        (
            "SEP-vesting-cross-ref",
            cross == "registry/asset-denomination-treasury-separation.v1.yaml" and sep_path.is_file(),
            f"cross_ref={cross}",
            "error",
        )
    )

    fe_hint = _read(ROOT / "frontend/locales/en.ts")
    checks.append(
        (
            "SEP-frontend-treasury-dao-hint-ttg",
            "treasury_dao_hint" in fe_hint and "TTG reserve" in fe_hint,
            "frontend treasury_dao hint describes TTG not USDC P4",
            "warning",
        )
    )

    fe_treasury_note = "GovernanceTreasury budget" in fe_hint
    checks.append(
        (
            "SEP-frontend-usdc-treasury-scope-note",
            "governance_params_treasury_scope_note" in fe_hint,
            "USDC treasury budget alignment deferred to Gate-2.4 — documented",
            "warning",
        )
    )

    stale_targets = [
        ROOT / "docs/runbook/TT-TTG-VESTING-OWNER-INPUT-CHECKLIST.md",
        ROOT / "docs/runbook/TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md",
    ]
    stale: list[str] = []
    pat = re.compile(r"treasury_dao.*P4\s+(deploy|Reserve|cash)|GOV-01.*treasury_dao", re.I)
    vest_td = yaml.dump((vest.get("allocation_bucket_paths") or {}).get("treasury_dao") or {}) if yaml else ""
    if pat.search(vest_td):
        stale.append("registry/ttg-vesting-registry.v1.yaml#treasury_dao")
    for p in stale_targets:
        if p.is_file() and pat.search(_read(p)):
            stale.append(str(p.relative_to(ROOT)))
    checks.append(
        (
            "SEP-no-stale-treasury-dao-p4-drift",
            len(stale) == 0,
            f"stale: {stale or 'none'}",
            "error",
        )
    )

    vest_val = subprocess.run(
        [sys.executable, str(ROOT / "registry/validate-ttg-vesting-registry.py")],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )
    checks.append(
        (
            "SEP-vesting-registry-validator",
            vest_val.returncode == 0,
            (vest_val.stdout or vest_val.stderr or "").strip().split("\n")[-1],
            "error",
        )
    )

    inventory = _fund_flow_inventory()

    failed = [c for c in checks if not c[1]]
    critical = [c for c in failed if c[3] == "error"]
    warn_only = [c for c in failed if c[3] == "warning"]

    if critical:
        verdict = "FAIL"
    elif warn_only:
        verdict = "WARN"
    else:
        verdict = "PASS"

    findings = [
        {"id": c[0], "severity": c[3] if not c[1] else "ok", "detail": c[2]}
        for c in checks
        if not c[1]
    ]

    report = {
        "audit_id": "ASSET-DENOMINATION-TREASURY-SEPARATION-AUDIT-01",
        "stamp_utc": STAMP,
        "phase": "① local SSOT + contract read",
        "baseline_commits": ["9f500335", "4f56727e", "f575d459"],
        "verdict": verdict,
        "fund_flow_inventory": inventory,
        "checks": {c[0]: {"ok": c[1], "detail": c[2], "severity_if_fail": c[3]} for c in checks},
        "findings": findings,
        "manual_checklist_owner_only": [
            "Confirm operational Safe multisig signers for USDC P1/P2 routine budget (treasury-ops-policy)",
            "Define refunds / taxes / supplier / payroll routing in treasury-ops-policy (OWNER_INPUT)",
            "Verify on-chain Primary Market usdcTreasury == GovernanceTreasuryP4Cap address (② Sepolia)",
            "Confirm Escrow USDC never shares address with Global Treasury (② integration test)",
            "P4 deploy cap 30% enforcement — live spend tx (③ · not simulated here)",
        ],
        "honest_boundary": "① registry/contract alignment ≠ ② Sepolia address wiring ≠ ③ Production treasury ops GO",
    }

    out_dir = EVID / STAMP
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "asset-denomination-treasury-separation-audit.json"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    (EVID / "ASSET-DENOMINATION-TREASURY-SEPARATION-AUDIT-LATEST.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )

    md: list[str] = [
        "# Asset Denomination & Treasury Separation Audit — Latest",
        "",
        f"**Verdict:** `{verdict}` · **Stamp:** `{STAMP}` · **Phase:** ① local",
        "",
        "SSOT: [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml)",
        "",
        "## Executive split (must not conflate)",
        "",
        "| Treasury | Asset | Amount / nature | Spend path |",
        "|----------|-------|---------------|------------|",
        "| **TTG DAO Treasury** | TTG | 2M supply bucket (`treasury_dao`) | Proposal → Vote → Timelock → **TTG transfer only** |",
        "| **USDC Global Treasury** | USDC | PM sales · country 55% · FeeRouter global leg | **GovernanceTreasuryP4Cap** · P1→P4 · Timelock/Safe |",
        "| **Escrow (orders)** | USDC | Per-order | Escrow instance · release/refund only · **isolated** |",
        "",
        "## Fund-flow inventory",
        "",
    ]
    for row in inventory:
        md.append(f"### `{row['id']}` — {row.get('name', '')}")
        for k, v in row.items():
            if k not in ("id", "name") and v:
                md.append(f"- **{k}:** {v}")
        md.append("")

    md.extend(["## Automated checks", ""])
    for cid, ok, detail, _sev in checks:
        md.append(f"- {'✅' if ok else '❌'} `{cid}` — {detail}")

    md.extend(["", "## Findings", ""])
    if findings:
        for f in findings:
            md.append(f"- **{f['id']}** ({f['severity']}): {f['detail']}")
    else:
        md.append("- None.")

    md.extend(
        [
            "",
            "## Manual checklist (Owner only · not simulated)",
            "",
        ]
    )
    for item in report["manual_checklist_owner_only"]:
        md.append(f"- [ ] {item}")

    md.extend(
        [
            "",
            "## Correction applied (this audit)",
            "",
            "- Split `treasury_dao` from USDC P4 in registry + runbooks + GENESIS",
            "- Added `asset-denomination-treasury-separation.v1.yaml` machine SSOT",
            "- Primary Market USDC sink → `GovernanceTreasuryP4Cap` (not TTG dao bucket)",
            "",
            f"Machine-readable: `evidence/GO_asset_denomination_treasury_separation_audit/{STAMP}/asset-denomination-treasury-separation-audit.json`",
        ]
    )
    LATEST_MD.write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"ASSET_TREASURY_SEPARATION_AUDIT: {verdict} stamp={STAMP}")
    print(f"TT_ASSET_TREASURY_SEPARATION_SUMMARY: {verdict}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    sys.exit(main())
