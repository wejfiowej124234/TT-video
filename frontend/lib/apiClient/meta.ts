/**
 * 元数据与健康（GET /meta、GET /meta/build 等）
 */

import { apiUrl, routes } from "../api";
import { requestId, parseResponse, logApiJsonStatusNotOk, throwUnlessApiOk } from "./core";

/** `GET /meta.build`（04 §7.10、120/140） */
export type MetaBuildInfo = {
  git_sha: string;
  deployed_at: string | null;
};

/** `GET /meta.product_roles`（87 / 04 §二 2.1 / 690 / 691 / 692） */
export type ProductRolesMeta = {
  users_role_stored: string[];
  me_public_role_mapping: Record<string, string>;
  protocol_roles_target_87: string[];
  provider_in_users_role: boolean;
  region_steward_in_users_role: boolean;
  rule: string;
};

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

/** 729：`GET /meta` `chain` 对象顶层键顺序；与 `CHAIN_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `chain_top_keys` / `chain_top_keys_contract_729` 对读。**762**：`chain.rule` 机读句显式互链 **761** `rate_limits.guide_upload` / `GUIDE_UPLOAD_META_TOP_KEYS`（与 `middleware/rate_limit.rs` 对读）。**763**：`chain.rule` 机读句互链根级 `service` / `api_version` 与 **728** `META_ROOT_TOP_KEYS` 首二键。**766**：`chain.rule` 机读句互链根 `chain` 与 **729** 及 **728** `meta_top_keys`（`META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE`）。**767**：`chain.rule` 机读句互链根 `rate_limits` 与 **756** 及 **728** `META_ROOT_TOP_KEYS` 第五键（`META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE`）。**768**：`chain.rule` 机读句互链根 `database_connected` / `database.connected` / **760** `DATABASE_META_TOP_KEYS` 首键与 **728** `META_ROOT_TOP_KEYS` 第六键（`META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE`）。**769**：`chain.rule` 机读句互链根 `database` 对象 **760** `database_top_keys` / `database_top_keys_contract_760` 与 `DATABASE_META_TOP_KEYS` 四键及 **728** `META_ROOT_TOP_KEYS` 第七键（`META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE`）。**770**：`chain.rule` 机读句互链根 `dual_write` 对象 **732** `dual_write_top_keys` / `dual_write_top_keys_contract_732` 与 `DUAL_WRITE_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第八键（`META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE`）。**771**：`chain.rule` 机读句互链根 `strict_mode` 对象 **731** `strict_mode_top_keys` / `strict_mode_top_keys_contract_731` 与 `STRICT_MODE_META_TOP_KEYS` 七键及 **728** `META_ROOT_TOP_KEYS` 第九键（`META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE`）。**772**：`chain.rule` 机读句互链根 `ssot_version` 与 **731** `strict_mode.rule` 及 **733** `ssot` 子树机读（`META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE`）。**773**：`chain.rule` 机读句互链根 `admin_exports` 对象 **734** `admin_exports_top_keys` / `admin_exports_top_keys_contract_734` 与 `ADMIN_EXPORTS_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第十二键（`META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE`）。**774**：`chain.rule` 机读句互链根 `chargeback_policy` 对象 **735** `chargeback_policy_top_keys` / `chargeback_policy_top_keys_contract_735` 与 `CHARGEBACK_POLICY_META_TOP_KEYS` 四键及 **728** `META_ROOT_TOP_KEYS` 第十三键（`META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE`）。**775**：`chain.rule` 机读句互链根 `finality_n` 与 **FINALITY_N** 及 `GET /meta.indexer.finality_n` 及 **728** `META_ROOT_TOP_KEYS` 第十四键（`META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE`）。**776**：`chain.rule` 机读句互链根 `indexer` 对象 **727** `indexer_top_keys` / `indexer_top_keys_contract_727` 与 `INDEXER_META_TOP_KEYS` 十三键及 **728** `META_ROOT_TOP_KEYS` 第十五键（`META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE`）。**777**：`chain.rule` 机读句互链根 `authority` 对象 **736** `authority_top_keys` / `authority_top_keys_contract_736` 与 `AUTHORITY_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第十六键（`META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE`）。**778**：`chain.rule` 机读句互链根 `pause` 对象 **737** `pause_top_keys` / `pause_top_keys_contract_737` 与 `PAUSE_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第十七键（`META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE`）。**779**：`chain.rule` 机读句互链根 `evidence` 对象 **738** `evidence_top_keys` / `evidence_top_keys_contract_738` 与 `EVIDENCE_META_TOP_KEYS` 九键及 **728** `META_ROOT_TOP_KEYS` 第十八键（`META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE`）。**780**：`chain.rule` 机读句互链根 `order_messages` 对象 **739** `order_messages_top_keys` / `order_messages_top_keys_contract_739` 与 `ORDER_MESSAGES_META_TOP_KEYS` 七键及 **728** `META_ROOT_TOP_KEYS` 第十九键（`META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE`）。**781**：`chain.rule` 机读句互链根 `reviews` 对象 **740** `reviews_top_keys` / `reviews_top_keys_contract_740` 与 `REVIEWS_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第二十键（`META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE`）。**782**：`chain.rule` 机读句互链根 `dispute_open` 对象 **741** `dispute_open_top_keys` / `dispute_open_top_keys_contract_741` 与 `DISPUTE_OPEN_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第二十一键（`META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE`）。**783**：`chain.rule` 机读句互链根 `dispute_resolve` 对象 **742** `dispute_resolve_top_keys` / `dispute_resolve_top_keys_contract_742` 与 `DISPUTE_RESOLVE_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第二十二键（`META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE`）。**784**：`chain.rule` 机读句互链根 `itineraries` 对象 **743** `itineraries_top_keys` / `itineraries_top_keys_contract_743` 与 `ITINERARIES_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第二十三键（`META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE`）。**785**：`chain.rule` 机读句互链根 `orders` 对象 **744** `orders_top_keys` / `orders_top_keys_contract_744` 与 `ORDERS_META_TOP_KEYS` 六键及 **728** `META_ROOT_TOP_KEYS` 第二十四键（`META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE`）。**786**：`chain.rule` 机读句互链根 `discover` 对象 **745** `discover_top_keys` / `discover_top_keys_contract_745` 与 `DISCOVER_META_TOP_KEYS` 六键及 **728** `META_ROOT_TOP_KEYS` 第二十五键（`META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE`）。**787**：`chain.rule` 机读句互链根 `product_countries` 对象 **746** `product_countries_top_keys` / `product_countries_top_keys_contract_746` 与 `PRODUCT_COUNTRIES_META_TOP_KEYS` 七键及 **728** `META_ROOT_TOP_KEYS` 第二十六键（`META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE`）。**788**：`chain.rule` 机读句互链根 `did_rank` 对象 **747** `did_rank_top_keys` / `did_rank_top_keys_contract_747` 与 `DID_RANK_META_TOP_KEYS` 八键及 **728** `META_ROOT_TOP_KEYS` 第二十七键（`META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE`）。**789**：`chain.rule` 机读句互链根 `product_roles` 对象 **748** `product_roles_top_keys` / `product_roles_top_keys_contract_748` 与 `PRODUCT_ROLES_META_TOP_KEYS` 十键及 **728** `META_ROOT_TOP_KEYS` 第二十八键（`META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE`）。**790**：`chain.rule` 机读句互链根 `auth` 对象 **750** `auth_top_keys` / `auth_top_keys_contract_750` 与 `AUTH_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第二十九键（`META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE`）。**791**：`chain.rule` 机读句互链根 `seed_test_accounts` 对象 **751** `seed_test_accounts_top_keys` / `seed_test_accounts_top_keys_contract_751` 与 `SEED_TEST_ACCOUNTS_META_TOP_KEYS` 四键及 **728** `META_ROOT_TOP_KEYS` 第三十键（`META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE`）。**792**：`chain.rule` 机读句互链根 `guides` 对象 **752** `guides_top_keys` / `guides_top_keys_contract_752` 与 `GUIDES_META_TOP_KEYS` 四键及 **728** `META_ROOT_TOP_KEYS` 第三十一键（`META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE`）。**793**：`chain.rule` 机读句互链根 `idempotency_cache` 对象 **753** `idempotency_cache_top_keys` / `idempotency_cache_top_keys_contract_753` 与 `IDEMPOTENCY_CACHE_META_TOP_KEYS` 五键及 **728** `META_ROOT_TOP_KEYS` 第三十二键（`META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE`）。**794**：`chain.rule` 机读句互链根 `defaults` 对象 **754** `defaults_top_keys` / `defaults_top_keys_contract_754` 与 `DEFAULTS_META_TOP_KEYS` 六键及 **728** `META_ROOT_TOP_KEYS` 第三十三键（`META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE`）。**795**：`chain.rule` 机读句互链根 `outbox` 对象 **755** `outbox_top_keys` / `outbox_top_keys_contract_755` 与 `OUTBOX_META_TOP_KEYS` 八键及 **728** `META_ROOT_TOP_KEYS` 第三十四键（`META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE`）。**796**：`chain.rule` 机读句互链根 `meta_top_keys` JSON 数组与 `META_ROOT_TOP_KEYS` 三十六键顺序同源，根 `meta_top_keys_contract_728` 机读与 728 contract 同源，与 **728** `META_ROOT_TOP_KEYS` 第三十五键 `meta_top_keys`（`META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE`）。**797**：`chain.rule` 机读句互链根 `meta_top_keys_contract_728` 与 **728** `META_ROOT_TOP_KEYS` 第三十六键 `meta_top_keys_contract_728` 机读同源，与 728 contract、`META_ROOT_TOP_KEYS` 第三十五键 `meta_top_keys` 机读互链（`META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE`）。**798**：`chain.rule` **798** 根 `meta_top_keys` JSON 数组三十六项与 `META_ROOT_TOP_KEYS` 三十六键逐项同源，`meta_top_keys_contract_728` 嵌入三十六键字面顺序同源，796 与 797 与文末 728 句链式互证（`META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE`）。**799**：`chain.rule` **799** 798 句与文末 728 句机读相邻互锁，双锚根级 `meta_top_keys` JSON 数组三十六项与 `META_ROOT_TOP_KEYS` 三十六键及 `meta_top_keys_contract_728` 字面顺序同源闭环（`META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE`）。**800**：`chain.rule` **800** 799 双锚闭环与 GET /meta chain 对象 729 chain_top_keys / chain_top_keys_contract_729 及 CHAIN_META_TOP_KEYS 五键机读同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 766 机读句串联互证（`META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE`）。**801**：`chain.rule` **801** 800 串联与 GET /meta chain.contracts 非 null 时 759 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 及 CHAIN_CONTRACTS_META_TOP_KEYS 十键机读同源，与 799 双锚闭环及 766/729 chain 子树三向互证（`META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE`）。**802**：`chain.rule` **802** 801 串联与 GET /meta chain.contracts 非 null 时 contracts.rule 嵌入之 759 句与根级 chain.rule 759 及 801 十键机读核心同源，与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 及 801 四向互证（`META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE`）。**803**：`chain.rule` **803** 802 串联与 800 及 766 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 / CHAIN_META_TOP_KEYS 五键机读同源，与 799 双锚经 729、801、759、802 contracts.rule 根级 chain.rule 759 嵌入形成五向链读闭环，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读六向互证（`META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE`）。**804**：`chain.rule` **804** 803 六向互证与 GET /meta chain.chain_id 及根级 chain.rule 文首与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐及 contracts 见 ChainConfig 机读同源，七向收束 803 链读至 CHAIN_META_TOP_KEYS 首键 chain_id 部署观测锚，与 chain_top_keys / chain_top_keys_contract_729 及 803 七向互证（`META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE`）。**805**：`chain.rule` **805** 804 七向互证与 GET /meta chain.contracts 及 CHAIN_META_TOP_KEYS 第二键 contracts 机读同源，八向收束 804 链读至 contracts 部署观测锚与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 十键及 801 三向 802 四向 803 六向串联，与 chain_top_keys / chain_top_keys_contract_729 及 804 八向互证（`META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE`）。**806**：`chain.rule` **806** 805 八向互证与 GET /meta chain.rule 及 CHAIN_META_TOP_KEYS 第三键 rule 机读同源，九向收束 805 链读至根级 chain.rule 文首与 intents EIP-712 domain、NEXT_PUBLIC_CHAIN_ID、ChainConfig、759 句及 contracts.rule 759 嵌入与 801 三向 802 四向 803 六向 804 七向 805 八向串联，与 chain_top_keys / chain_top_keys_contract_729 及 805 九向互证（`META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE`） */
export const CHAIN_META_TOP_KEYS = [
  "chain_id",
  "contracts",
  "rule",
  "chain_top_keys",
  "chain_top_keys_contract_729",
] as const;

