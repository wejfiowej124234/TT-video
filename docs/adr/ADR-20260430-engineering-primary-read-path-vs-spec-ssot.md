# ADR-20260430 — engineering 作为人读主路径 vs spec 契约真源（分层）

**Status:** `proposed`  
**Version:** 0.1.0 · **最后更新：** 2026-04-30  

## 上下文

- `docs/spec/` 根目录存量大、历史叠层多，**人读与检索成本高**（「乱」主要来自**文件数量与入口分散**，不等价于「契约可废弃」）。
- `docs/handbook/engineering/` 以 **Diátaxis · Explanation / How-to** 为主，把**稳定入口、域叙事、验证命令**收敛到 **主序 `NN-*.md`**，降低新同学与单维护者的认知成本。
- 仓库已存在 **机读门禁**（例如 **`04 §3.4`** 与 **`run-check-04-routes`**、**`93`**、**`14` + `contracts/` + `check-55-s13`** 等）与 **删径程序链**（**`08` / `09` / `98` / `SPEC-MIGRATION-STATUS` / 盘点 · registry**）。任何「少读 spec / 删 spec 路径」的落地**不能**绕过上述链条。

## 决策（提议）

采用**两层模型**（同时成立、不得混为一谈）：

1. **人读默认路径（Read path）**：日常开发与审计阅读，**优先**打开 **`docs/handbook/engineering/`**（含 **README 真源阶梯**、域篇 **§6**、**`EVIDENCE-*`**），再按需下钻 **`docs/spec/`** 的契约窗与长文锚点。
2. **契约与机读真源（SSOT，直至后续 ADR 与门禁整体迁移前不变）**：**HTTP 机读**仍以 **`spec/04`** **§3.4** 与脚本闭包为准；**域矩阵**仍以 **`spec/93`** 为准；**链上 ABI 与对齐叙述**仍以 **`spec/14`** + **`contracts/`** + 门禁脚本为准；**流程与版本三线**仍以 **`spec/07`**、**`spec/00` 版本表**为准。

**禁止**：在未完成 **98 §2 登记 + STATUS P-A～P-D + 08 §2 五条件 + 消费方去硬编码 + 专提交 `git rm`** 的前提下，以「engineering 已写全」为由 **整树删除 `docs/spec/`** 或宣称 **engineering 已替代 04/93/14 表体**。

## 后果

- **文档**：须在 **`engineering/README`**（人读动机）与段首 **SSOT**（机读边界）**并存**，避免读者把「主读 engineering」误解为「可删契约 spec」。
- **工程**：若未来要把某类机读窗迁出 `docs/spec/`，须 **单独 ADR（accepted）+ 改脚本消费路径 + 双跑期**，并与 **`registry/spec-path-dependencies*.yaml`**、**盘点文** 同批维护。
- **治理**：本 ADR 为 **`proposed`**；**`accepted`** 前不改变现有 **AGENTS / CONTRIBUTING / `08` / `09` / `98`** 中的 **SSOT** 句的规范含义。

## 参考

- [`docs/runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md`](../runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md)（按 Phase 拆单的执行清单）
- [`docs/handbook/engineering/README.md`](../handbook/engineering/README.md)（真源阶梯、阅读层级）
- [`docs/handbook/engineering/08-文档与spec迁移台账.md`](../handbook/engineering/08-文档与spec迁移台账.md)（删 spec 判定）
- [`docs/handbook/corpus/SPEC-MIGRATION-STATUS.md`](../handbook/corpus/SPEC-MIGRATION-STATUS.md)（P-A～P-D）
- [`docs/spec/98-以代码为真源的文档体系与旧文档替代路线图.md`](../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)
