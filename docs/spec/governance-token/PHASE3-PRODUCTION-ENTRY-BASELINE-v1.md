# Phase③ Production Entry Baseline v1

**Baseline ID:** `PHASE3_PRODUCTION_ENTRY_BASELINE_V1`  
**Entry item:** P3-01  
**Date frozen:** 2026-07-09  
**Precedes:** Phase③ mainnet preparation workstreams (P3-03..P3-08)

---

## Purpose

Freeze **what is already complete** before Phase③ expands scope. This baseline is the handoff artifact from **engineering closeout** to **production release governance**.

It closes the class of drift:

> **Runtime State ↔ Public Communication Drift**  
> (internal Web3/runtime truth vs user-facing disclosure)

---

## Phase②.5 Final Snapshot → Phase③ Entry

```
Phase② Web3 Runtime          PASS
Phase②.5 PR-1 (HIGH drift)   CLOSED
Phase②.5 PR-2 (P2 hygiene)   CLOSED
Governance Params public sync PASS
                    |
                    v
        Phase③ Production Entry Baseline (this doc)
                    |
                    v
        P3-02..P3-08 (mainnet prep — not started)
```

---

## 1 · Web3 runtime state (frozen)

| Layer | Status | Evidence |
|-------|--------|----------|
| Contract (Sepolia DE Vacancy V1) | **ACTIVE** | W7 evidence · registry |
| Indexer reconcile | **PASS** | `WEB3_VACANCY_INDEXER_RECONCILE` |
| API treasury source | **P4Cap SSOT** | PR-1 · `chain/mod.rs` |
| Registry | **SYNCED** | `protocol-convergence-deployments.v1.yaml` |
| Gates | **PASS** | PR-1 + PR-2 closeout logs |
| Deferred | ABI-002 Escrow V2 | `DEPLOYMENT_PREPARATION_READY` (P3-04 · not mainnet deployed) |

**Gate summary (2026-07-09):**

| Gate | Result |
|------|--------|
| `WEB3_FULL_ALIGNMENT_GATE` | PASS (medium=1 ABI-002 only) |
| `PHASE2_5_WEB3_HARDENING_READY` | PASS |
| `TT_PHASE2_WEB3_RUNTIME_READY` | PASS |
| `WEB3_ENV_CATALOG_GATE` | PASS |
| `VACANCY_DEPLOYMENT_READINESS` | PASS |
| `WEB3_VACANCY_INDEXER_RECONCILE` | PASS |

**Evidence root:** `docs/spec/governance-token/evidence/phase2-web3-hardening-pr2/`

---

## 2 · Public disclosure state (frozen)

| Surface | Status | Notes |
|---------|--------|-------|
| `/governance/params` | **ALIGNED** | Sepolia Runtime ACTIVE strip · no “preview/mock” |
| Global Treasury naming | **DISAMBIGUATED** | First mention: P4Cap DAO Treasury |
| Ten-country fundraise total | **DEMOTED** | Planning reference · collapsed · not hero metric |
| Escrow V2 | **UNCHANGED** | Future Mainnet Required per ABI-002 |

**Public sync closeout:** `docs/spec/governance-token/evidence/phase3-production-entry-baseline/PUBLIC-DISCLOSURE-SYNC-CLOSEOUT.md`

---

## 3 · Sepolia contract addresses (DE Vacancy V1 + GovFreeze V2 spine)

| Contract | Address | Env key |
|----------|---------|---------|
| GovernanceTreasuryP4Cap | `0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2` | `GOVERNANCE_TREASURY_P4CAP_ADDRESS` |
| Legacy GovernanceTreasury | `0x6a8323fb2394A1e9655F7132F4E4B8222d2898be` | `LEGACY_TREASURY_ADDRESS` |
| GovernanceTimelock (V2) | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` | `TIMELOCK_ADDRESS` |
| TravelTrustGovernor | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` | `GOVERNOR_ADDRESS` |
| CountryPoolNetProfitLedger (V1 DE) | `0x738D2c133d5F90c13eE9907386136471E1f330f5` | `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` |
| StewardPathVault (V1 DE) | `0xaB6c15Ebcae78606E0AE5663d831E09e05af32FA` | `COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS` |
| UnallocatedStewardPathVault (V1 DE) | `0xb7d0Ea9579F80B2090195d49a44941d5546554E9` | `UNALLOCATED_STEWARD_PATH_VAULT_ADDRESS` |

