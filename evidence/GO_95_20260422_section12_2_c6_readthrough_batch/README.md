# §12.2 · C-6 读通批次（`scripts/` + GitHub Actions · 非主行闭证 · v1.4.161）

**日期**：2026-04-22  
**范围**：**[scripts/README.md](../../scripts/README.md) §三（验收清单与发版前检查）** 有界读通 + **`.github/workflows/build.yml`** 篇首若干 **`run:`** 步（**`./scripts/*`** 引用样本）+ **R-002 回归闸** 路径存在性；**不**审 **31** 份 workflow 全矩阵、**不**替代 **§10.2** 每条 **`[x]`**、**不**将 **§12.2 · C-6** 主表 **`[ ]`** 改为 **`[x]`**。

## 1. 闸门（exit 0）

| 命令 | 结果 |
|------|------|
| `bash scripts/check-07-version-triple.sh` | **OK**（07 **1.0.858**） |
| `bash scripts/run-check-04-routes.sh` | **exit 0** |

## 2. 机读计数（仓库根）

| 指标 | 命令 | 结果 |
|------|------|------|
| `.github/workflows` `*.yml` | `find .github/workflows -maxdepth 1 -name '*.yml' \| wc -l` | **31** |
| `scripts/gates/` 常规文件 | `find scripts/gates -type f \| wc -l` | **123**（**曾记约 122**；与 **95 文首**/**§12.2·C-6** 本轮纠偏） |

## 3. 有界读通摘要

- **scripts/README §三**：`run-check-04-routes` / `check-55-s13` / `pre-release-automation` / `validate-evidence-manifest` 等与 **04 §3.4**、**Runbook §12.4～12.8**、**R-001/R-002** 互指；**`scripts/gates/`** 为 CI·预合并门禁与 **SSOT** 脚本主扇面（与 **§12.2·C-6** 主表一致）。
- **R-002 机读闸路径**：**`scripts/validate-regression-report.py`**、**`.github/workflows/regression-report-validate.yml`**、**`scripts/dev/r003_staging_full_regression.py`**、**`scripts/ci/r003-go-staging-freeze-gate.sh`** — 本机 **`test -f`** 均 **存在**。
- **`build.yml` 样本（前 ~45 行）**：**`actions/checkout@v6`** → **`bash ./scripts/check-invariants.sh`** → **`python3 scripts/check_no_legacy_staking_path_as_ssot.py`** → **`bash ./scripts/check-55-s13.sh`** → **`python3 scripts/check-04-routes-vs-code.py`** 等；引用形态为 **`./scripts/...`** / **`python3 scripts/...`**（与 **§10.2**「CI 路径真实存在」叙事同源）。

## 4. 诚实边界

- **未**重跑 **`python scripts/audit-workflow-and-frontend-script-paths.py`**（**§10.2-1** 已 **`ALL_OK`** 历史证）；**未**对 **31×N** step 做全量存在性矩阵。
- **§12.4** 既有 **「C-6（子证）」**/**「workflows→scripts 抽样」**/**「C-6（子证 · `scripts/gates/` 可数）」** 行（**2026-04-21** 起）**不**与本读通批次合并为「主行闭证」。

## 5. 互证

- **95** 文首 **workflows ~31**/**`scripts/gates/`** 与 **§12.1.1·C-6**/**§12.2·C-6**/**§12.4**。
- **台账**：**95 `Version:` 1.4.161** ↔ **`docs/spec/00-文档索引.md`** 表 **95** 行（同批更新）。
