# D-ADM-003

`cargo test -p traveltrust-api matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 856 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.20s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-d6d848f99f582d3a.exe)
[req] x-request-id=8566cffc-6965-4fce-991a-e97c38e85355 path=/api/v1/admin/schema/migrations status=200
[req] x-message-id=44892278-9ee7-4411-bbe2-6edba706dd30 path=/api/v1/admin/schema/migrations status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)
