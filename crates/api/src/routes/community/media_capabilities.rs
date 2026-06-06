//! **`GET /api/v1/community/media/capabilities`**：社区视频上传能力（multipart / 桶可达 / 上限），供 **`PublishDrawer`** 与后端真实配置对齐（勿仅靠 **`NEXT_PUBLIC_*`**）。

use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use serde_json::json;

use super::media_asset_sessions::log_community_media_capabilities_snapshot;
use crate::state::ApiMetaState;
use crate::storage::community_media_s3::{
    community_media_object_storage_configured, community_public_video_spec_required,
    max_asset_bytes, probe_community_media_s3_head_bucket_cached,
    COMMUNITY_MEDIA_S3_HEAD_BUCKET_PROBE_LOG_ID,
};

const COMMUNITY_PRODUCT_VIDEO_MAX_SEC: u64 = 180;
const DEFAULT_MAX_DECODED_BYTES: usize = 512 * 1024;
const ENV_MAX_DECODED_CAP: usize = 980_000;
const DEFAULT_MAX_VIDEO_DURATION_SEC: u64 = 180;
const ENV_MAX_VIDEO_DURATION_CAP_SEC: u64 = 3600;

fn max_decoded_bytes() -> usize {
    std::env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES")
        .ok()
        .and_then(|s| s.trim().parse::<usize>().ok())
        .map(|n| n.clamp(1024, ENV_MAX_DECODED_CAP))
        .unwrap_or(DEFAULT_MAX_DECODED_BYTES)
}

fn max_video_duration_sec() -> u64 {
    std::env::var("TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC")
        .ok()
        .and_then(|s| s.trim().parse::<u64>().ok())
        .map(|n| n.clamp(1, ENV_MAX_VIDEO_DURATION_CAP_SEC))
        .unwrap_or(DEFAULT_MAX_VIDEO_DURATION_SEC)
}

/// 公开读：不校验登录；**`multipart_enabled`**=环境变量位；**`public_video_publish_ready`**=位真且 **HeadBucket** 成功（与 **`GET /health`** 严格闸同源探测）。JSON 含 **`public_video_spec_required` / `head_bucket_probe_impl` / `head_bucket_cache_hit`** 与 **`TT_COMMUNITY_MULTIPART_LOG`** 下 **`capabilities_snapshot`**  stderr 字段对拍。
pub async fn get_community_media_capabilities(
    headers: HeaderMap,
    _state: State<ApiMetaState>,
) -> Json<serde_json::Value> {
    let multipart_enabled = community_media_object_storage_configured();
    let public_video_spec_required = community_public_video_spec_required();
    let (probe, head_bucket_cache_hit) = probe_community_media_s3_head_bucket_cached().await;
    let public_video_publish_ready = multipart_enabled && probe.is_ok();
    let public_video_publish_error: Option<String> = if public_video_publish_ready {
        None
    } else if !multipart_enabled {
        Some("community_media_object_storage_not_configured".into())
    } else {
        Some(match &probe {
            Err(e) => e.clone(),
            Ok(()) => "community_media_s3_probe_inconsistent".into(),
        })
    };

    let max_video_seconds: u64 = if public_video_publish_ready {
        std::cmp::min(max_video_duration_sec(), COMMUNITY_PRODUCT_VIDEO_MAX_SEC)
    } else {
        0
    };
    let max_video_bytes: u64 = if public_video_publish_ready {
        max_asset_bytes().max(0) as u64
    } else {
        max_decoded_bytes() as u64
    };
    let status = if multipart_enabled && !public_video_publish_ready {
        "degraded"
    } else {
        "ok"
    };

    log_community_media_capabilities_snapshot(
        &headers,
        status,
        multipart_enabled,
        public_video_publish_ready,
        public_video_spec_required,
        max_video_seconds,
        max_video_bytes,
        public_video_publish_error.as_deref(),
        COMMUNITY_MEDIA_S3_HEAD_BUCKET_PROBE_LOG_ID,
        head_bucket_cache_hit,
    );

    Json(json!({
        "status": status,
        "multipart_enabled": multipart_enabled,
        "public_video_publish_ready": public_video_publish_ready,
        "public_video_spec_required": public_video_spec_required,
        "head_bucket_probe_impl": COMMUNITY_MEDIA_S3_HEAD_BUCKET_PROBE_LOG_ID,
        "head_bucket_cache_hit": head_bucket_cache_hit,
        "public_video_publish_error": public_video_publish_error,
        "max_video_seconds": max_video_seconds,
        "max_video_bytes": max_video_bytes,
        "supported_content_types": ["video/mp4", "video/webm"],
    }))
}
