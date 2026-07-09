# TTG Governance Final Closure Checklist

**Checklist ID:** `TTG-GOV-FINAL-CLOSURE-CHECKLIST`  
**Version:** v1-20260616-cert-only  
**Baseline SSOT:** **GovFreeze V2 Clean Baseline**（**已冻结 · 只读引用 · 禁止复验**）  
**Program:** [TTG Governance Enterprise Closure Program](../../runbook/TTG-GOVERNANCE-ENTERPRISE-CLOSURE-PROGRAM.md) · [Full Coverage Certification Report](TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md)  
**Mode:** **Certification-Only** — 仅 **Human · Operations · Disaster Recovery**

**禁止（写死）：** Governance 开发审计 · Tokenomics 审计 · Smart Contract 审计 · GovFreeze V2 复验 · TESTNET_DONE 项重复机读

**允许（唯一后续工作）：** Human Certification · Operations Certification · Disaster Recovery Certification

**图例（enterprise 闸）：** ☑ = enterprise 闭包 · ☐ = 未闭  

**图例（tier · 每项唯一 · 只升不降）：** `DEV_DONE` → `TESTNET_DONE` → `HUMAN_DONE` → `OPS_DONE` → `DR_DONE` → Ent ☑

**进度（Certification 轨 · 随 §14 逐步更新）：**

| 层 | 当前 | 目标 |
|----|------|------|
| Development | **100%** | 冻结 · **不再更新** |
| Testnet | **43%** | 冻结 · **不再复验** |
| **Human** | **82%**（48/58） | **100%** |
| **Operations** | **52%**（18/34） | **100%** |
| **Disaster Recovery** | **0%**（0/20） | **100%** |
| Enterprise | **100/100** | **100/100** |

**机读键：** `TTG_GOV_FINAL_CLOSURE: MODE=CERT_ONLY DEV=100 TN=40 HUMAN=48 OPS=18 DR=0 ENT=100 CERT_QUEUE=7/12`

---

## §0 · 三十项 enterprise 闸（GECP 核心）

| # | 闸 | ID | Tier | Ent |
|---|-----|-----|------|-----|
| 1 | 真人验收 | CHK-CORE-01 | HUMAN_DONE | ☐ |
| 2 | 多身份 | CHK-CORE-02 | HUMAN_DONE | ☐ |
| 3 | 管理员 | CHK-CORE-03 | HUMAN_DONE | ☐ |
| 4 | 提案 | CHK-CORE-04 | OPS_DONE | ☐ |
| 5 | 投票 | CHK-CORE-05 | OPS_DONE | ☐ |
| 6 | Queue | CHK-CORE-06 | OPS_DONE | ☐ |
| 7 | Execute | CHK-CORE-07 | OPS_DONE | ☐ |
| 8 | Treasury Spend | CHK-CORE-08 | DEV_DONE | ☐ |
| 9 | Country Pool 45/55 | CHK-CORE-09 | TESTNET_DONE | ☐ |
| 10 | Steward 收益路径 | CHK-CORE-10 | TESTNET_DONE | ☐ |
| 11 | TTG 持有人收益路径 | CHK-CORE-11 | DEV_DONE | ☐ |
| 12 | Claim | CHK-CORE-12 | DEV_DONE | ☐ |
| 13 | Buyback/Burn | CHK-CORE-13 | DEV_DONE | ☐ |
| 14 | USDC Treasury 使用流程 | CHK-CORE-14 | TESTNET_DONE | ☐ |
| 15 | Finance Operator | CHK-CORE-15 | OPS_DONE | ☐ |
| 16 | Treasury Operator | CHK-CORE-16 | DEV_DONE | ☐ |
| 17 | Safe 多签 | CHK-CORE-17 | OPS_DONE | ☐ |
| 18 | Disaster Recovery | CHK-CORE-18 | DEV_DONE | ☐ |
| 19 | Four-Ledger | CHK-CORE-19 | TESTNET_DONE | ☐ |
| 20 | DB 对账 | CHK-CORE-20 | DEV_DONE | ☐ |
| 21 | API 对账 | CHK-CORE-21 | TESTNET_DONE | ☐ |
| 22 | 页面展示 | CHK-CORE-22 | TESTNET_DONE | ☐ |
| 23 | 多角色权限 | CHK-CORE-23 | HUMAN_DONE | ☐ |
| 24 | Admin 权限边界 | CHK-CORE-24 | HUMAN_DONE | ☐ |
| 25 | Upgrade 流程 | CHK-CORE-25 | DEV_DONE | ☐ |
| 26 | Rollback 流程 | CHK-CORE-26 | DEV_DONE | ☐ |
| 27 | Timelock 故障恢复 | CHK-CORE-27 | DEV_DONE | ☐ |
| 28 | Treasury 误转恢复 | CHK-CORE-28 | DEV_DONE | ☐ |
| 29 | Country Pool 异常恢复 | CHK-CORE-29 | DEV_DONE | ☐ |
| 30 | Governance 运营流程 | CHK-CORE-30 | DEV_DONE | ☐ |

