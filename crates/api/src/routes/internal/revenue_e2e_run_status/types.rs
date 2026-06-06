//! Query 与 **B-404** 响应 **`anchor`** / summary 键常量。
use serde::Deserialize;

pub const REVENUE_E2E_RUN_STATUS_ANCHOR: &str = "404-REVENUE-E2E-RUN-STATUS-V1";

pub const KEY_383: &str = "fee_router_platform_fee_routed_log_count_chain_vs_db_observability";
pub const KEY_386: &str = "revenue_pipeline_log_count_chain_vs_db_bundle_observability";

pub const MANIFEST_MAX: usize = 10 * 1024 * 1024;

#[derive(Debug, Deserialize)]
pub struct RevenueE2eRunStatusQuery {
    /// **L0** **`b403_round.run_id`** / **`b405_round.run_id`**（**UUID**）
    pub run_id: String,
}
