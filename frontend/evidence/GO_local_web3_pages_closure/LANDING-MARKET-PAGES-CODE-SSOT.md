# `/` + 自由市场三页 · 代码真源 SSOT（2026-06-03）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；**禁止**用 ① 绿集冒充 ②③ GO）

**本文档以磁盘代码为准**，对齐 UI 结构、设计 token、功能与 API 真/假边界。规格导读见 **88 §一** · **86 §6.0** · **29** · **94**；**不替代** spec 契约，但 **冲突时以 `frontend/` 现行树为准**。

---

## 0. 范围与命名

| 用户说法 | 路由 | 顶栏 / Hub |
|----------|------|------------|
| **Web3旅行** | **`/`** | L0 深条 · `pathname === "/"` 激活 |
| **旅行预约** | **`/market`** | 五主 `/market` · Hub 签 1/3 |
| **商家橱窗** | **`/market/provider`** | Hub 签 2/3 · **非** MARKET-L5 layout lock |
| **旅行收购** | **`/market/acquisition`** | Hub 签 3/3 · **非** MARKET-L5 layout lock |

**「三页市场」** = `/market` + `/market/provider` + `/market/acquisition`（不含 `/`）。  
**本轮审计四页** = **`/` + 三页市场** — 见 [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md)。

**Hub 导航 SSOT：** `components/market/MarketHubSubNav.tsx` — 三签互链，主站与子站共用。

---

## 1. 设计系统（三页 + `/` 对拍）

| 维度 | `/` Web3旅行 | `/market` 旅行预约 | 子站 provider / acquisition |
|------|--------------|-------------------|----------------------------|
| **双系统** | **Experience** 暖色行程壳 | **Dark Premium** 撮合控制台 | **Dark Premium** 子站壳 |
| **背景** | 十国 HD 静图 + Ken Burns（`LandingHomeAmbientBackdrop`） | `MarketAmbientBackdrop` → `WarmRouteFieldBackdrop` + `MarketDarkRouteSceneDecor` | 同左（共享 `MarketAmbientBackdrop`） |
| **叠层** | `bg-experience-landing-vignette` · `TT_MARKETING_HOME_AMBIENT_GLOW` · `TT_MARKETING_HOME_DOT_GRID` | 同左 vignette/glow/dot grid | vignette 经 AmbientBackdrop；Hero 用 `MarketHeroFrame variant="subsite"` |
| **Token 库** | `lib/marketingUi.ts` → `TT_MARKETING_HOME_*` | `TT_MARKETING_MARKET_L5_*` · `TT_MARKETING_MARKET_DARK_PATH` | `TT_MARKETING_MARKET_DARK_PATH.subsite*` · `TT_MARKETING_BTN_MARKET_PRIMARY` |
| **页脚** | `LandingFooter` + `TT_MARKETING_HOME_FOOTER_*` | `MarketPageFooter` → **同源** `LandingFooter` | 同左 |
| **触控/a11y** | Hero `#landing-hero-form` · focus ring | `data-tt-market-l5="1"` · filter/sort frozen attrs | `data-testid` provider/acquisition page |

**`/traveltrust`** 为独立 Cinematic 叙事（`modules/traveltrust-home/`），**不在**本四页范围。

---

## 2. `/` · Web3 旅行首页

**入口：** `app/(home)/page.tsx`（**无** `app/page.tsx`）

### 2.1 组件树

```
page.tsx
├── LandingHomeAmbientBackdrop(country)
├── 叠层：vignette · HOME_AMBIENT_GLOW · HOME_DOT_GRID
├── LandingHeroForm (#landing-hero-form)
│   ├── LandingHeroNavTabs（创新行程 | 自由市场 deep link）
│   └── LandingHeroAuxLinks
├── SECTION_BRIDGE → ItineraryResultsSection (#itinerary-results)
├── UnlockModal
├── FOOTER_TOP_FADE → LandingFooter
```

