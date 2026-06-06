# 营销前台 · 视觉与 L0/L1 收口（① 本地）

**阶段：① 本地** — UI/交互/文案壳 **已冻结（2026-05-25）**；**链路验证期**起 **仅数据链路 + 治理层**可改，**禁止**五主路由结构/视觉回流；**不**表示 API、真链、②③ Production GO。

**日期：** 2026-05-21（L0/`/traveltrust` 首开）· **五主路由 UI 壳冻结：** 2026-05-25 · **链路验证硬闸：** 2026-05-25  
**范围：** 顶栏五入口 — **`/`** · **`/traveltrust`** · **`/market`** · **`/did-rank`** · **`/community/*`** + **L0 `Header`**

**五主路由 SSOT 一文：** [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)（**单一前端版本真源** · **① 机读绿集** · ②③ 台账 · 明确不做项）  
**企业级审计（代码为准 · 首选）：** [`FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md`](./FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md)（十维矩阵 · **AF-01～13**）· [`ENTERPRISE-AUDIT-20260526.md`](./ENTERPRISE-AUDIT-20260526.md) **§19** · [`ENTERPRISE-DOCS-AUDIT-20260521.md`](./ENTERPRISE-DOCS-AUDIT-20260521.md)

---

## 结论（给产品 / 后续开发）

