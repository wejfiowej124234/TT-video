# 合约、API、ABI 与前后端对齐说明

本文为**合约接口、API 路由、ABI 放置与前后端调用**的单源对齐文档，便于实现时 04、crates/api、frontend、contracts 保持一致。**权威依据**：合约见 [01-总库总览](01-总库总览.md) §4/§5、[02-架构设计](02-架构设计.md) §十、[contracts/README](../../contracts/README.md)；API 见 [04-后端与API](04-后端与API.md) §三；DApp 见 [06-DApp架构总览](06-DApp架构总览.md)、[09-技术架构总览](09-技术架构总览-v1.0.md) §2.7。

**架构可视化（链上/链下边界与主链数据流）**：[18-TravelTrust-全系统架构图](18-TravelTrust-全系统架构图.md)、[18-补充-TravelTrust-全系统架构层级图-最终版](18-补充-TravelTrust-全系统架构层级图-最终版.md)。**订单与合约协同落地**仍以本文 + **04 §3.4** + [53-阶段开发技术文档](53-阶段开发技术文档.md) 为准。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **已实现合约模块与方法** | **§1.1** 表 |
| **FeeRouter（Partial）/ RegionVault（Partial · MVP）** | **§1.1**、**§1.1.1**；叙事 **[83](83-区域治理与收益分配-协议白皮书.md)**、**[84](84-第一阶段10国Country-Pool发行参数总表.md)**；逐国链上账本等仍 **Target** |
| **治理聚合 vs 对账分域（B-121 / B-115）** | **`fee-pool-aggregates`** 等 **治理聚合** 与 **Snapshot/Claim/链上桶** **对账** 的边界以 **§2.1** 键与 **04 §3.4** 为准；**禁止** 用投影 **Σ** 冒充 **`GovernanceTreasury`/`RegionVault` 真读**（见 **§2.1** 下 **禁止** 段）；母表 **B-115** 与 **evidence** 同批闭合 |
| **ABI 放置与同步规则** | **§1.2**（`contracts/abi` → `frontend/dapp/abis`） |
| **v1 HTTP 路径全表** | **[04 §3.4](04-后端与API.md)** — 本文侧重 **合约↔调用方** 对齐，**不**替代 04 路由 SSOT |
| **DApp 调用与交易状态机** | **[06](06-DApp架构总览.md)** |
| **合并版检查报告** | **[14-附录](14-附录-API与ABI对齐检查报告.md)** |
| **索引器运维合并 JSON（evidence · 非表内 HTTP）** | **`scripts/indexer-public-snapshot.sh`**（**`.ps1`**）；**`snapshot_provenance`** 与 **internal/admin 索引器** **对读** — **L2 形状 SSOT** **[04 §3.4](04-后端与API.md)**（读前摘要 + **`internal` API 总述** · **运维 JSON 快照**）；流程 **[110 §3.1.2](110-阶段开发链上索引器与事件同步器.md)**、**Runbook §2.55**、**evidence/README**、**`indexer-reconcile-gate`**；**本文 §2.1** 下段 **运维 JSON 快照** 索引 |
| **顶栏 IA、`/traveltrust` 壳与合规边界** | **[04 §3.4](04-后端与API.md)**、**[13-1](13-1-UI产品级SSOT与页面规范.md)**、**[85 §二 2.6](85-TravelTrust网络落地页-融资级设计与开发规格.md)**（组件索引；**非** ICO 认购） |
| **`/` + `/market` 四页 ① FE 数据链（非 ABI 表）** | **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **`GET …/discover/orders`** 消费方 **`useMarketPage`**（**300ms debounce**）· **`/`** **`landingItinerarySession` = `localStorage`** |
| **Escrow 参与方 / 协议四类命名** | **[87 §8](87-TravelTrust-角色体系技术文档-融合架构版.md)**；**`Escrow.sol` 字段名 + ABI** 与本 **§1.1** 为真值 |
| **工程执行顺序与 Phase/Wave** | **[07](07-开发流程与顺序.md) §零～§五**；**FeeRouter 之后**（RegionVault 等）与 indexer/对账全链路须按 **§1.1.1** 与 **83/84/110** 分批落地并附 **evidence**（CI、Runbook、**110** 章节、**`evidence/GO_YYYYMMDD/`**），**禁止**仅凭文档宣称 **Implemented** |
| **上链部署顺序（本地 → 公链）** | **[Runbook §2.56](../../ops/RUNBOOK.md)**（运维 SSOT）；**§6** 与 **[contracts/README](../../contracts/README.md)** 为 ABI/本地联调侧；治理/TTG 扩展同读 **[governance-token/02 §1.3](governance-token/02-对内技术规格-草案.md)**、**[82 §三附](82-治理币-文档总览.md)**、**[07 §五 5.2A](07-开发流程与顺序.md)** |

---

## 1. 合约 ↔ ABI ↔ 前端/后端 对齐

### 1.1 合约模块与设计承诺（与 contracts/README 一致）

| 模块 | 用途 | 关键方法/事件（实现时定稿） | 前端/后端使用 |
|------|------|-----------------------------|----------------|
| **Escrow** | 订单托管 | **EscrowFactory**：**`createEscrow`**（**B-091**：**`factoryPaused`** 时 **`FactoryPaused`**，仅阻断**新**实例；**已部署** Escrow **不**受影响）；实例：**deposit** / **release** / **`releasePartialRefund`** / **`releaseSlashed`**（**B-093 / 01 §10**：**`release`** **Completed** 收平台费；**`guideAmount = totalAmount * (10000 - platformFeeBps) / 10000`**（向下取整），**`platformFeeAmount = totalAmount - guideAmount`**（BPS 余数归平台费腿）；**Completion（106）TT-COMP-B093**：**`releasePartialRefund`** **Funded → PartiallyRefunded**，**`remainder = totalAmount - travelerRefund`** 上 **`guideAmount`/`platformFeeAmount`** 与 **`release`** 同式；**108** **`TT-COMP-B093-ESCROW-SLASHED-NON-DISPUTE-001`**：**`releaseSlashed`** **Funded → Slashed**（**非争议**；**`guideAmount=0`**，**`platformFeeAmount = totalAmount - travelerRefund`**，**`SlashedExecuted`**）；**`init`** 拒 **`platformFeeBps > 10000`**；**非** `POST .../confirm-completion`，后者仅链下行程完成，见 04 §3.4）/ refund / openDispute / **executeResolution**（执行器代发裁决；**B-094 Partial**：三腿 **`guideAmount + travelerRefund + platformFee == totalAmount`**，Foundry **`Escrow.t.sol`** **`test_B094_executeResolution_*`**；**`ResolutionExecuted`** **无**三腿金额，链下 **`orders_projection`** 映 **Refunded / PartiallyRefunded / Slashed** 须 **calldata** 或 outbox 侧车 + **`traveltrust_core::terminal_order_state_from_resolution_amounts`**）；事件 EscrowCreated、Deposited、Released、Refunded、DisputeOpened、ResolutionExecuted、**PartialRefundExecuted**（01 §5；**Paid** 为产品口径，链上对应 **Deposited**；**Released** / **PartialRefundExecuted** 的 **`guideAmount`/`platformFeeAmount`**（余 **`remainder`**）与上式可复算） | 前端：用户签 deposit/**release**/**releasePartialRefund**/refund/openDispute；**createEscrow** 见 **EscrowFactory.json**（**55-S13**）；后端：Indexer 消费事件、Executor 调 executeResolution |
| **身份质押（IdentityStakingPool 系）** | 向导/仲裁员质押 | **stake** / **withdraw** / **slash**（仅 **`slasher`**，构造注入 immutable）；`MIN_STAKE`；**无**按单 bps/Cap（81 §4.2 路线图）；档位与接单上限 SSOT **08-3** | 前端：`/staking` 页 ERC-20 approve + stake；**slash** 由执行器/治理多签，非用户页；后端：读链、对账；ABI 见 **`GuideIdentityStakingPool.json`** / **`ProviderIdentityStakingPool.json`**（**旧** `Staking.json` **已移除**） |
| **Registry（方案 B）** | 链上资格 | approve / revoke；可接单条件 01 §4、§10 | 前端：读资格；后端：审核后上链发资格 |
| **Reputation** | 可选存证 | 存证接口与 01 可验证信誉一致 | 前端/后端：可选 |
| **FeeRouter（Partial）** | 可分配平台手续费路由 | **`distribute(IERC20 token, uint256 amount)`**（`onlyOwner`）：按 **83/84** 将 `amount` 拆至 **countryBucket / globalStakers / globalReserve / globalOps**；**B-091**：**`distributePaused`** **`true`** 时 **`DistributePaused`**（阻断**新** **`distribute`**；余额滞留 Router）；**`setDistributePaused(bool)`**（`onlyOwner`）；**TT-COMP-B089**：**`setRoutingConfig(...)`**（`onlyOwner`，四方地址 + 四路 BPS **和=10000**；默认 BPS **4500/3575/1100/825**；**`BPS_*()`** 只读 ABI 名不变）；事件 **`PlatformFeeRouted`**、**`DistributePausedSet`**、**`RoutingConfigSet`**；**不含** 按国链上再分（见 **RegionVault**）；**迁址 Router** 仍须 **Runbook §7.1** 对齐 **`Escrow.platformFeeRecipient`** | ABI：`contracts/abi/FeeRouter.json` → `frontend/dapp/abis/FeeRouter.json`；**Escrow 接线（默认）**：`platformFeeRecipient` **=** FeeRouter 地址，与 **`FEE_ROUTER_ADDRESS`** / **`NEXT_PUBLIC_FEE_ROUTER_ADDRESS`** / Runbook §7.1 **同址**；**③** indexer-tick + DB 投影 + governance/admin 只读 API 已落地，见 **110 §3.1.1** |
| **RegionVault（Partial · MVP）** | 国家桶资金池 | **`forward(IERC20 token, address to, uint256 amount)`**（`onlyOwner`）：转出池内 ERC20；事件 **`RegionVaultForwarded`**；承接 **`FeeRouter`** 的 **`countryBucket`** 入账（**`Deploy.s.sol`** 已将该地址设为 Vault） | ABI：`contracts/abi/RegionVault.json` ↔ `frontend/dapp/abis`（**55-S13**）；**`GET /meta` → `chain.contracts.region_vault_address`**（**`REGION_VAULT_ADDRESS`**）；**indexer-tick** + DB **`region_vault_forwarded_events`** + **`GET /api/v1/governance/vault-forwards`** + admin **`GET /api/v1/admin/region-vault/forwarded-events`** + 前端 **`/governance/vault-forwards`**（**110 §3.1.1**）；**对账导出 / 逐国链上账本** 仍 **Target** |
| **CountryPoolLedgerV0（P5-1-A/C）** | 试点辖区 **J\*** 运营账本（与 **B-115/B-116** 正交） | **`credit`**、**`balance`/`totalCredited`/`version`**、**`CountryLedgerCredited`** | **`GET /api/v1/governance/country-ledger/{jurisdiction}`**（根级 **`rule_version`=`country_ledger_ssot_v0`**）；**`COUNTRY_POOL_LEDGER_ADDRESS`** + **`COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS`**；indexer **`p5_country_ledger_lines`**（**P5-1-B**）；**非** **B-110** **`governance/pool`** 根键 |
| **InvestorDistributionClaim（Partial · B-087）** | 份额应计分红 **领取** | **`registerAccrual` / `registerAccrualsBatch`**（`onlyOwner`）登记 **`distributionId` → token → holder → entitled`**；持有人 **`withdrawDividend` / `claim`** 单 tx 转出 **`≤ claimable`**；**领尽后再调 revert `NothingToClaim`**（双花失败；行为钉死） | ABI：`contracts/abi/InvestorDistributionClaim.json`；**`verify-abi-forge.py`** 与 **`sync-abi-from-forge`** 已纳入；测试 **`InvestorDistributionClaim.t.sol`**；**`Deploy.s.sol`** 部署；与链下 **B-086** **`investor_distribution_accruals`** 运营对齐须 Runbook/运维约定（**非**自动写链） |
| **GovernanceTimelock（B-089）** | 治理参数 **`execute`** **延迟壳** + **Governor 入队** | **`schedule`****（****`onlyAdmin`****）**；**`scheduleByGovernor`****（****`onlyGovernor`****）**；**`setGovernor`**；**`delay`** 后 **`execute(id)`** | ABI：`contracts/abi/GovernanceTimelock.json`；**`GovernanceTimelock.t.sol`** + **`TravelTrustGovernor.t.sol`**（**TT-COMP-B089-GOVERNOR-CHAIN-VOTING-001**） |
| **TravelTrustGovernor（Completion · B-089）** | **提案 / 投票 / quorum / threshold / Timelock queue** | **`propose`**（**`getPastVotes` 门槛**）；**`castVote`**；**`state`**；**`queue`****→****`scheduleByGovernor`**；**`execute`****→****`timelock.execute`**；事件 **`ProposalCreated`****/****`VoteCast`****/****`ProposalQueued`****/****`ProposalExecuted`****/****`ProposalCanceled`** | 源码 **`contracts/src/TravelTrustGovernor.sol`**；测试 **`contracts/test/TravelTrustGovernor.t.sol`** |
| **GovernanceVotesToken（Completion · B-089）** | **ERC20 权重 + 快照** | **`getPastVotes`****/****`getPastTotalSupply`**（checkpoint）；供 **Governor** **quorum** 与 **投票权重** | **`contracts/src/GovernanceVotesToken.sol`** |
| **GovernanceTreasury（Partial · B-090）** | 治理金库 **单笔 ERC20 支出** | **`spend(token,to,amount)`** **仅 `spender`**（宜 **Timelock**）；**`owner`** **`setSpender` / `transferOwnership`**；**`TreasurySpent`** | ABI：`contracts/abi/GovernanceTreasury.json`；测试 **`GovernanceTreasury.t.sol`**（**Timelock `execute` → `spend`**，收款余额 = **payload**）；**`Deploy.s.sol`** **`spender = GovernanceTimelock`**；**非** DB **`governance_pool`** |

#### 1.1.0a B-093 附录 · 剩余资金终态与「平台费腿」是否自动分拆（与 106/108 封口正交）

- **`refund()`**（**Funded → Refunded**，**仅游客**）：**不向** **`platformFeeRecipient`** **转出**；**全额** **`totalAmount` → `traveler`**。索引/对账上**不得**与 **`Released` / `PartialRefundExecuted` / `SlashedExecuted`** 的「平台费腿」混算。
- **争议路径 `executeResolution`**：**`platformFee`** 为**调用方传入**三腿之一（**B-094** 守恒 **`guideAmount + travelerRefund + platformFee == totalAmount`**）；**非** **`release`** 式按 **`platformFeeBps`** 的 floor 自动分拆。
- **已封口（本附录不重述实现细节）**：**`release`**（Completed）、**`releasePartialRefund`**（106）、**`releaseSlashed`**（108）——链上自动分拆/余款归 **`platformFeeRecipient`** 的口径以表内 Escrow 行与 Foundry **`Escrow.t.sol`** 用例为准。

#### 1.1.0 B-098 统一单一链上权重公式 f(·)（TT-115）

- **定义（链上 SSOT）**：对钱包地址 **wallet** 与快照块高 **B**（`uint256`，十进制），**f(wallet, B)** 为 **`GovernanceVotesToken.getPastVotes(wallet, B)`** 的返回值（**uint256**）。这是 **TravelTrustGovernor** 在提案快照 **B** 上计票所用的**唯一**链上标量权重；**不**在合约内把 **`IdentityStakingPool`** **`stakeOf`** 或 **Country Pool ERC20.balanceOf** 再组合进该函数——若产品要把质押/份额映射到票权，须通过**链下/运营**向 **TTGV** 转账或铸币等路径反映到 **checkpoint** 后，**f** 仍只读 **`getPastVotes`**。
- **API 对齐**：**`GET /api/v1/governance/voting-power?snapshot_block=B`** 返回 **`on_chain_vote_weight.votes_u256_dec`**（十进制字符串）与根级 **`unified_on_chain_vote_weight_u256_dec`**，调用与 **`GET /api/v1/governance/proposals/:proposal_id`** 中 **`voting_power_at_snapshot`** 使用的 **`eth_call`**（**`getPastVotes(address,uint256)`**）一致；**`reconcile.mvp_numeric_equal_to_chain_votes`** 将 **f** 与 **B-092** **`delegation_units_v1`** 的 **`total_weight_units`** 做整数对拍（常为 **false**，因二者刻度/语义不同，直至部署 1:1 映射）。
- **链下信号票**：**`POST …/governance/proposals/:id/vote`**（MVP）计票仍以 **`delegation_units_v1`** 为准；**B-098** **不重做** **105/110** 质押与份额快照字段，仅与之并列只读。

#### 1.1.0b B-110 · `governance/pool` 主字段链上锚点（与 04 互指）

**单源叙述**：[04-后端与API.md §3.4](04-后端与API.md) 大表 **`GET /api/v1/governance/pool`** 行及表后 **B-110** 小节之 **B110-SSOT-01** 分段；本节为 **合约侧锚点锁定**，**不**新增 ABI；**HTTP 根级键**（含 **`country_pool*`**、**`treasury_pool*`**（Wei）、**`treasury_erc20_pool*`**）以 **04 §3.4 该路由行** 为 SSOT。

| 拟定主字段（API 层名） | 合约模块 | 地址来源（env / meta） | 资产口径（只读） | 与 **84** 叙事 | 与 **110** 叙事 |
|------------------------|----------|------------------------|------------------|----------------|-----------------|
| **`pool_balance`**（未来 SSOT 目标，≠ 当前 DB 列直至切换） | **FeeRouter** | **`FEE_ROUTER_ADDRESS`**（与 **`Escrow.platformFeeRecipient`**、Runbook §7.1 **同址**） | **ERC20** **`balanceOf(FeeRouter)`**，代币 = **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** | 可分配平台费 **入 Router**、**`distribute`** 前 **ERC20 滞留** | **`PlatformFeeRouted`** / **`fee_router_routed_events`** = **流出投影**，与 **`balanceOf`** **对账并列** |
| **`treasury_pool`** | **GovernanceTreasury** | **`GOVERNANCE_TREASURY_ADDRESS`**（与 **Deploy.s.sol**、上表 **GovernanceTreasury** 行、**B-090** 一致） | **原生** **`eth_getBalance(GovernanceTreasury)`**（**Wei** hex，与 **`ssot_read_governance_treasury_native_balance_wei_hex`** 同源）；**金库 ERC20** 见下行 **`treasury_erc20_pool*`**（**不得**复用本键）；**根级链上主读** 由 **`GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT`**（**`1`/`true`/`on`/`yes`**）独立控制；成功体 **`treasury_pool`**（Wei hex）+ **`treasury_pool_data_source`=`chain_read`** + **`treasury_pool_is_chain_ssot`: true**（与 **`pool_balance`** 根级 **`data_source`/`is_chain_ssot`** 及 **`country_pool*`** **解耦**，见 **04**） | **Timelock → `spend`** 治理金库，**非** FeeRouter 分账 | 当前 **无** Treasury 专用索引表；**B-084 Σ** **非** **`eth_getBalance`** SSOT；**实现** **TT-SSOT-SWITCH-APPLY-002** |
| **`treasury_erc20_pool`** | **GovernanceTreasury** | **`GOVERNANCE_TREASURY_ADDRESS`** + **代币** **`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**（**独立**于 **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**；须 **分键**） | **ERC20** **`balanceOf(GovernanceTreasury)`**（u256 hex；规划 **`ssot_read_governance_treasury_erc20_balance_hex`**）；**根级链上主读** 由 **`GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT`**（**`1`/`true`/`on`/`yes`**）独立控制；成功体 **`treasury_erc20_pool`** + **`treasury_erc20_pool_data_source`=`chain_read`** + **`treasury_erc20_pool_is_chain_ssot`: true**（与 **`treasury_pool*`（Wei）**、**`pool_balance`**、**`country_pool*`** **解耦**；**契约 Step 1** **04/14**，**handler** 待 **TT-SSOT-SWITCH-APPLY-003**） | 金库 **ERC20** 滞留展示，**正交**于 **FeeRouter** 分账 | **B-084 Σ** **非** 本 **`balanceOf`** SSOT |
| **`country_pool`** | **RegionVault** | **`REGION_VAULT_ADDRESS`** | **ERC20** **`balanceOf(RegionVault)`**，代币 = **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**（与国桶结算币一致）；**根级链上主读** 由 **`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`**（**`1`/`true`/`on`/`yes`**）独立控制；成功体 **`country_pool`**（u256 hex）+ **`country_pool_data_source`=`chain_read`** + **`country_pool_is_chain_ssot`: true**（与 **`pool_balance`** 根级 **`data_source`/`is_chain_ssot`** **解耦**，见 **04**） | **`countryBucket`** → Vault（**83/84** 国家桶路径） | **`RegionVaultForwarded`** / **`region_vault_forwarded_events`** + **B-084 Σ** = **投影/累计**，**非** **`balanceOf` 瞬时** SSOT；**实现** **TT-SSOT-SWITCH-APPLY-001** |

