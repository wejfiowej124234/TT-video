# TT-TEST-ACCOUNT-CHANGE · 变更记录模板

**用途：** 任何 C1–E2 **邮箱变更**、新增固定 Business ID、或 Registry 同步 — **须** 填写本模板并 Owner 签字。  
**Immutable ID SSOT：** [registry/test-accounts-business-immutable.v1.yaml](../../registry/test-accounts-business-immutable.v1.yaml)  
**完整纪律：** [TT-LOCAL-TEST-ACCOUNTS-MATRIX.md §9](./TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-test-account-change-gate)

---

## 机读键

```text
TT_TEST_ACCOUNT_CHANGE: <OPEN|APPLIED|REJECTED>
TT_TEST_ACCOUNTS_IMMUTABLE_IDS: C1,C2,C3,C4,E1,E2
```

---

## 变更类型（勾选一项）

- [ ] **Email swap only**（允许 · 保持 ID + business_role 不变）
- [ ] **New Immutable ID**（破坏性语义变更 · **须新增** C7/E3 等 · **禁止**改现有 ID 含义）
- [ ] **Registry / 文档 / 探针同步**（无邮箱变更）

---

## 变更摘要

| 字段 | 值 |
|------|-----|
| **Change ID** | `TT-TAC-YYYYMMDD-NNN` |
| **Requested UTC** | |
| **Owner** | |
| **Status** | OPEN / APPLIED / REJECTED |

### 若仅为 Email swap（示例）

| Immutable ID | business_role（不可变） | Old email | New email |
|--------------|-------------------------|-----------|-----------|
| C2 | TouristTraveler | tourist@test.com | traveler@test.com |

**禁止示例：** ~~C2 改为 Merchant~~ · ~~C4 承担 Tourist~~

---

## 向后兼容

- [ ] 旧邮箱在过渡期仍可用（推荐）或已文档声明废弃日期
- [ ] 所有脚本/探针仍按 **Immutable ID** 引用（非硬编码语义）
- [ ] 破坏性调整已 **新增 ID** 而非修改现有 ID

---

## 同步清单（Applied 前全部勾选）

- [ ] `registry/test-accounts-business-immutable.v1.yaml`
- [ ] `docs/runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md` §3–§4
- [ ] `docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md`
- [ ] `crates/api/src/chain_off/auth.rs`（或 seed 真源）
- [ ] `scripts/dev/verify-seed-test-accounts-login.ps1` · Step 6b4/6b5
- [ ] `scripts/dev/probe-manual-uat-checklist-routes.sh`
- [ ] `docs/测试账号与本地联调.md`（仅操作节 · 无平行账号表）
- [ ] `evidence/manual-uat/summary/test-accounts-registry.v1.json`
- [ ] `bash scripts/dev/run-test-accounts-ssot-convergence-scan.sh` → PASS

---

## Owner 签字

```text
TT_TEST_ACCOUNT_CHANGE: APPLIED
Signed: <name> · <UTC>
Evidence: evidence/GO_test_accounts_ssot/<stamp>/
```
