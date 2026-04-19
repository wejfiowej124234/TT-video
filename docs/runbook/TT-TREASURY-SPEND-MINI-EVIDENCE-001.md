# TT-TREASURY-SPEND-MINI-EVIDENCE-001 · Treasury.spend 专用链上证据最小闭环

**定位**：在 **[线 B 一页式清单](TT-LINE-B-GOVERNANCE-EXECUTION-CHECKLIST.md)** 之上，把 **「治理执行」** 收窄为 **唯一链上效果 = `GovernanceTreasury.spend`（或 `spendETH`）** 的最小可审计闭环。与 **线 A**（FeeRouter / 分轨语义）**正交**：线 A 验「入口与科目」；本卡验「金库对外划出经 Governor → Timelock → execute」。

**权威交叉引用**：**[TT-B417](TT-B417-GOVERNANCE-EXECUTION-AUTOMATION-L3-001.md)**（证据包 schema、`execution_verdict=GO`）、**[TT-B434](TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md)**（唯一 Timelock）、**[governance-token/02 §4.4～§4.7](../spec/governance-token/02-对内技术规格-草案.md)**、**[91 §4.3](../spec/91-协议金库与资金池-技术索引.md)**（金库用途边界）、**`contracts/src/GovernanceTreasury.sol`**（`TreasurySpent` 事件）。

**不重复**：环境缺口扫描、`runtime-chain-ssot`、`b417-*` 一键命令 —— 一律沿用线 B 清单 **Step 0～8**；本文件只写 **提案载荷** 与 **Treasury 专用 PASS/FAIL**。

---

<a id="treasury-spend-shortest-run"></a>

## 0 · 最短执行路径（按序跑，免翻其它文档）

**仓库根**、根 **`.env`** 已填 **RPC / Governor / Treasury / spend 参数 / 私钥**（勿提交私钥）。

### Step 1 — 生成可执行提案（Succeeded）

```bash
bash scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh
```

**必须成立**：已生成 **`PROPOSAL_ID`**（脚本 stderr 会打 **`new PROPOSAL_ID=…`**）；**`cast call … state(proposalId)` = `4`（Succeeded）**。

### Step 2 — 写入 proposal id

```bash
export B417_PROPOSAL_ID=<上一步 id>
# 建议同时写入根 .env，供后续脚本 source
```

**B-417** 链上执行还须 **`B417_PRIVATE_KEY`**（或 **`PRIVATE_KEY`**，以 **`b417-env-gap-check.sh`** 与 **`.env.example`** 为准）。

### Step 3 — 链上 queue/execute + 落盘证据

```bash
bash scripts/ops/b417-env-gap-check.sh
bash scripts/ops/b417-sepolia-preflight.sh
bash scripts/ops/b417-run-onchain-evidence.sh
```

默认 **`B417_RECORD_DIR=$PWD/evidence/b417_governance_execution_runs/run_<UTC>/`**（由上一步创建）。若手开多窗，可：`export B417_RECORD_DIR=$(ls -td evidence/b417_governance_execution_runs/run_* 2>/dev/null | head -1)`。

### Step 4 — 验证证据包

```bash
bash scripts/ops/b417-evidence-pack-verify.sh "$B417_RECORD_DIR"
```

### Step 5 — 确认 PASS（人工 + 机读）

| 检查项 | 要求 |
|--------|------|
| 报告 | **`jq`** **`b417-governance-execution-report.json`**：**`execution_verdict == "GO"`**，**`dry_run == false`** |
| 事件 | **`execute` 成功 tx** 收据中存在 **`TreasurySpent(token,to,amount)`**（**`spendETH`** 路径为 **`TreasuryEthSpent`**）— 不可仅看「tx success」 |
| 门禁 | **`b417-evidence-pack-verify.sh`** **exit code = 0** |

```bash
jq '{execution_verdict, dry_run}' "$B417_RECORD_DIR/b417-governance-execution-report.json"
```

### 最易踩的 3 个坑

| # | 坑 | 后果 |
|---|-----|------|
| 1 | 用 **`transfer` 提案冒充 `spend`**（**target = token 合约**） | 本 Runbook **FAIL**（非 Treasury 专用路径） |
| 2 | **`GOVERNANCE_TOKEN_ADDRESS` ≠ 金库内实际持有的 token**（与 prefund / 提案 `token` 不一致） | **propose / vote 成功，`execute` 时 `spend` revert** |
| 3 | **未核对 `TreasurySpent` / `TreasuryEthSpent`** | 仅确认 tx 成功 **不足以** 声称金库支出语义闭环 |