/** 759：`GET /meta` `chain.contracts` 对象顶层键顺序（仅 `ChainConfig` 挂载、`contracts` 非 null 时）；与 `CHAIN_CONTRACTS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `chain_contracts_top_keys` / `chain_contracts_top_keys_contract_759` 对读 */
export const CHAIN_CONTRACTS_META_TOP_KEYS = [
  "guide_staking_address",
  "staking_provider_address",
  "governor_address",
  "timelock_address",
  "governance_token_address",
  "fee_router_address",
  "treasury_address",
  "registry_address",
  "escrow_factory_address",
  "region_steward_stake_pool_address",
  "rule",
  "chain_contracts_top_keys",
  "chain_contracts_top_keys_contract_759",
] as const;

/** 730：`GET /meta` / `GET /meta/build` 的 `build` 对象顶层键顺序；与 `META_BUILD_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `build_top_keys` / `build_top_keys_contract_730` 对读；765：`chain.rule` 机读句互链根 `build` 与 `META_ROOT_TOP_KEYS` 第三键及 728 `meta_top_keys`（`META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE`） */
export const META_BUILD_TOP_KEYS = [
  "git_sha",
  "deployed_at",
  "rule",
  "build_top_keys",
  "build_top_keys_contract_730",
] as const;

/** 731：`GET /meta` `strict_mode` 对象顶层键顺序；与 `STRICT_MODE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `strict_mode_top_keys` / `strict_mode_top_keys_contract_731` 对读 */
export const STRICT_MODE_META_TOP_KEYS = [
  "strict_ssot",
  "require_idempotency_key",
  "strict_session_gate",
  "internal_api_secret_configured",
  "rule",
  "strict_mode_top_keys",
  "strict_mode_top_keys_contract_731",
] as const;

