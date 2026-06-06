//! chain_off 向导：CreateGuideBody、StakeBody、guides_list、guide_get、guide_create、guide_stake（48 §5.4）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use sha3::{Digest, Keccak256};
use uuid::Uuid;

use super::{strict_guide_db_write_enabled, ChainOffState, GuideRow};
use traveltrust_core::product_countries::normalize_iso_country_code;
use traveltrust_core::OrderState;

#[derive(Deserialize)]
pub struct CreateGuideBody {
    pub city: String,
    #[serde(default)]
    pub country_code: Option<String>,
    #[serde(default)]
    pub languages: Option<Vec<String>>,
    #[serde(default)]
    pub service_types: Option<Vec<String>>,
    pub bio: Option<String>,
    #[serde(default)]
    pub wallet_address: Option<String>,
    #[serde(default)]
    pub real_name: Option<String>,
    #[serde(default)]
    pub passport_number: Option<String>,
    #[serde(default)]
    pub id_photo_url: Option<String>,
    #[serde(default)]
    pub language_cert_url: Option<String>,
    #[serde(default)]
    pub guide_license_url: Option<String>,
}

#[derive(Deserialize)]
pub struct StakeBody {
    pub amount: String,
}

fn is_valid_wallet_address(s: &str) -> bool {
    let t = s.trim();
    t.is_empty()
        || (t.starts_with("0x") && t.len() == 42 && t[2..].chars().all(|c| c.is_ascii_hexdigit()))
}

fn eip55_checksum(addr: &str) -> Option<String> {
    let t = addr.trim();
    if !t.starts_with("0x") || t.len() != 42 || !t[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let lower = t[2..].to_lowercase();
    let hash = {
        let mut hasher = Keccak256::new();
        hasher.update(lower.as_bytes());
        hasher.finalize()
    };
    let mut out = String::with_capacity(42);
    out.push_str("0x");
    for (i, c) in lower.chars().enumerate() {
        let nibble = if i % 2 == 0 {
            hash[i / 2] >> 4
        } else {
            hash[i / 2] & 0x0f
        };
        if nibble >= 8 {
            out.extend(c.to_uppercase());
        } else {
            out.push(c);
        }
    }
    Some(out)
}

const MAX_LEN_CITY: usize = 100;
const MAX_LEN_REAL_NAME: usize = 200;
const MAX_LEN_PASSPORT: usize = 64;
const MAX_LEN_WALLET: usize = 42;
const MAX_LEN_BIO: usize = 2000;
const MAX_ITEMS_LANG: usize = 20;
const MAX_ITEMS_SERVICE: usize = 20;
const MAX_LEN_ITEM: usize = 50;
const MAX_LEN_GUIDE_LICENSE_URL: usize = 2048;

pub async fn guides_list_impl(
    state: ChainOffState,
    city: Option<String>,
    language: Option<String>,
    service_type: Option<String>,
    country_code: Option<String>,
    page: super::OrderListPage,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let country_trim = country_code
        .as_deref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let filtered: Vec<&GuideRow> = store
        .guides
        .values()
        .filter(|g| g.status == "active")
        .filter(|g| !super::market_public_surface::is_placeholder_global_guide(g))
        .filter(|g| {
            !super::public_catalog_surface_filter_enabled()
                || !super::should_hide_guide_from_public_catalog(g, &store)
        })
        .filter(|g| {
            country_trim.map_or(true, |cc| g.country_code.eq_ignore_ascii_case(cc))
                && city.as_ref()
                    .map_or(true, |c| g.city.eq_ignore_ascii_case(c))
                && language.as_ref().map_or(true, |l| {
                    super::market_guide_filter::guide_matches_language_filter(&g.languages, l)
                })
                && service_type.as_ref().map_or(true, |s| {
                    super::market_guide_filter::guide_matches_service_filter(&g.service_types, s)
                })
        })
        .collect();
    let visible = super::market_public_surface::dedupe_guides_latest_per_user(filtered);
    let mut guides: Vec<&GuideRow> = visible;

    if let Some(lim) = page.limit {
        guides.sort_by(|a, b| (b.created_at, b.id).cmp(&(a.created_at, a.id)));
        let start = match page.cursor {
            None => 0usize,
            Some(cid) => guides
                .iter()
                .position(|g| g.id == cid)
                .map(|i| i + 1)
                .ok_or_else(|| {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_cursor",
                            "cursor must be the id field of the last item from the previous page",
                        )),
                    )
                })?,
        };
        let total = guides.len();
        let page_guides: Vec<_> = guides.into_iter().skip(start).take(lim).collect();
        let has_more = start + page_guides.len() < total;
        let next_cursor = if has_more {
            page_guides.last().map(|g| g.id.to_string())
        } else {
            None
        };
        let list: Vec<serde_json::Value> = page_guides
            .iter()
            .map(|g| guide_list_card_json(g))
            .collect();
        return Ok(Json(json!({
            "status": "ok",
            "items": list,
            "page": {
                "limit": lim,
                "next_cursor": next_cursor,
                "has_more": has_more
            }
        })));
    }

    guides.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    let list: Vec<serde_json::Value> = guides.iter().map(|g| guide_list_card_json(g)).collect();
    Ok(Json(json!({ "status": "ok", "items": list })))
}

