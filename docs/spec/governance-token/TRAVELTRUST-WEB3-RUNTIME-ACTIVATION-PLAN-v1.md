# TravelTrust Web3 Runtime Activation Plan v1

**Plan ID:** `WEB3_RUNTIME_ACTIVATION_PLAN_V1`  
**Sprint:** **W6** · Runtime Activation Planning (**no code changes · no on-chain execution**)  
**Prior:** [W5 Master Audit](./traveltrust-web3-protocol-master-audit-report-v1.md) · [Drift Report](./traveltrust-web3-protocol-drift-report-v1.md)  
**Machine SSOT:** [registry/runtime-activation-plan.v1.yaml](../../../registry/runtime-activation-plan.v1.yaml)  
**Next:** **W7** Sepolia Upgrade Execution — **BLOCKED** until this plan is reviewed and activation items are explicitly approved

**Generated:** 2026-07-09

---

## 0. Executive conclusion (post-W5)

TravelTrust Web3 is **not** blocked on protocol development. The project enters **protocol asset governance + runtime activation management**.

| Phase | Status |
|-------|--------|
| Protocol rules (Solidity + SSOT + PCM) | ✅ Largely **COMPLETE** |
| Verification (Forge · invariant · registry · matrix) | ✅ **COMPLETE** |
| Transparency (indexer → governance → ops console) | ✅ **COMPLETE** |
| Runtime alignment (repo ↔ Sepolia bytecode) | ⏳ **PENDING** — W6→W7 |

**Do not now:** upgrade Vacancy · deploy Escrow V2 · change treasury addresses · change tokenomics · change governance params.

---

## 1. Runtime activation priority matrix

| Priority | Module | Current runtime | Target runtime | W6 action | W7 execution |
|----------|--------|-----------------|----------------|-----------|--------------|
| **P0** | Treasury env / API | Naming drift (`TREASURY_ADDRESS`, `GOVERNANCE_TREASURY_ADDRESS`, RegionVault fallback) | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` + `LEGACY_TREASURY_ADDRESS` only | Define alias map + forbid list + `/meta` contract | Config + API PR (no chain tx) |
| **P1** | Vacancy DE + Country Pool | Q-F01 legacy bytecode | Vacancy V1 selectors **ACTIVE** | **Choose migration B** (see §3) | Governed deploy + registry switch |
| **P1** | Dual Timelock (DE owner) | Legacy `0x0359d4fB…` owns triplet · V2 `0x904a6c4c…` owns gov stack | Documented split or owner → V2 on **new** deploy | Strategy decision | Timelock txs only |
| **P2** | EscrowFactory V2 | NOT_DEPLOYED on Sepolia | **FUTURE_MAINNET_REQUIRED** · Sepolia **DEFER** optional | Reclassify in matrix (not “漏部署”) | Mainnet wave · optional Sepolia pilot |
| **P3** | Primary Market | On-chain ACTIVE · UI deferred | Confirm wiring before public ops | Checklist only | FE/API when product ready |
| **P3** | Steward / identity stake | ACTIVE proxies/pools | Confirm probe + jurisdiction bootstrap | Checklist only | Ops verification |
| **P3** | Distribution claim contracts | NOT on Sepolia spine | Deploy when R2 claim path needed | Defer | W7+ scope |

---

## 2. Three-status reference (from W5)

Every activation item tracks:

| Axis | Values |
|------|--------|
| **Protocol Status** | `COMPLETE` · `IN_PROGRESS` · `DEPRECATED` |
| **Deployment Status** | `NOT_DEPLOYED` · `DEPLOYED` · `VERIFIED` |
| **Runtime Status** | `ACTIVE` · `LEGACY` · `PENDING_UPGRADE` · `UNKNOWN` |

**Vacancy DE today:** `COMPLETE` / `DEPLOYED` / `LEGACY` → target: `COMPLETE` / `VERIFIED` / `ACTIVE`.

---

## 3. DE Q-F01 → Vacancy V1 — upgrade path decision

### 3.1 Option A — Proxy upgrade

```
Old implementation → upgradeTo → New Vacancy implementation
```

| Criterion | Assessment |
|-----------|------------|
| DE triplet uses proxy? | **No** — `g24-p-upgrade-01-contract-posture.v1.yaml` → **IMMUTABLE_EXEMPT** |
| `CountryPoolNetProfitLedger` | Direct deploy · fixed codehash |
| `StewardPathVault` / `UnallocatedStewardPathVault` | Direct deploy · fixed codehash |

**W6 decision: Option A is NOT AVAILABLE for DE Sepolia triplet.**

Proxy upgrade **only** applies to the five GovFreeze V2 shells (Governor, P4Cap, Primary Market, Seat Registry, Steward Stake Pool) — already on V2 baseline.

### 3.2 Option B — New deployment + registry migration (RECOMMENDED)

```
Q-F01 triplet (legacy addresses, preserved read-only)
        ↓
