# B-431 · `execute` 后链上读数与 payload / Timelock operation 对拍（证据入口）

**`TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001`**

## 目标

在 **`queue` →（Timelock `delay`）→ `execute`** 完成后，验证：

1. **`TravelTrustGovernor.getProposalActions(proposalId)`** 返回的 **targets / values / calldatas** 与提案创建时一致；
2. **`GovernanceTimelock.operations(queuedOpId)`** 中 **target / value / data** 与上述 **calldata** 一致，且 **`done == true`**；
3. **目标合约**（本用例为 **`FeeRouter`**）**getter 读数** 与 **calldata** 所编码参数一致。

**不新增 ABI**；**不改合约逻辑**；本入口为 **Foundry 对拍 SSOT**。

**边界**：**不**替代 **B-417** 测试网 **L3** 真 tx 封口；**不**以 mock 代替真链验收 **B-417**。**`governance_proposals_projection`** 终态与时间序属 **索引器/DB** 域，须另按 **B-089 / 110** 运维对读；本页仅钉死 **链上合约层** 字段级一致。

---

## 主命令（Primary SSOT）

```bash
cd contracts
forge test --match-test test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation -vv
```

**一键留证（项目根）**：**`bash scripts/ops/b431-gov-execute-foundry-closeout.sh`** → **`evidence/b431_gov_execute_chain_read/run_<UTC>/forge_b431.log`** **与** **`b431-closeout-record.json`** **。** **Runbook**：[docs/runbook/TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001.md](../runbook/TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001.md) **。**

### 预期

- 退出码 **0**。
- 断言定义见 **`contracts/test/TravelTrustGovernor.t.sol`** 内 **`test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation`**（以源码为准）。

---

## 交叉链接

- **Governor → Timelock 总入口**：[governor-timelock-queue-execute-evidence.md](./governor-timelock-queue-execute-evidence.md)（**B-100 / B-089**）。
- **同语义（仅 FeeRouter 热改路由，无 `getProposalActions`/Timelock 字段对拍）**：[governor-timelock-queue-execute-evidence.md](./governor-timelock-queue-execute-evidence.md) 一节 **`test_TT_B089_governor_execute_set_routing_config_matches_payload`**。
