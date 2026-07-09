//! `GET/PATCH /api/v1/me/guide-profile` · Admin 向导申请队列（① 本地 · `guides` 行真源）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use traveltrust_core::product_countries::normalize_iso_country_code;
use uuid::Uuid;

use super::{ChainOffState, GuideRow, UserRow};

const MAX_LEN_CITY: usize = 100;
const MAX_LEN_BIO: usize = 2000;
const MAX_ITEMS_LANG: usize = 20;
const MAX_ITEMS_SERVICE: usize = 20;
const MAX_LEN_ITEM: usize = 50;
const MAX_LEN_URL: usize = 2048;
const MAX_LEN_HOURLY_RATE: usize = 32;
const MAX_LEN_PUBLIC_TITLE: usize = 80;

fn validate_http_url(s: &str) -> Result<(), (StatusCode, Json<Value>)> {
    let u = s.trim();
    if u.is_empty() {
        return Ok(());
    }
    if u.len() > MAX_LEN_URL {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "avatar_url_too_long",
                format!("avatar_url max {MAX_LEN_URL} chars"),
            )),
        ));
    }
    if !u.starts_with("http://") && !u.starts_with("https://") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "avatar_url_invalid",
                "avatar_url must start with http:// or https://",
            )),
        ));
    }
    Ok(())
}

fn validate_hourly_rate(raw: &str) -> Result<Option<String>, (StatusCode, Json<Value>)> {
    let t = raw.trim();
    if t.is_empty() {
        return Ok(None);
    }
    if t.len() > MAX_LEN_HOURLY_RATE {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("hourly_rate_too_long")),
        ));
    }
    let Ok(v) = t.parse::<f64>() else {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("hourly_rate_invalid")),
        ));
    };
    if !v.is_finite() || v < 0.0 || v > 999_999.0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("hourly_rate_out_of_range")),
        ));
    }
    Ok(Some(t.to_string()))
}

fn normalize_string_list(
    arr: &[String],
    max_items: usize,
    err_key: &str,
) -> Result<Vec<String>, (StatusCode, Json<Value>)> {
    if arr.len() > max_items || arr.iter().any(|x| x.len() > MAX_LEN_ITEM) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    Ok(arr
        .iter()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect())
}

fn guide_application_status(user: &UserRow, g: &GuideRow) -> String {
    if super::guide_slot_active(user, Some(g)) {
        "active".to_string()
    } else {
        g.status.clone()
    }
}

async fn guide_blocked_reasons(
    state: &ChainOffState,
    user: &UserRow,
    g: &GuideRow,
) -> Vec<&'static str> {
    if super::guide_slot_active(user, Some(g)) {
        return vec![];
    }
    let mut reasons = Vec::new();
    if !super::identity_slot_profiles::identity_gate_wallet_verified(state, user).await {
        reasons.push("wallet");
    }
    let st = g.status.to_ascii_lowercase();
    if matches!(
        st.as_str(),
        "pending" | "pending_review" | "submitted" | "reviewing" | "rejected"
    ) {
        reasons.push("review");
    }
    if st.contains("suspend") || st == "restricted" || st == "suspended" {
        reasons.push("suspend");
    }
    if st == "exiting" || st == "exited" {
        reasons.push("exit");
    }
    reasons
}

fn guide_application_materials_json(g: &GuideRow) -> Value {
    fn url_present(opt: &Option<String>) -> bool {
        opt.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false)
    }
    json!({
        "wallet_address": g.wallet_address,
        "real_name": g.real_name,
        "id_photo_submitted": url_present(&g.id_photo_url),
        "id_photo_url": g.id_photo_url,
        "language_cert_submitted": url_present(&g.language_cert_url),
        "language_cert_url": g.language_cert_url,
        "guide_license_submitted": url_present(&g.guide_license_url),
        "guide_license_url": g.guide_license_url,
        "submitted_at": g.created_at.to_rfc3339(),
    })
}

pub fn me_guide_profile_json(
    g: &GuideRow,
    user: &UserRow,
    blocked_reasons: Vec<&str>,
    public_detail_available: bool,
) -> Value {
    let (slot_state, patch_allowed) = super::slot_rbac::guide_profile_patch_gate(user, g);
    json!({
        "guide_id": g.id.to_string(),
        "city": g.city,
        "country_code": g.country_code,
        "languages": g.languages,
        "service_types": g.service_types,
        "bio": g.bio,
        "hourly_rate": g.hourly_rate,
        "hourly_currency": "USDC",
        "avatar_url": g.avatar_url,
        "public_title": g.public_title,
        "status": g.status,
        "application_status": guide_application_status(user, g),
        "slot_state": slot_state,
        "profile_patch_allowed": patch_allowed,
        "rejection_codes": g.rejection_codes,
        "rejection_message": g.rejection_message,
        "blocked_reasons": blocked_reasons,
        "application_materials": guide_application_materials_json(g),
        "updated_at": g.updated_at.to_rfc3339(),
        "public_detail_available": public_detail_available,
    })
}

