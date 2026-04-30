//! PostgreSQL pool for `#[cfg(test)]` integration tests when `DATABASE_URL` is set.
//! Runs the same embedded migrations as production startup once per test process (cheap no-op afterward).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tokio::sync::Mutex;

static API_MIGRATIONS_APPLIED: AtomicBool = AtomicBool::new(false);

fn api_migrations_lock() -> &'static Mutex<()> {
    static L: OnceLock<Mutex<()>> = OnceLock::new();
    L.get_or_init(|| Mutex::new(()))
}

/// Connect `DATABASE_URL` (if set) and ensure API SQLx migrations are applied.
pub async fn connect_migrated_pg_it_pool() -> Option<PgPool> {
    let url = std::env::var("DATABASE_URL").ok()?.trim().to_string();
    if url.is_empty() {
        return None;
    }
    let pool = PgPoolOptions::new()
        .max_connections(4)
        .connect(&url)
        .await
        .expect("DATABASE_URL connect");

    if !API_MIGRATIONS_APPLIED.load(Ordering::Acquire) {
        let _g = api_migrations_lock().lock().await;
        if !API_MIGRATIONS_APPLIED.load(Ordering::Acquire) {
            crate::db::apply_api_migrations(&pool)
                .await
                .expect("apply_api_migrations");
            API_MIGRATIONS_APPLIED.store(true, Ordering::Release);
        }
    }
    Some(pool)
}
