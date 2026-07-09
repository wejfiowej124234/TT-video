# GOV-FREEZE-V1 · 链上对齐审计证据（① HAT）

**Evidence ID:** `GO_local_gov_freeze_v1_onchain`  
**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](../../docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md)  
**Phase:** **① 本地 forge HAT** · **② Sepolia 只读对拍脚本已就绪** · **≠ ③ Production GO**

## 运行

```bash
bash scripts/dev/run-gov-freeze-v1-onchain-hat-local.sh
```

末行：`GOV_FREEZE_V1_ONCHAIN_HAT_SUMMARY: PASS`

## 合约

| GOV | 合约 |
|-----|------|
| GOV-01 | `GovernanceTreasuryP4Cap` |
| GOV-02 | `TravelTrustGovernor` + `GovernanceTimelock` |
| GOV-03 | `TtgSeatConcentrationRegistry` + Governor vote cap |
| GOV-04 | `TtgPrimaryMarketV1` |

② 部署：`contracts/script/DeployTtgGovFreezeEnforcement.s.sol`  
② 对拍：`bash scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh`
