# Hero 空域色偏 · 叠层审计（① 本地）

**日期**：2026-05-20  
**页面**：`/traveltrust` · `UNIFIED_PAGE_3D=1`  
**目标色**：与 layout / 下方区块一致 · `#0c0a09`（暖墨）

---

## 1. 现象与两个独立问题

| 现象 | 类型 | 结论 |
|------|------|------|
| 「横着一长条」色不对、**下面没事** | **Hero 透明 + 固定 WebGL** | Hero 用 `bg-transparent`（`TT_MARKETING_TRAVELTRUST_HERO_SECTION_UNIFIED_3D_CLASS`），整条首屏横带透出 `fixed z-[1]` Canvas 的蓝紫空域；**折叠区**有 `TT_BELOW_HERO_FADE` / `TT_BELOW_FOLD_SCROLL_PLATE` 等 **`#0c0a09` 实底** 盖住 Canvas，所以下面正常 |
| 「背景跑到地球上层」 | **叠层错误** | 曾用 overlay `unshift` 暖墨天幕压在 Canvas 上（已撤）；电影 overlay 仍在 Canvas 之上，但应用 mask 镂空 |
| 「还是蓝色 / 紫靛」 | **多源混色** | 横带内 primarily WebGL 空域 + 右侧叠层；球体海洋贴图仍可能偏蓝（冻结资产） |

---

## 2. DOM / z-index 真值（从底到顶）

```
layout z-0          TravelTrustRouteFixedAmbientLayers subdued
                    └─ .bg-traveltrust-atmosphere-unified → #0c0a09 纯色 ✓

main z-2            TravelTrustPageCinematicCanvas  fixed z-[1]
                    ├─ [1] div  canvas-warm-base-l5     absolute inset-0  (#0c0a09)
                    ├─ [2] <Canvas> WebGL             地球 / 弧线 / 雾
                    └─ [3] motion.div overlay         absolute inset-0  ← 始终在 [2] 之上
                    └─ [4] warm-band / bridge shimmer  同上

main z-2            TravelTrustCinematicViewportInk   fixed z-[2]  左右暖墨护板

hero section z-10   TravelTrustCinematicHero
                    ├─ TravelTrustHeroFilmChrome z-[2]  letterbox
                    ├─ scrim / copy-scrim
                    └─ 文案卡 z-[6]  （无 WebGL 地球；地球只在 [2] Canvas）

shell z-24          TravelTrustCinematicShell  grain + vignette（暖色，非主因）
```

**关键**：地球只存在于 `[2] Canvas`。任何 `[3] overlay` 上不透明的像素都会挡住地球——与 CSS `background` 列表里「第几层 gradient」无关，**DOM 顺序已决定 overlay 整体压在球上**。

---

## 3. 根因 A：暖墨天幕盖球（已确认 · 代码）

**文件**：`frontend/lib/traveltrustCinematicNonGlobeL5.ts`

```ts
layers.unshift(buildHeroWarmSkyWashLayer(globeOpticalX));
```

- `unshift` → 进入 `canvasOverlayBackground` 的 **第一个** gradient。
- CSS 规范：**列表第一项 = 最上层绘制**。
- `buildHeroWarmSkyWashLayer` 在 56% 半径外使用 `rgba(12,10,9,0.72)`～`#0c0a09`，中心虽写 `transparent`，但：
  - 光学孔 `--tt-hero-globe-optical-x/y` 与 **3D 球体屏幕投影**（`PageHeroGlobeRig` + 相机）可能不一致；
  - 椭圆仅 58%×52%，地球实际占屏更大时，**暖墨会压在球体边缘乃至主体上** → 用户描述「背景在地球上层」。

**同类问题**：`layers.push(...)` 的底层 radial 若中心为 `rgba(12,10,9,0.62) 0%`，在 overlay 透明区叠加上仍会参与混色，但 **不会** 像 `unshift` 顶层那样直接「糊一层皮在球上」。

---

## 4. 根因 B：仍偏蓝（多源 · 按贡献）

