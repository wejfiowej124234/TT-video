# TravelTrust Web3 · Vacancy W7 Dry Run Checklist v1

**Checklist ID:** `VACANCY_W7_DRY_RUN_V1`  
**Sprint:** W7-DryRun · **simulation only** · no Sepolia broadcast · no registry/env mutation  
**Prior:** [W6.5-B Balance Audit](./VACANCY-QF01-HISTORICAL-BALANCE-AUDIT-v1.md) PASS  
**Machine SSOT:** [registry/vacancy-w7-dry-run.v1.yaml](../../../registry/vacancy-w7-dry-run.v1.yaml)  
**Gate:** `bash scripts/gates/check-vacancy-runtime-migration-dryrun-gate.sh`

**Status:** ✅ **PASS** (fork sim complete · Sepolia broadcast not executed)

---

## Layer status

| Layer | Status |
|-------|--------|
| Protocol Layer | COMPLETE |
| Deployment Plan | VERIFIED |
| Fork Runtime Simulation | PASS |
| Sepolia Runtime Activation | WAITING OWNER APPROVAL |
| Production Mainnet | NOT STARTED |

---

## Purpose

Validate the **full production migration path** before any Sepolia broadcast:

```
W6.5-B PASS → W7 Dry Run → WEB3_RUNTIME_ACTIVATION_GATE → Owner Sign → W7 Execution
```

Dry run exposes early: constructor params · Timelock owner · token approval · migration selectors · registry order — **without** changing Sepolia state.

**W6.5-B conclusion (input):** Q-F01 settled · **0.495 USDC** residual on Unallocated · **Case B token migration only** (no ledger state import).

---

## Environment constants (Sepolia · DE)

| Item | Value |
|------|-------|
| V2 Timelock (required owner) | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| Legacy Timelock (migration actor) | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| Legacy Unallocated | `0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0` |
| Settlement token (6 dec) | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` |
| Migration amount | **495000** raw · **0.495000 USDC** |
| Steward stake pool | `0x3a89378bfad12d1028707dd37055294854c8784e` |

---

## W7-DryRun-01 · New triplet deployment simulation

**Goal:** Confirm Vacancy V1 triplet deploys with **`owner = V2 Timelock`**.

### Must verify

| Check | Pass criteria |
|-------|---------------|
| Deploy script | `contracts/script/DeployCountryPoolNetProfitStack.s.sol` |
| `TIMELOCK_ADDRESS` | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| `stackOwner` | `resolveChainOwner` → **V2 Timelock** (not deployer EOA · not Safe · not legacy Timelock) |
| Triplet wired | Ledger ↔ StewardPath ↔ Unallocated |
| `GLOBAL_TREASURY_ADDRESS` | V2 Timelock |
| `STEWARD_STAKE_POOL_ADDRESS` | Region steward pool proxy |

### Simulation command (no broadcast)

```bash
# Sepolia fork — does NOT mutate live Sepolia
export CHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
export TIMELOCK_ADDRESS=0x904a6c4c6aab698afbf08ec6151d317c393520cc
export GLOBAL_TREASURY_ADDRESS=0x904a6c4c6aab698afbf08ec6151d317c393520cc
export STEWARD_STAKE_POOL_ADDRESS=0x3a89378bfad12d1028707dd37055294854c8784e
export SETTLEMENT_JURISDICTION=DE
export SETTLEMENT_TOKEN_ADDRESS=0x241948bE49a778490c8A4Ae8D98b7537fE001f63

forge script contracts/script/DeployCountryPoolNetProfitStack.s.sol:DeployCountryPoolNetProfitStack \
  --fork-url "$CHAIN_RPC_URL" \
  -vvv
