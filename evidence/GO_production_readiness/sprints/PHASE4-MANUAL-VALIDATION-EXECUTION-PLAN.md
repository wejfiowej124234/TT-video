# Phase 4 · Manual Validation 执行清单

**Status:** PLAN ONLY · **未执行**  
**Recorded:** 2026-07-08  
**Owner track:** Human Validation Track · Phase 4 · Final UAT  
**Prerequisite (met):** Phase 1 HAT sync · Phase 2 BFM complete · Phase 3 BDR READY · Open RC=0

**Mode:** 执行计划 only · **不** 修改 Matrix · **不** 改代码 · **不** 改 staging 数据 · **不** 切 `TT_SPRINT_B_ACTIVE`

---

## 1. 执行节奏（已验证 · 不再 per-item 授权）

```
Phase 4 Plan（本文）
        ↓
Manual 1 → Evidence → Checklist Sync
Manual 2 → Evidence → Checklist Sync
…
Manual 9 → Evidence → Checklist Sync
        ↓
Final Gate Re-evaluation
```

**一次性覆盖：** `OWNER-PHASE2-BFM-HUMAN-VALIDATION-AUTHORIZATION-GRANTED` 轨已建立 Human Validation 纪律 · Phase 4 **不再** 新增 Authorization 文档。

**FAIL 纪律：** 单项 FAIL → 写 fail Evidence → **不同步** 该项 verdict → 可继续下一项（Owner 可选停全轨）

---

## 2. 基线（Master Checklist · Phase 3 后）

| 键 | 值 |
|----|-----|
| `TT_PRODUCTION_ENTRY_READY` | **NO_GO** |
| Blocking Checks | **37** |
| Open RC | **0** |
| BFM blocking | **0** ✅ |
| BDR | **READY**（五域）✅ |
| **Manual blocking** | **9** ← Phase 4 主目标 |
| HAT blocking | 27（Phase 4 不 scope · Final Gate 后仍可能 NO_GO） |
| `TT_SPRINT_B_ACTIVE` | **false** |

**SSOT:**

- Manual: `registry/manual-validation-checklist.v1.yaml` · 9/9 **pending**
- Checklist: `evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json`
- Phase 2: `sprints/PHASE2-BFM-HUMAN-VALIDATION-EXECUTION-LATEST.json`
- Phase 3: `sprints/PHASE3-BDR-DAY2-5-EXECUTION-LATEST.json`

---

## 3. Staging 环境

| 项 | 值 |
|----|-----|
| Web | `https://tt-web-staging.fly.dev` |
| API | `https://tt-api-staging.fly.dev` |
| 密码 | `Test123!` |
| 探针账号 | tourist · guide · merchant@test.com |

---

## 4. Evidence 输出规范

### 4.1 单项 Evidence（每 Manual N）

**路径:** `evidence/GO_production_readiness/step4/manual/steps/manual-{check_id}-LATEST.json`

**Schema:** `traveltrust.manual_validation_check.v1`

| 字段 | 必填 | 说明 |
|------|------|------|
| `check_id` | ✅ | registry id |
| `order` | ✅ | 1–9 |
| `verdict` | ✅ | PASS / FAIL |
| `recorded_at_utc` | ✅ | ISO timestamp |
| `validator` | ✅ | 真人 / Agent + browser |
| `staging_web` | ✅ | staging URL |
| `device` | ✅ | Chrome/Edge/Mobile/Network profile |
| `verification` | ✅ | 见 §5 |
| `screenshots` | 推荐 | 相对路径数组 |
| `halt_item` | FAIL 时 | true |

**Screenshots 目录:** `evidence/GO_production_readiness/step4/manual/screenshots/{check_id}/`

### 4.2 汇总 Evidence（可选 · Manual 9 完成后）

- `evidence/GO_production_readiness/step4/manual/MANUAL-VALIDATION-FLOW-LATEST.json`
- `evidence/GO_production_readiness/step4/manual/MANUAL-VALIDATION-FLOW-LATEST.md`
- `sprints/PHASE4-MANUAL-VALIDATION-EXECUTION-LATEST.json`

### 4.3 Verification 层（Manual UAT · 简化五层）