**禁止**：以 **同一读数** 填充 **`pool_balance` 与 `treasury_pool` / `treasury_erc20_pool` / `country_pool`**；以 **`fee-pool-aggregates` 投影 Σ** 直接冒充 **`GovernanceTreasury` 的 `eth_getBalance`/`balanceOf` 或 `RegionVault` 的 `balanceOf` 真值**（除非产品另签章改叙事）。

**B110-SSOT-06 · 主字段链上 SSOT 切换与一键回滚（与 [04 §3.4](04-后端与API.md) 同小节互指；不新增 ABI）**：**切换**以本表 **各锚点独立**、RPC 与 env 可稳定只读为前提。**`pool_balance`**：**`data_source`/`is_chain_ssot`** 与 **`GOVERNANCE_POOL_BALANCE_CHAIN_SSOT`**（见 **04**）。**`country_pool`**：**`country_pool_data_source`/`country_pool_is_chain_ssot`** 与 **`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`**（见 **04**；**与根级 `data_source` 解耦**）。**`treasury_pool`**：**`treasury_pool_data_source`/`treasury_pool_is_chain_ssot`** 与 **`GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT`**（见 **04**；**与根级 `data_source` 解耦**）。**`treasury_erc20_pool`**：**`treasury_erc20_pool_data_source`/`treasury_erc20_pool_is_chain_ssot`** 与 **`GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT`** + **`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**（见 **04**；**与 `treasury_pool*`（Wei）解耦**；**handler** 待 **TT-SSOT-SWITCH-APPLY-003**）。**回滚**（运维**一键**）：关对应闸后进程重载环境变量；**禁止**用 **`0`** 或无 RPC 支撑值冒充 **`balanceOf`/`eth_getBalance` 真值**。**`PlatformFeeRouted` / `RegionVaultForwarded`** 及 **B-084 Σ** **仅** reconcile / 解释，**不**升格 **FeeRouter / RegionVault / GovernanceTreasury 瞬时余额 SSOT**。

**B110-SSOT-07 · Σ 投影 vs 瞬时余额（与 [04 §3.4](04-后端与API.md) `governance/pool` 设计小节之 B110-SSOT-07 互指；不新增 ABI）**：投影 **Σ** = 已索引事件的 **累计路由/转出** 口径；**`balanceOf`/`eth_getBalance`** = 合约 **瞬时** 余额。**`fee-pool-aggregates`** 等 **仍非** **`pool_balance` / `country_pool` / `treasury_pool` / `treasury_erc20_pool`** 主展示来源，**仅** reconcile/explain。**链上读失败** 时 **`GET …/governance/pool`** 须按 **04** **`governance/pool` 行** 回退 **`pool_balance`**、**`country_pool`**、**`treasury_pool`**、**`treasury_erc20_pool`** 各自路径，**禁止**用 **Σ** 或 **`0`** 冒充。**累计 ≠ 瞬时** 的常见原因：未索引转账、reorg/补索引滞后、事件口径不包含全部余额变动；对读时**不得**将 **B-084 Σ** 与 **`balanceOf`/`eth_getBalance`** 混名。

### 1.1.1 目标态模块（FeeRouter / RegionVault · Partial MVP 已落地；余项 Target）

**FeeRouter**、**RegionVault（MVP）** 已实现于 `contracts/src` 并导出 ABI（见 **§1.1** 与下表）。**B-116-1～3**（与 **[07 §五 5.2A](07-开发流程与顺序.md)** 叙事一致）已闭合：**`PlatformFeeRouted` / `RegionVaultForwarded`** 经 **`internal/indexer-tick`** 写入 **`fee_router_routed_events` / `region_vault_forwarded_events`**（**`crates/api/src/db/fee_router_events.rs`**、**`region_vault_events.rs`**、**`chain/indexer.rs`**）；**reorg / `event_log` 链域回滚** 对上述两表 **删尾**（**`crates/api/src/db/event_log.rs`**、**`routes/internal.rs`**）；对外只读 **`GET …/governance/fee-routes`**、**`…/vault-forwards`**、**`…/fee-pool-aggregates`**（**`routes/governance.rs`**、**`db/economic_aggregate.rs`**）及 admin 同源列表。**按国链上账本、Snapshot/Claim、RegionVault 专项对账导出** 仍 **Target**（与 **83/84**、母表 **B-115**、**110** §3.1.1 末列一致）。规格单源见 **[83](83-区域治理与收益分配-协议白皮书.md)**、**[84](84-第一阶段10国Country-Pool发行参数总表.md)**（**84 §1.1.1** 分母与正交）、**[Runbook](../../ops/RUNBOOK.md) §7.1**、**[08-4-附录-收益流闭环图-FeeRouter-Target](08-4-附录-收益流闭环图-FeeRouter-Target.md)**。**禁止**将经济池与用户 **Escrow** 托管余额混同一 `transfer` 路径（与 [governance-token/02-对内技术规格-草案](governance-token/02-对内技术规格-草案.md) §4.1 一致）。**ABI·路由机读**（**55-S13**、**04 §3.4** 四步检查；默认 **`cargo test -p traveltrust-api`**）：与 **[15 附录〇](15-多维度文档与技术检查报告.md#发版前勾选总表)** 机器预检段、根 **`pre-release-automation`** 同批复核。**测试与留痕索引**见本节 **落地 checklist** 与 **[evidence/README · B-116](../../evidence/README.md#b116-feerouter-regionvault-evidence)**。

| 模块（工作名） | 状态（摘要） | 与现行 Escrow/身份质押 关系 |
|----------------|--------------|------------------------------|
| **FeeRouter** | **Partial（MVP）**：`distribute` + **`PlatformFeeRouted`** + **B-091** `distributePaused`；**`setRoutingConfig`**（BPS 与 83/84 叙事对齐） | 与 **Escrow** `platformFeeRecipient` 接线；**按国链上再分** 不在 Router 内，见 **RegionVault** |
| **RegionVault** | **Partial（MVP）**：`forward` + **`RegionVaultForwarded`**；`Deploy.s.sol` 将 **FeeRouter `countryBucket`** 设为 Vault 地址；索引与 **B-116-2/3** 只读 API 已落地 | 资金池与 Escrow 隔离；承接 **FeeRouter** 国家桶入账；**逐国链上再分 / Snapshot / 专项对账导出** 仍 Target |
| **InvestorDistributionClaim** | **Partial（B-087）**：`withdrawDividend` / `claim` + 运营登记 accrual；Foundry 双花用例 | 与 **RegionVault** 国家桶 Snapshot/Claim **Target** 正交；对齐 **B-086** 分录由 **`onlyOwner`** 上链登记 |
| **GovernanceTimelock** | **B-089**：`schedule` / **`scheduleByGovernor`** / `execute` + **COMP-B089 FeeRouter** + **COMP-B089-Governor queue** | 与 **TravelTrustGovernor** 衔接 |
| **TravelTrustGovernor** | **B-089 Completion**：链上投票生命周期 + **indexer-tick** → **`governance_proposals_projection`** | 见 **04** **`GET …/governance/proposals`** |
| **GovernanceTreasury** | **Partial（B-090）**：**`spend`** + Timelock E2E；**payload** 链上钉死 | **非** 链下提案 API 拨款；**ETH 原生支出** 为 **Target**（可扩展 **`receive` + `spendETH`**） |
| **协议紧急开关（B-091）** | **Partial**：**`EscrowFactory.factoryPaused`** + **`FeeRouter.distributePaused`**；Foundry **`Escrow.t.sol`** / **`FeeRouter.t.sol`** | **`GET /meta.pause`** 与链上读数 **运维对齐** 为 **Target**；**guardian** 宜最终接 **Timelock/多签** |
| **Governance token / TTG 激励（若启用）** | **Target** | 与 83 Global slice 等叙事对齐；**独立**于向导 **身份质押**（**`IdentityStakingPool` 系**；**旧** **`Staking.sol` 已移除**；[81](81-经济模型-向导质押与订单押金.md)） |

**落地 checklist（FeeRouter / RegionVault / 110 · B-116-1～3 与实现对齐）**：① ~~Solidity **`contracts/src/FeeRouter.sol`（MVP）~~；**`forge test`** **`contracts/test/FeeRouter.t.sol`** ② ~~Foundry `FeeRouter.t.sol`~~ ③ **Partial（已落地）**：**`POST …/internal/indexer-tick`** + **`fee_router_routed_events`**（**`crates/api/src/db/fee_router_events.rs`**，`delete_fee_router_routed_events_from_block` = reorg 同源）；**`GET /meta` → `fee_router_address`**；**`GET …/governance/fee-routes`**、**`GET …/admin/fee-router/routed-events`**；**`cargo test -p traveltrust-api`** **`fee_router_events::tests`**、**`governance`** 内 **B-116-3-1** 用例；**[110 §3.1.1](110-阶段开发链上索引器与事件同步器.md)** ④ **Partial（已落地）**：**`contracts/src/RegionVault.sol`** + **`contracts/test/RegionVault.t.sol`** + **`contracts/abi/RegionVault.json`** ↔ **`frontend/dapp/abis`** + **55-S13**；**~~Deploy：`countryBucket` → Vault~~**（`contracts/script/Deploy.s.sol`）⑤ **Partial（已落地）**：**`RegionVaultForwarded`** → **`region_vault_forwarded_events`**（**`crates/api/src/db/region_vault_events.rs`**）；**`event_log` 链域回滚** 计数/删尾含该表（**`crates/api/src/db/event_log.rs`**）；**`GET …/governance/vault-forwards`**、前端 **`/governance/vault-forwards`**、admin **`…/region-vault/forwarded-events`**；**`cargo test -p traveltrust-api`** **`region_vault_events::tests`**、**`governance`** 内 **B-116-3-2**、**`chain_off::tests_events_itinerary`**；**残余 Target**：**逐国账本 / Vault 专项对账导出**（**83/84**、**B-115**）⑥ **Partial（已落地 · B-116-3-3）**：**`GET …/governance/fee-pool-aggregates`**（**`db/economic_aggregate.rs`** + **`routes/governance.rs`** **`build_fee_pool_aggregate_body`**）；**`cargo test -p traveltrust-api`** **`b116_3_3_fee_pool_aggregate_projection_shape_and_no_pool_root_keys`** 等 ⑦ [02-架构设计](02-架构设计.md) **§十**（若需图示）⑧ CI：`contract-abi-gate`、`check-governance-doc-linkage.sh` ⑨ [07 §二 2.4](07-开发流程与顺序.md) 若动经济百分数。**evidence / 运维快照**：[**evidence/README · B-116**](../../evidence/README.md#b116-feerouter-regionvault-evidence)（**`evidence/GO_YYYYMMDD/`** 约定、**`write-indexer-evidence`** / **`internal-indexer-ops evidence-bundle`** 与 **110 §3.1.2** 互指）；**B-116-P4 同锚索引**：[**`evidence/GO_B116_P4.md`**](../../evidence/GO_B116_P4.md)（**`TT-DOC-B116-P4-ANCHOR-001`** · 14/110/Runbook/**`indexer-reconcile-gate`** 可复核入口）。

### 1.2 ABI 放置与引用约定

| 位置 | 说明 | 对齐规则 |
|------|------|----------|
| **contracts/abi/** | 合约编译产出的 ABI JSON（Escrow、**GuideIdentityStakingPool**、**ProviderIdentityStakingPool**、Registry 等）**单源存放** | 实现时：Solidity 编译后把各合约 ABI 放入此目录；命名与合约名一致（**无旧 `Staking.json` 别名**）；例如 `Escrow.json`、`GuideIdentityStakingPool.json`、`ProviderIdentityStakingPool.json`、`Registry.json` |
| **frontend** | 前端需用 ABI 调用 viem readContract/writeContract/signTypedData | **单源**：`contracts/abi/`；部署前同步至 **frontend/dapp/abis/**。**Guide/Provider 质押 JSON / Registry** 须**字节一致**（**`bash scripts/check-55-s13.sh`**，实现 **`scripts/gates/check-55-s13.sh`**）。**Escrow**：canonical 全量在 `contracts/abi/Escrow.json`；`frontend/dapp/abis/Escrow.json` 可为精简 ABI，须与调用一致且含 **openDispute** 等（门禁同脚本）。`frontend/lib/stakingAbi.ts`、`registryAbi.ts` 为 viem `as const` 镜像，改接口须同步 JSON 与 TS |
| **后端（crates/api 或链客户端）** | 链下读链、对账、执行器调合约 | 若用 Rust 与链交互（alloy 等），ABI 或等效接口定义须与 contracts/abi 一致（可脚本从 JSON 生成 Rust 绑定） |

**当前仓库实况（2026-04；§1.1.1 checklist 同批对读）**：

- `contracts/src/` 已实现 `Escrow.sol`、`EscrowFactory.sol`、**`GuideIdentityStakingPool.sol`** / **`ProviderIdentityStakingPool.sol`**（继承 **`IdentityStakingPool`** / **`StakeAccountingLib`**）、**`Registry.sol`**、**`FeeRouter.sol`**（经济路由 **Partial**）、**`RegionVault.sol`**（国家桶池 **Partial · MVP**）、**`SlashRouter.sol`**、**`ReserveVault.sol`**、**`InvestorDistributionClaim.sol`**（份额分红领取 **Partial · B-087**）、**`GovernanceTimelock.sol`**（**B-089**）、**`TravelTrustGovernor.sol`**、**`GovernanceVotesToken.sol`**、**`GovernanceTreasury.sol`**（治理金库支出 **Partial · B-090**）、**`RouterTreasuryGovernancePayload.sol`** 等（**完备度**以 **04 / 110 / Runbook** 各节 **Partial vs Target** 标注为准；ABI 入仓策略见下条）。
- `contracts/abi/` 已入仓：`Escrow.json`、`EscrowFactory.json`、**`GuideIdentityStakingPool.json`**、**`ProviderIdentityStakingPool.json`**、**`Registry.json`**、**`FeeRouter.json`**、**`RegionVault.json`**、**`SlashRouter.json`**、**`ReserveVault.json`**、**`InvestorDistributionClaim.json`**、**`CountryPoolLedgerV0.json`**、**`RegionDistributionClaim.json`**、**`GovernanceTimelock.json`**、**`GovernanceTreasury.json`**、**`GovernanceVotesToken.json`**、**`TravelTrustGovernor.json`**、**`IERC20.json`**、**`MockERC20.json`**（与 **`scripts/dev/sync-abi-from-forge.sh`** / **`verify-abi-forge.py`** 子集一致）。**`SlashRouter`/`ReserveVault`**：**canonical** **仅** **`contracts/abi/`**；**`bash scripts/check-55-s13.sh`** **当前** **不要求** **复制** **到** **`frontend/dapp/abis`**（DApp **未** **直连** **两** **合约** **读** **写** **时** **保持** **此** **策略** **，** **避免** **双** **目录** **漂移** **）。**`GovernanceVotesToken`/`TravelTrustGovernor`**：**同** **上** **（** **治理** **UI** **以** **API/** **`GET /meta`** **为主** **）** **。**
- `frontend/dapp/abis/`：**GuideIdentityStakingPool.json**、**ProviderIdentityStakingPool.json**、**Registry.json**、**EscrowFactory.json**、**FeeRouter.json**、**RegionVault.json** 与 `contracts/abi/` **字节一致**（**`bash scripts/check-55-s13.sh`**）；**Escrow.json** 可为精简 ABI，须含 `openDispute` 等与 DApp 调用一致；canonical 全量见 `contracts/abi/Escrow.json`（含 **DisputeOpened** 等事件，供 Indexer/文档单源）。质押/资格页 ABI 常量见 `frontend/lib/stakingAbi.ts`（**`identityStakingPoolAbi`**）、`registryAbi.ts`。

**对齐检查**：合约接口变更 → 重新编译 → 更新 contracts/abi/*.json → 同步到 frontend/dapp/abis（或引用）→ 后端若用 ABI 同步更新；发版前核对 ABI 与部署合约版本一致。

**有序清单与门禁（运维 / PR）**：[ops/RUNBOOK.md §12.4](../../ops/RUNBOOK.md)（**sync-abi-from-forge** → **`frontend/dapp/abis`** → **`bash scripts/check-55-s13.sh`** → **Contract ABI Gate**；与上表一致）。

### 1.3 链上事件与 04/前端展示对齐

| 事件 | 01/02 约定 | 后端（Indexer/Projection） | 前端 |
|------|------------|----------------------------|------|
| EscrowCreated | 订单↔escrow 一一对应 | 写 event 表 + 投影 orders.chain_state | 仅通过 API 读订单状态，不直接读链展示资金态 |
| **Deposited** | 用户经 `deposit()` 已付代币进托管；01 §5/§10 产品口语 **Paid** 与此事件对应 | 驱动订单 Escrowed 等资金态 | 已支付仅来自 API/对账结果（01 §7 UI 事实） |
| Released | 托管释放至向导（及平台费拆分） | **Escrowed→Completed**；若订单已因链下 **confirm-completion** 为 **Completed**，链上 Released **幂等**（刷新投影时间戳等，与 `crates/api` `project_chain_event_onto_order` 一致） | 终态以 API 为准 |
| Refunded | 退款完成 | **Escrowed→Refunded**（合约 Funded 即可 `refund()`）及争议路径下 Refunded；投影以链为准 | 终态以 API 为准 |
| DisputeOpened | 争议已上链 | 驱动 Disputed、冻结放款 | 争议状态以 API 为准 |
| ResolutionExecuted | 裁决已执行 | 驱动 Refunded/Slashed/Completed | 终态以 API 为准 |
| **PlatformFeeRouted**（**FeeRouter**） | 可分配平台费按 83/84 BPS 拆至四方 | **`internal/indexer-tick`**：`FEE_ROUTER_ADDRESS` 时合并拉取；有 **PostgreSQL** 时首见写入 **`fee_router_routed_events`**（幂等键 chain+block+logIndex）；**非**订单状态机 | 对外只读 **`GET /api/v1/governance/fee-routes`**（04 §3.4）；与 **84 文档镜像**（protocol-reference）互补 |
| **RegionVaultForwarded**（**RegionVault**） | 国家桶池 **`forward`** 转出 | **`internal/indexer-tick`**：**`REGION_VAULT_ADDRESS`** 时合并拉取；有 **PostgreSQL** 时写入 **`region_vault_forwarded_events`**（幂等键 chain+block+logIndex）；**非**订单状态机 | 对外只读 **`GET /api/v1/governance/vault-forwards`**（04 §3.4）；前端 **`/governance/vault-forwards`**；admin 见 **`GET /api/v1/admin/region-vault/forwarded-events`** |

**`/escrow/:id` 页面结构（Next 15 App Router）**：`frontend/app/escrow/[id]/page.tsx` 挂载 **`EscrowDetailSection.tsx`**（Client 壳与动态导入边界），订单/Escrow 协议区与链上动作块位于 **`frontend/components/escrow/EscrowDetail/`**；与 [04 §3.4](04-后端与API.md) 前端路由表 **`/escrow/:id`** 行一致。

**53 阶段评分后释放**：评分双方确认后，链上 **release** 触发方式与 [01-总库总览](01-总库总览.md) §5、[02-架构设计](02-架构设计.md) §七 一致：由**前端**用户签 `Escrow.release()` 或由**后端执行器**代发；ABI 见 **contracts/abi/Escrow.json**。与 [53-阶段开发技术文档](53-阶段开发技术文档.md) §3.8、§3.9 B5 对齐。

---

## 2. API 路由与前后端对齐

### 2.1 权威源：04 §三 与 crates/api 实际路由

以下表与 [04-后端与API](04-后端与API.md) §三、**§3.4 API 总览（v1 完整清单）** 一致；**crates/api** 已按此表挂载路由（占位或实现）。前端调用 API 时路径须与本表一致；新功能与请求/响应约定见 04 §3.4。**55 阶段 API 收口**：反馈 API（GET|POST /api/v1/community/feedback；**GET** `items[].media_urls`、**POST** 可选 `media_urls` 数组，与 04 §3.4）、订单与自由市场列表（**GET discover/orders**，主 UI **`/market`**）字段与 order_id 去重（55-S12）、**两列表可选 limit/cursor + page**（与 `crates/api/src/chain_off/pagination.rs` 一致，契约见 04 §3.4）、前端幂等键（55-S11）已与 04 §3.4 一致，详见 [55-阶段-数据同步与数据库功能同步](55-阶段-数据同步与数据库功能同步.md) §八附续。**56 阶段 API 对齐**：`GET /api/v1/orders`、`GET /api/v1/orders/:id`、`GET /api/v1/discover/orders` 响应 item/order 含 **image**（**ItineraryBundle.cover_image** 优先，否则与 hydrate 一致按日行图文推导）；`GET /api/v1/orders` 与 `GET /api/v1/discover/orders` 的 item 另含 **escrow_address**（与详情同源）；**53-S7 / Escrow 行程展示**：`GET /api/v1/orders/:id` 的 **order** 含 **escrow_address**（P18 已写入则非空，否则 null）；存在行程 bundle 时 **order** 另含 **destination、city、travel_date、days**（与列表项一致，见 04 §3.4）；**itinerary**（daily_itinerary、amount_breakdown、snapshot_hash）**凡有 bundle 即返回**（Accepted/Escrowed 等，只读），非仅 Draft；`POST /api/v1/itineraries/custom` 请求体扩展（day_plans 含 name+image、guide_day_plans 含 attraction_image/food_image；**顶层 image** 并入首日 `content_images` 以利 hydrate 封面），与 04 §3.4 一致；**56 阶段无 ABI 变更**。详见 [56-阶段-问题与优化项开发文档](56-阶段-问题与优化项开发文档.md) §六。

**路由域与代码 SSOT（2026-04-19）**：`crates/api/src/routes/mod.rs` 中 `api_router()` 依次 **`merge` 共 20 次**（与源码链**同序**）：`health_meta`（含根路径 `/health`、`/meta`、`/metrics`）、`auth`、`admin`、`me`、`guides`、`orders`、`traveltrust_page`、`itineraries`、`discover`、`messages`、`disputes`、`evidence`、`media`、`intents`、`community`、`country_ledger_jurisdiction`、`did_rank`、`governance`、**`trust_growth`**、`internal`。与 04 §3.4 路径一致性及 **04/13-1** 前端 IA 机读可跑 `./scripts/run-check-04-routes.sh`（**API 主表** + **`frontend/app`** + **13-1 表 1 ⊆ 04 前端路径表**；**`pre-release-automation`** 亦串联同源四步，见 **[scripts/README](../../scripts/README.md)** §三）；日常 PR 说明见根目录 **[CONTRIBUTING.md](../../CONTRIBUTING.md)**「路由与契约」。`contracts/abi` 与 `frontend/dapp/abis` 关键 ABI 可跑 `./scripts/check-55-s13.sh`（有 Foundry 时另见 `scripts/run-verify-abi-forge.sh`）。

**运维 JSON 快照（evidence · 非 §2.1 表内 HTTP 路径）**：**`scripts/indexer-public-snapshot.sh`**（Windows 委托 **`indexer-public-snapshot.ps1`**）**stdout** 为 **`traveltrust.ops_artifact.v1`**（**`payload`** 内合并 **`GET /health`**、**`GET /meta`** 与可选 **`ADMIN_BEARER_TOKEN`** / **`INTERNAL_API_SECRET`** 段；admin/internal 索引器探针与 **04 §3.4** **`internal`/`admin`** 表一致）；**`payload.snapshot_provenance`**（**`script_semver` `1.4.0`** 等）须与 **`GET …/internal/indexer-status`** 等响应 **对读**。**L2 键与段落 SSOT** 见 **[04 §3.4](04-后端与API.md)** 读前摘要「索引器运维 JSON 快照」及 **`internal` API 总述**「运维 JSON 快照」；**流程、脚本矩阵与 CI 锚点** 见 **[110 §3.1.2](110-阶段开发链上索引器与事件同步器.md)**、**[Runbook §2.55](../../ops/RUNBOOK.md)**、**[evidence/README](../../evidence/README.md)**、**`indexer-reconcile-gate`**；**07 §六 6.4** 工程台账。**勿**将合并文件误当作 **§2.1** 表内独立 REST 资源；变更形状时 **04**/**110**/**gate**/**07** 同批。

**前端顶栏与五主路由（2026-05-25 · ① UI 壳冻结）**：**[FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** · **`Header.tsx`** L0 分层（**86 §6.0**）；**`<nav>`** **`/`** · **`/market`** · **`/did-rank`** · **`/community`**；**TravelTrust** 字标 → **`/traveltrust`**（**layout lock** `hero→roles→…`，**无** `#overview` 四卡）；**`/pay`** 仅用户菜单。**`GET /api/v1/discover/orders`** 列表主消费页 **`/market`**。

