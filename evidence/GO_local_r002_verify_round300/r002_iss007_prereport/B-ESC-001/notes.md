# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.05s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.40s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=91e1c7d7-d133-4b2e-9120-8a68e0dcf18c path=/auth/register status=200
[req] x-message-id=93a03282-faa2-4dc0-8d7d-87f9643fa237 path=/auth/register status=200
[req] x-request-id=ce514e5f-5be7-47fd-84c1-f86d5708ea9b path=/auth/register status=200
[req] x-message-id=649bc1cd-17c3-4b31-8367-25b9c081f890 path=/auth/register status=200
[req] x-request-id=12cc63c5-cd7c-4db5-9d80-97461f501b32 path=/api/v1/guides status=200
[req] x-message-id=c2d63c58-0f0f-4774-a220-718fc9388d87 path=/api/v1/guides status=200
[req] x-request-id=f8ab8747-d7b9-4217-836d-45fc38ad2813 path=/api/v1/guides/1bf712a8-3df2-4bd8-84f8-f47b580abcee/stake status=200
[req] x-message-id=bfe2ce48-c0f4-4c46-b5a8-1f1def003ea0 path=/api/v1/guides/1bf712a8-3df2-4bd8-84f8-f47b580abcee/stake status=200
[req] x-request-id=684217e1-8bab-4b73-ae1d-461b23f331b2 path=/api/v1/orders status=200
[req] x-message-id=34c9a4cb-83cd-430b-b548-f37aa56a62c9 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=c3ec19ee-9d6b-49f2-9fc5-de645eef2878 order_id=38aa3b6c-8bf6-48ae-8d02-126bcc50f00e
[req] x-request-id=be3cac92-3f8d-4057-9d98-2aac15ce820a path=/api/v1/orders/38aa3b6c-8bf6-48ae-8d02-126bcc50f00e/accept status=200
[req] x-message-id=239fb82e-a2b9-4e68-95bb-dc1f252970e0 path=/api/v1/orders/38aa3b6c-8bf6-48ae-8d02-126bcc50f00e/accept status=200
[req] x-request-id=66e14f78-2179-4c33-93ac-f3593d121acc path=/api/v1/orders/38aa3b6c-8bf6-48ae-8d02-126bcc50f00e/mock-pay status=200
[req] x-message-id=7fc1a191-d1d9-480e-adce-9556e20cdb95 path=/api/v1/orders/38aa3b6c-8bf6-48ae-8d02-126bcc50f00e/mock-pay status=200
[req] x-request-id=65848bfe-45ef-44b9-b4df-afc215bae434 path=/api/v1/orders/38aa3b6c-8bf6-48ae-8d02-126bcc50f00e status=200
[req] x-message-id=556b2d8c-cf9a-4d23-a55f-52e30422481e path=/api/v1/orders/38aa3b6c-8bf6-48ae-8d02-126bcc50f00e status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
