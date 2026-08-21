# TT · TTG V9 Mainnet DL_R1 — Phase2 Freeze Wait

**STATUS:** `V9_MAINNET_DL_R1_PHASE2_FREEZE_WAIT`  
**Candidate (frozen):** `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DL_R1**  
**Phase1 addresses:** **FROZEN** — no redesign / redeploy / address swap / live param edit

## Clock

| Item | Value |
|------|--------|
| Solo execute earliest | **2026-08-23T10:52:59Z** (`idBind`) |
| Then | execute `idSeed` · `idCallerSr` · `idCallerEf` only |
| KEEP path | Legacy Safe → KEEP Timelock `schedule(setFeeRouter)` → **+48h** → `execute` |
| Target FeeRouter | `0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970` |

## Scripts (prepared · do not run Solo execute early)

1. `bash scripts/dev/run-ttg-v9-mainnet-dl-r1-phase2-solo-execute.sh` — refuses until ETA  
2. Safe tx to KEEP Timelock — payload: `evidence/GO_ttg_v9_mainnet_dl_r1/KEEP_SAFE_SET_FEE_ROUTER_PAYLOAD.json`  
3. After KEEP execute: `python scripts/dev/run-ttg-v9-mainnet-dl-r1-verified-stop-gate.py` → only then `V9_MAINNET_DEPLOYMENT_VERIFIED_STOP`

## Still forbidden

Public sale open · Official www pin cutover · `TT_PRODUCTION_GO` flip

Parents: [Phase1 STOP](TT-TTG-V9-MAINNET-BROADCAST-PHASE1-STOP-LATEST.md) · freeze stamp `V9_MAINNET_DL_R1_PHASE2_FREEZE_WAIT.json`
