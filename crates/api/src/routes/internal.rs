//! /api/v1/internal/*（48 §2.2 routes/internal）
//! indexer_tick 成功后落盘运行时 indexer 状态（48 §12.3）
//! G4：PATCH feedback 官方回复/状态仅内网，产品定稿后可扩展公网权限（55 §八附续.6）

use axum::extract::{Path as AxumPath, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::path::Path;
use uuid::Uuid;

use crate::chain;
use crate::chain_off;
use crate::db;
use crate::state::ApiMetaState;

fn normalize_hex_addr(a: &str) -> String {
    let s = a.trim_start_matches("0x");
    format!("0x{}", s.to_lowercase())
}

/// FeeRouter / RegionVault 投影表按链行数摘要；任一查失败返回 `None`（不阻断主对账）。
async fn economic_projection_row_counts_for_chain(pool: &PgPool, chain_id: i64) -> Option<Value> {
    match (
        db::fee_router_routed_stats(pool, Some(chain_id)).await,
        db::region_vault_forwarded_stats(pool, Some(chain_id)).await,
    ) {
        (Ok(fr), Ok(rv)) => Some(json!({
            "fee_router_routed_events": {
                "rows_total": fr.total,
                "max_block_number": fr.max_block_number,
                "min_block_number": fr.min_block_number,
                "latest_inserted_at": fr.latest_inserted_at.map(|t| t.to_rfc3339()),
            },
            "region_vault_forwarded_events": {
                "rows_total": rv.total,
                "max_block_number": rv.max_block_number,
                "min_block_number": rv.min_block_number,
                "latest_inserted_at": rv.latest_inserted_at.map(|t| t.to_rfc3339()),
            },
        })),
        _ => None,
    }
}

const DEFAULT_COMMUNITY_RANKING_SNAPSHOT_LIMIT: i64 = 30;

/// 单模式快照：`mode` ∈ latest|hot|recommend（与公开 Feed 同源查询）
async fn execute_community_ranking_snapshot_core(
    pool: &sqlx::PgPool,
    mode: &str,
    limit: i64,
    notes: Option<&str>,
) -> Result<(Uuid, &'static str, i32, Vec<Uuid>), String> {
    let lim = limit.clamp(1, 100);
    let mode_lc = mode.trim().to_lowercase();
    let (posts, feed_mode_stored) = match mode_lc.as_str() {
        "hot" => {
            let (p, _) = db::list_feed_hot(pool, None, lim, None)
                .await
                .map_err(|_| "list_feed_hot failed".to_string())?;
            (p, "hot")
        }
        "recommend" => {
            let (p, _) = db::list_feed(pool, None, lim, None)
                .await
                .map_err(|_| "list_feed failed".to_string())?;
            (p, "recommend")
        }
        "latest" => {
            let (p, _) = db::list_feed(pool, None, lim, None)
                .await
                .map_err(|_| "list_feed failed".to_string())?;
            (p, "latest")
        }
        _ => return Err("invalid_feed_mode".to_string()),
    };
    let ids: Vec<Uuid> = posts.iter().map(|p| p.id).collect();
    let item_count = ids.len() as i32;
    let snap_id =
        db::insert_community_ranking_snapshot(pool, feed_mode_stored, item_count, &ids, notes)
            .await
            .map_err(|_| "snapshot insert failed".to_string())?;
    Ok((snap_id, feed_mode_stored, item_count, ids))
}

fn community_ranking_scheduler_limit_from_env() -> i64 {
    std::env::var("COMMUNITY_RANKING_SNAPSHOT_LIMIT")
        .ok()
        .and_then(|s| s.trim().parse::<i64>().ok())
        .unwrap_or(DEFAULT_COMMUNITY_RANKING_SNAPSHOT_LIMIT)
        .clamp(1, 100)
}

fn is_allowed_internal_scheduler_trigger(s: &str) -> bool {
    matches!(s, "cron" | "system")
}

fn normalize_community_ranking_scheduler_job_code(s: &str) -> Option<&'static str> {
    match s.trim() {
        "community.ranking.snapshot.latest" => Some("community.ranking.snapshot.latest"),
        "community.ranking.snapshot.hot" => Some("community.ranking.snapshot.hot"),
        "community.ranking.snapshot.recommend" => Some("community.ranking.snapshot.recommend"),
        "community.ranking.snapshot.all" => Some("community.ranking.snapshot.all"),
        _ => None,
    }
}

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new()
        .merge(crate::routes::investor_distribution::internal_router())
        .route(
            "/api/v1/internal/process-resolution-outbox",
            post(process_resolution_outbox),
        )
        .route("/api/v1/internal/indexer-tick", post(indexer_tick))
        .route("/api/v1/internal/indexer-replay", post(indexer_replay))
        .route(
            "/api/v1/internal/indexer-reorg-rewind",
            post(indexer_reorg_rewind),
        )
        .route(
            "/api/v1/internal/indexer-reconcile",
            post(indexer_reconcile),
        )
        .route("/api/v1/internal/indexer-status", get(indexer_status))
        .route(
            "/api/v1/internal/alerts/test-fire",
            post(internal_alerts_test_fire),
        )
        .route(
            "/api/v1/internal/incident/open",
            post(internal_incident_open),
        )
        .route(
            "/api/v1/internal/community/feedback/:id",
            patch(patch_feedback_official_reply),
        )
        .route(
            "/api/v1/internal/community/ranking/snapshot",
            post(post_internal_community_ranking_snapshot),
        )
        .route(
            "/api/v1/internal/scheduler/enqueue",
            post(post_internal_scheduler_enqueue),
        )
        .route(
            "/api/v1/internal/scheduler/run-next",
            post(post_internal_scheduler_run_next),
        )
}

/// POST /api/v1/internal/process-resolution-outbox：执行器消费一条裁决并代发链上（P5-4）
pub async fn process_resolution_outbox(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let (config, outbox) = match (&state.chain_config, &state.resolution_outbox) {
        (Some(c), Some(o)) => (c.clone(), o.clone()),
        _ => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"error": "chain_not_configured", "message": "chain_not_configured", "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"})),
            )
                .into_response();
        }
    };
    match chain::outbox::process_one(&outbox, &config).await {
        Some((count, Ok(tx_hash))) => (
            StatusCode::OK,
            Json(json!({"status": "ok", "processed": count, "tx_hash": tx_hash})),
        )
            .into_response(),
        Some((_, Err(e))) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail("execute_failed", e)),
        )
            .into_response(),
        None => (
            StatusCode::OK,
            Json(json!({"status": "ok", "processed": 0, "message": "outbox_empty"})),
        )
            .into_response(),
    }
}

