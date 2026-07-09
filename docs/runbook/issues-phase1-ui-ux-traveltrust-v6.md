# 阶段一 · `/traveltrust` v6 UI/UX 问题明细（① 本地）

**Version:** 1.0.7  
**最后更新：** 2026-05-22  
**阶段：** **① 本地**（不宣称 ②③）  
**主审计：** [TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001](TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md)  
**PI-1 闭卷表（可签）：** [issues-phase1-local-traveltrust-v6.md](issues-phase1-local-traveltrust-v6.md)  
**电影动画 L5 标准（收口真源）：** [TT-PH1-CINEMATIC-ANIMATION-L5-001](TT-PH1-CINEMATIC-ANIMATION-L5-001.md)  
**全站主题 V1 外溢（SSOT）：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](TT-PH1-SITE-THEME-V1-UPGRADE-001.md)  
**证据副本（可选）：** `evidence/GO_20260518/issues-phase1-local.md`（与本文互链，P0 状态须一致）

---

## 图例

| 状态 | 含义 |
|------|------|
| **closed** | ① 代码 + Vitest/E2E 已合入；浏览器硬刷新复验 |
| **partial** | ① 子集完成；余量见 defer 列 |
| **defer** | 明确延期到 ② 或 ③ |
| **open** | 未处理 |
| **verify** | 契约/单测已 **closed**，但浏览器截图观感未达融资级首屏 — 须人眼复验 |
| **retired** | ① 产品裁撤：DOM/锚点已移除；历史 ID 保留追溯，**不**再作验收项 |

---

## IA 下线 2026-05-19（① · 产品裁撤）

> **动机：** 「网络快照」`#stats` 与「三步了解」`#explain` 与角色剧场视频叙事重复；v6 主链改为 **Hero → 角色视频 → 兑换 → 信任 → 结算 → FAQ → 启程**。

| 原 ID / 锚点 | 处置 | ① 证据 |
|--------------|------|--------|
| `#stats` · `TravelTrustIllustrativeStats` | **retired** | DOM 无 `#stats`；`page-brief` / `traveltrustSectionHash` 无 `stats`；E2E 断言 count=0 |
| `#explain` · `TravelTrustQuickExplain` | **retired** | 同上 `#explain`；产品叙事由 **#roles** 视频承担 |
| **TT-PH1-146** | **retired**（原 closed） | 组件已删；勿再登记为 closed 功能项 |
| **TT-PH1-180** stats 脚注 | **retired** 子项 | **180** 仍指全站 `TravelTrustIllustrativeBadge`（兑换预览条等）；stats 专用脚注键已移除 |
| locale `traveltrust_nav_stats` / `explain` 等 | **retired** | zh/en 已删；V1 快照 `frontend/archive/ui-v1/` 仍保留旧键供只读对照 |

**Playwright `e2e/*-snapshots/*.png`** 为 **TT-PH1-182** 视觉回归基线，与已下线的「网络快照」区块无关。

---

## V2 营销 UI 品牌收口（① · 首发视觉 · 不挡 PH-1）

> **范围：** 统一 **`/`** 获客与 **`/traveltrust`** 协议叙事的 **设计系统**（`frontend/lib/marketingUi.ts`）；**不**新增业务功能、**不**扩 Phase-2（MinIO/HLS/视频/审核台）、**不**改订单/托管逻辑、**不**宣称 ②③。  
> **四页数据链（`/market` 等 · 非本轨 UI 收口）：** **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** — **`/`** 行程持久化 · **`/market`** 列表 debounce/收藏以该 SSOT 为准。  
> **V1 只读快照：** `frontend/archive/ui-v1/` · `bash scripts/archive-ui-v1-snapshot.sh`  
> **机读标记：** `data-tt-ui-generation="v2"`（**`/traveltrust`**、Console 等；**`/`** **无** — SSOT **[`(home)/README.md`](../../frontend/app/(home)/README.md)**）

