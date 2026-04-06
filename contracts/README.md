# TravelTrust 智能合约

本目录为 **Escrow、Staking、Registry（方案 B）**、**FeeRouter（经济路由 Partial）**、**RegionVault（国家桶池 Partial · MVP）** 及可选 **Reputation 存证** 的合约落点，与 [01-总库总览](../docs/spec/01-总库总览.md) §4/§5、[02-架构设计](../docs/spec/02-架构设计.md) §十、[08-4 对外口径包](../docs/spec/08-4-对外口径包.md)、[Runbook §7](../ops/RUNBOOK.md)、[14 §1.1](../docs/spec/14-合约-API-ABI-前后端对齐.md) 一致。

## 开发与部署流程（双向约定）

**最终确认流程**：先本地虚拟链验证，通过后再一键部署到链上。

1. **本地阶段**（**Anvil→公链顺序与换部署核对**单源 **[Runbook §2.56](../ops/RUNBOOK.md)**；本节列合约侧操作）：启动本地虚拟链（Anvil）→ 在本地部署合约 → 本地单测与闭环（createEscrow → deposit → release）全部跑通。若涉及 **治理代币 / Governor / Snapshot·Claim / TTG** 等经济·治理模块，须在本地把 **订单主路径** 与 **治理币使用流**（委托、投票、领取等，以最终实现为准）**一并**联调通过后再切换公链；验收句式见 [governance-token/02 §1.3](../docs/spec/governance-token/02-对内技术规格-草案.md)。
2. **链上阶段**：本地无问题后，用同一套部署脚本、切换 RPC 与私钥，一键部署到测试网/主网（如 Polygon Amoy / Polygon PoS）。

部署：本地验证用 `anvil` + `forge script script/Deploy.s.sol`；测试网/主网用 `forge script script/Deploy.s.sol --rpc-url $CHAIN_RPC_URL --broadcast --private-key $PRIVATE_KEY`。脚本已精简，见 [scripts/README.md](../scripts/README.md)。

## 设计承诺（定稿须与实现一致）

- **Escrow**：Factory + 每单 clone/槽位；锁代币、确认放款、争议按裁决退/扣；**无 admin 后门、无 emergency withdraw**；订单↔escrow 以链上事件为准。**B-091**：**`EscrowFactory`** **`guardian`** 可 **`setFactoryPaused`**，暂停时 **禁止** **`createEscrow`**（**已部署** Escrow **不**受影响）。
- **Staking**：向导/仲裁员质押、扣罚、解押；**`slash` 仅 `slasher` 地址**（构造参数 `_slasher`，不可变）；`MIN_STAKE` 与累计头寸校验见实现。档位 / 订单比例 / Cap 见 08-3 与 **81**，链上待扩展。
- **Registry（方案 B）**：链上质押 + 链下审核 + 链上发资格；可接单条件见 01 §4、§10。
- **Reputation**：可选存证；与 01 可验证信誉一致。

## 实现状态

