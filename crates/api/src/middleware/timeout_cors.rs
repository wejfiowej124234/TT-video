//! Timeout 与 CORS 配置（50-O-B4：自 middleware 拆出，48 §14.3）
//! 开发态未设 CORS_ORIGINS 时使用 very_permissive()，使 preflight 回显请求 origin，避免跨域报错。

use axum::http::header::HeaderValue;
use std::env;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};

/// 从环境变量构建 CORS layer；开发态未设 CORS_ORIGINS 时使用 very_permissive() 确保 preflight 通过。
pub fn build_cors() -> CorsLayer {
    let cors_origins_raw = env::var("CORS_ORIGINS").ok();
    match cors_origins_raw {
        Some(s) if !s.trim().is_empty() => {
            let mut origins: Vec<HeaderValue> = s
                .split(',')
                .filter_map(|o| HeaderValue::try_from(o.trim()).ok())
                .collect();
            let dev_origins = [
                "http://localhost:3012",
                "http://localhost:3000",
                "http://127.0.0.1:3012",
                "http://127.0.0.1:3000",
            ];
            for o in &dev_origins {
                if let Ok(h) = HeaderValue::try_from(*o) {
                    if !origins.iter().any(|v| v.as_bytes() == h.as_bytes()) {
                        origins.push(h);
                    }
                }
            }
            if origins.is_empty() {
                CorsLayer::very_permissive()
            } else {
                CorsLayer::new()
                    .allow_origin(AllowOrigin::list(origins))
                    .allow_methods(Any)
                    .allow_headers(Any)
            }
        }
        // 开发态：very_permissive() 在 preflight 时回显请求的 origin/method/headers，避免 "No 'Access-Control-Allow-Origin' header"
        _ => CorsLayer::very_permissive(),
    }
}
