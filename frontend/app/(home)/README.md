# `/` Web3 旅行首页 · 代码 SSOT

**① 本地 UI 壳：已冻结（2026-05-25）** · 五主路由互证：[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

**四页代码/UI 总 SSOT（以现码为准）：** [LANDING-MARKET-PAGES-CODE-SSOT.md](../../evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)

**唯一路由入口：** `page.tsx`（路由组 `(home)`，**无** `app/page.tsx`）。

## 组件树（以 `page.tsx` 为准）

```
page.tsx
├── LandingHomeAmbientBackdrop(country)
├── 叠层：bg-experience-landing-vignette · TT_MARKETING_HOME_AMBIENT_GLOW · TT_MARKETING_HOME_DOT_GRID
├── LandingHeroForm          ← useLandingPage 状态/提交
├── TT_MARKETING_HOME_SECTION_BRIDGE（Hero → 结果区分隔）
├── ItineraryResultsSection  ← #itinerary-results
├── UnlockModal
├── TT_MARKETING_HOME_FOOTER_TOP_FADE（页脚顶部分隔）
└── LandingFooter            ← TrustInfraWall · TT_MARKETING_HOME_FOOTER_*
```

| 层级 | 文件 / 符号 |
|------|-------------|
| 页壳 | `page.tsx` — 上树；`aria-label` = `landing_hero_kicker` |
| 逻辑 | `components/landing/useLandingPage.ts` |
| Session | `lib/landingItinerarySession.ts` — **`localStorage`** 恢复 result/unlock（**跨 tab** · 旧 session 一次迁移）；**收藏** SSOT [`marketFavoritesStorage.ts`](../../lib/marketFavoritesStorage.ts) ↔ `/market` **`FAV_ORDERS_KEY`** |
| 市场深链 | `lib/landingMarketDeepLink.ts` — Hero「自由市场」Tab 带 `country` / `city` / `days` query |
| 常量 | `components/landing/constants.ts` — **`ITINERARY_CARD_COUNT = 1`** · `UNLOCK_PRICE_USD`（**@deprecated** · 仅 `archive/ui-v1`；① 解锁 **不** 用此价） |
| Hero+表单 | `LandingHeroForm.tsx`（`#landing-hero-form`）内嵌 `LandingHeroNavTabs` · `LandingHeroAuxLinks` |
| 结果 / 解锁 / 页脚 | `ItineraryResultsSection` · `UnlockModal` · `LandingFooter` |
| 视觉 token | `lib/marketingUi.ts` — `TT_MARKETING_HOME_*`（叠层、页脚、解锁钮等） |
| 十国背景 | `LandingHomeAmbientBackdrop.tsx` + `lib/landingAmbientByCountry.ts` + `.tt-home-ambient-ken-burns` |

**勿与以下混读：**

- `frontend/archive/ui-v1/` — V1 只读快照，**非**运行时代码
- 文档中历史路径 `app/page.tsx` — 已移除
- **`/traveltrust`** — 融资向网络叙事，组件在 `modules/traveltrust-home/`（**非** 本页 Web3 行程任务流）

**规格互指：** [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [86 §6.0](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) · [GO_local_web3_itinerary_l5](../../evidence/GO_local_web3_itinerary_l5/README.md) · [80 §0.1](../../../docs/spec/80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)

## ① Phase A 数据链（代码真源 · 2026-05）

| 步骤 | 行为 | 实现 |
|------|------|------|
| 1 填表 | 国家/城市/日期区间→`days`、景区/餐饮/酒店多选、预算、`party_size` / `num_rooms` | `LandingHeroForm` → `handleSubmit` |
| 2 创单 | **单次** `postItineraryCreate` → **1** 个 `order_id`；**禁止**循环多次 POST（`useLandingPage.contract.test.ts` 断言） | `useLandingPage.ts` |
| 3 展示 | **`ITINERARY_CARD_COUNT=1`** 张预览卡，绑定同一 `order_id`；配图 `landingAmbientImageUrl(country)` | `ItineraryResultsSection.tsx` |
| 4 持久 | `resultOrderIds` / `unlockedOrderIds` / `favoritedIds` 写入 **`localStorage`**（跨 tab · 旧 session 自动迁移）；刷新后 `hydrateLandingUnlockedOrderDetails` 拉 `getOrder` 回填详情，失效 id 自动剔除 | `landingItinerarySession.ts` · `marketFavoritesStorage.ts` · `landingItineraryHydrate.ts` |
| 4a 收藏 | **`FAV_ORDERS_KEY`**；已登录 **F-020** `pullMarketTravelBookmarksIntoLocal`（`marketTravelBookmarksSync.ts`）· `data-tt-home-favorites-mode` | `useLandingPage.ts` |
| 4b 深链 | Hero「自由市场」Tab → `buildLandingToMarketHref({ country, city, days })` | `landingMarketDeepLink.ts` · `LandingHeroNavTabs` |
| 5 解锁 | 弹窗确认 → **`getOrder(orderId)`** 拉详情；**非** 链上 USDC 扣款；失败走 `unlockError` / 未登录 `loginRequired` | `UnlockModal` · `handleUnlockPay` |
| 6 下游 | 解锁后「查看订单详情」→ **`/escrow/[id]`**（**[订单页 ① 收口 2026-05-28](../../evidence/GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md)**）→ 保存发布 → `/market?view=split&bindGuideToOrder=` | [GO_local_web3](../../evidence/GO_local_web3_itinerary_l5/README.md) · [`app/escrow/[id]/README`](../escrow/[id]/README.md) |

**文案 IA：** 顶栏「Web3旅行」= 站点入口（`Header` + `headerNavItemIsActive` 仅 `pathname==="/"`）；Hero kicker + Tab「创新行程」= 当前任务（`landing_hero_kicker` / `landing_cta_create`）。

**动态背景（① Phase A）：** 每国 1 张 HD 静图 + Ken Burns（18s）；**Phase B 视频层 → ②③**（见 `public/media/landing/README.md`）。

**页脚（221-D · ① 已收口）：** `LandingFooter` + `TT_MARKETING_HOME_FOOTER_*`；`hideFeeRouterLinks` 去重；链 **min-h 44px**。

### 三阶验收台账（`/` 首页 · 禁止跳阶）

| 阶 | 范围 | ① 本地已闭 / 可验 | 本阶待办 |
|----|------|-------------------|----------|
| **①** | 本机 | UI 壳 SSOT、1×POST+1 预览卡、**localStorage** 恢复（跨 tab · 解锁详情回填 · 收藏 · Hero→Market query）、Ken Burns、页脚 token、contract + `LandingFooter.test` | — |
| **②** | 测试网 | **WEB3-P2-001～012**（[`WEB3-HOME-PHASE2-BACKLOG`](../../evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md)） | 全链 · 真 USDC · 视频 · E2E · **账号态 session** · R-003 GO · 收藏 API · AI 生成 |
| **③** | 生产 | **WEB3-P3-001～006**（同 backlog §③） | PSP · 主网 Escrow · **go-live** / Production GO · 收藏 GDPR |

**② 入口：** [WEB3-HOME-PHASE2-BACKLOG](../../evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) · [PHASE2-TESTNET-ACCEPTANCE · 轨 8](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · **③：** [go-live-checklist](../../../docs/go-live-checklist.md#go-decision-entry-point)

**① 机读验收：**

```bash
cd frontend
bash ../scripts/dev/run-web3-itinerary-l5-green.sh
# 或子集：
npx vitest run lib/landingAmbientByCountry.test.ts "app/(home)/homeMarketing.contract.test.ts" \
  components/landing/itineraryResultsSection.contract.test.ts \
  components/landing/useLandingPage.contract.test.ts \
  components/landing/unlockModalUx.contract.test.ts \
  components/landing/LandingFooter.test.tsx
npm run doctor:3012   # GET / → 200
```

**走廊 10 / 全站 10：** `bash scripts/dev/run-enterprise-local-10.sh` · `bash scripts/dev/run-enterprise-site-10-local.sh`（见 [ENTERPRISE-SITE-10-L5-MATRIX](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md)）

**全站主题外溢：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](../../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md) · [V1-PERCEPTION-CHECKLIST](../../evidence/GO_local_site_theme_v1/V1-PERCEPTION-CHECKLIST.md)
