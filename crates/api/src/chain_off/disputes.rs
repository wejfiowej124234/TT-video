//! chain_off 争议：ResolveDisputeBody、disputes_list、dispute_get、dispute_resolve、resolution_outbox（48 §5.6；**812～814** **`tourist_id`****/**`traveler_id`** **87** **镜像**）

use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value as JsonValue};
use std::hash::Hash;
use std::hash::Hasher;
use uuid::Uuid;

use super::{
    order_state_to_str, persist_order_if_db, try_persist_order_to_db, ChainOffState, DisputeRow,
    OrderRow,
};
use traveltrust_core::OrderState;

/// **87**：游客 UUID 双读（与 **`GET /api/v1/orders`** 同值）；缺省为 JSON **`null`**（供争议 / Admin 评价等共用）。
pub fn dispute_party_mirror_ids(tourist_id: Option<Uuid>) -> (JsonValue, JsonValue) {
    match tourist_id {
        Some(t) => {
            let s = t.to_string();
            (json!(s.clone()), json!(s))
        }
        None => (JsonValue::Null, JsonValue::Null),
    }
}

/// **87**：争议响应中游客 UUID 双读；缺关联 **`orders`** 行时为 JSON **`null`**。
pub fn dispute_party_mirror(order: Option<&OrderRow>) -> (JsonValue, JsonValue) {
    dispute_party_mirror_ids(order.map(|o| o.tourist_id))
}

async fn rollback_dispute_resolve_memory(
    state: &ChainOffState,
    dispute_id: Uuid,
    dispute_before: DisputeRow,
    order_before: OrderRow,
    order_id: Uuid,
    guide_id: Uuid,
    prev_guide_slot: Option<Uuid>,
) {
    let mut store = state.store.write().await;
    store.disputes.insert(dispute_id, dispute_before);
    store.orders.insert(order_id, order_before);
    store.disputes_by_order.insert(order_id, dispute_id);
    match prev_guide_slot {
        Some(oid) => {
            store.guide_slot.insert(guide_id, oid);
        }
        None => {
            store.guide_slot.remove(&guide_id);
        }
    }
}

#[derive(Deserialize)]
pub struct ResolveDisputeBody {
    pub refund_ratio: f64,
    pub slash_guide: bool,
}

pub async fn disputes_list_impl(state: ChainOffState) -> Json<serde_json::Value> {
    let store = state.store.read().await;
    let items: Vec<_> = store
        .disputes
        .values()
        .map(|d| {
            let order = store.orders.get(&d.order_id);
            let (tourist_id, traveler_id) = dispute_party_mirror(order);
            json!({
                "id": d.id.to_string(),
                "order_id": d.order_id.to_string(),
                "tourist_id": tourist_id,
                "traveler_id": traveler_id,
                "status": d.status,
                "resolved_at": d.resolved_at.map(|t| t.to_rfc3339()),
                "created_at": d.created_at.to_rfc3339()
            })
        })
        .collect();
    Json(json!({ "status": "ok", "items": items }))
}

/// 与 `GET /api/v1/disputes/:id` 成功响应同形；**不做** Admin 以外校验（70：`GET /api/v1/admin/disputes/:id`）。
pub fn dispute_detail_envelope(d: &DisputeRow, order: Option<&OrderRow>) -> JsonValue {
    let (tourist_id, traveler_id) = dispute_party_mirror(order);
    json!({
        "status": "ok",
        "dispute": {
            "id": d.id.to_string(),
            "order_id": d.order_id.to_string(),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id,
            "status": d.status,
            "evidence_hashes": d.evidence_hashes,
            "arbitrator_id": d.arbitrator_id.map(|u| u.to_string()),
            "arb_fee_paid": d.arb_fee_paid,
            "dispute_sequence": d.dispute_sequence,
            "refund_ratio": d.refund_ratio,
            "slash_guide": d.slash_guide,
            "resolved_at": d.resolved_at.map(|t| t.to_rfc3339()),
            "created_at": d.created_at.to_rfc3339(),
            "updated_at": d.updated_at.to_rfc3339()
        }
    })
}

