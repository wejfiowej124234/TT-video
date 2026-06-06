//! 上传体解析、视频时长闸与文件名白名单（**`handlers.rs`** 消费；**04** / **50-O-31** 同源）。
//! TT-MOD：**`payload.rs`** → **`video`/`parse`/`filename`** + **`duration_tests`**（**48 STRICT ≤400**；**v1.69**）。

#[cfg(test)]
mod duration_tests;
mod filename;
mod parse;
mod video;

pub(crate) use filename::community_post_media_upload_filename_allowed;
pub(crate) use parse::parse_upload_payload;
