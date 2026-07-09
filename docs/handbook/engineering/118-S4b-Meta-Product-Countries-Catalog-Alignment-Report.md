# 118 · S4b Meta Product Countries Catalog Alignment Report

> **Sprint**：S4b / **B-S4-01** · **`GET /meta.product_countries` Catalog PG 只读对齐**  
> **审计 SSOT**：[117-S4-Catalog-Server-Validation-Alignment-Report](./117-S4-Catalog-Server-Validation-Alignment-Report.md) · [113-S2b-Catalog-Consumer-Audit-Report](./113-S2b-Catalog-Consumer-Audit-Report.md)  
> **日期**：2026-06-07  
> **状态**：**B-S4-01 GO** — meta 746 契约保持 · catalog opt-in · core 默认 · DB 失败回退

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| `GET /meta.product_countries` 默认（flag 关） | **GO** — 仍编译期 `traveltrust_core` 十国数组 |
| `CATALOG_SERVER_GEO_VALIDATION=1` + `db_pool` | **GO** — 读 published `catalog_countries`（`sort_order`） |
| PG 读失败 / 行数不符 | **GO** — 回退 core 数组 |
| 746 契约（七键顺序 · `strict_db_write: false`） | **GO** — 未增键 · 仅 `dual_write_order` 含 `read_source=` |
| Contract / parity / smoke | **GO** — Rust + gate + 可选 live `/meta` |
| 前端 / 报价 / submit enrich | **未改** |
| `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 | **仍为 0** |
| Admin CRUD / Growth / OPS | **未做** |

**S4b 正式标记**：**B-S4-01 CLOSED** — meta 国家列表与 S4 POST 校验共用 **`CATALOG_SERVER_GEO_VALIDATION`** opt-in；运行时默认仍 core。

---

## 2. 行为矩阵

| 条件 | `iso3166_alpha2` / `name_zh` 来源 | `dual_write_order` 前缀 |
|------|-----------------------------------|-------------------------|
| `CATALOG_SERVER_GEO_VALIDATION` unset / 0 | **core** 编译期常量 | `read_source=core;` |
| flag=1 · 无 `db_pool` | **core**（回退） | `read_source=core;` |
| flag=1 · PG 读失败 | **core**（回退） | `read_source=core;` |
| flag=1 · PG 行数 ≠ 10 | **core**（回退） | `read_source=core;` |
| flag=1 · PG 10 国 published | **catalog_countries** | `read_source=catalog-pg;` |

与 [117 §2.1](./117-S4-Catalog-Server-Validation-Alignment-Report.md#21-国家product_countries) 对拍：**catalog 成功路径数组与 core 完全一致**（S4 parity 已证）。

---

## 3. 实现交付

### 3.1 Rust

| 模块 | 职责 |
|------|------|
| `crates/api/src/catalog_geo_validation.rs` | `resolve_meta_product_countries` · `meta_product_countries_core_snapshot` · `meta_product_countries_dual_write_order` |
| `crates/api/src/routes/health_meta/handlers.rs` | `meta()` 注入 pool · 组装 `product_countries` 段 |
| `crates/api/src/db/catalog.rs` | 复用 `list_catalog_product_countries_ordered` |

### 3.2 环境变量

| 变量 | 默认 | S4b 语义 |
|------|------|----------|
| `CATALOG_SERVER_GEO_VALIDATION` | **unset / 0** | `1` 时 **GET /meta.product_countries** 与 POST geo 校验均 opt-in catalog |
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | **0** | **未改** |

### 3.3 测试

| 用例 | 位置 |
|------|------|
| core 默认（flag=0） | `meta_product_countries_default_uses_core_without_flag` |
| catalog 成功（flag=1 + PG + import） | `meta_product_countries_catalog_opt_in_when_enabled_and_pg` |
| 无 pool 回退 | `meta_product_countries_fallback_no_pool_when_flag_on` |
| PG Err 回退 | `meta_product_countries_from_catalog_rows_err_falls_back_core` |
| 行数不符回退 | `meta_product_countries_from_catalog_rows_wrong_len_falls_back_core` |
| GET /meta 集成（core 数组 + `read_source=core`） | `health_meta/tests.rs` · `meta_product_countries_default_core_arrays_and_read_source_hint` |

### 3.4 门禁

| # | 门禁 | 命令 |
|---|------|------|
| **ALL** | S4b alignment gate | `bash scripts/check-s4b-meta-product-countries-catalog-alignment.sh` |
| 1 | meta contract | `bash scripts/gates/meta-product-countries-catalog-parity.sh` |
| 2 | core ↔ PG parity（S4 复用） | `bash scripts/gates/catalog-server-validation-parity.sh` |
| 3 | live `/meta` smoke（API 未起则 skip） | `bash scripts/gates/meta-product-countries-catalog-smoke.sh` |

**前提**：`DATABASE_URL` + **catalog import committed**（与 115/117 相同）。

---

## 4. Consumer Matrix（C-21 更新）

| ID | 状态 | 说明 |
|----|------|------|
| **C-21** | **S4b PARTIAL GO** | meta product_countries opt-in catalog · PATCH/custom 城市 / guides ISO **仍 core/缺口** |

| 阻塞 ID | S4b 后状态 |
|---------|------------|
| **B-S4-01** | **DONE**（本 Sprint） |
| B-S4-02 | 仍 OPEN — PATCH itinerary catalog 校验 |
| B-S4-03 | 仍 OPEN — custom day_plans 城市 preset |
| B-S4-04 | 仍 OPEN — guides ISO catalog |
| B-S4-05 | 仍 OPEN — 删除 core 静态表 |
| B-S4-06 | 仍 OPEN — Admin M6 publish drift |

---

## 5. 明确未做

- Admin CRUD / Growth / Official OPS  
- 前端 UI / `NEXT_PUBLIC_CATALOG_API_ENABLED=1` 默认  
- Custom Itinerary 报价 / pricing / hotel / transport / **POST submit enrich**  
- 746 契约增键（无 `data_source` 顶层字段；可观测性仅在 `dual_write_order`）

---

## 6. 相关 Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| S4 | POST opt-in catalog 校验 + parity | **117** |
| **S4b** | **GET /meta.product_countries catalog opt-in** | 113 §11 · **118** |
| **S4c** | **Final revalidation · FINAL GO** | 113 §11 · **119** |

---

**报告状态**：**S4b B-S4-01 GO · meta 746 契约保持 · catalog PG 只读 opt-in · core 默认不变**
