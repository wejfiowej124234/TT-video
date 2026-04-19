# TT-B433 · B-433 — GO 收口总卡：质押 / 治理 UI / 门禁 · release-proof bundle

**母表**：`B-433`  
**卡号**：`TT-B433-GO-RELEASE-PROOF-STAKING-GOV-BUNDLE-001`  
**日期**：2026-04-16  

---

## 0. 定位与「release-proof」定义

本卡将 **B-405～B-408**（协议 / 产品登记项）、**B-428**（最短演示闭环证据）、**B-432**（治理 UI 面防回归门禁）**统一收口**为一份 **可复用的上线前核对卷**（**非**替代各子 TT 的独立封口语义）。

**release-proof（本 bundle 口径）**指同时满足：

1. **工程门禁可重复绿**：见 **§3**（与 **CI / 本地** 同源命令）。  
2. **已封口子项**有**可定位**证据或脚本指针：**B-428**、**B-432**（见 **§2**）。  
3. **登记未封协议线（B-405～B-407）**与 **产品对齐线（B-408）**在 **§1** 中显式标为 **非本 bundle 封口对象**——**不**声称 Foundry / 测试网协议部署已单独 GO。  
4. **边界与遗留**在 **§4～§5** 可审计、可转工单。

**AI 一句话**：把「能绿的门禁 + 已有的演示/防回归证据 + 仍开放的协议/产品债」钉在一张表里，避免上线评审时混读 **身份质押**、**TTG 治理** 与 **池读数 Σ**。

---

<a id="production-go-live-rule-b433"></a>

## 0.5 Production Go-Live 判定（终极规则 · B-433 **`bundle_verdict: GO`**）

