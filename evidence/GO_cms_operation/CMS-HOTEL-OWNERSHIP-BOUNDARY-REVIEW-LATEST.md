# Hotel · Ownership Boundary Review

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Phase** | DISCOVERY_COMPLETE |
| **Verdict** | **PASS** |
| **Next** | 等待实现决策 · 不进入 WP0/Admin/API/Runtime |

## CMS vs Booking vs API

| 域 | 拥有 | 禁止越界 |
|----|------|----------|
| **CMS** | tier 元数据 · `hotel_tier_stock` 图 · Admin publish · dual-read | 定价 · 订单 · listing cover |
| **Booking / Pricing API** | `hotel_base_per_night_cents` · 订单 tier 选择 | 绕过 CMS 上 Production stock 图 |
| **Catalog API** | RO `hotel-tiers` · `catalog/media` | 不存二进制 · 不改 business orders |
| **Listings** | provider/acquisition cover | 非 hotel tier 模块 |

## 边界核对

| # | ID | 域 | 结论 |
|---|-----|-----|------|
| 1 | cms_stock_imagery | CMS | **PASS** |
| 2 | cms_tier_metadata | CMS | **PASS** |
| 3 | booking_api_pricing | Booking / Pricing API | **PASS** |
| 4 | booking_api_orders | Booking / Order API | **PASS** |
| 5 | not_listings | Listings（独立 P1 模块） | **PASS** |
| 6 | not_city_scoped | Scope | **PASS** |
| 7 | dual_read_boundary | CMS Runtime Contract | **PASS** |
| 8 | consumer_market | Consumer | **PASS** |

## 禁止重叠

- **CMS 不得设置 hotel_base_per_night_cents** → owner: Pricing Catalog / Booking API
- **Booking API 不得 bypass CMS 将外部 URL 作为 Production tier stock** → owner: CMS + Ownership Policy
- **Hotel 模块不得承载 merchant listing cover** → owner: Listings 模块
- **Admin hotel-tiers 不得创建第 4+ tier 而无 Schema WP** → owner: Discovery → Implementation WP0
- **Frontend 不得长期 TS fallback 作为 Production PASS** → owner: Consumer Ready 门

## Future Extensibility（3 → 5 档）

**问题：** 若从 3 档扩展到 5 档（Economy · Comfort · Premium · Luxury · Ultra Luxury），是否需要修改 Schema？

**答案：** **YES — 需要 deliberate Schema / API / Frontend WP，不能仅 Matrix 增行**

### 需要修改的层

| 层 | 当前 | 扩档动作 |
|----|------|----------|
| PostgreSQL | `CHECK (tier_code IN ('tier_economy','tier_comfort','tier_luxury'))` | 新 migration 扩展 CHECK 或改为 lookup 表 + FK |
| Admin API | `hardcoded ['tier_economy','tier_comfort','tier_luxury']` | 扩展 allowlist 或改为 DB-driven tier registry |
| Frontend TS fallback | `HOTEL_TIERS · HOTEL_TIER_MULTIPLIER · HOTEL_TIER_SUBMIT_LABELS` | 增档或完全切 Catalog API（推荐后者作为 Frozen 目标） |
| i18n | `market_hotel_tier_* label keys` | 为新 tier 增 locale keys |
| Brief / Matrix | `hotel-brief.v1.yaml · hotel-matrix.v1.yaml` | Brief v2 + Matrix 增行 · 新 pilot waves · 非 ad-hoc |

### 无需重设计的部分

- catalog_hotel_tier_definitions 表结构（行模型已支持 N tier）
- hotel_tier_stock asset_kind 语义
- dual-read 模式（Primary hotel-tiers + Secondary media）
- ops_hierarchy [asset_family, tier, asset]
- CMS vs Booking 定价边界（base × multiplier 仍成立）

### 建议

> MVP 冻结 3 档足够稳定 · 扩档视为版本化事件（Brief v2 + WP0 migration + Admin allowlist + Verify）· 不在 Discovery 阶段改 Schema · 若产品确认 5 档，在 Implementation 决策后首个 WP 处理 CHECK/allowlist

## 未修改

- p1_standard
- ownership_matrix_frozen
- city_hero_artifacts
- admin
- api
- runtime_code
- frontend
- catalog_publish
- assets

```bash
node scripts/dev/run-cms-hotel-ownership-boundary-review.cjs
```
