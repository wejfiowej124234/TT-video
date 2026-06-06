# 五主路由 · 企业级代码真源对拍审计（2026-06-03）

**阶段口径：** **① 本地** → **② 测试网** → **③ 公网/生产**（须顺序；**禁止**用 ① 文档/绿集冒充 ②③ GO）

**审计方法：** 以 **`frontend/app/*`** · **`frontend/components/*`** · **`frontend/lib/*`** · **`crates/api/src/routes/*`** 为唯一实现真源；对照 **工程 README** · **evidence 冻结文** · **spec 29/30/31/85/88/04**；**不**改 UI/layout/token。

**互指：** [FIVE-MAIN-ROUTES-PHASE1-FREEZE](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [FIVE-PAGES-L5-AUDIT-TASKS](./FIVE-PAGES-L5-AUDIT-TASKS.md) · [GO_local README](./README.md) · [LANDING-MARKET-PAGES-CODE-SSOT](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)

**最后对拍（① · 2026-06-03）：** 五路由 **README + 本文件 §3** 与下列实现锚点一致 — `ITINERARY_CARD_COUNT=1`（`components/landing/constants.ts`）· `MARKET_LIST_REFETCH_DEBOUNCE_MS=300`（`components/market/useMarketPage.ts`）· `marketTravelBookmarksSync.ts` · `didRankDevPreviewGate.ts` · `communityShowcase.ts` · `crates/api` `feed?q` / `me/activity` / `explore/destinations`。

---

## 1. SSOT 读序（维护者 · 写死）

| 优先级 | 文档 / 代码 |
|--------|-------------|
| 1 | 本审计 + 各 **`frontend/app/*/README.md`**（及 **`modules/traveltrust-home/README.md`**） |
| 2 | **FIVE-MAIN** · **LANDING-MARKET**（`/` + 三页市场）· **DID-RANK/COMMUNITY PHASE1-FREEZE** |
| 3 | **88 §一** · **86 §6.0.1** · **04 §3.4** 路由登记 |
| 4 | **29 / 30 / 31 / 85** 规格（导读；冲突以 **frontend/** 为准） |
| 5 | **07 / 95 / snapshots/** 历史层（**非** ① 实现 SSOT，见 §6） |

---

## 2. 十维对拍矩阵（五路由 × 企业级检查项）

图例：**✅ ① 与代码一致** · **⚠️ ① 子集/诚实占位** · **❌ ②/③ 未闭**

| 维度 | `/` | `/traveltrust` | `/market` | `/did-rank` | `/community/*` |
|------|-----|----------------|-----------|-------------|----------------|
| **A 路由入口** | ✅ `app/(home)/page.tsx` | ✅ `app/traveltrust/page.tsx` → module | ✅ `app/market/page.tsx` | ✅ `app/did-rank/page.tsx` SSR | ✅ `app/community/*` 18 子路由 |
| **B UI 冻结** | ✅ FIVE-MAIN | ✅ layout lock | ✅ MARKET-L5 仅主入口 | ✅ 竖脊五签 | ✅ L1/壳 premium |
| **C 主 HTTP** | ✅ `POST itineraries` · `GET orders/:id` | ⚠️ 示意 swap/page-brief → ② | ✅ discover/guides/orders | ✅ 五榜 + prize-pool | ✅ feed/posts/social/feedback |
| **D 客户端存储** | ✅ `localStorage` session | — | ✅ fav keys + F-020 sync | — | ⚠️ feedback 失败时 local-mixed |
| **E 机读 `data-tt-*`** | ✅ home fav mode | ✅ layout lock tests | ✅ market-l5 / fav mode | ✅ phase1-frozen / prize illustrative | ✅ feed-search / activity-scope / explore-catalog |
| **F 失败诚实** | ✅ 无 mock 回退 | — | ✅ API error + retry | ✅ 无 didRankMock 运行时回退 | ✅ showcase 披露 + 生产硬关 |
| **G vitest 绿集** | ✅ homeMarketing 等 | ✅ layoutLock | ✅ marketTheme + thaw | ✅ `run-did-rank-l5-green` | ✅ `run-community-l5-green` 134 |
| **H 烟测（可选）** | ✅ web3-itinerary smoke | — | — | ⚠️ matrix E2E 须 :8080 | ⚠️ pi1-community E2E |
| **I ② 产品真值** | ❌ 真 USDC/AI | ❌ 真 swap/RPC | ❌ staging 密度 | ❌ 链上奖池/GMV | ❌ 通知收件箱/CDN |
| **J ③ GO** | ❌ go-live | ❌ 主网 | ❌ 生产 PSP | ❌ 主网榜 | ❌ 93 全矩阵 |

---

## 3. 分路由功能真源（代码为准）

### 3.1 `/` Web3旅行

| 项 | 真源 |
|----|------|
| 创单 | **1×** `postItineraryCreate` · **`ITINERARY_CARD_COUNT=1`** |
| 持久 | **`landingItinerarySession.ts`** → **`localStorage`**（跨 tab） |
| 解锁 | **`UnlockModal`** → **`getOrder`**（**非** 真 USDC） |
| 收藏 | **`marketFavoritesStorage.ts`** · 已登录 **`pullMarketTravelBookmarksIntoLocal`** |
| 机读 | **`data-tt-home-favorites-mode="localstorage-f020-sync-v1"`** |
| 下游 | **`/escrow/[id]`** → **`/market?bindGuideToOrder=`** |

**索引：** [`app/(home)/README.md`](../../app/(home)/README.md) · **LANDING-MARKET §2**

### 3.2 `/traveltrust` 网络叙事

| 项 | 真源 |
|----|------|
| 布局锁 | **`traveltrustHomeLayoutLockL5`** — hero→roles→liquidity→trust→settlement→faq→start |
| L1 | portal **`z-[280]`** · **CSS** 公告跑马灯 · **L1 标签对比度 closed ①** |
| 数据 | **无** 五主级业务 HTTP 主路径（TTG 示意 → ②） |
| 门禁 | **`traveltrustHomeModularityScore` 16/16** |

**索引：** [`app/traveltrust/README.md`](../../app/traveltrust/README.md) · [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md)

### 3.3 `/market` 旅行预约

| 项 | 真源 |
|----|------|
| 列表 | **`getDiscoverOrders`** + **`getGuides`** · **300ms debounce** |
| URL | **`marketPageQuery.ts`** / **`useMarketPageRouterSync`** |
| 收藏 | **localStorage SSOT** + **`marketTravelBookmarksSync`**（已登录 best-effort） |
| 机读 | **`data-tt-market-l5="1"`** · **`data-tt-market-favorites-mode="localstorage-f020-sync-v1"`** |
| 子站 | **provider/acquisition** — PG catalog · **非** MARKET-L5 layout lock |

**索引：** [`app/market/README.md`](../../app/market/README.md) · **LANDING-MARKET §3～§5**

### 3.4 `/did-rank` 排行榜

| 项 | 真源 |
|----|------|
| API | **`GET …/did-rank/{travelers,guides,itineraries,providers,acquisitions}`** + **prize-pool** |
| SSR | **`serverForwardAuthHeaders`** → **`is_me`** 首屏 |
| 深链 | **`?board=`** · **`?period=`** · **`?guide_sort=`** · **`?me=*`** |
| devPreview | **`didRankDevPreviewGate`** — **production 硬关** |
| 档案 | **`/community/user/[id]`**（拦截 devPreview UUID） |

**索引：** [`app/did-rank/README.md`](../../app/did-rank/README.md) · **DID-RANK-PHASE1-FREEZE**

### 3.5 `/community/*` TT社区

| 项 | 真源 |
|----|------|
| Feed | **`GET …/feed`** · 非空 **`q`** → **`feed_text_search_v1`** · **`api-text-q-v1` \| `client-filter-topic-v1`** |
| 活动 | **`GET …/me/activity`**（**notifications 同源**）· **`activity-events-v1` \| `likes-summary-v1`** |
| 发现 | **`GET …/explore/destinations`** · **`api-aggregate-v1` \| `static-v1`** |
| 反馈 | API 成功 → **`list-source=server`** only |
| showcase | **production / testnet profile 硬关** · dev 默认 + 披露 |
| 路由 | **`/community/me` redirect** · **`/community/tt`→explore** |

**索引：** [`app/community/README.md`](../../app/community/README.md) · **31 v2.13** · **COMMUNITY-PHASE1-FREEZE**

---

## 4. ① 验收命令（分轨 · exit 0）

```bash
# 五主 UI 并集（壳层 · 非全数据链）
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh

# `/` + `/market` 走廊 + escrow 相关
bash scripts/dev/run-web3-itinerary-l5-green.sh

# 排行榜
bash scripts/dev/run-did-rank-l5-green.sh

# TT 社区（134 tests）
bash scripts/dev/run-community-l5-green.sh
```

**② 专项：** [PHASE2-TESTNET-ACCEPTANCE](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · **G-0～G-4** — **实施 NOT STARTED**（[PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)）

---

## 5. 本轮文档勘误（AF-01～AF-13 · 以代码为准）

| ID | 漂移（旧述） | 代码真值 | 已修 SSOT |
|----|--------------|----------|-----------|
| **AF-01** | F-020「FE 未接线」 | **`marketTravelBookmarksSync`** 已接 **`/` + `/market`** | **88 §1.4** · **04 F-020 脚注** · 本表 |
| **AF-02** | activity 仅 likes-received | **`GET …/me/activity`** + events | **31 v2.13** · **app/community/README** |
| **AF-03** | Explore 仅 static-v1 | **`explore/destinations`** 聚合优先 | **31** · **COMMUNITY-PHASE1-FREEZE** |
| **AF-04** | Feed 搜索仅 client-filter | **`GET …/feed?q=`** + 双模式机读 | **31 §8** · **P1-CM-16** 审计表 |
| **AF-05** | did-rank 无 SSR `is_me` | **cookie → X-User-Id** | **30 v2.2.3** · **did-rank README** |
| **AF-06** | devPreview 仅 env | **production 硬关** | **didRankDevPreviewGate** · 冻结文 |
| **AF-07** | showcase dev 无界 | **production/testnet 硬关** | **communityShowcase.ts** · 冻结文 |
| **AF-08** | feedback 本地合并主路径 | 成功时 **server-only** | **useCommunityFeedbackRemoteList** |
| **AF-09** | **88 §1.4** market 收藏未接线 | **localstorage-f020-sync-v1** | **88 v1.0.320** |
| **AF-10** | **P1-CM-16** 仅 client-filter | 双模式 + API q | **DID-RANK-COMMUNITY-L5-AUDIT** |
| **AF-11** | 五页文档分散 | 本文件 + **GO_local README** 总表 | 本文 |
| **AF-12** | **04** feed 表缺 **`q?`** | **ILIKE** 子集 · hot/follow 跳过 | **04 §3.4 API 表**（本轮） |
| **AF-13** | 全仓 **F-020「未接线」** 漂移 | **`marketTravelBookmarksSync`** 已接 | **AGENTS** · **95** · **29/33/39/runbook** 等二轮扫尾 |

**仍有意的历史层（勿当 ① SSOT）：** **95 §7.2** 部分行 · **snapshots/28-*** · **07 changelog** 长表 · **85 §三 愿景 IA**（含 `#overview`）

---

## 6. 企业级结论（① · 2026-06-03）

| 维度 | 等级 | 说明 |
|------|------|------|
| **单一前端版本 + 五主 UI 冻结** | **A** | **FIVE-MAIN** 硬闸有效 |
| **五路由 ① 数据链文档↔代码** | **A** | **AF-01～AF-13** + 全仓入口（**00** · **docs/README** · **05** · **96-20** · **Cursor 规则**）；历史 **07/snapshots** 句若冲突 → 以 **本文件** + **LANDING-MARKET §9** 为准 |
| **五路由 ① 机读绿集** | **绿** | 分轨命令 §4 |
| **② 测试网产品 L5** | **未开工** | G 闸 · staging 密度 · 真 UGC/geo/通知 |
| **③ Production GO** | **未闭** | go-live · 93 全矩阵 · 主网资金 |

**禁止假完成：** ① 文档对拍 + vitest **≠** ② staging GO **≠** ③ Production GO（[CONTRIBUTING · 禁止假完成](../../../CONTRIBUTING.md#no-false-completion)）

---

## 7. ②③ backlog 入口（勿在 ① 实施）

| 路由 | SSOT |
|------|------|
| `/` | [WEB3-HOME-PHASE2-BACKLOG](../GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) |
| `/market` 三页 | [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG](../GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |
| `/traveltrust` | [TRAVELTRUST-NETWORK-PHASE2-BACKLOG](../GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) |
| `/did-rank` + `/community` | [DID-RANK-COMMUNITY-L5-AUDIT-TASKS](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) §②③ |
