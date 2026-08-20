# TT · Wait Window · Reality Audit · Batch 2 Gap Inventory（LATEST）

**STATUS:** `GAP_INVENTORY · FIX_NOW`  
**Stamp:** `2026-08-10T14:40:00Z`  
**Parent:** [`TT-WAIT-WINDOW-FINAL-REALITY-AUDIT-LATEST`](./TT-WAIT-WINDOW-FINAL-REALITY-AUDIT-LATEST.md)  
**Mode:** 展示 / API 对拍 / 状态诚实 · **禁止** Timelock / Release / FeeRouter execute / GO

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## CHECK 摘要（Official）

| 面 | 发现 |
|----|------|
| Discover API | `GET /api/v1/discover/orders` → **17/17 `draft`** · `amount=1200 USD` · `escrow_address=null` · `guide_id=nil` |
| Market FE | 游客 `filterDiscoverOrdersForViewer` **`!ownId → return true`** → Draft 金额全进左栏（骗人） |
| Status map | `released` 与 `completed` 同映 `order_status_completed` → 缺「已释放」 |
| Guide earnings | `GuideBillingPeriodCard` / `GuideDashboardStats` 后缀 **USDT** · Reality 结算币 **USDC** |
| Fee 黑话（旅客） | Auth FeeRouter 已在 B1 藏；治理/Admin 保留只读 FeeRouter/RegionVault 文案 **ACCEPT**（非旅客主链） |
| Reality 链上 | Escrow Funded · **未** Release → 官网不得写收益到账 / 已分账 |

---

## Gaps

| ID | Sev | Disposition | Finding |
|----|-----|-------------|---------|
| **B2-G-001** | P0 | **FIX_NOW** | 游客 Market 展示 Draft+金额；filter 对匿名放行全部 discover 行 |
| **B2-G-002** | P1 | **FIX_NOW** | `released` → 显示 Completed，非 Released |
| **B2-G-003** | P1 | **FIX_NOW** | Guide/Provider 工作台金额后缀 USDT → 应 USDC |
| **B2-G-004** | P1 | **DEFER→B3** | Discover/DB 仅 Draft 脏数据（需数据/API 治理；本批 FE 先挡游客） |
| **B2-G-005** | P2 | **ACCEPT** | Guide「Expected vs Settled orders count」文案已区分预计/已结算单数（非 RegionVault） |
| **B2-G-006** | P2 | **ACCEPT** | 治理页 FeeRouter/RegionVault 只读披露 · 非旅客商业主链 |
| **B2-G-007** | P2 | **DEFER→B6** | `/guide` 登录态长骨架（性能） |

---

## Explicit non-goals

Timelock.execute · Escrow.release · Settlement/FeeRouter 执行 · TrustedFactory · Production GO · Migration 大整理
