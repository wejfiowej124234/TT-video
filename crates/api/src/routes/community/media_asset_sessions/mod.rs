//! 社区媒体资产：**S3 multipart** 会话（Phase1；与 **`docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md`** 对读）。

mod handlers;
mod multipart_audit_log;

pub(crate) use handlers::{
    get_community_media_asset_status, post_community_media_asset_session_complete,
    post_community_media_asset_session_create, post_community_media_asset_session_presign_parts,
};
pub(crate) use multipart_audit_log::log_community_media_capabilities_snapshot;