# 89 / 81 / 84 与仓库合约·治理代码 · 对齐说明（工程真值）

**目的**：回答「规格已更新，仓库里的合约和治理相关代码是不是跟新版一致」——**在不上链的前提下**，说明 **单一真源** **与** **须由你方部署/环境** **承担** **的部分** **。**

**规格版本（文档内）**：**89** v2.0.8、**81** v2.1.2、**84** v1.0.19（**2026-04-16** 行附近）。**工程真值**仍以 **`contracts/`**、**`crates/api`**、**`frontend/`**、**`docs/spec/04`** **与** **`contracts/README.md`** **为准** **。**

---

## 1. 81 · 身份质押双池（Guide / Provider）

| 规格要求（摘要） | 仓库落点 |
|------------------|----------|
| **两池** `GuideIdentityStakingPool` / `ProviderIdentityStakingPool`，三账本叙事 | **`contracts/src/`** **`GuideIdentityStakingPool.sol`** **/** **`ProviderIdentityStakingPool.sol`** **+** **`StakeAccountingLib`** |
| **部署** | **`contracts/script/Deploy.s.sol`** **部署双池** **（** **与** **`Registry`** **/** **`FeeRouter`** **/** **`RegionVault`** **等** **同批** **）** **。**

**说明**：**主部署脚本** **不** **包含** **Governor** **/** **治理票合约** **（** **见** **下** **§4** **）** **。**

---

## 2. 84 / 83 · FeeRouter 路由、RegionVault、金库分轨

| 规格要求（摘要） | 仓库落点 |
|------------------|----------|
| 第一层 **45/55**、Global 内 **65/20/15**（与 83 对齐） | **`contracts/src/FeeRouter.sol`** **+** **`test/FeeRouter.t.sol`** |
| **Timelock `owner`**、**白名单** **`setAllowedExecutionTarget`** | **`GovernanceTimelock.sol`** **、** **`Deploy.s.sol`** **接线** |
| **RegionVault** **国家桶** **入账** **/** **forward** | **`RegionVault.sol`** **、** **indexer** **事件** |

**API / 观测**：**`FEE_ROUTER_ADDRESS`** **、** **`REGION_VAULT_ADDRESS`** **等** **来自** **`.env`** **，** **与** **`GET /meta` → `chain.contracts`** **同源** **。**

---

## 3. 89 · 治理 UI（产品 Target + 工程 Partial）

| 规格要求（摘要） | 仓库落点 |
|------------------|----------|
| **路由** **/** **SSOT** **门禁** | **`scripts/gates/check-b432-governance-ui-ssot-surface.py`** **+** **`npm run test:b432`** **（** **母表** **B-432** **）** |
| **提案** **/** **投票权** **链上** **观测** | **`04 §3.4`** **`GET …/governance/proposals*`** **、** **`crates/api/src/chain/governor.rs`** **`getPastVotes` / `state`** |
| **文档自陈** **：** **HTTP** **详情** **可能** **不** **返回** **完整** **`targets[]`/`calldatas[]`** **，** **UI** **不** **编造** | **见** **`89`** **文内** **Partial** **段** **；** **与** **实现** **差异** **以** **代码** **为准** |

**89** **是** **产品** **IA** **Target** **；** **不是** **「链上已部署最新 Governor」** **的** **证明** **。**

---

## 3.1 环境变量名（已核对 2026-04-16）

- **API / 七键** **SSOT** **：** **`GOVERNANCE_TOKEN_ADDRESS`** **（** **`.env.example`** **）** **。**
- **Forge** **`SepoliaProposeMinimal`** **/** **`SepoliaDelegateSelf`** **：** **已** **支持** **`GOVERNANCE_TOKEN_ADDRESS`** **优先** **，** **未设时** **回退** **`GOVERNANCE_VOTES_TOKEN_ADDRESS`** **（** **旧** **文档** **别名** **）** **；** **`b417-sepolia-propose-vote-succeeded.sh`** **会** **导出** **别名** **以免** **仅** **配** **七键** **时** **`forge script`** **失败** **。**
- **ABI** **：** **`scripts/dev/sync-abi-from-forge.sh`** **已将** **`GovernanceVotesToken`** **/** **`TravelTrustGovernor`** **写入** **`contracts/abi/`** **并由** **`verify-abi-forge.py`** **与** **`forge build`** **对拍** **；** **与** **测试网** **字节码** **是否** **一致** **仍** **须** **Explorer** **/** **`cast`** **并列** **（** **见** **RUNTIME** **清单** **）** **。**

---

## 4. 治理币（TTG / GovernanceVotesToken）与 Governor —— 与主部署脚本的关系

**事实（** **`contracts/README.md`** **与** **源码** **一致** **）** **：**

- **`script/Deploy.s.sol`** **只** **部署** **订单** **/** **质押** **/** **FeeRouter** **/** **Timelock** **/** **Treasury** **/** **ReserveVault** **等** **，** **不** **部署** **`TravelTrustGovernor`** **或** **`GovernanceVotesToken`** **。**
- **完整治理栈（Votes + Timelock + Governor）** **须** **单独** **执行** **`script/DeployGovernanceStack.s.sol`** **，** **再把** **`GOVERNOR_ADDRESS`** **/** **`GOVERNANCE_TOKEN_ADDRESS`** **写入** **`.env`** **。**

因此：**「最新智能合约」** **在** **链上** **是否** **最新** **=** **你** **最后一次** **`forge script … --broadcast`** **的** **结果** **+** **`.env`** **是否** **已** **更新** **；** **不是** **仓库** **里** **某次** **AI** **对话** **能** **代替** **钱包** **部署** **的** **。**

---

## 5. 我（助手）不可能替你完成的部分

- **使用** **你的** **私钥** **在** **测试网** **/** **主网** **部署** **或** **发交易** **。**
- **在未提供** **可访问** **RPC** **与** **授权** **的** **环境** **里** **「跑一遍** **所有** **链上** **功能** **」。**

**你方** **在** **测试网** **的** **推荐** **最小** **闭环** **（** **与** **现有** **脚本** **一致** **）** **：**

1. **`cd contracts && forge test`** **（** **全量** **合约** **回归** **）** **。**
2. **根目录** **`cargo test -p traveltrust-api`** **、** **`bash scripts/run-check-04-routes.sh`** **（** **含** **B-432** **表面** **）** **。**
3. **配置** **`.env`** **后** **：** **API** **联调** **`b414`** **/** **`b430`** **/** **`b431`** **留证** **脚本** **（** **见** **[README.md](README.md)** **）** **。**
4. **链上** **Governor** **：** **`DeployGovernanceStack`** **→** **填** **`.env`** **→** **`b417-*`** **/** **`evidence/b417_governance_execution_runs/README.md`** **。**

更细的 **「** **防旧地址** **」** **cast** **自检** **：** **[RUNTIME_CHAIN_SSOT_CHECKLIST.md](RUNTIME_CHAIN_SSOT_CHECKLIST.md)** **。**
