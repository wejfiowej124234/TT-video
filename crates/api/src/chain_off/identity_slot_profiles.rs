//! `GET/PATCH /api/v1/me/{merchant-profile,region-steward-profile,acquisition-profile}` — P2 身份槽公开展示资料（① 本地）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use traveltrust_core::product_countries::normalize_iso_country_code;
use uuid::Uuid;

use super::{
    provider_application::ProviderApplicationRow, steward_application::StewardApplicationRow,
    AcquisitionProfileRow, ChainOffState, ChainOffStore, UserRow,
};
use crate::db;
use crate::routes::governance_doc_reference::steward_stake_quote_for_jurisdictions;

const MAX_LEN_CITY: usize = 100;
const MAX_LEN_BIO: usize = 2000;
const MAX_LEN_TAGLINE: usize = 200;
const MAX_LEN_SHOP_NAME: usize = 120;
const MAX_ITEMS_CATEGORIES: usize = 20;
const MAX_LEN_CATEGORY_ITEM: usize = 50;
const MAX_LEN_URL: usize = 2048;

fn validate_http_url(field: &str, s: &str) -> Result<(), (StatusCode, Json<Value>)> {
    let u = s.trim();
    if u.is_empty() {
        return Ok(());
    }
    if u.len() > MAX_LEN_URL {
        let key = if field == "cover_url" {
            "cover_url_too_long"
        } else {
            "avatar_url_too_long"
        };
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                key,
                format!("{field} max {MAX_LEN_URL} chars"),
            )),
        ));
    }
    if !u.starts_with("http://") && !u.starts_with("https://") {
        let key = if field == "cover_url" {
            "cover_url_invalid"
        } else {
            "avatar_url_invalid"
        };
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                key,
                format!("{field} must start with http:// or https://"),
            )),
        ));
    }
    Ok(())
}

fn payload_str(payload: &Value, key: &str) -> Option<String> {
    payload.get(key).and_then(|v| {
        v.as_str()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    })
}

fn payload_categories_json(payload: &Value) -> Value {
    match payload.get("categories") {
        Some(Value::Array(arr)) => {
            let items: Vec<String> = arr
                .iter()
                .filter_map(|v| v.as_str().map(|s| s.trim()).filter(|s| !s.is_empty()))
                .map(|s| s.to_string())
                .collect();
            json!(items)
        }
        Some(Value::String(s)) => {
            let t = s.trim();
            if t.is_empty() {
                json!([])
            } else {
                json!([t.to_string()])
            }
        }
        _ => json!([]),
    }
}

fn normalize_categories(
    arr: &[String],
) -> Result<Vec<String>, (StatusCode, Json<Value>)> {
    if arr.len() > MAX_ITEMS_CATEGORIES
        || arr.iter().any(|x| x.len() > MAX_LEN_CATEGORY_ITEM)
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("categories_invalid")),
        ));
    }
    Ok(arr
        .iter()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect())
}

/// Shared wallet gate for identity-slot profile `blocked_reasons` (guide / merchant / steward).
pub(crate) async fn identity_gate_wallet_verified(state: &ChainOffState, user: &UserRow) -> bool {
    wallet_verified(state, user).await
}

async fn wallet_verified(state: &ChainOffState, user: &UserRow) -> bool {
    let Some(addr) = user
        .default_wallet_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    else {
        return false;
    };
    let Some(ref pool) = state.db_pool else {
        return true;
    };
    let ttl = std::env::var("WALLET_VERIFICATION_TTL_SECONDS")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| n > 0)
        .unwrap_or(86_400);
    let Ok(Some(row)) = db::get_latest_verified_wallet_for_user(pool, user.id).await else {
        return false;
    };
    let age = (Utc::now() - row.verified_at).num_seconds().max(0);
    age <= ttl && row.wallet_address.eq_ignore_ascii_case(addr)
}

async fn user_has_paid_onboarding_entitlement(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    role_target: &str,
) -> Result<bool, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM onboarding_entitlements
           WHERE user_id = $1 AND role_target = $2 AND status = 'paid'"#,
    )
    .bind(user_id)
    .bind(role_target)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}

