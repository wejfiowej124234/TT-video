# P1-C · E2E 三项脚本 — 缺口官方总表互证

**TT**：`TT-07-63B-P1C-E2E-SINGLE-001`  
**日期**：2026-04-09  

## 结论（本卡不执行业务 E2E）

本 artifact 仅证明 **[01 §「发布与 E2E（P2）」](../../../docs/spec/01-总库总览.md)** 与 **[07 §二 2.1](../../../docs/spec/07-开发流程与顺序.md#21-顺序约束简要)** 所要求的 **三项语义** 已在仓库内 **定义完备、留痕路径明确、可与 GO bundle / P14-3 互链**；**不**替代目标环境真实执行后在 **[27-P14 · P14-3](../../../docs/spec/27-P14-实现记录.md)** 填实 **YYYY-MM-DD**。

## 三项覆盖（与 01 / 07 对齐）

| 项 | 语义 | 可复核留痕 / 执行入口（文档 SSOT） |
|----|------|-------------------------------------|
| **① 正常放款** | createEscrow→deposit→release 全链路 | **[27-P14 · P14-3](../../../docs/spec/27-P14-实现记录.md)** 表行「正常放款」；建议 **`artifacts/e2e-normal-release.md`**（**[evidence/README · 07-p0-e2e-three](../../README.md#07-p0-e2e-three)**）；**示例已检入**：**`evidence/GO_20260407/artifacts/e2e-normal-release.md`**（与 **Epic F-02** 文件名一致）。历史脚本名见 P14-3（**`p10_e2e_normal_release.sh`** 等）；若仓内未保留脚本，以 **P14-3** 与 **GO 样例** 为检索真值。 |
| **② 争议三终态** | Refunded / PartiallyRefunded / Slashed（+ 驳回→Completed） | **P14-3** 表行「争议三终态」；建议 **`artifacts/e2e-dispute-three-terminals.md`**；**示例**：**`evidence/GO_20260407/artifacts/e2e-dispute-three-terminals.md`**。 |
| **③ 三条超时路径** | 接单超时、支付超时、完成超时 | **P14-3** 表行「三条超时路径」；建议 **`artifacts/e2e-three-timeouts.md`**；**示例**：**`evidence/GO_20260407/artifacts/e2e-three-timeouts.md`**。 |

## 执行方式（命令 / 路径 · 发版闭环视角）

1. **有序清单与人工闭环**：**[ops/RUNBOOK.md](../../../ops/RUNBOOK.md) §12.6 **§B**（**三项语义** → **P14-3** 日期；**资损 runbook** → §4；**不**以 Playwright 替代 01 语义）。  
2. **GO 目录与 manifest 登记**：**[evidence/README.md](../../README.md)** **§07-p0-e2e-three** — 三份 **`artifacts/e2e-*.md`** 须列入当次 **`evidence/GO_YYYYMMDD/manifest.json`** 的 **`artifacts[]`**（**`path`** + **`sha256`**）；**`manifest.sha256`** 仅校验 GO 根级 **`manifest.json`**。  
3. **定稿填表**：**[27-P14 · P14-3](../../../docs/spec/27-P14-实现记录.md)** 三处「目标环境留痕日期」— 目标环境执行后改为实际 **YYYY-MM-DD**（对应 **缺口官方总表 P0 #10**）。

## 互证链

**[Runbook §12.6 §B](../../../ops/RUNBOOK.md)** ↔ **本 artifact** ↔ **`evidence/GO_20260409/manifest.json`** ↔ **[27-P14 · P14-3](../../../docs/spec/27-P14-实现记录.md)** ↔ **[缺口与待补-官方总表 · P1-C](../../../docs/spec/缺口与待补-官方总表.md)**。

## 机读 bundle

同目录上一级 **`manifest.json`** / **`manifest.sha256`**（本文件已列入 **`artifacts[]`**）。
