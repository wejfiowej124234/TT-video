//! B-476：PostgreSQL 连接池运行时观测（计数器 + `/metrics` / `GET /meta.database.pool`）。
//! 退避：见 Runbook（客户端重试、限流协同）；服务端以 `statement_timeout` 与池参数为主。

use sqlx::postgres::PgPool;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use crate::startup::pool_config;

static ACQUIRE_TIMEOUT_TOTAL: AtomicU64 = AtomicU64::new(0);
static SLOW_ACQUIRE_TOTAL: AtomicU64 = AtomicU64::new(0);

/// 慢 acquire 日志阈值（毫秒）；与 **wait**（自 `query*.await` 起算）同源近似。
fn slow_acquire_warn_ms() -> u64 {
    std::env::var("DATABASE_POOL_SLOW_ACQUIRE_LOG_MS")
        .ok()
        .and_then(|s| s.trim().parse().ok())
        .filter(|&n| n >= 50 && n <= 60_000)
        .unwrap_or(500)
}

/// 建议告警：池利用率（in_use/max）超过该值时 Prometheus/日志规则应关注（默认 0.90）。
fn alert_utilization_ratio() -> f64 {
    std::env::var("DATABASE_POOL_ALERT_UTILIZATION")
        .ok()
        .and_then(|s| s.trim().parse().ok())
        .filter(|r: &f64| *r > 0.0 && *r <= 1.0)
        .unwrap_or(0.90)
}

pub(crate) fn acquire_timeout_total() -> u64 {
    ACQUIRE_TIMEOUT_TOTAL.load(Ordering::Relaxed)
}

pub(crate) fn slow_acquire_total() -> u64 {
    SLOW_ACQUIRE_TOTAL.load(Ordering::Relaxed)
}

pub(crate) fn on_sqlx_error(e: &sqlx::Error) {
    if matches!(e, sqlx::Error::PoolTimedOut) {
        ACQUIRE_TIMEOUT_TOTAL.fetch_add(1, Ordering::Relaxed);
    }
}

pub(crate) fn record_acquire_wait(d: Duration) {
    let ms = d.as_millis() as u64;
    let thr = slow_acquire_warn_ms();
    if ms >= thr {
        SLOW_ACQUIRE_TOTAL.fetch_add(1, Ordering::Relaxed);
        eprintln!(
            "[db_pool] slow acquire wait {}ms (threshold {}ms) — check utilization / PG load",
            ms, thr
        );
    }
}

pub(crate) fn result_touch_sqlx<T>(r: Result<T, sqlx::Error>) -> Result<T, sqlx::Error> {
    if let Err(ref e) = r {
        on_sqlx_error(e);
    }
    r
}

/// 供 `GET /metrics` / `GET /meta`：池瞬时快照 + 累计计数。
pub(crate) fn pool_observability_snapshot(pool: &PgPool) -> serde_json::Value {
    let max_c = pool_config::effective_max_connections();
    let size = pool.size();
    let idle_n = pool.num_idle().min(size as usize);
    let in_use = size.saturating_sub(idle_n as u32);
    let idle = idle_n as u64;
    let util = if max_c > 0 {
        (in_use as f64 / max_c as f64).min(1.0)
    } else {
        0.0
    };
    let alert = alert_utilization_ratio();
    serde_json::json!({
        "max_connections": max_c,
        "connections": size,
        "idle": idle,
        "in_use": in_use as u64,
        "utilization": util,
        "acquire_timeout_total": acquire_timeout_total(),
        "slow_acquire_total": slow_acquire_total(),
        "slow_acquire_warn_ms": slow_acquire_warn_ms(),
        "alert_utilization_ratio": alert,
        "rule": "776：B-476 池观测；utilization=in_use/max；acquire_timeout_total 累加 sqlx PoolTimedOut；slow_acquire_total 为单次查询前等待 ≥ slow_acquire_warn_ms 的近似计数；全栈/b473-seal 下须 scrape /meta.database.pool 与 /metrics 同源核对",
    })
}

