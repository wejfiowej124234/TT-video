# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=b3ce1336-a303-434e-b83d-4a437cba4f6b path=/api/v1/guides status=200
[req] x-message-id=8ba66db3-1bbd-485d-aeb1-356f01b67bab path=/api/v1/guides status=200
[req] x-request-id=47303d54-7eb0-4dd6-a868-8401ae5ea34a path=/api/v1/guides/c92994d7-f48a-4042-b20a-c3a5b7a92f4e/availability status=200
[req] x-message-id=75013818-2b9b-4b15-ae38-37019308881e path=/api/v1/guides/c92994d7-f48a-4042-b20a-c3a5b7a92f4e/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
