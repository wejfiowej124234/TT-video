# TravelTrust · AI 任务卡索引（Low-Latency 执行）

**上一层（任务从哪来）**：全项目 Backlog 见 **[任务母表.md](./任务母表.md)**。流程：**spec/需求 → 母表 `B-xxx` → 本索引 `TT-xxx` → 执行**。本文件**不**替代母表，只承载 **可执行** 的 TT 定义。

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
| 3 | TT-ACTION-STATE-TRANSITION-CONSISTENCY-AUDIT-001 | 审计 | 只读 | 全站状态机审计 |
| 4 | TT-GOVERNANCE-PARAMS-ERROR-STUCK-AFTER-SUCCESS-001 | 状态机 | 已封口 | params 成功清 error |
| 5 | TT-ESCROW-RATE-SUBMIT-PARTIAL-READY-STATE-001 | 状态机 | 已封口 | 评分确认 await 刷新 |
| 6 | TT-UI-CONSISTENCY-POLISH-AUDIT-001 | 审计 | 只读 | UI 一致性审计 |
| 7 | TT-ERROR-DISPLAY-COMPONENT-INCONSISTENCY-001 | UI | 已封口 | ApiErrorAlert 示例页 |
| 8 | TT-EMPTY-PLACEHOLDER-DASH-CONSISTENCY-001 | UI | 已封口 | admin 占位 `ui_em_dash` |
| 9 | TT-TAIL-ERROR-DISPLAY-UNIFICATION-001 | UI | 已封口 | params + schema 错误组件 |
| 10 | TT-TAIL-LOADING-EMPTY-TOAST-CONSISTENCY-001 | UI | 已封口 | LoadingText / 工具 empty |
| 11 | TT-TAIL-SILENT-INTERACTION-ELIMINATION-001 | 体验 | 已封口 | 深链提示 + FeeRouter loading |
| 12 | TT-PRODUCTION-READINESS-SUMMARY-001 | 文档 | 只读 | 上线前总结（无代码） |
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
| 92 | TT-INVESTOR-DISTRIBUTION-CLAIM-001 | 收益 / 链上领取 | 已封口 | **B-087**：**`InvestorDistributionClaim`** — **`withdrawDividend` / `claim`**；**`registerAccrual`**（owner）；**双花** → **`NothingToClaim` revert**；ABI **`contracts/abi/InvestorDistributionClaim.json`**；**`Deploy.s.sol`** |
| 93 | TT-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER-RULE-001 | 收益 / 应计快照规则 | 已封口 | **B-088**：**`snapshot_block_number`** **含块**冻结 + **`list_investor_share_transfers_up_to_block`**；**`snapshot_binding`**（**GET/POST**）；单测重放 + **`pro_rata`** 名单一致 |
| 94 | TT-GOVERNANCE-PARAM-TIMELOCK-EXECUTE-001 | 治理 / 链上延迟执行 | 已封口 | **B-089 Partial**：**`GovernanceTimelock`** **`schedule`/`execute`**；**`GovernanceTimelock.t.sol`**（**`FeeRouter.transferOwnership`**）；**`Deploy.s.sol`** + **`GOVERNANCE_TIMELOCK_DELAY_SECONDS`**；**四方/BPS 热改** 见 **TT-COMP-B089** |
| 95 | TT-GOVERNANCE-TREASURY-SPEND-EXECUTE-001 | 治理 / 金库链上支出 | 已封口 | **B-090 Partial**：**`GovernanceTreasury.spend`**；**`spender`=Timelock**；**`GovernanceTreasury.t.sol`** E2E；**`Deploy.s.sol`** |
| 96 | TT-GOVERNANCE-PROTOCOL-EMERGENCY-PAUSE-001 | 治理 / 紧急开关 | 已封口 | **B-091 Partial**：**`EscrowFactory.factoryPaused`** + **`FeeRouter.distributePaused`**；**`Escrow.t.sol`** / **`FeeRouter.t.sol`**；**55-S13** ABI |
| 97 | TT-GOVERNANCE-VOTE-WEIGHT-DELEGATION-SIGNAL-001 | 治理 / 链下投票权重 | 已封口（**Partial**） | **B-092**：**`delegation_units_v1`** + **`GET …/voting-power`** + 提案 **`governance_vote`**；**信号票**；**质押/份额链上快照** **Target** |
| 98 | TT-ESCROW-RELEASE-NORMAL-SPLIT-B093-001 | Escrow / 正常放款分账 | 已封口（**Partial**） | **B-093**：**`release()`** 与 **01 §10** 对齐；**`Escrow.t.sol`** 表驱动 + fuzz；**PartiallyRefunded/Slashed** 自动分账 **Target** |
| 99 | TT-ESCROW-EXECUTE-RESOLUTION-B094-001 | Escrow / 争议执行三腿 | 已封口（**Partial**） | **B-094**：**`executeResolution`** 三模板 + **`terminal_order_state_from_resolution_amounts`**；**`evidence/B-094-*`**；投影细分 **Target** |
| 100 | TT-ORDERS-SPLIT-ADDRESSES-SSOT-B095-001 | 订单 / 分账地址 SSOT | 已封口 | **B-095**：**`GET /orders/:id`** **`split_addresses_ssot`** + **`ChainConfig::escrow_platform_fee_recipient`** 与 **`/meta`** 同源；单测 **`b095_*`** |
| 101 | TT-COMP-B088-STAKE-LOCK-PROJECTION-001 | 投资人 / 快照补齐 | 未封口 · Completion | **B-088 Target**：锁仓或质押 **单一事件源** → 可重放投影，**pro_rata** 与名单对拍 |
| 102 | TT-COMP-B089-FEEROUTER-MUTABLE-ROUTING-001 | 治理 / FeeRouter 热改 | 已封口（**Completion**） | **B-089 Target**：**`setRoutingConfig`** + **`GovernanceTimelock` `execute`** 验收；**`BPS_*()`** ABI 不变 |
| 103 | TT-COMP-B090-TREASURY-NATIVE-SPEND-001 | 治理 / 金库原生币 | 未封口 · Completion | **B-090 Target**：**`GovernanceTreasury`** **`receive` + `spendETH`**（或等价），**仅 spender** |
| 104 | TT-COMP-B091-META-PAUSE-CHAIN-READ-001 | API / meta 读链 | 未封口 · Completion | **B-091 Target**：**`GET /meta`** **pause** 与 **factoryPaused / distributePaused** **链上读数**对齐 |
| 105 | TT-COMP-B092-VOTE-WEIGHT-STAKE-SNAPSHOT-001 | 治理 / 质押快照权重 | 未封口 · Completion | **B-092 Target**：快照块 **质押** 读链与 **`voting-power`/计票** **二选一**对账 |
| 106 | TT-COMP-B093-ESCROW-APPENDIX-AUTO-SPLIT-001 | Escrow / 附录分账 | 未封口 · Completion | **B-093 Target**：**80 附录 02** 一终态 **单链上出口** + Foundry 1～2 用例 |
| 107 | TT-COMP-B094-INDEXER-RESOLUTION-TERMINAL-STATE-001 | API / 投影 | 未封口 · Completion | **B-094 Target**：**三腿** 可得时 **`orders_projection`** 映 **Refunded/Partial/Slashed** |

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
- **状态**：只读 · 无代码  
- **本轮仅改**：无  
- **禁止再分析**：—  
- **任务**：扫描 `frontend/app/*`、`frontend/components/*` 中 loading/error/success/empty 问题并输出列表。  
- **验收**：交付问题列表（含类型与最小修复方向），不改代码。  

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
- **状态**：只读  
- **本轮仅改**：`docs/frontend/Release-Readiness-Frontend.md`（已存在则仅按需修订）  
- **任务**：前端 Release Readiness 技术说明与正式决议段落。  
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
- **本轮仅改**：`crates/api/src/chain/fee_router_verify.rs`、`crates/api/src/chain/mod.rs`、`crates/api/src/routes/internal.rs`（**`IndexerReconcileBody`**、**`indexer_reconcile`**、**`collect_fee_router_log_verify`**）、`docs/spec/04-后端与API.md`（**`indexer-reconcile`** 行）、`docs/任务母表.md`、本索引  
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
- **本轮仅改**：`crates/api/migrations/20260420000049_investor_share_transfer_events.sql`、`crates/api/src/db/investor_share.rs`、`crates/api/src/db/mod.rs`、`crates/api/src/chain/mod.rs`、`crates/api/src/chain/indexer.rs`、`crates/api/src/routes/internal.rs`、`crates/api/src/routes/governance_investor_share.rs`、`crates/api/src/routes/governance.rs`、`crates/api/src/routes/mod.rs`、`crates/api/src/u256_hex.rs`、`.env.example`、`docs/spec/04-后端与API.md`、`docs/任务母表.md`、`frontend/lib/api.ts`、本索引  
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
  1. **单一冻结时点**：应计 **`POST …/internal/investor-distribution-accrual`** 的 **`snapshot_block_number`** 为 **含块**上界；**仅** **`investor_share_transfer_events`** 中 **`block_number <= snapshot_block_number`** 的 **`Transfer`** 参与余额重放。  
  2. **交易顺序**：同块内按 **`log_index ASC`**（与 SQL **`ORDER BY block_number ASC, log_index ASC`** 一致）。  
  3. **机读契约**：**`GET …/governance/investor-distribution-accruals`**（列表项与 **`distribution_id`** 单条）及 **POST 首次成功 200** 含 **`snapshot_binding`**：**`anchor`****=`B-088-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER`**、**`snapshot_block_binding`****=`inclusive_upto_snapshot_block`**、**`transfer_replay_order`****=`block_number_asc_log_index_asc`**、**`eligibility_projection`****=`investor_share_transfer_events`**。  
  4. **锁仓/质押**：无独立链上投影时，以是否反映在 **`Transfer`** 为准；否则标 **Target**（不在本卡扩展新表）。  
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
- **本轮仅改**：`contracts/test/Escrow.t.sol`、`crates/core/src/escrow.rs`、`crates/core/src/lib.rs`、`crates/api/src/chain_off/reconcile.rs`（B-094 单测）、`evidence/B-094-execute-resolution-fixtures.md`、`contracts/README.md`、`docs/spec/04-后端与API.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md`、`docs/任务母表.md`、本索引  
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

