//! 社区 / 自由市场 **`payload`** 内嵌 **`http(s):`** URL 护栏（与 **`frontend/lib/communityPostMediaEmbeddedUrlPolicy.ts`** 同源）。

use std::env;

use serde_json::Value;

fn env_truthy_for_media_urls(name: &str) -> bool {
    match env::var(name).as_deref() {
        Ok(v) => {
            let t = v.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes" || t == "on"
        }
        _ => false,
    }
}

fn community_post_media_url_prefixes() -> Vec<String> {
    env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES")
        .map(|raw| {
            raw.split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

fn is_loopback_http_url(s: &str) -> bool {
    let lower = s.trim().to_ascii_lowercase();
    lower.starts_with("http://127.0.0.1") || lower.starts_with("http://localhost")
}

fn validate_single_embedded_url_string(s: &str) -> Result<(), &'static str> {
    let t = s.trim();
    if t.is_empty() {
        return Ok(());
    }
    let is_http = t.len() >= 7 && t[..7].eq_ignore_ascii_case("http://");
    let is_https = t.len() >= 8 && t[..8].eq_ignore_ascii_case("https://");
    if !is_http && !is_https {
        return Ok(());
    }
    if env_truthy_for_media_urls("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS") && is_http {
        // ① 本地 MinIO / loopback playback（PI-1 · TD-3）— 仍受 prefix 列表约束（若配置）
        if !is_loopback_http_url(t) {
            return Err("media_url_invalid_scheme");
        }
    }
    let prefixes = community_post_media_url_prefixes();
    if prefixes.is_empty() {
        return Ok(());
    }
    if prefixes.iter().any(|p| t.starts_with(p)) {
        Ok(())
    } else {
        Err("media_url_prefix_not_allowed")
    }
}

fn key_suggests_embedded_url(key: &str) -> bool {
    let k = key.to_ascii_lowercase();
    k == "url" || k == "src" || k == "href" || k == "thumbnail" || k.ends_with("_url") || k == "media_urls"
}

fn walk_embedded_http_urls(v: &Value) -> Result<(), &'static str> {
    match v {
        Value::Object(map) => {
            for (key, val) in map {
                if key_suggests_embedded_url(key) {
                    match val {
                        Value::String(s) => validate_single_embedded_url_string(s)?,
                        Value::Array(arr) => {
                            for item in arr {
                                if let Value::String(s) = item {
                                    validate_single_embedded_url_string(s)?;
                                }
                            }
                        }
                        _ => {}
                    }
                }
                walk_embedded_http_urls(val)?;
            }
            Ok(())
        }
        Value::Array(arr) => {
            for item in arr {
                walk_embedded_http_urls(item)?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

/// **`market_subsite`** / **`POST …/community/posts`** 共用：遍历 **`payload`** 对象树中的 URL 字段。
pub(crate) fn validate_market_listing_payload_embedded_http_urls(
    payload: &Value,
) -> Result<(), &'static str> {
    walk_embedded_http_urls(payload)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn allows_relative_and_non_http_strings() {
        assert!(validate_market_listing_payload_embedded_http_urls(&json!({
            "title": "x",
            "thumbnail": "/api/v1/uploads/foo.jpg"
        }))
        .is_ok());
    }

    #[test]
    fn blocks_http_when_production_safe_defaults() {
        std::env::set_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "1");
        let err = validate_market_listing_payload_embedded_http_urls(&json!({
            "cover_url": "http://evil.example/x"
        }))
        .unwrap_err();
        assert_eq!(err, "media_url_invalid_scheme");
        std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    }

    #[test]
    fn allows_http_loopback_when_production_safe_defaults() {
        std::env::set_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS", "1");
        assert!(validate_market_listing_payload_embedded_http_urls(&json!({
            "media_urls": ["http://127.0.0.1:19000/traveltrust-community-media/x.mp4"]
        }))
        .is_ok());
        std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    }
}
