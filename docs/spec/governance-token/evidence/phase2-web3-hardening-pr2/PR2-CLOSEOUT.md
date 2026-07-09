# Phase②.5 Web3 Hardening · PR-2 Closeout

**PR ID:** `PHASE2_5_WEB3_HARDENING_PR2`  
**Date:** 2026-07-09  
**Scope:** P2 hygiene — DEP-001 · DOC-001 · ABI-003. No contract, economics, or on-chain state changes.

**Follows:** PR-1 (HIGH drift closed)

---

## Resolved drift items

| ID | Fix |
|----|-----|
| **DEP-001** | `registry/env-key-catalog-web3.v1.yaml` v2 — two-key treasury model, deprecated keys cataloged, Vacancy V1 Sepolia addresses; new gate `scripts/gates/check-web3-env-catalog-gate.sh` |
| **DOC-001** | New `docs/runbook/WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE.md`; `WEB3-SYSTEM-MASTER-MAP-V1.md` P4Cap + legacy rows; spine summary migration note |
| **ABI-003** | `check-vacancy-legacy-balance-audit-gate.sh` — 4-tuple `vacancyLedger()` cast (Vacancy V1 ABI) |

**Deferred (by design):** ABI-002 Escrow V2 — `FUTURE_MAINNET_REQUIRED` · Phase③ mainnet wave.

---

## Supporting changes

- Removed `TREASURY_ADDRESS` from `anvil-local-env-lib.sh` supersede list
- Phase2 env: removed commented bare `TREASURY_ADDRESS` alias; catalog SSOT pointer
- Full alignment gate: env catalog prerequisite; DOC-001 scan for master map
- Master matrix: `GOVERNANCE_TREASURY_ADDRESS` cataloged deprecated (PR-2)

---

## Gate results (2026-07-09)

| Gate | Result | Notes |
|------|--------|-------|
| `WEB3_ENV_CATALOG_GATE` | **PASS** | DEP-001 |
| `WEB3_FULL_ALIGNMENT_GATE` | **PASS** | medium=1 (ABI-002 only) · low=0 |
| `PHASE2_5_WEB3_HARDENING_READY` | **PASS** | |
| `TT_PHASE2_WEB3_RUNTIME_READY` | **PASS** | |
| Web3 Master Matrix gate | **PASS** | |
| `WEB3_VACANCY_INDEXER_RECONCILE` | **PASS** | live reconcile OK (RPC retry) |

---

## Evidence logs

| Artifact | Path |
|----------|------|
| Env catalog | `gate-env-catalog.log` |
| Full alignment | `gate-full-alignment.log` |
| Master matrix | `gate-master-matrix.log` |
| Indexer reconcile | `gate-vacancy-indexer-reconcile.log` |
| Phase② runtime alignment | `gate-phase2-runtime-alignment.log` |

---

## Phase②.5 status

| Milestone | Status |
|-----------|--------|
| PR-1 HIGH drift | **CLOSED** |
| PR-2 P2 hygiene | **CLOSED** |
| Phase②.5 complete | **YES** — ready for Phase③ Entry Checklist |

**Next:** Phase③ Entry Checklist in `docs/spec/governance-token/PHASE2.5-WEB3-HARDENING-PLAN-v1.md`
