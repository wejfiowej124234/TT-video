# G23-02 · Fuzz & Invariant Suite

**Card ID:** `G23-02-fuzz-invariant`  
**Priority:** **3 / 4**  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Depends on:** **G23-01 merged**（batch 存在后 fuzz 覆盖 batch+单笔）  
**Blocks:** G23-04

---

## 1. 目标

用 fuzz / invariant 加固 **carriedLoss · split 守恒 · Unallocated 不丢失**；**不新增** 协议字段或 storage layout。

---

## 2. 范围（In）

| Test ID | 属性 |
|---------|------|
| **T-FUZ-01** | 随机 accrual 序列（单笔或 batch）→ close → fund → split · **sum 守恒** |
| **T-FUZ-02** | `carriedLoss` **不为负** · 仅 close 增 · split 路径减 applied |
| **T-INV-01** | post-fund pre-split：`ledger.balance >= netProfitPrime` |

### 验证重点（写死）

- `steward + unallocated + global == netProfitPrime`
- **Unallocated** 路径：ineligible 时 45% **进 vault** · 不 evaporate
- **S-02 remainder** 进 global · 不丢
- **Steward + Global + Remainder** 守恒

---

## 3. 范围（Out · 硬闸）

- 新合约功能 / 新 storage 字段
- `recordAccrualBatch` 实现（已在 G23-01）
- ABI export（→ G23-04）
- Funding Path 变更
- indexer · API · Sepolia

---

## 4. 预期改动面

| 文件 | 说明 |
|------|------|
| `contracts/test/CountryPoolNetProfitFuzz.t.sol` | **新文件** · `--match-contract CountryPoolNetProfitFuzz` |
| （可选）`contracts/test/CountryPoolNetProfitInvariant.t.sol` | T-INV-01 handler |

**禁止** 修改 `CountryPoolNetProfitLedger.sol` 行为（除非 fuzz 暴露 **bugfix** · 须单独说明 · 仍不算新字段）。

---

## 5. DoD

```bash
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract CountryPoolNetProfitFuzz
cd contracts && forge test --match-contract FeeRouterTest
# 若启用 invariant：
# forge test --match-contract CountryPoolNetProfitInvariant
```

| # | 检查项 | 状态 |
|---|--------|------|
| D1 | **T-FUZ-01** fuzz 默认 runs 绿 | ✅ |
| D2 | **T-FUZ-02** carriedLoss 单调 / 非负 | ✅ |
| D3 | **T-INV-01** invariant 绿（若实现） | ✅ |
| D4 | CountryPoolNetProfit 单元矩阵 **仍全绿** | ✅ |
| D5 | FeeRouterTest **10 passed** | ✅ |
| D6 | **无新增** protocol storage / 事件字段 | ✅ |

---

## 6. CI 建议

- 主 PR gate：`CountryPoolNetProfit` + `FeeRouterTest`
- Fuzz job：提高 `runs` / nightly · **不** 阻塞日常迭代时可 `runs=256` 本地 · CI `runs=512`

---

## 7. 签字

| 方 | 确认 | 签字 | 日期 |
|----|------|------|------|
| 工程 | DoD D1～D6 · fuzz 绿集 · 无合约/storage 变更 | ✅ **Sebastian Ward** | **2026-06-15** |

**证据：** [G23-02-FUZZ-INVARIANT-LOCAL-ACCEPTANCE.md](../../../evidence/GO_local_country_pool_net_profit_gate2.3/G23-02-FUZZ-INVARIANT-LOCAL-ACCEPTANCE.md)

**合并后：** 解锁 **G23-04**。
