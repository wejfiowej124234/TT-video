//! 社区媒体（视频 Phase1）：S3 兼容 **CreateMultipartUpload** / **UploadPart 预签名** / **CompleteMultipartUpload**。
//!
//! 配置与运维见 **`docs/runbook/COMMUNITY-MEDIA-OBJECT-STORAGE.md`**（孤儿 multipart、CORS、生命周期）。

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::Region;
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::types::{CompletedMultipartUpload, CompletedPart};
use aws_sdk_s3::Client;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use uuid::Uuid;

#[inline]
fn truthy_env(name: &str) -> bool {
    std::env::var(name)
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            matches!(t.as_str(), "1" | "true" | "yes" | "on")
        })
        .unwrap_or(false)
}

/// 与头像分桶：**`COMMUNITY_MEDIA_S3_BUCKET`** + **`COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** 同时非空视为启用。
pub fn community_media_object_storage_configured() -> bool {
    let bucket_ok = std::env::var("COMMUNITY_MEDIA_S3_BUCKET")
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    let public_ok = std::env::var("COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL")
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    bucket_ok && public_ok
}

pub fn public_community_media_base_url() -> Option<String> {
    let s = std::env::var("COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL").ok()?;
    let t = s.trim().trim_end_matches('/').to_string();
    if t.is_empty() {
        None
    } else {
        Some(t)
    }
}

fn bucket() -> Result<String, String> {
    let b = std::env::var("COMMUNITY_MEDIA_S3_BUCKET").unwrap_or_default();
    let t = b.trim().to_string();
    if t.is_empty() {
        Err("community_media_object_storage_not_configured".into())
    } else {
        Ok(t)
    }
}

fn key_prefix() -> String {
    std::env::var("COMMUNITY_MEDIA_S3_KEY_PREFIX")
        .unwrap_or_else(|_| "community-media/v1".into())
        .trim_matches('/')
        .to_string()
}

/// 单对象上限（字节）；默认 **500MiB**；可经 **`TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES`** 调整（**5MiB～1GiB** 钳位）。
pub fn max_asset_bytes() -> i64 {
    const DEF: i64 = 500 * 1024 * 1024;
    const FLOOR: i64 = 5 * 1024 * 1024;
    const CAP: i64 = 1024 * 1024 * 1024;
    std::env::var("TRAVELTRUST_COMMUNITY_MEDIA_ASSET_MAX_BYTES")
        .ok()
        .and_then(|s| s.trim().parse::<i64>().ok())
        .map(|n| n.clamp(FLOOR, CAP))
        .unwrap_or(DEF)
}

/// 默认分片大小 **8MiB**（须 **≥5MiB** 以满足 S3 除末片外的最小片）；可调 **`TRAVELTRUST_COMMUNITY_MEDIA_PART_SIZE_BYTES`**。
pub fn default_part_size_bytes() -> i64 {
    const DEF: i64 = 8 * 1024 * 1024;
    std::env::var("TRAVELTRUST_COMMUNITY_MEDIA_PART_SIZE_BYTES")
        .ok()
        .and_then(|s| s.trim().parse::<i64>().ok())
        .map(|n| n.clamp(5 * 1024 * 1024, 100 * 1024 * 1024))
        .unwrap_or(DEF)
}

fn presign_ttl_sec() -> u64 {
    std::env::var("COMMUNITY_MEDIA_PRESIGN_TTL_SEC")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| (60..=3600).contains(&n))
        .unwrap_or(900)
}

/// 与 **`TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED`** 同源：为 **1/true** 时 **`GET /health`** 在对象存储未就绪时返回 **503**（本地默认不设，免挡 **`wait-for-api`**）。
pub fn community_public_video_spec_required() -> bool {
    truthy_env("TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED")
}

/// 进程内短 TTL 缓存，避免 **`GET …/media/capabilities`** 高频打桶。
static HEAD_BUCKET_PROBE_CACHE: OnceLock<Mutex<Option<(Instant, Result<(), String>)>>> =
    OnceLock::new();

