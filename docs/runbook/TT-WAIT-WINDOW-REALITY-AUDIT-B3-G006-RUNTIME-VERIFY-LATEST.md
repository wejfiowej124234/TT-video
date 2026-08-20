# TT · Wait Window · Reality Audit · B3-G-006 Runtime Verify（LATEST）

**STATUS:** `CLOSED` · **Verdict:** `PASS`  
**Stamp:** `2026-08-10T17:16:00Z`  
**Parent:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B3-GAP-INVENTORY-LATEST`](./TT-WAIT-WINDOW-REALITY-AUDIT-B3-GAP-INVENTORY-LATEST.md)  
**Machine:** [`TT-WAIT-WINDOW-REALITY-AUDIT-B3-G006-RUNTIME-VERIFY-LATEST.json`](./TT-WAIT-WINDOW-REALITY-AUDIT-B3-G006-RUNTIME-VERIFY-LATEST.json)

**Scope:** Community 评论生产契约（`Idempotency-Key` + CORS 错误透传）  
**Not in scope:** Media 404（→ **B3-G-007**）· Discover · Guide detail · 资金执行  
**Frozen untouched:** Mainnet Reality · FTB · Registry v1 · Wired · Track1  
**`TT_PRODUCTION_GO`:** `NO_GO` · **≠** Reality Seal

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Deploy

| App | Result | Note |
|-----|--------|------|
| `tt-api-prod` | OK | Tip redeploy after migration checksum restore; CORS outermost live |
| `tt-web-prod` | OK | `release_identity` `git_sha=c3eeaf10…` · `build_time=2026-08-10T17:03:12Z` · JS 含 Idempotency-Key |

---

## Runtime checks

| ID | Check | Result | Observed |
|----|-------|--------|----------|
| **RV-001** | Error + CORS ACAO | **PASS** | POST comments 无 Idempotency-Key → `400 missing_idempotency_key` + `access-control-allow-origin: https://www.web3-ttg.com` |
| **RV-002** | FE 发幂等头 | **PASS** | Official chunks 含 `Idempotency-Key` / `X-Idempotency-Key` |
| **RV-003** | 评论创建 | **PASS** | 登录态 PostDetailDrawer Send → `Comments · 1` · body `B3-G-006 RV comment create 20260810T1715Z`；无 Failed to fetch / CORS 假象 |
| **RV-004** | 重复提交回放 | **PASS** | 同 `Idempotency-Key` 双 POST（trust-growth/ingest 公写路径 · 同中间件）→ 同体回放 + ACAO |

---

## Media 404（单独登记）

| ID | Disposition | Summary |
|----|-------------|---------|
| **B3-G-007** | **OPEN_SEPARATE** | Community 孤儿 UUID 媒体 404；**不混入** B3-G-006 |

---

## Honesty

`B3-G-006 CLOSED ≠ Batch 3 CLOSED ≠ Reality Seal ≠ Production GO` · 无资金执行 · Mainnet/FTB/Wired/Track1 未动
