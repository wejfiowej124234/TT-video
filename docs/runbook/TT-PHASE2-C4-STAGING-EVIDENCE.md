# TT-PHASE2-C4-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C4 单槽** staging 证据（HLS/MP4 播放链 · multipart 对象存储 · Feed 播放器 · **HLS-CDN pending**）

**机读入口：** `API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c4-evidence.sh` → `TT_COMMUNITY_C4_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T14:17:55Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C4](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C3-STAGING-EVIDENCE](./TT-PHASE2-C3-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C4/`](../../evidence/GO_phase2_testnet_20260526/community/C4/) · [COMMUNITY-MEDIA-OBJECT-STORAGE](./COMMUNITY-MEDIA-OBJECT-STORAGE.md)

---

## 0 · 诚实边界（必读）

| 本报告 **C4 PASS** | **不等于** |
|--------------------|------------|
| ② **C4 槽** · video IT + Fly staging multipart + 播放器 E2E | **C1/C2/C3/C5～C12** 任一槽 PASS |
| staging **MP4 直链** playback URL GET **200** · Feed `<video>` 挂载 + `/tt-community-s3` 代理 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| Fly `public_video_publish_ready=true`（经 **localtunnel → 本机 MinIO** 临时桶） | **③** 生产 R2/CDN/HLS manifest · edge Cache-Control GO |
| `playback_manifest_json=null`（HLS 预留） | **C5** 多图 CDN · **C7** 93 全站矩阵 GO |
| Playwright Feed 卡截图 + API playback 探针 | 持久 staging 对象存储（tunnel **非** Fly 持久卷） |

**可宣称：** **② C4 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production CDN/HLS GO

**对象存储说明（② 目标拓扑 · 2026-07-03）：** Staging **须** Fly → **Cloudflare R2** → **`https://cdn.traveltrust.app`**。历史 **localtunnel → 本机 MinIO** 仅 incident 临时解阻，**已 DEPRECATED** — 见 [`TT-MEDIA-THREE-TIER-ARCHITECTURE.md`](TT-MEDIA-THREE-TIER-ARCHITECTURE.md) · `scripts/dev/configure-staging-media-r2-cdn.sh`。

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C4 槽）** | **是** · `TT_COMMUNITY_C4_EVIDENCE: OK` | **②** |
| **Video playback IT** | **是** · `matrix_93_d_com_c4_*` **3** + `primary_media_asset_id_*` **2** | **① 代码 / ② 对拍** |
| **Staging video playback API E2E** | **是** · `TT_COMMUNITY_C4_STAGING_VIDEO_PLAYBACK: OK` | **②** |
| **Staging video player E2E** | **是** · Playwright Feed masonry `<video>` + `browser-c4-player-summary.md` | **②** |
| **Fly API** | **是** · `https://tt-api-staging.fly.dev` | **②** |
| **HLS / 生产 CDN** | **否** · `hls_cdn: pending` | **③** |

**一句话结论：** **C4 单槽在 Fly staging 真环境已 PASS**（staging MP4 · multipart · Feed 播放器）；**HLS/manifest/生产 CDN 留 ③**；其余槽与 Phase ② 全矩阵 **未在本报告宣称**。

---

## 2 · 清单表（C4 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **IT · Feed/Profile playback URL** | `matrix_93_d_com_c4_video_post_feed_profile_playback_url_pg` | ✅ PASS | — |
| 2 | **IT · asset not ready 拒发** | `matrix_93_d_com_c4_media_asset_not_ready_rejects_post_pg` | ✅ PASS | — |
| 3 | **IT · HLS manifest null** | `matrix_93_d_com_c4_asset_status_hls_manifest_null_pg` | ✅ PASS | — |
| 4 | **IT · primary_media_asset_id** | `matrix_93_d_com_primary_media_asset_id_*` **2 passed** | ✅ PASS | — |
| 5 | **capabilities 就绪** | `GET …/media/capabilities` · `public_video_publish_ready=true` | ✅ PASS | — |
| 6 | **multipart 发帖 + playback** | smoke multipart · playback URL GET **200** | ✅ PASS | — |
| 7 | **Feed / me/posts 可见** | video post + `media_urls` | ✅ PASS | — |
| 8 | **C2 门闸仍有效** | `upload-media` MP4 base64 → **400** · `community_video_requires_object_storage_multipart` | ✅ PASS | — |
| 9 | **Feed 播放器 E2E** | Playwright masonry 卡 · `src` via `/tt-community-s3` · API playback **200** | ✅ PASS | — |
| 10 | **HLS / 生产 CDN** | `playback_manifest_json=null` · 无 m3u8/manifest GO | ❌ 未完成 | **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C4/run-20260605T141755Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C4/run-20260605T141755Z.log) |
| Video playback IT | [`evidence/…/C4/video-it-20260605T141755Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C4/video-it-20260605T141755Z.log) |
| Staging video playback E2E | [`evidence/…/C4/staging-video-playback-e2e-20260605T141755Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C4/staging-video-playback-e2e-20260605T141755Z.log) |
| 播放器摘要 | [`evidence/…/C4/browser-c4-player-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C4/browser-c4-player-summary.md) |
| Feed 截图 | [`evidence/…/C4/browser-c4-feed-video-canplay.png`](../../evidence/GO_phase2_testnet_20260526/community/C4/browser-c4-feed-video-canplay.png) |
| STATUS | [`evidence/…/C4/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C4/STATUS.txt) |

**本 run 样例锚点（可 grep）：** `post_id=46e0b56b-5a88-42ac-80fc-3514d1a51f03` · `marker=tt-phase2-c4-playback-62f884e0`

---

## 4 · 复跑命令（仅 C4 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

# 前置：本机 MinIO :19000 + localtunnel（默认 C4_MINIO_TUNNEL_URL）
API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c4-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C4_STAGING_VIDEO_PLAYBACK: OK` · `TT_COMMUNITY_C4_EVIDENCE: OK`

**Fly staging 前置：** `COMMUNITY_MEDIA_S3_*` / `AWS_*` secrets 指向 tunnel 公网前缀 · `TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1` · `TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1` · `TRAVELTRUST_EMAIL_TRANSPORT=log` · 前端 `NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0`（脚本会 patch `.env.local`）。

---

## 5 · 机读结论

```
TT_PHASE2_C4_STAGING_VERDICT: PASS
TT_COMMUNITY_C4_EVIDENCE: OK
TT_COMMUNITY_C4_STAGING_VIDEO_PLAYBACK: OK
slot: C4 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T141755Z
matrix_93_d_com_c4: 3 passed
matrix_93_d_com_primary_media_asset_id: 2 passed
playback: staging MP4 PASS
hls_cdn: pending
NOT: C1-C3/C5-C12 PASS · NOT community matrix GO · NOT Phase② GO · NOT Production CDN/HLS GO
```

**下一步（不在本报告范围）：** **C5** · `record-community-c5-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
