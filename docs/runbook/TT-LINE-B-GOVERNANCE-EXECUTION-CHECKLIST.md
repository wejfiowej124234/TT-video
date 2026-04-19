# 线 B · 一页式验收清单（Governor / Timelock / GovernanceTreasury 执行链）

**定位**：与 **线 A**（`FeeRouter` + `GET /meta` + 分轨 A/B 观测，见 `evidence/GO_20260417_line_a_minimal/artifacts/run_line_a_validation.sh`）**正交**。线 B 验收 **治理执行闭环**：**配置/只读对齐** → **`queue` / `execute` 真链证据** → **`GovernanceTreasury.spend` 权限边界**。

**权威交叉引用**（不重复长文）：**[TT-B417](TT-B417-GOVERNANCE-EXECUTION-AUTOMATION-L3-001.md)**（L3 GO）、**[TT-B434](TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md)**（Timelock 真源裁断）、**[governance-token/02 §4.4～§4.7](../spec/governance-token/02-对内技术规格-草案.md)**（执行链路 SSOT + 金库分轨）、**[91 §4.3](../spec/91-协议金库与资金池-技术索引.md)**（`GovernanceTreasury` 用途边界）。**Treasury.spend 专用最小闭环（提案载荷 + PASS/FAIL）** → **[TT-TREASURY-SPEND-MINI-EVIDENCE-001](TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)**。

---

<a id="testnet-acceptance-2026-04-17"></a>

## 测试网当前版本 · 对外口径（2026-04-17）

测试网当前版本已完成最新真值统一：运行时入口统一到 3012，/meta 正常，线 A 已在最新环境下重跑通过，B-434 当前裁断已升级为 v3；后续只剩 Treasury.spend 专用治理路径与更完整前端联调待补证据。

| 项 | 指针 |
|----|------|
| 线 A 最小证据 | [`evidence/GO_20260417_line_a_minimal/`](../../evidence/GO_20260417_line_a_minimal/) |
| B-434 机读真源 | [`evidence/timelock_truth_arbitration/decision_record.v3.json`](../../evidence/timelock_truth_arbitration/decision_record.v3.json) |
| **仍待补证（线 B / 产品向）** | 专用链上路径：**`GovernanceTreasury.spend`**（经 Governor → Timelock → execute，与本清单 R3～、**TT-B417** 并列）— 见 **[TT-TREASURY-SPEND-MINI-EVIDENCE-001](TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)**；更完整全栈联调与 **TT-B435** 类「真扣款 + 观测」封口证据；可选人工前端点验与 B-435 类脚本证据 |

**下一步（择一推进）**：① 按下方步骤补 **Treasury.spend** 链上证据与观测并列；② 若仅需对外同步结论：以上段落可直接作状态说明，**不必**再扩线 A 脚本范围。

---

## 执行版（命令 + 期望输出 + FAIL 含义）

与线 A 脚本相同习惯：仓库根执行；`set -a && [ -f .env ] && . ./.env && set +a` 按需加载 **`.env`**（勿提交私钥）。

---

### Step 0 · 前置（台账与边界）

| 动作 | 期望 | FAIL 含义 |
|------|------|-----------|
| 对照 **[TT-B434 §2](TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md)** 与 `evidence/timelock_truth_arbitration/` | 全环境 **仅一套** `TIMELOCK_ADDRESS` / `GOVERNOR_ADDRESS` 叙事 | **两套 Timelock 真源混用** 仍继续验收 |
| 牢记线 B **不**验收 **FeeRouter `distribute`**；**不**用 B-416 封口替代 B-417 GO（**TT-B417 §1**） | 文档/口头不把 B-416 当治理执行证据 | 把 **416** 与 **417** 混为一谈 |

---

### Step 1 · 缺口扫描（不发交易）

```bash
bash scripts/ops/b417-env-gap-check.sh
```

- **期望**：**退出码 0**；输出中 **无 `[FAIL]`**（可有 `[WARN]`，按脚本提示处理）。
- **FAIL 含义**：缺 **`.env`**、缺 **`CHAIN_RPC_URL` / `GOVERNOR_ADDRESS` / `B417_PROPOSAL_ID` / 执行私钥**、或缺 **cast / jq / Python** → **勿**跑预检与一键链上证据，先补环境。

可选只读链上探针（须已填 RPC + Governor + proposal id）：

```bash
B417_GAP_CHAIN_PROBE=1 bash scripts/ops/b417-env-gap-check.sh
```

- **期望**：探针段落与 `CHAIN_ID`、`state(proposalId)` 一致。
- **FAIL 含义**：RPC 不通、地址错、`state` 与预期不符。

