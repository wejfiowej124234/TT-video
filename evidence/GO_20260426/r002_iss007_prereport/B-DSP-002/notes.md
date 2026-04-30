# B-DSP-002

`cargo test -p traveltrust-api matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=1ecfabd9-3f4b-4b7f-8e15-b0dc83c3a399 path=/api/v1/disputes status=200
[req] x-message-id=a42e4bf7-2a5a-47c1-b894-45862a0502a7 path=/api/v1/disputes status=200
[req] x-request-id=8d893bfe-2c4a-4f78-bdb3-c28d13a8aaa6 path=/api/v1/disputes/5a8b24bf-19d1-4f4d-b531-4b418790e439 status=200
[req] x-message-id=7eda51f7-ca80-4f83-8847-670a1a0a5105 path=/api/v1/disputes/5a8b24bf-19d1-4f4d-b531-4b418790e439 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
