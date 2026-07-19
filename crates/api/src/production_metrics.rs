//! Phase③ Step 8A — unified production Prometheus metrics (exported via GET /metrics).
//!
//! SSOT catalog: registry/monitoring-production-metrics-catalog.v1.yaml

use std::fmt::Write as _;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use crate::state::ApiMetaState;

macro_rules! counter {
    ($name:ident) => {
        static $name: AtomicU64 = AtomicU64::new(0);
    };
}

counter!(AUTH_LOGIN_SUCCESS_TOTAL);
counter!(AUTH_LOGIN_FAILURE_TOTAL);
counter!(AUTH_RATE_LIMIT_TOTAL);
counter!(AUTH_EMAIL_VERIFY_SUCCESS_TOTAL);
counter!(AUTH_EMAIL_VERIFY_FAILED_TOTAL);
counter!(PASSWORD_RESET_REQUESTED_TOTAL);
counter!(PASSWORD_RESET_SUCCESS_TOTAL);

counter!(EMAIL_SENT_TOTAL);
counter!(EMAIL_FAILED_TOTAL);
counter!(EMAIL_RETRY_TOTAL);
counter!(EMAIL_LATENCY_SUM_MICROS);
counter!(EMAIL_LATENCY_COUNT);

counter!(EMAIL_FAILED_PROVIDER_OFF);
counter!(EMAIL_FAILED_PROVIDER_LOG);
counter!(EMAIL_FAILED_PROVIDER_RESEND);
counter!(EMAIL_FAILED_REASON_TRANSPORT_OFF);
counter!(EMAIL_FAILED_REASON_HTTP);
counter!(EMAIL_FAILED_REASON_PROVIDER);

counter!(ESCROW_RELEASE_TOTAL);
counter!(ESCROW_REFUND_TOTAL);
counter!(ESCROW_FAILED_TOTAL);

counter!(RPC_ERROR_TOTAL);
counter!(TRANSACTION_PENDING_SUM_MICROS);
counter!(TRANSACTION_PENDING_COUNT);

counter!(DATABASE_CONNECTION_ERRORS_TOTAL);
counter!(REDIS_ERRORS_TOTAL);

counter!(HTTP_ERROR_4XX_TOTAL);
counter!(HTTP_ERROR_5XX_TOTAL);

/// Staging drill override for `contract_event_lag_seconds` (TRAVELTRUST_MONITORING_DRILL=1 only).
static DRILL_LAG_SECONDS: AtomicU64 = AtomicU64::new(0);
counter!(API_REQUEST_DURATION_SUM_MICROS);
counter!(API_REQUEST_DURATION_COUNT);

fn inc(c: &AtomicU64) {
    c.fetch_add(1, Ordering::Relaxed);
}

fn load(c: &AtomicU64) -> u64 {
    c.load(Ordering::Relaxed)
}

pub fn inc_auth_login_success() {
    inc(&AUTH_LOGIN_SUCCESS_TOTAL);
}

pub fn inc_auth_login_failure() {
    inc(&AUTH_LOGIN_FAILURE_TOTAL);
}

pub fn inc_auth_rate_limit() {
    inc(&AUTH_RATE_LIMIT_TOTAL);
}

pub fn inc_auth_email_verify_success() {
    inc(&AUTH_EMAIL_VERIFY_SUCCESS_TOTAL);
}

pub fn inc_auth_email_verify_failed() {
    inc(&AUTH_EMAIL_VERIFY_FAILED_TOTAL);
}

pub fn inc_password_reset_requested() {
    inc(&PASSWORD_RESET_REQUESTED_TOTAL);
}

pub fn inc_password_reset_success() {
    inc(&PASSWORD_RESET_SUCCESS_TOTAL);
}

pub fn record_email_sent(provider: &str, latency: std::time::Duration) {
    inc(&EMAIL_SENT_TOTAL);
    record_email_latency(latency);
    let _ = provider;
}

pub fn record_email_failed(provider: &str, reason: &str) {
    inc(&EMAIL_FAILED_TOTAL);
    match provider {
        "off" => inc(&EMAIL_FAILED_PROVIDER_OFF),
        "log" => inc(&EMAIL_FAILED_PROVIDER_LOG),
        "resend" => inc(&EMAIL_FAILED_PROVIDER_RESEND),
        _ => {}
    }
    match reason {
        "transport_off" => inc(&EMAIL_FAILED_REASON_TRANSPORT_OFF),
        "http_error" | "resend_http_non_success" => inc(&EMAIL_FAILED_REASON_HTTP),
        _ => inc(&EMAIL_FAILED_REASON_PROVIDER),
    }
}

pub fn inc_email_retry() {
    inc(&EMAIL_RETRY_TOTAL);
}

