# ADM-U01 Shell Browser Audit 报告

**记录时间：** 2026-06-07T06:21:39.589Z  
**FE：** `http://127.0.0.1:3012`  
**API 矩阵：** `d:/TravelTrust-V1.1/evidence/admin-security-closure/20260607T055510Z/shell-browser/matrix-api-results.json`  
**证据：** `D:/TravelTrust-V1.1/evidence/admin-security-closure/20260607T055510Z/shell-browser/adm-u01-shell-browser-findings.json`  

> 六角色 Shell / Menu / Route / Visibility × API 权限对拍 · ② staging

---

## Executive verdict

| 项 | 结果 |
|----|------|
| **ADM-U01 Shell Browser** | **NO-GO** |
| **P0** | **10** |
| **P1** | **3** |
| **P2** | **0** |

```text
ADM_U01_SHELL_BROWSER: NO-GO
```

---

## 1 · Shell Matrix（侧栏分组可见性）

| 角色 | 分组 | 期望 | 实际 | 裁决 |
|------|------|------|------|------|
| Super Admin | onboarding | True | True | PASS |
| Super Admin | operations | True | True | PASS |
| Super Admin | community | True | True | PASS |
| Super Admin | finance | True | True | PASS |
| Super Admin | governance | True | True | PASS |
| Super Admin | more | True | True | PASS |
| Admin | onboarding | True | True | PASS |
| Admin | operations | True | True | PASS |
| Admin | community | True | True | PASS |
| Admin | finance | True | True | PASS |
| Admin | governance | True | True | PASS |
| Admin | more | True | True | PASS |
| CS | onboarding | True | True | PASS |
| CS | operations | True | True | PASS |
| CS | community | True | True | PASS |
| CS | finance | False | False | PASS |
| CS | governance | True | True | PASS |
| CS | more | True | True | PASS |
| Risk | onboarding | True | True | PASS |
| Risk | operations | True | True | PASS |
| Risk | community | True | True | PASS |
| Risk | finance | False | False | PASS |
| Risk | governance | True | True | PASS |
| Risk | more | True | True | PASS |
| Finance | onboarding | True | True | PASS |
| Finance | operations | True | True | PASS |
| Finance | community | False | False | PASS |
| Finance | finance | True | True | PASS |
| Finance | governance | True | True | PASS |
| Finance | more | True | True | PASS |
| Compliance | onboarding | True | True | PASS |
| Compliance | operations | True | True | PASS |
| Compliance | community | True | True | PASS |
| Compliance | finance | True | True | PASS |
| Compliance | governance | True | True | PASS |
| Compliance | more | True | True | PASS |

---

## 2 · Menu Matrix（菜单链可见性）

| 角色 | 路径 | 权限 | 期望 | 实际 | 裁决 |
|------|------|------|------|------|------|
| Super Admin | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Super Admin | `/admin/community/penalties` | `admin.community.moderate` | True | True | PASS |
| Super Admin | `/admin/trust-growth` | `admin.trust_growth.write` | True | True | PASS |
| Super Admin | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| Super Admin | `/admin/disputes` | `admin.orders.read` | True | True | PASS |
| Admin | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Admin | `/admin/community/penalties` | `admin.community.moderate` | True | True | PASS |
| Admin | `/admin/trust-growth` | `admin.trust_growth.write` | True | True | PASS |
| Admin | `/admin/flags` | `admin.platform.read` | True | False | FAIL |
| Admin | `/admin/disputes` | `admin.orders.read` | True | True | PASS |
| CS | `/admin/finance` | `admin.finance.read` | False | True | FAIL |
| CS | `/admin/community/penalties` | `admin.community.moderate` | False | True | FAIL |
| CS | `/admin/trust-growth` | `admin.trust_growth.write` | False | True | FAIL |
| CS | `/admin/flags` | `admin.platform.read` | False | True | FAIL |
| CS | `/admin/disputes` | `admin.orders.read` | True | True | PASS |
| Risk | `/admin/finance` | `admin.finance.read` | False | True | FAIL |
| Risk | `/admin/community/penalties` | `admin.community.moderate` | True | True | PASS |
| Risk | `/admin/trust-growth` | `admin.trust_growth.write` | True | True | PASS |
| Risk | `/admin/flags` | `admin.platform.read` | False | True | FAIL |
| Risk | `/admin/disputes` | `admin.orders.read` | True | True | PASS |
| Finance | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Finance | `/admin/community/penalties` | `admin.community.moderate` | False | True | FAIL |
| Finance | `/admin/trust-growth` | `admin.trust_growth.write` | False | True | FAIL |
| Finance | `/admin/flags` | `admin.platform.read` | True | False | FAIL |
| Finance | `/admin/disputes` | `admin.orders.read` | True | True | PASS |
| Compliance | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Compliance | `/admin/community/penalties` | `admin.community.moderate` | False | True | FAIL |
| Compliance | `/admin/trust-growth` | `admin.trust_growth.write` | False | True | FAIL |
| Compliance | `/admin/flags` | `admin.platform.read` | True | False | FAIL |
| Compliance | `/admin/disputes` | `admin.orders.read` | True | True | PASS |

