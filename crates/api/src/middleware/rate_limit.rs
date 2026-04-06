//! 全局限流、关键写限流、`GET /meta` 速率快照（50-B1、G7/55 八附续）

use axum::body::Body;
use axum::http::Method;
use axum::http::Request;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use std::collections::HashMap;
use std::env;
use std::time::Instant;

use super::{GUIDE_UPLOAD_RATE_LIMIT, GUIDE_UPLOAD_RATE_WINDOW_SECS};

/// 50-B1：全局限流，/api/v1 每客户端（IP 或 X-Forwarded-For）每分钟请求数上限，超限 429
const API_RATE_LIMIT_DEFAULT: u32 = 120;
pub(super) const API_RATE_WINDOW_SECS: u64 = 60;

/// G7/55 八附续：关键写接口更严格限流（53 附录 A BB5、Runbook 反刷/限流）
const CRITICAL_WRITE_RATE_LIMIT_DEFAULT: u32 = 15;

pub(crate) fn is_admin_critical_write_path(method: &Method, path: &str) -> bool {
    if *method == Method::PATCH && path == "/api/v1/admin/community/abuse-policy" {
        return true;
    }
    if *method == Method::PATCH && path.starts_with("/api/v1/admin/community/moderation/") {
        return true;
    }
    if *method == Method::PATCH && path.starts_with("/api/v1/admin/community/comments/") {
        return true;
    }
    if *method != Method::POST {
        return false;
    }
    if path.starts_with("/api/v1/admin/users/") && path.ends_with("/role-change-request") {
        return true;
    }
    if path.starts_with("/api/v1/admin/flags/") && path.ends_with("/publish") {
        return true;
    }
    if path.starts_with("/api/v1/admin/policies/") && path.ends_with("/publish") {
        return true;
    }
    if path.starts_with("/api/v1/admin/tenants/scopes/") && path.ends_with("/publish") {
        return true;
    }
    if path.contains("/api/v1/admin/community/appeals/") && path.ends_with("/review") {
        return true;
    }
    if *method == Method::POST && path == "/api/v1/admin/community/penalties" {
        return true;
    }
    if path.starts_with("/api/v1/admin/compliance/data-requests/") && path.ends_with("/update") {
        return true;
    }
    if path.contains("/api/v1/admin/scheduler/jobs/") && path.ends_with("/rerun") {
        return true;
    }
    path.starts_with("/api/v1/admin/approvals/") && path.ends_with("/approve")
}

fn is_order_critical_write_path(method: &Method, path: &str) -> bool {
    if *method != Method::POST || !path.starts_with("/api/v1/orders/") {
        return false;
    }
    path.ends_with("/accept")
        || path.ends_with("/cancel")
        || path.ends_with("/confirm-final-plan")
        || path.ends_with("/confirm-bilateral")
        || path.ends_with("/confirm-rating")
        || path.ends_with("/reviews")
}

pub(crate) fn is_critical_write_path(method: &Method, path: &str) -> bool {
    is_order_critical_write_path(method, path) || is_admin_critical_write_path(method, path)
}

/// **761**：`GET /meta` **`rate_limits.guide_upload`** 对象顶层键顺序（机读锁 **`guide_upload_top_keys`** / **`guide_upload_top_keys_contract_761`**；与同名列 JSON 数组同源；与 **`GUIDE_UPLOAD_RATE_LIMIT`****/**`GUIDE_UPLOAD_RATE_WINDOW_SECS`** 及向导资料上传限流层同源）。
pub const GUIDE_UPLOAD_META_TOP_KEYS: &[&str] = &[
    "max_per_window",
    "window_seconds",
    "rule",
    "guide_upload_top_keys",
    "guide_upload_top_keys_contract_761",
];

