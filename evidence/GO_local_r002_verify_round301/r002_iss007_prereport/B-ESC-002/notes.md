# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.03s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b8d6b58b-4959-4625-90a7-3058c17789b3 path=/auth/register status=200
[req] x-message-id=43455e56-d53a-407f-9837-15e915a09685 path=/auth/register status=200
[req] x-request-id=321a2001-9ae6-454c-ae23-8c3940a67fa9 path=/auth/register status=200
[req] x-message-id=9ca57214-753d-4843-bef5-7755fec98261 path=/auth/register status=200
[req] x-request-id=72a147e9-d82b-41d4-b95d-503b96978624 path=/api/v1/guides status=200
[req] x-message-id=0fb8b719-684e-4473-b002-f8a930504d56 path=/api/v1/guides status=200
[req] x-request-id=141acf3e-2a57-40f7-807b-40fffe780953 path=/api/v1/guides/6831fa91-54a2-442c-81c3-934b3f4442ef/stake status=200
[req] x-message-id=62b4bd0c-9f86-4a9b-88d9-934946389ea6 path=/api/v1/guides/6831fa91-54a2-442c-81c3-934b3f4442ef/stake status=200
[req] x-request-id=3b99d33c-d474-4980-8a12-11eaf8bc23e0 path=/api/v1/orders status=200
[req] x-message-id=f43ac954-ec87-442c-9d7c-e36422cb5122 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=85e59568-ebb2-437f-89a5-bf2a29f4e36b order_id=77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19
[req] x-request-id=e48bd1e7-8394-4963-a9a2-e8f55529a567 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19/accept status=200
[req] x-message-id=5c46434c-c9dc-4e88-9181-92deec281077 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19/accept status=200
[req] x-request-id=c7b7474f-fc63-41fe-88d3-88169e14bb35 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19/mock-pay status=200
[req] x-message-id=51719687-828d-4177-a168-a223ed4faf86 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19/mock-pay status=200
[req] x-request-id=326d8092-456c-4fa3-bd43-9566c11eb2dd path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19 status=200
[req] x-message-id=9402cadf-7520-4441-872f-0c67a3bfdfc9 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19 status=200
[req] x-request-id=ce0ec5f8-ddb8-429d-aa71-cf60d241d6ad path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19/confirm-completion status=200
[req] x-message-id=114d31e5-60d9-4913-b47e-8b6e103610f8 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19/confirm-completion status=200
[req] x-request-id=27392d6b-6bb7-416f-9dca-dc3593364dae path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19 status=200
[req] x-message-id=0cf849ca-ef16-45d5-b8a6-17e573938ab0 path=/api/v1/orders/77a2daa1-afeb-43c6-99ad-1ba4f2ea2f19 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
