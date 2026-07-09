//! 94 子站：**`POST …/market/{provider|acquisition}/listings/:id/orders`** — 从已发布 listing 创建 **`Order`**（复用 chain_off 状态机 + PG 双写）。

use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use serde_json::{json, Value};
use traveltrust_core::OrderState;
use uuid::Uuid;

use super::orders::minimal_itinerary_bundle_for_simple_order;
use super::{persist_order_if_db, strict_order_db_write_enabled, try_persist_order_to_db, ChainOffState, GuideRow, OrderRow};
use crate::db;

fn listing_amount_from_payload(payload: &Value, variant: &str) -> Result<String, &'static str> {
    let obj = payload.as_object().ok_or("payload_must_be_object")?;
    let raw = if variant == "provider" {
        obj.get("priceUsdc")
            .or_else(|| obj.get("price_usdc"))
            .or_else(|| obj.get("price"))
    } else {
        obj.get("bountyMinUsdc")
            .or_else(|| obj.get("bounty_min_usdc"))
            .or_else(|| obj.get("bountyMin"))
    };
    let Some(v) = raw else {
        return Err("listing_price_missing");
    };
    let amount = if let Some(n) = v.as_f64() {
        if n > 0.0 {
            format!("{n}")
        } else {
            return Err("listing_price_invalid");
        }
    } else if let Some(s) = v.as_str() {
        let t = s.trim();
        if t.is_empty() {
            return Err("listing_price_invalid");
        }
        if t.parse::<f64>().ok().filter(|&n| n > 0.0).is_none() {
            return Err("listing_price_invalid");
        }
        t.to_string()
    } else if let Some(n) = v.as_i64() {
        if n > 0 {
            n.to_string()
        } else {
            return Err("listing_price_invalid");
        }
    } else {
        return Err("listing_price_invalid");
    }
;
    Ok(amount)
}

fn listing_bounty_max_from_payload(payload: &Value) -> Option<f64> {
    let obj = payload.as_object()?;
    let raw = obj
        .get("bountyMaxUsdc")
        .or_else(|| obj.get("bounty_max_usdc"))
        .or_else(|| obj.get("bountyMax"))?;
    if let Some(n) = raw.as_f64() {
        return (n > 0.0).then_some(n);
    }
    raw.as_str()
        .and_then(|s| s.trim().parse::<f64>().ok())
        .filter(|&n| n > 0.0)
}

fn listing_title_for_itinerary(payload: &Value) -> String {
    payload
        .get("title")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("Market listing order")
        .to_string()
}

async fn ensure_guide_in_store(state: &ChainOffState, guide_id: Uuid) -> Result<(), (StatusCode, Json<Value>)> {
    {
        let store = state.store.read().await;
        if store.guides.contains_key(&guide_id) {
            return Ok(());
        }
    };
    let Some(pool) = state.db_pool.as_ref() else {
        return Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required",
                "message": "database_required",
            })),
        ));
    };
    let Some(row) = db::select_guide_by_id(pool, guide_id)
        .await
        .map_err(|e| {
            eprintln!("WARN: select_guide_by_id failed: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "guide_lookup_failed",
                    "message": "guide_lookup_failed",
                })),
            )
        })?
    else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "guide_not_found",
                "message": "guide_not_found",
            })),
        ));
    };
    let guide = GuideRow {
        id: row.id,
        user_id: row.user_id,
        city: row.city.clone(),
        country_code: row.country_code.clone(),
        languages: row.languages.clone(),
        service_types: row.service_types.clone(),
        bio: row.bio.clone(),
        wallet_address: row.wallet_address.clone(),
        real_name: row.real_name.clone(),
        passport_number_hash: row.passport_number_hash.clone(),
        id_photo_url: row.id_photo_url.clone(),
        language_cert_url: row.language_cert_url.clone(),
        guide_license_url: row.guide_license_url.clone(),
        stake_amount: row.stake_amount.clone(),
        hourly_rate: row.hourly_rate.clone(),
        avatar_url: row.avatar_url.clone(),
        public_title: row.public_title.clone(),
        status: row.status.clone(),
        rejection_codes: row.rejection_codes.clone(),
        rejection_message: row.rejection_message.clone(),
        data_origin: row.data_origin.clone(),
        display_status: row.display_status.clone(),
        display_origin: row.display_origin.clone(),
        featured: row.featured,
        display_priority: row.display_priority,
        display_surfaces: row.display_surfaces.clone(),
        display_start_at: row.display_start_at,
        display_end_at: row.display_end_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
    if guide.status != "active" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "guide_not_active",
                "message": "guide_not_active",
            })),
        ));
    };
    let mut store = state.store.write().await;
    store.guides.insert(guide_id, guide.clone());
    store.guides_by_user.insert(guide.user_id, guide_id);
    Ok(())
}

