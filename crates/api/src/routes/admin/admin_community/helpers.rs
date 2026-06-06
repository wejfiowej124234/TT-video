//! Admin community-only parsing / allow-list helpers (split from `admin::mod`).

use chrono::{DateTime, Utc};

use crate::db;

pub(super) fn community_abuse_policy_patch_is_empty(p: &db::CommunityAbusePolicyPatch) -> bool {
    p.comment_rate_window_sec.is_none()
        && p.comment_max_per_window.is_none()
        && p.comment_min_interval_sec.is_none()
        && p.comment_duplicate_lookback_sec.is_none()
        && p.post_rate_window_sec.is_none()
        && p.post_max_per_window.is_none()
        && p.post_min_interval_sec.is_none()
        && p.post_duplicate_lookback_sec.is_none()
        && p.report_rate_window_sec.is_none()
        && p.report_max_per_window.is_none()
        && p.report_min_interval_sec.is_none()
        && p.report_duplicate_target_lookback_sec.is_none()
}

pub(super) fn parse_optional_penalty_expires_at(
    s: &Option<String>,
) -> Result<Option<DateTime<Utc>>, ()> {
    match s {
        None => Ok(None),
        Some(x) => {
            let t = x.trim();
            if t.is_empty() {
                Ok(None)
            } else {
                DateTime::parse_from_rfc3339(t)
                    .map(|d| Some(d.with_timezone(&Utc)))
                    .map_err(|_| ())
            }
        }
    }
}

pub(super) fn is_allowed_community_report_status(s: &str) -> bool {
    matches!(s, "open" | "in_review" | "resolved" | "dismissed")
}

pub(super) fn is_allowed_community_penalty_status_filter(s: &str) -> bool {
    matches!(s, "active" | "lifted" | "superseded")
}

pub(super) fn is_allowed_community_appeal_decision(s: &str) -> bool {
    matches!(s, "accepted" | "rejected")
}

pub(super) fn is_allowed_community_appeal_status_filter(s: &str) -> bool {
    matches!(s, "pending" | "accepted" | "rejected")
}
