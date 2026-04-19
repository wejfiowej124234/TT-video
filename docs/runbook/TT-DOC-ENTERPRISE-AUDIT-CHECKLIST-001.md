# TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001 · 全仓文档企业级审计清单（按序执行）

**Version:** 1.0.1  
**Status:** 清单（**不**替代各篇 SSOT 正文；**不**自动 bump **07**/**spec/00** 版本 —— 若本轮要合 **07/00/缺口总表** 台账，须单独标明 **「台账同批」** 或 **「合 07 门禁」**）  
**范围**：`docs/`（含 `spec/`、`product-manager/`、`runbook/`）、根 `README.md` / `CONTRIBUTING.md` / `ops/RUNBOOK.md`、与文档强绑定的 **`scripts/`**/**`.github/workflows/`** 互指。

**与既有 PM 专档关系**：产品经理子树深度结论仍以 **[`docs/product-manager/15-产品经理资料夹企业级检查与缺口清单.md`](../product-manager/15-产品经理资料夹企业级检查与缺口清单.md)**、**[`29-产品经理多维度深度检查与新增缺口.md`](../product-manager/29-产品经理多维度深度检查与新增缺口.md)** 为 **PM 域 SSOT**；本清单 **Phase 9** 与之对拍，**不**重复展开 PM 全文结论。

---

## 使用方式

| 项 | 说明 |
|----|------|
| **顺序** | 默认 **Phase 0 → 12**；若本轮仅做「发版前文档闸」可从 **Phase 7、8** 切入，再回补 **0～3**。 |
| **留痕** | 每完成一 Phase：记录 **日期、执行人、仓库 SHA、结论（PASS/ GAP / N/A）、跟进单号或 PR#**。 |
| **自动化** | 表内 **「机读」** 行优先于纯人工通读；失败项再下钻到具体 `.md`。 |
| **退出标准** | 单 Phase：**全部勾选完成** 或 **已登记豁免/缺口owner**；**全仓一轮**：Phase 0～12 至少各 **1** 次 PASS 或 **已文档化例外**。 |

---

## 机读一键聚合（TT-DOC machine）

项目根执行 **`bash scripts/doc-enterprise-audit-machine-phases.sh`**（薄转发 → **`scripts/gates/doc-enterprise-audit-machine-phases.sh`**）。**默认快路径**：**07 版本三线** → **AI 任务卡索引一览** → **`docs/` 相对 Markdown 链接**（**默认排除** **`docs/spec/27-archived/**`** 与 **`docs/AI任务卡索引.from-stash.md`**；链接步 **默认 warn-only、exit 0**，设 **`DOC_AUDIT_LINKS_ENFORCE=1`** 则任一条断链 **exit 1**）。**全量（慢）**：**`DOC_AUDIT_FULL=1`** 再跑 **`check-55-s13`** + **`run-check-04-routes`**。跳过子步：**`DOC_AUDIT_SKIP_07`** / **`DOC_AUDIT_SKIP_AI`** / **`DOC_AUDIT_SKIP_LINKS`** **=1**。单独跑链接脚本：**`python3 scripts/gates/check-doc-markdown-relative-links.py`**（**`--enforce`**、**`--no-default-excludes`**、**`--exclude-glob`** 见 **`--help`**）。

---

## Phase 0 · 元规则与入口 SSOT

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 0.1 | **`docs/00-文档索引.md`** 是否为 **docs 树跨类导航主入口**（与 `spec/00` 分工清晰） | 打开核对 **「按类单入口」「重复入口」** 两表是否仍与现状一致 |
| 0.2 | **`spec/00-文档索引.md`** 仍为 **spec 内** 列表/版本 **SSOT** | 抽查 **07/04/110** 行是否可从 00 直达 |
| 0.3 | 禁止 **未经登记** 新增「第三张全站文档总表」 | 对照 **00 §维护** 原则；新入口须 **增行登记** |
| 0.4 | AI 协作边界（**勿误改 07/00/缺口长表**）被团队知晓 | **[`.cursor/rules/traveltrust-ai-collab.mdc`](../../.cursor/rules/traveltrust-ai-collab.mdc)** + **[`docs/AI协作话术-减负与边界.md`](../AI协作话术-减负与边界.md)** |

---

## Phase 1 · 开发流程与阶段真值（07）

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 1.1 | **当前阶段**、**读前摘要**、**§二/§四** 与仓库实际里程碑一致 | [`spec/07-开发流程与顺序.md`](../spec/07-开发流程与顺序.md) |
| 1.2 | **版本三线**（07 / spec/00 §六 / **§6.5**）未被静默破坏 | 若改过 **07 `Version:`** → 必须同批 **spec/00** + **`bash scripts/check-07-version-triple.sh`** |
| 1.3 | **完成度 %**（文首）未在「纯文档轮无业务合入」被误改 | 见 **07 §6.6** 复审注 |

