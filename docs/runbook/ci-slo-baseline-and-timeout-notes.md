# CI 分轨耗时与 `timeout-minutes` 真值（IMP-CI-001 / IMP-CI-002）

**Version:** 0.1.0  
**Status:** Runbook — **观测基线 / 目标上限占位** + **`build.yml` 硬上限登记**；**不**替代 **[63 §六](../spec/63-项目优化与问题清单.md)**、**[07 §二 2.2](../spec/07-开发流程与顺序.md)** 流程叙述；**不**替代 **Actions** 分析页上的 **p50/p95** 真值（须团队按 runner 实测回填）。

**登记来源**：[next-batch-gap-remediation-implementation-plan.md](./next-batch-gap-remediation-implementation-plan.md) **IMP-CI-001**、**IMP-CI-002**（**B-322**）；审计母本 [TT-B322-CI-TSC-VITEST-BUDGET-DOC.md](./TT-B322-CI-TSC-VITEST-BUDGET-DOC.md)。

**仓库路径：** `docs/runbook/ci-slo-baseline-and-timeout-notes.md`

---

## 1. 真值：`Build` workflow（`.github/workflows/build.yml`）job 级超时

以下数字摘自仓库 **当前** **`build.yml`**（**job** 级 **`timeout-minutes`**；**单步** `steps.*` **未**单独设 `timeout-minutes`）。**复核**：`rg "timeout-minutes" .github/workflows/build.yml`。

| Job `id` | 主要职责 | **`timeout-minutes`**（硬上限） |
|----------|----------|----------------------------------|
| **`build`** | `check-invariants` → … → **`cargo build --workspace`** → **`cargo test --workspace`** → 证据 JSON / 可选 `audit-deps` | **90** |
| **`frontend`** | `npm ci` → `lint` → `check:search-params-suspense` → **`tsc`** → **Vitest** → **`test:i18n:ci`** | **45** |
| **`regional-matrix`** | `npm ci` → **`test:regional:ci`** | **25** |
| **`a11y`** | `npm ci` → `build` + 起服务 → **`test:a11y:ci`** | **40** |
| **`e2e`** | Playwright 全栈（含 **Postgres** service 等） | **60** |

**IMP-CI-002 结论（本仓库现状）**：**已**存在 **job 级** cap；**未**为 **`lint` / `tsc` / Vitest / `cargo test`** 等**单独 step** 配置 `timeout-minutes`。若某一步在 runner 上**长尾或挂死**，须在 **GitHub Actions 日志** 定位后**单独立项**（另开 TT）为**该 step** 加 cap，**避免**在未统计 **p95** 前全局收紧 **job** 上限导致 **误杀** 冷缓存构建（与 **next-batch Wave D** 警告同读）。

---

## 2. 分轨「观测基线 / 目标上限」表（IMP-CI-001 · 占位）

**用途**：给值班 / 合并节奏一个**可对表**的「**建议关注区间**」；**非** CI 硬门槛。数字为 **工程占位**，**须**用组织内 **Actions 耗时分布**（或自建 runner 监控）**替换**「—」列。

| 分轨（命令语义） | 典型落点（本地 / CI） | **建议 p50 观测回填** | **建议 p95 / 告警关注上限**（分钟） |
|------------------|----------------------|------------------------|--------------------------------------|
| **Rust** `cargo build --workspace` | **`build` job** 内 | — | — |
| **Rust** `cargo test --workspace` | 同上（与 build 同 job） | — | 受 **job 90 min** 硬顶 |
| **前端** `npm run lint` | **`frontend` job** | — | — |
| **前端** `npx tsc --noEmit` | 同上 | — | — |
| **前端** Vitest `npm run test -- --run` | 同上 | — | 受 **job 45 min** 硬顶 |
| **前端** `npm run test:i18n:ci` | 同上 | — | 同上 |
| **区域矩阵** `npm run test:regional:ci` | **`regional-matrix` job** | — | **25**（硬顶） |
| **A11y** `npm run test:a11y:ci` | **`a11y` job** | — | **40**（硬顶） |
| **E2E** Playwright | **`e2e` job** | — | **60**（硬顶） |

**本地预检（窄轨）**：根 **[CONTRIBUTING.md](../../CONTRIBUTING.md#pre-push-local)** 与 **AI 协作规则**默认 **`cargo test -p traveltrust-api`**；与 **CI** **`cargo test --workspace`** **有意分轨** — 见 **[TT-B322](./TT-B322-CI-TSC-VITEST-BUDGET-DOC.md)** **§2.5**。

---

## 3. 若要将 **IMP-CI-001（B）** 落入 workflow

须在 **PR 正文** 写清：**runner 类型**、**冷/热缓存** 样例耗时、**是否** 会误杀 **fork / 首次 PR**；并与本表 **§2** 数字**对齐**或**显式修订**本 Runbook。**仓库纪律**：勿在未观测前提下**单独**为长步加**过紧** step timeout 导致 **Build** 主链 **无意义红**（与 **[AGENTS.md](../../AGENTS.md)**、**[CONTRIBUTING](../../CONTRIBUTING.md)** 对 **Build** 必过主链叙述同读）。

---

## 4. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-05-01 | 首版：**IMP-CI-001** 占位表 + **IMP-CI-002** **`build.yml`** job 超时真值。 |
