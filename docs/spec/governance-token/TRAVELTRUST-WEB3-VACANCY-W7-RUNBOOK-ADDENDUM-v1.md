# TravelTrust Web3 · Vacancy W7 Runbook Addendum v1

**Addendum ID:** `VACANCY_W7_RUNBOOK_ADDENDUM_V1`  
**Parent:** [W6 Activation Plan](./TRAVELTRUST-WEB3-RUNTIME-ACTIVATION-PLAN-v1.md) · [W7 Dry Run Checklist](./TRAVELTRUST-WEB3-VACANCY-W7-DRY-RUN-CHECKLIST-v1.md)  
**Owner review:** [W7 Owner Evidence Review](./TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md)  
**Status:** REQUIRED READING before W7 Sepolia broadcast

---

## Purpose

Record the **legacy interface delta** discovered during W7 fork simulation. W6.5-B proved **what** the balance is; fork sim proved **how** migration must be executed given Q-F01 bytecode.

---

## Q-F01 Legacy Unallocated — verified interface

**Address:** `0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0`  
**Bytecode codehash:** `0x7f1baadc63837afe9d627dd93df6cb46b2f7461805128acb4e42433f10a060dc`  
**Owner:** Legacy Timelock `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f`

### Present

| Selector | Function | Notes |
|----------|----------|-------|
| `0x7fc399a2` | `releaseToStewardPath(uint256,bytes32)` | Transfers to **hardcoded steward vault only** |
| `0x4fe38819` | `depositFromLedger(uint256,uint256)` | Ledger-only inbound |
| `0xf2fde38b` | `transferOwnership(address)` | Timelock migration of vault ownership |

### Absent (revert on Q-F01)

| Function | Vacancy V1 |
|----------|------------|
| `vacancyLedger()` | Required on new Unallocated |
| `disburseJurisdictionReserve()` | Timelock disburse to allowlisted recipient |
| `setDisburseRecipientAllowed()` | G-04 allowlist |

**Conclusion:** Legacy vault is **pre-Vacancy-V1-runtime** custody. Do not assume V1 governance disburse selectors exist on chain.

---

## Forbidden migration assumptions

```
❌ oldVault.disburseJurisdictionReserve(newUnalloc, 495000, ...)
❌ oldVault.transferTo(newUnalloc, 495000)
❌ Import ledger storage from Q-F01
❌ Proxy upgrade on immutable Q-F01 triplet
```

---

## Approved migration strategy (Case B)

```
① Deploy new Vacancy V1 triplet (owner = V2 Timelock)
        ↓
② Probe PASS on new addresses (4 selectors → LIVE_CAPABLE)
        ↓
③ Legacy Timelock: governance-authorized outbound transfer
   · Read balanceOf(legacyUnalloc) = 495000
   · Execute owner-controlled migration (ERC20 outflow to new Unallocated)
   · Production calldata: finalize via Timelock schedule/execute
        ↓
④ Reconcile: old=0 · new=495000 · legacy ledger epoch unchanged
        ↓
⑤ Registry ACTIVE (DE jurisdiction env)
        ↓
⑥ Indexer live reconcile enabled
```

**Fork evidence:** `evidence/vacancy-w7-dry-run/DRYRUN-03-migration.json`

---

## Registry switch order (frozen)

**Required:**

```
Deploy → Probe PASS → Migration PASS → Reconcile PASS → Registry ACTIVE → Indexer live
```

**Forbidden:**

```
Registry ACTIVE → Deploy
```

Violating order causes API/indexer/UI to reference addresses without V1 runtime on chain.

---

## Legacy retention (post-W7)

| Stack | Status | Action |
|-------|--------|--------|
| Q-F01 triplet | `LEGACY_READ_ONLY` | Retain for audit · do not delete · do not route new traffic |
| Vacancy V1 triplet | `ACTIVE` (after W7) | Registry + env point here |

---

## W7 production calldata — open item

Fork sim closed **accounting** on fork via vault-initiated `ERC20.transfer` (simulation only).

**Before Sepolia broadcast:** Engineering + Owner must finalize **Timelock payload** that achieves the same balance outcome on live Q-F01 bytecode without assuming absent selectors.

Candidate paths to evaluate in W7 prep (not yet broadcast):

1. Governance proposal authorizing direct token migration from legacy Unallocated address  
2. Two-hop via steward (only if runbook explicitly accepts steward as interim custodian)  
3. Other Timelock-executable path verified against live legacy bytecode

**Blocker if unresolved:** Do not broadcast migration step.

---

## Status reference

| Layer | Status |
|-------|--------|
| Protocol Layer | COMPLETE |
| Deployment Plan | VERIFIED |
| Fork Runtime Simulation | PASS |
| Sepolia Runtime Activation | WAITING OWNER APPROVAL |
| Production Mainnet | NOT STARTED |
