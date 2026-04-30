# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=58ffafc0-22f0-44a0-83d6-8884af620203 path=/auth/register status=200
[req] x-message-id=73c218d1-6a4a-4f61-b304-43f8e089eff6 path=/auth/register status=200
[req] x-request-id=7c3c3284-a117-474c-8e65-9ad2f62c4cf5 path=/auth/register status=200
[req] x-message-id=12c3e1f2-5c69-4494-af08-5a4b9fc5e5f3 path=/auth/register status=200
[req] x-request-id=4bdd6295-4f78-4ce4-b0ca-e816a50166c0 path=/api/v1/guides status=200
[req] x-message-id=ce9ace13-3ce0-4428-bc09-6af30c445f95 path=/api/v1/guides status=200
[req] x-request-id=19138e24-d6a6-460a-9d37-1643f539bbae path=/api/v1/guides/1eb6cc6f-b287-4da5-af94-fa93c4a2c155/stake status=200
[req] x-message-id=84c0efc2-a895-4b05-acc2-2728ccc1533f path=/api/v1/guides/1eb6cc6f-b287-4da5-af94-fa93c4a2c155/stake status=200
[req] x-request-id=b8ee110f-00ef-4c0b-adde-9a0f9aeb62a2 path=/api/v1/orders status=200
[req] x-message-id=54aff969-bdae-4978-b03f-5723dcf13a9a path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=eb5b85d6-9248-4cf0-8882-3fc32d5e3299 order_id=3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3
[req] x-request-id=abb8bba4-50fd-4608-acc9-c0038fc7297e path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3/accept status=200
[req] x-message-id=fe2ee5e5-7840-4cfa-9e55-2951679ed380 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3/accept status=200
[req] x-request-id=48923b0d-0386-4a3d-a295-d7e154f90233 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3/mock-pay status=200
[req] x-message-id=59e41b8f-088e-4a86-9be2-92152ba2abc6 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3/mock-pay status=200
[req] x-request-id=aedb4908-8cee-4b6c-9600-18762f793a32 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3 status=200
[req] x-message-id=ff6175d0-89a8-49ab-9205-6cd1afcc0be0 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3 status=200
[req] x-request-id=918d56ee-4592-4800-9b9a-5ea042fb3f02 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3/dispute status=200
[req] x-message-id=d8fa99f0-7238-473a-91bd-aafc4359ad62 path=/api/v1/orders/3fa1d3b1-5a83-4bb5-a74f-d45cdf6004d3/dispute status=200
[req] x-request-id=be3571e8-60d6-4114-8d49-c52665301a8d path=/api/v1/disputes status=200
[req] x-message-id=7a32b5fc-f573-499c-ac3f-bd8c72e06c58 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
