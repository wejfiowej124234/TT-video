# 14 附录：API 与 ABI 对齐检查报告（合并版）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **主契约与 ABI SSOT** | **[14-合约-API-ABI-前后端对齐](14-合约-API-ABI-前后端对齐.md)** |
| **运行/单测/E2E 结论快照** | **§一** |
| **路径与前后端一致性** | **§二** |
| **路由登记权威** | **[04 §3.4](04-后端与API.md)** |
| **发版联合入口** | **[15](15-多维度文档与技术检查报告.md)** |

**用途**：合并原 14 系列运行简报与对齐检查报告的结论，作为 14-合约-API-ABI-前后端对齐 的附录，发版前与 15、04 §3.4 联合使用。  
**依据**：04 §三、14 主文档、frontend 与 crates/api 实际代码。

---

## 一、运行情况

| 项 | 结果 |
|----|------|
| **前端单测** | `npm run test`（vitest）**159 个用例全部通过**（32 个测试文件；以 CI / 本地 `npm run test -- --run` 为准）。 |
| **前端 E2E** | `cd frontend && npm run e2e` 即可：Playwright 会自动启动 dev 服务器（本地 `npm run dev`，CI `npm run start`）。用例：`e2e/smoke.spec.ts`、`e2e/core-path.spec.ts`、`e2e/release-flow.spec.ts`。 |
| **后端编译** | `cargo check -p traveltrust-api` **通过**（含 did-rank/gov/community 路由）。 |

---

## 二、API 对齐结果

### 2.1 路径与后端一致性

| 来源 | 说明 |
|------|------|
| **frontend/lib/api.ts** | 路由常量与 04 §三、14 §2.1 表基本一致；基地址 `NEXT_PUBLIC_API_BASE_URL`，默认 `http://localhost:8080`。 |
| **crates/api/src/main.rs** | 已挂载 04 §三 所列全部对外路由。 |

**逐项核对**：认证（/auth/*）、/health、/meta、/api/v1/me、/api/v1/me/stats、/api/v1/me/password、/api/v1/guides、/api/v1/guides/:id、/api/v1/guides/:id/stake、/api/v1/itineraries、/api/v1/discover/orders、/api/v1/orders（GET/POST）、/api/v1/orders/:id（GET）、accept/cancel/**mock-pay**/confirm-completion、messages（GET/POST）、confirm-final-plan、set-escrow-address、reviews（GET/POST）、dispute、evidence（GET/POST）、**confirm-completion-intent、open-dispute-intent**、disputes（GET）、disputes/:id（GET）、disputes/:id/resolve（POST）、**disputes/:id/execute-resolution-intent**、**did-rank/travelers、did-rank/guides、did-rank/itineraries**— 上述路径已在前端 routes 暴露并可调用。

**注（页面 vs HTTP 路径名）**：**`GET /api/v1/discover/orders`** 为**自由市场**可浏览订单列表的数据源；Next 主列表页为 **`/market`**（**`getDiscoverOrders`** / **`useMarketPage`** · **300ms debounce** · 收藏 **`localStorage` only** · **F-020 best-effort 已接线（①）· ② SLA**）。**`/discover`** 仅为 **客户端重定向至 `/market`** 的兼容壳，**非**第二套列表页（与 **[04 §3.4](04-后端与API.md)**、**[14](14-合约-API-ABI-前后端对齐.md)** 顶栏段一致）。**`/`** 行程预览 **`landingItinerarySession` = `localStorage`** — **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §2/§3。

**注（DID 行程榜）**：**`GET /api/v1/did-rank/itineraries`** 仍可在 **lib/api.ts** / **apiClient** 调用；**`/did-rank` 页面**当前**不拉取**行程列表（**[30 §0.1](30-DID排行榜-页面规范.md)**）；**check-55 / smoke** 仍验收该端点。

### 2.2 后端有、04/14 主表已同步的路由

