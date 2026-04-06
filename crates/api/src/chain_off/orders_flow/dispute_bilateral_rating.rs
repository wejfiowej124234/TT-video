use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde_json::{json, Value as JsonValue};
use uuid::Uuid;

use crate::chain_off::disputes::dispute_party_mirror;
use crate::chain_off::{
    audit_key_write_stderr, order_state_to_str, persist_order_if_db, strict_order_db_write_enabled,
    try_persist_order_to_db, ChainOffState, DisputeRow, OpenDisputeBody,
};
use traveltrust_core::escrow::DefaultEscrow;
use traveltrust_core::{EscrowState, OrderState};

pub async fn order_open_dispute_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<OpenDisputeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    if store.disputes_by_order.contains_key(&order_id) {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("dispute_already_open")),
        ));
    }
    let order_ref = store.orders.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    if !crate::chain_off::order_is_participant(&store, order_ref, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if let Some(err_key) =
        crate::chain_off::me::order_participant_trust_gate(&store, user_id, order_ref)
    {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    if !DefaultEscrow::can_dispute(order_ref.state) {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "current": order_state_to_str(order_ref.state)}),
            ),
        ));
    }
    // P47/49 B：第 n 次开争议，arbFee_n = baseFee×2^(n-1)（03 §3.2）；公式单源见 core::required_arbitration_fee
    let dispute_sequence = store
        .disputes
        .values()
        .filter(|d| d.order_id == order_id)
        .count() as u32
        + 1;
    if state.config.arb_base_fee > 0.0 {
        let required =
            traveltrust_core::required_arbitration_fee(state.config.arb_base_fee, dispute_sequence);
        let paid: f64 = body
            .arb_fee_paid
            .as_deref()
            .and_then(|s| s.trim().parse().ok())
            .unwrap_or(0.0);
        if paid < required {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "insufficient_arb_fee",
                    "message": "insufficient_arb_fee",
                    "required": required,
                    "arb_base_fee": state.config.arb_base_fee,
                    "dispute_sequence": dispute_sequence,
                })),
            ));
        }
    }
    let order = store.orders.get_mut(&order_id).expect("order exists");
    let prev_state = order.state;
    let prev_updated_at = order.updated_at;
    order.state = OrderState::Disputed;
    order.updated_at = Utc::now();
    let order_clone = order.clone();
    let id = Uuid::new_v4();
    let now = Utc::now();
    let dispute = DisputeRow {
        id,
        order_id,
        status: "open".to_string(),
        evidence_hashes: vec![],
        arbitrator_id: None,
        refund_ratio: None,
        slash_guide: None,
        resolved_at: None,
        created_at: now,
        updated_at: now,
        arb_fee_paid: body.arb_fee_paid.clone(),
        dispute_sequence,
    };
    store.disputes.insert(id, dispute.clone());
    store.disputes_by_order.insert(order_id, id);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_open_dispute: upsert_order failed order_id={} error={}",
                    order_id, e
                );
                store.disputes.remove(&id);
                store.disputes_by_order.remove(&order_id);
                let order_mut = store.orders.get_mut(&order_id).expect("order exists");
                order_mut.state = prev_state;
                order_mut.updated_at = prev_updated_at;
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; open dispute reverted (order disputed state not persisted)",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    let strict_dispute_db =
        std::env::var("TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE").as_deref() == Ok("1");
    if let Some(ref pool) = state.db_pool {
        let ev_hashes = serde_json::to_value(&dispute.evidence_hashes)
            .unwrap_or_else(|_| JsonValue::Array(vec![]));
        if let Err(e) = crate::db::insert_dispute(
            pool,
            dispute.id,
            dispute.order_id,
            &dispute.status,
            &ev_hashes,
            dispute.arbitrator_id,
            dispute.refund_ratio,
            dispute.slash_guide,
            dispute.resolved_at,
            dispute.created_at,
            dispute.updated_at,
            dispute.arb_fee_paid.as_deref(),
            dispute.dispute_sequence as i32,
        )
        .await
        {
            eprintln!(
                "[audit] db insert_dispute failed dispute_id={} error={}",
                dispute.id, e
            );
            if strict_dispute_db {
                store.disputes.remove(&id);
                store.disputes_by_order.remove(&order_id);
                let order_mut = store.orders.get_mut(&order_id).expect("order exists");
                order_mut.state = prev_state;
                order_mut.updated_at = prev_updated_at;
                let reverted = order_mut.clone();
                persist_order_if_db(&state, &reverted).await;
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "dispute_open_db_persist_failed",
                        "message": "dispute_open_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE=1 requires disputes row insert after order persist; memory and order row reverted; retry with same Idempotency-Key if applicable (ops/RUNBOOK §9)",
                    })),
                ));
            }
        }
    }
    let (tourist_id, traveler_id) = dispute_party_mirror(Some(&order_clone));
    Ok(Json(json!({
        "status": "ok",
        "dispute": {
            "id": dispute.id.to_string(),
            "order_id": dispute.order_id.to_string(),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id,
            "status": dispute.status
        }
    })))
}

