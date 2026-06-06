//! Chain-sync-status 机读契约常量（716～725），与 `GET /meta` `indexer.finality_discipline.order_chain_sync_status` 同源。

/// **714**：非 chain_off 最小成功体根级 `note` 稳定句（与 `GET /meta` `order_chain_sync_status.minimal_body_note_stable` 机读同源）。
pub(crate) const CHAIN_SYNC_MINIMAL_BODY_NOTE: &str =
    "minimal runtime snapshot when order projection backend is unavailable";

/// **715**：成功体根级 `status` 字面（与 `chain_sync.status` pending/confirmed/unknown 区分；与 `GET /meta` `order_chain_sync_status.success_body_envelope_status` 机读同源）。
pub(crate) const CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS: &str = "ok";

/// **716**：200 成功体 `chain_sync` 必有顶层 JSON 键（与 `GET /meta` `order_chain_sync_status.chain_sync_required_top_keys` 机读同源）。
pub(crate) const CHAIN_SYNC_REQUIRED_TOP_KEYS: &[&str] =
    &["status", "finality_n", "checkpoint", "last_event"];

/// **717**：`GET /meta` `order_chain_sync_status.method_path` 与 `router().route` 挂载路径同源（机读锁 `method_path_contract_717`）。
pub(crate) const CHAIN_SYNC_ROUTE_PATH: &str = "/api/v1/orders/:id/chain-sync-status";

/// **717**：HTTP 方法 + 路径字面（与 **`CHAIN_SYNC_ROUTE_PATH`** 对读：`GET {CHAIN_SYNC_ROUTE_PATH}`）。
pub(crate) const CHAIN_SYNC_STATUS_METHOD_AND_PATH: &str =
    "GET /api/v1/orders/:id/chain-sync-status";

/// **718**：`GET /meta` `order_chain_sync_status.code` 机读锚点（实现文件路径 + `get_order_chain_sync_status` 符号；与 `code_contract_718` 同源）。
pub(crate) const CHAIN_SYNC_STATUS_HANDLER_CODE: &str =
    "crates/api/src/routes/orders/chain_sync_status.rs get_order_chain_sync_status";

/// **719**：`GET /meta` `order_chain_sync_status.status_values` 与 **`713`**** **`chain_sync.status`** **三值** **同源**（顺序 **`pending` → `confirmed` → `unknown`**）。
pub(crate) const CHAIN_SYNC_STATUS_VALUES: &[&str] = &["pending", "confirmed", "unknown"];

/// **720**：`GET /meta` `order_chain_sync_status.absent_reason_values` 与 **`703`**** **`event_log_snapshot_absent_reason`** **五键** **同源**（顺序 **`no_database` → `no_chain_context` → `no_row` → `read_failed` → `projection_backend_unavailable`**）。
pub(crate) const CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS: &[&str] = &[
    "no_database",
    "no_chain_context",
    "no_row",
    "read_failed",
    "projection_backend_unavailable",
];

/// **721**：**chain_off** 时 **`chain_sync.last_event`** 对象顶层键（与 **`GET /meta`**** **`order_chain_sync_status.last_event_top_keys`** **及 **`706`** **同源**；顺序 **`state` → `updated_at` → `escrow_address`**）。
pub(crate) const CHAIN_SYNC_LAST_EVENT_TOP_KEYS: &[&str] =
    &["state", "updated_at", "escrow_address"];

/// **723**：成功体 **`chain_sync.checkpoint`** 对象顶层键（与 **`GET /meta`**** **`order_chain_sync_status.checkpoint_top_keys`** **及 **`710`****/**`712`** **同源**；顺序 **`block_number` → `log_index` → `source`**）。
pub(crate) const CHAIN_SYNC_CHECKPOINT_TOP_KEYS: &[&str] = &["block_number", "log_index", "source"];

/// **724**：**`chain_sync.checkpoint.source`** 与 **`GET /meta.indexer.checkpoint.source`** **合法机器值（与 **`order_chain_sync_status.checkpoint_source_values`** **及 **`712`** **同源**；顺序 **`runtime` → `startup_snapshot`**；**`ApiMetaState::indexer_checkpoint_for_observability`** **写入**）。
pub(crate) const CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES: &[&str] = &["runtime", "startup_snapshot"];

/// **725**：`GET /meta` `indexer.finality_discipline.order_chain_sync_status` **对象** **顶层键** **顺序**（机读锁 **`order_chain_sync_status_top_keys`** / **`order_chain_sync_status_top_keys_contract_725`**；**`order_chain_sync_status_top_keys`** **JSON** **数组** **与同名列** **同源**）。
pub(crate) const ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS: &[&str] = &[
    "method_path",
    "method_path_contract_717",
    "status_values",
    "status_values_contract_719",
    "absent_reason_values",
    "absent_reason_values_contract_720",
    "code",
    "code_contract_718",
    "event_log_snapshot_top_keys",
    "event_log_snapshot_keys_contract_722",
    "optional_event_log_snapshot",
    "optional_event_log_snapshot_absent_reason",
    "last_event_top_keys",
    "last_event_keys_contract_721",
    "checkpoint_top_keys",
    "checkpoint_keys_contract_723",
    "checkpoint_source_values",
    "checkpoint_source_values_contract_724",
    "optional_last_event",
    "success_body_order_id",
    "success_body_envelope_status",
    "chain_sync_required_top_keys",
    "minimal_body_requester",
    "minimal_body_chain_sync_status_unknown",
    "chain_sync_checkpoint",
    "chain_sync_finality_n",
    "chain_sync_checkpoint_source",
    "chain_sync_status_enum",
    "minimal_body_note_stable",
    "order_chain_sync_status_top_keys",
    "order_chain_sync_status_top_keys_contract_725",
    "rule",
];

pub(crate) fn format_order_chain_sync_status_meta_top_keys_contract_725() -> String {
    let mut s = String::from(
        "**725**：**`order_chain_sync_status_top_keys`** **与 **`orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push('）');
    s
}
