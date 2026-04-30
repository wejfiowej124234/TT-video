# B-DSP-002

`cargo test -p traveltrust-api matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3b14c535-033f-4536-a802-7818c95406ca path=/api/v1/disputes status=200
[req] x-message-id=3bba6f34-f260-47da-9b6f-41768593d677 path=/api/v1/disputes status=200
[req] x-request-id=86fd09d8-a4e6-4e02-af89-df2552d5bd57 path=/api/v1/disputes/63148dd2-0f65-4f08-9b22-758eedfb87c9 status=200
[req] x-message-id=65115707-eaac-4bf6-9547-eb12c4bc33f2 path=/api/v1/disputes/63148dd2-0f65-4f08-9b22-758eedfb87c9 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
