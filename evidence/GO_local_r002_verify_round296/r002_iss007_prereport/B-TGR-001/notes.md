# B-TGR-001

`cargo test -p traveltrust-api matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=9c5c3fdc-51cd-4b03-ad50-dd28b9b5373a path=/api/v1/trust-growth/config status=200
[req] x-message-id=7b307c14-5774-4bc2-9d74-6b9cc0b65391 path=/api/v1/trust-growth/config status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-032 · GET trust-growth/config returns ok + postgres storage hint
