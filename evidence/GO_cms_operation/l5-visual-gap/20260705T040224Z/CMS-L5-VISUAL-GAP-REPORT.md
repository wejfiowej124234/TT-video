# CMS Runtime Visual Gap Report

Runtime 为唯一验收标准 · L5（视觉质量）与 CMS Ownership（归属）分列判定 · 不以资产条数计进度

**Phase:** ② Staging · **SSOT:** Runtime DOM · `https://tt-web-staging.fly.dev`
**Generated:** 20260705T040224Z

## P0 Blocker

Destination Ambient：Catalog API 有 publish · Runtime 仍 Unsplash（Frontend catalog opt-in 未接）

## Asset Family Board（运营视图 · 8 类）

| Family | Priority | L5 | CMS Ownership | Progress | Blocker |
|--------|----------|-----|---------------|----------|---------|
| destination_ambient | P0 | OPEN | OPEN | □□□□□□□□□□ 0% | Catalog publish 存在 · Frontend 未消费（P0 接线） |
| poi | P0 | NOT_SEEN | NOT_SEEN | □□□□□□□□□□ 0% | Consumer 面无 Runtime 图或未审计到 |
| hotel | P1 | NOT_SEEN | NOT_SEEN | □□□□□□□□□□ 0% | Consumer 面无 Runtime 图或未审计到 |
| transport | P1 | NOT_SEEN | NOT_SEEN | □□□□□□□□□□ 0% | Consumer 面无 Runtime 图或未审计到 |
| provider_listing | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| acquisition_listing | P1 | CLOSED | OPEN | █████□□□□□ 50% | Ownership：替换为 CMS catalog Live |
| banner | P2 | OPEN | OPEN | ██□□□□□□□□ 19% | Ownership：替换为 CMS catalog Live |
| video_poster | P2 | OPEN | OPEN | □□□□□□□□□□ 0% | Ownership：替换为 CMS catalog Live |

## 接线断链（Catalog publish ≠ Runtime）

- **/** · Runtime: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-community-media.jpg
- **/?country=中国** · Runtime: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-community-media.jpg
- **/?country=日本** · Runtime: https://images.unsplash.com/photo-1741935505561-d5a83195f08e?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-community-media.jpg
- **/?country=日本** · Runtime: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-community-media.jpg
- **/?country=韩国** · Runtime: https://images.unsplash.com/photo-1748835600895-8ff48c51c37f?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-community-media.jpg
- **/?country=新加坡** · Runtime: https://images.unsplash.com/photo-1562505415-018c3726c372?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-community-media.jpg
- **/?country=泰国** · Runtime: https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-community-media.jpg
- **/?country=阿联酋** · Runtime: https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-community-media.jpg
- **/?country=美国** · Runtime: https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-community-media.jpg
- **/?country=澳大利亚** · Runtime: https://images.unsplash.com/photo-1748243262890-bffad63a7807?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-community-media.jpg
- **/?country=法国** · Runtime: https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=3840&h=2160&q=92
  · Catalog publish: https://tt-api-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-community-media.jpg

## 分列 Gap 样例（L5 ≠ Ownership）

| Page | Family | L5 | CMS | Source |
|------|--------|----|-----|--------|
| / | destination_ambient | ❌ | ❌ | unsplash |
| / | banner | ❌ | ❌ | unsplash |
| / | banner | ❌ | ❌ | unsplash |
| / | banner | ❌ | ❌ | unsplash |
| /?country=中国 | destination_ambient | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ❌ | ❌ | unsplash |
| /?country=中国 | banner | ✅ | ❌ | official |
| /?country=日本 | destination_ambient | ❌ | ❌ | unsplash |
| /?country=日本 | destination_ambient | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ❌ | ❌ | unsplash |
| /?country=日本 | banner | ✅ | ❌ | official |
| /?country=韩国 | destination_ambient | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ❌ | ❌ | unsplash |
| /?country=韩国 | banner | ✅ | ❌ | official |

---

*Matrix / Inventory / Registry 不参与判定。*
