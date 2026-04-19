# 缺口分类总表（env / CI / DB / runtime）

**性质**：**治理资产** — 将 **docs-only 审计 TT** 登记的「缺口」按 **工程切面** 收敛，便于排期、母表检索与 **不重复开卡**。  
**日期**：2026-04-15  
**范围**：**仅文档**；**不**替代各 TT 正文；**不** bump **07**、**不**改 **04** 契约表。

**说明**：下列 **四类** 与 **B-320～B-325** 已封口台账 **互证**；**B-326** 等为 **CI 钉扎** 类延续，见 **§2**。**第二轮批次收官**（规则升格 · 空集 · **env/CI/DB/evidence** 缺口摘要）：[`TT-B320-B325-batch-closeout-summary-round2.md`](./TT-B320-B325-batch-closeout-summary-round2.md)（**evidence** 与下表 **runtime** 行 **对读** — **B-325** 发版链；**B-323** 见该文 **§4** **附**）。

---

## 1. 四类定义与代表 TT

| 类别 | 语义（缺口通常长什么样） | 代表母表 / TT | 封口 Runbook 或真值入口 |
|------|---------------------------|---------------|-------------------------|
| **env / config** | **构建期/部署期** 环境变量、**NEXT_PUBLIC_*** 与 **`.env.example`** 机读一致性、前后端配置 SSOT | **B-320** · `TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC-001` | [`TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC.md`](./TT-B320-NEXT-PUBLIC-ENV-DIFF-SPEC.md) |
| **CI / SLO** | **流水线** 分轨、**超时/预算** 叙事、**门禁** 钉扎（workflow 参数、artifact、机读 digest）；**非** 生产运行时 | **B-322** · `TT-B322-CI-TSC-VITEST-BUDGET-DOC-001`；**B-326** · `TT-B326-INTERNAL-DRILL-GATE-WORKFLOW-PARAMS-TABLE-001` | [`TT-B322-CI-TSC-VITEST-BUDGET-DOC.md`](./TT-B322-CI-TSC-VITEST-BUDGET-DOC.md)；**B-326** 真值：**[`internal_drill_gate_workflow_digest.py`](../../scripts/ops/internal_drill_gate_workflow_digest.py)** + **[主索引 §TT-B326](../AI任务卡索引.md#tt-b326-internal-drill-gate-workflow-params-table-001)** |
| **DB 运维** | **SQLx 迁移** 单源、**正向/回滚** 策略与 **RUNBOOK** 指针；**非** 业务 SQL 改写 | **B-324** · `TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER-001` | [`TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md`](./TT-B324-DB-MIGRATION-ROLLFORWARD-RUNBOOK-POINTER.md) |
| **runtime** | **运行时** 契约与可观测：**API** 暴露面（**admin flags** 等）、**evidence bundle**（`manifest.json` / **附录〇** 勾选与签字语义）、发版链 **留痕**；**非** 单次 env 键 diff | **B-323** · `TT-B323-API-CARGO-FEATURES-SURFACE-MAP-001`；**B-325** · `TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP-001` | [`TT-B323-API-CARGO-FEATURES-SURFACE-MAP.md`](./TT-B323-API-CARGO-FEATURES-SURFACE-MAP.md)；[`TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md`](./TT-B325-EVIDENCE-MANIFEST-P15-SIGNOFF-MAP.md) |

**读法**

- **env vs runtime**：**env** 偏 **「键集/示例/机读 diff」**；**runtime** 偏 **「服务行为、路由/flags、发版证据链」**。  
- **CI vs DB**：**CI** 在 **GitHub Actions / 脚本门禁**；**DB** 在 **`crates/api/migrations/`** 与 **运维 Runbook**。  
- **勿混**：**一览 376** `TT-B322-TESTNET-…`（**B-275** 协记）与 **B-322 CI 预算** 不同卡；**B-324** 与 **B-322** 叙事正交。

---

## 2. 扩展行（可选 · 登记批延续）

| 类别 | 说明 |
|------|------|
| **CI / SLO** | **B-308/B-310**（`scripts/ops` 机读子集）、**B-327**（dev 端口矩阵）等与 **门禁/预检** 同类，归入 **CI / SLO** 或在其 TT 正文标注 **「本表 §1 第二类」**。 |
| **runtime** | 若后续 TT 仅登记 **429 重试**、**i18n 键对称** 等，可归 **runtime（前端行为）** 或单列 **product/UX 文档** — **以母表「域」列为准**，本表 **不强制** 单归属。 |

---

## 3. 使用方式（给排期 / 审计）

1. **新开缺口**：先定 **四类之一**，再查是否已有 **同族 TT**（上表 **代表 TT**）。  
2. **仅登记、不改实现**：与各 B-320～B-325 **封口批** 同纪律。  
3. **实现补齐阶段**（**非** **纯** **审计** **）：已登记缺口 **→** **提案** **IMP-*** **排期** **见** [`next-batch-gap-remediation-implementation-plan.md`](./next-batch-gap-remediation-implementation-plan.md) **（** **不** **替代** **母表** **立项** **）** **。**  
4. **互证**：[母表 B-320～B-325](../任务母表.md) · [from-stash 一览 330～335](../AI任务卡索引.from-stash.md) · [07 对齐 registry · TT-B306-B335](../AI任务卡索引.from-stash.md#tt-b306-b335-07-aligned-backlog-registry-001)

---

## 4. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-04-15 | 初版：收敛 **B-320～B-325** 与 **B-326** 指向，四类定义落地。 |
| 2026-04-15 | 互证：[`TT-B320-B325-batch-closeout-summary-round2.md`](./TT-B320-B325-batch-closeout-summary-round2.md) **第二轮** **批次** **收官** **。 |
| 2026-04-15 | **实现** **补齐** **规划** **：** [`next-batch-gap-remediation-implementation-plan.md`](./next-batch-gap-remediation-implementation-plan.md) **（** **IMP-*** **提案** **）** **。 |
