# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5881917e-ae79-4ca7-a1a7-598b6454615b path=/api/v1/guides status=200
[req] x-message-id=f90da44c-fc92-48b9-8279-8d043a52a54f path=/api/v1/guides status=200
[req] x-request-id=11537885-73d3-4dcb-a679-7ba23ed17a97 path=/api/v1/guides/780b98a9-b772-4658-8029-890d700f0664/stake status=200
[req] x-message-id=4e7360d4-08f2-4623-9f66-d578d4026734 path=/api/v1/guides/780b98a9-b772-4658-8029-890d700f0664/stake status=200
[req] x-request-id=3f9cbbe9-c6c0-4668-9128-c3fde3adbfa9 path=/api/v1/guides status=200
[req] x-message-id=f717a60a-931c-47f6-87e2-12af7bb184c1 path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
