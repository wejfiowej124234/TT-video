use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use crate::db::{admin_onboarding_entitlement_detail_json, list_entitlements_for_user};
use crate::state::ApiMetaState;

use super::helpers::parse_user_path_id;

pub async fn get_admin_user_onboarding_entitlements(
    State(state): State<ApiMetaState>,
    Path(user_id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match super::super::admin_rbac::require_admin_permission(
        &state,
        &headers,
        super::super::admin_rbac::PERM_ONBOARDING_READ,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let target_id = match parse_user_path_id(&user_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };

    let Some(ref co) = state.chain_off else {
        return super::super::not_impl_json(
            "GET /api/v1/admin/users/:id/onboarding-entitlements",
        )
        .into_response();
    };    {
        let store = co.store.read().await;
        if !store.users.contains_key(&target_id) {
            return (
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("user_not_found")),
            )
                .into_response();
        }
    };    let rows = match list_entitlements_for_user(pool, target_id).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };
    let ents: Vec<Value> = rows
        .iter()
        .map(admin_onboarding_entitlement_detail_json)
        .collect();
    let mut body = json!({
        "status": "ok",
        "user_id": target_id,
        "entitlements": ents,
    });
    super::super::admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
