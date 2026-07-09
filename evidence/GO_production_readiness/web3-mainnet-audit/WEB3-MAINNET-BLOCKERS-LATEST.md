# Web3 Mainnet Production Readiness — Blockers

**Recorded:** 2026-07-08T14:02:57.753Z
**Verdict:** `WEB3_MAINNET_PRODUCTION_BLOCKED`
**Principle:** Cross-validation only — no design assumed correct.

| Priority | Count |
|----------|-------|
| P0 | 5 |
| P1 | 6 |
| P2 | 0 |

## P0

### MN-P0-001 — PRODUCTION_SCOPE_MAINNET not selected — mainnet cutover unauthorized

- **Domain:** Scope
- **Risk:** CRITICAL
- **Fix:** Complete PI3-005-M program + Owner signoff before mainnet Web3 audit can pass
- **Paths:** docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md, registry/web3-mainnet-production-readiness-gate.v1.yaml

### MN-P0-002 — No mainnet address registry slot in protocol-convergence-deployments (GAP-99-07)

- **Domain:** Registry
- **Risk:** CRITICAL
- **Fix:** Add environments.mainnet with chain_id=1 addresses after controlled mainnet broadcast
- **Paths:** registry/protocol-convergence-deployments.v1.yaml, docs/spec/99-链上合约与池子总览.md §13

### MN-P0-006 — R-01 third-party contract audit OPEN (GAP-99-01)

- **Domain:** External audit
- **Risk:** CRITICAL
- **Fix:** Close R-01 before mainnet deploy
- **Paths:** docs/spec/99-链上合约与池子总览.md §13

### MN-P0-007 — Mainnet Shadow Launch evidence not GO

- **Domain:** TT-MAINNET SL
- **Risk:** CRITICAL
- **Fix:** Complete shadow launch per TT-MAINNET §7
- **Paths:** evidence/mainnet_shadow_launch/README.md

### MN-P0-008 — G6 no-rollback acknowledgment not evidenced

- **Domain:** TT-MAINNET G6
- **Risk:** HIGH
- **Fix:** Record G6 team signoff before mainnet
- **Paths:** evidence/mainnet_launch_gate/G6_no_rollback_ack.md

## P1

### MN-P1-002 — D-4555-A/B dual-track not fully documented in SSOT cross-check

- **Domain:** Business Logic
- **Risk:** HIGH
- **Fix:** Complete ops/finance training docs before mainnet
- **Paths:** docs/spec/governance-token/fund-flow-ssot.v1.md, docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md

### MN-P1-003 — Sepolia Web3 system audit P1=1 (Cert/RBAC/etc.)

- **Domain:** Sepolia prerequisite
- **Risk:** HIGH
- **Fix:** Close Sepolia P1 before mainnet scope expansion
- **Paths:** evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-BLOCKERS-LATEST.md

### MN-P1-004 — TTG Cert 7/12 — mainnet governance lifecycle replay not started

- **Domain:** Governance lifecycle
- **Risk:** HIGH
- **Fix:** Complete Cert #8–12 on Sepolia then plan mainnet replay
- **Paths:** registry/ttg-governance-cert-gates.v1.yaml, evidence/GO_ttg_cert/

### MN-P1-006 — CountryPool full Snapshot/Claim/Payout not production-wide (GAP-99-03)

- **Domain:** Business Logic
- **Risk:** HIGH
- **Fix:** Complete Wave 2 before mainnet steward payouts at scale
- **Paths:** docs/spec/99-链上合约与池子总览.md §13

### MN-P1-007 — Mainnet deployment env matrix not populated (addresses, RPC, USDC)

- **Domain:** Deploy/Env
- **Risk:** HIGH
- **Fix:** Create mainnet env template + dual-control broadcast runbook
- **Paths:** deploy/fly/, registry/protocol-convergence-deployments.v1.yaml

### MN-P1-008 — Protocol-grade audit P1=3

- **Domain:** Protocol-Grade
- **Risk:** HIGH
- **Fix:** Close fund lifecycle / drill / cert blockers before mainnet
- **Paths:** evidence/GO_production_readiness/web3-protocol-grade-audit/PROTOCOL-GRADE-BLOCKERS-LATEST.md

