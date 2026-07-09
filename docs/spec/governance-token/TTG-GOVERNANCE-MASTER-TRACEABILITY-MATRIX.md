# TTG Governance Master Traceability Matrix

**Matrix ID:** `TTG-GOV-MASTER-TRACEABILITY`
**Version:** v1-20260616
**Mode:** Governance Master Traceability Matrix Certification · Certification-Only
**Baseline:** [GovFreeze V2 Clean Baseline](GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)
**Parent:** [Full Coverage Certification Report](TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md)

**禁止：** 新增功能 · Tokenomics 变更 · 开发/GovFreeze 复审计

**Tier：** `DEV_DONE` → `TESTNET_DONE` → `HUMAN_DONE` → `OPS_DONE` → `DR_DONE`
**状态：** `PASS` · `PARTIAL` · `OPEN` · `BLOCKED`

**总行数：146** · DEV_DONE **58** · TESTNET_DONE **40** · HUMAN_DONE **48** · OPS_DONE **18** · DR_DONE **0**

**机读键：** `TTG_GOV_MTM: ROWS=146 DEV=58 TN=40 HUMAN=48 OPS=18 DR=0`

**Gate-2.4：** **G24-MTM-01**

---

## 分类 A～G

### A · 已完成（100% 覆盖 · DR_DONE + Ent ☑）

**0 项**

### B · 已开发未验证（DEV_DONE · 58 项）

CHK-CORE-08, CHK-CORE-11, CHK-CORE-12, CHK-CORE-13, CHK-CORE-16, CHK-CORE-18, CHK-CORE-20, CHK-CORE-25, CHK-CORE-26, CHK-CORE-27, CHK-CORE-28, CHK-CORE-29, CHK-CORE-30, CHK-FE-16, CHK-BE-08, CHK-BE-09, CHK-BE-10, CHK-BE-13, CHK-DB-02, CHK-DB-03, CHK-DB-04, CHK-DB-05, CHK-DB-06, CHK-DB-07, CHK-DB-08, CHK-ADM-08, CHK-ID-08, CHK-ID-11, CHK-ID-12, CHK-FN-02, CHK-FN-06, CHK-FN-07, CHK-FN-08, CHK-FN-09, CHK-FN-10, CHK-SC-04, CHK-SC-06, CHK-SC-11, CHK-UP-01, CHK-UP-03, CHK-UP-04, CHK-OPS-01, CHK-OPS-04, CHK-OPS-05, CHK-OPS-06, CHK-OPS-07, CHK-OPS-08, CHK-OPS-09, CHK-OPS-10, CHK-DR-02, CHK-DR-03, CHK-DR-04, CHK-DR-05, CHK-DR-06, CHK-DR-07, CHK-DR-08, CHK-DR-09, CHK-DR-10

### C · 已测试网未真人验证（TESTNET_DONE · 40 项）

CHK-CORE-09, CHK-CORE-10, CHK-CORE-14, CHK-CORE-19, CHK-CORE-21, CHK-CORE-22, CHK-FE-04, CHK-FE-05, CHK-FE-06, CHK-FE-07, CHK-FE-11, CHK-FE-17, CHK-FE-18, CHK-BE-01, CHK-BE-02, CHK-BE-03, CHK-BE-04, CHK-BE-05, CHK-BE-06, CHK-BE-07, CHK-BE-11, CHK-BE-12, CHK-DB-01, CHK-FN-01, CHK-FN-03, CHK-FN-04, CHK-FN-05, CHK-FN-12, CHK-SC-03, CHK-SC-05, CHK-SC-07, CHK-SC-08, CHK-SC-09, CHK-SC-10, CHK-UP-02, CHK-UP-05, CHK-BASE-01, CHK-BASE-02, CHK-BASE-03, CHK-BASE-04

### D · 已真人验证未运营验证（HUMAN_DONE · 48 项）

CHK-CORE-01, CHK-CORE-02, CHK-CORE-03, CHK-CORE-04, CHK-CORE-05, CHK-CORE-06, CHK-CORE-07, CHK-CORE-15, CHK-CORE-17, CHK-CORE-23, CHK-CORE-24, CHK-FE-01, CHK-FE-02, CHK-FE-03, CHK-FE-08, CHK-FE-09, CHK-FE-10, CHK-FE-12, CHK-FE-13, CHK-FE-14, CHK-FE-15, CHK-ADM-01, CHK-ADM-02, CHK-ADM-03, CHK-ADM-04, CHK-ADM-05, CHK-ADM-06, CHK-ADM-07, CHK-ID-01, CHK-ID-02, CHK-ID-03, CHK-ID-04, CHK-ID-05, CHK-ID-06, CHK-ID-07, CHK-ID-09, CHK-ID-10, CHK-FN-11, CHK-SC-01, CHK-SC-02, CHK-SC-12, CHK-OPS-02, CHK-OPS-03, CHK-OPS-11, CHK-OPS-12, CHK-DR-01, CHK-BASE-05, CHK-BASE-06

### E · 已运营验证未灾备验证（OPS_DONE · 18 项）

CHK-CORE-04, CHK-CORE-05, CHK-CORE-06, CHK-CORE-07, CHK-CORE-15, CHK-CORE-17, CHK-FE-08, CHK-ID-09, CHK-ID-10, CHK-FN-11, CHK-SC-01, CHK-SC-02, CHK-SC-12, CHK-OPS-02, CHK-OPS-03, CHK-OPS-11, CHK-DR-01, CHK-BASE-05

### F · 企业级阻塞项

- CHK-CORE-01
- CHK-CORE-07
- CHK-CORE-08
- CHK-FE-08
- CHK-FN-02
- CHK-SC-01
- CHK-SC-02
- CHK-SC-04
- CHK-SC-06
- CHK-OPS-09
- CHK-OPS-10
- CHK-OPS-11
- CHK-OPS-12
- CHK-BASE-06
- Enterprise Ent ☑ **0/146** · Human **48/58** · Ops **18/34** · DR **0/20** · Score **100/100**

### G · Production 阻塞项（③）

- CHK-UP-03（08-4 emergency · ③ KYC/LEG）
- CHK-CORE-17 · CHK-ID-08 · CHK-ID-10（Safe 异名双人 · ③）
- 主网部署 · Production PSP · B-475 prod restore · 十国 CP 全矩阵（若 ③ 宣称）
- ② Governance Production Ready **NOT** · ③ Production GO **NOT**

---