| 层 | 字段 | 要求 |
|----|------|------|
| **human_click** | action · url | 真人操作描述 + 起始 URL |
| **page** | visible_text · selector | 页面终态可见 |
| **api** | optional | DevTools 关键请求（login/pay 项必填） |
| **final_outcome** | status | pass/fail 业务语义 |
| **recovery** | optional | 弱网/刷新/取消项必填 |

**PASS:** 验收标准全满足 · 无 blocking UX 缺陷

---

## 5. 执行顺序与验收标准

### Manual 1 · Chrome 桌面 (`chrome_desktop`)

| 字段 | 值 |
|------|-----|
| Scope | Baseline desktop UAT shell · core routes render |
| Routes | / · /market · /market/provider · /market/acquisition · /auth/login |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-chrome_desktop-LATEST.json` |
| Cross-ref | BFM flows validated API layer · this check validates UI shell |



**验收标准:**
- Chrome latest · 1920×1080 · no console error blocking
- Each route HTTP 200 · layout renders · no blank shell
- Navigation between routes without hard crash

### Manual 2 · 手机 (`mobile`)

| 字段 | 值 |
|------|-----|
| Scope | Responsive / mobile viewport UAT |
| Routes | / · /market · /orders · /auth/login |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-mobile-LATEST.json` |


| Device | Chrome DevTools iPhone 14 Pro or physical device |

**验收标准:**
- Viewport 390×844 (or real device) · touch targets usable
- Mobile nav / drawer reachable
- No horizontal scroll overflow on market list

### Manual 3 · Edge (`edge`)

| 字段 | 值 |
|------|-----|
| Scope | Cross-browser parity on critical paths |
| Routes | /auth/login · /market · /market/provider |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-edge-LATEST.json` |




**验收标准:**
- Microsoft Edge latest · same flows as Chrome smoke
- Login + browse provider catalog without JS fatal

### Manual 4 · 钱包连接 (`wallet`)

| 字段 | 值 |
|------|-----|
| Scope | Wallet connect UX on staging (mock/sandbox) |
| Routes | /me/identities · /me/settings · /market/acquisition |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-wallet-LATEST.json` |




**验收标准:**
- Wallet connect prompt appears when required
- Bind/save default wallet address succeeds or shows expected sandbox message
- No wallet crash blocking acquisition publish path

### Manual 5 · 弱网 (`weak_network`)

| 字段 | 值 |
|------|-----|
| Scope | Degraded network resilience |
| Routes | /market · /orders |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-weak_network-LATEST.json` |

| Setup | Chrome DevTools → Network → Slow 3G or Fast 3G |


**验收标准:**
- Pages show loading state · no infinite spinner >30s on primary route
- Retry/refresh recovers to usable state
- No uncaught network error toast loop

### Manual 6 · 登录/登出 (`login_flow`)

| 字段 | 值 |
|------|-----|
| Scope | Auth session lifecycle · UI layer |
| Routes | /auth/login · /orders · /auth/logout |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-login_flow-LATEST.json` |
| Cross-ref | HAT-003 tourist login PASS · reduces duplicate API-only proof · UI still required |



**验收标准:**
- Login 200 · role correct on /me or header
- Protected route accessible when logged in
- Logout clears session · protected route redirects 401/ login

### Manual 7 · 支付(Mock) (`pay_mock`)

| 字段 | 值 |
|------|-----|
| Scope | Mock-pay escrow UI on completed order path |
| Routes | /escrow/[order_id] · /orders |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-pay_mock-LATEST.json` |
| Cross-ref | BFM Session A/B/C API mock-pay PASS · UI confirmation required |



**验收标准:**
- Tourist initiates mock-pay from UI
- Order transitions to escrowed · UI reflects status
- Aligns with BFM Provider/Guide mock-pay chain

### Manual 8 · 取消/异常 (`cancel_refund`)

| 字段 | 值 |
|------|-----|
| Scope | Cancel / exception handling UX |
| Routes | /orders · /escrow/[order_id] |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-cancel_refund-LATEST.json` |




**验收标准:**
- Cancel or dispute path reachable from pending/accepted order
- Error states show human-readable message (not raw 500)
- App remains navigable after exception

