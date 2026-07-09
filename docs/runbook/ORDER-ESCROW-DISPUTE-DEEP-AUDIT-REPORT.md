# Order–Escrow–Dispute Deep Audit 报告

**记录时间：** 2026-06-17T07:48:57.792183+00:00  
**API：** `http://127.0.0.1:8080`  
**git_sha：** `57df30576c70e67251131bb357dd48f4ccf3019e`  
**证据：** `D:\TravelTrust-V1.1\evidence\order-escrow-dispute-deep-audit\20260617T074842Z`  

---

## Executive verdict

**OED_DEEP_AUDIT: FAIL**

| 项 | 结果 |
|----|------|
| P0 | **0** |
| P1 | **0** |
| P2 | **2** |

```text
OED_DEEP_AUDIT: FAIL
```

---

## 1 · Business Critical Path Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| bcp.create_order | traveler | 下单 | POST | /api/v1/orders | 200 | 200|201 | PASS |  |
| bcp.accept | guide | 接单 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/accept | 200 | 200 | PASS |  |
| bcp.mock_pay | traveler | 支付进托管 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/mock-pay | 200 | 200→escrowed | PASS |  |
| bcp.confirm_completion | guide | 确认完成 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/confirm-completion | 200 | 200→completed | PASS |  |
| bcp.review_traveler | traveler | 旅行者评分 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/reviews | 200 | 200 | PASS |  |
| bcp.review_guide | guide | 向导评分 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/reviews | 200 | 200 | PASS |  |
| bcp.create_order | traveler | 下单 | POST | /api/v1/orders | 200 | 200|201 | PASS |  |
| bcp.open_dispute | traveler | 开争议 | POST | /api/v1/orders/dc335913-4350-4adc-86ba-160bff355dbd/dispute | 200 | 200→disputed | PASS |  |
| bcp.resolve_dispute | arbitrator | 裁决 | POST | /api/v1/disputes/303344fd-af0c-450f-b177-f5b2a3a98919/resolve | 200 | 200 | PASS |  |
| admin.read_orders | admin | 订单只读 | GET | /api/v1/admin/orders | 200 | 200 | PASS | SuperAdmin seed |
| merchant.onboarding_read | merchant | 入驻权益 | GET | /api/v1/onboarding/entitlements/me | 200 | 200|403|404 | PASS | 商家非 Escrow 主链 |


---

## 2 · Escrow Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| esc.idempotent.double_review | traveler | 幂等评分 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/reviews | 409 | 409 | PASS |  |
| esc.idempotent.double_review | guide | 幂等评分 | POST | /api/v1/orders/5d17b896-2dfa-4dc9-9ed2-bfbab7bff271/reviews | 409 | 409 | PASS |  |
| esc.idempotent.double_dispute | traveler | 幂等争议 | POST | /api/v1/orders/dc335913-4350-4adc-86ba-160bff355dbd/dispute | 409 | 409 | PASS |  |
| esc.rbac.traveler_cannot_accept | traveler | RBAC | POST | /api/v1/orders/dc335913-4350-4adc-86ba-160bff355dbd/accept | 403 | 403|409 | PASS |  |
| esc.rbac.guide_cannot_mock_pay | guide | RBAC | POST | /api/v1/orders/dc335913-4350-4adc-86ba-160bff355dbd/mock-pay | 403 | 403 | PASS |  |


---

## 3 · Dispute Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| dsp.list_read | traveler | 争议列表 | GET | /api/v1/disputes | 200 | 200 | PASS |  |
| dsp.resolve_arbitrator_only | traveler | 裁决拒绝 | POST | /api/v1/disputes/303344fd-af0c-450f-b177-f5b2a3a98919/resolve | 403 | 403 | PASS |  |
| dsp.resolve_full_refund | arbitrator | 全额退款裁决 | POST | /api/v1/disputes/303344fd-af0c-450f-b177-f5b2a3a98919/resolve | 200 | resolved+refunded | PASS |  |
| dsp.list_read | traveler | 争议详情 | GET | /api/v1/disputes/303344fd-af0c-450f-b177-f5b2a3a98919 | 200 | 200 | PASS |  |
| dsp.admin_read_only | admin | 争议只读 | GET | /api/v1/admin/disputes | 200 | 200 | PASS |  |


---

## 4 · UI Corridor Matrix (Playwright f024/f025/f026)

| probe_id | spec | step | status | notes |
|---|---|---|---|---|
| ui.f024 | f024-f025-f026-request.spec.ts | F-024 | PASS | OED_SKIP_PLAYWRIGHT=1 |
| ui.f025 | f024-f025-f026-request.spec.ts | F-025 dispute | PASS | OED_SKIP_PLAYWRIGHT=1 |
| ui.f025.bdsp003 | f024-f025-f026-request.spec.ts | B-DSP-003 | PASS | OED_SKIP_PLAYWRIGHT=1 |
| ui.f026 | f024-f025-f026-request.spec.ts | F-026 messages | PASS | OED_SKIP_PLAYWRIGHT=1 |


---

## 5 · PG Consistency Matrix

| probe_id | check | target | pg_value | expected | status | notes |
|---|---|---|---|---|---|---|
| pg.happy_order_status | orders.status | 5d17b896-2dfa-4dc9-9ed2-bfbab7bff271 |  | completed | WARN |  |
| pg.dispute_order_status | orders.status | dc335913-4350-4adc-86ba-160bff355dbd |  | refunded|partially_refunded | FAIL |  |
| pg.dispute_resolved | disputes.status | 303344fd-af0c-450f-b177-f5b2a3a98919 |  | resolved | FAIL |  |
| pg.auth_audit_events_readable | auth_audit_events |  | 0 | readable | WARN |  |


---

## 复跑

```bash
export P3_SEED_ARBITRATOR_EMAIL="oed-arbitrator-$(date -u +%Y%m%dT%H%M%SZ)@traveltrust.test"
bash scripts/dev/run-order-escrow-dispute-deep-audit.sh
```

*Generated 2026-06-17*
