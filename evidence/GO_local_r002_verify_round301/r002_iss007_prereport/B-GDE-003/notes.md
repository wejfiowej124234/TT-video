# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=443ba210-9db5-4b93-8525-62fb7c04bb92 path=/api/v1/guides status=200
[req] x-message-id=9a5b6314-e652-4bca-977e-22793b7d8d56 path=/api/v1/guides status=200
[req] x-request-id=ae2b18a6-b7ef-4ff4-b510-c4a1a5c2d68d path=/api/v1/guides/1877d77c-26f0-4297-8129-bbc1065848f1/stake status=200
[req] x-message-id=4649e681-f768-4bbe-8f73-1fb7a3b42ef0 path=/api/v1/guides/1877d77c-26f0-4297-8129-bbc1065848f1/stake status=200
[req] x-request-id=68f44ca3-88fa-46a4-843e-883050149534 path=/api/v1/guides status=200
[req] x-message-id=27822c82-5c37-443c-b455-32a45de1bdba path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
