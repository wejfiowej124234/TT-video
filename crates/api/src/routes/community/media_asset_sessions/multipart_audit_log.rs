//! 社区视频 **S3 multipart** 链路的可选 **stderr** 审计行（与 **`middleware/trace.rs`** 的 **`x-request-id`** 对拍）。
//!
//! **稳定聚合标记**（grep / 日志平台）：`tt_community_multipart_chain=release_multipart_chain_v1`  
//! **启用**：进程环境 **`TT_COMMUNITY_MULTIPART_LOG=1`**（或 **`true`** / **`yes`**，大小写不敏感）。默认关闭，避免本地/低噪声环境刷屏。**`GET /health`** 在 **`phase=health_community_public_video_spec`** 写一行（与 **`capabilities`** 同源 **HeadBucket** 闸；**`probe_impl` / `cache_hit`** 与 **`capabilities_snapshot`** 对拍）。**`GET …/media-assets/:id`** 成功时 **`phase=asset_status_snapshot`**；**429** 上传限流时 **`phase=rate_limit_exceeded`**（与 **`log_multipart_error`** 同形）。
//!
//! **同一套代码**在 ① 本地 / ② 测试网 / ③ 生产二进制中行为一致；**不**记录密钥、预签 URL 全文、ETag 体或完整 `playback_url`（仅长度等非敏感指标）。**`asset_id=-`** 表示尚未分配会话 id 的门禁类失败。

use axum::http::HeaderMap;
use uuid::Uuid;

/// 与 runbook / 运维检索同源；勿改字符串以免破坏已配置的 log filter。
pub(crate) const TT_COMMUNITY_MULTIPART_CHAIN_MARKER: &str =
    "tt_community_multipart_chain=release_multipart_chain_v1";

fn audit_enabled() -> bool {
    std::env::var("TT_COMMUNITY_MULTIPART_LOG")
        .ok()
        .as_deref()
        .map(|s| {
            let t = s.trim();
            t.eq_ignore_ascii_case("1")
                || t.eq_ignore_ascii_case("true")
                || t.eq_ignore_ascii_case("yes")
        })
        .unwrap_or(false)
}

fn request_id_for_log(headers: &HeaderMap) -> &str {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("-")
}

fn truncate_detail(s: &str, max_chars: usize) -> String {
    let n = s.chars().count();
    if n <= max_chars {
        s.to_string()
    } else {
        format!(
            "{}…(trunc)",
            s.chars()
                .take(max_chars.saturating_sub(8))
                .collect::<String>()
        )
    }
}

/// 成功阶段：`phase` 为稳定短名（如 `session_create_ok`）；`detail` 须无密钥、无 URL 全文。
pub(crate) fn log_multipart_phase(
    headers: &HeaderMap,
    phase: &'static str,
    asset_id: Uuid,
    detail: &str,
) {
    if !audit_enabled() {
        return;
    };    let rid = request_id_for_log(headers);
    eprintln!(
        "[{}] x-request-id={} phase={} asset_id={} {}",
        TT_COMMUNITY_MULTIPART_CHAIN_MARKER,
        rid,
        phase,
        asset_id,
        truncate_detail(detail, 512)
    );
}

/// 失败阶段：仅记录 **`error_code`** 与截断后的 **`message`**（便于 ② 对拍，不泄全长云厂商原文）。  
/// **`asset_id=None`**：尚未分配 **`asset_id`** 的门禁类失败（如对象存储未配置）。
pub(crate) fn log_multipart_error(
    headers: &HeaderMap,
    phase: &'static str,
    asset_id: Option<Uuid>,
    error_code: &'static str,
    message: &str,
) {
    if !audit_enabled() {
        return;
    };    let rid = request_id_for_log(headers);
    let aid = asset_id
        .map(|u| u.to_string())
        .unwrap_or_else(|| "-".to_string());
    eprintln!(
        "[{}] x-request-id={} phase={} asset_id={} error_code={} message={}",
        TT_COMMUNITY_MULTIPART_CHAIN_MARKER,
        rid,
        phase,
        aid,
        error_code,
        truncate_detail(message, 400)
    );
}

/// **`GET …/media/capabilities`** 响应面快照（无用户 id、无桶密钥）；**`public_video_publish_error_key`** 为错误键或云短码截断。
pub(crate) fn log_community_media_capabilities_snapshot(
    headers: &HeaderMap,
    api_status: &str,
    multipart_enabled: bool,
    public_video_publish_ready: bool,
    public_video_spec_required: bool,
    max_video_seconds: u64,
    max_video_bytes: u64,
    public_video_publish_error: Option<&str>,
    head_bucket_probe_impl: &str,
    head_bucket_cache_hit: bool,
) {
    if !audit_enabled() {
        return;
    };    let rid = request_id_for_log(headers);
    let ek = public_video_publish_error.unwrap_or("-");
    let hit = if head_bucket_cache_hit { "1" } else { "0" };
    eprintln!(
        "[{}] x-request-id={} phase=capabilities_snapshot api_status={} multipart_enabled={} public_video_publish_ready={} public_video_spec_required={} max_video_seconds={} max_video_bytes={} public_video_publish_error_key={} probe_impl={} cache_hit={}",
        TT_COMMUNITY_MULTIPART_CHAIN_MARKER,
        rid,
        api_status,
        multipart_enabled,
        public_video_publish_ready,
        public_video_spec_required,
        max_video_seconds,
        max_video_bytes,
        truncate_detail(ek, 160),
        truncate_detail(head_bucket_probe_impl, 64),
        hit,
    );
}

/// **`GET …/media-assets/:asset_id`** 成功响应面快照（**`state` / `byte_length` / `playback_url` 长度**；**不**写 URL 全文、**不**写 **`object_key`**）。
pub(crate) fn log_media_asset_status_snapshot(
    headers: &HeaderMap,
    asset_id: Uuid,
    state: &str,
    byte_length: i64,
    playback_url_len: u32,
) {
    if !audit_enabled() {
        return;
    };    let rid = request_id_for_log(headers);
    eprintln!(
        "[{}] x-request-id={} phase=asset_status_snapshot asset_id={} state={} byte_length={} playback_url_len={}",
        TT_COMMUNITY_MULTIPART_CHAIN_MARKER,
        rid,
        asset_id,
        truncate_detail(state, 64),
        byte_length,
        playback_url_len,
    );
}

/// **`GET /health`** 上 **`TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED`** 闸与 **HeadBucket** 探测结果（与 **`GET …/media/capabilities`** **`public_video_publish_ready`** 同源缓存探测；无桶名密钥）。
pub(crate) fn log_health_community_public_video_spec(
    headers: &HeaderMap,
    community_public_video_spec_required: bool,
    multipart_enabled: bool,
    head_probe_summary: &str,
    http_status: u16,
    head_bucket_probe_impl: &str,
    head_bucket_cache_hit: Option<bool>,
) {
    if !audit_enabled() {
        return;
    };    let rid = request_id_for_log(headers);
    let hit = match head_bucket_cache_hit {
        None => "-",
        Some(true) => "1",
        Some(false) => "0",
    };
    eprintln!(
        "[{}] x-request-id={} phase=health_community_public_video_spec spec_required={} multipart_enabled={} head_probe={} http_status={} probe_impl={} cache_hit={}",
        TT_COMMUNITY_MULTIPART_CHAIN_MARKER,
        rid,
        community_public_video_spec_required,
        multipart_enabled,
        truncate_detail(head_probe_summary, 200),
        http_status,
        truncate_detail(head_bucket_probe_impl, 64),
        hit,
    );
}
