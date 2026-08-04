//! V65-PROD-003-G089 · Onboarding queue list limit + applied_filters honesty.
//!
//! Guide / provider / steward Admin queues share a bounded default page size and
//! surface `applied_filters` so Ops can see truncation without inventing pagination UI.

use serde_json::{json, Value};

pub const ADMIN_ONBOARDING_QUEUE_LIST_LIMIT_DEFAULT: i64 = 100;
pub const ADMIN_ONBOARDING_QUEUE_LIST_LIMIT_MAX: i64 = 500;

pub fn clamp_onboarding_queue_list_limit(limit: Option<i64>) -> i64 {
    limit
        .unwrap_or(ADMIN_ONBOARDING_QUEUE_LIST_LIMIT_DEFAULT)
        .clamp(1, ADMIN_ONBOARDING_QUEUE_LIST_LIMIT_MAX)
}

/// Truncate `items` and attach `applied_filters` (`limit` · optional `status` ·
/// `matched_before_limit` · optional `truncated`).
pub fn apply_onboarding_queue_list_limit(body: &mut Value, limit: i64, status: Option<&str>) {
    let matched = body
        .get("items")
        .and_then(|v| v.as_array())
        .map(|a| a.len() as i64)
        .unwrap_or(0);
    let truncated = matched > limit;
    if truncated {
        if let Some(items) = body.get_mut("items").and_then(|v| v.as_array_mut()) {
            items.truncate(limit as usize);
        }
    }
    let mut af = json!({
        "limit": limit,
        "matched_before_limit": matched,
    });
    if let Some(s) = status.map(str::trim).filter(|s| !s.is_empty()) {
        af["status"] = json!(s);
    }
    if truncated {
        af["truncated"] = json!(true);
    }
    body["applied_filters"] = af;
}