pub async fn get_me_guide_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    let guide_id = store.guides_by_user.get(&user_id).copied();
    let Some(gid) = guide_id else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_profile_not_found")),
        ));
    };
    let Some(g) = store.guides.get(&gid) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_profile_not_found")),
        ));
    };
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let guide = g.clone();
    let public_detail_available =
        !super::market_public_surface::should_hide_guide_from_public_catalog(&guide, &store);
    drop(store);
    let blocked = guide_blocked_reasons(&state, &user, &guide).await;
    Ok(Json(json!({
        "status": "ok",
        "profile": me_guide_profile_json(&guide, &user, blocked, public_detail_available),
        "meta": { "implementation_status": "me_guide_profile_v1" }
    })))
}

#[derive(Debug, Deserialize)]
pub struct PatchMeGuideProfileBody {
    #[serde(default)]
    pub city: Option<String>,
    #[serde(default)]
    pub country_code: Option<String>,
    #[serde(default)]
    pub languages: Option<Vec<String>>,
    #[serde(default)]
    pub service_types: Option<Vec<String>>,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub hourly_rate: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub public_title: Option<String>,
}

pub async fn patch_me_guide_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PatchMeGuideProfileBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let mut store = state.store.write().await;
    let guide_id = store.guides_by_user.get(&user_id).copied();
    let Some(gid) = guide_id else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_profile_not_found")),
        ));
    };
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let Some(g_snapshot) = store.guides.get(&gid).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_profile_not_found")),
        ));
    };
    if !super::guide_slot_active(&user, Some(&g_snapshot)) {
        return Err(super::slot_rbac::identity_profile_patch_forbidden());
    }
    let Some(g) = store.guides.get_mut(&gid) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_profile_not_found")),
        ));
    };

    if let Some(ref city_raw) = body.city {
        let city_trim = city_raw.trim();
        if city_trim.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "city_required",
                    "city is required and cannot be empty",
                )),
            ));
        }
        if city_trim.len() > MAX_LEN_CITY {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("city_too_long")),
            ));
        }
        g.city = city_trim.to_string();
    }

    if let Some(ref cc_raw) = body.country_code {
        let cc_trim = cc_raw.trim();
        if cc_trim.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_country_code")),
            ));
        }
        let Some(cc_norm) = normalize_iso_country_code(cc_trim) else {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_country_code",
                    "country_code must be one of CN, JP, KR, SG, TH, AE, US, AU, FR, ES",
                )),
            ));
        };
        g.country_code = cc_norm.to_string();
    }

    if let Some(ref arr) = body.languages {
        let normalized =
            super::market_guide_filter::normalize_languages_for_storage(&normalize_string_list(
                arr,
                MAX_ITEMS_LANG,
                "languages_invalid",
            )?);
        g.languages = normalized;
    }

    if let Some(ref arr) = body.service_types {
        let normalized =
            super::market_guide_filter::normalize_service_types_for_storage(&normalize_string_list(
                arr,
                MAX_ITEMS_SERVICE,
                "service_types_invalid",
            )?);
        g.service_types = normalized;
    }

    if let Some(ref bio_raw) = body.bio {
        if bio_raw.len() > MAX_LEN_BIO {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("bio_too_long")),
            ));
        }
        let trimmed = bio_raw.trim();
        g.bio = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
    }

    if let Some(ref rate_raw) = body.hourly_rate {
        g.hourly_rate = validate_hourly_rate(rate_raw)?;
    }

    if let Some(ref url_raw) = body.avatar_url {
        validate_http_url(url_raw)?;
        let trimmed = url_raw.trim();
        g.avatar_url = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
    }

    if let Some(ref title_raw) = body.public_title {
        let trimmed = title_raw.trim();
        if trimmed.len() > MAX_LEN_PUBLIC_TITLE {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("public_title_too_long")),
            ));
        }
        g.public_title = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
    }

    let now = Utc::now();
    g.updated_at = now;
    let snapshot = g.clone();
    drop(store);

    if let Some(ref pool) = state.db_pool {
        if let Err(e) = crate::db::update_guide_public_profile(
            pool,
            snapshot.id,
            &snapshot.city,
            &snapshot.country_code,
            &snapshot.languages,
            &snapshot.service_types,
            snapshot.bio.as_deref(),
            snapshot.hourly_rate.as_deref(),
            snapshot.avatar_url.as_deref(),
            snapshot.public_title.as_deref(),
            now,
        )
        .await
        {
            eprintln!(
                "[audit] db update_guide_public_profile failed guide_id={} error={}",
                snapshot.id, e
            );
        }
    }

    let user = {
        let store = state.store.read().await;
        store.users.get(&user_id).cloned()
    };
    let Some(user) = user else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let blocked = guide_blocked_reasons(&state, &user, &snapshot).await;
    let public_detail_available = {
        let store = state.store.read().await;
        !super::market_public_surface::should_hide_guide_from_public_catalog(&snapshot, &store)
    };
    Ok(Json(json!({
        "status": "ok",
        "profile": me_guide_profile_json(&snapshot, &user, blocked, public_detail_available),
        "meta": { "implementation_status": "me_guide_profile_v1" }
    })))
}

