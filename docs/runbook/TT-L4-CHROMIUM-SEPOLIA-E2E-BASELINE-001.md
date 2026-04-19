# TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001 · Sepolia 主链 Playwright 回归基线（chromium-sepolia）

**Version:** 1.0.0  
**Status:** 登记（机读口径；与 **L4** 编排 **[TT-STACK-LAYERS-REGRESSION-ORCH-001](./TT-STACK-LAYERS-REGRESSION-ORCH-001.md)** 对齐）

## 1. 任务卡验收口径（首次全绿 · 固化基线）

以下数字为 **一次完整** `npm run e2e:sepolia`（`frontend` 目录）在 **Sepolia 主链全栈**（`PLAYWRIGHT_FULL_STACK=1`、根 `.env` 已配 RPC/合约、`PLAYWRIGHT_EXPECT_CHAIN_ID=11155111`）下的 **Playwright 汇总行** 口径；重跑时以本机终端 **最后一行汇总** 为准，**须**满足同形约束。

| 字段 | 基线值（2026-04-18 登记） | 重跑时不变约束 |
|------|---------------------------|----------------|
| **Project** | `chromium-sepolia`（依赖 `setup-meta-chain`） | 不得改为仅 `chromium` 冒充 |
| **passed** | **193** | **≥ 193** 且与 `--list` 用例数一致时方可升档；降档须走缺陷 TT |
| **failed** | **0** | **必须为 0** |
| **skipped** | （未强制；以当次汇总为准） | 基线目标为 **skipped 不用于掩盖失败** |
| **进程 exit** | **0** | **必须为 0** |
| **elapsed_ms**（Node 包装进程） | **861929**（约 **14.4 min**） | 仅作耗时参考；**不作为** PASS/FAIL 门槛 |
| **Slow file 提示** | 曾报告 `e2e/smoke.spec.ts` 偏慢；Admin 子树已拆至 **`e2e/smoke-admin.spec.ts`**（单文件时长下降） | 优化后仍以 **failed=0** 为先 |

**证据建议**：终端完整日志或 `playwright-report/index.html`；若 CI 落盘，在 PR/批次 `notes.md` 中摘录 **汇总行** + **commit SHA**。

## 2. 执行入口（Runbook）

```bash
cd frontend
npm run e2e:sepolia
```

等价 Playwright（已由 `scripts/run-e2e-sepolia.mjs` 设置默认 env）：

- `PLAYWRIGHT_FULL_STACK=1`
- `PLAYWRIGHT_EXPECT_CHAIN_ID=11155111`（Sepolia）
- `npx playwright test --project=chromium-sepolia`

**链元数据**：勿设 `PLAYWRIGHT_RELAX_META_CHAIN_GUARD`；须通过 **`setup-meta-chain`**（`e2e/setup/meta-chain-contracts.spec.ts`）。详见 `frontend/playwright.config.ts` 头注释。

## 3. 套件分层（grepInvert 语义 · 不得静默改动）

`chromium-sepolia` 在配置中通过 **`grepInvert: /@e2e-chain-off-mock-pay|@e2e-sepolia-deferred/`** 排除：

- **`@e2e-chain-off-mock-pay`**：`P3_CHAIN_OFF` / **mock-pay** 依赖用例（如 b463–b468、epic-f）。
- **`@e2e-sepolia-deferred`**：暂缓跟进的 **P05**、**auth-ui-logout-me** 等。

**回归基线 PR** 若需调整上述标签或 `grepInvert`，须 **同批** 更新本文件 §1 表格与 §3 说明，并注明原因（避免「绿」来自缩小范围）。

## 4. 相关资产

| 资产 | 路径 |
|------|------|
| Playwright 配置 | `frontend/playwright.config.ts` |
| Sepolia 一键脚本 | `frontend/scripts/run-e2e-sepolia.mjs` |
| npm 脚本 | `frontend/package.json` → `e2e:sepolia` |
| 烟雾用例（耗时敏感） | `frontend/e2e/smoke.spec.ts`、`frontend/e2e/smoke-community.spec.ts`、`frontend/e2e/smoke-admin.spec.ts`、`frontend/e2e/helpers/smoke-nav.ts` |
| 烟雾慢文件性能单（与稳定性分单） | **[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md)** |
| CI 并行观测（`start` · workers=2 · **非**门禁默认） | **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md)**（`.github/workflows/l4-parallel-ci.yml`） |
| **CI 组织前提（非 npm 路径）** | **GitHub Actions 计费成功 + spending limit 放行**；否则 job **未启动**、无 `npm run e2e:sepolia` 日志 — 排障与归因见 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md) §5～§8** |

## 5. 维护

