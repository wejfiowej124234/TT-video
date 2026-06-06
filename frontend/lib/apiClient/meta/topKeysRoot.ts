/** `GET /meta` 机读键序常量（indexer 子树 + 根 + database）。与 `crates/api/src/routes/health_meta` 对读。 */

/** 726：`GET /meta` `indexer.finality_discipline` 对象顶层键顺序；与 `FINALITY_DISCIPLINE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `finality_discipline_top_keys` / `finality_discipline_top_keys_contract_726` 对读 */
export const FINALITY_DISCIPLINE_META_TOP_KEYS = [
  "tick_logs_upper_bound",
  "postgres_event_log_has_finality_n_used",
  "order_chain_sync_status",
  "chain_tip_not_in_meta",
  "chain_tip_hint",
  "finality_discipline_top_keys",
  "finality_discipline_top_keys_contract_726",
] as const;

/** 727：`GET /meta` `indexer` 对象顶层键顺序；与 `INDEXER_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `indexer_top_keys` / `indexer_top_keys_contract_727` 对读 */
export const INDEXER_META_TOP_KEYS = [
  "state_path",
  "checkpoint",
  "last_seen_finality_n",
  "replay_required",
  "lag_blocks",
  "lag_max_blocks",
  "reorg_detected",
  "finality_n",
  "memory",
  "finality_discipline",
  "rule",
  "indexer_top_keys",
  "indexer_top_keys_contract_727",
] as const;

/** 757：`GET /meta` `indexer.memory` 对象顶层键顺序；与 `INDEXER_MEMORY_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `indexer_memory_top_keys` / `indexer_memory_top_keys_contract_757` 对读 */
export const INDEXER_MEMORY_META_TOP_KEYS = [
  "available",
  "last_block",
  "last_log_index",
  "last_block_hash_prefix",
  "events_cached",
  "rule",
  "indexer_memory_top_keys",
  "indexer_memory_top_keys_contract_757",
] as const;

/** 758：`GET /meta` `indexer.checkpoint` 对象顶层键顺序；与 `INDEXER_CHECKPOINT_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `indexer_checkpoint_top_keys` / `indexer_checkpoint_top_keys_contract_758` 对读 */
export const INDEXER_CHECKPOINT_META_TOP_KEYS = [
  "block_number",
  "log_index",
  "source",
  "rule",
  "indexer_checkpoint_top_keys",
  "indexer_checkpoint_top_keys_contract_758",
] as const;

/** 728：`GET /meta` 根对象顶层键顺序（760 起含 `database` 键，三十六键）；与 `META_ROOT_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `meta_top_keys` / `meta_top_keys_contract_728` 对读 */
export const META_ROOT_TOP_KEYS = [
  "service",
  "api_version",
  "build",
  "chain",
  "rate_limits",
  "database_connected",
  "database",
  "dual_write",
  "strict_mode",
  "ssot_version",
  "ssot",
  "admin_exports",
  "chargeback_policy",
  "finality_n",
  "indexer",
  "authority",
  "pause",
  "evidence",
  "order_messages",
  "reviews",
  "dispute_open",
  "dispute_resolve",
  "itineraries",
  "orders",
  "discover",
  "product_countries",
  "did_rank",
  "product_roles",
  "auth",
  "seed_test_accounts",
  "guides",
  "idempotency_cache",
  "defaults",
  "outbox",
  "meta_top_keys",
  "meta_top_keys_contract_728",
] as const;

/** 760：`GET /meta` `database` 对象顶层键顺序；与 `DATABASE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `database_top_keys` / `database_top_keys_contract_760` 对读；`connected` 与根级 `database_connected` 同源 */
export const DATABASE_META_TOP_KEYS = [
  "connected",
  "rule",
  "database_top_keys",
  "database_top_keys_contract_760",
] as const;