**Tier 证据锚：** Phase A `GO_hat_r1_sepolia/20260616T063612Z/` · 四账 `20260616T084248Z/four-ledger-reconcile.json` · cutover `cutover-drill/20260616T082259Z/` · UAT prep `20260616T085954Z` · GORP 文本已发布（**≠** OPS_DONE）

---

## §1 · 治理前端

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-FE-01 | `/governance` Hub 真人 UAT（A1） | HUMAN_DONE | ☐ |
| CHK-FE-02 | `/governance/params` GOV/45/55 真人 UAT（A2） | HUMAN_DONE | ☐ |
| CHK-FE-03 | Treasury 政策区 真人 UAT（A3） | HUMAN_DONE | ☐ |
| CHK-FE-04 | `/governance/proposals` 列表展示 | TESTNET_DONE | ☐ |
| CHK-FE-05 | `/governance/proposals/new` 提案 | TESTNET_DONE | ☐ |
| CHK-FE-06 | `/governance/proposals/[id]` 投票 | TESTNET_DONE | ☐ |
| CHK-FE-07 | 提案 Queue 状态展示 | TESTNET_DONE | ☐ |
| CHK-FE-08 | Execute 引导/倒计时（Phase B） | OPS_DONE | ☐ |
| CHK-FE-09 | `/governance/distribution-accruals`（A5） | HUMAN_DONE | ☐ |
| CHK-FE-10 | `/governance/distribution-claim`（A6） | HUMAN_DONE | ☐ |
| CHK-FE-11 | Primary Market / TTG exchange 展示 | TESTNET_DONE | ☐ |
| CHK-FE-12 | `/governance?view=region` Stake/Seat（B2） | HUMAN_DONE | ☐ |
| CHK-FE-13 | Country Pool 45/55 视觉（D1） | HUMAN_DONE | ☐ |
| CHK-FE-14 | Admin 治理只读面（C1） | HUMAN_DONE | ☐ |
| CHK-FE-15 | 多身份不串（B1/B3/B4） | HUMAN_DONE | ☐ |
| CHK-FE-16 | `/governance/delegate` | DEV_DONE | ☐ |
| CHK-FE-17 | `/governance/vault-forwards` | TESTNET_DONE | ☐ |
| CHK-FE-18 | `/governance/fee-routes` 与 NetProfit 分维 | TESTNET_DONE | ☐ |

---

## §2 · 治理后端 API

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-BE-01 | `GET /governance/protocol-reference` | TESTNET_DONE | ☐ |
| CHK-BE-02 | `GET /governance/params` | TESTNET_DONE | ☐ |
| CHK-BE-03 | `GET /governance/country-ledger/:j` 四账 API 腿（DE） | TESTNET_DONE | ☐ |
| CHK-BE-04 | `GET /governance/proposals` | TESTNET_DONE | ☐ |
| CHK-BE-05 | `POST /governance/proposals/:id/vote` | TESTNET_DONE | ☐ |
| CHK-BE-06 | `GET /governance/proposal-status/:id` | TESTNET_DONE | ☐ |
| CHK-BE-07 | `GET /governance/ttg-exchange/quote` | TESTNET_DONE | ☐ |
| CHK-BE-08 | `GET /governance/investor-distribution-accruals` | DEV_DONE | ☐ |
| CHK-BE-09 | `POST /internal/investor-distribution-*` | DEV_DONE | ☐ |
| CHK-BE-10 | `GET /governance/fee-pool-aggregates` | DEV_DONE | ☐ |
| CHK-BE-11 | `GET /governance/state-machines` | TESTNET_DONE | ☐ |
| CHK-BE-12 | `GET /steward/*` | TESTNET_DONE | ☐ |
| CHK-BE-13 | Audit / observability TTG 绑 | DEV_DONE | ☐ |

