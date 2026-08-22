# V9 Primary Market Treasury Governed Cutover

**Wave:** `V9_PRIMARY_MARKET_TREASURY_GOVERNED_CUTOVER`  
**Long-window Reality:** `V9_PM_TREASURY_GOVERNED_LONG_WINDOW_SEPOLIA_REALITY` · **PASS** · **STOP**  
**ProjectPoolV2 Candidate:** **KEPT FROZEN** (Sepolia PASS · security · Exact-Match)  
**Dual-pool ACTIVE carve-out:** **REJECTED**  
**`TT_PRODUCTION_GO`:** NO_GO · independent · **not flipped**

## Patch (minimal · frozen)

| Item | Rule |
|------|------|
| Contract | `TtgBatchPrimaryMarket` UUPS |
| New API | `setUsdcTreasury(address)` · Timelock-only · reject `address(0)` |
| Storage | **No new slots** · `__gap` unchanged |
| Unchanged | 25T/no-mint · 50/35/3/5/7 · five-batch caps/prices · buy/close · layout |
| Version | `ttg_batch_primary_market_v9_uups_treasury_governed` |
| Exact-Match pin | `968d9ca61f00be35395d913e8e6a86759643eaf992836101817f4fb3854b34cb` (artifact; on-chain `__self` immutable normalized) |
| Legacy fixture | `contracts/src/ttg-v9/legacy/TtgBatchPrimaryMarketPreTreasury.sol` (upgrade-from tests only) |

## Gates

| Gate | Status |
|------|--------|
| Storage layout | **PASS** |
| Local Forge (incl. buy→PoolV2) | **PASS** |
| Sepolia DL_R1 in-place upgrade 0-drift | **PASS** |
| Sepolia fresh PreTreasury→upgrade 0-drift + ACL | **PASS** |
| Sepolia pre-upgrade buy→legacy | **PASS** |
| Sepolia post-cutover buy→PoolV2 (WINDOW=3600) | **PASS** · USDC 100% → PoolV2 · legacy Δ=0 |
| FeeRouter → PoolV2 funds | **PASS** (10 USDC) |
| PoolV2 cap/period/spent/start 0-drift | **PASS** |
| Exact-Match artifact | **FROZEN** |
| Security OPEN_C/H/M | **0** · **FREEZE** |

Evidence: `evidence/GO_ttg_v9_pm_treasury_governed_sepolia/`  
- `V9_PM_TREASURY_GOVERNED_LONG_WINDOW_SEPOLIA_REALITY.json`  
- `V9_PM_TREASURY_GOVERNED_SEPOLIA_FREEZE_STOP.json`  
- `long_window.addresses.env` · `long_window.run9.log`

**Sepolia long-window note:** `WINDOW=3600` is **test-only** to clear `BatchNotOpen`. No Mainnet economics / five-batch production params / Candidate core logic were changed.

## STOP

Sepolia Reality + Exact-Match + Security Freeze are **closed**.  
**Next (separate Owner request only):** Mainnet Cutover Authorization — do **not** broadcast Mainnet in this wave.

## Mainnet order (after separate Owner auth only)

1. Deploy ProjectPoolV2 Exact-Match  
2. Timelock UUPS upgrade PM → treasury_governed  
3. `setUsdcTreasury(V2)`  
4. FeeRouter `setProjectPool(V2)`  
5. Full funds-path Reality · label `0x7B21…` `LEGACY_PHASE1_PROJECT_POOL`  

## Forbidden

Ad-hoc source mid-cutover · dual ACTIVE pools as final topology · Mainnet without new Owner auth · `TT_PRODUCTION_GO` flip · mutate five-batch economics / 90d · Guide Bond / Staging Full Reality resume this wave.
