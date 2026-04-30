//! 用户头像：**S3 兼容**（AWS S3 / Cloudflare R2 等）预签名 **PUT**。
//!
//! 浏览器直传对象存储，API 仅签发 URL；`PUT /me` 的 `avatar_url` 存 **`PROFILE_AVATAR_PUBLIC_BASE_URL` + key**（或 CDN 同源前缀）。
//!
//! **运维（AVATAR-PRESIGN-ORPHAN-OPS）**：预签名成功但用户未调用 **commit** / **`PUT /me`** 时，桶内可能残留未写入 **`users.avatar_url`** 的对象；建议在 bucket 配置 **生命周期规则**（按对象前缀或 `AbortIncompleteMultipartUpload` 等）或离线对账清理，勿依赖 API 进程内状态。

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::Region;
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::Client;
use std::time::Duration;
use uuid::Uuid;

/// 有 **`DATABASE_URL`** 时默认禁止 Base64 落 **`data/profile_avatars`**（非 `cfg(test)`）；单机联调显式 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`**（truthy 同 `1|true|yes|on`）方可走本机路径。**勿**在生产与多副本环境开启。
#[inline]
pub fn allow_ephemeral_local_profile_avatar_upload() -> bool {
    std::env::var("TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR")
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            matches!(t.as_str(), "1" | "true" | "yes" | "on")
        })
        .unwrap_or(false)
}

/// 同时要求 bucket + 公网访问前缀，才视为已启用对象存储预签名。
pub fn avatar_object_storage_configured() -> bool {
    let bucket_ok = std::env::var("PROFILE_AVATAR_S3_BUCKET")
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    let public_ok = std::env::var("PROFILE_AVATAR_PUBLIC_BASE_URL")
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    bucket_ok && public_ok
}

fn public_avatar_base_url() -> Option<String> {
    let s = std::env::var("PROFILE_AVATAR_PUBLIC_BASE_URL").ok()?;
    let t = s.trim().trim_end_matches('/').to_string();
    if t.is_empty() {
        None
    } else {
        Some(t)
    }
}

/// 浏览器对预签名 URL **PUT** 成功后，将 presign 响应里的 **`avatar_url`** 提交入库前的校验（**`public_base`** 已规范化，无尾 `/`）。
pub(crate) fn validate_object_storage_avatar_url_for_commit_inner(
    avatar_url: &str,
    user_id: Uuid,
    public_base: &str,
) -> Result<(), &'static str> {
    let base = public_base.trim().trim_end_matches('/');
    if base.is_empty() {
        return Err("avatar_object_storage_not_configured");
    }
    let url = avatar_url.trim();
    if url.is_empty() {
        return Err("avatar_url_empty");
    }
    if url.contains("..") {
        return Err("avatar_url_invalid_path");
    }
    let expected_prefix = format!("{}/", base);
    if !url.starts_with(&expected_prefix) {
        return Err("avatar_url_public_base_mismatch");
    }
    let remainder = &url[expected_prefix.len()..];
    if remainder.is_empty() {
        return Err("avatar_url_invalid_path");
    }
    let uid = user_id.to_string();
    let owns = remainder
        .split('/')
        .filter(|p| !p.is_empty())
        .any(|p| p == uid.as_str());
    if !owns {
        return Err("avatar_url_not_owned_by_session_user");
    }
    let lower = remainder.to_ascii_lowercase();
    let ext_ok = lower.ends_with(".jpg")
        || lower.ends_with(".jpeg")
        || lower.ends_with(".png")
        || lower.ends_with(".webp");
    if !ext_ok {
        return Err("avatar_url_invalid_extension");
    }
    Ok(())
}