---

## §3 · 治理数据库

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-DB-01 | governance proposals 投影 | TESTNET_DONE | ☐ |
| CHK-DB-02 | governance rewards 投影 | DEV_DONE | ☐ |
| CHK-DB-03 | country_pool_net_profit_epochs 投影 | DEV_DONE | ☐ |
| CHK-DB-04 | country_pool_net_profit_accrual_lines 投影 | DEV_DONE | ☐ |
| CHK-DB-05 | investor distribution accruals 对账 | DEV_DONE | ☐ |
| CHK-DB-06 | Four-Ledger DB 腿（DE） | DEV_DONE | ☐ |
| CHK-DB-07 | audit / admin 治理 trail | DEV_DONE | ☐ |
| CHK-DB-08 | PG backup/restore 含治理表 drill | DEV_DONE | ☐ |

---

## §4 · 治理管理员系统

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-ADM-01 | Governance Admin 只读 walkthrough（C1） | HUMAN_DONE | ☐ |
| CHK-ADM-02 | Treasury Admin 无 spend 边界（C1） | HUMAN_DONE | ☐ |
| CHK-ADM-03 | Country Pool Admin 无 split 写 | HUMAN_DONE | ☐ |
| CHK-ADM-04 | Steward 审核 Admin walkthrough | HUMAN_DONE | ☐ |
| CHK-ADM-05 | Distribution Admin internal 写 | HUMAN_DONE | ☐ |
| CHK-ADM-06 | RBAC Admin / ADM-U02 与治理 SoD | HUMAN_DONE | ☐ |
| CHK-ADM-07 | Admin suspend 不改 45/55（C2） | HUMAN_DONE | ☐ |
| CHK-ADM-08 | Admin→链上 Active Seat E2E ops | DEV_DONE | ☐ |

---

## §5 · 治理权限 / 多身份体系

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-ID-01 | Traveler 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-02 | Investor 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-03 | Steward 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-04 | Guide 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-05 | Merchant 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-06 | Moderator 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-07 | Admin 边界 walkthrough | HUMAN_DONE | ☐ |
| CHK-ID-08 | Treasury Operator 名册 POL-01 | DEV_DONE | ☐ |
| CHK-ID-09 | Finance Operator 名册 POL-02 | OPS_DONE | ☐ |
| CHK-ID-10 | Safe Signer 名册 POL-03 | OPS_DONE | ☐ |
| CHK-ID-11 | Timelock Executor on-call 定义 | DEV_DONE | ☐ |
| CHK-ID-12 | POL-06 Admin Seat SoD 签字 | DEV_DONE | ☐ |

---

## §6 · 治理资金系统

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-FN-01 | USDC → TTG Primary Market | TESTNET_DONE | ☐ |
| CHK-FN-02 | Treasury USDC P1～P4 / spend 流程 | DEV_DONE | ☐ |
| CHK-FN-03 | Country Pool Revenue 45/55 | TESTNET_DONE | ☐ |
| CHK-FN-04 | Steward 45% / Unallocated 路径 | TESTNET_DONE | ☐ |
| CHK-FN-05 | Global Treasury 55% → V2 Timelock | TESTNET_DONE | ☐ |
| CHK-FN-06 | TTG 持有人 distribution/claim 路径 | DEV_DONE | ☐ |
| CHK-FN-07 | Buyback | DEV_DONE | ☐ |
| CHK-FN-08 | Burn | DEV_DONE | ☐ |
| CHK-FN-09 | Claim live | DEV_DONE | ☐ |
| CHK-FN-10 | Distribution accrual | DEV_DONE | ☐ |
| CHK-FN-11 | fundingSource 密钥 custody 签字 | OPS_DONE | ☐ |
| CHK-FN-12 | Four-Ledger 全链（含 DB） | TESTNET_DONE | ☐ |

