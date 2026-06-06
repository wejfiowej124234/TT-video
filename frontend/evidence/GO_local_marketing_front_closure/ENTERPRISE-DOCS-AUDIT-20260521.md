# 企业级文档审计 · 营销前台（五主路由 + L0）

**审计日：** 2026-05-21（首开）· **五主路由收口：** 2026-05-25 · **文档对代码勘误：** 2026-05-26（**未改前端**）  
**代码真源：** 全仓**仅** `frontend/` 现行树（**非** `archive/ui-v1`）— `uiSystem.ts` · `marketingUi.ts` · `Header.tsx` · `app/(home)/` · `app/market|did-rank|community/` · `modules/traveltrust-home/**`  
**收口索引：** [`README.md`](./README.md) · **[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)**

---

## 1. 审计方法（多维度）

| 维度 | 检核项 | 通过标准 |
|------|--------|----------|
| **L0 顶栏** | 条背景、四链激活色、Web3 点亮规则 | 与 `uiSystem.test.ts` 一致 |
| **`/` 页身** | Ken Burns 背景、vignette、暖金 Hero、冷灰页脚 | **`LandingHomeAmbientBackdrop`** + **`landingAmbientByCountry.ts`** · **`TT_MARKETING_HOME_FOOTER_*`** |
| **`/traveltrust` L1** | **portal** 双行 chrome + **CSS** 公告跑马灯 · **layout lock** | **`TravelTrustHomeLandingNavSlot`** · **`TravelTrustLandingChrome`** · **`traveltrustHomeLayoutLockL5`**（**无** `#overview` 四卡） |
| **`/did-rank` 主架** | **竖脊五签** + 内页翻页 | 旅行者/向导/**行程**/商家/旅行收购 · **`?board=itinerary|…`** · **[30 §0.1](../../../docs/spec/30-DID排行榜-页面规范.md)** · **[DID-RANK-PHASE1-FREEZE](./DID-RANK-PHASE1-FREEZE.md)** |
| **`/traveltrust` L5** | 兑换网关 CTA | `TT_STABLECOIN_GATEWAY_L5` 暖金三 CTA |
| **IA / 路由** | 字标、四链、discover 重定向 | **04 §3.4**、**13-1** |
| **②③ 边界** | API、真链、埋点 | 不写入 ① 冻结结论 |
| **文档互指** | SSOT 链无「全路由白底」残留 | P0 + **snapshots 28/60** 已统一现行 `/` |

---

## 2. 代码真值摘要（验收对照）

### L0 `headerBarClassForPathname`

| pathname 族 | Token / 类 |
|-------------|------------|
| **`/`** | `TT_MARKETING_HEADER_BAR_HOME` |
| **`/traveltrust`** | `TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC` |
| **`/market` `/did-rank` `/community`** | `TT_MARKETING_HEADER_BAR_DARK` |
| **Console**（`/orders` `/pay` `/auth` …） | `TT_MARKETING_HEADER_BAR_LIGHT` |

### 四链 `headerNavItemIsActive`

- **`href === "/"`** → 仅 `pathname === "/"` 为 active（**`/traveltrust` 不亮 Web3旅行**）
- 深条：激活 `!text-ref-sun` + 底条；未选 `!text-[#d4cec6]`
- 浅条：激活 `!text-[#9a5f18]`

### `/` Landing

- `LandingHomeAmbientBackdrop` + `landingAmbientByCountry.ts` · Ken Burns Phase A
- `globals.css` → `.bg-experience-landing-vignette`
- `LandingFooter` → `TT_MARKETING_HOME_FOOTER_*`（冷灰字 · 2026-05-25）

### `/market` · `/did-rank` · `/community/*`

- 壳与 theme contract — **TT-PH1 224/225** · **`app/*/README.md`**
- 叠层 opacity — **88 §1.1**

### `/traveltrust`

