# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=12698d69-a7de-4ae3-b0c6-bb02b7c0a2b9 path=/api/v1/guides status=200
[req] x-message-id=6d4d8d90-714d-44d2-9149-ae214ac505b6 path=/api/v1/guides status=200
[req] x-request-id=b878c3eb-6e24-4e2a-a0e1-4743bcee6357 path=/api/v1/guides/82fedb52-fbc8-44c7-a83b-fef59155211f/stake status=200
[req] x-message-id=3177a4ae-8f40-4dd5-abfc-d120c7a9adb7 path=/api/v1/guides/82fedb52-fbc8-44c7-a83b-fef59155211f/stake status=200
[req] x-request-id=04b3f1aa-07dc-457c-b2fe-ee3550209087 path=/api/v1/guides status=200
[req] x-message-id=db71aeb4-0998-45a2-be7a-066414bc704c path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
