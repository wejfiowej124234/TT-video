//! GET `/meta`、`/meta/build`、`/metrics` 处理器。

use axum::{extract::State, response::IntoResponse, Json};
use serde_json::json;
use std::env;
use std::fmt::Write as _;

use crate::middleware;
use crate::state::{any_traveltrust_strict_db_write, dual_write_failure_policy, ApiMetaState};
use traveltrust_core::FEE_ROUTE_COUNTRY_SSOT_FIELD;

use super::*;

pub(super) async fn meta_build_only() -> Json<serde_json::Value> {
    Json(meta_build_value())
}

/// GET /meta: 版本与运行时默认配置快照（用于 08 drift/evidence 与 FE 版本绑定）；§8.2 暴露 database_connected（55 优化）
pub(super) async fn meta(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let database_connected = state
        .chain_off
        .as_ref()
        .and_then(|co| co.db_pool.as_ref())
        .is_some();
    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox_worker_enabled = env::var("OUTBOX_WORKER").as_deref() == Ok("1");
    let outbox_lease_secs: u64 = env::var("OUTBOX_LEASE_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60);
    let outbox_poll_ms: u64 = env::var("OUTBOX_POLL_MS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(500);
    let outbox_max_attempts: u64 = env::var("OUTBOX_MAX_ATTEMPTS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10);
    let chain_id = env::var("CHAIN_ID").unwrap_or_else(|_| "137".to_string());
    let build = meta_build_value();
    let chain_contracts = state.chain_config.as_ref().map(|c| {
        let steward_pool = crate::chain::steward_stake_pool::region_steward_stake_pool_address();
        json!({
            "guide_staking_address": c.guide_staking_address.as_ref().or(c.staking_address.as_ref()),
            "staking_provider_address": &c.staking_provider_address,
            "governor_address": &c.governor_address,
            "timelock_address": &c.governance_timelock_address,
            "governance_token_address": &c.governance_votes_token_address,
            "fee_router_address": c.escrow_platform_fee_recipient(),
            "treasury_address": c.treasury_address.as_ref().or(c.region_vault_address.as_ref()),
            "registry_address": &c.registry_address,
            "escrow_factory_address": &c.escrow_factory_address,
            "region_steward_stake_pool_address": steward_pool.as_ref(),
            "rule": "仅当 CHAIN_RPC_URL 等已加载 ChainConfig 时有值；guide_staking_address 与 STAKING_ADDRESS/GUIDE_STAKING_ADDRESS 同源；staking_provider_address 与 STAKING_PROVIDER_ADDRESS 同源；governance_token_address 与 GOVERNANCE_VOTES_TOKEN_ADDRESS/GOVERNANCE_TOKEN_ADDRESS 同源；registry_address/escrow_factory_address 与 REGISTRY_ADDRESS/ESCROW_FACTORY_ADDRESS 同源；region_steward_stake_pool_address 与 REGION_STEWARD_STAKE_POOL_ADDRESS 同源；FEE_ROUTER_ADDRESS 设后 indexer-tick 拉取 PlatformFeeRouted；GOVERNOR_ADDRESS 设后拉取 Governor 事件（B-089）；前端 NEXT_PUBLIC_* 须与部署一致"
        })
    });

    let mut indexer_memory = if let Some(ref h) = state.indexer_state {
        let g = h.read().await;
        json!({
            "available": true,
            "last_block": g.last_block,
            "last_log_index": g.last_log_index,
            "last_block_hash_prefix": block_hash_prefix_json(&g.last_block_hash),
            "events_cached": g.events.len(),
        })
    } else {
        json!({
            "available": false,
            "last_block": serde_json::Value::Null,
            "last_log_index": serde_json::Value::Null,
            "last_block_hash_prefix": serde_json::Value::Null,
            "events_cached": serde_json::Value::Null,
        })
    };
    if let Some(m) = indexer_memory.as_object_mut() {
        m.insert(
            "rule".to_string(),
            serde_json::Value::String(
                "进程内 indexer 句柄快照（available/last_block/last_log_index/last_block_hash_prefix/events_cached）；727 indexer.memory 与 indexer.checkpoint 在 source=runtime 时同源；757 GET /meta indexer.memory 对象 indexer_memory_top_keys / indexer_memory_top_keys_contract_757 与 INDEXER_MEMORY_META_TOP_KEYS 八键顺序同源；758 indexer.checkpoint 机读键序见 indexer_checkpoint_top_keys".to_string(),
            ),
        );
        let keys757: serde_json::Value = serde_json::to_value(INDEXER_MEMORY_META_TOP_KEYS)
            .expect("INDEXER_MEMORY_META_TOP_KEYS serializes to JSON array");
        m.insert("indexer_memory_top_keys".to_string(), keys757);
        m.insert(
            "indexer_memory_top_keys_contract_757".to_string(),
            serde_json::Value::String(format_indexer_memory_meta_top_keys_contract_757()),
        );
    }

    let (cp_block, cp_log, checkpoint_source) = state.indexer_checkpoint_for_observability().await;

    let mut indexer_checkpoint = json!({
        "block_number": cp_block,
        "log_index": cp_log,
        "source": checkpoint_source,
    });
    if let Some(cp) = indexer_checkpoint.as_object_mut() {
        cp.insert(
            "rule".to_string(),
            serde_json::Value::String(
                "与 orders chain_sync.checkpoint、metrics traveltrust_indexer_checkpoint_* 同源；source=runtime 时 block/log 与 indexer.memory 同源；758 GET /meta indexer.checkpoint 对象 indexer_checkpoint_top_keys / indexer_checkpoint_top_keys_contract_758 与 INDEXER_CHECKPOINT_META_TOP_KEYS 六键顺序同源"
                    .to_string(),
            ),
        );
        let keys758: serde_json::Value = serde_json::to_value(INDEXER_CHECKPOINT_META_TOP_KEYS)
            .expect("INDEXER_CHECKPOINT_META_TOP_KEYS serializes to JSON array");
        cp.insert("indexer_checkpoint_top_keys".to_string(), keys758);
        cp.insert(
            "indexer_checkpoint_top_keys_contract_758".to_string(),
            serde_json::Value::String(format_indexer_checkpoint_meta_top_keys_contract_758()),
        );
    }

    let minimal_body_note_stable_714 = format!(
        "**714**：非 **chain_off** 最小成功体根级 **`note`** **稳定句**（**705** **`chainSyncNote`** **同源**）：**`{}`**",
        crate::routes::orders::CHAIN_SYNC_MINIMAL_BODY_NOTE
    );

    let s715 = crate::routes::orders::CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS;
    let success_body_envelope_status_715 = format!(
        "**715**：**200** 成功体根级 **`status`** **字面 **`{}`**（**与 **`chain_sync.status`** **三值** **区分**；前端 **`parseOrderChainSyncResponse`**** **非 **`{}`** **则 **`null`**）",
        s715, s715
    );
    let k716 = crate::routes::orders::CHAIN_SYNC_REQUIRED_TOP_KEYS;
    let chain_sync_required_top_keys_716 = format!(
        "**716**：**200** **`chain_sync`** **必有 **`{}`****、**`{}`****、**`{}`****、**`{}`**（**`checkpoint`**：**`block_number`****/**`log_index`****/**`source`**；**`last_event`**：**chain_off** **非 **null** **对象** **/** **非 chain_off** **JSON **`null`**；**703** **可附加 **`event_log_snapshot`** **或 **`event_log_snapshot_absent_reason`**）",
        k716[0], k716[1], k716[2], k716[3]
    );
    let mp717 = crate::routes::orders::CHAIN_SYNC_STATUS_METHOD_AND_PATH;
    let rp717 = crate::routes::orders::CHAIN_SYNC_ROUTE_PATH;
    let method_path_contract_717 = format!(
        "**717**：**`method_path`**=**`{}`** **与 **`orders::CHAIN_SYNC_STATUS_METHOD_AND_PATH`** **及 **`router`**** **`.route`**** **`{}`** **同源**",
        mp717, rp717
    );

    let hc718 = crate::routes::orders::CHAIN_SYNC_STATUS_HANDLER_CODE;
    let code_contract_718 = format!(
        "**718**：**`code`**=**`{}`** **与 **`orders::CHAIN_SYNC_STATUS_HANDLER_CODE`** **及 **`get_order_chain_sync_status`** **实现** **锚点** **同源**",
        hc718
    );

    let sv719 = crate::routes::orders::CHAIN_SYNC_STATUS_VALUES;
    let status_values_contract_719 = format!(
        "**719**：**`status_values`** **[**`{}`****, **`{}`****, **`{}`**]** **与 **`orders::CHAIN_SYNC_STATUS_VALUES`** **及 **`713`**** **`chain_sync_status_enum`** **同源**",
        sv719[0], sv719[1], sv719[2]
    );

    let ar720 = crate::routes::orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS;
    let absent_reason_values_contract_720 = format!(
        "**720**：**`absent_reason_values`** **[**`{}`****, **`{}`****, **`{}`****, **`{}`****, **`{}`**]** **与 **`orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS`** **及 **`703`**** **`optional_event_log_snapshot_absent_reason`** **同源**",
        ar720[0], ar720[1], ar720[2], ar720[3], ar720[4]
    );
    let optional_event_log_snapshot_absent_reason_703 = format!(
        "**703**：无 **event_log_snapshot** 时 **chain_sync.event_log_snapshot_absent_reason** 机器键（**720** **`absent_reason_values`** **同源**）：**`{}`****/**`{}`****/**`{}`****/**`{}`****（chain_off）；**`{}`**（非 chain_off 最小体）",
        ar720[0], ar720[1], ar720[2], ar720[3], ar720[4]
    );

    let le721 = crate::routes::orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS;
    let last_event_keys_contract_721 = format!(
        "**721**：**`last_event_top_keys`** **[**`{}`****, **`{}`****, **`{}`**]** **与 **`orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS`** **及 **`706`**** **`chain_sync.last_event`** **同源**",
        le721[0], le721[1], le721[2]
    );
    let optional_last_event_706 = format!(
        "**706**：**chain_off** 时 **chain_sync.last_event**（**{}**、**{}**、**{}**）；非 **chain_off** 最小体为 **null**（**721** **`last_event_top_keys`** **同源**）",
        le721[0], le721[1], le721[2]
    );

    let el722 = crate::db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS;
    let event_log_snapshot_keys_contract_722 = format!(
        "**722**：**`event_log_snapshot_top_keys`** **[**`{}`****, **`{}`****, **`{}`****, **`{}`****, **`{}`****, **`{}`**]** **与 **`db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS`** **及 **`escrow_event_finality_snapshot_to_json`** **及 **`702`**** **`chain_sync.event_log_snapshot`** **同源**",
        el722[0], el722[1], el722[2], el722[3], el722[4], el722[5]
    );
    let optional_event_log_snapshot_702 = format!(
        "**702**：**DATABASE_URL** + **event_log** **命中** **时 **`chain_sync.event_log_snapshot`**（**`db::latest_escrow_event_finality_for_order`** → **`escrow_event_finality_snapshot_to_json`**；**722** **`event_log_snapshot_top_keys`** **同源**）：**`{}`****/**`{}`****/**`{}`****/**`{}`****/**`{}`****/**`{}`**；**`tx_hash`****/**`block_hash`** **`event_log`**** **列 **encode** **0x** **hex**，列空则 **null**",
        el722[0], el722[1], el722[2], el722[3], el722[4], el722[5]
    );

    let cp723 = crate::routes::orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS;
    let checkpoint_keys_contract_723 = format!(
        "**723**：**order_chain_sync_status.checkpoint_top_keys** **与 **`orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS`** **同源（顺序 **`{}`****→**`{}`****→**`{}`**）",
        cp723[0], cp723[1], cp723[2]
    );
    let chain_sync_checkpoint_710 = format!(
        "**710**：成功体 **`chain_sync.checkpoint`**（**`state.indexer_checkpoint`** 写入；与 **`GET /meta.indexer.checkpoint`** 同源对读；非 **chain_off** 最小体同形；**723** **`checkpoint_top_keys`** **同源**）：**`{}`****→**`{}`****→**`{}`**",
        cp723[0], cp723[1], cp723[2]
    );

    let cs724 = crate::routes::orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES;
    let checkpoint_source_values_contract_724 = format!(
        "**724**：**`checkpoint_source_values`** **与 **`orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES`** **同源（**`{}`****∥**`{}`**）",
        cs724[0], cs724[1]
    );
    let chain_sync_checkpoint_source_712 = format!(
        "**712**：成功体 **`chain_sync.checkpoint.source`** 与 **`GET /meta.indexer.checkpoint.source`** **同源**（**724** **`checkpoint_source_values`** **同源**：**`{}`****∥**`{}`**；与 **710** block/log 对读）",
        cs724[0], cs724[1]
    );

    let mut indexer_finality_discipline = json!({
        "tick_logs_upper_bound": "chain_tip - max(1, finality_n)",
        "postgres_event_log_has_finality_n_used": true,
        "order_chain_sync_status": {
            "method_path": crate::routes::orders::CHAIN_SYNC_STATUS_METHOD_AND_PATH,
            "method_path_contract_717": method_path_contract_717,
            "status_values": crate::routes::orders::CHAIN_SYNC_STATUS_VALUES,
            "status_values_contract_719": status_values_contract_719,
            "absent_reason_values": crate::routes::orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS,
            "absent_reason_values_contract_720": absent_reason_values_contract_720,
            "code": crate::routes::orders::CHAIN_SYNC_STATUS_HANDLER_CODE,
            "code_contract_718": code_contract_718,
            "event_log_snapshot_top_keys": crate::db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS,
            "event_log_snapshot_keys_contract_722": event_log_snapshot_keys_contract_722,
            "optional_event_log_snapshot": optional_event_log_snapshot_702,
            "optional_event_log_snapshot_absent_reason": optional_event_log_snapshot_absent_reason_703,
            "last_event_top_keys": crate::routes::orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS,
            "last_event_keys_contract_721": last_event_keys_contract_721,
            "checkpoint_top_keys": crate::routes::orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS,
            "checkpoint_keys_contract_723": checkpoint_keys_contract_723,
            "checkpoint_source_values": crate::routes::orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES,
            "checkpoint_source_values_contract_724": checkpoint_source_values_contract_724,
            "optional_last_event": optional_last_event_706,
            "success_body_order_id": "**707**：**200 **`status=ok`** 根级 **`order_id`**（路径参数回响，UUID 字符串）",
            "success_body_envelope_status": success_body_envelope_status_715,
            "chain_sync_required_top_keys": chain_sync_required_top_keys_716,
            "minimal_body_requester": "**708**：非 **chain_off** 最小成功体根级 **`requester`**（当前会话用户 UUID，与 **`note`**/**`order_id`** 同批）",
            "minimal_body_chain_sync_status_unknown": "**709**：非 **chain_off** 最小成功体 **`chain_sync.status`**=`**unknown**`（与 **`event_log_snapshot_absent_reason`**=`projection_backend_unavailable` **同批**）",
            "chain_sync_checkpoint": chain_sync_checkpoint_710,
            "chain_sync_finality_n": "**711**：成功体 **`chain_sync.finality_n`** 与 **`GET /meta.finality_n`**、**`GET /meta.indexer.finality_n`** **同源**（**FINALITY_N**；与 **`event_log_snapshot.finality_n_used`** 对读见 **110 §3.3**）",
            "chain_sync_checkpoint_source": chain_sync_checkpoint_source_712,
            "chain_sync_status_enum": "**713**：成功体 **`chain_sync.status`** **仅** **`pending`****/**`confirmed`****/**`unknown`**（与上列 **`status_values`** **同源**；**chain_off** 为 **pending**/**confirmed**；非 **chain_off** 最小体 **unknown**）",
            "minimal_body_note_stable": minimal_body_note_stable_714,
            "rule": "110 §3.3 Partial：订单级 pending/confirmed 读模型；可选 **event_log_snapshot**（**finality_n_used**、**block_number**、**log_index**、**event_type**、**702** **tx_hash**/**block_hash**）；**722** **`event_log_snapshot_top_keys`**/**`event_log_snapshot_keys_contract_722`** **与 **`db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS`** **`702`**** **`chain_sync.event_log_snapshot`** **六键** **同源**；**703** **absent_reason** 可观测性；**720** **`absent_reason_values`**/**`absent_reason_values_contract_720`** **与 **`orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS`** **`703`**** **`event_log_snapshot_absent_reason`** **五键** **同源**；**721** **`last_event_top_keys`**/**`last_event_keys_contract_721`** **与 **`orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS`** **`706`**** **`chain_sync.last_event`** **三键** **同源**；**723** **`checkpoint_top_keys`**/**`checkpoint_keys_contract_723`** **与 **`orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS`** **`710`**** **`chain_sync.checkpoint`** **三键** **同源**；**724** **`checkpoint_source_values`**/**`checkpoint_source_values_contract_724`** **与 **`orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES`** **`712`**** **`chain_sync.checkpoint.source`** **二值** **同源**；**725** **`order_chain_sync_status_top_keys`**/**`order_chain_sync_status_top_keys_contract_725`** **与 **`orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS`** **32** **顶层键** **顺序** **同源**；**706** **last_event**（chain_off）；**707** 成功体根级 **order_id**；**715** 成功体根级 **`status`** **`ok`** **信封**；**716** **`chain_sync`** **四顶层键**；**717** **`method_path`** **与 **`router`**** **`.route`** **同源**；**718** **`code`**/**`code_contract_718`** **与 **`orders::CHAIN_SYNC_STATUS_HANDLER_CODE`** **`get_order_chain_sync_status`** **锚点** **同源**；**719** **`status_values`**/**`status_values_contract_719`** **与 **`orders::CHAIN_SYNC_STATUS_VALUES`** **`713`**** **`chain_sync.status`** **三值** **同源**；**708** 最小体 **requester**；**709** 最小体 **`chain_sync.status`** **unknown**；**710** **`chain_sync.checkpoint`**；**711** **`chain_sync.finality_n`**；**712** **`chain_sync.checkpoint.source`**；**713** **`chain_sync.status`** **枚举**；**714** 最小体根级 **`note`** **稳定句**；全量 pending vs finalized 双视图 API 仍为 Target"
        },
        "chain_tip_not_in_meta": true,
        "chain_tip_hint": "Use POST /api/v1/internal/indexer-tick response chain_tip or external RPC; GET /meta avoids RPC per request"
    });
    if let Some(fd) = indexer_finality_discipline.as_object_mut() {
        if let Some(ocs) = fd
            .get_mut("order_chain_sync_status")
            .and_then(|v| v.as_object_mut())
        {
            let rule = ocs
                .remove("rule")
                .expect("order_chain_sync_status.rule must be present for 725 patch");
            let top_keys_val: serde_json::Value =
                serde_json::to_value(crate::routes::orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS)
                    .expect("ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS serializes to JSON array");
            let contract_725 =
                crate::routes::orders::format_order_chain_sync_status_meta_top_keys_contract_725();
            ocs.insert("order_chain_sync_status_top_keys".to_string(), top_keys_val);
            ocs.insert(
                "order_chain_sync_status_top_keys_contract_725".to_string(),
                serde_json::Value::String(contract_725),
            );
            ocs.insert("rule".to_string(), rule);
        }
        let fd726_keys: serde_json::Value = serde_json::to_value(FINALITY_DISCIPLINE_META_TOP_KEYS)
            .expect("FINALITY_DISCIPLINE_META_TOP_KEYS serializes to JSON array");
        fd.insert("finality_discipline_top_keys".to_string(), fd726_keys);
        fd.insert(
            "finality_discipline_top_keys_contract_726".to_string(),
            serde_json::Value::String(format_finality_discipline_meta_top_keys_contract_726()),
        );
    }

    let mut indexer_section = json!({
        "state_path": state.indexer_state_path,
        "checkpoint": indexer_checkpoint,
        "last_seen_finality_n": state.indexer_last_seen_finality_n,
        "replay_required": state.indexer_replay_required,
        "lag_blocks": state.indexer_lag_blocks,
        "lag_max_blocks": state.indexer_lag_max_blocks,
        "reorg_detected": state.reorg_detected,
        "finality_n": state.finality_n,
        "memory": indexer_memory,
        "finality_discipline": indexer_finality_discipline,
        "rule": "110 §3.3 Partial：finality_n 与根字段同源（FINALITY_N）；indexer-tick 仅拉取至 chain_tip−max(1,FINALITY_N)；checkpoint 单调；reorg 全量回滚仍为 Target；lag/reorg 时见 authority.degraded_mode；indexer.checkpoint.source=runtime 时与 indexer.memory 同源；无句柄时为 startup_snapshot；indexer.finality_discipline 为 pending/confirmed 口径说明（无链上 tip）；726 finality_discipline_top_keys / finality_discipline_top_keys_contract_726 与 FINALITY_DISCIPLINE_META_TOP_KEYS 七键顺序同源；727 indexer_top_keys / indexer_top_keys_contract_727 与 INDEXER_META_TOP_KEYS 十三键顺序同源；757 indexer.memory indexer_memory_top_keys / indexer_memory_top_keys_contract_757 与 INDEXER_MEMORY_META_TOP_KEYS 八键顺序同源；758 indexer.checkpoint indexer_checkpoint_top_keys / indexer_checkpoint_top_keys_contract_758 与 INDEXER_CHECKPOINT_META_TOP_KEYS 六键顺序同源",
    });
    if let Some(idx) = indexer_section.as_object_mut() {
        let keys727: serde_json::Value = serde_json::to_value(INDEXER_META_TOP_KEYS)
            .expect("INDEXER_META_TOP_KEYS serializes to JSON array");
        idx.insert("indexer_top_keys".to_string(), keys727);
        idx.insert(
            "indexer_top_keys_contract_727".to_string(),
            serde_json::Value::String(format_indexer_meta_top_keys_contract_727()),
        );
    }

    let chain_off_mounted_dr = state.chain_off.is_some();
    let did_rank_penalty =
        did_rank_guides_community_penalty_exclusion(chain_off_mounted_dr, database_connected);
    let mut did_rank_section = json!({
        "strict_db_write": false,
        "dual_write_order": "GET /meta did_rank is read-only observation of chain_off mount and db_pool; ranking JSON is served by GET /api/v1/did-rank/* (routes/did_rank.rs), not this block; guides_community_penalty_exclusion explains guides list filtering vs community_penalties (685)",
        "rule": "有 chain_off.db_pool 时 guides 社区处罚剔除生效：PostgreSQL list_guides_did_rank_* 内联 NOT EXISTS，或 list_guides_did_rank 失败时 list_subject_user_ids_excluded_from_did_rank_guides 过滤内存榜（批 685）；仅 chain_off 无 db_pool 时不读 community_penalties；无 chain_off 时 guides 为空+note（routes/did_rank.rs）；747 GET /meta did_rank 对象 did_rank_top_keys / did_rank_top_keys_contract_747 与 DID_RANK_META_TOP_KEYS 八键顺序同源",
        "chain_off_mounted": chain_off_mounted_dr,
        "chain_off_db_pool": database_connected,
        "guides_community_penalty_exclusion": did_rank_penalty,
    });
    if let Some(dr) = did_rank_section.as_object_mut() {
        let keys747: serde_json::Value = serde_json::to_value(DID_RANK_META_TOP_KEYS)
            .expect("DID_RANK_META_TOP_KEYS serializes to JSON array");
        dr.insert("did_rank_top_keys".to_string(), keys747);
        dr.insert(
            "did_rank_top_keys_contract_747".to_string(),
            serde_json::Value::String(format_did_rank_meta_top_keys_contract_747()),
        );
    }

    let mut product_roles_section = product_roles_meta_obs_json();
    if let Some(pr) = product_roles_section.as_object_mut() {
        let keys748: serde_json::Value = serde_json::to_value(PRODUCT_ROLES_META_TOP_KEYS)
            .expect("PRODUCT_ROLES_META_TOP_KEYS serializes to JSON array");
        pr.insert("product_roles_top_keys".to_string(), keys748);
        pr.insert(
            "product_roles_top_keys_contract_748".to_string(),
            serde_json::Value::String(format_product_roles_meta_top_keys_contract_748()),
        );
    }

    let mut auth_registration_section = auth_registration_meta_obs_json();
    if let Some(reg) = auth_registration_section.as_object_mut() {
        let keys749: serde_json::Value = serde_json::to_value(AUTH_REGISTRATION_META_TOP_KEYS)
            .expect("AUTH_REGISTRATION_META_TOP_KEYS serializes to JSON array");
        reg.insert("auth_registration_top_keys".to_string(), keys749);
        reg.insert(
            "auth_registration_top_keys_contract_749".to_string(),
            serde_json::Value::String(format_auth_registration_meta_top_keys_contract_749()),
        );
    }

    let mut chain_section = json!({
            "chain_id": chain_id,
            "contracts": chain_contracts,
            "rule": "与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐；contracts 见 ChainConfig；759：ChainConfig 挂载且 contracts 非 null 时 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 与 CHAIN_CONTRACTS_META_TOP_KEYS 十键顺序同源；760：GET /meta database 对象 database_top_keys / database_top_keys_contract_760 与 DATABASE_META_TOP_KEYS 四键顺序同源，database.connected 与根级 database_connected 布尔同源；762：GET /meta rate_limits.guide_upload 对象 guide_upload_top_keys / guide_upload_top_keys_contract_761 与 GUIDE_UPLOAD_META_TOP_KEYS 五键顺序同源（761 子树机读互链）；763：GET /meta 根级 service（traveltrust-api）与 api_version（CARGO_PKG_VERSION）为实例版本可观测锚点，与 META_ROOT_TOP_KEYS 首二键 service→api_version 及 728 meta_top_keys 机读同源；765：GET /meta 根级 build 对象 build_top_keys / build_top_keys_contract_730 与 META_BUILD_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第三键 build 及 728 meta_top_keys 机读同源；766：GET /meta 根级 chain 对象 chain_top_keys / chain_top_keys_contract_729 与 CHAIN_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读同源；767：GET /meta 根级 rate_limits 对象 rate_limits_top_keys / rate_limits_top_keys_contract_756 与 RATE_LIMITS_META_TOP_KEYS 十五键顺序同源，与 META_ROOT_TOP_KEYS 第五键 rate_limits 及 728 meta_top_keys 机读同源；768：GET /meta 根级 database_connected 与 database.connected 及 DATABASE_META_TOP_KEYS 首键 connected 布尔同源，与 META_ROOT_TOP_KEYS 第六键 database_connected 及 728 meta_top_keys 机读同源；769：GET /meta 根级 database 对象 database_top_keys / database_top_keys_contract_760 与 DATABASE_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第七键 database 及 728 meta_top_keys 机读同源；770：GET /meta 根级 dual_write 对象 dual_write_top_keys / dual_write_top_keys_contract_732 与 DUAL_WRITE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第八键 dual_write 及 728 meta_top_keys 机读同源；771：GET /meta 根级 strict_mode 对象 strict_mode_top_keys / strict_mode_top_keys_contract_731 与 STRICT_MODE_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第九键 strict_mode 及 728 meta_top_keys 机读同源；772：GET /meta 根级 ssot_version 与 strict_mode.rule 中「strict_ssot 与 GET /meta.ssot_version 及启动 STRICT_SSOT 同源」一致，与 META_ROOT_TOP_KEYS 第十键 ssot_version 及 728 meta_top_keys 机读同源；733 GET /meta ssot 对象 ssot_top_keys / ssot_top_keys_contract_733 与 SSOT_META_TOP_KEYS 七键顺序同源；773：GET /meta 根级 admin_exports 对象 admin_exports_top_keys / admin_exports_top_keys_contract_734 与 ADMIN_EXPORTS_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十键 admin_exports 及 728 meta_top_keys 机读同源；774：GET /meta 根级 chargeback_policy 对象 chargeback_policy_top_keys / chargeback_policy_top_keys_contract_735 与 CHARGEBACK_POLICY_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第十三键 chargeback_policy 及 728 meta_top_keys 机读同源；775：GET /meta 根级 finality_n 与 FINALITY_N 及 GET /meta.indexer.finality_n 同源，与 META_ROOT_TOP_KEYS 第十四键 finality_n 及 728 meta_top_keys 机读同源；776：GET /meta 根级 indexer 对象 indexer_top_keys / indexer_top_keys_contract_727 与 INDEXER_META_TOP_KEYS 十三键顺序同源，与 META_ROOT_TOP_KEYS 第十五键 indexer 及 728 meta_top_keys 机读同源；777：GET /meta 根级 authority 对象 authority_top_keys / authority_top_keys_contract_736 与 AUTHORITY_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十六键 authority 及 728 meta_top_keys 机读同源；778：GET /meta 根级 pause 对象 pause_top_keys / pause_top_keys_contract_737 与 PAUSE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十七键 pause 及 728 meta_top_keys 机读同源；779：GET /meta 根级 evidence 对象 evidence_top_keys / evidence_top_keys_contract_738 与 EVIDENCE_META_TOP_KEYS 九键顺序同源，与 META_ROOT_TOP_KEYS 第十八键 evidence 及 728 meta_top_keys 机读同源；780：GET /meta 根级 order_messages 对象 order_messages_top_keys / order_messages_top_keys_contract_739 与 ORDER_MESSAGES_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第十九键 order_messages 及 728 meta_top_keys 机读同源；781：GET /meta 根级 reviews 对象 reviews_top_keys / reviews_top_keys_contract_740 与 REVIEWS_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十键 reviews 及 728 meta_top_keys 机读同源；782：GET /meta 根级 dispute_open 对象 dispute_open_top_keys / dispute_open_top_keys_contract_741 与 DISPUTE_OPEN_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十一键 dispute_open 及 728 meta_top_keys 机读同源；783：GET /meta 根级 dispute_resolve 对象 dispute_resolve_top_keys / dispute_resolve_top_keys_contract_742 与 DISPUTE_RESOLVE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十键 dispute_resolve 及 728 meta_top_keys 机读同源；784：GET /meta 根级 itineraries 对象 itineraries_top_keys / itineraries_top_keys_contract_743 与 ITINERARIES_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十三键 itineraries 及 728 meta_top_keys 机读同源；785：GET /meta 根级 orders 对象 orders_top_keys / orders_top_keys_contract_744 与 ORDERS_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第二十四键 orders 及 728 meta_top_keys 机读同源；786：GET /meta 根级 discover 对象 discover_top_keys / discover_top_keys_contract_745 与 DISCOVER_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第二十五键 discover 及 728 meta_top_keys 机读同源；787：GET /meta 根级 product_countries 对象 product_countries_top_keys / product_countries_top_keys_contract_746 与 PRODUCT_COUNTRIES_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第二十六键 product_countries 及 728 meta_top_keys 机读同源；788：GET /meta 根级 did_rank 对象 did_rank_top_keys / did_rank_top_keys_contract_747 与 DID_RANK_META_TOP_KEYS 八键顺序同源，与 META_ROOT_TOP_KEYS 第二十七键 did_rank 及 728 meta_top_keys 机读同源；789：GET /meta 根级 product_roles 对象 product_roles_top_keys / product_roles_top_keys_contract_748 与 PRODUCT_ROLES_META_TOP_KEYS 十键顺序同源，与 META_ROOT_TOP_KEYS 第二十八键 product_roles 及 728 meta_top_keys 机读同源；790：GET /meta 根级 auth 对象 auth_top_keys / auth_top_keys_contract_750 与 AUTH_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十九键 auth 及 728 meta_top_keys 机读同源；791：GET /meta 根级 seed_test_accounts 对象 seed_test_accounts_top_keys / seed_test_accounts_top_keys_contract_751 与 SEED_TEST_ACCOUNTS_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第三十键 seed_test_accounts 及 728 meta_top_keys 机读同源；792：GET /meta 根级 guides 对象 guides_top_keys / guides_top_keys_contract_752 与 GUIDES_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第三十一键 guides 及 728 meta_top_keys 机读同源；807：GET /meta 根级 governance 对象 governance_top_keys / governance_top_keys_contract_807 与 GOVERNANCE_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第三十键 governance 及 728 meta_top_keys 机读同源（TT-B110-SEQ5 TravelTrustGovernor votingDelay/Period/quorumNumeratorBps；SEQ6 GovernanceTimelock delay() 只读 SSOT）；793：GET /meta 根级 idempotency_cache 对象 idempotency_cache_top_keys / idempotency_cache_top_keys_contract_753 与 IDEMPOTENCY_CACHE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第三十三键 idempotency_cache 及 728 meta_top_keys 机读同源；794：GET /meta 根级 defaults 对象 defaults_top_keys / defaults_top_keys_contract_754 与 DEFAULTS_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第三十四键 defaults 及 728 meta_top_keys 机读同源；795：GET /meta 根级 outbox 对象 outbox_top_keys / outbox_top_keys_contract_755 与 OUTBOX_META_TOP_KEYS 八键顺序同源，与 META_ROOT_TOP_KEYS 第三十五键 outbox 及 728 meta_top_keys 机读同源；796：GET /meta 根级 meta_top_keys JSON 数组与 META_ROOT_TOP_KEYS 三十七键顺序同源，根级 meta_top_keys_contract_728 机读与 728 contract 同源，与 META_ROOT_TOP_KEYS 第三十六键 meta_top_keys 机读互链；797：GET /meta 根级 meta_top_keys_contract_728 与 META_ROOT_TOP_KEYS 第三十七键 meta_top_keys_contract_728 机读同源，与 728 contract、META_ROOT_TOP_KEYS 第三十六键 meta_top_keys 机读互链；798：GET /meta 根级 meta_top_keys JSON 数组三十七项与 META_ROOT_TOP_KEYS 三十七键顺序逐项同源，meta_top_keys_contract_728 嵌入三十七键字面顺序同源，796 与 797 与文末 728 句链式互证；799：798 句与文末 728 句机读相邻互锁，双锚根级 meta_top_keys JSON 数组三十七项与 META_ROOT_TOP_KEYS 三十七键及 meta_top_keys_contract_728 字面顺序同源闭环；800：799 双锚闭环与 GET /meta chain 对象 729 chain_top_keys / chain_top_keys_contract_729 及 CHAIN_META_TOP_KEYS 五键机读同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 766 机读句串联互证；801：800 串联与 GET /meta chain.contracts 非 null 时 759 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 及 CHAIN_CONTRACTS_META_TOP_KEYS 十键机读同源，与 799 双锚闭环及 766/729 chain 子树三向互证；802：801 串联与 GET /meta chain.contracts 非 null 时 contracts.rule 嵌入之 759 句与根级 chain.rule 759 及 801 十键机读核心同源，与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 及 801 四向互证；803：802 串联与 800 及 766 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 / CHAIN_META_TOP_KEYS 五键机读同源，与 799 双锚经 729、801、759、802 contracts.rule 根级 chain.rule 759 嵌入形成五向链读闭环，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读六向互证；804：803 六向互证与 GET /meta chain.chain_id 及根级 chain.rule 文首与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐及 contracts 见 ChainConfig 机读同源，七向收束 803 链读至 CHAIN_META_TOP_KEYS 首键 chain_id 部署观测锚，与 chain_top_keys / chain_top_keys_contract_729 及 803 七向互证；805：804 七向互证与 GET /meta chain.contracts 及 CHAIN_META_TOP_KEYS 第二键 contracts 机读同源，八向收束 804 链读至 contracts 部署观测锚与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 十键及 801 三向 802 四向 803 六向串联，与 chain_top_keys / chain_top_keys_contract_729 及 804 八向互证；806：805 八向互证与 GET /meta chain.rule 及 CHAIN_META_TOP_KEYS 第三键 rule 机读同源，九向收束 805 链读至根级 chain.rule 文首与 intents EIP-712 domain、NEXT_PUBLIC_CHAIN_ID、ChainConfig、759 句及 contracts.rule 759 嵌入与 801 三向 802 四向 803 六向 804 七向 805 八向串联，与 chain_top_keys / chain_top_keys_contract_729 及 805 九向互证；728 GET /meta 根级 meta_top_keys / meta_top_keys_contract_728 与 META_ROOT_TOP_KEYS 三十七键顺序同源；729 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 与 CHAIN_META_TOP_KEYS 五键顺序同源"
    });
    if let Some(ch) = chain_section.as_object_mut() {
        let keys729: serde_json::Value = serde_json::to_value(CHAIN_META_TOP_KEYS)
            .expect("CHAIN_META_TOP_KEYS serializes to JSON array");
        ch.insert("chain_top_keys".to_string(), keys729);
        ch.insert(
            "chain_top_keys_contract_729".to_string(),
            serde_json::Value::String(format_chain_meta_top_keys_contract_729()),
        );
        if let Some(cv) = ch.get_mut("contracts") {
            if let Some(co) = cv.as_object_mut() {
                if let Some(rule_v) = co.get_mut("rule") {
                    if let Some(rs) = rule_v.as_str() {
                        let mut extended = rs.to_string();
                        extended.push_str(
                            "；759 GET /meta chain.contracts 对象 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 与 CHAIN_CONTRACTS_META_TOP_KEYS 十三键顺序同源",
                        );
                        *rule_v = serde_json::Value::String(extended);
                    }
                }
                let keys759: serde_json::Value =
                    serde_json::to_value(CHAIN_CONTRACTS_META_TOP_KEYS)
                        .expect("CHAIN_CONTRACTS_META_TOP_KEYS serializes to JSON array");
                co.insert("chain_contracts_top_keys".to_string(), keys759);
                co.insert(
                    "chain_contracts_top_keys_contract_759".to_string(),
                    serde_json::Value::String(format_chain_contracts_meta_top_keys_contract_759()),
                );
            }
        }
    }

    let require_idempotency_key =
        state.strict_ssot || env::var("REQUIRE_IDEMPOTENCY_KEY").as_deref() == Ok("1");
    let strict_session_gate = env::var("STRICT_SESSION_GATE").as_deref() == Ok("1");
    let internal_api_secret_configured = env::var("INTERNAL_API_SECRET")
        .ok()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);

    let mut strict_mode_section = json!({
        "strict_ssot": state.strict_ssot,
        "require_idempotency_key": require_idempotency_key,
        "strict_session_gate": strict_session_gate,
        "internal_api_secret_configured": internal_api_secret_configured,
        "rule": "strict_ssot 与 GET /meta.ssot_version 及启动 STRICT_SSOT 同源；require_idempotency_key = strict_ssot 或 REQUIRE_IDEMPOTENCY_KEY=1；strict_session_gate = STRICT_SESSION_GATE=1（非公开 /api/v1 须 Bearer，04 §7.8）；internal_api_secret_configured 表示 INTERNAL_API_SECRET 非空 trim；731 GET /meta strict_mode 对象 strict_mode_top_keys / strict_mode_top_keys_contract_731 与 STRICT_MODE_META_TOP_KEYS 七键顺序同源"
    });
    if let Some(sm) = strict_mode_section.as_object_mut() {
        let keys731: serde_json::Value = serde_json::to_value(STRICT_MODE_META_TOP_KEYS)
            .expect("STRICT_MODE_META_TOP_KEYS serializes to JSON array");
        sm.insert("strict_mode_top_keys".to_string(), keys731);
        sm.insert(
            "strict_mode_top_keys_contract_731".to_string(),
            serde_json::Value::String(format_strict_mode_meta_top_keys_contract_731()),
        );
    }

    let mut dual_write_section = json!({
        "failure_policy": dual_write_failure_policy(),
        "strict_db_write_any": any_traveltrust_strict_db_write(),
        "rule": "50-O-R1 / Runbook §9：log_only=① 默认（双写失败仅 [audit] 日志）；strict_503=② 须配合 TRAVELTRUST_STRICT_*_DB_WRITE=1 分路径 503；alert_only=③ 外接告警、HTTP 不变。env DUAL_WRITE_FAILURE_POLICY；定稿同步 08-3 变更记录。732 GET /meta dual_write 对象 dual_write_top_keys / dual_write_top_keys_contract_732 与 DUAL_WRITE_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(dw) = dual_write_section.as_object_mut() {
        let keys732: serde_json::Value = serde_json::to_value(DUAL_WRITE_META_TOP_KEYS)
            .expect("DUAL_WRITE_META_TOP_KEYS serializes to JSON array");
        dw.insert("dual_write_top_keys".to_string(), keys732);
        dw.insert(
            "dual_write_top_keys_contract_732".to_string(),
            serde_json::Value::String(format_dual_write_meta_top_keys_contract_732()),
        );
    }

    let mut ssot_section = json!({
        "expected_sha256": state.ssot_sha256_expected,
        "computed_sha256": state.ssot_sha256_computed,
        "match": state.ssot_sha256_match,
        "file": "docs/spec/08-3-参数与门禁表.md",
        "rule": "STRICT_SSOT/CHECK_SSOT=1 时 expected_sha256 必须与 computed_sha256 一致，否则拒绝启动。733 GET /meta ssot 对象 ssot_top_keys / ssot_top_keys_contract_733 与 SSOT_META_TOP_KEYS 七键顺序同源",
    });
    if let Some(ss) = ssot_section.as_object_mut() {
        let keys733: serde_json::Value = serde_json::to_value(SSOT_META_TOP_KEYS)
            .expect("SSOT_META_TOP_KEYS serializes to JSON array");
        ss.insert("ssot_top_keys".to_string(), keys733);
        ss.insert(
            "ssot_top_keys_contract_733".to_string(),
            serde_json::Value::String(format_ssot_meta_top_keys_contract_733()),
        );
    }

    let mut admin_exports_section = json!({
            "reconcile_ed25519_public_key_hex": state.reconcile_export_ed25519_key.as_ref().map(|k| hex::encode(k.verifying_key().to_bytes())),
            "reconcile_ed25519_response_header": "x-traveltrust-reconcile-export-ed25519",
            "rule": "200 §2.1 Partial：设置 RECONCILE_EXPORT_ED25519_SEED_HEX（32 字节 hex）时，GET …/admin/indexer/reconcile-reports/export 对**响应体字节**做 Ed25519 签名；与 x-traveltrust-reconcile-export-sha256 并存；验签用本字段公钥。734 GET /meta admin_exports 对象 admin_exports_top_keys / admin_exports_top_keys_contract_734 与 ADMIN_EXPORTS_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(ae) = admin_exports_section.as_object_mut() {
        let keys734: serde_json::Value = serde_json::to_value(ADMIN_EXPORTS_META_TOP_KEYS)
            .expect("ADMIN_EXPORTS_META_TOP_KEYS serializes to JSON array");
        ae.insert("admin_exports_top_keys".to_string(), keys734);
        ae.insert(
            "admin_exports_top_keys_contract_734".to_string(),
            serde_json::Value::String(format_admin_exports_meta_top_keys_contract_734()),
        );
    }

    let mut chargeback_policy_section = json!({
        "value": state.chargeback_policy,
        "rule": "CHARGEBACK_POLICY 环境变量与启动 STRICT_SSOT 校验同源（08-3 chargebackPolicy 关键 key；unset 时非 strict 可运行、strict 拒绝启动）。735 GET /meta chargeback_policy 对象 chargeback_policy_top_keys / chargeback_policy_top_keys_contract_735 与 CHARGEBACK_POLICY_META_TOP_KEYS 四键顺序同源",
    });
    if let Some(cb) = chargeback_policy_section.as_object_mut() {
        let keys735: serde_json::Value = serde_json::to_value(CHARGEBACK_POLICY_META_TOP_KEYS)
            .expect("CHARGEBACK_POLICY_META_TOP_KEYS serializes to JSON array");
        cb.insert("chargeback_policy_top_keys".to_string(), keys735);
        cb.insert(
            "chargeback_policy_top_keys_contract_735".to_string(),
            serde_json::Value::String(format_chargeback_policy_meta_top_keys_contract_735()),
        );
    }

    let mut authority_section = json!({
            "source": state.authority_source,
            "degraded_mode": state.degraded_mode,
            "rule": "normal=DB投影；indexer落后或reorg=待最终确认(pending_finality)+冻结关键写操作。736 GET /meta authority 对象 authority_top_keys / authority_top_keys_contract_736 与 AUTHORITY_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(au) = authority_section.as_object_mut() {
        let keys736: serde_json::Value = serde_json::to_value(AUTHORITY_META_TOP_KEYS)
            .expect("AUTHORITY_META_TOP_KEYS serializes to JSON array");
        au.insert("authority_top_keys".to_string(), keys736);
        au.insert(
            "authority_top_keys_contract_736".to_string(),
            serde_json::Value::String(format_authority_meta_top_keys_contract_736()),
        );
    }

    let pause_chain = meta_pause_chain_snapshot(state.chain_config.as_ref()).await;
    let mut pause_section = json!({
            "enabled": state.pause_mode,
            "api_allowlist": state.pause_api_allowlist,
            "factory_paused": pause_chain.factory_paused,
            "distribute_paused": pause_chain.distribute_paused,
            "chain_pause_read": {
                "status": pause_chain.read_status,
                "error": pause_chain.read_error,
                "rule": "B-091 TT-COMP-B091: EscrowFactory.factoryPaused + FeeRouter.distributePaused via eth_call when CHAIN_RPC_URL and each contract address are set; null booleans when no on-chain read — do not fabricate true/false (contrast GET …/governance/protocol-reference doc mirror)."
            },
            "rule": "PAUSE_MODE=1 时，除 allowlist 外的写操作一律阻断（防 Pause 变万能开关/滥用）。737 GET /meta pause 对象 pause_top_keys / pause_top_keys_contract_737 与 PAUSE_META_TOP_KEYS 八键顺序同源；链上工厂/费路由暂停见 factory_paused、distribute_paused（B-091）",
    });
    if let Some(pu) = pause_section.as_object_mut() {
        let keys737: serde_json::Value = serde_json::to_value(PAUSE_META_TOP_KEYS)
            .expect("PAUSE_META_TOP_KEYS serializes to JSON array");
        pu.insert("pause_top_keys".to_string(), keys737);
        pu.insert(
            "pause_top_keys_contract_737".to_string(),
            serde_json::Value::String(format_pause_meta_top_keys_contract_737()),
        );
    }

    let mut evidence_section = json!({
        "timestamp_policy": state.evidence_timestamp_policy,
        "time_state_path": state.evidence_time_state_path,
        "receipt_signature": if state.evidence_receipt_hmac_key.is_some() { "hmac_sha256" } else { "unset" },
        "rollback_detection": "monotonic_last_timestamp (persisted)",
        "strict_db_write": env::var("TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: insert evidence_receipts to DB first; on success append dispute hash if applicable; then update chain_off store; if strict_db_write and insert fails → 503 without memory update",
        "rule": "01 §6 / 争议证据：receipt HMAC、时间戳策略与单调回滚检测与实现同源；738 GET /meta evidence 对象 evidence_top_keys / evidence_top_keys_contract_738 与 EVIDENCE_META_TOP_KEYS 九键顺序同源",
    });
    if let Some(ev) = evidence_section.as_object_mut() {
        let keys738: serde_json::Value = serde_json::to_value(EVIDENCE_META_TOP_KEYS)
            .expect("EVIDENCE_META_TOP_KEYS serializes to JSON array");
        ev.insert("evidence_top_keys".to_string(), keys738);
        ev.insert(
            "evidence_top_keys_contract_738".to_string(),
            serde_json::Value::String(format_evidence_meta_top_keys_contract_738()),
        );
    }

    let mut order_messages_section = json!({
        "chain_off_mounted": state.chain_off.is_some(),
        "strict_db_write": env::var("TRAVELTRUST_STRICT_MESSAGE_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: insert_order_message to DB first; then append to chain_off store; strict → 503 message_db_persist_failed without memory update",
        "http_rule": "GET|POST /api/v1/orders/:id/messages require chain_off; if absent → 501 not_implemented (not_impl_json); 04 §3.4 P16",
        "rule": "04 §3.4 P16 / chain_off：GET|POST …/messages 与 http_rule 同源；739 GET /meta order_messages 对象 order_messages_top_keys / order_messages_top_keys_contract_739 与 ORDER_MESSAGES_META_TOP_KEYS 七键顺序同源",
    });
    if let Some(om) = order_messages_section.as_object_mut() {
        let keys739: serde_json::Value = serde_json::to_value(ORDER_MESSAGES_META_TOP_KEYS)
            .expect("ORDER_MESSAGES_META_TOP_KEYS serializes to JSON array");
        om.insert("order_messages_top_keys".to_string(), keys739);
        om.insert(
            "order_messages_top_keys_contract_739".to_string(),
            serde_json::Value::String(format_order_messages_meta_top_keys_contract_739()),
        );
    }

    let mut reviews_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_REVIEW_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: insert_review to DB first (UNIQUE order_id+reviewer_id); then chain_off store; ON CONFLICT loads row for memory sync; strict insert/fetch failure → 503 review_db_persist_failed without memory update",
        "rule": "53 / 04：订单评分双写与 TRAVELTRUST_STRICT_REVIEW_DB_WRITE 同源；740 GET /meta reviews 对象 reviews_top_keys / reviews_top_keys_contract_740 与 REVIEWS_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(rv) = reviews_section.as_object_mut() {
        let keys740: serde_json::Value = serde_json::to_value(REVIEWS_META_TOP_KEYS)
            .expect("REVIEWS_META_TOP_KEYS serializes to JSON array");
        rv.insert("reviews_top_keys".to_string(), keys740);
        rv.insert(
            "reviews_top_keys_contract_740".to_string(),
            serde_json::Value::String(format_reviews_meta_top_keys_contract_740()),
        );
    }

    let mut dispute_open_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: upsert_order (order→Disputed) first per TRAVELTRUST_STRICT_ORDER_DB_WRITE strict path or persist_order_if_db best-effort; then insert_dispute; on TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE insert failure → remove dispute from memory, revert order state, re-persist prior order row → 503 dispute_open_db_persist_failed",
        "rule": "orders_flow/dispute_bilateral_rating.rs open dispute 双写与 TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE 同源；741 GET /meta dispute_open 对象 dispute_open_top_keys / dispute_open_top_keys_contract_741 与 DISPUTE_OPEN_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(d) = dispute_open_section.as_object_mut() {
        let keys741: serde_json::Value = serde_json::to_value(DISPUTE_OPEN_META_TOP_KEYS)
            .expect("DISPUTE_OPEN_META_TOP_KEYS serializes to JSON array");
        d.insert("dispute_open_top_keys".to_string(), keys741);
        d.insert(
            "dispute_open_top_keys_contract_741".to_string(),
            serde_json::Value::String(format_dispute_open_meta_top_keys_contract_741()),
        );
    }

    let mut dispute_resolve_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: memory applies dispute+order first; strict TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE → try_persist_order_to_db (resolved order) then update_dispute_resolved; either DB step failure → rollback_dispute_resolve_memory + best-effort upsert prior order row → 503 dispute_resolve_db_persist_failed; non-strict → persist_order_if_db then best-effort update_dispute_resolved (disputes row may lag on failure)",
        "rule": "chain_off/disputes.rs dispute_resolve_impl 双写与 TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE 同源；742 GET /meta dispute_resolve 对象 dispute_resolve_top_keys / dispute_resolve_top_keys_contract_742 与 DISPUTE_RESOLVE_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(dr) = dispute_resolve_section.as_object_mut() {
        let keys742: serde_json::Value = serde_json::to_value(DISPUTE_RESOLVE_META_TOP_KEYS)
            .expect("DISPUTE_RESOLVE_META_TOP_KEYS serializes to JSON array");
        dr.insert("dispute_resolve_top_keys".to_string(), keys742);
        dr.insert(
            "dispute_resolve_top_keys_contract_742".to_string(),
            serde_json::Value::String(format_dispute_resolve_meta_top_keys_contract_742()),
        );
    }

    let mut itineraries_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_ITINERARY_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "POST /itineraries & /itineraries/custom: insert Draft order+bundle in memory first; when DATABASE_URL set best-effort single-tx upsert_order_tx+insert_itinerary_tx (rollback on failure, memory retains draft, no 503); confirm-final-plan: set snapshot_hash in memory then update_itinerary_snapshot_hash — strict TRAVELTRUST_STRICT_ITINERARY_DB_WRITE failure clears snapshot_hash → 503 itinerary_db_persist_failed; PATCH /orders/:id/itinerary: apply bundle changes in memory then update_itinerary_days_breakdown_version — strict failure restores prior bundle → 503 itinerary_db_persist_failed; non-strict PATCH/create paths may leave DB lagging memory",
        "rule": "confirm-final-plan: snapshot_hash UPDATE fails → clear snapshot in memory → 503 itinerary_db_persist_failed; PATCH itinerary: UPDATE fails → restore prior bundle → 503; chain_off/itineraries.rs itinerary_create_impl/itinerary_custom_create_impl 与 chain_off/orders.rs confirm_final_plan_impl、patch_order_itinerary_impl 双写与 TRAVELTRUST_STRICT_ITINERARY_DB_WRITE 同源；743 GET /meta itineraries 对象 itineraries_top_keys / itineraries_top_keys_contract_743 与 ITINERARIES_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(it) = itineraries_section.as_object_mut() {
        let keys743: serde_json::Value = serde_json::to_value(ITINERARIES_META_TOP_KEYS)
            .expect("ITINERARIES_META_TOP_KEYS serializes to JSON array");
        it.insert("itineraries_top_keys".to_string(), keys743);
        it.insert(
            "itineraries_top_keys_contract_743".to_string(),
            serde_json::Value::String(format_itineraries_meta_top_keys_contract_743()),
        );
    }

    let orders_deadline_rating_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let res = crate::chain_off::rating_review_window_resolution_for_orders_api(
                &co.config,
                state.chain_config.as_ref(),
            )
            .await;
            let probe = crate::chain::governor::probe_governor_order_rating_review_window_chain(
                state.chain_config.as_ref(),
            )
            .await;
            let base = crate::chain_off::deadline_rating_observability_value(&res, true);
            crate::chain_off::merge_deadline_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => json!({
            "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-SSOT-OBSERVE-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; GET /api/v1/orders* may 501; per-order order.deadline_rating_observability not emitted",
        }),
    };
    let mut orders_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_ORDER_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: handlers mutate in-memory order row first then try_persist_order_to_db (strict TRAVELTRUST_STRICT_ORDER_DB_WRITE) or persist_order_if_db best-effort via db::upsert_order; strict upsert failure → revert memory order → 503 order_db_persist_failed; non-strict logs [audit] db upsert_order failed and may leave DB lagging memory",
        "rule": "upsert_order after state transitions (create, escrow addr, accept, cancel, mock pay, confirm completion, bilateral/rating confirm, open-dispute order row): on failure revert memory → 503 order_db_persist_failed; chain_off/mod.rs try_persist_order_to_db/persist_order_if_db 与 chain_off/orders.rs、orders_flow/* 双写与 TRAVELTRUST_STRICT_ORDER_DB_WRITE 同源；744 GET /meta orders 对象 orders_top_keys / orders_top_keys_contract_744 与 ORDERS_META_TOP_KEYS 八键顺序同源（含 fee_route_country_ssot、deadline_rating_observability；B-083；TT-B110-SEQ2-ORDERS-DEADLINE-SSOT-OBSERVE-001；chain_off 挂载时 meta.orders.deadline_rating_observability 嵌 reconcile_probe：TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001）",
        "list_pagination": "GET /api/v1/orders: omit limit = full list (legacy); limit=1..100 with optional cursor (last item id from prior page) returns items + page.next_cursor/has_more; sort updated_at desc, id desc when paginated",
        // B-083 / TT-B083-FEE-ROUTE-COUNTRY-ORDER-META-SSOT-001：与 **`order_detail_envelope`** **`order.fee_route_country`** 对读（**`crates/api/src/chain_off/orders.rs`**）。
        "fee_route_country_ssot": format!(
            "GET /api/v1/orders/:id: when itinerary bundle present, order.fee_route_country from SSOT field `{}` (zh product country name → iso3166_alpha2 + bucket_route_key country_pool_<iso_lower> aligned to 84; unmapped/empty → reject with code, no silent default pool; on-chain MVP FeeRouter still single countryBucket) (B-083)",
            FEE_ROUTE_COUNTRY_SSOT_FIELD
        ),
        "deadline_rating_observability": orders_deadline_rating_observability_meta,
    });
    if let Some(ord) = orders_section.as_object_mut() {
        let keys744: serde_json::Value = serde_json::to_value(ORDERS_META_TOP_KEYS)
            .expect("ORDERS_META_TOP_KEYS serializes to JSON array");
        ord.insert("orders_top_keys".to_string(), keys744);
        ord.insert(
            "orders_top_keys_contract_744".to_string(),
            serde_json::Value::String(format_orders_meta_top_keys_contract_744()),
        );
    }

    let mut discover_section = json!({
        "strict_db_write": false,
        "dual_write_order": "GET /api/v1/discover/orders is read-only aggregation: routes/discover.rs → chain_off::discover_orders_list_impl; no order upsert in discover handler (writes use orders/itineraries mutations); cards may reflect DB-hydrated projections when store reads DB but discover path does not persist order transitions",
        "rule": "GET /api/v1/discover/orders limit/cursor/sort semantics aligned with GET /api/v1/orders (contrast orders.list_pagination); chain_off/discover.rs discover_orders_list_impl 同源；745 GET /meta discover 对象 discover_top_keys / discover_top_keys_contract_745 与 DISCOVER_META_TOP_KEYS 六键顺序同源",
        "orders_pagination": "GET /api/v1/discover/orders: same limit/cursor semantics as GET /api/v1/orders; paginated sort updated_at desc, id desc; full list sort created_at desc",
    });
    if let Some(disc) = discover_section.as_object_mut() {
        let keys745: serde_json::Value = serde_json::to_value(DISCOVER_META_TOP_KEYS)
            .expect("DISCOVER_META_TOP_KEYS serializes to JSON array");
        disc.insert("discover_top_keys".to_string(), keys745);
        disc.insert(
            "discover_top_keys_contract_745".to_string(),
            serde_json::Value::String(format_discover_meta_top_keys_contract_745()),
        );
    }

    let db_pool = state
        .chain_off
        .as_ref()
        .and_then(|co| co.db_pool.as_ref());
    let pc_resolved = crate::catalog_geo_validation::resolve_meta_product_countries(db_pool).await;
    let mut product_countries_section = json!({
        "strict_db_write": false,
        "dual_write_order": crate::catalog_geo_validation::meta_product_countries_dual_write_order(pc_resolved.read_source),
        "rule": "产品期十国锁死：POST /api/v1/guides `country_code` 须为 iso3166_alpha2；POST /api/v1/itineraries/custom 的 `country` 须为 name_zh（中文国家名）。POST /api/v1/itineraries 的 `destination` 须为允许的中文国家名（`is_allowed_zh_destination_country`，与 `name_zh` 一致；非法 → `invalid_destination_country`）；`city`/`cities[]` 须为该国预设城市（`preset_cities`）。与 `traveltrust_core::product_countries`、`frontend/lib/productCountries.ts`、44/54 一致；746 GET /meta product_countries 对象 product_countries_top_keys / product_countries_top_keys_contract_746 与 PRODUCT_COUNTRIES_META_TOP_KEYS 七键顺序同源；S4b：`CATALOG_SERVER_GEO_VALIDATION=1` 且 DATABASE_URL 时 iso3166_alpha2/name_zh 优先读 published catalog_countries，失败回退 core",
        "iso3166_alpha2": pc_resolved.iso3166_alpha2,
        "name_zh": pc_resolved.name_zh,
    });
    if let Some(pc) = product_countries_section.as_object_mut() {
        let keys746: serde_json::Value = serde_json::to_value(PRODUCT_COUNTRIES_META_TOP_KEYS)
            .expect("PRODUCT_COUNTRIES_META_TOP_KEYS serializes to JSON array");
        pc.insert("product_countries_top_keys".to_string(), keys746);
        pc.insert(
            "product_countries_top_keys_contract_746".to_string(),
            serde_json::Value::String(format_product_countries_meta_top_keys_contract_746()),
        );
    }

    let mut auth_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_AUTH_DB_WRITE").as_deref() == Ok("1"),
        "registration": auth_registration_section,
        "rule": "register: insert_user + insert_session must succeed or roll back user+session in memory → 503 auth_db_persist_failed; login: insert_session must succeed or remove session from memory → 503；750 GET /meta auth 对象 auth_top_keys / auth_top_keys_contract_750 与 AUTH_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(au) = auth_section.as_object_mut() {
        let keys750: serde_json::Value = serde_json::to_value(AUTH_META_TOP_KEYS)
            .expect("AUTH_META_TOP_KEYS serializes to JSON array");
        au.insert("auth_top_keys".to_string(), keys750);
        au.insert(
            "auth_top_keys_contract_750".to_string(),
            serde_json::Value::String(format_auth_meta_top_keys_contract_750()),
        );
    }

    let mut seed_test_accounts_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_SEED_DB_WRITE").as_deref() == Ok("1"),
        "rule": "SEED_TEST_ACCOUNTS=1: insert_user/insert_guide must succeed before memory; on failure skip that account (strict guide path may leave orphan user row in DB — reset dev DB if needed)；751 GET /meta seed_test_accounts 对象 seed_test_accounts_top_keys / seed_test_accounts_top_keys_contract_751 与 SEED_TEST_ACCOUNTS_META_TOP_KEYS 四键顺序同源",
    });
    if let Some(sta) = seed_test_accounts_section.as_object_mut() {
        let keys751: serde_json::Value = serde_json::to_value(SEED_TEST_ACCOUNTS_META_TOP_KEYS)
            .expect("SEED_TEST_ACCOUNTS_META_TOP_KEYS serializes to JSON array");
        sta.insert("seed_test_accounts_top_keys".to_string(), keys751);
        sta.insert(
            "seed_test_accounts_top_keys_contract_751".to_string(),
            serde_json::Value::String(format_seed_test_accounts_meta_top_keys_contract_751()),
        );
    }

    let mut guides_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_GUIDE_DB_WRITE").as_deref() == Ok("1"),
        "rule": "guide_create: insert_guide must succeed or remove guide from memory → 503 guide_db_persist_failed；752 GET /meta guides 对象 guides_top_keys / guides_top_keys_contract_752 与 GUIDES_META_TOP_KEYS 四键顺序同源",
    });
    if let Some(gu) = guides_section.as_object_mut() {
        let keys752: serde_json::Value = serde_json::to_value(GUIDES_META_TOP_KEYS)
            .expect("GUIDES_META_TOP_KEYS serializes to JSON array");
        gu.insert("guides_top_keys".to_string(), keys752);
        gu.insert(
            "guides_top_keys_contract_752".to_string(),
            serde_json::Value::String(format_guides_meta_top_keys_contract_752()),
        );
    }

    let governance_governor_view_params_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let res = crate::chain_off::governance_view_params_ssot::governor_view_params_resolution_for_meta(
                &co.config,
                state.chain_config.as_ref(),
            )
            .await;
            let probe = crate::chain::governor::probe_governor_view_params_chain(
                state.chain_config.as_ref(),
            )
            .await;
            let base = crate::chain_off::governance_view_params_ssot::governor_view_params_observability_value(&res, true);
            crate::chain_off::governance_view_params_ssot::merge_governor_view_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => serde_json::json!({
            "anchor": "TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governance governor view params SSOT not evaluated",
        }),
    };

    let governance_governor_token_timelock_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let res = crate::chain_off::governance_governor_token_timelock_ssot::governor_token_timelock_resolution_for_meta(
                &co.config,
                state.chain_config.as_ref(),
            )
            .await;
            let probe = crate::chain::governor::probe_governor_token_timelock_chain(
                state.chain_config.as_ref(),
            )
            .await;
            let base = crate::chain_off::governance_governor_token_timelock_ssot::governor_token_timelock_observability_value(&res, true);
            crate::chain_off::governance_governor_token_timelock_ssot::merge_governor_token_timelock_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => serde_json::json!({
            "anchor": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governance governor token/timelock SSOT not evaluated",
        }),
    };

    let governance_timelock_delay_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let res = crate::chain_off::governance_timelock_delay_ssot::timelock_delay_resolution_for_meta(
                &co.config,
                state.chain_config.as_ref(),
            )
            .await;
            let probe =
                crate::chain::timelock::probe_timelock_delay_chain(state.chain_config.as_ref()).await;
            let base = crate::chain_off::governance_timelock_delay_ssot::timelock_delay_observability_value(
                &res,
                true,
            );
            crate::chain_off::governance_timelock_delay_ssot::merge_timelock_delay_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => serde_json::json!({
            "anchor": "TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governance timelock delay SSOT not evaluated",
        }),
    };

    let governance_governor_proposal_threshold_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let res = crate::chain_off::governance_proposal_threshold_ssot::proposal_threshold_resolution_for_meta(
                &co.config,
                state.chain_config.as_ref(),
            )
            .await;
            let probe = crate::chain::governor::probe_governor_proposal_threshold_chain(
                state.chain_config.as_ref(),
            )
            .await;
            let base = crate::chain_off::governance_proposal_threshold_ssot::proposal_threshold_observability_value(
                &res,
                true,
            );
            crate::chain_off::governance_proposal_threshold_ssot::merge_proposal_threshold_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => serde_json::json!({
            "anchor": "TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governance governor proposal threshold SSOT not evaluated",
        }),
    };

    let governance_timelock_governor_admin_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let res = crate::chain_off::governance_timelock_governor_admin_ssot::timelock_governor_admin_resolution_for_meta(
                &co.config,
                state.chain_config.as_ref(),
            )
            .await;
            let probe = crate::chain::timelock::probe_timelock_governor_admin_chain(
                state.chain_config.as_ref(),
            )
            .await;
            let base = crate::chain_off::governance_timelock_governor_admin_ssot::timelock_governor_admin_observability_value(
                &res,
                true,
            );
            crate::chain_off::governance_timelock_governor_admin_ssot::merge_timelock_governor_admin_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => serde_json::json!({
            "anchor": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governance timelock governor/admin SSOT not evaluated",
        }),
    };

    let governance_governor_proposal_count_observability_meta = match state.chain_off.as_ref() {
        Some(co) => {
            let db_pool = co.db_pool.as_ref();
            let res = crate::chain_off::governance_proposal_count_ssot::proposal_count_resolution_for_meta(
                &co.config,
                state.chain_config.as_ref(),
                db_pool,
            )
            .await;
            let probe = crate::chain::governor::probe_governor_proposal_count_chain(
                state.chain_config.as_ref(),
            )
            .await;
            let base = crate::chain_off::governance_proposal_count_ssot::proposal_count_observability_value(
                &res,
                true,
            );
            crate::chain_off::governance_proposal_count_ssot::merge_proposal_count_reconcile_probe_into_observability(
                base,
                &co.config,
                &res,
                probe,
            )
        }
        None => serde_json::json!({
            "anchor": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; governance governor proposal count SSOT not evaluated",
        }),
    };

    let keys807: serde_json::Value = serde_json::to_value(GOVERNANCE_META_TOP_KEYS)
        .expect("GOVERNANCE_META_TOP_KEYS serializes to JSON array");
    let governance_section = json!({
        "strict_db_write": false,
        "rule": "807：GET /meta governance 对象 governance_top_keys / governance_top_keys_contract_807 与 GOVERNANCE_META_TOP_KEYS 十键顺序同源；governor_view_params_observability 嵌 reconcile_probe（TT-B110-SEQ5；TravelTrustGovernor votingDelayBlocks/votingPeriodBlocks/quorumNumeratorBps）；governor_token_timelock_observability 嵌 reconcile_probe（TT-B110-SEQ11；TravelTrustGovernor token()/timelock() immutable 引用地址）；timelock_delay_observability 嵌 reconcile_probe（TT-B110-SEQ6；GovernanceTimelock delay()，任务 getDelay 口径映射）；governor_proposal_threshold_observability 嵌 reconcile_probe（TT-B110-SEQ8；TravelTrustGovernor proposalThresholdVotes()）；timelock_governor_admin_observability 嵌 reconcile_probe（TT-B110-SEQ9；GovernanceTimelock governor()/admin()，地址运行时可变，对拍为两次 eth_call 一致性）；governor_proposal_count_observability 嵌 reconcile_probe（TT-B110-SEQ10；TravelTrustGovernor proposalCount() vs governance_proposals_projection 行数，显式 drift_leg）",
        "governor_view_params_observability": governance_governor_view_params_observability_meta,
        "governor_token_timelock_observability": governance_governor_token_timelock_observability_meta,
        "timelock_delay_observability": governance_timelock_delay_observability_meta,
        "governor_proposal_threshold_observability": governance_governor_proposal_threshold_observability_meta,
        "timelock_governor_admin_observability": governance_timelock_governor_admin_observability_meta,
        "governor_proposal_count_observability": governance_governor_proposal_count_observability_meta,
        "governance_top_keys": keys807,
        "governance_top_keys_contract_807": format_governance_meta_top_keys_contract_807(),
    });

    let mut idempotency_cache_section = json!({
        "memory_max_entries": middleware::idempotency_cache_max(),
        "db_projection": "when DATABASE_URL set: replay cache may read/write idempotency_keys; failures log [audit] idempotency_cache_db_read_failed / idempotency_cache_db_write_failed without changing HTTP status",
        "rule": "GET /meta idempotency_cache mirrors middleware in-process idempotency cache max and DATABASE_URL projection behavior (routes/middleware idempotency); 753 GET /meta idempotency_cache 对象 idempotency_cache_top_keys / idempotency_cache_top_keys_contract_753 与 IDEMPOTENCY_CACHE_META_TOP_KEYS 五键顺序同源",
    });
    if let Some(ic) = idempotency_cache_section.as_object_mut() {
        let keys753: serde_json::Value = serde_json::to_value(IDEMPOTENCY_CACHE_META_TOP_KEYS)
            .expect("IDEMPOTENCY_CACHE_META_TOP_KEYS serializes to JSON array");
        ic.insert("idempotency_cache_top_keys".to_string(), keys753);
        ic.insert(
            "idempotency_cache_top_keys_contract_753".to_string(),
            serde_json::Value::String(format_idempotency_cache_meta_top_keys_contract_753()),
        );
    }

    let mut defaults_section = json!({
        "request_timeout_secs": middleware::request_timeout_secs(),
        "request_body_limit_bytes": middleware::REQUEST_BODY_LIMIT_BYTES,
        "idempotency_cache_max": middleware::idempotency_cache_max(),
        "rule": "GET /meta.defaults mirrors middleware REQUEST_TIMEOUT_SECS / REQUEST_BODY_LIMIT_BYTES / idempotency cache max (routes/middleware); 754 GET /meta defaults 对象 defaults_top_keys / defaults_top_keys_contract_754 与 DEFAULTS_META_TOP_KEYS 六键顺序同源",
    });
    if let Some(df) = defaults_section.as_object_mut() {
        let keys754: serde_json::Value = serde_json::to_value(DEFAULTS_META_TOP_KEYS)
            .expect("DEFAULTS_META_TOP_KEYS serializes to JSON array");
        df.insert("defaults_top_keys".to_string(), keys754);
        df.insert(
            "defaults_top_keys_contract_754".to_string(),
            serde_json::Value::String(format_defaults_meta_top_keys_contract_754()),
        );
    }

    let mut outbox_section = json!({
        "dir": outbox_dir,
        "worker_enabled": outbox_worker_enabled,
        "lease_secs": outbox_lease_secs,
        "poll_ms": outbox_poll_ms,
        "max_attempts": outbox_max_attempts,
        "rule": "GET /meta.outbox mirrors OUTBOX_DIR / OUTBOX_WORKER=1 / OUTBOX_LEASE_SECS / OUTBOX_POLL_MS / OUTBOX_MAX_ATTEMPTS (core outbox worker); 755 GET /meta outbox 对象 outbox_top_keys / outbox_top_keys_contract_755 与 OUTBOX_META_TOP_KEYS 八键顺序同源",
    });
    if let Some(ob) = outbox_section.as_object_mut() {
        let keys755: serde_json::Value = serde_json::to_value(OUTBOX_META_TOP_KEYS)
            .expect("OUTBOX_META_TOP_KEYS serializes to JSON array");
        ob.insert("outbox_top_keys".to_string(), keys755);
        ob.insert(
            "outbox_top_keys_contract_755".to_string(),
            serde_json::Value::String(format_outbox_meta_top_keys_contract_755()),
        );
    }

    let mut rate_limits_section = middleware::meta_rate_limits_snapshot();
    if let Some(rl) = rate_limits_section.as_object_mut() {
        let keys756: serde_json::Value = serde_json::to_value(RATE_LIMITS_META_TOP_KEYS)
            .expect("RATE_LIMITS_META_TOP_KEYS serializes to JSON array");
        rl.insert("rate_limits_top_keys".to_string(), keys756);
        rl.insert(
            "rate_limits_top_keys_contract_756".to_string(),
            serde_json::Value::String(format_rate_limits_meta_top_keys_contract_756()),
        );
    }

    let mut database_section = json!({
        "connected": database_connected,
        "rule": "760：connected 与根级 database_connected 布尔同源；GET /meta database 对象 database_top_keys / database_top_keys_contract_760 与 DATABASE_META_TOP_KEYS 四键顺序同源",
    });
    if let Some(dbs) = database_section.as_object_mut() {
        let keys760: serde_json::Value = serde_json::to_value(DATABASE_META_TOP_KEYS)
            .expect("DATABASE_META_TOP_KEYS serializes to JSON array");
        dbs.insert("database_top_keys".to_string(), keys760);
        dbs.insert(
            "database_top_keys_contract_760".to_string(),
            serde_json::Value::String(format_database_meta_top_keys_contract_760()),
        );
    }

    let mut meta_response = json!({
        "service": "traveltrust-api",
        "api_version": env!("CARGO_PKG_VERSION"),
        "build": build,
        "chain": chain_section,
        "rate_limits": rate_limits_section,
        "database_connected": database_connected,
        "database": database_section,
        "dual_write": dual_write_section,
        "strict_mode": strict_mode_section,
        "ssot_version": state.ssot_version,
        "ssot": ssot_section,
        "admin_exports": admin_exports_section,
        "chargeback_policy": chargeback_policy_section,
        "finality_n": state.finality_n,
        "indexer": indexer_section,
        "authority": authority_section,
        "pause": pause_section,
        "evidence": evidence_section,
        "order_messages": order_messages_section,
        "reviews": reviews_section,
        "dispute_open": dispute_open_section,
        "dispute_resolve": dispute_resolve_section,
        "itineraries": itineraries_section,
        "orders": orders_section,
        "discover": discover_section,
        "product_countries": product_countries_section,
        "did_rank": did_rank_section,
        "product_roles": product_roles_section,
        "auth": auth_section,
        "seed_test_accounts": seed_test_accounts_section,
        "guides": guides_section,
        "governance": governance_section,
        "idempotency_cache": idempotency_cache_section,
        "defaults": defaults_section,
        "outbox": outbox_section,
    });
    if let Some(root) = meta_response.as_object_mut() {
        let keys728: serde_json::Value = serde_json::to_value(META_ROOT_TOP_KEYS)
            .expect("META_ROOT_TOP_KEYS serializes to JSON array");
        root.insert("meta_top_keys".to_string(), keys728);
        root.insert(
            "meta_top_keys_contract_728".to_string(),
            serde_json::Value::String(format_meta_root_top_keys_contract_728()),
        );
    }
    Json(meta_response)
}

