# PI3-MEDIA-R2-CDN-FINAL · Owner 运维执行清单

**Issue ID：** `PI3-MEDIA-R2-CDN-FINAL`  
**Display status：** `WAITING_OWNER_CF`  
**Owner：** `owner_live`（非开发任务 — 任何人按本清单可完成最终切流）  
**前置已关闭：** `PI3-MEDIA-PERSISTENT-STAGING` — Staging 已脱离 `*.loca.lt`，当前 interim 为 **Fly Tigris**（**不是** R2 已落地）

**相关 SSOT：**

| 文档 | 路径 |
|------|------|
| 三层媒体架构 | [`registry/media-three-tier-architecture.v1.yaml`](../../registry/media-three-tier-architecture.v1.yaml) |
| 架构 Runbook | [`TT-MEDIA-THREE-TIER-ARCHITECTURE.md`](TT-MEDIA-THREE-TIER-ARCHITECTURE.md) |
| 社区媒体契约 | [`COMMUNITY-MEDIA-OBJECT-STORAGE.md`](COMMUNITY-MEDIA-OBJECT-STORAGE.md) |
| 问题总账 | [`registry/open-issues.v1.yaml`](../../registry/open-issues.v1.yaml) |

**自动化脚本（切流后执行）：**

| 脚本 | 用途 |
|------|------|
| `scripts/dev/provision-staging-media-r2-cdn.sh` | R2 桶 + CORS + Fly secrets（需 CF token） |
| `scripts/dev/configure-staging-media-r2-cdn.sh` | 仅同步 Fly secrets（R2 已手工建好时） |
| `scripts/dev/audit-staging-media-urls.cjs` | API payload 媒体 URL 审计 |
| `scripts/dev/close-pi3-media-r2-cdn-staging.sh` | 切流验收证据包（改用于 FINAL closeout） |

**环境模板：**

```bash
cp scripts/dev/staging-media-r2-cdn.env.example scripts/dev/.env.staging-media-r2.local
# 填入 Owner 凭据 — 勿提交 git
```

---

## Dashboard 目标状态（切流完成前保持不变）

| Issue | 状态 | 说明 |
|-------|------|------|
| `PI3-MEDIA-PERSISTENT-STAGING` | ✅ **CLOSED** | 已脱离 localtunnel · Fly Tigris interim · **非 R2** |
| `PI3-MEDIA-R2-CDN-FINAL` | ⏳ **WAITING_OWNER_CF** | 本清单 — Cloudflare + 域名 + CDN 切流 |
| `MEDIA_CDN_PRODUCTION_ACCEPTANCE` | ⏳ **PENDING** | 配置完成后正式验收 Gate · **配置≠关闭** |
| `CI-BUILD-20260703-V49-OOM` | 🟡 **OPEN (Low)** | Build 基础设施 · 不挡媒体切流 |

**禁止误导：** 在 `MEDIA_CDN_PRODUCTION_ACCEPTANCE` **PASS** 之前，不得关闭 `PI3-MEDIA-R2-CDN-FINAL`。

---

## 0 · 执行概览（建议顺序）

```text
[Prerequisites 齐备]
        │
        ▼
[1] Cloudflare R2 桶 + Public + CORS + Lifecycle + 测试对象
        │
        ▼
[2] CDN：cdn.traveltrust.app 绑定 · SSL · Cache Rules
        │
        ▼
[3] （可选但推荐）Tigris → R2 对象同步
        │
        ▼
[4] Fly tt-api-staging Secrets 切到 R2 + CDN
        │
        ▼
[5] Fly tt-web-staging 重建（NEXT_PUBLIC_* → cdn.traveltrust.app）
        │
        ▼
[6] 数据验证（API + HTTP 200 + 无 loca.lt / 无 tigris.dev）
        │
        ▼
[7] 浏览器验收（Community / Guide / Provider / Acquisition / Official）
        │
        ▼
[8] 移交 MEDIA_CDN_PRODUCTION_ACCEPTANCE Gate（§9 — 不在此直接关闭 Issue）
```

预计 Owner 耗时：**2–4 小时**（含 DNS 传播等待；不含历史对象大批量同步）。

**关闭 Issue 的完整路径：**

```text
本清单 §1–§5（Owner 配置）
        → TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md（正式验收 PASS）
        → 方可关闭 PI3-MEDIA-R2-CDN-FINAL
```

---

