# BD-003 · Data Lineage Audit

**Mode:** Read-only · **Recorded:** 2026-07-07

## 三页面血缘

| 页面 | API | 经过 Public Catalog? | 表/视图 | staging 条数 |
|------|-----|----------------------|---------|--------------|
| `/market` | `discover/orders` + `guides` (+ `orders` merge) | **否** | discover + guides | orders 1 · guides 10 |
| `/market/provider` | `market/provider/listings` | **是** | `governed_market_listings_v1` | **10** |
| `/market/acquisition` | `market/acquisition/listings` | **是** | `governed_market_listings_v1` | **10** |

## 四层历史问题 · 对读

| 层 | 结论 |
|----|------|
| ① Public API 过滤缺失 | **历史已确认** · 现 staging `meta.source=postgres_catalog` + governed view |
| ② Automation 重复累积 | **现网确认** · admin queue **110** 行 · 仅 **20** published · **69** smoke/probe |
| ③ CMS Ownership | **低嫌疑** · CMS 不产 Provider 实体 |
| ④ OCS | **低嫌疑** · OCS 产官方素材 · 不制造 merchant 重复 |

## 假设排序 · staging 验证

1. **Automation 累积** ⭐⭐⭐⭐⭐ **CONFIRMED** — public 仅 10+10 · DB 有 69+ automation 行未上 public
2. **部分页面 bypass Catalog** ⭐⭐⭐⭐⭐ **CONFIRMED** — `/market` ≠ listings catalog
3. **API 范围不统一** ⭐⭐⭐⭐ **CONFIRMED** — 三页面三 API
4. **前端 merge 无去重** ⭐⭐⭐ **PARTIAL** — `/market` orders 有 dedupe · subsite 无 merge
5. **CMS/OCS 重复** ⭐⭐ **LOW** — public 无 cross-ID 重复

## BD-003 含义

- **Cover 不完整** 在 public catalog **不成立**（10/10 HEAD PASS）
- **真问题** 更接近：**Database 膨胀 vs Public Catalog 基线分离** + **页面/API 血缘不统一**
- 建议 Owner **REDEFINE** BD-003 → Catalog/Data Lineage 或 **CLOSE** cover 假设 + 新开 Data Drift RC

## 过滤链（provider/acquisition public）

```
market_listings (DB)
  → governed_market_listings_v1 (status + display_status + schedule)
  → SQL data_origin=production + surface filter
  → handler DDG (email/payload/display_origin)
  → Public API (10 published OCS rows)
```
