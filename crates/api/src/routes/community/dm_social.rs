use std::collections::{HashMap, HashSet};

use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::common::{
    display_nickname_for_user, enforce_no_active_write_penalty, json_profiles_to_author_map,
    placeholder_ok, user_ids_to_json_profiles, AuthorEnrich, LIST_LIMIT,
};

// GET /api/v1/community/conversations
pub(super) async fn get_conversations(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(rows) = db::list_conversations_enriched_for_user(pool, uid, LIST_LIMIT).await {
            let mut seen_peers = HashSet::new();
            let mut peer_ids: Vec<Uuid> = Vec::new();
            for r in &rows {
                let peer = if r.user1_id == uid {
                    r.user2_id
                } else {
                    r.user1_id
                };
                if seen_peers.insert(peer) {
                    peer_ids.push(peer);
                }
            }
            let peer_profiles: HashMap<Uuid, AuthorEnrich> =
                match user_ids_to_json_profiles(pool, peer_ids).await {
                    Ok(profiles) => json_profiles_to_author_map(profiles),
                    Err(_) => HashMap::new(),
                };
            let list: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    let peer_id = if r.user1_id == uid {
                        r.user2_id
                    } else {
                        r.user1_id
                    };
                    let short8 = peer_id.to_string().chars().take(8).collect::<String>();
                    let (
                        peer_nickname,
                        peer_avatar_url,
                        peer_role,
                        peer_is_escrow_guide,
                        peer_wallet,
                    ) = peer_profiles
                        .get(&peer_id)
                        .map(|(n, a, role, esc, w)| {
                            let nn = if n.trim().is_empty() {
                                short8.clone()
                            } else {
                                n.clone()
                            };
                            (nn, a.clone(), role.clone(), *esc, w.clone())
                        })
                        .unwrap_or((short8, None, "tourist".to_string(), false, None));
                    json!({
                        "id": r.id.to_string(),
                        "user1_id": r.user1_id.to_string(),
                        "user2_id": r.user2_id.to_string(),
                        "created_at": r.created_at.to_rfc3339(),
                        "last_message": r.last_message_body.unwrap_or_default(),
                        "last_message_at": r.last_message_at.map(|t| t.to_rfc3339()),
                        "last_sender_id": r.last_sender_id.map(|u| u.to_string()),
                        "unread_count": r.unread_count,
                        "peer_id": peer_id.to_string(),
                        "peer_nickname": peer_nickname,
                        "peer_avatar_url": peer_avatar_url,
                        "peer_role": peer_role,
                        "peer_is_escrow_guide": peer_is_escrow_guide,
                        "peer_default_wallet": peer_wallet,
                    })
                })
                .collect();
            return Json(json!({ "status": "ok", "conversations": list })).into_response();
        }
    }
    placeholder_ok("conversations", json!([]))
}

/// POST /api/v1/community/conversations/ensure — 与对端用户幂等创建会话（须鉴权）。
pub(super) async fn post_ensure_conversation(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let peer_str = j
        .get("peer_user_id")
        .or_else(|| j.get("user_id"))
        .and_then(|v| v.as_str());
    let Some(peer_str) = peer_str else {
        return Json(json!({
            "status": "error",
            "error": "peer_user_id_required",
            "message": "peer_user_id_required",
            "errors": { "peer_user_id": "peer_user_id_required" }
        }))
        .into_response();
    };
    let Ok(peer_id) = Uuid::parse_str(peer_str) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_peer_user_id",
            "message": "invalid_peer_user_id",
            "errors": { "peer_user_id": "invalid_peer_user_id" }
        }))
        .into_response();
    };
    if peer_id == uid {
        return Json(json!({
            "status": "error",
            "error": "cannot_message_self",
            "message": "cannot_message_self",
            "errors": { "peer_user_id": "cannot_message_self" }
        }))
        .into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "peer_user_id").await {
        return resp;
    }
    match db::ensure_conversation(pool, uid, peer_id).await {
        Ok(conv_id) => Json(json!({ "status": "ok", "id": conv_id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "conversation_ensure_failed",
            "message": "conversation_ensure_failed",
            "errors": { "peer_user_id": "conversation_ensure_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn get_conversation_messages(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = extract_user_with_session_check(&state, &headers).await;
    if let Some(pool) = pool {
        if let Ok(conv_id) = Uuid::parse_str(&id) {
            if let Ok(rows) = db::list_dm_messages(pool, conv_id, LIST_LIMIT).await {
                if let Some(u) = uid {
                    if let Ok(Some(conv)) = db::get_conversation_by_id(pool, conv_id).await {
                        if conv.user1_id == u || conv.user2_id == u {
                            let _ = db::upsert_dm_read_state_now(pool, u, conv_id).await;
                        }
                    }
                }
                let list: Vec<_> = rows
                    .into_iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "conversation_id": r.conversation_id.to_string(),
                            "sender_id": r.sender_id.to_string(),
                            "body": r.body,
                            "created_at": r.created_at.to_rfc3339(),
                        })
                    })
                    .collect();
                return Json(json!({ "status": "ok", "messages": list })).into_response();
            }
        }
    }
    placeholder_ok("messages", json!([]))
}

