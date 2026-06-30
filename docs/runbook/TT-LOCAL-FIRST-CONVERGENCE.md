# Local First · 本地真源收敛 SSOT

**生效：** 2026-06-30  
**阶段：** ① 本地（唯一开发真源）→ ② 测试网（验证已部署 qualified 基线）→ ③ 生产（另闸）

---

## 0 · 一句话

**本地仓库 = 唯一开发真源。** 先在本地收敛代码、部署配置、脚本与文档，再按 S5 标准流程推测试网；**禁止**用测试网 SHA 回退本地，**禁止**把工作区/证据 gap 误判为 staging runtime 漂移。

---

## 1 · 真源分层

| 层 | 含义 | 当前锚点（示例） |
|----|------|------------------|
| **本地 HEAD** | 开发 + 配置 SSOT | `14b894b6`（Local First L0–L5 技术收口 · L6 待签） |
| **Staging runtime** | 已部署镜像 | `9979b35e`（Local First closure slice） |
| **Graduation / Soak** | 历史冻结证据 | `fc9266ce`（**不覆写**） |
| **Phase③ WIP** | stash / 未跟踪 | **隔离**，不混入 deploy |

**本地领先未部署（LOCAL_AHEAD_UNDEPLOYED）** ≠ **runtime 漂移（DRIFT）**。

---

## 1a · 最终固定流程（SSOT · 2026-06-30）

**任何问题必须先判断属于哪一层，再动手。** 多维对拍（合约 / CORS / `/meta` / DB 等）是 **L0–L6 执行过程中的检查内容**，**不是**与 L 步平行的第二条主链。**阻断 S5 的唯一条件：L0–L6 全部完成 + L6 Owner 签字。**

### ① Local First（唯一开发主链）

```text
L0  Root Cause Analysis
        ↓
L1  Complexity Convergence
        ↓
L2  Target Regression
        ↓
L3  Local First Convergence Gate
        ↓
L4  Local Smoke
        ↓
L5  Commit + SSOT + Runbook + Evidence
        ↓
L6  Owner Sign-off
──────────────────────────────
S5  Deploy（Owner 授权 · TESTNET_FREEZE_OVERRIDE=1）
        ↓
S6  Staging Validation
```

### ② Phase② Runtime Acceptance（S6 之后 · 测试网验收轨）

Deep Gate · UAT · R-003 · FRCA · HAT · Graduation

### ③ Production Readiness（另闸）

PI3 · Go-Live · Production GO

**持续维护（非 L 步替代）：** Runtime / 配置对拍、`emit-local-first-alignment-audit.mjs`、Runbook 互指 — 归入 **L3/L5** 或 **S5/S6** 执行时消费，不单开流程。

**结构冻结（写死 · Local First + SSOT）：** **禁止**再新增与 L0–L6 / S5 / S6 / Phase② / Phase③ **平行的**流程、阶段名或独立门闸。新需求只能：(a) 归入既有 L/S/Phase 步的 **检查项**，或 (b) 扩展现有脚本在 **该步内** 被调用 — **不得**另起「D 轨 / X 闸 / 第 N 维审计线」。

---

## 1d · 一致性检查项 D1–D12（各 L 步 **内部**清单 · 非独立流程）

下列 **D** 项仅为 **归类与对拍清单**；执行时必须在 **§1a 主链** 某一步内完成，**不得**单独宣称「D 维审计 PASS = 可 Deploy」。

| D | 检查项 | 归属步 | 典型命令 / 真源 |
|---|--------|--------|-----------------|
| D1 | Git / 制品 SHA · WT vs staging | **L5** commit 前 · **S5** 后验 | `git rev-parse` · staging `/meta.build.git_sha` |
| D2 | Runtime 祖先 · DRIFT | **L3** | `emit-local-first-alignment-audit.mjs` |
| D3 | `/meta` chain_id · 链模式 | **L4**（① 链下）· **S2/S5**（Sepolia 契约） | 本地 `P3_CHAIN_OFF=1` vs staging `11155111` |
| D4 | 合约地址十键 | **L3** · **S5** | `check-staging-web-alignment.sh` · `build.env.local` |
| D5 | 前端 `NEXT_PUBLIC_*` | **L3** · **S5** | `build.env.local` ↔ API `/meta` |
| D6 | CORS / TLS / 站点可达 | **L3** · **S6** | `check-staging-web-alignment.sh` |
| D7 | DB schema / migrations | **L2**（PG IT）· **S5/S6**（staging PG） | migrations · `ensure-api-db-migrations.sh` |
| D8 | Stripe / PSP test vs live | **S6** · **Phase③** | secrets 人工 · alignment WARN |
| D9 | 走廊行为 / smoke / UAT | **L4**（本地）· **S6**（staging） | `smoke-*-local.sh` · UAT 矩阵 |
| D10 | 运维参数（限流 / indexer 窗） | **L2/L4** env · **S5** fly.toml | `API_RATE_LIMIT_*` · Fly `[env]` |
| D11 | 构建可观测性 `git_sha` | **L5** · **S5** | `TRAVELTRUST_BUILD_GIT_SHA` / deploy arg |
| D12 | Phase③ WIP 隔离 | **L3** · **L5** | alignment `GAP-PHASE3-WIP-ISOLATED` |

