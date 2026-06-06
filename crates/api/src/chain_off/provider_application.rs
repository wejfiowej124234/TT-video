//! `GET /api/v1/me/provider-application` · `POST /api/v1/provider-applications` — 商家资质申请（① 本地）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use super::provider_kyb::{
    validate_provider_kyb_fields, BeneficialOwnerBody, ProviderAddressBody,
};
use super::ChainOffState;

#[derive(Clone, Debug)]
pub struct ProviderApplicationRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub status: String,
    pub payload: Value,
    pub submitted_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
    pub rejection_codes: Vec<String>,
    pub rejection_message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PostProviderApplicationBody {
    pub legal_name: String,
    pub entity_type: String,
    pub registration_number: String,
    pub country_code: String,
    pub city: String,
    pub contact_name: String,
    pub contact_phone: String,
    pub contact_email: String,
    pub shop_name: String,
    #[serde(default)]
    pub categories: Option<String>,
    #[serde(default)]
    pub bio: Option<String>,
    pub wallet_address: String,
    #[serde(default)]
    pub tax_id: Option<String>,
    #[serde(default)]
    pub business_license_url: Option<String>,
    #[serde(default)]
    pub insurance_url: Option<String>,
    pub registered_address: ProviderAddressBody,
    #[serde(default)]
    pub operating_same_as_registered: bool,
    #[serde(default)]
    pub operating_address: Option<ProviderAddressBody>,
    #[serde(default)]
    pub beneficial_owners: Vec<BeneficialOwnerBody>,
    #[serde(default)]
    pub legal_representative_id_url: Option<String>,
    #[serde(default)]
    pub travel_agency_permit_url: Option<String>,
}

fn provider_email_verification_required() -> bool {
    std::env::var("TRAVELTRUST_PROVIDER_REQUIRE_EMAIL_VERIFIED")
        .ok()
        .map(|s| {
            let t = s.trim();
            t == "1" || t.eq_ignore_ascii_case("true") || t.eq_ignore_ascii_case("yes")
        })
        .unwrap_or(false)
}

fn normalize_wallet(w: &str) -> Option<String> {
    let w = w.trim();
    if w.len() <= 42 && w.starts_with("0x") && w[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        Some(w.to_string())
    } else {
        None
    }
}

fn provider_application_json(
    user_role: &str,
    app: Option<ProviderApplicationRow>,
) -> serde_json::Value {
    if user_role == "provider" {
        return json!({
            "status": "ok",
            "application": {
                "status": "approved",
                "user_role": "provider"
            },
            "meta": { "implementation_status": "provider_application_role_active" }
        });
    };
    let Some(a) = app else {
        return json!({
            "status": "ok",
            "application": null,
            "meta": { "implementation_status": "provider_application_none" }
        });
    };
    json!({
        "status": "ok",
        "application": {
            "id": a.id,
            "status": a.status,
            "payload": a.payload,
            "submitted_at": a.submitted_at.to_rfc3339(),
            "rejection_codes": a.rejection_codes,
            "rejection_message": a.rejection_message
        },
        "meta": { "implementation_status": "provider_application_memory" }
    })
}

pub async fn get_provider_application_me_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let user_role = store
        .users
        .get(&user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    let app = store.provider_applications_by_user.get(&user_id).cloned();
    Ok(Json(provider_application_json(&user_role, app)))
}

pub async fn get_provider_application_for_user_impl(
    state: ChainOffState,
    target_user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    if store.users.get(&target_user_id).is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    };    let user_role = store
        .users
        .get(&target_user_id)
        .map(|u| u.role.clone())
        .unwrap_or_else(|| "traveler".to_string());
    let app = store
        .provider_applications_by_user
        .get(&target_user_id)
        .cloned();
    Ok(Json(provider_application_json(&user_role, app)))
}