fn head_bucket_probe_cache() -> &'static Mutex<Option<(Instant, Result<(), String>)>> {
    HEAD_BUCKET_PROBE_CACHE.get_or_init(|| Mutex::new(None))
}

fn clone_probe(r: &Result<(), String>) -> Result<(), String> {
    r.as_ref().map(|_| ()).map_err(|e| e.clone())
}

/// **`HeadBucket`**：验证凭据/endpoint/桶名（**不**替代浏览器侧 CORS 验收；CORS 见 Runbook）。
pub async fn probe_community_media_s3_head_bucket() -> Result<(), String> {
    if !community_media_object_storage_configured() {
        return Err("community_media_object_storage_not_configured".into());
    };    let client = build_client().await?;
    let b = bucket()?;
    client
        .head_bucket()
        .bucket(&b)
        .send()
        .await
        .map_err(|e| format!("head_bucket:{e}"))?;
    Ok(())
}

/// 日志 / 运维 grep 用稳定 id（与 TTL 语义绑定；**勿**随意改名以免破坏已配置 filter）。
pub const COMMUNITY_MEDIA_S3_HEAD_BUCKET_PROBE_LOG_ID: &str = "head_bucket_cached_ttl15s_v1";

/// 默认 **15s** TTL；与 **`GET /health`**（严格规格闸）及 **`GET …/media/capabilities`** 共用。
///
/// 返回 **`(probe_result, cache_hit)`**：**`cache_hit=true`** 表示本次未发起新 **HeadBucket**（读进程内缓存）。
pub async fn probe_community_media_s3_head_bucket_cached() -> (Result<(), String>, bool) {
    const TTL: Duration = Duration::from_secs(15);
    let now = Instant::now();
    {
        let guard = head_bucket_probe_cache()
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        if let Some((t, res)) = guard.as_ref() {
            if now.duration_since(*t) < TTL {
                return (clone_probe(res), true);
            }
        }
    };    let fresh = probe_community_media_s3_head_bucket().await;
    let mut guard = head_bucket_probe_cache()
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    *guard = Some((Instant::now(), fresh.clone()));
    (fresh, false)
}

pub async fn build_client() -> Result<Client, String> {
    let mut loader = aws_config::defaults(BehaviorVersion::latest());
    if let Ok(endpoint) = std::env::var("COMMUNITY_MEDIA_S3_ENDPOINT") {
        let e = endpoint.trim().to_string();
        if !e.is_empty() {
            loader = loader.endpoint_url(e);
        }
    };    let region = std::env::var("COMMUNITY_MEDIA_S3_REGION").unwrap_or_else(|_| "us-east-1".into());
    loader = loader.region(Region::new(region.trim().to_string()));
    let shared = loader.load().await;
    let mut b = aws_sdk_s3::config::Builder::from(&shared);
    if truthy_env("COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE") {
        b = b.force_path_style(true);
    }
    Ok(Client::from_conf(b.build()))
}

pub fn ext_for_video_content_type(ct: &str) -> Result<&'static str, &'static str> {
    match ct.trim().to_ascii_lowercase().as_str() {
        "video/mp4" => Ok(".mp4"),
        "video/webm" => Ok(".webm"),
        _ => Err("invalid_content_type"),
    }
}

pub fn build_object_key(owner_user_id: Uuid, asset_id: Uuid, ext: &str) -> String {
    let prefix = key_prefix();
    format!("{}/{}/{}{}", prefix, owner_user_id, asset_id, ext)
}

pub async fn s3_create_multipart_upload(
    client: &Client,
    object_key: &str,
    content_type: &str,
) -> Result<String, String> {
    let bucket = bucket()?;
    let out = client
        .create_multipart_upload()
        .bucket(&bucket)
        .key(object_key)
        .content_type(content_type)
        .send()
        .await
        .map_err(|e| format!("create_multipart_upload:{e}"))?;
    let uid = out
        .upload_id()
        .ok_or_else(|| "create_multipart_upload:missing_upload_id".to_string())?;
    Ok(uid.to_string())
}

