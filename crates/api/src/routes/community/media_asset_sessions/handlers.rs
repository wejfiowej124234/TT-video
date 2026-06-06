use std::time::{Duration, Instant};

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::db::{
    finalize_community_media_asset_ready, get_community_media_asset_owned,
    insert_community_media_asset_pending, mark_community_media_asset_failed,
    mark_community_media_asset_processing, mark_community_media_asset_uploaded,
};
use crate::middleware;
use crate::state::{extract_user_with_session_check, ApiMetaState};
use crate::storage::community_media_s3::{
    build_client, build_object_key, community_media_object_storage_configured,
    default_part_size_bytes, ext_for_video_content_type, max_asset_bytes, playback_url_for_key,
    presign_upload_part, s3_abort_multipart_upload, s3_complete_multipart_upload,
    s3_create_multipart_upload, s3_head_content_length,
};

use super::multipart_audit_log::{
    log_media_asset_status_snapshot, log_multipart_error, log_multipart_phase,
};

const PATH_PREFIX: &str = "/api/v1/community/media-assets";

fn part_count(byte_length: i64, part_size: i64) -> Result<i32, &'static str> {
    if part_size < 5 * 1024 * 1024 {
        return Err("part_size_too_small");
    };    if byte_length <= 0 {
        return Err("invalid_byte_length");
    };    let n = (byte_length + part_size - 1) / part_size;
    if n > 10_000 {
        return Err("too_many_parts");
    }
    Ok(n as i32)
}

async fn enforce_community_media_rate(
    state: &ApiMetaState,
    uid: Uuid,
) -> Result<(), axum::Json<serde_json::Value>> {
    let now = Instant::now();
    let mut guard = state.community_media_upload_rate.write().await;
    let window = Duration::from_secs(middleware::COMMUNITY_MEDIA_UPLOAD_RATE_WINDOW_SECS);
    guard
        .entry(uid)
        .or_default()
        .retain(|t| now.saturating_duration_since(*t) < window);
    let count = guard.get(&uid).map_or(0, |v| v.len());
    if count >= middleware::COMMUNITY_MEDIA_UPLOAD_RATE_LIMIT {
        let secs_u32 = u32::try_from(middleware::COMMUNITY_MEDIA_UPLOAD_RATE_WINDOW_SECS)
            .unwrap_or(60)
            .clamp(1, 86_400);
        let body = json!({
            "status": "error",
            "error": "rate_limit_exceeded",
            "message": "rate_limit_exceeded",
            "retry_after_seconds": middleware::COMMUNITY_MEDIA_UPLOAD_RATE_WINDOW_SECS,
            "retry_after_sec": secs_u32,
        });
        return Err(Json(body));
    }
    guard.entry(uid).or_default().push(now);
    Ok(())
}