/// 必须在配置的公网前缀下，且路径中须出现当前用户 **`user_id`** 段（与 `presign_profile_avatar_put` 的 object key 布局一致）。
pub fn validate_object_storage_avatar_url_for_commit(
    avatar_url: &str,
    user_id: Uuid,
) -> Result<(), &'static str> {
    if !avatar_object_storage_configured() {
        return Err("avatar_object_storage_not_configured");
    }
    let Some(public_base) = public_avatar_base_url() else {
        return Err("avatar_object_storage_not_configured");
    };
    validate_object_storage_avatar_url_for_commit_inner(avatar_url, user_id, &public_base)
}

/// 本机头像直传 API 路径（与 `POST …/profile-avatar` + `serve_profile_avatar_upload` 同源）；**非**对象存储 SSOT。
#[inline]
fn is_ephemeral_profile_avatar_api_url(url: &str) -> bool {
    url.to_ascii_lowercase()
        .contains("/api/v1/uploads/profile-avatars/")
}

/// **`PUT /api/v1/me` `avatar_url`**：与 presign/commit 对齐，禁止在「未显式允许本机路径」时把库指向 Pod 内 ephemeral 文件。
///
/// - 已配置对象存储：非空 URL 必须满足 [`validate_object_storage_avatar_url_for_commit`]。
/// - 未配置对象存储：若 URL 指向本机上传 API 路径，须 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR`** 为 truthy，否则拒绝（防 P0：库有 URL、多副本无文件）。
pub fn validate_me_profile_avatar_url_for_write(
    avatar_url: Option<&str>,
    user_id: Uuid,
) -> Result<(), &'static str> {
    let Some(raw) = avatar_url else {
        return Ok(());
    };
    let url = raw.trim();
    if url.is_empty() {
        return Ok(());
    }
    if avatar_object_storage_configured() {
        return validate_object_storage_avatar_url_for_commit(url, user_id);
    }
    if is_ephemeral_profile_avatar_api_url(url) && !allow_ephemeral_local_profile_avatar_upload() {
        return Err("avatar_ephemeral_upload_url_forbidden");
    }
    Ok(())
}

#[cfg(test)]
mod validate_me_put_tests {
    use super::{
        allow_ephemeral_local_profile_avatar_upload, validate_me_profile_avatar_url_for_write,
    };
    use uuid::Uuid;

    #[test]
    fn put_me_rejects_ephemeral_api_url_when_local_upload_not_allowed() {
        if allow_ephemeral_local_profile_avatar_upload() {
            return;
        }
        let uid = Uuid::parse_str("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee").unwrap();
        let r = validate_me_profile_avatar_url_for_write(
            Some("/api/v1/uploads/profile-avatars/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg"),
            uid,
        );
        assert_eq!(r, Err("avatar_ephemeral_upload_url_forbidden"));
    }

    #[test]
    fn put_me_accepts_https_when_not_ephemeral_path() {
        let uid = Uuid::nil();
        assert!(validate_me_profile_avatar_url_for_write(
            Some("https://cdn.example.com/avatars/x.png"),
            uid
        )
        .is_ok());
    }
}

#[cfg(test)]
mod validate_commit_tests {
    use super::validate_object_storage_avatar_url_for_commit_inner;
    use uuid::Uuid;

    #[test]
    fn commit_url_accepts_key_with_user_segment() {
        let uid = Uuid::parse_str("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee").unwrap();
        let base = "https://cdn.example.com";
        let url = "https://cdn.example.com/profile-avatars/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/550e8400-e29b-41d4-a716-446655440000.jpg";
        assert!(validate_object_storage_avatar_url_for_commit_inner(url, uid, base).is_ok());
    }

    #[test]
    fn commit_url_rejects_other_user_segment() {
        let uid = Uuid::parse_str("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee").unwrap();
        let base = "https://cdn.example.com";
        let url = "https://cdn.example.com/profile-avatars/bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee/550e8400-e29b-41d4-a716-446655440000.jpg";
        assert_eq!(
            validate_object_storage_avatar_url_for_commit_inner(url, uid, base),
            Err("avatar_url_not_owned_by_session_user")
        );
    }
}

