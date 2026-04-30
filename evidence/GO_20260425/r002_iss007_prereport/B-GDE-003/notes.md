# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=81613778-b321-4c2b-a2de-752768a5b89b path=/api/v1/guides status=200
[req] x-message-id=37ab05d3-8403-4788-bd80-0e8eeb799dea path=/api/v1/guides status=200
[req] x-request-id=646c89aa-9aea-481f-ad51-3c8cb5fea2cf path=/api/v1/guides/5b923fec-f1a8-4f4a-95d1-04a6f65a7bc5/stake status=200
[req] x-message-id=7316daca-b8ec-4563-a855-2839ece2d5b6 path=/api/v1/guides/5b923fec-f1a8-4f4a-95d1-04a6f65a7bc5/stake status=200
[req] x-request-id=1d136262-9dae-4fab-9cb9-f79038ee2bbd path=/api/v1/guides status=200
[req] x-message-id=047afa6a-9dee-4b1a-a9b7-3b5d815bff29 path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