- **阶段**：投资人分红快照补齐（**B-088** 母表 **Target**：锁仓/质押无独立投影）  
- **状态**：未封口 · **Completion**（只补缺；不重做 **`snapshot_block_number` / `snapshot_binding` / `b088_*`**）  
- **本轮仅改**：实现时钉死 **`crates/api`** 内 **indexer/DB 单一路径**（**≤1** 组件：新投影表 **或** 扩展现有 **`investor_share_*`** 消费）  
- **禁止再分析**：—  
- **任务（钉死）**：为 **锁仓或质押**（**二选一写死为母表口径的一种链上事件源**）增加 **可重放投影**，使 **快照块高截止** 下 **领取名单** 可与链下复算表 **逐地址**对拍。  
- **验收**：给定 **交易顺序 fixture**，名单与投影重放一致（**`cargo test -p traveltrust-api`** 或脚本文档化）。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：与 **`TT-INVESTOR-DISTRIBUTION-SNAPSHOT-TRANSFER-RULE-001`** 正交；**Country Pool 份额** 若另卡则勿在本卡混做。  

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
- **状态**：未封口 · **Completion**（不重做 **`GovernanceTreasury.spend` ERC20** + Timelock E2E）  
- **本轮仅改**：**`contracts/src/GovernanceTreasury.sol`**（**≤1** 合约点）+ 对应 **`GovernanceTreasury.t.sol`**  
- **禁止再分析**：—  
- **任务（钉死）**：**`receive` + `spendETH(to,amount)`**（或等价 **单笔原生转出**），调用方 **仍仅 `spender`**（Timelock）。  
- **验收**：Foundry：Timelock **`execute` → `spendETH`** 后收款 **EOA 余额增量** = payload（wei）。  
- **测试**：**`forge test --match-contract GovernanceTreasury`**（或新增用例名）。  
- **备注**：链上提案 UI 另卡；本卡 **仅合约**。  