fn guide_application_list_item(store: &super::ChainOffStore, g: &GuideRow) -> Value {
    let email = store.users.get(&g.user_id).map(|u| u.email.clone());
    let role = store
        .users
        .get(&g.user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    json!({
        "user_id": g.user_id,
        "email": email,
        "user_role": role,
        "application": {
            "id": g.id,
            "status": g.status,
            "city": g.city,
            "country_code": g.country_code,
            "languages": g.languages,
            "service_types": g.service_types,
            "submitted_at": g.created_at.to_rfc3339(),
            "updated_at": g.updated_at.to_rfc3339(),
            "rejection_codes": g.rejection_codes,
        }
    })
}

pub async fn list_guide_applications_admin_impl(
    state: ChainOffState,
    status_filter: Option<String>,
) -> Json<Value> {
    let store = state.store.read().await;
    let filter = status_filter
        .as_deref()
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s| !s.is_empty());
    let mut items: Vec<Value> = store
        .guides
        .values()
        .filter(|g| filter.as_ref().map_or(true, |f| g.status.to_ascii_lowercase() == *f))
        .map(|g| guide_application_list_item(&store, g))
        .collect();
    items.sort_by(|a, b| {
        let ta = a["application"]["submitted_at"].as_str().unwrap_or("");
        let tb = b["application"]["submitted_at"].as_str().unwrap_or("");
        tb.cmp(ta)
    });
    Json(json!({
        "status": "ok",
        "items": items,
        "meta": { "implementation_status": "guide_applications_admin_list" }
    }))
}

pub async fn get_guide_application_for_user_admin_impl(
    state: ChainOffState,
    target_user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    if store.users.get(&target_user_id).is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let guide_id = store.guides_by_user.get(&target_user_id).copied();
    let Some(gid) = guide_id else {
        return Ok(Json(json!({
            "status": "ok",
            "application": null,
            "meta": { "implementation_status": "guide_application_none" }
        })));
    };
    let Some(g) = store.guides.get(&gid) else {
        return Ok(Json(json!({
            "status": "ok",
            "application": null,
            "meta": { "implementation_status": "guide_application_none" }
        })));
    };
    Ok(Json(json!({
        "status": "ok",
        "application": {
            "id": g.id,
            "status": g.status,
            "city": g.city,
            "country_code": g.country_code,
            "languages": g.languages,
            "service_types": g.service_types,
            "bio": g.bio,
            "wallet_address": g.wallet_address,
            "real_name": g.real_name,
            "id_photo_url": g.id_photo_url,
            "language_cert_url": g.language_cert_url,
            "guide_license_url": g.guide_license_url,
            "hourly_rate": g.hourly_rate,
            "avatar_url": g.avatar_url,
            "submitted_at": g.created_at.to_rfc3339(),
            "updated_at": g.updated_at.to_rfc3339(),
            "rejection_codes": g.rejection_codes,
            "rejection_message": g.rejection_message,
        },
        "meta": { "implementation_status": "guide_application_admin_detail" }
    })))
}

#[derive(Debug, Deserialize)]
pub struct PatchGuideApplicationReviewBody {
    pub status: String,
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    #[serde(default)]
    pub rejection_message: Option<String>,
}