**逻辑：** `components/landing/useLandingPage.ts`

### 2.2 功能（① 真实现）

| 功能 | 行为 | 代码 |
|------|------|------|
| 创单 | **1×** `postItineraryCreate` → **1** 张预览卡（`ITINERARY_CARD_COUNT=1`） | `useLandingPage.handleSubmit` |
| AI 卡状态机 | **磨砂锁**直至国家/城市/时间/人数/预算齐备；**仅**本会话点击「AI 生成行程」成功后 `showLiveAiResults` 露真卡与订单入口（会话恢复 id **不**单独解锁） | `landingAiItineraryFormReady.ts` · `previewLocked` / `aiGenerateCommitted` |
| 行程内容 | HTTP 真 POST；body 由 **`generate_itinerary_mock`** 生成（**非 AI**） | `crates/api/.../itineraries.rs` |
| 预览解锁 | `UnlockModal` → **`getOrder`**；**无** `/pay` · **无** 真 USDC | `handleUnlockPay` |
| 持久化 | **`localStorage`**：`tt_landing_result_order_ids_v1` · `tt_landing_unlocked_order_ids_v1`；旧 session **一次迁移** | `landingItinerarySession.ts` · `localStorageJson.ts` |
| 跨 tab | `subscribeLandingItineraryStorage` + `storage` 事件 | `useLandingPage.ts` |
| 收藏 | **`FAV_ORDERS_KEY`**（`marketFavoritesStorage.ts`）↔ `/market` 订单收藏 | `toggleFavorite` |
| Hero→Market | `buildLandingToMarketHref` — `country` · `city` · **`days` 1–30 精确值** | `landingMarketDeepLink.ts` |
| 解锁回填 | 刷新后 `hydrateLandingUnlockedOrderDetails` + 剔除 stale id | `landingItineraryHydrate.ts` |
| 下游 | 解锁后 → **`/escrow/[id]`** 草稿 Experience → `/market?view=split&bindGuideToOrder=` | Escrow 链 |

### 2.3 UI 冻结