---

### Step 2 · `/meta` 与链上七键对齐（只读）

```bash
bash scripts/ops/runtime-chain-ssot-cast-verify.sh
```

- **期望**：**退出码 0**（根 `.env` 七键与 **`GET /meta` → `chain.contracts`** 一致）。
- **FAIL 含义**：配置与 **`/meta`** 漂移 → 后续 cast 与 API 投影不可信。

---

### Step 3 · Governor / Timelock / Treasury 只读三角

（须 **`CHAIN_RPC_URL`** + **`cast`**。）

```bash
echo "=== R1 Governor.timelock ==="
cast call "$GOVERNOR_ADDRESS" "timelock()(address)" --rpc-url "$CHAIN_RPC_URL"
echo "=== R2 Timelock.delay (seconds) ==="
cast call "$TIMELOCK_ADDRESS" "delay()(uint256)" --rpc-url "$CHAIN_RPC_URL"
echo "=== R3 Treasury.spender ==="
cast call "$TREASURY_ADDRESS" "spender()(address)" --rpc-url "$CHAIN_RPC_URL"
```

- **期望**：**R1** 输出地址 **等于** **`TIMELOCK_ADDRESS`**（并与 **`/meta`** 同键）；**R2** 为正整数秒、与运维台账一致；**R3** 输出 **等于** **`TIMELOCK_ADDRESS`**（**B-090**：金库 **`spend` / `spendETH` 仅 `spender`**）。
- **FAIL 含义**：**Governor 指错 Timelock**、**Treasury.spender 非 Timelock** 且无书面豁免、**delay** 与宣称矛盾。

可选与链上对拍提案状态：

```bash
cast call "$GOVERNOR_ADDRESS" "state(uint256)(uint8)" "$B417_PROPOSAL_ID" --rpc-url "$CHAIN_RPC_URL"
```

- **期望**：执行 **queue** 前为 **`4`（Succeeded）**；**queue** 后为 **`5`（Queued）**（见 **[evidence/b417_governance_execution_runs/README.md](../../evidence/b417_governance_execution_runs/README.md)**）。
- **FAIL 含义**：无 **`state=4`** 的 id 却宣称可跑通 **queue→execute** 证据。

---

### Step 4 · 选题案 id（无私钥）

```bash
bash scripts/ops/b417-list-proposal-states.sh
```

- **期望**：输出中至少一行 **`state` 为 `4`**（Succeeded）；将对应 **`proposal_id`** 写入 **`.env`** 的 **`B417_PROPOSAL_ID`**。
- **FAIL 含义**：**无 `state=4`** 却强行填 id 或宣称线 B 已完成。

---

### Step 5 · Sepolia 预检

```bash
bash scripts/ops/b417-sepolia-preflight.sh
```

- **期望**：**退出码 0**（默认要求 **`state=4`**、执行地址 **native 余额非 0** 等，见脚本头注释）。
- **FAIL 含义**：预检失败仍 **`B417_CHAIN_MODE=1`** 广播 → 可能浪费 gas 或失败。

已 **`queue`**（**`state=5`**）复跑时：

```bash
B417_ALLOW_QUEUED_PREFLIGHT=1 bash scripts/ops/b417-sepolia-preflight.sh
```

- **期望**：预检接受 **`state∈{4,5}`**；若需 **`execute`** 侧车而无 **`b417-chain-step-queue.json`**，按 README 设 **`B417_QUEUE_TX_HASH`**。
- **FAIL 含义**：**`state` 与脚本假设不符** 仍继续一键证据。

---

### Step 6 · 一键链上证据（queue → execute → report）

```bash
bash scripts/ops/b417-run-onchain-evidence.sh
```

（等价：`export B417_CHAIN_MODE=1` 后 `bash scripts/ops/b417-governance-execution-automation.sh`；默认写入 **`evidence/b417_governance_execution_runs/run_<UTC>/`**。）

- **期望**：脚本 **退出码 0**；目录内存在：
  - **`b417-chain-step-queue.json`**、**`b417-chain-step-execute.json`**（真实 **`tx_hash`**，**`status=success`**）
  - **`b417-governance-execution-report.json`**
- **FAIL 含义**：无 **`run_*`** 目录、中途 abort、侧车缺失或 **伪造 tx**。

---

### Step 7 · 合并报告门禁（与 TT-B417 §3 一致）

```bash
jq '{execution_verdict, execution_steps}' "$B417_RECORD_DIR/b417-governance-execution-report.json"
```