---

## 3 · Route Matrix（页面入口 / 路由守卫）

| 角色 | 路由 | API 探针 | UI 可达 | 登录重定向 | 权限横幅 | main | 裁决 |
|------|------|----------|---------|------------|----------|------|------|
| Super Admin | `/admin/finance` | finance.summary | PASS | False | False | True | PASS |
| Super Admin | `/admin/community/reports` | community.reports_list | PASS | False | False | True | PASS |
| Super Admin | `/admin/trust-growth` | capabilities | PASS | False | False | True | PASS |
| Super Admin | `/admin/flags` | config.flags_list | PASS | False | False | True | PASS |
| Super Admin | `/admin/approvals` | capabilities | PASS | False | False | True | PASS |
| Super Admin | `/admin/users` | ops.users_list | PASS | False | False | True | PASS |
| Admin | `/admin/finance` | finance.summary | PASS | False | False | True | PASS |
| Admin | `/admin/community/reports` | community.reports_list | PASS | False | False | True | PASS |
| Admin | `/admin/trust-growth` | capabilities | PASS | False | False | True | PASS |
| Admin | `/admin/flags` | config.flags_list | PASS | False | False | True | PASS |
| Admin | `/admin/approvals` | capabilities | PASS | False | True | True | PASS |
| Admin | `/admin/users` | ops.users_list | PASS | False | False | True | PASS |
| CS | `/admin/finance` | finance.summary | PASS | False | True | True | PASS |
| CS | `/admin/community/reports` | community.reports_list | PASS | False | False | True | PASS |
| CS | `/admin/trust-growth` | capabilities | PASS | False | True | True | PASS |
| CS | `/admin/flags` | config.flags_list | PASS | False | False | True | PASS |
| CS | `/admin/approvals` | capabilities | PASS | False | True | True | PASS |
| CS | `/admin/users` | ops.users_list | PASS | False | False | True | PASS |
| Risk | `/admin/finance` | finance.summary | PASS | False | True | True | PASS |
| Risk | `/admin/community/reports` | community.reports_list | PASS | False | False | True | PASS |
| Risk | `/admin/trust-growth` | capabilities | PASS | False | False | True | PASS |
| Risk | `/admin/flags` | config.flags_list | PASS | False | False | True | PASS |
| Risk | `/admin/approvals` | capabilities | PASS | False | True | True | PASS |
| Risk | `/admin/users` | ops.users_list | PASS | False | False | True | PASS |
| Finance | `/admin/finance` | finance.summary | PASS | False | False | True | PASS |
| Finance | `/admin/community/reports` | community.reports_list | PASS | False | True | True | PASS |
| Finance | `/admin/trust-growth` | capabilities | PASS | False | True | True | PASS |
| Finance | `/admin/flags` | config.flags_list | PASS | False | False | True | PASS |
| Finance | `/admin/approvals` | capabilities | PASS | False | True | True | PASS |
| Finance | `/admin/users` | ops.users_list | PASS | False | True | True | PASS |
| Compliance | `/admin/finance` | finance.summary | PASS | False | False | True | PASS |
| Compliance | `/admin/community/reports` | community.reports_list | PASS | False | False | True | PASS |
| Compliance | `/admin/trust-growth` | capabilities | PASS | False | True | True | PASS |
| Compliance | `/admin/flags` | config.flags_list | PASS | False | False | True | PASS |
| Compliance | `/admin/approvals` | capabilities | PASS | False | True | True | PASS |
| Compliance | `/admin/users` | ops.users_list | PASS | False | False | True | PASS |