| 方法 | 路径 | 用途 | 状态 |
|------|------|------|------|
| POST | /api/v1/orders/:id/mock-pay | P3 链下 mock：Accepted→Escrowed | ✅ 04 §3.4、14 §2.1 已收录 |
| POST | /api/v1/orders/:id/set-escrow-address | P18 链下 mock：写入 order.escrow_address | ✅ 04 §3.4、14 §2.1 已收录 |
| GET | /api/v1/did-rank/travelers、/api/v1/did-rank/guides | DID 排行榜（DB 优先 + chain_off 回退） | ✅ 后端已挂载公开接口；无 DB 且无 chain_off 时返回空列表+note |
| POST | /api/v1/itineraries/custom | 49 A 自由市场自定义行程 | ✅ 已实现；后端 POST /itineraries/custom 已上线，frontend routes.itinerariesCustom、apiClient.postItineraryCustom 已对接，[50](50-前端与规范一致性检查报告.md) §2 已修复 |
| GET | /api/v1/governance/pool、/api/v1/governance/rewards | 49 G 治理与激励（P2 占位） | ✅ 04 §3.4 已登记；后端占位路由已挂载（X-Implementation-Status: placeholder）；frontend routes.governancePool、governanceRewards 已定义；app/governance 页已存在 |

### 2.3 社区 API（51-31-9/51-31-B1/51-31-B2）前后端对齐

