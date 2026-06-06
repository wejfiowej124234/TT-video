//! `GET/PUT /api/v1/me/guide-registration-draft` — 向导申请草稿（① 本地 · 无文件字段）

use axum::{http::StatusCode, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use super::ChainOffState;

#[derive(Debug, Deserialize)]
pub struct PutGuideRegistrationDraftBody {
    pub draft: Value,
}

pub async fn get_guide_registration_draft_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let draft = store
        .guide_registration_drafts
        .get(&user_id)
        .cloned()
        .unwrap_or_else(|| json!({}));
    Ok(Json(json!({
        "status": "ok",
        "draft": draft,
        "updated_at": null
    })))
}

pub async fn put_guide_registration_draft_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PutGuideRegistrationDraftBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if !body.draft.is_object() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "invalid_draft",
                "draft must be a JSON object",
            )),
        ));
    };    let mut store = state.store.write().await;
    store
        .guide_registration_drafts
        .insert(user_id, body.draft.clone());
    Ok(Json(json!({
        "status": "ok",
        "draft": body.draft
    })))
}
