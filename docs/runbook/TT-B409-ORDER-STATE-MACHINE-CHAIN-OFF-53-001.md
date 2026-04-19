# TT-B409 · 订单状态机（chain_off + 53 + API + 前端同源）

**ID**：`TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001`  
**母表**：[B-409](../任务母表.md)  
**状态**：已封口（2026-04-15）

---

## 1. 目的

在 **不新增任何 indexer / reconcile 观测键** 的前提下，把 **订单域状态机** 在以下四面钉成 **单一可解释 SSOT**：

| 面 | 含义 |
|----|------|
| **chain_off** | 内存/链下订单写路径：`Created → Accepted → Escrowed`（及 mock 支付）与链上事件回放 `Paid → Escrowed` 同源 |
| **53** | [docs/spec/53-阶段开发技术文档.md](../spec/53-阶段开发技术文档.md) 中订单/托管叙事与枚举、迁移一致 |
| **API** | `GET/POST …/orders*` 响应中的 **`state` / `status` / `sub_status` / `display_status`** 与域枚举对齐，列表与详情同一套规则 |
| **前端** | `/orders`、`/escrow/[id]`、`/pay` 等使用 **`orderStatusLabelKeyFromApiOrder`**（`display_status` 优先）与 API 同源 |

---

## 2. 硬边界（本卡必须遵守）

- **禁止**：在 `indexer_reconcile`、`admin/observability/overview`、或其它 reconcile 体中 **新增观测 JSON 键**（本卡与 revenue spread / bundle 类 obs **正交**）。
- **允许**：只使用 **已有** 订单与投影字段（含现有 `display_status`、`projection_terminal`、`accepted_at` 等）；**不**为「状态机说明」单独加列或新 API 字段，除非 04 契约轮另开 TT。
- **域 SSOT 代码锚**：`OrderState` 与合法迁移见 `crates/core/src/escrow.rs`；**唯一主状态写入口** **`transition_order`**（`crates/api/src/chain_off/order_transition.rs`）；链上事件 kind → 下一状态仍由 **`apply_escrow_event_kind_to_order_state`** 推导后再经 **`can_transition_to`** 硬闸（与 **`project_chain_event_onto_order`** 同源）。

### 2.1 失败回滚白名单（**不经** `transition_order`）

**DB 写入失败 / 争议行插入失败** 等场景下，允许 **`order.state = prev_state`** 或 **`store.orders.insert(order_id, order_before)`** 恢复内存，**不**计入「业务状态迁移」。登记点（须与代码同步）：

| 模块 | 行为 |
|------|------|
| `orders_flow/dispute_bilateral_rating`（开争议 strict / `insert_dispute` 失败） | 恢复 `prev_state` |
| `disputes`（`rollback_dispute_resolve_memory`） | 整单 `order_before` 插回 |
| `orders_flow/accept_cancel_pay_complete`（各 strict 双写失败） | 整单 `order_before` 插回 |

新增回滚点须先更新 **`order_transition.rs`** 模块顶注释与本表，再提 PR。

### 2.2 同源事实流审计（**`order_state_transition`**）

每次 **`transition_order` → `Applied`**，服务端 stderr 输出 **一行**（便于 `grep order_state_transition`）：

`order_state_transition order_id=<uuid> from=<snake> to=<snake> source=<api|reconcile_chain_event|dispute_resolve|system>`

- 与既有 **`audit_key_write op=…`**（HTTP 操作键）**互补**：本行只描述 **主状态边** 与来源面。
- **`TRAVELTRUST_ORDER_STATE_TRANSITION_STDERR=0`**：关闭上述行（索引器高频回放时可临时关闭）。

**验收脚本（仓库根）**：

| 脚本 | 含义 |
|------|------|
| `bash scripts/ops/b409-order-state-primary-acceptance.sh` | 主成功链：**HTTP** **`created→accepted→escrowed`** + **`p21_order_create_accept_mock_pay_confirm`**（至 **`completed`**） |
| `bash scripts/ops/b409-order-state-exception-acceptance.sh` | 异常链：当前锚 **`p21_order_cancel_created`**（**`created→cancelled`**） |

