# B-GDE-003

`cargo test -p traveltrust-api matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.16s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.34s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=64bfb4a8-c7f9-485e-91ba-e143448e9262 path=/api/v1/guides status=200
[req] x-message-id=2341b68e-fb71-401f-b90b-364452727da6 path=/api/v1/guides status=200
[req] x-request-id=fa8c213a-b273-4eb7-a5e1-eade5559526d path=/api/v1/guides/d7ca0146-90ef-4013-b85f-1301bcbe020c/stake status=200
[req] x-message-id=6eb7520a-e5e4-4f2f-b80c-13d23ca79b33 path=/api/v1/guides/d7ca0146-90ef-4013-b85f-1301bcbe020c/stake status=200
[req] x-request-id=de27febc-a63d-45c0-8901-8e9916969b9a path=/api/v1/guides status=200
[req] x-message-id=94fc7c26-c4eb-4fe6-9cad-c6371c38ebd4 path=/api/v1/guides status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-024 · stake then GET guides list includes active guide
