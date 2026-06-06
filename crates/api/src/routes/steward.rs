//! 区域主理人 stake 公开只读 + **`POST /steward/applications`**（Protocol Convergence P2）

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::chain::steward_stake_pool;
use crate::chain_off;
use crate::routes::governance_doc_reference::steward_stake_quote_for_jurisdictions;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

#[derive(Debug, Deserialize)]
pub struct StewardStakeQuoteQuery {
    pub jurisdictions: String,
}

#[derive(Debug, Deserialize)]
pub struct StewardStakeStatusQuery {
    pub jurisdiction: String,
    /// 可选；未传时尝试从登录用户 `default_wallet_address` 解析
    pub wallet: Option<String>,
}

pub async fn get_steward_stake_quote(Query(q): Query<StewardStakeQuoteQuery>) -> impl IntoResponse {
    let ids: Vec<String> = q
        .jurisdictions
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    match steward_stake_quote_for_jurisdictions(&ids) {
        Ok(j) => Json(j).into_response(),
        Err(code) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": code, "message": code})),
        )
            .into_response(),
    }
}

pub async fn get_steward_stake_status(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<StewardStakeStatusQuery>,
) -> impl IntoResponse {
    let wallet = match q.wallet.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        Some(w) => w.to_string(),
        None => {
            if let Some(uid) = extract_user_with_session_check(&state, &headers).await {
                if let Some(ref co) = state.chain_off {
                    let store = co.store.read().await;
                    if let Some(u) = store.users.get(&uid) {
                        if let Some(ref w) = u.default_wallet_address {
                            let wallet = w.clone();
                            drop(store);
                            return stake_status_impl(&state, &q.jurisdiction, &wallet).await;
                        }
                    }
                }
            }
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "wallet_required",
                    "message": "wallet query param or logged-in default_wallet required"
                })),
            )
                .into_response();
        }
    };
    stake_status_impl(&state, &q.jurisdiction, &wallet).await
}

async fn stake_status_impl(
    state: &ApiMetaState,
    jurisdiction: &str,
    wallet: &str,
) -> axum::response::Response {
    if steward_stake_pool::jurisdiction_bytes2(jurisdiction).is_err() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_jurisdiction", "message": "invalid_jurisdiction"})),
        )
            .into_response();
    }
    let Some(ref cfg) = state.chain_config else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "CHAIN_RPC_URL not loaded; stake-status requires chain mode"
            })),
        )
            .into_response();
    };
    let Some(pool) = steward_stake_pool::region_steward_stake_pool_address() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "stake_pool_not_configured",
                "message": "REGION_STEWARD_STAKE_POOL_ADDRESS not set"
            })),
        )
            .into_response();
    };
    let doc_quote =
        steward_stake_quote_for_jurisdictions(&[jurisdiction.trim().to_uppercase()]);
    let min_stake =
        match steward_stake_pool::eth_call_min_stake_amount(cfg, &pool, jurisdiction).await {
            Ok(v) => v,
            Err(e) => {
                let code = steward_stake_pool::classify_eth_call_err(&e);
                let status = if code == "eth_call_failed" {
                    StatusCode::BAD_GATEWAY
                } else {
                    StatusCode::SERVICE_UNAVAILABLE
                };
                return (
                    status,
                    Json(json!({"error": code, "message": e})),
                )
                    .into_response();
            }
        };
    let has_stake = match steward_stake_pool::eth_call_has_jurisdiction_stake(
        cfg,
        &pool,
        wallet,
        jurisdiction,
    )
    .await
    {
        Ok(v) => v,
        Err(e) => {
            let code = steward_stake_pool::classify_eth_call_err(&e);
            let status = if code == "eth_call_failed" {
                StatusCode::BAD_GATEWAY
            } else {
                StatusCode::SERVICE_UNAVAILABLE
            };
            return (
                status,
                Json(json!({"error": code, "message": e})),
            )
                .into_response();
        }
    };
    let mut body = json!({
        "jurisdiction": jurisdiction.trim().to_uppercase(),
        "wallet": wallet,
        "has_jurisdiction_stake": has_stake,
        "min_stake_amount": min_stake,
        "pool_address": pool,
        "chain_id": cfg.chain_id,
        "meta": {
            "implementation_status": "steward_stake_status_eth_call",
            "phase": "②_anvil_or_testnet"
        }
    });
    if let Ok(q) = doc_quote {
        body["doc_ssot_quote"] = q;
    }
    Json(body).into_response()
}

pub async fn post_steward_applications(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PostStewardApplicationBody>,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/steward/applications").into_response();
    };
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
    };
    match chain_off::post_steward_application_impl(co.clone(), uid, Json(body)).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/steward/stake-quote", get(get_steward_stake_quote))
        .route("/api/v1/steward/stake-status", get(get_steward_stake_status))
        .route(
            "/api/v1/steward/applications",
            post(post_steward_applications),
        )
}
