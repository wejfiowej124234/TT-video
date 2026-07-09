# Vacancy V1 Runtime Deployment Status v1

**Generated:** 2026-07-09T14:18:09Z
**Gate:** `bash scripts/gates/check-vacancy-deployment-readiness-gate.sh`
**Result:** `VACANCY_DEPLOYMENT_READINESS: PASS`
**SSOT:** `registry/vacancy-v1-runtime-deployment-status.v1.yaml`

## Readiness matrix

| Layer | Status | Gate / proof |
|-------|--------|--------------|
| Protocol implementation | **PASS** | `VACANCY_LEDGER_V1_PROTOCOL_COMPLETE` |
| Local Forge tests | **PASS** | VacancyLedgerCore · S3* · invariant |
| Indexer (S4a / W3) | **PASS** | `WEB3_VACANCY_INDEXER_RECONCILE` |
| Sepolia DE Vacancy V1 runtime | **ACTIVE** | capability probe · `SKIPPED_PRE_V1` when pending |
| Production Vacancy V1 runtime | **PENDING** | registry record |

## Protocol ≠ Runtime

```
Registry / local protocol (Vacancy V1 COMPLETE)
        ↓
   Indexer + Forge PASS
        ↓
Sepolia DE stack (Q-F01 legacy bytecode)  ← runtime PENDING
        ↓
Future: Vacancy V1 deploy / upgrade → probe ACTIVE → live reconcile
```

**Do not infer:** "protocol complete" ⇒ "chain upgraded".

## Sepolia DE probe (latest)

| Field | Value |
|-------|-------|
| UnallocatedStewardPathVault | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` |
| CountryPoolNetProfitLedger | `0x738D2c133d5F90c13eE9907386136471E1f330f5` |
| `vacancyLedger()` | true |
| `sweepEnabled()` | true |
| `vacancyState()` | true |
| `stewardActivationEpochId()` | true |
| Runtime status | **ACTIVE** |

## W4 precondition

Governance read-only (`/governance/vacancy-ledger`) **may proceed** while Sepolia runtime is PENDING.
UI **must** surface runtime status and **must not** recompute reserve or read contracts directly.

## Checks passed: 4
