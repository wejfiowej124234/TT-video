# TT-L4-SMOKE-SLOWFILE-PERF-001 · L4 烟雾慢文件耗时优化（性能单 · 与稳定性分单）

**Version:** 1.2.0  
**Status:** **迭代 2 验收已落档**（默认单 worker **`npm run e2e:sepolia` → 193/0**，见 **§4.1**）。**文件级并行 perf** 后续以 **CI + Next `start`** 为主承接口径（**§3.4**）；**不再**以本机 **`next dev` + 多 worker** 为主调参面。

## 1. 与稳定性单的边界（必读）

| 维度 | **稳定性单（已收口）** | **本性能单（本卡）** |
|------|------------------------|------------------------|
| **主目标** | **`npm run e2e:sepolia`** → **193 passed / 0 failed**、exit **0** | 降低 **`Slow test file: … smoke*.spec.ts (Xm)`** 报告时长或总 **`elapsed_ms`**（观测项） |
| **SSOT** | **[TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001](./TT-L4-CHROMIUM-SEPOLIA-E2E-BASELINE-001.md)** §1 **首次**基线数字 **不**因本卡改动 | 本卡 **不得**要求修改 §1 表内 **861929** 等首次登记值 |
| **允许改动的代码** | `e2e/core-path.spec.ts`、`e2e/smoke.spec.ts` 等 flake 就绪链（已合） | **原则上**仅 **`e2e/smoke.spec.ts`**、**`e2e/smoke-governance.spec.ts`**、**`e2e/smoke-community.spec.ts`**、**`e2e/smoke-admin.spec.ts`**、**`e2e/helpers/smoke-nav.ts`** 及与烟雾路由编排强相关的辅助模块（**`core-path`** 仅限与烟雾同构的 `/guide` flake 对齐，**不改** `grepInvert` / `gotoSmoke`） |
| **禁止** | — | 改 **`grepInvert`**；改 **`gotoSmoke` 默认 `page.goto` / `load` 语义**；为「变快」而改断言**文案/正则**；以缩小用例范围冒充「优化」 |

**稳定性已绿留证**（2026-04-18）：见 **TT-L4** §**6.6** 与 §**6.5**（193/0、`elapsed_ms` **1170903**、`smoke.spec.ts` **9.1m** + `smoke-admin.spec.ts` **5.2m** 双 Slow file 行）。

## 2. 当前观测（起算点）

以下摘自一次全量 **`npm run e2e:sepolia`** 终端汇总（**非** §1 `elapsed_ms` 基线替换）：

| 指标 | 值 |
|------|-----|
| **Slow test file** | `e2e\smoke.spec.ts` **(9.1m)**；`e2e\smoke-admin.spec.ts` **(5.2m)** |
| **全量 elapsed_ms**（Node 包装） | **1170903**（约 **19.5 min**） |

**迭代 1（2026-04-18 · 合入后以仓库 SHA 登记）**：新增 **`e2e/smoke-community.spec.ts`** 承载社区子链；全量 **`npm run e2e:sepolia`** → **193 / 0**、**`elapsed_ms: 1205248`**；Slow file **`smoke.spec.ts (6.5m)`** + **`smoke-admin.spec.ts (5.5m)`**（**无** `smoke-community` 第三行）。相较上表 **`smoke.spec.ts` 9.1m → 6.5m**；`elapsed_ms` 单次略升属机差，**§1 首次基线数字仍不 bump**。

**迭代 2（2026-04-18 · 本批）**：新增 **`e2e/smoke-governance.spec.ts`**，自 **`smoke.spec.ts`** 迁出 **治理 + 向导质押** 共 **8** 条（`gotoSmoke` / 断言不变）；目的为压低 **`smoke.spec.ts` 单文件 wall** 与并行调度粒度。另：**`setup-meta-chain`** project 在 `playwright.config.ts` 设 **`timeout: 120_000`**；**`/guides` heading**、**`/me` 已登录** Profile **`heading`** 等 wait 与 **`p03` / `trust-gate-dispute-resolve`** 就绪链加固见仓库 diff。**正式验收数字见 §4.1**（合入后请在该表内补 **commit SHA**）。

## 3. 允许的优化方向（示例 · 不穷尽）

