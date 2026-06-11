# 工程师读本 · `engineering/`（生产级技术文档入口）

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本（**同 PR** 常见例：**`bash scripts/run-check-04-routes.sh`**、**`bash scripts/check-55-s13.sh`**）；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。**本目录**（含 **`engineering/README`**) **仅为导读**，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。
>
> **团队口径（治理收敛）**：与上段同条。**触及 HTTP** 须 **04 §3.4** + **`run-check-04-routes`** 等脚本 **同 PR**；**触及 ABI / 链上镜像** 须 **14** + **`contracts/`** + **`check-55-s13`**（等）**同 PR**（细则 **[02](./02-生产级文档约束与合入门禁.md)**、**[04 · §1a](./04-HTTP与路由契约导读.md#hb-eng-04-drift-checklist)**、**[50 · §5](./50-链上与ABI导读.md#b50-5-usage)**、**[09 §10b～§10c](./09-文档迁移覆盖审计报告.md#audit-handbook-constraints)**）。`engineering/` **只**允许导读、外链与文内可执行验证段；**禁止**靠扩写 handbook、复制 **spec** 表体或增篇数冒充对齐；**禁止**为提高覆盖率而扩写或新增 **`engineering/`** **主序** **`NN-*.md`**。**单维护者**时 **Owner / 对拍** 读法见本文 **[独立开发](#eng-solo-dev)** 与 **[solo-dev-rhythm §7](../../solo-dev-rhythm.md)**。
>
> <a id="eng-spec-release-audit-ci-ssot"></a>
>
> **发版 / 外验 / 审计 / CI 真源 + `engineering/` 替代 `spec` 路径**：**展开叙述与架构落位**见主序 **[25-横切-发版外验审计与CI真源及eng替代spec路径](./25-横切-发版外验审计与CI真源及eng替代spec路径.md)**（**Diátaxis**：**Reference** 仍在 **95 / 96 / go-live / 07** 与 **workflow**；**Explanation** 在本目录 **NN-** 主序）。本锚点保留**一句话**：在删 **`docs` 下 `spec` 子树** 之前与之后，**95 / 96 / go-live（+07）** 在发版·审计·CI **设计**维度的 **Reference** 地位**不因 handbook 扩写而降级**；开发期减负见 **[TT 清单 §0](../../runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md)**。

**Version:** 1.7.37 · **最后更新：** 2026-04-30  
**受众**：本仓库**程序员**（后端 / 前端 / 合约 / 全栈 / 工具链）；**单维护者**时 **Owner=本人**、节奏与删 spec 互链 **[solo-dev-rhythm §7](../../solo-dev-rhythm.md)**  
**状态**：现行  
**与 spec 关系**：本目录为 **Explanation + How-to 导读** 的主承载区；真源以段首 **SSOT（必读）** 与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**「仍须打开的 SSOT」列为准（**不**以本段扩写替代 **04 §3.4 / 93 / 14 / 代码与脚本**）。**`EVIDENCE-*` / `_TEMPLATE`** **Version** **以各文件文首为准**；**[spec/00 · 文档版本与最后更新](../../spec/00-文档索引.md#文档版本与最后更新)** **母表** **仅列** **`engineering/00～50`** **主序** **+** **本 README**/**`adr/README`**（**同页** **「文档版本与最后更新」** **节前说明段** **加粗** **`handbook/engineering` 版本母表边界**）。

> **治理收敛**：与上段 **团队口径** 同条；与 **spec** 冲突时**不得**「以 handbook 为准」。**删除 `docs` 下 `spec` 子树** 须 **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** + **[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）及 **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)** 五条件、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** 等程序同批；**禁止**仅凭本目录叙事推动删 spec 或全量扩写替代表体。

**簇态台账（与 `09`/`08` 对拍）**：**[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)** / **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** — **spec/01～03** 叙事已在 **corpus/REG-01～03** + **[03](./03-系统架构与仓库骨架.md)** / **[20-B](./20-B-订单机制.md)** 登记 **migrated**，**08** 对应行 **覆盖度 full**（**不**抄 **spec** 表体；**删除 spec** 列仍为 **no**）。**P-D** 删除候选 / 保留清单（工程草案）、**四门对拍矩阵**（**[08 §3.1a](./08-文档与spec迁移台账.md#mig-pd-quad-gate-matrix)**；**工程对拍** 列）、**工程逐项对拍**（**[08 §3.1b](./08-文档与spec迁移台账.md#mig-pd-engineering-rowwise)**）与 **Owner 对拍表** 见 **[08 §3.1](./08-文档与spec迁移台账.md#mig-pd-delete-candidate-retain)**（**不**授予删库；**P-C** 收口后见 **[盘点 §7.5.4](../../spec-path-dependency-migration-inventory.md)**）。**仍 partial** 的簇见 **09 §3**（**00**、**93 矩阵**、**05/06/13→24**、**根余量**）。

<a id="eng-solo-dev"></a>

## 独立开发（单维护者）

- **Owner / 「团队」措辞**：条文中的 **Owner**、**须 Owner**、**团队对拍** → 一律视为 **你自己**；无第二审批人时 **自检即闭环**（与 **[solo-dev-rhythm · §7](../../solo-dev-rhythm.md)** 同条）。
- **`engineering/` 算不算已经满足「删 spec」标准？** **不算已获准删库。** 本目录是 **导读 + 台账入口**，**不是**「整段 `docs/spec/` 已可 `git rm`」的充分条件。**`08 §3` 矩阵里 `覆盖度 full` ≠ `删除 spec=yes`**；当前登记下 **各路径 `删除 spec` 列仍为 `no`**（见上段 **簇态台账**）。真正删除 `docs/spec/` 下某路径仍须 **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)** 五条件、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**、**CI/链接/盘点/registry** 等 **同批** 程序链。**人数变少不缩短程序链**，只缩短 **沟通链**（删径仍建议 **专 PR**，可与 **[solo-dev-rhythm](../../solo-dev-rhythm.md)** 节奏对齐）。

**域篇与横切（本目录全部 `NN-*.md`）**：成稿须在「**先读**」上一段保留 **`SSOT 边界（防误用）`** 块引（**04 / 93**、本篇对应 **spec**、删 **`docs` 下 `spec` 子树** 仍 **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** + **[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR**）+ **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)** + **STATUS** + **98 §2**）；新篇从 **[_TEMPLATE](./_TEMPLATE-工程模块篇.md)** 复制骨架。

---

## 本目录是什么（与「企业级文档」对齐的一句话）

按 **[Diátaxis](https://diataxis.fr/)** 分型（详见 **[手册 00 · §2.4](../00-手册总览与编制规范.md#hb-00-diataxis)**），这里主要是 **Explanation**（理解架构与真值栈）及**指向 Reference 的专业导读**；**Reference**（路由表、字段、矩阵行）仍在 **spec/04、spec/93** 与 **仓库代码**。质量条 **T1～T7** 见 **[手册 00 · §2.5](../00-手册总览与编制规范.md#hb-00-eng-quality)**。  
文档树「干净」与文件名**英文分级（L0～L3）**评审口径：**[手册 00 · §2.1.0](../00-手册总览与编制规范.md#hb-00-doc-cleanliness)**、**[§2.1.3](../00-手册总览与编制规范.md#hb-00-naming-latin-tiers)**。

---

<a id="eng-human-read-vs-spec-mess"></a>

## 为何单建 `engineering/`（你们说的「替代乱的 spec」在仓库里怎么说）

**动机（人读）**：`docs/spec/` 根目录文件多、历史叠层多，**查找与阅读成本高**。本目录把**稳定入口、域叙事、验证命令**收进 **handbook 主序**，让你**日常开发先读 `engineering/`**，再按需打开 **spec** 里的契约窗与长文锚点——这解决的是 **「乱」带来的体验**，**不是**一句话宣布 **整个 `docs/spec/` 可删**或 **04/93/14 表体已搬家**。

**边界（机读与删径）**：段首 **SSOT（必读）** 不变：**HTTP 机读、域矩阵、链上 ABI 叙述**仍以 **spec 指定章节 + 代码 + 门禁脚本**为准。要把「少用某条 spec 路径 / `git rm` 某文件」变成事实，只能走 **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[盘点 §7](../../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep)** 与 **`registry/`** 的 **逐路径专提交**程序。

**Why 落盘（提议中）**：把「人读主路径 vs 契约真源」写成正式决策记录，见 **[ADR-20260430（proposed）](../../adr/ADR-20260430-engineering-primary-read-path-vs-spec-ssot.md)**（与 **[07 · ADR 目录约定](./07-架构决策记录ADR规范.md#adr-3-location)** 同条）。**长程拆单（按优先级逐步替代）**见 **[TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST](../../runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md)**。

---

<a id="eng-read-tiers"></a>

## 阅读层级（按角色阶段，非按「聪明程度」）

| 层级 | 典型读者 | 建议顺序 | 目的 |
|------|----------|----------|------|
| **P0** | 首次合码、配环境 | [01](./01-技术真值栈-93-95-96-97与代码对照.md) → [02](./02-生产级文档约束与合入门禁.md) → [03](./03-系统架构与仓库骨架.md) → [04](./04-HTTP与路由契约导读.md) → [05](./05-本地环境与常用门禁速查.md) | 建立**真值栈与一票否决**心智 + **本地命令与门禁矩阵** |
| **P0+** | 将新增 **engineering/10+** 域篇或大规模迁 spec 叙事 | [06](./06-工程模块技术文档编制契约与验证闭环.md) + [`_TEMPLATE`](./_TEMPLATE-工程模块篇.md) + **域样板** [10-A](./10-A-认证机制.md) / [20-B](./20-B-订单机制.md) / [21-B](./21-B-市场与托管机制.md) / [23](./23-横切-07开发流程导读.md) / [24-横切-前端与UI宪法导读](./24-横切-前端与UI宪法导读.md) / [25-横切-发版外验审计与CI真源及eng替代spec路径](./25-横切-发版外验审计与CI真源及eng替代spec路径.md) / [30-C](./30-C-执行器调度机制.md) / [31-C](./31-C-治理与质押只读导读.md) / [32-横切-Wave与阶段体系导读](./32-横切-Wave与阶段体系导读.md) / [40-D](./40-D-Admin机制.md) / [41-D](./41-D-索引与对账导读.md) / [42-D](./42-D-Admin审计合规与审批.md) / [50-链上与ABI导读](./50-链上与ABI导读.md) + **[22](./22-横切-簇级verified证据模板.md)**（**簇级 verified 母版**）+ **[09](./09-文档迁移覆盖审计报告.md)**（**§10a 任务**、**§2a 量化**、**§2b / 08 §2a verified**） | **九节结构**、**SSOT**、**§12**、**`check-handbook-engineering-content`**、**[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** |
| **P1** | 日常开发、改 API / 路由 | [04](./04-HTTP与路由契约导读.md) + **实时打开** **[04 §3.4](../../spec/04-后端与API.md)**、`crates/api/src/routes/mod.rs` | **实现与契约对拍** |
| **P2** | 发版、对外验收、审计配合 | [02](./02-生产级文档约束与合入门禁.md) + **[95](../../spec/95-全链路生产就绪检查清单与完成度矩阵.md)** / **[96-索引](../../spec/96-索引-全链路外生产验收分册.md)** + **[go-live · GO](../../go-live-checklist.md#go-decision-entry-point)** | **GO / 证据链** 与文档同频 |

---

<a id="eng-truth-ladder"></a>

## 真源阶梯（冲突时：下列由上到下，**越上越不可违背**）

| 优先级 | 真源 | 说明 |
|--------|------|------|
| 1（最高） | **可执行产物** | 编译结果、**通过的门禁脚本**、生产配置已审核项 |
| 2 | **代码** | `routes/mod.rs`、合约、与 PR 一致的实现 |
| 3 | **HTTP 与域矩阵（机读）** | **[04 §3.4](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 等 |
| 4 | **spec 长文**（过渡期） | 与 1～3 无冲突时作背景；有冲突以 1～3 为准 |
| 5 | **handbook 本目录** | 导读与叙事；**不得**在 4 与 3 矛盾时「以 handbook 为准」；**不得**声称替代 **04 §3.4 / 93** 或 **`crates/`·`contracts/`·`frontend/`** 真值 |

**API / ABI（真源入口，不抄表体）**：**v1 HTTP** → **[04 §3.4](../../spec/04-后端与API.md)** + **`bash scripts/run-check-04-routes.sh`** + **`crates/api`**；**链上 ABI** → **[spec/14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/src`** / **`contracts/abi`** + **`check-55-s13`**（导读 **[50](./50-链上与ABI导读.md)**；与 **[04](./04-HTTP与路由契约导读.md)** 分工）。

---

<a id="eng-verify-cmds"></a>

## 与文档主张对齐的验证命令（默认可本地跑）

| 你刚改了 / 要证明什么 | 命令（仓库根目录） |
|------------------------|-------------------|
| API 路由与 **04 §3.4** 一致 | `bash scripts/run-check-04-routes.sh`（若仓库另有包装脚本，以 **CONTRIBUTING** 为准） |
| 后端回归（默认门禁友好子集） | `cargo test -p traveltrust-api` |
| **`docs/handbook`** 编号文 / 栏 **README** 文首元数据 | `bash scripts/check-handbook-frontmatter.sh` |
| **`engineering` 域篇（NN≥10）**、**`EVIDENCE-*-cluster-verified.md`**（**22** 形态机读）与 **spec** 外链 + 验证段 | `bash scripts/check-handbook-engineering-content.sh` |

更多全仓/前端门禁以 **[CONTRIBUTING](../../../CONTRIBUTING.md)** 与 **[engineering/02](./02-生产级文档约束与合入门禁.md)** 为准。

---

## 主序列（按文件名 `NN` 升序 = 阅读顺序）

与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)** 一致。**增删改本表**须与 **§3** **同行、同序**（**[手册 00 §2.1.2](../00-手册总览与编制规范.md#hb-00-sorting-hard-rules)**）。**同 PR 自检**：**[engineering/02 · §4a](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**（**[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)** / **本 README 主序表** / **磁盘 `NN-*.md`**）。

| NN | 文档 | 状态 | 一句话 |
|----|------|------|--------|
| 00 | [00-系统全局地图.md](./00-系统全局地图.md) | 现行 | **A/B/C/D** 与主链入口；**`/` + `/market*` 四页 ① 数据链** 见 **[§3 · map-when-read](./00-系统全局地图.md#map-when-read)** + **[CODE SSOT](../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** |
| 01 | [01-技术真值栈-93-95-96-97与代码对照.md](./01-技术真值栈-93-95-96-97与代码对照.md) | 现行 | 四册 + 硬真源；**[§4b](./01-技术真值栈-93-95-96-97与代码对照.md#hb-full-run-93959697)** 全量跑通一键表；**`/` + 三页市场** **[CODE SSOT](../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §1/§3/§4 |
| 02 | [02-生产级文档约束与合入门禁.md](./02-生产级文档约束与合入门禁.md) | 现行 | PR / 发版一票否决 |
| 03 | [03-系统架构与仓库骨架.md](./03-系统架构与仓库骨架.md) | 现行 | 分层与顶层目录 |
| 04 | [04-HTTP与路由契约导读.md](./04-HTTP与路由契约导读.md) | 现行 | 对拍 **04 §3.4** 与 `api_router()`；**REG-04** 叙事同簇（**verified** **§2b.3**） |
| 05 | [05-本地环境与常用门禁速查.md](./05-本地环境与常用门禁速查.md) | 现行 | 本地环境、合 PR 命令、改动×门禁矩阵；文首链 **[02 §1a](./02-生产级文档约束与合入门禁.md#hb-prod-sec-index)**（应用安全索引） |
| 06 | [06-工程模块技术文档编制契约与验证闭环.md](./06-工程模块技术文档编制契约与验证闭环.md) | 现行 | 域篇九节骨架、SSOT、§2a 继承门禁、§12 PR checklist、反模式与自检清单 |
| 07 | [07-架构决策记录ADR规范.md](./07-架构决策记录ADR规范.md) | 现行 | **ADR** 规范；**正文唯一 `docs/adr/`**；**§4～§6** 与 **04/93/spec/07** 回归链（**partial**） |
| 08 | [08-文档与spec迁移台账.md](./08-文档与spec迁移台账.md) | 现行 | 接管矩阵 + **删除 spec** 列 + **§2a verified** 三证据门禁 |
| 09 | [09-文档迁移覆盖审计报告.md](./09-文档迁移覆盖审计报告.md) | 现行 | **§10a 任务清单**、**§2a 量化**、**§2b verified**；**不**替代 04/93 |
| 10 | [10-A-认证机制.md](./10-A-认证机制.md) | 现行 | **A 域**样板；**09 §3 · 97 Auth** **migrated**；**§2b.8** **EVIDENCE-10-A-auth**；**[spec/97](../../spec/97-登录找回密码钱包态企业级审计清单.md)** 全文仍 SSOT；**§9** **T-020** |
| 20 | [20-B-订单机制.md](./20-B-订单机制.md) | 现行 | **B 域重状态**样板 + **盲测**四问；**verified** **§2b.10**（**[EVIDENCE-20-B-orders](./EVIDENCE-20-B-orders-cluster-verified.md)**） |
| 21 | [21-B-市场与托管机制.md](./21-B-市场与托管机制.md) | 现行 | **94 子站** + **53 扩展**；**market_subsite**；**商家 listing 三门闸** → **[provider/register README](../../../frontend/app/provider/register/README.md)**；**verified** **§2b.4** |
| 22 | [22-横切-簇级verified证据模板.md](./22-横切-簇级verified证据模板.md) | 现行 | **簇级 verified** 母版（**V-1～V-3**、**09/08**；**不**替代 **04/93**） |
| 23 | [23-横切-07开发流程导读.md](./23-横切-07开发流程导读.md) | 现行 | **spec/07** 流程与三线门禁导读（**verified**；与 **07-ADR** 分工） |
| 24 | [24-横切-前端与UI宪法导读.md](./24-横切-前端与UI宪法导读.md) | 现行 | **05/06/13/13-1** 横切导读（**永久 partial**；**不**参与 **§2b verified**） |
| 25 | [25-横切-发版外验审计与CI真源及eng替代spec路径.md](./25-横切-发版外验审计与CI真源及eng替代spec路径.md) | 现行 | **95/96/go-live/CI** 真源轴 + **`engineering`** 替代 **`spec`** 人读路径；与 **23** 分工 |
| 30 | [30-C-执行器调度机制.md](./30-C-执行器调度机制.md) | 现行 | **强异步**样板（**250/260**、outbox、`async_jobs`；**93 D-ONB-\***、**04** SSOT）；**verified** **§2b.11**（**[EVIDENCE-30-C-async](./EVIDENCE-30-C-async-cluster-verified.md)**） |
| 31 | [31-C-治理与质押只读导读.md](./31-C-治理与质押只读导读.md) | 现行 | **93·C 域**（**§3**）**`governance/*`**；**09 §2b.9** **[EVIDENCE-93-c-gov](./EVIDENCE-93-c-gov-cluster-verified.md)**；**`-C-` vs 30-C** 见 **[手册 00 §5.1](../00-手册总览与编制规范.md#hb-00-number-blocks)** |
| 32 | [32-横切-Wave与阶段体系导读.md](./32-横切-Wave与阶段体系导读.md) | 现行 | **Wave / 阶段用语**以 **[32 · §0](./32-横切-Wave与阶段体系导读.md#x32-0-terminology)** 为 **engineering** 唯一定义来源 |
| 40 | [40-D-Admin机制.md](./40-D-Admin机制.md) | 现行 | **D 域 Admin** Hub（**70**、**04 §3.5**、**93 §4.5**）；**商家 KYB 队列** **`/admin/provider-applications`** → **`/admin/users/[id]`** 审核 → **[provider/register README](../../../frontend/app/provider/register/README.md)** |
| 41 | [41-D-索引与对账导读.md](./41-D-索引与对账导读.md) | 现行 | **110 / 96-08** 索引与对账；**verified** **§2b.6**（**EVIDENCE-110-reconcile**）+ **70 §2b.1** |
| 42 | [42-D-Admin审计合规与审批.md](./42-D-Admin审计合规与审批.md) | 现行 | **审计 / 审批 / Vault**（**70**、**360**） |
| 50 | [50-链上与ABI导读.md](./50-链上与ABI导读.md) | 现行 | **14 + contracts**；**55-S13** / **`run-check-04`**；**verified** **§2b.5** |

**`EVIDENCE-*-cluster-verified.md`（L0，不参与 `NN-` 主序）**：与 **[09 §2b](./09-文档迁移覆盖审计报告.md)**、**[22](./22-横切-簇级verified证据模板.md)** 同形检索；母版与门禁见 **22**、**09**。

| 文件 | 用途（一句话） |
|------|----------------|
| [EVIDENCE-04-api-cluster-verified.md](./EVIDENCE-04-api-cluster-verified.md) | **04 / 路由** 簇 **§2b.3** |
| [EVIDENCE-07-devflow-cluster-verified.md](./EVIDENCE-07-devflow-cluster-verified.md) | **spec/07 / devflow** 簇 **§2b.2** |
| [EVIDENCE-10-A-auth-cluster-verified.md](./EVIDENCE-10-A-auth-cluster-verified.md) | **A 域 / Auth** 簇 **§2b.8** |
| [EVIDENCE-20-B-orders-cluster-verified.md](./EVIDENCE-20-B-orders-cluster-verified.md) | **B 域订单 / 53 B-ORD** 簇 **§2b.10** |
| [EVIDENCE-30-C-async-cluster-verified.md](./EVIDENCE-30-C-async-cluster-verified.md) | **250/260 强异步** 簇 **§2b.11** |
| [EVIDENCE-93-c-gov-cluster-verified.md](./EVIDENCE-93-c-gov-cluster-verified.md) | **93·C / governance** 簇 **§2b.9** |
| [EVIDENCE-14-chain-abi-cluster-verified.md](./EVIDENCE-14-chain-abi-cluster-verified.md) | **链上 / ABI** 簇 **§2b.5** |
| [EVIDENCE-94-market-cluster-verified.md](./EVIDENCE-94-market-cluster-verified.md) | **市场子站** 簇 **§2b.4** |
| [EVIDENCE-100-330-phase-cluster-verified.md](./EVIDENCE-100-330-phase-cluster-verified.md) | **Wave / 阶段** 簇 **§2b.7** |
| [EVIDENCE-110-reconcile-cluster-verified.md](./EVIDENCE-110-reconcile-cluster-verified.md) | **索引 / 对账** 簇 **§2b.6** |
| [EVIDENCE-70-admin-cluster-verified.md](./EVIDENCE-70-admin-cluster-verified.md) | **Admin / indexer** 簇（与 **40-D / 41-D** 互指） |

**与 `spec/00` 文档版本表的关系（生产级索引边界）**：[spec/00-文档索引](../../spec/00-文档索引.md) **「文档版本与最后更新」**表只收录 **`engineering/NN-*.md` 主序**篇目，**不**逐条列出 **`EVIDENCE-*`**（**L0** 固定键；见 **[手册 00 §2.1.1](../00-手册总览与编制规范.md#hb-00-naming-locale)**）。簇级盘点以**上表**与 **[09 §2b](./09-文档迁移覆盖审计报告.md)**、**[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)** 为准。

**[24](./24-横切-前端与UI宪法导读.md)** 与 **09 §3** 之 **05/06/13 前端与 UI 宪法** 簇一致，**永久 partial**：**不**单开 **§2b EVIDENCE**、**不**参与 **verified**（**不**与 **22/08** 升格路径绑定）。

**93·C 域成稿**：[31-C-治理与质押只读导读](./31-C-治理与质押只读导读.md) · [EVIDENCE-93-c-gov-cluster-verified](./EVIDENCE-93-c-gov-cluster-verified.md)（矩阵 **[93 §3](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；契约仍以 **04/93** 为 SSOT；号段分工见 **[手册 00 §5.1](../00-手册总览与编制规范.md#hb-00-number-blocks)**）。

<a id="eng-read-number-blocks"></a>

**100+ 专题规划（非主序 `00～50` · 不参与 spec/00 版本母表逐行）**

| NN | 文档 | 状态 | 一句话 |
|----|------|------|--------|
| 101 | [101-CMS与内容运营中心实施蓝图.md](./101-CMS与内容运营中心实施蓝图.md) | 现行 | **CMS + Official OPS v2.0.0** · C-S1～C-S6 · O-S1～O-S4 · Catalog/Growth **FREEZE** |
| 102 | [102-Referral与早鸟增长系统v1.0实施蓝图.md](./102-Referral与早鸟增长系统v1.0实施蓝图.md) | 归档索引 | P3 Growth **历史分册** · 运行时 **133** · 已吸收入 **101 v2.0.0** |
| 103 | [103-CMS-OPS-Growth统一架构补充.md](./103-CMS-OPS-Growth统一架构补充.md) | 归档 | Architecture Review Addendum · 已吸收入 **101 v1.1.0** |
| 104 | [104-Admin-Coverage-Gap-Report.md](./104-Admin-Coverage-Gap-Report.md) | 现行 | **Operations Coverage Audit v1.1.0**：Post-S5/G-S8 覆盖矩阵 · CMS Admin HOLD · Growth **GO** |
| 105 | [105-S2-Catalog-CMS深度设计评审.md](./105-S2-Catalog-CMS深度设计评审.md) | 现行 | **S2 Deep Design Review**：Catalog ER · Admin CRUD · 审核/版本/回滚 · 媒体库 · 迁移路径 · **不含 Growth** |
| 106 | [106-Catalog-CMS-Implementation-Readiness-Report.md](./106-Catalog-CMS-Implementation-Readiness-Report.md) | 现行 | **S2 Implementation Review**：S2-DB-004 逐表审计 · 导入/回滚就绪度 · **CONDITIONAL GO** |
| 107 | [107-Catalog-Schema-v1.0.md](./107-Catalog-Schema-v1.0.md) | **FROZEN** | **Catalog DDL Finalization**：Schema v1.0 · ER · 约束 · FK 顺序 · Import Batch · Media Lifecycle · **无 SQL** |
| 108 | [108-S2-004-Migration-Audit-Report.md](./108-S2-004-Migration-Audit-Report.md) | 现行 | **S2-004 Migration Audit**：正向/回滚 · 107 对拍 · **PASS** → Import GO |
| 109 | [109-Catalog-Import-v1.0.md](./109-Catalog-Import-v1.0.md) | **FROZEN v1.0.1** | **Catalog Import** · §11 实现契约 · preflight · Runner |
| 110 | [110-Catalog-Import-Readiness-Report.md](./110-Catalog-Import-Readiness-Report.md) | 现行 | **Import Readiness Audit**：109 逐项审计 · **CONDITIONAL GO** · Runner Checklist |
| 111 | [111-Catalog-Reimport-Rollback-Audit-Report.md](./111-Catalog-Reimport-Rollback-Audit-Report.md) | 现行 | **Re-import & Rollback Audit**：二/三次导入 · 幂等 · rollback CLI · **GO** |
| 112 | [112-S2-API-RO-Audit-Report.md](./112-S2-API-RO-Audit-Report.md) | 现行 | **S2-API-RO**：`GET /api/v1/catalog/*` 只读六端点 · API↔TS 双读对拍 · **GO** · FE flag=0 |
| 113 | [113-S2b-Catalog-Consumer-Audit-Report.md](./113-S2b-Catalog-Consumer-Audit-Report.md) | 现行 | **S2b Consumer Audit**：Consumer Matrix · Phases 1–8 · **CLOSURE GO** |
| 114 | [114-S2b-Catalog-Consumer-Closure-Report.md](./114-S2b-Catalog-Consumer-Closure-Report.md) | 现行 | **S2b Closure**：W1–W4 门禁矩阵 · flag/回退/hydration · Consumer Matrix 终态 |
| 115 | [115-S2c-Catalog-Live-Gate-Report.md](./115-S2c-Catalog-Live-Gate-Report.md) | 现行 | **S2c Live Gate**：真实 API + import · live skip 清零 · **LIVE FULL GO** |
| 116 | [116-S3-W5-POI-Media-Catalog-Report.md](./116-S3-W5-POI-Media-Catalog-Report.md) | 现行 | **S3/W5 POI Media**：poi-images RO · adapter merge · C-12 **GO** |
| 117 | [117-S4-Catalog-Server-Validation-Alignment-Report.md](./117-S4-Catalog-Server-Validation-Alignment-Report.md) | 现行 | **S4 Server Validation**：core ↔ catalog parity · POST opt-in catalog 校验 |
| 118 | [118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md](./118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md) | 现行 | **S4b B-S4-01**：`GET /meta.product_countries` catalog PG opt-in · 746 契约保持 |
| 119 | [119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md) | 现行 | **S4c FINAL GO**：双 flag live 复验 · S4/S4b/S2c 门禁 · 旧二进制 WARN 清零 |
| 120 | [120-S5-Catalog-Release-Freeze-Report.md](./120-S5-Catalog-Release-Freeze-Report.md) | **FROZEN** | **S5 Release Freeze**：113–119 证据包 · 一键 gate · **CATALOG_RELEASE_FREEZE_GO** |
| 121 | [121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) | 现行 | **PI3-002 Audit**：域名/DNS/TLS/CORS/CDN/回调 · staging PASS · prod **PI3-002 HOLD** |
| 122 | [122-PI3-001-Production-Database-Backup-Readiness-Report.md](./122-PI3-001-Production-Database-Backup-Readiness-Report.md) | 现行 | **PI3-001 Audit**：Fly PG 备份/B-475/恢复演练/RPO/RTO · staging PARTIAL · **PI3-001 HOLD** |
| 151 | [151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md](./151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md) | 现行 | **PI3-002 Execution**：域名/TLS/CORS/env 对拍 · **`PI3-002 HOLD`** |
| 152 | [152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md](./152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md) | 现行 | **PI3-001 Execution**：Fly backup · B-475 drill · RPO/RTO · **`PI3-001 HOLD`** |
| 153 | [153-PI3-003-Stripe-Live-Production-Webhook-Report.md](./153-PI3-003-Stripe-Live-Production-Webhook-Report.md) | 现行 | **PI3-003 Execution**：Stripe Live · prod webhook · **`PI3-003 HOLD`** |
| 154 | [154-PI3-004-Production-Readiness-Verification-Report.md](./154-PI3-004-Production-Readiness-Verification-Report.md) | 现行 | **PI3-004 Execution**：R-003 prod · 六域/全矩阵 · **`PI3-004 HOLD`** |
| 155 | [155-PI3-006-GoLive-Checklist-Production-Cutover-Report.md](./155-PI3-006-GoLive-Checklist-Production-Cutover-Report.md) | 现行 | **PI3-006 Execution**：go-live §0–§11 · P0 十二项 · Cutover · M-00 · **`PI3-006 HOLD`** |
| 123 | [123-101-CMS-Audit-Report.md](./123-101-CMS-Audit-Report.md) | 现行 | **101 Blueprint Audit**：CMS M1–M10 · Catalog RO vs Admin · **运营 HOLD · 非 PI3 阻塞** |
| 124 | [124-102-Referral-Audit-Report.md](./124-102-Referral-Audit-Report.md) | 现行 | **102 Blueprint Audit**：G1–G7 Growth · DDL stub only · **HOLD** |
| 125 | [125-Production-Feature-Gap-Matrix.md](./125-Production-Feature-Gap-Matrix.md) | 现行 | **101/102 汇总矩阵**：GO/HOLD/REWRITE · PI3 vs 运营就绪 · 工作量/测试 |
| 126 | [126-G-S1-Referral-Minimum-Loop-Report.md](./126-G-S1-Referral-Minimum-Loop-Report.md) | 现行 | **G-S1 Sprint**：Referral 最小闭环 · validate/register/Admin CRUD · smoke/Playwright |
| 127 | [127-G-S2-Growth-Ledger-Observer-Report.md](./127-G-S2-Growth-Ledger-Observer-Report.md) | 现行 | **G-S2 Sprint**：Ledger 幂等 · Observer · 对账 · Admin reward-ledger |
| 128 | [128-G-S3-EarlyBird-Multiplier-Report.md](./128-G-S3-EarlyBird-Multiplier-Report.md) | 现行 | **G-S3 Sprint**：注册序号 · Stage 倍率 · Observer 接入 · Admin early-bird |
| 129 | [129-G-S4-User-Referral-Center-Report.md](./129-G-S4-User-Referral-Center-Report.md) | 现行 | **G-S4 Sprint**：`/me/referrals` · GET me/referrals · 复制分享 · 隐私边界 |
| 130 | [130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md](./130-G-S5-Admin-Growth-AntiFraud-RewardOps-Report.md) | 现行 | **G-S5 Sprint**：Admin 风控 · 冻结/解冻 · ledger 审计/漂移修复 |
| 131 | [131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report.md](./131-G-S6-Airdrop-Snapshot-Reward-Calculation-Report.md) | 现行 | **G-S6 Sprint**：链下 Airdrop 快照 · 奖励计算 · 导出 · 对账 |
| 132 | [132-G-S7-Growth-Analytics-KOL-ReadOnly-Report.md](./132-G-S7-Growth-Analytics-KOL-ReadOnly-Report.md) | 现行 | **G-S7 Sprint**：只读增长分析 · KOL 贡献看板 · 时间窗口筛选 |
| 133 | [133-G-S8-Growth-Release-Freeze-Report.md](./133-G-S8-Growth-Release-Freeze-Report.md) | **FROZEN** | **G-S8 Release Freeze**：126–132 证据包 · **GROWTH_RELEASE_FREEZE_GO** |
| 134 | [134-101-CMS-Official-OPS-Post-Growth-Recheck-Report.md](./134-101-CMS-Official-OPS-Post-Growth-Recheck-Report.md) | 现行 | **Post-Growth CMS/Official 复评** · **CMS_OFFICIAL_OPS_POST_GROWTH_RECHECK_GO** |
| 135 | [135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) | 现行 | **DOC-101-RW** · **DOC_101_RW_GO** |
| 136 | [136-C-S1-Admin-Content-CRUD-PublishQueue-Report.md](./136-C-S1-Admin-Content-CRUD-PublishQueue-Report.md) | 现行 | **C-S1 Admin Content CRUD** · **C_S1_GO** · 破 120 Admin API |
| 137 | [137-C-S2-POI-Media-Review-Workflow-Report.md](./137-C-S2-POI-Media-Review-Workflow-Report.md) | 现行 | **C-S2 M6 POI Media Review** · **C_S2_GO** · 审核闭环 |
| 138 | [138-C-S3-Catalog-Operations-Admin-Report.md](./138-C-S3-Catalog-Operations-Admin-Report.md) | 现行 | **C-S3 Catalog Operations Admin** · **C_S3_GO** · 定价/交通/媒体 |
| 139 | [139-C-S4-Catalog-Revision-Import-Operations-Report.md](./139-C-S4-Catalog-Revision-Import-Operations-Report.md) | 现行 | **C-S4 Catalog Revision & Import Ops** · **C_S4_GO** · 审计/导入/对拍 |
| 140 | [140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md](./140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md) | 现行 | **C-S5 Server Geo Validation Ops** · **C_S5_GO** · meta 对拍/drift/flag 观测 |
| 141 | [141-O-S1-Official-Accounts-Management-Report.md](./141-O-S1-Official-Accounts-Management-Report.md) | 现行 | **O-S1 Official Accounts M7** · **O_S1_GO** · CRUD/审核/KOL 绑码 |
| 142 | [142-O-S2-Official-Guides-Community-Publishing-Report.md](./142-O-S2-Official-Guides-Community-Publishing-Report.md) | 现行 | **O-S2 Official Guides M8** · **O_S2_GO** · community_posts official publish |
| 143 | [143-O-S3-Official-Itinerary-Templates-Report.md](./143-O-S3-Official-Itinerary-Templates-Report.md) | 现行 | **O-S3 Official Itinerary Templates M9** · **O_S3_GO** · Catalog 关联/审核发布 |
| 144 | [144-O-S4-Cold-Start-Campaigns-Deployment-Operations-Report.md](./144-O-S4-Cold-Start-Campaigns-Deployment-Operations-Report.md) | 现行 | **O-S4 Cold Start M10** · **O_S4_GO** · deploy/rollback/surfaces/items |
| 145 | [145-Operations-Platform-Release-Freeze-Report.md](./145-Operations-Platform-Release-Freeze-Report.md) | 现行 | **Ops Platform Final Audit** · **OPERATIONS_PLATFORM_GO** · CMS/Official/Growth 三平面冻结 |
| 146 | [146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md](./146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md) | 现行 | **C-S6 Consumer opt-in** · **CATALOG_CONSUMER_OPT_IN_GO** · staging `ENABLED=1` · prod **ENABLED=0** |
| 147 | [147-PI3-Closure-Program-Audit-Report.md](./147-PI3-Closure-Program-Audit-Report.md) | 现行 | **PI3 Closure Program Audit** · **PI3_CLOSURE_PROGRAM_AUDIT_GO** · **`PRODUCTION_GO_DECISION: NO_GO`** |
| 148 | [148-PI3-005-Production-Scope-Decision-Report.md](./148-PI3-005-Production-Scope-Decision-Report.md) | 现行 | **PI3-005 Scope Decision** · **`PRODUCTION_SCOPE_SEPOLIA`** · Mainnet **NOT_SELECTED** |
| 154 | [154-PI3-004-Production-Readiness-Verification-Report.md](./154-PI3-004-Production-Readiness-Verification-Report.md) | 现行 | **PI3-004 Execution**：R-003 prod · **`PI3-004 HOLD`** |
| 155 | [155-PI3-006-GoLive-Checklist-Production-Cutover-Report.md](./155-PI3-006-GoLive-Checklist-Production-Cutover-Report.md) | 现行 | **PI3-006 Execution**：go-live · **`PI3-006 HOLD`** |
| 156 | [156-L5-Operations-Deep-Audit-Report.md](./156-L5-Operations-Deep-Audit-Report.md) | **FROZEN** | L5 Deep Audit · **`OPERATIONS_L5_AUDIT_HOLD`** → 157 已升格 |
| 157 | [157-L5-P0-Closure-Report.md](./157-L5-P0-Closure-Report.md) | **FROZEN** | **`OPERATIONS_L5_AUDIT_GO` 85/100** · ROV 基线 |
| 158 | [158-Production-Readiness-Deep-Audit-Report.md](./158-Production-Readiness-Deep-Audit-Report.md) | **HOLD** | **`PRODUCTION_READINESS_DEEP_AUDIT_HOLD`** · ROV **不**重启 |
| 159 | [159-L5-UI-UX-Enterprise-Acceptance-Report.md](./159-L5-UI-UX-Enterprise-Acceptance-Report.md) | **FROZEN** | → 160 已升格 |
| 160 | [160-UX-P0-Closure-Report.md](./160-UX-P0-Closure-Report.md) | **FROZEN** | **`UI_UX_L5_GO`** · ROV 基线 |
| 161 | [161-L5-Enterprise-Acceptance-Report.md](./161-L5-Enterprise-Acceptance-Report.md) | **FROZEN** | **`L5_ENTERPRISE_ACCEPTANCE_GO`** · ROV 基线 |
| 162 | [162-L5-Product-Excellence-Report.md](./162-L5-Product-Excellence-Report.md) | **FROZEN** | **`L5_PRODUCT_EXCELLENCE_GO`** · ROV 基线 |
| 163 | [163-L5-Enterprise-Reliability-Report.md](./163-L5-Enterprise-Reliability-Report.md) | **FROZEN** | **`L5_ENTERPRISE_RELIABILITY_GO`** · ROV 基线 |
| 164 | [164-L5-Enterprise-Live-Evidence-Report.md](./164-L5-Enterprise-Live-Evidence-Report.md) | **FROZEN** | **`L5_ENTERPRISE_LIVE_EVIDENCE_GO`** · ROV 基线 |
| 165 | [165-L5-Enterprise-Business-Governance-Report.md](./165-L5-Enterprise-Business-Governance-Report.md) | **FROZEN** | **`L5_ENTERPRISE_BUSINESS_GOVERNANCE_GO`** · ROV 基线 |
| 166 | [166-Business-Expansion-Audit-Report.md](./166-Business-Expansion-Audit-Report.md) | **HOLD** | BE 审计 · ROV **STOP** 新 Sprint |
| 167 | [167-Business-Expansion-Enterprise-Gap-Audit-Report.md](./167-Business-Expansion-Enterprise-Gap-Audit-Report.md) | **HOLD** | BE 差距 · ROV **STOP** |
| 168 | [168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md](./168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md) | **FROZEN** | 168-B 蓝图 · 169 已实施 |
| 169 | [169-Sprint168B-Business-Expansion-Implementation-Report.md](./169-Sprint168B-Business-Expansion-Implementation-Report.md) | **FROZEN** | **`BE_FRD_01_GO` · `BE_GCM_01_GO`** · ROV 基线 |
| 170 | [170-Business-Expansion-Sprint169-RS-DAO-Enterprise-Audit-Report.md](./170-Business-Expansion-Sprint169-RS-DAO-Enterprise-Audit-Report.md) | **FROZEN** | → 171/172 已实施 |
| 171 | [171-BE-RS-01-RegionShare-Reconcile-Implementation-Report.md](./171-BE-RS-01-RegionShare-Reconcile-Implementation-Report.md) | **FROZEN** | **`BE_RS_01_GO`** · ROV-T6 |
| 172 | [172-BE-DAO-01-Governance-UAT-Implementation-Report.md](./172-BE-DAO-01-Governance-UAT-Implementation-Report.md) | **FROZEN** | **`BE_DAO_01_GO`** · ROV-T7 演示 |
| 173 | [173-ROV-01-Real-Operations-Validation-Program-Blueprint.md](./173-ROV-01-Real-Operations-Validation-Program-Blueprint.md) | **ACTIVE** | **ROV-01 程序** · **STOP** L5/BE/PI3 新 Sprint · **`ROV_01_ACTIVE`** |
| 174 | [174-Real-Operations-Validation-Report.md](./174-Real-Operations-Validation-Report.md) | **ACTIVE** | **Wave-1/2 GO（T1–T5）** · **`ROV_01_IN_PROGRESS`** · ② 度量 SSOT |
| 175 | [175-Production-Readiness-Audit-Program-Blueprint.md](./175-Production-Readiness-Audit-Program-Blueprint.md) | **ACTIVE** | **PRA-01 程序** · 六阶段 harness · **功能冻结** |
| 176 | [176-Production-Readiness-Audit-Report.md](./176-Production-Readiness-Audit-Report.md) | **COMPLETE** | **统一证据包 GO** · **`PRODUCTION_GO: NO`** · ② PRA 收口 |
| 177 | [177-Production-Governance-Gap-Closure-Report.md](./177-Production-Governance-Gap-Closure-Report.md) | **COMPLETE** | **Phase ② 治理 Gap GO** · **147/158 未解除** |
| 178 | [178-Phase2-Full-Coverage-Validation-Blueprint.md](./178-Phase2-Full-Coverage-Validation-Blueprint.md) | **ACTIVE** | **P2FC 程序** · 33 项 strict GO 策略 |
| 179 | [179-Phase2-Full-Coverage-Validation-Report.md](./179-Phase2-Full-Coverage-Validation-Report.md) | **IN FLIGHT** | **32/33 GO** · S01 staging-soak **72h** |
| 180 | [180-Parallel-UAT-During-Soak-Sprint.md](./180-Parallel-UAT-During-Soak-Sprint.md) | **ACTIVE** | soak 窗口并行 UAT · token 只记录 · local/staging-dev |

**Phase ③ Entry（runbook）**：[PHASE3-ENTRY-RECHECK-REPORT.md](../../runbook/PHASE3-ENTRY-RECHECK-REPORT.md) · [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) · `bash scripts/check-phase3-entry-recheck.sh`

**号段预留（与 [手册 00 §5](../00-手册总览与编制规范.md#hb-00-number-blocks) 同口径）**：**60～69**、**70～79**、**80～89**、**90～99** 在磁盘上**尚无**对应 **`engineering/NN-*.md`** 时为 **预留**，**不**表示「无主题」。**70** 类深叙事仍以 **spec** 为主、**40-D / 41-D / 42-D** 为 handbook 导读承接。新篇合入须先按 **00 §5～§7** 选号并同步 **00 §3** 与**本文主表**；**禁止**未立项即批量建空壳 `.md`。

| 号段 | 预留含义（**示意、非排他**；立项前**勿**臆造主题批量建文） |
|------|----------------------------------------------------------|
| **60～69** | 观测、SLO、告警链路等**横切**能力（若与 **spec** 阶段文重叠，先 **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** 登记并与 **09 §3** 对拍） |
| **70～79** | **Admin / 运营后台**深叙事仍以 **`spec/70`** 为主；handbook 以 **40-D～42-D** 承接 |
| **80～89** | 经济、计费、配额等专项（与 **83/84**、**Runbook** 对读时分清 SSOT） |
| **90～99** | 合规、发布编排、跨系统契约等（与 **96-15**、**07** 对读时分清 SSOT） |

**新增工程文档**：先 **[手册 00 §5～§7](../00-手册总览与编制规范.md#hb-00-number-blocks)** 选号段与域；**正文结构**以 **[06](./06-工程模块技术文档编制契约与验证闭环.md)** 与 **[\_TEMPLATE-工程模块篇](./_TEMPLATE-工程模块篇.md)** 为准；**落 L3 还是 `corpus`** 见 **[00 §9](../00-手册总览与编制规范.md#hb-00-layer-model)**；补全路线图 **[00 §10](../00-手册总览与编制规范.md#hb-00-roadmap)**。

**长叙事从 spec 主序列迁出**：见 **[corpus/README](../corpus/README.md)**（`REG-*`），与日常 **engineering/10～** 域文档分工不同，勿混用。**spec/01～03** 已走 **REG + 03/20-B** 路径并 **09 §3 migrated** / **08 full**（上段）；余量 **spec** 仍以 **spec/00**、**09**、**32** 为入口。

---

## 相关入口

- **编制与扩展总册**：[手册 00](../00-手册总览与编制规范.md)（**§2.1.0** 干净口径 · **§2.1.3** 英文分级）  
- **handbook 总入口**：[README](../README.md)  
- **ADR（唯一目录）**：[docs/adr/README.md](../../adr/README.md)（**Why**；**不**替代 **04/93/14/代码与脚本** 契约表体；格式 **[07](./07-架构决策记录ADR规范.md)**）· [engineering/adr/README（入口说明）](./adr/README.md)  
- **产品栏**：[product-manager](../product-manager/README.md) · **学习栏**：[learn](../learn/README.md)  
- **全库文档母索引**：[spec/00-文档索引](../../spec/00-文档索引.md)  
- **`/` + `/market` 四页 ① 数据链（代码 SSOT）**：[LANDING-MARKET-PAGES-CODE-SSOT](../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · **`bash scripts/dev/run-web3-itinerary-l5-green.sh`**（**[05 §2/§3](./05-本地环境与常用门禁速查.md)**；**UI freeze** 仍 **FIVE-MAIN** / **MARKET-L5**）
- **93/95/96/97 全量跑通（一键表）**：[01 · §4b](./01-技术真值栈-93-95-96-97与代码对照.md#hb-full-run-93959697)（**`spec/run` 壳**：[../../spec/run-93-95-96-97/README.md](../../spec/run-93-95-96-97/README.md)）
