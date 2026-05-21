# Pass B 探针结果 · `TT-HUB-GEO-SSOT-2026-05`

**日期：** 2026-05-21  
**阶段：** ① 本地  
**状态：** 代码已改 · **未 git 提交**

## Vitest

```bash
npm run test -- traveltrustHubGeoAlignment traveltrustHubGeo traveltrustGlobePinDisplay traveltrustHeroP3DecorNodes traveltrustHeroP3ScreenProjection --run
→ traveltrustHubGeoAlignment: 6/6 PASS
  - P3↔Phase1 坐标一致
  - 核心 6 标签 equirect 投影差 ≤ 1.5% viewport（实际 0）
  - surface radius 0.998
```

## Playwright

| 探针 | 结果 |
|------|------|
| `capture-hub-geo-pass-b` | **PASS** → `after-hero-hub-geo-pass-b-desktop.png` |
| `traveltrust-hero-p0-globe-acceptance` | **PASS** |
| `traveltrust-hero-p1-linkage` | **PASS**（desktop + mobile） |

## 核心 hub 城市坐标（SSOT）

| id | 城市 | lat | lon |
|----|------|-----|-----|
| cn | Shanghai | 31.2304 | 121.4737 |
| us | New York | 40.7128 | -74.006 |
| fr | Paris | 48.8566 | 2.3522 |
| es | Madrid | 40.4168 | -3.7038 |
| jp | Tokyo | 35.6762 | 139.6503 |
| sg | Singapore | 1.3521 | 103.8198 |
| ae | Dubai | 25.2048 | 55.2708 |

完整 24 枢纽见 `traveltrustHubGeo.ts`。

## 目视要点（after）

- fr/es **针脚与 DOM 标签** 同用 Paris / Madrid，不再 `pinLat/pinLon` 偏移
- 核心 6 标签与 WebGL 光点共用 `resolveHeroP3HubLatLon` / `resolveTraveltrustHubLatLon`
