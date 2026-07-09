# Responsibility Matrix

**Recorded:** 2026-07-08T12:04:36.766Z

| Module | Product | Security | Contract | Backend | Finance | Ops |
|--------|---------|----------|----------|---------|---------|-----|
| M10 Escrow | Order lifecycle · traveler/gui | Escrow.t.sol · R-01 findings | Escrow.sol · EscrowFactory.sol | order state machine · relayer  | fee bps · platformFeeRecipient | dispute escalation · indexer r |
| M09 FeeRouter | fee disclosure | routing hijack · pause drill | FeeRouter.sol | none direct | D-4555-A allocation | Timelock execute distribute |
| M08 Treasury | governance budget narrative | spender cap · Cert | GovernanceTreasuryP4Cap.sol | none direct | P4 reserve accounting | GORP · Cert |
| M06 Governance | proposal UX | ASM-GOV-* · Cert lifecycle | TravelTrustGovernor.sol | governance API read models | treasury linkage | Timelock queue/execute runbook |
| M11 Settlement | steward profit UX | split integrity | CountryPoolNetProfitLedger.sol | epoch accrual jobs | D-4555-B SSOT | epoch close checklist |
| M12 Staking | steward program | stake/unstake delays | RegionStewardStakePool.sol | application FSM | TTG not USDC | Cert |
| M15 RBAC | admin console | D3 closure · P0 bypass isolati | none | admin_rbac.rs | read-only finance panels | ADM-U01/U02 |
