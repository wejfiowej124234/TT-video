# A-ENV-001

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg`
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
