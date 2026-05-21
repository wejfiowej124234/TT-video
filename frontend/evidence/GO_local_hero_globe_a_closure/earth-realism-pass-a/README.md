# Pass A · `TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05`（① · 未提交）

**阶段：** ① 本地 · **仅地球写实**（Pass B 地理 SSOT 另批）

**批准日：** 2026-05-21

## Before（暖墨过褐批次）

- 维护者对话截图：`assets/c__Users_plant_*_image-1d008ef9-*.png`（Hero 褐化地球）
- 机读基线：`hero-globe-l5-desktop.png`（冻结前）

## After（本 pass）

| 文件 | 说明 |
|------|------|
| `hero-earth-realism-pass-a-desktop.png` | 1536×960 · `/traveltrust` Hero 硬刷新后 |
| `PROBE-RESULTS.md` | Vitest + P0/P1 Playwright 探针输出 |

## 复现截图

```bash
# 须 API+FE 已起（scripts\start-api-with-seed.bat 或 dev）
cd frontend
set PLAYWRIGHT_REUSE_FE_SERVER=1
npx playwright test traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
# 产出：evidence/GO_local_hero_globe_a_closure/p0-acceptance/*.png
```

另存 Hero 全屏：

```bash
CAPTURE_EARTH_REALISM_PASS_A=1 npx playwright test e2e/capture-earth-realism-pass-a.probe.spec.ts --config=playwright.scene-debug.probe.config.ts
```

## 代码 touch（Pass A）

- `traveltrustGlobeEarthTexture.ts` — 减轻 `enhanceTraveltrustGlobeEarthMap`
- `traveltrustGlobeEarthAsset.ts` — `resolveHeroWarmInkGlobeTier` 弱 PBR + `TT_GLOBE_EARTH_SURFACE_RADIUS_MUL`
- `traveltrustCinematicVisual.ts` — 亮度 / hero 云 / 夜灯 token
- `traveltrustCinematicNonGlobeL5.ts` — warm limb/veil 降 opacity
- `TravelTrustTourismGlobe*.tsx` · `TravelTrustPageCinematicScene.tsx` · `TravelTrustPhase1GlobeHighlights.tsx`

**未改（Pass B）：** `traveltrustHeroP3DecorNodes.ts` · hub SSOT 城市标签
