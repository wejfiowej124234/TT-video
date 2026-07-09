# ① 本地社区视频 · MinIO 真链路证据

## 端口

若本机 **9000** 已被其他 MinIO 占用，本包将 **S3 端点映射为 `127.0.0.1:19000`**（见 `docker-compose.yml`）。

## 一键验收（curl + PostgreSQL）

```bash
# 仓库根
bash evidence/community-media-local-minio-chain/run-local-evidence.sh
```

检查：`out/07-capabilities.json`（`public_video_publish_ready`、`max_video_seconds`）、`out/13-put-response-headers.txt`（multipart **PUT**）、`out/15-complete.json`（`state=ready`）、`out/19-create-post.json`、`out/20-feed.json`、`out/21-db-asset.txt`、`out/22-db-post.txt`、`out/04-api.log`。

## 配置摘要（与脚本默认一致）

| 变量 | 默认值 |
|------|--------|
| `COMMUNITY_MEDIA_S3_BUCKET` | `traveltrust-community-evidence` |
| `COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL` | `http://127.0.0.1:19000/traveltrust-community-evidence` |
| `COMMUNITY_MEDIA_S3_ENDPOINT` | `http://127.0.0.1:19000` |
| `COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE` | `1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `minio` / `minio12345` |
| `TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED` | `1` |
| `TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS` | `0`（本地 **http** MinIO 放行；生产勿抄） |
| `TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES` | 与 public base 同源前缀 |

MinIO：`docker-compose.yml`（`docker compose up -d`）。**社区版 MinIO** 不支持 S3 **PutBucketCORS**（`mc cors set` 会报 *not implemented*），本包在 **MinIO server** 上设置 **`MINIO_API_CORS_ALLOW_ORIGIN: "*"`** 作为本地 **全局 CORS**（浏览器对预签 **PUT** / **GET** 播放同源策略验收用）。生产请改用 **R2/S3** 桶策略 + 桶 CORS。

## 浏览器 PublishDrawer / Network / HAR

1. 起 MinIO：`cd evidence/community-media-local-minio-chain && docker compose up -d`
2. 起 Postgres：`docker compose -f docker-compose.yml up -d postgres`（仓库根）
3. 导出与 `run-local-evidence.sh` 相同导出变量，`cargo run -p traveltrust-api`
4. Next `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080`，打开社区发布抽屉；DevTools Network 保存 **HAR** 到 `out/browser.har`（手工）。

## Playwright（capabilities 就绪时不 skip 视频用例）

```bash
cd frontend
PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080 npx playwright test market-subsite-studio-and-community-publish.spec.ts -g "video post tiny" --trace on
```


## 证据文件

- `out/24-env-snapshot.txt` — 关键环境变量快照
- `out/25-curl-recap.txt` — curl 步骤索引（与 JSON 响应文件配对）
- 浏览器 **Network HAR**：手工导出到 `out/browser.har`（可选）
