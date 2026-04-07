//! /health, /meta, /meta/build, /metrics（48 §2.2 routes/health_meta）

use axum::{extract::State, response::IntoResponse, routing::get, Json, Router};
use digest::Digest;
use serde_json::json;
use sha3::Keccak256;
use std::env;
use std::fmt::Write as _;

use crate::chain;
use crate::middleware;
use crate::state::{any_traveltrust_strict_db_write, dual_write_failure_policy, ApiMetaState};
use traveltrust_core::FEE_ROUTE_COUNTRY_SSOT_FIELD;

async fn health() -> &'static str {
    "ok"
}

/// 120/140：发布证据与运行实例对齐。`git_sha` 优先运行时 `TRAVELTRUST_GIT_SHA` / `GIT_COMMIT_SHA` / `SOURCE_VERSION`，否则编译期 `TRAVELTRUST_BUILD_GIT_SHA`（`cargo build` 前 export），均无则 `"unknown"`。`deployed_at` 可选 ISO8601（`TRAVELTRUST_DEPLOYED_AT` 或 `DEPLOYED_AT`）。
fn meta_build_snapshot(
    runtime_git_sha: Option<String>,
    compile_git_sha: Option<&'static str>,
    deployed_at: Option<String>,
) -> serde_json::Value {
    let sha = runtime_git_sha
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .or_else(|| {
            compile_git_sha
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "unknown".to_string());
    let dep = deployed_at
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    json!({
        "git_sha": sha,
        "deployed_at": dep,
        "rule": "120/140：预发/生产建议在容器或进程注入 TRAVELTRUST_GIT_SHA（或 GIT_COMMIT_SHA、SOURCE_VERSION）与 TRAVELTRUST_DEPLOYED_AT（UTC ISO8601）；镜像构建可在 cargo 前 export TRAVELTRUST_BUILD_GIT_SHA 写入编译期兜底"
    })
}

/// 与 GET `/meta` 的 **`build`**、**`startup_snapshot` · `META_BUILD_*`** 同源（单一事实来源）。**730**：返回体含 **`build_top_keys`** / **`build_top_keys_contract_730`**（**`META_BUILD_TOP_KEYS`** 五键顺序），与 **`GET /meta/build`** 一致。
pub(crate) fn meta_build_value() -> serde_json::Value {
    let runtime_git_sha = env::var("TRAVELTRUST_GIT_SHA")
        .or_else(|_| env::var("GIT_COMMIT_SHA"))
        .or_else(|_| env::var("SOURCE_VERSION"))
        .ok();
    let deployed_at = env::var("TRAVELTRUST_DEPLOYED_AT")
        .or_else(|_| env::var("DEPLOYED_AT"))
        .ok();
    attach_meta_build_top_keys_contract_730(meta_build_snapshot(
        runtime_git_sha,
        option_env!("TRAVELTRUST_BUILD_GIT_SHA"),
        deployed_at,
    ))
}

fn block_hash_prefix_json(hash: &str) -> serde_json::Value {
    let t = hash.trim();
    if t.is_empty() {
        return serde_json::Value::Null;
    }
    let hex = t.strip_prefix("0x").unwrap_or(t);
    let short: String = hex.chars().take(10).collect();
    if short.is_empty() {
        serde_json::Value::Null
    } else {
        serde_json::Value::String(format!("0x{short}"))
    }
}

/// GET `/meta` · **`did_rank`** · **`guides_community_penalty_exclusion`**：与 **`routes/did_rank`** 同源（批 **685**/**686**）。
fn did_rank_guides_community_penalty_exclusion(
    chain_off_mounted: bool,
    chain_off_db_pool: bool,
) -> &'static str {
    if chain_off_db_pool {
        "db_backed"
    } else if chain_off_mounted {
        "chain_off_memory_only"
    } else {
        "no_chain_off"
    }
}

/// 87 / 04 §二 2.1：`users.role` 存量与协议目标角色对照（`GET /me` 公开面映射见 `chain_off::me::role_traveltrust_public`）。
fn product_roles_meta_obs_json() -> serde_json::Value {
    json!({
        "strict_db_write": false,
        "dual_write_order": "GET /meta product_roles is read-only observation JSON; meta handler does not persist this block; GET /api/v1/me public role uses chain_off/me.rs role_traveltrust_public; admin role changes use admin.rs targets (692/697)",
        "rule": "87 §1.2 目标四类 vs 04 §二 2.1 与 admin.rs is_supported_target_role：`users.role` 应用层允许 admin/arbitrator/guide/provider/region_steward/super_admin/tourist/traveler（697：`traveler` 可落库；存量 `tourist` 仍兼容）；GET /api/v1/me 公开 role 经 chain_off/me.rs role_traveltrust_public 将 tourist 映为 traveler、traveler 直通；批 692 将 provider/region_steward 纳入角色变更目标白名单 — 见 07 §六 6.4、87 §11.1；748 GET /meta product_roles 对象 product_roles_top_keys / product_roles_top_keys_contract_748 与 PRODUCT_ROLES_META_TOP_KEYS 十键顺序同源",
        "users_role_stored": ["admin", "arbitrator", "guide", "provider", "region_steward", "super_admin", "tourist", "traveler"],
        "me_public_role_mapping": { "tourist": "traveler" },
        "protocol_roles_target_87": ["traveler", "guide", "provider", "region_steward"],
        "provider_in_users_role": true,
        "region_steward_in_users_role": true,
    })
}

