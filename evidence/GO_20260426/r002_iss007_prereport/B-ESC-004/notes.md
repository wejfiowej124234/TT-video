# B-ESC-004

`cargo test -p traveltrust-api matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.69s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=dccc30ed-7971-41ca-a711-b67ad698c492 path=/auth/register status=200
[req] x-message-id=4592c30b-bff5-4756-9705-d73787337d6a path=/auth/register status=200
[req] x-request-id=328e54f2-096f-4e42-940e-2c29a11014de path=/auth/register status=200
[req] x-message-id=91417b64-b590-451d-a67c-4a1f1d4a0fe9 path=/auth/register status=200
[req] x-request-id=ec067ae6-aa10-486c-9dea-190d236647ff path=/api/v1/guides status=200
[req] x-message-id=9bf79b62-c83f-4464-b11c-3c299a23be61 path=/api/v1/guides status=200
[req] x-request-id=4efb9b07-ab8d-4c8c-ad60-f8104c95e7be path=/api/v1/guides/f3d24e0d-5d25-4b73-a972-20ba401cf248/stake status=200
[req] x-message-id=733a5f5e-333a-4cdb-a416-c36df167b401 path=/api/v1/guides/f3d24e0d-5d25-4b73-a972-20ba401cf248/stake status=200
[req] x-request-id=62f10cdc-4157-41b9-a358-b7b47bc1bf0a path=/api/v1/orders status=200
[req] x-message-id=230cbf50-464b-4696-ad52-de4f31887654 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=ef93393b-aa5b-40ee-b322-13bb3ba0229a order_id=40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8
[req] x-request-id=e6cd80e6-096b-464b-87bb-897075e093cd path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8/accept status=200
[req] x-message-id=fb6fe4e4-e644-4ff3-8af5-cbcddb51d11b path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8/accept status=200
[req] x-request-id=f511c2cf-16f1-4e80-a9a3-8cfcd758ee62 path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8/mock-pay status=200
[req] x-message-id=32258b73-81d7-4cdf-9caf-bd2d407a8b3d path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8/mock-pay status=200
[req] x-request-id=dd8e2c87-2867-4eae-876c-27ac8ca63130 path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8 status=200
[req] x-message-id=53bd7caf-fa0e-477e-b462-9b7823315938 path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8 status=200
[req] x-request-id=b19b9050-564a-48ce-a1ab-2296cbedef09 path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8/chain-sync-status status=200
[req] x-message-id=e0d7af49-6cea-45ad-a8ba-12e231461298 path=/api/v1/orders/40b6ab49-dfe3-4cf1-94bc-337bc9ab9ea8/chain-sync-status status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