---

## 3. API 对齐点（验收时对照）

以下 **不新增字段名**，仅约定 **语义一致**；具体键名以 **`GET /api/v1/orders`**、**`GET /api/v1/orders/:id`** 实际 JSON 为准（与 `orders` 路由测试中的 B-097 等断言一致）。

| 域阶段 | `OrderState`（`snake_case` 序列化） | 对外常见 `status` 串（示例） | 说明 |
|--------|-------------------------------------|-------------------------------|------|
| 下单 | `created` | `created` | 旅行者已下单 |
| 接单 | `accepted` | `accepted` | 向导已接单；**`accepted_at`** 有值（若业务写入） |
| 托管 | `escrowed` | `escrowed` | 资金进托管；chain_off 下常由 **`order_mock_pay_impl`** 或链上 **`Paid`** 投影达成 |
| 展示 | — | **`display_status`**（若有） | 前端 **`orderDisplayStatusRaw`** 优先用投影 **`display_status`**，否则回落 **`state`/`status`**（见 `frontend/lib/orderProjectionDisplayStatus.ts`） |

**chain_off 自动化锚**：`crates/api/src/chain_off/tests_guides_me_orders.rs` 中 **`p21_order_create_accept_mock_pay_confirm`**：`status` 依次为 **`created` → `accepted` → `escrowed` → `completed`**（本卡主路径验收到 **`escrowed`** 即可）。

---

## 4. ≤8 文件实现清单（白名单）

实现时 **默认只改下列路径**（若实际修复点超出，须先改 TT 白名单或拆子卡）：

1. `crates/core/src/escrow.rs` — `OrderState`、`allowed_next_states` / `can_transition_to`
2. `crates/api/src/chain_off/order_transition.rs` + `crates/api/src/chain_off/reconcile.rs` — **`transition_order`**、**`apply_escrow_event_kind_to_order_state`**、**`project_chain_event_onto_order`**、审计 **`order_state_transition_*`**
3. `crates/api/src/chain_off/orders.rs` + `crates/api/src/chain_off/orders_flow/*.rs` — 订单创建/接单/mock 支付/取消/完成/争议等 **HTTP 实现层**（主状态须经 **`transition_order`**）
4. `crates/api/src/db/orders.rs`（或当前 **列表/详情** 组装订单行的唯一模块）— DB 路径下 **`state`/`status`** 与投影列一致
5. `crates/api/src/routes/orders/mod.rs` 或 `routes/orders/*.rs` — HTTP 层对 `order_get_impl` / list 的封装（仅当与 chain_off 分层边界需调整时）
6. `frontend/lib/orderStatusI18n.ts` — 状态文案键与 **`snake_case`** / API 串一致
7. `frontend/lib/orderProjectionDisplayStatus.ts` — **`display_status`** 优先策略不变前提下修歧义
8. `frontend/app/orders/page.tsx` 与/或 `frontend/app/escrow/[id]/page.tsx` — 列表/详情徽章 **`orderStatusLabelKeyFromApiOrder`** 同源

**04**：仅当需要 **契约句** 固化「合法迁移 / 字段语义」时，改 **`docs/spec/04-后端与API.md`** **§三**（或 §3.4 订单相关表），**须**与 `bash scripts/run-check-04-routes.sh` 一致；**不**在本卡扩写 07/00。

---

## 5. 验收路径（手测：创建订单 → Escrowed）

**前置**：API 以 **P3_CHAIN_OFF**（或等价）模式运行，使 **`/api/v1/orders`** 走 chain_off 订单实现（与本地 dev 脚本一致）。

1. **旅行者**：`POST /api/v1/orders` 创建订单 → 响应 **`order.status`**（或并行 **`state`**）为 **`created`**。
2. **向导**：`POST` 接单（现有路由，如 **`…/accept`** 或与集成测试同源路径）→ **`accepted`**，必要时确认 **`accepted_at`** 出现。
3. **旅行者**：触发 **mock 支付**（与 **`order_mock_pay_impl`** 对外的 **`POST`** 一致；权限与 trust 门禁按现有 90/53）→ **`escrowed`**。
4. **只读校验**：
   - `GET /api/v1/orders` 与 **`GET /api/v1/orders/:id`**：**`state`/`status`/`sub_status`/`display_status`** 与 **`escrowed`** 一致且无互斥文案。
   - 前端 **`/orders`**：徽章/文案与 **`orderStatusLabelKeyFromApiOrder`** 一致。

