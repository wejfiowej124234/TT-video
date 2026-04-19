# 文档–代码–任务母表 一致性审计（Alignment Audit）

**日期**：2026-04-19  
**SSOT 导航入口**：[docs/spec/00-文档索引.md](../spec/00-文档索引.md)  
**范围**：`docs/spec/**`（重点 01/04/07/14/53/110、27 系列；**`snapshots/`、`27-archived/` 不作现行规范**）、[docs/任务母表.md](../任务母表.md)、仓库 `crates/`、`frontend/`、`contracts/`、`scripts/`  
**方法**：机读交叉（`api_router()` `.merge` 次数与顺序、`contracts/src` 与 `contracts/abi`、`grep` 母表 B 行与代码符号）；**非**全量逐条 API 手工对照（剩余项建议按 93 矩阵批次消耗）。

---

## 1. 审计结论摘要

| 维度 | 结论 |
|------|------|
| **04/14 ↔ `api_router()`** | **`crates/api/src/routes/mod.rs`** 中 **`api_router()`** 自 `health_meta` 至 `internal` **共 20 次 `.merge`**，与 **[14 §2.1 路由域表](../spec/14-合约-API-ABI-前后端对齐.md)**（2026-04-19 段落）**一致**。 |
| **Staking.sol 移除** | **`contracts/src/Staking.sol`** **不存在**；**`contracts/abi/`** 无 **`Staking.json`**；**`frontend/dapp/abis/`** 无 Staking；与 **04/14/02/81/contracts README** 中「旧单文件已移除」叙述 **一致**。 |
| **trust_growth 挂载** | **`trust_growth::router()`** 已 **`merge`**；**Admin** 侧 **`trust_growth_obs::router()`** 并入 **`admin::router()`**；与 **04 §3.4** 表及 **04 §7.2/7.5** 自述 **一致**（历史脱节已在 04 标注修复）。 |
| **B-499（CI workflow）** | **`.github/workflows/*.yml` 共 31 个**；抽样 **31/31** 含顶层 **`permissions:`**；与母表 **B-499**「须声明 permissions」**不冲突**；母表 **「进行中」** 指向 **组织 Billing/hosted**，**非**「仓库 YAML 未写 permissions」假完成。 |
| **93 批次 B-486～B-498** | 母表 **「未做」** + **`TT` 列 ✅（登记态）** 与 **[93-matrix-batch-tracker.md](./93-matrix-batch-tracker.md)**、索引脚注 **一致**；**未发现**「状态已封口但无证据目录」类假完成（本审计未逐目录列 `evidence/93-batch-*`）。 |

---

## 2. 按模块的问题清单

### 2.1 Escrow / 订单 / 索引（API + internal）

| # | 文档位置 | 代码位置 | 母表 | 类型 | 级别 |
|---|-----------|----------|------|------|------|
| E1 | **04 §3.4**、**110** 多处 **`POST /api/v1/internal/indexer-reconcile`** 及 compound 门闸叙述 | **`crates/api/src/routes/internal/`**（如 **`observability.rs`** 内文档串 **`indexer_reconcile`** 路径）；Admin 侧 **`admin/mod.rs`** 注释与 reconcile 报告字段同源 | **B-101** 等已封口行 | **一致（抽样）** | — |
| E2 | ~~**contracts/README**、**14 §1.1** 列 **`SlashRouter`/`ReserveVault`**~~ | **`contracts/abi/SlashRouter.json`**、**`ReserveVault.json`** **已** **入** **仓**；**`verify-abi-forge.py`** **已** **纳入** **校验** | **B-406** | **已修复**（2026-04-19） | — |
| E2 说明（归档） | 原缺口：**`contracts/abi/`** 缺 **`SlashRouter`/`ReserveVault`** JSON。**修复**：**`forge build`** **导出** **+** **`scripts/dev/sync-abi-from-forge.sh`** **/ `.ps1`** **主** **循环** **补** **合约** **名**；**`check-55-s13`** **仍** **不** **要求** **复制** **到** **`dapp/abis`** **（** **与** **14 §1.1** **实况** **段** **一致** **）** **。 | | | |

