# `/traveltrust` 电影动画 L5 标准与收口清单（① 本地）

**Version:** 1.0.9  
**最后更新：** 2026-05-19  
**阶段：** **① 本地**（装饰性动效；**不**宣称 ② 航班/订单真数据、③ 生产 GIS）  
**关联闭卷 ID：** `TT-GLOBE-A-2026-05` · `TT-GLOBE-L5-2026-05` · `TT-CINEMATIC-L5-2026-05`  
**问题台账：** [issues-phase1-ui-ux-traveltrust-v6.md](issues-phase1-ui-ux-traveltrust-v6.md#四电影动画-l5-2026-05)  
**PI-1 闭卷：** [issues-phase1-local-traveltrust-v6.md](issues-phase1-local-traveltrust-v6.md)

---

## 0. 本文职责（收口真源）

| 项 | 说明 |
|----|------|
| **写什么** | L5 **定义**、**段位图例**、**全页动画模块清单**、**未达标 backlog**、**闭卷勾选**、**命令与证据路径** |
| **不写什么** | HTTP/ABI 契约（见 **04/14**）；全站 93 矩阵穷举（见 **93** / **TT-GATE**） |
| **与地球证据关系** | Hero 地球细节 DoD → [`frontend/evidence/GO_local_hero_globe_a_closure/README.md`](../../frontend/evidence/GO_local_hero_globe_a_closure/README.md)；本文管 **全页电影动画** |
| **与全页电影证据** | 滚动/剧场/`#start` → [`frontend/evidence/GO_local_cinematic_l5_closure/README.md`](../../frontend/evidence/GO_local_cinematic_l5_closure/README.md) |

**禁止假完成：** Vitest/契约绿 **≠** 融资级动画已验收；须 **① 浏览器硬刷新 + 截图**（与 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) 同键）。

---

## 1. L5 定义（① 口径）

**L5（电影动画 · 旅游品牌档）** 须同时满足：

| # | 维度 | 标准 |
|---|------|------|
| L5-1 | **叙事** | 主叙事为 **全球定制游 + 示意目的地/走廊**；Web3/托管为 **辅**，不抢首屏主视觉 |
| L5-2 | **视觉** | 约 **70% 旅游写实/暖色** + **30% 轻玻璃/光晕**；冷青协议环/虚线/密网格 **不主导** |
| L5-3 | **交互** | 桌面关键装饰有 **可访问闭环**（悬停/点击/滚动 handoff）；`prefers-reduced-motion` / 低画质有降级 |
| L5-4 | **工程** | Token 真源 + Vitest/契约；闭卷 ID 写入 `userData` 或 `data-tt-*` 锚点 |
| L5-5 | **证据** | ① 截图入库 `frontend/evidence/GO_local_*` + 本文 **§6 勾选** |

**段位图例（维护用）：**

| 段位 | 含义 |
|------|------|
| **L5** | 满足 §1 全表；已闭卷或 maintainer 签字 |
| **L4.5** | 代码已合入，**待人眼**或缺单一维度（如叙事仍偏抽象） |
| **L4** | 顺滑 Framer/Three，旅游统一性不足 |
| **L3** | 通用入场/实用动效，非品牌定制 |

---

## 2. 闭卷轨道与代码真源