### 对外一句（测试网全链路叙事）

测试网已完成从 **FeeRouter 收入分配**到 **GovernanceTreasury**、再以 **Treasury.spend 专用提案**经 **Timelock** 执行并落 **B-417 证据包**的全链路验证；**PASS** 与链上细节可按 **`$B417_RECORD_DIR`** 与区块浏览器复核。

### 已落盘真源（Sepolia · Treasury.spend 专用 · PASS）

**固定验收目录（勿与任意 `run_*` 或旧提案 id 混用）**：

- **[`evidence/b417_governance_execution_runs/run_20260417T0810Z/README.md`](../../evidence/b417_governance_execution_runs/run_20260417T0810Z/README.md)**（机读侧车 + 报告 + **核验命令**）
- 父级指针：**[`evidence/b417_governance_execution_runs/TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md`](../../evidence/b417_governance_execution_runs/TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md)**

| 关键事实 | 值 |
|----------|-----|
| **`proposalId`（本闭环）** | **`2`** |
| **误用提示** | **`proposalId=1`** 等为历史 id，链上终态常为 **Expired** 等；**不得**写入 **`.env` 的 `B417_PROPOSAL_ID`** 作为本卡当前验收锚点 |
| **queue tx** | `0xad86bf07c1fad58989492b8ebe14f9512bbc8ad91019abb07127403e430a4d9b` |
| **execute tx** | `0xab38ea7849e11dab449460b613083f074656736f08b8436f1e7d9396cf8afa1d` |
| **`TreasurySpent` topic0（ERC20 `spend`）** | `0x47b1b51d21fd9724fcc99dd15bddf76dc8520c1c54257f16ea63e42493e42cb1`（**`TreasuryEthSpent`** 仅 ETH 路径） |

测试网总验收并列叙述：**[`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417`](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)**。

---

## 1. 前置（在跑线 B Step 0～3 之后）

| # | 条件 | 说明 |
|---|------|------|
| P1 | **`Treasury.spender() == TIMELOCK_ADDRESS`** | 与线 B **Step 3 · R3** 一致；否则 **`spend` 无法由治理路径触达**。 |
| P2 | **金库余额 ≥ 拟划出 `amount`** | **`GovernanceTreasury`** 持有足够 **`token`**；`spend` **拒绝** `amount==0`（见合约）。 |
| P3 | **Allowlist（若 `erc20SpendAllowlistEnabled`）** | **`erc20SpendAllowed[token] == true`**；否则 `spend` 会 `Erc20SpendNotAllowed`。 |
| P4 | **目标收款 `to`** | 非零地址；**不得**将本卡用于把 **Escrow 用户本金** 误从金库划出（**91 / 02 §4.7**；见下文 FAIL **F5**）。 |
| P5 | **`Governor` 单提案单操作** | 当前 **`TravelTrustGovernor`** 每提案 **一条** `execute` 目标为宜；本最小闭环 **单 target = `TREASURY_ADDRESS`**。 |

---

## 2. 提案载荷（Propose · calldata SSOT）

**目标合约**：**`TREASURY_ADDRESS`**（与 **`GET /meta` → `chain.contracts.treasury_address`** 同源）。

**ERC20 路径（推荐最小）**：

- **selector**：`spend(address,address,uint256)`
- **建议构造**（Foundry / cast 思路）：  
  `abi.encodeWithSignature("spend(address,address,uint256)", token, to, amount)`
- **Governor.propose**：  
  `targets[0] = TREASURY_ADDRESS`，`values[0] = 0`，`calldatas[0] = <上一步 bytes>`，`description` 须可读说明「Treasury.spend 最小证据」。

**原生币路径（可选替代）**：**`spendETH(address,uint256)`** —— 设 **`TREASURY_SPEND_MODE=ETH`**；金库须持有足额 **ETH**。

### 2.1 仓库固定脚本（可跑）

