# 数据库表与 UI 功能对照检查

**目的**：检查：① 现有迁移表是否齐全；② 接上 PostgreSQL/分布式 DB（`DATABASE_URL`）后是否满足当前 UI 页面的功能。**业务逻辑与所需数据库**的逐条对应见 [04-业务逻辑与数据库支持清单](spec/04-业务逻辑与数据库支持清单.md)。**TT 社区**：有 DB 时走 `/api/v1/community/*`（见 **04 §3.4**）；无 DB 时部分能力降级。**`/` · `/market` 四页 FE 数据链**（**`useMarketPage` debounce** · **`landingItinerarySession` = `localStorage`** · 收藏 **`localStorage` + F-020 best-effort** → **②** SLA）见 **[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** — **本表仅列 HTTP↔DB**，**不**含浏览器 **`localStorage`** 收藏/预览态。

**依据**：`crates/api/migrations/*.sql`、`crates/api/src/db.rs`、[04-后端与API](spec/04-后端与API.md)、[04-附录-DDL草案](spec/04-附录-DDL草案.md)、[04-业务逻辑与数据库支持清单](spec/04-业务逻辑与数据库支持清单.md)、[数据库与UI-全方位多维度深度检查报告](../数据库与UI-全方位多维度深度检查报告.md)（按路由逐项）。

---

## 一、当前已有迁移表（`crates/api/migrations/` 共 **21** 支；下表节选）

| 迁移文件 | 表名 | 用途 | 双写/hydrate |
|----------|------|------|--------------|
| 20250228000001 | users | 用户（注册、登录、me） | 注册/登录双写；启动 hydrate |
| 20250228000001 | sessions | 登录态 token→user_id | 注册/登录双写；启动 hydrate |
| 20250228000002 | guides | 向导信息、资质、质押 | 向导注册/更新双写；启动 hydrate |
| 20250228000003 | orders | 订单及状态、托管地址、时间戳 | 创建/状态变更双写；启动 hydrate |
| 20250228000004 | reviews | 订单评价 | 提交评价双写；启动 hydrate |
| 20250228000004 | disputes | 争议及裁决结果 | 发起争议/裁决双写；启动 hydrate |
| 20250228000005 | (ALTER guides) | guide_license_url | 向导证 URL，无单独表 |
| 20250228000006 | itineraries | 行程包（P15/17） | ✅ db 双写 + hydrate |
| 20250228000007 | order_messages | 订单聊天（P16） | ✅ db 双写 + hydrate |
| 20250304000009 | evidence_receipts | 证据回执（可选路径） | 按 API/产品 |
| 20250305000010 | governance_pool 等 | 治理池与奖励记录 | 读 DB |
| 20250306000011 | community_* 等 | TT 社区关系/会话基础 | `routes/community.rs` |
| 20250307000012 | community_posts 等 | Feed、发帖、评论、点赞 | 同上 |
| 20250308000013 | idempotency_keys | API 幂等（55-S8） | 中间件 + 有 DB 时落表 |
| 20250310000016 | community_feedback | 社区反馈（55-S10） | API 已对接 |

**结论**：与 04 附录 / **04-业务逻辑** 汇总一致；接上 `DATABASE_URL` 并执行**全部**迁移后，订单域、行程/聊天、**社区核心**、治理池读、幂等表等均可按实现生效。完整列表见 [数据库与UI-全方位多维度深度检查报告](数据库与UI-全方位多维度深度检查报告.md) §2.1。

---

## 二、UI 功能与 API/表 逐项对照

前端通过 `frontend/lib/api.ts`、`apiClient.ts` 调用的接口与后端使用的表/内存 Store 对应关系如下。

| UI 功能 | API 路由 | 数据来源 | 表/持久化 | 是否满足 |
|--------|----------|----------|-----------|----------|
| 注册 / 登录 | POST auth/register, login | users + sessions | users, sessions | ✅ 满足 |
| 个人中心 / 修改资料 / 改密 | GET/PUT /api/v1/me, me/password | users | users | ✅ 满足 |
| 个人统计 | GET /api/v1/me/stats | 由 orders/reviews 聚合 | orders, reviews | ✅ 满足 |
| 向导列表 / 筛选 | GET /api/v1/guides | guides | guides | ✅ 满足 |
| 向导详情 | GET /api/v1/guides/:id | guides | guides | ✅ 满足 |
| 向导注册 / 证件上传 / 质押 | POST guides, upload-doc, stake | guides + 文件 data/guide_uploads | guides；上传为文件系统 | ✅ 满足 |
| 创建订单 | POST /api/v1/orders | orders | orders | ✅ 满足 |
| 我的订单列表 | GET /api/v1/orders | orders | orders | ✅ 满足 |
| 接单 / 取消 / 确认完成 | POST accept, cancel, confirm-completion | orders | orders | ✅ 满足 |
| 自由市场可浏览订单列表 | GET /api/v1/discover/orders（主 UI **`/market`** · **`useMarketPage`** **300ms debounce**；**`/discover`** 重定向） | orders | orders | ✅ 满足 |
| 订单评价列表 / 提交评价 | GET/POST /api/v1/orders/:id/reviews | reviews | reviews | ✅ 满足 |
| 发起争议 / 争议列表 / 裁决 | POST dispute; GET disputes, GET/POST resolve | disputes | disputes | ✅ 满足 |
| 订单证据 | GET/POST /api/v1/orders/:id/evidence | chain_off 内存 + disputes.evidence_hashes | disputes 存 hash；文件/链下 receipt 另存 | ✅ 满足（当前实现） |
| **行程生成（P15）** | POST /api/v1/itineraries | chain_off + db 双写 | itineraries（迁移 000006） | ✅ 满足 |
| **订单聊天（P16）** | GET/POST /api/v1/orders/:id/messages | chain_off + db 双写 | order_messages（迁移 000007） | ✅ 满足 |
| DID 排行榜 | GET /api/v1/did-rank/travelers|guides | 可由 orders/reviews 聚合或 stub | 无专用表，可满足 | ✅ 满足 |
| 确认最终方案 / 设置托管地址 | POST confirm-final-plan, set-escrow-address | orders | orders | ✅ 满足 |

**小结**：  
- **接上 DB 后**，登录、个人中心、向导、订单、**自由市场（`/market`；`/discover` 重定向）**、评价、争议、证据（当前形态）、DID 排行、确认最终方案与设置托管地址、**行程、订单聊天** 等 **均有对应表且双写/hydrate 已实现**，能满足 UI。

---

## 三、UI 功能需数据库清单（全量）

以下覆盖前端**所有**涉及数据的页面与能力；凡「需持久化」且「有后端 API」的，均需对应表或聚合来源。

| # | UI 功能 | 页面/入口 | API | 需 DB？ | 表/来源 | 状态 |
|---|--------|-----------|-----|--------|--------|------|
| 1 | 注册 / 登录 / 登出 / 刷新 | /auth/* | auth.register, login, logout, refresh | 是 | users, sessions | ✅ 已有表与双写 |
| 2 | 邮箱验证 / 忘记密码 / 重置密码 | /auth/verify-email, forgot-password, reset-password | auth.verifyEmail, forgotPassword, resetPassword | 是 | users, sessions | ✅ 已有表（实现为 stub 时也落 users） |
| 3 | 个人中心 | /me | GET/PUT /api/v1/me | 是 | users | ✅ 已有 |
| 4 | 个人统计 | /me | GET /api/v1/me/stats | 是 | orders, reviews 聚合 | ✅ 已有 |
| 5 | 修改密码 | /me/password | PUT /api/v1/me/password | 是 | users | ✅ 已有 |
| 6 | 向导列表 / 筛选 | /guides, /market | GET /api/v1/guides | 是 | guides | ✅ 已有 |
| 7 | 向导详情 | /guides/[id] | GET /api/v1/guides/:id | 是 | guides | ✅ 已有 |
| 8 | 向导注册 / 证件上传 / 质押 | /guide/register | POST guides, upload-doc, stake | 是 | guides + 文件系统 | ✅ 已有 |
| 9 | 行程生成 | /itinerary/new | POST /api/v1/itineraries | 是 | itineraries | ✅ 已有表与双写 + hydrate |
| 10 | 自由市场可浏览订单列表 | **`/market`**（**`/discover`** 仅重定向；**`useMarketPage`** · **debounce**） | GET /api/v1/discover/orders | 是 | orders | ✅ 已有 |
| 11 | 创建订单 / 我的订单 | /orders, /orders/new | GET/POST /api/v1/orders, orderById | 是 | orders | ✅ 已有 |
| 12 | 接单 / 取消 / 确认完成 | EscrowDetail、订单流 | accept, cancel, confirm-completion | 是 | orders | ✅ 已有 |
| 13 | 确认最终方案 / 设置托管地址 | EscrowDetail | confirm-final-plan, set-escrow-address | 是 | orders | ✅ 已有 |
| 14 | 订单聊天 | EscrowDetail | GET/POST /api/v1/orders/:id/messages | 是 | order_messages | ✅ 已有表与双写 + hydrate |
| 15 | 订单评价列表 / 提交评价 | EscrowDetail、订单详情 | GET/POST /api/v1/orders/:id/reviews | 是 | reviews | ✅ 已有 |
| 16 | 发起争议 / 争议列表 / 详情 / 裁决 | /disputes, /disputes/[id] | dispute, GET disputes, disputeById, resolve | 是 | disputes | ✅ 已有 |
| 17 | 订单证据 | EscrowDetail | GET/POST /api/v1/orders/:id/evidence | 是 | disputes.evidence_hashes + 链下 receipt | ✅ 已有 |
| 18 | DID 排行榜 | /did-rank | GET did-rank/travelers, did-rank/guides | 可聚合 | orders + reviews 或 stub | ✅ 无专用表可满足 |
| 19 | **TT社区**（Feed/发帖/点赞/评论/收藏/关注/私信） | /community 及子路由 | `GET/POST /api/v1/community/*`（见 04 §3.4） | 有 DB 时需 `DATABASE_URL` | community_posts、community_*、community_feedback 等 | ⚠ **有 DB 时** ✅；无 DB 时降级；审核/举报全链路见 **160** |
| 20 | **Governance**（参数/提案/投票） | /governance | `GET /api/v1/governance/pool`、`/rewards` 等（读池/奖励） | UI 页仍多占位 | governance_pool、governance_reward_records | ⚠ 池/奖励表与读 API ✅；**提案/投票** UI 与完整治理 API 仍待产品 |
| 21 | 帮助 / 条款 / 隐私 | /help, /terms, /privacy | 静态或 CMS | 否 | — | ✅ 无需表 |
| 22 | 元数据 / 版本校验 | 全局 | GET /meta | 否（配置） | — | ✅ 无需表 |

**结论**：  
- **#1～#18、#21～#22**：均有表且双写/hydrate 已实现，或无需表/可聚合。  
- **#19 TT社区**：核心表与 API 已具备（有 DB 时）；**#20 Governance**：池/奖励已落库可读，**治理页完整产品流**仍待迭代。详见 **04-附录-前端与后端数据职责**、**160**。

---

## 四、与 04 附录 DDL 草案的差异（可选补齐）

- **orders**：草案中有 `trip_end_at`、`snapshot_hash`，当前迁移未加；若 04 后续要求对账/审计可补列。  
- **itineraries** / **order_messages**：迁移 **000006** / **000007** 已建；**`db.rs` 双写 + main hydrate 已实现**（与 04-业务逻辑、55 一致）。

---

## 五、分布式数据库兼容性（PostgreSQL / CockroachDB）

当前迁移与 `db.rs` 所用 SQL 情况：

- **类型**：UUID, TEXT, TIMESTAMPTZ, JSONB, SMALLINT, NUMERIC, BOOLEAN — PostgreSQL / CockroachDB 均支持。  
- **约束**：PRIMARY KEY, UNIQUE, REFERENCES, ON DELETE CASCADE — 通用。  
- **函数**：`gen_random_uuid()`, `now()` — 两者均支持。  
- **索引**：普通列索引、`LOWER(email)` 表达式索引 — 均支持。  
- **UPSERT**：`ON CONFLICT (id) DO NOTHING` / `DO UPDATE SET ...` — 均支持。

**结论**：现有 5 个迁移与当前业务 SQL **满足 PostgreSQL 与 CockroachDB（及常见分布式 SQL）**；未使用仅 PG 独有的语法或锁，便于后续使用分布式 DB。

---

## 六、总结与建议

| 项目 | 结论 |
|------|------|
| 表是否齐全（相对 04 §9 业务表） | ✅ 用户/会话/向导/订单/评价/争议 表齐全，与 DDL 草案一致。 |
| DB 是否满足 UI 全部功能 | ✅ 核心域满足；**TT 社区** 有 DB 时持久化（见 #19）；**Governance 页** 完整流程仍部分占位（见 #20）。 |
| 分布式 DB 是否满足 | ✅ 当前 DDL 与 SQL 适用于 PostgreSQL / CockroachDB，无专有依赖。 |

**建议**：  
1. **接库**：设置 `DATABASE_URL`，执行 **`crates/api/migrations/` 下全部**迁移；订单/向导/行程/聊天/社区核心/幂等等按实现生效。  
2. **TT 社区强化**（审核、举报工单、媒体规模化）：见 **160**、**31**。  
3. **Governance 完整页**：提案/投票等与产品节奏同步 **04**、**13-1**。

未配置 `DATABASE_URL` 时：内存 Store 仍可用，但重启丢数据、社区等依赖 DB 的能力不可用或降级。

**开工前全方位对照**：按**每个页面、每个功能**逐项核对「路由 → API → 表」及缺口，见 [数据库与UI-全方位多维度深度检查报告](数据库与UI-全方位多维度深度检查报告.md)。
