//! Admin observability **`GET …/observability/overview`**（大块 SSOT 装配；与 **04 §3.5** 同源）。

mod handler;
mod indexer_ssot_head;
mod reconcile_snapshots;

pub use handler::get_admin_observability_overview;
