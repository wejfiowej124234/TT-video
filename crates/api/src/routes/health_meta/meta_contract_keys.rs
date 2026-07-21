//! GET `/meta` 机读锁：各子对象 `*_top_keys` 与 `*_contract_*` 文案（批 726–760 等）。

/// **726**：`GET /meta` **`indexer.finality_discipline`** 对象顶层键顺序（机读锁 **`finality_discipline_top_keys`** / **`finality_discipline_top_keys_contract_726`**；与同名列 JSON 数组同源）。
pub const FINALITY_DISCIPLINE_META_TOP_KEYS: &[&str] = &[
    "tick_logs_upper_bound",
    "postgres_event_log_has_finality_n_used",
    "order_chain_sync_status",
    "chain_tip_not_in_meta",
    "chain_tip_hint",
    "finality_discipline_top_keys",
    "finality_discipline_top_keys_contract_726",
];

pub fn format_finality_discipline_meta_top_keys_contract_726() -> String {
    let mut s = String::from(
        "**726**：**`finality_discipline_top_keys`** **与 **`FINALITY_DISCIPLINE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in FINALITY_DISCIPLINE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **727**：`GET /meta` **`indexer`** 对象顶层键顺序（机读锁 **`indexer_top_keys`** / **`indexer_top_keys_contract_727`**；与同名列 JSON 数组同源）。
pub const INDEXER_META_TOP_KEYS: &[&str] = &[
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
];

pub fn format_indexer_meta_top_keys_contract_727() -> String {
    let mut s = String::from(
        "**727**：**`indexer_top_keys`** **与 **`INDEXER_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in INDEXER_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **757**：`GET /meta` **`indexer.memory`** 对象顶层键顺序（机读锁 **`indexer_memory_top_keys`** / **`indexer_memory_top_keys_contract_757`**；与同名列 JSON 数组同源）。
pub const INDEXER_MEMORY_META_TOP_KEYS: &[&str] = &[
    "available",
    "last_block",
    "last_log_index",
    "last_block_hash_prefix",
    "events_cached",
    "rule",
    "indexer_memory_top_keys",
    "indexer_memory_top_keys_contract_757",
];

pub fn format_indexer_memory_meta_top_keys_contract_757() -> String {
    let mut s = String::from(
        "**757**：**`indexer_memory_top_keys`** **与 **`INDEXER_MEMORY_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in INDEXER_MEMORY_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **758**：`GET /meta` **`indexer.checkpoint`** 对象顶层键顺序（机读锁 **`indexer_checkpoint_top_keys`** / **`indexer_checkpoint_top_keys_contract_758`**；与同名列 JSON 数组同源）。
pub const INDEXER_CHECKPOINT_META_TOP_KEYS: &[&str] = &[
    "block_number",
    "log_index",
    "source",
    "rule",
    "indexer_checkpoint_top_keys",
    "indexer_checkpoint_top_keys_contract_758",
];

pub fn format_indexer_checkpoint_meta_top_keys_contract_758() -> String {
    let mut s = String::from(
        "**758**：**`indexer_checkpoint_top_keys`** **与 **`INDEXER_CHECKPOINT_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in INDEXER_CHECKPOINT_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **728**：`GET /meta` **根对象**顶层键顺序（机读锁 **`meta_top_keys`** / **`meta_top_keys_contract_728`**；与同名列 JSON 数组同源）。
pub const META_ROOT_TOP_KEYS: &[&str] = &[
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
    "governance",
    "idempotency_cache",
    "defaults",
    "outbox",
    "meta_top_keys",
    "meta_top_keys_contract_728",
];

pub fn format_meta_root_top_keys_contract_728() -> String {
    let mut s =
        String::from("**728**：**`meta_top_keys`** **与 **`META_ROOT_TOP_KEYS`** **同源（顺序 ");
    for (i, k) in META_ROOT_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **760**：`GET /meta` **`database`** 对象顶层键顺序（机读锁 **`database_top_keys`** / **`database_top_keys_contract_760`**；与同名列 JSON 数组同源）。
pub const DATABASE_META_TOP_KEYS: &[&str] = &[
    "connected",
    "rule",
    "database_top_keys",
    "database_top_keys_contract_760",
];

pub fn format_database_meta_top_keys_contract_760() -> String {
    let mut s = String::from(
        "**760**：**`database_top_keys`** **与 **`DATABASE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DATABASE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **729**：`GET /meta` **`chain`** 对象顶层键顺序（机读锁 **`chain_top_keys`** / **`chain_top_keys_contract_729`**；与同名列 JSON 数组同源）。
pub const CHAIN_META_TOP_KEYS: &[&str] = &[
    "chain_id",
    "contracts",
    "rule",
    "chain_top_keys",
    "chain_top_keys_contract_729",
];

pub fn format_chain_meta_top_keys_contract_729() -> String {
    let mut s =
        String::from("**729**：**`chain_top_keys`** **与 **`CHAIN_META_TOP_KEYS`** **同源（顺序 ");
    for (i, k) in CHAIN_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **759**：`GET /meta` **`chain.contracts`** 对象顶层键顺序（仅 **`ChainConfig`** 挂载、**`contracts`** **非 **null** 时存在；机读锁 **`chain_contracts_top_keys`** / **`chain_contracts_top_keys_contract_759`**；与同名列 JSON 数组同源；**共 14 键**；与 **`frontend/lib/apiClient/meta` `CHAIN_CONTRACTS_META_TOP_KEYS`** 对读）。
pub const CHAIN_CONTRACTS_META_TOP_KEYS: &[&str] = &[
    "guide_staking_address",
    "staking_provider_address",
    "governor_address",
    "timelock_address",
    "governance_token_address",
    "fee_router_address",
    "treasury_address",
    "registry_address",
    "escrow_factory_address",
    "escrow_factory_v2_address",
    "region_steward_stake_pool_address",
    "rule",
    "chain_contracts_top_keys",
    "chain_contracts_top_keys_contract_759",
];

pub fn format_chain_contracts_meta_top_keys_contract_759() -> String {
    let mut s = String::from(
        "**759**：**`chain_contracts_top_keys`** **与 **`CHAIN_CONTRACTS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in CHAIN_CONTRACTS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **730**：`GET /meta`（及 **`GET /meta/build`**）**`build`** 对象顶层键顺序（机读锁 **`build_top_keys`** / **`build_top_keys_contract_730`**；在 **`meta_build_snapshot`** 的 **`git_sha`****/**`deployed_at`****/**`rule`** 之后追加自描述键，与 **`meta_build_value`** 同源）。
/// **730**：`GET /meta` **`build`** 对象顶层键顺序（含 Runtime Attestation 字段）。
pub const META_BUILD_TOP_KEYS: &[&str] = &[
    "git_sha",
    "deployed_at",
    "deployment_profile",
    "psg_release_version",
    "image_digest",
    "build_time",
    "contract_profile",
    "attestation_status",
    "rule",
    "build_top_keys",
    "build_top_keys_contract_730",
];

pub fn format_meta_build_top_keys_contract_730() -> String {
    let mut s =
        String::from("**730**：**`build_top_keys`** **与 **`META_BUILD_TOP_KEYS`** **同源（顺序 ");
    for (i, k) in META_BUILD_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}


pub const STRICT_MODE_META_TOP_KEYS: &[&str] = &[
    "strict_ssot",
    "require_idempotency_key",
    "strict_session_gate",
    "internal_api_secret_configured",
    "rule",
    "strict_mode_top_keys",
    "strict_mode_top_keys_contract_731",
];

pub fn format_strict_mode_meta_top_keys_contract_731() -> String {
    let mut s = String::from(
        "**731**：**`strict_mode_top_keys`** **与 **`STRICT_MODE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in STRICT_MODE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **732**：`GET /meta` **`dual_write`** 对象顶层键顺序（机读锁 **`dual_write_top_keys`** / **`dual_write_top_keys_contract_732`**；与同名列 JSON 数组同源）。
pub const DUAL_WRITE_META_TOP_KEYS: &[&str] = &[
    "failure_policy",
    "strict_db_write_any",
    "rule",
    "dual_write_top_keys",
    "dual_write_top_keys_contract_732",
];

pub fn format_dual_write_meta_top_keys_contract_732() -> String {
    let mut s = String::from(
        "**732**：**`dual_write_top_keys`** **与 **`DUAL_WRITE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DUAL_WRITE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **733**：`GET /meta` **`ssot`** 对象顶层键顺序（机读锁 **`ssot_top_keys`** / **`ssot_top_keys_contract_733`**；与同名列 JSON 数组同源）。
pub const SSOT_META_TOP_KEYS: &[&str] = &[
    "expected_sha256",
    "computed_sha256",
    "match",
    "file",
    "rule",
    "ssot_top_keys",
    "ssot_top_keys_contract_733",
];

pub fn format_ssot_meta_top_keys_contract_733() -> String {
    let mut s =
        String::from("**733**：**`ssot_top_keys`** **与 **`SSOT_META_TOP_KEYS`** **同源（顺序 ");
    for (i, k) in SSOT_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **734**：`GET /meta` **`admin_exports`** 对象顶层键顺序（机读锁 **`admin_exports_top_keys`** / **`admin_exports_top_keys_contract_734`**；与同名列 JSON 数组同源）。
pub const ADMIN_EXPORTS_META_TOP_KEYS: &[&str] = &[
    "reconcile_ed25519_public_key_hex",
    "reconcile_ed25519_response_header",
    "rule",
    "admin_exports_top_keys",
    "admin_exports_top_keys_contract_734",
];

pub fn format_admin_exports_meta_top_keys_contract_734() -> String {
    let mut s = String::from(
        "**734**：**`admin_exports_top_keys`** **与 **`ADMIN_EXPORTS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in ADMIN_EXPORTS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **735**：`GET /meta` **`chargeback_policy`** 对象顶层键顺序（机读锁 **`chargeback_policy_top_keys`** / **`chargeback_policy_top_keys_contract_735`**；与同名列 JSON 数组同源）。**`value`** 与 **`CHARGEBACK_POLICY`** / **`ApiMetaState.chargeback_policy`** 同源（**735** 起根级 **`chargeback_policy`** **为对象**，**非** **历史** **裸** **字符串**）。
pub const CHARGEBACK_POLICY_META_TOP_KEYS: &[&str] = &[
    "value",
    "rule",
    "chargeback_policy_top_keys",
    "chargeback_policy_top_keys_contract_735",
];

pub fn format_chargeback_policy_meta_top_keys_contract_735() -> String {
    let mut s = String::from(
        "**735**：**`chargeback_policy_top_keys`** **与 **`CHARGEBACK_POLICY_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in CHARGEBACK_POLICY_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **736**：`GET /meta` **`authority`** 对象顶层键顺序（机读锁 **`authority_top_keys`** / **`authority_top_keys_contract_736`**；与同名列 JSON 数组同源）。
pub const AUTHORITY_META_TOP_KEYS: &[&str] = &[
    "source",
    "degraded_mode",
    "rule",
    "authority_top_keys",
    "authority_top_keys_contract_736",
];

pub fn format_authority_meta_top_keys_contract_736() -> String {
    let mut s = String::from(
        "**736**：**`authority_top_keys`** **与 **`AUTHORITY_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in AUTHORITY_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **737**：`GET /meta` **`pause`** 对象顶层键顺序（机读锁 **`pause_top_keys`** / **`pause_top_keys_contract_737`**；与同名列 JSON 数组同源）。
pub const PAUSE_META_TOP_KEYS: &[&str] = &[
    "enabled",
    "api_allowlist",
    "factory_paused",
    "distribute_paused",
    "chain_pause_read",
    "rule",
    "pause_top_keys",
    "pause_top_keys_contract_737",
];

/// **`pause.chain_pause_read`** 子对象键序（**B-091** / **TT-COMP-B091**）。
pub const CHAIN_PAUSE_READ_META_TOP_KEYS: &[&str] = &["status", "error", "rule"];

pub fn format_pause_meta_top_keys_contract_737() -> String {
    let mut s =
        String::from("**737**：**`pause_top_keys`** **与 **`PAUSE_META_TOP_KEYS`** **同源（顺序 ");
    for (i, k) in PAUSE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **738**：`GET /meta` **`evidence`** 对象顶层键顺序（机读锁 **`evidence_top_keys`** / **`evidence_top_keys_contract_738`**；与同名列 JSON 数组同源）。
pub const EVIDENCE_META_TOP_KEYS: &[&str] = &[
    "timestamp_policy",
    "time_state_path",
    "receipt_signature",
    "rollback_detection",
    "strict_db_write",
    "dual_write_order",
    "rule",
    "evidence_top_keys",
    "evidence_top_keys_contract_738",
];

pub fn format_evidence_meta_top_keys_contract_738() -> String {
    let mut s = String::from(
        "**738**：**`evidence_top_keys`** **与 **`EVIDENCE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in EVIDENCE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **739**：`GET /meta` **`order_messages`** 对象顶层键顺序（机读锁 **`order_messages_top_keys`** / **`order_messages_top_keys_contract_739`**；与同名列 JSON 数组同源）。
pub const ORDER_MESSAGES_META_TOP_KEYS: &[&str] = &[
    "chain_off_mounted",
    "strict_db_write",
    "dual_write_order",
    "http_rule",
    "rule",
    "order_messages_top_keys",
    "order_messages_top_keys_contract_739",
];

pub fn format_order_messages_meta_top_keys_contract_739() -> String {
    let mut s = String::from(
        "**739**：**`order_messages_top_keys`** **与 **`ORDER_MESSAGES_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in ORDER_MESSAGES_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **740**：`GET /meta` **`reviews`** 对象顶层键顺序（机读锁 **`reviews_top_keys`** / **`reviews_top_keys_contract_740`**；与同名列 JSON 数组同源）。
pub const REVIEWS_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "reviews_top_keys",
    "reviews_top_keys_contract_740",
];

pub fn format_reviews_meta_top_keys_contract_740() -> String {
    let mut s = String::from(
        "**740**：**`reviews_top_keys`** **与 **`REVIEWS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in REVIEWS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **741**：`GET /meta` **`dispute_open`** 对象顶层键顺序（机读锁 **`dispute_open_top_keys`** / **`dispute_open_top_keys_contract_741`**；与同名列 JSON 数组同源）。
pub const DISPUTE_OPEN_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "dispute_open_top_keys",
    "dispute_open_top_keys_contract_741",
];

pub fn format_dispute_open_meta_top_keys_contract_741() -> String {
    let mut s = String::from(
        "**741**：**`dispute_open_top_keys`** **与 **`DISPUTE_OPEN_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DISPUTE_OPEN_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **742**：`GET /meta` **`dispute_resolve`** 对象顶层键顺序（机读锁 **`dispute_resolve_top_keys`** / **`dispute_resolve_top_keys_contract_742`**；与同名列 JSON 数组同源）。
pub const DISPUTE_RESOLVE_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "dispute_resolve_top_keys",
    "dispute_resolve_top_keys_contract_742",
];

pub fn format_dispute_resolve_meta_top_keys_contract_742() -> String {
    let mut s = String::from(
        "**742**：**`dispute_resolve_top_keys`** **与 **`DISPUTE_RESOLVE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DISPUTE_RESOLVE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **743**：`GET /meta` **`itineraries`** 对象顶层键顺序（机读锁 **`itineraries_top_keys`** / **`itineraries_top_keys_contract_743`**；与同名列 JSON 数组同源）。
pub const ITINERARIES_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "itineraries_top_keys",
    "itineraries_top_keys_contract_743",
];

pub fn format_itineraries_meta_top_keys_contract_743() -> String {
    let mut s = String::from(
        "**743**：**`itineraries_top_keys`** **与 **`ITINERARIES_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in ITINERARIES_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **744**：`GET /meta` **`orders`** 对象顶层键顺序（机读锁 **`orders_top_keys`** / **`orders_top_keys_contract_744`**；与同名列 JSON 数组同源；**`fee_route_country_ssot`** 位于 **`list_pagination`** 与自描述键之间）。
pub const ORDERS_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "list_pagination",
    "fee_route_country_ssot",
    "deadline_rating_observability",
    "order_mock_pay_enabled",
    "orders_top_keys",
    "orders_top_keys_contract_744",
];

pub fn format_orders_meta_top_keys_contract_744() -> String {
    let mut s = String::from(
        "**744**：**`orders_top_keys`** **与 **`ORDERS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in ORDERS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **745**：`GET /meta` **`discover`** 对象顶层键顺序（机读锁 **`discover_top_keys`** / **`discover_top_keys_contract_745`**；与同名列 JSON 数组同源；**`orders_pagination`** 位于 **`rule`** 与自描述键之间）。
pub const DISCOVER_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "orders_pagination",
    "discover_top_keys",
    "discover_top_keys_contract_745",
];

pub fn format_discover_meta_top_keys_contract_745() -> String {
    let mut s = String::from(
        "**745**：**`discover_top_keys`** **与 **`DISCOVER_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DISCOVER_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **746**：`GET /meta` **`product_countries`** 对象顶层键顺序（机读锁 **`product_countries_top_keys`** / **`product_countries_top_keys_contract_746`**；与同名列 JSON 数组同源；**`iso3166_alpha2`****/**`name_zh`** **位于 **`rule`** **与** **自描述键** **之间**）。
pub const PRODUCT_COUNTRIES_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "iso3166_alpha2",
    "name_zh",
    "product_countries_top_keys",
    "product_countries_top_keys_contract_746",
];

pub fn format_product_countries_meta_top_keys_contract_746() -> String {
    let mut s = String::from(
        "**746**：**`product_countries_top_keys`** **与 **`PRODUCT_COUNTRIES_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in PRODUCT_COUNTRIES_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **747**：`GET /meta` **`did_rank`** 对象顶层键顺序（机读锁 **`did_rank_top_keys`** / **`did_rank_top_keys_contract_747`**；与同名列 JSON 数组同源；**`chain_off_mounted`****/**`chain_off_db_pool`****/**`guides_community_penalty_exclusion`** **位于 **`rule`** **与** **自描述键** **之间**）。
pub const DID_RANK_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "chain_off_mounted",
    "chain_off_db_pool",
    "guides_community_penalty_exclusion",
    "did_rank_top_keys",
    "did_rank_top_keys_contract_747",
];

pub fn format_did_rank_meta_top_keys_contract_747() -> String {
    let mut s = String::from(
        "**747**：**`did_rank_top_keys`** **与 **`DID_RANK_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DID_RANK_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **748**：`GET /meta` **`product_roles`** 对象顶层键顺序（机读锁 **`product_roles_top_keys`** / **`product_roles_top_keys_contract_748`**；与同名列 JSON 数组同源；**`users_role_stored`****/**`me_public_role_mapping`****/**`protocol_roles_target_87`****/**`provider_in_users_role`****/**`region_steward_in_users_role`** **位于 **`rule`** **与** **自描述键** **之间**）。
pub const PRODUCT_ROLES_META_TOP_KEYS: &[&str] = &[
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
];

pub fn format_product_roles_meta_top_keys_contract_748() -> String {
    let mut s = String::from(
        "**748**：**`product_roles_top_keys`** **与 **`PRODUCT_ROLES_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in PRODUCT_ROLES_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **749**：`GET /meta` **`auth.registration`** 对象顶层键顺序（机读锁 **`auth_registration_top_keys`** / **`auth_registration_top_keys_contract_749`**；与同名列 JSON 数组同源；**`self_serve_roles_allowed`****/**`request_role_aliases`****/**`default_role`****/**`invalid_role_error_key`****/**`arbitrator_seed_env`****/**`guide_via_separate_flow_only`** **位于 **`rule`** **与** **自描述键** **之间**）。
pub const AUTH_REGISTRATION_META_TOP_KEYS: &[&str] = &[
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
];

pub fn format_auth_registration_meta_top_keys_contract_749() -> String {
    let mut s = String::from(
        "**749**：**`auth_registration_top_keys`** **与 **`AUTH_REGISTRATION_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in AUTH_REGISTRATION_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **750**：`GET /meta` **`auth`** 对象顶层键顺序（机读锁 **`auth_top_keys`** / **`auth_top_keys_contract_750`**；与同名列 JSON 数组同源；**`registration`** **嵌** **749** **`auth.registration`**）。
pub const AUTH_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "registration",
    "rule",
    "auth_top_keys",
    "auth_top_keys_contract_750",
];

pub fn format_auth_meta_top_keys_contract_750() -> String {
    let mut s =
        String::from("**750**：**`auth_top_keys`** **与 **`AUTH_META_TOP_KEYS`** **同源（顺序 ");
    for (i, k) in AUTH_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **751**：`GET /meta` **`seed_test_accounts`** 对象顶层键顺序（机读锁 **`seed_test_accounts_top_keys`** / **`seed_test_accounts_top_keys_contract_751`**；与同名列 JSON 数组同源）。
pub const SEED_TEST_ACCOUNTS_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "rule",
    "seed_test_accounts_top_keys",
    "seed_test_accounts_top_keys_contract_751",
];

pub fn format_seed_test_accounts_meta_top_keys_contract_751() -> String {
    let mut s = String::from(
        "**751**：**`seed_test_accounts_top_keys`** **与 **`SEED_TEST_ACCOUNTS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in SEED_TEST_ACCOUNTS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **752**：`GET /meta` **`guides`** 对象顶层键顺序（机读锁 **`guides_top_keys`** / **`guides_top_keys_contract_752`**；与同名列 JSON 数组同源）。
pub const GUIDES_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "rule",
    "guides_top_keys",
    "guides_top_keys_contract_752",
];

pub fn format_guides_meta_top_keys_contract_752() -> String {
    let mut s = String::from(
        "**752**：**`guides_top_keys`** **与 **`GUIDES_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in GUIDES_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **807**：`GET /meta` **`governance`** 对象顶层键顺序（机读锁 **`governance_top_keys`** / **`governance_top_keys_contract_807`**；与同名列 JSON 数组同源）。
pub const GOVERNANCE_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "rule",
    "governor_view_params_observability",
    "governor_token_timelock_observability",
    "timelock_delay_observability",
    "governor_proposal_threshold_observability",
    "timelock_governor_admin_observability",
    "governor_proposal_count_observability",
    "governance_top_keys",
    "governance_top_keys_contract_807",
];

pub fn format_governance_meta_top_keys_contract_807() -> String {
    let mut s = String::from(
        "**807**：**`governance_top_keys`** **与 **`GOVERNANCE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in GOVERNANCE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **B-177**：**`GET /meta` → `governance`** 根级键序与 **`GOVERNANCE_META_TOP_KEYS`**（807）一致。
pub fn governance_object_keys_match_contract_807(governance: &serde_json::Value) -> bool {
    let Some(obj) = governance.as_object() else {
        return false;
    };
    let keys: Vec<&str> = obj.keys().map(|k| k.as_str()).collect();
    keys.len() == GOVERNANCE_META_TOP_KEYS.len()
        && keys
            .iter()
            .zip(GOVERNANCE_META_TOP_KEYS.iter())
            .all(|(a, b)| *a == *b)
}

/// **753**：`GET /meta` **`idempotency_cache`** 对象顶层键顺序（机读锁 **`idempotency_cache_top_keys`** / **`idempotency_cache_top_keys_contract_753`**；与同名列 JSON 数组同源）。
pub const IDEMPOTENCY_CACHE_META_TOP_KEYS: &[&str] = &[
    "memory_max_entries",
    "db_projection",
    "rule",
    "idempotency_cache_top_keys",
    "idempotency_cache_top_keys_contract_753",
];

pub fn format_idempotency_cache_meta_top_keys_contract_753() -> String {
    let mut s = String::from(
        "**753**：**`idempotency_cache_top_keys`** **与 **`IDEMPOTENCY_CACHE_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in IDEMPOTENCY_CACHE_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **754**：`GET /meta` **`defaults`** 对象顶层键顺序（机读锁 **`defaults_top_keys`** / **`defaults_top_keys_contract_754`**；与同名列 JSON 数组同源）。
pub const DEFAULTS_META_TOP_KEYS: &[&str] = &[
    "request_timeout_secs",
    "request_body_limit_bytes",
    "idempotency_cache_max",
    "rule",
    "defaults_top_keys",
    "defaults_top_keys_contract_754",
];

pub fn format_defaults_meta_top_keys_contract_754() -> String {
    let mut s = String::from(
        "**754**：**`defaults_top_keys`** **与 **`DEFAULTS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in DEFAULTS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **755**：`GET /meta` **`outbox`** 对象顶层键顺序（机读锁 **`outbox_top_keys`** / **`outbox_top_keys_contract_755`**；与同名列 JSON 数组同源）。
pub const OUTBOX_META_TOP_KEYS: &[&str] = &[
    "dir",
    "worker_enabled",
    "lease_secs",
    "poll_ms",
    "max_attempts",
    "rule",
    "outbox_top_keys",
    "outbox_top_keys_contract_755",
];

pub fn format_outbox_meta_top_keys_contract_755() -> String {
    let mut s = String::from(
        "**755**：**`outbox_top_keys`** **与 **`OUTBOX_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in OUTBOX_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}

/// **756**：`GET /meta` **`rate_limits`** 对象顶层键顺序（机读锁 **`rate_limits_top_keys`** / **`rate_limits_top_keys_contract_756`**；与同名列 JSON 数组同源；前十三键与 **`middleware::meta_rate_limits_snapshot`** 一致）。
pub const RATE_LIMITS_META_TOP_KEYS: &[&str] = &[
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
];

pub fn format_rate_limits_meta_top_keys_contract_756() -> String {
    let mut s = String::from(
        "**756**：**`rate_limits_top_keys`** **与 **`RATE_LIMITS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in RATE_LIMITS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push('`');
        s.push_str(k);
        s.push('`');
    }
    s.push_str("）");
    s
}
