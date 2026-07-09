# Community media（Phase1）：S3 multipart 与 `community_media_assets`

> **企业三层媒体 SSOT（2026-07-03）：** Phase ① MinIO 本地 · Phase ②/③ **R2 → `https://cdn.traveltrust.app`** — **禁止** Staging/Prod 使用 localtunnel。详见 **[TT-MEDIA-THREE-TIER-ARCHITECTURE.md](TT-MEDIA-THREE-TIER-ARCHITECTURE.md)** · [`registry/media-three-tier-architecture.v1.yaml`](../../registry/media-three-tier-architecture.v1.yaml)。

## 目标（企业 MVP 骨架）

- **生产主路径**：浏览器 **直传 S3 兼容桶**（**CreateMultipartUpload → UploadPart（预签名）→ CompleteMultipartUpload**），业务 API **不承载**视频字节。
- **元数据真源**：PostgreSQL 表 **`community_media_assets`**（与迁移 **`20260530120000_community_media_assets.sql`** 同源）。
- **发帖绑定**：**`COMMUNITY_MEDIA_S3_BUCKET`** + **`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** 均已配置时，**`POST /api/v1/community/posts`** 且 **`post_type=video`** 必须带 **`media_asset_id`**，且资产 **`state=ready`**、**`owner_user_id`** 为当前用户；服务端将 **`playback_url`** 写入 **`media_urls[0]`** 并落 **`community_posts.primary_media_asset_id`**（与 **04** 社区行对读）。
- **开发/未配桶**：**MP4/WebM** **不得**再走 **`POST …/community/posts/upload-media`** Base64；**`GET …/media/capabilities`** 返回 **`public_video_publish_ready=false`**，**`PublishDrawer`** 禁用「视频」类型并提示；**`upload-media`** 对 **MP4/WebM** 返回 **400** **`community_video_requires_object_storage_multipart`**。

本 Runbook **不**声称大规模转码或抖音级分发；Phase1 **不**写多码率 Worker，仅预留 **`playback_manifest_json`** 与 **`duration_ms`/`width`/`height`** 字段。**① / ② 验收分工**见 **[local-release-ready-vs-testnet](local-release-ready-vs-testnet.md)**。

## 运维要点（未配桶时为何「发不出大视频」）

须在 **API 进程加载的根 `.env`** 配置 **`COMMUNITY_MEDIA_S3_BUCKET`**、**`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`**、**S3/R2 凭据**（与 **`aws-sdk` / `aws_config::defaults`** 默认凭证链一致，例如 **`AWS_ACCESS_KEY_ID`**、**`AWS_SECRET_ACCESS_KEY`**；R2 常配 **`COMMUNITY_MEDIA_S3_ENDPOINT`** 与 **`COMMUNITY_MEDIA_S3_REGION=auto`**）及 **桶 CORS**（见下 **§CORS 与 CDN**）。**变更后须重启 `traveltrust-api`（Rust API）**，否则仍按旧环境判断「未配置」。

否则：**`GET …/media/capabilities`** 中 **`public_video_publish_ready=false`**（**`multipart_enabled`** 可能为真但 **`HeadBucket`** 失败时 **`status=degraded`**），**`PublishDrawer`** 隐藏正常视频能力；**`POST …/sessions`** 仍会在未配齐变量时返回 **`community_media_object_storage_not_configured`**（**503**）。

**`GET /api/v1/community/media/capabilities`**（**无需登录**）：返回 **`multipart_enabled`**（桶+公网基址非空）、**`public_video_publish_ready`**（且 **S3 `HeadBucket`** 成功）、**`public_video_spec_required`**（**`TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED`**）、**`head_bucket_probe_impl`**（稳定 id，与 **`crates/api` `COMMUNITY_MEDIA_S3_HEAD_BUCKET_PROBE_LOG_ID`** 同源）、**`head_bucket_cache_hit`**（是否命中 Head 探测进程内缓存）、**`public_video_publish_error`**、**`max_video_seconds`**（就绪时与产品上限 **180s** 及 env 取 min）、**`max_video_bytes`**、**`supported_content_types`**；可选 **`TT_COMMUNITY_MULTIPART_LOG=1`** 时 stderr **`capabilities_snapshot`** 与上列体字段对拍（见环境表）。**`PublishDrawer`** 须在抽屉打开后拉取，**禁止**仅靠 **`NEXT_PUBLIC_*`** 假装支持长视频。

可选 **`TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED=1`**：**`GET /health`** 在未就绪时 **503**（与 **`public_video_publish_ready`** 同源探测）；**`scripts/dev/preflight-local-stack.ps1`** 校验桶与公网基址非空。

## 环境变量（API 进程）

| 变量 | 必填 | 说明 |
|------|------|------|
| `COMMUNITY_MEDIA_S3_BUCKET` | 启用直传时 | 桶名。 |
| `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` | 启用直传时 | **无尾斜杠**；与 **`playback_url`** 前缀一致（通常 CDN 或桶静态网站域名）。 |
| `COMMUNITY_MEDIA_S3_ENDPOINT` | 否 | R2/MinIO 等自定义端点。 |
| `COMMUNITY_MEDIA_S3_REGION` | 否 | 默认 `us-east-1`；R2 常用 `auto`。 |
| `COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE` | 否 | `1`/`true` 时 path-style。 |
| `COMMUNITY_MEDIA_S3_KEY_PREFIX` | 否 | 默认 `community-media/v1`（不含首尾 `/`）。 |
| `COMMUNITY_MEDIA_PRESIGN_TTL_SEC` | 否 | 分片预签 TTL，**60～3600**，默认 **900**。 |
| `TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES` | 否 | 单对象上限，**5MiB～1GiB** 钳位，默认 **500MiB**。 |
| `TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED` | 否 | `1`/`true`：**`GET /health`** 须 **`public_video_publish_ready`** 同源 **`HeadBucket`** 通过，否则 **503**；**preflight** 校验 **`COMMUNITY_MEDIA_S3_BUCKET`**+**`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** 非空。 |
| `TT_COMMUNITY_MULTIPART_LOG` | 否 | `1`/`true`/`yes`：在 **`GET …/media/capabilities`** 写 **`phase=capabilities_snapshot`** 一行（**`api_status` / `multipart_enabled` / `public_video_publish_ready` / `public_video_spec_required`（**`TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED`**）/ `max_*` / 错误键截断**；另含 **`probe_impl=head_bucket_cached_ttl15s_v1`** 与 **`cache_hit=0|1`**，与 **`GET /health`** 同源 **HeadBucket** 缓存探测对拍）；**JSON** 响应体同步含 **`public_video_spec_required` / `head_bucket_probe_impl` / `head_bucket_cache_hit`**（与该行 stderr 对拍）；在 **`GET /health`** 写 **`phase=health_community_public_video_spec`**（**`spec_required` / `multipart_enabled` / `head_probe` 截断 / `http_status` / 同上 `probe_impl` / `cache_hit=-|0|1`**，**`-`** 表示未执行规格闸探测）；在 **`GET …/media-assets/:asset_id`** 成功时写 **`phase=asset_status_snapshot`**（**`state` / `byte_length` / `playback_url_len`**）；**429** 进程内上传限流时在 **`POST …/sessions`**、**`POST …/parts`**、**`POST …/complete`** 写 **`phase=rate_limit_exceeded`**（**`asset_id=-`**）；在上述三 **POST** 成功路径及列出的失败路径写 **stderr** 单行（标记 **`tt_community_multipart_chain=release_multipart_chain_v1`**，与 **`x-request-id`** 对拍）；**不**记录密钥、预签 URL、ETag 体或完整 **`playback_url`**。`asset_id` 缺省（未创建会话前）时记为 **`asset_id=-`**。典型 **`phase`**（multipart）：`rate_limit_exceeded` · `asset_status_snapshot` · `gate_object_storage_not_configured` · `s3_client_build_failed` · `s3_create_multipart_failed` · `media_asset_db_insert_failed` · `session_create_ok` · `presign_part_failed` · `presign_parts_ok` · `s3_complete_failed` · `s3_head_object_failed` · `playback_url_build_failed` · `finalize_media_asset_db_failed` · `finalize_media_asset_state_conflict` · `complete_ready`。本地 / 测试网 / 生产**同一二进制**开关一致，便于 ② 日志对拍。 |