/** 732：`GET /meta` `dual_write` 对象顶层键顺序；与 `DUAL_WRITE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `dual_write_top_keys` / `dual_write_top_keys_contract_732` 对读 */
export const DUAL_WRITE_META_TOP_KEYS = [
  "failure_policy",
  "strict_db_write_any",
  "rule",
  "dual_write_top_keys",
  "dual_write_top_keys_contract_732",
] as const;

/** 733：`GET /meta` `ssot` 对象顶层键顺序；与 `SSOT_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `ssot_top_keys` / `ssot_top_keys_contract_733` 对读 */
export const SSOT_META_TOP_KEYS = [
  "expected_sha256",
  "computed_sha256",
  "match",
  "file",
  "rule",
  "ssot_top_keys",
  "ssot_top_keys_contract_733",
] as const;

/** 734：`GET /meta` `admin_exports` 对象顶层键顺序；与 `ADMIN_EXPORTS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `admin_exports_top_keys` / `admin_exports_top_keys_contract_734` 对读 */
export const ADMIN_EXPORTS_META_TOP_KEYS = [
  "reconcile_ed25519_public_key_hex",
  "reconcile_ed25519_response_header",
  "rule",
  "admin_exports_top_keys",
  "admin_exports_top_keys_contract_734",
] as const;

/** 735：`GET /meta` `chargeback_policy` 对象顶层键顺序；与 `CHARGEBACK_POLICY_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `chargeback_policy_top_keys` / `chargeback_policy_top_keys_contract_735` 对读；根级 **`value`** 与 **`CHARGEBACK_POLICY`** 同源 */
export const CHARGEBACK_POLICY_META_TOP_KEYS = [
  "value",
  "rule",
  "chargeback_policy_top_keys",
  "chargeback_policy_top_keys_contract_735",
] as const;

/** 736：`GET /meta` `authority` 对象顶层键顺序；与 `AUTHORITY_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `authority_top_keys` / `authority_top_keys_contract_736` 对读 */
export const AUTHORITY_META_TOP_KEYS = [
  "source",
  "degraded_mode",
  "rule",
  "authority_top_keys",
  "authority_top_keys_contract_736",
] as const;

/** 737：`GET /meta` `pause` 对象顶层键顺序；与 `PAUSE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `pause_top_keys` / `pause_top_keys_contract_737` 对读 */
export const PAUSE_META_TOP_KEYS = [
  "enabled",
  "api_allowlist",
  "rule",
  "pause_top_keys",
  "pause_top_keys_contract_737",
] as const;

