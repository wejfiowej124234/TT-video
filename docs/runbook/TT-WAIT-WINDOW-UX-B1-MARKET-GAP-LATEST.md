# TT · Wait Window · B1 Market GAP（LATEST）

**Batch:** `B1-MARKET`  
**Stamp:** `2026-08-10T10:12:00Z`  
**Phase:** `CLOSED` · **Official Runtime verify:** `PASS`  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Reality Seal · **≠** Production GO  

**Frozen untouched:** Mainnet Web3 / FTB / Registry v1 / Wired / Track1  

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Local Fix（已部署官网 · 最小）

| ID | Decision | Fix | Official Runtime |
|----|----------|-----|------------------|
| **B1-M-005** P0 | FIX_NOW | 去掉 Official「local-dev / offline demo」误导文案；`no_catalog` 空态改诚实 unavailable | **PASS** |
| **B1-M-001** P1 | FIX_NOW | `filterPublicMarketGuides` 过滤 Owner UAT | **PASS** |
| **B1-M-004** P1 | FIX_NOW | `MarketOrderClosureStrip`：已登录隐藏 Sign up to order | **PASS** |
| **B1-M-002** P1 | FIX_NOW | `marketCountryChipLabel` + StickyFilterBar 国家 chip 跟 locale | **PASS** |
| **B1-M-003** P1 | FIX_NOW | Market / provider / acquisition `document.title` 跟 `t(meta_title)` | **PASS** |

**Local verify:** `npx vitest run lib/marketPublicGuideGate.test.ts` → **3/3 PASS**  
**Deploy:** `bash scripts/dev/deploy-tt-web-production.sh` → **OK** · `tt-web-prod` · `git_sha=c3eeaf10ae18ed675e32aa153977808ca586c08e` · `build_time=2026-08-10T10:00:06Z`（工作树含 B1 未提交 Fix）  
**Runtime evidence:** [`TT-WAIT-WINDOW-UX-B1-MARKET-RUNTIME-VERIFY-LATEST.json`](./TT-WAIT-WINDOW-UX-B1-MARKET-RUNTIME-VERIFY-LATEST.json)

**ACCEPT / DEFER（未改 · 仍 OPEN）：** B1-M-006 · 007 · 008 · 009 · 010  

---

## Official Runtime

| 项 | 状态 |
|----|------|
| 本地 Fix | DONE |
| 官网部署 | **DONE** |
| Runtime 复验关票 | **PASS**（005/001/004/002/003） |
| B1 CLOSED | **是** |
| 进入 B2 Auth | **是**（CHECK ONLY） |

---

## Honesty

`B1 CLOSED ≠ RUNTIME_VERIFIED 全站 ≠ Seal ≠ GO` · ACCEPT/DEFER 项仍可后续回访，不阻塞 B2 开工