Deploy Vacancy V1 triplet (NEW addresses, Vacancy V1 bytecode)
        ↓
Governance: fund migration / cutover (if balances on old vaults)
        ↓
Registry + env + jurisdiction JSON switch
        ↓
Indexer + capability probe on NEW addresses
        ↓
Runtime ACTIVE
```

| Step | Owner | Method |
|------|-------|--------|
| 1. Deploy V1 stack | Legacy or V2 Timelock (plan: **V2 Timelock owner on new triplet**) | `DeployCountryPoolNetProfitStack.s.sol` |
| 2. Verify bytecode | Ops | `eth_getCode` + selector probe (§6) |
| 3. Migrate USDC (if any on old vaults) | Legacy Timelock `0x0359d4fB…` | Governed vault transfer / sweep scripts |
| 4. Point SSOT | Registry | `protocol-convergence-deployments` · `jurisdiction_country_pool_net_profit.sepolia.json` · master matrix |
| 5. Point runtime | Env | `COUNTRY_POOL_*` · `UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS` |
| 6. Indexer | API | Reconcile on new addresses · old events remain historical |
| 7. Deprecate old triplet | Docs | Mark Q-F01 addresses **LEGACY_READ_ONLY** — do not delete history |

**Existing tooling:** `CpNetProfitSepoliaCutoverAndDrill.s.sol` — cutover `globalTreasury` to V2 Timelock (already designed for dual-Timelock DE pilot). **New triplet deploy is a separate W7 transaction set.**

### 3.3 Rollback plan (Vacancy / DE)

| Trigger | Rollback |
|---------|----------|
| Probe FAIL after deploy | Do **not** switch registry/env; keep Q-F01 addresses active |
| Reconcile DRIFT on new addresses | Halt switch; investigate indexer vs chain |
| Post-switch production issue | Revert env/registry to Q-F01 addresses (read-only ops console still valid); **cannot** revert immutable bytecode at old addresses |

**Rollback discipline:** Registry switch is the activation lever — keep Q-F01 addresses documented as fallback until V1 runtime stable for N epochs.

### 3.4 Verification (Vacancy W7)

- [ ] Four selectors present on new bytecode (`vacancyLedger`, `sweepEnabled`, `vacancyState`, `stewardActivationEpochId`)
- [ ] `VACANCY_DEPLOYMENT_READINESS` gate PASS
- [ ] `WEB3_VACANCY_INDEXER_RECONCILE` live mode PASS (not `SKIPPED_PRE_V1`)
- [ ] Ops console shows `runtimeStatus: ACTIVE`
- [ ] Forge drill: six-event sequence on fork or testnet

---

## 4. Treasury env drift — fix plan (P0 · W7 config)

### 4.1 Target naming (frozen for W7)

| Role | **Only** env keys | Sepolia address |
|------|-------------------|-----------------|
| **Active DAO treasury** | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` (alias: `TREASURY_P4_CAP_ADDRESS`) | `0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2` |
| **Legacy FeeRouter leg** | `LEGACY_TREASURY_ADDRESS` | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` |

### 4.2 Forbidden (W7 enforcement)

| Key | Reason |
|-----|--------|
| `TREASURY_ADDRESS` (bare) | Ambiguous — blocked by `env-key-catalog-web3.v1.yaml` |
| `GOVERNANCE_TREASURY_ADDRESS` | Uncatalogued duplicate — migrate reads to P4Cap key |

### 4.3 W7 change list (plan only — not executed in W6)

| Surface | Change |
|---------|--------|
| `crates/api/src/chain/mod.rs` | Remove `REGION_VAULT_ADDRESS` fallback from `treasury_address` |
| `crates/api/src/routes/governance/governance_pool.rs` | Read P4Cap key (or documented alias) |
| `scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh` | Verify `FeeRouter.globalOps()` vs `LEGACY_TREASURY_ADDRESS` |
| `.env` examples | Replace `TREASURY_ADDRESS` placeholders |
| `registry/env-key-catalog-web3.v1.yaml` | Add deprecation note for `GOVERNANCE_TREASURY_ADDRESS` → P4Cap |

### 4.4 Rollback

Pure config — revert env/API PR if `/meta` treasury legs regress; **no chain rollback**.

### 4.5 Verification

- [ ] `GET /meta` treasury = P4Cap only
- [ ] Governance pool route resolves P4Cap balance leg
- [ ] Fundstack verify script PASS with legacy key for globalOps
- [ ] W3-AUDIT-001～003 closed

---

## 5. EscrowFactory V2 — deploy vs defer

### 5.1 Why V2 exists

| Item | Detail |
|------|--------|
| Policy | `registry/escrow-bilateral-mainnet-policy.v1.yaml` — **Bilateral Confirmation Settlement Model** |
| V1 limitation | `release()` @ Funded without bilateral gate — **mainnet FORBIDDEN** |
| V2 capability | `confirmServiceComplete()` traveler + guide before release |

### 5.2 W6 classification (fix “漏部署” perception)

| Network | V1 | V2 |
|---------|----|----|
| **Sepolia ②** | **ACTIVE** (legacy allowed) | **DEFER** — optional pilot broadcast |
| **Mainnet ③** | **FORBIDDEN** | **FUTURE_MAINNET_REQUIRED** |

**Matrix label:** `activation_tier: FUTURE_MAINNET_REQUIRED` · `sepolia: DEFERRED_BY_POLICY` — not a W5 defect.

### 5.3 W7 options (require explicit approval)

| Option | When | Action |
|--------|------|--------|
| **Defer Sepolia V2** | Continue ② escrow pilot on V1 | No chain tx · update matrix only |
| **Sepolia V2 pilot** | Need bilateral UX test on ② | `DeployEscrowFactoryV2.s.sol` + registry populate |
| **Mainnet V2** | ③ GO | Required before new mainnet orders |

### 5.4 Rollback

New factory address — rollback = stop routing new orders to V2 env key; existing V2 escrows complete on-chain.

---

## 6. Dual Timelock migration strategy

### 6.1 Current state

| Timelock | Address | Controls |
|----------|---------|----------|
| **V2 Governance** | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` | Governor admin · 5 proxies · P4Cap · `globalTreasury` target (55% leg) |
| **Legacy DE settlement** | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` | **Owner** of Q-F01 DE triplet at deploy |

This is **intentional for DE pilot** (deploy predates V2 clean baseline) — not a Timelock bypass of V2 governance upgrades.

### 6.2 W6 strategy (recommended)

| Phase | Action |
|-------|--------|
| **W6** | Document split in runbook · no forced merge |
| **W7 new triplet** | Deploy with **`owner = V2 Timelock`** to collapse admin for **new** addresses |
| **W7 optional** | Legacy Timelock governs **balance migration only** from old vaults |
| **W7+** | Legacy Timelock retained for historical contracts until fully drained |

### 6.3 Rollback

If new triplet uses V2 owner — rollback is registry/env pointer revert, not owner revert (governance would required to transfer ownership).

---

## 7. Runtime capability probe design

Unified probe pattern: **`eth_getCode` + selector presence** and/or **`eth_call`** smoke reads. Ops-only — UI/API continue **indexer SSOT** for balances.

### 7.1 Probe matrix

| Module | Probe ID | Pass condition | Implementation ref |
|--------|----------|----------------|-------------------|
| **Vacancy V1** | `PROBE_VACANCY_V1` | All 4 selectors in bytecode on vault + ledger | `vacancy_ledger_reconcile.rs` · `probe_vacancy_chain_capability` |
| **TTG Token** | `PROBE_TTG` | `symbol()==TTG` · `decimals()==18` · `totalSupply()==10M ether` | New W7 script (plan) |
| **Governor** | `PROBE_GOVERNOR` | `timelock()` == V2 Timelock · proxy `admin()` == V2 Timelock | cast call |
| **Treasury P4Cap** | `PROBE_TREASURY_P4CAP` | proxy admin == V2 Timelock | cast call |
| **Timelock V2** | `PROBE_TIMELOCK` | `getMinDelay()` == 48h | cast call |
| **Escrow V1 factory** | `PROBE_ESCROW_V1` | factory address code != `0x` | eth_getCode |
| **Escrow V2 factory** | `PROBE_ESCROW_V2` | optional · code != `0x` when deployed | eth_getCode |
| **FeeRouter** | `PROBE_FEE_ROUTER` | `countryBucketBps()` == 4500 | eth_call |
| **Settlement DE** | `PROBE_SETTLEMENT_DE` | `splitNetProfit` selector on ledger | selector scan |
| **Stake pool** | `PROBE_STEWARD_STAKE` | proxy admin == V2 Timelock | cast call |

### 7.2 Vacancy probe detail (existing)

| Selector | Function | Contract |
|----------|----------|----------|
| `ae607b9e` | `vacancyLedger()` | UnallocatedStewardPathVault |
| `a20b5507` | `sweepEnabled()` | UnallocatedStewardPathVault |
| `0d045440` | `vacancyState()` | CountryPoolNetProfitLedger |
| `123d1b10` | `stewardActivationEpochId()` | CountryPoolNetProfitLedger |

**Today (Q-F01):** all **FAIL** → reconcile mode `SKIPPED_PRE_V1` (correct).  
**Target (V1 runtime):** all **PASS** → live reconcile **ENABLED**.

### 7.3 W7 gate integration

Proposed aggregator: `scripts/gates/check-web3-runtime-capability-probe-gate.sh` (W7 implement) — reads `registry/runtime-activation-plan.v1.yaml` probe list.

---

## 8. Per-module upgrade strategy summary

| Module | Current → Target | Migration method | Rollback | Verification |
|--------|------------------|------------------|----------|--------------|
| Treasury env | Drift → unified keys | Config/API only | Revert PR | `/meta` + audit drift closed |
| Vacancy DE | LEGACY → ACTIVE | **Option B** new triplet + registry switch | Revert registry/env | 4-selector probe + live reconcile |
| Escrow V2 | NOT_DEPLOYED → mainnet REQUIRED | Deploy when ③ approved · Sepolia optional | Env routing | PROBE_ESCROW_V2 |
| Gov proxies | V2 impl → future impl | Timelock `upgradeTo` | Previous impl address recorded | Forge + on-chain admin check |
| Primary Market | ACTIVE | No runtime change W7 | N/A | Optional sale drill |
| Legacy treasury | LEGACY | Keep until FeeRouter migrated | N/A | globalOps == legacy address |

---

## 9. WEB3_RUNTIME_ACTIVATION_GATE (proposed)

**Gate ID:** `WEB3_RUNTIME_ACTIVATION_GATE`  
**Purpose:** Block W7 chain execution unless plan preconditions satisfied.  
**W6 status:** **DEFINED** — script not required until W7.

### 9.1 Preconditions (all required for W7 wave)

| # | Condition | Source |
|---|-----------|--------|
| 1 | W5 Master Audit complete | `WEB3_PROTOCOL_MASTER_AUDIT_GATE: WARN` accepted |
| 2 | W6 plan approved | This document + `runtime-activation-plan.v1.yaml` |
| 3 | Master Matrix convergence | `check-web3-protocol-master-matrix-gate.sh` PASS |
| 4 | Upgrade path confirmed per module | §3–§8 signed off |
| 5 | Owner / Timelock confirmed | V2 + legacy DE documented |
| 6 | Migration tested | Forge + Sepolia drill on **fork** or dry-run |
| 7 | Capability probe PASS | Target addresses only |
| 8 | Reconcile PASS | Live mode for Vacancy (not SKIPPED_PRE_V1) |

### 9.2 Gate result enum

| Result | Meaning |
|--------|---------|
| **PASS** | Approved for W7 execution wave |
| **WARN** | Partial activation (e.g. treasury config only) |
| **FAIL** | Block W7 — probe or plan gap |

### 9.3 Explicit W7 prohibitions without gate PASS

- No Vacancy registry switch
- No immutable triplet redeploy on mainnet
- No tokenomics / governance param changes

---

## 10. W6 → W7 handoff checklist

| Item | W6 (plan) | W7 (execute) |
|------|-----------|--------------|
| Treasury env spec | ✅ §4 | Config PR |
| Vacancy Option B decision | ✅ §3.2 | Deploy + switch |
| Escrow V2 tier label | ✅ §5 | Deploy if approved |
| Dual Timelock runbook | ✅ §6 | Owner on new deploy |
| Probe spec | ✅ §7 | Gate script |
| Activation gate definition | ✅ §9 | Run gate before broadcast |

---

## 11. What W6 explicitly does NOT do

- ❌ Modify Solidity  
- ❌ Broadcast deploy scripts  
- ❌ Call `upgradeTo`  
- ❌ Change registry addresses  
- ❌ Change `.env` production values  
- ❌ Alter tokenomics or governance parameters  

---

## Gate certificate

```
W6_RUNTIME_ACTIVATION_PLAN: COMPLETE
W6.5_RUNTIME_ACTIVATION_SIGNOFF: PENDING → docs/spec/governance-token/TRAVELTRUST-WEB3-RUNTIME-ACTIVATION-SIGNOFF-v1.md
WEB3_RUNTIME_ACTIVATION_GATE: NOT_RUN (preconditions defined · W7 executes)
W7_EXECUTION: BLOCKED pending plan approval + owner sign-off
```

**Owner review required:** P0 treasury spec · P1 Vacancy Option B · P2 Escrow V2 tier · dual Timelock owner on new DE deploy.

**Next step:** Complete [W6.5 Owner Sign-off Package](./TRAVELTRUST-WEB3-RUNTIME-ACTIVATION-SIGNOFF-v1.md) before any W7 chain transaction.
