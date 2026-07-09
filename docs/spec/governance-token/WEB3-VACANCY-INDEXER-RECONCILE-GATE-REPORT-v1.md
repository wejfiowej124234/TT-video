# WEB3 Vacancy Indexer Reconcile Gate Report v1

**Generated:** 2026-07-09T14:18:06Z
**Gate:** `bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh`
**Result:** `WEB3_VACANCY_INDEXER_RECONCILE: PASS`

## W3 scope

| Track | Scope | Status |
|-------|-------|--------|
| **W3a** | Reconciliation gate · `vacancyLedger()` + ledger views vs projection | ✅ |
| **W3b** | Six Vacancy events → projection (no reserve recompute) | ✅ |
| **W4** | Dashboard read-only | ⏸ not in W3 |

## W3b · Event → Projection

Rust lib tests (`cargo test -p traveltrust-api --lib`):

- `VacancyEntered`
- `GraceStarted`
- `SweepExecuted`
- `ReserveReached`
- `StewardActivated`
- `JurisdictionReserveDisbursed`
- Drift rejection (`compare_projection_rejects_reserve_recompute_drift`)
- Six-event sequence reconcile (`six_event_sequence_projection_matches_chain_view`)

## W3a · Reconciliation Gate

**Discipline:** Indexer consumes chain events + views only. **Never** `reserve = principal - swept - disbursed`.

| Check | Module | Result |
|-------|--------|--------|
| Compare projection ↔ chain view | `vacancy_ledger_reconcile.rs` | ✅ |
| Capability probe (`PRE_VACANCY_V1_BYTECODE`) | `probe_vacancy_chain_capability` | ✅ |
| Protocol bytecode `vacancyLedger()` SSOT | `VacancyLedgerCore` (Forge) | ✅ |

## DE Sepolia live boundary

| Field | Value |
|-------|-------|
| UnallocatedStewardPathVault | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` |
| CountryPoolNetProfitLedger | `0x738D2c133d5F90c13eE9907386136471E1f330f5` |
| Vault codehash | `0x48774c1c47707f31698ea1837c3778eeadedfe96819ddc4d6627c8ecf9626670` |
| Ledger codehash | `0x5f8050acd36cbc556dd8bccd4d5d5ff81fd8c3325262915cc73edb986828f092` |
| `vacancyLedger()` selector | true |
| `sweepEnabled()` selector | true |
| `vacancyState()` selector | true |
| `stewardActivationEpochId()` selector | true |
| Live reconcile mode | **LIVE_V1** |

## W4 precondition

See `VACANCY_DEPLOYMENT_READINESS` · `registry/vacancy-v1-runtime-deployment-status.v1.yaml`.

## Checks passed: 5