pub(crate) fn append_prometheus_lines(pool_opt: Option<&PgPool>, out: &mut String) {
    use std::fmt::Write as _;
    let to = acquire_timeout_total();
    let sl = slow_acquire_total();
    let _ = writeln!(
        out,
        "# HELP traveltrust_pg_pool_acquire_timeout_total Cumulative sqlx pool acquire timeouts (PoolTimedOut).\n\
         # TYPE traveltrust_pg_pool_acquire_timeout_total counter\ntraveltrust_pg_pool_acquire_timeout_total {}",
        to
    );
    let _ = writeln!(
        out,
        "# HELP traveltrust_pg_pool_slow_acquire_total Cumulative slow query waits (≥ DATABASE_POOL_SLOW_ACQUIRE_LOG_MS).\n\
         # TYPE traveltrust_pg_pool_slow_acquire_total counter\ntraveltrust_pg_pool_slow_acquire_total {}",
        sl
    );
    let max_c = pool_config::effective_max_connections();
    let _ = writeln!(
        out,
        "# HELP traveltrust_pg_pool_max_connections Effective DATABASE_POOL_MAX_CONNECTIONS (B-474).\n\
         # TYPE traveltrust_pg_pool_max_connections gauge\ntraveltrust_pg_pool_max_connections {}",
        max_c
    );
    let _ = writeln!(
        out,
        "# HELP traveltrust_pg_pool_alert_utilization_ratio Suggested alert threshold for utilization (DATABASE_POOL_ALERT_UTILIZATION).\n\
         # TYPE traveltrust_pg_pool_alert_utilization_ratio gauge\ntraveltrust_pg_pool_alert_utilization_ratio {}",
        alert_utilization_ratio()
    );
    if let Some(pool) = pool_opt {
        let size = pool.size();
        let idle = pool.num_idle();
        let in_use = (size as i64 - idle as i64).max(0);
        let util = if max_c > 0 {
            (in_use as f64 / max_c as f64).min(1.0)
        } else {
            0.0
        };
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_connections sqlx pool total connections.\n\
             # TYPE traveltrust_pg_pool_connections gauge\ntraveltrust_pg_pool_connections {}",
            size
        );
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_connections_idle sqlx pool idle connections.\n\
             # TYPE traveltrust_pg_pool_connections_idle gauge\ntraveltrust_pg_pool_connections_idle {}",
            idle
        );
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_connections_in_use sqlx pool in-use connections (size - idle).\n\
             # TYPE traveltrust_pg_pool_connections_in_use gauge\ntraveltrust_pg_pool_connections_in_use {}",
            in_use
        );
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_utilization_ratio in_use / max_connections (0..=1).\n\
             # TYPE traveltrust_pg_pool_utilization_ratio gauge\ntraveltrust_pg_pool_utilization_ratio {}",
            util
        );
    } else {
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_connections sqlx pool total connections.\n\
             # TYPE traveltrust_pg_pool_connections gauge\ntraveltrust_pg_pool_connections 0"
        );
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_connections_idle sqlx pool idle connections.\n\
             # TYPE traveltrust_pg_pool_connections_idle gauge\ntraveltrust_pg_pool_connections_idle 0"
        );
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_connections_in_use sqlx pool in-use connections.\n\
             # TYPE traveltrust_pg_pool_connections_in_use gauge\ntraveltrust_pg_pool_connections_in_use 0"
        );
        let _ = writeln!(
            out,
            "# HELP traveltrust_pg_pool_utilization_ratio in_use / max_connections (0..=1).\n\
             # TYPE traveltrust_pg_pool_utilization_ratio gauge\ntraveltrust_pg_pool_utilization_ratio 0"
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b476_on_sqlx_counts_pool_timed_out() {
        let e = sqlx::Error::PoolTimedOut;
        let before = acquire_timeout_total();
        on_sqlx_error(&e);
        assert_eq!(acquire_timeout_total(), before + 1);
    }
}