### 2.2 Governance / 投票权 / 质押命名

| # | 文档位置 | 代码位置 | 母表 | 类型 | 级别 |
|---|-----------|----------|------|------|------|
| G1 | ~~**任务母表 · B-092** **`Staking.stakeOf`**~~ | **已改为** **`IdentityStakingPool.stakeOf`**（Guide 池、旧 ABI 兼容），与 **`governance_voting_power.rs`** **一致** | **B-092** | **已修复** | — |
| G2 | ~~**`users_sessions.rs`** **`Staking.stakeOf`** **注释**~~ | **已** **与** **Identity** **池** **口径** **对齐** | **B-092** | **已修复** | — |
| G3 | ~~**contracts/README** **GovernanceTreasury** **「Partial」** **与** **母表** **B-090** **封口** **语义** **易** **混读**~~ | **README** **表** **行** **末** **脚注** **已** **澄清** **Partial** **vs** **Foundry** **封口** | **B-090** | **已修复** | — |
| G3 说明（归档） | 原建议：脚注区分 **Partial** 与 **B-090** **Foundry** **封口**。**修复**：见 **`contracts/README`** **GovernanceTreasury** **表** **格** **行** **末** **脚注** **。 | | | |

### 2.3 TravelTrust / 信任增长（P-SCALE1）

| # | 文档位置 | 代码位置 | 母表 | 类型 | 级别 |
|---|-----------|----------|------|------|------|
| T1 | **04 §3.4** **`POST/GET /api/v1/trust-growth/*`**；**§7.2 路由映射表** **`trust_growth`** | **`crates/api/src/routes/trust_growth.rs`** + **`crates/api/src/routes/mod.rs`** **`.merge(trust_growth::router())`**；**`admin/trust_growth_obs.rs`** **`merge`** 入 admin | — | **一致** | — |

### 2.4 CI / DevOps（B-499）

| # | 文档位置 | 代码位置 | 母表 | 类型 | 级别 |
|---|-----------|----------|------|------|------|
| C1 | **B-499** 验收句：各 workflow 须顶层 **`permissions`**；**CONTRIBUTING** L4 段 | **`.github/workflows/*.yml`**：**31** 文件均含 **`permissions:`**（`rg '^permissions:' .github/workflows`） | **B-499**（**进行中**·组织计费） | **一致** | — |
| C2 | ~~**母表 B-499 外链 run**~~ | **已** **移除** **永久** **URL** **；** **取证** **改** **为** **命令** **口径** **描述** | **B-499** | **已修复** | — |

### 2.5 Docs / ABI 目录 / snapshots 误用风险

| # | 文档位置 | 代码位置 | 母表 | 类型 | 级别 |
|---|-----------|----------|------|------|------|
| D1 | ~~**`contracts/abi/README.md`** **`Staking`** **同步** **提示**~~ | **已** **改写** **为** **Guide/Provider** **池** **+** **`SlashRouter`/`ReserveVault`** **canonical** **策略** | — | **已修复** | — |
| D2 | ~~**snapshots** **误** **当** **契约**~~ | **`CONTRIBUTING.md`** **已** **增** **显式** **禁止** **句** **（** **与** **00** **索引** **原** **有** **「** **时点稿** **」** **叙述** **互补** **）** | — | **已修复** | — |

### 2.6 任务母表 · 登记态 vs「假完成」扫描

| # | 文档位置 | 代码位置 | 母表 | 类型 | 级别 |
|---|-----------|----------|------|------|------|
| M1 | **母表注**（**`TT` 列 ✅ ≠ 封口**） | 与 **B-487～B-498**、**B-499** 同行「未做/进行中」+ **`TT` ✅** **一致** | **B-487～B-499** | **一致（元数据自洽）** | — |
| M2 | **B-486**「进行中」·R-003 staging | **`scripts/dev/run_r003_staging_evidence_chain.py`** 存在；**`evidence/GO_20260418/`** 冻结规则见 tracker | **B-486** | **未在本审计内**验证 staging 真跑与 **`validate-regression-report`** | **P1（执行缺口，非母表假完成）** |

---

