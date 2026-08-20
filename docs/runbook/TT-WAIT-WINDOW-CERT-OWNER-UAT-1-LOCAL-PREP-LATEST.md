# TT · Wait Window · CERT-OWNER-UAT-1（LATEST）

**STATUS:** `CERT_OWNER_UAT_CLOSED` · **Stamp:** `2026-08-12T06:25:27.704Z`
**Mode:** C1/C2 resume · **wallet keys used:** `false`
**`TT_PRODUCTION_GO`:** `NO_GO` · INDEXER_REALITY_CLOSED kept · Alchemy=NON_BLOCKING hygiene

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Credential contract

| # | Role | ID |
|---|------|----|
| 1 | 多重身份 Hub | C1 |
| 2 | 纯游客 | C2 |

## Rows

| ID | OK | Notes |
|----|----|-------|
| C1-LOGIN | PASS | http=200 |
| C1-ME | PASS | http=200 |
| C1-GUIDE-PROFILE | PASS | http=200 |
| C1-MERCHANT-PROFILE | PASS | http=404 |
| C1-ACQUISITION-PROFILE | PASS | http=200 |
| C1-REGION-STEWARD-PROFILE | PASS | http=404 |
| C1-ORDERS | PASS | http=200 |
| C1-ME-STATS | PASS | http=200 |
| C1-DISCOVER | PASS | http=200 |
| C1-GUIDES-LIST | PASS | http=200 |
| C1-COMMUNITY-FEED | PASS | http=200 |
| C1-SESSION-REFRESH-OR-PERSIST | PASS | refresh=200 |
| C2-LOGIN | PASS | http=200 |
| C2-ME | PASS | http=200 |
| C2-DISCOVER | PASS | http=200 |
| C2-GUIDES-LIST | PASS | http=200 |
| C2-COMMUNITY-FEED | PASS | http=200 |
| C2-ORDERS | PASS | http=200 |
| C2-NEG-MERCHANT-PROFILE-WRITE | PASS | http=405 |
| C2-NEG-GUIDE-PROFILE-WRITE | PASS | http=405 |
| C2-NEG-ADMIN-CAMPAIGNS | PASS | http=403 |
| C2-LOGOUT-SESSION-BOUNDARY | PASS | — |
| REALITY-CITE-FACTORY | PASS | — |
| REALITY-CITE-INDEXER | PASS | last=25735399 |

## Coverage gaps (honest)

- **REGION_STEWARD_SLOT**: C1 region-steward-profile 404 — 区域主理人槽位未在该账号启用；不得用 Admin 冒充
- **PURE_C3_GUIDE_VS_C4_MERCHANT_ISOLATION**: 仅 C1+C2 无法证明「纯向导 vs 纯商家」互斥写权限；需独立 C3/C4 才闭合。本轮不冒充、不 Admin 补绿。

## Blockers

- (none)

## Next

**WC_REAL_DEVICE**（Owner 真机手动连钱包/签名 · 独立阶段）→ Legal/支付 PRE_GO → Final Regression/Soak → fresh Hard Gate


*Sebastian Ward · Solo · CERT_OWNER_UAT_CLOSED · NO_GO*
