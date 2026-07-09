# Test Accounts SSOT · Full Convergence Sign-off

**UTC:** `2026-07-01T01:42:39Z`  
**Evidence:** `evidence/GO_test_accounts_ssot/20260701T014154Z/`

## 机读裁决

```text
TT_TEST_ACCOUNTS_SSOT_FULL_VALIDATION: PASS
TT_TEST_ACCOUNTS_SSOT_CONVERGENCE: PASS (27/27)
TT_TEST_ACCOUNTS_STAGING_PROBE: PASS
TT_TEST_ACCOUNTS_E1_STAGING_SKIP: CONFIRMED
TT_TEST_ACCOUNTS_IMMUTABLE_IDS: C1,C2,C3,C4,E1,E2
TT_TEST_ACCOUNTS_GOVERNANCE: BACKWARD_COMPATIBLE_ADD_NEW_ID_ON_BREAK
```

## Defect / Drift / Conflict — 清零

| 类别 | 状态 |
|------|------|
| **Defect** | 0 — 探针误测 E1 on Staging 已修复 |
| **Drift** | 0 — YAML ↔ JSON Registry 同步 |
| **Conflict** | 0 — 文档重复 §2.1 已移除 · 机读键统一 IMMUTABLE_IDS |
| **Expected Difference** | E1 Local-only · 已 CONFIRMED |

## SSOT 层级（单一真源）

| 层 | 路径 |
|----|------|
| **Registry（邮箱真源）** | `registry/test-accounts-business-immutable.v1.yaml` |
| **Registry JSON** | `evidence/manual-uat/summary/test-accounts-registry.v1.json` |
| **一页日常** | `docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md` |
| **完整规范** | `docs/runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md` v1.3.7 |
| **变更闸门** | `docs/runbook/TT-TEST-ACCOUNT-CHANGE.md` |
| **启栈/排错** | `docs/测试账号与本地联调.md`（无平行账号表） |

## 验证项

- Convergence scan **27/27 PASS**
- Staging C1–C4/E2 login + 21 FE routes **PASS**
- E1 login **SKIP** on Staging（预期）
- Dashboard regenerated
- phase3-ssot-registry updated

## 复跑

```bash
bash scripts/dev/run-test-accounts-ssot-full-validation.sh
```
