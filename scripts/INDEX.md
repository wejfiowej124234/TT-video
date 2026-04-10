# Scripts 程序级索引（TT-MOD-B1-06）

**定位**：本文件是 `scripts/` 的**薄索引**（按目录与职责速查）；**详细说明、兼容策略、长表**仍以 **[README.md](./README.md)** 为准。

## 目录与职责

| 路径 | 职责 | 典型调用方 |
|------|------|------------|
| **[gates/](./gates/)** | CI / PR 门禁、04/13-1 路由对照、SSOT Guard、版本三元组、wave 文件、基线回归、`pre-release-automation` 串联段等 | `.github/workflows/*`、`bash scripts/check-invariants.sh`、`pre-release-automation.sh` |
| **[ops/](./ops/)** | internal / indexer / admin 观测、对账探针、治理 SSOT ops-check、导出与只读 smoke | 值班 Runbook、`internal-indexer-ops`、根路径薄转发 |
| **[dev/](./dev/)** | 本地起停、迁移前缀、ABI 校验、前端 manifest、e2e 辅助、`windows/` 个人脚本 | 开发者本机、`start_dev` / `start-api-with-seed` 相关 |

## 根目录薄转发（稳定入口）

历史文档与 workflow 常写 **`scripts/<name>.sh`**；实现可能在 **`gates/`** / **`ops/`** / **`dev/`**。规则见 [README.md § 单一入口 / 兼容策略](./README.md)。

## 快速锚点（按主题，非全量）

| 主题 | 优先入口 |
|------|-----------|
| Build 首步 invariants + SSOT Gate v2 | `check-invariants.sh` → `gates/ssot-guard-ci-v2.py` |
| 04 路由四连 | `run-check-04-routes.sh`（串联 `gates/` 下 Python） |
| 07 版本三元组 | `gates/check-07-version-triple.sh`（或根转发同名） |
| internal 探针 / 快照 | `ops/indexer-reconcile-probe.sh`、`ops/indexer-public-snapshot.sh`、`ops/internal-indexer-ops.sh` |
| 本地三连预检 | `dev/dev-preflight.sh`（或根转发） |

## 与工程台账的关系

- **任务卡编号 `TT-MOD-B1-06`**：仅登记本索引文件；**不**改变任何脚本行为与退出码。
- 若要将 **TT-MOD-*** 系列纳入正式台账，须在 **`docs/任务母表.md`** 增行并在 **`docs/AI任务卡索引.md`** 登记 **TT**（见 [README Pre-TT 清单](./README.md)）。
