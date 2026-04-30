# GO_95 · §10.2 全仓库脚本对齐 — 机读基线重验（2026-04-22）

## 1. 已复跑（支撑 §10.2 首条 / 交叉闸）

```bash
python scripts/audit-workflow-and-frontend-script-paths.py
# → ALL_OK；WORKFLOW_SCRIPT_REFS 55；FRONTEND_PKG_SCRIPT_REFS 12；退出码 0

bash scripts/run-check-04-routes.sh
# → exit 0
```

**主历史证据**：`evidence/GO_95_20260421_script_paths_audit/README.md`。

## 2. §10.2 仍 **`[ ]]`** 的余量（本包**不**闭证）

| §10.2 行 | 状态 | 本轮 |
|----------|------|------|
| **Runbook / 08-5**（**裸** **clean clone** 全链 **`exit 0`**） | **`[ ]`**（**v1.4.116** 登记） | **未**跑裸 **Runbook** 摘录命令；**「或」·文档前置** 已由 **v1.4.131** **`…runbook_prerequisites/`** + **[08-5 §2.1](../../docs/spec/08-5-CI与一致性落地说明.md#clean-clone-prereq)** 闭 **95** 子行 **`[x]`**（**≠** 本机曾跑全矩阵）。 |
| **`scripts/archive/`** 或等价 + **索引无 stale（bounded）** | **`[x]`**（**v1.4.137**） | **`scripts/archive/`** **不存在**；**`ops/RUNBOOK.md`/`docs/spec/00-文档索引.md`/`CONTRIBUTING.md`/`docs/go-live-checklist.md`** **`scripts/archive/`** 字面 **0**；**`…section10_2_archive_stale_gate/README.md`**；**不**扫 **全 `docs/spec`**。 |
| **Windows / Bash** **`.ps1`↔`.sh`** | **`[x]`**（文档态） | **机读计数**：**`find scripts -name '*.ps1' \| wc -l` → 96**；**`*.sh` → 198**；**不**证行级等价。 |
| **密钥占位** | **`[x]`**（文档态） | **未**扩扫；仍以 **`…section10_repo_windup`** / **§10.2** 原文边界为准。 |

## 3. 诚实边界

- **55+12 路径存在性** **≠** **§10.2** 全条 **`[x]`**；**P/Q** 仍以 **95 §0.2** 为准（**§10.2** **5/5 `[x]`** 见 **v1.4.137** **`…section10_2_archive_stale_gate/`** 与本包首条并列）。
- **根 `package.json`** 无 **workspace** 脚本扇面 — 与 **95 §10.2** 首条脚注一致。
