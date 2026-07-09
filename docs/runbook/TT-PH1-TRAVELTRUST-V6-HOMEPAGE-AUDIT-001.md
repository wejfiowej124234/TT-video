# TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001 · 阶段一首页多维审计

**Version:** 2.0.0  
**最后更新：** 2026-05-18（**PH-1 ① 闭卷**：P0 全 closed；142～147 电影 UX 批；003/004/090 升 closed；问题清单迁至 `docs/runbook/issues-phase1-*`）  
**阶段：** **① 本地**（不宣称 ②③ staging/生产全矩阵已验）  
**PI-1 闭卷表：** [issues-phase1-local-traveltrust-v6.md](issues-phase1-local-traveltrust-v6.md)  
**UI/UX 明细：** [issues-phase1-ui-ux-traveltrust-v6.md](issues-phase1-ui-ux-traveltrust-v6.md)  
**证据副本（可选）：** `evidence/GO_20260518/issues-phase1-local.md`（须与闭卷表 P0 一致）

---

## 0. 范围说明（「首页」指哪条路由）

| 路由 | 产品名 | 本审计 |
|------|--------|--------|
| **`/traveltrust`** | TravelTrust 网络落地页（v6 电影级） | **主范围** |
| **`/`** | Web3 行程规划首页 | **§6 简表**（无滚轮锁死类 P0） |
| **`/network`** | 别名 | 308 → `/traveltrust`（**closed**） |

本地入口：**`http://localhost:3012/traveltrust`**（非 `3002`、非 `/travelfront`）。

---

## 1. SSOT 对拍总表（2026-05-18）

| 真源 | v6 实现 | 状态 |
|------|---------|------|
| `traveltrust_page_brief_json()` · `ia_version=v6` | `TravelTrustNetworkPageMain` | **对齐** |
| `traveltrustNetworkPage.contract.test.ts` | cinematic 组件集 | **对齐** |
| **85** §2.7 v6 电影 IA | 实现一致 | **已对齐** ① |
| **04** §3.4 page-brief v6 字段 | `traveltrust_page_brief_json` | **已对齐** ① |
| **13-1** 顶栏白底 | `/traveltrust` 深色顶栏 `#14100d` | **closed ①** · TT-PH1-003（脚注 defer ② 文档） |
| **85** §2.4 视频 | tier-1 占位 MP4 + 线框地球 | **closed ① 接受出口** · 生产片 **②** · TT-PH1-030b |
| v6 **#pulse** / **#liquidity** | PULSE + 稳定币网关预览 | **closed ①** · TT-PH1-120/121 |
| v6 **#trust** / **#faq** / **#settlement** | Trust + FAQ + 结算 + 页脚 | **closed ①** · TT-PH1-011 / **141** |
| page-brief **analytics_events** | 5 事件 + 本地 ingest | **closed ①** · TT-PH1-051 / **050** |
| OG / Twitter | 1200×630 动态 PNG 双语副标题 | **closed ①** · TT-PH1-073 |

**实现真源优先于 85 旧正文：** v6 以 **API + 契约测试** 为准；85/13-1 字面漂移登记 **② 文档批**（不挡 ① PH-1）。**五主路由 ① UI 壳（2026-05-25）** 另见 **[FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)**（**`/traveltrust`** **layout lock** `hero→roles→…`，**无** `#overview` 四卡）。

---

## 2. 本批已关闭（代码已合入 · 浏览器须复验）

| ID | 摘要 |
|----|------|
| TT-UI-001～014 | 地球滚动、叠层、媒体占位、顶栏、剧场、hash、减动效、FeeRouter 折叠 |
| TT-SCROLL-001～006 | WebGL 不抢滚轮；`overflow-x-clip`；`main min-h-screen` |
| TT-PH1-023/024/070/071/080/082/093/110 | 锚点/滚动条/a11y/z-index/3D 穿透/redirect |
| PH1-FE-09/11b/12/13 | E2E 契约（手验见闭卷表） |
| TT-PH1-011/051/060/073/090/120/121/130～141 | 见 [UI/UX 明细](issues-phase1-ui-ux-traveltrust-v6.md) |
| **TT-PH1-142～147** | lower-third 地球区 · letterbox · CTA dock · hero-only WebGL idle · Explain 两行 · 粘性 nav 外置 |
| **TT-PH1-003/004** | 深色顶栏 + `#14100d` 壳（实现 closed；85 脚注 defer ②） |
| **TT-PH1-030b/050** | tier-1 MP4 + 本地 analytics（P0 **closed ①**） |