fn truthy_env(name: &str) -> bool {
    std::env::var(name)
        .map(|s| {
            matches!(
                s.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

fn ext_for_content_type(ct: &str) -> Result<&'static str, ()> {
    match ct.trim().to_ascii_lowercase().as_str() {
        "image/jpeg" | "image/jpg" => Ok(".jpg"),
        "image/png" => Ok(".png"),
        "image/webp" => Ok(".webp"),
        _ => Err(()),
    }
}

pub struct ProfileAvatarPresignOutput {
    pub upload_url: String,
    pub avatar_url: String,
    /// S3 **object key**（与 `avatar_url` 路径段一致；供 `profile_avatar_presign_pending` 审计落库）。
    pub object_key: String,
    pub headers: Vec<(String, String)>,
    pub expires_in_seconds: u64,
}

/// `content_length` 必须与浏览器 **PUT**  body 字节数一致（已签入 SigV4）。
pub async fn presign_profile_avatar_put(
    user_id: Uuid,
    content_type: &str,
    content_length: u64,
) -> Result<ProfileAvatarPresignOutput, String> {
    const MAX_BYTES: u64 = 512 * 1024;
    if content_length == 0 || content_length > MAX_BYTES {
        return Err("invalid_content_length".into());
    }
    let ext = ext_for_content_type(content_type).map_err(|_| "invalid_content_type".to_string())?;

    let bucket = std::env::var("PROFILE_AVATAR_S3_BUCKET")
        .unwrap_or_default()
        .trim()
        .to_string();
    if bucket.is_empty() {
        return Err("not_configured".into());
    }
    let public_base = std::env::var("PROFILE_AVATAR_PUBLIC_BASE_URL")
        .unwrap_or_default()
        .trim_end_matches('/')
        .to_string();
    if public_base.is_empty() {
        return Err("not_configured".into());
    }

    let prefix = std::env::var("PROFILE_AVATAR_S3_KEY_PREFIX")
        .unwrap_or_else(|_| "profile-avatars".into())
        .trim_matches('/')
        .to_string();
    let key = format!("{}/{}/{}{}", prefix, user_id, Uuid::new_v4(), ext);

    let ttl: u64 = std::env::var("PROFILE_AVATAR_PRESIGN_TTL_SEC")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| (60..=3600).contains(&n))
        .unwrap_or(900);

    let mut loader = aws_config::defaults(BehaviorVersion::latest());
    if let Ok(endpoint) = std::env::var("PROFILE_AVATAR_S3_ENDPOINT") {
        let e = endpoint.trim().to_string();
        if !e.is_empty() {
            loader = loader.endpoint_url(e);
        }
    }
    let region = std::env::var("PROFILE_AVATAR_S3_REGION").unwrap_or_else(|_| "us-east-1".into());
    loader = loader.region(Region::new(region.trim().to_string()));
    let shared = loader.load().await;

    let mut b = aws_sdk_s3::config::Builder::from(&shared);
    if truthy_env("PROFILE_AVATAR_S3_FORCE_PATH_STYLE") {
        b = b.force_path_style(true);
    }
    let client = Client::from_conf(b.build());

    let presigning_config = PresigningConfig::expires_in(Duration::from_secs(ttl))
        .map_err(|e| format!("presign_config:{e}"))?;

    let presigned = client
        .put_object()
        .bucket(&bucket)
        .key(&key)
        .content_type(content_type)
        .content_length(content_length as i64)
        .presigned(presigning_config)
        .await
        .map_err(|e| format!("presign_put:{e}"))?;

    let upload_url = presigned.uri().to_string();
    let mut headers: Vec<(String, String)> = Vec::new();
    for (k, v) in presigned.headers() {
        headers.push((k.to_string(), v.to_string()));
    }
    let avatar_url = format!("{}/{}", public_base, key);
    Ok(ProfileAvatarPresignOutput {
        upload_url,
        avatar_url,
        object_key: key,
        headers,
        expires_in_seconds: ttl,
    })
}