/// POST /api/v1/internal/indexer-tick：P5-5 索引器拉取一轮（从 checkpoint 到 **终局安全上界**），推进 checkpoint。
/// **110 §3.3**：上界为 `chain_tip.saturating_sub(max(1, FINALITY_N))`，不消费未达 finality 的块，避免订单/FeeRouter 投影抢跑。
/// 成功 JSON：`events_applied` = 本轮扫描到的 log 条数；`events_new` = 实际新写入索引器状态的事件条数（去重后与前者可不等）。
/// 补充 `eth_getLogs`（**escrow 实例列表** / **FeeRouter** / **RegionVault**）失败时默认仍 **200**，体含 **`logs_fetch_skipped`**（`scope` + `error` 等）；**`INDEXER_STRICT_SUPPLEMENTAL_LOG_FETCH=1`** 时改 **500** **`fetch_supplemental_logs_failed`**。
/// **`INDEXER_REORG_AUTO_REWIND_ON_TICK=1`**（须 **DATABASE_URL**）：检测到 **`reorg_suspected`** 时**每 tick 至多一次**自动执行与 **`indexer-reorg-rewind`** 同源的 DB+内存回滚并重校验 hash；仍失败则 **503** **`reorg_still_suspected_after_auto_rewind`**。
pub async fn indexer_tick(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let (config, indexer_handle) = match (&state.chain_config, &state.indexer_state) {
        (Some(c), Some(idx)) => (c.clone(), idx.clone()),
        _ => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"error": "chain_not_configured", "message": "chain_not_configured", "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"})),
            )
                .into_response();
        }
    };
    let factory = match &config.escrow_factory_address {
        Some(a) => a.clone(),
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key("ESCROW_FACTORY_ADDRESS not set")),
            )
                .into_response();
        }
    };
    let mut reorg_auto_rewind: Option<Value> = None;
    let from_block = loop {
        let (from_block, last_indexed_block, last_indexed_block_hash) = {
            let g = indexer_handle.read().await;
            (g.last_block + 1, g.last_block, g.last_block_hash.clone())
        };
        if last_indexed_block > 0 && !last_indexed_block_hash.trim().is_empty() {
            match chain::indexer::get_block_hash_at(&config.rpc_url, last_indexed_block).await {
                Ok(chain_hash) => {
                    if chain::indexer::reorg_detected(&last_indexed_block_hash, &chain_hash) {
                        if indexer_reorg_auto_rewind_on_tick_enabled() {
                            if let Some(pool) =
                                state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref())
                            {
                                if reorg_auto_rewind.is_some() {
                                    return (
                                        StatusCode::SERVICE_UNAVAILABLE,
                                        Json(json!({
                                            "error": "reorg_still_suspected_after_auto_rewind",
                                            "message": "reorg_still_suspected_after_auto_rewind",
                                            "hint": "INDEXER_REORG_AUTO_REWIND_ON_TICK=1 already ran one rewind this tick but hash still mismatches; investigate RPC and indexer state",
                                            "block_number": last_indexed_block,
                                            "stored_last_block_hash": last_indexed_block_hash,
                                            "chain_block_hash": chain_hash,
                                        })),
                                    )
                                        .into_response();
                                }
                                match perform_indexer_reorg_rewind_execute(
                                    &state,
                                    &config,
                                    &indexer_handle,
                                    pool,
                                    last_indexed_block,
                                )
                                .await
                                {
                                    Ok(out) => {
                                        reorg_auto_rewind = Some(json!({
                                            "rewind_from_block": last_indexed_block,
                                            "deleted": {
                                                "event_log_rows": out.deleted_event_log,
                                                "fee_router_routed_events_rows": out.deleted_fee_router,
                                                "region_vault_forwarded_events_rows": out.deleted_region_vault,
                                                "investor_share_transfer_events_rows": out.deleted_investor_share,
                                                "orders_projection_rows": out.deleted_orders_projection,
                                            },
                                            "indexer_after": {
                                                "last_block": out.last_block,
                                                "last_log_index": out.last_log_index,
                                                "last_block_hash": out.last_block_hash,
                                            },
                                            "replay_stats": out.replay_stats,
                                            "chain_off_orders_reload": out.chain_off_orders_reload,
                                            "orders_table_projection_sync": out.orders_table_projection_sync,
                                        }));
                                        continue;
                                    }
                                    Err((sc, j)) => return (sc, Json(j)).into_response(),
                                }
                            } else {
                                return (
                                    StatusCode::SERVICE_UNAVAILABLE,
                                    Json(json!({
                                        "error": "reorg_suspected",
                                        "message": "reorg_suspected",
                                        "hint": "Last indexed block hash differs from canonical chain; INDEXER_REORG_AUTO_REWIND_ON_TICK=1 requires DATABASE_URL (chain_off.db_pool). Otherwise pause ticks and follow Runbook §2.55 / 110",
                                        "block_number": last_indexed_block,
                                        "stored_last_block_hash": last_indexed_block_hash,
                                        "chain_block_hash": chain_hash,
                                    })),
                                )
                                    .into_response();
                            }
                        } else {
                            return (
                                StatusCode::SERVICE_UNAVAILABLE,
                                Json(json!({
                                    "error": "reorg_suspected",
                                    "message": "reorg_suspected",
                                    "hint": "Last indexed block hash differs from canonical chain; pause indexer ticks, verify head, then follow Runbook §2.55 / 110 (replay or manual correction). Optional: INDEXER_REORG_AUTO_REWIND_ON_TICK=1 with DB for one automatic rewind per tick",
                                    "block_number": last_indexed_block,
                                    "stored_last_block_hash": last_indexed_block_hash,
                                    "chain_block_hash": chain_hash,
                                })),
                            )
                                .into_response();
                        }
                    }
                }
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key_detail(
                            "get_block_hash_at_failed",
                            e,
                        )),
                    )
                        .into_response();
                }
            }
        }
        break from_block;
    };
    let latest = match chain::indexer::get_latest_block(&config.rpc_url).await {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "get_latest_block_failed",
                    e,
                )),
            )
                .into_response();
        }
    };
    let to_block = chain::indexer::indexer_finalized_upper_bound(latest, state.finality_n);
    if from_block > latest {
        let mut body = json!({
            "status": "ok",
            "events_applied": 0,
            "events_new": 0,
            "investor_share_transfer_events_new": 0,
            "from_block": from_block,
            "to_block": to_block,
            "chain_tip": latest,
            "finality_n": state.finality_n,
            "message": "no_new_blocks"
        });
        attach_meta_build_to_tick_ok_body(&mut body);
        return (StatusCode::OK, Json(body)).into_response();
    }
    if from_block > to_block {
        let mut body = json!({
            "status": "ok",
            "events_applied": 0,
            "events_new": 0,
            "investor_share_transfer_events_new": 0,
            "from_block": from_block,
            "to_block": to_block,
            "chain_tip": latest,
            "finality_n": state.finality_n,
            "message": "awaiting_finality"
        });
        attach_meta_build_to_tick_ok_body(&mut body);
        return (StatusCode::OK, Json(body)).into_response();
    }
    let mut logs =
        match chain::indexer::fetch_escrow_logs(&config.rpc_url, &factory, from_block, to_block)
            .await
        {
            Ok(l) => l,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "fetch_escrow_logs_failed",
                        e,
                    )),
                )
                    .into_response();
            }
        };
    let strict_supplemental_logs = indexer_strict_supplemental_log_fetch_enabled();
    let mut logs_fetch_skipped: Vec<serde_json::Value> = Vec::new();
    // P5-3：从已有关联的 escrow 实例拉取 Released/Refunded/ResolutionExecuted，合并后按 (block, log_index) 排序
    if let Some(ref co) = state.chain_off {
        let addrs = {
            let g = co.store.read().await;
            chain_off::list_escrow_addresses_for_indexer(&g)
        };
        if !addrs.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &addrs,
                from_block,
                to_block,
            )
            .await
            {
                Ok(escrow_logs) => logs.extend(escrow_logs),
                Err(e) => {
                    if strict_supplemental_logs {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("escrow_instances: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "escrow_instances",
                        "addresses": addrs.len(),
                        "error": e
                    }));
                }
            }
        }
        logs.sort_by_key(|t| (t.0, t.1));
    }
    // FeeRouter：PlatformFeeRouted（83/84、14 §1.1）；与 Escrow 日志合并后按 (block, log_index) 排序
    if let Some(ref fr) = config.fee_router_address {
        let fr = fr.trim();
        if !fr.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[fr.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(fr_logs) => {
                    logs.extend(fr_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("fee_router: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "fee_router",
                        "address": fr,
                        "error": e
                    }));
                }
            }
        }
    }
    // RegionVault：RegionVaultForwarded（14 §1.1.1）
    if let Some(ref rv) = config.region_vault_address {
        let rv = rv.trim();
        if !rv.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[rv.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(rv_logs) => {
                    logs.extend(rv_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("region_vault: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "region_vault",
                        "address": rv,
                        "error": e
                    }));
                }
            }
        }
    }
    let mut applied = 0u32;
    let mut events_new = 0u32;
    for (block_number, log_index, block_hash, tx_hash, kind, data, topics) in logs {
        let data_for_fee_parse = data.clone();
        let inserted = chain::indexer::append_event_and_advance_checkpoint(
            &indexer_handle,
            config.chain_id,
            block_number,
            log_index,
            &block_hash,
            &tx_hash,
            &kind,
            data,
        )
        .await;
        applied += 1;
        if inserted {
            events_new += 1;
        }
        // P5-3/P5-5：仅新事件跑投影与 DB 双写；重复 (chain_id, block, log_index) 已由 append 去重
        if inserted {
            if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
                if let (Some(bh), Some(th)) = (
                    db::decode_eth_hash_bytes(&block_hash),
                    db::decode_eth_hash_bytes(&tx_hash),
                ) {
                    let ev_name = chain_off::event_name_from_topic0(&kind);
                    let event_type = db::event_type_label(&kind, ev_name);
                    let payload = json!({
                        "topics": topics,
                        "topic0": &kind,
                        "data": &data_for_fee_parse,
                    });
                    let fn_i = (state.finality_n.min(i32::MAX as u64)) as i32;
                    let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                    if let Err(e) = db::insert_event_log(
                        pool,
                        chain_id_i64,
                        block_number as i64,
                        log_index as i32,
                        &bh,
                        &th,
                        &event_type,
                        &payload,
                        fn_i,
                    )
                    .await
                    {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "insert_event_log_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if chain_off::event_name_from_topic0(&kind) == Some("PlatformFeeRouted") {
                if let (Some(ref co), Some(ref router_cfg)) =
                    (state.chain_off.as_ref(), config.fee_router_address.as_ref())
                {
                    if let Some(pool) = co.db_pool.as_ref() {
                        if let Some((token, words)) =
                            chain_off::parse_platform_fee_routed(&topics, &data_for_fee_parse)
                        {
                            let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                            let router = normalize_hex_addr(router_cfg);
                            if let Err(e) = db::insert_fee_router_routed_event(
                                pool,
                                chain_id_i64,
                                block_number as i64,
                                log_index as i32,
                                &block_hash,
                                &tx_hash,
                                &router,
                                &token,
                                &words[0],
                                &words[1],
                                &words[2],
                                &words[3],
                                &words[4],
                            )
                            .await
                            {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_fee_router_routed_event_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response();
                            }
                        }
                    }
                }
            }
            if chain_off::event_name_from_topic0(&kind) == Some("RegionVaultForwarded") {
                if let (Some(ref co), Some(ref vault_cfg)) = (
                    state.chain_off.as_ref(),
                    config.region_vault_address.as_ref(),
                ) {
                    if let Some(pool) = co.db_pool.as_ref() {
                        if let Some((token, to, amount_hex)) =
                            chain_off::parse_region_vault_forwarded(&topics, &data_for_fee_parse)
                        {
                            let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                            let vault = normalize_hex_addr(vault_cfg);
                            if let Err(e) = db::insert_region_vault_forwarded_event(
                                pool,
                                chain_id_i64,
                                block_number as i64,
                                log_index as i32,
                                &block_hash,
                                &tx_hash,
                                &vault,
                                &token,
                                &to,
                                &amount_hex,
                            )
                            .await
                            {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_region_vault_forwarded_event_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response();
                            }
                        }
                    }
                }
            }
            if let Some(ref co) = state.chain_off {
                if let Some(event_name) = chain_off::event_name_from_topic0(&kind) {
                    if !matches!(event_name, "PlatformFeeRouted" | "RegionVaultForwarded") {
                        let want_escrow = event_name == "EscrowCreated";
                        if let Some((order_id, escrow_addr)) =
                            chain_off::parse_order_id_and_escrow_from_topics(&topics, want_escrow)
                        {
                            let mut g = co.store.write().await;
                            let updated = chain_off::project_chain_event_onto_order(
                                &mut g,
                                order_id,
                                config.chain_id,
                                block_number,
                                log_index,
                                event_name,
                                escrow_addr,
                            );
                            if updated {
                                if let Some(order) = g.orders.get(&order_id).cloned() {
                                    drop(g);
                                    if let Err(e) =
                                        chain_off::try_persist_order_to_db(co, &order).await
                                    {
                                        return (
                                            StatusCode::INTERNAL_SERVER_ERROR,
                                            Json(crate::api_json::err_key_detail(
                                                "order_db_persist_failed",
                                                e.to_string(),
                                            )),
                                        )
                                            .into_response();
                                    }
                                    if let Some(pool) = co.db_pool.as_ref() {
                                        if let Some(raw32) =
                                            chain_off::parse_order_id_bytes32_from_topics(&topics)
                                        {
                                            let chain_id_i64 =
                                                (config.chain_id.min(i64::MAX as u64)) as i64;
                                            let esc = order
                                                .escrow_address
                                                .as_deref()
                                                .and_then(db::decode_evm_address_bytes);
                                            if let Err(e) =
                                                db::upsert_orders_projection_chain_snapshot(
                                                    pool,
                                                    &raw32,
                                                    chain_id_i64,
                                                    block_number as i64,
                                                    log_index as i32,
                                                    event_name,
                                                    (!order.tourist_id.is_nil())
                                                        .then_some(order.tourist_id),
                                                    (!order.guide_id.is_nil())
                                                        .then_some(order.guide_id),
                                                    chain_off::order_state_to_str(order.state),
                                                    esc.as_deref(),
                                                )
                                                .await
                                            {
                                                return (
                                                    StatusCode::INTERNAL_SERVER_ERROR,
                                                    Json(crate::api_json::err_key_detail(
                                                        "upsert_orders_projection_chain_snapshot_failed",
                                                        e.to_string(),
                                                    )),
                                                )
                                                    .into_response();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let mut investor_share_transfer_events_new = 0u32;
    let share_tokens: Vec<String> = config
        .investor_share_token_addresses
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if !share_tokens.is_empty() {
        if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
            match chain::indexer::fetch_erc20_transfer_logs_for_tokens(
                &config.rpc_url,
                &share_tokens,
                from_block,
                to_block,
            )
            .await
            {
                Ok(fetched) => {
                    let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                    for ev in fetched {
                        let token_n = normalize_hex_addr(&ev.token_address);
                        let from_n = normalize_hex_addr(&ev.from_address);
                        let to_n = normalize_hex_addr(&ev.to_address);
                        match db::insert_investor_share_transfer_event(
                            pool,
                            chain_id_i64,
                            ev.block_number as i64,
                            ev.log_index as i32,
                            &ev.block_hash,
                            &ev.tx_hash,
                            &token_n,
                            &from_n,
                            &to_n,
                            &ev.value_u256_hex,
                        )
                        .await
                        {
                            Ok(n) if n > 0 => investor_share_transfer_events_new += 1,
                            Ok(_) => {}
                            Err(e) => {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_investor_share_transfer_event_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response();
                            }
                        }
                    }
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("investor_share_tokens: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "investor_share_tokens",
                        "addresses": share_tokens.len(),
                        "error": e
                    }));
                }
            }
        }
    }
    if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
        let g = indexer_handle.read().await;
        let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
        if let Err(e) = db::upsert_indexer_checkpoint(
            pool,
            db::INDEXER_CHECKPOINT_CONSUMER_ID,
            chain_id_i64,
            g.last_block as i64,
            g.last_log_index as i32,
        )
        .await
        {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "upsert_indexer_checkpoint_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    }
    // 48 §12.3：tick 后落盘运行时 indexer 状态（路径 = INDEXER_STATE_PATH + ".runtime"）
    let runtime_path_str = format!("{}.runtime", state.indexer_state_path);
    let runtime_path = Path::new(&runtime_path_str);
    let guard = indexer_handle.read().await;
    if let Err(e) = chain::indexer::persist_indexer_state(runtime_path, &guard) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "persist_indexer_state_failed",
                e.to_string(),
            )),
        )
            .into_response();
    }
    let mut body = json!({
        "status": "ok",
        "events_applied": applied,
        "events_new": events_new,
        "investor_share_transfer_events_new": investor_share_transfer_events_new,
        "from_block": from_block,
        "to_block": to_block,
        "chain_tip": latest,
        "finality_n": state.finality_n
    });
    if let Some(rew) = reorg_auto_rewind {
        body["reorg_auto_rewind"] = rew;
    }
    if !logs_fetch_skipped.is_empty() {
        body["logs_fetch_skipped"] = json!(logs_fetch_skipped);
    }
    attach_meta_build_to_tick_ok_body(&mut body);
    (StatusCode::OK, Json(body)).into_response()
}

#[derive(Debug, Deserialize, Default)]
pub struct IndexerReplayBody {
    /// 缺省为当前 `chain_config.chain_id`
    #[serde(default)]
    pub chain_id: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct IndexerReorgRewindBody {
    /// **含端点**：删除 **`event_log` / fee_router** 中 `block_number >= rewind_from_block`；**`orders_projection`** 按链清空后 **`replay_orders_projection_from_event_log`**。
    pub rewind_from_block: u64,
    /// 为 true 时**不**要求「当前链上 `eth_getBlockByNumber(indexer.last_block)` 与内存 `last_block_hash` 不一致」，亦不校验 `rewind_from_block == last_block`。
    #[serde(default)]
    pub force: bool,
}

/// **110 / 140**：与 **`GET …/internal/indexer-status`** 成功体同源，便于 tick 单段 JSON 与 **`GET /meta.build`** 对齐（CI 锚点 **`INDEXER_TICK_RESPONSE_META_BUILD`**）。
fn attach_meta_build_to_tick_ok_body(body: &mut serde_json::Value) {
    if let Some(obj) = body.as_object_mut() {
        obj.insert(
            "meta".to_string(),
            json!({
                "build": crate::routes::health_meta::meta_build_value()
            }),
        );
    }
}

fn indexer_reorg_auto_rewind_on_tick_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_AUTO_REWIND_ON_TICK").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

/// `INDEXER_STRICT_SUPPLEMENTAL_LOG_FETCH=1`：**escrow 实例列表** / **FeeRouter** / **RegionVault** 的补充 `eth_getLogs` 任一步失败则 **500** **`fetch_supplemental_logs_failed`**（默认仍 **200** 并在体中附 **`logs_fetch_skipped`**）。
fn indexer_strict_supplemental_log_fetch_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_STRICT_SUPPLEMENTAL_LOG_FETCH").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

fn indexer_reorg_skip_chain_off_order_reload() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND").as_deref(),
        Ok(v) if v.trim() == "0"
    )
}

fn indexer_reorg_sync_orders_from_projection_after_rewind_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

fn indexer_reorg_clear_terminal_orphan_escrow_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

struct ReorgRewindExecuteOutcome {
    deleted_event_log: u64,
    deleted_fee_router: u64,
    deleted_region_vault: u64,
    deleted_investor_share: u64,
    deleted_orders_projection: u64,
    last_block: u64,
    last_log_index: u32,
    last_block_hash: String,
    replay_stats: Value,
    /// **`null`** 当跳过或未挂载 **chain_off**；否则 **`db_orders_loaded`** / **`memory_only_orders_preserved`**
    chain_off_orders_reload: Value,
    /// **`null`** 当未设 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1`**；否则 **`SyncOrdersFromProjectionSummary`**
    orders_table_projection_sync: Value,
}

/// DB 删尾 + 内存 checkpoint 回退 + checkpoint 表 + `.runtime` 落盘 + **`orders_projection`** replay（与 **`indexer_reorg_rewind`** 同源）。
async fn perform_indexer_reorg_rewind_execute(
    state: &ApiMetaState,
    config: &chain::ChainConfig,
    indexer_handle: &chain::indexer::IndexerStateHandle,
    pool: &PgPool,
    rewind_from_block: u64,
) -> Result<ReorgRewindExecuteOutcome, (StatusCode, Value)> {
    let chain_id = config.chain_id;
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    let rewind_i64 = rewind_from_block.min(i64::MAX as u64) as i64;

    let ev_deleted = match db::delete_event_log_from_block(pool, chain_id_i64, rewind_i64).await {
        Ok(n) => n,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("delete_event_log_failed", e.to_string()),
            ));
        }
    };
    let fr_deleted = match db::delete_fee_router_routed_events_from_block(
        pool,
        chain_id_i64,
        rewind_i64,
    )
    .await
    {
        Ok(n) => n,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail(
                    "delete_fee_router_routed_events_failed",
                    e.to_string(),
                ),
            ));
        }
    };
    let rv_deleted =
        match db::delete_region_vault_forwarded_events_from_block(pool, chain_id_i64, rewind_i64)
            .await
        {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_region_vault_forwarded_events_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let inv_deleted =
        match db::delete_investor_share_transfer_events_from_block(pool, chain_id_i64, rewind_i64)
            .await
        {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_investor_share_transfer_events_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let proj_deleted = match db::delete_orders_projection_for_chain(pool, chain_id_i64).await {
        Ok(n) => n,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("delete_orders_projection_failed", e.to_string()),
            ));
        }
    };

    {
        let mut g = indexer_handle.write().await;
        g.events.retain(|e| e.block_number < rewind_from_block);
        if let Some(last_ev) = g
            .events
            .iter()
            .max_by_key(|e| (e.block_number, e.log_index))
            .cloned()
        {
            g.last_block = last_ev.block_number;
            g.last_log_index = last_ev.log_index;
            g.last_block_hash = last_ev.block_hash;
        } else {
            g.last_block = 0;
            g.last_log_index = 0;
            g.last_block_hash.clear();
        }
    }

    let (nb, nli, nh) = {
        let g = indexer_handle.read().await;
        (g.last_block, g.last_log_index, g.last_block_hash.clone())
    };

    if let Err(e) = db::upsert_indexer_checkpoint(
        pool,
        db::INDEXER_CHECKPOINT_CONSUMER_ID,
        chain_id_i64,
        nb as i64,
        nli as i32,
    )
    .await
    {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            crate::api_json::err_key_detail("upsert_indexer_checkpoint_failed", e.to_string()),
        ));
    }

    let runtime_path_str = format!("{}.runtime", state.indexer_state_path);
    let runtime_path = Path::new(&runtime_path_str);
    {
        let guard = indexer_handle.read().await;
        if let Err(e) = chain::indexer::persist_indexer_state(runtime_path, &guard) {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("persist_indexer_state_failed", e.to_string()),
            ));
        }
    }

    let replay = match chain_off::replay_orders_projection_from_event_log(pool, chain_id_i64).await
    {
        Ok(s) => s,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("replay_orders_projection_failed", e.to_string()),
            ));
        }
    };
    let replay_stats = serde_json::to_value(&replay).unwrap_or_else(|_| json!({}));

    let mut orders_table_projection_sync = Value::Null;
    if indexer_reorg_sync_orders_from_projection_after_rewind_enabled() {
        match db::sync_orders_from_projection_for_chain(
            pool,
            chain_id_i64,
            indexer_reorg_clear_terminal_orphan_escrow_enabled(),
        )
        .await
        {
            Ok(s) => {
                orders_table_projection_sync =
                    serde_json::to_value(&s).unwrap_or_else(|_| json!({}));
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "sync_orders_from_projection_after_rewind_failed",
                        e.to_string(),
                    ),
                ));
            }
        }
    }

    let mut chain_off_orders_reload = Value::Null;
    if !indexer_reorg_skip_chain_off_order_reload() {
        if let Some(co) = state.chain_off.as_ref() {
            let mut g = co.store.write().await;
            match chain_off::reload_orders_from_db_into_store(pool, &mut g).await {
                Ok(s) => {
                    chain_off_orders_reload =
                        serde_json::to_value(&s).unwrap_or_else(|_| json!({}));
                }
                Err(e) => {
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        crate::api_json::err_key_detail(
                            "reload_chain_off_orders_from_db_failed",
                            e.to_string(),
                        ),
                    ));
                }
            }
        }
    }

    Ok(ReorgRewindExecuteOutcome {
        deleted_event_log: ev_deleted,
        deleted_fee_router: fr_deleted,
        deleted_region_vault: rv_deleted,
        deleted_investor_share: inv_deleted,
        deleted_orders_projection: proj_deleted,
        last_block: nb,
        last_log_index: nli,
        last_block_hash: nh,
        replay_stats,
        chain_off_orders_reload,
        orders_table_projection_sync,
    })
}