### Manual 9 · 刷新/恢复 (`refresh_recovery`)

| 字段 | 值 |
|------|-----|
| Scope | Hard refresh mid-flow recovery |
| Routes | /market · /orders · /escrow/[order_id] |
| Evidence | `evidence/GO_production_readiness/step4/manual/steps/manual-refresh_recovery-LATEST.json` |




**验收标准:**
- F5/Ctrl+R on in-progress page restores consistent state
- Session preserved where expected · re-login if expired
- No duplicate submit on refresh recovery


---

## 6. Matrix / Checklist 映射计划（执行后 · 逐项 Sync）

### 6.1 Manual Validation Checklist

| Order | check_id | 当前 | Sync 后（PASS 时） |
|-------|----------|------|-------------------|
| 1 | chrome_desktop | pending | **pass** + E ref |
| 2 | mobile | pending | **pass** + E ref |
| 3 | edge | pending | **pass** + E ref |
| 4 | wallet | pending | **pass** + E ref |
| 5 | weak_network | pending | **pass** + E ref |
| 6 | login_flow | pending | **pass** + E ref |
| 7 | pay_mock | pending | **pass** + E ref |
| 8 | cancel_refund | pending | **pass** + E ref |
| 9 | refresh_recovery | pending | **pass** + E ref |

**SSOT:** `registry/manual-validation-checklist.v1.yaml`  
**Note 模板:** `Manual-{id} · UAT PASS · E: step4/manual/steps/manual-{id}-LATEST.json`

**Manual Gate:** 9/9 pass → `TT_MANUAL_VALIDATION: PASS` · blocking **9 → 0**

### 6.2 每项 Sync 后动作

1. 更新 `manual-validation-checklist.v1.yaml` **单项** `verdict` + `note`
2. `run-production-readiness-master-checklist.cjs` 复算
3. 追加 `PHASE4-MANUAL-VALIDATION-EXECUTION-LATEST.json` progress

**不修改:** HAT Matrix · BFM Matrix · BDR registry（Phase 4 scope 外）

### 6.3 HAT 交叉参考（Optional · 非 Phase 4 必做）

| Manual check | 可减轻重复的 HAT/BFM Evidence |
|--------------|------------------------------|
| login_flow | HAT-003 tourist · BFM sessions |
| pay_mock | BFM Provider/Guide/Acquisition mock-pay |

Phase 4 **仍须** UI 层 PASS · API-only 不能替代 Manual verdict

---

## 7. Final Gate Re-evaluation（Manual 9 完成后）

```bash
node scripts/dev/run-production-readiness-master-checklist.cjs
```

**产出:** `PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json` 更新

| Gate | Phase 4 前 | Manual 9/9 后（估） |
|------|------------|---------------------|
| Manual blocking | 9 | **0** |
| Total blocking | 37 | **~28** |
| HAT | NOT_PASS | NOT_PASS（27 仍 pending） |
| BDR | READY | READY |
| BFM | PASS | PASS |
| `TT_PRODUCTION_ENTRY_READY` | NO_GO | **likely NO_GO**（HAT 27 + PE gate） |

**Production Entry GO 仍需:** HAT Matrix 收口 + Manual PASS + BDR READY + BFM PASS + Open RC=0

---

## 8. 明确不做

| 项 | 说明 |
|----|------|
| 修改 Manual/HAT/BFM Matrix | 本文 plan only |
| 业务代码 / staging 数据 Fix | 禁止 |
| `TT_SPRINT_B_ACTIVE=true` | 禁止 |
| 新 Open RC / REDEFINE | 禁止 |
| Per-manual Authorization 文档 | 禁止（新节奏） |

---

## 9. 建议 Runner（执行期 · 非本文）

| 脚本 | 用途 |
|------|------|
| `run-manual-validation-check.cjs` | 单项 Manual N 证据写入 + 可选 browser |
| `run-manual-matrix-sync-check.cjs` | 单项 verdict sync + checklist |
| `run-bdr-phase3-days2-5.cjs` | 已完成 · 勿重跑 |

**签核后第一步:** Manual 1 Chrome → Evidence → Checklist Sync
