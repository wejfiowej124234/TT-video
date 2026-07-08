# Production Entry · Human Validation Planning

**Recorded:** 2026-07-08  
**Mode:** Plan only · **Open RC:** 0 · **Registry:** v17  
**Baseline:** `PRODUCTION-READINESS-FINAL-GATE-REEVALUATION-LATEST.json`  
**TT_PRODUCTION_ENTRY_READY:** NO_GO · **TT_SPRINT_B_ACTIVE:** false

> **不再 REDEFINE** — 无 Open Root Cause。下一阶段：**Human Validation Track + Matrix 收口**。

---

## 优先级总览

| 序 | 轨道 | 目标 | 当前缺口 |
|----|------|------|----------|
| **1** | Matrix Evidence Sync | 已有 PASS → Matrix verdict | HAT-003 Tourist · BD-005 Provider |
| **2** | Human Validation · BFM | 真人五层链 | **17/17 pending** |
| **3** | BDR Day2–5 | 数据域 READY | **1/5 READY** |
| **4** | Manual Validation | 上线前 UAT | **9/9 pending** |

---

## Phase 1 · Matrix Evidence Sync（不重复测试）

### 原则

- 仅 **Evidence → Matrix verdict** 映射 · **不重跑**已通过探针
- 需 Owner 授权后更新 `hat-six-role-matrix.v1.yaml`
- Sync 后重跑 `run-production-readiness-master-checklist.cjs`

### 1A · HAT-003 Tourist

| Matrix  cell | 建议 verdict | Evidence |
|--------------|-------------|----------|
| **login** | pass | `HAT-003-TOURIST-LOGIN-VALIDATION-LATEST.json` · triple 200 · role=tourist |
| **logout** | pass | logout JSON 200 · session 401 after |
| **browse** | pass | browse_orders GET 200 |
| register · order · pay · complete | *保持 pending* | 待真人/HAT 扩展 |

**Signal:** `TT_HAT003_TOURIST_PERSONA_VALIDATION: PASS`

### 1B · BD-005 Provider

| Matrix cell | 建议 verdict | Evidence |
|-------------|-------------|----------|
| **login** | pass | provider_auth 200 · merchant + active guide |
| **browse** | pass | market_visible_catalog 200 |
| **order** | pass | create_order 200 |
| **pay** | pass | mock_pay escrowed |
| **complete** | pass | confirm_completion completed |
| register | *pending* | 待 merchant 入驻真人轨 |

**Signal:** `TT_SPRINT_B_PROVIDER_HAT_ORDER: PASS`  
**WARN 保留:** `market_visible_own_listing` — public surface 过滤 · 非阻塞

**预估：** Phase 1 后 HAT blocking **35 → ~27**（-8 cells）

---

## Phase 2 · Human Validation · Business Flow Matrix

**SSOT:** `registry/business-flow-matrix.v1.yaml`  
**链：** human_click → api → database → page → final_outcome

| Flow | Pending | 计划 |
|------|---------|------|
| **Guide** | 8/8 | Sprint A 延伸 · order/complete 可引用 e8be4517 pilot |
| **Provider** | 5/5 | 对齐 BD-005 API 链 · 真人 /market/provider |
| **Acquisition** | 4/4 | BFM-001 deferred · /market/acquisition 真人全链 |

**Exit:** 三 flow 全 step pass → BFM Matrix PASS

---

## Phase 3 · Business Data Readiness

| Day | Domain | Probe | 状态 |
|-----|--------|-------|------|
| 1 | Guide | `run-guide-business-data-readiness-probes.cjs` | ✅ READY |
| 2 | Provider | `run-provider-business-data-readiness-probes.cjs` | Day2 6/6 PASS · 域 flag 待收口 |
| 3 | Listings | pending | 待定义 |
| 4 | POI | pending | 待定义 |
| 5 | Pricing | pending | 待定义 |

---

## Phase 4 · Manual Validation（上线前）

Chrome · Mobile · Edge · Wallet · Weak network · Login · Mock payment · Cancel exception · Refresh recovery

**时机：** BFM 主流程后 · Production Entry GO 前

---

## Production Entry GO 路径

```
Phase 1 Sync → Phase 2 BFM PASS → Phase 3 BDR READY → Phase 4 Manual PASS
→ blocking_checks → 0 → TT_PRODUCTION_ENTRY_READY = YES
```

---

## 明确不做

- ❌ REDEFINE / 新 Open RC  
- ❌ 重复 HAT-003 / BD-005 探针  
- ❌ 本文修改 Matrix / ACTIVE  

---

*Plan only · Owner authorize Matrix sync before Phase 1 execution*
