use serde_json::Value;

use crate::chain;
use crate::state::ApiMetaState;

/// Per-log context after `append_event_and_advance_checkpoint` reports `inserted == true`.
pub(crate) struct TickInsertedCtx<'a> {
    pub state: &'a ApiMetaState,
    pub config: &'a chain::ChainConfig,
    pub latest: u64,
    pub block_number: u64,
    pub log_index: u32,
    pub block_hash: &'a str,
    pub tx_hash: &'a str,
    pub kind: &'a str,
    pub data_for_fee_parse: &'a Value,
    pub topics: &'a [String],
    pub log_address: &'a str,
}
