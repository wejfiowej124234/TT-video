# B-GDE-002

`cargo test -p traveltrust-api matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=bb4f0dad-ff02-4f10-985f-505d6679d6da path=/api/v1/guides status=200
[req] x-message-id=5d5840a2-0f8d-4f43-9449-afcee7fa94d7 path=/api/v1/guides status=200
[req] x-request-id=c586e73f-7b71-458e-b373-8a27f8d0f68e path=/api/v1/guides/92b7354f-f378-43a0-87b5-07201c5628cc/availability status=200
[req] x-message-id=4a18d1cc-6c75-4301-aea1-c74c49b4eb55 path=/api/v1/guides/92b7354f-f378-43a0-87b5-07201c5628cc/availability status=200

```
E2E: `frontend/e2e/f021-f022-f023-request.spec.ts` — F-023 · POST guide then GET detail and availability