/** 738：`GET /meta` `evidence` 对象顶层键顺序；与 `EVIDENCE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `evidence_top_keys` / `evidence_top_keys_contract_738` 对读 */
export const EVIDENCE_META_TOP_KEYS = [
  "timestamp_policy",
  "time_state_path",
  "receipt_signature",
  "rollback_detection",
  "strict_db_write",
  "dual_write_order",
  "rule",
  "evidence_top_keys",
  "evidence_top_keys_contract_738",
] as const;

/** 739：`GET /meta` `order_messages` 对象顶层键顺序；与 `ORDER_MESSAGES_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `order_messages_top_keys` / `order_messages_top_keys_contract_739` 对读 */
export const ORDER_MESSAGES_META_TOP_KEYS = [
  "chain_off_mounted",
  "strict_db_write",
  "dual_write_order",
  "http_rule",
  "rule",
  "order_messages_top_keys",
  "order_messages_top_keys_contract_739",
] as const;

/** 740：`GET /meta` `reviews` 对象顶层键顺序；与 `REVIEWS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `reviews_top_keys` / `reviews_top_keys_contract_740` 对读 */
export const REVIEWS_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "reviews_top_keys",
  "reviews_top_keys_contract_740",
] as const;

/** 741：`GET /meta` `dispute_open` 对象顶层键顺序；与 `DISPUTE_OPEN_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `dispute_open_top_keys` / `dispute_open_top_keys_contract_741` 对读 */
export const DISPUTE_OPEN_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "dispute_open_top_keys",
  "dispute_open_top_keys_contract_741",
] as const;

/** 742：`GET /meta` `dispute_resolve` 对象顶层键顺序；与 `DISPUTE_RESOLVE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `dispute_resolve_top_keys` / `dispute_resolve_top_keys_contract_742` 对读 */
export const DISPUTE_RESOLVE_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "dispute_resolve_top_keys",
  "dispute_resolve_top_keys_contract_742",
] as const;

/** 743：`GET /meta` `itineraries` 对象顶层键顺序；与 `ITINERARIES_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `itineraries_top_keys` / `itineraries_top_keys_contract_743` 对读 */
export const ITINERARIES_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "itineraries_top_keys",
  "itineraries_top_keys_contract_743",
] as const;

/** 744：`GET /meta` `orders` 对象顶层键顺序（含 `list_pagination`、`fee_route_country_ssot`（B-083）、`deadline_rating_observability`、`order_mock_pay_enabled`）；与 `ORDERS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `orders_top_keys` / `orders_top_keys_contract_744` 对读 */
export const ORDERS_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "list_pagination",
  "fee_route_country_ssot",
  "deadline_rating_observability",
  "order_mock_pay_enabled",
  "orders_top_keys",
  "orders_top_keys_contract_744",
] as const;

/** 745：`GET /meta` `discover` 对象顶层键顺序（`strict_db_write` 恒 `false`；含 `orders_pagination`）；与 `DISCOVER_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `discover_top_keys` / `discover_top_keys_contract_745` 对读 */
export const DISCOVER_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "orders_pagination",
  "discover_top_keys",
  "discover_top_keys_contract_745",
] as const;

/** 746：`GET /meta` `product_countries` 对象顶层键顺序（`strict_db_write` 恒 `false`；`iso3166_alpha2`/`name_zh` 在 `rule` 与自描述键之间）；与 `PRODUCT_COUNTRIES_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `product_countries_top_keys` / `product_countries_top_keys_contract_746` 对读 */
export const PRODUCT_COUNTRIES_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "iso3166_alpha2",
  "name_zh",
  "product_countries_top_keys",
  "product_countries_top_keys_contract_746",
] as const;

/** 747：`GET /meta` `did_rank` 对象顶层键顺序（`strict_db_write` 恒 `false`；`chain_off_mounted`/`chain_off_db_pool`/`guides_community_penalty_exclusion` 在 `rule` 与自描述键之间）；与 `DID_RANK_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `did_rank_top_keys` / `did_rank_top_keys_contract_747` 对读 */
export const DID_RANK_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "chain_off_mounted",
  "chain_off_db_pool",
  "guides_community_penalty_exclusion",
  "did_rank_top_keys",
  "did_rank_top_keys_contract_747",
] as const;

/** 748：`GET /meta` `product_roles` 对象顶层键顺序（`strict_db_write` 恒 `false`；角色观测字段在 `rule` 与自描述键之间）；与 `PRODUCT_ROLES_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `product_roles_top_keys` / `product_roles_top_keys_contract_748` 对读 */
export const PRODUCT_ROLES_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "users_role_stored",
  "me_public_role_mapping",
  "protocol_roles_target_87",
  "provider_in_users_role",
  "region_steward_in_users_role",
  "product_roles_top_keys",
  "product_roles_top_keys_contract_748",
] as const;

/** 749：`GET /meta` `auth.registration` 对象顶层键顺序（`strict_db_write` 恒 `false`；业务观测字段在 `rule` 与自描述键之间）；与 `AUTH_REGISTRATION_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `auth_registration_top_keys` / `auth_registration_top_keys_contract_749` 对读 */
export const AUTH_REGISTRATION_META_TOP_KEYS = [
  "strict_db_write",
  "dual_write_order",
  "rule",
  "self_serve_roles_allowed",
  "request_role_aliases",
  "default_role",
  "invalid_role_error_key",
  "arbitrator_seed_env",
  "guide_via_separate_flow_only",
  "auth_registration_top_keys",
  "auth_registration_top_keys_contract_749",
] as const;

/** 750：`GET /meta` 根级 `auth` 对象顶层键顺序（`registration` 内为 **749** `auth.registration`）；与 `AUTH_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `auth_top_keys` / `auth_top_keys_contract_750` 对读 */
export const AUTH_META_TOP_KEYS = [
  "strict_db_write",
  "registration",
  "rule",
  "auth_top_keys",
  "auth_top_keys_contract_750",
] as const;