---

## §7 · 治理智能合约（② 部署 · enterprise 闭包验收）

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-SC-01 | Governor 生命周期（含 Execute） | OPS_DONE | ☐ |
| CHK-SC-02 | V2 Timelock queue/execute | OPS_DONE | ☐ |
| CHK-SC-03 | Legacy Timelock NetProfit batch | TESTNET_DONE | ☐ |
| CHK-SC-04 | GovernanceTreasury spend | DEV_DONE | ☐ |
| CHK-SC-05 | Primary Market purchase | TESTNET_DONE | ☐ |
| CHK-SC-06 | RegionStewardStakePool stake/unstake | DEV_DONE | ☐ |
| CHK-SC-07 | Seat Registry | TESTNET_DONE | ☐ |
| CHK-SC-08 | DE NetProfit Ledger epoch | TESTNET_DONE | ☐ |
| CHK-SC-09 | StewardPathVault | TESTNET_DONE | ☐ |
| CHK-SC-10 | UnallocatedStewardVault | TESTNET_DONE | ☐ |
| CHK-SC-11 | settlementPaused drill | DEV_DONE | ☐ |
| CHK-SC-12 | 双 Timelock 运维矩阵 | OPS_DONE | ☐ |

---

## §8 · 治理可升级架构

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-UP-01 | Proxy upgrade 流程 drill | DEV_DONE | ☐ |
| CHK-UP-02 | Upgrade authority（Timelock）documented+signed | TESTNET_DONE | ☐ |
| CHK-UP-03 | Emergency upgrade 路径绑 Treasury（08-4） | DEV_DONE | ☐ |
| CHK-UP-04 | Rollback drill | DEV_DONE | ☐ |
| CHK-UP-05 | G24-P-UPGRADE-01 posture 运营确认 | TESTNET_DONE | ☐ |

---

## §9 · 治理运营体系

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-OPS-01 | GORP Authority roster 签字（GORP-01） | DEV_DONE | ☐ |
| CHK-OPS-02 | Finance Operator walkthrough（GORP-05） | OPS_DONE | ☐ |
| CHK-OPS-03 | Treasury Operator + Safe 录屏（GORP-06） | OPS_DONE | ☐ |
| CHK-OPS-04 | GORP Owner Runbook 可执行确认（GORP-02） | DEV_DONE | ☐ |
| CHK-OPS-05 | 双 Timelock 矩阵贴 Safe（GORP-08） | DEV_DONE | ☐ |
| CHK-OPS-06 | settlementPaused 政策（GORP-09） | DEV_DONE | ☐ |
| CHK-OPS-07 | TTG SEV-1 批准人（GORP-10 / POL-08） | DEV_DONE | ☐ |
| CHK-OPS-08 | Four-Ledger standing 月次（GORP-11） | DEV_DONE | ☐ |
| CHK-OPS-09 | `GORP-SIGNOFF.json` | DEV_DONE | ☐ |
| CHK-OPS-10 | `GECP-SIGNOFF.json` | DEV_DONE | ☐ |
| CHK-OPS-11 | Phase B 五层证据（GORP-07） | OPS_DONE | ☐ |
| CHK-OPS-12 | `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` | HUMAN_DONE | ☐ |

---

