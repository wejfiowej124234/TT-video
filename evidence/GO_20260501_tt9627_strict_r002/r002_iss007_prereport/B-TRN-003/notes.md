# B-TRN-003

`cargo test -p traveltrust-api matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=3b36c147-1db4-4dc8-a512-67cef06f6578 path=/auth/register status=200
[req] x-message-id=487c305a-62ab-440d-a435-16a5a56307fb path=/auth/register status=200
[req] x-request-id=f3372c31-96d3-4abb-aec5-f27bc9320d70 path=/auth/register status=200
[req] x-message-id=47d07f6f-501f-4cbf-aa73-6eb24fcb2514 path=/auth/register status=200
[req] x-request-id=1701d07e-f0ec-41e5-9538-e37057ef431d path=/api/v1/guides status=200
[req] x-message-id=92ea378d-c874-4066-a15a-0282901f83d6 path=/api/v1/guides status=200
[req] x-request-id=a41148d7-e30e-4c72-be7d-111a47af2824 path=/api/v1/guides/2f6fa81b-a270-4db2-ba80-af22e4380fd9/stake status=200
[req] x-message-id=20559553-ca8d-47af-bdde-49d3943d16df path=/api/v1/guides/2f6fa81b-a270-4db2-ba80-af22e4380fd9/stake status=200
[req] x-request-id=5712d643-9476-4008-bd83-8a927cf3fbd0 path=/api/v1/orders status=200
[req] x-message-id=ff4d5299-ec34-4e40-8f7b-7f4933a8f38f path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=e93d6154-5d36-4d28-8471-ef790a1fec03 order_id=22058f7a-6b76-4b73-9959-37ad8a5994aa
[req] x-request-id=55816a08-27fc-4500-9d40-bfea06078bff path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa/accept status=200
[req] x-message-id=b2eba148-a9cb-4754-8724-1e034d1d08ec path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa/accept status=200
[req] x-request-id=54e7c29c-86d5-427c-b37c-3de1cd79d478 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa/mock-pay status=200
[req] x-message-id=7c71a6ab-fdfb-4803-b49a-2b3ba37542c3 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa/mock-pay status=200
[req] x-request-id=f7a0a1a3-62a0-4f14-8b50-82cdebd4b814 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa status=200
[req] x-message-id=1a3d5765-1198-4213-b0d0-01a1e47dc6a3 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa status=200
[req] x-request-id=7bd79991-436d-42e4-894f-fd866c072110 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa/dispute status=200
[req] x-message-id=0b199421-f66e-4b62-ae9d-6c6ccf4209f0 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa/dispute status=200
[req] x-request-id=93f15d85-9dc4-406b-949f-c4020f28efb3 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa status=200
[req] x-message-id=92a31c13-6aed-4af3-9f47-60995f1d8ad4 path=/api/v1/orders/22058f7a-6b76-4b73-9959-37ad8a5994aa status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
