# Hero L5 Final Polish — Before / After（① 本地 · 未提交）

**批次 ID**：`TT-HERO-L5-FINAL-POLISH-2026-05`  
**约束**：未改 P0/P1/P2/PassA/PassB、未改坐标、未新增国家、未提交 git。

## Before（优化前）

| 维度 | 表现 |
|------|------|
| 叙事定位 | 「全球节点示意」— 十国 **国名·城市** 标签（如 中国·北京） |
| 动效 | 走廊 pulse **仅 focus 走廊** 单点；枢纽光点 **仅 active** 呼吸 |
| 氛围 | 海洋/云层与陆地同层偏暗暖褐，无局部提亮叠光 |
| 粒子 | 无方向性旅行粒子 |
| 右侧 Hero 卡 | 「全球链上旅游网络 · 链上托管规划」；时间轴「规划/匹配/托管」偏协议 |
| Trust chips | 跨境托管示意 / 链上信任说明 |

## After（优化后）

| 维度 | 表现 |
|------|------|
| 叙事定位 | **Web3 旅游目的地体验** — 十枢纽 **城市·目的地**（东京·银座、巴黎·左岸、北京·皇城…） |
| travel pulse | `TravelTrustHeroL5ExperienceLayers`：**全走廊双轨** SVG 脉冲（常驻 + focus 加强） |
| 方向粒子 | 视口内 **10 粒** 暖色微粒沿 NE 漂移（`data-tt-traveltrust-hero-l5-direction-particles`） |
| hub 呼吸 | **全部** 投影枢纽光点 + **核心标签** scale 呼吸（非仅 focus） |
| 海洋/云层 | `mix-blend-screen` 径向叠光提亮海面/云区；**陆地贴图未改**（Pass A 冻结） |
| 右侧 Hero 卡 | 「Web3 旅游目的地体验 · 规划 → 匹配 → 托管出行（示意）」；时间轴 **规划行程 / 智能匹配 / 托管出行** |
| Trust chips | 定制行程保障 / 全球枢纽网络 / 透明托管说明 |

## 代码触点（非冻结）

- `frontend/lib/traveltrustHeroL5FinalPolish.ts`
- `frontend/components/traveltrust/cinematic/TravelTrustHeroL5ExperienceLayers.tsx`
- `frontend/components/traveltrust/cinematic/TravelTrustHeroDestinationLabels.tsx`
- `frontend/components/traveltrust/cinematic/TravelTrustHeroGlobeNetworkDecor.tsx`（hub 全量呼吸）
- `frontend/components/traveltrust/cinematic/TravelTrustCinematicHero.tsx`（挂载 L5 层）
- `frontend/locales/zh.ts` / `en.ts`

## 本地验收（①）

```bash
cd frontend && npm run test -- traveltrustHeroL5FinalPolish traveltrustGlobeEquirectAlignment traveltrustHeroGlobeLabelLayout
npm run clean && npm run dev:webpack
```

打开 `/traveltrust`，硬刷新后检查：

- `data-tt-traveltrust-hero-l5-final-polish="1"`
- `data-tt-traveltrust-hero-l5-travel-pulse="1"`
- `data-tt-traveltrust-hero-l5-destination-labels="1"`
- 标签为 **城市·目的地** 而非国名前缀
- 右侧 lead / timeline / chips 弱化「链上/协议」口吻

## L5.2 不合理修复（截图复盘）

| 问题 | 修复 |
|------|------|
| 鼠标移入右侧 CTA 误设 `focusedRegion` → 标签只剩 1 个 | 移除 CTA dock 的 `onMouseEnter` focus |
| focus 时非走廊标签 `opacity:0` / 过滤隐藏 | 前半球标签始终显示；focus 时仅 **50% 淡化** |
| 画面东京、左下写「大西洋精选」 | 胶囊 **优先可见枢纽** + 目的地短名（`traveltrustHeroGlobeRosterCopy`） |
| 赤道横向「光带」 | 去掉 `plus-lighter` 全宽叠光，改 **分块海面** 径向 |
| 双轨 SVG pulse 过重 | P3 层仅 **active** 单 pulse；常驻双轨留在 L5 层 |

## L5 视觉收口（标签 ≤4 · 弧线 −12% · 2026-05-21）

见 **[L5-VISUAL-CLOSURE-BEFORE-AFTER.md](./L5-VISUAL-CLOSURE-BEFORE-AFTER.md)**（不抬地球亮度；P0/P1/P3 回归表）。

## Pass A 提亮（2026-05-21 · 取代 DOM/CSS 叠光）

见 **[PASS-A-BRIGHTEN-BEFORE-AFTER.md](./PASS-A-BRIGHTEN-BEFORE-AFTER.md)**：`earthDisplayBrightness` 1.30、sepia 0.04、saturate 0.9、缘壳/暖雾下调；**已移除** DOM 海洋叠光与 Canvas filter。

## 说明

- **中国枢纽坐标仍为北京**（`traveltrustHubGeo` 未动）；标签为 **北京·皇城**（非上海·外滩，避免与 WGS84 错位）。