| 产物 | 说明 |
|------|------|
| **`contracts/script/SepoliaProposeTreasurySpend.s.sol`** | 单步 **`propose`**：`targets[0]=TREASURY_ADDRESS`，calldata = **`spend`** 或 **`spendETH`** |
| **`scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh`** | **propose → castVote(For) → 等待 `state=4`**；读根 **`.env`**，与 **B-417** 衔接 |

**环境变量（与脚本内注释一致）**

| 变量 | 必须 | 说明 |
|------|------|------|
| **PRIVATE_KEY** | ✅ | 提案人 / 投票人（须过 **`proposalThresholdVotes`**） |
| **CHAIN_RPC_URL** | ✅ | 传给 **`forge script --rpc-url`** |
| **GOVERNOR_ADDRESS** | ✅ | |
| **TREASURY_ADDRESS** | ✅ | |
| **TREASURY_SPEND_TO** | ✅ | 收款地址 |
| **TREASURY_SPEND_AMOUNT** | ✅ | wei / token 最小单位（>0） |
| **GOVERNANCE_TOKEN_ADDRESS** | ERC20 时 ✅ | `spend(token,…)` 的 **token**（金库内须持有该 token） |
| **TREASURY_SPEND_MODE** | 可选 | **`ERC20`**（默认）或 **`ETH`** |
| **TREASURY_SPEND_SKIP_PREFUND** | 可选 | 设为 **1** 时跳过「从钱包向金库转入 ERC20」预充（默认会尝试预充，便于 **`execute` 时 `spend` 成功**） |

**仅 propose（广播一条）**：

```bash
cd contracts
export PRIVATE_KEY=… CHAIN_RPC_URL=… GOVERNOR_ADDRESS=… TREASURY_ADDRESS=… \
  GOVERNANCE_TOKEN_ADDRESS=… TREASURY_SPEND_TO=… TREASURY_SPEND_AMOUNT=…
forge script script/SepoliaProposeTreasurySpend.s.sol:SepoliaProposeTreasurySpend \
  --rpc-url "$CHAIN_RPC_URL" --broadcast -vvv
```

**propose + vote + 等到 Succeeded**（推荐）：

```bash
# 仓库根；变量写入 .env 或 export
bash scripts/ops/b417-sepolia-treasury-spend-propose-vote-succeeded.sh
```