#[derive(Debug, Deserialize)]
pub(crate) struct CreateMediaAssetSessionBody {
    pub content_type: String,
    pub byte_length: i64,
    #[serde(default)]
    pub part_size_bytes: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct PresignPartsBody {
    pub part_numbers: Vec<i32>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct CompletePartItem {
    pub part_number: i32,
    pub etag: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct CompleteMediaAssetSessionBody {
    pub parts: Vec<CompletePartItem>,
    #[serde(default)]
    pub sha256_hex: Option<String>,
}

fn chain_off_json(path: &'static str, code: &'static str) -> axum::Json<serde_json::Value> {
    Json(json!({
        "status": "error",
        "error": code,
        "message": code,
        "path": path,
    }))
}

pub async fn post_community_media_asset_session_create(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<CreateMediaAssetSessionBody>,
) -> impl IntoResponse {
    const PATH: &str = "POST /api/v1/community/media-assets/sessions";
    if state.chain_off.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"status":"error","error":"unauthorized","message":"unauthorized"})),
            )
                .into_response();
        }
    };    let Some(co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let Some(pool) = co.db_pool.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(
                json!({"status":"error","error":"database_required","message":"database_required"}),
            ),
        )
            .into_response();
    };    if !community_media_object_storage_configured() {
        log_multipart_error(
            &headers,
            "gate_object_storage_not_configured",
            None,
            "community_media_object_storage_not_configured",
            "not_configured",
        );
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "community_media_object_storage_not_configured",
                "message": "community_media_object_storage_not_configured",
            })),
        )
            .into_response();
    }
    if let Err(j) = enforce_community_media_rate(&state, uid).await {
        log_multipart_error(
            &headers,
            "rate_limit_exceeded",
            None,
            "community_media_upload_rate_limit_exceeded",
            "retry_after_window",
        );
        return chain_off::status_json_response_with_429_retry_header(
            StatusCode::TOO_MANY_REQUESTS,
            j,
        );
    };    let max_b = max_asset_bytes();
    if body.byte_length <= 0 || body.byte_length > max_b {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_byte_length",
                "message": "invalid_byte_length",
                "max_bytes": max_b,
            })),
        )
            .into_response();
    };    let ct = body.content_type.trim();
    let ext = match ext_for_video_content_type(ct) {
        Ok(e) => e,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status":"error","error": e, "message": e})),
            )
                .into_response();
        }
    };
    let part_size = body.part_size_bytes.unwrap_or_else(default_part_size_bytes);
    let part_count = match part_count(body.byte_length, part_size) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status":"error","error": e, "message": e})),
            )
                .into_response();
        }
    };
    let asset_id = Uuid::new_v4();
    let object_key = build_object_key(uid, asset_id, ext);

    let client = match build_client().await {
        Ok(c) => c,
        Err(e) => {
            log_multipart_error(
                &headers,
                "s3_client_build_failed",
                Some(asset_id),
                "community_media_s3_client_failed",
                &e,
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"community_media_s3_client_failed", "message": e})),
            )
                .into_response();
        }
    };
    let upload_id = match s3_create_multipart_upload(&client, &object_key, ct).await {
        Ok(u) => u,
        Err(e) => {
            log_multipart_error(
                &headers,
                "s3_create_multipart_failed",
                Some(asset_id),
                "create_multipart_failed",
                &e,
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"create_multipart_failed", "message": e})),
            )
                .into_response();
        }
    };
    if let Err(e) = insert_community_media_asset_pending(
        pool,
        asset_id,
        uid,
        &object_key,
        ct,
        body.byte_length,
        part_size,
        part_count,
        &upload_id,
    )
    .await
    {
        let _ = s3_abort_multipart_upload(&client, &object_key, &upload_id).await;
        log_multipart_error(
            &headers,
            "media_asset_db_insert_failed",
            Some(asset_id),
            "media_asset_db_failed",
            &e.to_string(),
        );
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(
                json!({"status":"error","error":"media_asset_db_failed", "message": e.to_string()}),
            ),
        )
            .into_response();
    }

    log_multipart_phase(
        &headers,
        "session_create_ok",
        asset_id,
        &format!(
            "byte_length={} part_count={} part_size_bytes={} content_type_len={}",
            body.byte_length,
            part_count,
            part_size,
            ct.len()
        ),
    );

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "asset_id": asset_id.to_string(),
            "object_key": object_key,
            "content_type": ct,
            "byte_length": body.byte_length,
            "part_size_bytes": part_size,
            "part_count": part_count,
            "presign_expires_in_seconds": std::env::var("COMMUNITY_MEDIA_PRESIGN_TTL_SEC")
                .ok()
                .and_then(|s| s.parse::<u64>().ok())
                .filter(|&n| (60..=3600).contains(&n))
                .unwrap_or(900u64),
        })),
    )
        .into_response()
}

