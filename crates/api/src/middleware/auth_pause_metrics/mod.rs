//! 鉴权占位、权威来源、Pause 门禁、安全头、指标（50-O-B4：自 middleware 拆出，48 §14.3）

use axum::{
    body::Body,
    http::{header::HeaderName, header::HeaderValue, Method, Request},
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use std::env;
use std::sync::atomic::{AtomicU64, Ordering};

/// 鉴权占位：需登录路由在缺少身份时返回 401；实现时替换为 JWT/session 校验。04 §三、企业报告 §9.2。
pub async fn auth_placeholder_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    let path = req.uri().path();
    let method = req.method();
    let read = *method == Method::GET || *method == Method::HEAD;

    // 社区只读：Feed、帖子详情、评论、会话列表等 GET/HEAD 允许未登录访问（51-31、31 附录）
    let community_read = read
        && path.starts_with("/api/v1/community/")
        && !path.contains("/me/")
        && !path.contains("/friends/");

    let public = method == Method::OPTIONS
        || path == "/health"
        || path == "/meta"
        || path == "/meta/build"
        || path.starts_with("/auth/")
        || (read && path == "/api/v1/guides")
        || (read && path == "/api/v1/discover/orders")
        || (method == Method::POST && path == "/api/v1/trust-growth/ingest")
        // Stripe / PSP webhooks：公开 POST，handler 内 Stripe-Signature 验签（hooks.rs）
        || (method == Method::POST && path.starts_with("/api/v1/hooks/"))
        || (read && path == "/api/v1/trust-growth/config")
        || (read && path == "/api/v1/did-rank/travelers")
        || (read && path == "/api/v1/did-rank/guides")
        || (read && path == "/api/v1/did-rank/itineraries")
        || (read && path == "/api/v1/did-rank/prize-pool")
        || (read && path == "/api/v1/did-rank/providers")
        || (read && path == "/api/v1/did-rank/acquisitions")
        || (read && path.starts_with("/api/v1/media/access/"))
        || (read && path.starts_with("/api/v1/uploads/community-posts/"))
        // F-007 · 04 §三：本机头像 UUID 文件名匿名读（与 community-posts 同形）
        || (read && path.starts_with("/api/v1/uploads/profile-avatars/"))
        // 94 自由市场：已发布 listing 公开目录（drafts/orders 写路径仍须 Bearer）
        || (read && path == "/api/v1/market/provider/listings")
        || (read && path == "/api/v1/market/acquisition/listings")
        || (read
            && path.starts_with("/api/v1/market/provider/listings/")
            && !path.contains("/drafts")
            && !path.ends_with("/orders"))
        || (read
            && path.starts_with("/api/v1/market/acquisition/listings/")
            && !path.contains("/drafts")
            && !path.ends_with("/orders"))
        // B-191 / PH-1：TravelTrust 落地页只读机读锚 + 84 协议镜像 + 主理人 stake 公开读
        || (read && path == "/api/v1/traveltrust/page-brief")
        || (read && path == "/api/v1/governance/protocol-reference")
        || (read && path == "/api/v1/governance/protocol-reference/pending")
        || (read && path == "/api/v1/governance/state-machines")
        || (read && path == "/api/v1/steward/stake-quote")
        || (read && path == "/api/v1/steward/stake-status")
        || (read && path == "/api/v1/redemption/quote")
        // S2-API-RO：Catalog CMS 只读公众面（105 §3.2 · published only）
        || (read && path.starts_with("/api/v1/catalog/"))
        // E2E-A-01：Official OPS Cold Start deployed campaign 公众只读
        || (read && path.starts_with("/api/v1/official/cold-start/surfaces/"))
        || path.starts_with("/api/v1/internal/")
        || community_read;
    if public {
        return next.run(req).await;
    }

    if path.starts_with("/api/v1/") {
        // P1 鉴权收敛：生产可设 STRICT_SESSION_GATE=1，禁止仅靠 X-User-Id 绕过（须 Authorization: Bearer <session_token>）。
        if env::var("STRICT_SESSION_GATE").as_deref() == Ok("1") {
            let bearer_ok = req
                .headers()
                .get(axum::http::header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .map(|s| {
                    let t = s.trim();
                    let lower = t.to_ascii_lowercase();
                    lower.starts_with("bearer ") && t.len() > "bearer ".len()
                })
                .unwrap_or(false);
            if !bearer_ok {
                return (
                    axum::http::StatusCode::UNAUTHORIZED,
                    Json(json!({
                        "error": "unauthorized",
                        "message": "unauthorized",
                        "detail": "STRICT_SESSION_GATE=1：须提供 Authorization: Bearer <session_token>（不接受仅 X-User-Id）"
                    })),
                )
                    .into_response();
            }
        } else {
            let has_user = req
                .headers()
                .get("X-User-Id")
                .and_then(|v| v.to_str().ok())
                .map(|s| !s.is_empty())
                .unwrap_or(false);
            let has_auth = req.headers().get("Authorization").is_some();
            if !has_user && !has_auth {
                return (
                    axum::http::StatusCode::UNAUTHORIZED,
                    Json(json!({
                        "error": "unauthorized",
                        "message": "unauthorized",
                        "detail": "需登录：请提供 X-User-Id 或 Authorization"
                    })),
                )
                    .into_response();
            }
        }
    }

    next.run(req).await
}

/// 运行时权威来源中间件：在响应头写入 x-authority-source，且在 degraded_mode 时可阻断关键写操作。
pub async fn authority_source_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    let authority_source = env::var("API_AUTHORITY_SOURCE").unwrap_or_else(|_| "auto".to_string());
    let mut computed = "db_projection".to_string();

    let indexer_lag_blocks: u64 = env::var("INDEXER_LAG_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    let indexer_lag_max_blocks: u64 = env::var("INDEXER_LAG_MAX_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(100);
    let reorg_detected = env::var("REORG_DETECTED").as_deref() == Ok("1");
    let chain_congested = env::var("CHAIN_CONGESTED").as_deref() == Ok("1");
    let degraded_mode =
        reorg_detected || chain_congested || indexer_lag_blocks > indexer_lag_max_blocks;

    if authority_source != "auto" {
        computed = authority_source;
    } else if degraded_mode {
        computed = "pending_finality".to_string();
    }

    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let is_write = method == Method::POST || method == Method::PUT;
    let blocks_writes = degraded_mode && is_write;
    if blocks_writes {
        let rule = "degraded_mode 时冻结关键写操作；前端应显示‘待最终确认’并仅允许查询";
        let mut res = (
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "degraded_mode",
                "error": "degraded_mode",
                "message": "degraded_mode",
                "detail": rule,
                "authority_source": computed,
                "reason": "indexer_lag/reorg/chain_congestion",
                "rule": rule,
                "path": path,
                "method": method.to_string(),
            })),
        )
            .into_response();
        if let (Ok(n), Ok(v)) = (
            HeaderName::try_from("x-authority-source"),
            HeaderValue::try_from(computed.as_str()),
        ) {
            res.headers_mut().insert(n, v);
        }
        return res;
    }

    let mut res = next.run(req).await;
    if let (Ok(n), Ok(v)) = (
        HeaderName::try_from("x-authority-source"),
        HeaderValue::try_from(computed.as_str()),
    ) {
        res.headers_mut().insert(n, v);
    }
    res
}

