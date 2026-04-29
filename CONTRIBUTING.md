# Contributing / 参与开发

本仓库的**开发顺序、阶段与发版门禁**以 `docs/spec` 为准；本页只列**工程侧最低标准**与入口，避免与长篇 spec 重复。

> **阶次纪律（读任意 `docs/` 仍适用）：** **① 本地 → ② 测试网 → ③ 公网/生产**；**须先完成当前阶可验证目标，再进入下一阶**；**禁止跳阶**；**禁止**用 **①②** 冒充 **③**。单篇规范未必复述三阶全文，但**进度与「已闭/GO」须标明阶次**（与 **[`.cursor/rules/traveltrust-ai-collab.mdc`](.cursor/rules/traveltrust-ai-collab.mdc)**、**[AI协作话术 §0](docs/AI协作话术-减负与边界.md)**、根 **[AGENTS.md](AGENTS.md)** 同源）。从 **`docs/spec/00-文档索引.md`** 跳读任意 spec 时**仍须**遵守本阶次。

**全仓库规划方向（默认）：** **验收顺序三阶（强制）** — **① 本地** → **② 测试网** → **③ 公网 / 生产真实链路**（**禁止跳阶**；**③** 含主网真链、**Production GO** 等 **另闸**）。入口：**[README.md](README.md)**「工程规划方向」、**[TT-9618](docs/runbook/TT-9618-onboarding-local-testnet.md)**（三阶说明 + 两阶段表）、**[96-索引](docs/spec/96-索引-全链路外生产验收分册.md)**、**[TT-9600](docs/runbook/TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md)**（**CI 非必须** 时本地 **96** 收口）、**[go-live-checklist · GO Decision](docs/go-live-checklist.md#go-decision-entry-point)**。**Hub / 分册 Version** 以 **[00 · 文档版本与最后更新](docs/spec/00-文档索引.md#文档版本与最后更新)** 为准；**Declaration** 见 **[96-索引 #95-96-execution-linkage-declaration](docs/spec/96-索引-全链路外生产验收分册.md#95-96-execution-linkage-declaration)**。**`#9618`（96-18 准入费）** 与根 **README** **`#9618-one-page-priority`** / **`#9618-cmd-cheatsheet`** 同源互指：**[96-18-未完成](docs/spec/96-18-未完成清单与多维检查.md#9618-one-page-priority)** **v1.0.118+**、**[`#9618-batches` · §1 批次台账](docs/spec/96-18-未完成清单与多维检查.md#9618-batches)**、**[§4 命令筛子](docs/spec/96-18-未完成清单与多维检查.md#9618-cmd-cheatsheet)**；**Hub** 文首见 **96-索引**（与 **README** 两锚对读）。

<a id="post-freeze-ext-dev"></a>

## Post-Freeze Controlled Development（EXT / Next Scope）

**适用**：在 **[95-附录](docs/spec/95-附录-Next-Scope-EXT.md)** 登记 **F-034+**、**§8.2-EXT**、**§7-EXT** / **§7-EXT.UI**、**§9-EXT** 的 **Post-Freeze** 扩展（与 **主文 95** 基线表体 **隔离**）。

- **工作分支**：在 **`feature/ui-and-95-expansion`** 上开发；合入 **`main`** 仍经 **PR** 与分支保护。
- **规则 SSOT**：[95-附录 §0-EXT · Post-Freeze Controlled Mode](docs/spec/95-附录-Next-Scope-EXT.md#post-freeze-controlled-development-mode)（**EXT** 登记表、本地验证、每轮输出、**禁止**改写 **F-001～033** / **主文** **§8.2** / **§9** 既有语义）。
- **GO 判定入口**（文档）：[go-live-checklist · GO Decision Entry Point](docs/go-live-checklist.md#go-decision-entry-point)。

**与下文「单人 push」关系**：**仅** **EXT/Next Scope** **产品代码与附录表体** **须** 遵守本节；**与 F-034+ 无耦合** 的纯勘误 / 小改仍可按 **[单人 push 与 PR 建议](#solo-push-vs-pr)** 权衡。

<a id="solo-push-vs-pr"></a>

## 单人 push 与 PR 建议（路径策略）

**默认可直推 `main`**：普通小改、无风险脚本、**非核心**文档（与 `docs/spec` 核心契约无强耦合的说明、注释、小修复）。

**建议走 PR**（单人亦适用）：触及下列**任一**时，用分支 + PR 合并，便于留 diff、跑全 CI、降低误伤 **`main`** 的概率：

| 类别 | 路径或范围（示例） |
|------|-------------------|
| **AI 任务卡索引** | `docs/AI任务卡索引.md` |
| **CI workflow** | `.github/workflows/**` |
| **Gate 脚本** | `scripts/gates/**` |
| **广播 / 证据 / production-go 链** | 如 **`scripts/gates/broadcast-batch-*.sh`**、**`scripts/ops/*broadcast*`**、**`scripts/ops/*production*go*`**（例 **`region_vault_claim_production_go_gate.py`**）、**`write-indexer-evidence.*`**，及 **`.github/workflows/broadcast-batch-blockers.yml`** 等与其强绑定的 **evidence 落盘 / 链上留痕** 脚本；以「动了 GO 闸、batch 证据 JSON、广播归档」为准。 |

**CI workflow SSOT**（**`.github/workflows/*.yml`** **全集** **须** **跟踪** **、** **顶栏** **`permissions`** **；** **含** **`upload-artifact`** **须** **叠加** **`actions: write`** **）** **见** [母表 **B-499**](docs/任务母表.md) **与** [企业审计清单 **Phase 5 · 项 5.5**](docs/runbook/TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001.md) **。** **GitHub-hosted** **因** **组织** **Billing** **不可** **调度** **时** **，** **交付** **真** **门禁** **见** **[** **`TT-LOCAL-CI-DELIVERY-GATE-001`** **](** **docs/runbook/TT-LOCAL-CI-DELIVERY-GATE-001.md** **)** **（** **本地** **/** **VPS** **；** **与** **[** **`TT-L4-PARALLEL-CI-001`** **§5.0** **](** **docs/runbook/TT-L4-PARALLEL-CI-001.md** **)** **对** **读** **）** **；** **`gh run view` Annotations** **旁证**（**runner 未分配** / **payments** **≠** **断言红**）**见** **`evidence/GO_95_20260422_section9_iss007_gh_billing_annotation/README.md`** **。**

**已封口 L4 / 本地交付证据 · 纯文档勘误**：若仅合入 **spec/母表/59/27** 等 **文字勘误** 与 **`internal` 测试** **未使用 `use` 清理**，**不**必据此 **重跑** 全量 **Sepolia E2E**；**一行引用** **[TT-L4-PARALLEL-CI-001 §10](docs/runbook/TT-L4-PARALLEL-CI-001.md)** **与** **[TT-LOCAL-CI-DELIVERY-GATE-001](docs/runbook/TT-LOCAL-CI-DELIVERY-GATE-001.md)** **篇首「文档对齐勘误」** **即可** **。** **触及** **`frontend/`** **路由** **/** **`crates/api` 契约** **/** **合约 ABI** **的** **diff** **仍** **须** **按** **上表** **与** **本节** **重跑** **相关** **门禁** **。**

**最省事单人用法**：**日常**改动 **直推 `main`**；改 **索引、CI、gate、广播证据链** 时 **走 PR**。

## 必读入口

| 用途 | 文档 |
|------|------|
| **全仓库规划方向（本地 → 测试网 → 公网/生产）** | **[README.md](README.md)**「工程规划方向」（**三阶 · 禁止跳阶**）；**[TT-9618](docs/runbook/TT-9618-onboarding-local-testnet.md)**；**[96-索引](docs/spec/96-索引-全链路外生产验收分册.md)**；**[TT-9600](docs/runbook/TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md)**；**[go-live-checklist](docs/go-live-checklist.md#go-decision-entry-point)**；**Version 真值** **[00](docs/spec/00-文档索引.md#文档版本与最后更新)** |
| **Post-Freeze · EXT / F-034+** | **[§0-EXT 受控开发模式](docs/spec/95-附录-Next-Scope-EXT.md#post-freeze-controlled-development-mode)**；工作分支 **`feature/ui-and-95-expansion`**；工程侧摘要见本节 **[Post-Freeze Controlled Development](#post-freeze-ext-dev)** |
| **单人直推 vs PR** | 本节上文 **[单人 push 与 PR 建议](#solo-push-vs-pr)** |
| **单人节奏 · 规划方向 §0** | [docs/solo-dev-rhythm.md](docs/solo-dev-rhythm.md)（与根 **[README.md](README.md)**「工程规划方向」同源） |
| 阶段顺序、开工/发版 bar | [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md)（**唯一入口**：**§零**、**§二 2.5**、**§二 2.4**、**§四 4.3**、§五）；**文档审计与机器门禁一览**见 [00-文档治理总册 §8.3](docs/spec/00-文档治理总册.md#doc-audit-gates-ssot) |
| **handbook 工作台、ADR（Why）、`engineering` 内 Wave/阶段词** | [handbook/README.md](docs/handbook/README.md)；**团队口径**（与 **[engineering/README 段首](docs/handbook/engineering/README.md)**/**[09 · §10c 表后](docs/handbook/engineering/09-文档迁移覆盖审计报告.md#audit-cluster-exec-list)** 对读）：**engineering 仅为导读，不替代 spec**；**04 §3.4 / 93 / 14 / 代码与脚本** 为契约与机读真源；**ADR** 唯一 **`docs/adr/*.md`** — [docs/adr/README.md](docs/adr/README.md) + [07-架构决策记录ADR规范](docs/handbook/engineering/07-架构决策记录ADR规范.md)（**不**替代 **04/93/14/代码与脚本**）；**Wave/阶段消费词** [32 §0](docs/handbook/engineering/32-横切-Wave与阶段体系导读.md#x32-0-terminology)（与 **07** 对读）；**engineering 空 `NN`（60～99）非遗漏**见 [engineering/README · 号段预留](docs/handbook/engineering/README.md#eng-read-number-blocks)（[手册 00 §5](docs/handbook/00-手册总览与编制规范.md#hb-00-number-blocks)）；**读前摘要** 同行见 **[spec/00](docs/spec/00-文档索引.md)**；**`handbook/engineering*` 文档版本母表边界**（**主序 `00～50` + `engineering/README` + `engineering/adr/README`**；**`EVIDENCE-*`/`_TEMPLATE` 不逐行入表**）见 **[spec/00 · 文档版本与最后更新](docs/spec/00-文档索引.md#文档版本与最后更新)** 节前 **「handbook/engineering 版本母表边界」** 段；**`EVIDENCE-*-cluster-verified.md`**：**`bash scripts/check-handbook-engineering-content.sh`**（**`HBOOK-ENG-EVIDENCE`**）；母版 **[22 §2](docs/handbook/engineering/22-横切-簇级verified证据模板.md#vtpl-2-naming)**（与下文 **「提 PR 前」** 同条） |
| **spec→handbook 迁移矩阵与簇态审计** | **[engineering/08 §3](docs/handbook/engineering/08-文档与spec迁移台账.md#mig-2-matrix)**（台账矩阵）· **[engineering/09 §3](docs/handbook/engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（覆盖审计；**与 08 §3 同 PR 对拍**）；与 **[engineering/README](docs/handbook/engineering/README.md)** 段首 **簇态台账** 同轮对拍；**migrated / 覆盖度 full 仍不意味可删 `docs/spec`**（见 **[08 §2](docs/handbook/engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](docs/handbook/corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](docs/spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**） |
| 文档命名、索引、迁移 | [00-文档治理总册](docs/spec/00-文档治理总册.md) |
| API 单源 | [04-后端与API](docs/spec/04-后端与API.md) §3.4 |
| 合约 / ABI / 前端对齐 | [14-合约-API-ABI-前后端对齐](docs/spec/14-合约-API-ABI-前后端对齐.md) |
| 缺口与迭代优先级 | [缺口与待补-官方总表](docs/spec/缺口与待补-官方总表.md)、[51-阶段开发技术文档](docs/spec/51-阶段开发技术文档.md) |
| 脚本与门禁 | [scripts/README.md](scripts/README.md) |
| **96-18 准入费 · PG 机读一键（② · 须 `DATABASE_URL`）** | **`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`** — **[TT-9618 §3.5.3](docs/runbook/TT-9618-onboarding-local-testnet.md#tt-9618-pg-evidence-one-shot)**（**§3.1 步 5** **`matrix_93_admin_onb`** **含** **`029`/`030`/`031_*`** **`GET …/admin/jobs?queue_name=onboarding_webhook`** **+** **步 7** **`005_f036_ext`→`017`→`014`→`016`** **+** **§3.6** **`008b`→`009`–`012`**（**`matrix_93_d_onb_009`** **子串** **含** **`009b_*`** **`PRIMARY_CLAIM`** **`async_jobs`** **主选队**），与脚本头注释同源）；命令筛子 **[96-18-未完成 §4](docs/spec/96-18-未完成清单与多维检查.md#9618-cmd-cheatsheet)**；**一页优先级 / backlog** **[`#9618-one-page-priority`](docs/spec/96-18-未完成清单与多维检查.md#9618-one-page-priority)** **v1.0.118+**；**批次台账** **[`#9618-batches`](docs/spec/96-18-未完成清单与多维检查.md#9618-batches)**；与 **[`93-matrix-batch-tracker`](docs/runbook/93-matrix-batch-tracker.md)** **互指表** **「TT-9618」** **行** **对读** |
| 本地起停（Win / Unix · Next 15 · 3012） | [scripts/README.md](scripts/README.md) **§一「日常开发」** 与篇首**快速使用**；[07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**本地开发起停（Win · Unix · Next 15）**」行；[docs/测试账号与本地联调.md](docs/测试账号与本地联调.md) |
| 旧文档 / 归档 / 现行分层（可读性整理） | [00-文档使用分层说明-旧整合与现行SSOT](docs/spec/00-文档使用分层说明-旧整合与现行SSOT.md) |
| **与 AI 协作（减负话术 · 项目规则）** | [AI协作话术-减负与边界](docs/AI协作话术-减负与边界.md)；Cursor 见 [.cursor/rules/traveltrust-ai-collab.mdc](.cursor/rules/traveltrust-ai-collab.mdc)（`alwaysApply`） |
| **新增只读 HTTP 接口（治理 `/governance` · 管理 `/admin`）** | **[单一模板入口](docs/runbook/ai-template-read-only-api.md)**：任务卡、Read Contract 文档节、契约测试、`READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS` 接入清单（先读后改） |

<a id="read-api-mandatory-flow"></a>

## Read API 开发强制流程（治理 / 管理 · 只读 GET）

**适用范围**：任何新增或实质变更的 **`GET /api/v1/governance/*`**、**`GET /api/v1/admin/*`**（含同路径上挂载的 GET 与写方法并存的情形：**门禁只针对 GET**）。

**须按顺序完成（默认路径，禁止「先写 handler 再补文档」作为常规做法）**：

1. 打开并按 **[ai-template-read-only-api.md](docs/runbook/ai-template-read-only-api.md)** 执行任务卡与清单（单一模板入口）。
2. 在实现或评审中**显式声明 `SourceKind`**（与 **`crates/api/src/source_kind.rs`** 语义一致；列表类须遵守「禁止根级 `chain_read` 冒充整表 SSOT」等 runbook 禁令）。
3. 在 **`read-contract-governance-read-apis.md`** 或 **`read-contract-admin-read-apis.md`**（或其中索引表）**补齐 Read Contract** 对应节/行。
4. 在 **`governance_read_contract_contract_tests`** / **`admin_read_contract_contract_tests`**（或 cross-check 等既有强校验路径）**增加契约测试**；若路径落在 guard 范围内，**同步更新** **`read_contract_route_guard.rs`** 中的 **`READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS`**。

**否则**：

- **`read_contract_scan_matches_registry`** 与/或 **`read_contract_router_get_smoke_for_all_registered_paths`** 将失败（CI 与本地 `cargo test -p traveltrust-api` 同源）。
- 该改动视为**未完成**：合入前须补全；**禁止**为过关而削弱门禁或篡改封口实现（B-115 / B-116 / P5）。

## 提 PR 前（本地）

在根目录执行（按你改动范围取舍）：

```bash
# 后端
cargo check -p traveltrust-api
cargo test -p traveltrust-api

# 前端
cd frontend && npm run lint && npx tsc --noEmit && npm test

# 前端生产构建（改 frontend/ 时建议；阶段 A 与 TT-9618 / README 规划方向一致）
# bash scripts/gates/check-frontend-npm-build.sh
# 或：cd frontend && npm run build
# 与 **tt-9618** 同次：CHECK_FRONTEND_NPM_BUILD=1 bash scripts/gates/tt-9618-onboarding-pg-evidence.sh（须 DATABASE_URL + node）
# E2E 稳定性探针同次：CHECK_FRONTEND_NPM_BUILD=1 bash scripts/gates/e2e-stability-probe.sh
```

**触及 `crates/api` 准入费 / onboarding webhook / `matrix_93_*_onb_*` 时（建议）**：在已迁移 **PostgreSQL** 上导出 **`DATABASE_URL`** 后执行 **`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（**[TT-9618 §3.5.3](docs/runbook/TT-9618-onboarding-local-testnet.md#tt-9618-pg-evidence-one-shot)**；**串跑顺序** 见 **`scripts/gates/tt-9618-onboarding-pg-evidence.sh`** **头注释**（**`admin_onb`→`006`→`005_f036_ext`→`017`→`014`→`016`→`008b`→`009`–`012`**；**首段** **`matrix_93_admin_onb`** **子串** **已含** **`matrix_93_admin_onb_031_*`** **`admin/jobs`** **`queue_name`** **对拍**；**`matrix_93_d_onb_009`** **子串** **已含** **`009b_*`** **`async_jobs`** **主选队** **`PRIMARY_CLAIM`** **PG·IT**）；未设 **`DATABASE_URL`** 时 **exit 2**，**不**冒充 **②** 已验收）。可选 **`CHECK_FRONTEND_NPM_BUILD=1`** 串 **`npm run build`**。单条筛子见 **[96-18-未完成 §4](docs/spec/96-18-未完成清单与多维检查.md#9618-cmd-cheatsheet)**；**P0/P1/P2 真源** 见 **`#9618-one-page-priority`**（**[同文件](docs/spec/96-18-未完成清单与多维检查.md#9618-one-page-priority)** **v1.0.118+**）与 **`#9618-batches`**（**[§1 批次台账](docs/spec/96-18-未完成清单与多维检查.md#9618-batches)**）。

**GitHub · L4 parallel CI（观测 workflow）**：与 **`build.yml`** 的链关烟测 **正交**；须配置组织 **Actions 计费** 与（若要真跑）secret **`L4_CI_DOTENV_B64`**。**不得**仅凭 workflow **总结论 ✓** 认定已在 CI 跑完 **`npm run e2e:sepolia`**。长寿命 PR（含 Dependabot）请 **定期合并 `main`**，避免 **`frontend/package.json`** 与 **`e2e:sepolia`** 契约漂移。排障与归因：**[docs/runbook/TT-L4-PARALLEL-CI-001.md](docs/runbook/TT-L4-PARALLEL-CI-001.md)**；本地 **`bash scripts/gh-l4-run-inspect.sh`** 或 **`powershell -File scripts/gh-l4-run-inspect.ps1`**（须已 **`gh auth login`**；可选 **`GH_BRANCH=<ref>`** 筛分支）。

可选（工台基线与依赖审计，与 **`pre-release-automation`** 首段同源）：`bash scripts/check-invariants.sh`、`bash scripts/audit-deps.sh`。Windows：`.\scripts\check-invariants.ps1`；**audit-deps** 须 **Git Bash** 执行 `bash scripts/audit-deps.sh`。总览见 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**工台基线 · 依赖审计（invariants · audit-deps）**」行、[scripts/README.md](scripts/README.md) **§二「CI 门禁」**。

### PR 须声明 F/X/G 分区（spec/92 · 涉及 UI 动效或路由时）

**下列** **任一** **情形** **，** **PR** **描述** **须** **写明** **：** **（** **1** **）** **影响** **路由** **或** **页面** **范围** **；** **（** **2** **）** **对应** **[spec/92](docs/spec/92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md)** **表** **A** **之** **F** **/** **X** **/** **G** **分区** **。** **范围** **包括** **：** **修改** **路由** **；** **新增** **/** **调整** **动效** **、** **粒子** **、** **全页** **背景** **；** **修改** **资金** **相关** **UI** **。** **未** **注明** **者** **，** **review** **可** **要求** **补全** **或** **拒绝** **合入** **（** **防** **Spec** **Collision** **）** **。** **执行** **入口** **见** **[07 §五 5.3](docs/spec/07-开发流程与顺序.md)** **文首** **「** **入口** **强制** **」** **段** **。**

### 路由与 `04` / `13-1` / `frontend/app` 契约（建议）

改动 **[04 §3.4](docs/spec/04-后端与API.md)**（**API 主表**或**前端页面路由表**）、**[13-1 表 1](docs/spec/13-1-UI产品级SSOT与页面规范.md)** 或 **`frontend/app/**/page.tsx`** 正式路由时，仓库根执行（须 **Python 3**，与 **Build** CI 同源）：

```bash
bash scripts/run-check-04-routes.sh
```

**仅改 `docs/handbook/`** 下 **`engineering|product-manager|learn` 的 `NN-*.md`**、**`corpus/REG-*.md`** 或**各栏 `README.md`** 时（文首 **Version / 与 spec 关系** 机读校验，与 **Build** CI 同源）：

```bash
bash scripts/check-handbook-frontmatter.sh
```

若改动 **`docs/handbook/engineering/`** 下 **`[1-9][0-9]-*.md`**（**NN≥10** 域篇）、**`EVIDENCE-*-cluster-verified.md`**，或大量 **`](../../spec/*.md)`** 外链，**另须**：

```bash
bash scripts/check-handbook-engineering-content.sh
```

（与 **Build** 中 **`Handbook engineering content hygiene`** 同源：**spec** 外链存在性；**NN≥10** 与 **`engineering/00～09`** 基线须含 **`cargo test` / `run-check-04-routes` / `bash scripts/`** 验证字面；**`EVIDENCE-*-cluster-verified.md`** 须含 **`-v1/-v2/-v3` HTML 锚**、**`## V-1`～`V-3`**、**`22-横切-簇级verified证据模板`**、**`不替代`** — 失败码 **`HBOOK-ENG-EVIDENCE`**。）

**verified 簇 EVIDENCE §V-1 · 唯一验收入口（与 [scripts/README.md](scripts/README.md)、[engineering/22 §3](docs/handbook/engineering/22-横切-簇级verified证据模板.md#vtpl-3-v1) 同源）**：凡改动 **`EVIDENCE-*-cluster-verified.md` 各文件 `## V-1`** 所列命令、**[`scripts/gates/run-handbook-cluster-evidence-v1.sh`](scripts/gates/run-handbook-cluster-evidence-v1.sh)**、根 **[`scripts/run-handbook-cluster-evidence-v1.sh`](scripts/run-handbook-cluster-evidence-v1.sh)**，或 **[`.github/workflows/handbook-cluster-evidence-v1.yml`](.github/workflows/handbook-cluster-evidence-v1.yml)**，**合并前须** **`bash scripts/run-handbook-cluster-evidence-v1.sh` exit 0**；并须保持脚本末行 **`TT_EVIDENCE_V1_SUMMARY:`** 前缀与 **`OK steps=…` / `FAIL step=… exit=…`** 格式**稳定可 `grep`**，且 union 串联与各 **`EVIDENCE-*` `## V-1`** **语义一致**（**禁止**删减 **V-1** 主证冒充收口）。**若摘要不可 grep、格式漂移或与 §V-1 脱节，一律视为未完成**（**不替代**上条 **`check-handbook-engineering-content.sh`**；二者互补）。

**`docs/spec` 路径依赖（盘点 + registry + validator）**：凡是**新增、删除或改动** **`docs/spec` 路径依赖**（含：**`docs/spec/`** 下被 **`scripts/`**、**`docs/`**（spec 外）、**`.github/workflows/`** 等硬编码消费的路径；上述消费方对 **`docs/spec/…`** 的锚点/门禁目标变更；**`registry/spec-path-dependencies*.yaml`** / **[盘点文](docs/spec-path-dependency-migration-inventory.md)** 所记关系），**须同步**更新盘点文与 **`registry/spec-path-dependencies.v1.yaml`**。**提交前**须在仓库根**本地**依次执行并通过（**exit 0**）：

```bash
python registry/validate-spec-path-dependencies-registry.py
bash scripts/check-handbook-frontmatter.sh
bash scripts/check-handbook-engineering-content.sh
```

**完成口径**：以**本地**上述三门禁为准；**不以** PR 或 GitHub Actions 绿灯作为本条收口条件。**Registry YAML** 结构合法性以 **`validate-spec-path-dependencies-registry.py`** 为硬门禁；**[`.github/workflows/registry-spec-path-dependencies-validate.yml`](.github/workflows/registry-spec-path-dependencies-validate.yml)** 仅 **CI 恢复后的可选复跑**（与本地 validator 同逻辑）。**不**借此迁移或删除 **`docs/spec`**，**除非单独立项**；**不**改 **`build.yml`** 默认 **Build** 必过主链。说明见 **[`registry/README.md`](registry/README.md)**；与 **`scripts/README.md`** 同条互指。

**可选（I5）**：若改动 **`docs/handbook/engineering/*.md`** 内指向 **`contracts/`**、**`corpus/`**、**`ops/`** 等仓内相对路径，建议再跑 **`bash scripts/check-handbook-engineering-local-md-links.sh`**（与 **`check-handbook-engineering-content`** 互补；**CI 默认**不串跑）。

**`engineering/00～50` 主序 `NN-*.md` 增删改**：须 **[手册 00 §3 工程栏](docs/handbook/00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README 主序列](docs/handbook/engineering/README.md)**、磁盘文件名 **NN** **三处对拍**（同序、同号）；勾选项 **[engineering/02 · §4a](docs/handbook/engineering/02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**。文首 **`SSOT（必读）`** blockquote 须与 **[engineering/README](docs/handbook/engineering/README.md)** 段首及 **[手册 00 · §2.2 最小集](docs/handbook/00-手册总览与编制规范.md#hb-00-frontmatter-min)** 同键（**`engineering/`** **仅为导读，不替代 spec**；链 **04 §3.4** / **93** / **14** / **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** **脚本门禁**；**HTTP/ABI 同 PR 闭包**见 **[04 · §1a](docs/handbook/engineering/04-HTTP与路由契约导读.md#hb-eng-04-drift-checklist)**、**[50 · §5](docs/handbook/engineering/50-链上与ABI导读.md#b50-5-usage)**）。

**手册侧评审口径**（「目录干不干净」、**英文文件名**能否改、分属 **L0～L3** 哪一级）：**[docs/handbook/00-手册总览与编制规范.md · §2.1.0](docs/handbook/00-手册总览与编制规范.md#hb-00-doc-cleanliness)**、**[§2.1.3](docs/handbook/00-手册总览与编制规范.md#hb-00-naming-latin-tiers)**。

**合并前默认建议**：改动触及 **`crates/api/src/routes/**`**、**`frontend/lib/api.ts`** 或 **`frontend/lib/apiClient/**`** 中与 **`/api/v1/*`** 相关的路径或常量时，**应在 PR 合并前**执行本脚本（与 **Build** CI、`scripts/dev-preflight.sh` 第二步同源）；PR 描述可附通过日志或截图。

串联四步：**`check-04-routes-vs-code.py`**（§3.4 API 表 vs `crates/api` **`.route`**）→ **`check-04-frontend-routes-vs-app.py`** → **`check-13-1-table1-routes-vs-app.py`** → **`check-13-1-routes-covered-by-04-frontend-table.py`**（**13-1 表 1** ⊆ **04** 前端路径表）。默认 **`STRICT_WARNINGS=1`**（与 CI 一致；排障可 `STRICT_WARNINGS=0`）。

**04 / 14 HTTP 机读路由表与门禁锚点冻结（约定）**：以 **`bash scripts/run-check-04-routes.sh`** **exit 0** 作为 **[04 §3.4](docs/spec/04-后端与API.md)** 与 **[14](docs/spec/14-合约-API-ABI-前后端对齐.md)** 当前**表格结构**及 **`run-check-04-routes`** 后半串联门禁（**B450～B457** 等）所依赖的**字面锚点**的冻结验收点。**不要**在同一 PR 内混做「版式 / 可读性重排」与上述锚点/表结构变更；若只做 04/14 排版或拆表，请**另开独立 PR**，且合并前仍须本脚本绿。**默认**不再提交「仅为扩写 **`run-check-04-routes`** 表锚点、无 HTTP/路由真值变更」的单独 04/14 文档 PR；若 API 或挂载路由真值变更，须与 **`crates/api` / `frontend`** **同批**更新 04 §3.4 / 14 并保持本脚本绿。

**后续工作重心（约定）**：在 04/14 冻结前提下，优先把 **[spec/93](docs/spec/93-全站功能验证矩阵-域别回归清单.md)** 功能链路做成**真实环境执行**：对先前记 **BLOCKED** 的用例，在具备依赖的环境（staging、本地全栈、链/邮件等）上**逐条重跑**，落盘为 **PASS** 或 **FAIL**（**禁止**长期停留在无证据的 BLOCKED）；最小证据集与汇总 **`report.json`** 见 **93 §0.5**、**[R-001](docs/spec/R-001-全站回归报告模板与汇总JSON结构.md)**；批次排期与证据目录模板见 **[`docs/runbook/93-matrix-batch-tracker.md`](docs/runbook/93-matrix-batch-tracker.md)**，自动化回填见 **[R-002 §4](docs/spec/R-002-回归执行闭环与发布准入.md)**。

Windows：`.\scripts\run-check-04-routes.ps1`。命令参数、**`STRICT_WARNINGS`** 与 **59**/**14 §2.1**/**07 §二 2.4·A1** 配套说明见 [scripts/README.md](scripts/README.md) **§三** 验收清单表内 **`run-check-04-routes`** / **`check-04-routes-vs-code.py`** 行；总览见 [07 §二 2.3](docs/spec/07-开发流程与顺序.md)。**`api_router()`** 在 `crates/api/src/routes/mod.rs` 中 **`merge` 共 22 次**（与 [07 §零 0.6](docs/spec/07-开发流程与顺序.md)、[14 §2.1](docs/spec/14-合约-API-ABI-前后端对齐.md)、[95 §12.3](docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md) 同序：`health_meta`、`auth`、`admin`、`me`、`market_subsite`、`guides`、`orders`、`traveltrust_page`、`itineraries`、`discover`、`messages`、`disputes`、`evidence`、`media`、`intents`、`community`、`country_ledger_jurisdiction`、`did_rank`、`governance`、`trust_growth`、`onboarding`、`internal`）；**ABI** 静态核对叙事见 **14 §2.1**、**§1.2**；全域检查清单篇首机读互链见 [59](docs/spec/59-企业级全域检查清单与文档补充计划.md)。

**`docs/spec/snapshots/`** 与 **`docs/spec/27-archived/`**：**不**作为现行 HTTP/路由/合约契约 SSOT；变更路由或 API 契约须以 **[04 §3.4](docs/spec/04-后端与API.md)**、**[13-1 表 1](docs/spec/13-1-UI产品级SSOT与页面规范.md)**、**[14](docs/spec/14-合约-API-ABI-前后端对齐.md)** 与 **[00](docs/spec/00-文档索引.md)** 为准，**禁止**仅凭 snapshots 或归档 27 正文替代 **04/13-1/14** 的 PR 对读。

改动 **合约** 或 **`contracts/abi` / `frontend/dapp/abis`** 时：在 `contracts/` 下 `forge build` / `forge test`，按 [scripts/README.md](scripts/README.md) **§三** **`sync-abi-from-forge`** / **`check-55-s13`** 行同步 ABI，并执行 `bash scripts/check-55-s13.sh`（Windows：`.\scripts\check-55-s13.ps1`）。契约与 **sync-abi → dapp/abis → 55-S13** 有序清单见 [14 §1.2](docs/spec/14-合约-API-ABI-前后端对齐.md)、[ops/RUNBOOK.md](ops/RUNBOOK.md) **§12.4**；总览见 [07 §二 2.3](docs/spec/07-开发流程与顺序.md) **55-S13** 子弹与文首**读前摘要**「**ABI·55-S13**」行。**上测试网/主网前**：须先 **Anvil** 本地闭环（订单主路径 + 治理相关 **Target** 若已开发），见 [contracts/README](contracts/README.md)、[Runbook §2.56](ops/RUNBOOK.md)、[governance-token/02 §1.3](docs/spec/governance-token/02-对内技术规格-草案.md)、[07 §二 Phase 3](docs/spec/07-开发流程与顺序.md)。

**Handbook 一行对拍**：**[engineering/05 · §3](docs/handbook/engineering/05-本地环境与常用门禁速查.md)**「改动类型 × 建议门禁」矩阵与上段同序互补。**B-181**（**spec/00** 读前、部分 **workflow** 仍写历史 **`routes/*.rs`** 字面；**开文件**以 **`crates/api/src/routes/*/mod.rs`** 为准；**HTTP** 仍以 **04 §3.4 + `run-check-04-routes`**）见 **[engineering/04 §2](docs/handbook/engineering/04-HTTP与路由契约导读.md)**、**[REG-04](docs/handbook/corpus/REG-04-API叙事.md)**。

## API 已启动时的快速验收（可选）

与 [07 §二 2.3](docs/spec/07-开发流程与顺序.md)、[缺口与待补-官方总表 P1-E](docs/spec/缺口与待补-官方总表.md) 一致，用于联调留痕（**不替代** 01 §9 E2E 三项）：

```bash
./scripts/check-55-quick-verify.sh
# 或（须全部为 200）：./scripts/smoke-api-public-routes.sh
```

Windows：`.\scripts\check-55-quick-verify.ps1`；**严格 200 冒烟**（与 Bash 版 smoke 等价）：`.\scripts\smoke-api-public-routes.ps1`。发版前机器聚合：Linux/Mac `SKIP_FORGE_VERIFY=1 ./scripts/pre-release-automation.sh`；Windows `$env:SKIP_FORGE_VERIFY='1'; .\scripts\pre-release-automation.ps1`（有 Foundry 时可不设 **SKIP**）。**分层留痕（仓库体量）**：`EVIDENCE_PRE_RELEASE_LOG_DIR=evidence/GO_YYYYMMDD ./scripts/pre-release-automation.sh` 会生成 **`.full.txt`**（根 `.gitignore`）与 **`.summary.txt`**（可提交）；详见 [scripts/README.md](scripts/README.md) **pre-release-automation.sh** 行。

## Gate-5 前端 manifest（发版 / evidence）

先 `cd frontend && npm run build`，再在仓库根：

```bash
./scripts/gen-frontend-manifest.sh
# 可选：EVIDENCE_GO_DIR=evidence/GO_20260328 ./scripts/gen-frontend-manifest.sh
```

Windows：`.\scripts\gen-frontend-manifest.ps1`（可选 `$env:EVIDENCE_GO_DIR`）。产出见 [evidence/README.md](evidence/README.md)。

过门目录填妥 **`manifest.json`** / **`manifest.sha256`** 后，可机读校验（**不**替代 **08-2/08-4** 人工项）：

```bash
bash scripts/validate-evidence-manifest.sh validate evidence/GO_YYYYMMDD
# 可选：同时核对 artifacts 文件与登记 sha256 一致
bash scripts/validate-evidence-manifest.sh validate evidence/GO_YYYYMMDD --verify-artifact-files
bash scripts/validate-evidence-manifest.sh self-test
```

实现：`scripts/dev/validate_evidence_manifest.py`（**Python 3** 标准库）。详见 [evidence/README.md](evidence/README.md) **manifest 格式与必填字段**。

**IMP-EV-001**：**`evidence/GO_20260409`** 为仓库内**唯一**机读基线（frozen baseline，**禁止**在常规 PR 中改其内容）。**凡含 `manifest.json` 的新增或变更 evidence bundle**（新 **`GO_YYYYMMDD`**、**`GO_RC_*`** 等），在**合并入 `main` 之前**须已通过 **`python3 scripts/dev/validate_evidence_manifest.py validate <DIR> --emit-summary --verify-artifact-files`**（**`scripts/validate-evidence-manifest.sh`** **参数透传**）；否则 **一律禁止合并**。**`main`** 须将 **`Evidence manifest validate / IMP-EV-001 validate + JSON summary`** 设为 **required status check**。细则与 CI 编排见 **[docs/runbook/evidence-gate.md](docs/runbook/evidence-gate.md)**。

<a id="sqlx-migration-pr-checklist"></a>

## PR 检表：新增 SQLx 迁移（IMP-DB-002）

向 **`crates/api/migrations/`** 增加或实质修改 **`.sql`** 时，PR **描述或评审**中须能回答（与 [04 §四](docs/spec/04-后端与API.md) **数据库迁移策略（P0）**、[41](docs/spec/41-后端数据库接库与落地清单.md)、[55 §1.2](docs/spec/55-阶段-数据同步与数据库功能同步.md) **O10** 对读）：

- [ ] **回滚或前滚修复路径**：本次 schema 变更的 **down migration**、**备份恢复** 或 **前滚热修脚本** 方案之一已写明（**不要求** 历史迁移一次性补全 **down**）。
- [ ] **数据一致性影响**：是否锁表 / 是否需双写或回填；若有破坏性变更，与 **RUNBOOK §2.6** 发版回滚叙事可衔接。
- [ ] **文档联动**：若本 PR 新增迁移文件，**须** 计划同批或跟进更新 **55 §1.2** 迁移一览、**04**/**41** 接库范围（**O10** 纪律）。

## 变更类型与文档义务

- **新增或修改 `/api/v1/*` 路由**：同步 [04 §3.4](docs/spec/04-后端与API.md)、前端 `lib/api.ts` / `apiClient`，并按 [14](docs/spec/14-合约-API-ABI-前后端对齐.md) 核对；合并前建议 **`bash scripts/run-check-04-routes.sh`**（首步即校验 §3.4 API 主表 vs 已挂载 **`.route`**）。
- **新增或修改前端 `app/` 正式页面路由**（与 [04 §3.4](docs/spec/04-后端与API.md) **前端页面路由表**、[13-1](docs/spec/13-1-UI产品级SSOT与页面规范.md) **表 1** 同批）：按 [07 §二 2.4](docs/spec/07-开发流程与顺序.md) 复核 [59 §一 A1](docs/spec/59-企业级全域检查清单与文档补充计划.md)（fail-closed）；合并前建议跑 **`run-check-04-routes`**（见上文「**04 / 14 HTTP 机读路由表与门禁锚点冻结**」）。
- **P5-4 治理分配叙事（Epic 封口）**：规格 [04 · P5-4](docs/spec/04-后端与API.md#p5-4-epic-governance-distribution)、总卷 [evidence/GO_P5_4_CLOSE.md](evidence/GO_P5_4_CLOSE.md)、母表 [docs/任务母表.md](docs/任务母表.md)（检索 **P5-4** / **P5-4-1** / **P5-4-2** / **P5-4-3**）；验收 **`cd frontend && npm test -- --run`** 与 **`bash scripts/run-check-04-routes.sh`**（与 **GO_P5_4_CLOSE** 内命令块一致）。
- **合约事件 / ABI**：更新 `contracts/abi/`、`frontend` 内 ABI 映射；勿只改链上不改 API 文档。
- **08-3 / 08-4 门禁叙事或跨文档指针**：合并前建议 `bash scripts/check-08-consistency.sh`（可选 `BASE_REF`）、`bash scripts/check-08-evidence-pointer.sh`（见 [scripts/README.md](scripts/README.md) **§二「CI 门禁」**；**机读入口总览** [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**08-3/08-4 机读预检（一致性 · evidence 指针）**」行、**§二 2.3**；**不替代** [08-2 审查二](docs/spec/08-2-附录-闭合工单表.md)；CI：[check-08-consistency.yml](.github/workflows/check-08-consistency.yml)、[check-08-evidence-pointer.yml](.github/workflows/check-08-evidence-pointer.yml)）。
- **架构、总表排期、经济·治理专题（`80`/`81`/`82`、**`83`/`84`**、`governance-token/`）**：按 [07 §二 2.4](docs/spec/07-开发流程与顺序.md) 最小同步集合更新 `00` 索引、总表、**07 §零 0.3**（及 [00-文档体系与阅读串联](docs/spec/00-文档体系与阅读串联.md) 兼容壳关键词）等（fail-closed）。**机读入口总览**见 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**治理文档联动（CI）**」行。**若改动 83 §3 / 84 §一 / 08-4-附录** 结构或百分数：须同批对齐 [08-4-附录](docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md)、[governance-token/03](docs/spec/governance-token/03-对外材料-PPT与白皮书数据页摘抄索引.md)，并在项目根执行 `bash scripts/check-governance-doc-linkage.sh`（Windows：**`.\scripts\check-governance-doc-linkage.ps1`**，须 **Git Bash**，委托 `.sh`；[scripts/README.md](scripts/README.md) **§二「CI 门禁」** **`check-governance-doc-linkage`** 行；CI：[governance-doc-linkage-gate.yml](.github/workflows/governance-doc-linkage-gate.yml) — 首步即 linkage，同文件另跑 **`check-07-version-triple.sh`**）。**若 bump 84 文首版本或改 `crates/api/src/routes/governance_doc_reference.rs` 内 `protocol_reference_json`**：保持 **`DOC_VERSION`** 与 linkage 一致，并 **`cargo test -p traveltrust-api` `routes::governance_doc_reference`** 绿（与 [04 §3.4 `protocol-reference`](docs/spec/04-后端与API.md) 同批习惯）。
- **`crates/api/src` 大改**（易触达 **50-O-B2** 行数上限）：合并前建议 `bash scripts/check-48-line-count.sh`（严格模式 **`STRICT=1 bash scripts/check-48-line-count.sh`**）；见 [48 §1.1](docs/spec/48-后端模块化拆分与落地清单.md)、[scripts/README.md](scripts/README.md) **§二「CI 门禁」**；入口总览 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**API 单文件行数 · 27-archived 链（50-O-B2 · 工具）**」行、**§二 2.3**。
- **批量改动 `docs/spec/27-archived/` 下 Markdown 相对链接**：可 `bash scripts/fix_27_archived_links.sh`（须 **perl**、**Git Bash**）；说明见 [27-archived/README](docs/spec/27-archived/README.md)、上文 **07** 读前摘要同表行、**scripts/README** **§二「CI 门禁」**。
- **阶段规格文件（`docs/spec/90～550` 主表登记）**：合并前建议执行 `bash scripts/check-wave-phase-files.sh`（Windows：**`.\scripts\check-wave-phase-files.ps1`**，须 Git Bash），防止误删 `NNN-*.md`（见 [scripts/README.md](scripts/README.md) **§二「CI 门禁」** **`check-wave-phase-files`** 行；入口总览见 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**阶段规格文件存在性**」行、**§零 0.4**；CI：[check-wave-phase-files.yml](.github/workflows/check-wave-phase-files.yml)）。
- **AI 任务卡索引一览表（`docs/AI任务卡索引.md`）**：见下文 **[main · AI 任务卡索引一览门禁](#main-branch-ai-index-gate)**（**须** 本地严格通过后再提交；**main** 上须将 CI 检查 **`AI task card index overview / check`** 设为必过）。
- **密钥与生产配置**：勿提交 `.env`、私钥；仅更新 `.env.example` 与 [ops/RUNBOOK.md](ops/RUNBOOK.md) 中已约定的说明。

<a id="main-branch-ai-index-gate"></a>

## main · AI 任务卡索引一览门禁

### 提交者（凡 `git diff` 含 `docs/AI任务卡索引.md`）

**须**在 **`git commit`** 或 **`git push`** 之前于仓库根执行，且 **exit 0**（**严格模式**，**不传** **`--allow-seq-gaps`**）：

```bash
python3 scripts/check-ai-task-card-index-overview.py docs/AI任务卡索引.md
```

**`--allow-seq-gaps`** 仅允许用于**排障或临时分支**，**不得**作为合并 **`main`** 前的默认门槛。失败时脚本在 **stderr** 输出机读行：**`RULE=`**、**`seq=`**、**`id=`**、**`msg=`**（含义见 [scripts/README.md](scripts/README.md) 篇首与 **§二** **`check-ai-task-card-index-overview.py`**）。

### 维护者（将 CI `check` job 设为 `main` 必过）

Workflow 文件：[`.github/workflows/check-ai-task-card-index-overview.yml`](.github/workflows/check-ai-task-card-index-overview.yml)。在 GitHub **Actions** 中对应的 **必过检查显示名**为：

**`AI task card index overview / check`**

（由 workflow 的 **`name: AI task card index overview`** 与 job id **`check`** 组成；若将来改名，以 **Actions** 里该 workflow **最近一次成功 run** 的 job 名为准。）

**操作路径（二选一）**

1. **Repository rulesets**：**Settings** → **Rules** → **Rulesets** → 编辑针对 **`main`**（或 **Default**）的规则 → **Require status checks to pass** → **Add checks** → 搜索 **`AI task card index overview`** 或 **`check`** → 勾选 **`AI task card index overview / check`** → 保存。
2. **Classic branch protection**：**Settings** → **Branches** → **Branch protection rules** → 编辑 **`main`** → **Require status checks to pass before merging** → 同上勾选。

**首次启用前**：须让该 workflow 在仓库上至少 **成功完成一次**（合并本配置后的 push，或 **Actions** → 选中 **`AI task card index overview`** → **Run workflow**），否则规则集下拉里可能 **尚不出现** 该检查名。

## 行为与安全

- 遵循仓库已有风格：Rust/TS 与周边文件保持一致，避免无关大重构。
- 用户规则与 Cursor 技能中有项目约定时，以之为准。

若 PR 只修文档，仍建议本地打开被改链接做一次相对路径核对（尤其 `docs/spec` 互链）。
