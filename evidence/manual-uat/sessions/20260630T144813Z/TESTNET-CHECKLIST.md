# TESTNET-CHECKLIST · ② Sign-off

**Session:** `20260630T144813Z` · **Commit:** `987bc260` · **① baseline:** `20260630T142222Z`

| ID | § | 检查项 | 方法 | 状态 | □ |
|----|---|--------|------|------|---|
| T-ENV-01 | A | Staging API /health | `probe` | PASS | ☑ |
| T-ENV-02 | A | Staging FE / | `probe` | PASS | ☑ |
| T-ENV-03 | A | deployment_profile=staging | `probe` | PASS | ☑ |
| T-ENV-04 | A | chain_id Sepolia | `probe` | PASS | ☑ |
| T-CHAIN-01 | B | chain.contracts 非空 | `probe` | PASS | ☑ |
| T-CHAIN-02 | B | registry/fee_router/escrow_factory | `probe` | PASS | ☑ |
| T-CHAIN-03 | B | governance/staking/steward pool | `probe` | PASS | ☑ |
| T-ID-01 | C | 登录 API 门闸 | `probe` | PASS | ☑ |
| T-RBAC-01 | C | Admin RBAC | `record-adm-u01-staging-evidence.sh` | PARTIAL | ◐ |
| T-HAT-01 | C | HAT 六角色 | `record-tn-p1-007-008-hat-staging-evidence.sh` | PASS | ☑ |
| T-ORD-01 | D | 订单 S01-S10 | `smoke-phase2-testnet-execution-sprint.sh` | PASS | ☑ |
| T-PROV-01 | D | 商家入驻 | `record-tn-p1-002-provider-onboarding-staging-evidence.sh` | PASS | ☑ |
| T-ESC-01 | D | Escrow | `record-tn-p1-006-escrow-staging-evidence.sh` | PASS | ☑ |
| T-ACQ-01 | D | 收购 PD-009 | `record-tn-p1-003-acquisition-staging-evidence.sh` | PASS | ☑ |
| T-STK-01 | D | 主理人 Stake | `record-tn-p1-004-steward-stake-staging-evidence.sh` | PARTIAL | ◐ |
| T-PSP-01 | D | Stripe test | `smoke-onboarding-testnet.sh` | PASS | ☑ |
| T-GOV-01 | E | 治理 MANUAL-P1 | `human+staging` | PARTIAL | ◐ |
| T-IDX-01 | E | Indexer reconcile | `record-tn-p1-010-indexer-reconcile-staging-evidence.sh` | PASS | ☑ |
| T-COM-01 | E | 社区 C1-C12 | `PHASE2-START-CHECKLIST` | PASS | ☑ |
| T-REG-01 | F | P0/P1 归零 | `defects-registry` | PASS | ☑ |
| T-GRAD-01 | F | 毕业矩阵 | `run-phase2-testnet-closure-governance-audit.sh` | PASS | ☑ |
| T-SIGN-01 | F | Owner sign-off | `signoff` | PARTIAL | ◐ |
