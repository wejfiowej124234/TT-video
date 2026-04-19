# 93 矩阵 · 分批任务卡与可重复执行（SSOT）

**Version:** 1.1.1  
**Status:** 执行跟踪（**不**替代 **[spec/93-全站功能验证矩阵-域别回归清单.md](../spec/93-全站功能验证矩阵-域别回归清单.md)** 正文；**不**把数百条用例塞进 **`docs/AI任务卡索引.md`** 一览 —— 避免索引爆炸与「只写不跑」。）

**工程转向（2026-04-19）**：**[04 §3.4](../spec/04-后端与API.md)** / **[14](../spec/14-合约-API-ABI-前后端对齐.md)** 路由机读契约（表结构 + **`run-check-04-routes`** 门禁锚点）已冻结；本仓库后续迭代优先消耗 **93** 各批次 backlog，把依赖就绪前的 **BLOCKED** 在目标环境上**逐条**收敛为 **PASS** 或 **FAIL**，并按 **93 §0.5** 留痕（**`report.json`** / 用例子目录）；**不得**用「长期 BLOCKED、无 `blocked_reason` / 无补救排期」代替验收。**对齐审计补注**：**B-486** **「** **进行中** **」** **与** **`.github/workflows` 顶层 `permissions`** **仓内** **机读** **一致** **；** **真** **封口** **仍以** **非占位** **`R003_*`** **+** **`validate-regression-report`** **+** **铁律①** **为准** **（** **见** **[TT-ALIGN-DOCS-CODE-MOTHER-AUDIT-2026-04-19](./TT-ALIGN-DOCS-CODE-MOTHER-AUDIT-2026-04-19.md)** **）** **。**

## 你要解决什么问题

- **93** 是全站矩阵 SSOT，条目多、**AUTO-P0 / MANUAL-P1 / MANUAL-BLOCKED** 混杂。  
- **R-003** 规定 **staging 首轮**先 **A+B 主链**；**R-004** 再扩 **C/D**。  
- 本文件把 **93 正文表格中的「用例 ID」** 拆成 **可排期的批次（任务卡语义）**：每批有固定 **重跑入口**、**证据落盘模板**、以及 **R-002 §4** 回填提醒，**发版/大改后可整批重跑**。

## 互指

