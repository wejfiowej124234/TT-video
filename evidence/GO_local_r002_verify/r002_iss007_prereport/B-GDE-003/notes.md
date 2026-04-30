# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=87a03b85-249c-4e41-abb0-2136f018dcd1 path=/api/v1/guides status=200
[req] x-message-id=1b6fc5a1-c378-4985-8683-09de34a14427 path=/api/v1/guides status=200
[req] x-request-id=0888397e-5178-496c-9ec4-faa4560edef6 path=/api/v1/guides/38c754ff-3767-472d-9a4e-05f582849397/stake status=200
[req] x-message-id=7685fab6-65b8-4471-8ec5-1a6fefaa02a3 path=/api/v1/guides/38c754ff-3767-472d-9a4e-05f582849397/stake status=200
[req] x-request-id=1199c5f1-79ff-47d9-9df9-373d00b08b39 path=/api/v1/guides status=200
[req] x-message-id=3de5436f-e031-4108-a391-7731913688df path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
