# BFM-001 · REDEFINE 确认文档

**Document type:** Root Cause REDEFINE Confirmation（Discovery-only · 无 Fix）  
**Recorded:** 2026-07-08  
**Sprint:** B · **TT_SPRINT_B:** READY · **TT_SPRINT_B_ACTIVE:** false  
**Status:** REDEFINE **CONFIRMED**（文档确认）· **Root Cause CONFIRMED for Sprint ACTIVE:** ❌（本文档不触发 ACTIVE）

---

## 1. 摘要

| 字段 | 值 |
|------|-----|
| Issue ID | BFM-001 |
| 原 Root Cause 假设 | Acquisition 响应链路未真人走通 |
| 假设状态 | **RECLASSIFIED**（API 层否定 · 真人层确认） |
| 主候选 RC | `acquisition_human_verification_not_executed` |
| 次候选 RC | `staging_ocs_acquisition_owner_not_in_hat_pilot` |
| Pilot API 全链 | **PASS** — fresh_user · seed_persona · high_bounty_gate |
| OCS catalog 成交 | **PARTIAL** — respond/accept PASS · close_deal 需 OCS owner |
| 结论 | 不应 Fix「响应 API」；BFM-001 应 **重新分类** 为 Human Validation + OCS persona gap |

---

## 2. 原假设 · RECLASSIFIED

### 2.1 原表述

> **BFM-001：** Acquisition 响应链路未真人走通 — 发布→响应→成交→完成 全链未 PASS，尤其 **响应** 层阻塞。

### 2.2 Discovery 分层否定 / 确认

| 层 | 探针 | 结果 | 对原假设 |
|----|------|------|----------|
| API · 响应 | `POST …/acquisition/listings/:id/orders` + accept | **PASS**（fresh · seed · OCS） | **否定**「响应 API 未走通」 |
| API · 发布 | publish-bond + POST listing | **PASS** | 非阻塞 |
| API · 成交 | mock-pay pilot-owned | **PASS** | 非阻塞（pilot path） |
| API · 成交 | mock-pay OCS catalog | **FAIL** 403 `not_tourist` | **OCS owner gap** · 非响应 API |
| API · 完成 | confirm-completion pilot-owned | **PASS** | 非阻塞 |
| 真人 · BFM Matrix | acquisition 四步全 `pending` | **NOT_EXECUTED** | **确认**「真人未走通」 |
| 真人 · HAT acquisition | 七步全 `pending` | **NOT_EXECUTED** | 同上 |
| 真人 · Manual Validation | 全 `pending` | **NOT_EXECUTED** | 同上 |

**RECLASSIFIED 声明：**

- 「**响应链路 API 失败**」→ **REJECTED**（staging pilot **PASS**；若修 respond API 将 **修错问题**）
- 「**真人五层验证未执行**」→ **CONFIRMED**（BFM / HAT / Manual 均未跑）
- 原假设 **混合了两层**；须拆分语义，不可继续作为单一 Sprint B Fix RC

---

## 3. Pilot API 全链 · PASS（staging）

Registry Exit：`发布→响应→成交→完成 全链 PASS`

### 3.1 API Exit · pilot-owned · MET

| Track | Verdict | 说明 |
|-------|---------|------|
| `fresh_user_full_chain` | **PASS** | 注册→bond→发布→响应→accept→mock-pay→completed |
| `seed_persona_chain` | **PASS** | `multi-demo@test.com` 发布 + fresh carrier 响应 |
| `high_bounty_fulfillment_gate` | **PASS** | bounty≥1000 · fulfillment bond 门闸 by design |
| `smoke-acquisition-pd009-staging.sh` | **PASS** | 交叉验证 |

### 3.2 OCS catalog · PARTIAL（非响应主因）

| Step | Verdict | 说明 |
|------|---------|------|
| respond + accept | **PASS** | fresh carrier · production listing |
| close_deal | **FAIL** | listing.owner_user_id 非 seed HAT 账号 · mock-pay 403 |
| owner_user_id | `bf2e447c-0733-4cba-95a4-29f353cfc404` | OCS seed · 无 staging 登录 persona |

**语义：** API Exit 在 **pilot-owned** 语义层 **MET**；OCS catalog 成交为 **persona coverage gap**，不否定响应 API。

---

## 4. 候选根因 · CONFIRMED_CANDIDATE

### 4.1 主因 · `acquisition_human_verification_not_executed`

> BFM-001 在 framework bootstrap 登记；`business-flow-matrix` / `hat-six-role-matrix` acquisition / `manual-validation-checklist` 全 **pending**；API Discovery 已 PASS，但 **verification_chain**（human_click → api → db → page → final_outcome）**从未执行**。

| SSOT | 状态 |
|------|------|
| `registry/business-flow-matrix.v1.yaml` | acquisition 四步 pending |
| `registry/hat-six-role-matrix.v1.yaml` | acquisition 角色 pending |
| `registry/manual-validation-checklist.v1.yaml` | 全 pending |
| `five-role-full-chain-audit.py` | **不含** acquisition 走廊 |

### 4.2 次因 · `staging_ocs_acquisition_owner_not_in_hat_pilot`

> OCS production catalog 的 **成交/完成** 须 listing owner mock-pay（acquisition: `tourist_id=listing.owner`）；staging seed 账号 **不是** OCS owner → close_deal **403** `not_tourist`。

| 字段 | 值 |
|------|-----|
| failure_signature | HTTP 403 · `not_tourist` |
| blocked_at | close_deal |
| code_ref | `market_listing_orders.rs` · `accept_cancel_pay_complete.rs` |

