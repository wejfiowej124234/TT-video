# B-TRN-003

`cargo test -p traveltrust-api matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.70s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=cd4ab1b4-4f2b-4a3b-866a-7d244b7d4314 path=/auth/register status=200
[req] x-message-id=db7e77d9-e06a-4342-a3fd-23d862c4415b path=/auth/register status=200
[req] x-request-id=30df3334-4b20-43a9-91fc-0c48873b55b5 path=/auth/register status=200
[req] x-message-id=72b05730-4616-4997-82b0-9e55fd09b1a5 path=/auth/register status=200
[req] x-request-id=7ccf43fc-87ab-40a0-9943-16844e2cd27e path=/api/v1/guides status=200
[req] x-message-id=dc1e152c-96f8-4dd4-92a5-fb3f42cb0afa path=/api/v1/guides status=200
[req] x-request-id=cfd99f97-6c39-4b8e-b06e-31ced3b75504 path=/api/v1/guides/d066226d-fda4-4764-b70e-af4ee5df562c/stake status=200
[req] x-message-id=987ff4be-ddd8-4417-9892-fac3a17f5dfe path=/api/v1/guides/d066226d-fda4-4764-b70e-af4ee5df562c/stake status=200
[req] x-request-id=7e0037bc-b1a3-4c5b-ba16-5fb46cb37812 path=/api/v1/orders status=200
[req] x-message-id=7c41443c-9634-4d62-bcaf-206932d88da1 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=ccb2173b-cc36-415f-afc4-0623174b0dd2 order_id=ff31a0e9-63d2-44ae-a3bb-7f3add24674e
[req] x-request-id=7901ea2f-b547-4fd7-a34b-753752c53191 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e/accept status=200
[req] x-message-id=3075c21e-e261-48e0-9db6-7b852a6a96f8 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e/accept status=200
[req] x-request-id=c2c77bc0-54a8-4f5f-8234-c9f39595f757 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e/mock-pay status=200
[req] x-message-id=df9a7191-25ea-4c3b-889c-83484db5f08c path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e/mock-pay status=200
[req] x-request-id=d857fe92-5131-405a-9c52-7eac05668f56 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e status=200
[req] x-message-id=3614f309-ea75-498c-a558-2665edbf654b path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e status=200
[req] x-request-id=1f2023bc-436d-4299-81a6-c1e073ea46a3 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e/dispute status=200
[req] x-message-id=da212855-911b-41dc-9053-d01bfe1addbc path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e/dispute status=200
[req] x-request-id=578146e6-5d2f-4e67-a4ac-45ba4469f497 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e status=200
[req] x-message-id=538797cb-df5c-4fee-9954-55a0d9657414 path=/api/v1/orders/ff31a0e9-63d2-44ae-a3bb-7f3add24674e status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
