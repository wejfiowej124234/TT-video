# Contributing / 参与开发

本仓库的**开发顺序、阶段与发版门禁**以 `docs/spec` 为准；本页只列**工程侧最低标准**与入口，避免与长篇 spec 重复。

## 必读入口

| 用途 | 文档 |
|------|------|
| 阶段顺序、开工/发版 bar | [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md)（**唯一入口**：**§零**、**§二 2.5**、**§二 2.4**、**§四 4.3**、§五）；**文档审计与机器门禁一览**见 [00-文档治理总册 §8.3](docs/spec/00-文档治理总册.md#doc-audit-gates-ssot) |
| 文档命名、索引、迁移 | [00-文档治理总册](docs/spec/00-文档治理总册.md) |
| API 单源 | [04-后端与API](docs/spec/04-后端与API.md) §3.4 |
| 合约 / ABI / 前端对齐 | [14-合约-API-ABI-前后端对齐](docs/spec/14-合约-API-ABI-前后端对齐.md) |
| 缺口与迭代优先级 | [缺口与待补-官方总表](docs/spec/缺口与待补-官方总表.md)、[51-阶段开发技术文档](docs/spec/51-阶段开发技术文档.md) |
| 脚本与门禁 | [scripts/README.md](scripts/README.md) |
| 本地起停（Win / Unix · Next 15 · 3012） | [scripts/README.md](scripts/README.md) **§一「日常开发」** 与篇首**快速使用**；[07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**本地开发起停（Win · Unix · Next 15）**」行；[docs/测试账号与本地联调.md](docs/测试账号与本地联调.md) |
| 旧文档 / 归档 / 现行分层（可读性整理） | [00-文档使用分层说明-旧整合与现行SSOT](docs/spec/00-文档使用分层说明-旧整合与现行SSOT.md) |
| **与 AI 协作（减负话术 · 项目规则）** | [AI协作话术-减负与边界](docs/AI协作话术-减负与边界.md)；Cursor 见 [.cursor/rules/traveltrust-ai-collab.mdc](.cursor/rules/traveltrust-ai-collab.mdc)（`alwaysApply`） |

## 提 PR 前（本地）

在根目录执行（按你改动范围取舍）：

```bash
# 后端
cargo check -p traveltrust-api
cargo test -p traveltrust-api

# 前端
cd frontend && npm run lint && npx tsc --noEmit && npm test
```

可选（工台基线与依赖审计，与 **`pre-release-automation`** 首段同源）：`bash scripts/check-invariants.sh`、`bash scripts/audit-deps.sh`。Windows：`.\scripts\check-invariants.ps1`；**audit-deps** 须 **Git Bash** 执行 `bash scripts/audit-deps.sh`。总览见 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**工台基线 · 依赖审计（invariants · audit-deps）**」行、[scripts/README.md](scripts/README.md) **§二「CI 门禁」**。

### 路由与 `04` / `13-1` / `frontend/app` 契约（建议）

改动 **[04 §3.4](docs/spec/04-后端与API.md)**（**API 主表**或**前端页面路由表**）、**[13-1 表 1](docs/spec/13-1-UI产品级SSOT与页面规范.md)** 或 **`frontend/app/**/page.tsx`** 正式路由时，仓库根执行（须 **Python 3**，与 **Build** CI 同源）：

```bash
bash scripts/run-check-04-routes.sh
```

串联四步：**`check-04-routes-vs-code.py`**（§3.4 API 表 vs `crates/api` **`.route`**）→ **`check-04-frontend-routes-vs-app.py`** → **`check-13-1-table1-routes-vs-app.py`** → **`check-13-1-routes-covered-by-04-frontend-table.py`**（**13-1 表 1** ⊆ **04** 前端路径表）。默认 **`STRICT_WARNINGS=1`**（与 CI 一致；排障可 `STRICT_WARNINGS=0`）。

Windows：`.\scripts\run-check-04-routes.ps1`。命令参数、**`STRICT_WARNINGS`** 与 **59**/**14 §2.1**/**07 §二 2.4·A1** 配套说明见 [scripts/README.md](scripts/README.md) **§三** 验收清单表内 **`run-check-04-routes`** / **`check-04-routes-vs-code.py`** 行；总览见 [07 §二 2.3](docs/spec/07-开发流程与顺序.md)。**`api_router()`** **17** 域与 **ABI** 静态核对叙事见 [14-合约-API-ABI-前后端对齐 §2.1](docs/spec/14-合约-API-ABI-前后端对齐.md)；全域检查清单篇首机读互链见 [59](docs/spec/59-企业级全域检查清单与文档补充计划.md)。

改动 **合约** 或 **`contracts/abi` / `frontend/dapp/abis`** 时：在 `contracts/` 下 `forge build` / `forge test`，按 [scripts/README.md](scripts/README.md) **§三** **`sync-abi-from-forge`** / **`check-55-s13`** 行同步 ABI，并执行 `bash scripts/check-55-s13.sh`（Windows：`.\scripts\check-55-s13.ps1`）。契约与 **sync-abi → dapp/abis → 55-S13** 有序清单见 [14 §1.2](docs/spec/14-合约-API-ABI-前后端对齐.md)、[ops/RUNBOOK.md](ops/RUNBOOK.md) **§12.4**；总览见 [07 §二 2.3](docs/spec/07-开发流程与顺序.md) **55-S13** 子弹与文首**读前摘要**「**ABI·55-S13**」行。**上测试网/主网前**：须先 **Anvil** 本地闭环（订单主路径 + 治理相关 **Target** 若已开发），见 [contracts/README](contracts/README.md)、[Runbook §2.56](ops/RUNBOOK.md)、[governance-token/02 §1.3](docs/spec/governance-token/02-对内技术规格-草案.md)、[07 §二 Phase 3](docs/spec/07-开发流程与顺序.md)。

## API 已启动时的快速验收（可选）

与 [07 §二 2.3](docs/spec/07-开发流程与顺序.md)、[缺口与待补-官方总表 P1-E](docs/spec/缺口与待补-官方总表.md) 一致，用于联调留痕（**不替代** 01 §9 E2E 三项）：

```bash
./scripts/check-55-quick-verify.sh
# 或（须全部为 200）：./scripts/smoke-api-public-routes.sh
```

Windows：`.\scripts\check-55-quick-verify.ps1`；**严格 200 冒烟**（与 Bash 版 smoke 等价）：`.\scripts\smoke-api-public-routes.ps1`。发版前机器聚合：Linux/Mac `SKIP_FORGE_VERIFY=1 ./scripts/pre-release-automation.sh`；Windows `$env:SKIP_FORGE_VERIFY='1'; .\scripts\pre-release-automation.ps1`（有 Foundry 时可不设 **SKIP**）。

## Gate-5 前端 manifest（发版 / evidence）

先 `cd frontend && npm run build`，再在仓库根：

```bash
./scripts/gen-frontend-manifest.sh
# 可选：EVIDENCE_GO_DIR=evidence/GO_20260328 ./scripts/gen-frontend-manifest.sh
```

Windows：`.\scripts\gen-frontend-manifest.ps1`（可选 `$env:EVIDENCE_GO_DIR`）。产出见 [evidence/README.md](evidence/README.md)。

## 变更类型与文档义务

- **新增或修改 `/api/v1/*` 路由**：同步 [04 §3.4](docs/spec/04-后端与API.md)、前端 `lib/api.ts` / `apiClient`，并按 [14](docs/spec/14-合约-API-ABI-前后端对齐.md) 核对；合并前建议 **`bash scripts/run-check-04-routes.sh`**（首步即校验 §3.4 API 主表 vs 已挂载 **`.route`**）。
- **新增或修改前端 `app/` 正式页面路由**（与 [04 §3.4](docs/spec/04-后端与API.md) **前端页面路由表**、[13-1](docs/spec/13-1-UI产品级SSOT与页面规范.md) **表 1** 同批）：按 [07 §二 2.4](docs/spec/07-开发流程与顺序.md) 复核 [59 §一 A1](docs/spec/59-企业级全域检查清单与文档补充计划.md)（fail-closed）；合并前建议跑 **`run-check-04-routes`**（见上文「路由与契约」）。
- **合约事件 / ABI**：更新 `contracts/abi/`、`frontend` 内 ABI 映射；勿只改链上不改 API 文档。
- **08-3 / 08-4 门禁叙事或跨文档指针**：合并前建议 `bash scripts/check-08-consistency.sh`（可选 `BASE_REF`）、`bash scripts/check-08-evidence-pointer.sh`（见 [scripts/README.md](scripts/README.md) **§二「CI 门禁」**；**机读入口总览** [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**08-3/08-4 机读预检（一致性 · evidence 指针）**」行、**§二 2.3**；**不替代** [08-2 审查二](docs/spec/08-2-附录-闭合工单表.md)；CI：[check-08-consistency.yml](.github/workflows/check-08-consistency.yml)、[check-08-evidence-pointer.yml](.github/workflows/check-08-evidence-pointer.yml)）。
- **架构、总表排期、经济·治理专题（`80`/`81`/`82`、**`83`/`84`**、`governance-token/`）**：按 [07 §二 2.4](docs/spec/07-开发流程与顺序.md) 最小同步集合更新 `00` 索引、总表、**07 §零 0.3**（及 [00-文档体系与阅读串联](docs/spec/00-文档体系与阅读串联.md) 兼容壳关键词）等（fail-closed）。**机读入口总览**见 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**治理文档联动（CI）**」行。**若改动 83 §3 / 84 §一 / 08-4-附录** 结构或百分数：须同批对齐 [08-4-附录](docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md)、[governance-token/03](docs/spec/governance-token/03-对外材料-PPT与白皮书数据页摘抄索引.md)，并在项目根执行 `bash scripts/check-governance-doc-linkage.sh`（[scripts/README.md](scripts/README.md) **§二「CI 门禁」** **`check-governance-doc-linkage`** 行；CI：[governance-doc-linkage-gate.yml](.github/workflows/governance-doc-linkage-gate.yml)）。**若 bump 84 文首版本或改 `crates/api/src/routes/governance_doc_reference.rs` 内 `protocol_reference_json`**：保持 **`DOC_VERSION`** 与 linkage 一致，并 **`cargo test -p traveltrust-api` `routes::governance_doc_reference`** 绿（与 [04 §3.4 `protocol-reference`](docs/spec/04-后端与API.md) 同批习惯）。
- **`crates/api/src` 大改**（易触达 **50-O-B2** 行数上限）：合并前建议 `bash scripts/check-48-line-count.sh`（严格模式 **`STRICT=1 bash scripts/check-48-line-count.sh`**）；见 [48 §1.1](docs/spec/48-后端模块化拆分与落地清单.md)、[scripts/README.md](scripts/README.md) **§二「CI 门禁」**；入口总览 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**API 单文件行数 · 27-archived 链（50-O-B2 · 工具）**」行、**§二 2.3**。
- **批量改动 `docs/spec/27-archived/` 下 Markdown 相对链接**：可 `bash scripts/fix_27_archived_links.sh`（须 **perl**、**Git Bash**）；说明见 [27-archived/README](docs/spec/27-archived/README.md)、上文 **07** 读前摘要同表行、**scripts/README** **§二「CI 门禁」**。
- **阶段规格文件（`docs/spec/90～550` 主表登记）**：合并前建议执行 `bash scripts/check-wave-phase-files.sh`（Windows：**`.\scripts\check-wave-phase-files.ps1`**，须 Git Bash），防止误删 `NNN-*.md`（见 [scripts/README.md](scripts/README.md) **§二「CI 门禁」** **`check-wave-phase-files`** 行；入口总览见 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 文首**读前摘要**「**阶段规格文件存在性**」行、**§零 0.4**；CI：[check-wave-phase-files.yml](.github/workflows/check-wave-phase-files.yml)）。
- **密钥与生产配置**：勿提交 `.env`、私钥；仅更新 `.env.example` 与 [ops/RUNBOOK.md](ops/RUNBOOK.md) 中已约定的说明。

## 行为与安全

- 遵循仓库已有风格：Rust/TS 与周边文件保持一致，避免无关大重构。
- 用户规则与 Cursor 技能中有项目约定时，以之为准。

若 PR 只修文档，仍建议本地打开被改链接做一次相对路径核对（尤其 `docs/spec` 互链）。