/// **`GET /meta.auth.registration`**：与 **`POST /auth/register`** **`body.role`**（`chain_off::auth::is_self_serve_registration_role` / **`registration_role_stored`**）同源机读（批 **694**/**695**/**697**）。
fn auth_registration_meta_obs_json() -> serde_json::Value {
    json!({
        "strict_db_write": false,
        "dual_write_order": "GET /meta auth.registration is read-only observation JSON; meta handler does not persist this block; POST /auth/register persists user+session via chain_off/auth.rs registration_role_stored (694/695/697)",
        "rule": "694/695/697：POST /auth/register 可选 role 为 tourist|traveler（87 协议名，697 起 traveler 落库 traveler）|provider|region_steward（缺省 tourist）；request_role_aliases 空对象（无别名）；其它应用层 role → 400 invalid_registration_role；邮箱命中 P3_SEED_ARBITRATOR_EMAIL 时强制 arbitrator；guide 须 postRegister 后走 /guide/register + POST /api/v1/guides — 与 chain_off/auth.rs 一致；749 GET /meta auth.registration 对象 auth_registration_top_keys / auth_registration_top_keys_contract_749 与 AUTH_REGISTRATION_META_TOP_KEYS 十一键顺序同源",
        "self_serve_roles_allowed": ["provider", "region_steward", "tourist", "traveler"],
        "request_role_aliases": {},
        "default_role": "tourist",
        "invalid_role_error_key": "invalid_registration_role",
        "arbitrator_seed_env": "P3_SEED_ARBITRATOR_EMAIL",
        "guide_via_separate_flow_only": true,
    })
}

/// **726**：`GET /meta` **`indexer.finality_discipline`** 对象顶层键顺序（机读锁 **`finality_discipline_top_keys`** / **`finality_discipline_top_keys_contract_726`**；与同名列 JSON 数组同源）。
pub(crate) const FINALITY_DISCIPLINE_META_TOP_KEYS: &[&str] = &[
    "tick_logs_upper_bound",
    "postgres_event_log_has_finality_n_used",
    "order_chain_sync_status",
    "chain_tip_not_in_meta",
    "chain_tip_hint",
    "finality_discipline_top_keys",
    "finality_discipline_top_keys_contract_726",
];

