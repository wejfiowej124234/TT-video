# Admin Security Closure Report

**记录时间：** 2026-06-07T06:22:17.198643+00:00  
**单点收口：** Finance GET /admin/users → require admin.users.read  

> **Admin 审计范围已冻结（2026-06-07）** · Shell DOM 探针余噪已登记（菜单折叠组 P0 不在 Finance 单点收口范围）  
> **五域审计已冻结** · [FINAL-SYSTEM-AUDIT-REPORT](FINAL-SYSTEM-AUDIT-REPORT.md)（**PASS**）· CDIA-2-001 Trust Gate 已收口 · Shell DOM 余噪仍登记

---

## Executive verdict

**ADMIN_SECURITY_CLOSURE: CONDITIONAL**

| 闸 | 裁决 | 证据 |
|----|------|------|
| ADM-U01 API Matrix | **PASS** | `evidence\admin-security-closure\20260607T055510Z\adm-u01-api\matrix-api-results.json` |
| ADM-U01 Shell Browser | **NO-GO** | `evidence\admin-security-closure\20260607T055510Z\shell-browser\adm-u01-shell-browser-findings.json` |
| AMWA Mutating Actions | **CONDITIONAL** | `evidence\admin-security-closure\20260607T055510Z\amwa\amwa-findings.json` |

---

## Finance `/admin/users` 漂移收口

| 层 | SSOT | 收口后 |
|----|------|--------|
| registry `ops.users_list` | Finance → **403** | 与 `admin.users.read` 对拍 |
| `FINANCE_PERMS` | 无 `admin.users.read` | 不变 |
| API `GET /api/v1/admin/users` | `require_users_read_uid` | 与 ROUTE_DENY_MATRIX 一致 |
| UI 菜单/路由/横幅 | `ADMIN_PERM.USERS_READ` | 不变（正确拒绝） |

**API 探针 Finance `ops.users_list`：** HTTP **403** (PASS)

**Shell Visibility Finance `/admin/users`：** UI有权=False API允许=False (PASS)

**单点收口裁决：** Finance `/admin/users` 漂移 **已关闭**（registry · API · UI 一致拒绝）。

> Shell Browser 整体 NO-GO 含菜单 DOM 探针 P0（折叠组内链仍挂载），**不在本次 Finance 单点收口范围**。

---

## 摘要计数

- API matrix: 102/102 PASS
- Shell browser: P0=10 P1=3
- AMWA: P0=0 P1=7 (CONDITIONAL)

---

## 复跑

```bash
bash scripts/dev/run-admin-security-closure-audit.sh
```

*Generated 2026-06-07*
