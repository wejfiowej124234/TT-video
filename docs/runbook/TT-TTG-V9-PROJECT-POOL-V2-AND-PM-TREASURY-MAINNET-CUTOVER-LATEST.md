# V9 ProjectPoolV2 + PM Treasury Mainnet Cutover

**Machine:** `V9_PROJECT_POOL_V2_AND_PM_TREASURY_MAINNET_CUTOVER`  
**Owner auth:** RECORDED · **Broadcast:** **BLOCKED** until Pre-Broadcast Security+Source Hygiene **PASS**  
**Hard gate:** `V9_MAINNET_FINAL_PRE_BROADCAST_SECURITY_AND_SOURCE_HYGIENE_GATE` → currently **STOP** (`DIRTY_WORKTREE`)  
**`TT_PRODUCTION_GO`:** NO_GO · unchanged  

## Frozen candidates (only)

| Candidate | Pin (artifact sha256) | Sepolia |
|-----------|----------------------|---------|
| ProjectPoolV2 | `a93ae30f436a4c1a75faee8b6b7d5d7e24904481a159bc746bab7a4bbf0cbaa3` | SECURITY_FREEZE_STOP |
| PM treasury_governed | `968d9ca61f00be35395d913e8e6a86759643eaf992836101817f4fb3854b34cb` | SEPOLIA_REALITY_PASS + FREEZE_STOP |

**Forbid:** rebuild unfrozen bytecode · ad-hoc source/param edit · Guide Bond / Staging / www Production · other V9 edits · GO flip.

## Mainnet live preflight (PASS)

- SoloTimelock `0x99e43…` · admin Norm Marketing · delay **172800**
- PM `0xc714…` · treasury still `0x7B21…` · version `ttg_batch_primary_market_v9_uups` · **seededBatchCount=0**
- FeeRouter `0x5afD…` · owner=Timelock · projectPool=`0x7B21…`
- Circle USDC · legacy pool USDC balance **0**

## Timelock ladder (hard)

| Phase | Action | When |
|-------|--------|------|
| **A** | Deploy Exact-Match PoolV2 · schedule PM `upgradeToAndCall` · schedule Fee `setProjectPool(V2)` | **NOW** (needs broadcast approval) |
| **B** | Execute upgrade + Fee · verify 0-drift · schedule `setUsdcTreasury(V2)` | ≥ ETA (+48h) |
| **C** | Execute `setUsdcTreasury` · Reality · label `LEGACY_PHASE1_PROJECT_POOL` · **FREEZE STOP** | ≥ 2nd ETA (+48h) |

Scripts:

```bash
export TRAVELTRUST_MAINNET_BROADCAST_OK=1
bash scripts/dev/run-ttg-v9-pool-v2-pm-treasury-mainnet-cutover-phase-a.sh
# after ETA:
bash scripts/dev/run-ttg-v9-pool-v2-pm-treasury-mainnet-cutover-phase-b.sh
# after 2nd ETA:
bash scripts/dev/run-ttg-v9-pool-v2-pm-treasury-mainnet-cutover-phase-c.sh
```

Evidence: `evidence/GO_ttg_v9_pool_v2_pm_treasury_mainnet_cutover/`

## Reality notes

- PM **write-buy** Reality is **blocked** while `seededBatchCount=0` (no five-batch economics change; separate Timelock `seedBatches` later).
- After wiring: prove PM treasury→V2 · Fee projectPool→V2 · legacy Δ=0 · V2 cap/period/spent intact.

## Pre-Broadcast Security + Source Hygiene (mandatory before Phase A)

| Metric | Result |
|--------|--------|
| Exact-Match PM / PoolV2 | PASS (pins match offline artifacts) |
| NON_ENGLISH_SOURCE_COMMENTS | **0** |
| TODO/FIXME/HACK (ACTIVE) | **0** |
| OPEN_C / OPEN_H / OPEN_M (code) | **0 / 0 / 0** |
| Storage layout PM treasury | PASS |
| Genesis 50/35/3/5/7 + Vault 50% custody | PASS |
| TTG no-mint / no-blacklist / no-honeypot / no-setBalance | PASS |
| **Clean worktree** | **FAIL** · dirty_count=**34** → **STOP** (`DIRTY_WORKTREE`) |

Any source/comment edit = Candidate mutation → Local → Sepolia → Security → Exact-Match Freeze again; **forbid** fix-then-Mainnet.

Evidence: `V9_MAINNET_FINAL_PRE_BROADCAST_SECURITY_AND_SOURCE_HYGIENE_GATE.json` · `…_STOP.json`

## STOP

Phase A **forbidden** until Hygiene **PASS** stamp exists and worktree is clean. After full Phase C: **STOP** — no Guide Bond / Staging / Production GO.
