# GO_local_country_pool_net_profit_gate2.2

**Phase:** **① 本地** · Gate-2.2 D-4555-B Settlement 收口证据。

| 文件 | 用途 |
|------|------|
| GATE2.2-LOCAL-ACCEPTANCE-REPORT.md | 本地验收主报告 |
| GATE2.3-PRE-REVIEW.md | Gate-2.3 前置审查入口 |
| forge_country_pool_net_profit.log | **38 passed** |
| forge_fee_router_regression.log | **10 passed** |

复现：`cd contracts && forge test --match-contract CountryPoolNetProfit` · `FeeRouterTest`

**① 本地合约绿，不等于 ② Sepolia GO。**
