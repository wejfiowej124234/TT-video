# TT-L4-PARALLEL-CI-001 · CI 并行验证（Sepolia · `start` · workers=2）

**Version:** 1.0.1  
**Status:** 观测（**不**替代 **[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)** 默认 **`npm run e2e:sepolia` 单 worker** 门禁）

## 1. 唯一目标

在 **GitHub Actions `ubuntu-latest` + `CI=true` → Next `npm run start`**（与 `frontend/playwright.config.ts` 一致）且 **API 全栈** 可读根 **`.env`** 的前提下，验证 **`PLAYWRIGHT_WORKERS=2`**（**不显式** `PLAYWRIGHT_PARALLEL=1`，即 **仅跨文件并行**）能否稳定达到 **`chromium-sepolia` 193 passed / 0 failed、exit 0**。

## 2. 与现有门禁的边界

| 维度 | **L4 主门禁（不变）** | **本卡（L4-PARALLEL-CI）** |
|------|------------------------|----------------------------|
| **触发** | 本机 / 既有流程以 **`npm run e2e:sepolia`** 默认 **workers:1** 为准 | **`.github/workflows/l4-parallel-ci.yml`** 独立 job |
| **Next** | 本机多为 **`next dev`** | **CI 下 `npm run start`**（生产构建产物） |
| **是否阻塞合并** | 以仓库既定 **required checks** 为准（本卡 **不**默认加入） | Job 设 **`continue-on-error: true`**，直至连续 **193/0** 证据后再议升格 |

## 3. CI 启用条件（Secrets）

未配置时 **整个 job 跳过**（不在 PR 上制造假红）：

| Secret | 用途 |
|--------|------|
| **`L4_CI_DOTENV_B64`** | 将**与本机 Sepolia 全栈 E2E 等价**的根目录 `.env` 做 **base64** 一行写入 GitHub **Actions secrets**；workflow 解码为 `${{ github.workspace }}/.env`，供 **`cargo run -p traveltrust-api`** 与 Playwright 全栈使用。 |

**生成示例（本机，勿把明文提交进 git）：**

```bash
# 在仓库根，已有一份可跑通 `npm run e2e:sepolia` 的 .env 时：
base64 -w0 < .env | gh secret set L4_CI_DOTENV_B64
```

**CI Postgres**：workflow 在解码后 **追加** `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（与 job 内 **services.postgres** 对齐），覆盖 `.env` 中可能指向不可达主机的数据库 URL。

## 4. Workflow 行为摘要

| 项 | 值 |
|----|-----|
| **文件** | [`.github/workflows/l4-parallel-ci.yml`](../../.github/workflows/l4-parallel-ci.yml) |
| **未配置 secret 时** | **`secrets` 不可用于 `jobs.*.if`**（`workflow_dispatch` 会 422）；用 **Gate** 步骤检测 `L4_CI_DOTENV_B64`，为空则后续步骤跳过、job **绿**（不占假红）。 |
| **并行度** | **`PLAYWRIGHT_WORKERS=2`**；**不**设 `PLAYWRIGHT_L4_FILE_PARALLEL`（避免脚本把 workers 改成 4） |
| **套件** | `cd frontend && npm run e2e:sepolia`（`run-e2e-sepolia.mjs` 已默认 **`PLAYWRIGHT_FULL_STACK=1`**、**`PLAYWRIGHT_EXPECT_CHAIN_ID=11155111`**） |
| **失败留证** | **`continue-on-error: true`**；失败时上传 **`frontend/playwright-report/`** artifact |

## 5. 验收与留证

- **门槛**：Playwright 汇总 **193 passed**、**0 failed**、进程 **exit 0**（与 **[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md) §1** 同形）。  
- **登记**：首次全绿或关键轮次在 PR / 本文件 §6 追加表行：**日期、commit SHA、`elapsed_ms`、Slow file 行**（若有）。  
- **升格**：仅当连续多轮 CI **193/0** 且与 **单 worker 门禁** 无回归争议时，再开 TT 讨论是否将本 job 改为 **blocking** 或扩 **workers**；**默认**仍维持本卡为观测。

## 6. 结果台账（运维填写）

| 日期 | commit SHA | workers | passed / failed | exit | 备注 |
|------|------------|---------|-----------------|------|------|
| 2026-04-19（UTC） | f4e1a70 | **2** | **e2e 未执行**（未达 193/0） | job **failure**；workflow **success**（`continue-on-error`） | 首轮真实 CI：[run 24617409810](https://github.com/TT-Expedition/TT-Expedition/actions/runs/24617409810) · `workflow_dispatch` · job wall **356s**（~5m56s）· **Build traveltrust-api** 失败（编译错误，未进入 Playwright）· artifact **`l4-parallel-ci-playwright-report`** ~**195 KiB**（build 失败后上传） |
| （待跑） | | **2** | | | 待 **`traveltrust-api`** 在 CI 上可编译后重跑以登记 **193/0** 与 Slow file |

## 7. 相关链接

- **perf 分单（本机 dev 并行结论）**：[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md) **§3.4**  
- **Sepolia 基线口径**：[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)
