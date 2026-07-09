# TTG Tokenomics Full-System Audit Report

**Audit ID:** `TTG-TOKENOMICS-FULL-SYSTEM-AUDIT`  
**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](../../docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md)  
**Stamp:** `20260616T032437Z`  
**Phase:** ② Sepolia · **Verdict:** **FAIL**  

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

---

## Executive Summary

| 项 | 结论 |
|----|------|
| SSOT 唯一真源 | TTG-TOKENOMICS-FREEZE-V1 |
| GOV-01～04 镜像 | PASS |
| 废止叙事扫描 | FAIL (1 hits) |
| Sepolia 链上 GOV | 16 checks PASS |
| Country Pool 45/55 | SKIP |
| UI vitest | SKIP |
| **真人测试闸** | **BLOCKED** |

**全链路叙事：** 用户购买 TTG → 治理 → 国家池收益 → Global Treasury → 提案支出 → 退出

---

## 域矩阵（逐合约 · 逐池 · 逐页）

| 域 | SSOT | 合约 | UI | 状态 |
|----|------|------|-----|------|
| Primary Market (USDC→TTG) | GOV-04 · ttg-primary-market §3 | TtgPrimaryMarketV1 Proxy | /governance/params · ttgExchange | PASS |
| Global Treasury · P1–P4 | §1 · GOV-01 | GovernanceTreasuryP4Cap | #gov-params-treasury-policy | PASS |
| Governor / Timelock | GOV-02 | TravelTrustGovernor Proxy + TimelockUpgradeable | /governance/proposals | PASS |
| Country Pool（每国独立） | 45% Steward / 55% Global · G23-04 frozen ABI | CountryPoolNetProfitLedger + vaults | params 45/55 资金流 | SKIP |
| Steward 45% 路径 | country-revenue-model §2 | StewardPathVault / UnallocatedStewardPathVault | steward workbench | SKIP |
| Global 55% 路径 | country-revenue-model §2 · Treasury 顺序 | ledger.globalTreasury | treasury policy section | SKIP |
| Treasury Spend 权限 | GOV-01 · 须治理投票 | GovernanceTreasuryP4Cap 3000 bps | P4 deploy cap 文案 | PASS |
| 提案 · 投票 · 执行 | GOV-02 · 48h Timelock | Governor.proposalCount (read) | /governance/proposals | PARTIAL · execute 须 48h · ② read-only HAT |
| 退出机制 | ttg-primary-market §2 · 180d · 不退 USDC | RegionStewardStakePool Proxy | locales + steward workbench | PASS |
| Buyback / Burn | GOV-01 可选项 A/B · 非默认 | 须 Governor 提案（② 未 tx 验） | treasury policy options | PARTIAL · UI/SSOT 对齐 · 链上执行留真人测试 |
| UI 文案与资金流图 | TTG-TOKENOMICS-FREEZE-V1 §6 | — | GovernanceParamsProfitFlowVisual | FAIL |

---

## 全链路审计（购买 → 治理 → 收益 → Treasury → 支出 → 退出）

### 1_purchase · 用户购买 TTG

- **Scope:** Primary Market USDC→TTG · GOV-04 cap/min/rounds

### 2_governance · 治理参与

- **Scope:** Governor/Timelock · GOV-02 quorum · Seat GOV-03

### 3_revenue · 国家池收益

- **Scope:** Country Pool NetProfit · 45% Steward / 55% Global

### 4_treasury · Global Treasury

- **Scope:** P1→P2→P3→P4 · GOV-01 30% deploy cap

### 5_proposal_spend · 提案支出

- **Scope:** P4 动用 · Buyback/Burn/生态/国家池 · 须投票

### 6_exit · 退出机制

- **Scope:** Seat 180d 冷静 · 解锁 TTG · 不退 USDC · redemption 窗口正交

---

## 诚实边界

- ② Full-System Audit **≠** staging GO **≠** ③ Production GO
- **PARTIAL** = SSOT/UI/读面对齐 · 真 tx（提案 execute · Buyback · 退出 unstake）留 **真人测试**
- FeeRouter 45/55（订单费层）**正交** Country Pool NetProfit 45/55 — UI 须分维展示

**机读报告：** `evidence/GO_ttg_tokenomics_full_system_audit/20260616T032200Z/ttg-tokenomics-full-system-audit-20260616T032437Z.json`

**稳定 grep：** `TTG_TOKENOMICS_FULL_SYSTEM_AUDIT: FAIL`
