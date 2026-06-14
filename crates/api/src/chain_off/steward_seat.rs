//! Steward Seat 生命周期 · 辞任通知 / 释放门闸（① 本地 · protocol-ssot L2）

use axum::{http::StatusCode, Json};
use chrono::{Datelike, Duration, Utc};
use serde_json::{json, Value};
use uuid::Uuid;

use super::steward_application::StewardApplicationRow;
use super::ChainOffState;
use crate::routes::governance_doc_reference::protocol_ssot_json;

const MIN_TENURE_MONTHS: i64 = 24;
const RESIGN_NOTICE_DAYS: i64 = 180;

fn lock_tiers() -> Value {
    protocol_ssot_json()["lock_tiers"].clone()
}

fn payload_str(payload: &Value, key: &str) -> Option<String> {
    payload.get(key).and_then(|v| v.as_str()).map(|s| s.to_string())
}

fn parse_rfc3339(s: &str) -> Option<chrono::DateTime<Utc>> {
    chrono::DateTime::parse_from_rfc3339(s)
        .ok()
        .map(|dt| dt.with_timezone(&Utc))
}

pub fn seat_activated_at(app: &StewardApplicationRow) -> Option<chrono::DateTime<Utc>> {
    payload_str(&app.payload, "seat_activated_at")
        .as_deref()
        .and_then(parse_rfc3339)
        .or_else(|| {
            if app.status == "approved" {
                Some(app.updated_at)
            } else {
                None
            }
        })
}

fn resign_notice_at(app: &StewardApplicationRow) -> Option<chrono::DateTime<Utc>> {
    payload_str(&app.payload, "resign_notice_at")
        .as_deref()
        .and_then(parse_rfc3339)
}

fn tenure_elapsed_months(activated: chrono::DateTime<Utc>, now: chrono::DateTime<Utc>) -> i64 {
    let months = (now.year() - activated.year()) * 12 + (now.month() as i32 - activated.month() as i32);
    months as i64
}

pub fn steward_seat_json(user_role: &str, app: Option<&StewardApplicationRow>) -> Value {
    let lock = lock_tiers();
    let min_months = lock["steward_seat_min_tenure_months"]
        .as_u64()
        .unwrap_or(MIN_TENURE_MONTHS as u64) as i64;
    let notice_days = lock["steward_resign_notice_days"]
        .as_u64()
        .unwrap_or(RESIGN_NOTICE_DAYS as u64) as i64;
    let release_delay = lock["steward_stake_release_delay_days"].as_u64().unwrap_or(90);
    let release_vest = lock["steward_stake_release_vest_days"].as_u64().unwrap_or(365);

    let Some(app) = app else {
        return json!({
            "status": "ok",
            "seat": null,
            "meta": { "implementation_status": "steward_seat_none" }
        });
    };

    let now = Utc::now();
    let activated = seat_activated_at(app);
    let notice = resign_notice_at(app);
    let notice_effective = notice.map(|n| n + Duration::days(notice_days));

    let tenure_months = activated.map(|a| tenure_elapsed_months(a, now));
    let tenure_ok = tenure_months.map(|m| m >= min_months).unwrap_or(false);

    let is_active_steward = user_role == "region_steward" || app.status == "approved";
    let in_release = matches!(app.status.as_str(), "stake_release_pending" | "released" | "rejected");

    let can_submit_resign_notice =
        is_active_steward && !in_release && notice.is_none() && tenure_ok;
    let can_finalize_resign = notice_effective
        .map(|e| now >= e && app.status == "approved")
        .unwrap_or(false);
    let can_request_chain_release = matches!(
        app.status.as_str(),
        "stake_release_pending" | "rejected" | "released"
    ) || can_finalize_resign;

    json!({
        "status": "ok",
        "seat": {
            "machine_code": "steward_seat",
            "application_id": app.id.to_string(),
            "lifecycle_state": app.status,
            "jurisdictions": app.jurisdictions,
            "wallet_address": app.wallet_address,
            "seat_activated_at": activated.map(|d| d.to_rfc3339()),
            "tenure_months_elapsed": tenure_months,
            "min_tenure_months": min_months,
            "resign_notice_at": notice.map(|d| d.to_rfc3339()),
            "resign_notice_effective_at": notice_effective.map(|d| d.to_rfc3339()),
            "resign_notice_days": notice_days,
            "stake_release_delay_days": release_delay,
            "stake_release_vest_days": release_vest,
            "can_submit_resign_notice": can_submit_resign_notice,
            "can_finalize_resign": can_finalize_resign,
            "can_request_chain_release": can_request_chain_release,
        },
        "meta": { "implementation_status": "steward_seat_v1" }
    })
}