**① 浏览器复验（5 点）：** 见 [issues-phase1-ui-ux-traveltrust-v6.md · 复验](issues-phase1-ui-ux-traveltrust-v6.md#-浏览器复验5-点--基础)

---

## 3. 未关闭 · P0

**无。** P0 已在 [闭卷表](issues-phase1-local-traveltrust-v6.md) 全部为 **closed ①**（030b = 接受 tier-1；050 = 本地 route，ingest defer ②）。

---

## 4. 未关闭 · P1（defer ②③ 或 P2）

| ID | 摘要 | 处置 |
|----|------|------|
| TT-PH1-010 | 85 全 17 段 IA | **defer ① 产品** — v6 电影 IA |
| TT-PH1-101 | 13-1 文档脚注 | **defer ② 文档**（003 实现已 closed） |
| TT-PH1-122 | PULSE CMS | **defer ②** |
| TT-PH1-123 | 真链兑换 | **defer ②③** |
| TT-PH1-073b | 品牌 OG 艺术图 | **defer ②** 设计 |
| TT-PH1-032～035 | 生产 MP4 变体 | **defer ②** 随媒体批 |
| P2 项 | 012/020/022/081/111 等 | 见 UI/UX 明细 §P2 |

---

## 5. P2 / backlog

见 [issues-phase1-ui-ux-traveltrust-v6.md](issues-phase1-ui-ux-traveltrust-v6.md)。

**媒体 env：** `frontend/.env.traveltrust-media.example` · `npm run media:traveltrust-tier1`（`dev:clean` 已串联）。

---

## 6. `/` Web3 旅行首页（简表 · SSOT 对齐 2026-05-30）

**代码真源**：[FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [`frontend/app/(home)/README.md`](../../frontend/app/(home)/README.md) · **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §2 · **[88 §一](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)** · **[GO_local_web3_itinerary_l5](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md)** · **`homeMarketing.contract.test.ts`**

| 项 | 现行实现 |
|----|----------|
| 路由 | **`app/(home)/page.tsx`**（**无** 根 `app/page.tsx`） |
| 页壳 | **`LandingHomeAmbientBackdrop`** + Ken Burns（**`landingAmbientByCountry.ts`**）+ `bg-experience-landing-vignette` + `bg-web3-dot-grid` + **`TT_MARKETING_HOME_*`** |
| Hero | 单文件 **`LandingHeroForm`** · `#landing-hero-form` · 暖金 Action（**TT-PH1 §1.7**） |
| 下游 | **`ITINERARY_CARD_COUNT=1`** · **`useLandingPage`**（**1×** `postItineraryCreate`）· **`landingItinerarySession`**（**`localStorage`** · 跨 tab · 收藏 **`marketFavoritesStorage.ts`**）· **`TT_MARKETING_HOME_SECTION_BRIDGE`** · `ItineraryResultsSection` · `UnlockModal`（**`getOrder`** 预览）· **`TT_MARKETING_HOME_FOOTER_TOP_FADE`** · **冷灰** **`LandingFooter`** |
| L0 | Home 深条；**Web3旅行** 仅 `pathname === "/"` 激活 |

- **PH1-HOME-02** **closed**：`fixed` 背景 `pointer-events-none`。
- **PH1-HOME-01** **closed ①**：`home-landing-itinerary-submit.spec.ts` + `home-landing-shell.spec.ts`（**无** `data-tt-home-api-status` / v2 拆分件）。

---

## 7. 本地验收命令（①）

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
cd frontend && npm run dev:clean
# http://localhost:3012/traveltrust
scripts/start-api-with-seed.bat
TRAVELTRUST_PH1_E2E=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
cd frontend && npm run e2e:pi1-traveltrust
```

---

## 8. 阶段出口（签 PH-1 前）

- [x] **TT-PH1-030b** ① 签字接受 tier-1 + 线框地球（生产片 **②** 单列）
- [x] **TT-PH1-050** ① 本地 ingest closed；生产 **②**
- [x] **85/04** v6 模块对拍；**011 / 051 / 060 / 090 / 120/121 / 130～147 / 141**
- [x] [闭卷表](issues-phase1-local-traveltrust-v6.md) **P0 全 closed**
- [x] **PH1-FE-01～03** E2E ①
- [ ] `phase-signoff.md` **PH-1** 人工签字

**互链：** [TT-MASTER-PUBLISH-GO-CHECKLIST-001](TT-MASTER-PUBLISH-GO-CHECKLIST-001.md) · [issues-phase1-local 模板](evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)

---

## 9. 企业级多维审计（2026-05-18 · ① 本地）

**结论（①）：** v6 可作 **PH-1 本地签收**；**②** 挡「融资级实拍 + CMS + 生产 ingest + 真 swap」。

| 维度 | 等级 | 发现 | 状态 |
|------|------|------|------|
| **UX · IA** | 绿 | 全锚点 pulse→start | closed ① |
| **UX · 导航** | 绿 | 粘性 nav 在 hero 外；skip `#hero` | **147** closed |
| **UX · CTA** | 绿 | `hero-cta-dock` 主按钮 + 全宽钱包 | **144/060** closed |
| **UX · 降级** | 绿 | API 灰条 + hydration 修复 | BriefStatus closed |
| **视觉 · 3D** | 黄→绿 | 线框地球 + lower-third + letterbox | **142/143**；实拍 **②** |
| **视觉 · 层次** | 绿 | unified-3d scrim；无 blur 碎裂 | closed |
| **性能 · WebGL** | 绿 | tab hidden + **hero-only** `power=idle` | **090/145** closed |
| **性能 · LCP** | 黄 | 全页 Canvas；移动降粒子 | 接受 ①；② 压测 |
| **无障碍** | 绿 | FAQ 手风琴；141 文案；skip 首屏 | closed |
| **无障碍 · 3D** | 黄 | SR 简述 + reduced-motion 关 Canvas | partial P2 |
| **合规叙事** | 绿 | Trust/结算/FAQ/stats 示意 | 011 closed |
| **合规 · IA** | 黄 | 85 17 段未做 | 010 defer |
| **工程 · 契约** | 绿 | Vitest 29+；FAQ v6 回归 | closed |
| **工程 · 埋点** | 绿 | 本地 POST route | 050 closed ① |
| **工程 · OG** | 绿 | 动态 PNG 双语 | 073 closed ① |
| **工程 · 文档** | 黄 | 85 字面脚注 | 101 defer ② |
| **②③** | 红 | CMS / swap / 生产 analytics / 实拍 | 122/123/050② |

**P0 签字出口（①）：** tier-1 MP4 + 线框地球 + 动态 OG + 本地 analytics = **默认 PH-1**；生产实拍与 ingest = **② 里程碑**。