- **bump 基线 passed 数**：全量新增 `chromium-sepolia` 内用例且全绿后，更新 §1 表 `passed` 与登记日期。  
- **Sepolia 以外链**：另开 runbook，**不**覆盖本卡「11155111」口径。

## 6. `gotoSmoke` 导航策略观测（**不得**将 `domcontentloaded` 升格为基线）

### 6.1 `waitUntil: "domcontentloaded"` 实验（拒绝合入）

**日期**：2026-04-18。结论：**更慢**（`elapsed_ms` 高于 §1）、**更不稳**（4 失败），**不作为**新基线。

| 字段 | 当次值 |
|------|--------|
| **passed / failed** | **189 / 4**（`189 passed (15.5m)`） |
| **exit** | **1** |
| **elapsed_ms** | **951257**（约 **15.9 min**；高于 §1 **861929**） |
| **Slow test file** | 日志中 **未** 出现 `Slow test file` 行 |

**失败（4）**：`core-path.spec.ts:93`、`smoke.spec.ts:383`（均为 `/guide` 主内容）、`trust-gate-dispute-evidence.spec.ts:114`、`trust-gate-escrow.spec.ts:331`。

### 6.2 P0：回滚 `gotoSmoke` 为默认 `page.goto`（`load`）后复验

**日期**：2026-04-18，同批 `npm run e2e:sepolia`。结论：**恢复 §1 口径**（193/0、exit 0）；因果上支持「失败主要由 `domcontentloaded` 过早导航引入」。

| 字段 | 当次值 |
|------|--------|
| **passed / failed** | **193 / 0**（`193 passed (14.5m)`） |
| **exit** | **0** |
| **elapsed_ms** | **880566**（约 **14.7 min**） |
| **Slow test file** | `Slow test file: [chromium-sepolia] › e2e\smoke.spec.ts (9.9m)` |

**§1 基线表**：仍以首次登记 **861929** 为准；本小节仅作观测记录。**P1/P2**（`/guide` 单独就绪、`trust-gate` 单独复现）仅在 **保持** 默认 `gotoSmoke` 的前提下另开修补，勿与 `domcontentloaded` 混改。

### 6.3 慢文件拆分（`smoke-admin.spec.ts` · 导航语义不变）

**日期**：2026-04-18。将原 `smoke.spec.ts` 内 **管理后台** 子树迁至 **`e2e/smoke-admin.spec.ts`**，共用 **`e2e/helpers/smoke-nav.ts`**（`gotoSmoke` = 默认 `page.goto` / `load`）；父级 **`test.beforeEach`** 统一 `addSmokeAdminCookies`，去掉各 `describe` 内重复的 Cookie 块。

**子集复跑**（`chromium-sepolia`，仅 `e2e/smoke.spec.ts` + `e2e/smoke-admin.spec.ts`）：**110 passed**，`Slow test file` 仅 **`smoke.spec.ts (7.0m)`**（低于拆分前同口径 **9.9m**）；`smoke-admin` 当次未单列触发 Slow file。`--list` 全 project 仍为 **193** 用例。

### 6.4 拆分后全量 `npm run e2e:sepolia`（**未**复现 §1 绿）

**日期**：2026-04-18。`grepInvert` 与 `gotoSmoke`（默认 `load`）未改。

| 字段 | 当次值 |
|------|--------|
| **passed / failed** | **191 / 2**（`191 passed (17.4m)`） |
| **exit** | **1** |
| **elapsed_ms** | **1053937**（约 **17.6 min**） |
| **Slow test file** | **仅** `Slow test file: [chromium-sepolia] › e2e\smoke.spec.ts (7.5m)`；**无** `smoke-admin.spec.ts` 的 Slow file 行 |

**失败（2）**：`core-path.spec.ts:93`（`/guide` H1 **15s** 未出现）；`smoke.spec.ts:472`（社区举报工单详情 · **Test timeout 30000ms exceeded**）。与拆分无直接因果（`smoke-admin` 全过）；属 **L4 时序 / 负载 flake**，须复跑或单独加固就绪等待后再 bump §1。

### 6.5 `/guide` 与社区举报工单 flake 加固后全量复验

**日期**：2026-04-18。仅改 `e2e/core-path.spec.ts`（向导工作台）、`e2e/smoke.spec.ts`（向导工作台页、社区举报工单详情）：`waitForURL`、**`main` 内 `header` 下可见 `h1`** 就绪链、超时与 `test.setTimeout`；**未**改 `grepInvert`、`gotoSmoke`、断言文案正则。

