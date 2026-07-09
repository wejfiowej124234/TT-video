# W7 Post-Activation Cleanup Register v1

**Scope:** Ops / orchestrator / gate ergonomics only — **no protocol, economics, or contract changes.**  
**Context:** W7 Sepolia Vacancy V1 runtime activation **COMPLETE** (2026-07-09).  
**Evidence:** `docs/spec/governance-token/evidence/vacancy-w7-sepolia-execution/`

---

## Cleanup items

| ID | Title | Symptom | Workaround used at W7 | Fix target |
|----|-------|---------|----------------------|------------|
| W7-CLEANUP-01 | `vacancyLedger` ABI decode — 4-field struct | **FIXED** | `probe_v1` uses `(uint256,uint256,uint256,uint256)` |
| W7-CLEANUP-02 | Registry update script — `LEGACY_UNALLOC` undefined | **FIXED** | Bash `"$LEGACY_UNALLOC"` expansion in `update_registry` |
| W7-CLEANUP-03 | Windows / Git Bash evidence path handling | **FIXED** | `W7_ROOT` / `W7_OUT_JSON` / `W7_DEPLOY_JSON` env paths |

---

## Verification note (gate env)

For **live reconcile** to run inside `check-web3-vacancy-indexer-reconcile-gate.sh`, export before the gate:

```bash
export VACANCY_RECONCILE_LIVE=1
export CHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com   # stable read RPC at W7 closeout
export UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS=0xb7d0Ea9579F80B2090195d49a44941d5546554E9
export COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS=0x738D2c133d5F90c13eE9907386136471E1f330f5
```

`scripts/dev/.env.phase2-chain-deploy.local` now carries Vacancy V1 addresses + `VACANCY_RECONCILE_LIVE=1`.  
Gate subprocess may still require explicit shell exports on Windows until CLEANUP-03 / gate ordering is fixed.

---

## Status

| Item | Priority | Status |
|------|----------|--------|
| W7-CLEANUP-01 | P2 · ops | **FIXED** |
| W7-CLEANUP-02 | P2 · ops | **FIXED** |
| W7-CLEANUP-03 | P2 · ops | **FIXED** |

**Do not reopen:** W7 deploy / migrate / registry execution. Cleanup is tooling-only.