- L1：**`TravelTrustHomeLandingNavSlot`**（portal → body · z-280）+ **`TravelTrustLandingChrome`** + **`TravelTrustPulseTicker` inline**（**CSS** 跑马灯 · `globals.css`）
- L5：`TravelTrustStablecoinGateway` / `lib/traveltrust/l5/economy.ts`
- Layout lock：`hero→roles→…`（**无** 角色上独立 overview 块）

### `/did-rank`

- **竖脊五签**（含 **行程** Top10 + 旅行收购）+ **`framer-motion`** 内页翻页 + **`?board=`** — [`app/did-rank/README.md`](../../app/did-rank/README.md)（**现行口径**；下文历史修订史若写「四签」仅指 2026-05-26 当时）

---

## 3. P0 文档（已对齐 · 2026-05-21）

| 文档 | 版本/批次 | 状态 |
|------|-----------|------|
| [86 §6.0 / §6.0.1](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) | v1.1.27 | ✅ |
| [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) | v1.0.312 | ✅ |
| [05 §四](../../../docs/spec/05-前端总览.md) | 当前实现段 | ✅ |
| [13-1 开篇](../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) | — | ✅ |
| [04 §3.4](../../../docs/spec/04-后端与API.md) | `/traveltrust` 行 | ✅ |
| [14 顶栏段](../../../docs/spec/14-合约-API-ABI-前后端对齐.md) | — | ✅ |
| [85 §2.6 / §三](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) | L1/L5 + IA 编号 | ✅ |
| [05-补充 §1.1 / §一 C](../../../docs/spec/code-maps/05-补充-前端实现细节与代码映射-20260306.md) | v1.0.14 | ✅ |
| [62-补充-05 §1](../../../docs/spec/code-maps/62-补充-05-剩余路由域逐文件代码映射-20260306.md) | Landing 行 | ✅ |
| [00 / 33 / 34 / 39 / 21 / 28](../../../docs/spec/) | 顶栏或 traveltrust 组件 | ✅ |
| [frontend/README.md](../../README.md) | 入口段 | ✅ |
| 本目录 [README](./README.md) · [FIVE-MAIN-ROUTES](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [HOMEPAGE-NON-DATA](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) | — | ✅ |

### 3.1 五主路由收口批次（2026-05-25）

| 文档 | 状态 |
|------|------|
| [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) | ✅ 新建 SSOT |
| [88 §一 冻结段](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) | ✅ v1.0.312 |
| [13-1 / 05 / 25 / 28 / 39 / 04 / 62-补充 / 85 / 45 / 01](../../../docs/spec/) | ✅ 读前或行级 |
| [29 / 30 / 31 读前](../../../docs/spec/29-自由市场-撮合控制台规范.md) · [07 §2.3 #9](../../../docs/spec/07-开发流程与顺序.md) · [43 P5](../../../docs/spec/43-阶段-验收与未完成清单.md) | ✅ |
| [28 快照 · TT-B312 · TT-PH1-V6 §6](../../../docs/runbook/TT-B312-five-routes-shell-ux-matrix-audit.md) | ✅ 2026-05-25 |
| [TT-PH1 §1](../../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md) | ✅ 锁死表 |
| `app/(home|market|did-rank|community|traveltrust)/README.md` | ✅ 工程索引 |

---

## 4. 快照文档（已与现行五主路由统一 · 2026-05-25）

| 路径 | 处理 |
|------|------|
| `docs/spec/snapshots/28-截图风格对照与UI深度检查.md` | ✅ 文首 **现行 SSOT**；§1–2 顶栏/Hero 表对齐 **Ken Burns** Hero + L0 分层 |
| `docs/spec/snapshots/28-P28与截图对照-Web3融入与缺口清单.md` | ✅ **2026-05-25** · **FIVE-MAIN-ROUTES** |
| `docs/spec/snapshots/28-企业级UI设计审计报告.md` | ✅ **2026-05-25** · 五主路由 SSOT |
| `docs/spec/snapshots/60-前端UI-UX企业级深度检查与补充方案-20260306.md` | ✅ V1.0.6；五主路由 **① 冻结** + 冷灰页脚 |
| `docs/spec/25-顶级UI标准-Landing-Discover-Itinerary.md` | ✅ §3.4 现行实现 vs 愿景 backlog |
| `docs/spec/05-前端总览.md` §三 | ✅ **2026-05-25** · Ken Burns + layout lock（去 `#overview` 误导） |
| `docs/runbook/TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md` | ✅ §6 扩表对齐 `(home)/README` |
| `frontend/app/(home)/homeMarketing.contract.test.ts` | ✅ **`TT_MARKETING_HOME_SUBMIT_FAB`** · 禁主路径 `bg-cta-gradient` |
| `docs/spec/45-前端企业级多维度检查报告.md` | ✅ `app/(home)/page.tsx`（纠偏 `app/page`） |
| `docs/spec/46-待优化与可拆分清单.md` | ✅ Ken Burns 动态底 `(home)/page` |
| `docs/spec/snapshots/28-截图…md` | ✅ L0 激活态改为暖金/暖棕底条（非 ink-900 border） |
| `docs/spec/39-上线前UI与UX总验收.md` | ✅ §3.1 区分现行表单 vs 25 愿景 |
| `AGENTS.md` | ✅ 首页 SSOT 只读链 |
| `docs/spec/53-阶段开发技术文档.md` | Escrow 段「白底」= **Light L0** 语境（非首页漂移） |

**发版/CR 仍以 86 + 88 + `(home)/README` + 本目录为准**；快照作对照审计附录，**`/`** 描述与代码一致。

---

## 5. 低优先级 / 无技术漂移

| 区域 | 说明 |
|------|------|
| `docs/product-manager/*` | 路径与演示脚本正确；未写 L0 分层（产品向可接受） |
| `docs/runbook/TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md` | 已记 `/traveltrust` 深色顶栏 closed ① |
| `docs/spec/07` §2.3 #9 | 链 88/86；未写死白底（可接受） |
| `AGENTS.md` / `CONTRIBUTING.md` | 无 Landing 顶栏旧口径 |
| `docs/spec/27-archived/*` | 归档流水，不维护 |

---

## 6. 文档缺口（第二轮 · 2026-05-21）

| ID | 项 | 状态 |
|----|-----|------|
| DOC-GAP-01 | **62-补充-05 §1.5** `traveltrust-home` | ✅ 已补 |
| DOC-GAP-02 | **25** 路由段 `AMBIENT_BG_HOME` | ✅ 已补 |
| DOC-GAP-03 | **30** 顶栏暖金/路径分层 | ✅ 已补 |
| DOC-GAP-04 | **00** 索引 85/86/88 行 | ✅ 本批 |
| DOC-GAP-05 | **28-截图** §1 表「整体形态」行 | ✅ 本批 |

**可选 P3**：`docs/product-manager/24-*` 演示脚本补一句 L0 分层（非阻塞）。

---

## 7. 机读验收（文档维护者）

```bash
cd frontend
npx vitest run lib/uiSystem.test.ts lib/traveltrustGlobeRegionRoutes.test.ts --reporter=dot
npx vitest run modules/traveltrust-home/traveltrustHomeVisualQa.test.ts --reporter=dot
```

```bash
# 文档漂移扫描（应仅命中 snapshots / 53 Escrow 语境 / 本审计「历史」段）
rg -n "全路由统一白|全站白底深字|统一白顶栏" docs/spec --glob "*.md"
```

---

## 8. 审计关闭（第十一轮 · 深度多维 · 2026-05-21）

**结论：P0 + snapshots + 25/39/45/46/43 + runbook + AGENTS + 契约测试 已与本地 `app/(home)/page.tsx` 对齐；无待改 SSOT 项。**

| 维度 | 结果 |
|------|------|
| **P0 spec + code-maps + 33/39/43/00/04** | ✅ |
| **runbook + evidence + frontend README + (home)/README** | ✅ |
| **工程（契约/E2E/选择器）** | ✅ |
| **snapshots + 45/46/39 + AGENTS + 契约** | ✅ 第十一轮深度对齐 **`/`**；发版 SSOT 仍以 **88/86/(home)/README** 为先 |
| **②③（API/埋点/真链）** | defer |

**发版只读链（写死）：**

```
frontend/app/(home)/page.tsx
  → frontend/app/(home)/README.md
  → docs/spec/88 §一（Web3旅行行）
  → docs/spec/86 §6.0（L0 Home 深条）
  → frontend/evidence/GO_local_marketing_front_closure/README.md
  → frontend/app/(home)/homeMarketing.contract.test.ts
```

**第七轮机读扫描：** 无活跃文档将 `LandingHeroFormHeroIntro`、`landingApiPreflight`、`data-tt-home-api-status`、`app/page.tsx` 当作 `/` 现行实现。

---

## 8a. 结论（第六轮 · 2026-05-21）

| 维度 | 结果 |
|------|------|
| **P0 技术文档** | ✅ |
| **runbook** | ✅ `TT-UI-V2-SOLO-WALKTHROUGH` §5 |
| **snapshots/60** | ✅ §2.1 纠偏 |
| **工程** | ✅ 第五轮 E2E |

---

## 8a. 结论（第五轮 · 2026-05-21）

| 维度 | 状态 |
|------|------|
| **P0 spec + code-maps + 43/33/46** | ✅（第四轮已收口） |
| **E2E / 选择器** | ✅ 本批：`home-landing-itinerary-submit` · `dataTtSelectors.homePage` 对齐 **`#landing-hero-form` / `main[aria-label]`** |
| **product-manager/24** | ✅ 首页行互指 **`(home)/README.md`** |
| **②③** | defer |

**第五轮修补**：删除 E2E 对已移除的 **`data-tt-home-api-status`** / **`data-tt-marketing-home-results`** 断言。

---

## 8b. 结论（第四轮 · 2026-05-21）

| 维度 | 状态 |
|------|------|
| **P0 spec（05/13-1/04/86/88 v1.0.311/85/14/00/07/33/34/39/25/30/01）** | ✅ |
| **code-maps（05-补充 v1.0.15、62 §1、28-补充 §四、21-补充）** | ✅ 页壳 ~88、单文件 Hero、无 `formError`/拆分件旧稿 |
| **43 / 46 登记表** | ✅ 行数与 SSOT 一致 |
| **runbook（issues-phase1、TT-PH1-190/PH1-HOME-01）** | ✅ |
| **frontend（README + `app/(home)/README.md`）** | ✅ |
| **snapshots（28-*、60）+ 25 §3.4** | ✅ 已与现行 **`/`** 统一 |
| **②③** | defer，不算 ① 文档滞后 |

**机读扫描（第四轮）**：

```bash
rg -n "LandingHeroFormHeroIntro|landingApiPreflight|home-landing-marketing-v2|~711.*landing|app/page\.tsx.*\/" docs frontend/evidence --glob "*.md"
# 应仅：历史登记 / 46 changelog / archive 说明 / 纠偏句
```

## 9. 代码冲突清理（`/` · 2026-05-21）

| 冲突 | 处置 |
|------|------|
| 未接线的 v2 拆分件（`LandingHeroFormHeroIntro` 等 + `landingApiPreflight`） | **已删**；仅 **`archive/ui-v1/snapshot/`** 保留 V1 对照 |
| 契约/E2E 仍要求 `data-tt-ui-generation` / API 预检 | **已改** → `homeMarketing.contract.test.ts` · `e2e/home-landing-shell.spec.ts` |
| `archive/ui-v1` 与主线双真源 | **`VERSION.md`** 标明只读；SSOT → **`app/(home)/README.md`** |

**发版 / CR 单源链**：`app/(home)/page.tsx` → `components/landing/*` → **86 §6.0** → **88 §一** → **本目录 README** → `lib/uiSystem.test.ts`

**最大历史漂移**（已纠偏）：2026-03「全路由白底顶栏」→ 现为 **Home / Cinematic / Dark / Light** 四层 L0。
