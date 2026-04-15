# TravelTrust · AI 任务卡索引（Low-Latency 执行）

> **开卡总规则（必须遵守）**  
> 从母表 **B-xxx** / [缺口官方总表](spec/缺口与待补-官方总表.md) / 各 **spec** 之 **Target / Partial** 句生成候选 → 先做**信息价值**与**双源风险**判断（**可否决**）→ **必须**先落 [任务母表.md](./任务母表.md) **新行或更新行** → 再生成 **TT** → **最后**才允许写代码。  
> **禁止**仅依据 [07-开发流程与顺序.md](spec/07-开发流程与顺序.md) 直接生成或执行任务卡。  
> **单人开发默认**：**母表 B-xxx → TT → 代码**；**push 前** **`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** + **`bash scripts/check-pr-crates-needs-metadata.sh main HEAD`**（**或** **`bash scripts/dev-preflight.sh`** 一键）；第三条若 **stderr 有提醒**，表示 **`crates/**`**、须登记 **`contracts/**`**、须登记 **`frontend/**`** 或 **B-158 lockfile** 与母表/索引**未同批**，**补齐再 commit**（**元数据门禁 · B-145 + B-147 + B-158**，**非** PR gate）。详见 **[04 · 零、](spec/04-后端与API.md#ssot-gate-pre-tt)**；走 **GitHub PR** 时另有 **workflow** 可重复提醒。
>
> **单人维护（本仓库常态）**：**不**要求 Pull Request；**同批 / 封口 / 刷新审计件**指 **同一批 commit**（或紧邻小提交）内与 **母表·TT·spec** 对齐。**验收**以 **本地脚本**为准。脚本名 **`check-pr-crates-needs-metadata.sh`** 含 `pr` 为历史命名，**语义仍是 commit / push 前元数据检查**（**B-145**）。

**上一层（任务从哪来）**：全项目 Backlog 见 **[任务母表.md](./任务母表.md)**。流程：**spec/需求 → 母表 `B-xxx` → 本索引 `TT-xxx` → 执行**。本文件**不**替代母表，只承载 **可执行** 的 TT 定义。

**1 人极简 · 演示优先（可选）**：阶段排序与周节奏见 **[路线图-1人开发极简版.md](./路线图-1人开发极简版.md)**。此模式下 **TT 状态 = 进度记录**，**不作为**「能否继续开发/合并」的硬门禁（**资金与 04 契约变更除外**）；聚合目标见 **[TT-SOLO-ROADMAP-MVP-001](#tt-solo-roadmap-mvp-001)**。

**用途**：你说 **「按 `docs/AI任务卡索引.md` 执行 TT-XXX」** 或 **「执行任务卡 TT-XXX」** 时，助手以对应条目为唯一范围与验收依据；**不**自动重扫全站、**不**重复展开完整 Task Card 模板。

**执行通则**（与 [AI协作话术-减负与边界.md](./AI协作话术-减负与边界.md) §10 一致）

- 一次只做一个 `TT-xxx`；读文件 ≤8；路径白名单以卡片「本轮仅改」为准。
- 回复默认：**改动点 + 关键理由**；不重复贴「修复前后对比 / 全文件清单」除非卡片写明或你要求展开。
- 若卡片已标 **已封口**：仅当明确说「复核/回滚」时才再动该路径。

---

## 使用说明

1. 在消息里写：**执行任务卡 `TT-XXX`**（或 `TT-XXX-001`）。
2. 可选加 **状态锚点**（推荐）：
   - `已封口：`（本对话中已确认完成的模块）
   - `本轮仅改：`（若与卡片略有出入时覆盖卡片路径，需你显式写出）
   - `禁止再分析：`（额外禁止扫描的目录）
3. 若卡片状态为 **已封口**：默认 **不执行**，除非你写 **「强制复核 TT-XXX」**。

---

## 任务卡一览（按阶段排序）

| 序号 | ID | 阶段 | 状态 | 摘要 |
|------|-----|------|------|------|
| 1 | TT-ACTION-SUCCESS-STATE-PREMATURE-OR-MISLEADING-001 | 状态机 | 已封口 | 成功态勿过早/误导 |
| 2 | TT-ACTION-ERROR-STATE-NOT-CLEARED-ON-RETRY-001 | 状态机 | 已封口 | 重试时清 error |
| 3 | TT-ACTION-STATE-TRANSITION-CONSISTENCY-AUDIT-001 | 审计 | **已封口**（**2026-04-14**） | 全站状态机审计；**高优** **1～4** **已由** **B-269～B-272** **收口** **；** **5～8** **低优** **一致性** **/** **UX** **余量** **见** [**正文**](#tt-action-state-transition-consistency-audit-001) |
| 4 | TT-GOVERNANCE-PARAMS-ERROR-STUCK-AFTER-SUCCESS-001 | 状态机 | 已封口 | params 成功清 error |
| 5 | TT-ESCROW-RATE-SUBMIT-PARTIAL-READY-STATE-001 | 状态机 | 已封口 | 评分确认 await 刷新 |
| 6 | TT-UI-CONSISTENCY-POLISH-AUDIT-001 | 审计 | 只读 | UI 一致性审计 |
| 7 | TT-ERROR-DISPLAY-COMPONENT-INCONSISTENCY-001 | UI | 已封口 | ApiErrorAlert 示例页 |
| 8 | TT-EMPTY-PLACEHOLDER-DASH-CONSISTENCY-001 | UI | 已封口 | admin 占位 `ui_em_dash` |
| 9 | TT-TAIL-ERROR-DISPLAY-UNIFICATION-001 | UI | 已封口 | params + schema 错误组件 |
| 10 | TT-TAIL-LOADING-EMPTY-TOAST-CONSISTENCY-001 | UI | 已封口 | LoadingText / 工具 empty |
| 11 | TT-TAIL-SILENT-INTERACTION-ELIMINATION-001 | 体验 | 已封口 | 深链提示 + FeeRouter loading |
| 12 | TT-PRODUCTION-READINESS-SUMMARY-001 | 文档 | **已封口**（**2026-04-14**） | 上线前总结（无代码）；**`docs/frontend/Release-Readiness-Frontend.md`** **§0** **+** **§4.1** **与** **B-248** **/** **B-250～B-266** **边界** **互证**（**B-262** **/** **B-263** **为** **RPC** **广播** **/** **receipt** **归档** **；** **B-264** **为** **只读** **对账** **JSON** **；** **B-265** **为** **B-264** **`GO`** **读模型** **+** **`forwarded`** **互证** **（** **ENV** **导入** **）** **；** **B-266** **为** **B-263～B-265** **证据** **+** **双** **attestation** **生产** **GO** **闸** **（** **锚** **`14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1`** **）** **；** **不** **声称** **生产** **主网** **已** **送** **tx** **）**；互证 [**正文**](#tt-production-readiness-summary-001) |
| 13 | TT-AUTH-VERIFY-EMAIL-EMPTY-TOKEN-001 | 微任务 | 已封口 | 空 token 提交错误提示 |
| 14 | TT-AUTH-LOGIN-CLEAR-ERROR-ON-RETRY-001 | 微任务 | 已封口 | 登录重试清旧 error |
| 15 | TT-AUTH-LOGIN-SUBMITTING-STATE-001 | 微任务 | 已封口 | 登录提交中 loading、按钮与表单禁用（B-001） |
| 16 | TT-AUTH-LOGIN-API-ERROR-I18N-001 | 微任务 | 已封口 | 登录 API 错码 → 专用 i18n（B-002） |
| 17 | TT-AUTH-LOGIN-SAFE-RETURN-URL-001 | 微任务 | 已封口 | 登录成功 returnUrl 站内安全跳转（B-004） |
| 18 | TT-AUTH-REGISTER-REQUIRED-EMAIL-PASSWORD-001 | 微任务 | 已封口 | 注册页空邮箱/密码/确认密码表单级 i18n（B-005） |
| 19 | TT-AUTH-REGISTER-API-FAILURE-READABLE-001 | 微任务 | 已封口 | 注册 API/网络失败可读错误、无误报成功（B-006） |
| 20 | TT-AUTH-FORGOT-PASSWORD-FEEDBACK-001 | 微任务 | 已封口 | 忘记密码页空邮箱/格式/API 失败/成功态（B-007） |
| 21 | TT-AUTH-VERIFY-EMAIL-FAIL-RETRY-CLEAN-001 | 微任务 | 已封口 | 验证邮箱失败可重试、成功与错误态不混（B-009） |
| 22 | TT-AUTH-VERIFY-EMAIL-SUCCESS-ISOLATED-001 | 微任务 | 已封口 | 验证邮箱成功态独立视图、无表单错误残留（B-010） |
| 23 | TT-ESCROW-PAY-HUB-ORDER-STATE-001 | 微任务 | 已封口 | 支付 hub 与 GET order 状态联动说明（B-011） |
| 24 | TT-ESCROW-DETAIL-LOAD-ERROR-RETRY-001 | 微任务 | 已封口 | 托管详情 GET 订单错误可重试、换单清错（B-012） |
| 25 | TT-DISPUTE-DETAIL-LOAD-ERROR-RETRY-001 | 微任务 | 已封口 | 争议详情 GET 失败 ApiErrorAlert + 重试；无争议中性态（B-013） |
| 26 | TT-MARKET-LIST-API-ERROR-APIERRORALERT-001 | 微任务 | 已封口 | 市场列表区双源失败 ApiErrorAlert + 重试/收起（B-016） |
| 27 | TT-COMMUNITY-FEED-MESSAGES-PROFILE-APIERROR-DARK-001 | 微任务 | 已封口 | 社区 Feed/私信/用户主页 ApiErrorAlert dark + Hint 键（B-018） |
| 28 | TT-GUIDES-LIST-DETAIL-LOAD-STAKE-APIERROR-DARK-001 | 微任务 | 已封口 | 向导列表/详情加载与质押 ApiError dark + 重试（B-019） |
| 29 | TT-ORDERS-LIST-LOAD-CANCEL-ERROR-INLINE-001 | 微任务 | 已封口 | 订单列表首屏重试 + 取消失败内联错误（B-020） |
| 30 | TT-PAY-HUB-ORDER-PARSE-BOUNDARY-001 | 微任务 | 已封口 | /pay UUID 边界可见提示 + 加载错误 ApiErrorAlert（B-025） |
| 31 | TT-COMMUNITY-EXPLORE-FEED-ERROR-DARK-001 | 微任务 | 已封口 | /community/explore Feed 错误 ApiErrorAlert dark（B-026） |
| 32 | TT-ESCROW-CHAIN-MISMATCH-BLOCK-SWITCH-001 | 微任务 | 已封口 | `/escrow/[id]` 错链硬阻断 + i18n + 切换网络 CTA（B-027） |
| 33 | TT-ESCROW-WALLET-DISCONNECTED-ACTION-NUDGE-001 | 微任务 | 已封口 | `/escrow/[id]` 未连接时点链上/签名入口可见顶栏指引（B-028） |
| 34 | TT-ESCROW-ALLOWANCE-INSUFFICIENT-I18N-001 | 微任务 | 已封口 | `/escrow/[id]` 结算代币 allowance 不足专用 i18n + 错误聚合（B-029） |
| 35 | TT-ESCROW-ONCHAIN-INTENT-FAIL-STATE-CLEANUP-001 | 微任务 | 已封口 | `/escrow/[id]` 拒绝/链上失败后状态机与成功条不并存（B-030） |
| 36 | TT-ESCROW-SNAPSHOT-HASH-MISSING-NEUTRAL-001 | 微任务 | 已封口 | `/escrow/[id]` snapshot 缺失/无效时中性说明、不冒充绑定（B-031） |
| 37 | TT-PAY-ORDER-ID-URL-INPUT-SYNC-001 | 微任务 | 已封口 | `/pay`：`?orderId=` 与输入框单源规则 + `getOrder`/URL 同步（B-032） |
| 38 | TT-PAY-LOGIN-RETURN-URL-PRESERVE-001 | 微任务 | 已封口 | `/pay`：`login_required` 跳转登录时 `returnUrl` 保留含 `orderId` 的完整路径（B-033） |
| 39 | TT-ORDERS-NEW-SUBMIT-BUSY-GUARD-001 | 微任务 | 已封口 | `/orders/new`：创建订单提交中主按钮 disabled + aria-busy + 防重复 POST（B-034） |
| 40 | TT-ORDERS-NEW-CREATE-ERROR-APIERRORALERT-001 | 微任务 | 已封口 | `/orders/new`：POST 创建失败 ApiErrorAlert + i18n；成功后清 error（B-035） |
| 41 | TT-ORDERS-LIST-BOOK-GUIDE-INVALID-BANNER-001 | 微任务 | 已封口 | `/orders`：`book_guide` 无效/不存在时可见 banner + /guides、/market（B-036） |
| 42 | TT-ESCROW-DISPUTE-ENTRY-STATE-ALIGN-001 | 微任务 | 已封口 | `/escrow/[id]`：链上发起争议与订单态对齐 + 不可发起时可读说明（B-037） |
| 43 | TT-ESCROW-CHAIN-FINALITY-COPY-001 | 微任务 | 已封口 | `/escrow/[id]`：链上流水/读模型 pending vs confirmed 文案区分（B-038） |
| 44 | TT-ESCROW-FACTORY-CREATE-ERROR-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `CreateOnChainEscrowBlock`：工厂创建链上/API 失败 ApiErrorAlert + 重试（B-039） |
| 45 | TT-ESCROW-SET-ESCROW-ADDRESS-BLOCK-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `SetEscrowAddressBlock`：链下写入托管地址失败 ApiErrorAlert + 重试；成功 `refreshOrder`（B-040） |
| 46 | TT-ESCROW-CHAT-BLOCK-POST-ERROR-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `ChatBlock`：POST 消息失败 ApiErrorAlert + 重试/关闭；禁止假成功（B-041） |
| 47 | TT-ESCROW-ORDER-ACTIONS-BLOCK-ACCEPT-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `OrderActionsBlock`：接单失败 ApiErrorAlert + 重试；禁用态可读说明（B-042） |
| 48 | TT-ESCROW-ONCHAIN-RELEASE-BLOCKED-STATUS-001 | 微任务 | 已封口 | `EscrowOnChainActions`：`canReleaseOnChain` false 时可见 status + `aria-describedby`（B-043） |
| 49 | TT-ORDERS-LIST-DRAFT-CONTINUE-EDIT-CTA-001 | 微任务 | 已封口 | `/orders`：草稿卡「继续编辑」→ `/escrow/:id` + 与非草稿卡区分（B-044） |
| 50 | TT-ORDERS-DETAIL-DRAWER-GET-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `OrderDetailDrawer`：GET order 失败 ApiErrorAlert + common_retry（B-045） |
| 51 | TT-ORDERS-DETAIL-DRAWER-RAPID-SWITCH-NO-STALE-001 | 微任务 | 已封口 | `OrderDetailDrawer`：快速换单 loading + `requestedId`/`orderRef` 防竞态；`enrichedOrder` 仅同 id 采用（B-046） |
| 52 | TT-ORDERS-LIST-CANCEL-SUCCESS-LOCAL-PATCH-001 | 微任务 | 已封口 | `/orders`：取消成功就地 `state`/`status` 补丁 + 预览抽屉同步；失败仅 `orderActionError`；禁 `invalid_state` 误删行（B-047） |
| 53 | TT-ORDERS-LIST-AFTER-CREATE-EXPECT-ORDER-001 | 微任务 | 已封口 | `/orders/new` 成功主 CTA 回列表 `?expect_order=`；列表静默重拉 + 未出现条带说明（B-048） |
| 54 | TT-PAY-HUB-NOT-DEPOSIT-PHASE-ESCROW-FIRST-001 | 微任务 | 已封口 | `/pay`：`!orderLikeMayOnchainDeposit` 时主区托管优先 + 弱化入金；`FeeRouter` 仅可入金态（B-049） |
| 55 | TT-PAY-HUB-GET-ORDER-FORBIDDEN-NOT-LOGIN-001 | 微任务 | 已封口 | `/pay`：`getOrder` 抛 `forbidden` 时中性块 + 回 `/orders`；不 `login_required` 跳转（B-050） |
| 56 | TT-PAY-HUB-RETRY-CLEAR-ORDER-LOAD-ERROR-001 | 微任务 | 已封口 | `/pay`：`common_retry` 前清 `orderLoadError`+快照；`useEffect` 拉单前同步清（B-051） |
| 57 | TT-PAY-FEEROUTER-NOTICE-META-FAIL-FALLBACK-001 | 微任务 | 已封口 | `FeeRouterWiringNotice`：`useMeta().error` 时专用 i18n 兜底；prod 短句、非 prod 附 Hint；不误进「一致」绿态（B-052） |
| 58 | TT-PAY-HUB-BACK-BFCACHE-REFETCH-ORDER-001 | 微任务 | 已封口 | `/pay`：`pageshow`+`persisted` bump `orderFetchTick`；`getOrder` `cache:no-store`（B-053） |
| 59 | TT-COMMUNITY-PUBLISH-SUBMIT-BUSY-GUARD-001 | 微任务 | 已封口 | `/community` `PublishDrawer`：发帖提交中 disabled + aria-busy + submitting i18n + ref 防同帧重复 POST（B-054） |
| 60 | TT-COMMUNITY-POST-DETAIL-DEEPLINK-NOT-FOUND-UX-001 | 微任务 | 已封口 | 帖子详情深链：`GET` 失败 / `post: null` 中性说明 + 回动态/发现 + 重试；`/community/post/[id]` 重定向（B-055） |
| 61 | TT-COMMUNITY-COMMENT-POST-ERROR-I18N-001 | 微任务 | 已封口 | 帖下评论：`429` / `comment_*` 风控码 → `community_api_msg_*`；异常路径 `mapApiReadError` 可读（B-056） |
| 62 | TT-COMMUNITY-DM-THREAD-SEND-ERROR-INLINE-RETRY-001 | 微任务 | 已封口 | 私信线程：`POST …/messages` 失败内联可读 + 关闭提示/重试；成功前不清空输入防假成功（B-057） |
| 63 | TT-GUIDE-REGISTER-SUBMIT-UPLOAD-ERROR-APIERRORALERT-001 | 微任务 | 已封口 | `/guide/register`：提交/上传失败 `ApiErrorAlert` + i18n + `common_closeAlert`；成功 `setError(null)`；字段变更清错；证件上传无 `url` 显错（B-058） |
| 64 | TT-GUIDES-DETAIL-BOOK-LOGIN-RETURNURL-001 | 微任务 | 已封口 | `/guides/[id]`→`/orders/new?guide_id=`：`getGuides`/`postOrder` 遇 `login_required` 时 `router.replace` 至登录且 `returnUrl=/guides/:id`（B-059） |
| 65 | TT-MARKET-ORDER-DRAWER-LOGIN-RETURNURL-QUERY-001 | 微任务 | 已封口 | `/market` `OrderDetailDrawer`：`getOrder`/`accept` 遇 `login_required` 且传入 `loginReturnPath` 时，`returnUrl` 保留当前 **path+query**（B-060） |
| 66 | TT-MARKET-LIST-DISCOVER-GUIDES-FETCH-EPOCH-001 | 微任务 | 已封口 | `/market`：`getDiscoverOrders`/`loadMore`/`getGuides` 用 **epoch** 丢弃慢请求落地，防筛选与网络竞态（B-061） |
| 67 | TT-MARKET-GUIDE-DRAWER-GET-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `/market` `GuideDetailDrawer`：`getGuide` 失败 `ApiErrorAlert`+`common_retry`；无效 id/`guide_not_found` 中性块+关抽屉/回市场（B-062） |
| 68 | TT-GOVERNANCE-FEE-VAULT-LOADMORE-APIERRORALERT-RETRY-001 | 微任务 | 已封口 | `/governance/fee-routes`·`vault-forwards`：分页「加载更多」失败 `loadMoreError`+`ApiErrorAlert`+`common_retry`/`common_closeAlert`；首屏 refetch 清分页错（B-063） |
| 69 | TT-GOVERNANCE-PROPOSALS-LIST-APIERRORALERT-RETRY-EMPTY-001 | 微任务 | 已封口 | `/governance/proposals`：首屏 `GET …/governance/proposals` 失败 `ApiErrorAlert`+`common_retry`；**成功空列表**与**请求错误**分文案（B-064） |
| 70 | TT-AUTH-LOGOUT-POST-OK-THEN-CLEAR-NAVIGATE-001 | 微任务 | 已封口 | 顶栏/`/me`：**`POST /auth/logout` 成功**后再清 localStorage·cookie·`traveltrust:auth-change`，再导航 **`/`** 或 **`/auth/login`**；失败不清会话；防双点 busy（B-065） |
| 71 | TT-ESCROW-DISPUTE-RESOLUTION-FUND-SPLIT-DISPUTES-SSOT-001 | 微任务 | 已封口 | **`/escrow/[id]`** **`DisputeResolutionFundBlock`**：`refunded`/`partially_refunded`/`slashed` 时 **`GET /disputes`→`GET /disputes/:id`** SSOT 拆分展示 + 链 **`/disputes/:id`**（B-066） |
| 72 | TT-ESCROW-PROTOCOL-PAUSE-META-GATE-ONCHAIN-001 | 微任务 | 已封口 | **`/escrow/[id]`**：**`GET /meta` `pause.enabled`** 真时统一门闸（横幅 + 子块 **`escrow_protocolPause_*`**）+ 链上/工厂/mock 地址/订单动作/双边确认/弹层确认硬拦截；**`readProtocolPauseFromMeta`**；04 §三 契约句（B-067） |
| 73 | TT-ESCROW-WALLET-RPC-CONTRACT-READ-DEGRADE-001 | 微任务 | 已封口 | **`/escrow/[id]`**：钱包 **`useReadContract`** 落定失败 → **`chainContractReadDegraded`** + 横幅 **`escrow_chainReadDegraded_*`** + **`lastChainContractReadOkAt`**；错误态**忽略**陈旧 **`data`**；**`console.warn`** **`[B-068]`**；04 §三（B-068） |
| 74 | TT-ORDERS-LIST-ESCROW-AUTO-SYNC-POLL-001 | 微任务 | 已封口 | **`/orders`** + **`OrderDetailDrawer`**：**Accepted / 可入金链** 态下 **5s** 静默对齐 **`GET /api/v1/orders`** + 抽屉 **`getOrder`**；**`previewOrder`** 与列表四字段同源（B-069） |
| 75 | TT-ESCROW-CONFIRM-FINAL-PLAN-GOTO-ESCROW-001 | 微任务 | 已封口 | **`POST …/confirm-final-plan`** 成功后 **`/escrow/:id`** **`replace` + `refresh` + 流程锚点滚动**（B-070） |
| 76 | TT-ORDERS-LIST-TERMINAL-STATE-QUERY-001 | 微任务 | 已封口 | **`/orders`** **`?state=`** 与 **`GET /api/v1/orders`** 同源；终态 **`completed` / `cancelled` / `disputed`**（B-071） |
| 77 | TT-GOVERNANCE-PROPOSAL-DETAIL-VOTE-001 | 微任务 | 已封口 | **`/governance/proposals/[id]`**：**`GET` 详情** + **`POST …/vote`**；**同票**幂等 **200**、**改票** **409**；列表链入详情（B-072） |
| 78 | TT-GOVERNANCE-DELEGATE-VOTE-001 | 微任务 | 已封口 | **`/governance/delegate`**：**`GET`** 状态 + **`POST`** 委托 + **`DELETE`** 撤销；回执 **`request_id`** / **`tx_hash`**；治理首页与提案页导航（B-073） |
| 79 | TT-GOVERNANCE-PARAMS-PROTOCOL-PENDING-DIFF-001 | 微任务 | 已封口 | **`GET …/protocol-reference/pending`** + **`/governance/params`** 五项费用百分数对拍表；**`PROTOCOL_REFERENCE_PENDING_OVERLAY`** 深度合并验收（B-074） |
| 80 | TT-COMMUNITY-FEED-SHARE-COPYLINK-001 | 微任务 | 已封口 | **`/community` Feed**：**`buildCommunityPostShareUrl`** + **`clipboard.writeText`**；失败 **`community_share_copy_failed`**；紧凑卡补 **`CommunityPostShareMenu`**（B-075） |
| 81 | TT-COMMUNITY-AUTHOR-FOLLOW-SYNC-001 | 微任务 | 已封口 | **`author_followed_by_me`**（Feed/详情/用户帖）与 **`followingIds`**、**`GET …/me/following`** 对读；**`POST|DELETE …/follow`** 同屏更新（B-076） |
| 82 | TT-GUIDE-DASHBOARD-PERIOD-EARNINGS-001 | 微任务 | 已封口 | **`/guide`** **`GuideBillingPeriodCard`**：**`GET /api/v1/me/stats`** guide **`billing_period_utc`****/**`period_expected_earnings`****/**`period_settled_orders_count`**（B-078） |
| 83 | TT-GUIDES-DETAIL-SCHEDULE-AVAILABILITY-001 | 微任务 | 已封口 | **`/guides/[id]`** **`GuideOccupiedScheduleBlock`** + **`GET /api/v1/guides/:id/availability`**（B-079） |
| 84 | TT-GUIDE-DASHBOARD-REGISTRATION-BANNER-001 | 微任务 | 已封口 | **`/guide`** 顶区资质横幅 + **`GET /me.trust`** 拒绝字段 + **`PATCH /api/v1/admin/guides/:id`**（B-080） |
| 85 | TT-COMMUNITY-TOPIC-SORT-URL-001 | 微任务 | 已封口 | **`/community/topic/[tag]`** 与主 Feed：**`sort=`**（**`hot`** | 缺省 **latest**）单一源；**`GET …/feed`** **`mode`** + **`tag`** 同源；话题链路与 **`setTagFilter`** 保留 **`?sort=hot`**（B-077） |
| 86 | TT-REVENUE-FEE-ROUTER-LOG-RPC-VERIFY-001 | 收益 / 索引 | 已封口 | **`POST …/internal/indexer-reconcile`** + **`verify_fee_router_events_rpc`**：`PlatformFeeRouted` DB 与 receipt 解码对账 + 四收款 **`eth_call`**（B-081） |
| 87 | TT-REVENUE-REGION-VAULT-FORWARD-BALANCE-CLOSURE-001 | 收益 / 索引 | 已封口 | **`verify_region_vault_events_rpc`**：`RegionVaultForwarded` 与 DB 一致 + 单交易块 **`to`** 的 ERC20 余额差 = **`amount`**（B-082） |
| 88 | TT-REVENUE-FEE-ROUTE-COUNTRY-SSOT-001 | 收益 / 订单 | 已封口 | **`GET /api/v1/orders/:id`** **`order.fee_route_country`**（bundle 时）：**`itinerary.destination`** → **`iso3166_alpha2`** + **`bucket_route_key`**；未映射显式 **`reject`**；**`GET /meta.orders.fee_route_country_ssot`** + **744** **`ORDERS_META_TOP_KEYS`** 七键（B-083） |
| 89 | TT-REVENUE-FEE-POOL-AGGREGATES-PROJECTION-001 | 收益 / 治理只读 | 已封口 | **`GET /api/v1/governance/fee-pool-aggregates`**：投影表 **`fee_router_routed_events`****+**`region_vault_forwarded_events`** **uint256 Σ** 按 **token** / **pool_id**；**`cross_check`** 与 **protocol-reference**（84 **open_fee_points**）同源（B-084） |
| 90 | TT-INVESTOR-SHARE-SUPPLY-REBUILD-001 | 收益 / 索引 / 治理只读 | 已封口 | **`investor_share_transfer_events`** + **`POST …/internal/indexer-tick`**（**`INVESTOR_SHARE_TOKEN_ADDRESSES`**）；**`GET …/governance/investor-share-reconcile`** 重放 **Σ balance** vs **`totalSupply()`**；合规表 **`investor_share_compliance_wallets`**（B-085） |
| 91 | TT-INVESTOR-DISTRIBUTION-ACCRUAL-001 | 收益 / 分录 / internal+治理只读 | 已封口 | **B-086**：**`fee_router_allocatable_platform_fee_sum`** + **`pro_rata_share_balance_at_snapshot`**；**`POST …/internal/investor-distribution-accrual`**（**`idempotency_key`**）；**`GET …/governance/investor-distribution-accruals`** |
| 92 | TT-INVESTOR-DISTRIBUTION-CLAIM-001 | 收益 / 链上领取 | 已封口 | **B-087**：**`InvestorDistributionClaim`** — **`withdrawDividend` / `claim`**；**`registerAccrual`**（owner）；**双花** → **`NothingToClaim` revert**；ABI **`contracts/abi/InvestorDistributionClaim.json`**；**`Deploy.s.sol`**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §6； **`forge test --root contracts --match-path test/InvestorDistributionClaim.t.sol --match-test "B087" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B087.log`。 |
| 93 | TT-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER-RULE-001 | 收益 / 应计快照规则 | 已封口 | **B-088**：**`snapshot_block_number`** **含块**冻结 + **`list_investor_share_transfers_up_to_block`**；**`snapshot_binding`**（**GET/POST**）；单测重放 + **`pro_rata`** 名单一致 |
| 94 | TT-GOVERNANCE-PARAM-TIMELOCK-EXECUTE-001 | 治理 / 链上延迟执行 | 已封口 | **B-089 Partial**：**`GovernanceTimelock`** **`schedule`/`execute`**；**`GovernanceTimelock.t.sol`**（**`FeeRouter.transferOwnership`**）；**`Deploy.s.sol`** + **`GOVERNANCE_TIMELOCK_DELAY_SECONDS`**；**四方/BPS 热改** 见 **TT-COMP-B089**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §7； **`forge test --root contracts --match-test "[Bb]089" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B089.log`。 |
| 95 | TT-GOVERNANCE-TREASURY-SPEND-EXECUTE-001 | 治理 / 金库链上支出 | 已封口 | **B-090 Partial**：**`GovernanceTreasury.spend`**；**`spender`=Timelock**；**`GovernanceTreasury.t.sol`** E2E；**`Deploy.s.sol`**；**链上提案 UI** **Completion** 见 **111**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §8； **`forge test --root contracts --match-path test/GovernanceTreasury.t.sol --match-test "[Bb]090" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B090.log`。 |
| 96 | TT-GOVERNANCE-PROTOCOL-EMERGENCY-PAUSE-001 | 治理 / 紧急开关 | 已封口 | **B-091 Partial**：**`EscrowFactory.factoryPaused`** + **`FeeRouter.distributePaused`**；**`Escrow.t.sol`** / **`FeeRouter.t.sol`**；**55-S13** ABI |
| 97 | TT-GOVERNANCE-VOTE-WEIGHT-DELEGATION-SIGNAL-001 | 治理 / 链下投票权重 | 已封口（**Partial**） | **B-092**：**`delegation_units_v1`** + **`GET …/voting-power`** + 提案 **`governance_vote`**；**信号票**；**质押/份额链上快照** **Completion** **105·110**；**B-098 / 115** **`TT-GOVERNANCE-VOTE-WEIGHT-UNIFIED-FORMULA-001`** **已封口** |
| 98 | TT-ESCROW-RELEASE-NORMAL-SPLIT-B093-001 | Escrow / 正常放款分账 | 已封口（**Partial**） | **B-093**：**`release()`** 与 **01 §10** 对齐；**`Escrow.t.sol`** 表驱动 + fuzz；**附录 02** 其它收平台费终态见 **Completion** **106**/**108**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §4； **`forge test --root contracts --match-path test/Escrow.t.sol --match-test "B093" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B093.log`。 |
| 99 | TT-ESCROW-EXECUTE-RESOLUTION-B094-001 | Escrow / 争议执行三腿 | 已封口（**Partial**） | **B-094**：**`executeResolution`** 三模板 + **`terminal_order_state_from_resolution_amounts`** + **`evidence/B-094-*`**；**`orders_projection`** 细分终态由 **107** **`TT-COMP-B094-INDEXER-RESOLUTION-TERMINAL-STATE-001`** **已封口**（非本卡交付范围） |
| 100 | TT-ORDERS-SPLIT-ADDRESSES-SSOT-B095-001 | 订单 / 分账地址 SSOT | 已封口 | **B-095**：**`GET /orders/:id`** **`split_addresses_ssot`** + **`ChainConfig::escrow_platform_fee_recipient`** 与 **`/meta`** 同源；单测 **`b095_*`** |
| 101 | TT-COMP-B088-STAKE-LOCK-PROJECTION-001 | 投资人 / 快照补齐 | 已封口（**Completion**） | **B-088**：**`Staking`** **`Staked`****/****`Withdrawn`****/****`Slashed`** → **`investor_stake_state_events`**；**`indexer-tick`** 写入；应计与 **`Transfer`** **merge** + **`supply`** 对拍 |
| 102 | TT-COMP-B089-FEEROUTER-MUTABLE-ROUTING-001 | 治理 / FeeRouter 热改 | 已封口（**Completion**） | **B-089 Target**：**`setRoutingConfig`** + **`GovernanceTimelock` `execute`** 验收；**`BPS_*()`** ABI 不变。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §7； **`forge test --root contracts --match-test "[Bb]089" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B089.log`。 |
| 103 | TT-COMP-B090-TREASURY-NATIVE-SPEND-001 | 治理 / 金库原生币 | 已封口（**Completion**） | **B-090 Target**：**`GovernanceTreasury`** **`receive` + `spendETH`**；**`GovernanceTreasury.t.sol`** **`test_COMP_B090_timelock_execute_spendETH_matches_payload`**；**链上提案 UI** 见 **111**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §8； **`forge test --root contracts --match-path test/GovernanceTreasury.t.sol --match-test "[Bb]090" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B090.log`。 |
| 104 | TT-COMP-B091-META-PAUSE-CHAIN-READ-001 | API / meta 读链 | 已封口（**Completion**） | **B-091 Target**：**`GET /meta` `pause.factory_paused` / `pause.distribute_paused`** + **`chain_pause_read`**；mock **`comp_b091_*`** |
| 105 | TT-COMP-B092-VOTE-WEIGHT-STAKE-SNAPSHOT-001 | 治理 / 质押快照权重 | 已封口（**Completion**） | **B-092**：**`GET …/voting-power?snapshot_block=`** **`stake_snapshot`** **`stakeOf`**；**计票** 路径未改；**份额 `balanceOf`** 见 **110** |
| 106 | TT-COMP-B093-ESCROW-APPENDIX-AUTO-SPLIT-001 | Escrow / 附录分账 | 已封口（**Completion**） | **B-093**：**`releasePartialRefund`** + **`PartialRefundExecuted`** / **`test_COMP_B093_*`**；索引器 **`PartialRefundExecuted`** → **`partially_refunded`**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §4； **`forge test --root contracts --match-path test/Escrow.t.sol --match-test "B093" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B093.log`。 |
| 107 | TT-COMP-B094-INDEXER-RESOLUTION-TERMINAL-STATE-001 | API / 投影 | 已封口（**Completion**） | **B-094 Target**：**`ResolutionExecuted`** 同源 **`eth_getTransactionByHash`** 解析 **`executeResolution`** → **`orders_projection`** **Refunded/Partial/Slashed**；缺 input/RPC 时 **Completed** |
| 108 | TT-COMP-B093-ESCROW-SLASHED-NON-DISPUTE-001 | Escrow / Slashed 附录 | 已封口（**Completion**） | **B-093**：**`releaseSlashed`** + **`SlashedExecuted`**；**`status()==8`**；**`indexer-tick`** → **`slashed`**（与 **106** 正交）。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §4； **`forge test --root contracts --match-path test/Escrow.t.sol --match-test "B093" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B093.log`。 |
| 109 | TT-COMP-B089-GOVERNOR-CHAIN-VOTING-001 | 治理 / Governor 链上投票 | 已封口（**Completion**） | **B-089**：**`TravelTrustGovernor`** + **`GovernanceVotesToken`** + **`GovernanceTimelock.scheduleByGovernor`**；**`indexer-tick`** → **`governance_proposals_projection`**；**`GET …/proposals`** 对齐链上 + **`eth_call`** **`state`****/****`getPastVotes`**；**`POST …/vote`** → **`vote_on_chain_required`**。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §7； **`forge test --root contracts --match-test "[Bb]089" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B089.log`。 |
| 110 | TT-COMP-B092-COUNTRY-POOL-SNAPSHOT-001 | 治理 / Country Pool 份额快照 | 已封口（**Completion**） | **B-092**：**`GET …/voting-power?snapshot_block=`** **`country_pool_share_snapshot`**；**`INVESTOR_SHARE_TOKEN_ADDRESSES`** 各 **`balanceOf`** **`eth_call`**；与 **105** 并列；**计票** 未改 |
| 111 | TT-COMP-B090-ONCHAIN-PROPOSAL-UI-001 | 治理 / 链上提案 UI（B-090） | 已封口（**Completion**） | **B-090**：**`/governance/proposals`** **`data_source=governance_proposals_projection`** 时说明面板 + **`GET /meta`** **`governor_address`**；详情 **Governor** 模式展示 **proposer / 块窗 / operation_id** + **Treasury·Timelock** 路径；**禁止**伪造链上数据。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §8； **`forge test --root contracts --match-path test/GovernanceTreasury.t.sol --match-test "[Bb]090" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B090.log`。 |
| 112 | TT-COMP-B088-LOCK-VAULT-PROJECTION-001 | 投资人 / 快照补齐（B-088 锁仓） | 已封口（**Completion**） | **`InvestorShareLockLedger`** **`Locked`****/****`Unlocked`** → **`investor_lock_state_events`**；**`indexer-tick`** + **`INVESTOR_LOCK_CONTRACT_ADDRESSES`**；应计在 **质押 overlay** 之后再叠 **锁仓 overlay** + **`supply`****Σ** 对拍；**reorg** 删表尾 |
| 113 | TT-RESOLUTION-OUTBOX-E2E-CHAIN-001 | 争议 / 执行器 / 索引 P0 | 已封口 · **EXTEND**（**B-094**） | **B-096**：outbox → **`process-resolution-outbox`** → 上链 **`executeResolution`** → indexer → 投影；与 **107** 正交 |
| 114 | TT-ORDERS-PROJECTION-TERMINAL-API-UX-001 | 订单 / API / 前端 P0 | 已封口 · **NEW** | **B-097**：**`GET /orders/:id`** **`projection_terminal`** + **/orders**、**/escrow** 徽章 SSOT（**evidence pack 1.2**；**B-097**） |
| 115 | TT-GOVERNANCE-VOTE-WEIGHT-UNIFIED-FORMULA-001 | 治理 / 链上权重 P1 | 已封口 · **EXTEND**（**B-092**） | **B-098**：**04/14** **`f(wallet,B)=getPastVotes`**；**`GET …/voting-power`** **`on_chain_vote_weight`** / **`unified_on_chain_vote_weight_u256_dec`**；**105/110** 不重做 |
| 116 | TT-DOC-BACKLOG-INDEX-LEDGER-DRIFT-EXTEND-001 | 文档 / 台账 | 已封口 | **EXTEND**：母表 **B-074/B-075/B-080/B-098** + 索引 **99** 摘要 **漂移** 与 **14 §1.1.0 / TT-107** 对齐；**无**代码、**无**新业务能力 |
| 117 | TT-INDEXER-RECONCILE-ORDERS-PROJECTION-GATE-001 | internal / 索引 | 已封口 | **B-094 EXTEND**：**`POST …/internal/indexer-reconcile`** **`orders_projection_reconcile_gate`** + 持久化 **`summary`**（**04** internal 行） |
| 118 | TT-DISPUTES-LIST-DETAIL-POSTGRES-001 | disputes / API | 已封口 | **B-099**：**`GET /disputes`** **`limit`/`cursor`**、**`page.source=postgres`**；**`GET /disputes/:id`** PG join；前端 **`next_cursor`** |
| 119 | TT-DOC-GOVERNOR-TIMELOCK-QUEUE-EXECUTE-EVIDENCE-001 | 治理 / 证据 | 已封口 | **B-100**：**`governor-timelock-queue-execute-evidence.md`** + Runbook；**文档交付**；本地 **`forge test`** 自证 **非**本卡强制 |
| 120 | TT-DOC-B093-ESCROW-APPENDIX-14-ALIGN-001 | spec/14 文档 | 已封口 | **B-093**：**14 §1.1.0a** **refund** / **`executeResolution`** / **106·108** 指针。**Foundry 专验**：`contracts/LOCAL-FOUNDRY.md` §4； **`forge test --root contracts --match-path test/Escrow.t.sol --match-test "B093" -vv`** 于 **2026-04-08** 通过；**日志**：`evidence/GO_20260408/forge_B093.log`。 |
| 121 | TT-INDEXER-RECONCILE-COMPOUND-PASS-GATE-001 | internal / 索引 | 已封口 · **EXTEND** | **B-101**：**`indexer-reconcile`** **复合门闸**（**`orders_projection_reconcile_gate`** + **RPC 抽样** + 可选 **event_log 覆盖** → 根级 **`compound_pass`**）；**04**/**110** |
| 122 | TT-ORDERS-CHAIN-ID-BACKFILL-AND-QUERY-GATE-001 | orders / DB | 已封口 · **NEW** | **B-102**：**`orders.chain_id`** 回填 **dry-run** + **`GET /orders`** 等读路径 **链过滤/标注**；**110 §3.1.4** |
| 123 | TT-EVIDENCE-B094-RESOLUTION-FIXTURES-SSOT-001 | escrow / 证据 | 已封口 · **EXTEND** | **B-103** / **B-094**：三终态 **fixture** **单文件 SSOT**（**tx hash** + 余额 + **`orders_projection`**） |
| 124 | TT-GOVERNANCE-PROPOSALS-LIST-RESPONSE-CONTRACT-TEST-001 | API / 治理 | 已封口 · **EXTEND** | **`GET …/governance/proposals`**：**`governance_proposals_response_*`**（**projection** 枝 **非** **`X-Implementation-Status: placeholder`**；MVP 枝 **`chain_off_mvp`**）；**不改** handler |
| 125 | TT-B120-INDEXER-RECONCILE-GATE-CHECKS-TOTAL-ALIGN-001 | CI / 110 / Runbook | 已封口 | **B-120**：**`indexer-reconcile-gate.yml`** **`checks_total`** = **`check_anchor`**（**现行** **125**；**YAML** 真值；**110**/**07**/**RUNBOOK §2.55**/**`scripts/ops/indexer-reconcile-probe.sh`** 同锚；历史 **TT-B120** 文内曾记 **106**；**113** **叙事** **见** **B-159**/**07 §六 6.5** **1.0.836**；**B-219/B-220** **承后** **文档互证**） |
| 126 | TT-GOVERNANCE-POOL-CHAIN-ALIGNMENT-HINT-TRIPLE-001 | API / 治理 pool | 已封口 | **B-110**：**`GET …/governance/pool`** **`database` / `database_empty` / `placeholder`** 三枝 **`chain_alignment_hint`** 一致 **`is_chain_ssot=false`·`data_source=projection`·`chain_alignment_status=not_aligned`**；**`cargo test -p traveltrust-api`** **`governance_pool_*chain_alignment_hint*`**（**无 `DATABASE_URL` 时 DB 两枝跳过**） |
| 127 | TT-GOVERNANCE-REWARDS-RESPONSE-CONTRACT-TEST-001 | API / 治理 rewards | 已封口 | **`GET …/governance/rewards`**：**`placeholder`**（**`items:[]`** + **`x-implementation-status`**) / **`database`**（**`rule_version=governance_rewards_v1`**）；**`cargo test -p traveltrust-api`** **`governance_rewards_response_`**；实现 **`governance.rs`** **`#[cfg(test)]`** |
| 128 | TT-GOVERNANCE-PARAMS-HTTP-PLACEHOLDER-001 | API / 治理 params | 已封口 | **B-124 新能力**：**`GET …/governance/params`** **占位聚合**（**`status`****`ok`**、**`data_source`****`placeholder`**、**`params`****{}**、**`items`****[]**、**`X-Implementation-Status: placeholder`**）；**04 §3.4** + **母表 B-124**；页内主数据仍 **protocol-reference**/**pending**；**`cargo test -p traveltrust-api`** **`governance_params_response_`** |
| 129 | TT-B114-1-REORG-SAFETY-001 | indexer / reorg | 已封口 | **B-114-1**：reorg 后内存状态与 **`perform_indexer_reorg_rewind_execute`** DB 删尾对齐；**`cargo test -p traveltrust-api reorg`**（含模拟 reorg） |
| 130 | TT-B114-4-REORG-MULTI-BLOCK-REPLAY-001 | indexer / reorg | 已封口 | **B-114-4**：连续 **N** 块 reorg 后重放；**`cargo test -p traveltrust-api b114_4_reorg_multi_block`** |
| 131 | TT-B114-5 | indexer / reorg | 已封口 | **B-114-5**：reorg 后 **`indexer_tick`** 的 **`scan_from_block`** 与 rewind 后内存 **`IndexerState`** 一致（**`last_block + 1`**）；**`cargo test -p traveltrust-api b114_5_reorg_tick_scan_from_block`**（**2 passed**）；互证 [**docs/任务母表.md**](../docs/任务母表.md) **B-114-5**、[**evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md**](../evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md) **§B-114-5** |
| 132 | TT-B110-SEQ2-ORDERS-DEADLINE-BUNDLE-CLOSE-001 | orders / SSOT / 文档收口 | 已封口 | **B-132**：**B110-SEQ2** **`rating_deadline`** 子主线 **bundle**（完成范围/边界/后续）；**GO** [**GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md**](../evidence/GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md)；**04**/**Runbook §2.55**/**sealed-programs**/**evidence/README** 互指；验收 **`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** |
| 133 | TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001 | indexer / orders SSOT | 已封口 | **B-133**：**`POST …/internal/indexer-reconcile`** **`orders_deadline_ssot_ops_check`** + **`compound_gate.breakdown.orders_deadline_ssot_reconcile`** **AND**；**indexer-reconcile-gate** **`checks_total`** **113** / **probe** 同锚（累计 **SEQ3+SEQ5+SEQ6+SEQ8+SEQ9+SEQ10+SEQ11** 机读锚；**B-120**）；验收 **`cargo test -p traveltrust-api`** + **`run-check-04-routes`**；互证 [**母表 B-133**](./任务母表.md) |
| 134 | TT-B110-SEQ4-GOVERNANCE-PARAM-NEXT-CANDIDATE-001 | governance / 规划 | 已封口 | **B-134**：**SEQ2/SEQ3** 后下一治理参数 **P1～P4** 候选、链读可行性、**fallback**、**observability/reconcile/ops/CI** 复用点；首张实现 [**SEQ5**](#tt-b110-seq5-governance-governor-view-params-chain-ssot-001)；**零**业务代码；互证 [**母表 B-134**](./任务母表.md) |
| 135 | TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-135**：**`GOVERNANCE_GOVERNOR_VIEW_PARAMS_CHAIN_SSOT`** + **`eth_call`** 三 getter；**`GET /meta` `governance`**；**admin** **`governor_view_params_ssot*`**；**indexer-reconcile** **`governor_view_params_ssot_ops_check`** + **`compound` `governor_view_params_ssot_reconcile`**；**`scripts/governance-governor-view-params-ssot-ops-check.sh`**；**gate/probe** **113**（与 **B-120**/**SEQ11** 累计）；**不**改 **`GET /api/v1/orders*`**；互证 [**母表 B-135**](./任务母表.md) |
| 136 | TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-136**：**`GOVERNANCE_TIMELOCK_DELAY_CHAIN_SSOT`** + **`GOVERNANCE_TIMELOCK_ADDRESS`** + **`eth_call`** **`delay()`**（**`getDelay()`** 口径映射）；**`GET /meta` `governance.timelock_delay_observability`**；**admin** **`timelock_delay_ssot*`**；**indexer-reconcile** **`timelock_delay_ssot_ops_check`** + **`compound` `timelock_delay_ssot_reconcile`**；**`scripts/governance-timelock-delay-ssot-ops-check.sh`**；**gate/probe** **113**；**不**改 **`GET /api/v1/orders*`**；互证 [**母表 B-136**](./任务母表.md) |
| 137 | TT-B110-SEQ7-GOVERNANCE-PARAM-NEXT-CANDIDATE-001 | governance / 规划 | 已封口 | **B-137**：**SEQ7** 候选台账（**P1** **`proposalThresholdVotes`**、**P2** Timelock **`governor`/`admin`**、**P3** **`proposalCount`**、**排除** **FeeRouter BPS** 双源）；复用 **SEQ5/SEQ6** **meta/admin/reconcile/ops/gate** 骨架；**P1 落地** [**母表 B-138**](./任务母表.md) / [**SEQ8**](#tt-b110-seq8-governance-governor-proposal-threshold-chain-ssot-001)；**P2 落地** [**母表 B-139**](./任务母表.md) / [**SEQ9**](#tt-b110-seq9-governance-timelock-governor-admin-chain-ssot-001)；**P3 落地** [**母表 B-140**](./任务母表.md) / [**SEQ10**](#tt-b110-seq10-governance-governor-proposal-count-chain-ssot-001)；互证 [**母表 B-137**](./任务母表.md) |
| 138 | TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-138**：**`GOVERNANCE_GOVERNOR_PROPOSAL_THRESHOLD_CHAIN_SSOT`** + **`proposalThresholdVotes()`**；**`GET /meta` `governance.governor_proposal_threshold_observability`**（**807** 键序见 **`GOVERNANCE_META_TOP_KEYS`**；**SEQ11** 后 **十键**）；**admin** **`governor_proposal_threshold_ssot*`**；**indexer-reconcile** **`governor_proposal_threshold_ssot_ops_check`** + **`compound` `governor_proposal_threshold_ssot_reconcile`**；**`scripts/governance-governor-proposal-threshold-ssot-ops-check.sh`**；**gate/probe** **113**；**不**改 **`GET /api/v1/orders*`**；互证 [**母表 B-138**](./任务母表.md) |
| 139 | TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-139**：**`GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT`** + **`governor()`**/**`admin()`**；**`GET /meta` `governance.timelock_governor_admin_observability`**（**807** **十键**）；**admin** **`timelock_governor_admin_ssot*`**；**indexer-reconcile** **`timelock_governor_admin_ssot_ops_check`** + **`compound` `timelock_governor_admin_ssot_reconcile`**；**`scripts/governance-timelock-governor-admin-ssot-ops-check.sh`**；**gate/probe** **113**；**不**改 **`GET /api/v1/orders*`**；互证 [**母表 B-139**](./任务母表.md) |
| 140 | TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-140**：**`GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT`** + **`proposalCount()`** vs **`governance_proposals_projection`** **`COUNT(*)`**；**`drift_leg`** / **`GOVERNANCE_PROPOSAL_COUNT_MAX_INDEXER_LAG`**（默认 **32**）见 [**母表 B-140**](./任务母表.md)；**`GET /meta` `governance.governor_proposal_count_observability`**；**admin** **`governor_proposal_count_ssot*`**；**indexer-reconcile** **`governor_proposal_count_ssot_ops_check`** + **`compound` `governor_proposal_count_ssot_reconcile`**；**`scripts/governance-governor-proposal-count-ssot-ops-check.sh`**；**gate/probe** **113**；**不**改 **`GET /api/v1/orders*`** / **公开** **`GET …/governance/proposals*`**；互证 [**母表 B-140**](./任务母表.md) |
| 141 | TT-B141-GOVERNANCE-SSOT-NEXT-CANDIDATE-PLAN-001 | governance / 规划 | 已封口 | **B-141**：承 **SEQ5～SEQ10** 方法库；**L1～L4** 分层、下表候选、**P** 序、**FeeRouter/P5-5/84** 双源风险；**首张实现 TT 占位**；**零**业务代码；互证 [**母表 B-141**](./任务母表.md) · [**正文**](#tt-b141-governance-ssot-next-candidate-plan-001) |
| 142 | TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-142**：**`GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT`** + **`token()`**/**`timelock()`** **`immutable`**；**`GET /meta` `governance.governor_token_timelock_observability`**（**807** **十键**）；**admin** **`governor_token_timelock_ssot*`**；**indexer-reconcile** **`governor_token_timelock_ssot_ops_check`** + **`compound` `governor_token_timelock_ssot_reconcile`**；**`scripts/governance-governor-token-timelock-ssot-ops-check.sh/.ps1`**；**gate/probe** **113**；**不**改 **`GET /api/v1/orders*`**；互证 [**母表 B-142**](./任务母表.md) · [**正文**](#tt-b110-seq11-governance-governor-token-timelock-chain-ssot-001) |
| 143 | TT-B110-SEQ12-GOVERNANCE-GOVERNOR-ORDER-RATING-REVIEW-WINDOW-BOUNDARY-001 | governance / 边界台账 | 已封口 | **B-143**：**`orderRatingReviewWindowDays()`** 与 **SEQ2/SEQ3** **并列观测（默认）** vs **未来接管** 之 **文档裁断**（**文档轮** **☑**）；**04**/**110**/**Runbook** 互指；**升格 orders 真值** 须 **另开实现 TT**；互证 [**母表 B-143**](./任务母表.md) · [**正文**](#tt-b110-seq12-governance-governor-order-rating-review-window-boundary-001) |
| 144 | TT-B110-SEQ13-GOVERNANCE-ORDER-RATING-REVIEW-WINDOW-PARALLEL-META-OBS-001 | governance / orders · 评估 | 已封口 | **B-144**：**807 `governance.*`** 并列 **`orderRatingReviewWindowDays()`** 观测 **信息价值评估** → **否决 Rust**（与 **SEQ2/SEQ3** **`orders.deadline_*`** **重复**）；**不**扩 **807**/**compound**；互证 [**母表 B-144**](./任务母表.md) · [**正文**](#tt-b110-seq13-governance-order-rating-review-window-parallel-meta-obs-001) |
| 145 | TT-B145-SSOT-GATE-PR-CHECK-CRATES-NEEDS-METADATA-001 | SSOT · 元数据门禁 | 已封口 | **B-145**：**单人开发元数据门禁**（**非** PR gate）；**`crates/**`** 须同批母表或索引；**push 前** **`check-pr-crates-needs-metadata.sh`**；可选 **`ssot-crates-metadata-hint.yml`**；互证 [**母表 B-145**](./任务母表.md) · [**正文**](#tt-b145-ssot-gate-pr-check-crates-needs-metadata-001) |
| 146 | TT-B146-SSOT-GATE-BASE-RESOLUTION-STRICTNESS-PLAN-001 | SSOT · 元数据门禁后续 | 已封口 | **B-146**：**BASE/HEAD 解析语义** + **脚本边界**（**先于** **`contracts/**`**）；**`CRATES_METADATA_GATE_REQUIRE_REFS`**；**不**默认 **`CRATES_METADATA_GATE_FAIL`**；互证 [**母表 B-146**](./任务母表.md) · [**正文**](#tt-b146-ssot-gate-base-resolution-strictness-plan-001) |
| 147 | TT-B147-SSOT-GATE-CONTRACTS-SCOPE-001 | SSOT · 元数据门禁 · contracts | 已封口 | **B-147**：**`contracts/**`** 纳入 **同脚本**、豁免、与 **`crates/**`** 同轨；**不**动 **gate/probe/compound**；互证 [**母表 B-147**](./任务母表.md) · [**正文**](#tt-b147-ssot-gate-contracts-scope-001) |
| 148 | TT-B148-SSOT-METADATA-GATE-CI-REQUIRE-REFS-001 | SSOT · CI / ops | 已封口 | **B-148**：**PR workflow** 注入 **`CRATES_METADATA_GATE_REQUIRE_REFS`**；本地默认不变；互证 [**母表 B-148**](./任务母表.md) · [**正文**](#tt-b148-ssot-metadata-gate-ci-require-refs-001) |
| 149 | TT-B149-B110-SEQ14-GOVERNOR-PROPOSAL-STATE-CHAIN-SSOT-001 | governance / SSOT | 已封口 | **B-149**：**v1** **`state(uint256)`** vs **`governance_proposals_projection.chain_state`**（**admin overview** + **`indexer-reconcile`** 可选 **`include_governor_proposal_state_chain_vs_projection_observability`**；**`pending` 粗桶**；**不**入 **compound**；**非** **B-172**）；互证 [**母表 B-149**](./任务母表.md) · [**正文**](#tt-b149-b110-seq14-governor-proposal-state-chain-ssot-001) |
| 150 | TT-B150-110-ORDERS-CHAIN-SYNC-SNAPSHOT-CLOSE-001 | orders / 110 | 已封口 | **B-150**：**`GET …/orders/:id/chain-sync-status`** **110 §六 Implemented** + **04 §3.4** + **716～725**；**B-127** finality；**不** bump **compound**；互证 [**母表 B-150**](./任务母表.md) · [**正文**](#tt-b150-110-orders-chain-sync-snapshot-close-001) |
| 151 | TT-B151-ORDERS-CHAIN-ID-NULL-READ-ONLY-OBS-001 | orders / ops · 只读观测 | 已封口 | **B-151**：**`orders_chain_id_null_observability`**（**`by_status`** + **`orders_null_chain_id_total`** 与 **B-102** 同源）；**`overview`** + **`indexer-reconcile`/`persist` `summary`**；**不**入 **compound**；互证 [**母表 B-151**](./任务母表.md) · [**正文**](#tt-b151-orders-chain-id-null-read-only-obs-001) |
| 152 | TT-B152-GOVERNANCE-PROPOSALS-PROJECTION-NULL-FIELDS-OBS-001 | governance / ops · 观测 | 已封口 | **B-152 v1**：键 **`governance_proposals_projection_null_fields_observability`**（锚 **`152-GOVERNANCE-PROPOSALS-PROJECTION-NULL-FIELDS-OBS-V1`**）；四桶 **`rows_total`** / **`rows_chain_state_null_or_blank`**（**`state`→`chain_state`**）/ **`rows_snapshot_block_le_0`**（**`block_number`→`snapshot_block<=0`**）/ **`rows_operation_id_null`**（**无 `tx_hash` 列**；**`tx_hash` 语义第三桶→`operation_id IS NULL`**，**`getter_note`** 钉映射）；**admin overview** + **`indexer-reconcile` `200`/`persist` `summary`**；**非** B-149/B-172；互证 [**母表 B-152**](./任务母表.md) · [**正文**](#tt-b152-governance-proposals-projection-null-fields-obs-001) |
| 153 | TT-B153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-001 | indexer / ops · 观测 | 已封口 | **B-153**：**`indexer_head_vs_db_latest_block_drift_observability`**（锚 **`153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-V1`**）；**`db_latest_block_source`**=**`event_log_max_block_number`**；**admin overview** + **`indexer-reconcile` `200`/`persist` `summary`**；**非** **`153-ORDERS-CHAIN-HEALTH-OBS-V1`**；互证 [**母表 B-153**](./任务母表.md) · [**正文**](#tt-b153-indexer-head-vs-db-latest-block-drift-obs-001) |
| 154 | TT-B154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-001 | indexer / ops · 观测 | 已封口 | **B-154**：**`indexer_reconcile_duration_batch_stats_observability`**（**`154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1`**）：**`reconcile_core_duration_ms`** + **`batch_row_counts`**；**`indexer-reconcile`/`persist` `summary`** + **admin `overview`**；**不**入 **compound**；互证 [**母表 B-154**](./任务母表.md) · [**正文**](#tt-b154-indexer-reconcile-duration-batch-stats-obs-001) |
| 155 | TT-B155-ORDERS-AMOUNT-CHAIN-VS-DB-DRIFT-MARKER-001 | orders / 对拍标记 | 已封口 | **B-155**：**`orders_amount_chain_vs_escrow_drift_observability`**（锚 **`155-ORDERS-AMOUNT-CHAIN-VS-ESCROW-DRIFT-OBS-V1`**）；**v1** **仅** **`currency`→decimals 白名单**（见母表 **B-155** **v1 封口**句），**未知货币**→**`unavailable_leg`**（**`unknown_currency_decimals`**）；**不**接管公开 orders；**不**与 **`rpc_escrow_samples`** 混用；互证 [**母表 B-155**](./任务母表.md) · [**正文**](#tt-b155-orders-amount-chain-vs-db-drift-marker-001) |
| 156 | TT-B156-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-001 | orders / ops · 链健康趋势 | 已封口 | **B-156**：**`orders_chain_health_trend_snapshot`**（**`by_batch`/`by_day`**；**`persist:true`** **summary** + **admin `overview`**；**JSON 锚字面量** **`156-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1`** **与实现一致**）；互证 [**母表 B-156**](./任务母表.md) · [**正文**](#tt-b156-orders-chain-health-trend-snapshot-001) |
| 157 | TT-B157-REGION-SNAPSHOT-AND-INDEXER-TICK-COUNTERS-CLOSE-001（叙事兼 **TT-B156-B115-4-…** / **TT-B157-INDEXER-TICK-…** 双子项） | revenue / 对拍观测；indexer / internal 收口 | 已封口 | **B-157 v1 封口**：**一壳两子项**（**RegionShareSnapshotLine**/**`region_share_snapshot_lines`** **DB 统计对拍** + **`indexer_tick` 四计数器收口**）；顶 **`b157_region_snapshot_and_tick_observability`**；**`indexer_tick_counters.legacy_parallel`** **镜像** **`events_applied`/`events_new`** **不静默更名**；**不**入 **compound**；互证 [**母表 B-157**](./任务母表.md) · [**正式封口正文**](#tt-b157-region-snapshot-and-indexer-tick-counters-close-001) · [**Region 子项正文**](#tt-b156-b115-4-region-share-snapshot-line-chain-db-reconcile-001) · [**tick 子项正文**](#tt-b157-indexer-tick-response-counters-standardize-001) |
| 158 | TT-B158-SSOT-GATE-FRONTEND-LOCKFILE-METADATA-SCOPE-001 | SSOT · 门禁 · frontend/lockfile | 已封口 | **B-158 v1**：**`gates/check-pr-crates-needs-metadata.sh`** 扩 **须登记 `frontend/**`** + **`package-lock.json`**（**根**/**`frontend/`**）；**豁免** **locales/public/e2e/scripts、md、test/spec、snap、fixtures、stories、工具根配置**（**全文见脚本头**）；**`CRATES_METADATA_GATE_*`** 与 **B-145** 同轨；**未**改公开 API；**未**接 compound；**contracts/run-*.sh** **regex** 修正；互证 [**母表 B-158**](./任务母表.md) · [**正文**](#tt-b158-ssot-gate-frontend-lockfile-metadata-scope-001) |
| 159 | TT-B159-INDEXER-GATE-CHECKS-TOTAL-DOC-TRIPLE-ALIGN-001 | ops · gate 三线对齐 | 已封口 | **B-159**：**checks_total=113**/**110**/**`scripts/ops/indexer-reconcile-probe.sh`**/**07**/**`internal-drill-gate` 互补叙述** 机读同锚；互证 [**母表 B-159**](./任务母表.md) · [**正文**](#tt-b159-indexer-gate-checks-total-doc-triple-align-001) |
| 160 | TT-B160-CORRECTION-EXECUTOR-ROWS-OBS-001 | ops · DB 观测 | 已封口 | **B-160 v1**：键 **`correction_executor_rows_observability`**（锚 **`160-CORRECTION-EXECUTOR-ROWS-OBS-V1`**）；**`correction_log`/`executor_executions`** 按链 **COUNT** + **`correction_log_latest_created_at`**（**`MAX(created_at)`**）+ **`executor_executions_latest_activity_at`**（**`MAX(GREATEST(created_at,updated_at))`**）；**`GET …/admin/observability/overview`** 与 **`POST …/internal/indexer-reconcile`** **`200`/`persist` `summary`** **同源同键**；**未**入 **`compound_gate`**；**未**改公开 **`GET /api/v1/*`**；**非** **`correction_executor_chain_scope_rollback_*`** 体；互证 [**母表 B-160**](./任务母表.md) · [**正文**](#tt-b160-correction-executor-rows-obs-001) |
| 161 | TT-B161-STAKE-LOCK-BLOCK-LAG-OBS-001 | indexer · 块滞后 | 已封口 | **B-161 v1**：**`investor_stake_state_events`/`investor_lock_state_events`** **按 `chain_id` `MAX(block_number)`** vs **`indexer_checkpoint_block_number`** → **`stake_lag_vs_checkpoint_blocks`/`lock_lag_vs_checkpoint_blocks`**（**checkpoint − max**，有行时；**负**=尾高于 checkpoint）；键 **`stake_lock_projection_block_lag_observability`**（**`161-STAKE-LOCK-PROJECTION-BLOCK-LAG-OBS-V1`**）；**admin `overview`** 与 **`indexer-reconcile` `200`/`persist` `summary`** **同源同键**；**非** **B-153**；**不**入 **`compound_gate`**；互证 [**母表 B-161**](./任务母表.md) · [**正文**](#tt-b161-stake-lock-block-lag-obs-001) |
| 162 | TT-B162-RPC-ESCROW-SAMPLE-META-ADMIN-OBS-001 | ops · sample meta | 已封口 | **B-162 v1**：**`overview.rpc_escrow_sample_meta`** = 最新 **`orders_projection_vs_orders`** **`reconciliation_reports.summary.rpc_escrow_sample_meta`**（**`admin_last_rpc_escrow_sample_meta`**）；**有值**须曾 **`persist:true`+`rpc_escrow_samples>0`**；**无库/无报告/缺键** **占位**（**`110-RPC-ESCROW-SAMPLE-META`**）；**未**入 **`compound_gate`**；**未**改公开 **`GET /api/v1/*`**；互证 [**母表 B-162**](./任务母表.md) · [**正文**](#tt-b162-rpc-escrow-sample-meta-admin-obs-001) |
| 164 | TT-B164-FEE-ROUTES-VS-ROUTED-EVENTS-DRIFT-MARKER-001 | governance · 对拍 | 已封口 | **B-164 v1**：键 **`fee_router_fee_routes_vs_routed_events_drift_observability`**（**`164-FEE-ROUTES-VS-ROUTED-EVENTS-DRIFT-OBS-V1`**）；**`fee_routes_desc_head`** / **`routed_events_aggregate`** / **`fee_routes_chronological_tail`** + **`checks.head_block_vs_max_block`/`tail_block_vs_min_block`**；**admin `overview`** 与 **`indexer-reconcile` `200`/`persist` `summary`** **同源同键**；**未**入 **`compound_gate`**；**未**改 **`GET …/governance/fee-routes`**；**非** **B-155**/**B-157** **子项 A**；互证 [**母表 B-164**](./任务母表.md) · [**正文**](#tt-b164-fee-routes-vs-routed-events-drift-marker-001) |
| 165 | TT-B165-VAULT-FORWARDS-VS-FORWARDED-EVENTS-DRIFT-MARKER-001 | governance · 对拍 | 已封口 | **B-165 v1**：键 **`vault_forwards_vs_forwarded_events_drift_observability`**（**`165-VAULT-FORWARDS-VS-FORWARDED-EVENTS-DRIFT-OBS-V1`**）；**`vault_forwards_desc_head`** / **`forwarded_events_aggregate`** / **`vault_forwards_chronological_tail`** + **`checks.head_block_vs_max_block`/`tail_block_vs_min_block`**；**admin `overview`** 与 **`indexer-reconcile` `200`/`persist` `summary`** **同源同键**；**未**入 **`compound_gate`**；**未**改 **`GET …/governance/vault-forwards`**；**非** **B-157** **子项 A**；互证 [**母表 B-165**](./任务母表.md) · [**正文**](#tt-b165-vault-forwards-vs-forwarded-events-drift-marker-001) |
| 166 | TT-B166-CHAIN-TIP-RECONCILE-META-NARRATIVE-ALIGN-001 | indexer · 叙事对齐 | 已封口 | **B-166 v1**：**`/meta` `chain_tip_not_in_meta`/`chain_tip_hint`** 与 **`reconcile` `include_chain_tip`→`chain_observation`** **并列运维观测**；**非** SSOT；**未**改 JSON 结构；**未**入 **`compound_gate`**；**非** **B-153**；互证 [**母表 B-166**](./任务母表.md) · [**正文**](#tt-b166-chain-tip-reconcile-meta-narrative-align-001) |
| 167 | TT-B167-META-INDEXER-110-04-ALIGN-001 | API · 807 收口 | 已封口 | **B-167 v1**：**`GET /meta` `indexer.*`** 键序与 **`INDEXER_*_META_TOP_KEYS`**、**04 §3.4**、**110 §3.1.1** **同源对齐**；**未**改 JSON 结构、**未**改 compound gate、**文案与测试收口**；**非** **B-150/157**；互证 [**母表 B-167**](./任务母表.md) · [**正文**](#tt-b167-meta-indexer-110-04-align-001) |
| 168 | TT-B168-ESCROW-STATUS-CHAIN-VS-DB-DRIFT-MARKER-001 | orders · 对拍 | 已封口 | **B-168 v1**：**`get_escrow_status`** vs **`orders.status`** **粗终端**；**`escrow_status_chain_vs_orders_drift_observability`**（锚 **`168-ESCROW-STATUS-CHAIN-VS-ORDERS-DRIFT-OBS-V1`**）；抽样 **`updated_at DESC`**、**≤10**、**须 `escrow_address`**；根 **`marker`** **drift > unavailable_leg > aligned**；**admin overview**/**reconcile `persist` summary** 同源；与 **B-155** **仅 `boundary_*` 互指、不混用**；互证 [**母表 B-168**](./任务母表.md) · [**正文**](#tt-b168-escrow-status-chain-vs-db-drift-marker-001) |
| 169 | TT-B169-INDEXER-REORG-SENTINEL-OBS-001 | indexer · reorg 哨兵 | 已封口 | **B-169**：**reorg_suspected**/**hash** 对读 **只读汇总**；**非** **B-157**；互证 [**母表 B-169**](./任务母表.md) · [**正文**](#tt-b169-indexer-reorg-sentinel-obs-001) |
| 170 | TT-B170-INDEXER-FINALITY-WINDOW-TRIPLE-OBS-001 | indexer · finality 三水线 | 已封口 | **B-170**：**tip / to_block / last_indexed** 并列；**非** **B-153**；互证 [**母表 B-170**](./任务母表.md) · [**正文**](#tt-b170-indexer-finality-window-triple-obs-001) |
| 171 | TT-B171-MULTI-CHAIN-DB-CHAIN-ID-FOOTPRINT-MATRIX-OBS-001 | cross-chain · DB 足迹 | 已封口 | **B-171**：**DISTINCT chain_id** 矩阵 vs **runtime**；**非** **B-151**；互证 [**母表 B-171**](./任务母表.md) · [**正文**](#tt-b171-multi-chain-db-chain-id-footprint-matrix-obs-001) |
| 172 | TT-B172-GOVERNOR-PROPOSAL-COUNT-CHAIN-VS-PROJECTION-DRIFT-001 | governance · 粗对拍 | 已封口 | **B-172**：**proposalCount** vs **projection 尾**；**细态**归 **B-149**；互证 [**母表 B-172**](./任务母表.md) · [**正文**](#tt-b172-governor-proposal-count-chain-vs-projection-drift-001) |
| 173 | TT-B173-TIMELOCK-DELAY-CHAIN-VS-META-BUNDLE-ALIGN-001 | governance · Timelock 镜像 | 已封口 | **B-173**：**getMinDelay** vs **meta/admin** bundle；互证 [**母表 B-173**](./任务母表.md) · [**正文**](#tt-b173-timelock-delay-chain-vs-meta-bundle-align-001) |
| 174 | TT-B174-INDEXER-TICK-FAIL-SKIP-BUCKET-OBS-001 | indexer · 失败分桶 | 已封口 | **B-174**：**failed/skipped** 按 **kind/reason** 分桶；**非** **B-157** 总计数；互证 [**母表 B-174**](./任务母表.md) · [**正文**](#tt-b174-indexer-tick-fail-skip-bucket-obs-001) |
| 175 | TT-B175-RPC-CHAIN-ID-VS-CONFIG-PROBE-RECONCILE-001 | cross-chain · 链身份探针 | 已封口 | **B-175**：**eth_chainId** vs **配置**；**非** **B-171**；互证 [**母表 B-175**](./任务母表.md) · [**正文**](#tt-b175-rpc-chain-id-vs-config-probe-reconcile-001) |
| 176 | TT-B176-PER-TABLE-INDEXED-TAIL-BY-CHAIN-MATRIX-OBS-001 | indexer · 多表尾块矩阵 | 已封口 | **B-176**：**MAX(block)** **按表按链**；**非** **B-161**；互证 [**母表 B-176**](./任务母表.md) · [**正文**](#tt-b176-per-table-indexed-tail-by-chain-matrix-obs-001) |
| 177 | TT-B177-META-GOVERNANCE-CHAIN-ALIGNMENT-04-110-ALIGN-001 | API · 807 治理对齐 | 已封口 | **B-177**：**meta governance*** + **pool** **04/110** 对齐；**非** **B-167**；互证 [**母表 B-177**](./任务母表.md) · [**正文**](#tt-b177-meta-governance-chain-alignment-04-110-align-001) |
| 178 | TT-B178-PHASE-CLOSE-DOCS-CODE-REORG-PLAN-001 | process · Phase Close 规划 | 已封口 | **B-178 主 TT**：**五节规划** + **附录 A/B** → [**Phase-Close-Docs-Code-Reorg-Plan-B178.md**](./Phase-Close-Docs-Code-Reorg-Plan-B178.md)；**切片已封口** → [**195**](#tt-b178-phase-close-indexer-reconcile-observability-001) / [**Phase-Close-Indexer-Reconcile-Observability-Alignment.md**](./Phase-Close-Indexer-Reconcile-Observability-Alignment.md)；互证 [**母表 B-178**](./任务母表.md) · [**正文**](#tt-b178-phase-close-docs-code-reorg-plan-001) |
| 179 | TT-DOC-MOD-BATCH1-INTERNAL-TESTS-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B1-02**：**`internal/tests/`** 集成测拆分；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch1-internal-tests-split-001) |
| 180 | TT-DOC-MOD-BATCH1-HEALTH-META-TESTS-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B1-03**：**`health_meta/tests.rs`**；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch1-health-meta-tests-split-001) |
| 181 | TT-DOC-MOD-BATCH1-ADMIN-TESTS-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B1-05**：**`admin/tests.rs`**；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch1-admin-tests-split-001) |
| 182 | TT-DOC-MOD-BATCH1-SCRIPTS-INDEX-001 | scripts / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B1-06**：**`scripts/INDEX.md`** + **README**；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch1-scripts-index-001) |
| 183 | TT-DOC-MOD-BATCH1-MESSAGES-COMMUNITY-JSON-SHELL-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B1-01**：**`internal/common`** **`db_unavailable`** **Json** + **`community`**；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch1-messages-community-json-shell-001) |
| 184 | TT-DOC-MOD-BATCH1-ORDERS-TESTS-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B1-04**：**`orders/tests/`** + **`mod tests`**；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch1-orders-tests-split-001) |
| 185 | TT-DOC-MOD-BATCH2-INTERNAL-INDEXER-DIR-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B2-01**：**`internal/indexer/`** 目录化（**tick/replay/reorg/env/meta_build** + **`pub use`**）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch2-internal-indexer-dir-split-001) |
| 186 | TT-DOC-MOD-BATCH2-INTERNAL-RECONCILE-DIR-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B2-02**：**`internal/reconcile/`** 目录化（**body/collectors/indexer_reconcile** + **`pub use`**）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch2-internal-reconcile-dir-split-001) |
| 187 | TT-DOC-MOD-BATCH3-COMMUNITY-DIR-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B3-01**：**`community/`** 公网目录化（**common/posts/dm_social/feedback_reports/router** + **`pub use router::router`**）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch3-community-dir-split-001) |
| 188 | TT-DOC-MOD-BATCH3-HEALTH-META-PROD-DIR-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B3-02**：**`health_meta/`** 生产代码目录化（**meta_contract_keys/meta_build/meta_helpers/pause_chain/handlers/router**；**`tests.rs`** 不动）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch3-health-meta-prod-dir-split-001) |
| 189 | TT-DOC-MOD-BATCH3-COMMUNITY-HEALTH-META-MOD-ALIGN-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B3-03**：**`community/mod.rs`** + **`health_meta/mod.rs`** 装配层对齐（**tests 置尾**、**pub use 注释**、**router 优先**；**不**改 handler/JSON）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch3-community-health-meta-mod-align-001) |
| 190 | TT-DOC-MOD-BATCH3-GOVERNANCE-DIR-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B3-04**：**`governance.rs`** → **`governance/mod.rs`** 第一层目录化（**move-only**；**不**改 governance HTTP/JSON/guard；**B-110** 判定未改）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch3-governance-dir-split-001) |
| 191 | TT-DOC-MOD-BATCH3-GOVERNANCE-LAYER2-DIR-SPLIT-001 | api / 程序级模块化 | 已封口 | **B-163** / **TT-MOD-B3-05**：**`governance/`** 第二层 **分域**（**common/pool_chain/governance_pool/…/router**；**move-only**；**`governance::router()`** 与导出不变）；互证 [**母表 B-163**](./任务母表.md) · [**正文**](#tt-doc-mod-batch3-governance-layer2-dir-split-001) |
| 192 | TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V1-CLOSE-001 | ops / admin · 阈值告警 v1 基线 | 已封口 | **B-188**：**`overview.alerts.*`** **与** **`observability_alerting_v1.alert_summary`** **同源**；**reconcile** **仅** **`include_observability_alerting_v1:true`**；**前端** **仅展示**；**不**入 **compound**；**v2 见 193**；**v3 见 194**；互证 [**母表 B-188**](./任务母表.md) · [**正文**](#tt-b188-observability-threshold-alerts-v1-close-001) |
| 193 | TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V2-CLOSE-001 | ops / admin · 阈值告警 v2 持久化 | 已封口 | **B-188**：**`schema_version`**=**2**（**v3 起为 3**，见 **194**）、**cooldown 去抖**、**`recent_events`**、**`persist`**（**`postgresql`**/**`memory_only`**）；**上线前须迁移 `20260426000055`**；**v3 规则外置见 194**；互证 [**母表 B-188**](./任务母表.md) · [**正文**](#tt-b188-observability-threshold-alerts-v2-close-001) |
| 194 | TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V3-CLOSE-001 | ops / admin · 阈值告警 v3 配置外置 | 已封口 | **B-188**：**`schema_version`**=**3**、**`rules_config`**（**`config_source`**、**`env_and_database`** **DB 覆盖**、**`config_fingerprint`**、**`effective_thresholds`**、**`rules_catalog`**）；**`GET …/admin/observability/alert-rules`**；**迁移 `20260427000056`**；互证 [**母表 B-188**](./任务母表.md) · [**正文**](#tt-b188-observability-threshold-alerts-v3-close-001) |
| 195 | TT-B178-PHASE-CLOSE-INDEXER-RECONCILE-OBSERVABILITY-001 | process · Phase Close 切片 | 已封口 | **B-178 切片**：**B-147～B-177** **前提**下 **indexer/reconcile/observability**（**+ B-188** **对读**）**全链路对齐证明**；**[`Phase-Close-Indexer-Reconcile-Observability-Alignment.md`](./Phase-Close-Indexer-Reconcile-Observability-Alignment.md)**；**零** JSON/接口 diff；**主五节** → [**Phase-Close-Docs-Code-Reorg-Plan-B178.md**](./Phase-Close-Docs-Code-Reorg-Plan-B178.md)（**178** **已封口**）；互证 [**母表 B-178**](./任务母表.md) · [**正文**](#tt-b178-phase-close-indexer-reconcile-observability-001) |
| 196 | TT-B179-DOCS-CANONICAL-ENTRY-DEDUP-001 | process · docs 总入口 | 已封口 | **B-179**：**[`00-文档索引.md`](./00-文档索引.md)** **第 1～2 节** **与** **[Phase-Close §1](./Phase-Close-Docs-Code-Reorg-Plan-B178.md#1文档归类结果)** **路径/重复入口** **对齐**；**去** **§3** **重复 Phase Close 行**；**互证** [**母表 B-179**](./任务母表.md) · [**正文**](#tt-b179-docs-canonical-entry-dedup-001) |
| 197 | TT-B180-BATCH-ARCHIVE-ANCHOR-TOC-001 | process · Batch 归档 | 已封口 | **B-180**：**[`Execution-Batch-Archive-B147-B177.md`](./Execution-Batch-Archive-B147-B177.md)** **目录行 + 固定锚 id**（**单文件三章**）；**不** **改** **B-147～B-177** **母表/索引语义**；**互证** [**母表 B-180**](./任务母表.md) · [**正文**](#tt-b180-batch-archive-anchor-toc-001) |
| 198 | TT-B181-INTERNAL-ROUTES-OBSERVABILITY-DIR-SPLIT-001 | api · internal reorg | 已封口 | **B-181**：**`observability.rs`+`observability_shell.rs`** → **`internal/observability/{mod,shell,routes}.rs`**（**move-only**；**不**动 **`indexer/`**、**`reconcile/`**）；**互证** [**母表 B-181**](./任务母表.md) · [**正文**](#tt-b181-internal-routes-observability-dir-split-001) |
| 199 | TT-B187-SSOT-GAP-BACKFILL-MOTHER-TABLE-REGISTRY-001 | process / 台账 · 缺口母卡 | **已封口**（**2026-04-14** · **Pass-0** **完整** **+** **Pass-2** **收口**） | **B-187**：**多源未完成项** → **母表+TT** **分批登记**（**本母卡** **已归档**）；**去重** 现有 **B-**/TT；**子行** **B-189～B-216** **等** **见** **正文** **Pass-1/Pass-2** **表**；**真源** **07·6.3A**、**缺口 P1/P2**、**04 §3.4 Partial**、**88/110/53/Wave**；互证 [**母表 B-187**](./任务母表.md) · [**正文**](#tt-b187-ssot-gap-backfill-mother-table-registry-001) |
| 200 | TT-B189-DID-RANK-WEIGHTED-RANK-BASIS-V1-001 | did-rank / API · §3.1 加权主序 | 已封口 | **B-189**：**`sort=weighted`** **`rank_basis`** **`guide_s31_weighted_primary_*`** + **04-附录 1.23** + **04 §3.4** + **30** + **08-3** + **check-55**/**smoke**/**didRank.test**；**非** **B-098**；互证 [**母表 B-189**](./任务母表.md) · [**正文**](#tt-b189-did-rank-weighted-rank-basis-v1-001) |
| 201 | TT-B190-DOC-DUAL-WRITE-PROD-08-3-SIGNOFF-001 | ops / 文档 · 双写生产定稿 | 已封口 | **B-190**：**Runbook §9** **②** + **并行观测（③ 类）** + **08-3 附录 A/变更记录**（**2026-04-13**）；**evidence** [**TT-B190-dual-write-prod-signoff.md**](../evidence/GO_20260413/artifacts/TT-B190-dual-write-prod-signoff.md)；**不**改 **`GET /meta`** **键名** **与** HTTP 契约；互证 [**母表 B-190**](./任务母表.md) · [**正文**](#tt-b190-doc-dual-write-prod-08-3-signoff-001) |
| 202 | TT-B191-TRAVELTRUST-PAGE-04-13-1-CLOSE-001 | frontend / 路由契约 · `/traveltrust` | 已封口（**实现轮完成**） | **B-191**：**`GET /api/v1/traveltrust/page-brief`**（**`crates/api/src/routes/traveltrust_page.rs`** + **`routes/mod.rs`**）；**04 §3.3/§3.4** **`/traveltrust` Implemented** + **page-brief** 行；**13-1 表 1 · Network** **Implemented**；**`frontend/app/traveltrust/page.tsx`** **`TravelTrustPageBriefHydrate`**、**`frontend/lib/api.ts`**、**`frontend/lib/analytics.ts`** **`source`/`target`**；**85** **封口清单** **1/3/7** **与** **CTA·埋点·`page-brief`** **对齐**（**台账同批** **登记**）；互证 [**母表 B-191**](./任务母表.md) · [**正文**](#tt-b191-traveltrust-page-04-13-1-close-001) |
| 203 | TT-B192-110-FULL-CHAIN-SCAN-SCOPE-001 | indexer / 规划 · 110 全链扫 | 已封口（**2026-04-13** · **文档轮**） | **B-192**：**110 §3.1.2.1** **全量扫链 Target** 与 **B-114** **切片** **分界** **钉界**；**三角互指** **110**/**母表 B-192**/**07 §六 6.3A**；**实现轮** **另 TT**；互证 [**母表 B-192**](./任务母表.md) · [**正文**](#tt-b192-110-full-chain-scan-scope-001) |
| 204 | TT-B193-EVM-POST-FEEROUTER-PARTIAL-SCOPE-001 | contracts / 规划 · 14 §1.1.1 余量 | 已封口（**2026-04-13** · **文档轮**） | **B-193**：**14 §1.1.1.1** **FeeRouter 之后** **Partial/Target** **余量子域表**；**三角互指** **14**/**B-116**/**B-193**/**07 §六 6.3A**；**子域实现** **另开 TT**；互证 [**母表 B-193**](./任务母表.md) · [**正文**](#tt-b193-evm-post-feerouter-partial-scope-001) |
| 205 | TT-B194-85-APPENDIX-HI-COMPONENT-SPEC-001 | traveltrust / 85 附录 H·I | 已封口（**2026-04-13** · **实现完成**） | **B-194**：**85 附录 v1.0.0.4** **§H/§I** **可生成代码级**；**组件拆分** + **i18n 单源** + **Vitest**；**`tsc` / `cargo test -p traveltrust-api` / `run-check-04-routes`** **绿**；**未改** **04/07**；互证 [**母表 B-194**](./任务母表.md) · [**正文**](#tt-b194-85-appendix-hi-component-spec-001) |
| 206 | TT-B195-85-MOTION-PRESETS-LIB-001 | traveltrust / Motion B.3 | **已封口**（**2026-04-14**） | **B-195**：**`traveltrustMotionPresets.ts`** + **page 三处** + **Vitest** + **S23-06 Full**；**B.3 对读** → [**evidence/GO_B195_MOTION_B3_READOFF.md**](../evidence/GO_B195_MOTION_B3_READOFF.md)；互证 [**母表 B-195**](./任务母表.md) · [**正文**](#tt-b195-85-motion-presets-lib-001) |
| 207 | TT-B196-85-VIDEO-ASSET-08-4-GATE-001 | traveltrust / 视频 §九 | **已封口**（**2026-04-14** · **示意资产**） | **B-196**：**`public/traveltrust/video/`** + **`CAPTIONS_*`** + **Vitest**；**证据** [**GO_B196**](../evidence/GO_B196_VIDEO_ASSET_08_4_CLOSE.md)；**S23-05** **仍** **Partial**；互证 [**母表 B-196**](./任务母表.md) · [**正文**](#tt-b196-85-video-asset-08-4-gate-001) |
| 208 | TT-B197-85-ALLOCATION-84-SSOT-001 | traveltrust / Allocation·84 | **已封口**（**2026-04-14** · **SSOT 工程**） | **B-197**：**`traveltrustAllocation84Ssot`** + **Vitest** **锁** **84** **版本** + **Placeholder**；**证据** [**GO_B197**](../evidence/GO_B197_ALLOCATION_84_SSOT_CLOSE.md)；**S23-10** **仍** **Partial**；互证 [**母表 B-197**](./任务母表.md) · [**正文**](#tt-b197-85-allocation-84-ssot-001) |
| 209 | TT-B198-85-ANALYTICS-PRODUCTION-PIPE-001 | traveltrust / 埋点 | **已封口**（**2026-04-14**） | **B-198**：**`trackTravelTrustEvent`** **`gtag`/`ingest`**；**`NEXT_PUBLIC_TRAVELTRUST_ANALYTICS_REQUIRE_CONSENT`** **门闸** + **`TravelTrustAnalyticsConsentBar`** + **`/privacy` §3**；**`lib/analytics.test.ts`** + **ConsentBar Vitest**；互证 [**母表 B-198**](./任务母表.md) · [**正文**](#tt-b198-85-analytics-production-pipe-001) · [**GO_B198**](../evidence/GO_B198_ANALYTICS_CLOSE.md) |
| 210 | TT-B199-85-SEC23-ACCEPTANCE-EVIDENCE-001 | traveltrust / §廿三 | 已封口（**2026-04-13** · **验收完成**） | **完成** **85 §廿三** **S23-01～S23-12** **验收证据填充**；**CLI** / **测试** / **源码对齐** **证据已归档于** **GO_85_TRAVELTRUST** **与** **`artifacts/`**；**B-199** **历史轮** **未改** **07** **契约**；**后续** **04 §3.4** **diff** **见** **B-200** **封口** **同批**。互证 [**母表 B-199**](./任务母表.md) · [**正文**](#tt-b199-85-sec23-acceptance-evidence-001) |
| 211 | TT-B200-85-PHASE2-ALLOCATION-ROUTE-001 | traveltrust / Phase 2 | **已封口**（**2026-04-14**） | **B-200**：**`/allocation`** **+** **04/13-1** **+** **`page-brief.p1_target`**；**证据** [**GO_B200**](../evidence/GO_B200_ALLOCATION_PHASE2_CLOSE.md)；互证 [**母表 B-200**](./任务母表.md) · [**正文**](#tt-b200-85-phase2-allocation-route-001) |
| 212 | TT-B182-ADMIN-OBS-OVERVIEW-SUBDOMAIN-SPLIT-001 | admin / Phase Close · B-182 | 已封口 | **B-182**：**`routes/admin`** **薄装配** + **域文件** **收口**（**04** **零漂移**）；互证 [**母表 B-182**](./任务母表.md) · [**正文**](#tt-b182-admin-obs-overview-subdomain-split-001) |
| 213 | TT-B183-CHAIN-OFF-SUBDIR-GROUPING-REORG-001 | api / Phase Close · B-183 | 已封口（**2026-04-14**） | **B-183**：**`chain_off/governance/`** + **`reconcile/replay_orders_projection`**；互证 [**母表 B-183**](./任务母表.md) · [**正文**](#tt-b183-chain-off-subdir-grouping-reorg-001) |
| 214 | TT-B184-SCRIPTS-README-GATES-OPS-NARRATIVE-001 | scripts / Phase Close · B-184 | 已封口（**2026-04-14** · **Phase Close 完成**） | **B-184**：**`scripts/README`** gates/ops/dev 叙事；互证 [**母表 B-184**](./任务母表.md) · [**正文**](#tt-b184-scripts-readme-gates-ops-narrative-001) |
| 215 | TT-B185-UNIFIED-OBSERVABILITY-JSON-SHELL-IMPL-001 | ops / Phase Close · B-185 | **已封口**（**2026-04-14**） | **B-185**：**`indexer_observability_v1`** **全腿** **+** **`observed_at`**（**admin/reconcile** **同源**）；互证 [**母表 B-185**](./任务母表.md) · [**正文**](#tt-b185-unified-observability-json-shell-impl-001) |
| 216 | TT-B186-B166-NARRATIVE-PROBE-DOCS-TESTS-001 | docs / Phase Close · B-186 | **已封口**（**2026-04-14**） | **B-186**：**B-166** 叙事/探针文档与测；互证 [**母表 B-186**](./任务母表.md) · [**正文**](#tt-b186-b166-narrative-probe-docs-tests-001) |
| 217 | TT-B201-ENTERPRISE-API-RS-FOOTPRINT-AUDIT-001 | api / 企业审计 | 已封口 | **B-201**：**`crates/api`** **`.rs`** 治理型快照（**[Enterprise-Code-Footprint-Audit-API-Rust.md](./Enterprise-Code-Footprint-Audit-API-Rust.md)**）；**对读** **check-48**；互证 [**母表 B-201**](./任务母表.md) · [**正文**](#tt-b201-enterprise-api-rs-footprint-audit-001) |
| 218 | TT-B202-ENTERPRISE-FRONTEND-TS-FOOTPRINT-AUDIT-001 | frontend / 企业审计 | 已封口 | **B-202**：前端 **≥550** 行治理快照（**[Enterprise-Code-Footprint-Audit-Frontend.md](./Enterprise-Code-Footprint-Audit-Frontend.md)**）；互证 [**母表 B-202**](./任务母表.md) · [**正文**](#tt-b202-enterprise-frontend-ts-footprint-audit-001) |
| 219 | TT-SOLO-ROADMAP-MVP-001 | process · 1 人极简路线图 | **进度锚点（非阻塞）** | **聚合任务目标**：**P0～P4** **演示闭包**；**[路线图-1人开发极简版.md](./路线图-1人开发极简版.md)** **SSOT**；**不替代** **单张业务 TT**；互证 [**母表 · 1 人极简总序**](./任务母表.md#1-人开发极简路线图总序) · [**正文**](#tt-solo-roadmap-mvp-001) |
| 220 | TT-B203-85-HERO-MOTION-B3-ALIGN-001 | traveltrust / Hero · §C.3 | **已封口**（**2026-04-14**） | **B-203**：**Hero** **`fadeInUp`/`fadeIn` + `traveltrustHeroEntrance`**；**§C.3** **≤0.45s**；**证据** [**GO_B203_HERO_MOTION_CLOSE**](../evidence/GO_B203_HERO_MOTION_CLOSE.md)；互证 [**母表 B-203**](./任务母表.md) · [**正文**](#tt-b203-85-hero-motion-b3-align-001) |
| 221 | TT-B204-110-FULL-CHAIN-SCAN-IMPLEMENTATION-001 | indexer / 110 · 全链扫最小切片 | **已封口**（**2026-04-14**） | **B-204**：**`INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`** **+** **`full_scan_lower_bound_observability`**（**110/04/08-3** **同批**）；**互证** [**母表 B-204**](./任务母表.md) · [**正文**](#tt-b204-110-full-chain-scan-implementation-001) |
| 222 | TT-B205-GOVERNANCE-POOL-TREASURY-ERC20-SSOT-HANDLER-001 | governance / B110-SSOT-06 | **已封口**（**2026-04-14**） | **B-205**：**`treasury_erc20_pool*`** **handler**（**04/14** **所称** **`TT-SSOT-SWITCH-APPLY-003`** **之索引正式 ID**）；互证 [**母表 B-205**](./任务母表.md) · [**正文**](#tt-b205-governance-pool-treasury-erc20-ssot-handler-001) |
| 223 | TT-B206-14-POST-FEEROUTER-FIRST-SUBDOMAIN-IMPL-001 | contracts / 14 §1.1.1.1 | 已封口（**2026-04-14**） | **B-206**：**FeeRouter** **country 档** **双桶**（**`setCountryBucketSplit`**）；互证 [**母表 B-206**](./任务母表.md) · [**正文**](#tt-b206-14-post-feerouter-first-subdomain-impl-001) |
| 224 | TT-B207-04-MEDIA-SIGNED-URLS-BLOB-001 | api / 04 §3.4 · media blob | **已封口**（**2026-04-14**） | **B-207**：**`TRAVELTRUST_MEDIA_EVIDENCE_FETCH_URL_TEMPLATE`** **→** **`GET …/media/access/:token_id`** **字节体**（**批 270**）；互证 [**母表 B-207**](./任务母表.md) · [**正文**](#tt-b207-04-media-signed-urls-blob-001) |
| 225 | TT-B208-14-REGIONVAULT-TABLE-ROW2-SUBDOMAIN-001 | api / 14 §1.1.1.1a · RegionVault 导出切片 | **已封口**（**2026-04-14**） | **B-208**：**admin/internal** **`…/region-vault/forwarded-events/export`** + **`include_snapshot_explain`**；互证 [**母表 B-208**](./任务母表.md) · [**14 §1.1.1.1a**](./spec/14-合约-API-ABI-前后端对齐.md) · [**正文**](#tt-b208-14-regionvault-table-row2-subdomain-001) |
| 226 | TT-B209-110-FULL-CHAIN-SCAN-MAX-BLOCK-SPAN-V1-001 | indexer / 110 · 全链扫批宽切片 | **已封口**（**2026-04-14**） | **B-209**：**`INDEXER_TICK_MAX_BLOCK_SPAN`** **+** **`indexer_tick_max_block_span_observability`**（**承 B-192/B-204**）；互证 [**母表 B-209**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b209-110-full-chain-scan-max-block-span-v1-001) |
| 227 | TT-B210-110-INDEXER-EVIDENCE-MANIFEST-FULL-SCAN-REGISTRY-001 | indexer / 110 · evidence manifest 全链扫登记 | **已封口**（**2026-04-14**） | **B-210**：**`manifest.json`** **`indexer_full_scan_catchup_registry`**（**`110-INDEXER-EVIDENCE-FULL-SCAN-REGISTRY-V1`**）**十字登记** **B-204/B-209** **tick ENV**；互证 [**母表 B-210**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b210-110-indexer-evidence-manifest-full-scan-registry-001) |
| 228 | TT-B211-110-INDEXER-TICK-LOOP-ORCHESTRATION-001 | indexer / 110 · internal 多 tick 批编排 | **已封口**（**2026-04-14**） | **B-211**：**`internal-indexer-ops` `tick-loop`**（**`110-INDEXER-TICK-LOOP-ORCHESTRATION-V1`**）**反复** **`POST …/internal/indexer-tick` `{}`**；互证 [**母表 B-211**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b211-110-indexer-tick-loop-orchestration-001) |
| 229 | TT-B212-110-INDEXER-TICK-LOOP-RUN-OBSERVABILITY-001 | indexer / 110 · tick-loop 运行级观测聚合 | **已封口**（**2026-04-14**） | **B-212**：**`tick-loop` stdout** **`indexer_tick_loop_run_observability`**（**`110-INDEXER-TICK-LOOP-RUN-OBSERVABILITY-V1`**；**`rounds[]`****+****`run_summary`**）；**不**改 **单次 tick** **体**/**evidence manifest** **schema**；互证 [**母表 B-212**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b212-110-indexer-tick-loop-run-observability-001) |
| 230 | TT-B213-110-INDEXER-TICK-LOOP-EVIDENCE-JSON-WRITE-001 | indexer / 110 · tick-loop 可选 JSON 落盘 | **已封口**（**2026-04-14**） | **B-213**：**`--write-evidence-json`****/** **`INDEXER_TICK_LOOP_EVIDENCE_JSON`** **→** **落盘** **`indexer_tick_loop_evidence_write`**（**`110-INDEXER-TICK-LOOP-EVIDENCE-JSON-WRITE-V1`**）；**stdout** **无** **evidence_write**；**不**改 **B-210** **manifest** **根** **schema**；互证 [**母表 B-213**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b213-110-indexer-tick-loop-evidence-json-write-001) |
| 231 | TT-B214-FEEROUTER-B081-RECEIPT-MOCK-STABLE-001 | api / FeeRouter · b081 测去抖 | **已封口**（**2026-04-14**） | **B-214**：**`b081_db_row_matches_transaction_receipt_platform_fee_routed_decode`** **mock** **`std::thread`****+** **重试**；**承** **B-081** **receipt** **路径**；互证 [**母表 B-214**](./任务母表.md) · [**正文**](#tt-b214-feerouter-b081-receipt-mock-stable-001) |
| 232 | TT-B215-110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-SCOPE-001 | indexer / 110 · 全集链上证明钉界 | **已封口**（**2026-04-14** · **文档轮**） | **B-215**：**「全集链上证明」** **验收要素** **+** **显式排除** **+** **与 B-204～B-213/B-210** **关系**；**实现体** **见** **一览** **233**/**TT-B216**；互证 [**母表 B-215**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b215-110-full-chain-historical-completeness-proof-scope-001) |
| 233 | TT-B216-110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0-JSON-GATE-001 | indexer / 110 · 全集证明最小 JSON + gate | **已封口**（**2026-04-14**） | **B-216**：**`write-indexer-historical-completeness-proof.sh`** **+** **`internal-indexer-ops` `historical-completeness-proof`**；**锚** **`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`**；**gate** **`checks_total`****`122`**；**承** **B-215**；**零** **`indexer-tick`** **语义** **diff**；互证 [**母表 B-216**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b216-110-full-chain-historical-completeness-proof-v0-json-gate-001) |
| 234 | TT-B217-110-INDEXER-TICK-RPC-PACING-V1-001 | indexer / 110 · indexer-tick JSON-RPC pacing | **已封口**（**2026-04-14**） | **B-217**：**`INDEXER_TICK_MIN_RPC_INTERVAL_MS`** **+** **`indexer_tick_rpc_pacing_observability`**；**锚** **`110-INDEXER-TICK-RPC-PACING-V1`** **`→`****`rpc_pacing.rs`**；**gate** **`checks_total`****`123`**；**排除** **`apply_escrow_loop`** **`eth_getTransactionByHash`**（**B-094**）；互证 [**母表 B-217**](./任务母表.md) · [**04 §3.4**](./spec/04-后端与API.md) · [**正文**](#tt-b217-110-indexer-tick-rpc-pacing-v1-001) |
| 235 | TT-B218-14-FEEROUTER-ROUTED-EVENTS-EXPORT-001 | api / 14 §1.1.1.1 · FeeRouter 柱 C 导出 | **已封口**（**2026-04-14**） | **B-218**：**admin/internal** **`…/fee-router/routed-events/export`**（**对称 B-208**；**无** **`include_snapshot_explain`**）；互证 [**母表 B-218**](./任务母表.md) · [**04 §3.4/§3.5**](./spec/04-后端与API.md) · [**正文**](#tt-b218-14-feerouter-routed-events-export-001) |
| 236 | TT-B219-110-EVIDENCE-BUNDLE-CANONICAL-COMBINE-001 | indexer / 110 · evidence 三件套标准化汇编 | **已封口**（**2026-04-14**） | **B-219**：**`write-indexer-evidence-bundle-canonical.sh`** + **`evidence-bundle-canonical`**；**锚** **`110-INDEXER-EVIDENCE-BUNDLE-CANONICAL-V1`**；**gate** **`checks_total`****`125`**；互证 [**母表 B-219**](./任务母表.md) · [**110 §3.1.2.1**](./spec/110-阶段开发链上索引器与事件同步器.md) · [**正文**](#tt-b219-110-evidence-bundle-canonical-combine-001) |
| 237 | TT-B220-110-GATE-CHECKS-TOTAL-CONSISTENCY-SWEEP-001 | docs / indexer gate · `checks_total` 现行句横扫 | **已封口**（**2026-04-14** · **文档轮**） | **B-220**：**`indexer-reconcile-gate`/`probe`/110 §3.1.2/**`RUNBOOK`/`scripts/README`/`07`/`04`/`08-3`** **现行** **`checks_total=125`** **同锚**（**承** **B-219** **YAML**）；**零** **workflow**/**sh** **常量** **diff**；互证 [**母表 B-220**](./任务母表.md) · [**正文**](#tt-b220-110-gate-checks-total-consistency-sweep-001) |
| 238 | TT-B221-110-RUNBOOK-EVIDENCE-BUNDLE-USAGE-CANONICAL-001 | docs / Runbook · B-219 evidence-bundle 标准用法 | **已封口**（**2026-04-14** · **文档轮**） | **B-221**：**`RUNBOOK` §2.55**/**`scripts/README`** **一键**/**目录树**/**校验**（**`sha256sum`/`shasum -c`**、**`jq`****`bundle_anchor`**、**`bash -n`**）**固化** **B-219** **`evidence-bundle-canonical`**；**零** **脚本语义** **diff**；互证 [**母表 B-221**](./任务母表.md) · [**母表 B-219**](./任务母表.md) · [**正文**](#tt-b221-110-runbook-evidence-bundle-usage-canonical-001) |
| 239 | TT-B222-110-EVIDENCE-BUNDLE-CI-AUTO-RUN-001 | CI / indexer-reconcile-gate · evidence-bundle artifact | **已封口**（**2026-04-14**） | **B-222**：**`indexer-reconcile-gate.yml`** **离线** **fixture** **汇编** **`indexer_evidence_bundle_canonical_ci`** **+** **`sha256sum -c`**/**`jq`** **+** **`upload-artifact`**；**`checks_total`****`125`** **不变**；互证 [**母表 B-222**](./任务母表.md) · [**B-221**](./任务母表.md) · [**正文**](#tt-b222-110-evidence-bundle-ci-auto-run-001) |
| 240 | TT-B223-14-REGIONVAULT-COUNTRY-LEDGER-READ-MODEL-V1-001 | api / 14 · RegionVault 辖区 Σ 读模型 | **已封口**（**2026-04-14**） | **B-223**：**`region_vault_forwarded_events`** **只读** **admin/internal** **`country-ledger-read-model`**；**可选** **`REGION_VAULT_COUNTRY_LEDGER_MAP_PATH`**；互证 [**母表 B-223**](./任务母表.md) · [**正文**](#tt-b223-14-regionvault-country-ledger-read-model-v1-001) |
| 241 | TT-B224-14-REGIONVAULT-LEDGER-SNAPSHOT-EXPLAIN-EXPORT-001 | api / 14 · RegionVault 辖区 Σ 导出 + snapshot explain | **已封口**（**2026-04-14**） | **B-224**：**B-223** **附件** **`country-ledger-read-model/export`** **JSON/CSV** **对齐** **B-208**；互证 [**母表 B-224**](./任务母表.md) · [**正文**](#tt-b224-14-regionvault-ledger-snapshot-explain-export-001) |
| 242 | TT-B225-14-REGIONVAULT-SNAPSHOT-CLAIM-READINESS-GATE-001 | api / 14 · RegionVault snapshot claim 就绪门禁 | **已封口**（**2026-04-14**） | **B-225**：**`region_share_snapshot_lines`** **+** **Vault** **投影** **只读** **`readiness`**；**`GET …/admin|internal/region-vault/snapshot-claim-readiness`**；互证 [**母表 B-225**](./任务母表.md) · [**正文**](#tt-b225-14-regionvault-snapshot-claim-readiness-gate-001) |
| 243 | TT-B226-14-REGIONVAULT-CLAIM-DRYRUN-PAYLOAD-001 | api / 14 · RegionVault claim dry-run 载荷 | **已封口**（**2026-04-14**） | **B-226**：**承** **B-225** **`ready`**；**`GET …/admin|internal/region-vault/snapshot-claim-dryrun-payload(/export)`**；互证 [**母表 B-226**](./任务母表.md) · [**正文**](#tt-b226-14-regionvault-claim-dryrun-payload-001) |
| 244 | TT-B227-14-REGIONVAULT-CLAIM-BATCH-PLAN-EXPORT-001 | api / 14 · RegionVault 批次计划导出 | **已封口**（**2026-04-14**） | **B-227**：**承** **B-226**；**按** **`jurisdiction`****+****`snapshot_epoch`** **聚** **`batches[]`**；**`GET …/admin|internal/region-vault/snapshot-claim-batch-plan(/export)`**；互证 [**母表 B-227**](./任务母表.md) · [**正文**](#tt-b227-14-regionvault-claim-batch-plan-export-001) |
| 245 | TT-B228-14-REGIONVAULT-CLAIM-EXECUTION-EVIDENCE-STUB-001 | api / 14 · RegionVault claim 执行证据壳（stub） | **已封口**（**2026-04-14**） | **B-228**：**承** **B-227**；**`claim_execution_evidence_plan_id`****+****`execution_evidence_stub`****（** **`tx_hash`****/**`status`** **预留**）**；**`GET …/admin|internal/region-vault/snapshot-claim-execution-evidence-stub(/export)`**；互证 [**母表 B-228**](./任务母表.md) · [**正文**](#tt-b228-14-regionvault-claim-execution-evidence-stub-001) |
| 246 | TT-B229-14-REGIONVAULT-CLAIM-EXECUTION-STATUS-IMPORT-READMODEL-001 | api / 14 · RegionVault claim 执行状态导入只读模型 | **已封口**（**2026-04-14**） | **B-229**：**承** **B-228**；**可选** **导入** **`tx_hash`****/**`status`****/**`block_number`****/**`log_index`** **合并** **`execution_status_read_model`**；**`GET …/admin|internal/region-vault/snapshot-claim-execution-status-read-model(/export)`**；互证 [**母表 B-229**](./任务母表.md) · [**正文**](#tt-b229-14-regionvault-claim-execution-status-import-readmodel-001) |
| 247 | TT-B230-14-REGIONVAULT-CLAIM-EXECUTION-RECONCILE-REPORT-001 | api / 14 · RegionVault claim 执行合成 reconcile 报告 | **已封口**（**2026-04-14**） | **B-230**：**B-226～B-229** **合成** **`expected`****/**`executed`****/**`delta`**；**`GET …/admin|internal/region-vault/snapshot-claim-execution-reconcile-report(/export)`**；互证 [**母表 B-230**](./任务母表.md) · [**正文**](#tt-b230-14-regionvault-claim-execution-reconcile-report-001) |
| 248 | TT-B231-14-REGIONVAULT-CLAIM-GO-NO-GO-GATE-READONLY-001 | api / 14 · RegionVault claim GO/NO-GO 只读门禁 | **已封口**（**2026-04-14**） | **B-231**：**B-230** **+** **B-225** **`gates[]`**** **`verdict`**** **`GO`****/**`NO_GO`****/**`NO_OP`**；**`GET …/admin|internal/region-vault/snapshot-claim-go-no-go-gate(/export)`**；互证 [**母表 B-231**](./任务母表.md) · [**正文**](#tt-b231-14-regionvault-claim-go-no-go-gate-readonly-001) |
| 249 | TT-B232-14-REGIONVAULT-CLAIM-GO-NO-GO-EVIDENCE-BUNDLE-001 | api / 14 · RegionVault claim 只读证据包（admin） | **已封口**（**2026-04-14**） | **B-232**：**B-225～B-231** **`legs`****+****SHA256`****+** **CSV** **索引**；**`GET …/admin/region-vault/snapshot-claim-go-no-go-evidence-bundle(/export)`**；互证 [**母表 B-232**](./任务母表.md) · [**正文**](#tt-b232-14-regionvault-claim-go-no-go-evidence-bundle-001) |
| 250 | TT-B233-14-REGIONVAULT-CLAIM-EVIDENCE-BUNDLE-RUNBOOK-CI-001 | CI / 14 · RegionVault claim 证据包离线验收 | **已封口**（**2026-04-14**） | **B-233**：**承** **B-232**；**`TRAVELTRUST_CLAIM_GO_NO_GO_BUNDLE_CI_OUT`** **`cargo test … claim_go_no_go_evidence_bundle_ci_artifact`** **+** **`verify-claim-go-no-go-evidence-bundle.py ci`**；**Build** **artifact**；互证 [**母表 B-233**](./任务母表.md) · [**正文**](#tt-b233-14-regionvault-claim-evidence-bundle-runbook-ci-001) |
| 251 | TT-B234-14-REGIONVAULT-CLAIM-LIVE-ADMIN-VALIDATION-RUNBOOK-001 | ops / 14 · RegionVault claim 证据包联机 admin 验收 | **已封口**（**2026-04-14**） | **B-234**：**承** **B-232**/**B-233**；**`region-vault-claim-go-no-go-evidence-bundle-live-admin-validate.sh`** **200+SHA256+CSV8+summary**；互证 [**母表 B-234**](./任务母表.md) · [**正文**](#tt-b234-14-regionvault-claim-live-admin-validation-runbook-001) |
| 252 | TT-B235-14-REGIONVAULT-CLAIM-GO-NO-GO-LIVE-EVIDENCE-ARCHIVE-001 | ops / 14 · RegionVault claim GO/NO-GO 联机证据标准归档 | **已封口**（**2026-04-14**） | **B-235**：**承** **B-234**；**`archive-region-vault-claim-go-no-go-live-evidence.sh`** **`artifacts/`****+****`archive_manifest`****+****`ARCHIVE_README`****+****`README.md`****（** **B-236** **）****+****`artifacts.sha256`**（**锚** **`14-REGIONVAULT-CLAIM-GO-NO-GO-LIVE-EVIDENCE-ARCHIVE-V1`**）；互证 [**母表 B-235**](./任务母表.md) · [**正文**](#tt-b235-14-regionvault-claim-go-no-go-live-evidence-archive-001) |
| 253 | TT-B236-14-REGIONVAULT-CLAIM-LIVE-EVIDENCE-INDEX-README-001 | ops / 14 · RegionVault claim 联机证据归档索引 README | **已封口**（**2026-04-14**） | **B-236**：**承** **B-235**；**根** **`README.md`** **总览** **+** **`archive_manifest.json`** **`index`****/**`navigation`** **+** **复跑** **命令**（**锚** **`14-REGIONVAULT-CLAIM-LIVE-EVIDENCE-INDEX-README-V1`**）；互证 [**母表 B-236**](./任务母表.md) · [**正文**](#tt-b236-14-regionvault-claim-live-evidence-index-readme-001) |
| 254 | TT-B237-14-REGIONVAULT-CLAIM-LIVE-EVIDENCE-CI-ARCHIVE-SMOKE-001 | CI / 14 · RegionVault claim 联机证据归档 CI 冒烟 | **已封口**（**2026-04-14**） | **B-237**：**B-233** **fixture** **→** **B-234** **staging** **→** **`finalize-only`** **归档**；**`region-vault-claim-live-archive-ci-smoke.sh`** **+** **Build** **job** **步**；互证 [**母表 B-237**](./任务母表.md) · [**正文**](#tt-b237-14-regionvault-claim-live-evidence-ci-archive-smoke-001) |
| 255 | TT-B238-14-REGIONVAULT-CLAIM-GO-NO-GO-RELEASE-GATE-READONLY-001 | api / 14 · RegionVault claim GO/NO-GO 发布门禁只读摘要 | **已封口**（**2026-04-14**） | **B-238**：**B-231～B-237** **上** **`release_verdict`****+****`blocking_reasons`****+****`required_evidence_checklist`****+****`archive_integrity_checks`**；**`GET …/admin/region-vault/snapshot-claim-go-no-go-release-gate(/export)`**；互证 [**母表 B-238**](./任务母表.md) · [**正文**](#tt-b238-14-regionvault-claim-go-no-go-release-gate-readonly-001) |
| 256 | TT-B239-14-REGIONVAULT-CLAIM-GO-NO-GO-RELEASE-GATE-LIVE-ARCHIVE-001 | ops / 14 · RegionVault claim 发布门禁联机归档 | **已封口**（**2026-04-14**） | **B-239**：**承** **B-238** **`validate`****+****`archive-…-release-gate-live-evidence`** **同构** **B-235**；**`verify-claim-go-no-go-release-gate.py`**；互证 [**母表 B-239**](./任务母表.md) · [**正文**](#tt-b239-14-regionvault-claim-go-no-go-release-gate-live-archive-001) |
| 257 | TT-B240-14-REGIONVAULT-CLAIM-RELEASE-GATE-CI-ARCHIVE-SMOKE-001 | CI / 14 · RegionVault claim 发布门禁归档 CI 冒烟 | **已封口**（**2026-04-14**） | **B-240**：**fixture** **→** **B-239** **`finalize-only`** **+** **`live-full`** **+** **`sha256sum -c`**；**Build** **步** **接** **B-237**；互证 [**母表 B-240**](./任务母表.md) · [**正文**](#tt-b240-14-regionvault-claim-release-gate-ci-archive-smoke-001) |
| 258 | TT-B241-14-REGIONVAULT-CLAIM-RELEASE-GATE-LIVE-EVIDENCE-INDEX-README-001 | ops / 14 · RegionVault claim 发布门禁归档索引 README | **已封口**（**2026-04-14**） | **B-241**：**承** **B-239**/**B-240**；**`README.md`** **+** **`index.*`****+****`index.parity`** **（** **对** **齐** **B-236** **）**；互证 [**母表 B-241**](./任务母表.md) · [**正文**](#tt-b241-14-regionvault-claim-release-gate-live-evidence-index-readme-001) |
| 259 | TT-B242-14-REGIONVAULT-CLAIM-RELEASE-GATE-FINAL-GO-REPORT-READONLY-001 | api / 14 · RegionVault claim 发布门禁最终只读 GO 签署报告 | **已封口**（**2026-04-14**） | **B-242**：**承** **B-238** **+** **B-239/B-241**；**`GET …/admin/region-vault/snapshot-claim-go-no-go-release-gate-final-go-report(/export)`** **JSON+CSV**；**归档** **SHA** **query** **自** **证**；互证 [**母表 B-242**](./任务母表.md) · [**正文**](#tt-b242-14-regionvault-claim-release-gate-final-go-report-readonly-001) |
| 260 | TT-B248-14-REGIONVAULT-CLAIM-READONLY-PHASE-CLOSE-SUMMARY-001 | docs / 14 · RegionVault claim 只读链阶段正式封口 | **已封口**（**2026-04-14**） | **B-248**：**B-223～B-247** **六段闭环** **+** **边界** **+** **执行链** **须** **另开** **非只读** **母卡**；互证 [**母表 B-248**](./任务母表.md) · [**正文**](#tt-b248-14-regionvault-claim-readonly-phase-close-summary-001) · [**附录**](./spec/14-附录-RegionVault-Claim-只读链阶段封口-B248.md) |
| 261 | TT-B249-14-REGIONVAULT-CLAIM-EXECUTION-CHAIN-ENTRY-NONREADONLY-001 | docs / 14 · RegionVault claim 执行链入口（非只读母卡） | **未封口**（**入口** **母卡** **·** **2026-04-14**） | **B-249**：**承** **B-248**；**B-250～B-261** **只读** **彩排** **已** **封口** **（** **非** **执行** **子域** **封口** **）** **；** **B-262** **已** **登记** **首条** **JSON-RPC** **广播** **执行** **；** **B-263** **已** **登记** **`14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1`** **receipt** **单一** **证据** **源** **；** **B-264** **已** **登记** **`14-REGIONVAULT-CLAIM-BROADCAST-ONCHAIN-RECONCILE-V1`** **；** **B-265** **已** **登记** **B-264** **`GO`** **JSON** **进程内** **read-model** **+** **`forwarded`** **互证** **；** **B-266** **已** **登记** **`14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1`** **（** **`production-go-gate`** **双** **attestation** **+** **`production_verdict`****≠****`GO`** **默认** **exit** **1** **）** **；** **余** **量** **（** **合约** **`claim*`** **/** **新** **topic** **/** **新** **写** **HTTP** **等** **）** **须** **B-267+** **子** **TT** **；** **边界** **/** **权限** **/** **形态** **/** **风险** **见** **附录**；互证 [**母表 B-249**](./任务母表.md) · [**正文**](#tt-b249-14-regionvault-claim-execution-chain-entry-nonreadonly-001) · [**附录**](./spec/14-附录-RegionVault-Claim-执行链入口-B249.md) |
| 262 | TT-B250-14-REGIONVAULT-CLAIM-EXECUTION-DRYRUN-CLI-V1-001 | ops / 14 · RegionVault claim dryrun→交易清单 CLI（只读） | **已封口**（**2026-04-14**） | **B-250**：**B-226** **JSON** **→** **manifest** **（** **B-227** **批次** **）**；**不** **签名** **不** **广播**；互证 [**母表 B-250**](./任务母表.md) · [**正文**](#tt-b250-14-regionvault-claim-execution-dryrun-cli-v1-001) · **`scripts/ops/region_vault_claim_execution_dryrun_cli.py`** |
| 263 | TT-B251-14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-PLAN-STUB-001 | ops / 14 · RegionVault claim manifest 签名计划壳（只读） | **已封口**（**2026-04-14**） | **B-251**：**承** **B-250**；**`signing_plan_stub`** **默认** **开**；**`--omit-signing-plan-stub`**；互证 [**母表 B-251**](./任务母表.md) · [**正文**](#tt-b251-14-regionvault-claim-execution-signing-plan-stub-001) |
| 264 | TT-B252-14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-ARTIFACT-STUB-001 | ops / 14 · RegionVault claim 每批签名产物壳（只读） | **已封口**（**2026-04-14**） | **B-252**：**承** **B-251**；**`signing_artifact_stub`** **+** **`signing_artifact_tx_stub`**；**`--omit-signing-artifact-stub`**；互证 [**母表 B-252**](./任务母表.md) · [**正文**](#tt-b252-14-regionvault-claim-execution-signing-artifact-stub-001) |
| 265 | TT-B253-14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-OFFLINE-PACKAGE-001 | ops / 14 · RegionVault claim 离线签名包布局（只读） | **已封口**（**2026-04-14**） | **B-253**：**承** **B-252**；**`write <manifest.json> <out_dir>`** **→** **per-batch** **+** **`artifacts.sha256`** **+** **交接** **manifest**；互证 [**母表 B-253**](./任务母表.md) · [**正文**](#tt-b253-14-regionvault-claim-execution-signing-offline-package-001) |
| 266 | TT-B254-14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-STUB-IMPORT-001 | ops / 14 · RegionVault claim 签回回填只读导入壳 | **已封口**（**2026-04-14**） | **B-254**：**承** **B-253**；**`import-stub`** **manifest+package+returned→** **`14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-STUB-IMPORT-V1`**；互证 [**母表 B-254**](./任务母表.md) · [**正文**](#tt-b254-14-regionvault-claim-signed-backfill-stub-import-001) |
| 267 | TT-B255-14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-RECONCILE-STUB-001 | ops / 14 · RegionVault claim 签回对账只读 reconcile 壳 | **已封口**（**2026-04-14**） | **B-255**：**承** **B-254**；**`reconcile-stub`** **→** **`14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-RECONCILE-STUB-V1`** **+** **`reconcile_verdict_preview`**；互证 [**母表 B-255**](./任务母表.md) · [**正文**](#tt-b255-14-regionvault-claim-signed-backfill-reconcile-stub-001) |
| 268 | TT-B256-14-REGIONVAULT-CLAIM-BROADCAST-REQUEST-STUB-001 | ops / 14 · RegionVault claim 可广播请求只读壳 | **已封口**（**2026-04-14**） | **B-256**：**承** **B-255** **`GO`**；**`broadcast-request-stub`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-REQUEST-STUB-V1`**；互证 [**母表 B-256**](./任务母表.md) · [**正文**](#tt-b256-14-regionvault-claim-broadcast-request-stub-001) |
| 269 | TT-B257-14-REGIONVAULT-CLAIM-BROADCAST-DRYRUN-REHEARSAL-001 | ops / 14 · RegionVault claim 广播前排练只读校验 | **已封口**（**2026-04-14**） | **B-257**：**承** **B-256**；**`rehearsal-dryrun`** **校验** **序** **/** **前置** **/** **`operator_confirmation`** **/** **`tx_hash`**** **槽**；互证 [**母表 B-257**](./任务母表.md) · [**正文**](#tt-b257-14-regionvault-claim-broadcast-dryrun-rehearsal-001) |
| 270 | TT-B258-14-REGIONVAULT-CLAIM-BROADCAST-LIVE-ADMIN-GATE-STUB-001 | ops / 14 · RegionVault claim 临广播前人工闸口只读壳 | **已封口**（**2026-04-14**） | **B-258**：**承** **B-257** **报告** **+** **B-256**；**`gate-stub`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-LIVE-ADMIN-GATE-STUB-V1`**；互证 [**母表 B-258**](./任务母表.md) · [**正文**](#tt-b258-14-regionvault-claim-broadcast-live-admin-gate-stub-001) |
| 271 | TT-B259-14-REGIONVAULT-CLAIM-BROADCAST-EVIDENCE-STUB-001 | ops / 14 · RegionVault claim 待广播证据壳只读归档 | **已封口**（**2026-04-14**） | **B-259**：**合** **B-256～B-258**；**`evidence-stub`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-EVIDENCE-STUB-V1`**；互证 [**母表 B-259**](./任务母表.md) · [**正文**](#tt-b259-14-regionvault-claim-broadcast-evidence-stub-001) |
| 272 | TT-B260-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-IMPORT-STUB-001 | ops / 14 · RegionVault claim 广播结果链下导入只读壳 | **已封口**（**2026-04-14**） | **B-260**：**承** **B-259**；**`import-result-stub`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-RESULT-IMPORT-STUB-V1`**；互证 [**母表 B-260**](./任务母表.md) · [**正文**](#tt-b260-14-regionvault-claim-broadcast-result-import-stub-001) |
| 273 | TT-B261-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-RECONCILE-STUB-001 | ops / 14 · RegionVault claim 广播结果链下对账只读壳 | **已封口**（**2026-04-14**） | **B-261**：**承** **B-260**；**`reconcile-result-stub`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-RESULT-RECONCILE-STUB-V1`**；互证 [**母表 B-261**](./任务母表.md) · [**正文**](#tt-b261-14-regionvault-claim-broadcast-result-reconcile-stub-001) |
| 274 | TT-B262-14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-001 | ops / 14 · RegionVault claim 广播 JSON-RPC 执行与报告落盘 | **已封口**（**2026-04-14**） | **B-262**：**承** **B-256**；**`execute`** **`eth_sendRawTransaction`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-REPORT-V1`**；互证 [**母表 B-262**](./任务母表.md) · [**正文**](#tt-b262-14-regionvault-claim-broadcast-execution-001) |
| 275 | TT-B263-14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-001 | ops / 14 · RegionVault claim 广播 receipt 链上归档 | **已封口**（**2026-04-14**） | **B-263**：**承** **B-262**；**`archive-receipts`** **`eth_getTransactionReceipt`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1`**；互证 [**母表 B-263**](./任务母表.md) · [**正文**](#tt-b263-14-regionvault-claim-broadcast-receipt-archive-001) |
| 276 | TT-B264-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-RECONCILE-ONCHAIN-001 | ops / 14 · RegionVault claim 广播 B-262+B-263 链上对账 | **已封口**（**2026-04-14**） | **B-264**：**承** **B-262+B-263**；**`reconcile-onchain`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-ONCHAIN-RECONCILE-V1`**；互证 [**母表 B-264**](./任务母表.md) · [**正文**](#tt-b264-14-regionvault-claim-broadcast-result-reconcile-onchain-001) |
| 277 | TT-B265-14-REGIONVAULT-CLAIM-INDEXER-UPLIFT-ONCHAIN-001 | api / 14 · RegionVault claim B-264 JSON 读模型与 forwarded 互证 | **已封口**（**2026-04-14**） | **B-265**：**承** **B-264**；**`REGION_VAULT_CLAIM_ONCHAIN_RECONCILE_IMPORT_PATH`** **`GO`** **升格** **`execution_status_read_model`****+****`b265_indexer_uplift`**；**B-230～B-242** **同源**；互证 [**母表 B-265**](./任务母表.md) · [**正文**](#tt-b265-14-regionvault-claim-indexer-uplift-onchain-001) |
| 278 | TT-B266-14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-001 | ops / 14 · RegionVault claim B-263+B-264 生产 GO 闸（文件 + 双 attestation） | **已封口**（**2026-04-14**） | **B-266**：**承** **B-263～B-265**；**`production-go-gate`** **`onchain_reconcile.json`****+** **`receipt_archive.json`** **、** **`--attest-b265-indexer-uplift`****+** **`--attest-b230-b242-evidence-chain`** **；** **`production_verdict`****≠****`GO`** **默认** **exit** **1** **（** **`--allow-non-go-production`** **）** **；** **锚** **`14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1`** **；** 互证 [**母表 B-266**](./任务母表.md) · [**正文**](#tt-b266-14-regionvault-claim-production-go-gate-001) · **`scripts/ops/region_vault_claim_production_go_gate.py`**
| 279 | TT-METAPROVIDER-LOADING-ERROR-RESYNC-001 | frontend · `MetaProvider` / `useMeta` 上下文 | **已封口**（**2026-04-14**） | **B-269**：**修复** **`frontend/components/MetaProvider.tsx`** **在** **`t` 变化等二次 `getMeta()`** **前** **未** **`setLoading(true)`**/**`setError(null)`** **之** **loading/error** **状态机** **缺口** **；** **保留** **`finally` → `setLoading(false)`** **；** **不** **扩展** **业务** **语义** **。** **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0** **。** 互证 [**母表 B-269**](./任务母表.md) · [**正文**](#tt-metaprovider-loading-error-resync-001) |
| 280 | TT-FRIENDS-PARTIAL-ERROR-VISIBILITY-001 | community · `/community/friends` · 多腿 `allSettled` | **已封口**（**2026-04-14**） | **B-270**：**`frontend/app/community/friends/page.tsx`** **`Promise.allSettled`** **部分** **失败** **新增** **`partialLoadHint`** **弱** **提示** **；** **不** **打断** **主** **成功** **态** **渲染** **。** **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0** **。** 互证 [**母表 B-270**](./任务母表.md) · [**正文**](#tt-friends-partial-error-visibility-001) |
| 281 | TT-FINANCE-RECONCILIATION-PARTIAL-ERROR-VISIBILITY-001 | admin · `/admin/finance-reconciliation` · 财务枢纽 | **已封口**（**2026-04-14**） | **B-271**：**`frontend/app/admin/finance-reconciliation/page.tsx`** **主** **`GET …/finance/summary`** **成功** **`crossErr`****/** **`driftSummaryErr`** **时** **顶部** **弱** **提示** **`admin_finance_reconciliation_partial_load_hint`****+****`driftLegsRetryKey`** **局部** **重试** **；** **不** **打断** **主** **成功** **态** **。** **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0** **。** 互证 [**母表 B-271**](./任务母表.md) · [**正文**](#tt-finance-reconciliation-partial-error-visibility-001) |
| 282 | TT-ADMIN-ERROR-RESET-CONVENTION-UNIFICATION-001 | admin · `/admin/finance` · 首屏拉取错误清理惯例 | **已封口**（**2026-04-14**） | **B-272**：**`frontend/app/admin/finance/page.tsx`** **首屏** **`adminFetchJson`** **前** **`setLoading(true)`****+****`setError(null)`** **；** **统一** **admin** **首屏** **错误** **清理** **惯例** **。** **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0** **。** 互证 [**母表 B-272**](./任务母表.md) · [**正文**](#tt-admin-error-reset-convention-unification-001) |
| 283 | TT-GOVERNANCE-EM-DASH-CONSISTENCY-001 | frontend · governance · 空值占位 `ui_em_dash` | **已封口**（**2026-04-14**） | **B-273**：**治理** **相关** **页** **硬编码** **`"—"`** **空值** **→** **`t("ui_em_dash")`** **；** **不** **改** **句内** **`base`****—****`detail`****/** **`note`****—** **说明** **等** **拼接** **语义** **。** **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0** **。** 互证 [**母表 B-273**](./任务母表.md) · [**正文**](#tt-governance-em-dash-consistency-001) |
| 284 | TT-ADMIN-ERROR-DISPLAY-UNIFICATION-001 | admin · 首屏/摘要 · `ApiErrorAlert` 统一 | **已封口**（**2026-04-14**） | **B-274**：**8** **个** **admin** **页** **`adminErrorUserText`** **红框** **`role="alert"`** **→** **`ApiErrorAlert`** **；** **保留** **加载** **/** **重试** **/** **分支** **；** **不** **动** **warning** **黄框** **与** **非** **首屏** **页** **。** **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0** **。** 互证 [**母表 B-274**](./任务母表.md) · [**正文**](#tt-admin-error-display-unification-001) |
| 285 | TT-TESTNET-REAL-RUN-VALIDATION-001 | ops · testnet · B-262→B-266 真实链编排 + operator 证据 | **已封口**（**2026-04-14**） | **B-275**：**已** **落地** **`run_testnet_b262_b266_real.sh`****/** **`write_tt_testnet_real_run_evidence_summary.py`****/** **`evidence/testnet_real_run_validation/README.md`** **；** **具备** **真实** **`broadcast_request_stub`****+** **`CHAIN_RPC_URL`** **时** **可** **testnet** **全链路** **真实** **运行** **并** **聚合** **operator** **证据** **；** **登记** **轮** **CI** **/** **沙箱** **无** **真实** **tx** **；** **多** **笔** **连续** **nonce** **真实** **链** **证据** **见** **一览** **376** **`TT-B322-…`** **（** **2026-04-15** **封口** **）** **。** **验收**：**脚本** **+** **README** **路径** **。** 互证 [**母表 B-275**](./任务母表.md) · [**正文**](#tt-testnet-real-run-validation-001) · **[`ops/RUNBOOK.md`](../ops/RUNBOOK.md)** **§2.55** |
| 286 | TT-B276-BROADCAST-NONCE-PREFLIGHT-RPC-001 | ops · 广播 · B-262 前 nonce 与 RPC 单调预检 | **未封口**（**登记**） | **B-276**：**`preflight`**** **`-o`** **`14-REGIONVAULT-CLAIM-BROADCAST-NONCE-PREFLIGHT-REPORT-V1`** **；** **B-262** **`--require-preflight-ok`** **软** **强制** **（** **默认** **不** **传** **则** **不** **校验** **）** **。** **互证** [**母表 B-276**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) · **[`ops/RUNBOOK.md`](../ops/RUNBOOK.md)** |
| 287 | TT-B277-MULTISTEP-SIGNING-ORDER-CROSS-BATCH-001 | ops · 广播 · 多 batch 全局发送顺序表 | **未封口**（**登记**） | **B-277**：**静态** **顺序** **表** **与** **B-257** **一致** **。** **互证** [**母表 B-277**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 288 | TT-B278-PENDING-NONCE-GAP-DETECTOR-001 | ops · 广播 · pending nonce 空洞检测 | **未封口**（**登记**） | **B-278**：**只读** **mempool** **深度** **/** **空洞** **超阈** **可选** **阻断** **。** **互证** [**母表 B-278**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 289 | TT-B279-REPLACEMENT-AND-CANCELLED-TX-NONCE-001 | ops · 广播 · 替换/取消 tx 与证据对齐 | **未封口**（**登记**） | **B-279**：**Runbook+规则** **：** **同** **nonce** **替换** **后** **`tx_hash`** **与** **报告** **对齐** **。** **互证** [**母表 B-279**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 290 | TT-B280-MEMPOOL-ORDERING-DISCLOSURE-001 | ops · 广播 · mempool 顺序披露 | **未封口**（**登记**） | **B-280**：**B-266** **附属** **披露** **字段** **（** **默认** **不** **改** **`GO`** **判定** **）** **。** **互证** [**母表 B-280**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 291 | TT-B281-HOT-WALLET-NONCE-EXTERNAL-DRIFT-001 | ops · 广播 · 热钱包外部 nonce 漂移 | **未封口**（**登记**） | **B-281**：**多** **工具** **共用** **地址** **floor** **漂移** **检测** **。** **互证** [**母表 B-281**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 292 | TT-B282-IDEMPOTENT-RESUME-SKIP-MINED-STEPS-001 | ops · 广播 · 幂等续跑跳过已 mined | **未封口**（**登记**） | **B-282**：**`region_vault_claim_broadcast_pipeline_resume.py`** **`plan`****/**`write-resumed-stub`****/**`resume-execute`** **（** **根** **`region-vault-claim-broadcast-pipeline-resume.sh`** **）** **合并** **`execution_report`**** **、** **可选** **B-263～B-266** **；** **别名** **TT-B277-BROADCAST-PIPELINE-IDEMPOTENT-RESUME-AUTOMATION-001** **（** **非** **B-277** **母** **表** **TT** **）** **。** **互证** [**母表 B-282**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) · **[`ops/RUNBOOK.md`](../ops/RUNBOOK.md)** |
| 293 | TT-B283-B263-RECEIPT-FETCH-BACKOFF-001 | ops · B-263 · receipt 拉取退避 | **未封口**（**登记**） | **B-283**：**429/5xx/timeout** **分类** **退避** **，** **默认** **保守** **。** **互证** [**母表 B-283**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 294 | TT-B284-PARTIAL-RUN-OPERATOR-RUNBOOK-001 | ops · Runbook · 部分失败恢复 | **未封口**（**登记**） | **B-284**：**stub** **重签** **/** **nonce** **重算** **/** **`OUT_DIR`** **标准** **作业** **。** **互证** [**母表 B-284**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 295 | TT-B285-QUARANTINE-FAILED-STUB-SNAPSHOT-001 | ops · 证据 · 失败隔离包 | **未封口**（**登记**） | **B-285**：**quarantine** **包** **写入** **`operator_run_evidence`** **。** **互证** [**母表 B-285**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 296 | TT-B286-REPLAY-GUARD-STUB-CONTENT-HASH-001 | ops · 广播 · stub 内容哈希重放防护 | **未封口**（**登记**） | **B-286**：**可选** **sha256** **+** **env** **二次** **确认** **。** **互证** [**母表 B-286**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 297 | TT-B287-MANUAL-OVERRIDE-WITH-JUSTIFICATION-001 | ops · 广播 · override 审计理由 | **未封口**（**登记**） | **B-287**：**`--allow-non-go-*`** **须** **`OVERRIDE_REASON`** **落** **JSON** **。** **互证** [**母表 B-287**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 298 | TT-B288-MIN-CONFIRMATIONS-OPTIONAL-GATE-001 | ops · B-266 · 最小确认数闸 | **未封口**（**登记**） | **B-288**：**可选** **env** **块** **深** **不足** **不** **默认** **`GO`** **。** **互证** [**母表 B-288**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 299 | TT-B289-REORG-RECEIPT-INVALIDATION-NOTE-001 | ops · 广播 · reorg 披露与头校验 | **未封口**（**登记**） | **B-289**：**证据** **说明** **+** **可选** **`safe|finalized`** **脚本** **。** **互证** [**母表 B-289**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 300 | TT-B290-RPC-CHAIN-TIP-LAG-WATCH-001 | ops · 广播 · 链尖滞后 watch | **未封口**（**登记**） | **B-290**：**双** **RPC** **尖** **滞后** **可选** **阻断** **。** **互证** [**母表 B-290**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 301 | TT-B291-GAS-PREFLIGHT-AND-FEE-CAP-001 | ops · 广播 · gas 预检与费用帽 | **未封口**（**登记**） | **B-291**：**feeHistory** **估算** **+** **cap** **超阈** **exit** **。** **互证** [**母表 B-291**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 302 | TT-B292-TX-TYPE-MATRIX-ANVIL-VS-PUBLIC-001 | ops · 广播 · tx 类型矩阵 | **未封口**（**登记**） | **B-292**：**legacy** **/** **1559** **×** **chainId** **文档** **+** **小** **测** **。** **互证** [**母表 B-292**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 303 | TT-B293-FINALITY-MODE-ENV-001 | ops · 广播 · finality 模式 env | **未封口**（**登记**） | **B-293**：**`TRAVELTRUST_FINALITY_MODE`** **统一** **口径** **。** **互证** [**母表 B-293**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 304 | TT-B294-SCHEDULED-BROADCAST-SMOKE-CRON-001 | ops · CI/cron · 缩短烟测 | **未封口**（**登记**） | **B-294**：**定时** **B-262→B-266** **缩短** **链** **失败** **告警** **。** **互证** [**母表 B-294**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 305 | TT-B295-EVIDENCE-BUNDLE-TAR-AND-MANIFEST-001 | ops · 证据 · tar+manifest | **未封口**（**登记**） | **B-295**：**`OUT_DIR`** **打包** **与** **sha256** **清单** **。** **互证** [**母表 B-295**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 306 | TT-B296-OPERATOR-RUN-STRUCTURED-JSONL-001 | ops · 证据 · operator 结构化元数据 | **未封口**（**登记**） | **B-296**：**who/when/git_sha** **等** **扩展** **`operator_run_evidence`** **。** **互证** [**母表 B-296**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 307 | TT-B297-RPC-URL-REDACTION-REGRESSION-TEST-001 | ops · 安全 · RPC URL 脱敏回归 | **未封口**（**登记**） | **B-297**：**自动化** **断言** **日志** **无** **完整** **凭据** **。** **互证** [**母表 B-297**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 308 | TT-B298-EVIDENCE-RETENTION-AND-INDEX-001 | ops · 证据 · 保留期与 INDEX | **未封口**（**登记**） | **B-298**：**`evidence/…/INDEX.md`** **模板** **。** **互证** [**母表 B-298**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 309 | TT-B299-RUNBOOK-VERSION-PIN-001 | ops · Runbook · 版本钉 | **未封口**（**登记**） | **B-299**：**命令** **旁** **commit/tag** **。** **互证** [**母表 B-299**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 310 | TT-B300-MAINNET-SECOND-OPERATOR-ACK-001 | ops · 广播 · 主网第二 ack | **未封口**（**登记**） | **B-300**：**双** **人** **/** **工单** **号** **元数据** **。** **互证** [**母表 B-300**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 311 | TT-B301-STUB-INTEGRITY-SIGNING-OPTIONAL-001 | ops · 广播 · stub 可选验签 | **未封口**（**登记**） | **B-301**：**GPG/minisign** **可选** **门禁** **。** **互证** [**母表 B-301**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 312 | TT-B302-ETH-SEND-RAW-RATE-LIMIT-001 | ops · 广播 · sendRaw 限流 | **未封口**（**登记**） | **B-302**：**QPS**/**并发** **上限** **。** **互证** [**母表 B-302**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 313 | TT-B303-BREAK-GLASS-AND-ROLLBACK-ROLES-001 | ops · 合规 · break-glass 角色 | **未封口**（**登记**） | **B-303**：**override** **批准** **与** **24h** **补证** **。** **互证** [**母表 B-303**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 314 | TT-B304-RPC-KEY-ROTATION-RUNBOOK-001 | ops · RPC · key 轮换 Runbook | **未封口**（**登记**） | **B-304**：**零** **改** **业务** **配置** **切换** **步骤** **。** **互证** [**母表 B-304**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 315 | TT-B305-ALLOWLIST-RPC-HOST-PREFIX-001 | ops · 广播 · RPC host 白名单 | **未封口**（**登记**） | **B-305**：**`TRAVELTRUST_CHAIN_RPC_URL_ALLOWLIST`** **前缀** **匹配** **。** **互证** [**母表 B-305**](./任务母表.md) · [**正文**](#tt-b276-b305-live-ops-enhancement-pack-registry-001) |
| 316 | TT-B306-07-PR-PREFLIGHT-SCRIPT-MATRIX-INDEX-001 | doc · 07 §二 2.3 · PR 前预检脚本矩阵索引 | **已封口**（**2026-04-14**） | **B-306**：**已** **新增** **[`docs/scripts-ops-preflight-matrix.md`](./scripts-ops-preflight-matrix.md)** **（** **`scripts/ops`**** **矩阵** **+** **07** **/** **CONTRIBUTING** **/** **`scripts/README`**** **互** **指** **）** **；** **`scripts/ops`**** **无** **行为** **diff** **。** **互证** [**母表 B-306**](./任务母表.md) · [**registry**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 317 | TT-B307-GOVERNANCE-DOC-LINKAGE-FAILURE-RUNBOOK-001 | doc · 07 §二 2.4 · 治理联动门禁失败 Runbook | **已封口**（**2026-04-14**） | **B-307**：**Runbook** **[§12.7.1](../ops/RUNBOOK.md#1271-governance-doc-linkage-failure-triage)** **分流** **表** **+** **07** **§二 2.4** **CI** **基线** **互** **指** **+** **`scripts/README`** **/** **门禁** **头** **注释** **。** **互证** [**母表 B-307**](./任务母表.md) · [**registry**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 318 | TT-B308-WAVE-EVIDENCE-GO-DIR-TEMPLATE-ALIGN-001 | doc · 07 §零 0.4.1 · GO 证据目录与 15 附录〇对齐 | **未封口**（**登记**） | **B-308**：**`evidence/GO_*`** **模板** **互** **指** **15** **。** **互证** [**母表 B-308**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 319 | TT-B309-P15-APPENDIX-O-P0-ROW-MAP-001 | doc · 15 附录〇 · 与缺口官方总表 P0 映射 | **未封口**（**登记**） | **B-309**：**附录〇** **↔** **P0** **行** **映射** **表** **。** **互证** [**母表 B-309**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 320 | TT-B310-110-CHECKS-TOTAL-TRIPLE-DOC-SYNC-CHECKLIST-001 | doc · 110 + 07 · checks_total 三文档同批核对 | **未封口**（**登记**） | **B-310**：**indexer-reconcile-gate** **锚** **变更** **清单** **。** **互证** [**母表 B-310**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 321 | TT-B311-87-USERS-ROLE-PREFLIGHT-INVENTORY-001 | db · 87 §11 · users.role 迁移前只读盘点 | **未封口**（**登记**） | **B-311**：**SQL** **+** **模板** **，** **不** **改** **默认** **枚举** **。** **互证** [**母表 B-311**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 322 | TT-B312-88-FIVE-ROUTES-SHELL-UX-MATRIX-AUDIT-001 | frontend · 88 · 五主路由壳层 UX 与 86 矩阵差分 | **未封口**（**登记**） | **B-312**：**Loading** **/** **Empty** **审计** **表** **。** **互证** [**母表 B-312**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 323 | TT-B313-70-ADMIN-RBAC-04-ROUTE-DELTA-TABLE-001 | admin · 70 · RBAC 与 04 admin 路由差分 | **未封口**（**登记**） | **B-313**：**路由** **矩阵** **vs** **70** **叙事** **。** **互证** [**母表 B-313**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 324 | TT-B314-04-INTERNAL-REQUIRE-REFS-GATE-DOC-001 | api · 04 · internal 路由 REQUIRE_REFS 纪律 | **未封口**（**登记**） | **B-314**：**登记** **门禁** **说明** **。** **互证** [**母表 B-314**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 325 | TT-B315-53-ORDER-TERMINAL-VS-ESCROW-SSOT-001 | product · 53 · 订单终端态 vs Escrow SSOT | **未封口**（**登记**） | **B-315**：**对照** **表** **，** **不** **改** **Happy** **路径** **。** **互证** [**母表 B-315**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 326 | TT-B316-14-ABI-FORGE-SYNC-ANTI-DRIFT-HINT-001 | contracts · 14 · ABI forge 同步防 drift | **未封口**（**登记**） | **B-316**：**流程** **提示** **/** **可选** **hook** **文案** **。** **互证** [**母表 B-316**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 327 | TT-B317-83-84-COUNTRY-LEDGER-PROJECTION-GLOSSARY-001 | doc · 83/84 · country-ledger 与 110 投影 glossary | **未封口**（**登记**） | **B-317**：**只读** **字段** **映射** **。** **互证** [**母表 B-317**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 328 | TT-B318-FEE-ROUTER-INTERNAL-EXPORT-FIELD-GLOSSARY-001 | doc · FeeRouter · internal 导出 JSON glossary | **未封口**（**登记**） | **B-318**：**字段** **/** **admin** **边界** **。** **互证** [**母表 B-318**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 329 | TT-B319-FRONTEND-429-RETRY-04-ALIGNMENT-001 | frontend · 429 重试与 04 约定对齐 | **未封口**（**登记**） | **B-319**：**退避** **/** **错误** **包** **说明** **。** **互证** [**母表 B-319**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 330 | TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC-001 | doc · NEXT_PUBLIC 与 .env.example 机读 diff 规格 | **未封口**（**登记**） | **B-320**：**键** **全集** **对齐** **规格** **。** **互证** [**母表 B-320**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 331 | TT-B321-I18N-KEY-PARITY-LINT-SPEC-001 | frontend · i18n en/zh 对称 lint 规格 | **未封口**（**登记**） | **B-321**：**可选** **npm** **脚本** **。** **互证** [**母表 B-321**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 332 | TT-B322-CI-TSC-VITEST-BUDGET-DOC-001 | ci · tsc/vitest/cargo 分轨耗时预算文档 | **未封口**（**登记**） | **B-322**：**默认** **不** **改** **workflow** **语义** **。** **互证** [**母表 B-322**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 333 | TT-B323-API-CARGO-FEATURES-SURFACE-MAP-001 | api · Cargo features 暴露面地图 | **未封口**（**登记**） | **B-323**：**feature** **→** **路由** **/** **依赖** **。** **互证** [**母表 B-323**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 334 | TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER-001 | db · 迁移正向回滚策略 + RUNBOOK 指针 | **未封口**（**登记**） | **B-324**：**Wave 2** **叙事** **对齐** **。** **互证** [**母表 B-324**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 335 | TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP-001 | doc · evidence manifest 与 15 签字项映射 | **未封口**（**登记**） | **B-325**：**人工** **签字** **逐条** **模板** **。** **互证** [**母表 B-325**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 336 | TT-B326-INTERNAL-DRILL-GATE-WORKFLOW-PARAMS-TABLE-001 | ci · internal-drill-gate 参数与 artifact 表 | **未封口**（**登记**） | **B-326**：**workflow** **一页** **说明** **。** **互证** [**母表 B-326**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 337 | TT-B327-DEV-START-STOP-PORT-MATRIX-AUDIT-001 | doc · 起停脚本与文档端口矩阵审计 | **未封口**（**登记**） | **B-327**：**8080** **/** **3012** **等** **一致性** **。** **互证** [**母表 B-327**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 338 | TT-B328-90-AUTH-04-SESSION-BOUNDARY-SSOT-001 | doc · 90 身份与 04 auth 会话边界 SSOT | **未封口**（**登记**） | **B-328**：**一句** **分界** **。** **互证** [**母表 B-328**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 339 | TT-B329-100-RISK-53-DISPUTE-API-MATRIX-001 | doc · 100 风控 vs 53 争议 API 责任矩阵 | **未封口**（**登记**） | **B-329**：**防** **双** **SSOT** **。** **互证** [**母表 B-329**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 340 | TT-B330-55-VS-INDEXER-SCOPE-SSOT-001 | doc · 55 数据同步 vs 110 indexer 职责分界 | **未封口**（**登记**） | **B-330**：**一句** **SSOT** **。** **互证** [**母表 B-330**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 341 | TT-B331-AUDIT-DEPS-SEVERITY-CI-POLICY-DOC-001 | doc · npm/cargo audit 分级与 CI 策略登记 | **未封口**（**登记**） | **B-331**：**不** **改** **默认** **除非** **单** **卡** **封口** **。** **互证** [**母表 B-331**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 342 | TT-B332-CHECK-08-CONSISTENCY-REMEDIATION-RUNBOOK-001 | doc · check-08-consistency 失败修复 Runbook | **未封口**（**登记**） | **B-332**：**08-3** **/** **08-4** **指针** **。** **互证** [**母表 B-332**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 343 | TT-B333-27-ARCHIVED-LINK-FIX-BATCH-DISCIPLINE-001 | doc · 27-archived 链接修复同批纪律 | **未封口**（**登记**） | **B-333**：**`fix_27_archived_links`** **触发** **条件** **。** **互证** [**母表 B-333**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 344 | TT-B334-MULTI-TABLE-OBS-SHELL-DEDUP-SCAN-SHEET-001 | doc · 观测壳键扩展前重复维度扫描表 | **未封口**（**登记**） | **B-334**：**承** **B-171** **/** **B-176** **防** **重复** **规则** **。** **互证** [**母表 B-334**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 345 | TT-B335-SOLO-MVP-VS-MOTHER-TABLE-OPEN-QUEUE-INDEX-001 | doc · Solo MVP 与母表未封口队列对照索引 | **未封口**（**登记**） | **B-335**：**选** **卡** **背板** **；** **须** **覆盖** **一览** **286～375** **（** **B-276～B-365** **三** **registry** **）** **。** **互证** [**母表 B-335**](./任务母表.md) · [**正文**](#tt-b306-b335-07-aligned-backlog-registry-001) |
| 346 | TT-B336-API-IDEMPOTENCY-KEY-HEADER-SPEC-001 | api · 04 · 写操作 Idempotency-Key 规格 | **未封口**（**登记**） | **B-336**：**幂等** **头** **与** **04** **登记** **。** **互证** [**母表 B-336**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 347 | TT-B337-WEBHOOK-OUTBOX-DELIVERY-SPEC-001 | api · webhook outbox 投递叙事规格 | **未封口**（**登记**） | **B-337**：**无** **默认** **生产** **实现** **。** **互证** [**母表 B-337**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 348 | TT-B338-CORS-ALLOWLIST-MATRIX-ADMIN-PUBLIC-001 | security · CORS admin/public 矩阵 | **未封口**（**登记**） | **B-338**：**允许** **源** **/** **方法** **文档** **。** **互证** [**母表 B-338**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 349 | TT-B339-CSP-POLICY-GAP-AUDIT-DOC-001 | security · CSP/安全头缺口审计 | **未封口**（**登记**） | **B-339**：**分** **阶段** **目标** **。** **互证** [**母表 B-339**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 350 | TT-B340-STRUCTURED-LOG-FIELD-REGISTRY-001 | observability · 结构化日志键注册表 | **未封口**（**登记**） | **B-340**：**request_id** **等** **。** **互证** [**母表 B-340**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 351 | TT-B341-INTERNAL-METRICS-NAMING-CONVENTION-001 | observability · internal 指标命名与基数 | **未封口**（**登记**） | **B-341**：**与** **B-171/B-176** **不** **重复** **。** **互证** [**母表 B-341**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 352 | TT-B342-LOG-PII-REDACTION-TIERING-GUIDE-001 | security · 日志 PII 脱敏分级 | **未封口**（**登记**） | **B-342**：**L1/L2** **指南** **。** **互证** [**母表 B-342**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 353 | TT-B343-DB-BACKUP-RESTORE-DRILL-RUNBOOK-001 | ops · DB 备份恢复演练 Runbook | **未封口**（**登记**） | **B-343**：**桌面** **演练** **字段** **。** **互证** [**母表 B-343**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 354 | TT-B344-FLAKY-TEST-QUARANTINE-CI-POLICY-001 | ci · flaky quarantine 策略 | **未封口**（**登记**） | **B-344**：**默认** **不** **改** **workflow** **。** **互证** [**母表 B-344**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 355 | TT-B345-BRANCH-PROTECTION-REQUIRED-CHECKS-DOC-001 | repo · 分支保护与 required checks | **未封口**（**登记**） | **B-345**：**清单** **文档** **。** **互证** [**母表 B-345**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 356 | TT-B346-ESCROW-PATH-ERROR-BOUNDARY-COVERAGE-MAP-001 | frontend · Escrow 错误边界覆盖图 | **未封口**（**登记**） | **B-346**：**兜底** **地图** **。** **互证** [**母表 B-346**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 357 | TT-B347-FIVE-ROUTES-RESPONSIVE-TOUCH-TARGET-AUDIT-001 | frontend · 五主路由断点与 touch target | **未封口**（**登记**） | **B-347**：**86/88** **审计** **。** **互证** [**母表 B-347**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 358 | TT-B348-KEY-PAGES-LCP-BUDGET-DOC-001 | frontend · 关键页 LCP 预算 | **未封口**（**登记**） | **B-348**：**perf** **文档** **。** **互证** [**母表 B-348**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 359 | TT-B349-I18N-DATE-NUMBER-FORMAT-SSOT-001 | frontend · Intl 日期数字格式 SSOT | **未封口**（**登记**） | **B-349**：**13-1** **对齐** **。** **互证** [**母表 B-349**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 360 | TT-B350-FE-API-TYPE-ALIGNMENT-CHECKLIST-001 | contract · FE/API 类型对齐清单 | **未封口**（**登记**） | **B-350**：**OpenAPI** **/** **手写** **。** **互证** [**母表 B-350**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 361 | TT-B351-ADR-TEMPLATE-AND-CODEOWNERS-MAP-001 | doc · ADR 模板与 CODEOWNERS 映射 | **已封口**（**2026-04-14**） | **B-351**：**[`docs/adr/`](./adr/README.md)** **模板** **+** **[`CODEOWNERS-map.md`](./CODEOWNERS-map.md)** **；** **`.github/CODEOWNERS`** **注释** **占位** **；** **07** **§6.3C** **/** **CONTRIBUTING** **互** **指** **。** **互证** [**母表 B-351**](./任务母表.md) · [**registry**](#tt-b336-b365-platform-reliability-registry-001) |
| 362 | TT-B352-INCIDENT-SEVERITY-ESCALATION-RUNBOOK-001 | ops · 事故等级与升级 Runbook | **未封口**（**登记**） | **B-352**：**响应** **时限** **。** **互证** [**母表 B-352**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 363 | TT-B353-DATA-RETENTION-TABLE-MATRIX-001 | compliance · 表级保留期矩阵 | **未封口**（**登记**） | **B-353**：**匿名化** **触发** **。** **互证** [**母表 B-353**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 364 | TT-B354-RATE-LIMIT-BUCKET-ADMIN-PUBLIC-DOC-001 | api · 429 分桶 admin/public | **未封口**（**登记**） | **B-354**：**承** **B-319** **叙事** **。** **互证** [**母表 B-354**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 365 | TT-B355-SECRETS-SCAN-PRECOMMIT-SPEC-001 | security · secret 扫描接入规格 | **未封口**（**登记**） | **B-355**：**pre-commit** **/** **CI** **。** **互证** [**母表 B-355**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 366 | TT-B356-DEPENDENCY-AUTOMATION-MERGE-POLICY-DOC-001 | deps · 依赖自动 PR 合并策略 | **未封口**（**登记**） | **B-356**：**机器人** **门槛** **。** **互证** [**母表 B-356**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 367 | TT-B357-OPENAPI-OR-SSOT-EXPORT-SMOKE-COMMAND-001 | api · OpenAPI/SSOT 导出烟测登记 | **未封口**（**登记**） | **B-357**：**脚本** **索引** **。** **互证** [**母表 B-357**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 368 | TT-B358-HEALTH-READY-SLO-AND-PROBE-CONTRACT-001 | api · health/ready SLO 与探针 | **未封口**（**登记**） | **B-358**：**契约** **一页** **。** **互证** [**母表 B-358**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 369 | TT-B359-GRACEFUL-SHUTDOWN-DRAIN-DEPLOY-DOC-001 | deploy · 优雅停机与排空 | **未封口**（**登记**） | **B-359**：**preStop** **对齐** **。** **互证** [**母表 B-359**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 370 | TT-B360-FEATURE-FLAG-LIFECYCLE-CLEANUP-LIST-001 | platform · feature flag 生命周期 | **未封口**（**登记**） | **B-360**：**退役** **清理** **。** **互证** [**母表 B-360**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 371 | TT-B361-SUBPROCESSOR-LIST-SHELL-001 | compliance · 子处理器清单壳 | **未封口**（**登记**） | **B-361**：**08-4** **/** **15** **。** **互证** [**母表 B-361**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 372 | TT-B362-RPO-RTO-TARGETS-AND-EVIDENCE-POINTER-001 | ops · RPO/RTO 目标与证据指针 | **未封口**（**登记**） | **B-362**：**DR** **文档** **。** **互证** [**母表 B-362**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 373 | TT-B363-INDEXER-RPC-DEGRADATION-TABLETOP-SPEC-001 | ops · indexer RPC 降级桌面演练 | **未封口**（**登记**） | **B-363**：**不** **默认** **打** **生产** **。** **互证** [**母表 B-363**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 374 | TT-B364-CONVENTIONAL-COMMITS-CHANGELOG-DOC-001 | repo · Conventional Commits 与 changelog | **未封口**（**登记**） | **B-364**：**发版** **注释** **。** **互证** [**母表 B-364**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 375 | TT-B365-DEPRECATED-HTTP-ROUTES-TOMBSTONE-TABLE-001 | api · 已下线路由墓碑表 | **未封口**（**登记**） | **B-365**：**410** **/** **404** **口径** **。** **互证** [**母表 B-365**](./任务母表.md) · [**正文**](#tt-b336-b365-platform-reliability-registry-001) |
| 376 | TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001 | ops · testnet · B-275 多笔连续 nonce 真实链证据归档 | **已封口**（**2026-04-15**） | **B-275** **协记** **（** **非** **母表** **B-322** **/** **一览** **332** **`TT-B322-CI-TSC-VITEST-BUDGET-DOC-001`** **）** **：** **Anvil** **上** **2** **/** **3** **笔** **`broadcast_request_stub`** **经** **`run_testnet_b262_b266_real.sh`** **全链路** **`GO`** **；** **归档** **`evidence/testnet_real_run_validation/run_tt_b322_anvil_multi_tx2_20260415/`** **、** **`run_tt_b322_anvil_multi_tx3_20260415/`** **；** **契** **[`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md`](../evidence/testnet_real_run_validation/TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md)** **。** **互证** [**母表 B-275**](./任务母表.md) · [**正文**](#tt-b322-testnet-multi-tx-nonce-sequence-real-run-001) · **一览** **285** · **[`ops/RUNBOOK.md`](../ops/RUNBOOK.md)** **§2.55** |

### TT-B276-B305-LIVE-OPS-ENHANCEMENT-PACK-REGISTRY-001

- **阶段**：上线运行 / 运维与安全增强（承 **B-262～B-275**，与已封口 UI·状态机正交）。
- **状态**：**未封口**（**2026-04-14** 母表 + 一览 **登记批**；实现与验收在各单卡 TT 收口时补齐）。
- **真值**：**母表** [**B-276～B-305**](./任务母表.md) **一行一卡**；**一览** **286～315** **与** **B** **一一对应**。
- **硬边界**：**不** **改写** **B-262～B-266** **/** **B-275** **已落地** **默认** **执行** **语义**；**增量** **以** **可选** **门禁**、**独立** **CLI**、**Runbook**、**附属** **JSON** **披露** **等** **方式** **落地**。
- **五类（各 6 张）**：**①** 多 tx / nonce / 顺序（**B-276～B-281**）**②** 失败恢复 / 幂等 / 重试（**B-282～B-287**）**③** 真链 / 最终性 / gas（**B-288～B-293**）**④** 运维自动化 / 证据（**B-294～B-299**）**⑤** 安全 / 风险（**B-300～B-305**）。
- **防糊 · nonce 邻域**：**B-278**（**mempool pending** **深度** **/** **空洞** **/** **超阈** **阻断**）**与** **B-281**（**多** **工具** **共用** **热** **钱包** **nonce floor** **漂移**）**题** **面** **不同** **；** **若** **合并** **实现** **须** **先** **改** **母表** **互指** **划界** **。**
- **防糊 · evidence 分工**：**本** **批** **B-295**（**`OUT_DIR`** **tar+sha256** **manifest**）**与** **B-298**（**`evidence/…/INDEX`** **保留** **期** **/** **清理**）**；** **07** **对齐** **批** **B-308**（**`GO_YYYYMMDD`** **命名** **↔** **15** **附录〇** **证据** **目录**）**——** **三** **卡** **分** **面** **（** **产物** **打包** **/** **仓内** **索引** **生命周期** **/** **发版** **证据** **目录** **口径** **）** **，** **勿** **混** **为** **单** **张** **通用** **「** **证据** **包** **」** **TT** **。**

### TT-B306-B335-07-ALIGNED-BACKLOG-REGISTRY-001

- **阶段**：**07**（`spec/07-开发流程与顺序.md`）**读前摘要** **+** **§二** **预检** **/** **联动** **+** **§四** **发版** **+** **§六 6.3A～C** **与** **Wave** **证据** **口径** **对齐** **的** **工程** **文档** **/** **门禁** **说明** **/** **SSOT** **一句** **表** **（** **非** **RegionVault** **广播** **执行** **链** **增强** **）** **。**
- **状态**：**未封口**（**2026-04-14** **登记批**；**与** **[§TT-B276-B305](#tt-b276-b305-live-ops-enhancement-pack-registry-001)** **正交** **、** **编号** **不** **重叠** **；** **单** **卡** **一览** **316** **/** **B-306** **、** **317** **/** **B-307** **已于** **2026-04-14** **文档** **封口** **见** **一览** **表** **状态** **列** **）** **。**
- **真值**：**母表** [**B-306～B-335**](./任务母表.md)；**一览** **316～345** **（** **316·B-306** **、** **317·B-307** **已** **封口** **见** **一览** **行** **）** **。**
- **登记批内单卡封口**：**B-306** **/** **一览** **316** **→** **[`scripts-ops-preflight-matrix.md`](./scripts-ops-preflight-matrix.md)** **（** **`TT-B306-07-PR-PREFLIGHT-SCRIPT-MATRIX-INDEX-001`** **·** **2026-04-14** **）** **；** **B-307** **/** **一览** **317** **→** **[Runbook §12.7.1](../ops/RUNBOOK.md#1271-governance-doc-linkage-failure-triage)** **（** **`TT-B307-GOVERNANCE-DOC-LINKAGE-FAILURE-RUNBOOK-001`** **·** **2026-04-14** **）** **。**
- **硬边界**：**默认** **以** **文档** **/** **清单** **/** **Runbook** **为主** **；** **若** **触** **04** **/** **合约** **/** **迁移** **须** **另** **开** **实现** **轮** **并** **遵守** **母表** **→** **TT** **→** **代码** **顺序** **。**
- **互指**：**B-308** **（** **证据** **目录** **↔** **15** **附录〇** **）** **与** **广播** **批** **B-295/B-298** **分工** **见** **上** **[§TT-B276-B305](#tt-b276-b305-live-ops-enhancement-pack-registry-001)** **「** **防糊** **·** **evidence** **分工** **」** **。**
- **主题簇（示意）**：**07** **/** **CI** **脚本** **索引**（**B-306～B-310**）**；** **87** **/** **88** **/** **70** **/** **53** **产品** **SSOT**（**B-311～B-315**）**；** **14** **/** **83** **/** **84** **/** **FeeRouter** **叙事**（**B-316～B-318**）**；** **前端** **/** **env** **/** **i18n** **/** **CI** **预算**（**B-319～B-322**）**；** **API features** **/** **DB** **/** **evidence** **/** **workflow**（**B-323～B-326**）**；** **本地** **端口** **/** **90** **/** **100** **/** **55** **分界**（**B-327～B-330**）**；** **audit** **/** **08** **/** **27** **/** **观测** **壳** **/** **排程** **背板**（**B-331～B-335**）**。**

### TT-B336-B365-PLATFORM-RELIABILITY-REGISTRY-001

- **阶段**：**平台** **可靠性** **/** **安全** **/** **可观测** **/** **合规** **/** **发版** **工程** **治理** **（** **API** **/** **前端** **/** **CI** **/** **Runbook** **）** **，** **与** **[§TT-B276-B305](#tt-b276-b305-live-ops-enhancement-pack-registry-001)** **（** **链上** **广播** **运维** **）** **、** **[§TT-B306-B335](#tt-b306-b335-07-aligned-backlog-registry-001)** **（** **07** **文档** **对齐** **）** **正交** **。**
- **状态**：**未封口**（**2026-04-14** **登记批** **三** **；** **单** **卡** **一览** **361** **/** **B-351** **已于** **2026-04-14** **文档** **封口** **见** **一览** **表** **状态** **列** **）** **。**
- **真值**：**母表** [**B-336～B-365**](./任务母表.md)；**一览** **346～375** **（** **361·B-351** **已** **封口** **见** **一览** **行** **）** **。** **附录**：**一览** **376** **`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`** **为** **B-275** **协记** **，** **不** **计入** **本** **B-336～B-365** **编号** **块** **（** **勿** **与** **一览** **332** **/** **母表** **B-322** **CI** **预算** **TT** **混** **）** **。**
- **登记批内单卡封口**：**B-351** **/** **一览** **361** **→** **[`docs/adr/README.md`](./adr/README.md)** **+** **[`docs/CODEOWNERS-map.md`](./CODEOWNERS-map.md)** **+** **[`.github/CODEOWNERS`](../.github/CODEOWNERS)** **（** **`TT-B351-ADR-TEMPLATE-AND-CODEOWNERS-MAP-001`** **·** **2026-04-14** **）** **。**
- **硬边界**：**默认** **文档** **/** **清单** **/** **Runbook** **；** **触** **生产** **行为** **变更** **须** **单** **卡** **封口** **并** **按** **母表** **→** **TT** **→** **代码** **。**
- **互指**：**B-347**（**五** **主** **路由** **断点** **/** **touch** **target**）**与** **07** **对齐** **批** **B-312**（**壳** **层** **Loading/Empty**）**分** **切面** **审计** **；** **勿** **合并** **为** **单** **张** **「** **路由** **体验** **」** **TT** **除非** **母表** **先** **划界** **。**
- **主题簇（示意）**：**API** **契约** **/** **幂等** **/** **429** **（** **B-336** **～** **B-337** **、** **B-354** **、** **B-357** **～** **B-358** **、** **B-365** **）** **；** **安全** **头** **/** **CORS** **/** **secret** **（** **B-338** **～** **B-339** **、** **B-342** **、** **B-355** **）** **；** **可观测** **（** **B-340** **～** **B-341** **）** **；** **SRE** **/** **DR** **（** **B-343** **、** **B-352** **、** **B-362** **～** **B-363** **）** **；** **CI** **/** **仓库** **（** **B-344** **～** **B-345** **、** **B-356** **、** **B-364** **）** **；** **前端** **体验** **（** **B-346** **～** **B-349** **）** **；** **类型** **/** **ADR** **（** **B-350** **～** **B-351** **）** **；** **数据** **/** **合规** **（** **B-353** **、** **B-361** **）** **；** **部署** **（** **B-359** **）** **；** **flags** **（** **B-360** **）** **。**

**85 `/traveltrust` · 一览 206～211、220（B-195～B-200、B-203 Hero）**（**205·B-194** **至** **211·B-200**、**220·B-203** **均已封口** · **2026-04-14**）：**主线** **收尾** **以** **母表** **Backlog** **与** **GO_85** **§3** **为准**。**A/B/C**、**真值↔口述**、**推荐序（历史）**、**「TT 通用封口标准」DoD**、**「85 封口验证清单」按序实跑（1～8）**、**B-191 Partial→Implemented 充要**、**04 何时才改**、**Close-out → Release Ready**、**关键卡提醒** → **[任务母表.md · 85「/traveltrust」Backlog](./任务母表.md)**（**`### 85「/traveltrust」Backlog`** 起）。

### TT-GOVERNANCE-POOL-CHAIN-ALIGNMENT-HINT-TRIPLE-001

- **阶段**：API / 治理 **`GET /api/v1/governance/pool`**
- **状态**：已封口
- **本轮仅改**：`crates/api/src/routes/governance.rs`（**`#[cfg(test)]`**）
- **任务**：三 **`data_source`** 枝下 **`chain_alignment_hint`** 三键一致性（**`is_chain_ssot` / `data_source` / `chain_alignment_status`**）。
- **验收**：**`cargo test -p traveltrust-api`**：**`governance_pool_placeholder_branch_chain_alignment_hint_consistency`** 恒跑；**`governance_pool_database_branches_chain_alignment_hint_consistency_when_database_url_set`** 在 **`DATABASE_URL`** 可用且已迁移时覆盖 **`database`** 与 **`database_empty`**。
- **禁止**：改 handler / 生产装配逻辑（本卡仅补测）。

---

### 未封口一览项 · 去重（仅扫状态非「已封口」）

#### 当前阶段 · 执行面 vs 延后（清点 · 2026-04-14）

> **状态列** 仍为 **真值**；本节 **仅** 为 **背板排程**，**不** 改写各 TT **已封口/未封口** 语义。

| 归类 | 一览序号 | 备注 |
|------|----------|------|
| **建议挂在当期产品背板** | **199**（**已封口** · **2026-04-14**） | **B-187** **登记母卡** **已归档**；**85 `/traveltrust`** **B-195～B-200** **均已封口**（**一览 206～211**）；**若** **再起** **多源缺口登记母卡** **须** **新开** **TT** **勿** **复用** **本卡号** |
| **台账母卡 · 历史** | **199** | **TT-B187** **已于** **2026-04-14** **Pass-0** **完整扫档后** **封口**；**当期** **缺口包** **按** **04 零、** **单卡** **B-+TT** **登记** |
| **整包延后 · Phase Close 附录 B（余量）** | — | **B-182～B-186** **均已封口**（**一览 212～216**；**216·B-186** **2026-04-14**） |
| **只读 · 不计入交付承诺** | **6** | **TT-UI-CONSISTENCY-POLISH-AUDIT-001** **（** **序号 6** **）** **；** **序号 3** **已于 2026-04-14** **封口** **（** **B-021** **·** **高优** **B-269～B-272** **）** **不** **再** **计入** **本条** |
| **非阻塞进度锚** | **219** | **SOLO** **路线图** **不** 替代单卡 |
| **上线运维增强（登记批）** | **286～315** | **B-276～B-305** **未封口**；**硬** **边界** **与** **五类** **划分** **见** **[§TT-B276-B305-LIVE-OPS-ENHANCEMENT-PACK-REGISTRY-001](#tt-b276-b305-live-ops-enhancement-pack-registry-001)** |
| **07 对齐工程欠账（登记批 · 二）** | **316～345** | **一览** **316** **/** **B-306** **已于** **2026-04-14** **文档** **封口** **（** **矩阵** **[`scripts-ops-preflight-matrix.md`](./scripts-ops-preflight-matrix.md)** **）** **；** **一览** **317** **/** **B-307** **已于** **2026-04-14** **文档** **封口** **（** **[Runbook §12.7.1](../ops/RUNBOOK.md#1271-governance-doc-linkage-failure-triage)** **）** **；** **318～345** **/** **B-308～B-335** **未** **封口** **。** **与** **B-276～B-305** **广播** **包** **正交** **，** **互证** **[§TT-B306-B335-07-ALIGNED-BACKLOG-REGISTRY-001](#tt-b306-b335-07-aligned-backlog-registry-001)** |
| **平台可靠性 / 安全 / 可观测（登记批 · 三）** | **346～375** | **一览** **361** **/** **B-351** **已于** **2026-04-14** **文档** **封口**（**[`docs/adr/`](./adr/README.md)** **+** **[`CODEOWNERS-map.md`](./CODEOWNERS-map.md)** **+** **[`.github/CODEOWNERS`](../.github/CODEOWNERS)** **注释** **占位** **）** **；** **346～360** **/** **B-336～B-350** **与** **362～375** **/** **B-352～B-365** **未** **封口** **。** **互证** **[§TT-B336-B365-PLATFORM-RELIABILITY-REGISTRY-001](#tt-b336-b365-platform-reliability-registry-001)** |
| **testnet 多笔链上证据（B-275 协记 · 附录行）** | **376** | **一览** **376** **`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`** **已于** **2026-04-15** **封口**（**Anvil** **2** **/** **3** **笔** **连续** **nonce** **`broadcast_request_stub`****+** **`run_testnet_b262_b266_real.sh`** **归档** **；** **与** **一览** **332** **/** **母表** **B-322** **CI** **预算** **TT** **勿** **混** **）** **。** **互证** **[§TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001](#tt-b322-testnet-multi-tx-nonce-sequence-real-run-001)** · **[`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md`](../evidence/testnet_real_run_validation/TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md)** · **一览** **285** |

**范围**：上表 **序号 1～376** 中，**状态**列 **不含** **`已封口`** 的条目 **含** **6**、**261**（**B-249** **执行链** **入口** **母卡** **·** **未封口**）、**286～315**（**B-276～B-305** **上线** **运维** **增强** **·** **未封口** **，** **互证** **[§TT-B276-B305](#tt-b276-b305-live-ops-enhancement-pack-registry-001)**）、**318～345**（**B-308～B-335** **07** **对齐** **登记** **批** **·** **未封口** **，** **互证** **[§TT-B306-B335](#tt-b306-b335-07-aligned-backlog-registry-001)**）、**346～360**（**B-336～B-350** **·** **平台** **可靠性** **登记** **批** **·** **未封口** **，** **互证** **[§TT-B336-B365](#tt-b336-b365-platform-reliability-registry-001)**）**、** **362～375**（**B-352～B-365** **·** **未封口** **，** **互证** **[§TT-B336-B365](#tt-b336-b365-platform-reliability-registry-001)**）。** **另：一览 199**/**TT-B187** **母卡** **已于 2026-04-14** **封口**（**Pass-0** **完整**）— **不** **再** **计入** **本条** 「未封口」 **枚举**。** **另：一览 376**/**`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`** **已于 2026-04-15** **封口**（**B-275** **协记** **·** **多** **笔** **Anvil** **证据** **）** — **不** **再** **计入** **本条** 「未封口」 **枚举**。** **另：一览 316**/**B-306** **已于 2026-04-14** **封口**（**[`docs/scripts-ops-preflight-matrix.md`](./scripts-ops-preflight-matrix.md)** **+** **07** **/** **CONTRIBUTING** **/** **`scripts/README`**** **互** **指** **；** **`scripts/ops`**** **无** **逻辑** **diff** **）** — **不** **再** **计入** **本条** 「未封口」 **枚举**。** **另：一览 317**/**B-307** **已于 2026-04-14** **封口**（**[Runbook §12.7.1](../ops/RUNBOOK.md#1271-governance-doc-linkage-failure-triage)** **+** **07** **§二 2.4** **CI** **基线** **互** **指** **）** — **不** **再** **计入** **本条** 「未封口」 **枚举**。** **另：一览 361**/**B-351** **已于 2026-04-14** **封口**（**[`docs/adr/`](./adr/README.md)** **+** **[`CODEOWNERS-map.md`](./CODEOWNERS-map.md)** **+** **`.github/CODEOWNERS`**** **占位** **）** — **不** **再** **计入** **本条** 「未封口」 **枚举**。**已封口** **不列入** **含**：**一览 376** **·** **`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`** **已于 2026-04-15** **封口** **不列入**（**B-275** **协记** **·** **多** **笔** **Anvil** **证据** **归档** **）** **；** **一览 316** **·** **B-306** **已于 2026-04-14** **封口** **不列入**（**[`scripts-ops-preflight-matrix.md`](./scripts-ops-preflight-matrix.md)** **文档** **互** **指** **轮** **）** **；** **一览 317** **·** **B-307** **已于 2026-04-14** **封口** **不列入**（**[Runbook §12.7.1](../ops/RUNBOOK.md#1271-governance-doc-linkage-failure-triage)** **治理** **联动** **排障** **Runbook** **）** **；** **一览 361** **·** **B-351** **已于 2026-04-14** **封口** **不列入**（**ADR** **+** **CODEOWNERS** **映射** **文档** **轮** **）** **；** **一览 200～201** **·** **B-189/B-190** **已封口** **不列入**；**一览 202·B-191**、**203·B-192**、**204·B-193** **文档轮** **已封口** **不列入**；**子 B-189～B-193** **见母表**；**一览 205** **·** **B-194** **已封口** **不列入**；**一览 206** **·** **B-195** **已于 2026-04-14** **封口** **不列入**；**一览 207** **·** **B-196** **已于 2026-04-14** **封口** **不列入**；**一览 208** **·** **B-197** **已于 2026-04-14** **封口** **不列入**；**一览 209** **·** **B-198** **已于 2026-04-14** **封口** **不列入**；**一览 210** **·** **B-199** **已封口** **不列入**；**一览 211** **·** **B-200** **已于 2026-04-14** **封口** **不列入**；**一览 220** **·** **B-203** **已于 2026-04-14** **封口** **不列入**；**一览 221** **·** **B-204** **已封口** **不列入**；**一览 222** **·** **B-205** **已于 2026-04-14** **封口** **不列入**；**一览 223** **·** **B-206** **已于 2026-04-14** **封口** **不列入**；**一览 224** **·** **B-207** **已于 2026-04-14** **封口** **不列入**；**一览 225** **·** **B-208** **已于 2026-04-14** **封口** **不列入**；**一览 226** **·** **B-209** **已于 2026-04-14** **封口** **不列入**；**一览 227** **·** **B-210** **已于 2026-04-14** **封口** **不列入**；**一览 228** **·** **B-211** **已于 2026-04-14** **封口** **不列入**；**一览 229** **·** **B-212** **已于 2026-04-14** **封口** **不列入**；**一览 230** **·** **B-213** **已于 2026-04-14** **封口** **不列入**；**一览 231** **·** **B-214** **已于 2026-04-14** **封口** **不列入**；**一览 232** **·** **B-215** **已于 2026-04-14** **封口** **不列入**（**110** **全集证明** **文档轮**）；**一览 233** **·** **B-216** **已于 2026-04-14** **封口** **不列入**（**110** **全集证明** **JSON+gate**）；**一览 234** **·** **B-217** **已于 2026-04-14** **封口** **不列入**（**110** **`indexer-tick`** **JSON-RPC pacing**）；**一览 235** **·** **B-218** **已于 2026-04-14** **封口** **不列入**（**FeeRouter** **`fee_router_routed_events`** **admin/internal** **export**）；**一览 236** **·** **B-219** **已于 2026-04-14** **封口** **不列入**（**110** **evidence-bundle-canonical** **B-210+B-216+B-213**）；**一览 237** **·** **B-220** **已于 2026-04-14** **封口** **不列入**（**`checks_total=125`** **文档同锚** **承** **B-219**）；**一览 238** **·** **B-221** **已于 2026-04-14** **封口** **不列入**（**RUNBOOK/README** **B-219** **evidence-bundle** **标准用法**）；**一览 239** **·** **B-222** **已于 2026-04-14** **封口** **不列入**（**`indexer-reconcile-gate`** **CI** **evidence-bundle** **artifact**）；**一览 240** **·** **B-223** **已于 2026-04-14** **封口** **不列入**（**RegionVault** **`country-ledger-read-model`** **admin/internal**）；**一览 241** **·** **B-224** **已于 2026-04-14** **封口** **不列入**（**`country-ledger-read-model/export`** **JSON/CSV** **+** **可选** **snapshot explain**）；**一览 242** **·** **B-225** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-readiness`**）；**一览 243** **·** **B-226** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-dryrun-payload(/export)`**）；**一览 244** **·** **B-227** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-batch-plan(/export)`**）；**一览 245** **·** **B-228** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-execution-evidence-stub(/export)`**）；**一览 246** **·** **B-229** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-execution-status-read-model(/export)`**）；**一览 247** **·** **B-230** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-execution-reconcile-report(/export)`**）；**一览 248** **·** **B-231** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-go-no-go-gate(/export)`**）；**一览 249** **·** **B-232** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-go-no-go-evidence-bundle(/export)`** **admin** **only**）；**一览 250** **·** **B-233** **已于 2026-04-14** **封口** **不列入**（**claim** **GO/NO-GO** **evidence-bundle** **CI** **+** **verify** **脚本**）；**一览 251** **·** **B-234** **已于 2026-04-14** **封口** **不列入**（**claim** **evidence-bundle** **live** **admin** **validate**）；**一览 252** **·** **B-235** **已于 2026-04-14** **封口** **不列入**（**claim** **GO/NO-GO** **live** **evidence** **archive**）；**一览 253** **·** **B-236** **已于 2026-04-14** **封口** **不列入**（**claim** **live** **evidence** **index** **README**）；**一览 254** **·** **B-237** **已于 2026-04-14** **封口** **不列入**（**claim** **live** **evidence** **CI** **archive** **smoke**）；**一览 255** **·** **B-238** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-go-no-go-release-gate(/export)`** **发布** **摘要** **admin** **only**）；**一览 256** **·** **B-239** **已于 2026-04-14** **封口** **不列入**（**release-gate** **live** **archive** **validate+finalize** **同构** **B-235**）；**一览 257** **·** **B-240** **已于 2026-04-14** **封口** **不列入**（**release-gate** **archive** **CI** **`finalize-only`** **smoke**）；**一览 258** **·** **B-241** **已于 2026-04-14** **封口** **不列入**（**release-gate** **archive** **README** **索引** **+** **manifest** **`index`** **对** **齐** **B-236**）；**一览 259** **·** **B-242** **已于 2026-04-14** **封口** **不列入**（**`snapshot-claim-go-no-go-release-gate-final-go-report(/export)`** **最终** **只读** **GO** **签署** **报告**）；**一览 260** **·** **B-248** **已于 2026-04-14** **封口** **不列入**（**14** **RegionVault claim** **只读链** **阶段** **附录** **封口** **+** **§1.1.1.1b** **锚**）；**一览 12** **·** **TT-PRODUCTION-READINESS-SUMMARY-001** **已于 2026-04-14** **封口** **不列入**（**`docs/frontend/Release-Readiness-Frontend.md`** **§0** **+** **§4.1** **与** **B-248** **只读阶** **及** **B-250～B-261** **彩排** **stub** **链** **/** **B-262** **执行** **/** **B-263** **receipt** **归档** **/** **B-264** **对账** **/** **B-265** **读模型** **+** **`forwarded`** **互证** **/** **B-266** **`14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1`** **生产** **GO** **闸** **（** **双** **attestation** **、** **`production_verdict`****≠****`GO`** **默认** **exit** **1** **）** **；** **无** **新增** **实现** **）**；**一览 262** **·** **B-250** **已于 2026-04-14** **封口** **不列入**（**dryrun→manifest** **CLI** **·** **§1.1.1.1d** **/** **RUNBOOK** **§2.55**）；**一览 263** **·** **B-251** **已于 2026-04-14** **封口** **不列入**（**signing_plan_stub** **壳** **·** **§1.1.1.1e** **/** **同** **CLI**）；**一览 264** **·** **B-252** **已于 2026-04-14** **封口** **不列入**（**signing_artifact_stub** **·** **§1.1.1.1f**）；**一览 265** **·** **B-253** **已于 2026-04-14** **封口** **不列入**（**offline** **signing** **package** **·** **§1.1.1.1g** **/** **`region_vault_claim_signing_offline_package.py`** **）；** **一览 266** **·** **B-254** **已于 2026-04-14** **封口** **不列入**（**signed** **backfill** **import** **stub** **·** **§1.1.1.1h** **/** **`region_vault_claim_signed_backfill_stub_import.py`** **）；** **一览 267** **·** **B-255** **已于 2026-04-14** **封口** **不列入**（**signed** **backfill** **reconcile** **stub** **·** **§1.1.1.1i** **/** **`region_vault_claim_signed_backfill_reconcile_stub.py`** **）；** **一览 268** **·** **B-256** **已于 2026-04-14** **封口** **不列入**（**broadcast** **request** **stub** **·** **§1.1.1.1j** **/** **`region_vault_claim_broadcast_request_stub.py`** **）；** **一览 269** **·** **B-257** **已于 2026-04-14** **封口** **不列入**（**broadcast** **dryrun** **rehearsal** **·** **§1.1.1.1k** **/** **`region_vault_claim_broadcast_dryrun_rehearsal.py`** **）；** **一览 270** **·** **B-258** **已于 2026-04-14** **封口** **不列入**（**live** **admin** **gate** **stub** **·** **§1.1.1.1l** **/** **`region_vault_claim_broadcast_live_admin_gate_stub.py`** **）；** **一览 271** **·** **B-259** **已于 2026-04-14** **封口** **不列入**（**broadcast** **evidence** **stub** **·** **§1.1.1.1m** **/** **`region_vault_claim_broadcast_evidence_stub.py`** **）；** **一览 272** **·** **B-260** **已于 2026-04-14** **封口** **不列入**（**broadcast** **result** **import** **stub** **·** **§1.1.1.1n** **/** **`region_vault_claim_broadcast_result_import_stub.py`** **）；** **一览 273** **·** **B-261** **已于 2026-04-14** **封口** **不列入**（**broadcast** **result** **reconcile** **stub** **·** **§1.1.1.1o** **/** **`region_vault_claim_broadcast_result_reconcile_stub.py`** **）；** **一览 274** **·** **B-262** **已于 2026-04-14** **封口** **不列入**（**broadcast** **execute** **·** **§1.1.1.1p** **/** **`region_vault_claim_broadcast_execute.py`** **）；** **一览 275** **·** **B-263** **已于 2026-04-14** **封口** **不列入**（**broadcast** **receipt** **archive** **·** **§1.1.1.1q** **/** **`region_vault_claim_broadcast_receipt_archive.py`** **）；** **一览 276** **·** **B-264** **已于 2026-04-14** **封口** **不列入**（**broadcast** **onchain** **reconcile** **·** **§1.1.1.1r** **/** **`region_vault_claim_broadcast_onchain_reconcile.py`** **）；****一览 277** **·** **B-265** **已于 2026-04-14** **封口** **不列入**（**B-264** **`GO`** **读模型** **+** **`forwarded`** **互证** **·** **§1.1.1.1s** **`REGION_VAULT_CLAIM_ONCHAIN_RECONCILE_IMPORT_PATH`** **）；****一览 278** **·** **B-266** **已于 2026-04-14** **封口** **不列入**（**`14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1`** **`production-go-gate`** **·** **§1.1.1.1t** **/** **`region_vault_claim_production_go_gate.py`** **、** **双** **attestation** **、** **`production_verdict`****≠****`GO`** **默认** **exit** **1** **）；****一览 279** **·** **B-269**/**TT-METAPROVIDER-LOADING-ERROR-RESYNC-001** **已于 2026-04-14** **封口** **不列入**（**`frontend/components/MetaProvider.tsx`** **二次** **`getMeta()`** **前** **`setLoading(true)`**+**`setError(null)`** **状态机** **）；****一览 280** **·** **B-270**/**TT-FRIENDS-PARTIAL-ERROR-VISIBILITY-001** **已于 2026-04-14** **封口** **不列入**（**`frontend/app/community/friends/page.tsx`** **`Promise.allSettled`** **部分** **失败** **`partialLoadHint`** **弱** **提示** **、** **不** **打断** **主** **成功** **态** **渲染** **）；****一览 281** **·** **B-271**/**TT-FINANCE-RECONCILIATION-PARTIAL-ERROR-VISIBILITY-001** **已于 2026-04-14** **封口** **不列入**（**`frontend/app/admin/finance-reconciliation/page.tsx`** **主** **摘要** **成功** **`crossErr`****/** **`driftSummaryErr`** **顶部** **弱** **提示** **`driftLegsRetryKey`** **局部** **重试** **）；****一览 282** **·** **B-272**/**TT-ADMIN-ERROR-RESET-CONVENTION-UNIFICATION-001** **已于 2026-04-14** **封口** **不列入**（**`frontend/app/admin/finance/page.tsx`** **首屏** **`adminFetchJson`** **前** **`setLoading(true)`****+****`setError(null)`** **admin** **惯例** **）；****一览 283** **·** **B-273**/**TT-GOVERNANCE-EM-DASH-CONSISTENCY-001** **已于 2026-04-14** **封口** **不列入**（**governance** **空值** **硬编码** **`"—"`** **→** **`t("ui_em_dash")`** **；** **句内** **`—`** **连接** **拼接** **语义** **不变** **；** **`cd frontend && npx tsc --noEmit`** **）** **；****一览 284** **·** **B-274**/**TT-ADMIN-ERROR-DISPLAY-UNIFICATION-001** **已于 2026-04-14** **封口** **不列入**（**8** **个** **admin** **首屏** **/** **摘要** **`adminErrorUserText`** **红框** **`role="alert"`** **→** **`ApiErrorAlert`** **；** **保留** **加载** **/** **重试** **/** **分支** **；** **不** **动** **warning** **黄框** **与** **非** **首屏** **页** **；** **`cd frontend && npx tsc --noEmit`** **）** **；****一览 285** **·** **B-275**/**TT-TESTNET-REAL-RUN-VALIDATION-001** **已于 2026-04-14** **封口** **不列入**（**testnet** **`broadcast_request_stub`****+** **`CHAIN_RPC_URL`** **B-262→B-266** **编排** **+** **`operator_run_evidence`****；** **登记** **轮** **CI** **/** **沙箱** **无** **真实** **tx** **；** **多** **笔** **协证** **见** **一览** **376** **）** **；****序号 3** **·** **B-021**/**TT-ACTION-STATE-TRANSITION-CONSISTENCY-AUDIT-001** **已于 2026-04-14** **封口** **不列入**（**审计** **高优** **1～4** **→** **B-269～B-272** **；** **5～8** **低优** **余量** **见** **该** **TT** **正文** **）；** **一览 213** **·** **B-183** **已于 2026-04-14** **封口** **不列入**；**一览 214** **·** **B-184** **已封口** **不列入**；**一览 215** **·** **B-185** **已于 2026-04-14** **封口** **不列入**；**一览 216** **·** **B-186** **已于 2026-04-14** **封口** **不列入**；**217～218**（**B-201**/**B-202** **企业审计基线**）**已封口**；**一览 143** **SEQ12** **已封口** · **文档轮**，**不列入** 本枚举；**147～168**（**B-147～B-168** **Execution Batch-1+2 母表域**）**均已封口**（**含** **B-159**～**B-162**/**B-164**/**B-165**/**B-167**）；**母表观测 Batch-3** **B-169**～**B-177** **均已封口**；**仍以本表状态列** 为 **真值**。**一览 179～184** — **母表 B-163** **程序级模块化治理 / Batch-1** **文档登记**（**TT-DOC-MOD-BATCH1-*** · **已封口**；**勿与母表 B-179 混淆**）；**185～186** — **母表 B-163** **程序级模块化治理 / Batch-2**（**TT-MOD-B2-01/B2-02** · **internal indexer/reconcile 目录对称**）（**已封口** · **文档登记**）；**187～191** — **母表 B-163** **程序级模块化治理 / Batch-3**（**TT-MOD-B3-01～B3-05** · **`community/`** + **`health_meta/` 生产分段** + **`mod.rs` 装配对齐** + **`governance/` 第一层 + 第二层分域**）（**已封口** · **文档登记**；**非** 母表 **B-169～B-177** **观测 Batch-3**）；**807 并列观测** 经 **144/B-144** **否决**；**B-145～B-146** **已封口**；**序号 6** **为** **只读** **审计** **扫档** **（** **TT-UI-CONSISTENCY-POLISH-AUDIT-001** **）** **，** **非** Target 能力登记 **；** **序号 3** **（** **B-021** **）** **已** **封口** **见** **上** **长句** **；** **一览 12** **上线** **前** **总结** **已** **封口** **见** **上** **长句**）。**序号 178**（**TT-B178-PHASE-CLOSE-DOCS-CODE-REORG-PLAN-001** · **B-178 主规划**）、**195**（**B-178 切片**）、**196**（**B-179** **`TT-B179-DOCS-CANONICAL-ENTRY-DEDUP-001`**）、**197**（**B-180** **`TT-B180-BATCH-ARCHIVE-ANCHOR-TOC-001`**）、**198**（**B-181** **`TT-B181-INTERNAL-ROUTES-OBSERVABILITY-DIR-SPLIT-001`**）**均已封口** · **不列入** 上句 「未封口」 枚举。

**结构化三批（Batch-1 + Batch-2 + Batch-3）**：合计 **30** 张 **B-147～B-157**（**11**）+ **B-158～B-162/B-164～B-168**（**10**，**无 B-163**）+ **B-169～B-177**（**9**）— 供 **约 6～8 周** 单人 + AI **最优负载** 量级的 backlog（**非**承诺工期，以 **TT 封口** 为准）。**阶段收口（额外 1 张）**：**B-178** — **非** 第 4 批功能卡，**见下** **Phase Close**。

**Execution Phase · 批次纪律（冻结）**：**勿再开 Batch-4**（与 **B-147～B-177** **同构之「第五批大卡」功能 backlog**）。**例外**：**B-178** = **Phase Close 规划门禁**（**母表 阶段 6**），**不是** Batch-4。**主轴**：**按索引顺序执行 TT → 单卡验证**；**每批末尾做小收敛**（**见下**）；**三批 30 张尽封口 → 强制执行 B-178 → 再按 B-179～ 小卡分拆落地**。**硬纪律**：**B-147～B-177 执行期内** **禁止** **顺手做** **代码/目录结构优化**（**拆分大文件**、**挪模块**、**改 `mod` 树**）— **一律延后** 至 **B-178 蓝图** 与 **B-179～**；**小收敛** **仅允许** **删重复描述**、**补索引入口**、**标记「未来要拆」**（**不拆**）。**当前最大风险** **不是卡少**，而是 **卡过多导致批次失控**（**上下文膨胀** / **文档散** / **同类能力跨 5～8 文件** / **AI 误改**）。

**按批小收敛（强制 · 非等 30 张攒完）**：**Batch-1** **封口后** — **文档入口扫一遍** + **本批 B/TT 一行摘要** 写入 **归档草稿**（**路径 TT-B178 钉**）；**Batch-2** **封口后** — **同上** + **标出与 Batch-1 重复叙事**；**Batch-3** **封口后** — **同上** + **矩阵壳**/**B-177**（**807 治理对齐**）边界 **核对**（**B-177** **TT** **已封口** · **见** **[Execution-Batch-Archive-B147-B177.md](./Execution-Batch-Archive-B147-B177.md)** **观测批清单**）。**目的**：避免 **「做完 30 个再顺便整理」** 变成 **永远来不及整理**。

**推荐周节奏（执行向 · 可叠压）**：**第 1 周** **B-147～B-151**（Batch-1 前半）；**第 2 周** **B-152～B-157**（Batch-1 后半）+ **Batch-1 小收敛**；**第 3 周** **B-158～B-162**（Batch-2 前半）；**第 4 周** **B-164～B-168**（Batch-2 后半）+ **Batch-2 小收敛**；**第 5～6 周** **Batch-3**（顺序同下）+ **Batch-3 小收敛**；**随后** **B-178**（**规划**）→ **B-179～**（**分拆**）。*周界允许依依赖前移/后挪；**禁止**无 **母表/TT** 登记扩 scope。*

**文档角色速查（Phase Close 须固化）**：

| **文档** | **只回答** |
|----------|------------|
| **母表** | **有哪些 B-xxx** / **封口态** / **下一步** |
| **本索引** | **每张 TT 做什么** / **执行顺序** / **防重复规则** |
| **04** | **公开契约** + **开发门禁** |
| **07** | **阶段位** + **本阶段剩什么**（**非** 细执行入口） |
| **110 / 53 / 88…** | **领域内 SSOT** / **Partial·Target** |
| **Runbook** | **运维动作** |

**同一主题 >3 入口** → **补总入口索引**（**B-178 规划交付**）。

**模块化门槛（建议写入 B-178 规划正文）**：**文档** — 同主题 **>3** 入口 → **总索引**。**代码** — **单文件 400～600 行** → 评估拆；**同目录同类源文件 >5** → 评估子目录；**同一能力跨 ≥4 层**（例：**routes / chain_off / db / scripts**）→ **骨架说明**。**脚本** — **同类 >4** → **子目录** + **`scripts/README`**。**优先关注面（规划标靶）**：**`chain_off/*` 聚合**、**`routes/internal.rs`**、**`routes/admin.rs`**、**`scripts/`** — **具体路径以 B-178 产出清单为准**。

**Phase Close 两步法**：**① 规划卡** **B-178 / TT-B178** — **只产出** 归类表、**须拆文件/目录**、**只需加索引不需改代码** 的项；**② 分拆** **B-179～** **3～5 张小卡** 逐张落地（**文档归档** / **internal** / **admin** / **chain_off** / **scripts**）— **禁止** **无清单** **之** **巨型** **单次提交**（**单人** **默认** **无** **PR**；**历史** **表述** **「单 PR」** **同义** **于此**）。

**可复制 · 发给 AI 的执行话术**：**B-147～B-177** **Execution 三批** **已全部封口** — **下文 Batch-1～3 推荐序** **仅** **作** **历史归档**，**勿** **误认为** **仍有** **观测批** **待跑**。**当期** **未封口选卡** **须** **先** **读** **上节 `#### 当前阶段 · 执行面 vs 延后（清点 · 2026-04-14）`**，**再** **对照** **[任务母表 · 85 Backlog](./任务母表.md)**。**纪律**：**勿再开 Batch-4**（与 **B-147～B-177** **同构之「第五批大卡」功能 backlog**）。**每次只执行一张 TT**，完成后输出：修改文件列表、自测结果、母表更新、下一张单卡。对 **B-171/B-176** 必须共用 **单一 matrix 机读壳**（**若** **未来** **再开** **同类观测** **扩展**）；**B-147**/**B-148**/**B-158** **元数据门禁（contracts + frontend/lockfile 扩面 + PR REQUIRE_REFS）** **已封口**；**B-147～B-177** **TT** **均已封口**（**含** **B-167** **`indexer.*`** **04/110 对齐**）；**B-178** **主规划** **与** **B-179～B-181** **分拆** **已封口** — **Phase Close 附录 B** **B-182～B-186** **均已封口**（**一览 212～216**；**216·B-186** **2026-04-14**）；**新开卡** 仍须 **显式** 写清与 **B-149/B-173** 等 **邻卡** **叙事分工**；**禁止** **无登记** **扩** **scope**。**历史** **小收敛** **纪律** **仍适用** **于** **同主题多文件改动** **批次**。

**Batch-1 推荐执行顺序（1→10）**：**① B-147** → **② B-148** → **③ B-151** → **④ B-153**（**`indexer_head_vs_db_latest_block_drift_observability`** · **已封口**）→ **⑤ B-154** → **⑥ B-149** → **⑦ B-155**（**金额 drift · `orders_amount_chain_vs_escrow_drift_observability`** · **已封口**）→ **⑧ B-156**（**`orders_chain_health_trend_snapshot`** · **已封口**）→ **⑨ B-157**（**一壳两子项 · RegionShareSnapshotLine 对拍 + `indexer_tick` counters** · **`TT-B157-REGION-SNAPSHOT-AND-INDEXER-TICK-COUNTERS-CLOSE-001` 已封口**）→ **⑩ B-150**。

**Batch-2 推荐执行顺序（1→10）**：**① B-158** → **② B-159** → **③ B-160** → **④ B-161** → **⑤ B-162** → **⑥ B-166** → **⑦ B-164** → **⑧ B-165** → **⑨ B-168** → **⑩ B-167**。

**Batch-3 推荐执行顺序（1→9）**：**① B-175** → **② B-171** → **③ B-169** → **④ B-170** → **⑤ B-174** → **⑥ B-176** → **⑦ B-172** → **⑧ B-173** → **⑨ B-177**（**先** 链身份/配置与 DB 足迹，**再** indexer 深层观测，**再** 治理粗对拍与镜像，**最后** **807** 治理子域收口）。

**Batch-3 · 质量分层（排障用 · 不改母表 B 号）**：**高价值 · 优先做**：**B-175**（**chainId vs config** · 防错链）、**B-169**（**reorg 哨兵**）、**B-170**（**三水线**）、**B-174**（**failed/skipped 分桶** · 排障）。**中等 · 防与邻卡糊成一张**：**B-171** / **B-176**（**矩阵类** — **须** 遵守下节 **防重复规则** **合并机读壳**）。**对拍 · 分工已母表写明**：**B-172**（**尾部计数** vs **B-149** **逐提案 state**）。**易叙事重复 · 开工前写清一句**：**B-177** — **属** **`governance.*` / pool** **807 对齐**（**TT** **已封口**）；**与** **B-173**（**Timelock delay reconcile 镜像** · **已封口**）**分工**；**非** **`GET /meta` 总树再刻一遍**；**非** **B-167**（**`indexer.*`**）；**非** **B-149** 本体。

**Batch-3 · 观测类防重复规则（实现硬约束）**：**matrix / drift / block lag** 同类 **观测** 落地时：**①** **优先** 合并为 **统一输出结构**（建议 **单一顶层壳**，如 **`multi_table_chain_observability`** — **最终键名 TT 钉死**；**B-171** 的 **DISTINCT/行数** 与 **B-176** 的 **MAX(block)** **默认同一壳内不同行/列**，**禁止** 两套平行顶层对象）。**②** **禁止** 为 **相同维度**（**同链、同表、同块高语义**）再开 **重复字段**。**③** 若与 **B-153** / **B-170** / **B-176** 已有语义重叠，**优先扩展既有键** **而非** 新建第三套 **drift** 块。

**结论（本轮 · 跳过已封口 113～123、143、144、145、146、147、148、152、153、157、159、166、167、168、169～177、178、192～198/B-188）**：**DUPLICATE = 0**（**121** 复合门闸 **≠** **117** 单门闸；**122** **chain_id** **≠** disputes PG / **114** 投影 UX 等；**123** **B-094 证据 SSOT** **≠** **107** 写入 **≠** **113** outbox）；**NEW / EXTEND 登记缺口**（**历史 Execution / Phase Close 轨**）= **0**（**143**（**SEQ12**）**已封口**（**文档轮**；**升格 orders 真值** 仍须 **另开实现 TT**）；**147**、**148**、**152**、**153**、**157**、**159**、**160**、**161**、**162**、**166**、**167**、**168**、**169**～**177**、**178**、**192～198**/**B-188**（**Observability Alerting v1+v2+v3** + **B-178 切片** + **B-179/B-180** **docs** + **B-181** **internal reorg**）**已封口**；**未封口** 主项 **不含** **B-178**/**B-179**/**B-180**/**B-181**（**主 178** + **切片 195** + **196** + **197** + **198** **均已封口**）；**一览缺 163 行** 等待补登记（**以本表状态列为准**）；**B-178 前提** **B-147～B-177** **均已封口** **已满足**）。**另**：**199**/**B-187**/**TT-B187**（**缺口登记母卡**）**已于 2026-04-14** **Pass-0** **完整扫档** **后** **母卡封口**；**Pass-0** **当时** **未** **因** **「母表空白 + 无 TT」** **同质包** **而** **须** **新开** **`B-215`**。**嗣后** **`B-215`**/**`TT-B215`**（**一览** **232** · **110 §3.1.2.1** **第七文档切片** · **「全集链上证明」钉界**）**已** **单列登记** **并** **文档轮封口**（**2026-04-14**）**与** **Pass-0** **结论** **正交**。**嗣后** **多源登记母卡** **须** **另开** **新 TT**。**B-187 Pass-1**（**归档**）：**一览 200～201** **·** **B-189/B-190** **已封口**；**母表 B-189～B-193** **已登记**（**202·B-191**、**203·B-192**、**204·B-193** **文档轮** **已封口**；**去重** 相对 **B-105/B-110/B-111/B-114/B-115/B-116/B-117/B-118** 等 **既有域**；**205·B-194** **已封口**；**206·B-195** **已封口**（**2026-04-14**）；**207·B-196**、**208·B-197**、**220·B-203** **已封口**（**2026-04-14**）；**210·B-199** **已封口**；**85 `/traveltrust` 余量** **B-200** **见** **一览 211**（**B-198** **已封口** · **一览 209** · **2026-04-14**））。

---

## 任务卡正文（标准字段）

以下为 **可执行** 定义；路径以仓库 **已落地实现** 为准，复盘时若需重开请改「本轮仅改」并显式说明。

---

### TT-ACTION-SUCCESS-STATE-PREMATURE-OR-MISLEADING-001

- **阶段**：状态机  
- **状态**：已封口  
- **本轮仅改**：（按当时卡范围；不再默认重执行）  
- **禁止再分析**：—  
- **任务**：成功提示/成功态不得早于真实完成；不得误导用户认为已生效。  
- **验收**：成功反馈仅在实际达成后出现；无「假成功」。  
- **备注**：社区 feedback 等不在此卡扩展。

---

### TT-ACTION-ERROR-STATE-NOT-CLEARED-ON-RETRY-001

- **阶段**：状态机  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/governance/page.tsx`（示例落地）  
- **禁止再分析**：—  
- **任务**：新请求/重试开始时清除上一轮 error，避免跨请求残留。  
- **验收**：重试后不应继续显示仅属于上一次请求的错误文案。  
- **备注**：同类模式可套用到其它页需单开新卡。

---

### TT-ACTION-STATE-TRANSITION-CONSISTENCY-AUDIT-001

- **阶段**：审计  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：无（**执行轮** **为** **只读** **审计** **交付** **列表** **；** **高优** **闭环** **由** **下游** **TT** **落码** **）  
- **禁止再分析**：—  
- **任务**：扫描 `frontend/app/*`、`frontend/components/*` 中 loading/error/success/empty 问题并输出列表。  
- **验收**：交付问题列表（含类型与最小修复方向），不改代码。  
- **收口登记（高优先级 1～4）**：**1** **`MetaProvider` / `getMeta`** **→** [**B-269**](./任务母表.md) **`TT-METAPROVIDER-LOADING-ERROR-RESYNC-001`** **；** **2** **`/community/friends`** **`Promise.allSettled`** **→** [**B-270**](./任务母表.md) **`TT-FRIENDS-PARTIAL-ERROR-VISIBILITY-001`** **；** **3** **`/admin/finance-reconciliation`** **（** **漂移** **两腿** **）** **→** [**B-271**](./任务母表.md) **`TT-FINANCE-RECONCILIATION-PARTIAL-ERROR-VISIBILITY-001`** **；** **4** **`/admin/finance`** **首屏** **`adminFetchJson`** **→** [**B-272**](./任务母表.md) **`TT-ADMIN-ERROR-RESET-CONVENTION-UNIFICATION-001`** **。**  
- **余量（低优先级 5～8）**：**保留** **为** **一致性** **与** **UX** **改进** **余量** **，** **无** **与本** **TT** **绑定的** **单卡** **交付** **承诺** **；** **后续** **若** **收口** **须** **另开** **B-+TT** **。**  

---

### TT-METAPROVIDER-LOADING-ERROR-RESYNC-001

- **阶段**：状态机  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：`frontend/components/MetaProvider.tsx`  
- **禁止再分析**：—  
- **任务**：**`useEffect` 依赖 `t`**（如语言切换）**再次** 调用 **`getMeta()`** 时，**在发起请求前** **`setLoading(true)`** 与 **`setError(null)`**，**保留** **`finally` → `setLoading(false)`**；消除 **首败后二次拉取仍挂旧 `error` 且 `loading` 为 false** 的缺口；**不** 扩展 GET `/meta` 业务语义。  
- **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0**  

---

### TT-FRIENDS-PARTIAL-ERROR-VISIBILITY-001

- **阶段**：UX / 状态语义  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：`frontend/app/community/friends/page.tsx`（**`frontend/locales/en.ts`****/** **`zh.ts`** **`community_friends_partialLoadHint`**）  
- **禁止再分析**：—  
- **任务**：**`Promise.allSettled`** **多腿** **请求** **在** **存在** **rejected** **且** **仍有** **fulfilled** **时**，**`partialLoadHint`** **弱** **提示**（**含** **`common_retry`**），**不** **改** **主** **成功** **态** **列表** **渲染** **；** **全** **reject** **仍** **走** **`loadError`**。  
- **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0**  

---

### TT-FINANCE-RECONCILIATION-PARTIAL-ERROR-VISIBILITY-001

- **阶段**：UX / 状态语义  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：`frontend/app/admin/finance-reconciliation/page.tsx`（**`frontend/locales/en.ts`****/** **`zh.ts`** **`admin_finance_reconciliation_partial_load_hint`**）  
- **禁止再分析**：—  
- **任务**：**`Promise.allSettled`****（****`getAdminCrossCheck`****、****`getAdminDriftSummary`****）** **结束后** **，** **若** **主** **财务** **摘要** **已** **成功** **展示** **且** **`crossErr`****/** **`driftSummaryErr`** **其一** **存在** **，** **header** **下** **弱** **提示** **（** **`role="status"`****、****`admin_finance_reconciliation_partial_load_hint`** **）** **+** **`common_retry`** **仅** **重拉** **漂移** **两腿** **（** **`driftLegsRetryKey`** **）** **；** **主** **`error`** **整页** **失败** **仍** **走** **既有** **错误** **态** **。**  
- **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0**  

---

### TT-ADMIN-ERROR-RESET-CONVENTION-UNIFICATION-001

- **阶段**：惯例 / 状态机  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：`frontend/app/admin/finance/page.tsx`  
- **禁止再分析**：—  
- **任务**：首屏 **`useEffect`** 内 **`adminFetchJson`** **发起前** **显式** **`setLoading(true)`** **与** **`setError(null)`** **，** **与** **其余** **admin** **首屏** **拉取** **页** **对齐** **，** **避免** **后续** **刷新** **/** **重试** **依赖** **变更** **时** **残留** **旧** **`error`** **。**  
- **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0**  

---

### TT-GOVERNANCE-EM-DASH-CONSISTENCY-001

- **阶段**：frontend · governance · i18n / 占位符  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：`frontend/app/governance/page.tsx`、`frontend/app/governance/distribution-accruals/page.tsx`、`frontend/app/governance/distribution-accruals/[id]/page.tsx`、`frontend/app/governance/proposals/[id]/page.tsx`  
- **禁止再分析**：—  
- **任务**：**治理** **相关** **页面** **中** **空值** **占位** **由** **硬编码** **`"—"`** **统一** **收敛** **为** **`t("ui_em_dash")`** **（** **或** **同源** **i18n** **键** **）** **；** **不** **改** **业务** **判空** **/** **分支** **语义** **。** **句内** **连接号** **拼接** **（** **如** **`${base} — ${detail}`****、****`note`****—** **说明** **文** **）** **保持** **不变** **。**  
- **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0**  
- **互证**：[**母表 B-273**](./任务母表.md) · **一览** **283**  

---

### TT-ADMIN-ERROR-DISPLAY-UNIFICATION-001

- **阶段**：admin · UI · 错误展示  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：**`frontend/app/admin/finance/page.tsx`**（**主** **`error`** **；** **`exportError`** **warning** **黄框** **除外** **）** **、** **`fee-router/page.tsx`** **、** **`region-vault/page.tsx`** **、** **`orders/page.tsx`** **、** **`guides/page.tsx`** **、** **`cross-check/page.tsx`** **、** **`drift-summary/page.tsx`** **、** **`finance-reconciliation/page.tsx`**（**主** **`error`** **+** **`driftSummaryErr`** **+** **`crossErr`** **）  
- **禁止再分析**：—  
- **任务**：**8** **个** **admin** **首屏** **/** **摘要** **页** **将** **基于** **`adminErrorUserText`** **的** **红色** **自建** **`role="alert"`** **错误** **展示** **统一** **收敛** **为** **`ApiErrorAlert`** **；** **保留** **现有** **加载** **/** **重试** **/** **分支** **逻辑** **；** **不** **处理** **warning** **黄框** **与** **非** **首屏** **页** **。**  
- **验收**：**`cd frontend && npx tsc --noEmit`** **exit** **0**  
- **互证**：[**母表 B-274**](./任务母表.md) · **一览** **284**  

---

### TT-TESTNET-REAL-RUN-VALIDATION-001

- **阶段**：ops · testnet · RegionVault claim 广播链（B-262→B-266）  
- **状态**：已封口（**2026-04-14**）  
- **本轮仅改**：**`scripts/ops/run_testnet_b262_b266_real.sh`**、**`scripts/ops/write_tt_testnet_real_run_evidence_summary.py`**、**`scripts/run-testnet-b262-b266-real.sh`**、**`evidence/testnet_real_run_validation/README.md`**（**登记** **轮** **；** **未** **在** **沙箱** **内** **送** **真实** **tx** **）  
- **禁止再分析**：—  
- **任务**：**具备** **真实** **`broadcast_request_stub.json`**（**B-256** **锚** **）** **与** **可用** **`CHAIN_RPC_URL`** **时** **，** **于** **testnet** **执行** **一轮** **小规模** **B-262→B-266** **全链路** **真实** **运行** **（** **非** **mock** **）** **；** **落盘** **`execution_report.json`****、****`receipt_archive.json`****、****`onchain_reconcile.json`****、****`production_go_report.json`****+** **B-265** **import** **提示** **JSON** **；** **聚合** **`operator_run_evidence.json`****/** **`OPERATOR_RUN_EVIDENCE.md`** **（** **链上** **`tx_hash`** **、** **`production_verdict`** **等** **）** **作为** **上线** **前** **运维** **证据** **。**  
- **验收**：**`run_testnet_b262_b266_real.sh`** **/** **`write_tt_testnet_real_run_evidence_summary.py`** **与** **README** **运维** **路径** **已** **入库** **可** **复核** **；** **真实** **tx** **留痕** **以** **运维** **在** **目标** **环境** **执行** **产出** **`OUT_DIR`** **为准** **。**  
- **互证**：[**母表 B-275**](./任务母表.md) · **一览** **285** · **[`ops/RUNBOOK.md`](../ops/RUNBOOK.md)** **§2.55**  
- **多笔真实链证据（协记）**：**一览** **376** **`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`** **（** **2026-04-15** **封口** **）** **；** **正文** [**§TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001**](#tt-b322-testnet-multi-tx-nonce-sequence-real-run-001) **。**

---

### TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001

- **阶段**：ops · testnet · B-275 多笔连续 nonce 真实链归档（**非** 母表 B-322 / 一览 332 CI 预算 TT）  
- **状态**：**已封口**（**2026-04-15**）  
- **封口依据**：**已** **落盘** **`evidence/testnet_real_run_validation/run_tt_b322_anvil_multi_tx2_20260415/`**、**`run_tt_b322_anvil_multi_tx3_20260415/`** **及** **契约** **[`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md`](../evidence/testnet_real_run_validation/TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001.md)** **；** **本** **轮** **台账** **仅** **补** **AI** **索引** **/** **母表** **互指** **。**  
- **禁止再分析**：—  
- **任务**：**在** **本地** **Anvil** **上** **以** **2** **笔** **与** **3** **笔** **连续** **nonce** **真实** **`broadcast_request_stub`** **各** **跑通** **`run_testnet_b262_b266_real.sh`** **编排** **的** **B-262→B-266** **全链路** **，** **三** **verdict** **`GO`** **，** **`operator_run_evidence`** **与** **归档** **JSON** **可** **审计** **复核** **。**  
- **验收**：**上** **述** **两** **目录** **各** **含** **完整** **`OUT_DIR`** **产物** **；** **与** **一览** **285** **登记** **语义** **兼容** **（** **登记** **轮** **CI** **/** **沙箱** **仍** **无** **tx** **）** **。**  
- **互证**：[**母表 B-275**](./任务母表.md) · **一览** **285** · **一览** **376** · **[`ops/RUNBOOK.md`](../ops/RUNBOOK.md)** **§2.55** · **[`evidence/testnet_real_run_validation/README.md`](../evidence/testnet_real_run_validation/README.md)**  

---

### TT-GOVERNANCE-PARAMS-ERROR-STUCK-AFTER-SUCCESS-001

- **阶段**：状态机  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/governance/params/page.tsx`  
- **禁止再分析**：其它 governance 页（除非新卡）  
- **任务**：请求开始 `setLoading(true)` + `setError(null)`；成功写入数据时 `setError(null)`，避免先失败后成功仍挡正文。  
- **验收**：先失败后再次成功，error 消失且可看到数据或 incomplete 提示。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-ESCROW-RATE-SUBMIT-PARTIAL-READY-STATE-001

- **阶段**：状态机  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/escrow/[id]/rate/page.tsx`  
- **禁止再分析**：EscrowDetail 目录内其它文件  
- **任务**：`confirmRating` 成功后 **await** `loadOrder(true)`；刷新失败勿用外层 catch 覆盖为「确认失败」文案。  
- **验收**：提交态持续到订单刷新完成；无「按钮已恢复但 phase 仍旧」短窗。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-UI-CONSISTENCY-POLISH-AUDIT-001

- **阶段**：审计  
- **状态**：只读 · 无代码  
- **本轮仅改**：无  
- **任务**：UI 占位符 / loading / error / empty / toast 一致性审计。  
- **验收**：3～5 条高价值项 + 建议方向，不改代码。  

---

### TT-ERROR-DISPLAY-COMPONENT-INCONSISTENCY-001

- **阶段**：UI  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/governance/page.tsx`、`frontend/app/admin/reviews/page.tsx`  
- **禁止再分析**：全站  
- **任务**：页面级/列表级错误改用 `ApiErrorAlert`，逻辑不变。  
- **验收**：治理首页与 admin reviews 错误视觉与 ApiErrorAlert 一致。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-EMPTY-PLACEHOLDER-DASH-CONSISTENCY-001

- **阶段**：UI  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/admin/indexer/reconcile/[id]/page.tsx`、`frontend/app/admin/finance/page.tsx`  
- **禁止再分析**：全站  
- **任务**：用户可见空占位用 `t("ui_em_dash")`，替换硬编码 `"—"` / `String(x ?? "—")`（示例页）。  
- **验收**：上述页无业务逻辑变化；无硬编码 em dash 占位。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-TAIL-ERROR-DISPLAY-UNIFICATION-001

- **阶段**：UI  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/governance/params/page.tsx`、`frontend/app/admin/schema/page.tsx`  
- **禁止再分析**：governance 主列表（已修）、market、escrow、admin 全量  
- **任务**：页面级 error 用 `ApiErrorAlert`；schema 面板 loading 用 `LoadingText`。  
- **验收**：params 与 governance 主站错误块同级；schema 与 reviews 错误块同级。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-TAIL-LOADING-EMPTY-TOAST-CONSISTENCY-001

- **阶段**：UI  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/page.tsx`、`frontend/app/disputes/page.tsx`、`frontend/app/community/explore/page.tsx`、`frontend/components/community/CommunityExplorePhotoMasonry.tsx`（及已含的 params/schema loading 若同批）  
- **禁止再分析**：全站 toast 抽象  
- **任务**：列表/首屏 loading 用 `LoadingText`；工具型 empty 用 body + 低强调色；explore 与 Masonry 不混用 skeleton+文案 loading。  
- **验收**：上述路径 loading/empty 层级一致；同页无两套 toast 风格新增。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-TAIL-SILENT-INTERACTION-ELIMINATION-001

- **阶段**：体验  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/useMarketPage.ts`、`frontend/app/market/page.tsx`、`frontend/components/escrow/FeeRouterWiringNotice.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：全站 toast 系统  
- **任务**：市场社区深链未命中时提示并可 dismiss；仅匹配成功时清 query。FeeRouter：`loading && !meta` 时 `LoadingText` 占位，不 `return null`。  
- **验收**：深链无效有反馈；FeeRouter 加载中可见 loading 文案。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-PRODUCTION-READINESS-SUMMARY-001

- **阶段**：文档  
- **状态**：**已封口**（**2026-04-14**）  
- **本轮仅改**：`docs/frontend/Release-Readiness-Frontend.md`（已存在则仅按需修订）  
- **任务**：前端 Release Readiness 技术说明与正式决议段落；**§4.1** **与** **B-248** **只读阶** **及** **B-250～B-261** **彩排** **stub** **/** **B-262** **RPC** **执行** **/** **B-263** **receipt** **归档** **/** **B-264** **只读** **对账** **JSON** **边界** **互证**（**不** **声称** **B-249** **真** **执行** **或** **链上** **已** **完成**）。  
- **封口批已落**：**`docs/frontend/Release-Readiness-Frontend.md`** **§0** **（** **Decision** **/** **Scope** **/** **Verification** **/** **Invariants** **/** **Risk** **）** **+** **§4.1** **（** **阶段** **总括** **表** **）**；**互证** **母表** **B-248**、**B-250～B-265** **行** **与** **14** **§1.1.1.1b** **/** **§1.1.1.1d～1s** **/** **RUNBOOK** **§2.55**  
- **验收**：文档含决策、验证方式、不变量、风险接受；不改业务代码。  

---

### TT-AUTH-VERIFY-EMAIL-EMPTY-TOKEN-001

- **阶段**：微任务 · 状态/表单  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/verify-email/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：market、governance、escrow、admin  
- **任务**：空 token 点提交须 `setError` 明确文案；提交按钮勿因空 token 永久 disabled（否则无法点提交）。  
- **验收**：空输入点提交出现 `auth_verify_token_required` 文案。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-LOGIN-CLEAR-ERROR-ON-RETRY-001

- **阶段**：微任务 · 状态  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/login/page.tsx`  
- **禁止再分析**：verify-email、market、governance  
- **任务**：登录失败后用户再次尝试时清除旧 error（`handleSubmit` 已有则补 input onChange 清错，避免 required 拦提交时旧错残留）。  
- **验收**：第二次提交或修改输入后不应继续只显示上一轮错误。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-LOGIN-SUBMITTING-STATE-001

- **阶段**：微任务 · 状态  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/login/page.tsx`  
- **禁止再分析**：verify-email、market、governance（除非新卡）  
- **任务**：登录请求进行中时：`loading` 为真则提交按钮 `disabled`，文案为 `auth_login_submitting`；表单 `aria-busy`；邮箱/密码输入在提交中禁用，避免重复提交与中途改值。  
- **验收**：请求未结束前提交不可点、显示 submitting 文案；输入框在提交中不可编辑（与按钮一致）。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-LOGIN-API-ERROR-I18N-001

- **阶段**：微任务 · i18n / 错误映射  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/login/page.tsx`、`frontend/lib/mapAuthLoginSubmitError.ts`、`frontend/lib/mapAuthLoginSubmitError.test.ts`  
- **禁止再分析**：market、governance、escrow（除非新卡）  
- **任务**：登录 `postLogin` 失败时，将后端稳定码 `invalid_credentials`、`login_required`、`auth_db_persist_failed` 映射为登录页专用 `t(...)` 文案；其它错误走 `mapApiReadError(..., "auth_login_error_failed")`；不向用户展示裸码。  
- **验收**：上述三种码在中英文 locale 下各显示 `auth_login_error_*` 对应句子，而非错误码字符串。  
- **测试**：`cd frontend && npx tsc --noEmit`；`cd frontend && npx vitest run lib/mapAuthLoginSubmitError.test.ts`

---

### TT-AUTH-LOGIN-SAFE-RETURN-URL-001

- **阶段**：微任务 · 安全 / 导航  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/login/page.tsx`、`frontend/lib/safeInternalReturnPath.ts`、`frontend/lib/safeInternalReturnPath.test.ts`；注册页与登录共用逻辑时允许 **`frontend/app/auth/register/page.tsx`** 改为引用同一工具（去重，禁止顺手改其它路由）。  
- **禁止再分析**：market、governance、escrow（除非新卡）  
- **任务**：从查询参数读取 `returnUrl`，登录成功后 `router.push` 的目标须经 **`safeInternalReturnPath(raw, "/me")`**：仅允许站内相对路径；`//`、`://`、反斜杠等开放重定向形态回退默认 **`/me`**。  
- **验收**：`?returnUrl=/orders` 成功登录后进入 `/orders`；`?returnUrl=//evil` 或 `https://…` 等回退 `/me`（或与实现一致的单一安全默认）。  
- **测试**：`cd frontend && npx tsc --noEmit`；`cd frontend && npx vitest run lib/safeInternalReturnPath.test.ts`

---

### TT-AUTH-REGISTER-REQUIRED-EMAIL-PASSWORD-001

- **阶段**：微任务 · 表单校验 / i18n  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/register/page.tsx`、`frontend/app/auth/register/RegisterTouristForm.tsx`、`frontend/app/auth/register/RegisterGuideForm.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：login、market、governance、escrow（除非新卡）  
- **任务**：旅行者/商家/管家注册主表单使用 **`noValidate`**，在 `handleTravelerSubmit` / `handleGuideSubmit` 内优先校验：邮箱 trim 非空、密码非空、确认密码非空；失败时 `setError` 映射到 `auth_register_error_emailRequired` / `passwordRequired` / `passwordConfirmRequired`，在表单既有 `role="alert"` 区展示；提交 API 使用 trim 后邮箱。  
- **验收**：空邮箱或空密码或空确认密码点提交时，可见对应中英文句子，而非仅浏览器原生气泡或静默发请求。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-REGISTER-API-FAILURE-READABLE-001

- **阶段**：微任务 · 错误处理 / 状态一致性  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/register/page.tsx`  
- **禁止再分析**：login、market、governance、escrow（除非新卡）  
- **任务**：`postRegister` 失败（4xx/5xx/网络/`throwUnlessApiOk` 抛码）经 **`registerApiCatch`** 映射为已知码或 `mapApiReadError(..., auth_register_error_registerFailed)`，在表单 `role="alert"` 区可见；**仅当** `applyClientSessionAfterAuth(res)` 返回有效 `user_id` 后才 `router.push`。向导流须先 **`fileToBase64` 证件照**（及可选语言证明），再调注册接口，避免「已写会话却提示失败」。  
- **验收**：接口失败或无效成功包时不跳转、有文案；成功包无 `user_id` 时显示注册失败而非进入下一步；向导大图超限时在写会话前失败并提示 `file_too_large`。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-FORGOT-PASSWORD-FEEDBACK-001

- **阶段**：微任务 · 表单 / 反馈  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/forgot-password/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：register、market、governance、escrow（除非新卡）  
- **任务**：表单 **`noValidate`**；提交前校验邮箱 trim 非空（`auth_forgot_emailRequired`）、轻量格式（`auth_forgot_error_invalidEmail`）；`postForgotPassword` 失败用 **`mapApiReadError(..., auth_forgot_requestFailed)`** 展示在 `role="alert"`；仅 **`await postForgotPassword` 成功后** 置 `sent` 展示 stub/真实成功文案（`role="status"` + `aria-live="polite"`）；输入时清除上一轮 `error`。  
- **验收**：空邮箱、明显错误格式、接口错误、chain_off 成功 stub 四种路径均有可见、可区分反馈。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-VERIFY-EMAIL-FAIL-RETRY-CLEAN-001

- **阶段**：微任务 · 状态 / 重试  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/verify-email/page.tsx`  
- **禁止再分析**：register、forgot-password、market、governance、escrow（除非新卡）  
- **任务**：`postVerifyEmail` 失败时 **`setVerified(false)`** 并展示 `mapApiReadError`；**仅**在 `await` 成功路径 **`setError(null)` 后 `setVerified(true)`**；请求进行中 **`disabled={loading}`** 锁 token 输入 + 表单 **`aria-busy`**，避免在途响应与用户改 token 错位导致假成功；**`onChange` / query `token` 同步**时 **`setError(null)`** 清陈旧错误。  
- **验收**：失败后可再次提交；修正 token 后成功仅进入成功区，不出现成功文案与表单错误同屏；不会在未成功时误置 `verified`。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-AUTH-VERIFY-EMAIL-SUCCESS-ISOLATED-001

- **阶段**：微任务 · UI 结构 / a11y  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/auth/verify-email/page.tsx`  
- **禁止再分析**：register、forgot-password、market、governance、escrow（除非新卡）  
- **任务**：`verified === true` 时 **仅**返回 **`VerifyEmailSuccessView`**（标题、成功说明 `role="status"` + `aria-live="polite"`、链向登录/首页）；**不得**与 token `<input>`、提交钮、`role="alert"` 错误段同树并存。`useEffect([verified])` 在成功时 **`setError(null)`、`setLoading(false)`**，避免状态层残留错误/加载与成功态不一致。  
- **验收**：成功屏无输入框、无红色校验条；DOM/辅助技术不暴露表单错误关联。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-ESCROW-PAY-HUB-ORDER-STATE-001

- **阶段**：微任务 · escrow / pay hub  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/pay/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：托管详情主流程大改、争议流（除非新卡）  
- **任务**：`/pay` 在有效 `orderId` 且 **`getOrder` 成功**时，沿用既有 **`OrderFlowSteps` + `computePayDeadlineLines`**（与 `orderStateToStep` 同源）；当 **`orderLikeMayOnchainDeposit(order)` 为 false** 时展示 **`pay_hubNotDepositPhaseNotice`**（内嵌 `orderStateToStatusLabelKey` 文案），与订单列表/市场卡上「支付与托管」链接门控语义一致，避免非存款阶段仍像必须走 hub 付款。  
- **验收**：可存款阶段不额外挡文案；已完成/草稿无托管等阶段出现灰色说明条，且含当前状态标签。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-ESCROW-DETAIL-LOAD-ERROR-RETRY-001

- **阶段**：微任务 · escrow 主链（非 `/rate`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/useEscrowDetail.ts`、`frontend/components/escrow/EscrowDetail/index.tsx`  
- **禁止再分析**：`escrow/[id]/rate` 子页、争议单页大改（除非新卡）  
- **任务**：`useEscrowDetail` 在 **`escrowId` 变化**时先 **`setError(null)`**；**`getOrder` 成功**（首载与 **`refreshOrder`**）时 **`setError(null)`**，避免上一单错误或失败残留挡住当前单。错误视图除 **`ApiErrorAlert`** 外提供 **`common_retry`**（触发 `refreshOrder`）与 **`escrow_backToOrders`** 链。  
- **验收**：加载失败可点重试；切换另一订单 UUID 不继承旧错误文案；成功刷新后进入主控制台区。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-DISPUTE-DETAIL-LOAD-ERROR-RETRY-001

- **阶段**：微任务 · 争议（详情首屏 GET）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/disputes/[id]/DisputeDetailPageClient.tsx`  
- **禁止再分析**：`/disputes` 列表页（已有同级模式）、争议仲裁/证据子流程（除非新卡）  
- **任务**：**`getDispute`** 失败时与列表页一致：页面级 **`ApiErrorAlert`** + **`common_retry`**（`disputeLoadRetryKey` 触发重拉）；**成功**时 **`setError(null)`**。URL **无 id** 时 **`setDispute(null)`** 清 stale。仅「无争议对象」且非 API 错误时：**中性** **`dispute_notFound`** + **`dispute_backList`**，不用 danger 段落冒充加载失败。  
- **验收**：详情加载失败可重试；与 `frontend/app/disputes/page.tsx` 列表错误层级一致；成功进入正文后无残留首屏 error。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-MARKET-LIST-API-ERROR-APIERRORALERT-001

- **阶段**：微任务 · 市场列表主区（`/market`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/MarketContent.tsx`  
- **禁止再分析**：`useMarketPage.ts` 拉取逻辑、抽屉/约向导/深链（除非新卡；深链见 B-017 已封口 TT）  
- **任务**：将原 **warning 色自定义块** 改为与全站一致的 **`ApiErrorAlert`**：**单源失败** 一条 alert；**订单与向导均失败** 时先 **`market_apiError_both`** 说明，再 **两条** **`ApiErrorAlert`**。外层容器改为中性边框（`border-ink-200/70`），避免与 alert 内 danger 边框重复语义。保留 **`common_retry`**（仍按 `apiErrorOrders` / `apiErrorGuides` 调用 `loadOrders` / `loadGuides`）与 **`common_closeAlert`**（`setApiErrorDismissed`）。  
- **验收**：失败可见 **`ApiErrorAlert`** 的合规/网络 Hint（与组件一致）；重试、收起与筛选联动行为与改前一致。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-COMMUNITY-FEED-MESSAGES-PROFILE-APIERROR-DARK-001

- **阶段**：微任务 · 社区（Feed / 私信 / 用户主页）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/community/CommunityFeedFilterBar.tsx`、`frontend/components/community/CommunityFeedMain.tsx`、`frontend/components/community/CommunityInteractionSummary.tsx`、`frontend/app/community/messages/page.tsx`、`frontend/app/community/messages/[id]/page.tsx`、`frontend/app/community/user/[id]/page.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：`/community/explore`、`/community/activity` 全页、举报/反馈子域（除非新卡）  
- **任务**：在社区 **slate 深色壳** 上，将主流程已有 **`ApiErrorAlert`** 统一加 **`tone="dark"`**（Feed **`feedError`**、**`meCollectsLoadError`**；私信 **会话列表 / 线程**；用户主页 **帖子加载、删帖、可见性、关注列表、会话预拉取**）。**`CommunityInteractionSummary`** 获赞失败由裸 **`text-danger`** 段落改为 **`ApiErrorAlert` `tone="dark"`**，保留重试表单。于 **`ApiErrorAlert`** 的 **`isKnownLoadOrRequestFailure`** 增补 **`community_activity_likes_load_failed`**、**`community_user_conversations_loadFailed`**、**`community_user_followingList_loadFailed`**，并去掉重复的 **`community_user_posts_loadFailed`** 判等一行。  
- **验收**：上述路径错误主文与 Hint 在深色背景可读；网络类失败仍见短 Hint；重试按钮行为不变。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-GUIDES-LIST-DETAIL-LOAD-STAKE-APIERROR-DARK-001

- **阶段**：微任务 · 向导（`/guides`、`/guides/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/guides/page.tsx`、`frontend/app/guides/[id]/page.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：`/guide/register` 大表单、`/orders/new` 选向导（除非新卡）  
- **任务**：**列表页** 错误区 **`ApiErrorAlert`** 增加 **`tone="dark"`**（与市场氛围底一致）。**详情页**：**`getGuide`** 使用 **`cancelled`** 清理避免竞态；URL **无 id** 时 **`setGuide(null)`**、**`setError(null)`**；失败时 **`setGuide(null)`**。**API 错误** 与 **无向导** 分支分离：错误分支 **`ApiErrorAlert` `tone="dark"`** + **`common_retry`**（**`guideLoadRetryKey`**）；仅无数据时用中性 **`guideDetail_notFound`**。**质押区** 错误由裸 **`text-danger`** 改为 **`ApiErrorAlert` `tone="dark"`**。于 **`ApiErrorAlert`** 增补 **`guides_responseInvalid`** 至 **`isKnownLoadOrRequestFailure`**。  
- **验收**：列表/详情加载失败在深色背景可读且可重试；未找到不与 API 失败混用红色段落；质押失败含组件级 Hint；`/orders/new?guide_id=` 与详情 CTA 行为不变。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-ORDERS-LIST-LOAD-CANCEL-ERROR-INLINE-001

- **阶段**：微任务 · 订单列表（`/orders`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/page.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：`/orders/new`、托管详情取消流（除非新卡）  
- **任务**：**首屏** **`pageError`** 视图在 **`ApiErrorAlert`** 下增加 **`common_retry`**（调用既有 **`refreshOrders`**）。**`orderCancel`** 失败时**不得**再 **`setPageError`**（会挡掉已加载列表）；改为 **`orderActionError`**，在列表 **`header` 下方** 内联 **`ApiErrorAlert`** + **重试**（**`refreshOrders`**，loading 时按钮 **`common_retrying`**）+ **`common_closeAlert`**（清空内联态）。**`refreshOrders`** 开始时 **`setOrderActionError(null)`**；用户再次点删除前亦清内联错。**`loadMoreError`** 容器外层由 **warning** 改为 **中性** `border-ink-200/80` + `bg-bg-console/80`，与列表区视觉一致。于 **`ApiErrorAlert`** 的 **`isKnownLoadOrRequestFailure`** 增补 **`order_error_cancel_failed`**。  
- **验收**：首屏 GET 失败可重试；列表已展示时取消失败不整页跳转错误屏；加载更多失败块与主列表层级协调；取消失败文案可走网络 Hint。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-PAY-HUB-ORDER-PARSE-BOUNDARY-001

- **阶段**：微任务 · 支付 hub（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/pay/page.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：托管详情资金流、`OrderFlowSteps` 步骤语义大改（除非新卡；状态联动见 B-011 已封口 TT）  
- **任务**：**订单 ID 解析边界**：保持 **仅 UUID 通过 `UUID_RE` 时** 才 **`getOrder`**；当输入 **非空且非 UUID** 时，将原 **`sr-only`** 的 **`pay_orderIdInvalidHint`** 改为 **可见** `role="alert"` 段落，并保留 **`aria-describedby`** 关联输入框。**`orderLoadError`**（含 **`mapApiReadError`** 与 **`pay_orderSliceMissing`**）由自定义红框段落改为 **`ApiErrorAlert`**，**`common_retry`** 放入 **`form` `onSubmit`** 触发 **`orderFetchTick`**。于 **`ApiErrorAlert`** 的 **`isKnownLoadOrRequestFailure`** 增补 **`pay_orderLoadFailed`**、**`pay_orderSliceMissing`**。  
- **验收**：无效格式 ID 时 sighted 用户可见说明；有效 UUID 且加载/切片失败时与全站错误组件一致并带网络 Hint；非存款阶段 **`pay_hubNotDepositPhaseNotice`**、**`FeeRouterWiringNotice`** 行为不变。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-COMMUNITY-EXPLORE-FEED-ERROR-DARK-001

- **阶段**：微任务 · 社区探索（`/community/explore`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/community/explore/page.tsx`  
- **禁止再分析**：主 Feed、topic 页、Masonry 虚拟列表实现（除非新卡；主链深色错误见 B-018 已封口 TT）  
- **任务**：探索页 **两处** Feed 失败 UI（Masonry 区块 **`feedInfinite.isError`**、作者区块 **`exploreFeedError && posts.length === 0`**）中，将 **`ApiErrorAlert`** 统一为 **`tone="dark"`**，与 **slate 深色壳** 可读性一致；**`mapApiReadError(…, "community_error_feed")`** 与 **`feedInfinite.refetch()`** 重试逻辑不变。  
- **验收**：失败时主文与网络/合规 Hint 在深色背景可读；重试仍触发同一 query refetch。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-ESCROW-CHAIN-MISMATCH-BLOCK-SWITCH-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`，`EscrowDetail`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/EscrowChainMismatchActions.tsx`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.tsx`、`frontend/components/escrow/EscrowDetail/EscrowTxModal.tsx`、`frontend/components/escrow/EscrowDetail/CreateOnChainEscrowBlock.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：Header 全局钱包壳、其它业务页错链（除非新卡；未连接指引见 B-028）  
- **任务**：当 **`chainId ≠ expectedChainId`** 且订单已绑定托管等需链上主路径时：**保持** 存款/释放/退款/争议等入口的**硬阻断**（与既有 **`readEscrowEnabled` / 模拟禁用 / 弹层确认 `disabled`** 一致）；在**页顶横幅**、**链上操作区**、**签名确认弹层**展示 **`escrow_wrongChain` / `escrow_wrongChainDesc`** 并增加 **Wagmi `useSwitchChain`** 的**切换网络 CTA** 及 **`escrow_switchNetwork*`** 辅助文案；**工厂创建**弹层确认钮 **`chainMismatch` 防御性禁用**，**`onConfirmSign`** 早退。不得静默成功。  
- **验收**：故意错链时可见专用 i18n 与切换入口；确认签名在错链下不可提交；切换成功后行为与既有链上一致。  
- **测试**：`cd frontend && npx tsc --noEmit`

---

### TT-ESCROW-WALLET-DISCONNECTED-ACTION-NUDGE-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.tsx`、`frontend/components/escrow/EscrowDetail/CreateOnChainEscrowBlock.tsx`、`frontend/components/escrow/EscrowDetail/OrderActionsBlock.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx`、`frontend/components/escrow/EscrowDetail/CreateOnChainEscrowBlock.test.tsx`  
- **禁止再分析**：Header `WalletStatusMini` 连接器列表与主题（除非新卡）  
- **任务**：钱包 **未连接** 时，用户点击 **需钱包** 的主路径入口（**链上四操作**、**工厂创建托管 CTA**、**EIP-712 确认完成 / 争议意向签名**）不得仅依赖 **`disabled` 无反馈**：须出现 **非空 `role="alert"`** 文案 **`escrow_connectWalletUseHeader`**（明确指向 **顶栏「连接钱包」/ Wallet**）；连接成功后清除该 **tap** 态。  
- **验收**：断开钱包点击上述任一入口，可见 **`escrow_connectWalletUseHeader`**；工厂 CTA **不**在未连接时打开签名弹层。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx components/escrow/EscrowDetail/CreateOnChainEscrowBlock.test.tsx`

---

### TT-ESCROW-ALLOWANCE-INSUFFICIENT-I18N-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/useEscrowDetail.ts`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/lib/mapEscrowChainTxError.ts`、`frontend/lib/mapWalletWriteError.ts`、`frontend/lib/mapIntentError.ts`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`frontend/lib/mapEscrowChainTxError.test.ts`、`frontend/lib/mapIntentError.test.ts`、`frontend/lib/mapWalletWriteError.test.ts`  
- **禁止再分析**：质押/其它页的 allowance 文案大改版（除非新卡）  
- **任务**：**存款/授权** 路径上因 **ERC-20 allowance 不足**（及常见 viem 报错形态）导致的失败，经 **`escrowChainTxErrorUserMessage` / `mapWalletWriteError` / `mapIntentError`** 统一落到 **`escrow_allowanceHint`**；文案须 **不绑死 USDC**、并给出 **先 Approve（授权代币）再重试存款** 的下一步语义。**链上写错误聚合**使用 **`walletErrorRaw`**（含 `shortMessage`），避免仅 `error.message` 漏检。**禁止**在托管主路径向用户展示裸 revert 串作为**唯一**说明。  
- **验收**：构造或模拟 `insufficient allowance` / `ERC20InsufficientAllowance` / `transfer amount exceeds allowance` 等典型文案时，用户可见 **`escrow_allowanceHint`**（或工厂路径等价 `escrow_allowanceHint`）。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/mapEscrowChainTxError.test.ts lib/mapIntentError.test.ts lib/mapWalletWriteError.test.ts`

---

### TT-ESCROW-ONCHAIN-INTENT-FAIL-STATE-CLEANUP-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/dapp/hooks/useEscrowActions.ts`、`frontend/components/escrow/TxMachineStatus.tsx`、`frontend/components/escrow/TxMachineStatus.test.tsx`、`frontend/components/escrow/EscrowDetail/useEscrowDetail.ts`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/components/escrow/EscrowDetail/EscrowTxModal.tsx`、`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.tsx`  
- **禁止再分析**：评分子页、非 Escrow 的 wagmi 写路径（除非新卡）  
- **任务**：**单笔链上意图**（deposit/release/refund/dispute + 存款前 approve）在 **用户拒绝签名或链上失败** 后：**弹层 `TxMachineStatus`** 与 **链上操作区** 使用与 **`confirmAction` 对齐** 的 `pending/success/failed`，**禁止**其它动作的 **`isSuccess`** 串台导致误显成功；**`TxMachineStatus`** 在 **failed 与 success 同时为真** 时 **优先 failed**；无弹层时 **成功条**（`escrow_txSubmittedWaitConfirm`）须 **`success && !failed`**；提供 **`resetChainWriteError`**（wagmi **`reset`**）+ **`common_closeAlert`** 入口清除错误态以便重试。  
- **验收**：先成功存款再打开 Release 弹层并 reject：弹层 **不** 显示存款成功勾；任一路径失败时 **不** 与绿色成功条并存（除非已清除错误）；可点 **关闭提示** 清错后重试。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/TxMachineStatus.test.tsx components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx components/escrow/EscrowDetail/EscrowTxModal.test.tsx`

---

### TT-ESCROW-SNAPSHOT-HASH-MISSING-NEUTRAL-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/snapshotHashDisplay.ts`、`frontend/lib/snapshotHashDisplay.test.ts`、`frontend/components/escrow/EscrowDetail/useEscrowDetail.ts`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：合约内 snapshot 参数语义大改（除非新卡）  
- **任务**：**snapshotHash**（行程/订单合并来源）仅当 **`isHex` 且 32 字节** 且 **非全零 0x…64** 时视为可展示/可进工厂参数；否则 **`useEscrowDetail.snapshotHash` 为 `null`**。**已托管**（`hasEscrow`）且无可展示哈希时，协议控制台区展示 **`escrow_snapshotHashMissingNeutral`**；**禁止**用形似完整链上哈希的占位冒充已绑定。草稿报价卡与创建托管等统一使用规范化后的 **`data.snapshotHash`**。  
- **验收**：无有效哈希时不出现 `0x`+64 位假值；已托管仅见中性说明或（有值时）真实哈希。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/snapshotHashDisplay.test.ts`

---

### TT-PAY-ORDER-ID-URL-INPUT-SYNC-001

- **阶段**：微任务 · 支付 hub（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/payOrderIdSource.ts`、`frontend/lib/payOrderIdSource.test.ts`、`frontend/app/pay/page.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **有效 UUID 判定**：与页面既有一致，见 `PAY_ORDER_ID_UUID_RE`（`frontend/lib/payOrderIdSource.ts`）。  
  2. **拉单与跳转托管的「有效订单 ID」** `effectivePayHubOrderId(fromQuery, inputTrimmed)`：**若 `orderId` query 为合法 UUID，则以 query 为准**；**否则**以输入框 **trim** 后字符串为准（可为空或非 UUID）。  
  3. **`getOrder`**、deadline/步骤条、`/escrow/[id]` 链接与预取等凡依赖「当前订单 ID」处，**一律使用** `effectivePayHubOrderId`，不得仅读输入而忽略合法 query。  
  4. **URL ↔ 输入对齐**：`fromQuery` 变为合法 UUID 时 **`useEffect` 将输入框设为该值**；用户在输入框中输入完整合法 UUID 时 **`router.replace` 写入/更新 `?orderId=`**；用户**清空**输入且当前 URL 带 `orderId` 时 **`router.replace` 去掉该参数**。  
  5. **无效输入提示**：仅当输入非空且 **trim 后非合法 UUID** 时显示格式错误提示（**不因** query 有合法 UUID 而误标红已同步的输入）。  
- **验收（手动）**：  
  - `?orderId=<合法A>` 打开页：`getOrder(A)`；改输入为合法 B 后 URL 变为 B 且拉 B；改输入为乱码仍拉 A（query 赢）。  
  - 无 query 或 `?orderId=乱码`：仅当输入合法 UUID 时拉单与写回 URL。  
  - 清空输入：URL 去掉 `orderId`（若曾有）。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/payOrderIdSource.test.ts`  

---

### TT-PAY-LOGIN-RETURN-URL-PRESERVE-001

- **阶段**：微任务 · 支付 hub（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/payOrderIdSource.ts`、`frontend/lib/payOrderIdSource.test.ts`、`frontend/app/pay/page.tsx`  
- **禁止再分析**：登录页 `safeInternalReturnPath` 语义（除非全站改 open-redirect 策略）  
- **任务（钉死规则）**：  
  1. **`getOrder`** 在客户端抛出 **`Error("login_required")`**（含 API `unauthorized` 经 `parseResponse` 归一为 `login_required`）时，须 **`router.replace("/auth/login?returnUrl=" + encodeURIComponent(...))`**，不得丢订单上下文。  
  2. **`returnUrl`** 由 **`buildPayHubLoginReturnPath(pathname, searchParams.toString(), effectiveOrderId)`** 生成：`pathname` 缺省为 **`/pay`**；在现有 query 上 **若 `effectiveOrderId`（与 B-032 同源）为合法 UUID，则 `params.set("orderId", effectiveOrderId)`**，再序列化。目的：即使地址栏尚未完成 B-032 的 `replace`，**仅输入框已生效的 UUID** 仍会写入 `returnUrl`。  
  3. 错误区若仍展示 **`order_error_login_required`**（兜底），须提供 **`orders_goLogin`** 链，**同一 `payLoginReturnPath`**。  
- **验收（手动）**：未登录打开 **`/pay?orderId=<合法 uuid>`**（或仅输入框内为该 UUID）：触发鉴权失败后跳转登录，地址栏 `returnUrl` **解码后**仍为 **`/pay?orderId=<同一 uuid>`**；登录成功回跳后 **`getOrder` 针对同一单**。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/payOrderIdSource.test.ts`  

---

### TT-ORDERS-NEW-SUBMIT-BUSY-GUARD-001

- **阶段**：微任务 · 新建订单（`/orders/new`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/new/page.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **主提交按钮**：请求进行中 **`disabled`**，**`aria-busy={true}`**（闲时 **`false`**），文案 **`orders_creating`**（zh：「创建中…」/ en：「Creating…」——本页专用 submitting 类文案）。  
  2. **表单**：进行中 **`aria-busy`**（与 `auth/login` 一致）；**向导、金额、币种** 控件 **`disabled={loading}`**，避免提交中途改表。  
  3. **防重复 POST**：除 **`loading`** 外使用 **`submitInFlightRef`**（或等价）：在 **`setLoading(true)` 生效前** 的连点不得发起第二次 **`postOrder`**；**`finally`** 复位 ref 与 loading。  
- **验收（手动）**：DevTools 限速网络后连点「创建订单」：**仅一次** `POST`；按钮禁用且可读「创建中…」；表单控件不可编辑。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-ORDERS-NEW-CREATE-ERROR-APIERRORALERT-001

- **阶段**：微任务 · 新建订单（`/orders/new`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/new/page.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`postOrder` 失败**（校验/4xx/网络等）：用户可见错误须经 **`mapApiReadError`**（或等价）落到 **i18n 字符串**，并以 **`ApiErrorAlert`** 展示（**禁止**仅裸 `<p className="text-danger">` 无统一组件样式/Hint）。  
  2. **响应缺 `order.id`**（`orders_createResponseMissingOrderId`）同样走 **`ApiErrorAlert`**。  
  3. **成功创建并进入成功态前**：须 **`setError(null)`**，确保历史失败条目不残留在后续视图（若用户通过路由再次进入表单，亦为干净态；**每次提交开始**已有 `setError(null)` 须保留）。  
  4. **`ApiErrorAlert`** 将 **`orders_createResponseMissingOrderId`** 纳入 **`isKnownLoadOrRequestFailure`**，与 **`orders_createFailed`** 一致触发网络/重试类 **Hint**（dev 见后端提示）。  
- **验收（手动）**：故意触发创建失败 → 见 **`ApiErrorAlert`** 样式与可读文案；再次填写并成功 → 成功页**无**旧错误；DevTools 可见失败请求时 **Hint** 行为与列表页等一致。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/ApiErrorAlert.test.tsx`  

---

### TT-ORDERS-LIST-BOOK-GUIDE-INVALID-BANNER-001

- **阶段**：微任务 · 订单列表（`/orders`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/page.tsx`、`frontend/locales/en.ts`、`frontend/locales/zh.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`book_guide`**（query **trim** 后非空）存在时，须用 **`getGuide(book_guide)`** 校验；**禁止**在未知是否有效时展示原「预约成功」式绿条（避免静默把用户导向带错 `guide_id` 的创建链）。  
  2. **校验中**：**`role="status"`** 条，文案 **`orders_bookGuide_checking`**。  
  3. **`guide_not_found` / `not_found`**：**`role="alert"`** 警告条（**`border-warning` 系**），标题/正文 **`orders_bookGuide_invalidTitle`**、**`orders_bookGuide_invalidDesc`**；**主 CTA**：**`/guides`**（文案 **`orders_guides`**）、**`/market`**（**`orders_market`**）；**`href="/orders"`**（**`orders_bookGuide_clearParam`**）去掉坏参继续浏览。  
  4. **其它校验失败**（网络等）：同结构警告条，**`orders_bookGuide_verifyFailedTitle`** / **`orders_bookGuide_verifyFailedDesc`**，**相同三链**。  
  5. **仅当 `getGuide` 成功**：展示原 **`orders_bookingHint`** 绿条及「创建订单 / 行程」等链（`guide_id` 用校验通过的参数）。  
  6. 并发/竞态：参数变化时忽略过期 **`getGuide`** 结果（实现须带 **generation** 或等价）。  
- **验收（手动）**：已登录打开 **`/orders?book_guide=<不存在 id>`** 或乱 UUID → 见 **alert 风格** banner 与 **向导列表 / 自由市场 / 清除参数**；**合法向导 id** → 绿条与预填链与此前一致。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-ESCROW-DISPUTE-ENTRY-STATE-ALIGN-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.ts`、`frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.test.ts`、`frontend/components/escrow/EscrowDetail/useEscrowDetail.ts`、`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.tsx`、`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/locales/en.ts`、`frontend/locales/zh.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **链上 `openDispute` 入口**（`EscrowOnChainActions`）须与 **`OrderActionsBlock`** 链下可争议态 **同源**：订单态为 **`accepted` | `escrowed` | `funded`**（`state`/`status` 小写归一）且 **`hasEscrow`** 时 **`canOpenDisputeOnChain === true`**；否则 **`canOpenDisputeOnChain === false`**。  
  2. **不可发起**时：**主按钮 `disabled`**，**`title`** 为可读说明（优先 **争议窗口过期** `escrow_disputeWindowExpired`，否则 **`escrow_disputeBlocked_*`**）；已连接且未错链时另设 **`role="status"`** 段落展示 **`disputeOnChainUnavailableReasonKey`** 对应文案（与 `title` 同源 i18n）。  
  3. **`disputeOnChainUnavailableReasonKey`** 由 **`escrowDisputeOnChainUnavailableReasonKey(order)`** 给出：`disputed` → **`escrow_disputeBlocked_alreadyOpen`**；`created`/`draft` → **`escrow_disputeBlocked_tooEarly`**；`completed`/`released` → **`escrow_disputeBlocked_orderCompleted`**；`cancelled`/`canceled`/`refunded`/`closed` → **`escrow_disputeBlocked_terminal`**；其余非可争议态 → **`escrow_disputeBlocked_wrongState`**。  
  4. **提交表单**打开争议弹层前须 **`if (!disputeBtnDisabled)`**，避免禁用态仍 **`onSetConfirmAction("dispute")`**。  
  5. **`useEscrowDetail`** 暴露 **`canOpenDisputeOnChain`**、**`disputeOnChainUnavailableReasonKey`** 供页面传入链上区。  
- **验收（手动）**：对比至少两种态，例如 **`funded`（未过期）** → 争议钮可用且无「不可发起」status 段；**`disputed`** 或 **`completed`** → 钮禁用且可见 **`escrow_disputeBlocked_*`** 文案（键名以实际 locale 为准）。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/escrowOnChainEligibility.test.ts components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx`  

---

### TT-ESCROW-CHAIN-FINALITY-COPY-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/FinalityBadge.tsx`、`frontend/components/escrow/OnchainEventTimeline.tsx`、`frontend/components/escrow/EscrowDetail/types.ts`、`frontend/components/escrow/EscrowDetail/ChainSyncStatusPanel.tsx`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/components/escrow/EscrowDetail/normalizeChainSyncReadStatus.test.ts`、`frontend/locales/en.ts`、`frontend/locales/zh.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`normalizeChainSyncReadStatus`**（`types.ts`）：将 **`chain_sync.status`** 归一为 **`pending` | `confirmed` | `unknown`**；未知字面 → **`unknown`**。  
  2. **`FinalityBadge`**：接收 **`readModelSyncStatus`**（来自上一步）。有 **`finality_block`** 时仍用 **`escrow_finality_blockHeight`**；仅有 **`escrow_block_number`** 且读模型 **`confirmed`** → **`escrow_finality_indexerConfirmedAtBlock`**；否则（**`pending` / `unknown` / `null`**）→ **`escrow_finality_provisionalBlock`**，**禁止**用「终态块高」口吻。规则说明行：终态路径用 **`escrow_finality_confirmNote`**，非终态路径用 **`escrow_finality_confirmPendingNote`**；**`unknown`** 时额外 **`escrow_finality_readModelUnknownNote`**。  
  3. **`ChainSyncStatusPanel`**：顶部 **`role="status"`** 摘要——**`escrow_chainSync_summaryPending` / `summaryConfirmed` / `summaryUnknown`**（配色区分 pending/confirmed）；**`escrow_chainSync_syncStatus`** 行中的 **`{{s}}`** 须为 **`escrow_chainSync_syncStatus_pending` 等人读枚举**，禁止裸贴 API 英文。  
  4. **`OnchainEventTimeline`**：接收 **`readModelSyncStatusRaw`**；有事件且 **`pending`** → 列表下 **`escrow_txHistory_pendingFinalityDisclaimer`**；**`confirmed`** → **`escrow_txHistory_confirmedFinalityDisclaimer`**。  
  5. **`EscrowDetail` `index.tsx`**：向 **`FinalityBadge`**、**`OnchainEventTimeline`** 传入 **`chain_sync.status`**（经 **`normalizeChainSyncReadStatus`** 或 raw）。  
- **验收（手动）**：**`pending`** 与 **`confirmed`**（或 mock 切换 API 响应）下：**Finality 区 / 索引面板 / 事件列表脚注** 语义可区分；**pending** 不出现「已终态确认」类误导。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/normalizeChainSyncReadStatus.test.ts`（及既有 escrow 相关测试按需）  

---

### TT-ESCROW-FACTORY-CREATE-ERROR-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`，`CreateOnChainEscrowBlock`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/CreateOnChainEscrowBlock.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **签名弹层内** 链上写失败（**`submitErr` / wagmi `error`**）与 **回写 API 失败**（**`postOrderSetEscrowAddress` `syncErr`**）及 **回执解析失败**（**`escrow_factoryCreateParseFailed`**）不得以裸 `<p className="text-danger">` 为唯一呈现；须 **`ApiErrorAlert`** + **`common_retry`**（`form` `onSubmit` 防默认）。  
  2. **`ApiErrorAlert`**：**`variantDid`** 弹层用 **`tone="dark"`**，浅色控制台弹层用 **`tone="default"`**。  
  3. **重试语义**：有 **`syncErr`** 时 **`common_retry`** 再次 **`postOrderSetEscrowAddress`**（同回执解析出的地址，新 idempotency key）；否则 **`reset()`** + 清 **`submitErr`**（链上可再签）。  
  4. **`postOrderSetEscrowAddress` 失败**须在 **`catch`** 内将 **`syncedRef.current = false`**，避免 API 失败后无法再次同步（与成功路径仍防双发一致）。  
  5. **`ApiErrorAlert.isKnownLoadOrRequestFailure`** 增补 **`escrow_factoryCreateTxFailed`**、**`escrow_factoryCreateParseFailed`**、**`escrow_factoryCreateSyncFailed`**，以便 prod/dev **Hint** 与全站一致。  
  6. **`showSuccess`** 仍为 **`isSuccess && syncOk && !syncErr`**，**禁止**在 **`syncErr`** 或仅链上成功未回写时误显「已创建并保存」。  
- **验收（手动）**：故意让写交易失败 / 回写 4xx：弹层内为 **ApiErrorAlert** 样式且 **重试** 可再次尝试；回写失败后 **重试** 能再次 POST；成功前 **无** 绿色「已同步」条。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/CreateOnChainEscrowBlock.test.tsx components/ApiErrorAlert.test.tsx`  

---

### TT-ESCROW-SET-ESCROW-ADDRESS-BLOCK-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`，`SetEscrowAddressBlock`，无工厂 env 时的链下 mock 写入）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/SetEscrowAddressBlock.tsx`、`frontend/components/escrow/EscrowDetail/SetEscrowAddressBlock.test.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`postOrderSetEscrowAddress` 失败**不得以裸 **`text-danger` `<p>`** 为唯一呈现；须 **`ApiErrorAlert`** + **`common_retry`**（独立 **`form` `onSubmit`**，与主提交同源 **`submitEscrowAddress`**）。  
  2. **`ApiErrorAlert`**：**`variantDid`** 用 **`tone="dark"`**，浅色卡用 **`default`**。  
  3. **重试**：再次 **`POST`**（新 **`getIdempotencyKey()`**），**提交开始**须 **`setError(null)`**（已在 **`submitEscrowAddress`** 内）。  
  4. **成功**：**`await postOrderSetEscrowAddress`** 成功后调用父传入的 **`onSuccess()`**（**`EscrowDetail`** 已为 **`data.refreshOrder`**），保证 **`hasEscrow`** 与页内 **`order.escrow_address`** 与 **`GET order`** 对齐。  
  5. **`ApiErrorAlert.isKnownLoadOrRequestFailure`** 增补 **`escrow_writeFailed`**（与 **`mapApiReadError` 兜底键**一致），Hint 与全站一致。  
- **验收（手动）**：故意让写入失败 → **ApiErrorAlert** + **重试** 可再次提交；成功后 mock 区随 **`refreshOrder`** 消失、详情与订单字段一致。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/SetEscrowAddressBlock.test.tsx components/ApiErrorAlert.test.tsx`  

---

### TT-ESCROW-CHAT-BLOCK-POST-ERROR-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`，`ChatBlock`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/ChatBlock.tsx`、`frontend/components/escrow/EscrowDetail/ChatBlock.test.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`postOrderMessage` 失败**（4xx/网络/持久化错码经 **`mapApiReadError`**）不得以裸 **`text-danger` `<p>`** 为唯一呈现；须 **`ApiErrorAlert`**（**`variant=did`** → **`tone="dark"`**，否则 **`default`**）。  
  2. **内联操作**：**`common_retry`**（独立 **`form` `onSubmit`**，复用 **`send()`**：新 **`getIdempotencyKey()`**；**`send` 开始**须 **`setPostError(null)`**）与 **`common_closeAlert`**（**`setPostError(null)`** 仅收起提示，不发送）。  
  3. **重试/主发送**：输入非空、非 **`fetchError`**、非进行中时可用；**禁止**在仅 POST 失败时误清空输入（除非用户成功发送后 **`setInput("")`**）。  
  4. **成功路径**：仅 **`postOrderMessage` resolve** 后 **`setInput("")`** + **`fetchMessages()`**，**禁止**在 **`catch`** 中清空输入或追加假消息。  
  5. **`ApiErrorAlert.isKnownLoadOrRequestFailure`** 增补 **`escrow_chatSendFailed`**、**`escrow_chatLoadFailed`**、**`escrow_chatDbUnavailable`**（与聊天读/写兜底及 DB 错文案一致），Hint 与全站一致。  
- **验收（手动）**：断网或故意 4xx → **ApiErrorAlert**；恢复后 **重试** 或主 **发送** 可再 POST；**关闭提示** 后错误区消失且可继续编辑。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/ChatBlock.test.tsx components/ApiErrorAlert.test.tsx`  

---

### TT-ESCROW-ORDER-ACTIONS-BLOCK-ACCEPT-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`，`OrderActionsBlock`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/OrderActionsBlock.tsx`、`frontend/components/escrow/EscrowDetail/OrderActionsBlock.test.tsx`、`frontend/components/ApiErrorAlert.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`run()` 内 `orderAccept` 失败**（经 **`mapApiReadError`**）不得以裸 **`text-danger` `<p>`** 为唯一呈现；与其它操作共用错误区时须 **`ApiErrorAlert`**（**`variantDid`** → **`tone="dark"`**）+ **`common_closeAlert`**（**`setErr`/`setErrAction` 双清**）。  
  2. **接单专用重试**：仅当 **`errAction === "accept"`** 时展示 **`common_retry`**（**`form` `onSubmit`**），再次 **`orderAccept`**（**`acceptIdempotencyKeyRef` 在接单 `catch` 中置 `null`**，重试可走新 key）。  
  3. **非 `run()` 路径**（链下争议、EIP-712 意向等）**`setErr` 前须 `setErrAction(null)`**，避免误用上一笔接单的 **`common_retry`**。  
  4. **不可接单可读（非仅灰钮）**：**`canAccept`** 且 **`guideWalletMismatch`** 时：**`escrow_guideWalletRequired`** 的 **`role="alert"`** 段落带稳定 **`id`**，接单钮 **`title` + `aria-describedby`** 指向该 **`id`**。  
  5. **其它操作进行中**：**`canAccept`** 且 **`busy && loading !== "accept"`** 且 **非**钱包不匹配时：展示 **`role="status"`** 文案 **`escrow_acceptBlocked_otherActionPending`**（**`id`** 供 **`aria-describedby`**），接单钮 **`title`** 同键。  
  6. **`ApiErrorAlert.isKnownLoadOrRequestFailure`** 增补 **`order_error_accept_failed`**、**`order_error_accept_window_expired`**（与 **`mapOrderWriteError`** 接单类错一致）。  
- **验收（手动）**：接单 4xx/网络失败 → **ApiErrorAlert**；**重试** 再 **POST**；**接单时限已过** 等映射文案含 Hint；取消/确认进行中时接单钮有 **status + title**，非仅 `disabled` 样式。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/OrderActionsBlock.test.tsx components/ApiErrorAlert.test.tsx`  

---

### TT-ESCROW-ONCHAIN-RELEASE-BLOCKED-STATUS-001

- **阶段**：微任务 · 托管详情（`/escrow/[id]`，`EscrowOnChainActions`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.tsx`、`frontend/components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. 当 **`isConnected`** 且 **非 `chainMismatch`** 且 **`canReleaseOnChain === false`**（如未双确评分，由 **`useEscrowDetail.canReleaseAfterRating`** 同源）时，须在链上操作区内展示 **可见** **`role="status"`** 段落，主文为 **`escrow_releaseDisabledHint`**（与 Release 钮 **`title`** 同源 i18n）。  
  2. **禁止**仅依赖 **`disabled` + `opacity`** 表达「不可释放」而无上述可见说明（**`title` 可保留**作补充，**不得替代** status）。  
  3. **Release** 按钮在 **`!canReleaseOnChain`** 时须 **`aria-describedby`** 指向该 **`status`** 段落的稳定 **`id`**（**`useId()`**）。  
  4. 与 **B-037** 争议不可发起 **`status`** 并列时，两段 **独立**、**不互斥**。  
- **验收（手动）**：**`canReleaseOnChain` false**（如仅一方 **confirm-rating**）时，用户无需悬停即可读到 **为何不能 Release**；读屏可经 **`aria-describedby`** 关联说明。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/escrow/EscrowDetail/EscrowOnChainActions.test.tsx`  

---

### TT-ORDERS-LIST-DRAFT-CONTINUE-EDIT-CTA-001

- **阶段**：微任务 · 订单列表（`/orders`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/page.tsx`、`frontend/lib/isDraftOrderListState.ts`、`frontend/lib/isDraftOrderListState.test.ts`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **草稿判定**：列表项 **`state`**（小写归一）为 **`draft`** 或 **`open`**（等价草稿）时视为 **`isDraftOrder`**，逻辑集中在 **`isDraftOrderListState`**（单测锚定）。**`created`** 等不纳入本卡专用 CTA（仍可走整卡链 `/escrow/:id`）。  
  2. **专用 CTA**：**`isDraftOrder`** 且存在 **`id`** 时，在卡右侧操作区展示主色 **`Link`** **`orders_draftContinueEdit`** → **`/escrow/:id`**（**`encodeURIComponent`**），**`onClick`** 与整卡覆盖层同源 **`stashEscrowOrderPrefetchFromListItem`**。  
  3. **与非草稿区分**：草稿卡 **`article`** 使用 **虚线边框 + 浅 travel 底/ring**（与非草稿 **`border-ink-200 bg-white`** 并列时不混用同一壳）；状态徽章仍走既有 **`orderStateToBadgeVariant`**。  
  4. **整卡可点**：保留既有全卡 **`Link`** 进托管；**「继续编辑」**为显式主路径补充，**`z-index`** 与 **`pointer-events-auto`** 与 **行程预览 / 付款 / 删除** 一致。  
- **验收（手动）**：列表中同时有草稿与非草稿时：草稿卡有 **「继续编辑」** 且壳色与实线白卡区分；点击进入 **`/escrow/<uuid>`**。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/isDraftOrderListState.test.ts`  

---

### TT-ORDERS-DETAIL-DRAWER-GET-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 订单列表抽屉（`OrderDetailDrawer`，`/orders` 行程预览）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/OrderDetailDrawer.tsx`、`frontend/components/market/OrderDetailDrawer.test.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. 当列表项 **无内嵌 `itinerary.daily_itinerary`** 须 **`getOrder`** 补全时：**`catch`** 仍用 **`mapApiReadError`**（兜底 **`escrow_loadFailed`**），**`ApiErrorAlert`** 须在抽屉 **正文区**可见（与既有实现一致）。  
  2. **`common_retry`**：独立 **`form` `onSubmit`**，**`detailFetchRetryTick`** 自增以触发与 **`orderId` / `embeddedItineraryLen` 同源** 的 **`useEffect`** 重新拉取；**重试进行中** **`loadingDetail`** 时按钮 **`disabled` + `aria-busy`**，文案可用 **`common_retrying`**。  
  3. **禁止空白抽屉**：失败时除 **sticky 标题栏** 外，须至少可见 **错误区**（**`ApiErrorAlert` + 重试**）；**骨架屏**与 **错误区** 随 **`loadingDetail` / `detailFetchError`** 互斥展示逻辑保持不变。  
  4. **`getOrder` 成功但响应缺 `itinerary`**：仍走既有 **静默不报错** 分支，**不**强制本卡新增文案（与 04 切片一致）。  
- **验收（手动）**：DevTools 令 **`getOrder` 失败** → 抽屉内 **ApiErrorAlert**；**重试** 后成功则行程区出现或错误消失。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/market/OrderDetailDrawer.test.tsx`  

---

### TT-ORDERS-DETAIL-DRAWER-RAPID-SWITCH-NO-STALE-001

- **阶段**：微任务 · 订单列表抽屉（`OrderDetailDrawer`，`/orders`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/OrderDetailDrawer.tsx`、`frontend/components/market/OrderDetailDrawer.test.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`displayOrder`**：仅当 **`enrichedOrder?.id === order.id`** 时采用 **`enrichedOrder`**，否则用列表传入的 **`order`**，禁止上一单 enrich 与当前标题/金额/行程混显。  
  2. **GET 竞态**：以本次 effect 的 **`requestedId`** 为准；**`then` / `catch` / `finally`** 内若 **`orderRef.current?.id !== requestedId`** 则**不写** enrich、错误、`loadingDetail`（替代易被下一 effect 清掉的单比特 abort）。  
  3. **`detailFetchError`**：与 **`detailFetchErrorForId === orderId`** 同时成立才展示 **`ApiErrorAlert`**，防 A 单失败条挂在 B 单上。  
  4. **`useLayoutEffect`**：在需 **`getOrder`** 的换单首帧将 **`loadingDetail`** 置 **`true`**（无内嵌行程时）；有内嵌行程或关抽屉路径与既有逻辑一致。  
  5. **`tRef`**：**`getOrder` 的 `useEffect`** 依赖数组**不含** **`t`**；**`catch`** 内用 **`tRef.current`** 调 **`mapApiReadError`**，避免测试/Strict 下 **`t` 引用每帧变**导致 effect 死循环。  
- **验收（手动）**：`/orders` 连点两卡：仅当前单的 destination/金额/行程；慢接口下不出现「先闪上一单 enrich 再跳」。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run components/market/OrderDetailDrawer.test.tsx`  

---

### TT-ORDERS-LIST-CANCEL-SUCCESS-LOCAL-PATCH-001

- **阶段**：微任务 · 订单列表（`/orders`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/page.tsx`、`frontend/lib/ordersListAfterCancel.ts`、`frontend/lib/ordersListAfterCancel.test.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`POST …/cancel` 成功**：**不得**调用 **`refreshOrders`** 替代列表；用响应体 **`order`**（缺省则 **`cancelled`**）对 **`list` 中对应 `id`** 做 **`state`/`status` 就地补丁**（与 **`GET /orders` 仍含已取消行** 的 SSOT 一致）。  
  2. **行程预览抽屉**：若 **`previewOrder.id`** 与刚取消的 **`orderId` 相同**，同步补丁 **`status`/`state`**，避免抽屉仍显示可取消态。  
  3. **已是 `cancelled`/`canceled` 时点删除**：仍为 **本地 `removeFromList`**（清理视图），并 **关闭** 对应该单的预览抽屉。  
  4. **失败（含 `invalid_state` / 409）**：**仅** **`orderActionError` + `mapApiReadError`**（与 B-020 一致）；**禁止**因 **`invalid_state`** 从列表 **误删** 仍有效的订单行。  
- **验收（手动）**：可取消态下单成功取消后，卡片徽章变为已取消且列表不闪全页 loading；故意不可取消时见内联错误、订单仍在列表。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/ordersListAfterCancel.test.ts`  

---

### TT-ORDERS-LIST-AFTER-CREATE-EXPECT-ORDER-001

- **阶段**：微任务 · 订单创建与列表（`/orders/new` → `/orders`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/new/page.tsx`、`frontend/app/orders/page.tsx`、`frontend/lib/ordersExpectOrderParam.ts`、`frontend/lib/ordersExpectOrderParam.test.ts`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`/orders/new` 创建成功**：须有 **显式回列表** 主路径（主色按钮级 **`Link`**），`href` 为 **`/orders?expect_order=<新单 id>`**（`encodeURIComponent`），文案键 **`orders_afterCreate_goOrders`**；保留托管/付款等次要链接。  
  2. **`expect_order` 查询键名**：常量 **`ORDERS_EXPECT_ORDER_QUERY`**（`expect_order`），集中在 **`frontend/lib/ordersExpectOrderParam.ts`**（含 **`ordersListHrefAfterCreate`** 供创建页复用）。  
  3. **`/orders` 列表**：读 **`expect_order`**；首屏 **`getOrders`** 后若列表 **已含** 该 id → **`router.replace` 去掉** `expect_order`（保留其它 query 如 **`book_guide`**）；若 **不含** → **约 650ms 后** **`refreshOrders({ silent: true })`** 再拉首屏（**不** `setLoading(true)` 挡整页）；仍无时展示 **`orders_list_expectNewOrder_banner`** + **`orders_list_expectNewOrder_refresh`**（再触发 **`silent` 重拉**）。  
  4. **静默拉取失败**：走既有 **`orderActionError`**（与 B-020 一致），**勿**在无首屏错时独占 **`pageError`**。  
- **验收（手动）**：创建成功点「查看我的订单」→ 列表出现新单或短延迟后出现；极端延迟时可见说明条与刷新，而非空白无提示。  
- **测试**：`cd frontend && npx tsc --noEmit`；`npx vitest run lib/ordersExpectOrderParam.test.ts`  

---

### TT-PAY-HUB-NOT-DEPOSIT-PHASE-ESCROW-FIRST-001

- **阶段**：微任务 · 支付入口（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/pay/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **判定**：以 **`orderLikeMayOnchainDeposit(orderRow)`**（与列表/托管同源）为 **可链上入金引导** 的唯一开关；**`false`** 含 **`!escrow_address`** 或 **状态非 accepted/escrowed/funded/confirmed** 等。  
  2. **主区**：**`false`** 时在步骤列表 **上方** 展示 **高可见说明区**（**`pay_escrowPhase_*`**）：区分 **无 `escrow_address`** 与 **有地址但未入金态**；**主 CTA** **`pay_ctaEscrowPrimary`** → **`/escrow/:id`**；**「我的订单」** 降为次按钮。  
  3. **文案**：页眉 **`pay_pageSubtitle`**、步骤条旁 **`pay_flowContext`** / **`pay_flowBandAria`** 在 **`false`** 时改用 **托管优先** 键（**`pay_flowContext_escrowPhaseHub`** 等），**禁止**沿用强调 **Approve/Deposit** 的 **`pay_flowContext_fromOrder`**。  
  4. **步骤列表**：**`true`** 用既有 **`pay_step1–3`**；**`false`** 用 **`pay_escrowHub_step*`**；**加载中** 用 **`pay_stepsWhileLoading_*`**；**无 UUID** 用 **`pay_stepsNeutral_*`**（弱化入金）。  
  5. **`FeeRouterWiringNotice`**：仅在 **`mayOnchainDeposit === true`** 时渲染（避免未入金态误显费率/构建与入金强相关块）。  
- **验收（手动）**：选 **created / 无 escrow** 订单打开 `/pay?orderId=`：主区为托管说明 + 托管主按钮；不出现与 **入金** 同级的 **FeeRouter** 条；**accepted+escrow+金额** 可付态恢复既有入金步骤与 **FeeRouter**。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-PAY-HUB-GET-ORDER-FORBIDDEN-NOT-LOGIN-001

- **阶段**：微任务 · 支付入口（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/pay/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`getOrder` 失败分支顺序**：先 **`login_required`** → **`router.replace` 登录**（不变）；再 **`err.message === "forbidden"`**（对应 HTTP **403** + body **`error: forbidden`**，链下非参与方）→ **不得**当登录问题。  
  2. **`forbidden`**：设 **`payOrderForbidden`**；清 **`payDeadlineHints` / `orderResponseForEscrowPrefetch`**；**`orderLoadError`** 使用 **`pay_orderForbidden_body`**（非 **`order_error_login_required`**）。  
  3. **主区 UI**：**`role="status"`** 中性块（**`pay_orderForbidden_title` + body**），主 CTA **`pay_orderForbidden_ctaOrders`** → **`/orders`**；**无** **`common_retry`**、**无**「去登录」链。  
  4. **页眉 / 步骤条旁**：**`pay_pageSubtitle_orderForbidden`**、**`pay_flowBandAria_orderForbidden`**、**`pay_flowContext_orderForbidden`**，避免与 **`pay_flowContext_orderLoadError`** 混用。  
  5. **换单 / 非法 UUID**：`useEffect` 入口 **重置** **`payOrderForbidden`**。  
- **验收（手动）**：已登录用户打开**他人订单** UUID 的 **`/pay?orderId=`**：停留本页并见无权说明与回列表；**不**被送到登录页。未登录仍走 **`login_required`**。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-PAY-HUB-RETRY-CLEAR-ORDER-LOAD-ERROR-001

- **阶段**：微任务 · 支付入口（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/pay/page.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`common_retry` 的 `form` `onSubmit`**：在 **`setOrderFetchTick`** 之前 **同步** **`setOrderLoadError(null)`**、**`setPayOrderForbidden(false)`**，并清空 **`payDeadlineHints` / `orderResponseForEscrowPrefetch`**，避免错误区与旧订单快照与新请求叠显。  
  2. **`getOrder` 的 `useEffect`**（合法 UUID 分支）：在发起请求前同样 **清空** 上述四项（含 **`payDeadlineHints`/`orderResponseForEscrowPrefetch`**），保证 **换 `orderId` / `orderFetchTick` 重拉** 时首帧不残留上一轮列表态。  
  3. **`forbidden` 块**无重试，本卡不要求改动。  
- **验收（手动）**：故意让 `getOrder` 失败 → 点重试 → 错误区立即消失或随加载切换；成功后 **不再** 残留上一轮 **`ApiErrorAlert`**。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-PAY-FEEROUTER-NOTICE-META-FAIL-FALLBACK-001

- **阶段**：微任务 · 支付入口（`/pay`）与共用 `FeeRouterWiringNotice`  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/FeeRouterWiringNotice.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`useMeta()`** 除 **`meta` / `loading`** 外读取 **`error`**（如 **`metaLoadError`**）。  
  2. **顺序**：**`loading && !meta`** → **`LoadingText`**；**随后** 若 **`metaLoadError != null`**，**不得**再调用 **`computeFeeRouterWiringUi`** 走绿/黄分支（避免 meta 失败但 env 有地址时误显「一致」）。  
  3. **兜底块**：**`role="status"`** + **`aria-live="polite"`**；标题/正文用 **`escrow_feeRouterWiring_metaUnavailable_*`**（与 **`escrow_feeRouterWiring_unconfigured`** 区分）。  
  4. **`process.env.NODE_ENV !== "production"`** 时额外展示 **`metaLoadError`**（**`mapApiReadError(..., "meta_fetchFailed")`** 等）作 dev Hint；**生产**仅短句。  
- **验收（手动）**：断 API / 故意让 **GET /meta** 失败 → **`FeeRouterWiringNotice`** 仍有非空说明；生产构建下无技术 Hint 行。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-PAY-HUB-BACK-BFCACHE-REFETCH-ORDER-001

- **阶段**：微任务 · 支付入口（`/pay`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/pay/page.tsx`、`frontend/lib/apiClient/orders.ts`（`getOrder`）  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`window.pageshow`**：监听 **`PageTransitionEvent`**；仅当 **`event.persisted === true`**（自 BFCache 恢复）且当前 **`window.location`** 为 **`/pay`** 且 **`orderId` query** 为合法 UUID 时，**`setOrderFetchTick((n) => n + 1)`**，复用既有 **`useEffect`（`effectiveOrderId` + `orderFetchTick`）** 拉单与清快照逻辑。  
  2. **`getOrder`**：`fetch` 增加 **`cache: "no-store"`**，避免后退后重挂载时浏览器 HTTP 缓存返回陈旧订单切片。  
  3. **不重绑 `popstate` 抢首帧**：后退入 `/pay` 时 **`popstate` 可能早于 Pay 挂载**，单靠 `popstate` 不可靠；**一键对齐**仍由既有 **`common_retry`**（`orderFetchTick`）覆盖。  
- **验收（手动）**：`/pay?orderId=<uuid>` → `/escrow/<uuid>` 完成托管侧状态变化 → **浏览器后退** 回 pay：步骤条/主区语义与当前 **`GET /orders/:id`** 一致，或短暂 loading 后对齐；**非**长期卡在旧「待支付」叙事。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-PUBLISH-SUBMIT-BUSY-GUARD-001

- **阶段**：微任务 · 社区 Feed（`/community`）发帖  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/community/PublishDrawer/usePublishForm.ts`（必要时可含 `PublishDrawer/index.tsx` 与 `locales/*` 仅当缺键）  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **入口**：`CommunityFeedMain` → **`PublishDrawer`** → **`usePublishForm`** → **`handlePublishSubmit`** → **`POST /api/v1/community/posts`**（`createPost`）。  
  2. **提交中**：主提交钮 **`disabled`**、**`aria-busy={true}`**（或等价），可见文案为 **submitting 类 i18n**（**`community_publish_submitting`** / **`community_publish_submit`**）。  
  3. **防重复请求**：在 **`setSubmitting(true)` 生效前** 须以 **`useRef` 同步锁**（与 **`/orders/new` `submitInFlightRef`** 同口径）阻断同帧连点，避免重复 **`createPost`**。  
- **验收（手动）**：慢网络或节流网络下连点「发布」：**不**出现两次并发 **`POST …/community/posts`**；按钮呈提交中态。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-POST-DETAIL-DEEPLINK-NOT-FOUND-UX-001

- **阶段**：微任务 · 社区帖子详情深链（`/community?post=`，与 `/community/post/[id]` 等价入口）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/community/useCommunityFeed.ts`、`frontend/components/community/CommunityFeedMain.tsx`、`frontend/app/community/post/[id]/page.tsx`、`frontend/components/ApiErrorAlert.tsx`（Hint 判等）、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **路由**：新增 **`/community/post/[id]`** → **`redirect`** 至 **`/community?post=<id>`**（空 id → **`/community`**）。  
  2. **`useCommunityFeed`**：处理 **`?post=`** 时，若 Feed 列表未命中则 **`getPostById`**；**`status === "ok"` 且 `post` 有有效 `id`** 时打开 **`PostDetailDrawer`**（既有）。  
  3. **`post == null` / 无有效 id**：**禁止**静默空白；展示 **中性** **`community_postDeepLink_notFoundOrHidden`** + **`Link`** 至 **`/community`**、**`/community/explore`** + **`common_closeAlert`** 收起（清内部态）。  
  4. **GET 抛错 / 非预期 envelope**：**`ApiErrorAlert` `tone="dark"`** + **`mapApiReadError(..., "community_postDeepLink_loadFailed")`** + **`common_retry`**（复拉同一暂存 id）+ 同上导航链 + 收起。  
  5. **解析中**：**`community_postDeepLink_resolving`** + **`role="status"`** / **`aria-busy`**，避免误以为无响应。  
- **验收（手动）**：非法 id、后端 **`post: null`**（如不可见）、断网/5xx：**均**可见非空说明与回动态/发现；**非**整页空白或裸错误码。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-COMMENT-POST-ERROR-I18N-001

- **阶段**：微任务 · 社区帖下评论（`POST …/community/posts/:id/comments`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/community/useCommunityFeed.ts`、`frontend/app/community/me/posts/page.tsx`、`frontend/app/community/me/collects/page.tsx`、`frontend/lib/formatCommunityApiMessage.test.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **成功**：沿用既有 `id` 回写逻辑。  
  2. **JSON `status: error`**（含 HTTP **429** `response_community_abuse`）：根级 **`error` / `message`** 与 **`errors.body`** 均经 **`interpretCommunityWriteError`** → **`formatCommunityApiMessage`** → **`community_api_msg_comment_rate_limited` / `community_api_msg_comment_too_fast` / `community_api_msg_comment_duplicate`**（`zh`/`en` 已存在）。  
  3. **`fetch` 抛错等非 `comment_post_not_ok` 路径**：**禁止**将 **`commentSendErrorMessage` 置 `null`**；须 **`mapApiReadError(..., "community_comment_send_failed")`**，与 **`user/[id]`** 页口径一致。  
  4. **单测**：对三种 **`comment_*`** 错码断言 **`interpretCommunityWriteError`** 的 **`fieldMessages.body`** 与 **`topMessage`** 等于对应 **`community_api_msg_*`**（中文 locale）。  
- **验收（手动）**：触发频控 / 过快 / 重复评论及断网：**均**可见专用或通用可读文案，**非**仅控制台。  
- **测试**：`cd frontend && npx vitest run lib/formatCommunityApiMessage.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-DM-THREAD-SEND-ERROR-INLINE-RETRY-001

- **阶段**：微任务 · 社区私信线程（`/community/messages/[id]`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/community/messages/[id]/page.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`POST …/conversations/:id/messages`** 失败：**内联** **`sendIssue` / `dmBodyFieldError`**（**`interpretCommunityWriteError`** / **`mapApiReadError`**，既有）+ **`role="alert"`** / **`aria-live`**。  
  2. **清错与重试**：**`common_closeAlert`** 仅收起提示；**`common_retry`** 在条带内再次调用 **`handleSend`**（复用当前输入框文案）。  
  3. **防假成功**：**禁止**在请求未成功前 **`setInputValue("")`**；仅在 **`status === "ok"` 且拿到 `id`** 后清空输入；发送中输入框 **`disabled`**（与既有 **`sending`** 一致）。  
  4. **离线**：沿用 **`community_messages_offline`**，不清空输入。  
- **验收（手动）**：断网或 4xx/5xx：可见非空说明；恢复网络后可用 **重试** 或主 **发送** 再发；发送过程中输入区**不**被提前清空。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-GUIDE-REGISTER-SUBMIT-UPLOAD-ERROR-APIERRORALERT-001

- **阶段**：微任务 · 向导申请（`/guide/register`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/guide/register/page.tsx`、`frontend/components/ApiErrorAlert.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **失败展示**：表单级 **`error`** 使用 **`ApiErrorAlert message={error}`**（i18n 文案不变），附 **`common_closeAlert`** 仅清 **`error`**。  
  2. **成功清错**：**`postGuide` 成功后** **`setError(null)`** 再 **`setDone(true)`**；提交开始时仍 **`setError(null)`**。  
  3. **防陈旧条带**：主要字段 **`onChange`** 调用 **`clearSubmitError`**（`setError(null)`）。  
  4. **上传无 URL**：**`postGuideUploadDoc`** 返回 **`!up.url`**（含 **`idPhotoFile` / pending session 证件**）须 **`setError`** 对应 **`guideRegister_pending*UploadFailed`** 并 **`return`**（**`finally`** 仍 **`setLoading(false)`**）。  
  5. **`ApiErrorAlert`**：将 **`guideRegister_errorSubmit`**、**`guideRegister_guideDbUnavailable`**、**`guideRegister_pendingIdPhotoUploadFailed`**、**`guideRegister_pendingLangCertUploadFailed`**、**`guideRegister_pendingPassportDataIncomplete`** 纳入 **`isKnownLoadOrRequestFailure`**（与 13-1 Hint 一致）。  
- **验收（手动）**：断网/5xx 或上传失败：可见 **`ApiErrorAlert`** 与后端 Hint；**关闭提示** 或 **改字段** 后条带可消失；**成功提交** 后进入完成态且无残留 error 挡表单。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-GUIDES-DETAIL-BOOK-LOGIN-RETURNURL-001

- **阶段**：微任务 · 向导详情预订链（`/guides/[id]` → `/orders/new?guide_id=`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/orders/new/page.tsx`、`frontend/lib/ordersGuideDeepLink.ts`、`frontend/lib/ordersGuideDeepLink.test.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. 当 URL 含非空 **`guide_id`**（与详情页「预订」链一致）且 **`getGuides`** 或 **`postOrder`** 抛出 **`login_required`**（`err.message === "login_required"`）时：**`router.replace(authLoginHrefForGuideDetailReturn(guideId))`**，其中 **`returnUrl`** 为 **`/guides/${encodeURIComponent(id)}`**（**`safeInternalReturnPath`** 可接受）。  
  2. **`guide_id` 缺失或空白**时：**不**改既有行为（仍走 **`mapApiReadError`** / 默认下单页错误 UX）。  
  3. 路径拼装收口 **`ordersGuideDeepLink.ts`**（**`guideDetailHrefForOrdersNewLoginReturn`** / **`authLoginHrefForGuideDetailReturn`**），单测覆盖。  
- **验收（手动）**：未登录从 **`/guides/:id`** 点预订 → **`/orders/new?guide_id=…`** → 自动进登录页 → 登录成功回到 **同一 `/guides/:id`**。  
- **测试**：`cd frontend && npx vitest run lib/ordersGuideDeepLink.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-MARKET-ORDER-DRAWER-LOGIN-RETURNURL-QUERY-001

- **阶段**：微任务 · 市场订单详情抽屉（`OrderDetailDrawer` on `/market`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/OrderDetailDrawer.tsx`、`frontend/app/market/page.tsx`、`frontend/lib/marketLoginReturnPath.ts`、`frontend/lib/marketLoginReturnPath.test.ts`、`frontend/components/market/OrderDetailDrawer.test.ts`；**附**：`/orders` 列表预览抽屉同传 `loginReturnPath`（复用既有 `ordersLoginReturnPath`）→ `frontend/app/orders/page.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`OrderDetailDrawer`** 增加可选 **`loginReturnPath?: string`**。  
  2. **`getOrder`** 与 **`onConfirmAccept`（POST accept）** 路径：若 **`err instanceof Error && err.message === "login_required"`** 且 **`loginReturnPath?.trim()`** 非空，则 **`router.replace(\`/auth/login?returnUrl=${encodeURIComponent(trim)}\`)`**，**不**再走仅 **`ApiErrorAlert`** 的默认条带（与 pay/orders 登录链一致）。  
  3. **`/market`**：用 **`buildLoginReturnPathWithQuery(pathname, searchParams.toString(), "/market")`** 生成 **`loginReturnPath`**，保证 **view / country / city / language / service / guide_id** 等 query 随 URL 保留。  
  4. **收口**：`marketLoginReturnPath.ts` + 单测；抽屉单测覆盖 **`login_required` + replace**。  
- **验收（手动）**：未登录在 **`/market?…`** 打开订单抽屉并触发需登录的接口 → 登录成功回到 **同一 query 的市场页**，筛选不必重选。  
- **测试**：`cd frontend && npx vitest run lib/marketLoginReturnPath.test.ts components/market/OrderDetailDrawer.test.tsx`；`cd frontend && npx tsc --noEmit`  

---

### TT-MARKET-LIST-DISCOVER-GUIDES-FETCH-EPOCH-001

- **阶段**：微任务 · `/market` 列表与筛选（`useMarketPage`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/useMarketPage.ts`、`frontend/components/market/useMarketPage.discoverEpoch.test.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`loadOrders`（全量 `getDiscoverOrders`）**：每次开始时 **`++ordersListEpochRef`**；**`.then` / `.catch` / `.finally`** 仅当 **`epoch === ordersListEpochRef.current`** 时写 **`orders` / cursor / loading / error**。  
  2. **`loadMoreOrders`**：开始时 **`epochAtStart = ordersListEpochRef.current`**（**不** bump）；回调内若 **`epochAtStart !== ordersListEpochRef.current`** 则 **忽略**（新全量请求已发生）。  
  3. **`loadGuides`**：同理 **`++guidesListEpochRef`**，防语言/服务/城市等筛选竞态。  
  4. **单测**：稳定 **`t`** 引用前提下，**先 resolve 新请求、再 resolve 旧请求**，断言列表仅为新数据。  
- **验收（手动）**：快切国家/城市/语言后，网络面板中**最后**一次 **`discover/orders`** 与 UI 筛选一致；慢响应不会把列表拉回旧筛选。  
- **测试**：`cd frontend && npx vitest run components/market/useMarketPage.discoverEpoch.test.tsx`；`cd frontend && npx tsc --noEmit`  

---

### TT-MARKET-GUIDE-DRAWER-GET-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 市场向导详情抽屉（`GuideDetailDrawer`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/market/GuideDetailDrawer.tsx`、`frontend/components/market/GuideDetailDrawer.test.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. 抽屉打开且 **`guide.id`** 非空时 **`getGuide(id)`** 校验/补强详情；成功则 **`mergeGuideFromApi`** 合并列表快照与 API。  
  2. **`GET` 失败**（非 `guide_not_found`/`not_found`）：**`mapApiReadError(..., "guideDetail_loadFailed")`** + **`ApiErrorAlert`** + **`common_retry`**（**`detailFetchRetryTick`**，与 `OrderDetailDrawer` 同级）。错误条带下仍展示列表快照主区（非空白）。  
  3. **`guide_not_found` / `not_found`**：**中性** **`guideDetail_notFound`** + **`market_guideDrawer_notFoundHint`** + **关闭** + **`/market`** 链。  
  4. **无效 id**（**`!String(guide.id).trim()`**）：**`market_guideDrawer_invalidId`** + 同上操作链；**禁止**调用 **`getGuide`**。  
  5. **加载中**：**`common_loading`** + 骨架条，与主内容同屏（非空白）。  
- **验收（手动）**：断网/5xx、已删向导、空 id：均有可读块；重试可再拉；无整抽屉空白。  
- **测试**：`cd frontend && npx vitest run components/market/GuideDetailDrawer.test.tsx`；`cd frontend && npx tsc --noEmit`  

---

### TT-GOVERNANCE-FEE-VAULT-LOADMORE-APIERRORALERT-RETRY-001

- **阶段**：微任务 · 治理分页（FeeRouter / RegionVault 投影页）  
- **状态**：已封口  
- **本轮仅改**：`frontend/app/governance/fee-routes/page.tsx`、`frontend/app/governance/vault-forwards/page.tsx`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **「加载更多」**（**`fetchPage(cursor, append: true)`**）失败：**独立** **`loadMoreError`**（**勿**写入首屏 **`error`**），在 **「加载更多」区块上方** 展示 **`ApiErrorAlert message={loadMoreError}`**（**`mapApiReadError(..., "governance_requestFailed")`**，**`ApiErrorAlert`** 已含 **`governance_requestFailed`** Hint）。  
  2. **`common_retry`**：再次调用既有 **`onLoadMore()`**（复用当前 **`nextCursor`**）。  
  3. **`common_closeAlert`**：仅 **`setLoadMoreError(null)`**，**不**丢已加载表格行。  
  4. **首屏**随 **`metaReady` / `effectiveChainId`** 重拉时：**`setLoadMoreError(null)`**，避免链筛选切换后残留旧分页错。  
- **验收（手动）**：首屏成功后故意使第二页 **`GET` 失败**：可见非空说明、**重试** 与 **关闭提示**；关闭后条带消失且主表仍在。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-GOVERNANCE-PROPOSALS-LIST-APIERRORALERT-RETRY-EMPTY-001

- **阶段**：微任务 · 治理提案列表页（`/governance/proposals`）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/routes/governance.rs`、`frontend/lib/api.ts`、`frontend/app/governance/proposals/page.tsx`、`frontend/components/ApiErrorAlert.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. 首屏 **`GET /api/v1/governance/proposals`**（`fetchJsonWithApiStatusLog` + `mapApiReadError(..., "governance_proposals_loadFailed")`）。  
  2. **失败**：**`ApiErrorAlert`** + **`common_retry`**（递增 **`retryTick`** 触发重拉）；**禁止**在失败时展示「无提案」空态。  
  3. **成功且 `items.length === 0`**：**独立**中性块（**`governance_proposals_empty_*`**），明确写清「请求已成功、暂无条目」，与错误文案不同；**禁止**把 HTTP/解析失败当成空列表。  
  4. **成功且非空**：列表渲染（占位字段可 **未命名** i18n）。  
  5. 后端占位：**`status: ok`、`items: []`**，带 **`X-Implementation-Status: placeholder`**，与 rewards 占位风格一致。  
- **验收（手动）**：断网/404 → 红色告警条 + 重试；后端正常 → 空列表信息与错误不同。  
- **测试**：`cargo test -p traveltrust-api governance_proposals_returns`；`cd frontend && npx tsc --noEmit`  

---

### TT-GOVERNANCE-PROPOSAL-DETAIL-VOTE-001

- **阶段**：微任务 · 治理提案详情与链下投票（B-072）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/routes/governance_proposals.rs`、`crates/api/src/routes/governance.rs`、`frontend/lib/api.ts`、`frontend/lib/apiClient/governance.ts`、`frontend/lib/apiClient/core.ts`、`frontend/lib/apiClient/index.ts`、`frontend/lib/mapOrderWriteError.ts`、`frontend/lib/mapOrderWriteError.test.ts`、`frontend/app/governance/proposals/page.tsx`、`frontend/app/governance/proposals/[id]/page.tsx`、`frontend/app/governance/proposals/[id]/layout.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`frontend/e2e/smoke.spec.ts`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **路由**：**`GET /api/v1/governance/proposals/:proposal_id`** → **`proposal`** + **`vote_counts`** + **`my_vote`**（会话下）；**`POST /api/v1/governance/proposals/:proposal_id/vote`** body **`vote`** ∈ **`yes|no|abstain`**，带 **`writeRequestHeaders`**。  
  2. **重复投票**：**同一用户同一提案**再投**相同**选项 → **HTTP 200** **`idempotent:true`** **`duplicate:true`**；**不同**选项 → **409** **`already_voted`**（**`existing_vote`**）。  
  3. **前端**：**`/governance/proposals/[id]`** 拉详情；已登录（localStorage 会话）展示投票钮；未登录展示 **`returnUrl`** 登录链；**`mapOrderWriteError`** / **`parseResponse`** 识别 **`proposal_not_found`**、**`invalid_*`**、**`already_voted`**。  
  4. **列表**：每条有 **`id`** 时 **`<Link>`** 至 **`/governance/proposals/:id`**。  
- **验收（手动）**：种子 UUID **`00000000-0000-4000-8000-000000000001`** 打开详情 → 登录后投票 → 刷新见 **`my_vote`** 与计票变化；同选项再投见幂等提示；换选项见 **409** 映射文案。  
- **测试**：`cargo test -p traveltrust-api`（含 **`governance_proposals`** 模块测）；`cd frontend && npx vitest run lib/mapOrderWriteError.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-GOVERNANCE-DELEGATE-VOTE-001

- **阶段**：微任务 · 治理投票权委托与撤销（B-073）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/routes/governance_delegate.rs`、`crates/api/src/routes/mod.rs`、`crates/api/src/routes/governance.rs`、`frontend/lib/api.ts`、`frontend/lib/apiClient/governanceDelegate.ts`、`frontend/lib/apiClient/core.ts`、`frontend/lib/apiClient/index.ts`、`frontend/lib/mapOrderWriteError.ts`、`frontend/lib/mapOrderWriteError.test.ts`、`frontend/app/governance/delegate/page.tsx`、`frontend/app/governance/delegate/layout.tsx`、`frontend/app/governance/page.tsx`、`frontend/app/governance/proposals/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`frontend/e2e/smoke.spec.ts`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **API**：同一路径 **`/api/v1/governance/delegate`** — **`GET`**（匿名 **`authenticated:false`**；已登录返回 **`delegate_to`**）、**`POST`** body **`delegate_to`** UUID（**`writeRequestHeaders`**）、**`DELETE`** 撤销；**`X-Implementation-Status: chain_off_mvp`**。  
  2. **回执**：成功写响应含 **`request_id`**（**`x-request-id`** 或生成）、**`tx_hash:null`**、**`implementation_note`**；**同目标**再 **POST** **`idempotent:true`**。  
  3. **错码**：**400** **`cannot_delegate_to_self`** / **`invalid_delegate_to`**；**404** **`no_active_delegation`**（**DELETE**）；**401** **`login_required`**（写路径）。  
  4. **前端**：**`/governance/delegate`** 展示当前委托、表单、撤销、回执区 **`request_id`** 一键复制；**`/governance`** 与 **`/governance/proposals`** 底栏链入。  
- **验收（手动）**：登录 → 委托有效 UUID → 刷新仍见 **`delegate_to`** → 撤销 → 刷新为未委托；回执 **`request_id`** 可复制。  
- **测试**：`cargo test -p traveltrust-api governance_delegate`；`cd frontend && npx vitest run lib/mapOrderWriteError.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-GOVERNANCE-PARAMS-PROTOCOL-PENDING-DIFF-001

- **阶段**：微任务 · 治理参数页 protocol-reference 与待生效包对拍（B-074）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/routes/governance_doc_reference.rs`、`crates/api/src/routes/governance.rs`、`frontend/lib/api.ts`、`frontend/lib/api.test.ts`、`frontend/app/governance/params/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`frontend/e2e/smoke.spec.ts`、`.env.example`、`docs/spec/04-后端与API.md`（§3.4 表行）、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **API**：**`GET /api/v1/governance/protocol-reference/pending`** 返回与 **`protocol-reference`** 同形镜像，根级 **`pending_package_source`** ∈ **`mirror` \| `env_overlay` \| `overlay_parse_error`**；可选 **`PROTOCOL_REFERENCE_PENDING_OVERLAY`**（JSON）与镜像根 **深度合并**；响应头 **`X-Implementation-Status: doc-reference-pending`**。  
  2. **前端**：**`/governance/params`** 并行拉 **`protocol-reference`** 与 **`pending`**；首屏失败仍用 **`ApiErrorAlert`**；待生效失败仅对拍区报错；**五项**（L1 国家桶/Global Pool + Global 内 TTG/储备/运营）表：**当前 / 待生效 / 是否一致**，不一致行 **高亮**。  
  3. **验收（手动）**：默认全 **是**；设置 **`PROTOCOL_REFERENCE_PENDING_OVERLAY`** 覆写任一 **`fee_router`** 百分数后刷新，表出现 **否** 与高亮。  
- **测试**：`cargo test -p traveltrust-api`；`cd frontend && npx vitest run lib/api.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-FEED-SHARE-COPYLINK-001

- **阶段**：微任务 · 社区 Feed 分享链接与剪贴板失败提示（B-075）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/communityPostShareUrl.ts`、`frontend/lib/communityPostShareUrl.test.ts`、`frontend/components/community/CommunityPostShareMenu.tsx`、`frontend/components/community/CommunityFeedCardCompact.tsx`、`frontend/components/community/CommunityFeedList.tsx`、`frontend/app/community/messages/[id]/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（`/community` 页面路由表一句）、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **URL**：唯一工具函数 **`buildCommunityPostShareUrl(origin, postId)`** → **`{origin}/community?post=<encodeURIComponent(id)>`**；与 **`/community/post/[id]`**、**`useCommunityFeed`** **`?post=`** 一致。  
  2. **复制**：**`CommunityPostShareMenu`** **`clipboard.writeText`** 使用该 URL；失败 **`catch`** 设 **`community_share_copy_failed`**，菜单内 **`role="alert"`** 展示；成功路径不变。  
  3. **Feed 紧凑卡**：移动双列 **`CommunityFeedCardCompact`** 须含同一 **`CommunityPostShareMenu`**（含 **`onReport`** 透传）。  
- **验收（手动）**：动态 tab 复制链接 → 无痕/未登录新标签粘贴打开 → 与 **`?post=`** 深链相同帖子。  
- **测试**：`cd frontend && npx vitest run lib/communityPostShareUrl.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-AUTHOR-FOLLOW-SYNC-001

- **阶段**：微任务 · 社区关注作者与 me/following 对读（B-076）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/db/community.rs`、`crates/api/src/routes/community.rs`、`frontend/lib/communityMockData/types.ts`、`frontend/components/community/communityFeedMappers.ts`、`frontend/components/community/useCommunityFeed.ts`、`frontend/app/community/user/[id]/page.tsx`、`docs/spec/04-后端与API.md`（**`GET …/feed`**、**`GET …/posts/:id`**、**`GET …/users/:user_id/posts`** 表行）、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **API**：**`posts_json_with_engagement_counts`** 在**已登录**且作者非访客时写 **`author_followed_by_me`**；**`GET …/posts/:id`** 在同等条件下写 **`post.author_followed_by_me`**（**`db::followed_following_ids_in_set`** / **`db::is_following`**）。  
  2. **前端**：**`mapApiPostToCommunityPost`** → **`authorFollowedByMe`**；**`useCommunityFeed`** 用详情与 Feed 行字段 **patch `followingIds`**（与既有 **`POST|DELETE …/follow`** 成功回调并存）；用户主页：列表 **error** 时以帖子字段定 **`isFollowing`**；列表 **ready** 且帖子 **`author_followed_by_me:true`** 时 **OR 合并为已关注**（缓解关注列表分页截断）。  
- **验收（手动）**：**`/community?post=`** 打开详情 → 关注/取关 → 关闭再开同帖或回 Feed，按钮与 **`GET …/me/following`** 一致；**不**整页 reload。  
- **测试**：`cargo test -p traveltrust-api`；`cd frontend && npx tsc --noEmit`  

---

### TT-COMMUNITY-TOPIC-SORT-URL-001

- **阶段**：微任务 · 社区话题页排序与 Feed query 同源（B-077）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/communityFeedSortUrl.ts`、`frontend/lib/communityFeedSortUrl.test.ts`、`frontend/components/community/useCommunityFeed.ts`、`docs/任务母表.md`、本索引一览行与正文  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **URL**：**`sort`** 仅 **`hot`** 有意义；**缺省或其它值** → **`latest`**（**`parseCommunityFeedSortFromQuery`**）。  
  2. **切换排序**：**`pathnameWithFeedSort(pathname, window.location.search, sort)`** → **`router.replace`**（**不**滚动）；**`latest`** 时 **删除** **`sort`**；**`hot`** 时 **`sort=hot`**。  
  3. **Feed API**：**`feedApiMode`** = 关注流 **`follow`**；否则 **`sortBy === 'hot' ? 'hot' : 'latest'`**；**`feedTagFromUrl`** 从 **`/community/topic/…`** 或 **`?tag=`** 解析，与 **`GET …/feed`** **`tag`** 一致（04 §3.4 **`mode`/`tag`** 已登记）。  
  4. **话题链接**：**`communityTopicPathForTag`** / **`feedSortQuerySuffix`** 与 **`setTagFilter`** 同源，避免热榜下话题 **`<Link>`** 丢 **`sort`**。  
- **验收（手动）**：在 **`/community/topic/某标签`** 切 **最新/热门** → Network 中 **`GET …/community/feed`** 的 **`mode`** 在 **`latest`** 与 **`hot`** 间切换，且带同一 **`tag`**（若有）。  
- **测试**：`cd frontend && npx tsc --noEmit && npx vitest run lib/communityFeedSortUrl.test.ts`  

---

### TT-GUIDE-DASHBOARD-PERIOD-EARNINGS-001

- **阶段**：微任务 · 向导工作台本周期指标（B-078）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/chain_off/mod.rs`（**`guide_period_dashboard_stats`**）、`crates/api/src/chain_off/me.rs`、`crates/api/src/routes/me.rs`、`frontend/components/guide/GuideBillingPeriodCard.tsx`、`frontend/app/guide/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（§3.2 / §3.4 **`me/stats`**、**`/guide`** 行）、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **API**：**`GET /api/v1/me/stats`** 与 **`GET /api/v1/me`** 的 **`stats`**（**`role=guide`**）合并 **`billing_period_utc`**（**`YYYY-MM`** UTC）、**`period_expected_earnings`**（向导 **`Accepted`****/**`Escrowed`****/**`Disputed`** **`amount` 之和**）、**`period_settled_orders_count`**（当月 **`updated_at`** 且 **`is_final_financial_state()`** 计数）。  
  2. **前端**：**`/guide`** 向导可见 **`GuideBillingPeriodCard`**，字段只读 **`getMeStats`**，与接待统计同加载/重试。  
- **验收（手动）**：链下将一单推进至资金终态后刷新 **`/guide`**，**`period_settled_orders_count`** 或 **`period_expected_earnings`** 至少一项相对前态可与 **`GET …/me/stats`** 对照变化。  
- **测试**：`cargo test -p traveltrust-api`；`cd frontend && npx tsc --noEmit`  

---

### TT-GUIDES-DETAIL-SCHEDULE-AVAILABILITY-001

- **阶段**：微任务 · 向导详情页档期占用只读（B-079）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/schedule_engine.rs`（**`locked_slots_for_guide`**）、`crates/api/src/chain_off/guides.rs`（**`guide_availability_impl`**）、`crates/api/src/routes/guides.rs`、`frontend/lib/api.ts`、`frontend/lib/apiClient/guides.ts`、`frontend/lib/apiClient/guides.test.ts`、`frontend/lib/apiClient/index.ts`、`frontend/components/guides/GuideOccupiedScheduleBlock.tsx`、`frontend/app/guides/[id]/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（§3.3 / §3.4 **`guides/:id/availability`**、**`/guides/:id`** 行）、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **API**：**`GET /api/v1/guides/:id/availability`** 返回 **`occupied_ranges`**：**`source`****=`lock`** 来自 **`schedule_engine`** 与 **`has_overlapping_lock`** 同源；**`source`****=`order`** 来自 **`Accepted`****/**`Escrowed`****/**`Disputed`** 且 **`start_date`/`end_date`** 均有值；同 **`order_id`** 以 **`lock`** 为准去重。  
  2. **前端**：**`/guides/[id]`** 展示 **`GuideOccupiedScheduleBlock`**（约 **3** 个月历网格），占用日以高对比样式标出，与 **`getGuideAvailability`** 响应一致。  
- **验收（手动）**：造 **Accepted**（或已锁定）含日期订单后刷新向导详情，历网与 **`GET …/availability`** 列表区间一致。  
- **测试**：`cargo build -p traveltrust-api`；`cd frontend && npx vitest run lib/apiClient/guides.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-GUIDE-DASHBOARD-REGISTRATION-BANNER-001

- **阶段**：微任务 · 向导工作台资质审核顶栏（B-080）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/migrations/20260419000048_guides_registration_rejection.sql`、`crates/api/src/db/guides.rs`、`crates/api/src/chain_off/mod.rs`、`crates/api/src/chain_off/me.rs`、`crates/api/src/chain_off/guides.rs`、`crates/api/src/startup/hydrate.rs`、`crates/api/src/routes/admin.rs`、`crates/api/src/routes/messages.rs`、`crates/api/src/chain_off/auth.rs`、`crates/api/src/chain_off/tests_*.rs`、`frontend/lib/meTrust.ts`、`frontend/lib/meTrust.test.ts`、`frontend/components/guide/GuideRegistrationStatusBanner.tsx`、`frontend/components/me/MeTrustSection.tsx`、`frontend/app/guide/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（§3.4 **`GET /me`** **`trust`**、Admin **`PATCH …/guides/:id`** 行）、`docs/任务母表.md`、本索引一览行  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`GET /api/v1/me.trust`**：保留 **`guide_registration_status`**=`guides.status`；当 **`status=rejected`** 时另含 **`guide_registration_rejection_codes`**、可选 **`guide_registration_rejection_message`**（与 DB **`guides`** 列同源）。  
  2. **Admin**：**`PATCH /api/v1/admin/guides/:id`** 可写 **`status`** + 拒绝信息；**`rejected`** 须至少一种拒绝信息非空。  
  3. **前端**：**`/guide`** 在标题卡**上方**展示**单一**资质横幅（与 **`parseMeTrustFromMeResponse`** 同源）；**`MeTrustSection`** 在向导台隐藏重复的「向导注册」格。  
  4. **产品映射**：**`active`** → 已通过；**`pending`/`pending_review`** → 审核中；**`rejected`** → 展示码+说明。  
- **验收（手动）**：Admin **`PATCH`** 改 **`rejected`** 带码/文 → 向导账号打开 **`/guide`** 点刷新 → 横幅与 **`GET /me`** 一致。  
- **测试**：`cargo test -p traveltrust-api`；`cd frontend && npx tsc --noEmit`；`npx vitest run lib/meTrust.test.ts`  

---

### TT-AUTH-LOGOUT-POST-OK-THEN-CLEAR-NAVIGATE-001

- **阶段**：微任务 · 认证登出（顶栏用户菜单、`/me`）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/apiClient/auth.ts`、`frontend/lib/apiClient/index.ts`、`frontend/components/Header.tsx`、`frontend/components/Header.test.tsx`、`frontend/components/me/useMePage.ts`、`docs/spec/04-后端与API.md`（`POST /auth/logout` 行）  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`postLogout`**：**不得**在请求发出前清除 getMe 缓存或 localStorage；**HTTP 2xx** 且 **`throwUnlessApiOk`** 通过后由调用方执行本地收口。  
  2. **`applyLocalLogoutAfterServerOk`**（单处实现）：**`clearGetMeCache`** + **`clearClientAuthStorage`** + **`traveltrust_user_id` cookie** `Max-Age=0` + **`traveltrust:auth-change`**。  
  3. **顶栏 `UserMenu`**：**`await postLogout()`** → 成功则 **`applyLocalLogoutAfterServerOk`** → **`router.push("/")`**；失败仅 **`console.error`**，**不**清会话、**不**导航。  
  4. **`/me` `useMePage.handleLogout`**：确认后同上，成功则 **`window.location.href = "/auth/login"`**；失败不清会话。  
  5. **防重复提交**：顶栏登出 **`logoutBusy`** 禁用按钮（**`aria-busy`**）。  
- **验收（手动）**：登出后立刻进 **`/me`** 应重定向登录或未登录态；**断网**登出失败时仍带会话；成功后再点登出不抛未处理异常。  
- **测试**：`cd frontend && npx vitest run components/Header.test.tsx`；`cd frontend && npx tsc --noEmit`  

---

### TT-ESCROW-DISPUTE-RESOLUTION-FUND-SPLIT-DISPUTES-SSOT-001

- **阶段**：微任务 · Escrow 争议裁决资金示意（与 disputes API 对读）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/disputeResolutionFundSplit.ts`、`frontend/lib/disputeResolutionFundSplit.test.ts`、`frontend/components/escrow/EscrowDetail/DisputeResolutionFundBlock.tsx`、`frontend/components/escrow/EscrowDetail/index.tsx`、`frontend/components/ApiErrorAlert.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（`/escrow/:id` 路由表一句）  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **SSOT**：拆分数字仅来自 **`GET /api/v1/disputes/:id`** 的 **`refund_ratio`**（已裁决）与 **`slash_guide`**，订单总额来自当前页 **`GET /api/v1/orders/:id`** 同源展示（**`data.amount`/`currency`**）。  
  2. **触发**：订单 **`state`** 为 **`refunded` / `partially_refunded` / `slashed`**（与 **`order_state_to_str`** 一致）时拉 **`getDisputes`**，按 **`order_id`** 且 **`status=resolved`** 取 **`resolved_at` 最新** 一条，再 **`getDispute(id)`**；无匹配或 **`refund_ratio` 缺失** 则**不渲染**区块。  
  3. **计算**：**`computeDisputeResolutionFundSplit`** — 游客 **`amount * refund_ratio`**；**非 slash** 时向导 **`amount - 游客`**；**slash** 时向导 **0**、**`platformPool`** = **`amount - 游客`**（示意罚没剩余）。  
  4. **失败**：**`mapApiReadError(..., "dispute_fund_split_loadFailed")`** + **`ApiErrorAlert`**（did 用 **`tone="dark"`**）+ **`common_retry`**。  
  5. **导航**：提供至 **`/disputes/:id`** 的链。  
- **验收（手动）**：裁决 **`refund_ratio=0.3`、无 slash** → 页内游客 30%、向导 70%；**slash** → 向导 0、池示意 = 剩余。  
- **测试**：`cd frontend && npx vitest run lib/disputeResolutionFundSplit.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-ESCROW-PROTOCOL-PAUSE-META-GATE-ONCHAIN-001

- **阶段**：微任务 · Escrow 协议暂停门闸（meta 对读）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/readProtocolPauseFromMeta.ts`、`frontend/lib/readProtocolPauseFromMeta.test.ts`、`frontend/components/escrow/EscrowDetail/index.tsx`、`EscrowOnChainActions.tsx`、`EscrowTxModal.tsx`、`CreateOnChainEscrowBlock.tsx`、`SetEscrowAddressBlock.tsx`、`OrderActionsBlock.tsx`、`BilateralConfirmBlock.tsx`、`QuoteSummaryCard.tsx`、`ConfirmFinalPlanBlock.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（§三 契约句）  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **真值源**：**`readProtocolPauseFromMeta(meta)`** — 仅当 **`meta.pause.enabled === true`** 时门闸生效（与 **`PAUSE_MODE=1`** / **`health_meta` `pause`** 同源）。  
  2. **横幅**：**`EscrowDetail`** 协议区顶 **`escrow_protocolPause_title`** + **`escrow_protocolPause_body`**（**`role="status"`**）。  
  3. **拦截**：**`EscrowOnChainActions`**（含未连接 teaser）、**`EscrowTxModal`** 确认、**`CreateOnChainEscrowBlock`**、**`SetEscrowAddressBlock`**、**`ConfirmFinalPlanBlock`**（经 **`QuoteSummaryCard`**）、**`OrderActionsBlock`**（含意向/链下争议）、**`BilateralConfirmBlock`**；**`onSetConfirmAction`** / **`handleTxConfirm`** / **`handleConfirmDispute`** 硬 return。  
  4. **meta 失败**：不将缺失 **`meta`** 视为暂停（**`503` `api_paused`** 仍为服务端兜底）。  
- **验收（手动）**：**`PAUSE_MODE=1`** 重启 API → **`GET /meta`** **`pause.enabled:true`** → **`/escrow/:id`** 见横幅且上述按钮不可完成成功链上/写步骤。  
- **测试**：`cd frontend && npx vitest run lib/readProtocolPauseFromMeta.test.ts`；`cd frontend && npx tsc --noEmit`  

---

### TT-ESCROW-WALLET-RPC-CONTRACT-READ-DEGRADE-001

- **阶段**：微任务 · Escrow 钱包 RPC 读合约降级（B-068）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/useEscrowDetail.ts`、`EscrowChainReadDegradedBanner.tsx`、`index.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（§三 契约句）  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **判定**：**`readEscrowEnabled`** 下 **`useReadContract`** 对 **`token` / `symbol` / `allowance`** 任一 **`isError && fetchStatus === 'idle'`** → **`chainContractReadDegraded`**。  
  2. **防陈旧**：**`isError`** 时**不**用 query **`data`** 推导 **`settlementTokenAddress`**、**`allowance`**、**`needsDepositApproval`**（**`allowance`** 未知则不触发「须授权」误示）。  
  3. **UI**：**`EscrowChainReadDegradedBanner`**（**`escrow_chainReadDegraded_*`**）+ **`lastChainContractReadOkAt`**（成功 **`token`** 的 **`dataUpdatedAt`**；无则 **无缓存** 句）。  
  4. **日志**：首次进入降级 **`console.warn`** **`[useEscrowDetail][B-068]`**。  
- **验收（手动）**：断钱包 RPC / 错误 RPC URL → 横幅 + 控制台告警；恢复后自动重试并消失。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-ORDERS-LIST-ESCROW-AUTO-SYNC-POLL-001

- **阶段**：微任务 · `/orders` 与订单抽屉 Escrow 管线静默对齐（B-069）  
- **状态**：已封口  
- **本轮仅改**：`frontend/lib/ordersEscrowAutoSyncPoll.ts`、`frontend/lib/ordersEscrowAutoSyncPoll.test.ts`、`frontend/app/orders/page.tsx`、`frontend/components/market/OrderDetailDrawer.tsx`、`docs/spec/04-后端与API.md`（§三 契约句）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **周期**：**`ORDERS_ESCROW_AUTO_SYNC_POLL_MS` = **5000**（唯一钉死 **T**）。  
  2. **列表**：**`list.some(orderListItemWatchesForBackendEscrowSync)`** 为真时 **`setInterval`** → **`refreshOrders({ silent: true })`**；**`visibilityState === 'hidden'`** 跳过 tick；**`visibilitychange`→`visible`** 补跑一次。  
  3. **抽屉**：**`orderDetailItemWatchesForBackendEscrowSync`** 为真时同隔 **`getOrder(orderId)`**，合并 **`state` / `status` / `sub_status` / `escrow_address`**（**`escrowSyncPatch`**）；**`orderId`** 变更清 patch。  
  4. **预览与列表**：抽屉打开时 **`previewOrder`** 随 **`list`** 静默刷新对上述四字段与 **`orderListItemToDetailDrawer(row)`** 对齐（同 id）。  
- **验收（手动）**：**Accepted** 或已具备入金条件订单在另一 Tab **mock-pay / 入金** 后，**≤5s** 内列表徽章或抽屉状态与 **`GET`** 一致，无需手刷。  
- **测试**：`cd frontend && npx tsc --noEmit && npx vitest run lib/ordersEscrowAutoSyncPoll.test.ts`  

---

### TT-ESCROW-CONFIRM-FINAL-PLAN-GOTO-ESCROW-001

- **阶段**：微任务 · 终版确认后直达托管路由（B-070）  
- **状态**：已封口  
- **本轮仅改**：`frontend/components/escrow/EscrowDetail/index.tsx`、`docs/spec/04-后端与API.md`（§三 契约句）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`QuoteSummaryCard` → `ConfirmFinalPlanBlock`** 的 **`onConfirmed`** 在 **`EscrowDetail`** 内实现为 **`onConfirmFinalPlanSuccess`**（**勿**与 **`PATCH itinerary`** 成功后的仅 **`refreshOrder`** 混用）。  
  2. 成功路径：**`data.refreshOrder()`** → **`router.replace(\`/escrow/${encodeURIComponent(escrowId)}\`)`** → **`router.refresh()`** → **`setTimeout` ~200ms** 后对 **`#escrow-after-final-plan`** **`scrollIntoView({ behavior: 'smooth', block: 'start' })`**。  
  3. **DOM**：协议区内 **`OrderFlowSteps`** 外包一层带 **`id="escrow-after-final-plan"`**、**`scroll-mt-24`**、**`tabIndex={-1}`**。  
  4. **`409` `version_conflict`**：沿用 **`ConfirmFinalPlanBlock`** 现有 **`onConfirmed()`** 调用，与成功路径共用同一回调，保证列表/快照与路由一致刷新。  
- **备注**：当前 **`confirm-final-plan`** 仅挂在 **`/escrow/[id]`**；若未来在其它路由挂载同块，须仍 **`replace`** 至 **`/escrow/:order_id`**（与 **`POST` 成功体 `order_id`** 对读）。  
- **验收（手动）**：Draft 无 snapshot → 确认终版 → 模态关闭后地址为 **`/escrow/:id`**、流程条进入视口、数据已刷新。  
- **测试**：`cd frontend && npx tsc --noEmit`  

---

### TT-ORDERS-LIST-TERMINAL-STATE-QUERY-001

- **阶段**：微任务 · 我的订单终态筛选与 API query 同源（B-071）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/routes/orders/mod.rs`（**`OrdersListQuery.state`**、**`get_orders`** 校验）、`crates/api/src/chain_off/orders.rs`（**`orders_list_impl`** **`state_filter`**）、`crates/api/src/chain_off/tests_events_itinerary.rs`（调用点 **`None`**）、`frontend/lib/apiClient/orders.ts`、`frontend/lib/apiClient/orders.list.test.ts`、`frontend/lib/ordersListStateQuery.ts`、`frontend/app/orders/page.tsx`、`frontend/locales/zh.ts`、`frontend/locales/en.ts`、`docs/spec/04-后端与API.md`（§三）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **API**：**`GET /api/v1/orders?state=`** 非空时须为 **`str_to_order_state`** 可解析小写状态；**`orders_list_impl`** 在参与方过滤后 **`o.state == state_filter`**；非法 **400** **`invalid_state`**。  
  2. **前端**：URL query 键 **`state`**（**`ORDERS_LIST_STATE_QUERY`**）；**`normalizeOrdersListStateQueryParam`** 白名单 **`completed` / `cancelled` / `disputed`**（与 UI 一致）；非法值 **`useEffect`** 从 URL **删除**。**`getOrders`** / **`loadMore`** 传同一 **`state`**。  
  3. **勿**仅在前端按状态过滤全量列表冒充 API 筛选。  
- **验收（手动）**：选终态 → 开发者工具见请求带 **`state=`** → 列表项 **`status`/`state`** 与该终态一致；**`全部`** 无 **`state`** query。  
- **测试**：`cargo test -p traveltrust-api orders_list_pagination`；`cd frontend && npx tsc --noEmit && npx vitest run lib/apiClient/orders.list.test.ts`  

---

### TT-REVENUE-FEE-ROUTER-LOG-RPC-VERIFY-001

- **阶段**：收益 / 链上索引对账（Phase 3 · B-081）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/chain/fee_router_verify/`（目录装配）、`crates/api/src/chain/mod.rs`、`crates/api/src/routes/internal.rs`（**`IndexerReconcileBody`**、**`indexer_reconcile`**、**`collect_fee_router_log_verify`**）、`docs/spec/04-后端与API.md`（**`indexer-reconcile`** 行）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`POST /api/v1/internal/indexer-reconcile`** body 可选 **`verify_fee_router_events_rpc`**：**1～20**，对 **`fee_router_routed_events`**（当前 **`chain_id`**）降序最多取 **N** 行。  
  2. 每一行：**`eth_getTransactionReceipt(tx_hash)`** 定位 **`log_index`**；**`address`**/**`topic0`** 须与 **`PlatformFeeRouted`** 及配置 **`FEE_ROUTER_ADDRESS`** 一致；**`parse_platform_fee_routed`** 解码之 **`token`** 与五路 **`uint256`** 与 DB 列 **规范化后**逐字相等。  
  3. 另 **`eth_call`**：**`countryBucket()`**、**`globalStakers()`**、**`globalReserve()`**、**`globalOps()`**，写入响应 **`fee_router_recipients_on_chain`**（失败时 **`fee_router_recipients_error`**，**不**阻断对账 **200**）。  
  4. 响应根级及 **`persist`** 之 **`summary`** 键 **`fee_router_log_verify`**，锚 **`B-081-FEE-ROUTER-LOG-VERIFY`**；**`log_verify_clean`**：有抽样行且 **`samples[].ok`** 全为 **`true`** 时为 **`true`**；无投影行时 **`no_fee_router_rows`**、**`log_verify_clean`=`null`**；未配 **`FEE_ROUTER_ADDRESS`** 时 **`skipped`**。  
- **验收（环境）**：已配置 **RPC + DB + `FEE_ROUTER_ADDRESS`** 且表内 **≥1** 行时 **`verify_fee_router_events_rpc:1`** → **`fee_router_log_verify.samples[0].ok === true`**；可与 **`cast receipt`** / **`eth_getLogs`** 人工对读同一 **`tx_hash`**。  
- **测试**：`cargo test -p traveltrust-api`  
- **备注**：事件体不携带 **to** 地址；**83/84** 分层收款地址以合约只读 getter 输出与部署文档对读；份额字段以日志 **五路金额** 与 DB 一致为机读验收。  

---

### TT-REVENUE-REGION-VAULT-FORWARD-BALANCE-CLOSURE-001

- **阶段**：收益 / 链上索引对账（Phase 3 · B-082）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/chain/region_vault_verify.rs`、`crates/api/src/chain/mod.rs`、`crates/api/src/routes/internal.rs`（**`IndexerReconcileBody.verify_region_vault_events_rpc`**、**`collect_region_vault_log_verify`**、**`indexer_reconcile`**）、`docs/spec/04-后端与API.md`（**`indexer-reconcile`** 行）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`POST /api/v1/internal/indexer-reconcile`** body 可选 **`verify_region_vault_events_rpc`**：**1～20**，对 **`region_vault_forwarded_events`**（当前 **`chain_id`**）降序最多 **N** 行。  
  2. 每一行：**`eth_getTransactionReceipt`**；**`receipt.blockNumber`** 与 DB **`block_number`** 一致；**`log_index`** 定位 log；**`address`**/**`topic0`** 与 **`RegionVaultForwarded`** 及 **`REGION_VAULT_ADDRESS`** 一致；**`parse_region_vault_forwarded`** 之 **`token`/`to`/`amount`** 与 DB **规范化后**相等。  
  3. **余额闭环**：**`eth_getBlockByNumber(B,false)`** 若 **`transactions.len()==1`** 且即本 **`tx_hash`**，则 **`eth_call`** **`balanceOf(to)`** 于块 **`B`** 与 **`B-1`** 末状态，**`delta == amount`**（**256-bit** 无借位减）；否则 **`balance_closure.balance_delta_check`=`skipped_multi_tx_or_hash_mismatch`**，**不**因多交易块判 **`ok:false`**（仅 log 须一致）。**`B==0`** 时跳过余额父块。  
  4. 响应 **`region_vault_log_verify`**，锚 **`B-082-REGION-VAULT-LOG-VERIFY`**；**`persist:true`** 写入 **`summary`**。  
- **验收（环境）**：**Anvil/分叉** 下单交易块仅含 **`forward`** 一笔时，**`verify_region_vault_events_rpc:1`** → **`samples[0].ok`** 且 **`balance_closure.balance_delta_check`** 为 **`ok`**；多交易主网块以 **`skipped_…`** 为预期，另用手工 **`trace`** 验收。  
- **测试**：`cargo test -p traveltrust-api`  
- **备注**：与 **84** 国池展示表对读时，以本响应 **`to`**/**`token`**/**`amount`** 与链上 receipt 为 SSOT。  

---

### TT-REVENUE-FEE-ROUTE-COUNTRY-SSOT-001

- **阶段**：收益 / 订单费路由子路径（Phase 3 · B-083）  
- **状态**：已封口  
- **本轮仅改**：`crates/core/src/fee_route_country.rs`、`crates/core/src/lib.rs`、`crates/api/src/chain_off/orders.rs`（**`order_detail_envelope`**）、`crates/api/src/routes/health_meta.rs`（**`ORDERS_META_TOP_KEYS`**、**`orders_section`**、**785** **`chain.rule`** 句）、`frontend/lib/apiClient/meta.ts`、`frontend/lib/apiClient/meta.test.ts`、`frontend/lib/api.ts`、`docs/spec/04-后端与API.md`（**`GET /orders/:id`**）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **SSOT**：行程 **`destination`** 中文国家名，与 **`traveltrust_core::product_countries`**（**POST /itineraries** 校验）同源。  
  2. **`resolve_fee_route_country_from_zh_destination`**：命中十国 → **`FeeRouteCountryResolve::Routed`**（**`iso3166_alpha2`**、**`bucket_route_key`**=`country_pool_{iso_lower}`）；空或未在表 → **`RejectUnmapped`**（**`fee_route_empty_destination`** / **`fee_route_unmapped_destination`**），**不**静默默认池。  
  3. **`GET /api/v1/orders/:id`**：存在 **itinerary bundle** 时 **`order.fee_route_country`** 为上述 JSON（成功体含 **`on_chain_mvp`**=`fee_router_single_country_bucket` 等人读注）。  
  4. **`GET /meta`** **`orders.fee_route_country_ssot`**：人读说明 + **744** 顶层键序插入 **`fee_route_country_ssot`**（**`ORDERS_META_TOP_KEYS`** **七键**）；**785** **`chain.rule`** 句 **`六键`→`七键`** 与 **`META_CHAIN_RULE_785_*`** 字节一致。  
- **验收（手动）**：两订单 **destination** 分别为 **中国** / **日本** → **`bucket_route_key`** **`country_pool_cn`** / **`country_pool_jp`**；**意大利**（非十国）→ **`reject`**。  
- **测试**：`cargo test -p traveltrust-core`、`cargo test -p traveltrust-api`；`cd frontend && npx vitest run lib/apiClient/meta.test.ts`  
- **备注**：链上 **`FeeRouter.sol` MVP** 仍为单一 **`countryBucket`**；**`bucket_route_key`** 为链下/索引/未来多桶合约对齐用逻辑子路径。  

---

### TT-REVENUE-FEE-POOL-AGGREGATES-PROJECTION-001

- **阶段**：收益 / 经济投影聚合对账（Phase 3 · B-084）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/u256_hex.rs`、`crates/api/src/main.rs`（**`mod u256_hex`**）、`crates/api/src/db/economic_aggregate.rs`、`crates/api/src/db/mod.rs`、`crates/api/src/routes/governance.rs`（**`get_governance_fee_pool_aggregates`**、**`build_fee_pool_aggregate_body`**）、`frontend/lib/api.ts`（**`governanceFeePoolAggregates`**）、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **SSOT**：**仅** **`fee_router_routed_events`** 与 **`region_vault_forwarded_events`**（与 **B-081/B-082** 索引器写入同源）；**不**在本接口引入链上 **`eth_call`** 余额 batch（规格允许二选一，本实现钉死投影）。  
  2. **`GET /api/v1/governance/fee-pool-aggregates`**：**`chain_id?`**；**`fee_router.by_token[]`** 对 **`PlatformFeeRouted`** 五路 **`uint256`** 做 **checked Σ**（**`allocatable_platform_fee_total`**=DB **`amount_u256_hex`**；**`country_bucket`**=**`to_country`**；**`global_*`**=**`to_stakers`/`to_reserve`/`to_ops`**，与 **84** 叙事对齐）；**`region_vault.by_token[]`** 含 **`total_forwarded_u256_hex`** 与 **`by_recipient[]`**。  
  3. **`cross_check`**：自 **`governance_doc_reference::protocol_reference_json()`** 抽取 **`doc_version`**、**`checksums.phase1_open_fee_points_sum`** 等，供与 **84** 文档镜像人工对拍（**非**自动等式校验）。  
  4. **锚**：响应 **`anchor`****=`B-084-FEE-POOL-AGGREGATES-PROJECTION`**；无 DB 时 **`data_source`****=`placeholder`** + **`X-Implementation-Status: placeholder`**。  
  5. **错误**：**`500`** **`fee_pool_aggregates_query_failed`** / **`fee_pool_aggregates_malformed_u256_hex`** / **`fee_pool_aggregates_u256_overflow`**。  
- **验收（手动）**：向投影表增删改 **fixture 行** 后，本接口对应 **Σ** **同增同减**，响应**无**与行集无关的硬编码池额字段。  
- **测试**：`cargo test -p traveltrust-api`  
- **备注**：全表扫描聚合；大数据量时后续可改为 SQL 卷积或物化视图（非本卡范围）。  

---

### TT-INVESTOR-SHARE-SUPPLY-REBUILD-001

- **阶段**：收益 / 份额索引与只读对账（B-085）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/migrations/20260420000049_investor_share_transfer_events.sql`、`crates/api/src/db/investor_share.rs`、`crates/api/src/db/mod.rs`、`crates/api/src/chain/mod.rs`、`crates/api/src/chain/indexer/`、`crates/api/src/routes/internal.rs`、`crates/api/src/routes/governance_investor_share.rs`、`crates/api/src/routes/governance.rs`、`crates/api/src/routes/mod.rs`、`crates/api/src/u256_hex.rs`、`.env.example`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、`frontend/lib/api.ts`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **投影表** **`investor_share_transfer_events`**：幂等键 **`(chain_id, block_number, log_index)`**；来源为标准 ERC20 **`Transfer(address,address,uint256)`**（Mint/Burn 为 **`from`** 或 **`to`** 为零地址）。  
  2. **`POST …/internal/indexer-tick`**：在 **`INVESTOR_SHARE_TOKEN_ADDRESSES`**（逗号分隔）非空且 **`DATABASE_URL`** 时，对配置代币 **`eth_getLogs`**（**`topics[0]`**=Transfer）写入上表；响应 **`investor_share_transfer_events_new`**；**`INDEXER_STRICT_SUPPLEMENTAL_LOG_FETCH=1`** 时失败 **500** **`fetch_supplemental_logs_failed`**（**`investor_share_tokens`**）。  
  3. **Reorg 回退**：**`investor_share_transfer_events`** 与 **`fee_router`/`region_vault`** 同删尾（**`block_number >= rewind_from_block`**），响应 **`deleted.investor_share_transfer_events_rows`**。  
  4. **`GET /api/v1/governance/investor-share-reconcile`**：**`chain_id?`**、**`token_address?`**；自投影表有序重放 **`sum_balances_u256_hex`** 与 **`totalSupply()`** 比对；**`anchor`****=`B-085-INVESTOR-SHARE-SUPPLY-REBUILD`**；无 DB / 无投影行时 **`X-Implementation-Status: placeholder`**。  
  5. **可选合规**：表 **`investor_share_compliance_wallets`** 非空时返回 **`compliance.not_in_allowlist`**。  
- **验收（手动）**：测试网铸转销后本 **GET** **`invariant_holds:true`** 且 **`rpc_total_supply.matches_sum_balances:true`**（RPC 可达时）。  
- **测试**：`cargo test -p traveltrust-api`；`python3 scripts/check-04-routes-vs-code.py`  
- **备注**：不将 **`Transfer`** 混入主 **`event_log`** 流，以免刷屏；与 Escrow/FeeRouter 共用 tick 块域与 finality 上界。  

---

### TT-INVESTOR-DISTRIBUTION-ACCRUAL-001

- **阶段**：收益 / 应计分红分录（B-086）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/Cargo.toml`（**`num-bigint`**）、`crates/api/migrations/20260421000050_investor_distribution_accruals.sql`、`crates/api/src/db/investor_distribution.rs`、`crates/api/src/db/investor_share.rs`（**`list_investor_share_transfers_up_to_block`**）、`crates/api/src/db/mod.rs`、`crates/api/src/routes/investor_distribution.rs`、`crates/api/src/routes/internal.rs`、`crates/api/src/routes/governance.rs`、`crates/api/src/routes/mod.rs`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、`frontend/lib/api.ts`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **可分配现金流口径（唯一）**：**`fee_router_allocatable_platform_fee_sum`** = **`fee_router_routed_events`** 在 **`block_number <= snapshot_block_number`** 内、匹配 **`chain_id`+`token_address`** 的 **`amount_u256_hex`** 之 **uint256 Σ**（与 B-084 **`allocatable_platform_fee_total`** 同源字段）。  
  2. **分配公式（唯一）**：**`pro_rata_share_balance_at_snapshot`** — 对 **`investor_share_transfer_events`** 同条件快照重放持有人余额，**`accrual_i = floor(cash * balance_i / total_supply)`**，**`remainder = cash - Σ accrual`** 写入头表。  
  3. **幂等**：**`idempotency_key`** **`UNIQUE`**；重复 **POST** 返回 **`idempotent:true`** 与完整 **`distribution`**（含 **`lines`**），**不**二次插入。  
  4. **锚**：**`B-086-INVESTOR-DISTRIBUTION-ACCRUAL`**（internal 成功体与 governance **GET** 根级 **`anchor`**）。  
- **验收（手动）**：同一 **`idempotency_key`** 连打两次，库内**仅一行**头表+对应行表；**`cargo test`** 中 **`pro_rata_two_holders_matches_manual`** 与手工一致。  
- **测试**：`cargo test -p traveltrust-api`；`python scripts/check-04-routes-vs-code.py`  
- **备注**：**`distribution_id`** = 头表 **`id`**（UUID）；时间加权未实现（母表二选一已钉死占比）。  

---

### TT-INVESTOR-DISTRIBUTION-CLAIM-001

- **阶段**：收益 / 链上领取（B-087）  
- **状态**：已封口  
- **本轮仅改**：`contracts/src/InvestorDistributionClaim.sol`、`contracts/test/InvestorDistributionClaim.t.sol`、`contracts/abi/InvestorDistributionClaim.json`、`contracts/script/Deploy.s.sol`、`scripts/sync-abi-from-forge.sh`、`scripts/sync-abi-from-forge.ps1`、`scripts/verify-abi-forge.py`、`contracts/README.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **登记**：**`onlyOwner`** 调 **`registerAccrual` / `registerAccrualsBatch`** 写入 **`entitled`**；首笔登记固定该 **`distributionId`** 的 **`distributionToken`**。  
  2. **领取**：持有人 **`withdrawDividend(distributionId, maxAmount)`** 或 **`claim(...)`**（与内部 **`_withdrawDividend`** 同源）：单交易支付 **`min(remaining, maxAmount)`**，**`remaining = entitled − claimed`**。  
  3. **重放钉死**：**可领为 0** 时再调 → **`NothingToClaim()` revert**（**非**「成功转 0」）。  
  4. **`distributionId`**：与链下 **B-086** 头表主键对齐方式见合约注释（**`bytes32`** 与 UUID 映射须运营/API 约定一致）。  
- **验收（手动）**：Foundry：**第二次全额领取** 或 **领尽后再领** → **revert**；**转出额** 与 **`entitled`/`claimed`** 一致。  
- **测试**：`cd contracts && forge test --match-contract InvestorDistributionClaim`；有 **`forge`** 时另跑 **`python3 scripts/verify-abi-forge.py`**（与仓内 **`contracts/abi/InvestorDistributionClaim.json`** multiset 一致）。  
- **备注**：DApp 若需前端调用，再 **`cp contracts/abi/InvestorDistributionClaim.json` → `frontend/dapp/abis/`** 并视 **55-S13** 扩展；当前 **未**强制入 **`check-55-s13`** 列表。  

---

### TT-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER-RULE-001

- **阶段**：收益 / 未决分红快照与转让（B-088）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/db/investor_distribution.rs`（常量 **`B088_*`** / **`SNAPSHOT_*`**）、`crates/api/src/db/investor_share.rs`（**`b088_*`** 单测）、`crates/api/src/routes/investor_distribution.rs`（**`snapshot_binding`** JSON）、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **单一冻结时点**：应计 **`POST …/internal/investor-distribution-accrual`** 的 **`snapshot_block_number`** 为 **含块**上界；**`Transfer`** 重放**钉死** **`investor_share_transfer_events`** 中 **`block_number <= snapshot_block_number`**（与 SQL **`ORDER BY block_number ASC, log_index ASC`** 一致）。  
  2. **交易顺序**：同块内按 **`log_index ASC`**（与上式一致）。  
  3. **机读契约**：**`GET …/governance/investor-distribution-accruals`**（列表项与 **`distribution_id`** 单条）及 **POST 首次成功 200** 含 **`snapshot_binding`**：**`anchor`****=`B-088-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER`**、**`snapshot_block_binding`****=`inclusive_upto_snapshot_block`**、**`transfer_replay_order`****=`block_number_asc_log_index_asc`**、**`eligibility_projection`****=`investor_share_transfer_events`**，并**并列** **`stake_overlay_*`****/`b088_completion_anchor`**（**`STAKING_ADDRESS`** 未设时质押叠加不生效）、**`lock_overlay_*`****/`b088_lock_completion_anchor`**（**`INVESTOR_LOCK_CONTRACT_ADDRESSES`** 未设时锁仓叠加不生效）。  
  4. **锁仓/质押**：**质押** 可重放投影见 **`TT-COMP-B088-STAKE-LOCK-PROJECTION-001`**（**101**）；**锁仓** 独立投影见 **`TT-COMP-B088-LOCK-VAULT-PROJECTION-001`**（**112**）。  
- **验收（手动）**：同一投影数据下，提高 **`snapshot_block_number`** 前后 **`lines[]`** 与本地按上规则重算 **逐地址一致**。  
- **测试**：`cargo test -p traveltrust-api` **`investor_share::tests::b088_later_block_transfer_excluded_from_snapshot_cutoff`**；`python3 scripts/check-04-routes-vs-code.py`（若仓库启用）。  
- **备注**：与 **B-086** 公式同源；**B-087** 链上 **`registerAccrual`** 须与链下 **`distribution_id`/行表** 运营对齐。  

---

### TT-GOVERNANCE-PARAM-TIMELOCK-EXECUTE-001

- **阶段**：治理 / 参数提案链上 **execute** 路径（B-089 **Partial**）  
- **状态**：已封口（**Partial**：延迟壳 + 演示 **`call`**；**非** 全量 Governor/投票/测试网 E2E 门禁）  
- **本轮仅改**：`contracts/src/GovernanceTimelock.sol`、`contracts/test/GovernanceTimelock.t.sol`、`contracts/abi/GovernanceTimelock.json`、`contracts/script/Deploy.s.sol`、`scripts/sync-abi-from-forge.sh`、`scripts/sync-abi-from-forge.ps1`、`scripts/verify-abi-forge.py`、`contracts/README.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/spec/04-后端与API.md`（49 G 叙述）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`GovernanceTimelock`**：**`admin`** 唯一可 **`schedule(target,value,data,salt)`**；**`id = hashOperation(...)`**；**`executeAfter = block.timestamp + delay`**（**`delay`** 构造注入、**immutable**）。  
  2. **`execute(id)`**：**任意调用方**；须 **`timestamp ≥ executeAfter`**；**`done`** 防重入；**`target.call{value}(data)`** 失败则 **`CallFailed`**。  
  3. **验收用例（Foundry）**：**`schedule(FeeRouter, 0, abi.encodeCall(transferOwnership, (multisig)), salt)`** → **`warp(delay)`** → **`execute`** → **`FeeRouter.owner() == multisig`**。  
  4. **边界**：**`FeeRouter`** **四方/BPS** 热改由 **`setRoutingConfig`**（**`onlyOwner`**，宜 **Timelock**）实现，见 **TT-COMP-B089-FEEROUTER-MUTABLE-ROUTING-001**；**Governor** 全栈仍 **Target**。  
- **验收（手动）**：安装 **Foundry** 后 **`cd contracts && forge test --match-contract GovernanceTimelock`**；测试网 **`forge script …/Deploy.s.sol --broadcast`** 后按需 **`schedule`/`execute`** 验 **`owner`**。  
- **测试**：`cd contracts && forge test --match-contract GovernanceTimelock`；**`python scripts/verify-abi-forge.py`**（**`forge inspect GovernanceTimelock abi`** 与仓内 JSON multiset 一致时）。  
- **备注**：链下 **`POST …/governance/proposals/*/vote`** 仍为 **MVP 信号票**（**B-072**），**不**与本 Timelock 自动耦合；若产品上「提案通过 → 上链 queue」，须另卡接 **indexer/多签** 或 **Governor**。  

---

### TT-GOVERNANCE-TREASURY-SPEND-EXECUTE-001

- **阶段**：治理 / 国库单笔链上支出（B-090 **Partial**）  
- **状态**：已封口（**Partial**：ERC20 **`spend`** + Timelock；**非** 全量提案产品流 / 测试网强制 E2E）  
- **本轮仅改**：`contracts/src/GovernanceTreasury.sol`、`contracts/test/GovernanceTreasury.t.sol`、`contracts/abi/GovernanceTreasury.json`、`contracts/script/Deploy.s.sol`、`scripts/sync-abi-from-forge.sh`、`scripts/sync-abi-from-forge.ps1`、`scripts/verify-abi-forge.py`、`contracts/README.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/spec/04-后端与API.md`（49 G）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`GovernanceTreasury`**：**`spend(token,to,amount)`** **仅 `spender`**；**`owner`** **`setSpender` / `transferOwnership`**。  
  2. **`Deploy.s.sol`**：**`spender` = `GovernanceTimelock`**，使支出须经 **B-089 `schedule` → `execute`**，**calldata** 为 **token/to/amount** 唯一权威（**后端不可改**已排队字节）。  
  3. **验收（Foundry）**：金库预存代币 → **`execute`** 含 **`spend`** → **`token.balanceOf(to)` 增量 = amount**；**非 spender** **`spend`** → **`OnlySpender`**。  
  4. **边界**：**仅 ERC20**；**ETH 余额支出 / 多签 UI / Governor 绑定** **Target**。  
- **验收（手动）**：测试网 **`forge script …/Deploy.s.sol --broadcast`** 后 **`schedule(treasury,0,abi.encodeCall(GovernanceTreasury.spend,(…)),salt)`** → 到期 **`execute`** → 链上读 **`balanceOf`**。  
- **测试**：`cd contracts && forge test --match-contract GovernanceTreasury`；**`python scripts/verify-abi-forge.py`**（有 **forge** 时）。  
- **备注**：**`GET …/governance/pool`** 等仍为展示/链下 **MVP**，**不**自动触发 **`spend`**。  

---

### TT-GOVERNANCE-PROTOCOL-EMERGENCY-PAUSE-001

- **阶段**：治理 / 协议紧急开关（B-091 **Partial**）  
- **状态**：已封口（**Partial**：链上布尔门闸；**非** 提案自动执行 / **meta** 强制同源）  
- **本轮仅改**：`contracts/src/EscrowFactory.sol`、`contracts/src/FeeRouter.sol`、`contracts/test/Escrow.t.sol`、`contracts/test/FeeRouter.t.sol`、`contracts/abi/EscrowFactory.json`、`contracts/abi/FeeRouter.json`、`contracts/script/Deploy.s.sol`、`frontend/dapp/abis/EscrowFactory.json`、`frontend/dapp/abis/FeeRouter.json`、`contracts/README.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/spec/04-后端与API.md`（49 G）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死规则）**：  
  1. **`EscrowFactory`**：构造 **`guardian_`**（**非零**）；**`setFactoryPaused` / `transferGuardian`** **仅 `guardian`**；**`factoryPaused`** 时 **`createEscrow` → `FactoryPaused`**。  
  2. **`FeeRouter`**：**`setDistributePaused(bool)`** **仅 `owner`**；**`distributePaused`** 时 **`distribute` → `DistributePaused`**（**先于** **`amount`** 校验）。  
  3. **在途订单**：**不**改 **Escrow** 实例逻辑；暂停**仅**挡 **新工厂实例** 与 **新 `distribute`**。  
  4. **验收（Foundry）**：**暂停前** **`createEscrow`/`distribute` 成功**；**暂停后** **revert**；**恢复后** **再成功**；**`Escrow.t.sol`**：**已创建** Escrow **pause 期间**仍可 **`deposit`+`release`**。  
- **验收（手动）**：**`cast call`** **`factoryPaused`/`distributePaused`** 与运维 **`set*Paused`** 一致；**`GET /meta.pause`** 与链上对齐 **Target**（另卡/运维）。  
- **测试**：`cd contracts && forge test --match-path test/Escrow.t.sol`；`forge test --match-path test/FeeRouter.t.sol`；**`forge test --match-contract FeeRouter`**（**B-091** 子测）。  
- **备注**：**`Deploy.s.sol`** **`new EscrowFactory(deployer)`** — **破坏变更**（旧 **无参构造** 工厂需迁部署）；**guardian** 可 **`transferGuardian`** 至 **Timelock**。  

---

### TT-GOVERNANCE-VOTE-WEIGHT-DELEGATION-SIGNAL-001

- **阶段**：治理 / 链下投票与委托权重（B-092 **Partial**）  
- **状态**：已封口（**Partial**：**委托图** + **信号票** + **冻结权重**；**质押 / Country Pool 份额** 与链上快照对账 **Target**）  
- **本轮仅改**：`crates/api/src/routes/governance_delegation_store.rs`、`governance_delegate.rs`、`governance_proposals.rs`、`governance_voting_power.rs`、`governance.rs`、`mod.rs`；`frontend/lib/api.ts`、`frontend/lib/apiClient/core.ts`、`frontend/lib/apiClient/governance.ts`、`frontend/lib/apiClient/index.ts`、`frontend/lib/mapOrderWriteError.ts`、`frontend/lib/mapOrderWriteError.test.ts`、`frontend/app/governance/proposals/[id]/page.tsx`、`frontend/locales/en.ts`、`frontend/locales/zh.ts`；`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死）**：  
  1. **SSOT**：**`weight_ssot`****=`delegation_units_v1`** — 可投票账户权重 = **1 +**（**`POST …/delegate`** 图中 **`delegate_to == self`** 的直接委托人数）。  
  2. **`POST …/vote`**：投票当刻计算 **`weight_applied`** 并 **冻结**；**已委托出**（存在 **`delegate_to`**）→ **403** **`delegation_active_cannot_vote`**。  
  3. **信号票**：响应 **`governance_vote.kind`****=`signal_off_chain`**、**`triggers_on_chain_execution:false`**；**不得**单独触发链上资金移动。  
  4. **`GET …/voting-power`**：与上式 **只读对拍**（匿名权重 **`null`**）。  
- **验收**：**`cargo test -p traveltrust-api`** 含 **`vote_forbidden_when_user_has_active_delegation`**、**`delegatee_vote_counts_frozen_weight_in_tally`**；前端提案页展示加权说明、**`my_vote_weight`**、委托错误链至 **`/governance/delegate`**。  
- **测试**：**`cargo test -p traveltrust-api`**（默认）；前端 **`mapOrderWriteError.test`**。  
- **备注**：与 **B-073** 共用 **`governance_delegation_store`**；未来若接 **质押/份额**，须新卡 bump **`weight_ssot`** 或增 **`snapshot_block`** 与链上 **Governor** 对账。  

---

### TT-ESCROW-RELEASE-NORMAL-SPLIT-B093-001

- **阶段**：Escrow / 正常放款分账（B-093 **Partial**）  
- **状态**：已封口（**Partial**：**Completed** 路径 **`release()`**；**80 附录 §2** 其它收平台费终态的**自动**链上分账仍 **Target**）  
- **本轮仅改**：`contracts/src/Escrow.sol`、`contracts/test/Escrow.t.sol`、`contracts/README.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`（**§1.1 Escrow**）、`docs/spec/04-后端与API.md`（**53** ④ **评分与释放**）、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死）**：  
  1. **`release()`**：**`guideAmount = totalAmount * (10000 - platformFeeBps) / 10000`**；**`platformFeeAmount = totalAmount - guideAmount`**（与 **[01 §10](01-总库总览.md)**「**dust 归平台**」一致；**`platformFeeBps`** 于 **`init`** 封存，对应产品 **Paid** 后费率不变，链上锚 **EscrowCreated**）。  
  2. **`init`**：**`platformFeeBps > 10000`** → **`InvalidState`**（防 **`release`** 算术下溢）。  
  3. **验收**：**`Escrow.t.sol`** **`test_B093_release_table_threeFeeRates`**（≥3 组 **bps×total**）+ **`testFuzz_B093_release_conservation`**。  
- **测试**：`cd contracts && forge test --match-contract EscrowTest`（或 CI **Contract ABI Gate** 同源）。  
- **备注**：**`executeResolution`** 仍为显式三腿，**不**在本卡改；**PartiallyRefunded / Slashed** 的按比例平台费须另卡或扩 **`release`** 前评估 **80 附录 §2**。  

---

### TT-ESCROW-EXECUTE-RESOLUTION-B094-001

- **阶段**：Escrow / 争议裁决链上执行与订单终态对齐（B-094 **Partial**）  
- **状态**：已封口（**Partial**：**Foundry** 三模板 + **core** 映射 + 证据；**仅凭 `ResolutionExecuted` 日志细分 `orders_projection`** 为 **Target**）  
- **本轮仅改**：`contracts/test/Escrow.t.sol`、`crates/core/src/escrow.rs`、`crates/core/src/lib.rs`、`crates/api/src/chain_off/reconcile/`（**`projection_tests.rs`** · B-094 相关单测）、`evidence/B-094-execute-resolution-fixtures.md`、`contracts/README.md`、`docs/spec/04-后端与API.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死）**：  
  1. **`executeResolution`**：**`guideAmount + travelerRefund + platformFee == totalAmount`**（合约 **`InvalidState`** 否则 revert）。  
  2. **Foundry**：**`Escrow.t.sol`** **`test_B094_executeResolution_refunded_full_traveler`** / **`…_partially_refunded_split`** / **`…_slashed_guide_zero_platform_fee`** — 断言 **Resolved** + 各地址 **余额差** 与三腿一致。  
  3. **Core**：**`terminal_order_state_from_resolution_amounts`** 与上三模板 + **向导全胜**（`travelerRefund=0`）守恒用例一致。  
  4. **证据**：**`evidence/B-094-execute-resolution-fixtures.md`** 表格式说明；**真实 tx hash** 在 Anvil/网测附录（非单元测硬性）。  
- **验收**：**`forge test --match-contract EscrowTest`** 通过；**`cargo test -p traveltrust-core`**、**`cargo test -p traveltrust-api`**（含 **reconcile** **`b094_resolution_amounts_map_to_product_terminals`**）通过。  
- **测试**：`cd contracts && forge test --match-test test_B094_`；`cargo test -p traveltrust-core`；`cargo test -p traveltrust-api`。  
- **备注**：**`chain_off`** **`apply_escrow_event_kind_to_order_state("ResolutionExecuted")`** 仍为 **Completed**；执行器回填 **Refunded / PartiallyRefunded / Slashed** 须 **calldata** 或 outbox，见 **04** 争议节。  

---

### TT-ORDERS-SPLIT-ADDRESSES-SSOT-B095-001

- **阶段**：订单详情 / Escrow 分账地址与链配置同源（B-095）  
- **状态**：已封口  
- **本轮仅改**：`crates/api/src/chain/mod.rs`、`crates/api/src/routes/health_meta.rs`、`crates/api/src/chain_off/orders.rs`、`crates/api/src/routes/orders/mod.rs`、`crates/api/src/routes/admin.rs`、`crates/api/src/chain_off/tests_events_itinerary.rs`、`docs/spec/04-后端与API.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死）**：  
  1. **`ChainConfig::escrow_platform_fee_recipient`**：与 **`GET /meta` `chain.contracts.escrow_platform_fee_recipient`** 同源（**`FEE_ROUTER_ADDRESS`** 修剪非空）。  
  2. **`order_split_addresses_ssot`**：**`guide_receive_address`** ← **`guides.wallet_address`**；**`platform_fee_recipient`** ← 上式；**`region_vault_address`**、**`registry_address`** ← **`ChainConfig`**；注入 **`GET /api/v1/orders/:id`** 与 **`GET /api/v1/admin/orders/:id`** 的 **`order.split_addresses_ssot`**。  
  3. **禁止** 由订单 **POST body** 覆写上述对象（本卡不新增覆写字段）。  
- **验收**：**`cargo test -p traveltrust-api`** 通过；单测 **`b095_split_addresses_match_chain_config_and_meta_escrow_platform_fee_recipient`**。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：前端 **`createEscrow`** 仍须 **`requirePlatformFeeRecipient`** 与 **`/meta`** 对齐；本响应块便于详情页与链上参数 **对读**，非替代 EIP-712 / 签名域。  

---

### TT-COMP-B088-STAKE-LOCK-PROJECTION-001

- **阶段**：投资人分红快照补齐（**B-088** **Completion**：**质押** 可重放投影）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：`crates/api/migrations/20260422000051_investor_stake_state_events.sql`、`crates/api/src/db/investor_stake.rs`、`crates/api/src/chain/indexer/`（**`fetch_staking_state_logs`**）、`crates/api/src/routes/internal.rs`（**tick**/**reorg**）、`crates/api/src/routes/investor_distribution.rs`、`crates/api/src/db/investor_distribution.rs`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死）**：**写死 SSOT**=**`contracts/src/Staking.sol`** 事件 **`Staked` / `Withdrawn` / `Slashed`** → 表 **`investor_stake_state_events`**；**`POST …/internal/indexer-tick`** 在 **`STAKING_ADDRESS`** + **`DATABASE_URL`** 时写入；**`POST …/internal/investor-distribution-accrual`** 在 **`chain_config.staking_address`** 非空时将 **`stakeOf`** 重放叠加到 **`Transfer`** 重放余额并 **剔除** 质押合约地址，**`Σ` 持有人** 须等于 **`Transfer`****supply**（否则 **`b088_stake_overlay_supply_mismatch`**）；**`indexer-reorg-rewind`** 同步删尾该表。  
- **验收**：**`cargo test -p traveltrust-api`**：**`comp_b088_overlay_restores_holder_weight_after_stake_to_contract`** 等。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：与 **`TT-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER-RULE-001`** 正交；**锁仓** 见 **112** **`TT-COMP-B088-LOCK-VAULT-PROJECTION-001`**；**Country Pool 份额** 勿混本卡。  

---

### TT-COMP-B088-LOCK-VAULT-PROJECTION-001

- **阶段**：投资人分红快照补齐（**B-088** **Completion**：**锁仓** 可重放投影）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：`crates/api/migrations/20260423000052_investor_lock_state_events.sql`、`crates/api/src/db/investor_lock.rs`、`crates/api/src/chain/mod.rs`（**`INVESTOR_LOCK_CONTRACT_ADDRESSES`**）、`crates/api/src/chain/indexer/`（**`fetch_investor_lock_state_logs`** / topic0 单测）、`crates/api/src/routes/internal.rs`（**tick**/**reorg**）、`crates/api/src/routes/investor_distribution.rs`、`crates/api/src/db/investor_distribution.rs`、`contracts/src/InvestorShareLockLedger.sol`、`contracts/test/InvestorShareLockLedger.t.sol`、`.env.example`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、本索引  
- **禁止再分析**：—  
- **任务（钉死）**：**写死 SSOT**=**`contracts/src/InvestorShareLockLedger.sol`** 事件 **`Locked` / `Unlocked`**（**`Locked(address,uint256)`** / **`Unlocked(address,uint256)`** topic 与 **`indexer::LOCKED_TOPIC0` / `UNLOCKED_TOPIC0`** 一致）→ 表 **`investor_lock_state_events`**；**`POST …/internal/indexer-tick`** 在 **`INVESTOR_LOCK_CONTRACT_ADDRESSES`** + **`DATABASE_URL`** 时对各地址 **`eth_getLogs`** 写入；**`POST …/internal/investor-distribution-accrual`** 在 **`chain_config.investor_lock_contract_addresses`** 非空时于 **质押 overlay**（若启用）**之后** 按地址顺序叠 **`merge_transfer_balances_with_lock_overlay`**，每步后 **持有人 `Σ` = `Transfer`****supply**，否则 **`b088_lock_overlay_supply_mismatch`**；**`indexer-reorg-rewind`** / tick 自动回滚 同源 **`delete_investor_lock_state_events_from_block`**；**`snapshot_binding`** 并列 **`lock_overlay_*`****/`b088_lock_completion_anchor`**。  
- **验收**：**`cargo test -p traveltrust-api`**：**`investor_lock::tests::comp_b088_lock_overlay_attributes_locked_to_user`**、**`indexer::tests::lock_ledger_event_topic0s_keccak`**；**`cd contracts && forge test --match-contract InvestorShareLockLedgerTest`**。  
- **测试**：**`cargo test -p traveltrust-api`**；**`forge test`**（上式）。  
- **备注**：与 **101** 质押 overlay **顺序固定**（先 stake 后 lock）；多锁仓地址 **顺序敏感**（与配置列表一致）。  

---

### TT-COMP-B089-FEEROUTER-MUTABLE-ROUTING-001

- **阶段**：治理参数链上落地补齐（**B-089** **Target**：**FeeRouter** **四方/BPS** 热改）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：**`contracts/src/FeeRouter.sol`**、**`contracts/test/FeeRouter.t.sol`**、**`contracts/test/GovernanceTimelock.t.sol`**、**`contracts/abi/FeeRouter.json`**、**`frontend/dapp/abis/FeeRouter.json`**、**`docs/spec/14-合约-API-ABI-前后端对齐.md`**（§1.1 **FeeRouter**）、**`contracts/README.md`**、本索引一览与正文  
- **禁止再分析**：—  
- **任务（钉死）**：**`onlyOwner`** **`setRoutingConfig`**（四方 **非零地址** + 四路 BPS **和=10000**）；**`BPS_COUNTRY` 等** 保持 **只读函数名** 与历史 ABI 一致；**Timelock** **`schedule`→`execute`** 后 **`countryBucket`/`global*`/`BPS_*()`** 与 **calldata** 一致（**`test_COMP_B089_timelock_execute_set_routing_config`**）。  
- **验收**：**`forge test --match-contract FeeRouterTest`**、**`forge test --match-contract GovernanceTimelockTest`** 通过。  
- **测试**：`cd contracts && forge test --match-contract 'FeeRouterTest|GovernanceTimelockTest'`。  
- **备注**：**迁址新 Router** 仍须 **Runbook §7.1** **`Escrow.platformFeeRecipient`**；**Governor** 全栈仍 **Target**。  

---

### TT-COMP-B090-TREASURY-NATIVE-SPEND-001

- **阶段**：治理金库补齐（**B-090** **Target**：**ETH 原生**支出）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：**`contracts/src/GovernanceTreasury.sol`**、**`contracts/test/GovernanceTreasury.t.sol`**、**`contracts/abi/GovernanceTreasury.json`**、**`contracts/README.md`**、本索引一览与正文  
- **禁止再分析**：—  
- **任务（钉死）**：**`receive` + `spendETH(to,amount)`**（或等价 **单笔原生转出**），调用方 **仍仅 `spender`**（Timelock）。  
- **验收**：Foundry：Timelock **`execute` → `spendETH`** 后收款 **EOA 余额增量** = payload（wei）（**`test_COMP_B090_timelock_execute_spendETH_matches_payload`**）。  
- **测试**：**`forge test --match-contract GovernanceTreasuryTest`**。  
- **备注**：链上提案 UI 见 **111** **`TT-COMP-B090-ONCHAIN-PROPOSAL-UI-001`**；**`spend` ERC20** + Timelock E2E 不重做（沿用 **`test_b090_timelock_execute_spend_matches_payload`**）。  

---

### TT-COMP-B090-ONCHAIN-PROPOSAL-UI-001

- **阶段**：治理 / **链上提案 UI**（**B-090** 母表 **Target** 收口：**国库支出**叙事与 **Governor·Timelock** 路径可读性）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：**`frontend/app/governance/proposals/page.tsx`**、**`frontend/app/governance/proposals/[id]/page.tsx`**、**`frontend/components/governance/GovernanceB090OnChainProposalNotice.tsx`**、**`frontend/lib/governanceChainMeta.ts`**、**`frontend/lib/apiClient/governance.ts`**（提案详情扩展字段）；**`frontend/locales/zh.ts`** / **`en.ts`**；本索引一览 **111** 与正文；**`docs/任务母表.md`**（B-090 / Completion 表 / 映射 / 101～112）；**`docs/spec/04-后端与API.md`**（治理提案页契约句）  
- **禁止再分析**：—  
- **任务（钉死）**：在 **Governor 索引模式**（**`GET …/governance/proposals`** **`data_source`****=`governance_proposals_projection`**）下，列表页展示 **链上索引 + 表决/国库路径** 说明，并 **可选** 拉 **`GET /meta`** 展示 **`chain.contracts.governor_address`**（无则提示未配置，**禁止**填假地址）。详情页在 **`governance_vote.kind`****=`on_chain_governor`** 时展示 API 已返回的 **`proposal.proposer`****、****`snapshot_block`****、****`vote_start_block`****、****`vote_end_block`****、****`operation_id`**（与投影一致）及 **Treasury `spend`****/****`spendETH`****+****Timelock** 说明；**不**新增链下「代投」或伪造计票。  
- **验收**：**`npm run lint`**（`frontend/`）通过；**`npm run test:i18n:ci`** 通过（新增文案键）。  
- **测试**：**`cd frontend && npm run lint`**；**`npm run test:i18n:ci`**。  
- **备注**：与 **109** Governor 详情 **`castVote` calldata** 块并存；**不**在本卡生成 **Timelock.execute** 假 calldata。  

---

### TT-COMP-B091-META-PAUSE-CHAIN-READ-001

- **阶段**：紧急开关可观测性补齐（**B-091** **Target**：**`meta.pause` 自动读链**）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：**`crates/api/src/routes/health_meta.rs`**（**`PAUSE_META_TOP_KEYS`** 扩 **`factory_paused` / `distribute_paused` / `chain_pause_read`**）+ **`comp_b091_meta_pause_chain_eth_call_matches_mock_fixture`** 等单测；本索引一览与正文；**`docs/任务母表.md`**（B-091 / Completion 行）  
- **禁止再分析**：—  
- **任务（钉死）**：在 **`CHAIN_RPC_URL`** 与合约地址可用时，**`GET /meta`** **`pause`** 反映 **`EscrowFactory.factoryPaused`**、**`FeeRouter.distributePaused`** 的 **`eth_call`**；**无链 / 地址未设** 时 **`null`** + **`chain_pause_read.status`**（**`chain_unavailable` / `chain_pause_targets_unset` / `eth_call` / `eth_call_error`**），**禁止**伪造链上真值；**`protocol-reference`** 仍为文档镜像，与 **`pause.chain_pause_read.rule`** 互文区分。  
- **验收**：**`cargo test -p traveltrust-api`**：`health_meta` + **`comp_b091_*`**。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：前端 **`readProtocolPauseFromMeta`** 可消费 **`pause.factory_paused` / `pause.distribute_paused`**；另开微 TT 若需 UI 文案。Foundry **`factoryPaused`/`distributePaused`** 不重做。  

---

### TT-COMP-B092-VOTE-WEIGHT-STAKE-SNAPSHOT-001

- **阶段**：治理投票权重补齐（**B-092** **Target**：**质押** / 份额链上快照；本卡先钉 **质押** **≤1** 点）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：**`crates/api/src/routes/governance_voting_power.rs`**、**`crates/api/src/db/users_sessions/`**（**`get_user_default_wallet_by_id`**，见 **`core.rs`**）；本索引一览与正文；**`docs/任务母表.md`**；**`docs/spec/04-后端与API.md`**（**`GET …/voting-power`** 契约句）  
- **禁止再分析**：—  
- **任务（钉死）**：**写死** **`governance_voting_power`**：**`?snapshot_block=`** 且 **CHAIN_RPC_URL + STAKING_ADDRESS + `users.default_wallet_address`（或 chain_off 内存用户钱包）** 可用时 **`eth_call`** **`Staking.stakeOf(address)`**；响应 **`stake_snapshot`**（含 **`reconcile.delegation_units_mvp`** 与链上 **`stake_u256_hex`** 并列）；**`governance_proposals` 计票** 仍 **仅** **`delegation_units_v1`**（**不改**）。  
- **验收**：**`cargo test -p traveltrust-api`** **`comp_b092_*`**。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：**Country Pool 份额** 快照见 **110** **`TT-COMP-B092-COUNTRY-POOL-SNAPSHOT-001`**；**统一单一权重公式** → **母表 B-098**、**TT-GOVERNANCE-VOTE-WEIGHT-UNIFIED-FORMULA-001（115）**（**已封口**）。  

---

### TT-COMP-B092-COUNTRY-POOL-SNAPSHOT-001

- **阶段**：治理投票权重补齐（**B-092** **Target**：**Country Pool / 份额 ERC20** 与链上 **`balanceOf`** 快照对账；与 **105** 正交）  
- **状态**：已封口（**Completion**）  
- **本轮仅改**：**`crates/api/src/routes/governance_voting_power.rs`**（**`country_pool_share_snapshot`** + **`eth_call`** 复用）；本索引一览 **110** 与正文；**`docs/任务母表.md`**（B-092 / Completion 表）；**`docs/spec/04-后端与API.md`**（**`GET …/voting-power`** 契约句）  
- **禁止再分析**：—  
- **任务（钉死）**：在 **`GET /api/v1/governance/voting-power`** 响应中增加 **`country_pool_share_snapshot`**：**`?snapshot_block=<u64>`** 且 **CHAIN_RPC_URL** 可用、**`ChainConfig.investor_share_token_addresses`**（**`INVESTOR_SHARE_TOKEN_ADDRESSES`**，与 **B-085** **`indexer-tick`** 同源）非空、用户 **`default_wallet_address`** 可用时，对 **列表内每一 ERC20** **`eth_call`** **`balanceOf(address)`**（历史块 **= `snapshot_block`**）；**`tokens[]`** 逐项 **`token_address` / `balance_u256_hex` / `read_status` / `error`**；根 **`read_status`****=`ok`****/**`partial`****/**`eth_call_error_all`****/**`skipped_*`**；**`reconcile.delegation_units_mvp`** 与 **`stake_snapshot`** **并列**；**`POST …/governance/proposals/:id/vote` 计票** 仍 **仅** **`delegation_units_v1`**（**不改**）。  
- **验收**：**`cargo test -p traveltrust-api`**：**`comp_b092_country_pool_*`**、**`b092_selector_balance_of_address`**；既有 **`comp_b092_http_voting_power_includes_stake_snapshot_ok`** 增补 **`country_pool_share_snapshot`** **skip** 断言。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：**禁止**用占位余额替代 **`eth_call`** 真值；多代币时 **顺序** 与配置列表一致。  

---

### TT-COMP-B093-ESCROW-APPENDIX-AUTO-SPLIT-001

- **阶段**：Escrow 正常放款补齐（**B-093** **Target**：**80 附录 02** 非 **Completed**、仍 **收平台费** 终态的 **自动链上分账**）  
- **状态**：已封口 · **Completion**（不重做 **`release()`** **01 §10** 表驱动 + fuzz）  
- **本轮落地**：**`Escrow.releasePartialRefund`** + **`PartialRefundExecuted`** + **`Status.PartiallyRefunded`**；**`Escrow.t.sol`** **`test_COMP_B093_*`**；**`contracts/abi` + `frontend/dapp/abis` `Escrow.json`**；**`traveltrust-api`** topic0 / 投影 / **`get_escrow_status` 7** / **`event_log` 回放列表**；**04 §3.4** / **14 §1.1** 契约句  
- **禁止再分析**：—  
- **任务（钉死）**：为 **附录 02 已钉死的一种终态** 增加 **单一链上出口**（新函数或受控 **`release` 变体**），**`platformFeeBps`** **仍仅** **`EscrowCreated` 封存**；**三腿守恒 + dust** 与 **01/80** 一致。  
- **验收**：Foundry：**1～2** 表驱动用例。  
- **测试**：**`forge test --match-contract EscrowTest`**（或 **`--match-test`** **`COMP_B093`**）；**`cargo test -p traveltrust-api`**。  
- **备注**：**争议路径** 仍以 **`executeResolution`** 为主；**Slashed** 非争议 **单出口** 见 **108** **`TT-COMP-B093-ESCROW-SLASHED-NON-DISPUTE-001`**。  

---

### TT-COMP-B093-ESCROW-SLASHED-NON-DISPUTE-001

- **阶段**：Escrow / **80 附录 02 · Slashed** 非争议自动分账（**B-093** **Completion**，与 **106** 正交）  
- **状态**：已封口（**Completion**）  
- **本轮落地**：**`Escrow.releaseSlashed`** + **`Status.Slashed`**（**取值 `8`**）+ **`SlashedExecuted`**（与 **`PartialRefundExecuted`** 同形五字段，**`guideAmount` = `0`**）；**`Escrow.t.sol`** **`test_COMP_B093_releaseSlashed_*`**；**`contracts/abi` + `frontend/dapp/abis` `Escrow.json`**；**`traveltrust-api`** **`event_name_from_topic0`** / **`apply_escrow_event_kind_to_order_state`** / **`orders_projection`** / **`get_escrow_status` 8** / **`event_log` 列表**；**04 §7.4** / **14 §1.1** 契约句  
- **禁止再分析**：—  
- **任务（钉死）**：自 **`Funded`** **单一出口**：**`travelerRefund < totalAmount`** 时 **`platformFeeAmount = totalAmount - travelerRefund`** 转 **`platformFeeRecipient`**，**`guideAmount` 钉死 `0`**；**`travelerRefund == totalAmount`** 须走 **`refund()`**（附录 **Refunded** 不收平台费）；**守恒** **`travelerRefund + platformFeeAmount == totalAmount`**。  
- **验收**：Foundry：**表驱动** **`test_COMP_B093_releaseSlashed_non_dispute_table_twoTemplates`** + **`revert`** 用例；**`cargo test -p traveltrust-api`**：**`maps_slashed_executed_topic`** 等。  
- **测试**：**`forge test --match-test COMP_B093_releaseSlashed`**（或全量 **`EscrowTest`**）；**`cargo test -p traveltrust-api`**。  
- **备注**：与 **`executeResolution`** 扣罚模板（**B-094**）**并存**；链上 **两种** **Slashed** 来源（争议 / 非争议）投影均为订单域 **`slashed`**。  

---

### TT-COMP-B089-GOVERNOR-CHAIN-VOTING-001

- **阶段**：治理 / **Governor 链上投票**（**B-089** **Completion**，与 **102** **FeeRouter 热改** 正交）  
- **状态**：已封口（**Completion**）  
- **本轮落地**：**`GovernanceVotesToken.sol`**（**`getPastVotes` / `getPastTotalSupply`**）；**`TravelTrustGovernor.sol`**（**`propose` / `castVote` / `state` / `quorumReached` / `queue` / `execute`**；**Pending→Active→Succeeded/Defeated→Queued→Executed**）；**`GovernanceTimelock`** **`setGovernor` + `scheduleByGovernor`**；**`TravelTrustGovernor.t.sol`** **`test_COMP_B089_governor_*`**；**`contracts/abi/GovernanceTimelock.json`** 增补；**`governance_proposals_projection`** 表 + **`apply_governance_projection_from_parsed_event`**；**`indexer-tick`** 拉 **`GOVERNOR_ADDRESS`** 日志；**`replay_governance_proposals_from_event_log`** + **reorg rewind** 删表重放；**`crates/api/src/chain/governor.rs`** **`eth_call`**；**`governance_proposals.rs`** **Governor 模式**；**`GET /meta` `chain.contracts`** **759** 扩 **12 键**（**`governor_address`****/****`governance_votes_token_address`**）；**前端** **`/governance/proposals/[id]`** 链上 **calldata** 展示；**04 / 14** 契约句  
- **禁止再分析**：—  
- **任务（钉死）**：**`GOVERNOR_ADDRESS` + `DATABASE_URL`** 时 **禁止** 对 **`POST …/governance/proposals/:id/vote`** 写服务器假票；**计票** 以 **`VoteCast`** 索引为准；**详情** 须 **`eth_call` `state(uint256)`** 与 **`GovernanceVotesToken.getPastVotes(user,snapshot)`**（设 **`GOVERNANCE_VOTES_TOKEN_ADDRESS`** 且用户有 **`default_wallet_address`**）对拍展示。  
- **验收**：**`forge test --match-contract TravelTrustGovernorTest`**（环境有 Foundry 时）；**`cargo test -p traveltrust-api`**。  
- **测试**：同上。  
- **备注**：与 **B-092** 链下 **信号票** **并存**：未配 **`GOVERNOR_ADDRESS`** 时仍走 **MVP** **`chain_off_mvp`**。  

---

### TT-COMP-B094-INDEXER-RESOLUTION-TERMINAL-STATE-001

- **阶段**：争议执行投影补齐（**B-094** **Target**：仅凭日志时 **Completed**；**有三腿** 时细分终态）  
- **状态**：已封口 · **Completion**（不重做 Foundry **`test_B094_*`**、**`terminal_order_state_from_resolution_amounts`**）  
- **本轮落地**：**SSOT** = 事件同源交易 **`eth_getTransactionByHash`** → 解码 **`executeResolution(bytes32,bytes32,uint256,uint256,uint256)`** **`input`**；**`crates/api/src/chain/resolution_tx.rs`** + **`indexer-tick`** / **`replay_orders_projection_from_event_log`**（**`event_log.tx_hash`**）  
- **禁止再分析**：—  
- **任务（钉死）**：当能解析 **`executeResolution` 三腿** 时，调用 **`terminal_order_state_from_resolution_amounts`** 写 **`orders_projection`（或等价行）**；**无三腿来源** 时保持 **`ResolutionExecuted` → Completed** 行为。  
- **验收**：**`cargo test -p traveltrust-api`**：**三模板** 投影终态为 **Refunded / PartiallyRefunded / Slashed**；缺三腿时与现网一致。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：与 **04** 争议节一致；执行器 outbox 仍为裁决排队真源，投影以链上 **`input`** 为金额 SSOT。  

---

### TT-RESOLUTION-OUTBOX-E2E-CHAIN-001

- **去重类型**：**EXTEND**（承接 **母表 B-094**「执行器 outbox 终态 + 投影」；**非 DUPLICATE**）  
- **阶段**：主链 / 争议执行 **P0**（**Wave · 执行器闭环**）  
- **状态**：已封口  
- **母表**：**B-096**  
- **任务**：在 **链与执行器配置可用** 的前提下，补齐 **可重复验收** 的 **端到端**：**争议 resolve → `resolution_outbox` 入队 → `POST /api/v1/internal/process-resolution-outbox` 消费一条 → 链上 `executeResolution` 成功 → `indexer-tick` 或 `indexer-replay` 后 `orders_projection` 细终态与三腿一致**；响应体须可追踪 **`tx_hash`** 或 **`request_id`**。  
- **本轮仅改**（执行时钉死，示例）：**`crates/api/src/routes/internal.rs`**（**`process_resolution_outbox`**）、**`crates/api/src/chain_off/disputes/`**（**`resolve.rs`****/**`resolution.rs`** 等）、**`crates/api/src/chain/outbox.rs`**、**与 outbox 消费路径直接相关的单测/fixture**；**不** 改 **已封口** **TT-COMP-B094-INDEXER-RESOLUTION-TERMINAL-STATE-001（107）** 的解析逻辑，除非 **107** 显式缺陷修复单开复核。  
- **禁止再分析**：全站争议 UI 重扫；**Docker / CI / 镜像发布**；与 **107** 无关的 indexer 大重构。  
- **验收**：**至少一条** 自动化或半自动化用例（**Anvil/分叉网 + DB**）：**outbox 非空 → POST internal → receipt 成功 → 投影行 `status` 与解析三腿一致**；文档或 **`evidence/`** 片段记录 **tx_hash + order_id**。  
- **测试**：**`cargo test -p traveltrust-api`** 新增/扩展用例（命名建议 **`resolution_outbox_e2e_*`** 或执行时钉死）；Foundry **不** 重跑 **B-094** 三模板替代本卡。  
- **与已有 TT 的边界说明**：**TT-COMP-B094-107（已封口）** 只管 **`eth_getTransactionByHash` / calldata → `terminal_order_state_from_resolution_amounts` → 投影**；**本卡** 只管 **outbox 队列被 internal 消费并实际上链**。**TT-ESCROW-EXECUTE-RESOLUTION-B094-001（已封口）** 管 **合约模板 + core 映射**。**禁止** 重开封口卡改验收句。  

---

### TT-ORDERS-PROJECTION-TERMINAL-API-UX-001

- **去重类型**：**NEW**（母表/索引 **无** 同等「**GET order 暴露投影细终态 + 用户徽章以投影为准**」的已封口 TT；**B-066** 为 **争议金额块**，**不** 覆盖本卡。）  
- **阶段**：订单语义 / indexer 一致性 **用户面** **P0**（**Wave A**）  
- **状态**：已封口  
- **母表**：**B-097**  
- **任务**：**`GET /api/v1/orders/:id`** 在存在 **`orders_projection`** 时返回 **`projection_terminal`**（或嵌套对象，**字段名以 04 登记为准**）：**`status`**、**`resolution_type`**（可选）、与投影表一致；**`/orders` 列表**与 **`/escrow/[id]`** 主状态徽章 **以投影细终态为准**；当 **`orders.state`** 与投影 **不一致** 时展示 **`orders_projection_ssot_notice_*`**（i18n），对齐 **docs/verification-evidence-pack.md** **第 1.2 节** SSOT 叙述之中文产品化。  
- **本轮仅改**（执行时钉死，示例）：**`crates/api/src/routes/orders`**、**`frontend/lib/apiClient`**（订单类型）、**`frontend/app/orders`**、**`frontend/components/escrow`** 中与 **订单状态展示** 相关块、**`frontend/lib/orderStatusI18n`**、**`frontend/locales/zh.ts` / `en.ts`**；**`docs/spec/04-后端与API.md`** **订单 API 契约句**（若增 **`projection_terminal`** 等字段）。  
- **禁止再分析**：**indexer-tick** 解析规则重扫；**已封口** **107** 正文重写；**Docker / CI**。  
- **验收**：**fixture**（或 seed SQL）构造 **业务表 `escrowed` + 投影 `partially_refunded`（或等价分歧）**：**GET JSON** 含 **`projection_terminal`**；**列表/托管** 徽章与 **GET** 一致且 **notice** 可见。  
- **测试**：**`cargo test -p traveltrust-api`**（订单序列化/路由单测，若有）；**`cd frontend && npm run lint`** + **`npx tsc --noEmit`** + **`npm run test:i18n:ci`**（新增键时）。  
- **与已有 TT 的边界说明**：**107** **不** 要求 API/前端暴露投影行；**本卡** **只** 做 **读路径与 UI**，**不** 改 **`orders_projection` 写入规则**。**B-095** 分账地址 SSOT **正交**。  

---

### TT-GOVERNANCE-VOTE-WEIGHT-UNIFIED-FORMULA-001

- **去重类型**：**EXTEND**（承接 **母表 B-092** 剩余 **「统一单一链上权重公式」**；**非 DUPLICATE** 于 **TT-COMP-B092-105/110**）  
- **阶段**：治理 **P1**  
- **状态**：已封口  
- **母表**：**B-098**  
- **任务**：在 **04 / 14** 钉死 **单一标量公式** **`W = f(stake_snapshot, country_pool_share_snapshot, delegation_units_v1, …)`**（仅包含已落地字段，**实现时列举闭包**）；**`GET /api/v1/governance/voting-power`** 暴露与 **`W`** 一致的 **`total_weight_units`**（或**新增** **`unified_weight_units`**，**以 04 为准**），并与 **`GovernanceVotesToken.getPastVotes(default_wallet, snapshot_block)`**（配置齐全时）**数值对拍**；**04** 明示 **`POST …/vote` 信号票** 与 **链上 Governor 计票** **不混用**。  
- **封口注（与实现对齐）**：链上 SSOT 以 **14 §1.1.0** 为准：**f(wallet,B)=GovernanceVotesToken.getPastVotes(wallet,B)**；API 并列 **`on_chain_vote_weight`**、根级 **`unified_on_chain_vote_weight_u256_dec`**、**`reconcile.mvp_numeric_equal_to_chain_votes`**；**105/110** 观测块保留。  
- **本轮仅改**（执行时钉死，示例）：**`docs/spec/04-后端与API.md`**、**`docs/spec/14-合约-API-ABI-前后端对齐.md`**（公式与字段）、**`crates/api/src/routes/governance_voting_power.rs`**、**配套 `cargo test`**；**前端** **`/governance/proposals/[id]`** 仅当已展示权重且与本字段相关时 **同步文案/绑定**（**窄改**）。  
- **禁止再分析**：**105/110** 已封口逻辑 **重写成新卡**；**Governor 计票改为全链下**；**Docker / CI**。  
- **验收**：**fixture / Anvil**：同一 **`snapshot_block`**、同一钱包下 **`GET voting-power` 的标量** = **`getPastVotes`**（**允许 1 wei 舍入**，须在 spec 写死）；**`cargo test -p traveltrust-api`** **`comp_b092_unified_weight_*`**（或执行时钉死前缀，**避免** **`b088_*`** 命名混淆）。  
- **测试**：**`cargo test -p traveltrust-api`**；可选 **手动 Anvil** 对拍记录入 **`docs/verification-evidence/`**（**非** 本卡强制）。  
- **与已有 TT 的边界说明**：**TT-COMP-B092-VOTE-WEIGHT-STAKE-SNAPSHOT-001（105）**、**TT-COMP-B092-COUNTRY-POOL-SNAPSHOT-001（110）** **已封口**：保留 **`stake_snapshot` / `country_pool_share_snapshot` 并列块**；**本卡** **叠加** **单一合成标量** 与 **链上 `getPastVotes` 对拍**，**不** 删除 **105/110** 字段。**TT-GOVERNANCE-VOTE-WEIGHT-DELEGATION-SIGNAL-001（97）** 计票路径 **默认不变**。  

---

### TT-DOC-BACKLOG-INDEX-LEDGER-DRIFT-EXTEND-001

- **去重类型**：**EXTEND**（**DUPLICATE**：无；与 **TT-115/B-098** **非** 重复交付，本卡仅 **修正母表+索引表述** 与已落地 **spec/实现** 对齐）  
- **阶段**：文档 / Backlog 台账  
- **状态**：已封口  
- **母表**：**—**（跨 **B-074、B-075、B-080、B-098** 及索引 **99**）  
- **任务**：在 **不改代码**、**不新增业务能力**、**不重写其它已封口 `###` 长正文** 前提下：① **母表 B-098「描述」** 与 **14 §1.1.0**、**TT-115 `封口注`** 一致（链上 SSOT = **`getPastVotes`**；**105/110/委托** 为并列/链下）；② **索引一览 99** 摘要 **去除「投影细分仍 Target」陈旧语义**，显式指向 **107** **已封口**；③ **母表 B-074/B-075** 补 **`✅` + 反引号** 与邻行一致；④ **母表 B-080** **`状态`/`是否已转 TT`** 列与 **「已做 | ✅ \`TT-…\`」** 格式对齐。  
- **本轮仅改**：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 99/116** + 本 **`###`**；**禁止** 展开改写 **TT-115** 历史 **任务** 长段，**以该卡既有 `封口注` 为真**）。  
- **禁止再分析**：spec **07/00** 版本三线；**cargo/npm**；**重开 107/115 验收**。  
- **验收**：**人工通读**：母表 **B-098** 无「合约内组合 stake+份额+委托为 **getPastVotes**」歧义；一览 **99** 不与 **107** 冲突；**B-074/B-075/B-080** 三行 **`✅`** 与 **Phase 1** 邻行一致；本 **`###`** 与 **一览 116** 互指。  
- **测试**：无（纯文档）。  
- **备注**：后续若 **TT-115 `###` `任务`** 与 **封口注** 合并，须 **单开新文档卡**，**不** 在本卡范围默认重扫全文。  

---

### TT-DOC-MOD-BATCH1-INTERNAL-TESTS-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B1-02**）  
- **阶段**：api / **程序级模块化治理 / Batch-1**  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/internal/tests/`**（**`suite_early` / `suite_late` / `support`**）+ **`internal/mod.rs`** **`#[cfg(test)] mod tests`** — 与 **聊天编号 TT-MOD-B1-02** 同范围。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 179** + 本节）；**禁止** 借机改 **`crates/**`** 路由行为。  
- **禁止再分析**：**B-147～** Execution Batch；**internal** 业务 handler 重排。  
- **验收**：母表 **B-163**、索引 **一览 179**、本节 **互指**；路径 **`internal/tests/`** 可定位。  
- **测试**：**`cargo test -p traveltrust-api`**（**非**本登记轮强制；**结构已合入** 时以仓库现状为准）。  

---

### TT-DOC-MOD-BATCH1-HEALTH-META-TESTS-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B1-03**）  
- **阶段**：api / **程序级模块化治理 / Batch-1**  
- **状态**：已封口（**文档登记**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/health_meta/tests.rs`** + **`health_meta/mod.rs`** **`#[cfg(test)] mod tests`** — 与 **TT-MOD-B1-03** 同范围。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 180** + 本节）。  
- **禁止再分析**：**`/meta`** 契约扩面；**07/04** 三线 bump。  
- **验收**：母表 **B-163**、索引 **一览 180**、本节 **互指**。  
- **测试**：同 **179**（可选 **`cargo test -p traveltrust-api`**）。  

---

### TT-DOC-MOD-BATCH1-ADMIN-TESTS-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B1-05**）  
- **阶段**：api / **程序级模块化治理 / Batch-1**  
- **状态**：已封口（**文档登记**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/admin/tests.rs`** + **`admin/mod.rs`** **`#[cfg(test)] mod tests`** — 与 **TT-MOD-B1-05** 同范围。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 181** + 本节）。  
- **禁止再分析**：**admin** 生产 handler 收口；**B-112** 台账重扫。  
- **验收**：母表 **B-163**、索引 **一览 181**、本节 **互指**。  
- **测试**：同 **179**（可选 **`cargo test -p traveltrust-api`**）。  

---

### TT-DOC-MOD-BATCH1-SCRIPTS-INDEX-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B1-06**）  
- **阶段**：scripts / **程序级模块化治理 / Batch-1**  
- **状态**：已封口（**文档登记**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`scripts/INDEX.md`**（**gates / ops / dev** 薄索引）+ **`scripts/README.md`** 互指 — 与 **TT-MOD-B1-06** 同范围；**不**改脚本退出码与行为。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 182** + 本节）。  
- **禁止再分析**：**scripts** 目录大搬迁（**须另开 TT**）。  
- **验收**：母表 **B-163**、索引 **一览 182**、本节 **互指**；**`scripts/INDEX.md`** 文首 **TT-MOD-B1-06** 锚点仍有效。  
- **测试**：无（纯文档登记轮）。  

---

### TT-DOC-MOD-BATCH1-MESSAGES-COMMUNITY-JSON-SHELL-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B1-01**）  
- **阶段**：api / **程序级模块化治理 / Batch-1**  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`internal/common.rs`** **`json_internal_db_unavailable_error`** + **`internal/community.rs`** 三处 **503** **同形** **`Json`** — 与 **TT-MOD-B1-01**（**messages/community** **JSON** **拼装壳**）同范围；**不**扩 **`reconcile`/`reconcile_gates`**。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 183** + 本节）。  
- **禁止再分析**：借机改 **`messages.rs`** **HTTP/字段**；**07/04** 三线 bump。  
- **验收**：母表 **B-163**、索引 **一览 183**、映射表 **B1-01**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH1-ORDERS-TESTS-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B1-04**）  
- **阶段**：api / **程序级模块化治理 / Batch-1**  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/orders/tests/`**（**`mod.rs` / `apply_event_log_fields_tests.rs` / `suite.rs`**）+ **`orders/mod.rs`** **`#[cfg(test)] mod tests`** — 与 **TT-MOD-B1-04** 同范围。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 184** + 本节）。  
- **禁止再分析**：**orders** handler **正文** 重排；**B-097** 契约扩面。  
- **验收**：母表 **B-163**、索引 **一览 184**、映射表 **B1-04**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH2-INTERNAL-INDEXER-DIR-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B2-01**）  
- **阶段**：api / **程序级模块化治理 / Batch-2**  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/internal/indexer/`** 目录化 — **`tick` / `replay` / `reorg_rewind` / `reorg_execute` / `env` / `meta_build` / `mod.rs` + `pub use`**；**`internal/mod.rs`** **`mod indexer;`** 与对外 **`pub use`** **不变**；**不**改 **HTTP 路径 / JSON 形状 / 路由装配**。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 185** + 本节）。  
- **禁止再分析**：借机改 **indexer** **业务语义**、**compound_gate**、**07/04** 三线 bump。  
- **验收**：母表 **B-163**、索引 **一览 185**、映射表 **B2-01**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH2-INTERNAL-RECONCILE-DIR-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B2-02**）  
- **阶段**：api / **程序级模块化治理 / Batch-2**  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/internal/reconcile/`** 目录化 — **`body` / `collectors` / `indexer_reconcile` / `mod.rs` + `pub use`**；**`internal/mod.rs`** **`mod reconcile;`** 与 **`pub use reconcile::{indexer_reconcile, IndexerReconcileBody}`** **不变**；**不**改 **`POST …/internal/indexer-reconcile`** **HTTP / JSON**。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 186** + 本节）。  
- **禁止再分析**：借机改 **`reconcile_gates`**、**compound** 聚合规则；**07/04** 三线 bump。  
- **验收**：母表 **B-163**、索引 **一览 186**、映射表 **B2-02**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH3-COMMUNITY-DIR-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B3-01**）  
- **阶段**：api / **程序级模块化治理 / Batch-3**（**公网 community 目录化**；**非** 母表 **B-169～B-177** **Execution 观测 Batch-3**）  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/community/`** 目录化 — **`common` / `posts` / `dm_social` / `feedback_reports` / `router` / `tests` / `mod.rs` + `pub use router::router`**；**`routes/mod.rs`** **`mod community;`** 不变；**不**改 **公开** **`/api/v1/community/*`** **HTTP / JSON / 路由表**。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 187** + 本节）。  
- **禁止再分析**：借机改 **04 §3.4 community** 契约扩面；**governance / health_meta / internal** 非本卡范围。  
- **验收**：母表 **B-163**、索引 **一览 187**、映射表 **B3-01**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH3-HEALTH-META-PROD-DIR-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B3-02**）  
- **阶段**：api / **程序级模块化治理 / Batch-3**（**`health_meta/` 生产代码目录化**；**非** 母表 **B-169～B-177** **Execution 观测 Batch-3**）  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`crates/api/src/routes/health_meta/`** 生产代码分段 — **`meta_contract_keys` / `meta_build` / `meta_helpers` / `pause_chain` / `handlers` / `router` / `mod.rs` + 再导出**；**`tests.rs`** **保持不动**；**`health_meta::router()`**、**`meta_build_value` / `meta_build_for_startup_log`** **对外出口与调用路径不变**；**不**改 **`/health` `/meta` `/meta/build` `/metrics`** **HTTP 契约**。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 188** + 本节）。  
- **禁止再分析**：借机改 **governance / community / internal / scripts** 或扩 **04** 契约面。  
- **验收**：母表 **B-163**、索引 **一览 188**、映射表 **B3-02**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH3-COMMUNITY-HEALTH-META-MOD-ALIGN-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B3-03**）  
- **阶段**：api / **程序级模块化治理 / Batch-3**（**`community` + `health_meta` 的 `mod.rs` 装配对齐**；**非** 母表 **B-169～B-177** **Execution 观测 Batch-3**）  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**  
- **任务**：**`routes/community/mod.rs`** 与 **`routes/health_meta/mod.rs`** — **`#[cfg(test)] mod tests`** **文件末尾**、**`pub use` 分组注释**、**对外 `router()` 再导出顺序**与阅读顺序一致；**仅** 装配层与注释，**不**改 handler / JSON / 路由契约。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 189** + 本节）。  
- **禁止再分析**：借机改 **governance / internal / scripts** 或扩 **04**；**同卡** 多域拆分。  
- **验收**：母表 **B-163**、索引 **一览 189**、映射表 **B3-03**、本节 **互指**。  
- **测试**：无（纯文档）。  

---

### TT-DOC-MOD-BATCH3-GOVERNANCE-DIR-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B3-04**）  
- **阶段**：api / **程序级模块化治理 / Batch-3**（**`governance/` 公网治理路由第一层目录化**；**非** 母表 **B-169～B-177** **Execution 观测 Batch-3**）  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**（**⑫ B3-04**）  
- **任务**：**`crates/api/src/routes/governance.rs`** → **`crates/api/src/routes/governance/mod.rs`** — **第一层** **move-only** 目录化；**`routes/mod.rs`** **`mod governance;`** 与 **`governance::router()`** **不变**；**不**改 **`/api/v1/governance/*`** **JSON 形状 / 字段名 / 错误码 / guard 白名单**；**B-110 / SSOT** **链上·链下判定** **未改**；**`read_contract_route_guard`**、**`scripts/gates/ssot-guard-b110-pool-ssot.py`**、**`indexer-reconcile-gate.yml` / `internal-drill-gate.yml`** **仅** **路径锚** **同步** **`governance/mod.rs`**。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 190** + 本节 + **未封口范围** 序号上界）。  
- **禁止再分析**：借机改 **04** 契约表、**B-164/B-165/B-177** 实现卡 scope；**深层** **`governance/*` 子文件** 拆分（**留 B-178 后**）。  
- **验收**：母表 **B-163**、索引 **一览 190**、映射表 **B3-04**（母表 TT↔B 映射段）、本节 **互指**。  
- **测试**：无（纯文档登记轮；实现侧以 **`cargo test -p traveltrust-api`** 为准）。  

---

### TT-DOC-MOD-BATCH3-GOVERNANCE-LAYER2-DIR-SPLIT-001

- **去重类型**：**NEW**（**DUPLICATE**：无；**台账登记** 已落地 **TT-MOD-B3-05**）  
- **阶段**：api / **程序级模块化治理 / Batch-3**（**`governance/` 第二层按职责分文件**；**非** 母表 **B-169～B-177** **Execution 观测 Batch-3**）  
- **状态**：已封口（**文档登记**；实现 **已先于本 TT 合入**）  
- **母表**：[任务母表.md](./任务母表.md) **B-163**（**⑬ B3-05**）  
- **任务**：**`crates/api/src/routes/governance/mod.rs`** **move-only** 拆出 **`common.rs`**、**`pool_chain.rs`**、**`governance_pool.rs`**、**`governance_reads.rs`**、**`fee_pool_aggregate.rs`**、**`doc_params.rs`**、**`router.rs`**；**`governance::router()`** 与 **`crate::routes::governance`** **既有 `pub`/`pub(crate)` 导出** **不变**；**不**改 **`/api/v1/governance/*`** **JSON / 错误码 / guard / B-110·SSOT** **判定语义**；**read_contract** / **B-110 静态脚本** / **CI vault-forwards 锚** 等 **仅** **源码路径** **随子文件调整**（**非** 契约改写）。  
- **本轮仅改**（本登记轮）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**一览 191** + 本节 + **未封口范围** 序号上界）。  
- **禁止再分析**：借机改 **04** 表、**B-164/B-165/B-177** 实现 scope；**governance 第三层** 深拆（**留 B-178 后**）。  
- **验收**：母表 **B-163**、索引 **一览 191**、映射表 **B3-05**（母表 TT↔B 映射段）、本节 **互指**。  
- **测试**：无（纯文档登记轮；实现侧以 **`cargo test -p traveltrust-api`** 为准）。  

---

### TT-INDEXER-RECONCILE-ORDERS-PROJECTION-GATE-001

- **去重类型**：**EXTEND**（承 **母表 B-094**、**TT-99**/**107**；**非 DUPLICATE** 于 **81/86** 等 **fee_router**/**investor** reconcile 子项）  
- **阶段**：internal / 索引  
- **状态**：已封口  
- **母表**：**B-094**  
- **任务**：在 **`POST /api/v1/internal/indexer-reconcile`** 响应中执行并报告 **`orders_projection_reconcile_gate`**（与 **`orders_projection` SSOT** 对账）；**`summary`** 持久化或等价可审计输出（以 **04** internal 登记为准）。  
- **本轮仅改**（已落地）：**`crates/api`**（reconcile 路径）、**`docs/spec/04-后端与API.md`**（internal 契约句）。  
- **禁止再分析**：重写 **107** 写入规则；**Docker / CI**。  
- **验收**：**`cargo test -p traveltrust-api`** 覆盖 gate 与 reconcile 路径；**04** 与实现一致。  
- **测试**：**`cargo test -p traveltrust-api`**  

---

### TT-DISPUTES-LIST-DETAIL-POSTGRES-001

- **去重类型**：**NEW**（**DUPLICATE**：无；与 **B-013**/**TT-25** 争议详情 **UX**、**B-066** **SSOT 展示** **正交**）  
- **阶段**：disputes / API  
- **状态**：已封口  
- **母表**：**B-099**  
- **任务**：**`GET /api/v1/disputes`**：**Postgres** 路径下 **`limit`/`cursor`** 分页、**`page.source=postgres`**、**`next_cursor`**；**`GET /api/v1/disputes/:id`**：**DB join** 详情。  
- **本轮仅改**（已落地）：**`crates/api/src/db/disputes.rs`**、**`crates/api/src/routes/disputes.rs`**、**`frontend/lib/apiClient/disputes.ts`**、**`docs/spec/04-后端与API.md`**。  
- **禁止再分析**：争议 **mock** 路径删除；全站 disputes **UI** 重设计。  
- **验收**：**`cargo test -p traveltrust-api`** 游标/分页用例；列表自动 consume **`next_cursor`**。  
- **测试**：**`cargo test -p traveltrust-api`**  

---

### TT-DOC-GOVERNOR-TIMELOCK-QUEUE-EXECUTE-EVIDENCE-001

- **去重类型**：**EXTEND**（承 **B-089**/**TT-94**/**109**；**非 DUPLICATE** 于合约实现卡；**纯**证据与 Runbook 指针）  
- **阶段**：治理 / 文档证据  
- **状态**：已封口（**文档交付**；若组织策略要求 **CI 或附件 forge 绿日志** 才封口，则改标 **Partial** 并单开复核卡）  
- **母表**：**B-100**  
- **任务**：**`docs/verification-evidence/governor-timelock-queue-execute-evidence.md`** 给出 **`forge test …`** 命令与期望证据形态；**Runbook** 表行可索引到该文档。  
- **本轮仅改**（已落地）：**`docs/verification-evidence/*.md`**、**Runbook**（§2.56 或等价行）。  
- **禁止再分析**：重写 **Governor/Timelock** 部署脚本（除非新卡）。  
- **验收**：仓库内可 **`grep`/路径** 定位；与 **B-089** 叙述不冲突。  
- **测试**：无（纯文档）；可选本地 **`forge test`** 由运维执行。  

---

### TT-DOC-B093-ESCROW-APPENDIX-14-ALIGN-001

- **去重类型**：**EXTEND**（承 **B-093**/**TT-98**/**106**/**108**；**非 DUPLICATE** 于 Foundry 分账实现卡）  
- **阶段**：spec / 文档  
- **状态**：已封口  
- **母表**：**B-093**  
- **任务**：**`docs/spec/14-合约-API-ABI-前后端对齐.md`** **§1.1.0a**：**refund** 与平台腿、**`executeResolution`**、与 **已封口 106/108** 指针对齐。  
- **本轮仅改**（已落地）：**`docs/spec/14-合约-API-ABI-前后端对齐.md`**（**§1.1.0a**）。  
- **禁止再分析**：**01/80** 正文全量重写。  
- **验收**：**14** 与 **母表 B-093**、**106/108** **Completion** 互指一致。  
- **测试**：无（纯文档）。  

---

### TT-B120-INDEXER-RECONCILE-GATE-CHECKS-TOTAL-ALIGN-001

- **去重类型**：**NEW**（**DUPLICATE**：**0** — **不**改 **internal** 对账逻辑；仅 **CI 计数与文档同锚**）  
- **阶段**：indexer / ops / CI  
- **状态**：已封口  
- **母表**：**B-120**  
- **任务**：**`.github/workflows/indexer-reconcile-gate.yml`** 内 **`checks_total`** 与 **`check_anchor`** 调用数一致；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`**（**§3.1.2 运维 curl** 表）、**`docs/spec/07-开发流程与顺序.md`**（**§二 2.3** 脚本表、**§六 6.3B** 序 3 格）、**`ops/RUNBOOK.md`** **§2.55** 留痕互指。  
- **本轮仅改**：**`.github/workflows/indexer-reconcile-gate.yml`**、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`**、**`docs/spec/07-开发流程与顺序.md`**（**现行表**两行 **107→106**，**勿**改 **§六 6.4** 历史 changelog 行）、**`ops/RUNBOOK.md`**、**`docs/任务母表.md`**（**B-120** 行）、本索引 **一览 124** + 本节。  
- **禁止再分析**：**110** 全文重写；**07** **`Version:`** 三线 bump（**非**本卡范围）。  
- **验收**：**`checks_total`** = **`check_anchor`** 行数（当前 **106**）；**110**/**07**/**RUNBOOK** 现行句与 **YAML** 一致；母表 **B-120** 标 **已做**。  
- **测试**：本地执行 workflow 中 **Verify indexer/reconcile route anchors** 步同构 **`bash`**（或 **CI** **Indexer Reconcile Gate** 绿）。  

---

### TT-INDEXER-RECONCILE-COMPOUND-PASS-GATE-001

- **去重类型**：**EXTEND**（承 **110 §3.1.2～3.1.3**、**母表 B-094**、**一览 117** **`orders_projection_reconcile_gate`**；**DUPLICATE**：**0** — **不**重复 **117** 交付范围，本卡为 **复合门闸**）  
- **阶段**：internal / 索引  
- **状态**：已封口  
- **母表**：**B-101**  
- **任务**：在 **`POST /api/v1/internal/indexer-reconcile`**（或并列机读探针，执行时钉死）输出 **根级 `compound_pass`**（或等价布尔）与 **`human_summary`**：在 **`projection_reconcile_clean`**（**117** 同源）基础上 **AND**（或文档钉死的组合规则）**`rpc_escrow_samples`** 中 **粗终态不一致** 计数、可选 **`include_event_log_escrow_coverage`** **超阈值** 标记；**04 §3.4** internal 段与 **110** 登记 **SSOT** 字段名与默认行为。  
- **本轮仅改**（执行时钉死）：**`crates/api/src/routes/internal.rs`**、**`crates/api/src/db/*`**（若新增统计）、**`docs/spec/04-后端与API.md`**、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`**（**§3.1.x** 互指）。  
- **禁止再分析**：改写 **107** **`ResolutionExecuted`** 解析；**Docker / CI** 任务；声称 **全链扫链 Implemented**。  
- **验收**：**`cargo test -p traveltrust-api`**；**`projection_reconcile_clean=false` ⇒ `compound_pass=false`**；未启用 RPC/覆盖选项时响应与 **04** 一致。  
- **测试**：**`cargo test -p traveltrust-api`**  

---

### TT-ORDERS-CHAIN-ID-BACKFILL-AND-QUERY-GATE-001

- **去重类型**：**NEW**（**DUPLICATE**：**0** — **不**重复 **117/121**（对账门闸）；本卡为 **schema + 读路径**）  
- **阶段**：orders / DB / API  
- **状态**：已封口  
- **母表**：**B-102**  
- **任务**：**`orders.chain_id`**：**历史可空行** **回填策略**（迁移 SQL 或受控 **internal**/**一次性脚本**，须 **`dry-run` 摘要 JSON**）；**`GET /api/v1/orders`**（及执行时列举的其它读路径）对 **默认业务链**（**`CHAIN_ID`/`ChainConfig`**）**过滤或显式标注**（钉死规则），避免跨链行进入主链演示与 reconcile 样本；**不**默认开启 **110 §3.1.4** **`orders_chain_scope_rollback_execute`**。  
- **本轮仅改**（执行时钉死）：**`crates/api/migrations/*`**（若需）、**`crates/api/src/db/*`**、**`crates/api/src/routes/*`**（orders 列表/详情）、**`docs/spec/04-后端与API.md`**。  
- **禁止再分析**：**01/03** 状态机未评审即 **DELETE** 业务订单；**Docker / CI**。  
- **验收**：**`cargo test -p traveltrust-api`** 覆盖 **chain 过滤/回填 dry-run**；**04** 契约与实现一致。  
- **测试**：**`cargo test -p traveltrust-api`**  

---

### TT-GOVERNANCE-PROPOSALS-LIST-RESPONSE-CONTRACT-TEST-001

- **去重类型**：**EXTEND**（**DUPLICATE**：**0**；承 **projection/MVP** 体契约；**EXTEND**：**`X-Implementation-Status`** **不得**为 **`placeholder`**（与 **pool/params** 占位头区分），**projection** 成功枝仍为 **`chain_governor_indexed`**）
- **阶段**：API / 治理 · **`GET /api/v1/governance/proposals`**
- **状态**：已封口 · **EXTEND**
- **母表**：—（窄补测试）
- **任务**：在 **`crates/api/src/routes/governance.rs`** **`mod tests`** 增加 **`governance_proposals_response_*`**：**`status`**、**`data_source`**（**projection** ⇒ **`governance_proposals_projection`**；非 projection ⇒ 实现恒为 **`chain_off_mvp`** + 头 **`chain_off_mvp`**）、**`items`** 为数组；projection 时若根级含 **`governor_address`** 则校验非空；**Governor 索引**成功枝显式 **`assert_ne!(…, Some("placeholder"))`**。**禁止**改 handler / DB / 其它模块。
- **本轮仅改**：**`crates/api/src/routes/governance.rs`**（**`#[cfg(test)]`**）、本索引一览与正文
- **禁止再分析**：**04** 全文重扫；**handler** 改写
- **验收**：**通过**（**EXTEND**：**projection** 成功枝 **`X-Implementation-Status`** **≠** **`placeholder`** 且 **=** **`chain_governor_indexed`**；MVP 枝 **`chain_off_mvp`**；**`cargo test -p traveltrust-api governance_proposals_response_*`** 绿；无 **`DATABASE_URL`** 或缺表时 projection 枝跳过仍绿）
- **测试**：**`cargo test -p traveltrust-api governance_proposals_response_*`**

---

### TT-EVIDENCE-B094-RESOLUTION-FIXTURES-SSOT-001

- **去重类型**：**EXTEND**（承 **母表 B-094**、**TT-99**/**107**/**113**；**DUPLICATE**：**0** — **不**重复 **107**（写入逻辑）、**113**（outbox 闭环）；本卡为 **验收证据单文件 SSOT**）  
- **阶段**：escrow / 文档证据  
- **状态**：已封口  
- **母表**：**B-103**（溯源 **B-094**）  
- **任务**：将 **Refunded / PartiallyRefunded / Slashed** 三模板 **fixture 报告** 收敛为 **单一 SSOT**（路径钉死 **`docs/verification-evidence/`** 或 **`evidence/`**，与 **evidence/README** 一致）：每态 **tx hash、主要地址、前后余额摘要、与 `orders_projection` 期望字段**；与 **`evidence/B-094-execute-resolution-fixtures.md`** **互指或合并**，**禁止**双源。  
- **本轮仅改**（执行时钉死）：**`docs/verification-evidence/*.md`** 或 **`evidence/*.md`**、**必要时** **母表 B-094** 行内 **证据路径指针**（**窄改**）。  
- **禁止再分析**：重写 **TT-107** **`###` 正文**；**Docker / CI**。  
- **验收**：人工可按单文件 **核对** 母表 **B-094** 验收句；与 Foundry/现有 evidence **无矛盾**。  
- **测试**：无（纯文档）；可选仓库内 **链接检查**。  

---

### TT-B114-1-REORG-SAFETY-001

- **阶段**：indexer / **reorg** 安全（**母表 B-114 子线 B-114-1**）
- **状态**：已封口
- **母表**：**B-114**（**进行中**；本子线收口 **B-114-1**）
- **本轮仅改**：**`crates/api/src/chain/indexer/`**（**`rewind_indexer_memory_state_after_reorg`** + **`#[cfg(test)]`**）；**`crates/api/src/routes/internal.rs`**（调用同源回滚，**不**改删尾 / replay 语义）
- **禁止再分析**：**B-115 / B-116 / P5 / Epic A/C/D/E/F** 产品语义；**新 HTTP API**
- **任务**：链回滚（reorg）时 **IndexerState** 丢弃 **`block_number >= rewind_from`** 的事件，checkpoint 回到安全前缀尾；与 **`delete_*_from_block`** **同界**，便于重扫 **canonical** log **不重复** `(chain_id, block_number, log_index)`、**不残留** 旧 **`block_hash`**。
- **验收**：**`cargo test -p traveltrust-api reorg`** **全绿**（含 **`reorg_safety_*`** 模拟 reorg；**不得**以「跳过 tick」冒充修复）。
- **测试**：**`cargo test -p traveltrust-api reorg`**

---

### TT-B114-4-REORG-MULTI-BLOCK-REPLAY-001

- **阶段**：indexer / **reorg** 多区块回放（**母表 B-114-4**）
- **状态**：已封口
- **母表**：**B-114-4**（**已做**；与 [**docs/任务母表.md**](../docs/任务母表.md) **B-114-4** 行一致；互证 [**evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md**](../evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md) **§B-114-4**）
- **本轮仅改**：**`crates/api/src/chain/indexer/`**（**`rewind_indexer_memory_state_after_reorg`** 文档 + **`#[cfg(test)]`** **`b114_4_reorg_multi_block_*`**）
- **禁止再分析**：**B-115 / B-116 / P5 / Epic D/E/F** 语义；**新 HTTP API**；**跳过 tick / reorg 路径**
- **任务**：验证 **连续多区块**（例 **10/11/12**）被 **一次** **`rewind(from_block)`** 剥除后，重放 **10'/11'/12'** 仅保留新 fork 载荷、**`(chain_id, block_number, log_index)`** 无重复、**`last_block` / `last_block_hash`** 止于新链尾；重放后再 **`append`** 同键须判重复。
- **验收**：**`cargo test -p traveltrust-api b114_4_reorg_multi_block`** **全绿**
- **测试**：**`cargo test -p traveltrust-api b114_4_reorg_multi_block`**

---

### TT-B114-5

- **阶段**：indexer / **reorg** 后 **`indexer_tick`** 起扫下界（**母表 B-114-5**）
- **状态**：已封口
- **母表**：**B-114-5**（**已做**；与 [**docs/任务母表.md**](../docs/任务母表.md) **B-114-5** 行一致；互证 [**evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md**](../evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md) **§B-114-5**）
- **本轮仅改**：**仅** **`crates/api/src/chain/indexer/`**（**`indexer_tick_scan_from_block_lower_bound`** + **`#[cfg(test)]`** **`b114_5_reorg_tick_scan_from_block_*`**）；**`crates/api/src/routes/internal.rs`**（**`indexer_tick`** 读锁内调用该函数）
- **禁止再分析**：**B-115 / B-116 / P5 / Epic A/C/D/E/F** 语义；**新 HTTP API**；**跳过 tick / reorg 路径**
- **任务**：reorg 后 **`indexer_tick`** 用于 **`eth_getLogs`** 的 **`scan_from_block`** 与 **`rewind_indexer_memory_state_after_reorg` / `perform_indexer_reorg_rewind_execute`** 之后的内存 **`IndexerState`** 同源（**`last_block + 1`**）；**`reorg_detected` → rewind → `continue`** 后首轮回合重算不断档。
- **验收**：**`cargo test -p traveltrust-api b114_5_reorg_tick_scan_from_block`** **全绿**（**2 passed**）
- **测试**：**`cargo test -p traveltrust-api b114_5_reorg_tick_scan_from_block`**

---

### TT-B110-SEQ2-ORDERS-DEADLINE-BUNDLE-CLOSE-001

- **阶段**：orders / **`rating_deadline`** SSOT · **文档与索引收口**（**母表 B-132**）
- **状态**：已封口
- **母表**：[docs/任务母表.md](../docs/任务母表.md) **B-132**
- **本轮仅改**（执行本卡时）：**`docs/任务母表.md`**、**`docs/spec/04-后端与API.md`**（**bundle** 契约句）、**`evidence/GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md`**、**`evidence/README.md`**（锚点）、**`docs/runbook/sealed-programs-and-epics-master-index.md`**、**`ops/RUNBOOK.md`**（**§2.55** 互指）、**`docs/AI任务卡索引.md`**（本条目）
- **禁止再分析**：在这条子线上 **横向加** deadline 相关 **产品能力**；**改** **`GET /api/v1/orders*`** 公开字段语义
- **任务**：将 **B110-SEQ2** 已落地项登记为可引用 **bundle**（真值 → **`meta`/observability → reconcile_probe → clock → governor 链读与 P3 → admin → ops_check → 可选 staging CI**）；写明 **与 indexer reconcile 正交**、**未覆盖** **`payment_deadline`/`chat_confirm_deadline`** 等边界；**规划级** 后续方向见 **GO §4**
- **验收**：**`cargo test -p traveltrust-api`**；**`bash scripts/run-check-04-routes.sh`**；互证链接见 **GO §3**
- **测试**：上列两条（**本卡默认不改业务代码**）

---

### TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001

- **阶段**：indexer / internal **`indexer-reconcile`** · **orders `rating_deadline`** SSOT **并列巡检**（**母表 B-133**）
- **状态**：已封口
- **母表**：[docs/任务母表.md](../docs/任务母表.md) **B-133**
- **本轮仅改**（执行本卡时）：**`crates/api/src/routes/internal.rs`**（**`indexer_reconcile`** + **`indexer_reconcile_compound_gate`** + **`#[cfg(test)]`** **`b110_seq3_*`**）；**`docs/spec/04-后端与API.md`**（**`internal/indexer-reconcile`** 表行）；**`docs/spec/110-…`** **§3.1.3.1**；**`ops/RUNBOOK.md`** **§2.55**；**`.github/workflows/indexer-reconcile-gate.yml`**（**`checks_total`** **107** + **`check_anchor`**）；**`scripts/indexer-reconcile-probe.sh`**（**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`**）；**`.github/workflows/internal-drill-gate.yml`**；**`docs/任务母表.md`**（**B-110 / B-120 / B-132 / B-133**）；**`docs/runbook/sealed-programs-and-epics-master-index.md`**；**`evidence/GO_B110_SEQ2_…`** **§2** 边界句；**`evidence/README.md`**；本索引 **一览 133** + 本节
- **禁止再分析**：改 **`GET /api/v1/orders*`** / **`GET /meta`** 公开字段语义；**无** **母表+TT** 再扩 **其它治理参数** 同类门闸
- **任务**：在 **B110-SEQ2** 不变前提下，将 **admin** **`overview.orders_deadline_ssot_ops_check`** **同源判定** 并入 **`indexer-reconcile`** **`200`**/**`persist` `summary`**，并 **AND** 入 **`reconcile_compound_pass`**
- **验收**：**`cargo test -p traveltrust-api`**（含 **`b110_seq3_compound_gate_orders_deadline_ops_fail_lowers_compound_pass`**）；**`bash scripts/run-check-04-routes.sh`**；**`indexer-reconcile-gate.yml`** **`checks_total`** = **`check_anchor`** 调用数（**107**）；**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 同值
- **测试**：上列 **`cargo test`** + **`run-check-04-routes`**

---

### TT-B110-SEQ4-GOVERNANCE-PARAM-NEXT-CANDIDATE-001

- **阶段**：governance / **规划台账**（**母表 B-134**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-134**
- **本轮仅改**（执行本卡时）：**`docs/任务母表.md`**（**B-110** 互指句、**B-134** 新行、**续表 B-135**）、**`docs/AI任务卡索引.md`**（**一览 134～136**、**未封口**段、本 **`###`**）
- **禁止再分析**：**业务代码**；**spec/07**（除非另批 **台账同批**）；擅自执行 **SEQ5** 实现
- **任务**：基于 **B110-SEQ2/SEQ3** 模式，输出 **候选参数清单**、**优先级（P1～P4）**、**链上读取可行性**、**fallback 边界**、**observability / reconcile_probe / admin / ops / CI / indexer-reconcile compound** 复用点；登记 **B-134** 与首张实现 **`TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001`**
- **验收**：母表 **B-134** 描述列与索引 **一览 134**/**135**/**136**/**未封口**/**本节** 互指无断链
- **测试**：—（文档轮）

---

### TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001

- **阶段**：governance / **Governor 只读参数链上 SSOT**（**母表 B-135**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-135**（承 **B-134** **P1**）
- **本轮已落地**：**`crates/api/src/chain/governor.rs`**、**`crates/api/src/chain_off/governance_view_params_ssot.rs`**、**`chain_off` env**、**`health_meta` `governance`**、**`admin` observability**、**`internal` compound + `governor_view_params_ssot_ops_check`**、**`scripts/governance-governor-view-params-ssot-ops-check.sh`**、**gate/probe 109**（与 **SEQ6** 累计）、**04 / 110 / Runbook / scripts/README**
- **禁止再分析**（归档）：**`GET /api/v1/orders*`** 公开语义；**无母表行**扩 **FeeRouter BPS** 全链 SSOT
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿；**`checks_total`**/**`check_anchor`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** = **110**（**B-120** 现行，累计 **SEQ8**）

---

### TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001

- **阶段**：governance / **Timelock delay 链上 SSOT**（**母表 B-136**；Solidity **`delay()`**，任务 **`getDelay()`** 口径映射）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-136**（承 **B-134** **P2**）
- **本轮已落地**：**`crates/api/src/chain/timelock.rs`**、**`ChainConfig.governance_timelock_address`**、**`crates/api/src/chain_off/governance_timelock_delay_ssot.rs`**、**`GOVERNANCE_TIMELOCK_DELAY_CHAIN_SSOT`/`GOVERNANCE_TIMELOCK_ADDRESS`**、**`health_meta` `governance.timelock_delay_observability`**（**807** 键序见 **`GOVERNANCE_META_TOP_KEYS`**；**SEQ8** 后 **七键**）；**`admin` `timelock_delay_ssot*`**；**`internal` compound + `timelock_delay_ssot_ops_check`**；**`scripts/governance-timelock-delay-ssot-ops-check.sh`**；**gate/probe 110**（累计 **SEQ8**）；**04 / 110 / Runbook / scripts/README / internal-drill**
- **禁止再分析**（归档）：**`GET /api/v1/orders*`** 公开语义；**无母表行**扩 **FeeRouter BPS** 全链 SSOT
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿；**`checks_total`**/**`check_anchor`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** = **110**（累计 **SEQ8**）
- **测试**：**`b110_seq6_compound_gate_timelock_delay_ops_fail_lowers_compound_pass`**；**`governance_timelock_delay_ssot::tests`**

---

### TT-B110-SEQ7-GOVERNANCE-PARAM-NEXT-CANDIDATE-001

- **阶段**：governance / **下一治理链上只读 SSOT 规划**（**母表 B-137**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-137**（承 **B-134**，**SEQ5/SEQ6** 已闭合）
- **本轮仅改**：**`docs/任务母表.md`**（**B-137** 行）、**`docs/AI任务卡索引.md`**（**一览 137/138**、**未封口**段、本节、**SEQ8** 占位节）
- **任务**：候选 **P1** **`TravelTrustGovernor.proposalThresholdVotes()`**、**P2** **`GovernanceTimelock.governor()`/`admin()`**、**P3** **`proposalCount()`**（顺延/语义须单列）、**排除** **FeeRouter BPS**（**P5-5/84** 双源）；复用 **SEQ5/SEQ6** **meta（807）/ admin / reconcile_probe / compound / ops / gate** 骨架；首张实现 **SEQ8** 见下节
- **禁止再分析**：**未增母表 B-138 行**即修改 **`crates/api`** 业务实现
- **验收**：**B-137** 与索引 **137** 互指；**零**业务代码 diff

---

### TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001

- **阶段**：governance / **Governor `proposalThresholdVotes` 链上只读 SSOT**（**母表 B-138**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-138**（承 **B-137** **P1**）；规划单源 [**B-137**](./任务母表.md)
- **本轮已落地**：**`crates/api/src/chain/governor.rs`**（**`probe_governor_proposal_threshold_chain`**）、**`crates/api/src/chain_off/governance_proposal_threshold_ssot.rs`**、**`GOVERNANCE_GOVERNOR_PROPOSAL_THRESHOLD_CHAIN_SSOT`**、**`health_meta` `governance.governor_proposal_threshold_observability`（807 键序见 `GOVERNANCE_META_TOP_KEYS`；SEQ9 后八键）**、**`admin` `governor_proposal_threshold_ssot*`**、**`internal` compound + `governor_proposal_threshold_ssot_ops_check`**、**`scripts/governance-governor-proposal-threshold-ssot-ops-check.sh/.ps1`**、**gate/probe 111**（与 **SEQ9** 累计）、**04 / 110 / Runbook / internal-drill / `.env.example`**
- **禁止再分析**（归档）：**`GET /api/v1/orders*`** 公开语义
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`**；**`checks_total`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **`check_anchor`** = **111**（与 **SEQ9** 累计）
- **测试**：**`b110_seq8_compound_gate_proposal_threshold_ops_fail_lowers_compound_pass`**；**`governance_proposal_threshold_ssot::tests`**

---

### TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001

- **阶段**：governance / **Timelock `governor()` / `admin()` 地址链上只读 SSOT**（**母表 B-139**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-139**（承 **B-137** **P2**）；规划单源 [**B-137**](./任务母表.md)
- **本轮已落地**：**`crates/api/src/chain/timelock.rs`**（**`eth_call_timelock_address_getter`**、**`probe_timelock_governor_admin_chain`**）、**`crates/api/src/chain_off/governance_timelock_governor_admin_ssot.rs`**、**`GOVERNANCE_TIMELOCK_GOVERNOR_ADMIN_CHAIN_SSOT`**、**`health_meta` `governance.timelock_governor_admin_observability`（807 八键）**、**`admin` `timelock_governor_admin_ssot*`**、**`internal` compound + `timelock_governor_admin_ssot_ops_check`**、**`scripts/governance-timelock-governor-admin-ssot-ops-check.sh/.ps1`**、**gate/probe 111**、**04 / 110 / Runbook / internal-drill / `.env.example`**
- **禁止再分析**（归档）：**`GET /api/v1/orders*`** 公开语义
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`**；**`checks_total`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **`check_anchor`** = **111**
- **测试**：**`b110_seq9_compound_gate_timelock_governor_admin_ops_fail_lowers_compound_pass`**；**`governance_timelock_governor_admin_ssot::tests`**；**`timelock::tests` `seq9_governor_admin_selectors_stable_for_eth_call`**

---

### TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001

- **阶段**：governance / **Governor `proposalCount()` 观测 SSOT（链上 vs 投影 · 显式漂移语义）**（**母表 B-140**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-140**（承 **B-137** **P3**）；漂移语义单源 **本行 + 母表 B-140**
- **本轮已落地**：**`crates/api/src/chain/governor.rs`**（**`probe_governor_proposal_count_chain`**、selector 单测）、**`crates/api/src/db/governance_proposals_projection.rs`**（**`count_governance_proposals_projection_for_chain`**）、**`crates/api/src/chain_off/governance_proposal_count_ssot.rs`**、**`GOVERNANCE_GOVERNOR_PROPOSAL_COUNT_CHAIN_SSOT`** / **`GOVERNANCE_PROPOSAL_COUNT_MAX_INDEXER_LAG`**、**`health_meta` `governance.governor_proposal_count_observability`（807 十键 · SEQ11 后）**、**`admin` `governor_proposal_count_ssot*`**、**`internal` compound + `governor_proposal_count_ssot_ops_check`**、**`scripts/governance-governor-proposal-count-ssot-ops-check.sh/.ps1`**、**gate/probe 113**、**04 / 110 / Runbook / internal-drill / `scripts/README.md` / `.env.example`**
- **禁止再分析**（归档）：**`GET /api/v1/orders*`** 与 **公开** **`GET …/governance/proposals*`** 根级字段
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`**；**`checks_total`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **`check_anchor`** = **113**
- **测试**：**`b110_seq10_compound_gate_governor_proposal_count_ops_fail_lowers_compound_pass`**；**`governance_proposal_count_ssot::tests`**；**`governor::tests` `tt_b110_seq10_proposal_count_selector_stable`**

---

### TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001

- **阶段**：governance / **Governor `token()` / `timelock()` immutable 引用 · bundle**（**母表 B-142**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-142**（承 **B-141** **L1** **`token`/`timelock`** bundle）；规划互证 [**B-141**](./任务母表.md)
- **本轮已落地**：**`crates/api/src/chain/governor.rs`**（**`eth_call_governor_address_getter`**、**`GovernorTokenTimelockProbe`**、selector 单测）、**`crates/api/src/chain_off/governance_governor_token_timelock_ssot.rs`**、**`GOVERNANCE_GOVERNOR_TOKEN_TIMELOCK_CHAIN_SSOT`**、**`health_meta` `governance.governor_token_timelock_observability`（807 十键）**、**`admin` `governor_token_timelock_ssot*`**、**`internal` compound + `governor_token_timelock_ssot_ops_check`**、**`scripts/governance-governor-token-timelock-ssot-ops-check.sh/.ps1`**、**gate/probe 113**、**04 / 110 / Runbook / internal-drill / `scripts/README.md` / `.env.example`**
- **禁止再分析**（归档）：**`GET /api/v1/orders*`** 公开语义
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`**；**`checks_total`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **`check_anchor`** = **113**
- **测试**：**`b110_seq11_compound_gate_governor_token_timelock_ops_fail_lowers_compound_pass`**；**`governance_governor_token_timelock_ssot::tests`**；**`governor::tests`** selector 稳定性

---

### TT-B110-SEQ12-GOVERNANCE-GOVERNOR-ORDER-RATING-REVIEW-WINDOW-BOUNDARY-001

- **阶段**：governance / orders · **`orderRatingReviewWindowDays()`** 与 **SEQ2 `rating_deadline`** 真值链 · **边界语义（文档轮已封口）**（**母表 B-143**；**升格** 须 **另开实现 TT**）
- **状态**：已封口（**文档轮** **☑**；**升格 orders 真值链** 须 **另开实现类 TT**）
- **母表**：[任务母表.md](./任务母表.md) **B-143**；互证 **B-132**（SEQ2）、**B-133**（SEQ3）、**B-141**（L1′ 候选）
- **本轮仅改（文档轮）**：**`docs/任务母表.md`**（**B-143** 行、**B-110** 互指、**续表 B-144**）、**`docs/spec/04-后端与API.md`**（**SEQ12** 契约句）、**`docs/spec/110-…`**（**§3.1.3.1** SEQ12 边界段）、**`ops/RUNBOOK.md`**（**§2.55**）、本索引 **一览 143** + 本节
- **禁止再分析**：在 **未**另开 **实现 TT** 前改动 **`crates/**`** 业务代码；擅自新增 **`compound_gate`** 子项或扩展 **公开** **`GET /api/v1/orders*`** **`rating_deadline`/`deadline_rating_observability`** 键集
- **任务（边界裁断）**：
  - **并列观测（默认规划态）**：**`orderRatingReviewWindowDays()`** **已**纳入 **SEQ2** **`rating_review_window_resolution_for_orders_api`** 与 **`GET /meta` → `orders.deadline_rating_observability`** / **`reconcile_probe`**、**admin** **`orders_deadline_ssot*`**、**SEQ3** **`orders_deadline_ssot_ops_check`** + **`compound_gate.breakdown.orders_deadline_ssot_reconcile`**。若未来仅在 **`807` `governance.*`** 增加 **独立**于 **`orders` 节** 的同名 getter **观测**，语义为与上述路径 **并行展示/对读**，**不**自动等同于 **「治理节单独接管 orders `rating_deadline`」**。
  - **未来接管候选**：**仅**在 **母表新增实现行** + **实现类 TT 封口**、**04 主表与 B-110 契约句同批** 显式改写 **`GET /api/v1/orders*`** **`rating_deadline` / `order.deadline_rating_observability`**、**110** 若动 **`compound_gate`** 则 **B-120 gate 计数/check_anchor/probe 同批**、**fail-closed** 不弱于现行 SEQ2（闸关/RPC/无 getter → P3 或等价 omit）、**Runbook/ops** 登记后，方可将链上窗口 **升格**为 **orders 业务单一真值来源**。
  - **首轮硬边界**：**禁止**以 **仅扩 meta/admin/reconcile/ops 观测** 为由改动 **公开** **`GET /api/v1/orders*`** 或 **扩展** SEQ2 已登记 **`order.deadline_rating_observability`** 对外键集。
- **验收（文档轮）**：**B-143** + **04**/**110**/**Runbook**/**本索引** 互指无断链；**`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：—（无代码变更）
- **备注**：**807 并列观测** 评估见 [**SEQ13 / B-144 / 一览 144**](#tt-b110-seq13-governance-order-rating-review-window-parallel-meta-obs-001)（**已否决** Rust 实现）。

---

### TT-B110-SEQ13-GOVERNANCE-ORDER-RATING-REVIEW-WINDOW-PARALLEL-META-OBS-001

- **阶段**：governance / orders · **`orderRatingReviewWindowDays()`** · **`807` `governance.*`** **并列只读观测** · **实现前信息价值评估**（**母表 B-144**）
- **状态**：已封口（**评估结论：否决 Rust**；**零** `crates/**` 业务 diff）
- **母表**：[任务母表.md](./任务母表.md) **B-144**；互证 **B-143**（SEQ12 边界）、**B-132**/**B-133**（SEQ2/SEQ3 现网观测）
- **本轮仅改**：**`docs/任务母表.md`**（**B-144** 行、**B-110** **SEQ13** 互指、**续表 B-145**）、**`docs/spec/04-后端与API.md`**（**SEQ13** 否决句）、**`docs/spec/110-…`**（**SEQ13** 一句）、**`ops/RUNBOOK.md`**（**SEQ13** 一句）、本索引 **一览 144** + 本节
- **禁止再分析**：本卡 **不**授权改动 **`GET /api/v1/orders*`**；**不**新增 **`compound_gate`** 子项；**不** bump **`GOVERNANCE_META_TOP_KEYS`**
- **任务（对读评估）**：
  - **已有观测轴**：**`GET /meta` → `orders.deadline_rating_observability`**（**`review_window_days_*`**、闸语义、**`reconcile_probe`** 双 **`eth_call`** 对拍）；**per-order** **`order.deadline_rating_observability`**；**admin** **`orders_deadline_ssot` + `orders_deadline_ssot_ops_check`**；**`POST …/internal/indexer-reconcile`** **`orders_deadline_ssot_ops_check`** + **`orders_deadline_ssot_reconcile`**；**`scripts/orders-deadline-ssot-ops-check.sh`**。
  - **结论**：再在 **`governance.*`** 挂 **同名 getter** **仅**为 **并列展示** 时，**不**增加 **非重复** 信号、**不**提供 **新的** 对拍或第二源、**不**缩短 **排障路径**（反而 **重复 RPC**）；**不满足** **「非重复、可排障、可运维」** 独立价值门槛。
  - **登记动作**：**否决** **`807`** 扩键；若未来 **产品强制** 需 **治理节** 展示，**优先** 文档/Runbook 指运维读 **`orders` meta 子节**，**而非** 复制 SSOT 实现。
- **验收**：**B-144** + **04**/**110**/**Runbook**/**本索引** 互指；**`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：—（无代码变更）

---

### TT-B145-SSOT-GATE-PR-CHECK-CRATES-NEEDS-METADATA-001

- **阶段**：SSOT · **单人开发元数据门禁**（**`crates/**` → 同批母表或索引；本地脚本为主，可选 workflow）（**母表 B-145**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-145**；互证 [04 · 零、SSOT Gate](spec/04-后端与API.md#ssot-gate-pre-tt) **硬门禁** + **单人开发默认流程** + **元数据门禁** 段
- **本轮仅改**：**`scripts/check-pr-crates-needs-metadata.sh`**、**`.github/workflows/ssot-crates-metadata-hint.yml`**、**`docs/任务母表.md`**（**B-145**、**续表**）、**`docs/spec/04-后端与API.md`**（**零、**）、**`docs/AI任务卡索引.md`**（**一览 145**、本节）、**`scripts/README.md`**（**Pre-TT** 互指，可选）
- **禁止再分析**：本脚本**不**解析 PR 标签/豁免正文（另卡）；**不**将 **`contracts/**`** 纳入 **`crates/**`** 规则（若需同规则另开 TT）
- **任务**：
  - **`git diff BASE..HEAD --name-only`**：若含 **`crates/**`**，则须含 **`docs/任务母表.md`** 或 **`docs/AI任务卡索引.md`** 之一。
  - **默认**：打印 **`::warning::`**（**`GITHUB_ACTIONS`** 内）、**exit 0**。
  - **升格 fail**：环境变量 **`CRATES_METADATA_GATE_FAIL=1`** → **exit 1**（**触发路径** 随 **B-147/B-158** 扩面；**详见 **`gates/check-pr-crates-needs-metadata.sh`** 头**）。
- **验收**：**`bash scripts/check-pr-crates-needs-metadata.sh`** 本地可跑；**`pull_request`** workflow 存在（**可选**）；**`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：—（shell 自解释；CI 上 **PR** 场景可验 **`::warning::`**）
- **备注（rollout）**：**阶段 1** — 默认 **exit 0** + **终端提醒**（**单人主路径**）；**PR** 时可加 **`::warning::`**。观察误报/漏报、是否把 **`docs/spec/04-后端与API.md`** 纳入「可接受元数据」、是否另规则 **`contracts/**`**。**阶段 2（B-146）** — **BASE/HEAD 解析语义**与**脚本边界**（**`TT-B146-SSOT-GATE-BASE-RESOLUTION-STRICTNESS-PLAN-001`**），**先于**路径扩面；**可选** **`CRATES_METADATA_GATE_REQUIRE_REFS=1`** → **解析失败 exit 2**。**阶段 3（B-147）** — **`contracts/**`** 规则与豁免（**产品化**）。**`crates/**` 违规默认 exit 1** — **另卡**，**非** B-146。**回归**：母表/索引同批提交后 **`bash scripts/check-pr-crates-needs-metadata.sh main HEAD`** → **OK**。
- **误报 / 漏报（观察清单）**（对照 **`scripts/check-pr-crates-needs-metadata.sh`** 实现）：
  - **误报（有提醒或将来 fail 会显得「过严」）**
    - **任意 **`crates/**`** 路径变更即触发**（**`grep '^crates/'`**），含：**fmt/仅注释/仅测试与 fixture/ crate 内 markdown**，与「是否真有新产品行为或须开 B」的人工判断可能不一致；**将来**若 **`CRATES_METADATA_GATE_FAIL`** 默认打开，会放大摩擦 → 需另卡议 **豁免维度**（标签、路径前缀、或「仅测试」启发式，均有 **漏报** 代价）。
    - **多 commit 叠分支**：规则看 **`BASE..HEAD` 并集**；若流程上要求「每个 touch crates 的 commit 都带母表」脚本**不**校验，仅看整体 diff → 与「逐 commit 洁癖」预期不一致时像**误报**（整体已带母表但中间 commit 没有）。
  - **漏报（应管却 OK）**
    - **`git rev-parse` 失败**（无 **`main`**、浅克隆未 fetch、**`BASE`/`HEAD`** 错）：默认 **WARN + exit 0** → **静默跳过**；缓解见 **B-146** / **`CRATES_METADATA_GATE_REQUIRE_REFS=1`**（**exit 2**）；**workflow** 已 **`fetch-depth: 0`**，本地/旁路 CI 仍可能踩坑。
    - **~~仅 **`frontend/**`**、**`package-lock.json`**…~~** **已收口（B-158）**：与 **`crates/**`**/**`contracts/**`** **同脚本**；**`Cargo.lock`**（**Rust**）**仍不在** 本门禁路径内（**另卡议**）。**`contracts/**`** **须登记路径** → **B-147** **已收口**。
    - **同批「形式上」改了母表/索引**：脚本只认**路径出现**，**不**解析是否新增 **B-xxx / TT** 或语义是否敷衍 → **内容漏报**须 **review** 或 **另门禁**。
    - **业务代码迁出 `crates/`**（未来 monorepo 路径变更）：前缀规则失效 → 须改脚本或 **PATH 列表**。
  - **与 B-146 / B-147 分工**：**B-146** — **解析失败 ≠ 通过**（**`REQUIRE_REFS`** / 文档分层 / CI 后续收紧）；**B-147** — **`contracts/**`** 与豁免；**可接受元数据是否含 04**、**PR 标签豁免** — **另卡**议。

---

### TT-B146-SSOT-GATE-BASE-RESOLUTION-STRICTNESS-PLAN-001

- **阶段**：SSOT · **单人开发元数据门禁（B-145）后续** — **BASE/HEAD 解析语义**与**最小脚本边界**
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-146**；承 **B-145**；互证 [04 · 零、SSOT Gate](spec/04-后端与API.md#ssot-gate-pre-tt) **单人开发元数据门禁** 段
- **本轮仅改**：**`scripts/check-pr-crates-needs-metadata.sh`**（头注释 + **可选** **`CRATES_METADATA_GATE_REQUIRE_REFS`**）、**`docs/任务母表.md`**（**B-145 升程**、**B-146** 行、**续表 B-147**）、**`docs/spec/04-后端与API.md`**（**零、** **B-145** 旁 **BASE/HEAD** / **B-147** 指针）、**`docs/AI任务卡索引.md`**（**一览 146**、本节、**TT-B145** rollout/误报互指）、**`scripts/README.md`**（**Pre-TT** + 表行 **`check-pr-crates-needs-metadata.sh`**）
- **禁止再分析**：**本卡不**扩 **`contracts/**`**（**B-147**）；**不**默认 **`CRATES_METADATA_GATE_FAIL`**；**不**改 **`.github/workflows/ssot-crates-metadata-hint.yml`** 默认调用；**不**将 **exit 2** 与 **`crates/**` 缺元数据的 exit 1** 混为一谈
- **任务（文档钉死 + 最小实现）**：
  - **问题**：**`git rev-parse BASE`/`HEAD` 失败**时若 **exit 0**，后续无论是否扩 **`contracts/**`**，都存在 **「该检查时未检查」** 的 **漏报**；**优先级高于**路径覆盖面。
  - **默认（兼容 B-145）**：**unset** **`CRATES_METADATA_GATE_REQUIRE_REFS`** → 与 **B-145** 一致：**WARN + exit 0**。
  - **可选收紧**：**`CRATES_METADATA_GATE_REQUIRE_REFS=1`** → **不可解析时 exit 2**（**非** **`CRATES_METADATA_GATE_FAIL`** 轨；**非** workflow 默认）。
  - **本地 vs CI**：本地允许宽容；**CI**（**PR + SHA + depth 0**）应能解析 — 若不能，**不应**长期将 **exit 0** 当绿（**workflow 或默认策略**收紧留 **B-146 收口二期**或另卡）。
  - **升格 fail**：**`CRATES_METADATA_GATE_FAIL=1`** 针对 **「diff 触发门禁路径」（**`crates/**`**、须登记 **`contracts/**`**、**B-158** **`frontend/**`/lockfile** — **详见 gates 脚本**）**无母表/索引」** → **exit 1**。
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`bash scripts/check-pr-crates-needs-metadata.sh main HEAD`** 默认 **exit 0**；**`CRATES_METADATA_GATE_REQUIRE_REFS=1 bash scripts/check-pr-crates-needs-metadata.sh no-such-ref-xyz HEAD`** → **exit 2**
- **测试**：—（shell；上列命令人工或 CI 可复验）
- **下一张单卡**：**B-147** — **`contracts/**`** 是否纳入单人开发元数据门禁、**哪些改动须母表/TT**、**测试/脚本/注释豁免**、**是否与 Rust 同轨**（**在 B-146 底座稳定后**）

---

### TT-B147-SSOT-GATE-CONTRACTS-SCOPE-001

- **阶段**：SSOT · **单人开发元数据门禁 · `contracts/**` 范围**（**母表 B-147**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-147**；承 **B-145**/**B-146**
- **本轮仅改**：**`scripts/gates/check-pr-crates-needs-metadata.sh`**（**contracts 门禁 + 豁免**）；**`docs/spec/04-后端与API.md`** **零、**；**`scripts/README.md`**；**`.github/workflows/ssot-crates-metadata-hint.yml`**（**注释 + step 名**）；**母表 B-147**、**本索引** 一览/正文
- **禁止再分析**：未开 TT 即改 **Rust/合约** 业务语义；与 **B-145 `crates/**`** 规则**重复叙事**（须 **contracts** **独立**豁免表）
- **任务**：**`contracts/**`** **非豁免** 路径与 **`crates/**`** **共用** **母表/索引** 同批规则；**豁免** 见 **脚本头**（**test/script/lib/cache/out**、**Foundry 锁配**、**`contracts/**/*.md`**、**`contracts/run-*.sh`**、**`.generated`**）
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`bash scripts/check-pr-crates-needs-metadata.sh main HEAD`**；**04**/**脚本头** 可检索 **B-147**
- **测试**：—（**shell**；**`CRATES_METADATA_GATE_FAIL=1`** 下 **仅改 **`contracts/src/*.sol`** 无母表** 应 **exit 1** — 人工或临时 worktree 可复验）

---

### TT-B148-SSOT-METADATA-GATE-CI-REQUIRE-REFS-001

- **阶段**：SSOT · **元数据门禁 · PR CI**（**母表 B-148**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-148**；承 **B-145**/**B-146**
- **本轮仅改**：**`.github/workflows/ssot-crates-metadata-hint.yml`**（**step `env` `CRATES_METADATA_GATE_REQUIRE_REFS=1`**）；**`docs/spec/04-后端与API.md`** **零、**；**`scripts/README.md`** **Pre-TT**；**母表 B-148**、**本索引**
- **禁止再分析**：改变**本地默认** **`dev-preflight`/`check-pr-crates-needs-metadata.sh`** **unset** 行为；替代 **B-147** **`contracts/**`** 裁定；扩 **contracts 以外** 新触面
- **任务**：**PR** **`ssot-crates-metadata-hint`** **单 step** 注入 **`REQUIRE_REFS`**；**`rev-parse` base/head 失败** → **exit 2** → **job 失败**；**不**默认 **`CRATES_METADATA_GATE_FAIL`**
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**04**/**workflow** 可检索 **B-148**
- **测试**：**本地** **`CRATES_METADATA_GATE_REQUIRE_REFS=1 bash scripts/check-pr-crates-needs-metadata.sh no-such-ref-xyz HEAD`** → **exit 2**（与 **TT-B146** 验收同形）

---

### TT-B149-B110-SEQ14-GOVERNOR-PROPOSAL-STATE-CHAIN-SSOT-001

- **阶段**：governance / **B110-SEQ14** · **提案级 state 链读 SSOT**（**母表 B-149**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-149**；承 **B-141**/**B-140**/**B-142**
- **本轮仅改（v1）**：**`chain_off/governance_proposal_state_chain_vs_projection_b149.rs`**；**`chain/governor.rs`**（**`state(uint256)`** selector 稳定测）；**`admin` overview** **`overview.governor_proposal_state_chain_vs_projection_observability`**；**`internal/reconcile`** **`IndexerReconcileBody.include_governor_proposal_state_chain_vs_projection_observability`** + **`persist` `summary`**；**04 §3.4** **`indexer-reconcile`** 表行；**母表/索引** 封口注
- **禁止再分析**：弱化 **B-132 SEQ2** **公开** **`GET /api/v1/orders*`**；在 **公开** **`GET …/governance/proposals*`** 挂**第二套**业务 SSOT（与 **B-140** 封口令冲突）；**FeeRouter BPS**/**84 镜像** 无登记扩键；与 **B-172** **`proposalCount` 尾部** 混叙事
- **任务（v1）**：**`TravelTrustGovernor.state(uint256)`** **`eth_call`** vs **`governance_proposals_projection.chain_state`**；**`pending` 投影** 与链上 **`pending`/`active`/`defeated`/`succeeded`** **粗对齐**；**`queued`/`executed`/`canceled`** **严对齐**；**不**入 **`reconcile_compound_pass`**；**`compound`/`checks_total` 扩子项** **非** v1
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b149_*`**、**`tt_b110_seq14_state_uint256_selector_stable`**、**`indexer_reconcile_body_deserializes_include_governor_proposal_state_chain_vs_projection_observability`**

---

### TT-B150-110-ORDERS-CHAIN-SYNC-SNAPSHOT-CLOSE-001

- **阶段**：orders / **110 表行 · chain-sync-status**（**母表 B-150**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-150**；互证 **B-127**、**110**、**04 §3.4**
- **本轮仅改**：**`docs/spec/110`** §3.1.1 可观测表 + **§六** 能力表（**Implemented**）；**`docs/spec/04`** §3.4 **`GET …/chain-sync-status`** internal 行；**`docs/任务母表`/`AI任务卡索引`**；**`crates/api/src/routes/orders/mod.rs`** 文档句；**`orders/tests/suite.rs`** **`b150_chain_sync_status_route_and_chain_sync_core_keys_contract`**
- **禁止再分析**：改写 **B-097** **投影细终态**主叙事；**默认**新增 **`compound_gate` breakdown**；扩 **orders** 列表 **SSOT**
- **任务（封口）**：**110 §六** 与 **04** 与 **`get_order_chain_sync_status`**/**716～725**/**`GET /meta` `order_chain_sync_status`** 对齐；**不**改 handler 业务语义
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b150_chain_sync_status_route_and_chain_sync_core_keys_contract`**；既存 **716～725**/**703** 相关测

---

### TT-B151-ORDERS-CHAIN-ID-NULL-READ-ONLY-OBS-001

- **阶段**：orders / ops · **`orders.chain_id IS NULL`** **只读计数**（**母表 B-151**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-151**；互证 **B-102**（**回填/backfill** **另卡**）、**110**（**不扩 Target**）
- **数据来源**：**PostgreSQL** **`orders`** 表 — **`WHERE chain_id IS NULL`** 的 **COUNT**（**可选** **`GROUP BY`** **状态列**）；**非** **`orders_projection`** **对读**、**非** 链上第二源 — **不**构成双源 SSOT
- **与已实现重叠（开做前 diff）**：**B-102** **`orders_chain_id_backfill_dry_run`** 已含 **`orders_null_chain_id_total`**（同源 **`count_orders_chain_id_null`**）；**indexer-reconcile** 默认 **`stats`**（**`OrdersProjectionReconcileStats`**）**不含** 该项 — **本 TT** 增量须对照母表 **B-151**（**分状态桶** / **admin 专节** / **reconcile 默认嵌套**），**勿**再单独立项「仅总数」
- **与 110**：**前置观测** — 为 **110** 已登记或后续的 **`chain_id` 清理 / backfill / `DELETE`** 类 Target 提供基线；**本 TT** **不**执行 **DELETE/backfill**、**不**在 **110** 增写新 **Target** 句
- **本轮仅改（封口）**：**`crates/api/src/db/orders.rs`** **`orders_chain_id_null_observability`**；**`crates/api/src/routes/admin/mod.rs`** **`overview.orders_chain_id_null_observability`**；**`crates/api/src/routes/internal/reconcile/indexer_reconcile/`** 成功 **`200`** + **`persist` `summary`** 同键；**`docs/spec/04-后端与API.md`** §3.5 表行 + §3.4 错误码表行；**`docs/任务母表.md`**/**`docs/AI任务卡索引.md`** 封口态
- **禁止再分析**：改动 **`GET /api/v1/orders*`**；将计数挂 **`GET /meta`**；与投影/链上做**漂移对拍**并升格为 SSOT；**默认**新增 **`compound_gate` breakdown**
- **任务（封口）**：**`by_status`** 分桶 + **`orders_null_chain_id_total`**（与 **B-102** 同源）；**只读**、**无修复动作**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b151_orders_chain_id_null_obs_tests::b151_orders_chain_id_null_obs_anchor_and_by_status_shape`**

---

### TT-B152-GOVERNANCE-PROPOSALS-PROJECTION-NULL-FIELDS-OBS-001

- **阶段**：governance / ops · **projection 缺字段计数**（**母表 B-152**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**（**低风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-152**；**对拍** **Governor↔projection** 归 **B-149**；**尾部 proposalCount** 归 **B-172**
- **数据来源**：**PostgreSQL** **`governance_proposals_projection`** **单表** **`WHERE chain_id = <expected_chain_id>`** — **四桶**：**`rows_total`**（**`COUNT(*)`**）；**`rows_chain_state_null_or_blank`**（**`chain_state IS NULL OR BTRIM(chain_state) = ''`**；母表 **`state`** → **`chain_state`**）；**`rows_snapshot_block_le_0`**（**`snapshot_block <= 0`**；**NOT NULL DEFAULT 0**；母表 **`block_number`** → **`snapshot_block`**）；**`rows_operation_id_null`**（**`operation_id IS NULL`**；**v1 表无 `tx_hash`**，第三桶以 **`operation_id`** 为空计数；**`getter_note`** 写明 **非** 以太坊 **tx hash**、**Queued 前可为常态**）
- **JSON 壳**：键 **`governance_proposals_projection_null_fields_observability`**；锚 **`152-GOVERNANCE-PROPOSALS-PROJECTION-NULL-FIELDS-OBS-V1`**；**`schema_version`**=**1**；**`getter_note`**/**`boundary_vs_b149_b172`** 与实现对齐
- **是否触碰公开 API**：**否**（**仅** **`overview.*`** + **`indexer-reconcile` `200`/`persist` `summary`**）
- **gate / probe / compound**：**否**
- **本轮仅改（台账同批）**：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**零** **`crates/**`**）
- **禁止再分析**：**Governor** **对拍**（**属 B-149**）；**proposalCount 尾漂移**（**属 B-172**）；**公开** **`GET …/governance/proposals*`** 新字段；**DELETE**/backfill；弱化 **SEQ2**；与 **`orders_chain_health_observability`**（**153** 锚下 **订单域 B-151/B-152 叙事**）**混名**
- **任务（v1 封口）**：**`db::governance_proposals_projection_null_fields_observability_for_chain`**；**`GET …/admin/observability/overview`** **`overview.governance_proposals_projection_null_fields_observability`**；**`POST …/internal/indexer-reconcile`** 成功体与 **`persist:true` `summary`** 同键；**`docs/spec/04-后端与API.md`** §3.4 表行（**实现已落地**）
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**本卡仅文档**时 **不**重跑为硬性门槛；回归由前序实现轮承担）
- **测试**：**`admin_observability_overview_returns_min_snapshot_for_admin`**（无池 **`observation_note`** 分支）

---

### TT-B153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-001

- **阶段**：indexer / ops · **链头 vs DB 尾漂移**（**母表 B-153**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**（**低风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-153**
- **数据来源**：**链** — **`eth_blockNumber`**（与 **B-170** **`get_latest_block`** 同源）；**DB** — **`event_log` `MAX(block_number)`**（按 **`chain_id`**；**`db_latest_block_source`**=**`event_log_max_block_number`**）；**`drift_blocks`** = **`chain_head_block`−`db_latest_block`**（**`i64`**，可为负；**双缺** 为 **`null`**）— **并列运维指标**，**非**业务双源 SSOT；**非** **`153-ORDERS-CHAIN-HEALTH-OBS-V1`**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**
- **本轮仅改（实现已落地）**：**`db/event_log/`**（**`persist.rs`** **`event_log_max_block_number_for_chain`**）；**`routes/internal/common.rs`**；**`routes/internal/mod.rs`**（**admin 装配 wrapper**）；**`routes/admin/mod.rs`**；**`routes/internal/reconcile/indexer_reconcile/`**；**04**；**台账** **母表/索引**
- **禁止再分析**：将链头或 DB 尾 **升格**为订单/经济真值；**rewind/backfill** 在本 TT；**勿**将 **`orders_chain_health_observability`**（**B-151/B-152**）**误标** 为 **母表 B-153**
- **任务（v1）**：根键 **`indexer_head_vs_db_latest_block_drift_observability`**（锚 **`153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-V1`**；**`schema_version`**=**1**）；**`GET …/admin/observability/overview`** **`overview.*`**；**`POST …/internal/indexer-reconcile`** **`200`**/**`persist` `summary`** 同键
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b153_indexer_head_vs_db_latest_block_drift_observability_mock_rpc_and_db_max`**（**`DATABASE_URL`** 可选）；**`admin_observability_overview_returns_min_snapshot_for_admin`**（**`observation_note`**=**`database_pool_unavailable`**）

---

### TT-B154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-001

- **阶段**：indexer / ops · **reconcile 耗时与批次**（**母表 B-154**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**（**低风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-154**
- **数据来源**：**请求内** 耗时与 **`OrdersProjectionReconcileStats`** 行计数（**非**持久化第二业务真源）；**admin overview** 读 **最新** **`reconciliation_reports`** **`orders_projection_vs_orders`** **summary** 快照
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **本轮仅改**（实现已落地）：**`crates/api/src/routes/internal/reconcile/indexer_reconcile/`**、**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/db/reconciliation_reports.rs`**、**`docs/spec/04-后端与API.md`**（契约句）；**台账同批** **母表/索引** 本条
- **禁止再分析**：**fail-closed** 门闸化；替代索引器主状态机叙事；**入** **`compound_gate`**
- **任务（v1）**：根级 **`indexer_reconcile_duration_batch_stats_observability`**（锚 **`154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1`**）：**`reconcile_core_duration_ms`**（**仅** **`reconcile_orders_projection_vs_orders`**）+ **`batch_row_counts`**（**无** `samples`）；**`persist` `summary`** 同键；**overview** 同源快照或 **`no_stored_snapshot`**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b154_indexer_reconcile_duration_batch_stats_tests`**（**`indexer_reconcile/b154_stats.rs`** **`#[cfg(test)]`**）

---

### TT-B155-ORDERS-AMOUNT-CHAIN-VS-DB-DRIFT-MARKER-001

- **阶段**：orders / **对拍标记**（**母表 B-155**）
- **状态**：已封口
- **类别**：**对拍 / reconcile**（**中风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-155**；互证 **B-102**
- **数据来源**：**DB** **`orders`**（**`amount`/`currency`/`escrow_address`**）+ 链 **`Escrow.totalAmount()`**（**`eth_call`**）— **仅 drift 标记**，**非**接管 SSOT；**`persist:true` `reconciliation_reports.summary`** 与 **`POST …/internal/indexer-reconcile` `200`** 同键；**admin** **`overview.orders_amount_chain_vs_escrow_drift_observability`** 读最新 **`summary`**（无则 **`no_stored_snapshot`**）
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**
- **v1 封口说明**：**仅**支持当前 **`orders.currency`→decimals 白名单**（**USDC**/**USDT**/**USD**/**USDC.E**/**USDT.E**→**6**；**ETH**/**WETH**/**DAI**→**18**）；**未列入白名单**之 **`currency`** **不**产生 **`aligned`/`drift`**，对应抽样项一律 **`drift_marker`=`unavailable_leg`**，**`reason`=`unknown_currency_decimals`**；扩币种须**新卡/新版本**明确
- **禁止再分析**：弱化 **B-132 SEQ2**；写业务 DB / 自动修复；**DELETE**/backfill；与 **`rpc_escrow_samples`** 状态粗对拍合并叙事
- **任务（v1）**：键 **`orders_amount_chain_vs_escrow_drift_observability`**（锚 **`155-ORDERS-AMOUNT-CHAIN-VS-ESCROW-DRIFT-OBS-V1`**）；**`sampled_items[].drift_marker`**：**`aligned`****/**`drift`****/**`unavailable_leg`**；**`boundary_vs_b168`****/**`boundary_vs_b155`** 见 JSON 体
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b155_orders_amount_drift_tests`**（**`orders_amount_drift.rs`** **`#[cfg(test)]`**）

---

### TT-B156-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-001

- **阶段**：orders / ops · **链健康趋势快照**（**母表 B-156**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**（**低风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-156**；上游 **B-151/B-152** **`orders_chain_health_observability`** **标量**同源（锚 **`153-ORDERS-CHAIN-HEALTH-OBS-V1`**；**非** 母表 **B-153** 索引器漂移）
- **数据来源**：**`persist:true`** **`reconciliation_reports.summary`** **merge** + **admin `overview`** 读最新快照；**`persist:false`** **不落点**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **JSON 摘要锚字面量**：**`156-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1`**（**与仓库实现一致**；**字面量前缀与台账 B-156 对齐**）
- **本轮仅改**（台账更正）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**、**`docs/spec/04-后端与API.md`** **编号句**
- **禁止再分析**：入 **`compound_gate`**；改 **B-153** 聚合语义；扩 **公开** **`GET /api/v1/orders*`**
- **任务（v1）**：**`orders_chain_health_trend_snapshot`**（**`by_batch`/`by_day`**）；**`indexer-reconcile` `200`/`persist` `summary`** + **`overview.orders_chain_health_trend_snapshot`**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现与 **`reconciliation_reports`/`indexer_reconcile`/`admin`** 同源（**单测名以仓库为准**）

---

### TT-B157-REGION-SNAPSHOT-AND-INDEXER-TICK-COUNTERS-CLOSE-001

- **阶段**：revenue / **对拍观测** + indexer / **internal 收口**（**母表 B-157** **整卡** **v1 封口**）
- **状态**：已封口
- **类别**：**观测壳 v1**（**一壳两子项**：**RegionShareSnapshotLine**/**`region_share_snapshot_lines`** **DB 统计对拍** + **`indexer_tick` 四计数器收口**）
- **母表**：[任务母表.md](./任务母表.md) **B-157**；互证 **04** **`b157_region_snapshot_and_tick_observability`** 契约句；**子项叙事** 见下两节 **Region** / **tick**
- **封口摘要**：顶键 **`b157_region_snapshot_and_tick_observability`**（锚 **`157-B157-REGION-SNAPSHOT-AND-TICK-OBSERVABILITY-V1`**）；**`indexer_tick_counters`** 内 **`new_events`/`parsed_events`/`failed_events`/`skipped_events`** + **`legacy_parallel`**（**显式镜像** **`events_applied`/`events_new`**，**不静默更名**）；**`POST …/internal/indexer-reconcile`/`persist` `summary`** + **`GET …/admin/observability/overview`** + **`POST …/internal/indexer-tick`**；**不**入 **`compound_gate`**
- **本轮仅改**（台账同批）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**
- **验收**（实现已在前序轮完成）：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿

---

### TT-B156-B115-4-REGION-SHARE-SNAPSHOT-LINE-CHAIN-DB-RECONCILE-001

- **阶段**：revenue / **对拍观测**（**母表 B-157 · 子项 A**）
- **状态**：已封口（**并入** **`TT-B157-REGION-SNAPSHOT-AND-INDEXER-TICK-COUNTERS-CLOSE-001`** **壳内** **`region_share_snapshot_line_chain_vs_db`**）
- **类别**：**对拍 / reconcile**（**中风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-157**（**子项 A**）；互证 **B-115-4**、**P5-3**（**已封口写入** **不**改）；**索引表** 与 **子项 B** **同序号 157**
- **数据来源**：**链** **`RegionShareSnapshotLine`** + **DB** **`region_share_snapshot_lines`** — **对拍观测**，**非** **Σ/FeeRouter** 新 SSOT
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**（**若**进 **compound** **须母表补丁 + B-120 同批**）
- **本轮仅改**（台账同批）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**
- **禁止再分析**：改 **B-115**/**P5-3** **索引写入**语义；**DELETE**/篡数据
- **任务（v1 落地）**：**v1** 以 **`region_share_snapshot_lines`** **按链 SQL 聚合**（**`chain_sample`****=`null`** **默认低 RPC**）纳入 **`b157_region_snapshot_and_tick_observability`**；**可选链抽样** 留 **`chain_sample_mode`** **off_by_default**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：以仓库 **`traveltrust-api`** 实现为准

---

### TT-B157-INDEXER-TICK-RESPONSE-COUNTERS-STANDARDIZE-001

- **阶段**：indexer / **internal 响应收口**（**母表 B-157 · 子项 B**）
- **状态**：已封口（**并入** **`TT-B157-REGION-SNAPSHOT-AND-INDEXER-TICK-COUNTERS-CLOSE-001`** **壳内** **`indexer_tick_counters`** + **`indexer-tick`** 根级四键 **并行** **`events_applied`/`events_new`**）
- **类别**：**收口 / internal API**（**中风险**）
- **母表**：[任务母表.md](./任务母表.md) **B-157**（**子项 B**）；互证 **B-114-5**；**索引表** 与 **子项 A** **同序号 157**
- **数据来源**：**单次 `indexer_tick` 内计数** — **非**双源业务 SSOT
- **是否触碰公开 API**：**否**（**仅 internal**）
- **gate / probe / compound**：**默认否**
- **本轮仅改**（台账同批）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**
- **禁止再分析**：改 **B-114-5** **tick/reorg** 核心语义；新增 **公开** **`/api/v1/*`**
- **任务（v1 落地）**：**`new_events`/`parsed_events`/`failed_events`/`skipped_events`**；**`legacy_parallel`** **保留** **`events_applied`/`events_new`** **同源数值**；**04** 契约互指
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：以仓库 **`traveltrust-api`** 实现为准

---

### TT-B158-SSOT-GATE-FRONTEND-LOCKFILE-METADATA-SCOPE-001

- **阶段**：SSOT · **元数据门禁 · frontend / lockfile 扩面**（**母表 B-158**）
- **状态**：**已封口**
- **类别**：**门禁 / CI**
- **母表**：[任务母表.md](./任务母表.md) **B-158**；互证 **B-145**/**B-146**/**B-147**
- **数据来源**：**git diff 路径** — **须登记 `frontend/**`**（**`frontend_path_is_exempt`** 豁免矩阵见 **`scripts/gates/check-pr-crates-needs-metadata.sh`** 头 **「frontend 豁免」**）；**lockfile**：**`package-lock.json`**（**仓库根** 或 **`frontend/package-lock.json`**）
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**（**非** **`indexer_reconcile_compound_gate`**）
- **v1 封口（本实现）**：**同一脚本**与 **`crates/**`**/**`contracts/**`** **同轨**（**`CRATES_METADATA_GATE_FAIL` / `REQUIRE_REFS`**）；**workflow** **step 名**/**注释** 互指 **frontend/lockfile**；**04 零、**/**`scripts/README.md`** 同步；**附**：**`contracts/run-*.sh`** 由 **`[[ == contracts/run-*.sh ]]`**（**永不真**）改为 **`^contracts/run-.*\.sh$`**
- **禁止再分析**：默认打开 **`CRATES_METADATA_GATE_FAIL`**；与 **B-147** 豁免表 **混写** 导致双叙事；**无登记**再扩 **pnpm/yarn lock**（**另 TT**）
- **任务（已实现）**：**误阻断** 由 **豁免矩阵** 吸收（**i18n / 静态资源 / e2e / 单测 / fixture / story / 根工具配置**）
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`bash scripts/check-pr-crates-needs-metadata.sh main HEAD`** 可跑
- **测试**：—（**shell**；可选 **`CRATES_METADATA_GATE_FAIL=1`** 对 **含触发路径之 commit range** **验 exit 1**）

---

### TT-B159-INDEXER-GATE-CHECKS-TOTAL-DOC-TRIPLE-ALIGN-001

- **阶段**：ops · **gate 三线对齐**（**母表 B-159**）
- **状态**：已封口
- **类别**：**门禁 / CI**（**仅文档 + workflow 注释 + 常量叙述**）
- **母表**：[任务母表.md](./任务母表.md) **B-159**；互证 **110**、**07**、**`indexer-reconcile-gate.yml`**、**`internal-drill-gate.yml`**、**`scripts/ops/indexer-reconcile-probe.sh`**
- **数据来源**：**YAML + Markdown + shell**（**机读 grep/锚**）
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**核验**；**未改** **`check_anchor`** **语义**；**未** bump **`checks_total`**（**现行** **113** 与 **YAML** 已一致）
- **本轮已改**：**110 §3.1.2**/**文尾版本**；**07** **§二 2.3**/**§六 6.3B·序3**/**Version+6.5**；**`docs/spec/00-文档索引.md`** **07/110** 行；**`internal-drill-gate.yml`** 顶注释；**`scripts/README.md`**；**04** 封口标准 **`checks_total`** 句；**母表/索引** 封口态
- **禁止再分析**：无登记改 **gate** **判定**；擅自 **+1 compound** 子项
- **任务**：**`indexer-reconcile-gate`** **`checks_total`**/**`check_anchor`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **110**/**07**/**README** 同号；**`internal-drill-gate`** 标明 **无 `checks_total`**、与 **indexer-reconcile-gate** 互补
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`bash scripts/check-07-version-triple.sh`** 绿
- **测试**：无新增 **`cargo test`**（本卡 **非** 业务实现）

---

### TT-B160-CORRECTION-EXECUTOR-ROWS-OBS-001

- **阶段**：ops · **DB 观测**（**母表 B-160**）
- **状态**：**已封口**
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-160**
- **数据来源**：**PostgreSQL** — **`correction_log`**、**`executor_executions`**（**`WHERE chain_id = <配置链>`** **COUNT**；**`correction_log`** **`MAX(created_at)`**；**`executor_executions`** **`MAX(GREATEST(created_at, updated_at))`**）
- **是否触碰公开 API**：**否**（**仅** admin **`observability/overview`** + internal **`indexer-reconcile`**）
- **gate / probe / compound**：**否**（**未**并入 **`indexer_reconcile_compound_gate`/`reconcile_compound_pass`**）
- **v1 封口（登记口径）**：**`overview.correction_executor_rows_observability`** 与 **`POST …/internal/indexer-reconcile`** 成功体及 **`persist:true` `summary`** 之 **`correction_executor_rows_observability`** **同源同键**；锚 **`160-CORRECTION-EXECUTOR-ROWS-OBS-V1`**；**只读**；**非** **`correction_executor_chain_scope_rollback_dry_run`/`_execute`** **JSON**
- **本批台账同批**：**仅** **`docs/任务母表.md`**、**`docs/AI任务卡索引.md`** **封口态同步**（**禁止**本批再动业务代码）
- **禁止再分析**：**DELETE**/backfill；**fail-closed** 门闸化；**擅自**将本键 **并入** **`compound_gate`**
- **任务（已实现）**：上列 **COUNT + 最近时间** 观测 **admin + reconcile/summary** 对齐
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**实现轮**）
- **测试**：**`correction_executor_rows_observability_b160_json_shape`**；**`admin_observability_overview_returns_min_snapshot_for_admin`**（**`overview.correction_executor_rows_observability`** **无池** **`database_pool_unavailable`**）

---

### TT-B161-STAKE-LOCK-BLOCK-LAG-OBS-001

- **阶段**：indexer · **块滞后观测**（**母表 B-161**）
- **状态**：**已封口**（**v1**）
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-161**；**非** **B-153**（**非** **`event_log`** vs **RPC** **链头**）；**不**与 **B-153** 混用语义
- **口径（封口钉死）**：对 **`investor_stake_state_events`**、**`investor_lock_state_events`** **各**按 **`chain_id`** 取 **`MAX(block_number)`**；与 **`ApiMetaState.indexer_checkpoint.block_number`**（JSON **`indexer_checkpoint_block_number`**）对比；**`stake_lag_vs_checkpoint_blocks`** / **`lock_lag_vs_checkpoint_blocks`** = **`indexer_checkpoint_block_number − max`**（**表有行**时；**负**表示投影尾块高于 checkpoint）
- **暴露面（同源）**：**`GET …/admin/observability/overview`** **`overview.stake_lock_projection_block_lag_observability`** 与 **`POST …/internal/indexer-reconcile`** 成功 **`200`** 根级及 **`persist:true` `summary`** **同键同构建路径**
- **机读壳**：键 **`stake_lock_projection_block_lag_observability`**；锚 **`161-STAKE-LOCK-PROJECTION-BLOCK-LAG-OBS-V1`**；**`schema_version`**=**1**；**`getter_note`** 复述 **not B-153 / not compound_gate**
- **数据来源**：**PostgreSQL**（两表 **MAX**）+ **进程 indexer checkpoint**（**非**第二业务 SSOT）
- **是否触碰公开 API**：**否**（**仅** admin 观测与 internal reconcile）
- **gate / probe / compound**：**否**；**禁止**并入 **`compound_gate`**
- **本批台账同批**：**仅** **`docs/任务母表.md`**、**`docs/AI任务卡索引.md`** **封口态同步**（**禁止**本批再动业务代码）
- **禁止再分析**：全链扫；升格 **finality** 硬闸；与 **B-153** 合并叙事
- **任务（已实现）**：**block_lag** 只读观测 — **admin overview** + **indexer-reconcile** **`200`/`persist` `summary`**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**实现轮**）
- **测试**：**`b161_stake_lock_block_lag_json_shape`**；**`b161_tail_above_checkpoint_negative_lag`**；**`admin_observability_overview_returns_min_snapshot_for_admin`**（**`overview.stake_lock_projection_block_lag_observability`** **无池** **`database_pool_unavailable`**）

---

### TT-B162-RPC-ESCROW-SAMPLE-META-ADMIN-OBS-001

- **阶段**：ops · **样本元数据**（**母表 B-162**）
- **状态**：**已封口**（**v1**）
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-162**；互证 **B-117**/**110**（**`rpc_escrow_sample_meta`** / **`110-RPC-ESCROW-SAMPLE-META`**）
- **口径（封口钉死）**：**`GET …/admin/observability/overview`** **`overview.rpc_escrow_sample_meta`** 与 **最新** **`orders_projection_vs_orders`** **`reconciliation_reports.summary.rpc_escrow_sample_meta`** **同键同源**（只读 SELECT 最新报告 **`summary`** 字段）
- **可读条件**：**真实对象** **仅当** 曾 **`POST …/internal/indexer-reconcile`** **`persist:true`** 且 **`rpc_escrow_samples>0`** 写入 **`summary`**（与 **`200`** 根级 **`rpc_escrow_sample_meta`** 同形）；**无**该持久化键则 **无样本可读**，走占位
- **占位**：**无 DB 池** **`database_pool_unavailable`**；**无报告或 `summary` 缺键** **`no_stored_snapshot`**（**`getter_note`** 说明 **`persist`+samples**）；**查询失败** **`query_failed`**；占位均带锚 **`110-RPC-ESCROW-SAMPLE-META`**
- **是否触碰公开 API**：**否**（**仅** admin overview + internal reconcile 既有键）
- **gate / probe / compound**：**否**；**未**入 **`compound_gate`**
- **本批台账同批**：**仅** **`docs/任务母表.md`**、**`docs/AI任务卡索引.md`** **封口态同步**（**禁止**本批再动业务代码）
- **禁止再分析**：扩 **`rpc_escrow_samples`** 业务语义；另造与 **`summary`** 不一致的 **第二 SQL 真源**
- **任务（已实现）**：admin **只读** 暴露 **`rpc_escrow_sample_meta`** 快照
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**实现轮**）
- **测试**：**`admin_observability_overview_returns_min_snapshot_for_admin`**（**`overview.rpc_escrow_sample_meta`** **无池** **`database_pool_unavailable`**）

---

### TT-B164-FEE-ROUTES-VS-ROUTED-EVENTS-DRIFT-MARKER-001

- **阶段**：governance · **对拍标记**（**母表 B-164**）
- **状态**：**已封口**（**v1**）
- **类别**：**对拍 / reconcile**
- **母表**：[任务母表.md](./任务母表.md) **B-164**；**非** **B-155**/**B-157** **子项 A**（**RegionShareSnapshotLine**）
- **数据来源**：**DB** **仅**（**`fee_router_routed_events`** + 与 **`GET …/governance/fee-routes`** **同源 DESC 列表**；**无** **`eth_getLogs`** **于本标记**）
- **v1 封口口径（机读键）**：根键 **`fee_router_fee_routes_vs_routed_events_drift_observability`**（锚 **`164-FEE-ROUTES-VS-ROUTED-EVENTS-DRIFT-OBS-V1`**，**`schema_version`**=**1**）。**`fee_routes_desc_head`**：**`cursor`/`block_number`/`log_index`**，与 **`GET …/governance/fee-routes`** **同 SQL**（**reconcile 请求 `chain_id`**、**`ORDER BY block_number DESC, log_index DESC`**、**`LIMIT 1`**）。**`routed_events_aggregate`**：**`total`/`max_block_number`/`min_block_number`/`latest_inserted_at`**（**`fee_router_routed_stats`**）。**`fee_routes_chronological_tail`**：同链 **ASC** **首行**（**`fee_router_routed_oldest_row_for_chain`**）。**`checks.head_block_vs_max_block`** / **`checks.tail_block_vs_min_block`**：**`aligned`/`drift`/`n/a`**；**根级 `marker`**∈**`aligned`/`drift`/`unavailable_leg`**（**空表** **`aligned`**+**`no_rows_for_chain`**）。
- **暴露面**：**`GET …/admin/observability/overview`** **`overview.fee_router_fee_routes_vs_routed_events_drift_observability`** 与 **`POST …/internal/indexer-reconcile`** 成功 **`200`** 及 **`persist:true` `summary`** **同源同键**（**overview** 自最新 **`reconciliation_reports.summary`** **`admin_last_fee_router_fee_routes_vs_routed_events_drift_observability`**）。
- **是否触碰公开 API（v1 实现）**：**否** — **未**改 **`GET …/governance/fee-routes`** **HTTP/JSON**。
- **gate / probe / compound**：**否** — **未**入 **`compound_gate`**。
- **本轮仅改**（**台账同批**）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**
- **禁止再分析**：**FeeRouter** **新 SSOT**；**DELETE**/backfill
- **任务（已实现）**：**v1** **只读 drift marker**（上列键与 **04 §3.4** **admin/overview** + **indexer-reconcile** 行互证）
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b164_anchor_constant`**

---

### TT-B165-VAULT-FORWARDS-VS-FORWARDED-EVENTS-DRIFT-MARKER-001

- **阶段**：governance · **对拍标记**（**母表 B-165**）
- **状态**：**已封口**（**v1**）
- **类别**：**对拍 / reconcile**
- **母表**：[任务母表.md](./任务母表.md) **B-165**；**非** **B-157** **子项 A** SnapshotLine
- **数据来源**：**DB** **仅**（**`region_vault_forwarded_events`** + 与 **`GET …/governance/vault-forwards`** **同源 DESC 列表**；**无** **`eth_getLogs`** **于本标记**）
- **v1 封口口径（机读键）**：根键 **`vault_forwards_vs_forwarded_events_drift_observability`**（锚 **`165-VAULT-FORWARDS-VS-FORWARDED-EVENTS-DRIFT-OBS-V1`**，**`schema_version`**=**1**）。**`vault_forwards_desc_head`**：**`cursor`/`block_number`/`log_index`**，与 **`GET …/governance/vault-forwards`** **同 SQL**（**reconcile 请求 `chain_id`**、**`ORDER BY block_number DESC, log_index DESC`**、**`LIMIT 1`**）。**`forwarded_events_aggregate`**：**`total`/`max_block_number`/`min_block_number`/`latest_inserted_at`**（**`region_vault_forwarded_stats`**）。**`vault_forwards_chronological_tail`**：同链 **ASC** **首行**（**`region_vault_forwarded_oldest_row_for_chain`**）。**`checks.head_block_vs_max_block`** / **`checks.tail_block_vs_min_block`**：**`aligned`/`drift`/`n/a`**；**根级 `marker`**∈**`aligned`/`drift`/`unavailable_leg`**（**空表** **`aligned`**+**`no_rows_for_chain`**）。
- **暴露面**：**`GET …/admin/observability/overview`** **`overview.vault_forwards_vs_forwarded_events_drift_observability`** 与 **`POST …/internal/indexer-reconcile`** 成功 **`200`** 及 **`persist:true` `summary`** **同源同键**（**overview** 自最新 **`reconciliation_reports.summary`** **`admin_last_vault_forwards_vs_forwarded_events_drift_observability`**）。
- **是否触碰公开 API（v1 实现）**：**否** — **未**改 **`GET …/governance/vault-forwards`** **HTTP/JSON**。
- **gate / probe / compound**：**否** — **未**入 **`compound_gate`**。
- **本轮仅改**（**台账同批**）：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**
- **禁止再分析**：**Σ** 主叙事改写；**DELETE**
- **任务（已实现）**：**v1** **只读 drift marker**（上列键与 **04 §3.4** **admin/overview** + **indexer-reconcile** 行互证）
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b165_anchor_constant`**

---

### TT-B166-CHAIN-TIP-RECONCILE-META-NARRATIVE-ALIGN-001

- **阶段**：indexer · **叙事 / 探针对齐**（**母表 B-166**）
- **状态**：**已封口**（**v1**）
- **类别**：**对拍 / reconcile（文档+测）**
- **母表**：[任务母表.md](./任务母表.md) **B-166**；**非** **B-153** **`drift_blocks`** 数值卡
- **口径（封口钉死）**：**`GET /meta` → `indexer.finality_discipline.chain_tip_not_in_meta`**（**`true`**）与 **`chain_tip_hint`**（**tick / 外置 RPC** 指引）和 **`POST …/internal/indexer-reconcile`** **`include_chain_tip:true` → `chain_observation`**（**`110-RECONCILE-CHAIN-TIP`**；**`eth_chain_tip_block_number`** 同源 **单次 `eth_blockNumber`**）为 **并列运维观测叙事**；**显式非**链尖 **业务 SSOT**、**非**807 **第二套 meta tip 真源**
- **结构约束**：**不**改变 **`GET /meta`/`indexer-reconcile` 既有 JSON 结构**（封口批为 **04+110+实现注释+单测**）
- **数据来源**：**既有 JSON** + **04/110 互指句**
- **是否触碰公开 API**：**否**（**未**增删 **807** 契约键）
- **gate / probe / compound**：**否**；**未**入 **`compound_gate`**
- **本批台账同批**：**仅** **`docs/任务母表.md`**、**`docs/AI任务卡索引.md`** **封口态同步**（**禁止**本批再动业务代码）
- **禁止再分析**：将 **`chain_observation`** 升格为 **meta** 内 **per-request** tip；弱化 **807** RPC 纪律
- **任务（已实现）**：**`include_chain_tip` ↔ `chain_tip_not_in_meta`/`chain_tip_hint`** 文档与机读互证
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**实现轮**）
- **测试**：**`b166_chain_tip_meta_finality_discipline_aligns_reconcile_narrative`**；**`b166_indexer_reconcile_include_chain_tip_chain_observation_contract_keys`**

---

### TT-B167-META-INDEXER-110-04-ALIGN-001

- **阶段**：API · **807 收口**（**母表 B-167**）
- **状态**：已封口
- **类别**：**收口 / API**
- **母表**：[任务母表.md](./任务母表.md) **B-167**；**非** **B-150**/**B-157**
- **数据来源**：**`GET /meta` 实现**（**`health_meta/handlers.rs`** + **`meta_contract_keys.rs`**）+ **110 §3.1.1** + **04 §3.4（TT-B167 键序小节）** + **04 §3.1** 长表互指句
- **是否触碰公开 API**：**是（`GET /meta`）** — **仅** **`indexer.rule`** **字符串** **与** **文档** **对读**（**JSON 键树不变**）
- **gate / probe / compound**：**否**（**未**接 **compound gate**）
- **本轮仅改（台账同批）**：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**零** **`crates/**`**）
- **禁止再分析**：弱化 **B-127**；新增 **orders** 807 键；**改** **`GET /meta` `indexer.*`** **JSON 形状**
- **任务（v1 封口）**：**`indexer.*`** 子树键序与 **`INDEXER_META_TOP_KEYS`**（**727**）、**`FINALITY_DISCIPLINE_META_TOP_KEYS`**（**726**）、**`INDEXER_MEMORY_META_TOP_KEYS`**（**757**）、**`INDEXER_CHECKPOINT_META_TOP_KEYS`**（**758**）**同源**；**04 §3.4**、**110 §3.1.1** **TT-B167** 行及 **`indexer.rule`** **TT-B167** **互指**；**未**改 **JSON 结构**；**未**改 **compound**；**实现轮** **文案 + 单测断言收口**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**实现轮**）；**台账同批** **不强制** 重跑
- **测试**：**`health_meta/tests.rs`** **`GET /meta` · `indexer`** 拓扑与 **`indexer.rule`** **含 `TT-B167`**（**以仓库为准**）

---

### TT-B168-ESCROW-STATUS-CHAIN-VS-DB-DRIFT-MARKER-001

- **阶段**：orders · **对拍标记**（**母表 B-168**）
- **状态**：已封口
- **类别**：**对拍 / reconcile**
- **母表**：[任务母表.md](./任务母表.md) **B-168**；互证 **B-097**；**非** **B-150**（HTTP 路由）
- **数据来源**：**chain** **`chain::get_escrow_status`**（**`factory.escrowOf` + `escrow.status()`**）之 **粗终端标签** ↔ **`orders.status`**（**`chain_off::reconcile_order_chain_vs_db`** / **`terminal_escrow_label_for_reconcile`**）；**DB 抽样** **仅** **`orders`**（**已填 `escrow_address`**）
- **抽样规则**：**`list_orders_with_escrow_id_status_limit`** — **`escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''`**；**`ORDER BY updated_at DESC NULLS LAST`**；**`sample_limit_applied`**=**10**；**reconcile 成功路径恒算**，**不**依赖 **`rpc_escrow_samples`** body
- **根级 `marker` 优先级**：**`drift` > `unavailable_leg` > `aligned`**（与 **`drift_count`/`unavailable_leg_count`** 聚合一致）；**`sampled_items[].drift_marker`**∈**`aligned`/`drift`/`unavailable_leg`**
- **暴露面**：**`escrow_status_chain_vs_orders_drift_observability`**（锚 **`168-ESCROW-STATUS-CHAIN-VS-ORDERS-DRIFT-OBS-V1`**；**`schema_version`**=**1**）；**`POST …/internal/indexer-reconcile`** **`200`**/**`persist:true` `summary`**；**`GET …/admin/observability/overview`** **`overview.*`** 自 **`reconciliation_reports.summary`**（**`admin_last_escrow_status_chain_vs_orders_drift_observability`**）**同键只读**
- **与 B-155**：**仅** **`boundary_vs_b155`**（本键体）/**`boundary_vs_b168`**（**B-155** 体）**互指** — **不**混用 **`sampled_items`**、**不**合并金额与 escrow 枚举态叙事
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **本轮仅改（台账同批）**：**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**（**零** **`crates/**`**）
- **禁止再分析**：接管 **53** 状态机；**DELETE**/backfill；与 **B-155** **`orders_amount_chain_vs_escrow_drift_observability`** **混读为同一对拍**；依赖 **`rpc_escrow_samples`** 才产出本键
- **任务（v1 封口）**：见 **母表 B-168** **v1 封口**段与 **`escrow_status_chain_vs_orders_drift.rs`**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿（**本卡仅文档**时 **不**强制重跑）
- **测试**：**`b168_escrow_status_chain_vs_orders_drift_tests`**；**`admin_observability_overview_*`** 对 **`overview.escrow_status_chain_vs_orders_drift_observability`** 分支（以仓库为准）

---

### TT-B169-INDEXER-REORG-SENTINEL-OBS-001

- **阶段**：indexer · **reorg 哨兵观测**（**母表 B-169**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-169**；互证 **B-114-5**；**非** **B-157**/**B-153**
- **数据来源**：**indexer 运行时 + 最近 tick / 同源错误体**（**或** **只读**聚合 — **TT** 钉死）
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：改 **B-114-5** **reorg** 核心语义；自动 **rewind**；**DELETE**
- **任务（占位）**：**reorg_suspected** / hash mismatch **只读汇总** — **admin** + **reconcile**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B170-INDEXER-FINALITY-WINDOW-TRIPLE-OBS-001

- **阶段**：indexer · **finality 窗口观测**（**母表 B-170**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-170**；互证 **B-127**；**非** **B-153**/**B-166**
- **数据来源**：**RPC chain_tip** + **进程内 checkpoint** + **`FINALITY_N`**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：弱化 **B-127**；改 **`eth_getLogs`** 上界算法
- **任务（占位）**：**tip / finalized_to_block / last_indexed** 同源并列
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B171-MULTI-CHAIN-DB-CHAIN-ID-FOOTPRINT-MATRIX-OBS-001

- **阶段**：cross-chain · **DB 链维度足迹**（**母表 B-171**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-171**；互证 **B-176**（**统一壳**）；**非** **B-151**（NULL 专卡）/**B-161**
- **数据来源**：**PostgreSQL** — **`DISTINCT chain_id`** + 计数（**表清单 TT 钉死**）
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：**backfill**；**DELETE**；双源业务 SSOT；与 **B-176** **各挂一套** **平行顶层** **matrix JSON**（**须** 遵守 **本节上文** **Batch-3 · 观测类防重复规则**）
- **任务（占位）**：与 **B-176** 共用 **`multi_table_chain_observability`（名可 TT 钉）** **壳内** 行 — **`chain_config.chain_id`** **并列只读**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B172-GOVERNOR-PROPOSAL-COUNT-CHAIN-VS-PROJECTION-DRIFT-001

- **阶段**：governance · **粗对拍**（**母表 B-172**）
- **状态**：已封口
- **类别**：**对拍 / reconcile**
- **母表**：[任务母表.md](./任务母表.md) **B-172**；**细态**归 **B-149**；**非** **B-152**
- **数据来源**：**chain** **`proposalCount()`**（或等价）+ **DB** **`governance_proposals_projection`**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**（**compound** **须 B-120**）
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：替代 **B-149**；扩公开 **proposals*** **SSOT**；**DELETE**/backfill
- **任务（占位）**：**尾部计数/缺口** **drift** 标记 — **admin** + **reconcile**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B173-TIMELOCK-DELAY-CHAIN-VS-META-BUNDLE-ALIGN-001

- **阶段**：governance · **Timelock 参数镜像**（**母表 B-173**）
- **状态**：已封口
- **类别**：**观测 / 收口（admin + 文档）**
- **母表**：[任务母表.md](./任务母表.md) **B-173**；**Timelock/delay** **子域**；**非** **B-149**/**SEQ9** 地址对拍本体；**非** **B-167**（**`indexer.*`**）
- **数据来源**：**chain** **`delay()`**（**`getMinDelay()`** 口径映射）+ **`GET /meta` `governance.timelock_delay_observability`** **同源构建**（**`include_timelock_delay_meta_mirror_observability`** → **`timelock_delay_meta_mirror_observability`**）
- **是否触碰公开 API**：**否**（**实现轮** **未**改 **`GET /meta`** 形状；**仅** **internal reconcile** 可选块）
- **gate / probe / compound**：**否**（**不**扩 **compound**；**SEQ6** **`timelock_delay_ssot_ops_check`** **不变**）
- **本轮仅改**：（**本登记卡** **`docs/任务母表.md`** + **`docs/AI任务卡索引.md`** — **封口态对读**）
- **禁止再分析**：擅自 bump **`GOVERNANCE_META_TOP_KEYS`** **无 04 同批**；改链上 Timelock 语义；与 **B-177** **重复铺** **同一 delay 叙事** **无边界句**
- **任务**：**reconcile** 可选 **`timelock_delay_meta_mirror_observability`**（**锚** **`173-GOVERNANCE-TIMELOCK-DELAY-META-MIRROR-OBS-V1`**）；**与 B-177** **807 字段表收口** **正交**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`b173_obs_anchor_when_chain_off_unmounted`** · **`indexer_reconcile_body_deserializes_include_timelock_delay_meta_mirror_observability`**

---

### TT-B174-INDEXER-TICK-FAIL-SKIP-BUCKET-OBS-001

- **阶段**：indexer · **失败/跳过 分桶**（**母表 B-174**）
- **状态**：已封口
- **类别**：**观测 / internal**
- **母表**：[任务母表.md](./任务母表.md) **B-174**；**非** **B-157** 四计数 **总额**；**非** **B-154**
- **数据来源**：**单次 tick 内** 计数器（**kind/reason** 维度）
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：改 **B-114** 解析 **硬边界**
- **任务（占位）**：**failed_events**/**skipped_events** **分桶** 嵌套
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B175-RPC-CHAIN-ID-VS-CONFIG-PROBE-RECONCILE-001

- **阶段**：cross-chain · **链身份探针**（**母表 B-175**）
- **状态**：已封口
- **类别**：**观测 / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-175**；**非** **B-166**/**B-171**
- **数据来源**：**RPC** **`eth_chainId`**（或 **TT** 钉死等价）+ **配置 `chain_id`**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**默认否**
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：单卡升格 **多进程多链** **架构 SSOT**
- **任务（占位）**：**reconcile**（**可选 admin**）嵌套 **对读** **drift**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B176-PER-TABLE-INDEXED-TAIL-BY-CHAIN-MATRIX-OBS-001

- **阶段**：indexer · **多表尾块矩阵**（**母表 B-176**）
- **状态**：已封口
- **类别**：**观测 / admin / ops**
- **母表**：[任务母表.md](./任务母表.md) **B-176**；互证 **B-171**（**统一壳**）；**非** **B-153**/**B-161**
- **数据来源**：**PostgreSQL** — **按表按 `chain_id` 之 `MAX(block_number)`**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **本轮仅改**：（实现轮填写）
- **禁止再分析**：**backfill**；**DELETE**；**孤立** **`max_block_*`** **顶层键族**（**须** 并入 **B-171** 同行 **`multi_table_chain_observability` 壳**）
- **任务（占位）**：**admin** + **reconcile** — **壳内** **MAX 尾块** 行/列
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：实现轮单测名待填

---

### TT-B177-META-GOVERNANCE-CHAIN-ALIGNMENT-04-110-ALIGN-001

- **阶段**：API · **807 治理与链对齐收口**（**母表 B-177**）
- **状态**：已封口
- **类别**：**收口 / API**
- **母表**：[任务母表.md](./任务母表.md) **B-177**；**`governance.*` + pool** **子域**；**非** **B-167**（**indexer.***）；**非** **B-144** 否决议题；**非** **B-149** **逐提案** SSOT
- **数据来源**：**`GET /meta`** + **`GET …/governance/pool`** + **`pool_chain_alignment_hint`** + **`ApiMetaState.chain_config`** + **04/110**
- **是否触碰公开 API**：**否**（**未改** **`GET /meta`** **JSON 形状**；**807** **根键序** **由测** **锁**）
- **gate / probe / compound**：**否**
- **本轮仅改**（**实现已落地**）：**`health_meta/meta_contract_keys.rs`** **`governance_object_keys_match_contract_807`**；**`governance/governance_pool_meta_alignment_b177.rs`**；**`internal/reconcile/body.rs`** + **`indexer_reconcile/`** **可选** **`include_governance_pool_meta_chain_alignment_observability`** → **`governance_pool_meta_chain_alignment_observability`**；**`health_meta/tests.rs`**、**`internal/tests/suite_late.rs`**、**`governance/mod.rs`**
- **禁止再分析**：弱化 **B-132 SEQ2**；**per-request** **807** **RPC 风暴**；与 **B-173** **混写** **Timelock delay** **无互指**
- **任务**：**807** **`governance`** 对象 **根键序** 与 **`GOVERNANCE_META_TOP_KEYS`** **一致**（**测** **`governance_object_keys_match_contract_807`**）；**reconcile** **可选** **锚** **`177-GOVERNANCE-POOL-META-CHAIN-ALIGNMENT-OBS-V1`** **对读** **`chain_id` / `fee_router_address`**（**meta 配置腿** vs **pool hint 腿**）；**不**进 **compound_gate**
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`meta_chain_contracts_759_when_chain_config_present`**（**807 键序**）；**`b177_obs_anchor_and_chain_id_equal_without_config`**；**`indexer_reconcile_body_deserializes_include_governance_pool_meta_chain_alignment_observability`**

---

### TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V1-CLOSE-001

- **阶段**：ops / admin · **Observability 阈值告警 v1**（**母表 B-188**）
- **状态**：已封口
- **类别**：**观测 / admin / internal · 只读**
- **母表**：[任务母表.md](./任务母表.md) **B-188**；上游 **B-153**/**B-155**/**B-157** **快照 JSON**；**非** **B-178** Phase Close；**编号** **B-188** **避开** **附录 B** **建议** **B-179～B-186** **与** **`docs/00-文档索引.md`** **文首「B-179」** **导航俗称**
- **封口摘要**：**`GET …/admin/observability/overview`** — **`overview.alerts.active`/`sev1`/`sev2`** **与** **`overview.observability_alerting_v1.alert_summary`** **同源计数**；**`observability_alerting_v1`** **含** **`alert_summary`** + **`last_fired`**（**v1 基线**：**`last_fired`** **以进程内内存为主**）。**`POST …/internal/indexer-reconcile`** — **仅** **`include_observability_alerting_v1:true`** 时 **200** 与 **`persist:true` `summary`** **带** **`observability_alerting_v1`**；**默认** **不带**。**前端** **`/admin/observability`** — **仅** **JSON** **展示**，**无** **业务动作**。**v2** — **见** **索引 · 193** / **`### TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V2-CLOSE-001`**。**v3**（**`schema_version`**=**3**、**`rules_config`**、**`GET …/admin/observability/alert-rules`**、**ENV+DB 阈值覆盖**、**迁移 `20260427000056`**）**已封口** — **见** **索引 · 194** / **`### TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V3-CLOSE-001`**。
- **是否触碰公开 API**：**否**（**admin/internal** **只读**）
- **gate / probe / compound**：**否**
- **本轮仅改**（**实现已落地**）：**`observability_alerting_v1.rs`**；**`admin/mod.rs` overview**；**`reconcile/body`/`indexer_reconcile`**；**`state` `observability_alert_rule_last_fired`**；**admin/internal 测**；**`frontend/.../observability/page.tsx`** + **locales**；**04** **契约句**
- **禁止再分析**：自动修复；扩 **公开** **`GET /api/v1/*`** **业务** 契约；**`observability_alerting_v1`** **入** **`compound_gate`**
- **验收**：**`cargo test -p traveltrust-api`** 绿
- **测试**：**`admin_observability_overview_returns_min_snapshot_for_admin`**（**alerts** **与** **`alert_summary`** **对齐**）；**`indexer_reconcile_body_deserializes_include_observability_alerting_v1`**；**`observability_alerting_v1`** 模块 **`#[cfg(test)]`**

---

### TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V2-CLOSE-001

- **阶段**：ops / admin · **Observability 阈值告警 v2（持久化 + 去抖）**（**母表 B-188**）
- **状态**：已封口
- **类别**：**观测 / admin / internal · 只读**（**非**业务 API；**非**自动修复；**不**入 **compound_gate**）
- **母表**：[任务母表.md](./任务母表.md) **B-188**；上游 **B-153**/**B-155**/**B-157** **快照 JSON** 与 **v1** 同源；**v1 基线封口** 见 **索引 · 192** / **`### TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V1-CLOSE-001`**
- **封口摘要**：**`observability_alerting_v1`** 响应键名不变；**v2 代际** 下 **JSON** 曾钉 **锚** **`OBSERVABILITY-THRESHOLD-ALERTS-V2`** / **`schema_version`**=**2**；**现行实现** 已叠 **v3**（**锚** **`OBSERVABILITY-THRESHOLD-ALERTS-V3`** / **`schema_version`**=**3**）— **见** **索引 · 194**。**cooldown 去抖**：按 **`TRAVELTRUST_ALERT_V2_COOLDOWN_SECS`**（默认 **300s**）相对 **`last_dedup_emit_at`** 决定是否追加 **`observability_threshold_alert_events`** 行；**`recent_events`** 受 **`TRAVELTRUST_ALERT_V2_HISTORY_LIMIT`** 约束。**双模式**：**有 PgPool** 时 **`persist.storage`**=**`postgresql`**（**`last_fired_at`**/**`last_dedup_emit_at`** 落 **`observability_threshold_alert_rule_state`**）；**无 PgPool** 时 **`memory_only`**。**上线前须执行迁移 `crates/api/migrations/20260426000055_observability_threshold_alert_v2.sql`**（**`20260426000055`**）；未迁移且有池时 **`persist.write_errors`** 可见、持久化 best-effort 失败不影响 **200** 只读路径。**`GET …/admin/observability/overview`** 与 **`POST …/internal/indexer-reconcile`**（**`include_observability_alerting_v1:true`**）与 **v1** 门禁一致（**仅扩 JSON 字段**）。
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **本轮仅改（实现已落地 · 互证）**：**`observability_alerting_v1.rs`**；**`db/observability_threshold_alerts.rs`**；**迁移 `20260426000055_*`**；**`admin/mod.rs`/`indexer_reconcile/`**；**04**；**前端 observability 注释**；**测** **`observability_alerting`**/**`admin_observability_overview`**
- **禁止再分析**：同 **192**（自动修复、公开业务契约、**compound**）
- **验收**：**`cargo test -p traveltrust-api`** 绿（或 **`observability_alerting`** + **`admin_observability_overview`** 子集）；**04** **admin/reconcile** 契约句 **互指**
- **测试**：**`alerting_schema_v3_memory_only_without_pool`**（**v3** 代际）；**`admin_observability_overview_returns_min_snapshot_for_admin`**（**`schema_version`**/**`persist.storage`**）；**`indexer_reconcile_body_deserializes_include_observability_alerting_v1`**

---

### TT-B188-OBSERVABILITY-THRESHOLD-ALERTS-V3-CLOSE-001

- **阶段**：ops / admin · **Observability 阈值告警 v3（规则配置化 + 阈值外置）**（**母表 B-188**）
- **状态**：已封口
- **类别**：**观测 / admin / internal · 只读**（**非**业务 API；**非**自动修复；**不**入 **compound_gate**）
- **母表**：[任务母表.md](./任务母表.md) **B-188**；**v1**/**v2** 互证 **索引 · 192**/**193**
- **封口摘要**：**`observability_alerting_v1`** **JSON** **锚** **`OBSERVABILITY-THRESHOLD-ALERTS-V3`**；**`schema_version`**=**3**；嵌 **键** **`rules_config`**（**锚** **`OBSERVABILITY-THRESHOLD-ALERT-RULES-CONFIG-V1`**；**`schema_version`**=**1**）：**`config_source`** **`env`** / **`env_and_database`**（**`observability_threshold_alert_config`** **`id=1`** **`thresholds` JSON** 覆盖 **ENV** 可调项）；**`config_fingerprint`**；**`effective_thresholds`**；**`rules_catalog`**；**`database_overlay`**（**`config_version`**/**`updated_at`**）；**`threshold_env_keys`**/**`threshold_db_json_keys`**。**新增** **`GET /api/v1/admin/observability/alert-rules`**：**`200`** 体 **`rules_view`** 与 **`overview.observability_alerting_v1.rules_config`** **同源装配**；审计 **`admin.observability.alert_rules.read`**。**上线前须执行迁移 `crates/api/migrations/20260427000056_observability_threshold_alert_config.sql`**（**`20260427000056`**）；**无行** 时等价 **纯 ENV**。**`POST …/internal/indexer-reconcile`** **`include_observability_alerting_v1:true`** 时 **persist `summary`** 与 **admin overview** **同形** 含 **`rules_config`**。
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**
- **本轮仅改（实现已落地 · 互证）**：**`observability_alert_threshold_config.rs`**；**`observability_alerting_v1.rs`**；**`db/observability_threshold_alerts.rs`**；**迁移 `20260427000056_*`**；**`admin/mod.rs`**（**`GET …/observability/alert-rules`**）；**`indexer_reconcile/handler.rs`**（注释）；**04**；**`frontend/.../observability/page.tsx`**/**`api.ts`**/**locales**；**测** **`observability`**/**`admin_observability_alert_rules_*`**
- **禁止再分析**：同 **192**（自动修复、公开业务契约、**compound**）
- **验收**：**`cargo test -p traveltrust-api`** 绿（或 **`observability`** + **`admin_observability_*`** 子集）；**04** **admin/reconcile** **互指**
- **测试**：**`merge_db_thresholds_overrides_env_defaults`**；**`admin_observability_alert_rules_returns_rules_view_for_admin`**；**`alerting_schema_v3_memory_only_without_pool`**

---

### TT-B178-PHASE-CLOSE-INDEXER-RECONCILE-OBSERVABILITY-001

- **阶段**：process · **Phase Close · indexer/reconcile/observability 切片**（**母表 B-178**）
- **状态**：已封口
- **类别**：**全链路一致性证明 / docs-only**
- **母表**：[任务母表.md](./任务母表.md) **B-178**；**前置条件**：**B-147～B-177** **均已封口**
- **产出**：[Phase-Close-Indexer-Reconcile-Observability-Alignment.md](./Phase-Close-Indexer-Reconcile-Observability-Alignment.md)
- **与主 TT 关系**：**不** 替代 **主规划** **五节表**（**已封口** → [**Phase-Close-Docs-Code-Reorg-Plan-B178.md**](./Phase-Close-Docs-Code-Reorg-Plan-B178.md)）；**切片** **仅** **轴线对齐证明**
- **是否触碰公开 API**：**否**
- **gate / probe / compound**：**否**（**不** 扩 compound 叙事）
- **本轮仅改**：**`docs/Phase-Close-Indexer-Reconcile-Observability-Alignment.md`**、**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**、**`docs/Execution-Batch-Archive-B147-B177.md`**（**零** **`crates/**`**）
- **禁止再分析**：**新增** 观测键 / **改** **JSON**；**以切片代主规划** **回避** **五节表**（**主 TT** **已另封**）
- **任务（v1 封口）**：**汇总** **三轴** **最终对齐状态**；**互证** **04/110/Runbook/归档**；**纳入** **B-188** **observability** **邻域**
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：—

---

### TT-B178-PHASE-CLOSE-DOCS-CODE-REORG-PLAN-001

- **阶段**：process · **阶段收口（Phase Close · 规划门禁）**（**母表 B-178**）
- **状态**：已封口
- **类别**：**规划 / 门禁（非 Batch-4）**
- **母表**：[任务母表.md](./任务母表.md) **B-178**；**前置条件**：**B-147～B-177** **对应 TT 均已封口**；**indexer/reconcile/observability 切片证明** → [**195**](#tt-b178-phase-close-indexer-reconcile-observability-001)（**已封口**）
- **产出（钉死路径）**：[Phase-Close-Docs-Code-Reorg-Plan-B178.md](./Phase-Close-Docs-Code-Reorg-Plan-B178.md)（**五节结构化表 + 附录 A/B**）
- **数据来源**：**全仓文档 + 目录树**（**只读盘点**）；**无** 新业务真源
- **是否触碰公开 API**：**否**（**规划轮默认**）
- **gate / probe / compound**：**否**
- **本轮仅改（封口轮）**：**新增** **`docs/Phase-Close-Docs-Code-Reorg-Plan-B178.md`**；**更新** **`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**、**`docs/Phase-Close-Indexer-Reconcile-Observability-Alignment.md`**、**`docs/Execution-Batch-Archive-B147-B177.md`**（**互指与状态**）；**零** **`crates/**`**
- **禁止再分析**：**任何** **`crates/**`** **业务逻辑 diff**；**改** **04** **公开契约句**（**除非** 用户另令 **合 04 门禁**）；**写** **Rust/TS** **实现**；**无清单** **大单** 拆 **`internal`/`admin`/`chain_off`**；**与 B-147～B-177** **混在一张 PR** **无边界**；**跳过** **按批小收敛** **直接** **全仓重写**；**以「整理」为名** 在 **本卡** **内** **顺手改代码结构**
- **任务（已交付）**：**五节 + 附录 A/B** **已写入** **产出**；**B-179～B-186** **母表已登记** **且** **附录 B 执行向** **212～216** **均已封口**（**含** [**216 / B-186**](#tt-b186-b166-narrative-probe-docs-tests-001) **2026-04-14**）；**P 轨** → [**196 / B-179**](#tt-b179-docs-canonical-entry-dedup-001) · [**197 / B-180**](#tt-b180-batch-archive-anchor-toc-001) · [**198 / B-181**](#tt-b181-internal-routes-observability-dir-split-001) · [**212～216**](#任务卡一览按阶段排序) **Phase Close 附录 B** **齐**。

**已定稿正文**：完整填表 **见** **[Phase-Close-Docs-Code-Reorg-Plan-B178.md](./Phase-Close-Docs-Code-Reorg-Plan-B178.md)**。**以下为** **蓝图模板**（**索引长期保留 · 与他卡对照用**）。

**强制产出结构（蓝图 · 原样建表模板）**

**1）文档归类结果**

| **文档路径**（仓库相对路径） | **角色**（母表 / 索引 / 规范 / Runbook / 领域 SSOT） | **是否存在重复入口**（yes/no + 简述） | **是否需新增总入口索引**（yes/no + 建议文件名） |
|------------------------------|------------------------------------------------------|----------------------------------------|--------------------------------------------------|
| （逐行填） | | | |

**2）Batch 归档视图**（**每批一段** — **Batch-1 / Batch-2 / Batch-3** 各 **至少一行**）

| **批次编号** | **覆盖 B 范围** | **已形成能力**（要点列举） | **未覆盖边界** | **对后续影响** |
|--------------|-----------------|----------------------------|----------------|----------------|
| Batch-1 | B-147～B-157 | | | |
| Batch-2 | B-158～B-162，B-164～B-168 | | | |
| Batch-3 | B-169～B-177 | | | |

**3）代码模块化规划**

| **目标模块**（如 `routes/internal` 拆分） | **当前文件路径** | **拆分方案**（子文件 / 子目录 / `mod` 草案） | **是否必须执行**（yes/no） |
|------------------------------------------|------------------|---------------------------------------------|---------------------------|
| （逐行填） | | | |

**4）脚本分类规划**

| **当前分类问题**（一句） | **拟分目录结构**（例：`scripts/gates/`、`scripts/ops/`、`scripts/dev/`） | **是否需要 README 互指**（yes/no） |
|--------------------------|--------------------------------------------------------------------------|-------------------------------------|
| | | |

**5）模块化门槛（规则 · 写入规划即生效为团队约定）**

| **规则项** | **阈值或表述** |
|------------|----------------|
| **单文件行数** | 建议 **400～600** 行 **评估拆分**（**可据仓库调整**，**本表须写明选用值**） |
| **同目录同类源文件数** | **>5** **评估子目录** |
| **同一能力跨层数** | **≥4** 层（例：routes / chain_off / db / scripts）**须补骨架说明** |
| **JSON / 观测结构** | **同维度禁止平行顶层对象**；**B-153 / B-170 / B-171+B-176 matrix 壳** **须扩展而非再造**（**互证** **Batch-3 观测批 B-169～B-177 已封口** · **防重复规则仍约束 B-178 后扩展**）；**壳字段细则** **见下** **附录 A** |

**附录 A · 统一观测 JSON 壳字段草案（规划补强 · 可修订）**

**用途**：**admin / internal reconcile** 嵌套 **观测** 时 **统一形态**，避免 **B-153 / B-170 / B-171 / B-176** 与 **B-166** 相关能力 **各挂一套顶层 JSON**。**非** **04 契约**；**非** **807 必出字段**；**实现轮** 可 **改名** **须** **母表+TT 钉死**。

**建议顶层对象名（择一作为 reconcile 嵌套根键）**：**`indexer_observability_v1`**（或 **`chain_observability_bundle_v1`** — **全仓唯一根键**，**禁止** 同响应内 **再并列** **`head_drift_v2`** + **`matrix_v1`** **两枚同级兄弟** 表达 **同一链维度的块高/水位**。）

**建议顶层字段（与实现对齐时允许增减，但须遵守「禁止同维重复」）**：

| **字段名（建议）** | **语义** | **主要覆盖母表** |
|--------------------|----------|------------------|
| **`schema_version`** | **壳版本**（**semver 或整数**） | 全壳 |
| **`observed_at`** | **生成时间**（**RFC3339**） | 全壳 |
| **`chain_context`** | **单链上下文**（**见下对象**） | **B-175**、matrix 行 |
| **`head_and_finality`** | **链头 / DB 尾 / finality 三水线** | **B-153**、**B-170** |
| **`multi_table_chain_matrix`** | **按表按链矩阵**（**见下**） | **B-171**、**B-176** |
| **`narrative_alignment`** | **叙事/纪律对齐探针**（**非数值 SSOT**） | **B-166** |
| **`extensions`** | **带命名空间的未来扩展**（**`{ "fee_routes": … }`**） | **其它** **正交** 域 |

**`chain_context` 最小字段**：**`config_chain_id`**、**`rpc_reported_chain_id`**（**可选**）、**`aligned`**（**bool**）。

**`head_and_finality` 最小字段**（**B-153 + B-170 合一扩展，禁止另起同级 `drift_only` 块**）：

| **字段名（建议）** | **语义** | **命名边界** |
|--------------------|----------|--------------|
| **`chain_head_block`** | **RPC 链尖** | **非** **`lag_*`** |
| **`db_latest_block`** 或 **`indexer_watermark_block`** | **DB 或索引器已确认尾块**（**口径 TT 钉**） | **`watermark_*` = 单源游标**；**非** 与 **`chain_head`** 的差 |
| **`drift_blocks`** | **`chain_head − db_latest`（或等价）** | **仅** **`drift_*`** 表 **两足之差** |
| **`chain_tip`** | **与 tick 同源 tip**（**若与 head 重复则二选一**） | **禁止** 第三枚 **同义 tip** |
| **`finalized_upper_bound`** | **`to_block` / finality 裁剪上界** | **`lag` 语义**：相对 tip **深度**；**字段名** 用 **`finalized_*`** / **`upper_bound_*`** |
| **`last_indexed_block`** | **进程内或持久化 checkpoint** | **`watermark`** 类 **与** **`db_latest`** **关系** **须在 TT 写明** |
| **`finality_n`** | **FINALITY_N** | — |

**`multi_table_chain_matrix` 最小公共结构**：**`rows`** 为 **数组**；**每行** **至少**：**`table`**、**`chain_id`**、**`row_count`**（**可选**）、**`max_block_number`**（**可选**）、**`distinct_chain_ids_hint`**（**可选 · B-171**）、**`notes`**（**可选**）。**禁止** 在 **壳外** 再挂 **`per_table_max_block`** **平行顶层**。

**`narrative_alignment`（B-166）**：**只放「互指/探针」布尔或枚举**，例：**`include_chain_tip_available`**、**`meta_chain_tip_discipline_documented`**、**`reconcile_includes_chain_tip_echo`** — **不** 与 **`head_and_finality.chain_tip`** **重复存第三份链尖真值**。

**禁止**：**同一 `(语义维度: 链上块高 vs DB 尾 vs finality 上界)`** 出现 **≥2 个同级顶层键**。**应扩展既有壳**：**B-153**、**B-170**、**B-171**、**B-176**、**B-166** **全部** **归入** **`indexer_observability_v1`** **子对象**。**允许新壳**：**与「块高/matrix」正交** 的域（**治理 fee-routes**、**订单 escrow drift** 等）— **须** **不同根键** + **TT 写明不与上壳同维**。

---

**附录 B · B-179～B-186 清单（与母表对齐 · 真值见母表续表）**

**说明**：**B-179～B-186** **已在** **[任务母表.md](./任务母表.md)** **占行**；**B-179** → [**196**](#任务卡一览按阶段排序) / [**正文**](#tt-b179-docs-canonical-entry-dedup-001)；**B-180** → [**197**](#任务卡一览按阶段排序) / [**正文**](#tt-b180-batch-archive-anchor-toc-001)；**B-181** → [**198**](#任务卡一览按阶段排序) / [**正文**](#tt-b181-internal-routes-observability-dir-split-001)；下表 **保留** **依赖 / 必须执行** **规划语义**。

| **建议 B 号** | **标题** | **来源（B-178 五节之一）** | **目标范围** | **必须执行** | **预估改动类型** | **依赖关系** |
|---------------|----------|----------------------------|--------------|--------------|------------------|--------------|
| **B-179** | **文档总入口与重复入口消解** | **1）文档归类** | **`docs/`** 总索引 + **同主题多入口** 表 | **yes** | **docs-only** | **无** |
| **B-180** | **Batch-1/2/3 归档页落地** | **2）Batch 归档** | **`docs/`** 三页或 **单文件三章** | **yes** | **docs-only** | **依赖** **B-179** **索引锚点** |
| **B-181** | **`routes/internal` 职责拆分** | **3）代码模块化** | **`crates/api/src/routes/internal*.rs`** | **yes** | **code reorg** | **依赖** **B-178** **「3）代码模块化」表行**；**建议** **晚于** **B-180** |
| **B-182** | **`routes/admin` observability 拆分** | **3）代码模块化** | **`admin.rs` / overview** | **no** | **code reorg** | **依赖** **B-181** **或** 与其 **并行**（**TT 裁断**） |
| **B-183** | **`chain_off` 子目录分组** | **3）代码模块化** | **`crates/api/src/chain_off/`** | **no** | **code reorg** | **依赖** **B-178** **「3）代码模块化」表** |
| **B-184** | **`scripts` 分类与 README** | **4）脚本分类** | **`scripts/`**、`scripts/README` | **yes** | **scripts** + **docs-only** | **可与** **B-179** **并行** |
| **B-185** | **统一观测壳实现与嵌套迁移** | **附录 A** + **5）门槛** | **internal/admin reconcile JSON** | **yes** | **code reorg**（**+** **可选 docs**） | **依赖** **B-147～B-177** **相关 TT 已封口**；**建议** **晚于** **B-181** **或** **与之同批**（**TT 钉**） |
| **B-186** | **B-166 叙事与探针字段收口** | **附录 A** **`narrative_alignment`** | **110/04 互指句 + 测** | **no** | **docs-only** + **测试** | **依赖** **B-167**、**B-166** **状态** |

**验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**规划文件** **含齐上列五节表**（**允许空单元格但不得缺表**）、**与母表 B-178** / **本节** **互指无断链**；**另附** **建议的 B-179～** **小卡清单**（**可** **直接引用** **附录 B** **或** **在规划文件中展开修订**）。

- **测试**：—

---

### TT-B179-DOCS-CANONICAL-ENTRY-DEDUP-001

- **阶段**：process · **docs 总入口与重复入口消解**（**母表 B-179**；**Phase Close 附录 B 第一项**）
- **状态**：已封口
- **类别**：**docs-only**（**零** **`crates/**`** / **零** **04 契约句**）
- **母表**：[任务母表.md](./任务母表.md) **B-179**；**上游** **B-178** **[§1 文档归类](./Phase-Close-Docs-Code-Reorg-Plan-B178.md#1文档归类结果)** **为真源表**
- **产出（钉死）**：**[`docs/00-文档索引.md`](./00-文档索引.md)** **第 1 节「按类单入口」** **须** **覆盖** **§1 表** **全部文档路径**（**含** **Phase Close 切片 + 主规划**）；**第 2 节「重复入口说明」** **须** **与 §1「是否存在重复入口」列** **无矛盾**
- **禁止再分析**：**本卡** **内** **开** **B-180～B-186** **或** **批量登 TT**；**新建** **与** **`spec/00-文档索引.md`** **平级** **全仓列表**；**改** **04** **§3.4** **契约**
- **任务（已交付）**：**§1 表后** **互指** **00**；**00** **§3** **删除** **重复的 Phase Close 主规划行**（**改由 §1 表承载**）；**§4** **B-179** **备忘** **挂** **本 TT**
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**母表 B-179** / **一览 196** / **本节** **互指无断链**
- **测试**：—

---

### TT-B180-BATCH-ARCHIVE-ANCHOR-TOC-001

- **阶段**：process · **Batch-1/2/3 归档页落地（单文件三章）**（**母表 B-180**；**Phase Close 附录 B 第二项**）
- **状态**：已封口
- **类别**：**docs-only**（**零** **`crates/**`** / **零** **04 契约句**）
- **母表**：[任务母表.md](./任务母表.md) **B-180**；**上游** **[Phase-Close §2](./Phase-Close-Docs-Code-Reorg-Plan-B178.md#2batch-归档视图)** **与** **现有** **[Execution-Batch-Archive-B147-B177.md](./Execution-Batch-Archive-B147-B177.md)** **SSOT**
- **产出（钉死）**：**仅** **`docs/Execution-Batch-Archive-B147-B177.md`** **内** **目录行** + **HTML 锚 id**（**`b180-overview`** / **`b180-batch-1`** / **`b180-batch-2`** / **`b180-batch-3`** / **`b180-batch3-tt-close-list`**）；**采用** **单文件三章** **替代** **拆三文件**
- **禁止再分析**：**本卡** **内** **改** **B-147～B-177** **母表/索引** **各行列语义**；**重写** **Batch 总表** **为第二套叙事**；**开** **B-181～** **或** **批量登 TT**；**动** **B-179** **已交付文**
- **任务（已交付）**：**文首** **声明** **本 TT** **已封口**；**读者** **可从** **`00-文档索引`** **§4** **跳入** **本归档** **并** **落锚**
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**母表 B-180** / **一览 197** / **本节** **互指无断链**
- **测试**：—

---

### TT-B181-INTERNAL-ROUTES-OBSERVABILITY-DIR-SPLIT-001

- **阶段**：api · **`routes/internal` 职责拆分**（**母表 B-181**；**Phase Close 附录 B 第三项**）
- **状态**：已封口
- **类别**：**code reorg**（**move-only**；**HTTP/JSON** **不变**）
- **母表**：[任务母表.md](./任务母表.md) **B-181**；**承** **B-163** **`indexer/`**、**`reconcile/`** **Batch-2** — **本轮不触碰**
- **本轮仅改（文件清单）**：**删** **`crates/api/src/routes/internal/observability.rs`**、**`…/observability_shell.rs`**；**增** **`…/observability/mod.rs`**、**`…/observability/shell.rs`**、**`…/observability/routes.rs`**；**改** **`…/internal/mod.rs`**（**仅** **去** **`mod observability_shell`**）
- **禁止再分析**：**本卡** **内** **动** **`indexer/`**、**`reconcile/`** **子树**；**改** **04** **契约**；**开** **B-182～** **或** **批量登 TT**；**动** **B-179～B-180** **已交付文**；**顺手** **整理** **Execution** / **Phase Close**
- **任务（已交付）**：**观测路由 + 装配壳** **子目录化**；**`internal::router()`** **与** **导出** **行为** **不变**
- **验收**：**`cargo test -p traveltrust-api`** 绿；**`bash scripts/run-check-04-routes.sh`** 绿
- **测试**：**`indexer_status_wants_live_reconcile_*`**（**internal tests**）

---

### TT-B187-SSOT-GAP-BACKFILL-MOTHER-TABLE-REGISTRY-001

- **阶段**：process / **台账** · **「未完成 → 母表/TT」全覆盖登记母卡**（**母表 B-187**）
- **状态**：**已封口**（**2026-04-14** · **Pass-0** **完整** **+** **Pass-2** **收口**）
- **母表**：[任务母表.md](./任务母表.md) **B-187**
- **本轮已改（2026-04-14 · TT-B187 母卡封口 · Pass-0 完整）**：**`docs/AI任务卡索引.md`**（**一览 199**、**未封口 · 范围**、**结构化结论段**、**本节** **Pass-0** **全文** **+** **Pass-2** **表头**）、**`docs/任务母表.md`**（**B-187** **行** **封口态**）
- **本轮已改（2026-04-14 · B-187 Pass-1 续 · 零实现）**：**`docs/任务母表.md`**（**B-207～B-208** 行、**B-187** **Pass-1 续指针**、**TT↔B 附表**）、**`docs/AI任务卡索引.md`**（**一览 224～225**、**未封口 · 范围** **1～225**、**本节 Pass-1/Pass-2**、**`### TT-B207`/`### TT-B208`**）、**`docs/spec/14-合约-API-ABI-前后端对齐.md`**（**§1.1.1.1** **第二行** **追踪指针** → **B-208**）
- **本轮已改（2026-04-14 · TT-B207 实现封口）**：**`docs/任务母表.md`**（**B-207** **已做**、**B-187** **Pass-1 续** **224/225** **指针**）、**`docs/AI任务卡索引.md`**（**一览 224**、**未封口 · 范围**、**Pass-1/Pass-2** **B-207**、**`### TT-B207`**）、**`docs/spec/04-后端与API.md`**（**§3.4** **媒体**）、**`crates/api/src/media_blob_upstream.rs`**、**`crates/api/src/routes/media.rs`**、**`crates/api/src/routes/admin/media_read.rs`**、**`crates/api/src/main.rs`**、**`.env.example`**
- **本轮已改（2026-04-14 · TT-B208 实现封口）**：**`docs/任务母表.md`**（**B-208**、**B-187** **Pass-1 续** **224～225**）、**`docs/AI任务卡索引.md`**（**一览 225**、**未封口 · 范围**、**Pass-1/Pass-2**、**`### TT-B208`**）、**`docs/spec/14-合约-API-ABI-前后端对齐.md`**（**§1.1.1.1**/**§1.1.1.1a**）、**`docs/spec/04-后端与API.md`**（**§3.5** **export**、**内部 API**）、**`crates/api/src/db/region_snapshot.rs`**、**`crates/api/src/routes/admin/region_vault.rs`**、**`crates/api/src/routes/internal/region_vault_export.rs`**
- **本轮已改（2026-04-14 · TT-B210 实现封口）**：**`docs/任务母表.md`**（**B-210**、**B-187** **Pass-1 续** **224～227**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 227**、**未封口 · 范围** **1～227**、**Pass-1/Pass-2**、**`### TT-B210`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **+** **1.0.103**、**`docs/spec/07-开发流程与顺序.md`** **§二 2.3**/**§六 6.3B·序3** **`checks_total=117`**/**Version 1.0.842**/**§六 6.5**、**`docs/spec/00-文档索引.md`** **07/110** **版本表**、**`.github/workflows/indexer-reconcile-gate.yml`**、**`scripts/ops/indexer-reconcile-probe.sh`**、**`scripts/ops/write-indexer-evidence.sh`**、**`scripts/ops/write-indexer-evidence.ps1`**
- **本轮已改（2026-04-14 · TT-B211 实现封口）**：**`docs/任务母表.md`**（**B-211**、**B-187** **Pass-1 续** **224～228**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 228**、**未封口 · 范围** **1～228**、**Pass-1/Pass-2**、**`### TT-B211`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第四切片** **+** **1.0.104**、**`docs/spec/07-开发流程与顺序.md`** **§二 2.3**/**§六 6.3B·序3** **`checks_total=118`**/**Version 1.0.843**/**§六 6.5**、**`docs/spec/00-文档索引.md`** **07/110** **版本表**、**`.github/workflows/indexer-reconcile-gate.yml`**、**`scripts/ops/indexer-reconcile-probe.sh`**、**`scripts/ops/internal-indexer-ops.sh`**、**`scripts/ops/internal-indexer-ops.ps1`**
- **本轮已改（2026-04-14 · TT-B212 实现封口）**：**`docs/任务母表.md`**（**B-212**、**B-187** **Pass-1 续** **224～229**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 229**、**未封口 · 范围** **1～229**、**Pass-1/Pass-2**、**`### TT-B212`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第五切片** **+** **1.0.105**、**`docs/spec/07-开发流程与顺序.md`** **§二 2.3**/**§六 6.3B·序3** **`checks_total=119`**/**Version 1.0.844**/**§六 6.5**、**`docs/spec/00-文档索引.md`** **07/110** **版本表**、**`.github/workflows/indexer-reconcile-gate.yml`**、**`scripts/ops/indexer-reconcile-probe.sh`**、**`scripts/ops/internal-indexer-ops.sh`**
- **本轮已改（2026-04-14 · TT-B213 实现封口）**：**`docs/任务母表.md`**（**B-213**、**B-187** **Pass-1 续** **224～230**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 230**、**未封口 · 范围** **1～230**、**Pass-1/Pass-2**、**`### TT-B213`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第六切片** **+** **1.0.106**、**`docs/spec/07-开发流程与顺序.md`** **§二 2.3**/**§六 6.3B·序3** **`checks_total=120`**/**Version 1.0.845**/**§六 6.5**、**`docs/spec/00-文档索引.md`** **07/110** **版本表**、**`.github/workflows/indexer-reconcile-gate.yml`**、**`scripts/ops/indexer-reconcile-probe.sh`**、**`scripts/ops/internal-indexer-ops.sh`**、**`scripts/ops/internal-indexer-ops.ps1`**
- **本轮已改（2026-04-14 · TT-B214 实现封口 · b081 测去抖）**：**`docs/任务母表.md`**（**B-214**、**B-213** **验收互指**、**B-187** **Pass-1 续** **224～231**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 231**、**未封口 · 范围** **1～231**、**本节 Pass-1/Pass-2**、**`### TT-B214`**）、**`crates/api/src/chain/fee_router_verify/tests.rs`**
- **本轮已改（2026-04-14 · TT-B215 文档封口 · 110 全集证明钉界）**：**`docs/任务母表.md`**（**B-215**、**TT↔B** **232**、**B-187** **Pass-1/Pass-2** **叙事** **与** **一览** **232** **对齐**）、**`docs/AI任务卡索引.md`**（**一览 232**、**未封口 · 范围** **1～232**、**Pass-0/Pass-1/Pass-2**、**`### TT-B215`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第七切片** **+** **1.0.107**、**`docs/spec/00-文档索引.md`** **110** **1.0.107**
- **本轮已改（2026-04-14 · TT-B216 实现封口 · 110 全集证明 JSON+gate）**：**`docs/任务母表.md`**（**B-216**、**B-215** **互指** **233**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 233**、**未封口 · 范围** **1～233**、**Pass-1/Pass-2**、**`### TT-B216`**）、**`scripts/ops/write-indexer-historical-completeness-proof.sh`**、**`scripts/ops/internal-indexer-ops.sh`**/**`.ps1`**、**`scripts/ops/indexer-reconcile-probe.sh`**、**`.github/workflows/indexer-reconcile-gate.yml`**、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第八切片** **+** **1.0.108**、**`docs/spec/07-开发流程与顺序.md`**/**`docs/spec/00-文档索引.md`** **`checks_total`****`122`**/**Version** **对齐**、**`ops/RUNBOOK.md`**、**`scripts/ops/fixtures/indexer_historical_completeness_proof_v0.example.json`**
- **本轮已改（2026-04-14 · TT-B217 实现封口 · 110 indexer-tick JSON-RPC pacing）**：**`docs/任务母表.md`**（**B-217**、**B-216** **下一能力周期** **互指**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 234**、**未封口 · 范围** **1～234**、**Pass-1/Pass-2**、**`### TT-B217`**）、**`crates/api/src/chain/indexer/rpc_pacing.rs`**、**`crates/api/src/routes/internal/indexer/tick/*.rs`**（**pacing 接线**）、**`.github/workflows/indexer-reconcile-gate.yml`**、**`scripts/ops/indexer-reconcile-probe.sh`**、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第九切片** **+** **1.0.109**、**`docs/spec/07-开发流程与顺序.md`**/**`docs/spec/00-文档索引.md`** **`checks_total`****`123`**/**Version 1.0.847**、**`docs/spec/04-后端与API.md`**/**`docs/spec/08-3-参数与门禁表.md`**/**`.env.example`**、**`ops/RUNBOOK.md`**、**`scripts/README.md`**
- **本轮已改（2026-04-14 · TT-B220 文档封口 · `checks_total` 现行 125 横扫）**：**`docs/任务母表.md`**（**B-220**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 237**、**未封口 · 范围** **1～237**、**`### TT-B220`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2**/**§3.1.2.1**/**1.0.110**、**`docs/spec/07-开发流程与顺序.md`**/**`docs/spec/00-文档索引.md`** **`checks_total`****`125`**/**Version 1.0.848**、**`docs/spec/04-后端与API.md`** **§6**、**`docs/spec/08-3-参数与门禁表.md`** **变更记录**、**`ops/RUNBOOK.md`**、**`scripts/README.md`**
- **本轮已改（2026-04-14 · TT-B221 文档封口 · B-219 evidence-bundle 标准用法）**：**`docs/任务母表.md`**（**B-221**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 238**、**未封口 · 范围** **1～238**、**Pass-1/Pass-2**、**`### TT-B221`**）、**`ops/RUNBOOK.md`** **§2.55**、**`scripts/README.md`**、**`docs/spec/07-开发流程与顺序.md`** **§六 6.4/6.5**/**Version 1.0.849**、**`docs/spec/00-文档索引.md`** **07** **行**
- **本轮已改（2026-04-14 · TT-B222 实现封口 · evidence-bundle CI artifact）**：**`docs/任务母表.md`**（**B-222**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 239**、**未封口 · 范围** **1～239**、**Pass-1/Pass-2**、**`### TT-B222`**）、**`.github/workflows/indexer-reconcile-gate.yml`**、**`scripts/ops/fixtures/ci_evidence_bundle_b210_manifest.json`**、**`scripts/ops/fixtures/ci_evidence_bundle_b213_tick_loop_evidence.json`**、**`docs/spec/07-开发流程与顺序.md`** **§六 6.4/6.5**/**Version 1.0.850**、**`docs/spec/00-文档索引.md`** **07/110**、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`**、**`ops/RUNBOOK.md`**、**`scripts/README.md`**
- **本轮已改（2026-04-14 · TT-B209 实现封口）**：**`docs/任务母表.md`**（**B-209**、**B-187** **Pass-1 续** **224～226**、**TT↔B**）、**`docs/AI任务卡索引.md`**（**一览 226**、**未封口 · 范围** **1～226**、**Pass-1/Pass-2**、**`### TT-B209`**）、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1**、**`docs/spec/04-后端与API.md`** **§3.4** **`indexer-tick`**、**`docs/spec/08-3-参数与门禁表.md`** **附录 A**、**`.env.example`**、**`crates/api/src/chain/indexer/checkpoint.rs`**、**`crates/api/src/chain/indexer/mod.rs`**、**`crates/api/src/routes/internal/indexer/tick/handler.rs`**、**`handler_helpers.rs`**
- **本轮仅改（母卡封口前允许多批）**：**`docs/任务母表.md`**（**B-187** 行、**续表** 指针、**新增子 B-189+** 行）、**`docs/AI任务卡索引.md`**（**一览**、**未封口** 段、**子 TT** 正文）、**`docs/spec/04-后端与API.md`**（**仅当** 子卡触及 **§3.4** 契约句时 **同批**）；**默认** **不**改 **07**/**00**/**缺口官方总表**/**27-archived tail**（**除非** 用户写明 **台账同批** 或 **合 07 门禁**）
- **禁止再分析**：**单 PR** 声称「已扫完全库所有 md」**却无** 可复核 **源文件清单 + rg 日志**；**为未交付功能** 批量造 **重复** B-/TT（**须**先对 **母表描述列** **关键词去重**）；**把** **P0 已 ☑** **且** **纯人工签字** 项 **机械** 拆成 **实现类 TT**
- **任务**：
  - **Pass-0（去重）**：以 **B-187** 描述列为 **检查单**，对 **07 §六 6.3A**「下一工作包」、**缺口官方总表 · P1-A/P2**、**04 §3.4** **Partial/Target** 表注、**88**/**110**/**53** 篇内 **Target/Partial**、**Wave** **`NNN-阶段*.md`** 文首状态 — **逐项** 在 **`docs/任务母表.md`** **`rg`** **主题词**（路由名、能力名、**B-110** 子线名等），判定 **已有 B-** 或 **须新开子 B-**。
  - **Pass-1（登记）**：凡 **无** 母表行 **或** **仅有文档叙述无 TT** 的 **真实未完成包**，**新开** **子母表行**（**B-189** 起续号，**与 B-182～B-186 待登 TT、B-188 并存**）+ **索引一览 + `### TT-…` 正文**（**未封口**）；**已有** **B-+TT** → **仅**在本节下维护 **「覆盖矩阵」** 表格（**真源锚点** | **既有 B-** | **备注**）。
  - **Pass-2（收口）**：当 **覆盖矩阵** 显示 **上述真源** 在 **登记粒度** 下 **均已** **B-+TT** 指针齐备 **或** **显式排除**，**母卡** 改 **已封口**；**子卡** 仍按 **各自 TT** 独立封口。（**本母卡** **已于** **2026-04-14** **满足**。）
- **验收（母卡单批最小）**：**本索引 · 一览 199** 与 **母表 B-187** 互指无断链；**新增子 B-** 均含 **可执行验收** 子句；**`bash scripts/run-check-04-routes.sh`** 绿（**含** **04** 改动批）；**含 `crates/**`** 子卡 **须** **`cargo test -p traveltrust-api`**
- **测试**：—（**纯登记批**）；子卡另列

**Pass-1 / Pass-2 结论（2026-04-14 · 纳入一览 230/231/232/233/234/236/237/238/239）**：**Pass-1** 子行指针表 **已登记** **一览 230（B-213/TT-B213）**、**231（B-214/TT-B214）**、**232（B-215/TT-B215）**、**233（B-216/TT-B216）**、**234（B-217/TT-B217）**、**236（B-219/TT-B219）**、**237（B-220/TT-B220）**、**238（B-221/TT-B221）**、**239（B-222/TT-B222）** — **230** = **110** **`tick-loop` 可选证据 JSON 落盘**（**§3.1.2.1** **第六切片**），**231** = **B-081 承线 · `fee_router_verify` · `b081` receipt mock 去抖**，**232** = **110** **「全集链上证明」** **文档钉界**（**§3.1.2.1** **第七切片** · **纯文档**），**233** = **110** **「全集链上证明」** **最小 JSON** **+** **`indexer-reconcile-gate`****`122`**（**§3.1.2.1** **第八切片** · **承** **B-215**），**234** = **110** **`indexer-tick`** **单次请求内** **JSON-RPC pacing** **+** **`indexer-reconcile-gate`****`123`**（**§3.1.2.1** **第九切片** · **承** **B-204/B-209**），**236** = **110** **evidence-bundle canonical** **+** **`indexer-reconcile-gate`****`125`**（**承** **B-210/B-213/B-216**），**237** = **`checks_total=125`** **现行文档横扫**（**纯文档** · **承** **B-219**），**238** = **RUNBOOK/README** **B-219** **evidence-bundle** **标准用法**（**纯文档** · **承** **B-219**），**239** = **`indexer-reconcile-gate`** **CI** **离线** **bundle** **artifact**（**承** **B-221**）。**Pass-2** 覆盖矩阵 **已列** **同上真源锚** **与** **230/231/232/233/234/236/237/238/239** **对读**，**与 Pass-1** **互证**。

**Pass-0（完整 · 2026-04-14）扫档结论**（**真源清单**：`docs/spec/07-开发流程与顺序.md` **§六 6.3A** **表**（**十宏块** **+** **18 读图①～⑥**）；`docs/spec/缺口与待补-官方总表.md` **P0**/**P1-A**/**P2**；`docs/spec/04-后端与API.md` **§3.4** **Partial/Target** **行**；`docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md`、`docs/spec/110-阶段开发链上索引器与事件同步器.md`、`docs/spec/53-阶段开发技术文档.md` **篇内** **Target/Partial** **句**；**Wave** **见** **下段** **规则** **排除**）

- **07 · 6.3A 宏块（排期入口表）**：**五主路由页身 Partial** → **88**/**13-1**/**B-191**/**B-194～B-200** **族** **+** **B-201/B-202** **体量审计**；**Rust API** → **B-110**/**04**/**87**/**B-102** **与** **B-147～B-177** **已登记观测域**；**Indexer** → **B-192～B-222**/**B-126**/**B-114**；**EVM 经济链** → **B-116/B-193/B-206/B-208**/**P5**/**B-115**；**社区 HTTP** → **B-117**；**WebSocket** → **B-118**（**搁置台账** **已封口**）；**Admin** → **B-182/B-123/70**；**82～84 叙事** → **B-115/B-116/P5-1/P5-5** **等**；**SQL/Redis 规划名** → **非** **本母卡** **新开 epic**（**41/55/04** **运维真源**）。
- **缺口官方总表 · P0**：**排除** — **十二项** **☑** **签字/evidence** **类** **无** **新产品行为** **不** **强制新 B-**（**B-187** **行** **排除规则**）。
- **缺口 · P1-A**：**合约/鉴权/证据/messageId** **等** **已落地叙述** **或** **Runbook** **指针** — **无** **须** **新开** **`B-215`** **之** **空白母表行**。
- **缺口 · P2**：**DID** → **B-189**；**双写策略** → **B-190**；**前端路由/预填** → **04+13-1** **+** **627～687** **机读链** — **已** **去重** **入** **Pass-1**/**母表** **小行**。
- **04 §3.4**：**`/admin/*` Partial** → **70/B-182**；**`/traveltrust` 与** **85** **余量** → **母表** **85 Backlog** **小节**；**internal/indexer** → **110** **+** **B-204～B-222**；**did-rank** **附录 Target** → **B-189** **v1** **已封口** **·** **period 衰减** **仍** **附录真源**。
- **88 / 110 / 53**：**域 SSOT** **与** **上列** **B-**/**TT** **互指** **无** **断链**；**53** **争议入口** **与** **01/13-1** **一致** **非** **未登记 epic**。
- **Wave · `NNN-阶段*.md`**：**排除** **逐文件穷尽**（**仓库** **65+** **篇**）— **Implemented** **以** **各文** **§零 0.4.1** **与** **`00-最终版架构图对应模块清单总表` §三～§四** **为准**；**新开阶段交付** **仍须** **07 §二 2.4** **+** **母表常规登记**（**非** **本轮** **Wave** **扫档** **漏登** **`B-215`**；**`B-215`**/**`B-216`** **嗣后** **由** **110** **登记** **见** **一览** **232/233**）。

**决策（Pass-0 封存口径）**：**无** **同质** **「母表空白 + 无 TT」** **包** — **故** **当时** **未** **因** **本扫档** **须** **新开** **`B-215`**；**`TT-B187`** **母卡** **封口**。**嗣后**：**`B-215`**/**`TT-B215`**（**一览** **232**）**为** **110** **「全集链上证明」** **文档钉界** **已** **单列封口**；**`B-216`**/**`TT-B216`**（**一览** **233**）**为** **同锚** **`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`** **之** **最小 JSON+gate** **实现** **已** **封口**；**`B-217`**/**`TT-B217`**（**一览** **234**）**为** **`indexer-tick`** **JSON-RPC pacing** **已** **封口**。**下一工作**：**110** **全量扫链** **余量**/**子域实现** **等** **按** **既有** **B-192～B-217**/**B-193**/**B-147～B-157** **各** **TT** **排期**，**勿** **假定** **本母卡** **保持打开**。

**Pass-1（07 §六 6.3A + 缺口 P2 · 去重后）已登记子行指针**

| 真源锚（摘要） | 子 B- | TT（一览） | 去重备注 |
|----------------|-------|------------|----------|
| 缺口 P2 · **04 附录 §3.1** 信誉 **加权主序** | **B-189** | **200** | **TT-B189 已封口**：**`guide_s31_weighted_primary_*`**；**period 衰减** 等仍 **Target**（见 **04-附录 §3.1**） |
| 缺口 P2 · **双写失败策略** **生产定稿** **08-3** | **B-190** | **201** | **TT-B190 已封口（2026-04-13）**：**Runbook §9** + **08-3 附录 A/变更记录** + **evidence/GO_20260413/artifacts/TT-B190-dual-write-prod-signoff.md** |
| **07·6.3A/6.3B** · **`/traveltrust`** **04 Implemented** | **B-191** | **202** | **已封口**（**2026-04-13** **实现轮**）：**`GET /api/v1/traveltrust/page-brief`** + **04/13-1** **同批** + **85 清单 1/3/7** **对齐**；**非** **B-110** **SEQ** |
| **07·6.3A** · **110** **全量链上扫链** **Target** | **B-192** | **203** | **B-114-1～5** **已切片**；**文档钉界** **110 §3.1.2.1**（**TT-B192** **文档轮** **已封口**）；**实现轮** **余量** **另 TT** |
| **07·6.3A** · **EVM** **FeeRouter 之后** **14 §1.1.1** **Partial** | **B-193** | **204** | **承** **B-116 MVP**；**文档钉界** **14 §1.1.1.1**（**TT-B193** **文档轮** **已封口**）；**子域实现** **另 TT**；**非** **P5-1～P5-5** **重复叙事** |
| **85 附录** **§H/§I** **可生成代码级** + **Trust/Map 组件/i18n** | **B-194** | **205** | **TT-B194 已封口（2026-04-13）**：**85 附录 v1.0.0.4**；**`TravelTrustTrustFactsSection`** / **`TravelTrustFaqAccordion`** / **`TravelTrustGlobalMapSection`** + **`traveltrustTrustFaqI18n`** / **`traveltrustGlobalMapDemo`**；**未改** **04/07** **契约** |
| **85 §廿三** **验收** + **evidence**（**CLI/测试/源码**） | **B-199** | **210** | **TT-B199 已封口（2026-04-13）**：**`evidence/GO_85_TRAVELTRUST.md`** **§3** + **`GO_85_TRAVELTRUST_SEC23_20260413/artifacts`**；**未改** **04/07** |
| **07·6.3A** · **110** **全量扫链** **最小切片**（承 **B-192**） | **B-204** | **221** | **已封口（2026-04-14）**：**ENV `INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`** **+** **`full_scan_lower_bound_observability`**；**全集证明/批编排** **仍** **110 Target** |
| **04/14** · **`treasury_erc20_pool*`** **handler**（**索引正式 ID**） | **B-205** | **222** | **已封口（2026-04-14）**：**规范别名** **`TT-SSOT-SWITCH-APPLY-003`** **↔** **`TT-B205-GOVERNANCE-POOL-TREASURY-ERC20-SSOT-HANDLER-001`**；**04/14** **对读** |
| **07·6.3A** · **14 §1.1.1.1** **首行子域实现**（承 **B-193**） | **B-206** | **223** | **已封口（2026-04-14）**：**`TT-B206-14-POST-FEEROUTER-FIRST-SUBDOMAIN-IMPL-001`** · **`FeeRouter`** **`setCountryBucketSplit`** / **双 country 桶**；**`PlatformFeeRouted`** **口径不变**；**表内多行** **须** **多 TT** |
| **04 §3.4** · **`POST …/media/signed-urls`（批 270）** | **B-207** | **224** | **已封口（2026-04-14）**：**`TRAVELTRUST_MEDIA_EVIDENCE_FETCH_URL_TEMPLATE`** **+** **`media_blob_upstream`** **→** **`GET …/media/access/:token_id`** **字节体**（**上限**/**超时**/**Content-Length** **门禁**） |
| **14 §1.1.1.1** · **表内第二行 · RegionVault** | **B-208** | **225** | **已封口（2026-04-14）**：**柱 C** **`…/export`** **admin+internal** + **`include_snapshot_explain`** · **§1.1.1.1a** |
| **07·6.3A** · **110** **全链扫 · 单轮批宽上界**（承 **B-192**/**B-204**） | **B-209** | **226** | **已封口（2026-04-14）**：**`INDEXER_TICK_MAX_BLOCK_SPAN`** **+** **`indexer_tick_max_block_span_observability`** · **§3.1.2.1** |
| **07·6.3A** · **110** **全链扫 · evidence manifest ENV 十字登记**（承 **B-204**/**B-209**） | **B-210** | **227** | **已封口（2026-04-14）**：**`indexer_full_scan_catchup_registry`** · **`write-indexer-evidence` .sh/.ps1** · **`110-INDEXER-EVIDENCE-FULL-SCAN-REGISTRY-V1`**；**现行** **`indexer-reconcile-gate` `checks_total`****`120`**（**以** **YAML** **为真值**；**+1** **见** **B-213**） |
| **07·6.3A** · **110** **全链扫 · internal 多 tick 批编排（脚本层）**（承 **B-204**/**B-209**/**B-210**） | **B-211** | **228** | **已封口（2026-04-14）**：**`tick-loop`** · **`110-INDEXER-TICK-LOOP-ORCHESTRATION-V1`** · **`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.7.0`**（**现行脚本** **`1.9.0`** **见** **B-213**）**·** **gate `checks_total`****`120`** |
| **07·6.3A** · **110** **全链扫 · tick-loop 运行级观测聚合（stdout）**（承 **B-211**） | **B-212** | **229** | **已封口（2026-04-14）**：**`indexer_tick_loop_run_observability`** · **`110-INDEXER-TICK-LOOP-RUN-OBSERVABILITY-V1`** · **`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.8.0`**（**现行** **`1.9.0`** **见** **B-213**）**·** **gate `checks_total`****`120`** |
| **07·6.3A** · **110** **全链扫 · tick-loop 可选 JSON 落盘（脚本层）**（承 **B-212**） | **B-213** | **230** | **已封口（2026-04-14）**：**`110-INDEXER-TICK-LOOP-EVIDENCE-JSON-WRITE-V1`** · **`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.9.0`** · **gate `checks_total`****`120`** · **`cargo test` 全量并行稳定** **见** **B-214** |
| **收益域 B-081 承线** · **FeeRouter receipt 单测 mock 去抖** | **B-214** | **231** | **已封口（2026-04-14）**：**`b081_db_row_matches_transaction_receipt_platform_fee_routed_decode`** **`std::thread`****+** **短重试** |
| **07·6.3A** · **110** **全链扫 · 「全集链上证明」文档钉界**（承 **B-192**；**与** **B-204～B-213** **正交**） | **B-215** | **232** | **已封口（2026-04-14 · 文档轮）**：**`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`** **建议锚**；**实现体** **见** **233/B-216** |
| **07·6.3A** · **110** **全链扫 · 「全集链上证明」最小 JSON + indexer gate**（承 **B-215**） | **B-216** | **233** | **已封口（2026-04-14）**：**`write-indexer-historical-completeness-proof.sh`** **+** **`internal-indexer-ops` `historical-completeness-proof`**；**gate** **`checks_total`****`122`**；**零** **`indexer-tick`** **语义** **diff** |

**Pass-2（2026-04-14）覆盖矩阵（真源 → 台账指针；母卡已封口 · 表为归档）**

| 真源锚（摘要） | 既有 B- / 备注 | 索引 TT（一览） | 备注 |
|----------------|----------------|-----------------|------|
| **07 §六 6.3A** · **check-48 / Rust 体量审计** | **B-201** | **217** | **已封口** · 审计基线 |
| **07 §六 6.3A** · **前端 TS/TSX 体量审计** | **B-202** | **218** | **已封口** · 审计基线 |
| **07 §六 6.3A** · **110 全链扫 · 文档分界** | **B-192** | **203** | **文档轮** **已封口** |
| **07 §六 6.3A** · **110 全链扫 · 起扫下界夹取** | **B-204** | **221** | **已封口** · **`INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`**（**110 §3.1.2.1** **最小切片**） |
| **07 §六 6.3A** · **14 FeeRouter 后 · 文档分界** | **B-193** | **204**（一览） | **文档轮** **已封口**（**勿与母表 B-204 混号**） |
| **07 §六 6.3A** · **14 表内首行子域实现** | **B-206**（**新**） | **223** | **已封口（2026-04-14）** · 单行边界见 **TT-B206** 正文 |
| **04 §3.4** · **`treasury_erc20_pool*` handler** | **B-205** | **222** | **已封口（2026-04-14）** · **`GET …/governance/pool`** **并行腿** **+** **单测** **`b205_*`** |
| **04 §3.4** · **`POST …/media/signed-urls` 等 blob** | **B-207** | **224** | **已封口（2026-04-14）**：**模板拉取** **切片** · **见** **`### TT-B207`** |
| **14 §1.1.1.1** · **表内第二行（RegionVault 国家桶）** | **B-208** | **225** | **已封口（2026-04-14）**：**柱 C** **见** **`### TT-B208`**；**柱 A/B** **余量** **仍** **§1.1.1.1a** |
| **07 §六 6.3A** · **110 全链扫 · 单轮 inclusive 批宽** | **B-209** | **226** | **已封口（2026-04-14）**：**`INDEXER_TICK_MAX_BLOCK_SPAN`**；**全集证明/批编排** **仍** **110 Target** |
| **07 §六 6.3A** · **110 全链扫 · evidence manifest 登记** | **B-210** | **227** | **已封口（2026-04-14）**：**`110-INDEXER-EVIDENCE-FULL-SCAN-REGISTRY-V1`** **于** **`manifest.json`**；**非** API **体** **替代** |
| **07 §六 6.3A** · **110 全链扫 · internal 多 tick 批编排** | **B-211** | **228** | **已封口（2026-04-14）**：**`scripts/ops/internal-indexer-ops.sh` `tick-loop`**；**stdout** **`indexer_tick_loop_orchestration`**；**不**改 **Rust** **`indexer-tick`** |
| **07 §六 6.3A** · **110 全链扫 · tick-loop 运行级观测** | **B-212** | **229** | **已封口（2026-04-14）**：**`tick-loop` stdout** **`indexer_tick_loop_run_observability`**（**`rounds[]`****+****`run_summary`**）；**不**改 **evidence** **`manifest.json`** **schema** |
| **07 §六 6.3A** · **110 全链扫 · tick-loop 可选 JSON 落盘** | **B-213** | **230** | **已封口（2026-04-14）**：**`--write-evidence-json`****/** **`INDEXER_TICK_LOOP_EVIDENCE_JSON`** **→** **文件** **+** **`indexer_tick_loop_evidence_write`**；**stdout** **无** **evidence_write**；**不**改 **B-210** **manifest** **根** **schema** |
| **B-081 承线 · FeeRouter `b081` receipt mock 稳定** | **B-214** | **231** | **已封口（2026-04-14）**：**全量并行** **`cargo test -p traveltrust-api`** **不** **因** **mock** **flaky** |
| **07 §六 6.3A** · **110 全链扫 · 「全集链上证明」文档钉界** | **B-215** | **232** | **已封口（2026-04-14 · 文档轮）**：**§3.1.2.1** **第七切片**；**建议锚** **`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`**；**实现体** **见** **233/B-216** |
| **07 §六 6.3A** · **110 全链扫 · 「全集链上证明」最小 JSON + gate** | **B-216** | **233** | **已封口（2026-04-14）**：**§3.1.2.1** **第八切片**；**`proof_anchor`****=****`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`**；**`checks_total`****`122`** |
| **缺口官方总表 P2** · **did-rank §3.1 加权** | **B-189** | **200** | **v1** **已封口**；**period 衰减** 等仍 **Target** |
| **路线图-1人** **P1 · `/guide`** | **B-078～B-080** 等（**母表**） | **多 TT** | **未** **另开 epic B-**；**88** **与** **母表** **小行** **已覆盖** |

---

### TT-B189-DID-RANK-WEIGHTED-RANK-BASIS-V1-001

- **阶段**：did-rank / API（**代码 + 文档同批**）
- **状态**：已封口（**2026-04-13**）
- **母表**：[任务母表.md](./任务母表.md) **B-189**
- **封口批已落**：**`crates/api/src/routes/did_rank/guide_sort.rs`**（**`rank_basis_guide_weighted`** → **`guide_s31_weighted_primary_*`**）；**`routes/did_rank/tests.rs`**；**`scripts/dev/check-55-quick-verify.{sh,ps1}`**；**`scripts/gates/smoke-api-public-routes.{sh,ps1}`**；**`frontend/lib/apiClient/didRank.test.ts`**；**`docs/spec/04-附录-did-rank对接说明.md`**（**§2/§3/§3.1**、**1.23**）；**`docs/spec/04-后端与API.md`** **§3.4** **`GET …/did-rank/guides`**；**`docs/spec/30-DID排行榜-页面规范.md`** **§0.1**；**`docs/spec/08-3-参数与门禁表.md`**（**附录 A** 行 + **变更记录**）；**`docs/spec/08-4-对外口径包.md`** **CI 版本**（**W-PDP**）；**母表** / **本索引**
- **改动说明**：
  1. **`sort=weighted`** 输出 **§3.1 专用** **`rank_basis`**（**`guide_s31_weighted_primary_*`**）；**缺省** **`sort`** 仍为 **30 §3** **金额主序**。
  2. **DB / chain_off** **加权合成序** **不变**（**`list_guides_did_rank_by_weighted_composite`**）。
  3. **§3.1** **period 衰减** 等 **仍** **Target**（见 **04-附录**）。
- **边界（禁止行为）**：**未**改 **`GET /meta`** **根键**；**未**改 **`/api/v1/did-rank/*`** **路径**；**未**与 **B-188** **混文件**。
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`cargo test -p traveltrust-api`** 绿。
- **测试**：**`cargo test -p traveltrust-api`** **`did_rank`**
- **模块化约束（≤300 行）**：**本批** **仅** **触** **`guide_sort.rs`** **小改**；**未** **新增** **超行** **单文件**。

---

### TT-B190-DOC-DUAL-WRITE-PROD-08-3-SIGNOFF-001

- **阶段**：ops / **文档卡**（**零** **业务代码** **默认**）
- **状态**：已封口（**2026-04-13**）
- **母表**：[任务母表.md](./任务母表.md) **B-190**
- **本轮已落（封口批）**：**`ops/RUNBOOK.md`** **§9** **双写**段 **决策记录**（**②** **`strict_503`** + **并行 ③ 类观测**）；**`docs/spec/08-3-参数与门禁表.md`** **附录 A** 备注 + **变更记录** **2026-04-13**；**`evidence/GO_20260413/artifacts/TT-B190-dual-write-prod-signoff.md`**；**`docs/任务母表.md`** **B-190**；**本索引一览 201 / 本节**
- **改动说明**：
  1. **Runbook** 与 **08-3** **互指** **本 B-190** / **本 TT**。
  2. **已登记** **生产轨**：**`DUAL_WRITE_FAILURE_POLICY=strict_503`**；**`STRICT_DB_WRITE_ANY`** / **`TRAVELTRUST_STRICT_*_DB_WRITE`** **须** **部署工单填实** **与** **`GET /meta` / `startup_snapshot`** **互证**。
  3. **不** 替代 **缺口 P0** **其它** **人工签字**；**不** 改 **仓库代码默认**（**另 TT** **方可** **动实现**）。
  4. **封口批** **零** **`crates/**`** **`contracts/**`** **`frontend/**`** diff。
  5. **验收门闸**：**`bash scripts/run-check-04-routes.sh`** + **`cargo test -p traveltrust-api`**（**与** **母表 B-190** **一致**）。
- **边界（禁止行为）**：**不**改 **`GET /meta`** **JSON** **键名** **与** **HTTP** **契约**；**不** 扩 **新 ENV** **名** **without** **08-3 同批**；**不** 与 **B-189/B-191** **混单 PR** **无清单**。
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`cargo test -p traveltrust-api`** 绿；**`rg 'B-190'|'TT-B190'`** **在** **Runbook+08-3** **可命中**。
- **测试**：**`cargo test -p traveltrust-api`**（**回归绿**；**无** **新增** **Rust** **用例** **于** **本 TT**）

---

### TT-B191-TRAVELTRUST-PAGE-04-13-1-CLOSE-001

- **阶段**：frontend / **路由契约** + **公开只读 API**（**B-191** **实现轮**）
- **状态**：**已封口**（**2026-04-13** **实现轮完成**；**台账同批** **登记** **母表/索引**）
- **母表**：[任务母表.md](./任务母表.md) **B-191** · **「B-191 文档轮边界」** · **`### B-191 Partial → Implemented`**（**历史前提**；**本 TT** **已** **满足** **B-191 核心交付** **与** **04/13-1** **Implemented** **句**）
- **封口摘要（代码路径）**：**`GET /api/v1/traveltrust/page-brief`** — **`crates/api/src/routes/traveltrust_page.rs`**（**handler + `traveltrust_page_brief_json`** **单测** **`page_brief_doc_version_matches_protocol_reference`**）；**`crates/api/src/routes/mod.rs`** **`merge(traveltrust_page::router())`**；**`frontend/lib/api.ts`** **`routes.traveltrustPageBrief`**；**`frontend/app/traveltrust/page.tsx`** **`TravelTrustPageBriefHydrate`**（**挂载** **`fetch(apiUrl(routes.traveltrustPageBrief))`**）；**`frontend/lib/analytics.ts`** **`trackTravelTrustEvent`** **必填** **`target`**（**P1** **`/allocation`** **见** **B-200** / **`#allocation`** **仍** **为** **合法** **类型值**；**P2** **`/market`**）；**`frontend/components/traveltrust/TravelTrustStickyCta.tsx`** **与** **页尾/Hero** **同源** **埋点**；**`frontend/lib/api.test.ts`** **`traveltrustPageBrief`** **路径断言**
- **契约升级（登记说明 · 真源仍在 spec 正文）**：**`docs/spec/04-后端与API.md`** **§3.3** **摘要表** + **§3.4** **详表** — **`/traveltrust`** **Implemented** + **`GET …/traveltrust/page-brief`** **行**；**`docs/spec/13-1-UI产品级SSOT与页面规范.md`** **表 1 · Network** — **Implemented** **+** **`page-brief`/`doc_version`** **指针**（**本索引** **不** **复述** **04/13-1** **表内长句**）
- **85 清单对齐（机读/产品句）**：**清单 1** — **P1 Primary→`/allocation`**（**B-200**）、**P2→`/market`**（**`page-brief.cta_contract`** **与** **UI** **一致**）；**清单 3** — **`traveltrust_p1_early_access_click` / `traveltrust_p2_market_click`** **载荷** **`source`+`target`**；**清单 7** — **`live_stats.presentation`=`illustrative`** **与** **页内** **Illustrative** **口径** **一致**。**清单 2/4/5/6/8** **仍** **须** **人工/浏览器** **按** **母表** **`### 85 封口验证清单`** **实跑**（**非** **本台账行** **可替代**）
- **去重**：**B-191** **不** **吞** **85 Backlog**；**B-194** **已** **单独封口**（**TT-B194**）；**B-198** **已** **单独封口**（**TT-B198** · [**GO_B198**](../evidence/GO_B198_ANALYTICS_CLOSE.md)）；**B-199** **已** **单独封口**（**TT-B199**）；**B-200** **已** **单独封口**（**TT-B200** · [**GO_B200**](../evidence/GO_B200_ALLOCATION_PHASE2_CLOSE.md)）；**B-195～B-197** **仍** **与** **本 TT** **分卡**；**勿** **把** **B-198 埋点** **并入** **本 TT**
- **边界（本 TT 已遵守）**：**新公开路由** **已** **同批** **入** **04 §3.4**；**未** **与** **B-110 SEQ** **混单**
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**`cargo test -p traveltrust-api`** 绿；**`npm test -- lib/api.test.ts --run`** 绿（**建议**）
- **测试**：**`cargo test -p traveltrust-api`**（**含** **`traveltrust_page`** **模块**）；**`npm test -- lib/api.test.ts --run`**
- **模块化约束（≤300 行）**：**`traveltrust_page.rs`**、**`page.tsx`** **等** **须** **保持** **≤300** **行/文件**（**超标** **拆组件**）

---

### TT-B192-110-FULL-CHAIN-SCAN-SCOPE-001

- **阶段**：indexer / **规划**（**文档轮** **已交付** **2026-04-13**）
- **状态**：**已封口**（**文档轮**；**全量扫链** **实现** **仍** **Target** **须** **另开实现 TT**）
- **母表**：[任务母表.md](./任务母表.md) **B-192**
- **本轮仅改（文档轮 · 已执行）**：**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1**、**`docs/任务母表.md`**（**B-192**）、**`docs/AI任务卡索引.md`**（**一览 203** / **本节** / **未封口枚举**）；**未改** **`docs/spec/04-后端与API.md`**（**无** **internal** **契约句** **diff**）
- **文档轮交付物**：**`110` §3.1.2.1** — **「全量链上扫链」** **Target** **余量定义**；**B-114-1～5** **切片覆盖/不覆盖**；**`indexer_tick` 窗口** **摘要**；**显式非目标**（coverage / RPC 样例）；**三角互指** **母表 B-192** / **07 §六 6.3A** / **本 TT**。**110** **版本** **1.0.100**。
- **改动说明（原卡 · 已满足）**：
  1. **写清** **「全量链上扫链」** **与** **`indexer_tick` 当前窗口**、**B-114** **reorg/scan** **切片** **边界**。（**见 §3.1.2.1**）
  2. **若** **需** **新 env**：**仅** **110+08-3** **叙事** **登记**；**实现** **另节** **执行**。
  3. **禁止** **无 § 锚** **改** **`eth_getLogs`** **全局语义**。
  4. **触及** **`crates/api`** **时** **须** **B-120** **类门闸叙事** **同批** **若 bump gate**。（**实现轮**）
  5. **文档轮** **零** **代码**。（**本批** **遵守**）
- **边界（禁止行为）**：**不** **重复** **B-114-1～5** **已交付** **证明**；**不** **单 PR** **文档+大改 indexer**；**不** **改** **P5** **经济投影** **写入路径** **除非** **母表另开**。
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**110 §3.1.2.1**/**B-192**/**本 TT**/**07 §六 6.3A** **互指**；**实现轮** **`cargo test -p traveltrust-api`** **绿**（**另 TT**）。
- **测试**：**`cargo test -p traveltrust-api`**（**仅实现轮**）
- **模块化约束（≤300 行）**：**实现轮** **单 Rust 文件** **≤300 行**；**超标** **拆** **`chain_off`** / **`indexer`** **子模块** **登记**。

---

### TT-B193-EVM-POST-FEEROUTER-PARTIAL-SCOPE-001

- **阶段**：contracts / **规划**（**文档轮** **已交付** **2026-04-13**）
- **状态**：**已封口**（**文档轮**；**§1.1.1.1** 表内 **各子域实现** **仍** **须** **子 TT**）
- **母表**：[任务母表.md](./任务母表.md) **B-193**
- **本轮仅改（文档轮 · 已执行）**：**`docs/spec/14-合约-API-ABI-前后端对齐.md`** **§1.1.1.1**、读前摘要 **§1.1.1** 指针、**`docs/任务母表.md`**（**B-193**）、**`docs/AI任务卡索引.md`**（**一览 204** / **本节** / **未封口枚举** / **B-187 矩阵**）；**未改** **`docs/spec/04-后端与API.md`**（**无** **契约句** **diff**）
- **文档轮交付物**：**`14` §1.1.1.1** — **FeeRouter 之后** **8** 行 **余量子域表**（**合约 / 索引 / 04·前端 / 指针**）；**三角互指** **B-116**/**`GO_B116`/`GO_B116_P4`**/**B-193**/**07 §六 6.3A**。
- **改动说明（原卡 · 已满足）**：
  1. **B-116 MVP** 前提下 **Partial** **子清单**。（**见表**）
  2. **每项** **GO** **或** **未来 TT** **占位**。（**见「追踪指针」列**）
  3. **零** **Solidity** **diff**。
  4. **07·6.3A** **读者** **余量入口** **=** **14 §1.1.1.1**。
  5. **实现** **另开** **单 TT**（**母表** **续号**）。
- **边界（禁止行为）**：**不** **改** **ABI JSON** **形状** **unless** **14+合约+双份 ABI** **同批**；**不** **forge** **大改** **于** **文档轮**；**不** **吞** **B-115/B-116** **已封口** **范围**。（**本批** **遵守**）
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿；**14 §1.1.1.1**/**B-116**/**B-193**/**TT-B193**/**07 §六 6.3A** **互指**；**实现子 TT** **`forge test`** / **`cargo test`** **按子 TT**。
- **测试**：—（**文档轮**）；**子 TT** **另列**
- **模块化约束（≤300 行）**：**未来实现轮** **单合约/单 Rust 文件** **≤300 行** **或** **按仓库既有分文件惯例**。

---

### TT-B204-110-FULL-CHAIN-SCAN-IMPLEMENTATION-001

- **阶段**：indexer / **110 §3.1.2.1 · 全量扫链最小切片**（**母表 B-204**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-204**（承 **B-192**/**TT-B192**、**B-114**、**B-120**）
- **本轮已改**：**`crates/api/src/chain/indexer/checkpoint.rs`**、**`crates/api/src/chain/indexer/mod.rs`**、**`crates/api/src/chain/indexer/tests.rs`**、**`crates/api/src/routes/internal/indexer/tick/reorg_from_block.rs`**、**`crates/api/src/routes/internal/indexer/tick/handler.rs`**、**`crates/api/src/routes/internal/indexer/tick/handler_helpers.rs`**、**`docs/spec/04-后端与API.md`** **§3.4** **`indexer-tick`**、**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **+** **版本 1.0.101**、**`docs/spec/08-3-参数与门禁表.md`** **附录 A** **+** **变更记录**、**`.env.example`**、**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**
- **任务（已交付 · 最小范围）**：**ENV `INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`**（**正整数**）时 **`POST …/internal/indexer-tick`** **`fromBlock`**=**`max(last_block+1, 配置值)`**；成功 **200**（**含** **`no_new_blocks`****/**`awaiting_finality`**）根级可含 **`full_scan_lower_bound_observability`**（**`schema_version`****=****1**、**`anchor`****=`110-FULL-SCAN-LOWER-BOUND-V1`**）。**不**声称 **全集链上证明**；**不**改 **`eth_getLogs`** **跨地址合并规则**。
- **边界（未吞并）**：**110** **余量 Target**（**批编排**/**证据归档**/**全集证明** 等）**仍** **开放**；**后续** **另 TT** **或** **续展 B-204** **须** **母表/索引** **登记**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**110**/**04**/**08-3**/**母表 B-204**/**本节** **互指**。
- **测试**：**`cargo test -p traveltrust-api`** **`b204`**

### TT-B205-GOVERNANCE-POOL-TREASURY-ERC20-SSOT-HANDLER-001

- **阶段**：governance / API · **B110-SSOT-06** **`treasury_erc20_pool*`**（**母表 B-205**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-205**
- **本轮已改**：**`crates/api/src/jsonrpc_mock_server.rs`**（**`spawn_mock_jsonrpc_eth_call_sequence`** **抽取**）；**`crates/api/src/routes/health_meta/tests/inc_helpers.rs`**、**`mod.rs`**（**委托 mock**）；**`crates/api/src/routes/governance/tests/fragments/part_01.rs`**、**`part_02.rs`**（**单测** **+** **guard** **兼容** **`String::from` 注入**）；**`scripts/gates/ssot-guard-b110-pool-ssot.py`**（**断言** **`governance/tests/mod.rs`**；**`m.insert` 白名单** **仅** **`pool_chain.rs`**）；**`docs/spec/04-后端与API.md`** **§3.4**；**`docs/spec/14-合约-API-ABI-前后端对齐.md`** **§1.1.0b**；**`docs/任务母表.md`**；**`docs/AI任务卡索引.md`**
- **任务（已交付）**：**`GET …/governance/pool`** **根级** **`treasury_erc20_pool*`** **链上 SSOT**（**闸** **`GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT`**、**`GOVERNANCE_TREASURY_ADDRESS`**、**`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**、**`ssot_read_governance_treasury_erc20_balance_hex`**）；**与** **`pool_balance`/`country_pool`/`treasury_pool`（Wei）** **解耦** **并行** **`tokio::join`** **腿**。**规范别名** **`TT-SSOT-SWITCH-APPLY-003`** **=** **本 TT**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**`python scripts/ssot-guard-b110-pool-ssot.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`** **`b205_governance_pool_treasury_erc20_ssot_merges_on_placeholder_branch`**

### TT-B206-14-POST-FEEROUTER-FIRST-SUBDOMAIN-IMPL-001

- **阶段**：contracts / **14 §1.1.1.1 表内单列**（**母表 B-206**）；**indexer / 04** **本批未改**（**`PlatformFeeRouted`** **签名字段不变**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-206**（承 **B-193**/**TT-B193**、**B-116**）
- **封口批已落**：**`contracts/src/FeeRouter.sol`**（**`countryBucketAlt`**、**`setCountryBucketSplit`**、**`CountryBucketSplitSet`**、**`distribute`** **country 档** **双路** **`transfer`**）；**`contracts/test/FeeRouter.t.sol`**（**`test_B206_*`**）；**`contracts/abi/FeeRouter.json`** ↔ **`frontend/dapp/abis/FeeRouter.json`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1 / §1.1.1 / §1.1.1.1** **首行** **+** **checklist** **对读**
- **任务（摘要）**：**14 §1.1.1.1** **首行** — **可选** **country 档** **`countryBucket`/`countryBucketAlt`** **BPS** **再分**；**`PlatformFeeRouted.toCountry`** **仍为** **country 档合计**。**十国逐国链上再分** **仍** **Target**。**第二行起** **须** **另开** **母表行+TT**。**禁止** **单 PR** **吞表**。
- **验收**：**`forge test --match-contract FeeRouterTest`** **绿**；**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/check-55-s13.sh`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`forge test --match-contract FeeRouterTest`**；**`cargo test -p traveltrust-api`**

---

### TT-B207-04-MEDIA-SIGNED-URLS-BLOB-001

- **阶段**：api / **04 §3.4** · **媒体证据链**（**母表 B-207**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-207**（**TT-B187** **Pass-1** **登记** → **本卡实现封口**）
- **封口批已落**：**`crates/api/src/media_blob_upstream.rs`**（**`TRAVELTRUST_MEDIA_EVIDENCE_FETCH_URL_TEMPLATE`** **`{order_id}`**/**`{content_hash}`**、**`TRAVELTRUST_MEDIA_EVIDENCE_MAX_BYTES`**、**`TRAVELTRUST_MEDIA_EVIDENCE_FETCH_TIMEOUT_SECS`**、**reqwest** **拉取** **须** **`Content-Length`**）；**`crates/api/src/routes/media.rs`**（**模板已设** **→** **`GET …/media/access/:token_id`** **`200`** **原始体** + **`Content-Type`**/**`scope=download`** **`Content-Disposition`**；**未设** **→** **JSON** **元数据** **+** **`implementation_note`**）；**`crates/api/src/routes/admin/media_read.rs`**（**note** **互指**）；**`docs/spec/04-后端与API.md`** **§3.4**；**`.env.example`**
- **任务（摘要）**：**批 270** **`media/access`** **从** **纯占位** **到** **可配置上游 URL 模板** **的** **真字节响应**（**POST 签发** **路径** **本卡** **未改** **业务语义**）。**Runbook/08-3** **全附录** **未** **同批**（**非** **本卡** **硬门禁**）。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**（**含** **`media_blob_upstream`** **单测**）

### TT-B208-14-REGIONVAULT-TABLE-ROW2-SUBDOMAIN-001

- **阶段**：api / **admin + internal** · **14 §1.1.1.1a** **柱 C**（**母表 B-208**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-208**（承 **B-193**/**B-206**/**B-116**；**柱 A/B** **边界** **仍** **[14 · §1.1.1.1a](./spec/14-合约-API-ABI-前后端对齐.md)**）
- **封口批已落**：**`crates/api/src/db/region_snapshot.rs`**（**`list_region_share_snapshot_lines_export`**）；**`crates/api/src/routes/admin/region_vault.rs`**（**`region_vault_forwarded_export_response`**、**`validate_region_vault_forwarded_export_query`**、**`include_snapshot_explain`**）；**`crates/api/src/routes/internal/region_vault_export.rs`** + **`internal/mod.rs`**；**`admin/mod.rs`** **`pub(crate)`** **再导出**；**`docs/spec/04-后端与API.md`** **§3.5** **`…/forwarded-events/export`** + **内部 API** **总述**；**`docs/spec/14-合约-API-ABI-前后端对齐.md`** **§1.1.1.1**/**§1.1.1.1a** **封口态**；**`routes/admin/tests/inc_part_08.rs`**
- **任务（摘要）**：**柱 C** **专项对账导出** — **`GET …/admin/region-vault/forwarded-events/export`**（**审计** + **JSON** **`meta.build`**）**；** **`GET …/internal/region-vault/forwarded-events/export`**（**无审计**；**JSON** **无** **`meta.build`**）；**`include_snapshot_explain=true`** **仅** **`format=json`**。**柱 A/B** **未** **本卡** **吞并**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**（**含** **`admin_region_vault_forwarded_events_export_*`**）

### TT-B218-14-FEEROUTER-ROUTED-EVENTS-EXPORT-001

- **阶段**：api / **admin + internal** · **14 §1.1.1.1** **柱 C**（**母表 B-218**；对称 **B-208**/**TT-B208**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-218**（承 **B-208**/**B-193**/**B-116**）
- **封口批已落**：**`crates/api/src/db/fee_router_events.rs`**（**`ADMIN_FEE_ROUTER_EXPORT_MAX_ROWS`**、**`list_fee_router_routed_events_export`**）；**`crates/api/src/routes/admin/fee_router.rs`**（**`fee_router_routed_export_response`**、**`validate_fee_router_routed_export_query`**）；**`crates/api/src/routes/internal/fee_router_export.rs`** + **`internal/mod.rs`**；**`admin/mod.rs`**；**`read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`** **§3.4** **内部 API** + **§3.5** **`…/fee-router/routed-events/export`**；**`routes/admin/tests/inc_part_01.rs`**/**`inc_part_08.rs`**
- **任务（摘要）**：**`GET …/admin/fee-router/routed-events/export`**（**审计** + **JSON** **`meta.build`**）**；** **`GET …/internal/fee-router/routed-events/export`**（**无审计**；**JSON** **无** **`meta.build`**）；**`format=csv|json`**、**`chain_id?`**、**`limit?`**（**缺省 2000**）。**无** **`include_snapshot_explain`**（**与** **RegionVault** **export** **差分**）。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**（**含** **`admin_fee_router_routed_events_export_*`**、**`fee_router_routed_export_csv_*`**）

### TT-B219-110-EVIDENCE-BUNDLE-CANONICAL-COMBINE-001

- **阶段**：indexer / **110 §3.1.2.1 · evidence 三件套标准化汇编**（**母表 B-219**；承 **B-210**/**TT-B210**、**B-213**/**TT-B213**、**B-216**/**TT-B216**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-219**
- **封口批已落**：**`scripts/ops/write-indexer-evidence-bundle-canonical.sh`**（**根** **`scripts/write-indexer-evidence-bundle-canonical.sh`** **转发**）；**`scripts/ops/internal-indexer-ops.sh`**/**`.ps1`** **`evidence-bundle-canonical`**；**`scripts/ops/fixtures/indexer_evidence_bundle_canonical_index.example.json`**；**`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`****`125`**（**+2** **`check_anchor`**：**`110-INDEXER-EVIDENCE-BUNDLE-CANONICAL-V1`**、**`scripts_internal_indexer_ops_evidence_bundle_canonical`**）；**`scripts/ops/indexer-reconcile-probe.sh`** **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`****`125`**；**`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.11.0`**；**`ops/RUNBOOK.md`** **§2.55**（**B-219** **实现** **+** **B-221** **标准用法** **长段**）；**`scripts/README.md`**（**B-221** **摘要**）；**本索引一览 236 / 本节**
- **任务（摘要）**：**固定目录** **`OUT_DIR/artifacts/`** — **`b210_manifest.json`**、**`b216_historical_completeness_proof_v0.json`**、**`b213_indexer_tick_loop_evidence.json`**；**`artifacts.sha256`**；**`bundle_canonical_index.json`** + **`bundle_canonical_index.sha256`**。**ENV**：**`CANONICAL_BUNDLE_STAGE_GO_DIR`**（**其下** **`manifest.json`**）**或** **`CANONICAL_BUNDLE_B210_MANIFEST_PATH`**；**可选** **`CANONICAL_BUNDLE_B216_PROOF_PATH`**/**`CANONICAL_BUNDLE_B213_EVIDENCE_PATH`**（**离线** **复制**）**否则** **分别** **委托** **`write-indexer-historical-completeness-proof.sh`** **与** **`tick-loop --write-evidence-json`**（**须** **可达** **API**）。
- **边界（未吞并）**：**不**改 **`POST …/internal/indexer-tick`** **Rust**；**不** **扩** **B-210** **`manifest.json`** **根** **登记块** **形**；**不** **新增** **04 §3.4** **契约句**（**本卡** **纯** **ops/gate**）。
- **验收**：**`.github/workflows/indexer-reconcile-gate.yml`** **`grep -c 'check_anchor \"'`** **=** **`checks_total`**（**125**）；**`scripts/ops/indexer-reconcile-probe.sh`** **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** **同值**；**`bash -n scripts/ops/write-indexer-evidence-bundle-canonical.sh`** **绿**
- **测试**：—（**本卡** **无** **新增** **Rust** **用例**）

### TT-B220-110-GATE-CHECKS-TOTAL-CONSISTENCY-SWEEP-001

- **阶段**：docs / **indexer-reconcile-gate** **现行叙事** **与** **YAML**/**`probe`** **三线对齐**（**母表 B-220**；**承** **B-219**）
- **状态**：**已封口**（**2026-04-14** · **文档轮**）
- **母表**：[任务母表.md](./任务母表.md) **B-220**
- **封口批已落**：**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2**/**§3.1.2.1** **台账** **+** **1.0.110**；**`docs/spec/07-开发流程与顺序.md`** **§二 2.3**/**§六 6.3A/6.3B/6.4**/**Version 1.0.848**/**§六 6.5**（**嗣后** **`RUNBOOK`/`scripts/README`** **B-221** **扩写** → **`07`****`1.0.849`** **见** **一览** **238**）；**`docs/spec/00-文档索引.md`** **07/110**（**及** **04/08-3** **版本表行**）；**`ops/RUNBOOK.md`** **§2.55**；**`scripts/README.md`**；**`docs/spec/04-后端与API.md`** **§6** **封口标准**；**`docs/spec/08-3-参数与门禁表.md`** **变更记录**；**本索引一览 237 / 本节**
- **任务（摘要）**：**扫除** **仍写** **现行** **`checks_total`****`123`**/**`115`** **而** **`.github/workflows/indexer-reconcile-gate.yml`**/**`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** **已为** **`125`** **之** **文档句**；**保留** **B-216/B-217** **各批** **封口才** **`122`/`123`** **历史脚注**。
- **边界**：**不**改 **`.github/workflows/indexer-reconcile-gate.yml`** **与** **`scripts/ops/indexer-reconcile-probe.sh`** **头常量**（**本批** **零** **diff**）。
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`grep -c 'check_anchor \"'`** **`.github/workflows/indexer-reconcile-gate.yml`****`=`****`125`**
- **测试**：—

### TT-B221-110-RUNBOOK-EVIDENCE-BUNDLE-USAGE-CANONICAL-001

- **阶段**：docs / **Runbook + scripts 索引** · **B-219 evidence-bundle canonical** **标准运维流程**（**母表 B-221**；**承** **B-219**/**TT-B219**）
- **状态**：**已封口**（**2026-04-14** · **文档轮**）
- **母表**：[任务母表.md](./任务母表.md) **B-221**
- **封口批已落**：**`ops/RUNBOOK.md`** **§2.55**（**前置**、**一键命令**、**目录树**、**`sha256sum`/`shasum -c`**、**`jq`****`bundle_anchor`**、**`bash -n`**）；**`scripts/README.md`**（**篇首摘要段** + **「一、日常开发」表行** **`write-indexer-evidence-bundle-canonical.sh`** + **`internal-indexer-ops.ps1`** **`evidence-bundle-canonical`** **提示**）；**`docs/spec/07-开发流程与顺序.md`** **§六 6.4**/**6.5**/**Version 1.0.849**；**`docs/spec/00-文档索引.md`** **07** **行**；**本索引一览 238 / 本节**
- **任务（摘要）**：**不**改 **`write-indexer-evidence-bundle-canonical.sh`** **行为**；**仅** **固化** **值班可读** **的** **同序** **操作说明** **与** **归档校验** **步骤**。
- **边界**：**不** **bump** **`indexer-reconcile-gate` `checks_total`**；**不** **改** **04 §3.4** **契约句**。
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`bash -n scripts/ops/write-indexer-evidence-bundle-canonical.sh`** **绿**；**离线三 PATH** **汇编** **后** **`OUT_DIR`** **内** **`sha256sum -c artifacts.sha256`**（**或** **`shasum -a 256 -c`**）**与** **`bundle_canonical_index.sha256`** **绿**；**`jq -e '.bundle_anchor == "110-INDEXER-EVIDENCE-BUNDLE-CANONICAL-V1"' bundle_canonical_index.json`** **绿**
- **测试**：—（**文档** **+** **shell** **校验**）

### TT-B222-110-EVIDENCE-BUNDLE-CI-AUTO-RUN-001

- **阶段**：CI / **`indexer-reconcile-gate`** · **B-219 evidence-bundle canonical** **离线复现链**（**母表 B-222**；**承** **B-219**/**B-221**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-222**
- **封口批已落**：**`.github/workflows/indexer-reconcile-gate.yml`**（**`Build and verify indexer evidence-bundle canonical`** **步** **+** **`upload-artifact`** **`indexer_evidence_bundle_canonical_ci/**`**）；**`scripts/ops/fixtures/ci_evidence_bundle_b210_manifest.json`**、**`scripts/ops/fixtures/ci_evidence_bundle_b213_tick_loop_evidence.json`**（**`B-216`** **用** **`indexer_historical_completeness_proof_v0.example.json`**）；**`ops/RUNBOOK.md`**/**`scripts/README.md`** **CI** **互指**；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`**；**`docs/spec/07-开发流程与顺序.md`** **Version 1.0.850**/**§六 6.4/6.5**；**`docs/spec/00-文档索引.md`** **07/110**；**本索引一览 239 / 本节**
- **任务（摘要）**：**每** **PR/push** **`main`** **在** **anchor** **门禁** **通过后** **同** **job** **内** **离线** **汇编** **并** **校验** **bundle**；**产物** **入** **`indexer-reconcile-evidence`** **artifact**。
- **边界**：**不** **增加** **`check_anchor`**（**`checks_total`****`125`** **不变**）；**不** **改** **`write-indexer-evidence-bundle-canonical.sh`** **汇编语义**（**仅** **fixture** **+** **workflow**）。
- **验收**：**本地** **复现** **workflow** **shell** **块** **绿**（**见** **YAML**）；**`bash scripts/check-07-version-triple.sh`** **绿**
- **测试**：—（**CI** **与** **fixture** **字节** **为** **主** **回归**）

### TT-B223-14-REGIONVAULT-COUNTRY-LEDGER-READ-MODEL-V1-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **投影只读 Σ**（**母表 B-223**；**与** **P5-1** **`country_ledger_ssot_v0`** **正交**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-223**
- **封口批已落**：**`crates/api/src/region_vault_country_ledger_map.rs`**、**`crates/api/src/db/region_vault_country_ledger_read.rs`**、**`crates/api/src/routes/admin/region_vault_country_ledger_read.rs`**、**`crates/api/src/routes/internal/region_vault_country_ledger_read.rs`**、**`config/region_vault_country_ledger_map.template.json`**、**`.env.example`**、**`docs/spec/04-后端与API.md`**（**§3.5** **表行** + **内部 API** **长段** + **`meta.build`** **枚举** + **§四** **迁移消费**）；**`read_contract_route_guard`** **注册表**；**本索引一览 240 / 本节**
- **任务（摘要）**：**不改合约**；**`fetch_region_vault_for_aggregate`** **同源行** **按** **`to_address`** **映射** **辖区** **后** **uint256 Σ**；**无映射** **时** **`unassigned.by_recipient`** **承载** **全部**。
- **边界**：**不** **写** **`fee_router_routed_events`**；**不** **冒充** **`governance/pool`** **链上 SSOT**（**根级** **禁** **B110** **键** **断言** **沿用** **`economic_aggregate`**）。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B224-14-REGIONVAULT-LEDGER-SNAPSHOT-EXPLAIN-EXPORT-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-223 Σ 附件 + snapshot explain**（**母表 B-224**；**对齐** **B-208** **export** **形态**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-224**
- **封口批已落**：**`crates/api/src/db/region_vault_country_ledger_read.rs`**（**`region_vault_country_ledger_read_model_export_csv`**、**`RV_COUNTRY_LEDGER_EXPORT_*`**）；**`crates/api/src/routes/admin/region_vault_country_ledger_read_export.rs`**、**`crates/api/src/routes/internal/region_vault_country_ledger_read_export.rs`**、**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**、**`crates/api/src/routes/admin/region_vault.rs`**（**`region_share_snapshot_line_row_to_json`** **`pub(crate)`**）；**`crates/api/src/routes/admin/audit_read.rs`**（**`ADMIN_AUDIT_ACTION_CODES`**）；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`crates/api/src/routes/admin/tests/inc_part_08.rs`**；**`docs/spec/04-后端与API.md`**（**§3.4** **`fee-pool-aggregates`** **互指**、**§3.5** **admin** **表**、**内部 API** **长段**、**`meta.build`**、**§四** **消费**）；**本索引一览 241 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/country-ledger-read-model/export`**；**`format=csv|json`**、**`include_snapshot_explain`** **语义** **同** **B-208**；**`json`** **根级** **`country_ledger_read_model`** **嵌** **B-223** **体**。
- **边界**：**不** **改合约**；**不** **将** **`region_share_snapshot_lines_explain`** **升格** **为** **governance/pool** **SSOT**（**B110-SSOT-07**）。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B225-14-REGIONVAULT-SNAPSHOT-CLAIM-READINESS-GATE-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **snapshot × ledger claim 就绪门禁**（**母表 B-225**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-225**
- **封口批已落**：**`crates/api/src/db/region_vault_snapshot_claim_readiness.rs`**；**`crates/api/src/routes/admin/region_vault_snapshot_claim_readiness.rs`**、**`crates/api/src/routes/internal/region_vault_snapshot_claim_readiness.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**（**§3.5**、**内部 API** **长段**、**`meta.build`**、**附录** **RegionVault** **行**）；**本索引一览 242 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-readiness`**；**`items[]`**** **`readiness=ready|blocked`** **+** **`reasons[]`**；**query** **`chain_id?`****/**`jurisdiction?`****/**`snapshot_epoch?`**。
- **边界**：**只读**；**非** **链上** **claim** **可执行** **SSOT**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B226-14-REGIONVAULT-CLAIM-DRYRUN-PAYLOAD-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-225 ready 轮次 claim dry-run**（**母表 B-226**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-226**
- **封口批已落**：**`crates/api/src/db/region_vault_snapshot_claim_dryrun.rs`**；**`crates/api/src/routes/admin/region_vault_snapshot_claim_dryrun.rs`**、**`crates/api/src/routes/internal/region_vault_snapshot_claim_dryrun.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**本索引一览 243 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-dryrun-payload(/export)`**；**`rounds[]`**** **`tokens[]`****+****`lines[]`** **pro_rata** **同形** **B-086**。
- **边界**：**只读**；**不** **广播** **上链**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B227-14-REGIONVAULT-CLAIM-BATCH-PLAN-EXPORT-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-226 dryrun → 批次计划**（**母表 B-227**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-227**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_batch_plan.rs`**；**`crates/api/src/routes/admin/region_vault_claim_batch_plan.rs`**、**`crates/api/src/routes/internal/region_vault_claim_batch_plan.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**本索引一览 244 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-batch-plan(/export)`**；**`batches[]`**** **键** **`(jurisdiction, snapshot_epoch)`**；**`chain_executions[]`**** **升序** **`chain_id`**。
- **边界**：**只读**；**不** **上链**；**不** **改** **SSOT**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B228-14-REGIONVAULT-CLAIM-EXECUTION-EVIDENCE-STUB-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-227 batch plan → 执行证据壳（占位字段）**（**母表 B-228**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-228**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_execution_evidence_stub.rs`**；**`crates/api/src/routes/admin/region_vault_claim_execution_evidence_stub.rs`**、**`crates/api/src/routes/internal/region_vault_claim_execution_evidence_stub.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**本索引一览 245 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-execution-evidence-stub(/export)`**；**`claim_execution_evidence_plan_id`**（**稳定** **SHA256**）；**`batch_summary`****+****`execution_evidence_stub`****（** **`tx_hash`****/**`status`****/**`block_number`****/**`log_index`** **预留**）**。
- **边界**：**只读**；**不** **发交易**；**不** **写** **链上** **证据**（**stub** **仅** **定型** **字段**）。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B229-14-REGIONVAULT-CLAIM-EXECUTION-STATUS-IMPORT-READMODEL-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-228 stub + 外部导入执行状态只读合并**（**母表 B-229**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-229**
- **封口批已落**：**`crates/api/src/region_vault_claim_execution_status_import.rs`**；**`crates/api/src/db/region_vault_claim_execution_status_read_model.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/main.rs`**；**`crates/api/src/state/mod.rs`**、**`crates/api/src/startup/run.rs`**；**`crates/api/src/routes/admin/region_vault_claim_execution_status_read_model.rs`**、**`crates/api/src/routes/internal/region_vault_claim_execution_status_read_model.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**`.env.example`**；**本索引一览 246 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-execution-status-read-model(/export)`**；**可选** **`REGION_VAULT_CLAIM_EXECUTION_STATUS_IMPORT_PATH`**；**`execution_status_read_model`**** **+** **`data_sources.execution_status_import`**。
- **边界**：**只读**；**不** **上链**；**不** **RPC** **验导入** **真伪**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B230-14-REGIONVAULT-CLAIM-EXECUTION-RECONCILE-REPORT-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-226～B-229 合成 reconcile（expected/executed/delta）**（**母表 B-230**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-230**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_execution_reconcile_report.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/routes/admin/region_vault_claim_execution_reconcile_report.rs`**、**`crates/api/src/routes/internal/region_vault_claim_execution_reconcile_report.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**本索引一览 247 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-execution-reconcile-report(/export)`**；**`reconcile_summary`**** **+** **`batches[]`**** **`expected`****/**`executed`****/**`delta`**。
- **边界**：**只读**；**不** **上链**；**不** **RPC** **验** **导入** **或** **金额**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B231-14-REGIONVAULT-CLAIM-GO-NO-GO-GATE-READONLY-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-230 + B-225 只读 GO/NO-GO 门禁摘要**（**母表 B-231**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-231**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_go_no_go_gate_readonly.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/routes/admin/region_vault_claim_go_no_go_gate_readonly.rs`**、**`crates/api/src/routes/internal/region_vault_claim_go_no_go_gate_readonly.rs`**；**`crates/api/src/routes/admin/mod.rs`**、**`crates/api/src/routes/internal/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**本索引一览 248 / 本节**
- **任务（摘要）**：**`GET …/admin|internal/region-vault/snapshot-claim-go-no-go-gate(/export)`**；**`gate_summary`****+****`gates[]`**** **`readiness_aggregate`****/**`reconcile_code`****/**`delta_notes`****/**`verdict`****。
- **边界**：**只读**；**不** **上链**；**不** **执行** **claim**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B232-14-REGIONVAULT-CLAIM-GO-NO-GO-EVIDENCE-BUNDLE-001

- **阶段**：api / **14 §1.1.1 · RegionVault** · **B-225～B-231 只读 claim 证据包（admin）**（**母表 B-232**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-232**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_go_no_go_evidence_bundle.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/routes/admin/region_vault_claim_go_no_go_evidence_bundle.rs`**；**`crates/api/src/routes/admin/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`**；**`ops/RUNBOOK.md`** **§2.55**；**本索引一览 249 / 本节**
- **任务（摘要）**：**`GET …/admin/region-vault/snapshot-claim-go-no-go-evidence-bundle(/export)`**；**`legs`****+****`leg_content_sha256`****+****`bundle_legs_sha256`**；**`format=csv`** **索引** **表**。
- **边界**：**只读**；**不** **上链**；**不** **执行** **claim**；**无** **internal** **镜像**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B233-14-REGIONVAULT-CLAIM-EVIDENCE-BUNDLE-RUNBOOK-CI-001

- **阶段**：CI / **14 · RegionVault** · **B-232 证据包离线验收与 artifact**（**母表 B-233**；承 **B-232**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-233**
- **封口批已落**：**`.github/workflows/build.yml`**（**`Claim GO/NO-GO evidence bundle CI artifact (B-233)`** **步** **+** **`build-backend-evidence`** **路径** **`claim_go_no_go_evidence_bundle_ci/**`**）；**`scripts/verify-claim-go-no-go-evidence-bundle.sh`**；**`scripts/ops/verify-claim-go-no-go-evidence-bundle.py`**（**子命令** **`ci`****/**`live-read`****/**`live-full`**）；**`crates/api/src/db/region_vault_claim_go_no_go_evidence_bundle.rs`** **`claim_go_no_go_evidence_bundle_ci_artifact`**；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5** **B-232** **`/export`** **行** **CI** **脚注**；**本索引一览 250 / 本节**
- **任务（摘要）**：**`TRAVELTRUST_CLAIM_GO_NO_GO_BUNDLE_CI_OUT`** **驱动** **落盘** **`bundle_read.json`****/**`bundle_export.json`****/**`index.csv`****/**`claim_go_no_go_evidence_bundle_ci_summary.json`**；**Python** **`ci`** **复验** **`leg_content_sha256`****/**`bundle_legs_sha256`****/**文件** **SHA256** **与** **summary** **一致**。
- **边界**：**不** **上链**；**不** **执行** **claim**；**fixture** **为** **最小** **七腿** **形状** **（** **非** **联机** **DB** **快照** **黄金** **文件** **）**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python3 scripts/ops/verify-claim-go-no-go-evidence-bundle.py ci`** **对** **CI** **产出目录** **绿**
- **测试**：**`cargo test -p traveltrust-api`** **`claim_go_no_go_evidence_bundle_ci_artifact`**

### TT-B234-14-REGIONVAULT-CLAIM-LIVE-ADMIN-VALIDATION-RUNBOOK-001

- **阶段**：ops / **14 · RegionVault** · **B-232/B-233 联机 admin 验收 Runbook+脚本**（**母表 B-234**；承 **B-232**/**B-233**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-234**
- **封口批已落**：**`scripts/region-vault-claim-go-no-go-evidence-bundle-live-admin-validate.sh`**；**`scripts/ops/region-vault-claim-go-no-go-evidence-bundle-live-admin-validate.sh`**；**`scripts/ops/verify-claim-go-no-go-evidence-bundle.py`** **`live-read`****/**`live-full`**；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5** **B-232** **read** **行** **脚注**；**`scripts/README.md`**；**本索引一览 251 / 本节**
- **任务（摘要）**：**`ADMIN_BEARER_TOKEN`** **+** **`curl`** **read** **/** **export json** **/** **export csv**；**200**、**export** **`x-traveltrust-reconcile-export-sha256`****=****`sha256(体)`**、**CSV** **8** **行**、**`live_admin_summary.json`**（**锚** **`14-REGIONVAULT-CLAIM-GO-NO-GO-EVIDENCE-BUNDLE-LIVE-ADMIN-V1`**）；**与** **B-233** **同** **哈希** **算法** **对** **`legs`****/**`leg_content_sha256`****/**`bundle_legs_sha256`**。
- **边界**：**不** **上链**；**不** **执行** **claim**；**不** **绑** **默认** **CI**（**须** **自备** **admin** **环境**）。
- **验收**：**联机** **`bash scripts/region-vault-claim-go-no-go-evidence-bundle-live-admin-validate.sh`** **exit 0**（**预发** **/** **值班** **环境**）
- **测试**：—（**本卡** **无** **新增** **Rust** **门禁**；**可选** **本地** **用** **`live-full`** **对** **B-233** **fixture** **目录** **冒烟**）

### TT-B235-14-REGIONVAULT-CLAIM-GO-NO-GO-LIVE-EVIDENCE-ARCHIVE-001

- **阶段**：ops / **14 · RegionVault** · **B-234 联机产物标准归档**（**母表 B-235**；承 **B-232**/**B-233**/**B-234**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-235**
- **封口批已落**：**`scripts/archive-region-vault-claim-go-no-go-live-evidence.sh`**；**`scripts/ops/archive-region-vault-claim-go-no-go-live-evidence.sh`**；**`archive_manifest.json`**（**含** **`index`****/**`navigation`** **B-236**）**/** **`README.md`** **/** **`ARCHIVE_README.md`** **/** **`artifacts.sha256`**（**根** **三** **文件** **+** **`artifacts/*`**）**/** **`artifacts/*`** **命名** **（** **机读锚** **`14-REGIONVAULT-CLAIM-GO-NO-GO-LIVE-EVIDENCE-ARCHIVE-V1`** **）**；**`scripts/ops/verify-claim-go-no-go-evidence-bundle.py`** **`live-full`** **归档** **后** **复验**；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5** **B-232** **行** **脚注**；**`scripts/README.md`**；**本索引一览 252 / 本节**
- **任务（摘要）**：**一键** **委托** **B-234** **至** **`.staging_b234`** **再** **规范化** **复制** **为** **`artifacts/bundle_read.json`** **等**；**`--finalize-only <b234_dir> <archive_root>`** **不** **curl**；**根** **`artifacts.sha256`** **路径** **前缀** **`artifacts/`** **以便** **归档** **根** **`sha256sum -c`**。
- **边界**：**不** **上链**；**不** **执行** **claim**；**不** **改** **API** **契约**。
- **验收**：**`bash scripts/archive-region-vault-claim-go-no-go-live-evidence.sh --finalize-only …`** **或** **联机** **一键** **exit 0**；**归档** **根** **`sha256sum -c artifacts.sha256`** **绿**
- **测试**：—（**无** **新增** **Rust**；**可选** **`bash -n`** **脚本** **+** **`--finalize-only`** **冒烟**）

### TT-B236-14-REGIONVAULT-CLAIM-LIVE-EVIDENCE-INDEX-README-001

- **阶段**：ops / **14 · RegionVault** · **B-235 归档包统一索引与复核入口**（**母表 B-236**；承 **B-235**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-236**
- **封口批已落**：**`scripts/ops/archive-region-vault-claim-go-no-go-live-evidence.sh`** **生成** **根** **`README.md`**（**总览**、**manifest** **键** **导航**、**复跑** **命令**）；**`archive_manifest.json`** **`index`****（** **`check_anchor`****=****`14-REGIONVAULT-CLAIM-LIVE-EVIDENCE-INDEX-README-V1`** **）** **与** **`navigation`**；**`artifacts.sha256`** **纳入** **`README.md`****/**`ARCHIVE_README.md`****/**`archive_manifest.json`**；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5**；**`scripts/README.md`**；**本索引一览 253 / 本节**
- **任务（摘要）**：**每次** **联机** **归档** **同构** **审计**：**先** **打开** **`README.md`** → **按** **清单** **跑** **`sha256sum -c`****/**`jq`** **三** **锚** **快检** **→** **`live-full`**。
- **边界**：**不** **上链**；**不** **执行** **claim**；**不** **单独** **改** **API** **契约**（**指针** **仅** **04** **脚注**）。
- **验收**：**新** **归档** **含** **`README.md`**；**`sha256sum -c artifacts.sha256`** **绿**；**`README.md`** **内** **`jq`** **三** **`test`** **绿**
- **测试**：—（**无** **Rust**）

### TT-B237-14-REGIONVAULT-CLAIM-LIVE-EVIDENCE-CI-ARCHIVE-SMOKE-001

- **阶段**：CI / **14 · RegionVault** · **B-235/B-236 归档脚本冒烟**（**母表 B-237**；承 **B-233**/**B-235**/**B-236**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-237**
- **封口批已落**：**`scripts/ops/claim-go-no-go-bundle-ci-out-to-b234-staging.sh`**；**`scripts/ops/claim_go_no_go_bundle_b234_live_summary_from_env.py`**；**`scripts/ops/region-vault-claim-live-archive-ci-smoke.sh`**；**`scripts/region-vault-claim-live-archive-ci-smoke.sh`**；**`scripts/ops/archive_claim_go_no_go_live_write_manifest.py`**（**B-235** **归档** **写** **manifest**）；**`.github/workflows/build.yml`** **`Claim live evidence archive CI smoke (B-237)`**；**`ops/RUNBOOK.md`** **§2.55**；**`scripts/README.md`**；**本索引一览 254 / 本节**
- **任务（摘要）**：**`cargo test … claim_go_no_go_evidence_bundle_ci_artifact`****+****`verify … ci`** **之后** **将** **B-233** **目录** **合成** **B-234** **snapshot** **文件名** **并** **`finalize-only`**；**断言** **`README.md`****/**`archive_manifest.json`****/**`artifacts.sha256`** **与** **`index.check_anchor`** **+** **`sha256sum -c`**。
- **边界**：**不** **curl** **真实** **admin**；**不** **上链**；**不** **执行** **claim**。
- **验收**：**Build** **job** **该** **步** **绿**；**本地** **同** **命令** **链** **绿**
- **测试**：—（**无** **新增** **Rust** **用例**；**冒烟** **即** **门禁**）

### TT-B238-14-REGIONVAULT-CLAIM-GO-NO-GO-RELEASE-GATE-READONLY-001

- **阶段**：API / **14 · RegionVault** · **claim GO/NO-GO 发布门禁只读摘要**（**母表 B-238**；承 **B-231～B-237**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-238**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_go_no_go_release_gate_readonly.rs`**；**`crates/api/src/db/mod.rs`**；**`crates/api/src/routes/admin/region_vault_claim_go_no_go_release_gate_readonly.rs`**；**`crates/api/src/routes/admin/mod.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`docs/spec/04-后端与API.md`** **§3.5**；**`ops/RUNBOOK.md`** **§2.55**；**本索引一览 255 / 本节**
- **任务（摘要）**：**`build_region_vault_claim_go_no_go_release_gate_readonly_body`** **内** **先** **B-232** **证据包** **再** **派生** **`release_verdict`****（** **`GO`****/**`NO_GO`****/**`NO_OP`** **）** **与** **`blocking_reasons[]`**；**静态** **`required_evidence_checklist`****+****`archive_integrity_checks`** **指向** **B-233～B-237**/**B-240**/**B-241** **运维**/**CI** **（** **API** **不读** **归档** **盘** **）**；**`GET …/admin/region-vault/snapshot-claim-go-no-go-release-gate(/export)`** **JSON+CSV** **附件** **与** **reconcile** **export** **头** **同形**。
- **边界**：**无** **internal** **镜像**；**不** **上链**；**不** **执行** **claim**；**不** **替代** **B-233～B-237** **脚本** **真值** **（** **清单** **为** **指针** **+** **模板** **）**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`python scripts/check-04-routes-vs-code.py`** **绿**；**联机** **按** **RUNBOOK** **§2.55** **B-238** **最小** **验收** **（** **200** **+** **export** **SHA256** **头** **+** **verdict** **与** **gate_summary** **一致** **）**
- **测试**：**`cargo test -p traveltrust-api`** **（** **含** **`region_vault_claim_go_no_go_release_gate_readonly`** **单测** **）**

### TT-B239-14-REGIONVAULT-CLAIM-GO-NO-GO-RELEASE-GATE-LIVE-ARCHIVE-001

- **阶段**：ops / **14 · RegionVault** · **B-238 联机结果 → B-235 同构归档**（**母表 B-239**；承 **B-238**、模板 **B-235～B-237**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-239**
- **封口批已落**：**`scripts/ops/verify-claim-go-no-go-release-gate.py`**；**`scripts/ops/region-vault-claim-go-no-go-release-gate-live-admin-validate.sh`**；**`scripts/region-vault-claim-go-no-go-release-gate-live-admin-validate.sh`**；**`scripts/ops/archive-region-vault-claim-go-no-go-release-gate-live-evidence.sh`**；**`scripts/archive-region-vault-claim-go-no-go-release-gate-live-evidence.sh`**；**`scripts/ops/archive_claim_go_no_go_release_gate_live_write_manifest.py`**；**`scripts/verify-claim-go-no-go-release-gate.sh`**；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5** **B-238** **脚注**；**`scripts/README.md`**；**本索引一览 256 / 本节**
- **任务（摘要）**：**联机** **拉** **B-238** **read/export** → **`live-read`****/**`live-full`** **（** **CSV** **2** **行** **）** → **`live_admin_summary`** **（** **锚** **`14-REGIONVAULT-CLAIM-GO-NO-GO-RELEASE-GATE-LIVE-ADMIN-V1`** **）**；**`archive-…-release-gate-live-evidence.sh`** **写** **`ARCHIVE_README`****/**`archive_manifest`****（** **`mother_table`****=****`B-239`** **+** **`index.*`**** **B-241** **）****/**`artifacts.sha256`****/**`artifacts/release_gate_read.json`**** **等**；**根** **`README.md`** **索引** **页** **见** **B-241**；**`--finalize-only`** **不** **curl**。
- **边界**：**不** **上链**；**不** **执行** **claim**；**不** **改** **B-238** **HTTP** **契约**（**本卡** **仅** **脚本** **+** **归档** **模板**）。
- **验收**：**`bash -n`** **新** **`.sh`** **绿**；**联机** **validate + archive** **exit 0**；**归档** **根** **`sha256sum -c artifacts.sha256`** **绿**
- **测试**：—（**无** **新增** **Rust**；**Python** **`verify-claim-go-no-go-release-gate.py`** **为** **门禁**）

### TT-B240-14-REGIONVAULT-CLAIM-RELEASE-GATE-CI-ARCHIVE-SMOKE-001

- **阶段**：CI / **14 · RegionVault** · **B-239 归档模板 finalize-only 冒烟**（**母表 B-240**；承 **B-239**、范式 **B-237**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-240**
- **封口批已落**：**`scripts/ops/claim_go_no_go_release_gate_b240_ci_staging_write.py`**；**`scripts/ops/region-vault-claim-release-gate-archive-ci-smoke.sh`**；**`scripts/region-vault-claim-release-gate-archive-ci-smoke.sh`**；**`.github/workflows/build.yml`** **`Claim release gate archive CI smoke (B-240)`**；**`crates/api/src/db/region_vault_claim_go_no_go_release_gate_readonly.rs`**（**`archive_integrity_checks`**** **`b240_release_gate_archive_smoke_green`** **等**）；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5** **B-238**；**`scripts/README.md`**；**本索引一览 257 / 本节**
- **任务（摘要）**：**确定性** **fixture** **写** **B-239** **validate** **同名** **产物** **→** **`archive-region-vault-claim-go-no-go-release-gate-live-evidence.sh --finalize-only`** **→** **断言** **`README`****/**`archive_manifest.json`****（** **`mother_table`****+****`index.mother_table`****+****`index.tt_id`** **）****/**`artifacts.sha256`** **、****`sha256sum -c`****、****`verify-claim-go-no-go-release-gate.py live-full`** **（** **归档** **`artifacts/`** **三** **文件** **）**。
- **边界**：**不** **curl**；**不** **上链**；**不** **执行** **claim**；**fixture** **非** **API** **真值** **（** **仅** **模板** **回归** **）**。
- **验收**：**Build** **job** **该** **步** **绿**；**本地** **`bash scripts/ops/region-vault-claim-release-gate-archive-ci-smoke.sh <empty_archive_dir>`** **exit 0**
- **测试**：**`cargo test -p traveltrust-api`** **绿**（**B-238** **`archive_integrity_checks`** **diff** **触** **既有** **单测** **路径** **时**）

### TT-B241-14-REGIONVAULT-CLAIM-RELEASE-GATE-LIVE-EVIDENCE-INDEX-README-001

- **阶段**：ops / **14 · RegionVault** · **发布门禁归档 README 索引**（**母表 B-241**；承 **B-239**、**B-240**；范式 **B-236**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-241**
- **封口批已落**：**`scripts/ops/archive-region-vault-claim-go-no-go-release-gate-live-evidence.sh`**（**`README.md`****+****`ARCHIVE_README.md`** **文案**）；**`scripts/ops/archive_claim_go_no_go_release_gate_live_write_manifest.py`**（**`index.mother_table`****/**`index.tt_id`****/**`index.parity`**）；**`crates/api/src/db/region_vault_claim_go_no_go_release_gate_readonly.rs`**（**`release_gate_archive_index_readme_b241`**）；**`ops/RUNBOOK.md`** **§2.55**；**`docs/spec/04-后端与API.md`** **§3.5** **B-238**；**`docs/任务母表.md`**；**`scripts/README.md`**；**本索引一览 258 / 本节**
- **任务（摘要）**：**联机** **与** **CI** **两套** **证据** **经** **同一** **`finalize-only`** **路径** **落盘**；**根** **`README.md`** **为** **审计** **首页**（**导航**、**manifest** **键** **说明**、**复跑** **命令** **清单**、**B-239/B-240** **对照**）；**`archive_manifest.json`** **`index.check_anchor`****=****`14-REGIONVAULT-CLAIM-RELEASE-GATE-LIVE-EVIDENCE-INDEX-README-V1`**。
- **边界**：**不** **改** **B-238** **HTTP** **契约**；**不** **上链**；**不** **执行** **claim**。
- **验收**：**新** **归档** **`jq`** **快检** **`mother_table`****+****`index.*`** **绿**；**`region-vault-claim-release-gate-archive-ci-smoke.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B242-14-REGIONVAULT-CLAIM-RELEASE-GATE-FINAL-GO-REPORT-READONLY-001

- **阶段**：api / **14 · RegionVault** · **发布门禁最终只读 GO 签署视图**（**母表 B-242**；承 **B-238**、**B-239**/**B-241** 归档叙事）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-242**
- **封口批已落**：**`crates/api/src/db/region_vault_claim_release_gate_final_go_report_readonly.rs`**；**`crates/api/src/routes/admin/region_vault_claim_release_gate_final_go_report_readonly.rs`**；**`crates/api/src/routes/admin/mod.rs`**；**`crates/api/src/routes/read_contract_route_guard.rs`**；**`crates/api/src/routes/admin/audit_read.rs`**；**`docs/spec/04-后端与API.md`** **§3.5**；**`ops/RUNBOOK.md`** **§2.55**；**`docs/任务母表.md`**；**本索引一览 259 / 本节**
- **任务（摘要）**：**`GET …/snapshot-claim-go-no-go-release-gate-final-go-report`** **嵌** **B-238** **`claim_go_no_go_release_gate`** **+** **`archive_attestation`**（**query** **自** **证** **路径**/**SHA256**）**+** **`derived.review_conclusion_*`****+****`final_publish_view_one_liner`**；**`export`** **JSON/CSV** **（** **CSV** **单行** **签署** **行** **）**。
- **边界**：**不** **上链**；**不** **执行** **claim**；**无** **internal** **镜像**；**API** **不** **验证** **归档** **文件系统**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`cargo test -p traveltrust-api`** **`b242_`**

### TT-B248-14-REGIONVAULT-CLAIM-READONLY-PHASE-CLOSE-SUMMARY-001

- **阶段**：docs / **14 · RegionVault** · **Snapshot·Claim 只读链阶段正式封口**（**母表 B-248**；承 **B-223～B-247** 叙事汇总，**非** 吞并实现卡）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-248**
- **封口批已落**：**[spec/14-附录-RegionVault-Claim-只读链阶段封口-B248.md](./spec/14-附录-RegionVault-Claim-只读链阶段封口-B248.md)**（**机读锚** **`14-REGIONVAULT-CLAIM-READONLY-PHASE-CLOSE-SUMMARY-V1`**）；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1b**；**`docs/任务母表.md`**；**本索引一览 260 / 本节**
- **任务（摘要）**：**六段闭环表**（**数据→判定→证据→归档→索引→checklist**）**+** **显式不包含**（**写链**、**stub→真** **交易** **SSOT** **等**）**+** **执行链** **须** **另开** **非只读** **母卡** **声明**
- **边界**：**零** **04** **契约** **/** **合约** **/** **Rust** **本卡** **diff**；**不** **替代** **B-243～B-247** **单卡** **运维** **脚本** **真值**
- **验收**：**14 §1.1.1.1b** ↔ **附录** **标题** **/** **锚** **/** **B-223～B-247** **表** **互指** **一致**
- **测试**：—（**纯文档**）

### TT-B249-14-REGIONVAULT-CLAIM-EXECUTION-CHAIN-ENTRY-NONREADONLY-001

- **阶段**：docs / **14 · RegionVault** · **on-chain claim 执行链入口（非只读母卡）**（**母表 B-249**；承 **B-248**、**B-223～B-247** 只读前置；**对读** **B-250～B-261** 彩排 stub **+** **B-262** **JSON-RPC** **广播** **执行** **+** **B-263** **receipt** **链上** **归档** **+** **B-264** **链上** **对账** **JSON** **+** **B-265** **read-model** **与** **`forwarded`** **互证** **+** **B-266** **`14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1`** **生产** **GO** **闸**）
- **状态**：**未封口**（**2026-04-14** · **入口叙事已登记**；**B-250～B-261** **只读** **彩排** **已** **封口** **≠** **本** **母卡** **执行** **子域** **封口**；**B-262** **已** **登记** **首条** **`eth_sendRawTransaction`** **运维** **路径** **；** **B-263** **已** **登记** **`14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1`** **；** **B-264** **已** **登记** **`14-REGIONVAULT-CLAIM-BROADCAST-ONCHAIN-RECONCILE-V1`** **；** **B-265** **已** **登记** **B-264** **`GO`** **read-model** **+** **`forwarded`** **互证** **；** **B-266** **已** **登记** **`production-go-gate`** **（** **双** **attestation** **+** **`production_verdict`****≠****`GO`** **默认** **exit** **1** **）** **；** **合约** **`claim*`** **定稿** **/** **新** **topic** **/** **新** **写** **HTTP** **等** **仍** **须** **B-267+** **子** **TT**）
- **母表**：[任务母表.md](./任务母表.md) **B-249**
- **封口批已落（本开卡批）**：**[spec/14-附录-RegionVault-Claim-执行链入口-B249.md](./spec/14-附录-RegionVault-Claim-执行链入口-B249.md)**（**机读锚** **`14-REGIONVAULT-CLAIM-EXECUTION-CHAIN-ENTRY-NONREADONLY-V1`**）；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1c**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5** **B-249** **段**；**`docs/任务母表.md`**；**本索引一览 261 / 本节**
- **本轮续（2026-04-14 · TT-B249 执行）**：**附录** **§1** **表** **增** **「** **彩排** **（** **只读** **）** **」** **行** **、** **「** **新开** **」** **改为** **「** **新开** **（** **真** **执行** **）** **」** **并** **钉** **B-262/B-263/B-264/B-265/B-266** **及** **余** **量** **B-267+** **；** **§7** **首段** **补** **下一** **真** **门槛** **清单** **；** **14** **§1.1.1.1c** **/** **04** **B-249** **段** **/** **母表** **B-249** **行** **与** **上** **述** **一致** **；** **仍** **无** **07** **/** **00** **百分比** **改动**
- **任务（摘要）**：**从** **B-248** **切入** **执行链** **的** **边界**（**合约** **Target** **/** **只读** **API** **/** **B-238/B-242** **/** **indexer** **）**、**权限**（**链上** **签名** **主体** **/** **链下** **代播** **与** **70 RBAC** **/** **运维** **CLI** **）**、**交易形态** **原则**（**A** **合约** **claim** **/** **B** **编排** **转账** **/** **C** **治理** **包裹** **——** **具体** **selector** **子** **TT** **钉** **）**、**风险**（**资金**、**幂等**、**reorg**、**密钥**、**观测**）
- **边界**：**本** **TT** **不** **实现** **写链** **/** **不** **新增** **04** **HTTP** **行**（**除非** **另** **开** **子** **TT** **同批**）；**不** **修改** **B-223～B-248** **只读** **语义**
- **验收**：**附录** ↔ **14 §1.1.1.1c** ↔ **04 §3.5** **B-249** **段** ↔ **母表** **B-249** **一致**（**含** **B-250～B-266** **与** **B-267+** **指针** **2026-04-14** **同批**）
- **测试**：—（**纯文档**）

### TT-B250-14-REGIONVAULT-CLAIM-EXECUTION-DRYRUN-CLI-V1-001

- **阶段**：ops / **14 · RegionVault** · **B-226 dryrun JSON → 拟执行交易 manifest（只读）**（**母表 B-250**；承 **B-226/B-227**；对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-250**
- **封口批已落**：**`scripts/ops/region_vault_claim_execution_dryrun_cli.py`**；**`scripts/region-vault-claim-execution-dryrun-cli.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1d**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5** **B-250**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 262 / 本节**
- **任务（摘要）**：**`build <dryrun.json>`** **输出** **`rule_version`****=****`region_vault_claim_execution_dryrun_cli_manifest_v1`**、**`anchor`****=****`14-REGIONVAULT-CLAIM-EXECUTION-DRYRUN-CLI-MANIFEST-V1`**；**`batches[]`**** **`batch_plan_id`** **同** **B-227**；**`proposed_transactions[]`** **每** **行** **对应** **一** **笔** **`erc20_transfer_placeholder`**（**`--vault-from`** **可选** **`from_address`**）**；** **默认** **叠** **B-251** **`signing_plan_stub`** **+** **B-252** **`signing_artifact_stub`**（**`--omit-signing-plan-stub`****/** **`--omit-signing-artifact-stub`** **）**
- **边界**：**不** **签名**、**不** **广播**、**不** **新增** **HTTP** **路由**
- **验收**：**`python scripts/ops/region_vault_claim_execution_dryrun_cli.py self-test`** **exit 0**
- **测试**：**`python scripts/ops/region_vault_claim_execution_dryrun_cli.py self-test`**

### TT-B251-14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-PLAN-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-250 manifest 上叠加只读签名计划壳**（**母表 B-251**；承 **B-250**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-251**
- **封口批已落**：**`scripts/ops/region_vault_claim_execution_dryrun_cli.py`**（**`signing_plan_stub`****/** **`signing_plan_batch_stub`****/** **逐** **tx** **`signing_plan_stub`**）；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1e**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-251**；**本索引一览 263 / 本节**
- **任务（摘要）**：**根** **`14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-PLAN-STUB-V1`** **+** **`root_plan_id`****+****`batch_plan_ids_fingerprint_sha256_hex`**；**批** **`plan_id`****/** **`signer_role`****/** **`nonce_strategy`****/** **`gas_policy`****/** **`signing_order_policy`**；**笔** **`plan_id`****/** **`signing_order`**** **等**；**默认** **叠** **B-252** **`signing_artifact_stub`**（**`--omit-signing-artifact-stub`** **/** **`--omit-signing-plan-stub`** **）**
- **边界**：**不** **签名**、**不** **广播**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_execution_dryrun_cli.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_execution_dryrun_cli.py self-test`**

### TT-B252-14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-ARTIFACT-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-251 上每批签名产物壳 + 逐 tx 回填绑键**（**母表 B-252**；承 **B-251**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-252**
- **封口批已落**：**`scripts/ops/region_vault_claim_execution_dryrun_cli.py`**（**`signing_artifact_stub`****/** **`signing_artifact_tx_stub`**）；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1f**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-252**；**本索引一览 264 / 本节**
- **任务（摘要）**：**`digest_sha256_hex`****、****`fields_pending_signature`****、****`signature_slots`****、****`backfill_slots`****、****`artifact_id`** **（** **每** **批** **）**；**逐** **tx** **`signing_artifact_tx_stub`**
- **边界**：**不** **写** **真实** **sig**、**不** **广播**
- **验收**：**`python scripts/ops/region_vault_claim_execution_dryrun_cli.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_execution_dryrun_cli.py self-test`**

### TT-B253-14-REGIONVAULT-CLAIM-EXECUTION-SIGNING-OFFLINE-PACKAGE-001

- **阶段**：ops / **14 · RegionVault** · **B-252 manifest → 离线签名包目录树（只读）**（**母表 B-253**；承 **B-252**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-253**
- **封口批已落**：**`scripts/ops/region_vault_claim_signing_offline_package.py`**（**`write`****/** **`self-test`**）；**`scripts/region-vault-claim-signing-offline-package.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1g**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-253**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 265 / 本节**
- **任务（摘要）**：**输入** **须** **含** **根** **与** **每** **批** **`signing_artifact_stub`** **（** **勿** **`--omit-signing-artifact-stub`** **）** **的** **manifest**；**输出** **`batches/<safe_batch_id>/`****（** **`batch_digest.sha256`****、****`fields_pending_signature.json`****、****`signature_slots.json`****、****`backfill_template.json`****、****`batch_index.json`** **）****+** **`offline_signing_package_manifest.json`****+** **`artifacts.sha256`****+** **`README.md`**** **（** **`handoff.to_signer`****/**`from_signer`** **）**
- **边界**：**不** **签名**、**不** **广播**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_signing_offline_package.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_signing_offline_package.py self-test`**

### TT-B254-14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-STUB-IMPORT-001

- **阶段**：ops / **14 · RegionVault** · **B-253 签回 → 只读导入壳（对齐 B-252 artifact）**（**母表 B-254**；承 **B-252/B-253**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-254**
- **封口批已落**：**`scripts/ops/region_vault_claim_signed_backfill_stub_import.py`**（**`import-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-signed-backfill-stub-import.sh`**；**B-253** **`artifacts.sha256`**** **终稿** **重算** **（** **与** **`offline_signing_package_manifest.json`**** **终** **写** **一致** **）**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1h**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-254**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 266 / 本节**
- **任务（摘要）**：**`import-stub <source_manifest.json> <package_dir> <returned_dir> -o out.json`** **+** **可选** **`--verify-b253-artifacts-sha256`**** **`--require-nonempty-backfill`**** **→** **`14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-STUB-IMPORT-V1`**
- **边界**：**不** **广播**、**不** **上链**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_signed_backfill_stub_import.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_signed_backfill_stub_import.py self-test`**

### TT-B255-14-REGIONVAULT-CLAIM-SIGNED-BACKFILL-RECONCILE-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-254 import_stub 与 manifest+B-253 包逐批对账（只读）**（**母表 B-255**；承 **B-252～B-254**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-255**
- **封口批已落**：**`scripts/ops/region_vault_claim_signed_backfill_reconcile_stub.py`**（**`reconcile-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-signed-backfill-reconcile-stub.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1i**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-255**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 267 / 本节**
- **任务（摘要）**：**`reconcile-stub <import_stub.json> <source_manifest.json> <package_dir> [--returned-dir …] -o out.json [--verify-b253-artifacts-sha256]`** **→** **`gaps[]`****、****`blocking_reasons`****、****`reconcile_verdict_preview`****（** **`GO`****/**`NO_GO`**** **）** **；** **仍** **不** **广播**
- **边界**：**不** **上链**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_signed_backfill_reconcile_stub.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_signed_backfill_reconcile_stub.py self-test`**

### TT-B256-14-REGIONVAULT-CLAIM-BROADCAST-REQUEST-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-255 GO → 可广播请求只读壳（最后一层入口）**（**母表 B-256**；承 **B-252～B-255**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-256**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_request_stub.py`**（**`broadcast-request-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-request-stub.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1j**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-256**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 268 / 本节**
- **任务（摘要）**：**`broadcast-request-stub <reconcile_stub.json> <import_stub.json> <source_manifest.json> -o out.json [--allow-non-go]`** **→** **`broadcast_sequence`****+** **`operator_confirmation`****+** **`tx_hash`**** **回填** **位**
- **边界**：**不** **广播**、**不** **上链**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_broadcast_request_stub.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_broadcast_request_stub.py self-test`**

### TT-B257-14-REGIONVAULT-CLAIM-BROADCAST-DRYRUN-REHEARSAL-001

- **阶段**：ops / **14 · RegionVault** · **B-256 stub → 广播前排练只读校验**（**母表 B-257**；承 **B-256**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-257**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_dryrun_rehearsal.py`**（**`rehearsal-dryrun`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-dryrun-rehearsal.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1k**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-257**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 269 / 本节**
- **任务（摘要）**：**`rehearsal-dryrun <broadcast_request_stub.json> [--source-manifest …] [-o report.json] [--skip-operator-confirmation]`** **—** **序** **/** **前置** **/** **`operator_confirmation`** **/** **`tx_hash`**** **槽** **映射** **；** **仍** **不** **RPC** **不** **上链**
- **边界**：**不** **广播**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_broadcast_dryrun_rehearsal.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_broadcast_dryrun_rehearsal.py self-test`**

### TT-B258-14-REGIONVAULT-CLAIM-BROADCAST-LIVE-ADMIN-GATE-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-257 报告 + B-256 stub → 临广播前人工闸口只读壳**（**母表 B-258**；承 **B-257**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-258**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_live_admin_gate_stub.py`**（**`gate-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-live-admin-gate-stub.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1l**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-258**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 270 / 本节**
- **任务（摘要）**：**`gate-stub <broadcast_request_stub.json> <rehearsal_report.json> [--source-manifest …] [-o gate_stub.json]`** **→** **`operator_sign_off`****+** **`gate_verdict_preview`****+** **`no_go_blocking_reasons`** **；** **`NO_GO`** **→** **exit** **1**
- **边界**：**不** **广播**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_broadcast_live_admin_gate_stub.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_broadcast_live_admin_gate_stub.py self-test`**

### TT-B259-14-REGIONVAULT-CLAIM-BROADCAST-EVIDENCE-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-256～B-258 → 待广播证据壳只读归档**（**母表 B-259**；承 **B-256～B-258**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-259**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_evidence_stub.py`**（**`evidence-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-evidence-stub.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1m**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-259**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 271 / 本节**
- **任务（摘要）**：**`evidence-stub <stub> <rehearsal> <gate> [-o out] [--allow-non-go-evidence]`** **→** **`request_summary`****+** **`rehearsal_conclusion`****+** **`live_admin_gate`****+** **`broadcast_evidence_slot_rows`**** **；** **`evidence_archive_verdict_preview`**** **非** **`GO`** **默认** **exit** **1**
- **边界**：**不** **广播**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_broadcast_evidence_stub.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_broadcast_evidence_stub.py self-test`**

### TT-B260-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-IMPORT-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-259 evidence + 链下 returned JSON → 结果导入只读壳**（**母表 B-260**；承 **B-259**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-260**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_result_import_stub.py`**（**`import-result-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-result-import-stub.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1n**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-260**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 272 / 本节**
- **任务（摘要）**：**`import-result-stub <evidence_stub.json> [--returned-results-dir …] -o out.json [--allow-partial-import]`** **→** **`import_preview_verdict`****+** **`slot_alignment_rows`****+** **回填** **SHA**
- **边界**：**不** **RPC**、**不** **新** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_broadcast_result_import_stub.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_broadcast_result_import_stub.py self-test`**

### TT-B261-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-RECONCILE-STUB-001

- **阶段**：ops / **14 · RegionVault** · **B-260 result_import → 广播结果对账只读壳**（**母表 B-261**；承 **B-260**、对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-261**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_result_reconcile_stub.py`**（**`reconcile-result-stub`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-result-reconcile-stub.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1o**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-261**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 273 / 本节**
- **任务（摘要）**：**`reconcile-result-stub <result_import_stub.json> -o out.json [--allow-non-go-reconcile] [--strict-tx-hash-len] [--no-require-import-go]`** **→** **`reconcile_verdict_preview`****+** **`blocking_reasons`****+** **`reconcile_slot_rows`**
- **边界**：**不** **RPC**、**不** **广播**、**不** **上链**
- **验收**：**`python scripts/ops/region_vault_claim_broadcast_result_reconcile_stub.py self-test`**
- **测试**：**`python scripts/ops/region_vault_claim_broadcast_result_reconcile_stub.py self-test`**

### TT-B262-14-REGIONVAULT-CLAIM-BROADCAST-EXECUTION-001

- **阶段**：ops / **14 · RegionVault** · **B-256 broadcast_request_stub → JSON-RPC 顺序广播与执行报告**（**母表 B-262**；承 **B-256**、**B-257**；对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-262**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_execute.py`**（**`execute`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-execute.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1p**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-262**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 274 / 本节**
- **任务（摘要）**：**`execute <stub.json> -o report.json`** **内** **嵌** **`run_rehearsal`** **→** **`eth_sendRawTransaction`**** **×** **`global_broadcast_sequence`**** **→** **可选** **`eth_getTransactionReceipt`**** **；** **`CHAIN_RPC_URL`**** **/** **`--rpc-url`** **；** **`--dry-run`** **；** **主网** **ack** **`TRAVELTRUST_BROADCAST_EXECUTE_ACK_MAINNET=1`**
- **边界**：**不** **新增** **04** **HTTP** **路由** **；** **不** **替代** **B-259～B-261** **链下** **结果** **对账** **壳**
- **验收**：**`PYTHONPATH=scripts/ops python scripts/ops/region_vault_claim_broadcast_execute.py self-test`** **exit** **0**
- **测试**：**同上** **self-test**

### TT-B263-14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-001

- **阶段**：ops / **14 · RegionVault** · **B-262 execution_report → receipt 链上归档**（**母表 B-263**；承 **B-262**；对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-263**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_receipt_archive.py`**（**`archive-receipts`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-receipt-archive.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1q**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-263**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 275 / 本节**
- **任务（摘要）**：**`archive-receipts <execution_report.json> -o receipt_archive.json`** **按** **步** **`tx_hash`** **`eth_getTransactionReceipt`** **→** **`14-REGIONVAULT-CLAIM-BROADCAST-RECEIPT-ARCHIVE-V1`** **（** **`archive_rows`****、****`receipt_archive_canonical_sha256_hex`** **）** **；** **`--strict-chain-id`** **；** **主网** **ack** **同** **B-262**
- **边界**：**不** **新增** **04** **HTTP** **路由** **；** **单一** **链上** **receipt** **证据** **源** **供** **后续** **reconcile** **/** **索引** **升格**
- **验收**：**`PYTHONPATH=scripts/ops python scripts/ops/region_vault_claim_broadcast_receipt_archive.py self-test`** **exit** **0**
- **测试**：**同上** **self-test**

### TT-B264-14-REGIONVAULT-CLAIM-BROADCAST-RESULT-RECONCILE-ONCHAIN-001

- **阶段**：ops / **14 · RegionVault** · **B-262 execution_report + B-263 receipt_archive → 只读链上对账 JSON**（**母表 B-264**；承 **B-262**、**B-263**；对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-264**
- **封口批已落**：**`scripts/ops/region_vault_claim_broadcast_onchain_reconcile.py`**（**`reconcile-onchain`****/** **`self-test`**）；**`scripts/region-vault-claim-broadcast-onchain-reconcile.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1r**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-264**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 276 / 本节**
- **任务（摘要）**：**`reconcile-onchain <execution_report.json> <receipt_archive.json> -o onchain_reconcile.json`** **校验** **SHA** **链接** **与** **逐步** **`tx_hash`****/** **`status`****/** **`block_number`****/** **序** **；** **`reconcile_verdict`****+****`blocking_reasons`****+****`--allow-non-go-reconcile`**
- **边界**：**不** **RPC**、**不** **新增** **HTTP**、**不** **改** **合约**
- **验收**：**`PYTHONPATH=scripts/ops python scripts/ops/region_vault_claim_broadcast_onchain_reconcile.py self-test`** **exit** **0**
- **测试**：**同上** **self-test**

### TT-B265-14-REGIONVAULT-CLAIM-INDEXER-UPLIFT-ONCHAIN-001

- **阶段**：api / **14 · RegionVault** · **B-264 `GO` onchain_reconcile.json → execution_status_read_model + region_vault_forwarded_events 只读互证**（**母表 B-265**；承 **B-264**、**B-229**；对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-265**
- **封口批已落**：**`crates/api/src/region_vault_claim_onchain_reconcile_import.rs`**；**`crates/api/src/db/region_vault_claim_execution_status_read_model.rs`**；**`crates/api/src/db/region_vault_events.rs`**（**`region_vault_forwarded_first_row_for_chain_tx`**）；**`crates/api/src/main.rs`** **/** **`state/mod.rs`** **/** **`startup/run.rs`** **/** **admin-internal** **claim** **快照** **装配**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1s**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-265**；**`.env.example`** **`REGION_VAULT_CLAIM_ONCHAIN_RECONCILE_IMPORT_PATH`**；**本索引一览 277 / 本节**
- **任务（摘要）**：**`REGION_VAULT_CLAIM_ONCHAIN_RECONCILE_IMPORT_PATH`** **可选** **加载** **`14-REGIONVAULT-CLAIM-BROADCAST-ONCHAIN-RECONCILE-V1`** **且** **`reconcile_verdict`****=****`GO`** **时** **按** **`batch_plan_id`** **合并** **`reconcile_rows[]`** **；** **`chain_id`****+** **DB** **时** **`region_vault_forwarded_events`** **首** **行** **→** **`b265_indexer_uplift`****；** **B-230～B-242** **同源** **builder** **参数** **继承**
- **边界**：**不** **新增** **公开** **前端** **路由** **；** **不** **新增** **04** **HTTP** **路径** **；** **不** **改** **合约**
- **验收**：**`cargo test -p traveltrust-api`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B266-14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-001

- **阶段**：ops / **14 · RegionVault** · **B-263 receipt + B-264 onchain + B-265 证据面 → `14-REGIONVAULT-CLAIM-PRODUCTION-GO-GATE-V1` 生产 GO 闸**（**母表 B-266**；承 **B-263**/**B-264**/**B-265**；对读 **B-249**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-266**
- **封口批已落**：**`scripts/ops/region_vault_claim_production_go_gate.py`**（**`production-go-gate`****/** **`self-test`**）；**`scripts/region-vault-claim-production-go-gate.sh`**；**[spec/14-合约-API-ABI-前后端对齐.md](./spec/14-合约-API-ABI-前后端对齐.md)** **§1.1.1.1t**；**[spec/04-后端与API.md](./spec/04-后端与API.md)** **§3.5**；**[ops/RUNBOOK.md](../ops/RUNBOOK.md)** **§2.55** **B-266**；**[scripts/README.md](../scripts/README.md)**；**本索引一览 278 / 本节**
- **任务（摘要）**：**读** **`onchain_reconcile.json`****+** **`receipt_archive.json`** **校验** **anchor** **/** **rule_version** **/** **`reconcile_verdict`** **等** **；** **须** **`--attest-b265-indexer-uplift`** **与** **`--attest-b230-b242-evidence-chain`** **方得** **`production_verdict`****=****`GO`** **；** **`production_verdict`****≠****`GO`** **默认** **exit** **1** **（** **`--allow-non-go-production`** **覆盖** **）**
- **边界**：**不** **RPC** **、** **不** **新增** **HTTP**
- **验收**：**`python scripts/ops/region_vault_claim_production_go_gate.py self-test`** **exit** **0**
- **测试**：**同上** **self-test**

### TT-B209-110-FULL-CHAIN-SCAN-MAX-BLOCK-SPAN-V1-001

- **阶段**：indexer / **110 §3.1.2.1 · 全量扫链批宽切片**（**母表 B-209**；承 **B-192**/**TT-B192**、**B-204**/**TT-B204**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-209**
- **封口批已落**：**`crates/api/src/chain/indexer/checkpoint.rs`**（**`parse_indexer_tick_max_block_span_env`**、**`indexer_tick_apply_max_block_span_cap`**）；**`crates/api/src/chain/indexer/mod.rs`** **re-export**；**`crates/api/src/routes/internal/indexer/tick/handler.rs`**、**`handler_helpers.rs`**（**`indexer_tick_max_block_span_observability`** **挂载**）；**`crates/api/src/chain/indexer/tests.rs`** **`b209_*`**；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **+** **版本 1.0.102**；**`docs/spec/04-后端与API.md`** **§3.4** **`POST …/internal/indexer-tick`**；**`docs/spec/08-3-参数与门禁表.md`** **附录 A** **+** **变更记录**；**`.env.example`**；**`docs/任务母表.md`**；**本索引一览 226 / 本节**
- **任务（摘要）**：**ENV `INDEXER_TICK_MAX_BLOCK_SPAN`**（**正整数**）→ **`toBlock`**=**`min(finality 上界, fromBlock + span − 1)`**（**inclusive**）；**与** **`INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`** **可并用**。**不**改 **`eth_getLogs`** **全局合并语义**。**全集链上证明**/**运维批编排** **仍** **110 Target**。
- **边界（未吞并）**：**B-114** **增量正确性** **仍** **独立**；**本切片** **仅** **收窄** **单轮** **上界**。
- **验收**：**`cargo test -p traveltrust-api`** **绿**（**`b209_*`**）；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`cargo test -p traveltrust-api`** **`b209_`**

### TT-B210-110-INDEXER-EVIDENCE-MANIFEST-FULL-SCAN-REGISTRY-001

- **阶段**：indexer / **110 §3.1.2.1 · evidence manifest 全链扫 ENV 十字登记**（**母表 B-210**；承 **B-204**/**TT-B204**、**B-209**/**TT-B209**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-210**
- **封口批已落**：**`scripts/ops/write-indexer-evidence.sh`**（**`maybe_write_indexer_bundle_manifest`** **`indexer_full_scan_catchup_registry`**、**`WRITE_INDEXER_EVIDENCE_SCRIPT_SEMVER`****`1.4.0`**）；**`scripts/ops/write-indexer-evidence.ps1`**（**`Write-IndexerBundleManifest`** **同形**）；**`110-INDEXER-EVIDENCE-FULL-SCAN-REGISTRY-V1`** **`check_anchor`**；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第三切片** **+** **文档版本 1.0.103**；**`docs/spec/07-开发流程与顺序.md`** **§二 2.3**/**§六 6.3B·序3**/**§六 6.5** **+** **Version 1.0.842**；**`docs/spec/00-文档索引.md`** **07/110** **版本表**；**`docs/任务母表.md`**；**本索引一览 227 / 本节**。**`indexer-reconcile-gate` `checks_total`****`120`** **与** **probe `INDEXER_RECONCILE_GATE_CHECKS_TOTAL`****`120`** **由** **TT-B211**/**TT-B212**/**TT-B213** **`tick-loop` 三锚** **+3** **同批递增至现行真值**（**本卡** **落闸批** **原** **117**；**118** **=** **B-211** **单锚**；**119** **=** **B-212** **第二锚**）。
- **任务（摘要）**：**`manifest.json`** **根级** **`indexer_full_scan_catchup_registry`**（**锚** **`110-INDEXER-EVIDENCE-FULL-SCAN-REGISTRY-V1`**）**登记** **`INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`**/**`INDEXER_TICK_MAX_BLOCK_SPAN`** **与** **母表/TT** **指针**；**`explicit_non_goals`** **排除** **全集链上证明**/**多轮 tick 运维编排**（**manifest** **登记语义**；**脚本** **`tick-loop`** **→** **TT-B211**）。**不**改 **`POST …/internal/indexer-tick`** **HTTP** **契约**（**无** **04 §3.4** **本批 diff**）。
- **边界（未吞并）**：**批编排** **脚本层** **见** **TT-B211** **`tick-loop`**；**`tick-loop` stdout 运行级观测** **见** **TT-B212**；**`tick-loop` 可选 JSON 落盘** **见** **TT-B213**（**不**扩 **本卡** **`manifest.json`** **根** **登记块** **形**）；**全集链上证明** **仍** **110 Target**。
- **验收**：**`bash scripts/run-check-04-routes.sh`** **绿**；**`bash scripts/check-07-version-triple.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**（**回归**）
- **测试**：—（**本卡** **无** **新增** **Rust** **用例**）

### TT-B211-110-INDEXER-TICK-LOOP-ORCHESTRATION-001

- **阶段**：indexer / **110 §3.1.2.1 · internal 多 tick 批编排（脚本层）**（**母表 B-211**；承 **B-204**/**TT-B204**、**B-209**/**TT-B209**、**B-210**/**TT-B210**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-211**
- **封口批已落**：**`scripts/ops/internal-indexer-ops.sh`** **`tick-loop`**（**锚** **`110-INDEXER-TICK-LOOP-ORCHESTRATION-V1`** · **`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.7.0`** **落闸值**；**现行** **`1.9.0`** **见** **TT-B213**）；**`scripts/ops/internal-indexer-ops.ps1`** **Usage** **`tick-loop`**；**`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`****`118`** **落闸值** **+** **`scripts_internal_indexer_ops_tick_loop`**（**现行** **`120`** **+** **`run_observability`**/**`evidence_json_write`** **见** **TT-B212**/**TT-B213**）；**`internal-indexer-ops` `check_anchor`** **目标文件** **对齐** **`scripts/ops/internal-indexer-ops.sh`**；**`scripts/ops/indexer-reconcile-probe.sh`** **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`****`118`** **落闸**（**现行** **`120`** **见** **TT-B213**）；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第四切片** **+** **1.0.104**；**`docs/spec/07-开发流程与顺序.md`** **1.0.843**（**现行** **1.0.845** **见** **TT-B213**）；**`docs/spec/00-文档索引.md`**；**`docs/任务母表.md`**；**本索引一览 228 / 本节**
- **任务（摘要）**：**循环** **`POST …/internal/indexer-tick` `{}`**（**与** **`tick`** **同请求**）；**`--max-ticks`**/**`--sleep-seconds`**；**stdout** **`indexer_tick_loop_orchestration`**（**`exit_reason`** **`idle_*`****/**`max_ticks_reached`****/**`http_non_200`****/**`invalid_json_body`**）；**不**改 **`crates/api/.../indexer/tick`** **语义**。
- **边界（未吞并）**：**全集链上证明** **仍** **110 Target**；**不** **新增** **04 §3.4** **契约句**。
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**（**回归**）
- **测试**：—（**本卡** **无** **新增** **Rust** **用例**）

### TT-B212-110-INDEXER-TICK-LOOP-RUN-OBSERVABILITY-001

- **阶段**：indexer / **110 §3.1.2.1 · `tick-loop` 运行级观测聚合（脚本 stdout）**（**母表 B-212**；承 **B-211**/**TT-B211**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-212**
- **封口批已落**：**`scripts/ops/internal-indexer-ops.sh`** **`tick-loop`** **stdout** 根级 **`indexer_tick_loop_run_observability`**（**锚** **`110-INDEXER-TICK-LOOP-RUN-OBSERVABILITY-V1`** · **`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.8.0`** **落闸值**；**现行** **`1.9.0`** **见** **TT-B213**）；**`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`****`119`** **落闸值** **+** **`scripts_internal_indexer_ops_tick_loop_run_observability`**（**现行** **`120`** **+** **`scripts_internal_indexer_ops_tick_loop_evidence_json_write`** **见** **TT-B213**）；**`scripts/ops/indexer-reconcile-probe.sh`** **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`****`119`** **落闸**（**现行** **`120`**）/**`INDEXER_RECONCILE_PROBE_SCRIPT_SEMVER`****`1.2.0`**（**现行** **`1.3.0`** **见** **TT-B213**）；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第五切片** **+** **1.0.105**；**`docs/spec/07-开发流程与顺序.md`** **1.0.844**（**现行** **1.0.845** **见** **TT-B213**）；**`docs/spec/00-文档索引.md`**；**`docs/任务母表.md`**；**本索引一览 229 / 本节**
- **任务（摘要）**：**`rounds[]`** **逐轮** 自 **`indexer-tick` `200`** **体** **抽取** **块界与主计数**；**`run_summary`** **汇总**；**失败体**（**非 JSON**/**非 200**）**仍** **emit** **orchestration** **+** **run_obs**（**已录轮次** **可非空**）。
- **边界（未吞并）**：**不**改 **B-211** **循环/早停/exit 码**；**不**改 **`write-indexer-evidence`/`manifest.json`** **evidence** **schema**；**不** **新增** **04 §3.4** **契约句**。
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**（**回归**）
- **测试**：—（**本卡** **无** **新增** **Rust** **用例**）

### TT-B213-110-INDEXER-TICK-LOOP-EVIDENCE-JSON-WRITE-001

- **阶段**：indexer / **110 §3.1.2.1 · `tick-loop` 可选 JSON 落盘（脚本层）**（**母表 B-213**；承 **B-212**/**TT-B212**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-213**
- **封口批已落**：**`scripts/ops/internal-indexer-ops.sh`** **`tick-loop`** **`--write-evidence-json`****/** **`INDEXER_TICK_LOOP_EVIDENCE_JSON`** **→** **`indexer_tick_loop_evidence_write`**（**锚** **`110-INDEXER-TICK-LOOP-EVIDENCE-JSON-WRITE-V1`** · **`INTERNAL_INDEXER_OPS_SCRIPT_SEMVER`****`1.9.0`**）；**`scripts/ops/internal-indexer-ops.ps1`** **Usage** **补** **pass-through** **说明**；**`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`****`120`** **+** **`scripts_internal_indexer_ops_tick_loop_evidence_json_write`**；**`scripts/ops/indexer-reconcile-probe.sh`** **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`****`120`**/**`INDEXER_RECONCILE_PROBE_SCRIPT_SEMVER`****`1.3.0`**；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第六切片** **+** **1.0.106**；**`docs/spec/07-开发流程与顺序.md`** **1.0.845**；**`docs/spec/00-文档索引.md`**；**`docs/任务母表.md`**；**本索引一览 230 / 本节**
- **任务（摘要）**：**与 stdout 同形** **两键** **写入** **可选路径**；**第三键** **仅** **在** **文件** **内**；**失败路径** **mkdir/jq/write** **exit 2**。
- **边界（未吞并）**：**不**改 **`POST …/internal/indexer-tick`** **Rust**；**不**改 **B-210** **`maybe_write_indexer_bundle_manifest`** **`indexer_full_scan_catchup_registry`** **jq** **形**；**不** **新增** **04 §3.4** **契约句**。
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**（**回归**）
- **测试**：—（**本卡** **无** **新增** **Rust** **用例**）

### TT-B214-FEEROUTER-B081-RECEIPT-MOCK-STABLE-001

- **阶段**：api / **chain · `fee_router_verify` 单元测**（**母表 B-214**；**承** **B-081** **receipt 解码** **路径**）
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-214**
- **封口批已落**：**`crates/api/src/chain/fee_router_verify/tests.rs`** **`b081_db_row_matches_transaction_receipt_platform_fee_routed_decode`**：**mock** **`std::thread`****+** **阻塞** **`accept`** **+** **`flush`** **+** **至多** **12** **次** **短重试**（**新端口**）；**`docs/任务母表.md`**（**B-214**、**B-213** **验收互指**）；**`docs/AI任务卡索引.md`** **一览 231 / 本节**
- **边界（未吞并）**：**不**改 **`fetch_receipt_log_at_index`** **生产实现**；**不** **改** **04 §3.4** **契约句**
- **验收**：**`cargo test -p traveltrust-api`** **绿**（**建议** **多轮** **全量** **并行**）
- **测试**：**`cargo test -p traveltrust-api` `b081_db_row_matches_transaction_receipt_platform_fee_routed_decode`**

### TT-B215-110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-SCOPE-001

- **阶段**：indexer / **规划**（**文档轮** · **2026-04-14**）
- **状态**：**已封口**（**文档轮**；**最小 JSON+gate** **见** **一览** **233**/**TT-B216**）
- **母表**：[任务母表.md](./任务母表.md) **B-215**
- **本轮仅改（文档轮）**：**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1**（**第七切片** **+** **台账互指**）、**`docs/任务母表.md`**（**B-215**）、**`docs/AI任务卡索引.md`**（**一览 232** / **本节**）；**未改** **`docs/spec/04-后端与API.md`**（**无** **公开契约句** **diff**）；**未** **bump** **`indexer-reconcile-gate` `checks_total`**（**嗣后** **B-216** **+2** **→** **`122`**）
- **文档轮交付物**：**110** — **「全集链上证明」** **最小验收要素**（**须含/须排除**）、**与** **B-204～B-213** **及** **B-210 `explicit_non_goals`** **关系**、**建议机读锚** **`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`**（**实现体** **见** **TT-B216**）；**三角互指** **母表 B-215** / **B-192** / **本 TT**。
- **边界（禁止行为）**：**不** **在本轮** **改** **`POST …/internal/indexer-tick`** **响应形**；**不** **吞** **B-114**/**B-204～B-213** **已封口** **语义**；**不** **以** **文档句** **替代** **运维批准/E2E 留痕**。
- **验收**：**`bash scripts/run-check-04-routes.sh`** **绿**；**110 §3.1.2.1**/**B-215**/**本 TT**/**B-192** **互指无断链**。
- **测试**：—（**文档轮**）

### TT-B216-110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0-JSON-GATE-001

- **阶段**：indexer / **ops 脚本**（**2026-04-14**）
- **状态**：**已封口**
- **母表**：[任务母表.md](./任务母表.md) **B-216**（**承** **B-215**）
- **封口批已落**：**`scripts/ops/write-indexer-historical-completeness-proof.sh`**；**`scripts/ops/internal-indexer-ops.sh`**/**`.ps1`** **`historical-completeness-proof [OUT_PATH]`**；**`scripts/ops/fixtures/indexer_historical_completeness_proof_v0.example.json`**；**`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`****`122`**（**+2** **`check_anchor`**）；**`scripts/ops/indexer-reconcile-probe.sh`**；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第八切片**；**`docs/spec/07-开发流程与顺序.md`**/**`docs/spec/00-文档索引.md`**/**`ops/RUNBOOK.md`** **对齐**
- **任务**：**只读** **`GET …/internal/indexer-status`**（**无** **`?live_reconcile`**）**+** **ENV** **`INDEXER_FULL_SCAN_LOWER_BOUND_BLOCK`**/**`INDEXER_TICK_MAX_BLOCK_SPAN`**/**`CHAIN_ID`** **合成** **单文件** **JSON**（**`proof_anchor`****=****`110-FULL-CHAIN-HISTORICAL-COMPLETENESS-PROOF-V0`**）；**`explicit_non_goals_echo`** **复述** **B-215** **排除**。**不** **`POST …/internal/indexer-tick`** — **Rust** **handler** **不变**。
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**（**回归**）
- **能力周期 · 实现封口基线**：**2026-04-14** **`cargo test -p traveltrust-api`** **全量** **854 passed / 0 failed** **已复核** — **110·全集链上证明（JSON+gate）子域** **自** **B-216**/**本 TT**/**一览 233** **起** **视为** **实现封口基线**。**下一 TT** **须** **自** **母表** **与** **本索引「未封口一览项」** **状态列真值** **或** **`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **篇内 Target/Partial** **单列选卡**（**勿** **默认** **续开** **本切片**）。

### TT-B217-110-INDEXER-TICK-RPC-PACING-V1-001

- **阶段**：indexer / **api**（**2026-04-14**）
- **状态**：**已封口**
- **母表**：[任务母表.md](./任务母表.md) **B-217**（**承** **B-204/B-209** **索引器主线**；**与** **B-094** **排除路径** **对读**）
- **封口批已落**：**`crates/api/src/chain/indexer/rpc_pacing.rs`**；**`indexer-tick`** **handler**/**merge/reorg/supplemental** **接线**；**`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`****`123`**（**+1** **`check_anchor`** **`chain_indexer_rpc_pacing_anchor`**）；**`scripts/ops/indexer-reconcile-probe.sh`**；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.2.1** **第九切片**；**`docs/spec/04-后端与API.md`**/**`docs/spec/08-3-参数与门禁表.md`**/**`.env.example`**；**`docs/spec/07-开发流程与顺序.md`**/**`docs/spec/00-文档索引.md`**/**`ops/RUNBOOK.md`**/**`scripts/README.md`** **对齐**
- **任务**：**`INDEXER_TICK_MIN_RPC_INTERVAL_MS`** **同 tick 请求内** **JSON-RPC** **可选 pacing**；**`200`** **`indexer_tick_rpc_pacing_observability`**（**锚** **`110-INDEXER-TICK-RPC-PACING-V1`**）；**不** pace **`apply_escrow_loop`** **`eth_getTransactionByHash`**
- **验收**：**`bash scripts/check-07-version-triple.sh`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**；**`cargo test -p traveltrust-api`** **绿**
- **测试**：**`cargo test -p traveltrust-api`**（**回归**）

---

### TT-B141-GOVERNANCE-SSOT-NEXT-CANDIDATE-PLAN-001

- **阶段**：governance / **SEQ5～SEQ10 之后 · 下一批只读 SSOT 分层规划**（**母表 B-141**）
- **状态**：已封口
- **母表**：[任务母表.md](./任务母表.md) **B-141**（承 **B-134**/**B-137**/**B-135**～**B-140**）
- **本轮仅改**（执行本卡时）：**`docs/任务母表.md`**（**B-110** 互指句、**B-141** 新行、**续表 B-142**）、**`docs/AI任务卡索引.md`**（**一览 141**、**未封口**段、本节）
- **禁止再分析**：**`crates/**` 业务实现**；**spec/04**/**110**/**Runbook**/**gate `checks_total`**（除非另开 **实现类 TT**）；擅自开 **SEQ11+** 实现
- **任务**：在 **SEQ5/SEQ6/SEQ8/SEQ9/SEQ10** 已闭合前提下，用 **L1～L4** 给下一批候选 **统一分层**，并填下表（**首张实现 TT** 仅 **占位名**，**不**在本轮登记 **B-142** 实现行）
- **验收**：母表 **B-141** 描述列与索引 **一览 141** / 本节 **候选表** 互指无断链；**零**业务代码 diff
- **测试**：—

**分层速查**

| 标签 | 含义 | 已闭合参照 |
|------|------|------------|
| **L1** | 静态数值（构造期固定 / **`immutable`** / 无治理 setter 的 **`public`** getter） | **SEQ5**、**SEQ6**、**SEQ8** |
| **L2** | 动态计数或提案级状态 vs 投影/DB 第二源 | **SEQ10**（全局计数 **`+` lag 窗）；提案级须**另写**漂移语义 |
| **L3** | 可变 **`address`** 或运行时可变绑定 | **SEQ9**（双 **`eth_call`** 对拍） |
| **L4** | 经济参数 / **FeeRouter** / **protocol-reference** / **P5-5**/**84** 镜像 | **默认隔离**；**高**双源风险，**禁止**无登记挂靠 **807 `governance.*`** |

**下一批候选表（规划真值 · 实现须另开 TT + 母表行）**

| 候选 | 分层 | 建议 P | 链读要点 | 第二源（若有） | fallback / 漂移草案 | FeeRouter · P5-5 · 84 | 首张实现 TT（占位） |
|------|------|--------|----------|----------------|----------------------|------------------------|---------------------|
| **`TravelTrustGovernor.token()`** | L1（**`immutable`** 引用） | P1 | 单 **`eth_call`** | 可选与部署配置对读 | 同 **SEQ5/SEQ8** 型 **`GOVERNANCE_*` 闸** + **`governance_ssot_chain_unavailable`** | 否 | **已封口**：**[`TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001`](#tt-b110-seq11-governance-governor-token-timelock-chain-ssot-001)**（**bundle** 含 **`timelock()`**） |
| **`TravelTrustGovernor.timelock()`** | L1（**`immutable`** 引用） | P1 | 单 **`eth_call`** | 可选与 **`GOVERNANCE_TIMELOCK_ADDRESS`** 对读（**语义**：部署绑定，**非** **SEQ9** 运行时 **`timelock.governor()`**） | 须文案区分 **「Governor 所绑 Timelock 地址」** vs **「Timelock 自称 governor/admin」** | 否 | 同上 **SEQ11 bundle** |
| **`TravelTrustGovernor.orderRatingReviewWindowDays()`** | **L1′** 治理可调标量（**Timelock** 可写） | P2 | 单 **`eth_call`** | **SEQ2** 已覆盖 **订单**域 bundle | **非** immutable；与 **SEQ8** 型「永不改」**不同** | 否 | **边界** [**SEQ12 / B-143**](#tt-b110-seq12-governance-governor-order-rating-review-window-boundary-001)；**807 并列观测** 经 [**SEQ13 / B-144**](#tt-b110-seq13-governance-order-rating-review-window-parallel-meta-obs-001) **否决**；**升格接管** 仍须 **B-143** 门槛 + **公开 orders** 同批 |
| **`TravelTrustGovernor.state(proposalId)`** | L2（提案级） | P2 | 每提案 **`eth_call`** | **`governance_proposals_projection.status`**（或等价列） | **须**定义 **允许**关系（例如索引滞后时 **链上先于投影**）**或** **仅**运维抽样，**不**进 compound **AND** | 否 | **`TT-B110-SEQ?-GOVERNANCE-PROPOSAL-STATE-PROJECTION-SSOT-001`**（占位） |
| **`TravelTrustGovernor.proposals(proposalId)`** 核心字段（**snapshot / voteStart / voteEnd** 等） | L2 | P3 | **`eth_call`** | 投影行 / 事件回放 | 与 **`state`** 类似，**优先序**应 **后于** **`state`** 或合并设计 | 否 | 占位 |
| **`TravelTrustGovernor.quorumReached(proposalId)`** | L2 | P3 | **`eth_call`** | 链下重算 | 依赖 **`getPastTotalSupply`/`getPastVotes`** 路径，**复杂度高**，建议 **后移** | 否 | 占位 |
| **FeeRouter `BPS_*` / 路由热参数** | **L4** | **延后** | 多 **`eth_call`** 或专项 Router | **protocol-reference**、**84**、**Σ** 投影 | **须**产品单一真源 + **独立母表**；**不**默认 **+1 `checks_total`** | **是 · 高** | **禁止**默认进 **807**；另开 **B-116/B-115** 域 **TT** |
| **GovernanceTimelock** 除 **`delay`/`governor`/`admin`** 外 | — | — | 已闭合 **SEQ6/SEQ9** | — | 新 getter 再分类 | 否 | — |

**P 序结论（本规划卡）**：优先 **L1 引用类**（**`token`/`timelock`**）或 **合并 bundle**；其次裁断 **`orderRatingReviewWindowDays`** 是否与 **SEQ2** 重复；再考虑 **L2 提案级**（**`state`**）**须**独立漂移叙事；**L4** 与经济 Σ **永**与 **807 治理观测骨架** 解耦，除非 **母表 + 产品** 另批。

---

### TT-B194-85-APPENDIX-HI-COMPONENT-SPEC-001

- **阶段**：traveltrust / **85 附录 §H/§I** + **前端装配**（**实现轮**）
- **状态**：**已封口**（**2026-04-13** · **实现完成**）
- **母表**：[任务母表.md](./任务母表.md) **B-194**
- **封口批已落**：**`docs/spec/85-附录-AI组件蓝图.md`** **v1.0.0.4**（**§H、§I** **可生成代码级**；**§K** **组件清单**）；**`frontend/lib/traveltrustTrustFaqI18n.ts`**、**`frontend/lib/traveltrustGlobalMapDemo.ts`**；**`frontend/components/traveltrust/TravelTrustTrustFactsSection.tsx`**、**`TravelTrustFaqAccordion.tsx`**、**`TravelTrustGlobalMapSection.tsx`**、**`TravelTrustGlobalMap.tsx`**；**`frontend/app/traveltrust/page.tsx`**（**`#trust-facts` / `#global-map` / `#faq`** **不变**）；**`frontend/lib/traveltrustTrustFaqI18n.test.ts`**
- **边界**：**未改** **`docs/spec/04-*`** / **`docs/spec/07-*`**；**不**扩 **85 主文** **新契约句**；**不**替代 **B-191**
- **验收**：**`npx tsc --noEmit`** **绿**；**`npm test -- lib/traveltrustTrustFaqI18n.test.ts --run`** **绿**；**`cargo test -p traveltrust-api`** **绿**；**`bash scripts/run-check-04-routes.sh`** **绿**
- **测试**：**`npm test -- lib/traveltrustTrustFaqI18n.test.ts --run`**；**`cargo test -p traveltrust-api`**（**门禁同批**）

### TT-B195-85-MOTION-PRESETS-LIB-001

- **阶段**：traveltrust / **Motion**
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-195**
- **封口交付**：**`frontend/lib/traveltrustMotionPresets.ts`**、**`frontend/lib/traveltrustMotionPresets.test.ts`**、**`frontend/app/traveltrust/page.tsx`** **三处** **`traveltrustInViewStaggerCard`** + **`useReducedMotion`**；**§B.3 对读纪要** → [**evidence/GO_B195_MOTION_B3_READOFF.md**](../evidence/GO_B195_MOTION_B3_READOFF.md)；**动效录屏** **S23-06 Full**（[**S23-06-motion-full.md**](../evidence/GO_85_TRAVELTRUST_SEC23_20260413/artifacts/S23-06-motion-full.md)）。
- **Hero 余量**：**已由** **B-203** **封口**（**2026-04-14**）→ [**GO_B203_HERO_MOTION_CLOSE**](../evidence/GO_B203_HERO_MOTION_CLOSE.md)；**对读件** [**GO_B195**](../evidence/GO_B195_MOTION_B3_READOFF.md) **§1** **矩阵行** **已更新** **为** **已闭合**。
- **验收**：**`npm test -- lib/traveltrustMotionPresets.test.ts --run`** **绿**；**全仓 `tsc`** **既有报错** **见** **对读件 §2**（**非** **本 TT** **范围**）。
- **测试**：**`npm test -- lib/traveltrustMotionPresets.test.ts --run`**；**Playwright** **`e2e/traveltrust-sec23-motion.spec.ts`**（**与 S23-06 同源**）

### TT-B203-85-HERO-MOTION-B3-ALIGN-001

- **阶段**：traveltrust / **Motion · Hero（小微）**
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-203**
- **封口证据**：[evidence/GO_B203_HERO_MOTION_CLOSE.md](../evidence/GO_B203_HERO_MOTION_CLOSE.md)
- **交付**：**`frontend/lib/traveltrustMotionPresets.ts`** **`fadeInUp` / `fadeIn` / `traveltrustHeroEntrance`**；**`frontend/app/traveltrust/page.tsx`** **`#hero`** **`motion.p` / `motion.h1` / `motion.div` / `motion.aside`**；**`traveltrustMotionPresets.test.ts`** **增补** **断言**
- **视觉 / a11y**：**见** **证据件** **§2～§3**（**手动** **+** **`prefers-reduced-motion`**）
- **验收**：**`npm test -- lib/traveltrustMotionPresets.test.ts --run`** **绿**（**2026-04-14**）；**未改** **04/07**；**全仓 `tsc`** **既有报错** **非** **本 TT** **范围**
- **测试**：**`npm test -- lib/traveltrustMotionPresets.test.ts --run`**；**Playwright** **`e2e/traveltrust-sec23-motion.spec.ts`** **仍** **兼容** **（无** **必改** **断言** **）**

### TT-B196-85-VIDEO-ASSET-08-4-GATE-001

- **阶段**：traveltrust / **合规视频（85 §九 · 08-4）**
- **状态**：**已封口**（**2026-04-14** · **示意资产 + 播放器**）
- **母表**：[任务母表.md](./任务母表.md) **B-196**
- **封口证据**：[evidence/GO_B196_VIDEO_ASSET_08_4_CLOSE.md](../evidence/GO_B196_VIDEO_ASSET_08_4_CLOSE.md)
- **交付**：**`public/traveltrust/video/`**（**MP4**、**poster**、**en/zh WebVTT**）；**`traveltrustVideoIllustration.ts`** + **`traveltrustVideoIllustration.test.ts`**；**`TravelTrustVideoBlock`** **`CAPTIONS_*`** **轨**；**`.env.example`** **模板**；**i18n** **引导** **复制** **env**
- **边界**：**未配置** **`NEXT_PUBLIC_TRAVELTRUST_VIDEO_MP4`** **时** **行为** **不变**（**占位** **+** **P1/P2**）；**未改** **04/07**；**§廿三 S23-05** **仍** **Partial** **直至** **full** **前提**
- **余量**：**对外募资成片** **URL** **+** **08-4** **签字** **另** **轨** **替换** **env**
- **验收**：**`npm test -- lib/traveltrustVideoIllustration.test.ts`** **+** **`TravelTrustVideoBlock.test.tsx`** **绿**
- **测试**：**`npm test -- lib/traveltrustVideoIllustration.test.ts --run`**；**`npm test -- components/traveltrust/TravelTrustVideoBlock.test.tsx --run`**

### TT-B197-85-ALLOCATION-84-SSOT-001

- **阶段**：traveltrust / **数据真源（Allocation ↔ 84）**
- **状态**：**已封口**（**2026-04-14** · **工程 SSOT**）
- **母表**：[任务母表.md](./任务母表.md) **B-197**
- **封口证据**：[evidence/GO_B197_ALLOCATION_84_SSOT_CLOSE.md](../evidence/GO_B197_ALLOCATION_84_SSOT_CLOSE.md)
- **交付**：**`traveltrustAllocation84Ssot.ts`**（**`ALLOCATION_84_SSOT`**、**路径常量**、**`TRAVELTRUST_ALLOCATION_PLACEHOLDER_SLOT_KEYS`**）；**`traveltrustAllocation84Ssot.test.ts`**（**机读** **84** **文首版本**）；**`TravelTrustAllocationPlaceholder.tsx`** **仅消费 SSOT**
- **边界**：**未改** **04/07**、**`page-brief` handler**、**P0** **主路径**；**§廿三 S23-10** **仍** **Partial** **直至** **full-prereq** **+** **`S23-10-funding-full.md`**
- **余量（非本 TT）**：**84** **表内真数** **上屏** **须** **84 + LEGAL-SIGNOFF** **同批** **另轮**
- **验收**：**`npm test -- lib/traveltrustAllocation84Ssot.test.ts --run`** **绿**
- **测试**：**`npm test -- lib/traveltrustAllocation84Ssot.test.ts --run`**

### TT-B198-85-ANALYTICS-PRODUCTION-PIPE-001

- **阶段**：traveltrust / **增长**
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-198**
- **封口证据**：[evidence/GO_B198_ANALYTICS_CLOSE.md](../evidence/GO_B198_ANALYTICS_CLOSE.md)
- **交付**：**`trackTravelTrustEvent`**（**gtag** / **ingest** · **`source`/`target`** **不变**）；**`NEXT_PUBLIC_TRAVELTRUST_ANALYTICS_REQUIRE_CONSENT=1`** **时** **须** **`localStorage` `traveltrust:analytics-consent=granted`** **后才发送**；**未设** **REQUIRE_CONSENT** **保持** **「有传输即发」**；**`TravelTrustAnalyticsConsentBar`**（**`/traveltrust`**）+ **`/privacy` §3** **产品向说明**；**`TravelTrustCtaSource`** **仍** **含** **`video_placeholder`**。
- **边界（历史卡面）**：**本 TT** **执行轮** **不**改 **04/07**；**`/allocation`** **路由** **由** **TT-B200** **另卡** **封口**（**见** [**GO_B200**](../evidence/GO_B200_ALLOCATION_PHASE2_CLOSE.md)）；**法务终稿** **仍以** **08-4** **为准**。
- **验收**：**`npm test -- lib/analytics.test.ts components/traveltrust/TravelTrustAnalyticsConsentBar.test.tsx --run`** **绿**；staging **按需** **验** **网络**（**见** **GO_B198 §3**）。
- **测试**：**`npm test -- lib/analytics.test.ts components/traveltrust/TravelTrustAnalyticsConsentBar.test.tsx --run`**
- **增量执行（防大工程 · 已封口后仍适用）**：**每次只领一片** **≈1～2h** — **[GO_B198_ANALYTICS_CLOSE.md §5](../evidence/GO_B198_ANALYTICS_CLOSE.md)** **表** **198-A～F**（**母表 B-198** **描述列** **亦** **指** **该节**）；**新事件名 / 新契约 / 新 env 语义** → **另开 TT** **勿** **硬塞进** **单切片**。

### TT-B199-85-SEC23-ACCEPTANCE-EVIDENCE-001

- **阶段**：traveltrust / **验收 · 文档 + evidence**
- **状态**：**已封口**
- **封口批**：**2026-04-13**（**验收完成**）
- **母表**：[任务母表.md](./任务母表.md) **B-199**
- **交付摘要**：以 **[evidence/GO_85_TRAVELTRUST.md](../evidence/GO_85_TRAVELTRUST.md)** **为作业面** **SSOT**，**完成** **S23-01～S23-12** **全量证据填充**；**每项** **包含** **可复现步骤**、**执行输出** **与** **源码/返回值对齐**；**`artifacts/`** **目录提供逐项证据文件**；**B-191**、**B-194** **能力已完成互证**；**S23** **Partial/Full** **仍** **按** **GO_85** **维护**；**04 §3.4** **后续** **diff** **见** **B-200** **封口** **同批**。**指针**：[evidence/POINTER_B199_85_SEC23_ACCEPTANCE.md](../evidence/POINTER_B199_85_SEC23_ACCEPTANCE.md)
- **边界**：**未修改** **`docs/spec/04-*`**、**`docs/spec/07-*`**；**不扩展** **HTTP/JSON** **契约**；**仅完成验收与证据归档**
- **验收命令**：**`npx tsc --noEmit`**；**`npm test`**；**`cargo test -p traveltrust-api`**；**`bash scripts/run-check-04-routes.sh`**
- **测试**：**Vitest**（**`npm test`** **全量**）；**Rust**（**`cargo test -p traveltrust-api`**）

### TT-B200-85-PHASE2-ALLOCATION-ROUTE-001

- **阶段**：traveltrust / **Phase 2 路由**
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-200**
- **封口证据**：[evidence/GO_B200_ALLOCATION_PHASE2_CLOSE.md](../evidence/GO_B200_ALLOCATION_PHASE2_CLOSE.md)
- **交付摘要**：**`frontend/app/allocation/*`**（**专页** + **`TravelTrustPageBriefHydrate`** + **`TravelTrustAllocationPlaceholder`**）；**`TRAVELTRUST_P1_PRIMARY_HREF`=`/allocation`**（**Hero / Sticky / 页尾 / 视频占位** **与** **埋点** **`target`** **同源**）；**`crates/api/src/routes/traveltrust_page.rs`** **`p1_target`=`/allocation`** **+** **单测**；**`04 §3.4`** **新** **`/allocation`** **行** **+** **`page-brief`** **契约**；**`13-1` 表 1** **Network + `/allocation`**；**`e2e/smoke.spec.ts`** **`/allocation`** **用例**。
- **外链**：若 **P1** **须** **改为** **绝对 URL**，**须** **另开 TT** **同批** **改** **常量 + 04 + 13-1 + `traveltrust_page.rs`**。
- **验收（已跑）**：**`bash scripts/run-check-04-routes.sh`**；**`cargo test -p traveltrust-api`**；**`npm test`**；**`npx tsc --noEmit`**

### TT-B182-ADMIN-OBS-OVERVIEW-SUBDOMAIN-SPLIT-001

- **阶段**：admin / **Phase Close · 附录 B-182**
- **状态**：已封口（**2026-04-13** · **装配层 + 域文件**）
- **母表**：[任务母表.md](./任务母表.md) **B-182**
- **交付摘要**：**`routes/admin/mod.rs`** **≈320 行** — **仅** **`router()`** + **`mod` / `pub use` / `pub(crate) use`** **装配**；**handler** **在** **`catalog.rs`**、**`community.rs`**、**`observability_read.rs`** 等 **域模块**；**跨 handler 最小共享** **`common.rs`**（**元数据附着**、**request id**、**管理员 actor**、**导出/对账辅助** 等）；**对外** **`crate::routes::admin::*`** **与** **04 §3.5** **表** **一致**（**`run-check-04-routes`** **绿** = **零漂移**）。**`admin/tests.rs`** **仍大** — **不** **纳入** **本 TT DoD**（**48** / **另开切片**）。
- **历史波次**：**第0波** — **`observability_overview`** **→** **`observability_overview.rs`**；**`common.rs`** **迁入** **共享**；**后续波次** — **大段 handler** **迁出** **`mod.rs`** **至** **`catalog`/`community`/…** **直至** **`mod.rs`** **<500**。
- **DoD（封口）**：**①** **`cargo test -p traveltrust-api`** **绿**；**②** **`bash scripts/run-check-04-routes.sh`** **绿**；**③** **`check-48`** **stderr** **无** **`routes/admin/mod.rs`** **`OVER 500`**；**④** **审计件** **Top** **与** **`admin/mod.rs`** **现状** **对读** — **见** **[Enterprise-Code-Footprint-Audit-API-Rust.md](./Enterprise-Code-Footprint-Audit-API-Rust.md) §5**。
- **边界（继承）**：**不** **改** **04 §3.5** **HTTP 契约** **除非** **同批 04**；**本封口轮** **禁止** **扩** **新 admin 能力**。
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿。
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B183-CHAIN-OFF-SUBDIR-GROUPING-REORG-001

- **阶段**：api / **Phase Close · 附录 B-183**
- **状态**：已封口（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-183**
- **本轮仅改（已交付）**：**`crates/api/src/chain_off/governance/**`**、**`crates/api/src/chain_off/reconcile/replay_orders_projection.rs`**、**`chain_off/mod.rs`**、**`reconcile/mod.rs`**、**`routes/internal/tests/suite_early/inc_part_01.rs`**（**indexer-status** **单测** **`rpc_url`** **死端口** **稳定化**）、**`docs/Enterprise-Code-Footprint-Audit-API-Rust.md`**
- **任务（摘要）**：**`governance_*_ssot`** / **`replay_governance_proposals`** → **`chain_off/governance/`**；**`replay_orders_projection`** → **`reconcile/`**；**`crate::chain_off::governance_*`** **路径** **由** **根** **`pub use governance::{…}`** **保持**。**move-only**；**无** **HTTP/JSON** **契约** **diff**。
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿。
- **测试**：**`cargo test -p traveltrust-api`**

### TT-B184-SCRIPTS-README-GATES-OPS-NARRATIVE-001

- **阶段**：scripts / **Phase Close · 附录 B-184**
- **状态**：已封口（**2026-04-14** · **Phase Close 完成**）
- **母表**：[任务母表.md](./任务母表.md) **B-184**
- **本轮仅改**：**`scripts/README.md`**、**`scripts/INDEX.md`**（**可选** **根目录转发说明**）
- **任务**：补强 **gates / ops / dev** **读者路径** 与 **B-163 B1-06** **互指**；**不**新建第二套 INDEX。
- **验收**：**`bash scripts/run-check-04-routes.sh`** 绿（**文档轮** **默认** **零** **`crates/**`**）。
- **测试**：—

### TT-B185-UNIFIED-OBSERVABILITY-JSON-SHELL-IMPL-001

- **阶段**：ops / **Phase Close · 附录 B-185**
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-185**
- **本轮已改**：**`crates/api/src/routes/internal/observability/shell.rs`**（**`IndexerObservabilityV1Parts` 全腿**、**`observed_at`**）；**`crates/api/src/routes/internal/reconcile/indexer_reconcile/summary_resp.rs`**；**`crates/api/src/routes/admin/observability_overview.rs`**；**`crates/api/src/db/reconciliation_reports/row_get.rs`** + **`mod.rs`**（**`admin_last_orders_projection_vs_orders_summary_key`**）；**`crates/api/src/routes/admin/tests/inc_part_06.rs`**；**`docs/spec/04-后端与API.md`** **§3.4** **TT-B185**
- **任务**：将 **附录 A** **`indexer_observability_v1` 草案** **落地** 为 **可机读嵌套壳**（**admin / reconcile** **同源**）；**不** **弱化** **B-147～B-177** **已有单键语义**。
- **执行约束（JSON）**：**任何** **新增**/**重命名**/**改类型** **之** **JSON 字段** **或** **路由响应结构** — **须** **同一批 commit** **更新** **04** **对应段落**；**若** **纯属** **内部重构**、**对外** **字节级** **兼容**，**须在** **提交说明** **写明** **「无契约变化」** **并** **点名** **对读** **之** **04** **§** **锚**。
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿。
- **测试**：**`cargo test -p traveltrust-api`** **绿**（**本封口轮** **2026-04-14**）

### TT-B186-B166-NARRATIVE-PROBE-DOCS-TESTS-001

- **阶段**：docs / **Phase Close · 附录 B-186**
- **状态**：**已封口**（**2026-04-14**）
- **母表**：[任务母表.md](./任务母表.md) **B-186**
- **本轮已改**：**`docs/spec/04-后端与API.md`** **§3.4** **TT-B186**（**`narrative_alignment` 规划名→实现对读** 短文；**Test** 行增 **`indexer_observability_v1_includes_b166_chain_observation_when_set`**）；**`docs/spec/110-阶段开发链上索引器与事件同步器.md`** **§3.1.4** **TT-B186** 互指；**`docs/任务母表.md`**、**`docs/AI任务卡索引.md`**、**`docs/Phase-Close-Docs-Code-Reorg-Plan-B178.md`**、**`docs/spec/07-开发流程与顺序.md`**、**`docs/spec/00-文档索引.md`**（**07** **版本三线** **1.0.841**）
- **任务**：**B-166** **叙事** 与 **Phase Close 附录 A** **`narrative_alignment`** **规划名** **字段级对读**（**不**增独立 JSON 子树）；**测** **以** **既有** **`b166_*`** / **`meta_absent_frags`** / **`indexer_observability_v1_includes_b166_chain_observation_when_set`** **为闭环**。
- **验收**：**`cargo test -p traveltrust-api`** + **`bash scripts/run-check-04-routes.sh`** 绿；**`bash scripts/check-07-version-triple.sh`** 绿（**本批** **动** **07** **Version**）。
- **测试**：**`cargo test -p traveltrust-api`**（**`b166_`** **前缀** + **`indexer_observability_v1_includes_b166_chain_observation_when_set`** **或** **全包**）

### TT-B201-ENTERPRISE-API-RS-FOOTPRINT-AUDIT-001

- **阶段**：api / **企业级审计（07 · 48 · check-48）**
- **状态**：已封口（**2026-04-13** · **审计基线**）
- **母表**：[任务母表.md](./任务母表.md) **B-201**
- **本轮仅改**：**`docs/Enterprise-Code-Footprint-Audit-API-Rust.md`**、**`docs/任务母表.md`** **B-201 指针**、**本索引节**
- **任务**：对 **`crates/api/src/**/*.rs`** **`wc -l` 排序**；**产出** **Top（>500，与脚本违规集一致）**；**每行** **至少含**：路径、行数、类型、**是否超脚本门禁**、风险、**P0/P1/P2**、**拆分轴**、**母卡/TT 指针**、**AI 稳定性**、**复测命令**；**另附** **按文件类型的拆分策略** + **与 `scripts/gates/check-48-line-count.sh` 的对读**（**默认 500** / **`STRICT=1` 400** / **违规计数**）。**重申**：**脚本** **为** **唯一裁决器**；**审计表** **快照** **非** SSOT。**禁止** **本 TT** **内** **顺手巨型拆分**。
- **交付物**：**[Enterprise-Code-Footprint-Audit-API-Rust.md](./Enterprise-Code-Footprint-Audit-API-Rust.md)**
- **验收**：**审计件** **与** **`bash scripts/check-48-line-count.sh`** **可逐条对读**；**`bash scripts/run-check-04-routes.sh`** 绿。
- **备注**：**单人维护** **无** **PR**；**刷新审计件** **=** **commit 前** **对读** **+** **文档同批**。**后续** **模块化拆分**（**B-182** 等）**须在** **提交说明**（**或** **独立 `evidence/` 片段**）**附**：**审计表** **Before/After** **行数** + **`bash scripts/gates/check-48-line-count.sh`** **完整输出**（**或** **stderr 摘录**）— **见** **审计件 §5**。
- **测试**：—

### TT-B202-ENTERPRISE-FRONTEND-TS-FOOTPRINT-AUDIT-001

- **阶段**：frontend / **企业级审计（07 · 6.3A）**
- **状态**：已封口（**2026-04-13** · **审计基线**）
- **母表**：[任务母表.md](./任务母表.md) **B-202**
- **本轮仅改**：**`docs/Enterprise-Code-Footprint-Audit-Frontend.md`**、**`docs/任务母表.md`** **B-202 指针**、**本索引节**
- **任务**：**`frontend/**/*.ts`/`*.tsx`** **`wc -l`**，**排除** **`locales/**`**、**`e2e/**`**、**`**/*.test.*`**；**≥550 行** **入表**；**列** **同 B-201 治理口径**（**前端无 check-48 单文件 gate** — **须在审计件中写明对读结论**）；**与** **B-195** **Motion 预设** **正交**。
- **交付物**：**[Enterprise-Code-Footprint-Audit-Frontend.md](./Enterprise-Code-Footprint-Audit-Frontend.md)**
- **验收**：**审计件** **与** **本地** **复跑** **§1** **命令** **输出** **一致**（**单人流程** **无** **PR** **要求**）；**`bash scripts/run-check-04-routes.sh`** 绿（**纯文档** **默认**）；**`npx tsc --noEmit -p frontend`** **建议** **本地** **自证**。
- **备注**：同 **TT-B201** — **单人** **直推**；**同批** **指** **commit** **级**；**拆分后** **提交说明** **须** **附** **审计表** **Before/After**（**§5**）。
- **测试**：—

### TT-SOLO-ROADMAP-MVP-001

- **阶段**：process / **1 人开发 · 可演示产品优先**
- **状态**：**进度锚点（非阻塞）** — **不**要求「封口」才算完成路线图；每达成一阶段可在 **备注** 或 **路线图 §6** 自建勾选。
- **母表**：[任务母表.md](./任务母表.md) **「1 人开发·极简路线图（总序）」**（非独立 B 行，**避免**与 **B-201/B-202** 审计号混号）。
- **本轮仅改**：**无固定路径** — 推进 **P0～P4** 时按当下竖切开 **具体业务 TT**；本卡 **仅** 维护 **[路线图-1人开发极简版.md](./路线图-1人开发极简版.md)** 与 **本段任务目标** 对齐。
- **任务目标（聚合 · 极简）**：
  1. **P0**：游客从 **落地/首页** 经 **`/market`** 完成 **下单/意向** 并进入 **`/escrow/[id]`** 主路径，**弱网/错误** 下仍可理解下一步。
  2. **P1**：**`/guide`** 与 **市场/订单/托管** 形成可讲的 **向导侧** 故事线。
  3. **P2**：**钱包连接、链 ID、关键链上步骤** 在 UI 上 **可感知**；**P18/mock** 演示不断档。
  4. **P3**：**骨架屏、空态、移动端关键路径、smoke/core e2e** 达到「对外演示不尴尬」。
  5. **P4**：**治理/admin/索引器** 等 **按需**；**不**与 **P0** 抢窗口。
- **验收**：以 **[路线图-1人开发极简版.md](./路线图-1人开发极简版.md)** **§2 阶段表** 为口头验收清单；**技术验证** 仍按各竖切 **TT** 内命令（**`cargo test -p traveltrust-api`**、**`run-check-04-routes`**、**`tsc`/`npm test`** 等）。
- **测试**：—（**由子任务 TT 承载**）
- **备注**：选此模式时 **不必** 等 **85 封口清单** 或 **某张 TT 已封口** 再合 **下一张**；**04/资金/合约语义** 变更仍须 **spec 同批** 与 **既有 CI**。

---

## 新增任务卡时（维护约定）

1. 在本文件表格 **一览** 中增加一行，**序号** 续编。  
2. 在 **正文** 增加一节，字段齐全：**阶段 / 状态 / 本轮仅改 / 禁止再分析 / 任务 / 验收 / 测试（可选）/ 备注**。  
3. **ID** 建议：`TT-<域>-<主题>-<序号>`，与历史风格一致。  
4. 封口后把 **状态** 改为 `已封口`，避免重复执行。

---

## 与仓库其它文档的关系

- **任务母表（Backlog）**：`docs/任务母表.md` — 条目级来源与状态；**先母表后 TT**。  
- **1 人极简路线图**：`docs/路线图-1人开发极简版.md` — **P0～P4** 与 **聚合任务目标**；**TT-SOLO-ROADMAP-MVP-001** 为进度锚点。  
- **协作与低负载规则**：`docs/AI协作话术-减负与边界.md`  
- **前端上线说明（含英文决议）**：`docs/frontend/Release-Readiness-Frontend.md`  
- **产品/流程 SSOT**：仍以 `docs/spec/*` 为准；母表与索引均为 **派生层**，不替代 spec。
