//! PD-009：旅行收购发布写路径门闸（替换 LEGACY `region_steward` 占位）。

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db::{self, get_user_by_id};
use crate::state::ApiMetaState;

pub(crate) fn acquisition_wallet_required_response() -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "status": "error",
            "error": "acquisition_wallet_required",
            "message": "acquisition_wallet_required",
            "detail": "Bind default_wallet_address before publishing acquisition listings.",
        })),
    )
        .into_response()
}

pub(crate) fn acquisition_publish_bond_required_response() -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "status": "error",
            "error": "acquisition_publish_bond_required",
            "message": "acquisition_publish_bond_required",
            "detail": "Post acquisition publish bond or reach acquisition_trust_score waive threshold.",
        })),
    )
        .into_response()
}

pub(crate) fn acquisition_trust_restricted_response() -> axum::response::Response {
    (
        StatusCode::FORBIDDEN,
        Json(json!({
            "status": "error",
            "error": "acquisition_trust_restricted",
            "message": "acquisition_trust_restricted",
        })),
    )
        .into_response()
}

pub(crate) fn acquisition_publish_rate_limited_response() -> axum::response::Response {
    (
        StatusCode::TOO_MANY_REQUESTS,
        Json(json!({
            "status": "error",
            "error": "acquisition_publish_rate_limited",
            "message": "acquisition_publish_rate_limited",
        })),
    )
        .into_response()
}

pub(crate) fn acquisition_publish_suspended_response() -> axum::response::Response {
    (
        StatusCode::FORBIDDEN,
        Json(json!({
            "status": "error",
            "error": "acquisition_publish_suspended",
            "message": "acquisition_publish_suspended",
        })),
    )
        .into_response()
}

pub(crate) fn acquisition_escrow_ack_required_response() -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "status": "error",
            "error": "acquisition_escrow_ack_required",
            "message": "acquisition_escrow_ack_required",
            "detail": "agree_escrow_copy must be true before publishing acquisition listings.",
        })),
    )
        .into_response()
}

pub(crate) fn acquisition_body_agrees_escrow_copy(body: &serde_json::Value) -> bool {
    body.get("agree_escrow_copy")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

pub(crate) fn acquisition_trust_lookup_failed_response() -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({
            "status": "error",
            "error": "acquisition_trust_lookup_failed",
            "message": "acquisition_trust_lookup_failed",
        })),
    )
        .into_response()
}

fn acquisition_gate_error_response(key: &str) -> axum::response::Response {
    match key {
        "acquisition_wallet_required" => acquisition_wallet_required_response(),
        "acquisition_publish_bond_required" => acquisition_publish_bond_required_response(),
        "acquisition_trust_restricted" => acquisition_trust_restricted_response(),
        "acquisition_publish_suspended" => acquisition_publish_suspended_response(),
        "acquisition_publish_rate_limited" => acquisition_publish_rate_limited_response(),
        _ => acquisition_trust_lookup_failed_response(),
    }
}

/// **`POST …/market/acquisition/*`** 写路径（PD-009）：主钱包 + 发布保证金或信用免押 + 频控 + trust 门禁。
pub(crate) async fn ensure_acquisition_market_write_allowed(
    state: &ApiMetaState,
    pool: &sqlx::PgPool,
    user_id: Uuid,
) -> Result<(), axum::response::Response> {
    let user = match get_user_by_id(pool, user_id).await {
        Ok(Some(u)) => u,
        Ok(None) => return Err(acquisition_trust_restricted_response()),
        Err(e) => {
            eprintln!("WARN: get_user_by_id acquisition gate: {e}");
            return Err(acquisition_trust_lookup_failed_response());
        }
    };
    let (identity_status, risk_level) = if let Some(co) = state.chain_off.as_ref() {
        let store = co.store.read().await;
        if let Some(mem_user) = store.users.get(&user_id) {
            crate::chain_off::trust_gate_context_for_user(&store, user_id, mem_user)
        } else {
            crate::chain_off::trust_gate_context_for_user(&store, user_id, &user_to_chain_off_row(&user))
        }
    } else {
        ("active", "low")
    };

    match db::ensure_acquisition_publish_allowed(
        pool,
        &user,
        identity_status,
        risk_level,
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(key) => Err(acquisition_gate_error_response(key)),
    }
}

fn user_to_chain_off_row(u: &db::UserRow) -> crate::chain_off::UserRow {
    crate::chain_off::UserRow {
        id: u.id,
        email: u.email.clone(),
        password_hash: u.password_hash.clone(),
        role: u.role.clone(),
        kyc_status: u.kyc_status.clone(),
        nickname: u.nickname.clone(),
        avatar_url: u.avatar_url.clone(),
        default_wallet_address: u.default_wallet_address.clone(),
        created_at: u.created_at,
        updated_at: u.updated_at,
    }
}
