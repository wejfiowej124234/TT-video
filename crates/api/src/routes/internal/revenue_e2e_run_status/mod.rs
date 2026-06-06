//! **B-404 / B-405**：**`GET …/internal/revenue-e2e-run-status`** — 按 **`run_id`** **只读** **聚合** **L0** **留证** **（** **`b403-run-manifest.jsonl`** **/** **`b405-run-manifest.jsonl`** **）** **与** **DB** **快照** **（** **orders** **计数** **、** **最新** **`reconciliation_reports.summary`** **中** **B-383/B-386** **键** **；** **L2** **`orders_row_excerpt`** **）** **。
//!
//! **不** **把** **`run_id`** **写入** **`orders`** **；** **DB** **段** **显式** **标注** **与** **`run_id`** **无** **FK** **关联** **。
//!
//! **48 v1.51**：由单文件 **`revenue_e2e_run_status.rs`** 拆为 **`revenue_e2e_run_status/`**（**`types`/`manifest`/`db_excerpt`/`handler`/`tests`**）；**`internal/mod.rs`** **`.route`** **`GET /api/v1/internal/revenue-e2e-run-status`**（与 **Runbook B-404**/**母表**/**04** 叙事一致；**HTTP/JSON 不变**）。

mod db_excerpt;
mod handler;
mod manifest;
mod types;

#[cfg(test)]
mod tests;

pub use handler::get_revenue_e2e_run_status;
