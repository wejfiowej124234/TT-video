use serde_json::Value;
use sqlx::postgres::PgPool;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::OnceLock;
use std::time::Duration;
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Debug, Clone)]
struct AuthAuditEventOwned {
    event_type: String,
    user_id: Option<Uuid>,
    request_id: Option<String>,
    client_ip: Option<String>,
    user_agent: Option<String>,
    reason: Option<String>,
    payload: Value,
}

#[derive(Debug, Clone, Copy)]
pub struct AuthAuditAsyncMetricsSnapshot {
    pub enabled: bool,
    pub queue_depth: u64,
    pub enqueued_total: u64,
    pub retried_total: u64,
    pub failed_total: u64,
    pub fallback_direct_total: u64,
}

static AUTH_AUDIT_QUEUE_ENABLED: AtomicBool = AtomicBool::new(false);
static AUTH_AUDIT_QUEUE_TX: OnceLock<mpsc::Sender<AuthAuditEventOwned>> = OnceLock::new();
static AUTH_AUDIT_QUEUE_DEPTH: AtomicU64 = AtomicU64::new(0);
static AUTH_AUDIT_ENQUEUED_TOTAL: AtomicU64 = AtomicU64::new(0);
static AUTH_AUDIT_RETRIED_TOTAL: AtomicU64 = AtomicU64::new(0);
static AUTH_AUDIT_FAILED_TOTAL: AtomicU64 = AtomicU64::new(0);
static AUTH_AUDIT_FALLBACK_DIRECT_TOTAL: AtomicU64 = AtomicU64::new(0);

fn auth_audit_async_queue_enabled() -> bool {
    std::env::var("AUTH_AUDIT_ASYNC_QUEUE_ENABLED")
        .ok()
        .map(|v| {
            matches!(
                v.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "on" | "yes"
            )
        })
        .unwrap_or(true)
}

fn auth_audit_async_queue_size() -> usize {
    std::env::var("AUTH_AUDIT_ASYNC_QUEUE_SIZE")
        .ok()
        .and_then(|v| v.trim().parse::<usize>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(1024)
}

fn auth_audit_async_max_retries() -> u32 {
    std::env::var("AUTH_AUDIT_ASYNC_MAX_RETRIES")
        .ok()
        .and_then(|v| v.trim().parse::<u32>().ok())
        .unwrap_or(3)
}

fn auth_audit_async_retry_backoff_ms() -> u64 {
    std::env::var("AUTH_AUDIT_ASYNC_RETRY_BACKOFF_MS")
        .ok()
        .and_then(|v| v.trim().parse::<u64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(100)
}

async fn insert_auth_audit_event_owned(
    pool: &PgPool,
    ev: &AuthAuditEventOwned,
) -> Result<(), sqlx::Error> {
    crate::db::insert_auth_audit_event(
        pool,
        ev.event_type.as_str(),
        ev.user_id,
        ev.request_id.as_deref(),
        ev.client_ip.as_deref(),
        ev.user_agent.as_deref(),
        ev.reason.as_deref(),
        &ev.payload,
    )
    .await
}

pub fn init_auth_audit_async_worker(pool: PgPool) {
    if !auth_audit_async_queue_enabled() {
        AUTH_AUDIT_QUEUE_ENABLED.store(false, Ordering::Relaxed);
        println!("auth_audit_async_queue: disabled");
        return;
    }
    let queue_size = auth_audit_async_queue_size();
    let max_retries = auth_audit_async_max_retries();
    let retry_backoff_ms = auth_audit_async_retry_backoff_ms();
    let (tx, mut rx) = mpsc::channel::<AuthAuditEventOwned>(queue_size);
    if AUTH_AUDIT_QUEUE_TX.set(tx).is_err() {
        eprintln!("auth_audit_async_queue: already initialized, skip re-init");
        AUTH_AUDIT_QUEUE_ENABLED.store(true, Ordering::Relaxed);
        return;
    }
    AUTH_AUDIT_QUEUE_ENABLED.store(true, Ordering::Relaxed);
    println!(
        "auth_audit_async_queue: enabled size={} max_retries={} retry_backoff_ms={}",
        queue_size, max_retries, retry_backoff_ms
    );
    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let mut persisted = false;
            for attempt in 0..=max_retries {
                match insert_auth_audit_event_owned(&pool, &event).await {
                    Ok(()) => {
                        persisted = true;
                        break;
                    }
                    Err(e) => {
                        if attempt < max_retries {
                            AUTH_AUDIT_RETRIED_TOTAL.fetch_add(1, Ordering::Relaxed);
                            tokio::time::sleep(Duration::from_millis(retry_backoff_ms)).await;
                        } else {
                            AUTH_AUDIT_FAILED_TOTAL.fetch_add(1, Ordering::Relaxed);
                            eprintln!(
                                "[audit] async queue persist failed event_type={} retries={} err={}",
                                event.event_type, max_retries, e
                            );
                        }
                    }
                }
            }
            if !persisted {
                // failed_total already bumped on last failed attempt
            }
            AUTH_AUDIT_QUEUE_DEPTH.fetch_sub(1, Ordering::Relaxed);
        }
    });
}

