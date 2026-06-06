# Pass A 地球提亮 — Before / After（① 本地 · 未提交）

**批次**：`TT-GLOBE-PASS-A-BRIGHTEN-2026-05`（用户书面解锁 Pass A 小幅调价）  
**原则**：**不用** DOM overlay / Canvas `filter` 叠光；海陆变亮来自 **贴图后处理 + 材质亮度**。

## Before（DOM/CSS 叠光阶段 · 已撤）

| 手段 | 问题 |
|------|------|
| `TravelTrustHeroL5ExperienceLayers` 海洋/陆地 `mix-blend-screen` | 球前像盖一层光，中间易 **发白糊团** |
| Canvas `brightness(1.16) contrast…` | 整段 WebGL 被滤镜抬亮，不区分海陆 |
| 缘壳 opacity 0.32 + 暖雾 0.08（再乘 mul） | 贴球 **FrontSide 暖雾** 加重朦胧 |

## After（Pass A 真提亮）

| 参数 | Before | After |
|------|--------|-------|
| `earthDisplayBrightness` | 1.22 | **1.30** |
| 贴图 `sepia` | 0.08 | **0.04** |
| 贴图 `saturate` | 0.82 | **0.90** |
| 贴图 `brightness`（canvas 段） | 1.06 | **1.02**（与 mesh 1.30 分工，避免双重过曝） |
| `TT_HERO_GLOBE_WARM_LIMB_SHELL_L5.opacity` | 0.32 | **0.14** |
| `TT_HERO_GLOBE_WARM_FRONT_VEIL_L5.opacity` | 0.08 | **0.03** |
| DOM 叠光层 | 有 | **无**（`TravelTrustHeroL5ExperienceLayers` → `null`） |
| Canvas CSS filter | 有 | **无** |

## 代码真源

- `frontend/lib/traveltrustCinematicVisual.ts` — `earthDisplayBrightness`
- `frontend/lib/traveltrustGlobeEarthTexture.ts` — `enhanceTraveltrustGlobeEarthMap` → `buildTraveltrustGlobeEarthMapEnhanceFilter()`
- `frontend/lib/traveltrustHeroGlobeBrighten.ts` — Pass A 常量对拍
- `frontend/lib/traveltrustCinematicNonGlobeL5.ts` — 缘壳/暖雾 token

## 本地验收（①）

```bash
cd frontend && npm run test -- traveltrustHeroGlobeBrighten
npm run clean && npm run dev:webpack
```

打开 `/traveltrust` 硬刷新：

- `data-tt-traveltrust-hero-globe-pass-a-brighten="TT-GLOBE-PASS-A-BRIGHTEN-2026-05"`（`heroT < 0.58`）
- **无** `data-tt-traveltrust-hero-l5-ocean-sheen`
- 陆地褐、海洋蓝绿 **从贴图本身** 更可辨；球心 **不应** 再出现大块 DOM 白雾

## 后续：材质半档（暗部可读）

见 **[PASS-A-MATERIAL-TUNE-BEFORE-AFTER.md](./PASS-A-MATERIAL-TUNE-BEFORE-AFTER.md)**（暖色 shadow fill、海洋 soft-light、云层 0.38；**仍无** DOM/CSS）。

## 阶段

**① 本地目视** — 非 ②③ 生产 GO。
