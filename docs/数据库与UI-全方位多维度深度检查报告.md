# 数据库与 UI：全方位多维度深度检查报告

**用途**：开工前一次性完成「**每个页面 / 每个功能 → API → 数据库表**」对照，识别缺口、补齐资料、确认 UI 设计覆盖。与 [数据库表与UI功能对照检查](数据库表与UI功能对照检查.md)、[04-业务逻辑与数据库支持清单](spec/04-业务逻辑与数据库支持清单.md)、[数据库-缺口与需补充清单](数据库-缺口与需补充清单.md)、[41-后端数据库接库与落地清单](spec/41-后端数据库接库与落地清单.md) 配套。**`/` · `/market*` 四页 FE 数据链**（**1×** POST · **`localStorage`** · **`useMarketPage` debounce** · 收藏 **`localStorage` + F-020 best-effort** → **②** SLA）见 **[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** — **本表 HTTP↔DB**，**不**含浏览器 **`localStorage`** 预览/收藏态。

**检查维度**：① 按页面逐项（路由→功能→API→表）；② 按数据库表（已有/缺表/缺列/待实现）；③ 资料与文档补齐；④ UI 设计（13-1 页面地图 vs 实际实现）。

---

## 一、按页面逐项检查（路由 → 功能 → API → 表）

以下按 **前端路由** 列出：页面路径、主要功能、调用的 API、所需表、是否满足。

| 路由 | 页面/功能 | 调用 API | 所需表/来源 | 是否满足 | 备注 |
|------|------------|----------|-------------|----------|------|
| `/` | Landing：**1×** `postItineraryCreate` · **`ITINERARY_CARD_COUNT=1`** 预览卡 · **`landingItinerarySession` = `localStorage`** · `UnlockModal`→`getOrder`（**非**真 USDC） | postItineraryCreate, getOrder | orders, itineraries | ✅ | 行程与订单均已双写+hydrate；**CODE SSOT** §2 |
| `/auth/login` | 登录 | auth.login | users, sessions | ✅ | |
| `/auth/register` | 注册 | auth.register | users, sessions | ✅ | |
| `/auth/verify-email` | 邮箱验证 | auth.verifyEmail | users, sessions | ✅ stub 也落 users | |
| `/auth/forgot-password` | 忘记密码 | auth.forgotPassword | users | ✅ | |
| `/auth/reset-password` | 重置密码 | auth.resetPassword | users | ✅ | |
| `/me` | 个人中心、个人统计 | getMe, getMeStats, putMe | users, orders, reviews 聚合 | ✅ | |
| `/me/password` | 修改密码 | putMePassword | users | ✅ | |
| `/guides` | 向导列表 | getGuides | guides | ✅ | |
| `/guides/[id]` | 向导详情 | getGuideById | guides | ✅ | |
| `/guide/register` | 向导注册、证件上传、质押 | guideCreate, uploadGuideDoc, guideStake | guides + 文件系统 | ✅ | |
| `/market` | 自由市场：订单流+向导库、筛选、收藏 | **`useMarketPage`** · **`getDiscoverOrders`**（**300ms debounce**）· **`getGuides`** | orders, guides | ✅ | 收藏 **`localStorage` + F-020 best-effort** → **②** SLA；失败/空时 demo/MOCK，接库后用真实数据；**CODE SSOT** §3 |
| `/market/provider` | 商家橱窗子站 · Masonry 列表 · Studio 发布 | **`GET …/market/provider/listings`**（PG 时 **`meta.source=postgres_catalog`**） | market 相关 catalog 表（有 DB 时） | ✅ | API 失败 + demo gate → demo masonry；**非** MARKET-L5；**CODE SSOT** §4 |
| `/market/acquisition` | 旅行收购子站 · bond 门闸 · listing | **`GET …/market/acquisition/listings`** · **`POST /me/acquisition/publish-bond`** 等 | acquisition 相关（**① mock bond**） | ✅ | Hub **`/me/identities`** 入口；**②** 真链 bond；**CODE SSOT** §5 |
| `/discover` | **兼容重定向壳**：`router.replace("/market")`；**非**独立列表页（**04 §3.4**、**13-1**） | —（列表 API 仅在 **`/market`** 页：**getDiscoverOrders**） | — | ✅ | 旧链兼容；**勿**维护第二套 Discover UI |
| `/orders` | 我的订单列表 | getOrders (tourist/guide) | orders | ✅ | |
| `/orders/new` | 创建订单 | orderCreate, getOrder | orders | ✅ | |
| `/escrow/[id]` | 托管详情：状态、聊天、评价、证据、确认最终方案、设置托管地址 | orderById, orderMessages, orderReviews, orderEvidence, orderConfirmFinalPlan, orderSetEscrowAddress, accept, cancel, confirmCompletion, dispute, disputeResolve | orders, order_messages, reviews, disputes | ✅ | 含聊天双写+hydrate |
| `/itinerary/new` | 行程生成 | postItineraryCreate | itineraries | ✅ | db 双写+hydrate 已实现 |
| `/disputes` | 争议列表 | getDisputes | disputes | ✅ | |
| `/disputes/[id]` | 争议详情、裁决 | getDisputeById, disputeResolve | disputes | ✅ | |
| `/did-rank` | DID 排行榜 | didRankTravelers, didRankGuides | orders + reviews 聚合或 stub | ✅ 无专用表 | |
| `/community` | TT社区 Feed | `getFeed` 等 → `/api/v1/community/*` | `community_*` 等（见 `20250306*～20250310*` migrations） | ⚠ **有 DATABASE_URL 时** ✅ | 无 DB 时可能空数据；mock 兜底按前端实现 |
| `/community/me/*` | 我的动态/收藏等 | `apiClient/community` | 同上 | ⚠ 同上 | |
| `/community/messages` | 私信列表 | 同上 | conversations / messages | ⚠ 同上 | |
| `/community/messages/[id]` | 私信会话 | 同上 | 同上 | ⚠ 同上 | |
| `/community/friends` | 好友/关注 | 同上 | follows / friends | ⚠ 同上 | |
| `/community/user/[id]` | 用户主页 | 同上 | community + users | ⚠ 同上 | |
| `/governance` | 治理（参数/提案/投票） | `GET /api/v1/governance/pool`、`/rewards`（读池/奖励）；页内提案等多为占位 | governance_pool、governance_reward_records | ⚠ **部分** | 完整提案/投票链路与 UI 待产品 |
| `/help`, `/terms`, `/privacy` | 帮助、条款、隐私 | 静态或 CMS | 无需表 | ✅ | |

**小结**：  
- **已满足**：登录注册、个人中心、向导、**自由市场（`/market` · `/market/provider` · `/market/acquisition`；`/discover` 重定向）**、订单、托管详情（含聊天）、行程生成、争议、DID 排行、静态页。  
- **部分满足**：**TT 社区** — 有 `DATABASE_URL` 时 API + 表已挂载（见 **04 §3.4**、`routes/community.rs`）；审核/举报全链路等见 **160**。  
- **部分满足**：**Governance** — `GET /api/v1/governance/pool|rewards` + 表已具备；**治理页**完整提案/投票仍多为占位，按产品迭代。

---

## 二、按数据库表检查（已有 / 缺表 / 缺列 / 待实现）

### 2.1 已有迁移与表（`crates/api/migrations/` 共 **21** 支，下表节选）

| 迁移 | 表 | 用途 | db 层 + 双写 + hydrate |
|------|-----|------|------------------------|
| 000001 | users, sessions | 用户、会话 | ✅ |
| 000002 | guides | 向导 | ✅ |
| 000003 | orders | 订单 | ✅ |
| 000004 | reviews, disputes | 评价、争议 | ✅ |
| 000005 | (ALTER guides) | guide_license_url | — |
| 000006 | itineraries | 行程 | ✅ |
| 000007 | order_messages | 订单聊天 | ✅ |
| 000011～000012 等 | community_*、posts、follows… | TT 社区 | ✅ `routes/community.rs`（读写在有 DB 时生效） |
| 000013 | idempotency_keys | 写操作幂等 | 表已有；是否强制 `Idempotency-Key` 见环境变量与缺口清单 |
| 000010 等 | governance 相关 | 治理参数/提案等 | 按实现；**Governance UI** 仍多为占位 |

### 2.2 缺表（当前 UI/业务需要时再建）

| 表 | 用途 | 何时需要 |
|----|------|----------|
| guide_slot | 档期占位 | 可选；可由 orders 查询替代 |
| evidence_receipts | 证据回执独立审计 | 表已建（**000009**）；全路径写入是否覆盖见 API/产品 |
| stakes | 质押历史 | 可选；当前 guides.stake_amount |
| **社区扩展** | 审核举报、推荐快照等 **160 Target** | 核心社区表已存在；增量表/路由按 160 落地 |
| **治理域** | Governance | proposals, votes, params_snapshot — 产品落地方 |
| event_log, checkpoints_sharded, orders_projection, reconciliation_reports, correction_log, executor_executions | 接链后 | 接链索引器与对账/执行器时 |

### 2.3 缺列（可选补齐）

| 表 | 缺列 | 说明 |
|----|------|------|
| orders | trip_end_at, snapshot_hash | 04 附录 §9.4；对账/审计需要时 |
| users | email_verified_at | 做邮箱验证流程时 |

### 2.4 待实现 / 待加强（代码层）

| 项 | 说明 |
|----|------|
| itineraries / order_messages | ✅ 已实现双写 + hydrate（以当前 `crates/api` 为准） |
| idempotency_keys | 表已有；生产是否强制键策略见 **数据库-缺口与需补充清单** |
| 社区审核 / 举报 API | **160** Target 路由与 RBAC |

---

## 三、资料与文档补齐检查

| 文档 | 用途 | 状态 |
|------|------|------|
| [04-数据库架构与表分类](spec/04-数据库架构与表分类.md) | 域划分、表分类、§七 索引与约束一览 | ✅ 已含 §七 |
| [04-业务逻辑与数据库支持清单](spec/04-业务逻辑与数据库支持清单.md) | 业务逻辑 ↔ 表/列/索引 | ✅ |
| [数据库表与UI功能对照检查](数据库表与UI功能对照检查.md) | UI 功能 ↔ API ↔ 表 | ✅ 与本文 §一 互补 |
| [数据库-缺口与需补充清单](数据库-缺口与需补充清单.md) | 缺口与需补充一站式 | ✅ |
| [41-后端数据库接库与落地清单](spec/41-后端数据库接库与落地清单.md) | 接库勾选、迁移、hydrate | ✅ |
| [04-附录-DDL草案](spec/04-附录-DDL草案.md) | 可执行 DDL | ✅ |
| **本文** | 按页面×功能×API×表 + 多维度汇总 | ✅ 开工前一次性对照 |

**建议**：接库与迭代时以「数据库-缺口与需补充清单」为主清单勾选；按页面排查时以本文 §一 为准。

---

## 四、UI 设计对照（13-1 页面地图 vs 实际实现）

| 13-1 表1 页面/分组 | 设计任务 | 实际路由 | 数据来源 | 缺口 |
|-------------------|----------|----------|----------|------|
| Landing | 品牌叙事、引导进入协议 | `/` | 静态 + getOrder/postItineraryCreate | 无 |
| Discover | 目的地/向导卡片、筛选 | **`/market`**（**`/discover` 仅重定向壳**） | orders, guides | 无 |
| 自由市场 /market | 撮合、订单流+向导库 | `/market` | orders, guides | 无 |
| TT社区 /community | UGC 动态/消息/好友/我 | `/community` 及子路由 | **apiClient/community** + 有 DB 时持久化 | 无 DB 时可能空/Mock；160 审核链待产品 |
| OrderFlow | 步骤引导、状态机 | `/orders`, `/orders/new`, `/escrow/[id]` | orders, itineraries | 行程持久化待实现 |
| EscrowDetail | 托管状态、金额、聊天、评价、证据 | `/escrow/[id]` | orders, order_messages, reviews, disputes | 无 |
| Dispute | 证据时间线、裁决 | `/disputes`, `/disputes/[id]` | disputes | 无 |
| Governance | 参数/提案/投票 | `/governance` | 静态占位 | 缺治理域表与 API |
| Admin / Runbook / Evidence Viewer | 内部运维 | 未暴露路由 | — | 08 当前无 admin，符合 |

**结论**：  
- **页面覆盖**：13-1 表 1 所列页面均有对应路由；**Governance** 多为静态占位；**TT 社区** 已有后端路由与表（有 DB 时）。  
- **数据缺口**：**Governance** 全链路 UI↔API；**社区** 的审核/举报/媒体规模化等见 **160**、**270**。

---

## 五、还缺什么数据库表（汇总）

| 类别 | 缺什么 | 优先级 |
|------|--------|--------|
| **表已建、代码已接** | itineraries、order_messages 的 db 层 + 双写 + hydrate | ✅ 已实现 |
| **表未建、生产前建议** | idempotency_keys | P2 |
| **表/列可选** | orders 的 trip_end_at/snapshot_hash；users 的 email_verified_at；guide_slot；evidence_receipts；stakes | P1/P2 可选 |
| **产品落地方** | 治理域与 **Governance** 页完整对接；社区 **160** 审核/举报等增量 | 后续 |
| **接链后** | event_log, checkpoints_sharded, orders_projection, reconciliation_reports, correction_log, executor_executions | 接链时 |

**当前状态**：  
1. **P0**：itineraries、order_messages 双写 + hydrate 已实现。  
2. **可选**：补 orders/users 列、幂等策略（按缺口清单）。  
3. **TT 社区**：核心表与 API 已具备（有 DB 时）；强化项见 **160**。  
4. **Governance**：UI 占位与链上/治理产品节奏同步。

---

## 六、与现有文档的衔接

- **按页面查**：本文 **§一**。  
- **按业务逻辑查表**：[04-业务逻辑与数据库支持清单](spec/04-业务逻辑与数据库支持清单.md)。  
- **按功能查 UI↔API↔表**：[数据库表与UI功能对照检查](数据库表与UI功能对照检查.md)。  
- **缺口与补充项逐条勾选**：[数据库-缺口与需补充清单](数据库-缺口与需补充清单.md)。  
- **接库执行步骤**：[41-后端数据库接库与落地清单](spec/41-后端数据库接库与落地清单.md)。

---

*报告日期：按文档更新为准。与 04-数据库架构、04-业务逻辑与数据库支持清单、数据库表与UI功能对照检查、数据库-缺口与需补充清单、41-后端数据库接库与落地清单、13-1-UI产品级SSOT与页面规范 配套。*
