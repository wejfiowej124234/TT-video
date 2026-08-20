# TT · Wait Window · Reality Audit · B3 G-001/G-002/G-006 Official Dual Deploy Runtime Verify（LATEST）

**STATUS:** `CLOSED` · **Verdict:** `PASS`  
**Stamp:** `2026-08-10T17:36:00Z`  
**Parent:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B3-GAP-INVENTORY-LATEST`](./TT-WAIT-WINDOW-REALITY-AUDIT-B3-GAP-INVENTORY-LATEST.md)  
**Machine:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B3-G001-G002-G006-RUNTIME-VERIFY-LATEST.json`](./TT-WAIT-WINDOW-REALITY-AUDIT-B3-G001-G002-G006-RUNTIME-VERIFY-LATEST.json)

**Scope:** Official 双端最小部署后 Runtime Verify — Discover Draft/$1200 · Guide detail 字段 · Community 评论契约  
**Not in scope:** Media 404（**B3-G-007**）· 资金执行 · Batch 4+  
**Frozen untouched:** Mainnet Money Path · FTB · Registry v1 · Wired · Track1  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Reality Seal

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Deploy order（本轮）

| # | App | Result | Image / stamp |
|---|-----|--------|---------------|
| 1 | `tt-api-prod` | OK | `deployment-01KZPAYFV5K6A5QTB7RP8TBVNC` · health 200 |
| 2 | `tt-web-prod` | OK | `deployment-01KZPB3SET69TFJM4CHY7NM6AA` · `build_time=2026-08-10T17:21:19Z` · `git_sha=c3eeaf10…` |

---

## Runtime checks

| Gap | Check | Result | Observed |
|-----|-------|--------|----------|
| **B3-G-001** | Discover API 无 Draft/$1200 | **PASS** | `GET /api/v1/discover/orders` → `items=[]` · drafts=0 · has1200=false（limit 50/100） |
| **B3-G-001** | Market UI Orders | **PASS** | Official `/market` · **Orders 0** · 「No orders to match yet」· 无 Draft+$1200 卡片 |
| **B3-G-002** | Guide detail API 字段 | **PASS** | `GET /guides/{id}` 含 `hourly_rate` / `public_title` / `avatar_url`（Omar 等） |
| **B3-G-002** | Guide detail UI | **PASS** | `/guides/9ccab777-…` · Omar · **85 On request/hr** |
| **B3-G-006** | 错误 + CORS ACAO | **PASS** | POST comments 无 session → `401` + `access-control-allow-origin: https://www.web3-ttg.com` |
| **B3-G-006** | FE Idempotency-Key | **PASS** | Official chunks 含 `Idempotency-Key` |
| **B3-G-006** | 评论创建 | **PASS** | Drawer Send → `Comments · 1` · `B3 dual-deploy RV comment 20260810T1735Z` |
| **B3-G-006** | 重复 Idempotency 回放 | **PASS** | 同 key 双 POST trust-growth/ingest → 同体 + ACAO（同中间件） |

---

## Gap seal

| ID | Disposition |
|----|-------------|
| **B3-G-001** | **CLOSED** |
| **B3-G-002** | **CLOSED** |
| **B3-G-006** | **CLOSED**（本轮再证） |
| **B3-G-007** | **OPEN_SEPARATE**（Media 404 · 不混入） |

---

## Honesty

`G-001/002/006 CLOSED ≠ Batch 3 CLOSED ≠ Reality Seal ≠ Production GO` · 无资金执行 · Mainnet/FTB/Registry/Wired/Track1 未动
