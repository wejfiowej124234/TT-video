//! `/api/v1/me/*` 扩展路由（wallet verify · 申请快照 · 注册草稿 · PD-009 bond）

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;

use crate::chain_off;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

fn login_required() -> impl IntoResponse {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "login_required", "message": "login_required"})),
    )
}

async fn require_uid(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Result<uuid::Uuid, impl IntoResponse> {
    extract_user_with_session_check(state, headers)
        .await
        .ok_or_else(login_required)
}

pub async fn get_me_steward_application(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/me/steward-application").into_response();
    };
    match crate::chain_off::get_steward_application_me_impl(co.clone(), uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_provider_application(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    if let Some(co) = state.chain_off.clone() {
        return match chain_off::get_provider_application_me_impl(co, uid).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("GET /api/v1/me/provider-application").into_response()
}

#[derive(Debug, Deserialize)]
pub(crate) struct WalletVerifyChallengeBody {
    wallet_address: String,
}

#[derive(Debug, Deserialize)]
pub(crate) struct WalletVerifyConfirmBody {
    challenge_id: String,
    signature: String,
}

pub async fn post_me_wallet_verify_challenge(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<WalletVerifyChallengeBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/me/wallet/verify/challenge").into_response();
    };
    let Some(ref pool) = co.db_pool else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "database_required", "message": "database_required"})),
        )
            .into_response();
    };
    let wallet = body.wallet_address.trim().to_string();
    if !wallet.starts_with("0x") || wallet.len() > 42 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_wallet_address", "message": "invalid_wallet_address"})),
        )
            .into_response();
    }
    let nonce = uuid::Uuid::new_v4();
    let expires_at = chrono::Utc::now() + chrono::Duration::seconds(600);
    let message = format!(
        "TravelTrust Wallet Verification\n\nWallet: {wallet}\nNonce: {nonce}\nExpires: {}",
        expires_at.to_rfc3339()
    );
    match db::insert_wallet_verify_challenge(
        pool,
        uid,
        &wallet,
        &nonce.to_string(),
        &message,
        expires_at,
    )
    .await
    {
        Ok(id) => Json(json!({
            "status": "ok",
            "challenge_id": id.to_string(),
            "message": message,
            "expires_at": expires_at.to_rfc3339()
        }))
        .into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "db_error", "message": "db_error"})),
        )
            .into_response(),
    }
}

pub async fn post_me_wallet_verify_confirm(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<WalletVerifyConfirmBody>,
) -> impl IntoResponse {
    let _uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let _ = &headers;
    let Ok(challenge_id) = uuid::Uuid::parse_str(body.challenge_id.trim()) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
        )
            .into_response();
    };
    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/me/wallet/verify/confirm").into_response();
    };
    let Some(ref pool) = co.db_pool else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "database_required", "message": "database_required"})),
        )
            .into_response();
    };
    match db::consume_wallet_verify_challenge_success(pool, challenge_id).await {
        Ok(0) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_or_expired_wallet_challenge",
                "message": "invalid_or_expired_wallet_challenge"
            })),
        )
            .into_response(),
        Ok(_) => {
            db::observe_did_wallet_verified(pool, _uid).await;
            Json(json!({
                "status": "ok",
                "verified": true
            }))
            .into_response()
        }
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "db_error", "message": "db_error"})),
        )
            .into_response(),
    }
}

pub async fn get_me_wallet_verification_status(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return not_impl_json("GET /api/v1/me/wallet/verification-status").into_response();
    };
    let checked_at = chrono::Utc::now();
    let ttl = 86_400_i64;
    if let Some(ref pool) = co.db_pool {
        if let Ok(Some(row)) = db::get_latest_verified_wallet_for_user(pool, uid).await {
            let age = (checked_at - row.verified_at).num_seconds().max(0);
            if age <= ttl {
                return Json(json!({
                    "status": "ok",
                    "verified": true,
                    "verification_method": "eip191_personal_sign",
                    "wallet_address": row.wallet_address,
                    "checked_at": checked_at.to_rfc3339(),
                    "verification_ttl_seconds": ttl,
                    "verification_age_seconds": age
                }))
                .into_response();
            }
        }
    }
    Json(json!({
        "status": "ok",
        "verified": false,
        "verification_method": "eip191_personal_sign",
        "checked_at": checked_at.to_rfc3339(),
        "verification_ttl_seconds": ttl
    }))
    .into_response()
}

