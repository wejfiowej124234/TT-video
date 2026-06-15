# G23-01 · recordAccrualBatch — ① 本地验收

**Card:** `G23-01-accrual-batch`  
**Branch:** `feature/g23-01-record-accrual-batch`  
**Depends on:** G23-03 Funding Path FINAL  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Date:** 2026-06-15

---

## 1. 实现摘要

| 项 | 结论 |
|----|------|
| **`recordAccrualBatch(epochId, lines[])`** | Timelock-only · `1 ≤ lines.length ≤ 32` |
| **原子性** | validate 全批 → apply 全批 · 任一行失败整批 revert |
| **事件** | 每行 emit **`NetProfitAccrued`**（schema 不变） |
| **token** | **无** transfer · DR-02 记账/现金分离不变 |
| **Payload** | **`CPNP_RECORD_ACCRUAL_BATCH`** + `encodeRecordAccrualBatch` |

**未改：** `splitNetProfit` · Funding Path · 45/55 · Vault · 既有事件/单笔 `recordAccrual` ABI

---

## 2. Foundry（exit 0）

```bash
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract FeeRouterTest
```

| Suite | Result |
|-------|--------|
| `CountryPoolNetProfit` | **47 passed**（含 T-BATCH-01～06） |
| `FeeRouterTest` | **10 passed** |

---

## 3. 范围围栏（Out · 本 PR 未触）

- fuzz / invariant · ABI manifest export  
- Funding Path · split / fund / close 逻辑变更  
- indexer / API / DB / Sepolia / Gate-2.4+

---

## 4. 签字

| 方 | 确认 | 日期 |
|----|------|------|
| 产品 | 32 行/tx SLA | 2026-06-15 |
| 财务 | 一行一 ref ↔ GL | 2026-06-15 |
| 工程 | DoD D1～D9 | 2026-06-15 |

**① 本地绿 ≠ ② Sepolia GO。**
