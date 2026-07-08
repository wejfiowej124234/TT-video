# HAT-003 · REDEFINE Confirmation

**Issue:** HAT-003  
**Recorded:** 2026-07-08  
**Owner:** Solo Founder  
**Mode:** REDEFINE document only · 无 registry · 无代码 · 无 staging 数据 · 无 HAT 矩阵 · 无 ACTIVE

**Context:** HAT-003 Discovery · `evidence/GO_production_readiness/step2/hat/HAT-003-TOURIST-LOGIN-DISCOVERY-LATEST.json`

---

## 1. 原假设 · REJECTED

| 项 | 值 |
|----|-----|
| **原 Root Cause 表述** | Tourist 登录 HTTP 失败 |
| **状态** | **REJECTED** |
| **否定依据** | `POST /auth/login` **200** · token 正常 · **连续 3 次 PASS** |

**若按原假设修 login API，将误修** — 认证链路在 staging 上 **正常工作**。

---

## 2. 新候选根因 · CONFIRMED_CANDIDATE

| 项 | 值 |
|----|-----|
| **Candidate ID** | `staging_tourist_seed_persona_contamination` |
| **表述** | Staging 测试账号 `tourist@test.com` 的 **persona 被历史 E2E/HAT promote 污染** 为 `super_admin`，导致 HAT Tourist 走廊 **语义失败**（非 HTTP 失败） |
| **状态** | **CONFIRMED_CANDIDATE** |

### 污染链路

```
原始种子 SSOT                    历史 E2E/HAT
tourist@test.com                 promote_admin_email
     |                           (tn-p1-hat · Admin/Moderator 用例)
     v                                    |
role: tourist / traveler                  v
                                   super_admin (PG 持久化)
                                          |
当前 Discovery                            v
POST /auth/login → 200 ✅                 |
role = super_admin ❌  ← Tourist HAT 语义失败
GET /api/v1/admin/capabilities → 200 ❌   (Tourist 应 deny)
```

### 次要签名（不升格为主 RC）

| 签名 | 说明 |
|------|------|
| `logout_content_type_required` | naive `POST /auth/logout` 无 JSON Content-Type → **415**；带 body → 200。属 **探针/客户端合约**，非「登录失败」。 |

---

## 3. Exit Condition 分层

| 层 | Exit 片段 | Discovery |
|----|-----------|-----------|
| API credential | 连续 3 次 `POST /auth/login` 200 + token | **PASS** |
| HAT Tourist persona | `role` 为 tourist/traveler · admin deny | **NOT PASS** |
| HAT logout（naive client） | logout 步可完成 | **NOT PASS** |

**HAT-003 不可关闭** — 须 Owner Persona 决策 + 后续 Fix Authorization（若适用）。

---

## 4. 关联文档

- Discovery: `evidence/GO_production_readiness/sprints/HAT-003-DISCOVERY-RESULT.md`
- Owner Decision: `evidence/GO_production_readiness/sprints/OWNER-TOURIST-PERSONA-DECISION.md`

---

## 5. 治理字段（文档层 · Registry 未改）

| 字段 | 值 |
|------|-----|
| `failure_signature_confirmed` | **true** |
| `original_hypothesis` | **REJECTED** |
| `root_cause_candidate` | `staging_tourist_seed_persona_contamination` |
| `business_rule_confirmed` | **见 Owner Decision** |
| `root_cause_confirmed` | **false** |
| `fix_authorized` | **false** |
