//! Order route tests (TT-MOD-B1-04: 自 `orders/mod.rs` 外置，语义不变).

mod apply_event_log_fields_tests;
mod concurrent_review_submit_negative;
mod confirm_completion_negative;
mod duplicate_confirm_completion_negative;
mod duplicate_review_submit_negative;
mod review_json_contract_evolution_b451;
mod review_submit_db_pool_idempotent_contract;
mod review_weight_dual_path_parity_b447;
mod review_weight_json_contract_b449;
mod suite;
