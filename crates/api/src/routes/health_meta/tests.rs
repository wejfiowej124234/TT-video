use super::*;
use crate::chain;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::state::test_support::api_meta_state;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use tokio::io::AsyncWriteExt;
use tokio::sync::RwLock;
use tower::util::ServiceExt;

#[test]
fn meta_build_snapshot_prefers_runtime_and_trims() {
    let v = meta_build_snapshot(
        Some("  abcd  ".into()),
        Some("compile"),
        Some("  2026-03-29T00:00:00Z  ".into()),
    );
    assert_eq!(v["git_sha"], "abcd");
    assert_eq!(v["deployed_at"], "2026-03-29T00:00:00Z");
}

#[test]
fn meta_build_snapshot_falls_back_to_compile_sha() {
    let v = meta_build_snapshot(None, Some("deadbeef"), None);
    assert_eq!(v["git_sha"], "deadbeef");
    assert!(v["deployed_at"].is_null());
}

#[test]
fn meta_build_snapshot_unknown_when_empty() {
    let v = meta_build_snapshot(Some("   ".into()), None, None);
    assert_eq!(v["git_sha"], "unknown");
}

#[test]
fn finality_discipline_meta_top_keys_order_and_literals_726() {
    assert_eq!(
        FINALITY_DISCIPLINE_META_TOP_KEYS[5],
        "finality_discipline_top_keys"
    );
    assert_eq!(
        FINALITY_DISCIPLINE_META_TOP_KEYS[6],
        "finality_discipline_top_keys_contract_726"
    );
    let c = format_finality_discipline_meta_top_keys_contract_726();
    assert!(c.contains("726"), "contract: {c}");
    for k in FINALITY_DISCIPLINE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn indexer_meta_top_keys_order_and_literals_727() {
    assert_eq!(INDEXER_META_TOP_KEYS[11], "indexer_top_keys");
    assert_eq!(INDEXER_META_TOP_KEYS[12], "indexer_top_keys_contract_727");
    let c = format_indexer_meta_top_keys_contract_727();
    assert!(c.contains("727"), "contract: {c}");
    for k in INDEXER_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn meta_root_top_keys_order_and_literals_728() {
    assert_eq!(META_ROOT_TOP_KEYS[35], "meta_top_keys");
    assert_eq!(META_ROOT_TOP_KEYS[36], "meta_top_keys_contract_728");
    let c = format_meta_root_top_keys_contract_728();
    assert!(c.contains("728"), "contract: {c}");
    for k in META_ROOT_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn database_meta_top_keys_order_and_literals_760() {
    assert_eq!(DATABASE_META_TOP_KEYS[0], "connected");
    assert_eq!(DATABASE_META_TOP_KEYS[1], "rule");
    assert_eq!(DATABASE_META_TOP_KEYS[2], "database_top_keys");
    assert_eq!(DATABASE_META_TOP_KEYS[3], "database_top_keys_contract_760");
    let c = format_database_meta_top_keys_contract_760();
    assert!(c.contains("760"), "contract: {c}");
    for k in DATABASE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn chain_meta_top_keys_order_and_literals_729() {
    assert_eq!(CHAIN_META_TOP_KEYS[3], "chain_top_keys");
    assert_eq!(CHAIN_META_TOP_KEYS[4], "chain_top_keys_contract_729");
    let c = format_chain_meta_top_keys_contract_729();
    assert!(c.contains("729"), "contract: {c}");
    for k in CHAIN_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn chain_contracts_meta_top_keys_order_and_literals_759() {
    assert_eq!(CHAIN_CONTRACTS_META_TOP_KEYS[9], "rule");
    assert_eq!(CHAIN_CONTRACTS_META_TOP_KEYS[10], "chain_contracts_top_keys");
    assert_eq!(
        CHAIN_CONTRACTS_META_TOP_KEYS[11],
        "chain_contracts_top_keys_contract_759"
    );
    let c = format_chain_contracts_meta_top_keys_contract_759();
    assert!(c.contains("759"), "contract: {c}");
    for k in CHAIN_CONTRACTS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn meta_build_top_keys_order_and_literals_730() {
    assert_eq!(META_BUILD_TOP_KEYS[3], "build_top_keys");
    assert_eq!(META_BUILD_TOP_KEYS[4], "build_top_keys_contract_730");
    let c = format_meta_build_top_keys_contract_730();
    assert!(c.contains("730"), "contract: {c}");
    for k in META_BUILD_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn strict_mode_meta_top_keys_order_and_literals_731() {
    assert_eq!(STRICT_MODE_META_TOP_KEYS[5], "strict_mode_top_keys");
    assert_eq!(
        STRICT_MODE_META_TOP_KEYS[6],
        "strict_mode_top_keys_contract_731"
    );
    let c = format_strict_mode_meta_top_keys_contract_731();
    assert!(c.contains("731"), "contract: {c}");
    for k in STRICT_MODE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn dual_write_meta_top_keys_order_and_literals_732() {
    assert_eq!(DUAL_WRITE_META_TOP_KEYS[3], "dual_write_top_keys");
    assert_eq!(
        DUAL_WRITE_META_TOP_KEYS[4],
        "dual_write_top_keys_contract_732"
    );
    let c = format_dual_write_meta_top_keys_contract_732();
    assert!(c.contains("732"), "contract: {c}");
    for k in DUAL_WRITE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn ssot_meta_top_keys_order_and_literals_733() {
    assert_eq!(SSOT_META_TOP_KEYS[5], "ssot_top_keys");
    assert_eq!(SSOT_META_TOP_KEYS[6], "ssot_top_keys_contract_733");
    let c = format_ssot_meta_top_keys_contract_733();
    assert!(c.contains("733"), "contract: {c}");
    for k in SSOT_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn admin_exports_meta_top_keys_order_and_literals_734() {
    assert_eq!(ADMIN_EXPORTS_META_TOP_KEYS[3], "admin_exports_top_keys");
    assert_eq!(
        ADMIN_EXPORTS_META_TOP_KEYS[4],
        "admin_exports_top_keys_contract_734"
    );
    let c = format_admin_exports_meta_top_keys_contract_734();
    assert!(c.contains("734"), "contract: {c}");
    for k in ADMIN_EXPORTS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn chargeback_policy_meta_top_keys_order_and_literals_735() {
    assert_eq!(
        CHARGEBACK_POLICY_META_TOP_KEYS[2],
        "chargeback_policy_top_keys"
    );
    assert_eq!(
        CHARGEBACK_POLICY_META_TOP_KEYS[3],
        "chargeback_policy_top_keys_contract_735"
    );
    let c = format_chargeback_policy_meta_top_keys_contract_735();
    assert!(c.contains("735"), "contract: {c}");
    for k in CHARGEBACK_POLICY_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn authority_meta_top_keys_order_and_literals_736() {
    assert_eq!(AUTHORITY_META_TOP_KEYS[3], "authority_top_keys");
    assert_eq!(
        AUTHORITY_META_TOP_KEYS[4],
        "authority_top_keys_contract_736"
    );
    let c = format_authority_meta_top_keys_contract_736();
    assert!(c.contains("736"), "contract: {c}");
    for k in AUTHORITY_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn pause_meta_top_keys_order_and_literals_737() {
    assert_eq!(PAUSE_META_TOP_KEYS[6], "pause_top_keys");
    assert_eq!(PAUSE_META_TOP_KEYS[7], "pause_top_keys_contract_737");
    let c = format_pause_meta_top_keys_contract_737();
    assert!(c.contains("737"), "contract: {c}");
    for k in PAUSE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

/// **TT-B091-EVM-SELECTORS-001**：与 **`EscrowFactory.factoryPaused` / `FeeRouter.distributePaused`**（**`bool public`** getter）ABI 首 4 字节一致。
#[test]
fn b091_selectors_factory_and_distribute_paused() {
    assert_eq!(hex::encode(b091_evm_selector("factoryPaused()")), "98159752");
    assert_eq!(hex::encode(b091_evm_selector("distributePaused()")), "627f66d3");
}

#[test]
fn evidence_meta_top_keys_order_and_literals_738() {
    assert_eq!(EVIDENCE_META_TOP_KEYS[7], "evidence_top_keys");
    assert_eq!(EVIDENCE_META_TOP_KEYS[8], "evidence_top_keys_contract_738");
    let c = format_evidence_meta_top_keys_contract_738();
    assert!(c.contains("738"), "contract: {c}");
    for k in EVIDENCE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn order_messages_meta_top_keys_order_and_literals_739() {
    assert_eq!(ORDER_MESSAGES_META_TOP_KEYS[5], "order_messages_top_keys");
    assert_eq!(
        ORDER_MESSAGES_META_TOP_KEYS[6],
        "order_messages_top_keys_contract_739"
    );
    let c = format_order_messages_meta_top_keys_contract_739();
    assert!(c.contains("739"), "contract: {c}");
    for k in ORDER_MESSAGES_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn reviews_meta_top_keys_order_and_literals_740() {
    assert_eq!(REVIEWS_META_TOP_KEYS[3], "reviews_top_keys");
    assert_eq!(REVIEWS_META_TOP_KEYS[4], "reviews_top_keys_contract_740");
    let c = format_reviews_meta_top_keys_contract_740();
    assert!(c.contains("740"), "contract: {c}");
    for k in REVIEWS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn dispute_open_meta_top_keys_order_and_literals_741() {
    assert_eq!(DISPUTE_OPEN_META_TOP_KEYS[3], "dispute_open_top_keys");
    assert_eq!(
        DISPUTE_OPEN_META_TOP_KEYS[4],
        "dispute_open_top_keys_contract_741"
    );
    let c = format_dispute_open_meta_top_keys_contract_741();
    assert!(c.contains("741"), "contract: {c}");
    for k in DISPUTE_OPEN_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn dispute_resolve_meta_top_keys_order_and_literals_742() {
    assert_eq!(DISPUTE_RESOLVE_META_TOP_KEYS[3], "dispute_resolve_top_keys");
    assert_eq!(
        DISPUTE_RESOLVE_META_TOP_KEYS[4],
        "dispute_resolve_top_keys_contract_742"
    );
    let c = format_dispute_resolve_meta_top_keys_contract_742();
    assert!(c.contains("742"), "contract: {c}");
    for k in DISPUTE_RESOLVE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn itineraries_meta_top_keys_order_and_literals_743() {
    assert_eq!(ITINERARIES_META_TOP_KEYS[3], "itineraries_top_keys");
    assert_eq!(
        ITINERARIES_META_TOP_KEYS[4],
        "itineraries_top_keys_contract_743"
    );
    let c = format_itineraries_meta_top_keys_contract_743();
    assert!(c.contains("743"), "contract: {c}");
    for k in ITINERARIES_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn orders_meta_top_keys_order_and_literals_744() {
    assert_eq!(ORDERS_META_TOP_KEYS[3], "list_pagination");
    assert_eq!(ORDERS_META_TOP_KEYS[4], "fee_route_country_ssot");
    assert_eq!(ORDERS_META_TOP_KEYS[5], "deadline_rating_observability");
    assert_eq!(ORDERS_META_TOP_KEYS[6], "orders_top_keys");
    assert_eq!(ORDERS_META_TOP_KEYS[7], "orders_top_keys_contract_744");
    let c = format_orders_meta_top_keys_contract_744();
    assert!(c.contains("744"), "contract: {c}");
    for k in ORDERS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn discover_meta_top_keys_order_and_literals_745() {
    assert_eq!(DISCOVER_META_TOP_KEYS[3], "orders_pagination");
    assert_eq!(DISCOVER_META_TOP_KEYS[4], "discover_top_keys");
    assert_eq!(DISCOVER_META_TOP_KEYS[5], "discover_top_keys_contract_745");
    let c = format_discover_meta_top_keys_contract_745();
    assert!(c.contains("745"), "contract: {c}");
    for k in DISCOVER_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn product_countries_meta_top_keys_order_and_literals_746() {
    assert_eq!(PRODUCT_COUNTRIES_META_TOP_KEYS[3], "iso3166_alpha2");
    assert_eq!(PRODUCT_COUNTRIES_META_TOP_KEYS[4], "name_zh");
    assert_eq!(
        PRODUCT_COUNTRIES_META_TOP_KEYS[5],
        "product_countries_top_keys"
    );
    assert_eq!(
        PRODUCT_COUNTRIES_META_TOP_KEYS[6],
        "product_countries_top_keys_contract_746"
    );
    let c = format_product_countries_meta_top_keys_contract_746();
    assert!(c.contains("746"), "contract: {c}");
    for k in PRODUCT_COUNTRIES_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn did_rank_meta_top_keys_order_and_literals_747() {
    assert_eq!(DID_RANK_META_TOP_KEYS[3], "chain_off_mounted");
    assert_eq!(DID_RANK_META_TOP_KEYS[4], "chain_off_db_pool");
    assert_eq!(
        DID_RANK_META_TOP_KEYS[5],
        "guides_community_penalty_exclusion"
    );
    assert_eq!(DID_RANK_META_TOP_KEYS[6], "did_rank_top_keys");
    assert_eq!(DID_RANK_META_TOP_KEYS[7], "did_rank_top_keys_contract_747");
    let c = format_did_rank_meta_top_keys_contract_747();
    assert!(c.contains("747"), "contract: {c}");
    for k in DID_RANK_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

/// 110 §3.3 / GET /meta.indexer.memory.last_block_hash_prefix — 前缀规则机读锁（运维 jq / 门禁抽样）。
#[test]
fn block_hash_prefix_json_empty_is_null() {
    assert!(super::block_hash_prefix_json("").is_null());
    assert!(super::block_hash_prefix_json("  \t  ").is_null());
}

#[test]
fn block_hash_prefix_json_bare_0x_is_null() {
    assert!(super::block_hash_prefix_json("0x").is_null());
    assert!(super::block_hash_prefix_json(" 0x ").is_null());
}

#[test]
fn block_hash_prefix_json_short_hex_keeps_prefix() {
    assert_eq!(
        super::block_hash_prefix_json("0xabc"),
        serde_json::json!("0xabc")
    );
    assert_eq!(
        super::block_hash_prefix_json("deadbeef"),
        serde_json::json!("0xdeadbeef")
    );
}

#[test]
fn block_hash_prefix_json_truncates_to_ten_hex_chars() {
    assert_eq!(
        super::block_hash_prefix_json("0xabcdef0123456789"),
        serde_json::json!("0xabcdef0123")
    );
    assert_eq!(
        super::block_hash_prefix_json("ABCDEF0123456789"),
        serde_json::json!("0xABCDEF0123")
    );
}

#[test]
fn did_rank_guides_community_penalty_exclusion_no_chain_off() {
    assert_eq!(
        super::did_rank_guides_community_penalty_exclusion(false, false),
        "no_chain_off"
    );
}

#[test]
fn did_rank_guides_community_penalty_exclusion_chain_off_memory_only() {
    assert_eq!(
        super::did_rank_guides_community_penalty_exclusion(true, false),
        "chain_off_memory_only"
    );
}

#[test]
fn did_rank_guides_community_penalty_exclusion_db_backed() {
    assert_eq!(
        super::did_rank_guides_community_penalty_exclusion(true, true),
        "db_backed"
    );
}

#[test]
fn product_roles_meta_obs_json_contract() {
    let v = super::product_roles_meta_obs_json();
    assert_eq!(v["strict_db_write"], false);
    assert!(v["dual_write_order"]
        .as_str()
        .unwrap_or("")
        .contains("GET /meta"));
    assert_eq!(
        v["users_role_stored"],
        serde_json::json!([
            "admin",
            "arbitrator",
            "guide",
            "provider",
            "region_steward",
            "super_admin",
            "tourist",
            "traveler"
        ])
    );
    assert_eq!(
        v["me_public_role_mapping"],
        serde_json::json!({ "tourist": "traveler" })
    );
    assert_eq!(
        v["protocol_roles_target_87"],
        serde_json::json!(["traveler", "guide", "provider", "region_steward"])
    );
    assert_eq!(v["provider_in_users_role"], true);
    assert_eq!(v["region_steward_in_users_role"], true);
    let r = v["rule"].as_str().unwrap_or("");
    assert!(r.contains("87"));
    assert!(r.contains("07"));
    assert!(r.contains("748"));
}

#[test]
fn product_roles_meta_top_keys_order_and_literals_748() {
    assert_eq!(
        super::PRODUCT_ROLES_META_TOP_KEYS,
        &[
            "strict_db_write",
            "dual_write_order",
            "rule",
            "users_role_stored",
            "me_public_role_mapping",
            "protocol_roles_target_87",
            "provider_in_users_role",
            "region_steward_in_users_role",
            "product_roles_top_keys",
            "product_roles_top_keys_contract_748"
        ]
    );
    let c = super::format_product_roles_meta_top_keys_contract_748();
    assert!(c.contains("748"), "contract: {c}");
    for k in super::PRODUCT_ROLES_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn auth_registration_meta_obs_json_contract() {
    let v = super::auth_registration_meta_obs_json();
    assert_eq!(v["strict_db_write"], false);
    let dw = v["dual_write_order"].as_str().unwrap_or("");
    assert!(
        dw.contains("read-only") && dw.contains("chain_off/auth.rs"),
        "dual_write_order: {dw}"
    );
    assert_eq!(
        v["self_serve_roles_allowed"],
        serde_json::json!(["provider", "region_steward", "tourist", "traveler"])
    );
    assert_eq!(v["default_role"], "tourist");
    assert_eq!(v["request_role_aliases"], serde_json::json!({}));
    assert_eq!(v["invalid_role_error_key"], "invalid_registration_role");
    assert_eq!(v["arbitrator_seed_env"], "P3_SEED_ARBITRATOR_EMAIL");
    assert_eq!(v["guide_via_separate_flow_only"], true);
    let r = v["rule"].as_str().unwrap_or("");
    assert!(r.contains("694"));
    assert!(r.contains("697"));
    assert!(r.contains("749"));
    assert!(r.contains("chain_off/auth.rs"));
}

#[test]
fn auth_registration_meta_top_keys_order_and_literals_749() {
    assert_eq!(
        super::AUTH_REGISTRATION_META_TOP_KEYS,
        &[
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
            "auth_registration_top_keys_contract_749"
        ]
    );
    let c = super::format_auth_registration_meta_top_keys_contract_749();
    assert!(c.contains("749"), "contract: {c}");
    for k in super::AUTH_REGISTRATION_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn auth_meta_top_keys_order_and_literals_750() {
    assert_eq!(
        super::AUTH_META_TOP_KEYS,
        &[
            "strict_db_write",
            "registration",
            "rule",
            "auth_top_keys",
            "auth_top_keys_contract_750",
        ]
    );
    let c = super::format_auth_meta_top_keys_contract_750();
    assert!(c.contains("750"), "contract: {c}");
    for k in super::AUTH_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn seed_test_accounts_meta_top_keys_order_and_literals_751() {
    assert_eq!(
        super::SEED_TEST_ACCOUNTS_META_TOP_KEYS,
        &[
            "strict_db_write",
            "rule",
            "seed_test_accounts_top_keys",
            "seed_test_accounts_top_keys_contract_751",
        ]
    );
    let c = super::format_seed_test_accounts_meta_top_keys_contract_751();
    assert!(c.contains("751"), "contract: {c}");
    for k in super::SEED_TEST_ACCOUNTS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn guides_meta_top_keys_order_and_literals_752() {
    assert_eq!(
        super::GUIDES_META_TOP_KEYS,
        &[
            "strict_db_write",
            "rule",
            "guides_top_keys",
            "guides_top_keys_contract_752",
        ]
    );
    let c = super::format_guides_meta_top_keys_contract_752();
    assert!(c.contains("752"), "contract: {c}");
    for k in super::GUIDES_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn governance_meta_top_keys_order_and_literals_807() {
    assert_eq!(
        super::GOVERNANCE_META_TOP_KEYS,
        &[
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
        ]
    );
    let c = super::format_governance_meta_top_keys_contract_807();
    assert!(c.contains("807"), "contract: {c}");
    for k in super::GOVERNANCE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn idempotency_cache_meta_top_keys_order_and_literals_753() {
    assert_eq!(
        super::IDEMPOTENCY_CACHE_META_TOP_KEYS,
        &[
            "memory_max_entries",
            "db_projection",
            "rule",
            "idempotency_cache_top_keys",
            "idempotency_cache_top_keys_contract_753",
        ]
    );
    let c = super::format_idempotency_cache_meta_top_keys_contract_753();
    assert!(c.contains("753"), "contract: {c}");
    for k in super::IDEMPOTENCY_CACHE_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn defaults_meta_top_keys_order_and_literals_754() {
    assert_eq!(
        super::DEFAULTS_META_TOP_KEYS,
        &[
            "request_timeout_secs",
            "request_body_limit_bytes",
            "idempotency_cache_max",
            "rule",
            "defaults_top_keys",
            "defaults_top_keys_contract_754",
        ]
    );
    let c = super::format_defaults_meta_top_keys_contract_754();
    assert!(c.contains("754"), "contract: {c}");
    for k in super::DEFAULTS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn outbox_meta_top_keys_order_and_literals_755() {
    assert_eq!(
        super::OUTBOX_META_TOP_KEYS,
        &[
            "dir",
            "worker_enabled",
            "lease_secs",
            "poll_ms",
            "max_attempts",
            "rule",
            "outbox_top_keys",
            "outbox_top_keys_contract_755",
        ]
    );
    let c = super::format_outbox_meta_top_keys_contract_755();
    assert!(c.contains("755"), "contract: {c}");
    for k in super::OUTBOX_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn rate_limits_meta_top_keys_order_and_literals_756() {
    assert_eq!(super::RATE_LIMITS_META_TOP_KEYS[11], "guide_upload");
    assert_eq!(super::RATE_LIMITS_META_TOP_KEYS[12], "rule");
    assert_eq!(super::RATE_LIMITS_META_TOP_KEYS[13], "rate_limits_top_keys");
    assert_eq!(
        super::RATE_LIMITS_META_TOP_KEYS[14],
        "rate_limits_top_keys_contract_756"
    );
    let c = super::format_rate_limits_meta_top_keys_contract_756();
    assert!(c.contains("756"), "contract: {c}");
    for k in super::RATE_LIMITS_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn guide_upload_meta_top_keys_order_and_literals_761() {
    assert_eq!(crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS[2], "rule");
    assert_eq!(
        crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS[3],
        "guide_upload_top_keys"
    );
    assert_eq!(
        crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS[4],
        "guide_upload_top_keys_contract_761"
    );
    let c = crate::middleware::format_guide_upload_meta_top_keys_contract_761();
    assert!(c.contains("761"), "contract: {c}");
    for k in crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn indexer_memory_meta_top_keys_order_and_literals_757() {
    assert_eq!(super::INDEXER_MEMORY_META_TOP_KEYS[5], "rule");
    assert_eq!(
        super::INDEXER_MEMORY_META_TOP_KEYS[6],
        "indexer_memory_top_keys"
    );
    assert_eq!(
        super::INDEXER_MEMORY_META_TOP_KEYS[7],
        "indexer_memory_top_keys_contract_757"
    );
    let c = super::format_indexer_memory_meta_top_keys_contract_757();
    assert!(c.contains("757"), "contract: {c}");
    for k in super::INDEXER_MEMORY_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[test]
fn indexer_checkpoint_meta_top_keys_order_and_literals_758() {
    assert_eq!(super::INDEXER_CHECKPOINT_META_TOP_KEYS[0], "block_number");
    assert_eq!(super::INDEXER_CHECKPOINT_META_TOP_KEYS[1], "log_index");
    assert_eq!(super::INDEXER_CHECKPOINT_META_TOP_KEYS[2], "source");
    assert_eq!(super::INDEXER_CHECKPOINT_META_TOP_KEYS[3], "rule");
    assert_eq!(
        super::INDEXER_CHECKPOINT_META_TOP_KEYS[4],
        "indexer_checkpoint_top_keys"
    );
    assert_eq!(
        super::INDEXER_CHECKPOINT_META_TOP_KEYS[5],
        "indexer_checkpoint_top_keys_contract_758"
    );
    let c = super::format_indexer_checkpoint_meta_top_keys_contract_758();
    assert!(c.contains("758"), "contract: {c}");
    for k in super::INDEXER_CHECKPOINT_META_TOP_KEYS {
        assert!(c.contains(k), "contract should embed {k}: {c}");
    }
}

#[tokio::test]
async fn meta_product_countries_default_core_arrays_and_read_source_hint() {
    let _lock = crate::catalog_geo_validation::lock_catalog_geo_env_tests();
    let prev = std::env::var("CATALOG_SERVER_GEO_VALIDATION").ok();
    std::env::set_var("CATALOG_SERVER_GEO_VALIDATION", "0");
    let app = router().with_state(api_meta_state(None));
    let res = app
        .oneshot(Request::builder().uri("/meta").body(Body::empty()).unwrap())
        .await
        .unwrap();
    if let Some(v) = prev {
        std::env::set_var("CATALOG_SERVER_GEO_VALIDATION", v);
    } else {
        std::env::remove_var("CATALOG_SERVER_GEO_VALIDATION");
    }
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let pc = &v["product_countries"];
    let iso = pc["iso3166_alpha2"].as_array().expect("iso3166_alpha2 array");
    let names = pc["name_zh"].as_array().expect("name_zh array");
    assert_eq!(iso.len(), traveltrust_core::PRODUCT_COUNTRY_CODES.len());
    for (i, code) in traveltrust_core::PRODUCT_COUNTRY_CODES.iter().enumerate() {
        assert_eq!(iso[i].as_str(), Some(*code));
        assert_eq!(names[i].as_str(), Some(traveltrust_core::PRODUCT_COUNTRY_NAMES_ZH[i]));
    }
    let dwo = pc["dual_write_order"].as_str().unwrap_or("");
    assert!(
        dwo.starts_with("read_source=core;"),
        "default flag off should use core read_source hint: {dwo}"
    );
}

#[tokio::test]
async fn meta_order_messages_chain_off_mounted_false_when_absent() {
    let app = router().with_state(api_meta_state(None));
    let res = app
        .oneshot(Request::builder().uri("/meta").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(
        v["order_messages"]["chain_off_mounted"],
        serde_json::json!(false)
    );
    assert_eq!(
        v["did_rank"]["strict_db_write"],
        serde_json::Value::Bool(false)
    );
    assert_eq!(v["did_rank"]["chain_off_mounted"], false);
    assert_eq!(v["did_rank"]["chain_off_db_pool"], false);
    assert_eq!(
        v["did_rank"]["guides_community_penalty_exclusion"],
        "no_chain_off"
    );
    assert_eq!(v["product_roles"]["strict_db_write"], false);
    assert_eq!(v["product_roles"]["provider_in_users_role"], true);
    assert_eq!(v["product_roles"]["region_steward_in_users_role"], true);
    assert_eq!(
        v["product_roles"]["me_public_role_mapping"]["tourist"],
        "traveler"
    );
    assert!(v["product_roles"]["rule"]
        .as_str()
        .unwrap_or("")
        .contains("87"));
    assert!(v["product_roles"]["rule"]
        .as_str()
        .unwrap_or("")
        .contains("748"));
    assert_eq!(v["auth"]["registration"]["strict_db_write"], false);
    assert_eq!(
        v["auth"]["registration"]["self_serve_roles_allowed"],
        serde_json::json!(["provider", "region_steward", "tourist", "traveler"])
    );
    assert_eq!(v["auth"]["registration"]["default_role"], "tourist");
    assert_eq!(
        v["auth"]["registration"]["invalid_role_error_key"],
        "invalid_registration_role"
    );
    assert_eq!(
        v["auth"]["registration"]["request_role_aliases"],
        serde_json::json!({})
    );
    assert!(v["auth"]["registration"]["rule"]
        .as_str()
        .unwrap_or("")
        .contains("697"));
    assert!(v["auth"]["registration"]["rule"]
        .as_str()
        .unwrap_or("")
        .contains("749"));
    assert_eq!(v["indexer"]["memory"]["available"], false);
    assert_eq!(v["indexer"]["checkpoint"]["block_number"], 40);
    assert_eq!(v["indexer"]["checkpoint"]["log_index"], 2);
    assert_eq!(v["indexer"]["checkpoint"]["source"], "startup_snapshot");
    assert_eq!(
        v["indexer"]["finality_discipline"]["chain_tip_not_in_meta"],
        true
    );
    let oc = &v["indexer"]["finality_discipline"]["order_chain_sync_status"];
    assert_eq!(
        oc["method_path"].as_str().unwrap(),
        crate::routes::orders::CHAIN_SYNC_STATUS_METHOD_AND_PATH
    );
    let mp717s = oc["method_path_contract_717"].as_str().unwrap_or("");
    assert!(
        mp717s.contains("717"),
        "method_path_contract_717 should mention 717: {mp717s}"
    );
    assert!(
        mp717s.contains(crate::routes::orders::CHAIN_SYNC_STATUS_METHOD_AND_PATH),
        "method_path_contract_717 should embed CHAIN_SYNC_STATUS_METHOD_AND_PATH: {mp717s}"
    );
    assert!(
        mp717s.contains(crate::routes::orders::CHAIN_SYNC_ROUTE_PATH),
        "method_path_contract_717 should embed CHAIN_SYNC_ROUTE_PATH: {mp717s}"
    );
    assert_eq!(
        oc["code"].as_str().unwrap(),
        crate::routes::orders::CHAIN_SYNC_STATUS_HANDLER_CODE
    );
    let c718s = oc["code_contract_718"].as_str().unwrap_or("");
    assert!(
        c718s.contains("718"),
        "code_contract_718 should mention 718: {c718s}"
    );
    assert!(
        c718s.contains(crate::routes::orders::CHAIN_SYNC_STATUS_HANDLER_CODE),
        "code_contract_718 should embed CHAIN_SYNC_STATUS_HANDLER_CODE: {c718s}"
    );
    let sv = oc["status_values"].as_array().expect("status_values array");
    assert_eq!(
        sv.len(),
        crate::routes::orders::CHAIN_SYNC_STATUS_VALUES.len()
    );
    for (i, exp) in crate::routes::orders::CHAIN_SYNC_STATUS_VALUES
        .iter()
        .enumerate()
    {
        assert_eq!(
            sv[i].as_str().unwrap(),
            *exp,
            "status_values[{i}] should match CHAIN_SYNC_STATUS_VALUES"
        );
    }
    let s719s = oc["status_values_contract_719"].as_str().unwrap_or("");
    assert!(
        s719s.contains("719"),
        "status_values_contract_719 should mention 719: {s719s}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_STATUS_VALUES {
        assert!(
            s719s.contains(v),
            "status_values_contract_719 should embed {v:?}: {s719s}"
        );
    }
    let ar = oc["absent_reason_values"]
        .as_array()
        .expect("absent_reason_values array");
    assert_eq!(
        ar.len(),
        crate::routes::orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS.len()
    );
    for (i, exp) in crate::routes::orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS
        .iter()
        .enumerate()
    {
        assert_eq!(
            ar[i].as_str().unwrap(),
            *exp,
            "absent_reason_values[{i}] should match CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS"
        );
    }
    let s720s = oc["absent_reason_values_contract_720"]
        .as_str()
        .unwrap_or("");
    assert!(
        s720s.contains("720"),
        "absent_reason_values_contract_720 should mention 720: {s720s}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS {
        assert!(
            s720s.contains(v),
            "absent_reason_values_contract_720 should embed {v:?}: {s720s}"
        );
    }
    let letk = oc["last_event_top_keys"]
        .as_array()
        .expect("last_event_top_keys array");
    assert_eq!(
        letk.len(),
        crate::routes::orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS.len()
    );
    for (i, exp) in crate::routes::orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS
        .iter()
        .enumerate()
    {
        assert_eq!(
            letk[i].as_str().unwrap(),
            *exp,
            "last_event_top_keys[{i}] should match CHAIN_SYNC_LAST_EVENT_TOP_KEYS"
        );
    }
    let s721s = oc["last_event_keys_contract_721"].as_str().unwrap_or("");
    assert!(
        s721s.contains("721"),
        "last_event_keys_contract_721 should mention 721: {s721s}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS {
        assert!(
            s721s.contains(v),
            "last_event_keys_contract_721 should embed {v:?}: {s721s}"
        );
    }
    let eltk = oc["event_log_snapshot_top_keys"]
        .as_array()
        .expect("event_log_snapshot_top_keys array");
    assert_eq!(
        eltk.len(),
        crate::db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS.len()
    );
    for (i, exp) in crate::db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS
        .iter()
        .enumerate()
    {
        assert_eq!(
            eltk[i].as_str().unwrap(),
            *exp,
            "event_log_snapshot_top_keys[{i}] should match EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS"
        );
    }
    let s722s = oc["event_log_snapshot_keys_contract_722"]
        .as_str()
        .unwrap_or("");
    assert!(
        s722s.contains("722"),
        "event_log_snapshot_keys_contract_722 should mention 722: {s722s}"
    );
    for v in crate::db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS {
        assert!(
            s722s.contains(v),
            "event_log_snapshot_keys_contract_722 should embed {v:?}: {s722s}"
        );
    }
    let cptk = oc["checkpoint_top_keys"]
        .as_array()
        .expect("checkpoint_top_keys array");
    assert_eq!(
        cptk.len(),
        crate::routes::orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS.len()
    );
    for (i, exp) in crate::routes::orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS
        .iter()
        .enumerate()
    {
        assert_eq!(
            cptk[i].as_str().unwrap(),
            *exp,
            "checkpoint_top_keys[{i}] should match CHAIN_SYNC_CHECKPOINT_TOP_KEYS"
        );
    }
    let s723s = oc["checkpoint_keys_contract_723"].as_str().unwrap_or("");
    assert!(
        s723s.contains("723"),
        "checkpoint_keys_contract_723 should mention 723: {s723s}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS {
        assert!(
            s723s.contains(v),
            "checkpoint_keys_contract_723 should embed {v:?}: {s723s}"
        );
    }
    let cpsv = oc["checkpoint_source_values"]
        .as_array()
        .expect("checkpoint_source_values array");
    assert_eq!(
        cpsv.len(),
        crate::routes::orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES.len()
    );
    for (i, exp) in crate::routes::orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES
        .iter()
        .enumerate()
    {
        assert_eq!(
            cpsv[i].as_str().unwrap(),
            *exp,
            "checkpoint_source_values[{i}] should match CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES"
        );
    }
    let s724s = oc["checkpoint_source_values_contract_724"]
        .as_str()
        .unwrap_or("");
    assert!(
        s724s.contains("724"),
        "checkpoint_source_values_contract_724 should mention 724: {s724s}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES {
        assert!(
            s724s.contains(v),
            "checkpoint_source_values_contract_724 should embed {v:?}: {s724s}"
        );
    }
    assert!(oc["optional_event_log_snapshot"]
        .as_str()
        .unwrap_or("")
        .contains("event_log_snapshot"));
    assert!(oc["optional_event_log_snapshot_absent_reason"]
        .as_str()
        .unwrap_or("")
        .contains("703"));
    let oes702 = oc["optional_event_log_snapshot"].as_str().unwrap_or("");
    assert!(
        oes702.contains("702"),
        "optional_event_log_snapshot should mention 702: {oes702}"
    );
    assert!(
        oes702.contains("722"),
        "optional_event_log_snapshot should mention 722: {oes702}"
    );
    for v in crate::db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS {
        assert!(
            oes702.contains(v),
            "optional_event_log_snapshot should embed {v:?}: {oes702}"
        );
    }
    let ole706 = oc["optional_last_event"].as_str().unwrap_or("");
    assert!(
        ole706.contains("706"),
        "optional_last_event should mention 706: {ole706}"
    );
    assert!(
        ole706.contains("721"),
        "optional_last_event should mention 721: {ole706}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS {
        assert!(
            ole706.contains(v),
            "optional_last_event should embed {v:?}: {ole706}"
        );
    }
    assert!(oc["success_body_order_id"]
        .as_str()
        .unwrap_or("")
        .contains("707"));
    assert!(oc["minimal_body_requester"]
        .as_str()
        .unwrap_or("")
        .contains("708"));
    assert!(oc["minimal_body_chain_sync_status_unknown"]
        .as_str()
        .unwrap_or("")
        .contains("709"));
    let csc710 = oc["chain_sync_checkpoint"].as_str().unwrap_or("");
    assert!(
        csc710.contains("710"),
        "chain_sync_checkpoint should mention 710: {csc710}"
    );
    assert!(
        csc710.contains("723"),
        "chain_sync_checkpoint should mention 723: {csc710}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS {
        assert!(
            csc710.contains(v),
            "chain_sync_checkpoint should embed {v:?}: {csc710}"
        );
    }
    assert!(oc["chain_sync_finality_n"]
        .as_str()
        .unwrap_or("")
        .contains("711"));
    let ccs712 = oc["chain_sync_checkpoint_source"].as_str().unwrap_or("");
    assert!(
        ccs712.contains("712"),
        "chain_sync_checkpoint_source should mention 712: {ccs712}"
    );
    assert!(
        ccs712.contains("724"),
        "chain_sync_checkpoint_source should mention 724: {ccs712}"
    );
    for v in crate::routes::orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES {
        assert!(
            ccs712.contains(v),
            "chain_sync_checkpoint_source should embed {v:?}: {ccs712}"
        );
    }
    let ocs725tk = oc["order_chain_sync_status_top_keys"]
        .as_array()
        .expect("order_chain_sync_status_top_keys array");
    assert_eq!(
        ocs725tk.len(),
        crate::routes::orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS.len()
    );
    for (i, exp) in crate::routes::orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS
        .iter()
        .enumerate()
    {
        assert_eq!(
            ocs725tk[i].as_str().unwrap(),
            *exp,
            "order_chain_sync_status_top_keys[{i}] should match ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS"
        );
    }
    let s725 = oc["order_chain_sync_status_top_keys_contract_725"]
        .as_str()
        .unwrap_or("");
    assert!(
        s725.contains("725"),
        "order_chain_sync_status_top_keys_contract_725 should mention 725: {s725}"
    );
    for k in crate::routes::orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS {
        assert!(
            s725.contains(k),
            "order_chain_sync_status_top_keys_contract_725 should embed {k:?}: {s725}"
        );
    }
    let ocm = oc.as_object().expect("order_chain_sync_status object");
    for (i, k) in ocm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            crate::routes::orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[i],
            "order_chain_sync_status object key order must match ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS"
        );
    }
    assert!(oc["chain_sync_status_enum"]
        .as_str()
        .unwrap_or("")
        .contains("713"));
    let mn714 = oc["minimal_body_note_stable"].as_str().unwrap_or("");
    assert!(
        mn714.contains("714"),
        "minimal_body_note_stable should mention 714: {mn714}"
    );
    assert!(
        mn714.contains(crate::routes::orders::CHAIN_SYNC_MINIMAL_BODY_NOTE),
        "minimal_body_note_stable should embed CHAIN_SYNC_MINIMAL_BODY_NOTE: {mn714}"
    );
    let sb715 = oc["success_body_envelope_status"].as_str().unwrap_or("");
    assert!(
        sb715.contains("715"),
        "success_body_envelope_status should mention 715: {sb715}"
    );
    assert!(
        sb715.contains(crate::routes::orders::CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS),
        "success_body_envelope_status should embed CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS: {sb715}"
    );
    let sb716 = oc["chain_sync_required_top_keys"].as_str().unwrap_or("");
    assert!(
        sb716.contains("716"),
        "chain_sync_required_top_keys should mention 716: {sb716}"
    );
    for key in crate::routes::orders::CHAIN_SYNC_REQUIRED_TOP_KEYS {
        assert!(
            sb716.contains(key),
            "chain_sync_required_top_keys should mention {key:?}: {sb716}"
        );
    }
    let ocsr = oc["rule"].as_str().unwrap_or("");
    assert!(
        ocsr.contains("722"),
        "order_chain_sync_status.rule should mention 722: {ocsr}"
    );
    assert!(
        ocsr.contains("723"),
        "order_chain_sync_status.rule should mention 723: {ocsr}"
    );
    assert!(
        ocsr.contains("724"),
        "order_chain_sync_status.rule should mention 724: {ocsr}"
    );
    assert!(
        ocsr.contains("725"),
        "order_chain_sync_status.rule should mention 725: {ocsr}"
    );
    let fd = &v["indexer"]["finality_discipline"];
    let fd726tk = fd["finality_discipline_top_keys"]
        .as_array()
        .expect("finality_discipline_top_keys array");
    assert_eq!(fd726tk.len(), FINALITY_DISCIPLINE_META_TOP_KEYS.len());
    for (i, exp) in FINALITY_DISCIPLINE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            fd726tk[i].as_str().unwrap(),
            *exp,
            "finality_discipline_top_keys[{i}] should match FINALITY_DISCIPLINE_META_TOP_KEYS"
        );
    }
    let s726 = fd["finality_discipline_top_keys_contract_726"]
        .as_str()
        .unwrap_or("");
    assert!(
        s726.contains("726"),
        "finality_discipline_top_keys_contract_726 should mention 726: {s726}"
    );
    for k in FINALITY_DISCIPLINE_META_TOP_KEYS {
        assert!(
            s726.contains(k),
            "finality_discipline_top_keys_contract_726 should embed {k:?}: {s726}"
        );
    }
    let fdm = fd.as_object().expect("finality_discipline object");
    for (i, k) in fdm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            FINALITY_DISCIPLINE_META_TOP_KEYS[i],
            "finality_discipline object key order must match FINALITY_DISCIPLINE_META_TOP_KEYS"
        );
    }
    let mem_rule757 = v["indexer"]["memory"]["rule"].as_str().unwrap_or("");
    assert!(
        mem_rule757.contains("757"),
        "indexer.memory.rule should mention 757: {mem_rule757}"
    );
    let mem = &v["indexer"]["memory"];
    assert!(mem["available"].is_boolean());
    let im757tk = mem["indexer_memory_top_keys"]
        .as_array()
        .expect("indexer_memory_top_keys array");
    assert_eq!(im757tk.len(), INDEXER_MEMORY_META_TOP_KEYS.len());
    for (i, exp) in INDEXER_MEMORY_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            im757tk[i].as_str().unwrap(),
            *exp,
            "indexer_memory_top_keys[{i}] should match INDEXER_MEMORY_META_TOP_KEYS"
        );
    }
    let s757im = mem["indexer_memory_top_keys_contract_757"]
        .as_str()
        .unwrap_or("");
    assert!(
        s757im.contains("757"),
        "indexer_memory_top_keys_contract_757 should mention 757: {s757im}"
    );
    for k in INDEXER_MEMORY_META_TOP_KEYS {
        assert!(
            s757im.contains(k),
            "indexer_memory_top_keys_contract_757 should embed {k:?}: {s757im}"
        );
    }
    let memm = mem.as_object().expect("indexer.memory object");
    for (i, k) in memm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            INDEXER_MEMORY_META_TOP_KEYS[i],
            "GET /meta indexer.memory object key order must match INDEXER_MEMORY_META_TOP_KEYS"
        );
    }
    let cp_rule758 = v["indexer"]["checkpoint"]["rule"].as_str().unwrap_or("");
    assert!(
        cp_rule758.contains("758"),
        "indexer.checkpoint.rule should mention 758: {cp_rule758}"
    );
    let cp = &v["indexer"]["checkpoint"];
    let cp758tk = cp["indexer_checkpoint_top_keys"]
        .as_array()
        .expect("indexer_checkpoint_top_keys array");
    assert_eq!(cp758tk.len(), INDEXER_CHECKPOINT_META_TOP_KEYS.len());
    for (i, exp) in INDEXER_CHECKPOINT_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            cp758tk[i].as_str().unwrap(),
            *exp,
            "indexer_checkpoint_top_keys[{i}] should match INDEXER_CHECKPOINT_META_TOP_KEYS"
        );
    }
    let s758cp = cp["indexer_checkpoint_top_keys_contract_758"]
        .as_str()
        .unwrap_or("");
    assert!(
        s758cp.contains("758"),
        "indexer_checkpoint_top_keys_contract_758 should mention 758: {s758cp}"
    );
    for k in INDEXER_CHECKPOINT_META_TOP_KEYS {
        assert!(
            s758cp.contains(k),
            "indexer_checkpoint_top_keys_contract_758 should embed {k:?}: {s758cp}"
        );
    }
    let cpm = cp.as_object().expect("indexer.checkpoint object");
    for (i, k) in cpm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            INDEXER_CHECKPOINT_META_TOP_KEYS[i],
            "GET /meta indexer.checkpoint object key order must match INDEXER_CHECKPOINT_META_TOP_KEYS"
        );
    }
    let idx_rule = v["indexer"]["rule"].as_str().unwrap_or("");
    assert!(
        idx_rule.contains("726"),
        "indexer.rule should mention 726: {idx_rule}"
    );
    assert!(
        idx_rule.contains("727"),
        "indexer.rule should mention 727: {idx_rule}"
    );
    assert!(
        idx_rule.contains("757"),
        "indexer.rule should mention 757: {idx_rule}"
    );
    assert!(
        idx_rule.contains("758"),
        "indexer.rule should mention 758: {idx_rule}"
    );
    let ix = &v["indexer"];
    let ix727tk = ix["indexer_top_keys"]
        .as_array()
        .expect("indexer_top_keys array");
    assert_eq!(ix727tk.len(), INDEXER_META_TOP_KEYS.len());
    for (i, exp) in INDEXER_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ix727tk[i].as_str().unwrap(),
            *exp,
            "indexer_top_keys[{i}] should match INDEXER_META_TOP_KEYS"
        );
    }
    let s727 = ix["indexer_top_keys_contract_727"].as_str().unwrap_or("");
    assert!(
        s727.contains("727"),
        "indexer_top_keys_contract_727 should mention 727: {s727}"
    );
    for k in INDEXER_META_TOP_KEYS {
        assert!(
            s727.contains(k),
            "indexer_top_keys_contract_727 should embed {k:?}: {s727}"
        );
    }
    let ixm = ix.as_object().expect("indexer object");
    for (i, k) in ixm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            INDEXER_META_TOP_KEYS[i],
            "indexer object key order must match INDEXER_META_TOP_KEYS"
        );
    }
    let chain_rule = v["chain"]["rule"].as_str().unwrap_or("");
    assert!(
        chain_rule.contains("728"),
        "chain.rule should mention 728: {chain_rule}"
    );
    assert!(
        chain_rule.contains("729"),
        "chain.rule should mention 729: {chain_rule}"
    );
    assert!(
        chain_rule.contains("759"),
        "chain.rule should mention 759: {chain_rule}"
    );
    assert!(
        chain_rule.contains("767"),
        "chain.rule should mention 767: {chain_rule}"
    );
    assert!(
        chain_rule.contains("768"),
        "chain.rule should mention 768: {chain_rule}"
    );
    assert!(
        chain_rule.contains("769"),
        "chain.rule should mention 769: {chain_rule}"
    );
    assert!(
        chain_rule.contains("770"),
        "chain.rule should mention 770: {chain_rule}"
    );
    assert!(
        chain_rule.contains("771"),
        "chain.rule should mention 771: {chain_rule}"
    );
    assert!(
        chain_rule.contains("772"),
        "chain.rule should mention 772: {chain_rule}"
    );
    assert!(
        chain_rule.contains("773"),
        "chain.rule should mention 773: {chain_rule}"
    );
    assert!(
        chain_rule.contains("774"),
        "chain.rule should mention 774: {chain_rule}"
    );
    assert!(
        chain_rule.contains("775"),
        "chain.rule should mention 775: {chain_rule}"
    );
    assert!(
        chain_rule.contains("776"),
        "chain.rule should mention 776: {chain_rule}"
    );
    assert!(
        chain_rule.contains("777"),
        "chain.rule should mention 777: {chain_rule}"
    );
    assert!(
        chain_rule.contains("778"),
        "chain.rule should mention 778: {chain_rule}"
    );
    assert!(
        chain_rule.contains("779"),
        "chain.rule should mention 779: {chain_rule}"
    );
    assert!(
        chain_rule.contains("780"),
        "chain.rule should mention 780: {chain_rule}"
    );
    assert!(
        chain_rule.contains("781"),
        "chain.rule should mention 781: {chain_rule}"
    );
    assert!(
        chain_rule.contains("782"),
        "chain.rule should mention 782: {chain_rule}"
    );
    assert!(
        chain_rule.contains("783"),
        "chain.rule should mention 783: {chain_rule}"
    );
    assert!(
        chain_rule.contains("784"),
        "chain.rule should mention 784: {chain_rule}"
    );
    assert!(
        chain_rule.contains("785"),
        "chain.rule should mention 785: {chain_rule}"
    );
    assert!(
        chain_rule.contains("786"),
        "chain.rule should mention 786: {chain_rule}"
    );
    assert!(
        chain_rule.contains("787"),
        "chain.rule should mention 787: {chain_rule}"
    );
    assert!(
        chain_rule.contains("788"),
        "chain.rule should mention 788: {chain_rule}"
    );
    assert!(
        chain_rule.contains("789"),
        "chain.rule should mention 789: {chain_rule}"
    );
    assert!(
        chain_rule.contains("790"),
        "chain.rule should mention 790: {chain_rule}"
    );
    assert!(
        chain_rule.contains("791"),
        "chain.rule should mention 791: {chain_rule}"
    );
    assert!(
        chain_rule.contains("792"),
        "chain.rule should mention 792: {chain_rule}"
    );
    assert!(
        chain_rule.contains("807"),
        "chain.rule should mention 807: {chain_rule}"
    );
    assert!(
        chain_rule.contains("793"),
        "chain.rule should mention 793: {chain_rule}"
    );
    assert!(
        chain_rule.contains("794"),
        "chain.rule should mention 794: {chain_rule}"
    );
    assert!(
        chain_rule.contains("795"),
        "chain.rule should mention 795: {chain_rule}"
    );
    assert!(
        chain_rule.contains("796"),
        "chain.rule should mention 796: {chain_rule}"
    );
    assert!(
        chain_rule.contains("797"),
        "chain.rule should mention 797: {chain_rule}"
    );
    assert!(
        chain_rule.contains("798"),
        "chain.rule should mention 798: {chain_rule}"
    );
    assert!(
        chain_rule.contains("799"),
        "chain.rule should mention 799: {chain_rule}"
    );
    assert!(
        chain_rule.contains("800"),
        "chain.rule should mention 800: {chain_rule}"
    );
    assert!(
        chain_rule.contains("801"),
        "chain.rule should mention 801: {chain_rule}"
    );
    assert!(
        chain_rule.contains("802"),
        "chain.rule should mention 802: {chain_rule}"
    );
    assert!(
        chain_rule.contains("803"),
        "chain.rule should mention 803: {chain_rule}"
    );
    assert!(
        chain_rule.contains("804"),
        "chain.rule should mention 804: {chain_rule}"
    );
    assert!(
        chain_rule.contains("805"),
        "chain.rule should mention 805: {chain_rule}"
    );
    assert!(
        chain_rule.contains("806"),
        "chain.rule should mention 806: {chain_rule}"
    );
    let ch = &v["chain"];
    let ch729tk = ch["chain_top_keys"]
        .as_array()
        .expect("chain_top_keys array");
    assert_eq!(ch729tk.len(), CHAIN_META_TOP_KEYS.len());
    for (i, exp) in CHAIN_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ch729tk[i].as_str().unwrap(),
            *exp,
            "chain_top_keys[{i}] should match CHAIN_META_TOP_KEYS"
        );
    }
    let s729 = ch["chain_top_keys_contract_729"].as_str().unwrap_or("");
    assert!(
        s729.contains("729"),
        "chain_top_keys_contract_729 should mention 729: {s729}"
    );
    for k in CHAIN_META_TOP_KEYS {
        assert!(
            s729.contains(k),
            "chain_top_keys_contract_729 should embed {k:?}: {s729}"
        );
    }
    let chm = ch.as_object().expect("chain object");
    for (i, k) in chm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            CHAIN_META_TOP_KEYS[i],
            "GET /meta chain object key order must match CHAIN_META_TOP_KEYS"
        );
    }
    if v["chain"]["contracts"].is_object() {
        let cc_rule = v["chain"]["contracts"]["rule"].as_str().unwrap_or("");
        assert!(
            cc_rule.contains("759"),
            "chain.contracts.rule should mention 759 when contracts object: {cc_rule}"
        );
        let cc = &v["chain"]["contracts"];
        let cc759tk = cc["chain_contracts_top_keys"]
            .as_array()
            .expect("chain_contracts_top_keys array");
        assert_eq!(cc759tk.len(), CHAIN_CONTRACTS_META_TOP_KEYS.len());
        for (i, exp) in CHAIN_CONTRACTS_META_TOP_KEYS.iter().enumerate() {
            assert_eq!(
                cc759tk[i].as_str().unwrap(),
                *exp,
                "chain_contracts_top_keys[{i}] should match CHAIN_CONTRACTS_META_TOP_KEYS"
            );
        }
        let s759cc = cc["chain_contracts_top_keys_contract_759"]
            .as_str()
            .unwrap_or("");
        assert!(
            s759cc.contains("759"),
            "chain_contracts_top_keys_contract_759 should mention 759: {s759cc}"
        );
        for k in CHAIN_CONTRACTS_META_TOP_KEYS {
            assert!(
                s759cc.contains(k),
                "chain_contracts_top_keys_contract_759 should embed {k:?}: {s759cc}"
            );
        }
        let ccm = cc.as_object().expect("chain.contracts object");
        for (i, k) in ccm.keys().enumerate() {
            assert_eq!(
                k.as_str(),
                CHAIN_CONTRACTS_META_TOP_KEYS[i],
                "GET /meta chain.contracts object key order must match CHAIN_CONTRACTS_META_TOP_KEYS"
            );
        }
    }
    let build_rule = v["build"]["rule"].as_str().unwrap_or("");
    assert!(
        build_rule.contains("730"),
        "build.rule should mention 730: {build_rule}"
    );
    let bld = &v["build"];
    let b730tk = bld["build_top_keys"]
        .as_array()
        .expect("build_top_keys array");
    assert_eq!(b730tk.len(), META_BUILD_TOP_KEYS.len());
    for (i, exp) in META_BUILD_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            b730tk[i].as_str().unwrap(),
            *exp,
            "build_top_keys[{i}] should match META_BUILD_TOP_KEYS"
        );
    }
    let s730b = bld["build_top_keys_contract_730"].as_str().unwrap_or("");
    assert!(
        s730b.contains("730"),
        "build_top_keys_contract_730 should mention 730: {s730b}"
    );
    for k in META_BUILD_TOP_KEYS {
        assert!(
            s730b.contains(k),
            "build_top_keys_contract_730 should embed {k:?}: {s730b}"
        );
    }
    let bdm = bld.as_object().expect("build object");
    for (i, k) in bdm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            META_BUILD_TOP_KEYS[i],
            "GET /meta build object key order must match META_BUILD_TOP_KEYS"
        );
    }
    let dw_rule = v["dual_write"]["rule"].as_str().unwrap_or("");
    assert!(
        dw_rule.contains("732"),
        "dual_write.rule should mention 732: {dw_rule}"
    );
    let dw = &v["dual_write"];
    let dw732tk = dw["dual_write_top_keys"]
        .as_array()
        .expect("dual_write_top_keys array");
    assert_eq!(dw732tk.len(), DUAL_WRITE_META_TOP_KEYS.len());
    for (i, exp) in DUAL_WRITE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            dw732tk[i].as_str().unwrap(),
            *exp,
            "dual_write_top_keys[{i}] should match DUAL_WRITE_META_TOP_KEYS"
        );
    }
    let s732dw = dw["dual_write_top_keys_contract_732"]
        .as_str()
        .unwrap_or("");
    assert!(
        s732dw.contains("732"),
        "dual_write_top_keys_contract_732 should mention 732: {s732dw}"
    );
    for k in DUAL_WRITE_META_TOP_KEYS {
        assert!(
            s732dw.contains(k),
            "dual_write_top_keys_contract_732 should embed {k:?}: {s732dw}"
        );
    }
    let dwm = dw.as_object().expect("dual_write object");
    for (i, k) in dwm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DUAL_WRITE_META_TOP_KEYS[i],
            "GET /meta dual_write object key order must match DUAL_WRITE_META_TOP_KEYS"
        );
    }
    let sm_rule = v["strict_mode"]["rule"].as_str().unwrap_or("");
    assert!(
        sm_rule.contains("731"),
        "strict_mode.rule should mention 731: {sm_rule}"
    );
    let sm = &v["strict_mode"];
    let sm731tk = sm["strict_mode_top_keys"]
        .as_array()
        .expect("strict_mode_top_keys array");
    assert_eq!(sm731tk.len(), STRICT_MODE_META_TOP_KEYS.len());
    for (i, exp) in STRICT_MODE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            sm731tk[i].as_str().unwrap(),
            *exp,
            "strict_mode_top_keys[{i}] should match STRICT_MODE_META_TOP_KEYS"
        );
    }
    let s731sm = sm["strict_mode_top_keys_contract_731"]
        .as_str()
        .unwrap_or("");
    assert!(
        s731sm.contains("731"),
        "strict_mode_top_keys_contract_731 should mention 731: {s731sm}"
    );
    for k in STRICT_MODE_META_TOP_KEYS {
        assert!(
            s731sm.contains(k),
            "strict_mode_top_keys_contract_731 should embed {k:?}: {s731sm}"
        );
    }
    let smm = sm.as_object().expect("strict_mode object");
    for (i, k) in smm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            STRICT_MODE_META_TOP_KEYS[i],
            "GET /meta strict_mode object key order must match STRICT_MODE_META_TOP_KEYS"
        );
    }
    let ss_rule = v["ssot"]["rule"].as_str().unwrap_or("");
    assert!(
        ss_rule.contains("733"),
        "ssot.rule should mention 733: {ss_rule}"
    );
    let ss = &v["ssot"];
    let ss733tk = ss["ssot_top_keys"].as_array().expect("ssot_top_keys array");
    assert_eq!(ss733tk.len(), SSOT_META_TOP_KEYS.len());
    for (i, exp) in SSOT_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ss733tk[i].as_str().unwrap(),
            *exp,
            "ssot_top_keys[{i}] should match SSOT_META_TOP_KEYS"
        );
    }
    let s733ss = ss["ssot_top_keys_contract_733"].as_str().unwrap_or("");
    assert!(
        s733ss.contains("733"),
        "ssot_top_keys_contract_733 should mention 733: {s733ss}"
    );
    for k in SSOT_META_TOP_KEYS {
        assert!(
            s733ss.contains(k),
            "ssot_top_keys_contract_733 should embed {k:?}: {s733ss}"
        );
    }
    let ssm = ss.as_object().expect("ssot object");
    for (i, k) in ssm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            SSOT_META_TOP_KEYS[i],
            "GET /meta ssot object key order must match SSOT_META_TOP_KEYS"
        );
    }
    let ae_rule = v["admin_exports"]["rule"].as_str().unwrap_or("");
    assert!(
        ae_rule.contains("734"),
        "admin_exports.rule should mention 734: {ae_rule}"
    );
    let ae = &v["admin_exports"];
    let ae734tk = ae["admin_exports_top_keys"]
        .as_array()
        .expect("admin_exports_top_keys array");
    assert_eq!(ae734tk.len(), ADMIN_EXPORTS_META_TOP_KEYS.len());
    for (i, exp) in ADMIN_EXPORTS_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ae734tk[i].as_str().unwrap(),
            *exp,
            "admin_exports_top_keys[{i}] should match ADMIN_EXPORTS_META_TOP_KEYS"
        );
    }
    let s734ae = ae["admin_exports_top_keys_contract_734"]
        .as_str()
        .unwrap_or("");
    assert!(
        s734ae.contains("734"),
        "admin_exports_top_keys_contract_734 should mention 734: {s734ae}"
    );
    for k in ADMIN_EXPORTS_META_TOP_KEYS {
        assert!(
            s734ae.contains(k),
            "admin_exports_top_keys_contract_734 should embed {k:?}: {s734ae}"
        );
    }
    let aem = ae.as_object().expect("admin_exports object");
    for (i, k) in aem.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            ADMIN_EXPORTS_META_TOP_KEYS[i],
            "GET /meta admin_exports object key order must match ADMIN_EXPORTS_META_TOP_KEYS"
        );
    }
    let cb_rule = v["chargeback_policy"]["rule"].as_str().unwrap_or("");
    assert!(
        cb_rule.contains("735"),
        "chargeback_policy.rule should mention 735: {cb_rule}"
    );
    let cb = &v["chargeback_policy"];
    assert_eq!(
        cb["value"].as_str().unwrap_or(""),
        "warn",
        "api_meta_state chargeback_policy.value"
    );
    let cb735tk = cb["chargeback_policy_top_keys"]
        .as_array()
        .expect("chargeback_policy_top_keys array");
    assert_eq!(cb735tk.len(), CHARGEBACK_POLICY_META_TOP_KEYS.len());
    for (i, exp) in CHARGEBACK_POLICY_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            cb735tk[i].as_str().unwrap(),
            *exp,
            "chargeback_policy_top_keys[{i}] should match CHARGEBACK_POLICY_META_TOP_KEYS"
        );
    }
    let s735cb = cb["chargeback_policy_top_keys_contract_735"]
        .as_str()
        .unwrap_or("");
    assert!(
        s735cb.contains("735"),
        "chargeback_policy_top_keys_contract_735 should mention 735: {s735cb}"
    );
    for k in CHARGEBACK_POLICY_META_TOP_KEYS {
        assert!(
            s735cb.contains(k),
            "chargeback_policy_top_keys_contract_735 should embed {k:?}: {s735cb}"
        );
    }
    let cbm = cb.as_object().expect("chargeback_policy object");
    for (i, k) in cbm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            CHARGEBACK_POLICY_META_TOP_KEYS[i],
            "GET /meta chargeback_policy object key order must match CHARGEBACK_POLICY_META_TOP_KEYS"
        );
    }
    let au_rule = v["authority"]["rule"].as_str().unwrap_or("");
    assert!(
        au_rule.contains("736"),
        "authority.rule should mention 736: {au_rule}"
    );
    let au = &v["authority"];
    assert_eq!(
        au["source"].as_str().unwrap_or(""),
        "pending_finality",
        "api_meta_state authority.source"
    );
    assert_eq!(au["degraded_mode"], serde_json::json!(true));
    let au736tk = au["authority_top_keys"]
        .as_array()
        .expect("authority_top_keys array");
    assert_eq!(au736tk.len(), AUTHORITY_META_TOP_KEYS.len());
    for (i, exp) in AUTHORITY_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            au736tk[i].as_str().unwrap(),
            *exp,
            "authority_top_keys[{i}] should match AUTHORITY_META_TOP_KEYS"
        );
    }
    let s736au = au["authority_top_keys_contract_736"].as_str().unwrap_or("");
    assert!(
        s736au.contains("736"),
        "authority_top_keys_contract_736 should mention 736: {s736au}"
    );
    for k in AUTHORITY_META_TOP_KEYS {
        assert!(
            s736au.contains(k),
            "authority_top_keys_contract_736 should embed {k:?}: {s736au}"
        );
    }
    let aum = au.as_object().expect("authority object");
    for (i, k) in aum.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            AUTHORITY_META_TOP_KEYS[i],
            "GET /meta authority object key order must match AUTHORITY_META_TOP_KEYS"
        );
    }
    let pu_rule = v["pause"]["rule"].as_str().unwrap_or("");
    assert!(
        pu_rule.contains("737"),
        "pause.rule should mention 737: {pu_rule}"
    );
    let pu = &v["pause"];
    assert_eq!(pu["enabled"], serde_json::json!(false));
    assert_eq!(pu["api_allowlist"].as_str().unwrap_or(""), "");
    assert!(
        pu["factory_paused"].is_null(),
        "factory_paused null without chain config"
    );
    assert!(
        pu["distribute_paused"].is_null(),
        "distribute_paused null without chain config"
    );
    assert_eq!(pu["chain_pause_read"]["status"], "chain_unavailable");
    assert!(
        pu["chain_pause_read"]["rule"]
            .as_str()
            .unwrap_or("")
            .contains("TT-COMP-B091"),
        "chain_pause_read.rule should cite TT-COMP-B091"
    );
    let cpr = pu["chain_pause_read"].as_object().expect("chain_pause_read object");
    for (i, k) in CHAIN_PAUSE_READ_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            cpr.keys().nth(i).map(|s| s.as_str()),
            Some(*k),
            "chain_pause_read key order[{i}]"
        );
    }
    let pu737tk = pu["pause_top_keys"]
        .as_array()
        .expect("pause_top_keys array");
    assert_eq!(pu737tk.len(), PAUSE_META_TOP_KEYS.len());
    for (i, exp) in PAUSE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            pu737tk[i].as_str().unwrap(),
            *exp,
            "pause_top_keys[{i}] should match PAUSE_META_TOP_KEYS"
        );
    }
    let s737pu = pu["pause_top_keys_contract_737"].as_str().unwrap_or("");
    assert!(
        s737pu.contains("737"),
        "pause_top_keys_contract_737 should mention 737: {s737pu}"
    );
    for k in PAUSE_META_TOP_KEYS {
        assert!(
            s737pu.contains(k),
            "pause_top_keys_contract_737 should embed {k:?}: {s737pu}"
        );
    }
    let pum = pu.as_object().expect("pause object");
    for (i, k) in pum.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            PAUSE_META_TOP_KEYS[i],
            "GET /meta pause object key order must match PAUSE_META_TOP_KEYS"
        );
    }
    let ev_rule = v["evidence"]["rule"].as_str().unwrap_or("");
    assert!(
        ev_rule.contains("738"),
        "evidence.rule should mention 738: {ev_rule}"
    );
    let ev = &v["evidence"];
    let ev738tk = ev["evidence_top_keys"]
        .as_array()
        .expect("evidence_top_keys array");
    assert_eq!(ev738tk.len(), EVIDENCE_META_TOP_KEYS.len());
    for (i, exp) in EVIDENCE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ev738tk[i].as_str().unwrap(),
            *exp,
            "evidence_top_keys[{i}] should match EVIDENCE_META_TOP_KEYS"
        );
    }
    let s738ev = ev["evidence_top_keys_contract_738"].as_str().unwrap_or("");
    assert!(
        s738ev.contains("738"),
        "evidence_top_keys_contract_738 should mention 738: {s738ev}"
    );
    for k in EVIDENCE_META_TOP_KEYS {
        assert!(
            s738ev.contains(k),
            "evidence_top_keys_contract_738 should embed {k:?}: {s738ev}"
        );
    }
    let evm = ev.as_object().expect("evidence object");
    for (i, k) in evm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            EVIDENCE_META_TOP_KEYS[i],
            "GET /meta evidence object key order must match EVIDENCE_META_TOP_KEYS"
        );
    }
    let om_rule739 = v["order_messages"]["rule"].as_str().unwrap_or("");
    assert!(
        om_rule739.contains("739"),
        "order_messages.rule should mention 739: {om_rule739}"
    );
    let om = &v["order_messages"];
    let http_rule = om["http_rule"].as_str().unwrap_or("");
    assert!(
        http_rule.contains("501"),
        "http_rule should mention 501: {http_rule}"
    );
    let om739tk = om["order_messages_top_keys"]
        .as_array()
        .expect("order_messages_top_keys array");
    assert_eq!(om739tk.len(), ORDER_MESSAGES_META_TOP_KEYS.len());
    for (i, exp) in ORDER_MESSAGES_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            om739tk[i].as_str().unwrap(),
            *exp,
            "order_messages_top_keys[{i}] should match ORDER_MESSAGES_META_TOP_KEYS"
        );
    }
    let s739om = om["order_messages_top_keys_contract_739"]
        .as_str()
        .unwrap_or("");
    assert!(
        s739om.contains("739"),
        "order_messages_top_keys_contract_739 should mention 739: {s739om}"
    );
    for k in ORDER_MESSAGES_META_TOP_KEYS {
        assert!(
            s739om.contains(k),
            "order_messages_top_keys_contract_739 should embed {k:?}: {s739om}"
        );
    }
    let omm = om.as_object().expect("order_messages object");
    for (i, k) in omm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            ORDER_MESSAGES_META_TOP_KEYS[i],
            "GET /meta order_messages object key order must match ORDER_MESSAGES_META_TOP_KEYS"
        );
    }
    let rv_rule740 = v["reviews"]["rule"].as_str().unwrap_or("");
    assert!(
        rv_rule740.contains("740"),
        "reviews.rule should mention 740: {rv_rule740}"
    );
    let rv = &v["reviews"];
    let rv740tk = rv["reviews_top_keys"]
        .as_array()
        .expect("reviews_top_keys array");
    assert_eq!(rv740tk.len(), REVIEWS_META_TOP_KEYS.len());
    for (i, exp) in REVIEWS_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            rv740tk[i].as_str().unwrap(),
            *exp,
            "reviews_top_keys[{i}] should match REVIEWS_META_TOP_KEYS"
        );
    }
    let s740rv = rv["reviews_top_keys_contract_740"].as_str().unwrap_or("");
    assert!(
        s740rv.contains("740"),
        "reviews_top_keys_contract_740 should mention 740: {s740rv}"
    );
    for k in REVIEWS_META_TOP_KEYS {
        assert!(
            s740rv.contains(k),
            "reviews_top_keys_contract_740 should embed {k:?}: {s740rv}"
        );
    }
    let rvm = rv.as_object().expect("reviews object");
    for (i, k) in rvm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            REVIEWS_META_TOP_KEYS[i],
            "GET /meta reviews object key order must match REVIEWS_META_TOP_KEYS"
        );
    }
    let do_rule741 = v["dispute_open"]["rule"].as_str().unwrap_or("");
    assert!(
        do_rule741.contains("741"),
        "dispute_open.rule should mention 741: {do_rule741}"
    );
    let dopen = &v["dispute_open"];
    let do741tk = dopen["dispute_open_top_keys"]
        .as_array()
        .expect("dispute_open_top_keys array");
    assert_eq!(do741tk.len(), DISPUTE_OPEN_META_TOP_KEYS.len());
    for (i, exp) in DISPUTE_OPEN_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            do741tk[i].as_str().unwrap(),
            *exp,
            "dispute_open_top_keys[{i}] should match DISPUTE_OPEN_META_TOP_KEYS"
        );
    }
    let s741do = dopen["dispute_open_top_keys_contract_741"]
        .as_str()
        .unwrap_or("");
    assert!(
        s741do.contains("741"),
        "dispute_open_top_keys_contract_741 should mention 741: {s741do}"
    );
    for k in DISPUTE_OPEN_META_TOP_KEYS {
        assert!(
            s741do.contains(k),
            "dispute_open_top_keys_contract_741 should embed {k:?}: {s741do}"
        );
    }
    let dom = dopen.as_object().expect("dispute_open object");
    for (i, k) in dom.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DISPUTE_OPEN_META_TOP_KEYS[i],
            "GET /meta dispute_open object key order must match DISPUTE_OPEN_META_TOP_KEYS"
        );
    }
    let dr_rule742 = v["dispute_resolve"]["rule"].as_str().unwrap_or("");
    assert!(
        dr_rule742.contains("742"),
        "dispute_resolve.rule should mention 742: {dr_rule742}"
    );
    let dres = &v["dispute_resolve"];
    let dr742tk = dres["dispute_resolve_top_keys"]
        .as_array()
        .expect("dispute_resolve_top_keys array");
    assert_eq!(dr742tk.len(), DISPUTE_RESOLVE_META_TOP_KEYS.len());
    for (i, exp) in DISPUTE_RESOLVE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            dr742tk[i].as_str().unwrap(),
            *exp,
            "dispute_resolve_top_keys[{i}] should match DISPUTE_RESOLVE_META_TOP_KEYS"
        );
    }
    let s742dr = dres["dispute_resolve_top_keys_contract_742"]
        .as_str()
        .unwrap_or("");
    assert!(
        s742dr.contains("742"),
        "dispute_resolve_top_keys_contract_742 should mention 742: {s742dr}"
    );
    for k in DISPUTE_RESOLVE_META_TOP_KEYS {
        assert!(
            s742dr.contains(k),
            "dispute_resolve_top_keys_contract_742 should embed {k:?}: {s742dr}"
        );
    }
    let drm = dres.as_object().expect("dispute_resolve object");
    for (i, k) in drm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DISPUTE_RESOLVE_META_TOP_KEYS[i],
            "GET /meta dispute_resolve object key order must match DISPUTE_RESOLVE_META_TOP_KEYS"
        );
    }
    let it_rule743 = v["itineraries"]["rule"].as_str().unwrap_or("");
    assert!(
        it_rule743.contains("743"),
        "itineraries.rule should mention 743: {it_rule743}"
    );
    let itres = &v["itineraries"];
    let it743tk = itres["itineraries_top_keys"]
        .as_array()
        .expect("itineraries_top_keys array");
    assert_eq!(it743tk.len(), ITINERARIES_META_TOP_KEYS.len());
    for (i, exp) in ITINERARIES_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            it743tk[i].as_str().unwrap(),
            *exp,
            "itineraries_top_keys[{i}] should match ITINERARIES_META_TOP_KEYS"
        );
    }
    let s743it = itres["itineraries_top_keys_contract_743"]
        .as_str()
        .unwrap_or("");
    assert!(
        s743it.contains("743"),
        "itineraries_top_keys_contract_743 should mention 743: {s743it}"
    );
    for k in ITINERARIES_META_TOP_KEYS {
        assert!(
            s743it.contains(k),
            "itineraries_top_keys_contract_743 should embed {k:?}: {s743it}"
        );
    }
    let itm = itres.as_object().expect("itineraries object");
    for (i, k) in itm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            ITINERARIES_META_TOP_KEYS[i],
            "GET /meta itineraries object key order must match ITINERARIES_META_TOP_KEYS"
        );
    }
    let ord_rule744 = v["orders"]["rule"].as_str().unwrap_or("");
    assert!(
        ord_rule744.contains("744"),
        "orders.rule should mention 744: {ord_rule744}"
    );
    let ordres = &v["orders"];
    let ord744tk = ordres["orders_top_keys"]
        .as_array()
        .expect("orders_top_keys array");
    assert_eq!(ord744tk.len(), ORDERS_META_TOP_KEYS.len());
    for (i, exp) in ORDERS_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ord744tk[i].as_str().unwrap(),
            *exp,
            "orders_top_keys[{i}] should match ORDERS_META_TOP_KEYS"
        );
    }
    let s744ord = ordres["orders_top_keys_contract_744"]
        .as_str()
        .unwrap_or("");
    assert!(
        s744ord.contains("744"),
        "orders_top_keys_contract_744 should mention 744: {s744ord}"
    );
    for k in ORDERS_META_TOP_KEYS {
        assert!(
            s744ord.contains(k),
            "orders_top_keys_contract_744 should embed {k:?}: {s744ord}"
        );
    }
    let ordm = ordres.as_object().expect("orders object");
    for (i, k) in ordm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            ORDERS_META_TOP_KEYS[i],
            "GET /meta orders object key order must match ORDERS_META_TOP_KEYS"
        );
    }
    let dro = &ordres["deadline_rating_observability"];
    assert_eq!(
        dro["anchor"].as_str(),
        Some("TT-B110-SEQ2-ORDERS-DEADLINE-SSOT-OBSERVE-001")
    );
    if dro["chain_off_mounted"].as_bool() == Some(true) {
        assert!(dro.get("review_window_days_source").is_some());
        assert!(dro.get("review_window_days_effective").is_some());
        let rp = dro
            .get("reconcile_probe")
            .expect("reconcile_probe when chain_off mounted");
        assert_eq!(
            rp["anchor"].as_str(),
            Some("TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001")
        );
        assert!(rp["pass"].is_boolean());
        assert!(rp.get("governor_probe").is_some());
    } else {
        assert_eq!(dro["chain_off_mounted"], serde_json::Value::Bool(false));
    }
    let disc_rule745 = v["discover"]["rule"].as_str().unwrap_or("");
    assert!(
        disc_rule745.contains("745"),
        "discover.rule should mention 745: {disc_rule745}"
    );
    let discres = &v["discover"];
    assert!(
        discres["strict_db_write"].is_boolean()
            && discres["strict_db_write"] == serde_json::Value::Bool(false),
        "discover.strict_db_write should be false"
    );
    let disc745tk = discres["discover_top_keys"]
        .as_array()
        .expect("discover_top_keys array");
    assert_eq!(disc745tk.len(), DISCOVER_META_TOP_KEYS.len());
    for (i, exp) in DISCOVER_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            disc745tk[i].as_str().unwrap(),
            *exp,
            "discover_top_keys[{i}] should match DISCOVER_META_TOP_KEYS"
        );
    }
    let s745disc = discres["discover_top_keys_contract_745"]
        .as_str()
        .unwrap_or("");
    assert!(
        s745disc.contains("745"),
        "discover_top_keys_contract_745 should mention 745: {s745disc}"
    );
    for k in DISCOVER_META_TOP_KEYS {
        assert!(
            s745disc.contains(k),
            "discover_top_keys_contract_745 should embed {k:?}: {s745disc}"
        );
    }
    let discm = discres.as_object().expect("discover object");
    for (i, k) in discm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DISCOVER_META_TOP_KEYS[i],
            "GET /meta discover object key order must match DISCOVER_META_TOP_KEYS"
        );
    }
    let pc_rule746 = v["product_countries"]["rule"].as_str().unwrap_or("");
    assert!(
        pc_rule746.contains("746"),
        "product_countries.rule should mention 746: {pc_rule746}"
    );
    let pcres = &v["product_countries"];
    assert!(
        pcres["strict_db_write"].is_boolean()
            && pcres["strict_db_write"] == serde_json::Value::Bool(false),
        "product_countries.strict_db_write should be false"
    );
    assert!(
        pcres["iso3166_alpha2"].is_array() && pcres["name_zh"].is_array(),
        "product_countries iso/name_zh should be arrays"
    );
    let pc746tk = pcres["product_countries_top_keys"]
        .as_array()
        .expect("product_countries_top_keys array");
    assert_eq!(pc746tk.len(), PRODUCT_COUNTRIES_META_TOP_KEYS.len());
    for (i, exp) in PRODUCT_COUNTRIES_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            pc746tk[i].as_str().unwrap(),
            *exp,
            "product_countries_top_keys[{i}] should match PRODUCT_COUNTRIES_META_TOP_KEYS"
        );
    }
    let s746pc = pcres["product_countries_top_keys_contract_746"]
        .as_str()
        .unwrap_or("");
    assert!(
        s746pc.contains("746"),
        "product_countries_top_keys_contract_746 should mention 746: {s746pc}"
    );
    for k in PRODUCT_COUNTRIES_META_TOP_KEYS {
        assert!(
            s746pc.contains(k),
            "product_countries_top_keys_contract_746 should embed {k:?}: {s746pc}"
        );
    }
    let pcm = pcres.as_object().expect("product_countries object");
    for (i, k) in pcm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            PRODUCT_COUNTRIES_META_TOP_KEYS[i],
            "GET /meta product_countries object key order must match PRODUCT_COUNTRIES_META_TOP_KEYS"
        );
    }
    let dr_rule747 = v["did_rank"]["rule"].as_str().unwrap_or("");
    assert!(
        dr_rule747.contains("747"),
        "did_rank.rule should mention 747: {dr_rule747}"
    );
    let drres = &v["did_rank"];
    assert!(
        drres["strict_db_write"].is_boolean()
            && drres["strict_db_write"] == serde_json::Value::Bool(false),
        "did_rank.strict_db_write should be false"
    );
    let dr747tk = drres["did_rank_top_keys"]
        .as_array()
        .expect("did_rank_top_keys array");
    assert_eq!(dr747tk.len(), DID_RANK_META_TOP_KEYS.len());
    for (i, exp) in DID_RANK_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            dr747tk[i].as_str().unwrap(),
            *exp,
            "did_rank_top_keys[{i}] should match DID_RANK_META_TOP_KEYS"
        );
    }
    let s747dr = drres["did_rank_top_keys_contract_747"]
        .as_str()
        .unwrap_or("");
    assert!(
        s747dr.contains("747"),
        "did_rank_top_keys_contract_747 should mention 747: {s747dr}"
    );
    for k in DID_RANK_META_TOP_KEYS {
        assert!(
            s747dr.contains(k),
            "did_rank_top_keys_contract_747 should embed {k:?}: {s747dr}"
        );
    }
    let drm = drres.as_object().expect("did_rank object");
    for (i, k) in drm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DID_RANK_META_TOP_KEYS[i],
            "GET /meta did_rank object key order must match DID_RANK_META_TOP_KEYS"
        );
    }
    let pr_rule748 = v["product_roles"]["rule"].as_str().unwrap_or("");
    assert!(
        pr_rule748.contains("748"),
        "product_roles.rule should mention 748: {pr_rule748}"
    );
    let prres = &v["product_roles"];
    assert!(
        prres["strict_db_write"].is_boolean()
            && prres["strict_db_write"] == serde_json::Value::Bool(false),
        "product_roles.strict_db_write should be false"
    );
    let pr748tk = prres["product_roles_top_keys"]
        .as_array()
        .expect("product_roles_top_keys array");
    assert_eq!(pr748tk.len(), PRODUCT_ROLES_META_TOP_KEYS.len());
    for (i, exp) in PRODUCT_ROLES_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            pr748tk[i].as_str().unwrap(),
            *exp,
            "product_roles_top_keys[{i}] should match PRODUCT_ROLES_META_TOP_KEYS"
        );
    }
    let s748pr = prres["product_roles_top_keys_contract_748"]
        .as_str()
        .unwrap_or("");
    assert!(
        s748pr.contains("748"),
        "product_roles_top_keys_contract_748 should mention 748: {s748pr}"
    );
    for k in PRODUCT_ROLES_META_TOP_KEYS {
        assert!(
            s748pr.contains(k),
            "product_roles_top_keys_contract_748 should embed {k:?}: {s748pr}"
        );
    }
    let prm = prres.as_object().expect("product_roles object");
    for (i, k) in prm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            PRODUCT_ROLES_META_TOP_KEYS[i],
            "GET /meta product_roles object key order must match PRODUCT_ROLES_META_TOP_KEYS"
        );
    }
    let ar_rule749 = v["auth"]["registration"]["rule"].as_str().unwrap_or("");
    assert!(
        ar_rule749.contains("749"),
        "auth.registration.rule should mention 749: {ar_rule749}"
    );
    let arres = &v["auth"]["registration"];
    assert!(
        arres["strict_db_write"].is_boolean()
            && arres["strict_db_write"] == serde_json::Value::Bool(false),
        "auth.registration.strict_db_write should be false"
    );
    let ar749tk = arres["auth_registration_top_keys"]
        .as_array()
        .expect("auth_registration_top_keys array");
    assert_eq!(ar749tk.len(), AUTH_REGISTRATION_META_TOP_KEYS.len());
    for (i, exp) in AUTH_REGISTRATION_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ar749tk[i].as_str().unwrap(),
            *exp,
            "auth_registration_top_keys[{i}] should match AUTH_REGISTRATION_META_TOP_KEYS"
        );
    }
    let s749ar = arres["auth_registration_top_keys_contract_749"]
        .as_str()
        .unwrap_or("");
    assert!(
        s749ar.contains("749"),
        "auth_registration_top_keys_contract_749 should mention 749: {s749ar}"
    );
    for k in AUTH_REGISTRATION_META_TOP_KEYS {
        assert!(
            s749ar.contains(k),
            "auth_registration_top_keys_contract_749 should embed {k:?}: {s749ar}"
        );
    }
    let arm = arres.as_object().expect("auth.registration object");
    for (i, k) in arm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            AUTH_REGISTRATION_META_TOP_KEYS[i],
            "GET /meta auth.registration object key order must match AUTH_REGISTRATION_META_TOP_KEYS"
        );
    }
    let au_rule750 = v["auth"]["rule"].as_str().unwrap_or("");
    assert!(
        au_rule750.contains("750"),
        "auth.rule should mention 750: {au_rule750}"
    );
    let aures = &v["auth"];
    assert!(
        aures["strict_db_write"].is_boolean(),
        "auth.strict_db_write should be boolean"
    );
    let au750tk = aures["auth_top_keys"]
        .as_array()
        .expect("auth_top_keys array");
    assert_eq!(au750tk.len(), AUTH_META_TOP_KEYS.len());
    for (i, exp) in AUTH_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            au750tk[i].as_str().unwrap(),
            *exp,
            "auth_top_keys[{i}] should match AUTH_META_TOP_KEYS"
        );
    }
    let s750au = aures["auth_top_keys_contract_750"].as_str().unwrap_or("");
    assert!(
        s750au.contains("750"),
        "auth_top_keys_contract_750 should mention 750: {s750au}"
    );
    for k in AUTH_META_TOP_KEYS {
        assert!(
            s750au.contains(k),
            "auth_top_keys_contract_750 should embed {k:?}: {s750au}"
        );
    }
    let aum = aures.as_object().expect("auth object");
    for (i, k) in aum.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            AUTH_META_TOP_KEYS[i],
            "GET /meta auth object key order must match AUTH_META_TOP_KEYS"
        );
    }
    let sta_rule751 = v["seed_test_accounts"]["rule"].as_str().unwrap_or("");
    assert!(
        sta_rule751.contains("751"),
        "seed_test_accounts.rule should mention 751: {sta_rule751}"
    );
    let stares = &v["seed_test_accounts"];
    assert!(
        stares["strict_db_write"].is_boolean(),
        "seed_test_accounts.strict_db_write should be boolean"
    );
    let sta751tk = stares["seed_test_accounts_top_keys"]
        .as_array()
        .expect("seed_test_accounts_top_keys array");
    assert_eq!(sta751tk.len(), SEED_TEST_ACCOUNTS_META_TOP_KEYS.len());
    for (i, exp) in SEED_TEST_ACCOUNTS_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            sta751tk[i].as_str().unwrap(),
            *exp,
            "seed_test_accounts_top_keys[{i}] should match SEED_TEST_ACCOUNTS_META_TOP_KEYS"
        );
    }
    let s751sta = stares["seed_test_accounts_top_keys_contract_751"]
        .as_str()
        .unwrap_or("");
    assert!(
        s751sta.contains("751"),
        "seed_test_accounts_top_keys_contract_751 should mention 751: {s751sta}"
    );
    for k in SEED_TEST_ACCOUNTS_META_TOP_KEYS {
        assert!(
            s751sta.contains(k),
            "seed_test_accounts_top_keys_contract_751 should embed {k:?}: {s751sta}"
        );
    }
    let stam = stares.as_object().expect("seed_test_accounts object");
    for (i, k) in stam.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            SEED_TEST_ACCOUNTS_META_TOP_KEYS[i],
            "GET /meta seed_test_accounts object key order must match SEED_TEST_ACCOUNTS_META_TOP_KEYS"
        );
    }
    let gu_rule752 = v["guides"]["rule"].as_str().unwrap_or("");
    assert!(
        gu_rule752.contains("752"),
        "guides.rule should mention 752: {gu_rule752}"
    );
    let gures = &v["guides"];
    assert!(
        gures["strict_db_write"].is_boolean(),
        "guides.strict_db_write should be boolean"
    );
    let gu752tk = gures["guides_top_keys"]
        .as_array()
        .expect("guides_top_keys array");
    assert_eq!(gu752tk.len(), GUIDES_META_TOP_KEYS.len());
    for (i, exp) in GUIDES_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            gu752tk[i].as_str().unwrap(),
            *exp,
            "guides_top_keys[{i}] should match GUIDES_META_TOP_KEYS"
        );
    }
    let s752gu = gures["guides_top_keys_contract_752"].as_str().unwrap_or("");
    assert!(
        s752gu.contains("752"),
        "guides_top_keys_contract_752 should mention 752: {s752gu}"
    );
    for k in GUIDES_META_TOP_KEYS {
        assert!(
            s752gu.contains(k),
            "guides_top_keys_contract_752 should embed {k:?}: {s752gu}"
        );
    }
    let gum = gures.as_object().expect("guides object");
    for (i, k) in gum.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            GUIDES_META_TOP_KEYS[i],
            "GET /meta guides object key order must match GUIDES_META_TOP_KEYS"
        );
    }
    let gv_rule807 = v["governance"]["rule"].as_str().unwrap_or("");
    assert!(
        gv_rule807.contains("807"),
        "governance.rule should mention 807: {gv_rule807}"
    );
    let gvres = &v["governance"];
    assert!(
        gvres["strict_db_write"].is_boolean(),
        "governance.strict_db_write should be boolean"
    );
    assert!(
        gvres["governor_view_params_observability"].is_object(),
        "governance.governor_view_params_observability should be object"
    );
    assert!(
        gvres["governor_token_timelock_observability"].is_object(),
        "governance.governor_token_timelock_observability should be object"
    );
    assert!(
        gvres["timelock_delay_observability"].is_object(),
        "governance.timelock_delay_observability should be object"
    );
    assert!(
        gvres["governor_proposal_threshold_observability"].is_object(),
        "governance.governor_proposal_threshold_observability should be object"
    );
    assert!(
        gvres["timelock_governor_admin_observability"].is_object(),
        "governance.timelock_governor_admin_observability should be object"
    );
    assert!(
        gvres["governor_proposal_count_observability"].is_object(),
        "governance.governor_proposal_count_observability should be object"
    );
    let gv807tk = gvres["governance_top_keys"]
        .as_array()
        .expect("governance_top_keys array");
    assert_eq!(gv807tk.len(), GOVERNANCE_META_TOP_KEYS.len());
    for (i, exp) in GOVERNANCE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            gv807tk[i].as_str().unwrap(),
            *exp,
            "governance_top_keys[{i}] should match GOVERNANCE_META_TOP_KEYS"
        );
    }
    let s807gv = gvres["governance_top_keys_contract_807"]
        .as_str()
        .unwrap_or("");
    assert!(
        s807gv.contains("807"),
        "governance_top_keys_contract_807 should mention 807: {s807gv}"
    );
    for k in GOVERNANCE_META_TOP_KEYS {
        assert!(
            s807gv.contains(k),
            "governance_top_keys_contract_807 should embed {k:?}: {s807gv}"
        );
    }
    let gvm = gvres.as_object().expect("governance object");
    for (i, k) in gvm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            GOVERNANCE_META_TOP_KEYS[i],
            "GET /meta governance object key order must match GOVERNANCE_META_TOP_KEYS"
        );
    }
    let ic_rule753 = v["idempotency_cache"]["rule"].as_str().unwrap_or("");
    assert!(
        ic_rule753.contains("753"),
        "idempotency_cache.rule should mention 753: {ic_rule753}"
    );
    let icres = &v["idempotency_cache"];
    assert!(
        icres["memory_max_entries"].is_number(),
        "idempotency_cache.memory_max_entries should be number"
    );
    assert!(
        icres["db_projection"].is_string(),
        "idempotency_cache.db_projection should be string"
    );
    let ic753tk = icres["idempotency_cache_top_keys"]
        .as_array()
        .expect("idempotency_cache_top_keys array");
    assert_eq!(ic753tk.len(), IDEMPOTENCY_CACHE_META_TOP_KEYS.len());
    for (i, exp) in IDEMPOTENCY_CACHE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ic753tk[i].as_str().unwrap(),
            *exp,
            "idempotency_cache_top_keys[{i}] should match IDEMPOTENCY_CACHE_META_TOP_KEYS"
        );
    }
    let s753ic = icres["idempotency_cache_top_keys_contract_753"]
        .as_str()
        .unwrap_or("");
    assert!(
        s753ic.contains("753"),
        "idempotency_cache_top_keys_contract_753 should mention 753: {s753ic}"
    );
    for k in IDEMPOTENCY_CACHE_META_TOP_KEYS {
        assert!(
            s753ic.contains(k),
            "idempotency_cache_top_keys_contract_753 should embed {k:?}: {s753ic}"
        );
    }
    let icm = icres.as_object().expect("idempotency_cache object");
    for (i, k) in icm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            IDEMPOTENCY_CACHE_META_TOP_KEYS[i],
            "GET /meta idempotency_cache object key order must match IDEMPOTENCY_CACHE_META_TOP_KEYS"
        );
    }
    let df_rule754 = v["defaults"]["rule"].as_str().unwrap_or("");
    assert!(
        df_rule754.contains("754"),
        "defaults.rule should mention 754: {df_rule754}"
    );
    let dfres = &v["defaults"];
    assert!(
        dfres["request_timeout_secs"].is_number(),
        "defaults.request_timeout_secs should be number"
    );
    assert!(
        dfres["request_body_limit_bytes"].is_number(),
        "defaults.request_body_limit_bytes should be number"
    );
    assert!(
        dfres["idempotency_cache_max"].is_number(),
        "defaults.idempotency_cache_max should be number"
    );
    let df754tk = dfres["defaults_top_keys"]
        .as_array()
        .expect("defaults_top_keys array");
    assert_eq!(df754tk.len(), DEFAULTS_META_TOP_KEYS.len());
    for (i, exp) in DEFAULTS_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            df754tk[i].as_str().unwrap(),
            *exp,
            "defaults_top_keys[{i}] should match DEFAULTS_META_TOP_KEYS"
        );
    }
    let s754df = dfres["defaults_top_keys_contract_754"]
        .as_str()
        .unwrap_or("");
    assert!(
        s754df.contains("754"),
        "defaults_top_keys_contract_754 should mention 754: {s754df}"
    );
    for k in DEFAULTS_META_TOP_KEYS {
        assert!(
            s754df.contains(k),
            "defaults_top_keys_contract_754 should embed {k:?}: {s754df}"
        );
    }
    let dfm = dfres.as_object().expect("defaults object");
    for (i, k) in dfm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DEFAULTS_META_TOP_KEYS[i],
            "GET /meta defaults object key order must match DEFAULTS_META_TOP_KEYS"
        );
    }
    let ob_rule755 = v["outbox"]["rule"].as_str().unwrap_or("");
    assert!(
        ob_rule755.contains("755"),
        "outbox.rule should mention 755: {ob_rule755}"
    );
    let obres = &v["outbox"];
    assert!(obres["dir"].is_string(), "outbox.dir should be string");
    assert!(
        obres["worker_enabled"].is_boolean(),
        "outbox.worker_enabled should be boolean"
    );
    assert!(
        obres["lease_secs"].is_number(),
        "outbox.lease_secs should be number"
    );
    assert!(
        obres["poll_ms"].is_number(),
        "outbox.poll_ms should be number"
    );
    assert!(
        obres["max_attempts"].is_number(),
        "outbox.max_attempts should be number"
    );
    let ob755tk = obres["outbox_top_keys"]
        .as_array()
        .expect("outbox_top_keys array");
    assert_eq!(ob755tk.len(), OUTBOX_META_TOP_KEYS.len());
    for (i, exp) in OUTBOX_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            ob755tk[i].as_str().unwrap(),
            *exp,
            "outbox_top_keys[{i}] should match OUTBOX_META_TOP_KEYS"
        );
    }
    let s755ob = obres["outbox_top_keys_contract_755"].as_str().unwrap_or("");
    assert!(
        s755ob.contains("755"),
        "outbox_top_keys_contract_755 should mention 755: {s755ob}"
    );
    for k in OUTBOX_META_TOP_KEYS {
        assert!(
            s755ob.contains(k),
            "outbox_top_keys_contract_755 should embed {k:?}: {s755ob}"
        );
    }
    let obm = obres.as_object().expect("outbox object");
    for (i, k) in obm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            OUTBOX_META_TOP_KEYS[i],
            "GET /meta outbox object key order must match OUTBOX_META_TOP_KEYS"
        );
    }
    let rl_rule756 = v["rate_limits"]["rule"].as_str().unwrap_or("");
    assert!(
        rl_rule756.contains("756"),
        "rate_limits.rule should mention 756: {rl_rule756}"
    );
    assert!(
        rl_rule756.contains("761"),
        "rate_limits.rule should mention 761: {rl_rule756}"
    );
    let rlres = &v["rate_limits"];
    assert!(rlres["window_seconds"].is_number());
    assert!(rlres["api_requests_per_minute_per_client"].is_number());
    assert!(rlres["api_limit_disabled"].is_boolean());
    assert!(rlres["guide_upload"].is_object());
    let rl756tk = rlres["rate_limits_top_keys"]
        .as_array()
        .expect("rate_limits_top_keys array");
    assert_eq!(rl756tk.len(), RATE_LIMITS_META_TOP_KEYS.len());
    for (i, exp) in RATE_LIMITS_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            rl756tk[i].as_str().unwrap(),
            *exp,
            "rate_limits_top_keys[{i}] should match RATE_LIMITS_META_TOP_KEYS"
        );
    }
    let s756rl = rlres["rate_limits_top_keys_contract_756"]
        .as_str()
        .unwrap_or("");
    assert!(
        s756rl.contains("756"),
        "rate_limits_top_keys_contract_756 should mention 756: {s756rl}"
    );
    for k in RATE_LIMITS_META_TOP_KEYS {
        assert!(
            s756rl.contains(k),
            "rate_limits_top_keys_contract_756 should embed {k:?}: {s756rl}"
        );
    }
    let rlm = rlres.as_object().expect("rate_limits object");
    for (i, k) in rlm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            RATE_LIMITS_META_TOP_KEYS[i],
            "GET /meta rate_limits object key order must match RATE_LIMITS_META_TOP_KEYS"
        );
    }
    let gu761 = rlres["guide_upload"]
        .as_object()
        .expect("guide_upload object");
    let gu_rule761 = gu761["rule"].as_str().unwrap_or("");
    assert!(
        gu_rule761.contains("761"),
        "guide_upload.rule should mention 761: {gu_rule761}"
    );
    let gu761tk = rlres["guide_upload"]["guide_upload_top_keys"]
        .as_array()
        .expect("guide_upload_top_keys array");
    assert_eq!(
        gu761tk.len(),
        crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS.len()
    );
    for (i, exp) in crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS
        .iter()
        .enumerate()
    {
        assert_eq!(
            gu761tk[i].as_str().unwrap(),
            *exp,
            "guide_upload_top_keys[{i}] should match GUIDE_UPLOAD_META_TOP_KEYS"
        );
    }
    let s761gu = rlres["guide_upload"]["guide_upload_top_keys_contract_761"]
        .as_str()
        .unwrap_or("");
    assert!(
        s761gu.contains("761"),
        "guide_upload_top_keys_contract_761 should mention 761: {s761gu}"
    );
    for k in crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS {
        assert!(
            s761gu.contains(k),
            "guide_upload_top_keys_contract_761 should embed {k:?}: {s761gu}"
        );
    }
    for (i, k) in gu761.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            crate::middleware::GUIDE_UPLOAD_META_TOP_KEYS[i],
            "GET /meta rate_limits.guide_upload object key order must match GUIDE_UPLOAD_META_TOP_KEYS"
        );
    }
    let chr = v["chain"]["rule"].as_str().unwrap_or("");
    assert!(chr.contains("760"), "chain.rule should mention 760: {chr}");
    assert!(chr.contains("762"), "chain.rule should mention 762: {chr}");
    assert!(
        chr.contains("761"),
        "chain.rule should mention 761 (762 cross-link): {chr}"
    );
    assert!(chr.contains("763"), "chain.rule should mention 763: {chr}");
    assert!(chr.contains("765"), "chain.rule should mention 765: {chr}");
    assert!(chr.contains("766"), "chain.rule should mention 766: {chr}");
    assert!(chr.contains("767"), "chain.rule should mention 767: {chr}");
    assert!(chr.contains("768"), "chain.rule should mention 768: {chr}");
    assert!(chr.contains("769"), "chain.rule should mention 769: {chr}");
    assert!(chr.contains("770"), "chain.rule should mention 770: {chr}");
    assert!(chr.contains("771"), "chain.rule should mention 771: {chr}");
    assert!(chr.contains("772"), "chain.rule should mention 772: {chr}");
    assert!(chr.contains("773"), "chain.rule should mention 773: {chr}");
    assert!(chr.contains("774"), "chain.rule should mention 774: {chr}");
    assert!(chr.contains("775"), "chain.rule should mention 775: {chr}");
    assert!(chr.contains("776"), "chain.rule should mention 776: {chr}");
    assert!(chr.contains("777"), "chain.rule should mention 777: {chr}");
    assert!(chr.contains("778"), "chain.rule should mention 778: {chr}");
    assert!(chr.contains("779"), "chain.rule should mention 779: {chr}");
    assert!(chr.contains("780"), "chain.rule should mention 780: {chr}");
    assert!(chr.contains("781"), "chain.rule should mention 781: {chr}");
    assert!(chr.contains("782"), "chain.rule should mention 782: {chr}");
    assert!(chr.contains("783"), "chain.rule should mention 783: {chr}");
    assert!(chr.contains("784"), "chain.rule should mention 784: {chr}");
    assert!(chr.contains("785"), "chain.rule should mention 785: {chr}");
    assert!(chr.contains("786"), "chain.rule should mention 786: {chr}");
    assert!(chr.contains("787"), "chain.rule should mention 787: {chr}");
    assert!(chr.contains("788"), "chain.rule should mention 788: {chr}");
    assert!(chr.contains("789"), "chain.rule should mention 789: {chr}");
    assert!(chr.contains("790"), "chain.rule should mention 790: {chr}");
    assert!(chr.contains("791"), "chain.rule should mention 791: {chr}");
    assert!(chr.contains("792"), "chain.rule should mention 792: {chr}");
    assert!(chr.contains("807"), "chain.rule should mention 807: {chr}");
    assert!(chr.contains("793"), "chain.rule should mention 793: {chr}");
    assert!(chr.contains("794"), "chain.rule should mention 794: {chr}");
    assert!(chr.contains("795"), "chain.rule should mention 795: {chr}");
    assert!(chr.contains("796"), "chain.rule should mention 796: {chr}");
    assert!(chr.contains("797"), "chain.rule should mention 797: {chr}");
    assert!(chr.contains("798"), "chain.rule should mention 798: {chr}");
    assert!(chr.contains("799"), "chain.rule should mention 799: {chr}");
    assert!(chr.contains("800"), "chain.rule should mention 800: {chr}");
    assert!(chr.contains("801"), "chain.rule should mention 801: {chr}");
    assert!(chr.contains("802"), "chain.rule should mention 802: {chr}");
    assert!(chr.contains("803"), "chain.rule should mention 803: {chr}");
    assert!(chr.contains("804"), "chain.rule should mention 804: {chr}");
    assert!(chr.contains("805"), "chain.rule should mention 805: {chr}");
    assert!(chr.contains("806"), "chain.rule should mention 806: {chr}");
    let p792 = chr.find("792：").expect("792 clause");
    let p807 = chr.find("807：").expect("807 clause");
    let p793 = chr.find("793：").expect("793 clause");
    assert!(
        p792 < p807 && p807 < p793,
        "792/807/793 clause order: {chr}"
    );
    let p798 = chr.find("798：").expect("798 clause");
    let p799 = chr.find("799：").expect("799 clause");
    let p800 = chr.find("800：").expect("800 clause");
    let p801 = chr.find("801：").expect("801 clause");
    let p802 = chr.find("802：").expect("802 clause");
    let p803 = chr.find("803：").expect("803 clause");
    let p804 = chr.find("804：").expect("804 clause");
    let p805 = chr.find("805：").expect("805 clause");
    let p806 = chr.find("806：").expect("806 clause");
    let p728_tail = chr
        .find("728 GET /meta 根级 meta_top_keys")
        .expect("728 tail clause");
    assert!(
        p798 < p799
            && p799 < p800
            && p800 < p801
            && p801 < p802
            && p802 < p803
            && p803 < p804
            && p804 < p805
            && p805 < p806
            && p806 < p728_tail,
        "798/799/800/801/802/803/804/805/806/728 tail order: {chr}"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS.len(),
        37,
        "META_ROOT_TOP_KEYS length (799 dual-anchor closure + governance)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[2], "build",
        "META_ROOT_TOP_KEYS third key (765 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[3], "chain",
        "META_ROOT_TOP_KEYS fourth key (766 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[4], "rate_limits",
        "META_ROOT_TOP_KEYS fifth key (767 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[5], "database_connected",
        "META_ROOT_TOP_KEYS sixth key (768 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[6], "database",
        "META_ROOT_TOP_KEYS seventh key (769 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[7], "dual_write",
        "META_ROOT_TOP_KEYS eighth key (770 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[8], "strict_mode",
        "META_ROOT_TOP_KEYS ninth key (771 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[9], "ssot_version",
        "META_ROOT_TOP_KEYS tenth key (772 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[11], "admin_exports",
        "META_ROOT_TOP_KEYS twelfth key (773 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[12], "chargeback_policy",
        "META_ROOT_TOP_KEYS thirteenth key (774 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[13], "finality_n",
        "META_ROOT_TOP_KEYS fourteenth key (775 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[14], "indexer",
        "META_ROOT_TOP_KEYS fifteenth key (776 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[15], "authority",
        "META_ROOT_TOP_KEYS sixteenth key (777 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[16], "pause",
        "META_ROOT_TOP_KEYS seventeenth key (778 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[17], "evidence",
        "META_ROOT_TOP_KEYS eighteenth key (779 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[18], "order_messages",
        "META_ROOT_TOP_KEYS nineteenth key (780 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[19], "reviews",
        "META_ROOT_TOP_KEYS twentieth key (781 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[20], "dispute_open",
        "META_ROOT_TOP_KEYS twenty-first key (782 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[21], "dispute_resolve",
        "META_ROOT_TOP_KEYS twenty-second key (783 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[22], "itineraries",
        "META_ROOT_TOP_KEYS twenty-third key (784 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[23], "orders",
        "META_ROOT_TOP_KEYS twenty-fourth key (785 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[24], "discover",
        "META_ROOT_TOP_KEYS twenty-fifth key (786 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[25], "product_countries",
        "META_ROOT_TOP_KEYS twenty-sixth key (787 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[26], "did_rank",
        "META_ROOT_TOP_KEYS twenty-seventh key (788 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[27], "product_roles",
        "META_ROOT_TOP_KEYS twenty-eighth key (789 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[28], "auth",
        "META_ROOT_TOP_KEYS twenty-ninth key (790 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[29], "seed_test_accounts",
        "META_ROOT_TOP_KEYS thirtieth key (791 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[30], "guides",
        "META_ROOT_TOP_KEYS thirty-first key (792 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[31], "governance",
        "META_ROOT_TOP_KEYS thirty-second key (807 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[32], "idempotency_cache",
        "META_ROOT_TOP_KEYS thirty-third key (793 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[33], "defaults",
        "META_ROOT_TOP_KEYS thirty-fourth key (794 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[34], "outbox",
        "META_ROOT_TOP_KEYS thirty-fifth key (795 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[35], "meta_top_keys",
        "META_ROOT_TOP_KEYS thirty-sixth key (796 cross-link)"
    );
    assert_eq!(
        META_ROOT_TOP_KEYS[36], "meta_top_keys_contract_728",
        "META_ROOT_TOP_KEYS thirty-seventh key (797 cross-link)"
    );
    assert_eq!(
        v["service"].as_str().unwrap_or(""),
        "traveltrust-api",
        "GET /meta root service literal (763)"
    );
    assert_eq!(
        v["api_version"].as_str().unwrap_or(""),
        env!("CARGO_PKG_VERSION"),
        "GET /meta api_version should match CARGO_PKG_VERSION (763)"
    );
    assert_eq!(v["database"]["connected"], v["database_connected"]);
    let db_rule760 = v["database"]["rule"].as_str().unwrap_or("");
    assert!(
        db_rule760.contains("760"),
        "database.rule should mention 760: {db_rule760}"
    );
    let db760tk = v["database"]["database_top_keys"]
        .as_array()
        .expect("database_top_keys array");
    assert_eq!(db760tk.len(), DATABASE_META_TOP_KEYS.len());
    for (i, exp) in DATABASE_META_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            db760tk[i].as_str().unwrap(),
            *exp,
            "database_top_keys[{i}] should match DATABASE_META_TOP_KEYS"
        );
    }
    let s760db = v["database"]["database_top_keys_contract_760"]
        .as_str()
        .unwrap_or("");
    assert!(
        s760db.contains("760"),
        "database_top_keys_contract_760 should mention 760: {s760db}"
    );
    for k in DATABASE_META_TOP_KEYS {
        assert!(
            s760db.contains(k),
            "database_top_keys_contract_760 should embed {k:?}: {s760db}"
        );
    }
    let dbm = v["database"].as_object().expect("database object");
    for (i, k) in dbm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            DATABASE_META_TOP_KEYS[i],
            "GET /meta database object key order must match DATABASE_META_TOP_KEYS"
        );
    }
    let m728tk = v["meta_top_keys"].as_array().expect("meta_top_keys array");
    assert_eq!(m728tk.len(), META_ROOT_TOP_KEYS.len());
    for (i, exp) in META_ROOT_TOP_KEYS.iter().enumerate() {
        assert_eq!(
            m728tk[i].as_str().unwrap(),
            *exp,
            "meta_top_keys[{i}] should match META_ROOT_TOP_KEYS"
        );
    }
    let s728 = v["meta_top_keys_contract_728"].as_str().unwrap_or("");
    assert!(
        s728.contains("728"),
        "meta_top_keys_contract_728 should mention 728: {s728}"
    );
    for k in META_ROOT_TOP_KEYS {
        assert!(
            s728.contains(k),
            "meta_top_keys_contract_728 should embed {k:?}: {s728}"
        );
    }
    let vm = v.as_object().expect("meta root object");
    for (i, k) in vm.keys().enumerate() {
        assert_eq!(
            k.as_str(),
            META_ROOT_TOP_KEYS[i],
            "GET /meta root object key order must match META_ROOT_TOP_KEYS"
        );
    }
    let sha = v["build"]["git_sha"].as_str().expect("build.git_sha");
    assert!(
        sha == "unknown" || sha.len() >= 7,
        "local dev uses unknown; CI sets TRAVELTRUST_BUILD_GIT_SHA — got {sha:?}"
    );
    assert!(v["build"]["deployed_at"].is_null());
    assert!(v["build"]["rule"].as_str().unwrap_or("").contains("120"));
}