pub(super) async fn post_conversation_message(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let msg_raw = j.get("body").and_then(|v| v.as_str()).unwrap_or("");
    let msg_body = msg_raw.trim();
    let sender_id = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "ok", "id": null, "note": "50-O-31 占位"})).into_response();
    };
    if msg_body.is_empty() {
        return Json(json!({
            "status": "error",
            "error": "empty_body",
            "message": "empty_body",
            "errors": { "body": "empty_body" }
        }))
        .into_response();
    }
    let Ok(conv_id) = Uuid::parse_str(&id) else {
        return Json(json!({"status": "error", "error": "invalid_conversation", "message": "invalid_conversation"})).into_response();
    };
    let Ok(Some(conv)) = db::get_conversation_by_id(pool, conv_id).await else {
        return Json(json!({"status": "error", "error": "not_found", "message": "not_found"}))
            .into_response();
    };
    let in_conv = conv.user1_id == sender_id || conv.user2_id == sender_id;
    if !in_conv {
        return Json(json!({"status": "error", "error": "forbidden", "message": "forbidden"}))
            .into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, sender_id, "body").await {
        return resp;
    }
    match db::insert_dm_message(pool, conv_id, sender_id, msg_body).await {
        Ok(msg_id) => Json(json!({ "status": "ok", "id": msg_id.to_string() })).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "send_failed",
            "message": "send_failed",
            "errors": { "body": "send_failed" }
        }))
        .into_response(),
    }
}

// POST/DELETE /api/v1/community/users/:id/follow
pub(super) async fn post_follow(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let follower_id = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(following_id) = Uuid::parse_str(&id) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_user_id",
            "message": "invalid_user_id",
            "errors": { "user_id": "invalid_user_id" }
        }))
        .into_response();
    };
    if follower_id == following_id {
        return Json(json!({
            "status": "error",
            "error": "cannot_follow_self",
            "message": "cannot_follow_self",
            "errors": { "user_id": "cannot_follow_self" }
        }))
        .into_response();
    }
    if let Err(resp) = enforce_no_active_write_penalty(pool, follower_id, "user_id").await {
        return resp;
    }
    match db::insert_follow(pool, follower_id, following_id).await {
        Ok(()) => Json(json!({"status": "ok"})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "follow_create_failed",
            "message": "follow_create_failed",
            "errors": { "user_id": "follow_create_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn delete_follow(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(follower_id)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(following_id) = Uuid::parse_str(&id) {
            let _ = db::delete_follow(pool, follower_id, following_id).await;
        }
    }
    Json(json!({"status": "ok"})).into_response()
}

pub(super) async fn get_me_following(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(ids) = db::list_following(pool, uid, LIST_LIMIT).await {
            let list = match user_ids_to_json_profiles(pool, ids).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("following", json!([])),
            };
            return Json(json!({ "status": "ok", "following": list })).into_response();
        }
    }
    placeholder_ok("following", json!([]))
}

pub(super) async fn get_me_followers(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(ids) = db::list_followers(pool, uid, LIST_LIMIT).await {
            let list = match user_ids_to_json_profiles(pool, ids).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("followers", json!([])),
            };
            return Json(json!({ "status": "ok", "followers": list })).into_response();
        }
    }
    placeholder_ok("followers", json!([]))
}