pub async fn get_me_steward_seat_impl(
    co: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = co.store.read().await;
    let role = store
        .users
        .get(&user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    let app = store.steward_applications_by_user.get(&user_id);
    Ok(Json(steward_seat_json(&role, app)))
}

pub async fn post_steward_resign_notice_impl(
    co: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let mut store = co.store.write().await;
    let role = store
        .users
        .get(&user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    let Some(app) = store.steward_applications_by_user.get_mut(&user_id) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "steward_application_not_found", "message": "steward_application_not_found"})),
        ));
    };

    if role != "region_steward" && app.status != "approved" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "steward_seat_not_active", "message": "steward_seat_not_active"})),
        ));
    }

    if resign_notice_at(app).is_some() {
        return Err((
            StatusCode::CONFLICT,
            Json(json!({"error": "resign_notice_already_submitted", "message": "resign_notice_already_submitted"})),
        ));
    }

    let lock = lock_tiers();
    let min_months = lock["steward_seat_min_tenure_months"]
        .as_u64()
        .unwrap_or(MIN_TENURE_MONTHS as u64) as i64;
    let notice_days = lock["steward_resign_notice_days"]
        .as_u64()
        .unwrap_or(RESIGN_NOTICE_DAYS as u64) as i64;

    let now = Utc::now();
    let activated = seat_activated_at(app).ok_or((
        StatusCode::FORBIDDEN,
        Json(json!({"error": "steward_seat_not_activated", "message": "steward_seat_not_activated"})),
    ))?;
    if tenure_elapsed_months(activated, now) < min_months {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({
                "error": "steward_tenure_insufficient",
                "message": "steward_tenure_insufficient",
                "min_tenure_months": min_months,
                "tenure_months_elapsed": tenure_elapsed_months(activated, now),
            })),
        ));
    }

    app.payload["resign_notice_at"] = json!(now.to_rfc3339());
    app.updated_at = now;
    let snapshot = app.clone();
    drop(store);

    let seat = steward_seat_json(&role, Some(&snapshot));
    Ok(Json(json!({
        "status": "ok",
        "resign_notice_at": now.to_rfc3339(),
        "resign_notice_effective_at": (now + Duration::days(notice_days)).to_rfc3339(),
        "seat": seat["seat"],
        "meta": { "implementation_status": "steward_resign_notice_v1" }
    })))
}

pub async fn post_steward_finalize_resign_impl(
    co: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let mut store = co.store.write().await;
    let Some(app) = store.steward_applications_by_user.get_mut(&user_id) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "steward_application_not_found", "message": "steward_application_not_found"})),
        ));
    };

    let notice = resign_notice_at(app).ok_or((
        StatusCode::FORBIDDEN,
        Json(json!({"error": "resign_notice_required", "message": "resign_notice_required"})),
    ))?;

    let notice_days = lock_tiers()["steward_resign_notice_days"]
        .as_u64()
        .unwrap_or(RESIGN_NOTICE_DAYS as u64) as i64;
    let effective = notice + Duration::days(notice_days);
    let now = Utc::now();
    if now < effective {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({
                "error": "resign_notice_period_pending",
                "message": "resign_notice_period_pending",
                "resign_notice_effective_at": effective.to_rfc3339(),
            })),
        ));
    }

    app.status = "stake_release_pending".to_string();
    app.payload["resign_finalized_at"] = json!(now.to_rfc3339());
    app.updated_at = now;
    let snapshot = app.clone();
    if let Some(user) = store.users.get_mut(&user_id) {
        user.role = "traveler".to_string();
        user.updated_at = now;
    }
    let role = store
        .users
        .get(&user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    drop(store);

    Ok(Json(json!({
        "status": "ok",
        "lifecycle_state": "stake_release_pending",
        "seat": steward_seat_json(&role, Some(&snapshot))["seat"],
        "meta": { "implementation_status": "steward_finalize_resign_v1" }
    })))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn tenure_months_calculation() {
        let activated = Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap();
        let now = Utc.with_ymd_and_hms(2026, 6, 1, 0, 0, 0).unwrap();
        assert!(tenure_elapsed_months(activated, now) >= 24);
    }
}
