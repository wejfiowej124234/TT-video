# D-ADM-003

DATABASE_URL unset; run after `docker compose up -d postgres` + `sqlx migrate run --source crates/api/migrations`.

Rust filter: `matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg`
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)
