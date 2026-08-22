# TT · TTG V9 AI Audit #2 — PREP only (Periphery Governance Upgrade)

**STATUS:** `PREP_ONLY` · **NOT STARTED** · **NO PASS**  
**Role (when opened):** Economic Red Team / combination attacker  
**Opens only after:** `V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP`  
**Binds to:** `AUDIT_1_CANDIDATE_SHA = b19b85810c22677d243a82d06ebec8ebcb4d4b47` (+ Sepolia Reality evidence when PASS)  
**Forbidden now:** Audit #2 PASS stamp · Exact-Match · Mainnet · editing Candidate Solidity · inheriting old triad PASS  

---

## Question (when live)

Can combinations steal funds, bypass Timelock/Governor, or break frozen fee/split/treasury/PM economics?

---

## Checklist skeleton (do not mark PASS)

| ID | Attack / combination surface | Prep note |
|----|------------------------------|-----------|
| A2-01 | Platform fee governance → Escrow charge mismatch vs FeeRouterV2 storage | Integrator vs on-router |
| A2-02 | Active split governable + no-steward independent branch confusion | Force wrong branch |
| A2-03 | Split sum≠10000 / rounding dust → drain or sticky remainder | Hard bound + CEI |
| A2-04 | PM `minTtgOut`/`deadline` bypass or grief vs treasury=PoolV2 | Slippage / ETA race |
| A2-05 | Timelock admin allowlist / Governor rebind without delay (Solo model) | ACCEPT_DESIGN vs exploit |
| A2-06 | Same-ETA batch ordering: seed/buy vs fee param execute race | Narrow WINDOW |
| A2-07 | ProjectPoolV2 `capBps` 0…10000 + spend under/over cap | Cap vs spent period |
| A2-08 | UUPS PM/Vault/Pool upgrade auth still Timelock-only after NEW root | Privilege map |
| A2-09 | Money Path EF/SR → FeeRouterV2 wrong sink / pause | Cutover wiring |
| A2-10 | TTG KEEP / no-mint / supply pin under governance burn path | Monetary invariant |

---

## Exit (later)

```text
OPEN_CRITICAL = 0
OPEN_HIGH = 0
OPEN_MEDIUM = 0 (or Owner-accepted non-blocking only per Alignment policy)
→ then Scanner / Compiler / English → Exact-Match Freeze → Audit #3
```

**This file is not a PASS.**
