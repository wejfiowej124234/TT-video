# Governance Consistency Audit — Latest


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

**Verdict:** `PASS` · **Stamp:** `20260712T234607Z`

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
- ✅ `VESTING-schema-defined` — OWNER_INPUT fields pending: team.cliff_seconds, team.duration_seconds, team.start_timestamp, team.beneficiary
- ✅ `VESTING-no-investor-pool` — no investor in vesting_tracks
- ✅ `VESTING-no-advisors-track` — Genesis V2 removed advisors
- ✅ `VESTING-team-1_5M-frozen` — team=1500000
- ✅ `VESTING-genesis-v2-bps` — buckets={'team': 1500, 'community_incentive': 500, 'treasury_dao': 3000, 'public_sale': 5000}
- ✅ `VESTING-community-incentive-allocation` — community_incentive 0.5M
- ✅ `VESTING-primary-market-5m-registry-split` — rounds_sum=5000000
- ✅ `VESTING-no-shelf-path` — no country_pool_shelf in Genesis V2
- ✅ `VESTING-treasury-dao-3m-ttg-only` — treasury_dao 3M · not voting power · TTG-only
- ✅ `VESTING-sepolia-not-blocked-by-commercial` — gate_separation present
- ✅ `TREASURY-spend-via-proposal` — Treasury spend requires Proposal→Vote→Timelock
- ✅ `TREASURY-no-self-vote-documented` — Treasury/DAO self-vote policy documented in GENESIS §7.2
- ✅ `PUBLIC-ROUND-voting-supply-defined` — Active Voting Supply + snapshot rules in GENESIS §3
- ✅ `NO-stale-400bps-vote-cap-in-key-ssot` — stale refs: none
- ✅ `GOV-03-AMENDMENT-present` — GOV-03-AMENDMENT-V1.1.md
- ✅ `TREASURY-separation-ssot-validator` — OK: asset-denomination-treasury-separation v1 ttg_dao=3M-TTG-only usdc_global=GovernanceTreasuryP4Cap rails=R1-R4-isolated pm_usdc_sink=P4Cap
- ✅ `TREASURY-genesis-usdc-global-vs-ttg-dao` — GENESIS separates G-VOTE-03 (TTG dao bucket) vs G-VOTE-04 (USDC Global Treasury)
- ✅ `GOV-LIFECYCLE-doc` — TTG-GOVERNANCE-LIFECYCLE.md
- ✅ `GOV-FREEZE-CERTIFICATE-doc` — TTG-GOVERNANCE-FREEZE-CERTIFICATE.md · Sepolia deferred

## Findings

- None.

## Next gate

**Governance Framework V1.1 FROZEN** — [TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md) · Sepolia V1.1 = Owner broadcast auth · Mainnet vesting = commercial OWNER_INPUT.

Machine-readable: `evidence/GO_governance_consistency_audit/20260712T234607Z/governance-consistency-audit.json`