**当且仅当** 目标环境下以下 **三条闭环均为 GO**，系统达到 **Production Go-Live** 标准：**工程收益闭环**（**B-414** **业务** **/** **revenue** **）** **+** **治理观测闭环**（**B-430** **API** **`indexer-reconcile`** **↔** **`admin/observability/overview`** **）** **+** **链上真实性闭环**（**B-431** **Foundry** **`execute`** **后** **读数** **↔** **payload** **）** **。**

| 母表 | 支柱 | GO 含义（摘要） |
|------|------|----------------|
| **B-414** | Revenue / 业务 | **`b414-closeout-record.json`** **`verdict == GO`**（**`evidence/b414_revenue_e2e_go_live_closeout/run_<UTC>/`**） |
| **B-430** | Governance API | **`b430-gov-post-exec-reconcile-overview-bundle.sh`** **`exit 0`**；落盘时 **`b430-closeout-record.json`** **`verdict == GO`** |
| **B-431** | Chain / 合约 SSOT | **`forge test … test_B431_…`** **绿** **或** **`b431-closeout-record.json`** **`chain_read_payload_align_verdict == GO`** |

**统一证据入口（对外 · 仓库内唯一 SSOT）**：**[`evidence/GO_FINAL_20260416/README.md`](../../evidence/GO_FINAL_20260416/README.md)** **+** **机读** **[`release_proof.json`](../../evidence/GO_FINAL_20260416/release_proof.json)** **`repository_wide_canonical_entry`** **+** **对外** **[`RELEASE_NOTES_PUBLIC.md`](../../evidence/GO_FINAL_20260416/RELEASE_NOTES_PUBLIC.md)** **。** **B-433** **manifest** **`caveats[]`** **仅** **说明** **B-405～B-407** **等** **未** **单独** **宣称** **协议扩展** **GO** **，** **不** **阻断** **本条** **Production** **判定** **（** **与** **旧** **`GO_WITH_CAVEATS`** **语义** **区分** **）** **。**

---

## 1. 成员卡状态矩阵（真源：母表 + 本子卡）

| 母表 | 域 | 本 bundle 中的角色 | 母表登记态（2026-04-16） | 进入 release-proof 的含义 |
|------|----|--------------------|---------------------------|----------------------------|
| **B-405** | 合约 · 身份质押 v2 两池三账本 | **规划真源**；验收仍以 **TT-B405** / Foundry / 14 为准 | 登记（未封） | **不**作为「已协议封口」；仅要求 **Runbook/母表** 与仓库 **contracts** 现状可对读（由架构/合约 Owner 勾选） |
| **B-406** | 合约 · SlashRouter + ReserveVault | 同上 | 登记（未封） | 同上 |
| **B-407** | 合约 · FeeRouter–Treasury–Governor 分轨 | 同上；与 **B-417 / B-431** 叙事相邻 | 登记（未封） | 同上 |
| **B-408** | 产品 · 治理 UI ↔ payload / 89 | **目标态**；与 **B-428 / B-432** 同卷引用 | 登记（未封） | **UI 门禁**由 **B-432** 覆盖「路径 + 影响面板组件 + i18n」；**payload 完全对齐**仍以 **TT-B408** 验收为准 |
| **B-428** | 业务 · 质押→投票→执行→池/国库 演示 | **本 bundle 核心证据链** | 已做（`run_*` + `b428-closeout-record.json`） | **纳入** release-proof：**§2** |
| **B-432** | 工程 · 治理 UI SSOT 面 + Vitest 切片 | **本 bundle 核心门禁** | 已做（gate + CI） | **纳入** release-proof：**§3** |

---

## 2. 证据与 Runbook 索引（已封口 / 强指针）

| 项 | 路径 |
|----|------|
| **B-428 Runbook** | [`TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md`](./TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md) |
| **B-428 证据 README** | [`evidence/b428_gov_staking_treasury_ui_closeloop/README.md`](../../evidence/b428_gov_staking_treasury_ui_closeloop/README.md) |
| **B-428 已封口 bundle** | [`evidence/b428_gov_staking_treasury_ui_closeloop/run_20260416T0949Z_local-api-b417-sepolia/README.md`](../../evidence/b428_gov_staking_treasury_ui_closeloop/run_20260416T0949Z_local-api-b417-sepolia/README.md) |
| **B-417（queue/execute 互证）** | [`evidence/b417_governance_execution_runs/README.md`](../../evidence/b417_governance_execution_runs/README.md) |
| **B-432 门禁脚本** | [`scripts/gates/check-b432-governance-ui-ssot-surface.py`](../../scripts/gates/check-b432-governance-ui-ssot-surface.py)（由 **`run-check-04-routes`** 串联） |
| **机读 manifest（本 bundle）** | [`evidence/GO_release_proof_staking_gov_bundle/release_proof_manifest.v1.json`](../../evidence/GO_release_proof_staking_gov_bundle/release_proof_manifest.v1.json)（**`bundle_verdict`** **`GO`** **）** |
| **GO_MASTER_EVIDENCE_ENTRY（Production · 唯一 SSOT）** | [`evidence/GO_FINAL_20260416/README.md`](../../evidence/GO_FINAL_20260416/README.md)、[`release_proof.json`](../../evidence/GO_FINAL_20260416/release_proof.json)、[`RELEASE_NOTES_PUBLIC.md`](../../evidence/GO_FINAL_20260416/RELEASE_NOTES_PUBLIC.md) |

---

## 3. 统一门禁（与发版流水线对齐）

**最小集（本地 / CI 同源）**

```bash
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
cd frontend && npx tsc --noEmit
cd frontend && npm run test:b432
```

**可选加强（与 B-110 / SSOT 三角同卷）**

```bash
bash scripts/check-ssot-triangle-gate.sh
# 或分项：ssot-guard-ci-v2.py 等，见 scripts/README §二
```

---

## 4. 边界（防混读 · 上线评审必念）

- **身份双池质押（81 / `/staking`）** 与 **TTG 治理票权（`/governance`、getPastVotes）** **正交**；演示叙事见 **B-428** 证据 README。  
- **B-110**：**`fee-pool-aggregates` Σ** **不得**冒充 **`governance/pool`** 根级链上主读；与 **GO_B115 / GO_B116** 封口语义一致。  
- **B-428 示例证据**中 **`GET /meta`** 曾出现 **`chain.contracts`: null** 的本地快照——**759 七键全锚**环境须 **另跑** `run_*` 复拍或以目标部署为准（见该 `run_*` README）。  
- **B-416 / B-417**：写路径与 L3 执行自动化以 **`b416-closeout-record.json`**、**`b417-governance-execution-report.json`** 为界；**本 bundle 不扩展** L0～L2 复验（与 workspace **B-416/B-417 分界**一致）。

---

## 5. 遗留项（不阻塞本卡「bundle 落盘」，阻塞「协议线全开」）

| 方向 | 说明 | 建议承接 |
|------|------|----------|
| **B-405～B-407** | 合约主线独立封口（Foundry + 部署 + 14） | **TT-B405～TT-B407** |
| **B-408** | 产品级 UI ↔ payload 全量对齐 / E2E | **TT-B408** |
| **B-429** | 治理数据 SSOT 矩阵（防双源展示） | **TT-B429** |
| **B-430 / B-431** | 执行后对账与链上读数对拍 | **已封口**（**2026-04-16** **：** **[`TT-B430`](./TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001.md)** **/** **[`evidence/README` §B-430](../../evidence/README.md#b430-gov-post-exec-reconcile-overview)** **；** **[`TT-B431`](./TT-B431-GOV-EXECUTE-CHAIN-READ-PAYLOAD-ALIGN-001.md)** **/** **[`evidence/README` §B-431](../../evidence/README.md#b431-gov-execute-chain-read-payload-align)** **）** |
| **759 全锚复拍** | 与 **B-428** `run_*` 同序再产出 | 运维 + 前端 |

**订单主链（与质押治理 bundle 并行）**：**B-413** **/** **B-410** **已** **封口** **（** **一览** **358～359** **）** **；** **B-414** **Go-Live** **收益** **闭环** **联调** **已** **封口** **（** **一览** **360** **；** **`b414-revenue-e2e-go-live-closeout.sh`** **→** **`b414-closeout-record.json`** **）** **—** **不** **纳入** **本** **manifest** **成员** **矩阵** **，** **但** **为** **发版** **revenue** **真** **链** **路** **首选** **证据** **指针** **。**

---

## 6. 验收（本 TT）

- [x] **`release_proof_manifest.v1.json`** 中 **`bundle_verdict`** 与 **`members[]`** 与母表 **§1** 矩阵一致。  
- [x] **§3** 最小集命令在目标分支 **exit 0**（或 **NO_GO** 已在 manifest **`caveats[]`** 说明）。  
- [ ] **§4** 边界在上线评审纪要中可逐条勾选或 **显式豁免**（**产品** **/** **运维** **纪要** **；** **非** **CI** **门禁** **）。  

**封口批**：本 Runbook + [`evidence/GO_release_proof_staking_gov_bundle/`](../../evidence/GO_release_proof_staking_gov_bundle/) + 母表 **B-433** + 主索引 **一览** **357**。

---

## 7. 互证

- **89**、**04 §零 / §3.4**、**13-1 表 2-续**、**81**、**governance-token/02 §4.5**  
- **TT-GO 十卡**（B-418～B-427）：[`TT-GO-CLOSELOOP-10-B418-B427-001.md`](./TT-GO-CLOSELOOP-10-B418-B427-001.md)（**并行**：发版工程闭环；**不**替代本子卡范围）
