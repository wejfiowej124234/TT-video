# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.04s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=67220402-d99b-44ca-8d46-eefb68475dc7 path=/auth/register status=200
[req] x-message-id=f3cd13aa-a0d9-48c0-ad38-4ea031898b8d path=/auth/register status=200
[req] x-request-id=0b18b9ae-cf0b-495c-972b-d5879423d02b path=/auth/register status=200
[req] x-message-id=fa0217c9-d3a1-4dc0-9a8a-5575c20f734a path=/auth/register status=200
[req] x-request-id=528d55b3-b8b7-47a3-977e-57915818faed path=/api/v1/guides status=200
[req] x-message-id=8ea56297-f5b4-4e89-a98d-887a736393d1 path=/api/v1/guides status=200
[req] x-request-id=c0065f4e-67f6-4e31-8ddd-57ffad3b4f6c path=/api/v1/guides/9edfa8c3-1ec4-4095-83ac-b78ca2ef4226/stake status=200
[req] x-message-id=4bfb54c5-286f-4525-9ac4-cdda30af22bf path=/api/v1/guides/9edfa8c3-1ec4-4095-83ac-b78ca2ef4226/stake status=200
[req] x-request-id=8b753610-b260-428e-887e-1fb8cda6a533 path=/api/v1/orders status=200
[req] x-message-id=5ddfa9d1-f643-4123-95ef-ada5982509c6 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=cce3df6e-56e6-4e5e-8e86-f3657649bfab order_id=6e06cb2c-61a3-43f0-9ab8-e43bdbb52092
[req] x-request-id=c823a1ff-b54a-40a8-bc55-109910fbf7e4 path=/api/v1/orders/6e06cb2c-61a3-43f0-9ab8-e43bdbb52092/accept status=200
[req] x-message-id=67b2edc9-ac0f-4985-b91c-2eb92c51e1e6 path=/api/v1/orders/6e06cb2c-61a3-43f0-9ab8-e43bdbb52092/accept status=200
[req] x-request-id=7f036b0e-841e-4785-9a00-a543b47ac626 path=/api/v1/orders/6e06cb2c-61a3-43f0-9ab8-e43bdbb52092/mock-pay status=200
[req] x-message-id=f80c557f-cc60-4ff4-8d34-6d1b50cc4d19 path=/api/v1/orders/6e06cb2c-61a3-43f0-9ab8-e43bdbb52092/mock-pay status=200
[req] x-request-id=e928d422-e82a-4249-a7cb-11213eb894ba path=/api/v1/orders/6e06cb2c-61a3-43f0-9ab8-e43bdbb52092 status=200
[req] x-message-id=b5d2ad0a-1b54-433c-a26a-43d750177bf8 path=/api/v1/orders/6e06cb2c-61a3-43f0-9ab8-e43bdbb52092 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