- 在 **不改导航语义** 前提下，对 **纯静态/少 XHR** 子路由再拆 spec 或合并重复冷启动（需保持 **193** 用例数与语义）。
- Admin 烟雾内 **Cookie / 冷启动** 的进一步复用（须 **193/0** 回归验证）。
- 与 **`workers`/shard** 策略无关的、**仅限 smoke 文件内**的用例顺序微调（避免引入新的顺序依赖 flake）。

## 3.1 阶段二：并行度与「串行链路」结论（检查 SSOT）

**`playwright.config.ts`（当前）**

| 项 | 结论 |
|----|------|
| **`workers`** | 默认 **`1`**（未设 **`PLAYWRIGHT_PARALLEL=1`** 且未设有效 **`PLAYWRIGHT_WORKERS`** 时）。 |
| **`fullyParallel`** | 与 **`PLAYWRIGHT_PARALLEL=== "1"`** 绑定；默认 **`false`**。 |
| **`chromium-sepolia`** | **无** `globalSetup`；仅 **`dependencies: ["setup-meta-chain"]`**，非长阻塞。 |
| **烟雾多文件能否并行** | 在 **`workers: 1`** 下 **不能**（与其它 spec 同一队列、严格顺序）。**`PLAYWRIGHT_WORKERS`≥2** 且 **`fullyParallel: false`** 时，**不同 spec 文件**可并行，故 **`smoke.spec.ts` / `smoke-governance.spec.ts` / `smoke-community.spec.ts` / `smoke-admin.spec.ts` 可各占 worker**（与 trust-gate 等其它文件交错由 Playwright 调度）。**同文件内**多用例仍顺序执行，除非 **`PLAYWRIGHT_PARALLEL=1`**。 |

**`npm run e2e:sepolia` 可选开关**（见 `frontend/scripts/run-e2e-sepolia.mjs`）：**`PLAYWRIGHT_L4_FILE_PARALLEL=1`**（未显式设 **`PLAYWRIGHT_WORKERS`** 时默认 **`4`**，跨文件并行；争用高时可自设 **`PLAYWRIGHT_WORKERS=2`**）、**`PLAYWRIGHT_L4_FULL_PARALLEL=1`**（打开 **`PLAYWRIGHT_PARALLEL=1`** + workers，**同文件内**也可并行）。**默认脚本行为不变**；进 CI 前须 **193/0** 全量复验。**文件级并行双轮实证见 §3.2**（**未**通过「两轮均 193/0」门槛，**不得**写成本地默认性能口径）。

**最长「串行链路」（用例体内）**

| 文件 | 结论 |
|------|------|
| **`smoke-community.spec.ts`** | 每条 `test` **一次** `gotoSmoke`，**无** Feed→DM→举报单测内多页链。 |
| **`smoke.spec.ts`** | 每条 `test` **一次** `gotoSmoke`；**「TravelTrust 网络落地页」** 为 **单 URL** 上多段 `expect`（非多段 `goto`），不宜再拆成多测（否则重复冷启动）。 |
| **`smoke-admin.spec.ts`** | 每测 `gotoSmoke` 一次；**`beforeEach` 仅 `addSmokeAdminCookies`**（单 Cookie），成本远低于 **`goto`**；**`storageState` 预置**可作后续优化，收益次要于 **workers**。 |

### 3.2 `PLAYWRIGHT_L4_FILE_PARALLEL=1` 双轮验证（门槛：两轮均 **193 / 0**）

**命令**（连续两轮、同一机、同一仓库状态）：`cd frontend && PLAYWRIGHT_L4_FILE_PARALLEL=1 npm run e2e:sepolia`（脚本日志含 **`PLAYWRIGHT_L4_FILE_PARALLEL=1 → PLAYWRIGHT_WORKERS=4`**；Playwright 汇总为 **`Running 193 tests using 4 workers`**）。可选保守：`PLAYWRIGHT_L4_FILE_PARALLEL=1 PLAYWRIGHT_WORKERS=2 npm run e2e:sepolia`。

**判定**：仅当 **两轮均为 193 passed / 0 failed、exit 0**，才**考虑**将 `PLAYWRIGHT_L4_FILE_PARALLEL=1` 固化为「默认本地性能口径」。**本轮不满足。**

