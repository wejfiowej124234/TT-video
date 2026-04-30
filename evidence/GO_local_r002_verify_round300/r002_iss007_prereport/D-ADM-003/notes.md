# D-ADM-003

`cargo test -p traveltrust-api matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=0a847102-afd7-4926-91b3-04ca0ae10291 path=/api/v1/admin/schema/migrations status=200
[req] x-message-id=e32548c7-84c4-4f7b-8a99-5614126c1642 path=/api/v1/admin/schema/migrations status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)
