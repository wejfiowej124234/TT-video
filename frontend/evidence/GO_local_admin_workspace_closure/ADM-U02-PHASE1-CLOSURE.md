# ADM-U02 · Phase ① 本地收口（2026-06-03）

**阶段口径：** 仅 **① 本地**；**非** Phase ② Staging GO · **非** ③ Production GO。

## 验收命令（须 exit 0）

```bash
# 重启 API 后
export DATABASE_URL=postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
bash scripts/dev/smoke-admin-adm-u02-local.sh

cd frontend
export PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080
export DATABASE_URL=postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
npx playwright test e2e/admin-adm-u02-permissions-local.spec.ts --project=chromium
```

## phase2_prep 真值（`GET /api/v1/admin/capabilities`）

| 键 | 期望 |
|----|------|
| `adm_u02_local_ready` | `true` |
| `console_role_approval_wired` | `true` |
| `audit_logs_persist` | `true` |

## 本轮机读结果

| 项 | 结果 |
|----|------|
| `smoke-admin-adm-u02-local.sh` | **exit 0** · `TT_ADM_U02_LOCAL: PASS` |
| `admin-adm-u02-permissions-local.spec.ts` | **exit 0** |
| API 构建 | `cargo build -p traveltrust-api` 后重启 :8080 |

## ② 留闸

- 持久 Fly/Staging：`ADM_U01_REQUIRE_PERSISTENT_HOST=1` + `record-adm-u01-staging-evidence.sh`
- ADM-U02 ② 复验：在 Staging 主机上重跑上述 smoke/Playwright（**不**与 ① 混称 GO）

Runbook: [`docs/runbook/ADM-U02-admin-permissions-2fa-approval.md`](../../../docs/runbook/ADM-U02-admin-permissions-2fa-approval.md)
