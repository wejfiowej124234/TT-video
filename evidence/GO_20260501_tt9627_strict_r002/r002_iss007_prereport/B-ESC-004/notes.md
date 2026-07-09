# B-ESC-004

`cargo test -p traveltrust-api matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=80546d2f-0af0-4b7a-ae51-a656b23ca6e8 path=/auth/register status=200
[req] x-message-id=93eed70d-3d79-4012-9d5c-76d47b182955 path=/auth/register status=200
[req] x-request-id=853119aa-0d75-485b-9b1b-2a9d1a2a01c8 path=/auth/register status=200
[req] x-message-id=02f2c687-e7c6-45b8-84d2-659a0d9b24f5 path=/auth/register status=200
[req] x-request-id=bc9ad23f-5635-4bf1-885d-e31bd8ac686f path=/api/v1/guides status=200
[req] x-message-id=6c9da5b4-a79d-4b1c-aaf9-6c2724e70e57 path=/api/v1/guides status=200
[req] x-request-id=7f689ae4-c14a-42d2-95f3-ab882f85f5b1 path=/api/v1/guides/9415b4da-8878-4b82-abec-3bd61079c040/stake status=200
[req] x-message-id=90a25cb2-1b8c-49b9-ab99-98c3a14de972 path=/api/v1/guides/9415b4da-8878-4b82-abec-3bd61079c040/stake status=200
[req] x-request-id=addeeb1a-9821-412f-9975-bb4f466eea3b path=/api/v1/orders status=200
[req] x-message-id=6fb133a2-a748-4f28-bb4f-5546b3701582 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=62c199a4-bb7e-4616-8bef-dc2edd405e76 order_id=09f9fa28-8092-4081-9e5e-f2e3923ce33d
[req] x-request-id=39b34581-ca87-4b7c-818d-c02014aa585a path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d/accept status=200
[req] x-message-id=03025b9d-e5df-42d3-acd0-d1918dbb99ee path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d/accept status=200
[req] x-request-id=951e3da9-83e6-4338-8df6-9c99b0c721e6 path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d/mock-pay status=200
[req] x-message-id=7c816662-eb93-4f0b-b5b8-8b73c37963e9 path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d/mock-pay status=200
[req] x-request-id=5834b5af-ac4a-43d5-b5c7-3f249f8e93ec path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d status=200
[req] x-message-id=25c7557c-e91c-4631-96c0-dc74d8644dfa path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d status=200
[req] x-request-id=83ee8f92-41b9-45a6-a8d2-71b0046788c8 path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d/chain-sync-status status=200
[req] x-message-id=f75dde43-4518-44eb-b8d5-871e539b8053 path=/api/v1/orders/09f9fa28-8092-4081-9e5e-f2e3923ce33d/chain-sync-status status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
