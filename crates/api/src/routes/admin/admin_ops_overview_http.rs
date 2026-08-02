//! GET /api/v1/admin/ops-overview — Production Ops Overview aggregate (B-ADMIN-001).
//! Minimal mount so Admin consumers have a stable route; no Sidebar/IA/visual changes.

use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde_json::json;

use crate::state::ApiMetaState;

use super::admin_attach_meta_build;
use super::admin_rbac::{self, PERM_READ};
use super::request_id_from_headers;
use super::write_admin_audit_log_best_effort;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route("/api/v1/admin/ops-overview", get(get_admin_ops_overview))
}

async fn get_admin_ops_overview(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_READ).await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let request_id = request_id_from_headers(&headers);

    let mut users_total: i64 = 0;
    let mut guides_total: i64 = 0;
    let mut orders_total: i64 = 0;
    let source = if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        if let Ok(n) = sqlx::query_scalar::<_, i64>("SELECT COUNT(*)::bigint FROM users")
            .fetch_one(pool)
            .await
        {
            users_total = n;
        }
        if let Ok(n) = sqlx::query_scalar::<_, i64>("SELECT COUNT(*)::bigint FROM guides")
            .fetch_one(pool)
            .await
        {
            guides_total = n;
        }
        if let Ok(n) = sqlx::query_scalar::<_, i64>("SELECT COUNT(*)::bigint FROM orders")
            .fetch_one(pool)
            .await
        {
            orders_total = n;
        }
        "postgres"
    } else if let Some(co) = state.chain_off.as_ref() {
        let store = co.store.read().await;
        users_total = store.users.len() as i64;
        guides_total = store.guides.len() as i64;
        orders_total = store.orders.len() as i64;
        "memory"
    } else {
        "unavailable"
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.ops_overview.read",
        Some("ops_overview"),
        None,
        json!({ "source": source, "users_total": users_total }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "source": source,
        "domains": {
            "users": { "total": users_total },
            "guide": { "total": guides_total },
            "orders": { "total": orders_total },
        },
        "note": "Ops overview aggregate; card href/permission SSOT remains frontend adminOpsOverviewModel",
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
