# Attack Surface Matrix

**Recorded:** 2026-07-08T13:14:49.562Z

## Escrow

| ID | Vector | Proof | Status |
|----|--------|-------|--------|
| ASM-ESC-01 | Reentrancy | forge test or CEI pattern in source | CEI_PARTIAL |
| ASM-ESC-02 | Double Release | status gate Funded→Completed once | SOURCE |
| ASM-ESC-03 | Unauthorized Release | caller restriction or documented relayer model | SOURCE |
| ASM-ESC-04 | Wrong Recipient | init immutability of guide/traveler/token | SOURCE |

## TravelTrustGovernor

| ID | Vector | Proof | Status |
|----|--------|-------|--------|
| ASM-GOV-01 | Flash Vote | ERC20Votes getPastVotes | **UNVERIFIED** |
| ASM-GOV-02 | Queue Spam | proposal threshold + timelock | **UNVERIFIED** |
| ASM-GOV-03 | Execute Replay | timelock idempotency | **UNVERIFIED** |

## FeeRouter

| ID | Vector | Proof | Status |
|----|--------|-------|--------|
| ASM-FR-01 | Routing config hijack | onlyOwner + Timelock as owner | SOURCE |
| ASM-FR-02 | Dust accumulation | distribute pulls full balance | **UNVERIFIED** |

## RegionStewardStakePool

| ID | Vector | Proof | Status |
|----|--------|-------|--------|
| ASM-STK-01 | Double stake same jurisdiction | hasJurisdictionStake guard | **UNVERIFIED** |
| ASM-STK-02 | Early unstake | release delay timestamps | **UNVERIFIED** |

## GovernanceTreasuryP4Cap

| ID | Vector | Proof | Status |
|----|--------|-------|--------|
| ASM-TR-01 | Spender bypass cap | P4 cap enforcement test | **UNVERIFIED** |
| ASM-TR-02 | Non-spender drain | onlySpender modifier | SOURCE |

## TimelockUpgradeableProxy

| ID | Vector | Proof | Status |
|----|--------|-------|--------|
| ASM-PRX-01 | EOA upgradeTo | admin slot = Timelock only | **UNVERIFIED** |

