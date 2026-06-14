# Rollback verification · S01-register

**Phase:** ② staging UI · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

- **Probe:** anonymous `GET /api/v1/me` → 401 (post-step via evidence script).\n- **Rollback:** cohort @traveltrust.testnet isolated; no PG delete in sprint.
