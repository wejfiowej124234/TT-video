# §12.2 · C-5 读通批次（contracts / ABI / dapp · 非主行闭证 · v1.4.160）

**日期**：2026-04-22  
**范围**：**`contracts/`** + **[14 §1.2 ABI 放置与引用约定](../../docs/spec/14-合约-API-ABI-前后端对齐.md)**（**§1.2** 表：**`contracts/abi/`** 单源 → **`frontend/dapp/abis/`**；**55-S13**/**Runbook §12.4** 叙事）+ **`contracts/README.md`** 篇首；**不**跑 **`forge test`** 全矩阵、**不**替代 **`check-55-s13.sh`** 字节 **`cmp`** 全扇面、**不**将 **§12.2 · C-5** 主表 **`[ ]]`** 改为 **`[x]`**。

## 1. 闸门（exit 0）

| 命令 | 结果 |
|------|------|
| `bash scripts/check-07-version-triple.sh` | **OK**（07 **1.0.858**） |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |

## 2. 机读计数（仓库根）

| 指标 | 命令 | 结果 |
|------|------|------|
| `contracts/src` `*.sol` | `find contracts/src -name '*.sol' \| wc -l` | **23** |
| `contracts/abi` `*.json` | `find contracts/abi -name '*.json' \| wc -l` | **18** |
| Forge `script`+`test` `*.sol` | `find contracts/script contracts/test -name '*.sol' \| wc -l` | **20** |
| `frontend/dapp/abis`（`-maxdepth 1`） | `find frontend/dapp/abis -maxdepth 1 -name '*.json' \| wc -l` | **10** |
| 根 **`packages/`** | `test -d packages` | **无**（**勿**与 **`frontend/`** 混淆；与 **95** 文首 **C-5** 句一致） |

## 3. 有界读通摘要

- **[14](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** **§1.2**：**`contracts/abi/`** 为 ABI JSON **单源**；前端 **`frontend/dapp/abis/`** 由 **`contracts/abi/`** 同步；**Guide/Provider 质押**/**Registry** 等须与 **`check-55-s13.sh`**（**55-S13**）字节一致；**Escrow** 可为 DApp **精简 ABI**，canonical 全量在 **`contracts/abi/Escrow.json`**；**SlashRouter**/**ReserveVault**/**GovernanceVotesToken**/**TravelTrustGovernor** 等 **canonical 仅 `contracts/abi/`**，**当前** **不要求** 复制到 **`dapp/abis`**（与 **机读 basename 列表** 一致：**`dapp/abis` 10 文件** ⊂ **`contracts/abi` 18 文件**）。
- **`contracts/README.md`** 篇首：模块落点（**Escrow**、双池质押、**Registry**、**FeeRouter**/**RegionVault** 等）与 **01/02/08-4/Runbook/14 §1.1** 互指；**旧 `Staking.json` 已移除** 叙事与 **14** 表一致。

## 4. `contracts/abi` vs `frontend/dapp/abis`（basename 列表 · 机读）

**`contracts/abi`（18）**：`CountryPoolLedgerV0.json`、`Escrow.json`、`EscrowFactory.json`、`FeeRouter.json`、`GovernanceTimelock.json`、`GovernanceTreasury.json`、`GovernanceVotesToken.json`、`GuideIdentityStakingPool.json`、`IERC20.json`、`InvestorDistributionClaim.json`、`MockERC20.json`、`ProviderIdentityStakingPool.json`、`RegionDistributionClaim.json`、`RegionVault.json`、`Registry.json`、`ReserveVault.json`、`SlashRouter.json`、`TravelTrustGovernor.json`。

**`frontend/dapp/abis`（10）**：`CountryPoolLedgerV0.json`、`Escrow.json`、`EscrowFactory.json`、`FeeRouter.json`、`GuideIdentityStakingPool.json`、`InvestorDistributionClaim.json`、`ProviderIdentityStakingPool.json`、`RegionDistributionClaim.json`、`RegionVault.json`、`Registry.json`。

## 5. 诚实边界

- **未**在本批次执行 **`bash scripts/check-55-s13.sh`** / **`forge test`**；**未**对 **18×10** 做逐文件 **`cmp -s`** 登记。
- **§12.4** 既有 **「C-5（子证 · contracts/abi 可数）」**/**「C-5（子证 · `dapp/abis` 可数）」**（**2026-04-21**）**不**与本读通批次合并为「主行闭证」；本包为 **v1.4.160** **读通批次登记**。

## 6. 互证

- **95** 文首 **合约仓**/**`dapp/abis`**/**根 `packages/`** 与 **§12.2 · C-5**/**§12.1.1 · C-5**/**§12.3.3**。
- **台账**：**95 `Version:` 1.4.160** ↔ **`docs/spec/00-文档索引.md`** 表 **95** 行（同批更新）。