## 3. Top 10 修复优先级（建议顺序）

1. **P1 — E2**：为 **`SlashRouter`** / **`ReserveVault`** 补齐 **`contracts/abi/*.json`**（及 **`run-verify-abi-forge`** 子集策略），并在 **14 §1.2** 写明是否进入 **`frontend/dapp/abis`**。  
2. **P1 — G1**：修订 **任务母表 B-092** 行：将 **`Staking.stakeOf`** 改为 **`IdentityStakingPool.stakeOf`（与旧 ABI 兼容）** 或等同表述。  
3. **P1 — M2**：推进 **B-486 / 93-R003-STAGING**：非占位 env + **`report.json`** + **`validate-regression-report.py`**（与 **93 §7.1** 对齐）。  
4. **P2 — G2**：更新 **`users_sessions.rs`** 顶部注释，去掉 **`Staking.stakeOf`** 字面量。  
5. **P2 — D1**：更新 **`contracts/abi/README.md`**，删除 **`Staking`** 同步提示，改为 **Guide/Provider 双池**。  
6. **P2 — G3**：在 **contracts/README** **GovernanceTreasury** 行增加 **「Partial 指运维/evidence 面；Foundry 封口见母表 B-090」**。  
7. **P2 — C2**：**B-499** 长状态栏：将 **GitHub run 链接** 迁入 **Runbook** 或 **脚注**，母表保留 **「见 TT-B499 正文 / 日期」** 防链腐。  
8. **P2 — D2**：在 **CONTRIBUTING** 或 **59** 增加一句：**禁止**仅以 **`docs/spec/snapshots/**`** 更新替代 **04/13-1/14** 契约 PR。  
9. **P2 — 扩展审计**：对 **53 vs 04** 订单状态机字段（**`projection_terminal`** 等）跑一轮 **`cargo test -p traveltrust-api` orders** 子集 + **93 §2.0 五连** 证据目录对齐。  
10. **P2 — 27 系列**：抽查 **`27-archived/`** 与根目录 **`27-P14`** 互链是否仍指向正确 canonical（**00** 已说明兼容策略；建议年度 diff）。

---

## 4. 建议更新清单（文档 vs 代码）

| 建议 | 更新文档 | 或更新代码 / 工程产物 |
|------|----------|------------------------|
| ABI 闭环 | **14 §1.1 / §1.2**，**contracts/abi/README.md** | **`sync-abi-from-forge.sh`** 导出 **`SlashRouter`/`ReserveVault`**；**`check-55-s13`** 白名单按需扩展 |
| 母表措辞 | **任务母表.md · B-092** | — |
| 注释卫生 | — | **`crates/api/src/db/users_sessions.rs`** 注释 |
| 语义防误读 | **contracts/README** 状态表脚注 | — |
| 执行验证 | **93-matrix-batch-tracker**、**R-002 §4** | **`evidence/GO_YYYYMMDD/`**、**`python scripts/dev/run_r003_staging_evidence_chain.py`** |

---

## 5. 审计方法局限（诚实披露）

