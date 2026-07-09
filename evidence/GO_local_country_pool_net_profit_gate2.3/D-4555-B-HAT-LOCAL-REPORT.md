# D-4555-B · Local Human Acceptance (HAT)

**Report ID:** `D-4555-B-HAT-LOCAL-20260615`  
**Date:** 2026-06-15 · verify 20260615T145436Z  
**HEAD:** `d32b4813` · branch `feature/g23-04-abi-event-freeze`  
**Baseline:** [GATE2.3-EXIT-REVIEW-REPORT.md](GATE2.3-EXIT-REVIEW-REPORT.md)  
**Phase:** **① 本地** · **≠** ② Sepolia GO · **≠** staging · **≠** Production GO

---

## 阶段口径

**① 本地 HAT 全过 → 可进入 Gate-2.4 前置评审** · **禁止** 据此直接 Sepolia broadcast。

| 项 | 结论 |
|----|------|
| **HAT 结论** | **✅ PASS（6/6 核心链路）** |
| **D-4555-B** | **Gate-2.4 Ready Candidate（①）· HAT ☑** |
| **Sepolia broadcast** | **❌ 未授权 · 未执行** |

---

## 1. 验收入口

```bash
bash scripts/dev/run-d4555b-hat-local.sh   # exit 0
```

**机读日志：** `d4555b_hat_local_forge.log`（本地 · 可 grep `D4555B_HAT_SUMMARY`）

**Exit Review 回归：** CountryPoolNetProfit **54** · FeeRouterTest **10**

---

## 2. 六条核心链路（人工意图 × Foundry 见证）

| HAT | 核心链路 | 人工可观察点 | 见证测试 | 结果 |
|-----|----------|--------------|----------|------|
| **HAT-01** | **正常盈利分账** | eligible · `SPLIT_COMPLETED` · 45%→StewardPath · 55%+余数→Treasury · 守恒 | `test_T_CLS_01_T_SPL_01_EligibleSplitConservation` | ✅ |
| **HAT-02** | **无 Active Steward → Unallocated** | ineligible · 45%→`UnallocatedStewardPathVault` · Global **不**吞 steward 腿 | `test_T_SPL_02_*` · `test_T_QLF_06_*` · `test_T_SPL_07_08_*` | ✅ |
| **HAT-03** | **亏损 / 零利润不 split** | `NO_SPLIT` · 无 fund/split · 亏损增 `carriedLoss` | `test_T_CLS_02_*` · `test_T_CLS_03_*` · `test_T_SPL_05_*` | ✅ |
| **HAT-04** | **carriedLoss 抵扣** | 下期 `carriedLossApplied` · `netProfitPrime` 扣减 · split 基数正确 | `test_T_CLS_05_*` · `testFuzz_T_FUZ_02_*` | ✅ |
| **HAT-05** | **recordAccrualBatch 边界** | ≤32 行 · 空批/超限 revert · 批内 dup ref · 原子 revert · 无 token 移动 | `test_T_BATCH_01`～`06` | ✅ |
| **HAT-06** | **Governance Payload 权限** | Timelock allowed target · disallowed revert · Payload encode/selector · owner 路径 | `test_T_GOV_01/02/04` · `test_T_GOV_03_*` | ✅ |

---

## 3. 人工抽检说明（Solo Maintainer · 2026-06-15）

| 方 | 确认 |
|----|------|
| **产品** | 六链路覆盖 accrual→close→fund→split 与 batch 运维路径 |
| **财务** | 亏损/carriedLoss/batch 一行一 ref 与 mapping-matrix 一致 |
| **工程** | `run-d4555b-hat-local.sh` exit 0 · 与 Gate-2.3 Exit 计数一致 |

**签字：** **Sebastian Ward** · **2026-06-15**

---

## 4. 范围围栏（HAT 未触 · 仍禁止）

- Sepolia broadcast · staging 部署  
- indexer / API / DB / Dashboard  
- **② GO** · **③ Production GO** 宣称  

---

## 5. 下一合法动作

**Gate-2.4 前置评审** — [country-pool-settlement-gate2.4-prerequisites-checklist.md](../../docs/spec/governance-token/country-pool-settlement-gate2.4-prerequisites-checklist.md)（**G24-P-05+** 仍 ② ☐ · Owner 授权前 **禁止** broadcast）

**诚实边界：** ① 本地 HAT + forge 绿 **≠** ② 测试网 GO。
