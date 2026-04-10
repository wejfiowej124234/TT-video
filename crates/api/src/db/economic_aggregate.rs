//! 经济投影 **只读聚合**（B-084 / **TT-B084-FEE-POOL-AGGREGATES-DB-SOURCES-001**）：**`fetch_fee_router_for_aggregate`** / **`fetch_region_vault_for_aggregate`** 分别读 **`fee_router_routed_events`**、**`region_vault_forwarded_events`**，供 **`GET /api/v1/governance/fee-pool-aggregates`** **`build_fee_pool_aggregate_body`** Σ。
//!
//! **B110-SSOT-07**：本模块产出的 **`fee-pool-aggregates`** JSON **根级**不得与 **`GET …/governance/pool`** 的链上主读键混用；见 **`assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys`**。
//!
//! **B-115-5**：**Snapshot / 链下 Claim 登记 / 投资者分配 Σ** 与 **`fee-pool-aggregates`**、**`governance/pool`** **正交** — 见 **`assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution`**、**`assert_governance_pool_root_not_aliases_fee_pool_aggregates`**。

use serde_json::Value;
use sqlx::postgres::PgPool;

/// **`GET …/governance/fee-pool-aggregates`** 成功体使用的 **`ssot`/`rule_version`/`anchor`** 字面量（供 **`governance/pool`** 反冒充断言）。
pub const FEE_POOL_AGGREGATES_SSOT_LITERAL: &str =
    "fee_router_routed_events+region_vault_forwarded_events";
pub const FEE_POOL_AGGREGATES_RULE_VERSION: &str = "fee_pool_aggregates_projection_v1";
pub const FEE_POOL_AGGREGATES_ANCHOR_SUBSTR: &str = "FEE-POOL-AGGREGATES";

/// **`fee-pool-aggregates`** 响应根对象不得携带 **`governance/pool`** 的链上 SSOT / 对齐提示键（B110-SSOT-07、04 §3.4 叙事）。
pub fn assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(v: &Value) {
    let Some(obj) = v.as_object() else {
        panic!("fee-pool-aggregates body must be a JSON object");
    };
    const FORBIDDEN: &[&str] = &[
        "pool_balance",
        "currency",
        "updated_at",
        "is_chain_ssot",
        "chain_alignment_hint",
        "country_pool",
        "country_pool_data_source",
        "country_pool_is_chain_ssot",
        "treasury_pool",
        "treasury_pool_data_source",
        "treasury_pool_is_chain_ssot",
        "treasury_erc20_pool",
        "treasury_erc20_pool_data_source",
        "treasury_erc20_pool_is_chain_ssot",
    ];
    for k in FORBIDDEN {
        assert!(
            !obj.contains_key(*k),
            "fee-pool-aggregates root must not contain governance/pool chain SSOT key `{0}` (B110-SSOT-07)",
            k
        );
    }
}

/// **`fee-pool-aggregates`** 根级 **不得** 携带 **RegionShare 快照表 / 投资者分配登记 / Claim** 语义键，以免与 **B-115-1 / B-115-3 / B-115-2** 混名。
pub fn assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(v: &Value) {
    let Some(obj) = v.as_object() else {
        panic!("fee-pool-aggregates body must be a JSON object");
    };
    const FORBIDDEN: &[&str] = &[
        "region_share_snapshot_lines",
        "region_share_snapshot",
        "investor_distribution_register",
        "register_accrual",
        "distribution_bytes32_hex",
        "distribution_register",
        "claimable",
        "entitled",
        "claimed",
        "accrual_registration",
        "snapshot_lines",
    ];
    for k in FORBIDDEN {
        assert!(
            !obj.contains_key(*k),
            "fee-pool-aggregates root must not contain Snapshot/Claim/distribution key `{0}` (B-115-5 orthogonal to B-115-1/2/3)",
            k
        );
    }
}

