# D-COM-001

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg`
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · GET /community/feed includes created post (D-COM-001 feed surface)