pub async fn post_community_media_asset_session_presign_parts(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(asset_id): Path<Uuid>,
    Json(body): Json<PresignPartsBody>,
) -> impl IntoResponse {
    const PATH: &str = "POST /api/v1/community/media-assets/sessions/:asset_id/parts";
    if state.chain_off.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"status":"error","error":"unauthorized","message":"unauthorized"})),
            )
                .into_response();
        }
    };    let Some(co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let Some(pool) = co.db_pool.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(
                json!({"status":"error","error":"database_required","message":"database_required"}),
            ),
        )
            .into_response();
    };    if !community_media_object_storage_configured() {
        log_multipart_error(
            &headers,
            "gate_object_storage_not_configured",
            Some(asset_id),
            "community_media_object_storage_not_configured",
            "not_configured",
        );
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "community_media_object_storage_not_configured",
                "message": "community_media_object_storage_not_configured",
            })),
        )
            .into_response();
    }
    if let Err(j) = enforce_community_media_rate(&state, uid).await {
        log_multipart_error(
            &headers,
            "rate_limit_exceeded",
            None,
            "community_media_upload_rate_limit_exceeded",
            "retry_after_window",
        );
        return chain_off::status_json_response_with_429_retry_header(
            StatusCode::TOO_MANY_REQUESTS,
            j,
        );
    };    let row = match get_community_media_asset_owned(pool, asset_id, uid).await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"db_error", "message": e.to_string()})),
            )
                .into_response();
        }
    };    let Some(row) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"status":"error","error":"not_found", "message": "not_found"})),
        )
            .into_response();
    };    if row.state != "pending_upload" {
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"invalid_asset_state", "message": "invalid_asset_state"})),
        )
            .into_response();
    };    let Some(upload_id) = row.s3_multipart_upload_id.clone() else {
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"missing_upload_id", "message": "missing_upload_id"})),
        )
            .into_response();
    };
    if body.part_numbers.is_empty() || body.part_numbers.len() > 32 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"error","error":"invalid_part_numbers", "message": "invalid_part_numbers"})),
        )
            .into_response();
    }

    for pn in &body.part_numbers {
        if *pn < 1 || *pn > row.part_count {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "part_number_out_of_range",
                    "message": "part_number_out_of_range",
                    "part_count": row.part_count,
                })),
            )
                .into_response();
        }
    };    let client = match build_client().await {
        Ok(c) => c,
        Err(e) => {
            log_multipart_error(
                &headers,
                "s3_client_build_failed",
                Some(asset_id),
                "community_media_s3_client_failed",
                &e,
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"community_media_s3_client_failed", "message": e})),
            )
                .into_response();
        }
    };
    let mut parts_out = Vec::new();
    for pn in &body.part_numbers {
        match presign_upload_part(&client, &row.object_key, &upload_id, *pn).await {
            Ok((url, hdrs)) => {
                let mut headers_obj = serde_json::Map::new();
                for (k, v) in hdrs {
                    headers_obj.insert(k, json!(v));
                }
                parts_out.push(json!({
                    "part_number": pn,
                    "url": url,
                    "headers": serde_json::Value::Object(headers_obj),
                }));
            }
            Err(e) => {
                log_multipart_error(
                    &headers,
                    "presign_part_failed",
                    Some(asset_id),
                    "presign_failed",
                    &format!("part_number={pn} {e}"),
                );
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({"status":"error","error":"presign_failed", "message": e})),
                )
                    .into_response();
            }
        }
    }

    log_multipart_phase(
        &headers,
        "presign_parts_ok",
        asset_id,
        &format!("n_part_numbers={}", body.part_numbers.len()),
    );

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "asset_id": asset_id.to_string(),
            "parts": parts_out,
        })),
    )
        .into_response()
}

