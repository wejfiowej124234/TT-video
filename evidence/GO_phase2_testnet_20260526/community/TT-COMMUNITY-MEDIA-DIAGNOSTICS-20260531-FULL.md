# TT Community Media Diagnostics Report（全链路 · 仅诊断）

**Run ID:** 20260531T222700Z  
**Phase scope:** ① 本地 + ② staging API（127.0.0.1:8080 / MinIO :19000）— **非** ③ Production CDN/HLS GO  
**Mode:** 诊断 only · 未改代码

---

## 0. 执行摘要

| 链路 | 结论 | 主要风险 |
|------|------|----------|
| 视频（multipart → MinIO → Feed canplay） | **PASS** | HLS/CDN 未验；MinIO 须手动 `docker start` |
| 图片（upload-media → 帖子 → 展示） | **PARTIAL FAIL** | Git Bash MSYS 将 `/api/v1/...`  corrupt 为 `C:/Program Files/Git/api/...` 写入 DB（5 帖） |
| Feed / Explore / Profile API | **PASS** | 读路径含 `primary_media_asset_id`（P0 已合入） |
| Post Detail 浏览器 | **PASS（代码+API）** / 浏览器本轮未单独录 Detail 截图 | Feed 与 Detail **URL 解析不一致** |
| 环境依赖 | **PARTIAL** | 排查开始时 API/MinIO/前端均未起；诊断中已拉起 |

---

## 1. 环境快照

| 组件 | 排查开始时 | 诊断中 |
|------|------------|--------|
| Postgres `:5432` | UP | UP |
| API `:8080` | DOWN | UP（`start-api-for-playwright.sh`） |
| MinIO `:19000` | DOWN（`traveltrust-community-minio-evidence` Exited） | UP（`docker start`） |
| Next `:3012` | DOWN | Playwright 自动拉起（C4 canplay 用例） |

**本地 vs staging：** 本轮仅探测 **127.0.0.1** 本地栈；未测 loca.lt / staging tunnel / 生产 CDN。

---

## 2. 十维诊断表

| # | 维度 | 判定 | 根因摘要 |
|---|------|------|----------|
| 1 | 图片链路 | **PARTIAL FAIL** | MSYS 路径污染 5 帖；正确 `/api/v1/uploads/...` 路径 GET 200 |
| 2 | 视频链路 | **PASS** | multipart session → asset ready → MinIO 对象存在 → playback GET 200 |
| 3 | Feed | **PASS（API+canplay）** / **WARN（URL 解析）** | Playwright Feed inline `canplay`; 未统一 `communityMediaAbsoluteUrlForRender` |
| 4 | Explore | **PASS（API）** / **WARN（渲染）** | `mode=recommend` 有帖；瀑布流 raw `thumbSrc` 无 absolute 化 |
| 5 | Profile | **PASS（API）** | C5 smoke `users/:id/posts` 含 media；同 Feed 卡片组件 |
| 6 | Post Detail | **PASS（API+组件）** | P0 已接 MediaZone + playable 解析；`primary_media_asset_id` 在 detail JSON |
| 7 | API | **PASS** | feed/detail/me-posts/user-posts 均含 `primary_media_asset_id` |
| 8 | DB | **PARTIAL** | 55 assets / 54 ready；5 帖 `media_urls` 被 MSYS 污染；1 近期 video 无 pmaid |
| 9 | Storage | **PASS（MinIO up）** | 对象 `9d0e1496-....mp4` 存在；桶 anonymous download OK |
| 10 | Frontend | **PARTIAL** | Feed/Explore 与 Detail 数据结构同源（CommunityPost）但 **URL 处理分叉**；`primaryMediaAssetId` 未参与渲染 |

---

## 3. 分维度详情

### 3.1 图片链路

**步骤：** `POST /api/v1/community/posts/upload-media` → 返回 `{ url: "/api/v1/uploads/community-posts/{uuid}.png" }` → `POST /api/v1/community/posts` → Feed/Explore/Profile/Detail

| 检查项 | 结果 | 证据 |
|--------|------|------|
| 上传 HTTP 200 + url 形态 | PASS | C5 smoke `20260531T222640` |
| 公开 GET 200 + Cache-Control | PASS | `HTTP/1.1 200` · `cache-control: public, max-age=86400, immutable` |
| DB `media_urls` 持久化 | **FAIL（5/97 污染）** | `LIKE '%Program Files/Git%'` = 5；例 `921770ac-...` |
| `primary_media_asset_id`（图片） | N/A（预期 null） | C5 post `primary_media_asset_id: null` ✓ |
| 浏览器渲染 | **未本轮录截图** | 污染 URL 在浏览器必 FAIL；正确 `/api/v1/...` 依赖 Next rewrite |

