//! `GET …/rewards`、`fee-routes`、`vault-forwards`（**TT-MOD-B3-05 · `governance_reads`**）。

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::common::add_placeholder_header;

/// GET /api/v1/governance/rewards — 激励/发放记录（50-G1：有 DB 从表读，否则占位）
pub async fn get_governance_rewards(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::list_governance_rewards(pool, 100).await {
            Ok(rows) => {
                let items: Vec<_> = rows
                    .into_iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "user_id": r.user_id.map(|u| u.to_string()),
                            "amount": r.amount,
                            "currency": r.currency,
                            "status": r.status,
                            "created_at": r.created_at.to_rfc3339()
                        })
                    })
                    .collect();
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "data_source": "database",
                    "rule_version": "governance_rewards_v1"
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "items": [],
        "data_source": "placeholder",
        "note": "49 G 占位：非链上 Claim 真值；激励发放记录待产品定稿后实现"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

#[derive(Debug, Deserialize)]
pub struct FeeRoutesQuery {
    /// 1..=100，缺省 50
    pub limit: Option<u32>,
    /// 上一页最后一条的 `{block_number}:{log_index}`
    pub cursor: Option<String>,
    /// 可选；不传则所有 `chain_id`
    pub chain_id: Option<i64>,
}

/// GET /api/v1/governance/fee-routes — FeeRouter `PlatformFeeRouted` 索引只读列表（110、14 §1.1）
pub async fn get_governance_fee_routes(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeeRoutesQuery>,
) -> impl IntoResponse {
    let limit = match db::parse_fee_routes_limit(q.limit) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    e,
                    format!(
                        "limit must be 1..={} or omit for default 50",
                        db::FEE_ROUTES_MAX_LIMIT
                    ),
                )),
            )
                .into_response();
        }
    };
    let (after_block, after_log) = match q.cursor.as_deref() {
        None | Some("") => (None, None),
        Some(s) => match db::parse_fee_routes_cursor(s) {
            Ok((b, l)) => (Some(b), Some(l)),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        e,
                        "cursor must be block_number:log_index from page.next_cursor",
                    )),
                )
                    .into_response();
            }
        },
    };

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::list_fee_router_routed_events(pool, q.chain_id, after_block, after_log, limit)
            .await
        {
            Ok((rows, has_more)) => {
                let items: Vec<_> = rows
                    .iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "chain_id": r.chain_id,
                            "block_number": r.block_number,
                            "log_index": r.log_index,
                            "block_hash": r.block_hash,
                            "tx_hash": r.tx_hash,
                            "router_address": r.router_address,
                            "token_address": r.token_address,
                            "amount_u256_hex": r.amount_u256_hex,
                            "to_country_u256_hex": r.to_country_u256_hex,
                            "to_stakers_u256_hex": r.to_stakers_u256_hex,
                            "to_reserve_u256_hex": r.to_reserve_u256_hex,
                            "to_ops_u256_hex": r.to_ops_u256_hex,
                            "inserted_at": r.inserted_at.to_rfc3339()
                        })
                    })
                    .collect();
                let next_cursor = rows
                    .last()
                    .map(|r| db::encode_fee_routes_cursor(r.block_number, r.log_index));
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "page": {
                        "has_more": has_more,
                        "next_cursor": next_cursor
                    }
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "items": [],
        "page": {
            "has_more": false,
            "next_cursor": serde_json::Value::Null
        },
        "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无索引投影；见 internal/indexer-tick + FEE_ROUTER_ADDRESS"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

/// GET /api/v1/governance/vault-forwards — RegionVault `RegionVaultForwarded` 索引只读列表（110、14 §1.1.1）
pub async fn get_governance_vault_forwards(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeeRoutesQuery>,
) -> impl IntoResponse {
    let limit = match db::parse_fee_routes_limit(q.limit) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    e,
                    format!(
                        "limit must be 1..={} or omit for default 50",
                        db::FEE_ROUTES_MAX_LIMIT
                    ),
                )),
            )
                .into_response();
        }
    };
    let (after_block, after_log) = match q.cursor.as_deref() {
        None | Some("") => (None, None),
        Some(s) => match db::parse_fee_routes_cursor(s) {
            Ok((b, l)) => (Some(b), Some(l)),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        e,
                        "cursor must be block_number:log_index from page.next_cursor",
                    )),
                )
                    .into_response();
            }
        },
    };

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::list_region_vault_forwarded_events(
            pool,
            q.chain_id,
            after_block,
            after_log,
            limit,
        )
        .await
        {
            Ok((rows, has_more)) => {
                let items: Vec<_> = rows
                    .iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "chain_id": r.chain_id,
                            "block_number": r.block_number,
                            "log_index": r.log_index,
                            "block_hash": r.block_hash,
                            "tx_hash": r.tx_hash,
                            "vault_address": r.vault_address,
                            "token_address": r.token_address,
                            "to_address": r.to_address,
                            "amount_u256_hex": r.amount_u256_hex,
                            "inserted_at": r.inserted_at.to_rfc3339()
                        })
                    })
                    .collect();
                let next_cursor = rows
                    .last()
                    .map(|r| db::encode_fee_routes_cursor(r.block_number, r.log_index));
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "page": {
                        "has_more": has_more,
                        "next_cursor": next_cursor
                    }
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "items": [],
        "page": {
            "has_more": false,
            "next_cursor": serde_json::Value::Null
        },
        "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无索引投影；见 internal/indexer-tick + REGION_VAULT_ADDRESS"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}
