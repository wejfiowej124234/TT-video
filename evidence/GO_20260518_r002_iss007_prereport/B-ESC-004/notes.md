# B-ESC-004

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg`
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