| 模块       | 状态     | 说明 |
|------------|----------|------|
| Escrow     | P5 ERC20 已接入 | IERC20 transfer/transferFrom；deposit/**release**（**B-093**：向导 `floor(total*(10000-bps)/10000)`、平台费 `total-guide`（**01 §10** 余数归平台））/refund/**executeResolution**（**B-094**：三腿守恒 + **`test_B094_executeResolution_*`**；链下终态映 **`traveltrust_core::terminal_order_state_from_resolution_amounts`**）实转；**init** 拒 **`platformFeeBps > 10000`**；**EscrowFactory** 构造 **`guardian`**，**`factoryPaused`** 门闸 **B-091**；test/Escrow.t.sol（**`test_B093_*`** 表驱动 + fuzz；**`test_B094_*`**）、script/Deploy.s.sol（**`new EscrowFactory(deployer)`**）；需 `forge install foundry-rs/forge-std` 后 `forge build` / `forge test` |
| Staking    | P5 骨架已就绪 | `stake` / `withdraw` / `slash`（仅 slasher）；无按单 bps；部署须显式传入 `_slasher` |
| Registry   | P5 骨架已就绪 | Registry.sol 方案 B approve/revoke |
| Reputation | 可选待实现 | 存证 |
| **FeeRouter** | **Partial（MVP）** | `FeeRouter.sol`：`distribute(token,amount)` 按 **83/84** 可配置 BPS（默认 45/55 + Global 内 65/20/15，**和=10000**）；**TT-COMP-B089**：**`setRoutingConfig`**（**owner**，宜 **Timelock**）原子更新四方地址 + BPS，**`GovernanceTimelock.t.sol`** **`test_COMP_B089_timelock_execute_set_routing_config`**；**B-091**：**`distributePaused`** 时 **`distribute` revert**；**`setDistributePaused`**（**owner**）；**不含** 按国链上再分；测试 `test/FeeRouter.t.sol`；ABI `contracts/abi/FeeRouter.json` ↔ **55-S13**。**与 Escrow 接线（企业级默认）**：新单 `createEscrow` 时 **`platformFeeRecipient` = 本 FeeRouter 地址**；**迁址新 Router** 须运维改 **`platformFeeRecipient`**（Runbook §7.1）；须与 **`FEE_ROUTER_ADDRESS`**（API/indexer）、**`NEXT_PUBLIC_FEE_ROUTER_ADDRESS`**（前端）**同址对齐** |
| **RegionVault** | **Partial（MVP）** | `RegionVault.sol`：承接 **`FeeRouter.distribute` → `countryBucket`** 入账；`owner` 调 **`forward(token,to,amount)`** 转出池内 ERC20，事件 **`RegionVaultForwarded`**；**不含** 按 ISO 国别链上账本 / Snapshot / Claim（仍为 **Target**）；测试 `test/RegionVault.t.sol`（含与 FeeRouter 串联用例）；ABI `contracts/abi/RegionVault.json` ↔ `frontend/dapp/abis`（**55-S13**）；`script/Deploy.s.sol` 已 **先部署 RegionVault 再传入 FeeRouter 构造函数**。标 **Implemented** 仍须：测试网部署 evidence、可选 indexer 事件订阅、04/14 Runbook 运维段填实 |
| **InvestorDistributionClaim** | **Partial（B-087）** | `InvestorDistributionClaim.sol`：运营 **`registerAccrual` / `registerAccrualsBatch`** 对齐链下 B-086 分录；持有人 **`withdrawDividend` / `claim`** 单交易领取 **`≤ entitled − claimed`**；领尽后再调 **`NothingToClaim`** revert（双花失败）；测试 `test/InvestorDistributionClaim.t.sol`；ABI `contracts/abi/InvestorDistributionClaim.json`；**`Deploy.s.sol`** 已部署实例。与 **RegionVault** 国家桶 Snapshot/Claim **Target** 正交（份额分红领取路径） |
| **GovernanceTimelock** | **Partial（B-089）** | `GovernanceTimelock.sol`：**`admin`** **`schedule(target,value,data,salt)`** → **`delay`** 秒后任意地址 **`execute(id)`**；用于 **`FeeRouter.transferOwnership`**、**`FeeRouter.setRoutingConfig`** 等；**不含** Governor 投票/OpenZeppelin 全量 Timelock 管理 UI；测试 `test/GovernanceTimelock.t.sol`；ABI `contracts/abi/GovernanceTimelock.json`；**`Deploy.s.sol`** 部署（**`GOVERNANCE_TIMELOCK_DELAY_SECONDS`**） |
| **GovernanceTreasury** | **Partial（B-090）** | `GovernanceTreasury.sol`：金库 **ERC20 `spend(token,to,amount)`** **仅 `spender`**（**`Deploy.s.sol`** 默认为 **`GovernanceTimelock`**）可调，**payload 链上钉死**；**`owner`** **`setSpender`/`transferOwnership`**；事件 **`TreasurySpent`**；测试 `test/GovernanceTreasury.t.sol`（含 Timelock E2E）；ABI `contracts/abi/GovernanceTreasury.json`；**非** `governance_pool` 展示 API |

合约实现后可置于本目录（如 `contracts/src/`）或独立 repo；若独立 repo，须在本 README 或 02 §十 注明路径，并产出不可逆结构图与 08-4 承诺证明入 evidence。

## 实现时技术约束

定稿与实现时须写明，便于复现与审计：

- **Solidity 版本**：0.8.19（foundry.toml solc_version）；EVM paris
- **目标网络**：Polygon PoS chainId 137（01 §5）；**本地测试必须先用 Anvil**，通过后再部署到链上。
- **构建**：Foundry（`forge build`）；合约位于 `contracts/src/`，产物 `out/`
- **ABI 导出**：仓库根执行 `./scripts/sync-abi-from-forge.sh`（须已安装 `forge`），将 canonical ABI 写入 `contracts/abi/`，再按脚本提示同步 `frontend/dapp/abis` 并跑 `check-55-s13.sh`；详见 [contracts/abi/README](abi/README.md)、[scripts/README](../scripts/README.md)
- **依赖**：`forge install foundry-rs/forge-std`；本地测试与部署见上文「部署」段（Anvil + forge script）

## 参考

- 01 §4 哪些需要智能合约、§5 链与代币选型
- 02 §十 功能与参考实例对照、合约与模块对应
- 08-4 协议终极边界声明与终局设计、Runbook §7 Immutable Core / 多签权限矩阵
