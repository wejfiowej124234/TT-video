# TravelTrust 智能合约

本目录为 **Escrow**、**身份质押 v2（`GuideIdentityStakingPool` / `ProviderIdentityStakingPool`，81 两池三账本）**、**Registry（方案 B）**、**FeeRouter（经济路由 Partial）**、**RegionVault（国家桶池 Partial · MVP）** 及可选 **Reputation 存证** 的合约落点，与 [01-总库总览](../docs/spec/01-总库总览.md) §4/§5、[02-架构设计](../docs/spec/02-架构设计.md) §十、[08-4 对外口径包](../docs/spec/08-4-对外口径包.md)、[Runbook §7](../ops/RUNBOOK.md)、[14 §1.1](../docs/spec/14-合约-API-ABI-前后端对齐.md) 一致。**已移除** 旧单文件 `Staking.sol`；ABI 以 **`GuideIdentityStakingPool.json`** / **`ProviderIdentityStakingPool.json`** 为真值（`sync-abi-from-forge.sh`）。

## 开发与部署流程（双向约定）

**最终确认流程**：先本地虚拟链验证，通过后再一键部署到链上。

1. **本地阶段**（**Anvil→公链顺序与换部署核对**单源 **[Runbook §2.56](../ops/RUNBOOK.md)**；本节列合约侧操作）：启动本地虚拟链（Anvil）→ 在本地部署合约 → 本地单测与闭环（createEscrow → deposit → release）全部跑通。若涉及 **治理代币 / Governor / Snapshot·Claim / TTG** 等经济·治理模块，须在本地把 **订单主路径** 与 **治理币使用流**（委托、投票、领取等，以最终实现为准）**一并**联调通过后再切换公链；验收句式见 [governance-token/02 §1.3](../docs/spec/governance-token/02-对内技术规格-草案.md)。
2. **链上阶段**：本地无问题后，用同一套部署脚本、切换 RPC 与私钥，一键部署到测试网/主网（如 Polygon Amoy / Polygon PoS）。

部署：本地验证用 `anvil` + `forge script script/Deploy.s.sol`；测试网/主网用 `forge script script/Deploy.s.sol --rpc-url $CHAIN_RPC_URL --broadcast --private-key $PRIVATE_KEY`。脚本已精简，见 [scripts/README.md](../scripts/README.md)。

**治理栈（Votes Token + Timelock + Governor）**：**`script/Deploy.s.sol`** 部署 **`GovernanceTimelock`**、**`GovernanceTreasury`**（**`spender` = Timelock**）、**`ReserveVault`**（**FeeRouter `globalReserve` 腿**）、**`FeeRouter`**（**`owner` = Timelock**；**`globalStakers`** = Guide 池；**`globalOps`** = **`GovernanceTreasury`**），并对 **FeeRouter / Treasury / ReserveVault / RegionVault** 调用 **`setAllowedExecutionTarget(..., true)`**（**B-407**）。**不**部署 **`TravelTrustGovernor` / `GovernanceVotesToken`**。Sepolia 上需完整治理栈时，使用 **`script/DeployGovernanceStack.s.sol`**：部署 **`GovernanceVotesToken`**（链上 **`symbol()` = `TTG`**，**`name()` = `TravelTrust Governance`**），并完成 **`GovernanceTimelock.setGovernor(governor)`** 与 **`setAllowedExecutionTarget(governor, true)`**：

```bash
cd contracts
export PRIVATE_KEY=0x…   # 部署者；勿提交
export CHAIN_RPC_URL=https://…   # Sepolia HTTPS RPC
# 可选：GOVERNANCE_TIMELOCK_DELAY_SECONDS（默认 120，便于 B-417 短等待；长延迟如 86400 请显式设置）
forge script script/DeployGovernanceStack.s.sol:DeployGovernanceStack \
  --rpc-url "$CHAIN_RPC_URL" --broadcast -vvv
```

控制台会打印 **`TravelTrustGovernor (GOVERNOR_ADDRESS)`** 与 **TTG（`GovernanceVotesToken`）** / Timelock 地址；将 **Governor** 与 **`GovernanceVotesToken`** 写入根目录 **`.env` → `GOVERNOR_ADDRESS` / `GOVERNANCE_TOKEN_ADDRESS`**（钱包导入代币时用 **`GOVERNANCE_TOKEN_ADDRESS`**，符号 **TTG**）。**`GovernanceVotesToken` 无 `delegate()`**，持币者 **`getPastVotes`** 即来自余额 checkpoint，**无需** 自委托（外链 **ERC20Votes** 才需 **`delegate`**，见仓库根 **`scripts/ops/b417-sepolia-propose-vote-succeeded.sh`** 与 **`script/SepoliaDelegateSelf.s.sol`**）。**创始分配（测试）**：团队桶 **15%** 可 **单笔 `transfer`** 到单地址，见 **[`docs/spec/82-治理币-文档总览.md`](../docs/spec/82-治理币-文档总览.md)** §三之二 与 **`scripts/ops/ttg-transfer-team-15pct-single-address.example.sh`**。再链上 **propose → vote → `state=4`**，填 **`B417_PROPOSAL_ID`**，最后跑 B-417 证据脚本（见 [`evidence/b417_governance_execution_runs/README.md`](../evidence/b417_governance_execution_runs/README.md)）。