pub async fn post_provider_application_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<PostProviderApplicationBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let legal_name = body.legal_name.trim();
    let registration_number = body.registration_number.trim();
    let country_code = body.country_code.trim();
    let city = body.city.trim();
    let contact_name = body.contact_name.trim();
    let contact_phone = body.contact_phone.trim();
    let contact_email = body.contact_email.trim();
    let shop_name = body.shop_name.trim();

    let kyb = validate_provider_kyb_fields(
        &body.entity_type,
        country_code,
        &body.registered_address,
        body.operating_same_as_registered,
        body.operating_address.as_ref(),
        &body.beneficial_owners,
        body.legal_representative_id_url.as_deref(),
        body.travel_agency_permit_url.as_deref(),
    )
    .map_err(|key| (StatusCode::BAD_REQUEST, Json(crate::api_json::err_key(key))))?;

    if legal_name.is_empty()
        || registration_number.is_empty()
        || city.is_empty()
        || contact_name.is_empty()
        || contact_phone.is_empty()
        || !contact_email.contains('@')
        || shop_name.is_empty()
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("provider_application_invalid_fields")),
        ));
    };    if kyb.registered_address.city != city {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("provider_application_registered_city_mismatch")),
        ));
    };    let wallet = normalize_wallet(&body.wallet_address).ok_or((
        StatusCode::BAD_REQUEST,
        Json(crate::api_json::err_key("provider_application_invalid_wallet")),
    ))?;

    let business_license = body
        .business_license_url
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if business_license.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("provider_application_business_license_required")),
        ));
    };    let store_read = state.store.read().await;
    if provider_email_verification_required() {
        let verified_pg = if let Some(ref pool) = state.db_pool {
            sqlx::query_scalar::<_, Option<chrono::DateTime<Utc>>>(
                "SELECT email_verified_at FROM users WHERE id = $1",
            )
            .bind(user_id)
            .fetch_optional(pool)
            .await
            .ok()
            .flatten()
            .flatten()
            .is_some()
        } else {
            false
        };        if !verified_pg {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key("provider_application_email_not_verified")),
            ));
        }
    };    if store_read.users.get(&user_id).map(|u| u.role.as_str()) == Some("provider") {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("provider_application_already_provider")),
        ));
    };    let existing = store_read.provider_applications_by_user.get(&user_id).cloned();
    if let Some(ref ex) = existing {
        let st = ex.status.to_ascii_lowercase();
        if st == "submitted" || st == "reviewing" || st == "approved" {
            return Err((
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("provider_application_pending")),
            ));
        }
    }
    drop(store_read);

    let now = Utc::now();
    let app_id = existing.as_ref().map(|e| e.id).unwrap_or_else(Uuid::new_v4);
    let payload = json!({
        "legal_name": legal_name,
        "entity_type": kyb.entity_type,
        "registration_number": registration_number,
        "country_code": kyb.country_code,
        "city": city,
        "registered_address": kyb.registered_address,
        "operating_same_as_registered": body.operating_same_as_registered,
        "operating_address": kyb.operating_address,
        "beneficial_owners": kyb.beneficial_owners,
        "legal_representative_id_url": kyb.legal_representative_id_url,
        "travel_agency_permit_url": kyb.travel_agency_permit_url,
        "contact_name": contact_name,
        "contact_phone": contact_phone,
        "contact_email": contact_email,
        "shop_name": shop_name,
        "categories": body.categories,
        "bio": body.bio,
        "wallet_address": wallet,
        "tax_id": body.tax_id,
        "business_license_url": business_license,
        "insurance_url": body.insurance_url,
    });

    let submitted_at = existing
        .as_ref()
        .map(|e| e.submitted_at)
        .unwrap_or(now);
    let row = ProviderApplicationRow {
        id: app_id,
        user_id,
        status: "submitted".to_string(),
        payload: payload.clone(),
        submitted_at,
        updated_at: now,
        rejection_codes: vec![],
        rejection_message: None,
    };

    {
        let mut store = state.store.write().await;
        if let Some(u) = store.users.get_mut(&user_id) {
            u.default_wallet_address = Some(wallet.clone());
            u.updated_at = now;
        }
        store
            .provider_applications_by_user
            .insert(user_id, row.clone());
    };
    if let Some(ref pool) = state.db_pool {
        let ubo_refs: Vec<(&str, &str, &str)> = kyb
            .beneficial_owners
            .iter()
            .map(|o| {
                (
                    o.full_name.as_str(),
                    o.id_number.as_str(),
                    o.id_doc_url.as_str(),
                )
            })
            .collect();
        crate::db::dual_write_after_provider_application_submit(
            pool,
            user_id,
            app_id,
            &payload,
            &crate::db::ProviderApplicationDocuments {
                business_license_url: business_license,
                insurance_url: body.insurance_url.as_deref(),
                tax_id: body.tax_id.as_deref(),
                travel_agency_permit_url: kyb.travel_agency_permit_url.as_deref(),
                legal_representative_id_url: kyb.legal_representative_id_url.as_deref(),
                beneficial_owners: &ubo_refs,
            },
            now,
        )
        .await;
    }

    Ok(Json(json!({
        "status": "ok",
        "application_id": app_id,
        "application_status": "submitted",
        "resubmitted": existing.is_some(),
        "next": "/me/onboarding?role=provider",
        "meta": { "implementation_status": "provider_application_submitted" }
    })))
}

