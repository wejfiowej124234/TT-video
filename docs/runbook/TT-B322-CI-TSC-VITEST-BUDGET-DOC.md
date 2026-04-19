# TT-B322 · CI `tsc` / Vitest / `cargo test` 分轨耗时预算（审计登记）

**卡号**：`TT-B322-CI-TSC-VITEST-BUDGET-DOC-001` · **母表** `B-322`  
**日期**：2026-04-15  
**范围**：仅 **文档 / 台账 / 索引**；**先审计后登记**；**不改** `.github/workflows/**` 语义、**不**改 `package.json` 脚本、**不**改 **07** 文首完成度百分比。

**勿与下列条目混淆**

- **一览 376** **`TT-B322-TESTNET-MULTI-TX-NONCE-SEQUENCE-REAL-RUN-001`**：**B-275** **协记**（testnet 真实链证据），**非** 本 **B-322** / **一览 332** 的 CI 预算 TT。

---

## 1. 本轮仅读文件清单（≤8）

| # | 路径 |
|---|------|
| 1 | `.github/workflows/build.yml`（`build` / `frontend` job 中与 Rust / tsc / vitest 相关步骤） |
| 2 | `CONTRIBUTING.md`（**提 PR 前** 本地命令块） |
| 3 | `docs/spec/63-项目优化与问题清单.md`（**§六、CI 与协作**） |
| 4 | `docs/spec/07-开发流程与顺序.md`（**§二 2.2**「日常合并最低标准」**前端**行） |
| 5 | `frontend/package.json`（`scripts`：`lint` / `test` / `build` 等） |
| 6 | `frontend/vitest.config.ts`（Vitest 运行边界） |
| 7 | `.cursor/rules/traveltrust-ai-collab.mdc`（默认 `cargo test` 范围约定） |
| 8 | `docs/AI任务卡索引.from-stash.md`（一览 **332** / **本 TT** 登记行） |

---

## 2. 审计结论：当前「分轨」真值（命令级，非分钟级）

### 2.1 `build.yml` · **Build** job（Rust 轨）

- **`cargo build --workspace`** → **`cargo test --workspace`**（同一 job；无单步 `timeout-minutes`；job 继承 Actions 默认上限）。

### 2.2 `build.yml` · **frontend** job（前端轨）

顺序：**`npm ci`** → **`npm run lint`** → **`npx tsc --noEmit`** → **`npm run test -- --run`**（Vitest）→ **`npm run test:i18n:ci`**。  
证据 JSON 将 **`lint` / `tsc` / `vitest` / `test:i18n:ci`** 列为 **`checks`**（与 **B-321** 机读门衔接）。

### 2.3 文档侧（63 / 07 / CONTRIBUTING）

- **63 §六**：已写明 **frontend** job 含 **lint → tsc → vitest**，**Rust** 在 **build** job；**未**给出各轨 **目标分钟数** 或 **SLO 表**。  
- **07 §二 2.2**：日常合并最低标准 — 前端 **lint / tsc / `npm test`（Vitest）**；**未**钉死耗时预算数字。  
- **CONTRIBUTING**：本地预检 **`cargo test -p traveltrust-api`** 与 **`cd frontend && npm run lint && npx tsc --noEmit && npm test`**；与 **CI** **`cargo test --workspace`** **口径不同**（**窄** vs **全 workspace**）— 属 ** intentional** **预检减负**，**非** 本卡改为一致。

### 2.4 Vitest 配置

- **`frontend/vitest.config.ts`**：定义 **environment**、**include** 等；**无**「全局超时预算」类与 CI 分轨对齐的文档句（由 **Vitest 默认** 与单测 `timeout` 控制）。

### 2.5 AI 协作规则

- **`.cursor/rules/traveltrust-ai-collab.mdc`**：默认 **`cargo test -p traveltrust-api`**；与 **CI** **workspace** 全量测试 **分轨** — 登记为 **本地 AI 任务默认** vs **合并门禁** 边界。

---

## 3. 缺口登记（仅记录 · 本卡不改实现）

| 缺口 | 说明 |
|------|------|
| **无「分轨耗时预算」数字表** | 仓库 **未** 以 **单一 SSOT 表** 写明 **tsc / Vitest / `cargo test`（workspace）** 在 CI 或本地的 **目标分钟上限**；**63 / 07** 仅 **流程** 级。**若后续要钉 SLO**，须 **另开 TT** 并可能配合 **`timeout-minutes`** / 观测统计（本卡 **不**改 workflow）。 |
| **CI 单步未设 timeout** | **`build.yml`** 中上述步骤 **未** 使用 **`timeout-minutes`**；依赖 **runner 默认** 与 **job** 总时限。**是否** 为每步加 cap **属产品/平台决策**，本卡 **仅登记**。 |
| **一览 376 同名前缀** | **`TT-B322-*`（testnet）** 与 **`TT-B322-CI-*`（本卡）** 共享 **`B-322` 编号块易混** — 已在 **索引** / **母表** 与 **§文首** 互指 **防糊**；**不**改证据文件名。 |

**本轮无「命令顺序错误」类缺口**：**build.yml** 与 **63/07/CONTRIBUTING** 叙述 **一致**（在「有/无分钟预算」前提下）。

---

## 4. 验收（本卡 · docs-only）

- 本 Runbook + **母表 B-322** + **from-stash 一览 332** 互证完成。  
- **未**修改 **workflow**、**package.json**、**vitest.config.ts**、**07** 完成度文首。

---

## 5. 互证

- **母表**：[`docs/任务母表.md`](../任务母表.md) **B-322**  
- **执行索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **332** · **`### TT-B322-CI-TSC-VITEST-BUDGET-DOC-001`**  
- **防糊**：一览 **376** **`TT-B322-TESTNET-…`** → **B-275** **协记**，**非** 本 TT