| 文档 | 用途 |
|------|------|
| **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)** | 判据、五态、§7 顺序、§7.1 Gate |
| **[R-002 §4](../spec/R-002-回归执行闭环与发布准入.md)** | 用例 ID ↔ 自动化资产映射（**每批跑完更新**） |
| **[R-003](../spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)** | staging 首轮 A+B、铁律①、§3.1 冻结 |
| **[R-004](../spec/R-004-R003之后的扩展回归路线图.md)** | R-003 后 C/D 扩面顺序 |
| **[TT-LOCAL-R003](../AI任务卡索引.from-stash.md#tt-local-r003-dev-fullchain-001)** | **无** **staging** **域名** **时** **本地** **全链路** **（** **一览** **433** **）** **；** **不** **替代** **93-R003-STAGING** |
| **[TT-STACK-LAYERS-REGRESSION-ORCH-001](./TT-STACK-LAYERS-REGRESSION-ORCH-001.md)** | **L0～L7** **分层** **编排** **（** **API** **/** **ABI** **/** **单测** **/** **E2E** **/** **本** **tracker** **批次** **）** **；** **from-stash** **一览** **434** |
| **`scripts/dev/extract_93_case_inventory.py`** | 从 93 抽 **用例 ID + 自动化列**（93 改版后重跑 `python … > inventory.tsv` 做 diff） |
| **[任务母表 · B-486～B-498](../任务母表.md)** | **93 各批次** 在母表中的 **B-xxx 登记行**（**是否已转为 TT** 列当前均为 **❌**；封口后回填 **TT-xxx**） |

## 与任务母表（B-xxx）对齐

| 批次 ID | 母表 B | TT（**`TT-Bxxx-…`** **·** **from-stash** **一览** **420～432**） |
|---------|--------|-----------------------------------------------|
| **93-R003-STAGING** | **B-486** | **`TT-B486-93-R003-STAGING-BATCH-001`**（**无** **部署** **先** **[TT-LOCAL-R003](../AI任务卡索引.from-stash.md#tt-local-r003-dev-fullchain-001)** **一览** **433** **）** |
| **93-A-REST** | **B-487** | **`TT-B487-93-A-REST-BATCH-001`** |
| **93-B-MKT-GDE** | **B-488** | **`TT-B488-93-B-MKT-GDE-BATCH-001`** |
| **93-B-ORD-FLOW** | **B-489** | **`TT-B489-93-B-ORD-FLOW-BATCH-001`** |
| **93-B-ESC-DSP** | **B-490** | **`TT-B490-93-B-ESC-DSP-BATCH-001`** |
| **93-B-MSG-NEG** | **B-491** | **`TT-B491-93-B-MSG-NEG-BATCH-001`** |
| **93-C-GOV-STK** | **B-492** | **`TT-B492-93-C-GOV-STK-BATCH-001`** |
| **93-D-COM-API** | **B-493** | **`TT-B493-93-D-COM-API-BATCH-001`** |
| **93-D-COM-UI** | **B-494** | **`TT-B494-93-D-COM-UI-BATCH-001`** |
| **93-D-DID** | **B-495** | **`TT-B495-93-D-DID-BATCH-001`** |
| **93-D-STA-NET** | **B-496** | **`TT-B496-93-D-STA-NET-BATCH-001`** |
| **93-D-ADM** | **B-497** | **`TT-B497-93-D-ADM-BATCH-001`** |
| **93-§6-CROSS** | **B-498** | **`TT-B498-93-S6-CROSS-BATCH-001`**（**锚** **名** **用** **`S6`** **↔** **§6**） |

## 缺口与未生成 TT（清点）

- **13 张批次级 TT + 1 张本地前置**：已在 **[`AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md)** **一览** **420～433** **落** **`###`**** **正文** **（** **`TT-B486`～`TT-B498`** **+** **`TT-LOCAL-R003`** **）** **；** **93** **批次** **仍** **未封口** **。** **R-003** **预检** **/** **staging** **封口** **机读** **：** **`scripts/dev/check_r003_staging_env_ready.py`** **、** **`scripts/dev/print_tt_b486_seal_snippet.py`** **（** **见** **TT-B486** **正文** **）** **。** **无** **staging** **域名** **：** **先** **[TT-LOCAL-R003](../AI任务卡索引.from-stash.md#tt-local-r003-dev-fullchain-001)** **。**    
- **R-003 → 下一执行批次**：**`93-R003-STAGING`** **`report.json` + 铁律① + 会签** **完成后** **，** **默认** **下一** **矩阵** **批次** **为** **`93-A-REST`**（**B-487** **/** **`TT-B487-…`** **）** **；** **主题级** **「** **R-004** **第二阶段** **」** **（** **C** **→** **富媒体** **→** **Admin** **）** **见** **[R-004 §2](../spec/R-004-R003之后的扩展回归路线图.md)** **，** **须** **满足** **R-004** **文首** **硬** **前置** **。**  
- **重跑入口缺口**：除 **93-R003-STAGING**（`run_r003_staging_evidence_chain.py`）外，其余批次 **尚无** 与 R-003 同级的 **单一 env 驱动脚本**；当前为 **手工 / `cargo test` / Playwright** 组合，可按优先级为 **93-A-REST**、**93-B-ORD-FLOW** 补 **collect** 类或 **最小 bash 编排**。  
- **R-002 §4 回填**：各批 **AUTO-P0** 与 **`inventory.tsv`** 对齐后，须在 **[R-002 §4](../spec/R-002-回归执行闭环与发布准入.md)**（**含** **§4.1** **批次** **表** **）** **标清** **已有自动化 / 仍 MANUAL**，避免 93 与代码双源漂移。  
- **§5 页面母表**：不单独占 **B** 行；执行各批 UI 时 **按 93 §5 路由勾选**，变更时重跑 **受影响批次**。

## 硬规则（防全站一口吞）

1. **未完成 R-003 staging 首轮真实放行前**，不要并行开「全矩阵」口头项目；本表 **93-R003-STAGING** 批为 **P0**。  
2. **每批**跑完：在 **`report.json` 或批次 `notes.md`** 写清 **PASS/FAIL/BLOCKED/N_A/NOT_RUN**；**FAIL 不得空 notes**。  
3. **每批**至少扫一眼 **R-002 §4**：本批内 **AUTO-P0** 是否已有 **`crates/api` / E2E** 资产；没有的标 **缺口** 或降成 **MANUAL-P1**（与 93 §0.4 一致）。  
4. **重复跑**：换 **`run_id` / 日期子目录**（如 `evidence/93-batch-B-ext/run_20260420T…`），**勿**在已 **§3.1 冻结** 的 **`evidence/GO_20260418/`** 上覆盖。  
5. **BLOCKED → PASS/FAIL**：某用例因缺 RPC/钱包/邮件/DB 等记 **BLOCKED** 时，须在同批 **`notes.md`** 写 **`blocked_reason`** 与**下一次**重跑条件；条件满足后的**下一轮**执行必须产出 **PASS** 或 **FAIL** + **93 §0.5** 最小证据（**禁止**把「仍 BLOCKED」当作本轮收口）。

---

## 批次总表（任务卡 · 执行单元）

**列说明**：**批次 ID** = 排期/工单里口头引用；**重跑入口** = 主命令或脚本；**证据** = 建议根目录（可按团队规范微调）。

**「** **未做** **」** **与** **证据** **目录** **为空** **：** **母表** **B-486～B-498** **行** **为** **登记态** **/** **骨架** **批次** **时** **可** **为** **预期** **（** **证据** **目录** **尚** **空** **）** **；** **口径** **与** **登记态** **/** **未封口** **清点** **见** **[** **任务** **母表** **](../任务母表.md)** **小节** **「** **登记态** **/** **未封口** **清点** **（** **真源** **：** **索引** **状态** **列** **）** **」** **（** **以** **该** **小节** **标题** **锚定** **；** **行** **号** **随** **编辑** **漂移** **）** **。**

| 批次 ID | 依赖 | 93 § / 说明 | 覆盖用例 ID（逗号分隔） | 重跑入口 | 证据目录模板 |
|---------|------|----------------|-------------------------|----------|----------------|
| **93-R003-STAGING** | staging 网络 + **非占位** `.env.r003.local`（**占位** **与** **真封口** **登记** **见** **[TT-B486](../AI任务卡索引.from-stash.md#tt-b486-93-r003-staging-batch-001)**） | **R-003** 与 93 **§2.0 五连** + A 域门禁同源 | A-ENV-001,A-NEG-002,A-NEG-001,A-LOG-001,A-ME-001,A-LOG-002,A-LOG-003,B-MKT-001,B-GDE-001,B-ORD-001,B-ORD-003,B-MSG-002 | `python scripts/dev/run_r003_staging_evidence_chain.py --from-env` | `evidence/GO_20260418/`（或 `GO_YYYYMMDD`） |
| **93-A-REST** | 同环境会话 | **§1** 余量（R-003 已跑的不再单独占批次） | A-REG-001,A-LOG-004,A-ME-002,A-ME-003,A-PWD-001,A-EM-001,A-EM-002 | 手工 HTTP / 将来 `collect-r003` 类扩展 | `evidence/93-batch-A-rest/<run_id>/` |
| **93-B-MKT-GDE** | 登录态 | **§2** 市场/向导扩展 | B-MKT-002,B-MKT-003,B-GDE-002,B-GDE-003 | `cargo test` + 路由契约 / 手工 | `evidence/93-batch-B-mkt-gde/<run_id>/` |
| **93-B-ORD-FLOW** | 向导 + 双角色 | **§2** 订单状态机深路径 | B-ORD-004,B-ORD-005,B-ORD-006,B-TRN-001,B-TRN-002,B-TRN-003 | 手工 + **53** Runbook | `evidence/93-batch-B-ord-flow/<run_id>/` |
| **93-B-ESC-DSP** | 订单在合适态 | **§2** 托管/争议/API | B-ESC-001,B-ESC-002,B-ESC-003,B-ESC-004,B-ESC-005,B-DSP-001,B-DSP-002,B-DSP-003 | 链环境则 **N/A/BLOCKED** 须写明 | `evidence/93-batch-B-esc-dsp/<run_id>/` |
| **93-B-MSG-NEG** | 订单 id | **§2** 消息余量 + 负例 | B-MSG-001,B-MSG-003,B-NEG-001,B-NEG-002,B-NEG-003 | `cargo test` / 手工 | `evidence/93-batch-B-msg-neg/<run_id>/` |
| **93-C-GOV-STK** | 只读 + 钱包（部分） | **§3** 治理/质押 | C-GOV-001～C-GOV-011,C-STK-001,C-NEG-001 | `bash scripts/smoke-*` / Read Contract 类 / 手工 | `evidence/93-batch-C-gov/<run_id>/` |
| **93-D-COM-API** | 登录态 | **§4.1** 社区 API | D-COM-001,D-COM-002,D-COM-003 | `cargo test` + API 手工 | `evidence/93-batch-D-com-api/<run_id>/` |
| **93-D-COM-UI** | 前端 dev | **§4.1** 社区 UI / 路由 | D-COM-004～D-COM-007,D-DSP-UI-001,D-DSP-UI-002 | **Playwright** 最小集 / 手工 | `evidence/93-batch-D-com-ui/<run_id>/` |
| **93-D-DID** | — | **§4.3** | D-DID-001,D-DID-002 | API + 截图 | `evidence/93-batch-D-did/<run_id>/` |
| **93-D-STA-NET** | — | **§4.4** | D-STA-001,D-ITN-001,D-NET-001 | 链接爬虫 / 手工 | `evidence/93-batch-D-sta/<run_id>/` |
| **93-D-ADM** | Admin 账号 | **§4.5** | D-ADM-001,D-ADM-002 | 手工抽检 + **70** 台账 | `evidence/93-batch-D-adm/<run_id>/` |
| **93-§6-CROSS** | 多域已绿 | **§6** 横切 | 按 **93 §6** 勾选矩阵 | 发版前抽检清单 | `evidence/93-batch-S6-cross/<run_id>/` |

> **说明**：**§5 页面母表** 不单独成批 —— 在以上各批跑 UI/API 时 **按路由勾选 §5 行** 即可；**§5 变更**时优先重跑受影响 **批次**。

---

## §5 页面级 NOT RUN 收敛（业务风险序 · Playwright）

**目的**：把 **93 §5** 中「smoke 未覆盖 / 仅可达性」的页面，按 **治理写交互 → 消息 → 市场 → 向导台 → Me → 空错态** 排序，用 **PASS/FAIL** 收口；证据建议落 **`evidence/93-batch-p1-ui/<run_id>/`**（与 **`report.json`** 互指见 **R-001**）。

### 本批已补自动化（`frontend/e2e/93-matrix-path-p1-remediation.spec.ts`）

| 优先级 | 路由 | 93 / 用例映射 | 状态（自动化） | 证据目录模板 | 复跑命令 |
|--------|------|----------------|----------------|----------------|----------|
| P0 | `/governance/proposals/{id}`（由 `GET …/proposals` 或 B-072/十进制探测解析） | C-GOV-004（API 投票 UI） | **PASS**（MVP 或投影库有行且非 `on_chain_governor`） / **SKIP**（Governor 投影空库、链上投票态） | `evidence/93-batch-p1-ui/<run_id>/C-GOV-004/` | `cd frontend && PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-path-p1-remediation.spec.ts -g "governance vote"` |
| P1 | `/market`（`StickyFilterBar`） | B-MKT-002 UI | **PASS** | `…/B-MKT-002/` | 同上 `-g "market filter"` |
| P1 | `/community/messages` | D-COM-004 | **PASS** | `…/D-COM-004/` | 同上 `-g "community messages"` |
| P2 | `/trust` | D-NET-001（叙事页） | **PASS** | `…/D-NET-001-trust/` | 同上 `-g "trust \+ governance accruals"` |
| P2 | `/governance/distribution-accruals`、`/governance/distribution-accruals/[id]` | C-GOV-009 | **PASS** | `…/C-GOV-009/` | 同上 `-g "trust"` |
| P2 | `/admin/trust-growth`、`/admin/cross-check`、`/admin/drift-summary`、`/admin/finance-reconciliation`、`/admin/region-vault` | D-ADM-002 抽检扩展 | **PASS**（占位 Cookie） | `…/D-ADM-002-ext/` | 同上 `-g "admin finance"` |
| P3 | `/escrow/not-a-uuid` | B-NEG-002 错误面 UI | **PASS** | `…/B-NEG-002-ui/` | 同上 `-g "escrow invalid"` |

**整文件**（含 **setup-meta-chain** 依赖）：`cd frontend && PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-path-p1-remediation.spec.ts --project=chromium`

### 本批 · 企业级 P1 补齐（`93-ENTERPRISE-P1`，**不**改 `93-matrix-path-p1-remediation` / **不**动 Playwright 配置 / **不**动 04/14）

**TT-L4**：用例组名含 **`@e2e-sepolia-deferred`**，与既有 **`chromium-sepolia`** `grepInvert` 对齐，**不**进入 Sepolia 主链基线。

**证据根目录**：`evidence/93-batch-enterprise-p1/<run_id>/`（模板见 `evidence/93-batch-enterprise-p1/README.md`、`_template/`）。

| 优先级 | 路由 / 主题 | 93 / 用例映射 | 状态（自动化） | 证据目录模板 | 复跑命令 |
|--------|-------------|----------------|----------------|----------------|----------|
| P1 | `/me` 昵称编辑 + `GET /api/v1/me` 再读 | A-ME-002 | **PASS**（`P3_CHAIN_OFF=1` 链下） | `evidence/93-batch-enterprise-p1/<run_id>/A-ME-002/` | 见下「整批」 |
| P1 | `/market?view=orders&country&city` + `GET …/discover/orders` | B-MKT-002 扩展 | **PASS** | `…/B-MKT-002-url-api/` | 同上 |
| P1 | `/community/messages` 空态或首条 ↔ `GET …/conversations` | D-COM-004 | **PASS**（无 DB 时空列表为 **PASS**，与占位 API 一致） | `…/D-COM-004-api-ui/` | 同上 |
| P1 | `/guide` `guide@test.com` 主区域 | 向导台首屏 | **PASS** | `…/guide-hub/` | 同上 |
| P2 | `/admin/finance`、`/admin/finance-reconciliation` | D-ADM-002 扩展 | **PASS**（烟雾 Cookie） | `…/D-ADM-finance/` | 同上 |
| P3 | `/me` 未登录（清 localStorage） | 门禁 / A 域 | **PASS** | `…/guest-me/` | 同上 |
| P3 | `/auth/login` 错误密码 `role=alert` | 登录负例 | **PASS** | `…/login-negative/` | 同上 |

**整批复跑**（`chromium` + **setup-meta-chain**；与 **TT-L4** 的 `e2e:sepolia` / `chromium-sepolia` **无关**）：  
`cd frontend && npx playwright test e2e/93-matrix-enterprise-p1-batch.spec.ts --project=chromium`  
全栈：`PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-enterprise-p1-batch.spec.ts --project=chromium`

### 本批 · Admin 独立业务域（`93-ADMIN-DOMAIN`）

**目标**：将 **D-ADM-002** 相关 **Admin §5 全路由** 从「仅可达 / NOT RUN」收敛为 **PASS（壳级）**；与 **`smoke-admin.spec.ts`** 同源 Cookie 与 `gotoSmoke`，升级断言为 **`main` + `h1`**；并覆盖 **权限门**（无 Cookie → 登录）、**非法 id 错误面**。

**证据**：`evidence/93-batch-admin-domain/README.md`、`inventory.md`、`<run_id>/`。

| 维度 | 路由数 | 状态（自动化） | 证据目录模板 |
|------|--------|----------------|----------------|
| 静态列表 / 工具 / 社区监管 / 媒体等 | **45** | **PASS** | `evidence/93-batch-admin-domain/<run_id>/` |
| 占位详情 + 合规 events/update 写壳 | **12** | **PASS** | 同上 |
| 无 Cookie `/admin/orders` | 权限 | **PASS** | 同上 |
| `/admin/orders/not-a-uuid` | 错误态 | **PASS** | 同上 |

**TT-L4**：`describe` 名含 **`@e2e-sepolia-deferred`**，**不**进入 `chromium-sepolia`。

**整批复跑**：`cd frontend && npx playwright test e2e/93-matrix-admin-domain-batch.spec.ts --project=chromium`  
**分块**：`-g "static hub"`（约 3min+）｜`-g "detail"`（约 1min+）｜`-g "permission|invalid"`

**下一批（深功能余量）**：Admin **真实写操作**（审批 `…/approve`、flags `publish`、scheduler rerun）、列表 **空态（真管理员 JWT + 零数据）**、**RBAC 扩展矩阵**（`super_admin` 边界、逐资源 403）、**对账 POST 体** 与投影读回 — 见下 **`93-ADMIN-DEEP`** 的 **FAIL/SKIP 留证** 与 `evidence/93-batch-admin-deep-audit/inventory.md`。

### 本批 · Admin 深写 / RBAC / 订单消息（`93-ADMIN-DEEP`）

**目标**：停止扩 **admin 静态壳**；收敛 **RBAC 403**、**`/escrow/[id]` 订单消息** API+UI 对拍、可选 **`PLAYWRIGHT_ADMIN_BEARER`** 的 Admin 列表字段壳；证据落 `evidence/93-batch-admin-deep-audit/<run_id>/`。

**机读盘点**：`python scripts/dev/inventory_admin_deep_audit.py --write evidence/93-batch-admin-deep-audit/inventory-surface.generated.md`

| 主题 | 93 / 说明 | 状态（自动化） | 证据 |
|------|-----------|----------------|------|
| 未登录 / 游客 / 向导 `GET …/admin/users` | D-ADM-002 API 边界 | **PASS**（`chain_off` 挂载时 401/403；未挂载 **SKIP**） | `rbac-*.json` |
| 游客 `/admin/orders` UI `admin_required` | D-ADM-002 UI | **PASS**（同上） | `admin-orders-403-tourist.png` |
| `POST+GET …/orders/:id/messages` + UI 再读 | B-MSG-002 | **PASS**（须 `chain_off`） | `escrow-messages-*.json`、`escrow-messages-ui.png` |
| `PLAYWRIGHT_ADMIN_BEARER` → `GET …/admin/orders` | Admin API 字段壳 | **PASS**（有 Bearer）/ **SKIP**（无 Bearer） | `admin-bearer-orders.json` |
| `admin` vs `super_admin`（403 / 真写） | RBAC 细分 + 调度器 rerun | **PASS**（env 齐）/ **SKIP**（缺 admin-only Bearer 或非 admin 角色等） | `rbac-admin-vs-super-scheduler-rerun.json`、`super-admin-scheduler-rerun.json` |
| 向导 PATCH、空态 UI、`GET …/cross-check`、`POST indexer-reconcile`→`GET reconcile-report` | 真写 + 空态 + 对账闭环 | **PASS**（条件满足）/ **SKIP**（缺 Bearer、链/库、前端未起） | `admin-write-*.json`、`admin-orders-empty-filter-*`、`admin-cross-check.json`、`reconcile-*.json`、`target-*.json`、`report.json` → **`target_matrix`** |

**TT-L4**：`describe` 名含 **`@e2e-sepolia-deferred`**。

**整批复跑**：`cd frontend && npx playwright test e2e/93-matrix-admin-deep-batch.spec.ts --project=chromium`

### 仍为 NOT RUN / N/A（下一批建议）

| 优先级 | 路由 | 说明 | 建议状态 |
|--------|------|------|----------|
| P0 | `/governance/distribution-claim` | C-GOV-010 钱包写交易 | **N/A**（CI）/ **MANUAL-P1**（Sepolia+钱包） |
| P1 | `/escrow/[id]` 内 **订单消息** 发送再读 | B-MSG-002 深链 | **PASS**（`93-ADMIN-DEEP` + `chain_off`）/ **SKIP**（无 `chain_off`） |
| P2 | `/guide` **档期/接单**写路径 | 向导后台深链 | **NOT RUN**（部分见 `smoke.spec` / B-467 族） |
| P2 | **Admin** 写路径、空态（真管理员）、对账 POST→GET、RBAC 细分 | **`93-ADMIN-DEEP`** 本 spec + `target_matrix` | **PASS / SKIP**（见 `evidence/93-batch-admin-deep-audit/README.md` env 矩阵）；全路由逐字段对拍仍属扩展项 |

---

## 用例全量索引（便于对表 93 正文）

下列 ID 与 **93 v1.4.0** 正文表格一致；**93 改版后**请运行：

`python scripts/dev/extract_93_case_inventory.py > /tmp/93-inventory.tsv`

与上表 **diff** 以更新本文件批次边界。

### A 域 §1

`A-ENV-001` `A-REG-001` `A-LOG-001` `A-LOG-002` `A-LOG-003` `A-LOG-004` `A-ME-001` `A-ME-002` `A-ME-003` `A-PWD-001` `A-EM-001` `A-EM-002` `A-NEG-001` `A-NEG-002`

### B 域 §2

`B-MKT-001` `B-MKT-002` `B-MKT-003` `B-GDE-001` `B-GDE-002` `B-GDE-003` `B-ORD-001` `B-ORD-002` `B-ORD-003` `B-ORD-004` `B-ORD-005` `B-ORD-006` `B-MSG-001` `B-MSG-002` `B-MSG-003` `B-ESC-001` `B-ESC-002` `B-ESC-003` `B-ESC-004` `B-ESC-005` `B-DSP-001` `B-DSP-002` `B-DSP-003` `B-TRN-001` `B-TRN-002` `B-TRN-003` `B-NEG-001` `B-NEG-002` `B-NEG-003`

### C 域 §3

`C-GOV-001` `C-GOV-002` `C-GOV-003` `C-GOV-004` `C-GOV-005` `C-GOV-006` `C-GOV-007` `C-GOV-008` `C-GOV-009` `C-GOV-010` `C-GOV-011` `C-STK-001` `C-NEG-001`

### D 域 §4

`D-COM-001` `D-COM-002` `D-COM-003` `D-COM-004` `D-COM-005` `D-COM-006` `D-COM-007` `D-DSP-UI-001` `D-DSP-UI-002` `D-DID-001` `D-DID-002` `D-STA-001` `D-ITN-001` `D-NET-001` `D-ADM-001` `D-ADM-002`

---

## 与 AI 任务卡（TT）的关系

- **本表的「批次 ID」** 用于 **工单 / 周会 / Cursor 对话**（例：「本周关闭 **93-B-ORD-FLOW**」）。  
- 需要落 **母表 B-xxx → TT-xxx** 时：**每个批次** 开 **一张** TT 即可（正文引用本表行 + 证据目录），**不要**为 93 的每一行单独开 TT（除非单条风险极高）。  
- **新 TT** 仍须遵守 **[AI任务卡索引](../AI任务卡索引.md)** 开卡规则；**优先**登记在 **`AI任务卡索引.from-stash.md`** 直至封口再入主索引。

---

## 文档维护

- **93** 升版：跑 **`extract_93_case_inventory.py`**，更新上表 **「覆盖用例 ID」** 与 **§用例全量索引** 如有差异。  
- **R-002 §4** 升版：每批执行后在映射表补 **「已有自动化 / 仍 MANUAL」** 一行，避免 93 与代码双源漂移。
