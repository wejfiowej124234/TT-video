# ADM-U01 · Staging 六角色 RBAC · Sign-off

**UTC:** 2026-07-01  
**Phase:** ② · persistent_host  
**release_gate:** GO

## 证据

| 工件 | 路径 |
|------|------|
| latest | `evidence/GO_staging_admin_rbac_matrix/latest/` |
| run_id | `run_20260701T092450Z` |
| API 矩阵 | `matrix-api-results.json` — 102/102 |
| 合并报告 | `report.json` — `release_gate: GO` |

## 环境

- `STAGING_API_BASE=https://tt-api-staging.fly.dev`
- `STAGING_FE_BASE=https://tt-web-staging.fly.dev`
- `ADM_U01_STRICT=1` · `ADM_U01_REQUIRE_PERSISTENT_HOST=1`

## 纪律

- C2 `tourist@test.com` SuperAdmin 捷径 **≠** 本 Sign-off
- ① `smoke-admin-rbac-matrix-local.sh` **≠** 本 Sign-off

## 复跑

```bash
ADM_U01_STRICT=1 ADM_U01_REQUIRE_PERSISTENT_HOST=1 \
  STAGING_FE_BASE=https://tt-web-staging.fly.dev \
  bash scripts/dev/record-adm-u01-staging-evidence.sh
```

**TT_ADM_U01_SIGNOFF: GO**
