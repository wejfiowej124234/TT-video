# TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001 · P0 上线门禁卡（Sepolia 已封口 → Ethereum Mainnet）

**卡号**：`TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001`  
**等级**：**P0** — **未通过本卡 §0 门禁表（全部为 GO）→ 禁止 Ethereum Mainnet 生产部署 / cutover**（与 [`docs/go-live-checklist.md`](../go-live-checklist.md) **§9** 联动）。

**定位**：在 **[母表 B-435](../任务母表.md)** **Sepolia 全栈资金闭环已封口**（例：[`evidence/b435_fullstack_fund_testnet_closeout/run_20260417T003342Z`](../../evidence/b435_fullstack_fund_testnet_closeout/run_20260417T003342Z)、[`TT-B435`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)）之后，面向 **Ethereum Mainnet（`CHAIN_ID=1`）** 的 **独立、最新版** 上线门禁；**不**替代 [`go-live-checklist.md`](../go-live-checklist.md) 逐项工程表、**不**替代 [07 §四](../spec/07-开发流程与顺序.md) 发版并联核对，而是 **把主网特有风险收口为可执行 NO-GO 规则**。

**与「旧任务卡」关系**：B-435 / B-434 / RUNTIME_SSOT / go-live-checklist **此前各管一段**（测试网闭环、Timelock 裁断、接线 cast、工程勾选）。**本卡是新增聚合层**：主网 cutover 前 **必须** 满足下表；其中 **bytecode 身份校验、全量索引路径验证、Timelock 下限、Trigger Matrix、证据 chain_id 强校验、合约层无回滚口径** 等为 **本卡首次写死为 P0**，**旧版文档未写全的以本卡为准**。

---

## §0 门禁总表（Mainnet deploy / cutover — 全部为 GO 才允许）

| ID | 闸门 | GO | NO-GO（禁止 mainnet deploy） |
|----|------|----|------------------------------|
| **G0** | **本文件** §1～§6 **书面证据已落盘**（路径、操作人、UTC、指向发布 commit） | 有 | 缺任一项 |
| **G1** | **不可逆校验层**（§1）：**地址对齐** **且** **bytecode 与编译产物一致** | 满足 §1.3 | 不满足 |
| **G2** | **Indexer 全量路径**（§2）：**自起点至链尖** **索引 / replay 验证** **无 panic、无断层**，**reconcile + overview 可收敛** | 满足 §2.2 | 不满足 |
| **G3** | **Timelock delay**（§3）：**≥ 24h**（86400 s）或 **书面批准的更高下限**；**不得** 为 **0** 或 **极小值** | 满足 §3.2 | 不满足 |
| **G4** | **Trigger Matrix**（§4）已 **接入执行系统**（自动化或值班 runbook **带 exit 码**） | 满足 §4.2 | 仅「原则」无执行路径 |
| **G5** | **主网证据**（§5）：**`chain_id: 1` 强校验** 写入 **README + JSON** | 满足 §5.2 | 未写入或缺字段 |
| **G6** | **回滚口径**（§6）：团队 **已签收**「合约 **不可回滚链上状态**」**仅** pause / 治理修复 / 对账与补偿 | 培训/签字有记录 | 未确认 |
| **SL** | **Mainnet Shadow Launch**（§7 Shadow）：**独立证据包** [`evidence/mainnet_shadow_launch/run_<UTC>/`](../../evidence/mainnet_shadow_launch/README.md) **全链路演练** **且** **`shadow_go_no_go.json`** **`shadow_launch_verdict":"GO"`** | 满足 §7 Shadow | 缺包、演练 NO-GO、或未指向发布 **commit** |

**强制执行语句（写入 [`go-live-checklist.md`](../go-live-checklist.md) §9）**：**目标为 Ethereum Mainnet 的生产部署或 cutover** → **必须先** **G0～G6** **与** **SL** **全 GO**（**SL** **为** **正式主网发布前** **最终** **端到端** **Go/No-Go** **输入**）；**否则禁止 mainnet deploy**。

**CI 机读聚合**：[`scripts/check-mainnet-launch-precheck-gate.sh`](../../scripts/check-mainnet-launch-precheck-gate.sh)（实现 [`scripts/gates/check-mainnet-launch-precheck-gate.sh`](../../scripts/gates/check-mainnet-launch-precheck-gate.sh)，**G0～G6** **与** **§0** **SL** **`${MAINNET_EVIDENCE_RUN_DIR}/shadow_go_no_go.json`** **同一** **`exit 1`** **阻断** **源**）与 [`.github/workflows/mainnet-launch-precheck-gate.yml`](../../.github/workflows/mainnet-launch-precheck-gate.yml)；**细则、Secrets、branch protection、禁止假绿（P0）** 见下文 **§7**。**主网** **上线** **前** **最终** **执行** **顺序** **（** **六** **步** **）** **：** **[主网上线前最终执行清单](./TT-MAINNET-MAINNET-LAUNCH-FINAL-EXEC-CHECKLIST.md)** **。**

---

## 1. 部署（地址对齐 + 不可逆 bytecode 校验层）

### 1.1 既有要求（保持）

