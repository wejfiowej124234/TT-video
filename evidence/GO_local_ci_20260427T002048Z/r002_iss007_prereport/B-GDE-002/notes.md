# B-GDE-002

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg`
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
