//! GET /api/v1/admin/metrics/home-overview — 工作台「系统概况」② 趋势真源（① 本地 memory/PG）。

use axum::http::StatusCode;
use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde_json::json;
use std::collections::HashMap;

use crate::chain_off::UserRow;
use crate::db::{
    self, bucket_counts, last_n_utc_day_labels, utc_day_key, AdminHomeMetricsSnapshot,
};
use crate::state::ApiMetaState;

use super::admin_attach_meta_build;
use super::admin_rbac::{self, PERM_READ};
use super::request_id_from_headers;
use super::write_admin_audit_log_best_effort;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/admin/metrics/home-overview",
        get(get_admin_metrics_home_overview),
    )
}

fn aggregate_users_memory(
    users: &HashMap<uuid::Uuid, UserRow>,
    now: DateTime<Utc>,
) -> AdminHomeMetricsSnapshot {
    let day_labels = last_n_utc_day_labels(now, 7);
    let since = now - chrono::Duration::days(7);

    let mut by_role: HashMap<String, i64> = HashMap::new();
    let mut signup_map: HashMap<chrono::NaiveDate, i64> = HashMap::new();

    for u in users.values() {
        *by_role.entry(u.role.clone()).or_insert(0) += 1;
        if u.created_at >= since {
            *signup_map.entry(utc_day_key(u.created_at)).or_insert(0) += 1;
        }
    }

    let signup_rows: Vec<_> = signup_map.into_iter().collect();
    let mut role_json = serde_json::Map::new();
    for (role, count) in by_role {
        role_json.insert(role, json!(count));
    }

    AdminHomeMetricsSnapshot {
        source: "memory",
        users_total: users.len() as i64,
        users_by_role: json!(role_json),
        console_roles_by_name: None,
        trend_days: day_labels.clone(),
        user_signups: bucket_counts(&day_labels, &signup_rows),
        admin_activity: vec![0; day_labels.len()],
        admin_activity_available: false,
    }
}

pub async fn get_admin_metrics_home_overview(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_READ).await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let request_id = request_id_from_headers(&headers);

    let snapshot = if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        match db::fetch_admin_home_metrics_from_pg(pool).await {
            Ok(s) => s,
            Err(_) => {
                let store = state.chain_off.as_ref().unwrap().store.read().await;
                aggregate_users_memory(&store.users, Utc::now())
            }
        }
    } else if let Some(co) = state.chain_off.as_ref() {
        let store = co.store.read().await;
        aggregate_users_memory(&store.users, Utc::now())
    } else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_off_unavailable",
                "message": "chain_off_unavailable",
                "path": "GET /api/v1/admin/metrics/home-overview",
            })),
        )
            .into_response();
    };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.metrics.home_overview.read",
        Some("metrics"),
        None,
        json!({
            "source": snapshot.source,
            "users_total": snapshot.users_total,
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "schema_version": "admin-home-metrics-v1",
        "source": snapshot.source,
        "honesty": {
            "users_total_scope": if snapshot.source == "postgres" { "postgres_users_table" } else { "chain_off_memory_users" },
            "admin_activity_scope": if snapshot.admin_activity_available { "admin_audit_logs_7d_utc" } else { "unavailable_memory_mode" },
            "site_traffic_note": "admin_activity is audited console API events, not public site DAU",
        },
        "users": {
            "total": snapshot.users_total,
            "by_users_role": snapshot.users_by_role,
            "by_console_role": snapshot.console_roles_by_name,
        },
        "trends": {
            "days": snapshot.trend_days,
            "user_signups": snapshot.user_signups,
            "admin_activity": snapshot.admin_activity,
        },
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