- **Timelock 唯一性**、**`feeRouter.owner() == Timelock`**、**七键 + `GET /meta` → `chain.contracts`** 同源（与 [`TT-B435` §2](TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)、[`RUNTIME_CHAIN_SSOT_CHECKLIST.md` §5](../../evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md) 一致）。
- **主网** **`CHAIN_ID=1`**；广播脚本与 B-434 裁断一致，**禁止** 无记录的双套地址。

### 1.2 接线脚本（必选）

- 仓库根：**`bash scripts/ops/runtime-chain-ssot-cast-verify.sh`**（可选 **`RUNTIME_SSOT_EXTENDED=1`**）对当前 **`.env` 七键** **exit 0**（**地址与引用关系**）。

### 1.3 P0：bytecode 身份（不可逆断言 — 防假部署 / 错链部署）

**仅「地址对齐」不够**：必须证明 **链上 runtime bytecode** 与 **本仓库在锁定 commit 上的编译产物** **一致**。

- **范围（至少）**：**`GOVERNOR_ADDRESS`**、**`TIMELOCK_ADDRESS`**、**`FEE_ROUTER_ADDRESS`**、**`ESCROW_FACTORY_ADDRESS`**（及资金栈内 **运维台账定义为 P0 的其它核心合约**）— **清单须在证据包 `bytecode_identity_manifest.json` 中列全**。
- **方法（二选一或并列，须留痕）**：
  1. **链上**：`cast code <addr> --rpc-url "$CHAIN_RPC_URL"` **得到的 bytecode hex** 与 **`forge inspect <path>:<Contract> bytecode`**（**同一 `TRAVELTRUST_GIT_SHA` / 发布 tag**）**逐字节相同**；或双方 **keccak256(bytecode)** 一致并写入证据；**或**
  2. **Etherscan** **Verified Contract** 与 **发布 commit** 对拍，**且** **explorer 上 Contract Creation / Implementation** 与台账地址一致（**仍建议** 与本地 artifact **交叉** **keccak**）。
- **NO-GO**：任一类 **核心合约** **bytecode 无法与锁定编译产物对齐** → **禁止进入 mainnet run**（§0 **G1**）。

**说明**：现有 [`runtime-chain-ssot-cast-verify.sh`](../../scripts/ops/runtime-chain-ssot-cast-verify.sh) 在 **`RUNTIME_SSOT_EXTENDED=1`** 下仅做 **`cast code` 非空** **探针**，**不等于** **bytecode 身份**；**P0 以 §1.3 为准**。

---

## 2. 环境（RPC / DB / 前端 + Indexer 全量路径）

### 2.1 既有要求（保持）

- **RPC / DB / `NEXT_PUBLIC_*` / `FINALITY_N` / `P3_CHAIN_OFF`** 等见 [`go-live-checklist.md`](../go-live-checklist.md) §1～§3。

### 2.2 P0：Indexer replay / 追块能力验证（最易炸）

**在 mainnet cutover 前**，必须在 **与生产等价的配置**（**推荐：生产 DB 脱敏克隆或专用 staging + 主网 RPC / 或合规 fork**，**以你们风控为准**）上验证：

1. **自约定起点至当前主网链尖**（**至少** 覆盖 **自资金/治理相关合约部署高度起**；若策略要求 **自 genesis**，须在证据中写明 **起点 block 与理由**），通过 **`POST /api/v1/internal/indexer-tick`** **迭代拉齐**（或运维批处理等价物），**无持续 5xx / 无未解释 panic**。
2. **`POST /api/v1/internal/indexer-replay`**（[`IndexerReplayBody`](../../crates/api/src/routes/internal/indexer/replay.rs)：`chain_id` 可选）在 **同环境** **200**，**`orders_projection` 重放路径** **无失败**（与 110 / 04 投影语义一致）。
3. **`POST /api/v1/internal/indexer-reconcile`**（`persist` 按环境策略）与 **`GET /api/v1/admin/observability/overview`** **可收敛到可解释状态**（**非** **无限报错**；**已知业务 drift** **须在证据 README 中列为残留项**）。

**NO-GO**：**任一** **上述路径** **无法完成** **或** **reconcile/overview 无法收敛** → **禁止 mainnet 上线**（§0 **G2**）。**理由**：上线后 indexer **崩 = 全平台链上状态与业务「假死」**。

---

## 3. 权限（多签 / INTERNAL + Timelock delay 下限）

### 3.1 既有要求（保持）

- **多签**、**propose / queue / execute** 职责、**INTERNAL 仅内网**、**生产关闭 testnet admin mint**（见 [`go-live-checklist.md`](../go-live-checklist.md)）。

### 3.2 P0：Timelock delay 校验（致命隐患收口）

- **链上可读**（OpenZeppelin **`GovernanceTimelock`** 常见为 **`getMinDelay()`** 或 **`getDelay()`** — **以部署 ABI 为准**）：**`delay_seconds ≥ 86400`（24h）**，或 **组织书面批准的更严下限**（**须写入证据**）。
- **Mainnet 禁止**：**delay = 0** **或** **低于批准下限的极小值**（**否则治理等同「可瞬时执行」**，**与主网风控不兼容**）。
- **NO-GO**：不满足 → **§0 G3**。

