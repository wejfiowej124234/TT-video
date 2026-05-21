# Pass A 探针结果 · `TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05`

**日期：** 2026-05-21  
**阶段：** ① 本地  
**状态：** 代码已改 · **未 git 提交**（按 maintainer 要求）

## 截图

| 文件 | 说明 |
|------|------|
| [`before-hero-maintainer-2026-05-21.png`](./before-hero-maintainer-2026-05-21.png) | 维护者对话截图（褐化地球 · before） |
| [`hero-earth-realism-pass-a-desktop.png`](./hero-earth-realism-pass-a-desktop.png) | 1536×960 · Playwright after（本 pass） |
| [`../p0-acceptance/hero-p0-hard-refresh.png`](../p0-acceptance/hero-p0-hard-refresh.png) | P0 探针同轮 hard refresh |

**目视对比要点（after）：** 海陆色阶恢复、球面不再整块褐灰；缘壳压暗减轻；针脚/弧线仍可能相对海岸有偏差（**Pass B** 地理 SSOT）。

## Vitest（仓库根 / frontend）

```text
npm run test -- traveltrustGlobeEarthAsset traveltrustHeroGlobeProjectionMath traveltrustHeroGlobeFrozen traveltrustHomepageFunnelL5 --run
→ 4 files, 17 tests PASS

npm run verify:cinematic-l5
→ 83 tests PASS · C1–C5 PNG presence OK
```

## Playwright 探针（`PLAYWRIGHT_REUSE_FE_SERVER=1` · FE http://127.0.0.1:3012）

| 探针 | 结果 | 备注 |
|------|------|------|
| `capture-earth-realism-pass-a` | **PASS** | 写出 `hero-earth-realism-pass-a-desktop.png` |
| `traveltrust-hero-p0-globe-acceptance` | **PASS** | 零 P0 blocker · WebGL 地球/弧线绘制 |
| `traveltrust-hero-p1-linkage` | **PASS** | 2026-05-21：`clearFocus` + `resolveResetFraction` 避开 cn 针脚区 |

## Pass A 代码摘要

| 项 | before → after |
|----|----------------|
| `enhanceTraveltrustGlobeEarthMap` | saturate 0.34→0.82 · sepia 0.32→0.08 · multiply 0.44→0.18 · 赤道/极地减轻 |
| `resolveHeroWarmInkGlobeTier` | Basic+无夜灯 → **litEarth + nightLights** |
| Hero 云 | opacityScale 0.18 → **0.32**（`heroWarmInkCloudOpacityScale`） |
| Hero 夜灯 | 0 → **0.15**（`heroWarmInkNightLightsStrength`） |
| Warm limb / veil | 0.62/0.16 → **0.32/0.08** |
| 表面半径 | mesh/pin/projection 统一 **`TT_GLOBE_EARTH_SURFACE_RADIUS_MUL = 0.998`** |
| `earthDisplayBrightness` | 1.14 → **1.22** |

## 未做（Pass B · 下一阶段）

- `resolveTraveltrustHubLatLon` SSOT
- P3 核心标签城市级坐标
- `hub-lat-lon` 契约测试

## 复跑命令

```bash
cd frontend
PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test capture-earth-realism-pass-a traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
npm run test -- traveltrustGlobeEarthAsset --run
```
