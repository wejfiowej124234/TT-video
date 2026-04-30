# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=82420890-de3d-476d-8d3c-672f91a301e1 path=/auth/register status=200
[req] x-message-id=3c3786aa-d81c-4ea6-be7d-082b53719b36 path=/auth/register status=200
[req] x-request-id=d5c53905-2af4-4ce6-bfe9-a9b04bb57267 path=/auth/register status=200
[req] x-message-id=fd940928-3b32-4fd1-82dd-6b2fbbec9be9 path=/auth/register status=200
[req] x-request-id=8d9e9d6b-01b0-43e2-b64c-8e7264958244 path=/api/v1/guides status=200
[req] x-message-id=3fb106da-819b-4317-acfc-2a950cc1c105 path=/api/v1/guides status=200
[req] x-request-id=5cc073af-f081-43bd-a8e8-e2b596a2ba20 path=/api/v1/guides/9f41f68d-561d-46ff-add2-0ca77af33fd8/stake status=200
[req] x-message-id=f10dca83-8225-46a6-a1db-3953808f4193 path=/api/v1/guides/9f41f68d-561d-46ff-add2-0ca77af33fd8/stake status=200
[req] x-request-id=52281205-e235-4399-828b-39a096ae79da path=/api/v1/orders status=200
[req] x-message-id=af406b81-9abf-4f28-b62d-33712eeba863 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=7fe674d4-9adb-4082-8a4c-8888f590a6b9 order_id=4cc82d0e-246d-49ec-8ae3-e06755f6e429
[req] x-request-id=52ee2faf-c2e2-4c16-ae4f-16d60cbd9a32 path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429/accept status=200
[req] x-message-id=dd92381f-bb43-4f6b-b89a-b1b3624444cb path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429/accept status=200
[req] x-request-id=f94e959e-22f4-4b2f-8d21-dddc8a20a816 path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429/mock-pay status=200
[req] x-message-id=7ebab9c7-5f5b-4545-8f04-9fdfb70903dd path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429/mock-pay status=200
[req] x-request-id=3da85c8f-caeb-4695-b596-4a2dbf4ee2f2 path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429 status=200
[req] x-message-id=7b3e1eda-2bcf-4035-a0e2-5a6374fc6175 path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429 status=200
[req] x-request-id=91930f55-5913-41e0-b747-ebf13f3175e2 path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429/dispute status=200
[req] x-message-id=89cd5e14-525e-4871-9da7-aa2cda8e9ff7 path=/api/v1/orders/4cc82d0e-246d-49ec-8ae3-e06755f6e429/dispute status=200
[req] x-request-id=78d1ee87-ff14-4e54-8a27-c833e89f2615 path=/api/v1/disputes status=200
[req] x-message-id=3f59be93-e791-46ee-abdf-89d6432d0daf path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