#[derive(Debug, Deserialize)]
pub(crate) struct RegistrationDraftBody {
    draft: serde_json::Value,
}

pub async fn get_me_guide_registration_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    if state.chain_off.is_some() {
        return Json(json!({
            "status": "ok",
            "draft": {},
            "updated_at": null
        }))
        .into_response();
    }
    not_impl_json("GET /api/v1/me/guide-registration-draft").into_response()
}

pub async fn put_me_guide_registration_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<RegistrationDraftBody>,
) -> impl IntoResponse {
    let _uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    if !body.draft.is_object() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_draft", "message": "invalid_draft"})),
        )
            .into_response();
    }
    if state.chain_off.is_some() {
        return Json(json!({"status": "ok", "draft": body.draft})).into_response();
    }
    not_impl_json("PUT /api/v1/me/guide-registration-draft").into_response()
}

pub async fn get_me_guide_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/guide-profile").into_response();
    };
    match chain_off::get_me_guide_profile_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn patch_me_guide_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PatchMeGuideProfileBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("PATCH /api/v1/me/guide-profile").into_response();
    };
    match chain_off::patch_me_guide_profile_impl(co, uid, Json(body)).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_guide_exit_status(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/guide-exit-status").into_response();
    };
    match chain_off::get_me_guide_exit_status_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn post_me_guide_exit_request(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::GuideExitRequestBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("POST /api/v1/me/guide-exit-request").into_response();
    };
    match chain_off::post_me_guide_exit_request_impl(co, uid, Json(body)).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_publish_summary(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/publish-summary").into_response();
    };
    match chain_off::get_me_publish_summary_impl(co, state.chain_config.as_ref(), uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_merchant_listings_summary(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/merchant-listings-summary").into_response();
    };
    match chain_off::get_me_merchant_listings_summary_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_merchant_listings(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/merchant-listings").into_response();
    };
    match chain_off::get_me_merchant_listings_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_acquisition_listings(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/acquisition-listings").into_response();
    };
    match chain_off::get_me_acquisition_listings_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_merchant_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/merchant-profile").into_response();
    };
    match chain_off::get_me_merchant_profile_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn patch_me_merchant_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PatchMeMerchantProfileBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("PATCH /api/v1/me/merchant-profile").into_response();
    };
    match chain_off::patch_me_merchant_profile_impl(co, uid, Json(body)).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_region_steward_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/region-steward-profile").into_response();
    };
    match chain_off::get_me_region_steward_profile_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn patch_me_region_steward_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PatchMeRegionStewardProfileBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("PATCH /api/v1/me/region-steward-profile").into_response();
    };
    match chain_off::patch_me_region_steward_profile_impl(co, uid, Json(body)).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_acquisition_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("GET /api/v1/me/acquisition-profile").into_response();
    };
    match chain_off::get_me_acquisition_profile_impl(co, uid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn patch_me_acquisition_profile(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PatchMeAcquisitionProfileBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json("PATCH /api/v1/me/acquisition-profile").into_response();
    };
    match chain_off::patch_me_acquisition_profile_impl(co, uid, Json(body)).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn get_me_provider_registration_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    if state.chain_off.is_some() {
        return Json(json!({
            "status": "ok",
            "draft": {},
            "updated_at": null
        }))
        .into_response();
    }
    not_impl_json("GET /api/v1/me/provider-registration-draft").into_response()
}

pub async fn put_me_provider_registration_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<RegistrationDraftBody>,
) -> impl IntoResponse {
    let _uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    if !body.draft.is_object() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_draft", "message": "invalid_draft"})),
        )
            .into_response();
    }
    if state.chain_off.is_some() {
        return Json(json!({"status": "ok", "draft": body.draft})).into_response();
    }
    not_impl_json("PUT /api/v1/me/provider-registration-draft").into_response()
}

#[derive(Debug, Deserialize)]
pub(crate) struct AcquisitionBondBody {
    #[serde(default)]
    amount: Option<String>,
}

