# A-ENV-001

`cargo test -p traveltrust-api matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=c2b9a2bc-b328-4df5-855f-7cd5bb3dd2e7 path=/health status=200
[req] x-message-id=b7fa53a1-642a-46a3-8422-37685ac7918f path=/health status=200
[req] x-request-id=14a94114-2119-4d18-8759-7586aa933e37 path=/meta status=200
[req] x-message-id=b66cd2ef-86ef-4bfb-b64e-aa44d5b3e22f path=/meta status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
