# TT · TTG V9 短窗五轮（V9_SHORT_WINDOW_FIVE_ROUND）

**STATUS:** Mainnet Timelock **EXECUTED** · live PM pin **V9_SHORT_WINDOW_FIVE_ROUND** · **≠** `TT_PRODUCTION_GO`  
**Code SSOT:** `contracts/src/ttg-v9/TtgV9Constants.sol` · FE: `frontend/lib/governance/ttgPublicUnlockScheduleLocal.ts`  
**L7 evidence:** `evidence/GO_ttg_v9_short_window_five_round/MAINNET-SW5-PIN-EXECUTE-L7-LATEST.json`

## Execute (2026-08-26T23:53Z · block 25842808)

| Item | Value |
|------|-------|
| Timelock | NEW 12h `0xF61880fe9943BBc624F487782E2fB35d8Ae50E3A` |
| Operation ID | `0x729fa76e43cfa7f4c3baca451111926fbafe2ef27642f49dce891e0b7ee959ab` |
| `execute` tx | `0x048c6d29075c4f61691049b5a1ba57d4178c30573509e99dbbfab3a2e83ae63c` |
| Executor | Norm Marketing `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| `done` | `true` |
| Live `version()` | `ttg_batch_primary_market_v9_short_window_five_round` |
| Implementation | `0xf3c21d5c87cf70b12285454aaa4c1343d3c60bc9` |
| Batch 1 end | `1792659600` |
| Batch 5 cap | `625e9` ether |

Probe expectation table retargeted: `scripts/dev/probe-ttg-v9-mainnet-post-execute-reality-deep.py`. This pin is **primary-market schedule only**. It is **not** Production GO.

## What this is

Current public-sale **plan** (not the 25T monetary invariant):

- Amounts: scheme A (3.905% of 25T)
- Prices: `$0.000001 → $0.000003 → $0.000005 → $0.000007 → $0.000009`
- Windows: 7 / 14 / 21 / 30 / 45 days with gaps (skip Christmas and Lunar New Year)

## Live L7 (read after execute · 2026-08-26T23:53Z)

| Item | Observed |
|------|----------|
| PM proxy | `0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b` |
| `version()` | `ttg_batch_primary_market_v9_short_window_five_round` |
| Implementation | `0xf3c21d5c87cf70b12285454aaa4c1343d3c60bc9` |
| `timelock()` | NEW 12h `0xF61880fe9943BBc624F487782E2fB35d8Ae50E3A` |
| NEW Timelock `governor()` | **`address(0)`** |
| NEW Timelock `admin()` | `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| `seededBatchCount` | `5` |
| Batch 1 | start `1792054800` · end `1792659600` · cap 1.25B · unarmed |
| Batch 5 | start `1809594000` · end `1813482000` · cap **625e9** · unarmed |

Do **not** re-run the schedule script. `execute` is already `done=true`.

## Forbidden

- Re-schedule / second pin
- Guardian / EOA setting price
- Rewriting sold or opened batches
- Claiming Production GO from this pin
