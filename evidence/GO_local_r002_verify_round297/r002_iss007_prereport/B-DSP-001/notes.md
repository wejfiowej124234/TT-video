# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=1890f3bb-47f4-491a-a4cd-8e3b03763e3e path=/auth/register status=200
[req] x-message-id=6052a227-2af5-4ad3-8f1d-b01191f45a31 path=/auth/register status=200
[req] x-request-id=45c3a764-7089-4ee8-8a9b-fd53860f076e path=/auth/register status=200
[req] x-message-id=957073a4-b51d-4d07-bc0e-adb5d503dc72 path=/auth/register status=200
[req] x-request-id=5a211637-0d95-43e9-9fc6-e1499fe80ae9 path=/api/v1/guides status=200
[req] x-message-id=ea79cb3b-5adb-4ddc-9734-9506277c66b6 path=/api/v1/guides status=200
[req] x-request-id=a27bf7f0-370b-41a3-9fd1-f7b82283c052 path=/api/v1/guides/000b23a4-5492-4691-952b-8f9531d8e219/stake status=200
[req] x-message-id=ab949597-fc7a-42e9-ba97-a0795813f625 path=/api/v1/guides/000b23a4-5492-4691-952b-8f9531d8e219/stake status=200
[req] x-request-id=68da365d-4342-4493-9247-7605315adda5 path=/api/v1/orders status=200
[req] x-message-id=28b8c964-5251-46c4-bb49-feab4e8cc4c3 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=eba90207-88c3-4ce5-8f2d-d701dfc39ec6 order_id=32f4a795-aa58-4aaf-9908-b245312109de
[req] x-request-id=6bf9f9a6-f646-41cb-93e5-990849c7d3c7 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de/accept status=200
[req] x-message-id=4af9a851-72d4-4b19-b76f-e25d4e472305 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de/accept status=200
[req] x-request-id=dde21fda-218f-4022-94da-1f09fc035b29 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de/mock-pay status=200
[req] x-message-id=9ad719af-45c8-442b-95af-ffec5ab2f9a0 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de/mock-pay status=200
[req] x-request-id=f91b3579-2dff-45f5-b2cb-0edd335c27ca path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de status=200
[req] x-message-id=fa1b1c4e-8ace-4df8-83fe-da523a8a1207 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de status=200
[req] x-request-id=f244dd9a-73df-4df0-9917-d3f53a915bf2 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de/dispute status=200
[req] x-message-id=35b371d6-066c-4d70-b236-dc3867d14333 path=/api/v1/orders/32f4a795-aa58-4aaf-9908-b245312109de/dispute status=200
[req] x-request-id=7f731e9f-e63c-4689-957f-4f8bb2750bce path=/api/v1/disputes status=200
[req] x-message-id=c9f7f5b6-0a9f-4b91-8b68-97013ae5317c path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