/** 751：`GET /meta` 根级 `seed_test_accounts` 对象顶层键顺序；与 `SEED_TEST_ACCOUNTS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `seed_test_accounts_top_keys` / `seed_test_accounts_top_keys_contract_751` 对读 */
export const SEED_TEST_ACCOUNTS_META_TOP_KEYS = [
  "strict_db_write",
  "rule",
  "seed_test_accounts_top_keys",
  "seed_test_accounts_top_keys_contract_751",
] as const;

/** 752：`GET /meta` 根级 `guides` 对象顶层键顺序；与 `GUIDES_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `guides_top_keys` / `guides_top_keys_contract_752` 对读 */
export const GUIDES_META_TOP_KEYS = [
  "strict_db_write",
  "rule",
  "guides_top_keys",
  "guides_top_keys_contract_752",
] as const;

/** 753：`GET /meta` 根级 `idempotency_cache` 对象顶层键顺序；与 `IDEMPOTENCY_CACHE_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `idempotency_cache_top_keys` / `idempotency_cache_top_keys_contract_753` 对读 */
export const IDEMPOTENCY_CACHE_META_TOP_KEYS = [
  "memory_max_entries",
  "db_projection",
  "rule",
  "idempotency_cache_top_keys",
  "idempotency_cache_top_keys_contract_753",
] as const;

/** 754：`GET /meta` 根级 `defaults` 对象顶层键顺序；与 `DEFAULTS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `defaults_top_keys` / `defaults_top_keys_contract_754` 对读 */
export const DEFAULTS_META_TOP_KEYS = [
  "request_timeout_secs",
  "request_body_limit_bytes",
  "idempotency_cache_max",
  "rule",
  "defaults_top_keys",
  "defaults_top_keys_contract_754",
] as const;

/** 755：`GET /meta` 根级 `outbox` 对象顶层键顺序；与 `OUTBOX_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `outbox_top_keys` / `outbox_top_keys_contract_755` 对读 */
export const OUTBOX_META_TOP_KEYS = [
  "dir",
  "worker_enabled",
  "lease_secs",
  "poll_ms",
  "max_attempts",
  "rule",
  "outbox_top_keys",
  "outbox_top_keys_contract_755",
] as const;

/** 756：`GET /meta` 根级 `rate_limits` 对象顶层键顺序；与 `RATE_LIMITS_META_TOP_KEYS`（`crates/api` `routes/health_meta.rs`）/ `rate_limits_top_keys` / `rate_limits_top_keys_contract_756` 对读；前十三键与 `middleware/rate_limit.rs` `meta_rate_limits_snapshot` 同源 */
export const RATE_LIMITS_META_TOP_KEYS = [
  "window_seconds",
  "api_requests_per_minute_per_client",
  "api_limit_disabled",
  "critical_writes_per_minute_per_client",
  "critical_limit_disabled",
  "evidence_posts_per_minute_per_order_user",
  "evidence_limit_disabled",
  "review_submits_per_minute_per_order_reviewer",
  "review_limit_disabled",
  "review_low_score_min_comment_chars",
  "review_low_score_rule_disabled",
  "guide_upload",
  "rule",
  "rate_limits_top_keys",
  "rate_limits_top_keys_contract_756",
] as const;

/** 761：`GET /meta` `rate_limits.guide_upload` 对象顶层键顺序；与 `GUIDE_UPLOAD_META_TOP_KEYS`（`crates/api` `middleware/rate_limit.rs`）/ `guide_upload_top_keys` / `guide_upload_top_keys_contract_761` 对读；`max_per_window`/`window_seconds` 与上传限流常量同源 */
export const GUIDE_UPLOAD_META_TOP_KEYS = [
  "max_per_window",
  "window_seconds",
  "rule",
  "guide_upload_top_keys",
  "guide_upload_top_keys_contract_761",
] as const;

/** 762：`GET /meta` `chain.rule` 内句；须与 `crates/api/src/routes/health_meta.rs` `chain_section` `rule` 域逐字同源 */
export const META_CHAIN_RULE_762_GUIDE_UPLOAD_CLAUSE =
  "762：GET /meta rate_limits.guide_upload 对象 guide_upload_top_keys / guide_upload_top_keys_contract_761 与 GUIDE_UPLOAD_META_TOP_KEYS 五键顺序同源（761 子树机读互链）";

/** 763：`GET /meta` `chain.rule` 内句；须与 `crates/api/src/routes/health_meta.rs` `chain_section` `rule` 域逐字同源 */
export const META_CHAIN_RULE_763_ROOT_SERVICE_API_VERSION_CLAUSE =
  "763：GET /meta 根级 service（traveltrust-api）与 api_version（CARGO_PKG_VERSION）为实例版本可观测锚点，与 META_ROOT_TOP_KEYS 首二键 service→api_version 及 728 meta_top_keys 机读同源";

/** 765：`GET /meta` `chain.rule` 内句；须与 `crates/api/src/routes/health_meta.rs` `chain_section` `rule` 域逐字同源 */
export const META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE =
  "765：GET /meta 根级 build 对象 build_top_keys / build_top_keys_contract_730 与 META_BUILD_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第三键 build 及 728 meta_top_keys 机读同源";

/** 766：`GET /meta` `chain.rule` 内句；须与 `crates/api/src/routes/health_meta.rs` `chain_section` `rule` 域逐字同源 */
export const META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE =
  "766：GET /meta 根级 chain 对象 chain_top_keys / chain_top_keys_contract_729 与 CHAIN_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读同源";

