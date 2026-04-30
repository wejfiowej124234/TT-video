# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b0535e97-a30f-4b51-afaa-26c172d48f63 path=/auth/register status=200
[req] x-message-id=82751474-9036-45db-8aba-2662a7f52e5c path=/auth/register status=200
[req] x-request-id=c32e0faf-62dc-4054-b970-42f47c8e6811 path=/auth/register status=200
[req] x-message-id=d1602d2c-2205-4bfd-9a8d-183f62c9aec1 path=/auth/register status=200
[req] x-request-id=ea8f2d10-ad2b-4adc-abe4-8f376ba4d328 path=/api/v1/guides status=200
[req] x-message-id=04943a95-b6fc-4896-a4e3-0dbb095222d1 path=/api/v1/guides status=200
[req] x-request-id=0e13583c-2de2-4ea6-ae23-f2f656c2ef5b path=/api/v1/guides/48bd2800-aaa0-45fa-831f-ce7fe905c522/stake status=200
[req] x-message-id=a631ce88-ad65-4172-8fd4-51bb3c174fb4 path=/api/v1/guides/48bd2800-aaa0-45fa-831f-ce7fe905c522/stake status=200
[req] x-request-id=9f92cc6d-e746-4575-806e-4376f6c40a76 path=/api/v1/orders status=200
[req] x-message-id=e9de60f0-c45b-4d9b-8b94-d5f1df857427 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=aa5d74f4-27ab-4fde-9f23-ff813d216bd0 order_id=9224278a-d634-4d24-ab6c-a7c590118774
[req] x-request-id=eef71ebf-bf99-4290-9f4b-7362ae2ccfa0 path=/api/v1/orders/9224278a-d634-4d24-ab6c-a7c590118774/accept status=200
[req] x-message-id=c773f6bd-6adf-46e4-a639-0d043c189510 path=/api/v1/orders/9224278a-d634-4d24-ab6c-a7c590118774/accept status=200
[req] x-request-id=48ebccfb-e5da-4990-8cb0-f8ea60457466 path=/api/v1/orders/9224278a-d634-4d24-ab6c-a7c590118774/mock-pay status=200
[req] x-message-id=ddd01a07-6a51-4c03-86c9-c3b43eeea0fa path=/api/v1/orders/9224278a-d634-4d24-ab6c-a7c590118774/mock-pay status=200
[req] x-request-id=69b8a8c4-828b-4523-85cd-a0f0f445b22d path=/api/v1/orders/9224278a-d634-4d24-ab6c-a7c590118774 status=200
[req] x-message-id=b993e47a-1040-4f8d-ab48-ac18caef9a1b path=/api/v1/orders/9224278a-d634-4d24-ab6c-a7c590118774 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
