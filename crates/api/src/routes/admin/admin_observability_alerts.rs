//! Admin observability alert rules + incident detail handlers.

use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::state::ApiMetaState;

use super::admin_observability_helpers::admin_observability_alert_rules_config;
use super::{
    admin_attach_meta_build, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};

pub async fn get_admin_observability_alert_rules(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.observability.alert_rules.read",
        Some("observability"),
        None,
        json!({"ok": true}),
    )
    .await;

    let rules_view = admin_observability_alert_rules_config(&state);
    let mut body = json!({
        "status": "ok",
        "rules_view": rules_view
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_alert_incident_by_id(
    State(state): State<ApiMetaState>,
    Path(incident_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.alert.incident.read",
        Some("incident"),
        Some(incident_id.as_str()),
        json!({"ok": true}),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "incident": {
            "id": incident_id,
            "state": "opened",
            "severity": "P2",
            "owner_group": "ops",
            "timeline": []
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
