# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=578354ec-6985-4de9-9d6b-55cf37922aee path=/auth/register status=200
[req] x-message-id=e22c28b5-2191-42ac-8ea3-63e7733478a9 path=/auth/register status=200
[req] x-request-id=0d516ef1-a2e2-4df7-9e99-13cf8cf048eb path=/auth/register status=200
[req] x-message-id=17bceef9-1601-4e1d-90c9-862d64f1ff30 path=/auth/register status=200
[req] x-request-id=3e0479c6-1ebb-4dc0-b0a8-a03f4c87ad9e path=/api/v1/guides status=200
[req] x-message-id=1abc2a85-674f-4d2c-a496-83a69e39b8ad path=/api/v1/guides status=200
[req] x-request-id=f5b78991-d5bf-41e4-8689-e500372ce7bf path=/api/v1/guides/3ed3d961-b89d-43cd-82c8-f5c63ce68348/stake status=200
[req] x-message-id=f8fab03b-f5b3-408d-8f8b-a5b0c9c128e3 path=/api/v1/guides/3ed3d961-b89d-43cd-82c8-f5c63ce68348/stake status=200
[req] x-request-id=85790c09-4d50-435e-b6ba-0ca9634312b7 path=/api/v1/orders status=200
[req] x-message-id=76e4a9e4-86de-4e04-9c60-0746aa148710 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=1634f806-2982-4563-a228-5d49622671bf order_id=bf2d714f-c40d-46f7-aa3d-a0d8a739870f
[req] x-request-id=13f6d20e-03ea-418a-ba04-5d91ff6f868a path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f/accept status=200
[req] x-message-id=5980a042-001c-451d-b29f-9b41919ce409 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f/accept status=200
[req] x-request-id=6f8d2a5f-8a56-4326-baf2-db3f19940691 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f/mock-pay status=200
[req] x-message-id=d84d0241-3c97-4937-9fc3-c2e03101d447 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f/mock-pay status=200
[req] x-request-id=34a280bb-5de3-4c3c-bbd3-994b93af27e0 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f status=200
[req] x-message-id=2a1727ee-b34d-40be-a6ca-cee88bf0618f path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f status=200
[req] x-request-id=13929e48-1694-4f47-af48-cce63a399b3f path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f/confirm-completion status=200
[req] x-message-id=93426bba-c078-4b8d-8364-023505d439b5 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f/confirm-completion status=200
[req] x-request-id=8679f7b8-ceee-44b3-93ad-25b45d6eb188 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f status=200
[req] x-message-id=5d5e9670-c264-4cc3-bf0c-824ed1d56f76 path=/api/v1/orders/bf2d714f-c40d-46f7-aa3d-a0d8a739870f status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