pub async fn dispute_get_impl(
    state: ChainOffState,
    id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let d = store.disputes.get(&id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("dispute_not_found")),
    ))?;
    let order = store.orders.get(&d.order_id);
    Ok(Json(dispute_detail_envelope(d, order)))
}

pub async fn dispute_resolve_impl(
    state: ChainOffState,
    dispute_id: Uuid,
    arbitrator_id: Uuid,
    Json(body): Json<ResolveDisputeBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if body.refund_ratio < 0.0 || body.refund_ratio > 1.0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("refund_ratio_must_be_0_to_1")),
        ));
    }
    let strict_resolve =
        std::env::var("TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE").as_deref() == Ok("1");

    let mut store = state.store.write().await;
    let arb_role = store.users.get(&arbitrator_id).map(|u| u.role.as_str());
    if arb_role != Some("arbitrator") {
        return Err((
            StatusCode::FORBIDDEN,
            Json(
                json!({"error": "only_arbitrator_can_resolve", "message": "only_arbitrator_can_resolve", "role_required": "arbitrator"}),
            ),
        ));
    }

    let dispute_before = store.disputes.get(&dispute_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("dispute_not_found")),
    ))?;
    if dispute_before.status == "resolved" {
        return Err((
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("already_resolved")),
        ));
    }
    let dispute_before = dispute_before.clone();
    let order_id = dispute_before.order_id;
    let order_before = store.orders.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    let order_before = order_before.clone();
    let guide_id = order_before.guide_id;
    let prev_guide_slot = store.guide_slot.get(&guide_id).copied();

    let now = Utc::now();
    {
        let dispute = store.disputes.get_mut(&dispute_id).expect("dispute exists");
        dispute.status = "resolved".to_string();
        dispute.arbitrator_id = Some(arbitrator_id);
        dispute.refund_ratio = Some(body.refund_ratio);
        dispute.slash_guide = Some(body.slash_guide);
        dispute.resolved_at = Some(now);
        dispute.updated_at = now;
    }

    let new_state = if body.slash_guide {
        OrderState::Slashed
    } else if body.refund_ratio >= 1.0 {
        OrderState::Refunded
    } else if body.refund_ratio > 0.0 {
        OrderState::PartiallyRefunded
    } else {
        OrderState::Completed
    };

    {
        let order = store.orders.get_mut(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !order.state.can_transition_to(OrderState::Refunded)
            && !order.state.can_transition_to(OrderState::PartiallyRefunded)
            && !order.state.can_transition_to(OrderState::Slashed)
            && !order.state.can_transition_to(OrderState::Completed)
        {
            return Err((
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("invalid_order_state")),
            ));
        }
        order.state = new_state;
        order.completed_at = Some(now);
        order.updated_at = now;
    }

    store.guide_slot.remove(&guide_id);
    store.disputes_by_order.remove(&order_id);

    let dispute_resolved_at = store.disputes.get(&dispute_id).and_then(|d| d.resolved_at);
    let order_after = store
        .orders
        .get(&order_id)
        .expect("order exists after resolve")
        .clone();
    drop(store);

    if state.db_pool.is_some() {
        if strict_resolve {
            if let Err(e) = try_persist_order_to_db(&state, &order_after).await {
                eprintln!(
                    "[audit] strict dispute_resolve: upsert_order failed order_id={} error={}",
                    order_after.id, e
                );
                rollback_dispute_resolve_memory(
                    &state,
                    dispute_id,
                    dispute_before,
                    order_before,
                    order_id,
                    guide_id,
                    prev_guide_slot,
                )
                .await;
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "dispute_resolve_db_persist_failed",
                        "message": "dispute_resolve_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE=1: order upsert failed; memory reverted",
                    })),
                ));
            }
            if let Some(ref pool) = state.db_pool {
                if let Err(e) = crate::db::update_dispute_resolved(
                    pool,
                    dispute_id,
                    "resolved",
                    arbitrator_id,
                    body.refund_ratio,
                    body.slash_guide,
                    dispute_resolved_at.unwrap_or(now),
                    now,
                )
                .await
                {
                    eprintln!(
                        "[audit] strict dispute_resolve: update_dispute_resolved failed dispute_id={} error={}",
                        dispute_id, e
                    );
                    if let Err(e2) = try_persist_order_to_db(&state, &order_before).await {
                        eprintln!(
                            "[audit] strict dispute_resolve: revert order upsert failed order_id={} error={}",
                            order_before.id, e2
                        );
                    }
                    rollback_dispute_resolve_memory(
                        &state,
                        dispute_id,
                        dispute_before,
                        order_before,
                        order_id,
                        guide_id,
                        prev_guide_slot,
                    )
                    .await;
                    return Err((
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(json!({
                            "error": "dispute_resolve_db_persist_failed",
                            "message": "dispute_resolve_db_persist_failed",
                            "rule": "TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE=1: update_dispute_resolved failed; order row revert attempted; memory reverted",
                        })),
                    ));
                }
            }
        } else {
            persist_order_if_db(&state, &order_after).await;
            if let Some(ref pool) = state.db_pool {
                if let Err(e) = crate::db::update_dispute_resolved(
                    pool,
                    dispute_id,
                    "resolved",
                    arbitrator_id,
                    body.refund_ratio,
                    body.slash_guide,
                    dispute_resolved_at.unwrap_or(now),
                    now,
                )
                .await
                {
                    eprintln!(
                        "[audit] dispute_resolve: update_dispute_resolved failed dispute_id={} order_id={} error={} (non-strict mode: memory/order row may diverge from disputes table)",
                        dispute_id, order_id, e
                    );
                }
            }
        }
    }

    let (tourist_id, traveler_id) = dispute_party_mirror(Some(&order_after));
    Ok(Json(json!({
        "status": "ok",
        "dispute": {
            "id": dispute_id.to_string(),
            "status": "resolved",
            "resolved_at": dispute_resolved_at.map(|t| t.to_rfc3339())
        },
        "order": {
            "id": order_id.to_string(),
            "status": order_state_to_str(order_after.state),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id
        }
    })))
}