---

### TT-COMP-B091-META-PAUSE-CHAIN-READ-001

- **阶段**：紧急开关可观测性补齐（**B-091** **Target**：**`meta.pause` 自动读链**）  
- **状态**：未封口 · **Completion**（不重做 **`factoryPaused`/`distributePaused`** Foundry 行为）  
- **本轮仅改**：**`crates/api/src/routes/health_meta.rs`**（**≤1** 组件）及 **契约单测**  
- **禁止再分析**：—  
- **任务（钉死）**：在 **`CHAIN_RPC_URL`** 与合约地址可用时，**`GET /meta`** 中与暂停相关的字段（**`pause` / `protocol-reference`** 已存在键位内）反映 **`EscrowFactory.factoryPaused`**、**`FeeRouter.distributePaused`** 的 **`eth_call`** 结果；**无链** 时保持显式降级，**禁止**伪造链上真值。  
- **验收**：**`cargo test -p traveltrust-api`**：**mock RPC fixture** 开关前后与读链一致。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：前端 **`readProtocolPauseFromMeta`** 若消费同字段可另开微 TT。  

---

### TT-COMP-B092-VOTE-WEIGHT-STAKE-SNAPSHOT-001

- **阶段**：治理投票权重补齐（**B-092** **Target**：**质押** / 份额链上快照；本卡先钉 **质押** **≤1** 点）  
- **状态**：未封口 · **Completion**（不重做 **`delegation_units_v1`、信号票、冻结权重**）  
- **本轮仅改**：**`crates/api`** 内 **单一路径**（**`governance_voting_power`** **或** **`governance_proposals` 计票`**，**二选一写死**）  
- **禁止再分析**：—  
- **任务（钉死）**：在 **指定快照块** 从 **`Staking`**（或仓库已钉死的 **单一链上读接口**）读取 **可投票权重**，与 **`GET …/voting-power` 或计票** **其一**对账；另一路径须 **显式未实现** 或保持不变。  
- **验收**：fixture：**下一快照** 权重与链上读数一致（单测）。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：**Country Pool 份额** 快照另卡（**TT-COMP-B092-*** 系列可续号）。  

---

### TT-COMP-B093-ESCROW-APPENDIX-AUTO-SPLIT-001

- **阶段**：Escrow 正常放款补齐（**B-093** **Target**：**80 附录 02** 非 **Completed**、仍 **收平台费** 终态的 **自动链上分账**）  
- **状态**：未封口 · **Completion**（不重做 **`release()`** **01 §10** 表驱动 + fuzz）  
- **本轮仅改**：**`contracts/src/Escrow.sol`**（**≤1** 合约点）+ **`Escrow.t.sol`**  
- **禁止再分析**：—  
- **任务（钉死）**：为 **附录 02 已钉死的一种终态** 增加 **单一链上出口**（新函数或受控 **`release` 变体**），**`platformFeeBps`** **仍仅** **`EscrowCreated` 封存**；**三腿守恒 + dust** 与 **01/80** 一致。  
- **验收**：Foundry：**1～2** 表驱动用例。  
- **测试**：**`forge test --match-contract EscrowTest`**（或 **`--match-test`** 新用例前缀）。  
- **备注**：**争议路径** 仍以 **`executeResolution`** 为主，勿与本卡混为同一函数。  

---

### TT-COMP-B094-INDEXER-RESOLUTION-TERMINAL-STATE-001

- **阶段**：争议执行投影补齐（**B-094** **Target**：仅凭日志时 **Completed**；**有三腿** 时细分终态）  
- **状态**：未封口 · **Completion**（不重做 Foundry **`test_B094_*`**、**`terminal_order_state_from_resolution_amounts`**）  
- **本轮仅改**：**`crates/api`** **chain_off 投影 / indexer-reconcile**（**≤1** 组件：解码 **tx input** **或** **outbox 侧车**，**二选一写死 SSOT**）  
- **禁止再分析**：—  
- **任务（钉死）**：当能解析 **`executeResolution` 三腿** 时，调用 **`terminal_order_state_from_resolution_amounts`** 写 **`orders_projection`（或等价行）**；**无三腿来源** 时保持 **`ResolutionExecuted` → Completed** 行为。  
- **验收**：**`cargo test -p traveltrust-api`**：**三模板** 投影终态为 **Refunded / PartiallyRefunded / Slashed**；缺三腿时与现网一致。  
- **测试**：**`cargo test -p traveltrust-api`**。  
- **备注**：与 **04** 争议节、执行器 outbox 回填策略一致。  

---

## 新增任务卡时（维护约定）

1. 在本文件表格 **一览** 中增加一行，**序号** 续编。  
2. 在 **正文** 增加一节，字段齐全：**阶段 / 状态 / 本轮仅改 / 禁止再分析 / 任务 / 验收 / 测试（可选）/ 备注**。  
3. **ID** 建议：`TT-<域>-<主题>-<序号>`，与历史风格一致。  
4. 封口后把 **状态** 改为 `已封口`，避免重复执行。

---

## 与仓库其它文档的关系

- **任务母表（Backlog）**：`docs/任务母表.md` — 条目级来源与状态；**先母表后 TT**。  
- **协作与低负载规则**：`docs/AI协作话术-减负与边界.md`  
- **前端上线说明（含英文决议）**：`docs/frontend/Release-Readiness-Frontend.md`  
- **产品/流程 SSOT**：仍以 `docs/spec/*` 为准；母表与索引均为 **派生层**，不替代 spec。
