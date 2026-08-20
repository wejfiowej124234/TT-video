# TT · Wait Window · R-FEE-PAYOUT-CONSISTENCY-1（LATEST）

**STATUS:** `CLOSED`  
**Stamp:** `2026-08-11T09:30:00Z`  
**Strategy:** `MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN`  
**Machine:** [`TT-WAIT-WINDOW-R-FEE-PAYOUT-CONSISTENCY-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-FEE-PAYOUT-CONSISTENCY-1-LOCAL-PREP-LATEST.json)

**`TT_PRODUCTION_GO`:** `NO_GO` · **`blocks_track1_finalize`:** `false`

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Official Cut

- **API image:** `deployment-01KZR2GX9DZXHHZW7KJ3ST8BDJ`
- **Regression:** **PASS**
- **Track1:** `readyAt=1786491935` · `done=false` · USDC=`10000000` · `isEscrow=false`

## 1 · P0 Fixes

| Gap | Fix |
|-----|-----|
| FE dispute split ignored platform BPS | Align to API：500 BPS then ratio on rest |
| Dispute amount parse **1e18** | → USDC **6** decimals |
| Dispute BPS hardcode **250** | → **500**（V311 default） |
| resolve `refund_ratio≥1` → Refunded vs fee retained | Terminal from three-leg amounts（→ Slashed when fee kept） |

## 2 · P1 deferred / AFTER_SEAL

- Guide/Provider `period_expected_earnings` = gross（标注级）
- Quote `guide_fee` line ≠ chain residual
- Acquisition bounty fee path · Indexer · R-MEDIA

ETA `2026-08-11T23:45:35Z` → STOP → Track1 Preflight
