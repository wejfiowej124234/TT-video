# TT-B482-FINANCIAL-CORRECTNESS-ACCEPTANCE-001 · **B-482** **数据** **一致性** **与** **金融级** **正确性** **放行**

**母表**：[B-482](../任务母表.md)  
**前置**：[B-481](../任务母表.md)（[`TT-B481`](TT-B481-MULTI-REGION-DR-ACCEPTANCE-001.md)）、[B-478](../任务母表.md)（池阈值真源）  
**代码锚点**：[crates/api/src/chain_off/reconcile.rs](../../crates/api/src/chain_off/reconcile.rs)（链事件投影与 **`reconcile_order_chain_vs_db`** 骨架）

---

## §1 · 目标

在 **B-481** **多区** **韧性** **之上**，用 **机读** **`report.v1.json`** **证明** **：**

- **跨** **节点** **/** **跨** **副本** **账本** **对账** **（** **ledger** **reconciliation** **）** **：** **未** **清** **账目** **行** **、** **链上** **状态** **与** **DB** **投影** **不一致** **计数** **、** **资金** **差额** **（** **wei** **）** **；**
- **幂等** **：** **违反** **幂等** **契约** **的** **请求** **计数** **（** **与** **`GET /meta.idempotency_cache`** **叙事** **一致** **）** **；**
- **重复** **/** **丢失** **交易** **：** **重复** **执行** **、** **应** **到** **未到** **事件** **；**
- **状态** **分叉** **：** **链** **↔** **DB** **权威** **冲突** **观测** **；**
- **最终** **一致性** **：** **复制** **滞后** **上界** **、** **`event_log`** **追** **平** **时间** **上界** **（** **与** **部署** **侧** **观测** **一致** **）** **。**

**硬** **约束** **（** **见** **[`config/b482_financial_correctness_gate.v1.json`](../../config/b482_financial_correctness_gate.v1.json)** **`hard_requirements`** **）** **：** **无** **资金** **丢失** **、** **无** **重复** **金融** **执行** **、** **无** **丢失** **交易** **、** **无** **状态** **分叉** **（** **计数** **须** **为** **零** **或** **差额** **为** **零** **）** **。**

---

## §2 · 机读真源

| 资产 | 说明 |
|------|------|
| **[`config/b482_financial_correctness_gate.v1.json`](../../config/b482_financial_correctness_gate.v1.json)** | **`limits`** **+** **`hard_requirements`** **；** **改** **后** **`python3 scripts/gates/refresh-b482-gate-config-hash.py`** |
| **`scripts/gates/check-b482-gate-config.py`** | **CI** **/** **合入** |
| **`scripts/gates/check-b482-report-gate.py`** | **发布** **门禁** |
| **`evidence/b482_financial_correctness/`** | **演练** **输出** **目录** **（** **含** **`report.v1.json`** **）** |

**证据** **来源** **（** **典型** **）** **：** **internal** **reconcile** **/** **indexer** **与** **`event_log`** **对齐** **作业** **、** **按** **订单** **/** **托管** **地址** **聚合** **的** **链** **↔** **DB** **报表** **、** **幂等** **键** **审计** **表** **、** **跨** **区** **只读** **副本** **滞后** **指标** **。** **字段** **语义** **须** **与** **`checks.*`** **键** **一致** **。**

---

## §3 · `report.v1.json` 结构（摘要）

- **`checks.ledger_reconciliation`** **：** **`unreconciled_rows`** **、** **`chain_vs_db_mismatch_count`** **、** **`fund_discrepancy_wei`** **（** **字符串** **整数** **wei** **）** **。**
- **`checks.idempotency`** **：** **`violations_count`** **等** **。**
- **`checks.duplicate_or_lost_tx`** **：** **`duplicate_execution_count`** **、** **`lost_transaction_count`** **。**
- **`checks.state_fork`** **：** **`observed_fork_count`** **。**
- **`checks.eventual_consistency_proof`** **：** **`max_replication_lag_sec`** **、** **`event_log_catchup_within_sec`** **。**

---

## §4 · 发布 Gate 组合（可靠性 + 正确性）

| 维度 | 建议门禁 |
|------|----------|
| **可靠性** **/** **韧性** | **B-477～B-481** **（** **池** **/** **故障** **/** **多区** **）** |
| **正确性** | **B-482** **`check-b482-report-gate.py`** **（** **本** **Runbook** **）** |

```bash
python3 scripts/gates/check-b482-report-gate.py evidence/b482_financial_correctness/run_<UTC>/report.v1.json
```

---

**文档版本**：1.0 · 2026-04-18