**根因：** `smoke-community-c5-staging-image-delivery.sh` 经 Git Bash 将 `URL_A`/`URL_B` 传给 `node -e` 时 MSYS 把 `/api/v1/uploads/...` 转为 `C:/Program Files/Git/api/v1/...`，API 原样入库。

**修复建议（未实施）：** smoke/CLI 侧 `MSYS_NO_PATHCONV=1` 或 JSON stdin 传 url；服务端 normalize 拒绝 `C:/` 绝对路径；历史 5 帖数据修复。

---

### 3.2 视频链路

| 检查项 | 结果 | 证据 |
|--------|------|------|
| capabilities | PASS | `public_video_publish_ready=true` |
| multipart session create/presign/complete | PASS | asset `9d0e1496-...` state=ready |
| `community_posts.primary_media_asset_id` | PASS | = asset UUID |
| `media_urls[0]` playback URL | PASS | `http://127.0.0.1:19000/traveltrust-community-media/...mp4` |
| MinIO 对象 | PASS | `mc ls` → `9d0e1496-....mp4` 2.2KiB |
| GET playback | PASS | `HTTP/1.1 200` · `Content-Type: video/mp4` |
| C2 门闸（mp4 json upload 拒绝） | PASS | multipart required |

**根因：** 无阻断性缺陷（①② staging MP4 路径）。

**边界：** `playback_manifest_json=null` · **HLS-CDN pending** · ≠ Production GO。

---

### 3.3 Feed

| 检查项 | 结果 | 证据 |
|--------|------|------|
| `GET /api/v1/community/feed` | PASS | 3 帖 · 全行含 `primary_media_asset_id` |
| 视频帖 feed 行与 detail 一致 | PASS | post `01b84a9a-...` pmaid + media_urls 对齐 |
| `CommunityFeedCardMedia` 视频 | PASS（browser） | Playwright `Feed inline video reaches canplay` **1 passed** (48.3s) |
| 图片 `<Image src>` | WARN | 使用 raw `media_urls`；**未**调用 `communityMediaAbsoluteUrlForRender` |
| 与 Detail 同结构 | PASS | 均 `mapApiPostToCommunityPost` → `CommunityPost` |
| 与 Detail 同 URL 解析 | **FAIL** | Detail 有 absolute 化；Feed 无 |

**组件：** `CommunityFeedCard.tsx` → raw images；`CommunityFeedCardMedia.tsx` → `feedCardPlayableVideoSrc`（与 `resolveCommunityPostPlayableVideoUrl` 逻辑重复）。

---

### 3.4 Explore

| 检查项 | 结果 | 证据 |
|--------|------|------|
| `GET /feed?mode=recommend` | PASS | `status ok` · posts≥3 |
| 数据源 | PASS | `useCommunityExplorePage` → `mapApiPostToCommunityPost` |
| 瀑布流缩略图 | WARN | `CommunityExplorePhotoMasonry.thumbSrc` raw URL · `unoptimized` Image |
| 污染帖展示 | **预期 FAIL** | MSYS 污染 URL 无法在浏览器加载 |

---

### 3.5 Profile

| 检查项 | 结果 | 证据 |
|--------|------|------|
| `GET /users/:id/posts` | PASS | C5 smoke exit 0 |
| `GET /me/posts` | PASS | C4/C5 smoke |
| UI 组件 | PASS | `CommunityUserPostsFeedSection` → `CommunityFeedCard`（同 Feed 媒体逻辑） |

---

### 3.6 Post Detail

| 检查项 | 结果 | 证据 |
|--------|------|------|
| `GET /posts/:id` JSON | PASS | `primary_media_asset_id` + `media_urls` |
| 组件 | PASS（P0 已合） | `PostDetailDrawer` → `PostDetailDrawerMediaZone` |
| URL 解析 | PASS | `resolveCommunityPostPlayableVideoUrl` + `communityMediaAbsoluteUrlForRender` |
| video onError 回退 | PASS | MediaZone `onError` → `community_media_load_failed` |
| 本轮 Detail canplay 截图 | **未跑** | 可参考 C4 Feed canplay + Detail 代码路径 |

---

### 3.7 API