pub async fn post_community_media_asset_session_complete(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(asset_id): Path<Uuid>,
    Json(body): Json<CompleteMediaAssetSessionBody>,
) -> impl IntoResponse {
    const PATH: &str = "POST /api/v1/community/media-assets/sessions/:asset_id/complete";
    if state.chain_off.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"status":"error","error":"unauthorized","message":"unauthorized"})),
            )
                .into_response();
        }
    };    let Some(co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let Some(pool) = co.db_pool.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(
                json!({"status":"error","error":"database_required","message":"database_required"}),
            ),
        )
            .into_response();
    };    if !community_media_object_storage_configured() {
        log_multipart_error(
            &headers,
            "gate_object_storage_not_configured",
            Some(asset_id),
            "community_media_object_storage_not_configured",
            "not_configured",
        );
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "community_media_object_storage_not_configured",
                "message": "community_media_object_storage_not_configured",
            })),
        )
            .into_response();
    }
    if let Err(j) = enforce_community_media_rate(&state, uid).await {
        log_multipart_error(
            &headers,
            "rate_limit_exceeded",
            None,
            "community_media_upload_rate_limit_exceeded",
            "retry_after_window",
        );
        return chain_off::status_json_response_with_429_retry_header(
            StatusCode::TOO_MANY_REQUESTS,
            j,
        );
    };    let row = match get_community_media_asset_owned(pool, asset_id, uid).await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"db_error", "message": e.to_string()})),
            )
                .into_response();
        }
    };    let Some(row) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"status":"error","error":"not_found", "message": "not_found"})),
        )
            .into_response();
    };    if row.state != "pending_upload" {
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"invalid_asset_state", "message": "invalid_asset_state"})),
        )
            .into_response();
    };    let Some(upload_id) = row.s3_multipart_upload_id.clone() else {
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"missing_upload_id", "message": "missing_upload_id"})),
        )
            .into_response();
    };
    if body.parts.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"error","error":"parts_required", "message": "parts_required"})),
        )
            .into_response();
    };    if let Some(ref h) = body.sha256_hex {
        let t = h.trim();
        if t.len() != 64 || !t.chars().all(|c| c.is_ascii_hexdigit()) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status":"error","error":"invalid_sha256_hex", "message": "invalid_sha256_hex"})),
            )
                .into_response();
        }
    };    let mut pairs: Vec<(i32, String)> = body
        .parts
        .iter()
        .map(|p| (p.part_number, p.etag.trim().to_string()))
        .collect();
    pairs.sort_by_key(|(n, _)| *n);
    let n_set: std::collections::HashSet<i32> = pairs.iter().map(|(n, _)| *n).collect();
    if n_set.len() != pairs.len() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"error","error":"duplicate_part_number", "message": "duplicate_part_number"})),
        )
            .into_response();
    };    if n_set.len() as i32 != row.part_count {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "part_count_mismatch",
                "message": "part_count_mismatch",
                "expected": row.part_count,
                "got": n_set.len(),
            })),
        )
            .into_response();
    }
    for pn in 1..=row.part_count {
        if !n_set.contains(&pn) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status":"error","error":"missing_part", "message": "missing_part", "part_number": pn})),
            )
                .into_response();
        }
    };    let client = match build_client().await {
        Ok(c) => c,
        Err(e) => {
            log_multipart_error(
                &headers,
                "s3_client_build_failed",
                Some(asset_id),
                "community_media_s3_client_failed",
                &e,
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"community_media_s3_client_failed", "message": e})),
            )
                .into_response();
        }
    };
    if let Err(e) = s3_complete_multipart_upload(&client, &row.object_key, &upload_id, pairs).await
    {
        let _ = mark_community_media_asset_failed(pool, asset_id, uid, &e).await;
        log_multipart_error(
            &headers,
            "s3_complete_failed",
            Some(asset_id),
            "multipart_complete_failed",
            &e,
        );
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"error","error":"multipart_complete_failed", "message": e})),
        )
            .into_response();
    };    let ok_uploaded = match mark_community_media_asset_uploaded(pool, asset_id, uid).await {
        Ok(b) => b,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"db_error", "message": e.to_string()})),
            )
                .into_response();
        }
    };    if !ok_uploaded {
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"invalid_asset_state", "message": "invalid_asset_state"})),
        )
            .into_response();
    };    let head_len = match s3_head_content_length(&client, &row.object_key).await {
        Ok(n) => n,
        Err(e) => {
            let _ = mark_community_media_asset_failed(pool, asset_id, uid, &e).await;
            log_multipart_error(
                &headers,
                "s3_head_object_failed",
                Some(asset_id),
                "head_object_failed",
                &e,
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"head_object_failed", "message": e})),
            )
                .into_response();
        }
    };
    let ok_proc = match mark_community_media_asset_processing(pool, asset_id, uid).await {
        Ok(b) => b,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"db_error", "message": e.to_string()})),
            )
                .into_response();
        }
    };    if !ok_proc {
        let _ = mark_community_media_asset_failed(
            pool,
            asset_id,
            uid,
            "mark_processing_failed_or_race",
        )
        .await;
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"invalid_asset_state", "message": "invalid_asset_state"})),
        )
            .into_response();
    };    let playback = match playback_url_for_key(&row.object_key) {
        Ok(u) => u,
        Err(e) => {
            let _ = mark_community_media_asset_failed(pool, asset_id, uid, &e).await;
            log_multipart_error(
                &headers,
                "playback_url_build_failed",
                Some(asset_id),
                "playback_url_failed",
                &e,
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"playback_url_failed", "message": e})),
            )
                .into_response();
        }
    };
    let sha = body
        .sha256_hex
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let ok =
        match finalize_community_media_asset_ready(pool, asset_id, uid, &playback, head_len, sha)
            .await
        {
            Ok(b) => b,
            Err(e) => {
                log_multipart_error(
                    &headers,
                    "finalize_media_asset_db_failed",
                    Some(asset_id),
                    "db_error",
                    &e.to_string(),
                );
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({"status":"error","error":"db_error", "message": e.to_string()})),
                )
                    .into_response();
            }
        };    if !ok {
        log_multipart_error(
            &headers,
            "finalize_media_asset_state_conflict",
            Some(asset_id),
            "invalid_asset_state",
            "finalize_returned_false",
        );
        return (
            StatusCode::CONFLICT,
            Json(json!({"status":"error","error":"invalid_asset_state", "message": "invalid_asset_state"})),
        )
            .into_response();
    }

    log_multipart_phase(
        &headers,
        "complete_ready",
        asset_id,
        &format!(
            "byte_length_head={} parts_submitted={} playback_url_len={}",
            head_len,
            body.parts.len(),
            playback.len()
        ),
    );

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "asset_id": asset_id.to_string(),
            "state": "ready",
            "playback_url": playback,
            "byte_length": head_len,
        })),
    )
        .into_response()
}

