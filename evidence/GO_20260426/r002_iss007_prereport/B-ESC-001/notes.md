# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.68s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=0d75a8bc-3eb5-45be-85b4-f00ae2155b26 path=/auth/register status=200
[req] x-message-id=f78ae73b-2ef8-4890-a926-fa8fb35d2b3a path=/auth/register status=200
[req] x-request-id=69c033dd-4d8f-4588-9833-3ca5403224b7 path=/auth/register status=200
[req] x-message-id=b56007c2-f57f-4f7e-9c15-662789a96a82 path=/auth/register status=200
[req] x-request-id=f89bb9f5-a3d7-48c8-9161-eeb007be49d9 path=/api/v1/guides status=200
[req] x-message-id=7e4ed461-a447-468e-bd12-2fcabf469f3d path=/api/v1/guides status=200
[req] x-request-id=43e7a875-3569-4fc3-9435-f93c35f9ff23 path=/api/v1/guides/bf9437a9-4517-4158-9f97-46b8966e76b3/stake status=200
[req] x-message-id=80b69c62-19a8-4e1e-8e63-7a4d0c2d6997 path=/api/v1/guides/bf9437a9-4517-4158-9f97-46b8966e76b3/stake status=200
[req] x-request-id=d132cf32-d014-43d3-a56a-d677724da267 path=/api/v1/orders status=200
[req] x-message-id=91070e8e-63eb-4956-9dd3-b45feba99165 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=8a4e55be-9315-46e8-b52f-1ecda5e65569 order_id=a758401d-7036-4df4-82c0-7f4bd37d4d05
[req] x-request-id=2512f861-5f3b-482d-864a-9dd5bb18054a path=/api/v1/orders/a758401d-7036-4df4-82c0-7f4bd37d4d05/accept status=200
[req] x-message-id=1c344901-7ed7-4d96-8adc-c53c27271a1f path=/api/v1/orders/a758401d-7036-4df4-82c0-7f4bd37d4d05/accept status=200
[req] x-request-id=cf4f3b97-a268-43ec-8845-1f64256cc4b9 path=/api/v1/orders/a758401d-7036-4df4-82c0-7f4bd37d4d05/mock-pay status=200
[req] x-message-id=0006ee02-2aa9-4260-80b6-abdf8bea50ee path=/api/v1/orders/a758401d-7036-4df4-82c0-7f4bd37d4d05/mock-pay status=200
[req] x-request-id=d742b1cd-30d2-44c7-a03f-259ad0938fb0 path=/api/v1/orders/a758401d-7036-4df4-82c0-7f4bd37d4d05 status=200
[req] x-message-id=425f9b40-ef7e-4754-a6a5-9c97549df004 path=/api/v1/orders/a758401d-7036-4df4-82c0-7f4bd37d4d05 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