fn guide_list_card_json(g: &GuideRow) -> serde_json::Value {
    json!({
        "id": g.id.to_string(),
        "user_id": g.user_id.to_string(),
        "city": g.city,
        "country_code": g.country_code,
        "languages": g.languages,
        "service_types": g.service_types,
        "bio": g.bio,
        "stake_amount": g.stake_amount,
        "status": g.status,
        "created_at": g.created_at.to_rfc3339()
    })
}

/// Admin 列表/详情共用：与 `GET /api/v1/admin/guides` 行同形；不含 `passport_number` / `passport_number_hash`。
pub fn guide_admin_row_json(g: &GuideRow) -> serde_json::Value {
    json!({
        "id": g.id,
        "user_id": g.user_id,
        "city": g.city,
        "country_code": g.country_code,
        "languages": g.languages,
        "service_types": g.service_types,
        "bio": g.bio,
        "wallet_address": g.wallet_address,
        "real_name": g.real_name,
        "stake_amount": g.stake_amount,
        "status": g.status,
        "id_photo_url": g.id_photo_url,
        "language_cert_url": g.language_cert_url,
        "guide_license_url": g.guide_license_url,
        "rejection_codes": g.rejection_codes,
        "rejection_message": g.rejection_message,
        "created_at": g.created_at,
        "updated_at": g.updated_at,
    })
}

pub fn guide_admin_detail_envelope(g: &GuideRow) -> serde_json::Value {
    json!({
        "status": "ok",
        "guide": guide_admin_row_json(g),
    })
}

pub async fn guide_get_impl(
    state: ChainOffState,
    id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let g = store.guides.get(&id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;
    if super::market_public_surface::is_placeholder_global_guide(g) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_not_found")),
        ));
    }
    if super::public_catalog_surface_filter_enabled()
        && super::should_hide_guide_from_public_catalog(g, &store)
    {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_not_found")),
        ));
    }
    Ok(Json(json!({
        "status": "ok",
        "guide": {
            "id": g.id.to_string(),
            "user_id": g.user_id.to_string(),
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
            "stake_amount": g.stake_amount,
            "status": g.status,
            "created_at": g.created_at.to_rfc3339()
        }
    })))
}

