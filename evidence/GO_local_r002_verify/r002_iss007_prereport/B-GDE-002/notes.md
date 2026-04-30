# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=708eac6b-41f8-42ee-a1c8-bcd757594eca path=/api/v1/guides status=200
[req] x-message-id=798a7b9f-855a-4875-a5b9-e2a344243449 path=/api/v1/guides status=200
[req] x-request-id=3e8872a9-ec88-47b0-ac12-6f04109987d9 path=/api/v1/guides/13fe1219-b2c6-49bd-831a-5c31fc8d97fa/availability status=200
[req] x-message-id=cd808bf8-12ce-40b2-b223-8ed0f6625088 path=/api/v1/guides/13fe1219-b2c6-49bd-831a-5c31fc8d97fa/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