---

## 4 · Visibility Matrix（UI 权限 × API 权限）

| 角色 | 路由 | 权限 | UI 有权 | API 允许 | 裁决 |
|------|------|------|---------|----------|------|
| Super Admin | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Super Admin | `/admin/community/reports` | `admin.community.read` | True | True | PASS |
| Super Admin | `/admin/trust-growth` | `admin.trust_growth.write` | True | True | PASS |
| Super Admin | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| Super Admin | `/admin/approvals` | `admin.approve` | True | True | PASS |
| Super Admin | `/admin/users` | `admin.users.read` | True | True | PASS |
| Admin | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Admin | `/admin/community/reports` | `admin.community.read` | True | True | PASS |
| Admin | `/admin/trust-growth` | `admin.trust_growth.write` | True | True | PASS |
| Admin | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| Admin | `/admin/approvals` | `admin.approve` | False | False | PASS |
| Admin | `/admin/users` | `admin.users.read` | True | True | PASS |
| CS | `/admin/finance` | `admin.finance.read` | False | False | PASS |
| CS | `/admin/community/reports` | `admin.community.read` | True | True | PASS |
| CS | `/admin/trust-growth` | `admin.trust_growth.write` | False | False | PASS |
| CS | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| CS | `/admin/approvals` | `admin.approve` | False | False | PASS |
| CS | `/admin/users` | `admin.users.read` | True | True | PASS |
| Risk | `/admin/finance` | `admin.finance.read` | False | False | PASS |
| Risk | `/admin/community/reports` | `admin.community.read` | True | True | PASS |
| Risk | `/admin/trust-growth` | `admin.trust_growth.write` | True | True | PASS |
| Risk | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| Risk | `/admin/approvals` | `admin.approve` | False | False | PASS |
| Risk | `/admin/users` | `admin.users.read` | True | True | PASS |
| Finance | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Finance | `/admin/community/reports` | `admin.community.read` | False | False | PASS |
| Finance | `/admin/trust-growth` | `admin.trust_growth.write` | False | False | PASS |
| Finance | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| Finance | `/admin/approvals` | `admin.approve` | False | False | PASS |
| Finance | `/admin/users` | `admin.users.read` | False | False | PASS |
| Compliance | `/admin/finance` | `admin.finance.read` | True | True | PASS |
| Compliance | `/admin/community/reports` | `admin.community.read` | True | True | PASS |
| Compliance | `/admin/trust-growth` | `admin.trust_growth.write` | False | False | PASS |
| Compliance | `/admin/flags` | `admin.platform.read` | True | True | PASS |
| Compliance | `/admin/approvals` | `admin.approve` | False | False | PASS |
| Compliance | `/admin/users` | `admin.users.read` | True | True | PASS |

---

## 5 · P0 / P1 / P2 问题清单

### P0（10）

