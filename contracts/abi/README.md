# ABI 放置目录（合约编译产物单源）

本目录为**合约 ABI JSON 的单源存放位置**，与 [docs/spec/14-合约-API-ABI-前后端对齐](../../docs/spec/14-合约-API-ABI-前后端对齐.md) 一致。

## 约定

- **合约实现后**：将 Solidity 编译产出的 ABI JSON 文件放入本目录，例如：
  - `Escrow.json`（或 `EscrowFactory.json` + 实例 ABI）
  - `GuideIdentityStakingPool.json` / `ProviderIdentityStakingPool.json`
  - `Registry.json`
  - 可选：`Reputation.json`
- **命名**：与合约名或 01/02/contracts README 中模块名一致，便于前端与后端引用。
- **前端**：frontend 使用的 ABI 须**来自本目录**（复制到 frontend/dapp/abis/ 或通过 monorepo 引用），不得手写，保证与部署合约版本一致。
- **后端**：若用 Rust 与链交互（alloy 等），ABI 或生成的 Rust 绑定须与本目录一致。

## 当前状态

- 合约已实现（Escrow、EscrowFactory、IERC20、MockERC20、Guide/Provider 身份质押池、Registry、**FeeRouter**、**RegionVault**、**SlashRouter**、**ReserveVault**、**InvestorDistributionClaim**、**CountryPoolLedgerV0**、**RegionDistributionClaim**、**GovernanceTimelock**、**GovernanceTreasury**、**GovernanceVotesToken**、**TravelTrustGovernor** 等）。本目录已含对应 **\*.json**（与 `contracts/src` 对齐；**`scripts/dev/sync-abi-from-forge.sh`** 一次性导出）。**旧单文件 `Staking.sol` 已移除**，**无** **`Staking.json`**。**FeeRouter** / **RegionVault** 为经济路由 **Partial**，与 **14 §1.1.1** 一致。
- **治理栈 ABI**（**`GovernanceVotesToken.json`**（合约 **`symbol()` = TTG）、**`TravelTrustGovernor.json`**）：**canonical** **在本目录**；**`check-55-s13`** **不要求** **复制到** **`frontend/dapp/abis`**（治理前端以 **GET /meta** + API 为主）；链下工具 / Explorer 对标 / cast 编解码应以本目录与 **`forge inspect`** **一致** **为准**。
- **与前端同步**：将 `GuideIdentityStakingPool.json`、`ProviderIdentityStakingPool.json`、`Registry.json`、`EscrowFactory.json`、`FeeRouter.json`、`RegionVault.json` 复制到 `frontend/dapp/abis/` 后执行 `./scripts/check-55-s13.sh`，确保两目录字节一致。
- **CI / 本地**：`.github/workflows/contract-abi-gate.yml` 在 `forge test` 后运行 **`bash scripts/run-verify-abi-forge.sh`**（内部调用 **verify-abi-forge.py**，比较 `forge inspect … abi` 与已提交 JSON 的 **ABI 条目 multiset**）。Workflow 对无关变更（仅文档等）**不自动触发**；可在 GitHub **Actions → 手动 Run workflow** 补跑。本地有 Foundry：`bash scripts/run-verify-abi-forge.sh`。不一致时跑 `./scripts/sync-abi-from-forge.sh`（或 `.ps1`）后提交。
- 完整 ABI 推荐用项目根 **`./scripts/sync-abi-from-forge.sh`** 一次性写入本目录（需本机已安装 `forge` 且 `contracts` 能 `forge build`）；脚本会提示将 **Guide/Provider 池、`Registry`、`FeeRouter`、`RegionVault`** 等 **55-S13 子集** JSON 复制到 `frontend/dapp/abis/` 并执行 `check-55-s13.sh`。**`SlashRouter`/`ReserveVault`**：**仅** **本** **目录** **canonical**（**`verify-abi-forge.py`** **校验**）；**待** **DApp** **直连** **再** **纳入** **双** **目录** **字节** **对齐** **。亦可手工：`forge inspect RegionVault abi | jq . > abi/RegionVault.json` 等。
- 实现后请同步更新 [docs/spec/14-合约-API-ABI-前后端对齐](../../docs/spec/14-合约-API-ABI-前后端对齐.md) §1.1 中具体方法/事件名。
