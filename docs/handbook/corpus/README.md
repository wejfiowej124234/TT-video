# `corpus/` · 从 `docs`/`spec` 重写后的正文承载区

**Version:** 1.0.9 · **最后更新：** 2026-04-29  
**受众**：Owner / 文档迁移负责人  

本目录存放**已整理、按规范重写的技术正文**（**不是**仅索引）。文件名规则：**`REG-{NN}-主题.md`**，`NN` 与 **`docs`/`spec`** 主序列 **01、02、…** **大致同号**，便于对照与批量迁移。**主序对拍**：若 **REG** 的 **NN** 与 **engineering** 主序列一并编排，须与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)** 及 **[engineering/README 主序列](../engineering/README.md)** **同行同序**；命名与区段见 **[00 §2.1.2](../00-手册总览与编制规范.md#hb-00-naming-locale)**。**同 PR 若还改 `engineering/00～50` 主序 `NN-*.md`**，须另勾 **[engineering/02 · §4a](../engineering/02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**（**手册 00 §3** / **engineering/README** / 磁盘三处；与 **[CONTRIBUTING](../../../CONTRIBUTING.md)** 同条）。

**SSOT 纪律**：**`REG-*`** 为 **spec** 的浓缩再生，**不**替代各篇 **spec** 长表与硬表体；**§3.4 机读**仍 **[04](../../spec/04-后端与API.md)**，**域矩阵**仍 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。各 **REG** 文首均有 **`SSOT 边界`** 块引。删 **`docs` 下 `spec` 子树** 须 **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)** + **[engineering/09 §3](../engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）及 **[SPEC-MIGRATION-STATUS](./SPEC-MIGRATION-STATUS.md)**、**[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)** 程序同批，**不**以 **`REG-*`** 单独为准。

| 文件 | 对应 spec（过渡期仍可能机读） | 说明 |
|------|------------------------------|------|
| [SPEC-MIGRATION-STATUS.md](./SPEC-MIGRATION-STATUS.md) | 全 `docs`/`spec` | **能否删 spec** 的前置条件与阶段划分 |
| [REG-01-业务与系统总览.md](./REG-01-业务与系统总览.md) | [01-总库总览](../../spec/01-总库总览.md) | 业务、混合架构、订单主线、硬约束入口（浓缩重写） |
| [REG-02-架构分层与领域.md](./REG-02-架构分层与领域.md) | [02-架构设计](../../spec/02-架构设计.md) | 分层、领域切分、链/DB 边界（浓缩重写） |
| [REG-03-业务流程与风控.md](./REG-03-业务流程与风控.md) | [03-业务流程与风控](../../spec/03-业务流程与风控.md) | 流程主线、取消/质押、评分、争议与执行器（浓缩重写） |
| [REG-04-API叙事.md](./REG-04-API叙事.md) | [04-后端与API](../../spec/04-后端与API.md)（**§3.4** 表体 SSOT） | API 文档地图与合入门禁语境；**不**复制 **§3.4** 表体；与 **[engineering/04](../engineering/04-HTTP与路由契约导读.md)** 同簇 |

**下一批**（按 Owner 排期扩写）：**`REG-05…`** 起（**`REG-01`～`REG-04`** 已各就位于上表；**04 §3.4** 表体仍以 **spec/04** 为 SSOT）；附录与专题链仍回对应 **spec** 篇。

**扩展规划**（何时写新 **REG**、何时写 **engineering NN**）：[手册 00 §9～§10](../00-手册总览与编制规范.md#hb-00-layer-model)。

**返回**：[手册 00](../00-手册总览与编制规范.md) · [handbook 根 README](../README.md)
