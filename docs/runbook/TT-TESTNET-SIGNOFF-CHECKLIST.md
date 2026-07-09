# TT-TESTNET-SIGNOFF-CHECKLIST

**Version:** 1.0.0 · **2026-06-30** · **ACTIVE（② 产品验收）**  
**阶段口径：** **② 测试网**（staging · Sepolia · 真回调）— **≠ ③ Production GO**

**前置（写死）：** ① [Manual UAT C1–E2](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) **27/27 PASS** · Configuration/PER **已 FROZEN/GRADUATED** — **禁止**重开配置治理 Sprint。

**毕业 SSOT（上位）：** [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md](TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md) · [PHASE2-TESTNET-ACCEPTANCE.md](PHASE2-TESTNET-ACCEPTANCE.md)

**证据根：** `evidence/manual-uat/sessions/<stamp>/`（`track: testnet-signoff`）+ `evidence/GO_phase2_testnet_graduation/`

**Staging 默认：** API `https://tt-api-staging.fly.dev` · FE `https://tt-web-staging.fly.dev` · `chain_id=11155111`

---

## 0 · 纪律

| 禁止 | 允许 |
|------|------|
| 新增业务功能 · 重构 | Bugfix · 证据 · 回归 · staging 运维 |
| Configuration / PER / Alignment 审计章节 | `verify-cfg-drift-closure` **维护闸**（fail → DEFECT/REG） |
| ① curl 绿冒充 ② 签字 | 真实 staging API · 浏览器 · 链上/钱包（MANUAL-P1） |
| ISS-007 窄切片 GO 冒充全矩阵 | 本清单逐项 PASS + 域证据脚本 exit 0 |

**登记：**
```bash
python scripts/dev/record-testnet-signoff-item.py --id T-ENV-01 --status PASS
python scripts/dev/record-testnet-signoff-item.py --id T-G04 --status FAIL --note "…"
```

**Kickoff：**
```bash
bash scripts/dev/run-testnet-signoff-kickoff.sh
```

---

## 1 · 清单（② Testnet Sign-off · 产品轨）

> □ 未验 · ☑ PASS · ✗ FAIL · ⊘ BLOCKED

### A · 环境与可达性

| ID | 检查项 | 验证方式 | □ |
|----|--------|----------|---|
| T-ENV-01 | Staging API `/health` 200 | 探针 | □ |
| T-ENV-02 | Staging FE `/` 可达 | 探针 | □ |
| T-ENV-03 | `GET /meta/build` · `deployment_profile=staging` | 探针 | □ |
| T-ENV-04 | `chain_id=11155111`（Sepolia） | `/meta` | □ |

### B · 链上合约 / Meta（产品读面）

| ID | 检查项 | 验证方式 | □ |
|----|--------|----------|---|
| T-CHAIN-01 | `chain.contracts` 非空 | `/meta` | □ |
| T-CHAIN-02 | registry · fee_router · escrow_factory 地址有效 | `/meta` | □ |
| T-CHAIN-03 | governance_token · guide_staking · steward pool | `/meta` | □ |

### C · 身份 · 权限 · Admin

| ID | 检查项 | 验证方式 | □ |
|----|--------|----------|---|
| T-ID-01 | Staging 注册/登录 API 可用 | ephemeral 或 seed | □ |
| T-RBAC-01 | Admin RBAC 矩阵 | `record-adm-u01-staging-evidence.sh` | □ |
| T-HAT-01 | 六角色 HAT / multi-demo | `record-tn-p1-007-008-hat-staging-evidence.sh` | □ |

### D · 核心业务走廊

| ID | 检查项 | 验证方式 | □ |
|----|--------|----------|---|
| T-ORD-01 | 订单全链 S01–S10 | `smoke-phase2-testnet-execution-sprint.sh` | □ |
| T-PROV-01 | 商家入驻 | `record-tn-p1-002-provider-onboarding-staging-evidence.sh` | □ |
| T-ESC-01 | Escrow WEB3-P2-003 | `record-tn-p1-006-escrow-staging-evidence.sh` | □ |
| T-ACQ-01 | 收购 PD-009 | `record-tn-p1-003-acquisition-staging-evidence.sh` | □ |
| T-STK-01 | 主理人 Stake Sepolia | `record-tn-p1-004-steward-stake-staging-evidence.sh` | □ |
| T-PSP-01 | Stripe test webhook | `smoke-onboarding-testnet.sh` | □ |

### E · 治理 · Indexer · 社区

| ID | 检查项 | 验证方式 | □ |
|----|--------|----------|---|
| T-GOV-01 | 治理提案读面 + MANUAL-P1 | staging API + 钱包（人工） | □ |
| T-IDX-01 | Indexer reconcile compound | `record-tn-p1-010-indexer-reconcile-staging-evidence.sh` | □ |
| T-COM-01 | 社区 C1–C12 宽轨 | [PHASE2-START-CHECKLIST C1–C12](PHASE2-START-CHECKLIST.md) 证据 | □ |

### F · 回归 · 毕业闸

| ID | 检查项 | 验证方式 | □ |
|----|--------|----------|---|
| T-REG-01 | Open Testnet P0/P1 = 0 | defects-registry + burn-down | □ |
| T-GRAD-01 | 毕业矩阵 blocking_open = 0 | `run-phase2-testnet-closure-governance-audit.sh` | □ |
| T-SIGN-01 | Owner Sign-off G-09 | `signoff/TESTNET-SIGNOFF-<stamp>.md` | □ |

**合计：** 22 项（机读探针 7 + 域证据脚本 12 + 毕业/签字 3）

---

## 2 · 签字行（② Testnet Sign-off）

| 项 | 值 |
|----|-----|
| 验收阶段 | ② 测试网 |
| ① 基线 | Manual UAT 27/27 PASS · Session `20260630T142222Z` |
| git SHA | |
| Reviewer | |
| Date (UTC) | |
| 结论 | **22/22 PASS** / 部分 |
| 裁决键 | `TT_TESTNET_SIGNOFF: CLOSED` / `OPEN` |

**诚实边界：** 本签字 **≠** `TT_TESTNET_GRADUATION: CLOSED`（须 [G-01～G-09](TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md)）· **≠** ③ Production GO。

---

*End of TT-TESTNET-SIGNOFF-CHECKLIST v1.0.0*