## 1 · 前置条件（Prerequisites）

在开始任一步骤前，确认下表 **全部** 可勾选。缺一项则停止 — 开发侧无法代劳。

### 1.1 凭据与账号

| # | 项 | 说明 | 如何获取 | 填写的本地文件 |
|---|-----|------|----------|----------------|
| P1 | **Cloudflare Account ID** | 32 位 hex | Dashboard → 右侧 Account ID | `.env.staging-media-r2.local` → 注释中的 endpoint；或 `CF_ACCOUNT_ID` |
| P2 | **Cloudflare API Token** | **最小权限**（见 §1.2） | My Profile → API Tokens → Create Token | 环境变量 `CLOUDFLARE_API_TOKEN`（**不要**写入 git） |
| P3 | **R2 S3 Access Key ID** | R2 专用，非 Global API Key | R2 → Manage R2 API Tokens → Create | `.env` → `AWS_ACCESS_KEY_ID` |
| P4 | **R2 S3 Secret Access Key** | 与 P3 成对 | 同上（仅显示一次 — 立即保存） | `.env` → `AWS_SECRET_ACCESS_KEY` |
| P5 | **Fly.io 登录** | 能 `fly auth whoami` | `fly auth login` | — |
| P6 | **Fly App 写 secrets 权限** | `tt-api-staging` · `tt-web-staging` | Fly org 成员 | — |

### 1.2 Cloudflare API Token — 最小权限建议

创建 **Custom token**，按最小原则勾选：

| 权限 | 资源 | 用途 |
|------|------|------|
| **Account → R2 → Edit** | 本 Account | 创建桶、CORS、Lifecycle（wrangler / API） |
| **Zone → DNS → Edit** | `traveltrust.app` | `cdn` CNAME / R2 custom domain |
| **Zone → SSL and Certificates → Edit** | `traveltrust.app` | 自定义域 SSL（通常自动） |

**不要** 使用 Global API Key。  
**不要** 给 Token Account Settings 或 Workers 全量 Edit（除非你们另有 Workers 需求）。

验证 Token：

```bash
export CLOUDFLARE_API_TOKEN="<token>"
npx --yes wrangler whoami
# 期望：Logged in · Account name 可见
```

### 1.3 域名与 DNS

| # | 项 | 要求 |
|---|-----|------|
| P7 | **`traveltrust.app` 域名控制权** | Cloudflare 为 **Active** 状态（橙云或 DNS only 均可，推荐 Full setup） |
| P8 | **`cdn.traveltrust.app` 子域** | 可在 `traveltrust.app` Zone 下创建 DNS 记录 |
| P9 | **公网 DNS 解析** | 执行前确认：`dig +short cdn.traveltrust.app` 或 `nslookup cdn.traveltrust.app` — 切流前可能为空，切流后必须解析到 Cloudflare |

### 1.4 固定命名（与代码/脚本一致 — 勿随意改名）

| 项 | 值 |
|----|-----|
| **Fly API App** | `tt-api-staging` |
| **Fly Web App** | `tt-web-staging` |
| **Staging API URL** | `https://tt-api-staging.fly.dev` |
| **Staging Web URL** | `https://tt-web-staging.fly.dev` |
| **R2 Bucket 名称** | `traveltrust-community-media` |
| **对象 Key 前缀** | `community-media/v1`（默认，见 `COMMUNITY_MEDIA_S3_KEY_PREFIX`） |
| **CDN 公网前缀** | `https://cdn.traveltrust.app`（**无尾斜杠**） |
| **R2 S3 Endpoint** | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| **R2 Region** | `auto` |

### 1.5 当前 Interim 状态（回滚用 — 勿删）

`PI3-MEDIA-PERSISTENT-STAGING` 关闭时的 **Fly Tigris** 配置（§7 回滚恢复值）：

| Secret / Env | Interim 值 |
|--------------|------------|
| `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` | `https://traveltrust-community-media.fly.storage.tigris.dev` |
| `COMMUNITY_MEDIA_S3_ENDPOINT` | `https://fly.storage.tigris.dev` |
| `COMMUNITY_MEDIA_S3_BUCKET` | `traveltrust-community-media` |
| `COMMUNITY_MEDIA_S3_REGION` | `auto` |
| `COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE` | `0` |

**建议：** 切流前把上表复制到 `scripts/dev/.env.staging-media-tigris-rollback.local`（勿提交 git）。

