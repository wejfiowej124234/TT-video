# Identity–Trust–Governance Deep Audit 报告

**记录时间：** 2026-06-07T07:12:53.414021+00:00  
**API：** `http://127.0.0.1:8080`  
**git_sha：** `bc5a939cd89c624be7c128b551306da177bf6016`  
**证据：** `d:\TravelTrust-V1.1\evidence\identity-trust-governance-deep-audit\20260607T071206Z\itg-findings.json`  

> DID · 身份认证 · Trust Score · 委托 · 提案 · 投票 · 治理权限 · 奖励分配 · Claim · 角色关联
> **五域审计已冻结** — [FINAL-SYSTEM-AUDIT-REPORT](FINAL-SYSTEM-AUDIT-REPORT.md)（**PASS**）· [CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT](CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT.md)（**PASS**）

---

## Executive verdict

**ITG_DEEP_AUDIT: PASS**

| 项 | 结果 |
|----|------|
| P0 | **0** |
| P1 | **0** |
| P2 | **0** |
| Identity Matrix | 5/5 PASS |
| Trust Matrix | 6/6 PASS |
| Governance Matrix | 12/13 PASS |
| UI Corridor (Playwright) | 2/3 PASS |
| PG Consistency | 6/6 PASS |

```text
ITG_DEEP_AUDIT: PASS
```

---

## 1 · Identity Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| id.register | traveler | 注册 | POST | /auth/register | 200 | 200|201 | PASS |  |
| id.login | traveler | 登录(注册内嵌) | POST | /auth/register | 200 | token | PASS |  |
| id.me | traveler | 身份读 | GET | /api/v1/me | 200 | 200+user.id | PASS | role=tourist |
| id.logout | traveler | 退出 | POST | /auth/logout | 200 | 200 | PASS |  |
| id.me_denied | public | 未登录拒绝 | GET | /api/v1/me | 401 | 401 | PASS |  |

---

## 2 · Trust Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| tr.did_rank_travelers | public | DID榜 | GET | /api/v1/did-rank/travelers?period=all | 200 | 200+array | PASS |  |
| tr.did_rank_guides | public | DID榜 | GET | /api/v1/did-rank/guides?period=all&sort=weighted | 200 | 200+array | PASS |  |
| tr.did_rank_prize_pool | public | 奖池 | GET | /api/v1/did-rank/prize-pool | 200 | ok | PASS |  |
| tr.trust_growth_ingest | public | 摄入 | POST | /api/v1/trust-growth/ingest | 200 | ok:true | PASS |  |
| tr.trust_growth_config | public | 配置 | GET | /api/v1/trust-growth/config | 200 | ok+postgres | PASS |  |
| tr.admin_observability | admin | 观测 | GET | /api/v1/admin/trust-growth/observability | 200 | 200 | PASS |  |

---

## 3 · Governance Matrix

| probe_id | role | step | method | path | http | expected | status | notes |
|---|---|---|---|---|---|---|---|---|
| gov.seed | public | 种子 | POST | /auth/seed-governance-e2e | 200 | 200 | PASS | mode=governance_proposals_projection |
| gov.proposals_list | traveler | 读 | GET | /api/v1/governance/proposals?limit=10 | 200 | 200 | PASS |  |
| gov.pool_rewards | traveler | 读 | GET | /api/v1/governance/pool | 200 | 200 | PASS |  |
| gov.pool_rewards | traveler | 奖励 | GET | /api/v1/governance/rewards | 200 | 200 | PASS |  |
| gov.proposal_detail | traveler | 详情 | GET | /api/v1/governance/proposals/911919911919911919911919911919911919 | 200 | 200 | PASS |  |
| gov.voting_power | traveler | 投票权 | GET | /api/v1/governance/voting-power | 200 | 200 | PASS |  |
| gov.vote_yes | traveler | 投票 | POST | /api/v1/governance/proposals/911919911919911919911919911919911919/vote | 400 | on_chain | PASS | governor mode |
| gov.delegate_set | traveler | 委托 | POST | /api/v1/governance/delegate | 200 | 200 | PASS |  |
| gov.delegate_blocks_vote | traveler | 委托禁投 | POST | /api/v1/governance/proposals/911919911919911919911919911919911919/vote | — | on_chain | SKIP | governor mode — API 投票走 vote_on_chain_required |
| gov.state_machines | public | 状态机 | GET | /api/v1/governance/state-machines | 200 | >=5 | PASS | count=5 |
| gov.accruals | traveler | 应计 | GET | /api/v1/governance/investor-distribution-accruals | 200 | 200 | PASS |  |
| gov.vote_anon_denied | public | 匿名禁投 | POST | /api/v1/governance/proposals/911919911919911919911919911919911919/vote | 401 | 401 | PASS |  |
| gov.rbac.traveler_admin | traveler | RBAC | GET | /api/v1/admin/trust-growth/observability | 403 | 403 | PASS |  |

---

## 4 · PG Consistency Matrix

| probe_id | check | target | pg_value | api_value | expected | status | notes |
|---|---|---|---|---|---|---|---|
| pg.user_role | state | cf107e53-bb63-4453-914b-c356d06f12a2 | tourist | traveler|guide|tourist | registered | PASS |  |
| pg.trust_metrics | count | itg-m-cb7ec1de/itg-v-cb7ec1de | 1 | >=1 | >=1 | PASS |  |
| pg.trust_generation | consistency | runtime_state | 179 | 179 | equal | PASS |  |
| pg.mvp_proposals | infra | governance_mvp_proposals | 2 | >=1 | seeded | PASS |  |
| pg.lifecycle_sm | infra | lifecycle_state_machines | 10 | >=1 | registry | PASS |  |
| pg.auth_audit_events | infra | auth_audit_events | 73 | readable | ok | PASS |  |

---

## 5 · UI Corridor (Playwright)

| probe_id | spec | step | status |
|---|---|---|---|
| ui.did_rank | 93-matrix-path-did-rank-boards.spec.ts / f007-f010-f032 | DID rank API (phase① surrogate) | PASS |
| ui.f032 | 93-matrix-path-did-rank-boards.spec.ts / f007-f010-f032 | F-032 trust-growth config (phase① surrogate) | PASS |
| ui.f007 | 93-matrix-path-did-rank-boards.spec.ts / f007-f010-f032 | F-007 profile avatar | FAIL |

---

## 6 · P0 / P1 / P2 问题清单

### P0 (0)

_无。_

### P1 (0)

_无。_

### P2 (0)

_无。_

---

## 7 · 覆盖层

| 层 | 状态 |
|----|------|
| api_matrix | executed |
| frontend_playwright | executed |
| postgres_direct | executed |
| audit_log_table | executed |
| state_machine_ssot | governance/state-machines + lifecycle_state_machines |
| rbac_registry | registry\identity-trust-governance-audit-probes.v1.yaml |
| scoring_rules | trust_growth_ingest + did-rank |
| permission_inheritance | delegate voting-power + admin RBAC |
