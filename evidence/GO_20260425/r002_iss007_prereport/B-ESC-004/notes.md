# B-ESC-004

`cargo test -p traveltrust-api matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=dbadeb8c-ca0c-4709-9110-96ae4f1af8d8 path=/auth/register status=200
[req] x-message-id=a02056f8-5894-41ca-a994-53f381c1a3b6 path=/auth/register status=200
[req] x-request-id=f5eb9ce0-f31a-40b6-b05f-5a86bc551c69 path=/auth/register status=200
[req] x-message-id=7f6da704-f9ef-4afc-807a-963d98475ede path=/auth/register status=200
[req] x-request-id=74cc1366-8c6e-4016-b169-25dfc2b64c78 path=/api/v1/guides status=200
[req] x-message-id=a8ed61eb-2d92-44a2-822b-ee71b62caa5f path=/api/v1/guides status=200
[req] x-request-id=e4b67de2-0080-44bf-b6f0-2024d3fc9c06 path=/api/v1/guides/a3fda021-7aaa-4f83-bc69-5fab0215a897/stake status=200
[req] x-message-id=6fc006fb-ecb0-49af-a8d9-5c94358e64bc path=/api/v1/guides/a3fda021-7aaa-4f83-bc69-5fab0215a897/stake status=200
[req] x-request-id=e261ef1d-dc71-44a0-b6c1-2382e679a422 path=/api/v1/orders status=200
[req] x-message-id=60e0c722-2057-4f8e-8a79-fde1b38b2b13 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=4f32bc53-e213-45aa-9c77-a24a937236a5 order_id=1893ee48-7131-4ec0-b49c-35e8407ecebb
[req] x-request-id=616999cb-5f99-4954-b381-93b5a9e2c43c path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb/accept status=200
[req] x-message-id=ae5541b1-9c9a-4383-8bb8-edf8c0c61824 path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb/accept status=200
[req] x-request-id=0d9295e7-3a09-43a6-af85-f5b8afaf6776 path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb/mock-pay status=200
[req] x-message-id=90fcc630-b3e1-4536-bf82-cab6ca604cfa path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb/mock-pay status=200
[req] x-request-id=f6f3a5a7-6e5f-4aca-a58f-79c4d58495a5 path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb status=200
[req] x-message-id=d3f107c9-da6a-42e2-928f-36ea4139b403 path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb status=200
[req] x-request-id=cdf59221-d53a-4ab7-9164-d05a21a7fa4a path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb/chain-sync-status status=200
[req] x-message-id=d246b7ab-9778-415f-91aa-bed083e1523b path=/api/v1/orders/1893ee48-7131-4ec0-b49c-35e8407ecebb/chain-sync-status status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
