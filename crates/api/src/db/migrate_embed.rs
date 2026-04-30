//! Embedded SQLx migrations for the API crate (`crates/api/migrations`).
//! Same filesystem path and semantics as `startup::run` when `DATABASE_URL` is set.

use std::path::PathBuf;

use sqlx::PgPool;

/// Apply all pending migrations — idempotent; safe to call on an already-migrated database.
pub async fn apply_api_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    let migrations_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("migrations");
    let migrator = sqlx::migrate::Migrator::new(migrations_path).await?;
    migrator.run(pool).await
}
