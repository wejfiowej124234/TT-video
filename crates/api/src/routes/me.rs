//! /api/v1/me（48 §2.2 routes/me）

use axum::extract::State;
use axum::http::HeaderMap;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, put};
use axum::Json;
use axum::Router;
use serde::Serialize;
use serde_json::json;

use crate::chain_off;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

#[derive(Debug, Serialize)]
struct MeResponse {
    status: &'static str,
    user: serde_json::Value,
}

pub async fn get_me(State(state): State<ApiMetaState>, headers: HeaderMap) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        match extract_user_with_session_check(&state, &headers).await {
            Some(uid) => match chain_off::get_me_impl(co.clone(), uid).await {
                Ok(j) => j.into_response(),
                Err((code, j)) => {
                    // 用户不在 store（如未 seed 或重启后 session 残留）时返回 401，前端统一当未登录处理，避免 404
                    let status = if code == StatusCode::NOT_FOUND {
                        StatusCode::UNAUTHORIZED
                    } else {
                        code
                    };
                    (status, j).into_response()
                }
            },
            None => (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response(),
        }
    } else {
        Json(MeResponse {
            status: "ok",
            user: json!({
                "id": "anonymous",
                "role": "guest",
                "rule": "当前为占位：鉴权未实现；订单/资金终态必须来自链上事件/后端投影，前端不得自推状态",
            }),
        })
        .into_response()
    }
}

pub async fn put_me(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PutMeBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        return match chain_off::put_me_impl(co.clone(), uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("PUT /api/v1/me").into_response()
}

pub async fn get_me_wallets(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        match extract_user_with_session_check(&state, &headers).await {
            Some(uid) => match chain_off::get_me_wallets_impl(co.clone(), uid).await {
                Ok(j) => j.into_response(),
                Err((code, j)) => (code, j).into_response(),
            },
            None => (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response(),
        }
    } else {
        not_impl_json("GET /api/v1/me/wallets").into_response()
    }
}

pub async fn get_me_role_applications(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        match extract_user_with_session_check(&state, &headers).await {
            Some(uid) => match chain_off::get_me_role_applications_impl(co.clone(), uid).await {
                Ok(j) => j.into_response(),
                Err((code, j)) => (code, j).into_response(),
            },
            None => (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response(),
        }
    } else {
        not_impl_json("GET /api/v1/me/role-applications").into_response()
    }
}

pub async fn get_me_stats(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        match extract_user_with_session_check(&state, &headers).await {
            Some(uid) => match chain_off::get_me_impl(co.clone(), uid).await {
                Ok(Json(me)) => {
                    let stats = me.get("stats").cloned().unwrap_or_else(|| json!({}));
                    return Json(json!({ "status": "ok", "stats": stats })).into_response();
                }
                Err((code, j)) => return (code, j).into_response(),
            },
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        }
    }
    Json(json!({
        "status": "ok",
        "stats": { "orders_total": 0, "disputes_total": 0 },
        "note": "占位：与 /api/v1/me 二选一或并存"
    }))
    .into_response()
}

pub async fn put_me_password(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PutMePasswordBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        match extract_user_with_session_check(&state, &headers).await {
            Some(uid) => {
                return match chain_off::put_me_password(co.clone(), uid, body).await {
                    Ok(j) => j.into_response(),
                    Err((code, j)) => (code, j).into_response(),
                };
            }
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response();
            }
        }
    }
    not_impl_json("PUT /api/v1/me/password").into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/me", get(get_me).put(put_me))
        .route("/api/v1/me/", get(get_me).put(put_me))
        .route("/api/v1/me/stats", get(get_me_stats))
        .route("/api/v1/me/wallets", get(get_me_wallets))
        .route("/api/v1/me/role-applications", get(get_me_role_applications))
        .route("/api/v1/me/password", put(put_me_password))
        .merge(super::me_profile_avatar::router())
}