fn open_disputes_as_party_count(store: &ChainOffStore, user_id: Uuid) -> usize {
    store
        .disputes
        .values()
        .filter(|d| {
            if d.status != "open" {
                return false;
            }
            let Some(o) = store.orders.get(&d.order_id) else {
                return false;
            };
            if o.tourist_id == user_id {
                return true;
            }
            store
                .guides
                .get(&o.guide_id)
                .map(|g| g.user_id == user_id)
                .unwrap_or(false)
        })
        .count()
}

fn identity_status_for_trust(user: &UserRow, guide: Option<&super::GuideRow>) -> &'static str {
    let k = user.kyc_status.to_ascii_lowercase();
    if k.contains("suspend") || k.contains("banned") {
        return "restricted";
    }
    if k == "pending" || k == "in_review" {
        return "pending_review";
    }
    if let Some(g) = guide {
        match g.status.as_str() {
            "pending" => return "pending_review",
            "rejected" | "suspended" => return "restricted",
            _ => {}
        }
    }
    "active"
}

fn risk_level_for_trust(open_as_party: usize) -> &'static str {
    match open_as_party {
        0..=1 => "low",
        2..=3 => "medium",
        _ => "high",
    }
}

async fn merchant_blocked_reasons(
    state: &ChainOffState,
    user: &UserRow,
    app: &ProviderApplicationRow,
) -> Vec<&'static str> {
    if super::merchant_slot_active(user, Some(app)) {
        return vec![];
    }
    let mut reasons = Vec::new();
    if !wallet_verified(state, user).await {
        reasons.push("wallet");
    }
    let st = app.status.to_ascii_lowercase();
    let mut payment_blocked = matches!(st.as_str(), "submitted" | "reviewing" | "draft");
    if let Some(ref pool) = state.db_pool {
        match user_has_paid_onboarding_entitlement(pool, user.id, "provider").await {
            Ok(false) => payment_blocked = true,
            Err(_) => {}
            Ok(true) => {
                if st != "approved" && st != "rejected" {
                    payment_blocked = false;
                }
            }
        }
    }
    if payment_blocked {
        reasons.push("payment");
    }
    if matches!(st.as_str(), "submitted" | "reviewing" | "rejected") {
        reasons.push("review");
    }
    reasons
}

fn merchant_application_status(user: &UserRow, app: &ProviderApplicationRow) -> String {
    if super::merchant_slot_active(user, Some(app)) {
        "active".to_string()
    } else {
        app.status.clone()
    }
}

fn merchant_profile_json(
    user: &UserRow,
    app: &ProviderApplicationRow,
    blocked_reasons: Vec<&'static str>,
) -> Value {
    let (slot_state, patch_allowed) = super::slot_rbac::merchant_profile_patch_gate(user, app);
    let p = &app.payload;
    json!({
        "shop_name": payload_str(p, "shop_name"),
        "city": payload_str(p, "city"),
        "country_code": payload_str(p, "country_code"),
        "categories": payload_categories_json(p),
        "bio": payload_str(p, "bio"),
        "avatar_url": payload_str(p, "avatar_url"),
        "cover_url": payload_str(p, "cover_url"),
        "application_status": merchant_application_status(user, app),
        "slot_state": slot_state,
        "profile_patch_allowed": patch_allowed,
        "rejection_codes": app.rejection_codes,
        "rejection_message": app.rejection_message,
        "blocked_reasons": blocked_reasons,
        "updated_at": app.updated_at.to_rfc3339(),
    })
}

pub async fn get_me_merchant_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let Some(app) = store.provider_applications_by_user.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("merchant_profile_not_found")),
        ));
    };
    drop(store);
    let blocked = merchant_blocked_reasons(&state, &user, &app).await;
    Ok(Json(json!({
        "status": "ok",
        "profile": merchant_profile_json(&user, &app, blocked),
        "meta": { "implementation_status": "me_merchant_profile_v1" }
    })))
}

