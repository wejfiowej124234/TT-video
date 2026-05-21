# Pass B · 地理 SSOT `TT-HUB-GEO-SSOT-2026-05`（① · 未提交）

**范围：** 仅坐标统一 · **未**改地球颜色/材质/云/夜灯。

**真源：** [`frontend/lib/traveltrustHubGeo.ts`](../../../lib/traveltrustHubGeo.ts)

## Before / After

| 文件 | 说明 |
|------|------|
| [`before-hero-hub-geo-pass-a-baseline.png`](./before-hero-hub-geo-pass-a-baseline.png) | Pass A 后、Pass B 前（fr/es 针脚偏移 · P3 双轨坐标） |
| [`after-hero-hub-geo-pass-b-desktop.png`](./after-hero-hub-geo-pass-b-desktop.png) | Pass B 后 · 1536×960 Hero |

## 变更摘要

- 新建 `traveltrustHubGeo.ts`：24 枢纽城市级 lat/lon
- `resolveTraveltrustHubLatLon` ← hub geo（删除 `pinLat/pinLon`）
- P3 节点删除内嵌 lat/lon → `resolveHeroP3HubLatLon`
- `TravelTrustHeroGlobeProjectionPublisher` / 弧线 / 针脚同源
- 表面半径仍为 `TT_GLOBE_EARTH_SURFACE_RADIUS_MUL = 0.998`

## 机读

见 [`PROBE-RESULTS.md`](./PROBE-RESULTS.md)

```bash
cd frontend
npm run test -- traveltrustHubGeoAlignment --run
PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test capture-hub-geo-pass-b traveltrust-hero-p0-globe-acceptance traveltrust-hero-p1-linkage --config=playwright.scene-debug.probe.config.ts
```
