# Phase Close · indexer / reconcile / observability 轴线对齐（B-178 切片）

**TT**：`TT-B178-PHASE-CLOSE-INDEXER-RECONCILE-OBSERVABILITY-001`（主索引一览 **196**）  
**母表**：**B-178**（**不**替代 **[Phase-Close-Docs-Code-Reorg-Plan-B178.md](./Phase-Close-Docs-Code-Reorg-Plan-B178.md)** 五节主规划）  
**前置条件**：**B-147～B-177** 均已封口；**Execution** 归档见 **[Execution-Batch-Archive-B147-B177.md](./Execution-Batch-Archive-B147-B177.md)**。

## 三轴对齐结论（v1）

| **轴** | **规范 / 真源** | **对齐要点** |
|--------|-----------------|--------------|
| **indexer** | **110**、`GET /meta` **`indexer.*`**、internal **`indexer-tick` / replay** | 字段级收口以 **B-167**、**B-174**、**B-169/B-170** 等 **已封口 TT** 与 **04 §3.4 internal** 为 SSOT；**不**在本切片扩写 JSON 形状。 |
| **reconcile** | **110 §3.1**、**`POST …/internal/indexer-reconcile`**、**compound_gate** 叙事 | **checks_total** / **probe** / **drill** 与 **07** / **workflow** **机读同锚**（**B-159**、**B-120** 纪律）；Batch-2/3 观测嵌套 **遵守** **统一壳**（**B-185** 已落地则 **以实现对读** 为准）。 |
| **observability** | **admin overview**、**reconcile** 嵌套只读、**Runbook** 运维句 | **B-188** **observability** **邻域** **与** **153/155/157** **快照 JSON** **对读** — **非** 第二业务真源；**B-166** **叙事对齐** 见 **B-186** 封口链。 |

## 互证文件

- **[spec/04-后端与API.md](spec/04-后端与API.md)** — 公开路由与 **§3.4** internal 表（含 indexer / reconcile 引用行）  
- **[spec/110-阶段开发链上索引器与事件同步器.md](spec/110-阶段开发链上索引器与事件同步器.md)** — indexer 母域 SSOT  
- **[ops/RUNBOOK.md](../ops/RUNBOOK.md)** — 运维动作与证据路径  
- **[Execution-Batch-Archive-B147-B177.md](./Execution-Batch-Archive-B147-B177.md)** — 三批能力摘要  

**零行为变更声明**：本文件 **仅** 文档对齐证明；**不** 引入 **`crates/**`** diff。

---

**维护**：若 **110/04** 对 **indexer-reconcile** 或 **meta** 键集做 **契约级** 变更，**须** **母表行 + TT** 同批；**不** 仅改本切片回避主规划。
