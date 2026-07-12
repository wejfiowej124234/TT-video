# Governance Consistency Audit — Latest

**Verdict:** `PASS` · **Stamp:** `20260712T120952Z`

Automated cross-check: Tokenomics · SSOT · Frontend · Contracts · Genesis.

## Checks

- ✅ `GOV-03-yaml-fe-vote-bps-zero` — yaml=0 fe=0 sol=0
- ✅ `GOV-03-cap-disabled-flag` — yaml=True fe=True sol=True
- ✅ `GOV-03-seat-one-per-entity` — max_active_seats_per_controlling_entity=1
- ✅ `GENESIS-dilution-table` — Genesis→R1→R2→R3 table present
- ✅ `GENESIS-explicit-end-conditions-and` — G-END-01 AND G-END-02 (no OR-only exit)
- ✅ `REGISTRY-public-governance-threshold` — logic=AND active_bps=3500 public_bucket_bps=7500
- ✅ `PUBLIC-GOVERNANCE-PHASE-doc` — PUBLIC-GOVERNANCE-PHASE.md
- ✅ `GENESIS-exit-no-hardcoded-ttg-amounts` — §7.1 reads Registry keys not absolute TTG amounts
- ✅ `VESTING-schema-defined` — OWNER_INPUT fields pending: team.cliff_seconds, team.duration_seconds, team.start_timestamp, team.amount_tokens, team.beneficiary
- ✅ `TREASURY-spend-via-proposal` — Treasury spend requires Proposal→Vote→Timelock
- ✅ `TREASURY-no-self-vote-documented` — Treasury/DAO self-vote policy documented in GENESIS §7.2
- ✅ `PUBLIC-ROUND-voting-supply-defined` — Active Voting Supply + snapshot rules in GENESIS §3
- ✅ `NO-stale-400bps-vote-cap-in-key-ssot` — stale refs: none
- ✅ `GOV-03-AMENDMENT-present` — GOV-03-AMENDMENT-V1.1.md
- ✅ `GOV-LIFECYCLE-doc` — TTG-GOVERNANCE-LIFECYCLE.md
- ✅ `GOV-FREEZE-CERTIFICATE-doc` — TTG-GOVERNANCE-FREEZE-CERTIFICATE.md · Sepolia deferred

## Findings

- None.

## Next gate

**Governance Framework V1.1 FROZEN** — [TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md) · Owner Decision (vesting) → Sepolia upgrade.

Machine-readable: `evidence/GO_governance_consistency_audit/20260712T120952Z/governance-consistency-audit.json`