---

## 4. 风控（Trigger Matrix — 机器可执行）

### 4.1 既有原则（保持）

- **pause**、**限流**、**真实扣款三条件**（见 [`RUNTIME_CHAIN_SSOT_CHECKLIST.md` §6](../../evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md)、[`go-live-checklist.md`](../go-live-checklist.md)）。

### 4.2 P0：Trigger Matrix（必须写进 Runbook 级执行系统）

**以下为「满足任意 1 条 → 必须自动或按 runbook 一键进入」**（**实现落点**：**告警 webhook**、**PAUSE 脚本**、**API 只读** — **须** **在运维库 / Terraform / 值班手册** **有可执行路径**，**不能** **仅停留在原则**）：

| 条件 | 示例判据（可机读） | 强制动作 |
|------|-------------------|----------|
| **A** | **`indexer-reconcile`** **或** **持久化报告** 中 **`issues_total` > 0** **且** **达到你们定义的 severity**（**或** **`projection_reconcile_clean == false`** **且** **超过 SLA**） | **暂停资金写路径**（**链上 pause / FeeRouter 写闸** **或** **应用层拒绝关键写**）+ **API 只读模式**（**`PAUSE_MODE`** **等**） |
| **B** | **`indexer lag` > N blocks**（**N** **由** **`INDEXER_LAG_MAX_BLOCKS`** **与** **Runbook** **定义**）**或** **`indexer_replay_required == true`** **持续** **> T 分钟** | **同上** |
| **C** | **`GET …/admin/observability/overview`** **缺失** **约定** **关键观测键**（**如** **B-383/B-384/B-415** **类** **或** **你们钉死的 minimal key set**）**或** **HTTP 5xx** | **同上** |

**NO-GO**：主网 cutover 前 **无** **已部署的自动化或带 exit 码的值班 runbook** **覆盖 A/B/C** → **§0 G4**。

---

## 5. 证据（主网独立目录 + chain_id=1 防污染）

### 5.1 既有要求（保持）

- **Mainnet** **独立** **`run_<UTC>/`**，**不覆盖** Sepolia B-435 目录；含 **`tx_hashes.json`**、**`indexer_tick.json` / `reconcile.json` / `overview.json`**、**`README.md`**（结构对齐 B-435 封口包）。

### 5.2 P0：chain_id 强校验（防测试网数据误入）

- **`README.md` 首段** **必须** **显式写明**：**`deployment_chain_id: 1`**、**`network: Ethereum Mainnet`**。
- **每一份** **落入证据包的 JSON**（**至少** **`tx_hashes.json`**、**三份 API 落盘**、**`bytecode_identity_manifest.json`**）**须** **含** **顶层字段** **`"chain_id": 1`** **或** **`"deployment_chain_id": 1`**（**与** **团队 JSON Schema** **一致即可**，**但** **必须** **可机读 grep**）。
- **NO-GO**：**缺字段** **或** **`chain_id≠1`** → **§0 G5**。

---

## 6. 回滚（口径收紧 — 合约层不存在「链上回滚」）

### 6.1 应用 / DB / 前端

- **镜像回滚**、**DB 还原** **仅适用于** **链下系统**（见 [`go-live-checklist.md`](../go-live-checklist.md) §8）。

### 6.2 P0：必须写进 Runbook 的强制句

**合约层不存在「回滚链上状态」**；**只存在**：

- **pause**（**合约或应用闸**）  
- **治理修复**（**经 Timelock 的合法升级 / 参数变更**）  
- **状态对账与补偿**（**链下、法务与客户沟通**）

**禁止** **团队** **将** **「部署错了再撤」** **误解为** **可逆操作**。**培训签收** **须有记录** → **§0 G6**。

---

## 7. CI 机读门禁（G0～G6 + SL）

