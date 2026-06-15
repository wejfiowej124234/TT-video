# G23-02 · Fuzz & Invariant — ① 本地验收

**Card:** `G23-02-fuzz-invariant`  
**Branch:** `feature/g23-02-fuzz-invariant`  
**Depends on:** G23-01 `recordAccrualBatch`  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Date:** 2026-06-15

---

## 1. 范围

| 项 | 结论 |
|----|------|
| **新增** | `contracts/test/CountryPoolNetProfitFuzz.t.sol` only |
| **合约** | **无** `CountryPoolNetProfitLedger.sol` 变更 |
| **storage / ABI / events** | **无** 新增或 breaking change |

---

## 2. 测试覆盖

| ID | 属性 |
|----|------|
| **T-FUZ-01** | 随机 accrual（single/batch）→ close → fund → split · split 总额守恒 · Unallocated/Global 不丢 |
| **T-FUZ-01b** | batch vs single accrual 等价 |
| **T-FUZ-02** | 3-epoch carriedLoss 非负 · close 路径 accounting |
| **T-INV-01** | post-fund pre-split：`ledger.balance >= netProfitPrime` |

---

## 3. Foundry（exit 0）

| Suite | Result |
|-------|--------|
| `CountryPoolNetProfitFuzz` | **4 passed** |
| `CountryPoolNetProfit` | **51 passed** |
| `FeeRouterTest` | **10 passed** |

**① 本地 fuzz 绿 ≠ ② Sepolia GO。**
