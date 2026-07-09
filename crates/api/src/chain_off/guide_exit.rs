//! `POST/GET /api/v1/me/guide-exit-*` · 向导退出申请（① 本地 · 81 §5.3）
//!
//! **②** Admin 审核 · 冷却期满 · 链上 withdraw — 见 STK-P2-013～015。

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use super::{ChainOffState, GuideRow};

const MAX_REASON_LEN: usize = 500;

/// 内存真源行（无 PG 时与 `guide_exit_requests` 表同形）
#[derive(Clone, Debug)]
pub struct GuideExitRequestRow {
    pub id: Uuid,
    pub guide_id: Uuid,
    pub user_id: Uuid,
    pub status: String,
    pub reason: Option<String>,
    pub requested_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

fn exit_status_json(guide: &GuideRow, req: Option<&GuideExitRequestRow>) -> Value {
    json!({
        "guide_id": guide.id.to_string(),
        "guide_status": guide.status,
        "can_accept_orders": super::guides::guide_can_accept_orders(&guide.status),
        "exit_request": req.map(|r| json!({
            "id": r.id.to_string(),
            "status": r.status,
            "reason": r.reason,
            "requested_at": r.requested_at.to_rfc3339(),
            "updated_at": r.updated_at.to_rfc3339(),
        })),
    })
}

pub async fn get_me_guide_exit_status_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    let guide_id = store.guides_by_user.get(&user_id).copied().ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_profile_not_found")),
    ))?;
    let guide = store.guides.get(&guide_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;
    let req = store
        .guide_exit_requests_by_guide
        .get(&guide_id)
        .cloned();
    Ok(Json(json!({
        "status": "ok",
        "exit": exit_status_json(guide, req.as_ref()),
    })))
}

#[derive(Debug, Deserialize)]
pub struct GuideExitRequestBody {
    #[serde(default)]
    pub reason: Option<String>,
}

pub async fn post_me_guide_exit_request_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<GuideExitRequestBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let reason = body
        .reason
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    if let Some(ref r) = reason {
        if r.len() > MAX_REASON_LEN {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("guide_exit_reason_too_long")),
            ));
        }
    }

    let mut store = state.store.write().await;
    let guide_id = store.guides_by_user.get(&user_id).copied().ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_profile_not_found")),
    ))?;
    let guide = store.guides.get(&guide_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;

    let st = guide.status.to_ascii_lowercase();
    if st == "exiting" {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("guide_exit_already_pending")),
        ));
    }
    if st == "exited" {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("guide_already_exited")),
        ));
    }
    if !super::guides::guide_can_accept_orders(&guide.status) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("guide_exit_not_eligible")),
        ));
    }

    if store.guide_exit_requests_by_guide.contains_key(&guide_id) {
        let existing = store.guide_exit_requests_by_guide.get(&guide_id).unwrap();
        if existing.status == "pending" {
            return Err((
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("guide_exit_already_pending")),
            ));
        }
    }

    let now = Utc::now();
    let req_id = Uuid::new_v4();
    let row = GuideExitRequestRow {
        id: req_id,
        guide_id,
        user_id,
        status: "pending".to_string(),
        reason: reason.clone(),
        requested_at: now,
        updated_at: now,
    };

    if let Some(g) = store.guides.get_mut(&guide_id) {
        g.status = "exiting".to_string();
        g.updated_at = now;
    }
    store
        .guide_exit_requests_by_guide
        .insert(guide_id, row.clone());

    let guide_snapshot = store.guides.get(&guide_id).cloned().unwrap();
    drop(store);

    if let Some(ref pool) = state.db_pool {
        if let Err(e) = crate::db::update_guide_registration_review(
            pool,
            guide_id,
            "exiting",
            &[],
            None,
            now,
        )
        .await
        {
            eprintln!(
                "[audit] db update_guide_registration_review exiting failed guide_id={guide_id} error={e}"
            );
        }
        if let Err(e) = crate::db::insert_guide_exit_request(
            pool,
            req_id,
            guide_id,
            user_id,
            reason.as_deref(),
            now,
            now,
        )
        .await
        {
            eprintln!(
                "[audit] db insert_guide_exit_request failed guide_id={guide_id} error={e}"
            );
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "exit": exit_status_json(&guide_snapshot, Some(&row)),
    })))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, UserRow};
    use axum::Json;
    use chrono::Utc;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use uuid::Uuid;

    fn guide_fixture(user_id: Uuid, guide_id: Uuid, status: &str) -> ChainOffStore {
        let now = Utc::now();
        let mut store = ChainOffStore::default();
        store.users.insert(
            user_id,
            UserRow {
                id: user_id,
                email: "exit@test.com".to_string(),
                password_hash: None,
                role: "guide".to_string(),
                kyc_status: "none".to_string(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
        store.guides.insert(
            guide_id,
            GuideRow {
                id: guide_id,
                user_id,
                city: "HZ".to_string(),
                country_code: "CN".to_string(),
                languages: vec!["zh".to_string()],
                service_types: vec!["walking".to_string()],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "100".to_string(),
                hourly_rate: None,
                avatar_url: None,
                public_title: None,
                status: status.to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
                data_origin: "test".into(),
                ..Default::default()
                },
        );
        store.guides_by_user.insert(user_id, guide_id);
        store
    }

    #[tokio::test]
    async fn get_me_guide_exit_status_ok_when_no_request() {
        let user_id = Uuid::new_v4();
        let guide_id = Uuid::new_v4();
        let state = ChainOffState {
            store: Arc::new(RwLock::new(guide_fixture(user_id, guide_id, "active"))),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let Json(body) = get_me_guide_exit_status_impl(state, user_id)
            .await
            .expect("200");
        assert_eq!(body["status"], "ok");
        assert_eq!(body["exit"]["guide_status"], "active");
        assert!(body["exit"]["exit_request"].is_null());
    }

    #[tokio::test]
    async fn get_me_guide_exit_status_404_without_guide_row() {
        let user_id = Uuid::new_v4();
        let state = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let Err((status, Json(err))) = get_me_guide_exit_status_impl(state, user_id).await else {
            panic!("expected 404");
        };
        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(err["error"], "guide_profile_not_found");
    }
}
