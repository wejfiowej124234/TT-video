# B-094 / B-103 / B-123 · `executeResolution` 三终态 Fixture 证据 SSOT

**锚点**：**`TT-B103-RESOLUTION-FIXTURES-ONEPAGE-SSOT-001`**（**B-103** 收口 · 下方 **§0** 一页主表）· **`TT-EVIDENCE-B094-RESOLUTION-FIXTURES-SSOT-001`**（**B-094** 全量叙事与 TT-9 取证）· **`TT-B123-RESOLUTION-FIXTURES-ENTRY-001`**（**B-123** 证入口指针 · [`B-123-resolution-fixtures-ENTRY.md`](./B-123-resolution-fixtures-ENTRY.md)）· 母表 **B-094 / B-103 / B-123** 验收 **单文件勾选** 指向本文 **§0**。  
**主从关系**：本文档为 **唯一 SSOT**（三态合一、不可与「从文档」并行增删字段而不改本文）。**从文档**：[`evidence/B-094-execute-resolution-fixtures.md`](../../evidence/B-094-execute-resolution-fixtures.md) — 仅入口，**禁止**第二套三态表或余额/投影句。

**关联**：[`docs/verification-evidence-pack.md`](../verification-evidence-pack.md) **§1.2**（`orders_projection` vs `GET /orders/:id` 英文规范句）· **TT-9** [`tt-09-b094-resolution-indexer.json`](tt-09-b094-resolution-indexer.json)。

**B-096 对读**：链下 **`resolution_outbox`** / **`process-resolution-outbox`** 所消费 **`executeResolution`** 三腿与投影细分态，与 **`crates/api/src/chain/resolution_tx.rs`** **`orders_projection_status_from_resolution_input`**（同源 **`traveltrust_core::terminal_order_state_from_resolution_amounts`**）一致；见 **`crates/api/src/chain_off/disputes.rs`** **`TT-B096-RESOLUTION-OUTBOX-PROCESS-PROJECTION-CHAIN-001`** 注释。

---

## 0. 三终态一页收敛表（B-103 / B-123 · **唯一主表**）

**`TT-B103-RESOLUTION-FIXTURES-ONEPAGE-SSOT-001`**：下列列与工程 **字段命名** 一致 — DB / API 投影列 **`orders_projection.status`** 为小写 snake；**`resolution_type`** 为事件解析路径写入时的 **`ResolutionExecuted`**；三腿金额与 **`contracts/test/Escrow.t.sol`** 模板及 **`crates/api/src/chain/resolution_tx.rs`** 单测 **`b094_templates_map_to_projection_status`**（`TOTAL = 1_000_000_000` wei，即 **1000e6** mock 精度）对齐。

| `orders_projection.status` | Foundry（`Escrow.t.sol`） | `guideAmount` · `travelerRefund` · `platformFee`（wei） | **仓库固定 tx hash**（**chainId 31337**） | **余额摘要**（mock **6** dec：单位 **e6**；执行后 **`token.balanceOf(escrow)` → 0**） | `resolution_type` | **`completed_at_block`**（样例） | **`order_id`**（投影 **16-byte UUID** 十六进制列 · 样例/规则） |
|----------------------------|---------------------------|---------------------------------------------------------|--------------------------------------------|------------------------------------------------------------------------------------------------------------------|---------------------|-----------------------------------|------------------------------------------------------------------|
| **`refunded`** | `test_B094_executeResolution_refunded_full_traveler` · `orderId = keccak256("b094-refund")` | **0** · **1_000_000_000** · **0** | **无**（仅 **forge** 闭环；补钉真 tx **单点** 更新 **§3.1** 或 evidence bundle） | 游客 **+1000e6**；向导/平台 **不变** | **`ResolutionExecuted`** | 有则填执行块；否则 **NULL**（以迁移/handler 为准） | 与 **`orders.id`** 按 indexer 规则映射之 **32-byte** 投影键（**§3.1**） |
| **`partially_refunded`** | `test_B094_executeResolution_partially_refunded_split` · `orderId = keccak256("b094-partial")` | **300_000_000** · **650_000_000** · **50_000_000** | **`0x11841400150ad0a9668a50652dca2d91c953ee50e230a601a6c1de777b2cb75c`**（[`rpc-tt9-eth-getTransactionByHash-resolution-input.json`](rpc-tt9-eth-getTransactionByHash-resolution-input.json) **`result.hash`**） | 向导 **+300e6**、游客 **+650e6**、平台 **+50e6** | **`ResolutionExecuted`** | **`6`**（[`sql-tt9-orders-projection-b094.txt`](sql-tt9-orders-projection-b094.txt)） | **`0000000000000000000000000000000033333333333343338333333333333301`**（TT-9 seed / SQL 导出一致） |
| **`slashed`** | `test_B094_executeResolution_slashed_guide_zero_platform_fee` · `orderId = keccak256("b094-slash")` | **0** · **800_000_000** · **200_000_000** | **无**（策略同 **refunded**；补钉 **§3.3**） | 游客 **+800e6**、平台 **+200e6**、向导 **不变** | **`ResolutionExecuted`** | 同 **refunded** 列规则 | 同 **refunded** 列规则 |