| 项 | 说明 |
|----|------|
| **脚本入口** | 仓库根 [`scripts/check-mainnet-launch-precheck-gate.sh`](../../scripts/check-mainnet-launch-precheck-gate.sh) → [`scripts/gates/check-mainnet-launch-precheck-gate.sh`](../../scripts/gates/check-mainnet-launch-precheck-gate.sh) |
| **启用** | **`CHAIN_ID=1`** **且**（**`TT_MAINNET_GATE_ENFORCE=1`** **或** **`MAINNET_LAUNCH_PRECHECK=1`**）；否则 **exit 0**（非主网流水线不挡普通 PR） |
| **合并阻断 CI** | [`.github/workflows/broadcast-batch-blockers.yml`](../../.github/workflows/broadcast-batch-blockers.yml) **job** **`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`**：**已设** **`MAINNET_CHAIN_RPC_URL`** **时** **push/PR** **自动** **`CHAIN_ID=1`** **`TT_MAINNET_GATE_ENFORCE=1`** **跑** **[`check-mainnet-launch-precheck-gate.sh`](../../scripts/gates/check-mainnet-launch-precheck-gate.sh)**（**G0～G6** **+** **§0** **SL** **`shadow_go_no_go.json`** **机读** **，** **路径** **`${MAINNET_EVIDENCE_RUN_DIR}/shadow_go_no_go.json`** **）**；**未全 GO** **exit 1**。**未设** **该 Secret** **时** **job** **必须** **fail**（**见** **下** **§7** **P0** **硬规则**） |
| **辅助 Workflow** | [`.github/workflows/mainnet-launch-precheck-gate.yml`](../../.github/workflows/mainnet-launch-precheck-gate.yml)：**push/PR** 仅 **`bash -n`** + **SKIP**；**手动** **`workflow_dispatch`** · **`run_full_mainnet_gate`** **可全量复跑** |
| **Secrets（全量）** | **`MAINNET_CHAIN_RPC_URL`**、**`MAINNET_GOVERNOR_ADDRESS`**、**`MAINNET_TIMELOCK_ADDRESS`**、**`MAINNET_GOVERNANCE_TOKEN_ADDRESS`**（**G1a** **runtime SSOT**）、**`MAINNET_FEE_ROUTER_ADDRESS`**、**`MAINNET_ESCROW_FACTORY_ADDRESS`**、**`MAINNET_EVIDENCE_RUN_DIR`**（**checkout 后** **相对仓库根** **的** **`run_<UTC>/`** **，** **须** **含** **`shadow_go_no_go.json`** **供** **SL** **机读** **）**、**`MAINNET_G2_EVIDENCE_JSON`**（**相对路径** **至** **含** **`"g2_gate":"GO"`** **的** **JSON**）；**`MAINNET_G6_FILE`** **可选**（**默认** **`evidence/mainnet_launch_gate/G6_no_rollback_ack.md`**） |
| **边界** | **G2** **机读** **仅** **校验** **JSON** **字段** **与** **落盘**；**§2.2** **全路径** **Indexer** **验收** **仍以** **人工** **/** **脱敏** **环境** **证据** **为准** |

### P0 硬规则：禁止 MAINNET「假绿」（false green）

**问题**：若 **`MAINNET_CHAIN_RPC_URL`** **未配置** **而** **job** **仍** **显示成功**（**跳过实跑**），**则** **branch protection** **必过** **会** **误以为** **G0～G6+SL** **已** **机读通过** — **不可接受**。

**硬规则（收口）**：

1. **`MAINNET_CHAIN_RPC_URL`** **未配置** **时**，**`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`** **job** **必须** **`exit 1`**（**不得** **无证据** **绿** **过**）。
2. **禁止** **在** **未配置** **`MAINNET_CHAIN_RPC_URL`** **（及** **§7** **Secrets（全量）** **）** **时**，**将** **该** **job** **纳入** **`main`** **必过** **status checks**。
3. **工程化例外（非生产）**：仓库 **Settings → Variables → Actions** 可设 **`MAINNET_GATE_ALLOW_ABSENT_RPC=true`** — **仅** **此时** **无** **RPC** **Secret** **会** **跳过实跑并** **exit 0**（**带** **`::warning`**）。**禁止** **在** **该** **变量** **为** **true** **时** **仍** **将** **本** **job** **作为** **`main`** **必过**（**否则** **仍为** **假绿**）。**Fork PR**（**无** **base** **仓库** **Secrets**）**须** **二选一**：**不设** **本** **job** **为** **必过**，**或** **设** **上述** **变量** **并** **接受** **该** **PR** **不** **产生** **TT-MAINNET** **真值**。

### main 分支必过（系统级阻断合并与主网部署前置）

**前提**：**Settings → Secrets and variables → Actions** 已配置 **`MAINNET_*`**（至少 **`MAINNET_CHAIN_RPC_URL`** 及 §7 **Secrets（全量）**），使 **`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`** **实际执行** **G0～G6** **+** **SL** **机读**（**满足** **上** **节** **P0** **硬规则**）。

**GitHub**：**Settings → Rules / Branch protection rules → `main`**（或等价规则集）→ **Require status checks to pass before merging** → 在 **Status checks** 搜索并勾选 **workflow「Broadcast batch blockers」**（文件名 **`broadcast-batch-blockers.yml`**）下的 **全部** **job 显示名**（与 YAML **`name:`** **一致**）：

| 必过检查名（PR / Checks 面板与 branch protection 列表一致） |
|---|
| **`No legacy Staking.sol as unqualified SSOT path`** |
| **`Broadcast batch 1 blockers`** |
| **`Broadcast batch 2 blockers`** |
| **`Broadcast batch 3 blockers`** |
| **`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`** |

**迁移**：**若** **曾** **将** **旧** **job** **显示** **名** **`TT-MAINNET G0–G6 (CHAIN_ID=1)`** **列为** **必过** **，** **须** **在** **branch** **protection** **中** **改选** **上表** **新** **名** **（** **与** **[`broadcast-batch-blockers.yml`](../../.github/workflows/broadcast-batch-blockers.yml)** **`name:`** **一致** **）** **。**

**效果**：**所有** **拟合并进** **`main`** **的变更** **均** **触发** **该 workflow**；**Secrets** **已齐** **时**，**`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`** **未全 GO** → **exit 1** → **合并被拒绝**。**发布模型** **若以** **`main`** **为** **唯一** **可部署** **提交源**，则 **未过闸代码不会进入 mainnet deploy**。**与** **P0** **硬规则** **一致**：**无** **`MAINNET_CHAIN_RPC_URL`** **→** **job** **fail**，**除非** **显式** **`MAINNET_GATE_ALLOW_ABSENT_RPC`**（**非** **必过** **场景** **专用**）。

### 迭代期：新 `run_<UTC>/` + G0～G6 + SL 接入 CI 与部署流水线（自动阻断）

**冻结** **`Full GO`** **基线** **后**，**「** **所有** **主网** **发布** **须** **新** **`evidence/mainnet_shadow_launch/run_<UTC>/`** **并** **完整** **通过** **G0～G6** **+** **SL** **全** **GO** **」** **（** **见** **下文** **「** **版本化** **运维** **与** **再** **门禁** **」** **）** **必须** **接入** **：** **①** **`main`** **必过** **`TT-MAINNET G0–G6+SL (CHAIN_ID=1)`** **—** **单次** **[`check-mainnet-launch-precheck-gate.sh`](../../scripts/gates/check-mainnet-launch-precheck-gate.sh)** **机读** **`MAINNET_EVIDENCE_RUN_DIR`** **下** **`shadow_go_no_go.json`** **与** **G0～G6** **，** **未** **全** **GO** **`exit 1`** **阻断** **合并** **；** **②** **生产** **部署** **流水线** **须** **以** **同一** **Secrets** **/** **脚本** **真值** **为** **放行** **前置** **。** **未** **满足** **一律** **自动** **阻断** **发布** **。**