#[derive(Debug, Deserialize)]
pub struct PatchMeMerchantProfileBody {
    #[serde(default)]
    pub shop_name: Option<String>,
    #[serde(default)]
    pub city: Option<String>,
    #[serde(default)]
    pub country_code: Option<String>,
    #[serde(default)]
    pub categories: Option<Vec<String>>,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
    #[serde(default)]
    pub cover_url: Option<String>,
}

pub async fn patch_me_merchant_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PatchMeMerchantProfileBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let mut store = state.store.write().await;
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let Some(app) = store.provider_applications_by_user.get_mut(&user_id) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("merchant_profile_not_found")),
        ));
    };
    if !super::merchant_slot_active(&user, Some(app)) {
        return Err(super::slot_rbac::identity_profile_patch_forbidden());
    }

    if let Some(ref raw) = body.shop_name {
        let t = raw.trim();
        if t.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("shop_name_required")),
            ));
        }
        if t.len() > MAX_LEN_SHOP_NAME {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("shop_name_too_long")),
            ));
        }
        app.payload["shop_name"] = json!(t);
    }

    if let Some(ref raw) = body.city {
        let t = raw.trim();
        if t.is_empty() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("city_required")),
            ));
        }
        if t.len() > MAX_LEN_CITY {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("city_too_long")),
            ));
        }
        app.payload["city"] = json!(t);
    }

    if let Some(ref raw) = body.country_code {
        let cc_trim = raw.trim();
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
        app.payload["country_code"] = json!(cc_norm);
    }

    if let Some(ref arr) = body.categories {
        let normalized = normalize_categories(arr)?;
        app.payload["categories"] = json!(normalized);
    }

    if let Some(ref bio_raw) = body.bio {
        if bio_raw.len() > MAX_LEN_BIO {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("bio_too_long")),
            ));
        }
        let trimmed = bio_raw.trim();
        app.payload["bio"] = if trimmed.is_empty() {
            Value::Null
        } else {
            json!(trimmed)
        };
    }

    if let Some(ref url_raw) = body.avatar_url {
        validate_http_url("avatar_url", url_raw)?;
        let trimmed = url_raw.trim();
        app.payload["avatar_url"] = if trimmed.is_empty() {
            Value::Null
        } else {
            json!(trimmed)
        };
    }

    if let Some(ref url_raw) = body.cover_url {
        validate_http_url("cover_url", url_raw)?;
        let trimmed = url_raw.trim();
        app.payload["cover_url"] = if trimmed.is_empty() {
            Value::Null
        } else {
            json!(trimmed)
        };
    }

    let now = Utc::now();
    app.updated_at = now;
    let snapshot = app.clone();
    drop(store);

    let blocked = merchant_blocked_reasons(&state, &user, &snapshot).await;
    Ok(Json(json!({
        "status": "ok",
        "profile": merchant_profile_json(&user, &snapshot, blocked),
        "meta": { "implementation_status": "me_merchant_profile_v1" }
    })))
}

async fn steward_blocked_reasons(
    state: &ChainOffState,
    user: &UserRow,
    app: &StewardApplicationRow,
) -> Vec<&'static str> {
    if super::steward_slot_active(user, Some(app)) {
        return vec![];
    }
    let mut reasons = Vec::new();
    if !wallet_verified(state, user).await {
        reasons.push("wallet");
    }
    let st = app.status.as_str();
    if st == "stake_pending" {
        reasons.push("stake");
    }
    if matches!(st, "under_review" | "rejected" | "draft" | "submitted") {
        reasons.push("review");
    }
    reasons
}

fn steward_application_status(user: &UserRow, app: &StewardApplicationRow) -> String {
    if super::steward_slot_active(user, Some(app)) {
        "active".to_string()
    } else {
        app.status.clone()
    }
}