/// P5-4：裁决成功后，若链上模式需代发 executeResolution，用此数据构建 outbox 条目。
pub async fn resolution_outbox_entry_for_dispute(
    state: &ChainOffState,
    dispute_id: Uuid,
    refund_ratio: f64,
    slash_guide: bool,
) -> Option<crate::chain::outbox::ResolutionOutboxEntry> {
    let store = state.store.read().await;
    let dispute = store.disputes.get(&dispute_id)?;
    let order = store.orders.get(&dispute.order_id)?;
    let escrow_address = order.escrow_address.as_ref()?.clone();
    let total = parse_amount_to_u128(&order.amount).unwrap_or(0);
    if total == 0 {
        return None;
    }
    const PLATFORM_FEE_BPS: u128 = 250;
    let platform_fee = total * PLATFORM_FEE_BPS / 10000;
    let rest = total - platform_fee;
    let traveler_refund = ((rest as f64) * refund_ratio).round() as u128;
    let traveler_refund = std::cmp::min(traveler_refund, rest);
    let guide_amount = if slash_guide {
        0u128
    } else {
        rest - traveler_refund
    };
    let resolution_id = dispute_id.as_bytes()[..].try_into().ok()?;
    let mut decision_hash = [0u8; 32];
    let h = format!("{:.6}:{}", refund_ratio, slash_guide);
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    h.hash(&mut hasher);
    decision_hash[..8].copy_from_slice(&hasher.finish().to_le_bytes());
    Some(crate::chain::outbox::ResolutionOutboxEntry {
        order_id: order.id.to_string(),
        escrow_address,
        resolution_id,
        decision_hash,
        guide_amount,
        traveler_refund,
        platform_fee,
    })
}

fn parse_amount_to_u128(s: &str) -> Option<u128> {
    let s = s.trim();
    let f: f64 = s.parse().ok()?;
    if f < 0.0 || f.is_nan() || f.is_infinite() {
        return None;
    }
    const SCALE: f64 = 1_000_000_000_000_000_000.0;
    let scaled = f * SCALE;
    if scaled >= (u128::MAX as f64) {
        return None;
    }
    Some(scaled as u128)
}