/// Pause 门禁中间件：PAUSE_MODE=1 时，只有 allowlist 命中的接口允许继续。
pub async fn pause_gate_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    if env::var("PAUSE_MODE").as_deref() != Ok("1") {
        return next.run(req).await;
    }

    // 默认含 **GET /api/v1/media/access/***（270 短期 URL 兑现；与 auth 层匿名 GET 白名单一致）
    let allowlist = env::var("PAUSE_API_ALLOWLIST").unwrap_or_else(|_| {
        "GET /health;GET /meta;GET /meta/build;GET /api/v1/media/access/*".to_string()
    });
    let method = req.method().as_str().to_string();
    let path = req.uri().path().to_string();
    let signature = format!("{} {}", method, path);

    if pause_allowlist_match(&allowlist, &signature) {
        return next.run(req).await;
    }

    let rule = "PAUSE_MODE=1 时仅允许 PAUSE_API_ALLOWLIST 命中的接口继续";
    (
        axum::http::StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "paused",
            "error": "api_paused",
            "message": "api_paused",
            "detail": rule,
            "rule": rule,
            "signature": signature,
            "pause_api_allowlist": allowlist,
        })),
    )
        .into_response()
}

pub fn pause_allowlist_match(allowlist: &str, signature: &str) -> bool {
    let signature = signature.trim();
    allowlist
        .split(|c| c == ';' || c == ',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .any(|pattern| wildcard_match(pattern, signature))
}

fn wildcard_match(pattern: &str, text: &str) -> bool {
    if pattern == "*" {
        return true;
    }
    let mut parts = pattern.split('*');
    let Some(first) = parts.next() else {
        return pattern == text;
    };
    if !text.starts_with(first) {
        return false;
    }
    let mut idx = first.len();
    for p in parts {
        if p.is_empty() {
            continue;
        }
        match text[idx..].find(p) {
            Some(pos) => idx += pos + p.len(),
            None => return false,
        }
    }
    if !pattern.ends_with('*') {
        if let Some(last) = pattern.split('*').last() {
            return text.ends_with(last);
        }
    }
    true
}

/// 当 **`INTERNAL_API_SECRET`** 非空时，`/api/v1/internal/*` 须带 **`X-Internal-Api-Secret`** 且与之一致；未设或空则**不启用**（本地联调兼容）。04 §7.6、Runbook 内网门禁。
#[must_use]
pub(crate) fn internal_secret_gate_denies(
    path: &str,
    env_secret: Option<&str>,
    header: Option<&str>,
) -> bool {
    if !path.starts_with("/api/v1/internal/") {
        return false;
    }
    let Some(expected) = env_secret.and_then(|s| {
        let t = s.trim();
        if t.is_empty() {
            None
        } else {
            Some(t)
        }
    }) else {
        return false;
    };
    let got = header.map(str::trim).unwrap_or("");
    got != expected
}

pub async fn internal_api_secret_gate_layer(
    req: Request<Body>,
    next: axum::middleware::Next,
) -> Response {
    let path = req.uri().path().to_string();
    let sec = env::var("INTERNAL_API_SECRET").ok();
    let header = req
        .headers()
        .get("x-internal-api-secret")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    if internal_secret_gate_denies(path.as_str(), sec.as_deref(), header.as_deref()) {
        return (
            axum::http::StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key_detail(
                "internal_api_forbidden",
                "INTERNAL_API_SECRET is set: send header X-Internal-Api-Secret with the same value",
            )),
        )
            .into_response();
    }
    next.run(req).await
}

