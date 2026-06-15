# G23-03 · Funding Path Finalization

**Card ID:** `G23-03-funding-path`  
**Priority:** **1 / 4**（须最先 merge）  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Depends on:** Gate-2.2 merged（`76aff11c`）  
**Blocks:** G23-01 · G23-02 · G23-04

---

## 1. 目标

冻结 **Pilot 默认资金归集路径**（Allowance vs Treasury.spend）、**财务映射** 与 **`LedgerFundedForSplit` 语义**，避免后续 batch / ABI / Gate-2.4 反复返工。

---

## 2. 范围（In）

| 项 | 说明 |
|----|------|
| **路径 A · Allowance** | `fundingSource` pre-approve → `fundLedgerForSplit` `transferFrom`（`76aff11c` 现状） |
| **路径 B · Treasury.spend** | Timelock `GovernanceTreasury.spend(ledger, amount)` 先于 fund（Runbook 文档化） |
| **定案** | 产品 + 财务 **书面** 选定 **② pilot 默认**（A 或 B） |
| **① Pilot 默认（2026-06-15）** | **路径 A · Allowance** — 见 Architecture **§7.4.1 FUNDING_PATH_FINAL** |
| **Foundry** | **T-FND-05** · **T-FND-06**（选定路径 + 负向） |
| **文档** | Architecture Package §7.4 · mapping-matrix **`LedgerFundedForSplit.amount`** 语义 **FINAL** |

### `LedgerFundedForSplit` 语义（冻结）

| 字段 | 定案 |
|------|------|
| `amount` | 本次 **`transferFrom` 实际 pull 量**；若 ledger 已 `balance >= netProfitPrime` 则为 **0** |
| `fundingSource` | calldata 中的 pull 来源地址 |
| indexer 对账键 | `{chain_id, jurisdiction, epoch_id, tx_hash}` + `amount` |

---

## 3. 范围（Out · 硬闸）

- `recordAccrualBatch`（→ G23-01）
- fuzz / invariant（→ G23-02）
- ABI export / Topic0 manifest（→ G23-04）
- 修改 `splitNetProfit` / 45/55 bps
- Sepolia broadcast · staging

---

## 4. 预期改动面

| 路径 | 文件 |
|------|------|
| 合约（若 B 需 helper 或 NatSpec  only） | `contracts/src/CountryPoolNetProfitLedger.sol`（**最小**） |
| 测试 | `contracts/test/CountryPoolNetProfitLedger.t.sol`（T-FND-05/06） |
| 文档 | `country-pool-settlement-architecture-package-v1.md` §7.4 **FINAL** 段 · `country-pool-accounting-mapping-matrix-v1.md` fund 行 |

**若选定 A 且无需代码变更：** 本 PR **以测试 + 文档 FINAL 为主**。

---

## 5. DoD（合并前 exit 0）

```bash
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract FeeRouterTest
```

| # | 检查项 | 状态 |
|---|--------|------|
| D1 | **T-FND-05** 选定路径 happy path | ✅ |
| D2 | **T-FND-06** 负向（allowance 不足 / 未 fund 不能 split） | ✅ |
| D5 | Architecture §7.4.1 标记 **Funding Path FINAL**（Path A） | ✅ |
| D6 | CountryPoolNetProfit **41 passed** · FeeRouterTest **10 passed** | ✅ |

---

## 6. T-FND-05 / T-FND-06 测试意图

| ID | 场景 |
|----|------|
| **T-FND-05** | close → **选定路径** fund → `epochFunded` · balance ≥ `netProfitPrime` · `LedgerFundedForSplit.amount` 正确 |
| **T-FND-06** | 负向：revoke allowance / 余额不足 → fund revert **或** split `InsufficientLedgerBalance`（与语义一致） |

---

## 7. 签字

| 方 | 确认 | 签字 | 日期 |
|----|------|------|------|
| 产品 | Pilot 默认路径 | ☐ | |
| 财务 | 映射 + amount 语义 | ☐ | |
| 工程 | DoD D1～D7 | ☐ | |

**合并后：** 解锁 **G23-01** 开 PR。
