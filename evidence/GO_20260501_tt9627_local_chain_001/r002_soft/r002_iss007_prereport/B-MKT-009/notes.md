# B-MKT-009

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg`
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-021 · POST provider listing then GET listing detail matches id
