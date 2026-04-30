//! Process-local observability for `AUTH_HOT_TABLES_RETENTION_*` (startup sweep + periodic worker).
//! Exposed via `GET /meta` under `rate_limits.auth_hot_tables_retention` (see `middleware::meta_rate_limits_snapshot`).

use std::sync::{Mutex, OnceLock};

use chrono::Utc;
use serde_json::json;

#[derive(Debug, Clone, Default)]
struct AuthHotTablesRetentionObs {
    enabled: bool,
    retain_days: i64,
    interval_secs: u64,
    runs: u64,
    failures: u64,
    deleted_auth_email_tokens_run: u64,
    deleted_wallet_verify_challenges_run: u64,
    deleted_sessions_run: u64,
    deleted_auth_email_tokens_total: u64,
    deleted_wallet_verify_challenges_total: u64,
    deleted_sessions_total: u64,
    last_run_started_at: Option<String>,
    last_run_finished_at: Option<String>,
    last_run_elapsed_ms: Option<i64>,
    last_error: Option<String>,
}

static AUTH_HOT_TABLES_RETENTION_OBS: OnceLock<Mutex<AuthHotTablesRetentionObs>> = OnceLock::new();

fn obs_lock() -> &'static Mutex<AuthHotTablesRetentionObs> {
    AUTH_HOT_TABLES_RETENTION_OBS.get_or_init(|| Mutex::new(AuthHotTablesRetentionObs::default()))
}

pub fn snapshot_auth_hot_tables_retention_obs_json() -> serde_json::Value {
    let guard = obs_lock().lock().unwrap_or_else(|e| e.into_inner());
    json!({
        "enabled": guard.enabled,
        "retain_days": guard.retain_days,
        "interval_secs": guard.interval_secs,
        "runs": guard.runs,
        "failures": guard.failures,
        "deleted_run": {
            "auth_email_tokens": guard.deleted_auth_email_tokens_run,
            "wallet_verify_challenges": guard.deleted_wallet_verify_challenges_run,
            "sessions": guard.deleted_sessions_run,
        },
        "deleted_total": {
            "auth_email_tokens": guard.deleted_auth_email_tokens_total,
            "wallet_verify_challenges": guard.deleted_wallet_verify_challenges_total,
            "sessions": guard.deleted_sessions_total,
        },
        "last_run_started_at": guard.last_run_started_at,
        "last_run_finished_at": guard.last_run_finished_at,
        "last_run_elapsed_ms": guard.last_run_elapsed_ms,
        "last_error": guard.last_error,
    })
}

pub fn init_auth_hot_tables_retention_worker_meta(
    enabled: bool,
    retain_days: i64,
    interval_secs: u64,
) {
    if let Ok(mut g) = obs_lock().try_lock() {
        g.enabled = enabled;
        g.retain_days = retain_days;
        g.interval_secs = interval_secs;
    }
}

pub async fn run_auth_hot_table_retention_cycle(
    pool: &sqlx::PgPool,
    retention_days: i64,
    increment_runs: bool,
) {
    let started_at = Utc::now();
    let mut deleted_auth_email_tokens_run: u64 = 0;
    let mut deleted_wallet_verify_challenges_run: u64 = 0;
    let mut deleted_sessions_run: u64 = 0;
    let mut errs: Vec<String> = Vec::new();

    match crate::db::delete_stale_auth_email_tokens(pool, retention_days).await {
        Ok(n) => {
            deleted_auth_email_tokens_run = n;
            println!(
                "auth_hot_tables_retention: auth_email_tokens retain_days={} deleted_rows={}",
                retention_days, n
            );
        }
        Err(e) => {
            errs.push(format!("auth_email_tokens: {e}"));
            eprintln!(
                "auth_hot_tables_retention: delete_stale_auth_email_tokens failed retain_days={} err={}",
                retention_days, e
            );
        }
    }
    match crate::db::delete_stale_wallet_verify_challenges(pool, retention_days).await {
        Ok(n) => {
            deleted_wallet_verify_challenges_run = n;
            println!(
                "auth_hot_tables_retention: wallet_verify_challenges retain_days={} deleted_rows={}",
                retention_days, n
            );
        }
        Err(e) => {
            errs.push(format!("wallet_verify_challenges: {e}"));
            eprintln!(
                "auth_hot_tables_retention: delete_stale_wallet_verify_challenges failed retain_days={} err={}",
                retention_days, e
            );
        }
    }
    match crate::db::delete_stale_sessions(pool, retention_days).await {
        Ok(n) => {
            deleted_sessions_run = n;
            println!(
                "auth_hot_tables_retention: sessions retain_days={} deleted_rows={}",
                retention_days, n
            );
        }
        Err(e) => {
            errs.push(format!("sessions: {e}"));
            eprintln!(
                "auth_hot_tables_retention: delete_stale_sessions failed retain_days={} err={}",
                retention_days, e
            );
        }
    }

    let finished_at = Utc::now();
    let elapsed_ms = (finished_at - started_at).num_milliseconds().max(0);
    let cycle_failed = !errs.is_empty();
    let last_error = if errs.is_empty() {
        None
    } else {
        Some(errs.join(" | "))
    };

    if let Ok(mut g) = obs_lock().try_lock() {
        g.deleted_auth_email_tokens_run = deleted_auth_email_tokens_run;
        g.deleted_wallet_verify_challenges_run = deleted_wallet_verify_challenges_run;
        g.deleted_sessions_run = deleted_sessions_run;
        g.deleted_auth_email_tokens_total += deleted_auth_email_tokens_run;
        g.deleted_wallet_verify_challenges_total += deleted_wallet_verify_challenges_run;
        g.deleted_sessions_total += deleted_sessions_run;
        g.last_run_started_at = Some(started_at.to_rfc3339());
        g.last_run_finished_at = Some(finished_at.to_rfc3339());
        g.last_run_elapsed_ms = Some(elapsed_ms);
        g.last_error = last_error;
        if increment_runs {
            g.runs += 1;
            if cycle_failed {
                g.failures += 1;
            }
        }
    }
}
