# B-ORD-006

`cargo test -p traveltrust-api matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.08s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=fa8d478c-2b1f-4ae0-98e7-752af44d58a0 path=/auth/register status=200
[req] x-message-id=d16002e2-dc5b-4a1e-82c8-1d68ff33079b path=/auth/register status=200
[req] x-request-id=d2262b6a-caea-44ef-8a78-ab4df0ef5bf6 path=/auth/register status=200
[req] x-message-id=81b1196f-ebe3-461a-a61a-179a9df77fdd path=/auth/register status=200
[req] x-request-id=7a7cb433-56f0-40aa-a014-14b96b82d591 path=/api/v1/guides status=200
[req] x-message-id=2e3fde28-be72-47c5-b6d4-ad9d04b018b0 path=/api/v1/guides status=200
[req] x-request-id=3a85dd92-9096-4b36-8333-7c3bad378e50 path=/api/v1/guides/bcc394da-e014-4fd7-9463-80eeb4b93f2c/stake status=200
[req] x-message-id=c0c19d2d-2fee-4fca-81d4-ba009d0c1287 path=/api/v1/guides/bcc394da-e014-4fd7-9463-80eeb4b93f2c/stake status=200
[req] x-request-id=93279884-d8d2-4da7-9515-91f7bb5c445e path=/api/v1/orders status=200
[req] x-message-id=ebb8b32b-6592-4eb2-bbe5-03b8aea0ec93 path=/api/v1/orders status=200
[req] x-request-id=0e976017-2094-4bd5-8835-1f841377fe2d path=/api/v1/orders/2718590e-1d8d-470b-8311-411a5208ae82/set-escrow-address status=200
[req] x-message-id=43e01add-0c59-49be-82f9-9bc2aab89864 path=/api/v1/orders/2718590e-1d8d-470b-8311-411a5208ae82/set-escrow-address status=200
[req] x-request-id=90533861-c90b-48a6-90b6-017394bdd199 path=/api/v1/orders/2718590e-1d8d-470b-8311-411a5208ae82 status=200
[req] x-message-id=affaed09-616c-478f-af66-3d7a28889b80 path=/api/v1/orders/2718590e-1d8d-470b-8311-411a5208ae82 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-011 · set-escrow-address then GET detail read-back
