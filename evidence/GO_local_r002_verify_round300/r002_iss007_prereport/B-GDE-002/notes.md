# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2985d4e8-ddac-42b4-8d3d-eed2c7feaf50 path=/api/v1/guides status=200
[req] x-message-id=34c0fe68-c537-4f87-96c1-74f2adf1db33 path=/api/v1/guides status=200
[req] x-request-id=09005080-6038-4482-8936-da66de7d2293 path=/api/v1/guides/54bcc6b3-6f8d-4224-9bde-c44a3fe3a7a6/availability status=200
[req] x-message-id=ba3838b2-aa03-4559-a532-853a1697ba81 path=/api/v1/guides/54bcc6b3-6f8d-4224-9bde-c44a3fe3a7a6/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
