//! /api/v1/governance（49 G 治理与激励；04 §3.4、49 G.4、50-G1；**protocol-reference** 见 84 文档镜像）
//! 有 DB 时从 governance_pool / governance_reward_records / fee_router_routed_events / region_vault_forwarded_events 读取；无 DB 时返回占位。
//! **fee-pool-aggregates**（B-084）：对两投影表按 token / pool_id 做 **uint256 Σ**（只读对账）。
//! 发放逻辑（谁在何时获得多少）待产品定稿后补，见 50 §六附、04 §3.4。
//! Target 语义：FeeRouter/链上治理未部署时，本路由**不得**被理解为链上池真值；占位响应带 `X-Implementation-Status: placeholder`（82 §六 T6、83 SSOT）。

use axum::extract::Query;
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use std::collections::BTreeMap;

use crate::db;
use crate::state::ApiMetaState;
use axum::extract::State;

use super::governance_doc_reference;

fn add_placeholder_header(res: &mut axum::response::Response<axum::body::Body>) {
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("placeholder"),
    );
}

/// GET /api/v1/governance/pool — 治理币池（50-G1：有 DB 从表读，否则占位）
pub async fn get_governance_pool(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::get_governance_pool(pool).await {
            Ok(Some(row)) => {
                return Json(json!({
                    "status": "ok",
                    "pool_balance": row.balance,
                    "currency": row.currency,
                    "updated_at": row.updated_at.to_rfc3339(),
                    "data_source": "database",
                    "rule_version": "governance_pool_v1"
                }))
                .into_response();
            }
            Ok(None) => {
                return Json(json!({
                    "status": "ok",
                    "pool_balance": null,
                    "currency": null,
                    "updated_at": null,
                    "data_source": "database_empty",
                    "rule_version": "governance_pool_v1",
                    "note": "governance_pool 表当前无行；非链上 FeeRouter 真值，与 04 §3.4 / 83·84 叙事一致"
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "pool_balance": null,
        "currency": null,
        "data_source": "placeholder",
        "note": "49 G 占位：非链上 FeeRouter 真值；治理币池待产品定稿后实现"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

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
    limit: Option<u32>,
    /// 上一页最后一条的 `{block_number}:{log_index}`
    cursor: Option<String>,
    /// 可选；不传则所有 `chain_id`
    chain_id: Option<i64>,
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
        "page": { "has_more": false, "next_cursor": Option::<String>::None },
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
        "page": { "has_more": false, "next_cursor": Option::<String>::None },
        "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无索引投影；见 internal/indexer-tick + REGION_VAULT_ADDRESS"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

#[derive(Debug, Deserialize)]
pub struct FeePoolAggregatesQuery {
    /// 可选；不传则聚合全部 `chain_id` 的投影行
    chain_id: Option<i64>,
}

fn fee_pool_cross_check_json() -> serde_json::Value {
    let pref = governance_doc_reference::protocol_reference_json();
    let checksums = &pref["checksums"];
    let n_countries = pref["phase1_countries"]
        .as_array()
        .map(std::vec::Vec::len);
    json!({
        "protocol_reference_doc_version": pref["doc_version"],
        "phase1_open_fee_points_sum": checksums["phase1_open_fee_points_sum"],
        "phase1_countries_count": n_countries,
        "fee_router_layer1_country_bucket_percent": checksums["country_bucket_percent"],
        "note": "Cross-check GET /api/v1/governance/protocol-reference (84 open_fee_points checksums); aggregates are Σ projection rows only (B-084)"
    })
}

fn build_fee_pool_aggregate_body(
    chain_id_filter: Option<i64>,
    fr: Vec<db::FeeRouterAggregateSourceRow>,
    rv: Vec<db::RegionVaultAggregateSourceRow>,
) -> Result<serde_json::Value, &'static str> {
    use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, zero_word};

    #[derive(Default)]
    struct FrAcc {
        allocatable_platform_fee_total: [u8; 32],
        country_bucket: [u8; 32],
        global_stakers: [u8; 32],
        global_reserve: [u8; 32],
        global_ops: [u8; 32],
        rows: u64,
    }

    let mut fr_map: BTreeMap<String, FrAcc> = BTreeMap::new();
    for row in fr {
        let tok = row.token_address.trim().to_ascii_lowercase();
        let ent = fr_map.entry(tok).or_default();
        let w0 = parse_u256_word_hex(&row.amount_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w1 = parse_u256_word_hex(&row.to_country_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w2 = parse_u256_word_hex(&row.to_stakers_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w3 = parse_u256_word_hex(&row.to_reserve_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w4 = parse_u256_word_hex(&row.to_ops_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        add_assign_be(&mut ent.allocatable_platform_fee_total, &w0)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.country_bucket, &w1)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_stakers, &w2)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_reserve, &w3)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_ops, &w4)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        ent.rows += 1;
    }

    let fr_items: Vec<_> = fr_map
        .into_iter()
        .map(|(token_address, a)| {
            json!({
                "token_address": token_address,
                "event_row_count": a.rows,
                "pools": {
                    "allocatable_platform_fee_total_u256_hex": fmt_word_hex(&a.allocatable_platform_fee_total),
                    "country_bucket_u256_hex": fmt_word_hex(&a.country_bucket),
                    "global_stakers_u256_hex": fmt_word_hex(&a.global_stakers),
                    "global_reserve_u256_hex": fmt_word_hex(&a.global_reserve),
                    "global_ops_u256_hex": fmt_word_hex(&a.global_ops)
                },
                "pool_id_legend": "84: country_bucket = PlatformFeeRouted data word[1]; global_stakers/reserve/ops = words[2..5] (ttg_stakers / reserve / operations)"
            })
        })
        .collect();

    #[derive(Default)]
    struct VTok {
        total: [u8; 32],
        by_to: BTreeMap<String, [u8; 32]>,
        rows: u64,
    }
    let mut v_map: BTreeMap<String, VTok> = BTreeMap::new();
    for row in rv {
        let tok = row.token_address.trim().to_ascii_lowercase();
        let to_a = row.to_address.trim().to_ascii_lowercase();
        let amt = parse_u256_word_hex(&row.amount_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let ent = v_map.entry(tok).or_default();
        add_assign_be(&mut ent.total, &amt).map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        let slot = ent.by_to.entry(to_a).or_insert_with(zero_word);
        add_assign_be(slot, &amt).map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        ent.rows += 1;
    }

    let rv_items: Vec<_> = v_map
        .into_iter()
        .map(|(token_address, a)| {
            let by_recipient: Vec<_> = a
                .by_to
                .into_iter()
                .map(|(to_address, w)| {
                    json!({
                        "to_address": to_address,
                        "amount_u256_hex": fmt_word_hex(&w),
                    })
                })
                .collect();
            json!({
                "token_address": token_address,
                "event_row_count": a.rows,
                "total_forwarded_u256_hex": fmt_word_hex(&a.total),
                "by_recipient": by_recipient
            })
        })
        .collect();

    Ok(json!({
        "status": "ok",
        "data_source": "projection",
        "ssot": "fee_router_routed_events+region_vault_forwarded_events",
        "chain_id_filter": chain_id_filter,
        "fee_router": {
            "by_token": fr_items,
            "note": "Per-token Σ over indexed PlatformFeeRouted projection rows; uint256 big-endian 0x-hex"
        },
        "region_vault": {
            "by_token": rv_items,
            "note": "Per-token Σ RegionVaultForwarded amount; by_recipient sub-aggregates for downstream pool routing checks"
        },
        "cross_check": fee_pool_cross_check_json(),
        "rule_version": "fee_pool_aggregates_projection_v1",
        "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION"
    }))
}

/// GET /api/v1/governance/fee-pool-aggregates — 按 **token** / **pool_id** 的投影累计入量（B-084）
pub async fn get_governance_fee_pool_aggregates(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeePoolAggregatesQuery>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        let mut res = Json(json!({
            "status": "ok",
            "data_source": "placeholder",
            "ssot": "fee_router_routed_events+region_vault_forwarded_events",
            "chain_id_filter": q.chain_id,
            "fee_router": { "by_token": [] },
            "region_vault": { "by_token": [] },
            "cross_check": fee_pool_cross_check_json(),
            "rule_version": "fee_pool_aggregates_projection_v1",
            "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION",
            "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无聚合源；见 internal/indexer-tick + FEE_ROUTER_ADDRESS / REGION_VAULT_ADDRESS"
        }))
        .into_response();
        add_placeholder_header(&mut res);
        return res;
    };

    let (fr, rv) = match tokio::try_join!(
        db::fetch_fee_router_for_aggregate(pool, q.chain_id),
        db::fetch_region_vault_for_aggregate(pool, q.chain_id),
    ) {
        Ok(x) => x,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "fee_pool_aggregates_query_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    match build_fee_pool_aggregate_body(q.chain_id, fr, rv) {
        Ok(v) => Json(v).into_response(),
        Err(key) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                key,
                "u256 parse failed, add overflow, or malformed projection hex; fix DB projection rows",
            )),
        )
            .into_response(),
    }
}

/// GET /api/v1/governance/protocol-reference — 84 文档镜像（非链上真值）
pub async fn get_protocol_reference() -> impl IntoResponse {
    let mut res = Json(governance_doc_reference::protocol_reference_json()).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("doc-reference"),
    );
    res
}

/// GET /api/v1/governance/protocol-reference/pending — 待生效参数包（默认与文档镜像一致；可选 env 深度合并）
pub async fn get_protocol_reference_pending() -> impl IntoResponse {
    let mut res =
        Json(governance_doc_reference::protocol_reference_pending_json()).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("doc-reference-pending"),
    );
    res
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/governance/pool", get(get_governance_pool))
        .route("/api/v1/governance/rewards", get(get_governance_rewards))
        .merge(crate::routes::governance_proposals::router())
        .merge(crate::routes::governance_investor_share::router())
        .merge(crate::routes::investor_distribution::governance_router())
        .merge(crate::routes::governance_delegate::router())
        .merge(crate::routes::governance_voting_power::router())
        .route(
            "/api/v1/governance/fee-routes",
            get(get_governance_fee_routes),
        )
        .route(
            "/api/v1/governance/vault-forwards",
            get(get_governance_vault_forwards),
        )
        .route(
            "/api/v1/governance/fee-pool-aggregates",
            get(get_governance_fee_pool_aggregates),
        )
        .route(
            "/api/v1/governance/protocol-reference",
            get(get_protocol_reference),
        )
        .route(
            "/api/v1/governance/protocol-reference/pending",
            get(get_protocol_reference_pending),
        )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::state::test_support::api_meta_state;
    use axum::extract::Query;
    use axum::extract::State;
    use http_body_util::BodyExt;

    #[tokio::test]
    async fn protocol_reference_response_has_doc_reference_header_and_body() {
        let res = get_protocol_reference().await.into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("doc-reference")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("doc_version").and_then(|x| x.as_str()),
            Some(governance_doc_reference::DOC_VERSION)
        );
    }

    #[tokio::test]
    async fn protocol_reference_pending_response_has_pending_header_and_source() {
        let res = get_protocol_reference_pending().await.into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("doc-reference-pending")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert!(
            v.get("pending_package_source")
                .and_then(|x| x.as_str())
                .is_some_and(|s| !s.is_empty()),
            "pending_package_source must be a non-empty string"
        );
    }

    #[tokio::test]
    async fn governance_fee_routes_no_chain_off_sets_placeholder_header() {
        let res = get_governance_fee_routes(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(v["items"].as_array().map(|a| a.len()), Some(0));
    }

    #[tokio::test]
    async fn governance_vault_forwards_no_chain_off_sets_placeholder_header() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(v["items"].as_array().map(|a| a.len()), Some(0));
    }

    #[tokio::test]
    async fn governance_fee_routes_limit_zero_returns_400() {
        let res = get_governance_fee_routes(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: Some(0),
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_limit")
        );
    }

    #[tokio::test]
    async fn governance_fee_routes_bad_cursor_returns_400() {
        let res = get_governance_fee_routes(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: Some("not-a-cursor".to_string()),
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_cursor")
        );
    }

    #[tokio::test]
    async fn governance_vault_forwards_limit_zero_returns_400() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: Some(0),
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_limit")
        );
    }

    #[tokio::test]
    async fn governance_fee_pool_aggregates_no_chain_off_sets_placeholder_header() {
        let res = get_governance_fee_pool_aggregates(
            State(api_meta_state(None)),
            Query(FeePoolAggregatesQuery { chain_id: None }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("placeholder")
        );
        assert_eq!(v["fee_router"]["by_token"].as_array().map(|a| a.len()), Some(0));
        assert_eq!(
            v["region_vault"]["by_token"].as_array().map(|a| a.len()),
            Some(0)
        );
        assert_eq!(
            v.get("anchor").and_then(|x| x.as_str()),
            Some("B-084-FEE-POOL-AGGREGATES-PROJECTION")
        );
    }

    #[test]
    fn fee_pool_aggregate_body_sums_two_fr_rows_same_token() {
        let fr = vec![
            db::FeeRouterAggregateSourceRow {
                token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
                amount_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000001"
                        .to_string(),
                to_country_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                        .to_string(),
                to_stakers_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                        .to_string(),
                to_reserve_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000004"
                        .to_string(),
                to_ops_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000005"
                        .to_string(),
            },
            db::FeeRouterAggregateSourceRow {
                token_address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA".to_string(),
                amount_u256_hex:
                    "0x000000000000000000000000000000000000000000000000000000000000000a"
                        .to_string(),
                to_country_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000001"
                        .to_string(),
                to_stakers_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
                to_reserve_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
                to_ops_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
            },
        ];
        let v = build_fee_pool_aggregate_body(Some(1), fr, vec![]).expect("ok");
        let arr = v["fee_router"]["by_token"].as_array().unwrap();
        assert_eq!(arr.len(), 1);
        let pools = &arr[0]["pools"];
        assert_eq!(
            pools["allocatable_platform_fee_total_u256_hex"].as_str().unwrap(),
            "0x000000000000000000000000000000000000000000000000000000000000000b"
        );
        assert_eq!(
            pools["country_bucket_u256_hex"].as_str().unwrap(),
            "0x0000000000000000000000000000000000000000000000000000000000000003"
        );
        assert_eq!(arr[0]["event_row_count"].as_u64(), Some(2));
    }

    #[tokio::test]
    async fn governance_vault_forwards_bad_cursor_returns_400() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: Some("abc".to_string()),
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_cursor")
        );
    }
}
