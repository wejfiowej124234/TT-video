# TT-B479-PG-POOL-MULTI-INSTANCE-STRESS-001 · **B-479** **多** **API** **实例** **并发** **下** **PostgreSQL** **连接池** **竞争** **压测** **与** **发布** **门禁**

**母表**：[B-479](../任务母表.md)  
**前置**：[B-474](../任务母表.md)、[B-478](../任务母表.md)（[`TT-B478`](TT-B478-PG-POOL-RELEASE-GATE-BASELINE-001.md)）、[B-477](../任务母表.md)（[`TT-B477`](TT-B477-PG-POOL-STRESS-RECOVERY-ACCEPTANCE-001.md)）  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0**

---

## §1 · 目标

在 **N** 个 **API** **节点** **并行** **压测** **同一** **PostgreSQL** **实例** **的** **场景** **下**，验证 **全局** **连接** **上限** **、** **实例** **间** **争抢** **、** **恢复** **时间** **与** **HTTP** **错误率** **；** **阈值** **真源** **继承** **[`config/b478_pg_pool_release_gate_thresholds.v1.json`](../../config/b478_pg_pool_release_gate_thresholds.v1.json)** **（** **B-478** **）** **，** **报告** **与** **门禁** **脚本** **对齐** **聚合** **指标** **。**

---

## §2 · 机读资产

| 资产 | 说明 |
|------|------|
| **[`config/b479_pg_pool_multi_instance_gate.v1.json`](../../config/b479_pg_pool_multi_instance_gate.v1.json)** | **B-479** **门禁** **元数据** **（** **schema** **/** **version** **/** **`content_sha256`** **）** **；** **修改** **后** **运行** **`python3 scripts/gates/refresh-b479-gate-config-hash.py`** |
| **[`scripts/ops/b479-pg-pool-multi-instance-stress-acceptance.py`](../../scripts/ops/b479-pg-pool-multi-instance-stress-acceptance.py)** | **压测** **与** **`report.v1.json`** **输出** |
| **`scripts/gates/check-b479-multi-instance-gate-config.py`** | **合入** **/** **CI** **：** **校验** **B-479** **配置** **JSON** |
| **`scripts/gates/check-b479-report-gate.py`** | **发布** **前** **：** **对** **真实** **`report.v1.json`** **与** **B-478** **阈值** **fail-closed** |

**环境变量（摘录）**：**`B479_API_BASES`** **（** **逗号** **分隔** **API** **根** **URL** **，** **多** **实例** **语义** **建议** **≥2** **）** **；** **`B478_BASELINE_FILE`** **可** **覆盖** **B-478** **路径** **；** **预发** **门禁** **可** **设** **`B479_REQUIRE_TWO_INSTANCES=1`** **强制** **≥2** **实例** **。**

---

## §3 · 执行与验收

```bash
export B479_API_BASES="http://api-a:8080,http://api-b:8080"
# 可选：export B477_AUTH_BEARER="..."   # mixed 模式占池
python3 scripts/ops/b479-pg-pool-multi-instance-stress-acceptance.py
# 对生成的 evidence/b479_pg_pool_multi_instance/run_<UTC>/report.v1.json：
python3 scripts/gates/check-b479-report-gate.py evidence/b479_pg_pool_multi_instance/run_<UTC>/report.v1.json
```

**运维** **须** **核对** **：** **Σ** **`DATABASE_POOL_MAX_CONNECTIONS`** **（** **各** **API** **实例** **）** **≤** **PostgreSQL** **`max_connections`** **（** **见** **报告** **`notes`** **）** **。**

---

**文档版本**：1.0 · 2026-04-18
