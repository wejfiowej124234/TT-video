# MTM-146 AI Functional Sweep · Gap List

**Stamp:** `20260616T115725Z`
**SSOT:** MTM 146 · GovFreeze V2

**Summary:** PASS=31 · PARTIAL=115 · FAIL=0

| MTM ID | 功能 | AI | MTM | Tier | Reason |
|---|---|---|---|---|---|
| CHK-CORE-01 | 真人验收 aggregate | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-CORE-02 | 多身份 enterprise | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-CORE-03 | 管理员 enterprise | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-CORE-04 | 提案 | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-CORE-05 | 投票 | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-CORE-06 | Queue | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-CORE-07 | Execute | **PARTIAL** | BLOCKED | DEV_DONE | Phase B blocked |
| CHK-CORE-08 | Treasury Spend | **PARTIAL** | BLOCKED | DEV_DONE | Phase B blocked |
| CHK-CORE-09 | Country Pool 45/55 | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-CORE-10 | Steward 收益路径 | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-CORE-11 | TTG 持有人 distribution | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-CORE-12 | Claim | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-CORE-13 | Buyback/Burn | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-CORE-14 | USDC Treasury 使用 | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-CORE-15 | Finance Operator | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-CORE-16 | Treasury Operator | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-CORE-17 | Safe 多签 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-CORE-18 | Disaster Recovery aggregate | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-CORE-19 | Four-Ledger | **PARTIAL** | PARTIAL | TESTNET_DONE | DB leg open |
| CHK-CORE-20 | DB 对账 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-CORE-21 | API 对账 | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-CORE-22 | 页面展示 | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-CORE-23 | 多角色权限 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-CORE-24 | Admin 权限边界 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-CORE-25 | Upgrade 流程 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-CORE-26 | Rollback 流程 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-CORE-27 | Timelock 故障恢复 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-CORE-28 | Treasury 误转恢复 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-CORE-29 | Country Pool 异常恢复 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-CORE-30 | Governance 运营流程 | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-FE-01 | Hub UAT A1 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-02 | Params UAT A2 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-03 | Treasury policy UAT A3 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-04 | Proposals list | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-FE-05 | Proposals new | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-FE-06 | Vote UI | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-FE-07 | Queue UI | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-FE-08 | Execute UI | **PARTIAL** | BLOCKED | DEV_DONE | Phase B blocked |
| CHK-FE-09 | Accruals UAT A5 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-10 | Claim UAT A6 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-11 | PM exchange UI | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-FE-12 | Stake/Seat B2 | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-FE-13 | CP 45/55 visual D1 | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-FE-14 | Admin read C1 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-15 | Multi-id B1/B3/B4 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-16 | Delegate UI | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FE-17 | Vault forwards | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-FE-18 | Fee routes | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-BE-01 | protocol-reference | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BE-02 | params API | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BE-03 | country-ledger DE | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-BE-04 | proposals API | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BE-05 | vote API | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-BE-06 | proposal-status | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BE-07 | ttg-exchange quote | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BE-08 | investor accruals | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-BE-09 | internal distribution write | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-BE-10 | fee-pool-aggregates | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-BE-11 | state-machines | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BE-12 | steward APIs | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-BE-13 | audit observability | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-DB-01 | proposals projection | **PARTIAL** | PASS | TESTNET_DONE | out of sweep scope |
| CHK-DB-02 | rewards projection | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-DB-03 | cp epochs projection | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-DB-04 | accrual lines projection | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-DB-05 | investor accrual reconcile | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-DB-06 | Four-Ledger DB leg | **PARTIAL** | OPEN | DEV_DONE | DB leg open |
| CHK-DB-07 | audit trail | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-DB-08 | PG backup restore drill | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-ADM-01 | Gov admin walkthrough C1 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-02 | Treasury admin no spend | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-03 | CP admin no split | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-04 | Steward review walk | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-05 | Distribution admin write | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-06 | RBAC SoD ADM-U02 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-07 | suspend no 45/55 | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ADM-08 | Seat→链上 E2E | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-01 | Traveler boundary | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-ID-02 | Investor boundary | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-03 | Steward boundary | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-04 | Guide boundary | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-05 | Merchant boundary | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-06 | Moderator boundary | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-07 | Admin boundary walk | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-ID-08 | Treasury Op POL-01 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-ID-09 | Finance Op POL-02 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-ID-10 | Safe Signer POL-03 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-ID-11 | TL Executor on-call | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-ID-12 | POL-06 Seat SoD | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FN-01 | USDC→TTG Primary Market | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-FN-02 | Treasury P1–P4 spend | **PARTIAL** | BLOCKED | DEV_DONE | Phase B blocked |
| CHK-FN-03 | CP Revenue 45/55 | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-FN-04 | Steward 45% path | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-FN-05 | Global 55%→V2 TL | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-FN-06 | holder distribution path | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FN-07 | Buyback | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FN-08 | Burn | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FN-09 | Claim live | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FN-10 | Distribution accrual | **PARTIAL** | OPEN | DEV_DONE | AI hit dev open |
| CHK-FN-11 | fundingSource custody | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-FN-12 | Four-Ledger full+DB | **PARTIAL** | PARTIAL | TESTNET_DONE | DB leg open |
| CHK-SC-01 | Governor lifecycle+Execute | **PARTIAL** | PARTIAL | DEV_DONE | MTM partial |
| CHK-SC-02 | V2 Timelock queue/execute | **PARTIAL** | PARTIAL | DEV_DONE | MTM partial |
| CHK-SC-03 | Legacy TL NetProfit batch | **PARTIAL** | PASS | TESTNET_DONE | out of sweep scope |
| CHK-SC-04 | GovTreasury spend | **PARTIAL** | BLOCKED | DEV_DONE | Phase B blocked |
| CHK-SC-05 | PM purchase contract | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-SC-06 | StakePool stake/unstake | **PARTIAL** | PARTIAL | DEV_DONE | MTM partial |
| CHK-SC-07 | Seat Registry | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-SC-08 | DE NetProfit epoch | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-SC-09 | StewardPathVault | **PARTIAL** | PASS | TESTNET_DONE | DB leg open |
| CHK-SC-10 | UnallocatedStewardVault | **PARTIAL** | PASS | TESTNET_DONE | DB leg open |
| CHK-SC-11 | settlementPaused drill | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-SC-12 | 双 Timelock 运维矩阵 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-UP-01 | Proxy upgrade drill | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-UP-02 | Upgrade authority doc | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-UP-03 | Emergency upgrade 08-4 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-UP-04 | Rollback drill | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-UP-05 | UPGRADE posture ops | **PARTIAL** | PARTIAL | TESTNET_DONE | MTM partial |
| CHK-OPS-01 | GORP Authority roster | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-02 | Finance walk GORP-05 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-03 | Safe walk GORP-06 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-04 | Runbook confirm GORP-02 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-05 | 双 TL 矩阵 GORP-08 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-06 | settlementPaused policy GORP-09 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-07 | SEV-1 POL-08 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-08 | Four-Ledger standing GORP-11 | **PARTIAL** | OPEN | DEV_DONE | no sweep hit |
| CHK-OPS-09 | GORP-SIGNOFF.json | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-OPS-10 | GECP-SIGNOFF.json | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-OPS-11 | Phase B evidence GORP-07 | **PARTIAL** | BLOCKED | DEV_DONE | Phase B blocked |
| CHK-OPS-12 | HUMAN-SCREEN signoff | **PARTIAL** | OPEN | DEV_DONE | Human signoff |
| CHK-DR-01 | Execute/CallFailed RB-G-01 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-02 | Treasury mis-transfer RB-G-05 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-03 | CP split interrupt RB-G-03 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-04 | TL/Safe stall RB-G-02 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-05 | settlementPaused RB-G-04 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-06 | fundingSource leak REC-07 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-07 | Four-Ledger FAIL REC-06 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-08 | CPNP replay REC-08 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-09 | RTO/RPO sign | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-DR-10 | Incident tabletop GORP-03 | **PARTIAL** | OPEN | DEV_DONE | DR ops |
| CHK-BASE-01 | GovFreeze V2 baseline | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BASE-02 | Legacy rollback forbid | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BASE-03 | Enterprise HAT L9 machine | **PARTIAL** | PASS | TESTNET_DONE | DB leg open |
| CHK-BASE-04 | CP HAT four-ledger machine | **PASS** | PASS | TESTNET_DONE | fl aligned |
| CHK-BASE-05 | HAT-R1 Phase A chain | **PASS** | PASS | TESTNET_DONE | sweep aligned |
| CHK-BASE-06 | HUMAN-ENTERPRISE-HAT sign | **PARTIAL** | OPEN | DEV_DONE | Human signoff |