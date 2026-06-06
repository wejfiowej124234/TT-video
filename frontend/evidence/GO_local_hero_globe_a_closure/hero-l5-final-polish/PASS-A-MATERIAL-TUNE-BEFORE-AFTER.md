# Pass A 材质微调（暗部半档）— Before / After（① 本地 · 未提交）

**批次**：`TT-GLOBE-PASS-A-MATERIAL-TUNE-2026-05`  
**约束**：**不**恢复 DOM overlay / Canvas CSS `filter`；`earthDisplayBrightness` **保持 1.30**（未抬到全屏加白）。

## Before（Pass A 首版提亮后）

| 现象 | 原因 |
|------|------|
| 左半球陆地轮廓难辨 | 半球/环境光仍近 `#0c0a09`，暗部=纯黑 |
| 海洋偏闷 | 赤道 `multiply 0.22` 压暗蓝海 |
| 云层偏沉 | `heroWarmInkCloudOpacityScale` 0.32 |
| 中间偶发糊白 | 缘壳/暖雾已降到 0.14/0.03（上一批） |

## After（材质半档）

| 手段 | 调整 | 目的 |
|------|------|------|
| `earthDisplayBrightness` | **1.30**（不变） | 不整体加白 |
| `PageCinematicHeroWarmFill` | 天空 `#161310` · 地面 `#2a221a` · hemi **1.10** · amb **0.44** | **暗部暖抬**、左半球陆地轮廓 |
| 贴图陆地 multiply | 0.18 → **0.15** | 暖褐陆地略可读 |
| 赤道压暗 | 0.22 → **0.12** | 海洋保持深蓝 |
| 海洋 soft-light 带 | peak **0.09** | 海面高光、非灰白雾 |
| `heroWarmInkCloudOpacityScale` | 0.32 → **0.38** | 云层略提亮 |
| `heroWarmInkNightLightsStrength` | 0.15 → **0.17** | 夜侧点缀、不抢昼侧 |

## 真源

- `frontend/lib/traveltrustHeroGlobeBrighten.ts`
- `frontend/lib/traveltrustGlobeEarthTexture.ts` — `TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE`
- `frontend/lib/traveltrustCinematicVisual.ts`
- `frontend/components/traveltrust/cinematic/TravelTrustPageCinematicScene.tsx` — `PageCinematicHeroWarmFill`

## 验收（①）

```bash
cd frontend && npm run test -- traveltrustHeroGlobeBrighten
npm run clean && npm run dev:webpack
```

- `data-tt-traveltrust-hero-globe-pass-a-material-tune="TT-GLOBE-PASS-A-MATERIAL-TUNE-2026-05"`
- 左半球应能 **隐约辨陆地轮廓**；整体仍 **电影暗调**
- **无** DOM `ocean-sheen` / Canvas `filter`
