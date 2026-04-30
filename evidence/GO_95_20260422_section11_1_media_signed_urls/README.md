# GO_95 — §11.1「Media 签名访问」旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/media.rs`** — **`POST /api/v1/media/signed-urls`**、**`GET /api/v1/media/access/:token_id`**；与 **04** **§3.4**、**14**、**270** 头注释同向；**Admin** 侧 **`/api/v1/admin/.../media/signed-url-tokens`** 等**不**在本文全量对拍（见 **诚实边界**）。

## 1. 挂载与 `merge` 序

**`api_router()`**（**`crates/api/src/routes/mod.rs`**）：**`… .merge(evidence::router()).merge(media::router()).merge(intents::router()) …`**（与 **Intents / Evidence** 旁证包所述 **`media` 间于 `evidence` 与 `intents`** 一致）。

## 2. 路径表

| 方法 | 路径 |
|------|------|
| POST | `/api/v1/media/signed-urls` |
| GET | `/api/v1/media/access/:token_id` |

**MVP 语义摘要**（**`media.rs` 文首**）：**`object_id`** 形如 **`evidence|{order_uuid}|{content_hash_hex}`**；须 **`chain_off`** + **`DATABASE_URL`** + 迁移 **`signed_url_tokens`** / **`media_access_logs`**；**无 `chain_off`** → **503** **`chain_off_unavailable`**。**GET 兑现**成功路径当前返回 **元数据 JSON**（**`implementation_note`：blob 未接对象存储，至 270**）。

## 3. 机读命令与诚实边界

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| **`routes::media`** 子集 | **`cargo test -p traveltrust-api 'routes::media::' -- --test-threads=1`** → **4 passed**（**`http_tests` 2** — **`POST`/`GET` 无 `chain_off`** → **503**；**`tests` 2** — **`parse_evidence_object_id` 正/负**） |
| 路由契约门禁 | **`bash scripts/run-check-04-routes.sh`** → **exit 0** |

**诚实边界**：

- 本文**不**声称 **PG+`evidence_receipts`+会话用户** 全路径 **`Router::oneshot` 已闭**；**不**声称 **S3/MinIO** 签发与 **GET 字节流** 已人验（与 **文内** **`implementation_note`**、**[270](../../docs/spec/270-阶段文件媒体证据存储系统.md)** **Target** 一致）。  
- **Admin** **`routes::admin` · `get_admin_media_signed_url_tokens`** 等**不**因本包升格为 **§8.2 行完成**；**ISS-008** / **F-007** 对象存储子链**正交**（头像 **`me/profile-avatar`** 另系）。

## 4. 前端

**`frontend/lib/api.ts`** 若登记 **`mediaSignedUrls`** / **access** 前缀，以 **04 §3.4** 与源码为准；本旁证不强制全表对拍。
