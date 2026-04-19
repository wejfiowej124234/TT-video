# TT-L4-PARALLEL-CI-001 · CI 并行验证（Sepolia · `start` · workers=2）

**Version:** 1.0.2  
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
| **npm 脚本契约（gate 为 true 时）** | **`Assert L4 e2e:sepolia script contract`**：`frontend/package.json` 的 **`scripts["e2e:sepolia"]`** 须引用 **`run-e2e-sepolia.mjs`**，且 **`frontend/scripts/run-e2e-sepolia.mjs`** 存在；在 **`npm ci`** 之前失败，避免长链路后才报 **`Missing script: "e2e:sepolia"`**（长寿命分支未合并 **`main`** 时常见）。 |
| **并行度** | **`PLAYWRIGHT_WORKERS=2`**；**不**设 `PLAYWRIGHT_L4_FILE_PARALLEL`（避免脚本把 workers 改成 4） |
| **套件** | `cd frontend && npm run e2e:sepolia`（`run-e2e-sepolia.mjs` 已默认 **`PLAYWRIGHT_FULL_STACK=1`**、**`PLAYWRIGHT_EXPECT_CHAIN_ID=11155111`**） |
| **失败留证** | **`continue-on-error: true`**；失败时上传 **`frontend/playwright-report/`** artifact（当前 workflow 使用 **`actions/upload-artifact@v4`**；与 **Dependabot** 对其它 workflow 的 **`upload-artifact@v7` bump** **无**同一 job 内强绑定，**归因** 须以 **本 job 日志是否出现 upload 步骤失败** 为准，见 **§5.2**）。 |

## 5. 组织级前置与排障（非仓库代码可修）

### 5.1 GitHub Actions 计费 / 支出限额

若组织 **付款失败**、**未绑卡** 或 **Actions spending limit** 为 **0 / 低于实际需求**，GitHub 可能 **拒绝调度** `ubuntu-latest` job，注解近似：

> The job was not started because recent account payments have failed or your spending limit needs to be increased.

此时 **无** Checkout 之后常规 step 日志、**无** `npm run e2e:sepolia`、**无** artifact **上传**阶段 — **不得**将此类红叉 **归因** 于 **`actions/upload-artifact` 版本 bump**（PR 类依赖升级）**除非** 另见 **artifact upload 步骤** 自身报错。

**处理**：组织 Owner / Billing 权限 → **Settings → Billing and plans** → 修正支付方式并放行 **GitHub Actions** 支出（组织路径：`https://github.com/organizations/<ORG>/settings/billing`）。修复后对本 workflow **Re-run jobs** 或推新 commit。

### 5.2 归因纪律（与 Dependabot / `upload-artifact` bump 并行）

- **非 bump 直接**：job **未启动**、**Gate** `run=false`、**契约断言**失败、**编译**/**`npm ci`**/**Playwright** 失败，或仅见 **download-artifact** 相关日志 — **均不**自动记为 **`upload-artifact` bump** 回归。  
- **才考虑 bump 相关**：**本 workflow run** 的 **Upload … artifact**（或等价上传步骤）**明确失败**，且变更集 **包含** 对应 `uses:` 版本改动并可时间关联。

## 6. 验收与留证

- **门槛**：Playwright 汇总 **193 passed**、**0 failed**、进程 **exit 0**（与 **[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md) §1** 同形）。  
- **登记**：首次全绿或关键轮次在 PR / 本文件 §7 追加表行：**日期、commit SHA、`elapsed_ms`、Slow file 行**（若有）。  
- **升格**：仅当连续多轮 CI **193/0** 且与 **单 worker 门禁** 无回归争议时，再开 TT 讨论是否将本 job 改为 **blocking** 或扩 **workers**；**默认**仍维持本卡为观测。

## 7. 结果台账（运维填写）

| 日期 | commit SHA | workers | passed / failed | exit | 备注 |
|------|------------|---------|-----------------|------|------|
| 2026-04-19（UTC） | f4e1a70 | **2** | **e2e 未执行**（未达 193/0） | job **failure**；workflow **success**（`continue-on-error`） | 首轮真实 CI：[run 24617409810](https://github.com/TT-Expedition/TT-Expedition/actions/runs/24617409810) · `workflow_dispatch` · job wall **356s**（~5m56s）· **Build traveltrust-api** 失败（编译错误，未进入 Playwright）· artifact **`l4-parallel-ci-playwright-report`** ~**195 KiB**（build 失败后上传） |
| 2026-04-19（UTC） | 49dcafe | **2** | **e2e 未执行**（job **未调度**） | job **failure**；workflow **success**（`continue-on-error`） | PR [#3](https://github.com/TT-Expedition/TT-Expedition/pull/3) 已合并 **`main`**（含 **`42e88bd`** `e2e:sepolia` 恢复 + **`34b39a2`** 契约断言）；[run 24618396945](https://github.com/TT-Expedition/TT-Expedition/actions/runs/24618396945) · **GitHub 组织计费 / spending limit** → **job was not started**（**无** npm / Playwright / artifact **上传** 日志；归类见 **§5**） |
| （待跑） | | **2** | | | 待 **组织 Actions 可调度** 且 **`traveltrust-api`** 在 CI 可编译后重跑，登记 **193/0** 与 Slow file |

## 8. 缺口与多维对齐（自检清单 · 登记用）

以下 **不**替代缺口官方总表；仅供 **L4-PARALLEL-CI** 观测链 **闭环对拍**。

| 维度 | 当前常见缺口 | 对齐动作 |
|------|----------------|----------|
| **组织 / 计费** | Actions **不启 job**（§5.1） | Billing 修复后 **Re-run**；`gh run view <id>` 可见完整 steps |
| **Secret** | **`L4_CI_DOTENV_B64` 未设** | 整 job 跳过（绿）；需真跑时 `base64 -w0 < .env \| gh secret set L4_CI_DOTENV_B64`（§3） |
| **分支 ↔ `main`** | 长寿命 PR **未合并**含 **`e2e:sepolia`** 的 **`main`** | **`Missing script: "e2e:sepolia"`**；合并 **`main`** 或 cherry-pick **`42e88bd`** 起相关提交；契约步 **§4** 会早失败 |
| **workflow ↔ package.json** | 脚本名 / runner 路径漂移 | 以 **`npm run e2e:sepolia`** 为 SSOT；workflow 已加 **契约断言**（与 **`34b39a2`** 一致） |
| **API 编译** | **`cargo build -p traveltrust-api`** 在观测 SHA 上失败 | 见 §7 首行 run；**未进 Playwright** 时 **不得** 登记 193/0 |
| **归因** | 将 **未启 job** / **npm** 失败 **误记** 为 **`upload-artifact` bump** | 仅 **upload 步骤** 失败 + 变更集可关联时才升格为 bump 怀疑（§5.2） |

## 9. 相关链接

- **perf 分单（本机 dev 并行结论）**：[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md) **§3.4**  
- **Sepolia 基线口径**：[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)
