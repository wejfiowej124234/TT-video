//! 执行器 outbox：裁决写 DB 后入队，消费时调用 chain::submit_execute_resolution（01 §7 P0、P5-4）

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// 单条待执行裁决（resolutionId 幂等，01 §7）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ResolutionOutboxEntry {
    pub order_id: String,
    pub escrow_address: String,
    pub resolution_id: [u8; 32],
    pub decision_hash: [u8; 32],
    pub guide_amount: u128,
    pub traveler_refund: u128,
    pub platform_fee: u128,
}

/// 内存版 outbox 队列（生产可换为 DB/文件/Redis）
pub type ResolutionOutbox = Arc<RwLock<Vec<ResolutionOutboxEntry>>>;

pub fn new_resolution_outbox() -> ResolutionOutbox {
    Arc::new(RwLock::new(Vec::new()))
}

/// 裁决写入 DB 后调用此方法入队（链上模式；chain_off 不调用）
pub async fn push_resolution(outbox: &ResolutionOutbox, entry: ResolutionOutboxEntry) {
    outbox.write().await.push(entry);
}

/// 执行器消费一条：校验单笔额度（01 §7 P0）、重试发 tx（04 §五），成功则移除
/// 返回 (processed_count, tx_hash_or_error)
pub async fn process_one(
    outbox: &ResolutionOutbox,
    config: &super::ChainConfig,
) -> Option<(usize, Result<String, String>)> {
    let entry = {
        let g = outbox.write().await;
        let e = g.first().cloned()?;
        drop(g);
        e
    };
    let total = entry.guide_amount + entry.traveler_refund + entry.platform_fee;
    if let Some(max) = config.executor_max_amount_per_tx {
        if total > max {
            return Some((
                0,
                Err(format!(
                    "executor_max_amount_per_tx exceeded: {} > {}",
                    total, max
                )),
            ));
        }
    }
    let mut result = super::submit_execute_resolution(
        config,
        &entry.escrow_address,
        entry.resolution_id,
        entry.decision_hash,
        entry.guide_amount,
        entry.traveler_refund,
        entry.platform_fee,
    )
    .await;
    for _ in 0..config.executor_retry_count {
        if result.is_ok() {
            break;
        }
        result = super::submit_execute_resolution(
            config,
            &entry.escrow_address,
            entry.resolution_id,
            entry.decision_hash,
            entry.guide_amount,
            entry.traveler_refund,
            entry.platform_fee,
        )
        .await;
    }
    if result.is_ok() {
        outbox.write().await.remove(0);
    }
    Some((1, result))
}
