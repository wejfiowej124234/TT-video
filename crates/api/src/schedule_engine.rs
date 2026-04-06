//! Schedule Engine（档期引擎，80 §4.15、48 阶段 E、49 C）
//!
//! 职责：重叠判断、锁定生效（deposit finality 后）、payment_window 软占用、防重复接单。
//! 49 C：档期持久化到文件（SCHEDULE_SLOTS_PATH），启动时 load，lock/release 后 persist。

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::RwLock;
use uuid::Uuid;

/// 档期区间（日期级，80 §4.15.6）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DateRange {
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
}

impl DateRange {
    pub fn new(start_date: NaiveDate, end_date: NaiveDate) -> Result<Self, String> {
        if end_date < start_date {
            return Err("end_date must be >= start_date".to_string());
        }
        Ok(DateRange {
            start_date,
            end_date,
        })
    }
}

/// 判断两档期是否重叠（80 §4.15.5、4.15.11）
#[inline]
pub fn check_overlap(a: &DateRange, b: &DateRange) -> bool {
    a.start_date <= b.end_date && b.start_date <= a.end_date
}

/// 已锁定档期存储（内存；49 C 可选文件持久化）
#[derive(Default, Clone)]
struct LockedSlots {
    /// guide_id -> vec of (order_id, range)
    by_guide: HashMap<Uuid, Vec<(Uuid, DateRange)>>,
}

/// 文件落盘格式（49 C.5）
#[derive(Serialize, Deserialize)]
struct SlotsSnapshot {
    by_guide: HashMap<String, Vec<SlotEntry>>,
}
#[derive(Serialize, Deserialize)]
struct SlotEntry {
    order_id: String,
    start_date: String,
    end_date: String,
}

static LOCKED: std::sync::OnceLock<Arc<RwLock<LockedSlots>>> = std::sync::OnceLock::new();
/// 启动时若已 load，供 locked_slots() 取用
static INITIAL_SLOTS: Mutex<Option<LockedSlots>> = Mutex::new(None);
static PERSIST_PATH: std::sync::OnceLock<std::path::PathBuf> = std::sync::OnceLock::new();

/// 软占用（payment_window 内保留档期，超时释放；80 §4.15.2、4.15.11）
#[derive(Clone, Debug)]
pub struct HoldSoft {
    pub guide_id: Uuid,
    pub order_id: Uuid,
    pub range: DateRange,
    /// 软占用截止时间（超时释放）
    pub window_until: Option<chrono::DateTime<chrono::Utc>>,
}

fn locked_slots() -> Arc<RwLock<LockedSlots>> {
    LOCKED
        .get_or_init(|| {
            let initial = INITIAL_SLOTS
                .lock()
                .ok()
                .and_then(|mut g| g.take())
                .unwrap_or_default();
            Arc::new(RwLock::new(initial))
        })
        .clone()
}

/// 49 C：从文件加载档期，应在 startup 中、任何 lock_slot 前调用；路径存于 SCHEDULE_SLOTS_PATH。
pub fn load_from_path(path: &Path) -> Result<(), String> {
    let data = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let snap: SlotsSnapshot = if data.trim().is_empty() {
        SlotsSnapshot {
            by_guide: HashMap::new(),
        }
    } else {
        serde_json::from_str(&data).map_err(|e| e.to_string())?
    };
    let mut by_guide: HashMap<Uuid, Vec<(Uuid, DateRange)>> = HashMap::new();
    for (gid_str, entries) in snap.by_guide {
        let guide_id = Uuid::parse_str(&gid_str).map_err(|e| e.to_string())?;
        let list: Result<Vec<(Uuid, DateRange)>, String> = entries
            .into_iter()
            .map(|e| {
                let order_id = Uuid::parse_str(&e.order_id).map_err(|x| x.to_string())?;
                let start_date = NaiveDate::parse_from_str(&e.start_date, "%Y-%m-%d")
                    .map_err(|x| x.to_string())?;
                let end_date = NaiveDate::parse_from_str(&e.end_date, "%Y-%m-%d")
                    .map_err(|x| x.to_string())?;
                Ok((order_id, DateRange::new(start_date, end_date)?))
            })
            .collect();
        by_guide.insert(guide_id, list?);
    }
    let _ = PERSIST_PATH.set(path.to_path_buf());
    let mut g = INITIAL_SLOTS.lock().map_err(|e| e.to_string())?;
    *g = Some(LockedSlots { by_guide });
    Ok(())
}

