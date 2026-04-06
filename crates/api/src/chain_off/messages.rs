//! chain_off 聊天：MessageRow、PostMessageBody、messages_list、message_post（48 §5.8；**818** **`GET|POST …/orders/:id/messages`** **根级** **`tourist_id`****/**`traveler_id`** **87** **镜像**）

use std::collections::HashMap;

use axum::{http::StatusCode, Json};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use super::disputes::dispute_party_mirror;
use super::{ChainOffState, UserRow};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MessageRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct PostMessageBody {
    pub content: String,
}

/// GET 列表项与 POST `message` 共用；与前端 `getOrderMessages` / `ChatBlock` 可选字段一致（53-S7）
fn order_message_json(m: &MessageRow, users: &HashMap<Uuid, UserRow>) -> serde_json::Value {
    let mut row = serde_json::Map::new();
    row.insert("id".into(), json!(m.id.to_string()));
    row.insert("order_id".into(), json!(m.order_id.to_string()));
    row.insert("sender_id".into(), json!(m.sender_id.to_string()));
    row.insert("content".into(), json!(m.content));
    row.insert("created_at".into(), json!(m.created_at.to_rfc3339()));
    if let Some(u) = users.get(&m.sender_id) {
        if let Some(ref n) = u.nickname {
            let t = n.trim();
            if !t.is_empty() {
                row.insert("sender_name".into(), json!(t));
            }
        }
        if let Some(ref a) = u.avatar_url {
            let t = a.trim();
            if !t.is_empty() {
                row.insert("sender_avatar_url".into(), json!(t));
            }
        }
    }
    serde_json::Value::Object(row)
}

pub async fn messages_list_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    if !crate::chain_off::order_is_participant(&store, order, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    let (tourist_id, traveler_id) = dispute_party_mirror(Some(order));
    let list = store.messages.get(&order_id).cloned().unwrap_or_default();
    let items: Vec<serde_json::Value> = list
        .iter()
        .map(|m| order_message_json(m, &store.users))
        .collect();
    Ok(Json(json!({
        "status": "ok",
        "items": items,
        "tourist_id": tourist_id,
        "traveler_id": traveler_id,
    })))
}

pub async fn message_post_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<PostMessageBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let content = body.content.trim().to_string();
    if content.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("content_required")),
        ));
    }

    let msg = {
        let store = state.store.read().await;
        let order = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, order, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            ));
        }
        if let Some(err_key) =
            crate::chain_off::me::order_participant_trust_gate(&store, user_id, order)
        {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key(err_key)),
            ));
        }
        let now = Utc::now();
        MessageRow {
            id: Uuid::new_v4(),
            order_id,
            sender_id: user_id,
            content,
            created_at: now,
        }
    };

    let strict_db = std::env::var("TRAVELTRUST_STRICT_MESSAGE_DB_WRITE").as_deref() == Ok("1");
    if let Some(ref pool) = state.db_pool {
        match crate::db::insert_order_message(
            pool,
            msg.id,
            msg.order_id,
            msg.sender_id,
            &msg.content,
            msg.created_at,
        )
        .await
        {
            Ok(()) => {}
            Err(e) => {
                eprintln!("WARN: order_messages double-write failed: {}", e);
                if strict_db {
                    return Err((
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(json!({
                            "error": "message_db_persist_failed",
                            "message": "message_db_persist_failed",
                            "rule": "TRAVELTRUST_STRICT_MESSAGE_DB_WRITE=1 requires successful DB insert; retry with same Idempotency-Key if applicable (ops/RUNBOOK §9)",
                        })),
                    ));
                }
            }
        }
    }

    {
        let mut store = state.store.write().await;
        let order = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, order, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            ));
        }
        store
            .messages
            .entry(order_id)
            .or_default()
            .push(msg.clone());
    }

    let (message_payload, tourist_id, traveler_id) = {
        let store = state.store.read().await;
        let order = store.orders.get(&order_id);
        let (tourist_id, traveler_id) = dispute_party_mirror(order);
        (
            order_message_json(&msg, &store.users),
            tourist_id,
            traveler_id,
        )
    };

    Ok(Json(json!({
        "status": "ok",
        "message": message_payload,
        "tourist_id": tourist_id,
        "traveler_id": traveler_id,
    })))
}
