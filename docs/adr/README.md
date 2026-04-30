# ADR（Architecture Decision Records）

本目录为 **架构决策记录（Why）** 的正文落盘区；**现行架构叙述 SSOT** 仍以 **[spec/02-架构设计.md](../spec/02-架构设计.md)**、**[spec/09-技术架构总览-v1.0.md](../spec/09-技术架构总览-v1.0.md)** 为准（与 **[engineering/07 · §3](../handbook/engineering/07-架构决策记录ADR规范.md#adr-3-location)** 同条）。

**handbook 内入口**：[`docs/handbook/engineering/adr/README.md`](../handbook/engineering/adr/README.md)（仅互链，**禁止**在 `engineering/adr/` 下新增 `ADR-*.md` 正文）。

## 索引（按文件名）

| 文件 | 状态 | 摘要 |
|------|------|------|
| [ADR-20260430-engineering-primary-read-path-vs-spec-ssot.md](./ADR-20260430-engineering-primary-read-path-vs-spec-ssot.md) | **proposed** | **人读**默认走 `engineering/`；**04/93/14/07** 等**机读契约**在迁移完成前仍以 **spec + 代码 + 脚本** 为准；禁止未走 **98/08/STATUS** 整树删 spec。 |
| [TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md](../runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md) | **执行清单** | **Phase A～F** 优先级任务（L1～L4 阶梯）；与上条 ADR 同读。 |
