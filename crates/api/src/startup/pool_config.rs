//! B-474：`DATABASE_URL` 连接池参数（`sqlx::PgPoolOptions`）环境可调，避免硬编码 `max_connections(10)` 与无界 acquire。
//! 见 `docs/runbook/TT-B474-PG-SINGLE-DB-POOL-GOVERNANCE-001.md`。

use std::time::Duration;

use sqlx::postgres::PgPoolOptions;

/// 与 **`build_pg_pool_options`** **`max_connections`** **同源**（**B-474** **/** **B-476** **`/metrics`**）。
pub(crate) fn effective_max_connections() -> u32 {
    read_env_u32("DATABASE_POOL_MAX_CONNECTIONS", 10, 1, 256)
}

fn read_env_u32(name: &str, default: u32, min: u32, max: u32) -> u32 {
    std::env::var(name)
        .ok()
        .and_then(|s| s.trim().parse().ok())
        .map(|v: u32| v.clamp(min, max))
        .unwrap_or(default)
}

fn read_env_u64(name: &str, default: u64, min: u64, max: u64) -> u64 {
    std::env::var(name)
        .ok()
        .and_then(|s| s.trim().parse().ok())
        .map(|v: u64| v.clamp(min, max))
        .unwrap_or(default)
}

/// 自环境变量构造 `PgPoolOptions`（无 `connect`）。未设变量时使用与历史行为兼容的默认值。
pub(crate) fn build_pg_pool_options() -> PgPoolOptions {
    let max = effective_max_connections();
    let acquire_secs = read_env_u64("DATABASE_POOL_ACQUIRE_TIMEOUT_SECS", 30, 1, 3600);
    let idle_secs = read_env_u64("DATABASE_POOL_IDLE_TIMEOUT_SECS", 600, 10, 86_400);
    let life_secs = read_env_u64("DATABASE_POOL_MAX_LIFETIME_SECS", 1800, 60, 604_800);

    PgPoolOptions::new()
        .max_connections(max)
        .acquire_timeout(Duration::from_secs(acquire_secs))
        .idle_timeout(Some(Duration::from_secs(idle_secs)))
        .max_lifetime(Some(Duration::from_secs(life_secs)))
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                if let Ok(raw) = std::env::var("DATABASE_STATEMENT_TIMEOUT_MS") {
                    if let Ok(n) = raw.trim().parse::<i64>() {
                        if n > 0 {
                            let q = format!("SET statement_timeout = {}", n);
                            sqlx::query(&q).execute(&mut *conn).await?;
                        }
                    }
                }
                Ok(())
            })
        })
}

pub(crate) fn log_pg_pool_options_summary() {
    let max = read_env_u32("DATABASE_POOL_MAX_CONNECTIONS", 10, 1, 256);
    let acquire_secs = read_env_u64("DATABASE_POOL_ACQUIRE_TIMEOUT_SECS", 30, 1, 3600);
    let idle_secs = read_env_u64("DATABASE_POOL_IDLE_TIMEOUT_SECS", 600, 10, 86_400);
    let life_secs = read_env_u64("DATABASE_POOL_MAX_LIFETIME_SECS", 1800, 60, 604_800);
    println!(
        "database_pool: max_connections={} acquire_timeout_secs={} idle_timeout_secs={} max_lifetime_secs={}",
        max, acquire_secs, idle_secs, life_secs
    );
}

#[cfg(test)]
mod tests {
    use super::{read_env_u32, read_env_u64};

    #[test]
    fn b474_pool_max_connections_clamped_and_default() {
        let key = "DATABASE_POOL_MAX_CONNECTIONS";
        let old = std::env::var(key).ok();
        std::env::set_var(key, "999");
        assert_eq!(read_env_u32(key, 10, 1, 256), 256);
        std::env::set_var(key, "0");
        assert_eq!(read_env_u32(key, 10, 1, 256), 1);
        std::env::set_var(key, "32");
        assert_eq!(read_env_u32(key, 10, 1, 256), 32);
        match old {
            Some(v) => std::env::set_var(key, v),
            None => std::env::remove_var(key),
        }
        assert_eq!(read_env_u32(key, 10, 1, 256), 10);
    }

    #[test]
    fn b474_pool_acquire_timeout_bounds() {
        let key = "DATABASE_POOL_ACQUIRE_TIMEOUT_SECS";
        let old = std::env::var(key).ok();
        std::env::set_var(key, "5000");
        assert_eq!(read_env_u64(key, 30, 1, 3600), 3600);
        std::env::set_var(key, "5");
        assert_eq!(read_env_u64(key, 30, 1, 3600), 5);
        match old {
            Some(v) => std::env::set_var(key, v),
            None => std::env::remove_var(key),
        }
    }
}
