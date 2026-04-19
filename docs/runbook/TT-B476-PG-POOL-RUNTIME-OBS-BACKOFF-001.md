# TT-B476-PG-POOL-RUNTIME-OBS-BACKOFF-001 · **B-476** **连接池** **运行时** **观测** **与** **退避** **协同**

**母表**：[B-476](../任务母表.md)  
**前置**：[B-474](../任务母表.md) **（** **池** **参数** **）** **、** **[B-475](../任务母表.md)** **（** **备份** **基线** **）**  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0** **延续**

---

## §1 · 目标

为 **`sqlx::PgPool`** **建立** **进程内** **可观测** **锚点** **：** **`PoolTimedOut`** **累计** **、** **慢** **等待** **（** **近似** **）** **、** **瞬时** **利用率** **（** **in_use/max** **）** **；** **与** **`GET /meta.database.pool`** **及** **`GET /metrics`** **同源** **。**  
**退避** **策略** **：** **客户端** **/** **上游** **在** **`acquire_timeout_total`** **增长** **或** **`utilization`** **贴近** **`alert_utilization_ratio`** **时** **应** **退避** **重试** **（** **指数** **退避** **/** **抖动** **见** **运维** **Runbook** **）** **；** **服务端** **以** **`DATABASE_POOL_*`** **与** **可选** **`DATABASE_STATEMENT_TIMEOUT_MS`** **（** **PG** **`statement_timeout`** **）** **为主** **。**

---

## §2 · 实现锚点

| 路径 | 内容 |
|------|------|
| [`crates/api/src/db_pool_obs.rs`](../../crates/api/src/db_pool_obs.rs) | **计数器** **、** **`/metrics`** **追加** **、** **`meta.database.pool`** **快照** **构造** |
| [`crates/api/src/routes/health_meta/handlers.rs`](../../crates/api/src/routes/health_meta/handlers.rs) | **`GET /meta`** **`database.pool`** **、** **`GET /metrics`** |
| [`crates/api/src/db/users_sessions.rs`](../../crates/api/src/db/users_sessions.rs) | **`get_user_id_by_token`** **路径** **上** **等待** **时长** **与** **`PoolTimedOut`** **观测** |

---

## §3 · 告警阈值（建议）

| 信号 | 建议 |
|------|------|
| **`traveltrust_pg_pool_utilization_ratio`** | **>** **`DATABASE_POOL_ALERT_UTILIZATION`** **（** **默认** **0.90** **）** **持续** **>1m** **→** **容量** **或** **泄漏** **排查** |
| **`traveltrust_pg_pool_acquire_timeout_total`** **速率** | **>** **0** **（** **rate 5m** **）** **→** **查** **连接** **泄漏** **、** **慢** **SQL** **、** **池** **过小** |
| **`traveltrust_pg_pool_slow_acquire_total`** | **与** **应用** **延迟** **关联** **；** **结合** **PG** **`pg_stat_statements`** **（** **库** **侧** **）** |

---

## §4 · 机读门禁（合入前）

```bash
python scripts/gates/check-b476-meta-database-pool-contract.py
python scripts/gates/check-b476-metrics-pg-pool-lines.py
python scripts/gates/check-b476-seal-and-pool-obs-doc.py
cargo test -p traveltrust-api b476_ database_pool_meta_top_keys_order_and_literals_776 metrics_includes_indexer_gauges -- --nocapture
```

**说明** **：** **全栈** **/** **高并发** **下** **「** **无** **池** **枯竭** **」** **须** **在** **目标** **环境** **跑** **`bash scripts/ops/b473-seal-b460-tt-u03.sh`** **（** **须** **`DATABASE_URL`** **）** **期间** **抓取** **`GET /metrics`** **与** **`GET /meta.database.pool`** **；** **机读** **门禁** **保证** **代码** **与** **契约** **不** **漂移** **。** **脚本** **：** **[`b473-seal-b460-tt-u03.sh`](../../scripts/ops/b473-seal-b460-tt-u03.sh)** **。** **可** **重复** **压力** **/** **恢复** **验收** **见** **母表** **[B-477](../任务母表.md)** **/** **[`TT-B477`](TT-B477-PG-POOL-STRESS-RECOVERY-ACCEPTANCE-001.md)** **。**

---

## §5 · 环境变量（补充 B-474）

| 变量 | 含义 |
|------|------|
| **`DATABASE_POOL_SLOW_ACQUIRE_LOG_MS`** | **单次** **查询** **前** **等待** **≥** **该** **毫秒** **→** **累计** **`slow_acquire_total`** **并** **`eprintln`** **（** **默认** **500** **）** |
| **`DATABASE_POOL_ALERT_UTILIZATION`** | **`meta`/`metrics`** **暴露** **建议** **告警** **阈值** **（** **0～1** **，** **默认** **0.90** **）** |
| **`DATABASE_STATEMENT_TIMEOUT_MS`** | **可选** **：** **每个** **连接** **`SET statement_timeout`** **（** **毫秒** **）** **；** **见** **pool_config** **`after_connect`** **（** **若** **已** **启用** **）** |

---

**文档版本**：1.0 · 2026-04-18
