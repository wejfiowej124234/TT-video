# TT-MEDIA-PLATFORM-ARCHITECTURE · Priority D（架构预定义）

**Version:** 0.1.0 · **生效：** 2026-07-05  
**状态：** **ARCHITECTURE_ONLY** — **不**启动实施 · **不**改 Runtime/API/DB

**一句话：** **Media Platform** 是 TravelTrust **唯一二进制媒体真源**（Image · Video · Poster · Lottie · Audio）；CMS / OCS / OPS **只引用** `media_asset_id`，不长期托管外链或散落文件。

**上级：** [TT-CONTENT-OWNERSHIP-POLICY.md](./TT-CONTENT-OWNERSHIP-POLICY.md) · [TT-CMS-CONTENT-L5.md](./TT-CMS-CONTENT-L5.md)

---

## 0 · 机读键

```text
TT_MEDIA_PLATFORM: ARCHITECTURE_ONLY
TT_MEDIA_PLATFORM_IMPLEMENTATION: NOT_STARTED
TT_MEDIA_PLATFORM_OWNER: PLATFORM_PI3
```

---

## 1 · 四层中的位置（Priority D）

```text
Priority A  OCS          → 官方内容引用
Priority B  CMS          → 运营内容引用
Priority C  Public Ops   → 排期 / Surface / Campaign
Priority D  Media Platform → 二进制 · CDN · 衍生 · 审计
```

---

## 2 · 能力域（预定义 · 未来实现）

| 域 | 职责 |
|----|------|
| **Image** | 原图 ingest · 格式校验 · virus scan |
| **Video** | 转码 · 多码率 · poster 帧 |
| **Poster** | 视频封面 · OG 静态帧 |
| **Lottie** | 动效 JSON · 轻量营销 |
| **Audio** | 配音/氛围音（若产品需要） |
| **CDN** | Owned URL · 地理边缘 · TLS |
| **Compression** | WebP/AVIF 衍生 · 质量阶梯 |
| **Derivative** | Thumbnail · blurhash · responsive widths |
| **Thumbnail** | Masonry / feed 标准尺寸 |
| **Version** | 不可变版本 id · 回滚 |
| **Audit** | 谁上传 · 何时 publish · 与 CMS revision 对齐 |

---

## 3 · 消费契约（目标态）

```text
CMS Admin  upload/init  →  Media Platform  →  media_asset_id + cdn_url
Catalog    存引用       →  image_asset_id / video_asset_id
Web/App    只读 CDN URL →  禁止第三方 hotlink 作为生产 SSOT
```

**过渡期（2026-07）：** Catalog `image_url` + `image_asset_id` 双轨；OCS `media/` 本地 bootstrap — **Expected Difference** 直至 PI3 ingest 统一。

---

## 4 · 与 CMS L5 / OCS 关系

| 来源 | 当前二进制 | 目标态 |
|------|------------|--------|
| OCS 60 JPEG | `data/official-cold-start/media/` → API uploads | ingest → Media Platform · manifest 存 asset_id |
| CMS Destination Ambient | Admin → countries.payload | ingest → asset_id only |
| TravelTrust cinematic | `public/media/traveltrust/` | Video + Poster on Platform |

**禁止：** 在 Media Platform 未就绪时，用 **Production 外链** 代替。

---

## 5 · 实施闸（未来）

- 独立立项 · **PER 后** 或 PI3 Media 轨
- 须 `registry/media-platform.v1.yaml` + ingest API + migration from OCS/Catalog
- **不**在本 Baseline 阶段开发

---

*TT-MEDIA-PLATFORM-ARCHITECTURE v0.1.0 · architecture-only · 2026-07-05*