/// Admin 列表：内存真源 **`provider_applications_by_user`**（可选 **`status`** 过滤）。
pub async fn list_provider_applications_admin_impl(
    state: ChainOffState,
    status_filter: Option<String>,
) -> Json<serde_json::Value> {
    let store = state.store.read().await;
    let filter = status_filter
        .as_deref()
        .map(|s| s.trim().to_ascii_lowercase())
        .filter(|s| !s.is_empty());
    let mut items: Vec<serde_json::Value> = store
        .provider_applications_by_user
        .iter()
        .filter(|(_, app)| {
            filter.as_ref().map_or(true, |f| app.status.to_ascii_lowercase() == *f)
        })
        .map(|(user_id, app)| {
            let email = store.users.get(user_id).map(|u| u.email.clone());
            let role = store
                .users
                .get(user_id)
                .map(|u| u.role.clone())
                .unwrap_or_else(|| "traveler".to_string());
            json!({
                "user_id": user_id,
                "email": email,
                "user_role": role,
                "application": {
                    "id": app.id,
                    "status": app.status,
                    "shop_name": app.payload.get("shop_name"),
                    "legal_name": app.payload.get("legal_name"),
                    "country_code": app.payload.get("country_code"),
                    "entity_type": app.payload.get("entity_type"),
                    "submitted_at": app.submitted_at.to_rfc3339(),
                    "rejection_codes": app.rejection_codes,
                }
            })
        })
        .collect();
    items.sort_by(|a, b| {
        let ta = a["application"]["submitted_at"].as_str().unwrap_or("");
        let tb = b["application"]["submitted_at"].as_str().unwrap_or("");
        tb.cmp(ta)
    });
    Json(json!({
        "status": "ok",
        "items": items,
        "meta": { "implementation_status": "provider_applications_admin_list" }
    }))
}

#[derive(Debug, Deserialize)]
pub struct PatchProviderApplicationReviewBody {
    pub status: String,
    #[serde(default)]
    pub rejection_codes: Vec<String>,
    #[serde(default)]
    pub rejection_message: Option<String>,
}

/// Admin 审核商家申请（① 内存真源；PG 时双写 `role_applications`）。
pub async fn admin_review_provider_application_impl(
    state: ChainOffState,
    target_user_id: Uuid,
    Json(body): Json<PatchProviderApplicationReviewBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let status = body.status.trim().to_ascii_lowercase();
    if status != "approved" && status != "rejected" && status != "reviewing" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("provider_application_invalid_review_status")),
        ));
    };    let mut store = state.store.write().await;
    let app = store
        .provider_applications_by_user
        .get(&target_user_id)
        .cloned()
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("provider_application_not_found")),
        ))?;

    let now = Utc::now();
    let codes: Vec<String> = body
        .rejection_codes
        .iter()
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty())
        .collect();
    let rejection_message = body
        .rejection_message
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    let updated = ProviderApplicationRow {
        status: status.clone(),
        updated_at: now,
        rejection_codes: if status == "rejected" {
            codes.clone()
        } else {
            vec![]
        },
        rejection_message: if status == "rejected" {
            rejection_message.clone()
        } else {
            None
        },
        ..app
    };
    store
        .provider_applications_by_user
        .insert(target_user_id, updated.clone());

    if status == "approved" {
        if let Some(u) = store.users.get_mut(&target_user_id) {
            u.role = "provider".to_string();
            u.updated_at = now;
        }
    };    let app_id = updated.id;
    drop(store);

    if let Some(ref pool) = state.db_pool {
        crate::db::dual_write_after_provider_application_review(
            pool,
            target_user_id,
            app_id,
            &status,
            &codes,
            rejection_message.as_deref(),
            now,
        )
        .await;
        if status == "approved" {
            let _ = crate::db::update_user_role_if_safe(pool, target_user_id, "provider").await;
        };        let payload = json!({
            "application_id": app_id,
            "application_status": status,
            "rejection_codes": codes,
            "rejection_message": rejection_message,
        });
        let template = match status.as_str() {
            "approved" => "provider_application_approved",
            "rejected" => "provider_application_rejected",
            _ => "provider_application_reviewing",
        };
        if let Err(e) = crate::db::insert_user_security_notification(
            pool,
            target_user_id,
            "provider_application_review",
            template,
            &payload,
        )
        .await
        {
            eprintln!("[provider_application] security_notification err={e}");
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "user_id": target_user_id,
        "application_status": status,
        "user_role_updated": status == "approved",
        "meta": { "implementation_status": "provider_application_admin_review" }
    })))
}
