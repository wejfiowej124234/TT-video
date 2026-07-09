# CMS Runtime Visual Gap Report

Runtime 为唯一验收标准 · L5（视觉质量）与 CMS Ownership（归属）分列判定 · Destination Ambient Runtime/Live 以 CMS-AMBIENT-RUNTIME-WIRING-LATEST.json 为唯一真源

**Phase:** ② Staging · **SSOT:** Runtime DOM · `https://tt-web-staging.fly.dev`
**Generated:** 20260705T110755Z

## P0 Blocker

poi：Runtime/L5 或 CMS Ownership 未闭环

## Asset Family Board（运营视图 · 8 类）

| Family | Priority | L5 | CMS Ownership | Progress | Blocker |
|--------|----------|-----|---------------|----------|---------|
| destination_ambient | P0 | CLOSED | CLOSED | ██████████ 100% | — |
| poi | P0 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| hotel | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| transport | P1 | NOT_SEEN | NOT_SEEN | □□□□□□□□□□ 0% | Consumer 面无 Runtime 图或未审计到 |
| provider_listing | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| acquisition_listing | P1 | OPEN | OPEN | █████□□□□□ 45% | Ownership：替换为 CMS catalog Live |
| banner | P2 | OPEN | OPEN | ██□□□□□□□□ 19% | Ownership：替换为 CMS catalog Live |
| video_poster | P2 | OPEN | OPEN | □□□□□□□□□□ 0% | Ownership：替换为 CMS catalog Live |

## 接线断链（Catalog publish ≠ Runtime）

_本轮未检测到 catalog wiring gap_

## 分列 Gap 样例（L5 ≠ Ownership）

| Page | Family | L5 | CMS | Source |
|------|--------|----|-----|--------|
| / | destination_ambient | ✅ | ✅ | catalog |
| / | banner | ❌ | ❌ | unsplash |
| / | banner | ❌ | ❌ | unsplash |
| / | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ✅ | ❌ | official |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ✅ | ❌ | official |
| /?country=日本 | destination_ambient | ✅ | ✅ | catalog |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ✅ | ❌ | official |
| /?country=韩国 | destination_ambient | ✅ | ✅ | catalog |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ✅ | ❌ | official |
| /?country=新加坡 | destination_ambient | ✅ | ✅ | catalog |

---

*Matrix / Inventory / Registry 不参与判定。*
