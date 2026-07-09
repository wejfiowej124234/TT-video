# Web3 Protocol-Grade Audit Framework v1

**Status:** Machine SSOT + audit runner (**16 dimensions**)  
**Registry:** `registry/web3-protocol-grade-audit-framework.v1.yaml`  
**Runners:**
- `node scripts/dev/run-web3-protocol-grade-audit.cjs`
- `node scripts/dev/run-escrow-settlement-authorization-audit.cjs`  
**Evidence:** `evidence/GO_production_readiness/web3-protocol-grade-audit/`

## Purpose

This framework extends deployment checklists into a **protocol-grade** audit: it traces **every dollar**, **every role state**, **every pool**, **every permission**, and **every upgrade path** with cross-validation against contract source, Registry, Master Map, runtime, deploy scripts, and evidence.

**Principle:** Never assume design correct. Ambiguity = Blocker until evidenced.

## 16 Dimensions

| ID | Dimension | Primary deliverable |
|----|-----------|---------------------|
| D01 | Contract Security | Security audit + forge posture |
| D02 | Upgradeability | G24 proxy gate |
| D03 | Storage Layout | Proxy bootstrap tests |
| D04 | Governance | Cert lifecycle + Governor/Timelock |
| D05 | Treasury | Treasury spend + P4 cap |
| D06 | **Fund Lifecycle** | `FUND-LIFECYCLE-AUDIT-LATEST.md` |
| D07 | Business Logic | D-4555-A/B + Escrow settlement model |
| D08 | **Economic Model** | Supply invariants + CountryPool + Primary Market econ |
| D09 | **Role State Machine** | `ROLE-STATE-MACHINE-AUDIT-LATEST.md` |
| D10 | **Permission Matrix** | On-chain tree + API RBAC |
| D11 | **Attack Surface** | `ATTACK-SURFACE-MATRIX-LATEST.md` |
| D12 | **Deployment Drill** | 12-step mainnet full drill |
| D13 | Operations / Monitoring | Indexer + admin observability |
| D14 | Incident & DR | GORP + Cert DR |
| D15 | **Responsibility Matrix** | Product/Security/Contract/Backend/Finance/Ops |
| **D16** | **Protocol Intent Verification** | `PROTOCOL-INTENT-VERIFICATION-LATEST.md` — **Why**, not just what |

**Escrow settlement (determined model):** Bilateral Confirmation Settlement Model — see `evidence/GO_production_readiness/escrow-settlement-authorization/`

**CountryPool (next deep focus):** `COUNTRY-POOL-AUDIT-LATEST.md` · D-4555-B

**Primary Market:** UI DEFER · economic pre-audit `PRIMARY-MARKET-ECONOMIC-AUDIT-LATEST.md`

Cross-cutting: **Protocol Lifecycle** (Design → Archive per module) in `PROTOCOL-LIFECYCLE-AUDIT-LATEST.md`.

## Fund Lifecycle (primary USDC path)

```text
Traveler USDC → Escrow.deposit → Escrow.release → platformFeeRecipient
    → FeeRouter.distribute → RegionVault (D-4555-A)
Parallel: CountryPoolNetProfitLedger (D-4555-B) → StewardPath → claim → Wallet
Governance: Treasury.spendP4Reserve → recipient (Cert #8)
```

Each step in the YAML registry records: **caller allowed/denied**, **responsible roles**, **rollback**, **pause**, **deadlock risk**, **source_ref**.

## Relationship to other audits

| Audit | Scope |
|-------|-------|
| Payment Rail (G3-02) | M25 Escrow subset — necessary not sufficient |
| Web3 System Deep Audit | M01–M25 Sepolia production |
| Mainnet Readiness Audit | chain_id=1 cutover gates |
| **Protocol-Grade Audit** | Full lifecycle + economics + roles + attack surface |

Mainnet PASS requires **both** Mainnet Readiness PASS **and** Protocol-Grade IN_PROGRESS→PASS (zero P0, P1 closed for cutover).

## Run

```bash
node scripts/dev/run-web3-protocol-grade-audit.cjs
node scripts/dev/run-web3-mainnet-production-readiness-audit.cjs
```

## Change control

Update `registry/web3-protocol-grade-audit-framework.v1.yaml` first, then re-run audit. Do **not** edit business contracts from audit findings without governance/Owner path.