pub async fn market_listing_order_create_impl(
    state: ChainOffState,
    session_user: Uuid,
    variant: &str,
    listing_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let Some(pool) = state.db_pool.as_ref() else {
        return Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required",
                "message": "database_required",
            })),
        ));
    };
    let Some(listing) = db::select_market_listing_by_id(pool, listing_id, variant)
        .await
        .map_err(|e| {
            eprintln!("WARN: select_market_listing_by_id failed: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "market_listing_lookup_failed",
                    "message": "market_listing_lookup_failed",
                })),
            )
        })?
    else {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "listing_not_found",
                "message": "listing_not_found",
            })),
        ));
    }
;
    let (tourist_id, guide_user_id, order_kind) = match variant {
        "provider" => {
            if session_user == listing.owner_user_id {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "error": "cannot_order_own_listing",
                        "message": "cannot_order_own_listing",
                    })),
                ));
            }
            (session_user, listing.owner_user_id, "merchant_listing")
        }
        "acquisition" => {
            if session_user == listing.owner_user_id {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "error": "cannot_accept_own_listing",
                        "message": "cannot_accept_own_listing",
                    })),
                ));
            }
            (listing.owner_user_id, session_user, "acquisition_listing")
        }
        _ => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "invalid_variant",
                    "message": "invalid_variant",
                })),
            ))
        }
    };
    let amount = listing_amount_from_payload(&listing.payload, variant).map_err(|reason| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_market_listing_payload",
                "message": "invalid_market_listing_payload",
                "reason": reason,
            })),
        )
    })?;

    if variant == "acquisition" {
        if let Some(max_bounty) = listing_bounty_max_from_payload(&listing.payload) {
            if max_bounty >= db::ACQUISITION_FULFILLMENT_BOND_THRESHOLD_USDC {
                let bonded = db::has_locked_acquisition_fulfillment_bond(pool, session_user)
                    .await
                    .map_err(|e| {
                        eprintln!("WARN: has_locked_acquisition_fulfillment_bond: {e}");
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!({
                                "error": "acquisition_trust_lookup_failed",
                                "message": "acquisition_trust_lookup_failed",
                            })),
                        )
                    })?;
                if !bonded {
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(json!({
                            "error": "acquisition_fulfillment_bond_required",
                            "message": "acquisition_fulfillment_bond_required",
                        })),
                    ));
                }
            }
        }
        let store = state.store.read().await;
        if let Some(err_key) =
            crate::chain_off::me::tourist_order_trust_gate(&store, guide_user_id)
        {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key(err_key)),
            ));
        }
    }
    let guide_id = if variant == "acquisition" {
        let carrier_user = db::get_user_by_id(pool, guide_user_id)
            .await
            .map_err(|e| {
                eprintln!("WARN: get_user_by_id acquisition fulfillment: {e}");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "acquisition_trust_lookup_failed",
                        "message": "acquisition_trust_lookup_failed",
                    })),
                )
            })?
            .ok_or_else(|| {
                (
                    StatusCode::FORBIDDEN,
                    Json(json!({
                        "error": "acquisition_trust_restricted",
                        "message": "acquisition_trust_restricted",
                    })),
                )
            })?;
        db::ensure_acquisition_fulfillment_guide_id(
            pool,
            guide_user_id,
            carrier_user.default_wallet_address.as_deref(),
        )
        .await
        .map_err(|e| {
            eprintln!("WARN: ensure_acquisition_fulfillment_guide_id failed: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "guide_lookup_failed",
                    "message": "guide_lookup_failed",
                })),
            )
        })?
    } else {
        match db::select_active_guide_id_for_user(pool, guide_user_id).await {
            Ok(Some(id)) => id,
            Ok(None) => {
                return Err((
                    StatusCode::UNPROCESSABLE_ENTITY,
                    Json(json!({
                        "error": "market_listing_fulfillment_guide_required",
                        "message": "market_listing_fulfillment_guide_required",
                        "hint": "fulfillment party must have an active guide profile",
                    })),
                ));
            }
            Err(e) => {
                eprintln!("WARN: select_active_guide_id_for_user failed: {e}");
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "guide_lookup_failed",
                        "message": "guide_lookup_failed",
                    })),
                ));
            }
        }
    };

    ensure_guide_in_store(&state, guide_id).await?;

    {
        let store = state.store.read().await;
        if let Some(err_key) = crate::chain_off::me::tourist_order_trust_gate(&store, tourist_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key(err_key)),
            ));
        }
        if store.guide_slot.get(&guide_id).is_some() {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "guide_has_active_order",
                    "message": "guide_has_active_order",
                })),
            ));
        }
    }
