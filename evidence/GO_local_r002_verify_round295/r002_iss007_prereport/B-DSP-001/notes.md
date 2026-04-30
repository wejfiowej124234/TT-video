# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=cc86e1d0-f224-4c61-9c09-8694810c8255 path=/auth/register status=200
[req] x-message-id=f507c47b-2f31-4317-a0e0-ffcb057b0836 path=/auth/register status=200
[req] x-request-id=499b3ff3-2e9d-44b7-be51-f09e339e0870 path=/auth/register status=200
[req] x-message-id=27b75030-f044-47b3-8c07-9cf92e957b12 path=/auth/register status=200
[req] x-request-id=be93f91d-5a23-4933-9611-56c6fe4f4985 path=/api/v1/guides status=200
[req] x-message-id=47f41286-a1da-4f58-a428-8384a90cd25b path=/api/v1/guides status=200
[req] x-request-id=5a8351c1-c231-4308-b7a6-625c631b0592 path=/api/v1/guides/e4719b57-e0ba-43b0-82aa-b173ffc50d20/stake status=200
[req] x-message-id=0f9cbb89-aa64-43d1-a544-6efefc0e5957 path=/api/v1/guides/e4719b57-e0ba-43b0-82aa-b173ffc50d20/stake status=200
[req] x-request-id=728cb13e-b560-4024-81ea-b746c9d8275b path=/api/v1/orders status=200
[req] x-message-id=0085ddfb-7634-4c2a-b4d8-94d0bb6d0100 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=6cfd2afd-a6b0-482d-a3ec-c58b421cdcc9 order_id=ff817890-444a-4985-be03-72f55422682f
[req] x-request-id=377ff418-6d46-4a6f-b81f-62b990ead98f path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f/accept status=200
[req] x-message-id=22ae1c3f-066e-4ba8-8ed1-0070638a9e04 path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f/accept status=200
[req] x-request-id=cfc92af2-cf63-4eb9-bb81-4b1abd43e8a8 path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f/mock-pay status=200
[req] x-message-id=f374b978-3575-4fa7-a17f-88d795e5ec3a path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f/mock-pay status=200
[req] x-request-id=5afaa9f9-deaf-4f64-bbec-b16e2344f774 path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f status=200
[req] x-message-id=480fc9f0-41a7-4629-b79a-7396c61334a2 path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f status=200
[req] x-request-id=1810b07d-f23d-4d32-a09a-14db3ddf38ec path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f/dispute status=200
[req] x-message-id=0d1dbe06-5a0e-4820-b8a2-56ec69f83b8a path=/api/v1/orders/ff817890-444a-4985-be03-72f55422682f/dispute status=200
[req] x-request-id=e55c99bf-b10d-48c0-a447-be2c94d284cb path=/api/v1/disputes status=200
[req] x-message-id=8810e921-5305-4bf3-884e-9b345856f32d path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
