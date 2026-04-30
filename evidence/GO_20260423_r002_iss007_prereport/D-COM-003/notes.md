# D-COM-003

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg`
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