/// **`GET …/governance/pool`** 成功体 **不得** 复用 **`fee-pool-aggregates`** 的 **Σ 投影** 标识（防根级冒充）。
pub fn assert_governance_pool_root_not_aliases_fee_pool_aggregates(v: &Value) {
    let Some(obj) = v.as_object() else {
        panic!("governance/pool body must be a JSON object");
    };
    if let Some(rv) = obj.get("rule_version").and_then(|x| x.as_str()) {
        assert_ne!(
            rv,
            FEE_POOL_AGGREGATES_RULE_VERSION,
            "governance/pool must not reuse fee-pool-aggregates rule_version (B-115-5)"
        );
    }
    if let Some(s) = obj.get("ssot").and_then(|x| x.as_str()) {
        assert_ne!(
            s,
            FEE_POOL_AGGREGATES_SSOT_LITERAL,
            "governance/pool must not reuse fee-pool-aggregates ssot string (B-115-5)"
        );
    }
    if let Some(a) = obj.get("anchor").and_then(|x| x.as_str()) {
        assert!(
            !a.contains(FEE_POOL_AGGREGATES_ANCHOR_SUBSTR),
            "governance/pool anchor must not contain fee-pool-aggregates marker substring (B-115-5)"
        );
    }
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct FeeRouterAggregateSourceRow {
    pub token_address: String,
    pub amount_u256_hex: String,
    pub to_country_u256_hex: String,
    pub to_stakers_u256_hex: String,
    pub to_reserve_u256_hex: String,
    pub to_ops_u256_hex: String,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct RegionVaultAggregateSourceRow {
    pub token_address: String,
    pub to_address: String,
    pub amount_u256_hex: String,
}

pub async fn fetch_fee_router_for_aggregate(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<Vec<FeeRouterAggregateSourceRow>, sqlx::Error> {
    sqlx::query_as::<_, FeeRouterAggregateSourceRow>(
        r#"
        SELECT
            token_address,
            amount_u256_hex,
            to_country_u256_hex,
            to_stakers_u256_hex,
            to_reserve_u256_hex,
            to_ops_u256_hex
        FROM fee_router_routed_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        ORDER BY token_address ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

pub async fn fetch_region_vault_for_aggregate(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<Vec<RegionVaultAggregateSourceRow>, sqlx::Error> {
    sqlx::query_as::<_, RegionVaultAggregateSourceRow>(
        r#"
        SELECT token_address, to_address, amount_u256_hex
        FROM region_vault_forwarded_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        ORDER BY token_address ASC, to_address ASC
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn assert_fee_pool_root_excludes_governance_pool_keys_accepts_projection_like_body() {
        let v = json!({
            "status": "ok",
            "data_source": "projection",
            "ssot": "fee_router_routed_events+region_vault_forwarded_events",
            "chain_id_filter": null,
            "fee_router": { "by_token": [], "note": "n" },
            "region_vault": { "by_token": [], "note": "n" },
            "cross_check": {},
            "rule_version": "fee_pool_aggregates_projection_v1",
            "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION"
        });
        assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    }

    #[test]
    #[should_panic(expected = "pool_balance")]
    fn assert_fee_pool_root_rejects_pool_balance_alias() {
        let v = json!({
            "status": "ok",
            "data_source": "projection",
            "pool_balance": "0x1",
            "fee_router": { "by_token": [] },
            "region_vault": { "by_token": [] }
        });
        assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    }

    #[test]
    fn assert_fee_pool_b1155_accepts_canonical_projection_body() {
        let v = json!({
            "status": "ok",
            "data_source": "projection",
            "ssot": FEE_POOL_AGGREGATES_SSOT_LITERAL,
            "chain_id_filter": null,
            "fee_router": { "by_token": [] },
            "region_vault": { "by_token": [] },
            "cross_check": {},
            "rule_version": FEE_POOL_AGGREGATES_RULE_VERSION,
            "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION"
        });
        assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    }

    #[test]
    #[should_panic(expected = "region_share_snapshot_lines")]
    fn assert_fee_pool_b1155_rejects_snapshot_table_key_at_root() {
        let v = json!({
            "status": "ok",
            "region_share_snapshot_lines": [],
            "fee_router": { "by_token": [] },
            "region_vault": { "by_token": [] }
        });
        assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    }

    #[test]
    fn assert_governance_pool_b1155_accepts_chain_ssot_shape() {
        let v = json!({
            "status": "ok",
            "pool_balance": "0x1",
            "currency": "0xtok",
            "updated_at": null,
            "data_source": "chain_read",
            "is_chain_ssot": true,
            "rule_version": "governance_pool_v1",
            "chain_alignment_hint": {}
        });
        assert_governance_pool_root_not_aliases_fee_pool_aggregates(&v);
    }

    #[test]
    #[should_panic(expected = "fee-pool-aggregates rule_version")]
    fn assert_governance_pool_b1155_rejects_fee_pool_rule_version() {
        let v = json!({
            "status": "ok",
            "pool_balance": "0x1",
            "rule_version": FEE_POOL_AGGREGATES_RULE_VERSION
        });
        assert_governance_pool_root_not_aliases_fee_pool_aggregates(&v);
    }
}
