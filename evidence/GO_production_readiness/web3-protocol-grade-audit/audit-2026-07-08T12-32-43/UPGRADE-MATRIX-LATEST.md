# Upgrade Matrix

**Recorded:** 2026-07-08T12:33:17.623Z

## TimelockUpgradeableProxy shells

- **Path:** Proposal → Vote → Queue → TimelockDelay → Execute → upgradeTo → VerifyBytecode → EvidenceG24
- **Rollback:** previous impl only via new governance proposal
- **Verify:** G1 bytecode manifest, storage layout test
- **Evidence:** registry/g24-p-upgrade-01-contract-posture.v1.yaml

## TravelTrustGovernor

- **Path:** non_upgradeable — redeploy requires migration proposal
- **Rollback:** none in-place
- **Verify:** bytecode hash G1
- **Evidence:** undefined

## GovernanceTimelock

- **Path:** non_upgradeable delay constant
- **Rollback:** none
- **Verify:** G3 delay >= 86400s
- **Evidence:** undefined

## Escrow instances

- **Path:** immutable — new orders via EscrowFactory only
- **Rollback:** N/A
- **Verify:** factory routing config
- **Evidence:** undefined

## FeeRouter

- **Path:** setRoutingConfig via Timelock if owner=Timelock
- **Rollback:** prior config via governance
- **Verify:** event RoutingConfigSet
- **Evidence:** undefined