| ID | 层级 | 内容 | 状态 | 证据 / 备注 |
|----|------|------|------|-------------|
| **TT-PH1-186** | P0 | **V1版本** 快照入库 | **closed ①** | `frontend/archive/ui-v1/`、`scripts/archive-ui-v1-snapshot.sh` |
| **TT-PH1-187** | P0 | 共享 **`TT_MARKETING_*`**（按钮 / 文案卡 / 免责 / 示意） | **closed ①** | `lib/marketingUi.ts` · `traveltrustHeroLayout.ts` 转发 |
| **TT-PH1-188** | P0 | **顶栏** L0 分层（Home / Cinematic / Dark / Light） | **closed ①** | `Header.tsx` · `uiSystem.ts` · **86 §6.0** |
| **TT-PH1-189** | P0 | **Trust badges** + illustrative 样式同源 | **closed ①** | `TrustBadgesRow` · `TravelTrustIllustrativeBadge` |
| **TT-PH1-190** | P1 | **`/`** 旅游获客：Hero 玻璃卡、网络 CTA、提交 FAB | **closed ①** | 单文件 **`LandingHeroForm`** · `#landing-hero-form` · E2E **`home-landing-shell.spec.ts`** |
| **TT-PH1-191** | P1 | **`/`** 375/390 **safe-area**、CTA 不贴底 | **partial ①** | safe-area padding · PH1-FE-191/191b E2E — 窄屏 **verify** |
| **TT-PH1-192** | P1 | **`/traveltrust`** 「规划行程」**仅暖色**；协议按钮保持青/ghost | **closed ①** | `data-tt-traveltrust-hero-cta-plan-warm` |
| **TT-PH1-193** | P2 | **`/traveltrust`** 暗底协议感 + 左球右文案 | **closed ①** | `split-lr` · §6.2 首屏目视 |
| **TT-PH1-194** | P3 | 产品内页壳与营销顶栏一致（无大动画） | **closed ①** | `TT_MARKETING_PRODUCT_PAGE_*` + `data-tt-ui-generation="v2"` on orders/pay/disputes |