fn steward_profile_json(
    user: &UserRow,
    app: &StewardApplicationRow,
    blocked_reasons: Vec<&'static str>,
) -> Value {
    let (slot_state, patch_allowed) = super::slot_rbac::steward_profile_patch_gate(user, app);
    let p = &app.payload;
    let quote = steward_stake_quote_for_jurisdictions(&app.jurisdictions).ok();
    let stake_display = quote
        .as_ref()
        .and_then(|q| q.get("cumulative_ttg_units_required"))
        .map(|v| format!("{} TTG", v));
    json!({
        "motivation": payload_str(p, "motivation"),
        "tagline": payload_str(p, "tagline"),
        "jurisdictions": app.jurisdictions,
        "status": steward_application_status(user, app),
        "application_status": steward_application_status(user, app),
        "lifecycle_state": app.status,
        "slot_state": slot_state,
        "profile_patch_allowed": patch_allowed,
        "stake_quote": quote,
        "stake_display": stake_display,
        "stake_amount": quote.as_ref().and_then(|q| {
            q.get("cumulative_ttg_units_required")
                .and_then(|v| v.as_u64().or_else(|| v.as_str().and_then(|s| s.parse().ok())))
                .map(|n| n.to_string())
        }),
        "rejection_codes": app.rejection_codes,
        "rejection_message": app.rejection_message,
        "blocked_reasons": blocked_reasons,
        "updated_at": app.updated_at.to_rfc3339(),
    })
}

pub async fn get_me_region_steward_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let Some(app) = store.steward_applications_by_user.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("region_steward_profile_not_found")),
        ));
    };
    drop(store);
    let blocked = steward_blocked_reasons(&state, &user, &app).await;
    Ok(Json(json!({
        "status": "ok",
        "profile": steward_profile_json(&user, &app, blocked),
        "meta": { "implementation_status": "me_region_steward_profile_v1" }
    })))
}

#[derive(Debug, Deserialize)]
pub struct PatchMeRegionStewardProfileBody {
    #[serde(default)]
    pub motivation: Option<String>,
    #[serde(default)]
    pub tagline: Option<String>,
}

pub async fn patch_me_region_steward_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PatchMeRegionStewardProfileBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let mut store = state.store.write().await;
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let Some(app) = store.steward_applications_by_user.get_mut(&user_id) else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("region_steward_profile_not_found")),
        ));
    };
    if !super::steward_slot_active(&user, Some(app)) {
        return Err(super::slot_rbac::identity_profile_patch_forbidden());
    }

    if let Some(ref raw) = body.motivation {
        if raw.len() > MAX_LEN_BIO {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("motivation_too_long")),
            ));
        }
        let trimmed = raw.trim();
        app.payload["motivation"] = if trimmed.is_empty() {
            Value::Null
        } else {
            json!(trimmed)
        };
    }

    if let Some(ref raw) = body.tagline {
        if raw.len() > MAX_LEN_TAGLINE {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("tagline_too_long")),
            ));
        }
        let trimmed = raw.trim();
        app.payload["tagline"] = if trimmed.is_empty() {
            Value::Null
        } else {
            json!(trimmed)
        };
    }

    let now = Utc::now();
    app.updated_at = now;
    let snapshot = app.clone();
    drop(store);

    let blocked = steward_blocked_reasons(&state, &user, &snapshot).await;
    Ok(Json(json!({
        "status": "ok",
        "profile": steward_profile_json(&user, &snapshot, blocked),
        "meta": { "implementation_status": "me_region_steward_profile_v1" }
    })))
}

fn acquisition_profile_base(row: Option<&AcquisitionProfileRow>) -> Value {
    match row {
        Some(r) => json!({
            "public_bio": r.public_bio,
            "tagline": r.tagline,
            "avatar_url": r.avatar_url,
            "updated_at": r.updated_at.to_rfc3339(),
        }),
        None => json!({
            "public_bio": Value::Null,
            "tagline": Value::Null,
            "avatar_url": Value::Null,
            "updated_at": Value::Null,
        }),
    }
}

