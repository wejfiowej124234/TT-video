use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off::{
    audit_key_write_stderr, order_state_to_str, persist_order_if_db, strict_order_db_write_enabled,
    try_persist_order_to_db, ChainOffState,
};
use crate::schedule_engine;
use traveltrust_core::OrderState;

pub async fn order_accept_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let guide_row_id = store.guides_by_user.get(&user_id).copied().ok_or((
        StatusCode::FORBIDDEN,
        Json(crate::api_json::err_key("not_guide")),
    ))?;
    let guide = store.guides.get(&guide_row_id).ok_or((
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;
    if let Some(err_key) = crate::chain_off::me::order_accept_trust_gate(&store, user_id, guide) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    let order_before = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();
    if !order_before.guide_id.is_nil() && order_before.guide_id != guide_row_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("not_guide")),
        ));
    }
    let order = store.orders.get_mut(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    if order.guide_id.is_nil() {
        order.guide_id = guide_row_id;
    }
    let now = Utc::now();
    if order.state == OrderState::Created {
        let deadline = order.created_at + chrono::Duration::seconds(state.config.accept_ttl_secs);
        if now > deadline {
            order.state = OrderState::Cancelled;
            order.updated_at = now;
            return Err((
                StatusCode::GONE,
                Json(json!({
                    "error": "accept_window_expired",
                    "message": "accept_window_expired",
                    "accept_ttl_secs": state.config.accept_ttl_secs,
                    "created_at": order.created_at.to_rfc3339(),
                })),
            ));
        }
    }
    if !order.state.can_transition_to(OrderState::Accepted) {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "current": order_state_to_str(order.state)}),
            ),
        ));
    }
    // 80 §4.15.11：档期重叠时拒绝接单
    if let (Some(s), Some(e)) = (order.start_date, order.end_date) {
        if let Ok(true) = schedule_engine::has_overlapping_lock(guide_row_id, s, e).await {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "schedule_conflict",
                    "message": "schedule_conflict",
                    "hint": "该向导在此档期已有锁定订单，无法接单"
                })),
            ));
        }
    }
    order.state = OrderState::Accepted;
    order.accepted_at = Some(now);
    order.updated_at = now;
    order.sub_status = Some("pending_bilateral".to_string());
    order.tourist_confirmed = Some(false);
    order.guide_confirmed = Some(false);
    let order_clone = order.clone();
    let (guide_id, order_id_val, accepted_at) = (
        order_clone.guide_id,
        order_clone.id,
        order_clone.accepted_at,
    );
    store.guide_slot.insert(guide_id, order_id_val);
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_accept: upsert_order failed order_id={} error={}",
                    order_id_val, e
                );
                let mut store = state.store.write().await;
                store.orders.insert(order_id_val, order_before);
                store.guide_slot.remove(&guide_id);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; accept reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    audit_key_write_stderr("order_accept", request_id, user_id, order_id_val);
    Ok(Json(json!({
        "status": "ok",
        "order": { "id": order_id_val.to_string(), "status": "accepted", "accepted_at": accepted_at.map(|t| t.to_rfc3339()) }
    })))
}

pub async fn order_cancel_impl(
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
    if !order_before.state.can_transition_to(OrderState::Cancelled) {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "current": order_state_to_str(order_before.state)}),
            ),
        ));
    }
    let to_remove = (order_before.state == OrderState::Accepted
        || order_before.state == OrderState::Escrowed)
        .then_some(order_before.guide_id);
    let slot_snapshot =
        to_remove.and_then(|g| store.guide_slot.get(&g).copied().map(|oid| (g, oid)));
    let order = store.orders.get_mut(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    order.state = OrderState::Cancelled;
    order.updated_at = Utc::now();
    let order_clone = order.clone();
    let order_id_val = order_clone.id;
    let guide_id_for_release = order_clone.guide_id;
    if let Some(g) = to_remove {
        store.guide_slot.remove(&g);
    }
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_cancel: upsert_order failed order_id={} error={}",
                    order_id_val, e
                );
                let mut store = state.store.write().await;
                store.orders.insert(order_id_val, order_before);
                if let Some((g, oid)) = slot_snapshot {
                    store.guide_slot.insert(g, oid);
                }
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; cancel reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    let _ = schedule_engine::release_slot(guide_id_for_release, order_id_val).await;
    audit_key_write_stderr("order_cancel", request_id, user_id, order_id_val);
    Ok(Json(
        json!({ "status": "ok", "order": { "id": order_id_val.to_string(), "status": "cancelled" } }),
    ))
}

