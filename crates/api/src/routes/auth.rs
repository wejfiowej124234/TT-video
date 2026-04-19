//! /auth/*（48 §2.2 routes/auth）

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::Json;
use axum::Router;

use crate::chain_off;
use crate::routes::governance_proposals::exec_seed_governance_e2e;
use crate::state::ApiMetaState;

use super::not_impl_json;

pub async fn auth_register(
    State(state): State<ApiMetaState>,
    Json(body): Json<chain_off::AuthRegisterBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_register(co.clone(), Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/register").into_response()
}

/// POST /auth/seed-test-accounts：仅当 SEED_TEST_ACCOUNTS=1 时补建测试账号
pub async fn auth_seed_test_accounts(State(state): State<ApiMetaState>) -> impl IntoResponse {
    if std::env::var("SEED_TEST_ACCOUNTS").as_deref() != Ok("1") {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({"error": "seed_test_accounts_disabled", "message": "seed_test_accounts_disabled"})),
        )
            .into_response();
    }
    if let Some(ref co) = state.chain_off {
        chain_off::seed_test_accounts_if_empty(co).await;
        return (
            StatusCode::OK,
            Json(serde_json::json!({"status": "ok", "message": "seed_done"})),
        )
            .into_response();
    }
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(serde_json::json!({"error": "chain_off_unavailable", "message": "chain_off_unavailable"})),
    )
        .into_response()
}

/// POST /auth/seed-governance-e2e：与 **`seed-test-accounts`** 同源 **`SEED_TEST_ACCOUNTS=1`**；Governor+PG 时 upsert 投影 sentinel，否则重置链下 MVP 治理提案内存（**C-GOV-004** E2E）。
pub async fn auth_seed_governance_e2e(State(state): State<ApiMetaState>) -> impl IntoResponse {
    match exec_seed_governance_e2e(&state).await {
        Ok(j) => (StatusCode::OK, Json(j)).into_response(),
        Err((code, j)) => (code, Json(j)).into_response(),
    }
}

pub async fn auth_login(
    State(state): State<ApiMetaState>,
    Json(body): Json<chain_off::AuthLoginBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_login(co.clone(), Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/login").into_response()
}

pub async fn auth_logout(
    State(state): State<ApiMetaState>,
    headers: axum::http::HeaderMap,
    Json(_body): Json<serde_json::Value>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_logout(co.clone(), headers).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/logout").into_response()
}

pub async fn auth_refresh(
    State(state): State<ApiMetaState>,
    headers: axum::http::HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let token = body
        .get("refresh_token")
        .and_then(|v| v.as_str())
        .map(String::from)
        .or_else(|| {
            headers
                .get(axum::http::header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .map(|s| s.trim())
                .filter(|s| s.len() > 7 && s[..7].eq_ignore_ascii_case("bearer "))
                .map(|s| s[7..].trim().to_string())
        });
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_refresh(co.clone(), token).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/refresh").into_response()
}

pub async fn auth_verify_email(
    State(state): State<ApiMetaState>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_verify_email_stub(co.clone(), Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/verify-email").into_response()
}

pub async fn auth_forgot_password(
    State(state): State<ApiMetaState>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_forgot_password_stub(co.clone(), Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/forgot-password").into_response()
}

pub async fn auth_reset_password(
    State(state): State<ApiMetaState>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return match chain_off::auth_reset_password_stub(co.clone(), Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("/auth/reset-password").into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/auth/register", post(auth_register))
        .route("/auth/seed-test-accounts", post(auth_seed_test_accounts))
        .route("/auth/seed-governance-e2e", post(auth_seed_governance_e2e))
        .route("/auth/login", post(auth_login))
        .route("/auth/logout", post(auth_logout))
        .route("/auth/refresh", post(auth_refresh))
        .route("/auth/verify-email", post(auth_verify_email))
        .route("/auth/forgot-password", post(auth_forgot_password))
        .route("/auth/reset-password", post(auth_reset_password))
}