pub async fn persist_auth_audit_event(
    pool: &PgPool,
    event_type: &str,
    user_id: Option<Uuid>,
    request_id: Option<&str>,
    client_ip: Option<&str>,
    user_agent: Option<&str>,
    reason: Option<&str>,
    payload: &Value,
) -> bool {
    #[cfg(test)]
    if std::env::var("TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL").as_deref() == Ok("1") {
        return false;
    }

    let event = AuthAuditEventOwned {
        event_type: event_type.to_string(),
        user_id,
        request_id: request_id.map(str::to_string),
        client_ip: client_ip.map(str::to_string),
        user_agent: user_agent.map(str::to_string),
        reason: reason.map(str::to_string),
        payload: payload.clone(),
    };

    if AUTH_AUDIT_QUEUE_ENABLED.load(Ordering::Relaxed) {
        if let Some(tx) = AUTH_AUDIT_QUEUE_TX.get() {
            match tx.try_send(event.clone()) {
                Ok(()) => {
                    AUTH_AUDIT_QUEUE_DEPTH.fetch_add(1, Ordering::Relaxed);
                    AUTH_AUDIT_ENQUEUED_TOTAL.fetch_add(1, Ordering::Relaxed);
                    return true;
                }
                Err(e) => {
                    AUTH_AUDIT_FALLBACK_DIRECT_TOTAL.fetch_add(1, Ordering::Relaxed);
                    eprintln!(
                        "[audit] async queue enqueue failed event_type={} err={}, fallback=direct_insert",
                        event_type, e
                    );
                }
            }
        }
    }

    match insert_auth_audit_event_owned(pool, &event).await {
        Ok(()) => true,
        Err(e) => {
            AUTH_AUDIT_FAILED_TOTAL.fetch_add(1, Ordering::Relaxed);
            eprintln!(
                "[audit] direct persist failed event_type={} err={}",
                event_type, e
            );
            false
        }
    }
}

pub fn metrics_snapshot() -> AuthAuditAsyncMetricsSnapshot {
    AuthAuditAsyncMetricsSnapshot {
        enabled: AUTH_AUDIT_QUEUE_ENABLED.load(Ordering::Relaxed),
        queue_depth: AUTH_AUDIT_QUEUE_DEPTH.load(Ordering::Relaxed),
        enqueued_total: AUTH_AUDIT_ENQUEUED_TOTAL.load(Ordering::Relaxed),
        retried_total: AUTH_AUDIT_RETRIED_TOTAL.load(Ordering::Relaxed),
        failed_total: AUTH_AUDIT_FAILED_TOTAL.load(Ordering::Relaxed),
        fallback_direct_total: AUTH_AUDIT_FALLBACK_DIRECT_TOTAL.load(Ordering::Relaxed),
    }
}
