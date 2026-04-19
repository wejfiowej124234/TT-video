# TT-B480-PROD-FAULT-SLO-ACCEPTANCE-001 · **B-480** **生产** **拓扑** **故障** **注入** **与** **双态** **SLO** **放行**

**母表**：[B-480](../任务母表.md)  
**前置**：[B-474](../任务母表.md)、[B-476](../任务母表.md)、[B-478](../任务母表.md)（[`TT-B478`](TT-B478-PG-POOL-RELEASE-GATE-BASELINE-001.md)）、[B-479](../任务母表.md)（[`TT-B479`](TT-B479-PG-POOL-MULTI-INSTANCE-STRESS-001.md)）  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0** **韧性** **收口**

---

## §1 · 目标

在 **真实** **或** **准生产** **拓扑** **（** **负载** **均衡** **+** **多** **API** **节点** **+** **全局限流** **/** **关键** **写** **限流** **）** **下**，通过 **外部** **失败** **注入** **（** **不** **改** **业务** **代码** **）** **验证** **：**

- **DB** **延迟** **、** **连接** **拒绝** **、** **网络** **抖动** **等** **异常** **期间** **的** **HTTP** **错误率** **、** **429** **（** **退避** **信号** **）** **与** **5xx** **比例** **；**
- **故障** **清除** **后** **恢复** **阶段** **的** **成功率** **与** **`aggregate.recovery_time_sec`** **（** **末段** **fault** **结束** **→** **recovery** **段** **开始** **）** **；**
- **与** **B-477～B-479** **（** **正常** **/** **池** **压测** **态** **）** **并列** **，** **形成** **「** **正常** **+** **故障** **」** **双态** **发布** **门禁** **。**

**API** **侧** **既有** **行为** **锚点** **：** **全局限流** **（** **`429`** **）** **见** **[`crates/api/src/middleware/rate_limit.rs`](../../crates/api/src/middleware/rate_limit.rs)** **；** **池** **退避** **与** **`/metrics`** **见** **[B-476](TT-B476-PG-POOL-RUNTIME-OBS-BACKOFF-001.md)** **。** **熔断** **若** **由** **LB** **/** **网格** **实现** **，** **须** **在** **`topology`** **备注** **中** **写明** **厂商** **与** **策略** **。**

---

## §2 · 机读真源

| 资产 | 说明 |
|------|------|
| **[`config/b480_prod_fault_slo_gate.v1.json`](../../config/b480_prod_fault_slo_gate.v1.json)** | **双态** **SLO** **上界** **（** **各** **`segment_id`** **）** **与** **`recovery_after_fault.max_recovery_time_sec`** **；** **改** **阈值** **后** **`python3 scripts/gates/refresh-b480-gate-config-hash.py`** |
| **[`scripts/ops/b480-prod-fault-injection-acceptance.py`](../../scripts/ops/b480-prod-fault-injection-acceptance.py)** | **对** **`B480_LB_BASE`** **探针** **采样** **，** **按** **阶段** **追加** **`segments.jsonl`** **；** **`--finalize`** **合并** **为** **`report.v1.json`** |
| **`scripts/gates/check-b480-gate-config.py`** | **CI** **/** **合入** **：** **配置** **JSON** **合法** |
| **`scripts/gates/check-b480-report-gate.py`** | **发布** **前** **：** **真实** **`report.v1.json`** **与** **基线** **fail-closed** |

**池** **指标** **上界** **可** **对照** **[`config/b478_pg_pool_release_gate_thresholds.v1.json`](../../config/b478_pg_pool_release_gate_thresholds.v1.json)** **（** **B-478** **）** **；** **探针** **可** **写** **`pool_acquire_timeout_delta`** **（** **可选** **）** **供** **门禁** **比对** **`fault_db_latency.max_pool_acquire_timeout_delta`** **。**

---

## §3 · 演练顺序（运维执行故障；脚本只采样）

1. **建目录** **：** **`export B480_RUN_DIR=evidence/b480_prod_fault_injection/run_<UTC>`** **`mkdir -p "$B480_RUN_DIR"`**  
2. **`export B480_LB_BASE=https://<your-lb>`**  
3. **正常** **态** **：** **`B480_SEGMENT=normal`** **跑** **探针**  
4. **按** **[`fault_injection_playbook`](../../config/b480_prod_fault_slo_gate.v1.json)** **在** **目标** **环境** **注入** **一类** **故障** **，** **保持** **注入** **期间** **运行** **对应** **`B480_SEGMENT`** **（** **`fault_db_latency`** **/** **`fault_connection_refused`** **/** **`fault_network_jitter`** **）**  
5. **重复** **多** **类** **故障** **（** **建议** **每类** **独立** **段** **）**  
6. **撤除** **故障** **后** **：** **`B480_SEGMENT=recovery`** **探针**  
7. **合并** **：** **`B480_RUN_DIR=...`** **`python3 scripts/ops/b480-prod-fault-injection-acceptance.py --finalize`**  
8. **门禁** **：** **`python3 scripts/gates/check-b480-report-gate.py "$B480_RUN_DIR/report.v1.json"`**

---

## §4 · 发布 Gate 组合（建议）

| 态 | 门禁 / 证据 |
|----|-------------|
| **正常** **+** **池** | **B-477** **`report`** **`+`** **`check-b478-b477-report-gate`** **；** **多** **节点** **：** **B-479** **`+`** **`check-b479-report-gate`** |
| **故障** **+** **恢复** | **B-480** **`report.v1.json`** **`+`** **`check-b480-report-gate`** **（** **本** **Runbook** **）** |

**可选** **环境** **变量** **：** **`B480_REQUIRE_CONTENT_SHA256=1`** **（** **与** **B-478** **/** **B-479** **同** **模式** **）** **严格** **锁** **配置** **哈希** **。**

---

**文档版本**：1.0 · 2026-04-18
