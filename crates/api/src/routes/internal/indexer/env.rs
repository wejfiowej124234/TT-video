pub(super) fn indexer_reorg_auto_rewind_on_tick_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_AUTO_REWIND_ON_TICK").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

/// `INDEXER_STRICT_SUPPLEMENTAL_LOG_FETCH=1`：**escrow 实例列表** / **FeeRouter** / **RegionVault** 的补充 `eth_getLogs` 任一步失败则 **500** **`fetch_supplemental_logs_failed`**（默认仍 **200** 并在体中附 **`logs_fetch_skipped`**）。
pub(super) fn indexer_strict_supplemental_log_fetch_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_STRICT_SUPPLEMENTAL_LOG_FETCH").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

pub(super) fn indexer_reorg_skip_chain_off_order_reload() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND").as_deref(),
        Ok(v) if v.trim() == "0"
    )
}

pub(super) fn indexer_reorg_sync_orders_from_projection_after_rewind_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}

pub(super) fn indexer_reorg_clear_terminal_orphan_escrow_enabled() -> bool {
    matches!(
        std::env::var("INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL").as_deref(),
        Ok(v) if v.trim() == "1"
    )
}