| 区域 | ① 状态 | 后续工作（②③） |
|------|--------|----------------|
| **`/` Web3旅行** | **UI 冻结** · **① 数据链已机读**（见 **[`app/(home)/README.md`](../../app/(home)/README.md)**） | 真付/Phase B 视频/链上 deposit → **②③** |
| **`/traveltrust` 叙事页** | **UI 冻结**（见 [`../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md`](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md)） | `page-brief`、角色实拍、TTG 真链、埋点 ingest |
| **`/market` 自由市场** | **L5 已收口冻结（2026-05-30）** → [`MARKET-L5-CLOSURE.md`](./MARKET-L5-CLOSURE.md) | staging 撮合全链 · nil-guide 认领 **②** |
| **`/did-rank` 排行榜** | **UI 冻结 + ① 数据链 L5 已收口（2026-06-03）** → [`DID-RANK-PHASE1-FREEZE.md`](./DID-RANK-PHASE1-FREEZE.md) | 测试网/主网榜单真值 **②③** |
| **`/community/*` TT 社区** | **UI 壳冻结 + ① 窄链 L5 已收口（2026-06-03）** → [`COMMUNITY-PHASE1-FREEZE.md`](./COMMUNITY-PHASE1-FREEZE.md) · 详细 [`COMMUNITY-L5-CLOSURE.md`](./COMMUNITY-L5-CLOSURE.md) | Feed/审核/CDN/**③** GO **②③** |
| **L0 顶栏四链 + 钱包胶囊** | **冻结** | 无（除非全站 IA 变更） |

**不在本收口继续做大改版：** 首页 Ken Burns 背景与冷灰页脚、顶栏色板、兑换网关示意 UI、L1 portal 双行 chrome（章节 nav + **CSS** 公告跑马灯）。**链路验证期允许：** 五主路由 API/数据接线、**`/governance/*`** 治理真值；**禁止：** 五主路由页结构/视觉/layout lock 回流（**FIVE-MAIN**「后续变更边界」）。

**五主路由 SSOT：** [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)（**单一前端版本**）

---

## ① 已交付（代码真源）

### L0 全站顶栏（`Header.tsx` · `lib/uiSystem.ts` · `lib/marketingUi.ts`）

| 项 | 说明 |
|----|------|
| 激活判定 SSOT | `headerNavItemIsActive(pathname, href)` — **`/`** 仅匹配 `pathname === "/"`；**`/traveltrust` 不点亮「Web3旅行」** |
| 四链样式 | 深顶栏：**统一暖金** 激活（字色 + 底条）；浅 Console：**暖棕** 激活；废弃按页切换青/琥珀混色 |
| 未选中 | `TT_MARKETING_NAV_LINK_INACTIVE_UNIFIED`（`!text-[#d4cec6]`，避免 `color: inherit` 发虚） |
| 钱包 / 语言 | L0 胶囊：`TT_MARKETING_HEADER_WALLET_*`、`TT_MARKETING_HEADER_LANG_BTN_*` |

### `/` Web3 旅行（`app/(home)/page.tsx`）

| 项 | 真源 |
|----|------|
| 背景 | **`LandingHomeAmbientBackdrop`** + **`landingAmbientByCountry.ts`**（十国 HD 图 · Ken Burns · **`.tt-home-ambient-ken-burns`**） |
| 叠层 | `bg-experience-landing-vignette` + `bg-web3-dot-grid` |
| Hero 壳 | `LandingHeroForm.tsx`（`#landing-hero-form` · **`TT_MARKETING_HOME_SUBMIT_FAB`** 暖金 FAB · **非** `bg-cta-gradient`） |
| 结果/解锁/页脚 | `ItineraryResultsSection`（**`ITINERARY_CARD_COUNT=1`**）· `UnlockModal`（**`getOrder`** 预览）· **`LandingFooter`** |
| 数据链 | **1×** `postItineraryCreate` · **`landingItinerarySession`**（**`localStorage`**）· 收藏 **`marketFavoritesStorage.ts`** · 下游 **`/escrow/[id]`** — **[`app/(home)/README.md`](../../app/(home)/README.md)** · **[LANDING-MARKET-PAGES-CODE-SSOT](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** |
| 页壳 | **FIVE-MAIN-ROUTES** · **[GO_local_web3_itinerary_l5](../GO_local_web3_itinerary_l5/README.md)** |

### `/market` · `/did-rank` · `/community/*`

| 路由 | 工程索引 |
|------|----------|
| `/market` | [`app/market/README.md`](../../app/market/README.md) |
| `/did-rank` | [`app/did-rank/README.md`](../../app/did-rank/README.md) |
| `/community/*` | [`app/community/README.md`](../../app/community/README.md) |

### `/traveltrust` 叙事页（`modules/traveltrust-home` · `app/traveltrust/page.tsx`）

| 项 | 说明 |
|----|------|
| 布局锁 | **`traveltrustHomeLayoutLockL5`** — **`hero → roles → liquidity → trust → settlement → faq → start`**（**无** 角色上独立 **`#overview` 四卡**） |
| L1 chrome | **双行常驻**：章节 nav + **项目动态**（`TravelTrustPulseTicker` inline）；**`TravelTrustHomeLandingNavSlot`** portal → body · **z-280**；公告 **CSS** 跑马灯 **`globals.css`** `.tt-traveltrust-pulse-inline-marquee-track`（48s）；**标签对比度 closed ① 2026-06-03** — [`L1-PULSE-LABEL-CONTRAST-FREEZE`](../GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md)；`loading.tsx` **仅顶栏细线**（不盖 L1）；入口闸 **不**全屏遮罩 |
| L5 示意 | `TravelTrustStablecoinGateway` · `TT_STABLECOIN_GATEWAY_L5`：暖金谱字段；USDC/TTG **无蓝色字**；底栏三 CTA **同款幽灵胶囊** |
| 索引 | [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md) · [`app/traveltrust/README.md`](../../app/traveltrust/README.md) · **FIVE-MAIN-ROUTES** |

### 缺陷修复（同批）

| 问题 | 修复 |
|------|------|
| `OFF950 is not defined` | `communityA11yFocus.ts` → `OFF_INK` |
| React duplicate key `美国 → 西班牙` | 地球针脚 tooltip：`listTraveltrustRoutesForRegion` 返回 `{ id, label }`，`key={route.id}` |

---

## 企业级文档审计（2026-05-21）

全量多维度对照表、P0/快照/缺口清单：**[`ENTERPRISE-DOCS-AUDIT-20260521.md`](./ENTERPRISE-DOCS-AUDIT-20260521.md)**  
**营销前台终扫（2026-05-25 · 二十一轮 · 链路验证期）：** [`ENTERPRISE-AUDIT-20260526.md`](./ENTERPRISE-AUDIT-20260526.md)（**§11～§17**）· [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

---

## 文档互指（SSOT 链）

| 文档 | 用途 |
|------|------|
| [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) | **五主路由 ① 冻结 + 链路验证硬闸 + 文首 ① 绿集 127 tests（2026-05-25 · 二十一轮）** |
| [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) | 五主路由页身 + L0 顶栏真值 |
| [86 §6.0 / §6.0.1](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) | L0 分层顶栏 + 路由矩阵 |
| [05 §四](../../../docs/spec/05-前端总览.md) · [13-1](../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) · [04 §3.4](../../../docs/spec/04-后端与API.md) | 前端总览 / 产品 SSOT / 路由表 |
| [85 §二 2.6 / §三](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) | `/traveltrust` IA + L1/L5 |
| [05-补充 §一 C](../../../docs/spec/code-maps/05-补充-前端实现细节与代码映射-20260306.md) · [62-补充-05 §1](../../../docs/spec/code-maps/62-补充-05-剩余路由域逐文件代码映射-20260306.md) | Header / Landing 代码映射 |
| [33](../../../docs/spec/33-前端页面实现顺序与验收清单.md) · [34 Header 行](../../../docs/spec/34-前端组件与Design-Tokens落地清单.md) · [39 顶栏验收](../../../docs/spec/39-上线前UI与UX总验收.md) | 验收清单 |
| [`HOMEPAGE-NON-DATA-CLOSURE.md`](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) | `/traveltrust` 叙事页 ① 冻结 |
| [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md) | 模块化首页编排 |
| [`traveltrust-home-visual-qa/README.md`](../traveltrust-home-visual-qa/README.md) | 目视 QA 清单 |

### 2026-05-21 文档对齐批次（已改 / 仍含历史表述）

| 状态 | 文档 | 说明 |
|------|------|------|
| 缺口表 读前 | [`缺口与待补-官方总表`](../../../docs/spec/缺口与待补-官方总表.md) | 五路由 **①** · **链路验证期** · **v1.0.406+** |
| ✅ | **2026-05-25 二十一轮** | **ENTERPRISE-AUDIT §17** · **Y-01 已闭** · **88 v1.0.318** 社区 Tab · **governance hub 单壳** |
| ✅ | **2026-05-27 十九轮** | **33/TT-96-20** 读前 **126** 锚 · **GO_local README** 终扫 |
| ✅ | **2026-05-27 十八轮** | **96-16/96-20** **126** 页锚 · **`app/traveltrust/README`** Shell 包裹 |
| ✅ | **2026-05-27 十七轮** | **33** 读前/页脚 · **ENTERPRISE-AUDIT** / **GO_local README** 排版 |
| ✅ | **2026-05-27 十六轮** | **GO_local README** · **FIVE-MAIN** 文首 **① 绿集** |
| ✅ | **2026-05-26 扫尾** | ENTERPRISE-DOCS-AUDIT · HOMEPAGE-NON-DATA · 07 #9 · 96-19 · CONTRIBUTING · docs/frontend/README |
| ✅ | **88** v1.0.312 §一 冻结段 | 五主路由 ① + 工程 README |
| ⚠️ 历史快照 | **`docs/spec/snapshots/28-*`**、**`60-*`** | 保留 2026-03 对照；**2026-05-25** 已勘误 Ken Burns / 暖金 FAB / 冷灰页脚（文首 **FIVE-MAIN** 为准） |
| ✅ | **ENTERPRISE-DOCS-AUDIT** | 本目录 [`ENTERPRISE-DOCS-AUDIT-20260521.md`](./ENTERPRISE-DOCS-AUDIT-20260521.md) |

### 文档 ↔ 代码对齐（2026-06-03 · 五主路由 · 以代码为准）

**现行口径以代码为准**；历史 changelog / **95 §12.4** 旧行仅作审计快照。**UI 冻结不变** — 本表仅追 **数据链 / HTTP / 机读 `data-tt-*`** 与实现对拍。

| 域 | 代码 SSOT | 规格 / 冻结 | ① 绿集 / 烟测 |
|----|-----------|-------------|----------------|
| **`/`** | [`app/(home)/README.md`](../../app/(home)/README.md) | [LANDING-MARKET-PAGES-CODE-SSOT](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · **FIVE-MAIN** §`/` | `homeMarketing.contract.test.ts` 等（**FIVE-MAIN** 文首） |
| **`/traveltrust`** | [`app/traveltrust/README.md`](../../app/traveltrust/README.md) · [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md) | **FIVE-MAIN** §`/traveltrust` · [85](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) | `traveltrustHomeLayoutLockL5.test.ts` |
| **`/market`** | [`app/market/README.md`](../../app/market/README.md) | [LANDING-MARKET-PAGES-CODE-SSOT](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · [MARKET-L5-CLOSURE](./MARKET-L5-CLOSURE.md) | `marketTheme.contract.test.ts` · `run-web3-itinerary-l5-green.sh` |
| **`/did-rank`** | [`app/did-rank/README.md`](../../app/did-rank/README.md) | [30-DID](../../../docs/spec/30-DID排行榜-页面规范.md) **2.2.3** · [DID-RANK-PHASE1-FREEZE](./DID-RANK-PHASE1-FREEZE.md) | `bash scripts/dev/run-did-rank-l5-green.sh` |
| **`/community/*`** | [`app/community/README.md`](../../app/community/README.md) | [31-TT社区](../../../docs/spec/31-TT社区页面设计.md) **v2.13** · [COMMUNITY-PHASE1-FREEZE](./COMMUNITY-PHASE1-FREEZE.md) | `bash scripts/dev/run-community-l5-green.sh` |

**2026-06-03 数据链要点（勿与 ②③ GO 混读）：**

| 路由 | ① 代码真值（摘要） |
|------|-------------------|
| **`/did-rank`** | 五端点 HTTP + **`prize-pool`**；SSR **`is_me`**；**`didRankDevPreviewGate`** 生产硬关 |
| **`/community/*`** | **`feed?q=`** · **`me/activity`** · **`explore/destinations`** · feedback **server-only** · showcase 生产/测试网硬关 |

**企业级十维对拍（2026-06-03）：** [`FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md`](./FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md) · [`ENTERPRISE-AUDIT-20260526.md`](./ENTERPRISE-AUDIT-20260526.md) **§19**

L5 审计（**②③ backlog**）：[`DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md`](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) · [`FIVE-PAGES-L5-AUDIT-TASKS.md`](./FIVE-PAGES-L5-AUDIT-TASKS.md) · 入口 [`docs/frontend/README.md`](../../../docs/frontend/README.md)

---

## 机读闸（提交前建议）

**五主路由 ① 绿集**（与 **FIVE-MAIN** 文首同源 · **127 tests · exit 0** · **含 Y-01 已闭**）：

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

**L0 / traveltrust 补充：**

```bash
cd frontend
npx vitest run lib/uiSystem.test.ts lib/traveltrustGlobeRegionRoutes.test.ts --reporter=dot
npx vitest run modules/traveltrust-home/traveltrustHomeVisualQa.test.ts --reporter=dot

# /traveltrust 电影 L5（若改 narrative 区）
bash scripts/gates/verify-cinematic-l5-local.sh
```

**Y-01（已闭 · 2026-05-25）：** `communityShellTheme` 已改 **import 运行时 token**（alias 安全）；见 **FIVE-MAIN §/community**。

**链路验证期编排闸（① · 不改五主路由页）：** [`PHASE1-LINKAGE-GATES.md`](./PHASE1-LINKAGE-GATES.md) — 全量质量门 + UI 防回归 + 治理矩阵 + **`npm run gate:me-routes`**。  
**② 测试网专项：** [`docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md`](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · [`evidence/GO_phase2_testnet_20260526/`](../../../evidence/GO_phase2_testnet_20260526/README.md)

---

## ②③ 明确不做（避免假完成）

- `page-brief` / 治理参数 **生产 API** 驱动 Hero 文案与 CTAs 真值  
- TTG 网关 **真实 swap**、钱包 **主网** 连接  
- Lighthouse / WCAG **全站深测**（见 cinematic closure `DEFER-03`）  
- 全站 **93-matrix** 路由穷举  

上述项 **不阻塞** 本目录所述 **① 视觉收口**。

### `/` 首页 · ② 测试网 / ③ 公网 台账（2026-05）

与 [`app/(home)/README.md`](../../app/(home)/README.md) **三阶表** 同源；**禁止**用 ① 页脚/壳层绿冒充下表已闭。

| 项 | ② 测试网 | ③ 公网 / 生产 |
|----|----------|----------------|
| 行程生成 | staging API + 测试 DB 创单全链；登录/session 与 CORS/回调 | 生产 API SLO、限流与监控 |
| 结果区解锁 | 若接链：仅 **testnet** USDC/Escrow；Stripe **test mode** 若走 PSP | 生产 PSP、主网资金、公网 webhook |
| 动态背景 Phase B | 可选：staging CDN 视频层 + 降级静图 | 生产 CDN、带宽与 `prefers-reduced-motion` 策略 |
| 页脚 / 合规 | staging 域名下法务链可达；费路由治理页与测试链一致 | 生产法务、审计披露、主网 FeeRouter 只读核对 |
| E2E / 矩阵 | `release-flow` / 首页提交在 **HTTPS 测试域** 复现 | **93** 全路由 + **go-live** |
| `/traveltrust` L5 | 测试网 RPC + 示意 swap（非主网） | **TT_STABLECOIN_GATEWAY_L5** 生产真值 + 主网 |
