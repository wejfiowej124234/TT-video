# `/community/*` TT 社区 · Phase ① 部分 L5 收口（2026-05-30）

**Phase ① 收口冻结 SSOT（2026-06-03）：** [`COMMUNITY-PHASE1-FREEZE.md`](./COMMUNITY-PHASE1-FREEZE.md) · **`data-tt-community-phase1-frozen="1"`** · **`bash scripts/dev/run-community-l5-green.sh`**

**阶段：① 本地** — 本声明覆盖 **五主路由壳层（已冻结）** + **发帖抽屉数据链（P0 已闭）** + **CommentDrawer / PublishDrawer 抽屉 Token（P1 已对齐）** + **PI-1 浏览器验收 PH1-FE-01～05（含 cover · 2026-05-30 已闭）** + **TD-3 MinIO 浏览器证据（2026-05-30 已闭）**；**不**表示全站 `/community/*` 每路由×每弹窗 UI L5、**不**表示 **31 §15.2 C1～C12** 或 **② 测试网 / ③ 生产** GO。**②③ backlog** → [COMMUNITY-PHASE-2-3-ROADMAP.md](./COMMUNITY-PHASE-2-3-ROADMAP.md) · **系统审计四清单** → [COMMUNITY-L5-SYSTEM-AUDIT.md](./COMMUNITY-L5-SYSTEM-AUDIT.md)（2026-05-31 复审）

**与 `/market` 差异：** [`MARKET-L5-CLOSURE.md`](./MARKET-L5-CLOSURE.md) 为 **主入口 L5 全收口**；社区 **壳层 ~86%** 已在 **FIVE-MAIN** 冻结，**功能/data L5** 仍有多项 **② 必补**（见下文「显式未闭」）。

**代码真源：** `frontend/app/community/*` · `frontend/components/community/*` · `frontend/components/community/PublishDrawer/*`

---

## 收口结论（ACTIVE · ① 本地 100% · 2026-05-31 · ② C1–C12 ALL PASS · Closing Review · **非 Phase ② GO**）

**① 社区切片 100% 机读摘要：** G-08 `TT_GO_LOCAL_PHASE1: OK`（`20260531T074458Z`）· §七 narrow **13** · §二 2.2 **42** · 2.3 **8** · 2.4 MinIO **3** · 2.5 vitest **82** — 证据根 [`GO_local_community_phase1_narrow`](../GO_local_community_phase1_narrow/README.md)（`TT_COMMUNITY_PHASE1_LOCAL_EVIDENCE: OK` · 2026-05-31 复跑）。

