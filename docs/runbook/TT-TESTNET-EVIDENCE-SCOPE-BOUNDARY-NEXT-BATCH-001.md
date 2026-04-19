# TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001 · 测试网证据边界、防误解表与下一批 TT 清单

**卡号**：`TT-TESTNET-EVIDENCE-SCOPE-BOUNDARY-NEXT-BATCH-001`  
**日期**：2026-04-17  

---

## 0 · 为什么这张表重要

在审计与对外沟通里，最容易出事故的是：**把「局部闭环」说成「全系统闭环」**。  
当前测试网证据链（**FeeRouter → GovernanceTreasury → Timelock 控制执行**，叠 **B-417** 证据包，并配 **API / 前端 / 观测** 一致性核对）解决的是 **资金与治理执行主链路** 的可复核性；**不自动**等于治理币经济全书、DID、向导体系、各池独立 E2E、或「每个合约一张验收单」。

**标准对外口径（推荐）**：

当前测试网已在 **资金与治理执行主链路** 上完成可复核闭环验证，但该验证 **仅覆盖** **FeeRouter → Treasury → Timelock → 执行** 的资金路径与对应证据链，**不自动涵盖** 治理币经济模型、DID 体系及各池子模块的 **独立** 端到端验证。结合前端、API 与观测层可支持 **已覆盖范围内** 逐条审计问题的证据化回答；**未覆盖领域须另开 TT 与证据目录**。

**一页收口（主链路已证 / 边界已列明 / 剩余未证项单列）**：[**`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417`**](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)（**2026-04-17 最终版**；**三入口**之一；含 **Treasury.spend** 真源、**N2 PASS** 基线、端口与 **B-434 v3** 冻结表）。

---

## 1 · 当前主链已覆盖（证据指针）

| 能力 | 指针 |
|------|------|
| Timelock 真源裁断 | [`evidence/timelock_truth_arbitration/decision_record.v3.json`](../../evidence/timelock_truth_arbitration/decision_record.v3.json) · **TT-B434** |
| 线 A（FeeRouter + `/meta` + 分轨观测） | [`evidence/GO_20260417_line_a_minimal/`](../../evidence/GO_20260417_line_a_minimal/) |
| 全栈资金栈 + 观测收口 | **TT-B435** · [`evidence/b435_fullstack_fund_testnet_closeout/`](../../evidence/b435_fullstack_fund_testnet_closeout/README.md) |
| 治理 queue/execute + 证据包 | **TT-B417** · [`evidence/b417_governance_execution_runs/`](../../evidence/b417_governance_execution_runs/README.md) |
| Treasury.spend 专用最小闭环（**PASS 真源**） | **TT-TREASURY-SPEND-MINI-EVIDENCE-001** · **[`run_20260417T0810Z/README.md`](../../evidence/b417_governance_execution_runs/run_20260417T0810Z/README.md)**（**`PROPOSAL_ID=2`**；**勿**用 **id=1** 误判） · [`TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md`](../../evidence/b417_governance_execution_runs/TREASURY_SPEND_MINI_CLOSEOUT_SSOT.md) |
| 外部审计问答表 | **TT-B435-EXTERNAL-AUDIT-SIMULATION-001** |

---

## 2 · 未自动覆盖（必须单独证）

| 领域 | 状态 | 说明 |
|------|------|------|
| **治理币（TTG）经济模型** | 未证 | **[82](../spec/82-治理币-文档总览.md)** 为文档层；≠ 链上 / 前端 / 分配 **E2E** |
| **TTG 持仓与分配（全量台账 E2E）** | 未证 | **N2 薄层（`/meta` vs `chain_reads`）已 PASS**（见 **[rollup](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)**）；**不等于** 全链持仓 / 各桶 **snapshot·reconcile** 与业务台账 **E2E** |
| **DID / 信誉体系** | 未证 | 业务 API + 链下/链上 **混合**；不在主资金证据链内 |
| **向导 / 注册体系** | 未证 | 不在 **FeeRouter→Treasury→执行** 验证内 |
| **双质押池（Guide / Provider）** | 未证 | 无 **独立** `run_*` **全链路** 封口（见 §4 下一批） |
| **RegionVault** | 部分 | 多为 **地址 + 观测**；≠ 国家桶 **业务闭环** |
| **ReserveVault** | 部分 | 多为 **接线 + 观测**；≠ **Slash / 罚没** 全叙事 E2E |
| **每个合约独立验收** | 未证 | 当前为 **链路级** 验证，非 **逐合约矩阵** |

---

## 3 · 部分覆盖（易被误解）

| 项目 | 实际状态 | 风险 |
|------|----------|------|
| **「治理系统已验证」** | 治理 **执行链**（Governor / Timelock / B-417）已验证 | 不等于 **治理币经济模型** 已证 |
| **「资金系统已闭环」** | **FeeRouter → Treasury → spend** 叙事可收口 | 不等于 **所有池子** 已独立 E2E |
| **「前端已对齐」** | **API / 合约地址** 与 `meta` 可对拍 | 不等于 **所有页面 / 用户流程** 已 E2E |

