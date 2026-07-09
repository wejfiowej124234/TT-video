# CMS Runtime Visual Gap Report

Runtime 为唯一验收标准 · L5（视觉质量）与 CMS Ownership（归属）分列判定 · 不以资产条数计进度

**Phase:** ② Staging · **SSOT:** Runtime DOM · `https://tt-web-staging.fly.dev`
**Generated:** 20260705T082907Z

## P0 Blocker

Destination Ambient：Catalog API 有 publish · Runtime 仍 Unsplash（Frontend catalog opt-in 未接）

## Asset Family Board（运营视图 · 8 类）

| Family | Priority | L5 | CMS Ownership | Progress | Blocker |
|--------|----------|-----|---------------|----------|---------|
| destination_ambient | P0 | OPEN | OPEN | □□□□□□□□□□ 0% | Catalog publish 存在 · Frontend 未消费（P0 接线） |
| poi | P0 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| hotel | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| transport | P1 | NOT_SEEN | NOT_SEEN | □□□□□□□□□□ 0% | Consumer 面无 Runtime 图或未审计到 |
| provider_listing | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| acquisition_listing | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| banner | P2 | OPEN | OPEN | ███□□□□□□□ 26% | Ownership：替换为 CMS catalog Live |
| video_poster | P2 | OPEN | OPEN | □□□□□□□□□□ 0% | Ownership：替换为 CMS catalog Live |

## 接线断链（Catalog publish ≠ Runtime）

- **/?country=中国** · Runtime: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-community-media.jpg

## 分列 Gap 样例（L5 ≠ Ownership）

| Page | Family | L5 | CMS | Source |
|------|--------|----|-----|--------|
| / | banner | ✅ | ❌ | unsplash |
| / | banner | ✅ | ❌ | unsplash |
| / | banner | ✅ | ❌ | unsplash |
| / | banner | ✅ | ❌ | unsplash |
| /?country=中国 | destination_ambient | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ✅ | ❌ | official |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ✅ | ❌ | official |
| /?country=韩国 | banner | ✅ | ❌ | official |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ✅ | ❌ | official |
| /?country=新加坡 | banner | ✅ | ❌ | official |
| /?country=新加坡 | banner | ❌ | ❌ | unsplash |

---

*Matrix / Inventory / Registry 不参与判定。*
