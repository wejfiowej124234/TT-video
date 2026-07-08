# HAT-003 · Tourist Login Discovery

**Mode:** Discovery only · **Fix:** none · **ACTIVE:** false  
**Recorded:** 2026-07-08  
**Evidence:** `HAT-003-TOURIST-LOGIN-DISCOVERY-LATEST.json`

---

## Executive

| 项 | 结果 |
|----|------|
| **Hypothesis** | Tourist 登录异常 |
| **Verdict** | **REDEFINE** — API 登录未 FAIL；异常在 persona / logout 合约 |
| **TT_SPRINT_B** | READY |
| **TT_SPRINT_B_ACTIVE** | **false** |
| **root_cause_confirmed** | **false**（Discovery 完成 · 待 Owner 裁定） |

---

## HAT Matrix · Tourist 行阻断项

| Step | SSOT verdict | Discovery |
|------|--------------|-----------|
| register | pending | 未探（非本次焦点） |
| **login** | pending · `HAT-003 待复现` | **HTTP 200 ×3** · role=`super_admin` ⚠️ |
| browse | pending | GET `/api/v1/orders` **200** |
| order | pending | 未探 |
| pay | pending | 未探 |
| complete | pending | 未探 |
| **logout** | pending | naive POST **415** · JSON body POST **200** |

Tourist 行 **7/7 cells** 仍为 blocking（矩阵 SSOT 未更新 · 符合 Discovery-only）。

---

## Probe 结果（staging · `tourist@test.com`）

| Step | HTTP | Verdict | Detail |
|------|------|---------|--------|
| login ×3 | 200 | PASS | token 正常 · **role=super_admin** |
| GET /api/v1/me | 200 | PASS | role=super_admin · identity_slots.traveler=active |
| GET /api/v1/orders | 200 | PASS | browse 链可用 |
| GET /api/v1/admin/capabilities | **200** | **FAIL** | Tourist 走廊应 401/403 · super_admin 可访问 |
| POST /auth/logout (no Content-Type) | **415** | **FAIL** | HAT naive client 会踩坑 |
| POST /auth/logout (JSON body) | 200 | PASS | session 随后 401 |
| wrong password control | 401 | PASS | invalid_credentials |

---

## Root Cause 定位

### 原假设 · REJECTED（作为「登录 HTTP 失败」）

`POST /auth/login` **连续 3 次 200 + token** — Exit Condition 的字面 HTTP 层 **已满足**，但与 HAT Tourist 语义 **不一致**。

### 候选根因 · CONFIRMED_CANDIDATE

**`staging_tourist_seed_persona_contamination`**

- `tourist@test.com` 在 staging PG **持久化为 `super_admin`**
- 来源：历史 E2E/HAT probe 调用 `POST /auth/seed-test-accounts` + `promote_admin_email: tourist@test.com`（见 `tn-p1-hat-six-role-matrix-probe.py` · Admin/Moderator 用例）
- 种子 SSOT 创建时为 `role: tourist`（`crates/api/src/chain_off/auth.rs`），但 promote **不会降级** 已存在的 super_admin
- **影响：** HAT Tourist 六角色矩阵「登录」步虽 200，**persona 非 Tourist** · admin capabilities 泄漏 · 与矩阵备注「HAT-003 待复现」一致

### 次要签名

**`logout_content_type_required`**

- `POST /auth/logout` 无 `Content-Type: application/json` → **415**
- 带空 JSON body → **200** · 后续 `/me` → **401**

---

## Exit Condition 分析

```
Exit: Tourist 登录连续 3 次 PASS
```

| 解读层 | 状态 |
|--------|------|
| API credential（HTTP 200 + token） | **PASS ×3** |
| HAT Tourist persona（role + deny admin） | **NOT PASS** |
| HAT logout 步（naive POST） | **NOT PASS** |

**不可关闭 HAT-003** — 语义层未 PASS · 需 Owner REDEFINE 或 Fix 路径。

---

## 门禁

- `TT_SPRINT_B_ACTIVE=false` · 未切换
- `fix_authorized=false` · 未进入 Fix
- 未改 staging 数据 · 未改业务代码
- 下一步：**Owner 裁定** — `tourist@test.com` 是否必须保持 `traveler/tourist` role 供 HAT；或拆分 HAT-003 / 新 RC

---

## 与队列关系

```
BD-005 CLOSED → HAT-003 Discovery（本报告）→ BD-003 → BFM-001
Open Root Causes: 3（不变 · HAT-003 仍 OPEN）
```
