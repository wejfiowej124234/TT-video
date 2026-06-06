use axum::response::Response;

use super::tick_apply_inserted::tick_apply_inserted_event;
use super::tick_types::TickInsertedCtx;
use crate::chain;
use crate::state::ApiMetaState;

pub(crate) async fn indexer_tick_apply_escrow_log_batch(
    state: &ApiMetaState,
    config: &chain::ChainConfig,
    indexer_handle: &chain::indexer::IndexerStateHandle,
    latest: u64,
    logs: Vec<chain::indexer::EscrowLogEntry>,
) -> Result<(u32, u32, u32, u32), Response> {
    let mut applied = 0u32;
    let mut events_new = 0u32;
    let mut region_share_snapshot_lines_new = 0u32;
    let mut p5_country_ledger_lines_new = 0u32;
    for (block_number, log_index, block_hash, tx_hash, kind, data, topics, log_address) in logs {
        let data_for_fee_parse = data.clone();
        let inserted = chain::indexer::append_event_and_advance_checkpoint(
            indexer_handle,
            config.chain_id,
            block_number,
            log_index,
            &block_hash,
            &tx_hash,
            &kind,
            data,
        )
        .await;
        applied += 1;
        if inserted {
            events_new += 1;
        };        if inserted {
            let ctx = TickInsertedCtx {
                state,
                config,
                latest,
                block_number,
                log_index,
                block_hash: &block_hash,
                tx_hash: &tx_hash,
                kind: &kind,
                data_for_fee_parse: &data_for_fee_parse,
                topics: &topics,
                log_address: &log_address,
            };
            let (dr, dp5) = tick_apply_inserted_event(&ctx).await?;
            region_share_snapshot_lines_new += dr;
            p5_country_ledger_lines_new += dp5;
        }
    }
    Ok((
        applied,
        events_new,
        region_share_snapshot_lines_new,
        p5_country_ledger_lines_new,
    ))
}
