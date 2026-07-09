# CMS L5 Visual Gap Report

**Phase:** ② Staging · **SSOT:** Runtime DOM on `https://tt-web-staging.fly.dev`
**Generated:** 20260705T035542Z

## Summary

| Metric | Value |
|--------|-------|
| Runtime assets scanned | 99 |
| L5 compliant | 0 |
| **Gaps (non-L5)** | **99** |
| P0 gaps | 24 |
| P1 gaps | 21 |
| P2 gaps | 54 |

## Asset Family Runtime Coverage

- **destination_ambient**: 0/14 L5 (0%) · gaps 14
- **banner**: 0/43 L5 (0%) · gaps 43
- **hotel**: 0/1 L5 (0%) · gaps 1
- **poi**: 0/9 L5 (0%) · gaps 9
- **food**: 0/1 L5 (0%) · gaps 1
- **provider_listing**: 0/10 L5 (0%) · gaps 10
- **acquisition_listing**: 0/10 L5 (0%) · gaps 10
- **video_poster**: 0/1 L5 (0%) · gaps 1
- **unknown**: 0/10 L5 (0%) · gaps 10

## Gaps (non-L5 only)

### / · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /
- **Production impact:** Yes

### / · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /
- **Production impact:** Yes

### / · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /
- **Production impact:** Yes

### / · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /
- **Production impact:** Yes

### /?country=中国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=中国
- **Production impact:** Yes

### /?country=中国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=中国
- **Production impact:** Yes

### /?country=中国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=中国
- **Production impact:** Yes

### /?country=中国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=中国
- **Production impact:** Yes

### /?country=中国 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=中国
- **Production impact:** Yes

### /?country=日本 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=日本
- **Production impact:** Yes

### /?country=日本 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=日本
- **Production impact:** Yes

### /?country=日本 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=日本
- **Production impact:** Yes

### /?country=日本 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=日本
- **Production impact:** Yes

### /?country=日本 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=日本
- **Production impact:** Yes

### /?country=韩国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1748835600895-8ff48c51c37f?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=韩国
- **Production impact:** Yes

### /?country=韩国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=韩国
- **Production impact:** Yes

### /?country=韩国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=韩国
- **Production impact:** Yes

### /?country=韩国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=韩国
- **Production impact:** Yes

### /?country=韩国 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=韩国
- **Production impact:** Yes

### /?country=新加坡 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1562505415-018c3726c372?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=新加坡
- **Production impact:** Yes

### /?country=新加坡 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=新加坡
- **Production impact:** Yes

### /?country=新加坡 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=新加坡
- **Production impact:** Yes

### /?country=新加坡 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=新加坡
- **Production impact:** Yes

### /?country=新加坡 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=新加坡
- **Production impact:** Yes

### /?country=泰国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=泰国
- **Production impact:** Yes

### /?country=泰国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=泰国
- **Production impact:** Yes

### /?country=泰国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=泰国
- **Production impact:** Yes

### /?country=泰国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=泰国
- **Production impact:** Yes

### /?country=泰国 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=泰国
- **Production impact:** Yes

### /?country=阿联酋 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=阿联酋
- **Production impact:** Yes

### /?country=阿联酋 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=阿联酋
- **Production impact:** Yes

### /?country=阿联酋 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=阿联酋
- **Production impact:** Yes

### /?country=阿联酋 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=阿联酋
- **Production impact:** Yes

### /?country=阿联酋 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=阿联酋
- **Production impact:** Yes

### /?country=美国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=美国
- **Production impact:** Yes

### /?country=美国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=美国
- **Production impact:** Yes

### /?country=美国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=美国
- **Production impact:** Yes

### /?country=美国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=美国
- **Production impact:** Yes

### /?country=美国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=美国
- **Production impact:** Yes

### /?country=美国 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=美国
- **Production impact:** Yes

### /?country=澳大利亚 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1748243262890-bffad63a7807?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=澳大利亚
- **Production impact:** Yes

### /?country=澳大利亚 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=澳大利亚
- **Production impact:** Yes

### /?country=澳大利亚 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=澳大利亚
- **Production impact:** Yes

### /?country=澳大利亚 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=澳大利亚
- **Production impact:** Yes

### /?country=澳大利亚 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=澳大利亚
- **Production impact:** Yes

### /?country=澳大利亚 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=澳大利亚
- **Production impact:** Yes

### /?country=法国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=3840&h=2160&q=92
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=法国
- **Production impact:** Yes

### /?country=法国 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=法国
- **Production impact:** Yes

### /?country=法国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=法国
- **Production impact:** Yes

### /?country=法国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=法国
- **Production impact:** Yes

### /?country=法国 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=法国
- **Production impact:** Yes

### /?country=法国 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=法国
- **Production impact:** Yes

### /?country=西班牙 · destination_ambient · P0
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=max&w=3840&q=90
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 国家背景图未走 catalog landing_ambient
- **Suggested:** CMS Destination Ambient · 按当前页面国家 publish landing_ambient · page /?country=西班牙
- **Production impact:** Yes

### /?country=西班牙 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=西班牙
- **Production impact:** Yes

### /?country=西班牙 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=西班牙
- **Production impact:** Yes

### /?country=西班牙 · banner · P2
- **Runtime URL:** https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产 · 画质/尺寸不足 600x400（L5 ≥640x480）
- **Suggested:** CMS Banner / campaign media publish · page /?country=西班牙
- **Production impact:** Yes

### /?country=西班牙 · banner · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Banner / campaign media publish · page /?country=西班牙
- **Production impact:** Yes

### /market · hotel · P1
- **Runtime URL:** https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80
- **current_source:** unsplash
- **Issues:** 仍为 unsplash stock/外部图 · 非 CMS catalog · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Hotel Stock · hotel-tiers stock_image_url publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · food · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · poi_type=food · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market · poi · P0
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-guide-avatar.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS POI Hero · 对应 city × legacy_value · poi-images publish · page /market
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/provider · provider_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-provider-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Provider Listing cover · market listing publish · page /market/provider
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /market/acquisition · acquisition_listing · P1
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-acquisition-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS Acquisition Listing cover · market listing publish · page /market/acquisition
- **Production impact:** Yes

### /traveltrust · video_poster · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/media/traveltrust/roles/traveler.poster.svg
- **current_source:** catalog
- **Issues:** 文件过小 506 bytes（L5 min 16KB）
- **Suggested:** CMS Video Poster · media-assets publish · page /traveltrust
- **Production impact:** No

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-dubai-luxury-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-barcelona-arch-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-sydney-coast-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-nyc-skyline-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-paris-art-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-singapore-family-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-bangkok-temple-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-seoul-food-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-kyoto-culture-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

### /community · unknown · P2
- **Runtime URL:** https://tt-web-staging.fly.dev/api/v1/uploads/community-posts/ocs-tokyo-photo-community-cover.jpg
- **current_source:** official
- **Issues:** 仍为 Official/OCS 冷启动资产 · 未替换为 CMS catalog Live · Catalog 未生效 · Runtime 未消费 published CMS 资产
- **Suggested:** CMS asset mapping TBD · assign family then publish · page /community
- **Production impact:** Yes

---

*Matrix / Inventory / Registry 不参与本报告判定。*