fn map_review_status_to_guide_status(review: &str) -> Option<&'static str> {
    match review.trim().to_ascii_lowercase().as_str() {
        "reviewing" => Some("pending_review"),
        "approved" => Some("active"),
        "rejected" => Some("rejected"),
        _ => None,
    }
}

pub async fn admin_review_guide_application_impl(
    state: ChainOffState,
    target_user_id: Uuid,
    Json(body): Json<PatchGuideApplicationReviewBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let review_status = body.status.trim().to_ascii_lowercase();
    let Some(guide_status) = map_review_status_to_guide_status(&review_status) else {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("guide_application_invalid_review_status")),
        ));
    };

    let codes: Vec<String> = body
        .rejection_codes
        .iter()
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty())
        .take(32)
        .collect();
    for c in &codes {
        if c.len() > 120 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("rejection_code_too_long")),
            ));
        }
    }
    let rejection_message = body
        .rejection_message
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    if rejection_message.as_ref().is_some_and(|s| s.len() > 4000) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("rejection_message_too_long")),
        ));
    }
    if guide_status == "rejected" && codes.is_empty() && rejection_message.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "rejection_detail_required",
                "rejected status requires non-empty rejection_codes and/or rejection_message",
            )),
        ));
    }

    let mut store = state.store.write().await;
    let guide_id = store.guides_by_user.get(&target_user_id).copied();
    let Some(gid) = guide_id else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_application_not_found")),
        ));
    };
    let Some(g) = store.guides.get_mut(&gid) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_application_not_found")),
        ));
    };

    let now = Utc::now();
    g.status = guide_status.to_string();
    g.rejection_codes = if guide_status == "rejected" {
        codes.clone()
    } else {
        vec![]
    };
    g.rejection_message = if guide_status == "rejected" {
        rejection_message.clone()
    } else {
        None
    };
    g.updated_at = now;
    let guide_snapshot = g.clone();

    if guide_status == "active" {
        if let Some(u) = store.users.get_mut(&target_user_id) {
            u.role = "guide".to_string();
            u.updated_at = now;
        }
    }

    drop(store);

    if let Some(ref pool) = state.db_pool {
        if let Err(e) = crate::db::update_guide_registration_review(
            pool,
            guide_snapshot.id,
            guide_status,
            &guide_snapshot.rejection_codes,
            guide_snapshot.rejection_message.as_deref(),
            now,
        )
        .await
        {
            eprintln!(
                "[audit] db update_guide_registration_review failed guide_id={} error={}",
                guide_snapshot.id, e
            );
        }
        if guide_status == "active" {
            let _ = crate::db::update_user_role_if_safe(pool, target_user_id, "guide").await;
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "user_id": target_user_id,
        "guide_id": guide_snapshot.id,
        "application_status": guide_status,
        "user_role_updated": guide_status == "active",
        "meta": { "implementation_status": "guide_application_admin_review" }
    })))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    fn test_user(role: &str) -> UserRow {
        UserRow {
            id: Uuid::new_v4(),
            email: "guide@test.com".into(),
            password_hash: None,
            role: role.into(),
            kyc_status: "none".into(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    fn test_guide(status: &str) -> GuideRow {
        GuideRow {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            status: status.into(),
            city: "Hangzhou".into(),
            country_code: "CN".into(),
            languages: vec!["zh".into()],
            service_types: vec!["walking".into()],
            bio: Some("bio".into()),
            hourly_rate: Some("45".into()),
            avatar_url: None,
            public_title: None,
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: "0".into(),
            rejection_codes: vec![],
            rejection_message: None,
            data_origin: "production".into(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            ..Default::default()
            }
    }

    #[test]
    fn me_guide_profile_json_includes_p0_gate_and_usdc() {
        let user = test_user("guide");
        let guide = test_guide("active");
        let profile = me_guide_profile_json(&guide, &user, vec![], true);
        assert_eq!(profile["hourly_currency"], "USDC");
        assert_eq!(profile["public_detail_available"], true);
        assert_eq!(profile["application_status"], "active");
        assert_eq!(profile["profile_patch_allowed"], true);
        assert_eq!(profile["slot_state"], "active");
        assert!(profile.get("application_materials").is_some());
    }

    #[test]
    fn me_guide_profile_json_pending_is_read_only() {
        let user = test_user("traveler");
        let guide = test_guide("pending");
        let profile = me_guide_profile_json(&guide, &user, vec!["review"], true);
        assert_eq!(profile["profile_patch_allowed"], false);
        assert_eq!(profile["application_status"], "pending");
    }
}