## 1 · Governance Function Matrix（16 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-01 | 真人验收 aggregate | /governance/* | — | — | — | Owner·全角色 | — | — | HUMAN_DONE | OPEN | Owner | Cert#1 UAT signoff |
| CHK-CORE-22 | 页面展示 | /governance/* | multi GET | — | — | public | — | multi | TESTNET_DONE | PASS | Owner | Human UAT pending |
| CHK-CORE-30 | Governance 运营流程 | GORP doc | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | Cert#12 GORP signoff |
| CHK-FE-01 | Hub UAT A1 | /governance | GET pool·rewards | — | — | guest | — | multi | HUMAN_DONE | OPEN | Owner | A1录屏 |
| CHK-FE-02 | Params UAT A2 | /governance/params | GET params | — | — | TTG holder | 45/55 read | DE CP | HUMAN_DONE | OPEN | Owner | A2录屏 |
| CHK-BE-01 | protocol-reference | — | GET /governance/protocol-reference | — | multi-stack | public | GOV mirror | — | TESTNET_DONE | PASS | public | C-GOV-011 |
| CHK-BE-13 | audit observability | /admin | audit endpoints | audit_trail | — | Admin·SRE | — | — | DEV_DONE | OPEN | SRE | TTG SEV-1 bind |
| CHK-OPS-01 | GORP Authority roster | GORP §1.3 | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | GORP-01 sign |
| CHK-OPS-04 | Runbook confirm GORP-02 | GORP | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | GORP-02 |
| CHK-OPS-07 | SEV-1 POL-08 | incident | — | audit_trail | — | Owner | TTG incident | — | DEV_DONE | OPEN | Owner | POL-08 |
| CHK-OPS-09 | GORP-SIGNOFF.json | — | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | Cert#12 |
| CHK-OPS-10 | GECP-SIGNOFF.json | — | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | Enterprise 100 |
| CHK-OPS-12 | HUMAN-SCREEN signoff | /governance/* | — | — | — | Owner | UAT sign | multi | HUMAN_DONE | OPEN | Owner | Cert#1 |
| CHK-BASE-01 | GovFreeze V2 baseline | — | GET /meta | — | multi-stack | observability | — | GovFreeze | TESTNET_DONE | PASS | Owner | baseline freeze record |
| CHK-BASE-02 | Legacy rollback forbid | — | — | — | Legacy stack | — | forbidden rollback | Legacy | TESTNET_DONE | PASS | Owner | assert script |
| CHK-BASE-06 | HUMAN-ENTERPRISE-HAT sign | — | — | — | — | Owner | human sign | — | HUMAN_DONE | OPEN | Owner | HUMAN-ENTERPRISE sign |

---

## 2 · Governance Permission Matrix（7 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-23 | 多角色权限 | /me/*·/governance | RBAC | users | — | all roles | — | — | HUMAN_DONE | OPEN | Owner | Cert#2 |
| CHK-ADM-06 | RBAC SoD ADM-U02 | /admin/rbac | — | users | — | Admin | SoD | — | HUMAN_DONE | OPEN | Owner | POL-06 |
| CHK-ID-08 | Treasury Op POL-01 | Safe+doc | — | — | Safe·GovTreasury | Treasury Op | Safe sign | Global | DEV_DONE | OPEN | Owner | POL-01 sign |
| CHK-ID-09 | Finance Op POL-02 | doc | — | — | 0x270456…a8Aa | Finance Op | fundingSource | DE CP | OPS_DONE | OPEN | Owner | POL-02 sign |
| CHK-ID-10 | Safe Signer POL-03 | Safe UI | — | — | Safe multisig | Safe Signer | multisig | — | OPS_DONE | OPEN | Owner | POL-03 sign |
| CHK-ID-11 | TL Executor on-call | GORP | — | — | 0x904a…20cc | On-call | execute | Timelock | DEV_DONE | OPEN | Owner | on-call roster |
| CHK-ID-12 | POL-06 Seat SoD | /admin | — | users | 0xc997…ad1f | Admin | SoD sign | Region | DEV_DONE | OPEN | Owner | POL-06 sign |

---

## 3 · Governance Treasury Matrix（13 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-08 | Treasury Spend | /governance/params#treasury | — | — | env GovernanceTreasury | V2_TL only | USDC out | Global Treasury | DEV_DONE | BLOCKED | Treasury Op | Cert#8 Phase B |
| CHK-CORE-14 | USDC Treasury 使用 | /governance/params#treasury | GET protocol-reference | — | GovTreasury·P4Cap | public | P1–P4·55% receipt | Global·DE | TESTNET_DONE | PASS | Finance Op | cutover fund-flow |
| CHK-CORE-15 | Finance Operator | doc+params | — | — | — | Finance Op | fundingSource pull | DE CP | OPS_DONE | OPEN | Finance Op | Cert#5 W-F |
| CHK-CORE-16 | Treasury Operator | Safe+doc | — | — | env GovernanceTreasury | Treasury Op | Safe→TL batches | Global Treasury | DEV_DONE | OPEN | Treasury Op | Cert#4 Safe |
| CHK-CORE-17 | Safe 多签 | Safe UI | — | — | Safe multisig | Safe Signer | multisig | — | OPS_DONE | OPEN | Safe Signer | Cert#4 GORP-06 |
| CHK-FE-03 | Treasury policy UAT A3 | /governance/params#gov-params-treasury-policy | GET protocol-reference | — | env GovernanceTreasury | TTG holder | P1–P4 narrative | Global | HUMAN_DONE | OPEN | Owner | A3录屏 |
| CHK-FN-02 | Treasury P1–P4 spend | /governance/params#treasury | — | — | env GovernanceTreasury | V2_TL | USDC spend | Global Treasury | DEV_DONE | BLOCKED | Treasury Op | Cert#8 |
| CHK-FN-11 | fundingSource custody | doc | — | — | 0x270456…a8Aa | Finance Op | USDC pull approve | DE CP | OPS_DONE | OPEN | Finance Op | custody sign |
| CHK-SC-04 | GovTreasury spend | — | — | — | env GovernanceTreasury | V2_TL only | USDC out | Global Treasury | DEV_DONE | BLOCKED | V2_TL | Phase B spend |
| CHK-SC-12 | 双 Timelock 运维矩阵 | Safe+doc | — | — | V2_TL·Legacy_TL | Treasury Op | matrix | Timelock | OPS_DONE | OPEN | Treasury Op | GORP-08 post |
| CHK-OPS-02 | Finance walk GORP-05 | doc | — | — | 0x270456…a8Aa | Finance Op | W-F | DE CP | OPS_DONE | OPEN | Finance Op | Cert#5 |
| CHK-OPS-03 | Safe walk GORP-06 | Safe | — | — | Safe multisig | Treasury Op | Safe ops | Global Treasury | OPS_DONE | OPEN | Treasury Op | Cert#4 |
| CHK-OPS-05 | 双 TL 矩阵 GORP-08 | Safe wall | — | — | V2_TL·Legacy_TL | Treasury Op | matrix posted | Timelock | DEV_DONE | OPEN | Treasury Op | print+post |

---

## 4 · Country Pool Matrix（17 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-09 | Country Pool 45/55 | /governance/params | GET params·country-ledger | cp_epochs | 0x270456…a8Aa | public+session | NPP→45/55 | DE CP | TESTNET_DONE | PASS | Finance Op | four-ledger PASS |
| CHK-FE-13 | CP 45/55 visual D1 | /governance/params | GET country-ledger | cp_epochs | 0x270456…a8Aa | public | 45/55 display | DE CP | HUMAN_DONE | PASS | public | four-ledger page |
| CHK-FE-17 | Vault forwards | /governance/vault-forwards | GET vault-forwards | — | env RegionVault | public | escrow forward | FeeRouter escrow | TESTNET_DONE | PARTIAL | public | orthogonal fee |
| CHK-FE-18 | Fee routes | /governance/fee-routes | GET fee-routes | — | 0x81A8… | public | 65/20/15 | Escrow fee pool | TESTNET_DONE | PARTIAL | public | ≠ NetProfit SSOT |
| CHK-BE-02 | params API | /governance/params | GET /governance/params | — | DE_Ledger·PM | public | 45/55 params | DE CP | TESTNET_DONE | PASS | public | params SSOT |
| CHK-BE-10 | fee-pool-aggregates | — | GET /governance/fee-pool-aggregates | fee aggregates | — | public | Σ read | FeeRouter | DEV_DONE | OPEN | Finance Op | ERP reconcile P2 |
| CHK-BE-11 | state-machines | /governance/params | GET /governance/state-machines | — | 0x270456…a8Aa | public | epoch FSM | DE CP | TESTNET_DONE | PASS | public | state_machines.rs |
| CHK-DB-03 | cp epochs projection | — | — | country_pool_net_profit_epochs | 0x270456…a8Aa | indexer | NPP epochs | DE CP | DEV_DONE | OPEN | SRE | CPNP deferred |
| CHK-DB-04 | accrual lines projection | — | — | country_pool_net_profit_accrual_lines | 0x270456…a8Aa | indexer | accrual lines | DE CP | DEV_DONE | OPEN | SRE | CPNP deferred |
| CHK-FN-03 | CP Revenue 45/55 | /governance/params | GET country-ledger | cp_epochs | 0x270456…a8Aa | Finance Op | NPP split | DE CP | TESTNET_DONE | PASS | Finance Op | cutover split |
| CHK-FN-04 | Steward 45% path | /governance/params | — | — | StewardVault·UnallocVault | Steward | 45% vault | DE CP | TESTNET_DONE | PASS | Steward | eligible/ineligible |
| CHK-FN-05 | Global 55%→V2 TL | /governance/params | GET country-ledger | cp_epochs | 0x270456…a8Aa | Ledger owner TL | 55% USDC | Global Treasury | TESTNET_DONE | PASS | Finance Op | +605000 raw |
| CHK-SC-03 | Legacy TL NetProfit batch | — | — | cp_epochs | Legacy_TL·DE_Ledger | Safe→Legacy TL | batch ops | DE CP | TESTNET_DONE | PASS | Treasury Op | cutover exec logs |
| CHK-SC-08 | DE NetProfit epoch | — | GET country-ledger | cp_epochs | 0x270456…a8Aa | Ledger owner TL | epoch FSM | DE CP | TESTNET_DONE | PASS | Finance Op | drill accrue/close |
| CHK-SC-09 | StewardPathVault | — | — | — | env StewardPathVault | ledger only | 45% eligible | DE CP | TESTNET_DONE | PASS | Steward | depositFromLedger |
| CHK-SC-10 | UnallocatedStewardVault | — | — | — | env UnallocatedStewardVault | ledger only | 45% ineligible | DE CP | TESTNET_DONE | PASS | Finance Op | 495000 unalloc |
| CHK-OPS-06 | settlementPaused policy GORP-09 | doc | — | — | 0x270456…a8Aa | Owner | pause policy | DE CP | DEV_DONE | OPEN | Owner | GORP-09 sign |

---

## 5 · TTG Purchase Matrix（4 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-FE-11 | PM exchange UI | /governance/params | GET ttg-exchange/quote | — | 0x7af1…4016 | Investor | USDC→TTG quote | Primary Market | TESTNET_DONE | PASS | Investor | quote ② |
| CHK-BE-07 | ttg-exchange quote | — | GET /governance/ttg-exchange/quote | — | 0x7af1…4016 | public | USDC→TTG | Primary Market | TESTNET_DONE | PASS | public | RPC read |
| CHK-FN-01 | USDC→TTG Primary Market | /governance/params | GET ttg-exchange/quote | — | 0x7af1…4016 | Investor | USDC in→TTG | Primary Market | TESTNET_DONE | PARTIAL | Investor | live purchase P2 |
| CHK-SC-05 | PM purchase contract | /governance/params | GET quote | — | 0x7af1…4016 | buyer EOA | USDC→TTG | Primary Market | TESTNET_DONE | PARTIAL | Investor | quote ② live skip |

---

## 6 · Proposal/Vote/Queue/Execute Matrix（18 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-04 | 提案 | /governance/proposals/new | GET/POST proposals | governance_proposals | 0x847b…9fcb | proposer | — | — | OPS_DONE | PASS | Governor | Phase A evidence |
| CHK-CORE-05 | 投票 | /governance/proposals/[id] | POST …/vote | governance_proposals | 0x847b…9fcb | voter | — | — | OPS_DONE | PASS | voter | Phase A vote tx |
| CHK-CORE-06 | Queue | /governance/proposals/[id] | GET proposal-status | governance_proposals | Governor→V2_TL | anyone | — | V2 Timelock | OPS_DONE | PASS | Governor | queue tx |
| CHK-CORE-07 | Execute | /governance/proposals/[id] | — | governance_proposals | 0x904a…20cc | anyone | payload effect | V2 Timelock | OPS_DONE | BLOCKED | Timelock executor | Cert#7 Phase B |
| CHK-FE-04 | Proposals list | /governance/proposals | GET proposals | governance_proposals | 0x847b…9fcb | public | — | — | TESTNET_DONE | PASS | public | indexer ② |
| CHK-FE-05 | Proposals new | /governance/proposals/new | — | — | 0x847b…9fcb | proposer | — | — | TESTNET_DONE | PASS | proposer | UI+Phase A |
| CHK-FE-06 | Vote UI | /governance/proposals/[id] | POST vote | governance_proposals | 0x847b…9fcb | voter | — | — | TESTNET_DONE | PASS | voter | Phase A |
| CHK-FE-07 | Queue UI | /governance/proposals/[id] | GET proposal-status | — | 0x847b…9fcb | public | — | V2 Timelock | TESTNET_DONE | PASS | public | queue display |
| CHK-FE-08 | Execute UI | /governance/proposals/[id] | — | — | 0x904a…20cc | public | — | V2 Timelock | OPS_DONE | BLOCKED | public | Phase B PAUSED |
| CHK-FE-16 | Delegate UI | /governance/delegate | GET/POST delegate | — | 0x847b…9fcb | TTG holder | — | — | DEV_DONE | OPEN | TTG holder | live delegate P2 |
| CHK-BE-04 | proposals API | — | GET /governance/proposals | governance_proposals | 0x847b…9fcb | public | — | — | TESTNET_DONE | PASS | public | indexer |
| CHK-BE-05 | vote API | — | POST …/vote | governance_proposals | 0x847b…9fcb | voter | — | — | TESTNET_DONE | PARTIAL | voter | API+wallet dual |
| CHK-BE-06 | proposal-status | — | GET /governance/proposal-status/:id | governance_proposals | 0x847b…9fcb | public | — | V2 Timelock | TESTNET_DONE | PASS | public | queue status |
| CHK-DB-01 | proposals projection | — | — | governance_proposals | Governor events | indexer | — | — | TESTNET_DONE | PASS | SRE | indexer ② |
| CHK-SC-01 | Governor lifecycle+Execute | /governance/proposals/* | — | — | 0x847b…9fcb | proposer·voter | — | Governance | OPS_DONE | PARTIAL | Governor | Phase A yes Execute BLOCKED |
| CHK-SC-02 | V2 Timelock queue/execute | /governance/proposals/[id] | GET proposal-status | — | 0x904a…20cc | anyone | schedule/execute | V2 Timelock | OPS_DONE | PARTIAL | On-call | queue ② exec BLOCKED |
| CHK-OPS-11 | Phase B evidence GORP-07 | /governance/proposals/[id] | — | — | V2_TL·GovTreasury·StakePool | Owner | Execute→Spend→Unstake | multi | OPS_DONE | BLOCKED | Owner | Cert#6-9 |
| CHK-BASE-05 | HAT-R1 Phase A chain | /governance/proposals/* | multi | governance_proposals | Governor·PM·StakePool | HAT wallet | Phase A txs | multi | OPS_DONE | PASS | Owner | 20260616T063612Z |

---

## 7 · Stake/Seat/Unstake Matrix（7 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-10 | Steward 收益路径 | /governance?view=region | GET steward/* | — | StewardVault·UnallocVault | Steward | 45% vault | DE CP | TESTNET_DONE | PASS | Steward | split drill |
| CHK-FE-12 | Stake/Seat B2 | /governance?view=region | GET steward/* | — | StakePool·Seat | Steward | TTG lock | Region stake | HUMAN_DONE | PASS | Steward | Phase A stake |
| CHK-BE-12 | steward APIs | /governance?view=region | GET /steward/* | steward apps | StakePool·Seat | Steward | stake·apply | Region stake | TESTNET_DONE | PARTIAL | Steward | stake ② unstake OPEN |
| CHK-ADM-04 | Steward review walk | /admin | POST steward review | steward apps | 0xc997…ad1f | Admin | Seat gate | Region | HUMAN_DONE | OPEN | Admin | Q-01 TL batch |
| CHK-ADM-08 | Seat→链上 E2E | /admin | — | steward apps | Seat·StakePool | Admin | Seat active | Region | DEV_DONE | OPEN | Admin | GORP-13 ops |
| CHK-SC-06 | StakePool stake/unstake | /governance?view=region | GET steward/* | — | 0x3a89…8784e | Steward | TTG lock/unlock | Region stake | DEV_DONE | PARTIAL | Steward | stake ② unstake BLOCKED |
| CHK-SC-07 | Seat Registry | /governance?view=region | POST applications | steward apps | 0xc997…ad1f | Steward | Seat logic | Region | TESTNET_DONE | PARTIAL | Steward | apply partial |

---

## 8 · Claim/Distribution Matrix（12 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-11 | TTG 持有人 distribution | /governance/distribution-* | GET accruals | investor_accruals | — | Investor | off-chain accrual | — | DEV_DONE | OPEN | Investor | live accrual UAT |
| CHK-CORE-12 | Claim | /governance/distribution-claim | — | investor_accruals | env InvestorDistributionClaim | Investor | USDC claim | — | DEV_DONE | OPEN | Investor | live claim UAT |
| CHK-FE-09 | Accruals UAT A5 | /governance/distribution-accruals | GET accruals | investor_accruals | — | Investor | accrual read | — | HUMAN_DONE | OPEN | Investor | A5录屏 |
| CHK-FE-10 | Claim UAT A6 | /governance/distribution-claim | — | — | env InvestorDistributionClaim | Investor | claim boundary | — | HUMAN_DONE | OPEN | Investor | A6录屏 |
| CHK-BE-08 | investor accruals | /governance/distribution-accruals | GET investor-distribution-accruals | investor_accruals | — | Investor | accrual | — | DEV_DONE | OPEN | Investor | DB dependent |
| CHK-BE-09 | internal distribution write | — | POST /internal/investor-distribution-* | investor_accruals | — | internal | accrual write | — | DEV_DONE | OPEN | Distribution Admin | internal only |
| CHK-DB-02 | rewards projection | /governance | GET /governance/rewards | governance_rewards | — | auth | — | — | DEV_DONE | OPEN | SRE | drift risk P1 |
| CHK-DB-05 | investor accrual reconcile | — | GET accruals | investor_accruals | — | Finance Op | accrual=DB | — | DEV_DONE | OPEN | Finance Op | monthly sign |
| CHK-ADM-05 | Distribution admin write | /admin | internal POST | investor_accruals | — | Distribution Admin | internal write | — | HUMAN_DONE | OPEN | Distribution Admin | internal gate |
| CHK-FN-06 | holder distribution path | /governance/distribution-* | GET accruals | investor_accruals | — | Investor | accrual | — | DEV_DONE | OPEN | Investor | orthogonal steward |
| CHK-FN-09 | Claim live | /governance/distribution-claim | — | investor_accruals | env InvestorDistributionClaim | Investor | USDC out | — | DEV_DONE | OPEN | Investor | live tx P1 |
| CHK-FN-10 | Distribution accrual | /governance/distribution-accruals | GET accruals | investor_accruals | — | Investor | register accrual | — | DEV_DONE | OPEN | Finance Op | internal+read |

---

## 9 · Buyback/Burn Matrix（3 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-13 | Buyback/Burn | /governance/params | — | — | GovTreasury·TTG | Timelock | USDC→buyback·TTG burn | Global Treasury | DEV_DONE | OPEN | Treasury Op | pre-enable tabletop |
| CHK-FN-07 | Buyback | /governance/params | — | — | env GovernanceTreasury | Timelock | USDC buyback | Global Treasury | DEV_DONE | OPEN | Treasury Op | pre-enable |
| CHK-FN-08 | Burn | /governance/params | — | — | 0x2837…62c5 | Timelock | TTG burn | TTG supply | DEV_DONE | OPEN | Treasury Op | pre-enable |

---

## 10 · Upgrade/Proxy Matrix（7 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-25 | Upgrade 流程 | /governance/params | GET state-machines | — | env proxy family | Timelock | — | — | DEV_DONE | OPEN | Owner | UP drill |
| CHK-CORE-26 | Rollback 流程 | — | — | — | env proxy family | Owner | — | — | DEV_DONE | OPEN | Owner | UP-04 drill |
| CHK-UP-01 | Proxy upgrade drill | — | — | — | env proxy family | Timelock | — | — | DEV_DONE | OPEN | Owner | DR upgrade drill |
| CHK-UP-02 | Upgrade authority doc | /governance/params | GET state-machines | — | Proxy·V2_TL | public | Timelock upgrade | Governance | TESTNET_DONE | PASS | Owner | G24-P-UPGRADE machine |
| CHK-UP-03 | Emergency upgrade 08-4 | doc | — | — | Proxy·GovTreasury | Owner | emergency path | Global Treasury | DEV_DONE | OPEN | Owner | 08-4 bind P0③ |
| CHK-UP-04 | Rollback drill | — | — | — | env proxy family | Owner | rollback | — | DEV_DONE | OPEN | Owner | EVD-G10 drill |
| CHK-UP-05 | UPGRADE posture ops | /governance/params | GET protocol-reference | — | env proxy family | Owner | ops confirm | — | TESTNET_DONE | PARTIAL | Owner | GORP sign pending |

---

## 11 · Admin Boundary Matrix（8 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-03 | 管理员 enterprise | /admin | — | audit_trail | — | Admin | — | — | HUMAN_DONE | OPEN | Owner | Cert#3 admin walk |
| CHK-CORE-24 | Admin 权限边界 | /admin | — | audit_trail | — | Admin | no spend | — | HUMAN_DONE | OPEN | Admin | Cert#3 C1-C2 |
| CHK-FE-14 | Admin read C1 | /admin | — | audit_trail | — | Admin | no spend | — | HUMAN_DONE | OPEN | Admin | C1录屏 |
| CHK-DB-07 | audit trail | /admin | audit | audit_trail | — | Admin | — | — | DEV_DONE | OPEN | Admin | incident trail |
| CHK-ADM-01 | Gov admin walkthrough C1 | /admin | — | audit_trail | — | Admin | read only | — | HUMAN_DONE | OPEN | Admin | Cert#3 |
| CHK-ADM-02 | Treasury admin no spend | /admin | — | — | env GovernanceTreasury | Admin | forbidden spend | Global | HUMAN_DONE | OPEN | Admin | C1 boundary |
| CHK-ADM-03 | CP admin no split | /admin | — | cp_epochs | 0x270456…a8Aa | Admin | no split write | DE CP | HUMAN_DONE | OPEN | Admin | no on-chain split btn |
| CHK-ADM-07 | suspend no 45/55 | /admin | suspend | users | — | Admin | gate only | DE CP | HUMAN_DONE | OPEN | Admin | C2录屏 |

---

## 12 · Multi-Identity Matrix（9 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-02 | 多身份 enterprise | /me/identities | GET /me/* | users | — | Traveler…Admin | — | — | HUMAN_DONE | OPEN | Owner | Cert#2 walkthrough |
| CHK-FE-15 | Multi-id B1/B3/B4 | /me/identities | GET /me/* | users | — | multi | — | — | HUMAN_DONE | OPEN | Owner | B1-4录屏 |
| CHK-ID-01 | Traveler boundary | /me/*·/governance | GET /me/* | users | — | Traveler | — | — | HUMAN_DONE | OPEN | Owner | W-T walk |
| CHK-ID-02 | Investor boundary | /governance/distribution-* | GET accruals | investor_accruals | — | Investor | distribution read | — | HUMAN_DONE | OPEN | Owner | W-I walk |
| CHK-ID-03 | Steward boundary | /governance?view=region | GET steward/* | — | 0x3a89…8784e | Steward | stake path | Region | HUMAN_DONE | OPEN | Owner | W-S walk |
| CHK-ID-04 | Guide boundary | /guide/* | — | — | — | Guide | no gov write | — | HUMAN_DONE | OPEN | Owner | isolation walk |
| CHK-ID-05 | Merchant boundary | /provider/* | — | — | — | Merchant | no gov write | — | HUMAN_DONE | OPEN | Owner | isolation walk |
| CHK-ID-06 | Moderator boundary | /moderation/* | — | — | — | Moderator | no Treasury | — | HUMAN_DONE | OPEN | Owner | B4 walk |
| CHK-ID-07 | Admin boundary walk | /admin | — | audit_trail | — | Admin | read/gate | — | HUMAN_DONE | OPEN | Owner | W-A walk |

---

## 13 · Four-Ledger Matrix（10 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-19 | Four-Ledger | /governance/params | GET country-ledger/DE | cp_* | 0x270456…a8Aa | session | 45/55 reconcile | DE CP | TESTNET_DONE | PARTIAL | Finance Op | DB leg OPEN |
| CHK-CORE-20 | DB 对账 | — | internal reconcile | all gov tables | — | Finance Op | — | DE CP | DEV_DONE | OPEN | Finance Op | DATABASE_URL run |
| CHK-CORE-21 | API 对账 | — | GET country-ledger | — | 0x270456…a8Aa | API | chain=API | DE CP | TESTNET_DONE | PASS | SRE | four-ledger json |
| CHK-BE-03 | country-ledger DE | — | GET /governance/country-ledger/:j | cp_epochs·lines | 0x270456…a8Aa | session | ledger read | DE CP | TESTNET_DONE | PASS | session user | four-ledger API |
| CHK-DB-06 | Four-Ledger DB leg | — | reconcile | cp_*·accruals | 0x270456…a8Aa | Finance Op | DB=chain | DE CP | DEV_DONE | OPEN | Finance Op | run w/ DATABASE_URL |
| CHK-FN-12 | Four-Ledger full+DB | /governance/params | GET country-ledger | cp_* | 0x270456…a8Aa | Finance Op | chain=API=page(+DB) | DE CP | TESTNET_DONE | PARTIAL | Finance Op | DB leg OPEN |
| CHK-OPS-08 | Four-Ledger standing GORP-11 | reconcile | reconcile scripts | cp_* | 0x270456…a8Aa | Finance Op | monthly | DE CP | DEV_DONE | OPEN | Finance Op | REC-06 template |
| CHK-DR-07 | Four-Ledger FAIL REC-06 | reconcile | reconcile | cp_* | 0x270456…a8Aa | Finance Op | FAIL triage | DE CP | DEV_DONE | OPEN | Finance Op | standing template |
| CHK-BASE-03 | Enterprise HAT L9 machine | — | — | — | — | — | — | DE CP | TESTNET_DONE | PASS | Owner | L9-RECHECK.json |
| CHK-BASE-04 | CP HAT four-ledger machine | /governance/params | GET country-ledger | — | 0x270456…a8Aa | — | four-ledger | DE CP | TESTNET_DONE | PASS | Finance Op | 20260616T084248Z |

---

## 14 · Disaster Recovery Matrix（15 项）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-18 | Disaster Recovery aggregate | — | — | — | multi-stack | On-call | — | — | DEV_DONE | OPEN | Owner | Cert#10-11 DR |
| CHK-CORE-27 | Timelock 故障恢复 | — | — | — | V2_TL·Legacy_TL | On-call | — | Timelock | DEV_DONE | OPEN | Treasury Op | DR-04 |
| CHK-CORE-28 | Treasury 误转恢复 | — | — | — | env GovernanceTreasury | Treasury Op | USDC mis-route | Global Treasury | DEV_DONE | OPEN | Treasury Op | DR-02 tabletop |
| CHK-CORE-29 | Country Pool 异常恢复 | — | — | cp_epochs | 0x270456…a8Aa | Finance Op | split pause | DE CP | DEV_DONE | OPEN | Finance Op | DR-03·DR-05 |
| CHK-DB-08 | PG backup restore drill | — | — | all gov tables | — | SRE | — | — | DEV_DONE | OPEN | SRE | DR PG restore |
| CHK-SC-11 | settlementPaused drill | — | — | cp_epochs | 0x270456…a8Aa | Owner | pause split | DE CP | DEV_DONE | OPEN | Owner | DR-05 drill |
| CHK-DR-01 | Execute/CallFailed RB-G-01 | /governance/proposals/[id] | — | — | 0x904a…20cc | On-call | failed execute | V2 Timelock | OPS_DONE | OPEN | On-call | Cert#10 tabletop |
| CHK-DR-02 | Treasury mis-transfer RB-G-05 | — | — | — | env GovernanceTreasury | Treasury Op | USDC mis-route | Global Treasury | DEV_DONE | OPEN | Treasury Op | tabletop |
| CHK-DR-03 | CP split interrupt RB-G-03 | — | — | cp_epochs | 0x270456…a8Aa | Finance Op | split fail | DE CP | DEV_DONE | OPEN | Finance Op | DR-03 drill |
| CHK-DR-04 | TL/Safe stall RB-G-02 | Safe | — | — | V2_TL·Safe | Treasury Op | stuck ops | Timelock | DEV_DONE | OPEN | Treasury Op | DR-04 drill |
| CHK-DR-05 | settlementPaused RB-G-04 | — | — | cp_epochs | 0x270456…a8Aa | Owner | pause | DE CP | DEV_DONE | OPEN | Owner | DR-05 drill |
| CHK-DR-06 | fundingSource leak REC-07 | — | — | — | 0x270456…a8Aa | Finance Op | key rotate | DE CP | DEV_DONE | OPEN | Finance Op | REC-07 |
| CHK-DR-08 | CPNP replay REC-08 | — | indexer replay | cp_* | 0x270456…a8Aa | SRE | indexer replay | DE CP | DEV_DONE | OPEN | SRE | REC-08 |
| CHK-DR-09 | RTO/RPO sign | doc | — | — | — | Owner | DR numbers | — | DEV_DONE | OPEN | Owner | RTO/RPO sign |
| CHK-DR-10 | Incident tabletop GORP-03 | — | — | — | multi-stack | Owner | incident | multi | DEV_DONE | OPEN | Owner | Cert#10 HW-06 |

---

## 附录 · Master Index（146 项 · §0→§11 全序）

| MTM ID | 功能 | 页面 | API | DB | 合约 | 权限角色 | 资金流 | 依赖池 | Tier | 状态 | 负责人 | 恢复 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CHK-CORE-01 | 真人验收 aggregate | /governance/* | — | — | — | Owner·全角色 | — | — | HUMAN_DONE | OPEN | Owner | Cert#1 UAT signoff |
| CHK-CORE-02 | 多身份 enterprise | /me/identities | GET /me/* | users | — | Traveler…Admin | — | — | HUMAN_DONE | OPEN | Owner | Cert#2 walkthrough |
| CHK-CORE-03 | 管理员 enterprise | /admin | — | audit_trail | — | Admin | — | — | HUMAN_DONE | OPEN | Owner | Cert#3 admin walk |
| CHK-CORE-04 | 提案 | /governance/proposals/new | GET/POST proposals | governance_proposals | 0x847b…9fcb | proposer | — | — | OPS_DONE | PASS | Governor | Phase A evidence |
| CHK-CORE-05 | 投票 | /governance/proposals/[id] | POST …/vote | governance_proposals | 0x847b…9fcb | voter | — | — | OPS_DONE | PASS | voter | Phase A vote tx |
| CHK-CORE-06 | Queue | /governance/proposals/[id] | GET proposal-status | governance_proposals | Governor→V2_TL | anyone | — | V2 Timelock | OPS_DONE | PASS | Governor | queue tx |
| CHK-CORE-07 | Execute | /governance/proposals/[id] | — | governance_proposals | 0x904a…20cc | anyone | payload effect | V2 Timelock | OPS_DONE | BLOCKED | Timelock executor | Cert#7 Phase B |
| CHK-CORE-08 | Treasury Spend | /governance/params#treasury | — | — | env GovernanceTreasury | V2_TL only | USDC out | Global Treasury | DEV_DONE | BLOCKED | Treasury Op | Cert#8 Phase B |
| CHK-CORE-09 | Country Pool 45/55 | /governance/params | GET params·country-ledger | cp_epochs | 0x270456…a8Aa | public+session | NPP→45/55 | DE CP | TESTNET_DONE | PASS | Finance Op | four-ledger PASS |
| CHK-CORE-10 | Steward 收益路径 | /governance?view=region | GET steward/* | — | StewardVault·UnallocVault | Steward | 45% vault | DE CP | TESTNET_DONE | PASS | Steward | split drill |
| CHK-CORE-11 | TTG 持有人 distribution | /governance/distribution-* | GET accruals | investor_accruals | — | Investor | off-chain accrual | — | DEV_DONE | OPEN | Investor | live accrual UAT |
| CHK-CORE-12 | Claim | /governance/distribution-claim | — | investor_accruals | env InvestorDistributionClaim | Investor | USDC claim | — | DEV_DONE | OPEN | Investor | live claim UAT |
| CHK-CORE-13 | Buyback/Burn | /governance/params | — | — | GovTreasury·TTG | Timelock | USDC→buyback·TTG burn | Global Treasury | DEV_DONE | OPEN | Treasury Op | pre-enable tabletop |
| CHK-CORE-14 | USDC Treasury 使用 | /governance/params#treasury | GET protocol-reference | — | GovTreasury·P4Cap | public | P1–P4·55% receipt | Global·DE | TESTNET_DONE | PASS | Finance Op | cutover fund-flow |
| CHK-CORE-15 | Finance Operator | doc+params | — | — | — | Finance Op | fundingSource pull | DE CP | OPS_DONE | OPEN | Finance Op | Cert#5 W-F |
| CHK-CORE-16 | Treasury Operator | Safe+doc | — | — | env GovernanceTreasury | Treasury Op | Safe→TL batches | Global Treasury | DEV_DONE | OPEN | Treasury Op | Cert#4 Safe |
| CHK-CORE-17 | Safe 多签 | Safe UI | — | — | Safe multisig | Safe Signer | multisig | — | OPS_DONE | OPEN | Safe Signer | Cert#4 GORP-06 |
| CHK-CORE-18 | Disaster Recovery aggregate | — | — | — | multi-stack | On-call | — | — | DEV_DONE | OPEN | Owner | Cert#10-11 DR |
| CHK-CORE-19 | Four-Ledger | /governance/params | GET country-ledger/DE | cp_* | 0x270456…a8Aa | session | 45/55 reconcile | DE CP | TESTNET_DONE | PARTIAL | Finance Op | DB leg OPEN |
| CHK-CORE-20 | DB 对账 | — | internal reconcile | all gov tables | — | Finance Op | — | DE CP | DEV_DONE | OPEN | Finance Op | DATABASE_URL run |
| CHK-CORE-21 | API 对账 | — | GET country-ledger | — | 0x270456…a8Aa | API | chain=API | DE CP | TESTNET_DONE | PASS | SRE | four-ledger json |
| CHK-CORE-22 | 页面展示 | /governance/* | multi GET | — | — | public | — | multi | TESTNET_DONE | PASS | Owner | Human UAT pending |
| CHK-CORE-23 | 多角色权限 | /me/*·/governance | RBAC | users | — | all roles | — | — | HUMAN_DONE | OPEN | Owner | Cert#2 |
| CHK-CORE-24 | Admin 权限边界 | /admin | — | audit_trail | — | Admin | no spend | — | HUMAN_DONE | OPEN | Admin | Cert#3 C1-C2 |
| CHK-CORE-25 | Upgrade 流程 | /governance/params | GET state-machines | — | env proxy family | Timelock | — | — | DEV_DONE | OPEN | Owner | UP drill |
| CHK-CORE-26 | Rollback 流程 | — | — | — | env proxy family | Owner | — | — | DEV_DONE | OPEN | Owner | UP-04 drill |
| CHK-CORE-27 | Timelock 故障恢复 | — | — | — | V2_TL·Legacy_TL | On-call | — | Timelock | DEV_DONE | OPEN | Treasury Op | DR-04 |
| CHK-CORE-28 | Treasury 误转恢复 | — | — | — | env GovernanceTreasury | Treasury Op | USDC mis-route | Global Treasury | DEV_DONE | OPEN | Treasury Op | DR-02 tabletop |
| CHK-CORE-29 | Country Pool 异常恢复 | — | — | cp_epochs | 0x270456…a8Aa | Finance Op | split pause | DE CP | DEV_DONE | OPEN | Finance Op | DR-03·DR-05 |
| CHK-CORE-30 | Governance 运营流程 | GORP doc | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | Cert#12 GORP signoff |
| CHK-FE-01 | Hub UAT A1 | /governance | GET pool·rewards | — | — | guest | — | multi | HUMAN_DONE | OPEN | Owner | A1录屏 |
| CHK-FE-02 | Params UAT A2 | /governance/params | GET params | — | — | TTG holder | 45/55 read | DE CP | HUMAN_DONE | OPEN | Owner | A2录屏 |
| CHK-FE-03 | Treasury policy UAT A3 | /governance/params#gov-params-treasury-policy | GET protocol-reference | — | env GovernanceTreasury | TTG holder | P1–P4 narrative | Global | HUMAN_DONE | OPEN | Owner | A3录屏 |
| CHK-FE-04 | Proposals list | /governance/proposals | GET proposals | governance_proposals | 0x847b…9fcb | public | — | — | TESTNET_DONE | PASS | public | indexer ② |
| CHK-FE-05 | Proposals new | /governance/proposals/new | — | — | 0x847b…9fcb | proposer | — | — | TESTNET_DONE | PASS | proposer | UI+Phase A |
| CHK-FE-06 | Vote UI | /governance/proposals/[id] | POST vote | governance_proposals | 0x847b…9fcb | voter | — | — | TESTNET_DONE | PASS | voter | Phase A |
| CHK-FE-07 | Queue UI | /governance/proposals/[id] | GET proposal-status | — | 0x847b…9fcb | public | — | V2 Timelock | TESTNET_DONE | PASS | public | queue display |
| CHK-FE-08 | Execute UI | /governance/proposals/[id] | — | — | 0x904a…20cc | public | — | V2 Timelock | OPS_DONE | BLOCKED | public | Phase B PAUSED |
| CHK-FE-09 | Accruals UAT A5 | /governance/distribution-accruals | GET accruals | investor_accruals | — | Investor | accrual read | — | HUMAN_DONE | OPEN | Investor | A5录屏 |
| CHK-FE-10 | Claim UAT A6 | /governance/distribution-claim | — | — | env InvestorDistributionClaim | Investor | claim boundary | — | HUMAN_DONE | OPEN | Investor | A6录屏 |
| CHK-FE-11 | PM exchange UI | /governance/params | GET ttg-exchange/quote | — | 0x7af1…4016 | Investor | USDC→TTG quote | Primary Market | TESTNET_DONE | PASS | Investor | quote ② |
| CHK-FE-12 | Stake/Seat B2 | /governance?view=region | GET steward/* | — | StakePool·Seat | Steward | TTG lock | Region stake | HUMAN_DONE | PASS | Steward | Phase A stake |
| CHK-FE-13 | CP 45/55 visual D1 | /governance/params | GET country-ledger | cp_epochs | 0x270456…a8Aa | public | 45/55 display | DE CP | HUMAN_DONE | PASS | public | four-ledger page |
| CHK-FE-14 | Admin read C1 | /admin | — | audit_trail | — | Admin | no spend | — | HUMAN_DONE | OPEN | Admin | C1录屏 |
| CHK-FE-15 | Multi-id B1/B3/B4 | /me/identities | GET /me/* | users | — | multi | — | — | HUMAN_DONE | OPEN | Owner | B1-4录屏 |
| CHK-FE-16 | Delegate UI | /governance/delegate | GET/POST delegate | — | 0x847b…9fcb | TTG holder | — | — | DEV_DONE | OPEN | TTG holder | live delegate P2 |
| CHK-FE-17 | Vault forwards | /governance/vault-forwards | GET vault-forwards | — | env RegionVault | public | escrow forward | FeeRouter escrow | TESTNET_DONE | PARTIAL | public | orthogonal fee |
| CHK-FE-18 | Fee routes | /governance/fee-routes | GET fee-routes | — | 0x81A8… | public | 65/20/15 | Escrow fee pool | TESTNET_DONE | PARTIAL | public | ≠ NetProfit SSOT |
| CHK-BE-01 | protocol-reference | — | GET /governance/protocol-reference | — | multi-stack | public | GOV mirror | — | TESTNET_DONE | PASS | public | C-GOV-011 |
| CHK-BE-02 | params API | /governance/params | GET /governance/params | — | DE_Ledger·PM | public | 45/55 params | DE CP | TESTNET_DONE | PASS | public | params SSOT |
| CHK-BE-03 | country-ledger DE | — | GET /governance/country-ledger/:j | cp_epochs·lines | 0x270456…a8Aa | session | ledger read | DE CP | TESTNET_DONE | PASS | session user | four-ledger API |
| CHK-BE-04 | proposals API | — | GET /governance/proposals | governance_proposals | 0x847b…9fcb | public | — | — | TESTNET_DONE | PASS | public | indexer |
| CHK-BE-05 | vote API | — | POST …/vote | governance_proposals | 0x847b…9fcb | voter | — | — | TESTNET_DONE | PARTIAL | voter | API+wallet dual |
| CHK-BE-06 | proposal-status | — | GET /governance/proposal-status/:id | governance_proposals | 0x847b…9fcb | public | — | V2 Timelock | TESTNET_DONE | PASS | public | queue status |
| CHK-BE-07 | ttg-exchange quote | — | GET /governance/ttg-exchange/quote | — | 0x7af1…4016 | public | USDC→TTG | Primary Market | TESTNET_DONE | PASS | public | RPC read |
| CHK-BE-08 | investor accruals | /governance/distribution-accruals | GET investor-distribution-accruals | investor_accruals | — | Investor | accrual | — | DEV_DONE | OPEN | Investor | DB dependent |
| CHK-BE-09 | internal distribution write | — | POST /internal/investor-distribution-* | investor_accruals | — | internal | accrual write | — | DEV_DONE | OPEN | Distribution Admin | internal only |
| CHK-BE-10 | fee-pool-aggregates | — | GET /governance/fee-pool-aggregates | fee aggregates | — | public | Σ read | FeeRouter | DEV_DONE | OPEN | Finance Op | ERP reconcile P2 |
| CHK-BE-11 | state-machines | /governance/params | GET /governance/state-machines | — | 0x270456…a8Aa | public | epoch FSM | DE CP | TESTNET_DONE | PASS | public | state_machines.rs |
| CHK-BE-12 | steward APIs | /governance?view=region | GET /steward/* | steward apps | StakePool·Seat | Steward | stake·apply | Region stake | TESTNET_DONE | PARTIAL | Steward | stake ② unstake OPEN |
| CHK-BE-13 | audit observability | /admin | audit endpoints | audit_trail | — | Admin·SRE | — | — | DEV_DONE | OPEN | SRE | TTG SEV-1 bind |
| CHK-DB-01 | proposals projection | — | — | governance_proposals | Governor events | indexer | — | — | TESTNET_DONE | PASS | SRE | indexer ② |
| CHK-DB-02 | rewards projection | /governance | GET /governance/rewards | governance_rewards | — | auth | — | — | DEV_DONE | OPEN | SRE | drift risk P1 |
| CHK-DB-03 | cp epochs projection | — | — | country_pool_net_profit_epochs | 0x270456…a8Aa | indexer | NPP epochs | DE CP | DEV_DONE | OPEN | SRE | CPNP deferred |
| CHK-DB-04 | accrual lines projection | — | — | country_pool_net_profit_accrual_lines | 0x270456…a8Aa | indexer | accrual lines | DE CP | DEV_DONE | OPEN | SRE | CPNP deferred |
| CHK-DB-05 | investor accrual reconcile | — | GET accruals | investor_accruals | — | Finance Op | accrual=DB | — | DEV_DONE | OPEN | Finance Op | monthly sign |
| CHK-DB-06 | Four-Ledger DB leg | — | reconcile | cp_*·accruals | 0x270456…a8Aa | Finance Op | DB=chain | DE CP | DEV_DONE | OPEN | Finance Op | run w/ DATABASE_URL |
| CHK-DB-07 | audit trail | /admin | audit | audit_trail | — | Admin | — | — | DEV_DONE | OPEN | Admin | incident trail |
| CHK-DB-08 | PG backup restore drill | — | — | all gov tables | — | SRE | — | — | DEV_DONE | OPEN | SRE | DR PG restore |
| CHK-ADM-01 | Gov admin walkthrough C1 | /admin | — | audit_trail | — | Admin | read only | — | HUMAN_DONE | OPEN | Admin | Cert#3 |
| CHK-ADM-02 | Treasury admin no spend | /admin | — | — | env GovernanceTreasury | Admin | forbidden spend | Global | HUMAN_DONE | OPEN | Admin | C1 boundary |
| CHK-ADM-03 | CP admin no split | /admin | — | cp_epochs | 0x270456…a8Aa | Admin | no split write | DE CP | HUMAN_DONE | OPEN | Admin | no on-chain split btn |
| CHK-ADM-04 | Steward review walk | /admin | POST steward review | steward apps | 0xc997…ad1f | Admin | Seat gate | Region | HUMAN_DONE | OPEN | Admin | Q-01 TL batch |
| CHK-ADM-05 | Distribution admin write | /admin | internal POST | investor_accruals | — | Distribution Admin | internal write | — | HUMAN_DONE | OPEN | Distribution Admin | internal gate |
| CHK-ADM-06 | RBAC SoD ADM-U02 | /admin/rbac | — | users | — | Admin | SoD | — | HUMAN_DONE | OPEN | Owner | POL-06 |
| CHK-ADM-07 | suspend no 45/55 | /admin | suspend | users | — | Admin | gate only | DE CP | HUMAN_DONE | OPEN | Admin | C2录屏 |
| CHK-ADM-08 | Seat→链上 E2E | /admin | — | steward apps | Seat·StakePool | Admin | Seat active | Region | DEV_DONE | OPEN | Admin | GORP-13 ops |
| CHK-ID-01 | Traveler boundary | /me/*·/governance | GET /me/* | users | — | Traveler | — | — | HUMAN_DONE | OPEN | Owner | W-T walk |
| CHK-ID-02 | Investor boundary | /governance/distribution-* | GET accruals | investor_accruals | — | Investor | distribution read | — | HUMAN_DONE | OPEN | Owner | W-I walk |
| CHK-ID-03 | Steward boundary | /governance?view=region | GET steward/* | — | 0x3a89…8784e | Steward | stake path | Region | HUMAN_DONE | OPEN | Owner | W-S walk |
| CHK-ID-04 | Guide boundary | /guide/* | — | — | — | Guide | no gov write | — | HUMAN_DONE | OPEN | Owner | isolation walk |
| CHK-ID-05 | Merchant boundary | /provider/* | — | — | — | Merchant | no gov write | — | HUMAN_DONE | OPEN | Owner | isolation walk |
| CHK-ID-06 | Moderator boundary | /moderation/* | — | — | — | Moderator | no Treasury | — | HUMAN_DONE | OPEN | Owner | B4 walk |
| CHK-ID-07 | Admin boundary walk | /admin | — | audit_trail | — | Admin | read/gate | — | HUMAN_DONE | OPEN | Owner | W-A walk |
| CHK-ID-08 | Treasury Op POL-01 | Safe+doc | — | — | Safe·GovTreasury | Treasury Op | Safe sign | Global | DEV_DONE | OPEN | Owner | POL-01 sign |
| CHK-ID-09 | Finance Op POL-02 | doc | — | — | 0x270456…a8Aa | Finance Op | fundingSource | DE CP | OPS_DONE | OPEN | Owner | POL-02 sign |
| CHK-ID-10 | Safe Signer POL-03 | Safe UI | — | — | Safe multisig | Safe Signer | multisig | — | OPS_DONE | OPEN | Owner | POL-03 sign |
| CHK-ID-11 | TL Executor on-call | GORP | — | — | 0x904a…20cc | On-call | execute | Timelock | DEV_DONE | OPEN | Owner | on-call roster |
| CHK-ID-12 | POL-06 Seat SoD | /admin | — | users | 0xc997…ad1f | Admin | SoD sign | Region | DEV_DONE | OPEN | Owner | POL-06 sign |
| CHK-FN-01 | USDC→TTG Primary Market | /governance/params | GET ttg-exchange/quote | — | 0x7af1…4016 | Investor | USDC in→TTG | Primary Market | TESTNET_DONE | PARTIAL | Investor | live purchase P2 |
| CHK-FN-02 | Treasury P1–P4 spend | /governance/params#treasury | — | — | env GovernanceTreasury | V2_TL | USDC spend | Global Treasury | DEV_DONE | BLOCKED | Treasury Op | Cert#8 |
| CHK-FN-03 | CP Revenue 45/55 | /governance/params | GET country-ledger | cp_epochs | 0x270456…a8Aa | Finance Op | NPP split | DE CP | TESTNET_DONE | PASS | Finance Op | cutover split |
| CHK-FN-04 | Steward 45% path | /governance/params | — | — | StewardVault·UnallocVault | Steward | 45% vault | DE CP | TESTNET_DONE | PASS | Steward | eligible/ineligible |
| CHK-FN-05 | Global 55%→V2 TL | /governance/params | GET country-ledger | cp_epochs | 0x270456…a8Aa | Ledger owner TL | 55% USDC | Global Treasury | TESTNET_DONE | PASS | Finance Op | +605000 raw |
| CHK-FN-06 | holder distribution path | /governance/distribution-* | GET accruals | investor_accruals | — | Investor | accrual | — | DEV_DONE | OPEN | Investor | orthogonal steward |
| CHK-FN-07 | Buyback | /governance/params | — | — | env GovernanceTreasury | Timelock | USDC buyback | Global Treasury | DEV_DONE | OPEN | Treasury Op | pre-enable |
| CHK-FN-08 | Burn | /governance/params | — | — | 0x2837…62c5 | Timelock | TTG burn | TTG supply | DEV_DONE | OPEN | Treasury Op | pre-enable |
| CHK-FN-09 | Claim live | /governance/distribution-claim | — | investor_accruals | env InvestorDistributionClaim | Investor | USDC out | — | DEV_DONE | OPEN | Investor | live tx P1 |
| CHK-FN-10 | Distribution accrual | /governance/distribution-accruals | GET accruals | investor_accruals | — | Investor | register accrual | — | DEV_DONE | OPEN | Finance Op | internal+read |
| CHK-FN-11 | fundingSource custody | doc | — | — | 0x270456…a8Aa | Finance Op | USDC pull approve | DE CP | OPS_DONE | OPEN | Finance Op | custody sign |
| CHK-FN-12 | Four-Ledger full+DB | /governance/params | GET country-ledger | cp_* | 0x270456…a8Aa | Finance Op | chain=API=page(+DB) | DE CP | TESTNET_DONE | PARTIAL | Finance Op | DB leg OPEN |
| CHK-SC-01 | Governor lifecycle+Execute | /governance/proposals/* | — | — | 0x847b…9fcb | proposer·voter | — | Governance | OPS_DONE | PARTIAL | Governor | Phase A yes Execute BLOCKED |
| CHK-SC-02 | V2 Timelock queue/execute | /governance/proposals/[id] | GET proposal-status | — | 0x904a…20cc | anyone | schedule/execute | V2 Timelock | OPS_DONE | PARTIAL | On-call | queue ② exec BLOCKED |
| CHK-SC-03 | Legacy TL NetProfit batch | — | — | cp_epochs | Legacy_TL·DE_Ledger | Safe→Legacy TL | batch ops | DE CP | TESTNET_DONE | PASS | Treasury Op | cutover exec logs |
| CHK-SC-04 | GovTreasury spend | — | — | — | env GovernanceTreasury | V2_TL only | USDC out | Global Treasury | DEV_DONE | BLOCKED | V2_TL | Phase B spend |
| CHK-SC-05 | PM purchase contract | /governance/params | GET quote | — | 0x7af1…4016 | buyer EOA | USDC→TTG | Primary Market | TESTNET_DONE | PARTIAL | Investor | quote ② live skip |
| CHK-SC-06 | StakePool stake/unstake | /governance?view=region | GET steward/* | — | 0x3a89…8784e | Steward | TTG lock/unlock | Region stake | DEV_DONE | PARTIAL | Steward | stake ② unstake BLOCKED |
| CHK-SC-07 | Seat Registry | /governance?view=region | POST applications | steward apps | 0xc997…ad1f | Steward | Seat logic | Region | TESTNET_DONE | PARTIAL | Steward | apply partial |
| CHK-SC-08 | DE NetProfit epoch | — | GET country-ledger | cp_epochs | 0x270456…a8Aa | Ledger owner TL | epoch FSM | DE CP | TESTNET_DONE | PASS | Finance Op | drill accrue/close |
| CHK-SC-09 | StewardPathVault | — | — | — | env StewardPathVault | ledger only | 45% eligible | DE CP | TESTNET_DONE | PASS | Steward | depositFromLedger |
| CHK-SC-10 | UnallocatedStewardVault | — | — | — | env UnallocatedStewardVault | ledger only | 45% ineligible | DE CP | TESTNET_DONE | PASS | Finance Op | 495000 unalloc |
| CHK-SC-11 | settlementPaused drill | — | — | cp_epochs | 0x270456…a8Aa | Owner | pause split | DE CP | DEV_DONE | OPEN | Owner | DR-05 drill |
| CHK-SC-12 | 双 Timelock 运维矩阵 | Safe+doc | — | — | V2_TL·Legacy_TL | Treasury Op | matrix | Timelock | OPS_DONE | OPEN | Treasury Op | GORP-08 post |
| CHK-UP-01 | Proxy upgrade drill | — | — | — | env proxy family | Timelock | — | — | DEV_DONE | OPEN | Owner | DR upgrade drill |
| CHK-UP-02 | Upgrade authority doc | /governance/params | GET state-machines | — | Proxy·V2_TL | public | Timelock upgrade | Governance | TESTNET_DONE | PASS | Owner | G24-P-UPGRADE machine |
| CHK-UP-03 | Emergency upgrade 08-4 | doc | — | — | Proxy·GovTreasury | Owner | emergency path | Global Treasury | DEV_DONE | OPEN | Owner | 08-4 bind P0③ |
| CHK-UP-04 | Rollback drill | — | — | — | env proxy family | Owner | rollback | — | DEV_DONE | OPEN | Owner | EVD-G10 drill |
| CHK-UP-05 | UPGRADE posture ops | /governance/params | GET protocol-reference | — | env proxy family | Owner | ops confirm | — | TESTNET_DONE | PARTIAL | Owner | GORP sign pending |
| CHK-OPS-01 | GORP Authority roster | GORP §1.3 | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | GORP-01 sign |
| CHK-OPS-02 | Finance walk GORP-05 | doc | — | — | 0x270456…a8Aa | Finance Op | W-F | DE CP | OPS_DONE | OPEN | Finance Op | Cert#5 |
| CHK-OPS-03 | Safe walk GORP-06 | Safe | — | — | Safe multisig | Treasury Op | Safe ops | Global Treasury | OPS_DONE | OPEN | Treasury Op | Cert#4 |
| CHK-OPS-04 | Runbook confirm GORP-02 | GORP | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | GORP-02 |
| CHK-OPS-05 | 双 TL 矩阵 GORP-08 | Safe wall | — | — | V2_TL·Legacy_TL | Treasury Op | matrix posted | Timelock | DEV_DONE | OPEN | Treasury Op | print+post |
| CHK-OPS-06 | settlementPaused policy GORP-09 | doc | — | — | 0x270456…a8Aa | Owner | pause policy | DE CP | DEV_DONE | OPEN | Owner | GORP-09 sign |
| CHK-OPS-07 | SEV-1 POL-08 | incident | — | audit_trail | — | Owner | TTG incident | — | DEV_DONE | OPEN | Owner | POL-08 |
| CHK-OPS-08 | Four-Ledger standing GORP-11 | reconcile | reconcile scripts | cp_* | 0x270456…a8Aa | Finance Op | monthly | DE CP | DEV_DONE | OPEN | Finance Op | REC-06 template |
| CHK-OPS-09 | GORP-SIGNOFF.json | — | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | Cert#12 |
| CHK-OPS-10 | GECP-SIGNOFF.json | — | — | — | — | Owner | — | — | DEV_DONE | OPEN | Owner | Enterprise 100 |
| CHK-OPS-11 | Phase B evidence GORP-07 | /governance/proposals/[id] | — | — | V2_TL·GovTreasury·StakePool | Owner | Execute→Spend→Unstake | multi | OPS_DONE | BLOCKED | Owner | Cert#6-9 |
| CHK-OPS-12 | HUMAN-SCREEN signoff | /governance/* | — | — | — | Owner | UAT sign | multi | HUMAN_DONE | OPEN | Owner | Cert#1 |
| CHK-DR-01 | Execute/CallFailed RB-G-01 | /governance/proposals/[id] | — | — | 0x904a…20cc | On-call | failed execute | V2 Timelock | OPS_DONE | OPEN | On-call | Cert#10 tabletop |
| CHK-DR-02 | Treasury mis-transfer RB-G-05 | — | — | — | env GovernanceTreasury | Treasury Op | USDC mis-route | Global Treasury | DEV_DONE | OPEN | Treasury Op | tabletop |
| CHK-DR-03 | CP split interrupt RB-G-03 | — | — | cp_epochs | 0x270456…a8Aa | Finance Op | split fail | DE CP | DEV_DONE | OPEN | Finance Op | DR-03 drill |
| CHK-DR-04 | TL/Safe stall RB-G-02 | Safe | — | — | V2_TL·Safe | Treasury Op | stuck ops | Timelock | DEV_DONE | OPEN | Treasury Op | DR-04 drill |
| CHK-DR-05 | settlementPaused RB-G-04 | — | — | cp_epochs | 0x270456…a8Aa | Owner | pause | DE CP | DEV_DONE | OPEN | Owner | DR-05 drill |
| CHK-DR-06 | fundingSource leak REC-07 | — | — | — | 0x270456…a8Aa | Finance Op | key rotate | DE CP | DEV_DONE | OPEN | Finance Op | REC-07 |
| CHK-DR-07 | Four-Ledger FAIL REC-06 | reconcile | reconcile | cp_* | 0x270456…a8Aa | Finance Op | FAIL triage | DE CP | DEV_DONE | OPEN | Finance Op | standing template |
| CHK-DR-08 | CPNP replay REC-08 | — | indexer replay | cp_* | 0x270456…a8Aa | SRE | indexer replay | DE CP | DEV_DONE | OPEN | SRE | REC-08 |
| CHK-DR-09 | RTO/RPO sign | doc | — | — | — | Owner | DR numbers | — | DEV_DONE | OPEN | Owner | RTO/RPO sign |
| CHK-DR-10 | Incident tabletop GORP-03 | — | — | — | multi-stack | Owner | incident | multi | DEV_DONE | OPEN | Owner | Cert#10 HW-06 |
| CHK-BASE-01 | GovFreeze V2 baseline | — | GET /meta | — | multi-stack | observability | — | GovFreeze | TESTNET_DONE | PASS | Owner | baseline freeze record |
| CHK-BASE-02 | Legacy rollback forbid | — | — | — | Legacy stack | — | forbidden rollback | Legacy | TESTNET_DONE | PASS | Owner | assert script |
| CHK-BASE-03 | Enterprise HAT L9 machine | — | — | — | — | — | — | DE CP | TESTNET_DONE | PASS | Owner | L9-RECHECK.json |
| CHK-BASE-04 | CP HAT four-ledger machine | /governance/params | GET country-ledger | — | 0x270456…a8Aa | — | four-ledger | DE CP | TESTNET_DONE | PASS | Finance Op | 20260616T084248Z |
| CHK-BASE-05 | HAT-R1 Phase A chain | /governance/proposals/* | multi | governance_proposals | Governor·PM·StakePool | HAT wallet | Phase A txs | multi | OPS_DONE | PASS | Owner | 20260616T063612Z |
| CHK-BASE-06 | HUMAN-ENTERPRISE-HAT sign | — | — | — | — | Owner | human sign | — | HUMAN_DONE | OPEN | Owner | HUMAN-ENTERPRISE sign |

---

## 追溯问题一览

| 问题 | 如何读本矩阵 |
|------|--------------|
| **做没做** | Tier ≥ DEV_DONE |
| **测没测（②）** | Tier ≥ TESTNET_DONE · 状态 PASS/PARTIAL |
| **真人测过** | Tier ≥ HUMAN_DONE |
| **运营签字** | Tier ≥ OPS_DONE |
| **灾备 drill** | Tier = DR_DONE |
| **谁能用/不能用** | 「权限角色」列 |
| **钱从哪来/到哪去** | 「资金流」「依赖池」列 |
| **事故谁负责** | 「负责人」列 |
| **如何恢复** | 「恢复」列 + GORP/DR runbook |

**Regenerate:** `python scripts/dev/gen-ttg-governance-master-traceability-matrix.py`
