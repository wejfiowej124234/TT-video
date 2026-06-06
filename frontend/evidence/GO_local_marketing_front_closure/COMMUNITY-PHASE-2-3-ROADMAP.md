# TT 社区 · Phase ② 测试网 / Phase ③ 公网生产 · 路线图

**Community ② 矩阵 Closure（2026-06-06）：** **C1–C12 ALL PASS · 矩阵 GO** — [TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION](../../../docs/runbook/TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) · **`TT_PHASE2_COMMUNITY_MATRIX_VERDICT: GO`** · **停止新增 Community 功能开发**（仅 bugfix · 证据复跑 · Closing Gap 数据链依赖）。全站宽轨 → **[PHASE2-CLOSING-GAP.md](../../../docs/runbook/PHASE2-CLOSING-GAP.md)** · **`TT_PHASE2_GO_VERDICT: NOT_MET`** → 目标 **`PHASE2_GO_READY`**。

**阶段纪律：** 本文 **②③** 项 **须 G-1/G-2 清闸后** 方可 **实施** 与 **GO 宣称**；**禁止** 用 **①** 本地 vitest / PI-1 E2E / MinIO 证据冒充 **②③** 已验收。总态：[PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) · 宽 ② 验收：[PHASE2-TESTNET-ACCEPTANCE](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · **① 收口**：[COMMUNITY-L5-CLOSURE.md](./COMMUNITY-L5-CLOSURE.md)。

**UI 边界：** 五主路由 **壳层已冻结** — **②③** 仅 **数据链路**、**API**、**对象存储/CDN**、**E2E 证据**；**禁止** Feed 页结构 / L1 Tab / 暖场 layout 回流（[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)）。

---

## ① 本地（2026-05-31 · 社区切片 100% · 维护期）

| ID | 项 | ① 状态 | 验收 / 证据 |
|----|-----|--------|-------------|
| P0 | PublishDrawer 发帖链 · multipart | **已闭** | `e2e:pi1-community-all` **8 passed** · `e2e-pi1-community-all.latest.log` |
| P1-3～P1-6 | 目的地 / food·travel / 裁切 / capabilities | **已闭** | vitest **82 passed** · `vitest-community-l5.latest.log` |
| TD-1～TD-2 | API client / routes 同步 | **已闭** | `community.posts.crudAndMedia.test.ts` |
| TD-3 | MinIO 浏览器 multipart 证据 | **已闭** | `run-community-publishdrawer-browser-evidence.sh` **3 passed** · `e2e-publishdrawer-minio.latest.log` |
| PH1-FE-05 | `/community/me` 本机头像 | **已闭** | PI-1 E2E |
| **§七 P1/P2/P3** | 窄 E2E 13 用例 | **已闭** | `e2e:community-phase1-narrow` **13 passed** |
| **§二 2.2** | `e2e:community-l5-all` | **已闭** | **42 passed** · `e2e-l5-all.latest.log` |
| **G-08** | 全仓 Phase① acceptance | **已闭** | `GO_local_phase1/acceptance.latest.log` **`TT_GO_LOCAL_PHASE1: OK`** · `recorded=20260531T074458Z` |

**① 可选增强（非 GO 键 · 不阻塞 ② 开工）：** POI 搜索目的地 · 交互式裁切 · `lib/apiClient/community.ts` 单体拆分。

---

## Phase ② · 31 §15.2 C1～C12（C1–C12 **ALL PASS** · Closing Review · **非 Phase ② GO**）

**开工闸：** [PHASE2-READY-REPORT](../../../docs/runbook/PHASE2-READY-REPORT.md) **`TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12`**（`20260531T085525Z` · `bootstrap-phase2-g1-g2.sh` · **T9 PASS**）。**≠** C2～C12 **GO** · **≠** Phase ② 全矩阵 **GO**。证据 [`transition-audit/latest/`](../../../evidence/GO_phase2_testnet_20260526/transition-audit/latest/) · [`g2-staging-migrate/latest/`](../../../evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/)。

**证据槽索引：** [`community/README.md`](../../../evidence/GO_phase2_testnet_20260526/community/README.md)（**12/12 PASS · 矩阵 GO** · [Final Attestation](../../../docs/runbook/TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) · [`CLOSING-REVIEW.md`](../../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) · **≠ Phase ② 宽轨 GO**）。

**禁止跳阶：** 下表 **② GO** 列 **不得** 用 ① `e2e:community-l5-all` / PI-1 / MinIO 证据勾选。

| ID | ② 通过标准 | ① 已做 | 态 | ② 验收命令 | 证据路径 | 结果 | 可宣称 |
|----|------------|--------|-----|------------|----------|------|--------|
| **C1** | Feed ≥20 真帖 + 04 行 | PI-1 / 窄 API | **PASS** | `API_BASE=<staging HTTPS> bash scripts/dev/record-community-c1-seed-evidence.sh` | [`evidence/GO_phase2_testnet_20260526/community/C1/`](../../../evidence/GO_phase2_testnet_20260526/community/C1/) | `20260605T123651Z` · feed **22** · automation_leak **0** · authors **6** · destinations **14** · media **20** | **② C1 only** |
| **C2** | MIME+魔数+体限+路径 · Feed 隔离 | 部分 ① | **PASS** | `bash scripts/dev/record-community-c2-evidence.sh` | [`…/C2/`](../../../evidence/GO_phase2_testnet_20260526/community/C2/) | `20260605T125440Z` · **`matrix_93_d_com_c2_*` 11 passed** · staging upload E2E exit 0 | **② C2 only** |
| **C3** | 举报→审核→下架 | 举报 POST ① | **PASS** | `bash scripts/dev/record-community-c3-evidence.sh` | [`…/C3/`](../../../evidence/GO_phase2_testnet_20260526/community/C3/) | `20260605T125712Z` · **`matrix_93_d_com_c3_*` 2 passed** · staging moderation E2E exit 0 | **② C3 only** |
| **C4** | HLS/MP4 + CDN | MinIO ① **3 passed** | **PASS** | `bash scripts/dev/record-community-c4-evidence.sh` | [`…/C4/`](../../../evidence/GO_phase2_testnet_20260526/community/C4/) | `20260605T141755Z` · **`matrix_93_d_com_c4_*` 3** · staging MP4 + Feed **canplay** · **HLS-CDN pending** | **② C4 only** · **≠** 生产 CDN/HLS GO |
| **C5** | 多图 CDN / 图片交付 | upload-media ① | **PASS** | `bash scripts/dev/record-community-c5-evidence.sh` | [`…/C5/`](../../../evidence/GO_phase2_testnet_20260526/community/C5/) | `20260605T143234Z` · **`matrix_93_d_com_c5_*` 3** · staging image delivery + browser load · **production CDN pending** | **② C5 only** · **≠** Production CDN GO |
| **C6** | 社交图与互动（关注/粉丝/私信/通知） | social-flow ① | **PASS** | `bash scripts/dev/record-community-c6-evidence.sh` | [`…/C6/`](../../../evidence/GO_phase2_testnet_20260526/community/C6/) | `20260605T144104Z` · **`matrix_93_d_com_c6_*` 3** · staging social API + browser revisit · likes_received + DM unread | **② C6 only** · **≠** Phase ② GO |
| **C7** | 93 矩阵 staging | 窄切片 ① | **PASS** | `bash scripts/dev/record-community-c7-evidence.sh` | [`…/C7/`](../../../evidence/GO_phase2_testnet_20260526/community/C7/) | `20260605T144841Z` · **`report.json` GO** · C1–C6 mapped · spot-check IT · **≠** full-site 93 GO | **② C7 only** · **≠** Phase ② GO |
| **C8** | Runbook/监控 | — | **PASS** | `bash scripts/dev/record-community-c8-evidence.sh` | [`…/C8/`](../../../evidence/GO_phase2_testnet_20260526/community/C8/) | `20260605T145342Z` · runbook + monitoring smoke exit 0 | **② C8 only** |
| **C9** | Shell Token | 壳冻结 ① | **PASS** | `bash scripts/dev/record-community-c9-evidence.sh` | [`…/C9/`](../../../evidence/GO_phase2_testnet_20260526/community/C9/) | `20260605T151358Z` · visual-review + 9 screenshots · shell vitest exit 0 | **② C9 only** |
| **C10** | 宽路径社交 | narrow 13 ① | **PASS** | `bash scripts/dev/record-community-c10-evidence.sh` | [`…/C10/`](../../../evidence/GO_phase2_testnet_20260526/community/C10/) | `20260605T235244Z` · critical journey API + browser E2E · 11 screenshots · [`journey-summary.md`](../../../evidence/GO_phase2_testnet_20260526/community/C10/journey-summary.md) · [`TT-PHASE2-C10-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C10-STAGING-EVIDENCE.md) | **② C10 only** |
| **C11** | 04 闸 | ① transition **T3 PASS** | **PASS** | `bash scripts/dev/record-community-c11-evidence.sh` | [`…/C11/`](../../../evidence/GO_phase2_testnet_20260526/community/C11/) | `20260606T001039Z` · route-gate-report.json · 24 API + 18 browser routes · [`TT-PHASE2-C11-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C11-STAGING-EVIDENCE.md) | **② C11 only** |
| **C12** | did-rank 互链 | — | **PASS** | `bash scripts/dev/record-community-c12-evidence.sh` | [`…/C12/`](../../../evidence/GO_phase2_testnet_20260526/community/C12/) | `20260606T001931Z` · did-interlink-summary.md · 8 screenshots · API/IT + browser E2E exit 0 · [`TT-PHASE2-C12-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C12-STAGING-EVIDENCE.md) | **② C12 only** · **≠** Phase ② GO |

---

## Phase ② 测试网 / Staging（C1–C12 **ALL PASS** · Closing Review · **非 Phase ② GO**）

**前置：** [PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · staging **`API_BASE`** + **`traveltrust_staging`** migrate · 对象存储 **staging 桶** + CORS（[COMMUNITY-MEDIA-OBJECT-STORAGE.md](../../../docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md)）。

| ID | 项 | 规格锚 | ② 验收命令 / 证据 |
|----|-----|--------|-------------------|
| **P2-1b** | 多图 CDN / 图片 Cache-Control / 公开读路径 | 31 §15.2 **C5** | staging image delivery **PASS**（**C5 PASS**）· **production CDN edge pending** · `record-community-c5-evidence.sh` · `e2e/community-c5-staging-image-delivery.spec.ts` |
| **P2-1** | Feed 真播放器 / CDN 视频 / HLS 预留 | 31 §15.2 **C4** | staging MP4 **canplay**（**C4 PASS**）· **HLS/manifest 仍 pending** · `record-community-c4-evidence.sh` · `e2e/community-c4-staging-video-playback.spec.ts` |
| **P2-2** | staging UGC 密度 · API 对拍 | **C1/C11** | Feed ≥20 真帖 seed · **C11** 04 路由闸 staging 对拍 **PASS** · `record-community-c11-evidence.sh` |
| **P2-3** | 审核队列 / guidelines 法务链 | **C3** | Admin 社区 moderation · 举报→工单 E2E |
| **P2-4** | 私信/好友/社交图浏览器 E2E | **C6/C10** | staging social graph **PASS**（**C6 PASS**）· critical user journey **PASS**（**C10 PASS**）· `record-community-c10-evidence.sh` · `e2e/community-c10-staging-critical-journey.spec.ts` |
| **P2-5** | 93 矩阵社区 D 域 staging | **C7** | **`report.json` `environment.name=staging` + `release_gate=GO`**（社区 D 域 · C1–C6 映射 · **≠** ISS-007 窄切片 · **≠** 全站 GO）· `record-community-c7-evidence.sh` |
| **P2-6** | Shell 哑光 vs Feed cyan 点缀 | **88 P2** | 视觉对拍（**数据链阶段不回流 layout**） |
| **COM-②-1** | 对象存储 multipart 全链 | Runbook §staging | `docs/runbook/community-publishdrawer-staging-evidence.md` · HAR + createPost |
| **COM-②-2** | `primary_media_asset_id` 读路径 | 04 · A1 | staging PG IT / feed JSON 字段 |
| **COM-②-3** | ISS-008 社区媒体 S3 | 95 §9 | staging presign→complete→Feed 播放 |
| **COM-②-4** | **staging 真实 UGC 评论持久化复验**（① 2026-06 审计 · 非演示帖） | 31 §六 · **C10 增量** | staging 登录用户对 **UUID 真帖** `POST …/comments` → 刷新仍在 · 列表含 **API 头像/昵称**（`communityCommentAuthor*`）· **禁** 用 `tt-showcase-*` 本机乐观冒充 **②** |
| **COM-②-5** | **PostDetail/Feed 抽屉交互 staging E2E**（① 已修项复验） | 31 §六 · **C10/C11 增量** | 新建/扩展 staging spec：`PostDetail` composer **双门闸** · 发评后 **头像+作者名** · 全帖 **↑↓/滚轮** 切帖 · 桌面 **帮助与支持** portal · 命令：`e2e/community-feed-drawer-interaction-staging.spec.ts`（待建）· **≠** `smoke-community-feed-drawer-local.sh`（**①**） |
| **COM-②-6** | **互动逐条通知 API**（评/@/关注 · 已读） | 31 §5 P3 · **C6 增量** | 替换 **`CommunityInteractionSummary`** placeholder · `GET …/me/notifications`（或等价）· `/community/messages?tab=activity` staging 烟测 |
| **COM-②-7** | **C9 视觉签字复跑**（L5 对比度 · 2026-06 ① token） | **C9 增量** | badge/关注 pill/评论作者行/Masonry 演示角标 · Founder Review + 截图 · `record-community-c9-evidence.sh` 复跑 |
| **COM-②-8** | **staging 视频发布 + CDN 读路径**（MinIO **≠** staging） | **COM-②-1** · **P2-1** · **C4** | `COMMUNITY_MEDIA_S3_*` 就绪 · PublishDrawer multipart → Feed **canplay** · **HLS manifest 仍 pending**（归 **P2-1** / Closing **G7**） |

**② 增量 backlog（2026-06 · ① 社区审计收口后）：** **COM-②-4～COM-②-8** = **OPEN / 待验** — **不** 推翻 C1–C12 **PASS** 历史证据；属 **bugfix 复验** · **后端缺口** · **staging E2E 补洞**。**① 演示帖**（`tt-showcase-*`）评论/赞 **不** 作为 **②** 验收路径（staging 以 **C1 真帖** 为准）。

**② 证据根：** [`evidence/GO_phase2_testnet_20260526/community/`](../../../evidence/GO_phase2_testnet_20260526/community/README.md)（**C1–C12 PASS** · [`CLOSING-REVIEW.md`](../../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) · **≠ Phase ② GO** · 宽轨阻塞见 [`BLOCKERS.md`](../../../evidence/GO_phase2_testnet_20260526/community/BLOCKERS.md)）。

**禁止假完成：** `bash scripts/gates/local-e2e-chromium-full-matrix.sh` = **①**；`npm run e2e:pi1-community-all` = **①**；MinIO Docker 证据 = **①** — **均 ≠** staging **GO**。

---

## Phase ③ 公网 / 生产（另闸 · NOT STARTED）

**证据槽索引：** [`evidence/GO_production/community/README.md`](../../../evidence/GO_production/community/README.md)（各 `P3-COM-*/STATUS.txt` = NOT_STARTED）。

**前置：** Production GO 决策 · [go-live-checklist · GO Decision](../../../docs/go-live-checklist.md#go-decision-entry-point) · 生产 PSP / CDN / 主网（若在 scope）**独立签字**。

| ID | 项 | 态 | ③ 验收命令 | 证据路径 | 结果 | 可宣称 |
|----|-----|-----|------------|----------|------|--------|
| **P3-COM-1** | 生产 CDN / HLS | **NOT STARTED** | 生产 Feed **canplay** · CDN 头 | [`evidence/GO_production/community/P3-COM-1/`](../../../evidence/GO_production/community/P3-COM-1/) | — | **③** |
| **P3-COM-2** | 生产桶 / WAF | **NOT STARTED** | 桶策略 · 无 MinIO 直出 | [`…/P3-COM-2/`](../../../evidence/GO_production/community/P3-COM-2/) | — | **③** |
| **P3-COM-3** | UGC 审核法务 | **NOT STARTED** | 生产 moderation | [`…/P3-COM-3/`](../../../evidence/GO_production/community/P3-COM-3/) | — | **③** |
| **P3-COM-4** | 93 生产矩阵 | **NOT STARTED** | `report.json` production GO | [`…/P3-COM-4/`](../../../evidence/GO_production/community/P3-COM-4/) | — | **③** |
| **P3-COM-5** | 容量 / 滥用 | **NOT STARTED** | 限速 · 生命周期 | [`…/P3-COM-5/`](../../../evidence/GO_production/community/P3-COM-5/) | — | **③** |
| **P3-COM-6** | CSP media-src | **NOT STARTED** | 07 §5.6A 生产 CSP | [`…/P3-COM-6/`](../../../evidence/GO_production/community/P3-COM-6/) | — | **③** |

**③ 不在 Phase ② 验收文完成标准内** — 见 [PHASE2-TESTNET-ACCEPTANCE §6](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) 互指模式（对标 PD-009 §8.3）。

---

## 互指

| 读者 | 文档 |
|------|------|
| ① 收口与命令 | [COMMUNITY-L5-CLOSURE.md](./COMMUNITY-L5-CLOSURE.md) |
| **② 增量 backlog（2026-06）** | 本文 **COM-②-4～COM-②-8**（**OPEN** · 不推翻 C1–C12 PASS） |
| MinIO / S3 Runbook | [COMMUNITY-MEDIA-OBJECT-STORAGE.md](../../../docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md) |
| staging 浏览器证据 | [community-publishdrawer-staging-evidence.md](../../../docs/runbook/community-publishdrawer-staging-evidence.md) |
| 宽 ② 六轨 + 社区轨 7 | [PHASE2-TESTNET-ACCEPTANCE §7](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) |
| 覆盖边界 | [TT-9628 · coverage boundary](../../../docs/runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) |
