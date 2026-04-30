# D-ADM-003

`cargo test -p traveltrust-api matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5636d878-34f7-4bac-a7d6-8dc47c34a338 path=/api/v1/admin/schema/migrations status=200
[req] x-message-id=20f69afa-d590-4b7d-b233-b9a10e7ae430 path=/api/v1/admin/schema/migrations status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)
