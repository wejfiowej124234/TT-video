# France Country Runtime Audit

**Verdict:** `FR_COUNTRY_RUNTIME_PASS`
**TT_CMS_FR_COUNTRY_RUNTIME:** `PASS`

| # | 检查项 | 结果 |
|---|--------|------|
| 1 | 日本五城 LOCK 资产未改动 (41/41) | ✅ PASS |
| 2 | 韩国四城 LOCK 资产未改动 (31/31) | ✅ PASS |
| 3 | 泰国三城 LOCK 资产未改动 (28/28) | ✅ PASS |
| 4 | 新加坡 SG LOCK 资产未改动 (10/10) | ✅ PASS |
| 5 | 三城 FR LOCK 资产 (24/24) | ✅ PASS |
| 6 | FR POI Catalog Scope Lock · 24 POI / 3 cities 不变 | ✅ PASS |
| 7 | 三城 Execution CLOSED | ✅ PASS |
| 8 | 三城 Content QA CLOSED · LOCK 不变 | ✅ PASS |
| 9 | 三城 Golden Template Exit Check · city_consumer_runtime | ✅ PASS |
| 10 | 首页 Destination Ambient · 法国读 CMS · 无 Unsplash | ✅ PASS |
| 11 | Catalog API FR POI 24/24 与 LOCK 一致 | ✅ PASS |
| 12 | 三城 Market POI Runtime · Exit Check Gate 4 聚合 | ✅ PASS |
| 13 | Live Consumer · 首页法国 Ambient + Market 壳 + 法国相关内容无 fallback | ✅ PASS |

**FR POI Runtime:** 24/24 PASS

**三城汇总**

- 巴黎: Exit 8/8 · Catalog 8/8 · Live 8/8
- 里昂: Exit 8/8 · Catalog 8/8 · Live 8/8
- 尼斯: Exit 8/8 · Catalog 8/8 · Live 8/8