async fn acquisition_blocked_reasons(
    state: &ChainOffState,
    store: &ChainOffStore,
    user: &UserRow,
) -> Vec<&'static str> {
    let mut reasons = Vec::new();
    let wallet_ok = user
        .default_wallet_address
        .as_ref()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    if !wallet_ok || !wallet_verified(state, user).await {
        reasons.push("wallet");
    }

    let guide = store.guides_by_user.get(&user.id).and_then(|gid| store.guides.get(gid));
    let identity_status = identity_status_for_trust(user, guide);
    let risk_level = risk_level_for_trust(open_disputes_as_party_count(store, user.id));

    if let Some(ref pool) = state.db_pool {
        let db_user = match db::get_user_by_id(pool, user.id).await {
            Ok(Some(u)) => u,
            Ok(None) => db::UserRow {
                id: user.id,
                email: user.email.clone(),
                password_hash: None,
                role: user.role.clone(),
                kyc_status: user.kyc_status.clone(),
                nickname: user.nickname.clone(),
                avatar_url: user.avatar_url.clone(),
                default_wallet_address: user.default_wallet_address.clone(),
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            Err(_) => return reasons,
        };
        let Ok(snap) = db::acquisition_trust_snapshot(
            pool,
            user.id,
            &db_user,
            identity_status,
            risk_level,
        )
        .await
        else {
            return reasons;
        };
        if db::acquisition_publish_trust_blocked(identity_status, risk_level) {
            reasons.push("review");
        }
        if snap.publish_suspended {
            reasons.push("suspend");
        }
        if !snap.has_publish_bond && !snap.bond_waived_by_trust {
            reasons.push("bond");
        }
    } else if db::acquisition_publish_trust_blocked(identity_status, risk_level) {
        reasons.push("review");
    }

    reasons
}

async fn acquisition_profile_patch_gate_for_user(
    state: &ChainOffState,
    store: &ChainOffStore,
    user: &UserRow,
) -> (&'static str, bool) {
    let guide = store.guides_by_user.get(&user.id).and_then(|gid| store.guides.get(gid));
    let identity_status = identity_status_for_trust(user, guide);
    let risk_level = risk_level_for_trust(open_disputes_as_party_count(store, user.id));

    if let Some(ref pool) = state.db_pool {
        let db_user = match db::get_user_by_id(pool, user.id).await {
            Ok(Some(u)) => u,
            Ok(None) => db::UserRow {
                id: user.id,
                email: user.email.clone(),
                password_hash: None,
                role: user.role.clone(),
                kyc_status: user.kyc_status.clone(),
                nickname: user.nickname.clone(),
                avatar_url: user.avatar_url.clone(),
                default_wallet_address: user.default_wallet_address.clone(),
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            Err(_) => return ("inactive", false),
        };
        let Ok(snap) = db::acquisition_trust_snapshot(
            pool,
            user.id,
            &db_user,
            identity_status,
            risk_level,
        )
        .await
        else {
            return ("inactive", false);
        };
        return super::slot_rbac::acquisition_profile_patch_gate(snap.slot_state);
    }

    let blocked = acquisition_blocked_reasons(state, store, user).await;
    if blocked.is_empty() {
        ("active", true)
    } else {
        ("inactive", false)
    }
}

fn attach_acquisition_profile_patch_gate(profile: &mut Value, slot_state: &str, patch_allowed: bool) {
    super::slot_rbac::attach_identity_profile_patch_gate(profile, slot_state, patch_allowed);
    if let Some(obj) = profile.as_object_mut() {
        obj.insert("acquisition_slot_state".to_string(), json!(slot_state));
    }
}

async fn merge_acquisition_trust_readonly(
    state: &ChainOffState,
    store: &ChainOffStore,
    user: &UserRow,
    profile: &mut Value,
) {
    let guide = store.guides_by_user.get(&user.id).and_then(|gid| store.guides.get(gid));
    let identity_status = identity_status_for_trust(user, guide);
    let risk_level = risk_level_for_trust(open_disputes_as_party_count(store, user.id));

    let Some(ref pool) = state.db_pool else {
        return;
    };
    let db_user = match db::get_user_by_id(pool, user.id).await {
        Ok(Some(u)) => u,
        Ok(None) => db::UserRow {
            id: user.id,
            email: user.email.clone(),
            password_hash: None,
            role: user.role.clone(),
            kyc_status: user.kyc_status.clone(),
            nickname: user.nickname.clone(),
            avatar_url: user.avatar_url.clone(),
            default_wallet_address: user.default_wallet_address.clone(),
            created_at: user.created_at,
            updated_at: user.updated_at,
        },
        Err(e) => {
            eprintln!("WARN: get_user_by_id for acquisition profile trust: {e}");
            return;
        }
    };
    let Ok(snap) = db::acquisition_trust_snapshot(
        pool,
        user.id,
        &db_user,
        identity_status,
        risk_level,
    )
    .await
    else {
        return;
    };
    if let Some(obj) = profile.as_object_mut() {
        obj.insert(
            "acquisition_trust_score".to_string(),
            json!(snap.trust_score),
        );
        obj.insert(
            "acquisition_publish_eligible".to_string(),
            json!(snap.publish_eligible),
        );
        obj.insert(
            "acquisition_publish_bond_waived".to_string(),
            json!(snap.bond_waived_by_trust),
        );
        obj.insert(
            "acquisition_publish_bond_active".to_string(),
            json!(snap.has_publish_bond),
        );
        if let Some(d) = snap.bond_display {
            obj.insert("acquisition_publish_bond_display".to_string(), json!(d));
        }
        obj.insert(
            "acquisition_listings_published_24h".to_string(),
            json!(snap.listings_published_24h),
        );
        obj.insert(
            "acquisition_publish_suspended".to_string(),
            json!(snap.publish_suspended),
        );
        obj.insert(
            "acquisition_fulfillment_bond_active".to_string(),
            json!(snap.has_fulfillment_bond),
        );
        if let Some(d) = snap.fulfillment_bond_display {
            obj.insert("acquisition_fulfillment_bond_display".to_string(), json!(d));
        }
        let (_, patch_allowed) = super::slot_rbac::acquisition_profile_patch_gate(snap.slot_state);
        attach_acquisition_profile_patch_gate(profile, snap.slot_state, patch_allowed);
    }
}

async fn ensure_acquisition_profile_patch_gate(
    state: &ChainOffState,
    store: &ChainOffStore,
    user: &UserRow,
    profile: &mut Value,
) {
    if profile.get("profile_patch_allowed").is_some() {
        return;
    }
    let (slot_state, patch_allowed) =
        acquisition_profile_patch_gate_for_user(state, store, user).await;
    attach_acquisition_profile_patch_gate(profile, slot_state, patch_allowed);
}

pub async fn get_me_acquisition_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };
    let row = store.acquisition_profiles_by_user.get(&user_id);
    let mut profile = acquisition_profile_base(row);
    let blocked = acquisition_blocked_reasons(&state, &store, &user).await;
    if let Some(obj) = profile.as_object_mut() {
        obj.insert("blocked_reasons".to_string(), json!(blocked));
    }
    merge_acquisition_trust_readonly(&state, &store, &user, &mut profile).await;
    ensure_acquisition_profile_patch_gate(&state, &store, &user, &mut profile).await;
    drop(store);
    Ok(Json(json!({
        "status": "ok",
        "profile": profile,
        "meta": { "implementation_status": "me_acquisition_profile_v1" }
    })))
}

