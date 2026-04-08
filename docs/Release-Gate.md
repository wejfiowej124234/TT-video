# Release Gate 索引（仓库内）

本文档为 **发版 / 审计** 时可选的 **Gate 入口索引**；**不替代** [08-1](spec/08-1-战略与合规风险检查清单.md)、[08-2](spec/08-2-附录-闭合工单表.md)、[08-3](spec/08-3-参数与门禁表.md)、[08-4](spec/08-4-对外口径包.md) 及 [ops/RUNBOOK.md](../ops/RUNBOOK.md) **§12.x** 全量清单。

## B-110：四根级链上 SSOT（治理池）

| 项 | 指针 |
|----|------|
| **GO 声明（可附 release）** | [evidence/GO_20260407_B110.md](../evidence/GO_20260407_B110.md) |
| **任务卡** | `TT-RELEASE-GATE-B110-SSOT-CLOSE-009` |
| **母表** | [docs/任务母表.md](任务母表.md) **B-110** |
| **Runbook** | [ops/RUNBOOK.md](../ops/RUNBOOK.md) **§7.1.1**（`country_pool`）、**§7.1.2**（`treasury_erc20_pool`）；**`pool_balance` / `treasury_pool（Wei）`** 与同节 env 闸 **同型验证** |
| **Evidence 命名约定** | [evidence/README.md](../evidence/README.md) **治理池根级链上 SSOT 演练留痕（B-110）** |

**结论引用**：以 **GO 文档 §5** 为准；整库发版须叠加其它 Gate 与工单 **Evidence** 列要求。

---

*其它 Gate 条目可在本文件按发版节奏追加，与 `evidence/GO_YYYYMMDD/` bundle 互指。*
