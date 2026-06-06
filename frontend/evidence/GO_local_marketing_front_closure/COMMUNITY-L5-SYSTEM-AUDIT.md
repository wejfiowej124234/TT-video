# TT 社区 · 系统级 L5 审计（Phase ① · 2026-05-31 · 全量复审）

**阶段口径：① 本地** — 对照 **MARKET-L5** 全收口基准、**FIVE-MAIN** 五主路由冻结、**31 §15.2** 社区矩阵；**不**宣称 **② 测试网 / ③ 生产** GO。

**关联 SSOT：** [COMMUNITY-L5-CLOSURE.md](./COMMUNITY-L5-CLOSURE.md) · [COMMUNITY-PHASE-2-3-ROADMAP.md](./COMMUNITY-PHASE-2-3-ROADMAP.md) · [FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [MARKET-L5-CLOSURE.md](./MARKET-L5-CLOSURE.md)

---

## 审计结论（Executive · ①）

| 维度 | 判定 |
|------|------|
| **五主壳 `/community` UI L5** | **冻结达标** — layout/token 不回流 |
| **发帖 / 评论 / 详情抽屉** | **① L5 子集已闭** — 暖 token + 本地上传 multipart |
| **社区资料 `/community/me`** | **① 达标** — 顶卡 file picker；折叠编辑区 **无 URL 框**；保存 **不 PATCH avatar_url**；资料卡 **暖 token 全面对齐** |
| **Feed 帖卡 media** | **① 已对齐** — 暖 token + 内联 video + **瀑布 masonry（推荐/关注）** + **DiscoveryChrome geo** |
| **PI-1 浏览器验收** | **8/8 passed**（2026-05-31 复跑） |
| **§二 2.2–2.5 + §七 窄 E2E** | **① 100%**（narrow 13 · l5-all 42 · PI-1 8 · vitest 82 · MinIO 3 · G-08 OK） |
| **18 路由机读锚点** | **① 已闭** — `communitySubRoutes` 22 · `e2e:community-subroutes-l5` 19 |
| **18 路由数据链 contract + E2E** | **① 已闭** — `communityRouteDataHooks` 12 · `e2e:community-subroutes-data` 7 |
| **friends/messages 业务 E2E** | **① 已闭** — `e2e:community-social-flow` 4 |
| **弹窗 G-03 交互 E2E** | **① 已闭** — `e2e:community-modals-interaction` 3 |
| **每弹窗 contract 全集（MARKET 级）** | **① G-03 已闭** — Report / Login / QuickLinks；Feedback 见 `communityFeedbackPage.contract` |
| **本地上传 vs URL paste** | **社区路径已无 paste-URL**（发帖/头像/反馈均 file） |
| **②③** | **Prepared / Not Started** — 证据槽 [`evidence/GO_phase2_testnet_20260526/community/`](../../../evidence/GO_phase2_testnet_20260526/community/README.md) · [`evidence/GO_production/community/`](../../../evidence/GO_production/community/README.md) |

---

## 路由 × L5 矩阵（18 页）

| 路由 | UI L5 | 上传 UX | 数据链 ① | contract/E2E |
|------|-------|---------|----------|--------------|
| `/community` Feed | ✓ 暖 token | PublishDrawer file | ✓ | shellTheme + drawerTheme + PI-1 |
| `/community/tt` | redirect | — | ✓ → `/community/explore` | `communitySubRoutes` redirect |
| `/community/explore` | ✓ 壳 | — | ✓ | **G-01 已闭** · data E2E |
| `/community/activity` | ✓ | — | ✓ | **G-01 已闭** · data E2E |
| `/community/friends` | ✓ | — | ✓ | **G-02 已闭** · subroutes E2E |
| `/community/messages` | ✓ | — | ✓ | **G-02 已闭** · subroutes E2E |
| `/community/messages/[id]` | ✓ | — | ✓ | **G-02 已闭**（DM send） |
| `/community/me` | ✓ 暖 token | 头像 file（**`/me/settings/profile`**） | ✓ redirect + 独立子页 | **G-01 已闭** · **`resolveCommunityMeHubRedirect`** · [`me/README`](../../app/community/me/README.md) |
| `/community/me/posts` | ✓ | — | ✓ | **G-01 已闭** · data E2E |
| `/community/me/collects` | ✓ | — | ✓ | **G-01 已闭** · data E2E |
| `/community/me/likes` | ✓ | — | ✓ | 独立页 · `communityMeLikesPage` · [COMMUNITY-ME-L5-FREEZE](../GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) |
| `/community/me/reports` | ✓ | — | ✓ | **G-01 已闭** · data E2E |
| `/community/me/reports/[id]` | ✓ | — | ✓ | subroutes marker E2E |
| `/community/post/[id]` | ✓ | — | ✓ | redirect E2E + PI-1 |
| `/community/user/[id]` | ✓ | — | ✓ | **G-01 已闭** · data E2E |
| `/community/topic/[tag]` | ✓ | — | ✓ | feed-alias subroutes E2E |
| `/community/feedback` | ✓ | 附件 file | ✓ | **G-01 已闭** · contract + data E2E |
| `/community/guidelines` | ✓ 静态 | — | redirect | contract redirect |

---

## 弹窗 / 抽屉 × L5 矩阵

| 组件 | UI L5 | 上传 | contract | E2E |
|------|-------|------|----------|-----|
| **PublishDrawer** | ✓ 暖 | file + S3 multipart | PublishDrawer + drawerTheme | PI-1 PH1-FE-02 |
| **PostDetailDrawer** | ✓ 暖 | — | drawerTheme | PI-1 |
| **CommentDrawer** | ✓ 暖 | — | drawerTheme | PI-1 |
| **CommunityReportDrawer** | ✓ 暖 | — | **G-03 已闭** | **G-03 交互 E2E 已闭** |
| **CommunityLoginModal** | ✓ 暖 | — | **G-03 已闭** + RTL | **G-03 交互 E2E 已闭** |
| **CommunityMeQuickLinksDrawer** | ✓ | — | **G-03 已闭** | **G-03 交互 E2E 已闭** |
| **CommunityVideoOverlayView** | ✓ | — | drawerTheme media | PI-1 |
| **Feedback 页内表单** | ✓ | file | **已闭** · `communityFeedbackPage.contract` | **G-01 data E2E 已闭** |

---

## 一、问题清单

| ID | 严重度 | 问题 | 状态 |
|----|--------|------|------|
| **Q-01** | P0 | `/community/me` 折叠编辑区头像 URL 文本框（截图痛点） | **已修** — file picker + hint |
| **Q-02** | P0 | `create_post` 忽略 `media_asset_id` | **已修** |
| **Q-03** | P1 | Feed duplicate React key | **已修** |
| **Q-04** | P1 | 头像错误文案引导 URL | **已修** |
| **Q-05** | P2 | Feed 卡 cyan 旧 token | **已修** |
| **Q-06** | P2 | RichViewport 死代码 | **已删** |
| **Q-07** | P2 | S3 rewrite 代理 vs MinIO 直连 | **① 设计决策** — 直连；勿接 `/tt-community-s3` rewrite（曾触发 `/community` 错误边界） |
| **Q-08** | P2 | `community.ts` API 单体 | **已修** — barrel |
| **Q-09** | P3 | 保存资料 PATCH avatar_url 覆盖本地上传 | **已修** |
| **Q-10** | P3 | `MeProfileSectionEditForm` 孤儿 | **已删** |
| **Q-11** | P3 | `CommunityMeAccountPanel` monolith 双轨 | **已修** |
| **Q-12** | P1 | PI-1 `media_url_invalid_scheme` 拦 MinIO http | **已修** — loopback 豁免 |
| **Q-13** | P2 | `/community/me` 资料卡仍用 cyan 壳 | **已修** — `TT_COMMUNITY_ME_PANEL_L5` |
| **Q-14** | P2 | **`/community/me` Hub 取消** vs L5 仍写 page 级 `data-tt-community-me-page` | **已修** — `communitySubRoutes` redirect · **me/README** · **[DID-RANK-COMMUNITY-L5-AUDIT-TASKS](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md)** |

---

## 二、缺口清单

| ID | 类别 | ① 状态 | ②③ |
|----|------|--------|-----|
| **G-01** | 全 18 路由 L5 contract + 登录态 data E2E | **① 已闭** — `communitySubRoutes` + `communityRouteDataHooks` + `e2e:community-subroutes-l5` + `e2e:community-subroutes-data` | 93 矩阵宽 E2E **②** |
| **G-02** | messages / friends 业务流 E2E | **① 已闭** — `e2e:community-social-flow` | explore/topic 宽矩阵 **②** |
| **G-03** | ReportDrawer / QuickLinks / LoginModal | **① 已闭** — contract + `e2e:community-modals-interaction` | staging 宽矩阵 **②** |
| **G-04** | POI 目的地 · 交互式封面裁切 | 静态下拉 / 中心裁切 | **②** |
| **G-05** | CDN / HLS / 审核队列 / 生产 CSP | — | **②③** |
| **G-06** | 资料编辑区 avatar URL 粘贴 | **① 已闭** — `MeProfileSection` 移除 `type="url"`；头像仅顶卡 file → `POST …/profile-avatar` | — |
| **G-07** | TD-3 MinIO browser evidence 脚本 | **已复跑** · **3 passed · exit 0**（2026-05-31） | **②** staging bucket |
| **G-08** | G-0 仓库级 Phase① acceptance log | **① 已闭**（2026-05-31 复跑） | `frontend/evidence/GO_local_phase1/acceptance.latest.log` · `TT_GO_LOCAL_PHASE1: OK` |
| **G-09** | Feed 发现 L5（DiscoveryChrome · masonry · geo enrich · ① 占位距离） | **① 已闭** — `communityFeedActionTheme` · `communityFeedDiscoveryQuickFilters` · `feed_geo` PG IT · `e2e/community-feed-discovery-geo.spec.ts` | **②** 真 POI/PostGIS |

---

## 三、优化清单（① · 已做 / 可选）

| ID | 项 | 状态 |
|----|-----|------|
| **O-01** | PublishDrawer 本地上传 + multipart | **已做** |
| **O-02** | 社区头像顶卡 file picker | **已做** |
| **O-03** | Feed 暖 token + dedup merge | **已做** |
| **O-04** | `primary_media_asset_id` 后端接线 | **已做** |
| **O-05** | PI-1 全链 E2E 8/8 | **已做** · 2026-05-31 |
| **O-06** | embedded URL 护栏 + loopback 豁免 | **已做** |
| **O-07** | MeProfileSection compact 暖 token | **已做** |
| **O-08** | `communityMeProfile.contract.test.ts` | **已做** |
| **O-09** | ProfileCard 去 monolith | **已做** |
| **O-10** | `TT_COMMUNITY_ME_PANEL_L5` 资料卡全页暖 token | **已做** · 2026-05-31 |
| **O-11** | 子路由 contract + E2E 锚点 | **已做** · 2026-05-31 |
| **O-14** | G-03 弹窗 contract + `data-tt` 锚点 | **已做** · 2026-05-31 |
| **O-15** | G-02 friends/messages 业务 E2E + 私信 `myId` bugfix | **已做** · 2026-05-31 |
| **O-16** | G-06 资料编辑区移除 avatar URL 粘贴 | **已做** · 2026-05-31 |
| **O-17** | G-01 数据链 contract + subroutes-data / modals-interaction E2E | **已做** · 2026-05-31 |

---

## 四、升级清单（②③ · 禁止跳阶 GO）

详见 [COMMUNITY-PHASE-2-3-ROADMAP.md](./COMMUNITY-PHASE-2-3-ROADMAP.md)。

| ID | 项 | 阶段 |
|----|-----|------|
| **U-01** | staging multipart + CDN 签名 URL | **②** |
| **U-02** | UGC 密度 / 审核 / 举报 SLA | **②** |
| **U-03** | DM / friends / explore 宽矩阵 E2E | **②** |
| **U-04** | ISS-008 社区 93 域矩阵 | **②** |
| **U-05** | 生产 WAF / CSP / 滥用防护 | **③** |
| **U-06** | HLS 转码 / 封面交互裁切 | **②③** |

---

## 五、媒体上传 UX（截图对照 · 行业标准）

| 场景 | 旧 UX | 现 UX ① | 最佳实践对照 |
|------|-------|---------|--------------|
| **发帖配图/视频** | — | file picker → presign → multipart S3 | ✓ 与 Instagram/小红书同级 |
| **社区头像** | 折叠区 **粘贴 URL** | 顶卡 **+** file → `POST …/profile-avatar` | ✓ 本地上传 |
| **反馈附件** | — | file | ✓ |
| **全局 `/me` 编辑区** | 曾有 URL 字段 | **已移除** — 与社区同源 hint + 顶卡上传 | ✓ |

**若仍见 URL 框：** 确认在 **`/community/me`** 而非 **`/me`**，并 **硬刷新**（Ctrl+Shift+R）。

---

## 六、① 验收命令

```bash
cd frontend && npx vitest run app/community/communitySubRoutes.contract.test.ts
cd frontend && npx vitest run app/community/communityRouteDataHooks.contract.test.ts

npm run e2e:community-subroutes-l5
npm run e2e:community-subroutes-data
npm run e2e:community-modals-interaction
npm run e2e:community-social-flow
npm run e2e:community-l5-all   # 并集

cd frontend && npx vitest run \
  components/community/communityShellTheme.contract.test.ts \
  components/community/communityDrawerTheme.contract.test.ts \
  components/community/PublishDrawer \
  components/me/communityMeProfile.contract.test.ts \
  components/community/mergeCommunityFeedLocalAndApiPosts.test.ts \
  lib/communityPostTagsPayload.test.ts

PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all
cargo test -p traveltrust-api
```

---

## 七、与 MARKET-L5 差距摘要

| MARKET 有 · 社区暂无 | 优先级 |
|---------------------|--------|
| 每路由 `*.contract.test.ts` | ① 可选 / ② 必补 |
| 筛选带 freeze 机读锚 | 社区 Feed 已有 shellTheme |
| 宽矩阵 staging E2E | **②** |
| Hub 子域独立 freeze 文档 | acquisition 有；社区 me 有 profile contract |

**① 可宣称：** 社区 **18 路由 + 核心弹窗 + friends/messages 业务流** **L5 ① 已闭**（contract + 窄 E2E）；**非** 93 域全矩阵 / staging **②** GO。

---

## 八、§七 第 3 步 · P1/P2/P3 窄 E2E（2026-05-31）

**证据根：** [`frontend/evidence/GO_local_community_phase1_narrow/README.md`](../GO_local_community_phase1_narrow/README.md) · **`e2e-narrow.latest.log`**

| ID | 项 | 实现 | 验收命令 | ① 可宣称 |
|----|-----|------|----------|----------|
| **COM-P1-01** | 帖举报 submit → me/reports | `e2e/community-phase1-narrow-flows.spec.ts` | `npm run e2e:community-phase1-narrow` | **已闭** · `e2e-narrow.latest.log` **13 passed** |
| **COM-P1-02** | reports/[id] 详情 | 同上 | 同上 | **已闭** |
| **COM-P1-03** | 活动中心 · 仅 likes-received | 同上 + 代码注释口径 | 同上 | **已闭**（无 notifications API） |
| **COM-P2-01** | me/posts 删帖 | 同上 | 同上 | **已闭** |
| **COM-P2-02** | /community/me 昵称 PATCH | 同上 | 同上 | **已闭** |
| **COM-P2-03** | user 页 follow | 同上 + `page.tsx` following 竞态修复 | 同上 | **已闭** |
| **COM-P2-04** | feedback submit | 同上 | 同上 | **已闭** |
| **COM-P3-01** | topic `tag=` feed | 同上 | 同上 | **已闭** |
| **COM-P3-02** | 评论抽屉发帖可见 | 同上 · PostDetailDrawer composer | 同上 | **已闭** |
| **COM-P3-03** | guidelines → terms marker | 同上 · `data-tt-terms-community-guidelines-page` | 同上 | **已闭** |
| **COM-P3-04** | 好友申请 accept | 同上 · `POST …/friends/accept` | 同上 | **已闭** |
| **3.9.3** | 私信 `myId` / hook 接线 | `useCommunityAuth` · messages 页 | vitest + `e2e:community-l5-all` | **已闭** |

**§二 2.2–2.5 并集（2026-05-31 · ①）：**

| 段 | 命令 | 证据 | 结果 |
|----|------|------|------|
| 2.2 | `npm run e2e:community-l5-all` | `GO_local_community_phase1_narrow/e2e-l5-all.latest.log` | **42 passed · exit 0** |
| 2.3 | `npm run e2e:pi1-community-all` | `…/e2e-pi1-community-all.latest.log` | **8 passed · exit 0** |
| 2.4 | `bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh` | `…/e2e-publishdrawer-minio.latest.log` · `evidence/community-media-local-minio-chain/out/` | **3 passed · exit 0** |
| 2.5 | vitest 社区 L5 最小集 | `…/vitest-community-l5.latest.log` | **82 passed · exit 0** |

**合法宣称：** 上表 **①** 本地 exit 0；**不得** 用于 **② staging GO** / **③ Production GO**。

---

## 九、31 §15.2 C1～C12 · ② 测试网（C1–C12 **ALL PASS** · Closing Review · **非 Phase ② GO**）

**规格：** **31-TT社区 §15.2** · **真源表：** [COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md#phase-②-31-§152-c1c12) · **C1 证据：** [`community/C1/STATUS.txt`](../../../evidence/GO_phase2_testnet_20260526/community/C1/STATUS.txt) · **C2 证据：** [`community/C2/STATUS.txt`](../../../evidence/GO_phase2_testnet_20260526/community/C2/STATUS.txt) · **C3 证据：** [`community/C3/STATUS.txt`](../../../evidence/GO_phase2_testnet_20260526/community/C3/STATUS.txt) · **C4 证据：** [`community/C4/STATUS.txt`](../../../evidence/GO_phase2_testnet_20260526/community/C4/STATUS.txt) · [`transition-audit/latest/`](../../../evidence/GO_phase2_testnet_20260526/transition-audit/latest/) · [`g2-staging-migrate/latest/`](../../../evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/) · **API 稳定性（非 ①）：** [PHASE2-API-PROCESS-STABILITY](../../../docs/runbook/PHASE2-API-PROCESS-STABILITY.md)

| ID | ② 通过标准 | ① 已做 | 态 | ② 验收命令（G-1/G-2 后） | 证据路径（②） | 结果 | 合法宣称 |
|----|------------|--------|-----|-------------------------|---------------|------|----------|
| **C1** | 04 正式行 + staging ≥20 帖 | PI-1 / 窄 API | **PASS** | `record-community-c1-seed-evidence.sh` + `GET /api/v1/community/feed` | [`evidence/GO_phase2_testnet_20260526/community/C1/`](../../../evidence/GO_phase2_testnet_20260526/community/C1/) | `20260605T123651Z` | **② C1 only** |
| **C2** | MIME+魔数+体限+路径 · Feed 隔离 | security IT + staging E2E | **PASS** | `record-community-c2-evidence.sh` · `matrix_93_d_com_c2_*` · staging upload smoke | [`evidence/GO_phase2_testnet_20260526/community/C2/`](../../../evidence/GO_phase2_testnet_20260526/community/C2/) | `20260605T125440Z` | **② C2 only** |
| **C3** | 举报→队列→下架 · content_remove | POST 举报 ① | **PASS** | `record-community-c3-evidence.sh` · `matrix_93_d_com_c3_*` · staging moderation smoke | [`…/C3/`](../../../evidence/GO_phase2_testnet_20260526/community/C3/) | `20260605T125712Z` | **② C3 only** |
| **C4** | HLS/MP4 + CDN | MinIO ① 3 passed | **PASS** | `record-community-c4-evidence.sh` · `matrix_93_d_com_c4_*` · staging playback smoke · Feed **canplay** | [`…/C4/`](../../../evidence/GO_phase2_testnet_20260526/community/C4/) | `20260605T141755Z` · **staging MP4** · **HLS-CDN pending** | **② C4 only** · **≠** ③ CDN/HLS GO |
| **C5** | 多图 CDN / 图片交付 | upload-media ① | **PASS** | staging image IT + browser load E2E | [`…/C5/`](../../../evidence/GO_phase2_testnet_20260526/community/C5/) | `20260605T143234Z` · **production CDN pending** | **②** |
| **C6** | 社交图与互动全链 | social-flow ① 4 passed | **PASS** | staging social IT + browser revisit E2E | [`…/C6/`](../../../evidence/GO_phase2_testnet_20260526/community/C6/) | `20260605T144104Z` · follow/DM/likes_received | **② C6 only** |
| **C7** | 93 矩阵 GO（社区 D 域 staging） | ISS-007 窄切片 ① | **PASS** | `record-community-c7-evidence.sh` · [`report.json`](../../../evidence/GO_phase2_testnet_20260526/community/C7/report.json) **`release_gate=GO`** | [`…/C7/`](../../../evidence/GO_phase2_testnet_20260526/community/C7/) | `20260605T144841Z` · C1–C6 mapped · **≠** full-site GO | **② C7 only** |
| **C8** | Runbook/监控 | — | **PASS** | `record-community-c8-evidence.sh` · [COMMUNITY-STAGING-OPS-RUNBOOK](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md) · monitoring smoke | [`…/C8/`](../../../evidence/GO_phase2_testnet_20260526/community/C8/) | `20260605T145342Z` · C1–C7 traceable · runbook + health checks | **② C8 only** |
| **C9** | Shell Token staging | ① 壳冻结 | **PASS** | `record-community-c9-evidence.sh` · [FOUNDER-REVIEW-REPORT](../../../docs/runbook/FOUNDER-REVIEW-REPORT.md) · 88 §18.7 · 9 screenshots | [`…/C9/`](../../../evidence/GO_phase2_testnet_20260526/community/C9/) | `20260605T151358Z` · visual-review · B 类有计划 | **② C9 only** |
| **C10** | Feed 宽路径 | ① 窄 13 passed | **PASS** | `record-community-c10-evidence.sh` · `e2e/community-c10-staging-critical-journey.spec.ts` · 11 screenshots | [`…/C10/`](../../../evidence/GO_phase2_testnet_20260526/community/C10/) | `20260605T235244Z` · critical journey API + browser E2E · [`TT-PHASE2-C10-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C10-STAGING-EVIDENCE.md) | **② C10 only** |
| **C11** | 04 机读闸 | — | **PASS** | `record-community-c11-evidence.sh` · `run-check-04-routes.sh` · staging API/browser probes | [`…/C11/`](../../../evidence/GO_phase2_testnet_20260526/community/C11/) | `20260606T001039Z` · route-gate-report · 24+18 routes · [`TT-PHASE2-C11-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C11-STAGING-EVIDENCE.md) | **② C11 only** |
| **C12** | did-rank → community | — | **PASS** | `record-community-c12-evidence.sh` · DID/Trust interlink staging E2E | [`…/C12/`](../../../evidence/GO_phase2_testnet_20260526/community/C12/) | `20260606T001931Z` · did-interlink-summary · 8 screenshots · [`TT-PHASE2-C12-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C12-STAGING-EVIDENCE.md) | **② C12 only** · **≠ Phase ② GO** |

---

## 十、Phase ③ · P3-COM（另闸 · ③）

| ID | 项 | 态 | ③ 验收命令 | 证据路径 | 结果 | 合法宣称 |
|----|-----|-----|------------|----------|------|----------|
| **P3-COM-1** | 生产 CDN / HLS | **NOT STARTED** | 生产 Feed `<video>` canplay · CDN 缓存头 | [`evidence/GO_production/community/P3-COM-1/`](../../../evidence/GO_production/community/P3-COM-1/) | — | **③** Production GO |
| **P3-COM-2** | 生产桶 / WAF | **NOT STARTED** | 桶策略审计 · 无公网 MinIO 直出 | [`…/P3-COM-2/`](../../../evidence/GO_production/community/P3-COM-2/) | — | **③** |
| **P3-COM-3** | UGC 审核法务 | **NOT STARTED** | 生产 moderation · 留存策略 | [`…/P3-COM-3/`](../../../evidence/GO_production/community/P3-COM-3/) | — | **③** |
| **P3-COM-4** | 93 × 角色 | **NOT STARTED** | `report.json` **`environment.name=production`** + **`release_gate=GO`** | [`…/P3-COM-4/`](../../../evidence/GO_production/community/P3-COM-4/) | — | **③** |
| **P3-COM-5** | 容量 / 滥用 | **NOT STARTED** | 上传限速 · 存储生命周期 | [`…/P3-COM-5/`](../../../evidence/GO_production/community/P3-COM-5/) | — | **③** |
| **P3-COM-6** | CSP / media-src | **NOT STARTED** | 07 §5.6A 生产 CSP 对拍 | [`…/P3-COM-6/`](../../../evidence/GO_production/community/P3-COM-6/) | — | **③** |

**入口：** [go-live-checklist · GO Decision](../../../docs/go-live-checklist.md#go-decision-entry-point) · 社区细则见该文 **「社区 UGC（P3-COM）」** 互指段。

---

## 十一、全仓 G-08 · Phase ① acceptance log（与社区切片独立）

| 项 | 命令 | 末行期望 | 2026-05-31 维护轮 |
|----|------|----------|-------------------|
| G-08 | `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` | `TT_GO_LOCAL_PHASE1: OK` | **OK** · `recorded=20260531T074458Z` — 见 `frontend/evidence/GO_local_phase1/acceptance.latest.log` |

**合法宣称 G-08（①）：** 仅当 `acceptance.latest.log` 末行含 **`TT_GO_LOCAL_PHASE1: OK`**（含 onboarding / provider / steward 烟测 + vitest 绿集）。**不以** 社区窄 E2E 替代。**②③** 仍 **Not Started**（[PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)）。