fn record_email_latency(latency: std::time::Duration) {
    EMAIL_LATENCY_SUM_MICROS.fetch_add(latency.as_micros() as u64, Ordering::Relaxed);
    inc(&EMAIL_LATENCY_COUNT);
}

pub struct EmailLatencyTimer {
    started: Instant,
}

impl EmailLatencyTimer {
    pub fn start() -> Self {
        Self {
            started: Instant::now(),
        }
    }

    pub fn elapsed(&self) -> std::time::Duration {
        self.started.elapsed()
    }
}

pub fn inc_escrow_release() {
    inc(&ESCROW_RELEASE_TOTAL);
}

pub fn inc_escrow_refund() {
    inc(&ESCROW_REFUND_TOTAL);
}

pub fn inc_escrow_failed() {
    inc(&ESCROW_FAILED_TOTAL);
}

pub fn inc_rpc_error() {
    inc(&RPC_ERROR_TOTAL);
}

pub fn record_transaction_pending(duration: std::time::Duration) {
    TRANSACTION_PENDING_SUM_MICROS.fetch_add(duration.as_micros() as u64, Ordering::Relaxed);
    inc(&TRANSACTION_PENDING_COUNT);
}

pub fn inc_database_connection_error() {
    inc(&DATABASE_CONNECTION_ERRORS_TOTAL);
}

pub fn inc_redis_error() {
    inc(&REDIS_ERRORS_TOTAL);
}

pub fn record_http_response(status: u16, duration: std::time::Duration) {
    API_REQUEST_DURATION_SUM_MICROS.fetch_add(duration.as_micros() as u64, Ordering::Relaxed);
    inc(&API_REQUEST_DURATION_COUNT);
    if (400..500).contains(&status) {
        inc(&HTTP_ERROR_4XX_TOTAL);
    } else if status >= 500 {
        inc(&HTTP_ERROR_5XX_TOTAL);
    }
}

/// Snapshot for tests and email_service backward compat.
pub fn email_metrics_snapshot() -> (u64, u64) {
    (load(&EMAIL_SENT_TOTAL), load(&EMAIL_FAILED_TOTAL))
}

pub fn set_drill_contract_event_lag_seconds(seconds: u64) {
    DRILL_LAG_SECONDS.store(seconds, Ordering::Relaxed);
}

pub fn clear_drill_contract_event_lag() {
    DRILL_LAG_SECONDS.store(0, Ordering::Relaxed);
}

