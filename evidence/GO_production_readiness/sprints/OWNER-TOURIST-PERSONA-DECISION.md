# OWNER-TOURIST-PERSONA-DECISION

**Decision type:** Test Identity Governance · HAT Tourist Persona  
**Recorded:** 2026-07-08  
**Owner:** Solo Founder  
**Mode:** Decision document only · 无 registry · 无代码 · 无 staging 数据 · 无 HAT 矩阵 · 无 Fix · 无 ACTIVE

**Context:** HAT-003 REDEFINE · `staging_tourist_seed_persona_contamination`

---

## 1. 裁定结论

| 项 | 值 |
|----|-----|
| **选定方案** | **A — HAT Tourist 必须绑定独立 tourist/traveler persona** |
| **未选方案** | B — 允许 `tourist@test.com` 持久为 `super_admin` 且仍作 Tourist HAT 主账号 |
| **性质** | **测试身份治理** · Staging Readiness / HAT 语义 · **非** auth 实现缺陷 |

---

## 2. 方案 A（采用）

> HAT Tourist 走廊探测账号 login/me 的 `role` **必须** 为 `tourist` 或 `traveler`，且 **不得** 对 `GET /api/v1/admin/capabilities` 返回 200。  
> `tourist@test.com` 作为 Tourist HAT 主账号时 staging **不得** 持久为 `admin`/`super_admin`。Admin/Moderator HAT 须 **独立账号或 promote 目标**。

**对 HAT-003：** 非修 `/auth/login` · 是恢复/隔离测试 persona · Exit「连续 3 次 PASS」按 **HAT 语义层** 解释。

---

## 3. 方案 B（不采用）

保留 `tourist@test.com` 为 super_admin 仍作 Tourist HAT 主账号 → persona 与矩阵永久不一致 · 仅「换 email 绕过」不解决治理根因。

---

## 4. 治理语义

| 字段 | 值 |
|------|-----|
| `failure_signature_confirmed` | **true** |
| `original_hypothesis` | **REJECTED** |
| `root_cause_candidate` | `staging_tourist_seed_persona_contamination` |
| `business_rule_confirmed` | **true** |
| `root_cause_confirmed` | **false** |
| `fix_authorized` | **false** |

---

## 5. 信号（不变）

| 信号 | 值 |
|------|-----|
| HAT-003 | **OPEN** |
| Open RC | **3** |
| `TT_SPRINT_B_ACTIVE` | **false** |
| Registry / HAT / staging | **未改** |