pub(crate) fn format_finality_discipline_meta_top_keys_contract_726() -> String {
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
pub(crate) const INDEXER_META_TOP_KEYS: &[&str] = &[
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

pub(crate) fn format_indexer_meta_top_keys_contract_727() -> String {
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
pub(crate) const INDEXER_MEMORY_META_TOP_KEYS: &[&str] = &[
    "available",
    "last_block",
    "last_log_index",
    "last_block_hash_prefix",
    "events_cached",
    "rule",
    "indexer_memory_top_keys",
    "indexer_memory_top_keys_contract_757",
];

pub(crate) fn format_indexer_memory_meta_top_keys_contract_757() -> String {
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
pub(crate) const INDEXER_CHECKPOINT_META_TOP_KEYS: &[&str] = &[
    "block_number",
    "log_index",
    "source",
    "rule",
    "indexer_checkpoint_top_keys",
    "indexer_checkpoint_top_keys_contract_758",
];

pub(crate) fn format_indexer_checkpoint_meta_top_keys_contract_758() -> String {
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
pub(crate) const META_ROOT_TOP_KEYS: &[&str] = &[
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
];

pub(crate) fn format_meta_root_top_keys_contract_728() -> String {
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
pub(crate) const DATABASE_META_TOP_KEYS: &[&str] = &[
    "connected",
    "rule",
    "database_top_keys",
    "database_top_keys_contract_760",
];

pub(crate) fn format_database_meta_top_keys_contract_760() -> String {
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
pub(crate) const CHAIN_META_TOP_KEYS: &[&str] = &[
    "chain_id",
    "contracts",
    "rule",
    "chain_top_keys",
    "chain_top_keys_contract_729",
];

pub(crate) fn format_chain_meta_top_keys_contract_729() -> String {
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

/// **759**：`GET /meta` **`chain.contracts`** 对象顶层键顺序（仅 **`ChainConfig`** 挂载、**`contracts`** **非 **null** 时存在；机读锁 **`chain_contracts_top_keys`** / **`chain_contracts_top_keys_contract_759`**；与同名列 JSON 数组同源；**共 12 键**）。
pub(crate) const CHAIN_CONTRACTS_META_TOP_KEYS: &[&str] = &[
    "escrow_factory_address",
    "fee_router_address",
    "region_vault_address",
    "escrow_platform_fee_recipient",
    "staking_address",
    "registry_address",
    "governor_address",
    "governance_votes_token_address",
    "chain_id_configured",
    "rule",
    "chain_contracts_top_keys",
    "chain_contracts_top_keys_contract_759",
];

pub(crate) fn format_chain_contracts_meta_top_keys_contract_759() -> String {
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
pub(crate) const META_BUILD_TOP_KEYS: &[&str] = &[
    "git_sha",
    "deployed_at",
    "rule",
    "build_top_keys",
    "build_top_keys_contract_730",
];

pub(crate) fn format_meta_build_top_keys_contract_730() -> String {
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

fn attach_meta_build_top_keys_contract_730(mut v: serde_json::Value) -> serde_json::Value {
    if let Some(obj) = v.as_object_mut() {
        let append =
            "；730 GET /meta build 对象 build_top_keys / build_top_keys_contract_730 与 META_BUILD_TOP_KEYS 五键顺序同源";
        if let Some(serde_json::Value::String(r)) = obj.get_mut("rule") {
            r.push_str(append);
        }
        let keys730: serde_json::Value = serde_json::to_value(META_BUILD_TOP_KEYS)
            .expect("META_BUILD_TOP_KEYS serializes to JSON array");
        obj.insert("build_top_keys".to_string(), keys730);
        obj.insert(
            "build_top_keys_contract_730".to_string(),
            serde_json::Value::String(format_meta_build_top_keys_contract_730()),
        );
    }
    v
}

/// **731**：`GET /meta` **`strict_mode`** 对象顶层键顺序（机读锁 **`strict_mode_top_keys`** / **`strict_mode_top_keys_contract_731`**；与同名列 JSON 数组同源）。
pub(crate) const STRICT_MODE_META_TOP_KEYS: &[&str] = &[
    "strict_ssot",
    "require_idempotency_key",
    "strict_session_gate",
    "internal_api_secret_configured",
    "rule",
    "strict_mode_top_keys",
    "strict_mode_top_keys_contract_731",
];

pub(crate) fn format_strict_mode_meta_top_keys_contract_731() -> String {
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
pub(crate) const DUAL_WRITE_META_TOP_KEYS: &[&str] = &[
    "failure_policy",
    "strict_db_write_any",
    "rule",
    "dual_write_top_keys",
    "dual_write_top_keys_contract_732",
];

pub(crate) fn format_dual_write_meta_top_keys_contract_732() -> String {
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
pub(crate) const SSOT_META_TOP_KEYS: &[&str] = &[
    "expected_sha256",
    "computed_sha256",
    "match",
    "file",
    "rule",
    "ssot_top_keys",
    "ssot_top_keys_contract_733",
];

pub(crate) fn format_ssot_meta_top_keys_contract_733() -> String {
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
pub(crate) const ADMIN_EXPORTS_META_TOP_KEYS: &[&str] = &[
    "reconcile_ed25519_public_key_hex",
    "reconcile_ed25519_response_header",
    "rule",
    "admin_exports_top_keys",
    "admin_exports_top_keys_contract_734",
];

pub(crate) fn format_admin_exports_meta_top_keys_contract_734() -> String {
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
pub(crate) const CHARGEBACK_POLICY_META_TOP_KEYS: &[&str] = &[
    "value",
    "rule",
    "chargeback_policy_top_keys",
    "chargeback_policy_top_keys_contract_735",
];

pub(crate) fn format_chargeback_policy_meta_top_keys_contract_735() -> String {
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
pub(crate) const AUTHORITY_META_TOP_KEYS: &[&str] = &[
    "source",
    "degraded_mode",
    "rule",
    "authority_top_keys",
    "authority_top_keys_contract_736",
];

pub(crate) fn format_authority_meta_top_keys_contract_736() -> String {
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
pub(crate) const PAUSE_META_TOP_KEYS: &[&str] = &[
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
pub(crate) const CHAIN_PAUSE_READ_META_TOP_KEYS: &[&str] = &["status", "error", "rule"];

pub(crate) fn format_pause_meta_top_keys_contract_737() -> String {
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
pub(crate) const EVIDENCE_META_TOP_KEYS: &[&str] = &[
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

pub(crate) fn format_evidence_meta_top_keys_contract_738() -> String {
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
pub(crate) const ORDER_MESSAGES_META_TOP_KEYS: &[&str] = &[
    "chain_off_mounted",
    "strict_db_write",
    "dual_write_order",
    "http_rule",
    "rule",
    "order_messages_top_keys",
    "order_messages_top_keys_contract_739",
];

pub(crate) fn format_order_messages_meta_top_keys_contract_739() -> String {
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
pub(crate) const REVIEWS_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "reviews_top_keys",
    "reviews_top_keys_contract_740",
];

pub(crate) fn format_reviews_meta_top_keys_contract_740() -> String {
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
pub(crate) const DISPUTE_OPEN_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "dispute_open_top_keys",
    "dispute_open_top_keys_contract_741",
];

pub(crate) fn format_dispute_open_meta_top_keys_contract_741() -> String {
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
pub(crate) const DISPUTE_RESOLVE_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "dispute_resolve_top_keys",
    "dispute_resolve_top_keys_contract_742",
];

pub(crate) fn format_dispute_resolve_meta_top_keys_contract_742() -> String {
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
pub(crate) const ITINERARIES_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "itineraries_top_keys",
    "itineraries_top_keys_contract_743",
];

pub(crate) fn format_itineraries_meta_top_keys_contract_743() -> String {
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
pub(crate) const ORDERS_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "list_pagination",
    "fee_route_country_ssot",
    "orders_top_keys",
    "orders_top_keys_contract_744",
];

pub(crate) fn format_orders_meta_top_keys_contract_744() -> String {
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
pub(crate) const DISCOVER_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "orders_pagination",
    "discover_top_keys",
    "discover_top_keys_contract_745",
];

pub(crate) fn format_discover_meta_top_keys_contract_745() -> String {
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
pub(crate) const PRODUCT_COUNTRIES_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "iso3166_alpha2",
    "name_zh",
    "product_countries_top_keys",
    "product_countries_top_keys_contract_746",
];

pub(crate) fn format_product_countries_meta_top_keys_contract_746() -> String {
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
pub(crate) const DID_RANK_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "dual_write_order",
    "rule",
    "chain_off_mounted",
    "chain_off_db_pool",
    "guides_community_penalty_exclusion",
    "did_rank_top_keys",
    "did_rank_top_keys_contract_747",
];

pub(crate) fn format_did_rank_meta_top_keys_contract_747() -> String {
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
pub(crate) const PRODUCT_ROLES_META_TOP_KEYS: &[&str] = &[
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

pub(crate) fn format_product_roles_meta_top_keys_contract_748() -> String {
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
pub(crate) const AUTH_REGISTRATION_META_TOP_KEYS: &[&str] = &[
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

pub(crate) fn format_auth_registration_meta_top_keys_contract_749() -> String {
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
pub(crate) const AUTH_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "registration",
    "rule",
    "auth_top_keys",
    "auth_top_keys_contract_750",
];

pub(crate) fn format_auth_meta_top_keys_contract_750() -> String {
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
pub(crate) const SEED_TEST_ACCOUNTS_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "rule",
    "seed_test_accounts_top_keys",
    "seed_test_accounts_top_keys_contract_751",
];

pub(crate) fn format_seed_test_accounts_meta_top_keys_contract_751() -> String {
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
pub(crate) const GUIDES_META_TOP_KEYS: &[&str] = &[
    "strict_db_write",
    "rule",
    "guides_top_keys",
    "guides_top_keys_contract_752",
];

pub(crate) fn format_guides_meta_top_keys_contract_752() -> String {
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

/// **753**：`GET /meta` **`idempotency_cache`** 对象顶层键顺序（机读锁 **`idempotency_cache_top_keys`** / **`idempotency_cache_top_keys_contract_753`**；与同名列 JSON 数组同源）。
pub(crate) const IDEMPOTENCY_CACHE_META_TOP_KEYS: &[&str] = &[
    "memory_max_entries",
    "db_projection",
    "rule",
    "idempotency_cache_top_keys",
    "idempotency_cache_top_keys_contract_753",
];

pub(crate) fn format_idempotency_cache_meta_top_keys_contract_753() -> String {
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
pub(crate) const DEFAULTS_META_TOP_KEYS: &[&str] = &[
    "request_timeout_secs",
    "request_body_limit_bytes",
    "idempotency_cache_max",
    "rule",
    "defaults_top_keys",
    "defaults_top_keys_contract_754",
];

pub(crate) fn format_defaults_meta_top_keys_contract_754() -> String {
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
pub(crate) const OUTBOX_META_TOP_KEYS: &[&str] = &[
    "dir",
    "worker_enabled",
    "lease_secs",
    "poll_ms",
    "max_attempts",
    "rule",
    "outbox_top_keys",
    "outbox_top_keys_contract_755",
];

pub(crate) fn format_outbox_meta_top_keys_contract_755() -> String {
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
pub(crate) const RATE_LIMITS_META_TOP_KEYS: &[&str] = &[
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

pub(crate) fn format_rate_limits_meta_top_keys_contract_756() -> String {
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

/// 与 GET `/meta` 响应中 `build` 块同源，写入 `startup_snapshot` 一行（15 附录〇、Runbook；目标环境 evidence 可 grep）。
pub(crate) fn meta_build_for_startup_log() -> (String, String) {
    let v = meta_build_value();
    let sha = v["git_sha"].as_str().unwrap_or("unknown").to_string();
    let dep_label = match &v["deployed_at"] {
        serde_json::Value::String(s) => {
            let t = s.trim();
            if t.is_empty() {
                "unset".to_string()
            } else {
                t.to_string()
            }
        }
        serde_json::Value::Null => "unset".to_string(),
        _ => "unset".to_string(),
    };
    (sha, dep_label)
}

/// B-091：`factoryPaused()` / `distributePaused()` 的 **4** 字节 selector（Solidity **`bool public`** getter）。
fn b091_evm_selector(canonical_sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(canonical_sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

async fn eth_call_bool_latest(
    client: &reqwest::Client,
    rpc_url: &str,
    to: &str,
    selector: [u8; 4],
) -> Result<bool, String> {
    let data = format!("0x{}", hex::encode(selector));
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_result = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_call failed")
            .to_string()
    })?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    Ok(raw[31] != 0)
}

struct MetaPauseChainSnapshot {
    factory_paused: Option<bool>,
    distribute_paused: Option<bool>,
    read_status: &'static str,
    read_error: Option<String>,
}

/// **TT-COMP-B091**：在 **`CHAIN_RPC_URL`** 与对应合约地址可用时 **`eth_call`** 读 **`factoryPaused` / `distributePaused`**；否则 **`null`** + 显式 **`chain_pause_read.status`**（**禁止**伪造链上真值）。
async fn meta_pause_chain_snapshot(cfg: Option<&chain::ChainConfig>) -> MetaPauseChainSnapshot {
    let Some(cfg) = cfg else {
        return MetaPauseChainSnapshot {
            factory_paused: None,
            distribute_paused: None,
            read_status: "chain_unavailable",
            read_error: None,
        };
    };
    if !cfg.is_configured() {
        return MetaPauseChainSnapshot {
            factory_paused: None,
            distribute_paused: None,
            read_status: "chain_unavailable",
            read_error: None,
        };
    }
    let sel_factory = b091_evm_selector("factoryPaused()");
    let sel_dist = b091_evm_selector("distributePaused()");
    let mut factory_paused = None;
    let mut distribute_paused = None;
    let mut errors: Vec<String> = Vec::new();
    let mut attempted = false;

    if let Some(to_raw) = cfg
        .escrow_factory_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        attempted = true;
        let to = if to_raw.starts_with("0x") || to_raw.starts_with("0X") {
            to_raw.to_string()
        } else {
            format!("0x{}", to_raw)
        };
        // 每路独立 **Client**：避免连接复用下单次 **accept** mock / 部分代理对 **pipeline** 行为不一致（B-091 单测与运维读链）。
        match eth_call_bool_latest(&reqwest::Client::new(), &cfg.rpc_url, &to, sel_factory).await {
            Ok(b) => factory_paused = Some(b),
            Err(e) => errors.push(format!("factoryPaused: {e}")),
        }
    }

    if let Some(to_raw) = cfg
        .fee_router_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        attempted = true;
        let to = if to_raw.starts_with("0x") || to_raw.starts_with("0X") {
            to_raw.to_string()
        } else {
            format!("0x{}", to_raw)
        };
        match eth_call_bool_latest(&reqwest::Client::new(), &cfg.rpc_url, &to, sel_dist).await {
            Ok(b) => distribute_paused = Some(b),
            Err(e) => errors.push(format!("distributePaused: {e}")),
        }
    }

    let read_status = if !attempted {
        "chain_pause_targets_unset"
    } else if errors.is_empty() {
        "eth_call"
    } else {
        "eth_call_error"
    };
    let read_error = if errors.is_empty() {
        None
    } else {
        Some(errors.join("; "))
    };
    MetaPauseChainSnapshot {
        factory_paused,
        distribute_paused,
        read_status,
        read_error,
    }
}

/// GET /meta/build：`build` 对象 JSON（`git_sha` / `deployed_at` / `rule` + **730** **`build_top_keys`** / **`build_top_keys_contract_730`**），与 **GET /meta** 根级 **`build`**、Admin **`meta.build`**、**`internal/indexer-tick`** 嵌入 **`build`** 同源（**`meta_build_value`**，120/140）。文档写法 **`GET /meta.build`** 与本路径同义。
async fn meta_build_only() -> Json<serde_json::Value> {
    Json(meta_build_value())
}

/// GET /meta: 版本与运行时默认配置快照（用于 08 drift/evidence 与 FE 版本绑定）；§8.2 暴露 database_connected（55 优化）
async fn meta(State(state): State<ApiMetaState>) -> impl IntoResponse {
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
        let escrow_platform_fee_recipient = c.escrow_platform_fee_recipient();
        json!({
            "escrow_factory_address": &c.escrow_factory_address,
            "fee_router_address": &c.fee_router_address,
            "region_vault_address": &c.region_vault_address,
            "escrow_platform_fee_recipient": escrow_platform_fee_recipient,
            "staking_address": &c.staking_address,
            "registry_address": &c.registry_address,
            "governor_address": &c.governor_address,
            "governance_votes_token_address": &c.governance_votes_token_address,
            "chain_id_configured": c.chain_id,
            "rule": "仅当 CHAIN_RPC_URL 等已加载 ChainConfig 时有值；地址与前端 NEXT_PUBLIC_* 部署须一致；FEE_ROUTER_ADDRESS 设后 indexer-tick 拉取 PlatformFeeRouted；REGION_VAULT_ADDRESS 设后拉取 RegionVaultForwarded 写入 region_vault_forwarded_events；GOVERNOR_ADDRESS 设后 indexer-tick 拉取 Governor 事件写入 governance_proposals_projection（B-089）；GOVERNANCE_VOTES_TOKEN_ADDRESS 供 GET …/governance/proposals/:id 与 getPastVotes 对拍；EscrowFactory.createEscrow.platformFeeRecipient 应与 fee_router_address / escrow_platform_fee_recipient 一致（Runbook §7.1）"
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
            "rule": "与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐；contracts 见 ChainConfig；759：ChainConfig 挂载且 contracts 非 null 时 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 与 CHAIN_CONTRACTS_META_TOP_KEYS 十二键顺序同源；760：GET /meta database 对象 database_top_keys / database_top_keys_contract_760 与 DATABASE_META_TOP_KEYS 四键顺序同源，database.connected 与根级 database_connected 布尔同源；762：GET /meta rate_limits.guide_upload 对象 guide_upload_top_keys / guide_upload_top_keys_contract_761 与 GUIDE_UPLOAD_META_TOP_KEYS 五键顺序同源（761 子树机读互链）；763：GET /meta 根级 service（traveltrust-api）与 api_version（CARGO_PKG_VERSION）为实例版本可观测锚点，与 META_ROOT_TOP_KEYS 首二键 service→api_version 及 728 meta_top_keys 机读同源；765：GET /meta 根级 build 对象 build_top_keys / build_top_keys_contract_730 与 META_BUILD_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第三键 build 及 728 meta_top_keys 机读同源；766：GET /meta 根级 chain 对象 chain_top_keys / chain_top_keys_contract_729 与 CHAIN_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读同源；767：GET /meta 根级 rate_limits 对象 rate_limits_top_keys / rate_limits_top_keys_contract_756 与 RATE_LIMITS_META_TOP_KEYS 十五键顺序同源，与 META_ROOT_TOP_KEYS 第五键 rate_limits 及 728 meta_top_keys 机读同源；768：GET /meta 根级 database_connected 与 database.connected 及 DATABASE_META_TOP_KEYS 首键 connected 布尔同源，与 META_ROOT_TOP_KEYS 第六键 database_connected 及 728 meta_top_keys 机读同源；769：GET /meta 根级 database 对象 database_top_keys / database_top_keys_contract_760 与 DATABASE_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第七键 database 及 728 meta_top_keys 机读同源；770：GET /meta 根级 dual_write 对象 dual_write_top_keys / dual_write_top_keys_contract_732 与 DUAL_WRITE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第八键 dual_write 及 728 meta_top_keys 机读同源；771：GET /meta 根级 strict_mode 对象 strict_mode_top_keys / strict_mode_top_keys_contract_731 与 STRICT_MODE_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第九键 strict_mode 及 728 meta_top_keys 机读同源；772：GET /meta 根级 ssot_version 与 strict_mode.rule 中「strict_ssot 与 GET /meta.ssot_version 及启动 STRICT_SSOT 同源」一致，与 META_ROOT_TOP_KEYS 第十键 ssot_version 及 728 meta_top_keys 机读同源；733 GET /meta ssot 对象 ssot_top_keys / ssot_top_keys_contract_733 与 SSOT_META_TOP_KEYS 七键顺序同源；773：GET /meta 根级 admin_exports 对象 admin_exports_top_keys / admin_exports_top_keys_contract_734 与 ADMIN_EXPORTS_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十二键 admin_exports 及 728 meta_top_keys 机读同源；774：GET /meta 根级 chargeback_policy 对象 chargeback_policy_top_keys / chargeback_policy_top_keys_contract_735 与 CHARGEBACK_POLICY_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第十三键 chargeback_policy 及 728 meta_top_keys 机读同源；775：GET /meta 根级 finality_n 与 FINALITY_N 及 GET /meta.indexer.finality_n 同源，与 META_ROOT_TOP_KEYS 第十四键 finality_n 及 728 meta_top_keys 机读同源；776：GET /meta 根级 indexer 对象 indexer_top_keys / indexer_top_keys_contract_727 与 INDEXER_META_TOP_KEYS 十三键顺序同源，与 META_ROOT_TOP_KEYS 第十五键 indexer 及 728 meta_top_keys 机读同源；777：GET /meta 根级 authority 对象 authority_top_keys / authority_top_keys_contract_736 与 AUTHORITY_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十六键 authority 及 728 meta_top_keys 机读同源；778：GET /meta 根级 pause 对象 pause_top_keys / pause_top_keys_contract_737 与 PAUSE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第十七键 pause 及 728 meta_top_keys 机读同源；779：GET /meta 根级 evidence 对象 evidence_top_keys / evidence_top_keys_contract_738 与 EVIDENCE_META_TOP_KEYS 九键顺序同源，与 META_ROOT_TOP_KEYS 第十八键 evidence 及 728 meta_top_keys 机读同源；780：GET /meta 根级 order_messages 对象 order_messages_top_keys / order_messages_top_keys_contract_739 与 ORDER_MESSAGES_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第十九键 order_messages 及 728 meta_top_keys 机读同源；781：GET /meta 根级 reviews 对象 reviews_top_keys / reviews_top_keys_contract_740 与 REVIEWS_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十键 reviews 及 728 meta_top_keys 机读同源；782：GET /meta 根级 dispute_open 对象 dispute_open_top_keys / dispute_open_top_keys_contract_741 与 DISPUTE_OPEN_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十一键 dispute_open 及 728 meta_top_keys 机读同源；783：GET /meta 根级 dispute_resolve 对象 dispute_resolve_top_keys / dispute_resolve_top_keys_contract_742 与 DISPUTE_RESOLVE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十二键 dispute_resolve 及 728 meta_top_keys 机读同源；784：GET /meta 根级 itineraries 对象 itineraries_top_keys / itineraries_top_keys_contract_743 与 ITINERARIES_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十三键 itineraries 及 728 meta_top_keys 机读同源；785：GET /meta 根级 orders 对象 orders_top_keys / orders_top_keys_contract_744 与 ORDERS_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第二十四键 orders 及 728 meta_top_keys 机读同源；786：GET /meta 根级 discover 对象 discover_top_keys / discover_top_keys_contract_745 与 DISCOVER_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第二十五键 discover 及 728 meta_top_keys 机读同源；787：GET /meta 根级 product_countries 对象 product_countries_top_keys / product_countries_top_keys_contract_746 与 PRODUCT_COUNTRIES_META_TOP_KEYS 七键顺序同源，与 META_ROOT_TOP_KEYS 第二十六键 product_countries 及 728 meta_top_keys 机读同源；788：GET /meta 根级 did_rank 对象 did_rank_top_keys / did_rank_top_keys_contract_747 与 DID_RANK_META_TOP_KEYS 八键顺序同源，与 META_ROOT_TOP_KEYS 第二十七键 did_rank 及 728 meta_top_keys 机读同源；789：GET /meta 根级 product_roles 对象 product_roles_top_keys / product_roles_top_keys_contract_748 与 PRODUCT_ROLES_META_TOP_KEYS 十键顺序同源，与 META_ROOT_TOP_KEYS 第二十八键 product_roles 及 728 meta_top_keys 机读同源；790：GET /meta 根级 auth 对象 auth_top_keys / auth_top_keys_contract_750 与 AUTH_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第二十九键 auth 及 728 meta_top_keys 机读同源；791：GET /meta 根级 seed_test_accounts 对象 seed_test_accounts_top_keys / seed_test_accounts_top_keys_contract_751 与 SEED_TEST_ACCOUNTS_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第三十键 seed_test_accounts 及 728 meta_top_keys 机读同源；792：GET /meta 根级 guides 对象 guides_top_keys / guides_top_keys_contract_752 与 GUIDES_META_TOP_KEYS 四键顺序同源，与 META_ROOT_TOP_KEYS 第三十一键 guides 及 728 meta_top_keys 机读同源；793：GET /meta 根级 idempotency_cache 对象 idempotency_cache_top_keys / idempotency_cache_top_keys_contract_753 与 IDEMPOTENCY_CACHE_META_TOP_KEYS 五键顺序同源，与 META_ROOT_TOP_KEYS 第三十二键 idempotency_cache 及 728 meta_top_keys 机读同源；794：GET /meta 根级 defaults 对象 defaults_top_keys / defaults_top_keys_contract_754 与 DEFAULTS_META_TOP_KEYS 六键顺序同源，与 META_ROOT_TOP_KEYS 第三十三键 defaults 及 728 meta_top_keys 机读同源；795：GET /meta 根级 outbox 对象 outbox_top_keys / outbox_top_keys_contract_755 与 OUTBOX_META_TOP_KEYS 八键顺序同源，与 META_ROOT_TOP_KEYS 第三十四键 outbox 及 728 meta_top_keys 机读同源；796：GET /meta 根级 meta_top_keys JSON 数组与 META_ROOT_TOP_KEYS 三十六键顺序同源，根级 meta_top_keys_contract_728 机读与 728 contract 同源，与 META_ROOT_TOP_KEYS 第三十五键 meta_top_keys 机读互链；797：GET /meta 根级 meta_top_keys_contract_728 与 META_ROOT_TOP_KEYS 第三十六键 meta_top_keys_contract_728 机读同源，与 728 contract、META_ROOT_TOP_KEYS 第三十五键 meta_top_keys 机读互链；798：GET /meta 根级 meta_top_keys JSON 数组三十六项与 META_ROOT_TOP_KEYS 三十六键顺序逐项同源，meta_top_keys_contract_728 嵌入三十六键字面顺序同源，796 与 797 与文末 728 句链式互证；799：798 句与文末 728 句机读相邻互锁，双锚根级 meta_top_keys JSON 数组三十六项与 META_ROOT_TOP_KEYS 三十六键及 meta_top_keys_contract_728 字面顺序同源闭环；800：799 双锚闭环与 GET /meta chain 对象 729 chain_top_keys / chain_top_keys_contract_729 及 CHAIN_META_TOP_KEYS 五键机读同源，与 META_ROOT_TOP_KEYS 第四键 chain 及 766 机读句串联互证；801：800 串联与 GET /meta chain.contracts 非 null 时 759 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 及 CHAIN_CONTRACTS_META_TOP_KEYS 十二键机读同源，与 799 双锚闭环及 766/729 chain 子树三向互证；802：801 串联与 GET /meta chain.contracts 非 null 时 contracts.rule 嵌入之 759 句与根级 chain.rule 759 及 801 十键机读核心同源，与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 及 801 四向互证；803：802 串联与 800 及 766 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 / CHAIN_META_TOP_KEYS 五键机读同源，与 799 双锚经 729、801、759、802 contracts.rule 根级 chain.rule 759 嵌入形成五向链读闭环，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读六向互证；804：803 六向互证与 GET /meta chain.chain_id 及根级 chain.rule 文首与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐及 contracts 见 ChainConfig 机读同源，七向收束 803 链读至 CHAIN_META_TOP_KEYS 首键 chain_id 部署观测锚，与 chain_top_keys / chain_top_keys_contract_729 及 803 七向互证；805：804 七向互证与 GET /meta chain.contracts 及 CHAIN_META_TOP_KEYS 第二键 contracts 机读同源，八向收束 804 链读至 contracts 部署观测锚与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 十二键及 801 三向 802 四向 803 六向串联，与 chain_top_keys / chain_top_keys_contract_729 及 804 八向互证；806：805 八向互证与 GET /meta chain.rule 及 CHAIN_META_TOP_KEYS 第三键 rule 机读同源，九向收束 805 链读至根级 chain.rule 文首与 intents EIP-712 domain、NEXT_PUBLIC_CHAIN_ID、ChainConfig、759 句及 contracts.rule 759 嵌入与 801 三向 802 四向 803 六向 804 七向 805 八向串联，与 chain_top_keys / chain_top_keys_contract_729 及 805 九向互证；728 GET /meta 根级 meta_top_keys / meta_top_keys_contract_728 与 META_ROOT_TOP_KEYS 三十六键顺序同源；729 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 与 CHAIN_META_TOP_KEYS 五键顺序同源"
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
                            "；759 GET /meta chain.contracts 对象 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 与 CHAIN_CONTRACTS_META_TOP_KEYS 十二键顺序同源",
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

    let mut orders_section = json!({
        "strict_db_write": env::var("TRAVELTRUST_STRICT_ORDER_DB_WRITE").as_deref() == Ok("1"),
        "dual_write_order": "when DATABASE_URL set: handlers mutate in-memory order row first then try_persist_order_to_db (strict TRAVELTRUST_STRICT_ORDER_DB_WRITE) or persist_order_if_db best-effort via db::upsert_order; strict upsert failure → revert memory order → 503 order_db_persist_failed; non-strict logs [audit] db upsert_order failed and may leave DB lagging memory",
        "rule": "upsert_order after state transitions (create, escrow addr, accept, cancel, mock pay, confirm completion, bilateral/rating confirm, open-dispute order row): on failure revert memory → 503 order_db_persist_failed; chain_off/mod.rs try_persist_order_to_db/persist_order_if_db 与 chain_off/orders.rs、orders_flow/* 双写与 TRAVELTRUST_STRICT_ORDER_DB_WRITE 同源；744 GET /meta orders 对象 orders_top_keys / orders_top_keys_contract_744 与 ORDERS_META_TOP_KEYS 七键顺序同源（含 fee_route_country_ssot，B-083）",
        "list_pagination": "GET /api/v1/orders: omit limit = full list (legacy); limit=1..100 with optional cursor (last item id from prior page) returns items + page.next_cursor/has_more; sort updated_at desc, id desc when paginated",
        "fee_route_country_ssot": format!(
            "GET /api/v1/orders/:id: when itinerary bundle present, order.fee_route_country from SSOT field `{}` (zh product country name → iso3166_alpha2 + bucket_route_key country_pool_<iso_lower> aligned to 84; unmapped/empty → reject with code, no silent default pool; on-chain MVP FeeRouter still single countryBucket) (B-083)",
            FEE_ROUTE_COUNTRY_SSOT_FIELD
        ),
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

    let mut product_countries_section = json!({
        "strict_db_write": false,
        "dual_write_order": "GET /meta product_countries is a compile-time snapshot: traveltrust_core::PRODUCT_COUNTRY_CODES and PRODUCT_COUNTRY_NAMES_ZH (same-length parallel arrays); meta handler does not persist this block; POST /guides country_code and POST /itineraries* validators read the same core product_countries lists",
        "rule": "产品期十国锁死：POST /api/v1/guides `country_code` 须为 iso3166_alpha2；POST /api/v1/itineraries/custom 的 `country` 须为 name_zh（中文国家名）。POST /api/v1/itineraries 的 `destination` 须为允许的中文国家名（`is_allowed_zh_destination_country`，与 `name_zh` 一致；非法 → `invalid_destination_country`）；`city`/`cities[]` 须为该国预设城市（`preset_cities`）。与 `traveltrust_core::product_countries`、`frontend/lib/productCountries.ts`、44/54 一致；746 GET /meta product_countries 对象 product_countries_top_keys / product_countries_top_keys_contract_746 与 PRODUCT_COUNTRIES_META_TOP_KEYS 七键顺序同源",
        "iso3166_alpha2": traveltrust_core::PRODUCT_COUNTRY_CODES,
        "name_zh": traveltrust_core::PRODUCT_COUNTRY_NAMES_ZH,
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
        "request_timeout_secs": middleware::REQUEST_TIMEOUT_SECS,
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
async fn metrics(State(state): State<ApiMetaState>) -> impl IntoResponse {
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

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/health", get(health))
        .route("/meta", get(meta))
        .route("/meta/build", get(meta_build_only))
        .route("/metrics", get(metrics))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use std::collections::VecDeque;
    use std::sync::{Arc, Mutex};
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
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
        assert_eq!(META_ROOT_TOP_KEYS[34], "meta_top_keys");
        assert_eq!(META_ROOT_TOP_KEYS[35], "meta_top_keys_contract_728");
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
        assert_eq!(ORDERS_META_TOP_KEYS[5], "orders_top_keys");
        assert_eq!(ORDERS_META_TOP_KEYS[6], "orders_top_keys_contract_744");
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
            36,
            "META_ROOT_TOP_KEYS length (799 dual-anchor closure)"
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
            META_ROOT_TOP_KEYS[31], "idempotency_cache",
            "META_ROOT_TOP_KEYS thirty-second key (793 cross-link)"
        );
        assert_eq!(
            META_ROOT_TOP_KEYS[32], "defaults",
            "META_ROOT_TOP_KEYS thirty-third key (794 cross-link)"
        );
        assert_eq!(
            META_ROOT_TOP_KEYS[33], "outbox",
            "META_ROOT_TOP_KEYS thirty-fourth key (795 cross-link)"
        );
        assert_eq!(
            META_ROOT_TOP_KEYS[34], "meta_top_keys",
            "META_ROOT_TOP_KEYS thirty-fifth key (796 cross-link)"
        );
        assert_eq!(
            META_ROOT_TOP_KEYS[35], "meta_top_keys_contract_728",
            "META_ROOT_TOP_KEYS thirty-sixth key (797 cross-link)"
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

    async fn spawn_mock_jsonrpc_eth_call_two(results: [&'static str; 2]) -> String {
        let queue = Arc::new(Mutex::new(VecDeque::from([
            results[0].to_string(),
            results[1].to_string(),
        ])));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind mock rpc");
        let addr = listener.local_addr().expect("mock rpc addr");
        let (ready_tx, ready_rx) = tokio::sync::oneshot::channel::<()>();
        let q = Arc::clone(&queue);
        tokio::spawn(async move {
            let _ = ready_tx.send(());
            for _ in 0..2 {
                let Ok((mut socket, _)) = listener.accept().await else {
                    break;
                };
                let mut buf = [0u8; 16384];
                let Ok(n) = socket.read(&mut buf).await else {
                    continue;
                };
                if n == 0 {
                    continue;
                }
                let _ = &buf[..n];
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

    /// **TT-COMP-B091**：mock JSON-RPC **`eth_call`** 返回 ABI 编码 **`bool`**，**`meta_pause_chain_snapshot`** 与 fixture 一致。
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
}
