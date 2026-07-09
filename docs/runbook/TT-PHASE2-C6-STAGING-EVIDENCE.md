# TT-PHASE2-C6-STAGING-EVIDENCE

**阶段口径：** **① 本地 → ② 测试网 / staging → ③ 公网/生产**（须顺序；禁止跳阶）

**文档类型：** Phase ② · **C6 单槽** staging 证据（社交图 · 关注/粉丝 · 私信 · likes_received · 浏览器回访路径）

**机读入口：** `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c6-evidence.sh` → `TT_COMMUNITY_C6_EVIDENCE: OK`

**验收执行时间（UTC）：** 2026-06-05T14:41:04Z

**Fly 账号（运维）：** `github3344@hotmail.com` · App **`tt-api-staging`**

**互指：** [COMMUNITY-PHASE-2-3-ROADMAP §C6](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [TT-PHASE2-C5-STAGING-EVIDENCE](./TT-PHASE2-C5-STAGING-EVIDENCE.md) · [`evidence/GO_phase2_testnet_20260526/community/C6/`](../../evidence/GO_phase2_testnet_20260526/community/C6/)

---

## 0 · 诚实边界（必读）

| 本报告 **C6 PASS** | **不等于** |
|--------------------|------------|
| ② **C6 槽** · social IT + Fly staging 社交 API E2E + 浏览器回访 | **C1–C5 / C7～C12** 任一槽 PASS |
| 关注/粉丝/私信/unread/read/likes_received staging 闭环 | **Phase ② GO** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** |
| Playwright friends · DM · activity · profile · explore 壳 | **③** 生产级互动通知全量（COM-②-6 等） |
| staging 注册（验证码 dev code） | **C10** 宽路径 critical journey GO |

**可宣称：** **② C6 槽 PASS**（staging · Fly · 2026-06-05）  
**不可宣称：** 社区 C1–C12 矩阵 GO · Phase ② GO · Production GO

---

## 1 · 总表

| 项 | 结论 | 阶段 |
|----|------|------|
| **有没有收口（C6 槽）** | **是** · `TT_COMMUNITY_C6_EVIDENCE: OK` | **②** |
| **Social graph IT** | **是** · `matrix_93_d_com_c6_*` **3 passed** | **① 代码 / ② 对拍** |
| **Staging social API E2E** | **是** · `TT_COMMUNITY_C6_STAGING_SOCIAL_GRAPH: OK` | **②** |
| **Staging social browser E2E** | **是** · Playwright + `browser-c6-social-summary.md` | **②** |
| **Fly API** | **是** · `https://tt-api-staging.fly.dev` | **②** |

**一句话结论：** **C6 单槽在 Fly staging 真环境已 PASS**（社交图 API + 浏览器回访）；其余槽与 Phase ② 全矩阵 **未在本报告宣称**。

---

## 2 · 清单表（C6 验收项）

| # | 清单项 | 探针 / 断言 | 状态 | 未完成应在哪阶 |
|---|--------|-------------|------|----------------|
| 1 | **IT · follow/following/followers/feed** | `matrix_93_d_com_c6_follow_followers_following_feed_profile_pg` | ✅ PASS | — |
| 2 | **IT · DM unread/read** | `matrix_93_d_com_c6_dm_conversation_unread_read_state_pg` | ✅ PASS | — |
| 3 | **IT · like → likes_received** | `matrix_93_d_com_c6_like_notification_likes_received_pg` | ✅ PASS | — |
| 4 | **A 关注 B** | `POST …/users/{id}/follow` · following/followers 列表 | ✅ PASS | — |
| 5 | **Follow feed + author_followed_by_me** | mode=follow feed · post detail | ✅ PASS | — |
| 6 | **Profile posts** | `GET …/users/{id}/posts` | ✅ PASS | — |
| 7 | **私信 ensure → send → unread → read 清零** | conversations + messages | ✅ PASS | — |
| 8 | **likes_received 递增** | like 后 author `me/likes-received` | ✅ PASS | — |
| 9 | **浏览器回访** | friends/following · DM thread · activity · user profile · explore | ✅ PASS | — |
| 10 | **COM-②-6 互动逐条通知 API** | placeholder → 正式 notifications API | ❌ 未完成 | **② 增量 / ③** |

---

## 3 · 证据文件

| 产物 | 路径 |
|------|------|
| 运行总日志 | [`evidence/…/C6/run-20260605T144104Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C6/run-20260605T144104Z.log) |
| Social graph IT | [`evidence/…/C6/social-it-20260605T144104Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C6/social-it-20260605T144104Z.log) |
| Staging social E2E | [`evidence/…/C6/staging-social-e2e-20260605T144104Z.log`](../../evidence/GO_phase2_testnet_20260526/community/C6/staging-social-e2e-20260605T144104Z.log) |
| 浏览器摘要 | [`evidence/…/C6/browser-c6-social-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C6/browser-c6-social-summary.md) |
| Explore 截图 | [`evidence/…/C6/browser-c6-explore-discovery.png`](../../evidence/GO_phase2_testnet_20260526/community/C6/browser-c6-explore-discovery.png) |
| STATUS | [`evidence/…/C6/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C6/STATUS.txt) |

**本 run 样例锚点（可 grep）：** `post_id=cd7a82eb-96ea-4335-8630-098378df8bdf` · `conversation_id=ed43a641-ceca-4ac9-b4ed-262843b0a0df` · `dm_marker=c6-dm-1780670465`

---

## 4 · 复跑命令（仅 C6 · ②）

```bash
export HTTP_PROXY=http://127.0.0.1:15715
export HTTPS_PROXY=http://127.0.0.1:15715
export ALL_PROXY=socks5://127.0.0.1:15715
export NO_PROXY=tt-api-staging.fly.dev,localhost,127.0.0.1

STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c6-evidence.sh
```

**期望末行：** `TT_COMMUNITY_C6_STAGING_SOCIAL_GRAPH: OK` · `TT_COMMUNITY_C6_EVIDENCE: OK`

**Fly staging 前置：** `TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1` · `TRAVELTRUST_EMAIL_TRANSPORT=log` · `TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1` · 前端 `NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0`（脚本会 patch `.env.local`）。

---

## 5 · 机读结论

```
TT_PHASE2_C6_STAGING_VERDICT: PASS
TT_COMMUNITY_C6_EVIDENCE: OK
TT_COMMUNITY_C6_STAGING_SOCIAL_GRAPH: OK
slot: C6 only
api_base: https://tt-api-staging.fly.dev
stamp_utc: 20260605T144104Z
matrix_93_d_com_c6: 3 passed
NOT: C1-C5/C7-C12 PASS · NOT community matrix GO · NOT Phase② GO · NOT Production GO
```

**下一步（不在本报告范围）：** **C7** · `record-community-c7-evidence.sh` — 单槽验收，禁止跳阶宣称全矩阵 GO。
