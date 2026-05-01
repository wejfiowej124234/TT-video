# Scripts 程序级索引（TT-MOD-B1-06）

**定位**：本文件是 `scripts/` 的**薄索引**（按目录与职责速查）；**详细说明、兼容策略、长表**仍以 **[README.md](./README.md)** 为准。

## 目录与职责

| 路径 | 职责 | 典型调用方 |
|------|------|------------|
| **[gates/](./gates/)** | CI / PR 门禁、04/13-1 路由对照、SSOT Guard、版本三元组、wave 文件、基线回归、`pre-release-automation` 串联段等 | `.github/workflows/*`、`bash scripts/check-invariants.sh`、`pre-release-automation.sh` |
| **[ops/](./ops/)** | internal / indexer / admin 观测、对账探针、治理 SSOT ops-check、导出与只读 smoke | 值班 Runbook、`internal-indexer-ops`、根路径薄转发 |
| **[dev/](./dev/)** | 本地起停、迁移前缀、ABI 校验、前端 manifest、e2e 辅助、`windows/` 个人脚本 | 开发者本机、`start_dev` / `start-api-with-seed` 相关 |
| **根** | **`enterprise-preflight.{ps1,sh}`** | SQLx + 55-S13 + 可选 forge multiset；见 [README §快速使用](./README.md) 企业级预检段 |
| **ops/** | **`b435-first-payment-evidence-run.sh`** | Sepolia：`b435-preflight` → `/health`+`/meta` → 校验/合并 `tx_hashes.first_payment` → `b435-evidence-internal-curls`；根入口 **`scripts/b435-first-payment-evidence-run.sh`** |

## 根目录薄转发（稳定入口）

历史文档与 workflow 常写 **`scripts/<name>.sh`**；实现可能在 **`gates/`** / **`ops/`** / **`dev/`**。规则见 [README.md § 单一入口 / 兼容策略](./README.md)。

## 快速锚点（按主题，非全量）

| 主题 | 优先入口 |
|------|-----------|
| Build 首步 invariants + SSOT Gate v2 | `check-invariants.sh` → `gates/ssot-guard-ci-v2.py` |
| 04 路由四连 | `run-check-04-routes.sh`（串联 `gates/` 下 Python） |
| 07 版本三元组 | `gates/check-07-version-triple.sh`（或根转发同名） |
| internal 探针 / 快照 | `ops/indexer-reconcile-probe.sh`、`ops/indexer-public-snapshot.sh`、`ops/internal-indexer-ops.sh` |
| **91 保险层（manifest / chain_id / FeeRouter 快照）** | `ops/evidence-run-sha256-manifest.sh`、`gates/check-evidence-run-insurance-gate.sh`、`ops/fee-router-ops-snapshot.sh`；**`tt-testnet-fullstack-seal.sh`** 串联 |
| 本地三连预检 | `dev/dev-preflight.sh`（或根转发；**`gates/maybe-run-ai-task-card-index-overview-on-diff.sh`** 与 **`gates/ci-local-delivery-minimum.sh`** 同源条件串 **AI 一览**） |
| **L4 parallel CI（GitHub · `gh`）** | `dev/gh-l4-run-inspect.sh`（根 **`gh-l4-run-inspect.sh`** / **`gh-l4-run-inspect.ps1`**）；与 **TT-L4-PARALLEL-CI-001** 对读 |
| **TT-DOC 企业审计机读** | `doc-enterprise-audit-machine-phases.sh`（**`DOC_AUDIT_FULL`**、**`DOC_AUDIT_SKIP_*`**、**`DOC_AUDIT_LINKS_ENFORCE`**）；与 **TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001** 对读 |
| TT-MAINNET **G0～G6+SL** | `check-mainnet-launch-precheck-gate.sh` → `gates/…`（**`${MAINNET_EVIDENCE_RUN_DIR}/shadow_go_no_go.json`** **机读** **）；** **`broadcast-batch-blockers.yml`** **job** **`TT-MAINNET G0–G6+SL`** **；** **§0** **SL** **包** **`evidence/mainnet_shadow_launch/run_<UTC>/`** |

## 与工程台账的关系

- **任务卡编号 `TT-MOD-B1-06`**：仅登记本索引文件；**不**改变任何脚本行为与退出码。
- 若要将 **TT-MOD-*** 系列纳入正式台账，须在 **`docs/任务母表.md`** 增行并在 **`docs/AI任务卡索引.md`** 登记 **TT**（见 [README Pre-TT 清单](./README.md)）。
