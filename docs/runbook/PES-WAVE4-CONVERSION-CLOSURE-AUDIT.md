# PES Wave 4 · Conversion Closure Audit

**生效：** 2026-06-07  
**Sprint：** Product Enhancement Sprint · Wave 4 · Conversion Closure  
**基线：** `FINAL_SYSTEM_AUDIT: PASS`（冻结）  
**RUJR 基线：** `pes-real-user-journey-review-20260607`  
**机读 ID：** `product-enhancement-wave4-closure-20260607`

---

## 0 · 机读键

```text
FINAL_SYSTEM_AUDIT_BASELINE: PASS
PRODUCT_ENHANCEMENT_SPRINT: ACTIVE
PES_WAVE4_ID: product-enhancement-wave4-closure-20260607
PES_RUJR: COMPLETE
PES_FEATURE_DEVELOPMENT: ACTIVE
BUSINESS_CORE_CHAIN: FROZEN
API_CONTRACT: FROZEN
```

---

## 1 · P0 闭合项

| ID | 流失段 | 组件 | 触点 |
|----|--------|------|------|
| **CC-P0-01** | find_guide → order | `MarketOrderClosureStrip` | `/market` |
| **CC-P0-02** | identity → post | `IdentityPostClosureStrip` | `/community` |
| **CC-P0-03** | visit → register | `PersistentRoleEntryBar` | `/`（常驻） |

**统一 Auth：** `pesAuthReturnFlow.ts` · `returnUrl` + `pes_intent`（不改 `postAuthReturnPath` 核心）

---

## 2 · Before / After Funnel Matrix

| 转化段 | Before 流失率 | After 目标 | Δ (pp) | 闭合 ID |
|--------|---------------|------------|--------|---------|
| visit → register | **18.8%** | 10.0% | **+8.8** | CC-P0-03 |
| identity → post | **59.4%** | 35.0% | **+24.4** | CC-P0-02 |
| find_guide → order | **90.9%** | 70.0% | **+20.9** | CC-P0-01 |

*Before：RUJR 48 轮 `rujr-report-synth.json` · After：Wave 4 UX 收口目标（待下轮 RUJR 验证）*

---

## 3 · Drop-off Delta Report

| 段 | Before | After 目标 | Δ pp | 证据键 |
|----|--------|------------|------|--------|
| find_guide_order | 90.9% | 70.0% | 20.9 | `pes4_delta_find_guide_order` |
| identity_post | 59.4% | 35.0% | 24.4 | `pes4_delta_identity_post` |
| visit_register | 18.8% | 10.0% | 8.8 | `pes4_delta_visit_register` |

**机读：** `buildDropoffDeltaReport()` · `frontend/lib/conversionClosureWave4.ts`

---

## 4 · 交付组件

| 组件 | 作用 |
|------|------|
| `PersistentRoleEntryBar` | 首页 Hero 下常驻四角色横滑入口 |
| `MarketOrderClosureStrip` | 市场内「查看订单 / 注册后下单」+ Escrow 叙事 |
| `IdentityPostClosureStrip` | 社区「开通身份 / 去发帖」+ Auth 回流 |
| `pesAuthReturnFlow` | 统一 `buildPesAuthHref` · `pes_intent` 解析 |

**探针：** `data-tt-pes-wave4` · `data-tt-pes-role-bar` · `data-tt-pes-market-order-closure` · `data-tt-pes-identity-post-closure`

---

## 5 · 范围外

- 订单状态机 · Escrow 执行 · 治理投票逻辑
- HTTP/API 契约变更
- `postAuthReturnPath` / `resolvePostAuthReturnPath` 行为变更

---

## 6 · 验收

```bash
cd frontend
npx vitest run lib/conversionClosureWave4.test.ts lib/pesAuthReturnFlow.test.ts
npx vitest run lib/pesJourneyReviewAggregate.test.ts lib/conversionAnalyticsLayer.test.ts
```

**下轮验证：** 重跑 RUJR Playwright 48 轮 · 对比 `/admin/conversion-analytics` Before/After

---

*PES Wave 4 Conversion Closure Audit · 2026-06-07*