pub(super) async fn post_friends_request(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let to_str = j
        .get("to_user_id")
        .or_else(|| j.get("user_id"))
        .and_then(|v| v.as_str());
    let Some(to_str) = to_str else {
        return Json(json!({
            "status": "error",
            "error": "to_user_id_required",
            "message": "to_user_id_required",
            "errors": { "to_user_id": "to_user_id_required" }
        }))
        .into_response();
    };
    let Ok(to_id) = Uuid::parse_str(to_str) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_to_user_id",
            "message": "invalid_to_user_id",
            "errors": { "to_user_id": "invalid_to_user_id" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "to_user_id").await {
        return resp;
    }
    match db::insert_friend_request(pool, uid, to_id).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => Json(json!({"status": "ok", "note": "duplicate or self"})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "friend_request_create_failed",
            "message": "friend_request_create_failed",
            "errors": { "to_user_id": "friend_request_create_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn post_friends_accept(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let rid = j.get("request_id").and_then(|v| v.as_str());
    let Some(rid) = rid else {
        return Json(json!({
            "status": "error",
            "error": "request_id_required",
            "message": "request_id_required",
            "errors": { "request_id": "request_id_required" }
        }))
        .into_response();
    };
    let Ok(req_id) = Uuid::parse_str(rid) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_request_id",
            "message": "invalid_request_id",
            "errors": { "request_id": "invalid_request_id" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "request_id").await {
        return resp;
    }
    match db::accept_friend_request(pool, req_id, uid).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => Json(json!({
            "status": "error",
            "error": "friend_request_not_found_or_forbidden",
            "message": "friend_request_not_found_or_forbidden",
            "errors": { "request_id": "friend_request_not_found_or_forbidden" }
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "friend_request_accept_failed",
            "message": "friend_request_accept_failed",
            "errors": { "request_id": "friend_request_accept_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn post_friends_reject(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let rid = j.get("request_id").and_then(|v| v.as_str());
    let Some(rid) = rid else {
        return Json(json!({
            "status": "error",
            "error": "request_id_required",
            "message": "request_id_required",
            "errors": { "request_id": "request_id_required" }
        }))
        .into_response();
    };
    let Ok(req_id) = Uuid::parse_str(rid) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_request_id",
            "message": "invalid_request_id",
            "errors": { "request_id": "invalid_request_id" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "request_id").await {
        return resp;
    }
    match db::reject_friend_request(pool, req_id, uid).await {
        Ok(true) => Json(json!({"status": "ok"})).into_response(),
        Ok(false) => Json(json!({
            "status": "error",
            "error": "friend_request_not_found_or_forbidden",
            "message": "friend_request_not_found_or_forbidden",
            "errors": { "request_id": "friend_request_not_found_or_forbidden" }
        }))
        .into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "friend_request_reject_failed",
            "message": "friend_request_reject_failed",
            "errors": { "request_id": "friend_request_reject_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn get_friends_list(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(ids) = db::list_friend_ids(pool, uid, LIST_LIMIT).await {
            let list = match user_ids_to_json_profiles(pool, ids).await {
                Ok(l) => l,
                Err(_) => return placeholder_ok("friends", json!([])),
            };
            return Json(json!({ "status": "ok", "friends": list })).into_response();
        }
    }
    placeholder_ok("friends", json!([]))
}

pub(super) async fn get_friends_requests(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(rows) = db::list_friend_requests_to_user(pool, uid, "pending", LIST_LIMIT).await {
            let mut uids: Vec<Uuid> = rows.iter().map(|r| r.from_user_id).collect();
            uids.sort_unstable();
            uids.dedup();
            let hm: HashMap<Uuid, (Option<String>, Option<String>, String, bool, Option<String>)> =
                match db::users_public_by_ids(pool, &uids).await {
                    Ok(p) => p
                        .into_iter()
                        .map(|(id, n, a, role, esc, w)| (id, (n, a, role, esc, w)))
                        .collect(),
                    Err(_) => HashMap::new(),
                };
            let list: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    let (nick, av, from_role, from_is_escrow_guide, from_wallet) = hm
                        .get(&r.from_user_id)
                        .cloned()
                        .unwrap_or((None, None, "tourist".to_string(), false, None));
                    let from_nickname = display_nickname_for_user(r.from_user_id, nick.as_deref());
                    json!({
                        "id": r.id.to_string(),
                        "from_user_id": r.from_user_id.to_string(),
                        "to_user_id": r.to_user_id.to_string(),
                        "status": r.status,
                        "created_at": r.created_at.to_rfc3339(),
                        "from_nickname": from_nickname,
                        "from_avatar_url": av,
                        "from_role": from_role,
                        "from_is_escrow_guide": from_is_escrow_guide,
                        "from_default_wallet": from_wallet,
                    })
                })
                .collect();
            return Json(json!({ "status": "ok", "requests": list })).into_response();
        }
    }
    placeholder_ok("requests", json!([]))
}

pub(super) async fn get_friends_requests_sent(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(rows) = db::list_friend_requests_from_user(pool, uid, "pending", LIST_LIMIT).await
        {
            let mut uids: Vec<Uuid> = rows.iter().map(|r| r.to_user_id).collect();
            uids.sort_unstable();
            uids.dedup();
            let hm: HashMap<Uuid, (Option<String>, Option<String>, String, bool, Option<String>)> =
                match db::users_public_by_ids(pool, &uids).await {
                    Ok(p) => p
                        .into_iter()
                        .map(|(id, n, a, role, esc, w)| (id, (n, a, role, esc, w)))
                        .collect(),
                    Err(_) => HashMap::new(),
                };
            let list: Vec<_> = rows
                .into_iter()
                .map(|r| {
                    let (nick, av, to_role, to_is_escrow_guide, to_wallet) = hm
                        .get(&r.to_user_id)
                        .cloned()
                        .unwrap_or((None, None, "tourist".to_string(), false, None));
                    let to_nickname = display_nickname_for_user(r.to_user_id, nick.as_deref());
                    json!({
                        "id": r.id.to_string(),
                        "from_user_id": r.from_user_id.to_string(),
                        "to_user_id": r.to_user_id.to_string(),
                        "status": r.status,
                        "created_at": r.created_at.to_rfc3339(),
                        "to_nickname": to_nickname,
                        "to_avatar_url": av,
                        "to_role": to_role,
                        "to_is_escrow_guide": to_is_escrow_guide,
                        "to_default_wallet": to_wallet,
                    })
                })
                .collect();
            return Json(json!({ "status": "ok", "requests": list })).into_response();
        }
    }
    placeholder_ok("requests", json!([]))
}

pub(super) async fn get_me_likes_received(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(n) = db::count_likes_received_for_user(pool, uid).await {
            return Json(json!({ "status": "ok", "likes_received": n })).into_response();
        }
    }
    Json(json!({ "status": "ok", "likes_received": 0 })).into_response()
}

/// GET /api/v1/community/me/activity — 获赞汇总 + 近期互动事件（赞/评/关注）。
pub(super) async fn get_me_activity(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response();
        }
    };
    let Some(pool) = pool else {
        return Json(json!({
            "status": "ok",
            "likes_received": 0,
            "items": [],
            "activity_scope": "likes-summary-v1",
            "note": "50-O-31 占位"
        }))
        .into_response();
    };
    let likes_received = db::count_likes_received_for_user(pool, uid)
        .await
        .unwrap_or(0);
    let rows = db::list_me_activity_events(pool, uid, 20).await.unwrap_or_default();
    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "kind": r.kind,
                "actor_user_id": r.actor_user_id.to_string(),
                "actor_nickname": r.actor_nickname,
                "post_id": r.post_id.map(|id| id.to_string()),
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    Json(json!({
        "status": "ok",
        "likes_received": likes_received,
        "items": items,
        "activity_scope": "activity-events-v1",
        "rank_basis": "activity_union_v1",
        "notification_inbox": "partial_v1"
    }))
    .into_response()
}