### Mainnet Shadow Launch（影子上线演练 · §0 **SL** · 正式主网发布 **最终** Go/No-Go 输入）

**定位**：**在** **不动** **真实** **用户** **资金** **前提** **下**，**于** **与** **生产** **等价** **或** **经** **风控** **批准的** **影子栈**（**例**：**合规** **fork** **/** **脱敏** **DB** **克隆** **+** **`CHAIN_ID=1`** **RPC** **只读** **/** **写** **闸** **—** **以** **组织** **策略** **为准**）**执行** **一次** **全链路** **演练**，**产出** **独立** **证据包** **`evidence/mainnet_shadow_launch/run_<UTC>/`**。**`shadow_go_no_go.json`** **`shadow_launch_verdict":"GO"`** **为** **产品** **/** **运维** **/** **治理** **对** **「** **是否** **进入** **正式** **Ethereum Mainnet** **生产** **cutover** **」** **的** **最终** **机读** **+** **人工** **签核** **锚点**（**与** **§0** **表** **SL** **列** **一致**）。**不** **替代** **§2.2** **/** **§4** **能力** **条款**；**与** **G0～G6** **合并** **为** **上线** **前** **完整** **NO-GO** **集合**。

**全链路**（**须** **在** **证据** **中** **可** **追溯** **命令** **/** **endpoint** **/** **高度** **范围**）：

1. **Deploy（影子）**：**应用** **/** **合约** **部署** **或** **指向** **既定** **主网** **地址** **的** **发布** **形态**；**资金** **路径** **须** **显式** **标注** **「** **无** **真实** **用户** **扣款** **」** **或** **等效** **风控** **阀** **（** **写入** **`README.md`** **）**。
2. **Indexer**：**`POST …/internal/indexer-tick`** **迭代** **至** **约定** **链尖** **或** **SLA** **内** **（** **`indexer_tick.json`** **）**。
3. **Replay**：**`POST …/internal/indexer-replay`** **200** **（** **`indexer_replay.json`** **）**。
4. **Reconcile**：**`POST …/internal/indexer-reconcile`** **（** **`reconcile.json`** **）**。
5. **Overview**：**`GET …/admin/observability/overview`** **（** **`overview.json`** **）**。
6. **Trigger Matrix（§4）**：**至少** **一条** **条件** **（** **A** **/** **B** **/** **C** **类** **）** **的** **演练** **记录** **（** **`trigger_matrix_drill.md`** **：判据** **→** **动作** **→** **exit** **码** **或** **值班** **确认** **）**。

**目录与命名**：**固定** **顶层** **`evidence/mainnet_shadow_launch/`**；**每次** **演练** **新建** **`run_<UTC>/`**（**`<UTC>`** **建议** **`YYYYMMDDTHHmmssZ`** **与** **B-435** **封口包** **同形** **）**。**禁止** **覆盖** **历史** **`run_*`**。**索引** **与** **模板** **见** **[`evidence/mainnet_shadow_launch/README.md`](../../evidence/mainnet_shadow_launch/README.md)**、**[`run_TEMPLATE/`](../../evidence/mainnet_shadow_launch/run_TEMPLATE/README.md)**。

**最小文件集**（**缺** **一** **即** **SL** **NO-GO**）：