**Admin 审批（360，基线）**：**`GET|GET :id|POST …/approve`** 成功响应含 **`meta.build`**（与 **`GET /meta.build`** 同源）；列表无 DB 时顶层 **`note`** 与 **`meta.note`**（`admin_approvals_no_db`）并存，契约见 **`04 §3.5`**。

**Admin 核心只读（70 / 110 / 120 基线）**：**`GET …/users*`**、**`…/guides*`**、**`…/orders*`**、**`…/disputes*`**、**`…/reviews*`**（详情在 **`meta.source`** 外含 **`build`**）、**`…/fee-router/routed-events`**、**`…/audit-logs*`**（无 DB 时 **`meta.note`** 与顶层 **`note`** 并存）、**`…/audit/operations`**、**`…/alerts/incidents/:id`**、**`…/indexer/health`**、**`…/indexer/reconcile-reports`**、**`…/indexer/reconcile-reports/export`**、**`…/indexer/reconcile-report/:id`**（**`200`** 成功体；**`export`**：**`format=csv`** 附件无顶层 JSON **`meta.build`**；**`format=json`** 附件含 **`meta.build`** 与 **`reports[]`**；**csv/json** **`200`** **`x-traveltrust-reconcile-export-sha256`**/**`export_scope`**/**`truncated`**），**`POST …/users/:id/role-change-request`** 成功体均含 **`meta.build`**（与 **`GET /meta.build`** 同源）；见 **`04 §3.5`** 表前总述。

