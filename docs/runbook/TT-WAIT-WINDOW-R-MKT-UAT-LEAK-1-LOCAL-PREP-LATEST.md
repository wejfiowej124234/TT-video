# TT · Wait Window · R-MKT-UAT-LEAK-1 · CLOSED（LATEST）

**STATUS:** `CLOSED`  
**Stamp:** `2026-08-11T06:50:00Z`  
**Strategy:** [`MAXIMIZE-PRE-ETA-REMEDIATION`](./TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST.md)  
**Machine:** [`TT-WAIT-WINDOW-R-MKT-UAT-LEAK-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-MKT-UAT-LEAK-1-LOCAL-PREP-LATEST.json)

**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Seal · Product CLOSED ≠ Reality Seal  

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Migration checksum blocker · CLEARED

| 项 | 结果 |
|----|------|
| 根因 | Living tip **CRLF 污染**已发布 migration（含 `20260708120000`）→ tip bake checksum ≠ Production `_sqlx_migrations` |
| Production ledger | **READ-ONLY** · RI-01 `RI_REQUIRE_DB=1` · **0 drift** · 与 **HEAD LF** 对齐 |
| Focus sha384 | `5d859f03…e9da0efb`（361 B · LF） |
| 禁止项（已遵守） | 不改 Production `_sqlx_migrations` · 不删/重写生产迁移历史 · 不新造 migration 掩盖漂移 |
| 恢复 | `git checkout --` 恢复 13 个 CRLF 脏文件为 HEAD immutable bytes |
| 防再漂 | `.gitattributes` `eol=lf` + `scripts/gates/check-sqlx-migration-lf-integrity.sh` 接入 `phase3-production-fly-deploy-and-sync.sh` |

---

## 1 · Official API Cut · PASS

| 项 | 结果 |
|----|------|
| Cut WT | `D:/TravelTrust-R-MKT-api-cut`（HEAD + R-MKT API overlay only） |
| Image | `deployment-01KZQQZQCF1RYAHPD07SPRTVBH` |
| Boot | `database: connected and migrations applied`（**无** replay / checksum modified） |
| `/health` | **200** |
| `/meta` | **200**（慢 · 已知 · 非本包 blocker） |

Server SSOT：production 强制 `public_market_listings_filter_enabled` + `public_market_listing_eligible`（`uat-v65-` 族等）。

---

## 2 · Runtime Verify · listings

| 项 | Before | After |
|----|--------|-------|
| Public count | 25 | **10** |
| `uat-v65-*` | 15 | **0** |
| 正常 merchant | — | **保留**（迪拜/首尔/纽约等 payload） |

**FE-only 不是最终修复** — 本包以 **server eligibility** 收口；FE 仅 defense-in-depth。

---

## 3 · Official FE Cut · defense

| 项 | 结果 |
|----|------|
| Image | `deployment-01KZQRRT3E204TKDW7Y0R1W9NF` |
| `git_sha` | `c3eeaf10ae18ed675e32aa153977808ca586c08e` |
| Surfaces | `/` · `/market` · `/market/provider` **200** |

---

## 4 · Track1（readonly · undisturbed）

`readyAt=1786491935` · `done=false` · USDC `10000000` · `isEscrow=false`  
**未触碰** Mainnet/FTB/Registry/Wired/Timelock/Track1 mutate。

---

## 5 · Next

**R-COMM-TEXT-BAN-1** 可开（串行）。R-MEDIA-1 默认 AFTER_SEAL。

*Sebastian Ward · Solo · R-MKT CLOSED · Track1 undisturbed*