| 维度 | ① 状态 | 真源 |
|------|--------|------|
| **§七 P1/P2/P3 窄 E2E（13 用例）** | **① 已闭** | `npm run e2e:community-phase1-narrow` · `e2e-narrow.latest.log` |
| **五主路由 UI 壳（L0/L1 Tab / 暖场）** | **已冻结** | [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · §社区 |
| **壳层机读（C-L1～C-L8 口径）** | **① GO** | `communityShellTheme` · `communityPageTheme` · `communityMainPathRg` |
| **PublishDrawer 发帖链（P0）** | **① 已闭** | 模块化 `index.tsx` · 完整 `usePublishForm` · 本机封面 · multipart · `persistCommunityMediaUrlIfBlob` · **2026-06-01** portal 字色 + 429/重复正文 Toast（[31 §7.4](../../../docs/spec/31-TT社区-问题与优化清单-功能与排版.md)） |
| **PI-1 浏览器验收（PH1-FE-01～05 + cover）** | **① 已闭** | `npm run e2e:pi1-community-all` → **8 passed · 0 skipped**（2026-05-30 · ~6.3m · ①） |
| **`/community/me` 本机头像（PH1-FE-05 · F-007）** | **① 已闭** | `CommunityMeAccountPanel` · `postMeProfileAvatar` · `crates/api/src/routes/me_profile_avatar.rs` |
| **PublishDrawer 目的地 / food·travel / 裁切 / capabilities 横幅（P1-3～P1-6 · TD-1～2）** | **① 已闭** | `PublishDrawerDestinationSection` · `TYPES` 含 food/travel · `communityImageCenterCrop` · `communityVideoPublishGate` · `lib/api.ts` ↔ `routesCommunity` |
| **MinIO multipart 浏览器证据（TD-3）** | **① 已闭** | `bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh` · Feed 内联 `<video>` + **canplay**（2026-05-31 · **3 passed · exit 0**） |
| **CommentDrawer Token（P1-1）** | **① 已对齐** | `CommentDrawer.tsx` · `postDetailOverlay` / `sectionInset` / `postDetailComposerBar`（同 PostDetailDrawer） |
| **子路由 18 页机读锚点** | **① 已闭** | `communitySubRoutes.contract.test.ts` **22 passed** · `npm run e2e:community-subroutes-l5` **19 passed**（2026-05-31） |
| **friends / messages 业务 E2E（G-02）** | **① 已闭** | `npm run e2e:community-social-flow` **4 passed**（2026-05-31） |
| **资料编辑区无 avatar URL 粘贴（G-06）** | **① 已闭** | `MeProfileSection` · `communityMeProfile.contract.test.ts` |
| **Feed 真 UGC 密度 · 审核 · CDN/HLS · 社交图 · 93 矩阵 · ops · shell sign-off · critical journey · 04 route gate · DID/Trust interlink** | **② C1–C12 ALL PASS** · [`CLOSING-REVIEW.md`](../../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) · **≠ Phase ② GO** | [COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md) · **C12** [`STATUS.txt`](../../../evidence/GO_phase2_testnet_20260526/community/C12/STATUS.txt) |
| **全矩阵 93 × 角色** | **②③** | [COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md) |

**维护期纪律（写死 · 本收口范围内 · Community ② 已闭）：**

- **允许：** 发帖/评论 **数据链路** bugfix · Closing Gap **宽轨证据** · i18n（同语义）· MinIO/multipart 门闸
- **禁止：** **新增 Community 功能** · 五主路由 **页结构 / L1 Tab / 暖场 layout lock** 回流 · 用 Community 槽 PASS 冒充 **Phase ② GO**
- **动 `PublishDrawer*` / `usePublishForm`：** 须本节 **① 验收命令** vitest **`exit 0`**；发帖/头像数据链变更须 **`npm run e2e:pi1-community-all`** **`exit 0`**（**①**）

---

## 机读锚点

**五主 Feed 页（壳 · 非发帖专用）：**

```text
data-tt-community-feed-page="1"          # CommunityFeedMain
data-testid="community-feed-publish-entry" | community-feed-publish-fab
```

**发帖抽屉（P0 收口后）：**

```text
data-tt-publish-drawer-type="photo|video|text"
data-testid="community-publish-drawer-type-video"
data-testid="community-publish-drawer-destination"   # PublishDrawerDestinationSection
data-testid="community-publish-capabilities-banner"  # 对象存储未就绪（与 PI-1 E2E skip 同源）
input[type=file][accept*="video"]        # PublishDrawerVideoSection
input[type=file][accept*="image"]        # 本机封面 picker（非 URL 框）
```

**社区资料 `/community/me`（PH1-FE-05 · ① · ME-P1-6 · Hub 已取消 · 2026-06）：** 裸路径 **`router.replace`** → **`/me/settings/profile`**（保留 **`?tab=`** 深链归一化至独立子页）；资料 UI / 头像 **`data-tt-*`** 真源 → [`GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md`](../GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) · [`app/community/me/README.md`](../../app/community/me/README.md)

```text
# 裸 /community/me：redirect（resolveCommunityMeHubRedirect）— 非 data-tt-community-me-page 渲染页
data-tt-community-me-surface="community_me_profile"   # CommunityMeAccountPanel · /me/settings/profile 等
input[type=file][accept="image/jpeg,image/png,image/webp"]   # 本机头像（非 production 默认开）
```

---

## ① 验收命令（收口日 · exit 0）

**社区壳 + 抽屉 Token + 发帖 hook（推荐最小集）：**

```bash
cd frontend
npx vitest run \
  components/community/communityShellTheme.contract.test.ts \
  components/community/communityMainPathRg.contract.test.ts \
  components/community/communityPageTheme.contract.test.ts \
  components/community/communityDrawerTheme.contract.test.ts \
  components/community/PublishDrawer \
  lib/communityPostTagsPayload.test.ts \
  app/community/communitySubRoutes.contract.test.ts \
  app/community/communityRouteDataHooks.contract.test.ts \
  components/community/communityModals.contract.test.ts \
  components/me/communityMeProfile.contract.test.ts
```

**子路由 L5 机读锚点 E2E（① · 2026-05-31）：**

```bash
cd frontend
npm run e2e:community-subroutes-l5
npm run e2e:community-subroutes-data
npm run e2e:community-modals-interaction
npm run e2e:community-social-flow
npm run e2e:community-l5-all
npm run e2e:community-phase1-narrow   # §七 P1/P2/P3 窄 E2E · 证据 GO_local_community_phase1_narrow/
```

**收口日记录：** 44+ tests passed（vitest · 2026-05-31）；**`communitySubRoutes` 22 passed** · **`e2e:community-subroutes-l5` 19 passed**。

**§二 2.2–2.5 全量复跑（2026-05-31 维护轮 · ①）：**

| 段 | 命令 | 证据路径 | 结果 | 可宣称边界 |
|----|------|----------|------|------------|
| **2.2** | `npm run e2e:community-l5-all` | [`GO_local_community_phase1_narrow/e2e-l5-all.latest.log`](../GO_local_community_phase1_narrow/e2e-l5-all.latest.log) | **42 passed · exit 0** | **①** 并集（含 §七 narrow 13） |
| **2.3** | `npm run e2e:pi1-community-all` | [`…/e2e-pi1-community-all.latest.log`](../GO_local_community_phase1_narrow/e2e-pi1-community-all.latest.log) | **8 passed · exit 0** | **①** PI-1 |
| **2.4** | `bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh` | [`…/e2e-publishdrawer-minio.latest.log`](../GO_local_community_phase1_narrow/e2e-publishdrawer-minio.latest.log) · [`evidence/community-media-local-minio-chain/out/`](../../../evidence/community-media-local-minio-chain/out/)（`browser.har` 等） | **3 passed · exit 0**（2026-05-31 复跑） | **①** TD-3；**不**冒充 **②** staging bucket GO |
| **2.5** | 本节 vitest 最小集 | [`…/vitest-community-l5.latest.log`](../GO_local_community_phase1_narrow/vitest-community-l5.latest.log) | **82 passed · exit 0** | **①** |
| **§七** | `npm run e2e:community-phase1-narrow` | [`…/e2e-narrow.latest.log`](../GO_local_community_phase1_narrow/e2e-narrow.latest.log) | **13 passed · exit 0** | **①** P1/P2/P3 窄切片 |

**一键复跑：** `bash scripts/evidence/run-community-phase1-local-evidence.sh`（须 API :8080；MinIO 须 `evidence/community-media-local-minio-chain/out/24-env-snapshot.txt`）。

**②③：** **C1 PASS**（`20260605T123651Z`）· … · **C11 PASS**（`20260606T001039Z` · 04 route gate）· **C12 PASS**（`20260606T001931Z` · DID/Trust interlink · [`did-interlink-summary.md`](../../../evidence/GO_phase2_testnet_20260526/community/C12/did-interlink-summary.md)）· [`CLOSING-REVIEW.md`](../../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) **C1–C12 ALL PASS** · **TT_PHASE2_GO_VERDICT: NOT_MET** · P3-COM-1～6 = **NOT STARTED** · **禁止** 用槽级 PASS 冒充 Phase ② **GO** / **Production GO**。

---

## 三阶进度总表（SSOT · 状态 / 命令 / 证据 / 可宣称）

| 阶 | ID | 态 | 验收命令 | 证据路径 | 结果 | 可合法宣称 |
|----|-----|-----|----------|----------|------|------------|
| **①** | §二 2.2 | **已闭** | `npm run e2e:community-l5-all` | [`e2e-l5-all.latest.log`](../GO_local_community_phase1_narrow/e2e-l5-all.latest.log) | **42 passed** | **①** |
| **①** | §二 2.3 | **已闭** | `npm run e2e:pi1-community-all` | [`e2e-pi1-community-all.latest.log`](../GO_local_community_phase1_narrow/e2e-pi1-community-all.latest.log) | **8 passed** | **①** |
| **①** | §二 2.4 | **已闭** | `bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh` | [`e2e-publishdrawer-minio.latest.log`](../GO_local_community_phase1_narrow/e2e-publishdrawer-minio.latest.log) | **3 passed** | **①**（非 ② CDN） |
| **①** | §二 2.5 | **已闭** | vitest 社区 L5 最小集（见上 §① 验收命令） | [`vitest-community-l5.latest.log`](../GO_local_community_phase1_narrow/vitest-community-l5.latest.log) | **82 passed** | **①** |
| **①** | §七 P1/P2/P3 | **已闭** | `npm run e2e:community-phase1-narrow` | [`e2e-narrow.latest.log`](../GO_local_community_phase1_narrow/e2e-narrow.latest.log) | **13 passed** | **①** |
| **①** | G-08 | **已闭** | `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` | [`acceptance.latest.log`](../GO_local_phase1/acceptance.latest.log) | **`TT_GO_LOCAL_PHASE1: OK`** · `20260531T074458Z` | **①** |
| **②** | C1 | **PASS** | `bash scripts/dev/record-community-c1-seed-evidence.sh` | [`community/C1/`](../../../evidence/GO_phase2_testnet_20260526/community/C1/) | `20260605T123651Z` | **② C1 槽** |
| **②** | C2 | **PASS** | `bash scripts/dev/record-community-c2-evidence.sh` | [`community/C2/`](../../../evidence/GO_phase2_testnet_20260526/community/C2/) | `20260605T125440Z` | **② C2 槽** |
| **②** | C3 | **PASS** | `bash scripts/dev/record-community-c3-evidence.sh` | [`community/C3/`](../../../evidence/GO_phase2_testnet_20260526/community/C3/) | `20260605T125712Z` | **② C3 槽** |
| **②** | C4 | **PASS** | `bash scripts/dev/record-community-c4-evidence.sh` | [`community/C4/`](../../../evidence/GO_phase2_testnet_20260526/community/C4/) | `20260605T141755Z` · staging MP4 · HLS-CDN pending | **② C4 槽** · **≠** 生产 CDN/HLS GO |
| **②** | C5 | **PASS** | `bash scripts/dev/record-community-c5-evidence.sh` | [`community/C5/`](../../../evidence/GO_phase2_testnet_20260526/community/C5/) | `20260605T143234Z` · staging image delivery · production CDN pending | **② C5 槽** |
| **②** | C6 | **PASS** | `bash scripts/dev/record-community-c6-evidence.sh` | [`community/C6/`](../../../evidence/GO_phase2_testnet_20260526/community/C6/) | `20260605T144104Z` · staging social graph | **② C6 槽** |
| **②** | C7 | **PASS** | `bash scripts/dev/record-community-c7-evidence.sh` | [`community/C7/`](../../../evidence/GO_phase2_testnet_20260526/community/C7/) | `20260605T144841Z` · community 93 matrix GO | **② C7 槽** · **≠** full-site 93 GO |
| **②** | C8 | **PASS** | `bash scripts/dev/record-community-c8-evidence.sh` | [`community/C8/`](../../../evidence/GO_phase2_testnet_20260526/community/C8/) | `20260605T145342Z` · ops runbook + monitoring smoke | **② C8 槽** · **≠** Phase ② GO |
| **②** | C9 | **PASS** | `bash scripts/dev/record-community-c9-evidence.sh` | [`community/C9/`](../../../evidence/GO_phase2_testnet_20260526/community/C9/) | `20260605T151358Z` · visual-review + 9 screenshots | **② C9 槽** · **≠** Phase ② GO |
| **②** | C10 | **PASS** | `bash scripts/dev/record-community-c10-evidence.sh` | [`community/C10/`](../../../evidence/GO_phase2_testnet_20260526/community/C10/) | `20260605T235244Z` · journey-summary + 11 screenshots · [`TT-PHASE2-C10-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C10-STAGING-EVIDENCE.md) | **② C10 槽** · **≠** Phase ② GO |
| **②** | C11 | **PASS** | `bash scripts/dev/record-community-c11-evidence.sh` | [`community/C11/`](../../../evidence/GO_phase2_testnet_20260526/community/C11/) | `20260606T001039Z` · route-gate-report + summary · [`TT-PHASE2-C11-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C11-STAGING-EVIDENCE.md) | **② C11 槽** · **≠** Phase ② GO |
| **②** | C12 | **PASS** | `bash scripts/dev/record-community-c12-evidence.sh` | [`community/C12/`](../../../evidence/GO_phase2_testnet_20260526/community/C12/) | `20260606T001931Z` · did-interlink-summary + 8 screenshots · [`TT-PHASE2-C12-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C12-STAGING-EVIDENCE.md) | **② C12 槽** · **≠** Phase ② GO |
| **③** | P3-COM-1～6 | **NOT STARTED** | 见 [ROADMAP §③](./COMMUNITY-PHASE-2-3-ROADMAP.md#phase-③-公网--生产另闸--not-started) | [`evidence/GO_production/community/`](../../../evidence/GO_production/community/README.md) | — | **③** · **Production GO 后** |

**① 一键复验：** `bash scripts/evidence/run-community-phase1-local-evidence.sh` → 末行 `TT_COMMUNITY_PHASE1_LOCAL_EVIDENCE: OK`。

**PI-1 浏览器验收（发帖链 + 社区资料头像 · ① · 推荐与 vitest 并跑）：**

```bash
cd frontend
# 建议释放 8080 或显式换新 API（含 TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1）
PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all
```

| 用例 | 覆盖 |
|------|------|
| cover spec | PublishDrawer 本机封面 picker |
| **PH1-FE-01** | Feed 登录态无 401 |
| **PH1-FE-04** | 纯文字发帖 |
| **PH1-FE-03** | 多图发帖 |
| **PH1-FE-02** | 视频 + 封面 → multipart → 发帖（须 MinIO / `public_video_publish_ready`） |
| **PH1-FE-05** | `/community/me` 本机头像 → `POST …/me/profile-avatar` |

**① 收口记录（2026-05-31）：** **`8 passed · 0 skipped · exit 0`**（PI-1 全链复验 · 含 FE-02 multipart + FE-05 头像）。

**五主路由并集闸（可选 · 含 home/market 等）：** 仓库根 `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh` — 与本文 **非同键**；社区发帖/头像变更以本节 vitest + **PI-1 E2E** 为准。

**浏览器封面上传（单 spec · 已含于 `e2e:pi1-community-all`）：**

```bash
cd frontend
node ./scripts/run-e2e-default.mjs --project=chromium \
  e2e/pi1-community-browser-acceptance-cover.spec.ts
# 并集：npm run e2e:pi1-community-all
```

**MinIO multipart 证据链（① · 推荐与 PI-1 并跑）：**

```bash
# 须 24-env-snapshot.txt + MinIO Docker；Feed 内联 `<video>`（MinIO CORS · `remotePatterns` 19000）
PLAYWRIGHT_REUSE_API_SERVER=0 bash scripts/evidence/run-community-publishdrawer-browser-evidence.sh
```

见 `docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md` · **②** staging 见 [COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md)。

---

## 数据面（① · 发帖链 · 与 UI 壳冻结并行允许维护）

| 能力 | 前端 | 后端 / 对象存储 |
|------|------|-----------------|
| 图片/封面上传 | `persistCommunityMediaUrlIfBlob` → `POST …/upload-media` | `media_upload` · 512KiB 默认上限 |
| 视频 multipart | `uploadCommunityVideoMultipart` · `mediaAssetId` | `GET …/media/capabilities` · S3 presigned |
| 无封面自动截帧 | `uploadPosterJpegFromVideoBlobUrl` | 同上 upload-media |
| 发帖 | `useCommunityFeedPublishSubmit` | `POST …/community/posts` · `tags[]` UTF-8 预检 |
| 话题 | `PublishDrawerTagsFieldSection` · `communityPostTagsPayload` | `normalize_post_tags_for_create` 同源 |
| 社区资料头像 | `useCommunityMeAccountPanelAvatar` · `postMeProfileAvatar` | `POST …/me/profile-avatar` · `GET …/uploads/profile-avatars/:name` · **`me_profile_avatar.rs`**（本机须 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`**） |

**默认不宣称：** staging ≥20 帖密度（**C11**）· 审核队列法务链（**C3**）· 真 HLS/CDN 播放（**C4**）— 均属 **②③**（[COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md)）。

---

## ②③ 未闭项（勿用 ① 绿冒充 GO）

**完整 backlog · 验收命令 · 证据路径：** [COMMUNITY-PHASE-2-3-ROADMAP.md](./COMMUNITY-PHASE-2-3-ROADMAP.md)（**P2-1～P2-6** · **COM-②-*** · **P3-COM-***）。

**全站 L5 正式冻结（对标 MARKET-L5-CLOSURE 粒度）** 须在 **②** 清闸后 **另开收口轮次** — 本文 **不** 替代该 GO。

---

## 互指

| 读者 | 文档 |
|------|------|
| 五主壳冻结边界 | **FIVE-MAIN-ROUTES-PHASE1-FREEZE** §社区 |
| 改发帖 UI/链路 | 本文 · `components/community/PublishDrawer/README.md` |
| PI-1 E2E | `e2e/pi1-community-browser-acceptance*.spec.ts` · `npm run e2e:pi1-community-all` |
| 社区资料 / 头像 | `app/community/me/README.md` · F-007 · `docs/runbook/PROFILE-AVATAR-OBJECT-STORAGE.md` |
| 对象存储 / MinIO | `docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md` |
| 规格 | **31-TT社区** · **88 §一** |
| 市场 L5 对标 | **MARKET-L5-CLOSURE**（全收口粒度） |
| **②③ 社区 backlog** | **COMMUNITY-PHASE-2-3-ROADMAP** |
| 覆盖边界 | **TT-9628 · coverage boundary** — 单份 `report.json` GO ≠ 每弹窗已验 |