**160 社区治理路由（Implemented（最小基线））**：`POST /api/v1/community/reports`、`GET /api/v1/community/me/reports`、`GET /api/v1/community/reports/:id`、`POST /api/v1/community/reports/:id/appeals`、`GET /api/v1/admin/community/reports`、**`GET /api/v1/admin/community/appeals`**（**`community_report_appeals`** 台账）、`PATCH /api/v1/admin/community/moderation/:id`（同事务 **`community_moderation_cases`**；可选 **`record_penalty`** 再落 `community_penalties`）、`GET /api/v1/admin/community/moderation/cases`、`POST /api/v1/admin/community/appeals/:id/review`、`GET /api/v1/admin/community/ranking/snapshots`、`GET|POST /api/v1/admin/community/penalties`、**`PATCH /api/v1/admin/community/comments/:id`**（**`visibility_status`**）、**`GET /api/v1/admin/community/risk-signals`**、**`GET /api/v1/admin/community/policy-change-logs`**、**`PATCH /api/v1/admin/community/abuse-policy`**（**super_admin**，同事务 **`community_policy_change_logs`**）已挂载；**Admin 只读 GET** 的多条件 **query**、**`applied_filters`** 与先于 DB 的 **`400`** 键以 **`04 §3.4`** 为准。**`GET /api/v1/community/posts/:id/comments`** 内嵌 **`visibility_status` / `body_is_redacted` / `risk_level`**（见 `04`）；**`POST /api/v1/community/posts`**、**`POST /api/v1/community/posts/:id/comments`**、**`POST /api/v1/community/reports`** 在 **`community_abuse_policy`** 阈值下可能返回 **HTTP 429**（`post_*` / `comment_*` / `report_*` 机器键，见 **`04 §3.4`**），并 **best-effort** 写入 **`community_risk_signals`**；内网 **`POST /api/v1/internal/community/ranking/snapshot`** 写入 **`community_ranking_snapshots`**（与 `04` 内部 API 段一致）；**用户侧** 生效 **`mute|ban|shadow_ban`** 时拦截发帖/评论/DM/点赞/收藏/关注/好友写（**`community_penalty_active`**，见 `04`）；**`limit_feed`** 从 Feed 与**非作者**帖详情/用户帖列表隐藏。契约与 RBAC 见 **`04 §3.4` / `04 §3.5`** 与 **`160`**；申诉行表为 `community_report_appeals`，审计行为 `community_moderation_cases`，处罚表为 `community_penalties`，评论治理字段见 **`community_comments`**，风险信号与策略审计见 **`community_risk_signals` / `community_policy_change_logs`**。