---

## Phase 2 · API / 路由契约（04 与门禁）

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 2.1 | **04 §3.4** 路由表与 **`crates/api`** 中 **`.route`** 一致 | **机读**：`bash scripts/run-check-04-routes.sh`（含 04 vs code、前端路由等串联） |
| 2.2 | **Read API / 治理 / 管理** 变更已走 **Read Contract** 模板（若适用） | [`docs/runbook/ai-template-read-only-api.md`](ai-template-read-only-api.md)、**CONTRIBUTING** Read API 段 |
| 2.3 | **13-1** 表 1 与 **04** 前端路径表覆盖关系 | 同上脚本链中 **13-1** 相关步 |

---

## Phase 3 · 缺口与 P0 官方总表

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 3.1 | **[`docs/spec/缺口与待补-官方总表.md`](../spec/缺口与待补-官方总表.md)** 与 **go-live §11 映射** 无互斥 | 对照 **[`docs/go-live-checklist.md`](../go-live-checklist.md)** **P0 覆盖映射表** |
| 3.2 | **15 附录〇** / **B-309 映射**（若在用）与母表行号仍有效 | [`docs/spec/15-附录〇与缺口官方总表-P0行映射-B309.md`](../spec/15-附录〇与缺口官方总表-P0行映射-B309.md) |
| 3.3 | **任务母表** `B-xxx` 与 **AI任务卡索引** 封口态一致 | [`docs/任务母表.md`](../任务母表.md)、[`docs/AI任务卡索引.md`](../AI任务卡索引.md) **机读**：`python3 scripts/check-ai-task-card-index-overview.py docs/AI任务卡索引.md` |

---

## Phase 4 · 合约 / ABI / 链上对齐（14、contracts）

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 4.1 | **contracts/README** 与 **部署网络** 叙事一致 | [`contracts/README.md`](../../contracts/README.md) |
| 4.2 | **ABI** 与 **forge**/**`contracts/abi`**/**前端 dapp abis** 同步策略被遵守 | **`bash scripts/check-55-s13.sh`**（或 Win 等价）；见 **14 §1.2**、**CONTRIBUTING** |
| 4.3 | **110**（索引器）与内部 API 叙述未与 **04** 冲突 | [`spec/110-阶段开发链上索引器与事件同步器.md`](../spec/110-阶段开发链上索引器与事件同步器.md) 抽样对读 |

---

## Phase 5 · CI/CD、脚本与可观测性

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 5.1 | **`.github/workflows/`** 与 **CONTRIBUTING「建议走 PR」路径**一致（改 workflow 须有意识） | 目录审查 + 保护分支规则（团队 Settings） |
| 5.2 | **`scripts/README.md` / `scripts/INDEX.md`** 与 **根薄转发** 策略一致（B-184） | [`scripts/README.md`](../../scripts/README.md)、[`scripts/INDEX.md`](../../scripts/INDEX.md) |
| 5.3 | **L4 parallel CI** 叙事与 **组织 Billing / `L4_CI_DOTENV_B64`** 现状对拍 | [`TT-L4-PARALLEL-CI-001.md`](TT-L4-PARALLEL-CI-001.md)、**`bash scripts/gh-l4-run-inspect.sh`** |
| 5.4 | **主分支 AI 索引门禁**（若启用）仍可达 | **CONTRIBUTING** · **main-branch-ai-index-gate** |

---

## Phase 6 · 回归、证据包与 93 矩阵

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 6.1 | **R-001 / R-002 / R-003 / R-004** 互指与 **93 §7.1** 一致 | [`spec/R-001`](../spec/R-001-全站回归报告模板与汇总JSON结构.md) 等、`93` |
| 6.2 | **`evidence/README`** 与 **manifest** 格式仍适用 | [`evidence/README.md`](../../evidence/README.md) |
| 6.3 | **staging / prod** 口径在 `report.json` 与 checklist 中可追踪 | **go-live §0.3**、**R-002** |

---