### 1.6 本地工具

```bash
# 必需
fly version          # Fly CLI
node --version       # >= 18
curl --version

# 推荐（provision 脚本使用）
npx --yes wrangler --version

# 可选（对象同步）
aws --version        # AWS CLI v2，配置 R2 endpoint 后 s3 sync
```

---

## 2 · Cloudflare R2

### 2.1 创建 Bucket

**Dashboard 路径：** Cloudflare Dashboard → R2 → Create bucket

| 字段 | 值 |
|------|-----|
| Bucket name | `traveltrust-community-media` |
| Location | Automatic（或选离主要用户最近的 jurisdiction） |

**CLI（等价）：**

```bash
export CLOUDFLARE_API_TOKEN="<token>"
export CF_ACCOUNT_ID="<account_id>"
npx --yes wrangler r2 bucket create traveltrust-community-media
```

**验收：**

```bash
npx --yes wrangler r2 bucket list | grep traveltrust-community-media
# 期望：桶名出现在列表
```

### 2.2 创建 R2 API Token（S3 兼容）

**Dashboard：** R2 → Overview → **Manage R2 API Tokens** → Create API token

| 字段 | 建议 |
|------|------|
| Token name | `traveltrust-staging-community-media` |
| Permissions | **Object Read & Write**（staging）；生产可再拆 read-only CDN origin |
| Specify bucket | `traveltrust-community-media`（限定单桶） |

保存输出的 **Access Key ID** → `AWS_ACCESS_KEY_ID`  
保存输出的 **Secret Access Key** → `AWS_SECRET_ACCESS_KEY`

**验收（HeadBucket）：**

```bash
export AWS_ACCESS_KEY_ID="<key>"
export AWS_SECRET_ACCESS_KEY="<secret>"
export AWS_DEFAULT_REGION=auto

aws s3api head-bucket \
  --bucket traveltrust-community-media \
  --endpoint-url "https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
# 期望：exit 0，无 error
```

### 2.3 Public Access 配置

TravelTrust 浏览器 **直拉 CDN 域名** 获取媒体字节；R2 桶通过 **Custom Domain** 暴露，而非长期依赖 `*.r2.dev` 临时域。

**目标：** 所有新上传对象的公网 URL 形如：

```text
https://cdn.traveltrust.app/community-media/v1/<uuid>.<ext>
```

**Dashboard 步骤：**

1. R2 → `traveltrust-community-media` → **Settings**
2. **Custom Domains** → Connect Domain
3. 输入：`cdn.traveltrust.app`
4. 按向导确认 DNS（通常自动插入 CNAME）
5. 等待 **Active** / SSL **Active**

**验收：**

```bash
dig +short cdn.traveltrust.app
# 期望：Cloudflare 相关记录（非 NXDOMAIN）

curl -sI "https://cdn.traveltrust.app/" | head -5
# 期望：HTTP 200 或 404（桶空时）— 关键是 TLS 握手成功、Server 含 cloudflare
```

> **注意：** Custom Domain 绑定完成前，**不要** 把 Fly `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` 改成 `cdn.traveltrust.app`，否则 API 会生成无法 GET 的 URL。

### 2.4 CORS 配置

浏览器 multipart **直传 R2** 需要桶 CORS。Staging 须允许以下来源 **PUT / GET / HEAD**：

| AllowedOrigins | 用途 |
|----------------|------|
| `https://tt-web-staging.fly.dev` | Staging 前端 |
| `http://127.0.0.1:3012` | 本地前端 dev |
| `http://localhost:3012` | 本地前端 dev |

**CORS JSON（与 `provision-staging-media-r2-cdn.sh` 一致）：**

```json
[
  {
    "AllowedOrigins": [
      "https://tt-web-staging.fly.dev",
      "http://127.0.0.1:3012",
      "http://localhost:3012"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

保存为 `/tmp/r2-cors.json`，执行：

```bash
npx --yes wrangler r2 bucket cors set traveltrust-community-media \
  --file /tmp/r2-cors.json --force
```

**验收（OPTIONS 预检 — 替换为实际对象 URL 若已有测试文件）：**

```bash
curl -sI -X OPTIONS "https://cdn.traveltrust.app/community-media/v1/" \
  -H "Origin: https://tt-web-staging.fly.dev" \
  -H "Access-Control-Request-Method: PUT"
