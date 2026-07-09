# Phase ② · TTG-TOKENOMICS-FREEZE-V1 · Sepolia 正式审计基线

**Stamp:** 20260616T023243Z  
**Chain:** Sepolia (11155111)  
**SSOT:** docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md  
**Proxy gate:** G24-P-UPGRADE-01 PASS  
**Prerequisites:** G24-P-05～09 PASS  
**Verify:** GOV_FREEZE_V1_SEPOLIA_ONCHAIN_VERIFY: PASS

| 组件 | Proxy 地址 | admin |
|------|------------|-------|
| Governor (GOV-02/03) | 0xD972Bee4717218bD2314Eb542a671d8747336136 | Timelock |
| Timelock (GOV-02) | 0x777E532636c53BDc034B9FE73c44E1B2c3113060 | Safe |
| Treasury P4 Cap (GOV-01) | 0xc0FbFc9A50f551273F5748EB2e45B49719dDc796 | Timelock |
| Seat Registry (GOV-03) | 0x75bF993402eb9aCc6145CBdac0EBd322548317d3 | Timelock |
| Primary Market (GOV-04) | 0x2216A416462366b65d4F6Cc96bE50Db1f6e9fbAc | Timelock |
| Stake Pool (GOV-03 hook) | 0xeb0e4a8517EC478d6B386a13D28115357AA6d112 | Timelock |

**Reuse:** GOVERNANCE_TOKEN_ADDRESS=0xaC2E29AC7089e4863C21dAF232cF8bbb025d91ca

**诚实边界:** ② Sepolia 测试网审计基线 · ≠ ③ Production GO · Legal ☐
