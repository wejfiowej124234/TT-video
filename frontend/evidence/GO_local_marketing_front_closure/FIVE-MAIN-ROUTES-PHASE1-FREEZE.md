# 顶栏五主路由 · ① 本地 UI 壳冻结（2026-05-25 · 链路验证期 · 2026-05-25 硬闸）

**阶段：① 本地** — 以**当前仓库 `frontend/` 工作树**为**唯一前端版本 SSOT**；**不**表示 ② 测试网、③ 公网 Production GO、全站 **93** 矩阵已闭。

**互指：** [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [TT-PH1 波次 C](../../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md) · [V1-PERCEPTION-CHECKLIST](../GO_local_site_theme_v1/V1-PERCEPTION-CHECKLIST.md)（D10 已过）· 本目录 [README.md](./README.md)

### 五主路由 ① 机读绿集（2026-05-28 链路验证 · 12 files · exit 0）

**`/` 段含创新行程数据链契约**（**1×POST · `ITINERARY_CARD_COUNT=1`** 预览 · **localStorage** 恢复 · 预览解锁 · 无真 USDC）。全量编排：`bash scripts/gates/five-main-routes-ui-antiregression-gate.sh`  
**Escrow 草稿 Experience（非五主路由）：** [`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md) · `bash scripts/dev/run-web3-itinerary-l5-green.sh`

**含** **`communityShellTheme.contract.test.ts`**（**Y-01** 已闭 · import 运行时 token，非 regex 别名滞后）。

```bash
cd frontend
npx vitest run "app/(home)/homeMarketing.contract.test.ts" \
  lib/traveltrustHomeLayoutLockL5.test.ts \
  components/market/marketTheme.contract.test.ts \
  components/did-rank/didRankTheme.contract.test.ts \
  components/community/communityMainPathRg.contract.test.ts \
  components/community/communityPageTheme.contract.test.ts \
  components/community/communityShellTheme.contract.test.ts
```

---

## 单一前端版本真源（禁止文档分叉）

| 规则 | 说明 |
|------|------|
| **仅一套现行前端** | 全仓库**只有** `frontend/` 当前 Next App Router 实现；**无** 并行「文档版 UI」或第二套路由树 |
| **五主路由读序** | ① 本文件 → ② 各 `frontend/app/*/README.md`（及 **`modules/traveltrust-home/README.md`**）→ ③ **88 §一** → ④ **04 §3.4** 路由登记 |
| **非运行时** | **`frontend/archive/ui-v1/`** 为只读快照，**不得**当验收或实现 SSOT |
| **愿景/backlog** | **85 §三**、**86 §6.2 愿景 IA**、**07 长表** 中带 `#overview` / legacy 组件的条目 = **未实现或已下线**；冲突时以 **layout lock** + **contract 测试** 为准 |
| **文档更新（2026-05-26 · L1 批次）** | **`/traveltrust` L1** portal + **CSS 公告跑马灯** 等对代码勘误已写入工程 README 与 **88 v1.0.315+**；**≠** 文首「**2026-05-27 收口**」日期（后者为 **终扫轮次**，非本行代码批次）· **未改前端代码** |

---

## 冻结结论（产品口径）

| 路由 | 顶栏文案 | ① UI 壳 | 代码索引 |
|------|----------|---------|----------|
| **`/`** | Web3旅行 | **冻结** | [`app/(home)/README.md`](../../app/(home)/README.md) |
| **`/traveltrust`** | 字标 → 本页 | **冻结** | [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md) |
| **`/market`** | 自由市场 | **冻结（2026-05-30）** · L5 已闭 [`MARKET-UI-THAW.md`](./MARKET-UI-THAW.md) | 下文 §自由市场 |
| **`/did-rank`** | DID 排行榜 | **冻结** | [`DID-RANK-PHASE1-FREEZE.md`](./DID-RANK-PHASE1-FREEZE.md) · 下文 §排行榜 |
| **`/community/*`** | TT 社区 | **冻结** | [`COMMUNITY-PHASE1-FREEZE.md`](./COMMUNITY-PHASE1-FREEZE.md) · 下文 §社区 |

**本批明确不做（已决策，勿重复开项）：**

- **`/`** 十国背景叠 **云朵/粒子** 动效（Ken Burns 已够；逼真视频 → ② Phase B，见 [`public/media/landing/README.md`](../../public/media/landing/README.md)）
- **`/traveltrust`** 角色剧场（「选择您的旅行角色」）**上方**再插一整块 TT 产品介绍 — Hero + handoff 已承担叙事；**不**恢复 85 文档中的独立 `#overview` 四卡节（与 **layout lock** `hero → roles → …` 冲突）

---

## 后续变更边界（链路验证期 · 硬闸 · 2026-05-25 起）

**产品决策（写死）：** 五主路由 **UI 已冻结**；进入 **链路验证期** 后，**仅允许**数据链路与治理层变更；**禁止**任何页面结构与视觉回流。

| 允许（② 数据 / 治理） | 禁止（结构 / 视觉回流） |
|----------------------|-------------------------|
| 五主路由 **API 接线**：`lib/apiClient/*`、fetch 字段映射、loading/error 态、**诚实化** i18n（非 UI 壳改版） | 五主路由 **页结构**：新增/删除/重排 section、改 **layout lock**、改 L0/L1 chrome 组合、恢复 **`#overview`** / legacy 组件 |
| **a11y / 对比度 bugfix**（含 L1 公告标签簇 · **[`L1-PULSE-LABEL-CONTRAST-FREEZE`](../GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md)**） | 以 a11y 名义改 L1 **布局 / 动效 / 双行组合** |
| **`/governance/*`** 与 **`lib/apiClient/governance*`**：`data_source` / `is_chain_ssot` 真值标签、proposal 执行态只读 UX（**C-GOV-001**） | 五主路由 **`lib/marketingUi.ts`** / **`uiSystem.ts`** 中 **L0/L1 token**、顶栏四链样式、Ken Burns / 暖场叠层 / Tab pill 视觉 |
| 后端 **`crates/api`** 治理/榜单/发现/社区 **HTTP 与投影**（与 **04 §3.4** 同批） | **`components/market|did-rank|community|landing/*`** 与 **`modules/traveltrust-home/*`** 的 **DOM 布局 / 动效 / 主题** 改版 |
| Contract 测试 **对齐代码真值**（如 alias import），**不**放宽冻结断言 | 用 **`archive/ui-v1`** 或旧 spec 愿景 **回灌** 现行五路由 |
| **Admin / Console / Escrow** 等非五主路由域（读 **88 §三**） | 以「小修」名义 **叠层/色板/IA** 回流五主路由 |

**提交前（动到 `frontend/` 五主路由相关路径时）：** 须跑上文 **① 机读绿集** **`exit 0`**；若绿集失败，**默认视为 UI 回流**，须回滚结构/视觉 diff，仅保留数据/治理接线。

**链路验证期编排闸（① · 不改页）：** [PHASE1-LINKAGE-GATES.md](./PHASE1-LINKAGE-GATES.md) — `bash scripts/gates/local-phase1-linkage-quality-gates.sh`（全量质量门 + UI 防回归 + 治理矩阵 + **`gate:me-routes`**）。

**治理层不在此禁改表内：** `/governance/*`、`GovernanceHub*`、`governanceHubPageModel`、Epic A proposal 执行态 — 见 **[Epic-A runbook](../../../docs/runbook/Epic-A-governance-execution-ux-ladder.md)**。

---

## 全站 L0（共用）

| 项 | SSOT |
|----|------|
| 组件 | `components/Header.tsx` |
| 激活 | `lib/uiSystem.ts` → `headerNavItemIsActive`（**`/`** 仅 `pathname === "/"`**；`/traveltrust` 不点亮 Web3旅行**） |
| Token | `lib/marketingUi.ts` · `TT_MARKETING_NAV_*` |
| 证据 | TT-PH1-220 · `lib/uiSystem.test.ts` |

---

## `/` Web3 旅行

| 块 | 实现 |
|----|------|
| 背景 | `LandingHomeAmbientBackdrop` · `landingAmbientByCountry.ts` · `.tt-home-ambient-ken-burns` |
| Hero+表单 | `LandingHeroForm.tsx` · `#landing-hero-form` · 暖金 Action（§1.7） |
| 结果/解锁 | `ItineraryResultsSection` · `UnlockModal`（Phase A：**预览**，非真 USDC） |
| 页脚 | `LandingFooter` · `TT_MARKETING_HOME_FOOTER_*`（**冷灰字**，与 Hero 暖金分层）· `TrustInfraWall` dark chips |
| 产品诚实化 | **1×** `postItineraryCreate` + **`ITINERARY_CARD_COUNT=1`** 预览卡（`constants.ts`）；`party_size` / `num_rooms` 写入 body；**`landingItinerarySession`**（**`localStorage`** · 跨 tab）· 收藏 **`marketFavoritesStorage.ts`** ↔ `/market` |

**机读：**

```bash
cd frontend
npx vitest run lib/landingAmbientByCountry.test.ts "app/(home)/homeMarketing.contract.test.ts" components/landing/itineraryResultsSection.contract.test.ts components/landing/useLandingPage.contract.test.ts components/landing/unlockModalUx.contract.test.ts components/landing/LandingFooter.test.tsx
```

**②③：** 见 [`app/(home)/README.md`](../../app/(home)/README.md)「三阶验收台账」。

---

## `/traveltrust` 网络叙事

| 块 | 实现 |
|----|------|
| 布局锁 | `lib/traveltrustHomeLayoutLockL5.ts` — **`hero → roles → liquidity → trust → settlement → faq → start`** |
| 角色剧场 | `TravelTrustHomeRolesSection` → `TravelTrustIdentityTheater`（**无**其上额外产品长文块） |
| L1 槽位 | `TravelTrustHomeLandingNavSlot` — **portal → body** · `z-[280]` · `TT_MARKETING_SITE_HEADER_STICKY_OFFSET_TRAVELTRUST_L1_CLASS` |
| L1 内容 | `TravelTrustLandingChrome` — 双行：**章节 nav** + **`TravelTrustPulseTicker` inline** |
| L1 公告标签对比度 | **closed ①（2026-06-03）** — 「项目动态 · 全部 ›」暖金 **`rgba` + globals 兜底**（portal 继承 **`text-ink-900`** 修复）· **[`L1-PULSE-LABEL-CONTRAST-FREEZE`](../GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md)** |
| 公告跑马灯 | **`globals.css`** `.tt-traveltrust-pulse-inline-marquee-track`（48s CSS 循环；减动效 → 手滑） |
| 路由 loading | `loading.tsx` 顶栏细线 only（**不**盖 L1） |
| L5 示意 | `TravelTrustStablecoinGateway` · `TT_STABLECOIN_GATEWAY_L5` |
| 模块 | **`TravelTrustHomePageShell`** → **`TravelTrustNetworkPageMain`** · `modules/traveltrust-home/` · `app/traveltrust/page.tsx` |

**机读：**

```bash
cd frontend
npx vitest run lib/traveltrustHomeLayoutLockL5.test.ts modules/traveltrust-home/traveltrustHomeModularityScore.test.ts modules/traveltrust-home/traveltrustHomeBelowFoldContract.test.ts
```

**②③：** `page-brief` 生产 API、角色实拍视频、真 swap / 主网 RPC → [`HOMEPAGE-NON-DATA-CLOSURE.md`](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md)

---

## `/market` 自由市场

> **2026-05-30 · L5 正式收口（ACTIVE）：** **[`MARKET-L5-CLOSURE.md`](./MARKET-L5-CLOSURE.md)** · 解冻记录 **[`MARKET-UI-THAW.md`](./MARKET-UI-THAW.md)**（CLOSED）· 筛选带 **[`MARKET-FILTER-SORT-UI-FREEZE.md`](./MARKET-FILTER-SORT-UI-FREEZE.md)**；**仅允许**数据链路 / i18n / 门闸（与五主路由 **链路验证期** 一致）。

| 块 | 实现 |
|----|------|
| 页壳 | `app/market/page.tsx` · `data-tt-market-l5="1"` · `data-tt-market-ui-thaw="closed"` · `MarketAmbientBackdrop` |
| 主 UI | `components/market/*`（`MarketContent`、`GuideCard`、`OrderCard`、抽屉/弹窗） |
| Token | `lib/marketingUi.ts` · `TT_MARKETING_MARKET_L5_*` · `marketUiL5Thaw.contract.test.ts` |
| 数据 | `GET /api/v1/discover/orders` + `GET /api/v1/guides`（**300ms debounce**）；收藏 **`localStorage` + F-020 best-effort（已登录）**（**`marketTravelBookmarksSync.ts`**）；**①** 本地 API；showcase `TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1` |
| 子站 | **`/market/provider`** · **`/market/acquisition`** — **`MarketStandaloneBusinessPage`** · **`marketSubsiteFilters.ts`**（**非** MARKET-L5 scope）— **[LANDING-MARKET-PAGES-CODE-SSOT](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §4～§5 |

**机读：**

```bash
cd frontend
npx vitest run lib/marketUiL5Thaw.contract.test.ts components/market/marketTheme.contract.test.ts components/market/marketModalsG4.contract.test.ts components/shell/marketDarkRouteScene.contract.test.ts
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
```

**②③：** 撮合全链 E2E、staging 列表真实性、真 Escrow 深链 — TT-PH1 **222/223/230** 数据面，非 UI 壳。

---

## `/did-rank` 排行榜

**Phase ① 收口冻结：** [`DID-RANK-PHASE1-FREEZE.md`](./DID-RANK-PHASE1-FREEZE.md)（**2026-06-03** · UI 壳 + 数据链 L5 · **`data-tt-did-rank-phase1-frozen="1"`**）

| 块 | 实现 |
|----|------|
| 页壳 | `app/did-rank/page.tsx` · SSR **`?period=`** · **`?guide_sort=`** · 暖场三叠层（**88 §1.1** opacity 表） |
| 主 UI | `components/did-rank/*` · 竖脊 **五签**（旅行者/向导/行程/商家/收购）+ `?board=` · **`DidRankItineraryRankBlock`** · **`ProviderRankBlock`** / **`AcquisitionRankBlock`**（**`DidRankPageInner.tsx`**） |
| 数据链 | 五端点 HTTP + **`prize-pool`**（失败 **不** mock）；SSR **`serverForwardAuthHeaders`** → 榜行 **`is_me`**；**`didRankDevPreviewGate`** 生产硬关 |
| Token | `didRankTheme.contract.test.ts` |
| 规范 | [30-DID排行榜](../../../docs/spec/30-DID排行榜-页面规范.md) · [04-附录 §1.2](../../../docs/spec/04-附录-did-rank对接说明.md) |

**机读：**

```bash
bash scripts/dev/run-did-rank-l5-green.sh
# 或窄集：cd frontend && npx vitest run components/did-rank/didRankTheme.contract.test.ts
# 可选 E2E：e2e/site-theme-v1-did-rank-guide-modal.spec.ts（须 API :8080）
```

**②③：** 链上榜单真值、主网 DID 数据 — **②** 测试网 RPC + API（见 **DID-RANK-PHASE1-FREEZE §②③**）。

---

## `/community/*` TT 社区

**Phase ① 收口冻结：** [`COMMUNITY-PHASE1-FREEZE.md`](./COMMUNITY-PHASE1-FREEZE.md)（**2026-06-03** · UI 壳 + 窄链 L5 · **`data-tt-community-phase1-frozen="1"`**）

| 块 | 实现 |
|----|------|
| 壳 | `app/community/layout.tsx` · `CommunityRouteShell` · **无** `Web3SciFiBackground` |
| 叠层 | 暖场 + podium/渐变（弱于 `/did-rank`，**88 §1.1**） |
| Tab | L1/底栏 **哑光 premium** 激活（**`COMMUNITY_SHELL_TAB_ACTIVE`** → **`TT_MARKETING_DARK_ROUTE_TAB_ACTIVE_COMMUNITY_PREMIUM`** · **`bg-ref-sun/10`**） |
| L0 token | **`TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM`** **=** **`TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM`**（**别名** · 含 **`border-b-0`** + **`bg-[#0a0a0a]`** — **`lib/marketingUi.ts`**） |
| 数据链 | Feed **`GET …/feed?q=`** · activity **`GET …/me/activity`** · explore **`GET …/explore/destinations`** · feedback server-only · showcase 生产/测试网硬关 |
| Token | `communityShellTheme` / `communityMainPathRg` / `communityDrawerTheme` 等 contract |
| 规范 | [31-TT社区](../../../docs/spec/31-TT社区页面设计.md) v2.13 |

**机读：**

```bash
bash scripts/dev/run-community-l5-green.sh
# 详细证据 + PI-1 E2E：COMMUNITY-L5-CLOSURE.md
```

（**Y-01 已闭**：`communityShellTheme` 以 **import 运行时 token** 断言 alias，**非** regex 行内字符串。）

**发帖/评论抽屉 ① 部分 L5：** [`COMMUNITY-L5-CLOSURE.md`](./COMMUNITY-L5-CLOSURE.md)（**非** 全站 ② GO · **31 C1～C12** 仍 **②**）。

**②③：** Feed/私信/举报生产数据、审核后台联动 — 见 **COMMUNITY-PHASE1-FREEZE §②③**。

---

## ② 测试网（统一门禁 · D11+）

**前置：** [V1-PERCEPTION-CHECKLIST](../GO_local_site_theme_v1/V1-PERCEPTION-CHECKLIST.md) **§3.2.11 D10** 已通过。

| 类别 | 待办 |
|------|------|
| 部署 | 测试域 HTTPS · `NEXT_PUBLIC_API_BASE_URL` · 测试 PG |
| `/` | 创单/登录/session · 可选 Phase B 视频 · `release-flow` 首页路径 |
| `/market` | 列表/下单 staging 数据 · 弹窗 E2E |
| `/community` | Feed/消息/反馈 API · 移动端 390 抽检 |
| `/did-rank` | 榜单 API + 弹窗 E2E |
| `/traveltrust` | 测试网 RPC · L5 示意非主网 · cinematic defer 项 |
| 支付 | [TT-9618](../../../docs/runbook/TT-9618-onboarding-local-testnet.md) |

---

## ③ 公网 / 生产（另闸）

| 类别 | 待办 |
|------|------|
| GO | [go-live-checklist](../../../docs/go-live-checklist.md) · **93** 矩阵 |
| 资金 | 生产 PSP · 主网 Escrow · 公网 webhook |
| `/traveltrust` | **TT_STABLECOIN_GATEWAY_L5** 生产参数 · 真 swap |
| 合规 | 法务文案终稿 · 审计披露与链上只读核对 |
| 质量 | Lighthouse / WCAG 全站深测（cinematic **DEFER-03**） |

---

## 禁止假完成（复述）

- **不得**用 ① 本地 vitest / 目视绿宣称 **② 测试网已验收** 或 **③ Production GO**
- **不得**用窄切片 contract 冒充 **93** 全路由矩阵 GO
- ISS-007 等窄报告 **PARTIAL_GO** 规则仍适用 — 见 [CONTRIBUTING](../../../CONTRIBUTING.md#no-false-completion)

---

## 文档同步清单（2026-05-26 · `/traveltrust` L1 公告叠层/跑马灯对代码）

| 文档 | 更新要点 |
|------|----------|
| **`app/traveltrust/README.md`** | L1 portal · CSS 跑马灯 · loading 细线 · 顶距 token |
| **`modules/traveltrust-home/README.md`** | L1/L0 表 · 入口闸不盖屏 · 16/16 门禁 |
| **本文 §/traveltrust** | L1 叠层与公告机读真值 |
| **`88` v1.0.315** | `/traveltrust` L1 子块 · 表一行续 |
| **`04` §3.4 `/traveltrust`** | L1 portal + 公告 CSS 跑马灯一句 |
| **`app/did-rank/README.md`** | 竖脊 **五签** + 行程榜（对齐 `DidRankBoardShell` · **P1-DR-02**） |

## 文档同步清单（2026-06-03 · did-rank 五签 + 行程榜 ① 数据链）

| 文档 | 更新要点 |
|------|----------|
| **本文 §/did-rank** | 竖脊 **五签** · `DidRankItineraryRankBlock` · [`DID-RANK-PHASE1-FREEZE`](./DID-RANK-PHASE1-FREEZE.md) |
| **`DID-RANK-COMMUNITY-L5-AUDIT-TASKS`** | **P1-DR-02～21** · **P1-DR-FREEZE** · **P2/P3** backlog |
| **`docs/spec/30-DID排行榜`** | §0.1/§4/§5/§6 与实现对拍（**P1-DR-SPEC30**） |

## 文档同步清单（2026-06-03 · 五主路由企业级代码对拍）

| 文档 | 更新要点 |
|------|----------|
| **`FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603`** | **十维矩阵** · 五路由功能真源 · **AF-01～AF-13** · ① 验收命令 |
| **`ENTERPRISE-AUDIT-20260526` §19** | 本批次索引 |
| **`88` v1.0.320** | §1.4 五路由数据链（含 **F-020 已接线** · community/did-rank） |

## 文档同步清单（2026-06-03 · TT 社区 ① 数据链扩展 · 以代码为准）

| 文档 | 更新要点 |
|------|----------|
| **本文 §/community** | Feed **`q`** · activity/notifications · explore destinations · feedback server-only · showcase 门闸 |
| **`COMMUNITY-PHASE1-FREEZE`** | **P1-CM-ACT-03** · **EXP-02** · **FBK server-only** · §② P2 ① 子集标注 |
| **`app/community/README.md`** | HTTP 端点表 · 机读 **`data-tt-*`** |
| **`docs/spec/31-TT社区`** | **v2.13** · §5.1.1 / §8 / §9.1 / 发现 catalog |
| **`docs/spec/88` §二** | activity scope · explore **`api-aggregate-v1`** |
| **`docs/spec/04` §3.4 `/community`** | activity/events · feed `q` · explore destinations |
| **本文 §/did-rank** | SSR **`is_me`** · **`didRankDevPreviewGate`** |
| **`DID-RANK-PHASE1-FREEZE`** | **P1-DR-12** · **P1-DR-PREVIEW-GATE** |
| **`app/did-rank/README.md`** | SSR 鉴权转发 · devPreview 生产硬关 |

## 文档同步清单（2026-05-25 · 以代码为准）

| 文档 | 更新要点 |
|------|----------|
| **本文** | 五路由 ① 冻结 + ②③ 台账 + 明确不做项 |
| [`GO_local_marketing_front_closure/README.md`](./README.md) | 五路由结论表 |
| [`ENTERPRISE-DOCS-AUDIT-20260521.md`](./ENTERPRISE-DOCS-AUDIT-20260521.md) | P0 审计 + **§3.1 五主路由批次** |
| [`88` §一 冻结段](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) | v1.0.312 |
| [`13-1` / `05` / `25` / `28` / `39` 读前或 §3.1](../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) | 互指 **FIVE-MAIN-ROUTES** |
| [`33` 读前 + §二/§五](../../../docs/spec/33-前端页面实现顺序与验收清单.md) · [`80` §0.3 `/traveltrust` 行](../../../docs/spec/80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) · [`85` §2.6 / 读前](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) · [`00` 88 行](../../../docs/spec/00-文档索引.md) | layout lock · 无 `#overview` · 无 legacy SectionNav |
| [`86` §6.0 读前](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) · [`05-补充` 读前](../../../docs/spec/code-maps/05-补充-前端实现细节与代码映射-20260306.md) · [`60` 快照](../../../docs/spec/snapshots/60-前端UI-UX企业级深度检查与补充方案-20260306.md) | 五路由 + 冷灰页脚 |
| [`04` §3.4 `/traveltrust` 行](../../../docs/spec/04-后端与API.md) | layout lock；去 `#overview` 误导 |
| [`62-补充-05` §1](../../../docs/spec/code-maps/62-补充-05-剩余路由域逐文件代码映射-20260306.md) | LandingFooter · 2026-05-25 勘误 |
| [`04` §3.4 五主路由行](../../../docs/spec/04-后端与API.md) | `/` · `/market` · `/did-rank` · `/community` + FIVE-MAIN |
| [`39` §3.1 五主路由页身行](../../../docs/spec/39-上线前UI与UX总验收.md) | ① 冻结目视口径 |
| [`85` §2.6 / §三](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) | 愿景 IA vs layout lock |
| [`AGENTS.md`](../../../AGENTS.md) | 五主路由 SSOT 链 |
| [`TT-PH1` §1 锁死表](../../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md) | 五路由统一 2026-05-25 冻结 |
| [`29` / `30` / `31` 读前](../../../docs/spec/29-自由市场-撮合控制台规范.md) | market/rank/community **① 冻结** |
| [`07` §2.3 #9](../../../docs/spec/07-开发流程与顺序.md) · [`43` P5](../../../docs/spec/43-阶段-验收与未完成清单.md) · [`01` §表](../../../docs/spec/01-总库总览.md) | 工程读序互指 |
| [`28` 快照](../../../docs/spec/snapshots/28-企业级UI设计审计报告.md) · [`28-P28`](../../../docs/spec/snapshots/28-P28与截图对照-Web3融入与缺口清单.md) | 2026-05-25 SSOT |
| [`TT-B312`](../../../docs/runbook/TT-B312-five-routes-shell-ux-matrix-audit.md) · [`TT-PH1-V6 §6`](../../../docs/runbook/TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md) | runbook 对齐 |
| [`14` §前端顶栏段](../../../docs/spec/14-合约-API-ABI-前后端对齐.md) · [`09` §2.5](../../../docs/spec/09-技术架构总览-v1.0.md) · [`24` 产品演示](../../../docs/product-manager/24-产品经理核心产品路径与演示脚本.md) | 五主路由 **①** |
| [`43-模块化` P5](../../../docs/spec/43-阶段-前端UI模块化拆解与最佳实践.md) · [`45` 读前](../../../docs/spec/45-前端企业级多维度检查报告.md) · [`46` 样式审计](../../../docs/spec/46-待优化与可拆分清单.md) · [`62-补充-02`](../../../docs/spec/code-maps/62-补充-02-Community路由逐文件代码映射-20260306.md) · [`TT-UI-V2 §5`](../../../docs/runbook/TT-UI-V2-SOLO-WALKTHROUGH-001.md) | 勘误批次 |
| [`86` §6.1](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) · [`28-截图`](../../../docs/spec/snapshots/28-截图风格对照与UI深度检查.md) | Ken Burns + 冷灰页脚 |
| [`38` 性能](../../../docs/spec/38-前端性能与可观测.md) · [`21-补充`](../../../docs/spec/code-maps/21-补充-UI3D融合规范代码映射与差距-20260306.md) · [`28-补充` LandingHeroForm](../../../docs/spec/code-maps/28-补充-玻璃态与Web3融合组件规范-20260306.md) · [`62` 总表](../../../docs/spec/code-maps/62-UI-UX前端100%代码映射总表-20260306.md) · [`TT-PH1` 控件矩阵](../../../docs/runbook/TT-PH1-SITE-THEME-V1-CONTROL-MATRIX.md) | Ken Burns · 暖金 FAB · 冷灰页脚 · 221/229 closed |
| [`05` §三当前实现](../../../docs/spec/05-前端总览.md) · [`34` 读前](../../../docs/spec/34-前端组件与Design-Tokens落地清单.md) · [`43-多维度` 读前](../../../docs/spec/43-阶段-多维度检查报告.md) · [`96-索引` Hub](../../../docs/spec/96-索引-全链路外生产验收分册.md) | 五路由段落 · Token/组件清单 |
| [`13-补充` Landing 分层](../../../docs/spec/code-maps/13-补充-协议级UI宪法代码对齐与冲突清单-20260306.md) | Ken Burns · 冷灰页脚 |
| [`96-13` §0](../../../docs/spec/96-13-UI-UX-i18n-a11y-性能走查.md) · [`96-16` §2.1](../../../docs/spec/96-16-全页面UI-UX优化方案总册.md) · [`缺口表` 读前](../../../docs/spec/缺口与待补-官方总表.md) | 五路由 **①** 走查口径 |
| [`ENTERPRISE-AUDIT-20260526`](./ENTERPRISE-AUDIT-20260526.md) · [`ENTERPRISE-DOCS-AUDIT-20260521`](./ENTERPRISE-DOCS-AUDIT-20260521.md) | 企业级深度审计落盘 · **二十轮**复核 |
| **2026-05-27 终扫（二十轮）** | **AD-01～AD-05**：**33** 读前/§五 · **GO_local README** 终扫轮次 · **FIVE-MAIN** 互指 | **未改前端** |
| **2026-05-27 终扫（十九轮）** | **AC-01～AC-05**：**33** 读前绿集轮次 · **96-16/96-20/TT-96-20** **126** 锚 · **GO_local README** 终扫 | **未改前端** |
| **2026-05-27 终扫（十八轮）** | **AB-01～AB-03**：**96-16/96-20** **126** 页锚 · **00 §六 33** 日期 · **`app/traveltrust/README`** Shell 包裹 | **未改前端** |
| **2026-05-27 终扫（十七轮）** | **AA-01～AA-02**：**33** 读前/页脚 · **ENTERPRISE-AUDIT** / **GO_local README** 排版 | **未改前端** |
| **2026-05-27 终扫（十六轮）** | **Z-01～Z-02**：**GO_local README** 终扫日期 · **FIVE-MAIN** 文首 **① 绿集** 一条命令 | **未改前端** |
| **2026-05-27 终扫（十五轮）** | **Y-01～Y-03**：**COMMUNITY_PREMIUM** 别名 · **did-rank** 副榜 Block · **33** 页脚轮次 · 机读 **绿集** 分轨 | **未改前端** |
| **2026-05-27 终扫（十四轮）** | **X-01～X-04**：**缺口表** 收口日期 · **ENTERPRISE-AUDIT** § 指针 · **33** Version 行 · **FIVE-MAIN** L17 批次注 | **未改前端** |
| **2026-05-27 终扫（十三轮）** | **W-01～W-04**：**86 §6.0.1** 矩阵 · **FIVE-MAIN** 文首日期 · **00** 主表 **33** · 批次表序 | **未改前端** |
| **2026-05-27 终扫（十二轮）** | **V-01～V-06**：**21-补充** MePageBackground 落点 · **00/39/86** 勘误 · **ENTERPRISE-AUDIT** 节号 | **未改前端** |
| **2026-05-26 终扫（十一轮）** | **U-01～U-04**：**85 §五～§七** Target 分轨 · **31 附属** backlog 行 · **缺口一览 v1.0.2** · **ENTERPRISE-AUDIT** 互指 | **未改前端** |
| **2026-05-26 终扫（十轮）** | **企业审计扫尾**：**FIVE-MAIN** 收口标题 · **09/38** R3F 分轨 · **85 §四 Hero** · **缺口表 R-02（95 %）** | **未改前端** |
| **2026-05-26 终扫（九轮）** | **企业审计扫尾**：**33** **`/traveltrust`/`/community/me`** · **85** 读前 ambient vs legacy 页内树 · **21/13/62-补充** · **缺口表 ~126 page** · **AI任务卡 B-191** 挂载点勘误 | **未改前端** |
| **2026-05-26 终扫（八轮）** | **索引卫生**：**00 §六** **85 v1.0.23/88/缺口表/04-附录** · **30/04-附录** changelog supersede · **85 Target/① 分轨** | **未改前端** |
| **2026-05-26 终扫（七轮）** | **系统审计扫尾**：**96-17 §0.2.1** · **87 §1.4** · **46 §四** 历史 supersede · **00 §六** **87/86** · **缺口表 R-01** · **learn/01** | **未改前端** |
| **2026-05-26 终扫（六轮）** | **95 §7.1 域 K** · **87/96-17** 旅行收购 **①/②** 分层 | **未改前端** |
| **2026-05-26 终扫（五轮）** | **00** 主表 **30-DID** 行 · **§六** 版本表 · **94** 读前 | **未改前端** |
| **2026-05-26 终扫（四轮）** | **30** §4.2/§6 副榜勘误 · **handbook/learn/01** | **未改前端** |
| **2026-05-26 终扫（三轮）** | **32** did-rank **四签**（**已 supersede → 五签+行程** · **2026-06-03**）· **86 §6.7** · **55 §5** · **30-UI-UX** | **未改前端** |
| **2026-05-26 终扫（二轮）** | **46** `/traveltrust` 拆分台账勘误 · **93** D-NET-001 · **docs/frontend/架构目录** · **AI协作话术 §0.3** | **未改前端** |
| **2026-05-26 扫尾** | **ENTERPRISE-DOCS-AUDIT** · … · 根 **README** | L1 portal · did-rank **四签**（**→ 五签 2026-06-03**）· **单一前端版本** |
| [`88` §3.5 `/traveltrust` 子块](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) | legacy 组件 vs layout lock 勘误 |
| [`85` §5.2 粒子](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) · [`86` §6.2 愿景标](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) | cinematic 3D · 非 NetworkParticles 页内树 |
| [`13-1` 表 1 Landing/Network](../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) · [`13-补充`/`21-补充`](../../../docs/spec/code-maps/13-补充-协议级UI宪法代码对齐与冲突清单-20260306.md) | 去 Partial · 3D/R3F 页内树勘误 |
| [`05` §三 3D 行](../../../docs/spec/05-前端总览.md) · [`frontend/README.md`](../../README.md) | cinematic 3D · 非 NetworkParticles 页内树 |
| [`V1-PERCEPTION-CHECKLIST`](../GO_local_site_theme_v1/V1-PERCEPTION-CHECKLIST.md) | 五路由冻结勾 |
| 工程 README | `app/(home)` · `app/market` · `app/did-rank` · `app/community` · `app/traveltrust` · `modules/traveltrust-home` · `frontend/README.md` |

### ① 文档收口状态（2026-05-25 · 链路验证期 · 二十一轮）

**① 五主路由技术文档链已收口** — 全仓**仅** `frontend/` 现行树为 SSOT；**spec / runbook / evidence / 工程 README** 已与 **`app/*/README.md`**、**现行 token** 对拍；**Y-01 contract 已闭**（**127 tests 绿集**）；**AD-06 已闭**（**2026-05-26** · `npm run matrix:96-16:all` · **`GO_96_16_*` `total_routes` 126** · `check:96-16-matrices` **exit 0**）。

| 批次 | 范围 |
|------|------|
| **2026-05-25** | 五路由 **① UI 壳冻结** 证据链初版 |
| **2026-05-26 扫尾** | L1 portal · did-rank **四签→五签（2026-06-03）** · 单一前端版本 |
| **2026-05-26 二～三轮** | **46/93/架构目录** · **32/86/55/30-UI-UX** |
| **2026-05-26 四轮** | **30 §4.2/§6** 副榜勘误 · **handbook/learn/01** |
| **2026-05-26 五轮** | **00** 主表 **30-DID** 行 · **§六** 版本表 · **94** · **04-附录** 读前 |
| **2026-05-26 六轮** | **95 §7.1 域 K** · **87/96-17** · **30 §3.1/§3.2** ①/② 分层勘误 |
| **2026-05-26 七轮** | **96-17 §0.2.1** · **87 §1.4** · **46 §四** supersede · **缺口表 R-01** |
| **2026-05-26 八轮** | **00 §六** **85 v1.0.23/88/缺口表/04-附录** · **30/04-附录** changelog · **85 Target/① 分轨** |
| **2026-05-26 九轮** | **33** traveltrust/community/me · **85/21/13/62-补充** ambient vs legacy · **缺口表 ~126 page** · **AI任务卡 B-191** page-brief 挂载点 |
| **2026-05-26 十轮** | **FIVE-MAIN** 标题 · **09/38/85 §四** R3F/Hero 分轨 · **缺口表 R-02**（**95 §0.2 %** **≠** GO） |
| **2026-05-26 十一轮** | **85 §五～§七** Target 分轨 · **31 附属** backlog · **缺口一览 v1.0.2** · **ENTERPRISE-AUDIT** 互指 |
| **2026-05-27 十二轮** | **21-补充** MePageBackground · **00/39/86** 勘误 · **ENTERPRISE-AUDIT** 节号 |
| **2026-05-27 十三轮** | **86 §6.0.1** 矩阵 · **FIVE-MAIN** 文首 · **00** 主表 **33 v1.0.10** · 批次表序 |
| **2026-05-27 十四轮** | **缺口表** 读前收口 · **ENTERPRISE-AUDIT** § 指针 · **33** Version 行 · **FIVE-MAIN** L17 批次注 |
| **2026-05-27 十五轮** | **COMMUNITY_PREMIUM** 别名 · **did-rank** 副榜 Block · **33** 页脚轮次 · community 机读 **绿集** |
| **2026-05-27 十六轮** | **GO_local README** 终扫互指 · **FIVE-MAIN** 文首 **① 绿集** 一条命令 |
| **2026-05-27 十七轮** | **33** 读前/页脚轮次 · **ENTERPRISE-AUDIT** / **GO_local README** 排版 |
| **2026-05-27 十八轮** | **96-16/96-20** **126** 页锚 · **`app/traveltrust/README`** **`TravelTrustHomePageShell`** |
| **2026-05-27 十九轮** | **33/TT-96-20** 读前 **126** 锚 · **GO_local README** 终扫轮次 |
| **2026-05-27 二十轮** | **33** 读前/§五 · **GO_local README** · **FIVE-MAIN** 互指表 |
| **2026-05-25 二十一轮** | **ENTERPRISE-AUDIT §17** · **Y-01 已闭** · **链路验证硬闸** · **88 v1.0.318** · **governance hub 单壳** |

**禁止**用本文 **①** 冒充 **②③** Production GO。

**有意保留的历史层（非实现 SSOT）：** **85 §三 愿景 IA 长表**（§3～10 等 backlog 项）、**88 / 07 / 缺口表 changelog** 中 **2026-03-31** 组件级 a11y 留痕、**46-模块化登记表** 旧 **`/traveltrust` 拆分** 叙事、**TT-PH1 §3.2.1** 问题登记表。

**未改（有意）：** **07 / 00 版本三线**（无台账同批要求）；**85 §三 IA 长表** 仍含 `#overview` 愿景项 — **实现**以 **layout lock** 为准。
