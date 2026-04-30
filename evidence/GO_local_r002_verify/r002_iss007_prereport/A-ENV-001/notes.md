# A-ENV-001

`cargo test -p traveltrust-api matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.04s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=36d0bff8-5eeb-44f9-898d-1270e3f67c0e path=/health status=200
[req] x-message-id=3c837572-3a0b-4185-bfd1-dfed25ef69ff path=/health status=200
[req] x-request-id=7c221573-c46d-474a-a6c2-a1d02122eeee path=/meta status=200
[req] x-message-id=de8fcb89-1d53-465c-b76a-6d8f3a2beb8a path=/meta status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
