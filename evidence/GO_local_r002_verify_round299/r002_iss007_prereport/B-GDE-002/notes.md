# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=7db2e93f-5a82-4aca-a533-2b9d77152a60 path=/api/v1/guides status=200
[req] x-message-id=f80b20c9-e455-4120-8e65-f500510ac2d2 path=/api/v1/guides status=200
[req] x-request-id=50956d84-0cbf-4e03-b19d-200d37a51ee9 path=/api/v1/guides/1b992e58-3f7a-4b3a-bc5b-8e933c16a1d2/availability status=200
[req] x-message-id=bef633e2-8085-4fbf-974e-cce477d2a7fb path=/api/v1/guides/1b992e58-3f7a-4b3a-bc5b-8e933c16a1d2/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
