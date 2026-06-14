# Rollback verification · S08 chain testnet

**Phase:** ② testnet · **SSOT:** [COMMUNITY-STAGING-OPS-RUNBOOK §13](../../../docs/runbook/COMMUNITY-STAGING-OPS-RUNBOOK.md)

- **Probe:** `GET /meta` chain_id=11155111 · contracts deployed on staging.\n- **On-chain tx:** full createEscrow+deposit is **B-407 / WEB3-P2-003** track; this step verifies **readiness + chain-sync HTTP** on ②.\n- **Rollback:** pause indexer / revert Fly env per TT-9629 runbook.