| 来源 | 文件 | Hero 首屏 | 说明 |
|------|------|-----------|------|
| 海洋 JPEG / 增强贴图 | `traveltrustGlobeEarthTexture.ts` | 活跃 | 海洋本身偏青蓝；`saturate(0.52)` 仍保留蓝绿主色 → **球体区域看起来仍蓝**（属球面，非 layout 底） |
| WebGL 场景底 + 雾 | `TravelTrustPageCinematicScene.tsx` | `#0c0a09` | `color` + `fog` 已是暖墨；空域应暖，除非被 CSS 叠层盖住 |
| 暖空穹 mesh | `PageCinematicWarmSkyShell` | 活跃 | `BackSide` 大球 `#0c0a09`，用于压 FillLight 冷天光；与相机/雾距离有关 |
| 地球 FillLight | `TravelTrustTourismGlobeFillLight`（冻结） | 活跃 | 主光暖；半球 `#141210` / `#0c0a09` |
| 页面点光 | `PageCinematicLighting`（冻结） | 首屏应关 | 用 **pageScroll** 算 `hero`；`heroCoolBrandLightMul:0` 且 `hero>0.55` 时 `sceneMul=0` → 首屏点光强度 0 ✓ |
| 冷青 CSS scrim | `buildPageCinematicCanvasOverlayLayers` | 应关 | `resolveNonGlobeCanvasCyanMul` 在 `heroT<0.55` 为 0 → 不生成 `35,206,217` 层 |
| 冷青 film ink | `TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY` | 经 remap | `rgba(3,7,18)` → `rgba(12,10,9)` |
| 旅行弧线 / pin 光晕 | `TravelTrustPhase1TravelArcs` 等（冻结） | 活跃 | additive 光晕在空域可扩散，与蓝海 fog 易混成紫靛 |
| tier-1 Hero 视频 | `TravelTrustCinematicHero.tsx` | 若有 mp4 | `mix-blend-soft-light` 叠在 z-[0]，可能偏冷 |
| layout 大气 | `globals.css` `.bg-traveltrust-atmosphere-unified` | ✓ | 仅 `#0c0a09`，无渐变 |

**不是主因**：`TravelTrustRouteFixedAmbientLayers` 在 `subdued` 时已不用 `.bg-traveltrust-atmosphere`（含 `rgba(35,206,217,...)` 那套）。

---

## 4b. 蓝紫根因（2026-05-20 复审 · 非「没改到」）

| 层级 | 真因 | 为何前几轮无效 |
|------|------|----------------|
| 球面 | `globe-earth-equirect-2k.jpg` 蓝海 + `hue-rotate(-14deg)` 偏紫 | 只调雾/overlay 不改贴图仍像「蓝地球」 |
| DOM | Hero `z-[10]` 的 `TT_MARKETING_HERO_UNIFIED_SCRIM` **整层压在** Canvas `z-[9]` 上 | 叠层顺序修 underlay 后 scrim 仍盖球 |
| WebGL | 弧线 **外管光晕**（粗 tube + 暗底）混成粉紫 | 减 opacity 不够，首屏需关 glow tube |
| 环境 | `BelowFoldAtmosphere` 全屏 fixed；`PageCinematicLighting` 曾用 **pageT** 判 hero | 与 hero 滚动手感不同步 |

## 5. 已落地修复（2026-05-20 · ①）

| 项 | 实现 |
|----|------|
| 撤掉盖球天幕 | 删除 overlay `unshift(buildHeroWarmSkyWashLayer)` |
| 暖墨在球下 | `buildHeroWarmSkyBaseBackground` → `canvas-warm-base-l5`（Canvas 之前） |
| overlay 不挡球心 | `buildHeroCanvasOverlayMaskImage` + overlay `mask-image` 镂空；并过滤 `ellipse 78% 64%` 球心暖 radial |
| 冷青 scrim | `cyanMul:0` when `heroT<0.55` |
| WebGL 首屏 | `heroT<0.58` 时不挂 opaque `color` background；雾仍为 `#0c0a09` |
| 重启 | `set TRAVELTRUST_UI_HANDOFF=1` + `scripts/start-api-with-seed.bat` 默认清 `.next` |
| Hero 横条暖墨背板 | `TravelTrustHeroGlobeUnderlayDecor` **z-[8]** · `data-tt-traveltrust-hero-warm-backdrop-l5` · **低于** WebGL z-[9]；球区 mask |

**L5 色系统一 pass 2（2026-05-20）**：加强 `buildHeroOuterSkyWarmRingLayer` / `HeroGlobeWarmLimbShell` + 新增 `HeroGlobeWarmFrontVeil`；地球 `enhanceTraveltrustGlobeEarthMap` 暖乘色；弧线 glow↓；首屏地球 scale 0.8。复验：清 `.next` + `TRAVELTRUST_UI_HANDOFF=1` + `start-api-with-seed.bat`。

球面海洋已暖化仍非纯 `#0c0a09`（旅游地球贴图），与空域暖墨分开看待。

