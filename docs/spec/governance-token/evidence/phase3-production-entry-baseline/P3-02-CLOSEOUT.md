# P3-02 Production Entry Evidence Closeout

**Item:** P3-02 · Vacancy live reconcile + baseline re-verification  
**Date:** 2026-07-09  
**Verdict:** `VACANCY_PRODUCTION_ENTRY_RECONCILE: PASS`

---

## Purpose

Prove the **P3-01 frozen baseline** remains verifiable in the current runtime environment — acceptance evidence, not reopening Phase②.5.

```
Phase②.5 evidence (frozen)
        ↓
P3-02 acceptance re-run
        ↓
Phase③ entry evidence archive
```

---

## Gate results

| Gate | Result |
|------|--------|
| `WEB3_ENV_CATALOG_GATE` | **PASS** |
| `WEB3_VACANCY_INDEXER_RECONCILE` | **PASS** (live reconcile · RPC retry) |
| `WEB3_FULL_ALIGNMENT_GATE` | **PASS** |
| `PHASE2_5_WEB3_HARDENING_READY` | **PASS** |
| `TT_PHASE2_WEB3_RUNTIME_READY` | **PASS** |

**Deferred (unchanged):** ABI-002 Escrow V2 · `FUTURE_MAINNET_REQUIRED`

---

## Live reconcile summary

| Field | Value |
|-------|-------|
| Chain ID | 11155111 (Sepolia) |
| Latest block | 11235127 |
| RPC (evidence) | `https://sepolia.drpc.org` |
| Vault | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` |
| Ledger | `0x738D2c133d5F90c13eE9907386136471E1f330f5` |
| `vacancyLedger()` 4-tuple | `(0, 0, 0, 0)` |
| Live reconcile | **PASS** · projection mismatch = 0 |
| RPC retries | 5 warnings (transient TLS/RPC · gate recovered) |

**Note:** `publicnode` TLS handshake failed during evidence capture; gates retried and passed via alternate RPC. Operational env should prefer stable RPC for production entry runs.

---

## Registry / env catalog parity

| Source | Status |
|--------|--------|
| `registry/phase3-production-entry-baseline.v1.yaml` vs phase2 env | **7/7 match** |
| `registry/env-key-catalog-web3.v1.yaml` (v2) vs env | **P4Cap + Legacy + Vacancy V1 match** |

Catalog file path: `registry/env-key-catalog-web3.v1.yaml` (schema version 2 — not a separate `.v2.yaml` file).

---

## Evidence files

| Artifact | Path |
|----------|------|
| Machine reconcile | `P3-02-VACANCY-RECONCILE.json` |
| Gate aggregate log | `P3-02-GATE-RESULT.log` |
| Vacancy indexer gate | `P3-02-vacancy-indexer-reconcile.log` |
| Env catalog gate | `P3-02-env-catalog.log` |

---

## Program status after P3-02

| Item | Status |
|------|--------|
| Phase① | CLOSED |
| Phase② | CLOSED |
| Phase②.5 | CLOSED |
| P3-01 Baseline | FROZEN |
| **P3-02 Runtime Evidence** | **PASS** |
| P3-03 Mainnet Planning | **PASS** |

**Next:** P3-04 Escrow V2 mainnet prep (no contract/tokenomics/UI changes without Change Request → Baseline Update).
