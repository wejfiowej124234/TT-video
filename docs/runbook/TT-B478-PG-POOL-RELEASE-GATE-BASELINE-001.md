# TT-B478-PG-POOL-RELEASE-GATE-BASELINE-001 · **B-478** **连接池** **阈值** **基线** **固化** **与** **发布** **门禁** **联动**

**母表**：[B-478](../任务母表.md)  
**前置**：[B-474](../任务母表.md)、[B-476](../任务母表.md)、[B-477](../任务母表.md)（**[`TT-B477`](TT-B477-PG-POOL-STRESS-RECOVERY-ACCEPTANCE-001.md)**）  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0**

---

## §1 · 目标

将 **B-477** 报告中的 **`peak utilization`（`traveltrust_pg_pool_utilization_ratio` 峰值）**、**`acquire_timeout_delta`**、**`recovery_time`**（`phases.recovery.recovery_time_ms`）及关联 **PASS/FAIL** 阈值 **固化** 为仓库内 **单一机读基线**（[`config/b478_pg_pool_release_gate_thresholds.v1.json`](../../config/b478_pg_pool_release_gate_thresholds.v1.json)），并与 **机读门禁**、**CI**、**[`scripts/ops/b477-pg-pool-stress-recovery-acceptance.py`](../../scripts/ops/b477-pg-pool-stress-recovery-acceptance.py)** 联动，使 **单库 PostgreSQL** 连接池验收在发布流程中具备 **硬门禁** 锚点。

---

## §2 · 基线文件与字段

| 字段 | 含义 |
|------|------|
| **`version` / `updated_at` / `content_sha256`** | **版本** **与** **变更** **时间** **；** **`content_sha256`** **为** **去掉** **自身** **字段** **后的** **规范** **JSON** **SHA-256** **（** **防** **静默** **改阈值** **）** **。修改** **`thresholds`** **后** **运行** **`python3 scripts/gates/refresh-b478-baseline-hash.py`** **。可选** **严格** **校验** **：** **环境变量** **`B478_REQUIRE_CONTENT_SHA256=1`** **（** **见** **`check-b478-thresholds-baseline.py`** **）** **。** |
| **`max_acquire_timeout_delta`** | 压测前后 **`acquire_timeout_total`** 允许最大增量（默认 **0**） |
| **`max_slow_acquire_delta`** | **`slow_acquire_total`** 允许增量上界（默认极大，与 B-477 默认一致） |
| **`peak_utilization_max`** | 压测结束瞬间 **利用率** 上限 |
| **`recovery_target_util`** | 恢复轮询目标（与 **b477** `recovery_wait` 公式联用） |
| **`recovery_timeout_sec` / `recovery_poll_ms`** | 恢复阶段超时与间隔 |
| **`max_http_error_ratio`** | 压测阶段 HTTP 失败比例上限 |

**加载顺序**：`B477_*` 环境变量 **优先**；未设置时 **`b477`** 脚本从 **`config/b478_pg_pool_release_gate_thresholds.v1.json`** 读取（路径可 **`B478_BASELINE_FILE`** 覆盖）。

---

## §3 · 机读门禁

```bash
# 合入 / CI：基线文件存在且合法（Build workflow 已串联）
python3 scripts/gates/check-b478-thresholds-baseline.py

# 发布前：已有 B-477 report.v1.json 时，与基线严格比对（verdict PASS + 阈值 + params 一致）；stderr 含 FAIL_REASON:* 与可选 WARN: NEAR_POOL_SATURATION
python3 scripts/gates/check-b478-b477-report-gate.py evidence/b477_pg_pool_stress_recovery/run_<UTC>/report.v1.json

# B-477 报告 schema（沿用 TT-B477）
python3 scripts/gates/check-b477-report-schema.py evidence/b477_pg_pool_stress_recovery/run_<UTC>/report.v1.json
```

---

## §4 · 与 TT-B477 的关系

- **B-477**：生成 **`report.v1.json`**，字段与 **`thresholds`** 对齐。  
- **B-478**：将 **`thresholds`** **升格为发布基线**；**CI** 每日验证基线文件 **不损坏**；**发版** 时在目标环境跑 **B-477** 并对 **`report`** 跑 **`check-b478-b477-report-gate.py`**（**fail-closed**）。

---

**文档版本**：1.0 · 2026-04-18