## 6. 原则（后续勿回退）

1. **禁止**在 overlay 上用 `unshift` 铺全屏暖墨「天幕」（会压在 Canvas 上）。
2. 首屏暖墨只加在 **Canvas 下方** 的 `canvas-warm-base-l5`。
3. overlay 用 **mask 镂空** + 边缘 letterbox / 分栏遮罩 only。
4. 球体再暖需 `TT-GLOBE-L5` 解锁后改冻结资产。

---

## 8. 半屏青紫硬切（2026-05-20 · 企业级复审 · 主因）

| 维度 | 结论 |
|------|------|
| **现象** | 视口 **上约 50%** 为扁平青紫/深蓝块，**下 50%** 暖墨 + 地球上半球被横线「切头」；下缘为 **直线** 而非天空渐变 → **DOM 矩形叠层**，非 WebGL 雾 alone |
| **主因（P0）** | `TravelTrustCinematicHero.tsx` · **`showTier1AccentVideo`**：`absolute top-[8%] h-[min(48svh,520px)]` + `mix-blend-soft-light` · **Hero `z-[10]` > Canvas `z-[9]`** · tier-1 航拍 mp4 偏冷 |
| **为何 sky-cap / letterbox 无效** | 天幕盖在 **Canvas 内部**（z-[9]）；视频在 **Hero 子树**（z-[10]），在盖层 **之上** |
| **次因（P1）** | WebGL 空域冷青、海洋贴图、弧线 additive（见 §4）— 只影响球周/空域，**造不出** 整屏 50% 矩形冷块 |
| **修复** | unified 下 **`showTier1AccentVideo = false`**；**且** `showFullHeroVideo` 仅 `tier===production`；**`TT_HERO_TOP_INK_VEIL_L5`**（Hero z-[10] 顶 ~62vh 暖墨 · 高于 Canvas z-[9]）；Canvas **`TT_CANVAS_HERO_SKY_CAP_L5` z-[6]** 双保险；globe preload **`crossOrigin="anonymous"`** |

## 9. 中间横带 pass 3（2026-05-20 · `TT-GLOBE-L5-UNLOCK-WARM-INK`）

| 项 | 实现 |
|----|------|
| 球面赤道 | `enhanceTraveltrustGlobeEarthMap` 赤道 multiply 压青 |
| 首屏 tier | `resolveHeroWarmInkGlobeTier` 保留 **JPEG** + Basic 材质 |
| WebGL 缘壳 | `PageHeroGlobeWarmShell` · `TT_HERO_GLOBE_WARM_LIMB_SHELL` / `FRONT_VEIL` |
| DOM 赤道 | `TT_HERO_MID_INK_VEIL_L5` 加强 |
| Canvas 外环 | `buildHeroOuterSkyWarmRingLayer` 收紧 |
| 云/脉冲 | 首屏 `cloud opacityScale 0.18`；`RouteTrustPulses` 仅 `heroT>0.22` |

DevTools 快检：`data-tt-traveltrust-hero-tier1-accent="1"` 首屏应为 **0**；`data-tt-traveltrust-canvas-hero-sky-cap-l5="1"` 在 Canvas 内。

---

## 7. 验收（①）

- [ ] 地球主体不被半透明暖墨整层盖住（边缘光晕除外）
- [ ] 地球 **外侧** 空域与 `#overview` 下区块目视同为暖墨，无整屏青紫天幕
- [ ] DevTools：选中 `data-tt-traveltrust-canvas-overlay-l5`，首屏 **无** 覆盖全球心的不透明 `background` 层

---

## 8. 关键路径索引

| 用途 | 路径 |
|------|------|
| 叠层 DOM | `TravelTrustPageCinematicCanvas.tsx` |
| 暖墨 builder | `traveltrustCinematicNonGlobeL5.ts` → `buildWarmPageCinematicCanvasOverlayLayers` |
| 冻结 overlay 公式 | `traveltrustCinematicVisual.ts` → `buildPageCinematicCanvasOverlayLayers` |
| WebGL 场景 | `TravelTrustPageCinematicScene.tsx` |
| 地球光照/大气 | `TravelTrustTourismGlobe.tsx` / `TravelTrustTourismGlobeLayers.tsx` |
| 页面壳底色 | `app/traveltrust/layout.tsx` + `globals.css` |
| 光学孔 CSS 变量 | `useTraveltrustHeroGlobeOpticalAlign.ts` + `TravelTrustCinematicShell.tsx` |
