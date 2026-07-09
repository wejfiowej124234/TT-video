# TT-ENTERPRISE-AUDIT-GAP-BATCH-CLOSURE-001 · 企业级审计缺口：优先级 × 收口方式（批量对齐）

**Version:** 1.0.19  
**Status:** Runbook（**登记 + 命令入口**；**不**替代 **TT-9628**、**TT-GATE**、**96-15**、**go-live**、**R-002** 正文）  
**阶次纪律**：下表「**① 本地可机读**」**≠** **② 测试网** **≠** **③ 生产**；**禁止**用 **①** 冒充 **②③**（与根 **AGENTS.md**、**CONTRIBUTING#no-false-completion** 同源）。

### 独立开发（单人维护）· **不依赖 PR**

| 项 | 口径 |
|----|------|
| **交付闸** | 以 **本地可复现 `exit 0`** + **`evidence/GO_YYYYMMDD/`**（或任务卡指定路径）**自留证据** 为主；**不**把 **GitHub PR UI** 或 **远端 Actions 顶栏** 当作唯一收口（与 **[CONTRIBUTING · 单人 push](../../CONTRIBUTING.md#solo-push-vs-pr)**、**[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)**、**[AGENTS.md](../../AGENTS.md)**「Solo maintainer」同源）。 |
| **Owner / 四门对拍** | **Owner = 本人**；**`pd-*` 四门表** = **本人自检** 后四处对拍一致（与 **solo-dev §7** 同句）。 |
| **删 spec / 改 build 必过链 / 路径依赖 registry** | **程序不缩水**：仍按 **CONTRIBUTING** 专程序走；**与是否开 PR 无关**。 |
| **大 diff / `cargo fix` 全仓** | 单人可 **拆成多笔直推 `main` 的小提交序列** 便于 `git blame` / 回滚；**不**等价「必须建 PR」。 |

---

## 0. 本轮「批量修复」在仓库内能合法做到什么

| 类别 | 做法 |
|------|------|
| **机读 / 链接 / 脚本** | 修正断链、补本 Runbook、跑 **`doc-enterprise-audit-machine-phases.sh`** 等 **exit 0** 证据 |
| **E2E `skipped`** | **不**强行改为 pass：多为 **缺 env（`PLAYWRIGHT_ADMIN_BEARER` 等）**、**chain_off 未挂载**、**API down** 的预期跳过；须在 **②** 或专用 env 下另跑并留证 |
| **覆盖边界 / 31 / 96-20 / Tier C** | **产品 + 手验 + ②③** 收口；**无**单次提交可「代码一键穷举」 |
| **Rust `unused import` 警告** | 可分批 **`cargo fix`** 或删 **`pub use`** 聚合；**大 diff** 时单人仍建议 **拆多笔直推** 便于自检与回滚，**不**强制 PR UI |

<a id="tt-enterprise-four-log-classes"></a>

### 0.1 四类日志：定义、真源与阶次标记（**不 PR / 不 CI** 仍可收口）

| 名称 | 含义 | 典型真源（须冻结其一；与 [53-E2E §六「不作为真源」](../spec/53-E2E环境与执行说明.md#53-e2e-full-run-log-checklist) 同键） | 默认可验证阶次 |
|------|------|------------------------|----------------|
| **全量日志** | Playwright **全量 / 宽分型** 一次跑出的 **失败集合 + 逐条复跑闭环** | `frontend/playwright-report/`、`frontend/test-results/**/error-context.md`、`npm run e2e:full-chromium:list` 全尾；台账字段见 [53-E2E §六](../spec/53-E2E环境与执行说明.md#53-e2e-full-run-log-checklist) | **①**；**②③** 须另表，**禁止跳阶** |
| **全链路日志** | 一次闭环 **跨层**（HTTP→DB→队列/索引/webhook 等）的 **可复核终端或报告** | [TT-9618 §3.5.3](TT-9618-onboarding-local-testnet.md#tt-9618-pg-evidence-one-shot) **`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（须 **`DATABASE_URL`**）；可选 **`promtool`** / **`CHECK_FRONTEND_NPM_BUILD=1`** 同次串跑见该节 | **①**（`DATABASE_URL` = 本机 Docker PG）或 **②**（`DATABASE_URL` = **测试网/预发** 可达实例 + 同脚本）；**不是 ③** |
| **本地跑通日志** | 无生产账密下的 **机读绿**：`cargo test`、`ci-local` 族、`doc-enterprise-audit` 等 | 本文 **§6** 行、`evidence/GO_YYYYMMDD/README.md`（与 [solo-dev §3](../solo-dev-rhythm.md)「Evidence 最小集」同键） | **①** |
| **全局真日志** | **目标环境 hostname** 下 **真实 PSP / 真链 / 真 webhook ingress** 的审计尾（可对账） | **②**：staging 网关 + PSP Dashboard 事件 ID + API 响应尾；**③**：[go-live-checklist](../go-live-checklist.md#go-decision-entry-point) 约定证据包 + 生产只读查询。**禁止**用合成 `whsec_`、纯单测内 listen **冒充** TT-9618 正文「**不能**替代 **步 4** 真 listen / Dashboard 投递」类 **②③** 结论 | **②** 或 **③**；**本 agent 未接管 staging/prod 凭证时**，§6 须标 **`— 未执行（须 Owner 补真源 URL/路径）—`** |

**「禁止 mock」在本卡边界内**：指 **进度与证据** — **不得**用 **①** 绿、Playwright **mock-pay** 主路径、或 **窄切片** `report.json` **`GO`** **冒充** **②③ 已对齐**；**不**要求删除仓库内合法 **test double**（`#[cfg(test)]`、矩阵内合成 secret 等），其仍为 **①** 契约回归。

**测试网与公网对齐（真实完成）**：以 **同一 `git` commit** 分别在 **②** 与 **③** 产出 **两份可互指真源**（上表「全局真」列）；**仅 §6 中 ① 行不得宣称本项已闭**。缺任一侧真源 → 登记表 **GAP**（与 [CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion) 同句）。

---

## 1. 问题清单 × 优先级 × 收口命令 / 真源

| ID | 优先级 | 问题摘要 | 收口方式 | 命令或文档（① 默认） |
|----|--------|----------|----------|------------------------|
| A1 | P0 | **机读绿 ≠ 深度多维** | 读边界 + 缺口登记 | [TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)、[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-intro) |
| A2 | P0 | **非路由 UI 无单表穷尽** | 走读链留痕 / 专项 E2E | [TT-9628 §0.0.1](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-0-0-1-modal-walk) |
| A3 | P0 | **`report.json` / ISS-007 勿冒充 staging GO** | 机读分轨 | **R-002**、`evidence/GO_local_r002_verify/README.md`、[CONTRIBUTING](../../CONTRIBUTING.md#no-false-completion) |
| A4 | P1 | **Chromium 全矩阵 `skipped`** | 登记原因 + 条件复跑 | 见本文 **§2**；全矩阵：`bash scripts/gates/local-e2e-chromium-full-matrix.sh` |
| B1 | P0 | **② 测试网未证** | 环境 + 证据 | [TT-9618](TT-9618-onboarding-local-testnet.md)、**`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（须 **`DATABASE_URL`**） |
| B2 | P0 | **③ 生产 / GO** | 另闸 | [go-live-checklist](../go-live-checklist.md#go-decision-entry-point)、**R-002 §1** |
| B3 | P1 | **Onboarding / webhook 真网关** | ② 手点 + 日志 | [TT-GATE §3](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-cross-domain)、**96-18** |
| C1 | P1 | **31 社区深度（视频/评论/举报…）** | 专项 + 96-16 | [TT-GATE §2](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-31-community)、**31** |
| C2 | P1 | **Admin RBAC 穷举** | 设 **`PLAYWRIGHT_ADMIN_*`** + ② 或专用 env | `frontend/e2e/93-matrix-admin-deep-batch.part1.ts` 头注释 |
| C3 | P2 | **i18n / a11y 全站** | **`test:i18n:ci`** + 96-13 | **36**、**96-13** |
| D1 | P0 | **文档相对链断** | 修链 + 可选 enforce | `bash scripts/gates/doc-enterprise-audit-machine-phases.sh`；**`DOC_AUDIT_LINKS_ENFORCE=1`** 见 [TT-DOC](TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001.md#机读一键聚合) |
| D2 | P1 | **TT-9628 叙事互指** | 改叙事时跑 bundle | **`DOC_AUDIT_TT9628_RG=1`** + 同上脚本；或 **`bash scripts/gates/run-tt9628-doc-hygiene-rg-bundle.sh`** |
| D3 | P1 | **08-3 / 08-4 漂移** | 触 key 必 bump | **`./scripts/check-08-consistency.sh`**（见 [08-5](../spec/08-5-CI与一致性落地说明.md)） |
| E1 | P2 | **依赖审计** | 定期跑 / 台账 | **`scripts/audit-deps.sh`**（CI 中常为 continue-on-error，见 **08-5**） |
| E2 | P2 | **Rust unused import 噪音** | 分批 `cargo fix` | **`cargo fix -p traveltrust-api --allow-dirty`**（单人：**多笔小提交直推 `main`** 即可，**不**要求 PR） |

---

## 2. Playwright `skipped`（全矩阵常见原因，**非 bug**）

| 条件 | 典型文件 | 说明 |
|------|-----------|------|
| **`PLAYWRIGHT_ADMIN_BEARER` / `PLAYWRIGHT_SUPER_ADMIN_BEARER` 未设** | `93-matrix-admin-deep-batch.part1.ts` | Admin 深测 **预期** skip |
| **`chain_off` 未挂载** | 同上 | **501** 时 RBAC 负例跳过 |
| **种子登录失败 / tourist 无 token** | `93-matrix-enterprise-p1-batch.spec.ts` 等 | 须 **`SEED_TEST_ACCOUNTS=1`** + API+PG |
| **API health 不可达** | `skipIfApiDown.ts` | 先起 **`traveltrust-api`** |

**结论**：把 **`skipped` 数压到 0** 通常 **不等于** 质量提升；审计上应检查 **skip 理由是否与环境声明一致**，并在 **②** 或 **「全 env 矩阵」** job 中留一次 **少 skip** 的证据。

---

## 3. 推荐「一批跑完」的本地命令序列（①）

```bash
# 1) 文档企业机读（快路径；链扫描默认 warn-only）
bash scripts/gates/doc-enterprise-audit-machine-phases.sh

# 2) 下一批（硬闸）：相对链失败即 exit 1 + TT-9628 §0.0.4 rg 互指（须 PATH 上有 rg）+ 04 路由 + 55-S13
DOC_AUDIT_LINKS_ENFORCE=1 DOC_AUDIT_TT9628_RG=1 DOC_AUDIT_FULL=1 bash scripts/gates/doc-enterprise-audit-machine-phases.sh

# 3) 三连 + 04（与日常合入同源）
env -u DATABASE_URL bash scripts/gates/ci-local-delivery-minimum.sh

# 4) Chromium 全矩阵（须 DATABASE_URL + 已 migrate PG）
source scripts/dev/export-database-url-from-root-env.sh
bash scripts/gates/local-e2e-chromium-full-matrix.sh
```

**无 `rg` 时**：设 **`RUN_TT9628_RG_STRICT=1`** 会使 **`DOC_AUDIT_TT9628_RG=1`** 路径 **exit 1**；**Windows / 精简 PATH** 未装 **ripgrep** 时，**单人默认可接受**：**`DOC_AUDIT_TT9628_RG=0`**（默认）完成 **§3 步 2** 的链扫描 + **FULL**；装 **`rg`** 后再开 **`DOC_AUDIT_TT9628_RG=1`** 做 **TT-9628 §0.0.4** 叙事互指热身（与 **run-tt9628-doc-hygiene-rg-bundle.sh** 头注释同源）。**`winget install BurntSushi.ripgrep.MSVC`** 后若当前 **Git Bash** 仍 **`command -v rg`** 为空，可将 **`…/WinGet/Packages/…/ripgrep-…-x86_64-pc-windows-msvc`** 临时 **`export PATH=…:$PATH`** 再跑 **§3 步 2**（新开 shell 一般已继承系统 PATH）。

---

## 4. 维护说明

- **合 07 / spec/00 版本表**：若本轮要 bump **07** 或 **00**，须单独标明 **「台账同批」**（与 **TT-DOC** 文首同条）。  
- **本文件不 bump** **07** / **spec/00** 仅增本 Runbook 时：**不改** 文首百分比（**07 §6.6** 复审注）。

---

## 5. 反向链接（审计阅读顺序）

1. [TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001](TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001.md)（Phase 0～12）  
2. [TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)  
3. [TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)

---

## 6. 下一批执行记录（单人 · **不**开 PR）

| 日期 | 执行人 | 命令（摘要） | 结果 |
|------|--------|--------------|------|
| 2026-05-12 | 本人 | `DOC_AUDIT_LINKS_ENFORCE=1 DOC_AUDIT_FULL=1 bash scripts/gates/doc-enterprise-audit-machine-phases.sh` | **exit 0**（链扫描 + 07 + AI 索引 + **55-S13** + **run-check-04-routes**） |
| 2026-05-12 | 本人 | **`winget install BurntSushi.ripgrep.MSVC`**；**`export PATH=<WinGet ripgrep 目录>:$PATH`** **`DOC_AUDIT_LINKS_ENFORCE=1 DOC_AUDIT_TT9628_RG=1 DOC_AUDIT_FULL=1 bash scripts/gates/doc-enterprise-audit-machine-phases.sh`** | **exit 0**（含 **`run-tt9628-doc-hygiene-rg-bundle`** **实跑**，非 skip） |
| 2026-05-12 | 本人 | **`env -u DATABASE_URL bash scripts/gates/ci-local-delivery-minimum.sh`** | **exit 0**（`cargo test -p traveltrust-api` + **04** 路由族 + **元数据 / AI 索引** 门禁） |
| 2026-05-12 | 本人 | **`source scripts/dev/export-database-url-from-root-env.sh` + `bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（**②**：本机 **PG** + 已 **migrate** 的 **`DATABASE_URL`**） | **exit 0**；前置曾失败 **`matrix_93_admin_onb_031`**：**`GET /api/v1/admin/jobs`** 响应 **`applied_filters.queue_name`** 与 **04 §3.4** 表不一致 → 已在 **`admin_jobs_scheduler.rs`** 补回 **`queue_name`** 回显 |
| 2026-05-12 | 本人 | **`cargo fix -p traveltrust-api --tests --allow-dirty`** + 手删 **3** 条残留 **`unused import`**（**`tests_pack_08`/`tests_pack_15`/`indexer_replay_reorg`**）；**`env -u DATABASE_URL cargo test -p traveltrust-api`** | **1329 passed**；**`cargo build -p traveltrust-api --tests`** **无 `unused_import` 警告**（①） |
| 2026-05-12 | 本人 | **`cargo clippy --fix`** 曾致 **`cargo build -p traveltrust-api --tests` 失败**；补全目录化 **`pub use`/`pub(crate) use`** 后 **`env -u DATABASE_URL cargo test -p traveltrust-api`** + **`ci-local-delivery-minimum`** | **1329 passed**；**`ci-local-delivery-minimum` exit 0**（①） |
| 2026-05-12 | 本人 | **`bash scripts/check-08-consistency.sh`** | **exit 0**（**08-4** CI 行在、**08-3** 相对 **main** 无变则跳过 bump 规则） |
| 2026-05-12 | 本人 | **`source scripts/dev/export-database-url-from-root-env.sh` + `bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（再验）+ **`cargo clippy -p traveltrust-api --all-targets`**（**仅诊断**） | **TT-9618 exit 0**；**clippy** **~209 warnings**，**不建议盲 `clippy --fix`**（①） |
| 2026-05-12 | 本人 | **`traveltrust-core`**：`manual_contains`（**`preset_cities`/`product_countries`**）；**`traveltrust-api`**：目录化 **`pub use`** 再导出对 **rustc** 呈「未使用」处加 **`#[allow(unused_imports)]`** / 拆分 **`pub use`**；**`env -u DATABASE_URL cargo test -p traveltrust-api`** + **`cargo clippy -p traveltrust-api --all-targets`** | **1329 passed**；**`unused import` 类 clippy 警告 = 0**（余 **~209** 条多为 **`await_holding_lock`** 等；①） |
| 2026-05-12 | 本人 | **`chain_off`**：**`session` Bearer 前缀**（**`split_at`/`strip_prefix`** 替代手切 **`[7..]`**）、**`pagination`** **`clamp`**、**`handler_mutations`** **`contains_key`**；**`env -u DATABASE_URL cargo test -p traveltrust-api`** | **1329 passed**（①） |
| 2026-05-12 | 本人 | **`persistence_gate`**：**`needless_return`** 收口；**`orders_tests_body`**：**`needless_borrow`**（**`order_state_str`** 已为 **`&str`**）；**`cargo test`/`clippy`** **`traveltrust-api`** | **1329 passed**；**clippy** **204** warnings（①） |
| 2026-05-12 | 本人（agent） | **§0.1 四类日志** 落盘 + 本行：**`env -u DATABASE_URL cargo test -p traveltrust-api`** + **`env -u DATABASE_URL cargo build -p traveltrust-api --tests`** | **1329 passed**；**build --tests exit 0**（**①**）；**②③ 全局真日志** — **未在本环境执行**，**不**填 staging/prod 真源（**GAP 明示**，禁止假绿） |
| 2026-05-13 | 本人（agent） | **§7 清单**：补全 **`react-hooks/exhaustive-deps`**（社区 Feed / Me posts / Feedback / PublishDrawer / EscrowDetail / `useCommunityFeedApiDerivedSync`）；**`cd frontend && npm run lint`** + **`npx tsc --noEmit`** | **No ESLint warnings or errors**；**tsc exit 0**（**①**） |
| 2026-05-13 | 本人（agent） | **`cargo clippy --fix`** + **根** **`Cargo.toml`** **`[workspace.lints.clippy]`**（结构性项 **allow**；后由成员 **`[lints] workspace = true`** 继承）+ **手工** **`clamp`/`match`/`is_err`/`contains_key`/`from_ref`** 等；**`cargo clippy -p traveltrust-api --all-targets`** + **`env -u DATABASE_URL cargo test -p traveltrust-api`** | **Clippy 0 warning**；**1329 passed**（**①**） |
| 2026-05-13 | 本人（agent） | **Clippy 策略上收**：根 **`Cargo.toml`** **`[workspace.lints.clippy]`** + **`crates/api`**/**`crates/core`** **`[lints] workspace = true`**（删成员内重复 **`[lints.clippy]`**）；**`cargo clippy --workspace --all-targets -- -D warnings`** + **`cargo test -p traveltrust-api`** | **clippy / test 均 exit 0**（**①**） |
| 2026-05-13 | 本人（agent） | **§6 / §7 叙事对拍**：§6 历史行与 §7 **Clippy** 列改为 **workspace** 真源（**非**仅 **`crates/api`** **`[lints.clippy]`**） | **文档-only**（**①**） |
| 2026-05-13 | 本人（agent） | **全量复验（用户「修复以上」收口）**：**`cargo fmt --all -- --check`**；**`cargo clippy --workspace --all-targets -- -D warnings`**；**`env -u DATABASE_URL cargo test -p traveltrust-api`**；**`cd frontend && npm run lint`** | **均 exit 0**（**1329 passed**；ESLint **0**；**①**）；**②③** 未执行 |
| 2026-05-13 | 本人（agent） | **整段日志落盘**：仓库根串跑 **`rustfmt`** + **`cargo clippy --workspace --all-targets -- -D warnings`** + **`env -u DATABASE_URL cargo test -p traveltrust-api`** + **`CI_LOCAL_SKIP_AI_TASK_CARD_INDEX=1 env -u DATABASE_URL bash scripts/gates/ci-local-delivery-minimum.sh`** + **`frontend` `lint`/`tsc`**，**`tee`** → **`evidence/GO_20260512/full_gate_20260513T003511Z.log`**（**`*.log` 默认 gitignore**，本机自留） | **全文 `=== END OK ===`**；**0 条 FAIL**；**①**；**②③** 未执行 |

<a id="tt-enterprise-error-log-inventory"></a>

## 7. 错误日志真源清单（按现象捡日志 · **①** 默认）

**用途**：红闸 /  flaky 时**先锁定文件路径**，再开 issue 或逐条台账；与 [53-E2E §六 · 6.1「不作为真源」](../spec/53-E2E环境与执行说明.md#53-e2e-full-run-log-checklist) 同键 — **IDE `terminals/*.txt` 碎片**、**无 commit SHA 的口头转述** **不得**当收口真源。

| 现象 / 闸门 | 优先打开的日志或目录 | 备注 |
|-------------|------------------------|------|
| **Playwright 单例失败 / 超时** | `frontend/test-results/` 下对应用例目录内的 **`error-context.md`**、同目录 **trace / screenshot** | 全量跑：**`frontend/playwright-report/index.html`**；列表尾：`npm run e2e:full-chromium:list`（见 **53 §六**） |
| **`local-e2e-chromium-full-matrix` / `local-delivery-expanded` 尾段** | 终端里 **`[chromium]`** / **`Error:`** / **`npx playwright test`** 块；自跑时建议 **`tee evidence/GO_YYYYMMDD/e2e-chromium-matrix.log`**（勿依赖未落盘的 `tail` 缓冲） | 须 **`DATABASE_URL`** + 已 **migrate**；**`net::ERR_CONNECTION_REFUSED`** → 查 **8080/3012** 与 **`PLAYWRIGHT_FULL_STACK`** |
| **`cargo test -p traveltrust-api` 失败** | 终端完整 **`---- … stdout ----`** / **`panicked at`**；单测：`cargo test -p traveltrust-api <filter> -- --nocapture` | **`DATABASE_URL unset`** 与 **PG·IT** 跳过/失败混用时，先 **`env -u DATABASE_URL`** 对照跑 |
| **`tt-9618-onboarding-pg-evidence` 失败** | 脚本按段 **`==> matrix_93_*`** 打印；失败矩阵名即 **grep 入口**（如 **`matrix_93_admin_onb_031`**） | **`exit 2`**：**未设 `DATABASE_URL`**；**`INTERNAL_API_SECRET`** 干扰见脚本头 **unset** 说明 |
| **`run-check-04-routes` / 04 契约** | 终端 **`check-04-*` / `check-13-1-*` / `check-b45*`** 的 **FAIL** 行；脚本在 **`scripts/run-check-04-routes.sh`** 调用的各 Python 子进程 stderr | 与 **04 §3.4** 表体对拍 |
| **文档机读 / 断链** | `bash scripts/gates/doc-enterprise-audit-machine-phases.sh` 的 **`BROKEN_LINK` / `exit 1`** 段；设 **`DOC_AUDIT_LINKS_ENFORCE=1`** 时首条断链即停 | **`DOC_AUDIT_TT9628_RG=1`** 且 **`rg` 不在 PATH** → 先装 **ripgrep** 或 **`DOC_AUDIT_TT9628_RG=0`**（见本文 **§3** 段末） |
| **`cargo clippy` 警告/错误** | **`cargo clippy --workspace --all-targets -- -D warnings`** 或 **`cargo clippy -p traveltrust-api --all-targets`**；输出可 **`tee evidence/…/clippy.log`** | **Rust workspace**（**`traveltrust-core` + `traveltrust-api`**）：策略在**根** **`Cargo.toml`** **`[workspace.lints.clippy]`**，成员 **`[lints] workspace = true`**；并已 **`cargo clippy --fix`** + 手工修补至 **`-- -D warnings` 可过**（**①**）；**未审阅**下对**全仓**盲 `--fix` 仍不推荐 |
| **前端 `npm test` / `tsc` / `lint`** | `cd frontend` 后命令的 **首条 ESLint/TS 错误路径:行** | **`local-delivery-expanded`** 内嵌该块 |
| **08-3 / 08-4 漂移** | `./scripts/check-08-consistency.sh` 打印的 **param_key / 缺失版本行** | 见 [08-5](../spec/08-5-CI与一致性落地说明.md) |
| **②③ 环境** | 各环境 **API / 网关 / PSP Dashboard** 导出或 **脱敏** request id 列表 | **非**仓库内固定路径；须 **Owner** 在 **§6** 或 **`evidence/`** 登记 **可访问索引** |

**留痕**：可将上表同步到 **`evidence/GO_YYYYMMDD/README.md`**；**直推 `main`** 即可，**不**要求 GitHub PR UI（与 **文首「独立开发」** 表同键）。