# 期望响应头含 Access-Control-Allow-Origin
```

### 2.5 Lifecycle（生命周期）

**目的：** 清理 abandoned multipart 分片，防止存储泄漏。

**Dashboard：** R2 → Bucket → **Settings** → **Lifecycle rules** → Add rule

| 字段 | 值 |
|------|-----|
| Rule name | `abort-incomplete-multipart-community-media` |
| Prefix | `community-media/v1` |
| Action | **Abort incomplete multipart uploads** |
| Days after initiation | `7` |

**验收：** Dashboard 显示规则 **Enabled**。

> Production 切流时复制同规则；可按 compliance 调整天数。

### 2.6 上传测试对象

在切 Fly secrets **之前**，验证 CDN 能 serving 对象：

```bash
echo "pi3-media-r2-cdn-final smoke $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /tmp/tt-cdn-smoke.txt

aws s3 cp /tmp/tt-cdn-smoke.txt \
  "s3://traveltrust-community-media/community-media/v1/_ops/smoke-$(date +%s).txt" \
  --endpoint-url "https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --content-type "text/plain" \
  --cache-control "public, max-age=300"

# 记下上传后的 key，构造 CDN URL：
SMOKE_URL="https://cdn.traveltrust.app/community-media/v1/_ops/smoke-<timestamp>.txt"
curl -sf "$SMOKE_URL"
# 期望：打印 smoke 文本 · HTTP 200
```

**可选 — 测试图片：**

```bash
curl -sfL "https://picsum.photos/200/200" -o /tmp/smoke.jpg
aws s3 cp /tmp/smoke.jpg \
  "s3://traveltrust-community-media/community-media/v1/_ops/smoke.jpg" \
  --endpoint-url "https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --content-type "image/jpeg" \
  --cache-control "public, max-age=31536000, immutable"

curl -sI "https://cdn.traveltrust.app/community-media/v1/_ops/smoke.jpg" | head -3
# 期望：HTTP/2 200 · content-type: image/jpeg
```

---

## 3 · CDN（cdn.traveltrust.app）

### 3.1 绑定自定义域

见 §2.3。本节补充 DNS 手工核对。

**Cloudflare DNS 期望记录（通常由 R2 Custom Domain 向导自动创建）：**

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `cdn` | `<R2 提供的 target>` | Proxied（橙云） |

**验收清单：**

- [ ] `cdn.traveltrust.app` DNS 在全球解析（可用 [https://dnschecker.org](https://dnschecker.org)）
- [ ] HTTPS 证书有效（浏览器无证书警告）
- [ ] §2.6 smoke 对象 GET 200

### 3.2 SSL/TLS 模式

**Dashboard：** `traveltrust.app` Zone → SSL/TLS → Overview

| 设置 | 推荐值 | 原因 |
|------|--------|------|
| **SSL/TLS encryption mode** | **Full (strict)** | R2 custom domain 端点支持有效证书 |
| **Always Use HTTPS** | On | 强制 HTTPS |
| **Minimum TLS Version** | TLS 1.2 | 企业基线 |

**验收：**

```bash
curl -sI "https://cdn.traveltrust.app/community-media/v1/_ops/smoke.jpg" | grep -i "strict-transport-security\|cf-cache-status"
```

### 3.3 Cache Rules

**Dashboard：** `traveltrust.app` → **Rules** → **Cache Rules** → Create rule

**Rule 1 — 不可变社区媒体对象（推荐）：**

| 字段 | 值 |
|------|-----|
| Rule name | `TT community media immutable` |
| When | URI Path starts with `/community-media/v1/` |
| Cache eligibility | Eligible for cache |
| Edge TTL | Ignore origin — **1 year** |
| Browser TTL | Respect origin（或 1 year） |

**Rule 2 — `_ops/` 运维探针（短 TTL）：**

| 字段 | 值 |
|------|-----|
| When | URI Path starts with `/community-media/v1/_ops/` |
| Edge TTL | **5 minutes** |

**验收：**

```bash
curl -sI "https://cdn.traveltrust.app/community-media/v1/_ops/smoke.jpg" | grep -i cf-cache-status
# 第二次请求期望：HIT 或 DYNAMIC（视规则而定）
```

### 3.4 Cache-Control 建议

上传时（API complete 或 aws cli）对 **内容寻址 / UUID key** 对象设置：

```http
Cache-Control: public, max-age=31536000, immutable
```

对可能更新的运维文件：

```http
Cache-Control: public, max-age=300
```

**说明：** TravelTrust API 在 multipart complete 后写入 `playback_url`；对象 key 含 UUID，适合长期缓存。

---

## 4 · （Catalog 轨道 · 非 Infra）历史对象同步

> **已迁移至独立 Issue：** [`PI3-CATALOG-ASSET-MIGRATION`](TT-PI3-CATALOG-ASSET-MIGRATION.md)  
> 本节 **不属于** `PI3-MEDIA-R2-CDN-FINAL` 关闭条件。

Infra 切 secrets 后，**新社区上传** 走 R2/CDN。Catalog 封面（OCS Unsplash）与社区桶迁移 **分开治理**。

若需将 **已上传的 community-media 对象** 从 Tigris 同步到 R2（仅 Infra 范围）：


```bash
# 需同时能读 Tigris 与写 R2（两套凭据或 Tigris 匿名读 + R2 写）
aws s3 sync \
  "s3://traveltrust-community-media/community-media/v1/" \
  "s3://traveltrust-community-media/community-media/v1/" \
  --source-endpoint-url "https://fly.storage.tigris.dev" \
  --endpoint-url "https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --copy-props none \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable"