pub fn format_guide_upload_meta_top_keys_contract_761() -> String {
    let mut s = String::from(
        "**761**：**`guide_upload_top_keys`** **与 **`GUIDE_UPLOAD_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in GUIDE_UPLOAD_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// 50-B1：全局限流层；仅对 /api/v1 生效，按客户端 key 滑动窗口计数，超限 429（tokio::Mutex 保证 future Send）
pub async fn rate_limit_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    let path = req.uri().path();
    if !path.starts_with("/api/v1") {
        return next.run(req).await;
    }
    let limit = env::var("API_RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(API_RATE_LIMIT_DEFAULT);
    if limit == 0 {
        return next.run(req).await;
    }
    let key = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .or_else(|| req.headers().get("x-real-ip").and_then(|v| v.to_str().ok()))
        .unwrap_or("default")
        .to_string();
    static STORE: std::sync::OnceLock<tokio::sync::Mutex<HashMap<String, Vec<Instant>>>> =
        std::sync::OnceLock::new();
    let store = STORE.get_or_init(|| tokio::sync::Mutex::new(HashMap::new()));
    let now = Instant::now();
    let window = std::time::Duration::from_secs(API_RATE_WINDOW_SECS);
    let over = {
        let mut guard = store.lock().await;
        let vec = guard.entry(key).or_default();
        vec.retain(|t| now.saturating_duration_since(*t) < window);
        if vec.len() >= limit as usize {
            true
        } else {
            vec.push(now);
            false
        }
    };
    if over {
        return (
            axum::http::StatusCode::TOO_MANY_REQUESTS,
            Json(json!({
                "error": "rate_limit_exceeded",
                "message": "rate_limit_exceeded",
                "detail": "请求过于频繁，请稍后再试",
                "retry_after_seconds": API_RATE_WINDOW_SECS
            })),
        )
            .into_response();
    }
    next.run(req).await
}

/// G7/55-S 八附续：关键写接口限流。
pub async fn critical_write_rate_limit_layer(
    req: Request<Body>,
    next: axum::middleware::Next,
) -> Response {
    let path = req.uri().path();
    let method = req.method();
    if !is_critical_write_path(method, path) {
        return next.run(req).await;
    }
    let limit = env::var("CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(CRITICAL_WRITE_RATE_LIMIT_DEFAULT);
    if limit == 0 {
        return next.run(req).await;
    }
    let key = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .or_else(|| req.headers().get("x-real-ip").and_then(|v| v.to_str().ok()))
        .unwrap_or("default")
        .to_string();
    let key = format!("critical:{}", key);
    static CRITICAL_STORE: std::sync::OnceLock<tokio::sync::Mutex<HashMap<String, Vec<Instant>>>> =
        std::sync::OnceLock::new();
    let store = CRITICAL_STORE.get_or_init(|| tokio::sync::Mutex::new(HashMap::new()));
    let now = Instant::now();
    let window = std::time::Duration::from_secs(API_RATE_WINDOW_SECS);
    let over = {
        let mut guard = store.lock().await;
        let vec = guard.entry(key).or_default();
        vec.retain(|t| now.saturating_duration_since(*t) < window);
        if vec.len() >= limit as usize {
            true
        } else {
            vec.push(now);
            false
        }
    };
    if over {
        return (
            axum::http::StatusCode::TOO_MANY_REQUESTS,
            Json(json!({
                "error": "critical_write_rate_limit_exceeded",
                "message": "critical_write_rate_limit_exceeded",
                "detail": "关键操作（订单关键写/Admin 高危写）请求过于频繁，请稍后再试",
                "retry_after_seconds": API_RATE_WINDOW_SECS
            })),
        )
            .into_response();
    }
    next.run(req).await
}

/// 与 `rate_limit_layer` / `critical_write_rate_limit_layer` / `chain_off::evidence` / `chain_off::reviews` 同源解析，供 GET `/meta` 运维快照（Phase 5 / 07）。
pub fn meta_rate_limits_snapshot() -> serde_json::Value {
    let api = env::var("API_RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(API_RATE_LIMIT_DEFAULT);
    let critical = env::var("CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(CRITICAL_WRITE_RATE_LIMIT_DEFAULT);
    let evidence = env::var("EVIDENCE_MAX_REQUESTS_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(0);
    let review = env::var("REVIEW_MAX_REQUESTS_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(0);
    let low_score_min = env::var("REVIEW_LOW_SCORE_COMMENT_MIN_CHARS")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(20);

    let mut guide_upload = json!({
        "max_per_window": GUIDE_UPLOAD_RATE_LIMIT,
        "window_seconds": GUIDE_UPLOAD_RATE_WINDOW_SECS,
        "rule": "761：max_per_window/window_seconds 与 GUIDE_UPLOAD_RATE_LIMIT / GUIDE_UPLOAD_RATE_WINDOW_SECS 及向导资料上传限流中间件同源；GET /meta rate_limits.guide_upload 对象 guide_upload_top_keys / guide_upload_top_keys_contract_761 与 GUIDE_UPLOAD_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(go) = guide_upload.as_object_mut() {
        let keys761: serde_json::Value = serde_json::to_value(GUIDE_UPLOAD_META_TOP_KEYS)
            .expect("GUIDE_UPLOAD_META_TOP_KEYS serializes to JSON array");
        go.insert("guide_upload_top_keys".to_string(), keys761);
        go.insert(
            "guide_upload_top_keys_contract_761".to_string(),
            serde_json::Value::String(format_guide_upload_meta_top_keys_contract_761()),
        );
    }

    json!({
        "window_seconds": API_RATE_WINDOW_SECS,
        "api_requests_per_minute_per_client": api,
        "api_limit_disabled": api == 0,
        "critical_writes_per_minute_per_client": critical,
        "critical_limit_disabled": critical == 0,
        "evidence_posts_per_minute_per_order_user": evidence,
        "evidence_limit_disabled": evidence == 0,
        "review_submits_per_minute_per_order_reviewer": review,
        "review_limit_disabled": review == 0,
        "review_low_score_min_comment_chars": low_score_min,
        "review_low_score_rule_disabled": low_score_min == 0,
        "guide_upload": guide_upload,
        "rule": "API/critical: 0=关闭该限流；evidence/review 分钟桶: 0=关闭；低分评论: min_chars=0 关闭校验；756 GET /meta rate_limits 对象 rate_limits_top_keys / rate_limits_top_keys_contract_756 与 RATE_LIMITS_META_TOP_KEYS 十五键顺序同源；761 GET /meta rate_limits.guide_upload 对象 guide_upload_top_keys / guide_upload_top_keys_contract_761 与 GUIDE_UPLOAD_META_TOP_KEYS 五键顺序同源"
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meta_rate_limits_snapshot_has_stable_shape() {
        let v = meta_rate_limits_snapshot();
        assert!(v.get("api_requests_per_minute_per_client").is_some());
        assert!(v.get("critical_writes_per_minute_per_client").is_some());
        assert!(v.get("evidence_posts_per_minute_per_order_user").is_some());
        assert!(v
            .get("review_submits_per_minute_per_order_reviewer")
            .is_some());
        assert!(v.get("review_low_score_min_comment_chars").is_some());
        assert!(v.get("window_seconds").is_some());
        let g = v
            .get("guide_upload")
            .and_then(|x| x.as_object())
            .expect("guide_upload object");
        assert!(g.contains_key("max_per_window"));
        assert!(g.contains_key("window_seconds"));
        assert!(g.contains_key("rule"));
        assert!(g.contains_key("guide_upload_top_keys"));
        assert!(g.contains_key("guide_upload_top_keys_contract_761"));
        let keys = g["guide_upload_top_keys"].as_array().expect("array");
        assert_eq!(keys.len(), GUIDE_UPLOAD_META_TOP_KEYS.len());
    }

    #[test]
    fn admin_critical_write_paths_are_detected() {
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/users/00000000-0000-4000-8000-000000000001/role-change-request"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/approvals/00000000-0000-4000-8000-000000000002/approve"
        ));
        assert!(!is_admin_critical_write_path(
            &Method::GET,
            "/api/v1/admin/approvals/00000000-0000-4000-8000-000000000002/approve"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/flags/00000000-0000-4000-8000-000000000003/publish"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/policies/00000000-0000-4000-8000-00000000000a/publish"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/tenants/scopes/00000000-0000-4000-8000-00000000000b/publish"
        ));
        assert!(is_admin_critical_write_path(
            &Method::PATCH,
            "/api/v1/admin/community/moderation/00000000-0000-4000-8000-00000000000d"
        ));
        assert!(is_admin_critical_write_path(
            &Method::PATCH,
            "/api/v1/admin/community/comments/00000000-0000-4000-8000-0000000000f0"
        ));
        assert!(is_admin_critical_write_path(
            &Method::PATCH,
            "/api/v1/admin/community/abuse-policy"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/community/appeals/00000000-0000-4000-8000-00000000000e/review"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/community/penalties"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/compliance/data-requests/00000000-0000-4000-8000-00000000000c/update"
        ));
        assert!(is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/scheduler/jobs/indexer.tick/rerun"
        ));
        assert!(!is_admin_critical_write_path(
            &Method::POST,
            "/api/v1/admin/audit-logs"
        ));
    }

    #[test]
    fn critical_write_path_union_includes_order_and_admin_paths() {
        assert!(is_critical_write_path(
            &Method::POST,
            "/api/v1/orders/00000000-0000-4000-8000-000000000001/accept"
        ));
        assert!(is_critical_write_path(
            &Method::POST,
            "/api/v1/admin/approvals/00000000-0000-4000-8000-000000000002/approve"
        ));
        assert!(is_critical_write_path(
            &Method::POST,
            "/api/v1/admin/flags/00000000-0000-4000-8000-000000000003/publish"
        ));
        assert!(is_critical_write_path(
            &Method::POST,
            "/api/v1/admin/policies/00000000-0000-4000-8000-00000000000b/publish"
        ));
        assert!(is_critical_write_path(
            &Method::POST,
            "/api/v1/admin/compliance/data-requests/00000000-0000-4000-8000-00000000000d/update"
        ));
        assert!(is_critical_write_path(
            &Method::PATCH,
            "/api/v1/admin/community/moderation/00000000-0000-4000-8000-0000000000e1"
        ));
        assert!(is_critical_write_path(
            &Method::PATCH,
            "/api/v1/admin/community/comments/00000000-0000-4000-8000-0000000000f1"
        ));
        assert!(is_critical_write_path(
            &Method::PATCH,
            "/api/v1/admin/community/abuse-policy"
        ));
        assert!(is_critical_write_path(
            &Method::POST,
            "/api/v1/admin/scheduler/jobs/reconcile-daily/rerun"
        ));
        assert!(!is_critical_write_path(
            &Method::POST,
            "/api/v1/orders/00000000-0000-4000-8000-000000000001/messages"
        ));
    }
}
