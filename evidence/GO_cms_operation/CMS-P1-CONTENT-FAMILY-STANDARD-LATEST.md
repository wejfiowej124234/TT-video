# CMS P1 Content Family Standard

| | |
|---|---|
| **Version** | 1.0.0 |
| **Status** | FROZEN |
| **Review** | PASS · v1.1.0 |
| **Effective** | 2026-07-07 |
| **Runbook** | `docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md` |

> P1 四模块共用模板 · **先 Standard · 再复制模块**

## P1 路线图

```
P1 Standard → City Hero → Hotel → Transport → Listings
```

## 七段统一规范

| # | 段 | SSOT |
|---|-----|------|
| 1 | asset_kind 命名 | snake_case · API 暴露后冻结 |
| 2 | Catalog Schema | Brief + Matrix + revisions + media index |
| 3 | Runtime Contract | API + resolver + consumer route |
| 4 | Admin | Content Center · publish 写 revision |
| 5 | Publish | Review→Replace→Publish→Verify→Evidence→Live |
| 6 | Verify | 族专用 script + execution_gates |
| 7 | L5 Exit | 8 条全满足才可 Registry Frozen |

## P1 模块状态

| 模块 | asset_kind | Registry | Catalog | 下一步 |
|------|------------|----------|---------|--------|
| City Hero | `city_hero` | Pilot | catalog_empty | Brief + Asset Matrix only |
| Hotel Stock | `hotel_tier_stock` | Backlog | — | Brief + 全 tier 规模化 |
| Transport Stock | `transport_stock` | Backlog | — | Brief + 十国规模化 |
| Listings | `provider_listing, acquisition_listing` | Backlog | — | Brief + listing cover 结构 |

## P0 参考（已 Frozen · ≠ P1 未完成项）

- **poi_content_qa** · `poi_hero`
- **destination_ambient_hero** · `landing_ambient`
- **destination_ambient** · `landing_ambient`

## 刷新

`node scripts/dev/run-cms-p1-content-family-standard.cjs`
