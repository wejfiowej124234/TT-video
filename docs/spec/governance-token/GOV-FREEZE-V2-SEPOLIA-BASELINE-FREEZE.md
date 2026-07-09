# GovFreeze V2 Sepolia 基线冻结 · TTG Tokenomics

**Freeze ID:** `GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE`  
**Status:** **ACTIVE · ② Sepolia · 验收维护窗（经济基线已锁定）**  
**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md) · `GOV-FREEZE-V2-CLEAN-BASELINE`  
**Recorded:** `bash scripts/dev/record-gov-freeze-v2-sepolia-baseline-freeze.sh`  
**Acceptance-only runbook:** [TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md)  
**Full coverage matrix:** [TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md](TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md)  
**Attack surface audit:** [TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md](TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md)  
**Ops & DR audit:** [TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md](TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md)  
**Production readiness closure:** [TTG-GOVERNANCE-PRODUCTION-READINESS-CLOSURE-AUDIT.md](TTG-GOVERNANCE-PRODUCTION-READINESS-CLOSURE-AUDIT.md)  
**GORP（运营接手）：** [TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md](../../runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md)  
**Enterprise 100/100 gap audit:** [TTG-GOVERNANCE-ENTERPRISE-100-FINAL-GAP-AUDIT.md](TTG-GOVERNANCE-ENTERPRISE-100-FINAL-GAP-AUDIT.md) · 报告体 v1 `SCORE=53` · **Closure SSOT `ENT=99`**  
**360° final closure:** [TTG-GOVERNANCE-360-FINAL-CLOSURE-AUDIT.md](TTG-GOVERNANCE-360-FINAL-CLOSURE-AUDIT.md) · 报告体 v1 `ENTERPRISE=53` · **Closure SSOT `ENT=99`**  
**GECP + Final Checklist:** [TTG-GOVERNANCE-ENTERPRISE-CLOSURE-PROGRAM.md](../../runbook/TTG-GOVERNANCE-ENTERPRISE-CLOSURE-PROGRAM.md) · [TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md](TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) · `TTG_GOV_FINAL_CLOSURE: MODE=CERT_ONLY DEV=100 TN=40 HUMAN=43 OPS=13 DR=0 ENT=99 CERT_QUEUE=6/12`  
**Full Coverage Certification:** [TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md](TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md) · `TTG_GOV_FCC: GFC=146 DEV=63 TN=40 HUMAN=43 OPS=13 DR=0 ENT=99 CERT=6/12`  
**Master Traceability Matrix:** [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) · MTM tier counts **SSOT:** [MTM-COUNT-SSOT.md](../../master/MTM-COUNT-SSOT.md) · `TTG_GOV_MTM: ROWS=146 DEV=58 TN=40 HUMAN=48 OPS=18 DR=0`

---

## 唯一经济基线（2026-06-16 起）

**GovFreeze V2 + Four-Ledger PASS** 为 **② 唯一经济真源** — 停止 Tokenomics 设计变更。

| 锚 | 证据 |
|----|------|
| Four-Ledger | `evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z/` |
| DE cutover + split | `evidence/GO_tt_country_pool_revenue_enterprise_hat/cutover-drill/20260616T082259Z/` |
| Enterprise L9 | `evidence/GO_tt_governance_enterprise_hat/l9-recheck/20260616T084529Z/` |

---

## 冻结范围

| 项 | 地址 / 版本 |
|----|-------------|
| **TTG** | `0x2837ea0c50e27d59b88af617abbb231a040062c5` |
| Governor | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` |
| Timelock | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| Primary Market | `0x7af15f98622b9282298ca3070a698ca4a96a4016` |
| Stake Pool | `0x3a89378bfad12d1028707dd37055294854c8784e` |
| Seat Registry | `0xc99776e980d33f1857d5bb9a57b35ab7669aad1f` |
| **DE NetProfit Ledger** | `0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa` · `globalTreasury` → V2 Timelock |

**Legacy（只读归档 · 禁止回滚）：** `LEGACY_GOVERNANCE_TOKEN_ADDRESS` · `LEGACY_PRE_GOVFREEZE_V2_*`

---

## 变更边界

| 允许 | 禁止 |
|------|------|
| **Bugfix**（不改 GOV-01～04 · 45/55 · Timelock · vote cap） | **Tokenomics 设计变更** · **新增治理功能** |
| **真人录屏验收**（UI/UX · 多身份 · Admin · 收益路径） | GOV 参数修订 · 新 payload · 新募资设计 |
| **HAT-R1 Phase B**（Timelock 后 Execute → Treasury Spend → Unstake） | 重部署 V2 基线 · 激活 Legacy 栈 |
| i18n · a11y · 证据 · 注释 | 五主路由 UI 结构回流 |

**治理参数修订** 若将来需要，须 **GOV-02 提案 + 48h Timelock** — **不在本维护窗内**。

---

## HAT-R1 闭环状态

| 阶段 | 状态 |
|------|------|
| Phase A | ✅ PASS · `evidence/GO_hat_r1_sepolia/20260616T063612Z/` |
| Four-Ledger / L9 | ✅ PASS · 见上 |
| **真人录屏** | ☐ **当前优先** · `run-govfreeze-v2-human-screen-acceptance-prep.sh` |
| Phase B | ⏸ **PAUSED** · Timelock + 录屏签核 + `HAT_R1_PHASE_B_PAUSED=0` |

---

## 集中度审计

```bash
bash scripts/dev/run-governance-concentration-audit-sepolia.sh
# TT_GOV_CONCENTRATION_SUMMARY: PASS|FAIL
```

---

## 诚实边界

- **② 经济基线锁定 ≠ ③ Production GO**
- 录屏验收 **≠** Phase B 链上闭环已验
