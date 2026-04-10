use axum::extract::{Path, Query, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::common::{enforce_community_report_abuse, LIST_LIMIT};

// ---------- 反馈/建议（55-S10 / 54-S19）----------
const FEEDBACK_MEDIA_MAX: usize = 4;
const FEEDBACK_MEDIA_ITEM_MAX_BYTES: usize = 950_000;

/// 可选 `media_urls`：最多 4 条；每条须为 `http(s)://` 或 `data:image/`、`data:video/`；单条 UTF-8 字节长度上限防滥用。
fn parse_feedback_media_urls(v: Option<&serde_json::Value>) -> Result<Vec<String>, &'static str> {
    let Some(val) = v else {
        return Ok(Vec::new());
    };
    if val.is_null() {
        return Ok(Vec::new());
    }
    let Some(arr) = val.as_array() else {
        return Err("feedback_media_invalid");
    };
    if arr.len() > FEEDBACK_MEDIA_MAX {
        return Err("feedback_media_too_many");
    }
    let mut out = Vec::new();
    for el in arr {
        let s = el.as_str().ok_or("feedback_media_invalid")?.trim();
        if s.is_empty() {
            continue;
        }
        if s.len() > FEEDBACK_MEDIA_ITEM_MAX_BYTES {
            return Err("feedback_media_too_large");
        }
        let ok = s.starts_with("https://")
            || s.starts_with("http://")
            || s.starts_with("data:image/")
            || s.starts_with("data:video/");
        if !ok {
            return Err("feedback_media_scheme");
        }
        out.push(s.to_string());
    }
    Ok(out)
}

pub(super) async fn get_feedback(State(state): State<ApiMetaState>, headers: HeaderMap) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    match db::list_feedback_by_user(pool, uid, LIST_LIMIT).await {
        Ok(rows) => {
            let items: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    json!({
                        "id": r.id.to_string(),
                        "category": r.category,
                        "content": r.content,
                        "status": r.status,
                        "official_reply": r.official_reply,
                        "media_urls": r.media_urls,
                        "created_at": r.created_at.to_rfc3339(),
                        "updated_at": r.updated_at.to_rfc3339()
                    })
                })
                .collect();
            Json(json!({ "status": "ok", "items": items })).into_response()
        }
        Err(_) => {
            Json(json!({"status": "error", "error": "list_failed", "message": "list_failed"}))
                .into_response()
        }
    }
}

fn community_report_target_type_ok(s: &str) -> bool {
    matches!(s, "post" | "user" | "comment" | "message" | "other")
}

fn community_report_reason_ok(s: &str) -> bool {
    matches!(
        s,
        "spam" | "harassment" | "scam" | "illegal" | "hate" | "other"
    )
}

pub(super) async fn post_community_report(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let target_type = j
        .get("target_type")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    let reason_code = j
        .get("reason_code")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    let target_id_str = j
        .get("target_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    if target_type.is_empty() || reason_code.is_empty() || target_id_str.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "report_fields_required",
            "message": "report_fields_required",
            "errors": { "body": "report_fields_required" }
        }))
        .into_response();
    }
    if !community_report_target_type_ok(target_type) {
        return Json(json!({
            "status": "error",
            "error": "invalid_target_type",
            "message": "invalid_target_type",
            "errors": { "target_type": "invalid_target_type" }
        }))
        .into_response();
    }
    if !community_report_reason_ok(reason_code) {
        return Json(json!({
            "status": "error",
            "error": "invalid_reason_code",
            "message": "invalid_reason_code",
            "errors": { "reason_code": "invalid_reason_code" }
        }))
        .into_response();
    }
    let Ok(target_id) = Uuid::parse_str(target_id_str) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_target_id",
            "message": "invalid_target_id",
            "errors": { "target_id": "invalid_target_id" }
        }))
        .into_response();
    };
    let details = j
        .get("details")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let evidence_ref = j
        .get("evidence_ref")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::community_report_target_exists(pool, target_type, target_id).await {
        Ok(true) => {}
        Ok(false) => {
            return Json(json!({
                "status": "error",
                "error": "report_target_not_found",
                "message": "report_target_not_found",
                "errors": { "target_id": "report_target_not_found" }
            }))
            .into_response();
        }
        Err(_) => {
            return Json(json!({
                "status": "error",
                "error": "report_target_lookup_failed",
                "message": "report_target_lookup_failed",
                "errors": { "target_id": "report_target_lookup_failed" }
            }))
            .into_response();
        }
    }
    if let Err(resp) = enforce_community_report_abuse(pool, uid, target_type, target_id).await {
        return resp;
    }
    match db::insert_community_report(
        pool,
        uid,
        target_type,
        target_id,
        reason_code,
        details,
        evidence_ref,
    )
    .await
    {
        Ok(id) => Json(json!({ "status": "ok", "id": id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "report_create_failed",
            "message": "report_create_failed",
            "errors": { "body": "report_create_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn get_community_report_detail(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(rid) = Uuid::parse_str(id.trim()) else {
        return Json(json!({"status": "error", "error": "invalid_report_id", "message": "invalid_report_id"})).into_response();
    };
    let row = match db::get_community_report_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "report_load_failed", "message": "report_load_failed"})).into_response();
        }
    };
    let Some(r) = row else {
        return Json(
            json!({"status": "error", "error": "report_not_found", "message": "report_not_found"}),
        )
        .into_response();
    };
    if r.reporter_id != uid {
        return Json(json!({"status": "error", "error": "forbidden", "message": "forbidden"}))
            .into_response();
    }
    Json(json!({
        "status": "ok",
        "report": {
            "id": r.id.to_string(),
            "target_type": r.target_type,
            "target_id": r.target_id.to_string(),
            "reason_code": r.reason_code,
            "details": r.details,
            "evidence_ref": r.evidence_ref,
            "status": r.status,
            "created_at": r.created_at.to_rfc3339(),
            "updated_at": r.updated_at.to_rfc3339(),
        }
    }))
    .into_response()
}

