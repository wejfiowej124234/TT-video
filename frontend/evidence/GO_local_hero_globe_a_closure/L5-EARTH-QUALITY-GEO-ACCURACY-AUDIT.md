# Hero L5 · 地球质量 + 地理标签准确性审计（①）

**审计日**：2026-05-21  
**状态**：**Pass A + Pass B 已实施（① · 未提交）** — [`earth-realism-pass-a/`](./earth-realism-pass-a/) · [`hub-geo-pass-b/`](./hub-geo-pass-b/)  
**目标**：真实可辨识的地球（蓝/绿/棕/白层次）+ 与球面/贴图一致的地理准确城市标签  
**约束**：`TT-GLOBE-L5-FROZEN-2026-05` 冻结 mesh/贴图增强/光照/大气；**须书面解锁 pass** 后方可改冻结路径；P0 遮挡层不得恢复。

---

## 1. 结论摘要

| 维度 | 现状 | L5 达标？ |
|------|------|-----------|
| 贴图真源 | NASA 系 `globe-earth-equirect-2k.jpg`（three.js examples · 2048） | 源可用 |
| 球面观感 | `enhanceTraveltrustGlobeEarthMap` 强降饱和 + 褐乘 + 赤道压青；首屏 `heroWarmInkSky` 关 PBR/夜灯 | **否** — 过暗、偏褐、难辨海陆 |
| 云层/夜光/大气 | 首屏云 `opacityScale≈0.18`；夜灯 tier 关闭；大气 haze/rim 强度≈0 | **否** — 缺层次 |
| 光照/曝光 | `meshBasic` + 低 ambient + `PageHeroGlobeWarmShell` 缘壳/暖雾叠暗 | **否** |
| 标签地理 | P3 用 `node.lat/lon`；Phase1 针脚用 `pinLat/pinLon`（fr/es）；与贴图海岸常有偏差 | **否** |
| 投影链路 | globe-bound 数学与 Phase1 同源 `latLonToUnitVector`；半径 `1.022×R` vs 地球 mesh `0.998×R` | **部分** — 链路可跑，参数未与视觉对齐 |

---

## 2. 地球视觉 · 不符合项（E）

| ID | 严重度 | 不符合描述 | 证据（真源） |
|----|--------|------------|--------------|
| **E-01** | 阻断 | 贴图后处理 `saturate(0.34)` + `sepia(0.32)` + 褐 `multiply 0.44` + 赤道带压青，**抹平** NASA 蓝海/绿植/陆缘白 | `traveltrustGlobeEarthTexture.ts` → `enhanceTraveltrustGlobeEarthMap` |
| **E-02** | 阻断 | 首屏 `heroWarmInkSky`（`heroT < 0.58`）强制 `litEarth: false` → **`meshBasicMaterial`**，无明暗 terminator | `resolveHeroWarmInkGlobeTier` · `TravelTrustTourismGlobe.tsx` |
| **E-03** | 高 | 同 tier **关闭 `nightLights`**，无夜侧城市光层次 | `traveltrustGlobeEarthAsset.ts` L88-90 |
| **E-04** | 高 | 首屏云层 `opacityScale` 仅 **0.18**（正常 desktop 为 1） | `TourismGlobe.tsx` L183 |
| **E-05** | 高 | `PageHeroGlobeWarmShell` 缘壳 `opacity≈0.62` + 贴球暖雾 `0.16`，整体压暗球体（非 mesh 但盖住观感） | `traveltrustCinematicNonGlobeL5.ts` · `PageCinematicScene.tsx` |
| **E-06** | 中 | 环境光过暗：`ambient 0.1` + `hemisphere 0.055`；与暖墨空域匹配但牺牲球面可读性 | `TravelTrustTourismGlobeFillLight` |
| **E-07** | 中 | 地球几何半径 **`0.998×R`**，针脚/投影用 **`1.022×R`**，标签相对贴图海岸有 ~2% 径向偏差 | `TourismGlobe.tsx` vs `Phase1GlobeHighlights` / `ProjectionPublisher` |
| **E-08** | 低 | 仅 2K equirect；L5 大屏下陆缘糊，但仍可先做分级而非阻断 | `GLOBE_EARTH_TEXTURE_LICENSE.md` |
| **E-09** | 低 | `atmosphereHazeOpacity` / `daylightRimIntensity` 为 0（有意去青）；恢复需克制以免空域发青 | `TT_CINEMATIC_GLOBE_VISUAL` |

