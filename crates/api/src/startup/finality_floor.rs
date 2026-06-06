//! **110 §3.3**：链上索引就绪时可选强制 `FINALITY_N` 下限（48 自 `run.rs` 拆出）。

use crate::chain;

/// **`CHAIN_RPC_URL`** + 非空 **`ESCROW_FACTORY_ADDRESS`** 时索引器将跑 `indexer-tick`；可选拒绝 **`FINALITY_N`** 低于运维下限，避免误配抢跑。
pub(crate) fn enforce_indexer_finality_floor(
    finality_n: u64,
    chain_cfg: &Option<chain::ChainConfig>,
    indexer_min_finality_n: Option<u64>,
    strict_indexer_finality: bool,
) -> Result<(), String> {
    const DEFAULT_MIN_WHEN_STRICT: u64 = 12;
    let indexer_ready = chain_cfg.as_ref().is_some_and(|c| {
        c.is_configured()
            && c.escrow_factory_address
                .as_deref()
                .map(|s| !s.trim().is_empty())
                .unwrap_or(false)
    });
    if !indexer_ready {
        return Ok(());
    };    let threshold = indexer_min_finality_n
        .map(|m| m.max(1))
        .or_else(|| strict_indexer_finality.then_some(DEFAULT_MIN_WHEN_STRICT.max(1)));
    if let Some(t) = threshold {
        if finality_n < t {
            return Err(format!(
                "FINALITY_N={finality_n} < required {t} (INDEXER_MIN_FINALITY_N or STRICT_INDEXER_FINALITY=1; CHAIN_RPC_URL+ESCROW_FACTORY_ADDRESS configured; 110 §3.3)"
            ));
        }
    }
    Ok(())
}
