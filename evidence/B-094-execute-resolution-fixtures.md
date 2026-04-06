# B-094 · `executeResolution` 三终态模板（fixture 报告）

**母表**：`docs/任务母表.md` **B-094**  
**TT**：`TT-ESCROW-EXECUTE-RESOLUTION-B094-001`

## 验证方式

- **链上逻辑与余额**：**Foundry** `contracts/test/Escrow.t.sol` — **`test_B094_executeResolution_*`**（本地/sim 无独立 **tx hash**；CI 与 `forge test` 同源）。
- **订单域终态映射**：**Rust** `traveltrust_core::terminal_order_state_from_resolution_amounts` + 单测 **`b094_resolution_amounts_match_escrow_templates`**。

## 三模板（`totalAmount = 1_000_000_000` wei，即 1000e6 mock 精度）

| 模板 | `guideAmount` | `travelerRefund` | `platformFee` | 订单域 `OrderState`（core） | 链上 `Escrow.status`（Solidity） |
|------|---------------|------------------|---------------|-----------------------------|----------------------------------|
| 全额退游客 | 0 | 1_000_000_000 | 0 | `Refunded` | `Resolved` |
| 双收（部分退） | 300_000_000 | 650_000_000 | 50_000_000 | `PartiallyRefunded` | `Resolved` |
| 向导 0 + 平台费（扣罚语义） | 0 | 800_000_000 | 200_000_000 | `Slashed` | `Resolved` |

## 余额差（每笔交易前后）

各测试中在 **`executeResolution`** 前后对 **`token.balanceOf`** 断言：

- **模板 1**：游客 `+total`；向导、平台、合约 **不变 / 归零**（合约由 `total` → `0`）。
- **模板 2**：向导 `+g`、游客 `+t`、平台 `+p`；合约 `0`。
- **模板 3**：游客 `+t`、平台 `+p`；向导不变；合约 `0`。

## 真实环境 tx hash（可选）

在 **Anvil / 测试网 / 主网** 由执行器发送 **`executeResolution`** 后，将 **tx hash**、**区块**、上表三腿与 **`eth_getTransactionReceipt` + 余额差** 附录于此文件或运维台账即可闭合母表「tx hash + 前后余额」验收。
