# TravelTrust Vacancy Runtime Activation Review

**Document ID:** `VACANCY_W7_OWNER_EVIDENCE_REVIEW_V1`  
**Purpose:** One-page Owner review before Sepolia runtime activation broadcast  
**Scope:** Sepolia ② only · **Not mainnet · Not executed on-chain yet**  
**Evidence:** [W7 Dry Run](./evidence/vacancy-w7-dry-run/DRYRUN-RESULT-v1.md) · [W6.5-B Balance Audit](./VACANCY-QF01-HISTORICAL-BALANCE-AUDIT-v1.md)  
**Gate:** `VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS`

---

## Status model (accurate · do not conflate)

| Layer | Status |
|-------|--------|
| **Protocol Layer** | ✅ COMPLETE |
| **Deployment Plan** | ✅ VERIFIED |
| **Fork Runtime Simulation** | ✅ PASS |
| **Sepolia Runtime Activation** | ⏳ **WAITING OWNER APPROVAL** |
| **Production Mainnet** | ❌ **NOT STARTED** |

**What fork simulation proved:** If executed as designed, Vacancy V1 **can safely replace** Q-F01 runtime.  
**What it did not prove:** Chain upgrade is **already done**. Simulation ≠ broadcast.

---

## 1. Protocol — PASS

Vacancy V1 protocol design, indexer discipline, governance payload, and ABI freeze are complete in repo.  
Q-F01 on Sepolia remains **legacy bytecode** — not an upgrade of the same contract.

---

## 2. Fork Simulation — PASS

Sepolia fork · no broadcast · no registry mutation.

| Step | Result |
|------|--------|
| Deploy Vacancy V1 triplet | PASS |
| Owner = V2 Timelock | PASS |
| Capability probe (4 selectors) | PASS → `LIVE_CAPABLE` |
| Case B migration (495000 raw) | PASS · accounting closed |
| Registry order rehearsal | PASS |
| Rollback path | PASS |

**Runtime transition (design verification only):**

```
Before:  Protocol COMPLETE · Runtime LEGACY (Q-F01)
After:   Protocol COMPLETE · Runtime READY_FOR_ACTIVATION
```

Evidence: `docs/spec/governance-token/evidence/vacancy-w7-dry-run/`

---

## 3. Historical Balance — PASS

Read-only W6.5-B audit (Sepolia DE Q-F01):

| Item | Value |
|------|-------|
| Legacy Unallocated | **495000** raw · **0.495 USDC** |
| Steward / Ledger token balance | **0** |
| Epoch 1 status | **SPLIT_COMPLETED** (no open settlement) |
| Migration case | **Case B** — token migration only (no ledger state import) |

---

## 4. Migration Method — Case B

**Not** a proxy upgrade. **New deploy + asset migration + registry switch.**

### Critical runbook finding: Legacy Unallocated interface

Q-F01 legacy Unallocated (`0xAbE36…`) is **not** full Vacancy V1 bytecode:

| Function | Q-F01 Legacy |
|----------|--------------|
| `releaseToStewardPath(uint256,bytes32)` | ✅ (routes to steward vault only) |
| `disburseJurisdictionReserve()` | ❌ absent |
| `vacancyLedger()` | ❌ reverts |

**Do not assume** `oldVault.transferTo(newVault)` or `oldVault.disburse(...)` exists.

**Correct migration strategy:**

```
Timelock / owner-controlled migration
        |
        | read legacy balance (495000)
        v
ERC20 transfer (governance-authorized)
        |
        v
New Vacancy V1 Unallocated Vault
        |
        v
Balance reconcile (old=0 · new=495000)
```

Fork sim validated accounting closure; **W7 production calldata** must be finalized in runbook against legacy interface (see [W7 Runbook Addendum](./TRAVELTRUST-WEB3-VACANCY-W7-RUNBOOK-ADDENDUM-v1.md)).

---

## 5. Owner Control — PASS

| Check | Result |
|-------|--------|
| New triplet `owner` | V2 Timelock `0x904a6C4c6Aab698AfBF08EC6151D317c393520cC` |
| Deployer → owner function | ❌ reverts (forbidden path) |
| V2 Timelock → owner function | ✅ succeeds (Governor → Timelock → Vault) |
| `globalTreasury` | V2 Timelock |

Deployer permanent vault control risk: **excluded**.

---

## 6. Rollback — PASS

| Phase | Rollback |
|-------|----------|
| Before registry switch | Discard fork / abort W7 — no production impact |
| After Sepolia W7 switch | Revert registry/env to Q-F01 `LEGACY_READ_ONLY` addresses |

---

## Owner approval checklist (Sepolia W7)

Owner confirms the following **before any Sepolia broadcast**:

| # | Item | Confirm |
|---|------|---------|
| ① | **New triplet deploy** — owner = V2 Timelock (not deployer / Safe / legacy Timelock) | ☐ |
| ② | **Historical balance** — migrate **495000** from legacy Unallocated; post-migration old=0 · new=495000 | ☐ |
| ③ | **Registry switch order** — Deploy → Probe → Migration → Reconcile → Registry ACTIVE (**never** registry before deploy) | ☐ |
| ④ | **Legacy retention** — Q-F01 triplet stays `LEGACY_READ_ONLY` for audit history (do not delete · do not mix with V1) | ☐ |

---

## Approval

| Field | Value |
|-------|-------|
| **Approval** | ☐ **Allow Sepolia Runtime Activation** |
| Owner name | |
| Signature | |
| Date (UTC) | |

**Signed copy path:** `docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1-SIGNED.md`

---

## After Owner sign

```
Owner Evidence Review SIGNED
        ↓
WEB3_RUNTIME_ACTIVATION_GATE PASS
        ↓
W7 Sepolia Broadcast (triplet deploy · migration · registry switch)
```

**Until signed:** ⛔ No Vacancy deploy · No registry switch · No Sepolia state change · **Mainnet not in scope.**

---

## Certificate

```
PROTOCOL_LAYER: COMPLETE
DEPLOYMENT_PLAN: VERIFIED
FORK_RUNTIME_SIMULATION: PASS
SEPOLIA_RUNTIME_ACTIVATION: WAITING_OWNER_APPROVAL
PRODUCTION_MAINNET: NOT_STARTED
VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS
W7_SEPOLIA_BROADCAST: BLOCKED
```