**与 PH-1 签字关系：** 本轨 **不** 替代 **TT-PH1-150～158** 截图复验；**不** 单独作为融资级首屏 **closed** 依据（见 [禁止假完成](../../CONTRIBUTING.md#no-false-completion)）。

**建议代码顺序（本轨）：** **187→188→189**（P0）→ **190→191→192**（P1）→ 再回到 **150→151→153**（截图债）。

---

<a id="全站主题-v1-外溢2026-05-22--①"></a>

## 全站主题 V1 外溢（2026-05-22 · ①）

> **SSOT runbook：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](TT-PH1-SITE-THEME-V1-UPGRADE-001.md) **v1.8.1** · **控件矩阵：** [TT-PH1-SITE-THEME-V1-CONTROL-MATRIX](TT-PH1-SITE-THEME-V1-CONTROL-MATRIX.md) **v1.1**（抽屉 §11 · ① **49/49**）  
> **范围：** **`/market`、`/did-rank`、`/community/*`** 与首页 **Token / 主 CTA / L1 壳** 同族；**范围内每页须达「页面 UI L5」**（runbook **§1.6 · §2.4**）。**`/` + L0 锁死为参照**；**`/traveltrust`** = **电影动画 L5** 另轨。  
> **十日冲刺（维护者承诺）：** **[§3.2.8](TT-PH1-SITE-THEME-V1-UPGRADE-001.md#328-十日冲刺计划7-天周--14h天--①-本地-d1d10)** + **[§3.2.9 覆盖审计](TT-PH1-SITE-THEME-V1-UPGRADE-001.md#329-十日冲刺覆盖审计缺口--增补--2026-05-22)** + **[§3.2.10 命令速查](TT-PH1-SITE-THEME-V1-UPGRADE-001.md#3210-十日冲刺--命令速查①--复制即用)** — **D1～D10** ① → **§3.3** **D11+** ② + [TT-9618](TT-9618-onboarding-local-testnet.md)。  
> **勾选：** [V1-PERCEPTION-CHECKLIST](../../frontend/evidence/GO_local_site_theme_v1/V1-PERCEPTION-CHECKLIST.md) · **§4.2**  
> **≠** `archive/ui-v1`。**212 已闭**；**220～234** 在 D10 前收口。

| ID | Step | 内容 | 状态 | 证据 / 备注 |
|----|------|------|------|-------------|
| **TT-PH1-206** | — | 主题 V1 runbook v1.2 + 本表登记 | **closed ①** | [TT-PH1-SITE-THEME-V1-UPGRADE-001](TT-PH1-SITE-THEME-V1-UPGRADE-001.md) · **§1.6 页面 UI L5** |
| **TT-PH1-213** | 准备 | §1.5 + §6.2 POST 机采 | **closed ①** | `POST-visual-20260522.txt` |
| **TT-PH1-207** | 0 | `marketingUi.ts` marketDark 共用 token 暖金化 | **closed ①** | 2026-05-22 |
| **TT-PH1-208** | 1 | `/market` Hero · Hub · 筛选 · 弹窗主 CTA | **closed ①** | **页面 L5 closed** · D3 defer · §2.4 `/market` |
| **TT-PH1-209** | 2 | `/did-rank` 榜单 · Tab · 重试钮 | **closed ①**（Step） | **页面 L5 closed** · §2.4 `/did-rank` |
| **TT-PH1-210** | 3 | `/community/*` L1+页身 chrome | **closed ①** | batch3 · POST 九路由 PNG |
| **TT-PH1-211** | 4 | 三页机读 + `uiSystem.test.ts` | **closed ①** | §6.1 **44/44**（v1.5 · 含 `communityFeedActionTheme`） |
| **TT-PH1-212** | — | **阶段一 · 主题 V1 ① 首次闭卷** | **closed ①** | `PAGE-L5-SIGNOFF-20260522.md` · 历史 **30/30** |
| **TT-PH1-218** | 增补 | §1.7 Action 并入 V1 · 文档对齐 | **closed ①** | runbook v1.5–1.6 |
| **TT-PH1-219** | 收口 | 企业级统一（`TT_COMMUNITY_DRAWER_L5`+全 community 树） | **closed ①** | 矩阵 §8–12 · **49/49** · `rg` 0 冷色 |
| **TT-PH1-214** | B | `/` 目视签收（基准无需改码） | **closed ①** | `WAVE-B-screenshots/home/` |
| **TT-PH1-215** | B | `/traveltrust` error 暖金 + 目视 | **closed ①** | `traveltrustErrorTheme.contract` |
| **TT-PH1-216** | 桥接 | `/guides/*` 主路径暖金 | **closed ①** | `guidesTheme.contract` · `POST-V1-FINAL-20260522.txt` |
| **TT-PH1-217** | 桥接 | `/auth/*`、`/help` console 审计 | **closed ①** | `authHelpBridgeTheme.contract` · `BRIDGE-217-20260522.txt` |
| **TT-PH1-220** | C·— | 波次 C 登记 · §3.2 感知清单 | **open** | runbook v1.8.0 · `V1-PERCEPTION-CHECKLIST.md` |
| **TT-PH1-221** | C·1 | 第一波 A · `/` Hero 暖金 Action | **open** | `LandingHeroForm.tsx` |
| **TT-PH1-222** | C·1 | 第一波 B · `/market` D3/玻璃区暖金 | **open** | `MarketContentViewSortBar` 等 |
| **TT-PH1-223** | C·1 | 第一波 C · 三页壳叠层拉齐 | **open** | `TT_MARKETING_DARK_ROUTE_SCENE.market` |
| **TT-PH1-224** | C·2 | 第二波 D · 首屏一任务 | **open** | §3.2.4 |
| **TT-PH1-225** | C·2 | 第二波 E · 状态族 + 抽屉 defer | **open** | loading/error · 矩阵 §9 |
| **TT-PH1-226** | C·2 | 第二波 F · 深→浅桥接（可选） | **open** | P3 |
| **TT-PH1-227** | C·3 | 第三波 G/H/I · 微动效/版式/资产 | **open** | 按需 |
| **TT-PH1-228** | C·4 | Q1～Q8 感知 L5 目视签字 | **open** | `WAVE-C-screenshots/` |
| **TT-PH1-229** | C·1 | `homeMarketing.contract` 与 §1.7 对齐 | **closed ①** | 禁主路径 `bg-cta-gradient` · 2026-05-24 |
| **TT-PH1-230** | C·1 | `marketTheme` 覆盖 SortBar/Orders | **open** | 漏网 cyan |
| **TT-PH1-231** | C·— | §2.4 增 `/` Experience 行 | **open** | 文档 |
| **TT-PH1-232** | C·4 | 证据入仓 219f / WAVE-C | **open** | `GO_local_site_theme_v1/` |
| **TT-PH1-233** | C·— | 88 历史 cyan 句同步 | **defer** | 台账同批 |
| **TT-PH1-234** | C·4 | 控件矩阵 △ 对账 | **open** | 矩阵 §5～§9 |

**与营销轨关系：** **187～194** 已 closed ① 的是 **`/` + `/traveltrust` + Console 壳**；**206～218** 是 **marketDark 三页 + §1.7 Action**（机读 L5）。**220～228** = **波次 C 感知层**（视觉/体验债 · **不**推翻 212）。原口语「Theme V2」= runbook **§1.7**，已并入 **全站主题 V1**。

**建议施工顺序：**  
- **机读 L5（已闭）：** **213 → 207 → 208 → 209 → 210 → 211 → 212**  
- **感知层（进行中）：** **220 → 229+221(A～D) → 230+222 → 223 → 224 → 225(E/F/G) →（226）→（227）→ 231+232+234+228** — 见 **§3.2.3 / §3.2.6 / §7.2**  

**交付：** 独立开发 **不 PR**（runbook §10）。**勾选：** [V1-PERCEPTION-CHECKLIST](../../frontend/evidence/GO_local_site_theme_v1/V1-PERCEPTION-CHECKLIST.md) 与 runbook **§4.2** 同步。

---

## 截图复验 2026-05-18（① · 避免假完成）

**背景：** **TT-PH1-142～147**、**143 letterbox** 在契约与 Vitest/E2E 上为 **closed**；硬刷新桌面宽屏截图仍暴露首屏 IA/视觉债。**① 测试绿 ≠ 融资级首屏已验收**（与 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)、[TT-9628 §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion) 同键）。

**与已闭项关系：**