fn parse_bond_amount(raw: Option<String>, default: &str) -> Result<String, impl IntoResponse> {
    let s = raw
        .map(|a| a.trim().to_string())
        .filter(|a| !a.is_empty())
        .unwrap_or_else(|| default.to_string());
    if s.parse::<f64>().ok().filter(|&n| n > 0.0).is_some() {
        Ok(s)
    } else {
        Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_amount", "message": "invalid_amount"})),
        ))
    }
}

pub async fn post_me_acquisition_publish_bond(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AcquisitionBondBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let amount = match parse_bond_amount(body.amount, "50") {
        Ok(a) => a,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/me/acquisition/publish-bond").into_response();
    };
    let Some(ref pool) = co.db_pool else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "database_required", "message": "database_required"})),
        )
            .into_response();
    };
    match db::upsert_acquisition_publish_bond(pool, uid, &amount).await {
        Ok(()) => Json(json!({
            "status": "ok",
            "kind": "acquisition_publish_bond",
            "amount": amount,
            "currency": "USDC"
        }))
        .into_response(),
        Err(e) => {
            eprintln!("WARN: upsert_acquisition_publish_bond: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "db_error", "message": "db_error"})),
            )
                .into_response()
        }
    }
}

pub async fn post_me_acquisition_fulfillment_bond(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AcquisitionBondBody>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let amount = match parse_bond_amount(body.amount, "100") {
        Ok(a) => a,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return not_impl_json("POST /api/v1/me/acquisition/fulfillment-bond").into_response();
    };
    let Some(ref pool) = co.db_pool else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "database_required", "message": "database_required"})),
        )
            .into_response();
    };
    match db::upsert_acquisition_fulfillment_bond(pool, uid, &amount).await {
        Ok(()) => Json(json!({
            "status": "ok",
            "kind": "acquisition_fulfillment_bond",
            "amount": amount,
            "currency": "USDC"
        }))
        .into_response(),
        Err(e) => {
            eprintln!("WARN: upsert_acquisition_fulfillment_bond: {e}");
            (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "acquisition_fulfillment_bond_persist_failed",
                    "message": "acquisition_fulfillment_bond_persist_failed"
                })),
            )
                .into_response()
        }
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/me/steward-application",
            get(get_me_steward_application),
        )
        .route(
            "/api/v1/me/provider-application",
            get(get_me_provider_application),
        )
        .route(
            "/api/v1/me/wallet/verify/challenge",
            post(post_me_wallet_verify_challenge),
        )
        .route(
            "/api/v1/me/wallet/verify/confirm",
            post(post_me_wallet_verify_confirm),
        )
        .route(
            "/api/v1/me/wallet/verification-status",
            get(get_me_wallet_verification_status),
        )
        .route(
            "/api/v1/me/guide-registration-draft",
            get(get_me_guide_registration_draft).put(put_me_guide_registration_draft),
        )
        .route(
            "/api/v1/me/guide-profile",
            get(get_me_guide_profile).patch(patch_me_guide_profile),
        )
        .route(
            "/api/v1/me/guide-exit-status",
            get(get_me_guide_exit_status),
        )
        .route(
            "/api/v1/me/guide-exit-request",
            post(post_me_guide_exit_request),
        )
        .route(
            "/api/v1/me/merchant-profile",
            get(get_me_merchant_profile).patch(patch_me_merchant_profile),
        )
        .route(
            "/api/v1/me/publish-summary",
            get(get_me_publish_summary),
        )
        .route(
            "/api/v1/me/merchant-listings-summary",
            get(get_me_merchant_listings_summary),
        )
        .route(
            "/api/v1/me/merchant-listings",
            get(get_me_merchant_listings),
        )
        .route(
            "/api/v1/me/region-steward-profile",
            get(get_me_region_steward_profile).patch(patch_me_region_steward_profile),
        )
        .route(
            "/api/v1/me/acquisition-profile",
            get(get_me_acquisition_profile).patch(patch_me_acquisition_profile),
        )
        .route(
            "/api/v1/me/acquisition-listings",
            get(get_me_acquisition_listings),
        )
        .route(
            "/api/v1/me/provider-registration-draft",
            get(get_me_provider_registration_draft).put(put_me_provider_registration_draft),
        )
        .route(
            "/api/v1/me/acquisition/publish-bond",
            post(post_me_acquisition_publish_bond),
        )
        .route(
            "/api/v1/me/acquisition/fulfillment-bond",
            post(post_me_acquisition_fulfillment_bond),
        )
}
