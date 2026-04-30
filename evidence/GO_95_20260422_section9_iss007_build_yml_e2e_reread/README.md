# GO_95 · §9 · ISS-007 · `build.yml` `e2e` 机读旁证 · 2026-04-22

**95 母表**：**[95 §9 ISS-007](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)**（**仍开**）。**本包**仅 **YAML 机读**，**不**替代 **`github.run_id`** 绿日志、**`report.json`**、**93 全矩阵**。

---

## 1 · 机读真值（`.github/workflows/build.yml` · `e2e` job）

| 项 | 值 |
|---|-----|
| **Job 名** | **`e2e`** |
| **Job 级 `continue-on-error`** | **`true`**（**整 job 失败不必然阻断**顶层 **`Build` workflow 结论** — 闭 **ISS-007** 时须显式核对 **该 job 自身** **`outcome`** / **artifact**） |
| **`services.postgres`** | **`postgres:16-alpine`**；**`POSTGRES_USER/PASSWORD/DB`** = **`traveltrust`** |
| **API 启动 `DATABASE_URL`** | **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（**`Start API on 8080 for E2E`** step **`env:`**） |
| **Playwright step** | **`npm run e2e -- --project=chromium`**；step 级 **`continue-on-error: false`** |
| **证据产物** | **`e2e_core_report.json`** / **`e2e_trace_index.csv`** 上传 **`build-e2e-evidence`**；**`e2e-playwright-outcome.txt`**（**`e2e-playwright-outcome`**） |

---

## 2 · 诚实边界

- **`e2e_core_report.json`** 模板内写 **`"passed": true`** — **信息性**占位；**不得**单独采信为 **E2E 真绿**（以 **Playwright step** **`outcome`** 与 **`github.run_id`** 日志为准）。
- **本会话**未抓取 **CI `run_id`**；**ISS-007** **仍开**。

---

## 3 · Agent 本机（可选旁证）

**`bash scripts/run-check-04-routes.sh`**：**exit 0**（**2026-04-22** **Cursor** 复跑；**不**替 **`e2e` job**）。

---

## 4 · GitHub Actions 抽样（`gh` · **不**闭 **ISS-007**）

**仓库**（**`gh repo view`**）：**`TT-Expedition/TT-Expedition`**。**点检日**：**2026-04-22**。**命令**：**`gh run list --workflow=build.yml --limit 8`**。

| `databaseId`（`run_id`） | `conclusion` | `displayTitle`（截断） |
|--------------------------|----------------|-------------------------|
| 24696470298 | failure | chore(deps): Bump actions/setup-python from 5 to 6 |
| 24629397715 | failure | chore(deps): Bump actions/download-artifact from 4 to 8 |
| 24629376907 | failure | chore: sync local workspace — code, contracts, docs, scripts… |
| 24621019257 | failure | fix(spec): restore 00/24/26 from snapshots… |
| 24621000910 | failure | docs(TT-LOCAL): §0 fixed rhythm… |
| 24620876981 | failure | fix(spec): restore 00/24/26 docs from snapshots… |
| 24620807207 | failure | docs(母表 B-499): link TT-LOCAL-CI-DELIVERY-GATE… |
| 24620750421 | failure | docs: TT-LOCAL-CI-DELIVERY-GATE hybrid path… |

**`gh run view 24629376907 --json jobs`**：**`name=e2e`** → **`conclusion=failure`** — **https://github.com/TT-Expedition/TT-Expedition/actions/runs/24629376907/job/72013938343**。

**诚实边界**：上表**仅证明**当前抽样窗口内 **`Build`/`e2e` 未形成可持续绿主干证据**；**不**替代 **Owner** 后续 **`success` `run_id`**/**artifact**/**`report.json`** 归档；本地工作区路径可与远程仓库名**不一致**。
