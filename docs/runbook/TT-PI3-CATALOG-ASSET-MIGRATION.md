# PI3-CATALOG-ASSET-MIGRATION · 运营素材迁移

**Issue ID：** `PI3-CATALOG-ASSET-MIGRATION`  
**Track：** `PI3-CATALOG-ASSET-MIGRATION`（与 `PI3-MEDIA-INFRASTRUCTURE` **完全解耦**）  
**Display status：** `DEFERRED`  
**机读 SSOT：** [`registry/catalog-asset-migration.v1.yaml`](../../registry/catalog-asset-migration.v1.yaml)

```text
Unsplash ≠ Media Infrastructure 缺陷
Catalog Asset Migration ≠ PI3-MEDIA-R2-CDN-FINAL
```

---

## 0 · 验收解耦治理原则（ENFORCED）

> **Media Infrastructure 验收**仅验证媒体服务能力（对象存储、上传、下载、CDN、缓存、Multipart、CORS、播放），**不**验证运营素材来源。  
> **Catalog Asset Migration 验收**仅验证素材来源、版权与运营内容，**不**重新验收媒体基础设施。

```text
两条轨道可独立推进 · 禁止重复验收 · 禁止互相绑架关闭条件

例：Media Infrastructure 100% CLOSED + Catalog Migration 30% → 完全正常
```

**机读：** `registry/open-issues.v1.yaml` → `pi3_tracks.governance` · `registry/catalog-asset-migration.v1.yaml` → `governance`

---

## 1 · 两条 PI3 轨道（必须分开）

```text
PI3
├── MEDIA-INFRASTRUCTURE          ← 上传/下载/对象存储/CDN/缓存/播放
│       MinIO → Tigris → R2 → CDN
│       Issues: PI3-MEDIA-PERSISTENT-STAGING (CLOSED)
│                PI3-MEDIA-R2-CDN-FINAL
│                MEDIA_CDN_PRODUCTION_ACCEPTANCE
│
└── CATALOG-ASSET-MIGRATION       ← 运营素材来源与 URL
        Guide Cover · Provider Cover · Campaign · Hero · Avatar …
        Current: Unsplash / bundled static / client fallback
        Target: owned assets → R2 → cdn.traveltrust.app
```

| 维度 | PI3-MEDIA-INFRASTRUCTURE | PI3-CATALOG-ASSET-MIGRATION |
|------|--------------------------|-----------------------------|
| 负责 | 管道能不能传、存、播 | 展示图从哪来、版权归谁 |
| 当前 Staging | Tigris interim ✅ · R2 待 Owner | Unsplash + OCS manifest ✅ **有意为之** |
| 关闭条件 | R2+CDN+Acceptance PASS（**社区上传**） | 自有素材入库 + manifest/DB 替换 |
| 互相阻塞？ | **否** — Catalog 仍 Unsplash 可关 Infra | 可选依赖 Infra CDN 域名 |

**企业治理规则：**

> 若 R2、CDN、上传、播放、缓存 **全部正常**，但 Catalog 仍用 Unsplash →  
> **`PI3-MEDIA-INFRASTRUCTURE` 应 ✅ CLOSED**，不得因 Unsplash 判 Infra 未完成。

---

## 2 · 运营素材范围（Catalog Assets）

| 资产类 | 字段 / 来源 | 影响页面（约） |
|--------|-------------|----------------|
| Guide 封面/头像 | `avatar_url` · OCS manifest | `/market?view=guides`, `/guides/[id]` |
| Provider 封面 | listing `payload` | `/market/provider` |
| Acquisition 封面 | listing `payload` | `/market/acquisition` |
| Official Guide 封面 | `cover_url` | Community 官方帖 · Admin |
| Campaign Banner | 引用 entity | `/`, `/market` cold-start |
| Hero Banner | `public/media/traveltrust/*` | `/`, `/discover` |
| POI 图 | `poiStockPool.ts` | 行程/城市 |
| Profile Avatar | `PROFILE_AVATAR_S3_*` | `/me/settings/profile` |

**当前来源（非 Bug）：**

- OCS：`data/official-cold-start/dataset.v1.json` → **Unsplash URL 写入 Fly Postgres**
- 前端兜底：`frontend/lib/marketMediaFallback.ts` → 客户端 Unsplash
- Hero：Next 构建包内静态 MP4

---

## 3 · 迁移路径（未来执行）

```text
AI 生成 / 摄影师拍摄 / 官方版权图
        ↓ ingest
R2 前缀 catalog/v1/...
        ↓
cdn.traveltrust.app/catalog/v1/...
        ↓
更新 dataset.v1.json + orchestrator（含 guide.avatar_url）
        ↓
重跑 OCS on staging
        ↓
移除 marketMediaFallback Unsplash 池（API 有真 URL 后）
```

**脚本锚点：**

- `scripts/dev/run-official-cold-start-dataset.cjs`
- `registry/official-cold-start-dataset.v1.yaml`

---

## 4 · 与 Media Infrastructure 的边界

| 属于 Infra（**不在本 Issue**） | 属于 Catalog（**本 Issue**） |
|-------------------------------|------------------------------|
| `COMMUNITY_MEDIA_S3_*` multipart | OCS `cover_url` / `avatar_url` |
| Fly secrets · CORS · Cache Rules | Unsplash → 自有 URL |
| `public_video_publish_ready` | Hero 视频换 CDN URL |
| `MEDIA_CDN_PRODUCTION_ACCEPTANCE` | POI 图库替换 |

Infra Runbook：**[`TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md`](TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md)**  
Infra Acceptance：**[`TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md`](TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md)**

---

## 5 · Issue 状态

| 项 | 值 |
|----|-----|
| Status | **OPEN** |
| Display | **DEFERRED**（Infra 完成后按需启动） |
| Blocking | **false** |
| Blocks Infra close | **false** |

**未来 Catalog 验收范围（启动本 Issue 时）：** 素材 URL 归属 · 版权记录 · OCS manifest 与 DB 一致 · 前端 fallback 移除 — **不含** multipart/CDN/CORS 重验。

**Dashboard 行（与 Infra 并列）：**

| Issue | 状态 |
|-------|------|
| `PI3-MEDIA-INFRASTRUCTURE`（track） | Tigris ✅ · R2/CDN ⏳ |
| `PI3-CATALOG-ASSET-MIGRATION` | ⏸ **DEFERRED** |

---

## 6 · 机读摘要

```yaml
issue: PI3-CATALOG-ASSET-MIGRATION
track: PI3-CATALOG-ASSET-MIGRATION
decoupled_from: PI3-MEDIA-INFRASTRUCTURE
current_source: unsplash_and_placeholders
not_infra_defect: true
blocks_media_infra_close: false
target: owned_assets_on_cdn
```

---

**文档版本：** 2026-07-03 · 登记于 open-issues · 不纳入 MEDIA_CDN_PRODUCTION_ACCEPTANCE 阻塞项
