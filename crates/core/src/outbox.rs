//! Minimal durable outbox (file-backed).
//!
//! Goals:
//! - Persist intent before doing side effects (chain tx / external calls).
//! - Provide crash recovery (lease-based reclaim of in-progress items).
//! - Keep semantics explicit: at-least-once delivery, idempotent handlers.

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OutboxStatus {
    Pending,
    InProgress,
    Done,
    Dead,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutboxItem {
    pub id: Uuid,
    pub kind: String,
    pub idempotency_key: Option<String>,
    pub payload: serde_json::Value,

    pub status: OutboxStatus,
    pub attempts: u32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub claimed_at: Option<DateTime<Utc>>,
    pub next_attempt_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
}

impl OutboxItem {
    pub fn new(kind: impl Into<String>, payload: serde_json::Value) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            kind: kind.into(),
            idempotency_key: None,
            payload,
            status: OutboxStatus::Pending,
            attempts: 0,
            created_at: now,
            updated_at: now,
            claimed_at: None,
            next_attempt_at: None,
            last_error: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct FileOutbox {
    root: PathBuf,
}

#[derive(Debug, Clone)]
pub struct OutboxClaim {
    pub item: OutboxItem,
    pub lease_expires_at: DateTime<Utc>,
}

impl FileOutbox {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn ensure_dirs(&self) -> io::Result<()> {
        for d in ["pending", "in_progress", "done", "dead"] {
            fs::create_dir_all(self.root.join(d))?;
        }
        Ok(())
    }

    pub fn enqueue(&self, mut item: OutboxItem) -> io::Result<OutboxItem> {
        self.ensure_dirs()?;
        item.status = OutboxStatus::Pending;
        item.updated_at = Utc::now();
        let path = self.pending_path(item.id);
        write_json_atomic(&path, &item)?;
        Ok(item)
    }

    /// Attempt to claim a single pending item.
    ///
    /// Semantics: at-least-once. Claim is done via atomic rename into `in_progress/`.
    pub fn claim_next(&self, lease_secs: i64) -> io::Result<Option<OutboxClaim>> {
        self.ensure_dirs()?;

        let pending_dir = self.root.join("pending");
        let mut entries: Vec<PathBuf> = Vec::new();
        for ent in fs::read_dir(pending_dir)? {
            let ent = ent?;
            if ent.file_type()?.is_file() {
                entries.push(ent.path());
            }
        }
        entries.sort();

        for path in entries {
            let bytes = match fs::read(&path) {
                Ok(b) => b,
                Err(_) => continue,
            };
            let mut item: OutboxItem = match serde_json::from_slice(&bytes) {
                Ok(v) => v,
                Err(_) => {
                    // Corrupted record: move to dead for manual inspection.
                    let dead = self.dead_path_from_name(path.file_name().unwrap_or_default());
                    let _ = fs::rename(&path, dead);
                    continue;
                }
            };

            if item.next_attempt_at.is_some_and(|t| t > Utc::now()) {
                continue;
            }

            let file_name = match path.file_name() {
                Some(n) => n,
                None => continue,
            };
            let in_progress_path = self.root.join("in_progress").join(file_name);
            match fs::rename(&path, &in_progress_path) {
                Ok(()) => {
                    let now = Utc::now();
                    item.status = OutboxStatus::InProgress;
                    item.claimed_at = Some(now);
                    item.updated_at = now;
                    write_json_atomic(&in_progress_path, &item)?;
                    let lease_expires_at = now + Duration::seconds(lease_secs);
                    return Ok(Some(OutboxClaim { item, lease_expires_at }));
                }
                Err(_) => continue,
            }
        }

        Ok(None)
    }

    /// Recover items stuck in `in_progress/` beyond lease; moves them back to `pending/`.
    pub fn recover_stuck(&self, lease_secs: i64) -> io::Result<u64> {
        self.ensure_dirs()?;

        let in_progress_dir = self.root.join("in_progress");
        let mut recovered = 0u64;
        for ent in fs::read_dir(in_progress_dir)? {
            let ent = ent?;
            if !ent.file_type()?.is_file() {
                continue;
            }
            let path = ent.path();
            let bytes = match fs::read(&path) {
                Ok(b) => b,
                Err(_) => continue,
            };
            let item: OutboxItem = match serde_json::from_slice(&bytes) {
                Ok(v) => v,
                Err(_) => continue,
            };
            let Some(claimed_at) = item.claimed_at else {
                continue;
            };
            let expired = claimed_at + Duration::seconds(lease_secs) < Utc::now();
            if !expired {
                continue;
            }

            let pending = self.root.join("pending").join(ent.file_name());
            if fs::rename(&path, &pending).is_ok() {
                recovered += 1;
            }
        }
        Ok(recovered)
    }

    pub fn mark_done(&self, mut item: OutboxItem) -> io::Result<()> {
        self.ensure_dirs()?;
        item.status = OutboxStatus::Done;
        item.updated_at = Utc::now();
        item.claimed_at = None;
        item.next_attempt_at = None;
        let done_path = self.done_path(item.id);
        write_json_atomic(&done_path, &item)?;
        self.try_remove_in_progress(item.id);
        Ok(())
    }

    pub fn reschedule(&self, mut item: OutboxItem, after_secs: i64, err: Option<String>) -> io::Result<()> {
        self.ensure_dirs()?;
        let now = Utc::now();
        item.attempts = item.attempts.saturating_add(1);
        item.status = OutboxStatus::Pending;
        item.updated_at = now;
        item.claimed_at = None;
        item.last_error = err;
        item.next_attempt_at = Some(now + Duration::seconds(after_secs));

        let pending_path = self.pending_path(item.id);
        write_json_atomic(&pending_path, &item)?;
        self.try_remove_in_progress(item.id);
        Ok(())
    }

    pub fn dead_letter(&self, mut item: OutboxItem, err: Option<String>) -> io::Result<()> {
        self.ensure_dirs()?;
        item.attempts = item.attempts.saturating_add(1);
        item.status = OutboxStatus::Dead;
        item.updated_at = Utc::now();
        item.claimed_at = None;
        item.last_error = err;
        item.next_attempt_at = None;

        let dead_path = self.dead_path(item.id);
        write_json_atomic(&dead_path, &item)?;
        self.try_remove_in_progress(item.id);
        Ok(())
    }

    fn try_remove_in_progress(&self, id: Uuid) {
        let path = self.in_progress_path(id);
        let _ = fs::remove_file(path);
    }

    fn pending_path(&self, id: Uuid) -> PathBuf {
        self.root.join("pending").join(format!("{}.json", id))
    }

    fn in_progress_path(&self, id: Uuid) -> PathBuf {
        self.root.join("in_progress").join(format!("{}.json", id))
    }

    fn done_path(&self, id: Uuid) -> PathBuf {
        self.root.join("done").join(format!("{}.json", id))
    }

    fn dead_path(&self, id: Uuid) -> PathBuf {
        self.root.join("dead").join(format!("{}.json", id))
    }

    fn dead_path_from_name(&self, name: &std::ffi::OsStr) -> PathBuf {
        self.root.join("dead").join(name)
    }
}

fn write_json_atomic<T: Serialize>(path: &Path, value: &T) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let tmp = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(value).map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
    fs::write(&tmp, bytes)?;
    fs::rename(tmp, path)?;
    Ok(())
}
