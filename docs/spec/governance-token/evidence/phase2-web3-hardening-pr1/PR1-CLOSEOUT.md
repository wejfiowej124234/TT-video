# Phase②.5 Web3 Hardening · PR-1 Closeout

**PR ID:** `PHASE2_5_WEB3_HARDENING_PR1`  
**Date:** 2026-07-09  
**Scope:** HIGH drift only — no contract, economics, or on-chain state changes.

---

## Resolved drift items

| ID | Fix |
|----|-----|
| **ABI-001** | Re-exported `contracts/abi/UnallocatedStewardPathVault.json` from Vacancy V1 Forge artifact (`vacancyLedger` 4-field, `sweepEnabled`, `vacancyState`, `stewardActivationEpochId`) |
| **API-001** | `crates/api/src/chain/mod.rs` — treasury source unified to `GOVERNANCE_TREASURY_P4CAP_ADDRESS` → `TREASURY_P4_CAP_ADDRESS`; removed `REGION_VAULT_ADDRESS` / `TREASURY_ADDRESS` fallbacks |
| **API-002** | `governance_pool.rs` / `pool_chain.rs` — use `ChainConfig.treasury_address` (P4Cap) instead of `GOVERNANCE_TREASURY_ADDRESS` |
| **API-003** | `phase2-sepolia-fundstack-verify-bindings.sh` — explicit `GOVERNANCE_TREASURY_P4CAP_ADDRESS` vs `LEGACY_TREASURY_ADDRESS` |

---

## Gate results (2026-07-09)

| Gate | Result |
|------|--------|
| `WEB3_FULL_ALIGNMENT_GATE` | **PASS** |
| `PHASE2_5_WEB3_HARDENING_READY` | **PASS** |
| `TT_PHASE2_WEB3_RUNTIME_READY` | **PASS** |
| Web3 Master Matrix gate | **PASS** |
| `VACANCY_DEPLOYMENT_READINESS` | **PASS** |
| `WEB3_VACANCY_INDEXER_RECONCILE` | **PASS** (live reconcile OK) |

**Remaining non-blocking findings:** ABI-002 (Escrow V2 · FUTURE_MAINNET_REQUIRED), ABI-003 (legacy 5-tuple cast · LOW).

---

## Evidence logs

| Artifact | Path |
|----------|------|
| Full alignment | `gate-full-alignment.log` |
| Master matrix | `gate-master-matrix.log` |
| Vacancy deployment readiness | `gate-vacancy-deployment-readiness.log` |
| Indexer reconcile | `gate-vacancy-indexer-reconcile.log` |
| Phase② runtime alignment | `gate-phase2-runtime-alignment.log` |

---

## Sepolia DE Vacancy V1 (unchanged)

| Contract | Address |
|----------|---------|
| CountryPoolNetProfitLedger | `0x738D2c133d5F90c13eE9907386136471E1f330f5` |
| StewardPathVault | `0xaB6c15Ebcae78606E0AE5663d831E09e05af32FA` |
| UnallocatedStewardPathVault | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` |
