# Governor → Timelock queue → execute — 单一证据入口（B-100 / B-089）

**TT-B100-GOVERNOR-TIMELOCK-QUEUE-EXECUTE-EVIDENCE-SSOT-001**

**B-119 证入口（仅指针）**：[`B-119-governor-timelock-queue-execute-ENTRY.md`](./B-119-governor-timelock-queue-execute-ENTRY.md)（**`TT-B119-GOVERNOR-TIMELOCK-QUEUE-EXECUTE-ENTRY-001`**）— **台账 / Runbook / 110** 互链收口；**不**替代本页正文，**禁止**另写第二套 queue→execute 流程。

**Scope**：链上治理 **`propose → vote → queue → (delay) → execute`**，其中 **`queue` / `execute`** 经 **`TravelTrustGovernor`** 与 **`GovernanceTimelock`**（**`scheduleByGovernor` / `execute`** 语义与合约一致）。  
**本文件**：仓库内该主题的**唯一**复现与验收叙述入口；**勿**再写第二套平行流程。

---

## 与 B-089 / B-090 的分工（禁止混用）

| 卡 | 语义 | SSOT |
|----|------|------|
| **B-089** | 合约与 Foundry：**Governor 全周期** + Timelock 延迟 + 读点断言 | 下文 **Primary SSOT** 测试与 `contracts/test/*.t.sol` |
| **B-090** | **只读**：前端 / Next 代理与 **`GET /api/v1/governance/proposals*`** 的展示与 JSON 对形（须 **`GOVERNOR_ADDRESS` + 投影库**） | `docs/verification-evidence/tt-07-b090-proposal-ui.json`；链上 **`queue`/`execute` 不以 UI 替代** |
| **B-100（本页）** | 运维/审计：**单一入口** — 前置条件、命令、预期、失败分支、验收方法 | 本 Markdown + Runbook §2.56 互链 |

**API / 索引器注意**：**B-089** 下 **`governance_proposals_projection`** + **`GET …/governance/proposals`** 反映链上 `state` 等（见 `docs/verification-evidence/tt-05-b089-governor-projection.json`）。**链上**执行 **`queue` / `execute`** 仍须按本文 Foundry 或生产多签/RPC 流程完成；**与** `POST …/internal/indexer-reconcile` 等 body 里的 **`…_rollback_execute`**（DB 链域清理）**完全不同对象**，禁止混读。

---

## 前置条件

1. **Foundry**：`forge` 在 `PATH` 中（或团队约定的 Docker Foundry 等价入口）。
2. **工作目录**：仓库根下 **`cd contracts`**（含 **`foundry.toml`**）。
3. **语义依赖**：测试内 **`GovernanceTimelock(deployer, 100)`** → 延迟 **100 秒**；**`tl.setGovernor(address(gov))`** 在提案前完成；**`FeeRouter.owner` = Timelock**（与生产「路由属 Timelock、提案改路由/所有权」一致）。细节以 **`contracts/test/TravelTrustGovernor.t.sol`** 的 **`setUp`** 为准，**不得**另假设延迟秒数或部署顺序。

---

## 主命令（Primary SSOT）

与 **`TravelTrustGovernor.t.sol`** 中 **`test_COMP_B089_governor_full_cycle_propose_vote_queue_execute`** 完全一致：

```bash
cd contracts
forge test --match-test test_COMP_B089_governor_full_cycle_propose_vote_queue_execute -vv
```

### 预期输出（验收）

- 进程退出码 **0**。
- 测试中已断言的读点（与源码同步，**以 `.t.sol` 为准**）：
  - **`gov.queue(pid)`** 后：**`ProposalState.Queued`**。
  - **`vm.warp(block.timestamp + 100)`** 后：**`gov.execute(pid)`** 成功，**`ProposalState.Executed`**。
  - 终态：**`router.owner() == newOwner`**（payload 为 **`FeeRouter.transferOwnership(newOwner)`**）。

---

## 失败分支（运维判读）

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `forge: command not found` | 未装 Foundry 或未进容器 | 安装 Foundry 或使用团队 Docker 镜像；**勿**用未文档化的替代编译器链冒充验收 |
| `Error: No tests match` | 未在 **`contracts/`** 或测试名被重命名 | 确认 cwd；以仓库 **`TravelTrustGovernor.t.sol`** 内函数名为准 |
| 测试 **FAIL** / revert | 合约或测试被改坏 | 对照本仓库 **B-089** 基线提交修复；**禁止**为「绿」删断言或换平行测试顶替 |
| 仅 B-090 UI 绿 | 只验证了只读 API/页面 | **不**构成 **`queue`→`execute`** 链上闭环；须补跑本页 **主命令** 或生产等价步骤 |

---

## 同语义扩展用例（可选，非第二套流程）

以下与 **B-089** 同一套 Governor/Timelock/FeeRouter 拓扑，仅 payload 或入口不同；**验收仍为一事：Succeeded → queue → delay → execute**。

```bash
cd contracts
# Governor 路径：`setRoutingConfig` payload
forge test --match-test test_TT_B089_governor_execute_set_routing_config_matches_payload -vv
```

**Timelock 直连**（无 Governor 投票段，验证 **`schedule` → delay → `execute`** 与 **`TooEarly`**）：

```bash
cd contracts
forge test --match-test test_b089_full_cycle_fee_router_transfer_ownership -vv
forge test --match-test test_COMP_B089_timelock_execute_set_routing_config -vv
```

---

## B-090 只读证据指针（与链上执行无关）

- **`docs/verification-evidence/tt-07-b090-proposal-ui.json`**：UI + Next `rewrites` + governance JSON 对形。  
- **不**替代本文 **forge** 或生产链上 **`queue` / `execute`**。

---

## 交叉链接

- **B-119 证入口（指针）**：[B-119-governor-timelock-queue-execute-ENTRY.md](./B-119-governor-timelock-queue-execute-ENTRY.md)（**`TT-B119-GOVERNOR-TIMELOCK-QUEUE-EXECUTE-ENTRY-001`**）。
- **Runbook**：[ops/RUNBOOK.md §2.56](../../ops/RUNBOOK.md)（权威表行 **Governor → Timelock queue/execute**、**B-119** → 本文件）。
- **合约 README**：[contracts/README.md](../../contracts/README.md)（**TravelTrustGovernor** / **GovernanceTimelock** 行与测试名）。
- **ABI / 模块叙事**：[docs/spec/14-合约-API-ABI-前后端对齐.md](../spec/14-合约-API-ABI-前后端对齐.md) §1.1 **TravelTrustGovernor** / **GovernanceTimelock**。
- **Governor 投影 HTTP 样例**：`docs/verification-evidence/tt-05-b089-governor-projection.json`（与 **B-089** API 语义一致；**非**本页链上执行替代物）。
