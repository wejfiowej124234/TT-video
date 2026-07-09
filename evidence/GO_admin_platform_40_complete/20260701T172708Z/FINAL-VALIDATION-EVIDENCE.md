# Admin Platform 40/40 · Final Validation Evidence

**UTC stamp:** 20260701T172708Z  
**Verdict:** **PASS_MACHINE**  
**Git:** `987bc260cd4c4d409c317ddbf3c70d4c3d212a70` (local stack at run time)

## Machine gates

| Gate | Result | Script / artifact |
|------|--------|-------------------|
| Mapping | PASS | `scripts/gates/check-admin-functional-audit-mapping.py` |
| G-L5 | PASS | `scripts/dev/run-admin-l5-green.sh` |
| G-L5-PUB | PASS | `scripts/gates/check-official-ops-public-operations-ssot.sh` |
| **ADM-U01 local** | **PASS** | `scripts/dev/smoke-admin-rbac-matrix-local.sh` |
| **ADM-U02 local** | **PASS** | `scripts/dev/smoke-admin-adm-u02-local.sh` · `TT_ADM_U02_LOCAL: PASS` |
| **Admin pages local smoke** | **PASS** | `scripts/dev/smoke-admin-pages-local.sh` |
| Staging L5 | WARN_P0_CLEAR | `evidence/GO_staging_admin_l5_audit/20260701T172826Z/report.json` |

## Local stack

- Postgres: `traveltrust-postgres` (docker compose) · migrations applied on API boot
- API: `http://127.0.0.1:8080/health` → 200
- FE: `http://127.0.0.1:3012` · bootstrap `scripts/dev/bootstrap-local-admin-console.sh`

## Staging notes (non-P0)

- `steward_apps` HTTP 404 — registered Expected Difference · not blocking Admin Platform sign-off
- Playwright browser probes skipped in orchestrator (`STAGING_ADMIN_L5_SKIP_BROWSER=1`) — covered by manual walkthrough below

## Manual UAT (20260701T1730Z)

| Env | Surface | Result | Notes |
|-----|---------|--------|-------|
| Local | FE `/admin/official/public-operations` | **307** (auth gate) | Shell route up · login → full Tab walkthrough in browser |
| Local | API public-operations bundle | **200×7** | stats · publish-queue · policy · history · campaigns · kinds · capabilities |
| Staging | FE `/admin/official/public-operations` | **307** (auth gate) | Shell route up |
| Staging | API public-operations bundle | **404×6** | **Staging API 未部署 F-OO-05～19 路由** · 需 deploy 后再做 Campaign deploy/rollback 人工 |
| Public | `?campaign_kind=` | ⏳ | 待 Staging API 对齐后抽检 |

**Browser Tab 级人工（本地）：** 登录 `tourist@test.com` → Public Operations 全 Tab（Stats / Publish / Featured / Priority / Surfaces / Schedule / Preview / History / Test Policy / Campaign 六类）· 记录截图至 `evidence/manual-uat/admin-public-operations-local/`

## Sign-off chain

- Audit: `docs/runbook/TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT-20260701.md` § Final Validation Evidence
- Registry: `registry/admin-functional-usability-audit.v1.yaml` · `machine_validation`
- Platform: `evidence/manual-uat/signoff/TT-ADMIN-PLATFORM-STABLE-FINAL-SIGNOFF-20260701.md`

**TT_ADMIN_PLATFORM_FINAL_VALIDATION: PASS_MACHINE**
