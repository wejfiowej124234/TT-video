# Rollback verification · S03 createEscrow

**Phase:** ② testnet · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

- **Probe:** `escrowOf(orderId)` non-zero on Sepolia.\n- **Rollback:** on-chain Created escrow unused; order cancel in API if pre-deposit.
