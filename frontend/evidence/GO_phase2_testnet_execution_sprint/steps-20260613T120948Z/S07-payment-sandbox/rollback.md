# Rollback verification · S07 payment sandbox

**Phase:** ② testnet · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

- **Mode:** chain_off `mock-pay` on Sepolia-configured staging (**② 沙箱** · **非** ③ Production PSP).\n- **Probe:** duplicate mock-pay → 409 invalid_state.\n- **Rollback:** cancel/dispute per escrow state (ops runbook).
