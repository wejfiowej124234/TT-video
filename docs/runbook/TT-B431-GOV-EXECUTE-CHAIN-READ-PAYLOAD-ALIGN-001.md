# TT-B431 · `execute` 后链上读数与 payload / Timelock operation 对拍

**卡号**：`TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001` · **母表** **B-431**  
**范围**：**合约层 Foundry SSOT**；**不**替代 **B-417** 测试网 **`queue`→`execute`** **真链封口**；**不**单独声称 **UI/DB** **已** **防伪造** **（** **API 观测并列** **见** **TT-B430** **）** **。**

---

## 1. 目的

在 **`Governor` → Timelock `execute`** **之后**，用 **Foundry** **断言**：**链上 getter** **（** **pool / treasury / 路由参数等** **）** **与** **提案** **`targets[]`/`calldatas[]`** **及** **Timelock** **`operations[]`** **一致** **。** **权威测试**：**`contracts/test/TravelTrustGovernor.t.sol`** · **`test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation`** **。**

---

## 2. 一键（本地 / CI）

```bash
cd contracts
forge test --match-test test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation -vv
```

**留证（可选）**：项目根执行 **`bash scripts/ops/b431-gov-execute-foundry-closeout.sh`** → **`evidence/b431_gov_execute_chain_read/run_<UTC>/`**（**`forge_b431.log`** **+** **`b431-closeout-record.json`** **）** **。**

---

## 3. 互证

- **证据入口**：[docs/verification-evidence/B-431-gov-execute-chain-read-payload-align-ENTRY.md](../verification-evidence/B-431-gov-execute-chain-read-payload-align-ENTRY.md)  
- **脚本**：[`scripts/ops/b431-gov-execute-foundry-closeout.sh`](../../scripts/ops/b431-gov-execute-foundry-closeout.sh)  
- **相邻 TT**：**TT-B430**（**reconcile ↔ overview** **API 层并列**）— [`TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001.md`](./TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001.md)
