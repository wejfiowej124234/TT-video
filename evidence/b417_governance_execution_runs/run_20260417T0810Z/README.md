# Treasury.spend 最小闭环 · 真源证据包（Sepolia）

**角色**：本目录为 **`TT-TREASURY-SPEND-MINI-EVIDENCE-001`** 所述 **Treasury.spend 专用** 链上最小闭环的 **固定验收快照**（**非** 通用 B-417 任意提案占位目录）。

**状态**：**PASS**（`b417-evidence-pack-verify.sh` **exit 0**；报告 **`execution_verdict=GO`**、**`dry_run=false`**）。

**网络**：Sepolia **`chain_id=11155111`**。

---

## 机读真源（本目录）

| 文件 | 说明 |
|------|------|
| `b417-governance-execution-report.json` | B-417 报告：**`execution_steps`**、**`execution_verdict`** |
| `b417-chain-step-queue.json` | **queue** 侧车 |
| `b417-chain-step-execute.json` | **execute** 侧车 |

**核验（仓库根）**：

```bash
bash scripts/ops/b417-evidence-pack-verify.sh "evidence/b417_governance_execution_runs/run_20260417T0810Z"
jq '{execution_verdict, dry_run, execution_steps}' evidence/b417_governance_execution_runs/run_20260417T0810Z/b417-governance-execution-report.json
```

---

## 关键链上事实（勿与旧提案混用）

| 项 | 值 |
|----|-----|
| **Governor `proposalId`** | **`2`**（**Succeeded → queue → execute** 对应本包） |
| **勿用作本闭环** | **`proposalId=1`**：历史 id，链上多为 **Expired 等终态**；**不得**再写入 **`.env` 的 `B417_PROPOSAL_ID`** 冒充当前 Treasury.spend 验收 |
| **queue tx** | `0xad86bf07c1fad58989492b8ebe14f9512bbc8ad91019abb07127403e430a4d9b`（block **10676636**） |
| **execute tx** | `0xab38ea7849e11dab449460b613083f074656736f08b8436f1e7d9396cf8afa1d`（block **10676647**） |

**语义校验（execute 收据）**：**`GovernanceTreasury`** 上须见 **`TreasurySpent(address,address,uint256)`**（topic0 **`0x47b1b51d21fd9724fcc99dd15bddf76dc8520c1c54257f16ea63e42493e42cb1`**）。本闭环为 **ERC20 `spend`** 路径；**非** **`TreasuryEthSpent`**。

**报告生成时间（UTC）**：见 `b417-governance-execution-report.json` 内 **`generated_at_utc`**（**`2026-04-17T08:13:05Z`**）。

---

## 父级指针

固定入口：**[`../TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md`](../TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md)**  
Runbook：**[`docs/runbook/TT-TREASURY-SPEND-MINI-EVIDENCE-001.md`](../../../docs/runbook/TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)**  
测试网总验收叙述：**[`docs/runbook/TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md`](../../../docs/runbook/TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)**
