# B-MKT-006

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg`
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-022 · POST acquisition listing then GET catalog includes id