/// GET /api/v1/community/me/notifications — 与 **`…/me/activity`** 同源（31 §5 · 互动收件箱 v1）。
pub(super) async fn get_me_notifications(
    state: State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    get_me_activity(state, headers).await
}

// POST/DELETE /api/v1/community/posts/:id/collect
pub(super) async fn post_collect(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return Json(
                json!({"status": "error", "error": "unauthorized", "message": "unauthorized"}),
            )
            .into_response()
        }
    };
    let Some(pool) = pool else {
        return Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})).into_response();
    };
    let Ok(post_id) = Uuid::parse_str(&id) else {
        return Json(json!({
            "status": "error",
            "error": "invalid_post",
            "message": "invalid_post",
            "errors": { "post_id": "invalid_post" }
        }))
        .into_response();
    };
    if let Err(resp) = enforce_no_active_write_penalty(pool, uid, "post_id").await {
        return resp;
    }
    match db::insert_collect(pool, uid, post_id).await {
        Ok(created) => Json(json!({"status": "ok", "created": created})).into_response(),
        Err(_) => Json(json!({
            "status": "error",
            "error": "collect_create_failed",
            "message": "collect_create_failed",
            "errors": { "post_id": "collect_create_failed" }
        }))
        .into_response(),
    }
}

pub(super) async fn delete_collect(
    Path(id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(post_id) = Uuid::parse_str(&id) {
            let _ = db::delete_collect(pool, uid, post_id).await;
        }
    }
    Json(json!({"status": "ok"})).into_response()
}

pub(super) async fn get_me_likes(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(post_ids) = db::list_likes_post_ids(pool, uid, LIST_LIMIT).await {
            let list: Vec<_> = post_ids
                .into_iter()
                .map(|id| json!({ "post_id": id.to_string() }))
                .collect();
            return Json(json!({ "status": "ok", "likes": list })).into_response();
        }
    }
    placeholder_ok("likes", json!([]))
}

pub(super) async fn get_me_collects(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let (Some(pool), Some(uid)) = (
        pool,
        extract_user_with_session_check(&state, &headers).await,
    ) {
        if let Ok(post_ids) = db::list_collects_post_ids(pool, uid, LIST_LIMIT).await {
            let list: Vec<_> = post_ids
                .into_iter()
                .map(|id| json!({ "post_id": id.to_string() }))
                .collect();
            return Json(json!({ "status": "ok", "collects": list })).into_response();
        }
    }
    placeholder_ok("collects", json!([]))
}

