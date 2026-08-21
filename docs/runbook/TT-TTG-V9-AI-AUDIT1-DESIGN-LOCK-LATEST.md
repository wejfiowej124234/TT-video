# TT · TTG V9 AI Audit #1 — Contracts / Authz / Economic Invariants (Design Lock)

**STATUS:** `V9_AI_AUDIT1_DESIGN_LOCK_PASS`  
**Candidate:** `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · remediation **DL_R1**  
**Baseline:** Owner Design Lock + Canonical Baseline Clean + Local gate 11/11  
**Forbidden:** inherit R2_FINAL PASS · Mainnet broadcast · auto `TT_PRODUCTION_GO`

---

## Verdict

| Metric | Count |
|--------|------:|
| OPEN_CRITICAL | **0** |
| OPEN_HIGH | **0** |
| OPEN_MEDIUM | **0** (DL1-M01/M02 **FIXED DL_R1**) |

---

## Privilege map (Design Lock)

| Actor | Can | Cannot |
|-------|-----|--------|
| Solo Timelock admin | schedule allowlisted; setGovernor; setAllowedExecutionTarget | change delay/admin |
| Governor | scheduleByGovernor after PASS (single-op) | multi-op; allowlist |
| Guardian | market.pause | unpause; seed; upgrade; P4 |
| Timelock execute | after delay; permissionless executor | skip delay |
| FeeRouter caller | routePlatformFee | setStewardPayout |
| Public | buy / arm / closeReturn / steward stake | mint; UUPS; burn user wallets |

Solo admin unilateral schedule = **ACCEPT_DESIGN** (Owner Q5).

---

## Findings

### CRITICAL / HIGH — none OPEN

### MEDIUM — closed by DL_R1

| ID | Title | Status |
|----|-------|--------|
| DL1-M01 | `spendP4Reserve` arbitrary token under USDC cap | **FIXED** — `token == reserveToken` |
| DL1-M02 | Governor propose multi-op stuck vs queue single-op | **FIXED** — `GovSingleOpOnly` at propose |
| DL1-M03 | No Timelock cancel | **ACCEPT_DESIGN** |

### LOW

| ID | Title | Status |
|----|-------|--------|
| DL1-L01 | setGovernor(0) | **FIXED DL_R1** |
| DL1-L02–L06 | CEI soft / Merchant hard-off / NatSpec P4Cap naming / permissionless execute / state cosmetic | ACCEPT / CONFIRM |

---

## Economic invariants

| Invariant | Result |
|-----------|--------|
| Fee 500 bps documented; Escrow charges | PASS (WARN: Escrow out of FeeRouter) |
| 45/55 · else 100% pool · no globalStakers | PASS |
| Sale → NEW ProjectPool | PASS |
| P4 ≤30%/90d · USDC-only | PASS (post DL_R1) |
| RoleStake live supply · Merchant/Guide DISABLED | PASS |
| ZERO ACTIVE Safe / old P4Cap sinks in Design Lock wiring | PASS |

---

## Next

AI Audit #2 Red-Team on same freeze · no Mainnet.