**已有脚本映射（不增新闸）：** `emit-local-first-alignment-audit.mjs` → **L3**；`gen-phase2-baseline-consistency-audit.py` → **L3** 可选旁证；`check-staging-web-alignment.sh` → **L3** 只读 + **S5/S6**；`run-phase2-deep-release-gate.sh` → **S6 / Phase②**。

---

## 1b · 跨层纪律（写死 · 防「到底该修哪里」）

**必须先归类，再修复 / 验收 / 改文档。禁止跨层修复、跨层验收、跨层更新文档。**

| 问题示例 | 唯一归属 | 禁止 |
|----------|----------|------|
| 本地 DB IT 失败 | **L2**（RCA 在 L0） | 去改 staging env / 在 staging 手修 |
| 本地 smoke 失败 | **L4** | 用 ② `/meta` 绿冒充 ① 收口 |
| alignment P0 / runtime DRIFT | **L0 + L3** | 未 L6 签字即 S5 |
| Staging 验收失败 | **S6** | 回头改 Soak / Graduation @ `fc9266ce` 证据 |
| Production 检查发现问题 | **Phase③** | 回头改 Phase② Graduation 或 ① 已冻结 UI |
| WT / LOCAL_AHEAD 未部署 | **L5 + S5** | 为清 gap 而 deploy（无 L6） |

---

## 1c · 当前位置（快照 · 2026-06-30）

**① Local First 技术门闸（L0–L5）已 100% 完成**；**L6 Owner Sign-off 未签** · **S5/S6 未开始**。

| 步 | 状态 |
|----|------|
| L0 | ✅ |
| L1 | ✅ |
| L2 | ✅ · 1197/0 |
| L3 | ✅ · `TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS` |
| L4 | ✅ · `TT_PHASE2_LOCAL_STAGING_PARITY: PASS` |
| L5 | ✅ · commit + runbook + evidence（同批） |
| L6 | ⏳ Owner Sign-off |
| S5 / S6 | 未开始 |

证据目录：`evidence/GO_phase2_testnet_graduation/local-first-convergence-gate/20260630T075325Z/`

**L3 关键 RCA（2026-06-30）：** `TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE=1` 曾误挂 PD-009 `acquisition-publish-suspend` → L2 IT 404 / L4 smoke 404；已移出 freeze 块（Booking Core 例外）。L2 前收敛闸 **停 :8080 API**；L4 前 **自动 sidecar 启 API**。

---

## 2 · 本地开发流程（① · L0–L6 命令与通过标准）


| 步 | 名称 | 命令 / 动作 | 通过标准 |
|----|------|-------------|----------|
| L0 | **RCA** | 对 FAIL 项写清根因（issue / 注释 / ADR 一句） | 可复述「为何改、为何不漂移」 |
| L1 | **复杂度收敛** | `bash scripts/dev/validate-complexity-convergence-ledger-sync.sh` | `TT_COMPLEXITY_CONVERGENCE_SYNC: PASS` |
| L2 | **Target Regression** | `cargo test -p traveltrust-api -- --test-threads=1`（须 `DATABASE_URL` + `P3_CHAIN_OFF=1` + `API_RATE_LIMIT_PER_MINUTE=0` + `CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE=0` + `TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1` 等；见收敛闸脚本） | exit 0 · **1197 pass / 0 fail**（全量 PG IT） |
| L3 | **Convergence Gate** | `bash scripts/dev/run-local-first-convergence-gate.sh --full-pre-deploy` | `TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS` + `TT_LOCAL_FIRST_RUNTIME_DRIFT: NONE` · L2 前停 API · L4 前自动启 API |
| L4 | **Local Smoke** | （含于 `--full-pre-deploy`）`run-phase2-local-staging-parity-gate.sh --local-test` | `TT_PHASE2_LOCAL_STAGING_PARITY: PASS` |
| L5 | **Commit + SSOT + Runbook + Evidence** | 与 L0–L4 同批 commit；Runbook / 脚本头 / evidence pointer 与 HEAD 一致 | 与 commit 同批 · 无 deploy 路径长期 WT |
| L6 | **Owner Sign-off** | 对照 L0–L5 证据目录签字 | `evidence/…/local-first-convergence-gate/` |
| **S5** | **Deploy** | Owner 授权后 `run-phase2-local-staging-parity-gate.sh --deploy --staging-retest` | staging `/meta` = 新 HEAD |
| **S6** | **Staging Validation** | Deep Gate · R-003 · ADM · UAT（**② 验收轨** · 非 ①） | ② 增量验证 PASS |