#[derive(Debug, Deserialize, Default)]
pub struct IndexerReconcileBody {
    #[serde(default)]
    pub chain_id: Option<u64>,
    /// 为 true 时追加写入 **`reconciliation_reports`**（`report_type`=`orders_projection_vs_orders`）
    #[serde(default)]
    pub persist: bool,
    /// 1～10：对已填 escrow 的订单抽样 **`chain::get_escrow_status`**（须 **RPC + ESCROW_FACTORY_ADDRESS**）；未设或 0 表示不拉链上读数
    #[serde(default)]
    pub rpc_escrow_samples: Option<u8>,
    /// **`true`** 时在对账 **`200`** 成功后执行 **`db::backfill_orders_chain_id_from_projection`**（仅 **`orders.chain_id IS NULL`**；**110 §3.1.4**）
    #[serde(default)]
    pub backfill_orders_chain_id: bool,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`orders_chain_scope_rollback_dry_run`**（**`db::orders_chain_scope_rollback_dry_run`**；只读计数，锚 **`110-ORDERS-CHAIN-SCOPE-DRY-RUN`**；**110 §3.1.4** 向 **Target** 前置）
    #[serde(default)]
    pub orders_chain_scope_rollback_dry_run: bool,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1`**、**`orders_chain_scope_rollback_confirm`** 与 **`db::orders_chain_scope_rollback_expected_confirm(chain_id)`** 一致时，在对账 **`200`** 成功后执行 **`db::orders_chain_scope_rollback_execute`**（**`110-ORDERS-CHAIN-SCOPE-EXECUTE`**；**仅**删 **`orders.chain_id`** 匹配行；**110 §3.1.4** **Partial**）
    #[serde(default)]
    pub orders_chain_scope_rollback_execute: bool,
    /// 须精确等于 **`CONFIRM_DELETE_ORDERS_CHAIN_<chain_id>`**（**`chain_id`** 为本次 reconcile 解析值，含 body 覆盖）
    #[serde(default)]
    pub orders_chain_scope_rollback_confirm: Option<String>,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`event_log_chain_scope_rollback_dry_run`**（**`db::event_log_chain_scope_rollback_dry_run`**；**110 §3.1.4** **Partial**）
    #[serde(default)]
    pub event_log_chain_scope_rollback_dry_run: bool,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1`**、**`event_log_chain_scope_rollback_confirm`** = **`CONFIRM_DELETE_EVENT_LOG_CHAIN_<chain_id>`** 时执行 **`db::event_log_chain_scope_rollback_execute`**（锚 **`110-EVENT-LOG-CHAIN-SCOPE-EXECUTE`**；**不**重置进程内 indexer 内存 checkpoint）
    #[serde(default)]
    pub event_log_chain_scope_rollback_execute: bool,
    #[serde(default)]
    pub event_log_chain_scope_rollback_confirm: Option<String>,
    /// **`true`** 时在对账 **`200`** 成功后附加 **`correction_executor_chain_scope_rollback_dry_run`**（**`db::correction_executor_chain_scope_rollback_dry_run`**；**110 §3.1.4** **Partial**）
    #[serde(default)]
    pub correction_executor_chain_scope_rollback_dry_run: bool,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1`**、**`correction_executor_chain_scope_rollback_confirm`** = **`CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_<chain_id>`** 时执行 **`db::correction_executor_chain_scope_rollback_execute`**（锚 **`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-EXECUTE`**）
    #[serde(default)]
    pub correction_executor_chain_scope_rollback_execute: bool,
    #[serde(default)]
    pub correction_executor_chain_scope_rollback_confirm: Option<String>,
    /// **`true`** 且 **ENV `TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1`** 时，在对账 **`200`** 成功后按 **`checkpoints_sharded`**（**`INDEXER_CHECKPOINT_CONSUMER_ID`**）对齐进程内 **`IndexerState`** 并落盘 **`.runtime`**（锚 **`110-INDEXER-MEMORY-SYNC-FROM-DB`**；无 DB 行时等价归零内存缓存事件）
    #[serde(default)]
    pub sync_indexer_memory_from_db_checkpoint: bool,
    /// **`true`** 时在 **`200`** 响应与 **`persist`** 之 **`summary`** 附加 **`chain_observation`**（单次 **`eth_blockNumber`** + **`finality_n_used`** + **`indexer_finalized_upper_bound`**；锚 **`110-RECONCILE-CHAIN-TIP`**；RPC 失败时 **`ok:false`**+**`error`**，**不**影响对账 **`200`**）
    #[serde(default)]
    pub include_chain_tip: bool,
    /// **`true`** 时在 **`200`** 与 **`persist` `summary`** 附加 **`event_log_escrow_coverage`**（**`110-EVENT-LOG-ESCROW-COVERAGE`**；**DB 已索引** **`event_log`** Escrow 类行、**`EscrowCreated`** 去重地址、**`orders_projection`** 行与去重 **`escrow_address`**；**不**等同全链扫 **Target**）
    #[serde(default)]
    pub include_event_log_escrow_coverage: bool,
    /// **1～20**：**`fee_router_routed_events`** 降序抽样，**`eth_getTransactionReceipt`** 与 DB 投影逐字段比对 **`PlatformFeeRouted`**（**B-081**）；**`0`** 或未设表示不执行
    #[serde(default)]
    pub verify_fee_router_events_rpc: Option<u8>,
    /// **1～20**：**`region_vault_forwarded_events`** 降序抽样，receipt 解码 **`RegionVaultForwarded`** 与 DB 一致；**单交易块**时校验 **`to`** 的 **ERC20** 余额 **块末−块前** = **`amount`**（**B-082**）；**`0`** 或未设表示不执行
    #[serde(default)]
    pub verify_region_vault_events_rpc: Option<u8>,
}

fn terminal_escrow_label_for_reconcile(s: &chain::EscrowChainStatus) -> Option<&'static str> {
    match s {
        chain::EscrowChainStatus::Completed => Some("Completed"),
        chain::EscrowChainStatus::Refunded => Some("Refunded"),
        chain::EscrowChainStatus::Resolved => Some("Resolved"),
        _ => None,
    }
}

fn escrow_chain_status_label(s: &chain::EscrowChainStatus) -> &'static str {
    match s {
        chain::EscrowChainStatus::None => "None",
        chain::EscrowChainStatus::Created => "Created",
        chain::EscrowChainStatus::Funded => "Funded",
        chain::EscrowChainStatus::Completed => "Completed",
        chain::EscrowChainStatus::Refunded => "Refunded",
        chain::EscrowChainStatus::Disputed => "Disputed",
        chain::EscrowChainStatus::Resolved => "Resolved",
    }
}

/// 抽样对 **`orders`（有 escrow 地址）** 调 RPC **`get_escrow_status`**，附 **`chain_escrow`**（如 **Funded**）
/// 与 **`orders.status`** 粗粒度 **`coarse_terminal_aligned`**。与 **`reconcile_orders_projection_vs_orders`**
///（**`orders`↔`orders_projection`** 投影一致性）维度不同；口径见 **110 §3.1.3**。
async fn collect_rpc_escrow_reconcile_samples(
    cfg: &chain::ChainConfig,
    pool: &PgPool,
    raw_limit: u8,
) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let lim = (raw_limit as i64).clamp(1, 10);
    let rows = db::list_orders_with_escrow_id_status_limit(pool, lim).await?;
    let mut out = Vec::new();
    for row in rows {
        let id = row.id;
        let status_str = row.status;
        let bytes = db::order_uuid_to_projection_order_id(id);
        let db_state = chain_off::str_to_order_state(&status_str)
            .unwrap_or(traveltrust_core::OrderState::Created);
        let mut sample = json!({
            "order_id": id.to_string(),
            "orders_status": status_str,
        });
        match chain::get_escrow_status(cfg, bytes).await {
            Ok(Some(st)) => {
                sample["chain_escrow"] = json!(escrow_chain_status_label(&st));
                let cs = terminal_escrow_label_for_reconcile(&st);
                sample["coarse_terminal_aligned"] =
                    json!(chain_off::reconcile_order_chain_vs_db(cs, &db_state).unwrap_or(false));
            }
            Ok(None) => {
                sample["chain_escrow"] = serde_json::Value::Null;
                sample["coarse_terminal_aligned"] =
                    json!(chain_off::reconcile_order_chain_vs_db(None, &db_state).unwrap_or(false));
            }
            Err(e) => {
                sample["rpc_error"] = json!(e);
                sample["coarse_terminal_aligned"] = json!(false);
            }
        }
        out.push(sample);
    }
    Ok(out)
}

/// **`fee_router_routed_events`** 抽样与 **`eth_getTransactionReceipt`** 解码 **`PlatformFeeRouted`** 逐字段比对（**B-081**）。
async fn collect_fee_router_log_verify(
    cfg: &chain::ChainConfig,
    pool: &PgPool,
    chain_id_i64: i64,
    raw_limit: u8,
) -> Result<serde_json::Value, sqlx::Error> {
    let lim_req = raw_limit;
    let lim = (raw_limit as usize).clamp(1, 20);
    let topic0 = chain::fee_router_verify::platform_fee_routed_topic0_hex();
    let router_opt = cfg
        .fee_router_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let Some(ref router) = router_opt else {
        return Ok(json!({
            "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
            "skipped": "fee_router_address_not_configured",
            "sample_limit_requested": lim_req,
            "sample_limit_applied": lim,
            "samples_returned": 0,
            "samples": [],
        }));
    };

    let (rows, _) =
        db::list_fee_router_routed_events(pool, Some(chain_id_i64), None, None, lim).await?;

    let mut recipients_val = serde_json::Value::Null;
    let mut recipients_err: Option<String> = None;
    match chain::fee_router_verify::read_fee_router_recipients(cfg.rpc_url.trim(), router).await {
        Ok(r) => recipients_val = r,
        Err(e) => recipients_err = Some(e),
    }

    let mut samples: Vec<serde_json::Value> = Vec::new();
    for row in &rows {
        let v = chain::fee_router_verify::verify_fee_router_row_vs_chain(cfg, row, router, &topic0)
            .await;
        samples.push(v);
    }

    let all_ok = !samples.is_empty() && samples.iter().all(|s| s.get("ok") == Some(&json!(true)));
    let mut out = json!({
        "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
        "sample_limit_requested": lim_req,
        "sample_limit_applied": lim,
        "samples_returned": samples.len(),
        "fee_router_projection_rows_fetched": rows.len(),
        "samples": samples,
        "log_verify_clean": all_ok,
        "fee_router_recipients_on_chain": recipients_val,
    });
    if rows.is_empty() {
        out["log_verify_clean"] = serde_json::Value::Null;
        out["no_fee_router_rows"] = json!(true);
    }
    if let Some(e) = recipients_err {
        out["fee_router_recipients_error"] = json!(e);
    }
    Ok(out)
}

/// **`region_vault_forwarded_events`** 抽样与 receipt **`RegionVaultForwarded`** + 余额闭环（**B-082**）。
async fn collect_region_vault_log_verify(
    cfg: &chain::ChainConfig,
    pool: &PgPool,
    chain_id_i64: i64,
    raw_limit: u8,
) -> Result<serde_json::Value, sqlx::Error> {
    let lim_req = raw_limit;
    let lim = (raw_limit as usize).clamp(1, 20);
    let topic0 = chain::region_vault_verify::region_vault_forwarded_topic0_hex();
    let vault_opt = cfg
        .region_vault_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let Some(ref vault) = vault_opt else {
        return Ok(json!({
            "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
            "skipped": "region_vault_address_not_configured",
            "sample_limit_requested": lim_req,
            "sample_limit_applied": lim,
            "samples_returned": 0,
            "samples": [],
        }));
    };

    let (rows, _) =
        db::list_region_vault_forwarded_events(pool, Some(chain_id_i64), None, None, lim).await?;

    let mut samples: Vec<serde_json::Value> = Vec::new();
    for row in &rows {
        let v =
            chain::region_vault_verify::verify_region_vault_row_vs_chain(cfg, row, vault, &topic0)
                .await;
        samples.push(v);
    }

    let all_ok = !samples.is_empty() && samples.iter().all(|s| s.get("ok") == Some(&json!(true)));
    let mut out = json!({
        "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
        "sample_limit_requested": lim_req,
        "sample_limit_applied": lim,
        "samples_returned": samples.len(),
        "region_vault_projection_rows_fetched": rows.len(),
        "samples": samples,
        "log_verify_clean": all_ok,
    });
    if rows.is_empty() {
        out["log_verify_clean"] = serde_json::Value::Null;
        out["no_region_vault_rows"] = json!(true);
    }
    Ok(out)
}

/// POST /api/v1/internal/indexer-replay：按 `event_log` 重放 **`orders_projection`**（110 §补全、04 §7.6）。
/// 须 **chain_off.db_pool**；body 可选 `{ "chain_id": <u64> }`。
pub async fn indexer_replay(
    State(state): State<ApiMetaState>,
    body: Option<Json<IndexerReplayBody>>,
) -> impl IntoResponse {
    let Some(config) = state.chain_config.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"
            })),
        )
            .into_response();
    };
    if state.indexer_state.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "indexer state not initialized"
            })),
        )
            .into_response();
    }
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required_for_replay",
                "message": "database_required_for_replay",
                "hint": "chain_off with DATABASE_URL required to replay event_log into orders_projection"
            })),
        )
            .into_response();
    };
    let chain_id = body.and_then(|j| j.0.chain_id).unwrap_or(config.chain_id);
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    match chain_off::replay_orders_projection_from_event_log(pool, chain_id_i64).await {
        Ok(stats) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "task": "indexer_replay_orders_projection",
                "chain_id": chain_id,
                "checkpoint": {
                    "block_number": state.indexer_checkpoint.block_number,
                    "log_index": state.indexer_checkpoint.log_index
                },
                "finality_n": state.finality_n,
                "stats": stats,
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "replay_orders_projection_failed",
                e.to_string(),
            )),
        )
            .into_response(),
    }
}

/// POST /api/v1/internal/indexer-reorg-rewind：**reorg / 坏尾** 机读回滚 + **`orders_projection`** 重建（110 §3.1.3 **Partial**，向 **Target** 靠拢）。
/// 须 **chain_config + indexer_state + chain_off.db_pool**；**`force:false`** 时须 **`reorg_detected(last_block)`** 且 **`rewind_from_block == indexer.last_block`**（与 **`reorg_suspected`** 响应 **`block_number`** 对齐）。
/// 成功后默认 **`reload_orders_from_db_into_store`**（**`INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND=0`** 跳过）使 **chain_off** 内 **`orders`/`guide_slot`** 与 **`orders`** 表对齐。
/// 可选 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1`**：replay 后 **`sync_orders_from_projection_for_chain`** 将 **`orders`**（已填 **`escrow_address`**）与 **`orders_projection`** 对齐（响应 **`orders_table_projection_sync`**）。
/// 另可选 **`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`**：无投影时对 **completed/disputed/refunded/partially_refunded/slashed/cancelled** 亦清孤立 **`escrow_address`**（**`cleared_orphan_escrow_terminal_no_projection`**）。
///
/// **局限**：默认**不**改写 **`orders`**；开启 env 亦为 **Partial**（候选左集 + **`escrowed`+无投影** 降级 + pre_funded/可选终态清列）；全量链级 **`orders`** 回滚仍为 **Target** / 人工。
pub async fn indexer_reorg_rewind(
    State(state): State<ApiMetaState>,
    Json(body): Json<IndexerReorgRewindBody>,
) -> impl IntoResponse {
    let Some(config) = state.chain_config.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"
            })),
        )
            .into_response();
    };
    let Some(indexer_handle) = state.indexer_state.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "indexer state not initialized"
            })),
        )
            .into_response();
    };
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required_for_reorg_rewind",
                "message": "database_required_for_reorg_rewind",
                "hint": "chain_off with DATABASE_URL required"
            })),
        )
            .into_response();
    };

    if body.rewind_from_block < 1 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("rewind_from_block must be >= 1")),
        )
            .into_response();
    }

    let chain_id = config.chain_id;

    let (last_block, last_hash) = {
        let g = indexer_handle.read().await;
        (g.last_block, g.last_block_hash.clone())
    };

    if last_block == 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "nothing_to_rewind: indexer last_block is 0",
            )),
        )
            .into_response();
    }

    if body.rewind_from_block > last_block {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "rewind_from_block_after_indexer_tip",
                format!(
                    "rewind_from_block={} indexer.last_block={}",
                    body.rewind_from_block, last_block
                ),
            )),
        )
            .into_response();
    }

    if !body.force {
        if body.rewind_from_block != last_block {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "rewind_from_block_must_equal_last_block_when_not_force",
                    format!(
                        "expected rewind_from_block={}, got {}",
                        last_block, body.rewind_from_block
                    ),
                )),
            )
                .into_response();
        }
        match chain::indexer::get_block_hash_at(&config.rpc_url, last_block).await {
            Ok(chain_hash) => {
                if !chain::indexer::reorg_detected(&last_hash, &chain_hash) {
                    return (
                        StatusCode::CONFLICT,
                        Json(crate::api_json::err_key_detail(
                            "reorg_not_detected",
                            "chain hash matches stored last_block_hash; use force:true only if you intend an administrative rewind",
                        )),
                    )
                        .into_response();
                }
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "get_block_hash_at_failed",
                        e,
                    )),
                )
                    .into_response();
            }
        }
    }

    let outcome = match perform_indexer_reorg_rewind_execute(
        &state,
        config,
        indexer_handle,
        pool,
        body.rewind_from_block,
    )
    .await
    {
        Ok(o) => o,
        Err((sc, j)) => return (sc, Json(j)).into_response(),
    };

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "task": "indexer_reorg_rewind",
            "chain_id": chain_id,
            "rewind_from_block": body.rewind_from_block,
            "force": body.force,
            "deleted": {
                "event_log_rows": outcome.deleted_event_log,
                "fee_router_routed_events_rows": outcome.deleted_fee_router,
                "region_vault_forwarded_events_rows": outcome.deleted_region_vault,
                "investor_share_transfer_events_rows": outcome.deleted_investor_share,
                "orders_projection_rows": outcome.deleted_orders_projection,
            },
            "indexer_after": {
                "last_block": outcome.last_block,
                "last_log_index": outcome.last_log_index,
                "last_block_hash": outcome.last_block_hash,
            },
            "replay_stats": outcome.replay_stats,
            "chain_off_orders_reload": outcome.chain_off_orders_reload,
            "orders_table_projection_sync": outcome.orders_table_projection_sync,
            "limitations": [
                "orders business table: default rewind does not rewrite orders; optional INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1 aligns orders to replayed orders_projection (candidate union: non-empty escrow_address ∪ order_ids present in projection for this chain; summary: chain_id, clear_terminal_orphan_escrow_enabled, candidates_total, skipped_no_order_row, cleared_orphan_escrow_pre_funded, cleared_orphan_escrow_terminal_no_projection when INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1, skipped_no_projection_non_escrowed_with_escrow, etc.); demotes escrowed→accepted+clear escrow when projection row absent; clears escrow_address for draft/created/accepted+no projection; completed/disputed/refund-like+escrow+no projection: default skip (manual) unless INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1; full chain-level rollback remains Target (see 110 §3.1.4)",
                "orders.chain_id exists (nullable BIGINT; migration 20260416000045; new rows stamped from CHAIN_ID / CHAIN_RPC_URL default 137 via ChainOffConfig.business_chain_id; upsert COALESCE keeps first non-null): automated DELETE/rewrite of every business row scoped to one chain remains Target until optional-chain rows are backfilled/gated + dry-run internal API + 01/03 review; sync_orders_from_projection_for_chain still uses candidate union only",
                "chain_off in-memory orders map is reloaded from DB after replay when chain_off is mounted and INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND is not 0; memory-only orders absent from DB are preserved; guide_slot is rebuilt from merged map",
                "orders_projection for the chain was fully cleared then rebuilt from remaining event_log only"
            ],
        })),
    )
        .into_response()
}

