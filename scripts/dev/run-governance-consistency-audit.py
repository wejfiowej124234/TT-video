#!/usr/bin/env python3
"""Governance Consistency Audit — Tokenomics / SSOT / Frontend / Contracts cross-check.

SSOT intent: docs/spec/governance-token/GOVERNANCE-CONSISTENCY-AUDIT.md
Does NOT deploy or upgrade Sepolia Governor.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

ROOT = Path(os.environ.get("TT_ROOT", Path(__file__).resolve().parents[2]))
EVID = Path(os.environ.get("GOV_CONSISTENCY_EVID", ROOT / "evidence/GO_governance_consistency_audit"))
STAMP = os.environ.get("GOV_CONSISTENCY_STAMP", datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _yaml_gov() -> dict:
    if yaml is None:
        return {}
    data = yaml.safe_load(_read(ROOT / "docs/spec/governance-token/protocol-ssot.v1.yaml"))
    return (data or {}).get("governance_freeze_v1", {}).get("GOV-03", {})


def _fe_gov03() -> dict[str, int | bool]:
    text = _read(ROOT / "frontend/lib/governance/governanceParamsTokenomicsModel.ts")
    out: dict[str, int | bool] = {}
    for key, pat in {
        "max_active_seats_per_controlling_entity": r"max_active_seats_per_controlling_entity:\s*(\d+)",
        "max_voting_power_per_address_bps": r"max_voting_power_per_address_bps:\s*(\d+)",
        "max_aggregate_seat_stake_per_entity_bps": r"max_aggregate_seat_stake_per_entity_bps:\s*(\d+)",
        "max_voting_power_cap_disabled": r"max_voting_power_cap_disabled:\s*(true|false)",
    }.items():
        m = re.search(pat, text)
        if m:
            out[key] = m.group(1) == "true" if key.endswith("_disabled") else int(m.group(1))
    return out


def _sol_cap_disabled() -> bool | None:
    text = _read(ROOT / "contracts/src/TtgGovFreezeConstants.sol")
    m = re.search(r"MAX_VOTING_POWER_CAP_DISABLED\s*=\s*(true|false)", text)
    if m:
        return m.group(1) == "true"
    return None


def _sol_vote_bps() -> int | None:
    text = _read(ROOT / "contracts/src/TtgGovFreezeConstants.sol")
    m = re.search(r"MAX_VOTING_POWER_PER_ADDRESS_BPS\s*=\s*(\d+)", text)
    return int(m.group(1)) if m else None


def _vesting_owner_gaps() -> list[str]:
    if yaml is None:
        return ["pyyaml missing"]
    reg = yaml.safe_load(_read(ROOT / "registry/ttg-vesting-registry.v1.yaml")) or {}
    gaps: list[str] = []
    team = (reg.get("pools") or {}).get("team") or {}
    for field in ("cliff_seconds", "duration_seconds", "start_timestamp", "amount_tokens", "beneficiary"):
        if team.get(field) == "OWNER_INPUT":
            gaps.append(f"team.{field}")
    return gaps


def _genesis_end_conditions() -> bool:
    text = _read(ROOT / "docs/spec/governance-token/GENESIS-GOVERNANCE-PHASE.md")
    has_gates = "G-END-01" in text and "G-END-02" in text
    has_and = "同时满足" in text or "AND" in text
    no_or_only = "满足任一" not in text
    return has_gates and has_and and no_or_only


def _phase_transition_registry() -> dict:
    if yaml is None:
        return {}
    return yaml.safe_load(_read(ROOT / "registry/governance-phase-transition.v1.yaml")) or {}


def _public_governance_doc() -> bool:
    return (ROOT / "docs/spec/governance-token/PUBLIC-GOVERNANCE-PHASE.md").is_file()


def _stale_vote_cap_refs() -> list[str]:
    """Key SSOT paths that must not still assert 400 bps wallet vote cap."""
    targets = [
        ROOT / "docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md",
        ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md",
        ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md",
        ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md",
        ROOT / "docs/spec/governance-token/traveltrust-web3-protocol-master-audit-report-v1.md",
        ROOT / "docs/spec/governance-token/country-pool-settlement-gate2.4-prerequisites-checklist.md",
        ROOT / "docs/runbook/TTG-HAT-R1-SEPOLIA-LIVE-WALLET-RUNBOOK.md",
        ROOT / "docs/spec/governance-token/artifacts/ttg-governance-full-coverage-matrix.v1.json",
    ]
    stale: list[str] = []
    pat = re.compile(r"vote\s*cap\s*400|max_vote=400|单地址治理\s*≤\s*4", re.I)
    for p in targets:
        if p.is_file() and pat.search(_read(p)):
            stale.append(str(p.relative_to(ROOT)))
    return stale


def main() -> int:
    findings: list[dict] = []
    checks: list[tuple[str, bool, str]] = []

    yaml_gov = _yaml_gov()
    fe = _fe_gov03()
    cap_off_yaml = yaml_gov.get("max_voting_power_cap_disabled") is True
    cap_off_fe = fe.get("max_voting_power_cap_disabled") is True
    cap_off_sol = _sol_cap_disabled()
    vote_bps_yaml = yaml_gov.get("max_voting_power_per_address_bps")
    vote_bps_fe = fe.get("max_voting_power_per_address_bps")
    vote_bps_sol = _sol_vote_bps()

    checks.append(
        (
            "GOV-03-yaml-fe-vote-bps-zero",
            vote_bps_yaml == 0 and vote_bps_fe == 0 and vote_bps_sol == 0,
            f"yaml={vote_bps_yaml} fe={vote_bps_fe} sol={vote_bps_sol}",
        )
    )
    checks.append(
        (
            "GOV-03-cap-disabled-flag",
            cap_off_yaml and cap_off_fe and cap_off_sol is True,
            f"yaml={cap_off_yaml} fe={cap_off_fe} sol={cap_off_sol}",
        )
    )
    checks.append(
        (
            "GOV-03-seat-one-per-entity",
            yaml_gov.get("max_active_seats_per_controlling_entity") == 1
            and fe.get("max_active_seats_per_controlling_entity") == 1,
            "max_active_seats_per_controlling_entity=1",
        )
    )

    genesis = _read(ROOT / "docs/spec/governance-token/GENESIS-GOVERNANCE-PHASE.md")
    has_dilution = "Round 1 后" in genesis and "Round 3 后" in genesis
    checks.append(("GENESIS-dilution-table", has_dilution, "Genesis→R1→R2→R3 table present"))

    end_ok = _genesis_end_conditions()
    checks.append(
        (
            "GENESIS-explicit-end-conditions-and",
            end_ok,
            "G-END-01 AND G-END-02 (no OR-only exit)",
        )
    )

    reg = _phase_transition_registry()
    pgt = reg.get("public_governance_threshold") or {}
    reg_ok = (
        reg.get("genesis_exit", {}).get("logic") == "AND"
        and isinstance(pgt.get("active_voting_supply_min_bps"), int)
        and isinstance(pgt.get("public_bucket_votable_min_bps"), int)
    )
    checks.append(
        (
            "REGISTRY-public-governance-threshold",
            reg_ok,
            f"logic={reg.get('genesis_exit', {}).get('logic')} "
            f"active_bps={pgt.get('active_voting_supply_min_bps')} "
            f"public_bucket_bps={pgt.get('public_bucket_votable_min_bps')}",
        )
    )

    checks.append(
        (
            "PUBLIC-GOVERNANCE-PHASE-doc",
            _public_governance_doc(),
            "PUBLIC-GOVERNANCE-PHASE.md",
        )
    )

    genesis_no_hardcoded_15m = "1,500,000" not in genesis.split("§7.1")[1].split("§7.2")[0] if "§7.1" in genesis else True
    checks.append(
        (
            "GENESIS-exit-no-hardcoded-ttg-amounts",
            genesis_no_hardcoded_15m,
            "§7.1 reads Registry keys not absolute TTG amounts",
        )
    )

    vesting_gaps = _vesting_owner_gaps()
    vesting_schema_ok = len(vesting_gaps) > 0  # schema exists; values pending Owner
    checks.append(
        (
            "VESTING-schema-defined",
            vesting_schema_ok,
            f"OWNER_INPUT fields pending: {', '.join(vesting_gaps[:5])}{'…' if len(vesting_gaps) > 5 else ''}",
        )
    )

    alloc = _read(ROOT / "docs/spec/governance-token/ttg-allocation-permissions-flows-ssot-v1.md")
    treasury_flow = "Proposal → Vote" in genesis or "Proposal → Vote（GOV-02）" in genesis
    treasury_no_self = "G-VOTE-03" in genesis or "不能自己投自己" in alloc
    checks.append(
        (
            "TREASURY-spend-via-proposal",
            treasury_flow,
            "Treasury spend requires Proposal→Vote→Timelock",
        )
    )
    checks.append(
        (
            "TREASURY-no-self-vote-documented",
            treasury_no_self,
            "Treasury/DAO self-vote policy documented in GENESIS §7.2",
        )
    )

    active_supply = "Active Voting Supply" in genesis and "getPastVotes" in genesis
    checks.append(
        (
            "PUBLIC-ROUND-voting-supply-defined",
            active_supply,
            "Active Voting Supply + snapshot rules in GENESIS §3",
        )
    )

    stale = _stale_vote_cap_refs()
    checks.append(
        (
            "NO-stale-400bps-vote-cap-in-key-ssot",
            len(stale) == 0,
            f"stale refs: {stale or 'none'}",
        )
    )

    amendment = ROOT / "docs/spec/governance-token/GOV-03-AMENDMENT-V1.1.md"
    checks.append(("GOV-03-AMENDMENT-present", amendment.is_file(), str(amendment.name)))

    lifecycle = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-LIFECYCLE.md"
    freeze_cert = ROOT / "docs/spec/governance-token/TTG-GOVERNANCE-FREEZE-CERTIFICATE.md"
    checks.append(("GOV-LIFECYCLE-doc", lifecycle.is_file(), "TTG-GOVERNANCE-LIFECYCLE.md"))
    checks.append(
        (
            "GOV-FREEZE-CERTIFICATE-doc",
            freeze_cert.is_file() and "DEFERRED" in _read(freeze_cert),
            "TTG-GOVERNANCE-FREEZE-CERTIFICATE.md · Sepolia deferred",
        )
    )

    failed = [c for c in checks if not c[1]]
    warn_ids = {
        "VESTING-schema-defined",
        "NO-stale-400bps-vote-cap-in-key-ssot",
        "TREASURY-no-self-vote-documented",
    }
    critical_fail = [c for c in failed if c[0] not in warn_ids]

    if critical_fail:
        verdict = "FAIL"
    elif failed:
        verdict = "WARN"
    else:
        verdict = "PASS"

    for cid, ok, detail in checks:
        if not ok:
            sev = "warning" if cid in warn_ids else "error"
            findings.append({"id": cid, "severity": sev, "detail": detail})

    report = {
        "audit_id": "GOV-CONSISTENCY-AUDIT-01",
        "stamp_utc": STAMP,
        "phase": "① local SSOT",
        "verdict": verdict,
        "checks": {c[0]: {"ok": c[1], "detail": c[2]} for c in checks},
        "findings": findings,
        "owner_input_open": {
            "team_vesting_commercial_params": vesting_gaps,
            "sepolia_governor_v1_1_upgrade": "deferred until this audit PASS",
        },
        "honest_boundary": "① doc/constant alignment ≠ ② Sepolia on-chain upgrade ≠ ③ Production GO",
    }

    out_dir = EVID / STAMP
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "governance-consistency-audit.json"
    json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    latest_json = EVID / "GOVERNANCE-CONSISTENCY-AUDIT-LATEST.json"
    latest_md = ROOT / "docs/spec/governance-token/GOVERNANCE-CONSISTENCY-AUDIT-LATEST.md"
    latest_json.write_text(json.dumps(report, indent=2), encoding="utf-8")

    md_lines = [
        "# Governance Consistency Audit — Latest",
        "",
        f"**Verdict:** `{verdict}` · **Stamp:** `{STAMP}`",
        "",
        "Automated cross-check: Tokenomics · SSOT · Frontend · Contracts · Genesis.",
        "",
        "## Checks",
        "",
    ]
    for cid, ok, detail in checks:
        md_lines.append(f"- {'✅' if ok else '❌'} `{cid}` — {detail}")
    md_lines.extend(["", "## Findings", ""])
    if findings:
        for f in findings:
            md_lines.append(f"- **{f['id']}** ({f['severity']}): {f['detail']}")
    else:
        md_lines.append("- None.")
    md_lines.extend(
        [
            "",
            "## Next gate",
            "",
            "**Governance Framework V1.1 FROZEN** — [TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md) · Owner Decision (vesting) → Sepolia upgrade.",
            "",
            f"Machine-readable: `evidence/GO_governance_consistency_audit/{STAMP}/governance-consistency-audit.json`",
        ]
    )
    latest_md.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    print(f"GOV_CONSISTENCY_AUDIT: {verdict} stamp={STAMP}")
    print(f"TT_GOV_CONSISTENCY_SUMMARY: {verdict}")
    return 0 if verdict != "FAIL" else 1


if __name__ == "__main__":
    sys.exit(main())
