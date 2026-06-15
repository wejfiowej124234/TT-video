# G23-01 · recordAccrualBatch Implementation

**Card ID:** `G23-01-accrual-batch`  
**Priority:** **2 / 4**  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Depends on:** **G23-03 merged**（Funding Path FINAL）  
**Blocks:** G23-02 · G23-04

---

## 1. 目标

降低大 epoch 治理 calldata 成本；**不改变** DR-02 记账/现金分离 · **不修改** split 逻辑。

---

## 2. 范围（In）

| 项 | 规则 |
|----|------|
| **`recordAccrualBatch(epochId, lines[])`** | 新增 mutating · Timelock-only |
| **批大小** | `1 ≤ lines.length ≤ 32` |
| **原子性** | 任一行校验失败 → **整批 revert** |
| **事件** | 每行 emit **`NetProfitAccrued`**（与单笔相同 schema） |
| **ref** | 批内 + 历史 `accrualRefs` **全局唯一** |
| **token** | **禁止** batch 内任何 transfer |
| **Payload** | `CPNP_RECORD_ACCRUAL_BATCH` + `encodeRecordAccrualBatch` |
| **split** | **禁止** 修改 `closeEpoch` / `fundLedgerForSplit` / `splitNetProfit` |

### 提议 struct

```solidity
struct AccrualLine {
    bytes32 accountCode;
    int256 amountSigned;
    bytes32 ref;
}
```

---

## 3. 范围（Out · 硬闸）

- fuzz / invariant（→ G23-02）
- ABI manifest / `contracts/abi/` export（→ G23-04）
- Funding Path 语义变更（→ 须回 G23-03）
- indexer · API · DB
- Sepolia broadcast

---

## 4. 预期改动面

| 文件 | 改动 |
|------|------|
| `contracts/src/CountryPoolNetProfitLedger.sol` | `recordAccrualBatch` · internal 复用单笔校验 |
| `contracts/src/CountryPoolNetProfitGovernancePayload.sol` | selector + encode |
| `contracts/test/CountryPoolNetProfitLedger.t.sol` | T-BATCH-01～05 |
| `contracts/test/CountryPoolNetProfitGovernancePayload.t.sol` | batch selector parity |

---

## 5. DoD

```bash
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract FeeRouterTest
```

| # | 检查项 | 状态 |
|---|--------|------|
| D1 | **T-BATCH-01** 多行 R/E gross/expense 正确 | ☐ |
| D2 | **T-BATCH-02** 批内重复 ref revert | ☐ |
| D3 | **T-BATCH-03** 超 32 行 revert | ☐ |
| D4 | **T-BATCH-04** 空批 revert | ☐ |
| D5 | **T-BATCH-05** 混合合法行 + 一行非法 → 整批 revert · 状态不变 | ☐ |
| D6 | **T-BATCH-06** batch 不移动 token balance | ☐ |
| D7 | Payload selector parity | ☐ |
| D8 | CountryPoolNetProfit **全量绿** · FeeRouterTest **10 passed** | ☐ |
| D9 | **ABI 无 breaking change**（仅 **新增** 函数 · 事件不变） | ☐ |

---

## 6. 治理

- 提案前缀 **`[D-4555-B]`** · **禁止** 与 D-4555-A / FUNDRAISE 同批（G-03）
- Timelock batch 序列仍允许：`setActiveStewardConfig` → `fundLedgerForSplit` → `splitNetProfit`

---

## 7. 签字

| 方 | 确认 | 签字 | 日期 |
|----|------|------|------|
| 产品 | 32 行/tx SLA | ☐ | |
| 财务 | 一行一 ref ↔ GL | ☐ | |
| 工程 | DoD D1～D9 | ☐ | |

**合并后：** 解锁 **G23-02**。
