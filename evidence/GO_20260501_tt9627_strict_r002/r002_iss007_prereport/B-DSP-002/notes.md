# B-DSP-002

`cargo test -p traveltrust-api matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg` exit=0

```

running 1 test
test routes::guides_disputes_db_api_tests::matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=37f5961f-7cf3-4ea9-8499-5e140f539c7c path=/api/v1/disputes status=200
[req] x-message-id=be375c67-f232-4d47-a089-c18be2963340 path=/api/v1/disputes status=200
[req] x-request-id=009461bf-b2d4-4a9f-8478-31f2d1e17c11 path=/api/v1/disputes/dcccd213-5f4c-43eb-8226-808dd259086e status=200
[req] x-message-id=3ed63445-1a82-4651-b0ce-e1d613f86930 path=/api/v1/disputes/dcccd213-5f4c-43eb-8226-808dd259086e status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
