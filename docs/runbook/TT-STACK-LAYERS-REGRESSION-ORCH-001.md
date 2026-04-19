# TT-STACK-LAYERS-REGRESSION-ORCH-001 · 全栈对齐「分层任务卡」编排

**Version:** 1.0.0  
**Status:** 登记（编排 SSOT；**不**声称替代 **93** 矩阵或 **单一命令全站证明**）

## 1. 工程现实（为何必须拆卡）

「前端 / 后端 / DB / 每页 / 每功能 / API / ABI 全部对齐」在仓库里**没有**一条命令能给出完备证明；验收由 **spec SSOT + 分层自动化 + 93/R-002 手工矩阵** 组合承担。本文把可执行工作拆成 **子任务卡（L0～L7）**，便于排期与留证。

| 维度 | SSOT / 资产 | 全自动「逐页逐分支」？ |
|------|-------------|------------------------|
| HTTP API | [04-后端与API.md](../spec/04-后端与API.md) §3.4；`bash scripts/run-check-04-routes.sh` | 否 |
| 合约 ABI ↔ 前后端 | [14-合约-API-ABI-前后端对齐.md](../spec/14-合约-API-ABI-前后端对齐.md)、[38-端口与接口完整清单.md](../spec/38-端口与接口完整清单.md) §3；`scripts/dev/verify-abi-forge.py`（需 **forge**） | 否（依赖本机链工具） |
| 前端页可达 / 深路径 | `frontend/e2e/smoke.spec.ts`、`e2e/p02-*`、`b467-*` 等 | 否（≠ 93 全矩阵） |
| 全站业务矩阵 | [93-全站功能验证矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md)、[93-matrix-batch-tracker](./93-matrix-batch-tracker.md)、[R-002 §4](../spec/R-002-回归执行闭环与发布准入.md) | 登记式手工 / 分批 TT |

## 2. 子任务卡总表（按依赖顺序执行）

**执行口令**：在对话中说 **「执行任务卡 `TT-STACK-L{n}-…`」**（一次一层），助手以本表该层为范围。

| 层 ID | 名称 | 依赖 | 主命令 / 入口 | 完成定义（DONE） | 证据建议 |
|-------|------|------|----------------|------------------|----------|
| **L0** | `TT-STACK-L0-DOC-ROUTES-GATES-001` | 无 | `SKIP_FORGE_VERIFY=1 bash scripts/pre-release-automation.sh`（或至少 `bash scripts/run-check-04-routes.sh`）；根目录启用 **`STRICT_SSOT=1`** 时**先** `bash scripts/dev/check-strict-ssot-local-prereqs.sh`（Win：`scripts/dev/check-strict-ssot-local-prereqs.ps1`） | **exit 0**；04 §3.4 与路由 / B-45x 门禁无新增失败 | CI 日志或本地终端输出片段 |
| **L1** | `TT-STACK-L1-API-UNIT-DB-001` | 无 | `cargo test -p traveltrust-api` | **exit 0** | 同上 |
| **L2** | `TT-STACK-L2-FRONTEND-VITEST-001` | 无 | `cd frontend && npm test` | **exit 0**（Vitest 全绿） | `npm test` 摘要 |
| **L3** | `TT-STACK-L3-HTTP-SMOKE-AB-001` | Docker Postgres + API 已起 | [dev-local-smoke-baseline.md](../dev-local-smoke-baseline.md) · `bash scripts/smoke-ab-core-chain.sh` | **exit 0**（含 DB 抽检） | 脚本输出 + 可选 `notes.md` |
| **L4** | `TT-STACK-L4-PLAYWRIGHT-E2E-001` | L3 或等价全栈 URL | **默认 Chromium**：`PLAYWRIGHT_FULL_STACK=1 npx playwright test --project=chromium`（或子集：`e2e/smoke.spec.ts`、core-path）。**Sepolia 主链基线（固化）**：`cd frontend && npm run e2e:sepolia` → **`chromium-sepolia`**；机读口径与证据要求见 **[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)**；**烟雾慢文件耗时优化**（与稳定性分单）见 **[TT-L4-SMOKE-SLOWFILE-PERF-001](./TT-L4-SMOKE-SLOWFILE-PERF-001.md)**；**CI + `start` 下 workers=2 并行观测**（**不**替代默认单 worker 门禁）见 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md)**。 | 所选 **project** 全绿；`ERR_CONNECTION_REFUSED` → 先修端口/进程再重跑 | `playwright-report/` 或截图目录；Sepolia 基线另附终端汇总行（见 **TT-L4** §1）；**GitHub CI** 侧 **组织 Actions 计费/额度**、**`L4_CI_DOTENV_B64`**、**分支与 `main` 契约对齐** 见 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md) §5～§8** |
| **L5** | `TT-STACK-L5-FORGE-ABI-VERIFY-001` | **foundry** / `forge` | `bash scripts/dev/run-verify-abi-forge.sh`（见 **14** / **55-S13** 叙述） | **exit 0** | forge 输出 |
| **L6** | `TT-STACK-L6-93-MATRIX-BATCH-001` | 环境满足各批 **前置** | [93-matrix-batch-tracker](./93-matrix-batch-tracker.md) · **TT-B486～TT-B498** | 每批 `report.json` / notes：**PASS/FAIL/BLOCKED** 有记录；**FAIL** 须有 notes | `evidence/93-batch-*/<run_id>/` |
| **L7** | `TT-STACK-L7-RELEASE-MANUAL-MATRIX-001` | L0～L6 按发布策略已绿 | **15 附录〇**、缺口总表 P0、**R-002** 会签项 | 人工勾选完成；与 **GO** 证据包路径一致 | `evidence/GO_*` 或团队台账 |

## 3. 一键「开发基线」组合（非 L0 全集）

与 **L3** 同级的本地替身链：**[TT-LOCAL-R003-DEV-FULLCHAIN-001](../AI任务卡索引.from-stash.md#tt-local-r003-dev-fullchain-001)**（**一览 433**）。全栈浏览器链路见 **L4**；**npm run e2e:auth-chain** 见 `frontend/scripts/run-e2e-auth-chain.mjs` 头注释。

## 4. 与 93 批次的关系

**L6** 不重复写用例 ID：**93** 正文 + **tracker** 批次表为真值；本编排卡只定义 **何时跑哪类自动化、证据放哪**。**93-R003-STAGING** 仍以 **TT-B486** 为收口卡，**不**被本文件替代。

## 5. 维护

- 若新增「仓库级门禁脚本」，优先补 **L0** 表内命令列，**避免**再发明第三条「全站一键」口号。  
- 若 bump **04** §3.4 契约，**L0** 必跑；若动 **reviews** `meta.review_json_contract`，**L1** + **B-451** 门禁同批。
- **`crates/api/src/**/tests/mod.rs`**：外置 `*.rs` 测试文件**必须**在对应 `mod.rs` 声明，否则 **`cargo test`** 永不编译该文件（曾发现 `routes/orders/tests/` 下 **6** 个 P07/B-449 相关文件未挂载；已于 **2026-04-18** 全部 `mod` 收口）。

## 6. 偶发失败（L1）

若 **`cargo test -p traveltrust-api`** 全量偶发 **1** 条失败、**单独以测试名过滤重跑** 为 **ok**，按 **flake** 在批次 `notes.md` 记一笔（含测试名与两次命令）；仍重复失败再单开缺陷 TT。
