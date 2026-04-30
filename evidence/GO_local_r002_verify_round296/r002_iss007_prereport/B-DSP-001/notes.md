# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5606fa23-923e-4760-8771-3b39e14f8aed path=/auth/register status=200
[req] x-message-id=9307e193-7f59-4c1b-b778-c23d9dc5d2c9 path=/auth/register status=200
[req] x-request-id=a2bead89-d87f-4af0-b060-45db0156e06d path=/auth/register status=200
[req] x-message-id=1e0a6b73-d6fb-44de-bb76-85a93ee42c5c path=/auth/register status=200
[req] x-request-id=b02d215f-d937-4fe2-b70f-403b50d0685d path=/api/v1/guides status=200
[req] x-message-id=34d4aa4e-85c1-4fc4-8bb5-e7ed91c9e06a path=/api/v1/guides status=200
[req] x-request-id=c0263780-6387-4cc3-9b4c-51a4eb619e83 path=/api/v1/guides/b97f0944-6270-47e3-863e-64fdf94eeb20/stake status=200
[req] x-message-id=e58eae5d-3f29-4f71-9d70-53e11e843187 path=/api/v1/guides/b97f0944-6270-47e3-863e-64fdf94eeb20/stake status=200
[req] x-request-id=0638f49e-ef14-4a85-bf19-52393be99f5c path=/api/v1/orders status=200
[req] x-message-id=e213e7dd-c621-437c-9a27-1eb151486246 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=65748e6e-8136-4e72-857d-b84b5c37888f order_id=95b8a0ee-e85a-4c98-9a04-27b303f6582c
[req] x-request-id=7fc9623e-4e3a-483c-9b2a-1228b745856f path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c/accept status=200
[req] x-message-id=0dd7fed7-1710-4137-bd9e-27f71f7a1590 path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c/accept status=200
[req] x-request-id=d8adb1af-2376-430d-8ae3-660644945221 path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c/mock-pay status=200
[req] x-message-id=04ebda5a-b93f-4f6f-9ee8-1f33d338a9a2 path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c/mock-pay status=200
[req] x-request-id=789e5e81-25d1-4175-95b6-2d5dd58b3b4c path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c status=200
[req] x-message-id=33e3799d-ef53-4ff6-b58c-b480ee6c340f path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c status=200
[req] x-request-id=de34f651-40e4-406d-8ccb-fffca23557bc path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c/dispute status=200
[req] x-message-id=ccf056b9-f2bf-4255-8d2a-8151129779b2 path=/api/v1/orders/95b8a0ee-e85a-4c98-9a04-27b303f6582c/dispute status=200
[req] x-request-id=21232bee-8474-4861-954e-b877de2b96b7 path=/api/v1/disputes status=200
[req] x-message-id=ce2f0eaf-ce3d-4ed4-b718-8f4f50f4f034 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
