use serde_json::Value;
use sqlx::postgres::PgPool;

use crate::db::{
    event_log_max_block_number_for_chain, fee_router_routed_stats, p5_country_ledger_lines_stats,
    region_vault_forwarded_stats,
};

use super::v1::revenue_pipeline_spread_dual_slack_triangulation_observability_v1;

/// **异步** **：** **三** **表** **stats** **+** **`event_log`** **max** **+** **checkpoint** **。**
pub async fn revenue_pipeline_spread_dual_slack_triangulation_observability(
    pool: &PgPool,
    expected_chain_id: i64,
    indexer_checkpoint_block_number: u64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        fee_router_routed_stats(pool, Some(expected_chain_id)),
        region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    let el = event_log_max_block_number_for_chain(pool, expected_chain_id).await?;
    Ok(
        revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            expected_chain_id,
            fr.total,
            fr.max_block_number,
            rv.total,
            rv.max_block_number,
            p5.total,
            p5.max_block_number,
            el,
            indexer_checkpoint_block_number,
        ),
    )
}