/// 49 C：从环境变量 SCHEDULE_SLOTS_PATH 初始化档期持久化；文件存在则加载，否则仅设路径（后续 lock_slot 会落盘）。应在 startup 中、任何 lock_slot 前调用。
pub fn init_from_env() -> Result<(), String> {
    let path = match std::env::var("SCHEDULE_SLOTS_PATH")
        .ok()
        .filter(|s| !s.trim().is_empty())
    {
        Some(s) => std::path::PathBuf::from(s.trim()),
        None => return Ok(()),
    };
    if path.exists() {
        load_from_path(&path)?;
    } else {
        let _ = PERSIST_PATH.set(path);
    }
    Ok(())
}

/// 49 C：将当前档期写入文件（lock_slot/release_slot 后调用）
async fn persist_if_configured() {
    let path = match PERSIST_PATH.get() {
        Some(p) => p.clone(),
        None => return,
    };
    let guard = locked_slots();
    let g = guard.read().await;
    let snap = SlotsSnapshot {
        by_guide: g
            .by_guide
            .iter()
            .map(|(k, v)| {
                (
                    k.to_string(),
                    v.iter()
                        .map(|(oid, r)| SlotEntry {
                            order_id: oid.to_string(),
                            start_date: r.start_date.format("%Y-%m-%d").to_string(),
                            end_date: r.end_date.format("%Y-%m-%d").to_string(),
                        })
                        .collect(),
                )
            })
            .collect(),
    };
    drop(g);
    if let Ok(s) = serde_json::to_string_pretty(&snap) {
        let _ = std::fs::write(&path, s);
    }
}

/// 锁定档期：deposit 达 finality 后调用（80 §4.15.1 D）
pub async fn lock_slot(
    guide_id: Uuid,
    order_id: Uuid,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<(), String> {
    let range = DateRange::new(start_date, end_date)?;
    let guard = locked_slots();
    let mut g = guard.write().await;
    let list = g.by_guide.entry(guide_id).or_default();
    if list.iter().any(|(oid, _)| *oid == order_id) {
        return Ok(());
    }
    list.push((order_id, range));
    drop(g);
    persist_if_configured().await;
    Ok(())
}

/// 释放档期：取消/终态后调用（80 §4.15.7）
pub async fn release_slot(guide_id: Uuid, order_id: Uuid) -> Result<(), String> {
    let guard = locked_slots();
    let mut g = guard.write().await;
    if let Some(list) = g.by_guide.get_mut(&guide_id) {
        list.retain(|(oid, _)| *oid != order_id);
        if list.is_empty() {
            g.by_guide.remove(&guide_id);
        }
    }
    drop(g);
    persist_if_configured().await;
    Ok(())
}

/// 软占用：confirm 后、deposit 前（payment_window 内保留档期；80 §4.15.2、4.15.11）
/// 当前为占位实现，仅做参数校验；实际软占用/超时释放可接定时任务或 outbox。
pub fn hold_soft(
    _guide_id: Uuid,
    _order_id: Uuid,
    start_date: NaiveDate,
    end_date: NaiveDate,
    window_until: Option<chrono::DateTime<chrono::Utc>>,
) -> Result<HoldSoft, String> {
    let range = DateRange::new(start_date, end_date)?;
    Ok(HoldSoft {
        guide_id: _guide_id,
        order_id: _order_id,
        range,
        window_until,
    })
}

/// 检查向导在给定档期是否已有锁定订单（接单/发布时调用；80 §4.15.11）
pub async fn has_overlapping_lock(
    guide_id: Uuid,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<bool, String> {
    let range = DateRange::new(start_date, end_date)?;
    let guard = locked_slots();
    let g = guard.read().await;
    let list = g
        .by_guide
        .get(&guide_id)
        .map(|v| v.as_slice())
        .unwrap_or(&[]);
    let overlapping = list.iter().any(|(_, r)| check_overlap(&range, r));
    Ok(overlapping)
}

/// B-079：只读列出某向导当前锁定档期（与 `has_overlapping_lock` 同源 `LockedSlots`）。
pub async fn locked_slots_for_guide(guide_id: Uuid) -> Vec<(Uuid, DateRange)> {
    let guard = locked_slots();
    let g = guard.read().await;
    g.by_guide
        .get(&guide_id)
        .cloned()
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 49 C：档期 load 单测 — 合法 JSON 可成功解析
    #[test]
    fn load_from_path_valid_json_ok() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!(
            "traveltrust_schedule_test_{}.json",
            uuid::Uuid::new_v4()
        ));
        let json = r#"{"by_guide":{"00000000-0000-0000-0000-000000000001":[{"order_id":"00000000-0000-0000-0000-000000000002","start_date":"2025-06-01","end_date":"2025-06-03"}]}}"#;
        std::fs::write(&path, json).unwrap();
        let r = load_from_path(&path);
        std::fs::remove_file(&path).ok();
        assert!(r.is_ok());
    }
}
