# Phase② Web3 Runtime Closeout Report v1

**Generated:** 2026-07-09T08:14:59Z
**Gate:** `bash scripts/gates/check-phase2-web3-runtime-alignment-gate.sh`
**Verdict:** `TT_PHASE2_WEB3_RUNTIME_READY: PASS`

## Why WARN (not Vacancy)

**Vacancy Ledger V1 track: PASS** — full testnet maturity loop complete.

Phase② `TT_PHASE2_WEB3_RUNTIME_READY: WARN` is driven **only** by off-chain treasury naming drift:

| ID | Class | On-chain funds safe? |
|----|-------|----------------------|
| W3-AUDIT-001 | API treasury fallback | Yes |
| W3-AUDIT-002 | `GOVERNANCE_TREASURY_ADDRESS` alias | Yes |
| W3-AUDIT-003 | verify script legacy keys | Yes |

**Excluded from WARN:** EscrowFactory V2 = `FUTURE_MAINNET_REQUIRED` (Escrow V1 ACTIVE on Sepolia).

## TravelTrust Web3 Runtime Status (Sepolia)

| Domain | Status |
|--------|--------|
| Token | Protocol COMPLETE · Deployment VERIFIED · Runtime ACTIVE |
| Governance | Governor V2 COMPLETE · Timelock ACTIVE · Proxy upgrade READY |
| Treasury | Runtime ACTIVE · **Naming cleanup REQUIRED** (P1) |
| Settlement | Country Pool ACTIVE · **Vacancy ACTIVE** · Mainnet migration pending |
| Escrow | V1 ACTIVE · V2 **FUTURE_MAINNET_REQUIRED** |
| Indexer | **LIVE_READY** |
| Dashboard | Transparency **READY** |

## Vacancy Ledger V1 status

| Axis | Status |
|------|--------|
| Protocol | **COMPLETE** |
| Deployment | **DEPLOYED** |
| Runtime (Sepolia DE) | **ACTIVE** |
| Indexer | **LIVE_READY** |
| Mainnet | **NOT_STARTED** |

## Milestone certificate

```
VACANCY_LEDGER_V1_SEPOLIA_RUNTIME_ACTIVE: PASS
VACANCY_DEPLOYMENT_READINESS: PASS
WEB3_VACANCY_INDEXER_RECONCILE: PASS
LIVE_RECONCILE_MODE: LIVE_V1
TT_PHASE2_WEB3_RUNTIME_READY: PASS
PHASE3_MAINNET_PREPARATION: NOT_STARTED
```

## Sepolia DE Vacancy V1 (active runtime)

| Contract | Address |
|----------|---------|
| Ledger | `0x738D2c133d5F90c13eE9907386136471E1f330f5` |
| Unallocated | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` |

## W7 post-activation cleanup

| ID | Status |
|----|--------|
| W7-CLEANUP-01 vacancyLedger ABI (4-field) | **FIXED** |
| W7-CLEANUP-02 registry LEGACY_UNALLOC | **FIXED** |
| W7-CLEANUP-03 Windows evidence paths | **FIXED** |

Register: `docs/spec/governance-token/TRAVELTRUST-WEB3-VACANCY-W7-POST-ACTIVATION-CLEANUP-v1.md`

## Gates executed

| Gate | Result |
|------|--------|
| WEB3 Protocol Master Matrix | PASS |
| VACANCY_DEPLOYMENT_READINESS | PASS |
| WEB3_VACANCY_INDEXER_RECONCILE | PASS |
| Sepolia DE runtime probe | **ACTIVE** |

## WARN items (non-blocking for Phase② closeout)

_None — full PASS._

## Next: Phase②.5 Web3 Hardening (before Phase③)

1. Treasury drift zero-out → unified `GOVERNANCE_TREASURY_P4CAP_ADDRESS` + `LEGACY_TREASURY_ADDRESS`
2. Master Matrix v2 freeze (`WEB3_PROTOCOL_MASTER_MATRIX_v2`)
3. Phase③ Mainnet Preparation (deploy strategy · proxy init · dry-run)

