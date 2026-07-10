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

// TT-MOD · 93 matrix B-domain PG app-stack (ISS-007 / R-002).
#[cfg(test)]
#[path = "orders_create_list_set_escrow_address_db_api_tests/mod.rs"]
mod orders_create_list_set_escrow_address_db_api_tests;

#[cfg(test)]
#[path = "orders_accept_mock_pay_itinerary_confirm_db_api_tests/mod.rs"]
mod orders_accept_mock_pay_itinerary_confirm_db_api_tests;
