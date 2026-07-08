# HAT-003 · Fix Authorization 裁定请求

**Status:** ⏳ **PENDING Owner Fix Authorization**  
**Recorded:** 2026-07-08  
**Issue:** HAT-003 · Tourist HAT Persona / Test Identity Governance  
**Prerequisite (met):** OWNER-TOURIST-PERSONA-DECISION · **Option A** · `business_rule_confirmed=true`

**Mode:** Request only · **fix_authorized=false** · 无 registry · 无 staging · 无 HAT 重跑 · 无 ACTIVE

---

## 1. 当前门禁

| 键 | 值 |
|----|-----|
| Registry | v14（**本文不修改**） |
| 原假设 · Tourist 登录 HTTP 失败 | **REJECTED** |
| `root_cause_candidate` | `staging_tourist_seed_persona_contamination` · **CONFIRMED_CANDIDATE** |
| `governance.failure_signature_confirmed` | true |
| `governance.business_rule_confirmed` | true |
| `governance.root_cause_confirmed` | false |
| governance.fix_authorized | **false** ← 待 Owner 裁定 |
| `TT_SPRINT_B` | READY |
| `TT_SPRINT_B_ACTIVE` | false |

**说明：** HAT-003 非 Sprint B Provider 链 · 队列首项 Open RC · ACTIVE 四键 **不适用自动切换** · 保持 **ACTIVE=false**。

---

## 2. 问题重定性摘要（避免误修）

| 路径 | 判定 |
|------|------|
| ❌ 修改 `/auth/login` | **禁止** · 会误修认证系统（HTTP 200×3 已证伪） |
| ✅ 恢复测试身份边界 | **Scope A** · staging persona 治理 |
| ✅ 验证 HAT Persona | Fix 后 Validation · 非本次请求 |

```
tourist@test.com (staging PG)
  种子 SSOT: tourist/traveler
       ↓ 历史 promote_admin_email
  当前: super_admin  ← 污染
       ↓ Scope A Fix
  目标: tourist/traveler + admin deny
       ↓ Validation
  HAT Tourist login 语义 3× PASS
```

---

## 3. 请求 Owner 裁定的 Fix 范围

### 3.1 Scope A · Staging Persona 恢复（**推荐 · 最小范围**）

| 项 | 内容 |
|----|------|
| **目标** | 恢复 `tourist@test.com` 为 **独立 tourist/traveler persona** |
| **手段** | staging **数据 Fix only**：将 `users.role` 从 `super_admin` 恢复为 `tourist`（或 SSOT 等价 traveler 枚举）；**不** 改 `/auth/login` 实现 |
| **隔离** | Admin/Moderator HAT 的 `promote_admin_email` **不得再指向** `tourist@test.com`；须 Owner 指定 **独立 promote 目标**（如专用 admin 种子账号） |
| **Pilot** | `tourist@test.com` / `Test123!` |
| **验证** | Tourist login **连续 3 次 PASS（HAT 语义）**：`role` ∈ {tourist, traveler} · `GET /api/v1/admin/capabilities` → 401/403 |
| **HAT-003 关闭** | Validation PASS 后 → `root_cause_confirmed=true` → CLOSED |

**Discovery 已知基线（Fix 前）：**

| 探针 | 当前 | Fix 后期望 |
|------|------|------------|
| `POST /auth/login` ×3 | 200 ✅ | 200 ✅ |
| `role` | super_admin ❌ | tourist/traveler ✅ |
| `GET /api/v1/admin/capabilities` | 200 ❌ | 401/403 ✅ |
| `POST /auth/logout` (naive) | 415 ⚠️ | 探针层可带 JSON body（非 Scope A 必须） |

### 3.2 Scope B · Promote 目标隔离（**可选 · 同批或后续**）

| 项 | 内容 |
|----|------|
| **目标** | 文档/runbook/探针约定：Admin HAT 与 Tourist HAT **分账号** |
| **性质** | 测试治理 · 防止 persona 再污染 |
| **边界** | 若含探针脚本变更，限于 **promote 目标 email** · **不** 改 auth 规则 |

**建议：** Scope A 授权与 Scope B **可分离** — A 恢复 persona + Validation 关 HAT-003；B 防复发（runbook / probe email）。

---

## 4. 授权后执行边界（Fix Authorization 须写入 registry · 非本文）

| 允许 | 禁止 |
|------|------|
| staging 将 `tourist@test.com` role 恢复 tourist/traveler | 修改 `/auth/login` 认证逻辑 |
| Owner 指定 Admin promote 隔离目标（文档/registry 记录） | 未授权前任何 staging 变更 |
| Fix 后 HAT-003 Validation 探针重跑（**仅 fix_authorized 后**） | 方案 B（保留 super_admin 作 Tourist HAT 主账号） |
| `root_cause_confirmed=true` **仅** Validation PASS 后 | 授权时设 `root_cause_confirmed=true` |
| Registry `fix_authorized=true` 记录 | 自动 `TT_SPRINT_B ACTIVE=true` |
| HAT 矩阵 Tourist/login 更新（**Validation 后**） | 授权前改 HAT 矩阵 SSOT |

---

## 5. Owner 裁定槽（待填写）

| 字段 | Owner 输入 |
|------|------------|
| **fix_authorized** | `[ ]` true · `[ ]` false · `[ ]` defer |
| **scope** | `[ ]` A only (persona restore) · `[ ]` A+B (persona + promote isolation) · `[ ]` other |
| **pilot** | `[ ]` tourist@test.com（推荐）· `[ ]` specify: ___ |
| **admin_promote_target** | `[ ]` 指定独立账号（Scope B）· `[ ]` defer · `[ ]` specify: ___ |
| **root_cause_confirmed on authorize** | `[ ]` false until Validation PASS（**推荐**）· `[ ]` true now |
| **TT_SPRINT_B ACTIVE on authorize** | `[ ]` false（**推荐**）· `[ ]` true |

---

## 6. 授权前禁令（当前有效）

- ❌ 改 registry（含 `fix_authorized=true`）  
- ❌ 改 staging 数据  
- ❌ 改代码  
- ❌ 重跑 HAT / Validation  
- ❌ `TT_SPRINT_B ACTIVE=true`

---

## 7. Evidence 链

- `evidence/GO_production_readiness/sprints/OWNER-TOURIST-PERSONA-DECISION-LATEST.json`
- `evidence/GO_production_readiness/sprints/HAT-003-REDEFINE-CONFIRMATION-LATEST.json`
- `evidence/GO_production_readiness/step2/hat/HAT-003-TOURIST-LOGIN-DISCOVERY-LATEST.json`
- `evidence/GO_production_readiness/sprints/HAT-003-DISCOVERY-RESULT.md`
- `registry/production-readiness-open-issues.v1.yaml` (v14 · 未改)

---

## 8. 治理原则（授权时不得违反）

**Fix Authorization 时禁止同时设置 `root_cause_confirmed: true`。**

| 字段 | 授权后 · Validation 前 |
|------|------------------------|
| `business_rule_confirmed` | **true** |
| `fix_authorized` | **true**（Owner 授权后） |
| `root_cause_confirmed` | **false**（保持至 HAT Persona Validation PASS） |

**HAT-003 关闭条件（Exit Condition · HAT 语义层）：**

```
Tourist login 连续 3 次 PASS
  AND role = tourist | traveler
  AND admin capabilities deny (401/403)
```

授权 ≠ 关闭；Validation PASS = 关闭门禁。

---

*Awaiting Owner Fix Authorization · no changes until explicit approve*
