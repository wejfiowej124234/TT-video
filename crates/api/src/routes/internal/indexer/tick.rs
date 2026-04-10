use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::{json, Value};
use std::path::Path;

use crate::chain;
use crate::chain_off;
use crate::db;
use crate::routes::internal::common;
use crate::state::ApiMetaState;
use super::env::{indexer_reorg_auto_rewind_on_tick_enabled, indexer_strict_supplemental_log_fetch_enabled};
use super::meta_build::attach_meta_build_to_tick_ok_body;
use super::reorg_execute::perform_indexer_reorg_rewind_execute;

async fn persist_and_attach_b174_tick_fail_skip_obs(
    state: &ApiMetaState,
    body: &mut Value,
    logs_fetch_skipped: &[Value],
    events_applied: u32,
    events_new: u32,
) {
    let v = common::indexer_tick_fail_skip_bucket_observability_v1(
        Utc::now().to_rfc3339(),
        logs_fetch_skipped,
        events_applied,
        events_new,
    );
    *state
        .indexer_tick_fail_skip_bucket_obs_last
        .write()
        .await = Some(v.clone());
    body["indexer_tick_fail_skip_bucket_observability"] = v;
}

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
            (
                chain::indexer::indexer_tick_scan_from_block_lower_bound(&g),
                g.last_block,
                g.last_block_hash.clone(),
            )
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
                                                "investor_stake_state_events_rows": out.deleted_investor_stake,
                                                "investor_lock_state_events_rows": out.deleted_investor_lock,
                                                "governance_proposals_projection_rows": out.deleted_governance_proposals_projection,
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
            "investor_stake_state_events_new": 0,
            "investor_lock_state_events_new": 0,
            "region_share_snapshot_lines_new": 0,
            "p5_country_ledger_lines_new": 0,
            "from_block": from_block,
            "to_block": to_block,
            "chain_tip": latest,
            "finality_n": state.finality_n,
            "finality_n_used": state.finality_n,
            "indexer_finalized_upper_bound": to_block,
            "message": "no_new_blocks"
        });
        persist_and_attach_b174_tick_fail_skip_obs(&state, &mut body, &[], 0, 0).await;
        attach_meta_build_to_tick_ok_body(&mut body);
        return (StatusCode::OK, Json(body)).into_response();
    }
    if from_block > to_block {
        let mut body = json!({
            "status": "ok",
            "events_applied": 0,
            "events_new": 0,
            "investor_share_transfer_events_new": 0,
            "investor_stake_state_events_new": 0,
            "investor_lock_state_events_new": 0,
            "region_share_snapshot_lines_new": 0,
            "p5_country_ledger_lines_new": 0,
            "from_block": from_block,
            "to_block": to_block,
            "chain_tip": latest,
            "finality_n": state.finality_n,
            "finality_n_used": state.finality_n,
            "indexer_finalized_upper_bound": to_block,
            "message": "awaiting_finality"
        });
        persist_and_attach_b174_tick_fail_skip_obs(&state, &mut body, &[], 0, 0).await;
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
    // P5-1-B：**CountryPoolLedgerV0** `CountryLedgerCredited`（与 **fee_router** / **region_vault** 拉取 **并列追加**；**禁止**从两表派生本投影）
    if let Some(ref cl) = config.country_pool_ledger_address {
        let cl = cl.trim();
        if !cl.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[cl.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(cl_logs) => {
                    logs.extend(cl_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("country_pool_ledger: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "country_pool_ledger",
                        "address": cl,
                        "error": e
                    }));
                }
            }
        }
    }
    // Governor：**ProposalCreated / VoteCast / …** → **`event_log`** + **`governance_proposals_projection`**（B-089 Completion）
    if let Some(ref gov_a) = config.governor_address {
        let gov_a = gov_a.trim();
        if !gov_a.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[gov_a.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(gv_logs) => {
                    logs.extend(gv_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("governor: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "governor",
                        "address": gov_a,
                        "error": e
                    }));
                }
            }
        }
    }
    let mut applied = 0u32;
    let mut events_new = 0u32;
    let mut region_share_snapshot_lines_new = 0u32;
    let mut p5_country_ledger_lines_new = 0u32;
    for (block_number, log_index, block_hash, tx_hash, kind, data, topics, log_address) in logs {
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
                    if let Some(n) = ev_name {
                        if matches!(
                            n,
                            "ProposalCreated"
                                | "VoteCast"
                                | "ProposalQueued"
                                | "ProposalExecuted"
                                | "ProposalCanceled"
                        ) {
                            let data_hex = data_for_fee_parse
                                .as_str()
                                .unwrap_or("0x")
                                .to_string();
                            if let Err(e) = db::apply_governance_projection_from_parsed_event(
                                pool,
                                chain_id_i64,
                                n,
                                &topics,
                                &data_hex,
                            )
                            .await
                            {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "apply_governance_projection_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response();
                            }
                        }
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
                            let router = common::normalize_hex_addr(router_cfg);
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
                            let vault = common::normalize_hex_addr(vault_cfg);
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
            if chain_off::event_name_from_topic0(&kind) == Some("CountryLedgerCredited") {
                if let (Some(ref co), Some(ref ledger_cfg)) = (
                    state.chain_off.as_ref(),
                    config.country_pool_ledger_address.as_ref(),
                ) {
                    let ledger_n = common::normalize_hex_addr(ledger_cfg);
                    let log_n = common::normalize_hex_addr(&log_address);
                    if log_n == ledger_n {
                        if let Some(pool) = co.db_pool.as_ref() {
                            if let Some((jurisdiction_id, token, amount_hex, ref_hex)) =
                                chain::country_ledger::parse_country_ledger_credited(
                                    &topics,
                                    &data_for_fee_parse,
                                )
                            {
                                let chain_id_i64 =
                                    (config.chain_id.min(i64::MAX as u64)) as i64;
                                match db::insert_p5_country_ledger_line(
                                    pool,
                                    chain_id_i64,
                                    block_number as i64,
                                    log_index as i32,
                                    &block_hash,
                                    &tx_hash,
                                    &ledger_n,
                                    &jurisdiction_id,
                                    &token,
                                    1,
                                    &amount_hex,
                                    &ref_hex,
                                    "onchain_credit",
                                )
                                .await
                                {
                                    Ok(true) => p5_country_ledger_lines_new += 1,
                                    Ok(false) => {}
                                    Err(e) => {
                                        return (
                                            StatusCode::INTERNAL_SERVER_ERROR,
                                            Json(crate::api_json::err_key_detail(
                                                "insert_p5_country_ledger_line_failed",
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
            // B-115-4：`RegionShareSnapshotLine` 与 RegionVault 同址 `eth_getLogs` 可合并；物化 `region_share_snapshot_lines`
            if let Some((epoch, region_id, recipient, snap_block, share_hex)) =
                chain::indexer::parse_region_share_snapshot_line(&topics, &data_for_fee_parse)
            {
                if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
                    let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                    match db::insert_region_share_snapshot_line(
                        pool,
                        chain_id_i64,
                        &region_id,
                        epoch,
                        &recipient,
                        snap_block,
                        &share_hex,
                    )
                    .await
                    {
                        Ok(Some(_)) => region_share_snapshot_lines_new += 1,
                        Ok(None) => {}
                        Err(e) => {
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key_detail(
                                    "insert_region_share_snapshot_line_failed",
                                    e.to_string(),
                                )),
                            )
                                .into_response();
                        }
                    }
                }
            }
            if let Some(ref co) = state.chain_off {
                if let Some(event_name) = chain_off::event_name_from_topic0(&kind) {
                    if !matches!(
                        event_name,
                        "PlatformFeeRouted"
                            | "RegionVaultForwarded"
                            | "CountryLedgerCredited"
                            | "RegionShareSnapshotLine"
                    ) {
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
                                            let fallback_status =
                                                chain_off::order_state_to_str(order.state);
                                            let projection_status =
                                                if event_name == "ResolutionExecuted" {
                                                    chain::resolution_tx::orders_projection_status_for_resolution_executed_event(
                                                        Some(config.rpc_url.as_str()),
                                                        &tx_hash,
                                                        fallback_status,
                                                    )
                                                    .await
                                                } else {
                                                    fallback_status
                                                };
                                            if chain::indexer::allow_orders_projection_funds_terminal_write(
                                                event_name,
                                                block_number,
                                                latest,
                                                state.finality_n,
                                            ) {
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
                                                        projection_status,
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
    }
    let mut investor_share_transfer_events_new = 0u32;
    let mut investor_stake_state_events_new = 0u32;
    let mut investor_lock_state_events_new = 0u32;
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
                        let token_n = common::normalize_hex_addr(&ev.token_address);
                        let from_n = common::normalize_hex_addr(&ev.from_address);
                        let to_n = common::normalize_hex_addr(&ev.to_address);
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
    let staking_trimmed = config
        .staking_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if let Some(staking_raw) = staking_trimmed.as_ref() {
        if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
            let staking_n = common::normalize_hex_addr(staking_raw);
            match chain::indexer::fetch_staking_state_logs(
                &config.rpc_url,
                &staking_n,
                from_block,
                to_block,
            )
            .await
            {
                Ok(fetched) => {
                    let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                    for ev in fetched {
                        let user_n = common::normalize_hex_addr(&ev.user_address);
                        let sc_n = common::normalize_hex_addr(&ev.staking_contract_address);
                        match db::insert_investor_stake_state_event(
                            pool,
                            chain_id_i64,
                            ev.block_number as i64,
                            ev.log_index as i32,
                            &ev.block_hash,
                            &ev.tx_hash,
                            &sc_n,
                            &user_n,
                            &ev.event_kind,
                            &ev.amount_u256_hex,
                        )
                        .await
                        {
                            Ok(n) if n > 0 => investor_stake_state_events_new += 1,
                            Ok(_) => {}
                            Err(e) => {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_investor_stake_state_event_failed",
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
                                format!("staking_contract: {}", e),
                            )),
                        )
                            .into_response();
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "staking_contract",
                        "error": e
                    }));
                }
            }
        }
    }
    let lock_addrs: Vec<String> = config
        .investor_lock_contract_addresses
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if !lock_addrs.is_empty() {
        if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
            let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
            for lock_raw in &lock_addrs {
                let lock_n = common::normalize_hex_addr(lock_raw);
                match chain::indexer::fetch_investor_lock_state_logs(
                    &config.rpc_url,
                    &lock_n,
                    from_block,
                    to_block,
                )
                .await
                {
                    Ok(fetched) => {
                        for ev in fetched {
                            let user_n = common::normalize_hex_addr(&ev.user_address);
                            let lc_n = common::normalize_hex_addr(&ev.lock_contract_address);
                            match db::insert_investor_lock_state_event(
                                pool,
                                chain_id_i64,
                                ev.block_number as i64,
                                ev.log_index as i32,
                                &ev.block_hash,
                                &ev.tx_hash,
                                &lc_n,
                                &user_n,
                                &ev.event_kind,
                                &ev.amount_u256_hex,
                            )
                            .await
                            {
                                Ok(n) if n > 0 => investor_lock_state_events_new += 1,
                                Ok(_) => {}
                                Err(e) => {
                                    return (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(crate::api_json::err_key_detail(
                                            "insert_investor_lock_state_event_failed",
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
                                    format!("investor_lock_contract: {}", e),
                                )),
                            )
                                .into_response();
                        }
                        logs_fetch_skipped.push(json!({
                            "scope": "investor_lock_contract",
                            "address": lock_n,
                            "error": e
                        }));
                    }
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
        "investor_stake_state_events_new": investor_stake_state_events_new,
        "investor_lock_state_events_new": investor_lock_state_events_new,
        "region_share_snapshot_lines_new": region_share_snapshot_lines_new,
        "p5_country_ledger_lines_new": p5_country_ledger_lines_new,
        "from_block": from_block,
        "to_block": to_block,
        "chain_tip": latest,
        "finality_n": state.finality_n,
        "finality_n_used": state.finality_n,
        "indexer_finalized_upper_bound": to_block
    });
    if let Some(rew) = reorg_auto_rewind {
        body["reorg_auto_rewind"] = rew;
    }
    if !logs_fetch_skipped.is_empty() {
        body["logs_fetch_skipped"] = json!(logs_fetch_skipped);
    }
    persist_and_attach_b174_tick_fail_skip_obs(
        &state,
        &mut body,
        &logs_fetch_skipped,
        applied,
        events_new,
    )
    .await;
    attach_meta_build_to_tick_ok_body(&mut body);
    (StatusCode::OK, Json(body)).into_response()
}