| 文件 | 说明 |
|------|------|
| **`README.md`** | **首段** **须** **含** **`deployment_chain_id: 1`** **/** **`network: Ethereum Mainnet`** **、** **影子** **资金** **声明** **、** **`TRAVELTRUST_GIT_SHA`** **或** **等价** **发布** **指针** |
| **`shadow_go_no_go.json`** | **顶层** **`shadow_launch_verdict`** **为** **`"GO"`** **或** **`"NO_GO"`**；**须** **含** **`deployment_chain_id`** **或** **`chain_id": 1`** |
| **`indexer_tick.json`** | **与** **§5** **/`MAINNET_EVIDENCE_RUN_DIR`** **同形** **语义** **（** **`chain_id`** **可** **机读** **）** |
| **`indexer_replay.json`** | **`indexer-replay`** **响应** **落盘** |
| **`reconcile.json`** | **`indexer-reconcile`** **落盘** |
| **`overview.json`** | **`observability/overview`** **落盘** |
| **`trigger_matrix_drill.md`** | **§4** **矩阵** **演练** **留痕** |

**可选**：**`tx_hashes.json`**（**影子** **tx** **/** **无** **真** **资** **标注**）、**`deploy_shadow_notes.md`**（**环境** **/** **URL** **清单**）。

**G5** **关系**：**生产** **cutover** **用** **证据** **仍** **走** **§5** **`run_<UTC>/`** **（** **可与** **SL** **包** **分** **目录** **但** **须** **互指** **）**；**SL** **包** **专责** **影子** **演练** **最终** **裁决** **文件** **`shadow_go_no_go.json`**。

### 主网小额真实资金灰度（SL GO 之后的执行阶段）

**进入灰度前** **在** **影子** **环境** **须** **已** **完成** **（** **顺序** **固定** **）**：**①** **四** **JSON** **（** **tick** **/** **replay** **/** **reconcile** **/** **overview** **）** **落盘** → **②** **`trigger_matrix_drill.md`** **实演** **留痕** → **③** **`shadow_go_no_go.json`** **`shadow_launch_verdict`** **从** **`NO_GO`** **升为** **`"GO"`** **（** **含** **operator** **/** **时间** **/** **git_sha** **）**。**缺** **①** **或** **②** **则** **不得** **升** **GO** **、** **不得** **灰度**。**模板** **检查单**：[**`evidence/mainnet_shadow_launch/run_TEMPLATE/README.md`**](../../evidence/mainnet_shadow_launch/run_TEMPLATE/README.md) **「** **SL GO** **升级** **与** **主网** **小额** **灰度** **」**。

**前置**：**§0 SL** **已** **`shadow_go_no_go.json`** **`shadow_launch_verdict":"GO"`**（**路径** **`evidence/mainnet_shadow_launch/run_<UTC>/`**），**且** **证据** **已** **提交** **可追溯**。

**定位**：**影子** **演练** **与** **生产** **真实** **扣款** **之间** **的** **受控** **过渡** — **须** **具备** **书面** **额度** **上限** **、** **路径** **/** **地址** **白名单** **、** **`pause`** **/** **回切** **预案** **与** **值班** **/风控** **签核**；**具体** **金额** **与** **名单** **不** **写入** **本** **仓库**（**以** **组织** **台账** **为准**）。

**启动时机**：**在** **影子** **环境** **已** **完成** **①～③** **（** **四** **JSON** **+** **Trigger** **Matrix** **实演** **+** **`GO`** **证据** **提交** **归档** **）** **且** **§0** **其余** **项** **已为** **GO** **时**，**于** **同一** **发布** **窗口** **内** **无缝** **启动** **受控** **小额** **主网** **灰度** **发布**（**不** **插入** **任何** **无关** **变更**）。

#### 灰度交易执行（正式上线前最终验证）

**在** **启动** **链上** **真实** **资金** **前** **须** **再** **确认**：**全部** **GO** **类** **证据** **（** **含** **SL** **包** **、** **§5** **主网** **证据** **等** **）** **已** **提交** **可追溯**；**当前** **发布** **分支** **/** **变更集** **无** **任何** **与** **本** **灰度** **无关** **的** **提交**。**随后** **锁定** **发布** **窗口**（**冻结** **scope** **，** **禁止** **夹带** **新** **需求** **/** **依赖** **升级** **）**。

**执行**：**仅** **在** **已** **锁定** **的** **发布** **窗口** **内** **按** **白名单** **与** **组织** **批准的** **最小** **额度** **执行** **主网** **灰度** **交易**（**台账** **登记** **，** **具体** **数值** **不** **写入** **本** **仓库** **）**。

