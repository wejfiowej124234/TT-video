use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CommunityPostMediaUploadBody {
    pub content_base64: String,
}

/// 默认解码上限；可调但须低于全站 JSON 体 **`REQUEST_BODY_LIMIT_BYTES`**（**1MiB**）留出 **`content_base64` 包装**。
const DEFAULT_MAX_DECODED_BYTES: usize = 512 * 1024;
/// 环境变量上调时的硬顶（字节），避免误配突破 Axum 全局体限。
const ENV_MAX_DECODED_CAP: usize = 980_000;

pub fn max_decoded_bytes() -> usize {
    std::env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES")
        .ok()
        .and_then(|s| s.trim().parse::<usize>().ok())
        .map(|n| n.clamp(1024, ENV_MAX_DECODED_CAP))
        .unwrap_or(DEFAULT_MAX_DECODED_BYTES)
}

/// 产品「正常社区视频」时长上限（秒）；**`GET …/media/capabilities`** 在对象存储就绪时对 **`max_video_seconds`** 与 **`max_video_duration_sec()`** 取 **min** 暴露给前端。
pub const COMMUNITY_PRODUCT_VIDEO_MAX_SEC: u64 = 180;

/// 默认与前端 **`getCommunityPostMediaMaxVideoDurationSec()`**（**`NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC`**，缺省 **180**）对齐。
const DEFAULT_MAX_VIDEO_DURATION_SEC: u64 = 180;
/// 硬顶防误配（秒）。
const ENV_MAX_VIDEO_DURATION_CAP_SEC: u64 = 3600;

pub fn max_video_duration_sec() -> u64 {
    std::env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC")
        .ok()
        .and_then(|s| s.trim().parse::<u64>().ok())
        .map(|n| n.clamp(1, ENV_MAX_VIDEO_DURATION_CAP_SEC))
        .unwrap_or(DEFAULT_MAX_VIDEO_DURATION_SEC)
}
