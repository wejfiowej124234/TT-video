# TT · TTG V9 Internal Audit Wave — Findings (Attack Perspective)

**Wave:** Internal · firm-grade checklist · **not** a substitute for external firm attestation  
**Against:** Sepolia PASS + `V9_AUDIT_CANDIDATE` → remediations **R1**  
**Date:** 2026-08-21  
**Verdict after R1:** `OPEN_CRITICAL=0` · `OPEN_HIGH=0` · Medium remediations applied or Owner-accept

---

## Executive summary

Internal Token-Launch review of TTG V9 Token / Vault / Batch PM / Governor / UUPS / burn / privileges / deploy.  
No Critical issues found in production paths. Two Medium issues fixed in **R1** (CEI in `buy`, `closeBatchReturn` while paused, UUPS `onlyProxy`). Deployment atomicity documented. Remaining items are Low/Informational or accepted economics.

---

## Privilege map (as designed)

| Actor | Can | Cannot |
|-------|-----|--------|
| Anyone | `buy` in window · `armBatch` · `closeBatchReturn` after end · propose if votes | mint · upgrade · rescue TTG · protocolBurn |
| Guardian | `pause` | `unpause` · upgrade · burn · set params |
| Timelock (admin) | upgrade Vault/PM · unpause · rescue non-TTG · set params · execute gov burn · `protocolBurn` own balance | mint · silent Public expansion |
| Governor | propose/vote/queue into Timelock | execute before delay · mint |
| Vault | `protocolBurn` via `executeGovernanceBurn` (as token burner) | burn user wallets |
| Token | transfer/delegate | mint after genesis · public burn |

---

## Findings

### CRITICAL — none

### HIGH — none open after R1

| ID | Title | Status |
|----|-------|--------|
| H-01 | Vault proxy empty-init front-run if initialize split across txs | **Mitigated** — `TtgV9DeployTopology` keeps proxy+token+initialize in one call; NatSpec MUST same-tx. Mainnet runbook: forbid split deploy. |

### MEDIUM

| ID | Title | Status |
|----|-------|--------|
| M-01 | `closeBatchReturn` previously `whenNotPaused` — Guardian could trap unsold inventory | **Fixed R1** — close allowed while paused |
| M-02 | `buy` updated `sold` after external ERC20 calls (CEI) | **Fixed R1** — effects before interactions |
| M-03 | UUPS `upgradeToAndCall` lacked onlyProxy guard | **Fixed R1** — revert if called on implementation |

### LOW / INFORMATIONAL

| ID | Title | Disposition |
|----|-------|-------------|
| L-01 | Public `armBatch` pulls full remaining cap into PM | **ACCEPT** — funds return on close; consider Timelock-only arm later |
| L-02 | Ops 3+5+7 (15%) can meet quorum/propose alone if delegated | **ACCEPT_DESIGN** — concentration risk; Ownermultisig/ops policy |
| L-03 | Timelock `protocolBurn` on DAO balance bypasses Vault batch-armed gate | **CONFIRM_DESIGN** — DAO burn ≠ Public inventory burn; still Timelock-gated |
| L-04 | No ERC20Permit / votes on genesis until `delegate` | **ACCEPT** |
| L-05 | MockTimelock `bootstrapMode` must never be Mainnet Timelock | **RUNBOOK** — Mainnet KEEP real Timelock only |
| L-06 | Floor rounding in `quoteTtg` favors protocol | **CONFIRM_DESIGN** |
| L-07 | Compiler lint: immutable SCREAMING_SNAKE | **BACKLOG** non-blocking |
| L-08 | External Slither not installed in this environment | **FOLLOW_UP** — run in CI/audit firm toolchain |
| L-09 | Explorer Exact Match / SBOM pin | **Mainnet pack** after Regression |

---

## Economic / governance attack notes

| Attack | Result |
|--------|--------|
| Flash-loan vote | Snapshot = `block.number - 1` at propose; vote weight from past votes — same-block flash ineffective |
| Flash-loan propose | Past votes at snapshot-1; flash in propose block does not inflate threshold |
| Batch sniping | Expected; caps absolute; current-batch-only |
| Price arbitrage across batches | By design ladder 1/3/5/7/9 µUSDC |
| Upgrade rug | Timelock-only `_authorizeUpgrade` + onlyProxy |
| Hidden mint | No mint function; ABI gate in local remint script |
| Seize user TTG via rescue | `CannotRescueTtg` |
| Burn path bypass | User cannot `protocolBurn`; Vault burn blocked while armed batch |

---

## R1 code changes (post-candidate)

- `TtgBatchPrimaryMarket.sol` — CEI + close while paused  
- `TtgV9UUPSUpgradeable.sol` — onlyProxy on upgrade  
- `TtgV9DeployTopology.sol` — same-tx initialize warning  
- Test: pause then close RETURN  

Re-hash after R1: re-run `freeze-ttg-v9-audit-candidate.py` → status `R1_POST_INTERNAL_REMEDIATION`.

---

## Exit criteria → Sepolia Regression

1. Local forge G1–G7 + remint tests PASS  
2. Manifest R1 frozen  
3. Sepolia Regression script PASS (Owner auth `TRAVELTRUST_TTG_V9_SEPOLIA_REHEARSAL_OK=1`)  
4. Then optional **external** firm audit on R1 bytes  
5. Mainnet only with Owner written auth  

**Stamp target after regression:** `V9_SEPOLIA_REGRESSION_PASS` · still **not** Mainnet.