pub async fn guide_create_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<CreateGuideBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let city_trim = body.city.trim();
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
            Json(crate::api_json::err_key_detail(
                "city_too_long",
                format!("city max {} chars", MAX_LEN_CITY),
            )),
        ));
    }
    let cc_raw = body.country_code.as_deref().unwrap_or("").trim();
    if cc_raw.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "invalid_country_code",
                "country_code is required (ISO 3166-1 alpha-2; product allow-list)",
            )),
        ));
    }
    let Some(cc_norm) = normalize_iso_country_code(cc_raw) else {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "invalid_country_code",
                "country_code must be one of CN, JP, KR, SG, TH, AE, US, AU, FR, ES",
            )),
        ));
    };
    let wallet_result = body.wallet_address.as_ref().and_then(|w| {
        let w = w.trim();
        if w.is_empty() {
            return None;
        }
        if !is_valid_wallet_address(w) {
            return Some(Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_wallet_address",
                    "wallet_address must be 0x followed by 40 hex characters",
                )),
            )));
        }
        if w.len() > MAX_LEN_WALLET {
            return Some(Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("wallet_too_long")),
            )));
        }
        let lower = format!("0x{}", w.strip_prefix("0x").unwrap_or(w).to_lowercase());
        let canonical = eip55_checksum(&lower);
        let validate_eip55 = std::env::var("VALIDATE_EIP55").as_deref() == Ok("1");
        if validate_eip55 {
            if w != canonical.as_deref().unwrap_or(&lower) && w != lower.as_str() {
                return Some(Err((
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_wallet_address",
                        "wallet_address must pass EIP-55 checksum (set VALIDATE_EIP55=1)",
                    )),
                )));
            }
        }
        Some(Ok(canonical.unwrap_or_else(|| w.to_string())))
    });
    let wallet_to_store: Option<String> = match wallet_result {
        None => None,
        Some(Ok(s)) => Some(s),
        Some(Err(e)) => return Err(e),
    };
    if std::env::var("REQUIRE_ID_PHOTO").as_deref() == Ok("1") {
        let missing = body
            .id_photo_url
            .as_ref()
            .map_or(true, |s| s.trim().is_empty());
        if missing {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "id_photo_required",
                    "id_photo_url is required when REQUIRE_ID_PHOTO=1",
                )),
            ));
        }
    }
    if let Some(ref s) = body.real_name {
        if s.len() > MAX_LEN_REAL_NAME {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("real_name_too_long")),
            ));
        }
    }
    if let Some(ref s) = body.passport_number {
        if s.len() > MAX_LEN_PASSPORT {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("passport_number_too_long")),
            ));
        }
    }
    if let Some(ref s) = body.bio {
        if s.len() > MAX_LEN_BIO {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("bio_too_long")),
            ));
        }
    }
    if let Some(ref arr) = body.languages {
        if arr.len() > MAX_ITEMS_LANG || arr.iter().any(|x| x.len() > MAX_LEN_ITEM) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("languages_invalid")),
            ));
        }
    }
    if let Some(ref arr) = body.service_types {
        if arr.len() > MAX_ITEMS_SERVICE || arr.iter().any(|x| x.len() > MAX_LEN_ITEM) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("service_types_invalid")),
            ));
        }
    }
    if let Some(ref s) = body.guide_license_url {
        let u = s.trim();
        if !u.is_empty() {
            if u.len() > MAX_LEN_GUIDE_LICENSE_URL {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "guide_license_url_invalid",
                        format!("guide_license_url max {} chars", MAX_LEN_GUIDE_LICENSE_URL),
                    )),
                ));
            }
            if !u.starts_with("http://") && !u.starts_with("https://") {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "guide_license_url_invalid",
                        "guide_license_url must start with http:// or https://",
                    )),
                ));
            }
        }
    }

    let mut store = state.store.write().await;
    if store.guides_by_user.contains_key(&user_id) {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("already_guide")),
        ));
    }
    let id = Uuid::new_v4();
    let now = Utc::now();
    let passport_number_hash = body.passport_number.as_ref().map(|s| {
        let mut hasher = Keccak256::new();
        hasher.update(s.as_bytes());
        format!("{:x}", hasher.finalize())
    });
    let user_email = store
        .users
        .get(&user_id)
        .map(|u| u.email.clone())
        .unwrap_or_default();
    let data_origin = super::infer_entity_data_origin_from_email(&user_email).to_string();
    let languages_store = body
        .languages
        .as_ref()
        .map(|v| super::market_guide_filter::normalize_languages_for_storage(v))
        .unwrap_or_default();
    let service_types_store = body
        .service_types
        .as_ref()
        .map(|v| super::market_guide_filter::normalize_service_types_for_storage(v))
        .unwrap_or_default();
    let guide = GuideRow {
        id,
        user_id,
        city: city_trim.to_string(),
        country_code: cc_norm.to_string(),
        languages: languages_store,
        service_types: service_types_store,
        bio: body.bio.clone(),
        wallet_address: wallet_to_store,
        real_name: body.real_name.clone(),
        passport_number_hash,
        id_photo_url: body.id_photo_url.clone(),
        language_cert_url: body.language_cert_url.clone(),
        guide_license_url: body.guide_license_url.clone(),
        stake_amount: "0".to_string(),
        status: "pending".to_string(),
        rejection_codes: vec![],
        rejection_message: None,
        data_origin,
        created_at: now,
        updated_at: now,
    };
    store.guides.insert(id, guide.clone());
    store.guides_by_user.insert(user_id, id);

    if let Some(ref pool) = state.db_pool {
        if let Err(e) = crate::db::insert_guide_with_data_origin(
            pool,
            guide.id,
            guide.user_id,
            &guide.city,
            &guide.country_code,
            &guide.languages,
            &guide.service_types,
            guide.bio.as_deref(),
            guide.wallet_address.as_deref(),
            guide.real_name.as_deref(),
            guide.passport_number_hash.as_deref(),
            guide.id_photo_url.as_deref(),
            guide.language_cert_url.as_deref(),
            guide.guide_license_url.as_deref(),
            &guide.stake_amount,
            &guide.status,
            guide.created_at,
            guide.updated_at,
            &guide.data_origin,
        )
        .await
        {
            eprintln!(
                "[audit] db insert_guide failed guide_id={} user_id={} error={}",
                guide.id, guide.user_id, e
            );
            if strict_guide_db_write_enabled() {
                store.guides.remove(&id);
                store.guides_by_user.remove(&user_id);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "guide_db_persist_failed",
                        "message": "guide_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_GUIDE_DB_WRITE=1; guide row removed from memory",
                    })),
                ));
            }
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "guide": {
            "id": guide.id.to_string(),
            "user_id": guide.user_id.to_string(),
            "city": guide.city,
            "status": guide.status,
            "created_at": guide.created_at.to_rfc3339()
        }
    })))
}

