# Playwright 全量 / 宽分型 — 逐条打勾台账（真源驱动）

真源与流程见 **[docs/spec/53-E2E环境与执行说明.md §六](../../docs/spec/53-E2E环境与执行说明.md#53-e2e-full-run-log-checklist)**。

## 本轮冻结元数据

| 项 | 值 |
|----|-----|
| 填表日期 | 2026-05-12 |
| git SHA（简写） | `b763c80` |

## 已跑命令（① 本地）

| 命令 | 结果 |
|------|------|
| `cd frontend && npm run e2e:chromium:core-release` | **25 passed**（约 2.2m） |
| `cd frontend && npm run e2e:chromium:trust-gate` | **24 passed**（约 1.4m） |
| `cd frontend && npm run e2e:chromium:93-admin-matrix` | **8 passed**（约 6.4m） |
| `cd frontend && npm run e2e:chromium:93-enterprise-remediation` | **14 passed**（约 2.1m） |
| `cd frontend && npm run e2e:market-community` | **17 passed**（约 1.9m） |
| `cd frontend && npm run e2e:full-chromium:list` | **exit 1** — **13 passed** / **134 failed** / **186 skipped**（约 43.6m）；失败主因见下表 #1 |

## 失败逐条清单

| # | 用例标识 | 失败表象 | 归类 | 拟修复落点 | 最小复跑命令 | 复跑结果 | 已勾 |
|---|----------|----------|------|------------|--------------|----------|------|
| 1 | `e2e:full-chromium:list`（级联） | 大量 `gotoSmoke` / `page.goto` → `net::ERR_CONNECTION_REFUSED` @ `http://localhost:3012/...`；Playwright 末行 **186 skipped / 134 failed / 13 passed** | 全栈长套 · FE 进程 | Next dev 中途不可用（OOM/崩溃等）；与 `run-e2e-default.mjs` 在 **exit 1** 时的尾注（`:3012` 级联红）一致 | 先保小切片绿（如 `e2e:chromium:smoke-surface`），再重跑全量；可选试验 `PLAYWRIGHT_REUSE_FE_SERVER=1`、降 worker、查本机 `frontend/test-results` / `playwright-report` | 待复跑 | ☐ |

## 说明

- 上表 **#1** 为**根因级**一条：134 条失败为同源级联，**不**按 134 行机械抄用例名。
- HTML / trace 真源以 `frontend/playwright-report/`、`frontend/test-results/` 为准（若本次已生成）。