## Phase 7 · 发布、主网与运维

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 7.1 | **go-live-checklist** 与 **TT-MAINNET** 互指无断链 | [`docs/go-live-checklist.md`](../go-live-checklist.md)、[`TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md`](TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md) |
| 7.2 | **`ops/RUNBOOK.md`** 值班 / 资损 / Check-G 段落与 **08-2/08-4** 不冲突 | [`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) 抽样 |
| 7.3 | **测试网五步入口** 仍为 **`TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST`** | [`TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md`](TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md) |

---

## Phase 8 · 产品经理资料夹（与工程 SSOT 对拍）

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 8.1 | **`docs/product-manager/README.md`** 阅读顺序与 **00 入口** 一致 | [`../product-manager/README.md`](../product-manager/README.md) |
| 8.2 | **对外数字、代币叙事、合规** 均要求 **回 spec 核对** 的原则仍醒目 | [`04-合规与风险门禁资料包`](../product-manager/04-合规与风险门禁资料包.md)、**PM README** |
| 8.3 | **企业级检查结论**（15）与 **深查缺口**（29）中的 **OPEN GAP** 是否有 owner / 下一动作 | [**15**](../product-manager/15-产品经理资料夹企业级检查与缺口清单.md)、[**29**](../product-manager/29-产品经理多维度深度检查与新增缺口.md) |
| 8.4 | **上线验收清单（33）** 与 **go-live / R-002** 要求一致 | [`33-上线验收与发布门禁清单.md`](../product-manager/33-上线验收与发布门禁清单.md) |
| 8.5 | **会议纪要** 类文件是否已 **互指工程 Runbook** 或 **母表** | 例：[`会议纪要-2026-04-17-测试网Treasury.spend与总验收收口.md`](../product-manager/会议纪要-2026-04-17-测试网Treasury.spend与总验收收口.md) |

---

## Phase 9 · 架构与跨域路线图（非实施卡）

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 9.1 | **PostgreSQL 分层路线图** 仍标注 **「勿整份单卡实施」** | [`docs/architecture/postgresql-layered-evolution-roadmap.md`](../architecture/postgresql-layered-evolution-roadmap.md) |
| 9.2 | **docs/00** 表内 **B-474～B-485** 链接可解析 | [`docs/00-文档索引.md`](../00-文档索引.md) §1 |

---

## Phase 10 · 死链、重复与「第三入口」

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 10.1 | 全站 **相对链接**（尤其 `docs/spec` ↔ `docs/runbook`）抽样点击或脚本 | **机读**：**`python3 scripts/gates/check-doc-markdown-relative-links.py`**（与上文 **「机读一键聚合」** 同源；历史缺口多时默认 **warn-only**，收口阶段可 **`DOC_AUDIT_LINKS_ENFORCE=1`**） |
| 10.2 | **同一主题** 仅 **一** 主入口（00 §2 **重复入口** 表） | 新增长文须 **先** 定主入口再写作 |
| 10.3 | **`docs/spec/27-archived`** 与现行 **07** 无叙事冲突 | 抽样；**tail** 长表仅按团队规则更新 |

---

## Phase 11 · 安全、审计与第三方可读性

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 11.1 | **仓库内无** 真实 **私钥、生产口令、完整 `.env`** 误提交 | `git log` / secret scan 工具（团队策略） |
| 11.2 | **evidence/** 与 **manifest** 的 **签核链** 与 **Runbook Check-G** 叙述一致 | **go-live §11.14～11.18**、**ops/RUNBOOK §2.7.4** |
| 11.3 | **对外文案**（PM 25/26/27 等）标 **初稿/待法审** | PM 各篇文首或 **README** 原则 |

---

## Phase 12 · 本轮收口与登记

| # | 检查项 | 证据 / 动作 |
|---|--------|-------------|
| 12.1 | 产出 **本轮审计记录**（一页即可）：范围、SHA、PASS/GAP、跟进列表 | 可放 **`evidence/`** 或团队 wiki |
| 12.2 | **GAP** 项进入 **母表** 或 **缺口总表**（若属 P0） | 按团队 **B-xxx** 流程 |
| 12.3 | 更新 **本清单 Version** 或 **变更记录**（仅当修改本文件时） | 文末 **修订记录** |

---

## 修订记录

| 日期 | 版本 | 摘要 |
|------|------|------|
| 2026-04-19 | 1.0.0 | 首版：全仓 Phase 0～12 + PM 专档对拍说明 |
| 2026-04-19 | 1.0.1 | 登记 **TT-DOC machine** 聚合脚本 + **Phase 10.1** 机读入口；链接检查默认排除 **27-archived** / **from-stash** |

---

## 相关链接

- **docs 总入口**：[docs/00-文档索引.md](../00-文档索引.md)
- **spec 总入口**：[spec/00-文档索引.md](../spec/00-文档索引.md)
- **参与开发**：[CONTRIBUTING.md](../../CONTRIBUTING.md)
- **发版清单**：[go-live-checklist.md](../go-live-checklist.md)
