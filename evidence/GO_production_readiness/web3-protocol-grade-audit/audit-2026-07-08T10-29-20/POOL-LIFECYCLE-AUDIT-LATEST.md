# Pool Lifecycle Audit

**Recorded:** 2026-07-08T10:30:07.988Z

| Pool | Contract | Funds In | Funds Out | Can Move | Cannot Move | Pause |
|------|----------|----------|-----------|----------|-------------|-------|
| POOL-TREASURY | GovernanceTreasuryP4Cap | governance_allocation · primary_market proceeds TARGET | spendP4Reserve · governance grants | Timelock executor via spender role | Admin API · Backend hot wallet · Owner EOA direct | via governance only |
| POOL-FEEROUTER | FeeRouter | Escrow platformFeeRecipient leg | distribute 45/55 split | owner distribute | traveler · guide · steward | distributePaused |
| POOL-REGION-VAULT | RegionVault | FeeRouter country bucket D-4555-A | governance directed allocations TARGET | Timelock governed | steward direct | none immutable params |
| POOL-NET-PROFIT-LEDGER | CountryPoolNetProfitLedger | finance accrual fundEpoch | executeSplit steward/global/unallocated | Timelock owner | Admin · Backend | operational hold via governance |
| POOL-ESCROW-INSTANCE | Escrow | traveler deposit | release · refund · dispute resolution | see FL-01 FL-02 — release caller UNVERIFIED | governor | none |
| POOL-STEWARD-STAKE | RegionStewardStakePool | stake TTG | claimReleased · slash TARGET | steward stake/unstake paths | treasury pull | parameter via Timelock |
