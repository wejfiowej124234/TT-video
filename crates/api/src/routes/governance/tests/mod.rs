//! **`governance`** 契约测（**48 STRICT**：子文件各 ≤400）。
//!
//! 自 **`tests.rs`** 按场景拆分；**`governance::router()`** / **`pub use`** 不变。

mod fee_pool_aggregates;
mod fee_routes;
mod helpers;
mod pool_chain_protocol_params;
mod pool_rewards_params_proposals;
mod vault_forwards;
