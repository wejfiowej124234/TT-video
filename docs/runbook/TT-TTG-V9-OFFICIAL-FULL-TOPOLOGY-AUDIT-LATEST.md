# TT · TTG V9 Official Full Contract Topology Audit


> **ACTIVE V9 documentation pointer:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER`.  
> Any R2_FINAL / Remint / sale→P4Cap / globalStakers / Safe-as-V9-admin narrative below = **LEGACY / SUPERSEDED / DO_NOT_USE_AS_ACTIVE_TRUTH** (historical contrast only).

**STATUS:** `SUPERSEDED_AS_ACTIVE_TOPOLOGY_MATRIX` · living topology = Design Lock (NEW Timelock/Pool/FeeRouter/RoleStake) · KEEP EF/SR retarget only

**Historical STATUS:** `MATRIX_ACTIVE` · required for stamp `V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS`  
**Parent:** [Security Audit Ladder](TT-TTG-V9-SECURITY-AUDIT-LADDER-LATEST.md)  
**Not:** Production GO · USDC source audit · full V8 source re-audit  

---

## Pass definition

```text
V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS
  = NEW deep audit PASS (Token · Governor · Vault · Batch PM · UUPS · AtomicDeployer)
  + KEEP Reality + Integration + Privilege re-review PASS
  + Call-chain wiring PASS
  + Existing Money Path coherence PASS (no conflicting privilege)
  + V8 Legacy isolation PASS
  + Mainnet config gates PASS (Exact Match · KEEP Timelock · production Governor params · Norm ops)
  + OPEN_CRITICAL=0 · OPEN_HIGH=0 on the frozen candidate
```

---

## Topology matrix

| # | System | Class | Audit mode | Gate |
|---|--------|-------|------------|------|
| T1 | TTG V9 Token | NEW | Source deep | Audit #1–#3 |
| T2 | Governor V9 | NEW | Source deep + **production constructor params** | Audit #1–#3 · A3-OPEN-01 |
| T3 | PublicSaleVault V9 | NEW/UUPS | Source deep | Audit #1–#3 |
| T4 | Batch Primary Market V9 | NEW/UUPS | Source deep | Audit #1–#3 |
| K1 | Governance Timelock | KEEP | Reality + Integration + Privilege | Exact address · delay · `governor()` · allow-list |
| K2 | P4Cap / USDC Treasury | KEEP | Reality + Integration + Privilege | PM `usdcTreasury` == KEEP P4Cap |
| K3 | EscrowFactoryV2Wired | KEEP | Integration / privilege | No V9 sale privilege conflict |
| K4 | SettlementRouter | KEEP | Integration / privilege | Money Path intact |
| K5 | FeeRouter | KEEP | Integration / privilege | Money Path intact |
| K6 | Safe / Guardian | KEEP | Privilege topology | Guardian ≠ Timelock escalation |
| E1 | USDC | External | Interface / decimals / transfer assumptions only | 6 dp · no hookable Official USDC assumption |
| L1 | V8 TTG + OLD PM | LEGACY | **Isolation only** | Official paths must not cite V8 |

---

## Call-chain matrix (must PASS)

| ID | Chain | Pass criterion |
|----|-------|----------------|
| C1 | User USDC → Batch PM → P4Cap | Sink == KEEP P4Cap · decimals 6 · min purchase |
| C2 | PublicSaleVault → Batch PM → User TTG | `onlyMarket` pull · RETURN to Vault · no EOA bridge |
| C3 | TTG → GovernorV9 → Vote → Timelock → burn | Snapshot/quorum · delay enforced · Vault/DAO burn paths |
| C4 | Timelock → UUPS Proxy → Impl | Timelock-only upgrade · inventory preserved |
| C5 | Escrow → Settlement → FeeRouter | KEEP Money Path unchanged / non-conflicting |
| C6 | V8 isolation | www · `/meta` · Indexer · Governor · PM · wallet metadata ≠ V8 Official |

---

## External firm (optional)

| When | After AI Audit #3 + Regression #2 + frozen manifest |
| What | Same Exact Candidate bytes (NEW + wiring checklist for KEEP) |
| After firm | If code changes → **diff audit** + regression + **new freeze** — old firm report **void** for Mainnet claim |

---

## Current roll-up (honest)

| Gate | Status |
|------|--------|
| NEW deep (AI #1–#3) | ✅ R2_FINAL |
| Regression #2 | ✅ `V9_SEPOLIA_REGRESSION2_PASS` · **binds R2_FINAL** |
| KEEP Timelock / P4Cap cited | ✅ |
| Money Path KEEP cited | ✅ |
| Call-chains C1–C6 | ✅ |
| V8 Legacy isolation | ✅ |
| OPEN_C/H | **0** |
| `V9_OFFICIAL_FULL_CONTRACT_TOPOLOGY_AUDIT_PASS` | ✅ `2026-08-21T04:57:44Z` |
| External firm | ⏳ Optional · **same R2_FINAL manifest** · before Mainnet |
| Mainnet / Production GO | **FORBIDDEN** until Owner written auth |

**Baseline:** `V9_AUDIT_CANDIDATE_R2_FINAL` only · **R1_FINAL superseded**.