**一键（L1–L4 · 本地 API 已起 · env 由收敛闸脚本注入）：**

```bash
bash scripts/dev/run-local-first-convergence-gate.sh --full-pre-deploy
```

**L2 注意：** 未设 `DATABASE_URL` 时 PG IT **skip**（约 1197 pass）≠ 全量 DB 回归。**全量 L2** 须干净 PG + 停 dev API，再跑 `cargo test`；与 dev API 共用脏库会导致误 FAIL。**未设 `API_RATE_LIMIT_PER_MINUTE=0`** 时 `app_stack` 类 IT 易在套件后半段 **429**（进程内限流桶累积）— 与 `start-api-for-playwright.sh` 同源。

**L2 证据（2026-06-30 · gate `20260630T075325Z`）：** `cargo test -p traveltrust-api -- --test-threads=1` → **`1197 passed; 0 failed`**（`TRAVELTRUST_COMPLEXITY_CONVERGENCE_FREEZE=1` 全套件）。

**L4 证据（2026-06-30 · gate `20260630T075325Z`）：** 收敛闸 L4 sidecar API + `run-phase2-local-staging-parity-gate.sh --local-test` → **`TT_PHASE2_LOCAL_STAGING_PARITY: PASS`**（含 PD-009 smoke · admin suspend）。

**推荐顺序（① RCA · 2026-06-30）：** 干净 PG → **L2**（停 API）→ 再启 API @ HEAD → **L4**（烟测会写库；勿在 L4 后再跑全量 L2 而不重置）。

---

## 2a · 漂移分类（机读 · 禁止误判）

| 信号 | 含义 | 是否 deploy |
|------|------|-------------|
| `GAP-LOCAL-AHEAD-UNDEPLOYED` | 本地 HEAD 领先 staging | **否** — 等 S5 |
| `GAP-PHASE3-WIP-ISOLATED` | Phase③ 在 worktree/stash | **否** — 隔离 |
| `GAP-RUNTIME-DRIFT` / `runtime_drift: true` | 非祖先关系 SHA 错乱 | **停** — 先 RCA |
| `TT_LOCAL_FIRST_RUNTIME_DRIFT: NONE` | 零运行时漂移 | 可进入 S5 评审 |

---

## 3 · 机读闸

```bash
bash scripts/dev/run-local-first-convergence-gate.sh --full-pre-deploy   # L1–L4
bash scripts/dev/run-local-first-convergence-gate.sh --with-baseline-audit

# 对齐审计（单独）
rm -f evidence/.tmp-ssot-meta.json evidence/.tmp-ssot-web-meta.json
node scripts/dev/emit-local-first-alignment-audit.mjs

# 多维 baseline 审计（只读 · 默认 @ git HEAD）
python scripts/dev/gen-phase2-baseline-consistency-audit.py
```

**末行：** `TT_LOCAL_FIRST_ALIGNMENT: …` — `NOT_100_PERCENT_ALIGNED` 若仅含 `GAP-PHASE3-WIP`、`GAP-LOCAL-AHEAD-UNDEPLOYED`、`GAP-EVIDENCE`（历史闸）**不得**宣称 staging 漂移。

---

## 4 · 禁止

- 为清 WT gap 而 deploy staging（须 **L6 → S5**）
- 把 Phase③ WIP 合入 Phase② deploy
- 用 staging 覆盖本地 HEAD
- 改写 Soak / Graduation / Final HA @ `fc9266ce` 证据
- **跨层修复 / 跨层验收 / 跨层改文档**（见 **§1b**）
- **新增平行流程 / 阶段 / 门闸**（见 **§1a 结构冻结** · D1–D12 仅作 **§1d** 步内清单）

**诚实边界：** Local First（L0–L6）完成 ≠ S6 ② GO ≠ Phase③ Production GO。
