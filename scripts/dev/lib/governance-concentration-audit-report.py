#!/usr/bin/env python3
"""Governance Concentration Audit · Sepolia · GOV-02/GOV-03 vs high-TTG holder scenario."""
from __future__ import annotations

import json
import os
import pathlib
import sys
from datetime import datetime, timezone


def wei_to_ttg(wei: int) -> float:
    return wei / 10**18


def pct(part: int, whole: int) -> float:
    if whole == 0:
        return 0.0
    return (part / whole) * 100.0


def main() -> int:
    evid = pathlib.Path(os.environ["GOV_CONCENTRATION_EVID"])
    evid.mkdir(parents=True, exist_ok=True)

    supply = int(os.environ["AUDIT_TOTAL_SUPPLY_WEI"])
    wallet_bal = int(os.environ["AUDIT_WALLET_BALANCE_WEI"])
    staked = int(os.environ.get("AUDIT_STAKED_WEI", "0"))
    quorum_bps = int(os.environ["AUDIT_QUORUM_BPS"])
    max_vote_bps = int(os.environ["AUDIT_MAX_VOTE_BPS"])
    tl_delay = int(os.environ["AUDIT_TIMELOCK_DELAY_SEC"])
    max_agg_stake = int(os.environ["AUDIT_MAX_AGGREGATE_STAKE_WEI"])
    prop_for = int(os.environ.get("AUDIT_PROPOSAL_FOR_VOTES_WEI", "0") or "0")
    prop_against = int(os.environ.get("AUDIT_PROPOSAL_AGAINST_VOTES_WEI", "0") or "0")

    max_vote_weight = (supply * max_vote_bps) // 10_000
    quorum_need = (supply * quorum_bps) // 10_000
    effective_vote = min(wallet_bal, max_vote_weight)

    cap_enforced_on_hat = prop_for > 0 and prop_for <= max_vote_weight
    params_match_ssot = quorum_bps == 400 and max_vote_bps == 400 and tl_delay == 172800
    stake_within_cap = staked <= max_agg_stake
    raw_concentration_bps = (wallet_bal * 10_000) // supply if supply else 0

    findings = []
    if raw_concentration_bps > 400:
        findings.append(
            {
                "id": "ECON-01",
                "severity": "informational",
                "title": "Raw TTG economic concentration exceeds 4%",
                "detail": f"Wallet holds {raw_concentration_bps/100:.2f}% of total supply raw; "
                f"on-chain vote weight capped at {max_vote_bps/100:.2f}% per GOV-03.",
            }
        )
    if max_vote_bps == quorum_bps and effective_vote >= quorum_need:
        findings.append(
            {
                "id": "GOV-CAP-01",
                "severity": "accepted-design",
                "title": "Capped single address can satisfy quorum alone",
                "detail": "max_voting_power_per_address_bps equals governance_quorum_bps (400). "
                "A holder at the cap contributes exactly quorum threshold — "
                "not uncapped capture; mitigated by Timelock 48h + disclosure rules in SSOT.",
            }
        )
    if prop_for and prop_for != effective_vote and prop_for > max_vote_weight:
        findings.append(
            {
                "id": "GOV-03-FAIL",
                "severity": "critical",
                "title": "Vote weight exceeded GOV-03 cap on observed proposal",
                "detail": f"forVotes={prop_for} > max={max_vote_weight}",
            }
        )

    checks = [
        ("GOV-02-quorum-bps", quorum_bps == 400),
        ("GOV-02-timelock-48h", tl_delay == 172800),
        ("GOV-03-vote-cap-bps", max_vote_bps == 400),
        ("GOV-03-max-aggregate-stake", max_agg_stake == 400_000 * 10**18),
        ("GOV-03-stake-within-cap", stake_within_cap),
        ("GOV-03-vote-cap-enforced-hat-r1", cap_enforced_on_hat or prop_for == 0),
        ("SSOT-params-aligned", params_match_ssot),
    ]
    failed = [name for name, ok in checks if not ok]
    verdict = "PASS" if not failed and not any(f["severity"] == "critical" for f in findings) else "FAIL"

    report = {
        "audit_id": "GOV-CONCENTRATION-AUDIT-01",
        "stamp_utc": os.environ.get("GOV_CONCENTRATION_STAMP", ""),
        "phase": "② Sepolia",
        "baseline": "GOV-FREEZE-V2-CLEAN-BASELINE",
        "ssot": "TTG-TOKENOMICS-FREEZE-V1 · GOV-02 · GOV-03",
        "wallet": os.environ.get("AUDIT_WALLET", ""),
        "metrics": {
            "total_supply_wei": str(supply),
            "total_supply_ttg": wei_to_ttg(supply),
            "wallet_balance_wei": str(wallet_bal),
            "wallet_balance_ttg": wei_to_ttg(wallet_bal),
            "wallet_raw_holding_pct": round(pct(wallet_bal, supply), 4),
            "staked_wei": str(staked),
            "staked_ttg": wei_to_ttg(staked),
            "max_vote_weight_wei": str(max_vote_weight),
            "max_vote_weight_ttg": wei_to_ttg(max_vote_weight),
            "effective_vote_weight_wei": str(effective_vote),
            "effective_vote_pct_of_supply": round(pct(effective_vote, supply), 4),
            "quorum_required_wei": str(quorum_need),
            "quorum_required_ttg": wei_to_ttg(quorum_need),
            "quorum_solo_possible_at_cap": effective_vote >= quorum_need,
            "hat_r1_proposal_for_votes_wei": str(prop_for),
            "hat_r1_proposal_against_votes_wei": str(prop_against),
        },
        "checks": {name: ok for name, ok in checks},
        "findings": findings,
        "verdict": verdict,
        "honest_boundary": "② Sepolia HAT wallet scenario · ≠ mainnet decentralization proof · ≠ ③ Production GO",
    }

    (evid / "governance-concentration-audit.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    md = [
        "# Governance Concentration Audit · Sepolia",
        "",
        f"**Verdict:** `{verdict}` · **Stamp:** `{report['stamp_utc']}`",
        "",
        "## Scenario",
        "",
        f"- Wallet `{report['wallet']}` · raw **{report['metrics']['wallet_balance_ttg']:,.0f} TTG** "
        f"({report['metrics']['wallet_raw_holding_pct']}% of supply)",
        f"- Effective vote weight (GOV-03 cap): **{report['metrics']['effective_vote_pct_of_supply']}%**",
        f"- Quorum need (GOV-02): **{wei_to_ttg(quorum_need):,.0f} TTG** ({quorum_bps/100}%)",
        "",
        "## GOV-02 / GOV-03 alignment",
        "",
    ]
    for name, ok in checks:
        md.append(f"- {'✅' if ok else '❌'} `{name}`")
    md.extend(["", "## Findings", ""])
    for f in findings:
        md.append(f"- **{f['id']}** ({f['severity']}): {f['detail']}")
    if not findings:
        md.append("- None beyond accepted design notes.")
    (evid / "GOVERNANCE-CONCENTRATION-AUDIT-REPORT.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"GOV_CONCENTRATION_AUDIT: {verdict} evidence={evid}")
    print(f"TT_GOV_CONCENTRATION_SUMMARY: {verdict}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
