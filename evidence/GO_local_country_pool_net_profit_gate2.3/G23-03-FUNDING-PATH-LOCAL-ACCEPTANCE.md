# G23-03 · Funding Path FINAL — ① 本地验收

**Card:** `G23-03-funding-path`  
**Branch:** `feature/g23-03-funding-path`  
**Baseline:** Gate-2.2 `76aff11c`  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Date:** 2026-06-15

---

## 1. 定案

| 项 | 结论 |
|----|------|
| **Pilot 默认** | **路径 A · Allowance** — `fundingSource` pre-approve → `fundLedgerForSplit` `transferFrom` |
| **路径 B** | `GovernanceTreasury.spend` — **② 可选** · Runbook only · **未** 引入链上代码 |
| **`LedgerFundedForSplit.amount`** | 实际 pull；ledger 已 `balance >= netProfitPrime` 时为 **0** |
| **Split 45/55** | **未改** · `bpsStewardPath` / `bpsGlobalTreasury` 不变 |

**SSOT:** Architecture §7.4 / §7.4.1 · mapping-matrix §4.3.1 FIN-FND-01

---

## 2. 范围围栏（Out · 本 PR 未触）

- `recordAccrualBatch` · fuzz · ABI export  
- indexer / API / DB migration / Dashboard  
- Sepolia broadcast · staging  
- `Treasury.spend` 实现 · Phase 2.4+

---

## 3. Foundry（exit 0）

```bash
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract FeeRouterTest
```

| Suite | Result |
|-------|--------|
| `CountryPoolNetProfit` | **41 passed** |
| `FeeRouterTest` | **10 passed** |

**新增测试:** `test_T_FND_05_*` · `test_T_FND_06_FundRevertsWhenAllowanceInsufficient`

---

## 4. 产品 / 财务确认

| 方 | 确认项 | 签字 | 日期 |
|----|--------|------|------|
| 产品 | Phase② pilot 默认 **Path A · Allowance** | Sebastian Ward | 2026-06-15 |
| 财务 | FIN-FND-01 · `amount` 语义与 GL clearing 映射 | Sebastian Ward | 2026-06-15 |
| 工程 | DoD D1～D7 | Sebastian Ward | 2026-06-15 |

---

## 5. 诚实边界

**① 本地 forge 绿 + Funding Path FINAL ≠ ② 测试网 GO。** Safe approve SOP · staging Treasury 对拍留 **Gate-2.4**。
