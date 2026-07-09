# Cross-Domain Integration Audit 报告

**记录时间：** 2026-06-13T09:16:50.061630+00:00  
**API：** `http://127.0.0.1:8080`  
**git_sha：** `5ab1f8ba2229ccf20b99deb35e7ae1370954a328`  
**证据：** `D:\TravelTrust-V1.1\evidence\cross-domain-integration-audit\20260613T091639Z\cdia-findings.json`  

> 八大域跨域状态传播：Identity · Trust · Community · Order · Escrow · Dispute · Governance · Admin
> **Admin / OED / Community / ITG / CDIA 审计范围已冻结** — 见 [ADMIN-SECURITY-CLOSURE-REPORT](ADMIN-SECURITY-CLOSURE-REPORT.md) · [ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT](ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md) · [COMMUNITY-DEEP-AUDIT-REPORT](COMMUNITY-DEEP-AUDIT-REPORT.md) · [IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT](IDENTITY-TRUST-GOVERNANCE-DEEP-AUDIT-REPORT.md)

---

## Executive verdict

**CDIA: PASS**

| 项 | 结果 |
|----|------|
| P0 | **0** |
| P1 | **0** |
| P2 | **0** |
| Cross-Domain Matrix | 10/10 PASS |
| State Propagation Matrix | 14/14 PASS |
| Event Consistency Matrix | 6/6 PASS |
| PG Consistency | 7/7 PASS |

```text
CDIA: PASS
```

---

## 1 · Cross-Domain Matrix

| probe_id | from_domain | to_domain | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| xd.id_trust | identity | trust | traveler | 身份→信任投影 | POST | /auth/seed-trust-gate-e2e | 200 | ok | PASS |  |
| xd.trust_order | trust | order | traveler | 信任→订单闸 | POST | /api/v1/orders/f0e0c201-0001-4001-8001-000000000003/mock-pay | 403 | 403 | PASS |  |
| xd.id_order | identity | order | traveler | 身份→订单闸 | POST | /api/v1/orders | 403 | 403 | PASS | trust_verification_pending |
| xd.order_escrow | order | escrow | traveler | 订单→托管 | POST | /api/v1/orders/09196d36-0d3b-49cd-bc4d-bb48916f2028/mock-pay | 200 | escrowed | PASS |  |
| xd.escrow_dispute | escrow | dispute | traveler | 托管→争议 | POST | /api/v1/orders/8c6b9a53-730a-4f6a-9cc2-61e8daa7c159/dispute | 200 | disputed | PASS |  |
| xd.dispute_order | dispute | order | arbitrator | 争议→订单终态 | POST | /api/v1/disputes/c78723fc-35f5-47fa-bf9f-b16f9e89e1e3/resolve | 200 | refunded | PASS |  |
| xd.community_admin | admin | community | admin | Admin→处罚 | POST | /api/v1/admin/community/penalties | 200 | 200 | PASS |  |
| xd.community_write | community | trust | author | 处罚→UGC闸 | POST | /api/v1/community/posts | 200 | 403 | PASS |  |
| xd.governance_isolated | governance | order | traveler | 治理↔订单隔离 | POST | /api/v1/governance/proposals/911919911919911919911919911919911919/vote | 400 | order=completed | PASS | after=completed |
| xd.admin_audit | admin | identity | admin | Admin→审计 | GET | /api/v1/admin/audit-logs | 200 | 200 | PASS |  |

---

