# GO_95 · §7.1 域 J（治理 / 质押）审计证据 · 2026-04-21



## 前端路由 ↔ **04 §3.4** / **13-1 表 2-续**



| 路径 | 实现要点 |

|------|----------|

| **`/governance`** | **`frontend/app/governance/page.tsx`**：**`GET /api/v1/governance/pool`**、**`GET /api/v1/governance/rewards`**（**`apiUrl(routes.governancePool)`** / **`governanceRewards`**）；**`GovernanceTargetNotice`**（**07 §5.2A / 13-1**「文档镜像·非承诺」）；**`pool`/`rewards`** **占位/链上主读** 语义与 **04** **`GET …/governance/pool`**/**`rewards`** 行（**`data_source`**、**`X-Implementation-Status`**）对读。 |

| **`/governance/params`** | **`protocol-reference`**/**`pending`**（**`routes.governanceProtocolReference`** 等）与 **04** **`GET …/governance/params`** 占位 HTTP 路由并行；**84** 镜像消费路径与 **04** 一致。 |

| **`/governance/proposals`**、**`/governance/proposals/[id]`** | **列表**：**`frontend/app/governance/proposals/page.tsx`** **`fetchJsonWithApiStatusLog`(`apiUrl(routes.governanceProposals)`)** + **`getGovernanceProposalStatus`**。**详情/投票**：**`governance.ts`** **`getGovernanceProposal`**/**`postGovernanceProposalVote`**/**`getGovernanceVotingPower`** ↔ **`GET|POST /api/v1/governance/proposals*`**；**Governor** 展示与 **04**/**109** 叙述对读。 |

| **`/governance/delegate`** | **`governanceDelegate.ts`** ↔ **`GET|POST|DELETE /api/v1/governance/delegate`**（**04** **B-073**）。 |

| **`/governance/fee-routes`**、**`/governance/vault-forwards`** | **`routes.governanceFeeRoutes`** / **`governanceVaultForwards`** ↔ **04** **`GET …/fee-routes`**、**`GET …/vault-forwards`**。 |

| **`/governance/distribution-accruals`**（**`[id]`**） | **`buildGovernanceInvestorDistributionAccrualsUrl`** + **`routes.governanceInvestorDistributionAccruals`** ↔ **`GET /api/v1/governance/investor-distribution-accruals`**（**B-086**）；**13-1 表 2-续** **P5-4-2** 登记；**不**调用 **`/internal/`** 写路径。 |

| **`/governance/distribution-claim`** | **Wagmi** + **`InvestorDistributionClaim.json`**（**`frontend/dapp/abis`**）+ **`getInvestorDistributionClaimAddress`**；**13-1 表 2-续** **P5-4-1**；与 **04** **B-087**/**14 §1.1** 链上 Claim 叙事对读（**非** REST 登记应计）。 |

| **`/staking`** | **`frontend/app/staking/page.tsx`** + **`Staking*Panel`**：**`wagmi`** **`useReadContract`/`useWriteContract`** + **`identityStakingPoolAbi`**（**`GuideIdentityStakingPool`/`ProviderIdentityStakingPool`** 地址 **`stakingEnv`**）；与 **04** **`/staking`** 行（**81**/**14** **`IdentityStakingPool` 系**）及 **`POST /api/v1/guides/:id/stake`** 产品分轨对读；**≠** **`GET …/governance/pool`**（**TTG/区域池** 叙事见 **82/83/84**）。 |



## **89** / **governance-token**



- **89**：治理控制台 **IA Target** 与现行 **`/governance/*`** 子树为 **Partial→Target** 渐进关系；全站 **`GovernanceTargetNotice`** 统一披露（**i18n** **`governance_hub_target_notice`**）。  

- **governance-token/02**：投票权/委托与链上 **Governor** 口径以 **04** **`GET …/proposals*`**/**`voting-power`** 与 **14** 为工程真值；**不**在本证据包替代 **89**/**governance-token** 全文终验。



## 命令



```bash

bash scripts/run-check-04-routes.sh

# exit 0（含 check-b432-governance-ui-ssot-surface）

```



## 边界



**不**替代 **§8.2** **Governor/MVP** 行完成或 **forge** 全量；**不**替代 **93 C** 治理抽检；**不**将 **`fee-pool-aggregates` Σ** 误读为 **`pool`** 链上主读（**13-1 表 2-续** 已禁混读）。