- **期望**：**`execution_verdict`** = **`GO`**；**`execution_steps`** 中 **无** **`skipped` / `partial` / `unknown`**（细则见 **TT-B417 §3**）。
- **FAIL 含义**：**`execution_verdict` ≠ GO** → **不得**对外称线 B 链上封口。

---

### Step 8 · 证据包合规（归档硬门槛）

```bash
bash scripts/ops/b417-evidence-pack-verify.sh "$B417_RECORD_DIR"
```

- **期望**：**退出码 0**；摘要 **无 `[FAIL]`**（侧车形态、**`dry_run=false`**、schema 等）。
- **FAIL 含义**：verify **失败** → 该 **`run_*`** **不能**作为审计主锚。

---

### Step 9 · 叙事与合约边界（非单条 shell）

| 检查 | 期望 | FAIL 含义 |
|------|------|-----------|
| **S1** `GovernanceTreasury` **`onlySpender`** | 阅读 **`contracts/src/GovernanceTreasury.sol`**；链上 **`spender()`** 与 Step 3 **R3** 一致 | 金库支出路径与 Timelock 裁断冲突 |
| **S2** 治理路径 | 目标提案 **calldata** 与 **`TreasurySpent`**（或等价事件）可对读 | **execute** 触达路径不明或伪造 |
| **S3** Allowlist（若启用） | **`erc20SpendAllowlistEnabled`** 与 **`erc20SpendAllowed[token]`** 与业务一致 | 误放行/误拒 token |
| **S4** 与 **91 / 02 §4.7** | **Escrow 用户本金** **不得**经 **`GovernanceTreasury.spend`** 直接划付；与 **FeeRouter 分轨** **不混科目** | 把 Treasury 当订单费池或用户托管默认归集点 |

---

## 最小环境一轮（stub，非链上封口）

**目的**：验证工具链与 **schema/validate** 通路；**不**产生真链 GO 包。

```bash
export B417_RECORD_DIR="evidence/b417_governance_execution_runs/run_$(date -u +%Y%m%dT%H%MZ)_stub"
mkdir -p "$B417_RECORD_DIR"
unset B417_CHAIN_MODE
bash scripts/ops/b417-governance-execution-automation.sh
jq '{execution_verdict, dry_run}' "$B417_RECORD_DIR/b417-governance-execution-report.json"
bash scripts/ops/b417-evidence-pack-verify.sh "$B417_RECORD_DIR" || true
```

- **期望**：自动化 **退出码 0**；**`execution_verdict`** = **`GO`**；**`dry_run`** = **`true`**；**`b417-evidence-pack-verify`** **退出码 1**（缺侧车、**`dry_run` 非 false**）。
- **FAIL 含义**：若把该轮当 **线 B 链上完成** → **错误**（README：**stub 非「真实链证据」**）。

---

## 总判据（线 B PASS / FAIL）

**PASS（线 B）**：Step 0～9 满足；存在 **`evidence/b417_governance_execution_runs/run_<UTC>/`** 且 **Step 8** **`b417-evidence-pack-verify` PASS**（无私钥入库）。

**FAIL**：Timelock 双源、**/meta 与 cast 不一致**、**无 `execution_verdict=GO` 的真链证据包**、**Treasury.spender 非 Timelock 且无台账**、或 **金库用途与 91/02 §4.7 冲突**。

**部分完成（不得对外称线 B 封口）**：仅完成只读步骤、或仅 **stub**、或 **`execution_verdict` ≠ GO** 或 **evidence-pack-verify FAIL**。

---

## 参考命令（只读速查）

```bash
cast call "$TIMELOCK_ADDRESS" "delay()(uint256)" --rpc-url "$CHAIN_RPC_URL"
cast call "$GOVERNOR_ADDRESS" "timelock()(address)" --rpc-url "$CHAIN_RPC_URL"
cast call "$TREASURY_ADDRESS" "spender()(address)" --rpc-url "$CHAIN_RPC_URL"
cast call "$GOVERNOR_ADDRESS" "state(uint256)(uint8)" "$B417_PROPOSAL_ID" --rpc-url "$CHAIN_RPC_URL"
```

---

**文档版本**：1.2.1 · **2026-04-17** — 互指 **[TT-TREASURY-SPEND-MINI-EVIDENCE-001](TT-TREASURY-SPEND-MINI-EVIDENCE-001.md)**（Treasury.spend 最小闭环）；执行版（命令 + 期望 + FAIL）与线 A 脚本体例对齐；链上主锚仍以 **`b417_governance_execution_runs/run_*`** + **`b417-evidence-pack-verify` PASS** 为准。