**五主 UI 已冻（2026-05-25）** — 仅允许数据链 / i18n / a11y；**禁止** Hero/结果区 layout/token 回流。  
SSOT：[`FIVE-MAIN-ROUTES-PHASE1-FREEZE`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [`app/(home)/README.md`](../../app/(home)/README.md)

### 2.4 ① 进度

| 状态 | 项 |
|------|-----|
| **已闭** | UI 壳 · 1×POST · localStorage+跨 tab · 收藏 sync · Hero 诚实 i18n · mock `content_images` |
| **②/③** | 真 USDC · AI · 服务端收藏 · Phase B 视频 · staging GO — [`WEB3-HOME-PHASE2-BACKLOG`](./WEB3-HOME-PHASE2-BACKLOG.md) |

---

## 3. `/market` · 旅行预约（撮合主入口）

**入口：** `app/market/page.tsx` → `useMarketPage()`

### 3.1 组件树（摘要）

```
MarketPageInner
├── MarketAmbientBackdrop + vignette/glow/dot grid
├── MarketPageHero（自定义行程 CTA · trip-days 快捷筛选）
├── MarketHubSubNav
├── MarketMainFilterBand · StickyFilterBar · MarketTravelFilterSummaryStrip
├── MarketFlowContextBanner（bindGuideToOrder 等）
├── MarketContentViewSortBar + MarketContent（orders | guides | split）
├── OrderDetailDrawer · GuideDetailDrawer · BookGuideModal · CustomItineraryModal
└── MarketPageFooter
```

**`<main>` 机读属性：** `data-tt-market-l5="1"` · `data-tt-market-ui-thaw="closed"` · `data-tt-market-filter-sort-frozen="1"`

### 3.2 筛选 / 排序 / URL

| 机制 | 实现 |
|------|------|
| URL SSOT | `lib/marketPageQuery.ts` + router sync in `useMarketPageRouterSync.ts` |
| Query 键 | `country` · `city` · `language` · `service` · `days` · `sort` · `view` · `filters` · `bindGuideToOrder` · … |
| 列表 refetch | **`GET /api/v1/discover/orders`** · **`GET /api/v1/guides`**；登录合并 **`GET /orders`**（已发布待选向导） |
| Debounce | **`300ms`**（`MARKET_LIST_REFETCH_DEBOUNCE_MS`） |
| 客户端过滤 | facet 多选 · trip-days · sort ** largely client-side**（① 诚实限制 → **②** MKT-FILT-P2-008/012） |
| 收藏 | `FAV_ORDERS_KEY` · `FAV_GUIDES_KEY` — **localStorage** + 跨 tab（`subscribeMarketFavoritesStorage`） |

### 3.3 UI 冻结

**MARKET-L5 + FILTER-SORT UI 已冻（2026-05-30）** — **仅** `/market` 主入口；子站 **不在** MARKET-L5 scope。  
SSOT：[`MARKET-L5-CLOSURE`](../GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) · [`MARKET-FILTER-SORT-UI-FREEZE`](../GO_local_marketing_front_closure/MARKET-FILTER-SORT-UI-FREEZE.md)

### 3.4 ① 进度

| 状态 | 项 |
|------|-----|
| **已闭** | L5 UI · URL 筛选同步 · debounce · discover/guides 读链 · 绑定/接单/自定义行程写链 · 收藏 localStorage · **2026-06 runtime 性能（非 UI）** |
| **②/③** | staging facet 对拍 · nil-guide · 服务端筛选 · 收藏 API · 写链/性能 staging — [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) **P2-001～014 · P3-001～006** |

---

## 4. `/market/provider` · 商家橱窗

**入口：** `app/market/provider/page.tsx` → `MarketStandaloneBusinessPage variant="provider"`

### 4.1 组件树

```
MarketStandaloneBusinessPage
├── MarketAmbientBackdrop
├── MarketHeroFrame(subsite) + MarketHeroTrustPills
├── MarketHubSubNav
├── intro panel + CTA（/provider/register · 打开 Studio）
├── MarketSubsiteFilterBar（country · category · sort）
├── MarketSubsiteMasonry + catalog/demo badge
├── MarketSubsiteListingDetailDrawer（?listing=）
├── MerchantShowcaseStudioModal（dynamic）
└── MarketPageFooter
```

**逻辑：** `useMarketStandaloneBusinessPage.ts` · `marketStandaloneBusinessPageUtils.ts` · `lib/marketSubsiteFilters.ts`

### 4.2 列表 / 筛选 / API

| 项 | 行为 |
|----|------|
| 列表 API | `GET /api/v1/market/provider/listings?country=&category=&sort=` |
| PG 真源 | `meta.source === "postgres_catalog"` → PG 行经 `marketCatalogAdapter` 成卡片形 |
| Demo 降级 | API 失败且 demo gate 开 → demo masonry + **`market_subsite_catalog_api_degraded_demo`** 提示 |
| 发布门闸 | API：`market_merchant_gate.rs`（role + paid entitlement + approved） |
| FE 预检 | `merchantPublishEligibility.ts` · `useMerchantShowcaseStudioModal.ts` · ActionGateChecklist |

### 4.3 UI 边界

- **非** MARKET-L5 layout lock；**非** 五主「页身」冻结表内独立行，但 **Hub 壳 / 氛围 / 页脚** 与 `/market` 同源 token。
- **① 已闭：** 筛选 URL + PG query + Studio FE 三门闸（2026-06-03）。

---

## 5. `/market/acquisition` · 旅行收购

**入口：** `app/market/acquisition/page.tsx` → `MarketStandaloneBusinessPage variant="acquisition"`

### 5.1 与子站差异

| 项 | acquisition |
|----|-------------|
| Studio | `AcquisitionCarryStudioModal` · `acquisitionPublishEligibility.ts` |
| 门闸 API | `acquisition_publish_gate.rs`（wallet · publish bond / trust≥700 · 频控 · escrow ack） |
| Bond | **`POST /me/acquisition/publish-bond`** · **`fulfillment-bond`** — **PG mock（①）**，非链上 |
| Hub 入口 | `/me/identities` 收购卡 → 本子站（**Hub UI 冻于 ME-IDENTITIES**，非本子站 layout lock） |
| 返回链 | `?returnUrl=` → identities back CTA |

其余 Masonry / FilterBar / Drawer 结构与 provider **同构**（`variant` 分支）。

### 5.2 ① 进度

| 状态 | 项 |
|------|-----|
| **已闭** | PD-009 数据链 · 筛选 · listing CRUD 门闸 · mock bond |
| **②** | staging bond 真链 · 筛选 staging — **轨 5** + MKT-FILT-P2-003 等 |
| **③** | 生产 bond 真链 — [`acquisition-publish-trust-rules §8.3`](../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md) |

---

## 6. 存储与跨页同步（系统级）

| 键 / 模块 | 用途 | 存储 |
|-----------|------|------|
| `tt_landing_result_order_ids_v1` | `/` 预览卡 id | localStorage |
| `tt_landing_unlocked_order_ids_v1` | `/` 已解锁 id | localStorage |
| `traveltrust_market_fav_orders` | `/` + `/market` 订单收藏 SSOT | localStorage |
| `traveltrust_market_fav_guides` | `/market` 向导收藏（**/` 不同步** — 设计） | localStorage |
| **`GET/POST /api/v1/me/market-bookmarks`**（F-020） | 后端 + `marketTravelBookmarksSync.ts` · **`/` + `/market` 已登录 best-effort 同步** | **②** 跨设备 SLA / staging 强一致 → **WEB3-P2-009 / MKT-FILT-P2-009** |
| `marketFavoritesStorage.ts` | 收藏读写 + legacy 合并 | — |
| `landingItinerarySession.ts` | landing 预览 + subscribe | — |

---

## 7. 机读验收（① · 四页相关）

```bash
cd frontend
bash ../scripts/dev/run-web3-itinerary-l5-green.sh
npx vitest run lib/landingItinerarySession.test.ts lib/marketFavoritesStorage.test.ts \
  lib/marketSubsiteFilters.test.ts components/market/marketStandaloneBusinessPageUtils.test.ts \
  lib/provider/merchantPublishEligibility.test.ts components/market/useMarketPage.contract.test.ts
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh    # `/` 走廊
bash scripts/dev/smoke-provider-onboarding-local.sh          # provider
bash scripts/dev/smoke-acquisition-pd009-local.sh            # acquisition
```

---

## 8. 文档读序（维护者）

0. **五主路由企业级对拍（含 `/traveltrust` · `/did-rank` · `/community`）** — [`FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603`](../GO_local_marketing_front_closure/FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md)
1. **本文** — 四页代码/UI/功能真源  
2. [`app/(home)/README.md`](../../app/(home)/README.md) · [`app/market/README.md`](../../app/market/README.md) · [provider](../../app/market/provider/README.md) · [acquisition](../../app/market/acquisition/README.md)  
3. [`WEB3-LANDING-MARKET-LOCAL-REMAINING.md`](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md) — ① 诚实边界  
4. **spec 导读（已互指本文）** — **fundraising/external/03-FAQ · 00-README · 01-OnePager · 05-Litepaper · en/00-README · en/01-OnePager · en/05-Litepaper** · **product-manager/30 · 18 · 29 · 31 · 35 · 26 · 32 · 34 · 36 · 25 · 27 · README** · **runbook/TT-U02** · **product-manager/23 · 33** · **fundraising/internal/10** · **15 读前** · **runbook/TT-B472 §3.1** · **缺口与待补 读前** · **46 合并/待优化/43-46整合** · **TT-UI-V2 §5/§5b** · **TT-TOURIST-ORDER-ESCROW** · **PHASE1_5 真源地图** · **04-业务逻辑 §2.3/§2.4** · **18-补充 读前/实现注** · **43 §一 P5/P7** · **46-企业级 §一 useMarketPage** · **56 §6附.3附 /market** · **53-200ms 读前 debounce 注** · **18 读前** · **53-API-ABI 读前** · **数据库与UI-全方位** 文首 · **49 建议/企业级审计 读前** · **46-模块化 §一 useMarketPage** · **37 读前** · **snapshots/58 P16 补丁** · **snapshots/28-自定义行程弹窗** · **runbook/TT-local-user-journey** · **14 读前/§discover/orders** · **23 读前** · **42 读前** · **数据库表与UI** 文首 · **runbook/TT-9628 §0.0.2a** · **runbook/TT-TOURIST-JOURNEY-PROGRAM** · **spec/00 读前 25/29** · **30 §2.1** · **11 §D-12** · **92 §四** · **handbook/00 §3 · handbook/00-eng** · **05 读前** · **45 §3.1** · **21 读前** · **22 读前** · **22-补充 读前** · **52 相关文档** · **80** · **09** · **17 §②/§三** · **33** · **32** · **34** · **39** · **43** · **54 P54-009** · **96-16** · **96-20 §5.5** · **88 §1.4** · **29** · **29-企业级检查清单** · **42** · **94** · **95 §7.2** · **code-maps/28-补充** · **code-maps/62-补充-01** · **code-maps/57** · **handbook 01 §1/§3/§4** · **handbook 20-B** · **handbook 05 §2/§3** · **handbook 04 §3** · **handbook 03 §3** · **handbook 24 Owner** · **handbook/README** · **07 §5.3 2c** · **13 读前** · **AGENTS.md** · **CONTRIBUTING pre-push** · **AI协作话术 §0.3** · **AI任务卡索引 执行通则** · **scripts/README** · **scripts/INDEX** · **runbook/README §1a** · **runbook/TT-B312** · **TT-9625** · **TT-9627 §2.2-a** · **solo-dev-rhythm §6.5** · **测试账号 §零** · **ENTERPRISE-SITE-10 §1.2** · **dev-local-smoke-baseline §10** · **14-附录** · **snapshots/28** · **snapshots/28-截图** · **snapshots/28-企业级** · **snapshots/60** · **snapshots/61** · **25 §四** · **WEB3-HOME-PHASE2-BACKLOG**  
5. **②/③ backlog** — [`WEB3-HOME-PHASE2-BACKLOG`](./WEB3-HOME-PHASE2-BACKLOG.md) · [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md)

**最后对齐：** 2026-06-03 · ① 四页数据链已闭 · ② **Not Started**（须 G-1/G-2）

---

## 9. 文档勘误（本轮检查 · 以代码为准）

| 旧文档说法 | 代码真值 |
|------------|----------|
| **`landingItinerarySession` = sessionStorage**（**80** · **34** · **62** · **29 §7.1** 等，已修） | **`localStorage`** + 旧 session 一次迁移 |
| **29 §7.1「无参只请求一次 + 纯前端过滤」**（**v1.3.6 前**） | **`getDiscoverOrders({ country?, city?, limit, cursor? })` + 300ms debounce + 客户端 tripDays/bindGuide 过滤** |
| **收藏 = localStorage + 已登录 PG 同步**（**95 §7.2** 历史叙述） | **① localStorage SSOT + F-020 best-effort（已登录）**；`data-tt-*-favorites-mode="localstorage-f020-sync-v1"` → **②** 跨设备 SLA |
| **子站 = demo only** | **PG catalog** 优先；demo 仅 API 失败降级 |
| **收购 Hub UI 冻于子站** | **Hub 冻于 `/me/identities`**；子站 **非** ME-IDENTITIES layout lock |
| **MARKET-L5 含 provider/acquisition** | **MARKET-L5 仅 `/market` 主入口** |
