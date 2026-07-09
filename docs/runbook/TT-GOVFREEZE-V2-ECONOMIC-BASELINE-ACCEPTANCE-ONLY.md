# GovFreeze V2 · 经济基线锁定 · 仅验收轨

**Baseline ID:** `GOVFREEZE-V2-ECONOMIC-FOUR-LEDGER-BASELINE`  
**Phase:** **② Sepolia** · **≠ ③ Production GO**  
**Effective:** 2026-06-16 · **Four-Ledger PASS** `20260616T084248Z`  
**Mode:** **Certification-Only** — GovFreeze V2 **已冻结 · 禁止复验**

---

## 后续只允许（写死）

| 允许 | 禁止 |
|------|------|
| **Human Certification** | Governance 开发审计 |
| **Operations Certification** | Tokenomics 审计 |
| **Disaster Recovery Certification** | Smart Contract 审计 |
| 更新 [Final Closure Checklist §14](../spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md#14--certification-execution-queue唯一执行序--012) | GovFreeze V2 / 四账 / Phase A **重复机读** |

**执行序 SSOT：** Final Checklist **§14**（12 步）· 目标 Enterprise **100/100**

## 唯一经济基线（写死）

| 锚 | 值 / 证据 |
|----|-----------|
| **GovFreeze V2 + TTG** | [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) |
| **DE NetProfit · 45/55 · V2 Treasury** | cutover+drill `evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/20260616T082259Z/` |
| **四账一致** | `evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z/four-ledger-reconcile.json` → **PASS** |
| **Enterprise L9** | `evidence/GO_tt_governance_enterprise_hat/l9-recheck/20260616T084529Z/L9-RECHECK.json` → **PASS** |
| **HAT-R1 Phase A** | `evidence/GO_hat_r1_sepolia/20260616T063612Z/` |

**禁止** 以 Legacy 栈 · 旧 P5 ledger · 未 cutover 的 `globalTreasury` 作为验收或叙事基线。

---

## 变更边界（维护窗）

| 允许 | 禁止 |
|------|------|
| **Bugfix**（不改动 GOV-01～04 · 45/55 · Timelock 48h · vote cap） | **Tokenomics 设计变更** · 新治理功能 · GOV 参数修订 |
| **真人录屏验收**（UI/UX · 多身份 · Admin · 收益路径） | 新 Country Pool 链上演练（除非 bug 复现） |
| **Timelock 到期后 Phase B**（Execute → Treasury Spend → Unstake） | 新提案类型 · 新 payload · 新募资轮次设计 |
| i18n · a11y · 证据 · 注释 | 五主路由 UI 结构回流（见 FIVE-MAIN 冻结） |

---

## 下一合法动作（Certification 轨 · 对齐 §14）

**当前：** **Cert #1 · Human UAT** ☐

| # | 动作 | 状态 |
|---|------|------|
| 1 | Human UAT（A1～D4 录屏 + signoff） | ☐ **← 当前** |
| 2 | Multi Identity Walkthrough | ☐ |
| 3 | Admin Walkthrough | ☐ |
| 4 | Safe Walkthrough | ☐ |
| 5 | Finance Walkthrough | ☐ |
| 6 | Phase B unpause | ☐ |
| 7 | Execute | ☐ |
| 8 | Treasury Spend | ☐ |
| 9 | Unstake | ☐ |
| 10 | Incident Tabletop | ☐ |
| 11 | Disaster Recovery Drill | ☐ |
| 12 | GORP Signoff | ☐ |

### 轨 1 · 真人录屏验收（Cert #1 · 当前优先）

**全链路矩阵 SSOT：** [TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md](../spec/governance-token/TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md)（**77 项** · Human **0%**）

**范围：** 逐页 UI/UX · 多身份（Traveler / Guide / Merchant / Steward / Moderator / Admin）· 管理员 RBAC · 收益路径（45/55 · params · distribution · claim 边界）。

```bash
# 清单 + 路由表（不代替录屏）
bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh

# 前端 :3012 · API :8080 · Sepolia 钱包 · 录屏保存至 evidence/GO_govfreeze_v2_human_screen_acceptance/<stamp>/

bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh \
  --signer "Sebastian Ward" \
  --evidence-dir evidence/GO_govfreeze_v2_human_screen_acceptance/<stamp>
```

**通过条件：** 清单项全部 ☑ · 录屏 + `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` · **无 P0 认知/权限/资金叙事错误**。

### 轨 2 · HAT-R1 Phase B（Timelock 到期后）

**前置：** 轨 1 签核 ☑ · `export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1` · `export HAT_R1_PHASE_B_PAUSED=0`（Owner 确认）

```bash
export HAT_R1_LIVE_WALLET_OK=1
export HAT_R1_BROWSER_ACCEPT_OK=1
bash scripts/dev/run-hat-r1-phase-b-when-ready.sh
```

**闭环：** Queue 后 48h → **Execute** → **Treasury Spend**（治理支出路径）→ **Unstake** · 五层证据同 Phase A。

---

## 诚实边界

- **② 经济基线 + 四账 PASS** **≠** staging 全矩阵 GO **≠** ③ Production GO
- 录屏验收 **≠** 链上 Phase B 已执行；Phase B **须** Timelock elapsed + 真人钱包 tx
- Ledger **owner** 仍在 legacy Timelock（`0x0359…`）— **非** 本轮验收范围，**不** 触发新治理设计
