# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=502d5290-146f-4379-8214-66f42c1d256c path=/api/v1/guides status=200
[req] x-message-id=d0bc9b29-fbbe-4ed7-8fc7-83a4515cde4e path=/api/v1/guides status=200
[req] x-request-id=10341ff8-da5b-4e4d-b5e4-07a3d5263f05 path=/api/v1/guides/48b6e4bc-c8a2-4e41-a413-c54af30cbeed/availability status=200
[req] x-message-id=95038970-6d49-42a5-95d0-01d76c47645d path=/api/v1/guides/48b6e4bc-c8a2-4e41-a413-c54af30cbeed/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
