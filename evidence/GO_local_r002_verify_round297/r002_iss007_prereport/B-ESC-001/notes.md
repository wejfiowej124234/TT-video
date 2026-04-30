# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=b13908c8-a692-4178-b172-ec05eb6dc764 path=/auth/register status=200
[req] x-message-id=03b4d06e-4047-43f8-9f2e-0a55b2203671 path=/auth/register status=200
[req] x-request-id=92b3a189-80e3-491f-ba9b-7b6d9bc4b608 path=/auth/register status=200
[req] x-message-id=99303113-b9fd-4dd6-8bf6-69ab0a31d852 path=/auth/register status=200
[req] x-request-id=ff6b5424-a88e-41ef-8bb1-d64349b891ae path=/api/v1/guides status=200
[req] x-message-id=7c501543-59af-4387-bec9-398fadfe00c5 path=/api/v1/guides status=200
[req] x-request-id=c6ad976a-78a9-492e-8c79-9ceed7d18f4f path=/api/v1/guides/bdfc014e-a444-460c-8619-f459cf34cd87/stake status=200
[req] x-message-id=86ccff1a-db48-4ae0-8ba1-1545a638ab20 path=/api/v1/guides/bdfc014e-a444-460c-8619-f459cf34cd87/stake status=200
[req] x-request-id=e320f032-3b9f-49df-a5f5-2ab8ee156126 path=/api/v1/orders status=200
[req] x-message-id=5602347d-d78c-4f61-bcdd-58f205b93ef3 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=9f6d6572-31d0-4b69-8f2f-6b85d0ee683b order_id=33cec094-4196-411a-866a-7fc83647181d
[req] x-request-id=03ff0743-e270-4f88-8cdf-1eca41327e3f path=/api/v1/orders/33cec094-4196-411a-866a-7fc83647181d/accept status=200
[req] x-message-id=940ed927-9fce-4ed8-9237-3c25bcc13dee path=/api/v1/orders/33cec094-4196-411a-866a-7fc83647181d/accept status=200
[req] x-request-id=0e39960b-b6dd-4642-974e-480e0c41c8d9 path=/api/v1/orders/33cec094-4196-411a-866a-7fc83647181d/mock-pay status=200
[req] x-message-id=c2ad5c01-c2e3-47d6-a6d2-6c8883d3bba2 path=/api/v1/orders/33cec094-4196-411a-866a-7fc83647181d/mock-pay status=200
[req] x-request-id=9c99fb32-da54-434c-92b7-a9d13a05a1a2 path=/api/v1/orders/33cec094-4196-411a-866a-7fc83647181d status=200
[req] x-message-id=a5fde2bb-b675-4798-bd2e-c40ee5ee3030 path=/api/v1/orders/33cec094-4196-411a-866a-7fc83647181d status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
