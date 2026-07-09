# Phase ③ · Mainnet Preparation Entry Checklist

**Prepared UTC:** `2026-07-01T00:34:37Z`  
**Gate:** Staging business resample PASS @ `staging-business-resample-20260701T003201Z`  
**Prerequisite:** `TT_TESTNET_SIGNOFF: CLOSED` · `TT_TESTNET_GRADUATION: CLOSED`

## Entry keys

```text
PHASE3_MAINNET_PREPARATION: ACTIVE
PHASE3_PRODUCTION_GO: PAUSED
TT_STAGING_BUSINESS_RESAMPLE: PASS
```

**诚实边界：** ③ Preparation **≠** Production GO · 须独立 GO gate。

## P0 优先序（来自 PHASE3-PRODUCTION-PREPARATION.md）

| # | 轨道 | ID | 命令 / 入口 | 状态 |
|---|------|-----|-------------|------|
| P0-1 | Merchant 闭环 | RP-002/005 | `bash scripts/dev/smoke-provider-onboarding-staging.sh` | ⏳ Owner |
| P0-2 | DB 恢复演练 | B-475 | `bash scripts/dev/run-phase3-db-restore-drill-staging.sh` | ⏳ Owner |
| P0-3 | Fly 回滚演练 | — | `bash scripts/dev/run-phase3-fly-release-rollback-drill.sh` | ⏳ Owner |
| P0-4 | Production GO 审计 | PI-3 | `bash scripts/dev/run-phase3-production-go-audit.sh` | ⏳ Owner |

## 显式排除（纪律）

- 不重开 ① 本地 GATE / Manual UAT Sprint
- 不重开 Configuration / PER / Alignment 审计章节
- 不修改已通过 ②  Sign-off 项
- 不将 Staging resample PASS 推导为 Production GO

## SSOT

- [PHASE3-PRODUCTION-PREPARATION.md](../../docs/runbook/PHASE3-PRODUCTION-PREPARATION.md)
- [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md](../../docs/runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md)
- Dashboard: [PHASE3-READINESS.md](../dashboard/PHASE3-READINESS.md)
