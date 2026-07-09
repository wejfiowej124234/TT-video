# TTG Tokenomics UI Alignment Audit Report

**Audit ID:** `TTG-TOKENOMICS-UI-ALIGNMENT-AUDIT`  
**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md)  
**Stamp:** `20260616T084739Z`  
**Phase:** ① 本地机读 + 文案扫描 · **Verdict:** **PASS**  

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

---

## Executive Summary

| 项 | 结论 |
|----|------|
| UI 对齐审计 | **PASS** |
| §6 废止叙事扫描 | PASS (0 hits) |
| GOV 常量镜像 | cap=3000 quorum=400 pm_cap=25000 |
| vitest 契约 | PASS |
| HAT-R1 真人点击 | **⏸ 待 UI PASS + bootstrap PASS 后启动** |

**诚实边界：** ① UI 文案/ wiring 对齐 **≠** ② Sepolia 真人 tx 已验 **≠** ③ Production GO

---

## 清单（UI-01～10）

| # | 清单项 | 状态 |
|---|--------|------|
| UI-01 | §6 废止叙事（locales + governance 组件） | ✅ PASS |
| UI-02 | GOV-01 30% cap 文案/常量 | ✅ PASS |
| UI-03 | GOV-02 quorum 400 文案/常量 | ✅ PASS |
| UI-04 | GOV-04 Primary Market 25k cap | ✅ PASS |
| UI-05 | Country Pool 45/55 资金流图 | ✅ PASS |
| UI-06 | Treasury P1→P4 顺序 + 非 pro-rata | ✅ PASS |
| UI-07 | Seat 退出 · 解锁 TTG · 不退 USDC | ✅ PASS |
| UI-08 | 无 GlobalPoolDistributionSection 回流 | ✅ PASS |
| UI-09 | ② NOT STARTED 诚实边界 | ✅ PASS |
| UI-10 | vitest 契约全绿 | ✅ PASS |

---

## 逐页核查（真人视角）

| 路由 | 页面 | 核查点 | 状态 |
|------|------|--------|------|
| `/governance` | 治理 Hub | 入口摘要 · 参与 CTA · 资金流正交提示 | PASS |
| `/governance/params#gov-params-tokenomics-freeze` | GOV-01～04 公示 | 3000 bps cap · 400 quorum · 25k PM cap · ② NOT STARTED 诚实边界 | PASS |
| `/governance/params#gov-params-treasury-policy` | Global Treasury · P4 | 30% deploy cap · Buyback/Burn 选项 · 公众三轮 · Seat 退出不退 USDC | PASS |
| `/governance/params` | 净利润 45/55 资金流 | Country Pool 45/55 · Treasury P1→P4 · 禁止 pro-rata 第二步 | PASS |
| `/governance/proposals` | 提案 · 投票 · 执行 | quorum 提示 · 48h Timelock · 权限/错误态 | PASS |
| `/governance/delegate` | 委托投票权 | 钱包连接 · delegate 文案 | PASS |
| `/governance/distribution-claim` | 投资者分配领取 | 非按持仓分现叙事 · claim 权限/错误态 | PASS |
| `/governance/distribution-accruals` | 应计分配 | accruals 措辞 · 非 HolderDividend 叙事 | PASS |
| `/governance/fee-routes` | FeeRouter 层 | 65/20/15 正交 · ≠ NetProfit P4 | PASS |
| `/governance/vault-forwards` | Vault 转发审计 | vault 路径 · 只读/权限提示 | PASS |
| `/governance/steward-region-workbench` | 主理人 · Seat · 质押/退出 | 质押门槛 · 180d 退出 · GOV-03 单 Seat · Primary Market 不足提示 | PASS |

---

## 下一闸

1. `bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh --strict` → PASS
2. `bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --preflight-only`
3. Owner 授权后 `HAT_R1_LIVE_WALLET_OK=1` → Phase A 逐步点击

**机读报告：** `evidence/GO_ttg_tokenomics_ui_alignment/20260616T084739Z/ui-alignment-audit.json`

**稳定 grep：** `TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT: PASS`
