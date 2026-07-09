# TT-LOCAL-CONVERGENCE-PHASE-AD-001 · 本地全收敛（96-20 Phase A→D + 可复现命令）

**Version:** 0.1.11  
**Status:** Runbook — **① 本地**「先把能机读的跑绿，再系统收 UI/数据对齐」；**§3.24** 写 **用户主路径建议顺序** 与 **真数据 / 调试保留**；**§3.25** 写 **用户使用 · 数据互通** 类缺口 **索引速查**（**不**复制 **96-18/96-20** 长表）；**不**替代 **[04](../spec/04-后端与API.md)**、**[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** 正文，**不**冒充 **② 测试网** / **③ 生产**。  
**仓库路径：** `docs/runbook/TT-LOCAL-CONVERGENCE-PHASE-AD-001.md`

---

## 0. 你为什么需要单独这一页

团队反馈：**本地起全栈后，很多 UI 与数据不对齐、路径不通、展示不准**。仓库里**已有**总序（**[TT-9621](TT-9621-master-order-96-backend-db-chain-frontend.md)** 与 **[96-20 §0.1](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**），本页把 **「先做什么、再打开浏览器」** 压成 **一张对照表 + 一组可复制命令**，并把 **Phase D（前端）** 的**最小排查法**写死，避免：

- **先大范围改 UI**，而后端仍是 **501 / `chain_off` 未挂载 / 投影未接线** → 高返工（见 **96-20 §0.1** 表后说明）。
- 把 **「本地不对齐」** 误当成 **「上测试网就会好」** → 与 **[TT-9627 §0.a](TT-9627-delivery-order-spine-then-full-site.md)** **无 mock、无假环境写死** 叠读时容易跳阶。

**读者预期（覆盖边界）：** 本页**不**宣称「每路由、每弹窗、每角色已穷举」；与 **[TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)**、**[93 §8.0](../spec/93-全站功能验证矩阵-域别回归清单.md)** 同键。

**给 AI 的一页提示（术语 + 可复制任务句）：** **[TT-LOCAL-AI-AGENT-BRIEF-001](TT-LOCAL-AI-AGENT-BRIEF-001.md)**（与本页 **§3～§4** 同轮使用）。

---

## 1. Phase A→D 与「本地跑通」的对应关系（与 96-20 同序）

| Phase | 目标（本地） | 典型症状未闭时 |
|-------|----------------|----------------|
| **A · 后端契约** | **04 §3.4** 与 `crates/api` 一致；核心路径非 **not_impl** 糊用户 | 某页一点就 **501**、JSON 与 **04** 字段对不上 |
| **B · DB / 投影** | **Docker Postgres** + **`sqlx migrate`**；与本仓迁移一致 | 列表空、状态永远草稿、Admin 查询报错 |
| **C · 链 / `chain_off` / `/meta`** | **`GET /meta`** 与 env 不互斥；若要创单/托管链逻辑，**`chain_off` 挂载**或 **显式**走 **04** 允许的占位语义 | 创单直接 **503/501**；`data_source` 与 UI 叙事打架 |
| **D · 前端对齐** | **96-20 §5** 相关行：从「待核验」→ **PASS** 须满足 **[96-20 §0.2](../spec/96-20-前后端页面对齐与UI生产级审计报告.md#96-20-pending-to-pass)** | 组件仍读死数据、或 API 路径与 **`frontend/lib/api.ts`** 不一致 |

**硬句（摘自 96-20 总序）：** **Phase A～C 未完成前**，允许维护 **§5 盘点**，但 **不应** 把 **视觉精修** 当主优先级 —— 见 **96-20 §0.1** 表后「执行要点」。

---

## 2. 环境地基（① · 每次开干前 5 分钟）

1. **Postgres（推荐）**  
   - 仓库根：`docker compose up -d`（见根 **`docker-compose.yml`** 头注释）。  
   - **`DATABASE_URL`（示例）：** `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`

2. **API**  
   - **`PORT`** 与 **`BASE` / `NEXT_PUBLIC_API_BASE_URL`** 一致（全栈常见 **API 8080 + Next 3012**，见根 **`.env.example`** 头注释）。

3. **人类可读联调入口**  
   - **[测试账号与本地联调](../测试账号与本地联调.md)**（账号、顺序、常见坑）。

4. **Windows 一键栈 UTF-8 / Docker**  
   - **[TT-WINDOWS](TT-WINDOWS-LOCAL-STACK-ENV-001.md)**（与 **TT-9627 §0.a** 互指）。

---

## 3. 机读「本地跑通」命令块（按优先级自上而下）

> 均在**仓库根**执行；**阶次：①**。**CI 欠费**时与 **[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)**、**[CONTRIBUTING · pre-push-local](../../CONTRIBUTING.md#pre-push-local)** 叠读。

### 3.0 **懒人一键（可选）与 handbook 机读（范围触发）**

**目的：** **GitHub Actions 不可用** 时，用**一条命令**尽量贴近「合并前本地集」；**不替代** 下文 **§3.1～** 的**按改动裁剪**与排障细分。

**（A）编排脚本（二选一或先后跑；详见各脚本头注释）**

```bash
# 偏「开发前预检」：strict 相关顺序见脚本内说明
bash scripts/dev-preflight.sh

# 偏「交付最小竖切 / ci-local 同源」；若本轮改了 AI 任务卡索引一览，勿设 SKIP_AI_*
unset SKIP_AI_TASK_CARD_INDEX_OVERVIEW CI_LOCAL_SKIP_AI_TASK_CARD_INDEX
bash scripts/gates/ci-local-delivery-minimum.sh

# 偏「真栈 + TT-9621 竖切 01 + 可选 P0 spine」：须 Docker（Postgres）+ 本机 Rust/Node；与测试网同 DATABASE_URL 形态，禁止 mock 顶真栈
# bash scripts/gates/local-tt9621-p0-stack-one-shot.sh
# LOCAL_TT9621_RUN_P0_E2E=1 bash scripts/gates/local-tt9621-p0-stack-one-shot.sh
# 编排内固定 API PORT=8080（勿让终端继承 PORT=3012 致 wait-for-api 假超时）；P3_CHAIN_OFF / NEXT_PUBLIC_* 仍以根 .env 为准，与预发·测试网同形变量见 .env.example（BB2）
```

**与 §3.1 起的关系：** **`dev-preflight`** / **`ci-local-delivery-minimum`** 内部会串或多路覆盖 **cargo**、**04 路由**、**registry**、**AI 索引一览** 等子集；**某一环红**时，再回到 **§3.1～§3.4**（或 **§3.7** 全量 env）**对照 stderr 逐条修**，勿盲设 **`SKIP_*`**（与 **[CONTRIBUTING](../../CONTRIBUTING.md)** **`maybe-run-ai-task-card-index-overview`** 段同键）。

**（B）`docs/handbook/` 机读（仅当本轮 diff 触达时必跑）**

```bash
bash scripts/check-handbook-frontmatter.sh
bash scripts/check-handbook-engineering-content.sh
```

| 何时跑 | 脚本 |
|--------|------|
| 动过 **`docs/handbook/`** 下 **规范头 / frontmatter** | **`check-handbook-frontmatter.sh`** |
| 动过 **`docs/handbook/engineering/`**（**`NN-*.md`（NN≥10）**、**`EVIDENCE-*`**、大量 spec 外链等） | **`check-handbook-engineering-content.sh`** |

与 **solo-dev-rhythm §6.5** 第 **2～3** 条同源；**未触达 handbook 树** 时不必每轮跑。

### 3.1 Phase A — 后端默认子集

```bash
cargo test -p traveltrust-api
```

### 3.2 Phase A — 04 / 13-1 路由与文档锚（须 Python 3）

```bash
bash scripts/run-check-04-routes.sh
```

### 3.3 B-421（Runbook ↔ go-live 互指机读）

```bash
bash scripts/check-runbook-golive-doclink-gate.sh
```

### 3.4 Registry（仅当本轮动到 `docs/spec` 硬编码路径或 `registry/*.yaml` 时必跑；日常可快扫）

```bash
python registry/validate-spec-path-dependencies-registry.py
```

### 3.5 Phase B + 段 3 窄切片 — strict ISS-007 + `e2e_core`（须 **DATABASE_URL**）

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export P3_CHAIN_OFF=1
export TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR=evidence/GO_20260501_tt9627_strict_r002
bash scripts/gates/local-verify-r002-prereport-chain.sh
python scripts/validate-regression-report.py \
  evidence/GO_20260501_tt9627_strict_r002/r002_iss007_prereport/report.json \
  --fail-on-no-go --fail-on-case-not-run
```

**说明：** ISS-007 报告 **`release_gate` 常为 `PARTIAL_GO`**（设计如此）；**勿**用 **`--require-go`** 冒充 **staging 全矩阵 GO** —— **`evidence/GO_local_r002_verify/README.md`**、**[TT-9628 §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)**。

### 3.6 准入费 / Onboarding PG 矩阵（若在 scope；须 **DATABASE_URL**）

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export INTERNAL_API_SECRET=
bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
```

**互指：** **[TT-9618](TT-9618-onboarding-local-testnet.md)**。

### 3.7 API 已监听时 — TT-9627 段 1～2 竖切 + 段 4～6 文件在位 + `ci-local` 编排

```bash
export BASE=http://127.0.0.1:8080
unset SKIP_AI_TASK_CARD_INDEX_OVERVIEW CI_LOCAL_SKIP_AI_TASK_CARD_INDEX
export TT9627_SEGMENT456_SPEC_PRESENCE=1
export TT9627_SEGMENT1_API_SMOKE=1 TT9627_SEGMENT2_API_SMOKE=1
export TT9627_SEGMENT3_R002_VALIDATE=1
export REPORT_JSON=evidence/GO_20260501_tt9627_strict_r002/r002_iss007_prereport/report.json
bash scripts/gates/ci-local-delivery-minimum.sh
```

**若本轮改动了 `docs/AI任务卡索引.md` 或 `docs/AI任务卡索引.from-stash.md`：** **勿** 设 `SKIP_AI_*`，上列 `ci-local` 会自动串 **一览机读**（与 **`maybe-run-ai-task-card-index-overview-on-diff.sh`** 同源）。

### 3.8 窄域 `report.json` 辅助指针（非 93 全矩阵）

```bash
python scripts/validate-regression-report.py \
  frontend/evidence/GO_20260426_local_final_truth/report.json --fail-on-no-go
bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh \
  frontend/evidence/GO_20260426_local_final_truth/report.json
```

### 3.9 前端 Next（开发服 · 依赖 · 与根目录 API 对齐）

**前置：** **Node ≥ 18**（见 **`frontend/package.json` `engines`**）。

**（1）把根目录 API 端口写入前端本地 env（推荐每次改 `PORT` 后执行）** — 仓库根：

```bash
bash scripts/dev/sync-frontend-env-local-from-root.sh
# Windows: powershell -File scripts/dev/sync-frontend-env-local-from-root.ps1
```

**（2）安装依赖并起开发服（默认 `http://127.0.0.1:3012`）**

```bash
cd frontend
npm ci
npm run dev
```

**（3）单元测试（Vitest）**

```bash
cd frontend
npm run test
```

**（3a）TypeScript 全量检查（含 `**/*.test.ts(x)`；与根目录 [CONTRIBUTING](../../CONTRIBUTING.md#pre-push-local) `npx tsc --noEmit` 同源）**

```bash
cd frontend
npx tsc --noEmit
```

**常见红因：** 测试里用 **`beforeAll` / `afterAll`** 时须 **`import { … } from "vitest"`**（勿依赖未声明的 Jest 式全局）；业务类型（如 **`LocaleInterpolationVars`**）须与 **`String(…)` 实际可接受的值**一致。

**（3b）ESLint（`next lint`；与 [CONTRIBUTING](../../CONTRIBUTING.md#pre-push-local) `npm run lint` 同源）**

```bash
cd frontend
npm run lint
```

**说明：** 当前主分支上 **`exit 0`** 仍可出现 **`react-hooks/exhaustive-deps`**、**`@next/next/no-img-element`** 等 **warning**（不挡合并脚本，但宜排期收敛）；终端若提示 **Next 16 将移除 `next lint`**，可按官方 codemod 迁到 **ESLint CLI**。

**（4）生产构建烟测（较重；CI / 发版前或改 `next.config` / 路由大改时跑）**

```bash
cd frontend
npm run build
```

**（5）Playwright E2E（须已安装浏览器；首装见下行）**

```bash
cd frontend
npx playwright install
npm run e2e
```

**链上 Chromium E2E 子集（可选）：** `npm run e2e:sepolia`（须按脚本内 env；**不**冒充 **①** 默认全绿）。

**与 Phase D 关系：** 浏览器里点的路径若仍错，回到 **§4** 做 **`apiUrl` 追踪**；**§3.9** 只保证「前端工程能编译/测/跑」。

---

### 3.10 智能合约 · Foundry（编译 + 单测）

**前置：** 已安装 **Foundry**（`forge` / `anvil` 在 `PATH`）。

```bash
cd contracts
forge build
forge test
```

**依赖：** 若 `forge build` 报缺 `forge-std`，按 **`contracts/README.md`** 或 **`scripts/README.md`** 完成 **`forge install`** 后再跑。

**真源互指：** **`contracts/README.md`**、**[14 §1.1](../spec/14-合约-API-ABI-前后端对齐.md)**、**[ops/RUNBOOK.md §2.56](../../ops/RUNBOOK.md)**（Anvil→测试网→主网换部署核对）。

---

### 3.11 本地链 Anvil + 部署 + API env（Phase C ·「有链」路径）

> 与 **[04](../spec/04-后端与API.md)** **mock-pay / `P3_CHAIN_OFF` / 本地链** 段落叠读：**有本地链时** 优先走 **真实 `createEscrow` → deposit → …`**，**不要**与 **`P3_CHAIN_OFF=1` 纯 mock** 混叙事。

**（1）终端 A — 启 Anvil**

```bash
anvil
```

**（2）终端 B — 部署（示例；脚本以仓库为准）**

```bash
cd contracts
export CHAIN_RPC_URL=http://127.0.0.1:8545
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/Deploy.s.sol --rpc-url "$CHAIN_RPC_URL" --broadcast
```

**（3）把控制台打印的合约地址写入根目录 `.env`**（与 **`.env.example`** 中 **`CHAIN_ID` / `CHAIN_RPC_URL` / `ESCROW_FACTORY_ADDRESS` / `FEE_ROUTER_ADDRESS` / `NEXT_PUBLIC_*`** 等同名键对齐；**FeeRouter 同址三处** 见 **`ops/RUNBOOK.md`** 运维表）。

**（4）重启 API**，再验 **`GET /meta`** 与 UI 是否仍互斥。

**治理全栈（Votes + Governor + Timelock · TTG）**：**不要**默认跑整包 **`Deploy.s.sol --broadcast`** 当已存在 Timelock 时 —— 见 **`contracts/README.md`** **`DeployGovernanceStack` / `DeployFundStackUnderTimelock`** 与 **[TT-B435](TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)**。

---

### 3.12 索引器 · `internal/indexer-tick`（可选 · 须 DB + 链配置 + 内网 secret）

**前置：** **`DATABASE_URL`**、链 env 已按 **§3.11** 或 **测试网** 配好；**`INTERNAL_API_SECRET`** 非空（见 **`.env.example`** 与 **04 §7.6**）。

**最小烟测（仓库根；勿把 internal 暴露公网）：**

```bash
export BASE=http://127.0.0.1:8080
curl -sS -X POST "$BASE/api/v1/internal/indexer-tick" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Secret: $INTERNAL_API_SECRET" \
  -d '{}' | head -c 2000; echo
```

**运维真源与证据链：** **`ops/RUNBOOK.md`**（**`indexer-tick` / reorg / revenue 跑流** 等）、**[Epic-D-indexer-ops-readonly-ladder.md](Epic-D-indexer-ops-readonly-ladder.md)**。

---

### 3.13 治理币 / 治理 UI / 投票全链路（独立竖切 · 非 §3.1 默认子集）

**机读默认子集**（**§3.1**）**不**包含「新建治理代币 + Governor UI 手点闭环」。若本轮 **scope** 要求 **治理域本地可演示**，须另开任务并按：

- **[TT-9627 §0.b](TT-9627-delivery-order-spine-then-full-site.md)**（**②** 专项表；**①** 上 Anvil+部署可部分复用）  
- **[82-治理币-文档总览](../spec/82-治理币-文档总览.md)**、**[governance-token/02](../spec/governance-token/02-对内技术规格-草案.md) §1.3**  
- **`contracts/README.md`** **`DeployGovernanceStack`** 段  
- 证据示例：**`evidence/b417_governance_execution_runs/README.md`**

---

### 3.14 异步 · Stripe Webhook · 邮件 / 通知（范围触发）

**默认不跑：** 依赖 **Stripe CLI / 公网回调隧道 / SMTP** 时按 **[TT-9618](TT-9618-onboarding-local-testnet.md)**、**[96-09](../spec/96-09-消息通知与异步任务.md)** 单列环境；与 **§3.6** PG 矩阵（**链下 webhook 镜像**）叠读。

---

### 3.15 对象存储 / 头像上传等（若功能触达）

仓库根 **`docker-compose.yml` 默认仅 Postgres**；若你本地另有 **MinIO / S3 兼容** 栈，按 **`.env.example`** 与 **`04`** 中 **存储 / 预签名上传** 相关键配置后再验 **Me / 头像** 路径。

---

### 3.16 `STRICT_SSOT=1` / `CHECK_SSOT=1`（可选加重闸）

启用前在仓库根执行预检（见 **`.env.example`** 头注释）：

```bash
bash scripts/dev/check-strict-ssot-local-prereqs.sh
# Windows: powershell -File scripts/dev/check-strict-ssot-local-prereqs.ps1
```

未通过前 **勿** 盲开 **`STRICT_SSOT=1`**，否则 API 会拒绝启动。

---

### 3.17 裁剪原则（与 solo / CONTRIBUTING 同源）

**不必**每轮迭代把 **§3.0～§3.25** 全跑满：可先 **§3.0（A）** 一键再按需展开 **§3.1～**；**handbook** 子集见 **§3.0（B）**。**用户路径与真数据** 以 **§3.24** 为叙述、**§3.25** 为 **业务/互通缺口索引**，可与 **§4** 同轮对读。其余按 **[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)**、**[CONTRIBUTING · pre-push-local](../../CONTRIBUTING.md#pre-push-local)** **按改动类型裁剪**。

---

### 3.18 动态「未完成 / Partial / Target」真源（须与 §3 机读并行打开）

本 **§3** 解决 **「命令跑绿」**；**不**自动等价 **「产品缺口已清零」**。以下台账 **随合并而变**，收口前请 **每次** 对读本轮是否触达：

| 真源 | 用途 |
|------|------|
| **[96-18-未完成清单与多维检查](../spec/96-18-未完成清单与多维检查.md)**（**`#9618-one-page-priority`**、**§0 P0/P1/P2**、**§2 表**） | **准入费 / webhook / 96-09 队列 / Admin / 链上** 等 **Partial→Target** 诚实 backlog；**P0** 行未闭前 **勿** 宣称生产收单 / 生产 webhook |
| **[缺口与待补-官方总表](../spec/缺口与待补-官方总表.md)** | **P0 十二项**、独立开发期口径；与 **go-live** 并联 |
| **`contracts/README.md` ·「实现状态」表** | **FeeRouter / RegionVault / InvestorDistributionClaim** 等 **Partial（MVP）** 与 **链上证据** 要求；**治理全栈** 见同文 **「治理栈」** 与 **`DeployGovernanceStack`** |
| **`ops/RUNBOOK.md`**（**§2.56**、**indexer-tick**、**FeeRouter 同址**） | **Anvil→测试网→主网** 换部署核对；索引与对账 **运维** 真值 |
| **`crates/api/src/routes/mod.rs`** **`not_impl_json` / 503 `chain_off`** | **501** = **04** 允许占位或未接线；**503** = **`chain_off` 未挂载** — UI「全绿」前须先判 **Phase C** |

**前端显式占位组件（示例）：** **`TravelTrustAllocationPlaceholder`**（`frontend/components/traveltrust/`）— 与 **96-20**「待核验→PASS」叠读时，**勿**标 **PASS** 除非已换真实数据或 **N/A 一句**。

---

### 3.19 **[96-18-未完成](../spec/96-18-未完成清单与多维检查.md)** · P0 / P1 / P2 → **① 本地**能做什么

> **全文真源**仍以 **96-18-未完成** 为准；下表仅为 **「打开台账时，本地可并行跑的命令」** 索引。

#### 3.19.1 §0 **P0**（生产收单 / 生产 webhook / 真合规叙事）

| 台账要点 | **① 本地**建议动作 | **不能**仅靠本地冒充已闭 |
|----------|---------------------|---------------------------|
| **PSP / PCI / 3DS / SAQ** | 对齐 **04-附录**、**Stripe test** 密钥与 **`TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT`**（见 **`.env.example`**） | **生产 PSP / SAQ 签字** |
| **Webhook 生产硬闸（mTLS / PSP 签名校验）** | **`stripe listen` + `stripe trigger`**、**`ONBOARDING_WEBHOOK_HMAC_SECRET`**、**`ONBOARDING_WEBHOOK_MAX_AGE_SECS`**（**[TT-9618 §3.2](TT-9618-onboarding-local-testnet.md)**） | **边缘 mTLS / 公网 ingress 真配置** |
| **制裁真合规（OFAC 等）** | **`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** 子串拒服 + **PG 审计表**（**§3.6** 已覆盖矩阵子串） | **OFAC 名单工程化 / 法务书面** |
| **Stripe 公网 webhook PG·IT** | **`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（已含 **`005`→`017`→`014`→`016`** 等） | **公网 `whsec` 真回调** 仍须在 **②** 复验 |

#### 3.19.2 §0 **P1**（体验 / 运维 / 证据完整性）

| 台账要点 | **① 本地**命令或落点 |
|----------|----------------------|
| **409 / 429 FE 重试** | **`cd frontend && npm run test`**（**`lib/apiClient/onboarding`**、**`mapOrderWriteError`**）；**`npm run e2e`** 中带 **me-onboarding** 的 spec（见 **96-18 §1** 批次表） |
| **Runbook 最后一公里 curl** | **[TT-9618 §5](TT-9618-onboarding-local-testnet.md)** 卡片 + 本页 **§3.7** **`BASE`** 烟测 |
| **发版前至少一次 `npm run build`** | **§3.9（4）** |
| **限流 / uid 桶** | **`cargo test -p traveltrust-api`** 筛 **`onboarding`** / **`rate_limit`**（与 **96-18 §1** 已合矩阵对拍） |

#### 3.19.3 §0 **P2**（链 / 索引 / 队列 / 全站门禁）

| 台账要点 | **① 本地**命令或落点 |
|----------|----------------------|
| **链上 Receiver / 14 ABI / 55-S13** | **`cd contracts && forge test`**；动过 ABI 时 **`bash scripts/check-55-s13.sh`**（见 **[CONTRIBUTING](../../CONTRIBUTING.md)**、**缺口总表 P1-A**） |
| **96-09 队列 / worker / metrics / DLQ** | **§3.6**；**`onboarding-webhook-worker`** 进程按 **TT-9618 §3.6** 另终端起；**`promtool`** 见 **`tt-9618-onboarding-pg-evidence.sh`** 尾段提示 |
| **索引 / 对账 / revenue 跑流** | **§3.12**；**`ops/RUNBOOK.md`** **§12.5～12.6**、**[Epic-D](Epic-D-indexer-ops-readonly-ladder.md)**；可选 **`bash scripts/ops/b403-revenue-e2e-repeatable-runner.sh`**（须 **INTERNAL_API_SECRET** 等，见各自 Runbook） |
| **全站 `report.json` GO** | **§3.5 / §3.8**；**不**用窄切片冒充 staging — **TT-9628 §0.0.5** |

---

### 3.20 **[缺口与待补-官方总表 · P0 十二项](../spec/缺口与待补-官方总表.md)** — 与 **① 本地机读** 的关系

**硬句：** **P0 十二项** 主体为 **法务 / 产品 / 运维填表与签字**；**① 本地脚本不豁免** **☐/☑** 语义（见该文 **§独立开发期口径**）。

| P0 # | 待补项（摘要） | **① 本地**可做的辅助（非替代签字） |
|------|----------------|-------------------------------------|
| **1～5、8、12** | 08-4 / 08-2 / 00 核对等 | **机读**：**`bash scripts/gates/check-08-consistency.sh`**、**`bash scripts/check-governance-doc-linkage.sh`**（与 **缺口总表 · 按序核查流水** 序 9 同源）；**正文勾选仍须 Owner** |
| **6** | Runbook P0 九项联系人 | 打开 **`ops/RUNBOOK.md` §2** 对照本机 **evidence** 是否已填占位 |
| **7** | evidence / 08-2 Evidence 列 | 每轮本地收敛后在 **`evidence/GO_YYYYMMDD/README.md`** 写 **命令 + commit**（**§5**） |
| **9** | P26 可调通验收 | 按 **[27-P26 §二](../spec/27-archived/27-P26-实现记录.md)** 执行仓库内脚本（若本轮触达） |
| **10** | E2E 三项留痕 | **§3.9（5）** `npm run e2e`；或 **Playwright** 目标子集 + 日期写入 **evidence** |
| **11** | 资损 runbook 演练 | **`ops/RUNBOOK.md` §4** 桌面演练 + 登记截图/纪要（**无法**单测替代） |

**按序核查流水（机器部分）：** 见 **缺口总表** **「按序核查流水」**；与本页 **§3.2～§3.4、§3.12** 重叠处 **不重复跑** 除非 **触及该判据的 diff**（**TT-9627 §0.c**）。

---

### 3.21 **`contracts/README.md` ·「实现状态」Partial** — **① 本地**最小闭环

| 模块（示例） | **① 本地**动作 | 仍属 **Target / ②** 的部分 |
|--------------|----------------|-----------------------------|
| **Escrow / Factory / 双池 / Registry** | **`forge test`** + **§3.11** Anvil 部署 + API **`.env`** 填地址 | **测试网 evidence**、indexer 订阅 |
| **FeeRouter / RegionVault（MVP）** | 同上 + **`GET /meta`** 与 **`FEE_ROUTER_ADDRESS` / `NEXT_PUBLIC_*`** **同址**（**`ops/RUNBOOK.md`**） | **按国链上账本 / Snapshot** 等表内 **Target** |
| **InvestorDistributionClaim 等** | **`forge test`** | **链上运营填实** |
| **治理栈（Votes + Governor）** | **`DeployGovernanceStack`**（**`contracts/README.md`**）+ **§3.13** | **②** 演示与 **TT-9627 §0.b** 证据包 |

---

### 3.22 **治理文档机读（发版交叉闸辅助）**

```bash
bash scripts/check-governance-doc-linkage.sh
```

与 **缺口总表** 按序流水 **W-GATE**、**08-2 审查二** 机读辅助同源；**不**替代冲突矩阵填表。

---

### 3.23 **08 一致性机读（发版交叉闸辅助）**

```bash
bash scripts/gates/check-08-consistency.sh
# 或：bash scripts/check-08-consistency.sh
```

失败时先修 **08-2/08-3/08-4** 与代码互指，再重跑。

---

### 3.24 **用户主路径 · 业务与页面对齐 · 真数据（相对 §3「机读绿」的下一步）**

> **§3** 管 **「命令/契约/ABI 先绿」**；本节管 **「用户点得通、看见的是真值、占位不冒充已交付」**。阶次仍遵守 **① → ② → ③**（与篇首 blockquote、**[96-18-未完成 篇首](../spec/96-18-未完成清单与多维检查.md)** 同源）。

#### 3.24.1 **建议执行顺序（用户可感知「通畅」优先）**

按 **一轮迭代** 推荐 **自上而下** 做；前一步未 **PASS / 证据落盘** 前，**不**把后一步对外称「已闭」（与 **[TT-9627 §0.c](TT-9627-delivery-order-spine-then-full-site.md)** 同键）：

| 序 | 目标（用户/业务语言） | 典型落点 | 阶次 |
|----|-------------------------|----------|------|
| **1** | **准入费：浏览器里真付 → 状态变 paid（含 Stripe 回调）** | **②** staging + **Stripe test**；**[TT-9618 §3.2](TT-9618-onboarding-local-testnet.md)**、**[96-18-未完成 §0 P1](../spec/96-18-未完成清单与多维检查.md)**「Playwright（PG + webhook）」行 | **②**（**①** 上 **API·IT / shell mock** **不**冒充本条已验） |
| **2** | **链上已付与后台/索引一致** | **`OnboardingFeeReceiver`** 部署 + **`sqlx migrate`** + **`indexer-tick`** → **`onboarding_fee_paid_events`** 等行 + **证据**；**§3.12**、**[96-18-未完成 §2 P2 链上](../spec/96-18-未完成清单与多维检查.md)** | **①②** |
| **3** | **主脊页面数字与接口一致** | **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**：**待核验 → PASS** 须满足 **[§0.2](../spec/96-20-前后端页面对齐与UI生产级审计报告.md#96-20-pending-to-pass)**；与 **§4** 排查法同批 | **①②** |
| **4** | **异步队列 / Admin 财务（卡单、退款、拒付）** | **96-09**、**Admin webhook** 叙事见 **[96-18-未完成 §2](../spec/96-18-未完成清单与多维检查.md)**；**§3.6**、**`ops/RUNBOOK.md`** | **②③** |
| **5** | **发版与组织闭环** | **[缺口官方总表 · P0 十二项](../spec/缺口与待补-官方总表.md)**、**[go-live-checklist](../go-live-checklist.md)** | **③** |

**与主脊文档叠读：** **[TT-9625](TT-9625-golden-path-system-spine.md)**（注册→`/meta`→市场→创单→托管）。

#### 3.24.2 **业务逻辑与页面对齐（不要「UI 绿、数据假」）**

- **单一真源：** 列表/详情/金额/状态 **以 API 响应 + `GET /meta` 链字段** 为准；**04 §3.4** 路径与 **`frontend/lib/api.ts`** 常量须一致（**§4** 逐步）。  
- **PASS 门槛：** **[96-20 §0.2](../spec/96-20-前后端页面对齐与UI生产级审计报告.md#96-20-pending-to-pass)** — 无未解释的硬编码主数字、错误分支有 **机读文案**、**`data_source`/`X-Implementation-Status`** 与 UI 叙事不打架。  
- **Phase 纪律：** **Phase A～C** 未闭时，**96-20** 行写 **BLOCKED** 或 **N/A（一句）**，**勿**标 **PASS**（与 **§1** 表、**96-20 §0.1** 同句）。

#### 3.24.3 **展示用真实数据；仅保留「可辨认的」调试辅助**

**目标口径（用户可见主路径）：**

- **默认**用 **PG / 链上投影 / `chain_off` 成功分支** 返回的字段渲染；**不**用 **静态 mock 列表、写死统计、占位图** 充当「已接 API」的主展示。  
- **显式占位组件**（例：**`TravelTrustAllocationPlaceholder`**）在 **96-20** 中 **未** 换真实数据或未写 **N/A 一句** 前，**不得**标 **PASS**（与 **§3.18** 同键）。  
- **升级展示：** 优先把 **金额分解、状态徽标、空态** 接到 **已有 API**；缺 API 时 **先开契约与后端**，**不**长期用假数据撑 UI。

**允许保留的调试/辅助（须与用户路径隔离）：**

- **环境闸：** **`P3_CHAIN_OFF=1`** 下 **`POST …/orders/:id/mock-pay`** 等 **仅开发/联调**（见 **`orders/mutations.rs` hint**）；**不**写入「用户生产路径已通畅」叙事。  
- **运维/管理：** **`INTERNAL_API_SECRET`** 下 **internal**、**Admin** 诊断字段、**`/metrics`**、**Runbook curl**（**§3.12**）。  
- **前端可选：** **dev-only** 面板、**query 参数** 启用的诊断条、**非生产** build 中折叠的 **「原始 JSON」** —— **须** **默认关闭** 或 **明显标注调试**，避免与普通用户界面混淆。

**禁止假完成：** **①** 本地全绿 + 页面「好看」**不**等价 **②** 测试网真实 Stripe/真实回调已验、**③** 生产 —— 与 **[CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9628 §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)** 同读。

---

### 3.25 **用户使用 · 数据互通 — 缺口速查（索引 · 非长表真源）**

> **用途：** 排 **「用户能感到的业务 / 多系统数据是否对齐」** 时，按类扫一眼 **该补环境、补链、补索引还是补 96-20 行**。**细节与勾选**仍以 **[96-18-未完成](../spec/96-18-未完成清单与多维检查.md)**、**[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**、**[缺口官方总表](../spec/缺口与待补-官方总表.md)**、**[TT-9625](TT-9625-golden-path-system-spine.md)** 为准；本表 **不** 替代上述正文。

#### 3.25.1 链与配置互通

| 用户侧表现 | 常见根因 / 互查 |
|------------|-----------------|
| 点了没反应 **503/501**、与 **`/meta`** 叙事矛盾 | **`chain_off` 未挂**、env 互斥 → **§1 Phase C**、**§4** |
| 链上操作 **revert**、地址「对不上」 | **`/meta` ↔ `.env` ↔ `NEXT_PUBLIC_*`**；**`ops/RUNBOOK.md`**、**`bash scripts/check-55-s13.sh`** |
| 链已变、列表/详情仍旧 | **索引 / 投影** 未 tick → **§3.12**、**Runbook §12.5**、**Epic-D** |
| 开发「付了」、生产路径未走通 | **`mock-pay`** 仅 **`P3_CHAIN_OFF`** → **§3.24.3** |

#### 3.25.2 钱与准入（商家/主理人）

| 用户侧表现 | 常见根因 / 互查 |
|------------|-----------------|
| staging **Elements 真付** 与 **paid** 仍断 | **②** **Stripe 公网 webhook**、**[TT-9618 §3.2](TT-9618-onboarding-local-testnet.md)**；**96-18-未完成 §2 P1** |
| 「能收测试款」≠ 合规已闭 | **96-18 §0 P0**（PSP/3DS/SAQ、mTLS、制裁真身） |
| 已付迟迟不变更 | **96-09 队列 / DLQ** → **96-18 §2 P2**、**TT-9618 §3.6** |
| 后台退款与财务账不一致 | **Admin webhook vs 96-08 总账** → **96-18 §2 Admin**、**缺口总表 P1** |

#### 3.25.3 页面与接口（业务 ↔ 展示）

| 用户侧表现 | 常见根因 / 互查 |
|------------|-----------------|
| UI 好看但数字/状态不对 | **96-20** 未 **PASS**、仍 **mock/占位** → **§0.2**、**§3.24.2～§3.24.3**、**§4** |
| 排行「逻辑不公平」 | **DID 附录 §3.1** 加权仍 **Target**；**副榜真排序** **② D1** → **[04-附录 §3.2](../spec/04-附录-did-rank对接说明.md)**、**[30 §7.2](../spec/30-DID排行榜-页面规范.md)** | **缺口总表**、**04-附录-did-rank** |
| 切语言仍露中文 | **i18n 硬编码** → **缺口总表** 按序流水 **步 6**、**30** |
| 社区能力与预期差 | **31 / 社区扩展** → **缺口总表 P1** |

#### 3.25.4 跨子系统数据（证据 · 订单 · 双写）

| 用户侧表现 | 常见根因 / 互查 |
|------------|-----------------|
| 举证/证据不可用 | **无 `chain_off`** 时证据 **GET 501** → **`routes/evidence.rs`**、**Runbook §12.1**、**缺口总表 P1 证据 API** |
| DB/链/投影不一致行为不清 | **`DUAL_WRITE_FAILURE_POLICY`**、生产勾选 → **Runbook §9**、**08-3** |
| 列表与详情 **图/金额/托管地址** 不一致 | **56 / discover** → **缺口总表** 按序流水 **步 5**、**04** |
| 个别写路径 **501 not_implemented** | **04 §三** 占位或未接线 → **`main.rs` 注释**、**§3.18** |

#### 3.25.5 扩展域与「全站已做完」宣称

| 主题 | 互查 |
|------|------|
| **旅行收购 / 评分 / 子站** | **96-18 §2A**、**94**、**96-19**、**缺口总表**「关联指针」行 |
| **单域 GO ≠ 全站矩阵** | **TT-9628 覆盖边界**、**93 §8.0**、**R-002** |

---

## 4. Phase D — UI / 数据「不对齐」时的最小排查（本地）

按 **[96-20 §0.2](../spec/96-20-前后端页面对齐与UI生产级审计报告.md#96-20-pending-to-pass)**，把每一张问题页从 **URL** 追到 **数据入口**：

1. **定页面路径** → 在 **`frontend/app/**/page.tsx`** 找到路由组件。  
2. **找 `apiUrl(` / `routes.` 常量** → 与 **`frontend/lib/api.ts`**、**04 §3.4** 对拍（禁止「前端写死另一套 path」）。  
3. **向下进 `components/**`** → 是否存在 **mock 列表 / 占位统计** 充当主展示（与 **§3.24.3** 真数据口径冲突）；失败分支可保留 **明确空态/错误态**，**不**用假成功数据掩盖 **4xx/5xx**（与 **04** 中 **`data_source` / `X-Implementation-Status`** 语义对读）。  
4. **网络面板** → 对照 **`GET /meta`**：链字段与当前 env 是否互斥（**Phase C** 未闭时，**Phase D** 结论只能写 **BLOCKED** 或 **N/A（一句）**，勿标 PASS）。  
5. **E2E** → 若有覆盖，写 **`frontend/e2e/*.spec.ts` 名**；否则 **N/A + 风险**（与 **[130 §四～§五](../spec/130-阶段开发测试体系.md)** 一致）。

**常见根因速查（与 TT-9621 §3.1 同族）：**

- **`chain_off` 未挂载** → 创单等写路径 **`not_impl`** —— 先收 **Phase C**，再要求 UI「能下单」。  
- **`P3_CHAIN_OFF=1` mock-pay** vs 本地 Anvil 真链 —— 见 **04** 中 **mock-pay** 与 **本地链**段落，**勿**混用叙事；**mock-pay 仅调试辅助**，用户主路径与 **业务/互通缺口索引** 见 **§3.24～§3.25**。

---

## 5. 「完成即标记」（①）

第一次 **Phase A→D 中某条判据** 在本机 **PASS** 时，请当场留下 **日期 + commit + 命令 + 产物路径**（与 **[TT-9627 §0.c](TT-9627-delivery-order-spine-then-full-site.md)** 同键）。**推荐证据目录前缀：** `evidence/GO_YYYYMMDD_…/README.md`（与 **solo-dev-rhythm §3** 命名约定一致）。

**本仓库已有一组示例证据（可互指）：** `evidence/GO_20260501_tt9627_strict_r002/README.md`、`evidence/GO_20260501/TT-9627-segment-execution.md`。

---

## 6. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-05-01 | 首版：96-20 Phase A→D 与本地机读命令块、Phase D 最小排查、证据互指 |
| 0.1.1 | 2026-05-01 | **§3.9～§3.17**：Next/Vitest/Build/E2E、**`forge build/test`**、Anvil+部署、**`indexer-tick`**、治理竖切互指、Stripe/96-09、可选存储与 **STRICT_SSOT**、裁剪说明 |
| 0.1.2 | 2026-05-01 | **§3.18**：**96-18 / 官方 P0 / contracts 状态表 / Runbook / not_impl 语义** 与机读菜单分工；**TravelTrustAllocationPlaceholder** 示例 |
| 0.1.3 | 2026-05-01 | **§3.19～§3.23**：**96-18 P0/P1/P2** 本地动作表、**官方 P0 十二项** 机读与签字分工、**contracts Partial** 表、**`check-governance-doc-linkage`** / **`check-08-consistency`**；**§3.17** 裁剪范围扩至 **§3.23** |
| 0.1.4 | 2026-05-01 | **§3.9（3a）**：**`npx tsc --noEmit`** 与 Vitest/类型常见红因（与 **CONTRIBUTING** 推送前前端检查对拍） |
| 0.1.5 | 2026-05-01 | **§3.9（3b）**：**`npm run lint`** 与 warning / **`next lint`** 迁移提示；与 **（3）** 全量 **`npm run test`**（Vitest）一并作为推送前前端子集 |
| 0.1.6 | 2026-05-01 | **§3.24**：用户主路径 **建议执行顺序**（表）；**业务↔页面**（96-20 §0.2）；**真数据为主 + 调试显式隔离**（mock-pay/internal/dev 条）；**§3.17**/**§4** 互指更新 |
| 0.1.7 | 2026-05-01 | **§3.0**：**`dev-preflight.sh`** / **`ci-local-delivery-minimum.sh`** 懒人一键 + **AI 索引勿 SKIP** 句；**handbook** **`check-handbook-frontmatter`** / **`check-handbook-engineering-content`** 范围表；**§3.17** 裁剪扩至 **§3.0** |
| 0.1.8 | 2026-05-01 | **§3.25**：**用户使用 · 数据互通** 五类缺口 **索引速查表**（链/钱/页面/跨系统/扩展）；**Status**/**§3.17**/**§4** 互指更新 |
| 0.1.9 | 2026-05-01 | **§0** 互指 **[TT-LOCAL-AI-AGENT-BRIEF-001](TT-LOCAL-AI-AGENT-BRIEF-001.md)**（AI 术语 + 标准任务句） |
| 0.1.10 | 2026-05-07 | **§3.0（A）**：增 **`scripts/gates/local-tt9621-p0-stack-one-shot.sh`**（Docker PG + API + 竖切 01 + 可选 P0 spine；真栈、禁 mock 口径） |
| 0.1.11 | 2026-05-07 | **§3.0（A）**：补 **PORT=8080 / .env BB2 与测试网同形** 一句；**`LOCAL_TT9621_RUN_P0_E2E=1`** 即 **runbook README §0.2 · L5**（`p0-spine-real-api`）真栈入口 |

---

**文档结束**