**Machine SSOT:** `registry/phase3-production-entry-baseline.v1.yaml`

---

## 4 · Registry & env catalog (frozen)

| Artifact | Version / status |
|----------|------------------|
| `registry/web3-final-alignment-matrix.v2.yaml` | PR-1 + PR-2 RESOLVED |
| `registry/env-key-catalog-web3.v1.yaml` | v2 · two-key treasury |
| `registry/traveltrust-web3-protocol-master-matrix.v1.yaml` | naming cleanup COMPLETE |
| `registry/protocol-convergence-deployments.v1.yaml` | GovFreeze V2 + Vacancy V1 ACTIVE |

---

## 5 · Owner review (P3-01)

| # | Confirmation | Owner | Status |
|---|--------------|-------|--------|
| O-01 | Phase②.5 evidence reviewed (PR-1 + PR-2 gate logs) | Owner | ☐ |
| O-02 | Public `/governance/params` reflects Sepolia ACTIVE (not preview) | Owner | ☐ |
| O-03 | Escrow V2 remains deferred to mainnet wave (no false “ready”) | Owner | ☐ |
| O-04 | Approve Phase③ scope entry (P3-02..P3-08) without Sepolia regression | Owner | ☐ |

**Sign-off blocks W7-style mainnet broadcast — not Sepolia ops.**

---

## 6 · P3-01 exit criteria

P3-01 is **COMPLETE** when:

1. This baseline doc + machine YAML exist and match gate evidence dates.
2. Owner marks O-01..O-04 (or documents exceptions).
3. No open **HIGH** alignment drift; ABI-002 explicitly deferred.

**Next:** P3-02 — confirm Vacancy V1 Sepolia runtime + live reconcile (operational re-run, not feature work).

---

## P3-02 closeout (2026-07-09)

**Verdict:** `VACANCY_PRODUCTION_ENTRY_RECONCILE: PASS`

All acceptance gates re-run against frozen baseline. Evidence: `docs/spec/governance-token/evidence/phase3-production-entry-baseline/P3-02-CLOSEOUT.md`

**Next:** P3-04 Escrow V2 mainnet prep.

---

## P3-03 closeout (2026-07-09)

**Verdict:** `MAINNET_ADDRESS_PLANNING_READY: PASS`

Mainnet address planning SSOT established — all deploy slots `TBD` until broadcast. Evidence: `docs/spec/governance-token/evidence/phase3-production-entry-baseline/P3-03-MAINNET-ADDRESS-PLANNING-CLOSEOUT.md`

**Next:** P3-05 Security review refresh.

---

## P3-04 closeout (2026-07-09)

**Verdict:** `MAINNET_DEPLOYMENT_PLAN_READY: PASS`

Deployment execution plan established · ABI-002 `DEPLOYMENT_PREPARATION_READY`. Evidence: `docs/spec/governance-token/evidence/phase3-production-entry-baseline/P3-04-DEPLOYMENT-PLAN-CLOSEOUT.md`

**Next:** P3-05 Security review refresh.

---

## Related

- Phase②.5 plan: `docs/spec/governance-token/PHASE2.5-WEB3-HARDENING-PLAN-v1.md`
- Drift report: `docs/spec/governance-token/WEB3_ALIGNMENT_DRIFT_REPORT-v2.md`
- Operator guide: `docs/runbook/WEB3-TREASURY-ENV-KEYS-OPERATOR-GUIDE.md`