**自动化等价**：`cargo test -p traveltrust-api` 中 **`p21_order_create_accept_mock_pay_confirm`** 绿；必要时补 **routes/orders** 现有集成测试，**不**新开 obs 键测试。

---

## 6. 验收标准（关闭 TT 时）

- **`cargo test -p traveltrust-api`** 通过。
- **`bash scripts/run-check-04-routes.sh`** 通过（若触达 04 契约句）。
- 至少一条 **手测** 或 **集成测试** 路径：**created → accepted → escrowed**，且 API 与前端 **同源**（见 §3、§5）。
- **确认未** 向 `indexer_reconcile` / `admin/observability/overview` **新增**任何 **观测键**（diff 自检）。

---

## 7. 互证索引

- **from-stash 一览**：登记行见 [AI任务卡索引.from-stash.md](../AI任务卡索引.from-stash.md) **TT-B409**（**一览** **383** **·** **已封口**）。
- **spec**：[53-阶段开发技术文档.md](../spec/53-阶段开发技术文档.md)、[04-后端与API.md](../spec/04-后端与API.md) 订单/状态相关节。

---

## 8. 封口验收留痕（2026-04-15）

| 项 | 记录 |
|----|------|
| **硬边界** | **未** 向 `indexer_reconcile` / `admin/observability/overview` **新增**任何 **观测键**（本卡范围自检）。 |
| **实现摘要** | **`ChainOffConfig.order_mock_pay_enabled`**：**`ChainOffConfig::from_env()`** 与 **`P3_CHAIN_OFF=1`** 同源；**`POST …/orders/:id/mock-pay`** 以 **`co.config.order_mock_pay_enabled`** 为闸（**`crates/api/src/routes/orders/mutations.rs`**）。 |
| **自动化** | **`cargo test -p traveltrust-api`**：**`p21_order_create_accept_mock_pay_confirm`**、**`tt_b409_chain_off_http_order_created_accepted_escrowed`**；脚本 **`scripts/ops/b409-order-state-primary-acceptance.sh`** / **`b409-order-state-exception-acceptance.sh`**。 |
| **事实流** | stderr **`order_state_transition`**（**`Applied`**）；**`TRAVELTRUST_ORDER_STATE_TRANSITION_STDERR=0`** 可关闭；回滚白名单见 **§2.1**。 |
| **04** | 本封口批 **未** 改 **`docs/spec/04-后端与API.md`** 契约句（无 **§三** **diff** **义务**）。 |
| **索引 / 母表** | [AI任务卡索引.from-stash.md](../AI任务卡索引.from-stash.md) **一览** **383** **→** **已封口**；[任务母表.md](../任务母表.md) **B-409** **→** **已做**。 |

**备注**：全量 **`cargo test -p traveltrust-api`** 并行偶发与本卡无关的脆性用例时，可用 **`--test-threads=1`** **复验**（仓库既有现象，非本卡引入）。

---

## 9. 后续批次衔接（母表 **B-410～B-415**）

| 批次 | 依赖本卡（**B-409**）的要点 |
|------|------------------------------|
| **B-410** | 用户全链路 UI/API 只经 **`transition_order`** 成功路径；E2E 演示路径与 Runbook 对齐。 |
| **B-412** | 消费 **`order_state_transition`** / 同源事实流，落 **revenue** 可查与聚合校验。 |
| **B-413** | 订单状态与链上事件 / DB 投影 **零解释漂移**（与 **`SkippedDisallowed`** 观测衔接）。 |
| **B-415** | **FeeRouter** 权限、分配与治理在同源事实上收口。 |

（母表落地顺序以 [任务母表.md](../任务母表.md) **Revenue 主链路** 行为准，可与上表略有出入。）
