# 117 · S4 Catalog Server Validation Alignment Report

> **Sprint**：S4 · **Rust POST /itineraries 校验与 Catalog import 真源对齐**  
> **审计 SSOT**：[113-S2b-Catalog-Consumer-Audit-Report](./113-S2b-Catalog-Consumer-Audit-Report.md) · [115-S2c-Catalog-Live-Gate-Report](./115-S2c-Catalog-Live-Gate-Report.md) · [116-S3-W5-POI-Media-Catalog-Report](./116-S3-W5-POI-Media-Catalog-Report.md)  
> **日期**：2026-06-07  
> **状态**：**ALIGNMENT GO** — core ↔ catalog PG **parity 绿** · 可选 catalog 校验 **`CATALOG_SERVER_GEO_VALIDATION=0` 默认**

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| core `product_countries` ↔ catalog `countries`（published） | **PARITY GO**（10 国 · ISO/中文序） |
| core `preset_cities` ↔ catalog `cities`（published） | **PARITY GO**（38 城 · 十国分桶序） |
| Contract gate | **GO** — `catalog_server_validation_parity` |
| 可选 catalog 只读校验 adapter | **GO** — `catalog_geo_validation.rs` |
| `GET /meta.product_countries` 改读 PG | **S4b DONE**（118 · opt-in · 746 契约保持） |
| 前端 / 报价 / CI 报价主链 | **未改** |
| Admin CRUD / Growth / OPS | **未做** |

**S4 正式标记**：**Server Validation Alignment GO** — import committed 与 Rust 硬编码 **零漂移**；运行时默认仍 core，**显式** `CATALOG_SERVER_GEO_VALIDATION=1` 方可切 POST 校验读 catalog。

---

## 2. 三源差异梳理（对齐前 vs 对齐后）

### 2.1 国家（product_countries）

| 源 | 位置 | 形态 | S4 状态 |
|----|------|------|---------|
| **core** | `crates/core/src/product_countries.rs` | `PRODUCT_COUNTRY_CODES[10]` + `PRODUCT_COUNTRY_NAMES_ZH[10]` | 运行时默认 SSOT |
| **meta** | `GET /meta` → `product_countries` | 编译期嵌入 core 数组 · **非 PG** | **仍 core**（105 §8.4 step 1 未做） |
| **catalog PG** | `catalog_countries` published | 10 行 · `iso3166` + `name_zh` · `sort_order` | import 真源 · RO API |
| **FE TS** | `frontend/lib/productCountries.ts` | 与 core 锁死 | **未改**（Consumer W2 已 adapter） |

**对拍结果（2026-06-07）**：十国 ISO 序、中文名、行数 **与 core 完全一致**。

### 2.2 预设城市（preset_cities）

| 源 | 位置 | 形态 | S4 状态 |
|----|------|------|---------|
| **core** | `crates/core/src/preset_cities.rs` | 十国 → `&[&str]` 静态表 | 运行时默认 SSOT |
| **catalog PG** | `catalog_cities` published | 38 行 · 按国 `sort_order` | import 真源 · RO API |
| **FE TS** | `frontend/lib/geoOptions.ts` `CITIES_BY_COUNTRY` | 与 core 锁死 | **未改** |

**对拍结果**：每国城市 **数量 + 中文名序** 与 `preset_cities_zh_for_country` **完全一致**。

### 2.3 写路径校验（POST /itineraries*）

| 路径 | 字段 | S4 前 | S4 后（默认） | S4 后（`CATALOG_SERVER_GEO_VALIDATION=1` + `db_pool`） |
|------|------|-------|---------------|--------------------------------------------------------|
| `POST /itineraries` | `destination` / `city` / `cities[]` | core | **core** | **catalog PG 只读** |
| `POST /itineraries/custom` | `country` | core | **core** | **catalog PG 只读** |
| `POST /itineraries/custom` | `day_plans[].city` | **无 preset 校验** | **仍无** | **仍无** |
| `PATCH …/itinerary` | `daily_itinerary[].city` | core · sync | **仍 core** | **仍 core** |
| `POST /guides` | `country_code` ISO | core | **仍 core** | **仍 core** |

---

## 3. 可切 / 必须双读 / 仍阻塞

### 3.1 可切（S4 已就绪 · 须显式 flag / 后续 Sprint）

