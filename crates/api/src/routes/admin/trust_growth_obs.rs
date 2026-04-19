//! P-OBS1：信任增长可观测与人工控制（admin）

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::db::{
    trust_growth_get_control, trust_growth_observability_snapshot, trust_growth_patch_control_and_refresh,
};
use crate::state::ApiMetaState;

use super::{admin_db_pool_required, request_id_from_headers, require_admin_actor, write_admin_audit_log_best_effort};

#[derive(Debug, Deserialize, Default)]
pub struct TrustGrowthControlPatchBody {
    pub weights_frozen: Option<bool>,
    pub force_control_only: Option<bool>,
    pub variant_weight_caps: Option<serde_json::Value>,
}

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new()
        .route(
            "/api/v1/admin/trust-growth/observability",
            axum::routing::get(get_trust_growth_observability),
        )
        .route(
            "/api/v1/admin/trust-growth/control",
            axum::routing::patch(patch_trust_growth_control),
        )
        .route(
            "/api/v1/admin/trust-growth/rollback-control",
            axum::routing::post(post_trust_growth_rollback_control),
        )
}

async fn get_trust_growth_observability(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _actor = match require_admin_actor(&state, &headers).await {
        Ok(a) => a,
        Err(resp) => return resp,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    match trust_growth_observability_snapshot(pool).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "ok": false, "error": "trust_growth_observability_failed", "message": e })),
        )
            .into_response(),
    }
}

async fn patch_trust_growth_control(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<TrustGrowthControlPatchBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(a) => a,
        Err(resp) => return resp,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let mut merged = match trust_growth_get_control(pool).await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "ok": false, "error": "control_read_failed", "message": e.to_string() })),
            )
                .into_response();
        }
    };
    if let Some(w) = body.weights_frozen {
        merged.weights_frozen = w;
    }
    if let Some(f) = body.force_control_only {
        merged.force_control_only = f;
    }
    if let Some(v) = body.variant_weight_caps {
        merged.variant_weight_caps = v;
    }

    match trust_growth_patch_control_and_refresh(pool, merged).await {
        Ok((control, gen, moments)) => {
            let rid = request_id_from_headers(&headers);
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                rid.as_deref(),
                "trust_growth_control_patch",
                Some("trust_growth_control"),
                None,
                json!({
                    "weights_frozen": control.weights_frozen,
                    "force_control_only": control.force_control_only,
                    "autopilot_generation": gen,
                }),
            )
            .await;
            (
                StatusCode::OK,
                Json(json!({
                    "ok": true,
                    "control": {
                        "weights_frozen": control.weights_frozen,
                        "force_control_only": control.force_control_only,
                        "variant_weight_caps": control.variant_weight_caps,
                    },
                    "runtime": {
                        "autopilot_generation": gen,
                        "moments": moments,
                    }
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "ok": false, "error": "trust_growth_control_patch_failed", "message": e })),
        )
            .into_response(),
    }
}

async fn post_trust_growth_rollback_control(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(a) => a,
        Err(resp) => return resp,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let mut merged = match trust_growth_get_control(pool).await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "ok": false, "error": "control_read_failed", "message": e.to_string() })),
            )
                .into_response();
        }
    };
    merged.force_control_only = true;
    merged.weights_frozen = false;
    merged.variant_weight_caps = json!({});

    match trust_growth_patch_control_and_refresh(pool, merged).await {
        Ok((control, gen, moments)) => {
            let rid = request_id_from_headers(&headers);
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                rid.as_deref(),
                "trust_growth_rollback_control",
                Some("trust_growth_control"),
                None,
                json!({ "force_control_only": true, "autopilot_generation": gen }),
            )
            .await;
            (
                StatusCode::OK,
                Json(json!({
                    "ok": true,
                    "control": {
                        "weights_frozen": control.weights_frozen,
                        "force_control_only": control.force_control_only,
                        "variant_weight_caps": control.variant_weight_caps,
                    },
                    "runtime": {
                        "autopilot_generation": gen,
                        "moments": moments,
                    }
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "ok": false, "error": "trust_growth_rollback_failed", "message": e })),
        )
            .into_response(),
    }
}