/// 53-S6：双边确认 — 游客或向导各自确认行程与金额；双方均确认后 sub_status = confirmed
pub async fn order_confirm_bilateral_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let order_before = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();
    if !crate::chain_off::order_is_participant(&store, &order_before, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if let Some(err_key) =
        crate::chain_off::me::order_participant_trust_gate(&store, user_id, &order_before)
    {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    let guide_user_id = crate::chain_off::order_guide_user_id(&store, &order_before);
    let order = store.orders.get_mut(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    if order.state != OrderState::Accepted {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "hint": "仅 Accepted 订单可进行双边确认", "current": order_state_to_str(order.state)}),
            ),
        ));
    }
    let now = Utc::now();
    if order.tourist_id == user_id {
        order.tourist_confirmed = Some(true);
    }
    if guide_user_id == Some(user_id) {
        order.guide_confirmed = Some(true);
    }
    let both = order.tourist_confirmed == Some(true) && order.guide_confirmed == Some(true);
    if both {
        order.sub_status = Some("confirmed".to_string());
    }
    order.updated_at = now;
    let order_clone = order.clone();
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_confirm_bilateral: upsert_order failed order_id={} error={}",
                    order_id, e
                );
                let mut store = state.store.write().await;
                store.orders.insert(order_id, order_before);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; bilateral confirm reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    audit_key_write_stderr("order_confirm_bilateral", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order": {
            "id": order_id.to_string(),
            "tourist_confirmed": order_clone.tourist_confirmed,
            "guide_confirmed": order_clone.guide_confirmed,
            "sub_status": order_clone.sub_status
        }
    })))
}

/// 53-S8：评分双方确认 — 游客或向导确认评分与材料；双方均确认后 sub_status = rating_confirmed
pub async fn order_confirm_rating_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let order_before = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();
    if !crate::chain_off::order_is_participant(&store, &order_before, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if let Some(err_key) =
        crate::chain_off::me::order_participant_trust_gate(&store, user_id, &order_before)
    {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    let guide_user_id = crate::chain_off::order_guide_user_id(&store, &order_before);
    let order = store.orders.get_mut(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    if order.state != OrderState::Completed {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "hint": "仅 Completed 订单可确认评分", "current": order_state_to_str(order.state)}),
            ),
        ));
    }
    let now = Utc::now();
    if order.tourist_id == user_id {
        order.rating_tourist_confirmed = Some(true);
    }
    if guide_user_id == Some(user_id) {
        order.rating_guide_confirmed = Some(true);
    }
    let both =
        order.rating_tourist_confirmed == Some(true) && order.rating_guide_confirmed == Some(true);
    if both {
        order.sub_status = Some("rating_confirmed".to_string());
    }
    order.updated_at = now;
    let order_clone = order.clone();
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_confirm_rating: upsert_order failed order_id={} error={}",
                    order_id, e
                );
                let mut store = state.store.write().await;
                store.orders.insert(order_id, order_before);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; rating confirm reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    audit_key_write_stderr("order_confirm_rating", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order": {
            "id": order_id.to_string(),
            "rating_tourist_confirmed": order_clone.rating_tourist_confirmed,
            "rating_guide_confirmed": order_clone.rating_guide_confirmed,
            "sub_status": order_clone.sub_status
        }
    })))
}