#[derive(Debug, Deserialize)]
pub struct PatchMeAcquisitionProfileBody {
    #[serde(default)]
    pub public_bio: Option<String>,
    #[serde(default)]
    pub tagline: Option<String>,
    #[serde(default)]
    pub avatar_url: Option<String>,
}

pub async fn patch_me_acquisition_profile_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PatchMeAcquisitionProfileBody>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    {
        let store = state.store.read().await;
        let Some(user) = store.users.get(&user_id).cloned() else {
            return Err((
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("user_not_found")),
            ));
        };
        let (_, patch_allowed) =
            acquisition_profile_patch_gate_for_user(&state, &store, &user).await;
        if !patch_allowed {
            return Err(super::slot_rbac::identity_profile_patch_forbidden());
        }
    }

    let mut store = state.store.write().await;
    let Some(user) = store.users.get(&user_id).cloned() else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };

    let entry = store
        .acquisition_profiles_by_user
        .entry(user_id)
        .or_insert_with(|| AcquisitionProfileRow {
            public_bio: None,
            tagline: None,
            avatar_url: None,
            updated_at: Utc::now(),
        });

    if let Some(ref raw) = body.public_bio {
        if raw.len() > MAX_LEN_BIO {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("public_bio_too_long")),
            ));
        }
        let trimmed = raw.trim();
        entry.public_bio = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
    }

    if let Some(ref raw) = body.tagline {
        if raw.len() > MAX_LEN_TAGLINE {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("tagline_too_long")),
            ));
        }
        let trimmed = raw.trim();
        entry.tagline = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
    }

    if let Some(ref url_raw) = body.avatar_url {
        validate_http_url("avatar_url", url_raw)?;
        let trimmed = url_raw.trim();
        entry.avatar_url = if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        };
    }

    let now = Utc::now();
    entry.updated_at = now;
    let snapshot = entry.clone();
    drop(store);

    let store_read = state.store.read().await;
    let mut profile = acquisition_profile_base(Some(&snapshot));
    let blocked = acquisition_blocked_reasons(&state, &store_read, &user).await;
    if let Some(obj) = profile.as_object_mut() {
        obj.insert("blocked_reasons".to_string(), json!(blocked));
    }
    merge_acquisition_trust_readonly(&state, &store_read, &user, &mut profile).await;
    ensure_acquisition_profile_patch_gate(&state, &store_read, &user, &mut profile).await;
    drop(store_read);

    Ok(Json(json!({
        "status": "ok",
        "profile": profile,
        "meta": { "implementation_status": "me_acquisition_profile_v1" }
    })))
}

