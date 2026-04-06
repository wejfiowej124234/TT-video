//! 经济投影 **只读聚合**（B-084）：`fee_router_routed_events` + `region_vault_forwarded_events`。

use sqlx::postgres::PgPool;

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