**限流（进程内）**：与 **`GUIDE_UPLOAD_*`** 同源形；常量 **`COMMUNITY_MEDIA_UPLOAD_RATE_LIMIT`** / **`COMMUNITY_MEDIA_UPLOAD_RATE_WINDOW_SECS`**（见 **`crates/api/src/middleware/mod.rs`**）。

## API 顺序（客户端）

1. **`POST /api/v1/community/media-assets/sessions`** — 得 `asset_id`、`object_key`、`part_size_bytes`、`part_count`。
2. **`POST /api/v1/community/media-assets/sessions/:asset_id/parts`** — 分批请求 `part_numbers`，得每片 **`url` + `headers`**；客户端 **`PUT`** 每片二进制到对象存储（**`ETag`** 原样保存，**含引号**与否以云厂商返回为准，**complete** 时须回传与 **ListParts**/**PUT** 响应一致）。
3. **`POST /api/v1/community/media-assets/sessions/:asset_id/complete`** — 提交 **全片** `parts`；服务端 **CompleteMultipart** 后 DB 走 **`pending_upload`→`uploaded`→`processing`→`ready`**（Phase1 同步完成），**`HEAD`** 对拍 **`byte_length`**，填 **`playback_url`**。
4. **`GET /api/v1/community/media-assets/:asset_id`** — 轮询 **`state`**（Phase1 多为同步 **`ready`**）。
5. **`POST /api/v1/community/posts`** — **`post_type":"video"`**，**`media_asset_id`**，**`body`**…；**`media_urls`** 可由服务端覆盖为 **`playback_url`**。

## 权限与发帖门禁

- **分片 API**：须登录；资产 **仅 owner** 可读 **`GET …/media-assets/:id`**。
- **发帖**：**`media_asset_id`** 必须 **`state=ready`** 且 **`owner_user_id`**=当前用户；默认新帖 **`visibility_status=public`** 时，**非 ready 资产不可绑定**（**400** `media_asset_not_ready`）。

## 孤儿对象与生命周期（运维）

- **未完成 multipart**：若 **`CreateMultipartUpload`** 后客户端放弃，桶内会出现未完成分片 — 建议在桶上配置 **`AbortIncompleteMultipartUpload`** 生命周期（按前缀 **`COMMUNITY_MEDIA_S3_KEY_PREFIX`**），与头像 Runbook **`PROFILE-AVATAR-OBJECT-STORAGE.md`** 的运维口径一致。
- **DB 行 `pending_upload`**：若长期滞留，可离线对账 **`community_media_assets`** 与桶 **`HeadObject`** / **`ListMultipartUploads`**，人工 **`AbortMultipartUpload`** 后删行或标记 **`failed`**（Phase1 未提供自动清扫 Job）。

## CORS 与 CDN

- 浏览器 **直传** 桶域名时，桶 CORS 须允许 **`PUT`** 来源站、`expose` **`ETag`**（便于读 **`ETag`** 供 complete）。
- **`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** 建议走 **CDN**，缓存策略区分 **不可变对象**（UUID key）与 **短 TTL 播放鉴权**（后续 Phase）。

## 前端（已实现 · PublishDrawer / `traveltrust-api` 客户端）

**模块**

- **`frontend/lib/apiClient/community/mediaCapabilities.ts`**：**`getCommunityMediaCapabilities`** → **`GET /api/v1/community/media/capabilities`**（**`public_video_publish_ready`** / **`max_video_*`** / **`public_video_spec_required` / `head_bucket_probe_impl` / `head_bucket_cache_hit`** 与 API stderr **`capabilities_snapshot`** 同源对拍；缺字段的旧二进制由客户端归一为 **`unknown` / false**）。
- **`frontend/components/community/PublishDrawer/useCommunityMediaCapabilities.ts`**：抽屉 **`entered`** 后拉取 capability；**`public_video_publish_ready=false`** 时禁用「视频」类型与选文件。
- **`frontend/lib/apiClient/community/mediaAssetsMultipart.ts`**：`createCommunityMediaUploadSession`、… **`uploadCommunityVideoMultipart`** …
- **`frontend/components/community/PublishDrawer/usePublishForm.ts`**：**`public_video_publish_ready`** 为真时_blob_ 视频仅走 **`uploadCommunityVideoMultipart`**；无 Base64 视频降级。
- **`frontend/components/community/useCommunityFeedPublishSubmit.ts`**：视频帖在拿到 **`playback_url`** 后 **`createPost`** 传 **`media_asset_id`**（与 **`POST …/community/posts`** 键名一致）；乐观 **`media_urls[0]`** 用 **`playback_url`** 做列表预览。带 **`media_asset_id`** 时**不**再对 **`playback_url`** 做 **`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** 客户端预检（避免误拦 CDN）；**服务端**仍按 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** 校验 — 运维须让 **`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** 落在该前缀列表内（见根 **`.env.example`** 社区视频段）。
- **选文件预检**：**`GET …/media/capabilities`** 的 **`max_video_bytes`** / **`max_video_seconds`** 为真值；**`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES`** 等仅作非 **PublishDrawer** 主路径的构建期提示，**不得**替代 capability 门禁。

**UI**

- 视频区展示 **上传进度条** 与阶段文案；分片/complete/资产失败时 **`community_video_*`** 明确提示，并提供 **「重试上传」**（再次提交）。

**单测**

- **`frontend/lib/apiClient/community/mediaAssetsMultipart.test.ts`**（Vitest）：成功路径、分片 PUT 失败、complete 失败、资产 **`failed`**、**`ready`** 后发帖侧 **`createPost`** 载荷（通过 mock **`fetch`**）。

### 历史草案（步骤摘要）

1. 用户选文件 → 读 **`size`** / **`type`**，预检 **`video/mp4`|`video/webm`** 与上限（以 **`GET …/media/capabilities`** 的 **`max_video_bytes`** / **`max_video_seconds`** 为准）。
2. **create session** → 按后端 **`part_count`** 分批 **presign**（每批 ≤32 **`part_numbers`**）。
3. 对每片 **`fetch(url, { method:'PUT', headers, body: slice })`**，收集 **`ETag`**（与 complete 回传一致）。
4. **complete** → 取 **`playback_url`**；必要时 **GET** 资产直至 **`ready`**。
5. **`POST …/community/posts`**：**`post_type":"video"`**，**`media_asset_id`**；不必传大体积 **`media_urls`**（服务端以 **`playback_url`** 填充）。

## E2E 测试计划（① 本地 / ② 测试网）

| 用例 | 步骤 | 期望 |
|------|------|------|
| 未配桶 / 探测失败 | 清 **`COMMUNITY_MEDIA_*`** 或凭据无效 | **`GET …/capabilities`** **`public_video_publish_ready=false`**；**`upload-media` MP4** | **400** `community_video_requires_object_storage_multipart` |
| Multipart 正路径 | MinIO/R2 + **`DATABASE_URL`**：sessions→PUT 各片→complete→**`GET …/media-assets/:id`** `ready` | **200** 且 **`playback_url`** 前缀命中公网基址 |
| 发帖绑定 | **`media_asset_id`** ready → **`POST …/posts`** `video` | Feed **`media_urls[0]`** 可播 HTTPS |
| 负例 · 非 owner | 用户 B **`GET`** 用户 A 的 **`asset_id`** | **404** |
| 负例 · 未 ready 发帖 | **`pending_upload`** 即发帖 | **400** `media_asset_not_ready` |
| 限流 | 窗内刷 **`sessions`** 超过阈值 | **429** + **`retry_after_seconds`** |

**说明**：全链路 S3 **opt-in** 可参考 **`TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT`** 类 IT（**`me_profile_avatar_s3_minio_db_api_tests`**）；社区媒体可另增 **`TRAVELTRUST_COMMUNITY_MEDIA_S3_MINIO_IT=1`** 专用用例（本 Phase1 以契约 + Runbook 为主）。

## 代码锚点

- S3 封装：`crates/api/src/storage/community_media_s3.rs`
- HTTP：`crates/api/src/routes/community/media_asset_sessions/handlers.rs`
- DB：`crates/api/src/db/community/media_assets.rs`
- 发帖：`crates/api/src/routes/community/posts/create/handler.rs`
- 迁移：`crates/api/migrations/20260530120000_community_media_assets.sql`
