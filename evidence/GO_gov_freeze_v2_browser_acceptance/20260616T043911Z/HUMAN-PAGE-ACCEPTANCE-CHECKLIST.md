# G24-BROWSER-ACCEPT-01 · 逐页验收清单

**基线:** GovFreeze V2 · **SSOT:** TTG-TOKENOMICS-FREEZE-V1
**机读:** UI alignment PASS · onchain verify PASS

| # | 页面 | 路由 | 真人核对项 | L1 截图 | 签核 |
|---|------|------|------------|---------|------|
| 1 | 治理 Hub · 入口与诚实边界 | `/governance` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/governance-hub.png` | ☐ |
| 2 | GOV-01～04 · Primary Market 25k cap | `/governance/params#gov-params-tokenomics-freeze` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/gov-params-freeze.png` | ☐ |
| 3 | Global Treasury · P4 · 公众三轮 | `/governance/params#gov-params-treasury-policy` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/gov-params-treasury.png` | ☐ |
| 4 | Country Pool 45/55 · 净利润资金流 | `/governance/params#gov-params-overview` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/gov-params-overview.png` | ☐ |
| 5 | 提案 · 投票 · Queue · Execute | `/governance/proposals` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/governance-proposals.png` | ☐ |
| 6 | 提案创建 | `/governance/proposals/create` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/governance-proposals-create.png` | ☐ |
| 7 | 委托投票权 | `/governance/delegate` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/governance-delegate.png` | ☐ |
| 8 | Seat · Stake · 退出 requestRelease | `/governance/steward-region-workbench` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/steward-workbench.png` | ☐ |
| 9 | 投资者分配领取 · 收益叙事 | `/governance/distribution-claim` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/distribution-claim.png` | ☐ |
| 10 | 应计分配 | `/governance/distribution-accruals` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/distribution-accruals.png` | ☐ |
| 11 | FeeRouter 65/20/15 | `/governance/fee-routes` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/fee-routes.png` | ☐ |
| 12 | Vault 转发审计 | `/governance/vault-forwards` | 文案=SSOT · 金额/bps · ② 诚实边界 | `screenshots/vault-forwards.png` | ☐ |

## 五层证据（HAT-R1 每步复用）
L1 页面 · L2 钱包 · L3 链上事件 · L4 API · L5 DB

## 签核
- [ ] 全部页面与 TTG-TOKENOMICS-FREEZE-V1 一致
- [ ] Primary Market / Seat / Country Pool / Treasury / 收益 / 退出 无废止叙事
- 签核人: _______________ 日期: _______________