/// POST /api/v1/internal/indexer-reconcile：只读对账 **`orders`（已填 escrow）↔ `orders_projection`**（110/200、04 §7.6）。
/// 须 **chain_off.db_pool**；可选 body 含 **`orders_chain_scope_*`** / **`event_log_chain_scope_*`** / **`correction_executor_chain_scope_*`**（**dry-run** 只读计数；**execute** 须 **独立 ENV** + **confirm**，见 **110 §3.1.4**）。
pub async fn indexer_reconcile(
    State(state): State<ApiMetaState>,
    body: Option<Json<IndexerReconcileBody>>,
) -> impl IntoResponse {
    let Some(config) = state.chain_config.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"
            })),
        )
            .into_response();
    };
    if state.indexer_state.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "indexer state not initialized"
            })),
        )
            .into_response();
    }
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required_for_reconcile",
                "message": "database_required_for_reconcile",
                "hint": "chain_off with DATABASE_URL required for orders vs orders_projection reconcile"
            })),
        )
            .into_response();
    };
    let persist = body.as_ref().is_some_and(|j| j.0.persist);
    let chain_id = body
        .as_ref()
        .and_then(|j| j.0.chain_id)
        .unwrap_or(config.chain_id);
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    match db::reconcile_orders_projection_vs_orders(pool, chain_id_i64).await {
        Ok(stats) => {
            let want_rpc = body
                .as_ref()
                .and_then(|j| j.0.rpc_escrow_samples)
                .filter(|n| *n > 0);
            let mut rpc_samples: Option<Vec<serde_json::Value>> = None;
            let mut rpc_skip: Option<&'static str> = None;
            let mut rpc_sample_meta: Option<Value> = None;
            if let Some(n_req) = want_rpc {
                let orders_escrow_total = match db::count_orders_with_escrow_address(pool).await {
                    Ok(t) => t,
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "rpc_escrow_sample_meta_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                };
                let lim_applied = (n_req as i64).clamp(1, 10);
                let factory_ok = config
                    .escrow_factory_address
                    .as_ref()
                    .map(|s| !s.trim().is_empty())
                    .unwrap_or(false);
                if config.is_configured() && factory_ok {
                    match collect_rpc_escrow_reconcile_samples(config, pool, n_req).await {
                        Ok(v) => {
                            rpc_sample_meta = Some(json!({
                                "anchor": "110-RPC-ESCROW-SAMPLE-META",
                                "orders_with_escrow_address_total": orders_escrow_total,
                                "sample_limit_requested": n_req,
                                "sample_limit_applied": lim_applied,
                                "samples_returned": v.len() as i64,
                            }));
                            rpc_samples = Some(v);
                        }
                        Err(e) => {
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key_detail(
                                    "rpc_escrow_samples_failed",
                                    e.to_string(),
                                )),
                            )
                                .into_response();
                        }
                    }
                } else {
                    rpc_skip = Some("escrow_factory_or_rpc_not_configured");
                    rpc_sample_meta = Some(json!({
                        "anchor": "110-RPC-ESCROW-SAMPLE-META",
                        "orders_with_escrow_address_total": orders_escrow_total,
                        "sample_limit_requested": n_req,
                        "sample_limit_applied": lim_applied,
                        "samples_returned": 0_i64,
                    }));
                }
            }

            let economic_projection_row_counts =
                economic_projection_row_counts_for_chain(pool, chain_id_i64).await;

            let chain_observation: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_chain_tip)
            {
                Some(
                    match chain::indexer::get_latest_block(config.rpc_url.trim()).await {
                        Ok(tip) => json!({
                            "ok": true,
                            "anchor": "110-RECONCILE-CHAIN-TIP",
                            "eth_chain_tip_block_number": tip,
                            "finality_n_used": state.finality_n,
                            "indexer_finalized_upper_bound": chain::indexer::indexer_finalized_upper_bound(tip, state.finality_n),
                        }),
                        Err(e) => json!({
                            "ok": false,
                            "anchor": "110-RECONCILE-CHAIN-TIP",
                            "error": e,
                        }),
                    },
                )
            } else {
                None
            };

            let event_log_escrow_coverage: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_event_log_escrow_coverage)
            {
                match db::event_log_escrow_coverage_stats(pool, chain_id_i64).await {
                    Ok(st) => Some(json!({
                        "anchor": "110-EVENT-LOG-ESCROW-COVERAGE",
                        "chain_id": st.chain_id,
                        "escrow_class_event_rows": st.escrow_class_event_rows,
                        "escrow_created_rows": st.escrow_created_rows,
                        "distinct_escrow_address_from_escrow_created": st.distinct_escrow_address_from_escrow_created,
                        "orders_projection_rows": st.orders_projection_rows,
                        "orders_projection_distinct_escrow_non_null": st.orders_projection_distinct_escrow_non_null,
                    })),
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "event_log_escrow_coverage_stats_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

            let fee_router_log_verify: Option<Value> = if let Some(n) = body
                .as_ref()
                .and_then(|j| j.0.verify_fee_router_events_rpc)
                .filter(|x| *x > 0)
            {
                match collect_fee_router_log_verify(config, pool, chain_id_i64, n).await {
                    Ok(v) => Some(v),
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fee_router_log_verify_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

            let region_vault_log_verify: Option<Value> = if let Some(n) = body
                .as_ref()
                .and_then(|j| j.0.verify_region_vault_events_rpc)
                .filter(|x| *x > 0)
            {
                match collect_region_vault_log_verify(config, pool, chain_id_i64, n).await {
                    Ok(v) => Some(v),
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "region_vault_log_verify_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

            let mut summary = json!({
                "task": "indexer_reconcile_orders_projection",
                "stats": &stats,
                "checkpoint": {
                    "block_number": state.indexer_checkpoint.block_number,
                    "log_index": state.indexer_checkpoint.log_index
                },
                "reorg_detected": state.reorg_detected,
                "finality_n": state.finality_n,
                "chain_id": chain_id,
            });
            if let Some(ref s) = rpc_samples {
                summary["rpc_escrow_samples"] = json!(s);
            }
            if let Some(s) = rpc_skip {
                summary["rpc_escrow_samples_skipped"] = json!(s);
            }
            if let Some(ref m) = rpc_sample_meta {
                summary["rpc_escrow_sample_meta"] = m.clone();
            }
            if let Some(ref c) = economic_projection_row_counts {
                summary["economic_projection_row_counts"] = c.clone();
            }
            if let Some(ref co) = chain_observation {
                summary["chain_observation"] = co.clone();
            }
            if let Some(ref ev) = event_log_escrow_coverage {
                summary["event_log_escrow_coverage"] = ev.clone();
            }
            if let Some(ref fr) = fee_router_log_verify {
                summary["fee_router_log_verify"] = fr.clone();
            }
            if let Some(ref rv) = region_vault_log_verify {
                summary["region_vault_log_verify"] = rv.clone();
            }

            let report_id = if persist {
                match db::insert_reconciliation_report(
                    pool,
                    db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
                    Some(chain_id_i64),
                    &summary,
                )
                .await
                {
                    Ok(id) => Some(id),
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "persist_reconciliation_report_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

            let mut resp_body = json!({
                "status": "ok",
                "task": "indexer_reconcile_orders_projection",
                "chain_id": chain_id,
                "checkpoint": {
                    "block_number": state.indexer_checkpoint.block_number,
                    "log_index": state.indexer_checkpoint.log_index
                },
                "reorg_detected": state.reorg_detected,
                "issues_total": stats.issues_total,
                "projection_reconcile_clean": stats.projection_reconcile_clean,
                "stats": stats,
                "report_id": report_id.map(|id| id.to_string()),
            });
            if let Some(s) = rpc_samples {
                resp_body["rpc_escrow_samples"] = json!(s);
            }
            if let Some(s) = rpc_skip {
                resp_body["rpc_escrow_samples_skipped"] = json!(s);
            }
            if let Some(m) = rpc_sample_meta {
                resp_body["rpc_escrow_sample_meta"] = m;
            }
            if let Some(c) = economic_projection_row_counts {
                resp_body["economic_projection_row_counts"] = c;
            }
            if let Some(co) = chain_observation {
                resp_body["chain_observation"] = co;
            }
            if let Some(ev) = event_log_escrow_coverage {
                resp_body["event_log_escrow_coverage"] = ev;
            }
            if let Some(fr) = fee_router_log_verify {
                resp_body["fee_router_log_verify"] = fr;
            }
            if let Some(rv) = region_vault_log_verify {
                resp_body["region_vault_log_verify"] = rv;
            }
            if body.as_ref().is_some_and(|j| j.0.backfill_orders_chain_id) {
                match db::backfill_orders_chain_id_from_projection(pool, chain_id_i64).await {
                    Ok(n) => {
                        resp_body["orders_chain_id_backfill"] = json!({
                            "chain_id": chain_id,
                            "updated_rows": n
                        });
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "backfill_orders_chain_id_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.orders_chain_scope_rollback_dry_run)
            {
                match db::orders_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
                    Ok(d) => {
                        let mut v = serde_json::to_value(&d).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-ORDERS-CHAIN-SCOPE-DRY-RUN"),
                            );
                            obj.insert(
                                "target_note".to_string(),
                                json!("chain-scoped DELETE/rewrite of all business orders remains Target; requires dual-gated persist API + 01/03 review after chain_id normalization"),
                            );
                        }
                        resp_body["orders_chain_scope_rollback_dry_run"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "orders_chain_scope_rollback_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.orders_chain_scope_rollback_execute)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK").as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "orders_chain_scope_rollback_execute_forbidden",
                            "set TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped order rollback",
                        )),
                    )
                        .into_response();
                }
                let expected = db::orders_chain_scope_rollback_expected_confirm(chain_id_i64);
                let got = body
                    .as_ref()
                    .and_then(|j| j.0.orders_chain_scope_rollback_confirm.as_deref())
                    .unwrap_or("");
                if got != expected.as_str() {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "orders_chain_scope_rollback_execute_confirm_mismatch",
                            format!(
                                "orders_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                                expected
                            ),
                        )),
                    )
                        .into_response();
                }
                match db::orders_chain_scope_rollback_execute(pool, chain_id_i64).await {
                    Ok(summary) => {
                        let mut v = serde_json::to_value(&summary).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-ORDERS-CHAIN-SCOPE-EXECUTE"),
                            );
                            obj.insert(
                                "note".to_string(),
                                json!("deleted orders where chain_id matches request only; orders with NULL or other chain_id untouched; itineraries/order_messages CASCADE; requires 01/03 review for production use"),
                            );
                        }
                        resp_body["orders_chain_scope_rollback_execute"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "orders_chain_scope_rollback_execute_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.event_log_chain_scope_rollback_dry_run)
            {
                match db::event_log_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
                    Ok(d) => {
                        let mut v = serde_json::to_value(&d).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN"),
                            );
                            obj.insert(
                                "target_note".to_string(),
                                json!("does not reset in-process indexer memory by itself; after wipe use sync_indexer_memory_from_db_checkpoint + TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 (110-INDEXER-MEMORY-SYNC-FROM-DB) or restart API / tick·replay; pair with orders_chain_scope rollback if full chain data reset"),
                            );
                        }
                        resp_body["event_log_chain_scope_rollback_dry_run"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "event_log_chain_scope_rollback_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.event_log_chain_scope_rollback_execute)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK").as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "event_log_chain_scope_rollback_execute_forbidden",
                            "set TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped event_log/checkpoint/fee_router/region_vault projection rollback",
                        )),
                    )
                        .into_response();
                }
                let expected = db::event_log_chain_scope_rollback_expected_confirm(chain_id_i64);
                let got = body
                    .as_ref()
                    .and_then(|j| j.0.event_log_chain_scope_rollback_confirm.as_deref())
                    .unwrap_or("");
                if got != expected.as_str() {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "event_log_chain_scope_rollback_execute_confirm_mismatch",
                            format!(
                                "event_log_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                                expected
                            ),
                        )),
                    )
                        .into_response();
                }
                match db::event_log_chain_scope_rollback_execute(pool, chain_id_i64).await {
                    Ok(summary) => {
                        let mut v = serde_json::to_value(&summary).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-EVENT-LOG-CHAIN-SCOPE-EXECUTE"),
                            );
                            obj.insert(
                                "note".to_string(),
                                json!("deleted event_log, checkpoints_sharded, fee_router_routed_events, region_vault_forwarded_events for chain_id; pair with sync_indexer_memory_from_db_checkpoint + TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 to align in-memory indexer without restart (110-INDEXER-MEMORY-SYNC-FROM-DB)"),
                            );
                        }
                        resp_body["event_log_chain_scope_rollback_execute"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "event_log_chain_scope_rollback_execute_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.correction_executor_chain_scope_rollback_dry_run)
            {
                match db::correction_executor_chain_scope_rollback_dry_run(pool, chain_id_i64).await
                {
                    Ok(d) => {
                        let mut v = serde_json::to_value(&d).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN"),
                            );
                        }
                        resp_body["correction_executor_chain_scope_rollback_dry_run"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "correction_executor_chain_scope_rollback_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.correction_executor_chain_scope_rollback_execute)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK")
                        .as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "correction_executor_chain_scope_rollback_execute_forbidden",
                            "set TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped correction_log/executor_executions rollback",
                        )),
                    )
                        .into_response();
                }
                let expected =
                    db::correction_executor_chain_scope_rollback_expected_confirm(chain_id_i64);
                let got = body
                    .as_ref()
                    .and_then(|j| {
                        j.0.correction_executor_chain_scope_rollback_confirm
                            .as_deref()
                    })
                    .unwrap_or("");
                if got != expected.as_str() {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "correction_executor_chain_scope_rollback_execute_confirm_mismatch",
                            format!(
                                "correction_executor_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                                expected
                            ),
                        )),
                    )
                        .into_response();
                }
                match db::correction_executor_chain_scope_rollback_execute(pool, chain_id_i64).await
                {
                    Ok(summary) => {
                        let mut v = serde_json::to_value(&summary).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-CORRECTION-EXECUTOR-CHAIN-SCOPE-EXECUTE"),
                            );
                        }
                        resp_body["correction_executor_chain_scope_rollback_execute"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "correction_executor_chain_scope_rollback_execute_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.sync_indexer_memory_from_db_checkpoint)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB").as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "indexer_memory_sync_from_db_forbidden",
                            "set TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 on the API process to align in-memory indexer checkpoint with checkpoints_sharded",
                        )),
                    )
                        .into_response();
                }
                let Some(ref indexer_handle) = state.indexer_state else {
                    return (
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(crate::api_json::err_key_detail(
                            "indexer_state_unavailable",
                            "indexer state handle not mounted",
                        )),
                    )
                        .into_response();
                };
                match db::fetch_indexer_checkpoint_for_chain(
                    pool,
                    db::INDEXER_CHECKPOINT_CONSUMER_ID,
                    chain_id_i64,
                )
                .await
                {
                    Ok(db_row) => {
                        let before = {
                            let g = indexer_handle.read().await;
                            json!({
                                "last_block": g.last_block,
                                "last_log_index": g.last_log_index,
                                "events_cached": g.events.len(),
                            })
                        };
                        let (src, bn, li) = match db_row {
                            Some((b, l)) => {
                                if b < 0 {
                                    return (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(crate::api_json::err_key_detail(
                                            "indexer_memory_sync_from_db_failed",
                                            "checkpoints_sharded.block_number must be non-negative",
                                        )),
                                    )
                                        .into_response();
                                }
                                ("db_checkpoint_row", b as u64, l.max(0) as u32)
                            }
                            None => ("no_db_row_reset", 0u64, 0u32),
                        };
                        {
                            let mut g = indexer_handle.write().await;
                            g.events.retain(|e| {
                                e.block_number < bn || (e.block_number == bn && e.log_index <= li)
                            });
                            g.last_block = bn;
                            g.last_log_index = li;
                            g.last_block_hash = g
                                .events
                                .iter()
                                .find(|e| e.block_number == bn && e.log_index == li)
                                .map(|e| e.block_hash.clone())
                                .unwrap_or_default();
                        }
                        let after = {
                            let g = indexer_handle.read().await;
                            json!({
                                "last_block": g.last_block,
                                "last_log_index": g.last_log_index,
                                "events_cached": g.events.len(),
                            })
                        };
                        let runtime_path_str = format!("{}.runtime", state.indexer_state_path);
                        let runtime_path = Path::new(&runtime_path_str);
                        {
                            let guard = indexer_handle.read().await;
                            if let Err(e) =
                                chain::indexer::persist_indexer_state(runtime_path, &guard)
                            {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "indexer_memory_sync_from_db_persist_failed",
                                        format!("{}", e),
                                    )),
                                )
                                    .into_response();
                            }
                        }
                        resp_body["indexer_memory_sync_from_db"] = json!({
                            "anchor": "110-INDEXER-MEMORY-SYNC-FROM-DB",
                            "chain_id": chain_id,
                            "source": src,
                            "before": before,
                            "after": after,
                            "note": "GET /meta.indexer.memory reflects live handle; GET /meta.indexer.checkpoint may still show startup snapshot until process restart",
                        });
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "indexer_memory_sync_from_db_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            (StatusCode::OK, Json(resp_body)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "reconcile_orders_projection_failed",
                e.to_string(),
            )),
        )
            .into_response(),
    }
}