**HTTP / SQL 锚点（仅 `partially_refunded` 行已全链路透）**：[`http-post-indexer-replay-tt9-b094-chain31337.json`](http-post-indexer-replay-tt9-b094-chain31337.json)、[`http-get-order-tt9-b094-after-projection.json`](http-get-order-tt9-b094-after-projection.json)、[`sql-tt9-insert-event-log-resolution-b094.sql`](sql-tt9-insert-event-log-resolution-b094.sql)。**§1～§5** 为扩写与门禁句，数值/字段 **以上表为准**。

---

## 1. 验证分层（仍适用）

| 层 | 工程落点 | 说明 |
|----|----------|------|
| 链上逻辑与余额 | Foundry `contracts/test/Escrow.t.sol` — `test_B094_executeResolution_*` | 本地 `forge test`；**无**全局固定 **tx hash**（除非另行按 §3 钉死快照）。 |
| 订单域终态映射 | `traveltrust_core::terminal_order_state_from_resolution_amounts` · 单测 `b094_resolution_amounts_match_escrow_templates` | 三腿金额 → **`Refunded` / `PartiallyRefunded` / `Slashed`**。 |
| 索引 / 投影 | `event_log` `ResolutionExecuted` → `indexer-replay` → **`orders_projection`** | **PartiallyRefunded** 行见 §3.2 固定 **tx** 与 SQL 证据；**Refunded / Slashed** 仓库内 **无** 与 TT-9 同级的 pinned **Anvil tx** 文件时，以 **Foundry** 为金额与终态 SSOT，链上重放验收时 **补写 tx** 至运维台账并 **回链** 本文（避免双源）。 |

**常量**：三模板 **`totalAmount = 1_000_000_000` wei**（即 **1000e6** mock 精度），与 `Escrow.t.sol` **`TOTAL`** 一致。

---

## 2. 三态总表（金额 · 域状态 · 合约态）

与 **§0** 主表 **同一套三腿**；本节强调 **Solidity / core `OrderState`** 对读。

| 模板 | `guideAmount` | `travelerRefund` | `platformFee` | 订单域 `OrderState` | 链上 `Escrow.status`（Solidity） |
|------|---------------|------------------|---------------|---------------------|----------------------------------|
| 全额退游客 | 0 | 1_000_000_000 | 0 | `Refunded` | `Resolved` |
| 双收（部分退） | 300_000_000 | 650_000_000 | 50_000_000 | `PartiallyRefunded` | `Resolved` |
| 向导 0 + 平台费（扣罚语义） | 0 | 800_000_000 | 200_000_000 | `Slashed` | `Resolved` |

---

## 3. 分态证据：tx · 地址 · 余额摘要 · `orders_projection`

### 3.1 `Refunded`（全额退游客）

| 项 | 内容 |
|----|------|
| **Foundry** | `test_B094_executeResolution_refunded_full_traveler` · `orderId = keccak256("b094-refund")` |
| **Tx hash（仓库固定快照）** | **无**（当前仅 **forge** 闭环）；主网/测试网验收时 **将真实 tx 记入运维 evidence bundle**，并在 PR/台账 **单点** 更新本节或指向 bundle，**勿**在 `evidence/B-094-execute-resolution-fixtures.md` 另写一套。 |
| **关键地址（测试内）** | **`traveler` / `guide` / `platformFeeRecipient`**：`Escrow.t.sol` 用 `makeAddr`；**`escrowAddr`**：`factory.createEscrow` 部署实例；**`token`**：Mock ERC20。 |
| **余额摘要（`executeResolution(0, TOTAL, 0)` 前后）** | 游客 **`+TOTAL`**；向导、平台 **不变**；**`token.balanceOf(escrowAddr)`**：`TOTAL` → **`0`**。 |
| **`orders_projection` 期望** | **`status`**=`refunded` · **`resolution_type`**=`ResolutionExecuted`（由 **`ResolutionExecuted`** 事件解析路径写入时）· **`completed_at_block`**= 链上执行块（有则填）· **`order_id`**= 业务订单 UUID 对应之 **32-byte** 投影键（与 indexer 规则一致）。 |

### 3.2 `PartiallyRefunded`（双收 300 / 650 / 50）— **仓库已钉死快照**

