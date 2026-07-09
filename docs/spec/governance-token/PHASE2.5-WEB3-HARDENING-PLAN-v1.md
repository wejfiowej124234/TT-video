# Phase②.5 Web3 Hardening Plan v1

**Plan ID:** `PHASE2_5_WEB3_HARDENING`  
**Precedes:** Phase③ Mainnet Preparation  
**Follows:** Phase② Web3 Runtime Closeout (`TT_PHASE2_WEB3_RUNTIME_READY: PASS` after PR-1)

---

## Context

Phase② Web3 Runtime is **complete**. Vacancy Ledger V1 has a full testnet maturity loop:

```
Protocol → Implementation → Invariant Tests → Sepolia Deploy
  → Capability Probe → Migration → Indexer → Live Reconcile → Transparency UI
```

**Vacancy track: PASS.** Remaining work is **configuration governance**, not protocol development.

---

## Phase② WARN semantics (frozen)

| Driver | Status | Class |
|--------|--------|-------|
| Vacancy V1 | **PASS** | Runtime ACTIVE |
| EscrowFactory V2 | **FUTURE_MAINNET_REQUIRED** | Not a Sepolia gap |
| Treasury naming (W3-AUDIT-001..003) | **RESOLVED · PR-1** | Off-chain config unified to P4Cap |

On-chain treasury sink is correct:

```
Primary Market → GOVERNANCE_TREASURY_P4CAP
```

---

## Phase②.5 workstreams

### ⓪ Full Alignment Audit v2 baseline (complete)

**Deliverables:**

| Artifact | Path |
|----------|------|
| Human audit | `docs/spec/governance-token/TRAVELTRUST-WEB3-FULL-ALIGNMENT-AUDIT-v2.md` |
| Machine matrix | `registry/web3-final-alignment-matrix.v2.yaml` |
| Drift report | `docs/spec/governance-token/WEB3_ALIGNMENT_DRIFT_REPORT-v2.md` |
| Gate | `bash scripts/gates/check-web3-full-alignment-gate.sh` |

**Baseline result:** `WEB3_FULL_ALIGNMENT_GATE: WARN` (4 HIGH · expected)

### ① Treasury drift zero-out · PR-1 (CLOSED)

**Goal:** eliminate ambiguous treasury env keys in API/runtime paths.

| Deprecated | Target |
|------------|--------|
| bare `TREASURY_ADDRESS` | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` or `LEGACY_TREASURY_ADDRESS` |
| `GOVERNANCE_TREASURY_ADDRESS` | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` |

**Scope:** `chain/mod.rs` · `governance_pool.rs` · fundstack verify · `/meta`

**Result:** ABI-001 · API-001..003 RESOLVED · all runtime gates PASS

---

### ② P2 hygiene cleanup · PR-2 (CLOSED)

**Goal:** env catalog SSOT · operator docs · legacy gate cast cleanup.

| ID | Scope | Result |
|----|-------|--------|
| DEP-001 | `registry/env-key-catalog-web3.v1.yaml` v2 + `check-web3-env-catalog-gate.sh` | RESOLVED |
| DOC-001 | `WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE.md` + master map / spine alignment | RESOLVED |
| ABI-003 | `check-vacancy-legacy-balance-audit-gate.sh` 4-tuple cast | RESOLVED |

**Deferred (by design):** ABI-002 Escrow V2 — `FUTURE_MAINNET_REQUIRED` until Phase③ mainnet wave.

**Evidence:** `docs/spec/governance-token/evidence/phase2-web3-hardening-pr2/PR2-CLOSEOUT.md`

---

### ③ Master Matrix v2 freeze (complete via PR-1 + PR-2)

**SSOT:** `registry/traveltrust-web3-protocol-master-matrix.v1.yaml` + `registry/web3-final-alignment-matrix.v2.yaml`

Treasury semantics · Vacancy V1 ACTIVE · naming cleanup COMPLETE.

---

### ④ Phase③ Mainnet Preparation (next — not started)

Only after Phase②.5 complete:

- Mainnet deploy strategy
- Contract address planning
- Proxy initialization scheme
- Mainnet RPC + gas budget
- Multisig / Timelock configuration
- Security review checklist
- Mainnet dry-run

---

## Entry / exit criteria

| Gate | Entry | Exit |
|------|-------|------|
| Phase②.5 PR-1 | `TT_PHASE2_WEB3_RUNTIME_READY: WARN` accepted | HIGH drift closed |
| Phase②.5 PR-2 | PR-1 CLOSED | P2 hygiene closed · env catalog SSOT |
| Phase②.5 complete | PR-2 CLOSED | `PHASE2_5_WEB3_HARDENING_READY: PASS` |
| Phase③ | Phase②.5 complete | Mainnet dry-run PASS |

**Do not** start mainnet deploy from Phase② WARN alone.

---

## Phase③ Entry Checklist

| # | Item | Owner | Status |
|---|------|-------|--------|
| P3-01 | **Production Entry Baseline** — freeze Web3 + public disclosure + registry + evidence | Eng | ✅ **BASELINE FROZEN** · [`PHASE3-PRODUCTION-ENTRY-BASELINE-v1.md`](./PHASE3-PRODUCTION-ENTRY-BASELINE-v1.md) |
| P3-02 | Vacancy live reconcile + baseline re-verification | Eng | ✅ **PASS** · [`P3-02-CLOSEOUT.md`](./evidence/phase3-production-entry-baseline/P3-02-CLOSEOUT.md) |
| P3-03 | Mainnet address planning doc (proxies · init · timelock) | Eng + Owner | ✅ **PASS** · [`MAINNET-ADDRESS-PLANNING-v1.md`](./MAINNET-ADDRESS-PLANNING-v1.md) |
| P3-04 | Escrow V2 ABI + deployment plan (`ABI-002` → `DEPLOYMENT_PREPARATION_READY`) | Eng | ✅ **PASS** · [`MAINNET-DEPLOYMENT-PLAN-v1.md`](./MAINNET-DEPLOYMENT-PLAN-v1.md) |
| P3-05 | Security review checklist (external audit simulation refresh) | Security | ☐ |
| P3-06 | Mainnet RPC · gas budget · multisig runbook | Ops | ☐ |
| P3-07 | Mainnet dry-run gate script scaffold | Eng | ☐ |
| P3-08 | Owner sign-off on Phase③ scope (no Sepolia regression) | Owner | ☐ |

**Prerequisite:** Phase②.5 PR-2 closeout evidence archived.