/// 与 **`GET …/admin/indexer/health`** 同源：最新 **`orders_projection_vs_orders`** 小摘要（无整份 summary）。
async fn snapshot_last_stored_orders_projection_reconcile(state: &ApiMetaState) -> Option<Value> {
    let pool = state
        .chain_off
        .as_ref()
        .and_then(|co| co.db_pool.as_ref())?;
    match db::admin_last_stored_orders_projection_reconcile(pool).await {
        Ok(Some(v)) => Some(v),
        Ok(None) | Err(_) => None,
    }
}

/// POST /api/v1/internal/alerts/test-fire：触发告警演练（最小可用）
pub async fn internal_alerts_test_fire(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let last = snapshot_last_stored_orders_projection_reconcile(&state).await;
    let mut body = json!({
        "status": "accepted",
        "task": "alerts_test_fire",
        "severity": "P2",
        "source": "internal",
        "snapshot": {
            "finality_n": state.finality_n,
            "lag_blocks": state.indexer_lag_blocks,
            "reorg_detected": state.reorg_detected
        }
    });
    if let Some(v) = last {
        if let Some(snap) = body
            .pointer_mut("/snapshot")
            .and_then(|x| x.as_object_mut())
        {
            snap.insert("last_stored_orders_projection_reconcile".to_string(), v);
        }
    }
    Json(body).into_response()
}

