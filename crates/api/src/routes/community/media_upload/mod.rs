//! **社区发帖媒体**：`POST /api/v1/community/posts/upload-media` 写 **`data/community_post_media/`**；
//! **`GET /api/v1/uploads/community-posts/:name`** 匿名可读（文件名含 **UUID**，与 **guides** `upload-doc` 同形）。
//!
//! **体限**：与全局 **`REQUEST_BODY_LIMIT_BYTES`**（**1MiB**）对齐；解码后默认 **≤512KiB**，可由 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES`** 调至 **≤980000**（为 JSON 包装留余量）；**JPG/PNG/WebP** 魔数校验；**MP4/WebM** **须** multipart 对象存储，**不**再经本接口 Base64 落盘。
//!
//! **视频时长**：**`.mp4`** 解析 **`moov/mvhd`**；**`.webm`** 解析 **EBML `Segment` → `Info`** 下的 **`TimestampScale`**（`0x2AD7B1`）与 **`Duration`**（`0x4489`，float），秒数 = **`Duration * TimestampScale / 1e9`**（缺 **`TimestampScale`** 时按 **`Duration` 为秒** 的 Matroska 语义回退）。**不**支持 **unknown-length** EBML 体（遇则 **`video_metadata_unreadable`**）。默认上限 **180s**，与前端 **`getCommunityPostMediaMaxVideoDurationSec()`** 对齐，可由 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_MAX_VIDEO_DURATION_SEC`** 覆盖。
//!
//! TT-MOD：原 **`media_upload.rs` ~678** → **`limits` / `mp4` / `webm` / `payload/`**（**`video`/`parse`/`filename`/`duration_tests`** **v1.69**）/**`handlers`**（**48 STRICT ≤400**）。

mod handlers;
mod limits;
mod mp4;
mod payload;
mod webm;

pub use handlers::{get_serve_community_post_media, post_community_post_media_upload};
#[allow(unused_imports)]
// `community/tests.rs` uses `super::super::media_upload::CommunityPostMediaUploadBody`
pub use limits::CommunityPostMediaUploadBody;
#[allow(unused_imports)]
pub use limits::{max_decoded_bytes, max_video_duration_sec, COMMUNITY_PRODUCT_VIDEO_MAX_SEC};
