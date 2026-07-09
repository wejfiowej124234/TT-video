# TT-PHASE2-C5-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C5 单槽** staging 证据（多图 upload · Cache-Control · Feed/Profile/Explore 读路径 · **production CDN pending**）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c5-evidence.sh` → `TT_COMMUNITY_C5_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T14:32:34Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C5](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C4-STAGING-EVIDENCE](./TT-PHASE2-C4-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C5/`](../../evidence/GO_phase2_testnet_20260526/community/C5/)

---

## 0 · 诚实边界（必读）

| 本报告 **C5 PASS** | **不等于** |
|--------------------|------------|
| ② **C5 槽** · image IT + Fly staging 多图交付 E2E + 浏览器加载 | **C1–C4 / C6～C12** 任一槽 PASS |
| staging API uploads 路径 · `Cache-Control: public, max-age=86400, immutable` | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| Fly HTTPS 多图 Feed / Profile / Explore / 详情读路径 | **③** 生产 CDN edge · R2/CloudFront GO |
| Playwright 同源图片 `naturalWidth>0` + cache-control 探针 | **C4** HLS/MP4 · **C7** 93 全站矩阵 GO |

**可宣称：** **② C5 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production CDN GO

**交付路径说明（②）：** 图片经 Fly API **`/api/v1/uploads/community-posts/*`** 公开读（非生产 CDN edge）；浏览器 E2E 经本地 Next **同源代理**加载 staging URL。

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C5 槽）** | **是** · `TT_COMMUNITY_C5_EVIDENCE: OK` | **②** |
| **Image delivery IT** | **是** · `matrix_93_d_com_c5_*` **3 passed** | **① 代码 / ② 对拍** |
| **Staging image delivery API E2E** | **是** · `TT_COMMUNITY_C5_STAGING_IMAGE_DELIVERY: OK` | **②** |
| **Staging multi-image browser E2E** | **是** · Playwright + `browser-c5-image-summary.md` | **②** |
| **Fly API** | **是** · `https://tt-api-staging.fly.dev` | **②** |
| **Production CDN edge** | **否** · `production_cdn: pending` | **③** |

**一句话结论：** **C5 单槽在 Fly staging 真环境已 PASS**（多图 upload · Cache-Control · 读路径 + 浏览器渲染）；**生产 CDN edge 留 ③**；其余槽与 Phase ② 全矩阵 **未在本报告宣称**。

---

## 2 · 清单表（C5 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **IT · Cache-Control immutable** | `matrix_93_d_com_c5_serve_upload_cache_control_immutable_pg` | ✅ PASS | — |
| 2 | **IT · 多图 Feed/Profile/Explore** | `matrix_93_d_com_c5_multi_image_feed_profile_explore_read_pg` | ✅ PASS | — |
| 3 | **IT · C2 fake mime 仍拦截** | `matrix_93_d_com_c5_c2_fake_mime_still_blocked_pg` | ✅ PASS | — |
| 4 | **PNG upload + GET 200** | 双图 upload-media · 公开 GET | ✅ PASS | — |
| 5 | **Cache-Control 策略** | `immutable` + `max-age=86400` | ✅ PASS | — |
| 6 | **多图帖 · cover + media_urls** | Feed / recommend / me/posts / profile / detail | ✅ PASS | — |
| 7 | **C2 门闸持续** | fake mime · oversized | ✅ PASS | — |
| 8 | **浏览器多图加载 E2E** | feed+recommend tag 过滤 · 2 图 naturalWidth>0 | ✅ PASS | — |
| 9 | **Production CDN edge** | 无 edge Cache-Control / 全球 CDN GO | ❌ 未完成 | **③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C5/run-20260605T143234Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C5/run-20260605T143234Z.log) |
| Image delivery IT | [`evidence/…/C5/image-it-20260605T143234Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C5/image-it-20260605T143234Z.log) |
| Staging image E2E | [`evidence/…/C5/staging-image-e2e-20260605T143234Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C5/staging-image-e2e-20260605T143234Z.log) |
| 浏览器摘要 | [`evidence/…/C5/browser-c5-image-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C5/browser-c5-image-summary.md) |
| 多图截图 | [`evidence/…/C5/browser-c5-feed-multi-image.png`](../../evidence/GO_phase2_testnet_20260526/community/C5/browser-c5-feed-multi-image.png) |
| STATUS | [`evidence/…/C5/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C5/STATUS.txt) |

**本 run 样例锚点（可 grep）：** `post_id=d2eab794-1d34-4a4a-8f72-e4a0c0c07ba2` · `topic_tag=c5-img-1780669955`

---

## 4 · 复跑命令（仅 C5 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c5-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C5_STAGING_IMAGE_DELIVERY: OK` · `TT_COMMUNITY_C5_EVIDENCE: OK`

**Fly staging 前置：** `TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1` · `TRAVELTRUST_EMAIL_TRANSPORT=log` · `TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1` · 前端 `NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0`（脚本会 patch `.env.local`）。

---

## 5 · 机读结论

```
TT_PHASE2_C5_STAGING_VERDICT: PASS
TT_COMMUNITY_C5_EVIDENCE: OK
TT_COMMUNITY_C5_STAGING_IMAGE_DELIVERY: OK
slot: C5 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T143234Z
matrix_93_d_com_c5: 3 passed
image_delivery: staging PASS
production_cdn: pending
NOT: C1-C4/C6-C12 PASS · NOT community matrix GO · NOT Phase② GO · NOT Production CDN GO
```

**下一步（不在本报告范围）：** **C6** · `record-community-c6-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
