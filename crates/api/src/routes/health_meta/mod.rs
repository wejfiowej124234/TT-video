//! /health, /meta, /meta/build, /metrics（48 §2.2 routes/health_meta）
//! TT-MOD-B3-02：生产代码目录分段（行为与路由不变）。
//! TT-MOD-B3-03：与 `community` 对齐装配层（出口分组注释；行为不变）。

mod handlers;
mod meta_build;
mod meta_contract_keys;
mod meta_helpers;
mod pause_chain;
mod router;

// 对外：根级 `/health` `/meta` `/meta/build` `/metrics`（`routes/mod.rs` `merge(health_meta::router())`）
pub use router::router;

// 对外：`build` / startup / internal 嵌入同源
pub use meta_build::{meta_build_for_startup_log, meta_build_value};

// crate 内：`tests` `use super::*`、机读键、B091 快照等再导出
pub use serde_json::json;
pub(crate) use meta_build::meta_build_snapshot;
pub(crate) use meta_contract_keys::*;
pub(crate) use meta_helpers::*;
pub(crate) use pause_chain::{b091_evm_selector, meta_pause_chain_snapshot};

#[cfg(test)]
mod tests;