| 轮次 | **passed / failed** | **exit** | **`elapsed_ms`**（`run-e2e-sepolia.mjs` 外层） | Playwright 汇总行 | 失败用例（摘录） |
|------|---------------------|----------|-----------------------------------------------|---------------------|------------------|
| **第 1 轮** | **190 / 3** | **1** | **822986** | `190 passed (13.6m)` | `release-flow.spec.ts` · 完整导航链；`smoke-community.spec.ts` · 社区用户主页（占位 UUID）；`trust-gate-escrow.spec.ts` · 接单 410 accept_window_expired 文案 |
| **第 2 轮** | **182 / 11** | **1** | **880185** | `182 passed (14.6m)` | 含 `market-d8` 首页→市场导航；`p03-tourist-guide-accept`；多处 `smoke-admin`（调度运行记录、API 版本、社区策略审计等）；`smoke.spec.ts`（治理提案页、TravelTrust 落地页）；多处 `trust-gate-escrow` |

**Slow file（第 1 轮终端）**：`smoke-admin.spec.ts` **(11.6m)**、`smoke.spec.ts` **(9.0m)**（并行下 wall 更短但 **失败数上升**，**不可**与 `workers:1` 下单轮 193/0 口径混读为「无损加速」）。

**结论（执行）**：**不**将 **`PLAYWRIGHT_L4_FILE_PARALLEL=1`** 写入默认 `npm run e2e:sepolia` 或 CI；**L4 全绿仍以默认 `workers: 1`**（不显式并行）为门禁口径。后续若再试文件级并行，建议先隔离 **共享可变状态**（DB / mock 路由 / 单测订单 id）或缩小并行面后 **再跑双轮 193/0** 登记于本小节。

**补救（代码侧，非默认口径）**：针对并行负载下 **默认 5s `expect` 与短导航超时** 导致的假红，已加固 **`trust-gate-escrow`**（`alert`/主区/`goto`/`click` 超时）、**`release-flow`** / **`market-d8`** / **`p03`** / **`smoke-community`** 用户主页、**`smoke-admin`** 标题等待、**`smoke`/`core-path` 向导工作台** 与 **`chromium-sepolia` project `timeout: 120_000`**。

| 轮次（补救后） | **passed / failed** | **exit** | **`elapsed_ms`** | 备注 |
|----------------|---------------------|----------|------------------|------|
| **`PLAYWRIGHT_L4_FILE_PARALLEL=1` 复跑 1** | **193 / 0** | **0** | **1009005** | Playwright：`193 passed (16.7m)`；Slow：`smoke-admin` **14.6m**、`smoke` **11.0m**、`trust-gate-escrow` **5.7m**、`smoke-community` **5.0m** |

**与 §3.2 原双轮关系**：原两轮 **未**达 193/0，**仍不满足**「连续两轮均绿才写默认性能口径」的门槛；上表为 **补救后单次** 并行全绿留证。若要升格默认口径，须再补 **至少一轮** 连续 **`PLAYWRIGHT_L4_FILE_PARALLEL=1` → 193/0**；**默认 `npm run e2e:sepolia`（`workers:1`）** 亦建议复跑确认无回归。

### 3.3 本批 perf 实验观测（2026-04-18 · Windows 全栈 `next dev`）

| 实验 | 结果摘要 |
|------|-----------|
| **`PLAYWRIGHT_L4_FILE_PARALLEL=1` + `WORKERS=4`（首轮）** | **192 / 1**；`p03-tourist-guide-accept` 向导 **接单** 按钮 **`click` 45s** 超时（并行争用）。 |
| **加固** | `p03`：`/escrow/:id` 上先等 **`main`（订单详情）** 与 **「订单操作」** 区再点 **接单**（与 `trust-gate-escrow` 同构）；`trust-gate-dispute-resolve` 仲裁区 **显式 `toBeVisible`** 后再点；`smoke` **`/guides` heading** 等 **`45s`**；`setup-meta-chain` project **`timeout: 120_000`**。 |
| **`PLAYWRIGHT_L4_FILE_PARALLEL=1` + `WORKERS=2`（复跑）** | **大量 `net::ERR_CONNECTION_REFUSED` @ `localhost:3012`**（Next dev 在多变 worker 高压下 **进程退出**），属 **FE 宿主稳定性** 而非断言语义；**不**将本轮记为有效 193/0 证据。 |
| **结论** | 文件级并行 **仍**为 **perf 观测项**；取 **Slow file / 总耗时** 时优先 **CI + `npm run start`**（**§3.4**），**不再**以本机 **`next dev` 硬拧并行**为主；**默认单 worker `npm run e2e:sepolia`** 为唯一门禁口径。 |

