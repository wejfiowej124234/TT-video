# TT-MEDIA-THREE-TIER-ARCHITECTURE · 企业级三层媒体架构

**SSOT：** [`registry/media-three-tier-architecture.v1.yaml`](../../registry/media-three-tier-architecture.v1.yaml)  
**对象存储契约：** [`COMMUNITY-MEDIA-OBJECT-STORAGE.md`](COMMUNITY-MEDIA-OBJECT-STORAGE.md)

```text
Market Default Filter · OCS · DDG · SOPCP — 不重开
API 只负责 metadata（video_url / image_url / cover_url）
浏览器直拉 CDN 字节 — API 不承载视频流量
```

---

## 1 · 为什么不用 localtunnel？

| localtunnel | 企业 Staging / Production |
|-------------|----------------------------|
| Developer PC → 临时穿透 → Internet | Fly API → R2/S3 → CDN |
| 地址会变 · 503 · Timeout · Connection Closed | 持久公网前缀 · 全球边缘 |
| **不是代码 bug** | **基础设施 SSOT** |

**结论：** localtunnel + 本机 MinIO **仅允许 Phase ①**；**禁止** 作为 Phase ② Staging 或 Phase ③ Production 真源。

---

## 2 · 三层架构

```
                Phase ① Local
        ┌────────────────────────┐
        │ MinIO :19000           │
        │ 127.0.0.1 完全离线     │
        └───────────┬────────────┘
                    │
            Local Dev · E2E · 上传开发
                    │
────────────────────┼────────────────────
                    │
                    ▼
              Phase ② Staging API (Fly)
                    │
                    ▼
           Cloudflare R2（推荐）
                    │
                    ▼
         CDN https://cdn.traveltrust.app
                    │
────────────────────┼────────────────────
                    │
                    ▼
            Phase ③ Production API
                    │
                    ▼
              同一套 R2 + CDN
```

### Phase ① · 本地（MinIO）

| 项 | 值 |
|----|-----|
| 启动 | `powershell -File scripts/dev/ensure-community-media-minio.ps1` |
| 公网前缀 | `http://127.0.0.1:19000/traveltrust-community-media` |
| 特点 | 离线 · 无公网 · 不影响他人 |

### Phase ② · 测试网（R2 + CDN）

**目标拓扑：**

```
Fly API (tt-api-staging)
      │
      ▼
Cloudflare R2
      │
      ▼
https://cdn.traveltrust.app/...
```

**备选（等价）：** AWS S3 → CloudFront — 同样满足「API → 对象存储 → CDN」，但 R2 **无出口流量费**，与 Fly 全球部署更搭。

| 变量 | Staging 示例 |
|------|----------------|
| `COMMUNITY_MEDIA_S3_BUCKET` | `traveltrust-community-media`（或 staging 专用桶） |
| `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` | `https://cdn.traveltrust.app`（**无尾斜杠**） |
| `COMMUNITY_MEDIA_S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `COMMUNITY_MEDIA_S3_REGION` | `auto` |
| `COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE` | `0` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | R2 API Token |
| `TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES` | `https://cdn.traveltrust.app` |

**前端（tt-web-staging build）：**

- `NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://cdn.traveltrust.app`
- `NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=https://cdn.traveltrust.app`

### Phase ③ · Production

与 Phase ② **同拓扑**；桶可共用（按 prefix 隔离）或独立 prod 桶。Secrets 与 CORS 须收紧至生产域。

---

## 3 · API 契约（无需改代码）

已有 env 驱动：

- `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` → **`playback_url` / 目录 payload 中的 media URL 前缀**
- multipart：`CreateMultipartUpload` → R2 endpoint
- `GET /api/v1/community/media/capabilities` → `public_video_publish_ready`（HeadBucket）

**metadata 示例：**

```json
{
  "video_url": "https://cdn.traveltrust.app/community-media/v1/….mp4",
  "image_url": "https://cdn.traveltrust.app/community-media/v1/….jpg",
  "cover_url": "https://cdn.traveltrust.app/community-media/v1/….jpg"
}
```

