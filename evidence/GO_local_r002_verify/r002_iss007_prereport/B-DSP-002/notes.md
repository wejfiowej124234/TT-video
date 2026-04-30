# B-DSP-002

`cargo test -p traveltrust-api matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=1cbe79b2-c0c0-44e0-884b-a9f44d4e91a8 path=/api/v1/disputes status=200
[req] x-message-id=6ecb7fb9-5df7-408d-8cf9-4d4f2872fd16 path=/api/v1/disputes status=200
[req] x-request-id=ef8bcbb0-a387-4f83-baa8-cdc2c7194674 path=/api/v1/disputes/f543952a-94b2-4932-989e-36038da115c8 status=200
[req] x-message-id=1ac7153c-5eba-498d-a894-0d61029b4121 path=/api/v1/disputes/f543952a-94b2-4932-989e-36038da115c8 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
