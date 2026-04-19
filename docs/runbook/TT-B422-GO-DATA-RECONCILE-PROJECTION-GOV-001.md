# TT-B422 · B-422 — GO 闭环：数据 reconcile / 投影 / 治理尾对拍

**母表**：[B-422](../任务母表.md)  
**卡号**：`TT-B422-GO-DATA-RECONCILE-PROJECTION-GOV-001`  
**状态**：已封口（2026-04-16）

---

## 1. 验收封口

**机读单一入口**：`bash scripts/check-data-reconcile-projection-gov-gate.sh`（probe + **B-402** 烟测 + SEQ10 ops-check；细节以脚本 `--help` / 母表行为准）。

---

## 2. 互证

- **[spec/07](../spec/07-开发流程与顺序.md)**  
- **GO 总册**：[TT-GO-CLOSELOOP-10-B418-B427-001.md](./TT-GO-CLOSELOOP-10-B418-B427-001.md#b-422--tt-b422-go-data-reconcile-projection-gov-001)
