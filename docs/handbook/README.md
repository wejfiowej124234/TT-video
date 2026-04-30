# TravelTrust · 技术手册（`docs/handbook`）

**Version:** 1.6.14 · **最后更新：** 2026-04-29（版本与 **[spec/00 · 版本表](../spec/00-文档索引.md#文档版本与最后更新)** 中 `handbook/*` 行对拍）

---

## 程序员入口（生产级技术文档）

**日常写码、对拍契约、合 PR**：以 **[engineering/README.md](./engineering/README.md)** 为**主工作台**（阅读层级 **P0～P2**、**真源阶梯**、与 **04 / 路由门禁** 对齐的命令）。

**`engineering/00～50` 主序 `NN-*.md` 增删改**：须 **[手册 00 §3 工程栏](./00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./engineering/README.md)** 主序表与磁盘文件名 **三处对拍**（同序、同号）；勾选项 **[engineering/02 · §4a](./engineering/02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**（与根 **CONTRIBUTING** 同条）。

**契约与实现真源**：**`engineering/`** **仅为导读，不替代 spec**（Explanation/How-to）；**契约与机读真源**枚举与 **[engineering/README 段首](./engineering/README.md)**/**[09 · §10c 表后](./engineering/09-文档迁移覆盖审计报告.md#audit-cluster-exec-list)** 同条：**04 §3.4**、**93**、**14**、**代码与脚本门禁**。**`engineering/NN-*`、`EVIDENCE-*`** 文首 **SSOT（必读）** 须与 **engineering/README** 段首及 **[手册 00 · §2.2](./00-手册总览与编制规范.md#hb-00-frontmatter-min)** 同键。**HTTP 机读表**以 **spec/04 §3.4** + **`run-check-04-routes`**；**域矩阵 / PASS** 以 **93**（等）；**ABI** 以 **spec/14** + **`contracts/`** + **`check-55-s13`** 等；**实现**以 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 产物；**handbook/engineering** 为导读与操作台，**不**并列第二契约表体；**删 `docs`/`spec`** 须 **[08 §3](./engineering/08-文档与spec迁移台账.md#mig-2-matrix)** + **[09 §3](./engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR**）+ **[08 §2](./engineering/08-文档与spec迁移台账.md#mig-delete-policy)** + **[STATUS](./corpus/SPEC-MIGRATION-STATUS.md)** + **[98 §2](../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** 程序链。

**三栏与 `corpus/`**：[learn](./learn/README.md)、[product-manager](./product-manager/README.md)、[corpus](./corpus/README.md) 的 **README** 与栏内 **`NN-*` / `REG-*`** 文首 **SSOT** / **SSOT 纪律** 与上段**同程序链**（导读**不**替代 **04 / 93** 表体）。

**`engineering` 版本母表（与 [spec/00](../spec/00-文档索引.md#文档版本与最后更新) 对读）**：[spec/00 · §文档版本与最后更新](../spec/00-文档索引.md#文档版本与最后更新) **`handbook/engineering/*`** 行**仅**列 **`00～50`** 主序 **`NN-*.md`**、**`engineering/README`**、**`engineering/adr/README`**。**`EVIDENCE-*-cluster-verified.md`** 与 **`_TEMPLATE-工程模块篇.md`** **不逐行入表**；**Version** **以各文件文首为准**（**同页** **「文档版本与最后更新」** **节前说明段** **加粗** **`handbook/engineering` 版本母表边界**；与 **[engineering/README · 与 spec 关系](./engineering/README.md)** 对拍）。

| 需求 | 先去 |
|------|--------|
| 真值栈、GO、合入门禁 | [engineering/01](./engineering/01-技术真值栈-93-95-96-97与代码对照.md)～[engineering/02](./engineering/02-生产级文档约束与合入门禁.md) |
| 仓库分层与目录 | [engineering/03](./engineering/03-系统架构与仓库骨架.md) |
| HTTP / 路由与 **04 §3.4** 对读 | [engineering/04](./engineering/04-HTTP与路由契约导读.md) → **打开** [spec/04 §3.4](../spec/04-后端与API.md) **与** `crates/api/src/routes/mod.rs` |
| 本地环境、合 PR 前命令、改动×门禁 | [engineering/05](./engineering/05-本地环境与常用门禁速查.md)（文首互指 **[02 §1a 应用安全](./engineering/02-生产级文档约束与合入门禁.md#hb-prod-sec-index)**） |
| **`EVIDENCE-*-cluster-verified`** 形态与 **22** 母版机读 | [engineering/22 §2](./engineering/22-横切-簇级verified证据模板.md#vtpl-2-naming) · **`bash scripts/check-handbook-engineering-content.sh`**（**`HBOOK-ENG-EVIDENCE`**；与 **[engineering/README](./engineering/README.md)** 验证表同条） |
| 新增长篇工程域文、迁 spec 叙事到 handbook | [engineering/06](./engineering/06-工程模块技术文档编制契约与验证闭环.md) + [`_TEMPLATE`](./engineering/_TEMPLATE-工程模块篇.md) |
| 合格成稿长什么样 + 接管台账 + 覆盖审计 | [engineering/20-B-订单机制](./engineering/20-B-订单机制.md) · [engineering/08 §3 迁移矩阵](./engineering/08-文档与spec迁移台账.md#mig-2-matrix) · [engineering/09 §3 簇态](./engineering/09-文档迁移覆盖审计报告.md#audit-coverage)（**同 PR** 对拍 **08**） |
| 架构决策（Why）与域文分工 | [engineering/07-架构决策记录ADR规范](./engineering/07-架构决策记录ADR规范.md) · **[`docs/adr/README`](../adr/README.md)**（**`ADR-*.md` 唯一落盘**） |
| **Wave / 阶段词**（handbook **`engineering`** 唯一定义） | [engineering/32 §0](./engineering/32-横切-Wave与阶段体系导读.md#x32-0-terminology)（与 **[spec/07 §零～§五](../spec/07-开发流程与顺序.md)** 对读） |
| **engineering 空 `NN`（60～99）非遗漏** | [engineering/README · 号段预留](./engineering/README.md#eng-read-number-blocks)（**[手册 00 §5](./00-手册总览与编制规范.md#hb-00-number-blocks)** 同口径） |
| **全库读前摘要**（规划方向 / ADR / Wave 同行） | **[spec/00-文档索引](../spec/00-文档索引.md)**（读前表） |
| 规范长叙事从 spec 再生（非索引） | [corpus/README.md](./corpus/README.md)（`REG-*`；**spec/01～03** 已 **migrated**/**08 full**，见 **[09 §3](./engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**） |

维护本目录结构、扩展号段、**Diátaxis 对齐与 T1～T7 质量条**：再读 **[00-手册总览与编制规范.md](./00-手册总览与编制规范.md)**（**§2.1.0** 目录「干净」·**§2.1～2.1.3** 命名与英文分级·**[§2.2](./00-手册总览与编制规范.md#hb-00-frontmatter-min)～2.3**；**§2.4～§2.5**；**§5～§11**）。

---

## 请先读：总册与规范（Owner / 文档维护者）

**[00-手册总览与编制规范.md](./00-手册总览与编制规范.md)** — **§2.1.0**（行业/企业级/生产级「干净」）·**§2.1～2.1.3**（中文优先·保留英文·排序·**L0～L3 英文分级**）·**[§2.2](./00-手册总览与编制规范.md#hb-00-frontmatter-min)～2.3**（文首最小集·锚点）、**主序列一览表**（工程师 / 产品 / 学习）、**与 `docs`/`spec` 的替代关系**、**§5～§7**、**§8（`corpus/`）**、**§9～§10**、**§2.4～§2.5（Diátaxis / 工程栏质量条）**、**§11（防膨胀与 SSOT）**。**新增或重排文档前必读。**

---

## `corpus/`：spec 正文的规范再生（不是索引）

**[corpus/README.md](./corpus/README.md)** — **`REG-*`** 与 **spec/01、02…** 同号对照；**[SPEC-MIGRATION-STATUS.md](./corpus/SPEC-MIGRATION-STATUS.md)** — **何时能删整个 `docs`/`spec`**（脚本/CI 前置条件）。  
当前已落盘：**[REG-01](./corpus/REG-01-业务与系统总览.md)**、**[REG-02](./corpus/REG-02-架构分层与领域.md)**、**[REG-03](./corpus/REG-03-业务流程与风控.md)**、**[REG-04](./corpus/REG-04-API叙事.md)**。  
**engineering 空号段（非遗漏）**：[engineering/README · 号段预留](./engineering/README.md#eng-read-number-blocks)（与 **[手册 00 §5](00-手册总览与编制规范.md#hb-00-number-blocks)** 同口径）。

---

## 三栏主入口（按角色）

| 栏 | 路径 | 说明 |
|----|------|------|
| **工程师** | **[engineering/README.md](engineering/README.md)** | **主序列** **00→09** + **域/横切** **10、20～21、22～24、[30-C](engineering/30-C-执行器调度机制.md) → [31-C](engineering/31-C-治理与质押只读导读.md) → [32](engineering/32-横切-Wave与阶段体系导读.md)**、**40～42、50**（**93·C**/**§2b.9**/**[EVIDENCE-93-c-gov](engineering/EVIDENCE-93-c-gov-cluster-verified.md)**；与 **[手册 00 §3](00-手册总览与编制规范.md#hb-00-master-table)** **同序**）；**L0** **`EVIDENCE-*-cluster-verified.md`** 索引见 **[engineering/README](engineering/README.md)**（**不**参与 **`NN-`** 主序）；**06** = 契约 + **§12 PR checklist** |
| **产品经理** | **[product-manager/README.md](product-manager/README.md)** | 主序列 **01**：验收对齐语言 + 外链 **95/96/go-live**；白话决策包另见 **[`docs/product-manager/`](../product-manager/README.md)**（与本栏**并行**） |
| **学习** | **[learn/README.md](learn/README.md)** | 主序列 **00→01**：路径总览、[仓库地图与首次克隆](learn/01-仓库地图与首次克隆.md) |

---

## 与 `docs`/`spec` 的关系（一句话）

**本树**：规范、专业、**按号有序**的**新类型技术文档**，用于**逐步替代** `spec` 里**重复、难导航的叙事**；**过渡期**契约表体、矩阵、台账仍以 **`../spec/`** 与 **[98 §2](../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** 为准。

---

## 跨栏速链（写手册时）

- **engineering 空号段（60～99）**：[engineering/README · 号段预留](./engineering/README.md#eng-read-number-blocks) · **[手册 00 §5](./00-手册总览与编制规范.md#hb-00-number-blocks)**
- **API**：[04 §3.4](../spec/04-后端与API.md) · **`bash scripts/run-check-04-routes.sh`**
- **矩阵**：[93](../spec/93-全站功能验证矩阵-域别回归清单.md) · [95](../spec/95-全链路生产就绪检查清单与完成度矩阵.md) · [96-索引](../spec/96-索引-全链路外生产验收分册.md) · [97](../spec/97-登录找回密码钱包态企业级审计清单.md)
- **GO**：[go-live · GO Decision](../go-live-checklist.md#go-decision-entry-point)
- **整理母册**：[98 §2](../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)

---

**母索引**：[spec/00-文档索引](../spec/00-文档索引.md)
