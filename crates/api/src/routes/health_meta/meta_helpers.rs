//! GET `/meta` 小块 JSON 与 did_rank 辅助。

use serde_json::json;

pub fn block_hash_prefix_json(hash: &str) -> serde_json::Value {
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
pub fn did_rank_guides_community_penalty_exclusion(
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
pub fn product_roles_meta_obs_json() -> serde_json::Value {
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
pub fn auth_registration_meta_obs_json() -> serde_json::Value {
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