- **未**对 **04 §3.4** 全表 **逐路径** 与 **`crates/api`** 做自动化 diff（已有 **`scripts/run-check-04-routes.sh`** 为契约门禁；当前仓库 **exit 0**）。  
- **未**重跑 **Foundry** / **staging R-003**；**B-090/B-093** 等「已封口」依赖母表自述 + 文件存在性抽样。  
- **snapshots**：仅核对 **00** 是否将其标为**非计数 SSOT**；**未**逐页审计 **snapshots/** 内是否含与现行冲突的 **Implemented** 宣称。

---

## 6. 互指（本审计在体系中的位置）

- **入口**：[00-文档索引.md](../spec/00-文档索引.md)  
- **契约机读**：**`bash scripts/run-check-04-routes.sh`**（与 [CONTRIBUTING.md](../../CONTRIBUTING.md)「路由机读契约冻结」一致）  
- **全站执行**：**[93-全站功能验证矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md)** + **[93-matrix-batch-tracker.md](./93-matrix-batch-tracker.md)**  
- **本文件**：**`TT-ALIGN-DOCS-CODE-MOTHER-AUDIT-2026-04-19`**（一次性对齐快照；修订后可在 **00** 或 **59** 增加一行指针，**非必须**）

---

## 7. 本轮修复落地（2026-04-19 · 与真实代码对齐）

- **E2**：新增 **`contracts/abi/SlashRouter.json`**、**`ReserveVault.json`**；**`scripts/dev/verify-abi-forge.py`**、**`sync-abi-from-forge.sh`**、**`sync-abi-from-forge.ps1`** 纳入 **`SlashRouter`** / **`ReserveVault`**。  
- **G1 / G2**：**任务母表 B-092** **`Staking.stakeOf`** → **`IdentityStakingPool.stakeOf`**（Guide 池、旧 ABI 兼容）；**`crates/api/src/db/users_sessions.rs`** 注释同步。  
- **B-499**：母表 **状态** 栏 **移除** **永久** **GitHub** **Actions** **run** **外链** **（** **防** **链** **腐** **）** **。**  
- **D1**：**`contracts/abi/README.md`** **去** **`Staking`** **同步** **误导** **，** **列** **`SlashRouter`/`ReserveVault`** **canonical** **策略** **。**  
- **G3**：**`contracts/README`** **GovernanceTreasury** **行** **脚注** **「** **Partial** **vs** **B-090** **Foundry** **封口** **」** **。**  
- **D2**：**`CONTRIBUTING.md`** **路由** **段** **后** **增** **`snapshots`/`27-archived`** **非** **契约** **SSOT** **句** **。**  
- **14 / 00**：**14** **§1.1** **实况** **与** **§6** **ABI** **表** **、** **`00`** **版本** **表** **14** **行** **→** **1.0.129** **。**  
- **93-tracker**：**B-486** **与** **仓内** **workflow** **`permissions`** **机读** **一致** **的** **补注** **。**  
- **B-486 / R-003**：**未** **伪造** **staging** **证据** **；** **封口** **仍** **须** **执行** **`run_r003_staging_evidence_chain.py`** **+** **`validate-regression-report`** **（** **见** **母表** **B-486** **）** **。**

---

## 8. 企业级对齐修复 · 第二批次（2026-04-19）

- **母表 B-429**：SSOT 矩阵条目中 **「Staking `stakeOf`」** → **`IdentityStakingPool.stakeOf`**（**`STAKING_ADDRESS` / `chain_config.staking_address`**；**勿**将已移除 **`Staking.sol`** 作源码 SSOT）。  
- **母表 B-437**：**状态** **「未做」** → **「进行中（Partial）」**；验收对象 **「ProposalVotePanel」** → **`/governance/proposals/[id]`** **页身**（**`GovernanceProposalDetailPage` + `GovernanceProposalExecutionReadinessPanel` 等**），与 **`frontend/app/governance/proposals/[id]/page.tsx`** **链上枝** **禁** **`POST …/vote`** **+** **`castVote` i18n** **已** **落地** **对读** **。  
- **`27-系列索引.md` §〇**：修正 **「不设子目录」** 与 **`docs/spec/27-archived/`** **事实** **矛盾** **（** **根** **`27-*.md`** **+** **归档子目录** **）** **。**  
- **`59` V1.9.3 · B1**：**17** **域** → **`api_router()` 20×`merge`** **完整** **域** **列表** **（** **与** **`routes/mod.rs` / 14 §2.1** **一致** **）** **；** **B1** **行** **注** **勿** **以** **snapshots** **替代** **`routes/mod.rs`** **。**  
- **`crates/api/.../suite_early.rs` · `suite_late.rs`**：删除 **测试** **文件** **顶栏** **未** **使用** **`use`** **（** **`cargo test -p traveltrust-api --no-run`** **零** **告警** **）** **。**  
- **L4 / 本地交付互证**：**[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md)** **§10**（**已封口 L4 与纯文档勘误**）**、** **[TT-LOCAL-CI-DELIVERY-GATE-001](./TT-LOCAL-CI-DELIVERY-GATE-001.md)** **篇首** **「** **文档对齐勘误** **」** **段** **（** **Version 1.0.3** **）** **。**
