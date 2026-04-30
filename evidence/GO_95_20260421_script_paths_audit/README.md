# 95 · §10.2 首条 — CI / `frontend/package.json` → `scripts/` 路径存在性机读

**审计日期**：2026-04-21  
**SSOT**：`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` · **§10.2** 首条（**CI / `package.json`** 调用的 **`scripts/`** 路径在仓库内 **真实存在**）。

## 复现实验

在仓库根目录执行（需 **Python 3**）：

```bash
python scripts/audit-workflow-and-frontend-script-paths.py
```

期望退出码 **0**，标准输出末行 **`ALL_OK`**。

## 结果摘要（本提交登记时）

| 来源 | 唯一路径数 | 缺失 |
|------|------------|------|
| `.github/workflows/*.yml` 内可机读引用 | 55 | 0 |
| `frontend/package.json` → `frontend/scripts/*.mjs` | 12 | 0 |

**说明**：本证据覆盖 **workflow `run:` / `paths:` / `check_anchor` 第三参 / `bash -n` / `python scripts/`** 等常见形态；**不**替代 **§10.2** 其余条（Runbook clean clone、**`scripts/archive/`**、**sh↔ps1** 全矩阵、密钥占位符全仓审计）及 **§8.2 行完成**。
