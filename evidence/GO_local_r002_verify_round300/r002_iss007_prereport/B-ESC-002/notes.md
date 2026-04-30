# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.34s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=71166c01-0891-44c3-ab1d-bde2740bcdb0 path=/auth/register status=200
[req] x-message-id=9df9fb81-91b8-4ffa-88d3-befae1b7cc60 path=/auth/register status=200
[req] x-request-id=3abf16ef-6244-4be4-9dab-e523bd47d4c3 path=/auth/register status=200
[req] x-message-id=b7249b0f-f023-4d8d-b9f7-bbcac1c9b1a3 path=/auth/register status=200
[req] x-request-id=92b2c7c0-cc1b-4118-a010-0b41b7dc8e1b path=/api/v1/guides status=200
[req] x-message-id=894895ea-81ac-48cb-bfd4-20fc5bec00b3 path=/api/v1/guides status=200
[req] x-request-id=3ec37865-d0de-49a3-a0e9-f2ee558f1fc6 path=/api/v1/guides/79ac85a5-32fc-4eb2-b41e-a499f2185e0d/stake status=200
[req] x-message-id=5a2400d0-2e27-4cab-8662-b1d2e7112ee5 path=/api/v1/guides/79ac85a5-32fc-4eb2-b41e-a499f2185e0d/stake status=200
[req] x-request-id=4f440d68-4683-4a72-a07c-a75874737a7a path=/api/v1/orders status=200
[req] x-message-id=cb8036c9-1831-48a8-ae54-479a983b0b68 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=9220d480-1f36-4b21-b399-dd4217732a97 order_id=3c4aa54b-bf66-425d-a338-f75a58fc332d
[req] x-request-id=9cd2dda3-cf54-4fa3-9b38-b56b147f737d path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d/accept status=200
[req] x-message-id=94ecaf4e-bb3d-47e0-b9d9-da786a7c6204 path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d/accept status=200
[req] x-request-id=bba3b1c0-b784-44ff-b5a7-cc8c1ac99b45 path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d/mock-pay status=200
[req] x-message-id=9c01b1c0-edc5-44da-be56-47ba966b32b9 path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d/mock-pay status=200
[req] x-request-id=a46520ac-1386-4ab3-8966-7bd543c8580d path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d status=200
[req] x-message-id=bb6dd60f-7684-416e-9485-db67022dbafa path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d status=200
[req] x-request-id=e49da18c-93ab-4d2e-9e6a-f85e6b686c4e path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d/confirm-completion status=200
[req] x-message-id=dd8001da-7a22-4068-b726-e12f7a747aee path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d/confirm-completion status=200
[req] x-request-id=97718aaa-f45b-4bcc-a674-ae0275f8a232 path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d status=200
[req] x-message-id=60e75595-0c9e-4fe4-94aa-3bb305909d16 path=/api/v1/orders/3c4aa54b-bf66-425d-a338-f75a58fc332d status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
