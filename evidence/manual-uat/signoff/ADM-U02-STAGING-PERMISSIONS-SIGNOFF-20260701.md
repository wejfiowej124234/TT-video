# ADM-U02 · Staging 权限审批 / 2FA · Sign-off

**UTC:** 2026-07-01  
**Phase:** ② · persistent_staging  
**release_gate:** GO

## 证据

| 工件 | 路径 |
|------|------|
| latest | `evidence/GO_staging_admin_adm_u02/latest/` |
| run_id | `run_20260701T100804Z` |
| API smoke | `smoke-run.log` — `TT_ADM_U02_STAGING: PASS` |
| Playwright | `playwright-run.log` — 2 passed · 1 skipped |
| 合并报告 | `report.json` — `release_gate: GO` |

## 环境

- `STAGING_API_BASE=https://tt-api-staging.fly.dev`
- `STAGING_FE_BASE=https://tt-web-staging.fly.dev`
- `ADM_U02_STRICT=1` · `ADM_U02_REQUIRE_PERSISTENT_HOST=1`

## 纪律

- ① `smoke-admin-adm-u02-local.sh` **≠** 本 Sign-off
- ADM-U01 ② GO 为同序前置（`run_20260701T092450Z`）

## 复跑

```bash
ADM_U02_STRICT=1 ADM_U02_REQUIRE_PERSISTENT_HOST=1 \
  STAGING_FE_BASE=https://tt-web-staging.fly.dev \
  bash scripts/dev/record-adm-u02-staging-evidence.sh
```

**TT_ADM_U02_SIGNOFF: GO**