/// POST /api/v1/internal/incident/open：创建事故工单（最小可用）
pub async fn internal_incident_open(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let last = snapshot_last_stored_orders_projection_reconcile(&state).await;
    let mut body = json!({
        "status": "accepted",
        "task": "incident_open",
        "incident": {
            "id": format!("INC-{}", Utc::now().format("%Y%m%d%H%M%S")),
            "state": "opened",
            "owner_group": "ops"
        },
        "context": {
            "finality_n": state.finality_n,
            "lag_blocks": state.indexer_lag_blocks
        }
    });
    if let Some(v) = last {
        if let Some(ctx) = body.pointer_mut("/context").and_then(|x| x.as_object_mut()) {
            ctx.insert("last_stored_orders_projection_reconcile".to_string(), v);
        }
    }
    Json(body).into_response()
}

#[derive(Debug, Default, Deserialize)]
pub struct IndexerStatusQuery {
    /// `1` / `true` / `yes` / `on`：即时只读跑 **`orders`↔`orders_projection`** 对账并写入 **`live_orders_projection_reconcile`**（须 **PgPool** + **ChainConfig**）。
    #[serde(default)]
    pub live_reconcile: Option<String>,
}

fn indexer_status_wants_live_reconcile(q: &IndexerStatusQuery) -> bool {
    q.live_reconcile.as_deref().map_or(false, |s| {
        matches!(
            s.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        )
    })
}

/// **110 §3.4 Partial** / **RUNBOOK §2.55**：reorg 后**人工** replay/reconcile 路径说明；全自动回滚仍为 **Target**。
/// 嵌入 **`GET …/internal/indexer-status`** 便于探针、**`jq`** 与 **`indexer-public-snapshot`** 留痕（锚点 **`110-REORG-RECOVERY-HINT`**）。
fn indexer_reorg_recovery_hint_json() -> Value {
    json!({
        "anchor": "110-REORG-RECOVERY-HINT",
        "runbook": "ops/RUNBOOK.md §2.55",
        "spec": "110 §3.4 Partial: indexer-reorg-rewind + replay; full orders/memory rollback still Target",
        "steps": [
            "Optional: set INDEXER_REORG_AUTO_REWIND_ON_TICK=1 with DATABASE_URL so a single indexer-tick may auto-run the same rewind as indexer-reorg-rewind once per tick (see tick response reorg_auto_rewind; limitations unchanged)",
            "Pause indexer-tick jobs until chain head and stored last_block_hash are verified against RPC",
            "POST /api/v1/internal/indexer-reorg-rewind JSON {\"rewind_from_block\": <same as reorg_suspected.block_number>} — truncate event_log/fee_router tail, rewind memory checkpoint, clear+replay orders_projection (see response limitations)",
            "POST /api/v1/internal/indexer-replay — idempotent rebuild if needed (rewind already replays)",
            "POST /api/v1/internal/indexer-reconcile — check issues_total / projection_reconcile_clean; use persist:true only after approval",
            "Resume indexer-tick when indexer.last_block_hash matches canonical eth_getBlockByNumber(last_block)"
        ],
        "paths": {
            "indexer_status": "/api/v1/internal/indexer-status",
            "indexer_reorg_rewind": "/api/v1/internal/indexer-reorg-rewind",
            "indexer_replay": "/api/v1/internal/indexer-replay",
            "indexer_reconcile": "/api/v1/internal/indexer-reconcile",
            "indexer_tick": "/api/v1/internal/indexer-tick"
        }
    })
}

async fn live_orders_projection_reconcile_payload(state: &ApiMetaState) -> Value {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return json!({
                "ok": false,
                "error": "database_unavailable",
                "message": "DATABASE_URL / PgPool required for live reconcile",
            });
        }
    };
    let chain_id = match state.chain_config.as_ref() {
        Some(c) => c.chain_id,
        None => {
            return json!({
                "ok": false,
                "error": "chain_not_configured",
                "message": "CHAIN_RPC_URL / ChainConfig required for live reconcile",
            });
        }
    };
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    match db::reconcile_orders_projection_vs_orders(pool, chain_id_i64).await {
        Ok(stats) => {
            let mut j = json!({
                "ok": true,
                "chain_id": chain_id,
                "issues_total": stats.issues_total,
                "projection_reconcile_clean": stats.projection_reconcile_clean,
                "stats": stats,
            });
            if let Some(c) = economic_projection_row_counts_for_chain(pool, chain_id_i64).await {
                j["economic_projection_row_counts"] = c;
            }
            j
        }
        Err(e) => json!({
            "ok": false,
            "error": "reconcile_orders_projection_failed",
            "message": e.to_string(),
        }),
    }
}

/// GET /api/v1/internal/indexer-status：索引器运行状态与 checkpoint 快照
pub async fn indexer_status(
    State(state): State<ApiMetaState>,
    Query(query): Query<IndexerStatusQuery>,
) -> impl IntoResponse {
    let last = snapshot_last_stored_orders_projection_reconcile(&state).await;
    let runtime = if let Some(ref idx) = state.indexer_state {
        let g = idx.read().await;
        json!({
            "last_block": g.last_block,
            "last_log_index": g.last_log_index,
            "last_block_hash": g.last_block_hash,
            "events_cached": g.events.len(),
        })
    } else {
        json!({"status": "unavailable"})
    };

    let mut body = json!({
        "status": "ok",
        "meta": {
            "build": crate::routes::health_meta::meta_build_value()
        },
        "indexer": runtime,
        "state": {
            "finality_n": state.finality_n,
            "checkpoint": {
                "block_number": state.indexer_checkpoint.block_number,
                "log_index": state.indexer_checkpoint.log_index,
            },
            "last_seen_finality_n": state.indexer_last_seen_finality_n,
            "replay_required": state.indexer_replay_required,
            "lag_blocks": state.indexer_lag_blocks,
            "lag_max_blocks": state.indexer_lag_max_blocks,
            "reorg_detected": state.reorg_detected,
            "rule": "110 §3.3 Partial：indexer-tick 上界 chain_tip−max(1,FINALITY_N)；同 GET /meta.indexer.rule；供 reconcile 门禁与运维对齐",
        }
    });
    body["reorg_recovery"] = indexer_reorg_recovery_hint_json();
    if let Some(v) = last {
        body["last_stored_orders_projection_reconcile"] = v;
    }
    if indexer_status_wants_live_reconcile(&query) {
        body["live_orders_projection_reconcile"] =
            live_orders_projection_reconcile_payload(&state).await;
    }
    Json(body).into_response()
}

#[derive(Debug, Deserialize)]
pub struct InternalCommunityRankingSnapshotBody {
    #[serde(default = "default_internal_ranking_feed_mode")]
    pub feed_mode: String,
    pub limit: Option<i64>,
    #[serde(default)]
    pub notes: Option<String>,
}

fn default_internal_ranking_feed_mode() -> String {
    "latest".to_string()
}

/// POST /api/v1/internal/community/ranking/snapshot（160：抓取当前 Feed 顶条写入 `community_ranking_snapshots`）
pub async fn post_internal_community_ranking_snapshot(
    State(state): State<ApiMetaState>,
    Json(body): Json<InternalCommunityRankingSnapshotBody>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "error", "error": "db_unavailable", "message": "db_unavailable"})),
            )
                .into_response();
        }
    };
    let mode = body.feed_mode.trim().to_lowercase();
    let limit = body.limit.unwrap_or(30).clamp(1, 100);
    let notes = body
        .notes
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let mode_key = match mode.as_str() {
        "hot" => "hot",
        "recommend" => "recommend",
        "latest" => "latest",
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_feed_mode", "message": "invalid_feed_mode"})),
            )
                .into_response();
        }
    };
    let (snap_id, feed_mode_stored, item_count, ids) =
        match execute_community_ranking_snapshot_core(pool, mode_key, limit, notes).await {
            Ok(v) => v,
            Err(msg) => {
                let status = if msg == "invalid_feed_mode" {
                    StatusCode::BAD_REQUEST
                } else {
                    StatusCode::INTERNAL_SERVER_ERROR
                };
                return (
                    status,
                    Json(json!({"status": "error", "error": msg.clone(), "message": msg})),
                )
                    .into_response();
            }
        };
    let top_ids: Vec<String> = ids.iter().map(|u| u.to_string()).collect();
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "id": snap_id.to_string(),
            "feed_mode": feed_mode_stored,
            "item_count": item_count,
            "top_post_ids": top_ids,
        })),
    )
        .into_response()
}

#[derive(Debug, Deserialize)]
pub struct InternalSchedulerEnqueueBody {
    pub job_code: String,
    #[serde(default = "default_internal_scheduler_enqueue_trigger")]
    pub trigger_source: String,
}

fn default_internal_scheduler_enqueue_trigger() -> String {
    "cron".to_string()
}

/// POST /api/v1/internal/scheduler/enqueue（260/421：入队社区排序快照等任务；须内网）
pub async fn post_internal_scheduler_enqueue(
    State(state): State<ApiMetaState>,
    Json(body): Json<InternalSchedulerEnqueueBody>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "error", "error": "db_unavailable", "message": "db_unavailable"})),
            )
                .into_response();
        }
    };
    let trig = body.trigger_source.trim();
    if !is_allowed_internal_scheduler_trigger(trig) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_trigger_source", "message": "invalid_trigger_source"})),
        )
            .into_response();
    }
    let code = match normalize_community_ranking_scheduler_job_code(body.job_code.trim()) {
        Some(c) => c,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_job_code",
                    "message": "invalid_job_code",
                    "hint": "community.ranking.snapshot.latest|hot|recommend|all"
                })),
            )
                .into_response();
        }
    };
    let row = match db::insert_scheduler_job_queued(pool, code, trig).await {
        Ok(r) => r,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"status": "error", "error": "scheduler_enqueue_failed", "message": "scheduler_enqueue_failed"})),
            )
                .into_response();
        }
    };
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "job_run_id": row.id.to_string(),
            "job_code": row.job_code,
            "trigger_source": row.trigger_source,
        })),
    )
        .into_response()
}

fn snapshot_json_one(
    id: Uuid,
    feed_mode: &str,
    item_count: i32,
    ids: &[Uuid],
) -> serde_json::Value {
    json!({
        "snapshot_id": id.to_string(),
        "feed_mode": feed_mode,
        "item_count": item_count,
        "top_post_ids": ids.iter().map(|u| u.to_string()).collect::<Vec<_>>(),
    })
}

