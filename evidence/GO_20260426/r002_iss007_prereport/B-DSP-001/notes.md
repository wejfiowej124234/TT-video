# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.71s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=ed36613f-e1bf-4135-8bca-d102788b35c6 path=/auth/register status=200
[req] x-message-id=b8e6b7e9-b5b5-44d2-89c9-836b410a1f12 path=/auth/register status=200
[req] x-request-id=46471aee-f8b0-4cd7-8a04-e46ad7397a91 path=/auth/register status=200
[req] x-message-id=408cd4ed-6fda-4d78-b6e4-4cd9dd7886c9 path=/auth/register status=200
[req] x-request-id=936a3775-cd94-4c15-99b7-56a26502b8ac path=/api/v1/guides status=200
[req] x-message-id=ebc96494-668c-4e87-b007-7b669df9de3d path=/api/v1/guides status=200
[req] x-request-id=b26ecf0b-d7aa-4a93-84c0-de959d40093c path=/api/v1/guides/d274cdfa-2caa-443b-b641-d701555ba62e/stake status=200
[req] x-message-id=507122eb-3615-4783-8935-d385ba535057 path=/api/v1/guides/d274cdfa-2caa-443b-b641-d701555ba62e/stake status=200
[req] x-request-id=5004f047-db47-4136-9f53-dded9dee672e path=/api/v1/orders status=200
[req] x-message-id=7c06fd5c-f88a-4616-b2d5-dc150d939b7b path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=a0184031-9318-41fa-9d65-36e5d404f12c order_id=15f6bbc2-5303-4c63-bdca-4aa37f744407
[req] x-request-id=e391bd11-823c-46ab-9455-841cf6f86074 path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407/accept status=200
[req] x-message-id=0f4ee823-6cac-4d8d-a6b0-93df9c94fe4e path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407/accept status=200
[req] x-request-id=50825994-8ad3-40b9-b12b-e89a9f957855 path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407/mock-pay status=200
[req] x-message-id=ad5cc4a2-4956-47af-8fe8-ac6d988a7328 path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407/mock-pay status=200
[req] x-request-id=d3bdc956-cee2-47d4-b388-4bf169dbea4d path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407 status=200
[req] x-message-id=d606d17d-e5e3-4d72-ae9b-b5fe3cd97086 path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407 status=200
[req] x-request-id=a54f129c-d0ee-4e46-9ffc-c1a4e4b0a16e path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407/dispute status=200
[req] x-message-id=00087c9a-84f6-46e9-b145-c20b29aaf5ec path=/api/v1/orders/15f6bbc2-5303-4c63-bdca-4aa37f744407/dispute status=200
[req] x-request-id=cee684da-9d7f-4bae-821e-5f2371be1e47 path=/api/v1/disputes status=200
[req] x-message-id=f7faeacf-fbac-4de2-8d6f-a8daee57d1e6 path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