| 来源 | 说明 |
|------|------|
| **04 §3.4** | 社区路由（feed、posts、post/:id、like、comments、collect、conversations、**conversations/ensure**、follow、friends、me/*、**posts/upload-media**、**media/capabilities**、**media-assets/sessions***、**uploads/community-posts/:name** 等）与 **`me/profile-avatar*`**、**`uploads/profile-avatars/:name`** 已登记（**2026-05-31 · Phase①→② T3**）；**GET …/feed** 支持 **mode**（51-31-B2）。 |
| **frontend/lib/api.ts** | `routes.community` 含 feed、posts、**postsUploadMedia**、**mediaCapabilities**、**mediaAssetsSessions***、conversations、conversationMessages、**meProfileAvatar**（`/api/v1/me/profile-avatar`）等，与 04 §3.4 逐项对应。 |
| **frontend/lib/apiClient/community.ts** | getFeed(**mode**)、发帖/评论/会话/关注/好友/收藏；**presign/commit** 与 **media-assets** 会话链与后端一致。 |
| **crates/api** | `routes/community/router.rs` + `me_profile_avatar.rs` 已挂载上列路径；机读闸 **`bash scripts/run-check-04-routes.sh`**（**STRICT_WARNINGS=1**）须 **exit 0**。 |

**2026-05-31 增补（社区媒体 + 头像 · T3）**：

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | /api/v1/community/conversations/ensure | 幂等创建 DM 会话 |
| GET | /api/v1/community/media/capabilities | PublishDrawer 上传能力 |
| POST | /api/v1/community/posts/upload-media | 发帖媒体本地上传 |
| GET | /api/v1/uploads/community-posts/:name | 发帖媒体匿名读 |
| POST | /api/v1/community/media-assets/sessions | 分片上传创建 |
| POST | /api/v1/community/media-assets/sessions/:asset_id/parts | 分片预签 |
| POST | /api/v1/community/media-assets/sessions/:asset_id/complete | 分片完成 |
| GET | /api/v1/community/media-assets/:asset_id | 资产状态 |
| POST | /api/v1/me/profile-avatar | 本机头像直传 |
| POST | /api/v1/me/profile-avatar/presign | 头像预签 |
| POST | /api/v1/me/profile-avatar/commit | 头像提交 |
| GET | /api/v1/uploads/profile-avatars/:name | 头像匿名读 |

**结论**：社区 + 头像 **12 路由** 已写入 **04 §3.4**；发版前须 **`run-check-04-routes.sh` exit 0**（见 [PHASE2-READY-REPORT](../runbook/PHASE2-READY-REPORT.md) **T3**）。

### 2.4 请求头与幂等

- **x-request-id**：前端所有请求已带（apiClient 统一 `requestId()`）。  
- **Idempotency-Key / X-Idempotency-Key**：04 §四、01 §10 #14 要求写操作带幂等键；前端在部分写操作中通过 `withIdempotency` 传入并设置双头。建议：**所有写操作**（POST/PUT）均显式支持幂等键并带双头。  
- 后端已读取并回写 Idempotency-Key/X-Idempotency-Key；**中间件已实现写请求 key 去重与结果复用**（51-B4 已闭环）；与 idempotency_keys 表持久化对接为生产前建议。

### 2.5 51-D7 API/ABI/前后端对齐执行核对（51 阶段）

按 [14-合约-API-ABI-前后端对齐](14-合约-API-ABI-前后端对齐.md) **§4 对齐检查清单** 逐项核对：

| 14 §4 项 | 核对结果 |
|----------|----------|
| 合约 ABI 放入 contracts/abi/ 并同步 frontend/dapp/abis/ | ✅ Escrow.json、EscrowFactory.json 已同步（§三 3.1） |
| 前端 API 路径与 lib/api.ts 及 04 §三 一致 | ✅ 社区及 v1 路由与后端挂载一致（含 **`/api/v1/did-rank/itineraries`**；**`/did-rank` 页内调用范围**见 **30 §0.1**） |
| 前端 DApp ABI 与部署合约版本一致；EIP-712 domain 与 08-3 一致 | ✅ §三 3.2、3.3 |
| crates/api 路由与 04 §三 表一致 | ✅ 已挂载；社区路由与 04 §3.4 一致 |
| GET /meta 与前端版本绑定、fail-closed 已实现 | ✅ 05 §七点六、后端已实现 |

**04 §3.4 与代码**：已核对 crates/api routes、frontend/lib/api.ts、frontend/lib/apiClient 与 04 §3.4 社区及 v1 路由一致；Feed **mode**（51-31-B2）已在 04 与本节 §2.3 登记。**发版前**须再执行本附录全文核对并确认无新增差异。

---

## 三、ABI 对齐结果

### 3.1 单源与引用

| 项 | 约定（14 §1.2） | 现状 |
|----|------------------|------|
| **contracts/abi/** | 合约编译产物单源 | 已有 Escrow.json、EscrowFactory.json、**GuideIdentityStakingPool.json**、**ProviderIdentityStakingPool.json**、**Registry.json**；合约变更后用 `./scripts/sync-abi-from-forge.sh`（或 `forge inspect`）回写。 |
| **frontend/dapp/abis/** | Staking/Registry 须与 contracts/abi **字节一致**；Escrow 可为精简子集 | **Staking/Registry** 由 `check-55-s13` 门禁；**Escrow** 须含 openDispute 等调用所需条目；**EscrowFactory** 与 canonical 一致。 |

### 3.2 合约方法名与文档表述

| 文档（14 §1.1） | 合约与前端实际 | 说明 |
|-----------------|----------------|------|
| Escrow：deposit / **release**（链上释放；**非** `POST confirm-completion`）/ refund / openDispute | deposit / **release** / refund / openDispute | 与 14 主文档 §1.1 一致；**release** = 链上放款入口，与链下「确认行程完成」解耦（04 §3.4）。 |

**方法级核对**：contracts/abi/Escrow.json 含 deposit、release、refund、openDispute、status、executeResolution；frontend/dapp/abis/Escrow.json 与 useEscrowActions 调用的 functionName **一致**。

### 3.3 EscrowFactory

contracts/abi 与 frontend/dapp/abis 均已含 EscrowFactory.json（48 前后端 ABI 对齐时同步）。创建 Escrow 可由后端/执行器或前端 DApp 调用 Factory.createEscrow；前端与已存在的 Escrow 地址交互时使用 Escrow.json。

---

## 四、本次修改与补齐（历史留痕）

- **crates/api（did-rank）**：did-rank 路由已注册并对外开放（travelers/guides/itineraries）；当前实现为 DB 优先 + chain_off 回退（无数据源时返回空列表+note）。
- **49 G 阶段**：04 §3.4 已登记 GET /api/v1/governance/pool、/api/v1/governance/rewards（P2 占位）；crates/api/src/routes/governance.rs 占位路由；frontend lib/api.ts 增加 governancePool、governanceRewards；§2.2 已补充上述接口与前后端对齐。

---

## 五、技术文档中的问题与建议

### 5.1 文档遗漏（建议补全）

| 文档 | 问题 | 建议 | 状态 |
|------|------|------|------|
| **04 §三** | 路由主表未列 mock-pay、set-escrow-address | 在 §3.3 表中增加两行，注明「链下 mock / P3」「链下 mock / P18」 | ✅ 已落实（04 §3.3、§3.4 已含） |
| **14 §2.1** | 同上 | 与 04 同步补充 | ✅ 已落实（14 §2.1 表已含） |

### 5.2 表述不一致（建议统一）

| 文档 | 当前表述 | 建议 | 状态 |
|------|----------|------|------|
| **14 §1.1** | Escrow 关键方法写为「deposit / confirm / openDispute」 | 改为「deposit / **release**（链上释放，与 API confirm-completion 解耦）/ refund / openDispute」 | ✅ 已落实（14 主文档 §1.1 表已为 release + 04 §3.4 语义） |

### 5.3 建议自检

- 本地 E2E：`cd frontend && npm run e2e`。  
- 发版前按本附录再核对一遍路径与幂等键。

---

## 六、总结

| 维度 | 结论 |
|------|------|
| **API 路径** | 前端 routes 与后端实际挂载路由一致；04/14 主表已含 mock-pay、set-escrow-address、did-rank（含 itineraries）。 |
| **API 基地址与头** | 基地址、x-request-id 已统一；幂等键已部分支持，建议写操作全量带 Idempotency-Key。 |
| **ABI 单源** | contracts/abi 为单源，frontend/dapp/abis 已同步 Escrow.json、EscrowFactory.json（48 对齐），符合 14 §1.2。 |
| **ABI 方法名** | 合约、ABI、useEscrowActions 一致；14 §1.1「confirm」建议改为「release」。 |

**整体**：ABI 已对齐；API 路由已与前后端实现一致。技术文档若有遗漏或表述不一致，按 §五 修订 04 与 14 主文档即可。

---

## 七、48 拆分后核对（补充）

**依据**：[48-后端模块化拆分与落地清单](48-后端模块化拆分与落地清单.md) §2.2、§十三。

| 项 | 48 前 | 48 拆分后补齐 | 结论 |
|----|--------|----------------|------|
| **后端路由** | main 内挂载 | 路由已拆至 routes/*（health_meta、auth、me、guides、orders、evidence、disputes、itineraries、discover、messages、did_rank、internal、intents），路径与 48 §2.2 一致 | ✅ 对齐 |
| **前端 mock-pay** | 后端有路径，前端 routes 未声明 | frontend/lib/api.ts 已增 `orderMockPay(id)`；apiClient/orders 已增 `orderMockPay(orderId)` | ✅ 已对齐 |
| **前端 intents** | 后端 routes/intents 三路径 | frontend/lib/api.ts 已增 orderConfirmCompletionIntent、orderOpenDisputeIntent、disputeExecuteResolutionIntent；apiClient/orders 与 disputes 已增对应 POST 方法 | ✅ 已对齐 |
| **ABI EscrowFactory** | contracts/abi 有，frontend 无 | frontend/dapp/abis 已从 contracts/abi 同步 EscrowFactory.json；dapp/abis/README 已更新 | ✅ 已对齐 |

**结论**：48 拆分后前后端 API 与 ABI **已继续对齐**；mock-pay、intents、EscrowFactory 已补齐，可与 48 §13.4 联合使用。

---

## 八、企业级深度补充（端口/门禁/UI-API-ABI链路）

### 8.1 端口与部署契约核对

| 组件 | 代码证据 | 默认端口 | 结论 |
|------|----------|----------|------|
| Backend API | `crates/api/src/startup/mod.rs` | `8080` | 与 04 §7.7 一致 |
| Frontend Dev | `frontend/package.json` (`next dev -p 3012`) | `3012` | 默认前端开发端口已从 3000 迁移到 3012 |
| Frontend 兼容 | `frontend/package.json` (`dev:3000`) | `3000` | 兼容脚本，非主路径 |
| PostgreSQL | `docker-compose.yml` | `5432` | DB 端口契约明确 |
| 一键联调脚本 | `scripts/start-api-with-seed.bat` | `3012/8080/5432` | 本地端到端启动脚本与代码契约一致 |

### 8.2 中间件门禁与风控一致性核对

| 门禁 | 代码证据 | 行为 | 风险控制结论 |
|------|----------|------|--------------|
| auth 占位 | `crates/api/src/middleware/auth_pause_metrics/mod.rs` | 非公开 `/api/v1` 路由需身份头 | 未登录调用被阻断 |
| 公共白名单 | 同上 | health/meta/auth/discover/guides/did-rank/community 只读/internal | 与前端公开页契约一致 |
| degraded 冻结写操作 | 同上 `authority_source_layer` | 链异常时返回 503 | 防止异常链态下资损写入 |
| pause 门禁 | 同上 `pause_gate_layer` | `PAUSE_MODE=1` 时仅 allowlist 放行 | 防止暂停态误操作 |
| 全局与关键限流 | `crates/api/src/middleware/rate_limit.rs`（**`mod.rs`** **`pub use`**） | `/api/v1` 限流 + orders 关键写更严限流 | 抗刷与关键动作保护已代码落地 |
| 幂等缓存/持久化 | `crates/api/src/middleware/mod.rs` `idempotency_key_layer` | 读内存+DB 复用响应、严格模式可拒绝无幂等键写请求 | 满足企业级重试去重要求 |

### 8.3 Escrow 交互链路核对（UI -> API/ABI -> 状态）

| 交互动作 | UI 代码 | API/ABI | 状态约束 |
|----------|---------|---------|----------|
| 接单 | `frontend/components/escrow/EscrowDetail/OrderActionsBlock.tsx` | `POST /api/v1/orders/:id/accept` | `created` |
| 取消 | 同上 | `POST /api/v1/orders/:id/cancel` | `created/accepted/draft` |
| 确认行程完成（链下） | 同上 | `POST /api/v1/orders/:id/confirm-completion` | `accepted/escrowed`；**非**链上放款；`Escrow.release` 见下行与 [04](04-后端与API.md) §3.4、[14 正文](14-合约-API-ABI-前后端对齐.md) §2.1 |
| 行程修改保存 | `frontend/components/escrow/EscrowDetail/index.tsx` | `PATCH /api/v1/orders/:id/itinerary` | Draft 且未锁 hash |
| 草稿选向导 | `frontend/components/escrow/EscrowDetail/BookGuideModal.tsx` | `PATCH /api/v1/orders/:id/guide` | tourist、未 Escrowed、未分配 guide_id、未 confirm-final-plan |
| Deposit/Release/Refund/OpenDispute | `frontend/components/escrow/EscrowDetail/EscrowOnChainActions.tsx` + `frontend/dapp/hooks/useEscrowActions.ts` | `Escrow.deposit/release/refund/openDispute` | 钱包连接、链匹配、地址可用 |
| 评分提交 | `frontend/components/escrow/EscrowDetail/ReviewBlock.tsx` | `POST /api/v1/orders/:id/reviews` | 后端终态校验 |

### 8.4 差异与后续门禁

| 项目 | 当前状态 | 建议门禁 |
|------|----------|----------|
| chain_off 分支返回 `not_implemented` | 仍存在 | 发布时按链模式关停不支持路径或补齐实现 |
| internal 接口保护 | 代码上已单独命名空间，依赖部署隔离 | 在网关与 CI 增加“禁止公网暴露 internal”检查 |
| 事件投影持久化表 | 文档定义完整，迁移未全量建表 | 建 event_log/checkpoints/orders_projection 迁移并接入 indexer |
| mock 回退策略 | 社区/DID 排行主路径已无本地假数据兜底；其余页面待生产 fail-closed 门禁 | 生产构建 fail-closed，禁止 mock 兜底 |

### 8.5 字段级核对补充（UI/API/DB/ABI）

| 核对对象 | UI 消费字段 | API 输出字段 | DB 列 | ABI/Event 锚点 | 结论 |
|----------|-------------|--------------|-------|----------------|------|
| 订单主信息 | `id/state/status/sub_status/amount/currency/tourist_id/guide_id/escrow_address` | `order.*` + 列表 `items[*]` | `orders.id/status/sub_status/amount/currency/tourist_id/guide_id/escrow_address` | `Escrow.orderId/status/totalAmount/token` + `EscrowCreated` | ✅ 字段语义对齐 |
| 行程快照 | `itinerary.version/snapshot_hash/daily_itinerary/amount_breakdown` | `itinerary.*`、`confirm-final-plan` 返回 `snapshot_hash/version` | `itineraries.version/snapshot_hash/days_json/amount_breakdown_json` | `EscrowCreated.snapshotHash/schemaVersion` | ✅ 快照链路闭环 |
| 评价 | `score/comment` 与返回 `weight` | `review.score/comment/weight` | `reviews.score/comment/weight` | 无直接链上字段 | ✅ 业务层对齐 |
| 争议裁决 | `refund_ratio/slash_guide` | `dispute.refund_ratio/slash_guide/status` | `disputes.refund_ratio/slash_guide/status` | `ResolutionExecuted.resolutionId/decisionHash` | ✅ 裁决字段对齐 |
| 证据回执 | `content_hash/quote_hash/snapshot_hash` | `receipt.content_hash/uploader_id/created_at` | `evidence_receipts.content_hash/quote_hash/snapshot_hash` | `DisputeOpened.reasonHash`（理由锚点） | ✅ 证据字段对齐 |

字段例外说明：
`payment_deadline/chat_confirm_deadline/rating_deadline` 为后端按状态机规则计算字段，属于运行时衍生字段，不要求 DB 同名列。

### 8.6 代码与文档一致性评分（附录复核）

本节与 04 §7.13、§7.14 使用同一评分口径：
`映射一致性计分` 与 `实现完备度风险` 分离。

| 评分维度 | 分数 | 复核依据 |
|----------|------|----------|
| API 路径与参数映射 | 100/100 | 路由签名与文档项一一对应 |
| ABI 方法与事件映射 | 100/100 | `Escrow.sol` 方法与事件和文档/ABI 一致 |
| UI-API 参数链路映射 | 100/100 | apiClient 与 EscrowDetail 关键交互链路对齐 |
| API-DB 字段映射 | 100/100 | 核心字段已映射，衍生字段按规则豁免 |
| 端口与部署契约映射 | 100/100 | `3012/8080/5432` 与脚本/配置一致 |

加权总分：`100/100`（与 04 保持一致）。

审计判定：
- 映射一致性：`100/100`（已满足“100%代码映射文档”）。
- 发布就绪：仍取决于实现完备度风险是否清零。

当前需闭环的三项发布风险（不计分）：
| 项 | 证据 | 闭环动作 |
|----|------|----------|
| 非 chain_off 分支占位实现 | `crates/api/src/routes/orders/`（`mod`/`mutations`/`reviews`）、`crates/api/src/routes/disputes.rs` | 补实现或文档化禁用路径并纳入发布门禁 |
| internal 暴露风险 | `/api/v1/internal/*` 仅靠部署隔离 | 增加网关+CI 双重封禁检查 |
| 事件投影持久化不足 | 设计有、迁移未全量启用 | 增补 event_log/checkpoint/projection 迁移与回放证据 |

### 8.7 发布门禁复核清单（附录执行版）

本清单用于审计与发布签字，与 04 §7.15 一一对应。

| 复核项 | 审计问题 | 通过标准 | 结果 |
|--------|----------|----------|------|
| R1 路由实现完备度 | 主路径是否仍有 `not_implemented`？ | 无，或已网关禁用且留痕 | `□` |
| R2 internal 暴露控制 | 公网是否能访问 `/api/v1/internal/*`？ | 不能；CI 与网关双通过 | `□` |
| R3 投影可回放能力 | 是否有可执行迁移+回放证据？ | 有；可重演并输出审计日志 | `□` |
| R4 生产禁 mock | 生产构建是否关闭 mock fallback？ | 关闭；异常 fail-closed | `□` |
| R5 证据包完整性 | 是否有当次 release evidence？ | 有；含配置、日志、审计结论 | `□` |

当前预填状态（2026-03-06）：
- 已通过：无。
- 未通过：R1、R2、R3、R4、R5。

说明：
R5 采用“当次发布 evidence”口径；历史或模板 evidence 不计入本次通过。

签字规则：
- 5 项全通过后，附录可标记“可上线”。
- 未全通过，仅可保留“映射一致性 100/100”，不得给出“上线通过”结论。

### 8.8 R1-R5 闭环与签字模板（执行用）

| 复核项 | 闭环动作 | 必要证据 | 签字栏 |
|--------|----------|----------|--------|
| R1 路由实现完备度 | 关闭 `not_implemented` 主路径或网关禁用并文档化 | 路由抽检结果、网关规则截图/配置 | `责任人: ____ 日期: ____` |
| R2 internal 暴露控制 | 公网 deny + CI 双门禁 | 外网探测日志、CI 通过记录 | `责任人: ____ 日期: ____` |
| R3 投影可回放能力 | 执行迁移与回放，生成审计日志 | 迁移执行日志、回放日志、audit 记录 | `责任人: ____ 日期: ____` |
| R4 生产禁 mock | 生产构建禁 fallback，异常 fail-closed | 构建配置、e2e/运行日志 | `责任人: ____ 日期: ____` |
| R5 当次 evidence 完整性 | 归档当次 GO 证据包并核对完整性 | `evidence/GO_YYYYMMDD/*` + 汇总说明 | `责任人: ____ 日期: ____` |

审计结论模板：
- R1~R5 全部通过：`可上线（发布完成度 100%）`。
- 任一未通过：`不可上线（仅映射一致性 100/100）`。

本次状态（2026-03-06）：
- 映射一致性：`100/100`。
- 发布完成度：待 R1~R5 闭环后再评估为 `100%`。

### 8.9 审计基线快照（2026-03-06）

| 复核维度 | 结论 | 说明 |
|----------|------|------|
| API/ABI/字段/端口映射 | 通过 | 映射一致性 100/100 |
| 路由实现完备度（R1） | 未通过 | 主路径仍有 `not_implemented` |
| internal 暴露控制（R2） | 未通过 | 缺少网关+CI 双证据 |
| 投影可回放能力（R3） | 未通过 | 缺当次回放证据链 |
| 生产禁 mock（R4） | 未通过 | 构建级 fail-closed 与 e2e 证据仍待补齐（主路径已 API+空态） |
| 当次 evidence 完整性（R5） | 未通过 | 尚未形成当次 GO 证据包 |

通过率快照：
| 指标 | 结果 |
|------|------|
| R1~R5 通过率 | `0/5 = 0%` |
| 可上线结论 | `否` |

说明：
当 `R1~R5` 全部转为 `√` 后，附录可将“可上线结论”改为 `是`。

**本节结论**：14 附录已从“路径对齐”提升到“端口+门禁+交互+字段+评分”六层校验。当前映射一致性评分 **100/100**；发布前仍需闭环 8.6 风险项以达到“可上线”状态。

---

*与 [14-合约-API-ABI-前后端对齐](14-合约-API-ABI-前后端对齐.md) 配套；原 14-运行与API-ABI对齐检查简报、14-前后端API与ABI对齐检查报告 内容已合并至本文。*