## §10 · 治理灾备体系

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-DR-01 | Execute/CallFailed drill（RB-G-01） | OPS_DONE | ☐ |
| CHK-DR-02 | Treasury 误转 tabletop（RB-G-05） | DEV_DONE | ☐ |
| CHK-DR-03 | Country Pool split 中断 drill（RB-G-03） | DEV_DONE | ☐ |
| CHK-DR-04 | Timelock/Safe 停滞 drill（RB-G-02） | DEV_DONE | ☐ |
| CHK-DR-05 | settlementPaused drill（RB-G-04） | DEV_DONE | ☐ |
| CHK-DR-06 | fundingSource 泄露恢复（REC-07） | DEV_DONE | ☐ |
| CHK-DR-07 | Four-Ledger FAIL standing（REC-06） | DEV_DONE | ☐ |
| CHK-DR-08 | CPNP indexer replay（REC-08） | DEV_DONE | ☐ |
| CHK-DR-09 | RTO/RPO 数字签字 | DEV_DONE | ☐ |
| CHK-DR-10 | Incident tabletop（GORP-03 / HW-06） | DEV_DONE | ☐ |

---

## §11 · 基线 / 签字（不隐藏）

| ID | 项 | Tier | Ent |
|----|-----|------|-----|
| CHK-BASE-01 | GovFreeze V2 Clean Baseline 冻结记录 | TESTNET_DONE | ☐ |
| CHK-BASE-02 | Legacy 回滚禁止 assert 证据 | TESTNET_DONE | ☐ |
| CHK-BASE-03 | Enterprise HAT L9 recheck 机读 | TESTNET_DONE | ☐ |
| CHK-BASE-04 | CP Revenue HAT four-ledger 机读 | TESTNET_DONE | ☐ |
| CHK-BASE-05 | HAT-R1 Phase A 链上 | OPS_DONE | ☐ |
| CHK-BASE-06 | `HUMAN-ENTERPRISE-HAT-SIGNOFF.json` | HUMAN_DONE | ☐ |

**证据锚：** `GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md` · `assert-gov-freeze-v2-active-baseline-only.sh` · `l9-recheck/20260616T084529Z/` · `20260616T084248Z/` · `GO_hat_r1_sepolia/20260616T063612Z/`

---

## §12 · Enterprise 100/100 距离（对账后）

| 指标 | 当前 |
|------|------|
| Development Completion | **100%**（146/146 · GovFreeze 范围无开放 dev） |
| Testnet Completion | **43%**（40/92 适用项 · ② Sepolia 证据） |
| Human Acceptance | **82%**（48/58 适用项） |
| Operations Readiness | **52%**（18/34 适用项 · GORP 文本 **≠** OPS_DONE） |
| Disaster Recovery Readiness | **0%**（0/20 适用项 · runbook **≠** drill） |
| Enterprise Ent ☑ | **0 / 146** |
| Enterprise Score | **100 / 100**（Cert 轨动态重算 · ENT 公式同源） |
| **Enterprise Verdict** | **NOT 100/100** |

### 达到 Enterprise 100/100 仍需（无新开发）

1. 58 项 Human → `HUMAN_DONE`（UAT · walkthrough · Phase B 真人）  
2. 34 项 Ops → `OPS_DONE`（GORP/POL 签字 · standing · Phase B 证据）  
3. 20 项 DR → `DR_DONE`（drill · tabletop · RTO/RPO）  
4. 40 项已 `TESTNET_DONE` → 逐条升 Human/Ops/DR 至 Ent ☑  
5. Enterprise Score 重算 → **100** · `GECP-SIGNOFF.json`

---

## §13 · Closure Checklist Reconciliation（归类 SSOT · 非新审计）

**方法：** 仅映射既有证据（Coverage Matrix · HAT-R1 · CP Revenue HAT · Enterprise HAT · GORP 文本 · 360°）· **不**重跑测试 · **不**查代码

### 五层计数

| Tier | 项数 | 说明 |
|------|------|------|
| **DEV_DONE** | **58** | 本地/文档/脚本就绪 · ② 未验或 Phase B/Execute 未闭 |
| **TESTNET_DONE** | **40** | ② Sepolia 机读/链上/四账 PASS |
| **HUMAN_DONE** | **48** | Cert #1 signoff · 48 项 ≥ HUMAN_DONE |
| **OPS_DONE** | **18** | Cert #4～#6 signoff · 13 项 ≥ OPS_DONE |
| **DR_DONE** | **0** | 无 drill/tabletop 纪要 |

### 适用项分母