| 项 | 内容 |
|----|------|
| **Foundry** | `test_B094_executeResolution_partially_refunded_split` · `orderId = keccak256("b094-partial")` |
| **Tx hash** | **`0x11841400150ad0a9668a50652dca2d91c953ee50e230a601a6c1de777b2cb75c`**（**chainId `31337`**；见 [`rpc-tt9-eth-getTransactionByHash-resolution-input.json`](rpc-tt9-eth-getTransactionByHash-resolution-input.json) **`result.hash`**） |
| **Block** | **`blockNumber` `0x6`** · **`blockHash`** `0x83391671a06764feb9bbe231ebe7cc6144a44ecf1115f1768488543de731c625`（同上 RPC 快照） |
| **说明** | RPC 样例中 **`to`** 为 **`0x…dead`**（**calldata / input 演示**用）；**DB 证据**以 [`sql-tt9-insert-event-log-resolution-b094.sql`](sql-tt9-insert-event-log-resolution-b094.sql) 写入之 **`tx_hash` / `block_number` / `block_hash`** 与上表 **一致** 为 SSOT。 |
| **关键地址（TT-9 业务订单侧）** | 业务订单 UUID **`33333333-3333-4333-8333-333333333301`**（seed SQL）；投影 **`order_id`** 见 [`sql-tt9-orders-projection-b094.txt`](sql-tt9-orders-projection-b094.txt)。链上 **`from`** 样例：`0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`（Anvil 默认账户，见 RPC JSON）。 |
| **余额摘要（与 calldata 三腿一致）** | 向导 **`+300e6`**、游客 **`+650e6`**、平台 **`+50e6`**；合约余额 **`→ 0`**（Foundry 断言同逻辑）。 |
| **`orders_projection` 期望（已验证 SQL 导出）** | **`status`**=`partially_refunded` · **`resolution_type`**=`ResolutionExecuted` · **`completed_at_block`**=`6` · **`order_id`**=`0000000000000000000000000000000033333333333343338333333333333301`（见 [`sql-tt9-orders-projection-b094.txt`](sql-tt9-orders-projection-b094.txt)） |

**HTTP / 复验 JSON**：[`http-post-indexer-replay-tt9-b094-chain31337.json`](http-post-indexer-replay-tt9-b094-chain31337.json)、[`http-get-order-tt9-b094-after-projection.json`](http-get-order-tt9-b094-after-projection.json)（与 TT-9 记录一致）。

### 3.3 `Slashed`（向导 0 + 平台费 200e6）

| 项 | 内容 |
|----|------|
| **Foundry** | `test_B094_executeResolution_slashed_guide_zero_platform_fee` · `orderId = keccak256("b094-slash")` |
| **Tx hash（仓库固定快照）** | **无**（与 §3.1 相同策略；验收补 tx 时 **单点** 更新本文或 bundle）。 |
| **关键地址** | 同 §3.1 角色集合；**`escrowAddr`** 为对应实例。 |
| **余额摘要（`executeResolution(0, 800e6, 200e6)` 前后）** | 游客 **`+800e6`**；平台 **`+200e6`**；向导 **不变**；**`token.balanceOf(escrowAddr)`**：`TOTAL` → **`0`**。 |
| **`orders_projection` 期望** | **`status`**=`slashed` · **`resolution_type`**=`ResolutionExecuted` · **`completed_at_block`** / **`order_id`** 口径同 §3.1。 |

---

## 4. `orders_projection` 字段口径（三态共用）

写入/展示以 indexer 与 `crates/api` 投影层为准；**验收勾选**至少核对：

- **`status`**：`refunded` \| `partially_refunded` \| `slashed`（小写字符串，与 DB 一致）
- **`resolution_type`**：解析自 **`ResolutionExecuted`** 路径时为 **`ResolutionExecuted`**
- **`completed_at_block`**：链上执行所在块（整数；无则 **NULL**，以迁移与 handler 为准）
- **`order_id`**：与业务 **`orders.id`** 对应的 **16-byte** UUID 投影表示（见各态 SQL / 测试）
- **`updated_at`**：投影行更新时间（审计用）

**API 对读**：**`GET /api/v1/orders/:id`** 业务 **`orders.state`** 与投影 **`display_status` / `projection_terminal`**（**B-097**）可能不一致；**终态裁决 SSOT** 以 **`orders_projection`** 为准 — **verification-evidence-pack §1.2**。

---

## 5. 母表验收勾选（单行）

**B-094 / B-103**：三种终态 **fixture 证据**（**tx / 地址 / 前后余额摘要 / `orders_projection` 期望字段**）以 **本文档** 为唯一 SSOT；**§0** 为 **B-103** 一页收敛主表；**从文档**仅入口，不承载第二叙事。
