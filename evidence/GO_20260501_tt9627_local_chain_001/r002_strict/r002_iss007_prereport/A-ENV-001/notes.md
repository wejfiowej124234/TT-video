# A-ENV-001

`cargo test -p traveltrust-api matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg` exit=0

```

running 1 test
test routes::internal_indexer_admin_db_api_tests::matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 856 filtered out; finished in 0.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.20s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-d6d848f99f582d3a.exe)
[req] x-request-id=a82951ad-ecc2-4979-a24a-62fb82bdd62a path=/health status=200
[req] x-message-id=2b10f7c3-370f-4c4f-94d1-348cec419e1d path=/health status=200
[req] x-request-id=3ee8e5ad-95b7-4dfc-80a0-8eea8e05193b path=/meta status=200
[req] x-message-id=5ea29bc7-159e-4975-b6b6-cf5801a06cb6 path=/meta status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · GET /health returns ok and GET /meta includes build api_version database
