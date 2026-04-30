# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.66s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=c3849950-8405-4023-8000-b602fa0f6a44 path=/auth/register status=200
[req] x-message-id=0324c543-0e90-4922-85db-75877157240a path=/auth/register status=200
[req] x-request-id=8912b861-bb6c-4d8b-9f98-15436daae728 path=/auth/register status=200
[req] x-message-id=14a8c251-6a4c-4adf-a07c-d475e282f87a path=/auth/register status=200
[req] x-request-id=3c08e478-dfaa-454b-94bc-851860b86592 path=/api/v1/guides status=200
[req] x-message-id=483d39af-f04e-424b-a91e-a8a4d5587aaa path=/api/v1/guides status=200
[req] x-request-id=886e720a-68bf-4cf6-8aa0-0d8249b05f78 path=/api/v1/guides/dcc4605e-18c3-4e36-961d-ede6ecdcae5e/stake status=200
[req] x-message-id=9482b9cd-a03e-4234-bb20-d0e828cf801f path=/api/v1/guides/dcc4605e-18c3-4e36-961d-ede6ecdcae5e/stake status=200
[req] x-request-id=a3212621-fa69-4c12-99c0-608d420c4150 path=/api/v1/orders status=200
[req] x-message-id=963b4d30-10e6-401b-b130-f1be3075b326 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=392b46c1-d163-462d-a89d-f1ac632db9e3 order_id=b86a4632-2223-4d7d-a337-0e5a0b85ab8e
[req] x-request-id=22513254-d48a-4fcf-b70c-8b64d1c8a7de path=/api/v1/orders/b86a4632-2223-4d7d-a337-0e5a0b85ab8e/itinerary status=200
[req] x-message-id=038118c2-1dc2-42ae-91d6-cbc9eedf1033 path=/api/v1/orders/b86a4632-2223-4d7d-a337-0e5a0b85ab8e/itinerary status=200
[req] x-request-id=049ee10c-5fb3-4668-89ba-79e9481e4c4b path=/api/v1/orders/b86a4632-2223-4d7d-a337-0e5a0b85ab8e status=200
[req] x-message-id=554a79cb-48d9-4255-85b9-d9a5e6bbc96b path=/api/v1/orders/b86a4632-2223-4d7d-a337-0e5a0b85ab8e status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
