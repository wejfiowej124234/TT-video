# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=f8c2b3ae-6908-4dca-9ce5-7c90d7b394de path=/auth/register status=200
[req] x-message-id=b9442773-7382-491a-9bce-9d45f2cc3f67 path=/auth/register status=200
[req] x-request-id=f38d8e82-9a76-4c23-83a4-2b0c02608b69 path=/auth/register status=200
[req] x-message-id=83028326-cf8a-4749-b156-d05a877634a0 path=/auth/register status=200
[req] x-request-id=25fef494-c32c-439b-ada0-98e4c8ff106d path=/api/v1/guides status=200
[req] x-message-id=b8a93e67-1c33-4bae-9186-9d5ca3ea212f path=/api/v1/guides status=200
[req] x-request-id=654290ed-bc31-4bd5-b5ee-4728d5b7ad10 path=/api/v1/guides/91ecbe22-c9a0-4e6e-b061-76e33bca37ca/stake status=200
[req] x-message-id=eb612933-e3a3-4393-8362-ce1ec81f4e7c path=/api/v1/guides/91ecbe22-c9a0-4e6e-b061-76e33bca37ca/stake status=200
[req] x-request-id=d7d606cb-5df3-4999-8017-1d9053f6a954 path=/api/v1/orders status=200
[req] x-message-id=4345ab1f-ed7c-40de-b59c-e6584683562a path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=ca06d5af-f806-486a-9f06-98b35465859e order_id=7125eed3-1d48-4f3a-be10-9ecb46d3f5ec
[req] x-request-id=0f1cfc09-29cd-482f-bf89-e67a93cc0de3 path=/api/v1/orders/7125eed3-1d48-4f3a-be10-9ecb46d3f5ec/accept status=200
[req] x-message-id=4858450f-ece1-4f35-866a-1f03637d4edc path=/api/v1/orders/7125eed3-1d48-4f3a-be10-9ecb46d3f5ec/accept status=200
[req] x-request-id=ee91279a-4cb2-456d-8a65-cc2e4fb32d44 path=/api/v1/orders/7125eed3-1d48-4f3a-be10-9ecb46d3f5ec/mock-pay status=200
[req] x-message-id=b86c44f3-3108-42cf-b32b-7ca695e99574 path=/api/v1/orders/7125eed3-1d48-4f3a-be10-9ecb46d3f5ec/mock-pay status=200
[req] x-request-id=84cd5a4a-d721-4d35-ac44-78616f457d76 path=/api/v1/orders/7125eed3-1d48-4f3a-be10-9ecb46d3f5ec status=200
[req] x-message-id=971df30c-28a1-4c77-9807-629a540e01e7 path=/api/v1/orders/7125eed3-1d48-4f3a-be10-9ecb46d3f5ec status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
