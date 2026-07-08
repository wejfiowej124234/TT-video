# Sprint B · Provider Discovery（Catalog + HAT）

**TT_SPRINT_B:** READY · **ACTIVE:** false  
**Evidence:** READY ✅ · **Root Cause CONFIRMED:** ❌

## Day 2 Catalog Probe（staging · 不修）

| Check | Verdict |
|-------|---------|
| Profile | PASS |
| Pricing | PASS |
| Images | PASS |
| Status | PASS |
| Listings | PASS |
| Availability | PASS |

**Provider Business Data Ready (Day2 catalog):** YES

Evidence: `evidence/GO_production_readiness/step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json`

## Provider HAT 下单 Discovery

Script: `scripts/dev/run-sprint-b-provider-hat-order-validation.cjs`  
Evidence: `evidence/GO_production_readiness/step2/hat/SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json`

| Step | Verdict | Detail |
|------|---------|--------|
| provider_auth | PASS | merchant@test.com · role=provider · 无 active guide |
| create_listing | PASS | POST /market/provider/listings → 200 |
| market_visible_own_listing | WARN | merchant 新建 listing 被 public catalog 过滤（dev/smoke data_origin） |
| market_visible_catalog | PASS | 公开 catalog 10 条可见 |
| create_order | **FAIL** | 422 `market_listing_fulfillment_guide_required` |
| provider_accept | SKIP | blocked |
| mock_pay | SKIP | blocked |
| confirm_completion | SKIP | blocked |

**TT_SPRINT_B_PROVIDER_HAT_ORDER:** FAIL

## BD-002 状态（不 CLOSED）

**Current Hypothesis: REJECTED**（Catalog + HAT 均否定 Pricing 根因）

- Day2：**Pricing PASS**（10/10 priceUsdc）
- HAT：**Order FAIL** — listing owner 无 active guide profile，无法进入 accept → pay → complete
- **Catalog PASS ≠ Provider Business PASS**

**Case B · REDEFINE 候选（未 CONFIRMED · 不 ACTIVE）：**

- 原假设：Provider Pricing 不完整 → **REJECTED**
- 候选新 Root Cause：**Provider Order Lifecycle / Fulfillment Guide 缺失**
- API 信号：`market_listing_fulfillment_guide_required`

## 门禁

- `TT_SPRINT_B=READY` · `TT_SPRINT_B_ACTIVE=false`
- 进入 ACTIVE 须：**Evidence READY AND Root Cause CONFIRMED**
- 下一步：确认 REDEFINE 命名与 scope → 新 Root Cause Evidence → 再 ACTIVE