| ID | 类别 | 角色 | 目标 | 标题 | 观察 |
|----|------|------|------|------|------|
| ADM-SHELL-0-002 | 横向越权 | CS | `/admin/finance` | CS 菜单链 /admin/finance 不一致 | expected=false actual=true perm=admin.finance.read |
| ADM-SHELL-0-003 | 横向越权 | CS | `/admin/community/penalties` | CS 菜单链 /admin/community/penalties 不一致 | expected=false actual=true perm=admin.community.moderate |
| ADM-SHELL-0-004 | 横向越权 | CS | `/admin/trust-growth` | CS 菜单链 /admin/trust-growth 不一致 | expected=false actual=true perm=admin.trust_growth.write |
| ADM-SHELL-0-005 | 横向越权 | CS | `/admin/flags` | CS 菜单链 /admin/flags 不一致 | expected=false actual=true perm=admin.platform.read |
| ADM-SHELL-0-006 | 横向越权 | Risk | `/admin/finance` | Risk 菜单链 /admin/finance 不一致 | expected=false actual=true perm=admin.finance.read |
| ADM-SHELL-0-007 | 横向越权 | Risk | `/admin/flags` | Risk 菜单链 /admin/flags 不一致 | expected=false actual=true perm=admin.platform.read |
| ADM-SHELL-0-008 | 横向越权 | Finance | `/admin/community/penalties` | Finance 菜单链 /admin/community/penalties 不一致 | expected=false actual=true perm=admin.community.moderate |
| ADM-SHELL-0-009 | 横向越权 | Finance | `/admin/trust-growth` | Finance 菜单链 /admin/trust-growth 不一致 | expected=false actual=true perm=admin.trust_growth.write |
| ADM-SHELL-0-011 | 横向越权 | Compliance | `/admin/community/penalties` | Compliance 菜单链 /admin/community/penalties 不一致 | expected=false actual=true perm=admin.community.moderate |
| ADM-SHELL-0-012 | 横向越权 | Compliance | `/admin/trust-growth` | Compliance 菜单链 /admin/trust-growth 不一致 | expected=false actual=true perm=admin.trust_growth.write |

### P1（3）

| ID | 类别 | 角色 | 目标 | 标题 | 观察 |
|----|------|------|------|------|------|
| ADM-SHELL-1-001 | 菜单可见性 | Admin | `/admin/flags` | Admin 菜单链 /admin/flags 不一致 | expected=true actual=false perm=admin.platform.read |
| ADM-SHELL-1-010 | 菜单可见性 | Finance | `/admin/flags` | Finance 菜单链 /admin/flags 不一致 | expected=true actual=false perm=admin.platform.read |
| ADM-SHELL-1-013 | 菜单可见性 | Compliance | `/admin/flags` | Compliance 菜单链 /admin/flags 不一致 | expected=true actual=false perm=admin.platform.read |

### P2（0）

_无记录。_

---

## 6 · 按类别

### 横向越权
- **ADM-SHELL-0-002** (P0) · CS 菜单链 /admin/finance 不一致
- **ADM-SHELL-0-003** (P0) · CS 菜单链 /admin/community/penalties 不一致
- **ADM-SHELL-0-004** (P0) · CS 菜单链 /admin/trust-growth 不一致
- **ADM-SHELL-0-005** (P0) · CS 菜单链 /admin/flags 不一致
- **ADM-SHELL-0-006** (P0) · Risk 菜单链 /admin/finance 不一致
- **ADM-SHELL-0-007** (P0) · Risk 菜单链 /admin/flags 不一致
- **ADM-SHELL-0-008** (P0) · Finance 菜单链 /admin/community/penalties 不一致
- **ADM-SHELL-0-009** (P0) · Finance 菜单链 /admin/trust-growth 不一致
- **ADM-SHELL-0-011** (P0) · Compliance 菜单链 /admin/community/penalties 不一致
- **ADM-SHELL-0-012** (P0) · Compliance 菜单链 /admin/trust-growth 不一致

### 菜单可见性
- **ADM-SHELL-1-001** (P1) · Admin 菜单链 /admin/flags 不一致
- **ADM-SHELL-1-010** (P1) · Finance 菜单链 /admin/flags 不一致
- **ADM-SHELL-1-013** (P1) · Compliance 菜单链 /admin/flags 不一致

---

## 7 · 复跑

```bash
bash scripts/dev/run-adm-u01-shell-browser-audit.sh
```

*Generated 2026-06-07 · ADM-U01 Shell Browser v1*
