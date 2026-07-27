//! Media Service facade — Image/Video → Object Storage → CDN (B-MEDIA-001 eng).
//!
//! Production path is R2-first (governance SSOT). Until Owner CF/R2 secrets land,
//! adapters may be local/dev stubs; **do not** treat Base64 / data URL as persistence truth.

use std::fmt;

/// Logical storage backend. Live cutover remains Owner-gated (`WAITING_OWNER_CF`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MediaStorageBackend {
    /// Local/dev object path (engineering only).
    LocalDev,
    /// Cloudflare R2 (S3-compatible) — production target.
    CloudflareR2,
}

impl fmt::Display for MediaStorageBackend {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::LocalDev => write!(f, "local_dev"),
            Self::CloudflareR2 => write!(f, "cloudflare_r2"),
        }
    }
}

/// Upload session metadata (multipart-capable).
#[derive(Clone, Debug)]
pub struct MediaUploadSession {
    pub asset_id: uuid::Uuid,
    pub object_key: String,
    pub backend: MediaStorageBackend,
    pub multipart_upload_id: Option<String>,
}

/// Resolves which backend is configured. Never claims CDN Acceptance PASS.
pub fn resolve_media_storage_backend() -> MediaStorageBackend {
    let r2_ready = std::env::var("TRAVELTRUST_R2_BUCKET").ok().as_deref().is_some_and(|s| !s.is_empty())
        && std::env::var("TRAVELTRUST_R2_ACCESS_KEY_ID")
            .ok()
            .as_deref()
            .is_some_and(|s| !s.is_empty());
    if r2_ready {
        MediaStorageBackend::CloudflareR2
    } else {
        MediaStorageBackend::LocalDev
    }
}

/// Build canonical object key: `{domain}/{owner_id}/{asset_id}/{filename}`.
pub fn build_object_key(domain: &str, owner_id: uuid::Uuid, asset_id: uuid::Uuid, filename: &str) -> String {
    let safe = filename
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>();
    format!("{domain}/{owner_id}/{asset_id}/{safe}")
}

/// Reject data-URL / Base64 as persistence truth (eng hard rule).
pub fn reject_inline_data_url(value: &str) -> Result<(), &'static str> {
    let v = value.trim();
    if v.starts_with("data:") {
        return Err("inline_data_url_forbidden_use_platform_media_asset_id");
    }
    if v.len() > 256 && !v.starts_with("http://") && !v.starts_with("https://") {
        // Heuristic: large non-URL blobs are not allowed as media SSOT.
        return Err("inline_blob_forbidden_use_platform_media_asset_id");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_data_url() {
        assert!(reject_inline_data_url("data:image/png;base64,AAAA").is_err());
        assert!(reject_inline_data_url("https://cdn.example/x.png").is_ok());
    }

    #[test]
    fn object_key_shape() {
        let oid = uuid::Uuid::nil();
        let aid = uuid::Uuid::nil();
        let k = build_object_key("itinerary", oid, aid, "cover.png");
        assert!(k.starts_with("itinerary/"));
        assert!(k.ends_with("/cover.png"));
    }
}