| 端点 | primary_media_asset_id | media_urls | 备注 |
|------|------------------------|------------|------|
| feed | ✓ | ✓ | |
| feed?mode=recommend | ✓ | ✓ | Explore |
| posts/:id | ✓ | ✓ | |
| me/posts | ✓（C4 token 探针） | ✓ | |
| users/:id/posts | ✓ | ✓ | C5 smoke |
| upload-media | url field | — | 图片 |
| media-assets/sessions/* | asset id | playback_url | 视频 |

**401/403：** 本轮成功链路无 4xx；未登录可读 public feed/detail。

---

### 3.8 DB

```
media_assets_total=55 | ready(state)=54
posts_with_primary_media_asset_id=7
posts_with_media_urls=97
corrupted_git_paths=5
correct_api_paths=26
```

**样例 — 视频（正确）：**
- post `01b84a9a-...` · pmaid `9d0e1496-...` · asset state=ready · playback_url MinIO

**样例 — 图片（污染）：**
- post `921770ac-...` · media_urls[1]=`C:/Program Files/Git/api/v1/uploads/...`

**legacy：** 8 条近期 video 中 1 条 `primary_media_asset_id` 为空（历史帖）。

---

### 3.9 Storage

| 检查项 | 结果 | 证据 |
|--------|------|------|
| MinIO health | PASS（启动后） | `:19000/minio/health/live` 200 |
| Bucket | PASS | `traveltrust-community-media` |
| 对象存在性 | PASS | C4 mp4 listed |
| Anonymous download | PASS | C4 smoke mc policy |
| CORS | 配置存在 | `:3012` in setup script |
| Production CDN | **NOT TESTED** | staging only |

**排查开始时 FAIL 原因：** 容器 `traveltrust-community-minio-evidence` Exited — **环境未起，非代码缺陷**。

---

### 3.10 Frontend

| 主题 | 判定 | 说明 |
|------|------|------|
| 数据结构一致性 | PASS | API → `CommunityPost` 单映射 |
| `primaryMediaAssetId` 消费 | **FAIL（未用）** | 映射存在，渲染只用 `media_urls` |
| Feed vs Detail URL | **FAIL** | Detail absolute 化；Feed/Explore 原始路径 |
| Next `remotePatterns` MinIO | PASS | `127.0.0.1:19000/**` |
| Next rewrite `/api/v1/*` | PASS | 本地 loopback 图片可走同源代理 |
| `/tt-community-s3` rewrite | **未启用** | Q-07：MinIO 直连；Detail 已 avoid playback rewrite |
| Console/Network 4xx5xx | **本轮未全量抓** | C4 Playwright 0 fail；污染图片预期 404 |

**canplay / canPlayType：**
- Feed 视频：`e2e/community-c4-staging-video-playback.spec.ts` → **canplay: true**（历史 summary + 本轮 1 passed）
- Detail 视频：代码有 `onLoadedData` + play()；本轮未单独 E2E

---

## 4. 根因归类（决策树）

```
上传失败?          → 否（C2/C4/C5 smokes OK）
媒体关联丢失?      → 否（video pmaid 正确）；图片无 pmaid 为设计
对象存储不可达?    → 仅当 MinIO 容器未起
401/403?           → 本轮未命中
详情页组件缺陷?    → P0 已修；本轮 API PASS
媒体 URL 失效?     → 是（5 帖 MSYS 污染）；MinIO/CDN 正常 URL 200
MinIO/CDN 配置?    → 本地 MinIO OK；Production CDN/HLS 未验
本地 vs staging?   → 本轮仅本地；tunnel 未测
```

---

## 5. 修复建议（优先级 · 未实施）

| P | 项 | 动作 |
|---|-----|------|
| P0 | MSYS 污染 |
| P0 | MSYS path pollution | C5 smoke MSYS_NO_PATHCONV=1; API reject C:/ paths |
| P1 | Feed/Explore URL parity | Apply communityMediaAbsoluteUrlForRender in card/masonry |
| P1 | primaryMediaAssetId | Optional render fallback via asset status API |
| P2 | Env checklist | postgres + minio + api + next before smokes |
| P2 | Data repair | Fix 5 corrupted media_urls rows |
| — | CDN/HLS | Phase 3 gate only |

## 6. Evidence index

- C5/C4 smoke: /tmp/diag-c5.log, /tmp/diag-c4.log
- Playwright: community-c4-staging-video-playback.spec.ts (1 passed, canplay)
- Historical: evidence/GO_phase2_testnet_20260526/community/C4/browser-c4-player-summary.md
- P0: evidence/GO_phase2_testnet_20260526/community/P0-media-read-detail/STATUS.txt

Disclaimer: C1-C12 PASS unchanged. NOT Production CDN/HLS GO.