pub async fn s3_abort_multipart_upload(
    client: &Client,
    object_key: &str,
    upload_id: &str,
) -> Result<(), String> {
    let bucket = bucket()?;
    client
        .abort_multipart_upload()
        .bucket(&bucket)
        .key(object_key)
        .upload_id(upload_id)
        .send()
        .await
        .map_err(|e| format!("abort_multipart_upload:{e}"))?;
    Ok(())
}

pub async fn presign_upload_part(
    client: &Client,
    object_key: &str,
    upload_id: &str,
    part_number: i32,
) -> Result<(String, Vec<(String, String)>), String> {
    let bucket = bucket()?;
    let presigning_config = PresigningConfig::expires_in(Duration::from_secs(presign_ttl_sec()))
        .map_err(|e| format!("presign_config:{e}"))?;
    let presigned = client
        .upload_part()
        .bucket(&bucket)
        .key(object_key)
        .upload_id(upload_id)
        .part_number(part_number)
        .presigned(presigning_config)
        .await
        .map_err(|e| format!("presign_upload_part:{e}"))?;
    let upload_url = presigned.uri().to_string();
    let mut headers: Vec<(String, String)> = Vec::new();
    for (k, v) in presigned.headers() {
        headers.push((k.to_string(), v.to_string()));
    }
    Ok((upload_url, headers))
}

pub async fn s3_complete_multipart_upload(
    client: &Client,
    object_key: &str,
    upload_id: &str,
    parts: Vec<(i32, String)>,
) -> Result<(), String> {
    let bucket = bucket()?;
    let mut cps: Vec<CompletedPart> = Vec::with_capacity(parts.len());
    for (part_number, etag) in parts {
        let cp = CompletedPart::builder()
            .part_number(part_number)
            .e_tag(etag.trim().to_string())
            .build();
        cps.push(cp);
    };    let cmp = CompletedMultipartUpload::builder()
        .set_parts(Some(cps))
        .build();
    client
        .complete_multipart_upload()
        .bucket(&bucket)
        .key(object_key)
        .upload_id(upload_id)
        .multipart_upload(cmp)
        .send()
        .await
        .map_err(|e| format!("complete_multipart_upload:{e}"))?;
    Ok(())
}

pub async fn s3_head_content_length(client: &Client, object_key: &str) -> Result<i64, String> {
    let bucket = bucket()?;
    let out = client
        .head_object()
        .bucket(&bucket)
        .key(object_key)
        .send()
        .await
        .map_err(|e| format!("head_object:{e}"))?;
    out.content_length()
        .ok_or_else(|| "head_object:missing_content_length".to_string())
}

pub fn playback_url_for_key(object_key: &str) -> Result<String, String> {
    let base = public_community_media_base_url()
        .ok_or_else(|| "community_media_object_storage_not_configured".to_string())?;
    Ok(format!("{}/{}", base, object_key))
}

#[cfg(test)]
mod object_key_tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn build_object_key_is_unpredictable_uuid_segmented() {
        let owner = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0401);
        let asset = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0501);
        let key = build_object_key(owner, asset, ".mp4");
        assert!(key.contains(&owner.to_string()));
        assert!(key.contains(&asset.to_string()));
        assert!(key.ends_with(".mp4"));
        assert!(!key.contains(".."));
        assert!(!key.contains('\\'));
        let other = build_object_key(owner, Uuid::new_v4(), ".mp4");
        assert_ne!(key, other);
    }

    #[test]
    fn ext_for_video_content_type_whitelist() {
        assert_eq!(ext_for_video_content_type("video/mp4").unwrap(), ".mp4");
        assert_eq!(ext_for_video_content_type("video/webm").unwrap(), ".webm");
        assert_eq!(ext_for_video_content_type("video/quicktime").err(), Some("invalid_content_type"));
        assert_eq!(ext_for_video_content_type("image/png").err(), Some("invalid_content_type"));
    }
}
