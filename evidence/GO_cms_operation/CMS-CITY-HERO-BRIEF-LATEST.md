# City Hero · Content Brief（Design SSOT）

| | |
|---|---|
| **Version** | v1 |
| **Status** | DESIGN_SSOT |
| **Matrix** | `data/catalog/city-hero-matrix.v1.yaml` |
| **Cities** | 38 / 10 countries |
| **asset_kind** | `city_hero` (reserved) |

---

## 1 · 模块目标（Why）

> **City Hero 为每个开放城市提供独立运营主视觉，不依赖 POI Hero，可由 CMS 独立发布与版本管理。**

**不是：** POI Hero · 国家级 Destination Hero（`landing_ambient` / da-hero-*）

---

## 2 · Asset Matrix（最重要）

定义 **资产矩阵**，不是图片本身。全量 38 行见 `city-hero-matrix.v1.yaml`。

| 城市 | asset_key | 比例 | fallback | consumer |
|------|-----------|------|----------|----------|
| Abu Dhabi（阿布扎比） | `city_hero_abu_dhabi` | 16:9 | `hero_uae` | Home · Travel |
| Dubai（迪拜） | `city_hero_dubai` | 16:9 | `hero_uae` | Home · Travel |
| Sharjah（沙迦） | `city_hero_sharjah` | 16:9 | `hero_uae` | Home · Travel |
| Gold Coast（黄金海岸） | `city_hero_gold_coast` | 16:9 | `hero_australia` | Home · Travel |
| Melbourne（墨尔本） | `city_hero_melbourne` | 16:9 | `hero_australia` | Home · Travel |
| … | +33 cities | 16:9 | hero_{country} | Home · Travel |

**命名规则：**

- `asset_key` = `city_hero_{city_slug}` · 例 `city_hero_tokyo`
- `fallback_key` = `hero_{country_slug}` · 例 `hero_japan` → 国家级 Hero Assets
- Runtime：无 city hero → 自动 fallback（设计约定 · 实现阶段接线）

**Pilot：** Wave 1 = `CH-JP-TOKYO-001` · Wave 2 = Seoul

---

## 3 · 生命周期

与 [P1 Standard v1.1.0 FROZEN](TT-CMS-P1-CONTENT-FAMILY-STANDARD.md) 完全一致：

```
Draft → Review → Publish → Catalog → Runtime → Consumer → Verify → Evidence → Frozen
```

---

## 4 · Consumer Mapping

| 页面 | 使用 City Hero |
|------|----------------|
| Home | ✅ |
| Travel | ✅ |
| Guide | ❌ |
| Market | ❌ |
| Community | ❌ |
| Provider / Governance / Me | ❌ |

矩阵 **consumer** 列：`Home` · `Travel` · `Home · Travel`（当前 38 城均为 `Home · Travel`）

---

## 5 · L5 Exit

引用 SSOT · **不重复定义**：

[TT-CMS-P1-CONTENT-FAMILY-STANDARD.md §8 · Frozen Exit Gate（六门）](TT-CMS-P1-CONTENT-FAMILY-STANDARD.md)

---

## 实现前禁止

Admin · API · Catalog Schema · Runtime Resolver · Frontend · Upload — **Brief/Matrix 冻结后再开始**

---

```bash
node scripts/dev/run-cms-city-hero-design-ssot.cjs
```
