//! GET /api/v1/admin/community/risk-signals

use axum::extract::Query;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminCommunityRiskSignalsQuery,
};
use crate::db;
use crate::state::ApiMetaState;

/// GET /api/v1/admin/community/risk-signals（160 §5、`community_risk_signals`）
pub async fn get_admin_community_risk_signals(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityRiskSignalsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let subject = match query
        .subject_user_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_risk_signals_subject_user_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let st_sub = query.signal_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let rid_sub = query.rule_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let sev_sub = query.severity.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let st_pat = st_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let rid_pat = rid_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let sev_pat = sev_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let rows = match db::list_community_risk_signals_admin(
        pool,
        limit,
        subject,
        st_pat.as_deref(),
        rid_pat.as_deref(),
        sev_pat.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_risk_signals_query_failed",
                )),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.risk_signals.read",
        Some("community_risk_signals"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "subject_user_id": subject.map(|u| u.to_string()),
            "signal_type": st_sub,
            "rule_id": rid_sub,
            "severity": sev_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "subject_user_id": r.subject_user_id.to_string(),
                "signal_type": r.signal_type,
                "rule_id": r.rule_id,
                "severity": r.severity,
                "context": r.context.0,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "subject_user_id": subject.as_ref().map(|u| u.to_string()),
            "signal_type": st_sub,
            "rule_id": rid_sub,
            "severity": sev_sub,
        },
        "meta": {
            "note": "community_risk_signals 滥用/风控命中投影",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
