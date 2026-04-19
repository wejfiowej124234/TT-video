# TT-B474-PG-SINGLE-DB-POOL-GOVERNANCE-001 · **B-474** **单库** **连接池** **治理**

**母表**：[B-474](../任务母表.md)  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0**

---

## §1 · 目标

将 **`traveltrust-api`** 的 **`sqlx::PgPoolOptions`** 从硬编码改为 **环境可调**，并固定 **acquire / idle / max_lifetime**，降低 **`pool timed out waiting for an open connection`** 类故障（与实例 **`max_connections`** 预算对齐由运维在 PG 侧配置）。

---

## §2 · 实现锚点

| 路径 | 内容 |
|------|------|
| [`crates/api/src/startup/pool_config.rs`](../../crates/api/src/startup/pool_config.rs) | **`build_pg_pool_options`**、启动日志 **`log_pg_pool_options_summary`** |
| [`.env.example`](../../.env.example) | **`DATABASE_POOL_*`** 注释与默认值说明 |

---

## §3 · 机读验收

```bash
cargo test -p traveltrust-api b474_ -- --nocapture
python scripts/gates/check-b474-pg-pool-env-documented.py
```

**退出码**：均为 **0** **⇒** **本** **TT** **机读** **PASS**（**封口** **时** **须** **在** **母表** **行** **备注** **日期** **）** **。**

---

## §4 · 与里程碑关系

**「单库生产级基线收口」** **第一里程碑** **=** **母表** **[B-474](../任务母表.md)** **+** **[B-475](../任务母表.md)** **（** **连接池** **+** **备份** **/** **PITR** **基线** **）** **；** **勿** **把** **[路线图** **全文**](../architecture/postgresql-layered-evolution-roadmap.md) **当作** **单张** **实施** **卡** **。**

---

**文档版本**：1.0 · 2026-04-18
