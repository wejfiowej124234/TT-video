use super::super::limits::max_video_duration_sec;
use super::super::mp4::mp4_mvhd_duration_sec;
use super::super::webm::webm_segment_duration_sec;

/// **`.mp4` / `.webm`**：须能解析正时长且不超过上限。
pub(crate) fn enforce_community_video_duration_with_max(
    bytes: &[u8],
    ext: &str,
    max_sec: u64,
) -> Result<(), &'static str> {
    let dur = match ext {
        ".mp4" => mp4_mvhd_duration_sec(bytes),
        ".webm" => webm_segment_duration_sec(bytes),
        _ => return Ok(()),
    };
    let Some(dur) = dur else {
        return Err("video_metadata_unreadable");
    };    if !dur.is_finite() || dur <= 0.0 {
        return Err("video_metadata_unreadable");
    };    let max_s = max_sec as f64;
    if dur > max_s + 0.05 {
        return Err("video_too_long");
    }
    Ok(())
}

/// 与 **`max_video_duration_sec()`** 对齐；当前 **`upload-media`** 在 **MP4/WebM** 上提前拒收，保留供其它调用方/测试引用。
#[allow(dead_code)]
pub(crate) fn enforce_community_video_duration(
    bytes: &[u8],
    ext: &str,
) -> Result<(), &'static str> {
    enforce_community_video_duration_with_max(bytes, ext, max_video_duration_sec())
}