```

**注意：**

- **Catalog 封面（Unsplash）** → 见 `PI3-CATALOG-ASSET-MIGRATION`，**不**在本清单关闭条件内。
- 仅 **community-media/v1/** 前缀的社区上传对象属于 Infra 同步范围。

**决策点（Infra only · Owner 勾选）：**

- [ ] **A · 渐进：** 新社区上传走 CDN；旧 community-media Tigris URL 允许直到替换  
- [ ] **B · 严格：** sync community-media + DB 批量替换 `tigris.dev` → `cdn.traveltrust.app`

---

## 5 · Fly Secrets（tt-api-staging）

### 5.1 填写 `.env.staging-media-r2.local`

```bash
cd /path/to/TravelTrust-V1.1
cp scripts/dev/staging-media-r2-cdn.env.example scripts/dev/.env.staging-media-r2.local
```

**完整示例（替换 `<...>`）：**

```bash
FLY_API_APP=tt-api-staging

COMMUNITY_MEDIA_S3_BUCKET=traveltrust-community-media
COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://cdn.traveltrust.app
COMMUNITY_MEDIA_S3_ENDPOINT=https://<CF_ACCOUNT_ID>.r2.cloudflarestorage.com
COMMUNITY_MEDIA_S3_REGION=auto
COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=0
COMMUNITY_MEDIA_S3_KEY_PREFIX=community-media/v1

AWS_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>

TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=https://cdn.traveltrust.app

# Web 重建用（见 §5.3）
NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://cdn.traveltrust.app
NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=https://cdn.traveltrust.app
```

### 5.2 同步 API Secrets

**一键（R2 + CORS + Fly）：**

```bash
export CLOUDFLARE_API_TOKEN="<token>"
export CF_ACCOUNT_ID="<account_id>"
bash scripts/dev/provision-staging-media-r2-cdn.sh
```

**或仅 Fly（R2 已手工配置）：**

```bash
bash scripts/dev/configure-staging-media-r2-cdn.sh
```

脚本写入的 Fly secrets（**完整列表**）：

| Secret | 示例值 |
|--------|--------|
| `COMMUNITY_MEDIA_S3_BUCKET` | `traveltrust-community-media` |
| `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` | `https://cdn.traveltrust.app` |
| `COMMUNITY_MEDIA_S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `COMMUNITY_MEDIA_S3_REGION` | `auto` |
| `COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE` | `0` |
| `AWS_ACCESS_KEY_ID` | R2 token |
| `AWS_SECRET_ACCESS_KEY` | R2 token |
| `TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES` | `https://cdn.traveltrust.app` |

**验收（API 进程已滚动重启后）：**

```bash
# 1) capabilities — 必须 public_video_publish_ready=true
curl -s "https://tt-api-staging.fly.dev/api/v1/community/media/capabilities" | jq '{
  multipart_enabled,
  public_video_publish_ready,
  public_video_publish_error
}'

# 2) Fly 上不得再是 loca.lt / tigris 公网前缀（若已切 CDN）
fly ssh console -a tt-api-staging -C \
  'printenv COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL COMMUNITY_MEDIA_S3_ENDPOINT'
# 期望：
#   COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://cdn.traveltrust.app
#   COMMUNITY_MEDIA_S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com

# 3) health
curl -sf "https://tt-api-staging.fly.dev/health/ready" | jq .
```

