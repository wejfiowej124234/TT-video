# TT-B481-MULTI-REGION-DR-ACCEPTANCE-001 · **B-481** **跨区域** **容灾** **与** **切换** **验证** **（** **Multi-Region** **/** **Multi-AZ** **）**

**母表**：[B-481](../任务母表.md)  
**前置**：[B-478](../任务母表.md)、[B-480](../任务母表.md)（[`TT-B480`](TT-B480-PROD-FAULT-SLO-ACCEPTANCE-001.md)）  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0** **多区** **韧性**

---

## §1 · 目标

在 **B-480** **单区** **故障** **模型** **之上**，对 **整** **节点** **、** **整** **可用区** **、** **整** **区域** **级** **失效** **做** **端到端** **演练** **，** **验证** **：**

- **流量** **切换** **（** **GSLB** **/** **Geo-DNS** **/** **区域** **LB** **权重** **）** **与** **探针** **可见** **的** **HTTP** **成功率** **；**
- **数据** **面** **一致性** **代理** **：** **复制** **滞后** **（** **`replication_lag_sec_max_observed`** **）** **、** **读写** **路径** **延迟** **（** **`p95_latency_ms`** **）** **；** **由** **云** **RDS** **/** **PG** **监控** **/** **只读** **副本** **或** **运维** **填入** **`B481_EXTRA_METRICS_JSON`** **；**
- **恢复** **目标** **代理** **：** **`aggregate.failover_time_sec`** **（** **末次** **区域** **级** **fault** **结束** **→** **`failover_traffic_switch`** **开始** **）** **作** **RTO** **下界** **观测** **；** **`aggregate.rpo_sec_observed`** **为** **各** **段** **`rpo_sec_observed`** **的** **上确界** **（** **业务** **定义** **须** **书面** **固定** **）** **。**

**形成** **「** **单区** **（** **B-480** **）** **+** **多区** **（** **B-481** **）** **」** **全** **链路** **生产** **放行** **：** **发版** **前** **除** **B-477～B-479** **/** **B-480** **外** **，** **对** **目标** **多** **区域** **部署** **跑** **本** **Runbook** **并** **通过** **`check-b481-report-gate.py`** **。**

---

## §2 · 机读真源

| 资产 | 说明 |
|------|------|
| **[`config/b481_multi_region_dr_slo_gate.v1.json`](../../config/b481_multi_region_dr_slo_gate.v1.json)** | **分段** **SLO** **+** **`aggregate_limits`** **（** **RTO** **/** **复制** **/** **RPO** **上界** **）** **；** **改** **后** **`python3 scripts/gates/refresh-b481-gate-config-hash.py`** |
| **[`config/b480_prod_fault_slo_gate.v1.json`](../../config/b480_prod_fault_slo_gate.v1.json)** | **单区** **故障** **模型** **参照** **（** **extends_single_region_fault_gate** **）** |
| **[`scripts/ops/b481-multi-region-dr-acceptance.py`](../../scripts/ops/b481-multi-region-dr-acceptance.py)** | **探针** **/** **`segments.jsonl`** **/** **`--finalize`** **→** **`report.v1.json`** |
| **`scripts/gates/check-b481-gate-config.py`** | **CI** **/** **合入** |
| **`scripts/gates/check-b481-report-gate.py`** | **发布** **门禁** |

---

## §3 · 分段 ID（与脚本一致）

| `B481_SEGMENT` | 含义 |
|----------------|------|
| **`normal_single_region`** | **基线** **（** **单** **区域** **稳态** **）** |
| **`fault_whole_node`** | **单** **节点** **摘除** **/** **宕机** |
| **`fault_whole_az`** | **整** **AZ** **不可用** |
| **`fault_whole_region`** | **整** **区域** **入口** **或** **计算** **面** **失效** |
| **`failover_traffic_switch`** | **主动** **或** **自动** **流量** **切** **至** **DR** **/** **他** **区** |
| **`recovery_steady`** | **切换** **后** **稳态** **验证** |

---

## §4 · 执行要点

1. **`export B481_RUN_DIR=...`** **，** **`export B481_LB_BASE=`** **（** **全局** **入口** **）** **。**  
2. **按** **§3** **顺序** **或** **演练** **剧本** **逐段** **执行** **；** **每** **段** **前** **在** **环境** **侧** **完成** **对应** **故障** **/** **切换** **动作** **（** **见** **基线** **内** **`dr_playbook`** **）** **。**  
3. **复制** **滞后** **/** **RPO** **/** **p95** **若** **HTTP** **探针** **无法** **直接** **得到** **，** **在** **该** **段** **设置** **：** **`export B481_EXTRA_METRICS_JSON='{"replication_lag_sec_max_observed":1.5,"p95_latency_ms":900,"rpo_sec_observed":12}'`** **（** **数值** **须** **与** **监控** **一致** **）** **。**  
4. **`python3 scripts/ops/b481-multi-region-dr-acceptance.py --finalize`**  
5. **`python3 scripts/gates/check-b481-report-gate.py "$B481_RUN_DIR/report.v1.json"`**

---

## §5 · 与 B-480 的 Gate 组合（建议）

| 层级 | 门禁 |
|------|------|
| **单区** **韧性** | **B-480** **`check-b480-report-gate`** |
| **多区** **DR** | **B-481** **`check-b481-report-gate`** |
| **池** **/** **正常** **态** **压测** | **B-477～B-479** **（** **既有** **）** **。**

---

**文档版本**：1.0 · 2026-04-18