---

## 4 · 下一批 TT 任务卡清单（脚本入口 + PASS 判据）

**说明**：下列 **「建议卡号」** 为仓库内规划名；若母表尚未登记，实现前在 **[任务母表](../任务母表.md)** 补行并锁定 owner。

| # | 领域 | 建议 TT / 现有卡 | 脚本或入口（起点） | PASS 判据（摘要） |
|---|------|------------------|-------------------|-------------------|
| N1 | **TTG 经济模型 vs 链上** | **[TT-GOV-TOKEN-ECON-ALIGN-001](./TT-GOV-TOKEN-ECON-ALIGN-001.md)**（骨架 **§0～§2** 已落） | 链上：`cast` 读 **TTG** `totalSupply`、金库/团队地址余额；文档：**[82 §三之二](../spec/82-治理币-文档总览.md#三之二ttg-链上诞生分配执行与稳定币兑换企业级-ssot)**、**[02 §2.5](../spec/governance-token/02-对内技术规格-草案.md)** | 见该卡 **§2.3** **PASS/SUSPECT/FAIL**；证据目录建议 **`evidence/ttg_econ_align/run_<UTC>/`** |
| N2 | **TTG 投影薄对账（同锚 `meta` vs 链上读）** | **[TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001](./TT-GOV-TOKEN-ECON-N2-SNAPSHOT-ALIGN-001.md)** | **`scripts/ops/ttg-econ-align-compare.sh`** → **`api_db_compare.json`** | **本基线 PASS**：[`run_20260417T083300Z_compare/api_db_compare.json`](../../evidence/ttg_econ_align/run_20260417T083300Z_compare/api_db_compare.json)；**全量持仓/分配 E2E** 仍属上表 **§2** 与 **`TT-GOV-TOKEN-SNAPSHOT-RECONCILE-001`**（若开） |
| N3 | **DID / 信誉** | 待开 **`TT-DID-REPUTATION-E2E-001`** | API：`/community`、向导档案、评价路由；链上：仅 **与 DID 声明一致** 的只读地址 | **业务规则** 与 **API 响应** 可复现；链上部分 **仅声称已部署且可核对** 的范围 |
| N4 | **向导注册 / 审核** | 待开 **`TT-GUIDE-REG-FLOW-TESTNET-001`** | 注册/登录/seed 路径见 **`.env.example`**；`cargo test -p traveltrust-api` 相关路由 | **端到端** 一条测试网账号 **完成注册→可接单条件**（或文档声明 **刻意未测**） |
| N5 | **双质押池 E2E** | 已有 **[TT-B428](./TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md)**、**[TT-B433](./TT-B433-GO-RELEASE-PROOF-STAKING-GOV-BUNDLE-001.md)** | **`bash scripts/ops/b435-sepolia-stake-first-payment.example.sh`**（§3.3 与 **TT-B435** 同源） | **链上** `stake` tx + **`GET /meta`** 地址一致 + UI/只读叙事 **TT-B428 §3** 截图或等价证据 |
| N6 | **RegionVault 业务转出** | 观测：**TT-B384**；业务闭环待开 **`TT-REGION-VAULT-BIZ-FORWARD-001`** | **`bash scripts/ops/b384-…smoke.sh`**（overview/reconcile）；链上 **`forward`** 须单独设计 | **B-384** 键绿 + **一笔** 可引用 **`RegionVaultForwarded`** 业务 tx（或 **SUSPECT** 书面原因） |
| N7 | **ReserveVault / Slash** | **B-406** 测试已有；测试网待开 **`TT-RESERVE-SLASH-E2E-001`** | **`forge test`** 中 **SlashRouter**；测试网需 **部署栈含 Router** | **罚没路径** 与 **ReserveVault 余额** 可 Explorer 核对（与 **81 / 02** 一致） |
| N8 | **逐合约验收矩阵** | 待开 **`TT-CONTRACT-MATRIX-SIGNOFF-001`** | **`./scripts/check-55-s13.sh`** + **`sync-abi-from-forge.sh`** + 部署清单 | **ABI**、**地址**、**Explorer verified**（若适用）**逐表勾选**；**不**与单链路 GO 混谈 |

---

## 5 · 互证（勿混读）

- **TT-B433** 已声明：**release-proof bundle** **不**声称 **B-405～B-407** 协议部署线已单独 GO —— 与本文件 **§2** 一致。  
- **TT-B435 §3.7**：母表 B-435 **仅**在 **`run_<UTC>/`** 按 Runbook **落齐** 后可标「已做」—— **不**因「主链叙事口头完成」自动等价 **§2** 未证域。

---

**文档版本**：1.0.3 · **2026-04-17** — **N2** 薄层 **PASS** 基线入表；**rollup** 升为 **三入口** + **基线冻结** 叙述（见 **[`TT-TESTNET-ACCEPTANCE-ROLLUP-20260417`](./TT-TESTNET-ACCEPTANCE-ROLLUP-20260417.md)**）
