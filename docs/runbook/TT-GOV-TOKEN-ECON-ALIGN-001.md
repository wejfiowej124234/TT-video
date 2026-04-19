# TT-GOV-TOKEN-ECON-ALIGN-001 · 治理币（TTG）经济披露 ↔ 链上可复核对齐

**卡号**：`TT-GOV-TOKEN-ECON-ALIGN-001`  
**母表**：待登记 → **[任务母表](../任务母表.md)**（与 **[TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001](./TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001.md)** **§4 · N1** 同源）  
**日期**：2026-04-17  

---

## §0 · 定位与边界

### 0.1 解决什么问题

**治理执行已验证**（Governor / Timelock / **B-417** 证据包）**≠** **治理币（TTG）经济体系已验证**。  
本卡把 **「文档与对内经济桶表」** 与 **「测试网（或目标链）上可引用的链上事实」** 钉在同一验收框架里，供审计与对外沟通使用。

### 0.2 不替代什么

- **不替代** **法务 / 证券 / 募资** 定性（仍以 **08-4**、**governance-token/LEGAL-SIGNOFF** 等为上限）。  
- **不替代** **B-417**、**TT-TREASURY-SPEND**、**TT-B435** 的既有封口语义；本卡 **并列** 于上述证据。  
- **不声称** **「各桶已 100% 链上自动铸入」** —— 与 **[82 §三之二](../spec/82-治理币-文档总览.md#三之二ttg-链上诞生分配执行与稳定币兑换企业级-ssot)**、**[governance-token/02 §2.5](../spec/governance-token/02-对内技术规格-草案.md)** 一致：**占位桶** 须 **`transfer` / `Treasury.spend` / 外部合约** 落实。

### 0.3 权威文档锚点（验收时须打开同版本）

| 锚点 | 用途 |
|------|------|
| **[82](../spec/82-治理币-文档总览.md)** · **§三之二** | TTG 诞生、分配执行顺序、团队 15% 示例口径 |
| **[governance-token/02 §2.5](../spec/governance-token/02-对内技术规格-草案.md)** | **100%** 供应分解（对内占位 SSOT） |
| **[governance-token/02 §4.3.2 / §4.7](../spec/governance-token/02-对内技术规格-草案.md)** | quorum、金库分轨与 FeeRouter 正交 |
| **[84 §1.5](../spec/84-第一阶段10国Country-Pool发行参数总表.md)**（若本轮承销叙事参与对齐） | 承销桶与估值锚（与 02 同批变更规则见 **07 §二 2.4**） |

### 0.4 与相邻 TT 的关系

| TT | 关系 |
|----|------|
| **TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001** | 本卡 **落实** **N1**「TTG 经济模型 vs 链上」从 **未证** → **已证 / SUSPECT** |
| **TT-B417** | 仅证 **治理执行**；本卡证 **代币总量与分配事实** 是否与披露一致 |
| **[TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001](./TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001.md)**（**N2** **快照对账** **骨架**） | **链上** **`chain_reads.json`** **锚点** **下**，**API** **/** **indexer** **投影** **与** **`total_supply`** **/** **`treasury_balance`** **对账**；**PASS** **/** **SUSPECT** **/** **FAIL** **与** **允许** **延迟** **见** **该** **Runbook** |

---

## §1 · 前置与硬门禁

### 1.1 环境

| 条件 | 说明 |
|------|------|
| **目标网络** | 须写明 **chain_id**（如 Sepolia **11155111**）；与 **`GET /meta` → `chain.chain_id`** 一致 |
| **RPC** | **`CHAIN_RPC_URL`** 可稳定 **`eth_call`** / **`eth_getBalance`** |
| **合约地址** | **`GOVERNANCE_TOKEN_ADDRESS`**（TTG）、**`TREASURY_ADDRESS`**、（可选）**团队/空投等台账地址** 与 **`GET /meta` → `chain.contracts`** **同源** |
| **文档版本锁** | 验收记录中写明 **82** `版本`、**02** 文件版本或 **git SHA**，避免「对照旧稿」 |

### 1.2 合约真值（与 82 / 02 对齐的最小事实）

当前 **`GovernanceVotesToken`**：**构造函数一次性 `_mint` 至部署者**；**之后无 `mint`**（见 **[contracts/README](../../contracts/README.md)**、**`DeployGovernanceStack`**）。  
若验收时发现 **链上 `totalSupply` 与部署脚本声明不一致** → **STOP**，先修部署/台账再谈「桶对齐」。

### 1.3 门禁（不满足则不得标 GO）

| # | 门禁 |
|---|------|
| G1 | **`cast call` / Explorer** 可读 **`totalSupply()`**、**`decimals()`**、**`symbol()`**（或与实现一致的 getter） |
| G2 | **金库地址** **`balanceOf(TREASURY)`** 与 **台账「金库桶」应到位数额** 可同口径比较（允许 ** wei 级** 舍入说明） |
| G3 | 若已披露 **团队 15%** 等：**接收地址** **余额之和**（或单地址满额）与 **15% × totalSupply** 一致 **或** 在证据中记 **「未划转 / 部分划转」** 及原因 |

---

## §2 · 验收项（骨架 · PASS / SUSPECT / FAIL）

**输出物建议目录**：`evidence/ttg_econ_align/run_<UTC>/`（**`README.md`** + **`chain_reads.json`** + **`compare.md`**；**勿**与 **B-417** / **b435** 证据目录混名）

### 2.1 链上只读清单（可复制）

在仓库根 **`.env`** 已 **source** 前提下（**勿**提交私钥）：

```bash
# 变量名与 .env.example / meta 七键一致
TOK="${GOVERNANCE_TOKEN_ADDRESS}"
RPC="${CHAIN_RPC_URL}"

cast call "$TOK" "totalSupply()(uint256)" --rpc-url "$RPC"
cast call "$TOK" "decimals()(uint8)" --rpc-url "$RPC"
cast call "$TOK" "symbol()(string)" --rpc-url "$RPC"
cast call "$TOK" "balanceOf(address)(uint256)" "$TREASURY_ADDRESS" --rpc-url "$RPC"
# 对台账中的团队/空投等地址重复 balanceOf
```

将 **原始输出**（或 **cast** **JSON**）存入 **`chain_reads.json`**。

### 2.2 与文档桶表的对照（02 §2.5 / 82 §三之二）

| 步骤 | 动作 | 记录 |
|------|------|------|
| A | 从 **02 §2.5** 摘录 **本轮生效** 的 **桶名 + 目标比例或 wei** | 写入 **`compare.md`** |
| B | 将 **链上** **totalSupply** 与各 **balanceOf** 换算为 **实际比例** | 与 A **同表对照** |
| C | 标注 **已链上落实** / **仅文档占位** / **部分落实** | 占位项 **不得** 标 **GO**，应标 **SUSPECT** 并 **列原因** |

### 2.3 判据（初稿）

|  verdict | 条件 |
|----------|------|
| **PASS** | **G1～G3** 满足；**已披露桶** 与 **链上余额/划转证据** **无** **未解释** **偏差**；**meta / .env** 地址一致 |
| **SUSPECT** | **文档** 仍为 **Target/占位** 的桶 **明确** 未上链；或 **仅完成** **团队+金库** 子集，**已在 compare.md 声明范围** |
| **FAIL** | **totalSupply** 或 **关键地址余额** 与 **台账/02** **冲突** 且无 **书面豁免**；或 **混用两套 Timelock/代币地址** |

### 2.4 与「治理执行已验证」的并列陈述（对外可用）

> **Governor / Timelock 执行链** 已由 **B-417** 证据包验证；**TTG 经济披露与链上余额/分配事实** 由 **`TT-GOV-TOKEN-ECON-ALIGN-001`** **`run_<UTC>/`** 验证。**二者须分别引用，不得合并为一句「治理币已全部验证」。**

---

## §3 · 一键链上经济对齐（最小自动化 · N1）

**分层原则（重要）**：**N1** 只回答 **「链上经济真值是否与设计/桶表一致」**（**supply / mint / balances / 金库持仓**）。**`GET /meta`** 的 **TTG 数值投影**（**§3.9**）与 **indexer** 是 **API 侧** 对账对象；若与 **§3** 混为**同一结论**，**API 异常会误判为「经济模型不对」**。因此 **§3** **仅** 做 **链上只读（纯 `cast`）**；**N2（§3.9）** **单独** 验收 **「投影是否与 N1 同锚点一致」**，**不** 污染 N1 结论纯度。

### 3.1 目标

从链上读取 TTG 经济关键数据，生成 **machine-readable** 结果，并与 **[82](../spec/82-治理币-文档总览.md)**、**[governance-token/02](../spec/governance-token/02-对内技术规格-草案.md)** 桶表进行 **人工或半自动** 对照。

### 3.2 脚本入口

**`scripts/ops/ttg-econ-align-read.sh`**

### 3.3 输入（环境变量 · 最小集）

| 变量 | 说明 |
|------|------|
| **`CHAIN_RPC_URL`** | 可稳定 **`eth_call`** 的 RPC |
| **`GOVERNANCE_TOKEN_ADDRESS`** | TTG 合约（兼容旧名 **`GOVERNANCE_VOTES_TOKEN_ADDRESS`**） |
| **`TREASURY_ADDRESS`** | 金库地址 |

**可选**：**`TTG_ECON_BALANCE_ADDRESSES`** — 逗号分隔的额外地址（团队/空投等），与金库一并写入 **`top_holders`** 的 **`balanceOf`** 列表。**`TTG_ECON_NO_AUTOLOAD_ENV=1`** — 不自动 source **`.env`**。

### 3.4 输出目录

**`evidence/ttg_econ_align/run_<UTC>/`**

| 文件 | 说明 |
|------|------|
| **`chain_reads.json`** | 链上只读快照（机读） |
| **`compare.md`** | 与 02 / 82 对照的 **人工** 模板（预填链上数值占位） |

### 3.5 `chain_reads.json` 字段（固定）

```json
{
  "chain_id": 11155111,
  "token": "0x...",
  "total_supply": "...",
  "treasury_balance": "...",
  "top_holders": [
    { "address": "0x...", "balance": "..." }
  ],
  "block_number": 12345678,
  "timestamp": 1710000000
}
```

**说明**：**`top_holders`** 为 **金库** + **可选 `TTG_ECON_BALANCE_ADDRESSES`** 的 **`balanceOf`**，按余额 **降序**；**不是** 全链 Top N 扫描（纯 RPC 无法无索引完成后者）。

### 3.6 读取命令（与脚本内部一致）

```bash
cast call "$GOVERNANCE_TOKEN_ADDRESS" "totalSupply()(uint256)" --rpc-url "$CHAIN_RPC_URL"
cast call "$GOVERNANCE_TOKEN_ADDRESS" "balanceOf(address)(uint256)" "$TREASURY_ADDRESS" --rpc-url "$CHAIN_RPC_URL"
# 可选：对 TTG_ECON_BALANCE_ADDRESSES 中各地址重复 balanceOf
```

### 3.7 `compare.md`（人工对照）

脚本生成模板，验收时须补齐 **桶表总量（02 / 82）**、**结论**、**说明**。建议结构：

- **total_supply（链上）** ↔ **桶表总量（02 / 82）**
- **Treasury / 已披露分配地址** ↔ **台账**
- **结论**：**PASS** / **SUSPECT** / **FAIL**
- **说明**：是否存在 **未披露 mint**、**异常 holder**、**占位桶未上链**（须在证据中写明）

### 3.8 PASS / SUSPECT / FAIL（强化）

| verdict | 条件 |
|---------|------|
| **PASS** | **`totalSupply`** 与设计一致；**金库 / 已披露分配地址** 持仓符合预期；与 02 / 82 **无未解释偏差** |
| **SUSPECT** | 分配与文档有偏差但 **可解释**（测试 mint、中间态、**明确占位** 未上链且 **compare.md 已声明范围**） |
| **FAIL** | **未知 mint**；**关键地址持仓异常**；与 **02 / 82** **明显冲突**；或 **混用两套** 代币/金库地址 |

### 3.9 API 数值投影与 N2 对账（与 §3 并列）

**原则**：**N1** 仍以 **§3** **纯 `cast` / `chain_reads.json`** 为**链上真值**。**N2** 只验证 **同一 `block_number` 锚点** 下，**API 投影** 与 **`chain_reads.json`** 的 **`total_supply` / `treasury_balance`**（**wei 十进制字符串**）**一致**；**若不一致**，优先怀疑 **RPC、部署地址、`API_BASE_URL` 指向了旧进程** —— **不得**用 N2 **单独推翻** N1 关于 **mint** 的结论（并列 **[TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001](./TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001.md)**）。

**机读落点**（**`eth_call`** **@** **锚点块**，与 **`ttg-econ-align-read.sh`** **N1** **语义对齐**）：

| 路由 | 说明 |
|------|------|
| **`GET /meta?ttg_econ_anchor_block=<N>`** | **`chain.ttg_econ_anchor`**：`available`、`block_number`、`block_tag`、`total_supply`、`treasury_balance`、`error`、`rule` |
| **`GET /api/v1/internal/ttg-econ-anchor?ttg_econ_anchor_block=<N>`** | **响应体** 与 **`chain.ttg_econ_anchor`** **完全一致**（**内网**；若配置了 **`INTERNAL_API_SECRET`** 则须带头 **`X-Internal-Api-Secret`**）；便于探针/Cron **不拉整份** **`/meta`** |

**锚点优先级**（与 **`chain.ttg_econ_anchor.rule`** 一致）：查询参数 **`ttg_econ_anchor_block`** **>** 环境变量 **`TTG_ECON_ANCHOR_BLOCK`** **>** **indexer checkpoint** **`block_number`**。

**自动化入口（薄层）**：**`scripts/ops/ttg-econ-align-compare.sh`** — 生成或复用 **`chain_reads.json`**，按其中 **`block_number`** 请求 **`GET /meta?ttg_econ_anchor_block=…`**，比对 **`chain_id` / 地址 / 数值** → **`api_db_compare.json`**。可选：**`GET /api/v1/governance/pool`**、**`governance_pool.balance` vs FeeRouter**（**与 TTG `totalSupply` 正交**；**B-381**）。若 **`.env`** 中 **`API_BASE_URL`** 与**实际监听端口**不一致，可 **`API_BASE_URL=http://127.0.0.1:<PORT> bash …`**（脚本**保留**调用方已导出的 **`API_BASE_URL`**，避免被 `.env` 覆盖）。

---

**文档状态**：**§3** 已落地（**链上只读**）；**§3.9** 已落地 **API 投影 + compare 脚本**；**N2** 细则 → **[TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001](./TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001.md)**；**`evidence` manifest** 等 **待续**  
**文档版本**：0.3.0 · **2026-04-17**
