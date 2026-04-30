# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b888b32e-b622-4741-83b3-7c9dde4e3a1a path=/api/v1/guides status=200
[req] x-message-id=2969c3c6-9aed-44fd-9e14-819b8aadc88d path=/api/v1/guides status=200
[req] x-request-id=efe62fbf-5a9c-456c-aea6-0484a8004337 path=/api/v1/guides/16c1f008-30ed-4a90-b391-fb0f4a533905/stake status=200
[req] x-message-id=306456f6-3889-4892-9f43-104e74e2768b path=/api/v1/guides/16c1f008-30ed-4a90-b391-fb0f4a533905/stake status=200
[req] x-request-id=65263720-7ebd-46cf-a319-abb27c7f7562 path=/api/v1/guides status=200
[req] x-message-id=b5dca6da-707d-41fb-9eb6-83e559d297e8 path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
