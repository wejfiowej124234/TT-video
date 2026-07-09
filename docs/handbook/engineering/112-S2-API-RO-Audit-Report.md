# 112 · S2-API-RO Catalog Read-only API Audit Report

> **Sprint**：S2-API-RO — Catalog 只读 HTTP API + API↔TS 双读对拍  
> **规范 SSOT**：[105-S2-Catalog-CMS深度设计评审](./105-S2-Catalog-CMS深度设计评审.md) §3.2 · [109-Catalog-Import-v1.0](./109-Catalog-Import-v1.0.md) · [111-Catalog-Reimport-Rollback-Audit-Report](./111-Catalog-Reimport-Rollback-Audit-Report.md)  
> **前置**：Migration（108 GO）· Import committed（110 GO）· Re-import/Rollback（111 GO）· P-01~P-16 Parity PASS  
> **状态**：**GO** — 六端点只读可用 · 双读对拍 PASS · 前端数据源未切换

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| `GET /api/v1/catalog/*` 六端点 | **PASS** — 200 · `{ status, count, items }` · 仅 `publish_status=published` |
| 无鉴权公众读（`STRICT_SESSION_GATE=1` 下） | **PASS** — auth 白名单 `/api/v1/catalog/` |
| 无 DB 池 | **PASS** — 503 `catalog_db_unavailable` |
| API↔TS 双读对拍（API-01..API-14 子集） | **PASS** — 9 vitest · 本地 2026-06-07 |
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | **默认 0** — UI **未**接 Catalog API |
| Admin CRUD / Growth / Official OPS | **未开发**（符合 Sprint 边界） |

**Catalog CMS Phase 1 读路径**：PostgreSQL `catalog_*` published 集可通过 HTTP 稳定读取，与 TS 真源计数/样本字段一致；前端仍走 `cityDetails` / `geoOptions` 静态模块。

---

## 2. 端点清单（105 §3.2 子集）

| 方法 | 路径 | Query | 本地 count（import committed） |
|------|------|-------|--------------------------------|
| GET | `/api/v1/catalog/countries` | — | 10 |
| GET | `/api/v1/catalog/cities` | `country_iso` | 38（全量） |
| GET | `/api/v1/catalog/pois` | `city_id` · `country_iso` · `city` · `type` | 330 |
| GET | `/api/v1/catalog/pricing` | `country_iso` | 10 |
| GET | `/api/v1/catalog/intercity-routes` | `from_city_id` · `to_city_id` · `from_city` · `to_city` · `country_iso` | 234 |
| GET | `/api/v1/catalog/media` | `asset_kind` · `country_iso` | 13 |

**未实现（P1 / 105 扩展）**：`:iso` / `:id` 单条 · `hotel-tiers` · `poi-images/:poi_id` · internal import 路由。

**实现位置**：`crates/api/src/routes/catalog/` · `crates/api/src/db/catalog.rs`

---

## 3. 响应契约

```json
{
  "status": "ok",
  "count": 10,
  "items": [ /* 行投影 */ ]
}
```

- **Pricing**：金额字段为 **cents**（minor units），与 109 import 一致；对拍时 ÷100 与 TS 元口径比较。
- **Countries**：`payload` JSON 含 `landing_ambient.image_url`（phase2 import 写入）。
- **POI `type`**：`attraction` | `food` | `hotel`；非法值 → 400 `invalid_catalog_poi_type`。

---

## 4. 验证命令

```bash
# 1) Rust 集成烟测（需 DATABASE_URL + 已 import）
DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust \
  cargo test catalog_ro_ -p traveltrust-api

# 2) HTTP smoke（需 API 进程 · 默认 http://127.0.0.1:8080）
DATABASE_URL=... PORT=8080 cargo run --release -p traveltrust-api
bash scripts/gates/catalog-api-smoke.sh

# 3) API ↔ TS 双读对拍
CATALOG_API_BASE_URL=http://127.0.0.1:8080 bash scripts/check-catalog-api-parity.sh
# CI 跳过：CATALOG_API_PARITY_SKIP=1
```

npm：`cd frontend && npm run test:catalog-api-parity`

**注意**：须运行**含本 Sprint auth 白名单**的 API 二进制；旧进程无 `/api/v1/catalog/` 放行时会 401。

---

## 5. 双读对拍矩阵

| ID | 断言 | 结果 |
|----|------|------|
| API-01 | countries count = PRODUCT_COUNTRIES（10） | PASS |
| API-02 | cities count = 38 | PASS |
| API-03 | 每国 `?country_iso=` = CITIES_BY_COUNTRY | PASS |
| API-06/07 | 每城 attraction/food POI 数 = getAttractionDetails / getFoodDetails | PASS |
| API-10 | pricing keys = getPricingCountryKeys | PASS |
| API-11 | CN per_attraction_cents = TS×100 | PASS |
| API-12 | 东京→大阪 modes = getInterCityTransportModes | PASS |
| API-14 | country payload landing_ambient URL = landingAmbientImageUrl | PASS |
| API-media | landing_ambient media count ≥ 10 | PASS |

**客户端**：`frontend/lib/catalogApi/client.ts`（`CATALOG_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL` → `127.0.0.1:8080`）

---

## 6. 前端开关（未切换）

| 变量 | 默认 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | `0` | `isCatalogApiEnabled()` 为 false；**无 UI 接线** |
| `CATALOG_API_BASE_URL` | — | 对拍 / smoke 可选覆盖 API 基址 |

---

## 7. 明确未做

- Admin Catalog CRUD / 审核 UI
- Growth / Referral / Official OPS
- 前端数据源切换（S2b · `NEXT_PUBLIC_CATALOG_API_ENABLED=1`）
- 105 清单中单条 GET（`:id`）与 `hotel-tiers` / `poi-images`
- Pause allowlist 默认不含 catalog（PAUSE_MODE 下 catalog 仍 503，P1 可扩）

---

## 8. 下一步建议

1. **S2b**：`NEXT_PUBLIC_CATALOG_API_ENABLED=1` 灰度 + Custom Itinerary 读路径切换  
2. **04 §3.4**：登记六端点机读路由表（同 PR `run-check-04-routes`）  
3. **P1 端点**：`GET /catalog/countries/:iso` · `hotel-tiers` · hero media  
4. **PAUSE allowlist**：按需加入 `GET /api/v1/catalog/*`

---

**报告状态**：**S2-API-RO COMPLETE · GO**