**Treasury.spend / spendETH 专用提案（TT-TREASURY-SPEND-MINI-EVIDENCE-001）**：使用 **`script/SepoliaProposeTreasurySpend.s.sol`**（env：**`TREASURY_ADDRESS`**、**`TREASURY_SPEND_TO`**、**`TREASURY_SPEND_AMOUNT`**、**`GOVERNOR_ADDRESS`**、**`PRIVATE_KEY`**；ERC20 时 **`GOVERNANCE_TOKEN_ADDRESS`**；可选 **`TREASURY_SPEND_MODE=ERC20|ETH`**）。一键 **propose+vote+Succeeded**：**`bash scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh`**（仓库根）。详见 **[`docs/runbook/TT-TREASURY-SPEND-MINI-EVIDENCE-001.md`](../docs/runbook/TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)**。

**全栈资金栈（已有 `GovernanceTimelock` · 母表 B-434 方案 B · TT-B435）**：**不要** **整包** **广播** **`script/Deploy.s.sol`** **（** **会** **`new GovernanceTimelock`** **）** **。** **改用** **`script/DeployFundStackUnderTimelock.s.sol`** **：** **在** **环境变量** **`TIMELOCK_ADDRESS`** **（** **现有** **治理** **Timelock** **）** **下** **部署** **FeeRouter** **/** **双池** **/** **RegionVault** **/** **Treasury** **/** **ReserveVault** **等** **，** **且** **`FeeRouter.owner`** **/** **`RegionVault.owner`** **/** **`GovernanceTreasury`** **owner+spender** **/** **双池** **`slasher`** **均** **指向** **该** **Timelock** **；** **并由** **Timelock** **`admin()`** **EOA** **（** **`PRIVATE_KEY`** **）** **调用** **`setAllowedExecutionTarget`** **。** **Runbook**：[**`TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001`**](../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)。

```bash
cd contracts
export PRIVATE_KEY=0x…          # 须为 Timelock.admin() 对应 EOA
export TIMELOCK_ADDRESS=0x…     # 与 B-434 裁断一致
export CHAIN_RPC_URL=https://…
# 可选：FUND_STACK_TOKEN_ADDRESS=0x…（不设则脚本内 new MockERC20）
forge script script/DeployFundStackUnderTimelock.s.sol:DeployFundStackUnderTimelock \
  --rpc-url "$CHAIN_RPC_URL" --broadcast -vvv
```

## 设计承诺（定稿须与实现一致）

- **Escrow**：Factory + 每单 clone/槽位；锁代币、确认放款、争议按裁决退/扣；**无 admin 后门、无 emergency withdraw**；订单↔escrow 以链上事件为准。**B-091**：**`EscrowFactory`** **`guardian`** 可 **`setFactoryPaused`**，暂停时 **禁止** **`createEscrow`**（**已部署** Escrow **不**受影响）。
- **身份质押 v2（Guide / Provider 两池）**：`GuideIdentityStakingPool` / `ProviderIdentityStakingPool` 继承同一 `IdentityStakingPool`；**`slash` / `slashToReserve` 仅 `slasher`**；**`stake`/`withdraw`/`stakeOf`/`MIN_STAKE`/`slashedOf`** 读调 ABI 见 **`GuideIdentityStakingPool.json`** / **`ProviderIdentityStakingPool.json`**；三账本与订单风险见 **81**。**B-406（SlashRouter + ReserveVault）**：池构造可注入 **`slashRouter`**；非零时 **`slash`** 经 **`SlashRouter.routeFromPool`** 按 BPS 分流至 **`ReserveVault`**（**`withdraw` 仅 Timelock**）、协议金库与可选 sink；**`slashToReserveBps == 0` 部署拒绝**；**`slashRouter == address(0)`** 时仍走池内 **`slashReserve`**（测试/兼容路径）。测试 **`test/SlashRouter.t.sol`**。
- **Registry（方案 B）**：链上质押 + 链下审核 + 链上发资格；可接单条件见 01 §4、§10。
- **Reputation**：可选存证；与 01 可验证信誉一致。

## 实现状态

| 模块       | 状态     | 说明 |
|------------|----------|------|
| Escrow     | P5 ERC20 已接入 | IERC20 transfer/transferFrom；deposit/**release** / **`releasePartialRefund`**（**Completion TT-COMP-B093**：**80 附录 02 · PartiallyRefunded**，余款 **`remainder=total-travelerRefund`** 上 **`release`** 同 **BPS**；**`test_COMP_B093_*`**）/refund/**executeResolution**（**B-094**：三腿守恒 + **`test_B094_executeResolution_*`**；链下终态映 **`traveltrust_core::terminal_order_state_from_resolution_amounts`**）实转；**init** 拒 **`platformFeeBps > 10000`**；**EscrowFactory** 构造 **`guardian`**，**`factoryPaused`** 门闸 **B-091**；test/Escrow.t.sol（**`test_B093_*`** 表驱动 + fuzz；**`test_B094_*`**）、script/Deploy.s.sol（**`new EscrowFactory(deployer)`**）；需 `forge install foundry-rs/forge-std` 后 `forge build` / `forge test` |
| 身份质押 v2 | P5 骨架已就绪 | 两合约 **`GuideIdentityStakingPool`** / **`ProviderIdentityStakingPool`**；`stake`/`withdraw`/`slash`；三账本见 `StakeAccountingLib`；**`SlashRouter` / `ReserveVault` / `ISlashRouter`**（B-406）；`script/Deploy.s.sol` 当前 **`slashRouter = address(0)`**（池内 reserve）；链上闭环需先部署 ReserveVault + SlashRouter（`slashToReserveBps > 0`）再注入池 |
| Registry   | P5 骨架已就绪 | Registry.sol 方案 B approve/revoke |
| Reputation | 可选待实现 | 存证 |
| **FeeRouter** | **Partial（MVP）** | `FeeRouter.sol`：`distribute(token,amount)` 按 **83/84** 可配置 BPS（默认 45/55 + Global 内 65/20/15，**和=10000**）；**TT-COMP-B089**：**`setRoutingConfig`**（**owner**，宜 **Timelock**）原子更新四方地址 + BPS，**`GovernanceTimelock.t.sol`** **`test_COMP_B089_timelock_execute_set_routing_config`**；**B-091**：**`distributePaused`** 时 **`distribute` revert**；**`setDistributePaused`**（**owner**）；**不含** 按国链上再分；测试 `test/FeeRouter.t.sol`；ABI `contracts/abi/FeeRouter.json` ↔ **55-S13**。**与 Escrow 接线（企业级默认）**：新单 `createEscrow` 时 **`platformFeeRecipient` = 本 FeeRouter 地址**；**迁址新 Router** 须运维改 **`platformFeeRecipient`**（Runbook §7.1）；须与 **`FEE_ROUTER_ADDRESS`**（API/indexer）、**`NEXT_PUBLIC_FEE_ROUTER_ADDRESS`**（前端）**同址对齐** |
| **RegionVault** | **Partial（MVP）** | `RegionVault.sol`：承接 **`FeeRouter.distribute` → `countryBucket`** 入账；`owner` 调 **`forward(token,to,amount)`** 转出池内 ERC20，事件 **`RegionVaultForwarded`**；**不含** 按 ISO 国别链上账本 / Snapshot / Claim（仍为 **Target**）；测试 `test/RegionVault.t.sol`（含与 FeeRouter 串联用例）；ABI `contracts/abi/RegionVault.json` ↔ `frontend/dapp/abis`（**55-S13**）；`script/Deploy.s.sol` 已 **先部署 RegionVault 再传入 FeeRouter 构造函数**。标 **Implemented** 仍须：测试网部署 evidence、可选 indexer 事件订阅、04/14 Runbook 运维段填实 |
| **InvestorDistributionClaim** | **Partial（B-087）** | `InvestorDistributionClaim.sol`：运营 **`registerAccrual` / `registerAccrualsBatch`** 对齐链下 B-086 分录；持有人 **`withdrawDividend` / `claim`** 单交易领取 **`≤ entitled − claimed`**；领尽后再调 **`NothingToClaim`** revert（双花失败）；测试 `test/InvestorDistributionClaim.t.sol`；ABI `contracts/abi/InvestorDistributionClaim.json`；**`Deploy.s.sol`** 已部署实例。与 **RegionVault** 国家桶 Snapshot/Claim **Target** 正交（份额分红领取路径） |
| **GovernanceTimelock** | **B-089 + B-407** | **`schedule`****（****admin****）** + **`scheduleByGovernor`****（****Governor****）** + **`setGovernor`** + **`setAllowedExecutionTarget`** + **`execute`**；**B-407**：未 **`setAllowedExecutionTarget(target,true)`** 则 **`TargetNotAllowed`**；测试 **`GovernanceTimelock.t.sol`**（含 **`test_B407_schedule_reverts_when_target_not_allowed`**）、**`TravelTrustGovernor.t.sol`**；ABI **`GovernanceTimelock.json`** |
| **RouterTreasuryGovernancePayload** | **B-407** | **`contracts/src/RouterTreasuryGovernancePayload.sol`**：**FeeRouter / GovernanceTreasury / ReserveVault** 的 **`selector`** 常量与 **`encode*`** 纯函数（B-430/B-431 回归 SSOT）；测试 **`RouterTreasuryGovernancePayload.t.sol`** |
| **TravelTrustGovernor** | **Completion（B-089）** | **`TravelTrustGovernor.sol`**：提案 / 投票 / **quorum** / **threshold** / **`queue`→Timelock** / **`execute`**；测试 **`test/TravelTrustGovernor.t.sol`** **`test_COMP_B089_governor_*`**；API **`GOVERNOR_ADDRESS`** + **`governance_proposals_projection`** |
| **GovernanceVotesToken（符号 TTG）** | **Completion（B-089）** | **`GovernanceVotesToken.sol`**：**`getPastVotes`****/****`getPastTotalSupply`**（checkpoint）；供 Governor **快照**；钱包导入用 **`GOVERNANCE_TOKEN_ADDRESS`** |
| **GovernanceTreasury** | **Partial（B-090）** | `GovernanceTreasury.sol`：金库 **ERC20 `spend`** + **原生 `receive` / `spendETH(to,amount)`** **仅 `spender`**（**`Deploy.s.sol`** 默认为 **`GovernanceTimelock`**）；**`owner`** **`setSpender`/`transferOwnership`**；事件 **`TreasurySpent`**、**`TreasuryEthSpent`**；测试 `test/GovernanceTreasury.t.sol`（**`test_COMP_B090_timelock_execute_spendETH_matches_payload`** + ERC20 Timelock E2E）；ABI `contracts/abi/GovernanceTreasury.json`；**非** `governance_pool` 展示 API。**表内「Partial」**指 **主网运维 / evidence 归档面** 未宣称全链路 **Implemented**；**Foundry 工程封口** **见** **[任务母表](../docs/任务母表.md)** **B-090** **行** **与** **`evidence/GO_20260408/forge_B090.log`** **。 |
| **RegionStewardStakePool** | **P2 · forge + Anvil ②** | `RegionStewardStakePool.sol`：主理人 TTG 质押（**protocol-ssot** `steward_stake_bps`）；测试 `test/RegionStewardStakePool.t.sol`；部署 **`script/DeployRegionStewardStakePool.s.sol`**；Anvil 烟测 **`bash scripts/dev/smoke-steward-stake-anvil.sh`**（**② 切片** · 见 **[TT-9629](../docs/runbook/TT-9629-protocol-convergence-steward-stake-testnet.md)**） |