/** 767：`GET /meta` `chain.rule` 内句；须与 `crates/api/src/routes/health_meta.rs` `chain_section` `rule` 域逐字同源 */
export const META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE =
  "767：GET /meta 根级 rate_limits 对象 rate_limits_top_keys / rate_limits_top_keys_contract_756 与 RATE_LIMITS_META_TOP_KEYS 十五键顺序同源，与 META_ROOT_TOP_KEYS 第五键 rate_limits 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **768** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE =
  "768：GET /meta 根级 database_connected 与 database.connected 及 DATABASE_META_TOP_KEYS 首键 connected 布尔同源，与 META_ROOT_TOP_KEYS 第六键 database_connected 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **769** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE =
  "769：GET /meta 根级 database 对象 database_top_keys / database_top_keys_contract_760 与 DATABASE_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第七键 database 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **770** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE =
  "770：GET /meta 根级 dual_write 对象 dual_write_top_keys / dual_write_top_keys_contract_732 与 DUAL_WRITE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第八键 dual_write 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **771** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE =
  "771：GET /meta 根级 strict_mode 对象 strict_mode_top_keys / strict_mode_top_keys_contract_731 与 STRICT_MODE_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第九键 strict_mode 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **772** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE =
  "772：GET /meta 根级 ssot_version 与 strict_mode.rule 中「strict_ssot 与 GET /meta.ssot_version 及启动 STRICT_SSOT 同源」一致，与 META_ROOT_TOP_KEYS 第十键 ssot_version 及 728 meta_top_keys 机读同源；733 GET /meta ssot 对象 ssot_top_keys / ssot_top_keys_contract_733 与 SSOT_META_TOP_KEYS 七键顺序同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **773** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE =
  "773：GET /meta 根级 admin_exports 对象 admin_exports_top_keys / admin_exports_top_keys_contract_734 与 ADMIN_EXPORTS_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十二键 admin_exports 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **774** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE =
  "774：GET /meta 根级 chargeback_policy 对象 chargeback_policy_top_keys / chargeback_policy_top_keys_contract_735 与 CHARGEBACK_POLICY_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第十三键 chargeback_policy 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **775** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE =
  "775：GET /meta 根级 finality_n 与 FINALITY_N 及 GET /meta.indexer.finality_n 同源，与 META_ROOT_TOP_KEYS 第十四键 finality_n 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **776** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE =
  "776：GET /meta 根级 indexer 对象 indexer_top_keys / indexer_top_keys_contract_727 与 INDEXER_META_TOP_KEYS 十三键顺序同源，与 META_ROOT_TOP_KEYS 第十五键 indexer 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **777** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE =
  "777：GET /meta 根级 authority 对象 authority_top_keys / authority_top_keys_contract_736 与 AUTHORITY_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十六键 authority 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **778** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE =
  "778：GET /meta 根级 pause 对象 pause_top_keys / pause_top_keys_contract_737 与 PAUSE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十七键 pause 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **779** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE =
  "779：GET /meta 根级 evidence 对象 evidence_top_keys / evidence_top_keys_contract_738 与 EVIDENCE_META_TOP_KEYS 九键顺序同源，与 META_ROOT_TOP_KEYS 第十八键 evidence 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **780** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE =
  "780：GET /meta 根级 order_messages 对象 order_messages_top_keys / order_messages_top_keys_contract_739 与 ORDER_MESSAGES_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第十九键 order_messages 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **781** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE =
  "781：GET /meta 根级 reviews 对象 reviews_top_keys / reviews_top_keys_contract_740 与 REVIEWS_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十键 reviews 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **782** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE =
  "782：GET /meta 根级 dispute_open 对象 dispute_open_top_keys / dispute_open_top_keys_contract_741 与 DISPUTE_OPEN_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十一键 dispute_open 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **783** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE =
  "783：GET /meta 根级 dispute_resolve 对象 dispute_resolve_top_keys / dispute_resolve_top_keys_contract_742 与 DISPUTE_RESOLVE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十二键 dispute_resolve 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **784** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE =
  "784：GET /meta 根级 itineraries 对象 itineraries_top_keys / itineraries_top_keys_contract_743 与 ITINERARIES_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十三键 itineraries 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **785** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE =
  "785：GET /meta 根级 orders 对象 orders_top_keys / orders_top_keys_contract_744 与 ORDERS_META_TOP_KEYS 九键顺序同源，与 META_ROOT_TOP_KEYS 第二十四键 orders 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **786** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE =
  "786：GET /meta 根级 discover 对象 discover_top_keys / discover_top_keys_contract_745 与 DISCOVER_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第二十五键 discover 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **787** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE =
  "787：GET /meta 根级 product_countries 对象 product_countries_top_keys / product_countries_top_keys_contract_746 与 PRODUCT_COUNTRIES_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第二十六键 product_countries 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **788** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE =
  "788：GET /meta 根级 did_rank 对象 did_rank_top_keys / did_rank_top_keys_contract_747 与 DID_RANK_META_TOP_KEYS 八键顺序同源，与 META_ROOT_TOP_KEYS 第二十七键 did_rank 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **789** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE =
  "789：GET /meta 根级 product_roles 对象 product_roles_top_keys / product_roles_top_keys_contract_748 与 PRODUCT_ROLES_META_TOP_KEYS 十键顺序同源，与 META_ROOT_TOP_KEYS 第二十八键 product_roles 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **790** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE =
  "790：GET /meta 根级 auth 对象 auth_top_keys / auth_top_keys_contract_750 与 AUTH_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十九键 auth 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **791** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE =
  "791：GET /meta 根级 seed_test_accounts 对象 seed_test_accounts_top_keys / seed_test_accounts_top_keys_contract_751 与 SEED_TEST_ACCOUNTS_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第三十键 seed_test_accounts 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **792** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE =
  "792：GET /meta 根级 guides 对象 guides_top_keys / guides_top_keys_contract_752 与 GUIDES_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第三十一键 guides 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **793** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE =
  "793：GET /meta 根级 idempotency_cache 对象 idempotency_cache_top_keys / idempotency_cache_top_keys_contract_753 与 IDEMPOTENCY_CACHE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第三十二键 idempotency_cache 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **794** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE =
  "794：GET /meta 根级 defaults 对象 defaults_top_keys / defaults_top_keys_contract_754 与 DEFAULTS_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第三十三键 defaults 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **795** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE =
  "795：GET /meta 根级 outbox 对象 outbox_top_keys / outbox_top_keys_contract_755 与 OUTBOX_META_TOP_KEYS 八键顺序同源，与 META_ROOT_TOP_KEYS 第三十四键 outbox 及 728 meta_top_keys 机读同源";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **796** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE =
  "796：GET /meta 根级 meta_top_keys JSON 数组与 META_ROOT_TOP_KEYS 三十六键顺序同源，根级 meta_top_keys_contract_728 机读与 728 contract 同源，与 META_ROOT_TOP_KEYS 第三十五键 meta_top_keys 机读互链";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **797** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE =
  "797：GET /meta 根级 meta_top_keys_contract_728 与 META_ROOT_TOP_KEYS 第三十六键 meta_top_keys_contract_728 机读同源，与 728 contract、META_ROOT_TOP_KEYS 第三十五键 meta_top_keys 机读互链";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **798** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE =
  "798：GET /meta 根级 meta_top_keys JSON 数组三十六项与 META_ROOT_TOP_KEYS 三十六键顺序逐项同源，meta_top_keys_contract_728 嵌入三十六键字面顺序同源，796 与 797 与文末 728 句链式互证";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **799** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE =
  "799：798 句与文末 728 句机读相邻互锁，双锚根级 meta_top_keys JSON 数组三十六项与 META_ROOT_TOP_KEYS 三十六键及 meta_top_keys_contract_728 字面顺序同源闭环";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **800** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE =
  "800：799 双锚闭环与 GET /meta chain 对象 729 chain_top_keys / chain_top_keys_contract_729 及 CHAIN_META_TOP_KEYS 五键机读同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 766 机读句串联互证";

