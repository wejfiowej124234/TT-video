# A-ENV-001

`cargo test -p traveltrust-api matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=e85b56ec-7201-481b-abba-978e3afadbec path=/health status=200
[req] x-message-id=eb9349d8-5243-4d10-a9e9-fe7fc1da3c38 path=/health status=200
[req] x-request-id=977a814c-2951-40f1-b3f0-3d5783437246 path=/meta status=200
[req] x-message-id=0456150d-2e29-4873-8428-3635d14bc885 path=/meta status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
