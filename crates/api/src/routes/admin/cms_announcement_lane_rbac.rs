//! CMS announcement lane → audience RBAC (registry mirror).
//!
//! SSOT: `registry/traveltrust-announcement-lane-governance.v1.yaml` · `lanes.*.audience`

use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::state::ApiMetaState;

use super::admin_rbac::{
    self, PERM_ANNOUNCEMENT_AUDIENCE_PUBLIC_USER, PERM_ANNOUNCEMENT_AUDIENCE_TECHNICAL_PUBLIC,
    PERM_ANNOUNCEMENT_AUDIENCE_TOKEN_HOLDER,
};

/// Lane id (CMS ops) → audience-scoped permission id.
pub fn cms_announcement_lane_permission(lane: &str) -> Option<&'static str> {
    match lane.trim() {
        "product" => Some(PERM_ANNOUNCEMENT_AUDIENCE_PUBLIC_USER),
        "governance" => Some(PERM_ANNOUNCEMENT_AUDIENCE_TOKEN_HOLDER),
        "protocol_status" => Some(PERM_ANNOUNCEMENT_AUDIENCE_TECHNICAL_PUBLIC),
        "roadmap" => Some(PERM_ANNOUNCEMENT_AUDIENCE_PUBLIC_USER),
        _ => None,
    }
}

fn lane_denied() -> Response {
    (
        StatusCode::FORBIDDEN,
        Json(json!({ "status": "error", "error": "admin_announcement_lane_denied" })),
    )
        .into_response()
}

/// Requires base content permission plus each lane's audience permission.
pub async fn require_cms_announcement_lanes(
    state: &ApiMetaState,
    headers: &HeaderMap,
    lanes: &[&str],
    base_perm: &str,
) -> Result<(Uuid, String), Response> {
    let (uid, role) = admin_rbac::require_admin_permission(state, headers, base_perm).await?;
    for lane in lanes {
        let Some(lane_perm) = cms_announcement_lane_permission(lane) else {
            return Err(lane_denied());
        };
        if admin_rbac::require_admin_permission(state, headers, lane_perm)
            .await
            .is_err()
        {
            return Err(lane_denied());
        }
    }
    Ok((uid, role))
}
