# B-DSP-003

`cargo test -p traveltrust-api matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.63s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5c4be7fa-f256-4ab2-bc9d-00e11358f809 path=/auth/register status=200
[req] x-message-id=f5b45401-077f-439c-bbed-7e159325fb6a path=/auth/register status=200
[req] x-request-id=fd2f01b5-952b-4f99-908e-a13b39e8b296 path=/auth/register status=200
[req] x-message-id=f360dfb1-9e09-4e8d-8c76-714414427592 path=/auth/register status=200
[req] x-request-id=b4d4fbfe-d377-472d-b58f-789cc48afb0f path=/api/v1/guides status=200
[req] x-message-id=5fdc1a00-7a5b-4071-9e33-c96a49050fae path=/api/v1/guides status=200
[req] x-request-id=b88a1a67-d52a-436b-8103-7e1bc2a022cf path=/api/v1/guides/86b9e53b-7af0-4550-aa07-206fa3797292/stake status=200
[req] x-message-id=cd42a954-c795-4068-8ebf-994f2d5d3285 path=/api/v1/guides/86b9e53b-7af0-4550-aa07-206fa3797292/stake status=200
[req] x-request-id=8d243cea-4935-4ec7-8a4a-e7422213361c path=/api/v1/orders status=200
[req] x-message-id=e5add6cf-7ffd-4838-b976-4b99f6c3804d path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=f08eec68-264d-4e90-9a60-aadb942f1a57 order_id=4fd9ba41-50bd-48ab-8cc6-6671a4608ab5
[req] x-request-id=7ef32364-bdd3-4276-b48b-0e3478c8052f path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5/accept status=200
[req] x-message-id=d9b1bfb3-506f-4ba8-ace8-1b0924aad4f8 path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5/accept status=200
[req] x-request-id=3bb65e90-8510-40af-b06c-c66e87ad893c path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5/mock-pay status=200
[req] x-message-id=8a3d9fa6-fdfe-4aa3-8d8d-1000f6cf627c path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5/mock-pay status=200
[req] x-request-id=97a946b0-6b32-4e3c-a4cc-a5d44a0d4693 path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5 status=200
[req] x-message-id=9624a076-719e-461d-8d1e-4847b7766b12 path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5 status=200
[req] x-request-id=cff059d5-6698-41bf-ac4a-b6ab3bb0b17b path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5/dispute status=200
[req] x-message-id=b35800ea-643f-473d-a7ea-bc2bd4c77c91 path=/api/v1/orders/4fd9ba41-50bd-48ab-8cc6-6671a4608ab5/dispute status=200
[req] x-request-id=31aff275-612e-4ef9-a9c9-9919d36d1818 path=/auth/register status=200
[req] x-message-id=8f3f0ede-8aee-4868-b729-ee3d4f9c161c path=/auth/register status=200
[req] x-request-id=d43c2c18-031d-44b4-961d-c76e3d8a0718 path=/api/v1/disputes/a8bea412-4c5f-412a-a8c9-3e6e5835d068/resolve status=200
[req] x-message-id=e524836c-7c6a-4233-bd5f-0ed638118c1a path=/api/v1/disputes/a8bea412-4c5f-412a-a8c9-3e6e5835d068/resolve status=200
[req] x-request-id=d787c255-3a8b-4b92-9a96-92de909ca266 path=/api/v1/disputes/a8bea412-4c5f-412a-a8c9-3e6e5835d068 status=200
[req] x-message-id=4e7ab7b3-f663-4d1a-bbf4-3e348565d518 path=/api/v1/disputes/a8bea412-4c5f-412a-a8c9-3e6e5835d068 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-003 · seed arbitrator POST …/disputes/:id/resolve → resolved (PG)
