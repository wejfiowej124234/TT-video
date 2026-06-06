# Pass A 方案 A 安全提亮 — Before / After（① 本地 · 未提交）

**批次**：`TT-GLOBE-PASS-A-PLAN-A-BRIGHTEN-2026-05`  
**约束**：**不解冻** Pass A 全局 `EARTH_MAP_FILTER`（brightness / sepia / saturate / contrast / hue）、`earthDisplayBrightness` **1.30**；**无** DOM/CSS 叠光、**无** 赤道中线 `oceanHighlightPeakAlpha`。

**真源**：`frontend/lib/traveltrustHeroGlobeBrighten.ts`

## Before → After

| 参数 | Before | After | 意图 |
|------|--------|-------|------|
| `SHADOW_FILL.hemiIntensity` | 1.10 | **1.18** | 暗部/夜侧轮廓更可读 |
| `SHADOW_FILL.ambIntensity` | 0.44 | **0.48** | 整体微抬，仍暖墨 |
| `HERO_WARM_INK.cloudOpacityScale` | 0.38 | **0.32** | 云更薄 → 球面更通透 |
| `EARTH_MAP_GRADE.oceanSunGlintPeakAlpha` | 0.08 | **0.095** | 仅太阳向海光略强 |
| `SUN_DAYLIGHT_RIM.intensity` | 0.055 | **0.065** | 昼侧缘方向光，非屏心 |
| `EARTH_MAP_GRADE.landWarmMultiplyAlpha` | 0.15 | **0.12** | 陆地略释压暗 |

## 未改（冻结 / 保持）

| 参数 | 值 |
|------|-----|
| `EARTH_MAP_FILTER.brightness` | 1.02 |
| `EARTH_MAP_FILTER.sepia` | 0.04 |
| `EARTH_MAP_FILTER.saturate` | 0.9 |
| `earthDisplayBrightness` | 1.30 |
| `oceanHighlightPeakAlpha` | 0（无球心/赤道白斑） |
| `TT_HERO_L5_DIRECTOR_NORTH_AFRICA_GRADE.multiplyAlpha` | 0.125（北非不随全局提亮） |

## 撤回

在 `traveltrustHeroGlobeBrighten.ts` 将上表 **After** 列还原为 **Before**，或删除 `TRAVELTRUST_HERO_GLOBE_PASS_A_PLAN_A_BRIGHTEN_ID` 批次常量后按 git diff 回滚该文件。

## 本地验收

```bash
cd frontend && npm run test -- traveltrustHeroGlobeBrighten traveltrustHeroL5DirectorFinalPass
npm run clean && npm run dev:webpack
```

打开 `/traveltrust` 硬刷新：

- 欧亚昼侧海蓝略通透、暗部地形线可读
- **无** 球心灰白 hotspot
- 北非/撒哈拉相对亚太主视觉 **不** 单独爆亮
- 弱网络弧线仍弱显（Director Final 弧线 tuning 不变）

## 阶段

**① 本地目视** — 非 ②③ 生产 GO。
