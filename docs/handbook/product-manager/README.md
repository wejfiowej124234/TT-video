# 产品经理读本 · `product-manager/`

**Version:** 1.3.0 · **最后更新：** 2026-04-29  

本目录为**产品经理**主序列：**按下面「本目录主序列」表序号阅读**；规范见 **[手册 00](../00-手册总览与编制规范.md)**。新增业务线短文：**§5.2** 区段 **10～19**（选号与栏内表见 **[00 §5.2](../00-手册总览与编制规范.md#hb-00-number-blocks)**）；分层说明 **[00 §9](../00-手册总览与编制规范.md#hb-00-layer-model)**、补全顺序 **[00 §10](../00-手册总览与编制规范.md#hb-00-roadmap)**。**主序对拍**：扩 **NN** 或改「本目录主序列」表时，与 **[engineering/README](../engineering/README.md)** 及全库 **[00 §3 主表](../00-手册总览与编制规范.md#hb-00-master-table)** 不冲突。**同 PR 若还改 `engineering/00～50` 主序 `NN-*.md`**，须另勾 **[engineering/02 · §4a](../engineering/02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**（与 **[CONTRIBUTING](../../../CONTRIBUTING.md)** 同条）。**engineering 栏空 `NN`（60～99）**见 **[号段预留](../engineering/README.md#eng-read-number-blocks)**（**[手册 00 §5](../00-手册总览与编制规范.md#hb-00-number-blocks)**；与研发对读「为何磁盘上暂无某号」时用）。

**另册**：**[`docs/product-manager/`](../../product-manager/README.md)** — 独立**决策入门包**（白话、融资与边界叙事）。**对称互指**：另册篇首 **「与 `docs/handbook/product-manager` 的关系」** 与本节 **主序对拍** 分工一致；日常读另册，轮到**栏内 NN / 合入与 engineering 主序同行**时回到本目录。**二者并行**，**不**替代 **`../../spec/`** SSOT。

**SSOT 纪律（与 [01](./01-产品边界与验收对齐语言.md) 文首块引同口径）**：本 README 与 **`01`** 只统一产品与研发的**说法**；**[95](../../spec/95-全链路生产就绪检查清单与完成度矩阵.md)**（§3 母表 / 缺口）、**[go-live · GO](../../go-live-checklist.md#go-decision-entry-point)**、**96 分册**仍为验收与执行真源；**[04 §3.4](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 仍为 **HTTP 机读**与**域矩阵**真源。删 **`docs` 下 `spec` 子树** 须 **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)** + **[engineering/09 §3](../engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）+ **[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**。

---

## 本目录主序列（按 NN）

| NN | 文档 | 状态 | 一句话 |
|----|------|------|--------|
| 01 | [01-产品边界与验收对齐语言.md](./01-产品边界与验收对齐语言.md) | 现行 | 「完成 / GO」怎么说才和研发同频 |

---

## 建议阅读顺序（含 spec 外链）

| 步 | 读什么 | 用途 |
|----|--------|------|
| 1 | 根 **[README](../../../README.md)**「工程规划方向」 | **本地 → 测试网 → 主网** 阶段闸 |
| 2 | 本目录 **[01](./01-产品边界与验收对齐语言.md)** | 验收用语与 **93/95/go-live** 对齐 |
| 3 | **[spec/00 读前摘要](../../spec/00-文档索引.md)** | 全库地图 |
| 3a | **[`docs/adr/README`](../../adr/README.md)** + **[engineering/07](../engineering/07-架构决策记录ADR规范.md)** | 架构 **Why**（**不**替代 **04 §3.4 / 93 / 代码**） |
| 3b | **[engineering/32 §0](../engineering/32-横切-Wave与阶段体系导读.md#x32-0-terminology)** | **engineering** 内 **Wave/阶段** 词；与 **[07](../../spec/07-开发流程与顺序.md)** 对读 |
| 3c | **[engineering/README · 号段预留](../engineering/README.md#eng-read-number-blocks)** | **engineering** 未见 **60～99** `NN` 时为 **00 §5** 预留（非遗漏） |
| 4 | **[go-live · GO Decision](../../go-live-checklist.md#go-decision-entry-point)** | GO / NO-GO 四维 |
| 5 | **[spec/95](../../spec/95-全链路生产就绪检查清单与完成度矩阵.md)** 文首（按需下钻） | 全链路清单叙事 |
| 6 | **[spec/96-索引](../../spec/96-索引-全链路外生产验收分册.md)** 文首 | **95=清单**、**96=执行** |

**与研发对齐**：功能是否落地 → **93 + 04**；**`GET …/governance/*` 只读与 `/meta` 中 `governance` 块** → **[engineering/31-C](../engineering/31-C-治理与质押只读导读.md)**（**93 §3·C**；契约仍以 **04 §3.4** 为 SSOT；**§2b.9** 证据见 **[EVIDENCE-93-c-gov](../engineering/EVIDENCE-93-c-gov-cluster-verified.md)**）；真值栈总览 → **[engineering/01](../engineering/01-技术真值栈-93-95-96-97与代码对照.md)**。

---

**返回**：[handbook 总入口](../README.md) · **[手册 00 · §2.2 文首最小集（engineering SSOT 键）](../00-手册总览与编制规范.md#hb-00-frontmatter-min)** · **工程师**：[engineering](../engineering/README.md) · **学习**：[learn](../learn/README.md)
