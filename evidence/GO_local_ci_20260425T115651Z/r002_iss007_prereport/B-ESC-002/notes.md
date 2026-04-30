# B-ESC-002

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg`
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
