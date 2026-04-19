# TT-B477-PG-POOL-STRESS-RECOVERY-ACCEPTANCE-001 · **B-477** **连接池** **压力** **与** **恢复** **验收**

**母表**：[B-477](../任务母表.md)  
**前置**：[B-474](../任务母表.md) **（** **池** **参数** **）** **、** **[B-476](../任务母表.md)** **（** **池** **观测** **）** **、** **[B-473](../任务母表.md)** **（** **可选** **封口** **串联** **）**  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0**

---

## §1 · 目标

在**受控并发** HTTP 负载下，对 **`GET /metrics`** 中的 **`traveltrust_pg_pool_*`** 与 **`GET /meta.database.pool`** **同源** **字段** **做** **采样** **对比** **；** **记录** **PASS/FAIL** **、** **阈值** **命中** **项** **、** **恢复** **时间** **（** **毫秒** **）** **与** **最小** **修复** **建议** **。**  
**可选** **末尾** **串联** **`bash scripts/ops/b473-seal-b460-tt-u03.sh`** **（** **`B477_RUN_SEAL=1`** **）** **作为** **全栈** **回归** **锚点** **。**

---

## §2 · 一键命令

```bash
# API 已监听且 DATABASE_URL 可用；建议提供会话 Bearer 以走 GET /api/v1/me 真实占池
export B477_API_BASE=http://127.0.0.1:8080
export B477_AUTH_BEARER='…'   # 可选但强烈推荐
bash scripts/ops/b477-pg-pool-stress-recovery-bundle.sh

# 同一目录再跑 seal（耗时长，须 Playwright 全栈）
export B477_RUN_SEAL=1
bash scripts/ops/b477-pg-pool-stress-recovery-bundle.sh --run-seal
```

**机读** **输出** **：** **`evidence/b477_pg_pool_stress_recovery/run_<UTC>/report.v1.json`** **+** **`pass_fail.md`**

---

## §3 · 判定与阈值（可调）

**发布** **阈值** **机读** **真源** **（** **B-478** **）** **：** **[`config/b478_pg_pool_release_gate_thresholds.v1.json`](../../config/b478_pg_pool_release_gate_thresholds.v1.json)** **；** **详见** **[`TT-B478`](TT-B478-PG-POOL-RELEASE-GATE-BASELINE-001.md)** **。** **`b477`** **脚本** **在** **未** **设置** **对应** **`B477_*`** **时** **从** **该** **文件** **加载** **默认** **值** **（** **`B478_BASELINE_FILE`** **可** **覆盖** **路径** **）** **。**

| 维度 | 默认 | 环境变量 / CLI |
|------|------|----------------|
| **PoolTimedOut** **累计** **增量** | **0** **（** **不允许** **增长** **）** | **`B477_MAX_ACQUIRE_TIMEOUT_DELTA`** |
| **峰值** **utilization** | **≤** **0.98** | **`B477_PEAK_UTILIZATION_MAX`** |
| **恢复** | **utilization_ratio** **≤** **`max(B477_RECOVERY_TARGET_UTIL, baseline+0.08)`** **在** **超时** **内** | **`B477_RECOVERY_*`** |
| **HTTP** **失败** **比例** | **≤** **2%** | **`B477_MAX_HTTP_ERROR_RATIO`** |

**未** **设置** **`B477_AUTH_BEARER`** **时** **：** **压测** **以** **`/meta`** **+** **`/metrics`** **为主** **，** **对** **sqlx** **池** **压力** **较弱** **；** **报告** **`notes`** **会** **提示** **。**

---

## §4 · 机读门禁（合入前 / CI 可选）

```bash
# 对已存在的验收报告做 schema 校验
python scripts/gates/check-b477-report-schema.py evidence/b477_pg_pool_stress_recovery/run_<UTC>/report.v1.json
```

---

## §5 · 与 B-476 / B-473 的关系

- **B-476** **：** **代码** **与** **`check-b476-*`** **保证** **观测** **契约** **不** **漂移** **。  
- **B-477** **：** **目标** **环境** **下** **跑** **本** **脚本** **，** **证明** **高** **负载** **后** **指标** **可** **恢复** **；** **可选** **`b473-seal`** **证明** **全栈** **仍** **绿** **。**

---

**文档版本**：1.0 · 2026-04-18