#[tokio::test]
async fn meta_build_path_matches_meta_build_field() {
    let st = api_meta_state(None);
    let app_m = router().with_state(st.clone());
    let app_b = router().with_state(st);
    let res_m = app_m
        .oneshot(Request::builder().uri("/meta").body(Body::empty()).unwrap())
        .await
        .unwrap();
    let res_b = app_b
        .oneshot(
            Request::builder()
                .uri("/meta/build")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res_m.status(), StatusCode::OK);
    assert_eq!(res_b.status(), StatusCode::OK);
    let bytes_m = res_m.into_body().collect().await.unwrap().to_bytes();
    let bytes_b = res_b.into_body().collect().await.unwrap().to_bytes();
    let vm: serde_json::Value = serde_json::from_slice(&bytes_m).unwrap();
    let vb: serde_json::Value = serde_json::from_slice(&bytes_b).unwrap();
    assert_eq!(vm["build"], vb);
}

#[tokio::test]
async fn meta_order_messages_chain_off_mounted_true_when_present() {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let app = router().with_state(api_meta_state(Some(co)));
    let res = app
        .oneshot(Request::builder().uri("/meta").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(
        v["order_messages"]["chain_off_mounted"],
        serde_json::json!(true)
    );
    assert_eq!(
        v["did_rank"]["guides_community_penalty_exclusion"],
        "chain_off_memory_only"
    );
}

#[tokio::test]
async fn meta_indexer_memory_populated_when_runtime_handle_present() {
    let handle = chain::indexer::new_indexer_state();
    {
        let mut g = handle.write().await;
        g.last_block = 999;
        g.last_log_index = 3;
        g.last_block_hash = "0xabcdef0123456789".into();
        g.events.push(chain::indexer::IndexedChainEvent {
            chain_id: 1,
            block_number: 1,
            log_index: 0,
            block_hash: "0x".into(),
            tx_hash: "0x".into(),
            kind: "0x".into(),
            data: serde_json::json!({}),
        });
    }
    let mut s = api_meta_state(None);
    s.indexer_state = Some(handle);
    let app = router().with_state(s);
    let res = app
        .oneshot(Request::builder().uri("/meta").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["indexer"]["memory"]["available"], true);
    assert_eq!(v["indexer"]["memory"]["last_block"], 999);
    assert_eq!(v["indexer"]["memory"]["last_log_index"], 3);
    assert_eq!(
        v["indexer"]["memory"]["last_block_hash_prefix"],
        "0xabcdef0123"
    );
    assert_eq!(v["indexer"]["memory"]["events_cached"], 1);
    assert!(
        v["indexer"]["memory"]["rule"]
            .as_str()
            .unwrap_or("")
            .contains("757"),
        "indexer.memory.rule should mention 757"
    );
    assert_eq!(
        v["indexer"]["memory"]["indexer_memory_top_keys"]
            .as_array()
            .map(|a| a.len()),
        Some(INDEXER_MEMORY_META_TOP_KEYS.len())
    );
    assert_eq!(v["indexer"]["checkpoint"]["block_number"], 999);
    assert_eq!(v["indexer"]["checkpoint"]["log_index"], 3);
    assert_eq!(v["indexer"]["checkpoint"]["source"], "runtime");
    assert!(
        v["indexer"]["checkpoint"]["rule"]
            .as_str()
            .unwrap_or("")
            .contains("758"),
        "indexer.checkpoint.rule should mention 758"
    );
    assert_eq!(
        v["indexer"]["checkpoint"]["indexer_checkpoint_top_keys"]
            .as_array()
            .map(|a| a.len()),
        Some(INDEXER_CHECKPOINT_META_TOP_KEYS.len())
    );
}

#[tokio::test]
async fn metrics_includes_indexer_gauges() {
    let app = router().with_state(api_meta_state(None));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let text = String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec())
        .unwrap();
    assert!(text.contains("traveltrust_indexer_lag_blocks 9\n"));
    assert!(text.contains("traveltrust_indexer_reorg_detected 1\n"));
    assert!(text.contains("traveltrust_authority_degraded_mode 1\n"));
    assert!(text.contains("traveltrust_indexer_checkpoint_block 40\n"));
    assert!(text.contains("traveltrust_indexer_memory_available 0\n"));
    assert!(text.contains("traveltrust_database_connected 0\n"));
    assert!(text.contains("traveltrust_chain_config_loaded 0\n"));
}