**不升格为「响应 API 失败」** — respond 200 已证实。

---

## 5. BFM Matrix · Discovery 对读

| Step | Registry | API Discovery | Human |
|------|----------|---------------|-------|
| 发布 | pending | **PASS** | NOT_EXECUTED |
| 响应 | pending | **PASS** | NOT_EXECUTED |
| 成交 | pending | **PARTIAL** | NOT_EXECUTED |
| 完成 | pending | **PASS** | NOT_EXECUTED |

**Master Checklist blocking：** BFM 四步 `pending` 计为 blocking — 这是 **BFM-001 OPEN 的 registry Mechanism**，非 API 实测失败。

---

## 6. Supporting Evidence

| # | 路径 | 用途 |
|---|------|------|
| E1 | `evidence/GO_production_readiness/step4/BFM-001-ACQUISITION-CHAIN-DISCOVERY-LATEST.json` | 四轨 API Discovery |
| E2 | `evidence/GO_production_readiness/sprints/BFM-001-DISCOVERY-RESULT.md` | 人读摘要 |
| E3 | `scripts/dev/run-bfm-001-acquisition-chain-discovery.cjs` | 可复现探针 |
| E4 | `scripts/dev/smoke-acquisition-pd009-staging.sh` | staging 全链烟测 |
| E5 | `registry/business-flow-matrix.v1.yaml` | BFM SSOT |
| E6 | `registry/hat-six-role-matrix.v1.yaml` | HAT acquisition pending |
| E7 | `registry/manual-validation-checklist.v1.yaml` | Manual UAT pending |
| E8 | `frontend/app/market/acquisition/README.md` | PD-009 代码 SSOT |

---

## 7. Impact

### 7.1 业务影响

| 层级 | 状态 | 说明 |
|------|------|------|
| Acquisition API · pilot 全链 | ✅ | staging PASS |
| Acquisition API · 响应 | ✅ | 非阻塞 |
| OCS catalog · 成交 | ⚠️ | 需 OCS owner persona · 可选 pilot |
| 真人 BFM / HAT / Manual | ❌ | 未执行 · **BFM-001 真实 open 语义** |
| Sprint B Fix「响应 API」 | **NO** | 修错目标 |

### 7.2 Sprint 信号（本文档 **不修改**）

- `TT_SPRINT_B=READY`
- `TT_SPRINT_B_ACTIVE=false`
- `root_cause_confirmed=false`
- `fix_authorized=false`
- Open RC：**1**（registry 未改）

---

## 8. 关闭 vs 降级 vs 拆分 · 建议

### 8.1 选项 A · **关闭 BFM-001（API 假设否定）**

| 动作 | 说明 |
|------|------|
| BFM-001 | **CLOSED** — API pilot PASS · 原假设 API 部分 REJECTED |
| 真人验证 | implicit 遗留 · 易遗忘 |

### 8.2 选项 B · **关闭 + 降级至 Human Validation Track（推荐）**

| 动作 | 说明 |
|------|------|
| BFM-001 | **CLOSED** — `close_reason: hypothesis_reclassified_api_pass_human_deferred` |
| _residual_ | 路由至既有 **BFM Matrix + HAT acquisition + Manual Validation** 执行轨 |
| OCS owner gap | **staging pilot 可选** · 不吸收进 Sprint B Fix RC |
| 新 Sprint B RC | **不开** |

**理由：** 对齐 BD-003 — REJECTED/RECLASSIFIED 假设 **关闭**，残余路由既有独立轨；Open RC 仅保留 **可 Fix** 项。

### 8.3 选项 C · **拆分新 Acquisition HAT/Manual RC**

| 动作 | 说明 |
|------|------|
| BFM-001 | CLOSED（API scope） |
| 新 ID（如 HAT-004 / MV-001） | OPEN — Human Acquisition corridor + OCS owner pilot |

**适用：** Owner 希望 Open RC 显式跟踪真人验收 · **代价：** 新增 queue 项 · 与 BD-003「不吸收残余」惯例需 Owner 显式选择。

### 8.4 REDEFINE 确认结论（待 Owner Decision）

| 决策项 | 文档建议 |
|--------|----------|
| 原假设 API 部分 | **REJECTED** |
| 原假设真人部分 | **CONFIRMED** |
| Pilot API Exit | **MET**（pilot-owned） |
| 推荐 disposition | **选项 B** — CLOSE + 降级 Human Validation Track |
| 本文档是否触发 ACTIVE | **否** |

---

## 9. Discovery-first 记录（Lesson）

1. **BFM Matrix pending ≠ API FAIL** — bootstrap OPEN 可早于 API Discovery。
2. **「响应链路」≠ respond API** — 真人 UI 走廊与 `POST …/orders` 须分层。
3. **Acquisition 订单语义** — mock-pay 由 listing owner 执行；OCS catalog 须 owner persona pilot。
4. **Catalog PASS 先例** — 同 BD-003 / BD-002 · 避免 Sprint B 修错 API。

---

## 10. 签核槽

| 角色 | 状态 |
|------|------|
| Evidence | ✅ E1–E8 |
| REDEFINE 文档 | ✅ 本文档 |
| Owner Decision | ✅ `OWNER-BFM-001-DISPOSITION-DECISION.md` |
| fix_authorized | ❌ false |
| TT_SPRINT_B ACTIVE | ❌ false |

---

*Generated from BFM-001 Acquisition Chain Discovery · mode: discovery_only · no registry · no data · no Fix · no ACTIVE*