浏览器 **直接** GET CDN；API 只返回 URL 字符串。

---

## 4 · Staging 从 localtunnel 迁移

### 4.1 前置（Cloudflare）

1. 创建 R2 bucket（如 `traveltrust-community-media`）
2. 创建 R2 API Token（Object Read & Write）
3. 绑定自定义域 **`cdn.traveltrust.app`** → R2 桶（Cloudflare CDN）
4. 桶 CORS：允许 `https://tt-web-staging.fly.dev`（及未来品牌域）`PUT` + `ExposeHeader: ETag`

### 4.2 配置 Fly staging

```bash
cp scripts/dev/staging-media-r2-cdn.env.example scripts/dev/.env.staging-media-r2.local
# 编辑填入 R2 account id · token · bucket

bash scripts/dev/configure-staging-media-r2-cdn.sh
```

### 4.3 验证

```bash
curl -s "https://tt-api-staging.fly.dev/api/v1/community/media/capabilities" | jq '.public_video_publish_ready'
curl -sI "https://cdn.traveltrust.app/" | head -3
# 目录/社区 payload 中不得再出现 *.loca.lt
```

### 4.4 废弃脚本

| 脚本 | 状态 |
|------|------|
| `scripts/dev/restore-c4-staging-media-tunnel.sh` | **DEPRECATED** — 仅 incident 临时解阻 |
| `scripts/dev/configure-staging-media-r2-cdn.sh` | **推荐** Staging 真源 |

---

## 5 · 与 PI3 / Phase ② 关系

**PI3 双轨（Infra ≠ Catalog）：**

| 轨道 | SSOT | 范围 |
|------|------|------|
| **PI3-MEDIA-INFRASTRUCTURE** | `registry/pi3-media-infrastructure.v1.yaml` | MinIO · Tigris · R2 · CDN · 上传 · 播放 · 缓存 |
| **PI3-CATALOG-ASSET-MIGRATION** | `registry/catalog-asset-migration.v1.yaml` | Guide/Provider 封面 · Campaign · Hero · Avatar · POI |

```text
Catalog 仍用 Unsplash → 不表示 Media Infrastructure 未完成
```

| 轨道 | 说明 |
|------|------|
| **PI3-002** | 品牌域 / TLS / CDN / CORS — 与 `cdn.traveltrust.app` 同源 |
| **C4 槽** | ② PASS 须 **R2/CDN playback GET 200**（社区上传），非 tunnel |
| **Closed（Infra）** | `PI3-MEDIA-PERSISTENT-STAGING` — staging off loca.lt（Fly Tigris interim） |
| **Waiting Owner（Infra）** | `PI3-MEDIA-R2-CDN-FINAL` — Cloudflare R2 + `cdn.traveltrust.app` |
| **Acceptance（Infra）** | `MEDIA_CDN_PRODUCTION_ACCEPTANCE` — 配置完成 ≠ 关闭 |
| **Deferred（Catalog）** | `PI3-CATALOG-ASSET-MIGRATION` — Unsplash→自有素材，**不挡 Infra** |

**Owner Infra 清单：** [`TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md`](TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md)

**Catalog 素材迁移：** [`TT-PI3-CATALOG-ASSET-MIGRATION.md`](TT-PI3-CATALOG-ASSET-MIGRATION.md)

**验收解耦原则（ENFORCED）：** Media Infrastructure 验收 ≠ Catalog 素材验收；两条轨道独立推进，禁止重复验收、禁止互相绑架关闭条件。

**Production Acceptance Gate：** [`TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md`](TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md)

---

## 6 · 机读结论

```yaml
TT_MEDIA_THREE_TIER_ARCHITECTURE: ENFORCED
phase1: MinIO@127.0.0.1:19000
phase2_target: Fly→R2→cdn.traveltrust.app
phase3_target: same_as_phase2
localtunnel_staging: DEPRECATED
```
