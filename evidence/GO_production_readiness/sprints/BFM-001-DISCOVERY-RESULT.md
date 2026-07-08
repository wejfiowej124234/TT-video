# BFM-001 · Acquisition 全链 Discovery

**Mode:** Discovery only · **Fix:** none · **ACTIVE:** false
**Recorded:** 2026-07-07

## Executive

| 项 | 结果 |
|----|------|
| **Hypothesis** | Acquisition 响应链路未真人走通 |
| **Verdict** | **REDEFINE_CANDIDATE** |
| **Candidate RC** | `acquisition_human_verification_not_executed` |
| **API 全链（pilot-owned）** | fresh_user_full_chain, seed_persona_chain, high_bounty_fulfillment_gate |
| **OCS catalog 成交层** | PARTIAL · blocked at close_deal |

## BFM Matrix · API vs 真人

| Step | Registry | API Discovery | Human |
|------|----------|---------------|-------|
| publish | pending | PASS | NOT_EXECUTED |
| respond | pending | PASS | NOT_EXECUTED |
| close_deal | pending | PARTIAL | NOT_EXECUTED |
| complete | pending | PASS | NOT_EXECUTED |

## Tracks

### fresh_user_full_chain · PASS

| Step | Verdict | HTTP | Note |
|------|---------|------|------|
| register_owner | PASS |  | bfm001-own-1783468659524@traveltrust.test |
| register_carrier | PASS |  | bfm001-car-1783468659524@traveltrust.test |
| bind_wallet | PASS |  |  |
| publish_bond | PASS | 200 |  |
| publish_listing | PASS | 200 |  |
| respond_create_order | PASS | 200 |  |
| accept | PASS | 200 |  |
| mock_pay | PASS | 200 |  |
| confirm_completion | PASS | 200 |  |

### seed_persona_chain · PASS

| Step | Verdict | HTTP | Note |
|------|---------|------|------|
| login_multi_demo | PASS |  |  |
| register_fresh_carrier | PASS |  | bfm001-seed-car-1783468659524@traveltrust.test |
| publish_bond | PASS | 200 |  |
| publish_listing | PASS | 200 |  |
| respond_create_order | PASS | 200 |  |
| accept | PASS | 200 |  |
| mock_pay | PASS | 200 |  |
| confirm_completion | PASS | 200 |  |

### ocs_production_catalog · PARTIAL

| Step | Verdict | HTTP | Note |
|------|---------|------|------|
| catalog_pilot | PASS |  |  |
| register_fresh_carrier | PASS |  | bfm001-ocs-car-1783468673237@traveltrust.test |
| respond_create_order | PASS | 200 |  |
| accept | PASS | 200 |  |
| mock_pay | FAIL |  | mock-pay requires order.tourist_id = listing.owner_user_id (acquisition_listing) |
| confirm_completion | BLOCKED |  | blocked by close_deal |

### high_bounty_fulfillment_gate · PASS

| Step | Verdict | HTTP | Note |
|------|---------|------|------|
| publish_high_bounty | PASS |  |  |
| respond_without_fulfillment_bond | PASS | 400 | acquisition_fulfillment_bond_required |
| respond_with_fulfillment_bond | PASS | 200 |  |

## 门禁

- BFM-001 **仍 OPEN**（Discovery 完成 · 待 Owner REDEFINE）
- `fix_authorized=false` · `TT_SPRINT_B_ACTIVE=false`
