# 封口项目与 Epic 总索引（B-114 / B-126 / B-127 / B-115 / B-116 / P5 / Epic A～F）

**标识**：**`TT-DOC-SEALED-PROGRAMS-EPICS-MASTER-INDEX-001`**（**导航文档**；**不**替代各 **GO_*.md** 正文、**不**改写任何已封口语义）。

**用途**：一条入口汇总 **主 GO**、**Runbook 阶梯**、**evidence/README 锚点**、**根 README 入口**、**跨域边界口诀**与**推荐后续方向**（仅规划级，非工单）。

---

## 总表（入口速查）

| 域 | 主 GO / 证据卷（仓库内） | Runbook / ADR | evidence/README | 根 README（示例入口） |
|----|-------------------------|---------------|-------------------|------------------------|
| **B-114** | [evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md](../../evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md) | （**110** 更广域以 spec、母表 **B-114** 为准） | [#b114-indexer-target-slice-close](../../evidence/README.md#b114-indexer-target-slice-close) | [README](../../README.md)（检索 **B-114**） |
| **B-126** | （**无**独立 GO；**台账** [母表 B-126](../任务母表.md) 行内 HTML 对照表） | [**spec/110**](../spec/110-阶段开发链上索引器与事件同步器.md) **Target** 与 **B-114 / GO_B114** 边界；[**Epic-D**](./Epic-D-indexer-ops-readonly-ladder.md) 首段 **110 覆盖边界** | [#b126-110-target-alignment](../../evidence/README.md#b126-110-target-alignment) | [README](../../README.md)（检索 **B-126**） |
| **B-127** | [evidence/GO_B127_FINALITY_GATE_CLOSE.md](../../evidence/GO_B127_FINALITY_GATE_CLOSE.md)（**☑ 已封口** · **Finality Gate 闭环** · **`TT-DOC-B127-1-FINALITY-GATE-CLOSE-001`**） | [**spec/110**](../spec/110-阶段开发链上索引器与事件同步器.md) **§3.3**、**§3.1.1**；**04 §3.4 · internal**；[**Epic-D**](./Epic-D-indexer-ops-readonly-ladder.md) **finality 闭环边界** | [#b127-finality-gate](../../evidence/README.md#b127-finality-gate) | [README](../../README.md)（检索 **B-127**） |
| **B-115** | [evidence/GO_B115_CLOSE.md](../../evidence/GO_B115_CLOSE.md) | （规格与 API 以 **04**、母表为准） | [#b115-snapshot-claim-close](../../evidence/README.md#b115-snapshot-claim-close) | [README · Epic/P5 表](../../README.md)（检索 **B-115** / **P5-4**） |
| **B-116** | [evidence/GO_B116_CLOSE.md](../../evidence/GO_B116_CLOSE.md)；锚 **P4**：[GO_B116_P4.md](../../evidence/GO_B116_P4.md) | [Runbook §2.55 / §12.5](../../ops/RUNBOOK.md)（索引器与留痕） | [#b116-feerouter-regionvault-evidence](../../evidence/README.md#b116-feerouter-regionvault-evidence) | 同上 |
| **P5 程序族** | [evidence/GO_P5_CLOSE.md](../../evidence/GO_P5_CLOSE.md) | 各子规格见 **04**、**P5-1 规格文** | [#p5-program-master-close](../../evidence/README.md#p5-program-master-close) | [README · P5-4](../../README.md) |
| **P5-1** | [GO_P5_1_CLOSE.md](../../evidence/GO_P5_1_CLOSE.md) | [P5-1 规格](../spec/P5-1-逐国链上账本SSOT-一国辖区端到端.md) | [§P5-1](../../evidence/README.md#p5-1-country-ledger-ssot-v0-close) | 母表 **P5-1** |
| **P5-2** | [GO_P5_2_CLOSE.md](../../evidence/GO_P5_2_CLOSE.md)；子卷 **B**：[GO_P5_2_B_CLOSE.md](../../evidence/GO_P5_2_B_CLOSE.md) | [04 · P5-2-A](../spec/04-后端与API.md#p5-2-a--vault-专项对账导出规格冻结--epic-p5-2) | [§P5-2 Epic](../../evidence/README.md#p5-2-epic-vault-export-close) | 母表 **P5-2** |
| **P5-3** | [GO_P5_3_CLOSE.md](../../evidence/GO_P5_3_CLOSE.md) | [04 · P5-3](../spec/04-后端与API.md#p5-3--regionsharesnapshot-链上锚点规格冻结--epic-p5-3) | [§P5-3](../../evidence/README.md#p5-3-epic-regionshare-snapshot-onchain-anchor) | 母表 **P5-3** |
| **P5-4** | [GO_P5_4_CLOSE.md](../../evidence/GO_P5_4_CLOSE.md) | [04 · P5-4](../spec/04-后端与API.md#p5-4-epic-governance-distribution) | [§P5-4](../../evidence/README.md#p5-4-epic-governance-distribution-claim-ui) | [README P5-4 表](../../README.md) |
| **P5-5** | [GO_P5_5_CLOSE.md](../../evidence/GO_P5_5_CLOSE.md) | **84**、**04 · protocol-reference** | [§P5-5](../../evidence/README.md#p5-5-doc-mirror-84-readonly-close) | 母表 **P5-5** |
| **Epic A** | [GO_EPIC_A_GOVERNANCE_EXEC_UX_CLOSE.md](../../evidence/GO_EPIC_A_GOVERNANCE_EXEC_UX_CLOSE.md) | [Epic-A-governance-execution-ux-ladder.md](./Epic-A-governance-execution-ux-ladder.md)；[read-contract-governance-read-apis.md](./read-contract-governance-read-apis.md) | [#epic-a-governance-exec-ux-close](../../evidence/README.md#epic-a-governance-exec-ux-close) | [README · Epic A](../../README.md) |
| **Epic C** | [GO_EPIC_C_ADMIN_CROSS_CHECK_DRIFT_UI_CLOSE.md](../../evidence/GO_EPIC_C_ADMIN_CROSS_CHECK_DRIFT_UI_CLOSE.md) | [Epic-C-admin-cross-check-drift-ui-ladder.md](./Epic-C-admin-cross-check-drift-ui-ladder.md)；[read-contract-admin-read-apis.md](./read-contract-admin-read-apis.md) | [#epic-c-admin-cross-check-drift-ui-close](../../evidence/README.md#epic-c-admin-cross-check-drift-ui-close) | [README](../../README.md)（检索 **Epic C**） |
| **Epic D** | **无**单独 `GO_EPIC_D_CLOSE.md`：收口以 **阶梯 + 落盘 artifact + D-10 bundle 形状** 为准 | [Epic-D-indexer-ops-readonly-ladder.md](./Epic-D-indexer-ops-readonly-ladder.md)；[Epic-D-ops-artifact.v1.schema.json](./Epic-D-ops-artifact.v1.schema.json)；示例 [example-d10-go-bundle](./Epic-D-ops-artifact.v1.example-d10-go-bundle/README.md) | [evidence/README](../../evidence/README.md) 正文 **「目录约定」** 段（**`write-indexer-evidence`**、**D-10**、**`epic_d_go_bundle_closure`**） | [Runbook §2.55 / §12.5](../../ops/RUNBOOK.md)；[scripts/README · internal-indexer-ops](../../scripts/README.md) |
| **Epic E** | [GO_EPIC_E_FINANCE_READONLY_CLOSE.md](../../evidence/GO_EPIC_E_FINANCE_READONLY_CLOSE.md) | [Epic-E-finance-readonly-ladder.md](./Epic-E-finance-readonly-ladder.md) | [#epic-e-finance-readonly-close](../../evidence/README.md#epic-e-finance-readonly-close) | [README · Epic E](../../README.md) |
| **Epic F** | [GO_EPIC_F_E2E_THREE_PACK_CLOSE.md](../../evidence/GO_EPIC_F_E2E_THREE_PACK_CLOSE.md) | [Epic-F-e2e-three-pack-ladder.md](./Epic-F-e2e-three-pack-ladder.md)；[Epic-F-real-path-adr.md](./Epic-F-real-path-adr.md) | [#epic-f-e2e-three-pack-close](../../evidence/README.md#epic-f-e2e-three-pack-close) | [README · Epic F](../../README.md) |
| **B110-SEQ2**（**orders · `rating_deadline`**） | [GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md](../../evidence/GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md)（**母表 B-132**） | [Runbook §2.55](../../ops/RUNBOOK.md)；[04 · TT-B110-SEQ2 bundle 句](../spec/04-后端与API.md)（检索 **BUNDLE-CLOSE**） | [#b110-seq2-orders-deadline-bundle-close](../../evidence/README.md#b110-seq2-orders-deadline-bundle-close) | [母表 B-132](../任务母表.md) |
| **B110-SEQ3**（**indexer-reconcile · deadline SSOT**） | （**实现+文档**；**母表 B-133**） | [110 §3.1.3.1](../spec/110-阶段开发链上索引器与事件同步器.md)；[04 · `internal/indexer-reconcile`](../spec/04-后端与API.md)；**`internal.rs`** **`TT-B110-SEQ3`** | **`indexer-reconcile-gate`** **`checks_total`** **107** | [母表 B-133](../任务母表.md) |

**任务母表**（全表检索）：[docs/任务母表.md](../任务母表.md)。

---

## 当前边界（交叉口诀 · 不替代各 GO 正文）

- **B-114**（索引器 **Target 切片** **B-114-1～5**）：**不**声称 **spec/110** 全文其余 Target 均已 **Implemented**；封口语义与验收以 **GO_B114_INDEXER_TARGET_SLICE_CLOSE** 为准；**不**替代 **B-115 / B-116 / P5 / Epic A～F** 各卷。
- **B-126**（**spec/110** **Target 句机读登记** · **文档轮**）：**仅**母表一行内 **HTML 对照表** + 本索引 / **evidence/README** / **Epic-D** 互指；**不**开 **B-114-6**；**不**改写各 **GO** 正文封口语义；**GO_B114** 只读引用。
- **B-127**（**Finality 确认层** · **☑ 已封口** · **Finality Gate 闭环**）：**主 GO** [**GO_B127_FINALITY_GATE_CLOSE.md**](../../evidence/GO_B127_FINALITY_GATE_CLOSE.md)（**资金终态 `orders_projection` 双写硬闸** + **internal 观测字段**）；**不**替代 **GO_B114 / GO_B116**；**不**改写 **B-115 / B-116 / P5 / Epic A～F** 封口语义；**不**声称 **spec/110** 全文 finality **Target** 均已 **Implemented**；**当前阶段已闭环，无需继续 B-127-2**；验收 **`cargo test -p traveltrust-api b127_finality_gate`**（**2 passed**）。
- **B-115** 与 **B-116**（**fee-pool-aggregates** / **governance/pool** 等）：**正交**；具体断言与测试范围以 **GO_B115_CLOSE** / **GO_B116_CLOSE** 为准。
- **P5 各 Epic** 与 **B-115 / B-116**：**另卷封口**；**禁止**在未经 **TT + 母表** 批准下改写已登记 **Claim / accrual / Σ / 逐国账本** 等语义（详见各 **GO_P5_***、**GO_P5_CLOSE**）。
- **Epic A / C**：治理与 Admin 只读 UX；**不**替代 **B-115 / B-116 / P5** 分配与费路由封口语义（见各 **GO_EPIC_***）。
- **Epic D**：索引器 / 对账 / **`traveltrust.ops_artifact.v1`**；**不**改封口业务语义；**不**将运维 artifact 绑为 **Epic A/C** UI 唯一真值源；Admin 消费只读面走 **Epic E** 规则（见 **Epic-D** 阶梯文首表）。
- **Epic E**：**API 为主入口**，脚本为消费层；**不**替代 **01 §9 E2E 三项** 与 **Epic D** 索引器线。
- **Epic F**：E2E 三项包 Runbook + **F-06** 结构校验 + **F-08** 单路径 **normal-release**；**不得 mock B-115 / B-116 / P5** 封口路径；**争议 / 超时** 仍以模板 + 手工为主；与 **Epic D** **并行、非替代**（见 **GO_EPIC_F**）。

---

## 推荐后续方向（规划级）

| 域 | 方向（须单开 TT / 母表行后再动代码） |
|----|--------------------------------------|
| **B-115 / B-116 / P5** | 新增能力或变更契约：**母表**立项 + **GO** 续篇或新卷；**禁止**「口头改口径」绕过封口。 |
| **Epic D** | 新 **`artifact_type`** 或 envelope 字段：**bump** [Epic-D-ops-artifact.v1.schema.json](./Epic-D-ops-artifact.v1.schema.json) 与阶梯 **D-01** 任务表；保持与 **110 / 04 internal** 同锚。 |
| **Epic E** | 新只读块：**先 04 表 + API**，再脚本/前端；脚本**不得**成为唯一对账真值源。 |
| **Epic F** | 可选：第二条自动化（dispute / timeout）**仅**在独立 Epic/TT 中评估；发版仍须 **01 §9** 三项留痕与 **GO** **manifest** 习惯。 |
| **横向** | 发版前机读顺序参考：**Epic D 阶梯** 推荐 **D → E → F**；**pre-release** 可选 **`CHECK_E2E_THREE_PACK`** 见 [Runbook §12.6](../../ops/RUNBOOK.md)、[Epic-F · F-10](./Epic-F-e2e-three-pack-ladder.md#epic-f-f10-pre-release-hook)。 |
| **B110-SEQ2**（**`rating_deadline`**） | **已文档收口**（**B-132** / [**GO_B110_SEQ2**](../../evidence/GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md)）：**SEQ3**（**B-133**）已接 **indexer-reconcile**；其它能力须 **另开母表+TT**；治理参数扩展见 GO **§4**。 |

---

## 相关运维与脚本（不按 Epic 独占）

- **Runbook**：[ops/RUNBOOK.md](../../ops/RUNBOOK.md)（**§2.55** 索引器；**§12.5～12.6** 留痕与 E2E / manifest）。
- **Scripts 索引**：[scripts/README.md](../../scripts/README.md)（**check-e2e-three-pack-evidence**、**internal-indexer-ops**、**finance-readonly-smoke**、**pre-release-automation** 等）。

---

**变更原则**：本页仅增删**链接行**或**导航说明**；**不**在此文定义或修改业务语义。封口语义以 **各 GO**、**04**、**14**、**110** 与 **母表** 为准。
