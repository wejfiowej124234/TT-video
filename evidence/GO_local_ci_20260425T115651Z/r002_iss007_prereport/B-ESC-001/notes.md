# B-ESC-001

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg`
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