pub async fn order_mock_pay_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let order_before_pay = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();
    if order_before_pay.tourist_id != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("not_tourist")),
        ));
    }
    if let Some(err_key) = crate::chain_off::me::tourist_order_trust_gate(&store, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    let now = Utc::now();
    if order_before_pay.state == OrderState::Accepted {
        let accepted_at = order_before_pay.accepted_at.unwrap_or(now);
        let deadline = accepted_at + chrono::Duration::seconds(state.config.payment_ttl_secs);
        if now > deadline {
            let gid = order_before_pay.guide_id;
            let slot_snap = store.guide_slot.get(&gid).copied();
            let order = store.orders.get_mut(&order_id).expect("order exists");
            order.state = OrderState::Cancelled;
            order.updated_at = now;
            let order_clone = order.clone();
            store.guide_slot.remove(&gid);
            drop(store);
            if state.db_pool.is_some() {
                if strict_order_db_write_enabled() {
                    if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                        eprintln!(
                            "[audit] strict order_mock_pay (expired): upsert_order failed order_id={} error={}",
                            order_id, e
                        );
                        let mut store = state.store.write().await;
                        store.orders.insert(order_id, order_before_pay);
                        if let Some(oid) = slot_snap {
                            store.guide_slot.insert(gid, oid);
                        }
                        return Err((
                            StatusCode::SERVICE_UNAVAILABLE,
                            Json(json!({
                                "error": "order_db_persist_failed",
                                "message": "order_db_persist_failed",
                                "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; payment-expired cancel reverted in memory",
                            })),
                        ));
                    }
                } else {
                    persist_order_if_db(&state, &order_clone).await;
                }
            }
            return Err((
                StatusCode::GONE,
                Json(json!({
                    "error": "payment_window_expired",
                    "message": "payment_window_expired",
                    "payment_ttl_secs": state.config.payment_ttl_secs,
                })),
            ));
        }
    }
    if !order_before_pay
        .state
        .can_transition_to(OrderState::Escrowed)
    {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "current": order_state_to_str(order_before_pay.state)}),
            ),
        ));
    }
    let order = store.orders.get_mut(&order_id).expect("order exists");
    order.state = OrderState::Escrowed;
    order.escrowed_at = Some(now);
    order.auto_complete_at = Some(now + chrono::Duration::days(state.config.auto_complete_days));
    order.dispute_deadline_at =
        Some(now + chrono::Duration::days(state.config.dispute_window_days));
    order.updated_at = now;
    let order_clone = order.clone();
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_mock_pay: upsert_order failed order_id={} error={}",
                    order_clone.id, e
                );
                let mut store = state.store.write().await;
                store.orders.insert(order_id, order_before_pay);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; escrow transition reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    if let (Some(s), Some(e)) = (order_clone.start_date, order_clone.end_date) {
        let _ = schedule_engine::lock_slot(order_clone.guide_id, order_clone.id, s, e).await;
    }
    Ok(Json(json!({
        "status": "ok",
        "order": { "id": order_clone.id.to_string(), "status": "escrowed", "escrowed_at": order_clone.escrowed_at.map(|t| t.to_rfc3339()) }
    })))
}

pub async fn order_confirm_completion_impl(
    state: ChainOffState,
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
    if !order_before.state.can_transition_to(OrderState::Completed) {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "invalid_state", "message": "invalid_state", "current": order_state_to_str(order_before.state)}),
            ),
        ));
    }
    let guide_id = order_before.guide_id;
    let slot_restore = store.guide_slot.get(&guide_id).copied();
    let order = store.orders.get_mut(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    let now = Utc::now();
    order.state = OrderState::Completed;
    order.completed_at = Some(now);
    order.updated_at = now;
    let order_clone = order.clone();
    let (order_id_val, completed_at) = (order_clone.id, order_clone.completed_at);
    store.guide_slot.remove(&guide_id);
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict order_confirm_completion: upsert_order failed order_id={} error={}",
                    order_id_val, e
                );
                let mut store = state.store.write().await;
                store.orders.insert(order_id_val, order_before);
                if let Some(oid) = slot_restore {
                    store.guide_slot.insert(guide_id, oid);
                }
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; completion reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    let _ = schedule_engine::release_slot(guide_id, order_id_val).await;
    Ok(Json(json!({
        "status": "ok",
        "order": { "id": order_id_val.to_string(), "status": "completed", "completed_at": completed_at.map(|t| t.to_rfc3339()) }
    })))
}