### 5.3 Fly Web 重建（tt-web-staging）

前端 **构建期** 注入 `NEXT_PUBLIC_*` — 改 secrets 不够，须 **重新 deploy web**。

编辑 `deploy/fly/tt-web-staging/build.env.local`：

```bash
NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://cdn.traveltrust.app
NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=https://cdn.traveltrust.app
```

部署：

```bash
bash scripts/dev/deploy-tt-web-staging.sh
# 或你们现有 CI / fly deploy 流程
```

**验收：** 浏览器 DevTools → 社区发帖抽屉 → Network → capabilities 请求仍走 API；新上传视频 `playback_url` 前缀为 `cdn.traveltrust.app`。

---

## 6 · 数据验证（API 层）

### 6.1 自动化审计

```bash
cd /path/to/TravelTrust-V1.1
AUDIT_STAMP=$(date -u +%Y%m%dT%H%M%SZ) \
STAGING_API=https://tt-api-staging.fly.dev \
STRICT_CDN=1 \
OUT="evidence/GO_media_r2_cdn_migration/${AUDIT_STAMP}/media-url-audit.json" \
node scripts/dev/audit-staging-media-urls.cjs
# 期望：verdict PASS · blocking_count 0（STRICT_CDN=1 时拒绝 tigris.dev）
```

### 6.2 必查 API 端点

| Surface | Endpoint | 检查的 URL 字段 |
|---------|----------|-----------------|
| 社区能力 | `GET /api/v1/community/media/capabilities` | — |
| 社区 Feed | `GET /api/v1/community/feed?limit=30` | `media_urls[]` · 帖内图/视频 |
| 社区图片/视频 | 同上 + 新上传探针 | `https://cdn.traveltrust.app/community-media/v1/...` |
| Market Feed | `GET /api/v1/official/cold-start/surfaces/market_feed` | `image_url` · `cover_url` |
| Guide 列表 | `GET /api/v1/guides?limit=50` | `avatar_url` · `cover_url` · 卡片图 |
| Provider | `GET /api/v1/market/provider/listings?limit=50` | `image_url` · `cover_url` |
| Acquisition | `GET /api/v1/market/acquisition/listings?limit=50` | `image_url` · `cover_url` |
| Official 冷启动 | `GET /api/v1/official/cold-start/surfaces/homepage` | hero / showcase 图 |

**手工抽查命令：**

```bash
API=https://tt-api-staging.fly.dev

for path in \
  "/api/v1/community/feed?limit=30" \
  "/api/v1/guides?limit=20" \
  "/api/v1/market/provider/listings?limit=20" \
  "/api/v1/market/acquisition/listings?limit=20" \
  "/api/v1/official/cold-start/surfaces/market_feed"
do
  echo "=== $path ==="
  curl -s "$API$path" | grep -oE 'https://[^"\\]+' | sort -u | head -20
done
```

### 6.3 通过标准（严格模式 — FINAL 关闭条件）

对 **社区 multipart 媒体** 与 **你们选择统一 CDN 的对象**：

| 检查项 | 通过标准 |
|--------|----------|
| URL 前缀 | `https://cdn.traveltrust.app/...` |
| HTTP | `GET` 或 `HEAD` → **200**（视频允许 **206**） |
| 禁止 | **无** `*.loca.lt` |
| 禁止（严格统一时） | **无** `*.fly.storage.tigris.dev` / `*.tigris.dev` |
| Capabilities | `public_video_publish_ready: true` |

**说明：** OCS Catalog 图可能仍为 **Unsplash** — **Catalog 轨道**（`PI3-CATALOG-ASSET-MIGRATION`），**不** 阻挡 Infra 关闭；**社区 multipart 媒体**须 CDN。

**扩展审计（严格 — 检测 tigris）：**

```bash
API=https://tt-api-staging.fly.dev
BODY=$(curl -s "$API/api/v1/community/feed?limit=50")
echo "$BODY" | grep -E 'loca\.lt|tigris\.dev' && echo "FAIL: interim URL leak" || echo "OK: no loca.lt/tigris in community feed"
```

### 6.4 新上传端到端探针（强烈推荐）