pub async fn get_community_media_asset_status(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(asset_id): Path<Uuid>,
) -> impl IntoResponse {
    const PATH: &str = "GET /api/v1/community/media-assets/:asset_id";
    if state.chain_off.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"status":"error","error":"unauthorized","message":"unauthorized"})),
            )
                .into_response();
        }
    };    let Some(co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            chain_off_json(PATH, "chain_off_unavailable"),
        )
            .into_response();
    };    let Some(pool) = co.db_pool.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(
                json!({"status":"error","error":"database_required","message":"database_required"}),
            ),
        )
            .into_response();
    };
    let row = match get_community_media_asset_owned(pool, asset_id, uid).await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"error","error":"db_error", "message": e.to_string()})),
            )
                .into_response();
        }
    };    let Some(row) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"status":"error","error":"not_found", "message": "not_found"})),
        )
            .into_response();
    };
    let playback_url_len = row
        .playback_url
        .as_ref()
        .map(|s| u32::try_from(s.len()).unwrap_or(u32::MAX))
        .unwrap_or(0);
    log_media_asset_status_snapshot(
        &headers,
        asset_id,
        row.state.as_str(),
        row.byte_length,
        playback_url_len,
    );

    let manifest_val = row
        .playback_manifest_json
        .map(|j| j.0.clone())
        .unwrap_or(serde_json::Value::Null);

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "asset": {
                "id": row.id.to_string(),
                "state": row.state,
                "content_type": row.content_type,
                "byte_length": row.byte_length,
                "part_size_bytes": row.part_size_bytes,
                "part_count": row.part_count,
                "playback_url": row.playback_url,
                "playback_manifest_json": manifest_val,
                "duration_ms": row.duration_ms,
                "width": row.width,
                "height": row.height,
                "cover_object_key": row.cover_object_key,
                "sha256_hex": row.sha256_hex,
                "last_error": row.last_error,
                "created_at": row.created_at.to_rfc3339(),
                "updated_at": row.updated_at.to_rfc3339(),
            }
        })),
    )
        .into_response()
}
