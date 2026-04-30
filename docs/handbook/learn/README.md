# 学习读本 · `learn/`（小白入门）

**Version:** 1.2.8 · **最后更新：** 2026-04-29  

**正式学习顺序**以 **[00-学习路径总览](./00-学习路径总览.md)** 为准；本 README 为快速入口。后续按域扩写：**§5.3** **10～19**；见 **[手册 00 §9～§10](../00-手册总览与编制规范.md#hb-00-layer-model)**。**主序对拍**：扩 **learn/** 主序列 **NN** 或改下表前，须符合 **[手册 00 §5.3 `learn/`](../00-手册总览与编制规范.md#hb-00-number-blocks)** 号段约定，并与 **[00 §3 主表](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README 主序列](../engineering/README.md)** **不抢号**。**同 PR 若还改 `engineering/00～50` 主序 `NN-*.md`**，须另勾 **[engineering/02 · §4a](../engineering/02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**（**手册 00 §3** / **engineering/README** / 磁盘三处；与 **[CONTRIBUTING](../../../CONTRIBUTING.md)** 同条）。

**SSOT 纪律（与 [00](./00-学习路径总览.md)、[01](./01-仓库地图与首次克隆.md) 文首块引同口径）**：本 README 与 **`learn/NN-*`** 只编排入门与地图；**工程总纲与版本表**仍 **[07](../../spec/07-开发流程与顺序.md)**、**[spec/00](../../spec/00-文档索引.md)**；**HTTP 机读**仍 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**仍 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**合 PR 命令**仍 **[CONTRIBUTING](../../../CONTRIBUTING.md)**。删 **`docs` 下 `spec` 子树** 须 **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)** + **[engineering/09 §3](../engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）+ **[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**（与 **[engineering/README](../engineering/README.md)** 同程序链）。

---

## 本目录主序列（按 NN）

| NN | 文档 | 状态 | 一句话 |
|----|------|------|--------|
| 00 | [00-学习路径总览.md](./00-学习路径总览.md) | 现行 | 整条路径编排 |
| 01 | [01-仓库地图与首次克隆](./01-仓库地图与首次克隆.md) | 现行 | 目录树 + 克隆后先打开哪些文件 |

---

## 快速入口（与 00 一致）

1. 根 **[README](../../../README.md)** — **工程规划方向**。  
2. **[CONTRIBUTING](../../../CONTRIBUTING.md)** — 命令与禁忌。  
3. **[spec/00 读前摘要](../../spec/00-文档索引.md)** — 文档地图。  
4. **[engineering/01](../engineering/01-技术真值栈-93-95-96-97与代码对照.md)** — 93/95/96/97 一条线。  
5. **[`docs/adr/README`](../../adr/README.md)** + **[engineering/07](../engineering/07-架构决策记录ADR规范.md)** — 架构 **Why**（**不**替代 **04 §3.4 / 93 / 代码**）。  
6. **[engineering/32 §0](../engineering/32-横切-Wave与阶段体系导读.md#x32-0-terminology)** — **Wave/阶段** 词（与 **[07](../../spec/07-开发流程与顺序.md)** 对读）。  
7. **[engineering/README · 号段预留](../engineering/README.md#eng-read-number-blocks)** — **engineering** 未见 **60～99** `NN` 成稿时为 **[手册 00 §5](../00-手册总览与编制规范.md#hb-00-number-blocks)** 预留（**非**漏文档）。

进阶：**[07](../../spec/07-开发流程与顺序.md)** §零、§五；**[96-01](../../spec/96-01-总则与95边界和执行顺序.md)** §0。

**编制规范**：[手册 00](../00-手册总览与编制规范.md) · **[§2.2 文首最小集（engineering / `EVIDENCE-*` 与 CONTRIBUTING 同键）](../00-手册总览与编制规范.md#hb-00-frontmatter-min)** · **返回**：[handbook 总入口](../README.md) · **产品**：[product-manager](../product-manager/README.md) · **工程师**：[engineering](../engineering/README.md)
