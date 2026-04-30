# A-ENV-001

`cargo test -p traveltrust-api matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.04s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b5766cc9-21aa-4a0e-9200-775c934fd40a path=/health status=200
[req] x-message-id=66a0d96d-3136-47a7-aed2-b4ce2cfcf549 path=/health status=200
[req] x-request-id=c5b99cd6-8e8d-4601-9993-7c88bfaa2bcd path=/meta status=200
[req] x-message-id=bf0f883c-f120-4df3-8a78-c5bf61ad990a path=/meta status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
