//! B-092：只读 **`GET /api/v1/governance/voting-power`**（当前委托图下的可投票权重；与计票 **冻结权重** 同源公式）。

use axum::extract::State;
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde_json::json;

use crate::routes::governance_delegation_store::{
    delegate_store, direct_delegator_count, is_delegating_away, voter_weight_units_now,
};
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

const WEIGHT_SSOT: &str = "delegation_units_v1";
const ANCHOR: &str = "B-092-GOV-VOTE-WEIGHT-DELEGATION-MVP";

/// GET /api/v1/governance/voting-power
pub async fn get_governance_voting_power(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let arc = delegate_store();
    let m = arc.read().await;

    let body = if let Some(uid) = viewer {
        if is_delegating_away(&m, uid) {
            let del = m.get(&uid).map(|d| d.to_string());
            json!({
                "status": "ok",
                "authenticated": true,
                "vote_kind": "signal_off_chain",
                "triggers_on_chain_execution": false,
                "weight_ssot": WEIGHT_SSOT,
                "anchor": ANCHOR,
                "can_cast_vote": false,
                "reason": "delegation_active_cannot_vote",
                "delegate_to": del,
                "delegator_count": serde_json::Value::Null,
                "total_weight_units": serde_json::Value::Null,
                "note": "Revoke delegation at DELETE /api/v1/governance/delegate to cast votes yourself (B-092)"
            })
        } else {
            let dc = direct_delegator_count(&m, uid);
            let tw = voter_weight_units_now(&m, uid);
            json!({
                "status": "ok",
                "authenticated": true,
                "vote_kind": "signal_off_chain",
                "triggers_on_chain_execution": false,
                "weight_ssot": WEIGHT_SSOT,
                "anchor": ANCHOR,
                "can_cast_vote": true,
                "delegate_to": serde_json::Value::Null,
                "delegator_count": dc,
                "total_weight_units": tw
            })
        }
    } else {
        json!({
            "status": "ok",
            "authenticated": false,
            "vote_kind": "signal_off_chain",
            "triggers_on_chain_execution": false,
            "weight_ssot": WEIGHT_SSOT,
            "anchor": ANCHOR,
            "can_cast_vote": serde_json::Value::Null,
            "delegate_to": serde_json::Value::Null,
            "delegator_count": serde_json::Value::Null,
            "total_weight_units": serde_json::Value::Null,
            "note": "Sign in to compute voting-power units (B-092)"
        })
    };

    mvp_headered(Json(body).into_response())
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/voting-power",
        get(get_governance_voting_power),
    )
}

