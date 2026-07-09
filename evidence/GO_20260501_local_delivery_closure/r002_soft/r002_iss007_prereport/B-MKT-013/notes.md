# B-MKT-013

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg`
E2E: `frontend/e2e/f018-f019-f020-request.spec.ts` — F-020 · order+guide bookmarks then invalid listing POST preserves both lists