```bash
API_BASE=https://tt-api-staging.fly.dev \
  bash scripts/dev/smoke-community-c4-staging-video-playback.sh
# 期望：complete 后 playback_url 前缀 = cdn.traveltrust.app · Feed GET 200
```

> 若缺少 `scripts/dev/helpers/community-c4-multipart-upload.mjs`，用手动浏览器上传一段短视频并记录 `playback_url`。

---

## 7 · 浏览器验收

**Base URLs：**

- Web：`https://tt-web-staging.fly.dev`
- API：`https://tt-api-staging.fly.dev`

### 7.1 必验页面

| # | 页面 | URL | 验证点 |
|---|------|-----|--------|
| B1 | **Community Feed** | `/community` | 帖内图片/视频加载；无 broken image；视频可播放 |
| B2 | **Guide** | `/market?view=guides` | 向导卡片封面图加载 |
| B3 | **Provider** | `/market/provider` | Listing 卡片图 · `data-listing-id` 与 API 一致 |
| B4 | **Acquisition** | `/market/acquisition` | 同上 |
| B5 | **Official / 冷启动** | `/` 首页 · `/market` | Homepage cold-start showcase；无 mock 泄漏 |
| B6 | **社区发视频** | `/community` → 发帖 | 选 MP4 → 上传进度 → 发布后 Feed 可播 |

### 7.2 Playwright 自动化（可选）

```bash
cd frontend
export STAGING_WEB_BASE=https://tt-web-staging.fly.dev
export STAGING_API_BASE=https://tt-api-staging.fly.dev

# Market Provider + Acquisition 回归
npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts --grep @staging

# 视觉 / API 一致性（Guide · Provider · Acquisition · Community）
npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium
```

### 7.3 浏览器 DevTools 快检

1. **Network → Img / Media** — 过滤 `cdn.traveltrust.app`，确认 200  
2. **Console** — 无 CORS 错误、无 mixed content  
3. **Application → Local Storage** — 无 stale media base override  

**Owner 签字表（打印勾选）：**

- [ ] B1 Community Feed — 图/视频 OK  
- [ ] B2 Guide 卡片图 OK  
- [ ] B3 Provider 列表图 OK  
- [ ] B4 Acquisition 列表图 OK  
- [ ] B5 首页 / Market 冷启动 OK  
- [ ] B6 新上传社区视频 OK · URL 为 `cdn.traveltrust.app`  

---

## 8 · 回滚方案

**何时回滚：** CDN 5xx · SSL 错误 · CORS 阻断上传 · `public_video_publish_ready=false` 持续 >15min · 大面积媒体 404。

### 8.1 切回 Fly Tigris（API）

使用 §1.5 保存的 rollback env，或手工：

```bash
fly secrets set -a tt-api-staging \
  "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://traveltrust-community-media.fly.storage.tigris.dev" \
  "COMMUNITY_MEDIA_S3_ENDPOINT=https://fly.storage.tigris.dev" \
  "COMMUNITY_MEDIA_S3_BUCKET=traveltrust-community-media" \
  "COMMUNITY_MEDIA_S3_REGION=auto" \
  "COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=0" \
  "TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=https://traveltrust-community-media.fly.storage.tigris.dev" \
  --stage

# AWS_* 保持 Tigris/Fly storage 凭据（若 R2 与 Tigris 不同 key，须改回 Tigris 那套）
fly secrets deploy -a tt-api-staging
```

> **关键：** 回滚时 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` 必须是 **Tigris 仍有效** 的那组；若已被覆盖，从 Fly 历史 secrets 或 `fly storage` 重新获取。

### 8.2 恢复 Web 构建 env

`deploy/fly/tt-web-staging/build.env.local` 改回：

```bash
NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=https://traveltrust-community-media.fly.storage.tigris.dev
NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=https://traveltrust-community-media.fly.storage.tigris.dev
```

重新 deploy `tt-web-staging`。

### 8.3 验证回滚成功

```bash
curl -s "https://tt-api-staging.fly.dev/api/v1/community/media/capabilities" | jq .public_video_publish_ready
# 期望：true

AUDIT_STAMP=rollback-$(date -u +%Y%m%dT%H%M%SZ) \
  node scripts/dev/audit-staging-media-urls.cjs
# 期望：无 loca.lt · capabilities OK

