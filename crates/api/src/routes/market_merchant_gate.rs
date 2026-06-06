//! 自由市场商家/收购写路径门闸：**`role` + 准入费 paid +（商家）资质申请 approved**。

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db::{find_paid_entitlement_for_role, get_user_by_id};
use crate::state::ApiMetaState;

pub(crate) fn merchant_role_required_response(expected_role: &'static str) -> axum::response::Response {
    (
        StatusCode::FORBIDDEN,
        Json(json!({
            "status": "error",
            "error": "merchant_role_required",
            "message": "merchant_role_required",
            "detail": "User role does not match market variant.",
            "expected_role": expected_role,
        })),
    )
        .into_response()
}

pub(crate) fn provider_application_not_approved_response() -> axum::response::Response {
    (
        StatusCode::FORBIDDEN,
        Json(json!({
            "status": "error",
            "error": "provider_application_not_approved",
            "message": "provider_application_not_approved",
            "detail": "Merchant onboarding application must be approved before publishing.",
        })),
    )
        .into_response()
}

pub(crate) fn onboarding_entitlement_required_response(
    role_target: &'static str,
) -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "status": "error",
            "error": "onboarding_entitlement_required",
            "message": "onboarding_entitlement_required",
            "detail": "No paid entitlement for required role.",
            "role_target": role_target,
        })),
    )
        .into_response()
}

pub(crate) fn onboarding_entitlement_lookup_failed_response() -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({
            "status": "error",
            "error": "onboarding_entitlement_lookup_failed",
            "message": "onboarding_entitlement_lookup_failed",
        })),
    )
        .into_response()
}

async fn provider_application_approved_pg(
    pool: &sqlx::PgPool,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let ok: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM role_applications
            WHERE user_id = $1 AND kind = 'provider_onboarding' AND status = 'approved'
        )
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(ok)
}

async fn provider_application_approved_chain_off(
    _state: &ApiMetaState,
    _user_id: Uuid,
) -> bool {
    false
}

async fn ensure_paid_entitlement(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    role_target: &'static str,
) -> Result<(), axum::response::Response> {
    match find_paid_entitlement_for_role(pool, user_id, role_target).await {
        Ok(Some(_)) => Ok(()),
        Ok(None) => Err(onboarding_entitlement_required_response(role_target)),
        Err(e) => {
            eprintln!("WARN: find_paid_entitlement_for_role market gate: {e}");
            Err(onboarding_entitlement_lookup_failed_response())
        }
    }
}

use super::acquisition_publish_gate::ensure_acquisition_market_write_allowed;

/// **`POST …/market/provider/*`** 写路径：须 **`users.role=provider`**、**`onboarding_entitlements` paid**、**`provider_onboarding` approved**。
pub(crate) async fn ensure_provider_market_write_allowed(
    state: &ApiMetaState,
    pool: &sqlx::PgPool,
    user_id: Uuid,
) -> Result<(), axum::response::Response> {
    let user = match get_user_by_id(pool, user_id).await {
        Ok(Some(u)) => u,
        Ok(None) => return Err(merchant_role_required_response("provider")),
        Err(e) => {
            eprintln!("WARN: get_user_by_id market gate: {e}");
            return Err(onboarding_entitlement_lookup_failed_response());
        }
    };
    if user.role != "provider" {
        return Err(merchant_role_required_response("provider"));
    }

    ensure_paid_entitlement(pool, user_id, "provider").await?;

    let approved_pg = provider_application_approved_pg(pool, user_id).await.map_err(|e| {
        eprintln!("WARN: provider_application_approved_pg: {e}");
        onboarding_entitlement_lookup_failed_response()
    })?;
    let approved_mem = provider_application_approved_chain_off(state, user_id).await;
    if !approved_pg && !approved_mem {
        return Err(provider_application_not_approved_response());
    }

    Ok(())
}

pub(crate) async fn ensure_market_merchant_write_allowed(
    state: &ApiMetaState,
    pool: &sqlx::PgPool,
    user_id: Uuid,
    variant: &'static str,
) -> Result<(), axum::response::Response> {
    match variant {
        "provider" => ensure_provider_market_write_allowed(state, pool, user_id).await,
        "acquisition" => ensure_acquisition_market_write_allowed(state, pool, user_id).await,
        _ => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "invalid_variant",
                "message": "invalid_variant",
            })),
        )
            .into_response()),
    }
}
