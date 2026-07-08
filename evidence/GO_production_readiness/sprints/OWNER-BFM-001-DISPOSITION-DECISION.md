# OWNER-BFM-001-DISPOSITION-DECISION

**Decision type:** Sprint B Disposition · BFM-001 Acquisition Chain Hypothesis  
**Recorded:** 2026-07-08  
**Owner:** Solo Founder  
**Mode:** Decision document only · 无 registry · 无代码 · 无 staging 数据 · 无 Fix · 无 ACTIVE

**Context:** BFM-001 REDEFINE · `acquisition_human_verification_not_executed` · Pilot API PASS

---

## 1. 裁定结论

| 项 | 值 |
|------|-----|
| **选定方案** | **B — 关闭 BFM-001 + 降级至 Human Validation Track（既有轨）** |
| **未选方案 A** | 仅关闭、不书面路由真人验证 |
| **未选方案 C** | 拆分新 Acquisition HAT/Manual Open RC |
| **性质** | **假设重新分类** · API 非 Fix 项 · 真人验证 **Deferred to Track** |

---

## 2. 方案 B（采用）· 完整表述

> **BFM-001 关闭：** 原 Root Cause「Acquisition 响应链路未真人走通」**重新分类** — **API 响应/全链（pilot-owned）PASS** · **真人五层验证 NOT_EXECUTED**。  
> **不得**作为 Sprint B Fix 目标修复 respond API。  
> **残余路由（不新开 Sprint B RC）：**
>
> 1. **Business Flow Matrix** — `registry/business-flow-matrix.v1.yaml` · acquisition flow · 四步 pending · 须真人+API+DB+页面五层链
> 2. **HAT Acquisition 角色** — `registry/hat-six-role-matrix.v1.yaml` · acquisition 七步 pending
> 3. **Manual Validation** — `registry/manual-validation-checklist.v1.yaml` · Chrome/手机/钱包/UAT pending
>
> **OCS owner persona gap（`staging_ocs_acquisition_owner_not_in_hat_pilot`）：** 可选 staging pilot（为 OCS listing owner 绑定 HAT 凭证）· **不在本文授权 Fix** · 若需 Open RC 须 **新 ID** + Owner 显式登记。

---

## 3. 原假设 · Owner 裁定分层

| 子假设 | staging | Owner 裁定 |
|--------|---------|------------|
| 响应 API 未走通 | respond 200 · 多轨 PASS | **REJECTED** |
| Pilot API 全链 | fresh + seed + high_bounty PASS | **MET** |
| 真人 BFM/HAT/Manual 未走通 | 全 pending | **CONFIRMED** |
| OCS catalog 成交 | 403 · owner 非 seed | **CONFIRMED_CANDIDATE**（次因 · persona gap） |

---

## 4. 方案 A（部分采用 · 关闭语义）

与方案 B **相同关闭动作**：

| 关闭字段 | 值 |
|----------|-----|
| lifecycle | **CLOSED**（registry 待更新） |
| close_reason | `hypothesis_reclassified_api_pass_human_deferred` |
| close_note | API pilot PASS · 响应 API REJECTED as blocker · 真人验证降级既有 Track |

方案 A 与 B 之差：**是否书面路由** Human Validation Track · Owner 选 B。

---

## 5. 方案 C（不采用）

关闭 BFM-001 同时 **新开** HAT-004 / MV-001 Acquisition 真人 RC → 增加 Open RC 计数 · 真人轨已有 registry SSOT · **拒绝**（除非 Owner 后续显式 reopen）。

---

## 6. Exit Condition 确认

Registry Exit：`发布→响应→成交→完成 全链 PASS`

| 语义层 | staging | Owner 裁定 |
|--------|---------|------------|
| API · pilot-owned 全链 | PASS | **MET** |
| API · OCS catalog 全链 | PARTIAL（close_deal） | **DEFERRED**（OCS owner pilot 可选） |
| Human · BFM 五层链 | NOT_EXECUTED | **NOT MET** · 降级 Track |
| BFM-001 Sprint B Fix | 不适用 | **REJECTED** |

**裁定：** API Exit **已满足**（pilot-owned）· BFM-001 **应关闭** · 真人验收 **不属于** 本 RC Fix scope。

---

## 7. 治理语义

| 字段 | 裁定值 |
|------|--------|
| `failure_signature_confirmed` | **true**（API PASS + human pending 机读） |
| `original_hypothesis` | **RECLASSIFIED** |
| `api_hypothesis` | **REJECTED** |
| `human_hypothesis` | **CONFIRMED** |
| `root_cause_candidate` | `acquisition_human_verification_not_executed` |
| `secondary_candidate` | `staging_ocs_acquisition_owner_not_in_hat_pilot` |
| `pilot_api_exit_met` | **true** |
| `business_rule_confirmed` | **true** |
| `root_cause_confirmed` | **false** |
| `fix_authorized` | **false** |

---

## 8. 信号（不变 · 本文不修改 registry）

| 信号 | 当前 | 预期（待 registry 更新） |
|------|------|--------------------------|
| BFM-001 | OPEN | **CLOSED** |
| Open RC | 1 | **0** |
| `TT_SPRINT_B_ACTIVE` | false | false |
| Human Validation Track | pending | **继续**（非 Open RC） |

---

## 9. 后续步骤（未执行 · 仅决策后果）

1. Owner 更新 `production-readiness-open-issues.v1.yaml` — BFM-001 **CLOSED** + evidence refs
2. 执行 Human Validation Track（BFM Matrix / HAT acquisition / Manual）— **独立**于 Sprint B queue
3. 可选：OCS acquisition owner staging pilot — **新 RC 或 runbook 项**
4. **不**授权 respond API Fix · **不**切 `TT_SPRINT_B ACTIVE`

**本文不执行以上步骤。**

---

## 10. Supporting Evidence

- `evidence/GO_production_readiness/sprints/BFM-001-REDEFINE-CONFIRMATION-LATEST.json`
- `evidence/GO_production_readiness/step4/BFM-001-ACQUISITION-CHAIN-DISCOVERY-LATEST.json`
- `evidence/GO_production_readiness/sprints/BFM-001-DISCOVERY-RESULT.md`
- `registry/business-flow-matrix.v1.yaml`
- `registry/hat-six-role-matrix.v1.yaml`
- `registry/manual-validation-checklist.v1.yaml`

---

## 11. 决策记录

| 项目 | 值 |
|------|-----|
| Decision ID | OWNER-BFM-001-DISPOSITION-DECISION |
| Issue ID | BFM-001 |
| Selected | **B** |
| Rejected | **C** |
| original_hypothesis | **RECLASSIFIED** |
| pilot_api_exit_met | **true** |
| fix_authorized | **false** |

---

*Owner decision recorded · no registry · no code · no data · no Fix · no ACTIVE*