#[derive(serde::Deserialize, Default)]
pub(super) struct MeReportsQuery {
    limit: Option<i64>,
}

pub(super) async fn get_me_community_reports(
    Query(q): Query<MeReportsQuery>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let mut lim = q.limit.unwrap_or(30);
    if lim < 1 {
        lim = 1;
    } else if lim > 100 {
        lim = 100;
    }
    let rows = match db::list_community_reports_for_reporter(pool, uid, lim).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "report_list_failed", "message": "report_list_failed"})).into_response();
        }
    };
    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "target_type": r.target_type,
                "target_id": r.target_id.to_string(),
                "reason_code": r.reason_code,
                "details": r.details,
                "evidence_ref": r.evidence_ref,
                "status": r.status,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    Json(json!({ "status": "ok", "items": items })).into_response()
}

pub(super) async fn post_community_report_appeal(
    Path(report_id_raw): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<Json<serde_json::Value>>,
) -> impl IntoResponse {
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Ok(rid) = Uuid::parse_str(report_id_raw.trim()) else {
        return Json(json!({"status": "error", "error": "invalid_report_id", "message": "invalid_report_id"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let appeal_body = j.get("body").and_then(|v| v.as_str()).unwrap_or("").trim();
    if appeal_body.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "appeal_body_required",
            "message": "appeal_body_required",
            "errors": { "body": "appeal_body_required" }
        }))
        .into_response();
    }
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let row = match db::get_community_report_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "report_load_failed", "message": "report_load_failed"})).into_response();
        }
    };
    let Some(report) = row else {
        return Json(
            json!({"status": "error", "error": "report_not_found", "message": "report_not_found"}),
        )
        .into_response();
    };
    if !db::community_report_status_allows_user_appeal(&report.status) {
        return Json(json!({
            "status": "error",
            "error": "report_not_appealable",
            "message": "report_not_appealable",
            "errors": { "report_id": "report_not_appealable" }
        }))
        .into_response();
    }
    let may = match db::community_user_may_file_appeal(pool, &report, uid).await {
        Ok(v) => v,
        Err(_) => {
            return Json(json!({"status": "error", "error": "appeal_permission_check_failed", "message": "appeal_permission_check_failed"}))
                .into_response();
        }
    };
    if !may {
        return Json(json!({"status": "error", "error": "forbidden", "message": "forbidden"}))
            .into_response();
    }
    let pending = match db::count_pending_appeals_for_report(pool, rid).await {
        Ok(n) => n,
        Err(_) => {
            return Json(json!({"status": "error", "error": "appeal_count_failed", "message": "appeal_count_failed"})).into_response();
        }
    };
    if pending > 0 {
        return Json(json!({
            "status": "error",
            "error": "appeal_pending_exists",
            "message": "appeal_pending_exists",
            "errors": { "report_id": "appeal_pending_exists" }
        }))
        .into_response();
    }
    match db::insert_community_report_appeal(pool, rid, uid, appeal_body).await {
        Ok(aid) => Json(json!({
            "status": "ok",
            "id": aid.to_string(),
            "report_id": rid.to_string(),
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "appeal_create_failed",
            "message": "appeal_create_failed",
            "errors": { "body": "appeal_create_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn post_feedback(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let category = j
        .get("category")
        .and_then(|v| v.as_str())
        .unwrap_or("other")
        .to_string();
    let content = j
        .get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let content_trim = content.trim();
    if content_trim.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "content_required",
            "message": "content_required",
            "errors": { "content": "content_required" }
        }))
        .into_response();
    }
    let media_urls = match parse_feedback_media_urls(j.get("media_urls")) {
        Ok(v) => v,
        Err(code) => {
            return Json(json!({
                "status": "error",
                "error": code,
                "message": code,
                "errors": { "media_urls": code }
            }))
            .into_response();
        }
    };
    match db::insert_feedback(pool, uid, &category, content_trim, &media_urls).await {
        Ok(id) => Json(json!({ "status": "ok", "id": id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "feedback_create_failed",
            "message": "feedback_create_failed",
            "errors": { "content": "feedback_create_failed" }
        }))
        .into_response(),
    }
}