/// 响应安全头（最小基线）：避免浏览器误嗅探、点击劫持、Referrer 泄漏等。
pub async fn security_headers_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    let mut res = next.run(req).await;

    res.headers_mut().insert(
        HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    res.headers_mut().insert(
        HeaderName::from_static("x-frame-options"),
        HeaderValue::from_static("DENY"),
    );
    res.headers_mut().insert(
        HeaderName::from_static("referrer-policy"),
        HeaderValue::from_static("no-referrer"),
    );
    // 保留 handler 已设置的 Cache-Control（如 community-posts UUID 媒体 `immutable`）。
    if !res.headers().contains_key(HeaderName::from_static("cache-control")) {
        res.headers_mut().insert(
            HeaderName::from_static("cache-control"),
            HeaderValue::from_static("no-store"),
        );
    }
    res.headers_mut().insert(
        HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("geolocation=(), microphone=(), camera=()"),
    );

    if env::var("HSTS").as_deref() == Ok("1") {
        res.headers_mut().insert(
            HeaderName::from_static("strict-transport-security"),
            HeaderValue::from_static("max-age=31536000; includeSubDomains"),
        );
    }

    res
}

/// P31 指标：请求总数（供 Prometheus rate() 算 QPS）；中间件每请求 +1。
static REQUEST_TOTAL: AtomicU64 = AtomicU64::new(0);

pub fn request_total() -> u64 {
    REQUEST_TOTAL.load(Ordering::Relaxed)
}

pub async fn metrics_request_count_layer(
    req: Request<Body>,
    next: axum::middleware::Next,
) -> Response {
    REQUEST_TOTAL.fetch_add(1, Ordering::Relaxed);
    next.run(req).await
}

#[cfg(test)]
mod tests;
