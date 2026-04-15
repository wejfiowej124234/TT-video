# Scripts 脚本说明

- **程序级薄索引（按目录速查）** → **[INDEX.md](./INDEX.md)**（**TT-MOD-B1-06**）。

## 单一入口（B-184）

- **本文件** `scripts/README.md` 是 **`scripts/` 树的人类说明与索引**；**命令行仍优先使用历史路径** `scripts/<脚本名>`（见下「兼容策略」）。
- **实现按用途分目录**（**不改变**各脚本的退出码与串联语义）：

| 目录 | 用途 |
|------|------|
| **`scripts/gates/`** | CI / 预合并门禁、路由与文档对照、SSOT Guard、版本三元组、wave 文件存在性、基线回归、发版前聚合（`pre-release-automation`）、审计类检查等 |
| **`scripts/ops/`** | 索引器 / internal / admin 观测与留痕、对账探针、治理 SSOT ops-check、导出与只读 smoke 等**运维向**脚本 |
| **`scripts/dev/`** | 本地起停、ABI 同步与校验、前端 manifest、SQLx 迁移前缀、dev preflight、Windows 一键 bat、个人向 `windows/` 辅助脚本 |

**兼容策略（稳定对外路径）**

- **`scripts/<原名>.{sh,ps1,py,bat}`** 根路径保留为**薄转发**：调用 `gates/` / `ops/` / `dev/` 内同名实现。**Workflow、Runbook、文档、肌肉记忆**可继续写 `bash scripts/run-check-04-routes.sh` 等，**无需**先改外链。
- **新代码 / 新文档**若希望显式指向实现，可写 `scripts/gates/...`、`scripts/ops/...`、`scripts/dev/...`；二者**等价**于根路径（行为一致）。
- **SSOT Guard 附属物**：`templates/`、`ssot-guard-fixtures/` 已置于 **`scripts/gates/`** 下；编排器与契约脚本内路径已同步。

**迁移说明**

- **B-184 前**：脚本均在 `scripts/` 根下扁平存放。  
- **B-184 后**：实现文件物理位置按上表归类；**若你发现某外链直接指向子目录外的已删路径**，请改为 **`scripts/<同名>`** 根入口或对应 **`scripts/{gates,ops,dev}/<同名>`**。

---

**快速使用**（工程总纲读前入口：**[07-开发流程与顺序](../docs/spec/07-开发流程与顺序.md)** 文首**读前摘要**「**本地开发起停（Win · Unix · Next 15）**」行、**§二 2.3**）：Windows 一键启动（终止旧进程 + Docker + **编译** + 后端 8080 + 前端 3012）→ 项目根执行 `scripts\start-api-with-seed.bat`（**第 1 步**会校验 `crates/api/migrations/*.sql` 的版本前缀是否唯一，避免 SQLx `_sqlx_migrations` 主键冲突）。仅终止前后端（不关 Docker）→ `scripts\stop-all.bat`。仅需前端 → `scripts\check-3000-and-start.bat`（检查 **3012**）。验证 → `scripts\e2e-verify.bat`。Linux/Mac → `./scripts/start_dev.sh`（会先校验迁移前缀并编译后端），停止 → `./scripts/stop_dev.sh`。**数据库**：使用 DB 时请在项目根 `.env` 设置 `DATABASE_URL`（如 `postgres://traveltrust:traveltrust@localhost:5432/traveltrust`）；API 启动时会**自动执行迁移**，无需单独运行 `sqlx migrate run`。若 API 报错 `duplicate key value violates unique constraint "_sqlx_migrations_pkey"`：通常是两个迁移文件共用了同一数字前缀；修复后若本地库曾在错误版本下跑过一半，可 **`docker compose down -v`** 再 `up -d` 清空库后重迁。一键脚本 **默认保留数据库数据**（仅 `docker compose up -d`）；若需每次清空卷，启动前执行 **`set RESET_DOCKER_DB=1`** 再运行 `start-api-with-seed.bat`。单独自检：`powershell -File scripts\check-sqlx-migration-prefixes.ps1` 或 `bash scripts/check-sqlx-migration-prefixes.sh`。

**Next.js 与 07 §二 Phase 4（前端）**：当前 **Next 15**；`npm run dev` 经 **`frontend/scripts/run-dev.mjs`**：**Windows 默认 Webpack** `dev -p 3012`（减轻 Turbopack 下 `app-build-manifest.json` / `_buildManifest.js.tmp.*` ENOENT）；**macOS/Linux 默认 Turbopack**（先 `ensure-turbo-dev.mjs`）。**勿**在 CMD 里单独输入 `dev`。**仍要 Turbopack（Windows）**：`npm run dev:turbopack` 或 `TRAVELTRUST_DEV_TURBO=1 npm run dev`。显式 Webpack（任意系统）：`npm run dev:webpack`。`npm run start` 会先执行 `ensure-next-start.mjs`，端口 **3012**。`next.config.js` 中 **turbopack.resolveAlias** 与 **webpack resolve.fallback** 对齐。若 **`/market` 404** 且 **`/_next/static/chunks/*.js` 大量 404**：`frontend` 下 **`npm run clean && npm run dev`**，或 `scripts\frontend-clean-dev.bat` / **`.\scripts\frontend-clean-dev.ps1`** / `./scripts/frontend-clean-dev.sh`。

**Prometheus（API 索引器指标）**：可复制告警规则见 **`ops/monitoring/prometheus-alerts-indexer.example.yml`**（须已 scrape **`GET /metrics`**；说明见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)）。

