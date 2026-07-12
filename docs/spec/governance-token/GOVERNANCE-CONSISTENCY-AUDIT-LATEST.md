# Governance Consistency Audit — Latest

**Verdict:** `PASS` · **Stamp:** `20260712T122953Z`

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
- ✅ `VESTING-schema-defined` — OWNER_INPUT fields pending: team.cliff_seconds, team.duration_seconds, team.start_timestamp, team.beneficiary, advisors.cliff_seconds…
- ✅ `VESTING-no-investor-pool` — no investor in vesting_tracks
- ✅ `VESTING-team-1_5M-frozen` — team=1500000
- ✅ `VESTING-advisors-0_5M-frozen` — advisors frozen
- ✅ `VESTING-ecosystem-governance-release` — type=governance_planned_release
- ✅ `VESTING-primary-market-500k-500k-1m` — rounds_sum=2000000
- ✅ `VESTING-no-public-global-cliff-track` — public_global via primary_market not vesting_tracks
- ✅ `VESTING-country-shelf-paths` — country_pool_shelf custody+release_paths
- ✅ `VESTING-treasury-dao-paths` — treasury_dao TTG-only custody+release_paths
- ✅ `VESTING-sepolia-not-blocked-by-commercial` — gate_separation present
- ✅ `TREASURY-spend-via-proposal` — Treasury spend requires Proposal→Vote→Timelock
- ✅ `TREASURY-no-self-vote-documented` — Treasury/DAO self-vote policy documented in GENESIS §7.2
- ✅ `PUBLIC-ROUND-voting-supply-defined` — Active Voting Supply + snapshot rules in GENESIS §3
- ✅ `NO-stale-400bps-vote-cap-in-key-ssot` — stale refs: none
- ✅ `GOV-03-AMENDMENT-present` — GOV-03-AMENDMENT-V1.1.md
- ✅ `TREASURY-separation-ssot-validator` — OK: asset-denomination-treasury-separation v1 ttg_dao=2M-TTG-only usdc_global=GovernanceTreasuryP4Cap rails=R1-R4-isolated pm_usdc_sink=P4Cap
- ✅ `TREASURY-genesis-usdc-global-vs-ttg-dao` — GENESIS separates G-VOTE-03 (TTG dao bucket) vs G-VOTE-04 (USDC Global Treasury)
- ✅ `GOV-LIFECYCLE-doc` — TTG-GOVERNANCE-LIFECYCLE.md
- ✅ `GOV-FREEZE-CERTIFICATE-doc` — TTG-GOVERNANCE-FREEZE-CERTIFICATE.md · Sepolia deferred

## Findings

- None.

## Next gate

**Governance Framework V1.1 FROZEN** — [TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md) · Sepolia V1.1 = Owner broadcast auth · Mainnet vesting = commercial OWNER_INPUT.

Machine-readable: `evidence/GO_governance_consistency_audit/20260712T122953Z/governance-consistency-audit.json`
