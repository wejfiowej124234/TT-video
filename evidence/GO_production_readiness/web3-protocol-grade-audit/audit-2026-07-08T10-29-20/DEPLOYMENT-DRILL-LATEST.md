# Mainnet Deployment Drill

**Recorded:** 2026-07-08T10:30:07.993Z
**Dry run progress:** 0/12 steps evidenced

| ID | Phase | Action | Evidence | Status |
|----|-------|--------|----------|--------|
| DRILL-F01 | Deploy | GovernanceStack + FundStack broadcast chain_id=1 | undefined | **NOT_RUN** |
| DRILL-F02 | Verify | G1 bytecode manifest all wave1 contracts | undefined | **NOT_RUN** |
| DRILL-F03 | Initialize | Timelock owner on FeeRouter/Treasury/Ledger | undefined | **NOT_RUN** |
| DRILL-F04 | Registry | protocol-convergence-deployments mainnet block | undefined | **NOT_RUN** |
| DRILL-F05 | RPC | prod/staging RPC + chain_id=1 health | undefined | **NOT_RUN** |
| DRILL-F06 | Indexer | G2 full-path replay deposit→release→fee | undefined | **NOT_RUN** |
| DRILL-F07 | Wallet | USDC mainnet + WalletConnect smoke | undefined | **NOT_RUN** |
| DRILL-F08 | Governance | propose→queue→timelock→execute noop | undefined | **NOT_RUN** |
| DRILL-F09 | Emergency Pause | FeeRouter distributePaused drill | undefined | **NOT_RUN** |
| DRILL-F10 | Resume | unpause + distribute smoke | undefined | **NOT_RUN** |
| DRILL-F11 | Rollback | impl downgrade proposal testnet only | undefined | **NOT_RUN** |
| DRILL-F12 | Escrow Settlement | bilateral confirm → release eligibility E2E | undefined | **NOT_RUN** |

> Mainnet drill **NOT_RUN** is expected until scope selection + controlled broadcast.