;
    let id = Uuid::new_v4();
    let now = Utc::now();
    let mut bundle = minimal_itinerary_bundle_for_simple_order(&OrderRow {
        id,
        tourist_id,
        guide_id,
        amount: amount.clone(),
        currency: "USDC".to_string(),
        escrow_address: None,
        state: OrderState::Created,
        created_at: now,
        accepted_at: None,
        escrowed_at: None,
        completed_at: None,
        dispute_deadline_at: None,
        auto_complete_at: None,
        updated_at: now,
        start_date: None,
        end_date: None,
        sub_status: None,
        tourist_confirmed: None,
        guide_confirmed: None,
        rating_tourist_confirmed: None,
        rating_guide_confirmed: None,
        service_tourist_confirmed: None,
        service_guide_confirmed: None,
        chain_id: state.config.business_chain_id,
        order_kind: Some(order_kind.to_string()),
        market_listing_id: Some(listing_id),
        data_origin: super::data_origin_production_string(),
        ..Default::default()
    });
    bundle.destination = listing_title_for_itinerary(&listing.payload);
    let tourist_email = {
        let store = state.store.read().await;
        store
            .users
            .get(&tourist_id)
            .map(|u| u.email.clone())
            .unwrap_or_default()
    };
    let data_origin = super::market_public_surface::infer_order_data_origin(&tourist_email, &bundle);
    let order = OrderRow {
        id,
        tourist_id,
        guide_id,
        amount: amount.clone(),
        currency: "USDC".to_string(),
        escrow_address: None,
        state: OrderState::Created,
        created_at: now,
        accepted_at: None,
        escrowed_at: None,
        completed_at: None,
        dispute_deadline_at: None,
        auto_complete_at: None,
        updated_at: now,
        start_date: None,
        end_date: None,
        sub_status: None,
        tourist_confirmed: None,
        guide_confirmed: None,
        rating_tourist_confirmed: None,
        rating_guide_confirmed: None,
        service_tourist_confirmed: None,
        service_guide_confirmed: None,
        chain_id: state.config.business_chain_id,
        order_kind: Some(order_kind.to_string()),
        market_listing_id: Some(listing_id),
        data_origin,
        ..Default::default()
    };
    let mut store = state.store.write().await;
    store.orders.insert(id, order.clone());
    store.itineraries.insert(id, bundle);
    drop(store);

    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order).await {
                eprintln!(
                    "[audit] strict market_listing_order_create: upsert_order failed order_id={} error={}",
                    order.id, e
                );
                let mut store = state.store.write().await;
                store.orders.remove(&id);
                store.itineraries.remove(&id);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order).await;
        }
    }

    Ok(Json(json!({
        "status": "ok",
        "order_kind": order_kind,
        "market_listing_id": listing_id.to_string(),
        "market_listing_variant": variant,
        "order": {
            "id": order.id.to_string(),
            "tourist_id": order.tourist_id.to_string(),
            "traveler_id": order.tourist_id.to_string(),
            "guide_id": order.guide_id.to_string(),
            "amount": order.amount,
            "currency": order.currency,
            "status": "created",
            "order_kind": order_kind,
            "market_listing_id": listing_id.to_string(),
            "created_at": order.created_at.to_rfc3339()
        }
    })))
}