| 方法 | 路径 | 说明 | 前端落点（建议） |
|------|------|------|------------------|
| GET | /health | 健康检查 | 可选探活 |
| GET | /meta | 版本与 SSOT 绑定（05 §七点六）；**`build`**（`git_sha`、`deployed_at`、`rule`，120/140）；含 **`rate_limits`**（与 middleware 同源）、**`chain.chain_id`**、**`chain.contracts`**（ChainConfig 部署地址快照） | 启动时校验、fail-closed；运维与前端环境对齐 |
| POST | /auth/register | 邮箱注册 | lib/auth 或页面 |
| POST | /auth/login | 登录 | lib/auth |
| POST | /auth/logout | 登出 | lib/auth |
| POST | /auth/refresh | 刷新 token | lib/auth |
| POST | /auth/verify-email | 邮箱验证 | lib/auth |
| POST | /auth/forgot-password | 忘记密码 | lib/auth |
| POST | /auth/reset-password | 重置密码 | lib/auth |
| GET | /api/v1/me | 当前用户 + 统计 + **`trust`**（**`kyc_status` / `wallet_linked` / `guide_registration_status` / `identity_status` / `risk_level` / `risk_basis` / `risk_reason_codes` / `recommended_actions` / `rule`**；**`reputation`** 含 **`as_reviewer`** + 向导 **`as_guide`**，**04 §3.4**） | lib/me |
| PUT | /api/v1/me | 更新资料 | lib/me |
| GET | /api/v1/me/stats | 统计摘要（可选） | lib/me |
| PUT | /api/v1/me/password | 修改密码 | lib/me |
| GET | /api/v1/guides | 向导列表 | lib/guides |
| GET | /api/v1/guides/:id | 向导详情（含 DID 字段，不含 passport_number_hash） | lib/guides |
| POST | /api/v1/guides | 向导注册（body 含 DID：wallet_address、real_name、passport_number、id_photo_url、language_cert_url 等） | lib/guides（postGuide） |
| POST | /api/v1/guides/upload-doc | 证件/证明上传（content_base64，返回 url） | lib/api guideUploadDoc |
| GET | /api/v1/uploads/guides/:name | 公开材料白名单静态资源（受限对象默认私有） | 白名单直链或受控读取 |
| POST | /api/v1/guides/:id/stake | 质押 | lib/guides + dapp 签质押 |
| POST | /api/v1/orders | 下单 | lib/orders |
| GET | /api/v1/orders | 我的订单列表；query: **limit?**, **cursor?**（**55-S12**，**page** 等见 04 §3.4）；item：**image**、**escrow_address** | lib/orders |
| GET | /api/v1/orders/:id | 订单详情（**order** 含 **escrow_address**；**有值时** **`chain_id`**（110 §3.1.4）；有 bundle 时 order 另含 destination/city/travel_date/days/**image?**（与列表同源）；**itinerary 凡有 bundle 即返回**（各状态只读）；**`order.split_addresses_ssot`**：**B-095** 与 **`ChainConfig` + `guides.wallet_address`** 同源，**`platform_fee_recipient`** 与 **`GET /meta` `escrow_platform_fee_recipient`** 同源；可选 payment_deadline、chat_confirm_deadline、rating_deadline） | lib/orders；EscrowDetail **UnifiedItineraryList**；**53-S7** `OrderChatContextCard` |
| GET | /api/v1/orders/:id/chain-sync-status | 订单链同步状态（pending/confirmed、finalityN、checkpoint、last_event）；可选 **`chain_sync.event_log_snapshot`**（**finality_n_used** 等，**110 §3.3**） | **`api.ts`** **`orderChainSyncStatus`**、**`getOrderChainSyncStatus`**；**EscrowDetail** **`ChainSyncStatusPanel`** / **`useEscrowDetail.chainSync`** |
| PATCH | /api/v1/orders/:id/itinerary | **53 行程修改写回**（仅参与方、未 Escrowed 前可改；body 与 52 统一表一致） | lib/orders 或 EscrowDetail 行程编辑 |
| POST | /api/v1/orders/:id/accept | 向导接单；**403** **`trust_guide_pending_review`** / **`trust_identity_restricted`** / **`trust_risk_too_high`**（**90**，与 **`GET /me.trust`** 同源，**04 §3.4**） | lib/orders |
| POST | /api/v1/orders/:id/confirm-bilateral | **53 双边确认**（游客/向导各自确认，双方均调用后进入已双边确认） | lib/orders；EscrowDetail 双边确认区 |
| POST | /api/v1/orders/:id/confirm-rating | **53 评分双方确认**（双方均调用后可触发释放） | lib/orders；评分页 |
| POST | /api/v1/orders/:id/cancel | 取消订单 | lib/orders |
| POST | /api/v1/orders/:id/confirm-completion | **确认行程完成**（链下进度，见 [04](04-后端与API.md) §3.4；**非**放款）；**release** 在 53 评分路径满足后由 **dapp 另签** `Escrow.release()` 或执行器（见上文「53 阶段评分后释放」） | lib/orders；与 Escrow 释放入口衔接 |
| POST | /api/v1/orders/:id/mock-pay | 链下 mock：Accepted→Escrowed（P3，仅 CHAIN_OFF） | 链下流程 |
| POST | /api/v1/orders/:id/set-escrow-address | 链下 mock：写入 order.escrow_address（P18） | EscrowDetail SetEscrowAddressBlock |
| GET | /api/v1/orders/:id/reviews | 该订单评价；**`meta.review_weight_rule_version`**（与 **04 §3.4**） | lib/orders |
| POST | /api/v1/orders/:id/reviews | 提交评价；**`review.weight_breakdown`**（**`traveltrust_core::ReviewWeight`**；评审者 **`users.created_at`** 账龄）；**`weight_breakdown_note`**（含 **`persisted_review_inputs_not_replayed`** 幂等语义）；**`review_json_contract`**/**`REVIEW-SUBMIT-JSON-CONTRACT-V1`** 演进见 **B-451** 与 **04 §3.4**、**`b449_`**/**`b451_`** 机读及 **B-449/B-450**（**`check-b450-*`**）、**`check-b451-review-json-contract-evolution-gate.py`** 对读；**B-452** 与 **`reviewJsonContractClient`**（**`frontend/lib/reviewJsonContract.ts`**）对读；**B-453** 与 **`observeReviewJsonContractClient`**（**`frontend/lib/reviewJsonContractObservability.ts`**）对读；**B-454**/**`replay-b454`**；**B-455**/**`eval-b455`**；**B-456**/**`release-controller-b456`**；**B-457**/**`release-adapter-layer-b457`** | lib/orders |
| POST | /api/v1/orders/:id/dispute | 发起争议 | lib/orders + dapp 签 openDispute |
| GET | /api/v1/orders/:id/evidence | 证据（GET） | lib/orders |
| POST | /api/v1/orders/:id/evidence | 证据上传 | lib/orders |
| POST | /api/v1/media/signed-urls | 签名链接签发（受限对象短期访问；**object_id** MVP 见 **04 §3.4**；须 **DATABASE_URL** + `signed_url_tokens`） | **Partial**：`routes/media.rs`；无 DB **503**；有 DB 时 **200** |
| GET | /api/v1/media/access/:token_id | 兑现签发 URL（匿名 GET；**200** 元数据 JSON，**410** 过期；**200/410** 写 **`media_access_logs`**；见 **04 §3.4**） | **Partial**：`routes/media.rs`；与 **`PUBLIC_API_BASE_URL`** 同批 |
| GET | /api/v1/disputes | 争议列表；**无 `chain_off` → `501` `not_implemented`**（与 `routes/disputes.rs` 一致） | lib/disputes |
| GET | /api/v1/disputes/:id | 争议详情；**无 `chain_off` → `501`** | lib/disputes |
| POST | /api/v1/disputes/:id/resolve | 裁决 | lib/disputes（仲裁员） |
| GET | /api/v1/did-rank/travelers | 30 DID 排行榜 旅行者榜（DB 优先 + chain_off 回退）；已鉴权时 `travelers[*].is_me` | lib/apiClient getDidRankTravelers（含 `getAuthHeaders`）；did-rank 页 |
| GET | /api/v1/did-rank/guides | 30 DID 排行榜 向导榜（同上）；`guides[*].is_me` | lib/apiClient getDidRankGuides；did-rank 页 |
| GET | /api/v1/did-rank/itineraries | 55 G1 行程榜（DB 优先 + chain_off）；`itineraries[*].is_me` 依订单 `tourist_id` | **getDidRankItineraries**；**`?board=itinerary`** Top10（**30 §0.1**）；冒烟/check-55 |
| GET | /api/v1/governance/fee-routes | **FeeRouter** `PlatformFeeRouted` 索引只读列表；query **limit**、**cursor**（`block:log`）、**chain_id**；`page.next_cursor` / `has_more`；无 DB 时占位 | `routes.governanceFeeRoutes`；透明度页可选 |
| GET | /api/v1/governance/protocol-reference | **[84](84-第一阶段10国Country-Pool发行参数总表.md) 文档镜像**：45/55、Global 65/20/15、Phase1 十国；**非**链上 FeeRouter；`X-Implementation-Status: doc-reference` | `routes.governanceProtocolReference`；`/governance/params` |

`disputes.status` 最小枚举（与 `04`、`350` 对齐）：`Open`、`Assigned`、`Resolved`。裁决链上执行完成后，订单进入资金终态（`Refunded/PartiallyRefunded/Slashed/Completed`），不得在 disputes 侧另造平行终态枚举。

状态说明：`GET /api/v1/orders/:id/chain-sync-status` 已登记且路由已挂载，当前为最小可用实现（chain_off 完整、非 chain_off 返回运行态快照）；**有 DB 与 `event_log` 命中时**响应可含 **`event_log_snapshot`**（**`finality_n_used`** 等，与 **`GET /meta` · `indexer.finality_discipline`** 互指）；文件/证据访问默认为“私有对象 + 短期签名 URL”，仅公开材料白名单允许静态直链；发布验收以前以后端实现证据与 `04 §3.4` 状态标签为准。

补充说明：`POST /api/v1/media/signed-urls` / `GET /api/v1/media/access/:token_id` 已落地 **Partial**（DB + `signed_url_tokens` + **`media_access_logs`** 审计）；对象存储字节流未接前兑现体为 JSON 元数据；字段或错误码调整须先同步 `04 §3.4` 与本表。

**P15/P16/P18/P29 相关（与 04 §3.4 一致）**：

| 方法 | 路径 | 说明 | 前端落点 |
|------|------|------|----------|
| POST | /api/v1/itineraries | P15 行程生成（创建/更新 Draft 订单+行程）；**guide_id?** 预选向导（与 `POST /api/v1/orders` 同语义，见 04 §3.4） | lib/apiClient postItineraryCreate；`/itinerary/new` 等 |
| POST | /api/v1/itineraries/custom | 49 A 自定义行程 Draft；**guide_id?** 与上条同语义（04 §3.4） | lib/apiClient postItineraryCustom；CustomItineraryModal；`/market?guide_id=` 深链可选带参 |
| GET | /api/v1/discover/orders | **P16 可浏览订单（自由市场列表 API）**；路径名保留 **discover**；**主 UI** **`/market`**（Next **`/discover`** 仅重定向壳）。query: country?, city?, **limit?**, **cursor?**（**55-S12**；**page** / 排序 / 400 `invalid_cursor` 见 04 §3.4）；item：**image**、**escrow_address** | lib/apiClient **getDiscoverOrders**；**`/market`** 订单栏（**`useMarketPage`** · **300ms debounce** · 收藏 **`localStorage` + F-020 best-effort** → **②** SLA — **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §3） |
| GET | /api/v1/orders/:id/messages | P16 订单聊天消息列表；**items[]** 必有字段、可选 **sender_name** / **sender_avatar_url**；**GET** 与 **POST** 均在 **chain_off** 未挂载时 **501** `not_implemented`（与 **`not_impl_json`** 一致）；详 **[04 §3.4](04-后端与API.md)** | frontend/lib/api.ts routes.orderMessages；EscrowDetail ChatBlock |
| POST | /api/v1/orders/:id/messages | P16 发送消息 body: **content**（trim 非空）；**501** 同上 | 同上 |
| POST | /api/v1/orders/:id/confirm-final-plan | P16 确认最终版本（生成 snapshotHash） | EscrowDetail QuoteSummaryCard Confirm Final Plan |
| POST | /api/v1/orders/:id/set-escrow-address | P18 链下 mock 写入 escrow_address | EscrowDetail SetEscrowAddressBlock；body: escrow_address |
| POST | /api/v1/orders/:id/mock-pay | P3 链下 mock Accepted→Escrowed | 链下联调；仅 P3_CHAIN_OFF=1 |

**社区 Feed（51-31-9 / 160，与 `04 §3.4` 一致）**：

| 方法 | 路径 | 说明 | 前端落点 |
|------|------|------|----------|
| GET | /api/v1/community/feed | **query**：`cursor?`、`limit?`、`mode?`（`latest`\|`recommend`\|`hot`\|`follow`）；**`tag?`** 可选，与 **`community_posts.tags`** 某一元素**精确匹配**（空或 **>64** 字符忽略）；`hot` 游标 `H|…` 与 `latest` 的 RFC3339 游标勿混用 | `lib/apiClient/community` **getFeed**；`/community`、`/community/topic/[tag]`、`?tag=` |
| GET | /api/v1/community/stats/posts-by-tag | **query**：**`tag`**（必填，≤64）；公开帖计数，与 Feed **`tag`** 精确匹配一致 | `frontend/lib/api.ts` **`statsPostsByTag`**；`CommunityFeedMain` / 话题 Hero |

**向导列表多参数（自由市场 P29）**：GET /api/v1/guides 支持 **language**、**service_type** 多值（逗号分隔或重复参数）；前端 StickyFilterBar 多选与 29 §7.1 一致。**订单卡片扩展**：**`GET …/discover/orders`**（**`/market`** 列表消费）与 **orders/:id** 响应可选 breakdown、highlights（Order）；guides 响应可选 priceRange、rating、completedCount、responseSLA（Guide）；见 04 §3.4、29 §11。

**内部 API（P5/P6，仅后端/cron 调用，不对外暴露）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/internal/process-resolution-outbox | 执行器消费一条裁决并代发链上 executeResolution；需 CHAIN_RPC_URL、ESCROW_FACTORY_ADDRESS、CHAIN_EXECUTOR_PRIVATE_KEY |
| POST | /api/v1/internal/indexer-tick | 索引器拉取一轮；**toBlock**=`chain_tip−max(1,FINALITY_N)`（110 §3.3）；需 CHAIN_RPC_URL、ESCROW_FACTORY_ADDRESS；有 chain_off 时投影订单 + FeeRouter 表；**`200`** JSON 含 **`meta.build`**（与 **indexer-status**/**GET /meta.build** 同源，**120/140**）、**from_block/to_block/chain_tip/finality_n**、**events_applied**、**events_new**；可选 **`INDEXER_REORG_AUTO_REWIND_ON_TICK=1`** + **DB** → **`reorg_auto_rewind`** / **`chain_off_orders_reload`** / **`reorg_still_suspected_after_auto_rewind`**（**04 §3.4**）；**awaiting_finality** / **no_new_blocks** 同上 |
| POST | /api/v1/internal/indexer-replay | 按 `event_log` 重放 `orders_projection`（可选 body `chain_id`；须 DB） |
| POST | /api/v1/internal/indexer-reorg-rewind | **110 Partial**：`rewind_from_block`/`force`；删尾事件 + 清空链上 **`orders_projection`** + replay；默认 **chain_off** **`reload_orders_from_db_into_store`**；可选 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND`** → **`orders_table_projection_sync`**（**`candidates_total`**/**`cleared_orphan_escrow_pre_funded`**/**`cleared_orphan_escrow_terminal_no_projection`**（**`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`**）/**`skipped_no_projection_non_escrowed_with_escrow`** 等）；见 **04 §3.4** |
| POST | /api/v1/internal/indexer-reconcile | 对账 `orders`↔`orders_projection`；可选 `chain_id`、`persist`、**`rpc_escrow_samples`**（**`rpc_escrow_sample_meta`** / **`110-RPC-ESCROW-SAMPLE-META`** 见 **04 §3.4**）、**`backfill_orders_chain_id`**、**`orders_chain_scope_*`**（**ENV `TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1`**）、**`event_log_chain_scope_*`**（**ENV `TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1`**；**`CONFIRM_DELETE_EVENT_LOG_CHAIN_<chain_id>`**）、**`correction_executor_chain_scope_*`**（**ENV `TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1`**；**`CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_<chain_id>`**；**`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-*`**）、**`sync_indexer_memory_from_db_checkpoint`**（**ENV `TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1`**；**`110-INDEXER-MEMORY-SYNC-FROM-DB`**）、**`include_chain_tip`**（**`chain_observation`**；**`110-RECONCILE-CHAIN-TIP`**；RPC 失败 **`ok:false`** **不**抬 HTTP）、**`include_event_log_escrow_coverage`**（**`event_log_escrow_coverage`**；**`110-EVENT-LOG-ESCROW-COVERAGE`**；**DB 已索引**范围），见 **04 §3.4**/ **110 §3.1.4**；须 DB；成功 **`200`** 根级可选 **`economic_projection_row_counts`**（与 **`reconciliation_reports.summary`** 同形，见 **04 §3.4**） |
| GET | /api/v1/internal/indexer-status | 查询索引器运行状态、checkpoint、finality 生效值；**`meta.build`** 与 **`GET /meta.build`** 同源（**120/140**） |
| POST | /api/v1/internal/alerts/test-fire | 触发告警演练（SRE/Ops） |
| POST | /api/v1/internal/incident/open | 创建事故工单（SRE/Ops） |

状态说明：以上接口已登记并挂载路由；`indexer-status`、`alerts/test-fire`、`incident/open` 已提供最小可用实现；**`indexer-replay`** 已实现 **`event_log`→`orders_projection`** 重放；**`indexer-reconcile`** 已实现 **`orders`↔`orders_projection`** 对账，且可选 **`persist:true`** 追加 **`reconciliation_reports`**、可选 **`rpc_escrow_samples>0`** 时根级 **`rpc_escrow_sample_meta`**（**`110-RPC-ESCROW-SAMPLE-META`**；见 **04 §3.4**）、可选 **`backfill_orders_chain_id:true`** 回填 **`orders.chain_id`**、可选 **`orders_chain_scope_*`** / **`event_log_chain_scope_*`** / **`correction_executor_chain_scope_*`** 链级 **dry-run/execute**（各段独立 ENV+confirm）、可选 **`sync_indexer_memory_from_db_checkpoint`**（**`TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1`**；对齐 **`checkpoints_sharded`** 与进程内 **`IndexerState`**，见 **04 §3.4**、**110 §3.1.4**）、可选 **`include_chain_tip:true`**（根级与 **`persist` `summary`** 之 **`chain_observation`**；**`110-RECONCILE-CHAIN-TIP`**）、可选 **`include_event_log_escrow_coverage:true`**（**`event_log_escrow_coverage`**；**`110-EVENT-LOG-ESCROW-COVERAGE`**；**DB 已索引**）；链上 RPC 全量校验与 110 证据门禁仍待迭代。**indexer-tick**：**Partial** 终局上界见上表与 **04 §3.4**；运行时状态内事件列表对 `(chain_id, block_number, log_index)` 去重追加；**重复键**时不重复跑订单投影与 DB `upsert_order`，与 `04 §四` 一致。响应 **`events_new`** 反映新追加条数，**`events_applied`** 为本轮扫描条数。

**110 索引器外部只读接口（Admin/订单页）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/indexer/health | 索引器健康、finality、生效 checkpoint；**`meta.build`** 同 **`GET /meta.build`**；`frontend/app/admin/indexer`、`routes.admin.indexerHealth` |
| GET | /api/v1/admin/finance/summary | 财务摘要（`meta`：`generated_at`、`source`、**`build`**（同 **`GET /meta.build`**）、`db_order_count`/`db_orders_with_escrow_count`/`orders_projection_reconcile_report_count`/`reconciliation_reports_total_count`/`reconciliation_reports_with_open_issues_count`/`reconciliation_reports_projection_unclean_count`/`reconciliation_reports_projection_clean_count`、`fee_router_address`/`fee_router_stats`、`region_vault_address`/`region_vault_stats`、`last_stored_orders_projection_reconcile`；`summary`：订单/争议/托管地址/金额解析失败等聚合）；`frontend/app/admin/finance`、`routes.admin.financeSummary`；审计 `admin.finance.summary.read` |
| GET | /api/v1/admin/finance/summary/export | 财务摘要 **CSV**（**`format=csv`**；**`text/csv`** + **`Content-Disposition`**；与 summary 同源聚合；首行 **`export,kind,finance_summary_v2`**；**`meta.fee_router_stats`**/**`meta.region_vault_stats`**/**`meta.last_stored_orders_projection_reconcile`** **为对象时** CSV 按子键扁平行；**`meta.build.*`** 行与 **`GET /meta.build`** 同源）；`routes.admin.financeSummaryExport`；审计 **`admin.finance.summary.export`** |
| GET | /api/v1/admin/fee-router/routed-events | FeeRouter 投影 **summary** + **items** + **page** + **`meta.build`**（query limit/cursor/chain_id；limit≤200）；须 admin + PostgreSQL；审计 `admin.fee_router_routed.read` |
| GET | /api/v1/admin/users | Admin 用户列表；**`applied_filters`** + **`meta.build`** + query **`limit`**/**`role`**/**`kyc_status`**；`frontend/app/admin/users`（**URL 同步**）、`routes.admin.users(params?)` |
| GET | /api/v1/admin/users/:id | Admin 用户详情（不含密码哈希）；**`meta.build`**；`frontend/app/admin/users/[id]`、`routes.admin.userById`；审计 `admin.users.detail.read` |
| GET | /api/v1/admin/guides | 向导入驻台账；**`applied_filters`** + **`meta.build`** + **`limit`**/**`status`**；`frontend/app/admin/guides`（**URL 同步**）、`routes.admin.guides(params?)`；不含护照哈希 |
| GET | /api/v1/admin/guides/:id | 向导监管详情（与 `GET …/admin/guides` 列表行同形；不含护照哈希）；**`meta.build`**；`frontend/app/admin/guides/[id]`、`routes.admin.guideById`；审计 `admin.guides.detail.read` |
| POST | /api/v1/admin/users/:id/role-change-request | 高危角色变更申请（写入审批队列 + 审计）；**`200`** 含 **`meta.build`**；`frontend/app/admin/users`（Modal）、`routes.admin.userRoleChangeRequest`、`writeRequestHeaders` |
| GET | /api/v1/admin/orders | 订单监管列表；**`applied_filters`** + **`meta.build`** + query **`limit`**/**`state`**；`frontend/app/admin/orders`（**URL 同步**）、`routes.admin.orders(params?)` |
| GET | /api/v1/admin/orders/:id | 订单监管详情（与公开 `GET /orders/:id` 同形）；**`meta.build`**；`frontend/app/admin/orders/[id]`、`routes.admin.orderById`；审计 `admin.orders.detail.read` |
| GET | /api/v1/admin/disputes | 争议运营列表；**`applied_filters`** + **`meta.build`** + query **`limit`**/**`status`**；`frontend/app/admin/disputes`（**URL 同步**）、`routes.admin.disputes(params?)` |
| GET | /api/v1/admin/disputes/:id | 争议监管详情（与公开 `GET /disputes/:id` 同形）；**`meta.build`**；`frontend/app/admin/disputes/[id]`、`routes.admin.disputeById`；审计 `admin.disputes.detail.read` |
| GET | /api/v1/admin/reviews | 评价列表；**`applied_filters`** + **`meta.build`** + query **`limit`**/**`min_score`**/**`max_score`**；`frontend/app/admin/reviews`（**URL 同步**）、`routes.admin.reviews(params?)` |
| GET | /api/v1/admin/reviews/:id | 评价监管详情（与列表行同形；**`meta.source`** + **`meta.build`**）；`frontend/app/admin/reviews/[id]`、`routes.admin.reviewById`；审计 `admin.reviews.detail.read` |
| GET | /api/v1/admin/audit-logs | 管理审计日志检索；**`applied_filters`** + **`meta.build`** + **`limit`**/**`actor_id`**/**`action`**/**`resource_type`**（无 DB 时 **`meta.note`** 与顶层 **`note`** 并存）；`frontend/app/admin/audit`（**URL 同步**）、`routes.admin.auditLogs(params?)` |
| GET | /api/v1/admin/audit-logs/:id | 单条审计日志（与列表项同形；须 DB）；**`meta.build`**；`frontend/app/admin/audit/logs/[id]`、`routes.admin.auditLogById`；审计 `admin.audit_logs.detail.read` |
| GET | /api/v1/admin/approvals | 审批单查询；**`applied_filters`** + **`limit`**/**`status`** + **`meta.build`** 同 **`GET /meta.build`**（无 DB 时 **`meta.note`**=`admin_approvals_no_db` 与顶层 **`note`** 并存）；`frontend/app/admin/approvals`（**URL 同步**）、`routes.admin.approvals(params?)` |
| GET | /api/v1/admin/approvals/:id | 单条审批单只读（与列表项同形；须 DB）；**`meta.build`** 同 **`GET /meta.build`**；`frontend/app/admin/approvals/[id]`、`routes.admin.approvalById`；审计 `admin.approvals.detail.read` |
| POST | /api/v1/admin/approvals/:id/approve | 批准待审单（**super_admin**，禁止自审；与角色变更链衔接）；**`200`** 含 **`meta.build`** 同 **`GET /meta.build`**；`frontend/app/admin/approvals`、`routes.admin.approvalApprove`、`writeRequestHeaders` |
| GET | /api/v1/admin/api-versions | API 版本兼容状态与退役计划（340）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`（**`applied_filters`**、`api_version`/`status` query、**`400 invalid_admin_api_version_status_filter`**）；`frontend/app/admin/api-versions`、`routes.admin.apiVersions` |
| GET | /api/v1/admin/lifecycle/state-machines | 生命周期状态机与异常迁移告警（350）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`（**`applied_filters`**、多字段 **ILIKE** + **`anomaly_flag`**、**`400 invalid_lifecycle_anomaly_flag_filter`**）；`frontend/app/admin/lifecycle`、`routes.admin.lifecycleStateMachines` |
| GET | /api/v1/admin/policies | 数据权限策略 policy/scope/binding 台账（70）；query `limit`/`policy_code`/`status`/`scope_type`/`binding_role` + `applied_filters`；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/policies`、`routes.admin.policies(params?)` |
| POST | /api/v1/admin/policies/:id/publish | 策略状态发布（super_admin + 乐观锁 + 幂等键）；**`200`** 含 **`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/policies`（Modal）、`routes.admin.policyPublish`、`writeRequestHeaders` |
| GET | /api/v1/admin/tenants/scopes | 租户与区域作用域台账（70，列表含 `version`）；query `limit`/`tenant_key`/`region_code`/`status`/`scope_class` + `applied_filters`；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/tenants/scopes`、`routes.admin.tenantScopes(params?)` |
| POST | /api/v1/admin/tenants/scopes/:id/publish | 作用域状态发布（super_admin + 乐观锁 + 幂等键）；**`200`** 含 **`meta.build`**；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/tenants/scopes`（Modal）、`routes.admin.tenantScopePublish`、`writeRequestHeaders` |
| GET | /api/v1/admin/community/reports | **160** 举报工单池；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + 多字段 query（含 UUID **`400`** 键）；**Implemented（最小基线）** 见 `04 §3.4/§3.5`；`frontend/app/admin/community/reports`（**URL 同步**）、`routes.admin.communityReports(params?)` |
| GET | /api/v1/admin/community/appeals | **160** 申诉台账；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`**；**Implemented（最小基线）** 见 `04 §3.4/§3.5`；`frontend/app/admin/community/appeals`（**URL 同步**）、`routes.admin.communityAppeals(params?)` |
| PATCH | /api/v1/admin/community/moderation/:id | **160** 审核处置（admin + 乐观锁 + 幂等键；同事务 `community_moderation_cases`；可选 `record_penalty`）；**Implemented（最小基线）**；`frontend/app/admin/community/reports`（Modal）、`routes.admin.communityModeration`、`writeRequestHeaders` |
| GET | /api/v1/admin/community/moderation/cases | **160** 审核审计行列表；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + `report_id`/`actor_id`（UUID **`400`**）+ `status_before`/`status_after`（**ILIKE**）；**Implemented（最小基线）** 见 `04 §3.4`；`frontend/app/admin/community/moderation/cases`（**URL 同步**）、`routes.admin.communityModerationCases(params?)` |
| POST | /api/v1/admin/community/appeals/:id/review | **160** 申诉复核（super_admin）；**Implemented（最小基线）**；`frontend/app/admin/community/appeals/review`、`routes.admin.communityAppealReview`、`writeRequestHeaders` |
| GET | /api/v1/admin/community/ranking/snapshots | **160** 排序快照审计；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + `feed_mode`（**ILIKE**）；**Implemented（最小基线）** 见 `04 §3.4`；`frontend/app/admin/community/ranking/snapshots`（**URL 同步**）、`routes.admin.communityRankingSnapshots(params?)` |
| GET | /api/v1/admin/community/penalties | **160** 处罚台账；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + UUID/`status` **`400`** 键；**Implemented（最小基线）** 见 `04 §3.4`；`frontend/app/admin/community/penalties`（**URL 同步**）、`routes.admin.communityPenalties(params?)` |
| POST | /api/v1/admin/community/penalties | **160** 登记处罚（关键写 + 幂等键）；**Implemented（最小基线）**；`frontend/app/admin/community/penalties`（Modal）、`routes.admin.communityPenaltyCreate`、`writeRequestHeaders` |
| PATCH | /api/v1/admin/community/comments/:id | **160** 评论 `visibility_status`（关键写 + 幂等键）；**Implemented（最小基线）**；`frontend/app/admin/community/comments/visibility`、`routes.admin.communityCommentVisibility`、`writeRequestHeaders` |
| GET | /api/v1/admin/community/risk-signals | **160 §5** `community_risk_signals`；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + `subject_user_id`（UUID **`400`**）+ `signal_type`/`rule_id`/`severity`（**ILIKE**）；**Implemented（最小基线）** 见 `04 §3.4`；`frontend/app/admin/community/risk-signals`（**URL 同步**）、`routes.admin.communityRiskSignals(params?)` |
| GET | /api/v1/admin/community/policy-change-logs | **160 §5** `community_policy_change_logs`；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + `scope`/`summary`/`source`（**ILIKE**）+ `actor_id`（UUID **`400`**）；**Implemented（最小基线）** 见 `04 §3.4`；`frontend/app/admin/community/policy-change-logs`（**URL 同步**）、`routes.admin.communityPolicyChangeLogs(params?)` |
| PATCH | /api/v1/admin/community/abuse-policy | **160 §5** 调 **`community_abuse_policy`**（**super_admin**；关键写 + 幂等键）；**Implemented（最小基线）**；`frontend/app/admin/community/abuse-policy`、`routes.admin.communityAbusePolicy`、`writeRequestHeaders` |
| GET | /api/v1/admin/compliance/data-requests | DSAR 请求列表与 SLA 快照（500）；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + query 筛选（**`400 invalid_compliance_request_type_filter`** / **`invalid_compliance_request_status_filter`** 可先于 DB）；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/compliance/requests`、`routes.admin.complianceDataRequests(params?)` |
| GET | /api/v1/admin/compliance/data-requests/:request_id/events | DSAR 事件轴（500）；**`applied_filters`** + **`meta.build`** 同 **`GET /meta.build`** + query **`event_type`**（**ILIKE** 子串）；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/compliance/requests/[requestId]/events`（**URL 同步**）、`routes.admin.complianceDataRequestEvents(params?)` |
| POST | /api/v1/admin/compliance/data-requests/:request_id/update | DSAR 更新 + 事件追加（super_admin + 乐观锁 + 幂等键）；**`200`** 含 **`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/compliance/requests/[requestId]/update`、`routes.admin.complianceDataRequestUpdate`、`writeRequestHeaders` |
| GET | /api/v1/admin/internal-tools/audits | 内部工具执行审计（450）；query `limit`/`tool_id`/`action_code`/`actor_id`/`approval_request_id`（UUID）+ `applied_filters` + **`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/internal-tools/audits`、`routes.admin.internalToolAudits(params?)` |
| GET | /api/v1/admin/media/access-logs | **270** `media_access_logs` 只读；query `limit`/`action`（精确匹配）/`object_id`/`actor_or_ip`（ILIKE）/`token_id`（UUID）+ **`applied_filters`**；**`meta.build`** 同 **`GET /meta.build`**；**400** `invalid_media_access_logs_action` / `invalid_media_access_logs_token_id_filter`（可先于 DB）；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/media/access-logs`、`routes.admin.mediaAccessLogs(params?)` |
| GET | /api/v1/admin/media/signed-url-tokens | **270** `signed_url_tokens` 只读；query `limit`/`object_id`（ILIKE）/`url_scope`（read\|download）/`issued_to`/`token_id`（行 id，UUID）+ **`applied_filters`**；**`meta.build`** 同 **`GET /meta.build`**；**400** `invalid_media_signed_url_tokens_scope_filter` / `invalid_media_signed_url_tokens_issued_to_filter` / `invalid_media_signed_url_tokens_token_id_filter`（可先于 DB）；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/media/signed-url-tokens`、`routes.admin.mediaSignedUrlTokens(params?)` |
| GET | /api/v1/admin/flags | Feature Flag 查询（`limit`/`flag_code`/`enabled`/`scope`，`applied_filters`，**`meta.build`** 同 **`GET /meta.build`**）；**Implemented（基线）** 见 `04 §3.5`；`frontend/app/admin/flags`、`routes.admin.flags(params?)` |
| POST | /api/v1/admin/flags/:id/publish | Feature Flag 发布/回滚（super_admin + 乐观锁 + 幂等键）；**`200`** 含 **`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）**；`frontend/app/admin/flags`（Modal）、`routes.admin.flagPublish`、`writeRequestHeaders` |
| GET | /api/v1/admin/config/releases | 配置发布登记（220）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）** 见 `04 §3.5`；query `limit`/`release_key`/`status`；`frontend/app/admin/config/releases`、`routes.admin.configReleases` |
| GET | /api/v1/admin/config/releases/:id | 单条 `config_releases`（220）；**`meta.build`** 同左；`frontend/app/admin/config/releases/[id]`、`routes.admin.configRelease` |
| GET | /api/v1/admin/jobs | 异步任务状态、重试、死信队列（250）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）**；`frontend/app/admin/jobs`、`routes.admin.jobs` |
| GET | /api/v1/admin/scheduler/jobs | 定时任务运行记录（260）；query `limit`/`job_code`（非法 `job_code` **400**，先于 DB）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）**；`frontend/app/admin/scheduler/jobs`、`routes.admin.schedulerJobs` |
| POST | /api/v1/admin/scheduler/jobs/:job_code/rerun | 调度补跑登记 `queued`（260）；**`200`** 含 **`meta.build`**；**Implemented（基线）**；`frontend/app/admin/scheduler/jobs`（行内 Modal）、`routes.admin.schedulerJobRerun`、`writeRequestHeaders`；super_admin |
| GET | /api/v1/admin/schema/migrations | Schema 迁移版本、回滚计划与执行状态（330）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（最小只读）** 见 **`04 §3.5`**；`frontend/app/admin/schema`、`routes.admin.schemaMigrations` |
| GET | /api/v1/admin/secrets/metadata | Secret/Key 元数据与轮换状态（无密钥明文）；**`meta.build`** 同 **`GET /meta.build`**；**Implemented（基线）**；query `limit`/`key_alias`/`status`/`env_scope`；`frontend/app/admin/secrets/metadata`、`routes.admin.secretsMetadata` |
| GET | /api/v1/admin/indexer/reconcile-report/:id | **`:id`=`latest`/UUID** 读 **`reconciliation_reports`**（见 **04 §3.4**）；**`200`** 成功体含 **`meta.build`**；`frontend/app/admin/indexer/reconcile/[id]`、`routes.admin.indexerReconcileReport` |
| GET | /api/v1/admin/indexer/reconcile-reports | 对账报告分页列表；**`items[].stats_breakdown`**（**`summary.stats`** 分项计数，无 **`samples`**）；可选 **`items[].economic_projection_row_counts`**（**`summary`** 同路径：**`rows_total`**/**`max_block_number`**/**`min_block_number`**/**`latest_inserted_at`**）+ **`meta.build`**；`frontend/app/admin/indexer/reconcile-reports`、`routes.admin.indexerReconcileReports`；详见 **04 §3.4** |
| GET | /api/v1/admin/indexer/reconcile-reports/export | **CSV**/**JSON**；**`export_scope=all`**（**2000**）；**SHA-256**/**`truncated`**；可选 **Ed25519** 头 + **`GET /meta.admin_exports`**；`routes.admin.indexerReconcileReportsExport`；审计 **`admin.indexer.reconcile_reports.export`** |
| GET | /api/v1/admin/observability/overview | 可观测总览（**chain_id**、**`meta.build`** + **`overview.build`**（均同 **`GET /meta.build`**）、**rate_limits**、indexer、alerts、audit 聚合；与 `GET /meta` 限流快照同源）；`frontend/app/admin/observability`、`routes.admin.observabilityOverview` |
| GET | /api/v1/admin/alerts/incidents/:id | 告警事件详情（incident）；**`meta.build`**；`frontend/app/admin/alerts/incidents/[id]`、`routes.admin.alertIncident`；入口页 **`/admin/alerts/incidents`** **URL 同步** query **`incident_id`** |
| GET | /api/v1/admin/audit/operations | 运维审计动作检索；**`applied_filters`** + **`limit`** + **`meta.build`**；`frontend/app/admin/audit/operations`（**URL 同步**）、`routes.admin.auditOperations(params?)` |

状态说明：`/api/v1/admin/indexer/health`、`/api/v1/admin/finance/summary`、`/api/v1/admin/fee-router/routed-events`、**`/api/v1/admin/users`**、**`/api/v1/admin/users/:id`**、**`/api/v1/admin/users/:id/role-change-request`**、**`/api/v1/admin/guides`**、**`/api/v1/admin/guides/:id`**、**`/api/v1/admin/orders`**、**`/api/v1/admin/orders/:id`**、**`/api/v1/admin/disputes`**、**`/api/v1/admin/disputes/:id`**、**`/api/v1/admin/reviews`**、**`/api/v1/admin/reviews/:id`**、**`/api/v1/admin/audit-logs`**、**`/api/v1/admin/audit-logs/:id`**、**`/api/v1/admin/approvals`**、**`/api/v1/admin/approvals/:id`**、**`/api/v1/admin/approvals/:id/approve`**、`/api/v1/admin/observability/overview`、`/api/v1/admin/alerts/incidents/:id`、`/api/v1/admin/audit/operations`、`/api/v1/admin/schema/migrations`、`/api/v1/admin/flags`、`/api/v1/admin/flags/:id/publish`、`/api/v1/admin/secrets/metadata`、`/api/v1/admin/config/releases`、`/api/v1/admin/config/releases/:id`、`/api/v1/admin/jobs`、`/api/v1/admin/scheduler/jobs`、`/api/v1/admin/scheduler/jobs/:job_code/rerun`、`/api/v1/admin/api-versions`、`/api/v1/admin/lifecycle/state-machines`、`/api/v1/admin/policies`、`/api/v1/admin/policies/:id/publish`、`/api/v1/admin/tenants/scopes`、`/api/v1/admin/tenants/scopes/:id/publish`、`/api/v1/admin/community/reports`、`/api/v1/admin/community/moderation/:id`、`/api/v1/admin/community/moderation/cases`、**`/api/v1/admin/community/appeals`**、`/api/v1/admin/community/appeals/:id/review`、`/api/v1/admin/community/ranking/snapshots`、`/api/v1/admin/community/penalties`、`/api/v1/admin/community/comments/:id`、**`/api/v1/admin/community/risk-signals`**、**`/api/v1/admin/community/policy-change-logs`**、**`/api/v1/admin/community/abuse-policy`**、`/api/v1/admin/compliance/data-requests`、`/api/v1/admin/compliance/data-requests/:request_id/events`、`/api/v1/admin/compliance/data-requests/:request_id/update`、`/api/v1/admin/internal-tools/audits`、**`/api/v1/admin/media/access-logs`**、**`/api/v1/admin/media/signed-url-tokens`** 已提供最小读/写或登记基线（见 `04 §3.5`）；`/api/v1/admin/indexer/reconcile-report/:id` 当前为最小契约响应，完整导出链路后续按 110/120/200/220/230/240/250/260/330/340/350 阶段补齐。

最小实现错误码口径（与 `04 §3.5` 对齐）：

- Admin 读接口（overview/incident/audit/reconcile-report）：`401 login_required`、`403 admin_required`、`200 ok`。
- Admin API 版本接口（api-versions，340）：`401 login_required`、`403 admin_required`、`400 invalid_admin_api_version_status_filter`（**可无 DB**）、`200 ok`（**`meta.build`** 同 **`GET /meta.build`**）、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin API 版本接口最小响应字段：`items[].api_version/status/released_at/deprecated_at/sunset_at/compat_window_days/active_client_ratio_7d/request_count_7d/last_change_at/last_change_by`，`meta.generated_at` / `meta.source` / `meta.note` / **`meta.build`**。
- Admin 生命周期状态机接口（state-machines，350）：`401 login_required`、`403 admin_required`、`400 invalid_lifecycle_anomaly_flag_filter`（**可无 DB**）、`200 ok`（**`meta.build`** 同 **`GET /meta.build`**）、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin 生命周期状态机接口最小响应字段：`items[].machine_code/domain/version/entity_type/current_state/expected_state/anomaly_flag/anomaly_type/last_transition_at/source_of_truth/repairable`，`meta.generated_at` / `meta.source` / `meta.checkpoint` / `meta.note` / **`meta.build`**。
- Admin Schema 演进只读（schema/migrations，330）：`401 login_required`、`403 admin_required`、`200 ok`（**`items`** 聚合五类台账、**`meta.note`**、**`meta.build`** 同 **`GET /meta.build`**）、`503 admin_db_required`；任一段 DB 查询失败 **`500`**（键见 **`04 §3.5`**：`schema_versions_query_failed` 等）（**Implemented（最小只读）**）。
- Admin 数据策略只读（policies）：`401 login_required`、`403 admin_required`、`400 invalid_admin_policy_status_filter`（可先于 DB）、`200 ok`（含 **`applied_filters`**、**`meta.build`** 同 **`GET /meta.build`**）、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）；响应形见 `04` 表（`policy`/`scope`/`binding` 嵌套）。
- Admin 租户作用域只读（tenants/scopes）：`401 login_required`、`403 admin_required`、`400 invalid_tenant_scope_status_filter|invalid_tenant_scope_class_filter`（可先于 DB）、`200 ok`（含 **`applied_filters`**、**`meta.build`**）、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）；列表项含 `version`。
- Admin 租户作用域发布（tenants/scopes/:id/publish）：`401 login_required`、`403 super_admin_required`、`200 ok`（含 **`meta.build`**）、`404/409/400` 见 `04`、`503 admin_db_required`（**Implemented（基线）**；关键写限流 + 幂等键与 policies publish 同口径）。
- Admin DSAR 只读（compliance/data-requests）：`401 login_required`、`403 admin_required`、`400 invalid_compliance_request_type_filter` / `400 invalid_compliance_request_status_filter`（可先于 DB）、`200 ok`（含 **`applied_filters`**、**`meta.build`** 同 **`GET /meta.build`**）、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin DSAR 事件只读（compliance/data-requests/:request_id/events）：`401 login_required`、`403 admin_required`、`200 ok`（含 **`applied_filters`**、**`meta.build`** 同 **`GET /meta.build`**）、`400 invalid_compliance_request_id`、`404 compliance_data_request_not_found`、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin DSAR 更新（compliance/data-requests/:request_id/update）：`401 login_required`、`403 super_admin_required`、`200 ok`（含 **`meta.build`** 同 **`GET /meta.build`**）、`404/409/400` 见 `04`、`503 admin_db_required`（**Implemented（基线）**；关键写限流 + 幂等键）。
- Admin 数据策略发布（policies/:id/publish）：`401 login_required`、`403 super_admin_required`、`200 ok`（含 **`meta.build`** 同 **`GET /meta.build`**）、`404/409` 见 `04`、`503 admin_db_required`（**Implemented（基线）**；关键写限流 + 幂等键与 flags publish 同口径）。
- Admin 内部工具审计只读（internal-tools/audits）：`401 login_required`、`403 admin_required`、`400 invalid_internal_tool_audit_approval_request_id_filter`（可先于 DB）、`200 ok`（含 **`applied_filters`**、**`meta.build`** 同 **`GET /meta.build`**）、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin 媒体访问日志只读（media/access-logs）：`401 login_required`、`403 admin_required`、`400 invalid_media_access_logs_action` / `invalid_media_access_logs_token_id_filter`（可先于 DB）、`200 ok`（含 **`applied_filters`**、**`meta.build`**）、`500 media_access_logs_query_failed`、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin 媒体签发台账只读（media/signed-url-tokens）：`401 login_required`、`403 admin_required`、`400 invalid_media_signed_url_tokens_scope_filter` / `invalid_media_signed_url_tokens_issued_to_filter` / `invalid_media_signed_url_tokens_token_id_filter`（可先于 DB）、`200 ok`（含 **`applied_filters`**、**`meta.build`**）、`500 signed_url_tokens_query_failed`、`503 admin_db_required`（**Implemented（基线）**，以 `04 §3.5` 为准）。
- Admin **160** 社区治理（`community/reports`、`GET community/appeals`、`community/moderation/:id` PATCH、`community/moderation/cases` GET、`community/ranking/snapshots`、`community/penalties` GET/POST、**`community/comments/:id` PATCH**、**`community/risk-signals` GET**、**`community/policy-change-logs` GET**、**`PATCH community/abuse-policy`**）：`401/403/503` 与 `04 §3.4` 一致；各 **GET** 列表含 **`applied_filters`** 与 **`meta.build`**（同 **`GET /meta.build`**），非法 **query**（UUID/枚举等）的 **`400`** 键见 **`04 §3.4`**；**GET appeals** 与 reports 同为 admin 只读；moderation、**POST penalties**、**PATCH comments**、**PATCH abuse-policy** 为关键写（幂等键 + 限流）；**PATCH abuse-policy** 须 **super_admin**。
- Internal **160** 排序快照写入（`POST /api/v1/internal/community/ranking/snapshot`）：须内网；无 DB 时 `503`；与 `04` 内部 API 段一致。
- Internal **260/421** 调度编排（`POST /api/v1/internal/scheduler/enqueue`、`POST /api/v1/internal/scheduler/run-next`）：须内网；`enqueue` 的 `job_code` 白名单见 `04`；与 **`scheduler_job_runs`**、Admin **`POST …/admin/scheduler/jobs/:job_code/rerun`** 同表。
- Admin **160** 申诉复核（`community/appeals/:id/review`）：`401`、`403 super_admin_required`、`404/409` 见 `04`、`503 admin_db_required`；关键写（幂等键 + 限流）。
- Internal 触发接口（alerts/test-fire、incident/open）：`200 accepted`。
- Internal 回放/对账接口（**indexer-replay**、**indexer-reconcile**）：链/indexer 或 DB 缺失时 **`503`**（`chain_not_configured` / `database_required_for_replay` / `database_required_for_reconcile` 等）；成功 **`200 ok`** 且 JSON 含 **`stats`**（**reconcile** 可选 **`report_id`**/**`economic_projection_row_counts`**/**`chain_observation`**（**`include_chain_tip:true`**；**`110-RECONCILE-CHAIN-TIP`**）/**`event_log_escrow_coverage`**（**`include_event_log_escrow_coverage:true`**；**`110-EVENT-LOG-ESCROW-COVERAGE`**）/**`rpc_escrow_sample_meta`**（**`110-RPC-ESCROW-SAMPLE-META`**）/**`orders_chain_id_backfill`**/**`orders_chain_scope_*`**/**`event_log_chain_scope_*`**/**`correction_executor_chain_scope_*`**/**`indexer_memory_sync_from_db`**，详见 **04 §3.4**）；执行失败 **`500`**（`replay_orders_projection_failed` / `reconcile_orders_projection_failed` / **`persist_reconciliation_report_failed`** / **`rpc_escrow_samples_failed`** / **`rpc_escrow_sample_meta_failed`** / **`event_log_escrow_coverage_stats_failed`** / **`backfill_orders_chain_id_failed`** / **`orders_chain_scope_rollback_*_failed`** / **`event_log_chain_scope_rollback_*_failed`** / **`correction_executor_chain_scope_rollback_*_failed`** / **`indexer_memory_sync_from_db_failed`** / **`indexer_memory_sync_from_db_persist_failed`**）；**`403`** **`orders_chain_scope_rollback_execute_forbidden`** / **`event_log_chain_scope_rollback_execute_forbidden`** / **`correction_executor_chain_scope_rollback_execute_forbidden`** / **`indexer_memory_sync_from_db_forbidden`**；**`400`** **`orders_chain_scope_rollback_execute_confirm_mismatch`** / **`event_log_chain_scope_rollback_execute_confirm_mismatch`** / **`correction_executor_chain_scope_rollback_execute_confirm_mismatch`**；**`503`** **`indexer_state_unavailable`**（仅 **sync** 路径）。
- 订单链同步状态接口（orders/:id/chain-sync-status）：`401 login_required`；chain_off 模式下可返回 `403 forbidden`、`404 order_not_found`；成功 `200 ok`。

### 2.2 前端 API 基地址与路径常量

- **基地址**：`NEXT_PUBLIC_API_BASE_URL`（05 §四、frontend/.env.example）；未设则开发默认可用 `http://localhost:8080`（与根 .env.example 一致）。
- **后端端口默认值**：`PORT` 未设时为 `8080`，监听 `0.0.0.0:8080`（见 `crates/api/src/startup/mod.rs`）。
- **前端开发端口**：项目脚本默认 Next.js 在 `3012` 运行（见 `scripts/start-api-with-seed.bat`、`scripts/run-frontend.bat`、`scripts/start_dev.sh`）。
- **路径常量**：见 **frontend/lib/api.ts**（与上表及 04 §三 一致）；所有请求须带 x-request-id、写操作须带 Idempotency-Key / X-Idempotency-Key（04 §四、01 §10 #14）。
- **链上与观测环境变量映射**（非 08-3 的 26 key 数值表）：`CHAIN_ID`、`STAKING_ADDRESS`、`REGISTRY_ADDRESS`、`ESCROW_FACTORY_ADDRESS`、`NEXT_PUBLIC_STAKING_ADDRESS`、`NEXT_PUBLIC_REGISTRY_ADDRESS`、**`GET /meta`** 的 `chain.contracts` / `rate_limits` — 见 **[08-3 附录 A](08-3-参数与门禁表.md#附录-a运维与实现映射非-26-key-数值对齐代码与-runbook)** 与根目录 **`.env.example`**。

### 2.3 后端实现状态（与 04、crates/api 一致）

- 认证路由：占位返回 501 或未实现；实现时接 JWT/session。
- /api/v1/me、me/stats、orders、orders/:id、evidence、dispute、disputes 等：已挂载，部分占位；实现时按 04 §二 数据模型与 §四 风控补齐。
- 幂等键：API 已读取并回写 Idempotency-Key/X-Idempotency-Key；实现时在业务层做 key 去重与结果复用。

---

## 3. 前后端数据流与职责（对齐 01 §9、05、06）

| 数据 | 权威源 | 前端 | 后端 |
|------|--------|------|------|
| 用户、向导、订单列表、订单详情、争议 | **API（04）** | 仅通过 API 获取；不直接读链展示业务数据 | crates/api 提供；资金相关状态由链上事件驱动后写回 DB |
| 链上支付/质押/争议签名 | 用户钱包 | 前端 dapp 调 viem signTypedData / writeContract；EIP-712 domain 写死（09 §2.7） | 不代签；执行器代发裁决上链 |
| 已支付/终态展示 | 链上事件 + 对账 | 仅展示 API 返回的状态（01 §7 UI 事实） | Indexer/Projection 消费事件写回；API 读 DB |

---

## 4. 对齐检查清单（发版前或实现期）

**以下已按示例勾选**；发版前须逐项确认，与 [15 附录〇 发版前勾选总表](15-多维度文档与技术检查报告.md#发版前勾选总表) 第 16 项一致。

- [x] 合约 Solidity 实现后，ABI JSON 放入 **contracts/abi/**，并同步到 **frontend/dapp/abis/**（或构建引用）。
- [x] 前端 API 调用路径与 **frontend/lib/api.ts** 及 04 §三 一致；基地址来自 NEXT_PUBLIC_API_BASE_URL。
- [x] 前端 DApp 调合约时使用的 ABI 与部署合约版本一致；EIP-712 domain（chainId、verifyingContract）与 08-3/配置一致。
- [x] crates/api 路由与 04 §三 表一致（已挂载；实现时补齐业务逻辑）。
- [x] GET /meta 与前端版本绑定、fail-closed 逻辑已实现（05 §七点六）。
- [x] 三端联检（前端 -> 后端 -> 链上）已执行并留痕：**2026-04-07** 工程收口跑通 `SKIP_FORGE_VERIFY=1 ./scripts/pre-release-automation.sh`（含 `check-55-s13.sh`、`run-check-04-routes.sh` 串联）；留痕 `evidence/GO_20260407/pre-release-automation-run.log`；ABI 字节对齐子集见同次脚本输出。目标环境部署后仍须按变更抽样复核路径常量与部署合约版本。
- [x] 发版前执行 [14-附录-API与ABI对齐检查报告](14-附录-API与ABI对齐检查报告.md) 并确认无新增差异：**2026-04-07** 以机读预检 + 主链文档一致性为准闭环；若 PR 触及合约/ABI，须重跑附录报告并更新结论行。

---

## 5. 端口与本地启动对齐

| 项 | 约定 | 当前实现 | 对齐 |
|------|------|----------|------|
| **后端 API 端口** | PORT 环境变量，默认 **8080**（与前端默认基地址一致） | crates/api/src/main.rs 默认 8080；.env.example 已列 PORT | ✅ 一致 |
| **前端 API 基地址** | NEXT_PUBLIC_API_BASE_URL；未设时开发默认 `http://localhost:8080` | frontend/lib/api.ts 默认 localhost:8080；frontend/.env.example 已列 | ✅ 一致 |
| **前端开发端口** | Next.js dev 默认 **3012**（脚本约定） | scripts/README 与启动脚本统一使用 3012（`check-3000-and-start.bat` 文件名保留历史命名） | ✅ 一致 |
| **本地启动后端** | `cargo run -p traveltrust-api`；监听 0.0.0.0:PORT | startup/mod.rs bind(0.0.0.0:PORT) | ✅ 可启动 |
| **本地启动前端** | `cd frontend && npm run dev`（脚本通常拉起 3012） | 依赖 NEXT_PUBLIC_API_BASE_URL；CORS 由后端 CORS_ORIGINS 控制 | ✅ 可启动（生产须设 CORS_ORIGINS） |

**结论**：端口与本地启动**已对齐**；后端 8080、前端默认连 localhost:8080，可本地分别启动并联调 API。

---

## 6. 本地虚拟链、智能合约部署与可测试性

**部署顺序（硬约束）** 的完整叙述与换部署核对见 **[Runbook §2.56](../../ops/RUNBOOK.md)**（运维 SSOT）。本节从 **ABI / 本地可测试性** 列清单与建议步骤；验收句式与治理扩展同读 **[governance-token/02 §1.3](governance-token/02-对内技术规格-草案.md)**、**[82 §三附](82-治理币-文档总览.md)**、**[07 §五 5.2A](07-开发流程与顺序.md)**。**法务/对外定稿不替代** Runbook 所载工程顺序。

| 项 | 当前状态 | 说明 |
|------|----------|------|
| **是否可使用本地虚拟链** | **可用（手动启动）** | 仓库包含完整 Solidity 合约与 Foundry 配置（`contracts/foundry.toml`）；可按需使用 Anvil/测试网做链上联调。 |
| **智能合约实现** | **已实现** | `contracts/src/` 已有 `Escrow.sol`、`EscrowFactory.sol`、**Guide/Provider 身份质押池**（**`IdentityStakingPool`** 系）、`Registry.sol`、`FeeRouter.sol`、`RegionVault.sol`、**`SlashRouter.sol`**、**`ReserveVault.sol`**、`InvestorDistributionClaim.sol`、`GovernanceTimelock.sol`、`GovernanceTreasury.sol`、`MockERC20.sol` 等（**旧 `Staking.sol` 已移除**，见 **contracts/README**）。 |
| **ABI 入仓状态** | **已入仓（55-S13 字节对齐子集 + canonical 扩展）** | **`contracts/abi/`** 含 **Escrow … RegionVault**、**SlashRouter / ReserveVault**、治理栈 JSON 等（**`verify-abi-forge.py`** 全量校验）；**`frontend/dapp/abis/`** 与 **`contracts/abi/`** **字节一致** **子集** 仍按 **55-S13**（**不含** **SlashRouter/ReserveVault** **直至** **DApp** **直连** **）；`forge build` + **`scripts/sync-abi-from-forge`** 维护。 |
| **本地链上部署合约** | **可执行** | 可在本地链或测试网执行 Foundry 部署脚本（`contracts/script/Deploy.s.sol`）；部署后需同步更新 ABI 与地址配置。 |
| **本地全流程功能测试** | **API/前端可直接联调；链上流程可扩展联调** | API + 前端可本地启动验证 04 路由；链上 deposit/release/dispute 需准备 RPC、部署地址与钱包。 |

**建议执行顺序**：

1. 先跑 API + 前端（后端 8080、前端 3012）确认接口与页面流程。
2. **链上/合约联调**：**阶段顺序与硬约束** 以 **Runbook §2.56** 为准。技术上优先 **Anvil + `forge script`**（见 **contracts/README**）在本地跑通 **Escrow 主路径**，再按 Runbook 切换测试网并补齐 `CHAIN_RPC_URL`、`CHAIN_ID`、`ESCROW_FACTORY_ADDRESS`、执行器私钥等。含 **治理代币 / Governor** 等扩展时，本地须一并验收 **governance-token/02 §1.3** 所列项。
3. 每次合约变更后，重新生成并同步 `contracts/abi/*` 与 `frontend/dapp/abis/*`，再跑 14 附录对齐检查。

*本文与 01、02、04、05、06、09、contracts/README、[83](83-区域治理与收益分配-协议白皮书.md)/[84](84-第一阶段10国Country-Pool发行参数总表.md)（Target 经济参数）配套；合约与 ABI 实现后请更新 §1.1、§1.1.1、§1.2 具体方法/事件名。* 文档版本与最后更新见 [00-文档索引](00-文档索引.md)。
