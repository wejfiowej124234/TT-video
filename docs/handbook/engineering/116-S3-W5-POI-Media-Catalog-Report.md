# 116 · S3/W5 POI Media Catalog Report

> **Sprint**：S3 / W5 · **POI 图像读链路**（C-12）  
> **审计 SSOT**：[113-S2b-Catalog-Consumer-Audit-Report](./113-S2b-Catalog-Consumer-Audit-Report.md) · [114-S2b-Catalog-Consumer-Closure-Report](./114-S2b-Catalog-Consumer-Closure-Report.md) · [115-S2c-Catalog-Live-Gate-Report](./115-S2c-Catalog-Live-Gate-Report.md)  
> **日期**：2026-06-07  
> **状态**：**W5 GO** — POI media RO + adapter 合并 · **`NEXT_PUBLIC_CATALOG_API_ENABLED=0` 默认** · 报价主链仍 TS

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| `GET /api/v1/catalog/poi-images`（bulk） | **GO** |
| `GET /api/v1/catalog/poi-images/:poi_id`（single） | **GO** |
| 匿名 GET · published/payload 有效图 · 503 无 DB | **GO**（与同簇 catalog RO 一致） |
| `catalogPoiMediaAdapter` + `resolveCatalogPoiDetails` 合并 | **GO** |
| CI POI 卡片 `flag=1` Catalog 图 · 空/失败回退 TS | **GO**（Vitest W5 contract） |
| `flag=0` 默认 / E2E 预览证据 | **GO** |
| 报价 / pricing / hotel / transport / submit enrich | **未改（仍 TS + W4 shadow）** |
| Admin CRUD / Growth / OPS | **未做** |

**S3/W5 正式标记**：**C-12 POI 图像读链路 GO**；M6 Admin publish 仍属后续 OPS scope，RO 已支持 `catalog_poi_images_published` 优先于 payload。

---

## 2. API 交付

### 2.1 端点

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/catalog/poi-images` | `?country_iso=&city=&type=` · 仅含有效 `image_url`（published → payload） |
| GET | `/api/v1/catalog/poi-images/:poi_id` | 单 POI · 404 `catalog_poi_image_not_found` |

**解析顺序**（与 105 §509–510 一致）：

1. `catalog_poi_images_published.image_url`（`image_source=published`）
2. `catalog_pois.payload.image_url` / `image`（`image_source=payload`）

### 2.2 实现位置

| 层 | 路径 |
|----|------|
| DB | `crates/api/src/db/catalog.rs` · `list_catalog_poi_images` · `get_catalog_poi_image_by_id` |
| HTTP | `crates/api/src/routes/catalog/handlers.rs` |
| 路由 | `crates/api/src/routes/catalog/mod.rs` |
| 鉴权 | 既有 `/api/v1/catalog/*` GET 公众白名单（`STRICT_SESSION_GATE=1` 下无 Bearer） |

### 2.3 Smoke（2026-06-07 · API `:8080`）

```
OK /api/v1/catalog/poi-images?country_iso=CN&city=北京&type=attraction count=6
OK /api/v1/catalog/poi-images/{poi_id} count=1
```

---

## 3. 前端交付

### 3.1 Adapter / resolve

| 模块 | 职责 |
|------|------|
| `catalogPoiMediaAdapter.ts` | `buildPoiImageByLegacyValueMap` · `mergeCatalogPoiDetailsWithImages` |
| `catalogPoiAdapter.ts` | `mapApiPoisToDetails(..., catalogImagesByLegacy?)` |
| `resolve.ts` | `resolveCatalogPoiDetails` 并行 `fetchPois` + `fetchPoiImages`（images 失败 → 空 map，不整链回退） |
| `client.ts` | `fetchCatalogPoiImages` · `fetchCatalogPoiImageById` |
| `useCatalogPoi.ts` | 无改 · `ENABLED=1` 时经 resolve 自动带 Catalog 图 |

### 3.2 UI 接线

| 组件 | 变更 |
|------|------|
| `TouristDayCardAttractions` / `TouristDayCardFood` | **无改** — 已通过 `useCatalogPoiDetails` 消费合并后 `image` |
| `ItineraryMediaPreviewCard` | **无改** |

### 3.3 Feature flag 行为

| 模式 | POI 图行为 |
|------|------------|
| `ENABLED=0` | TS `getAttractionDetails` / `getFoodDetails` 图 |
| `ENABLED=1` API 成功 | published/payload Catalog 图覆盖 TS |
| `ENABLED=1` images 空/失败 | POI 列表仍来自 API · 图回退 payload/TS |

---

## 4. 门禁

| # | 门禁 | 命令 |
|---|------|------|
| **ALL** | S3/W5 gate | `bash scripts/check-s3-w5-poi-media-catalog-gate.sh` |
| 1 | catalog-api-smoke（含 poi-images） | `bash scripts/gates/catalog-api-smoke.sh` |
| 2 | W5 Vitest | `cd frontend && npm run test:poi-media-catalog` |
| 3 | resolve POI merge | `npx vitest run lib/catalogApi/catalogResolve.test.ts -t resolveCatalogPoiDetails` |
| 4 | Playwright W5 | `npx playwright test e2e/market-custom-itinerary-poi-media-catalog-ui.spec.ts --project=chromium` |

**npm**：`npm run gate:s3-w5-poi-media-catalog`

**Live parity 扩展**：`test:catalog-api-parity` 增 **API-15** / **API-16**（需 API + import）。

---

## 5. 验证记录（2026-06-07）

| 项 | 结果 |
|----|------|
| `cargo test catalog_ro` | **4 passed**（含 `catalog_ro_poi_images_beijing_attractions`） |
| `test:poi-media-catalog` | **7 passed** |
| `test:catalog-api-parity`（live） | **80 passed**（含 API-15/16 · CI-LIVE） |
| S3/W5 gate | **PASS** · ~90s |

---

## 6. Consumer Matrix 更新（C-12）

| ID | 状态 | 说明 |
|----|------|------|
| **C-12** | **W5 GO** | POI 预览图 · `poi-images` RO + adapter · `flag=1` 优先 Catalog |

---

## 7. 明确未做

- Admin M6 POI 图审核/发布 UI  
- Growth / Official OPS  
- Custom Itinerary **报价 / hotel / transport / submit enrich** UI 切 API  
- 默认 `NEXT_PUBLIC_CATALOG_API_ENABLED=1`  
- `ITINERARY_STOCK` 全站替换（非 CI modal 范围外的 stock 路径）

---

## 8. 相关 Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| S2b W3 | POI 展示（无图 API） | 113 §11 |
| S2c | Live gate | **115** |
| **S3/W5** | **POI media RO + adapter + gate** | 113 §11 · **116** |

---

**报告状态**：**S3/W5 POI Media Catalog GO · C-12 读链路完成**
