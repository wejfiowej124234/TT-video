# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=1885e2d0-08b1-431e-bc51-6ee270623442 path=/auth/register status=200
[req] x-message-id=4b4af287-ebbd-4dc6-be78-32365a03c433 path=/auth/register status=200
[req] x-request-id=20536a6c-c966-4c24-89aa-035bf1359bd9 path=/auth/register status=200
[req] x-message-id=4c5f031c-7f5e-4fcd-a7f6-03eb4ffb123b path=/auth/register status=200
[req] x-request-id=01ac0eb8-63ce-4990-a118-a79cff438584 path=/api/v1/guides status=200
[req] x-message-id=64caef57-d8df-4120-8e8d-bcd60517e812 path=/api/v1/guides status=200
[req] x-request-id=588f1837-362d-4b9a-a8d4-9bffb94057c5 path=/api/v1/guides/4d57b676-c3f8-45f3-b576-21ff161143fd/stake status=200
[req] x-message-id=9e57e4d5-a927-40d4-a607-7509c11c9363 path=/api/v1/guides/4d57b676-c3f8-45f3-b576-21ff161143fd/stake status=200
[req] x-request-id=6df1a99a-b605-4d3d-997e-fa81666c00e1 path=/api/v1/orders status=200
[req] x-message-id=6ef12ac2-1290-4b74-b04e-546a8593b453 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=9c06137b-2c2b-4336-a89c-e4c77a3b2bb4 order_id=dcbdb501-1fda-447a-98f5-944676718fa0
[req] x-request-id=d8ca8d2d-2ea3-4253-a423-9b855898f34d path=/api/v1/orders/dcbdb501-1fda-447a-98f5-944676718fa0/accept status=200
[req] x-message-id=978e6ac2-cf8b-4d79-9a43-65b87c8c7fe6 path=/api/v1/orders/dcbdb501-1fda-447a-98f5-944676718fa0/accept status=200
[req] x-request-id=5db8b216-fd2c-4c09-ad33-7ae5322a13bd path=/api/v1/orders/dcbdb501-1fda-447a-98f5-944676718fa0/mock-pay status=200
[req] x-message-id=08aafb33-8474-4f32-873f-bed40cba2216 path=/api/v1/orders/dcbdb501-1fda-447a-98f5-944676718fa0/mock-pay status=200
[req] x-request-id=30f5dc79-489a-41c7-84a6-eeb072fa0af2 path=/api/v1/orders/dcbdb501-1fda-447a-98f5-944676718fa0 status=200
[req] x-message-id=6c374bda-78a4-40aa-b93f-cf066270388e path=/api/v1/orders/dcbdb501-1fda-447a-98f5-944676718fa0 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
