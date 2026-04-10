# P1-C · 对账流程（reconcile）— 缺口官方总表互证

**TT**：`TT-07-63B-P1C-RECONCILE-SINGLE-001`  
**日期**：2026-04-09  

## 结论

本 artifact 将 **[缺口与待补-官方总表 · P1-C](../../../docs/spec/缺口与待补-官方总表.md)**「**对账流程**」与 **[Runbook §12.5](../../../ops/RUNBOOK.md)**、**§2.55**、**GO bundle** 登记为同一互证链；**不替代** 目标环境 **`INTERNAL_API_SECRET`** 下真实对账与 **P0 #7** 填实路径。

## Reconcile 流程（与 §12.5「目标环境最小顺序」逐步对齐）

| §12.5 步 | 动作 | 命令 / 入口 |
|---------|------|-------------|
| 1 | 前置 | **`API_BASE_URL`**、**`INTERNAL_API_SECRET`**（内网；勿暴露公网） |
| 2 | 即时只读对账 | **`GET /api/v1/internal/indexer-status?live_reconcile=1`**（或 **`true`/`yes`/`on`**）— **`projection_reconcile_clean`**、**`issues_total`** |
| 3 | 门禁探针 | **`bash scripts/indexer-reconcile-probe.sh`**（**`.\scripts\indexer-reconcile-probe.ps1`** 委托 **.sh**；须 **jq**）— **退出码 0** ⇔ 干净 |
| 4 | （可选）落库报告 | **`POST /api/v1/internal/indexer-reconcile`**，**`persist:true`** |
| 5 | 证据落盘 | **`bash scripts/write-indexer-evidence.sh`** 或 **`bash scripts/internal-indexer-ops.sh evidence`** / **`evidence-bundle`**（**`.ps1`** 同参）→ **`evidence/GO_YYYYMMDD/`**；与 **GO `manifest.json`** **`artifacts[]`** 同批登记 |
| 6 | （可选）链级 dry-run | **`bash scripts/internal-indexer-ops.sh reconcile --chain-scope-dry-run`** 等 — 见 **§2.55**；**execute** 路径不纳入本门禁 |

**生产验收（§12.5）**：**步骤 3** **退出码 0**；或**步骤 2** 人工确认 **`projection_reconcile_clean`** 与 **`issues_total`** 可接受。

## 证据指针（示例，非本轮必跑）

- 仓内 **dry-run / 状态** 类示例曾见 **`evidence/GO_20260407/artifacts/`** 下 **`indexer-*`** JSON（与 **`manifest.json`** 同批口径）；**正式过门**须在**当次** **`GO_YYYYMMDD`** 落盘并对 **`artifacts[]`** 填 **`path` + `sha256`**。

## 权威引用

- **[ops/RUNBOOK.md §12.5](../../../ops/RUNBOOK.md)** — 完整顺序、**与 E2E 三项** 边界。  
- **[ops/RUNBOOK.md §2.55](../../../ops/RUNBOOK.md)** — internal / curl / 语义 **SSOT**。  
- **[evidence/README.md](../../README.md)** — **索引器 / DB 投影对账** 段、**GO** 目录约定。  
- **[01 §9](../../../docs/spec/01-总库总览.md)**、**[04 §四](../../../docs/spec/04-后端与API.md)** — 契约单源（**§12.5** 文首已列）。

## 互证链

**缺口官方总表 P1-C「对账流程」** ↔ **本文件** ↔ **`evidence/GO_20260409/manifest.json`** ↔ **Runbook §12.5** ↔ **evidence/README**。

## 机读 bundle

同目录上一级 **`manifest.json`** / **`manifest.sha256`**（本文件已列入 **`artifacts[]`**）。
