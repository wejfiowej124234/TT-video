//! `/api/v1/me/sessions*` · `/api/v1/me/security-notifications`（账号安全中心 · 04 §3.4）

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{delete, get};
use axum::Json;
use axum::Router;
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

fn login_required() -> impl IntoResponse {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "login_required", "message": "login_required"})),
    )
}

fn chain_off_unavailable(method_path: &str) -> impl IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "chain_off_unavailable",
            "message": "chain_off_unavailable",
            "path": method_path,
        })),
    )
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let auth = headers
        .get(axum::http::header::AUTHORIZATION)?
        .to_str()
        .ok()?;
    let s = auth.trim();
    if s.len() < 8 || !s[..7].eq_ignore_ascii_case("bearer ") {
        return None;
    }
    let token = s[7..].trim();
    if token.is_empty() {
        return None;
    }
    Some(token.to_string())
}

async fn require_uid(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Result<Uuid, impl IntoResponse> {
    extract_user_with_session_check(state, headers)
        .await
        .ok_or_else(login_required)
}

fn session_token_suffix(token: &str) -> String {
    const SUFFIX_LEN: usize = 6;
    if token.len() <= SUFFIX_LEN {
        token.to_string()
    } else {
        token[token.len() - SUFFIX_LEN..].to_string()
    }
}

fn session_item_json(token: &str, is_current: bool, created_at: chrono::DateTime<Utc>) -> Value {
    json!({
        "session_token_suffix": session_token_suffix(token),
        "is_current": is_current,
        "created_at": created_at.to_rfc3339(),
        "last_seen_at": null,
        "expires_at": null,
        "idle_expires_at": null,
        "revoked_at": null,
        "revoked_reason": null,
    })
}

pub async fn get_me_sessions(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable("GET /api/v1/me/sessions").into_response();
    };
    let current = bearer_token(&headers);

    if let Some(ref pool) = co.db_pool {
        match db::list_sessions_for_user(pool, uid).await {
            Ok(rows) => {
                let items: Vec<Value> = rows
                    .into_iter()
                    .map(|r| {
                        let is_current = current.as_deref().is_some_and(|t| t == r.token);
                        json!({
                            "session_token_suffix": session_token_suffix(&r.token),
                            "is_current": is_current,
                            "created_at": r.created_at.to_rfc3339(),
                            "last_seen_at": r.last_seen_at.map(|t| t.to_rfc3339()),
                            "expires_at": r.expires_at.map(|t| t.to_rfc3339()),
                            "idle_expires_at": r.idle_expires_at.map(|t| t.to_rfc3339()),
                            "revoked_at": r.revoked_at.map(|t| t.to_rfc3339()),
                            "revoked_reason": r.revoked_reason,
                        })
                    })
                    .collect();
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "meta": { "implementation_status": "sessions_db" }
                }))
                .into_response();
            }
            Err(e) => {
                eprintln!("[me_sessions] list_sessions_for_user err={e}");
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "status": "error",
                        "error": "sessions_db_read_failed",
                        "message": "sessions_db_read_failed"
                    })),
                )
                    .into_response();
            }
        }
    }

    let items = {
        let store = co.store.read().await;
        let mut out: Vec<Value> = store
            .sessions
            .iter()
            .filter(|(_, u)| **u == uid)
            .map(|(token, _)| {
                let is_current = current.as_deref().is_some_and(|t| t == token.as_str());
                session_item_json(token, is_current, Utc::now())
            })
            .collect();
        out.sort_by(|a, b| {
            let ca = a.get("created_at").and_then(|v| v.as_str()).unwrap_or("");
            let cb = b.get("created_at").and_then(|v| v.as_str()).unwrap_or("");
            cb.cmp(ca)
        });
        out
    };
    Json(json!({
        "status": "ok",
        "items": items,
        "meta": { "implementation_status": "sessions_memory" }
    }))
    .into_response()
}

async fn revoke_session_token(
    co: &chain_off::ChainOffState,
    token: &str,
) -> Result<(), (StatusCode, Json<Value>)> {
    {
        let mut store = co.store.write().await;
        store.sessions.remove(token);
    }
    if let Some(ref pool) = co.db_pool {
        if let Err(e) = db::delete_session(pool, token).await {
            eprintln!("[me_sessions] delete_session err={e}");
            if chain_off::strict_auth_db_write_enabled() {
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "sessions_db_revoke_failed",
                        "message": "sessions_db_revoke_failed"
                    })),
                ));
            }
        }
    }
    Ok(())
}