/// POST /api/v1/internal/scheduler/run-next（260/421：消费一条 `queued` 调度；当前实现 **160** 社区排序快照类 `job_code`）
pub async fn post_internal_scheduler_run_next(
    State(state): State<ApiMetaState>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "error", "error": "db_unavailable", "message": "db_unavailable"})),
            )
                .into_response();
        }
    };
    let run = match db::claim_next_queued_scheduler_job_run(pool).await {
        Ok(Some(r)) => r,
        Ok(None) => {
            return (
                StatusCode::OK,
                Json(json!({"status": "ok", "processed": 0, "message": "queue_empty"})),
            )
                .into_response();
        }
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"status": "error", "error": "scheduler_claim_failed", "message": "scheduler_claim_failed"})),
            )
                .into_response();
        }
    };
    let run_id = run.id;
    let job_code = run.job_code.clone();
    let limit = community_ranking_scheduler_limit_from_env();

    let outcome: Result<serde_json::Value, String> = async {
        match job_code.trim() {
            "community.ranking.snapshot.latest" => {
                let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                    pool,
                    "latest",
                    limit,
                    Some("scheduler community.ranking.snapshot.latest"),
                )
                .await?;
                Ok(snapshot_json_one(id, fm, n, &ids))
            }
            "community.ranking.snapshot.hot" => {
                let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                    pool,
                    "hot",
                    limit,
                    Some("scheduler community.ranking.snapshot.hot"),
                )
                .await?;
                Ok(snapshot_json_one(id, fm, n, &ids))
            }
            "community.ranking.snapshot.recommend" => {
                let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                    pool,
                    "recommend",
                    limit,
                    Some("scheduler community.ranking.snapshot.recommend"),
                )
                .await?;
                Ok(snapshot_json_one(id, fm, n, &ids))
            }
            "community.ranking.snapshot.all" => {
                let mut arr = Vec::new();
                for m in ["latest", "hot", "recommend"] {
                    let (id, fm, n, ids) = execute_community_ranking_snapshot_core(
                        pool,
                        m,
                        limit,
                        Some("scheduler community.ranking.snapshot.all"),
                    )
                    .await?;
                    arr.push(snapshot_json_one(id, fm, n, &ids));
                }
                Ok(json!({ "snapshots": arr }))
            }
            _ => Err("unknown_job_code".to_string()),
        }
    }
    .await;

    match outcome {
        Ok(result) => {
            let _ = db::complete_scheduler_job_run(pool, run_id, true, None).await;
            (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "processed": 1,
                    "job_run_id": run_id.to_string(),
                    "job_code": job_code,
                    "result": result,
                })),
            )
                .into_response()
        }
        Err(e) => {
            let _ = db::complete_scheduler_job_run(pool, run_id, false, Some(&e)).await;
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": e.clone(),
                    "processed": 1,
                    "job_run_id": run_id.to_string(),
                    "job_code": job_code,
                    "message": e,
                })),
            )
                .into_response()
        }
    }
}