| 字段 | 当次值 |
|------|--------|
| **passed / failed** | **193 / 0**（`193 passed (19.4m)`） |
| **exit** | **0** |
| **elapsed_ms** | **1170903**（约 **19.5 min**） |
| **Slow test file** | **`smoke.spec.ts (9.1m)`** 与 **`smoke-admin.spec.ts (5.2m)`** 各一行 |

### 6.6 稳定性修复验收记录（**193/0** · **§1 首次基线数字不变**）

**日期**：2026-04-18。**结论**：L4 **稳定性**任务收口为 **`npm run e2e:sepolia` → 193 passed / 0 failed、exit 0**；技术增量见 **§6.5**（`/guide` 与社区举报工单 flake 加固；`grepInvert` 与 **`gotoSmoke`（默认 `load`）** 未改）。

**与 §1 的关系**：

- **§1 表内「首次登记」字段**（含 **`elapsed_ms: 861929`** 等）**不予替换**为本轮 **`1170903`** 或 Slow file 分钟数；后者仅作 **加固后观测**，登记于 §6.5。  
- **passed=193 / failed=0 / exit=0** 与 §1 **同形约束**一致，可作为 **稳定性修复成功** 的机读验收表述。  
- **烟雾单文件耗时**的后续优化 **不**在本卡扩 scope：另见 **[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md)**。

### 6.7 社区烟雾拆分（`smoke-community.spec.ts` · TT-L4-SMOKE-SLOWFILE-PERF-001）

**日期**：2026-04-18。将原 `smoke.spec.ts` 内 **`/community/*` 长链**及散落的社区深链（Feed、用户主页、私信、举报工单等）迁至 **`e2e/smoke-community.spec.ts`**，共用 **`gotoSmoke`**；**`grepInvert` 与 `gotoSmoke`（默认 `load`）未改**，断言文案/正则未改。另：**`/network` 重定向** 补 **`test.setTimeout(60_000)`** 与 **`waitForURL` 45s**；**`core-path`「向导工作台可访问」** 延长 URL / main / h1 等待（与烟雾侧 `/guide` 链一致），以压 L4 负载下 flake。**「我的页」已登录分支** Profile `heading` 在 **§6.8** perf 迭代中调至 **`35s`**（本节合入时曾为 **20s**）。

| 字段 | 当次值 |
|------|--------|
| **passed / failed** | **193 / 0**（`193 passed (20.0m)`） |
| **exit** | **0** |
| **elapsed_ms** | **1205248**（约 **20.1 min**） |
| **Slow test file** | **`smoke.spec.ts (6.5m)`** 与 **`smoke-admin.spec.ts (5.5m)`** 各一行；**无** `smoke-community.spec.ts` 的 Slow file 行 |

**与 §6.6 对照（拆分前观测）**：`smoke.spec.ts` **9.1m** → **6.5m**（同机单次全量；**§1 首次基线 `elapsed_ms: 861929` 等不予替换**）。合入后请将本小节 **commit SHA** 更新为实际推送 revision。

**阶段二（并行度）**：`workers` / `fullyParallel` / 烟雾多文件（`smoke` / `smoke-governance` / `smoke-community` / `smoke-admin`）是否真并行、以及「单测体内」串行链结论，见 **[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md) §3.1** 与 `frontend/playwright.config.ts` 头部注释。**`PLAYWRIGHT_L4_FILE_PARALLEL=1` 连续双轮**实证见 **同卡 §3.2**（**未**达两轮 193/0，**不**作为默认本地性能口径）。

### 6.8 治理烟雾拆分与 perf 单迭代 2 验收（`smoke-governance.spec.ts` · TT-L4-SMOKE-SLOWFILE-PERF-001）

**日期**：2026-04-18。将原 **`smoke.spec.ts`** 内 **治理 + 向导质押** 共 **8** 条迁至 **`e2e/smoke-governance.spec.ts`**（`gotoSmoke` 与断言不变）；**`grepInvert` / `gotoSmoke`（默认 `load`）未改**。perf 单 **迭代 2** 默认单 worker **193/0** 机读验收与 **Slow file** 登记见 **[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md) §4.1**；**并行 perf** 承接口径见 **同卡 §3.4**；**CI + `start` + workers=2** 观测见 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md)**。

| 字段 | 当次值（与 perf 卡 §4.1 一致） |
|------|-------------------------------|
| **passed / failed** | **193 / 0** |
| **exit** | **0** |
| **elapsed_ms** | **1396418** |
| **Slow test file** | **`smoke-admin.spec.ts (6.9m)`**；**`smoke.spec.ts (6.1m)`** |

**与 §1**：**不**替换 §1 表内首次 **`elapsed_ms`**；本小节仅作 **perf 迭代验收** 交叉索引。合入后请将 **§4.1** 与本小节 **commit SHA** 更新为实际推送 revision。
