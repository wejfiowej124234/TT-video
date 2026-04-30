# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5fc9a8c2-db63-4d58-b263-580f3a4ea4cd path=/auth/register status=200
[req] x-message-id=81244ab2-f3aa-4392-b23b-28a48dc477da path=/auth/register status=200
[req] x-request-id=03660233-f49d-4b49-a9d1-0d7bb3b51274 path=/auth/register status=200
[req] x-message-id=339273cc-8286-4264-984a-39b11cb6af33 path=/auth/register status=200
[req] x-request-id=5740a187-0b55-4334-9d4e-532d9d8e1b29 path=/api/v1/guides status=200
[req] x-message-id=936fbe4e-f89c-4fea-ab27-982e9568c003 path=/api/v1/guides status=200
[req] x-request-id=27204c7f-967a-4740-9bce-fa94bbe63346 path=/api/v1/guides/048605e0-94c6-4058-9aed-27d39bf233d3/stake status=200
[req] x-message-id=3859e246-473f-4f7b-9188-0fc7612a6c86 path=/api/v1/guides/048605e0-94c6-4058-9aed-27d39bf233d3/stake status=200
[req] x-request-id=3746bc49-ee16-4f8a-9010-f728a4648144 path=/api/v1/orders status=200
[req] x-message-id=1f6e6cf6-3ff8-4d06-8205-c73a29332731 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=d6193ea4-da82-4a81-a593-937e6c28d947 order_id=72b2cf49-78ab-424a-bf2e-a6ed1ab922cd
[req] x-request-id=4a9ccfa8-93f5-43a2-bc26-b40cca671698 path=/api/v1/orders/72b2cf49-78ab-424a-bf2e-a6ed1ab922cd/accept status=200
[req] x-message-id=eab3fd3b-2b03-4a18-9459-13216995bd56 path=/api/v1/orders/72b2cf49-78ab-424a-bf2e-a6ed1ab922cd/accept status=200
[req] x-request-id=2749dd81-fdfa-4f64-a824-b655c4143f41 path=/api/v1/orders/72b2cf49-78ab-424a-bf2e-a6ed1ab922cd/mock-pay status=200
[req] x-message-id=1ac79ce1-f4f1-4b52-bf9e-df8945264d1e path=/api/v1/orders/72b2cf49-78ab-424a-bf2e-a6ed1ab922cd/mock-pay status=200
[req] x-request-id=e4442069-1a17-435e-8235-a72c53fc9ad9 path=/api/v1/orders/72b2cf49-78ab-424a-bf2e-a6ed1ab922cd status=200
[req] x-message-id=5eb30c9c-c139-4c2a-88e8-e7c75af73e95 path=/api/v1/orders/72b2cf49-78ab-424a-bf2e-a6ed1ab922cd status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