/// PATCH /api/v1/internal/community/feedback/:id — G4 官方回复/状态（仅内网；产品定稿后可扩展公网权限）
pub async fn patch_feedback_official_reply(
    State(state): State<ApiMetaState>,
    AxumPath(id): AxumPath<String>,
    body: Option<axum::Json<serde_json::Value>>,
) -> impl IntoResponse {
    let feedback_id = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_id", "message": "invalid_id"})),
            )
                .into_response();
        }
    };
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})),
            )
                .into_response();
        }
    };
    let empty: serde_json::Map<String, serde_json::Value> = serde_json::Map::new();
    let j = body.as_ref().and_then(|b| b.as_object()).unwrap_or(&empty);
    let official_reply = j.get("official_reply").and_then(|v| v.as_str());
    let status = j.get("status").and_then(|v| v.as_str());
    if official_reply.is_none() && status.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "official_reply_or_status_required", "message": "official_reply_or_status_required"})),
        )
            .into_response();
    }
    match db::update_feedback_official_reply_and_status(
        pool,
        feedback_id,
        official_reply,
        status,
    )
    .await
    {
        Ok(true) => (
            StatusCode::OK,
            Json(json!({"status": "ok", "id": id})),
        )
            .into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "not_found_or_no_change", "message": "not_found_or_no_change"})),
        )
            .into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"status": "error", "error": "update_failed", "message": "update_failed"})),
        )
            .into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
    use axum::extract::Query;
    use chrono::Utc;
    use http_body_util::BodyExt;
    use sqlx::postgres::PgPoolOptions;
    use std::collections::HashMap;
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::sync::RwLock;

    /// **`127.0.0.1:1`** + 短 acquire：**connection refused** 快速失败（**不**长挂 TCP），供 **`indexer-status`** 快照 / **`live_reconcile`** SQL 路径单测复用。
    fn dead_gate_test_pool() -> sqlx::PgPool {
        PgPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_millis(500))
            .connect_lazy("postgres://nouser:nopass@127.0.0.1:1/traveltrust_test_gate")
            .expect("lazy dead pool for gate tests")
    }

    /// 链与 indexer 内存态已就绪，但 **无** `chain_off.db_pool`（与本地无 DATABASE_URL 一致）。
    fn build_state_chain_ready_no_db_pool() -> ApiMetaState {
        let mut s = build_state();
        s.chain_config = Some(chain::ChainConfig {
            rpc_url: "http://127.0.0.1:8545".to_string(),
            chain_id: 137,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        });
        s.indexer_state = Some(chain::indexer::new_indexer_state());
        s
    }

    /// `chain_config` 已设但 **无** `indexer_state` / **无** `chain_off.db_pool`（replay / reorg-rewind 第二道门禁）。
    fn build_state_chain_only_no_indexer_no_db_pool() -> ApiMetaState {
        let mut s = build_state();
        s.chain_config = Some(chain::ChainConfig {
            rpc_url: "http://127.0.0.1:8545".to_string(),
            chain_id: 137,
            escrow_factory_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            fee_router_address: None,
            region_vault_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        });
        s.indexer_state = None;
        s
    }

    /// **`PgPool` 已挂载**（lazy）但 **无** `chain_config`。`indexer-status` 会先跑 **`snapshot_last_stored_orders_projection_reconcile`**：死端口快照快速失败；**`live_reconcile`** 仍命中 **`chain_not_configured`**（**不**跑对账 SQL）。
    fn build_state_db_pool_but_no_chain_config() -> ApiMetaState {
        let mut s = build_state();
        s.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(dead_gate_test_pool()),
        });
        s
    }

    /// 链配置 + indexer 句柄 + **死** `PgPool`（与 **DB 宕机/DSN 错** 同类：**能**进到对账 SQL，**会**失败）。
    fn build_state_chain_ready_with_dead_db_pool() -> ApiMetaState {
        let mut s = build_state_chain_ready_no_db_pool();
        s.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(dead_gate_test_pool()),
        });
        s
    }

    fn build_state() -> ApiMetaState {
        ApiMetaState {
            strict_ssot: false,
            ssot_version: "test".to_string(),
            ssot_sha256_expected: None,
            ssot_sha256_computed: None,
            ssot_sha256_match: true,
            chargeback_policy: "warn".to_string(),
            finality_n: 12,
            indexer_state_path: "test".to_string(),
            indexer_checkpoint: ProjectorCheckpoint {
                block_number: 100,
                log_index: 3,
            },
            indexer_last_seen_finality_n: 12,
            indexer_replay_required: false,
            pause_mode: false,
            pause_api_allowlist: "".to_string(),
            degraded_mode: false,
            authority_source: "db_projection".to_string(),
            indexer_lag_blocks: 0,
            indexer_lag_max_blocks: 0,
            reorg_detected: false,
            evidence_timestamp_policy: "backend_signed".to_string(),
            evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
                last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
            })),
            evidence_time_state_path: "test".to_string(),
            evidence_receipt_hmac_key: None,
            reconcile_export_ed25519_key: None,
            chain_off: None,
            chain_config: None,
            resolution_outbox: None,
            indexer_state: None,
            guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[tokio::test]
    async fn internal_alerts_test_fire_returns_accepted() {
        let resp = internal_alerts_test_fire(State(build_state()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("accepted"));
        let snap = v.get("snapshot").expect("snapshot");
        assert!(snap
            .get("last_stored_orders_projection_reconcile")
            .is_none());
        assert_eq!(snap.get("finality_n").and_then(|x| x.as_u64()), Some(12));
    }

    /// **`PgPool` 已挂但不可连** 时 **`admin_last_stored_*`** 快照失败 → **不**附加 **`last_stored`**（与 **无池** 外观一致；**不**长挂）。
    #[tokio::test]
    async fn internal_alerts_test_fire_chain_ready_dead_db_omits_last_stored_snapshot() {
        let resp = internal_alerts_test_fire(State(build_state_chain_ready_with_dead_db_pool()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        let snap = v.get("snapshot").expect("snapshot");
        assert!(snap
            .get("last_stored_orders_projection_reconcile")
            .is_none());
    }

    #[tokio::test]
    async fn internal_incident_open_returns_accepted() {
        let resp = internal_incident_open(State(build_state()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        let ctx = v.get("context").expect("context");
        assert!(ctx.get("last_stored_orders_projection_reconcile").is_none());
    }

    #[tokio::test]
    async fn internal_incident_open_chain_ready_dead_db_omits_last_stored_in_context() {
        let resp = internal_incident_open(State(build_state_chain_ready_with_dead_db_pool()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        let ctx = v.get("context").expect("context");
        assert!(ctx.get("last_stored_orders_projection_reconcile").is_none());
    }

    #[test]
    fn attach_meta_build_to_tick_ok_body_inserts_build() {
        let mut body = json!({"status": "ok", "message": "no_new_blocks"});
        super::attach_meta_build_to_tick_ok_body(&mut body);
        let meta = body.get("meta").expect("meta");
        let build = meta.get("build").expect("meta.build");
        assert!(build.get("git_sha").is_some());
        assert!(build.get("rule").is_some());
    }

    #[tokio::test]
    async fn indexer_status_ok_omits_last_stored_without_db() {
        let resp = indexer_status(State(build_state()), Query(IndexerStatusQuery::default()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert!(v.get("last_stored_orders_projection_reconcile").is_none());
        assert!(v.get("live_orders_projection_reconcile").is_none());
        assert!(v.get("state").is_some());
        let meta = v.get("meta").expect("meta");
        let build = meta.get("build").expect("meta.build");
        assert!(build.get("git_sha").is_some());
        assert!(build.get("rule").is_some());
        let rr = v.get("reorg_recovery").expect("reorg_recovery hint");
        assert_eq!(
            rr.get("anchor").and_then(|x| x.as_str()),
            Some("110-REORG-RECOVERY-HINT")
        );
        let paths = rr.get("paths").and_then(|x| x.as_object()).expect("paths");
        assert_eq!(
            paths.get("indexer_status").and_then(|x| x.as_str()),
            Some("/api/v1/internal/indexer-status")
        );
        assert_eq!(
            paths.get("indexer_reconcile").and_then(|x| x.as_str()),
            Some("/api/v1/internal/indexer-reconcile")
        );
        assert_eq!(
            paths.get("indexer_tick").and_then(|x| x.as_str()),
            Some("/api/v1/internal/indexer-tick")
        );
        assert_eq!(
            paths.get("indexer_replay").and_then(|x| x.as_str()),
            Some("/api/v1/internal/indexer-replay")
        );
        assert_eq!(
            paths.get("indexer_reorg_rewind").and_then(|x| x.as_str()),
            Some("/api/v1/internal/indexer-reorg-rewind")
        );
        let steps = rr.get("steps").and_then(|x| x.as_array()).expect("steps");
        assert!(
            steps.len() >= 5,
            "reorg_recovery.steps should list replay/reconcile path"
        );
    }

    /// 链配置 + indexer 句柄已挂载（无 DB）时 **`GET …/internal/indexer-status`** 体与 **110 §3.3** / 探针 **`jq`** 口径对齐。
    #[tokio::test]
    async fn indexer_status_ok_when_chain_and_memory_mounted_includes_runtime_state_and_meta_build()
    {
        let resp = indexer_status(
            State(build_state_chain_ready_no_db_pool()),
            Query(IndexerStatusQuery::default()),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        let meta = v.get("meta").expect("meta");
        let build = meta.get("build").expect("meta.build");
        assert!(build
            .get("git_sha")
            .and_then(|x| x.as_str())
            .is_some_and(|s| !s.is_empty()));
        assert!(build.get("rule").is_some());
        let idx = v.get("indexer").expect("indexer runtime");
        assert_eq!(idx.get("last_block").and_then(|x| x.as_u64()), Some(0));
        assert_eq!(idx.get("last_log_index").and_then(|x| x.as_u64()), Some(0));
        assert_eq!(idx.get("events_cached").and_then(|x| x.as_u64()), Some(0));
        let st = v.get("state").expect("state");
        assert_eq!(st.get("finality_n").and_then(|x| x.as_u64()), Some(12));
        assert_eq!(
            st.get("last_seen_finality_n").and_then(|x| x.as_u64()),
            Some(12)
        );
        assert_eq!(
            st.get("checkpoint")
                .and_then(|c| c.get("block_number"))
                .and_then(|x| x.as_u64()),
            Some(100)
        );
        assert_eq!(
            st.get("checkpoint")
                .and_then(|c| c.get("log_index"))
                .and_then(|x| x.as_u64()),
            Some(3)
        );
        let rule = st.get("rule").and_then(|x| x.as_str()).unwrap_or("");
        assert!(
            rule.contains("110 §3.3"),
            "state.rule should cite 110 §3.3, got {rule:?}"
        );
        let rr = v.get("reorg_recovery").expect("reorg_recovery");
        assert_eq!(
            rr.get("anchor").and_then(|x| x.as_str()),
            Some("110-REORG-RECOVERY-HINT")
        );
    }

    #[tokio::test]
    async fn indexer_tick_returns_503_chain_not_configured_without_chain_or_indexer() {
        let resp = indexer_tick(State(build_state())).await.into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
    }

    #[tokio::test]
    async fn indexer_tick_returns_503_when_escrow_factory_address_missing() {
        let resp = indexer_tick(State(build_state_chain_ready_no_db_pool()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("ESCROW_FACTORY_ADDRESS not set")
        );
    }

    #[tokio::test]
    async fn indexer_status_live_reconcile_reports_db_missing() {
        let resp = indexer_status(
            State(build_state()),
            Query(IndexerStatusQuery {
                live_reconcile: Some("1".to_string()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        let live = v
            .get("live_orders_projection_reconcile")
            .expect("live block");
        assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
        assert_eq!(
            live.get("error").and_then(|x| x.as_str()),
            Some("database_unavailable")
        );
    }

    /// 链与内存 indexer 已就绪但 **无 PgPool** 时，即时对账仍须 **DB** 前置 — 与 **`live_orders_projection_reconcile_payload`** 分支 **对读**。
    #[tokio::test]
    async fn indexer_status_live_reconcile_chain_ready_without_db_still_database_unavailable() {
        let resp = indexer_status(
            State(build_state_chain_ready_no_db_pool()),
            Query(IndexerStatusQuery {
                live_reconcile: Some("on".to_string()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        let live = v
            .get("live_orders_projection_reconcile")
            .expect("live block");
        assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
        assert_eq!(
            live.get("error").and_then(|x| x.as_str()),
            Some("database_unavailable")
        );
    }

    /// **`live_reconcile`**：**PgPool** 存在但 **无 ChainConfig** 时须 **`chain_not_configured`**（**不**触发 SQL；与 **04 §3.4**「缺链配置」叙述 **对读**）。
    #[tokio::test]
    async fn indexer_status_live_reconcile_db_pool_without_chain_reports_chain_not_configured() {
        let resp = indexer_status(
            State(build_state_db_pool_but_no_chain_config()),
            Query(IndexerStatusQuery {
                live_reconcile: Some("1".to_string()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        let live = v
            .get("live_orders_projection_reconcile")
            .expect("live block");
        assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
        assert_eq!(
            live.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            live.get("message").and_then(|x| x.as_str()),
            Some("CHAIN_RPC_URL / ChainConfig required for live reconcile")
        );
    }

    /// **`live_reconcile`**：**ChainConfig** + **PgPool** 均已挂载但 **DB 不可连** 时须 **`reconcile_orders_projection_failed`**（与 **`live_orders_projection_reconcile_payload`** **`Err`** 分支 **对读**；**110** 探针 **`jq`** **`error`** 键）。
    #[tokio::test]
    async fn indexer_status_live_reconcile_chain_ready_dead_db_reports_reconcile_orders_projection_failed(
    ) {
        let resp = indexer_status(
            State(build_state_chain_ready_with_dead_db_pool()),
            Query(IndexerStatusQuery {
                live_reconcile: Some("true".to_string()),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert!(v.get("last_stored_orders_projection_reconcile").is_none());
        let live = v
            .get("live_orders_projection_reconcile")
            .expect("live block");
        assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
        assert_eq!(
            live.get("error").and_then(|x| x.as_str()),
            Some("reconcile_orders_projection_failed")
        );
        let msg = live
            .get("message")
            .and_then(|x| x.as_str())
            .unwrap_or_default();
        assert!(
            !msg.is_empty(),
            "live_orders_projection_reconcile.message should echo sqlx error"
        );
    }

    #[tokio::test]
    async fn indexer_replay_requires_chain_config() {
        let resp = indexer_replay(State(build_state()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required")
        );
    }

    #[tokio::test]
    async fn indexer_replay_returns_chain_not_configured_when_indexer_state_missing() {
        let resp = indexer_replay(State(build_state_chain_only_no_indexer_no_db_pool()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("indexer state not initialized")
        );
    }

    #[tokio::test]
    async fn indexer_replay_requires_db_pool_when_chain_ready() {
        let resp = indexer_replay(State(build_state_chain_ready_no_db_pool()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("database_required_for_replay")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("database_required_for_replay")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("chain_off with DATABASE_URL required to replay event_log into orders_projection")
        );
    }

    #[tokio::test]
    async fn indexer_replay_chain_ready_dead_db_reports_replay_orders_projection_failed() {
        let resp = indexer_replay(State(build_state_chain_ready_with_dead_db_pool()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("replay_orders_projection_failed")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("replay_orders_projection_failed")
        );
        let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
        assert!(!detail.is_empty(), "detail must carry sqlx error text");
    }

    #[tokio::test]
    async fn indexer_reorg_rewind_requires_db_pool_when_chain_ready() {
        let resp = indexer_reorg_rewind(
            State(build_state_chain_ready_no_db_pool()),
            Json(IndexerReorgRewindBody {
                rewind_from_block: 1,
                force: true,
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("database_required_for_reorg_rewind")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("database_required_for_reorg_rewind")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("chain_off with DATABASE_URL required")
        );
    }

    #[tokio::test]
    async fn indexer_reorg_rewind_chain_ready_dead_db_reports_delete_event_log_failed() {
        let state = build_state_chain_ready_with_dead_db_pool();
        {
            let h = state.indexer_state.as_ref().expect("indexer");
            let mut g = h.write().await;
            g.last_block = 10;
            g.last_log_index = 0;
            g.last_block_hash =
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
        }
        let resp = indexer_reorg_rewind(
            State(state),
            Json(IndexerReorgRewindBody {
                rewind_from_block: 10,
                force: true,
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("delete_event_log_failed")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("delete_event_log_failed")
        );
        let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
        assert!(!detail.is_empty(), "detail must carry sqlx error text");
    }

    #[tokio::test]
    async fn indexer_reorg_rewind_returns_chain_not_configured_without_chain_config() {
        let resp = indexer_reorg_rewind(
            State(build_state()),
            Json(IndexerReorgRewindBody {
                rewind_from_block: 1,
                force: true,
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required")
        );
    }

    #[tokio::test]
    async fn indexer_reorg_rewind_returns_chain_not_configured_when_indexer_state_missing() {
        let resp = indexer_reorg_rewind(
            State(build_state_chain_only_no_indexer_no_db_pool()),
            Json(IndexerReorgRewindBody {
                rewind_from_block: 1,
                force: true,
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("indexer state not initialized")
        );
    }

    #[tokio::test]
    async fn indexer_reconcile_requires_chain_config() {
        let resp = indexer_reconcile(State(build_state()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required")
        );
    }

    #[tokio::test]
    async fn indexer_reconcile_returns_chain_not_configured_when_indexer_state_missing() {
        let resp = indexer_reconcile(State(build_state_chain_only_no_indexer_no_db_pool()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("indexer state not initialized")
        );
    }

    #[tokio::test]
    async fn indexer_reconcile_requires_db_pool_when_chain_ready() {
        let resp = indexer_reconcile(State(build_state_chain_ready_no_db_pool()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("database_required_for_reconcile")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("database_required_for_reconcile")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("chain_off with DATABASE_URL required for orders vs orders_projection reconcile")
        );
    }

    #[tokio::test]
    async fn indexer_reconcile_chain_ready_dead_db_reports_reconcile_orders_projection_failed() {
        let resp = indexer_reconcile(State(build_state_chain_ready_with_dead_db_pool()), None)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("reconcile_orders_projection_failed")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("reconcile_orders_projection_failed")
        );
        let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
        assert!(!detail.is_empty(), "detail must carry sqlx error text");
    }

    /// **`persist:true`** 仅在对账 **`Ok`** 之后生效；**死池** 仍首道 **`reconcile_orders_projection_failed`**（**不**触及 **`persist_reconciliation_report_failed`**）。
    #[tokio::test]
    async fn indexer_reconcile_chain_ready_dead_db_with_persist_true_still_reconcile_orders_projection_failed(
    ) {
        let mut body = IndexerReconcileBody::default();
        body.persist = true;
        let resp = indexer_reconcile(
            State(build_state_chain_ready_with_dead_db_pool()),
            Some(Json(body)),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let bytes = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("reconcile_orders_projection_failed")
        );
    }

    #[test]
    fn indexer_reconcile_body_deserializes_sync_memory_from_db_checkpoint() {
        let v = json!({"sync_indexer_memory_from_db_checkpoint": true});
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert!(b.sync_indexer_memory_from_db_checkpoint);
    }

    #[test]
    fn indexer_reconcile_body_deserializes_include_chain_tip() {
        let v = json!({"include_chain_tip": true});
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert!(b.include_chain_tip);
    }

    #[test]
    fn indexer_reconcile_body_deserializes_include_event_log_escrow_coverage() {
        let v = json!({"include_event_log_escrow_coverage": true});
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert!(b.include_event_log_escrow_coverage);
    }

    #[test]
    fn indexer_reconcile_body_deserializes_verify_fee_router_events_rpc() {
        let v = json!({"verify_fee_router_events_rpc": 12});
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert_eq!(b.verify_fee_router_events_rpc, Some(12));
    }

    #[test]
    fn indexer_reconcile_body_deserializes_verify_region_vault_events_rpc() {
        let v = json!({"verify_region_vault_events_rpc": 7});
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert_eq!(b.verify_region_vault_events_rpc, Some(7));
    }

    #[test]
    fn indexer_reconcile_body_deserializes_persist_and_chain_id() {
        let v = json!({"persist": true, "chain_id": 42161});
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert!(b.persist);
        assert_eq!(b.chain_id, Some(42161));
    }

    #[test]
    fn indexer_replay_body_deserializes_optional_chain_id() {
        let v = json!({"chain_id": 80001});
        let b: IndexerReplayBody = serde_json::from_value(v).unwrap();
        assert_eq!(b.chain_id, Some(80001));
        let empty: IndexerReplayBody = serde_json::from_value(json!({})).unwrap();
        assert!(empty.chain_id.is_none());
    }

    #[test]
    fn indexer_reconcile_body_deserializes_correction_executor_chain_scope_flags() {
        let v = json!({
            "correction_executor_chain_scope_rollback_dry_run": true,
            "correction_executor_chain_scope_rollback_execute": true,
            "correction_executor_chain_scope_rollback_confirm": "CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137"
        });
        let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
        assert!(b.correction_executor_chain_scope_rollback_dry_run);
        assert!(b.correction_executor_chain_scope_rollback_execute);
        assert_eq!(
            b.correction_executor_chain_scope_rollback_confirm
                .as_deref(),
            Some("CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137")
        );
    }

    #[tokio::test]
    async fn process_resolution_outbox_returns_chain_not_configured_without_chain_or_outbox() {
        let resp = process_resolution_outbox(State(build_state()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("chain_not_configured")
        );
        assert_eq!(
            v.get("hint").and_then(|x| x.as_str()),
            Some("CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required")
        );
    }

    #[tokio::test]
    async fn post_internal_community_ranking_snapshot_db_unavailable() {
        let resp = post_internal_community_ranking_snapshot(
            State(build_state()),
            Json(InternalCommunityRankingSnapshotBody {
                feed_mode: "latest".to_string(),
                limit: Some(10),
                notes: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("db_unavailable")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("db_unavailable")
        );
    }

    #[tokio::test]
    async fn patch_feedback_official_reply_db_unavailable() {
        let resp = patch_feedback_official_reply(
            State(build_state()),
            AxumPath("550e8400-e29b-41d4-a716-446655440000".to_string()),
            None,
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("service_unavailable")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("service_unavailable")
        );
    }

    #[tokio::test]
    async fn patch_feedback_official_reply_rejects_invalid_uuid() {
        let resp = patch_feedback_official_reply(
            State(build_state_chain_ready_with_dead_db_pool()),
            AxumPath("not-a-uuid".to_string()),
            Some(Json(json!({"official_reply": "ok"}))),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
        assert_eq!(v.get("error").and_then(|x| x.as_str()), Some("invalid_id"));
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("invalid_id")
        );
    }

    #[tokio::test]
    async fn patch_feedback_official_reply_requires_official_reply_or_status() {
        let resp = patch_feedback_official_reply(
            State(build_state_chain_ready_with_dead_db_pool()),
            AxumPath("550e8400-e29b-41d4-a716-446655440000".to_string()),
            Some(Json(json!({}))),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("official_reply_or_status_required")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("official_reply_or_status_required")
        );
    }

    #[tokio::test]
    async fn internal_scheduler_run_next_db_unavailable() {
        let resp = post_internal_scheduler_run_next(State(build_state()))
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("db_unavailable")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("db_unavailable")
        );
    }

    #[tokio::test]
    async fn internal_scheduler_enqueue_db_unavailable() {
        let resp = post_internal_scheduler_enqueue(
            State(build_state()),
            Json(InternalSchedulerEnqueueBody {
                job_code: "community.ranking.snapshot.all".to_string(),
                trigger_source: "cron".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("db_unavailable")
        );
        assert_eq!(
            v.get("message").and_then(|x| x.as_str()),
            Some("db_unavailable")
        );
    }

    /// **`GET …/internal/indexer-status?live_reconcile=`** 与 **`IndexerStatusQuery`** 反序列化同口径（**110** 探针 / **`jq`**）。
    #[test]
    fn indexer_status_wants_live_reconcile_false_when_absent_or_unlisted_tokens() {
        assert!(!super::indexer_status_wants_live_reconcile(
            &super::IndexerStatusQuery {
                live_reconcile: None,
            }
        ));
        assert!(!super::indexer_status_wants_live_reconcile(
            &super::IndexerStatusQuery {
                live_reconcile: Some("0".into()),
            }
        ));
        assert!(!super::indexer_status_wants_live_reconcile(
            &super::IndexerStatusQuery {
                live_reconcile: Some("false".into()),
            }
        ));
        assert!(!super::indexer_status_wants_live_reconcile(
            &super::IndexerStatusQuery {
                live_reconcile: Some("no".into()),
            }
        ));
        assert!(!super::indexer_status_wants_live_reconcile(
            &super::IndexerStatusQuery {
                live_reconcile: Some("off".into()),
            }
        ));
    }

    #[test]
    fn indexer_status_wants_live_reconcile_true_for_listed_tokens_trimmed_case_insensitive() {
        for s in ["1", "true", "yes", "on", " TRUE ", " Yes ", " ON "] {
            assert!(
                super::indexer_status_wants_live_reconcile(&super::IndexerStatusQuery {
                    live_reconcile: Some(s.into()),
                }),
                "expected truthy for {s:?}"
            );
        }
    }
}
