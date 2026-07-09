# Hotel · Content Brief（Design SSOT）

| | |
|---|---|
| **Version** | v1 |
| **Status** | DESIGN_SSOT |
| **Phase** | DISCOVERY_COMPLETE |
| **Matrix** | `data/catalog/hotel-matrix.v1.yaml` |
| **Tiers** | 3 · 全球 |
| **asset_kind** | `hotel_tier_stock` (FROZEN) |

---

## 1 · 模块目标（Why）

> **Hotel 为 Market / 行程预算提供全球一致的 3 档 tier 库存图与展示元数据，由 CMS 独立发布；不承载 listing、不定价、不写订单。**

**不是：** City Hero · POI Hero · Listings · per-city 酒店库存

---

## 2 · Asset Matrix（3 Tier · SCOPE_LOCKED）

| Tier | tier_code | multiplier | submit_label_zh | pilot |
|------|-----------|------------|-----------------|-------|
| Economy | `tier_economy` | 1 | 经济型酒店（约3星） | WAVE_2 |
| Comfort | `tier_comfort` | 1.25 | 舒适型酒店（约4星） | WAVE_1 |
| Luxury | `tier_luxury` | 1.5 | 豪华型酒店（约5星） | WAVE_3 |

**Pilot：** Wave 1 = Comfort · Wave 2 = Economy · Wave 3 = Luxury

---

## 3 · 数据来源 · 双读

| 读面 | Endpoint |
|------|----------|
| **Primary** | `GET /api/v1/catalog/hotel-tiers` → `stock_image_url` |
| **Secondary** | `GET /api/v1/catalog/media?asset_kind=hotel_tier_stock` |

**定价边界：** `hotel_base_per_night_cents`（Pricing API）× `multiplier`（CMS tier）

---

## 4 · Consumer

| 页面 | 使用 Hotel Tier |
|------|-----------------|
| Market | ✅ CustomItineraryModal |
| Escrow / Orders | ✅ 只读展示 |
| Home / Travel / Guide | ❌ |

---

## 5 · 生命周期

```
Draft → Review → Publish → Catalog → Runtime → Consumer → Verify → Evidence → Frozen
```

---

## Discovery 完成 · 实现前禁止

WP0 · Admin · API · Runtime · Frontend · Upload — **等待实现决策**

```bash
node scripts/dev/run-cms-hotel-design-ssot.cjs
```
