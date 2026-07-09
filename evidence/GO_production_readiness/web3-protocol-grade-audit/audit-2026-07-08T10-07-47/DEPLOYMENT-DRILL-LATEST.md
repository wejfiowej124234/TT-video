# Mainnet Deployment Drill

**Recorded:** 2026-07-08T10:08:31.231Z
**Dry run progress:** 0/8 steps evidenced

| ID | Phase | Action | Evidence | Status |
|----|-------|--------|----------|--------|
| DRILL-01 | Deploy | Broadcast GovernanceStack chain_id=1 | registry mainnet addresses | **NOT_RUN** |
| DRILL-02 | Verify | G1 bytecode identity manifest | evidence/mainnet_launch_gate/G1_* | **NOT_RUN** |
| DRILL-03 | Initialize | Wire Timelock as owner on FeeRouter/Treasury | on-chain owner() read | **NOT_RUN** |
| DRILL-04 | Proxy | GovFreeze V2 overlay deploy + admin slot check | G24 post-deploy probe | **NOT_RUN** |
| DRILL-05 | Registry | protocol-convergence-deployments mainnet block | GAP-99-07 closed | **NOT_RUN** |
| DRILL-06 | Pause | FeeRouter distributePaused=true via Timelock drill | tx hash + event | **NOT_RUN** |
| DRILL-07 | Resume | distributePaused=false | tx hash + G3-02 replay | **NOT_RUN** |
| DRILL-08 | Rollback | impl downgrade proposal (testnet only) | UP drill evidence | **NOT_RUN** |

> Mainnet drill **NOT_RUN** is expected until scope selection + controlled broadcast.