pub fn append_production_metrics(body: &mut String, state: &ApiMetaState) {
    let contract_event_lag_seconds = {
        let drill = DRILL_LAG_SECONDS.load(Ordering::Relaxed);
        if drill > 0 {
            drill
        } else {
            state.indexer_lag_blocks.saturating_mul(12)
        }
    };

    let email_latency_avg = {
        let count = load(&EMAIL_LATENCY_COUNT);
        if count == 0 {
            0.0
        } else {
            load(&EMAIL_LATENCY_SUM_MICROS) as f64 / count as f64 / 1_000_000.0
        }
    };

    let api_duration_avg = {
        let count = load(&API_REQUEST_DURATION_COUNT);
        if count == 0 {
            0.0
        } else {
            load(&API_REQUEST_DURATION_SUM_MICROS) as f64 / count as f64 / 1_000_000.0
        }
    };

    let txn_pending_avg = {
        let count = load(&TRANSACTION_PENDING_COUNT);
        if count == 0 {
            0.0
        } else {
            load(&TRANSACTION_PENDING_SUM_MICROS) as f64 / count as f64 / 1_000_000.0
        }
    };

    let db_errors = load(&DATABASE_CONNECTION_ERRORS_TOTAL)
        .max(crate::db::pg_transient_retry_exhausted_total());

    let _ = writeln!(
        body,
        "# HELP auth_login_success_total Successful auth logins\n\
         # TYPE auth_login_success_total counter\nauth_login_success_total {}",
        load(&AUTH_LOGIN_SUCCESS_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP auth_login_failure_total Failed auth logins (invalid credentials)\n\
         # TYPE auth_login_failure_total counter\nauth_login_failure_total {}",
        load(&AUTH_LOGIN_FAILURE_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP auth_rate_limit_total Auth endpoints rate-limited\n\
         # TYPE auth_rate_limit_total counter\nauth_rate_limit_total {}",
        load(&AUTH_RATE_LIMIT_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP auth_email_verify_success_total Email verification successes\n\
         # TYPE auth_email_verify_success_total counter\nauth_email_verify_success_total {}",
        load(&AUTH_EMAIL_VERIFY_SUCCESS_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP auth_email_verify_failed_total Email verification failures\n\
         # TYPE auth_email_verify_failed_total counter\nauth_email_verify_failed_total {}",
        load(&AUTH_EMAIL_VERIFY_FAILED_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP password_reset_requested_total Password reset requests accepted\n\
         # TYPE password_reset_requested_total counter\npassword_reset_requested_total {}",
        load(&PASSWORD_RESET_REQUESTED_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP password_reset_success_total Password resets completed\n\
         # TYPE password_reset_success_total counter\npassword_reset_success_total {}",
        load(&PASSWORD_RESET_SUCCESS_TOTAL)
    );

    let _ = writeln!(
        body,
        "# HELP email_sent_total Outbound emails sent\n\
         # TYPE email_sent_total counter\nemail_sent_total {}",
        load(&EMAIL_SENT_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP email_failed_total Outbound emails failed\n\
         # TYPE email_failed_total counter\nemail_failed_total {}",
        load(&EMAIL_FAILED_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP email_retry_total Outbound email delivery retries\n\
         # TYPE email_retry_total counter\nemail_retry_total {}",
        load(&EMAIL_RETRY_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP email_provider_latency_seconds_avg Average email provider latency (seconds)\n\
         # TYPE email_provider_latency_seconds_avg gauge\nemail_provider_latency_seconds_avg {:.6}",
        email_latency_avg
    );
    let _ = writeln!(
        body,
        "# HELP email_failed_by_provider_total Email failures by provider\n\
         # TYPE email_failed_by_provider_total counter\n\
         email_failed_by_provider_total{{provider=\"off\"}} {}\n\
         email_failed_by_provider_total{{provider=\"log\"}} {}\n\
         email_failed_by_provider_total{{provider=\"resend\"}} {}",
        load(&EMAIL_FAILED_PROVIDER_OFF),
        load(&EMAIL_FAILED_PROVIDER_LOG),
        load(&EMAIL_FAILED_PROVIDER_RESEND)
    );
    let _ = writeln!(
        body,
        "# HELP email_failed_by_reason_total Email failures by reason\n\
         # TYPE email_failed_by_reason_total counter\n\
         email_failed_by_reason_total{{reason=\"transport_off\"}} {}\n\
         email_failed_by_reason_total{{reason=\"http_error\"}} {}\n\
         email_failed_by_reason_total{{reason=\"provider_error\"}} {}",
        load(&EMAIL_FAILED_REASON_TRANSPORT_OFF),
        load(&EMAIL_FAILED_REASON_HTTP),
        load(&EMAIL_FAILED_REASON_PROVIDER)
    );

    let _ = writeln!(
        body,
        "# HELP escrow_release_total Escrow release events projected\n\
         # TYPE escrow_release_total counter\nescrow_release_total {}",
        load(&ESCROW_RELEASE_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP escrow_refund_total Escrow refund events projected\n\
         # TYPE escrow_refund_total counter\nescrow_refund_total {}",
        load(&ESCROW_REFUND_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP escrow_failed_total Escrow projection failures\n\
         # TYPE escrow_failed_total counter\nescrow_failed_total {}",
        load(&ESCROW_FAILED_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP contract_event_lag_seconds Estimated chain event lag (blocks * 12s)\n\
         # TYPE contract_event_lag_seconds gauge\ncontract_event_lag_seconds {}",
        contract_event_lag_seconds
    );
    let _ = writeln!(
        body,
        "# HELP rpc_error_total RPC call failures\n\
         # TYPE rpc_error_total counter\nrpc_error_total {}",
        load(&RPC_ERROR_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP transaction_pending_seconds_avg Average transaction pending duration (seconds)\n\
         # TYPE transaction_pending_seconds_avg gauge\ntransaction_pending_seconds_avg {:.6}",
        txn_pending_avg
    );

    let _ = writeln!(
        body,
        "# HELP database_connection_errors_total Database connection errors\n\
         # TYPE database_connection_errors_total counter\ndatabase_connection_errors_total {}",
        db_errors
    );
    let _ = writeln!(
        body,
        "# HELP redis_errors_total Redis errors (0 when Redis not configured)\n\
         # TYPE redis_errors_total counter\nredis_errors_total {}",
        load(&REDIS_ERRORS_TOTAL)
    );
    let _ = writeln!(
        body,
        "# HELP api_request_duration_seconds_avg Average API request duration (seconds)\n\
         # TYPE api_request_duration_seconds_avg gauge\napi_request_duration_seconds_avg {:.6}",
        api_duration_avg
    );
    let _ = writeln!(
        body,
        "# HELP http_error_total HTTP errors by class\n\
         # TYPE http_error_total counter\n\
         http_error_total{{status_class=\"4xx\"}} {}\n\
         http_error_total{{status_class=\"5xx\"}} {}",
        load(&HTTP_ERROR_4XX_TOTAL),
        load(&HTTP_ERROR_5XX_TOTAL)
    );
}