# 社区新上传（可选）应回到 tigris.dev 前缀
```

### 8.4 回滚后 Issue 状态

| Issue | 状态 |
|-------|------|
| `PI3-MEDIA-PERSISTENT-STAGING` | 保持 **CLOSED**（interim 仍有效） |
| `PI3-MEDIA-R2-CDN-FINAL` | 保持 **OPEN / WAITING_OWNER_CF** — 记录 rollback 原因与 evidence |

**不要** 重新打开 `PI3-MEDIA-PERSISTENT-STAGING` 除非 loca.lt 复发。

---

## 9 · 移交 Production Acceptance Gate（勿在此直接关闭 Issue）

Owner 完成 **§1–§5**（Cloudflare + Fly secrets + Web 重建）后：

1. 将 `PI3-MEDIA-R2-CDN-FINAL.display_status` 更新为 **`AWAITING_ACCEPTANCE`**（可选 registry 记录）
2. 执行正式验收 Gate — **[`TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md`](TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md)**

```bash
bash scripts/dev/run-media-cdn-production-acceptance-gate.sh \
  --with-c4 \
  --with-playwright
```

3. **仅当** Gate **`verdict: PASS`** 后，按 Acceptance Runbook **§5** 关闭 `PI3-MEDIA-R2-CDN-FINAL` 与 `MEDIA_CDN_PRODUCTION_ACCEPTANCE`

**禁止：**

```text
Cloudflare 配好了 → 直接 CLOSED PI3-MEDIA-R2-CDN-FINAL   ❌
```

§6–§7 的验证可作为 Gate 前自检；**最终以 Acceptance Gate 机读证据为准**。

---

## 10 · （原 §9 关闭流程）— 已迁移至 Acceptance Gate §5

关闭 `PI3-MEDIA-R2-CDN-FINAL` 的 sign-off · registry 更新 · 最终 Dashboard — 见  
[`TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md`](TT-MEDIA-CDN-PRODUCTION-ACCEPTANCE-GATE.md) **§5**。

---

## 11 · 故障排查

| 症状 | 可能原因 | 处理 |
|------|----------|------|
| `public_video_publish_ready=false` | R2 凭据错 · HeadBucket 失败 | 核对 `AWS_*` + `COMMUNITY_MEDIA_S3_ENDPOINT` |
| 上传 CORS 失败 | 桶 CORS 未含 staging 域 | 重跑 §2.4 |
| CDN 404 但 R2 有对象 | Custom domain 未绑定 / DNS 未传播 | §3.1 · 等待 TTL |
| API URL 仍是 tigris | Secrets 未 deploy / 旧 Machine | `fly secrets deploy` · 确认 rolling restart |
| 发帖 400 `media_url_prefix_not_allowed` | `TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES` 未含 CDN | 加入 `https://cdn.traveltrust.app` |
| 浏览器 mixed content | 页面 HTTPS 但 media HTTP | 强制 `https://cdn.traveltrust.app` |
| 视频上传 OK 但 Feed 不播 | Web `NEXT_PUBLIC_*` 未重建 | §5.3 redeploy web |

---

## 12 · 机读摘要

```yaml
issue: PI3-MEDIA-R2-CDN-FINAL
owner: owner_live
display_status: WAITING_OWNER_CF
runbook: docs/runbook/TT-PI3-MEDIA-R2-CDN-FINAL-OWNER-CHECKLIST.md
prerequisites:
  - cloudflare_account_id
  - cloudflare_api_token_minimal
  - traveltrust_app_dns
  - cdn_subdomain_dns
  - fly_tt_api_staging
  - fly_tt_web_staging
  - r2_bucket_traveltrust-community-media
target_public_base: https://cdn.traveltrust.app
rollback_interim: fly_tigris  # PI3-MEDIA-PERSISTENT-STAGING
forbidden_patterns: [localtunnel, "*.loca.lt"]
close_when:
  - MEDIA_CDN_PRODUCTION_ACCEPTANCE_PASS
acceptance_gate: MEDIA_CDN_PRODUCTION_ACCEPTANCE
depends_on_closed: PI3-MEDIA-PERSISTENT-STAGING
not_reopen: [market_runtime, OCS, DDG, SOPCP, market_default_filter]
```

---

**文档版本：** 2026-07-03 · 对应 `PI3-MEDIA-R2-CDN-FINAL` / `WAITING_OWNER_CF`  
**维护：** Owner 完成切流后更新 §9.3 Registry；开发不重开 Market Runtime / OCS / DDG / SOPCP。
