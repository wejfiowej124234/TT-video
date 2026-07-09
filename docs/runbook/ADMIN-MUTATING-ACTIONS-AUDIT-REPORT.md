# Admin Mutating Actions Audit 报告

**记录时间：** 2026-06-07T05:56:04.664405+00:00  
**API：** [http://127.0.0.1:8080](http://127.0.0.1:8080)  
**管理员种子：** `tourist@test.com`  
**git_sha：** `bc5a939cd89c624be7c128b551306da177bf6016`  
**证据：** `D:/TravelTrust-V1.1/evidence/admin-security-closure/20260607T055510Z/amwa/amwa-findings.json`  

> **暂停新增功能** · Admin Write / Audit Log / RBAC 深度审计 · ② staging  
> 口径：按钮→API→DB→审计日志 · 二次确认 · 幂等 · 防重复 · 会话失效

---

## Executive verdict

| 项 | 结果 |
|----|------|
| **AMWA overall** | **CONDITIONAL** |
| **P0** | **0** |
| **P1** | **7** |
| **P2** | **11** |
| **写操作登记** | **31** |
| **已探针** | **31** |

```text
AMWA_ADMIN_MUTATING: CONDITIONAL
```

---

## 1 · Admin Write Matrix

| ID | 域 | 方法 | 路径 | 权限 | L5 UI | 管理员探针 | 门闸 | 幂等探针 |
|----|-----|------|------|------|-------|------------|------|----------|
| W01 | 用户治理 | POST | `/api/v1/admin/users/00000000-0000-4000-8000-000000000010` | `admin.users.write` | YES | 400 | PASS | — |
| W02 | 用户治理 | PUT | `/api/v1/admin/users/00000000-0000-4000-8000-000000000010` | `admin.users.write` | YES | 415 | PARTIAL | — |
| W03 | 用户治理 | POST | `/api/v1/admin/users/00000000-0000-4000-8000-000000000010` | `admin.users.write` | YES | 415 | PARTIAL | — |
| W04 | 收购门闸 | PATCH | `/api/v1/admin/users/00000000-0000-4000-8000-000000000010` | `admin.acquisition.suspend` | YES | 415 | PARTIAL | — |
| W05 | 向导审核 | PATCH | `/api/v1/admin/guides/00000000-0000-4000-8000-00000000001` | `admin.users.write` | NO | 415 | PARTIAL | — |
| W06 | 入驻审核 | PATCH | `/api/v1/admin/users/00000000-0000-4000-8000-000000000010` | `admin.onboarding.provider_review` | NO | 415 | PARTIAL | — |
| W07 | 入驻审核 | PATCH | `/api/v1/admin/users/00000000-0000-4000-8000-000000000010` | `admin.onboarding.steward_review` | NO | 415 | PARTIAL | — |
| W08 | 入驻审核 | PATCH | `/api/v1/admin/onboarding/entitlements/00000000-0000-4000` | `admin.onboarding.write` | YES | 415 | PARTIAL | — |
| W09 | 入驻审核 | POST | `/api/v1/admin/onboarding/entitlements/00000000-0000-4000` | `admin.onboarding.write` | YES | 415 | PARTIAL | — |
| W10 | 入驻审核 | POST | `/api/v1/admin/onboarding/entitlements/00000000-0000-4000` | `admin.onboarding.write` | YES | 415 | PARTIAL | — |
| W11 | 审批链 | POST | `/api/v1/admin/approvals/00000000-0000-0000-0000-00000000` | `admin.approve` | YES | 400 | PASS | 404/404 |
| W12 | 审批链 | POST | `/api/v1/admin/approvals/00000000-0000-0000-0000-00000000` | `admin.approve` | YES | 404 | PASS | 404/404 |
| W13 | 社区治理 | POST | `/api/v1/admin/community/penalties` | `admin.community.moderate` | YES | 400 | PASS | 422/422 |
| W14 | 社区治理 | PATCH | `/api/v1/admin/community/moderation/00000000-0000-4000-80` | `admin.community.moderate` | YES | 400 | PASS | 400/400 |
| W15 | 社区治理 | POST | `/api/v1/admin/community/appeals/00000000-0000-4000-8000-` | `admin.community.super` | YES | 400 | PASS | — |
| W16 | 社区治理 | PATCH | `/api/v1/admin/community/comments/00000000-0000-4000-8000` | `admin.community.moderate` | YES | 400 | PASS | — |
| W17 | 社区治理 | PATCH | `/api/v1/admin/community/abuse-policy` | `admin.community.super` | YES | 400 | PASS | 400/400 |
| W18 | 社区治理 | PATCH | `/api/v1/admin/community/reports/00000000-0000-0000-0000-` | `admin.community.moderate` | YES | 404 | DRIFT | — |
| W19 | 平台配置 | POST | `/api/v1/admin/flags/00000000-0000-0000-0000-000000000099` | `admin.platform.publish` | YES | 400 | PASS | 200/200 |
| W20 | 平台配置 | POST | `/api/v1/admin/policies/00000000-0000-4000-8000-000000000` | `admin.platform.publish` | YES | 400 | PASS | 400/400 |
| W21 | 平台配置 | POST | `/api/v1/admin/tenants/scopes/00000000-0000-4000-8000-000` | `admin.platform.publish` | YES | 400 | PASS | 400/400 |
| W22 | 平台配置 | POST | `/api/v1/admin/scheduler/jobs/smoke_probe_job/rerun` | `admin.approve` | YES | 400 | PASS | 200/200 |
| W23 | 合规 | POST | `/api/v1/admin/compliance/data-requests/00000000-0000-000` | `admin.approve` | YES | 400 | PASS | 404/404 |
| W24 | 治理 | PATCH | `/api/v1/admin/trust-growth/control` | `admin.trust_growth.write` | YES | 200 | WARN | 200/200 |
| W25 | 治理 | POST | `/api/v1/admin/trust-growth/rollback-control` | `admin.trust_growth.write` | YES | 200 | WARN | — |
| W26 | 安全 | PATCH | `/api/v1/admin/security/2fa-policy` | `admin.approve` | YES | 200 | WARN | 200/200 |
| W27 | 安全 | POST | `/api/v1/admin/security/totp/enroll` | `admin.read` | YES | 200 | WARN | — |
| W28 | 安全 | POST | `/api/v1/admin/security/totp/verify` | `admin.read` | YES | 400 | PASS | 400/400 |
| E01 | 导出 | GET | `/api/v1/admin/finance/summary/export` | `admin.finance.read` | NO | 200 | WARN | — |
| E02 | 导出 | GET | `/api/v1/admin/indexer/reconcile-reports/export` | `admin.read` | NO | 200 | WARN | — |
| E03 | 导出 | GET | `/api/v1/admin/region-vault/forwarded-events/export` | `admin.finance.read` | NO | 200 | WARN | — |

---

## 2 · Audit Log Matrix

| 对象 | 期望 action / 文件 | 结论 | 备注 |
|------|---------------------|------|------|
| crates/api/src/routes/admin/admin_acquisition_suspend_http.rs | `crates/api/src/routes/admin/admin_acquisition_suspend_http.rs` | PASS |  |
| crates/api/src/routes/admin/admin_compliance_http/update.rs | `crates/api/src/routes/admin/admin_compliance_http/update.rs` | PASS |  |
| crates/api/src/routes/admin/admin_onboarding/entitlements_write.rs | `crates/api/src/routes/admin/admin_onboarding/entitlements_write.rs` | PASS |  |
| crates/api/src/routes/admin/admin_community/moderation_patch.rs | `crates/api/src/routes/admin/admin_community/moderation_patch.rs` | PASS |  |
| crates/api/src/routes/admin/admin_community/policy_mutations.rs | `crates/api/src/routes/admin/admin_community/policy_mutations.rs` | PASS |  |
| crates/api/src/routes/admin/trust_growth_obs.rs | `crates/api/src/routes/admin/trust_growth_obs.rs` | PASS |  |
| crates/api/src/routes/admin/admin_rbac.rs | `crates/api/src/routes/admin/admin_rbac.rs` | PASS |  |
| crates/api/src/routes/admin/admin_jobs_scheduler.rs | `crates/api/src/routes/admin/admin_jobs_scheduler.rs` | PASS |  |
| crates/api/src/routes/admin/admin_provider_application_http.rs | `crates/api/src/routes/admin/admin_provider_application_http.rs` | PASS |  |
| crates/api/src/routes/admin/admin_steward_application_http.rs | `crates/api/src/routes/admin/admin_steward_application_http.rs` | PASS |  |
| W01 | `admin.users.role_change_request` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W02 | `admin.users.console_role` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W03 | `admin.users.console_role_change_request` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W04 | `admin.acquisition_publish_suspend` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W05 | `admin.guides.registration_patch` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W06 | `admin.provider_application_review` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W07 | `admin.steward_application_review` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W08 | `admin.onboarding.entitlement_patch` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W09 | `admin.onboarding.entitlement_revoke` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W10 | `admin.onboarding.financial_reversal` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W11 | `admin.approvals.approve` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W12 | `admin.approvals.reject` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W13 | `admin.community.penalties.create` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W14 | `admin.community.moderation.update` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W15 | `admin.community.appeals.review` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W16 | `admin.community.comments.visibility` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W17 | `admin.community.abuse_policy.patch` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W19 | `admin.flags.publish` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W20 | `admin.policies.publish` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W21 | `admin.tenants.scopes.publish` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W22 | `admin.scheduler.jobs.rerun` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W23 | `admin.compliance.data_requests.update` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W24 | `trust_growth_control_patch` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W25 | `trust_growth_rollback` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| W26 | `admin.security.2fa_policy` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| E01 | `admin.finance.summary.export` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| E02 | `admin.indexer.reconcile_reports.export` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |
| E03 | `admin.region_vault_forwarded.export` | SKIP | 占位探针不触发 200；静态 handler 审计在 AUDIT_WRITE_FILES |

---

## 3 · RBAC Matrix（写路径 × 角色）

| 写操作 | 角色 | HTTP | 裁决 |
|--------|------|------|------|
| W01 | 匿名 | 401 | PASS |
| W01 | 旅行者 | 400 | FAIL |
| W02 | 匿名 | 401 | PASS |
| W02 | 旅行者 | 415 | FAIL |
| W03 | 匿名 | 401 | PASS |
| W03 | 旅行者 | 415 | FAIL |
| W04 | 匿名 | 401 | PASS |
| W04 | 旅行者 | 415 | FAIL |
| W05 | 匿名 | 401 | PASS |
| W05 | 旅行者 | 415 | FAIL |
| W06 | 匿名 | 401 | PASS |
| W06 | 旅行者 | 415 | FAIL |
| W07 | 匿名 | 401 | PASS |
| W07 | 旅行者 | 415 | FAIL |
| W08 | 匿名 | 401 | PASS |
| W08 | 旅行者 | 415 | FAIL |
| W09 | 匿名 | 401 | PASS |
| W09 | 旅行者 | 415 | FAIL |
| W10 | 匿名 | 401 | PASS |
| W10 | 旅行者 | 415 | FAIL |
| W11 | 匿名 | 401 | PASS |
| W11 | 旅行者 | 400 | FAIL |
| W12 | 匿名 | 401 | PASS |
| W12 | 旅行者 | 403 | PASS |
| W13 | 匿名 | 401 | PASS |
| W13 | 旅行者 | 400 | FAIL |
| W14 | 匿名 | 401 | PASS |
| W14 | 旅行者 | 400 | FAIL |
| W15 | 匿名 | 401 | PASS |
| W15 | 旅行者 | 400 | FAIL |
| W16 | 匿名 | 401 | PASS |
| W16 | 旅行者 | 400 | FAIL |
| W17 | 匿名 | 401 | PASS |
| W17 | 旅行者 | 400 | FAIL |
| W18 | 匿名 | 401 | PASS |
| W18 | 旅行者 | 404 | FAIL |
| W19 | 匿名 | 401 | PASS |
| W19 | 旅行者 | 400 | FAIL |
| W20 | 匿名 | 401 | PASS |
| W20 | 旅行者 | 400 | FAIL |
| W21 | 匿名 | 401 | PASS |
| W21 | 旅行者 | 400 | FAIL |
| W22 | 匿名 | 401 | PASS |
| W22 | 旅行者 | 400 | FAIL |
| W23 | 匿名 | 401 | PASS |
| W23 | 旅行者 | 400 | FAIL |
| W24 | 匿名 | 401 | PASS |
| W24 | 旅行者 | 403 | PASS |
| W25 | 匿名 | 401 | PASS |
| W25 | 旅行者 | 403 | PASS |
| W26 | 匿名 | 401 | PASS |
| W26 | 旅行者 | 403 | PASS |
| W27 | 匿名 | 401 | PASS |
| W27 | 旅行者 | 403 | PASS |
| W28 | 匿名 | 401 | PASS |
| W28 | 旅行者 | 403 | PASS |
| E01 | 匿名 | 401 | PASS |
| E01 | 旅行者 | 403 | PASS |
| E02 | 匿名 | 401 | PASS |
| E02 | 旅行者 | 403 | PASS |
| E03 | 匿名 | 401 | PASS |
| E03 | 旅行者 | 403 | PASS |
| SESSION | logout后admin | 400 | FAIL |

---

## 4 · 问题清单（P0/P1/P2）

### P0（0）

_无记录。_

### P1（7）

| ID | 类别 | 动作 | 路由 | 标题 | 观察 |
|----|------|------|------|------|------|
| AMWA-1-012 | 异常流程 | W24 | `/api/v1/admin/trust-growth/control` | 探针占位写成功 200 | {"ok":true,"control":{"weights_frozen":false,"force_control_only":false,"variant |
| AMWA-1-013 | 异常流程 | W25 | `/api/v1/admin/trust-growth/rollback-control` | 探针占位写成功 200 | {"ok":true,"control":{"weights_frozen":false,"force_control_only":true,"variant_ |
| AMWA-1-014 | 异常流程 | W26 | `/api/v1/admin/security/2fa-policy` | 探针占位写成功 200 | {"status":"ok","policy":{"enforced":false,"implementation_note":"phase_01_prep_n |
| AMWA-1-015 | 异常流程 | W27 | `/api/v1/admin/security/totp/enroll` | 探针占位写成功 200 | {"status":"ok","secret_base32":"FATY5KSEIBR72553QL73GY3MNJ6DYPB4","otpauth_uri": |
| AMWA-1-016 | 异常流程 | E01 | `/api/v1/admin/finance/summary/export` | 探针占位写成功 200 | export,kind,finance_summary_v2
meta,generated_at,2026-06-07T05:56:04.566152700+0 |
| AMWA-1-017 | 异常流程 | E02 | `/api/v1/admin/indexer/reconcile-reports/export` | 探针占位写成功 200 | id,report_type,chain_id,created_at,issues_total,projection_reconcile_clean,order |
| AMWA-1-018 | 异常流程 | E03 | `/api/v1/admin/region-vault/forwarded-events/expo` | 探针占位写成功 200 | chain_id,block_number,log_index,block_hash,tx_hash,vault_address,token_address,t |

### P2（11）

| ID | 类别 | 动作 | 路由 | 标题 | 观察 |
|----|------|------|------|------|------|
| AMWA-2-001 | 路由漂移 | W18 | `/api/v1/admin/community/reports/:id` | ROUTE_DENY_MATRIX 有 reports PATCH 但 router 未挂载 | UI 使用 community/moderation PATCH |
| AMWA-2-002 | RBAC边界 | W02 | `/api/v1/admin/users/00000000-0000-4000-8000-0000` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-003 | RBAC边界 | W03 | `/api/v1/admin/users/00000000-0000-4000-8000-0000` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-004 | RBAC边界 | W04 | `/api/v1/admin/users/00000000-0000-4000-8000-0000` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-005 | RBAC边界 | W05 | `/api/v1/admin/guides/00000000-0000-4000-8000-000` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-006 | RBAC边界 | W06 | `/api/v1/admin/users/00000000-0000-4000-8000-0000` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-007 | RBAC边界 | W07 | `/api/v1/admin/users/00000000-0000-4000-8000-0000` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-008 | RBAC边界 | W08 | `/api/v1/admin/onboarding/entitlements/00000000-0` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-009 | RBAC边界 | W09 | `/api/v1/admin/onboarding/entitlements/00000000-0` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-010 | RBAC边界 | W10 | `/api/v1/admin/onboarding/entitlements/00000000-0` | 旅行者非预期 HTTP 415 | Expected request with `Content-Type: application/json` |
| AMWA-2-011 | 路由漂移 | W18 | `/api/v1/admin/community/reports/00000000-0000-00` | reports PATCH 404（未挂载） |  |

---

## 5 · 问题清单（按类别）

### RBAC边界（9）

- **AMWA-2-002** (P2) · W02 — 旅行者非预期 HTTP 415
- **AMWA-2-003** (P2) · W03 — 旅行者非预期 HTTP 415
- **AMWA-2-004** (P2) · W04 — 旅行者非预期 HTTP 415
- **AMWA-2-005** (P2) · W05 — 旅行者非预期 HTTP 415
- **AMWA-2-006** (P2) · W06 — 旅行者非预期 HTTP 415
- **AMWA-2-007** (P2) · W07 — 旅行者非预期 HTTP 415
- **AMWA-2-008** (P2) · W08 — 旅行者非预期 HTTP 415
- **AMWA-2-009** (P2) · W09 — 旅行者非预期 HTTP 415
- **AMWA-2-010** (P2) · W10 — 旅行者非预期 HTTP 415

### 路由漂移（2）

- **AMWA-2-001** (P2) · W18 — ROUTE_DENY_MATRIX 有 reports PATCH 但 router 未挂载
- **AMWA-2-011** (P2) · W18 — reports PATCH 404（未挂载）

### 异常流程（7）

- **AMWA-1-012** (P1) · W24 — 探针占位写成功 200
- **AMWA-1-013** (P1) · W25 — 探针占位写成功 200
- **AMWA-1-014** (P1) · W26 — 探针占位写成功 200
- **AMWA-1-015** (P1) · W27 — 探针占位写成功 200
- **AMWA-1-016** (P1) · E01 — 探针占位写成功 200
- **AMWA-1-017** (P1) · E02 — 探针占位写成功 200
- **AMWA-1-018** (P1) · E03 — 探针占位写成功 200

---

## 6 · 手操缺口

| ID | 级 | 域 | 说明 |
|----|-----|-----|------|
| AMWA-GAP-M01 | P2 | 批量操作 | 列表页多选批量未逐 API 手操 · 单条写探针 PASS |
| AMWA-GAP-M02 | P2 | DB 对拍 | 写成功 200 后 PG 行级对拍未做 · 须 staging 有种子数据 |
| AMWA-GAP-M03 | P2 | 六角色写 | ADM-U01 写探针仅 super_admin+旅行者 · CS/Risk/Finance 写矩阵 OPEN |
| AMWA-GAP-M04 | P2 | 异常回滚 | DB 失败回滚须 fault-injection · 文案已登记 locales |
| AMWA-GAP-M05 | P2 | 浏览器 L5 | 弹窗 UI 未 Playwright 逐按钮手操 · 静态 contract 已绿 |

---

## 7 · 复跑

```bash
bash scripts/dev/run-admin-mutating-actions-audit.sh
```

*Generated 2026-06-07 · AMWA v1*
