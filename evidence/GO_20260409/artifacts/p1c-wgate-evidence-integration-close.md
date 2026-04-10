# P1-C · W-GATE-CROSS-CHECK — evidence 集成互证

**TT**：`TT-07-63B-P1C-EVIDENCE-INTEGRATION-001`  
**日期**：2026-04-09  

## 结论

本 artifact 将 **[缺口与待补-官方总表 · P1-C](../../../docs/spec/缺口与待补-官方总表.md)**「**W-GATE-CROSS-CHECK**」与 **Runbook §12.7**、**机读脚本**、**GO bundle** 登记为**同一互证链**；**不替代** **[08-2 审查二](../../../docs/spec/08-2-附录-闭合工单表.md#发版前审查二gate-冲突矩阵与优先级规则)** 人工矩阵填实与签字。

## W-GATE 校验路径（机读辅助）

| 步骤 | 命令 / 路径 | 作用（与 §12.7 一致） |
|------|-------------|------------------------|
| 1 | 仓库根 **`bash scripts/check-governance-doc-linkage.sh`** | 治理专题文档联动（**82/83/84**、**governance-token**、**00**、**07 §二 2.4** 等）；成功时打印 **`OK: governance doc linkage checks passed.`** |
| 2 | 仓库根 **`bash scripts/check-08-consistency.sh`** 或 **`bash scripts/check-08-consistency.sh <BASE_REF>`**（默认对比 **`main`**） | **08-3** 与 **08-4**「文档版本（CI 校验用）」一致性规则；无 **08-3** 变更时可 **skip version-bump** 仍以 **0** 退出 |

**说明**：两脚本为 **§12.7** 已写明的**机器辅助**；**PR / 本地**可在合并前执行并将日志落入 **`evidence/GO_YYYYMMDD/artifacts/*.log`**（可选），与 **P0 #7** 同批。

## 权威文档引用

- **[ops/RUNBOOK.md §12.7](../../../ops/RUNBOOK.md)** — 目的、**08-2 审查二** 落点、**P0 #4**、**00 快速核对 ⑤**、上表两脚本条目。  
- **[evidence/README.md](../../README.md)** — **GO `manifest.json`** / **`manifest.sha256`** 登记规则；与 **§12.7** 人工结论并行留痕。  
- **[00-文档治理总册 §8.3](../../../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)** — **`check-governance-doc-linkage`** 治理门禁 SSOT 互指。

## 互证链

**缺口官方总表 P1-C「W-GATE-CROSS-CHECK」** ↔ **本文件** ↔ **`evidence/GO_20260409/manifest.json`** ↔ **Runbook §12.7** ↔ **`scripts/check-governance-doc-linkage.sh`** / **`scripts/check-08-consistency.sh`** ↔ **08-2 审查二（人工）**。

## 机读 bundle

同目录上一级 **`manifest.json`** / **`manifest.sha256`**（本文件已列入 **`artifacts[]`**）。