**实时判定信号**：**灰度** **全程** **须** **以** **`POST …/internal/indexer-reconcile`** **与** **`GET …/admin/observability/overview`**（**或** **经** **批准的** **等价** **聚合** **探针** **）** **为** **实时** **判定** **依据** **—** **而** **非** **仅** **事后** **补** **截图** **；** **信号** **须** **全程** **收敛** **（** **与** **Trigger** **Matrix** **阈值** **/** **值班** **口径** **一致** **、** **无** **未决** **异常** **）** **方可** **视为** **灰度** **验证** **可** **结案** **。** **异常** **按** **Trigger** **Matrix** **与** **`pause`** **预案** **处置** **，** **未** **收敛** **前** **不得** **进入** **下一** **节拍** **。**

**全量上线放行**：**须** **在** **已** **锁定** **的** **发布** **窗口** **内**，**于** **确认** **`indexer-reconcile`** **与** **`observability/overview`** **实时** **判定** **收敛** **并** **完成** **书面** **放行** **（** **或** **等价** **工单** **签核** **）** **后**，**立即** **执行** **主网** **全量** **cutover** **（** **全** **流量** **/** **生产** **形态** **）** **—** **与** **书面** **放行** **同一** **发布** **节拍** **接续**。** **全量** **cutover** **切换** **过程中** **与** **cutover** **完成** **后** **均** **须** **以** **`indexer-reconcile`** **与** **`observability/overview`** **（** **或** **经** **批准的** **等价** **聚合** **探针** **）** **为** **实时** **判定** **依据** **；** **cutover** **完成** **后** **须** **持续** **监控** **直至** **信号** **稳定** **收敛** **（** **与** **Trigger** **Matrix** **阈值** **/** **值班** **口径** **一致** **、** **无** **未决** **异常** **）** **并** **正式** **关闭** **发布** **窗口** **（** **scope** **冻结** **解除** **以** **组织** **发布** **管理** **为准** **）** **；** **发布** **窗口** **关闭** **后** **须** **立即** **转入** **生产** **稳态** **运行** **与** **告警** **值守** **（** **按** **[**`go-live-checklist.md`**](../go-live-checklist.md)** **§10** **）** **，** **并** **持续** **观测** **`indexer-reconcile`** **与** **`observability/overview`** **（** **或** **经** **批准的** **等价** **聚合** **探针** **）** **以** **确认** **系统** **进入** **长期** **稳定** **状态** **。** **上线** **前** **、** **全量** **cutover** **切换** **过程中** **及** **关窗** **前** **（** **持续** **监控** **收口** **前** **）** **，** **严格** **禁止** **任何** **形式** **的** **资金** **敞口** **扩大** **（** **含** **提额** **、** **扩大** **白名单** **、** **追加** **生产** **资金** **路径** **、** **与** **灰度** **无关** **的** **写** **路径** **/** **流量** **放量** **等** **）** **；** **亦** **严禁** **以** **扩大** **敞口** **作为** **cutover** **前置** **。** **灰度** **未** **结案** **前** **不得** **并行** **扩大** **敞口** **。**

**生产稳态与闭环（Full GO）**：**进入** **生产** **稳态** **后** **须** **按** **[**`go-live-checklist.md`**](../go-live-checklist.md)** **§10** **执行** **持续** **告警** **值守** **与** **长期** **观测** **（** **含** **`indexer-reconcile`** **/** **`observability/overview`** **及** **§10** **所列** **告警** **项** **）** **；** **在** **确认** **系统** **长期** **稳定** **后** **须** **完成** **主网** **上线** **闭环** **归档** **与** **版本** **标记** **（** **`Full GO`** **）** **—** **证据** **包** **路径** **/** **git** **tag** **/** **发布** **工单** **以** **组织** **发布** **管理** **为准** **，** **须** **可** **追溯** **至** **本次** **主网** **cutover** **提交** **/** **发布** **锚点** **；** **并** **将** **本次** **主网** **上线** **作为** **可追溯** **发布** **基线** **进入** **后续** **运维** **与** **版本** **迭代** **周期** **。**

**版本化运维与再门禁（迭代期）**：**以** **本次** **`Full GO`** **启动** **版本化** **运维** **并** **冻结** **该** **基线** **（** **git** **tag** **+** **证据** **锚点** **，** **与** **归档** **落盘** **互指** **）** **。** **冻结** **`Full GO`** **基线** **后** **，** **所有** **主网** **发布** **必须** **基于** **新** **`evidence/mainnet_shadow_launch/run_<UTC>/`** **完整** **重跑** **§0** **G0～G6** **+** **SL** **并** **全** **GO** **（** **含** **`shadow_launch_verdict":"GO"`** **等** **，** **以** **§0** **表** **与** **[**`evidence/mainnet_shadow_launch/README.md`**](../../evidence/mainnet_shadow_launch/README.md)** **为准** **）** **，** **否则** **一律** **禁止** **进入** **生产** **。** **工程** **落地** **须** **与** **§7** **「** **迭代期** **：** **新** **`run_<UTC>/` + G0～G6 + SL** **接入** **CI** **与** **部署** **流水线** **（** **自动** **阻断** **）** **」** **一致** **。**

