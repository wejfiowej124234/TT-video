# D-ITN-001B

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg`
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-012 · POST /api/v1/itineraries creates draft + order_id