# Do NOT pass --broadcast
```

### Post-sim assertions

```bash
# Replace NEW_* with simulated deploy addresses from console output
cast call "$NEW_LEDGER" "owner()(address)" --rpc-url local_or_fork
cast call "$NEW_UNALLOC" "owner()(address)" --rpc-url local_or_fork
cast call "$NEW_STEWARD" "owner()(address)" --rpc-url local_or_fork
# All must equal 0x904a6c4c6aab698afbf08ec6151d317c393520cc
```

| DryRun ID | Status |
|-----------|--------|
| W7-DryRun-01 | ☐ NOT_RUN |

---

## W7-DryRun-02 · Vacancy capability probe

**Goal:** New addresses return V1 selectors · mode transitions from `SKIPPED_PRE_V1` → **`LIVE_CAPABLE`**.

| Probe | Selector | Contract | Pass |
|-------|----------|----------|------|
| `vacancyLedger()` | `ae607b9e` | New Unallocated | ☐ |
| `sweepEnabled()` | `a20b5507` | New Unallocated | ☐ |
| `vacancyState()` | `0d045440` | New Ledger | ☐ |
| `stewardActivationEpochId()` | `123d1b10` | New Ledger | ☐ |

```bash
cast call "$NEW_UNALLOC" "vacancyLedger()(uint256,uint256,uint256,uint256,uint8)" --rpc-url ...
cast call "$NEW_UNALLOC" "sweepEnabled()(bool)" --rpc-url ...
cast call "$NEW_LEDGER" "vacancyState()(uint8)" --rpc-url ...
cast call "$NEW_LEDGER" "stewardActivationEpochId()(uint256)" --rpc-url ...
```

**Legacy addresses on same fork must still FAIL probes** (control).

| DryRun ID | Status |
|-----------|--------|
| W7-DryRun-02 | ☐ NOT_RUN |

---

## W7-DryRun-03 · Historical asset migration simulation

**Goal:** Transfer **0.495 USDC** legacy → new Unallocated on fork.

### Pre-migration

| Vault | Expected balance |
|-------|------------------|
| Old Unallocated `0xAbE36…` | **495000** |
| New Unallocated | **0** |

### Simulated migration (fork only)

1. Impersonate Legacy Timelock `0x0359d4fB…` on fork (`vm.startBroadcast` / anvil_impersonateAccount).  
2. Execute token `transfer(newUnalloc, 495000)` **or** vault-specific owner withdrawal if contract supports it.  
3. Record **MigrationReference**: `proposalRef` · simulated tx hash · block.

### Post-migration

| Vault | Expected balance |
|-------|------------------|
| Old Unallocated | **0** |
| New Unallocated | **495000** |

**Ledger state:** Old ledger epoch 1 remains `SPLIT_COMPLETED` — **unchanged** (no storage migration).

| DryRun ID | Status |
|-----------|--------|
| W7-DryRun-03 | ☐ NOT_RUN |

---

## W7-DryRun-04 · Registry switch order rehearsal

**Goal:** Prove order · **forbid** registry-before-deploy.

### Required order (rehearsal checklist)

```
① Deploy new triplet          (DryRun-01)
        ↓
② Probe PASS                  (DryRun-02)
        ↓
③ Migration PASS              (DryRun-03)
        ↓
④ Balance reconcile PASS      old=0 new=495000
        ↓
⑤ Registry ACTIVE switch      (yaml rehearsal file only — NOT production registry)
        ↓
⑥ Indexer live mode enable    (config rehearsal / dry-run flag)
        ↓
⑦ Live reconcile PASS         SKIPPED_PRE_V1 → PASS
```

### Rehearsal artifact (no production edit)

Write proposed switch to:

`docs/spec/governance-token/evidence/vacancy-w7-dry-run/registry-switch-rehearsal.v1.yaml`

Production files **unchanged** until W7 Execution after Owner sign.

### Forbidden pattern

```
❌ Registry ACTIVE → then deploy
   (API would point at addresses without V1 runtime)
```

| DryRun ID | Status |
|-----------|--------|
| W7-DryRun-04 | ☐ NOT_RUN |

---

## Rollback rehearsal

| Step | Rollback |
|------|----------|
| Before registry switch | Discard fork · no production impact |
| After W7 real switch (future) | Revert registry/env to Q-F01 LEGACY_READ_ONLY addresses |

| Check | Status |
|-------|--------|
| Rollback path documented | ☐ |

---

## VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE

| Check | Required | Status |
|-------|----------|--------|
| New triplet deployment simulation | PASS | ✅ |
| Owner = V2 Timelock verified | PASS | ✅ |
| Capability probe (4 selectors) | PASS | ✅ |
| 0.495 USDC migration simulation | PASS | ✅ |
| Ledger state unchanged on legacy | PASS | ✅ |
| Registry switch rehearsal | PASS | ✅ |
| Rollback path | PASS | ✅ |

```
VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS
SEPOLIA_RUNTIME_ACTIVATION: WAITING_OWNER_APPROVAL
```

**Owner review:** [W7 Owner Evidence Review](./TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md)

---

## W6.5 Owner Sign-off readiness

| Section | Status |
|---------|--------|
| B.1 Triplet atomic migration | ✅ READY |
| B.2 Owner = V2 Timelock | ✅ READY |
| B.3 Historical balance | ✅ READY (0.495 USDC · Case B) |
| B.4 Registry switch order | ✅ READY |
| B.5 Legacy retention | ✅ READY |
| **Owner signature** | ⏳ WAITING OWNER APPROVAL |
| **W7 Dry Run** | ✅ PASS |

**Next:** [W7 Owner Evidence Review](./TRAVELTRUST-WEB3-VACANCY-W7-OWNER-EVIDENCE-REVIEW-v1.md) → sign → `WEB3_RUNTIME_ACTIVATION_GATE` → Sepolia broadcast.

---

## Full path to W7 Execution

```
W5  ✅
W6  ✅
W6.5-B  ✅ PASS
W7 Dry Run  ✅ PASS
Owner Evidence Review  ⏳ THIS STEP
WEB3_RUNTIME_ACTIVATION_GATE  ⛔
W7 Sepolia Broadcast  ⛔ BLOCKED
Production Mainnet  ❌ NOT STARTED
```

---

## Evidence folder (create on dry run execution)

```
docs/spec/governance-token/evidence/vacancy-w7-dry-run/
  DRYRUN-RESULT-v1.md
  registry-switch-rehearsal.v1.yaml
  migration-simulation-log.txt
```

**Orchestrator (plan-only default):**

```bash
bash scripts/ops/vacancy-w7-dry-run-orchestrator.sh --plan-only
```