合约实现后可置于本目录（如 `contracts/src/`）或独立 repo；若独立 repo，须在本 README 或 02 §十 注明路径，并产出不可逆结构图与 08-4 承诺证明入 evidence。

## 实现时技术约束

定稿与实现时须写明，便于复现与审计：

- **Solidity 版本**：0.8.19（foundry.toml solc_version）；EVM paris
- **目标网络**：Polygon PoS chainId 137（01 §5）；**本地测试必须先用 Anvil**，通过后再部署到链上。
- **构建**：Foundry（`forge build`）；合约位于 `contracts/src/`，产物 `out/`  
  - **本地未装 `forge` / PATH**：见 **`contracts/LOCAL-FOUNDRY.md`**；**B-093** / **B-087** / **B-089** / **B-090** 验收：**`run-b093-forge.sh`**、**`run-b087-forge.sh`**（§6）、**`run-b089-forge.sh`**（§7）、**`run-b090-forge.sh`**（**`GovernanceTreasury.t.sol` + `[Bb]090`**，§8）
- **ABI 导出**：仓库根执行 `./scripts/sync-abi-from-forge.sh`（须已安装 `forge`），将 canonical ABI 写入 `contracts/abi/`，再按脚本提示同步 `frontend/dapp/abis` 并跑 `check-55-s13.sh`；详见 [contracts/abi/README](abi/README.md)、[scripts/README](../scripts/README.md)
- **依赖**：`forge install foundry-rs/forge-std`；本地测试与部署见上文「部署」段（Anvil + forge script）

## 参考

- 01 §4 哪些需要智能合约、§5 链与代币选型
- 02 §十 功能与参考实例对照、合约与模块对应
- 08-4 协议终极边界声明与终局设计、Runbook §7 Immutable Core / 多签权限矩阵