| 已闭 ID | 契约目标 | 复验结论 |
|---------|----------|----------|
| TT-PH1-142 | `hero-globe-viewport` + lower-third 文案区 | **verify** — 球体仍占中区过大，品牌层级弱（→ **152**） |
| TT-PH1-143 | `TravelTrustHeroFilmChrome` 上下 letterbox | **verify** — `bg-black` 7vh 像渲染断裂（→ **150**） |
| TT-PH1-144 | `hero-cta-dock` 双 CTA | **verify** — 贴底/裁切风险（→ **153**） |
| TT-PH1-147 | 粘性 nav 移出 hero | **closed ①** 结构 — PULSE 滚出 hero 后与 nav 同带（**155** **closed ①**）；球-nav 叠层 → **151** **verify** |

### 一、截图直接暴露（视觉 / 布局 / 首屏 IA）

| ID | 维度 | 现象 | 严重度 | 状态 | 建议方向 |
|----|------|------|--------|------|----------|
| **TT-PH1-150** | 视觉 · 电影语言 | 上下纯黑横带像缺图/断裂，非宽银幕感（`TravelTrustHeroFilmChrome` 7vh `bg-black` + 全页 fixed 3D 坐标系不同步） | P0 体验 | **partial ①** | `TT_CINEMATIC_HERO_LETTERBOX` 真源 · PH1-FE-150 — 观感 **verify** |
| **TT-PH1-151** | 布局 · 叠层 | 线框地球与页内 nav（公告/角色/兑换…）重叠，导航可读性差 | P0 | **partial ①** | 地球 Y/scale 下调 · nav scrim 加强 — **verify** |
| **TT-PH1-152** | 布局 · 层级 | 主标题挤在偏下窄带，「先球后品牌」 | P1 | **partial ①** | globe viewport/decor 收紧 · content shell 降 min-h — **verify** |
| **TT-PH1-153** | 布局 · CTA | 底部主按钮裁切/贴底，首屏闭环未完成 | P1 | **partial ①** | PH1-FE-153/08b + 视觉回归 375/390 — **verify** |
| **TT-PH1-154** | 可读性 | kicker 过小、对比不足 | P1 | **closed ①** | `traveltrustHeroKicker.ts` · `text-small`/`sm:text-body` |
| **TT-PH1-155** | 导航 · 密度 | 顶栏 + PULSE + 粘性 nav 三层横条 | P1 | **closed ①** | **`TravelTrustHomeLandingNavSlot`**（portal）+ **`TravelTrustLandingChrome`** · 首屏 compact nav · PULSE inline · **CSS** 跑马灯 |
| **TT-PH1-156** | 品牌 · 一致性 | 中英混排未抛光 | P2 | **partial ①** | `traveltrust_hero_title` 单键 · zh/en surface 测 · 副标 **verify** |
| **TT-PH1-157** | 交互 · 预期 | 节点过亮像可点（历史项） | P1 | **partial ①** | **TT-PH1-196** 桌面 pin 可交互 — **verify** · [动画 L5](TT-PH1-CINEMATIC-ANIMATION-L5-001.md) |
| **TT-PH1-158** | 视觉 · 品质 | 线框地球偏技术 demo（历史项） | P1 品牌 | **partial ①** | **TT-PH1-196** Hero 实拍地球 **L5 closed**；4K/更高精 **defer ②** · 见 [动画 L5 §5](TT-PH1-CINEMATIC-ANIMATION-L5-001.md#5-与-tt-ph1-台账对应) |

### 二、截图外 · 首屏工程（①）

| ID | 维度 | 问题 | 严重度 | 状态 |
|----|------|------|--------|------|
| TT-PH1-159 | 性能 · LCP | 全页 WebGL + 大 bundle，首访编译慢 | P1 | **partial ①** | hero poster/mp4 preload · layout 五角色 `prefetch` · `resolveAllRoleMediaUrls` idle |
| TT-PH1-160 | 性能 · GPU | 桌面默认 Bloom/粒子；无低画质入口 | P1 | **closed ①** | `TravelTrustCinematicLowQualityToggle` · `frameloop` idle |
| TT-PH1-161 | 无障碍 | 3D 层 SR 短；减动效关 Canvas 后偏空 | P1 | **closed ①** | `TravelTrustCinematicA11y` · 静态海报/星尘降级 |
| TT-PH1-162 | 无障碍 · 对比 | 半透明 nav WCAG 未逐条验 | P1 | **partial ①** | `traveltrustLandingNavStyles.ts` `bg/99` — 未逐条 Lighthouse |
| TT-PH1-163 | 响应式 | 375/390 首屏未在本图验证 | P1 | **closed ①** | `traveltrust-hero-visual-regression.spec.ts` 375/390 + CTA box |
| TT-PH1-164 | 内容 · API | 无 API 时 page-brief 降级 | P2（① 可接受） | **partial ①** | `TravelTrustPageBriefStatus` · Live badge `protocol_reference_doc_version` · `loadTraveltrustLayoutPreload` |
| TT-PH1-165 | 媒体 | tier-1 占位 MP4 不叠 unified 3D | P1 品牌 | **partial ①** | unified 3D 下 tier-1 视频弱化；生产短片 **②** |
| TT-PH1-166 | 埋点 | ① 仅 dev ingest | P2 → ② | defer ② |
| TT-PH1-167 | SEO | h1/meta/结构化数据策略未查 | P2 | **closed ①** | `layout.tsx` metadata · `traveltrustSeo.contract.test.ts` |
| TT-PH1-168 | 安全 · 披露 | 链 ID/风险措辞 vs 84/08-4（stats 区块已 **retired**） | P1 合规 | **partial ①** | `traveltrustComplianceDisclosure` · PH1-FE-168c E2E；legal/84 对拍 **defer** |
| TT-PH1-169 | 钱包 | 顶栏 Wallet + Hero 双入口 | P2 | **closed ①** | `deferConnectToHero` on `/traveltrust` |

### 三、全页 / 产品 / 企业治理（登记索引）

| ID | 摘要 | 阶段 | 状态 |
|----|------|------|------|
| TT-PH1-010 | 85 17 段 IA 未全覆盖 | defer 产品 | defer |
| TT-PH1-170 | 主 CTA「规划行程」→ `/` 路径统一 | ① 产品 | **closed ①** | `traveltrustPlanTripHref.ts` · `#start` |
| TT-PH1-171 | `#liquidity` 预览 swap 非真链 | ②③ | defer |
| TT-PH1-122 | PULSE 无 CMS | ② | defer |
| TT-PH1-172 | 五角色 tab 顺序 vs 85 | ① 产品 | **closed ①** | `traveltrustRolesOrder.test.ts` |
| TT-PH1-030b/032–035 | 无生产 hero/role 短片 | ② 媒体 | defer |
| TT-PH1-073b | 无定制 OG 艺术 | ② 设计 | defer |
| TT-PH1-173 | `#14100d` 暖壳 vs 85 `#030712` 口径 | ② 文档 | defer |
| TT-PH1-174 | 胶片颗粒 vs 白底页品牌断裂 | P2 | **closed ①** | `TravelTrustCinematicShell` grain mask · `#030712` vignette |
| TT-PH1-020 | 路由 code-split / 3D 懒加载 | P2 | **partial ①** | `TravelTrustPageCinematicScene` dynamic · below-fold chunks |
| TT-PH1-175 | WebGL 上下文丢失无友好降级 | P1 | **closed ①** | `TravelTrustCinematicFallbackNotice` |
| TT-PH1-176 | 长会话 HMR/.next 假死 | P1 运维 | partial（`dev:clean` 已缓解） |
| TT-PH1-090 | hero 外 idle；fixed Canvas 仍占 GPU | partial ① | **partial ①** | `frameloop=never` + `data-tt-traveltrust-page-cinematic-frameloop` |
| TT-PH1-081 | 3D 长描述不足 | P2 | **closed ①** | `TravelTrustCinematicA11y` 章节列表 + 长描述键 |
| TT-PH1-177 | FAQ 手风琴 a11y 矩阵抽测 | ① | **closed ①** | `TravelTrustFaqStrip` 方向键/Home/End |
| TT-PH1-178 | RTL / 长德语 nav·CTA | P2 | **partial ①** | `truncateTraveltrustNavLabel` + `traveltrustLocaleLayout.test.ts` |
| TT-PH1-074 | OG 未按 locale 分图 | ② | defer |
| TT-PH1-179 | 首屏 chip vs spec 84 / 融资稿 | P1 合规 | **partial ①** | chip/disclaimer + compliance 锚点；legal/84 对拍 **defer** |
| TT-PH1-180 | 示意数据缺 Illustrative 规范 | P1 | **closed ①** | `TravelTrustIllustrativeBadge`（兑换/信任等）；**stats 脚注 retired** |
| TT-PH1-050 | 生产 analytics ingest | ② | defer ② |
| TT-PH1-181 | brief/钱包/链错误首屏无引导 | P1 | **closed ①** | `TravelTrustHeroGuidance` |
| TT-PH1-182 | 无视觉回归（Percy/Chromatic） | P2 | **partial ①** | 稳定截图（遮罩 WebGL）· `stabilizeTraveltrustVisual` · PNG **须 commit** |
| TT-PH1-183 | Playwright 仅 ① 窄切片 | **partial ①** | home E2E 绿 · pi1 **26+/33**（台账/导航裁撤后已修选择器）· `TRAVELTRUST_PH1_VISUAL` 7/7 · `TRAVELTRUST_PH1_E2E_FULL` |
| TT-PH1-184 | Lighthouse 未纳入 PH-1 签字硬条件 | P2 | **partial ①** | `npm run lighthouse:traveltrust` → `evidence/GO_local_traveltrust_ph1/lighthouse/` · `TRAVELTRUST_PH1_LIGHTHOUSE=1` |
| TT-PH1-185 | Safari/Firefox WebGL 未登记 | ② | defer |

**建议下一轮（①）：** 代码侧 **150～155** 已 partial/closed — **人眼 verify** 截图观感；合规 **168/179** legal 对拍；快照 PNG **入库 git**（`e2e/…-snapshots/`）。

### 四、电影动画 L5（2026-05-19 · ①）

> **SSOT：** [TT-PH1-CINEMATIC-ANIMATION-L5-001](TT-PH1-CINEMATIC-ANIMATION-L5-001.md)（L5 定义 · 全模块段位表 · §6 闭卷勾选 · backlog）。  
> **证据：** `frontend/evidence/GO_local_hero_globe_a_closure/`（地球）· `frontend/evidence/GO_local_cinematic_l5_closure/`（全页电影）。  
> **工程闸（① · 不替代 §6.2 目视）：** `bash scripts/gates/verify-cinematic-l5-local.sh` · 批次 **A–W** · [`ENGINEERING-LOCK.md`](../../frontend/evidence/GO_local_cinematic_l5_closure/ENGINEERING-LOCK.md) · [`MAINTAINER-ONE-PAGE.md`](../../frontend/evidence/GO_local_cinematic_l5_closure/MAINTAINER-ONE-PAGE.md) · 台账互指 [`ISSUES-ENGINEERING-SYNC.md`](../../frontend/evidence/GO_local_cinematic_l5_closure/ISSUES-ENGINEERING-SYNC.md)。

| ID | 摘要 | 状态 | 证据 |
|----|------|------|------|
| **TT-PH1-195** | 动画 L5 标准与清单（runbook） | **closed ①** | 本文 §四 → [TT-PH1-CINEMATIC-ANIMATION-L5-001](TT-PH1-CINEMATIC-ANIMATION-L5-001.md) |
| **TT-PH1-196** | Hero 旅游地球 `TT-GLOBE-L5-2026-05` | **closed ①** | `GO_local_hero_globe_a_closure/` · `hero-globe-l5-desktop.png` |
| **TT-PH1-197** | 全页电影 `TT-CINEMATIC-L5-2026-05` | **closed ①** | 批次 A–W + `verify-cinematic-l5-local.sh` exit 0 · §6.2 PNG 刷新（2026-05-20）· maintainer 目视签字见 `frontend/evidence/GO_local_cinematic_l5_closure/SECTION-6-2-CHECKLIST.md` |
| **TT-PH1-198** | 滚动 handoff + 暖色走廊环 | **closed ①** | §6.2 C2 · [`HOMEPAGE-NON-DATA-CLOSURE`](../../frontend/evidence/GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) |
| **TT-PH1-199** | 环境星空/尘粒 scroll 降噪 | **closed ①** | §6.2 C3 |
| **TT-PH1-200** | 剧场 SVG 航线 + 角色视频 crossfade | **closed ①** | §6.2 C3/C4 · 实拍 mp4 **②** |
| **TT-PH1-201** | `#start` 三步 + 示意动线卡 | **closed ①** | §6.2 C5 |
| **TT-PH1-202** | Trust/FAQ/结算 section 升 L5 | **closed ①** | §6.2 C6 |
| **TT-PH1-203** | 稳定币段示意 L4 | **closed ①** | `liquidity-l5-defer` · 真兑换 **②③** |
| **TT-PH1-204** | Canvas 暖色 scrim 统一 | **closed ①** | `resolveCinematicCanvasCyanMul` |
| **TT-PH1-205** | Hero 文案动效暖色统一 | **closed ①** | trust chips · hydration 媒体 tier |

**整页动画 L5 闭卷：** [动画 L5 · §6](TT-PH1-CINEMATIC-ANIMATION-L5-001.md#6-闭卷勾选maintainer--①) **2026-05-20 已签**；**除真实数据外**首页前端见 [`HOMEPAGE-NON-DATA-CLOSURE`](../../frontend/evidence/GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md)。**不**替代 **150～153** 历史布局债。

**② 仅余：** 实拍 mp4 · 社媒 URL · page-brief/链真数据 · 见 HOMEPAGE-NON-DATA-CLOSURE §仅余。

---

### 代码收口 2026-05-19（① · 台账同步）

**Vitest** 含 **compliance disclosure** · **PH1 gate 契约** · **`traveltrustCinematicPageL5`**；**IA 裁撤** `#stats`/`#explain`；证据 **`GO_local_*_l5_closure/`**。**197～205** 电影轨 **closed ①**（2026-05-20）。**150～153** 历史布局债，**不**阻塞 `/traveltrust` ① 冻结。**不**宣称 **②③** GO。

---

## P0（挡 PH-1「可交付首页」口径）

| ID | 现象 | 处置 | 状态 |
|----|------|------|------|
| **TT-PH1-030b** | 生产级 hero/role 短片未入库 | ① **签字接受**：`npm run media:traveltrust-tier1` 占位 MP4 + 线框地球；生产实拍 **② 媒体批** | **closed ①**（接受出口） |
| **TT-PH1-050** | 埋点无生产 ingest | ① `POST /api/traveltrust/analytics` + `lib/analytics.ts` dev beacon；生产 ingest **defer ②** | **closed ①** / ingest **defer ②** |

---

## P1 · 已关闭（①）

| ID | 摘要 | 证据 |
|----|------|------|
| TT-PH1-011 | Trust + FAQ + settlement + footer | 契约 `sections.contract.test.ts` |
| TT-PH1-051 | page-brief 五事件对齐 | `traveltrustPageBrief.test.ts` |
| TT-PH1-060 | Hero 多 connector 钱包 | `TravelTrustHeroWalletConnect` + E2E |
| TT-PH1-073 | 动态 OG/Twitter 1200×630 | `opengraph-image.tsx` / `twitter-image.tsx` |
| TT-PH1-090 | WebGL 省电：标签页隐藏 + **仅 `#hero` IO** → `page-cinematic-power=idle` | `TravelTrustPageCinematicCanvas.tsx` |
| TT-PH1-120/121 | PULSE + 稳定币网关预览 | 页面锚点 + 组件 |
| TT-PH1-130～140 | Trust、HUD、3D 章节、Phase1 高亮等（**Stats/Quick Explain → retired 2026-05-19**） | Vitest 契约 |
| **TT-PH1-141** | FAQ locale 重复键覆盖 v6 文案 | `traveltrust_legacy_faq_*` + `traveltrustFaqV6Copy.test.ts` |
| **TT-PH1-142** | 地球首屏可视区（lower-third + `hero-globe-viewport`） | `TravelTrustCinematicHero` |
| **TT-PH1-143** | 电影上下黑边 | `TravelTrustHeroFilmChrome` letterbox |
| **TT-PH1-144** | 主 CTA + 钱包并排（`hero-cta-dock`） | `traveltrustHeroUi.ts` |
| **TT-PH1-145** | 滚出 hero 后 3D 静帧（非 roles 段误停） | `page-cinematic-inview` on `#hero` |
| **TT-PH1-146** | Quick Explain（**retired 2026-05-19**） | 已由 **#roles** 视频叙事替代；勿引用已删组件 |
| **TT-PH1-147** | 粘性页内 nav 移出 hero；skip → `#hero` | `TravelTrustNetworkPageMain.tsx` |
| **TT-PH1-003** | 13-1 白顶栏 vs traveltrust | **closed ①** — `Header.tsx` 深色顶栏 `#14100d` |
| **TT-PH1-004** | 壳色 vs 85 `#030712` | **closed ①** — v6 电影暖色 `#14100d` 有意；85 脚注待文档批 |
| **TT-PH1-032～035** | 生产 MP4 变体 | 随 **030b** ② 媒体批 |
| **TT-PH1-154** | Hero kicker 可读性 token | `traveltrustHeroKicker.ts` |
| **TT-PH1-155** | PULSE/nav 首屏密度 | `TravelTrustLandingChrome` |
| **TT-PH1-160** | 低画质 / GPU idle | `TravelTrustCinematicLowQualityToggle` |
| **TT-PH1-161/081** | 3D SR 长描述 + 章节 | `TravelTrustCinematicA11y` |
| **TT-PH1-163** | 375/390 响应式 + 视觉回归 | `traveltrust-hero-visual-regression.spec.ts` |
| **TT-PH1-167** | SEO metadata 契约 | `traveltrustSeo.contract.test.ts` |
| **TT-PH1-169** | 钱包单入口（顶栏 defer） | `Header.tsx` `deferConnectToHero` |
| **TT-PH1-170/172** | 规划 CTA / 角色顺序 | `traveltrustPlanTripHref` · roles test |
| **TT-PH1-174/175** | 颗粒遮罩 / WebGL 降级 | `TravelTrustCinematicShell` · FallbackNotice |
| **TT-PH1-177** | FAQ 手风琴键盘 | `TravelTrustFaqStrip` |
| **TT-PH1-180/181** | Illustrative badge / 首屏引导 | `TravelTrustIllustrativeBadge` · `HeroGuidance`（**不含** stats 条带） |
| **TT-PH1-182** | Playwright 视觉基线 | `e2e/traveltrust-hero-visual-regression.spec.ts-snapshots/` |

---

## P1 · defer（不挡 ① PH-1）

| ID | 摘要 | defer |
|----|------|-------|
| TT-PH1-010 | 85 全 17 段 IA | ① 产品 — v6 电影 IA 为 scope |
| TT-PH1-101 | 同 003 文档脚注 | ② 文档批（实现已 closed） |
| TT-PH1-122 | PULSE CMS / API | **②** |
| TT-PH1-123 | 真链兑换路由 | **②③** |
| TT-PH1-073b | 品牌定制 OG 艺术图 / 分语言 PNG | **②** 设计批（机读 PNG 已有） |

---

## P2 / backlog

| ID | 摘要 | 状态 |
|----|------|------|
| TT-PH1-012 | 角色剧场自动播放音轨 | **partial ①** | Tab 激活后静音自动 `play()`（`data-tt-traveltrust-role-video-autoplay="muted"`）；有声轨 **defer ②** |
| TT-PH1-020 | 更深 LCP 预算 / 路由级 code-split | **partial ①** Scene dynamic + below-fold prefetch |
| TT-PH1-022 | 全站 hash 深链回归 | **closed ①** | `traveltrustSectionHash` + `useTraveltrustHashScroll(ready)` · PH1-FE-022/022b/c/d + `#guide`；**`#stats`/`#explain` retired** |
| TT-PH1-042 | 移动端 Bloom 默认关（可 env 开） | closed ① 默认桌面开 |
| TT-PH1-062 | view-only 钱包仅顶栏 | closed ① 设计如此 |
| TT-PH1-074 | Twitter card 与 OG 分语言 | defer ② |
| TT-PH1-081 | 3D SR 长描述扩展 | **closed ①**（见 **161**） |
| TT-PH1-092 | 章节视频 `prefers-reduced-motion` 静态帧 | **closed ①** | `data-tt-traveltrust-role-video-static-frame` · PH1-FE-092 |
| TT-PH1-111/112 | 融资叙事外链密度 | **partial ①** | `traveltrustFundraisingLinkPolicy` · pulse 登记 · cinematic 无 fundraising/http 外链 |
| PH1-HOME-01 | `/` 行程提交依赖 API | **closed ①** | **`home-landing-itinerary-submit.spec.ts`**（**无** `data-tt-home-api-status` 预检壳；旧 **`home-landing-api-preflight`** 已移除） |
| PH1-HOME-02 | `/` 登录后 Hero 提交行程 | **closed ①** | `home-landing-itinerary-submit.spec.ts` · `injectBearerSessionInPage` |

---

## ① 浏览器复验（5 点 + 基础）

> 机读锚点通过 ≠ 融资级观感；截图级见上文 **[截图复验 2026-05-18](#截图复验-2026-05-18①--避免假完成)**（**150～158** 等）。

1. 硬刷新 `http://localhost:3012/traveltrust`  
2. `data-tt-traveltrust-page-cinematic-3d="1"`；`data-tt-traveltrust-hero-scrim="unified-3d"`  
3. 首屏见 **旅游地球**（实拍纹理 + 走廊弧线；非线框协议球 — **TT-PH1-196**）；上下 **letterbox** 存在（观感是否像 bug → **TT-PH1-150**）  
3c. `data-tt-traveltrust-cinematic-l5="TT-CINEMATIC-L5-2026-05"`（Canvas）  
3d. 慢滚 **#roles**：弧线收束、暖走廊环、环境变暗（**TT-PH1-198/199** — 见 [动画 L5 §7](TT-PH1-CINEMATIC-ANIMATION-L5-001.md#7--验收命令)）  
4. Hero **CTA 行**：主按钮 + 全宽「连接钱包」（贴底/裁切 → **TT-PH1-153**）  
5. 滚至 **#roles**：`data-tt-traveltrust-page-cinematic-power="idle"`（DevTools）  
5b. 页内 **无** `#stats` / `#explain`（已裁撤；角色视频在 **#roles**）  
6. FAQ 首条为 v6「什么是 TravelTrust Network」（非 legacy 长文）  
7. `scripts/start-api-with-seed.bat` 后 `data-tt-traveltrust-page-brief-ready="1"`  
8. `/traveltrust/opengraph-image` → PNG 200  

---

## ① 命令

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
# 电影动画 L5（TT-PH1-195～205 · 标准见 docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md）
cd frontend && npm run test -- --run traveltrustGlobe traveltrustCinematicPageL5 traveltrustNetworkPage.contract
cd frontend && npm run dev:clean
# :3012 起后
TRAVELTRUST_PH1_E2E=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
cd frontend && npm run e2e:pi1-traveltrust
# Lighthouse 旁证（TT-PH1-184 · 需 :3012）
cd frontend && npm run lighthouse:traveltrust
# 视觉回归（TT-PH1-182 · ① · 须 :3012 + :8080）
cd frontend && npm run e2e:traveltrust-visual
cd frontend && npm run e2e:traveltrust-visual:update
# 仅 Next、无 API 时生成降级基线（不推荐作签字依据）
TRAVELTRUST_VISUAL_OFFLINE=1 npm run e2e:traveltrust-visual:update
# Lighthouse 旁证（TT-PH1-184）
TRAVELTRUST_PH1_LIGHTHOUSE=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
```
