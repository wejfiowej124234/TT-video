# CMS L5 Visual Gap Report

**Phase:** ② Staging · **SSOT:** Runtime DOM on `https://tt-web-staging.fly.dev`
**Generated:** 20260705T035257Z

## Summary

| Metric | Value |
|--------|-------|
| Runtime assets scanned | 37 |
| L5 compliant | 0 |
| **Gaps (non-L5)** | **37** |
| P0 gaps | 11 |
| P1 gaps | 21 |
| P2 gaps | 5 |

## Asset Family Runtime Coverage

- **destination_ambient**: 0/1 L5 (0%) · gaps 1
- **unknown**: 0/4 L5 (0%) · gaps 4
- **hotel**: 0/1 L5 (0%) · gaps 1
- **poi**: 0/9 L5 (0%) · gaps 9
- **food**: 0/1 L5 (0%) · gaps 1
- **provider_listing**: 0/10 L5 (0%) · gaps 10
- **acquisition_listing**: 0/10 L5 (0%) · gaps 10
- **video_poster**: 0/1 L5 (0%) · gaps 1

## Gaps (non-L5 only)

### / · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /
- **Production impact:** Yes

### / · unknown · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /
- **Production impact:** Yes

### / · unknown · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /
- **Production impact:** Yes

### / · unknown · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /
- **Production impact:** Yes

### / · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /
- **Production impact:** Yes

### /market · hotel · P1
- **Runtime URL:** https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Hotel Stock · hotel-tiers stock_image_url publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · food · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · poi_type=food · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-guide-avatar.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-provider-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-acquisition-cover.jpg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /traveltrust · video_poster · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/media/traveltrust/roles/traveler.poster.svg
- **current_source:** old_external
- **Issues:** 仍为 Unsplash/Pexels 或外部 stock · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 文件过小 506 bytes（L5 min 16KB）
- **Suggested:** CMS Video Poster · media-assets publish · page /traveltrust
- **Production impact:** Yes

---

*Matrix / Inventory / Registry 不参与本报告判定。*