| 项 | 切换方式 | 默认 |
|----|----------|------|
| `POST /itineraries` geo 校验 | `CATALOG_SERVER_GEO_VALIDATION=1` + `DATABASE_URL` | **关** |
| `POST /itineraries/custom` 国家名校验 | 同上 | **关** |
| `GET /meta.product_countries` 读 catalog | **S4b DONE** — 105 §8.4 step 1 · `CATALOG_SERVER_GEO_VALIDATION=1` opt-in（118） |

### 3.2 必须双读（S4 未退役 · 刻意保留）

| 项 | 原因 |
|----|------|
| **Import Runner**（109） | TS → PG 真源写入 · 永久对拍 |
| **Custom Itinerary 报价**（W4 shadow） | 报价主链仍 TS · 不切 UI |
| **core + catalog contract gate** | 任何 catalog import 漂移须 gate 红 |
| **FE `ENABLED=0`** | 生产默认 TS · 与后端 core 默认一致 |

### 3.3 仍阻塞 / 后续 Sprint

| ID | 阻塞项 | 说明 |
|----|--------|------|
| B-S4-01 | `GET /meta.product_countries` 读 PG | **DONE** — S4b · [118](./118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md) |
| B-S4-02 | `PATCH …/itinerary` catalog 校验 | sync 路径 · 需 pool 注入或 startup snapshot |
| B-S4-03 | `POST /itineraries/custom` **day_plans 城市** preset 校验 | 当前仅要求至少一城非空 |
| B-S4-04 | `POST /guides` ISO 改读 catalog | KYB 边界 · 非本 Sprint |
| B-S4-05 | 删除 `preset_cities.rs` / `product_countries.rs` | 105 §8.4 S6+ · 需 cache/snapshot |
| B-S4-06 | Admin M6 publish 改 drift 语义 | OPS · 非 S4 |

---

## 4. 实现交付

### 4.1 Rust

| 模块 | 职责 |
|------|------|
| `crates/api/src/catalog_geo_validation.rs` | `*_resolved` 校验 · `assert_core_catalog_geo_parity` |
| `crates/api/src/db/catalog.rs` | `catalog_country_name_zh_exists` · `catalog_preset_city_exists` · ordered list helpers |
| `crates/api/src/chain_off/itineraries.rs` | `validate_create_itinerary_geo` async + catalog opt-in |

### 4.2 环境变量

| 变量 | 默认 | 语义 |
|------|------|------|
| `CATALOG_SERVER_GEO_VALIDATION` | **unset / 0** | `1` 时 POST itineraries/custom 国家/预设城市读 **published catalog** |
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | **0** | **未改** — 前端仍 TS 默认 |

### 4.3 门禁

| # | 门禁 | 命令 |
|---|------|------|
| **ALL** | S4 alignment gate | `bash scripts/check-s4-catalog-server-validation-alignment.sh` |
| 1 | core ↔ PG parity | `bash scripts/gates/catalog-server-validation-parity.sh` |
| 2 | catalog RO smoke | `bash scripts/gates/catalog-api-smoke.sh` |

**前提**：`DATABASE_URL` + **catalog import committed**（与 115 相同）。

---

## 5. 验证记录（2026-06-07）

| 项 | 结果 |
|----|------|
| `catalog_server_validation_parity_core_vs_pg` | **PASS** · ~0.11s |
| S4 alignment gate | **PASS** · parity + smoke |

---

## 6. Consumer Matrix（C-21 更新）

| ID | 状态 | 说明 |
|----|------|------|
| **C-21** | **S4b PARTIAL GO** | parity 绿 · POST + **meta** 可选 catalog · PATCH/custom 城市 **仍 core/缺口** |

---

## 7. 明确未做

- Admin CRUD / Growth / Official OPS  
- 前端 UI / `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认改 1  
- Custom Itinerary 报价 / pricing / hotel / transport / submit enrich  
- `GET /meta.product_countries` 运行时改读 catalog → **S4b DONE**（118 · opt-in only）

---

## 8. 相关 Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| S2c | Live consumer gate | **115** |
| S3/W5 | POI media | **116** |
| **S4** | **Server validation alignment + 本报告** | 113 §11 · **117** |
| **S4b** | **GET /meta.product_countries catalog opt-in** | 113 §11 · **118** |
| **S4c** | **Catalog geo server final revalidation** | 113 §11 · **119** |

---

**报告状态**：**S4 ALIGNMENT GO · core ↔ catalog import 零漂移 · 运行时 catalog 校验 opt-in only**