/// GET /metrics：P31 可观测；Prometheus 文本格式。
///
/// 索引器相关 gauge 与 **`GET /meta`** 的 **`indexer`** / **`authority`** 字段同源（进程内快照，**不**在 scrape 时查库）。
pub(super) async fn metrics(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let total = middleware::request_total();
    let reorg = u8::from(state.reorg_detected);
    let replay = u8::from(state.indexer_replay_required);
    let degraded = u8::from(state.degraded_mode);
    let mem_available = u8::from(state.indexer_state.is_some());
    let mem_last_block = if let Some(ref h) = state.indexer_state {
        let g = h.read().await;
        g.last_block
    } else {
        0u64
    };
    let (cp_block, cp_log, _) = state.indexer_checkpoint_for_observability().await;
    // Same source as GET /meta `database_connected` (chain_off.db_pool mounted); 120 §3.1 / 55
    let database_connected = u8::from(
        state
            .chain_off
            .as_ref()
            .and_then(|co| co.db_pool.as_ref())
            .is_some(),
    );
    // Chain RPC/config snapshot mounted (CHAIN_RPC_URL path); 110 ops
    let chain_config_loaded = u8::from(state.chain_config.is_some());
    let mut body = String::new();
    let _ = writeln!(
        body,
        "# HELP traveltrust_api_info API info (P31)\n\
         # TYPE traveltrust_api_info gauge\ntraveltrust_api_info{{version=\"{}\"}} 1",
        env!("CARGO_PKG_VERSION")
    );
    let _ = writeln!(
        body,
        "# HELP http_requests_total Total HTTP requests (P31; use rate() for QPS)\n\
         # TYPE http_requests_total counter\nhttp_requests_total {}",
        total
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_lag_blocks Indexer lag vs chain head (process snapshot; see GET /meta.state / 110).\n\
         # TYPE traveltrust_indexer_lag_blocks gauge\ntraveltrust_indexer_lag_blocks {}",
        state.indexer_lag_blocks
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_lag_max_blocks INDEXER_LAG_MAX_BLOCKS threshold (reference for alert rules).\n\
         # TYPE traveltrust_indexer_lag_max_blocks gauge\ntraveltrust_indexer_lag_max_blocks {}",
        state.indexer_lag_max_blocks
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_reorg_detected 1 if reorg suspected flag is set (REORG_DETECTED or tick guard).\n\
         # TYPE traveltrust_indexer_reorg_detected gauge\ntraveltrust_indexer_reorg_detected {}",
        reorg
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_replay_required 1 if indexer replay_required flag is set.\n\
         # TYPE traveltrust_indexer_replay_required gauge\ntraveltrust_indexer_replay_required {}",
        replay
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_authority_degraded_mode 1 if authority.degraded_mode (lag/reorg path).\n\
         # TYPE traveltrust_authority_degraded_mode gauge\ntraveltrust_authority_degraded_mode {}",
        degraded
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_checkpoint_block Projector checkpoint block_number (GET /meta.indexer.checkpoint.block_number; runtime when indexer_state mounted).\n\
         # TYPE traveltrust_indexer_checkpoint_block gauge\ntraveltrust_indexer_checkpoint_block {}",
        cp_block
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_checkpoint_log_index Projector checkpoint log_index (GET /meta.indexer.checkpoint.log_index; runtime when indexer_state mounted).\n\
         # TYPE traveltrust_indexer_checkpoint_log_index gauge\ntraveltrust_indexer_checkpoint_log_index {}",
        cp_log
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_memory_available 1 if in-process indexer runtime state is mounted.\n\
         # TYPE traveltrust_indexer_memory_available gauge\ntraveltrust_indexer_memory_available {}",
        mem_available
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_memory_last_block In-process indexer last_block (0 if memory unavailable).\n\
         # TYPE traveltrust_indexer_memory_last_block gauge\ntraveltrust_indexer_memory_last_block {}",
        mem_last_block
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_indexer_finality_n Finality depth FINALITY_N (aligned with meta.finality_n).\n\
         # TYPE traveltrust_indexer_finality_n gauge\ntraveltrust_indexer_finality_n {}",
        state.finality_n
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_database_connected 1 if PostgreSQL pool is mounted on chain_off (same as meta.database_connected).\n\
         # TYPE traveltrust_database_connected gauge\ntraveltrust_database_connected {}",
        database_connected
    );
    let _ = writeln!(
        body,
        "# HELP traveltrust_chain_config_loaded 1 if chain RPC/config snapshot is mounted (CHAIN_RPC_URL path).\n\
         # TYPE traveltrust_chain_config_loaded gauge\ntraveltrust_chain_config_loaded {}",
        chain_config_loaded
    );
    (
        [(
            axum::http::header::CONTENT_TYPE,
            "text/plain; charset=utf-8",
        )],
        body,
    )
}