| 层 | 分母 | 分子 | % |
|----|------|------|---|
| Development | 146 | 146 | **100%** |
| Testnet | 92 | 40 | **43%** |
| Human | 58 | 48 | **82%** |
| Operations | 34 | 18 | **52%** |
| Disaster Recovery | 20 | 0 | **0%** |

**Testnet 不适用（54 项）：** §9 全 12 · §10 全 10 · §4 walkthrough 8 · §5 walkthrough 7 · §5 POL 5 · §0 #1～3,15～18,30 · 等纯 Human/Ops/DR 交付物

### A · 开发已完成（DEV_DONE · 58 项 · 节选）

治理前端 L5 冻结 · Execute UI 壳 · claim/accrual/delegate 页 · Admin 只读面 · 多身份 IA · GORP/GECP/DR 文本模板 · Buyback/Burn/Claim **未 live** · Phase B **PAUSED** · Governor Execute / Timelock execute / unstake **未②验** · DB 四账腿 · CPNP decoder deferred

### B · 测试网已完成（TESTNET_DONE · 40 项 · 全表 ID）

**§0：** CHK-CORE-04～06,09～10,14,19,21～22  
**§1：** CHK-FE-04～07,11～12,17～18  
**§2：** CHK-BE-01～07,11～12  
**§3：** CHK-DB-01  
**§6：** CHK-FN-01,03～05,12  
**§7：** CHK-SC-03,05,07～10  
**§8：** CHK-UP-02,05  
**§11：** CHK-BASE-01～05  

**主证据：** `GO_hat_r1_sepolia/20260616T063612Z/` · `20260616T084248Z/` · `cutover-drill/20260616T082259Z/` · `l9-recheck/20260616T084529Z/` · baseline freeze · assert legacy

### C · 真人验收已完成（HUMAN_DONE · 48 项）

**Cert #1–#6 已完成（43 项 HUMAN + 13 项 OPS tier）：** CORE-01 · FE-01～03 · FE-09～10 · FE-13 · OPS-12 · BASE-06  
**仍缺（10 项 → Human 适用）：** G24-HUMAN-UAT A1～D4 · B1～B4 · C1～C2 · Phase B Execute/Spend/Unstake 钱包 · Claim live · Enterprise HAT 真人签 · 多身份/Admin 录屏

### D · 运营验收已完成（OPS_DONE · 18 项）

**仍缺（16 项 → Ops 适用）：** GORP-01～11 执行 · POL-01～08 · `GORP-SIGNOFF` · `GECP-SIGNOFF` · 双 TL 矩阵贴 Safe · fundingSource custody · Four-Ledger standing · SEV-1 绑定

### E · 灾备验收已完成（DR_DONE · 0 项）

**仍缺（20 项 → DR 适用）：** RB-G-01～05 drill · REC-06/07/08 · RTO/RPO · Incident tabletop · upgrade rollback drill · PG 治理表 restore drill

**执行入口：** [GORP §5](../../runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md) · [Acceptance-Only §14 映射](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md)

**Gate-2.4：** **G24-FCL-01** · **G24-RECON-01**（只读对账 · 不再重跑）→ 后续见 **§14 Certification**

---

## §14 · Certification Execution Queue（唯一执行序 · 7/12）

**证据根目录：** `evidence/GO_ttg_cert/<stamp>/`  
**每完成一步：** 按 **§15** 更新本 Checklist · **禁止** 开发/Tokenomics/合约/GovFreeze 复审计

