# D-ADM-003

`cargo test -p traveltrust-api matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=c75cd699-c8a7-45d8-a795-f9a99afefd02 path=/api/v1/admin/schema/migrations status=200
[req] x-message-id=8686d55c-621f-4eba-b603-25fa0bdc2849 path=/api/v1/admin/schema/migrations status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-030 · tourist Bearer cannot GET admin schema migrations (403 admin_required)