成功后把输出的 **`B417_PROPOSAL_ID`** 写入 **`.env`**，再按 **[线 B Step 5～8](TT-LINE-B-GOVERNANCE-EXECUTION-CHECKLIST.md#step-5--sepolia-预检)** 跑 **preflight → `b417-run-onchain-evidence.sh` → `b417-evidence-pack-verify.sh`**。

**对照**：**`SepoliaProposeMinimal.s.sol`** 仍为 **TTG `transfer`** 演示，**不**替代本脚本。

---

## 3. 链上阶段清单（Propose → Vote → Queue → Execute）

| 阶段 | 须留痕什么 | 最低期望 |
|------|------------|----------|
| **Propose** | **`proposalId`**、链上 tx、`targets[0]` / `calldatas[0]` 可复算 | `proposalId` 可查询；calldata 解码为 **`TREASURY.spend`**（或 **`spendETH`**） |
| **Vote** | 投票 tx（或委托后单次 cast） | 法定人数与投票期满足 Governor 规则，进入 **`Succeeded`** |
| **Succeeded** | `state(proposalId) == 4` | 与线 B **Step 4～5** 一致 |
| **Queue** | **`b417-chain-step-queue.json`**（或等价） | **`status=success`** 的 **`tx_hash`**；Timelock **eta** 可算 |
| **Execute** | **`b417-chain-step-execute.json`** | **`status=success`**；**`msg.sender`** 侧为 Timelock 编排允许的执行方 |

**一键落盘**：线 B **Step 6** **`bash scripts/ops/b417-run-onchain-evidence.sh`**（或 **`b417-governance-execution-automation.sh`**，`B417_CHAIN_MODE=1`），**`B417_PROPOSAL_ID`** 填 **本提案**。

---

## 4. Treasury 专用核验（提案外「多两条」）

在 **`execute` 成功交易** 上：

| # | 动作 | 期望 |
|---|------|------|
| T1 | 收据中 **`TreasurySpent(token, to, amount)`**（或原生路径等价事件） | **emit** 与提案 **`token`/`to`/`amount`** 一致 |
| T2 | **`from`** 为 **`TREASURY_ADDRESS`** 的 **ERC20 `Transfer`**（若 `spend` ERC20） | 与金库余额减少一致（可选区块浏览器 / `cast logs` 抽样） |

**只读解码示例（可复制）**：

```bash
# 将 EXEC_TX 换为本轮 execute 成功 tx
cast receipt "$EXEC_TX" --rpc-url "$CHAIN_RPC_URL" | jq '{status, logs: .logs | length}'
# 进一步：按 Treasury 地址 filter topics / 用 explorer 核对 TreasurySpent
```

---

## 5. 证据包（与 TT-B417 对齐）

**目录**：**`evidence/b417_governance_execution_runs/run_<UTC>/`**（由线 B Step 6 生成）。

| 文件 | 须满足 |
|------|--------|
| **`b417-governance-execution-report.json`** | **`execution_verdict == "GO"`**；**`dry_run == false`** |
| **`b417-chain-step-queue.json` / `b417-chain-step-execute.json`** | 真实 **`tx_hash`**，**成功** |
| **（建议）** `treasury_spend_payload.txt` 或 README 片段 | 记录 **`proposalId`**、**`targets[0]`**、**`calldatas[0]`** 的 **hex** 或 **cast 解码结果**，便于第三方复算 **= spend(token,to,amount)** |

**门禁**：

```bash
bash scripts/ops/b417-evidence-pack-verify.sh "$B417_RECORD_DIR"
```

**期望**：退出码 **0**（与线 B **Step 8** 相同）。

---

## 6. PASS / FAIL 判据（Treasury.spend 最小闭环）

### PASS（本卡 + 线 B）

须**同时**满足：

1. 线 B **Step 0～8** 全部满足（含 **`b417-evidence-pack-verify` PASS**）。
2. 该轮 **`proposalId`** 对应的 **`targets[0]`** **等于** **`TREASURY_ADDRESS`**（与 **`/meta`** 同源）。
3. **`calldatas[0]`** 解码为 **`spend(address,address,uint256)`**（或本文件允许的 **`spendETH`**），且参数与台账披露一致。
4. **`execute` 成功** 且链上可核对 **`TreasurySpent`**（**§4 · T1**）。
5. **用途与边界**：与 **91 / 02 §4.7** 一致 —— **非**「把 Escrow 用户本金误当金库运营池划出」；若收款方/金额属于争议范围，须在台账另行披露（本卡不断言商务合法性，只验 **技术路径**）。

### FAIL

任一条即 **FAIL**（**不得**对外称「Treasury.spend 治理最小闭环已封口」）：

| ID | 情形 |
|----|------|
| F1 | 无 **`execution_verdict=GO`** 或 **`b417-evidence-pack-verify`** 非 0 |
| F2 | **`Treasury.spender() ≠ TIMELOCK_ADDRESS`**（线 B R3 已 FAIL） |
| F3 | 提案 **未** 以 **`TREASURY.spend` / `spendETH`** 为唯一效果（例如误用 **`SepoliaProposeMinimal` 的 TTG `transfer`** 冒充本卡） |
| F4 | **`execute` 无 `TreasurySpent`** 或与提案参数不一致 |
| F5 | 明知违反 **91/02** 金库用途仍用 **`spend`** 划用户托管本金（**流程 FAIL**，与工具 PASS 无关） |

### 与「仅线 B 通用 GO」的差别

**线 B 通用 PASS** 允许「任意 Timelock 可执行目标」的 **`queue/execute` GO**。**本卡 PASS** 额外要求 **F2～F4**，确保证据链对应 **`GovernanceTreasury.spend`**，而非仅 Governor 机械执行成功。

---

## 7. 与线 B 清单的映射

| 线 B | 本卡 |
|------|------|
| Step 0～5 | 原样执行；**Step 4** 选的 **`proposalId`** **须**为 **§2 载荷** 提出的 ID |
| Step 6～8 | 原样；**§4～§5** 为 Treasury **附加核验** |
| 总判据 | 线 B PASS **且** **§6 PASS** → **Treasury.spend 最小闭环 PASS** |

---

**文档版本**：1.2.0 · **2026-04-17** — 增 **§0 最短执行路径**（[#treasury-spend-shortest-run](#treasury-spend-shortest-run)）、PASS 核对、三坑、对外一句
