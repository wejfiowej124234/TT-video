//! Admin **cross-check** / **drift-summary** 只读（**04 §3.5**、Task C-1）。

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::routes::admin_cross_check;
use crate::state::ApiMetaState;

use super::{
    admin_attach_meta_build, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};

/// **Task C-1**：多源对拍只读 JSON（**`fee-pool-aggregates`** 投影、**`governance/pool`**、**`protocol-reference`** 镜像）；**不**改写各源 handler。
pub async fn get_admin_cross_check(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let mut body = match admin_cross_check::build_admin_cross_check_value(&state).await {
        Ok(v) => v,
        Err(detail) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "status": "error",
                    "error": "cross_check_upstream_failed",
                    "message": "cross_check_upstream_failed",
                    "detail": detail,
                })),
            )
                .into_response();
        }
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.cross_check.read",
        Some("governance"),
        None,
        json!({}),
    )
    .await;

    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// **只读**：**`fee-pool-aggregates.cross_check`** 与 **`protocol-reference`** 重算切片对拍（见 **`drift_summary`** 与 **`admin_cross_check::summarize_fee_pool_protocol_drift`**）。
pub async fn get_admin_drift_summary(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let cross = match admin_cross_check::build_admin_cross_check_value(&state).await {
        Ok(v) => v,
        Err(detail) => {
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({
                    "status": "error",
                    "error": "cross_check_upstream_failed",
                    "message": "cross_check_upstream_failed",
                    "detail": detail,
                })),
            )
                .into_response();
        }
    };
    let drift = cross.get("drift_summary").cloned().unwrap_or(json!({
        "drift_detected": true,
        "delta": [json!({"field": "drift_summary", "expected": "object", "actual": null})],
    }));

    let mut body = json!({
        "status": "ok",
        "drift_detected": drift["drift_detected"],
        "delta": drift["delta"],
    });

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.drift_summary.read",
        Some("governance"),
        None,
        json!({
            "drift_detected": drift["drift_detected"],
            "delta_len": drift["delta"].as_array().map(Vec::len).unwrap_or(0),
        }),
    )
    .await;

    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