pub async fn guide_stake_impl(
    state: ChainOffState,
    guide_id: Uuid,
    Json(body): Json<StakeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let guide = store.guides.get_mut(&guide_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;
    guide.stake_amount = body.amount;
    guide.updated_at = Utc::now();
    if guide.stake_amount != "0" && guide.status == "pending" {
        guide.status = "active".to_string();
    }
    Ok(Json(
        json!({ "status": "ok", "stake_amount": guide.stake_amount }),
    ))
}

/// B-079：`GET …/guides/:id/availability` — 与接单 **`has_overlapping_lock`**（锁定表）及 **Accepted / Escrowed / Disputed** 且含 **`start_date`/`end_date`** 的订单同源；`source`=`lock` 优先于同 **`order_id`** 的 `order` 行。
pub async fn guide_availability_impl(
    state: ChainOffState,
    guide_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let _guide = store.guides.get(&guide_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;
    let locked = crate::schedule_engine::locked_slots_for_guide(guide_id).await;
    let mut seen_order: std::collections::HashSet<Uuid> =
        locked.iter().map(|(oid, _)| *oid).collect();
    let mut occupied: Vec<serde_json::Value> = Vec::new();
    for (oid, r) in locked {
        occupied.push(json!({
            "order_id": oid.to_string(),
            "start_date": r.start_date.format("%Y-%m-%d").to_string(),
            "end_date": r.end_date.format("%Y-%m-%d").to_string(),
            "source": "lock",
        }));
    }
    for o in store.orders.values() {
        if o.guide_id != guide_id {
            continue;
        }
        if !matches!(
            o.state,
            OrderState::Accepted | OrderState::Escrowed | OrderState::Disputed
        ) {
            continue;
        }
        let (Some(s), Some(e)) = (o.start_date, o.end_date) else {
            continue;
        };
        if seen_order.contains(&o.id) {
            continue;
        }
        seen_order.insert(o.id);
        occupied.push(json!({
            "order_id": o.id.to_string(),
            "start_date": s.format("%Y-%m-%d").to_string(),
            "end_date": e.format("%Y-%m-%d").to_string(),
            "source": "order",
        }));
    }
    Ok(Json(json!({
        "status": "ok",
        "guide_id": guide_id.to_string(),
        "occupied_ranges": occupied,
    })))
}
