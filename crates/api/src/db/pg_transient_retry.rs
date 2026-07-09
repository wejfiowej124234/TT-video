//! Transient PostgreSQL error retry (staging EOF / stale pool connections).
//! See docs/runbook/TT-STAGING-API-DB-TRANSIENT-503.md

use std::future::Future;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

static PG_TRANSIENT_RETRY_TOTAL: AtomicU64 = AtomicU64::new(0);
static PG_TRANSIENT_RETRY_EXHAUSTED: AtomicU64 = AtomicU64::new(0);

pub fn pg_transient_retry_total() -> u64 {
    PG_TRANSIENT_RETRY_TOTAL.load(Ordering::Relaxed)
}

pub fn pg_transient_retry_exhausted_total() -> u64 {
    PG_TRANSIENT_RETRY_EXHAUSTED.load(Ordering::Relaxed)
}

fn effective_max_attempts() -> u32 {
    std::env::var("DATABASE_PG_TRANSIENT_RETRY_MAX")
        .ok()
        .and_then(|s| s.trim().parse().ok())
        .map(|v: u32| v.clamp(1, 8))
        .unwrap_or(3)
}

/// Returns true for stale TCP / pool edge cases that often succeed on immediate retry.
pub fn is_transient_pg_error(err: &sqlx::Error) -> bool {
    match err {
        sqlx::Error::PoolTimedOut | sqlx::Error::PoolClosed => return true,
        sqlx::Error::Io(_) => return true,
        sqlx::Error::Database(db) => {
            if let Some(code) = db.code() {
                if matches!(
                    code.as_ref(),
                    "08000" | "08003" | "08006" | "08001" | "57P01" | "57P02" | "57P03"
                ) {
                    return true;
                }
            }
        }
        _ => {}
    }
    let msg = err.to_string().to_ascii_lowercase();
    msg.contains("eof")
        || msg.contains("connection closed")
        || msg.contains("connection reset")
        || msg.contains("broken pipe")
        || msg.contains("error communicating with database")
}

pub async fn with_pg_transient_retry<T, F, Fut>(mut op: F) -> Result<T, sqlx::Error>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, sqlx::Error>>,
{
    let max = effective_max_attempts();
    for attempt in 1..=max {
        match op().await {
            Ok(v) => return Ok(v),
            Err(e) if attempt < max && is_transient_pg_error(&e) => {
                PG_TRANSIENT_RETRY_TOTAL.fetch_add(1, Ordering::Relaxed);
                eprintln!(
                    "WARN: pg_transient_retry attempt={attempt}/{max}: {e}"
                );
                tokio::time::sleep(Duration::from_millis(40 * u64::from(attempt))).await;
            }
            Err(e) => {
                if is_transient_pg_error(&e) {
                    PG_TRANSIENT_RETRY_EXHAUSTED.fetch_add(1, Ordering::Relaxed);
                }
                return Err(e);
            }
        }
    }
    unreachable!("with_pg_transient_retry loop")
}

pub async fn ping_pool(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT 1").execute(pool).await.map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_eof_message_as_transient() {
        let err = sqlx::Error::Io(std::io::Error::new(
            std::io::ErrorKind::UnexpectedEof,
            "expected to read 5 bytes, got 0 bytes at EOF",
        ));
        assert!(is_transient_pg_error(&err));
    }
}