### 3.4 并行实验承接口径（CI · `start` · **非**本机 `dev`）

| 项 | 约定 |
|----|------|
| **为何迁轨** | 本机 Windows **`next dev` + `PLAYWRIGHT_L4_FILE_PARALLEL`** 已观测 **争用假红** 与 **`localhost:3012` `ERR_CONNECTION_REFUSED`**（Next 进程在多变 worker 高压下退出）（§3.3），**不等价**于产品缺陷。 |
| **承接口径** | **CI `ubuntu-latest`**：`frontend` **`npm run build`** 后以 **`npm run start`** 起站（与 `frontend/playwright.config.ts` 在 **`process.env.CI`** 下 **`nextCmd === "npm run start"`** 对齐），再按需叠 **`PLAYWRIGHT_L4_FILE_PARALLEL=1`** / 显式 **`PLAYWRIGHT_WORKERS`**；门槛仍为 **`193 / 0`、exit 0**。 |
| **现有 CI 锚点** | **`.github/workflows/build.yml`** → **`jobs.e2e`**：`npm run build` → API → **`cd frontend && npm run e2e -- --project=chromium`**（链关烟测 + **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`**）。**Sepolia + `start` + 低并行（workers=2）** 的 **独立观测 job** 见 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md)** 与 **`.github/workflows/l4-parallel-ci.yml`**（**不**替代单 worker 门禁）。 |
| **本机** | **仅**维护 **`npm run e2e:sepolia`**（默认 **workers:1**）为门禁与回归；并行 perf **不**再列为「本机 dev 必拧项」。 |

## 4. 验收与留证

- **硬门槛**：`npm run e2e:sepolia` → **193 / 0**、exit **0**（与 **TT-L4** §1 **failed=0** 约束一致）。  
- **软指标**：同机对比 **Slow file** 两行分钟数与 **`elapsed_ms`**；在 PR 或本文件 §2 追加一行「前后对照 + commit SHA」。  
- **§1**：仅当产品明确要求 **升档首次基线 elapsed** 时，才在 **TT-L4** §1 走独立变更说明；**本卡默认不 bump §1 数字**。

### 4.1 迭代 2 正式验收（默认单 worker · 2026-04-18）

| 字段 | 登记值 |
|------|--------|
| **命令** | `cd frontend && npm run e2e:sepolia`（未设 `PLAYWRIGHT_L4_FILE_PARALLEL` / `PLAYWRIGHT_L4_FULL_PARALLEL` / `PLAYWRIGHT_PARALLEL`） |
| **passed / failed** | **193 / 0**（Playwright 汇总：`193 passed (23.2m)`） |
| **exit** | **0** |
| **elapsed_ms**（`run-e2e-sepolia.mjs` 外层） | **1396418**（约 **23.3 min**） |
| **Slow test file** | **`smoke-admin.spec.ts (6.9m)`**；**`smoke.spec.ts (6.1m)`**（治理已迁至 **`smoke-governance.spec.ts`**，当次未单独出现在 Slow 行） |
| **commit SHA** | 合入推送后由 owner 填入实际 **revision** |

**与 §2 迭代 2**：上表为 perf 单 **迭代 2** 的机读验收；**§1 首次基线**（如 **TT-L4** §1 **`861929`**）**不予替换**。并行 perf 双轮门槛仍见 **§3.2**，续跑承接口径见 **§3.4**。

## 5. 维护

- 若本卡结论为「不值得继续优化」，将 **Status** 改为 **已关闭** 并保留 §2 最后一行观测即可。  
- 若引入新的烟雾 spec 文件，**同步**更新本卡标题与 §1 边界表。