/** 与 `crates/api` `routes/health_meta.rs` `chain_section.rule` 中 **801** 句须字节级一致（CI / smoke 对读） */
export const META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE =
  "801：800 串联与 GET /meta chain.contracts 非 null 时 759 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 及 CHAIN_CONTRACTS_META_TOP_KEYS 十键机读同源，与 799 双锚闭环及 766/729 chain 子树三向互证";

/** 802：`GET /meta` `chain.rule` 机读句（`health_meta.rs` `chain_section.rule`）— 与 Rust 字符串字节一致。 */
export const META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE =
  "802：801 串联与 GET /meta chain.contracts 非 null 时 contracts.rule 嵌入之 759 句与根级 chain.rule 759 及 801 十键机读核心同源，与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 及 801 四向互证";

/** 803：`GET /meta` `chain.rule` 机读句（`health_meta.rs` `chain_section.rule`）— 与 Rust 字符串字节一致。 */
export const META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE =
  "803：802 串联与 800 及 766 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 / CHAIN_META_TOP_KEYS 五键机读同源，与 799 双锚经 729、801、759、802 contracts.rule 根级 chain.rule 759 嵌入形成五向链读闭环，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读六向互证";

/** 804：`GET /meta` `chain.rule` 机读句（`health_meta.rs` `chain_section.rule`）— 与 Rust 字符串字节一致。 */
export const META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE =
  "804：803 六向互证与 GET /meta chain.chain_id 及根级 chain.rule 文首与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐及 contracts 见 ChainConfig 机读同源，七向收束 803 链读至 CHAIN_META_TOP_KEYS 首键 chain_id 部署观测锚，与 chain_top_keys / chain_top_keys_contract_729 及 803 七向互证";

/** 805：`GET /meta` `chain.rule` 机读句（`health_meta.rs` `chain_section.rule`）— 与 Rust 字符串字节一致。 */
export const META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE =
  "805：804 七向互证与 GET /meta chain.contracts 及 CHAIN_META_TOP_KEYS 第二键 contracts 机读同源，八向收束 804 链读至 contracts 部署观测锚与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 十键及 801 三向 802 四向 803 六向串联，与 chain_top_keys / chain_top_keys_contract_729 及 804 八向互证";

/** 806：`GET /meta` `chain.rule` 机读句（`health_meta.rs` `chain_section.rule`）— 与 Rust 字符串字节一致。 */
export const META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE =
  "806：805 八向互证与 GET /meta chain.rule 及 CHAIN_META_TOP_KEYS 第三键 rule 机读同源，九向收束 805 链读至根级 chain.rule 文首与 intents EIP-712 domain、NEXT_PUBLIC_CHAIN_ID、ChainConfig、759 句及 contracts.rule 759 嵌入与 801 三向 802 四向 803 六向 804 七向 805 八向串联，与 chain_top_keys / chain_top_keys_contract_729 及 805 九向互证";

/** `GET /meta.auth.registration`（693 / 694 / 695 / 697，与 `POST /auth/register` 可选 `role` 同源） */
export type AuthRegistrationMeta = {
  self_serve_roles_allowed: string[];
  /** 请求体别名 → `users.role` 存储值（**697** 起常为空对象；**695** 曾为 `traveler`→`tourist`） */
  request_role_aliases: Record<string, string>;
  default_role: string;
  invalid_role_error_key: string;
  arbitrator_seed_env: string;
  guide_via_separate_flow_only: boolean;
  rule: string;
};