#[tokio::test]
async fn metrics_chain_config_loaded_one_when_chain_config_present() {
    let mut s = api_meta_state(None);
    s.chain_config = Some(crate::chain::ChainConfig {
        rpc_url: "http://127.0.0.1:8545".into(),
        chain_id: 31337,
        ..Default::default()
    });
    let app = router().with_state(s);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let text = String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec())
        .unwrap();
    assert!(text.contains("traveltrust_chain_config_loaded 1\n"));
    assert!(text.contains("traveltrust_database_connected 0\n"));
}

#[tokio::test]
async fn meta_chain_contracts_759_when_chain_config_present() {
    let mut s = api_meta_state(None);
    s.chain_config = Some(crate::chain::ChainConfig {
        rpc_url: "http://127.0.0.1:8545".into(),
        chain_id: 31337,
        ..Default::default()
    });
    let app = router().with_state(s);
    let res = app
        .oneshot(Request::builder().uri("/meta").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(
        v["chain"]["contracts"].is_object(),
        "contracts should be object when chain_config mounted"
    );
    assert!(
        v["chain"]["contracts"]["rule"]
            .as_str()
            .unwrap_or("")
            .contains("759"),
        "chain.contracts.rule should mention 759"
    );
    assert_eq!(
        v["chain"]["contracts"]["chain_contracts_top_keys"]
            .as_array()
            .map(|a| a.len()),
        Some(CHAIN_CONTRACTS_META_TOP_KEYS.len())
    );
    assert_eq!(
        v["chain"]["contracts"]["chain_id_configured"],
        serde_json::json!(31337)
    );
    assert_eq!(
        v["pause"]["chain_pause_read"]["status"],
        "chain_pause_targets_unset"
    );
    assert!(v["pause"]["factory_paused"].is_null());
    assert!(v["pause"]["distribute_paused"].is_null());
    assert!(
        governance_object_keys_match_contract_807(&v["governance"]),
        "GET /meta governance root key order must match GOVERNANCE_META_TOP_KEYS (807 / B-177)"
    );
}

#[tokio::test]
async fn metrics_indexer_memory_last_block_when_handle_present() {
    let handle = chain::indexer::new_indexer_state();
    {
        let mut g = handle.write().await;
        g.last_block = 12345;
    }
    let mut s = api_meta_state(None);
    s.indexer_state = Some(handle);
    s.indexer_lag_blocks = 0;
    s.reorg_detected = false;
    s.degraded_mode = false;
    let app = router().with_state(s);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let text = String::from_utf8(res.into_body().collect().await.unwrap().to_bytes().to_vec())
        .unwrap();
    assert!(text.contains("traveltrust_indexer_memory_available 1\n"));
    assert!(text.contains("traveltrust_indexer_memory_last_block 12345\n"));
    assert!(text.contains("traveltrust_indexer_checkpoint_block 12345\n"));
    assert!(text.contains("traveltrust_indexer_checkpoint_log_index 0\n"));
}

async fn spawn_mock_jsonrpc_eth_call_sequence(results: &[&'static str]) -> String {
    let queue = Arc::new(Mutex::new(VecDeque::from_iter(
        results.iter().map(|s| (*s).to_string()),
    )));
    let n = results.len();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind mock rpc");
    let addr = listener.local_addr().expect("mock rpc addr");
    let (ready_tx, ready_rx) = tokio::sync::oneshot::channel::<()>();
    let q = Arc::clone(&queue);
    tokio::spawn(async move {
        let _ = ready_tx.send(());
        for _ in 0..n {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            let Ok(_req) =
                crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                    .await
            else {
                continue;
            };
            let result_hex = {
                let mut g = q.lock().expect("mock queue");
                g.pop_front().unwrap_or_else(|| "0x".to_string())
            };
            let payload =
                format!(r#"{{"jsonrpc":"2.0","id":1,"result":"{}"}}"#, result_hex);
            let http = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                payload.len(),
                payload
            );
            let _ = socket.write_all(http.as_bytes()).await;
        }
    });
    let _ = ready_rx.await;
    format!("http://{}", addr)
}

async fn spawn_mock_jsonrpc_eth_call_two(results: [&'static str; 2]) -> String {
    spawn_mock_jsonrpc_eth_call_sequence(&[results[0], results[1]]).await
}

/// **TT-B091-META-PAUSE-SNAPSHOT-MOCK-001**：mock **`eth_call`** 返回 ABI 编码 **`bool`**，**`meta_pause_chain_snapshot`** 与 fixture 一致。
#[tokio::test]
async fn comp_b091_meta_pause_chain_eth_call_matches_mock_fixture() {
    let url = spawn_mock_jsonrpc_eth_call_two([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    ])
    .await;
    let cfg = chain::ChainConfig {
        rpc_url: url,
        chain_id: 31337,
        escrow_factory_address: Some("0x0000000000000000000000000000000000000AbC".into()),
        fee_router_address: Some("0x0000000000000000000000000000000000000dEf".into()),
        ..Default::default()
    };
    let snap = meta_pause_chain_snapshot(Some(&cfg)).await;
    assert_eq!(snap.factory_paused, Some(true));
    assert_eq!(snap.distribute_paused, Some(false));
    assert_eq!(snap.read_status, "eth_call");
    assert!(snap.read_error.is_none());
}

/// **TT-B091-GET-META-PAUSE-CHAIN-SYNC-001**：**`GET /meta`** **`pause.factory_paused` / `pause.distribute_paused`** 与 handler 内 **`meta_pause_chain_snapshot`**（**2×`eth_call`**）同源；**勿**在 **`oneshot` 前**再调 **`meta_pause_chain_snapshot`**，否则 mock 连接序耗尽。
#[tokio::test]
async fn b091_get_meta_pause_matches_mock_chain_eth_call() {
    const F: &str = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const D: &str = "0x0000000000000000000000000000000000000000000000000000000000000001";
    let url = spawn_mock_jsonrpc_eth_call_sequence(&[F, D]).await;
    let cfg = chain::ChainConfig {
        rpc_url: url,
        chain_id: 31337,
        escrow_factory_address: Some("0x0000000000000000000000000000000000000AbC".into()),
        fee_router_address: Some("0x0000000000000000000000000000000000000dEf".into()),
        ..Default::default()
    };
    let mut state = api_meta_state(None);
    state.chain_config = Some(cfg);

    let app = router().with_state(state);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/meta")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let pause = &v["pause"];
    assert_eq!(pause["factory_paused"], json!(false));
    assert_eq!(pause["distribute_paused"], json!(true));
    assert_eq!(pause["chain_pause_read"]["status"], json!("eth_call"));
    assert!(pause["chain_pause_read"]["error"].is_null());
}
