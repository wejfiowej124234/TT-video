# ADM-U01 Full Role Write Matrix Audit 报告

**记录时间：** 2026-06-07T05:05:54.547596+00:00  
**API：** [https://tt-api-staging.fly.dev](https://tt-api-staging.fly.dev)  
**证据：** `evidence\adm-u01-full-write-matrix-audit\adm_u01_write_20260607T045647Z`  
**registry：** `admin-rbac-staging-probes.v1.yaml`  

> **暂停探针硬化 · 暂停 Production GO** · ② staging 六角色 RBAC 深度审计  
> 角色映射：SuperAdmin→Super Admin · Ops→Admin · Auditor→Compliance

---

## Executive verdict

| 项 | 结果 |
|----|------|
| **ADM-U01 Full Write Matrix** | **CONDITIONAL** |
| **P0** | **0** |
| **P1** | **0** |
| **P2** | **1** |
| **API 探针** | **102 PASS / 0 FAIL**（102 cells） |
| **写操作探针** | **36** cells |
| **Shell 可见性（浏览器）** | **SKIP PASS / SKIP FAIL** |
| **Shell 静态对拍** | **PASS**（`admU01StagingShellMatrix.contract.test.ts` ↔ registry） |

```text
ADM_U01_FULL_ROLE_WRITE_MATRIX: CONDITIONAL
```

---

## 1 · 六角色权限矩阵（API 可达性 × deny/pass）

| 探针 | 域 | 方法 | Super Admin | Admin | CS | Risk | Finance | Compliance |
|------|-----|------|-------------|-------|-----|------|---------|------------|
| community.penalties_post | community | POST | 400 | 400 | 400 | 400 | 400 | 400 |
| community.reports_list | community | GET | 200 | 200 | 200 | 200 | 403 | 200 |
| config.flags_list | more | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| config.flags_publish | more | POST | 400 | 400 | 400 | 400 | 400 | 400 |
| config.scheduler_rerun | more | POST | 400 | 400 | 400 | 400 | 400 | 400 |
| core.capabilities | workbench | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| core.route_matrix | workbench | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| finance.fee_router | finance | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| finance.summary | finance | GET | 200 | 200 | 403 | 403 | 200 | 200 |
| governance.approve_post | governance | POST | 400 | 400 | 400 | 400 | 400 | 400 |
| governance.trust_growth_patch | governance | PATCH | 200 | 200 | 403 | 200 | 403 | 403 |
| onboarding.entitlements_list | onboarding | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| onboarding.provider_applications_list | onboarding | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| ops.disputes_list | operations | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| ops.orders_list | operations | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| ops.users_list | operations | GET | 200 | 200 | 200 | 200 | 200 | 200 |
| rbac.console_role_put | more | PUT | 200 | 200 | 403 | 200 | 403 | 403 |

---

## 2 · 写操作矩阵（mutating × 六角色）

| 探针 | 域 | 方法 | 路径 | Super Admin | Admin | CS | Risk | Finance | Compliance | 最小权限结论 |
|------|-----|------|------|-------------|-------|-----|------|---------|------------|--------------|
| community.penalties_post | community | POST | `/api/v1/admin/community/penalties` | 400 | 400 | 400 | 400 | 400 | 400 | PASS |
| config.flags_publish | more | POST | `/api/v1/admin/flags/00000000-0000-0000-0000-0000` | 400 | 400 | 400 | 400 | 400 | 400 | PASS |
| config.scheduler_rerun | more | POST | `/api/v1/admin/scheduler/jobs/smoke_probe_job/rer` | 400 | 400 | 400 | 400 | 400 | 400 | PASS |
| governance.approve_post | governance | POST | `/api/v1/admin/approvals/00000000-0000-0000-0000-` | 400 | 400 | 400 | 400 | 400 | 400 | PASS |
| governance.trust_growth_patch | governance | PATCH | `/api/v1/admin/trust-growth/control` | 200 | 200 | 403 | 200 | 403 | 403 | PASS |
| rbac.console_role_put | more | PUT | `/api/v1/admin/users/5f4ec1b7-5c49-41ab-8b87-5613` | 200 | 200 | 403 | 200 | 403 | 403 | PASS |

---

## 3 · 菜单可见性矩阵（Playwright Shell）

_Playwright Shell 矩阵未跑或跳过（见手操缺口）。_

---

## 4 · P0 / P1 / P2 问题清单

### P0（0）

_无记录。_

### P1（0）

_无记录。_

### P2（1）

| ID | 类别 | 角色 | 探针 | 标题 | 观察 |
|----|------|------|------|------|------|
| ADM-U01-2-001 | 菜单可见性 | ALL | shell.browser | Playwright Shell 矩阵未产出 | staging/local FE 均未加载 data-tt-admin-shell-bar；见 contract test 静态对拍 |

---

## 5 · 手操缺口

| ID | 级 | 说明 |
|----|-----|------|
| ADM-GAP-W01 | P2 | AMWA 31 条写/导出未全部纳入 registry · 本闸覆盖 6 条写探针 |
| ADM-GAP-W02 | P2 | 写后 PG 行级对拍 / 审计日志运行时查询未做 |
| ADM-GAP-W03 | P2 | 幂等 / 防重复 / logout 后会话 — 见 AMWA 专闸 |
| ADM-GAP-W04 | P2 | 争议裁决 / 封禁解封 / 入驻审批细项 — 部分仅 list GET 覆盖 |
| ADM-GAP-S01 | P2 | Playwright 六角色 Shell 浏览器腿失败 — FE 会话注入未加载 admin shell bar |

---

## 6 · 复跑

```bash
bash scripts/dev/run-adm-u01-full-write-matrix-audit.sh
```

*Generated 2026-06-07 · ADM-U01 Full Write Matrix v1*