## 2 · State Propagation Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| prop.a_seed | public | trust-gate种子 | POST | /auth/seed-trust-gate-e2e | 200 | 200 | PASS |  |
| prop.a_risk_reflect | traveler | 争议→risk_high | GET | /api/v1/me | 200 | risk_level=high | PASS | basis=open_disputes_as_party:4 |
| prop.a_risk_block | traveler | risk闸mock-pay | POST | /api/v1/orders/f0e0c201-0001-4001-8001-000000000003/mock-pay | 403 | 403 | PASS | trust_risk_too_high |
| prop.b_create | traveler | 下单 | POST | /api/v1/orders | 200 | created | PASS |  |
| prop.b_escrow | guide | 接单 | POST | /api/v1/orders/09196d36-0d3b-49cd-bc4d-bb48916f2028/accept | 200 | 200 | PASS |  |
| prop.b_escrow | traveler | 进托管 | POST | /api/v1/orders/09196d36-0d3b-49cd-bc4d-bb48916f2028/mock-pay | 200 | escrowed | PASS |  |
| prop.b_complete | guide | 完成 | POST | /api/v1/orders/09196d36-0d3b-49cd-bc4d-bb48916f2028/confirm-completion | 200 | completed | PASS |  |
| prop.b_reviews | traveler | 评分 | POST | /api/v1/orders/09196d36-0d3b-49cd-bc4d-bb48916f2028/reviews | 200 | 200 | PASS |  |
| prop.b_reviews | guide | 评分 | POST | /api/v1/orders/09196d36-0d3b-49cd-bc4d-bb48916f2028/reviews | 200 | 200 | PASS |  |
| prop.c_open | traveler | 开争议 | POST | /api/v1/orders/8c6b9a53-730a-4f6a-9cc2-61e8daa7c159/dispute | 200 | disputed | PASS |  |
| prop.c_resolve | arbitrator | 裁决 | POST | /api/v1/disputes/c78723fc-35f5-47fa-bf9f-b16f9e89e1e3/resolve | 200 | resolved | PASS |  |
| prop.f_penalty | admin | mute处罚 | POST | /api/v1/admin/community/penalties | 200 | 200 | PASS |  |
| prop.f_block | author | 处罚拦截 | POST | /api/v1/community/posts | 200 | 403 | PASS | community_penalty_active |
| prop.h_audit | admin | moderation审计 | GET | /api/v1/admin/audit-logs | 200 | community_action | PASS | items=30 |

---

## 3 · Event Consistency Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| evt.trust_risk_basis | traveler | open_disputes↔trust | GET | /api/v1/me | 200 | open_disputes | PASS | open_disputes_as_party:4 |
| evt.dispute_pg_api | arbitrator | 争议态 | POST | /api/v1/disputes/c78723fc-35f5-47fa-bf9f-b16f9e89e1e3/resolve | 200 | resolved | PASS | order=refunded |
| evt.order_pg_api | arbitrator | 订单态 | GET | /api/v1/orders/8c6b9a53-730a-4f6a-9cc2-61e8daa7c159 | — | refunded | PASS |  |
| evt.penalty_pg_active | admin | 处罚PG | POST | /api/v1/admin/community/penalties | 200 | active | PASS | 32ffb563-5f8d-4273-b88b-cf4a4e39090e |
| evt.auth_audit | admin | auth审计表 | GET | /api/v1/admin/audit-logs | 200 | 200 | PASS |  |
| evt.admin_audit | admin | moderation审计 | GET | /api/v1/admin/audit-logs | 200 | hit | PASS | report=252c87aa-47c1-42a0-b82e-cd6a411e38e1 |

---

## 4 · PG Consistency Matrix

| probe_id | check | target | pg_value | api_value | expected | status | notes |
|---|---|---|---|---|---|---|---|
| pg.order_happy | state | 09196d36-0d3b-49cd-bc4d-bb48916f2028 | completed | completed|escrowed|accepted | progressed | PASS | completed |
| pg.order_dispute_terminal | sync | 8c6b9a53-730a-4f6a-9cc2-61e8daa7c159 | refunded | refunded | equal+terminal | PASS |  |
| pg.dispute_resolved | sync | c78723fc-35f5-47fa-bf9f-b16f9e89e1e3 | resolved | resolved | resolved | PASS |  |
| pg.penalty_active | state | 32ffb563-5f8d-4273-b88b-cf4a4e39090e | 2 | >=1 | active | PASS |  |
| pg.risk_open_disputes | count | f0e0a001-0001-4001-8001-000000000003 | 4 | >=4 | risk_inputs | PASS | open=4 |
| pg.auth_audit_events | infra | auth_audit_events | 73 | readable | ok | PASS |  |
| pg.admin_audit_logs | infra | admin_audit_logs | 6585 | readable | ok | PASS |  |

---

## 5 · P0 / P1 / P2 问题清单

### P0 (0)

_无。_

### P1 (0)

_无。_

### P2 (0)

_无。_

---

## 6 · 传播链覆盖

| 链 | 描述 |
|----|------|
| A | Identity/Dispute → Trust → Order 资格闸 |
| B | Order → Escrow → Complete → Reviews |
| C | Escrow → Dispute → Resolve → Order 终态 |
| F | Admin → Community Penalty → UGC 拦截 |
| H | Admin 操作 → audit-logs |
| I | Governance 投票 ↔ Order 隔离 |

---

## 7 · 覆盖层

| 层 | 状态 |
|----|------|
| api_cross_domain | executed |
| state_propagation_chains | A,B,C,F,H,I |
| postgres_direct | executed |
| audit_log_tables | auth_audit_events + admin_audit_logs |
| state_machine_ssot | escrow OrderState + community_penalties + governance_mvp |
| domains_frozen | admin+oed+community+itg |