const MERCHANT_LISTINGS_VARIANT: &str = "provider";

/// Owner-scoped 橱窗摘要：`published_count` · `draft_count`（PG）；无池时返回 0。
pub async fn get_me_merchant_listings_summary_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    if !store.users.contains_key(&user_id) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    }
    drop(store);

    let (published_count, draft_count, source) = match state.db_pool.as_ref() {
        Some(pool) => {
            let published = db::count_published_market_listings_by_owner(
                pool,
                MERCHANT_LISTINGS_VARIANT,
                user_id,
            )
            .await
            .unwrap_or(0);
            let draft = db::count_market_listing_drafts_by_owner(
                pool,
                MERCHANT_LISTINGS_VARIANT,
                user_id,
            )
            .await
            .unwrap_or(0);
            (published, draft, "postgres_catalog")
        }
        None => (0_i64, 0_i64, "chain_off_only"),
    };

    Ok(Json(json!({
        "status": "ok",
        "summary": {
            "published_count": published_count,
            "draft_count": draft_count,
        },
        "meta": {
            "implementation_status": "me_merchant_listings_summary_v1",
            "source": source,
            "variant": MERCHANT_LISTINGS_VARIANT,
        }
    })))
}

fn merchant_listing_title_from_payload(payload: &serde_json::Value) -> String {
    payload
        .get("title")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("")
        .to_string()
}

/// 从 listing `payload` 读取封面（Phase A · 发布中心卡片；字段优先级与 Studio payload 对齐）。
fn merchant_listing_cover_from_payload(payload: &serde_json::Value) -> Option<String> {
    for key in [
        "cover_url",
        "image_url",
        "hero_image_url",
        "thumbnail_url",
    ] {
        let Some(raw) = payload.get(key).and_then(|v| v.as_str()) else {
            continue;
        };
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }
    None
}

#[cfg(test)]
mod merchant_listing_payload_tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn merchant_listing_cover_prefers_cover_url() {
        let p = json!({"cover_url":"https://cdn.example/a.jpg","image_url":"https://cdn.example/b.jpg"});
        assert_eq!(
            merchant_listing_cover_from_payload(&p).as_deref(),
            Some("https://cdn.example/a.jpg")
        );
    }

    #[test]
    fn merchant_listing_cover_falls_back_to_image_url() {
        let p = json!({"image_url":"https://cdn.example/b.jpg"});
        assert_eq!(
            merchant_listing_cover_from_payload(&p).as_deref(),
            Some("https://cdn.example/b.jpg")
        );
    }
}