| 轨道 | Sprint ID | 状态（2026-05-19） | Token / 入口 |
|------|-----------|-------------------|--------------|
| Hero 旅游地球 | `TT-GLOBE-L5-2026-05` | **closed ①** | `TT_CINEMATIC_GLOBE_VISUAL` · `traveltrustGlobeEarthAsset.ts` |
| 全页电影动画 | `TT-CINEMATIC-L5-2026-05` | **closed ①**（§6.2 PNG 刷新 + maintainer 签字 **2026-05-20**） | `traveltrustCinematicNonGlobeL5.ts` · §3.2 |
| PH-1 台账项 | `TT-PH1-195`～`TT-PH1-205` | 见 [问题明细 §四](#与-tt-ph1-台账对应) | 本文 §3～§5 |

---

## 3. 全页动画模块清单（段位 · 2026-05-19）

> **维护规则：** 升段时改 **段位** + **状态** + **证据**；闭卷时 §6 勾选并更新 [issues-phase1-ui-ux](issues-phase1-ui-ux-traveltrust-v6.md)。

### 3.1 已 L5 或已闭卷

| 模块 | 组件 / 文件 | 段位 | 状态 | 备注 |
|------|-------------|------|------|------|
| Hero 3D 旅游地球 | `TravelTrustTourismGlobe*` · `Phase1TravelArcs` · `Phase1GlobeHighlights` | **L5** | **closed ①** | `TT-GLOBE-L5`；证据 `hero-globe-l5-desktop.png` |
| 地球桌面交互 | `TravelTrustGlobeInteractionContext` | **L5** | **closed ①** | pin hover/click → `#start` |
| 底部走廊胶囊 | `TravelTrustPhase1RegionRoster` | **L5** | **closed ①** | 随 `routeBias`；居中不裁切 |

### 3.2 全页电影模块（代码 L5 · §6.2 待人眼签字）

| 模块 | 组件 / 文件 | 段位 | 2026-05-19 合入 |
|------|-------------|------|----------------|
| 滚动 handoff | `PageHeroGlobeRig` · decor fade | **L5** | decor 收束 + 暖走廊弦（代码） |
| 剧场走廊环 3D | `PageTravelCorridorRing` | **L5** | 枢纽球标记 + 主走廊弦 |
| 星空/尘粒环境 | `PageCinematicEnvironment` | **L5** | scroll 隐藏 + `PageCinematicHorizonFog` |
| 剧场 SVG 航线 | `TravelTrustRouteArc` | **L5** | 三条走廊 **文字标签** |
| 角色视频切换 | `TravelTrustRoleVideoPlayer` | **L5** | 暖占位 + 角色名/示意文案 · crossfade |
| Hero 滚动提示 | `TravelTrustCinematicHero` | **L5** | `heroScroll` 位移 + trust chips |
| `#start` | `TravelTrustStartSection` + `TravelTrustStartRoutePreview` | **L5** | 三步 pill 脉冲 + 动线卡边框 sync |
| Canvas scrim | `resolveCinematicCanvasCyanMul` | **L5** | 滚离 Hero 压冷青层 |
| 页脚 | `TravelTrustNetworkFooter` · cross-nav · social | **L5** | 5 列社媒栅格 · 链列对齐 |
| Trust/FAQ | `TravelTrustTrustFactsStrip` · `TravelTrustFaqStrip` | **L5** | 正文对比度 + 暖色卡片/手风琴 |
| 顶栏 / 滚动条 | `TravelTrustLandingNav` · `TravelTrustScrollProgress` | **L5** | 双行 chrome · 叙事字幕可读 |
| 角色剧场 | `TravelTrustIdentityTheater` | **L5** | 暖面板框 · handoff 文案 |
| Hero 信任 chips | `TravelTrustCinematicHero` | **L5** | 旅游向 copy（向导匹配/行程示意/信任说明）+ `heroTrustChip` 暖色 token |
| 走廊环枢纽标签 | `PageCorridorHubLabels` | L4.5→L5 | Html 地名 + 弦上光点 |
| Bloom / 后处理 | `TravelTrustCinematicBloom` | L4.5→L5 | `TT_CINEMATIC_PAGE_L5.bloom` |
| Canvas 暖 scrim | `buildPageCinematicCanvasOverlayLayers` | L4.5→L5 | `resolveCinematicScrollWarmBandPeak` |
| 地平线弧 | `TravelTrustHorizonArc` | **L5** | 暖渐变 + 多旅行动点 |
| 针脚/胶囊 | `Phase1GlobeHighlights` · `Phase1RegionRoster` | **L5** | 暖色 tooltip / tier 标 |
| Letterbox | `TravelTrustHeroFilmChrome` | **L5** | 暖衬线可见度提升 |
| 顶栏 | **`TravelTrustHomeLandingNavSlot`** + **`TravelTrustLandingChrome`** | **L5** | portal L1 · 薄 HUD · 双行 · 无「全部章节」 |
| Pulse 公告 | `TravelTrustPulseTicker` | **L5** | inline **慢速 marquee**（`inlineMarqueeDuration` · 减动效时 `static`）· 日期对比度 · 标签簇 **`rgba(249,215,121,…)` + globals**（**closed ① 2026-06-03** · [`L1-PULSE-LABEL-CONTRAST-FREEZE`](../../frontend/evidence/GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md)）· section 保留 marquee |
| 稳定币预览 | `TravelTrustStablecoinGateway` | L4 | 卡片暖框；USDC 符号色保留 |

### 3.3 L3～L4 — 未达 L5（backlog）

| 模块 | 组件 / 文件 | 段位 | 升 L5 方向 |
|------|-------------|------|------------|
| 稳定币预览 | `TravelTrustStablecoinGateway` | L4 | 非旅游主叙事；① 维持示意 + 预览横幅即可 |
| 壳层 letterbox | `TravelTrustHeroFilmChrome` | — | 已并入 §3.2 **Letterbox L5** |
| 遗留 Web3 3D 件 | `TravelTrustWeb3CinematicElements` | L3 | Hero 已禁用 `TrustEscrowFilaments`；勿回潮 |
| 独立剧场 Canvas | `TravelTrustTheaterScene3D` | — | `UNIFIED_PAGE_3D` 下不挂载 |
| WebGL 降级条 | `TravelTrustCinematicFallbackNotice` | L4.5 | 暖色按钮已合入；**verify** |

---

## 4. 优先级 backlog（补齐顺序）

与 §3.2/3.3 同源；**完成一批 → 改段位 → 截图 → §6 勾选**。

### P0 — 叙事与视觉语言

| # | 项 | 目标文件 |
|---|-----|----------|
| P0-1 | 走廊环旅游化（非抽象协议环） | `TravelTrustPageCinematicScene.tsx` |
| P0-2 | SVG 航线 + 目的地语义 | `TravelTrustRouteArc.tsx` |
| P0-3 | 环境层：雾/地平线或 scroll 后隐藏 | `PageCinematicEnvironment` |
| P0-4 | Canvas overlay 暖色统一 | `traveltrustCinematicVisual.ts` |

### P1 — 体验完整度

| # | 项 | 目标文件 |
|---|-----|----------|
| P1-1 | `#start` 与行程/地图卡片联动 | `TravelTrustStartSection.tsx` |
| P1-2 | 角色 Tab 色温与全页环同步 | `TravelTrustIdentityTheater.tsx` |
| P1-3 | Trust/FAQ 旅游向 copy + 轻 reveal | 各 strip + locales |

### P2 — 锦上添花

| # | 项 |
|---|-----|
| P2-1 | 顶栏滚动与 Hero 地球联动 |
| P2-2 | 移动端 scroll handoff 简化版 |

---

## 5. 与 TT-PH1 台账对应

| ID | 摘要 | 状态 | 证据 / 真源 |
|----|------|------|-------------|
| **TT-PH1-195** | 电影动画 L5 **标准与清单**（本文） | **closed ①** | 本 runbook |
| **TT-PH1-196** | Hero 旅游地球 **L5**（`TT-GLOBE-L5`） | **closed ①** | `GO_local_hero_globe_a_closure/` |
| **TT-PH1-197** | 全页电影 **L5 轨**（`TT-CINEMATIC-L5`） | **closed ①** | `GO_local_cinematic_l5_closure/` · §6.2 **2026-05-20** |
| **TT-PH1-198** | 滚动 handoff + 走廊环 | **closed ①** | §6.2 C2 · 2026-05-20 |
| **TT-PH1-199** | 环境星空/尘粒降噪 | **closed ①** | §6.2 C3 |
| **TT-PH1-200** | 剧场 SVG + 角色视频 | **closed ①** | §6.2 C3/C4 · 实拍 **②** |
| **TT-PH1-201** | `#start` 三步动效 | **closed ①** | §6.2 C5 |
| **TT-PH1-202** | Trust/FAQ/结算 section L5 | **closed ①** | §6.2 C6 |
| **TT-PH1-203** | 稳定币段 L5 | **partial ①** | 暖框；非主叙事 · **defer ②** |
| **TT-PH1-204** | Canvas 暖色 scrim 统一 | **partial ①** | warm band + cyanMul · **verify** |
| **TT-PH1-205** | Hero 文案/chips/地平线 L5 | **partial ①** | 旅游 chips + 暖弧/首屏 cyan 压暗 + HorizonArc · **verify** |
| **TT-PH1-158** | 线框地球偏 demo（历史） | **partial ①** | **196** 已 L5 实拍地球；158 余量 → ② 4K/实拍 **defer** |

**替代关系：** **TT-PH1-157**（假可点）在 **196** 闭环后改为 **verify** 针脚交互；以 **196/197** 为准。

---

## 6. 闭卷勾选（maintainer · ①）

> **全页 L5 闭卷条件：** §3.1 全部 **L5** + §3.2 全部升 **L5** + §3.3 中 P0/P1 项 **closed** 或 **defer** 写明。

### 6.1 Hero 地球（`TT-GLOBE-L5`）— 已签

- [x] G1 地球纹理/弧线/针脚目视 OK  
- [x] G2 胶囊全文 + 点击 `#start`  
- [x] G3 `hero-globe-l5-desktop.png` 入库  

### 6.2 全页电影（`TT-CINEMATIC-L5`）

- [ ] C1 Hero 地球 L5 不回退（复用 G1～G3）  
- [ ] C2 滚动 0→1：decor 收束 + 暖走廊环（无太平洋孤儿弧回潮）  
- [ ] C3 `#roles` 段星空/尘粒已压暗  
- [ ] C4 角色 Tab 视频 crossfade 无青脉冲闪环  
- [ ] C5 `#start` 三步 pill 入场  
- [ ] C6 必检三图 `hero-scroll-handoff-l5.png` · `roles-theater-l5.png` · `start-steps-l5.png` 入库 `GO_local_cinematic_l5_closure/`（机读：`verify-cinematic-l5-local.sh`）  
- [ ] C6opt `faq-trust-l5.png`（可选旁证）  
- [ ] C7opt `settlement-liquidity-l5.png`（可选旁证）  

**工程闸（① · 不替代上列目视）：** `bash scripts/gates/verify-cinematic-l5-local.sh` · 批次 **A–W** · [`MAINTAINER-ONE-PAGE.md`](../../frontend/evidence/GO_local_cinematic_l5_closure/MAINTAINER-ONE-PAGE.md)

**签字：** **Sebastian Ward（塞巴斯蒂安·沃德）**　**日期：** 2026-06-03

---

## 7. ① 验收命令

```bash
# 非地球轨 · 工程闸（Vitest + C1–C5 PNG 存在；不替代 §6.2 目视）
bash scripts/gates/verify-cinematic-l5-local.sh
# 或
cd frontend && npm run verify:cinematic-l5
cd frontend && npm run test:cinematic-l5

# Hero 地球（锁定轨 · 与全页并读）
cd frontend && npm run test -- --run traveltrustGlobe traveltrustCinematicPageL5
cd frontend && npm run check:e2e:tsc

# 可选重导 §6.2 PNG（dev 已起 · 默认 :3012）
CAPTURE_CINEMATIC_L5_REFRESH=1 bash scripts/gates/verify-cinematic-l5-local.sh
# 或 cd frontend && npm run capture:cinematic-l5
```

证据目录：**[`frontend/evidence/GO_local_cinematic_l5_closure/`](../../frontend/evidence/GO_local_cinematic_l5_closure/)** · maintainer 一页 **[`MAINTAINER-ONE-PAGE.md`](../../frontend/evidence/GO_local_cinematic_l5_closure/MAINTAINER-ONE-PAGE.md)**。

**浏览器（硬刷新 `http://127.0.0.1:3012/traveltrust` · 桌面 ≥1280px）：**

1. 首屏地球 L5（§6.1）  
2. 慢滚至 `#roles`：弧线变淡、暖环、环境变暗（C2/C3）  
3. 切换角色 Tab（C4）  
4. 滚至 `#start` 看三步 pill（C5）  

### 7.1 §6.2 截图步骤（maintainer · ①）

| 勾选 | 文件名 | 操作 |
|------|--------|------|
| C1 | （复用 `hero-globe-l5-desktop.png`） | 首屏 1280×800+：地球暖色、pin 可悬停、无厚青赤道 |
| C2 | `hero-scroll-handoff-l5.png` | 自 Hero **慢滚** 至 `#roles` 中段：decor 收束、暖走廊环、右下角章节叙事字幕 |
| C3 | `roles-theater-l5.png` | `#roles`：Tab + 暖 SVG 走廊标签 + 视频 crossfade；背景尘粒/星空已压暗 |
| C4 | （可并入 C3） | 切换 2 个角色 Tab，确认无冷青闪环 |
| C5 | `start-steps-l5.png` | `#start`：三步 pill **与** 示意动线卡 **同步高亮**（约 2.8s 一轮） |
| C6 | `faq-trust-l5.png`（可选） | `#trust`→`#faq` 暖板；顶栏 `site-nav=0` |
| C7 | `settlement-liquidity-l5.png`（可选） | `#settlement` 协议区 + 稳定币氛围层（**不**纳入 verify 必检） |

三图（C2–C5）+ C1 入库后勾选 §6.2；C6/C7 为旁证。

**Letterbox（TT-PH1-150 · verify）：** unified Hero 顶/底可见薄 ink 遮幅 + 暖色衬线（`data-tt-traveltrust-hero-letterbox-l5="warm"`），地球主体不被压黑。

**稳定币段（TT-PH1-203 · defer ①）：** 见 `data-tt-traveltrust-liquidity-l5-defer` + `traveltrust_liquidity_l5_scope_note`；**不**作为全页 L5 主验收项。

---

## 8. 版本与变更

| Version | 日期 | 变更 |
|---------|------|------|
| 1.0.9 | 2026-05-19 | 清单收口：薄顶栏 HUD、Hero 偏移/免责间距、Pulse 紧凑+慢滚、稳定币降权 |
| 1.0.8 | 2026-05-19 | L5 续批：剧场视频暖占位+面板框、#start 三步/动线脉冲、Trust/FAQ 对比度、滚动字幕/letterbox；§6.2 三图仍待签 |
| 1.0.7 | 2026-05-19 | L5 批（非地球）：Pulse inline 慢速 marquee、页脚栅格/社交 5 列、顶栏轻量面、合规→页脚间距；§6.2 仍须 maintainer 截图 |
| 1.0.8 | 2026-05-20 | 审计批 B–F（非地球 UI）：chrome/剧场/信任/FAQ/启程/页脚/稳定币 token；§6.2 三图仍 maintainer |
| 1.0.9 | 2026-05-20 | 收尾：Tab 暖闪 crossfade、Hero CTA 安全区/letterbox 布局、scroll handoff 锚点、`e2e/cinematic-l5-evidence-capture.spec.ts` |
| 1.0.6 | 2026-05-19 | P2：`TT_SECTION_CONTENT` 接 rhythm、Horizon/减动效星野/海报 shimmer 单次、Hero split feather、Trust 图标、FAQ 内边距、§6.2 `CAPTURE.md` |
| 1.0.5 | 2026-05-19 | 截图审计批：`TT_PAGE_VERTICAL_RHYTHM_L5`、Pulse 跑马灯叠字修复、剧场/ Hero / FAQ / 稳定币降权 / 页脚栅格（**不动地球**） |
| 1.0.4 | 2026-05-19 | Hero L5 复验批：暖色多层弧、`cyanHeroRestMul`、右上暖 scrim、旅游向 trust chips、标题间距 |
| 1.0.3 | 2026-05-19 | letterbox 暖衬线、#start 三步联动、稳定币 defer 标注、§7.1 截图步骤 |
| 1.0.2 | 2026-05-19 | L5 续批：章节叙事字幕、Hero chips、HorizonArc 暖色、针脚 tooltip、runbook §3 段位同步 |
| 1.0.1 | 2026-05-19 | P0/P1 批量合入：走廊环/环境/航线标签/start 动线卡/暖色 token |
| 1.0.0 | 2026-05-19 | 初版：L5 标准、全模块清单、PH1-195～205、与证据目录互链 |

**下一版闭卷时：** 更新 §3 段位表、§6 勾选、**Version**；同步 [issues-phase1-ui-ux](issues-phase1-ui-ux-traveltrust-v6.md) §四状态列。
