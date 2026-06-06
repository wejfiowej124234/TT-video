//! 社区公众 Feed 读面过滤（与 [`market_public_surface`] 同源 env 闸）。

use super::market_public_surface::{
    is_dev_catalog_email, public_catalog_surface_filter_enabled,
};

/// 是否对 **`GET …/community/feed`** 等公众读面仅返回 **`data_origin = 'production'`**。
pub fn public_community_feed_filter_enabled() -> bool {
    public_catalog_surface_filter_enabled()
}

/// E2E / PI-1 / MinIO 浏览器验收等自动化正文前缀（勿用纯数字误判真实 UGC 短文案）。
pub fn is_automation_community_post_body(body: &str) -> bool {
    let b = body.trim();
    b.starts_with("e2e-") || b.starts_with("pi1-fe-") || b.starts_with("browser-minio-")
}

/// 写入 **`community_posts.data_origin`** 时的分类。
pub fn infer_community_post_data_origin(email: &str, body: &str, nickname: Option<&str>) -> &'static str {
    if is_dev_catalog_email(email) {
        return "test";
    }
    if is_automation_community_post_body(body) {
        return "test";
    }
    if let Some(n) = nickname.map(str::trim).filter(|s| !s.is_empty()) {
        if n == "E2E Narrow" || n.contains("测试游客") {
            return "test";
        }
    }
    "production"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn automation_body_prefixes_are_test() {
        assert!(is_automation_community_post_body("e2e-comment-flow-1"));
        assert!(is_automation_community_post_body("pi1-fe-text-123"));
        assert!(is_automation_community_post_body("browser-minio-multipart-9"));
        assert!(!is_automation_community_post_body("清晨的祇园石板路几乎没人"));
        assert!(!is_automation_community_post_body("11"));
    }

    #[test]
    fn seed_email_is_test_origin() {
        assert_eq!(
            infer_community_post_data_origin("tourist@test.com", "hello", None),
            "test"
        );
        assert_eq!(
            infer_community_post_data_origin(
                "market-showcase-beijing@example.com",
                "京都赏樱三日",
                Some("Aurora")
            ),
            "production"
        );
    }
}