| # | Certification | 状态 | 主要 Tier 提升 | 映射 Checklist（完成后升 tier / Ent） | 证据 |
|---|---------------|------|----------------|--------------------------------------|------|
| **1** | **Human UAT** | ☑ | → `HUMAN_DONE` | CORE-01 · FE-01～03 · FE-09～10 · FE-13 · OPS-12 · BASE-06（真人部分） | [Human Cert Coverage Report](TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md) · `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` · HC-001～077 |
| **2** | **Multi Identity Walkthrough** | ☑ | → `HUMAN_DONE` | CORE-02,23 · FE-15 · ID-01～07 · FE-12（B2） | `walkthrough/multi-identity-*` |
| **3** | **Admin Walkthrough** | ☑ | → `HUMAN_DONE` | CORE-03,24 · FE-14 · ADM-01～07 | `walkthrough/admin-*` |
| **4** | **Safe Walkthrough** | ☑ | → `OPS_DONE` | CORE-17 · OPS-03 · ID-10 · SC-12（矩阵草案） | GORP-06 · `walkthrough/safe-*` |
| **5** | **Finance Walkthrough** | ☑ | → `OPS_DONE` | CORE-15 · OPS-02 · ID-09 · FN-11 | GORP-05 · `walkthrough/finance-*` |
| **6** | **Phase B**（总闸 · unpause） | ☑ | → `OPS_DONE` | OPS-11 · BASE-05 升 Ent 关联 · CORE-04～06 认知签字 | `GO_hat_r1_sepolia/<stamp>/phase-b/` · Owner unpause 记录 |
| **7** | **Execute** | ☑ | → `HUMAN_DONE`+`OPS_DONE` | CORE-07 · FE-08 · SC-01,02 · DR-01 | Phase B · Execute tx + 录屏 |
| **8** | **Treasury Spend** | ☐ | → `HUMAN_DONE`+`OPS_DONE` | CORE-08,14 · FN-02 · SC-04 | Phase B · Spend tx + 录屏 |
| **9** | **Unstake** | ☐ | → `HUMAN_DONE`+`OPS_DONE` | SC-06 · CORE-10 · FE-12 | Phase B · Unstake tx + 录屏 |
| **10** | **Incident Tabletop** | ☐ | → `DR_DONE` | DR-10 · CORE-18 · GORP-03 | `incidents/tabletop-*` · Execute fail + Safe 失联 |
| **11** | **Disaster Recovery Drill** | ☐ | → `DR_DONE` | DR-01～09 · CORE-27～29 · UP-01,04 · DB-08 | `drills/*` · RB-G-01～05 · REC-06～08 · RTO/RPO 签字 |
| **12** | **GORP Signoff** | ☐ | → `OPS_DONE`+Ent ☑ | OPS-01,04～10 · CORE-15～17,30 · ID-08,11,12 · CHK-UP-05 · GECP 全表 Ent | `GORP-SIGNOFF.json` · `GECP-SIGNOFF.json` · POL-01～08 |

**执行入口（② only）：**

```bash
# 1 · Human UAT prep（不代替录屏）
bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh

# 1 · signoff（录屏完成后）
bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh \
  --evidence-dir evidence/GO_ttg_cert/<stamp>/human-uat \
  --signer "Sebastian Ward"

# 6～9 · Phase B（Timelock elapsed + UAT signoff + HAT_R1_PHASE_B_PAUSED=0）
bash scripts/dev/run-hat-r1-phase-b-when-ready.sh
```

**Enterprise 100/100 发放条件：** §14 **12/12 ☑** · Human **58/58** · Ops **34/34** · DR **20/20** · 全表 Ent ☑ · `GECP-SIGNOFF.json` · Score **100**

---

## §15 · 每完成一项 · Checklist 更新规程（写死）

1. **存档** — 录屏/纪要/signoff → `evidence/GO_ttg_cert/<stamp>/`（或既有 `GO_govfreeze_v2_human_screen_acceptance/` / `GO_hat_r1_sepolia/`）  
2. **升 Tier** — 仅更新 §14 映射 ID 的 **Tier** 列（→ `HUMAN_DONE` / `OPS_DONE` / `DR_DONE`）· **禁止** 改动 `DEV_DONE` / `TESTNET_DONE` 项  
3. **Ent ☑** — 当单项 Human+Ops+DR（若适用）均达标 → Ent ☐→☑  
4. **重算 %** — 更新文首 Human/Ops/DR 分子 · `CERT_QUEUE=n/12` · Enterprise Score（GORP 权重表 · 见 360° §11）  
5. **禁止** — 重跑 four-ledger · assert GovFreeze · Tokenomics 矩阵 · 合约覆盖审计 · 任何「开发完成度」复验  

**Gate-2.4：** **G24-CERT-01**
