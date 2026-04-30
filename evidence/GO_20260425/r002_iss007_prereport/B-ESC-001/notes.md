# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=e9a777e4-0c56-46ff-8241-2e7d0459a9a6 path=/auth/register status=200
[req] x-message-id=93188c42-3d78-4929-bc4a-04422f4e99cd path=/auth/register status=200
[req] x-request-id=0177c8b3-987f-4599-909a-6c85d6f92d81 path=/auth/register status=200
[req] x-message-id=48c89738-ab42-43f2-a9f3-2113e887a9ad path=/auth/register status=200
[req] x-request-id=7c29aef0-7f38-4f94-b3b5-196b542e4c79 path=/api/v1/guides status=200
[req] x-message-id=e1de44d8-8914-4fc0-889f-ca7c12cc84d4 path=/api/v1/guides status=200
[req] x-request-id=6bd3e9f9-b786-4c47-9714-1bc56b636b72 path=/api/v1/guides/421b8c8f-d321-4261-ba11-bc36410efc85/stake status=200
[req] x-message-id=ae79bf9a-ca19-4219-88e8-54fc2a7e3f02 path=/api/v1/guides/421b8c8f-d321-4261-ba11-bc36410efc85/stake status=200
[req] x-request-id=e3137cdd-a0e9-4bb8-9677-f4ba5ef96ad7 path=/api/v1/orders status=200
[req] x-message-id=97dbfb23-1dd3-437a-badc-54eefe5e0060 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=6d7e2f2c-d72c-433e-945b-a784f17f9879 order_id=75e96b58-c71e-4ac7-98f3-975a75122392
[req] x-request-id=06a0215e-27ab-45c1-805d-c6a9c35f840b path=/api/v1/orders/75e96b58-c71e-4ac7-98f3-975a75122392/accept status=200
[req] x-message-id=bdb0a434-90f8-4557-9516-6f59e49a6f19 path=/api/v1/orders/75e96b58-c71e-4ac7-98f3-975a75122392/accept status=200
[req] x-request-id=e2720163-3916-4231-9584-bb0779ea2c91 path=/api/v1/orders/75e96b58-c71e-4ac7-98f3-975a75122392/mock-pay status=200
[req] x-message-id=709501b4-a714-4bab-897e-c2333352b746 path=/api/v1/orders/75e96b58-c71e-4ac7-98f3-975a75122392/mock-pay status=200
[req] x-request-id=3d47c5a3-2c50-4d0f-8793-5e5978dd8e06 path=/api/v1/orders/75e96b58-c71e-4ac7-98f3-975a75122392 status=200
[req] x-message-id=dc904046-76e6-4e72-a450-c36be7829756 path=/api/v1/orders/75e96b58-c71e-4ac7-98f3-975a75122392 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
