# Rollback verification · S01 register

**Phase:** ② testnet · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

- **Probe:** `GET /api/v1/me` without Bearer → 401 login_required (verified post-step).\n- **Rollback:** no PG user delete in sprint; staging cohort emails isolated (@traveltrust.testnet).
