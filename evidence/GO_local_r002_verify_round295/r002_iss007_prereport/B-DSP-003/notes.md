# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.57s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=cb554f33-1894-4fed-9bdb-58318c967e31 path=/auth/register status=200
[req] x-message-id=640e44dd-183a-4c30-8177-22364b8ed8b7 path=/auth/register status=200
[req] x-request-id=ec937d4f-825a-430d-9e01-63782191310f path=/auth/register status=200
[req] x-message-id=92c92616-58f2-4db3-b595-9f5c4a65070a path=/auth/register status=200
[req] x-request-id=5215064d-f4b0-4f28-9f36-c81679dee02d path=/api/v1/guides status=200
[req] x-message-id=77f33a2f-d92b-4707-a6ed-0b02d4ac96c8 path=/api/v1/guides status=200
[req] x-request-id=65110197-8b38-4d89-a27b-0ac7608c2e4f path=/api/v1/guides/040e2c68-7595-46d7-b86e-44416b3ed229/stake status=200
[req] x-message-id=b38d7a04-3151-44ec-9362-75a8fd85b742 path=/api/v1/guides/040e2c68-7595-46d7-b86e-44416b3ed229/stake status=200
[req] x-request-id=0f3b6bfe-1c1c-4cda-be32-a4a9147fef2a path=/api/v1/orders status=200
[req] x-message-id=923b906c-c20e-453d-9800-4da068f3ba62 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=2a18d401-dfae-4b28-b8b7-f9df5785c5f6 order_id=2dcf3a23-ea09-445b-8717-24949e0b88fe
[req] x-request-id=1b11ca5e-b84d-456d-b0dc-76c7f990c57d path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe/accept status=200
[req] x-message-id=f748d49e-c6fc-4e61-bf0a-89cd2c99717e path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe/accept status=200
[req] x-request-id=7878ecb7-cd8c-4fa6-8fcf-b40b3ea7cc97 path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe/mock-pay status=200
[req] x-message-id=86a78698-5fff-43d4-98d5-2cbc26afd17f path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe/mock-pay status=200
[req] x-request-id=70782e15-7991-450a-8311-fc34b0e33570 path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe status=200
[req] x-message-id=b371874c-a73a-4f52-bf9d-16f0a8f2a512 path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe status=200
[req] x-request-id=8837c959-f9cb-4023-84df-4ce4343e8188 path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe/dispute status=200
[req] x-message-id=7f11a9fc-bb26-4f0b-8544-25317ce77f9e path=/api/v1/orders/2dcf3a23-ea09-445b-8717-24949e0b88fe/dispute status=200
[req] x-request-id=fe81c6e6-ce16-4d2d-bad8-50c7317c0d64 path=/auth/register status=200
[req] x-message-id=0090fe68-f019-4522-a594-e334b1097c32 path=/auth/register status=200
[req] x-request-id=97cb31a7-081b-48e4-8465-64bb401be849 path=/api/v1/disputes/2d01e2f5-7daa-4f4f-83ed-517d174b05f6/resolve status=200
[req] x-message-id=689743b0-25a5-4be5-a27c-93f7625cbf71 path=/api/v1/disputes/2d01e2f5-7daa-4f4f-83ed-517d174b05f6/resolve status=200
[req] x-request-id=2850bbfa-c321-4a0a-9633-f40a066fcf12 path=/api/v1/disputes/2d01e2f5-7daa-4f4f-83ed-517d174b05f6 status=200
[req] x-message-id=4a9cccba-fd3a-46ae-9b02-9ee32ec039e4 path=/api/v1/disputes/2d01e2f5-7daa-4f4f-83ed-517d174b05f6 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
