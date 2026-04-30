# D-COM-001C

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg`
E2E: `frontend/e2e/f012-f013-f014-request.spec.ts` — F-014 · POST tagged post then GET feed?tag includes same post id
