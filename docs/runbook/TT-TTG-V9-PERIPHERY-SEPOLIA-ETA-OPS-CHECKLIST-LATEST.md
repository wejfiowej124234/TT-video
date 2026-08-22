# TT · ETA Ops Checklist — Single-12h Sepolia Reality (P0)

**P0 over all WAITING_ETA docs modules.**  
**Candidate:** `b19b85810c22677d243a82d06ebec8ebcb4d4b47`  
**READY_AT:** `1787408352` (~2026-08-22 14:19:12 UTC)  
**Runner:** `bash scripts/dev/run-ttg-v9-periphery-governance-sepolia-reality.sh resume`

## ETA −30 min

- [ ] Stop Blocks A–G / CMS / local long tests  
- [ ] Confirm single resume waiter alive  
- [ ] Confirm `sepolia-reality.addresses.env` present  
- [ ] Do **not** start a second resume  

## ETA reached (order locked)

1. On-chain confirm `operations(idSeed).readyAt <= now` and `done == false`  
2. Stamp mental check: **TIMELOCK_REALITY_CERT** TooEarly→12h→Executable (**once**)  
3. **Immediate:** execute bind → **seed** → caller → steward  
4. **Immediate:** PM buy (slippage fail then success) — **narrow WINDOW**  
5. Same-ETA batch: fee bps / split / cap / bad-split revert / 60-40 route / P4 / pause-unpause  
6. KEEP/no-mint + EF/SR Money Path  
7. **No second 12h** (gov burn skipped this round)  
8. Freeze `V9_PERIPHERY_GOVERNANCE_UPGRADE_SEPOLIA_REALITY_PASS_STOP`  
9. **NEXT = AUDIT_2 only**

## Hard locks

- No Candidate Solidity edits  
- No Exact-Match  
- No Mainnet broadcast  
- `TT_PRODUCTION_GO = NO_GO`  

## If miss batch window

**STOP** · record failure · do **not** invent compressed delay · Owner decides re-seed (would be new schedule → another real 12h) or redesign rehearsal windows in a **new** Candidate (invalidates Audit #1).
