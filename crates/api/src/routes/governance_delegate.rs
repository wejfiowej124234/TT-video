//! B-073：链下 MVP — **`GET|POST|DELETE /api/v1/governance/delegate`**（内存委托表；与 04 §三 登记一致）。
//! **POST** 设置 **`delegate_to`**（UUID）；**DELETE** 撤销；**GET** 匿名可读 **`authenticated:false`**，已登录返回当前 **`delegate_to`**。
//! 回执体含 **`request_id`**（取自 **`x-request-id`** 或生成 UUID）、**`tx_hash:null`**（链下无链上交易）。

use axum::extract::State;
use axum::http::header::{HeaderMap, HeaderName, HeaderValue};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::routes::governance_delegation_store::delegate_store;
use crate::state::{extract_user_with_session_check, ApiMetaState};

const IMPL_HEADER: &str = "x-implementation-status";
const IMPL_VALUE: &str = "chain_off_mvp";

fn mvp_headered(mut res: axum::response::Response) -> axum::response::Response {
    res.headers_mut().insert(
        HeaderName::from_static(IMPL_HEADER),
        HeaderValue::from_static(IMPL_VALUE),
    );
    res
}

fn request_id_from_headers(headers: &HeaderMap) -> String {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| Uuid::new_v4().to_string())
}

/// GET /api/v1/governance/delegate
pub async fn get_governance_delegate(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let rid = request_id_from_headers(&headers);
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let Some(uid) = viewer else {
        return mvp_headered(
            Json(json!({
                "status": "ok",
                "authenticated": false,
                "delegate_to": serde_json::Value::Null,
                "request_id": rid,
                "data_source": "chain_off_mvp",
                "note": "Sign in to view or set voting delegation (B-073 MVP)"
            }))
            .into_response(),
        );
    };
    let arc = delegate_store();
    let g = arc.read().await;
    let del = g.get(&uid).map(|d| d.to_string());
    mvp_headered(
        Json(json!({
            "status": "ok",
            "authenticated": true,
            "delegate_to": del,
            "request_id": rid,
            "data_source": "chain_off_mvp"
        }))
        .into_response(),
    )
}

#[derive(Debug, Deserialize)]
pub struct DelegateBody {
    pub delegate_to: String,
}

/// POST /api/v1/governance/delegate — body `{ "delegate_to": "<uuid>" }`
pub async fn post_governance_delegate(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<DelegateBody>,
) -> impl IntoResponse {
    let rid = request_id_from_headers(&headers);
    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "login_required", "message": "login_required", "request_id": rid})),
        )
            .into_response();
    };
    let target_raw = body.delegate_to.trim();
    let Ok(target) = Uuid::parse_str(target_raw) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_delegate_to",
                "message": "invalid_delegate_to",
                "request_id": rid
            })),
        )
            .into_response();
    };
    if target == uid {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "cannot_delegate_to_self",
                "message": "cannot_delegate_to_self",
                "request_id": rid
            })),
        )
            .into_response();
    }
    let arc = delegate_store();
    let mut g = arc.write().await;
    let idempotent = g.get(&uid).copied() == Some(target);
    g.insert(uid, target);
    mvp_headered(
        Json(json!({
            "status": "ok",
            "delegate_to": target.to_string(),
            "request_id": rid,
            "tx_hash": serde_json::Value::Null,
            "implementation_note": "chain_off_mvp_no_onchain_tx",
            "idempotent": idempotent
        }))
        .into_response(),
    )
}

/// DELETE /api/v1/governance/delegate
pub async fn delete_governance_delegate(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let rid = request_id_from_headers(&headers);
    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "login_required", "message": "login_required", "request_id": rid})),
        )
            .into_response();
    };
    let arc = delegate_store();
    let mut g = arc.write().await;
    if g.remove(&uid).is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "no_active_delegation",
                "message": "no_active_delegation",
                "request_id": rid
            })),
        )
            .into_response();
    }
    mvp_headered(
        Json(json!({
            "status": "ok",
            "delegate_to": serde_json::Value::Null,
            "request_id": rid,
            "tx_hash": serde_json::Value::Null,
            "implementation_note": "chain_off_mvp_no_onchain_tx"
        }))
        .into_response(),
    )
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/delegate",
        get(get_governance_delegate)
            .post(post_governance_delegate)
            .delete(delete_governance_delegate),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use axum::extract::State;
    use http_body_util::BodyExt;

    fn headers_user(uid: &Uuid) -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert(
            axum::http::header::HeaderName::from_static("x-user-id"),
            axum::http::HeaderValue::from_str(&uid.to_string()).expect("h"),
        );
        h
    }

    #[tokio::test]
    async fn get_delegate_anonymous_ok_unauthenticated() {
        let res = get_governance_delegate(State(api_meta_state(None)), HeaderMap::new())
            .await
            .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v["status"], "ok");
        assert_eq!(v["authenticated"], false);
    }

    #[tokio::test]
    async fn post_delegate_requires_login() {
        let res = post_governance_delegate(
            State(api_meta_state(None)),
            HeaderMap::new(),
            Json(DelegateBody {
                delegate_to: Uuid::new_v4().to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn post_revoke_roundtrip_distinct_users() {
        let me = Uuid::new_v4();
        let other = Uuid::new_v4();
        assert_ne!(me, other);
        let h = headers_user(&me);

        let r1 = post_governance_delegate(
            State(api_meta_state(None)),
            h.clone(),
            Json(DelegateBody {
                delegate_to: other.to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(r1.status(), StatusCode::OK);

        let g1 = get_governance_delegate(State(api_meta_state(None)), h.clone())
            .await
            .into_response();
        let b1 = g1.into_body().collect().await.unwrap().to_bytes();
        let j1: serde_json::Value = serde_json::from_slice(&b1).expect("json");
        let expected = other.to_string();
        assert_eq!(j1["delegate_to"].as_str(), Some(expected.as_str()));

        let r2 = delete_governance_delegate(State(api_meta_state(None)), h.clone())
            .await
            .into_response();
        assert_eq!(r2.status(), StatusCode::OK);

        let g2 = get_governance_delegate(State(api_meta_state(None)), h)
            .await
            .into_response();
        let b2 = g2.into_body().collect().await.unwrap().to_bytes();
        let j2: serde_json::Value = serde_json::from_slice(&b2).expect("json");
        assert!(j2["delegate_to"].is_null());

        let r3 = delete_governance_delegate(State(api_meta_state(None)), headers_user(&me))
            .await
            .into_response();
        assert_eq!(r3.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn post_delegate_self_400() {
        let me = Uuid::new_v4();
        let res = post_governance_delegate(
            State(api_meta_state(None)),
            headers_user(&me),
            Json(DelegateBody {
                delegate_to: me.to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    }
}
