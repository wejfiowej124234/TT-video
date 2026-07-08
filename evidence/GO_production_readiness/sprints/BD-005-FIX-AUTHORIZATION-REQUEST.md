# BD-005 · Fix Authorization 裁定请求

**Status:** ⏳ **PENDING Owner Fix Authorization**  
**Recorded:** 2026-07-07  
**Issue:** BD-005 · Provider Order Lifecycle Readiness  
**Prerequisite (met):** OWNER-FULFILLMENT-GUIDE-DECISION · **Option A** · `business_rule_confirmed=true`

**Mode:** Request only · **fix_authorized=false** · 无代码 · 无数据 · 无 HAT · 无 ACTIVE

---

## 1. 当前门禁

| 键 | 值 |
|----|-----|
| Registry | v12 |
| `governance.failure_signature_confirmed` | true |
| `governance.business_rule_confirmed` | true |
| `governance.root_cause_confirmed` | false |
| **`governance.fix_authorized`** | **false** ← 待 Owner 裁定 |
| `TT_SPRINT_B` | READY |
| `TT_SPRINT_B_ACTIVE` | false |

**Sprint B ACTIVE 四键：** evidence_ready ✅ · business_rule_confirmed ✅ · root_cause_confirmed ❌ · fix_authorized ❌

---

## 2. 请求 Owner 裁定的 Fix 范围（方案 A 路径）

在 **不改 422 规则、不选方案 B** 前提下，Fix 仅允许以下范围：

### 2.1 Scope A · Staging Readiness（**推荐首 Fix · 最小范围**）

| 项 | 内容 |
|----|------|
| 目标 | 使 **至少 1 条 production catalog provider listing** 的 **owner** 具备 **`guides.status=active`** |
| 手段 | 为 staging **pilot provider** 补齐 active fulfillment guide profile（数据/seed/onboarding 完成路径，**非** API 规则变更） |
| 验证 | `run-sprint-b-provider-hat-order-validation.cjs` → `TT_SPRINT_B_PROVIDER_HAT_ORDER=PASS` |
| BD-005 关闭 | HAT 全链 PASS 后 Validation → CLOSED |

**Pilot 候选（Discovery 已知）：**

- 测试账号：`merchant@test.com`（可 create listing · 无 guide · 自建 listing 被 public surface 过滤）
- Catalog 样本：`c6f938af-4fb6-4059-bcac-5dd3e2015655`（owner `62ce943b…` · production · 无 active guide）

**Owner 须在授权时指定：** 以 **merchant pilot**、**catalog owner 修复**，或 **两者** 作为 Fix 目标。

### 2.2 Scope B · Onboarding 约束（**可选 · 同批或后续**）

| 项 | 内容 |
|----|------|
| 目标 | 产品/文档层声明：Provider 发 listing 前须完成 **guide 轨 active**（或等价 fulfillment 前置） |
| 性质 | UX/文档/runbook · **非** 本次 staging HAT 阻塞的必要条件 |
| 边界 | 若含代码，限于 **onboarding 提示/门闸/文档**；**不** 删除 `market_listing_fulfillment_guide_required` |

**建议：** Scope A 授权与 Scope B **分离** — 先 A 关 HAT，B 作 follow-up（避免混 Sprint）。

---

## 3. 授权后仅允许的记录与执行边界

**Owner 授权后，Assistant 第一步 ONLY：**

1. Registry v13 微补丁：
   - `governance.fix_authorized: true`
   - `fix_authorization.scope`（A / A+B）
   - `fix_authorization.pilot`（Owner 指定）
   - `fix_authorization.execution_boundary`（见 §4）
   - **仍不** 自动 `TT_SPRINT_B_ACTIVE=true`（须四键全 true + Owner 显式 ACTIVE）

**授权后第二步（单独 Owner 指令）：** 执行 Scope A Fix → HAT 重跑 → Validation

---

## 4. 执行边界（Fix Authorization 须写入 registry）

| 允许 | 禁止 |
|------|------|
| 补齐 staging pilot **active guide** profile | 修改 `market_listing_fulfillment_guide_required` 422 逻辑 |
| 修正 catalog seed / test account 与 owner 关联 | 方案 B（无 guide 自履约） |
| 重跑 HAT（**仅 fix_authorized 后**） | 未授权前任何数据/代码变更 |
| onboarding **文档/runbook** 声明（若 Scope B 授权） | Pricing / BD-002 重开 |
| `root_cause_confirmed=true` 可在 HAT PASS 后设 | 自动 `TT_SPRINT_B ACTIVE` |

---

## 5. Owner 裁定槽（待填写）

| 字段 | Owner 输入 |
|------|------------|
| **fix_authorized** | `[ ] true` · `[ ] false` · `[ ] defer` |
| **scope** | `[ ] A only (staging pilot guide)` · `[ ] A+B` · `[ ] other` |
| **pilot target** | `[ ] merchant@test.com` · `[ ] catalog owner 62ce943b…` · `[ ] specify: ___` |
| **root_cause_confirmed on authorize** | `[ ] false until HAT PASS`（推荐）· `[ ] true now` |
| **TT_SPRINT_B ACTIVE on authorize** | `[ ] false`（推荐）· `[ ] true` |

---

## 6. 授权前禁令（当前有效）

- ❌ 改代码  
- ❌ 改数据  
- ❌ 重跑 HAT  
- ❌ `TT_SPRINT_B ACTIVE=true`  
- ❌ Registry `fix_authorized=true`（直至 Owner 明确授权）

---

## 7. Evidence 链

- `registry/production-readiness-open-issues.v1.yaml` (v12)
- `evidence/GO_production_readiness/sprints/OWNER-FULFILLMENT-GUIDE-DECISION-LATEST.json`
- `evidence/GO_production_readiness/step2/hat/SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json`

---

*Awaiting Owner Fix Authorization · no changes until explicit approve*

## 8. 治理原则（保留 · 授权时不得违反）

**Fix Authorization 时禁止同时设置 `root_cause_confirmed: true`。**

更严格的三态（授权后 · Fix 完成 HAT 前）：

| 字段 | 值 |
|------|-----|
| `business_rule_confirmed` | **true** |
| `fix_authorized` | **true**（Owner 授权后） |
| `root_cause_confirmed` | **false**（保持至 HAT 全链 PASS） |

**BD-005 关闭条件：** 仅当 HAT 四步全部 PASS 后，方可 `root_cause_confirmed=true` 并 CLOSED：

```
create_order → provider_accept → mock_pay → confirm_completion
```

授权 ≠ 根因关闭；HAT PASS = Validation 关闭门禁。

