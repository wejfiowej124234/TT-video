# TTG Governance Enterprise Closure Program（GECP）

**Program ID:** `TTG-GECP`  
**Version:** v1-20260616-cert-only  
**Baseline SSOT:** **GovFreeze V2 Clean Baseline**（**FROZEN** · [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)）  
**Phase:** **② Sepolia** · **≠** ③ Production Go-Live  

## Certification-Only Mode（ACTIVE · 2026-06-16）

| 停止 | 允许 |
|------|------|
| Governance **开发**审计 | **Human Certification** |
| Tokenomics 审计 | **Operations Certification** |
| Smart Contract 审计 | **Disaster Recovery Certification** |
| GovFreeze V2 复验 | 更新 [Final Closure Checklist](../spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) §14～§15 |
| TESTNET / DEV 完成度复计 | GORP / Human 录屏 / Phase B / DR drill / Signoff |

**唯一执行序（12 步）：** 见 Final Checklist **§14** · 当前 **6/12 ☑ · active #7** · 目标 Human/Ops/DR **→100%** · Enterprise **99→100**

**Discipline:** **不**检查代码 · **不**重复机读 PASS · **只**验收签字与 walkthrough 证据

**唯一验收问题：** Certification 队列 **12/12 ☑** + Final Checklist Ent **146/146 ☑**

**相关 SSOT：** [GORP](TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md) · [Acceptance-Only](TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md) · Final Checklist §13 对账（只读 · 不再重跑）

---

## 30 项核心闸（映射 Final Checklist §0）

| # | 闸 | Final Checklist ID | 当前 |
|---|-----|-------------------|------|
| 1 | 真人验收 | CHK-UAT-* | ☐ |
| 2 | 多身份 | CHK-ID-* | ☐ |
| 3 | 管理员 | CHK-ADM-* | ☐ |
| 4 | 提案 | CHK-LC-04 | ☐ |
| 5 | 投票 | CHK-LC-05 | ☐ |
| 6 | Queue | CHK-LC-06 | ☐ |
| 7 | Execute | CHK-LC-07 | ☐ |
| 8 | Treasury Spend | CHK-LC-08 | ☐ |
| 9 | Country Pool 45/55 | CHK-FN-03 | ☐ |
| 10 | Steward 收益路径 | CHK-FN-04 | ☐ |
| 11 | TTG 持有人收益路径 | CHK-FN-05 | ☐ |
| 12 | Claim | CHK-LC-12 | ☐ |
| 13 | Buyback/Burn | CHK-LC-13 | ☐ |
| 14 | USDC Treasury 使用流程 | CHK-FN-02 | ☐ |
| 15 | Finance Operator | CHK-OPS-02 | ☐ |
| 16 | Treasury Operator | CHK-OPS-01 | ☐ |
| 17 | Safe 多签 | CHK-OPS-03 | ☐ |
| 18 | Disaster Recovery | CHK-DR-* | ☐ |
| 19 | Four-Ledger | CHK-FN-06 | ☐ |
| 20 | DB 对账 | CHK-BE-04 | ☐ |
| 21 | API 对账 | CHK-BE-03 | ☐ |
| 22 | 页面展示 | CHK-FE-* | ☐ |
| 23 | 多角色权限 | CHK-ID-* | ☐ |
| 24 | Admin 权限边界 | CHK-ADM-* | ☐ |
| 25 | Upgrade 流程 | CHK-UP-01 | ☐ |
| 26 | Rollback 流程 | CHK-UP-02 | ☐ |
| 27 | Timelock 故障恢复 | CHK-DR-04 | ☐ |
| 28 | Treasury 误转恢复 | CHK-DR-02 | ☐ |
| 29 | Country Pool 异常恢复 | CHK-DR-03 | ☐ |
| 30 | Governance 运营流程 | CHK-OPS-04 | ☐ |

**Enterprise 100/100：** 上表 **30/30 ☑** + Final Checklist **全部 ☑** + `GECP-SIGNOFF.json`

---

## A · 已验证（enterprise 签字/证据已闭 · 不列机读 PASS）

| ID | 项 | 证据 |
|----|-----|------|
| **AV-01** | GovFreeze V2 基线冻结记录 | `record-gov-freeze-v2-sepolia-baseline-freeze.sh` · baseline freeze doc |
| **AV-02** | DE 四账 **API 腿** 与链/页一致（单次） | `20260616T084248Z/four-ledger-reconcile.json` |

