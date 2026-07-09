# Runtime Truth Gap Report

**Review ID:** `RT-AUDIT-20260704`  
**Review date:** 2026-07-04  
**Audit layer:** **② Runtime Truth Audit**（Call Graph · 运行时路径为唯一事实来源）  
**Companion:** [Implementation Reality](RUNTIME-TRUTH-AUDIT-RUNBOOK.md#0-三层审计模型production-go-前置)（①）· [Production Readiness Master Gap Report](PRODUCTION-READINESS-MASTER-GAP-REPORT.md)（③）  
**Machine SSOT:** [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml)  
**Owner:** Sebastian Ward

---

## 0. Executive Summary

| 项 | 裁定 |
|----|------|
| **Scope** | Community · Market Discover · Official Guide · Campaign · Provider · Acquisition |
| **Method** | Frontend → API → Builder/DB Adapter → Governed View → DB（静态 Call Graph + 代码走读） |
| **OPEN Runtime BLOCKER** | **5**（已登记 Master Matrix） |
| **OPEN Runtime DEFECT** | **3**（P1 · 自 Implementation Reality 复核转入） |
| **EXPECTED DIFFERENCE** | **1**（作者 me/posts 直读业务表 · 设计确认） |
| **Production GO** | **NO_GO**（本 Report 不单独改 GO；叠加 Matrix 原 18 BLOCKER） |

**一句话：** PCP Builder **在 Feed/Hot/Search 运行时路径中已履行**（re-export 模式）；**Detail / Profile 公开列表缺少 Feed 同级 content_readiness 过滤**；**Market Discover 列表未走 `governed_discover_orders_v1`**；**Registry 多项 CLOSED 证据未入库不可复现**。

---

## 1. 三层审计状态

```text
① Implementation Audit      COMPLETE (2026-07-04 code walk)
② Runtime Truth Audit       COMPLETE (this report · RT-AUDIT-20260704)
③ Production Readiness      ACTIVE · G1 IN_PROGRESS · G2/G3 Gate NOT_STARTED
```

---

## 2. Community · Call Graph 矩阵

| Surface | Frontend | API | Builder / Adapter | Governed View | Post-filter | Verdict |
|---------|----------|-----|-------------------|---------------|-------------|---------|
| **Feed** | `getFeed` | `GET …/community/feed` | `feed_builder::list_feed` → `db::list_feed` | `governed_community_posts_v1` | `filter_feed_posts_content_readiness` | ✅ Unified |
| **Hot** | `getFeed mode=hot` | 同上 | `feed_builder::list_feed_hot` | 同上 | 同上 | ✅ Unified |
| **Search** | `getFeed?q=` | 同上 | `feed_builder::list_feed` + text | 同上 | 同上 | ✅ Unified |
| **Following** | `getFeed mode=follow` | 同上 | `feed_builder::list_feed_by_following` | 同上 | 同上 | ✅ Unified |
| **Detail** | `postById` | `GET …/posts/:id` | `db::get_governed_public_post_by_id` | ✅ | ❌ **无 JSON filter** | 🔴 **PRM-RT-B001** |
| **Profile (public)** | `userPosts` | `GET …/users/:id/posts` | `db::list_posts_by_user` public | ✅ when `public_only` | ❌ **无 JSON filter** | 🔴 **PRM-RT-B002** |
| **Profile (owner me)** | `mePosts` | `GET …/me/posts` | `db::list_posts_by_user` | **`community_posts` 直读** | N/A | 🟦 **PRM-RT-E001** 设计双路径 |
| **Explore feed** | `useCommunityExplorePage` → `getFeed` | 同 Feed | 同 Feed | 同 Feed | 同 Feed | ✅ Unified |
| **Explore destinations** | `getExploreDestinations` | `GET …/explore/destinations` | `db::list_explore_destination_counts` | `governed_community_posts_v1` | N/A aggregate | ✅ Unified |
| **Stats by tag** | `statsPostsByTag` | `GET …/stats/posts-by-tag` | `db::count_public_posts_with_tag` | governed | N/A | ✅ Unified |
| **Campaign embed** | Feed 内 Official/Campaign 帖 | 同 Feed | 同 Feed | governed + data_origin | Feed filter | ✅ Unified |
| **Admin** | `/admin/community/*` | admin routes |  moderation 专用 | 混合（管理面） | 管理策略 | ✅ 预期分离 |

### 2.1 Detail 绕过示意（PRM-RT-B001）

```text
Feed:   posts.rs → feed_builder → governed_view → filter_feed_posts_content_readiness ✅
Detail: posts.rs → get_governed_public_post_by_id → JSON 直出 ❌ (缺同级 filter)
```

**风险：** legacy/demo 媒体或 showcase 帖可在 Feed 不可见，但 **Deep link / share URL 仍可达**。

---

## 3. Market · Call Graph

| Surface | Frontend | API | Data path | Governed View | Verdict |
|---------|----------|-----|-----------|---------------|---------|
| **Discover list** | `getDiscoverOrders` | `GET /api/v1/discover/orders` | `chain_off::discover_orders_list_impl` · **内存 store** | `governed_discover_orders_v1` **未用于列表** | 🔴 **PRM-RT-B003** |
| **Guides catalog** | market guides | `GET /api/v1/guides` | `guides_list_impl` → `list_governed_market_guides` | `governed_market_guides_v1` | ✅ Unified |
| **Provider listings** | provider studio | `GET …/market/provider/listings` | `list_market_listings_by_variant` | `governed_market_listings_v1` when production profile | ✅ Unified |
| **Acquisition listings** | acquisition | `GET …/market/acquisition/listings` | 同上 | 同上 | ✅ Unified |
| **Listing detail** | detail page | `GET …/listings/:id` | `select_public_market_listing_by_id` | governed when production profile | ✅ Unified |

**说明：** Discover 路径在 production profile 下仍用 **chain_off 内存聚合 + Rust 过滤**，与 PG `governed_discover_orders_v1` **双轨并存** — 属于 **DUAL_PATH**，非 grep 可单独判定。

---

## 4. Campaign / Official Guide · Call Graph

| Surface | Frontend | API | Adapter | Governed | Verdict |
|---------|----------|-----|---------|----------|---------|
| **Cold Start consumer** | `coldStartCampaign/client.ts` | `GET …/official/cold-start/surfaces/:surface` | `get_deployed_campaign_for_surface` → `get_governed_campaign_for_surface` | ✅ | ✅ Unified |
| **Guides** | market UI | `GET /api/v1/guides` | db adapter（非 `use pcp::market_builder` import） | `governed_market_guides_v1` | ✅ Runtime OK · 模块 import 非判据 |

**PCP Builder 结论（Call Graph）：** `feed_builder` / `market_builder` / `campaign_builder` 为 **db re-export 层**；运行时 **Feed 经 feed_builder**；**Guides/Campaign 经 db adapter 直连 governed 函数** — **不是 dead code**，但 **Discover 未接 governed view 列表**。

---

## 5. Provider / Acquisition · Call Graph

```text
Frontend (/market/provider|acquisition)
  → GET /api/v1/market/{variant}/listings
  → market_subsite::listings_for_variant
  → db::list_market_listings_by_variant
       └─ production profile: list_governed_market_listings_by_variant (governed_market_listings_v1)
       └─ dev profile: market_listings 直读 (DUAL_PATH · 预期 dev-only)
  → chain_off 二次过滤 (data_origin · display_origin)
```

**Verdict：** 生产 profile 下 **✅ Unified**；与 Discover **不同架构**（PG catalog vs chain_off store）。

---

## 6. Gap Register（Master Matrix 对照）

### 6.1 Implementation Reality → Matrix（用户 RG-* 复核）

| User ID | Matrix ID | Class | Title |
|---------|-----------|-------|-------|
| RG-EVID-001 | **PRM-EVID-B001** | BLOCKER | Closure evidence dirs untracked — clean clone cannot reproduce CLOSED |
| RG-REG-001 | **PRM-REG-B001** | BLOCKER | Registry CLOSED claims not verifiable from repository alone |
| RG-COMM-001 | **PRM-RT-B001** | BLOCKER | Community Detail lacks Feed-equivalent content_readiness filter |
| RG-CI-001 | **PRM-CI-D001** | DEFECT | Content/Media/L5 validators not in default main CI delivery minimum |
| RG-GUARD-001 | **PRM-GUARD-D001** | DEFECT | Community media guard skips DB scan in CI (`SKIP_COMMUNITY_MEDIA_GUARD_DB=1`) |
| RG-MIG-001 | **PRM-MIG-D001** | DEFECT | Migration compatibility lacks automated regression gate |

### 6.2 Runtime Truth 专属

| Matrix ID | Class | Title |
|-----------|-------|-------|
| **PRM-RT-B002** | BLOCKER | Community public profile posts lack content_readiness JSON filter |
| **PRM-RT-B003** | BLOCKER | Discover orders list uses chain_off memory — not `governed_discover_orders_v1` |
| **PRM-RT-E001** | EXPECTED_DIFFERENCE | Owner `me/posts` reads `community_posts` for private/archived (by design) |

---

## 7. G2 / G3 措辞校正（③ 层）

| 禁止说法 | 正确说法 |
|----------|----------|
| G2 没实现 | **G2 Gate 自动验证尚未实现**（缺 gate script）；Security 实现可能在 Rust/API/tests |
| G3 没实现 | **G3 Gate 尚未 START**；Deployment runbook 可能已就绪 |
| PCP Builder 未使用 | **须 Call Graph 判定** — Feed 已用 re-export Builder；Guides/Campaign 用 db adapter |

---

## 8. P0 闭合状态（2026-07-04）

| Gap | Status | Fix |
|-----|--------|-----|
| **PRM-RT-B001** | **CLOSED** | `public_post_json_for_content_readiness` on Detail |
| **PRM-RT-B002** | **CLOSED** | `filter_feed_posts_content_readiness` on public Profile |
| **PRM-RT-B003** | **CLOSED** | Discover ∩ `governed_discover_orders_v1` when production profile |
| **PRM-EVID-B001** | **CLOSED** | Evidence package in-repo |
| **PRM-REG-B001** | **CLOSED** | Matrix reconcile + validators reproducible |

**Evidence:** `evidence/GO_production_readiness/runtime-truth-p0/20260704T011009Z/`

```bash
bash scripts/dev/run-runtime-truth-p0-closure.sh
```

**Machine key:** `TT_RUNTIME_TRUTH_P0: PASS`

---

## 9. 闭合顺序（剩余 P1）

1. **P1：** PRM-CI-D001 · PRM-GUARD-D001 · PRM-MIG-D001
2. **Re-run：** `bash scripts/dev/run-runtime-truth-p0-closure.sh`

---

## 9. 诚实边界

- 本 Report = **② Runtime Truth** · **① 本地 Call Graph** · **非 ② staging 全矩阵 · 非 ③ Production GO**
- Community Feed G1 PASS **不自动** 等于 Detail/Profile/Discover 全路径 PASS
- ISS-007 / 窄切片 GO **不得** 冒充本 Report 全域 CLOSED

---

**Sign-off command:**

```bash
node scripts/dev/audit-runtime-truth-call-graph.cjs
node scripts/dev/validate-production-readiness-master-matrix.cjs
```

**Owner sign-off:** Sebastian Ward · 2026-07-04