/// Owner-scoped 橱窗清单（已发布 + 草稿，各最多 20 条）。
pub async fn get_me_merchant_listings_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    if !store.users.contains_key(&user_id) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    }
    drop(store);

    let Some(pool) = state.db_pool.as_ref() else {
        return Ok(Json(json!({
            "status": "ok",
            "published": [],
            "drafts": [],
            "meta": {
                "implementation_status": "me_merchant_listings_v1",
                "source": "chain_off_only",
                "variant": MERCHANT_LISTINGS_VARIANT,
            }
        })));
    };

    let published_rows = db::list_published_market_listings_by_owner(
        pool,
        MERCHANT_LISTINGS_VARIANT,
        user_id,
        20,
    )
    .await
    .unwrap_or_default();
    let draft_rows = db::list_market_listing_drafts_by_owner(
        pool,
        MERCHANT_LISTINGS_VARIANT,
        user_id,
        20,
    )
    .await
    .unwrap_or_default();

    let published: Vec<Value> = published_rows
        .into_iter()
        .map(|row| {
            let title = merchant_listing_title_from_payload(&row.payload);
            let cover_url = merchant_listing_cover_from_payload(&row.payload);
            json!({
                "id": row.id.to_string(),
                "title": title,
                "status": row.status,
                "updated_at": row.updated_at.to_rfc3339(),
                "cover_url": cover_url,
            })
        })
        .collect();
    let drafts: Vec<Value> = draft_rows
        .into_iter()
        .map(|row| {
            let title = merchant_listing_title_from_payload(&row.payload);
            let cover_url = merchant_listing_cover_from_payload(&row.payload);
            json!({
                "id": row.id.to_string(),
                "title": title,
                "saved_at": row.saved_at.to_rfc3339(),
                "cover_url": cover_url,
            })
        })
        .collect();

    Ok(Json(json!({
        "status": "ok",
        "published": published,
        "drafts": drafts,
        "meta": {
            "implementation_status": "me_merchant_listings_v1",
            "source": "postgres_catalog",
            "variant": MERCHANT_LISTINGS_VARIANT,
        }
    })))
}

const ACQUISITION_LISTINGS_VARIANT: &str = "acquisition";

/// Owner-scoped 收购 listing 清单（已发布 + 草稿，各最多 20 条 · PD-009）。
pub async fn get_me_acquisition_listings_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    if !store.users.contains_key(&user_id) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    }
    drop(store);

    let Some(pool) = state.db_pool.as_ref() else {
        return Ok(Json(json!({
            "status": "ok",
            "published": [],
            "drafts": [],
            "meta": {
                "implementation_status": "me_acquisition_listings_v1",
                "source": "chain_off_only",
                "variant": ACQUISITION_LISTINGS_VARIANT,
            }
        })));
    };

    let published_rows = db::list_published_market_listings_by_owner(
        pool,
        ACQUISITION_LISTINGS_VARIANT,
        user_id,
        20,
    )
    .await
    .unwrap_or_default();
    let draft_rows = db::list_market_listing_drafts_by_owner(
        pool,
        ACQUISITION_LISTINGS_VARIANT,
        user_id,
        20,
    )
    .await
    .unwrap_or_default();

    let published: Vec<Value> = published_rows
        .into_iter()
        .map(|row| {
            let title = merchant_listing_title_from_payload(&row.payload);
            let cover_url = merchant_listing_cover_from_payload(&row.payload);
            json!({
                "id": row.id.to_string(),
                "title": title,
                "status": row.status,
                "updated_at": row.updated_at.to_rfc3339(),
                "cover_url": cover_url,
            })
        })
        .collect();
    let drafts: Vec<Value> = draft_rows
        .into_iter()
        .map(|row| {
            let title = merchant_listing_title_from_payload(&row.payload);
            let cover_url = merchant_listing_cover_from_payload(&row.payload);
            json!({
                "id": row.id.to_string(),
                "title": title,
                "saved_at": row.saved_at.to_rfc3339(),
                "cover_url": cover_url,
            })
        })
        .collect();

    Ok(Json(json!({
        "status": "ok",
        "published": published,
        "drafts": drafts,
        "meta": {
            "implementation_status": "me_acquisition_listings_v1",
            "source": "postgres_catalog",
            "variant": ACQUISITION_LISTINGS_VARIANT,
        }
    })))
}
