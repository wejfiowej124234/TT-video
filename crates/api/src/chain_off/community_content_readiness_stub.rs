//! Community content readiness · passthrough (Escrow bilateral closure isolation).

pub fn filter_feed_posts_content_readiness(
    posts: Vec<serde_json::Value>,
) -> Vec<serde_json::Value> {
    posts
}

pub fn public_post_json_for_content_readiness(
    post: serde_json::Value,
    _viewer_is_author: bool,
) -> Option<serde_json::Value> {
    Some(post)
}
