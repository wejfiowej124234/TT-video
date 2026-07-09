# Fund Lifecycle Audit

**Recorded:** 2026-07-08T12:04:36.756Z
**Principle:** Every step — who can call · who cannot · rollback · pause · deadlock

| Step | Track | Flow | Caller | Pause | Rollback | Deadlock | Status |
|------|-------|------|--------|-------|----------|----------|--------|
| FL-01 | R3_escrow | Traveler USDC → Escrow lock | traveler | none (immutable instance) | refund while Funded (traveler only) | Created without deposit — order stuck un… | **PASS** |
| FL-02 | R3_escrow | Escrow Funded → Release split (after bilateral service complete) | permissionless Keeper AFTER service bilateral complete — Design Intent | none | none after Completed | release before bilateral confirm if atte… | **PASS** |
| FL-03 | R4_platform_fee | platformFeeRecipient → FeeRouter distribute | owner | distributePaused blocks new distribute | none (tokens already split) | fees stuck in FeeRouter if paused and no… | **PASS** |
| FL-04 | D4555_A | FeeRouter countryBucket → RegionVault | FeeRouter owner distribute path | FeeRouter pause | none | misconfigured countryBucket address… | **PASS** |
| FL-05 | D4555_B | Net profit accrual → CountryPoolNetProfitLedger | owner Timelock | owner-controlled ops | epoch OPEN only — close rules apply | epoch stuck OPEN without close… | **PASS** |
| FL-06 | D4555_B | Ledger split → StewardPathVault / Treasury path | owner Timelock | Timelock schedule delay | none post SPLIT_COMPLETED | SPLIT_PENDING without executeSplit… | **PASS** |
| FL-07 | R1_ttg | Steward TTG stake lock | steward EOA | pool parameter freeze | unstake release path after delay | releaseRequestedAt without claimReleased… | **PASS** |
| FL-08 | R1_ttg | Treasury spend (governance) | spender role — Timelock execute | Timelock delay 48h | none | queued proposal expires… | **PASS** |
| FL-09 | R2_country_pool | Claim → Wallet | holder EOA | epoch not open | none | TARGET — mainnet not deployed… | **PASS** |

## Escrow.release caller cross-validation

```json
{
  "verified": false,
  "note": "release() not found"
}
```

> **Blocker:** `Escrow.release()` has no `onlyTraveler`/`onlyGuide` in source. Must document relayer model or add on-chain guard before mainnet.