**DB 对账探针（internal）**：**`scripts/indexer-reconcile-probe.sh`**（或 **`./scripts/internal-indexer-ops.sh probe`**）对 **`GET …/internal/indexer-status?live_reconcile=1`** 做 **`projection_reconcile_clean`** 门禁式校验（须 **jq**、**`INTERNAL_API_SECRET`**、内网）；退出码见脚本头注释；**`--ops-artifact`** → **Epic D-09** **`traveltrust.ops_artifact.v1`** **`probe`**（**`gate_workflow_checks_total_expected`** 与 **indexer-reconcile-gate** **`checks_total`** 同锚）。见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)。**Admin 只读（浏览器）**：与上列 **internal** 写路径 / 探针**对照**时，值班可在已登录 **Admin** 的前端核对 **`/admin/indexer`**、**`/admin/indexer/reconcile-reports`**、**`/admin/indexer/reconcile/[id]`**、**`/admin/observability`**、**`/admin/finance`**；正文互证见 [Runbook §2.55「Admin 只读 UI」](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、[13-1 表 1 · `/admin/*`](../docs/spec/13-1-UI产品级SSOT与页面规范.md)。**下表 `indexer-public-snapshot.sh`** 之 **`ADMIN_BEARER_TOKEN`** 分支与上述 **Admin GET** 同源摘要。**合约部署顺序（Anvil→测试网→主网）** → **[Runbook §2.56](../ops/RUNBOOK.md)**（与 **[contracts/README](../contracts/README.md)**、[governance-token/02 §1.3](../docs/spec/governance-token/02-对内技术规格-草案.md)、**[07 §二 Phase 3](../docs/spec/07-开发流程与顺序.md)**、**[14 §6](../docs/spec/14-合约-API-ABI-前后端对齐.md)** 同序）。**发版 / 值班最小顺序（含留痕）** → **[Runbook §12.5](../ops/RUNBOOK.md)**。**GitHub Actions / Kubernetes 定时示例**：**`ops/monitoring/`**（**`README.md`**、**`github-actions-indexer-probe.example.yml`**、**`k8s-indexer-reconcile-probe.cronjob.example.yaml`**）。**Grafana**：**`grafana-dashboard-traveltrust-indexer.example.json`**（**`/metrics`** 索引器面板）。

**合并 JSON / `snapshot_provenance` 契约三角**（与上表 **`indexer-public-snapshot.sh`**/**`write-indexer-evidence.*`** 同读）：**L2 段落 SSOT** → **[04 §3.4](../docs/spec/04-后端与API.md)**（读前摘要「索引器运维 JSON 快照」+ **`internal` API 总述**）；**ABI·观测边界（非 §2.1 表内 HTTP）** → **[14 §2.1](../docs/spec/14-合约-API-ABI-前后端对齐.md)**「运维 JSON 快照」；**流程与 CI 锚点** → **[110 §3.1.2](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**；**链级 dry-run 证据（只读）** → **`internal-indexer-ops.sh reconcile --chain-scope-dry-run`**（及 **`--event-log-scope-dry-run`** 等）+ **[110 §3.1.4](../docs/spec/110-阶段开发链上索引器与事件同步器.md)** + **[evidence/README](../evidence/README.md)** + **[Runbook §12.5](../ops/RUNBOOK.md)** **步骤 6**；工程台账 → **[07 §六 6.4](../docs/spec/07-开发流程与顺序.md)**。

### 开卡前检查清单（Pre-TT Gate）

人工或脚本化前置核对（与 **[04 · 零、SSOT Gate](../docs/spec/04-后端与API.md#ssot-gate-pre-tt)**、**[AI 任务卡索引 · 开卡总规则](../docs/AI任务卡索引.md)** 对读）：

- [ ] 已从母表 / 缺口总表 / 各 spec **Target·Partial** 句生成候选
- [ ] 已完成**信息价值** / **双源风险**评估（**可否决**、可仅登记母表评估行）
- [ ] [任务母表.md](../docs/任务母表.md) 已有对应 **B-xxx** 行
- [ ] [AI任务卡索引.md](../docs/AI任务卡索引.md) 已创建 **TT**（**未封口**）
- [ ] 已明确是否影响**公开 API**
- [ ] 已明确是否进入 **meta / admin / reconcile / ops**
- [ ] （**push / 合并前**）**单人开发元数据门禁（B-145 + B-147）**：已同批改 **`docs/任务母表.md`** 或 **`docs/AI任务卡索引.md`**（若 diff 含 **`crates/**`** 或 **须登记的 **`contracts/**`** — 豁免见 **`scripts/gates/check-pr-crates-needs-metadata.sh`** 头注释）；**须**本地 **`bash scripts/check-pr-crates-needs-metadata.sh main HEAD`**（直推无 PR 时 **仅此**；**非** PR gate）；若走 **GitHub PR** 另有 **`.github/workflows/ssot-crates-metadata-hint.yml`**（**B-148**：job 内 **`CRATES_METADATA_GATE_REQUIRE_REFS=1`**，`BASE`/`HEAD` **不可解析则 job 失败**）

**AI 任务卡索引一览（硬性 · 凡改 `docs/AI任务卡索引.md` 须在提交 / 推远程前本地通过）**：项目根 **`python3 scripts/check-ai-task-card-index-overview.py`**（默认 **`docs/AI任务卡索引.md`**、**严格** 序号 **1..n**，**勿** 传 **`--allow-seq-gaps`** 作为提交前门槛）；或显式路径 **`python3 scripts/check-ai-task-card-index-overview.py docs/AI任务卡索引.md`**。排障时可临时 **`--allow-seq-gaps`**，**不得** 依赖其合并 **main**。失败时 **stderr** 机读：**`RULE=`**（`A-SEQ` / `E-ID` / `B-STATUS` / `C-BODY` / `D-STASH` / `Z-META`）**`seq=`** **`id=`** **`msg=`**（**msg** 为最后一字段）。**CI**：[check-ai-task-card-index-overview.yml](../.github/workflows/check-ai-task-card-index-overview.yml)（workflow 名 **`AI task card index overview`**，job **`check`** → 分支保护勾选 **`AI task card index overview / check`**）；**Build** [build.yml](../.github/workflows/build.yml) 内同脚本一步（与上同源）。**维护者**：将 **`AI task card index overview / check`** 设为 **`main`** 必过见 [CONTRIBUTING.md](../CONTRIBUTING.md) **「main · AI 任务卡索引一览门禁」**。

**提交前自检三连（单人默认，与 [04 · 零、](../docs/spec/04-后端与API.md#ssot-gate-pre-tt) 一致）**：

```bash
cargo test -p traveltrust-api
bash scripts/run-check-04-routes.sh
bash scripts/check-pr-crates-needs-metadata.sh main HEAD
```

**一键（可选）**：**`bash scripts/dev-preflight.sh`**（与上三行同序；**1～2** 任一失败 **exit 1**；第 **3** 条仍为 **元数据门禁** 默认 **exit 0**）。

**`check-pr-crates-needs-metadata.sh` 环境变量**（**B-145** / **B-146** / **B-147**，详见 **`scripts/gates/check-pr-crates-needs-metadata.sh`** 头与 **[母表 B-146](../docs/任务母表.md)**）：**`CRATES_METADATA_GATE_FAIL=1`** — diff 含 **`crates/**`** 或 **须登记的 **`contracts/**`** 但未同批母表/索引时 **exit 1**；**`CRATES_METADATA_GATE_REQUIRE_REFS=1`** — **`git rev-parse` 失败**时 **exit 2**（**默认 unset** 仍为 **WARN + exit 0**）。

第三条若 **stderr 有提醒**：**`crates/**`** 或 **须登记的 **`contracts/**`** 已进 **`main..HEAD`**，但母表/索引**未同批** — **先补齐再 commit**（**B-147** 豁免路径见脚本头）。

---

## 一、日常开发

| 脚本 | 平台 | 说明 |
|------|------|------|
| **start-api-with-seed.bat** | Windows | 一键：结束旧进程 → **Docker `up -d`（默认保留 Postgres 数据）** → **编译后端** → 启动后端(8080) → 启动前端(3012)，并打测试账号。项目根运行 `scripts\start-api-with-seed.bat`。设 **SKIP_API_BUILD=1** 可跳过编译。设 **RESET_DOCKER_DB=1** 时先 `down -v` 再 `up`（清空库）。 |
| **stop-all.bat** | Windows | 仅终止后端与前端进程（traveltrust-api.exe 及占用 8080/3012 的进程），不关 Docker。 |
| **run-frontend.bat** | Windows | 仅启动前端（`npm run dev` = Turbopack + 门禁，端口 3012），被其他 bat 调用；也可直接双击运行。 |
| **run-frontend-webpack.bat** | Windows | Webpack dev（`npm run dev:webpack`，含 `ensure-dev-next`）。Turbopack 异常时改用。 |
| **run-frontend-prod.bat** | Windows | `npm run build` → `npm run start`（生产，端口 3012，含 `ensure-next-start`）。 |
| **frontend-clean-dev.bat** | Windows | `npm run clean && npm run dev`，修复 dev/build `.next` 混用导致的 404。 |
| **frontend-clean-dev.sh** | Linux/Mac | 与上等价；项目根 `./scripts/frontend-clean-dev.sh`。 |
| **frontend-clean-dev.ps1** | Windows | 委托 **`bash scripts/frontend-clean-dev.sh`**（须 **Git Bash**）；日常亦可 **`.bat`**。 |
| **check-3000-and-start.bat** | Windows | 检查 3012 是否监听；未监听则新窗口启动前端。适合「只起前端」时用。（文件名保留兼容，端口为 3012。） |
| **build-api.bat** | Windows | 仅编译后端（先跑 `check-sqlx-migration-prefixes.ps1`，再 `cargo build -p traveltrust-api`）。编译后需重启 API 或再运行 start-api-with-seed.bat。 |
| **dev-preflight.sh** | Linux/Mac/Git Bash | **单人 push 前三连聚合**：`cargo test -p traveltrust-api` → **`run-check-04-routes.sh`** → **`check-pr-crates-needs-metadata.sh main HEAD`**（与 **[04 零、](../docs/spec/04-后端与API.md#ssot-gate-pre-tt)** 一致；第 3 条默认 **exit 0**；若设 **`CRATES_METADATA_GATE_REQUIRE_REFS=1`** 则 **`main`/`HEAD` 不可解析** 时 **exit 2**）。项目根 **`bash scripts/dev-preflight.sh`**。 |
| **check-pr-crates-needs-metadata.sh** | Unix / Git Bash | **单人开发元数据门禁（B-145 + B-147）**：**`BASE..HEAD`** 与 **`crates/**`**、**须登记的 **`contracts/**`** / 母表·索引；**`CRATES_METADATA_GATE_FAIL`**、**`CRATES_METADATA_GATE_REQUIRE_REFS`** 见上表 **Pre-TT** 段与 **[B-146](../docs/任务母表.md)**。 |
| **check-sqlx-migration-prefixes.ps1** / **check-sqlx-migration-prefixes.sh** | Windows / Unix | 校验 `crates/api/migrations/*.sql` 文件名数字前缀唯一；`start-api-with-seed.bat`、`build-api.bat`、`start_dev.sh` 会调用。 |
| **dev-preflight.ps1** | Windows | 检查 Docker、npm、cargo、`.env`；项目根 `powershell -ExecutionPolicy Bypass -File scripts\dev-preflight.ps1`。 |
| **e2e-verify.bat** | Windows | 验证：数据库容器、8080、3012、测试账号登录。启动约 1 分钟后运行。 |
| **start_dev.sh** | Linux/Mac | 一键：**编译后端** → 启动后端(8080)+前端。前端：`ensure-turbo-dev` + `next dev --turbopack -p $FRONTEND_PORT`（默认 **3012**，Next 15）。`./scripts/start_dev.sh`。设 **SKIP_API_BUILD=1** 可跳过编译。 |
| **start_dev.ps1** | Windows | 委托 **`bash scripts/start_dev.sh`**（须 **Git Bash**）；含 Docker/DB 一键见 **start-api-with-seed.bat**。 |
| **stop_dev.sh** | Linux/Mac | 停止 start_dev 启动的进程。 |
| **stop_dev.ps1** | Windows | 委托 **`bash scripts/stop_dev.sh`**；亦可 **stop-all.bat**。 |
| **internal-indexer-ops.sh** | Linux/Mac/Git Bash | 本机/内网 **`POST …/internal/indexer-tick|indexer-replay|indexer-reconcile`**、**`GET …/internal/indexer-status`**（**`status --ops-artifact`** → **`traveltrust.ops_artifact.v1`** / **Epic D-03**（**`artifact_version`：`v1`**）；**`status --live-reconcile --ops-artifact`** → **Epic D-04** / **`live_orders_projection_reconcile`**；**`reconcile --ops-artifact`** → **Epic D-05** / **`artifact_type:reconcile`**（**无** **`--persist`**）；**`reconcile --chain-scope-dry-run --ops-artifact`** → **Epic D-06** / **`dry_run_chain`**；**`reconcile --event-log-scope-dry-run --ops-artifact`** → **Epic D-07** / **`dry_run_event_log`**；**`reconcile --correction-executor-scope-dry-run --ops-artifact`** → **Epic D-08** / **`dry_run_correction_executor`**（**禁** **`--persist`** / **execute**；**`--chain-scope-dry-run` / `--event-log-scope-dry-run` / `--correction-executor-scope-dry-run`** 不得互叠）；**`probe --ops-artifact`** → **Epic D-09** / **`artifact_type:probe`**；**`status --live-reconcile`** 单独 → 裸 **`?live_reconcile=1`**）、**`probe`**（调用 **`indexer-reconcile-probe.sh`**）、**`recover`**（调用 **`indexer-reorg-recovery.sh`**）、**`evidence`** / **`evidence-bundle`**（**`write-indexer-evidence.sh`**；可选 **`--skip-internal-reconcile`**/**`--with-indexer-tick`**；bundle 含 manifest + zip）（须非公网）；`reconcile` 可选 **`--include-chain-tip`**（**`include_chain_tip`** / **`chain_observation`**，见 **110**）、**`--include-event-log-escrow-coverage`**（**`event_log_escrow_coverage`** / **`110-EVENT-LOG-ESCROW-COVERAGE`**）；`API_BASE_URL`、`INTERNAL_API_SECRET` 与 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读) 一致。例：`./scripts/internal-indexer-ops.sh status`、`./scripts/internal-indexer-ops.sh probe`、`./scripts/internal-indexer-ops.sh recover status`、`./scripts/internal-indexer-ops.sh evidence`、`./scripts/internal-indexer-ops.sh evidence-bundle`、`./scripts/internal-indexer-ops.sh reconcile --persist --rpc 3`、`./scripts/internal-indexer-ops.sh reconcile --include-chain-tip`、`./scripts/internal-indexer-ops.sh reconcile --include-event-log-escrow-coverage`。 |
| **internal-indexer-ops.ps1** | Windows | **evidence** / **evidence-bundle** → **`write-indexer-evidence.ps1`**（可选 **`--skip-internal-reconcile`**/**`--with-indexer-tick`**）；**tick / replay / reconcile / status / probe / recover** → **`bash scripts/internal-indexer-ops.sh`**（须 **Git Bash**）。例：`.\scripts\internal-indexer-ops.ps1 evidence`。 |
| **indexer-reconcile-probe.sh** | Linux/Mac/Git Bash | **`GET …/internal/indexer-status?live_reconcile=1`**；**退出码 0** 当且仅当 **`projection_reconcile_clean`**（须 **jq**、**`INTERNAL_API_SECRET`**）；**`--ops-artifact`** → **Epic D-09** **`traveltrust.ops_artifact.v1`** **`probe`**；供 cron / 值班；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)。 |
| **indexer-reconcile-probe.ps1** | Windows | 委托 **`bash scripts/indexer-reconcile-probe.sh`**（须 **Git Bash**）。 |
| **orders-deadline-ssot-ops-check.sh** | Linux/Mac/Git Bash | **`GET …/admin/observability/overview`**；校验 **`overview.orders_deadline_ssot_ops_check`** 之 **`overall`****/**`exit_code_hint`**（须 **jq**、**`ADMIN_BEARER_TOKEN`**）；与 **internal** 对账探针正交；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、[04 §3.4](../docs/spec/04-后端与API.md)。**可选 CI**：**`.github/workflows/orders-deadline-ssot-ops-staging.yml`**（**`Orders deadline SSOT ops (staging)`**）仅在配置了 **`STAGING_ORDERS_DEADLINE_OPS_ADMIN_BEARER_TOKEN`** + **`STAGING_ORDERS_DEADLINE_OPS_API_BASE_URL`** 时跑脚本；无 token **跳过**；**不**进入默认 **Build** PR 流程。 |
| **orders-deadline-ssot-ops-check.ps1** | Windows | 委托 **`bash scripts/orders-deadline-ssot-ops-check.sh`**（须 **Git Bash**）。 |
| **governance-governor-view-params-ssot-ops-check.sh** | Linux/Mac/Git Bash | **`GET …/admin/observability/overview`**；校验 **`overview.governor_view_params_ssot_ops_check`**（**TT-B110-SEQ5**；须 **jq**、**`ADMIN_BEARER_TOKEN`**）；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、[04 §3.4](../docs/spec/04-后端与API.md)。 |
| **governance-governor-view-params-ssot-ops-check.ps1** | Windows | 委托 **`bash scripts/governance-governor-view-params-ssot-ops-check.sh`**（须 **Git Bash**）。 |
| **governance-timelock-delay-ssot-ops-check.sh** | Linux/Mac/Git Bash | **`GET …/admin/observability/overview`**；校验 **`overview.timelock_delay_ssot_ops_check`**（**TT-B110-SEQ6**；须 **jq**、**`ADMIN_BEARER_TOKEN`**）；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、[04 §3.4](../docs/spec/04-后端与API.md)。 |
| **governance-timelock-delay-ssot-ops-check.ps1** | Windows | 委托 **`bash scripts/governance-timelock-delay-ssot-ops-check.sh`**（须 **Git Bash**）。 |
| **governance-governor-proposal-count-ssot-ops-check.sh** | Linux/Mac/Git Bash | **`GET …/admin/observability/overview`**；校验 **`overview.governor_proposal_count_ssot_ops_check`**（**TT-B110-SEQ10**；须 **jq**、**`ADMIN_BEARER_TOKEN`**）；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、[04 §3.4](../docs/spec/04-后端与API.md)。 |
| **governance-governor-proposal-count-ssot-ops-check.ps1** | Windows | 委托 **`bash scripts/governance-governor-proposal-count-ssot-ops-check.sh`**（须 **Git Bash**）。 |
| **governance-governor-token-timelock-ssot-ops-check.sh** | Linux/Mac/Git Bash | **`GET …/admin/observability/overview`**；校验 **`overview.governor_token_timelock_ssot_ops_check`**（**TT-B110-SEQ11**；须 **jq**、**`ADMIN_BEARER_TOKEN`**）；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、[04 §3.4](../docs/spec/04-后端与API.md)。 |
| **governance-governor-token-timelock-ssot-ops-check.ps1** | Windows | 委托 **`bash scripts/governance-governor-token-timelock-ssot-ops-check.sh`**（须 **Git Bash**）。 |
| **indexer-reorg-recovery.sh** | Linux/Mac/Git Bash | **reorg** 恢复：**`status|hint|replay|reconcile|rewind|all`**（**`rewind`** 须 **`REWIND_FROM_BLOCK`**，可选 **`FORCE_REWIND=1`**；**curl** + **jq**；**`INTERNAL_API_SECRET`**）；与 **`GET …/internal/indexer-status`** 的 **`reorg_recovery`**（**`110-REORG-RECOVERY-HINT`**）配套；见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、**110 §3.1.3**。 |
| **indexer-reorg-recovery.ps1** | Windows | 委托 **`bash scripts/indexer-reorg-recovery.sh`**（须 **Git Bash**）。例：`.\scripts\indexer-reorg-recovery.ps1 status`。 |
| **verify-reconcile-export-ed25519.sh** | Linux/Mac/Git Bash | 对 **`GET …/reconcile-reports/export`** 保存的**原始响应体** + 头 **`x-traveltrust-reconcile-export-ed25519`** + **`GET /meta` → `admin_exports.reconcile_ed25519_public_key_hex`** 做 **Ed25519** 离线验签（**OpenSSL 3+**；**`xxd -r -p`**）；**`--self-test`** 临时密钥自验（CI）。见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)。 |
| **vault-forwarded-export-fetch.sh** | Linux/Mac/Git Bash | **P5-2-C1**：只读拉取 **`GET …/admin/region-vault/forwarded-events/export`**（**须 `ADMIN_BEARER_TOKEN`**，与 **`indexer-public-snapshot.sh`** 同形）；落盘 **`region-vault-forwarded-events.{csv,json}`**、**`.export.headers.txt`**、**`.export.sha256`**（与头 **`x-traveltrust-reconcile-export-sha256`** 一致）；若存在则 **`.export.ed25519`** / **`.export.truncated`**。可选 **`API_BASE_URL`**、**`VAULT_EXPORT_FORMAT`**、**`VAULT_EXPORT_CHAIN_ID`**、**`VAULT_EXPORT_LIMIT`**、**`VAULT_EXPORT_OUT_DIR`**。见 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)。 |
| **vault-forwarded-export-fetch.ps1** | Windows | 委托 **`bash scripts/vault-forwarded-export-fetch.sh`**（须 **Git Bash**）；环境变量与 **.sh** 相同。 |
| **finance-readonly-smoke.sh** | Linux/Mac/Git Bash | **Epic E-10**：对 **`GET …/admin/finance/summary`**、**`cross-check`**、**`drift-summary`** 分别 **curl** + **jq** 校验**单路**成功体形状；**禁止**跨接口对账；**exit** 不表达 drift 结论。须 **`ADMIN_BEARER_TOKEN`**、**`jq`**；**`FINANCE_READONLY_SMOKE_SKIP=1`** → 跳过并 **exit 0**。可选参数：本地 **`epic_d_go_bundle_closure.json`** 路径 → 仅 **jq** **`.bundle_closure`** 四键结构。见 [Epic-E-finance-readonly-ladder.md](../docs/runbook/Epic-E-finance-readonly-ladder.md)、[evidence/GO_EPIC_E_FINANCE_READONLY_CLOSE.md](../evidence/GO_EPIC_E_FINANCE_READONLY_CLOSE.md)。 |
| **check-e2e-three-pack-evidence.sh** | Linux/Mac/Git Bash | **Epic F-06**：校验 **`EVIDENCE_GO_DIR`** 下 **`artifacts/e2e-*.md`** 三文件存在；**不**读正文、**不**对账。**`jq`** 仅在 **`E2E_THREE_PACK_CHECK_MANIFEST=1`** 时必需。**`E2E_THREE_PACK_CHECK_SKIP=1`** → **exit 0**。**`E2E_THREE_PACK_CHECK_MANIFEST=1`** → 额外检查 **`manifest.json`** · **`artifacts[]`** 是否登记三条 **`path`**。见 [Epic-F-e2e-three-pack-ladder · F-06](../docs/runbook/Epic-F-e2e-three-pack-ladder.md#epic-f-f06-check-脚本)。 |
| **indexer-public-snapshot.sh** | Linux/Mac/Git Bash | **`GET /health`** + **`GET /meta`**；可选 **`ADMIN_BEARER_TOKEN`** → admin **indexer health** / **observability overview**；可选 **`INTERNAL_API_SECRET`** → **`GET /api/v1/internal/indexer-status`**（**`internal_indexer_status`**；可选 **`SNAPSHOT_INTERNAL_STATUS_LIVE_RECONCILE=1`** → **`?live_reconcile=1`**）+ 默认 **`POST /api/v1/internal/indexer-reconcile`**（**`persist:false`**；**`SNAPSHOT_INTERNAL_SKIP_RECONCILE=1`** 时**不**调用，**`internal_indexer_reconcile`**·**`snapshot_skipped`**，且 **`snapshot_options`** 内 **`snapshot_internal_reconcile_rpc`**/**`…_include_chain_tip`**/**`…_include_event_log_escrow_coverage`** 强制 **`null`**；可选 **`SNAPSHOT_INTERNAL_RECONCILE_RPC=1～10`** → body **`rpc_escrow_samples`**；可选 **`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP=1`** → **`include_chain_tip`** / **`chain_observation`**，见 **110**；可选 **`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE=1`** → **`include_event_log_escrow_coverage`** / **`event_log_escrow_coverage`**（**DB 已索引**）；**`internal_indexer_reconcile`**）；可选 **`SNAPSHOT_INTERNAL_INDEXER_TICK=1`** → **`POST /api/v1/internal/indexer-tick`**（**`internal_indexer_tick`**；**`logs_fetch_skipped`** 等；**会推进**索引，**慎用**）；合并 JSON 含 **`snapshot_provenance`**（**`script`**/**`script_semver`**（当前 **`1.3.0`**）/**`host_git_commit`**/**`host_git_branch`**/**`host_repo_dirty`**）+ **`snapshot_options`**（含 **`snapshot_internal_skip_reconcile`**）；密钥与 token **勿**入库；须 **内网** 调 internal；`API_BASE_URL` 默认 `http://127.0.0.1:8080`；须 **jq**。 |
| **indexer-public-snapshot.ps1** | Windows | 委托 **`bash scripts/indexer-public-snapshot.sh`**（须 **Git Bash** + **jq**）。 |
| **write-indexer-evidence.sh** | Linux/Mac/Git Bash | 调用 **`indexer-public-snapshot.sh`** 并将 stdout 写入 **`evidence/GO_YYYYMMDD/indexer_public_snapshot_*.json`**（**`EVIDENCE_ROOT`** / **`EVIDENCE_DAY_GO`** / **`EVIDENCE_GO_DIR`**）；**`INDEXER_EVIDENCE_WRITE_MANIFEST=1`** 或 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`** → **`manifest.json`**（与 **`indexer_public_snapshot_manifest.json`** 同形）、**`manifest.sha256`**、**`epic_d_go_bundle_closure.json`**（**Epic D-10** **`traveltrust.ops_artifact.v1`** **`bundle`**）、可选 **`artifacts/epic_d_d0*.json`**（**`INTERNAL_API_SECRET`**）、可选 **`.zip`**（**jq**、**sha256sum/shasum**、**zip**）；与 [RUNBOOK §2.55](../ops/RUNBOOK.md#255-indexer-tick重放与对账internal--admin-只读)、**110**、**`evidence/README`**、**[Epic-D D-10](../docs/runbook/Epic-D-indexer-ops-readonly-ladder.md)** 一致。 |
| **write-indexer-evidence.ps1** | Windows | 与 **.sh** 等价：**bash** 写快照；**manifest** 由 PS **`Get-FileHash`** + **`ConvertTo-Json`**；**`--epic-d10-post`** 委托 **bash** **`write-indexer-evidence.sh`** 写 **sha256** + **closure**；**`.zip`** 用 **`Compress-Archive`**。 |

**修改后端 CORS 或 .env 后**：须重新编译并重启 API 才生效。一键脚本默认会先编译，可避免 `/api/v1/me`、`/api/v1/community/*` 等 404；若遇 404 请勿设 SKIP_API_BUILD=1，或手动执行 `cargo build -p traveltrust-api` 后重启 API。

详见 [docs/测试账号与本地联调.md](../docs/测试账号与本地联调.md)、[README 快速开始](../README.md#快速开始)。

---

## 二、CI 门禁

### SSOT Guard 统一索引（TT-SSOT-GUARD-INDEX-017）

**触发入口（统一）**：仓库根执行 **`bash scripts/check-invariants.sh`**（Windows 可用 **`scripts/check-invariants.ps1`**，与 **`.sh`** 同源）；CI 上由 **[`.github/workflows/build.yml`](../.github/workflows/build.yml)** 的 **Build** job **首步**调用；**`pre-release-automation`** 亦串联同一 **`check-invariants`** 链路。

**Build 新红链首诊**（**`build.yml` 红 / 部分红**）：先 **regression hint** → **`go_no_go_status`** → **首个失败 job** → **再开卡** — 固定顺序与可复制模板见 **[evidence/GO_20260408_BUILD_CI_CLOSURE.md · 新红链首诊流程](../evidence/GO_20260408_BUILD_CI_CLOSURE.md#new-red-chain-triage-flow)**（与 **`scripts/ci-triage.sh`** / **`ci-triage-hint`** job 配套）。

**横向扩展（必须）**：若在**其它 HTTP 端点**引入与下表同类的**根级链读 SSOT**（新 `m.insert` 键族或新 JSON 根键），须**单独开立 TT**，并**新增独立 guard 脚本**或**扩展 allowlist / 并列校验**；**禁止**不经 TT 与脚本评审把新键并入既有 Escrow / B-110 默认范围。

| Guard | 脚本 | 覆盖范围（摘要） |
|------|------|------------------|
| **B-097** 订单详情 **Escrow** 四套根级链读 | **`ssot-guard-escrow-orders-detail.py`**（**`.ps1`** 包装） | **`escrow_*` SSOT `m.insert` 仅** `crates/api/src/routes/orders/mod.rs`；**`merge_escrow_*`** 内**禁止**回填 **`order.*`**；**`data_source` / `is_chain_ssot`** 字面 **`chain_read` / `true`**；**002** 类聚合体排除 **12** 键（与 **`TT-ESCROW-SSOT-ORDER-STATE-AGGREGATE-EXCLUDE-002`** 同口径） |
| **B-110** 治理池 **四根级**链上 SSOT | **`ssot-guard-b110-pool-ssot.py`**（**`.ps1`** 包装） | **`GET …/governance/pool`**：**`pool_balance`** 与顶层 **`data_source` / `is_chain_ssot`**；**`country_pool*` / `treasury_pool*` / `treasury_erc20_pool*`** 的 **`m.insert` 落点、`chain_read` / `true`、不写 0**；**`build_fee_pool_aggregate_body`（fee-pool-aggregates Σ）** **不得**含上述三池**根级**键（与 **`TT-SSOT-GUARD-B110-POOL-016`** 同链） |

**母表交叉索引**（任务溯源）：**[docs/任务母表.md](../docs/任务母表.md)** 内 **「SSOT Guard 门禁索引」** 段（检索 **TT-SSOT-GUARD-INDEX-017**）。

**Evidence 总览**（覆盖 / CI / 典型回归 / 扩展规则一条读）：**[evidence/GO_20260407_SSOT_GUARDS.md](../evidence/GO_20260407_SSOT_GUARDS.md)**（**TT-SSOT-GUARD-GO-SUMMARY-018**）；**evidence 目录锚点**：[evidence/README.md · SSOT Guard 总览](../evidence/README.md#ssot-guards-ci-summary)。

**CI Gate v2（编排）**：**`check-invariants.sh` / `check-invariants.ps1`** 调用 **`ssot-guard-ci-v2.py`** — 顺序执行 **B-097 静态**、**B-110 静态**、**`ssot-guard-response-contract.py`**（**`scripts/gates/ssot-guard-fixtures/v2/*.snapshot.json`** 运行时契约快照）；成功/失败均写 **`target/ssot-guard-ci-v2-report.json`**。失败字段说明：**[gates/templates/SSOT_GUARD_FAILURE_REPORT.md](gates/templates/SSOT_GUARD_FAILURE_REPORT.md)**。新端点接入流程：**[SSOT_GUARD_NEW_ENDPOINT.md](SSOT_GUARD_NEW_ENDPOINT.md)**（**TT + allowlist**）。共享常量：**`gates/ssot_guard_v2_constants.py`**（根路径 **`scripts/ssot-guard-ci-v2.py`** 等同调用）。

| 脚本 / Workflow | 说明 |
|------|------|
| **Contract ABI Gate**（`.github/workflows/contract-abi-gate.yml`） | `forge test` + **`bash scripts/run-verify-abi-forge.sh`**；**仅当**变更命中 `contracts/**`、`frontend/dapp/abis/**`、相关 `scripts/*` 或本 workflow 时自动跑（省 CI）；**Actions → Contract ABI Gate → Run workflow** 可手动全量跑。 |
| **ABI 同步有序清单** | 改 **`contracts/src`** 或 ABI 消费路径后的**最小顺序**与验收句 → **[Runbook §12.4](../ops/RUNBOOK.md)**（与 **[14 §1.2](../docs/spec/14-合约-API-ABI-前后端对齐.md)**、下表 **sync-abi-from-forge** / **check-55-s13** / **run-verify-abi-forge** 配套）。 |
| **run-verify-abi-forge.sh** | 优先 `python3`、否则 `python` 调用 **verify-abi-forge.py**；项目根 `bash scripts/run-verify-abi-forge.sh`。 |
| **run-verify-abi-forge.ps1** | Windows PowerShell 与上等价；项目根 `.\scripts\run-verify-abi-forge.ps1`。 |
| **verify-abi-forge.py** | ABI multiset 校验实现；通常经上一行或 CI 调用（须 `forge`、建议已 `forge build`）。 |
| **check-invariants.sh** | 校验 rust-toolchain、frontend、package-lock.json、API 安全头；并联 **`ssot-guard-ci-v2.py`**（**CI Gate v2**）：内含 **`ssot-guard-escrow-orders-detail.py`**（**B-097**）、**`ssot-guard-b110-pool-ssot.py`**（**B-110**）、**`ssot-guard-response-contract.py`**（**快照契约**）；报告 **`target/ssot-guard-ci-v2-report.json`**，模板 **[gates/templates/SSOT_GUARD_FAILURE_REPORT.md](gates/templates/SSOT_GUARD_FAILURE_REPORT.md)**。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**工台基线 · 依赖审计（invariants · audit-deps）**」行；**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**；**pre-release-automation** 首段同源。 |
| **ssot-guard-escrow-orders-detail.py** | **CI / PR**（经 **check-invariants.sh** → **Build** workflow）：静态校验 **`escrow_*` SSOT `m.insert` 仅见于 `routes/orders/mod.rs`**；两路 **`merge_escrow_*`** 内**禁止 `order.*`**；**`chain_read` / `true`** 与 **002** 聚合排除 **12** 键。订单**列表**若将来需链读展示：**单开 TT**，**扩脚本或并列 guard**，**不**并入 **B-097** 默认范围。项目根 `python3 scripts/ssot-guard-escrow-orders-detail.py`。 |
| **ssot-guard-escrow-orders-detail.ps1** | Windows：委托 **`python`** 运行 **`ssot-guard-escrow-orders-detail.py`**（与上表 **.py** 同链）。 |
| **ssot-guard-b110-pool-ssot.py** | **CI / PR**（经 **check-invariants.sh**）：**B-110** `GET …/governance/pool` 四池根级链上 SSOT 静态门禁（见上表 **check-invariants** 行）。项目根 `python3 scripts/ssot-guard-b110-pool-ssot.py`。 |
| **ssot-guard-b110-pool-ssot.ps1** | Windows：委托 **`python`** 运行 **`ssot-guard-b110-pool-ssot.py`**。 |
| **ssot-guard-ci-v2.py** | **CI Gate v2 编排器**（由 **check-invariants** 调用）：串联 **B-097** / **B-110** 静态脚本 + **`ssot-guard-response-contract.py`**；写 **`target/ssot-guard-ci-v2-report.json`**。 |
| **ssot-guard-response-contract.py** | **快照契约**：校验 **`scripts/gates/ssot-guard-fixtures/v2/*.snapshot.json`**（与 **B-097 / B-110** 根级不变量对齐）。 |
| **audit-deps.sh** | 前端 npm audit、后端 cargo audit（CI 中 continue-on-error）。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**工台基线 · 依赖审计（invariants · audit-deps）**」行；**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**。 |
| **audit-deps.ps1** | Windows：委托 **`bash scripts/audit-deps.sh`**（须 **Git Bash**；与上表 **audit-deps.sh** 行同文档链）。 |
| **check-08-consistency.sh** | 08-3/08-4 **W-PDP-SSOT-CONSISTENCY**；`./scripts/check-08-consistency.sh [BASE_REF]`（默认 **main**）。Workflow：[check-08-consistency.yml](../.github/workflows/check-08-consistency.yml)。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**08-3/08-4 机读预检（一致性 · evidence 指针）**」行。**W-GATE-CROSS-CHECK** 机读辅助之一，**不替代** **08-2 审查二** — **[Runbook §12.7](../ops/RUNBOOK.md)**；**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**。 |
| **check-08-consistency.ps1** | Windows：委托 **`bash scripts/check-08-consistency.sh`**；可选首参 **`BASE_REF`**（与上表 **.sh** 行同文档链）。 |
| **check-08-evidence-pointer.sh** | 08-3 **evidence_pointer** 最小校验。Workflow：[check-08-evidence-pointer.yml](../.github/workflows/check-08-evidence-pointer.yml)。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**08-3/08-4 机读预检（一致性 · evidence 指针）**」行；**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**。 |
| **check-08-evidence-pointer.ps1** | Windows：委托 **`bash scripts/check-08-evidence-pointer.sh`**（与上表 **.sh** 行同文档链）。 |
| **check-governance-doc-linkage.sh** | `82` / **`83` / `84`** / `governance-token`（含 `03`）与 00-索引、00-总表、[00-文档体系与阅读串联（兼容壳）](../docs/spec/00-文档体系与阅读串联.md)、**[07-开发流程与顺序 §二 2.4](../docs/spec/07-开发流程与顺序.md)**、**08-4-附录** 等**静态联动**校验；项目根执行 `bash scripts/check-governance-doc-linkage.sh`。Workflow：[governance-doc-linkage-gate.yml](../.github/workflows/governance-doc-linkage-gate.yml)（PR 与 `main` push 触发；同 workflow 另跑 **`check-07-version-triple.sh`**）。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**治理文档联动（CI）**」行。**串联正文 SSOT** 在 **07 §零、§五**；详见 [00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)。**W-GATE** 机读辅助 — **[Runbook §12.7](../ops/RUNBOOK.md)**。 |
| **check-governance-doc-linkage.ps1** | Windows：委托 **`bash scripts/check-governance-doc-linkage.sh`**（与上表 **.sh** 行同文档链）。 |
| **check-07-version-triple.sh** | **[07](../docs/spec/07-开发流程与顺序.md)** 文首 **`Version:`**、**[00-文档索引](../docs/spec/00-文档索引.md)** 版本表 **`07-开发流程与顺序`** 行、**07 §六 6.5** 变更表**首条数据行**须同号。项目根 `bash scripts/check-07-version-triple.sh`。Workflow：与 **`governance-doc-linkage-gate.yml`** 第二步同批。**维护**：**07 §六 6.1 #4**、**6.2**、**§二 2.4** **CI 基线**；[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)。 |
| **check-07-version-triple.ps1** | Windows：委托 **`bash scripts/check-07-version-triple.sh`**（须 **Git Bash**；与上表 **.sh** 行同文档链）。 |
| **check-did-rank-no-escrow-prefetch.sh** | **`frontend/components/did-rank`****/**`frontend/app/did-rank`**** **内** **不得** 出现 **`stashEscrow`****/**`orderEscrowPrefetch`**（DID 榜 **`trackDidRank*`**** **仅** **analytics** **侧效**，与托管 session 预填解耦）。项目根 `bash scripts/check-did-rank-no-escrow-prefetch.sh`。**文档配套**：[87 §11.1.1](../docs/spec/87-TravelTrust-角色体系技术文档-融合架构版.md)、**[07 §六 6.4](../docs/spec/07-开发流程与顺序.md)** **637** 批、**[缺口官方总表](../docs/spec/缺口与待补-官方总表.md)** **P2**。 |
| **check-did-rank-no-escrow-prefetch.ps1** | Windows：委托 **`bash scripts/check-did-rank-no-escrow-prefetch.sh`**（须 **Git Bash**；与上表 **.sh** 行同文档链）。 |
| **check-wave-phase-files.sh** | 核对 **00 索引主表**登记的 **90～550** 阶段规格是否在 `docs/spec/` 下各有 `NNN-*.md`（规划空号 **280/290/300/310** 允许缺失）。项目根 `bash scripts/check-wave-phase-files.sh`。Workflow：[check-wave-phase-files.yml](../.github/workflows/check-wave-phase-files.yml)（`docs/spec/**` 变更或 `main` push 触发）。**文档配套**：[07 读前摘要「阶段规格文件存在性」行](../docs/spec/07-开发流程与顺序.md)、**§零 0.4**、**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**、根 **[CONTRIBUTING.md](../CONTRIBUTING.md)** 阶段文义务、**07 §二 2.3** **PR 前本地预检**。 |
| **check-wave-phase-files.ps1** | Windows：委托 **`bash scripts/check-wave-phase-files.sh`**（与上表 **.sh** 行同文档链）。 |
| **check-ai-task-card-index-overview.py** | **`docs/AI任务卡索引.md`** **一览**：**A** 序号唯一连续、**E** **TT** **ID** 唯一、**B** **状态** 合法（**已封口** 族 / **登记（未封）**）、**C** **已封口** 须有 **`### TT-…`** 正文标题（宽松 **`^###\s+(TT-[A-Z0-9-]+)\b`**）、**D** **登记（未封）** 摘要须含 **`from-stash`** 路径三选一。默认**严格**；**`--allow-seq-gaps`** 仅放宽 **A**（**非** **main** 提交前门槛）。项目根 **`python3 scripts/check-ai-task-card-index-overview.py`** 或 **`python3 scripts/check-ai-task-card-index-overview.py docs/AI任务卡索引.md`**。**失败**：**stderr** **`RULE=`**…**`seq=`**…**`id=`**…**`msg=`**…。Workflow：[check-ai-task-card-index-overview.yml](../.github/workflows/check-ai-task-card-index-overview.yml)（必过检查名 **`AI task card index overview / check`**）；**Build** [build.yml](../.github/workflows/build.yml) 同脚本一步。 |
| **check-ai-task-card-index-overview.sh** | Unix：薄包装 **`exec python3`** 上表 **.py**；参数透传（含 **`--allow-seq-gaps`**）。 |
| **check-48-line-count.sh** | **50-O-B2**：`crates/api/src` 下 **`.rs`** 单文件行数 ≤500（**`STRICT=1`** 时 ≤400）。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**API 单文件行数 · 27-archived 链（50-O-B2 · 工具）**」行；**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**；**[48 §1.1](../docs/spec/48-后端模块化拆分与落地清单.md)**。 |
| **check-48-line-count.ps1** | Windows：委托 **`bash scripts/check-48-line-count.sh`**（与上表 **.sh** 行同文档链）。 |
| **fix_27_archived_links.sh** | 批量修正 **docs/spec/27-archived** 内 Markdown 相对链（**perl**）。**文首读前摘要**入口 **[07](../docs/spec/07-开发流程与顺序.md)**「**API 单文件行数 · 27-archived 链（50-O-B2 · 工具）**」行；**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**；**[27-archived/README](../docs/spec/27-archived/README.md)**。 |
| **fix_27_archived_links.ps1** | Windows：委托 **`bash scripts/fix_27_archived_links.sh`**（与上表 **.sh** 行同文档链）。 |

---

## 三、验收清单与发版前检查

| 文件 | 平台 | 说明 |
|------|------|------|
| **checklist-17.md** | — | 01 §10 发版前 17 条，逐条勾选。 |
| **export_deployment_params.sh** | Linux/Mac/Git Bash | 17 条 #5：forge build + 合约 bytecode 长度摘要；可选再跑 slither；`./scripts/export_deployment_params.sh [out.txt]`。**有序清单** → **[Runbook §12.8](../ops/RUNBOOK.md)**。 |
| **export_deployment_params.ps1** | Windows | 与 **.sh** 等价；产出文件为 **UTF-8 无 BOM**；`.\scripts\export_deployment_params.ps1 [out.txt]`；**§12.8** 见上表 **.sh** 行。 |
| **gen-frontend-manifest.sh** | Linux/Mac/Git Bash | **08-4 第 7 章** 可验证发布：先 `cd frontend && npm run build`，再在项目根 `./scripts/gen-frontend-manifest.sh` → `frontend/.next/build-manifest.json`。无 **BUILD_ID/static** 时 **`artifacts`** 为 `[]`；可选 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`** 同步 **`frontend-build-manifest.json`** + **`.sha256`**。**有序清单** → **[Runbook §12.6](../ops/RUNBOOK.md)** §A（**`pre-release-automation` 不替代** 本脚本）。 |
| **gen-frontend-manifest.ps1** | Windows | 与上等价；**`$env:EVIDENCE_GO_DIR`**（可相对仓库根）；**§12.6** 见上表 **gen-frontend-manifest.sh** 行。 |
| **check-55-s13.sh** | Linux/Mac | 55-S13 发版前 API/ABI/端口核对；项目根执行 `./scripts/check-55-s13.sh`。**文档配套**：[14 §1.2](../docs/spec/14-合约-API-ABI-前后端对齐.md)（双目录字节一致、**Escrow** 关键字）、**[07 §二 2.3](../docs/spec/07-开发流程与顺序.md)** 脚本索引表（**ABI / Foundry** 行）与**读前摘要**「**ABI·55-S13**」行、根 **[CONTRIBUTING.md](../CONTRIBUTING.md)** 合约段、**[Runbook §12.4](../ops/RUNBOOK.md)** 与下行 **sync-abi-from-forge**。 |
| **check-04-routes-vs-code.py** / **run-check-04-routes.sh** / **run-check-04-routes.ps1** | 须 Python 3 | **`run-check-04-routes`** 串联：**本脚本**（§3.4 **API 主表** vs `crates/api` **`.route`**）、**`check-04-frontend-routes-vs-app.py`**、**`check-13-1-table1-routes-vs-app.py`**、**`check-13-1-routes-covered-by-04-frontend-table.py`**。`DOC_ONLY_SCHEDULED` 预留「仅文档登记、代码待挂载」豁免（当前为空）。**Build CI 与 run-check-04-routes 默认 `STRICT_WARNINGS=1`**（未登记的公开 `/api/v1/*` 失败）；仅排障时可设 `STRICT_WARNINGS=0`。**治理 P5-4**：**`/governance/distribution-accruals`**（及 **`[id]`**）、**`/governance/distribution-claim`** 须登记于 **04 §3.4** 前端表并与 **`frontend/app/**/page.tsx`** 一致（总卷 **[GO_P5_4_CLOSE.md](../evidence/GO_P5_4_CLOSE.md)**）。**文档侧配套**：**[59](docs/spec/59-企业级全域检查清单与文档补充计划.md)** 篇首「API / ABI 与代码对齐」、**[14](docs/spec/14-合约-API-ABI-前后端对齐.md)** **§2.1**（**17** 路由域叙事）；改 **04 §3.4** 前端表或 **13-1** 表 1 须按 **[07 §二 2.4](docs/spec/07-开发流程与顺序.md)** 复核 **59** **A1** 等行。 |
| **check-04-frontend-routes-vs-app.py** | 须 Python 3 | 解析 **04 §3.4「前端页面路由」**表（至 API 主表之前）：首列路径须对应 `frontend/app/**/page.tsx`（**`/`** → **`app/(home)/page.tsx`**；**`:id`** → **`[id]`**；**`/auth/*`** 至少 **login/register**；**`/community/*`**、**`/admin/*`** 须存在目录）。由 **`run-check-04-routes`** 在 **`check-04-routes-vs-code.py`** 成功后串联执行；**Build** CI 单独一步。 |
| **check-13-1-table1-routes-vs-app.py** | 须 Python 3 | 解析 **13-1 §二 表 1** 页面地图 + **「个人中心与 TT 社区·我」互通**子表：全角括号路径、**`/a 或 /b` 择一**、主 IA 表 **Landing/Discover/OrderFlow/…** 命名行映射、裸路径单元格（如 **`/community/me`**）；路径 token 用 **`(?<![0-9A-Za-z])/`** 避免 **TTG/Target** 误匹配；**`/api…`** 前缀视为 **REST 引用**（非 `app` 页面）并跳过。由 **`run-check-04-routes`** 串联；**Build** CI 单独一步。 |
| **check-13-1-routes-covered-by-04-frontend-table.py** | 须 Python 3 | **13-1 表 1** 抽取路径须被 **04 §3.4 前端页面路由**首列某 pattern 覆盖（**`/*`**、**`:id`**、**或** 组择一）；`importlib` 复用前两脚本解析逻辑；纯文档、不读 `frontend/app`。由 **`run-check-04-routes`** 串联；**Build** CI 单独一步。 |
| **check-55-s13.ps1** | Windows | 与上等价；项目根执行 `.\scripts\check-55-s13.ps1`。 |
| **sync-abi-from-forge.sh** | Linux/Mac/Git Bash | 合约变更后：在已安装 **Foundry** 且 `contracts` 已 `forge build` 的前提下，将 `Escrow`/`EscrowFactory`/`Staking`/`Registry`（及可选 `IERC20`/`MockERC20`）ABI 写入 `contracts/abi/*.json`；再按脚本末尾提示复制 `Staking`/`Registry` 至 `frontend/dapp/abis/`，并跑 `check-55-s13.sh`。 |
| **sync-abi-from-forge.ps1** | Windows PowerShell | 与上等价；项目根 `.\scripts\sync-abi-from-forge.ps1`，随后 `.\scripts\check-55-s13.ps1`。 |
| **check-55-quick-verify.sh** | Linux/Mac | 55 阶段运行时快速验收：**/health**、**/meta**、**/metrics**、discover/orders、**`/api/v1/community/stats/posts-by-tag?tag=smoke`**（**31 / 04 §3.4**）、**did-rank/itineraries**、**did-rank/guides**、**did-rank/travelers**（各端点 200 且 **jq** 存在时：`?period=week` → **guides** **`rank_basis`**=`guide_reception_gross_total_then_completed_count`、`guides[]`；**travelers** **`rank_basis`**=`tourist_completed_orders_in_window`、`travelers[]`；**itineraries** **`rank_basis`** ∈ `order_completed_at` \| `itinerary_created_at_fallback` \| `itinerary_created_at_proxy`、`itineraries[]`）；**discover 为 200** 时再验 **`/api/v1/discover/orders?limit=1`**（**55-S12**）；**jq** 存在时校验 **/meta** `.service`、**`.dual_write`**（`failure_policy`、`strict_db_write_any`）、**`.indexer.checkpoint`**（**`source`**∈`runtime`\|`startup_snapshot`，**`block_number`/`log_index`** 为 number）、分页 JSON、**community stats**（`.status` / `.post_count`）。未设 `BASE_URL` 时用 **`PORT`（默认 8080）** 拼 `http://localhost:$PORT`。 |
| **check-55-quick-verify.ps1** | Windows | 与上等价；**/meta**、**/metrics** 须 200；**meta** `.service`、**`.dual_write`**、**`.indexer.checkpoint`**（与 **sh** 同口径）；**community stats** `?tag=smoke`；discover 200 时校验 **`?limit=1`**；did-rank **itineraries** / **guides** / **travelers** 200 时校验 **`?period=week`** 与各榜 **`rank_basis`**（**itineraries** 三值枚举 + **`itineraries[]`**）；**`$env:PORT`**。 |
| **smoke-api-public-routes.sh** | Linux/Mac/Git Bash | API 已启动后：**/health**、**/meta**、**/metrics**、`/api/v1/discover/orders`、`/api/v1/discover/orders?limit=1`、**`/api/v1/did-rank/itineraries`**、**`/api/v1/did-rank/guides`**、**`/api/v1/did-rank/travelers`**、**`/api/v1/community/stats/posts-by-tag?tag=smoke`** 须均为 **200**；**jq** 存在时校验 **/meta**（`.service`、`.strict_mode`、**`.dual_write`**、**`.indexer.checkpoint`** 同 **55-quick**）、**itineraries / guides / travelers `?period=week` `rank_basis`** 与列表数组键、discover 分页（**55-S12**）、**community stats** JSON。默认 `http://127.0.0.1:${PORT}`。用于联调留痕，**不替代** 01 §9 E2E 三项。 |
| **smoke-api-public-routes.ps1** | Windows | 与 **smoke-api-public-routes.sh** 等价（**discover** 须 **200**，非 55-quick 之 503 容忍；含 **did-rank/itineraries**、**did-rank/guides**、**did-rank/travelers** 与 **`?period=week` `rank_basis`**；**/meta** **`.indexer.checkpoint`**）；**`$env:API_BASE_URL`** 或 **`$env:PORT`**（默认 **127.0.0.1**）。 |
| **pre-release-automation.sh** | Linux/Mac/Git Bash | 发版前机器项聚合：`check-invariants.sh`、`check-55-s13.sh`、**`run-check-04-routes.sh`**（四步与 **Build** CI 同源；无可用 **Python 3** 时退出码 **2** 跳过本段）；本机有 `forge` 时 `forge build` + `run-verify-abi-forge.sh`。无 forge 设 `SKIP_FORGE_VERIFY=1`。不替代 P0/15 附录〇/53 确认表/55 §八附续.9 人工勾选。**不替代** **`gen-frontend-manifest`**（须 **`npm run build` 后**单独跑）— **[Runbook §12.6](../ops/RUNBOOK.md)**。日常改路由/API 表另见根目录 **[CONTRIBUTING.md](../CONTRIBUTING.md)**「路由与契约」。**可选（Epic F-10）**：**`CHECK_E2E_THREE_PACK=1`** 且 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`** 时于末尾调用 **`check-e2e-three-pack-evidence.sh`**；可选 **`CHECK_E2E_THREE_PACK_MANIFEST=1`**（须 **jq**）。**不设上述变量则与历史行为一致**。失败语义见 **[Runbook §12.6](../ops/RUNBOOK.md)** **§A 步骤 4**、**[Epic-F ladder · F-10](../docs/runbook/Epic-F-e2e-three-pack-ladder.md#epic-f-f10-pre-release-hook)**。 |
| **check-invariants.ps1** | Windows | 与 **check-invariants.sh** 等价（**rust-toolchain.toml**、**frontend/package-lock.json**、**security_headers_layer** / **x-content-type-options**）；与 **§二** **check-invariants.sh** 行同文档链。 |
| **pre-release-automation.ps1** | Windows | 与 **pre-release-automation.sh** 等价（含 **§12.6** 与 **`gen-frontend-manifest`** 关系）：`check-invariants.ps1`、`check-55-s13.ps1`、`run-check-04-routes.ps1`（无 Python 时退出码 2 跳过，与 Bash 一致）；本机有 `forge` 时 `forge build` + **run-verify-abi-forge.ps1**。无 forge 设 **`$env:SKIP_FORGE_VERIFY='1'`**。**Epic F-10** 可选 **`$env:CHECK_E2E_THREE_PACK='1'`** + **`$env:EVIDENCE_GO_DIR`**（**Git Bash** 调 **`.sh`**）；见上表 **.sh** 行与 **Runbook §12.6**。 |

---

*发版/evidence/08 等流程已精简，按 ops/RUNBOOK.md、evidence/README.md 手工执行。**说明**：原 **`p34_pre_release_checks.sh`** 汇总脚本**已移除**；发版前 08 相关机读请分项使用上表 **`check-08-consistency.sh`**、**`check-08-evidence-pointer.sh`** 等（与 **[07 §四 4.3](../docs/spec/07-开发流程与顺序.md)**、**data/README** 留痕示例一致）。*