**与证据 DoD 冲突**：[`README.md` DoD #3](./README.md) 要求「Americas / Eurasia recognizable」— 当前暖墨批次下 **目视不达标**。

---

## 3. 城市标签 · 不符合项（G）

| ID | 严重度 | 不符合描述 | 证据 |
|----|--------|------------|------|
| **G-01** | 阻断 | P3 装饰节点 **未消费** `pinLat/pinLon`；法/西等国 **DOM 标签** 与 **WebGL 针脚** 不同锚点 | `traveltrustHeroP3DecorNodes.ts` vs `traveltrustGlobePinDisplay.ts` + Phase1 |
| **G-02** | 高 | P3 与 Phase1 **双轨坐标 SSOT**（P3 独立 24 节点表，注释「示意」）；重叠 id 虽 lat/lon 相同，**fr/es 针脚已偏移、标签未跟** | `traveltrustPhase1GlobeRegions.ts` L20-21 |
| **G-03** | 中 | 6 核心标签为国家/区域 i18n key（如 `traveltrust_phase1_region_cn`），**非城市名**；与「城市标签」产品预期有 gap | `TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS` |
| **G-04** | 中 | 部分坐标为 **国家重心/示意**（如 `ae` 25.2°N 迪拜枢纽区 OK，但 `eg` 开罗、`za` 约翰内斯堡混在 mena 走廊）— 非严格「城市」语义 | `traveltrustHeroP3DecorNodes.ts` |
| **G-05** | 低 | 标签 DOM `-translate-y-full`，光点 `margin` 居中 — 一致；但长地名 truncate 易与点脱节 | `TravelTrustHeroDestinationLabels.tsx` |

---

## 4. 投影链路 · 不符合项（P）

| ID | 严重度 | 描述 | 证据 |
|----|--------|------|------|
| **P-01** | 中 | `ProjectionPublisher` 用 **spin 组 `matrixWorld`**，含 `heroYawOffset` + 自转 — **逻辑正确** | `TravelTrustTourismGlobeSpin` + `traveltrustHeroGlobeProjectionMath.ts` |
| **P-02** | 中 | 发布半径 **`globeRadius×1.022`**，地球贴图在 **`×0.998`** — 标签/光点浮在海岸外侧或内侧 | 见 E-07 |
| **P-03** | 中 | Canvas 全页固定 + 左栏 `hero-globe-viewport` 映射：公式正确，但 **相机 X 分栏**（`TT_HERO_SPLIT_GLOBE_X`）与 **CSS 光心** 任一漂移即整体偏移 | `traveltrustHeroCinematicAlign.ts` · `projectGlobeSurfaceToHeroViewport` |
| **P-04** | 低 | `projectionActive=false` 时回退 **平面 equirect %**，忽略 yaw/相机 — 仅 dev 断链时出现 | `traveltrustHeroP3GlobeBoundProjection.ts` |

**说明**：globe-bound **运动学**（随自转、背面剔除）已具备；当前「位置不对」主因是 **坐标 SSOT（G-01/02）+ 半径（P-02）+ 贴图褐化难对照海岸（E-01）**，而非投影公式缺项。

---

## 5. 修复方案（建议顺序 · ①）

### Pass A — 申请解锁「地球视觉」批次（冻结路径）

**建议解锁 ID**：`TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05`（更新 `traveltrustHeroGlobeFrozenManifest.ts` `LOCKED_AT` + 证据 README **before/after** 截图）

| 步骤 | 改动 | 文件（冻结） | 预期效果 |
|------|------|--------------|----------|
| A1 | **减轻** `enhanceTraveltrustGlobeEarthMap`：saturate **0.75–0.9**，减褐 multiply（或分「hero / scroll」两档） | `traveltrustGlobeEarthTexture.ts` | 恢复蓝绿棕白可辨 |
| A2 | `resolveHeroWarmInkGlobeTier`：**保留暖空域**但恢复 `litEarth: true`（暖色主/补光）或提高 Basic `color` 乘子 | `traveltrustGlobeEarthAsset.ts` · `TourismGlobe.tsx` |
| A3 | 首屏恢复 **低强度 nightLights**（`0.12–0.18`）+ 云 `opacityScale` **0.28–0.35** | 同上 · `TourismGlobeLayers.tsx` |
| A4 | 下调 `TT_HERO_GLOBE_WARM_LIMB_SHELL_L5` / `FRONT_VEIL` opacity（缘壳 **≤0.35**） | `traveltrustCinematicNonGlobeL5.ts`（非冻结，但叠在球上） |
| A5 | `earthDisplayBrightness` **1.14 → 1.2~1.26**；可选极薄 `atmosphereDaylightRimIntensity` **0.04**（暖色 `#e8c4a8`） | `traveltrustCinematicVisual.ts` |
| A6 | 统一表面半径：**mesh / 针脚 / 投影** 同用 `earthR = globeRadius × 0.998` 或同用 `×1.022` | `TourismGlobe.tsx` · `ProjectionPublisher` · Phase1 |

**验收（目视 + ①）**：硬刷新 `/traveltrust` — 欧亚非/美洲轮廓可辨；海陆对比清晰；无 P0 `dom-video`/全屏 wash 回归；`e2e:hero-globe-closure` P0 仍 PASS。

### Pass B — 地理 SSOT（**非冻结**，可与 A 并行）

| 步骤 | 改动 | 文件 |
|------|------|------|
| B1 | 新增 `resolveHeroP3HubLatLon(node)`，对 `phase1RegionId` **复用** `resolveTraveltrustHubLatLon` | `traveltrustHeroP3DecorNodes.ts` 或共享 `traveltrustGlobePinDisplay.ts` |
| B2 | `ProjectionPublisher` / `useHeroP3GlobeBoundProjection` 统一走 hub 坐标 | `TravelTrustHeroGlobeProjectionPublisher.tsx` |
| B3 | 核心 6 标签改为 **城市级** lat/lon + i18n（上海/纽约/巴黎/东京/新加坡/迪拜等），与贴图海岸人工校准 ±0.5° | `traveltrustHeroP3DecorNodes.ts` + locales |
| B4 | 可选：调试 overlay `data-tt-debug-hub` 对比 Phase1 Html 与 P3 %（仅 E2E probe） | `e2e` / dev flag |

### Pass C — globe-bound 提交闸门（恢复前）

- **不提交** `feat(frontend): hero P3 globe-bound screen projection` 直至 **E-01/E-02 + G-01** 目视通过 + P3 探针在 **新球面** 下 10/10。
- 探针阈值保留「可见半球 poll」，但需加 **`hub-lat-lon` SSOT 契约测试**（fr/es 标签与 Phase1 投影差 < 1.5% viewport）。

---

## 6. 解锁申请模板（复制给 maintainer / 书面解除）

```text
解除 TT-GLOBE-L5-FROZEN-2026-05 局部锁定，批次：TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05
范围：traveltrustGlobeEarthTexture.ts（enhance 曲线）、traveltrustGlobeEarthAsset.ts（heroWarmInk tier）、
      traveltrustCinematicVisual.ts（TT_CINEMATIC_GLOBE_VISUAL 地球/云/夜灯/亮度）、
      TravelTrustTourismGlobe.tsx / TravelTrustTourismGlobeLayers.tsx（材质 tier 与云量）
禁止：改几何细分、弧线拓扑、P0 blocker、全屏背景 video/wash
收口：GO_local_hero_globe_a_closure 新 before/after + P0/P1 回归 PASS
```

---

## 7. 相关文档

- 冻结清单：`frontend/lib/traveltrustHeroGlobeFrozenManifest.ts`
- P3 装饰投影（已实现未提交）：`P3-L5-GLOBE-BOUND-AUDIT.md`
- DoD / L5 历史批次：`README.md` §Definition of done · §L5 sprint
