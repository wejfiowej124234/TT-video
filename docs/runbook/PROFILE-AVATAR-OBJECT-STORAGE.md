# Profile avatar：对象存储预签名与运维闭环

## 目标

- **生产**：头像经 **S3 兼容**（AWS S3、Cloudflare R2 等）**预签名 PUT** 直传对象存储；`users.avatar_url` 仅存 **HTTPS 公网 URL**（或经 CDN 的同源前缀），不经 API 磁盘落盘。
- **开发/无桶**：不配对象存储变量时，`POST /api/v1/me/profile-avatar/presign` 返回 **503** `avatar_object_storage_not_configured`，前端回退 **`POST /api/v1/me/profile-avatar`**（本机 `data/profile_avatars/` + `GET /api/v1/uploads/profile-avatars/:name`）。

## API 契约

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/me/profile-avatar/presign` | Body：`{ "content_type": "image/jpeg", "content_length": <bytes> }`。成功：`upload_url`、`avatar_url`、`headers`（须原样带入 PUT）、`expires_in_seconds`。 |
| POST | `/api/v1/me/profile-avatar/commit` | Body：`{ "avatar_url": "<presign 返回的 avatar_url>" }`。浏览器对 `upload_url` **PUT** 成功后调用；服务端校验公网前缀与路径中的用户 UUID 后写入 **`users.avatar_url`**（可替代再 `PUT /me`）。 |
| POST | `/api/v1/me/profile-avatar` | 无桶时：Base64/data URL 写入本机目录并写 **`users.avatar_url`**；仍须 `DATABASE_URL`（`ensure_durable_writes_available`）。 |
| PUT | `/api/v1/me` | `avatar_url` 存预签名响应中的 **`avatar_url`**（公网）或本机模式的相对路径（仅开发）。 |

约束：`content_type` ∈ `image/jpeg|image/jpg|image/png|image/webp`；`content_length` ∈ `1..=524288`。

## 环境变量（API 进程）

| 变量 | 必填 | 说明 |
|------|------|------|
| `PROFILE_AVATAR_S3_BUCKET` | 预签名时 | 桶名。 |
| `PROFILE_AVATAR_PUBLIC_BASE_URL` | 预签名时 | **无尾斜杠**。浏览器与 DB 中展示的 URL 前缀：`{PUBLIC}/{key}`。 |
| `PROFILE_AVATAR_S3_ENDPOINT` | R2 等自定义端点时 | 例：`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`。 |
| `PROFILE_AVATAR_S3_REGION` | 否 | 默认 `us-east-1`；**R2 建议 `auto`**。 |
| `PROFILE_AVATAR_S3_FORCE_PATH_STYLE` | 否 | `1`/`true` 时 path-style（R2 常见）。 |
| `PROFILE_AVATAR_S3_KEY_PREFIX` | 否 | 默认 `profile-avatars`。 |
| `PROFILE_AVATAR_PRESIGN_TTL_SEC` | 否 | 默认 `900`，范围 `60..=3600`。 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | 预签名时 | 与 aws-sdk 默认链一致；R2 使用 R2 API Token 对应密钥。 |

## 浏览器 CORS（必查）

预签名 **PUT** 由浏览器发往 **对象存储域名**（非 Next/API）。必须在桶侧配置 CORS，至少允许：

- **Methods**：`PUT`（若以后支持直读可再加 `GET`）
- **Origins**：生产前端 HTTPS origin 列表
- **Headers**：按预签名返回的 `headers` 键（通常含 `Content-Type`、`Content-Length`、及 SigV4 相关 `x-amz-*`）

否则上传在浏览器控制台表现为 **blocked by CORS** 或 **403**。

## 权限与桶策略（建议）

1. **专用 IAM / R2 Token**：仅允许 `s3:PutObject`（及必要时 `s3:AbortMultipartUpload` 若以后分片）到前缀 `profile-avatars/*`；拒绝 `s3:DeleteObject` 给应用密钥（删除走运维工单或独立高权限角色）。
2. **公网读**：二选一  
   - **推荐**：桶私有 + **`PROFILE_AVATAR_PUBLIC_BASE_URL`** 指向 **CDN**（CloudFront / R2 自定义域）对前缀做缓存、源站为桶；或 R2 **公开桶** + 自定义域。  
   - **不推荐**：长期公开整桶 `ListBucket`。
3. **防枚举**：对象键含随机 UUID（已实现），避免可猜顺序 ID。

## 部署卷（本机回退路径）

当未启用对象存储、或应急回退 **`data/profile_avatars/`** 时：

- **Docker / K8s**：将 **`data/profile_avatars` 挂载为 volume**（`emptyDir` 会随 Pod 丢文件；生产若仍走磁盘须用 PVC / hostPath 按规范）。
- **权限**：进程用户对该目录 **读写**；镜像内预创建目录或启动时 `create_dir_all`。
- **多副本**：无共享卷时，各副本磁盘不一致；**生产应使用对象存储**，避免会话粘滞依赖本机文件。

## 备份

- **对象存储**：纳入组织标准备份（桶复制、版本控制、跨区域复制等）；**DB** 备份含 `users.avatar_url` 字符串即可恢复「引用」，不备份对象本体若桶已有版本策略。
- **本机 `data/profile_avatars/`**（仅开发）：按需随数据目录一并 rsync/snapshot；**勿依赖**为唯一源。

## 清理与生命周期

- **换头像**：新对象新 key；旧对象可异步删除。建议在桶上对前缀 `profile-avatars/` 配置 **Lifecycle**：非当前版本在 N 天后过期，或 **过期删除** 规则与产品政策一致（注意合规留存期）。
- **用户注销**：若合规要求删除媒体，用批量任务按 `avatar_url` 解析 key 后调用 `DeleteObject`（须高权限运维角色，不在 API 默认密钥内）。

## 与本仓库代码的对应关系

- 预签名实现：`crates/api/src/storage/profile_avatar_presign.rs`
- 路由：`crates/api/src/routes/me.rs`（`POST …/presign` 与本机 POST）
- 前端：`postMeProfileAvatarPresign` + `useMePage` 先预签名 PUT，503 `avatar_object_storage_not_configured` 时回退 Base64 POST

## MinIO IT（F-007 · A-AVA-002 · opt-in）

1. 根目录 **`docker compose up -d minio`**（**`127.0.0.1:9000`**；默认 **`MINIO_ROOT_USER=minio`** / **`MINIO_ROOT_PASSWORD=minio12345`**，与 **`me_profile_avatar_s3_minio_db_api_tests`** 默认常量一致）。
2. **`docker compose up -d postgres`**（或任意已迁移 **`DATABASE_URL`**）。
3. 执行（**Bash** 示例）：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT=1
cargo test -p traveltrust-api matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg -- --exact
```

- 未设 **`TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT=1`** 时，本测 **skip**（**默认 CI** 不要求 MinIO）。
- 可用 **`PROFILE_AVATAR_*` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`** 覆盖默认 MinIO 端点/桶名（见上表「环境变量」）。

## 故障速查

| 现象 | 检查 |
|------|------|
| 503 `avatar_object_storage_not_configured` | `PROFILE_AVATAR_S3_BUCKET` 与 `PROFILE_AVATAR_PUBLIC_BASE_URL` 是否同时非空。 |
| 502 `avatar_presign_failed` | 端点/区域/凭证；R2 是否 `PROFILE_AVATAR_S3_FORCE_PATH_STYLE=1`。 |
| PUT 成功但头像 403/404 | `PUBLIC_BASE` 是否与桶实际对外域名一致；CDN 回源权限。 |
| 仅浏览器失败 | 桶 **CORS**、是否 HTTPS 混用。 |