function parseProductRolesFields(o: Record<string, unknown>): ProductRolesMeta | null {
  const stored = o.users_role_stored;
  if (!Array.isArray(stored) || !stored.every((x) => typeof x === "string")) return null;
  const mapRaw = o.me_public_role_mapping;
  if (mapRaw == null || typeof mapRaw !== "object" || Array.isArray(mapRaw)) return null;
  const me_public_role_mapping: Record<string, string> = {};
  for (const [k, v] of Object.entries(mapRaw as Record<string, unknown>)) {
    if (typeof v !== "string") return null;
    me_public_role_mapping[k] = v;
  }
  const target = o.protocol_roles_target_87;
  if (!Array.isArray(target) || !target.every((x) => typeof x === "string")) return null;
  if (typeof o.provider_in_users_role !== "boolean") return null;
  if (typeof o.region_steward_in_users_role !== "boolean") return null;
  const rule = o.rule;
  if (typeof rule !== "string" || !rule.trim()) return null;
  return {
    users_role_stored: stored as string[],
    me_public_role_mapping,
    protocol_roles_target_87: target as string[],
    provider_in_users_role: o.provider_in_users_role,
    region_steward_in_users_role: o.region_steward_in_users_role,
    rule: rule.trim(),
  };
}

/**
 * 从 **GET /meta** 根对象解析 **`product_roles`**；形状与后端 **`product_roles_meta_obs_json`** 对齐（690 / 692）。
 * 缺域或类型不符时返回 **null**（fail-closed）。
 */
export function readProductRolesFromMeta(meta: Record<string, unknown>): ProductRolesMeta | null {
  const raw = meta.product_roles;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  return parseProductRolesFields(raw as Record<string, unknown>);
}

function parseAuthRegistrationFields(o: Record<string, unknown>): AuthRegistrationMeta | null {
  const allowed = o.self_serve_roles_allowed;
  if (!Array.isArray(allowed) || !allowed.every((x) => typeof x === "string")) return null;
  const aliasesRaw = o.request_role_aliases;
  if (aliasesRaw == null || typeof aliasesRaw !== "object" || Array.isArray(aliasesRaw)) return null;
  const request_role_aliases: Record<string, string> = {};
  for (const [k, v] of Object.entries(aliasesRaw as Record<string, unknown>)) {
    if (typeof v !== "string") return null;
    request_role_aliases[k] = v;
  }
  if (typeof o.default_role !== "string" || !o.default_role.trim()) return null;
  if (typeof o.invalid_role_error_key !== "string" || !o.invalid_role_error_key.trim()) return null;
  if (typeof o.arbitrator_seed_env !== "string" || !o.arbitrator_seed_env.trim()) return null;
  if (typeof o.guide_via_separate_flow_only !== "boolean") return null;
  const rule = o.rule;
  if (typeof rule !== "string" || !rule.trim()) return null;
  return {
    self_serve_roles_allowed: allowed as string[],
    request_role_aliases,
    default_role: o.default_role.trim(),
    invalid_role_error_key: o.invalid_role_error_key.trim(),
    arbitrator_seed_env: o.arbitrator_seed_env.trim(),
    guide_via_separate_flow_only: o.guide_via_separate_flow_only,
    rule: rule.trim(),
  };
}

/**
 * 从 **GET /meta** 解析 **`auth.registration`**；与后端 **`auth_registration_meta_obs_json`** 对齐（694～697；**749** 机读键 `auth_registration_top_keys` / `contract_749` 为观测字段，本解析器不返回）。
 */
export function readAuthRegistrationFromMeta(meta: Record<string, unknown>): AuthRegistrationMeta | null {
  const auth = meta.auth;
  if (auth == null || typeof auth !== "object" || Array.isArray(auth)) return null;
  const reg = (auth as Record<string, unknown>).registration;
  if (reg == null || typeof reg !== "object" || Array.isArray(reg)) return null;
  return parseAuthRegistrationFields(reg as Record<string, unknown>);
}

function parseMetaBuildFields(b: Record<string, unknown>): MetaBuildInfo | null {
  const sha = b.git_sha;
  if (typeof sha !== "string" || !sha.trim()) return null;
  const dep = b.deployed_at;
  let deployed_at: string | null = null;
  if (typeof dep === "string" && dep.trim()) deployed_at = dep.trim();
  else if (dep !== null && dep !== undefined) return null;
  return { git_sha: sha.trim(), deployed_at };
}

/**
 * 从 GET /meta 根对象解析 `build`；与后端 `meta_build_snapshot` 形状对齐。
 * 无 `build` 或非对象时返回 null（旧 API 兼容）；`git_sha` 须为非空字符串。
 */
export function readMetaBuild(meta: Record<string, unknown>): MetaBuildInfo | null {
  const raw = meta.build;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  return parseMetaBuildFields(raw as Record<string, unknown>);
}

/**
 * 解析 **GET /meta/build** 根对象（与 **`readMetaBuild` 作用于 `.build`** 等价，689）。
 */
export function readMetaBuildRoot(root: Record<string, unknown>): MetaBuildInfo | null {
  return parseMetaBuildFields(root);
}

export async function getMeta(): Promise<Record<string, unknown>> {
  const url = apiUrl(routes.meta);
  const init = { headers: { "x-request-id": requestId() } };
  let last: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok && [408, 429, 502, 503].includes(res.status) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      const parsed = await parseResponse(res);
      logApiJsonStatusNotOk("getMeta", parsed);
      throwUnlessApiOk(parsed);
      return parsed as Record<string, unknown>;
    } catch (e) {
      last = e;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
    }
  }
  throw last;
}

/** **GET /meta/build**：仅取 **`git_sha`** / **`deployed_at`**（与 **`getMeta`+`readMetaBuild`** 同源，688/689）。 */
export async function getMetaBuild(): Promise<MetaBuildInfo> {
  const res = await fetch(apiUrl(routes.metaBuild), {
    headers: { "x-request-id": requestId() },
  });
  const parsed = await parseResponse(res);
  logApiJsonStatusNotOk("getMetaBuild", parsed);
  throwUnlessApiOk(parsed);
  const info = readMetaBuildRoot(parsed as Record<string, unknown>);
  if (!info) throw new Error("meta_build_invalid");
  return info;
}
