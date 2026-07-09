# TT-96-20-E2E-COVERAGE-GAP-MAP-001 · P0 路由 ↔ Playwright ↔ 缺口（① 执行表）

**仓库路径：** `docs/runbook/TT-96-20-E2E-COVERAGE-GAP-MAP-001.md`  
**稳定锚：** [`#tt-96-20-e2e-gap-map`](#tt-96-20-e2e-gap-map) · [`#tt-96-20-e2e-gap-run`](#tt-96-20-e2e-gap-run)

**Version:** 1.0.47  
**Status:** `Active` — **① 本地** 查漏补缺用；**不**替代 **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** 全文、**[93](../spec/93-全站功能验证矩阵-域别回归清单.md)** **MANUAL** 行、**[31](../spec/31-TT社区-企业级UI检查-未完成与待优化.md)** 深度项。**独立开发**：**十轮 UI 面**收口**不绑 PR**，见 **[TT-96-20 §0.0](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-solo)** 与 **[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)**。

**E2E 文件模块化（① · 不改 Playwright 入口路径）**：**`f018-f019-f020-request`** / **`f024-f025-f026-request`** / **`market-subsite-studio-and-community-publish`** / **`93-matrix-admin-deep-batch`** 等为薄 **`*.spec.ts`** 侧载 **`*.body.ts`**/**shared**；**R-002**/**95**/**本表** 所列 **`npx playwright test …/*.spec.ts`** 仍有效；**`f024-f025-f026`** 侧载后 **不再**保证**单文件** **`describe.serial` 跨 F-024→026** 的全局顺序（见 **[46-模块化审计与拆分登记表 §一](../spec/46-模块化审计与拆分登记表.md)**）。**无** **04 §3.4**/HTTP 契约变更。

**真源机读：** `frontend/e2e/p0-routes.v1.json`（**`routes[]`** · **`existingE2e`**）；本表在其上扩 **「缺口 / 下一步」** 列。

**阶次：** 默认 **①**；**②③** 须另表与证据（与 **[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)** 同源）。

---

<a id="tt-96-20-e2e-gap-map"></a>

## 1. 按 **P0 lane** 对照（路由 → E2E → 缺口 → 下一步）

| 域 / lane | **`p0-routes` 行**（摘录） | 已有 E2E（文件；全量见 JSON **`existingE2e`**） | 常见缺口（仍 **不**被单条 spec 穷举） | **①** 建议下一步 |
|-----------|---------------------------|-----------------------------------------------|--------------------------------------|------------------|
| **Auth** | **`p0.auth.login`** / **`p0.auth.register`** | **`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**、**`auth-login-logout-me.spec.ts`**、**`auth-register-login-market-chain.spec.ts`**、**`p01-login-market-auth.spec.ts`**、**`smoke.spec.ts`**；矩阵 **F1**：**`93-matrix-path-f1-f4.spec.ts`** | 限流生产形、**多因子 / 邮件真发**、全错误码矩阵 | **`npm run e2e:full-chromium`** 子集失败时按用例修；**429** 用 **`playwright429Backoff`**（见 **TT-96-20 §3**） |
| **Market + Guides** | **`p0.market.hub`**、**`p0.market.discover_redirect`**、**`p0.guides.list`** | 上列 + **`f007-f010-f032-request.spec.ts`**；**B-468**：**`b468-market-discovery-full-ui-journey.spec.ts`**；**94 创作台 + 31 发帖**：**`market-subsite-studio-and-community-publish.spec.ts`**；**F-021～023**：**`f021-f022-f023-request.spec.ts`** | **橱窗/收购** 与 **社区** 全对称 UX、**32MB/多 MIME** 长尾 | 扩充闸已含 **market-community** 时盯 **Vitest + tsc**；全量：**`e2e:full-chromium`** |
| **Orders + Escrow** | **`p0.orders.list`**、**`p0.orders.new`**、**`p0.escrow.detail`** | **`p0-spine-real-api`**、**`smoke`**、**`p04-bilateral-confirm`**、**`b465-bilateral-review-ui-e2e`**；全链 UI：**`b467-full-ui-order-journey.spec.ts`**；抽屉收敛：**`b469-guides-drawer-booking-convergence.spec.ts`**；**53**：**`53-main-path.spec.ts`**；**trust-gate 四文件** | **②** **mock-pay / PSP**；状态机长尾；**trust-gate × PG 证据** **WARN** 见 **[TT-96-20 §3.1](TT-96-20-P0-E2E-LADDER-001.md#tt-96-20-trust-gate-pg-evidence-warn)** | **`DATABASE_URL`** 下 **`cargo test -p traveltrust-api matrix_93_b_tg_`** + **`trust-gate-*.spec.ts`**；全量 **`e2e:full-chromium`** |
| **Community（Feed / Explore / Hub）** | **`p0.community.feed`**、**`p0.community.explore`**、**`p0.community.me_hub`** | **`p0-spine-real-api`**、**`smoke-community.spec.ts`**、**`smoke.spec.ts`**、**`section10-5-login-community-feed.spec.ts`**；**评论排序 GET 契约（①）**：**`community-post-detail-comment-sort.spec.ts`**；**二级回复线程（①）**：**`community-post-detail-comment-reply-thread.spec.ts`**；**点赞整页 reload（①）**：**`community-post-detail-like-persist-after-reload.spec.ts`**；**收藏整页 reload（①）**：**`community-post-detail-collect-persist-after-reload.spec.ts`**（**`POST …/collect`** 同 **`status=ok`** 等待，与 **F-017** 同源；**`like`/`collect` persist** 写后读回：**Playwright `request` + `API_BASE` + 同用例 `apiLogin` `token`**，与 **`gotoWithBearerSession`** 同源；**reload**：**`useCommunityFeedPostDeepLink`** 剥 **`?post=`** → **`reloadSmoke` + `gotoSmoke(deepUrl)`**，**勿** `waitForURL` **`post=`**）；**`lib/api/url.ts`**：loopback 下 **`/api/*`** 浏览器优先 **同 origin + Next rewrite**；**产品**：详情 **`onPostCollectResolved`→`collectedByMe`** 与 **`onPostLikeResolved`** 对称；Hub：**`community-me-hub-notes-drawer-ia.spec.ts`**、**`community-me-data-state.spec.ts`**；**F-018～020 / F-031**：**`f018-f019-f020-request.spec.ts`**、**`f029-f030-f031-request.spec.ts`**；**93 社区路径**：**`93-matrix-path-community-feed-post.spec.ts`** | **Feed 真视频全屏**、评论 **chronological 多页「加载更多」** / **手验矩阵**、赞藏关注 **刷新一致** — **[TT-GATE §2](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-31-community)** | 先 **`e2e:market-community`**（已含 **PublishDrawer** 竖切）再 **手验** **TT-GATE** 列项；专项补 spec 前对齐 **04 / 31** |
| **Me + Onboarding** | **`p0.me.profile`**、**`p0.me.security`**、**`p0.me.onboarding`** | **`p0-spine-real-api`**、**`auth-login-logout-me`**、**`smoke`**、**`me-security-community-hub.spec.ts`**、**`me-onboarding-96-18-shell.spec.ts`** | **PSP / webhook / ②**；**96-18** 全角色矩阵 | **`me-onboarding-96-18-shell`** + **Vitest** **`lib/apiClient/onboarding`**（见 **TT-96-20 §3**）；staging 走 **TT-9618** |
| **Admin + 治理只读** | （**96-20** 大量 Admin 路由；**非** 全部在 **`p0-routes`**） | **`smoke-admin.spec.ts`**（可达性为主）；**`93-matrix-admin-deep-batch.spec.ts`**、**`93-matrix-admin-domain-batch.spec.ts`**；治理烟：**`smoke-governance.spec.ts`**；**F-030**：**`f029-f030-f031-request.spec.ts`** | **RBAC 交叉**、审计全枚举 — **[TT-GATE §3](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-cross-domain)** | **`e2e:full-chromium`** 扫 Admin 子集失败项；**Tier B/C** 手验表单独勾选 |
| **质押 / Did / 发版结构** | **`/staking`**、Did 榜、**release** 叙事 | **`smoke.spec.ts`** / **`smoke-governance.spec.ts`** / **`release-flow.spec.ts`**；**Did 榜路径**：**`93-matrix-path-did-rank-boards.spec.ts`**（**① 窄切片**） | **链上质押 → 积分** 全链；**Did 产品数据 L5**（副榜真 GMV/履约、staging 密度、**§8.6** 全路径 E2E、奖池 **③**）— **[04-附录 §3.2 D1～D9](../spec/04-附录-did-rank对接说明.md)** / **[30 §7.2](../spec/30-DID排行榜-页面规范.md)** | **①**：**`e2e:full-chromium`** + **Sepolia**（下节）；**②**：**04 §3.2** 清单 + staging **`smoke`/`check-55`**；**③**：链与 **trust_growth** 对账另证据 |
| **Sepolia / 96-17** | （**非** `p0-routes` 默认 **`chromium`** 子集） | **`npm run e2e:sepolia`** / **`npm run e2e:sepolia:smoke`**；**`npm run e2e:96-17-identity-local`**（**`chromium-96-17-identity`**） | **L4** 体量、**RPC 计费** | 根 **`.env`** 按 **[TT-L4 §3](TT-L4-PARALLEL-CI-001.md)**；先 **smoke** 再全量 **Sepolia** |

---

## 2. **`p0-routes.v1.json` 未列名、但 `chromium` 全量常跑的竖切（摘录）**

| Spec 文件 | 用途（一句话） |
|-----------|----------------|
| **`p02`～`p05`·`*.spec.ts`** | 游客订单创建、向导接单、确认、托管尾段（与 **B-467** 互补） |
| **`b463`～`b466`·`*.spec.ts`** | 评价 JSON / 浏览器评价 / mock-pay / confirm-completion |
| **`itinerary-52.spec.ts`** | 行程创建与 Escrow 行程展示 |
| **`93-matrix-path-p1-remediation.spec.ts`**、**`93-matrix-enterprise-p1-batch.spec.ts`** | 93 路径补强 / 企业 P1 批 |
| **`epic-f-normal-release-real.spec.ts`** | Epic F 真三件套（常 **`RUN_EPIC_F_E2E_REAL_PATH=1`** 门闸） |
| **`e2e-stability-probe`** 编排 | 见 **`scripts/gates/e2e-stability-probe.sh`**（**`pg_tcp_check`** 首步；与 **TT-LOCAL**、**`solo-dev-rhythm` §6.5 · 11** 对读） |

**Playwright 导航 SSOT（`waitForURL` · ① 本地）：** 除上列 **`commit`** 专用三处（**`e2e/helpers/clickLoginWaitClientNav.ts`**、**`e2e/core-path.spec.ts`**、**`e2e/section10-5-login-community-feed.spec.ts`** — Next 客户端导航与点击并发）外，`frontend/e2e/**/*.spec.ts` 与 helpers 中 **`page.waitForURL`** 宜经 **`e2e/helpers/smoke-nav.ts`** 的 **`waitForUrlSmoke`** / **`waitForUrlSmokePromise`**（**`domcontentloaded`**；后者供 **`Promise.all`**）。**社区 `?post=` / `/community/post/[id]`（B-055）**：**`replaceState` 剥 `?post=`** → **勿** `waitForURL` **`post=`**；宜用 **`e2e/helpers/communityFeedPostDeepLink.ts`** **`expectCommunityFeedPostDeepLinkSettled`**（**不可用**文案与 **`locales/en.ts`/`zh.ts`** **`community_postDeepLink_notFoundOrHidden`** 字面量对拍）。**机读闸（防漂移）**：项目根 **`bash scripts/check-e2e-waitforurl-smoke-convergence.sh`**（已串 **`scripts/gates/local-delivery-expanded.sh`** **`frontend` 块**后；**优先 `rg`**，无则 **`find`+`grep`**；**`CI_LOCAL_SKIP_E2E_WAITFORURL_CONVERGENCE=1`** 跳过）。契约与已对拍文件清单见 **[04 §3「Web `parseResponse` / E2E」](../spec/04-后端与API.md)**、**[TT-96-20-P0-E2E-LADDER-001](TT-96-20-P0-E2E-LADDER-001.md)** **§3** / **§6 v1.0.27**。

**扫法：** **`npm run e2e:full-chromium`**（或 **`CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX=1`** 串 **扩充闸**）— 与 **[TT-LOCAL-FULL-E2E-MATRIX-001](TT-LOCAL-FULL-E2E-MATRIX-001.md)** 同集合边界。

---

<a id="tt-96-20-e2e-gap-run"></a>

## 3. **①** 推荐执行顺序（一轮「查漏补缺」）

1. **`export DATABASE_URL=…`**（已 **migrate**）。  
2. **`env -u DATABASE_URL cargo test -p traveltrust-api`**（或 **`bash scripts/dev/dev-preflight.sh`**）。  
3. **`bash scripts/gates/local-delivery-expanded.sh`**（默认 **8** Playwright + 前端子集）。  
4. **`npm run e2e:full-chromium`**（**`frontend/`**；**长**）。  
5. 按需：**`npm run e2e:sepolia:smoke`** / **`npm run e2e:96-17-identity-local`**。  
6. **表格外**：打开 **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** 与 **[TT-GATE §2～§3](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**，对 **MANUAL** 行做 **手验勾选** 或标 **N/A**。
7. **十轮 UI/UX 深度缺口（全页面）**：按 **[TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)** **R1～R10** 执行；**每页功能与按键** 见 **附录 B.2**、**`data-tt-*` 枚举 B.3**、**`tt:`/`lbl:` 命名 E.2.2**、**`appendix_b_axes` 最小集 B.1**、**CSV `controls_notes` [E.2](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-controls-notes)**；**逐页 DoD** **[§0.3.4](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-page-dod)**（**R1～R9** 并集 **`uniq(page_tsx_path)` = `page.tsx` 全量**）；**93/96-20/13-1 文档矩阵闭包** **[§0.3.3](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-matrix-closure)**（**`matrix:`** 前缀，**缺行** **`matrix:MISSING`+缺口**）；**出口判据** **[§0.4.2](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-round-exit)**、**[附录 G](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-g)**；**96-15 Tier 对读** **[§0.4.4](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-tier-map)**；**机读 ↔ slug** **[§0.4.3](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-ci-matrix)**；**非 page 真源** **[§0.3.2](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-pages-nonpage)**；**合入前 `rg`** **[附录 C.1](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-c-grep)**；**CSV 骨架** **[附录 D.1](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-d-skeleton)** / **`bash scripts/tt-96-20-appendix-e-skeleton.sh`**（**[D.1 脚本锚](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-d-script)**）、**环境 [D.2](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-d-env)**；**卫星文件** **[§0.3.1](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-pages-sidecar)**；**附录 E**（**`layout_sidecar`**、**[E.4](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-bucket-refs)**、**[E.2.1 vitest_ref](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-vitest)**）；每轮 **证据 [§0.5](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-evidence)**（含 **Playwright 报告路径**）；**逐页** **[附录 E](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e)** + **[附录 F](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-f)** 对拍 **`page.tsx`** 全量；**附录 E 合并** **`bash scripts/tt-96-20-appendix-e-merge.sh`**（**[D.1.2](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-merge)**）→ **机读校验** **`bash scripts/tt-96-20-appendix-e-validate.sh`**（**[D.1.1](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-validate)** · **`--require-controls-tag` / `--strict-b-axes`** 见 **`--help`** · **[§0.0 独立开发](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-ten-solo)** · **solo-dev §6.5·14** · **`--require-key-api-signal`**（**[E.2.3](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-data-align)**）· **`generate-machine-stub` 富化 / `--bundle`**（**[附录 D.1](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-d-skeleton)**）· **`fill-spec-matrix`**（**[D.1.3](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-fill-spec-matrix)**）· **`fill-controls-from-source`**（**[D.1.5](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-fill-controls-from-source)** · **`--summary`**）· **`audit-controls-vs-source`**（**[D.1.4](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-audit-controls-vs-source)** · **`--strict`**）· 十轮文 **v1.0.28**）。

---

## 4. 互指

| 文档 | 关系 |
|------|------|
| [TT-96-20-P0-E2E-LADDER-001](TT-96-20-P0-E2E-LADDER-001.md) | P0 阶梯与 **§3** helpers |
| [TT-GATE-COVERAGE…](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md) | **自动化仍缺口** 登记真源 |
| [TT-LOCAL-FULL-E2E-MATRIX-001](TT-LOCAL-FULL-E2E-MATRIX-001.md) | **chromium 全量** 定义与 **≠ 文档矩阵** 边界 |
| [TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md) | **全页面 10 轮** UI/UX 深度协议（**禁 `page.route` 假 JSON**） |
| [scripts/README](../../scripts/README.md) | **`e2e:full-chromium`** / **`local-delivery-expanded`** |

---

## 5. 修订记录

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.47 | 2026-05-16 | **修复**：**§3** 第 **7** 步长句末 **`solo-dev §6.5·12`** → **`§6.5·14`**（**附录 E 专项**；与 **`solo-dev-rhythm` §6.5** 顺延一致）。**承** **v1.0.46**。 |
| 1.0.46 | 2026-05-16 | **互指**：**`solo-dev-rhythm` §6.5** 增 **第 11 条** **`e2e-stability-probe`**；**附录 E 专项** 机读链现标 **§6.5·14**；**下表 v1.0.20** 历史行脚注 **§6.5·12（现 ·14）**。**承** **v1.0.45**。 |
| 1.0.45 | 2026-05-14 | **`communityFeedPostDeepLink`**：**不可用**由 **`getByText`** 与 **`locales/en.ts`/`zh.ts`** **`community_postDeepLink_notFoundOrHidden`** **全文**一致（**`\\u2019`** 英文弯引号；**改翻译须同步** helper）。**承** **v1.0.44**。 |
| 1.0.44 | 2026-05-14 | **§1 Community**：**`comment-sort` / `comment-reply-thread` / `like`·`collect` persist / `93-matrix-path-community-feed-post`** 深链首跳与 **reload 后再 `gotoSmoke(deepUrl)`** 统一 **`expectCommunityFeedPostDeepLinkSettled`**（**`communityFeedPostDeepLink.ts`**）。**承** **v1.0.43**。 |
| 1.0.43 | 2026-05-14 | **§2 SSOT**：**`e2e/helpers/communityFeedPostDeepLink.ts`** **`expectCommunityFeedPostDeepLinkSettled`**（**`?post=` / B-055**；**勿** `waitForURL` **`post=`**）；**`smoke-community`** 改为 import 复用。**承** **v1.0.42**。 |
| 1.0.42 | 2026-05-14 | **§1 Community**：**`smoke-community.spec.ts`** — **`?post=`** 与 **`/community/post/[id]`**（**B-055**）占位 id：**抽屉可见** 或 **`community_postDeepLink_notFoundOrHidden`** 文案（**勿** `waitForURL` **`post=`**）；共用 **`SMOKE_COMMUNITY_PLACEHOLDER_POST_ID`**。**承** **v1.0.41**。 |
| 1.0.41 | 2026-05-14 | **§1 Community**：**`93-matrix-path-community-feed-post`** 增 **`/community/post/[id]`**（**B-055** **`redirect`** → **`?post=`**）与 **`?post=`** 同帖抽屉可读；去未用 **`feedRes`**。**承** **v1.0.40**。 |
| 1.0.40 | 2026-05-14 | **§1 Community**：**`comment-sort` / `comment-reply-thread` / `93-matrix-path-community-feed-post`** 深链首跳与 **`like`/`collect` persist`** 对齐：**`gotoSmoke(?post=)`** 后 **勿** `waitForURL` **`post=`**（**`replaceState` 剥参**），以 **抽屉可见** 收口。**承** **v1.0.39**。 |
| 1.0.39 | 2026-05-14 | **§1 Community**：**`like-persist`/`collect-persist`** **reload** 后 **勿** `waitForURL` **`post=`**（深链打开后 **`replaceState` 剥参**）；**`reloadSmoke` + `gotoSmoke(deepUrl)`** 复开帖；**`like-persist`** 去幂等 **`dup POST`** / **`/me/likes`** 探针（**`user_liked_post`/`get_detail`** 已对齐）。**承** **v1.0.38**。 |
| 1.0.38 | 2026-05-14 | **§1 Community**：**`like`/`collect` persist** 写后读回改 **Playwright `request` + `API_BASE` + 同用例 `apiLogin` `token`**（与 **`gotoWithBearerSession`** 同源；**`page.evaluate` + 相对 `/api/…`** 在本栈对 **`liked_by_me`/`collected_by_me`** 断言不可靠）；**`useCommunityFeedPostDeepLink`** 列表命中帖 **`likedByMe`/`collectedByMe` 缺一** 时 **`getPostById`** 补全；**`handleLike`/`handleCollect`** 详情抽屉传 **`serverLiked`/`serverCollected`**。**承** **v1.0.37**。 |
| 1.0.37 | 2026-05-14 | **§1 Community**：**`community-post-detail-collect-persist-after-reload.spec.ts`**（**`POST …/collect`** **`waitForResponse`** **`status=ok`** → **reload** → 书签 **SVG** **`fill="currentColor"`**）；**`p0-routes`** **`existingE2e`** 增列。**承** **v1.0.36**。 |
| 1.0.36 | 2026-05-14 | **Market E2E**：**`e2e/helpers/marketStudioOpen.ts`**（创作台 **scroll+click** + **`data-tt`** 壳再 **`#m-studio-title`/`#a-studio-title`**）；**`market-subsite-studios.body.ts`** 接入；**`p0-routes.helpers_canonical`** 增列；**`market-subsite-community-media`/`gates`** 未用 import 清理（承前轮 **`market-subsite-studios`** 全矩阵超时修补）。**承** **v1.0.35**。 |
| 1.0.35 | 2026-05-14 | **§1 Community**：**`community-post-detail-like-persist-after-reload.spec.ts`** + **`p0-routes`**；**`lib/api/url.ts`** loopback **`/api/*`** 同 origin；**`onPostCollectResolved`→`detailPost.collectedByMe`**。**承** **v1.0.34**。 |
| 1.0.34 | 2026-05-14 | **§1 Community**：**`community-post-detail-comment-reply-thread.spec.ts`**（**`parent_id`** 二级回复在详情抽屉可读）；**`p0-routes`** **`existingE2e`** 增列。**承** **v1.0.33**。 |
| 1.0.33 | 2026-05-14 | **§1 Community**：**`community-post-detail-comment-sort.spec.ts`**（帖子详情 **评论排序** 与 **`GET …/comments`** `sort=latest` / `sort=hot` / **时间序** `limit=` 对拍）；**`p0-routes.v1.json`** **`p0.community.feed`** **`existingE2e`** 增列。**承** **v1.0.31**。 |
| 1.0.31 | 2026-05-08 | **§2 SSOT**：机读闸扫描 **优先 `rg`**、无则 **`find`+`grep`**（与 **`scripts/gates/check-e2e-waitforurl-smoke-convergence.sh`** 头注释同源）；互指 **TT-LOCAL §2.2 v1.0.72**。**承** **v1.0.30**。 |
| 1.0.30 | 2026-05-08 | **§2 SSOT**：机读闸已串 **`local-delivery-expanded.sh`**（**`rg`**；**`CI_LOCAL_SKIP_E2E_WAITFORURL_CONVERGENCE`**）；互指 **TT-LOCAL §2.2 v1.0.71**。**承** **v1.0.29**。 |
| 1.0.29 | 2026-05-08 | **机读闸**：**`scripts/gates/check-e2e-waitforurl-smoke-convergence.sh`**（根薄封装 **`scripts/check-e2e-waitforurl-smoke-convergence.sh`**）+ **§2** 段一句；**04** 契约句互指同闸。**承** **v1.0.28**。 |
| 1.0.28 | 2026-05-08 | **§2 SSOT**：**`e2e/core-path.spec.ts`**、**`e2e/section10-5-login-community-feed.spec.ts`** 文件头补 **`commit`** / **勿用 `waitForUrlSmoke*`** 互指（与 **`clickLoginWaitClientNav.ts`** 对齐）；**§2** 段互指 **TT-96-20-P0** **§6 v1.0.24**。**承** **v1.0.27**。 |
| 1.0.27 | 2026-05-08 | **互指收口**：**04**「Web / E2E」、**53**、**`CONTRIBUTING`**、**`frontend/playwright.config.ts`** 头注、**`e2e/helpers/clickLoginWaitClientNav.ts`** 头注 → **§2** 末 SSOT 段。**承** **v1.0.26**。 |
| 1.0.26 | 2026-05-08 | **§2** 末增 **Playwright 导航 SSOT**（**`waitForUrlSmoke*`** vs **`commit`** 三例外）；与 **04** / **TT-96-20-P0 §6 v1.0.21** / **`smoke-nav.ts`** 头注对拍。**承** **v1.0.25**。 |
| 1.0.25 | 2026-05-07 | **§3** 第 **7** 步链 **`fill-controls-from-source --summary`** + **`audit-controls-vs-source --strict`**（十轮文 **v1.0.28**）。**承** **v1.0.24**。 |
| 1.0.24 | 2026-05-07 | **§3** 第 **7** 步链 **`fill-spec-matrix`** + **`audit-controls-vs-source --strict`**（十轮文 **v1.0.27**）。**承** **v1.0.23**。 |
| 1.0.23 | 2026-05-07 | **§3** 第 **7** 步链 **`generate-machine-stub --bundle`**（十轮文 **v1.0.25**）。**承** **v1.0.22**。 |
| 1.0.22 | 2026-05-07 | **§3** 第 **7** 步链 **`generate-machine-stub`** 占位表（十轮文 **v1.0.24**）。**承** **v1.0.21**。 |
| 1.0.21 | 2026-05-07 | **§3** 第 **7** 步链 **`--require-key-api-signal`**（十轮文 **v1.0.23**）。**承** **v1.0.20**。 |
| 1.0.20 | 2026-05-07 | **§3** 第 **7** 步链 **solo-dev §6.5·12**（**现** **§6.5·14** **附录 E 专项**；条号以 **`solo-dev-rhythm` §6.5** 为准）（十轮文 **v1.0.22**）。**承** **v1.0.19**。 |
| 1.0.19 | 2026-05-07 | **§3** 第 **7** 步链 **D.1.2 merge → D.1.1 validate**（十轮文 **v1.0.21**）。**承** **v1.0.18**。 |
| 1.0.18 | 2026-05-07 | **Status** 补 **独立开发 / 无 PR** 互指 **§0.0**（十轮文 **v1.0.20**）。**承** **v1.0.17**。 |
| 1.0.17 | 2026-05-07 | **§3** 第 **7** 步链校验脚本 **`--require-controls-tag` / `--strict-b-axes`**（十轮文 **v1.0.19**）。**承** **v1.0.16**。 |
| 1.0.16 | 2026-05-07 | **§3** 第 **7** 步链 **`tt-96-20-appendix-e-validate.sh`**（十轮文 **v1.0.18** **附录 D.1.1**）。**承** **v1.0.15**。 |
| 1.0.15 | 2026-05-07 | **§3** 第 **7** 步链 **§0.3.4 DoD**（**123** **`page.tsx`** 并集；十轮文 **v1.0.17**）。**承** **v1.0.14**。 |
| 1.0.14 | 2026-05-07 | **§3** 第 **7** 步链 **§0.3.3 `matrix:`**（**93/96-20/13-1** 闭包；十轮文 **v1.0.16**）。**承** **v1.0.13**。 |
| 1.0.13 | 2026-05-07 | **§3** 第 **7** 步链 **B.3 / E.2.2**（**`data-tt-*`→`tt:`**，十轮文 **v1.0.15**）。**承** **v1.0.12**。 |
| 1.0.12 | 2026-05-07 | **§3** 第 **7** 步链 **`controls_notes`**（十轮文 **v1.0.13**、骨架脚本 **14 列**）。**承** **v1.0.11**。 |
| 1.0.11 | 2026-05-07 | **§3** 第 **7** 步链 **附录 B.1/B.2**（**`nav`/`cta`/`browse`**，十轮文 **v1.0.12**）。**承** **v1.0.10**。 |
| 1.0.10 | 2026-05-07 | **§3** 第 **7** 步链 **§0.5** 报告、**附录 E.2.1**（十轮文 **v1.0.11**）。**承** **v1.0.9**。 |
| 1.0.9 | 2026-05-07 | **§3** 第 **7** 步链 **§0.4.4** Tier、**附录 F** npm 竖切（十轮文 **v1.0.10**）。**承** **v1.0.8**。 |
| 1.0.8 | 2026-05-07 | **§3** 第 **7** 步链 **附录 C.1** `rg`（十轮文 **v1.0.9**）。**承** **v1.0.7**。 |
| 1.0.7 | 2026-05-07 | **§3** 第 **7** 步链 **§0.3.2**、**§0.4.3**（十轮文 **v1.0.8**）。**承** **v1.0.6**。 |
| 1.0.6 | 2026-05-07 | **§3** 第 **7** 步链 **`scripts/tt-96-20-appendix-e-skeleton.sh`**（十轮文 **v1.0.7**）。**承** **v1.0.5**。 |
| 1.0.5 | 2026-05-07 | **§3** 第 **7** 步链 **附录 E `layout_sidecar`**、**[E.4](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md#tt-96-20-appendix-e-bucket-refs)**（十轮文 **v1.0.6**）。**承** **v1.0.4**。 |
| 1.0.4 | 2026-05-07 | **§3** 第 **7** 步链 **§0.3.1**、**附录 D.1/D.2**（十轮文 **v1.0.5**）。**承** **v1.0.3**。 |
| 1.0.3 | 2026-05-07 | **§3** 第 **7** 步补链 **§0.4.2**、**附录 G**。**承** **v1.0.2**。 |
| 1.0.2 | 2026-05-07 | **§3** 第 **7** 步补链 **十轮文** **附录 E / F**（逐页表 + 烟测 ↔ R）。**承** **v1.0.1**。 |
| 1.0.1 | 2026-05-07 | **§3** 增第 **7** 步互指 **十轮 UI/UX**；**§4** 互指增 **[TT-96-20-UI-UX-TEN-ROUND…](TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)**。**承** **v1.0.0**。 |
| 1.0.0 | 2026-05-07 | 首版：**P0 lane** 对照表 + **chromium** 补充摘录 + **①** 执行顺序。 |

---

**文档结束**