> **说明：** AV-02 **≠** 四账 enterprise 全闭（DB 腿 ☐）· **≠** Four-Ledger 闸 #19 enterprise ☑

---

## B · 未验证

30 项闸中 **28 项** + Final Checklist 中 **绝大部分子项**（见 Checklist 全文 · 凡 ☐ 即未验证）

---

## C · 缺真人证据

| 簇 | 项 |
|----|-----|
| **C-01** | G24-HUMAN-UAT A1～D4 · signoff |
| **C-02** | 多身份 B1～B4 · W-T/I/S/A |
| **C-03** | Admin C1～C2 |
| **C-04** | 提案/投票/Queue **enterprise 认知**（Phase A 链上 **≠** 真人闭包） |
| **C-05** | Execute · Spend · Unstake · Phase B |
| **C-06** | Safe · Finance walkthrough 录屏 |
| **C-07** | Enterprise HAT 真人 signoff 分离 |
| **C-08** | Claim / Buyback live 钱包 |

---

## D · 缺运营证据

| 簇 | 项 |
|----|-----|
| **D-01** | GORP-01～10 执行 · `GORP-SIGNOFF` |
| **D-02** | POL-01～06 · Authority roster |
| **D-03** | 双 Timelock 矩阵贴 Safe |
| **D-04** | Four-Ledger **standing** 月次 |
| **D-05** | Finance/Treasury Operator 名册 |
| **D-06** | Admin Seat→链上 Q-01 E2E ops |
| **D-07** | TTG SEV-1 绑 incident |

---

## E · 缺灾备证据

| 簇 | 项 |
|----|-----|
| **E-01** | Execute/CallFailed drill |
| **E-02** | Safe 失联 drill |
| **E-03** | Treasury 误转 tabletop |
| **E-04** | settlementPaused drill |
| **E-05** | Split 中断 drill |
| **E-06** | RTO/RPO 数字 |
| **E-07** | Upgrade rollback drill |

---

## F · 缺签字证据

| 簇 | 项 |
|----|-----|
| **F-01** | `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` |
| **F-02** | `GORP-AUTHORITY-ROSTER-SIGNED.md` |
| **F-03** | `GORP-SIGNOFF.json` / `GECP-SIGNOFF.json` |
| **F-04** | `HUMAN-ENTERPRISE-HAT-SIGNOFF.json` |
| **F-05** | Finance 月结对账签字页 |
| **F-06** | POL-08 SEV-1（② 可 Owner 单人 · ③ 异名双人） |

---

## G · Production Blockers

| ID | 阻塞 |
|----|------|
| **PB-01** | Final Checklist **未全 ☑** |
| **PB-02** | 30 项闸 **未全 ☑** |
| **PB-03** | Safe 异名 · Operator SoD |
| **PB-04** | KYC/LEG · 08-4 Treasury 控制路径 |
| **PB-05** | 主网 · PSP · B-475 prod |
| **PB-06** | 十国 CP（若 ③ 全矩阵） |

---

## H · P0

真人 UAT · 多身份 · Admin · Phase B（Execute/Spend/Unstake）· Safe 名册+录屏 · POL/GORP 签字 · 桌演 · pause 政策 · fundingSource custody · 双 TL 矩阵 · 误转/Execute DR · #15～17 · #18 核心 · #30

---

## I · P1

DB 对账 · CPNP · Claim/distribution · Seat E2E · Buyback · ERP 月结 · upgrade drill · 多国 split · eligible steward 45% · Four-Ledger standing

---

## J · P2

live purchase · delegate · LEG-XJ-05 · Legacy owner · RPC/quorum

---

## Enterprise 100/100 距离

| 指标 | 值 |
|------|-----|
| 30 项闸 ☑ | **0 / 30** |
| Final Checklist ☑ | **2 / 全表**（CHK-BE-03 部分 · baseline 记录） |
| Enterprise Score | **53 / 100** |
| Governance Production Ready | **10 / 100** |
| **Verdict** | **NOT Enterprise 100/100** |

**闭包路径：** 仅 [Final Closure Checklist](../spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) ☐→☑ · **无** 新开发

**签核证据目录：** `evidence/GO_ttg_gecp/<stamp>/GECP-SIGNOFF.json`

**机读键：** `TTG_GECP: CLOSURE=OPEN CHECKED=2 TOTAL=ALL`
