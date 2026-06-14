# Rollback verification · S07-payment-sandbox

**Phase:** ② staging UI · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

- **Probe:** order escrowed after mock-pay.\n- **Rollback:** **≠** Stripe refund path; mock-pay staging only.\n- **Gap:** WEB3-P2-003 real USDC `/pay` → **③** or separate track.
