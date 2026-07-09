# TT-31-STRUCTURED-GAP-CATALOG-001 · 社区线 · 结构化缺口目录（总表 + 摘录）

**Version:** 1.0.32  
**Status:** `Active`（**导航真值**；**不**替代 **[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**、**[TT-NEXT-BATCH](TT-NEXT-BATCH-BACKLOG-001.md)**、**[31 企业级 UI](../spec/31-TT社区-企业级UI检查-未完成与待优化.md)** 正文）  
**阶次：** 进度须标明 **① 本地** / **② 测试网** / **③ 生产**；**禁止跳阶**；**禁止假完成**（与 **[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9628 · §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)** 同源）。

**稳定锚：** [`#tt-31-gap-catalog`](#tt-31-gap-catalog) · [`#tt-31-gap-a`](#tt-31-gap-a) · [`#tt-31-gap-b`](#tt-31-gap-b) · [`#tt-31-gap-c`](#tt-31-gap-c) · [`#tt-31-gap-d`](#tt-31-gap-d) · [`#tt-31-gap-mock-reality`](#tt-31-gap-mock-reality) · [`#tt-31-gap-reality`](#tt-31-gap-reality)

---

<a id="tt-31-gap-catalog"></a>

## 0. 本文用途

把 **31 社区线** 常见 backlog 收成 **一张可深链的目录**：前段 **A** 为仓库已登记的权威真源；**B** 为 **[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-31-community)** **§2～§3** 的「深产品面」摘录；**C** 为跨域「机读绿 ≠ 深度收口」摘要；**D** 为 **HTTP 429 / Retry-After** 与前端对齐的**诚实状态**与代码指针。

**与全站：** 本目录 **不等价** 于 **93** 全矩阵、**96-20** 全路由、**96-15 Tier C** 已闭；见 **A1**、**A2**。

**①②③ 契约对齐：** 社区 API 的 **HTTP 状态码、JSON 信封、`Retry-After`、根级 `retry_after_sec`**（**`response_community_abuse`** 写入，与头同源秒；全局限流等仍可有 **`retry_after_seconds`**，**`coalesceRetryAfterSecondsFromJson`** 并读）由 **`crates/api`** 与 **[04 §三 / §3.3](../spec/04-后端与API.md)** 定义；前端经同一套 **`parseResponse` / `throwUnlessApiOk` / `community.ts` · `merge429RetryAfterFromResponse` / `interpretCommunityWriteError`** 消费。**不**因 **`NEXT_PUBLIC_API_BASE_URL`** 指向本地、测试网或生产而改变解析规则——环境差异仅在于是否启用真实限流与网关行为，**契约面**须一致。

---

<a id="tt-31-gap-a"></a>

## A. 总表 / 覆盖边界（权威）

| 序号 | 缺口 / 边界说明 | 真源文档（仓库内） |
|------|-----------------|-------------------|
| **A1** | 本地机读绿 ≠ 全站 UI / **93** 矩阵 / **96-15** Tier C / **96-20** 全路由 PASS | [TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)（[`#tt-gate-intro`](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-intro)） |
| **A2** | 页面 / 功能 / 弹窗 / 分权限：文档不保证已穷举验证 | [TT-9628-main-line-vs-branch-lines-delivery.md · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) |
| **A3** | 下一批执行总表（拆 PR / 指针） | [TT-NEXT-BATCH-BACKLOG-001.md](TT-NEXT-BATCH-BACKLOG-001.md)（**Active**；与 **TT-GATE** §2～§3、**本表 [§4 · `#tt-31-gap-mock-reality`](#tt-31-gap-mock-reality)** 对读） |
| **A4** | **96-20**：路由矩阵「待核验 → PASS」证据规则 | [96-20-前后端页面对齐与UI生产级审计报告.md](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)（约 §0.2、§5） |
| **A5** | **93** 域矩阵：§8 / §8.0 声明非目标与边界 | [93-全站功能验证矩阵-域别回归清单.md](../spec/93-全站功能验证矩阵-域别回归清单.md) |
| **A6** | 社区企业级 UI：未完成与待优化（**31** 线） | [31-TT社区-企业级UI检查-未完成与待优化.md](../spec/31-TT社区-企业级UI检查-未完成与待优化.md) |
| **A7** | 缺口官方总表（P0 等） | [缺口与待补-官方总表.md](../spec/缺口与待补-官方总表.md)（与 **[go-live-checklist.md](../go-live-checklist.md)**、**[runbook/go-live-checklist.md](./go-live-checklist.md)**、阶次同读） |

---

<a id="tt-31-gap-b"></a>

## B. TT-GATE 里单独登记的「深产品面」缺口（目录摘录）

完整表格与建议轨道见 **[TT-GATE 正文 §2～§3](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-31-community)**。

| 序号 | 主题 | 缺口性质 |
|------|------|----------|
| **B1** | Feed / 详情真实视频流、全屏层播放器、交互体验 | 非默认本地 exit；需专项 / 抽样手验或 E2E |
| **B2** | 横屏 / 全屏 / 旋转 | 手验 + 专项 |
| **B3** | 评论：层级、分页、排序全形态与 **04** 契约一致 | API + **93** + Tier C |
| **B4** | 赞 / 藏 / 关注全路径与刷新后一致 | 跨页同源、非单文件 E2E 可证 |
| **B5** | 举报与审核全链路展示与状态 | 产品 + Tier B/C |
| **B6** | 发现 / 搜索 / 话题 / 活动 | **96-20** 路由矩阵 + 排期 |
| **B7** | 上传安全端到端与白名单 / 体限 | **59** 九维 + 契约测 |
| **B8** | 封面 / 转码 / CDN | 偏 **②③**，非 **①** 默认 |
| **B9** | 「我的」：头像、资料、浏览记录、赞过与隐私 | **96-17** + **31** §2.8 等 |
| **B10** | 社区规范 / 法务正文页 | 内容闸 / Tier C |
| **B11** | **31** 附录 × **04** 路由字段长期一致 | **04** SSOT + `bash scripts/run-check-04-routes.sh` |

---

<a id="tt-31-gap-c"></a>

## C. 跨域「机读绿 ≠ 深度收口」类（TT-GATE §3 摘要）

| 序号 | 域 | 说明 |
|------|-----|------|
| **C1** | 市场 / escrow / 支付全链 | **①** 有切片；**②** mock-pay / **③** PSP 另闸 |
| **C2** | Admin / internal / 治理写路径 | RBAC 交叉、审计枚举 |
| **C3** | DidRank / 治理只读 | 榜单与边界角色 |
| **C4** | Onboarding **96-18** | **②** webhook / PSP 等另闸（**[TT-9618](TT-9618-onboarding-local-testnet.md)**） |
| **C5** | 全站 i18n / a11y | `test:i18n:ci`、**96-13**、**96-16** 等 |
| **C6** | 订单步骤条 / 窄屏侧栏 | **96-16** D3 等 |
| **C7** | 发现 / 消息 / 好友全边界 | **93** §8.0 边界 + 手工长尾 |

---

<a id="tt-31-gap-d"></a>

## D. 社区 + HTTP 429 对齐（诚实说明）

| 序号 | 项 | 状态 |
|------|-----|------|
| **D1** | **HTTP 429** / **`Retry-After`** / `retry_after_*` 与前端、`throwUnlessApiOk`、`interpretCommunityWriteError`、E2E 退避 | **①** 已落地：**全局限流 / 关键写限流 / `guides/upload-doc` / 证据·评价 per-minute**、**`POST /auth/login`（PG `AUTH_LOGIN_*` 三桶、`chain_off/auth/login.rs`、`routes/auth.rs`、`status_json_response_with_429_retry_header`；`parseResponse` 显式 `auth_login_*_rate_limited`、`mapOrderWriteError` → `auth_login_error_rateLimited`）** 与 **社区反刷** 同源 **`Retry-After` + 体 `retry_after_sec`（及 `retry_after_seconds`）**（**`crates/api/src/middleware/rate_limit.rs`**、**`routes/guides.rs`**、**`chain_off/{evidence,reviews}.rs`**、**`routes/orders/reviews.rs`**/**`routes/evidence.rs`** **`status_json_response_with_429_retry_header`**、**`routes/community/common/`**（**`abuse`/`limits`/`feed_posts_json`/`comments_thread`/`embedded_http_urls`**））。**浏览器 / `fetch`** 路径见 **`frontend/lib/apiClient/core/`**（`attach429RetryAfterToError`、`coalesceRetryAfterSecondsFromJson`、`waitMsFromRateLimitHttpSnapshot`）、**`community.ts`**（`merge429RetryAfterFromResponse`）、**`formatCommunityApiMessage.ts`**；单测 **`formatCommunityApiMessage.test.ts`**、**`core.test.ts`**。**Playwright `request`**：订单写见 **`e2e/helpers/bilateralEscrowE2e.ts`** → **`rateLimitBackoffMs`**；社区见 **`e2e/helpers/playwright429Backoff.ts`** + **`e2e/helpers/idempotencyKey.ts`**：**`*ExpectOkWith429Backoff`**、**`*With429Retry`**、**`PATCH`/`DELETE`** 助手。已接：**`f007-f010-f032`**、**`f012-f014`**、**`f018-f020`**（含 **`DELETE` like/collect、market-bookmarks** **`requestDeleteExpectOkWith429Backoff`**）、**`f024-f026`**、**`f027-f033`**、**`f029-f031`**、**`f015-f017`** **`DELETE`**、**`orders-b-domain`** 等：**`${API_BASE}`/`${apiBase}`** 路径 **`GET`/`POST`**（含 **`/api/v1/*`**、**`/auth/register`**；**`GET /health`** 经 **`skipIfApiDown`**（**`defaultApiHealthUrl`**；成功 **`APIResponse`** 可复用断言 **`ok`**；**`*.spec.ts`** **不**手写 **`const API_HEALTH`**）；多行 **`post`/`get`**；链式 **`.post(\`${…}/auth/seed-test-accounts`**）**`requestGetWith429Retry`/`requestPostWith429Retry`**；**`93-matrix-admin-deep-batch`** 向导 **`PATCH`** **`requestPatchExpectOkWith429Backoff`**；**`setup/meta-chain-contracts`** **`getMetaJsonWithRetry`**；**`93-matrix-*`**、**B-463～469**、**P01～P05**、**`auth-forgot-password-api-happy`**/**`auth-register-login-market-chain`**/**`section10-5-login-community-feed`**/**`market-custom-itinerary-dual-role-ui`**、**smoke**/**core-path**、**auth**、**`me-onboarding`**、**`epic-f`**、**`tt-93`** 等；**`metaFetchRetry`** **内层** **`requestGetWith429Retry`**；**`metaChainGuard.fetchMetaJson`**（**`fetch`**）**429** **一次重试**；**`apiSession`/`bilateralEscrowE2e`/种子向导 helpers/mock-pay 探针** **`POST`** **`requestPostWith429Retry`**；**`/auth/*` `POST`**（**login/logout/…**）**`requestPostWith429Retry`**。**②③** spot check 同前。 |
| **D2** | 「所有页面所有按钮」因上述对齐而全部可用 | **未**验证；须按 **96-20** / **93** / Playwright 矩阵 **单独排期**（与 **A1**、**A2** 同键）。 |

---

<a id="tt-31-gap-mock-reality"></a>

## 4. 真完成 · 假绿 ·「mock / 替身」口径

**目的：** 把「**禁止 mock**」与仓库真实做法对齐：**禁的是用替身冒充阶次与矩阵收口**，**不是**一律禁止单元测里的 **`Response` 形状桩**（否则无法稳定验 **`retryAfterSecondsFrom429Response`** 等分支）。

| 口径 | 含义 |
|------|------|
| **契约真完成（可跨 ①②③）** | **同一套** **`parseResponse` / `throwUnlessApiOk` / `merge429RetryAfterFromResponse` / `interpretCommunityWriteError`** 消费 **04** 定义的 **HTTP 状态、JSON 信封、`Retry-After`、`retry_after_*`**；换 **`NEXT_PUBLIC_API_BASE_URL`** 指向本地 / 测试网 / 生产时，**解析规则不得分叉**（与 **§0**「①②③ 契约对齐」同句）。 |
| **① 本地「绿」证明什么** | **`cargo test -p traveltrust-api`**、**Vitest**、**`npm run check:e2e:tsc`** 等证明 **编译 + 契约回归**；**不**等价 **96-20 全路由**、**93 穷举**、**96-15 Tier C**、**③ 生产已验**（**A1**、**A2**）。 |
| **允许的测试替身** | 单测里 **`Response`** 仅提供 **`status` / `json()` / `headers`**（与浏览器 **`fetch` Response** 一致）以验解析器；**缺 `headers.get` 时返回 `null`**、由体字段 **`retry_after_*`** 回落，与 **`core.ts`** 注释同源。**仍不**等价「全站手验 / Tier C 已闭」。 |
| **禁止的假绿** | 用 **`page.route` 拦截并返回手写 JSON** 冒充「全矩阵 / 生产长尾已验」；用 **ISS-007 窄切片 `PARTIAL_GO`** 冒充 **staging 全矩阵 `GO`**；用 **①** 冒充 **②③**（**[CONTRIBUTING#no-false-completion](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9628 §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)**）。 |
| **`mock-pay`（②）** | 订单 **`mock-pay` / Stripe test mode** 是 **②** 环境名与网关行为，**轨别不同**于「手写假 JSON 当验收」；**③ PSP 真扣款** 仍须 **另闸**（**C1**、**96-18**、**TT-9618**）。 |

**本表默认承诺边界：** 未单独写明 **②** 或 **③** 时，只陈述 **①** 证据；**②③ 真实完成** 须在进度句中标明阶次并附对应环境证据。

---

<a id="tt-31-gap-reality"></a>

## 5. 代码对拍 · 真实状态（防「清单滞后」）

以下按 **当前仓库实现** 核对 **§B** 常见「未完成」表述：**实现已有 ≠ 生产已验 ≠ 文档已写**。阶次仍须自报 **① / ② / ③**。

| 摘录序号 | 文档 / 口头常见说法 | 代码侧事实（对拍入口） | 仍应视为缺口时，指什么 |
|----------|---------------------|------------------------|-------------------------|
| **B1** | 「视频仍是占位、无真播放」 | **已有**可播放链路：`PostDetailDrawer` 内 **`<video controls>`**；**`CommunityVideoOverlay`**（竖滑切条、默认静音、**Fullscreen API**）；**`resolveCommunityPostPlayableVideoUrl`**（`communityFeedMappers.ts`，挑 `mp4/webm/mov/…`）；**`market-subsite-studio-and-community-publish.spec.ts`** 有小 **MP4** 发帖闭环。 | 缺的是**平台级**能力：多码率 **HLS**、统一 **CDN/转码**、弱网与失败降级策略、与 **B8** 绑定的存储 SLA；以及 **93 / Tier C** 级手验结论，**不是**「完全没有 `<video>`」。 |
| **B2** | 「全屏 / 横屏未做」 | **`CommunityVideoOverlay`** 监听 **`fullscreenchange`**，与全屏态联动。 | 各机型**横竖屏旋转**、刘海安全区、浏览器差异仍需 **手验 / 专项** 留证。 |
| **B3** | 「评论排序 / 分页未对齐」 | **`getPostComments`**（`community.ts`）传 **`sort` / `limit` / `cursor`**，与 **`chronological` / `latest` / `hot`** 对齐；**`CommentDrawer`** 接排序切换与加载更多。 | **04** 全文对拍、**93** 矩阵、**Tier C** 交叉仍可能未勾选。 |
| **B4** | 「赞藏数字与刷新一致未做」 | **`displayLikeCountFromServerAndUi`** / **`displayCollectCountFromServerAndUi`**（`communityFeedMappers.ts`）用于 **Feed 大卡 / 紧凑卡 / 详情抽屉**；**`communityFeedMappers.likeCollectDisplay.test.ts`**（及 **`postRoleMedia`/`commentsAndThreadCounts`** 同伴切片）有回归；**`useCommunityFeed` 再导出映射** 见 **`useCommunityFeed.roleAndPill.test.ts`/`mapApiPost.test.ts`/`mapApiComment.test.ts`**（**①·20** 合计）。 | **跨页 / 冷启动 / 多 Tab** 仍须 **E2E + 手验** 收口，单测**不**等于全站。 |
| **B5** | 「举报审核全链路未完成」 | 前端有举报抽屉、**`/community/me/reports`** 等；**API** 有 **`f018`** 类用例。 | **Admin 审核台**、状态机、内容与 **Tier B/C** 证据另表。 |
| **B6** | 「发现 / 搜索只有排期」 | 社区内有 **Feed 过滤 / 搜索框**（如 **`CommunityFeedFilterBar`**）等实现，程度依路由而定。 | **96-20** 逐路由 **PASS**、与 **04** 字段一致仍须矩阵勾选。 |
| **B7** | 「上传安全未做」 | **API** 侧 **`media_upload`**、**`core.test.ts`** / **`communityApiMessageCodes`** 等与体限、MIME 相关；前端 **PublishDrawer** 有模式与校验。 | **59** 九维、恶意样本、**②③** 网关体限与 **B8** 一致化。 |
| **B8** | 「封面 / CDN / 转码」 | 帖子模型有 **`cover_url`**；缩略图策略见 **`communityPostGridThumbRaw`**。 | **对象存储 + CDN + 转码流水线** 多为 **②③** 基建与运维闸，**①** 单测**不**证明。 |
| **B9** | 「头像 / 简介纯待后端」 | **滞后表述**：**`putMe`** 已支持 **`bio` / `avatar_url`**（`me.ts`）；**`CommunityMeAccountPanel`** 含头像上传与 bio 展示/入口。**`communityMeFeatureFlags.ts`**：**bio 默认关**，须 **`NEXT_PUBLIC_COMMUNITY_ME_BIO=1`**；**production** 还须 **`NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION=1`**。头像上传：**production 默认关**（未配 env 时），非 production 默认更宽松。赞过列表 env 见同文件。 | 真实缺口多为**运营策略**（何时默认开）、**浏览记录**等产品功能是否齐、**②③** 真数据验证；非「API 不存在」。 |
| **B10** | 「规范页未完成」 | **`/terms/community-guidelines`** 有 **i18n** 原则列表；源码仍标 **占位 / 待法务**（`page.tsx` 注释）。 | 与 **B10** 一致：缺**法务定稿正文**与 **Tier C** 内容闸。 |
| **B11** | 「31 附录与 04 路由」 | 须以 **`bash scripts/run-check-04-routes.sh`** + **04** 正文为 SSOT；改路由时跑脚本。 | 文档易滞后于代码；以**机读脚本 + 04** 为准。 |

**小结：** **TT-GATE §B** 里多条是 **「深度验收 / 基建 / 矩阵未勾选」**，不是 **「仓库里一行播放器都没有」**。更新 backlog 时优先引用上表 **「代码侧事实」** 列，避免重复立项已实现能力。

---

## 6. 变更记录（本篇）

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.32 | 2026-05-04 | **D1**：`POST /auth/login` PG 限流 `Retry-After`（`chain_off/auth`、`routes/auth`）；前端 `parseResponse` · `auth_login_*`、`mapOrderWriteError` · `auth_login_error_rateLimited`（zh/en）。 |
| 1.0.31 | 2026-05-04 | **D1**：**`routes/orders/reviews`**、**`routes/evidence`** 经 **`chain_off::status_json_response_with_429_retry_header`** 对 **429** 补 **`Retry-After`**（与体 **`retry_after_*`** 同源）；**`chain_off/json_response`** 单测。 |
| 1.0.30 | 2026-05-04 | **D1 / A8**：全局限流、关键写限流、**`guides/upload-doc`**、证据/评价 per-minute **429** 与 **`parseResponse` · `attach429RetryAfterToError`** 同源（**`Retry-After`** + **`retry_after_sec`**/**`retry_after_seconds`**）；**`middleware::rate_limit`** **`tokio` 测**。 |
| 1.0.29 | 2026-05-04 | **①②③**：**`response_community_abuse`** JSON 根级 **`retry_after_sec`** 与 **`Retry-After`** 同源（**04** TT 社区条、**`community_abuse_response_tests`**）；网关剥头时体仍可读秒。 |
| 1.0.28 | 2026-05-04 | 增 **§4 · `#tt-31-gap-mock-reality`**（真完成 / 假绿 / 单测 **`Response` 桩** vs **`page.route` 假 JSON** vs **`mock-pay`②** 分轨）；**A3** 标明 **TT-NEXT Active**；**A7** 双链 **go-live**（`docs/` 与 **runbook/**）。 |
| 1.0.27 | 2026-05-04 | **D1**：**`retryAfterSecondsFrom429Response`** 防御 **`Response.headers`** 缺省（与 **`community.ts`** **`merge429RetryAfterFromResponse`** 体 **`retry_after_*`** 回落一致）；**`CONTRIBUTING`** **pre-push** 增 **A8** 行；与 **TT-NEXT A8** **v1.0.49** 对拍。 |
| 1.0.26 | 2026-05-04 | **D1**：**`solo-dev-rhythm` §6.5** 增 **A8 本地真验**（**Vitest** 四文件 + **`check:e2e:tsc`**；**真栈 Playwright** 须 **API+PG**；**`P3_CHAIN_OFF` mock-pay** 与 **`page.route` 假 JSON** 分轨）；与 **TT-NEXT A8** **v1.0.48** 对拍。 |
| 1.0.25 | 2026-05-04 | **D1**：**`skipIfApiDown`** **`APIResponse`** 返回 + **`e2e/*.spec.ts`** 去 **`const API_HEALTH`**（**P01～P05**、**B-463～469**、**`93-matrix-path-*`**、**`auth-forgot-password-api-happy`**、**`auth-register-login-market-chain`**、**`section10-5-login-community-feed`**、**`market-custom-itinerary-dual-role-ui`** 等）；**`seed`/`login` `POST`** **`requestPostWith429Retry`**；与 **TT-NEXT A8** **v1.0.47** 对拍。 |
| 1.0.24 | 2026-05-04 | **D1**：**§8.2** 余量 **`request.post` → `requestPostWith429Retry`**（注册/登录链）；**`market-subsite`** **`skipIfApiDown` `beforeEach`**；**`auth-login-logout-me`** / **`me-security-community-hub`** 探活与 **`auth` POST** 同源退避；与 **TT-NEXT A8** **v1.0.46** 对拍。 |
| 1.0.23 | 2026-05-04 | **D1**：**`skipIfApiDown`** 真源 **`e2e/helpers/skipIfApiDown.ts`**（**§8.2** 广面去重）；**`f024`** 仲裁 **`auth` `POST`** **`With429Retry`**；**`f024`** JSDoc **`**/`** 卫生；与 **TT-NEXT A8** **v1.0.45** 对拍。 |
| 1.0.22 | 2026-05-04 | **D1**：**`community-me-hub-notes-drawer-ia`** **`POST /auth/login`** **`requestPostWith429Retry`**；**`check:e2e:tsc`** / **`e2e/tsconfig`**（**①** 语法闸；**`strictNullChecks`** **e2e-only**）；**`smoke-nav`** **`goto` 类型**；**`meta-chain-contracts`** **`MetaJson` 收窄**；与 **TT-NEXT A8** **v1.0.44** 对拍。 |
| 1.0.21 | 2026-05-04 | **D1**：**`f015`/`f018`** **`DELETE`** **`requestDeleteExpectOkWith429Backoff`**（**`Idempotency-Key`**）；**`93-matrix-admin-deep-batch`** **`PATCH`** **`requestPatchExpectOkWith429Backoff`**；与 **TT-NEXT A8** **v1.0.43** 对拍。 |
| 1.0.20 | 2026-05-04 | **D1**：**`e2e/*.spec.ts`** **`GET`/`POST`** 广面 **`With429Retry`**（**`/api/v1/*`**、**`/auth/register`**、**`API_HEALTH`**、多行/链式 **`auth/seed-test-accounts`**）；**`setup/meta-chain-contracts`** **`getMetaJsonWithRetry`**；与 **TT-NEXT A8** **v1.0.42** 对拍。 |
| 1.0.19 | 2026-05-04 | **D1**：**31** 份 **`e2e/*.spec.ts`** **`/auth/*` `POST`** → **`requestPostWith429Retry`**（与 **TT-NEXT A8** **v1.0.41** 对拍）。 |
| 1.0.18 | 2026-05-04 | **D1**：**E2E shared helpers** **`POST`** **`requestPostWith429Retry`**（**`apiSession`**、**`bilateralEscrowE2e`**、**`releaseSeedGuideSlot`**、**`guideSeedGuideRowId`**、**`skipUnlessOrderMockPayAvailable`**）；与 **TT-NEXT A8** **v1.0.40** 对拍。 |
| 1.0.17 | 2026-05-04 | **D1**：**`fetchMetaJson`** **`fetch`** **429** 退避 + 单次重试（**`waitMsFromRateLimitResponse`**）；与 **TT-NEXT A8** **v1.0.39** 对拍。 |
| 1.0.16 | 2026-05-04 | **D1**：**`metaFetchRetry`** 叠 **`requestGetWith429Retry`**；**`metaChainGuard`** 注释对拍；与 **TT-NEXT A8** **v1.0.38** 对拍。 |
| 1.0.15 | 2026-05-04 | **D1**：**E2E** 探活 **`GET /health`**（**`defaultApiHealthUrl`**）及 **93 admin** **`GET /meta`** 广面 **`requestGetWith429Retry`**；**`e2e/*.spec.ts`** 无 **`request.get`**；与 **TT-NEXT A8** **v1.0.37** 对拍。 |
| 1.0.14 | 2026-05-04 | **D1**：**`f029-f030-f031-request`** **`GET /health`/`/meta`**、**`epic-f-normal-release-real`** **`GET /meta`** **`requestGetWith429Retry`**；与 **TT-NEXT A8** **v1.0.36** 对拍。 |
| 1.0.13 | 2026-05-04 | **D1**：**B-463/B-465/B-467/B-468** **`expect.poll`** **`GET …/orders/:id/reviews`** **`requestGetWith429Retry`**；与 **TT-NEXT A8** **v1.0.35** 对拍。 |
| 1.0.12 | 2026-05-04 | **D1**：**F-015～017** **`Idempotency-Key`** 全覆盖；**B-464** **`POST`** 收口；**F-021** 共享 **`idempotencyKey`**；与 **TT-NEXT A8** **v1.0.34** 对拍。 |
| 1.0.11 | 2026-05-04 | **D1**：**`idempotencyKey.ts`**；**F-007/012/018/024/027/029**、**`orders-b`**、**93 F1–F4**、**B-463～466**、**P03～P05**、**`releaseSeedGuideSlot`** 等 **`/api/v1` `POST`** 与 **TT-NEXT A8** **v1.0.33** 对拍。 |
| 1.0.10 | 2026-05-04 | **D1**：**`playwright429Backoff`** **`PATCH`**；**admin deep** 内 **`POST`/`PATCH`** 扩面；**Epic F** 订单 **`POST`** 链 + **`Idempotency-Key`**；**onboarding** 可选 **`POST`** **`With429Retry`**；与 **TT-NEXT A8** **v1.0.32** 对拍。 |
| 1.0.9 | 2026-05-04 | **D1**：**93 admin deep**、**enterprise P1**、**onboarding shell**、**Epic F**、**TT-93 accept**、**种子向导 helper**、**P04 readOrder**；与 **TT-NEXT A8** **v1.0.31** 对拍。 |
| 1.0.8 | 2026-05-04 | **D1**：**93 DID 榜**、**market-deep-link**、**auth /me**、**P02～P05** 等 E2E **`GET`** 退避；与 **TT-NEXT A8** **v1.0.30** 对拍。 |
| 1.0.7 | 2026-05-04 | **D1**：**F-018～F-020** bookmarks、**F-007/024～027/029**、**`orders-b`** 等 **`GET`** 退避扩面；**F-030** **`With429Retry`**；与 **TT-NEXT A8** **v1.0.29** 对拍。 |
| 1.0.6 | 2026-05-04 | **D1**：**F-021～F-023**、**F-031** **listing/帖/follow `POST`** 接退避 + **`Idempotency-Key`**；与 **TT-NEXT A8** **v1.0.28** 对拍。 |
| 1.0.5 | 2026-05-04 | **D1**：**`playwright429Backoff`** 扩 **market-subsite** 市场 listing **`GET`**、**F-014**/**F-031** **`GET /api/v1/me`**；与 **TT-NEXT A8** **v1.0.27** 对拍。 |
| 1.0.4 | 2026-05-04 | 增 **§5 代码对拍 · 真实状态**（`#tt-31-gap-reality`）：**B1/B2/B3/B4/B9/B10** 等与实现核对，防清单滞后。 |
| 1.0.3 | 2026-05-04 | **D1**：**93-matrix** 社区路径、**market-subsite** 详情 **`GET`**、**community-me-data-state** 发帖；**`*With429Retry`**；**F-015** **`expect.poll`** 内 **`GET`**。 |
| 1.0.2 | 2026-05-04 | **D1**：**`playwright429Backoff`** 扩至 **F-015～017**、**F-018～019（社区）**、**F-031（社区）**；增 **`DELETE`** 退避。 |
| 1.0.1 | 2026-05-04 | **D1**：补 **F-014** **`playwright429Backoff`** 与 **`bilateralEscrowE2e`** 同源 **E2E** 退避说明。 |
| 1.0.0 | 2026-05-04 | 首版：**A～D** 结构化目录 + **①②③** 契约对齐说明；互指 **TT-GATE** / **TT-NEXT** / **31** / **04**。 |

---

## 7. 反向互指（谁在链到本文）

| 文档 | 位置 |
|------|------|
| [31-TT社区-企业级UI检查-未完成与待优化.md](../spec/31-TT社区-企业级UI检查-未完成与待优化.md) | 读前摘要 |
| [TT-NEXT-BATCH-BACKLOG-001.md](TT-NEXT-BATCH-BACKLOG-001.md) | §0 读前互指 |
| [TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md) | §5 互指索引 |

**End of TT-31-STRUCTURED-GAP-CATALOG-001**