pub async fn delete_me_session_current(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable("DELETE /api/v1/me/sessions/current").into_response();
    };
    let Some(token) = bearer_token(&headers) else {
        return login_required().into_response();
    };
    if extract_user_with_session_check(&state, &headers).await.is_none() {
        return login_required().into_response();
    }
    match revoke_session_token(co, &token).await {
        Ok(()) => Json(json!({"status": "ok"})).into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn delete_me_session_by_suffix(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(suffix): Path<String>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable("DELETE /api/v1/me/sessions/:suffix").into_response();
    };
    let current = bearer_token(&headers);
    let suffix = suffix.trim();
    if suffix.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_session_suffix", "message": "invalid_session_suffix"})),
        )
            .into_response();
    }
    if current.as_deref().is_some_and(|t| session_token_suffix(t) == suffix || t == suffix) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "cannot_revoke_current_session_by_suffix",
                "message": "cannot_revoke_current_session_by_suffix"
            })),
        )
            .into_response();
    }

    let target_token = if let Some(ref pool) = co.db_pool {
        match db::find_session_token_by_suffix_for_user(pool, uid, suffix, current.as_deref()).await {
            Ok(Some(t)) => Some(t),
            Ok(None) => None,
            Err(e) => {
                eprintln!("[me_sessions] find_session_token_by_suffix err={e}");
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "sessions_db_read_failed",
                        "message": "sessions_db_read_failed"
                    })),
                )
                    .into_response();
            }
        }
    } else {
        let store = co.store.read().await;
        store
            .sessions
            .iter()
            .find(|(token, u)| {
                **u == uid
                    && (session_token_suffix(token) == suffix || token.as_str() == suffix)
                    && current.as_deref() != Some(token.as_str())
            })
            .map(|(t, _)| t.clone())
    };

    let Some(token) = target_token else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "session_not_found", "message": "session_not_found"})),
        )
            .into_response();
    };

    match revoke_session_token(co, &token).await {
        Ok(()) => Json(json!({"status": "ok"})).into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub(crate) struct MeSecurityNotificationsQuery {
    limit: Option<i64>,
    status: Option<String>,
    event_type: Option<String>,
}

pub async fn get_me_security_notifications(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<MeSecurityNotificationsQuery>,
) -> impl IntoResponse {
    let uid = match require_uid(&state, &headers).await {
        Ok(u) => u,
        Err(r) => return r.into_response(),
    };
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable("GET /api/v1/me/security-notifications").into_response();
    };
    let limit = q.limit.unwrap_or(50).clamp(1, 100);
    let status = q.status.as_deref().filter(|s| !s.is_empty());
    let event_type = q.event_type.as_deref().filter(|s| !s.is_empty());

    let Some(ref pool) = co.db_pool else {
        return Json(json!({
            "status": "ok",
            "items": [],
            "meta": { "implementation_status": "user_security_notifications_db_unavailable" }
        }))
        .into_response();
    };

    match db::list_user_security_notifications(pool, uid, status, event_type, limit).await {
        Ok(rows) => {
            let items: Vec<Value> = rows
                .into_iter()
                .map(|r| {
                    json!({
                        "id": r.id.to_string(),
                        "event_type": r.event_type,
                        "template_key": r.template_key,
                        "delivery_status": r.delivery_status,
                        "payload": r.payload,
                        "attempts": r.attempts,
                        "last_error": r.last_error,
                        "created_at": r.created_at.to_rfc3339(),
                    })
                })
                .collect();
            Json(json!({
                "status": "ok",
                "items": items,
                "meta": { "implementation_status": "user_security_notifications_db" }
            }))
            .into_response()
        }
        Err(e) => {
            eprintln!("[me_security_notifications] list err={e}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "me_security_notifications_db_read_failed",
                    "message": "me_security_notifications_db_read_failed"
                })),
            )
                .into_response()
        }
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/me/sessions", get(get_me_sessions))
        .route(
            "/api/v1/me/sessions/current",
            delete(delete_me_session_current),
        )
        .route(
            "/api/v1/me/sessions/:suffix",
            delete(delete_me_session_by_suffix),
        )
        .route(
            "/api/v1/me/security-notifications",
            get(get_me_security_notifications),
        )
}
