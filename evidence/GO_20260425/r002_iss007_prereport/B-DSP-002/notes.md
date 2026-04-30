# B-DSP-002

`cargo test -p traveltrust-api matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=81cd9043-1119-420a-addb-6c9c04502f07 path=/api/v1/disputes status=200
[req] x-message-id=9d66fad0-3f72-4b46-8773-5e3482dc1c29 path=/api/v1/disputes status=200
[req] x-request-id=12bf9a2b-da35-42ea-9986-e6110adad3b0 path=/api/v1/disputes/3b0ba041-ba8a-4ae3-aa88-2d60f0f2b8a6 status=200
[req] x-message-id=bbb54dd3-390f-457d-a6b6-b550d734713f path=/api/v1/disputes/3b0ba041-ba8a-4ae3-aa88-2d60f0f2b8a6 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
