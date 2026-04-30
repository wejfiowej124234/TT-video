# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=60b19c32-93d8-4252-8666-5a645d2ed4eb path=/api/v1/guides status=200
[req] x-message-id=0bb25c8c-1021-4789-ae5d-9937acf21a76 path=/api/v1/guides status=200
[req] x-request-id=60d5bc61-f591-4eea-a118-ec3fbbb5df96 path=/api/v1/guides/c298ccc0-4379-45b6-87e4-3749285e9a02/availability status=200
[req] x-message-id=e9d351f2-0554-4d05-8e09-c441dbe1f0fe path=/api/v1/guides/c298ccc0-4379-45b6-87e4-3749285e9a02/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