**与 §0 关系**：**上述** **灰度** **链上** **交易** **、** **全量** **cutover** **及** **cutover** **完成** **后** **至** **发布** **窗口** **正式** **关闭** **前** **的** **`indexer-reconcile`** **/** **`observability/overview`** **持续** **监控** **，** **为** **正式上线** **与** **稳态** **交接** **的** **受控** **验证** **；** **发布** **窗口** **关闭** **后** **须** **按** **[**`go-live-checklist.md`**](../go-live-checklist.md)** **§10** **转入** **生产** **稳态** **与** **告警** **值守** **，** **并** **在** **稳态** **期** **持续** **观测** **上述** **信号** **以** **确认** **长期** **稳定** **。** **不** **替代** **§0** **门禁** **表** **，** **是** **SL** **`GO`** **之后** **至** **发布** **窗口** **正式** **关闭** **前** **的** **执行** **收口** **；** **关窗** **后** **的** **长期** **观测** **与** **值守** **以** **§10** **为准** **；** **`Full GO`** **（** **长期** **稳定** **确认** **后** **的** **归档** **+** **版本** **标记** **）** **为** **本次** **主网** **发布** **叙事** **的** **最终** **书面** **收口** **锚点** **，** **且** **将** **本次** **上线** **固化为** **可追溯** **发布** **基线** **以** **启动** **版本化** **运维** **（** **冻结** **tag** **+** **证据** **锚点** **）** **；** **冻结** **`Full GO`** **基线** **后** **，** **所有** **主网** **发布** **须** **基于** **新** **`run_<UTC>/`** **完整** **重跑** **G0～G6+SL** **并** **全** **GO** **，** **否则** **一律** **禁止** **进入** **生产** **（** **见** **上文** **「** **版本化** **运维** **与** **再** **门禁** **」** **）** **。**

**禁止**：**在** **SL** **仍为** **`NO_GO`** **或** **§0** **任** **一** **项** **NO-GO** **时** **启用** **主网** **真实** **资金** **灰度**。**灰度** **不** **替代** **G0～G6** **/** **CI** **门禁**；**仅** **在** **门禁** **已** **闭合** **后** **作为** **上线** **执行** **步骤**。

**证据目录索引**：[`evidence/mainnet_launch_gate/README.md`](../../evidence/mainnet_launch_gate/README.md)（**G0～G6** **机读**）；[`evidence/mainnet_shadow_launch/README.md`](../../evidence/mainnet_shadow_launch/README.md)（**SL** **包**）。

---

## 附录 A：与现有任务卡 / 清单的映射

| 文档 | 角色 |
|------|------|
| [`docs/go-live-checklist.md`](../go-live-checklist.md) | 工程逐项；**§9** **= Mainnet P0 门禁**；**§10** **= 监控与值班**；**§11** **= 发版真值十二项** |
| [`TT-B435`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md) | Sepolia 全栈资金 **已封口** **前置** |
| [`TT-B434`](./TT-B434-FUND-TIMELOCK-TRUTH-ARBITRATION-001.md) | Timelock 真值裁断 |
| [`RUNTIME_CHAIN_SSOT_CHECKLIST.md`](../../evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md) | cast 接线；**bytecode P0 以本卡 §1.3 为准** |
| [`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) | 运维总入口；**Trigger Matrix 须落地于此或子 runbook** |
| [`evidence/mainnet_shadow_launch/README.md`](../../evidence/mainnet_shadow_launch/README.md) | **§0 SL** **影子** **演练** **证据** **根**；**`run_<UTC>/`** **最终** **Go/No-Go** |

---

## 附录 B：版本说明

- **本卡**：**独立** **P0 门禁** **当前最新版** **（** **2026-04-17** **起** **）**；**主网 cutover** **以** **本文件** **+** **`go-live-checklist.md` §9** **为准**。历史 Sepolia-only 叙述 **不自动** **等价于** **主网已通过**。

---

## 附录 C：旧母表行（B-1～B-435）与旧 TT — 应如何处理

**原则**：**不废弃、不重写历史**。**旧卡** **仍是** **该功能域的实现 / 封口 / 证据真源**；**本卡** **只解决** **「Ethereum Mainnet 首次 cutover」** **这一件事** **的增量 P0**，**与旧卡是叠加关系，不是替代关系**。

| 做法 | 说明 |
|------|------|
| **保留母表状态列** | **已封口** **的** **B-xxx** **行** **勿** **因本卡** **改为** **「未做」**。**B-435** **仍是** **Sepolia** **全栈资金闭环** **的登记**；**主网** **另** **用** **新证据目录** **+** **本卡 §0** **勾选**。 |
| **不合并进旧卡正文** | **勿** **把** **§1.3 bytecode** **/** **§2.2 全路径** **等** **整段** **粘进** **几十条** **旧** **B-110** **/** **B-114** **行** **—** **维护会分叉**。**旧卡** **冻结语义**；**主网策略** **只在本卡** **与** **`go-live-checklist` §9** **演进**。 |
| **互指即可** | **需在旧叙事里避免误解时**：在 **相关 Runbook**（或 **本卡附录 A**）**加一行** **「Mainnet cutover 见 TT-MAINNET…§x」**；**不必** **逐张** **改** **AI 任务卡索引** **全文**。 |
| **对拍问题时** **怎么查** | **「链上能力有没有」** **→** **仍** **以** **对应** **B-xxx / TT** **封口** **为准**。**「主网能不能上」** **→** **必须以** **本卡 §0** **全 GO** **为准**；**旧卡** **绿** **不** **蕴含** **本卡** **自动** **绿**。 |
| **索引 / 台账** | **新** **主网** **run** **可** **在** **母表** **另起一行** **或** **在** **B-435** **行** **备注** **「Mainnet 证据见 xxx」** **（** **不** **覆盖** **Sepolia** **路径** **）** **—** **按你们** **台账** **惯例** **二选一**。 |

**一句话**：**旧任务卡继续当「做过什么」的档案；本卡当「主网第一次上线前还必须再过哪道门」——两道都留着，职责分开。**

---

**日期**：2026-04-17
