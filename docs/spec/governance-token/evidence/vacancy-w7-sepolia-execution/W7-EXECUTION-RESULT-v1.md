# W7 Sepolia Vacancy V1 Runtime Activation Result

**Executed:** 20260709T060534Z UTC  
**Network:** Sepolia (11155111) · **Mainnet:** NOT touched

## Addresses (Vacancy V1 ACTIVE)

| Contract | Address |
|----------|---------|
| Ledger | 0x738D2c133d5F90c13eE9907386136471E1f330f5 |
| StewardPath | 0xaB6c15Ebcae78606E0AE5663d831E09e05af32FA |
| Unallocated | 0xb7d0Ea9579F80B2090195d49a44941d5546554E9 |
| Owner | 0x904a6c4c6aab698afbf08ec6151d317c393520cc |

## Legacy Q-F01 (LEGACY_READ_ONLY)

| Contract | Address |
|----------|---------|
| Ledger | 0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa |
| StewardPath | 0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb |
| Unallocated | 0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0 |

## Certificate

```
VACANCY_LEDGER_V1_SEPOLIA_RUNTIME_ACTIVE: PASS
PROTOCOL_LAYER: COMPLETE
DEPLOYMENT: DEPLOYED
RUNTIME: ACTIVE
INDEXER: LIVE_READY
FORK_RUNTIME_SIMULATION: PASS
SEPOLIA_RUNTIME_ACTIVATION: COMPLETE
VACANCY_RUNTIME_MIGRATION_DRYRUN_GATE: PASS
WEB3_RUNTIME_ACTIVATION_GATE: PASS
VACANCY_DEPLOYMENT_READINESS: PASS
WEB3_VACANCY_INDEXER_RECONCILE: PASS
LIVE_RECONCILE: PASS
PRODUCTION_MAINNET: NOT_STARTED
```

## Vacancy Ledger V1 · Summary status

| Axis | Status |
|------|--------|
| Protocol | **COMPLETE** |
| Deployment | **DEPLOYED** |
| Runtime (Sepolia DE) | **ACTIVE** |
| Indexer | **LIVE_READY** |
| Mainnet | **NOT_STARTED** |

## Post-activation cleanup (ops only)

See [W7 Post-Activation Cleanup Register v1](../../TRAVELTRUST-WEB3-VACANCY-W7-POST-ACTIVATION-CLEANUP-v1.md):

- **W7-CLEANUP-01** — `vacancyLedger` ABI decode (4-field struct)
- **W7-CLEANUP-02** — registry script `LEGACY_UNALLOC` undefined
- **W7-CLEANUP-03** — Windows / Git Bash evidence path handling
